// Reading game text by matching pixels, not by recognising shapes.
//
// Tesseract is built for text that was photographed or scanned: unknown fonts,
// noise, skew, lighting. Dofus text is the opposite of all that. The client
// draws it from one font at one size, so a "7" is the same block of pixels
// every single time it appears. Handing pixel-exact synthetic text to a
// statistical recognizer is why the same price could read correctly once and
// come back as "sessarr ge" the next time.
//
// So: cut the text into glyphs, and look each one up. Same pixels in, same
// answer out — and when a glyph is unknown it says so, rather than guessing.
//
// Only digits are learned. They carry the prices and every stat value, which is
// all the arithmetic depends on; stat *names* are already resolved against the
// handful of lines the item can roll, which works well.

/** A glyph reduced to a fixed grid, so two renderings compare directly. */
export const GLYPH_GRID_WIDTH = 8
export const GLYPH_GRID_HEIGHT = 12

/**
 * How many cells may differ and still count as the same character.
 *
 * Not zero: anti-aliasing shifts an edge pixel here and there depending on what
 * is behind the text. Small enough that different digits never collide — the
 * closest pair in a UI font differs by far more than this.
 */
export const GLYPH_MATCH_TOLERANCE = 6

export interface GlyphBox {
  x0: number
  x1: number
  y0: number
  y1: number
  /** Fixed-size signature, '0'/'1' per cell, row-major. */
  signature: string
}

export interface GlyphAtlas {
  /** signature -> the character it represents. */
  glyphs: Record<string, string>
  /** Pixel height of the text this atlas was learned from. */
  learnedHeight: number
}

export const emptyAtlas = (): GlyphAtlas => ({ glyphs: {}, learnedHeight: 0 })

/**
 * Ink mask for an image: true where text is.
 *
 * Dofus draws light text on dark panels, so "brighter than the backdrop" is the
 * whole test. The threshold is taken from the image itself rather than fixed,
 * because panels differ in brightness across the UI.
 */
export const inkMask = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
): boolean[] => {
  const luma = new Float64Array(width * height)
  let min = 255
  let max = 0

  for (let i = 0; i < width * height; i += 1) {
    const value = data[i * 4]! * 0.299 + data[i * 4 + 1]! * 0.587 + data[i * 4 + 2]! * 0.114
    luma[i] = value
    if (value < min) min = value
    if (value > max) max = value
  }

  // Midway between the darkest and brightest pixel present. On a strip of UI
  // this separates glyphs from panel cleanly, and it costs nothing to compute.
  const threshold = min + (max - min) * 0.5
  const mask: boolean[] = new Array(width * height)
  for (let i = 0; i < width * height; i += 1) mask[i] = luma[i]! > threshold

  return mask
}

/**
 * Splits a single line of text into glyphs on blank columns.
 *
 * Column projection rather than connected components: it is simpler, and it
 * keeps a glyph whole even when the font leaves a piece detached, which
 * component labelling would split into two.
 */
export const segmentGlyphs = (
  mask: boolean[],
  width: number,
  height: number,
): GlyphBox[] => {
  const columnHasInk: boolean[] = new Array(width).fill(false)
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      if (mask[y * width + x]) {
        columnHasInk[x] = true
        break
      }
    }
  }

  const boxes: GlyphBox[] = []
  let start = -1

  for (let x = 0; x <= width; x += 1) {
    const inked = x < width && columnHasInk[x]

    if (inked && start < 0) start = x
    if (!inked && start >= 0) {
      const box = tightenBox(mask, width, height, start, x - 1)
      if (box) boxes.push(box)
      start = -1
    }
  }

  return boxes
}

/** Trims a column range to the rows that actually carry ink, then signs it. */
const tightenBox = (
  mask: boolean[],
  width: number,
  height: number,
  x0: number,
  x1: number,
): GlyphBox | null => {
  let top = -1
  let bottom = -1

  for (let y = 0; y < height; y += 1) {
    let rowHasInk = false
    for (let x = x0; x <= x1; x += 1) {
      if (mask[y * width + x]) {
        rowHasInk = true
        break
      }
    }
    if (rowHasInk) {
      if (top < 0) top = y
      bottom = y
    }
  }

  if (top < 0) return null

  return {
    x0,
    x1,
    y0: top,
    y1: bottom,
    signature: glyphSignature(mask, width, x0, x1, top, bottom),
  }
}

