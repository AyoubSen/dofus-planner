// Rune yield for brisage: how many runes an item produces when broken.
//
// This is the piece the brisage workflow was missing. `brisageOpportunities.ts`
// consumes `ExpectedRuneOutput[]`, but nothing ever produced them — they were
// typed in by hand per candidate, which is why no cross-item brisage screening
// was possible.
//
// Breaking is deterministic given the item, its rolled stats and the server's
// current coefficient, so this needs no market data at all. What it does need
// is a correct poids table, and ours is NOT verified against the live client
// (see app/data/runePoids.json). Every result therefore carries a `verified`
// flag, and callers must not present unverified numbers as authoritative.
//
// Structure vs numbers: the shape of the formula is the durable part. The
// magnitudes come from a data file and can be refitted from real break
// observations with `calibratePoids` — that is the intended path to trust, not
// editing constants by hand.

import runesData from '../../data/runes.json'
import runePoidsData from '../../data/runePoids.json'

export type RuneTier = 'ga' | 'pa' | 'ra'
export type PoidsConfidence = 'low' | 'medium' | 'high'

export interface RuneRef {
  runeId: number
  runeName: string
  tier: RuneTier
}

export interface RuneFamily {
  family: string
  tiers: Partial<Record<RuneTier, RuneRef>>
}

export interface StatPoidsEntry {
  family: string
  poidsPerPoint: number
  confidence: PoidsConfidence
}

export interface BreakStatLine {
  /** Stat key from `app/utils/itemStats.ts`. */
  key: string
  value: number
}

export interface RuneYieldOptions {
  /** Taux de brisage in percent, as shown in the client. 100 = neutral. */
  coefficientPercent?: number
  /** Stat key to focus on, or null/undefined for an unfocused break. */
  focusStatKey?: string | null
  /**
   * Fraction of the non-focused poids redirected into the focused stat.
   * UNVERIFIED. Focus also loses weight overall, which is why this is below 1.
   */
  focusEfficiency?: number
  /** Item level. Used by `levelFactor`. */
  itemLevel?: number
  /** Override the level scaling. Exposed because the default is unverified. */
  levelFactor?: (itemLevel: number) => number
  /** Override the poids table, e.g. with the output of `calibratePoids`. */
  poidsOverrides?: Record<string, number>
}

export interface RuneYieldLine {
  statKey: string
  statValue: number
  /** Total poids this stat line contributed, after focus redistribution. */
  poids: number
  family: string
  /** Ga-tier rune equivalents, before rounding to whole runes. */
  gaEquivalent: number
  /** Whole Ga runes guaranteed. */
  guaranteed: number
  /** Probability of one additional Ga rune, from the fractional remainder. */
  fractionalChance: number
  /** `guaranteed + fractionalChance`, the expected count. */
  expected: number
  runes: Partial<Record<RuneTier, RuneRef>>
  confidence: PoidsConfidence
}

export interface RuneYieldResult {
  lines: RuneYieldLine[]
  /** Stat keys present on the item that have no entry in the poids table. */
  unmappedStatKeys: string[]
  /** False whenever the poids table is unverified. Never present as fact. */
  verified: boolean
  poidsTableVersion: string
  totalPoids: number
  focusStatKey: string | null
}

export interface TierPlan {
  ra: number
  pa: number
  ga: number
}

const DEFAULTS = {
  coefficientPercent: 100,
  focusEfficiency: 0.5,
  itemLevel: 1,
} as const

const num = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const TIER_PREFIX: Record<string, RuneTier> = { ga: 'ga', pa: 'pa', ra: 'ra' }

/**
 * Group `runes.json` into families by tier. Rune ids live only in runes.json;
 * the poids table refers to families by name so the two never drift apart.
 */
export const buildRuneFamilies = (
  runes: Array<{ id: number, name: string }> = runesData as Array<{ id: number, name: string }>,
): Map<string, RuneFamily> => {
  const families = new Map<string, RuneFamily>()
  for (const rune of runes) {
    const match = /^Rune (?:(Ga|Pa|Ra) )?(.+)$/.exec(rune.name)
    if (!match) continue
    const tier = TIER_PREFIX[(match[1] ?? 'ga').toLowerCase()]!
    const family = match[2]!
    const entry = families.get(family) ?? { family, tiers: {} }
    entry.tiers[tier] = { runeId: rune.id, runeName: rune.name, tier }
    families.set(family, entry)
  }
  return families
}

export const runeFamilies = buildRuneFamilies()

