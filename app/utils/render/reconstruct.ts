// Redrawing a candidate and measuring how far off it lands.
//
// This is the load-bearing gate of the whole reading pipeline. Every other
// stage — glyph matching, the model, multi-frame consensus — exists to *propose*
// a string; this is what decides whether the proposal explains the pixels that
// were actually captured.
//
// Read `types.ts` first for what the renderer model is and, more importantly,
// what it is not.

import type {
  GlyphAtlasRaster,
  GlyphCoverage,
  GrayImage,
  ReconstructionResult,
  RenderParams,
} from './types'

/** Luma from RGBA bytes, the same weights the rest of the app uses. */
export const toGrayImage = (data: Uint8ClampedArray, width: number, height: number): GrayImage => {
  const out = new Float32Array(width * height)
  for (let i = 0; i < width * height; i += 1) {
    out[i] = data[i * 4]! * 0.299 + data[i * 4 + 1]! * 0.587 + data[i * 4 + 2]! * 0.114
  }
  return { width, height, data: out }
}

/**
 * Applies dilate, softness and gamma to raw coverage.
 *
 * Order is deliberate and is not interchangeable: dilate reshapes the glyph,
 * softness blurs that shape, and gamma re-maps the blend. Applying gamma first
 * would bake the blend curve into the shape and the fit would chase its own
 * tail during calibration.
 */
export const shapeCoverage = (
  alpha: Float32Array,
  width: number,
  height: number,
  params: RenderParams,
): Float32Array => {
  let out = new Float32Array(alpha.length)

  for (let i = 0; i < alpha.length; i += 1) {
    out[i] = Math.min(1, Math.max(0, alpha[i]! + params.dilate))
  }

  if (params.softness > 0) {
    // Separable 3-tap blur, weight set by softness. Enough to model an edge
    // ramp; anything wider would start erasing the thin strokes that
    // distinguish a 6 from an 8, which is the discrimination that matters.
    const w = Math.min(0.5, params.softness)
    const mid = 1 - 2 * w
    const tmp = new Float32Array(out.length)

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * width + x
        const left = x > 0 ? out[i - 1]! : out[i]!
        const right = x < width - 1 ? out[i + 1]! : out[i]!
        tmp[i] = left * w + out[i]! * mid + right * w
      }
    }

    const blurred = new Float32Array(out.length)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * width + x
        const up = y > 0 ? tmp[i - width]! : tmp[i]!
        const down = y < height - 1 ? tmp[i + width]! : tmp[i]!
        blurred[i] = up * w + tmp[i]! * mid + down * w
      }
    }
    out = blurred
  }

  if (params.gamma !== 1) {
    for (let i = 0; i < out.length; i += 1) out[i] = Math.pow(out[i]!, params.gamma)
  }

  return out
}

/** Luma of a colour triple, for compositing in grayscale. */
const lumaOf = (rgb: [number, number, number]) =>
  rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114

export interface RenderedLine {
  width: number
  height: number
  /** Coverage per pixel after shaping, 0..1. */
  coverage: Float32Array
}

/**
 * Lays out a string as a single coverage bitmap.
 *
 * Returns null when any character is missing from the atlas — a partially drawn
 * hypothesis would produce a small residual over the part it did draw and say
 * nothing about the rest, which is precisely the kind of half-answer that made
 * "2 750 000" readable as "2 750".
 */
export const renderLine = (
  candidate: string,
  atlas: GlyphAtlasRaster,
  params: RenderParams,
  canvasWidth: number,
  canvasHeight: number,
  offsetX: number,
  baselineY: number,
): RenderedLine | null => {
  const glyphs: GlyphCoverage[] = []
  for (const char of candidate) {
    const glyph = atlas.glyphs.get(char)
    if (!glyph) return null
    glyphs.push(glyph)
  }

  const coverage = new Float32Array(canvasWidth * canvasHeight)
  let penX = offsetX

  for (const glyph of glyphs) {
    const shaped = shapeCoverageCached(glyph.alpha, glyph.width, glyph.height, params)
    // Round once, at placement. The sub-pixel part of the position is carried
    // by which phase-specific atlas the caller passed in, not by resampling
    // here — resampling would blur exactly the edges being measured.
    const originX = Math.round(penX)
    const originY = Math.round(baselineY - glyph.bearingY)

    for (let gy = 0; gy < glyph.height; gy += 1) {
      const ty = originY + gy
      if (ty < 0 || ty >= canvasHeight) continue

      for (let gx = 0; gx < glyph.width; gx += 1) {
        const tx = originX + gx
        if (tx < 0 || tx >= canvasWidth) continue

        const value = shaped[gy * glyph.width + gx]!
        const target = ty * canvasWidth + tx
        // Glyphs can overlap after dilation; keep the strongest rather than
        // summing, which would push overlaps past full coverage.
        if (value > coverage[target]!) coverage[target] = value
      }
    }

    penX += glyph.advance + params.tracking
  }

  return { width: canvasWidth, height: canvasHeight, coverage }
}

