import { describe, expect, it } from 'vitest'
import {
  MAX_PRICE,
  PRICE_STRIP_HEIGHT,
  pickPriceFromStrip,
  isPlausibleAgainst,
  priceStripRect,
  tooltipRect,
} from './captureCrop'

describe('the price strip follows the row, not the pointer', () => {
  it('centres on the row being pointed at', () => {
    const rect = priceStripRect(998, 400, 1920, 1080)
    expect(rect.y).toBe(400 - PRICE_STRIP_HEIGHT / 2)
    expect(rect.height).toBe(PRICE_STRIP_HEIGHT)
  })

  it('moves with each row', () => {
    // The exact complaint: hovering row after row must read row after row.
    // Asserted as the *relationship* to the pointer rather than as fixed
    // coordinates, because the band's height is a tuning decision and pinning
    // absolute numbers made a deliberate change look like a regression.
    const rows = [378, 417, 456, 495]
    const ys = rows.map((y) => priceStripRect(998, y, 1920, 1080).y)

    for (const [index, y] of ys.entries()) {
      expect(y).toBe(rows[index]! - Math.floor(PRICE_STRIP_HEIGHT / 2))
    }
    // And each band is a row's pitch below the last, so consecutive hovers read
    // consecutive rows rather than the same one twice.
    expect(ys[1]! - ys[0]!).toBe(39)
  })

  it('stays clear of the chat and inventory either side', () => {
    // Full width dragged in the kamas counter, which beat every real price.
    const rect = priceStripRect(998, 400, 1920, 1080)
    expect(rect.x).toBeGreaterThan(400)
    expect(rect.x + rect.width).toBeLessThan(1920)
  })

  it('is tall enough to contain a row from any hover position', () => {
    // This used to assert the opposite — shorter than a row, so two rows could
    // never land in one crop. That reasoning assumed the pointer sits at the
    // row's centre, and it does not: the price is drawn mid-row while the
    // pointer goes wherever the user puts it, so a sub-row band slid off the
    // number and cut the digits in half. Nine of the first thirty real
    // captures failed exactly this way.
    //
    // The band is now generous and `findTextBand` picks the line out of it,
    // which is a measurement instead of an assumption about the pointer. Rows
    // sit ~39px apart, so the band must clear that from either edge.
    expect(PRICE_STRIP_HEIGHT).toBeGreaterThanOrEqual(39)
  })

  it('stays on screen at every edge', () => {
    for (const [x, y] of [[0, 2], [1919, 1078], [960, 540]]) {
      const rect = priceStripRect(x!, y!, 1920, 1080)
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(1920)
      expect(rect.y).toBeGreaterThanOrEqual(0)
      expect(rect.y + rect.height).toBeLessThanOrEqual(1080)
    }
  })
})

describe('the tooltip area picks the roomier side', () => {
  it('takes the right when the pointer is on the left', () => {
    const rect = tooltipRect(400, 500, 1920, 1080)
    expect(rect.x).toBeGreaterThan(400)
  })

  it('still takes the right past the middle of the screen', () => {
    // The bug: comparing which side was roomier sent this left at x=998 on a
    // 1919-wide screen, so it cropped the chat panel and found no stats.
    const rect = tooltipRect(998, 400, 1919, 1079)
    expect(rect.x).toBeGreaterThan(998)
  })

  it('takes the left only when the right cannot fit a tooltip', () => {
    const rect = tooltipRect(1800, 500, 1920, 1080)
    expect(rect.x + rect.width).toBeLessThanOrEqual(1800)
  })

  it('never leaves the screen', () => {
    for (const x of [0, 200, 960, 1700, 1919]) {
      const rect = tooltipRect(x, 500, 1920, 1080)
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(1920)
      expect(rect.y).toBeGreaterThanOrEqual(0)
      expect(rect.y + rect.height).toBeLessThanOrEqual(1080)
    }
  })

  it('starts above the pointer, since the tooltip opens from the row', () => {
    expect(tooltipRect(400, 500, 1920, 1080).y).toBeLessThan(500)
  })
})

describe('picking the price out of a row', () => {
  it('reads a space-separated French price', () => {
    expect(pickPriceFromStrip('1 2 599 999')).toBe(2599999)
  })

  it('ignores the lot count beside it', () => {
    // "1" is the lot size; the price is the big number on the row.
    expect(pickPriceFromStrip('1  3 500 000  ACHETER')).toBe(3500000)
  })

  it('copes with OCR losing the thousands gaps', () => {
    expect(pickPriceFromStrip('1 2749999')).toBe(2749999)
  })

  it('ignores numbers too small to be a price', () => {
    expect(pickPriceFromStrip('Niv. 198')).toBe(null)
    expect(pickPriceFromStrip('1 x 200')).toBe(null)
  })

  it('does not merge the lot count into the price', () => {
    // "1 2 599 999" must read as 2 599 999, not 12 599 999.
    expect(pickPriceFromStrip('1 2 599 999')).toBe(2599999)
    expect(pickPriceFromStrip('10 3 500 000')).toBe(3500000)
  })

  it('ignores absurd numbers rather than trusting a misread', () => {
    expect(pickPriceFromStrip(String(MAX_PRICE * 10))).toBe(null)
  })

  it('returns null when the row has no number at all', () => {
    expect(pickPriceFromStrip('ACHETER')).toBe(null)
    expect(pickPriceFromStrip('')).toBe(null)
  })

  it('takes the largest candidate, which is always the price', () => {
    expect(pickPriceFromStrip('10 4 199 000 1')).toBe(4199000)
  })
})

