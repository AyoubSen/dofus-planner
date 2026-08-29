// Finding the digits in a price row by colour, not by luminance.
//
// Segmenting the price out of a grayscale strip kept failing, and the reason is
// that grayscale throws away the one signal that makes the row unambiguous. A
// listing row contains, left to right: an item icon (fully coloured), a lot
// count, a grey star, the price (near-white), the kamas symbol (saturated
// gold), and the ACHETER button (near-white text on a *lighter* plate). In
// luminance those are all "bright things", which is why a run of button letters
// looks exactly like a run of digits and why the panel itself segments as one
// enormous glyph.
//
// In colour they are trivially distinct. The kamas symbol is the only strongly
// saturated gold object on the row, and the price is always immediately to its
// left. That single anchor turns "find seven digits somewhere in 920 pixels"
// into "read the near-white text in this 150-pixel window", which is a problem
// with one answer.
//
// This is the same move the plan makes everywhere else: anchor on something
// structural the client guarantees, rather than on a measurement of where the
// pointer happened to be.

export interface RGBAImage {
  width: number
  height: number
  data: Uint8ClampedArray
}

export interface PriceRegion {
  /** First column of the price text, inclusive. */
  x0: number
  /** Last column, inclusive. */
  x1: number
  /** Column where the kamas symbol starts, i.e. the right edge of the search. */
  kamasX: number
}

const at = (image: RGBAImage, x: number, y: number) => {
  const i = (y * image.width + x) * 4
  return {
    r: image.data[i]!,
    g: image.data[i + 1]!,
    b: image.data[i + 2]!,
  }
}

/**
 * Gold: bright, red and green together, blue clearly behind.
 *
 * Loose enough to survive the symbol's shading and the anti-aliased edge,
 * tight enough that neither white text nor the grey star qualifies.
 */
export const isKamasGold = (r: number, g: number, b: number): boolean =>
  r > 140 && g > 110 && b < Math.min(r, g) - 45 && r >= g - 30

/** Near-white: bright and close to neutral. This is how the client draws text. */
export const isTextWhite = (r: number, g: number, b: number): boolean => {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return min > 150 && max - min < 40
}

/**
 * Locates the kamas symbol, as the densest column run of gold pixels.
 *
 * Densest rather than first: item icons contain gold too, and they sit at the
 * far left of the row. The symbol is small and solid, so it wins on density
 * per column while an icon's gold is scattered through other colours.
 */
export const findKamasSymbol = (
  image: RGBAImage,
  /**
   * Where the symbol is already known to be, in this image's coordinates.
   *
   * Supplied when a caller has located the price column across a whole page and
   * is now handing over one row. Without it the search is blind, and blind is
   * not good enough on a real row: an item whose icon is itself gold — a cape,
   * a ring — produces a denser gold run than the currency symbol, wins on
   * density, and takes the price region with it. Every row of one real page was
   * detected correctly and then discarded for "no price region" because of it.
   */
  hintX?: number,
): { x0: number; x1: number } | null => {
  const goldPerColumn: number[] = new Array(image.width).fill(0)

  for (let x = 0; x < image.width; x += 1) {
    let count = 0
    for (let y = 0; y < image.height; y += 1) {
      const { r, g, b } = at(image, x, y)
      if (isKamasGold(r, g, b)) count += 1
    }
    goldPerColumn[x] = count
  }

  // Group into runs, allowing a one-column break for the symbol's thin waist.
  const runs: Array<{ x0: number; x1: number; total: number }> = []
  let start = -1
  let gap = 0

  for (let x = 0; x <= image.width; x += 1) {
    const inked = x < image.width && goldPerColumn[x]! > 0
    if (inked) {
      if (start < 0) start = x
      gap = 0
    } else if (start >= 0) {
      gap += 1
      if (gap > 1 || x === image.width) {
        const x1 = x - gap
        let total = 0
        for (let i = start; i <= x1; i += 1) total += goldPerColumn[i]!
        runs.push({ x0: start, x1, total })
        start = -1
        gap = 0
      }
    }
  }

  if (!runs.length) return null

  // Prefer compact, solid runs: the symbol is roughly as tall as the text and
  // only a handful of columns wide, so density separates it from an icon.
  const usable = runs
    .map((run) => ({ run, density: run.total / Math.max(1, run.x1 - run.x0 + 1) }))
    .filter((entry) => entry.run.x1 - entry.run.x0 + 1 <= 24)

  if (!usable.length) return null

  // With a hint, nearest wins outright — the caller has already established
  // where the price column is across the whole page, which is strictly better
  // evidence than anything one row can offer.
  if (typeof hintX === 'number') {
    const nearest = usable
      .map((entry) => ({
        entry,
        distance: Math.min(Math.abs(entry.run.x0 - hintX), Math.abs(entry.run.x1 - hintX)),
      }))
      .sort((a, b) => a.distance - b.distance)[0]!

    return { x0: nearest.entry.run.x0, x1: nearest.entry.run.x1 }
  }

  const best = usable.sort((a, b) => b.density - a.density)[0]!
  return { x0: best.run.x0, x1: best.run.x1 }
}

/** Padding left of the kamas symbol searched for the price, in pixels. */
export const PRICE_LOOKBACK = 190

/**
 * The window holding the price text.
 *
 * Bounded on the right by the kamas symbol, which the client always draws
 * immediately after the number, and on the left by the first sustained gap in
 * white text — the space between the star and the price is far wider than the
 * space between thousands groups.
 */
export const findPriceRegion = (image: RGBAImage, hintX?: number): PriceRegion | null => {
  const kamas = findKamasSymbol(image, hintX)
  if (!kamas) return null

  const whitePerColumn: number[] = new Array(image.width).fill(0)
  for (let x = 0; x < image.width; x += 1) {
    let count = 0
    for (let y = 0; y < image.height; y += 1) {
      const { r, g, b } = at(image, x, y)
      if (isTextWhite(r, g, b)) count += 1
    }
    whitePerColumn[x] = count
  }

  const searchFrom = Math.max(0, kamas.x0 - PRICE_LOOKBACK)
  let x1 = -1
  for (let x = kamas.x0 - 1; x >= searchFrom; x -= 1) {
    if (whitePerColumn[x]! > 0) { x1 = x; break }
  }
  if (x1 < 0) return null

  // Walk left through the digits. A gap wider than a thousands separator means
  // the number has ended and the next thing is the star or the lot count.
  const SEPARATOR_MAX = 7
  let x0 = x1
  let run = 0

  for (let x = x1; x >= searchFrom; x -= 1) {
    if (whitePerColumn[x]! > 0) {
      x0 = x
      run = 0
    } else {
      run += 1
      if (run > SEPARATOR_MAX) break
    }
  }

  if (x1 - x0 < 8) return null
  return { x0, x1, kamasX: kamas.x0 }
}
