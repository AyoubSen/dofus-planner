// Fitting the renderer model to the client, instead of assuming it matches.
//
// This module is the answer to the sharpest objection raised against the
// render-and-verify approach: *possessing the same font does not reproduce
// Unity's rasterisation*. Dofus 3 draws UI text through TextMeshPro from a
// signed-distance field, with configurable dilate and softness, an outline, and
// gamma-aware blending. A naive rasterisation of the same font file will not be
// pixel-identical, and a verifier built on one would reject correct strings and
// — far worse — could accept wrong ones if the mismatch happened to favour them.
//
// So the model's parameters are not declared, they are *measured*: given a
// handful of crops whose text is known, search for the parameters that
// reproduce those crops best, and report how well the best ones actually did.
// That residual is the equivalence evidence. If it is poor, this profile does
// not get a generated atlas and falls back to curated real captures — the
// fallback is coverage loss, never a loosened threshold.
//
// Nothing here decides that a profile is good enough. It produces a number and
// the calling gate decides, which is the whole point of separating them.

import { estimateBackground, reconstructCandidate } from './reconstruct'
import type { GlyphAtlasRaster, GrayImage, RenderParams } from './types'
import { defaultRenderParams } from './types'

/** One crop whose text is already known, used as a fitting example. */
export interface CalibrationSample {
  image: GrayImage
  /** The string the client actually drew. Ground truth, not a guess. */
  text: string
}

export interface CalibrationGrid {
  gamma: number[]
  dilate: number[]
  softness: number[]
  tracking: number[]
  /** Foreground luma candidates; the text colour is rarely pure white. */
  foreground: number[]
}

/**
 * A deliberately coarse default grid.
 *
 * Exhaustive over a small space rather than a gradient descent over a large
 * one. The residual surface is not convex — glyphs snap between whole-pixel
 * placements — so a descent finds a local minimum and reports it with the same
 * confidence as the global one, and a confident wrong answer is the single
 * outcome this design cannot tolerate.
 */
export const defaultCalibrationGrid = (): CalibrationGrid => ({
  gamma: [0.6, 0.8, 1.0, 1.2, 1.5, 2.0],
  dilate: [-0.15, -0.075, 0, 0.075, 0.15],
  softness: [0, 0.1, 0.2, 0.35],
  tracking: [-1, 0, 1],
  foreground: [200, 220, 235, 245, 255],
})

export interface CalibrationResult {
  params: RenderParams
  /** Mean residual across the samples at these parameters. Lower is better. */
  meanResidual: number
  /** Worst single sample, so one bad fit cannot hide behind a good average. */
  worstResidual: number
  /** Per-sample residuals in input order, for inspection. */
  residuals: number[]
  /** How many parameter combinations were evaluated. */
  evaluated: number
}

/**
 * Where a sample's text sits, found once so the fit does not re-find it.
 *
 * Naively, every parameter combination re-searched the whole offset and
 * baseline space of every sample: a few thousand combinations times a few
 * thousand positions is tens of millions of redraws, which is not a slow test
 * so much as an unusable design. Geometry barely moves with appearance, so it
 * is located once with neutral parameters and then only nudged.
 */
interface SampleAnchor {
  background: Float32Array
  offsetX: number
  baselineY: number
  /**
   * The sub-pixel phase this sample was drawn at.
   *
   * A property of the capture, not of the renderer's appearance, so it is
   * settled during anchoring and then held. Re-searching all four phases for
   * every parameter combination multiplied the work fourfold to re-derive the
   * same answer each time.
   */
  atlas: GlyphAtlasRaster
}

/** Half-width of the window the fit is still allowed to move the text within. */
const ANCHOR_WINDOW = 2

const anchorSamples = (
  samples: CalibrationSample[],
  atlases: GlyphAtlasRaster[],
  params: RenderParams,
): SampleAnchor[] | null => {
  const anchors: SampleAnchor[] = []

  for (const sample of samples) {
    const background = estimateBackground(sample.image)
    // Score each phase separately so the winner can be identified, rather than
    // only its residual.
    let best: { residual: number; atlas: GlyphAtlasRaster; offsetX: number; baselineY: number } | null = null

    for (const atlas of atlases) {
      const located = reconstructCandidate(sample.text, sample.image, background, {
        atlases: [atlas],
        params,
        baselineRange: { from: 0, to: sample.image.height - 1 },
      })
      if (!located) continue
      if (!best || located.residual < best.residual) {
        best = {
          residual: located.residual,
          atlas,
          // The reported offset carries the atlas phase; the search works in
          // whole pixels, so drop the fractional part.
          offsetX: Math.floor(located.offsetX),
          baselineY: located.baselineY,
        }
      }
    }

    if (!best) return null
    anchors.push({
      background,
      offsetX: best.offsetX,
      baselineY: best.baselineY,
      atlas: best.atlas,
    })
  }

  return anchors
}

