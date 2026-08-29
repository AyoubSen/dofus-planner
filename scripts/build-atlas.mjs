#!/usr/bin/env node
// Builds the glyph atlas from confirmed captures and ships it as an asset.
//
//   node scripts/build-atlas.mjs
//
// Reads every corpus sample whose price has been confirmed, cuts the digits out
// of the client's own pixels, averages them, and writes the result to
// public/atlas/. The app fetches it at runtime and reads prices by
// reconstruction instead of by statistical OCR.
//
// The atlas is deliberately *not* committed: it is derived from one player's
// captures at one resolution, and a stale one shipped to a different profile
// would read confidently and wrongly. Rebuild it whenever the corpus grows.

import { mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const { createJiti } = await import('jiti')

const jiti = createJiti(import.meta.url)
const { buildAtlasFromSamples, serialiseAtlas, atlasReadiness } = await jiti.import('../app/utils/render/atlasFromCorpus.ts')
const { toGrayImage } = await jiti.import('../app/utils/render/reconstruct.ts')

const CORPUS = 'corpus'
const OUT_DIR = join('public', 'atlas')

const main = async () => {
  if (!existsSync(CORPUS)) {
    console.log('No corpus/ directory. Capture and confirm some listings first.')
    process.exit(0)
  }

  const sharp = (await import('sharp')).default
  const byProfile = new Map()

  for (const dir of readdirSync(CORPUS)) {
    const manifestPath = join(CORPUS, dir, 'sample.json')
    const stripPath = join(CORPUS, dir, 'strip.png')
    if (!existsSync(manifestPath) || !existsSync(stripPath)) continue

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (typeof manifest.truth !== 'number') continue

    // Profiles are never mixed: pixels depend on resolution and scaling, and an
    // atlas averaged across two of them is a blur of neither.
    const profileId = `${manifest.profile?.screenWidth ?? 0}x${manifest.profile?.screenHeight ?? 0}`
      + `@${manifest.profile?.devicePixelRatio ?? 1}`

    const { data, info } = await sharp(stripPath).ensureAlpha().raw()
      .toBuffer({ resolveWithObject: true })
    const bytes = new Uint8ClampedArray(data)

    if (!byProfile.has(profileId)) byProfile.set(profileId, [])
    byProfile.get(profileId).push({
      colour: { width: info.width, height: info.height, data: bytes },
      image: toGrayImage(bytes, info.width, info.height),
      truth: manifest.truth.toLocaleString('fr-FR').replace(/ | /g, ' '),
    })
  }

  if (!byProfile.size) {
    console.log('No confirmed samples yet. Confirm prices at /corpus first.')
    process.exit(0)
  }

  mkdirSync(OUT_DIR, { recursive: true })

  for (const [profileId, samples] of byProfile) {
    const result = buildAtlasFromSamples(samples, profileId)
    const readiness = atlasReadiness(result)
    const path = join(OUT_DIR, `${profileId}.json`)

    writeFileSync(path, JSON.stringify(serialiseAtlas(result), null, 0))

    console.log(`${profileId}: ${result.used}/${samples.length} samples used, ${result.skipped} skipped`)
    console.log(`  digits: ${Object.entries(result.counts).map(([c, n]) => `${c}x${n}`).join(' ') || 'none'}`)
    if (readiness.missing.length) console.log(`  MISSING: ${readiness.missing.join(', ')} — prices containing these will refuse`)
    if (readiness.thin.length) console.log(`  thin: ${readiness.thin.join(', ')} — few examples, may read poorly`)
    console.log(`  -> ${path}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