/** Radius of the horizontal min-filter used to clean ink out of the estimate. */
const BACKGROUND_MIN_RADIUS = 3

/**
 * Estimates the background the text was drawn over.
 *
 * Per column rather than one value for the strip, because Dofus panels carry
 * gradients and item icons and a single background makes the residual grow
 * toward the ends of a wide crop until it swamps the signal.
 *
 * Three steps, and the second exists because the first is not enough on its
 * own. A low percentile per column assumes each column contains a decent number
 * of background rows — but a crop cut tight to the text does not: a column
 * falling on a vertical stroke can be ink almost top to bottom, and then *any*
 * percentile lands on the glyph and the "background" comes back as the
 * foreground colour. That failure is quiet and vicious: predicted and target
 * agree perfectly wherever the glyph is solid, so a wrong estimate can score
 * zero residual and look like a perfect read.
 *
 * So: a low percentile, then a horizontal min-filter to pull each column down
 * to the darkest nearby column — strokes are narrow and the panel between them
 * is visible, so a few columns away there is nearly always real background —
 * then a light smooth to restore the gradient the min-filter flattens.
 */
export const estimateBackground = (target: GrayImage): Float32Array => {
  const raw = new Float32Array(target.width)

  for (let x = 0; x < target.width; x += 1) {
    const column: number[] = []
    for (let y = 0; y < target.height; y += 1) column.push(target.data[y * target.width + x]!)
    column.sort((a, b) => a - b)
    // Low decile rather than quartile: text is the bright majority in an
    // ink-heavy column, so the estimate has to sit well below the midpoint.
    raw[x] = column[Math.floor(column.length * 0.1)]!
  }

  const floored = new Float32Array(target.width)
  for (let x = 0; x < target.width; x += 1) {
    let min = raw[x]!
    for (let dx = -BACKGROUND_MIN_RADIUS; dx <= BACKGROUND_MIN_RADIUS; dx += 1) {
      const nx = x + dx
      if (nx < 0 || nx >= target.width) continue
      if (raw[nx]! < min) min = raw[nx]!
    }
    floored[x] = min
  }

  // Box smooth over the same radius. Without it the min-filter leaves a
  // staircase that a real panel gradient does not have.
  const smoothed = new Float32Array(target.width)
  for (let x = 0; x < target.width; x += 1) {
    let sum = 0
    let count = 0
    for (let dx = -BACKGROUND_MIN_RADIUS; dx <= BACKGROUND_MIN_RADIUS; dx += 1) {
      const nx = x + dx
      if (nx < 0 || nx >= target.width) continue
      sum += floored[nx]!
      count += 1
    }
    smoothed[x] = sum / count
  }

  return smoothed
}

/** Coverage above this counts as ink for the purpose of scoring. */
const INK_THRESHOLD = 0.05

/**
 * Shaped-coverage cache.
 *
 * A search re-draws the same glyph at hundreds of positions with identical
 * parameters, and shaping it is the expensive part — a blur and a pow over
 * every pixel. Keying on the glyph object and a parameter signature turns that
 * into one computation per glyph per parameter set, which is the difference
 * between calibration taking a minute and taking an hour.
 *
 * A WeakMap on the glyph so atlases can be discarded without leaking.
 */
const shapedCache = new WeakMap<Float32Array, Map<string, Float32Array>>()

const shapeSignature = (params: RenderParams) =>
  `${params.dilate}|${params.softness}|${params.gamma}`

const shapeCoverageCached = (
  alpha: Float32Array,
  width: number,
  height: number,
  params: RenderParams,
): Float32Array => {
  let perGlyph = shapedCache.get(alpha)
  if (!perGlyph) {
    perGlyph = new Map()
    shapedCache.set(alpha, perGlyph)
  }

  const key = shapeSignature(params)
  const cached = perGlyph.get(key)
  if (cached) return cached

  const shaped = shapeCoverage(alpha, width, height, params)
  perGlyph.set(key, shaped)
  return shaped
}

