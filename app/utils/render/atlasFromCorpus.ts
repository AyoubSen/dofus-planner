// Building a glyph atlas out of the game's own pixels.
//
// The existing "deterministic" reader has answered zero times in thirty-nine
// real captures. Its atlas is taught one character at a time by hand, it stores
// binary signatures sampled from a per-image threshold, and in practice it
// never became ready — so every price in the archive came from the statistical
// fallback, which is the reader nobody wanted to trust. Tuning the crop around
// that arrangement was polishing a component that does not run.
//
// The way out does not need Ankama's font file. It needs labelled examples of
// the client's text, and confirming captures produced exactly that: a strip of
// real pixels with the exact string it contains. Segment the price, align the
// glyphs to the known string, and every digit is labelled without anyone typing
// a label. Repeat across captures and average, and the result is a grayscale
// coverage atlas built from the renderer being modelled rather than from a
// guess about it.
//
// This is the curated real-capture path — the fallback for when renderer
// equivalence cannot be established from a font, and the right first move when
// there is no font at hand at all.

import { estimateBackground } from './reconstruct'
import { findPriceRegion, type RGBAImage } from './priceRegion'
import type { GlyphAtlasRaster, GlyphCoverage, GrayImage } from './types'

/** Cuts a column range out of a grayscale image. */
export const cropColumns = (image: GrayImage, x0: number, x1: number): GrayImage => {
  const width = Math.max(1, x1 - x0 + 1)
  const data = new Float32Array(width * image.height)
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      data[y * width + x] = image.data[y * image.width + (x0 + x)] ?? 0
    }
  }
  return { width, height: image.height, data }
}

/** A run of inked columns: one glyph, before it is known which. */
export interface GlyphSlice {
  x0: number
  x1: number
  y0: number
  y1: number
}

/** Coverage share of a column below which it counts as a gap. */
const COLUMN_INK_THRESHOLD = 0.04

/**
 * Estimates foreground and background luma for a strip.
 *
 * Percentiles rather than min/max: a single blown-out pixel from an icon would
 * otherwise set the foreground and push every coverage value down.
 */
export const estimateLevels = (image: GrayImage): { background: number; foreground: number } => {
  const sorted = Array.from(image.data).sort((a, b) => a - b)
  return {
    background: sorted[Math.floor(sorted.length * 0.35)]!,
    foreground: sorted[Math.floor(sorted.length * 0.995)]!,
  }
}

/**
 * Per-pixel coverage, measured against the background *of its own column*.
 *
 * A single background for the whole strip does not work here, and the archive
 * showed why: a price row spans the dark list behind it and the lighter panel
 * the row is drawn on, so one global level makes the entire panel read as
 * roughly half-covered. Segmentation then returns the panel as one 374-pixel
 * "glyph" with the digits buried inside it, and nothing downstream can recover.
 *
 * Per-column, the panel is its own baseline and only the text rises above it —
 * which is also what makes the resulting atlas survive being drawn over a
 * different backdrop later.
 */
export const coverageOf = (image: GrayImage, _background: number, foreground: number): Float32Array => {
  const columnBackground = estimateBackground(image)
  const coverage = new Float32Array(image.data.length)

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const i = y * image.width + x
      const base = columnBackground[x]!
      const span = Math.max(1, foreground - base)
      coverage[i] = Math.min(1, Math.max(0, (image.data[i]! - base) / span))
    }
  }

  return coverage
}

/** Splits a strip into inked column runs. */
export const sliceGlyphs = (
  coverage: Float32Array,
  width: number,
  height: number,
): GlyphSlice[] => {
  const columnInk: number[] = new Array(width).fill(0)
  for (let x = 0; x < width; x += 1) {
    let sum = 0
    for (let y = 0; y < height; y += 1) sum += coverage[y * width + x]!
    columnInk[x] = sum / height
  }

  const slices: GlyphSlice[] = []
  let start = -1

  for (let x = 0; x <= width; x += 1) {
    const inked = x < width && columnInk[x]! >= COLUMN_INK_THRESHOLD
    if (inked && start < 0) start = x
    if (!inked && start >= 0) {
      // Trim to the rows that actually carry ink, so glyphs of different
      // heights are not padded with whatever sat above or below them.
      let y0 = -1
      let y1 = -1
      for (let y = 0; y < height; y += 1) {
        let rowInk = 0
        for (let x2 = start; x2 < x; x2 += 1) rowInk += coverage[y * width + x2]!
        if (rowInk / (x - start) >= COLUMN_INK_THRESHOLD) {
          if (y0 < 0) y0 = y
          y1 = y
        }
      }
      if (y0 >= 0) slices.push({ x0: start, x1: x - 1, y0, y1 })
      start = -1
    }
  }

  return slices
}

