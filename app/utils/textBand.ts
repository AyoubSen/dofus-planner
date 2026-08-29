// Finding the line of text inside a band that contains more than one.
//
// The price strip is cut around the pointer, and the pointer is wherever the
// user put it — not where the text is. A band tight enough to exclude the
// neighbouring row clipped the digits whenever the hover was near a row edge;
// a band loose enough never to clip contains parts of the rows above and below.
// Neither is fixable by choosing a better constant, because the error is that
// the crop's position is derived from the cursor rather than from the content.
//
// So: take the generous band, then *find* the text in it. Row projection is
// enough — a line of UI text is a contiguous run of rows carrying much more ink
// than the panel between lines, and the one we want is the run nearest the
// pointer, which is the row the user was pointing at.

export interface TextBand {
  /** First row of the band, inclusive. */
  top: number
  /** Last row of the band, inclusive. */
  bottom: number
  /** Ink pixels in the band, for choosing between candidates. */
  ink: number
}

/** Ink share of a row below which it counts as a gap between lines. */
const ROW_INK_THRESHOLD = 0.02

/**
 * Rows carrying ink, using a threshold taken from the image.
 *
 * Deliberately not the per-image midpoint the old mask used: UI text is a
 * minority of the pixels, so a midpoint threshold sits above most of the glyph
 * body on a dark panel. A high percentile of the luma distribution tracks
 * "much brighter than the panel" whatever the panel is.
 */
export const rowInkProfile = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
): number[] => {
  const luma = new Float64Array(width * height)
  for (let i = 0; i < width * height; i += 1) {
    luma[i] = data[i * 4]! * 0.299 + data[i * 4 + 1]! * 0.587 + data[i * 4 + 2]! * 0.114
  }

  const sorted = Array.from(luma).sort((a, b) => a - b)
  const floor = sorted[Math.floor(sorted.length * 0.5)]!
  const ceiling = sorted[Math.floor(sorted.length * 0.995)]!
  // A panel with no text on it at all has nothing to separate; say so rather
  // than inventing a threshold inside the noise.
  if (ceiling - floor < 24) return new Array(height).fill(0)

  const threshold = floor + (ceiling - floor) * 0.45
  const profile: number[] = new Array(height).fill(0)

  for (let y = 0; y < height; y += 1) {
    let count = 0
    for (let x = 0; x < width; x += 1) {
      if (luma[y * width + x]! > threshold) count += 1
    }
    profile[y] = count
  }

  return profile
}

/**
 * The band of rows holding the line of text nearest a target row.
 *
 * Nearest rather than largest: the widest run of ink in a wide crop is often
 * the tooltip or an adjacent listing, and picking it would read a confidently
 * correct price off the wrong row — the same class of error as filing a capture
 * against the wrong item, and just as invisible afterwards.
 */
export const findTextBand = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  targetRow: number,
  options: { padding?: number } = {},
): TextBand | null => {
  const padding = options.padding ?? 2
  const profile = rowInkProfile(data, width, height)
  const minimumInk = Math.max(1, Math.floor(width * ROW_INK_THRESHOLD))

  const bands: TextBand[] = []
  let start = -1
  let ink = 0

  for (let y = 0; y <= height; y += 1) {
    const inked = y < height && profile[y]! >= minimumInk
    if (inked) {
      if (start < 0) start = y
      ink += profile[y]!
    } else if (start >= 0) {
      bands.push({ top: start, bottom: y - 1, ink })
      start = -1
      ink = 0
    }
  }

  if (!bands.length) return null

  const distanceTo = (band: TextBand) => {
    if (targetRow < band.top) return band.top - targetRow
    if (targetRow > band.bottom) return targetRow - band.bottom
    return 0
  }

  // Nearest wins; ink breaks ties, so a stray speck beside the pointer loses to
  // the actual line of text.
  const best = bands
    .slice()
    .sort((a, b) => (distanceTo(a) - distanceTo(b)) || (b.ink - a.ink))[0]!

  return {
    top: Math.max(0, best.top - padding),
    bottom: Math.min(height - 1, best.bottom + padding),
    ink: best.ink,
  }
}
