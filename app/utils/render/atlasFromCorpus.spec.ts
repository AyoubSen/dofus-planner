import { describe, expect, it } from 'vitest'
import {
  atlasReadiness,
  deserialiseAtlas,
  serialiseAtlas,
  subdivideByPitch,
  type AtlasBuildResult,
  type GlyphSlice,
} from './atlasFromCorpus'

const slice = (x0: number, x1: number): GlyphSlice => ({ x0, x1, y0: 0, y1: 9 })

const buildResult = (counts: Record<string, number>): AtlasBuildResult => ({
  atlas: {
    profileId: 'test',
    phase: 0,
    pixelSize: 10,
    glyphs: new Map(Object.keys(counts).map((char) => [char, {
      char,
      width: 8,
      height: 10,
      alpha: new Float32Array(80).fill(0.5),
      advance: 9,
      bearingY: 9,
    }])),
  },
  counts,
  skipped: 0,
  used: 1,
})

describe('splitting merged digit runs', () => {
  it('splits a run of touching digits by solved pitch', () => {
    // Adjacent digits touch in this font, so a 16-pixel run is two glyphs and
    // no threshold can find the seam. The known digit count solves the pitch.
    const parts = subdivideByPitch([slice(0, 7), slice(11, 26)], 3)!
    expect(parts).toHaveLength(3)
  })

  it('refuses when no pitch reproduces the expected digit count', () => {
    // Better to decline than to cut a run at the wrong places and teach the
    // atlas glyphs that are two halves of different digits.
    expect(subdivideByPitch([slice(0, 7)], 5)).toBeNull()
  })

  it('handles a triple-wide run', () => {
    expect(subdivideByPitch([slice(0, 24)], 3)!).toHaveLength(3)
  })

  it('keeps parts inside the run they came from', () => {
    const parts = subdivideByPitch([slice(10, 25)], 2)!
    expect(parts[0]!.x0).toBeGreaterThanOrEqual(10)
    expect(parts[parts.length - 1]!.x1).toBeLessThanOrEqual(25)
  })

  it('returns null for an empty slice list', () => {
    expect(subdivideByPitch([], 3)).toBeNull()
  })
})

describe('readiness', () => {
  const full = Object.fromEntries([...'0123456789'].map((d) => [d, 10]))

  it('accepts an atlas with real evidence behind every digit', () => {
    expect(atlasReadiness(buildResult(full)).ready).toBe(true)
  })

  // Measured, not hypothetical: an atlas holding one `6` and one `1` read
  // 3 599 999 as 3601011 and reported it as a clean read.
  it('rejects an atlas resting on a single example of a digit', () => {
    const thin = { ...full, 6: 1, 1: 1 }
    const readiness = atlasReadiness(buildResult(thin))
    expect(readiness.ready).toBe(false)
    expect(readiness.thin).toContain('6')
  })

  // Also measured: an atlas with no 2 and no 6 refused all eight prices
  // containing them, and read 24 of 30 held-out captures correctly with zero
  // errors. Missing digits cost coverage, not correctness.
  it('accepts an atlas that is merely missing digits', () => {
    const partial = { ...full }
    delete partial['2']
    delete partial['6']
    const readiness = atlasReadiness(buildResult(partial))
    expect(readiness.ready).toBe(true)
    expect(readiness.missing).toEqual(['2', '6'])
  })

  it('rejects an atlas that knows almost nothing', () => {
    expect(atlasReadiness(buildResult({ 0: 5, 1: 5 })).ready).toBe(false)
  })
})

describe('serialisation', () => {
  it('round-trips glyph coverage', () => {
    const result = buildResult({ 0: 5, 1: 5, 2: 5, 3: 5 })
    const restored = deserialiseAtlas(serialiseAtlas(result))

    expect(restored.glyphs.size).toBe(4)
    const glyph = restored.glyphs.get('0')!
    expect(glyph.width).toBe(8)
    expect(glyph.alpha[0]).toBeCloseTo(0.5, 2)
  })

  it('carries the readiness verdict with the atlas', () => {
    // The consumer must not have to re-derive it: an atlas shipped without its
    // verdict is one a caller will use because it looks like data.
    const thin = serialiseAtlas(buildResult({ 0: 5, 1: 1, 2: 5, 3: 5 }))
    expect(thin.ready).toBe(false)
    expect(thin.thin).toContain('1')
  })
})
