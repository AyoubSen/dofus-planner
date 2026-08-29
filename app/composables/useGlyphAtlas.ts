// Loading the profile's glyph atlas, once.
//
// The atlas is built from confirmed captures (see `scripts/build-atlas.mjs`)
// and served as a static asset keyed by profile, because pixels depend on
// resolution and scaling. Loading one profile's atlas and using it on another
// would read confidently and wrongly, so a miss is a miss: no atlas, no
// reconstruction, and the caller falls back to whatever it did before.

import { deserialiseAtlas, type SerialisedAtlas } from '~/utils/render/atlasFromCorpus'
import type { GlyphAtlasRaster } from '~/utils/render/types'

/** Identifies the pixel profile an atlas was built for. */
export const profileIdFor = (width: number, height: number, devicePixelRatio: number) =>
  `${width}x${height}@${devicePixelRatio}`

const cache = new Map<string, Promise<{ atlas: GlyphAtlasRaster; counts: Record<string, number> } | null>>()

export const useGlyphAtlas = () => {
  /**
   * Fetches the atlas for a profile, or null when none has been built.
   *
   * Cached per profile including the misses: a missing atlas is the normal
   * state until enough captures have been confirmed, and re-requesting it on
   * every capture would be a request per hotkey press for a file that is not
   * there.
   */
  const load = (profileId: string) => {
    const existing = cache.get(profileId)
    if (existing) return existing

    const request = (async () => {
      try {
        const data = await $fetch<SerialisedAtlas>(`/atlas/${profileId}.json`)
        if (!data?.glyphs?.length) return null
        // An atlas that has not met its evidence bar is not used at all. A
        // single example of a digit averages into something too vague to
        // discriminate, and the reader then accepts garbage with a
        // comfortable-looking score — measured, not hypothetical: one such
        // atlas read `3 599 999` as `3601011` and called it clean.
        if (data.ready === false) return null
        return { atlas: deserialiseAtlas(data), counts: data.counts || {} }
      } catch {
        return null
      }
    })()

    cache.set(profileId, request)
    return request
  }

  /** Digits with no example behind them. Prices containing them will refuse. */
  const missingDigits = (counts: Record<string, number>) =>
    [...'0123456789'].filter((digit) => !counts[digit])

  return { load, missingDigits }
}