/**
 * Splits merged runs into individual glyphs using the font's fixed pitch.
 *
 * Column projection cannot separate adjacent digits, because the client sets
 * them at a constant advance with no gap — in the archive a pair of zeros
 * segments as one 16-pixel run, and a trio as one 25-pixel run. No threshold
 * fixes that; there is genuinely no blank column to cut on.
 *
 * What rescues it is knowing the answer. The number of digits is known from the
 * confirmed truth, so the pitch can be *solved* rather than guessed: try each
 * plausible advance, subdivide every run by it, and accept only the pitch whose
 * subdivision yields exactly the expected number of glyphs. A wrong pitch
 * almost never lands on the right total, which makes the count a check rather
 * than an assumption.
 */
export const subdivideByPitch = (
  slices: GlyphSlice[],
  digitCount: number,
): GlyphSlice[] | null => {
  if (!slices.length || digitCount <= 0) return null

  const widths = slices.map((slice) => slice.x1 - slice.x0 + 1)
  const totalWidth = widths.reduce((sum, width) => sum + width, 0)
  const narrowest = Math.min(...widths)

  // Candidates bracket the two sane estimates: the narrowest run is probably a
  // single glyph, and the total ink over the digit count is the mean advance.
  const candidates = new Set<number>()
  for (let pitch = Math.max(3, narrowest - 2); pitch <= narrowest + 3; pitch += 1) candidates.add(pitch)
  const mean = Math.round(totalWidth / digitCount)
  for (let pitch = Math.max(3, mean - 2); pitch <= mean + 2; pitch += 1) candidates.add(pitch)

  const solutions: GlyphSlice[][] = []

  for (const pitch of [...candidates].sort((a, b) => a - b)) {
    const counts = widths.map((width) => Math.max(1, Math.round(width / pitch)))
    if (counts.reduce((sum, count) => sum + count, 0) !== digitCount) continue

    const parts: GlyphSlice[] = []
    slices.forEach((slice, index) => {
      const count = counts[index]!
      const width = widths[index]!
      for (let piece = 0; piece < count; piece += 1) {
        // Even division: a fixed-advance font places glyphs on a regular grid,
        // so the run's own width carries the positions.
        const x0 = slice.x0 + Math.round((piece * width) / count)
        const x1 = slice.x0 + Math.round(((piece + 1) * width) / count) - 1
        parts.push({ x0, x1: Math.max(x0, x1), y0: slice.y0, y1: slice.y1 })
      }
    })
    solutions.push(parts)
  }

  if (!solutions.length) return null
  // Several pitches agreeing on the count is fine — they produce near-identical
  // cuts — so take the first rather than refusing.
  return solutions[0]!
}

/**
 * Finds the run of slices that spells the known price.
 *
 * A price strip also carries the lot count, a star, the kamas icon and the word
 * ACHETER, so the digits have to be picked out of a longer sequence. The string
 * is known, which turns this from recognition into matching: find the run whose
 * length equals the digit count and whose internal gaps fall where the string's
 * separators do. Anything ambiguous is refused rather than guessed at, because
 * a mis-aligned run would teach the atlas wrong glyphs — and a wrong atlas is
 * far worse than no atlas, since it fails silently and forever.
 */
