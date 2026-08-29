import { describe, expect, it } from 'vitest'
import {
  calibrateRenderer,
  defaultCalibrationGrid,
  digitVariants,
  judgeEquivalence,
  measureSeparation,
  type CalibrationSample,
} from './calibrate'
import { renderLine, shapeCoverage } from './reconstruct'
import { syntheticAtlas, syntheticAtlases } from './syntheticFont'
import { defaultRenderParams, type GrayImage, type RenderParams } from './types'

const W = 100, H = 16, B = 13

/**
 * Paints a sample using *hidden* parameters, so calibration has something real
 * to recover rather than something it was told.
 */
const paintWith = (text: string, hidden: RenderParams, bg = 30, phase = 0): GrayImage => {
  const rendered = renderLine(text, syntheticAtlas(phase), hidden, W, H, 4, B)!
  const fg = hidden.foreground[0]! * 0.299 + hidden.foreground[1]! * 0.587 + hidden.foreground[2]! * 0.114
  const data = new Float32Array(W * H)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.min(255, Math.max(0, bg + (fg - bg) * rendered.coverage[i]!))
  }
  return { width: W, height: H, data }
}

const samplesFor = (hidden: RenderParams): CalibrationSample[] =>
  ['2 750 000', '145 900', '68 000', '1 234 567'].map((text) => ({
    image: paintWith(text, hidden),
    text,
  }))

describe('coverage shaping', () => {
  it('dilate fattens the stroke and negative dilate thins it', () => {
    const alpha = new Float32Array([0, 0.5, 1, 0.5, 0])
    const fat = shapeCoverage(alpha, 5, 1, { ...defaultRenderParams(), dilate: 0.2 })
    const thin = shapeCoverage(alpha, 5, 1, { ...defaultRenderParams(), dilate: -0.2 })
    expect(fat[1]!).toBeGreaterThan(alpha[1]!)
    expect(thin[1]!).toBeLessThan(alpha[1]!)
  })

  it('keeps coverage inside 0..1 however hard it is pushed', () => {
    const alpha = new Float32Array([0, 0.5, 1])
    const shaped = shapeCoverage(alpha, 3, 1, { ...defaultRenderParams(), dilate: 5 })
    for (const value of shaped) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
  })

  it('gamma below one lifts the mid-tones', () => {
    const alpha = new Float32Array([0.25])
    const lifted = shapeCoverage(alpha, 1, 1, { ...defaultRenderParams(), gamma: 0.5 })
    expect(lifted[0]!).toBeGreaterThan(0.25)
  })
})

describe('calibration recovers parameters it was not given', () => {
  it('fits a renderer it has never been told about', () => {
    // The honest version of the test: the samples are painted with parameters
    // the fitter does not receive, exactly as the real client's are unknown.
    const hidden: RenderParams = {
      ...defaultRenderParams(),
      foreground: [220, 220, 220],
      gamma: 1.2,
      dilate: 0.075,
      softness: 0,
      tracking: 0,
    }

    const result = calibrateRenderer(samplesFor(hidden), syntheticAtlases())!
    expect(result).toBeTruthy()
    // Not asserting parameter equality: several combinations can produce the
    // same pixels, and it is the *pixels* that matter. What must hold is that
    // the fit reproduces the samples.
    expect(result.meanResidual).toBeLessThan(0.02)
    expect(result.worstResidual).toBeLessThan(0.05)
  }, 60_000)

  it('recovers the foreground colour closely', () => {
    const hidden: RenderParams = {
      ...defaultRenderParams(),
      foreground: [200, 200, 200],
      gamma: 1,
    }
    const result = calibrateRenderer(samplesFor(hidden), syntheticAtlases())!
    expect(Math.abs(result.params.foreground[0]! - 200)).toBeLessThanOrEqual(20)
  }, 60_000)

  it('returns null when there is nothing to fit', () => {
    expect(calibrateRenderer([], syntheticAtlases())).toBeNull()
  })

  it('reports how much of the grid it searched', () => {
    const grid = defaultCalibrationGrid()
    const expected = grid.gamma.length * grid.dilate.length * grid.softness.length
      * grid.tracking.length * grid.foreground.length
    const result = calibrateRenderer(samplesFor(defaultRenderParams()), syntheticAtlases(), grid)!
    expect(result.evaluated).toBe(expected)
    // Generous, and deliberately so: this is an exhaustive grid search over a
    // non-convex residual surface, chosen over a gradient descent because a
    // descent finds a local minimum and reports it with the same confidence as
    // the global one. Slow and correct beats fast and occasionally certain of
    // the wrong renderer.
  }, 60_000)
})

describe('the equivalence gate', () => {
  const good = { params: defaultRenderParams(), meanResidual: 0.01, worstResidual: 0.02, residuals: [], evaluated: 1 }

  it('passes a model that reproduces the client closely', () => {
    expect(judgeEquivalence(good, { mean: 0.05, worst: 0.08 }).equivalent).toBe(true)
  })

  it('fails a model that is good on average but bad somewhere', () => {
    // The case an average alone would wave through, and the one that gets
    // misread in production.
    const lumpy = { ...good, meanResidual: 0.02, worstResidual: 0.4 }
    const verdict = judgeEquivalence(lumpy, { mean: 0.05, worst: 0.08 })
    expect(verdict.equivalent).toBe(false)
    expect(verdict.reason).toBe('worst-sample-too-high')
  })

  it('fails when no fit was found at all', () => {
    expect(judgeEquivalence(null, { mean: 1, worst: 1 }).reason).toBe('no-fit')
  })
})

describe('separation measurement', () => {
  it('finds no inversions on a well-fitted profile', () => {
    // An inversion — a wrong string fitting better than the right one —
    // invalidates a profile outright, because no threshold can rescue a model
    // that ranks the truth second.
    const params = defaultRenderParams()
    const report = measureSeparation(samplesFor(params), syntheticAtlases(), params, digitVariants)

    expect(report.samples).toBeGreaterThan(0)
    expect(report.inversions).toBe(0)
    expect(report.minMargin).toBeGreaterThan(0)
    expect(report.worstTruthResidual).toBeLessThan(0.01)
  })

  it('reports the tightest margin, not the average', () => {
    const params = defaultRenderParams()
    const report = measureSeparation(samplesFor(params), syntheticAtlases(), params, digitVariants)
    expect(report.minMargin).toBeLessThanOrEqual(report.medianMargin)
  })
})

describe('digit variants', () => {
  it('offers every single-digit substitution', () => {
    expect(digitVariants('12')).toHaveLength(18)
    expect(digitVariants('12')).toContain('92')
    expect(digitVariants('12')).toContain('19')
  })

  it('leaves separators alone', () => {
    // Only digits can be misread as other digits; a space is layout.
    expect(digitVariants('1 2').every((variant) => variant[1] === ' ')).toBe(true)
  })

  it('never proposes the truth as its own competitor', () => {
    expect(digitVariants('55')).not.toContain('55')
  })
})