export const tierMultipliers = (runePoidsData as any).tierMultipliers as Record<RuneTier, number>

export const statPoidsTable = (runePoidsData as any).stats as Record<string, StatPoidsEntry>

export const poidsTableVersion = (runePoidsData as any).version as string

export const poidsTableVerified = Boolean((runePoidsData as any).verified)

/**
 * Level scaling of rune output. UNVERIFIED — the default is deliberately the
 * identity so it cannot silently fake precision we do not have. Pass a real
 * `levelFactor` once a calibration run establishes one.
 */
export const defaultLevelFactor = (_itemLevel: number): number => 1

/**
 * Poids each stat line contributes, before any focus redistribution.
 */
export const linePoids = (
  line: BreakStatLine,
  poidsOverrides: Record<string, number> = {},
): number => {
  const entry = statPoidsTable[line.key]
  if (!entry) return 0
  const perPoint = poidsOverrides[line.key] ?? entry.poidsPerPoint
  return num(line.value) * num(perPoint)
}

/**
 * Redistribute poids for a focused break: the focused stat keeps its own poids
 * and absorbs `focusEfficiency` of everything else; the rest yield nothing.
 *
 * Focus is therefore not free — total poids drops unless `focusEfficiency` is
 * 1 — but it concentrates output into one rune, which can be worth more if that
 * rune has a higher value per poids, and consumes fewer selling slots.
 */
export const applyFocus = (
  poidsByStat: Map<string, number>,
  focusStatKey: string | null | undefined,
  focusEfficiency: number,
): Map<string, number> => {
  if (!focusStatKey || !poidsByStat.has(focusStatKey)) return poidsByStat
  const focused = new Map<string, number>()
  let redirected = 0
  for (const [key, poids] of poidsByStat) {
    if (key === focusStatKey) continue
    redirected += poids
  }
  focused.set(focusStatKey, (poidsByStat.get(focusStatKey) ?? 0) + redirected * focusEfficiency)
  return focused
}

/**
 * Expected rune output for one item.
 *
 * Fractional runes are reported as a probability rather than rounded away: a
 * line yielding 4.3 runes is 4 guaranteed plus a 30% chance of a fifth, and
 * over a batch that fraction is real value. Rounding it off systematically
 * understates yield.
 */
export const computeRuneYield = (
  statLines: BreakStatLine[],
  options: RuneYieldOptions = {},
): RuneYieldResult => {
  const coefficientPercent = options.coefficientPercent ?? DEFAULTS.coefficientPercent
  const focusEfficiency = options.focusEfficiency ?? DEFAULTS.focusEfficiency
  const itemLevel = options.itemLevel ?? DEFAULTS.itemLevel
  const levelFactor = options.levelFactor ?? defaultLevelFactor
  const poidsOverrides = options.poidsOverrides ?? {}
  const focusStatKey = options.focusStatKey ?? null

  const unmappedStatKeys: string[] = []
  const poidsByStat = new Map<string, number>()
  const valueByStat = new Map<string, number>()

  for (const line of statLines) {
    if (!statPoidsTable[line.key]) {
      if (num(line.value) !== 0) unmappedStatKeys.push(line.key)
      continue
    }
    const poids = linePoids(line, poidsOverrides)
    if (poids <= 0) continue
    poidsByStat.set(line.key, (poidsByStat.get(line.key) ?? 0) + poids)
    valueByStat.set(line.key, (valueByStat.get(line.key) ?? 0) + num(line.value))
  }

  const distributed = applyFocus(poidsByStat, focusStatKey, focusEfficiency)
  const scale = (coefficientPercent / 100) * levelFactor(itemLevel)

  const lines: RuneYieldLine[] = []
  let totalPoids = 0

  for (const [statKey, poids] of distributed) {
    const entry = statPoidsTable[statKey]!
    const family = runeFamilies.get(entry.family)
    const gaEquivalent = poids * scale
    const guaranteed = Math.floor(gaEquivalent)
    const fractionalChance = gaEquivalent - guaranteed
    totalPoids += poids
    lines.push({
      statKey,
      statValue: valueByStat.get(statKey) ?? 0,
      poids,
      family: entry.family,
      gaEquivalent,
      guaranteed,
      fractionalChance,
      expected: gaEquivalent,
      runes: family?.tiers ?? {},
      confidence: entry.confidence,
    })
  }

  lines.sort((a, b) => b.gaEquivalent - a.gaEquivalent)

  return {
    lines,
    unmappedStatKeys,
    verified: poidsTableVerified,
    poidsTableVersion,
    totalPoids,
    focusStatKey,
  }
}