describe('a misread price must never become a bargain', () => {
  it('recovers a price whose last group has a misread digit', () => {
    // "2 750 0O0" used to match only "2 750" and save as a 2 750 kama listing.
    expect(pickPriceFromStrip('1 2 750 0O0 ACHETER')).toBe(2750000)
    expect(pickPriceFromStrip('1 3 5OO OOO ACHETER')).toBe(3500000)
  })

  it('rejects a price an order of magnitude below the going rate', () => {
    const known = [2500000, 2599999, 2749998, 3500000, 3599999]
    expect(isPlausibleAgainst(2750, known)).toBe(false)
    expect(isPlausibleAgainst(3695, known)).toBe(false)
  })

  it('rejects an absurdly high one too', () => {
    expect(isPlausibleAgainst(37000004, [2500000, 2599999, 2749998])).toBe(false)
  })

  it('accepts a genuine bargain', () => {
    // Half the going rate is a find; a thousandth is a dropped digit.
    expect(isPlausibleAgainst(1300000, [2500000, 2599999, 2749998])).toBe(true)
  })

  it('trusts anything until there is something to compare against', () => {
    expect(isPlausibleAgainst(2750, [])).toBe(true)
  })

  it('checks against a single known price rather than waiting for two', () => {
    expect(isPlausibleAgainst(2750, [3000000])).toBe(false)
  })
})

describe('OCR widening the gaps between thousand groups', () => {
  it('reads a price whose separators came out doubled', () => {
    // "2 599  999" stopped the match at "2 599" and saved a 2 599 kama listing.
    expect(pickPriceFromStrip('1 2 599  999 ACHETER')).toBe(2599999)
    expect(pickPriceFromStrip('1  3 500   000  ACHETER')).toBe(3500000)
  })

  it('still refuses to swallow the lot count', () => {
    expect(pickPriceFromStrip('1  2 599 999')).toBe(2599999)
    expect(pickPriceFromStrip('10  3 500 000')).toBe(3500000)
  })
})

describe('the guard works from the very first comparison', () => {
  it('catches a dropped digit against a single known price', () => {
    // The exact case: one prior listing at 2 500 000, then 2 599 999 read as 2 599.
    expect(isPlausibleAgainst(2599, [2500000])).toBe(false)
  })

  it('still accepts the first listing of all, having nothing to compare', () => {
    expect(isPlausibleAgainst(2599, [])).toBe(true)
  })

  it('accepts a real bargain against a single known price', () => {
    expect(isPlausibleAgainst(1400000, [2500000])).toBe(true)
  })
})

describe('a partially-lost separator', () => {
  it('reads the exact string that failed live', () => {
    // Straight from the debug panel: the crop was perfect, the OCR emitted
    // "N : 2750 000 4" for a 2 750 000 listing, and it parsed as 2750.
    expect(pickPriceFromStrip('N : 2750 000 4')).toBe(2750000)
  })

  it('handles the leading separator being lost', () => {
    expect(pickPriceFromStrip('1 2750 000 ACHETER')).toBe(2750000)
    expect(pickPriceFromStrip('1 3500 000 ACHETER')).toBe(3500000)
  })

  it('does not merge the lot count when a separator is missing', () => {
    // Widening the groups to catch "2 750000" would make "1 2750 000" parse as
    // 12 750 000 — a 5x overprice that looks plausible enough to slip the
    // sanity guard. A trailing lost separator is left to the guard instead,
    // since it produces an obviously-too-small number rather than a subtle one.
    expect(pickPriceFromStrip('1 2750 000 ACHETER')).not.toBe(12750000)
  })

  it('has not lost any of the shapes that already worked', () => {
    expect(pickPriceFromStrip('1 2 599 999 ACHETER')).toBe(2599999)
    expect(pickPriceFromStrip('1 2749999 ACHETER')).toBe(2749999)
    expect(pickPriceFromStrip('1 2 599  999 ACHETER')).toBe(2599999)
    expect(pickPriceFromStrip('10 3 500 000')).toBe(3500000)
  })

  it('still refuses to swallow the lot count into the price', () => {
    expect(pickPriceFromStrip('1 2 599 999')).toBe(2599999)
    expect(pickPriceFromStrip('10 4 199 000 1')).toBe(4199000)
  })
})
