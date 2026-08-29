import { describe, expect, it } from 'vitest'
import {
  GLYPH_MATCH_TOLERANCE,
  emptyAtlas,
  glyphSignature,
  inkMask,
  matchGlyph,
  readLine,
  segmentGlyphs,
  signatureDistance,
  teachGlyph,
  unknownGlyphs,
} from './glyphMatch'

/**
 * A tiny 5x7 bitmap font, enough to prove the mechanics. Each row is a string
 * where '#' is ink — the same way the game renders text: exact pixels.
 */
const FONT: Record<string, string[]> = {
  '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '..##.', '.#...', '#....', '#####'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '#...#', '.###.'],
}

/** Renders text into an RGBA buffer, the way the client would. */
const render = (text: string, options: { gap?: number; spaceWidth?: number } = {}) => {
  const gap = options.gap ?? 1
  const spaceWidth = options.spaceWidth ?? 5
  const height = 7 + 2

  const columns: string[][] = []
  for (const character of text) {
    if (character === ' ') {
      for (let i = 0; i < spaceWidth; i += 1) columns.push(new Array(7).fill('.'))
      continue
    }
    const glyph = FONT[character]
    if (!glyph) throw new Error(`no test glyph for "${character}"`)
    for (let x = 0; x < 5; x += 1) {
      columns.push(glyph.map((row) => row[x]!))
    }
    for (let i = 0; i < gap; i += 1) columns.push(new Array(7).fill('.'))
  }

  const width = columns.length
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      // One row of padding top and bottom, as any UI leaves.
      const ink = y >= 1 && y <= 7 && columns[x]![y - 1] === '#'
      const value = ink ? 235 : 30
      const i = (y * width + x) * 4
      data[i] = value
      data[i + 1] = value
      data[i + 2] = value
      data[i + 3] = 255
    }
  }

  return { data, width, height }
}

const maskFor = (text: string, options?: { gap?: number; spaceWidth?: number }) => {
  const { data, width, height } = render(text, options)
  return { mask: inkMask(data, width, height), width, height }
}

/** Teaches the atlas every digit in the sample, using known text. */
const learn = (sample: string) => {
  const { mask, width, height } = maskFor(sample)
  const boxes = segmentGlyphs(mask, width, height)
  const characters = sample.replace(/ /g, '').split('')

  let atlas = emptyAtlas()
  boxes.forEach((box, index) => {
    atlas = teachGlyph(atlas, box.signature, characters[index]!)
  })
  return atlas
}

describe('ink detection', () => {
  it('separates text from the panel behind it', () => {
    const { mask, width, height } = maskFor('7')
    expect(mask.filter(Boolean).length).toBeGreaterThan(0)
    expect(mask.filter(Boolean).length).toBeLessThan(width * height)
  })
})

describe('segmentation', () => {
  it('finds one box per character', () => {
    const { mask, width, height } = maskFor('2750')
    expect(segmentGlyphs(mask, width, height)).toHaveLength(4)
  })

  it('is not confused by the spaces between thousands', () => {
    const { mask, width, height } = maskFor('2 750 000')
    expect(segmentGlyphs(mask, width, height)).toHaveLength(7)
  })
})

describe('signatures', () => {
  it('gives the same character the same signature wherever it appears', () => {
    const { mask, width, height } = maskFor('707')
    const boxes = segmentGlyphs(mask, width, height)
    expect(boxes[0]!.signature).toBe(boxes[2]!.signature)
  })

  it('gives different characters different signatures', () => {
    const { mask, width, height } = maskFor('70')
    const boxes = segmentGlyphs(mask, width, height)
    expect(signatureDistance(boxes[0]!.signature, boxes[1]!.signature))
      .toBeGreaterThan(GLYPH_MATCH_TOLERANCE)
  })
})

describe('reading a price', () => {
  const atlas = learn('0125 79')

  it('reads the exact string that defeated the recognizer', () => {
    // "2 750 000" came back as "2750 000" from Tesseract, and once as
    // "sessarr ge". The same pixels must always give the same answer.
    const { mask, width, height } = maskFor('2 750 000')
    const result = readLine(atlas, mask, width, height)
    expect(result.text).toBe('2 750 000')
    expect(result.complete).toBe(true)
  })

  it('reads the same price identically every time', () => {
    const reads = new Set<string>()
    for (let i = 0; i < 20; i += 1) {
      const { mask, width, height } = maskFor('2 599 999')
      reads.add(readLine(atlas, mask, width, height).text)
    }
    expect([...reads]).toEqual(['2 599 999'])
  })

  it('keeps the thousands separators, which is what truncated prices', () => {
    const { mask, width, height } = maskFor('2 500 000')
    expect(readLine(atlas, mask, width, height).text).toBe('2 500 000')
  })

  it('reads a price with no separators at all', () => {
    const { mask, width, height } = maskFor('2750000')
    expect(readLine(atlas, mask, width, height).text).toBe('2750000')
  })
})

describe('an unknown glyph is refused, never guessed', () => {
  const atlas = learn('012')

  it('marks what it does not know rather than inventing a digit', () => {
    const { mask, width, height } = maskFor('7')
    const result = readLine(atlas, mask, width, height)
    expect(result.text).toBe('?')
    expect(result.complete).toBe(false)
  })

  it('reports which glyphs still need teaching, without duplicates', () => {
    const { mask, width, height } = maskFor('7 795')
    const boxes = segmentGlyphs(mask, width, height)
    const unknown = unknownGlyphs(atlas, boxes)
    // 7, 9 and 5 are unknown; the second 7 is the same glyph as the first.
    expect(unknown).toHaveLength(3)
  })

  it('learns a glyph and then reads it', () => {
    const { mask, width, height } = maskFor('7')
    const box = segmentGlyphs(mask, width, height)[0]!
    expect(matchGlyph(atlas, box.signature)).toBeNull()

    const taught = teachGlyph(atlas, box.signature, '7')
    expect(matchGlyph(taught, box.signature)).toBe('7')
  })
})

describe('tolerance to a stray pixel', () => {
  it('still recognises a glyph with one edge pixel different', () => {
    const atlas = learn('0125 79')
    const { data, width, height } = render('7')
    // Nudge a single pixel, as anti-aliasing over a different backdrop would.
    data[(2 * width + 2) * 4] = 120
    const mask = inkMask(data, width, height)
    const result = readLine(atlas, mask, width, height)
    expect(result.text).toBe('7')
  })
})