/**
 * Split a Ga-equivalent count into whole Ra/Pa/Ga runes.
 *
 * Converting up is not automatically good: it trades conversion loss for fewer
 * active listings. Slots are consumed per listing, not per rune type, so the
 * caller decides using the slot shadow price — this function only reports what
 * each plan would look like.
 */
export const planTiers = (gaEquivalent: number): TierPlan => {
  const ra = tierMultipliers.ra
  const pa = tierMultipliers.pa
  let remaining = Math.floor(gaEquivalent)
  const raCount = Math.floor(remaining / ra)
  remaining -= raCount * ra
  const paCount = Math.floor(remaining / pa)
  remaining -= paCount * pa
  return { ra: raCount, pa: paCount, ga: remaining }
}

/**
 * Convert a yield result into the `ExpectedRuneOutput[]` shape that
 * `brisageOpportunities.deriveEstimatedRuneValue` already consumes, so the
 * existing pricing path keeps working and simply stops needing hand entry.
 */
export const toExpectedRuneOutputs = (
  result: RuneYieldResult,
  tier: RuneTier = 'ga',
): Array<{ runeName: string, runeId: number | null, quantity: number }> =>
  result.lines.flatMap((line) => {
    const ref = line.runes[tier] ?? line.runes.ga
    if (!ref) return []
    const divisor = tierMultipliers[ref.tier] ?? 1
    return [{
      runeName: ref.runeName,
      runeId: ref.runeId,
      quantity: line.gaEquivalent / divisor,
    }]
  })

/**
 * `breakEvenCoefficient = 100 x completeCost / runeValueAt100Percent`.
 *
 * The coefficient at which breaking exactly repays the complete cost of
 * acquiring the item — including gathered material at its alternative sale
 * value, since gathered input is not free. Above this, breaking pays; below it,
 * sell the item or the materials instead.
 *
 * Returns null when rune value is zero, because "infinite" is not a number a
 * caller should be allowed to compare against a threshold by accident.
 */
export const breakEvenCoefficient = (
  completeCost: number,
  runeValueAt100Percent: number,
): number | null => {
  const value = num(runeValueAt100Percent)
  if (value <= 0) return null
  return (100 * num(completeCost)) / value
}

export interface BreakObservation {
  statLines: BreakStatLine[]
  coefficientPercent: number
  itemLevel?: number
  focusStatKey?: string | null
  /** Whole runes actually obtained, in Ga equivalents, keyed by stat key. */
  observedGaEquivalent: Record<string, number>
}

export interface CalibrationResult {
  poidsPerPoint: Record<string, number>
  sampleCount: Record<string, number>
  /** Relative spread of the per-observation estimates, per stat. */
  dispersion: Record<string, number>
}

/**
 * Refit `poidsPerPoint` from real break results.
 *
 * This is the intended route to a verified table. Note the promotion gate is a
 * fixture matrix, not a sample count: repeating one item twenty times confirms
 * a systematic error twenty times. `dispersion` is reported so a caller can see
 * when estimates disagree, but low dispersion across a narrow fixture set is
 * not evidence of correctness.
 *
 * Focused observations are skipped: focus redistribution is itself unverified,
 * so fitting through it would confound two unknowns.
 */
export const calibratePoids = (observations: BreakObservation[]): CalibrationResult => {
  const estimates = new Map<string, number[]>()

  for (const observation of observations) {
    if (observation.focusStatKey) continue
    const scale = (observation.coefficientPercent / 100)
      * defaultLevelFactor(observation.itemLevel ?? DEFAULTS.itemLevel)
    if (scale <= 0) continue
    for (const line of observation.statLines) {
      const observed = num(observation.observedGaEquivalent[line.key])
      const value = num(line.value)
      if (value === 0 || observed === 0) continue
      const perPoint = observed / (value * scale)
      const bucket = estimates.get(line.key) ?? []
      bucket.push(perPoint)
      estimates.set(line.key, bucket)
    }
  }

  const poidsPerPoint: Record<string, number> = {}
  const sampleCount: Record<string, number> = {}
  const dispersion: Record<string, number> = {}

  for (const [key, values] of estimates) {
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1]! + sorted[mid]!) / 2
      : sorted[mid]!
    poidsPerPoint[key] = median
    sampleCount[key] = sorted.length
    dispersion[key] = median > 0 ? (sorted[sorted.length - 1]! - sorted[0]!) / median : 0
  }

  return { poidsPerPoint, sampleCount, dispersion }
}
