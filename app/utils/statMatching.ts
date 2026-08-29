// Turning OCR lines into stats, using the item as the vocabulary.
//
// The old matcher compared each line against all 37 stats in the game with
// exact string equality, so one bad glyph dropped a line entirely and
// "Dommages" competed with "Dommages Eau" on every capture. But by the time a
// screenshot is pasted we already know which item is open, and therefore which
// handful of lines it can roll and what values each one allows. Matching
// against that short list — with tolerance for misread characters, and with
// each stat claimable only once — is a far easier problem than reading the text
// correctly in the first place.

import {
  normalizeLabelForStatKey,
  specialMageStatKeys,
  statsOcrDefs,
} from './itemStats'

export interface CandidateLine {
  statKey: string
  label: string
  /** Roll bounds when known. Absent for the global-catalogue fallback. */
  min?: number
  max?: number
  suffix?: string
}

export interface MatchedStat {
  key: string
  label: string
  value: number | null
  suffix: string
  rangeText: string
  raw: string
  /** 0..1. How confident the match is — surfaced so the UI can flag weak ones. */
  confidence: number
  /** Whether this came from the item's own lines or the global catalogue. */
  source: 'expected' | 'catalogue'
}

export interface UnmatchedLine {
  raw: string
  /** Best candidate considered, for the "did you mean" affordance. */
  bestGuessKey: string
  bestScore: number
}

export interface MatchResult {
  entries: MatchedStat[]
  unmatched: UnmatchedLine[]
}

/**
 * Accept thresholds.
 *
 * The item's own lines are a closed set of ~5 known strings, so a low bar is
 * safe there — there is almost nothing to be confused with. The global
 * catalogue is 37 entries with overlapping prefixes, so it needs a much higher
 * bar or it will cheerfully turn noise into a stat.
 */
export const EXPECTED_ACCEPT_THRESHOLD = 0.55
export const CATALOGUE_ACCEPT_THRESHOLD = 0.8

/**
 * Damerau–Levenshtein distance (with transposition), which matters because the
 * common OCR failures are single-character substitutions and swapped adjacent
 * characters, not insertions of whole words.
 */
export const editDistance = (a: string, b: string): number => {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const rows: number[][] = []
  for (let i = 0; i <= a.length; i += 1) rows.push(new Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i += 1) rows[i]![0] = i
  for (let j = 0; j <= b.length; j += 1) rows[0]![j] = j

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let best = Math.min(
        rows[i - 1]![j]! + 1,
        rows[i]![j - 1]! + 1,
        rows[i - 1]![j - 1]! + cost,
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, rows[i - 2]![j - 2]! + cost)
      }
      rows[i]![j] = best
    }
  }

  return rows[a.length]![b.length]!
}

const tokens = (value: string) => value.split(' ').filter(Boolean)

/**
 * Tolerance for calling two words the same, scaled by length.
 *
 * Short tokens get none: `pa` and `pm` are one edit apart but are different
 * stats, and treating them as interchangeable let "1 PA" be claimed by PM.
 */
const tokensMatch = (a: string, b: string): boolean => {
  if (a === b) return true
  if (Math.min(a.length, b.length) <= 3) return false
  return editDistance(a, b) <= (Math.min(a.length, b.length) >= 7 ? 2 : 1)
}

/**
 * Similarity compares names, so unit markers are not part of the name.
 *
 * Digits glued to letters are split first: tesseract routinely reads "1 PA" as
 * "1PA", and `normalizeLabelForStatKey` only strips numbers that stand alone,
 * so the stat name would otherwise arrive as "1pa" and match nothing at all.
 */
const normalizeForSimilarity = (value: string) =>
  // The bracketed range is not part of the name. Left in, "[11 à 15]" survives
  // normalization as a stray "a" token, which dragged a perfect
  // "Résistance Critiques" match down to 0.75 and under the accept threshold.
  normalizeLabelForStatKey(splitLeadingValue(value).replace(/\[[^\]]*\]/g, ' '))
    .replace(/[%+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Separates a leading number from the stat name it is glued to.
 *
 * Anchored to the start of a token on purpose: a digit *inside* a word is a
 * misread character ("Inv0cation") and splitting there would break the word in
 * two, which is worse than the misread it came from.
 */
export const splitLeadingValue = (value: string) =>
  value.replace(/(^|\s)(-?\d+)([A-Za-zÀ-ÿ])/g, '$1$2 $3')

/**
 * Similarity in 0..1 over normalized labels.
 *
 * Edit distance alone is not enough: "dommages" against "dommages eau" scores
 * well simply by being a prefix, which is exactly the confusion being fixed. So
 * unmatched *whole words* on either side are penalised — a line that says "eau"
 * and a candidate that doesn't must not look like a near-perfect match.
 */
export const similarity = (a: string, b: string): number => {
  const left = normalizeForSimilarity(a)
  const right = normalizeForSimilarity(b)
  if (!left || !right) return 0
  if (left === right) return 1

  const distance = editDistance(left, right)
  const charScore = 1 - distance / Math.max(left.length, right.length)

  const leftTokens = tokens(left)
  const rightTokens = tokens(right)
  const shared = leftTokens.filter((token) =>
    rightTokens.some((other) => tokensMatch(token, other)))
  const tokenScore = shared.length / Math.max(leftTokens.length, rightTokens.length)

  // Weighted toward tokens, because a missing qualifier word ("eau", "critiques",
  // "esquive") changes which stat this is, while a mangled character does not.
  return Math.max(0, charScore * 0.4 + tokenScore * 0.6)
}

/** Numbers on the line, excluding anything inside a `[11 à 20]` range span. */
export const extractValues = (line: string): number[] => {
  const withoutRanges = line.replace(/\[[^\]]*\]/g, ' ')
  return (withoutRanges.match(/-?\d+/g) || []).map(Number).filter(Number.isFinite)
}

export const extractRangeText = (line: string): string =>
  line.match(/\[[^\]]+\]/)?.[0] || ''

