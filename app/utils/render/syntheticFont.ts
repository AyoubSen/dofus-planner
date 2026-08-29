// A stand-in font, so the verifier can be tested before the real one exists.
//
// Phase 1a has a hard dependency the schedule cannot remove: validating the
// renderer model against Dofus needs captures from the Dofus client, and those
// only accumulate as the app is used. That would leave the machinery untested
// until then, which is the wrong order — a verifier with a bug in it would be
// discovered *while* interpreting real data, and every conclusion drawn before
// that point would be suspect.
//
// So the machinery is validated first, against a rasteriser whose output we
// control completely. A synthetic seven-segment digit set is enough to prove
// the properties that matter: that the right string reconstructs, that wrong
// strings do not, that the margin behaves, and that calibration recovers
// parameters it was not told. None of that depends on the glyphs being Dofus's.
//
// When the real atlas arrives it implements the same `GlyphCoverage` shape and
// nothing downstream changes. That is the point of keeping this separate.

import type { GlyphAtlasRaster, GlyphCoverage } from './types'

/**
 * Seven-segment layout, because the digit pairs it confuses are the ones that
 * matter: 6/8 and 0/8 differ by a single segment, exactly the discrimination a
 * real reader has to make and the one a tolerant matcher gets wrong.
 */
const SEGMENTS: Record<string, string[]> = {
  '0': ['top', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'bottom'],
  '1': ['topRight', 'bottomRight'],
  '2': ['top', 'topRight', 'middle', 'bottomLeft', 'bottom'],
  '3': ['top', 'topRight', 'middle', 'bottomRight', 'bottom'],
  '4': ['topLeft', 'topRight', 'middle', 'bottomRight'],
  '5': ['top', 'topLeft', 'middle', 'bottomRight', 'bottom'],
  '6': ['top', 'topLeft', 'middle', 'bottomLeft', 'bottomRight', 'bottom'],
  '7': ['top', 'topRight', 'bottomRight'],
  '8': ['top', 'topLeft', 'topRight', 'middle', 'bottomLeft', 'bottomRight', 'bottom'],
  '9': ['top', 'topLeft', 'topRight', 'middle', 'bottomRight', 'bottom'],
}

const GLYPH_WIDTH = 7
const GLYPH_HEIGHT = 13

const drawSegment = (alpha: Float32Array, segment: string) => {
  const put = (x: number, y: number) => {
    if (x < 0 || x >= GLYPH_WIDTH || y < 0 || y >= GLYPH_HEIGHT) return
    alpha[y * GLYPH_WIDTH + x] = 1
  }

  const midY = (GLYPH_HEIGHT - 1) >> 1
  const last = GLYPH_HEIGHT - 1
  const right = GLYPH_WIDTH - 1

  switch (segment) {
    case 'top': for (let x = 1; x < right; x += 1) put(x, 0); break
    case 'middle': for (let x = 1; x < right; x += 1) put(x, midY); break
    case 'bottom': for (let x = 1; x < right; x += 1) put(x, last); break
    case 'topLeft': for (let y = 1; y < midY; y += 1) put(0, y); break
    case 'topRight': for (let y = 1; y < midY; y += 1) put(right, y); break
    case 'bottomLeft': for (let y = midY + 1; y < last; y += 1) put(0, y); break
    case 'bottomRight': for (let y = midY + 1; y < last; y += 1) put(right, y); break
  }
}

/**
 * Renders one glyph at a sub-pixel horizontal phase.
 *
 * The phase is what makes anti-aliased text hard: at a fractional position the
 * same glyph produces different pixels, which is why a binary signature of the
 * kind the current atlas uses had to be given a tolerance so wide that
 * different digits could fall inside it. Modelling the phase explicitly means
 * the tolerance can instead be tightened.
 */
const rasteriseDigit = (char: string, phase: number): GlyphCoverage => {
  const crisp = new Float32Array(GLYPH_WIDTH * GLYPH_HEIGHT)
  for (const segment of SEGMENTS[char] || []) drawSegment(crisp, segment)

  // Shift by `phase` with linear interpolation — the coverage a rasteriser
  // computes for a stroke that lands between two pixel centres.
  const width = GLYPH_WIDTH + 1
  const alpha = new Float32Array(width * GLYPH_HEIGHT)

  for (let y = 0; y < GLYPH_HEIGHT; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const left = x - 1 >= 0 && x - 1 < GLYPH_WIDTH ? crisp[y * GLYPH_WIDTH + (x - 1)]! : 0
      const here = x < GLYPH_WIDTH ? crisp[y * GLYPH_WIDTH + x]! : 0
      alpha[y * width + x] = here * (1 - phase) + left * phase
    }
  }

  return {
    char,
    width,
    height: GLYPH_HEIGHT,
    alpha,
    advance: GLYPH_WIDTH + 1,
    bearingY: GLYPH_HEIGHT - 1,
  }
}

/** A space, so grouped thousands lay out like the French client writes them. */
const spaceGlyph = (): GlyphCoverage => ({
  char: ' ',
  width: 1,
  height: GLYPH_HEIGHT,
  alpha: new Float32Array(GLYPH_HEIGHT),
  advance: 4,
  bearingY: GLYPH_HEIGHT - 1,
})

export const SYNTHETIC_PROFILE_ID = 'synthetic-7seg-v1'

/** Builds the stand-in atlas at one sub-pixel phase. */
export const syntheticAtlas = (phase: number): GlyphAtlasRaster => {
  const glyphs = new Map<string, GlyphCoverage>()
  for (const char of Object.keys(SEGMENTS)) glyphs.set(char, rasteriseDigit(char, phase))
  glyphs.set(' ', spaceGlyph())

  return { profileId: SYNTHETIC_PROFILE_ID, phase, pixelSize: GLYPH_HEIGHT, glyphs }
}

/** The phases a search covers. Quarter-pixel is enough at UI text sizes. */
export const SYNTHETIC_PHASES = [0, 0.25, 0.5, 0.75]

export const syntheticAtlases = (): GlyphAtlasRaster[] =>
  SYNTHETIC_PHASES.map((phase) => syntheticAtlas(phase))
