// Reading a price by reconstruction, using an atlas built from real captures.
//
// This is where the pieces meet. The colour anchor bounds the search to the
// number; the atlas supplies what the client's digits actually look like;
// reconstruction decides which string explains the pixels and by how much
// better than the runner-up. If no string clears both gates the answer is "I
// do not know", which is a refusal the caller can act on rather than a guess it
// cannot tell apart from a reading.
//
// The property this is built for: a wrong price is far more expensive than a
// missing one. A refusal costs a re-hover; a confident misread enters the
// market history, moves the median every later check is judged against, and
// recommends a purchase.

import { findPriceRegion, type RGBAImage } from './priceRegion'
import { cropColumns, cropToTextRows, sliceGlyphs, coverageOf, estimateLevels, subdivideByPitch } from './atlasFromCorpus'
import { estimateBackground, reconstructCandidate } from './reconstruct'
import { toGrayImage } from './reconstruct'
import type { GlyphAtlasRaster, GrayImage, RenderParams } from './types'
import { defaultRenderParams } from './types'

export interface PriceReading {
  /** The number read, or null when nothing cleared the gates. */
  value: number | null
  /** Digits as read, with '?' where a position could not be resolved. */
  text: string
  /** Worst per-glyph residual across the string. */
  residual: number
  /** Smallest per-glyph margin over the runner-up digit. */
  margin: number
  reason: 'read' | 'no-region' | 'no-pitch' | 'ambiguous' | 'unexplained' | 'no-atlas'
}

export interface PriceReaderOptions {
  atlas: GlyphAtlasRaster
  params?: RenderParams
  /** Max per-glyph residual. Calibrated per profile; see selectiveRisk. */
  epsilon?: number
  /** Min gap to the runner-up digit. */
  minMargin?: number
}

/**
 * Starting thresholds for a real profile.
 *
 * Measured against the archive rather than chosen: a correct digit reconstructs
 * far below this and the nearest wrong digit sits well above it. They remain
 * per-profile numbers and should be refitted whenever the atlas is rebuilt.
 */
export const REAL_EPSILON = 0.22
export const REAL_MIN_MARGIN = 0.02

/**
 * Reads one digit cell by trying every digit the atlas knows.
 *
 * Per glyph rather than per whole string: a price has ten candidates per
 * position and up to nine positions, so scoring whole strings would mean
 * evaluating a billion of them. Digits are independent here — the font is fixed
 * pitch and the cells do not overlap — so the per-cell decision is sound, and
 * the margin is checked at every position rather than only for the total.
 */
const readCell = (
  cell: GrayImage,
  background: Float32Array,
  atlas: GlyphAtlasRaster,
  params: RenderParams,
): { char: string; residual: number; margin: number } => {
  const scored: Array<{ char: string; residual: number }> = []

  for (const [char, glyph] of atlas.glyphs) {
    if (!/\d/.test(char)) continue
    const single: GlyphAtlasRaster = {
      ...atlas,
      glyphs: new Map([[char, glyph]]),
    }
    const result = reconstructCandidate(char, cell, background, {
      atlases: [single],
      params,
      offsetRange: { from: -2, to: Math.max(0, cell.width - glyph.width + 2) },
      baselineRange: { from: glyph.height - 1, to: cell.height - 1 },
    })
    if (result) scored.push({ char, residual: result.residual })
  }

  if (!scored.length) return { char: '?', residual: Number.POSITIVE_INFINITY, margin: 0 }

  scored.sort((a, b) => a.residual - b.residual)
  const best = scored[0]!
  const runnerUp = scored[1]
  return {
    char: best.char,
    residual: best.residual,
    margin: runnerUp ? runnerUp.residual - best.residual : Number.POSITIVE_INFINITY,
  }
}

/** Reads the price out of a captured listing row. */
export const readPrice = (colour: RGBAImage, options: PriceReaderOptions, hintX?: number): PriceReading => {
  const params = options.params ?? defaultRenderParams()
  const epsilon = options.epsilon ?? REAL_EPSILON
  const minMargin = options.minMargin ?? REAL_MIN_MARGIN

  const digitGlyphs = [...options.atlas.glyphs.keys()].filter((char) => /\d/.test(char))
  if (!digitGlyphs.length) {
    return { value: null, text: '', residual: 0, margin: 0, reason: 'no-atlas' }
  }

  // An incomplete atlas is usable, and safely so, provided the residual gate is
  // doing its job. A cell whose true digit is missing cannot reconstruct well
  // against any glyph the atlas *does* hold, so it fails epsilon and the whole
  // price refuses. The alternative — refusing outright until all ten digits
  // have been seen — throws away every reading for want of a digit that may
  // simply not occur in this item's price range.
  //
  // This leans entirely on epsilon being tight enough that a 6 cannot pass as
  // an 8. That is an empirical claim about a specific profile, so it is
  // measured (see `priceReader.real.spec.ts`) rather than asserted.

  const region = findPriceRegion(colour, hintX)
  if (!region) return { value: null, text: '', residual: 0, margin: 0, reason: 'no-region' }

  const gray = toGrayImage(colour.data, colour.width, colour.height)
  const line = cropToTextRows(cropColumns(gray, region.x0, region.x1))
  const levels = estimateLevels(line)
  const coverage = coverageOf(line, levels.background, levels.foreground)
  const runs = sliceGlyphs(coverage, line.width, line.height)

  // Try each digit count the region could hold, and keep the reading that both
  // subdivides cleanly and reconstructs best.
  let best: PriceReading | null = null

  for (let digits = 4; digits <= 9; digits += 1) {
    const cells = subdivideByPitch(runs, digits)
    if (!cells) continue

    let text = ''
    let worstResidual = 0
    let tightestMargin = Number.POSITIVE_INFINITY

    for (const cell of cells) {
      const width = cell.x1 - cell.x0 + 1
      const cellImage = cropColumns(line, cell.x0, cell.x1)
      const background = estimateBackground(cellImage)
      const read = readCell(cellImage, background, options.atlas, params)

      text += read.char
      worstResidual = Math.max(worstResidual, read.residual)
      tightestMargin = Math.min(tightestMargin, read.margin)
      if (width <= 0) break
    }

    const candidate: PriceReading = {
      value: null,
      text,
      residual: worstResidual,
      margin: tightestMargin,
      reason: 'read',
    }

    if (!best || worstResidual < best.residual) best = candidate
  }

  if (!best) return { value: null, text: '', residual: 0, margin: 0, reason: 'no-pitch' }
  if (best.text.includes('?') || best.residual > epsilon) {
    return { ...best, value: null, reason: 'unexplained' }
  }
  if (best.margin < minMargin) return { ...best, value: null, reason: 'ambiguous' }

  const value = Number(best.text)
  if (!Number.isFinite(value) || value <= 0) {
    return { ...best, value: null, reason: 'unexplained' }
  }

  return { ...best, value, reason: 'read' }
}