/**
 * Picks the rolled value from a line.
 *
 * Previously this was the first number on the line, which a leftover icon digit
 * or a leading range span was enough to break. When the candidate's bounds are
 * known, prefer a number that could actually be this roll — overmage can exceed
 * max, so the upper bound is generous, but nothing below min is plausible.
 */
export const pickValue = (line: string, candidate: CandidateLine): number | null => {
  const values = extractValues(line)
  if (!values.length) return null

  if (candidate.min === undefined || candidate.max === undefined) return values[0]!

  const plausible = values.filter((value) =>
    value >= candidate.min! && value <= Math.max(candidate.max!, candidate.min!) * 2 + 10)
  if (plausible.length) return plausible[0]!

  return values[0]!
}

/** How well a value fits the candidate's bounds, in 0..1. */
const valuePlausibility = (line: string, candidate: CandidateLine): number => {
  if (candidate.min === undefined || candidate.max === undefined) return 0.5
  const values = extractValues(line)
  if (!values.length) return 0.5

  const inRange = values.some((value) => value >= candidate.min! && value <= candidate.max!)
  if (inRange) return 1
  // Overmage sits above max and is legitimate; below min never is.
  const overmaged = values.some((value) => value > candidate.max!)
  return overmaged ? 0.8 : 0.2
}

const suffixAgreement = (line: string, candidate: CandidateLine): number => {
  const lineHasPercent = /%/.test(line)
  const candidateHasPercent = candidate.suffix === '%'
  if (lineHasPercent === candidateHasPercent) return 1
  return 0.6
}

/**
 * Combined score for pairing one OCR line with one candidate stat.
 *
 * Label similarity dominates; the value and suffix terms act as tie-breakers
 * that quietly resolve the cases similarity can't — two stats with near-identical
 * names but disjoint ranges are told apart by the number on the line.
 */
export const scoreCandidate = (line: string, candidate: CandidateLine): number => {
  const label = similarity(line, candidate.label)
  // A stat whose name is a substring of another's needs the qualifier to be
  // present, so aliases only ever raise the score, never rescue a missing word.
  const def = statsOcrDefs.find((entry) => entry.key === candidate.statKey)
  const aliasBest = def
    ? Math.max(...[def.label, ...def.aliases].map((alias) => similarity(line, alias)))
    : 0
  const labelScore = Math.max(label, aliasBest)

  return labelScore * 0.75
    + valuePlausibility(line, candidate) * 0.15
    + suffixAgreement(line, candidate) * 0.1
}

const rangeTextFor = (candidate: CandidateLine, line: string): string => {
  if (candidate.min !== undefined && candidate.max !== undefined) {
    return candidate.min === candidate.max
      ? `[${candidate.max}]`
      : `[${candidate.min} à ${candidate.max}]`
  }
  return extractRangeText(line)
}

const toMatch = (
  line: string,
  candidate: CandidateLine,
  confidence: number,
  source: MatchedStat['source'],
): MatchedStat => {
  const def = statsOcrDefs.find((entry) => entry.key === candidate.statKey)
  const value = pickValue(line, candidate)

  return {
    key: candidate.statKey,
    label: candidate.label,
    value: value === null && def?.binary ? 1 : value,
    suffix: candidate.suffix ?? def?.suffix ?? '',
    rangeText: rangeTextFor(candidate, line),
    raw: line,
    confidence,
    source,
  }
}

/** The whole stat catalogue as fallback candidates, with no bounds to lean on. */
export const catalogueCandidates = (): CandidateLine[] =>
  statsOcrDefs.map((def) => ({
    statKey: def.key,
    label: def.label,
    suffix: def.suffix,
  }))