/**
 * Composites a rendered line over the estimated background and scores it.
 *
 * Two normalisations, both of which testing proved necessary rather than nice:
 *
 * **Scored over ink, not over the canvas.** Averaging across every pixel
 * divides the disagreement by however much empty panel the crop happened to
 * include, so the same wrong digit scored ten times worse on a tight crop than
 * a loose one and no single threshold could serve both. The mask is the *union*
 * of the candidate's ink and the target's — union rather than the candidate's
 * alone, because a candidate that draws nothing would otherwise score perfectly
 * on its own empty mask, which is the most dangerous possible failure.
 *
 * **Divided by contrast.** Light text on a light panel differs less in absolute
 * luma than the same text on a dark one, so an absolute threshold silently
 * became stricter as panels got brighter. Dividing by the foreground-background
 * gap makes the number mean "what fraction of the available signal is
 * unexplained", which is comparable across profiles.
 *
 * Mean absolute error rather than squared: a squared metric is dominated by the
 * few pixels where a wrong glyph differs most, which sounds desirable but makes
 * the threshold hostage to one outlier pixel of anti-aliasing.
 */
export const residualFor = (
  target: GrayImage,
  rendered: RenderedLine,
  background: Float32Array,
  params: RenderParams,
): number => {
  const fg = lumaOf(params.foreground)
  const outline = lumaOf(params.outline)

  let total = 0
  let counted = 0
  let contrastSum = 0

  for (let y = 0; y < target.height; y += 1) {
    for (let x = 0; x < target.width; x += 1) {
      const i = y * target.width + x
      const cover = rendered.coverage[i]!
      const bg = background[x]!

      // Outline sits under the glyph: the background is darkened in proportion
      // to nearby coverage before the glyph itself is blended on top.
      const base = params.outlineStrength > 0
        ? bg + (outline - bg) * Math.min(1, cover * params.outlineStrength)
        : bg
      const predicted = base + (fg - base) * cover

      const contrast = Math.abs(fg - bg)
      // Target ink: brighter than its own column's background by enough that
      // noise alone would not explain it.
      const targetInk = contrast > 0 && Math.abs(target.data[i]! - bg) > contrast * INK_THRESHOLD
      if (cover <= INK_THRESHOLD && !targetInk) continue

      total += Math.abs(predicted - target.data[i]!)
      contrastSum += contrast
      counted += 1
    }
  }

  // Nothing inked anywhere: the candidate drew nothing and the crop is blank.
  // That is not a good fit, it is an absence of evidence, so it scores as the
  // worst possible rather than as zero.
  if (!counted) return Number.POSITIVE_INFINITY

  const meanContrast = contrastSum / counted
  if (meanContrast <= 0) return Number.POSITIVE_INFINITY

  return (total / counted) / meanContrast
}

export interface ReconstructOptions {
  /** Sub-pixel phases to try, as atlases keyed by phase. */
  atlases: GlyphAtlasRaster[]
  params: RenderParams
  /** Horizontal start positions to search, in whole pixels. */
  offsetRange?: { from: number; to: number }
  /** Baseline rows to search. */
  baselineRange?: { from: number; to: number }
}

/**
 * Best residual for one candidate over the search space.
 *
 * The search exists because the crop is cut by geometry that does not know
 * where the text starts. It is small and exhaustive rather than clever: a
 * gradient search over a non-convex pixel metric finds local minima and reports
 * a confident wrong answer, which is the one failure this design cannot admit.
 */
export const reconstructCandidate = (
  candidate: string,
  target: GrayImage,
  background: Float32Array,
  options: ReconstructOptions,
): ReconstructionResult | null => {
  const offsets = options.offsetRange ?? { from: 0, to: Math.max(0, target.width - 1) }
  const baselines = options.baselineRange ?? { from: 0, to: target.height - 1 }

  let best: ReconstructionResult | null = null

  for (const atlas of options.atlases) {
    for (let baselineY = baselines.from; baselineY <= baselines.to; baselineY += 1) {
      for (let offsetX = offsets.from; offsetX <= offsets.to; offsetX += 1) {
        // Whole-pixel placement. The sub-pixel part of the position lives in
        // the atlas raster — that is what a phase-specific atlas *is* — so
        // adding it here too would count it twice and then lose it to the
        // rounding inside `renderLine`, which is how a correctly drawn string
        // at phase 0.25 came back unexplained.
        const rendered = renderLine(
          candidate,
          atlas,
          options.params,
          target.width,
          target.height,
          offsetX,
          baselineY,
        )
        if (!rendered) return null

        const residual = residualFor(target, rendered, background, options.params)
        if (!best || residual < best.residual) {
          // Reported position is the true sub-pixel one: whole-pixel pen plus
          // the phase the winning atlas represents.
          best = { candidate, residual, offsetX: offsetX + atlas.phase, baselineY }
        }
      }
    }
  }

  return best
}

