// Where the learned glyphs live.
//
// The atlas is worth keeping: it is taught once from the user's own screen and
// is then valid until the client's font or UI scale changes. Losing it would
// mean sitting through the teaching step again, which is exactly the kind of
// repeated setup this whole feature exists to remove.

import { emptyAtlas } from './glyphMatch'
import type { GlyphAtlas } from './glyphMatch'

export const GLYPH_ATLAS_KEY = 'dofus-glyph-atlas-v1'

export const loadGlyphAtlas = (): GlyphAtlas => {
  if (!import.meta.client) return emptyAtlas()

  try {
    const raw = localStorage.getItem(GLYPH_ATLAS_KEY)
    if (!raw) return emptyAtlas()

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return emptyAtlas()

    return {
      glyphs: parsed.glyphs && typeof parsed.glyphs === 'object' ? parsed.glyphs : {},
      learnedHeight: Number(parsed.learnedHeight) || 0,
    }
  } catch {
    return emptyAtlas()
  }
}

export const saveGlyphAtlas = (atlas: GlyphAtlas) => {
  if (!import.meta.client) return
  localStorage.setItem(GLYPH_ATLAS_KEY, JSON.stringify(atlas))
}

/** How many distinct characters the atlas knows. */
export const atlasSize = (atlas: GlyphAtlas): number =>
  new Set(Object.values(atlas.glyphs)).size

/** Digits still missing, which is what the teaching step works through. */
export const missingDigits = (atlas: GlyphAtlas): string[] => {
  const known = new Set(Object.values(atlas.glyphs))
  return '0123456789'.split('').filter((digit) => !known.has(digit))
}

/** Whether the atlas can be relied on to read a price end to end. */
export const isAtlasReady = (atlas: GlyphAtlas): boolean =>
  missingDigits(atlas).length === 0