/**
 * Assigns OCR lines to stats, one stat per line and one line per stat.
 *
 * Exclusivity is the part that structurally fixes the reported confusion: with
 * both "Dommages" and "Dommages Eau" on an item, whichever line fits one of
 * them best takes it, and the other is pushed to its next-best candidate rather
 * than both collapsing onto the same stat.
 *
 * Lines the item cannot roll still get a shot at the global catalogue, at a
 * stricter threshold — an exo or mage line is real and must not be discarded
 * just because the base item doesn't have it.
 */
export const matchStatLines = (
  lines: string[],
  expectedLines: CandidateLine[],
): MatchResult => {
  const entries: MatchedStat[] = []
  const unmatched: UnmatchedLine[] = []

  const pairs: Array<{ lineIndex: number; candidate: CandidateLine; score: number }> = []
  lines.forEach((line, lineIndex) => {
    expectedLines.forEach((candidate) => {
      pairs.push({ lineIndex, candidate, score: scoreCandidate(line, candidate) })
    })
  })
  pairs.sort((a, b) => b.score - a.score)

  const claimedLines = new Set<number>()
  const claimedStats = new Set<string>()

  for (const pair of pairs) {
    if (pair.score < EXPECTED_ACCEPT_THRESHOLD) break
    if (claimedLines.has(pair.lineIndex)) continue
    if (claimedStats.has(pair.candidate.statKey)) continue

    claimedLines.add(pair.lineIndex)
    claimedStats.add(pair.candidate.statKey)
    entries.push(toMatch(lines[pair.lineIndex]!, pair.candidate, pair.score, 'expected'))
  }

  // Short names lose everything to one bad character: "1 PM [1]" read as
  // "1FM 1]" leaves "fm", which scores far too low to match "pm" and drops a
  // stat the item plainly has. Rescuing it is only safe when the item could not
  // roll anything else it might have been - PA, PM and PO are all one edit
  // apart, so a guess between them would be a coin toss.
  lines.forEach((line, lineIndex) => {
    if (claimedLines.has(lineIndex)) return

    const value = pickValue(line, { statKey: '', label: '' })
    if (value === null) return

    const observed = normalizeLabelForStatKey(splitLeadingValue(line).replace(/\[[^\]]*\]/g, ' '))
      .replace(/[%+]/g, ' ')
      .trim()
    if (!observed || observed.length > 3) return

    // Never rescue something that is already a stat name in its own right. A
    // correctly-read "1 PA" is one edit from PM, and hijacking it would turn a
    // real exo into someone else's stat - far worse than the missing line the
    // rescue exists to recover.
    const isKnownStat = statsOcrDefs.some((def) =>
      [def.label, ...def.aliases].some((alias) => normalizeLabelForStatKey(alias) === observed))
    if (isKnownStat) return

    const near = expectedLines.filter((candidate) => {
      if (claimedStats.has(candidate.statKey)) return false
      const label = normalizeLabelForStatKey(candidate.label)
      return label.length <= 3 && editDistance(observed, label) === 1
    })

    // Exactly one possibility, or it stays unread.
    if (near.length !== 1) return

    const candidate = near[0]!
    const fits = candidate.min === undefined || candidate.max === undefined
      || (value >= candidate.min && value <= Math.max(candidate.max, candidate.min) * 2 + 10)
    if (!fits) return

    claimedLines.add(lineIndex)
    claimedStats.add(candidate.statKey)
    entries.push(toMatch(line, candidate, EXPECTED_ACCEPT_THRESHOLD, 'expected'))
  })

  // Whatever the item's own lines couldn't explain: exos, mage lines, or noise.
  const catalogue = catalogueCandidates()
  lines.forEach((line, lineIndex) => {
    if (claimedLines.has(lineIndex)) return

    let best: { candidate: CandidateLine; score: number } | null = null
    for (const candidate of catalogue) {
      if (claimedStats.has(candidate.statKey)) continue
      const score = scoreCandidate(line, candidate)
      if (!best || score > best.score) best = { candidate, score }
    }

    if (best && best.score >= CATALOGUE_ACCEPT_THRESHOLD) {
      claimedStats.add(best.candidate.statKey)
      entries.push(toMatch(line, best.candidate, best.score, 'catalogue'))
      return
    }

    unmatched.push({
      raw: line,
      bestGuessKey: best?.candidate.statKey || '',
      bestScore: best?.score ?? 0,
    })
  })

  // Back into reading order, so the list mirrors the tooltip it came from.
  entries.sort((a, b) => lines.indexOf(a.raw) - lines.indexOf(b.raw))

  return { entries, unmatched }
}

/** Stats that read as mage/exo lines — used by the UI to flag a surprise roll. */
export const isSpecialMageKey = (statKey: string) => specialMageStatKeys.has(statKey)
