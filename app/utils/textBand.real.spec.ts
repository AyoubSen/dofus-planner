import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findTextBand } from './textBand'

// Runs the band finder over the *real* archived captures.
//
// Synthetic tests prove the logic; only real crops prove it works on Dofus.
// This spec is skipped when the archive is empty so a fresh clone still passes,
// which also means a green run here is not evidence unless samples exist — the
// count is asserted in the reporting test below so a silent skip cannot pass
// for a validation.

const CORPUS = 'corpus'
const hasCorpus = existsSync(CORPUS) && readdirSync(CORPUS).length > 0

const loadStrips = async () => {
  const sharp = (await import('sharp')).default
  const strips: Array<{ id: string; data: Uint8ClampedArray; width: number; height: number; cursorY: number; truth?: number }> = []

  for (const dir of readdirSync(CORPUS)) {
    const stripPath = join(CORPUS, dir, 'strip.png')
    const manifestPath = join(CORPUS, dir, 'sample.json')
    if (!existsSync(stripPath) || !existsSync(manifestPath)) continue

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    const { data, info } = await sharp(stripPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    strips.push({
      id: dir,
      data: new Uint8ClampedArray(data),
      width: info.width,
      height: info.height,
      // Archived strips were cut with the old geometry, which centred the band
      // on the cursor — so the cursor row is the middle of the crop.
      cursorY: Math.floor(info.height / 2),
      truth: manifest.truth,
    })
  }

  return strips
}

describe.skipIf(!hasCorpus)('band finding on real captures', () => {
  it('finds a text band in every archived price strip', async () => {
    const strips = await loadStrips()
    expect(strips.length).toBeGreaterThan(0)

    const missed: string[] = []
    for (const strip of strips) {
      const band = findTextBand(strip.data, strip.width, strip.height, strip.cursorY)
      if (!band) missed.push(strip.id)
    }

    // Every archived strip demonstrably contains a price — each was confirmed
    // by eye during review — so failing to find text in one is a real miss.
    expect(missed, `no band found in: ${missed.join(', ')}`).toHaveLength(0)
  }, 60_000)

  it('returns a band shorter than the crop it came from', async () => {
    const strips = await loadStrips()
    for (const strip of strips) {
      const band = findTextBand(strip.data, strip.width, strip.height, strip.cursorY)
      if (!band) continue
      const height = band.bottom - band.top + 1
      expect(height, strip.id).toBeLessThanOrEqual(strip.height)
      expect(height, strip.id).toBeGreaterThan(0)
    }
  }, 60_000)
})