export const alignToTruth = (slices: GlyphSlice[], truth: string): GlyphSlice[] | null => {
  const digits = truth.replace(/\D/g, '')
  if (!digits.length || slices.length < digits.length) return null

  // Where the separators fall, as indexes into the digit sequence.
  const breaks = new Set<number>()
  let digitIndex = 0
  for (const char of truth) {
    if (/\d/.test(char)) digitIndex += 1
    else if (digitIndex > 0) breaks.add(digitIndex)
  }

  const candidates: GlyphSlice[][] = []

  for (let start = 0; start + digits.length <= slices.length; start += 1) {
    const run = slices.slice(start, start + digits.length)

    // Gaps inside a group are tight; gaps at a separator are wide. Requiring
    // the pattern to match is what stops a run of unrelated glyphs — the lot
    // count plus part of ACHETER — from being accepted as the price.
    const gaps: number[] = []
    for (let i = 1; i < run.length; i += 1) gaps.push(run[i]!.x0 - run[i - 1]!.x1 - 1)
    if (!gaps.length) continue

    const inGroup = gaps.filter((_, i) => !breaks.has(i + 1))
    const atBreak = gaps.filter((_, i) => breaks.has(i + 1))
    if (breaks.size && !atBreak.length) continue

    const maxInGroup = inGroup.length ? Math.max(...inGroup) : 0
    const minAtBreak = atBreak.length ? Math.min(...atBreak) : Number.POSITIVE_INFINITY
    if (atBreak.length && minAtBreak <= maxInGroup) continue

    // Digits in a UI font share an advance; wildly uneven spacing means the run
    // has picked up an icon or crossed into other text.
    const widths = run.map((slice) => slice.x1 - slice.x0 + 1)
    const spread = Math.max(...widths) - Math.min(...widths)
    if (spread > Math.max(...widths) * 0.9) continue

    candidates.push(run)
  }

  // Exactly one plausible alignment, or none. Two candidates means the strip
  // does not determine which glyphs are the price, and teaching from a coin
  // flip is how an atlas becomes confidently wrong.
  if (candidates.length !== 1) return null
  return candidates[0]!
}

export interface ExtractedGlyph {
  char: string
  width: number
  height: number
  alpha: Float32Array
  /** Rows from the strip's top to this glyph's top, for baseline alignment. */
  top: number
}

/** Cuts the aligned slices out as labelled coverage patches. */
export const extractGlyphs = (
  image: GrayImage,
  coverage: Float32Array,
  slices: GlyphSlice[],
  truth: string,
): ExtractedGlyph[] => {
  const digits = truth.replace(/\D/g, '')
  if (slices.length !== digits.length) return []

  return slices.map((slice, index) => {
    const width = slice.x1 - slice.x0 + 1
    const height = slice.y1 - slice.y0 + 1
    const alpha = new Float32Array(width * height)

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        alpha[y * width + x] = coverage[(slice.y0 + y) * image.width + (slice.x0 + x)]!
      }
    }

    return { char: digits[index]!, width, height, alpha, top: slice.y0 }
  })
}

/**
 * Averages many examples of one character into a single coverage patch.
 *
 * Averaging suppresses per-capture noise and the sub-pixel jitter of where the
 * glyph happened to land, leaving the shape the renderer actually draws. Every
 * example is padded to a common box first, aligned on its own ink, so a glyph
 * cut one pixel taller does not smear the average.
 */
export const averageGlyphs = (examples: ExtractedGlyph[]): GlyphCoverage | null => {
  if (!examples.length) return null

  const width = Math.max(...examples.map((example) => example.width))
  const height = Math.max(...examples.map((example) => example.height))
  const alpha = new Float32Array(width * height)

  for (const example of examples) {
    // Centre horizontally, align to the top: digits share a cap height, so the
    // top edge is the stable reference and the width varies with the glyph.
    const dx = Math.floor((width - example.width) / 2)
    for (let y = 0; y < example.height; y += 1) {
      for (let x = 0; x < example.width; x += 1) {
        alpha[y * width + (x + dx)] += example.alpha[y * example.width + x]! / examples.length
      }
    }
  }

  return {
    char: examples[0]!.char,
    width,
    height,
    alpha,
    // Advance is measured from real spacing by the caller; this is a fallback.
    advance: width + 1,
    bearingY: height - 1,
  }
}

export interface AtlasBuildResult {
  atlas: GlyphAtlasRaster
  /** Examples contributed per character, so thin coverage is visible. */
  counts: Record<string, number>
  /** Captures that could not be aligned, and are therefore unused. */
  skipped: number
  used: number
}

/**
 * Builds an atlas from labelled strips.
 *
 * Reports its own coverage rather than only succeeding or failing: an atlas
 * missing a digit, or resting on one example of it, is not ready for use and
 * the caller has to be able to see that.
 */
/**
 * Narrows a strip to the rows the text occupies.
 *
 * Slicing a full-height strip does not work: it spans the dark list, the row
 * panel and sometimes a tooltip, and the panel edges themselves segment as
 * enormous "glyphs" — the archive produced a single 374-pixel-wide slice with
 * the digits buried inside it. Cropping to the text line first removes every
 * one of those structures, and the band is found by measurement rather than
 * assumed (see `textBand.ts`, which located the line in all thirty captures).
 */
