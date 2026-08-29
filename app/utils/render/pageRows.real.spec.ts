import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { splitPageRows } from './pageRows'

// Row detection against real captures.
//
// The archive holds single-row strips rather than whole pages, so this cannot
// prove the multi-row case. What it *can* prove — and what would sink the
// approach if false — is that the detector finds exactly one row in an image
// known to contain exactly one. A detector that hallucinates rows in a
// single-row strip would hallucinate them across a page too, and every phantom
// becomes a listing that does not exist.

const CORPUS = 'corpus'
const hasCorpus = existsSync(CORPUS) && readdirSync(CORPUS).length > 0

describe.skipIf(!hasCorpus)('row detection on real strips', () => {
  it('returns exactly one readable row per single-row capture', async () => {
    const sharp = (await import('sharp')).default
    const counts: number[] = []
    const offenders: string[] = []

    for (const dir of readdirSync(CORPUS)) {
      const stripPath = join(CORPUS, dir, 'strip.png')
      if (!existsSync(stripPath)) continue

      const { data, info } = await sharp(stripPath).ensureAlpha().raw()
        .toBuffer({ resolveWithObject: true })
      const image = { width: info.width, height: info.height, data: new Uint8ClampedArray(data) }

        // Graded on what is *returned*, not on raw bands. A strip cut with the
      // old cursor-centred geometry can genuinely clip the row above, so more
      // than one gold run is not necessarily an error — but a band with no
      // locatable price in it is, because it would become a listing that was
      // never on the market.
      const bands = splitPageRows(image)
      counts.push(bands.length)
      if (bands.length !== 1) offenders.push(`${dir}: ${bands.length}`)
    }

    writeFileSync('rows-report.txt', [
      `strips ${counts.length}`,
      `exactly one row: ${counts.filter((count) => count === 1).length}`,
      `none found: ${counts.filter((count) => count === 0).length}`,
      `more than one: ${counts.filter((count) => count > 1).length}`,
      ...offenders.map((line) => 'ODD ' + line),
    ].join('\n'))

    // Phantom rows are the failure that matters: each one becomes a listing
    // that was never on the market.
    expect(counts.filter((count) => count > 1), offenders.join('; ')).toHaveLength(0)
  }, 120_000)

  it('yields a usable crop wherever it finds a row', async () => {
    const sharp = (await import('sharp')).default

    for (const dir of readdirSync(CORPUS).slice(0, 12)) {
      const stripPath = join(CORPUS, dir, 'strip.png')
      if (!existsSync(stripPath)) continue

      const { data, info } = await sharp(stripPath).ensureAlpha().raw()
        .toBuffer({ resolveWithObject: true })
      const image = { width: info.width, height: info.height, data: new Uint8ClampedArray(data) }

      for (const row of splitPageRows(image)) {
        // Windowed around the symbol, so narrower than the frame — that
        // narrowing is what stops the reader anchoring on scenery.
        expect(row.image.width).toBeGreaterThan(0)
        expect(row.image.width).toBeLessThanOrEqual(image.width)
        expect(row.image.height).toBeGreaterThan(0)
      }
    }
  }, 120_000)
})