export interface VerificationOutcome {
  /** Whether the best candidate cleared both the residual and margin gates. */
  accepted: boolean
  best: ReconstructionResult | null
  /** The next-best *different* candidate, which sets the margin. */
  runnerUp: ReconstructionResult | null
  /**
   * How much better the winner is than the runner-up, in residual units.
   *
   * The quantity that decides whether a read is safe. A tiny residual with a
   * tiny margin means two strings explain the pixels nearly equally well, and
   * accepting either is a coin flip dressed up as a measurement.
   */
  margin: number
  reason: 'accepted' | 'residual-too-high' | 'margin-too-small' | 'no-candidates'
}

export interface VerifyOptions extends ReconstructOptions {
  /** Max residual to accept. Calibrated per profile, never hand-picked. */
  epsilon: number
  /** Min gap to the runner-up. Also calibrated. */
  minMargin: number
}

/**
 * Starting thresholds, measured on the synthetic profile.
 *
 * **These are placeholders, not answers.** They come from
 * `syntheticFont.ts` — a stand-in rasteriser — and their only job is to be
 * sane defaults until `calibrate.ts` fits real ones against real captures for
 * a real profile. Shipping them as though they were validated would be exactly
 * the overclaim this design exists to avoid.
 *
 * What the synthetic measurements showed, and why these numbers:
 * - A correct redraw scores 0.000; one wrong digit in a nine-character price
 *   scores 0.026. So the two are separated by a wide, measurable gap.
 * - The score is invariant to panel brightness: the same wrong digit scored
 *   0.0263 over backgrounds from luma 8 to 200. That invariance is the whole
 *   point of normalising by contrast.
 * - Under increasing noise the *residual* crosses epsilon (0.057 at noise 12)
 *   before the *margin* collapses to meaninglessness (0.007 at the same
 *   point). The two gates therefore fail in the right order: a degraded image
 *   is refused for being unexplained rather than sneaking through on a
 *   coin-flip margin.
 * - Margin shrinks as strings get longer, because the score is spread over
 *   more ink. `minMargin` is set below the nine-character value accordingly;
 *   a profile whose prices run longer needs its own calibration.
 */
export const SYNTHETIC_EPSILON = 0.05
export const SYNTHETIC_MIN_MARGIN = 0.012

/**
 * Picks between candidate strings, or refuses.
 *
 * Refusing is a normal outcome and a cheap one — the user re-hovers. Accepting
 * a wrong number is silent and permanent, and it poisons the baseline that
 * every later plausibility check depends on. The asymmetry is why both gates
 * are here and why neither is optional.
 */
export const verifyCandidates = (
  candidates: string[],
  target: GrayImage,
  options: VerifyOptions,
): VerificationOutcome => {
  const background = estimateBackground(target)
  const scored: ReconstructionResult[] = []

  for (const candidate of new Set(candidates)) {
    const result = reconstructCandidate(candidate, target, background, options)
    if (result) scored.push(result)
  }

  if (!scored.length) {
    return { accepted: false, best: null, runnerUp: null, margin: 0, reason: 'no-candidates' }
  }

  scored.sort((a, b) => a.residual - b.residual)
  const best = scored[0]!
  const runnerUp = scored.find((entry) => entry.candidate !== best.candidate) ?? null
  const margin = runnerUp ? runnerUp.residual - best.residual : Number.POSITIVE_INFINITY

  if (best.residual > options.epsilon) {
    return { accepted: false, best, runnerUp, margin, reason: 'residual-too-high' }
  }
  if (margin < options.minMargin) {
    return { accepted: false, best, runnerUp, margin, reason: 'margin-too-small' }
  }

  return { accepted: true, best, runnerUp, margin, reason: 'accepted' }
}
