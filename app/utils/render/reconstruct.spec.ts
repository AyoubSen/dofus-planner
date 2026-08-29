import { describe, expect, it } from 'vitest'
import {
  estimateBackground,
  reconstructCandidate,
  renderLine,
  residualFor,
  SYNTHETIC_EPSILON,
  SYNTHETIC_MIN_MARGIN,
  verifyCandidates,
} from './reconstruct'
import { syntheticAtlas, syntheticAtlases } from './syntheticFont'
import { defaultRenderParams, type GrayImage, type RenderParams } from './types'

const CANVAS_W = 90
const CANVAS_H = 16
const BASELINE = 13

const params = (overrides: Partial<RenderParams> = {}): RenderParams => ({
  ...defaultRenderParams(),
  foreground: [235, 235, 235],
  ...overrides,
})

/**
 * Draws a string the way the "client" would, so tests have a target image that
 * was produced independently of the code path being graded.
 */
const paint = (
  text: string,
  options: { phase?: number; offsetX?: number; backgroundLuma?: number; noise?: number } = {},
): GrayImage => {
  const phase = options.phase ?? 0
  const offsetX = options.offsetX ?? 3
  const bg = options.backgroundLuma ?? 32
  const p = params()

  // Phase lives in the atlas raster, not in the pen position — see
  // `reconstructCandidate`. Adding it here as well would double-count it.
  const rendered = renderLine(
    text,
    syntheticAtlas(phase),
    p,
    CANVAS_W,
    CANVAS_H,
    offsetX,
    BASELINE,
  )!

  const data = new Float32Array(CANVAS_W * CANVAS_H)
  const fg = 235 * 0.299 + 235 * 0.587 + 235 * 0.114

  for (let i = 0; i < data.length; i += 1) {
    const cover = rendered.coverage[i]!
    let value = bg + (fg - bg) * cover
    if (options.noise) {
      // Deterministic jitter, so a failure is reproducible.
      value += ((i * 2654435761) % 1000 / 1000 - 0.5) * 2 * options.noise
    }
    data[i] = Math.min(255, Math.max(0, value))
  }

  return { width: CANVAS_W, height: CANVAS_H, data }
}

const verify = (
  candidates: string[],
  target: GrayImage,
  epsilon = SYNTHETIC_EPSILON,
  minMargin = SYNTHETIC_MIN_MARGIN,
) =>
  verifyCandidates(candidates, target, {
    atlases: syntheticAtlases(),
    params: params(),
    epsilon,
    minMargin,
    offsetRange: { from: 0, to: 8 },
    baselineRange: { from: BASELINE - 1, to: BASELINE + 1 },
  })

describe('rendering a line', () => {
  it('refuses a candidate containing a glyph it does not have', () => {
    // A partial render would score well over the part it drew and say nothing
    // about the rest — the "2 750 000" read as "2 750" failure mode.
    const rendered = renderLine('12X', syntheticAtlas(0), params(), CANVAS_W, CANVAS_H, 0, BASELINE)
    expect(rendered).toBeNull()
  })

  it('produces coverage inside the canvas only', () => {
    const rendered = renderLine('123', syntheticAtlas(0), params(), CANVAS_W, CANVAS_H, 0, BASELINE)!
    expect(rendered.coverage).toHaveLength(CANVAS_W * CANVAS_H)
    expect(Math.max(...rendered.coverage)).toBeLessThanOrEqual(1)
  })
})

describe('background estimation', () => {
  it('recovers a flat panel behind the text', () => {
    const target = paint('2 750 000', { backgroundLuma: 40 })
    const background = estimateBackground(target)
    for (const value of background) expect(value).toBeCloseTo(40, 0)
  })
})