export const cropToTextRows = (image: GrayImage): GrayImage => {
  const background = estimateBackground(image)
  const sorted = Array.from(image.data).sort((a, b) => a - b)
  const foreground = sorted[Math.floor(sorted.length * 0.995)]!

  const rowScore: number[] = []
  for (let y = 0; y < image.height; y += 1) {
    let ink = 0
    for (let x = 0; x < image.width; x += 1) {
      const base = background[x]!
      const span = Math.max(1, foreground - base)
      if ((image.data[y * image.width + x]! - base) / span > 0.5) ink += 1
    }
    rowScore.push(ink)
  }

  const peak = Math.max(...rowScore)
  if (peak <= 0) return image

  // Rows carrying at least a fifth of the busiest row's ink belong to the line.
  const threshold = Math.max(1, peak * 0.2)
  let top = rowScore.findIndex((score) => score >= threshold)
  let bottom = rowScore.length - 1 - [...rowScore].reverse().findIndex((score) => score >= threshold)
  if (top < 0 || bottom < top) return image

  top = Math.max(0, top - 1)
  bottom = Math.min(image.height - 1, bottom + 1)

  const height = bottom - top + 1
  const data = new Float32Array(image.width * height)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      data[y * image.width + x] = image.data[(top + y) * image.width + x]!
    }
  }

  return { width: image.width, height, data }
}

export const buildAtlasFromSamples = (
  samples: Array<{ colour: RGBAImage; image: GrayImage; truth: string }>,
  profileId: string,
): AtlasBuildResult => {
  const byChar = new Map<string, ExtractedGlyph[]>()
  let used = 0
  let skipped = 0
  const advances: number[] = []

  for (const raw of samples) {
    // Anchor on the kamas symbol first. Searching the whole strip for digits
    // meant competing with the ACHETER button, the lot count and the item icon,
    // all of which look like bright glyph runs in luminance. Bounded to the
    // window left of the symbol, what remains is the number and nothing else.
    const region = findPriceRegion(raw.colour)
    if (!region) {
      skipped += 1
      continue
    }

    const windowed = cropColumns(raw.image, region.x0, region.x1)
    const image = cropToTextRows(windowed)

    const levels = estimateLevels(image)
    if (levels.foreground - levels.background < 24) {
      skipped += 1
      continue
    }

    const sample = { image, truth: raw.truth }
    const coverage = coverageOf(sample.image, levels.background, levels.foreground)
    const slices = sliceGlyphs(coverage, sample.image.width, sample.image.height)

    // The window already contains only the price, so the digits are simply the
    // runs in order once merged ones are split. `alignToTruth`'s search for a
    // matching run existed to find the number inside a whole row, which the
    // colour anchor now does far more reliably.
    const aligned = subdivideByPitch(slices, sample.truth.replace(/\D/g, '').length)
    if (!aligned) {
      skipped += 1
      continue
    }

    for (let i = 1; i < aligned.length; i += 1) {
      const gap = aligned[i]!.x0 - aligned[i - 1]!.x0
      if (gap > 0 && gap < 40) advances.push(gap)
    }

    for (const glyph of extractGlyphs(sample.image, coverage, aligned, sample.truth)) {
      const bucket = byChar.get(glyph.char)
      if (bucket) bucket.push(glyph)
      else byChar.set(glyph.char, [glyph])
    }
    used += 1
  }

  advances.sort((a, b) => a - b)
  const advance = advances.length ? advances[Math.floor(advances.length / 2)]! : 0

  const glyphs = new Map<string, GlyphCoverage>()
  const counts: Record<string, number> = {}

  for (const [char, examples] of byChar) {
    const averaged = averageGlyphs(examples)
    if (!averaged) continue
    if (advance > 0) averaged.advance = advance
    glyphs.set(char, averaged)
    counts[char] = examples.length
  }

  return {
    atlas: {
      profileId,
      phase: 0,
      pixelSize: glyphs.size ? Math.max(...[...glyphs.values()].map((g) => g.height)) : 0,
      glyphs,
    },
    counts,
    skipped,
    used,
  }
}

