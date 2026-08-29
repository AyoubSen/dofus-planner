// Reading every listing on the page from one frame.
//
// Phase 3. Today a capture is one hotkey press per listing, so a page of thirty
// costs thirty presses and thirty round-trips. But a single frame already
// contains all thirty rows — the only reason they were read one at a time is
// that the crop was positioned from the cursor, which can only ever point at
// one of them.
//
// With the price located by colour instead (see `priceRegion.ts`), the cursor
// stops mattering: every row in the frame carries a kamas symbol, and each one
// marks a price. Finding the symbols finds the rows.
//
// The honest limit: this reads *prices*, not rolls. A listing's stats live in a
// tooltip that only appears on hover, so exos still need a pass with the mouse.
// What it removes is the thirty presses needed to learn what a page costs.

import { findPriceRegion, isKamasGold, isTextWhite, type RGBAImage } from './priceRegion'

export interface RowBand {
  /** First row of the listing band, inclusive. */
  top: number
  /** Last row, inclusive. */
  bottom: number
  /** Where the kamas symbol sits, which is what identified the row. */
  kamasX: number
}

/** Minimum vertical separation between two listings, in pixels. */
export const MIN_ROW_PITCH = 12

/**
 * Finds each listing row by its kamas symbol.
 *
 * Rows are located by content rather than by assuming a pitch: the HDV's row
 * height changes with UI scale, and a hardcoded stride silently walks off the
 * list after a dozen rows. Every listing has exactly one price and every price
 * has exactly one symbol, so counting symbols counts listings.
 */
/** Half-width of the column searched around the kamas symbols, in pixels. */
export const KAMAS_COLUMN_RADIUS = 24

/**
 * Finds the x where the listing prices' kamas symbols live.
 *
 * Necessary because gold is not unique to the currency symbol. A real HDV page
 * of capes had a gold *item icon* in every row, and since consecutive rows are
 * only a pixel or two apart vertically, those icons formed one unbroken gold
 * column — fourteen listings collapsed into two bands. The tooltip's average
 * price and the inventory's kamas counter add further gold elsewhere on screen.
 *
 * What separates them is that every listing's symbol shares one x. So the
 * busiest column of gold *is* the price column, and everything outside it is
 * some other gold thing.
 */
/** Plausible height of a kamas symbol, in pixels. */
const SYMBOL_MIN_HEIGHT = 4
const SYMBOL_MAX_HEIGHT = 22

/**
 * Counts the symbol-sized gold runs in one column.
 *
 * Counting runs rather than pixels is what makes this work on a real screen.
 * Dofus renders the world behind the interface, and a fire-lit Brâkmar
 * background contains far more gold than any UI element — on a real capture,
 * 125,000 gold pixels of scenery against roughly 140 belonging to the price
 * column. By raw count the background wins overwhelmingly.
 *
 * Structurally, though, they are nothing alike: a list of prices is a dozen
 * small separated runs at a regular pitch, while scenery is one continuous
 * mass. Runs of symbol height are the signature of a list, and no amount of
 * background brightness produces them.
 */
/** How far left of a symbol its digits are expected to start, in pixels. */
const DIGITS_LOOKBACK = 60
/** Near-white pixels needed beside a run for it to be a price. */
const DIGITS_MIN_PIXELS = 12

/**
 * Is there price text immediately left of this gold run?
 *
 * The check that makes the whole thing work on a real screen. Gold alone is
 * hopeless as a signal — scenery produces symbol-sized gold runs by the
 * thousand, and on one real capture the busiest gold column by far was the
 * fire-lit background, not the price column. What scenery does *not* have is a
 * row of near-white digits sitting immediately to its left. That pairing is
 * what a price is.
 */
const hasDigitsLeftOf = (image: RGBAImage, x: number, y0: number, y1: number): boolean => {
  let white = 0
  const from = Math.max(0, x - DIGITS_LOOKBACK)

  for (let y = y0; y <= y1; y += 1) {
    for (let px = from; px < x - 2; px += 1) {
      const i = (y * image.width + px) * 4
      if (isTextWhite(image.data[i]!, image.data[i + 1]!, image.data[i + 2]!)) {
        white += 1
        if (white >= DIGITS_MIN_PIXELS) return true
      }
    }
  }

  return false
}

const symbolRunsInColumn = (image: RGBAImage, x: number): number => {
  let runs = 0
  let run = 0

  for (let y = 0; y <= image.height; y += 1) {
    let gold = false
    if (y < image.height) {
      const i = (y * image.width + x) * 4
      gold = isKamasGold(image.data[i]!, image.data[i + 1]!, image.data[i + 2]!)
    }

    if (gold) {
      run += 1
    } else {
      if (run >= SYMBOL_MIN_HEIGHT && run <= SYMBOL_MAX_HEIGHT
        && hasDigitsLeftOf(image, x, y - run, y - 1)) {
        runs += 1
      }
      run = 0
    }
  }

  return runs
}

export const findKamasColumn = (image: RGBAImage): number | null => {
  const runsPerColumn: number[] = new Array(image.width).fill(0)
  for (let x = 0; x < image.width; x += 1) runsPerColumn[x] = symbolRunsInColumn(image, x)

  // Widen over the symbol's own width so the winner is a column *band* rather
  // than whichever single column happened to clip most cleanly.
  let bestX = -1
  let bestScore = 0

  for (let x = 0; x < image.width; x += 1) {
    let score = 0
    for (let dx = -KAMAS_COLUMN_RADIUS; dx <= KAMAS_COLUMN_RADIUS; dx += 1) {
      const nx = x + dx
      if (nx >= 0 && nx < image.width) score += runsPerColumn[nx]!
    }
    if (score > bestScore) {
      bestScore = score
      bestX = x
    }
  }

  return bestScore > 0 ? bestX : null
}