/**
 * Resamples a glyph to a fixed grid.
 *
 * Fixed size so that two renderings of the same character compare cell for
 * cell, and so the atlas survives the UI being scaled a little.
 */
export const glyphSignature = (
  mask: boolean[],
  width: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): string => {
  const boxWidth = x1 - x0 + 1
  const boxHeight = y1 - y0 + 1
  let signature = ''

  for (let gy = 0; gy < GLYPH_GRID_HEIGHT; gy += 1) {
    for (let gx = 0; gx < GLYPH_GRID_WIDTH; gx += 1) {
      // Sample the middle of each cell rather than a corner, so a glyph shifted
      // by a pixel still lands the same way.
      const sx = x0 + Math.floor((gx + 0.5) * boxWidth / GLYPH_GRID_WIDTH)
      const sy = y0 + Math.floor((gy + 0.5) * boxHeight / GLYPH_GRID_HEIGHT)
      signature += mask[sy * width + sx] ? '1' : '0'
    }
  }

  return signature
}

/** Cells that differ between two signatures. */
export const signatureDistance = (a: string, b: string): number => {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY
  let distance = 0
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) distance += 1
  }
  return distance
}

/**
 * The character for a glyph, or null when the atlas has not been taught it.
 *
 * Returning null is the point: an unknown glyph is reported, never guessed at.
 * A wrong digit in a price is far more expensive than a refusal.
 */
export const matchGlyph = (atlas: GlyphAtlas, signature: string): string | null => {
  const exact = atlas.glyphs[signature]
  if (exact !== undefined) return exact

  let best: string | null = null
  let bestDistance = GLYPH_MATCH_TOLERANCE + 1

  for (const [known, character] of Object.entries(atlas.glyphs)) {
    const distance = signatureDistance(signature, known)
    if (distance < bestDistance) {
      bestDistance = distance
      best = character
    }
  }

  return bestDistance <= GLYPH_MATCH_TOLERANCE ? best : null
}

export interface ReadResult {
  /** Characters read, with '?' where a glyph was not recognised. */
  text: string
  /** True when every glyph was recognised. */
  complete: boolean
  glyphs: Array<{ box: GlyphBox; character: string | null }>
}

/**
 * Reads one line of text.
 *
 * A gap wider than a glyph is a space — that is what separates the thousands in
 * "2 750 000", and getting it wrong is what made a price read as 2750.
 */
export const readLine = (
  atlas: GlyphAtlas,
  mask: boolean[],
  width: number,
  height: number,
): ReadResult => {
  const boxes = segmentGlyphs(mask, width, height)
  const glyphs = boxes.map((box) => ({ box, character: matchGlyph(atlas, box.signature) }))

  let text = ''
  let previous: GlyphBox | null = null

  for (const { box, character } of glyphs) {
    if (previous) {
      const gap = box.x0 - previous.x1 - 1
      const glyphWidth = previous.x1 - previous.x0 + 1
      if (gap > glyphWidth * 0.6) text += ' '
    }
    text += character ?? '?'
    previous = box
  }

  return { text, complete: glyphs.every((entry) => entry.character !== null), glyphs }
}

/** Adds a labelled glyph to the atlas. */
export const teachGlyph = (
  atlas: GlyphAtlas,
  signature: string,
  character: string,
): GlyphAtlas => ({
  glyphs: { ...atlas.glyphs, [signature]: character },
  learnedHeight: atlas.learnedHeight,
})

/** Glyphs in this line the atlas cannot name yet. */
export const unknownGlyphs = (atlas: GlyphAtlas, boxes: GlyphBox[]): GlyphBox[] => {
  const seen = new Set<string>()
  return boxes.filter((box) => {
    if (matchGlyph(atlas, box.signature) !== null) return false
    if (seen.has(box.signature)) return false
    seen.add(box.signature)
    return true
  })
}
