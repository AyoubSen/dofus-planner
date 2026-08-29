import { describe, expect, it } from 'vitest'
import { atlasSize, isAtlasReady, missingDigits } from './glyphAtlasStore'
import { emptyAtlas, teachGlyph } from './glyphMatch'

const withDigits = (digits: string) => {
  let atlas = emptyAtlas()
  digits.split('').forEach((digit, index) => {
    atlas = teachGlyph(atlas, `sig-${index}-${digit}`, digit)
  })
  return atlas
}

describe('atlas readiness', () => {
  it('starts knowing nothing', () => {
    expect(atlasSize(emptyAtlas())).toBe(0)
    expect(isAtlasReady(emptyAtlas())).toBe(false)
    expect(missingDigits(emptyAtlas())).toHaveLength(10)
  })

  it('is ready only once every digit is known', () => {
    expect(isAtlasReady(withDigits('012345678'))).toBe(false)
    expect(isAtlasReady(withDigits('0123456789'))).toBe(true)
  })

  it('names exactly which digits are still missing', () => {
    expect(missingDigits(withDigits('01234'))).toEqual(['5', '6', '7', '8', '9'])
  })

  it('counts characters, not signatures', () => {
    // The same digit rendered twice is two signatures but one character, and a
    // count of signatures would wrongly report the atlas as complete.
    let atlas = withDigits('0123456789')
    atlas = teachGlyph(atlas, 'another-shape-of-7', '7')
    expect(atlasSize(atlas)).toBe(10)
    expect(isAtlasReady(atlas)).toBe(true)
  })
})