export const findRowBands = (image: RGBAImage): RowBand[] => {
  const column = findKamasColumn(image)
  if (column === null) return []

  const from = Math.max(0, column - KAMAS_COLUMN_RADIUS)
  const to = Math.min(image.width - 1, column + KAMAS_COLUMN_RADIUS)

  const goldPerRow: number[] = new Array(image.height).fill(0)
  const goldXSum: number[] = new Array(image.height).fill(0)

  for (let y = 0; y < image.height; y += 1) {
    let count = 0
    let xSum = 0
    // Only the price column, and only gold that has price text beside it — the
    // same pairing that identified the column. Counting raw gold here instead
    // re-admitted every scenery pixel that happened to fall inside the band,
    // and rows went missing because the merge step then joined them to it.
    for (let x = from; x <= to; x += 1) {
      const i = (y * image.width + x) * 4
      // A window rather than the single scanline: digits have gaps between
      // their strokes, so at some rows of the symbol there is legitimately no
      // ink beside it, and a per-scanline test dropped every other listing.
      if (isKamasGold(image.data[i]!, image.data[i + 1]!, image.data[i + 2]!)
        && hasDigitsLeftOf(image, x, Math.max(0, y - 5), Math.min(image.height - 1, y + 5))) {
        count += 1
        xSum += x
      }
    }
    goldPerRow[y] = count
    goldXSum[y] = xSum
  }

  const bands: RowBand[] = []
  let start = -1
  let gap = 0

  for (let y = 0; y <= image.height; y += 1) {
    const inked = y < image.height && goldPerRow[y]! > 0
    if (inked) {
      if (start < 0) start = y
      gap = 0
    } else if (start >= 0) {
      gap += 1
      // A one-row break is the symbol's own shape, not the end of a row.
      if (gap > 2 || y === image.height) {
        const end = y - gap
        let weight = 0
        let xSum = 0
        for (let i = start; i <= end; i += 1) {
          weight += goldPerRow[i]!
          xSum += goldXSum[i]!
        }
        if (weight > 0) {
          bands.push({ top: start, bottom: end, kamasX: Math.round(xSum / weight) })
        }
        start = -1
        gap = 0
      }
    }
  }

  // Two symbols closer together than a row can be are one symbol split by its
  // own waist, so they merge rather than becoming a phantom listing.
  const merged: RowBand[] = []
  for (const band of bands) {
    const previous = merged[merged.length - 1]
    if (previous && band.top - previous.bottom < MIN_ROW_PITCH) {
      previous.bottom = band.bottom
      continue
    }
    merged.push({ ...band })
  }

  return merged
}

/** Vertical padding around a row band when cutting it out, in pixels. */
export const ROW_PADDING = 10

/** How far left of the symbol a row crop reaches, in pixels. */
export const ROW_LOOKBACK = 320
/** How far right of the symbol it reaches. */
export const ROW_LOOKAHEAD = 40

/**
 * Cuts one listing row out of the frame, ready for the price reader.
 *
 * Windowed horizontally around the symbol as well as vertically. Cropping the
 * full frame width looked harmless and was not: the price reader re-locates the
 * symbol inside whatever it is given, and on a 1919-pixel row that search found
 * the fire-lit scenery at the far right instead of the price. Every row was
 * detected correctly and then thrown away for having "no price region",
 * which is why a page of fourteen listings came back with five.
 */
export const cropRow = (image: RGBAImage, band: RowBand): RGBAImage => {
  const top = Math.max(0, band.top - ROW_PADDING)
  const bottom = Math.min(image.height - 1, band.bottom + ROW_PADDING)
  const left = Math.max(0, band.kamasX - ROW_LOOKBACK)
  const right = Math.min(image.width - 1, band.kamasX + ROW_LOOKAHEAD)

  const height = bottom - top + 1
  const width = right - left + 1
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    const source = ((top + y) * image.width + left) * 4
    data.set(image.data.subarray(source, source + width * 4), y * width * 4)
  }

  return { width, height, data }
}

export interface PageRow {
  band: RowBand
  image: RGBAImage
  /** Index down the page, so a re-scan can line rows up with the last one. */
  ordinal: number
  /** Symbol position inside `image`, so the reader need not re-find it. */
  hintX: number
}

/**
 * Splits a frame into per-listing crops.
 *
 * Rows without a locatable price region are dropped rather than passed on: a
 * band whose price cannot even be found is not a listing, it is a stray gold
 * pixel somewhere else in the interface.
 */
export const splitPageRows = (image: RGBAImage): PageRow[] => {
  const rows: PageRow[] = []

  for (const band of findRowBands(image)) {
    const cropped = cropRow(image, band)
    // Translate the page-level symbol position into the crop's coordinates and
    // hand it over, so the row reader does not re-derive it blind and pick a
    // gold item icon instead.
    const hintX = band.kamasX - Math.max(0, band.kamasX - ROW_LOOKBACK)
    if (!findPriceRegion(cropped, hintX)) continue
    rows.push({ band, image: cropped, ordinal: rows.length, hintX })
  }

  return rows
}
