import { describe, expect, it } from 'vitest'
import { findTextBand, rowInkProfile } from './textBand'

const W = 60

/** Builds an RGBA band with bright text lines on a dark panel. */
const strip = (height: number, lines: Array<{ top: number; height: number }>, panel = 30) => {
  const data = new Uint8ClampedArray(W * height * 4)
  for (let i = 0; i < W * height; i += 1) {
    data[i * 4] = panel
    data[i * 4 + 1] = panel
    data[i * 4 + 2] = panel
    data[i * 4 + 3] = 255
  }

  for (const line of lines) {
    for (let y = line.top; y < line.top + line.height; y += 1) {
      // Half the columns inked, like digits with gaps between them.
      for (let x = 10; x < 40; x += 2) {
        const i = (y * W + x) * 4
        data[i] = 235
        data[i + 1] = 235
        data[i + 2] = 235
      }
    }
  }

  return data
}

describe('row ink profile', () => {
  it('finds ink only where the text is', () => {
    const profile = rowInkProfile(strip(30, [{ top: 10, height: 8 }]), W, 30)
    expect(profile[5]).toBe(0)
    expect(profile[12]).toBeGreaterThan(0)
    expect(profile[25]).toBe(0)
  })

  it('reports nothing on a blank panel rather than inventing a threshold', () => {
    // With no text there is no bright mode to separate, and a threshold taken
    // from noise would slice the panel into imaginary lines.
    const profile = rowInkProfile(strip(30, []), W, 30)
    expect(profile.every((value) => value === 0)).toBe(true)
  })

  it('works on a bright panel as well as a dark one', () => {
    const profile = rowInkProfile(strip(30, [{ top: 10, height: 8 }], 180), W, 30)
    expect(profile[12]).toBeGreaterThan(0)
  })
})

describe('finding the line the pointer was on', () => {
  it('returns the band containing the text', () => {
    const band = findTextBand(strip(40, [{ top: 15, height: 10 }]), W, 40, 20)!
    expect(band.top).toBeLessThanOrEqual(15)
    expect(band.bottom).toBeGreaterThanOrEqual(24)
  })

  // The real failure: hovering the lower edge of a row put the price near the
  // top of the crop, and the tight band cut the digits in half. Nine of the
  // first thirty real captures failed this way.
  it('finds text sitting near the top of the crop', () => {
    const band = findTextBand(strip(64, [{ top: 4, height: 12 }]), W, 64, 40)!
    expect(band.top).toBeLessThanOrEqual(4)
    expect(band.bottom).toBeGreaterThanOrEqual(15)
  })

  it('finds text sitting near the bottom of the crop', () => {
    const band = findTextBand(strip(64, [{ top: 48, height: 12 }]), W, 64, 10)!
    expect(band.top).toBeLessThanOrEqual(48)
    expect(band.bottom).toBeGreaterThanOrEqual(59)
  })

  it('picks the line nearest the pointer, not the biggest one', () => {
    // The widest run of ink in a loose crop is often a neighbouring listing.
    // Taking it would read a confidently correct price off the wrong row —
    // invisible afterwards, and the same class of error as filing a capture
    // against the wrong item.
    const data = strip(64, [{ top: 4, height: 20 }, { top: 40, height: 8 }])
    const band = findTextBand(data, W, 64, 44)!
    expect(band.top).toBeGreaterThan(30)
  })

  it('separates two lines rather than merging them into one', () => {
    const data = strip(64, [{ top: 8, height: 10 }, { top: 40, height: 10 }])
    const band = findTextBand(data, W, 64, 12)!
    // A merged band would stretch across the gap and hand the reader two rows
    // of digits stacked on top of each other.
    expect(band.bottom).toBeLessThan(30)
  })

  it('returns null on a blank crop instead of guessing', () => {
    expect(findTextBand(strip(40, []), W, 40, 20)).toBeNull()
  })

  it('keeps the band inside the image', () => {
    const band = findTextBand(strip(20, [{ top: 0, height: 20 }]), W, 20, 10)!
    expect(band.top).toBeGreaterThanOrEqual(0)
    expect(band.bottom).toBeLessThanOrEqual(19)
  })
})