/** Wire format for a built atlas. Plain JSON so it can ship as an asset. */
export interface SerialisedAtlas {
  profileId: string
  phase: number
  pixelSize: number
  /** Examples each glyph was averaged from, so thin evidence stays visible. */
  counts: Record<string, number>
  builtAt: string
  /**
   * Whether this atlas may be used to read prices at all.
   *
   * Not decoration, and not advisory. An atlas built from one example of a
   * digit averages into something too vague to discriminate: residuals collapse
   * for *every* candidate, the gates stop separating right from wrong, and the
   * reader starts accepting garbage with a comfortable-looking score. That is
   * exactly what happened — an atlas with a single `6` and a single `1` read
   * `3 599 999` as `3601011` and called it a clean read.
   *
   * Thresholds calibrated against one atlas do not transfer to another, so an
   * atlas that cannot show enough evidence behind every digit is not used at
   * all. Refusing everything is a coverage loss; reading confidently from mush
   * is a wrong price in the market history.
   */
  ready: boolean
  /** Digits with no example at all. */
  missing: string[]
  /** Digits with too few examples to average reliably. */
  thin: string[]
  glyphs: Array<{
    char: string
    width: number
    height: number
    advance: number
    bearingY: number
    /** Coverage quantised to 0..255; a float array would triple the size for
     *  precision the renderer cannot use. */
    alpha: number[]
  }>
}

export const serialiseAtlas = (result: AtlasBuildResult): SerialisedAtlas => {
  const readiness = atlasReadiness(result)
  return {
  profileId: result.atlas.profileId,
  phase: result.atlas.phase,
  pixelSize: result.atlas.pixelSize,
  counts: result.counts,
  builtAt: new Date().toISOString(),
  ready: readiness.ready,
  missing: readiness.missing,
  thin: readiness.thin,
  glyphs: [...result.atlas.glyphs.values()].map((glyph) => ({
    char: glyph.char,
    width: glyph.width,
    height: glyph.height,
    advance: glyph.advance,
    bearingY: glyph.bearingY,
    alpha: Array.from(glyph.alpha, (value) => Math.round(value * 255)),
  })),
  }
}

export const deserialiseAtlas = (data: SerialisedAtlas): GlyphAtlasRaster => {
  const glyphs = new Map<string, GlyphCoverage>()

  for (const glyph of data.glyphs) {
    glyphs.set(glyph.char, {
      char: glyph.char,
      width: glyph.width,
      height: glyph.height,
      advance: glyph.advance,
      bearingY: glyph.bearingY,
      alpha: Float32Array.from(glyph.alpha, (value) => value / 255),
    })
  }

  return { profileId: data.profileId, phase: data.phase, pixelSize: data.pixelSize, glyphs }
}

/** Whether an atlas has enough evidence behind every digit to be used. */
/**
 * Whether an atlas may be used, and what it is short of.
 *
 * Missing and thin are different risks, and the difference is measured rather
 * than assumed:
 *
 * - **Missing** digits cost *coverage*, not correctness. An atlas with no `2`
 *   and no `6` was run against a page containing eight such prices and refused
 *   all eight — the residual gate has nothing close enough to match, so the
 *   read fails rather than lands wrong. That atlas read 24 of 30 held-out
 *   captures correctly with zero errors. Disabling it would throw away a
 *   working reader to avoid a failure mode it does not have.
 *
 * - **Thin** digits cost *correctness*. One example averages into a shape too
 *   vague to discriminate: residuals collapse for every candidate at once, the
 *   gates stop separating, and garbage passes with a comfortable score. An
 *   atlas holding a single `6` and a single `1` read `3 599 999` as `3601011`
 *   and reported it as a clean read.
 *
 * So a present digit must be backed by real evidence, while an absent one is
 * simply a gap in what the reader can attempt.
 */
export const atlasReadiness = (
  result: AtlasBuildResult,
  minExamplesPerDigit = 3,
): { ready: boolean; missing: string[]; thin: string[] } => {
  const missing: string[] = []
  const thin: string[] = []

  for (const digit of '0123456789') {
    const count = result.counts[digit] ?? 0
    if (!count) missing.push(digit)
    else if (count < minExamplesPerDigit) thin.push(digit)
  }

  // At least a few digits have to be known for the atlas to be worth anything,
  // and every digit it *does* claim must be backed by more than one example.
  const known = 10 - missing.length
  return { ready: known >= 4 && !thin.length, missing, thin }
}
