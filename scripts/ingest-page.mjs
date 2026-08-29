#!/usr/bin/env node
// Turns a full-page HDV screenshot into labelled corpus samples.
//
//   node scripts/ingest-page.mjs <screenshot.png> <price> <price> ...
//
// Prices are given in top-to-bottom order for the listing rows, and are matched
// against the rows the detector finds. Rows the detector finds but that have no
// price given are skipped rather than guessed at.
//
// Why this exists: the atlas can only learn digits it has seen, and a player's
// captures may simply never contain some of them — a corpus of thirty real
// captures held no `2` and no `6` at all, so every price containing one refused.
// A single page of listings covers far more of the digit range than a hotkey
// press per row ever will.
//
// Labels supplied this way should be treated as *asserted*, not confirmed: they
// come from a human or a model reading the screenshot, which is a different
// mechanism from the reader being trained but is not infallible. Samples are
// marked so the distinction survives.

import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const jitiModule = await import('jiti')
const jiti = jitiModule.createJiti(import.meta.url)
const { splitPageRows } = await jiti.import('../app/utils/render/pageRows.ts')
const { findPriceRegion } = await jiti.import('../app/utils/render/priceRegion.ts')

const CORPUS = 'corpus'

const main = async () => {
  const [file, ...prices] = process.argv.slice(2)
  if (!file || !prices.length) {
    console.log('usage: node scripts/ingest-page.mjs <screenshot.png> <price> [price...]')
    process.exit(1)
  }

  const sharp = (await import('sharp')).default
  const { data, info } = await sharp(file).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true })
  const image = { width: info.width, height: info.height, data: new Uint8ClampedArray(data) }

  const rows = splitPageRows(image)
  console.log(`${file}: ${rows.length} rows detected, ${prices.length} prices given`)

  // Rows whose price region could not be located are already filtered out, but
  // the count still has to line up or the labels are being pinned to the wrong
  // pictures — which would teach the atlas wrong glyphs, permanently and
  // silently. Refuse rather than guess at the alignment.
  const listingRows = rows.filter((row) => row.band.top > 0)
  if (listingRows.length < prices.length) {
    console.error(`Only ${listingRows.length} usable rows for ${prices.length} prices — refusing to guess the alignment.`)
    process.exit(1)
  }

  mkdirSync(CORPUS, { recursive: true })
  let written = 0

  for (const [index, price] of prices.entries()) {
    const row = listingRows[index]
    if (!row) break

    const value = Number(String(price).replace(/\D/g, ''))
    if (!Number.isFinite(value) || value <= 0) continue

    const id = `page-${new Date().toISOString().replace(/[:.]/g, '-')}-${index}`
    const dir = join(CORPUS, id)
    mkdirSync(dir, { recursive: true })

    // Crop to the price region *here*, where the symbol's position is already
    // known from the page scan. Saving the whole row instead means the atlas
    // builder has to re-find the symbol blind on a narrow crop, and a gold item
    // icon beats it — twelve of thirteen rows were discarded that way.
    const region = findPriceRegion(row.image, row.hintX)
    if (!region) continue

    // Keep the kamas symbol in frame. The atlas builder anchors on it too, so a
    // crop tight to the digits alone leaves it with nothing to find — which is
    // how a crop that fixed one problem created the same one downstream.
    const pad = 6
    const left = Math.max(0, region.x0 - pad)
    const right = Math.min(row.image.width - 1, region.kamasX + 18)
    const width = right - left + 1

    await sharp(Buffer.from(row.image.data), {
      raw: { width: row.image.width, height: row.image.height, channels: 4 },
    })
      .extract({ left, top: 0, width, height: row.image.height })
      .png()
      .toFile(join(dir, 'strip.png'))

    writeFileSync(join(dir, 'sample.json'), JSON.stringify({
      id,
      capturedAt: new Date().toISOString(),
      itemName: 'page-ingest',
      itemKey: 'page-ingest',
      serverId: '',
      profile: {
        screenWidth: info.width,
        screenHeight: info.height,
        cursorX: 0,
        cursorY: 0,
        devicePixelRatio: 1,
        locale: 'fr',
      },
      readings: [],
      storedPrice: null,
      agreed: true,
      truth: value,
      // Asserted from a screenshot rather than confirmed against a live client.
      truthSource: 'page-ingest',
    }, null, 2))

    written += 1
  }

  console.log(`wrote ${written} labelled samples`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
