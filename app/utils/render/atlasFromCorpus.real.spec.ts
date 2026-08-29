import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { atlasReadiness, buildAtlasFromSamples } from './atlasFromCorpus'
import { toGrayImage } from './reconstruct'
import type { GrayImage } from './types'

// Builds the atlas from the real archive and reports what it got.
//
// Not a pass/fail on recognition — it is the measurement that says whether a
// real atlas is obtainable from the captures on hand at all, and which digits
// are still missing. Skipped when the archive is empty so a fresh clone passes.

const CORPUS = 'corpus'
const hasCorpus = existsSync(CORPUS) && readdirSync(CORPUS).length > 0

const loadConfirmed = async (): Promise<Array<{ colour: { width: number; height: number; data: Uint8ClampedArray }; image: GrayImage; truth: string }>> => {
  const sharp = (await import('sharp')).default
  const samples: Array<{ colour: { width: number; height: number; data: Uint8ClampedArray }; image: GrayImage; truth: string }> = []

  for (const dir of readdirSync(CORPUS)) {
    const manifestPath = join(CORPUS, dir, 'sample.json')
    const stripPath = join(CORPUS, dir, 'strip.png')
    if (!existsSync(manifestPath) || !existsSync(stripPath)) continue

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (typeof manifest.truth !== 'number') continue

    const { data, info } = await sharp(stripPath).ensureAlpha().raw()
      .toBuffer({ resolveWithObject: true })

    samples.push({
      colour: { width: info.width, height: info.height, data: new Uint8ClampedArray(data) },
      image: toGrayImage(new Uint8ClampedArray(data), info.width, info.height),
      // The client writes thousands separated, and the alignment step keys off
      // exactly where those separators fall.
      truth: manifest.truth.toLocaleString('fr-FR').replace(/ | /g, ' '),
    })
  }

  return samples
}

describe.skipIf(!hasCorpus)('atlas from real captures', () => {
  it('reports what the archive can currently teach', async () => {
    const samples = await loadConfirmed()
    const result = buildAtlasFromSamples(samples, 'dofus-1920x1080')
    const readiness = atlasReadiness(result)

    // Written out rather than only asserted: the point of this run is the
    // report, and a number nobody can read is not a measurement.
    writeFileSync('atlas-report.json', JSON.stringify({
      confirmedSamples: samples.length,
      used: result.used,
      skipped: result.skipped,
      counts: result.counts,
      ready: readiness.ready,
      missing: readiness.missing,
      thin: readiness.thin,
      glyphSizes: Object.fromEntries(
        [...result.atlas.glyphs].map(([char, glyph]) => [char, `${glyph.width}x${glyph.height}`]),
      ),
      advance: [...result.atlas.glyphs.values()][0]?.advance ?? 0,
    }, null, 2))

    expect(samples.length).toBeGreaterThan(0)
  }, 120_000)
})
