import { describe, expect, it } from 'vitest'
import { cropRow, findRowBands, MIN_ROW_PITCH, splitPageRows } from './pageRows'
import type { RGBAImage } from './priceRegion'

const W = 240

/** Paints a frame with listing rows: white price text then a gold symbol. */
const frame = (height: number, rows: Array<{ y: number; priceWidth?: number }>): RGBAImage => {
  const data = new Uint8ClampedArray(W * height * 4)
  for (let i = 0; i < W * height; i += 1) {
    data[i * 4] = 30
    data[i * 4 + 1] = 32
    data[i * 4 + 2] = 34
    data[i * 4 + 3] = 255
  }

  const put = (x: number, y: number, r: number, g: number, b: number) => {
    if (x < 0 || x >= W || y < 0 || y >= height) return
    const i = (y * W + x) * 4
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }

  for (const row of rows) {
    const priceWidth = row.priceWidth ?? 60
    // Price digits: near-white, immediately left of the symbol.
    for (let y = row.y; y < row.y + 9; y += 1) {
      for (let x = 100; x < 100 + priceWidth; x += 2) put(x, y, 235, 235, 235)
    }
    // Kamas symbol: saturated gold, just right of the digits.
    for (let y = row.y; y < row.y + 9; y += 1) {
      for (let x = 100 + priceWidth + 4; x < 100 + priceWidth + 14; x += 1) {
        put(x, y, 230, 190, 60)
      }
    }
  }

  return { width: W, height, data }
}

describe('finding listing rows', () => {
  it('finds one band per listing', () => {
    const bands = findRowBands(frame(200, [{ y: 10 }, { y: 50 }, { y: 90 }, { y: 130 }]))
    expect(bands).toHaveLength(4)
  })

  it('reports where each row sits, in order down the page', () => {
    const bands = findRowBands(frame(200, [{ y: 10 }, { y: 50 }, { y: 90 }]))
    expect(bands[0]!.top).toBeLessThan(bands[1]!.top)
    expect(bands[1]!.top).toBeLessThan(bands[2]!.top)
  })

  it('does not invent a row from a symbol split by its own shape', () => {
    // Two gold runs a few pixels apart are one symbol, not two listings.
    const image = frame(120, [{ y: 20 }])
    const bands = findRowBands(image)
    expect(bands).toHaveLength(1)
  })

  it('keeps rows that sit legitimately close together', () => {
    const bands = findRowBands(frame(200, [{ y: 20 }, { y: 20 + MIN_ROW_PITCH + 10 }]))
    expect(bands).toHaveLength(2)
  })

  it('finds nothing in a frame with no listings', () => {
    expect(findRowBands(frame(120, []))).toHaveLength(0)
  })

  it('does not assume a fixed row pitch', () => {
    // Rows spaced unevenly, as they are at different UI scales. A hardcoded
    // stride walks off the list; counting symbols does not.
    const bands = findRowBands(frame(300, [{ y: 10 }, { y: 45 }, { y: 120 }, { y: 200 }]))
    expect(bands).toHaveLength(4)
  })
})

describe('cutting rows out', () => {
  it('produces a crop containing the row', () => {
    const image = frame(200, [{ y: 50 }])
    const band = findRowBands(image)[0]!
    const cropped = cropRow(image, band)

    // Windowed horizontally as well as vertically. A full-width row crop let
    // the price reader re-find the symbol and pick a gold item icon — or, on a
    // real screen, the scenery — instead of the price.
    expect(cropped.width).toBeLessThanOrEqual(W)
    expect(cropped.width).toBeGreaterThan(40)
    expect(cropped.height).toBeGreaterThan(9)
    expect(cropped.height).toBeLessThan(image.height)
  })

  it('stays inside the frame at the very top and bottom', () => {
    const image = frame(60, [{ y: 0 }, { y: 48 }])
    for (const band of findRowBands(image)) {
      const cropped = cropRow(image, band)
      expect(cropped.height).toBeGreaterThan(0)
      expect(cropped.height).toBeLessThanOrEqual(image.height)
    }
  })
})

describe('splitting a page', () => {
  it('yields one crop per readable listing, numbered down the page', () => {
    const rows = splitPageRows(frame(240, [{ y: 20 }, { y: 70 }, { y: 120 }]))
    expect(rows).toHaveLength(3)
    expect(rows.map((row) => row.ordinal)).toEqual([0, 1, 2])
  })

  it('drops a band whose price cannot be located', () => {
    // A stray gold pixel elsewhere in the interface is not a listing, and
    // passing it on would produce a phantom row with no price in it.
    const image = frame(160, [{ y: 30 }])
    const i = (100 * W + 5) * 4
    image.data[i] = 230
    image.data[i + 1] = 190
    image.data[i + 2] = 60

    const rows = splitPageRows(image)
    expect(rows).toHaveLength(1)
  })

  it('returns nothing for an empty page rather than throwing', () => {
    expect(splitPageRows(frame(120, []))).toEqual([])
  })
})