const scoreParams = (
  samples: CalibrationSample[],
  anchors: SampleAnchor[],
  params: RenderParams,
): { mean: number; worst: number; residuals: number[] } | null => {
  const residuals: number[] = []

  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i]!
    const anchor = anchors[i]!

    const result = reconstructCandidate(sample.text, sample.image, anchor.background, {
      atlases: [anchor.atlas],
      params,
      // Tracking shifts later glyphs, so the whole line can drift by a pixel or
      // two — hence a window rather than a fixed position.
      offsetRange: { from: anchor.offsetX - ANCHOR_WINDOW, to: anchor.offsetX + ANCHOR_WINDOW },
      baselineRange: { from: anchor.baselineY - 1, to: anchor.baselineY + 1 },
    })
    // A sample whose text cannot be laid out at all disqualifies these
    // parameters rather than being skipped — skipping would let a parameter set
    // score well by quietly ignoring the examples it cannot handle.
    if (!result || !Number.isFinite(result.residual)) return null
    residuals.push(result.residual)
  }

  if (!residuals.length) return null

  const mean = residuals.reduce((sum, value) => sum + value, 0) / residuals.length
  return { mean, worst: Math.max(...residuals), residuals }
}

/**
 * Searches the grid for the parameters that best reproduce the samples.
 *
 * Ranks on the mean but breaks ties on the worst sample: two parameter sets
 * that fit equally well on average are not equally good if one of them fails
 * badly on a single example, because that example is the kind of input the
 * verifier will meet in the wild.
 */
export const calibrateRenderer = (
  samples: CalibrationSample[],
  atlases: GlyphAtlasRaster[],
  grid: CalibrationGrid = defaultCalibrationGrid(),
): CalibrationResult | null => {
  if (!samples.length) return null

  // Two passes, because anchoring and fitting depend on each other.
  //
  // Geometry is settled with neutral appearance parameters, which is a good
  // enough guess to *find* the text but not always to pick the right sub-pixel
  // phase: against a renderer with unfamiliar gamma and dilation, a neighbouring
  // phase can win, and locking it there puts a floor under every later residual
  // that no appearance parameter can lift. So the coarse fit is used to
  // re-anchor, and the second pass runs against the phase that a nearly-correct
  // renderer chooses. One extra pass; the alternative is a fit that silently
  // converges to the wrong answer.
  const coarseAnchors = anchorSamples(samples, atlases, defaultRenderParams())
  if (!coarseAnchors) return null

  const coarse = searchGrid(samples, coarseAnchors, grid)
  const anchors = coarse
    ? anchorSamples(samples, atlases, coarse.params) ?? coarseAnchors
    : coarseAnchors

  const refined = searchGrid(samples, anchors, grid)
  if (!refined) return coarse

  // Keep whichever pass actually fitted better. Re-anchoring is an improvement
  // in expectation, not a guarantee.
  if (coarse && coarse.meanResidual < refined.meanResidual) return coarse
  return refined
}

const searchGrid = (
  samples: CalibrationSample[],
  anchors: SampleAnchor[],
  grid: CalibrationGrid,
): CalibrationResult | null => {
  let best: CalibrationResult | null = null
  let evaluated = 0

  for (const foreground of grid.foreground) {
    for (const gamma of grid.gamma) {
      for (const dilate of grid.dilate) {
        for (const softness of grid.softness) {
          for (const tracking of grid.tracking) {
            const params: RenderParams = {
              ...defaultRenderParams(),
              foreground: [foreground, foreground, foreground],
              gamma,
              dilate,
              softness,
              tracking,
            }

            const scored = scoreParams(samples, anchors, params)
            evaluated += 1
            if (!scored) continue

            const better = !best
              || scored.mean < best.meanResidual
              || (scored.mean === best.meanResidual && scored.worst < best.worstResidual)

            if (better) {
              best = {
                params,
                meanResidual: scored.mean,
                worstResidual: scored.worst,
                residuals: scored.residuals,
                evaluated: 0,
              }
            }
          }
        }
      }
    }
  }

  return best ? { ...best, evaluated } : null
}

export interface EquivalenceVerdict {
  /** Whether this profile may use a generated atlas in production. */
  equivalent: boolean
  meanResidual: number
  worstResidual: number
  reason: string
}