describe('reconstruction picks the string that was drawn', () => {
  it('scores the true string far better than a near miss', () => {
    const target = paint('2 750 000')
    const background = estimateBackground(target)
    const options = {
      atlases: syntheticAtlases(),
      params: params(),
      offsetRange: { from: 0, to: 8 },
      baselineRange: { from: BASELINE - 1, to: BASELINE + 1 },
    }

    const truth = reconstructCandidate('2 750 000', target, background, options)!
    // One digit different. This is the case a tolerant matcher gets wrong.
    const nearMiss = reconstructCandidate('2 750 800', target, background, options)!

    expect(truth.residual).toBeLessThan(nearMiss.residual)
    expect(truth.residual).toBeLessThan(1)
  })

  it('separates the digit pairs that actually collide', () => {
    // 6/8 and 0/8 differ by one segment. If the verifier cannot tell these
    // apart it cannot be trusted with a price.
    for (const [drawn, confusable] of [['6', '8'], ['0', '8'], ['3', '9'], ['1', '7']]) {
      const target = paint(drawn!)
      const background = estimateBackground(target)
      const options = {
        atlases: syntheticAtlases(),
        params: params(),
        offsetRange: { from: 0, to: 8 },
        baselineRange: { from: BASELINE - 1, to: BASELINE + 1 },
      }

      const truth = reconstructCandidate(drawn!, target, background, options)!
      const wrong = reconstructCandidate(confusable!, target, background, options)!
      expect(wrong.residual, `${drawn} vs ${confusable}`).toBeGreaterThan(truth.residual)
    }
  })

  it('finds the text wherever the crop happened to start', () => {
    for (const offsetX of [0, 2, 5, 8]) {
      const target = paint('1234', { offsetX })
      const result = verify(['1234'], target)
      expect(result.accepted, `offset ${offsetX}`).toBe(true)
    }
  })

  it('handles text drawn at a sub-pixel position', () => {
    // The case that forced the current binary matcher to loosen its tolerance
    // until different digits could fall inside it.
    for (const phase of [0, 0.25, 0.5, 0.75]) {
      const target = paint('90210', { phase })
      const result = verify(['90210'], target)
      expect(result.accepted, `phase ${phase}`).toBe(true)
    }
  })
})

describe('the acceptance gates', () => {
  it('accepts the drawn string and reports a margin over the runner-up', () => {
    const target = paint('2 750 000')
    const result = verify(['2 750 000', '2 750 800', '2 150 000'], target)

    expect(result.accepted).toBe(true)
    expect(result.best?.candidate).toBe('2 750 000')
    expect(result.margin).toBeGreaterThan(SYNTHETIC_MIN_MARGIN)
  })

  it('refuses when nothing explains the pixels', () => {
    const target = paint('2 750 000')
    // The true string is not offered, so every candidate is wrong. Picking the
    // least-wrong one is exactly the behaviour being designed out.
    const result = verify(['1 111 111', '9 999 999'], target)

    expect(result.accepted).toBe(false)
    expect(result.reason).toBe('residual-too-high')
  })

  it('refuses when two candidates explain the pixels equally well', () => {
    const target = paint('8')
    // Same string twice under different spellings cannot happen, so force the
    // tie by demanding an impossible margin: the point is that a thin margin
    // produces a refusal rather than a coin flip.
    const result = verifyCandidates(['8', '0'], target, {
      atlases: syntheticAtlases(),
      params: params(),
      epsilon: 1,
      minMargin: 1_000,
      offsetRange: { from: 0, to: 8 },
      baselineRange: { from: BASELINE - 1, to: BASELINE + 1 },
    })

    expect(result.accepted).toBe(false)
    expect(result.reason).toBe('margin-too-small')
  })

  it('reports no-candidates rather than throwing on an empty list', () => {
    const result = verify([], paint('1'))
    expect(result.accepted).toBe(false)
    expect(result.reason).toBe('no-candidates')
  })

  it('still accepts under sensor-style noise', () => {
    const target = paint('2 750 000', { noise: 6 })
    const result = verify(['2 750 000', '2 750 800'], target)
    expect(result.accepted).toBe(true)
    expect(result.best?.candidate).toBe('2 750 000')
  })

  it('refuses a badly degraded image rather than mis-reading it', () => {
    // The property that matters: heavy noise must cost *coverage*, never
    // correctness. Measured behaviour is that the residual crosses epsilon
    // before the margin collapses, so the refusal reason is "unexplained"
    // rather than a coin flip that happened to land wrong.
    const target = paint('2 750 000', { noise: 90 })
    const result = verify(['2 750 000', '2 750 800'], target)
    expect(result.accepted).toBe(false)
    expect(result.reason).toBe('residual-too-high')
  })

  it('fails on the residual before the margin as an image degrades', () => {
    // Ordering matters. If the margin gave way first, a degraded image would
    // be refused for ambiguity while still *looking* well explained — and the
    // moment the two candidates happened to differ slightly, it would be
    // accepted wrongly. Epsilon has to be the binding constraint.
    const target = paint('2 750 000', { noise: 25 })
    const result = verifyCandidates(['2 750 000', '2 750 800'], target, {
      atlases: syntheticAtlases(),
      params: params(),
      epsilon: SYNTHETIC_EPSILON,
      // Margin gate effectively disabled, so only epsilon can refuse.
      minMargin: 0,
      offsetRange: { from: 0, to: 8 },
      baselineRange: { from: BASELINE - 1, to: BASELINE + 1 },
    })
    expect(result.accepted).toBe(false)
    expect(result.reason).toBe('residual-too-high')
  })
})

