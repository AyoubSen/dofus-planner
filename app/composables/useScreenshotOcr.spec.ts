import { describe, expect, it } from 'vitest'
import { keepTooltipLines } from './useScreenshotOcr'

/** Shaped like tesseract's line output: text plus a bounding box. */
const line = (text: string, x0: number) => ({ text, bbox: { x0, y0: 0, x1: x0 + 200, y1: 20 } })

describe('keeping only what is inside the tooltip', () => {
  // The real capture: price rows on the left, tooltip on the right, all in one
  // crop because Dofus anchors the tooltip to the panel and not to the cursor.
  const capture = [
    line('1 2 599 999 ACHETER', 10),
    line('1 2 749 998 ACHETER', 10),
    line('1 3 500 000 ACHETER', 10),
    line('EFFETS', 360),
    line('324 Vitalité [301 à 350]', 366),
    line('100 Force [71 à 100]', 366),
    line('1 PM [1]', 366),
  ]

  it('drops the price rows and keeps the stats', () => {
    const kept = keepTooltipLines(capture)
    expect(kept).not.toBeNull()
    expect(kept!.some((text) => text.includes('ACHETER'))).toBe(false)
    expect(kept!.some((text) => text.includes('Vitalité'))).toBe(true)
    expect(kept!.some((text) => text.includes('PM'))).toBe(true)
  })

  it('keeps the heading itself, margin included', () => {
    expect(keepTooltipLines(capture)!.some((text) => text.includes('EFFETS'))).toBe(true)
  })

  it('keeps every line when the heading was not read', () => {
    // Better to hand over a noisy capture than to throw the whole thing away
    // because one word was misread.
    const noHeading = capture.filter((entry) => entry.text !== 'EFFETS')
    expect(keepTooltipLines(noHeading)).toBeNull()
  })

  it('copes with missing or malformed input', () => {
    expect(keepTooltipLines(undefined)).toBeNull()
    expect(keepTooltipLines([])).toBeNull()
    expect(keepTooltipLines([{ text: 'EFFETS' }])).toBeNull()
  })

  it('matches the heading however it was capitalised or accented', () => {
    const kept = keepTooltipLines([line('1 3 500 000 ACHETER', 10), line('Effets', 360), line('324 Vitalité', 366)])
    expect(kept!.some((text) => text.includes('Vitalité'))).toBe(true)
    expect(kept!.some((text) => text.includes('ACHETER'))).toBe(false)
  })
})