/**
 * Decides whether a fitted model is close enough to be trusted for a profile.
 *
 * Both bars must clear, and the second is the one that matters: an average is
 * easy to satisfy by fitting most samples well and one badly, and the badly
 * fitted one is exactly the case that will be misread in production.
 *
 * A failure here is not a defeat. It means this profile uses a curated
 * real-capture atlas instead, which costs labelling effort and coverage but
 * costs nothing in correctness. The one response that is never available is
 * raising the thresholds until it passes.
 */
export const judgeEquivalence = (
  result: CalibrationResult | null,
  limits: { mean: number; worst: number },
): EquivalenceVerdict => {
  if (!result) {
    return {
      equivalent: false,
      meanResidual: Number.POSITIVE_INFINITY,
      worstResidual: Number.POSITIVE_INFINITY,
      reason: 'no-fit',
    }
  }

  if (result.meanResidual > limits.mean) {
    return {
      equivalent: false,
      meanResidual: result.meanResidual,
      worstResidual: result.worstResidual,
      reason: 'mean-residual-too-high',
    }
  }

  if (result.worstResidual > limits.worst) {
    return {
      equivalent: false,
      meanResidual: result.meanResidual,
      worstResidual: result.worstResidual,
      reason: 'worst-sample-too-high',
    }
  }

  return {
    equivalent: true,
    meanResidual: result.meanResidual,
    worstResidual: result.worstResidual,
    reason: 'equivalent',
  }
}

/**
 * Separation between the true string and its nearest competitor.
 *
 * The measurement that justifies an epsilon rather than assuming one. A profile
 * whose competitors sit close to the truth cannot be read safely at any
 * threshold, and it is much better to discover that from a report than from a
 * wrong purchase.
 */
export interface SeparationReport {
  samples: number
  /** Smallest gap seen between the true string and a wrong one. */
  minMargin: number
  medianMargin: number
  /** Largest residual the true string itself produced. */
  worstTruthResidual: number
  /** Cases where a wrong string fitted better than the true one. */
  inversions: number
}

export const measureSeparation = (
  samples: CalibrationSample[],
  atlases: GlyphAtlasRaster[],
  params: RenderParams,
  competitorsFor: (truth: string) => string[],
): SeparationReport => {
  const margins: number[] = []
  let worstTruthResidual = 0
  let inversions = 0

  for (const sample of samples) {
    const background = estimateBackground(sample.image)

    // Locate once with a full search, then score every competitor in a tight
    // window around it. Competitors are the same string with one digit changed,
    // so they sit in the same place — re-searching the whole crop for each of
    // the eighty-odd variants of a nine-digit price is pure waste.
    const located = reconstructCandidate(sample.text, sample.image, background, {
      atlases,
      params,
      baselineRange: { from: 0, to: sample.image.height - 1 },
    })
    if (!located) continue

    const options = {
      atlases,
      params,
      offsetRange: {
        from: Math.floor(located.offsetX) - ANCHOR_WINDOW,
        to: Math.floor(located.offsetX) + ANCHOR_WINDOW,
      },
      baselineRange: { from: located.baselineY - 1, to: located.baselineY + 1 },
    }

    const truth = located
    worstTruthResidual = Math.max(worstTruthResidual, truth.residual)

    let bestWrong = Number.POSITIVE_INFINITY
    for (const competitor of competitorsFor(sample.text)) {
      if (competitor === sample.text) continue
      const scored = reconstructCandidate(competitor, sample.image, background, options)
      if (scored && scored.residual < bestWrong) bestWrong = scored.residual
    }

    if (!Number.isFinite(bestWrong)) continue
    // An inversion means a wrong string explained the pixels better than the
    // right one. One of these invalidates the profile outright — no threshold
    // can rescue a model that ranks the truth second.
    if (bestWrong < truth.residual) inversions += 1
    margins.push(bestWrong - truth.residual)
  }

  const sorted = margins.slice().sort((a, b) => a - b)

  return {
    samples: margins.length,
    minMargin: sorted.length ? sorted[0]! : 0,
    medianMargin: sorted.length ? sorted[Math.floor(sorted.length / 2)]! : 0,
    worstTruthResidual,
    inversions,
  }
}

/** Single-digit variants of a numeric string — the competitors that matter. */
export const digitVariants = (truth: string): string[] => {
  const variants: string[] = []
  for (let i = 0; i < truth.length; i += 1) {
    if (!/\d/.test(truth[i]!)) continue
    for (const digit of '0123456789') {
      if (digit === truth[i]) continue
      variants.push(truth.slice(0, i) + digit + truth.slice(i + 1))
    }
  }
  return variants
}