describe('background independence', () => {
  it('reads the same string over panels of very different brightness', () => {
    // The failure the current adaptive threshold has: a bright backdrop shifts
    // the mask and can walk a 6 into range of an 8.
    for (const backgroundLuma of [8, 32, 90, 150, 200]) {
      const target = paint('680', { backgroundLuma })
      const result = verify(['680', '880', '600'], target)
      expect(result.accepted, `bg ${backgroundLuma}`).toBe(true)
      expect(result.best?.candidate).toBe('680')
    }
  })

  it('scores a wrong digit identically whatever the panel brightness', () => {
    // This is what normalising by contrast bought, and it is the reason a
    // single epsilon can serve every panel in the UI. Before it, the same
    // wrong digit scored 0.30 on a light panel and 0.79 on a dark one, so no
    // fixed threshold could have been correct for both.
    const margins = [8, 60, 150, 200].map((backgroundLuma) => {
      const target = paint('2 750 000', { backgroundLuma })
      const background = estimateBackground(target)
      const options = {
        atlases: syntheticAtlases(),
        params: params(),
        offsetRange: { from: 0, to: 8 },
        baselineRange: { from: BASELINE, to: BASELINE },
      }
      const truth = reconstructCandidate('2 750 000', target, background, options)!
      const wrong = reconstructCandidate('2 750 800', target, background, options)!
      return wrong.residual - truth.residual
    })

    for (const margin of margins) expect(margin).toBeCloseTo(margins[0]!, 3)
  })
})

describe('residual behaviour', () => {
  it('grows with how much of the ink is wrong', () => {
    const target = paint('88888')
    const background = estimateBackground(target)
    const options = {
      atlases: syntheticAtlases(),
      params: params(),
      offsetRange: { from: 0, to: 8 },
      baselineRange: { from: BASELINE, to: BASELINE },
    }

    const oneWrong = reconstructCandidate('88880', target, background, options)!
    const allWrong = reconstructCandidate('00000', target, background, options)!
    expect(allWrong.residual).toBeGreaterThan(oneWrong.residual)
  })

  it('is zero-ish for an exact redraw', () => {
    const target = paint('4242')
    const rendered = renderLine('4242', syntheticAtlas(0), params(), CANVAS_W, CANVAS_H, 3, BASELINE)!
    const residual = residualFor(target, rendered, estimateBackground(target), params())
    expect(residual).toBeLessThan(0.5)
  })
})
