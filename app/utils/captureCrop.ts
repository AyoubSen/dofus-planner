import { findPanelLeftEdge } from './tooltipEdge'
import { findTextBand } from './textBand'
import { readPrice, type PriceReading } from './render/priceReader'
import { splitPageRows } from './render/pageRows'
import type { GlyphAtlasRaster } from './render/types'
import { inkMask, readLine } from './glyphMatch'
import { loadGlyphAtlas, isAtlasReady } from './glyphAtlasStore'

// Finding the price and the tooltip in a screenshot, without being told where.
//
// The first version had the user calibrate pixel rectangles. That was wrong:
// an HDV price sits in a fixed column but on a moving row, so a rectangle
// anchored to the pointer slid off the number whenever the pointer was on the
// item icon instead — which is most of the time. Rather than ask for ever more
// precise coordinates, the app now takes the whole screen and works out where
// to look, because it can see the picture and the companion cannot.

/**
 * A band across the row being pointed at.
 *
 * Was 32 px, chosen to stay under one row's height so a neighbouring row's
 * text could not intrude. That reasoning holds only if the pointer sits in the
 * middle of the row, and it does not: the price is drawn at the row's vertical
 * centre while the pointer lands wherever the user happens to put it, so
 * hovering near a row's edge slid the band off the number and clipped the
 * digits in half. Nine of the first thirty real captures failed this way.
 *
 * Now generous enough to contain the whole row from any hover position, with
 * `findTextBand` picking the actual line of text out of it — which is a
 * measurement rather than an assumption about where the pointer was.
 */
export const PRICE_STRIP_HEIGHT = 64

/**
 * How far either side of the pointer the price is looked for.
 *
 * Reading the full width pulled in the chat panel, the inventory and the kamas
 * counter, and since the price is picked as the largest number on the line, a
 * kamas total of 11 029 041 won every time. The price is always within a few
 * hundred pixels of the row you are pointing at.
 */
export const PRICE_STRIP_REACH = 460

/** Below this there is no room for a tooltip, so Dofus flips it to the left. */
export const TOOLTIP_MIN_WIDTH = 380

/** Prices in the HDV run from a few thousand to tens of millions. */
export const MIN_PRICE = 1_000
export const MAX_PRICE = 500_000_000

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * The row under the pointer, windowed around it.
 *
 * Wide enough that the price column can sit anywhere in the HDV panel without
 * calibration, narrow enough to exclude the chat, inventory and kamas counter —
 * all of which carry numbers larger than the price and would otherwise win.
 */
export const priceStripRect = (
  cursorX: number,
  cursorY: number,
  screenWidth: number,
  screenHeight: number,
): CropRect => {
  const height = Math.min(PRICE_STRIP_HEIGHT, screenHeight)
  const y = Math.max(0, Math.min(cursorY - Math.floor(height / 2), screenHeight - height))

  const x = Math.max(0, cursorX - PRICE_STRIP_REACH)
  const width = Math.min(screenWidth - x, PRICE_STRIP_REACH * 2)

  return { x, y, width, height }
}

/**
 * The area the tooltip occupies, taken as everything to one side of the pointer.
 *
 * Dofus opens the tooltip beside the hovered row, flipping to whichever side
 * has room. Picking the roomier side handles both without needing to know the
 * tooltip's size, and the stat matcher discards whatever else lands in frame.
 */
export const tooltipRect = (
  cursorX: number,
  cursorY: number,
  screenWidth: number,
  screenHeight: number,
): CropRect => {
  const spaceRight = screenWidth - cursorX

  // Prefer the right, because that is where Dofus puts it; only fall left when
  // there is genuinely no room. Comparing the two sides for the *roomier* one
  // sent it left whenever the pointer was past the middle of the screen, which
  // meant cropping the chat panel and finding no stats at all.
  const useRight = spaceRight >= TOOLTIP_MIN_WIDTH

  const width = useRight
    ? Math.min(700, spaceRight - 8)
    : Math.max(TOOLTIP_MIN_WIDTH, Math.min(700, cursorX - 8))
  const x = useRight
    ? Math.min(cursorX + 8, screenWidth - width)
    : Math.max(0, cursorX - 8 - width)

  // Generously tall, and started above the pointer, because the tooltip opens
  // downward from the row until it would run off the screen and then flips up.
  const height = Math.min(700, screenHeight)
  const y = Math.max(0, Math.min(cursorY - 120, screenHeight - height))

  return { x, y, width, height }
}

/**
 * Picks the listing price out of everything read on the row.
 *
 * The strip also catches the lot count, the item level and whatever else shares
 * that line, so candidates are filtered by plausible magnitude and the largest
 * is taken — a price is always the biggest number on its row.
 */
/**
 * A price far outside what the item already sells for is a misread.
 *
 * This is the guard that matters: OCR will always slip occasionally, and
 * without it a truncated "2 750 000" read as "2 750" surfaced as the best buy
 * on the list. Refusing an implausible number is always better than inventing
 * a bargain from one.
 */
export interface PriceCheck {
  /** Whether the price may be stored at all. */
  ok: boolean
  /**
   * Whether anything actually verified it.
   *
   * The distinction the boolean form could not carry. With no history there is
   * nothing to compare against, so the first price on an item is *accepted
   * unchecked* — and it then becomes the median that every later price is judged
   * against. A truncated first read therefore does not just store one wrong
   * number, it sets the standard that admits more of them. Callers record this
   * so an unchecked price can be shown as unverified rather than passing as
   * though it had been examined.
   */
  checked: boolean
  median: number
}

/** Full form of the plausibility test, reporting whether it could check at all. */
export const checkPriceAgainst = (price: number, knownPrices: number[]): PriceCheck => {
  const usable = knownPrices.filter((value) => Number.isFinite(value) && value > 0)
  if (!usable.length) return { ok: true, checked: false, median: 0 }

  const sorted = usable.slice().sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]!

  // An order of magnitude either side. Real bargains are perhaps 50% under the
  // going rate; something 99% under is a dropped digit, not a find.
  return { ok: price >= median / 8 && price <= median * 8, checked: true, median }
}

export const isPlausibleAgainst = (price: number, knownPrices: number[]): boolean =>
  checkPriceAgainst(price, knownPrices).ok

/**
 * Letters the recognizer confuses with digits, repaired inside runs that are
 * already mostly digits.
 *
 * One bad character in the final group truncated the whole price: "2 750 0O0"
 * matched only "2 750" and was saved as a 2 750 kama listing, which then
 * surfaced as the best buy on the list.
 */
const repairDigitRun = (run: string) => run
  .replace(/[OoDQ]/g, '0')
  .replace(/[lI|]/g, '1')
  .replace(/[Ss]/g, '5')
  .replace(/[Bb]/g, '8')

export const pickPriceFromStrip = (text: string): number | null => {
  const normalized = String(text || '')
    // Thousands are space-separated in the French client, and OCR sometimes
    // reads those gaps as nothing at all.
    .replace(/[  ]/g, ' ')
    .replace(/\d[\d OoDQlI|SsBb.]*[\dOoDQlI|SsBb]/g, repairDigitRun)

  // Two shapes only: thousands grouped the French way ("2 599 999"), or a run
  // of digits with the gaps lost in OCR ("2749999"). Anything looser merges the
  // lot count into the price — "1 2 599 999" became 12 599 999.
  const candidates: number[] = []
  // One leading run, then any number of three-digit groups.
  //
  // Written as an alternation of "fully grouped" and "no groups at all", it
  // could not read a price that lost only *some* of its separators - and that
  // is the common OCR failure. "2 750 000" came back as "2750 000", which
  // parsed as two numbers, 2750 and 000, and saved a 2 750 kama listing off a
  // 2 750 000 one. The separator repeats because OCR also widens gaps.
  //
  // The lookarounds still matter: without them "1 2749999" matched a leading
  // "1 274" and read the leftover "9999" as the price.
  const pattern = /(?<!\d)\d{1,9}(?:[ .]{1,3}\d{3})*(?!\d)/g

  for (const match of normalized.matchAll(pattern)) {
    const digits = match[0].replace(/[^\d]/g, '')
    if (!digits) continue
    const value = Number(digits)
    if (!Number.isFinite(value)) continue
    if (value < MIN_PRICE || value > MAX_PRICE) continue
    candidates.push(value)
  }

  if (!candidates.length) return null
  return Math.max(...candidates)
}

/** Crops a region out of a data URL, returning a new data URL. */
export const cropDataUrl = async (dataUrl: string, rect: CropRect): Promise<string> => {
  if (!import.meta.client) return dataUrl

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('Could not read the capture frame'))
    element.src = dataUrl
  })

  const width = Math.max(1, Math.min(rect.width, image.naturalWidth - rect.x))
  const height = Math.max(1, Math.min(rect.height, image.naturalHeight - rect.y))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl

  ctx.drawImage(image, rect.x, rect.y, width, height, 0, 0, width, height)
  return canvas.toDataURL('image/png')
}

/**
 * Trims a wide crop down to the tooltip panel inside it.
 *
 * The wide crop starts at the cursor, but Dofus anchors the tooltip to the
 * panel — so everything between the two is price rows, inventory and taskbar.
 * Left in, the stat matcher was handed fifteen lines of "1 3 500 000 ACHETER"
 * per capture. Finding the panel keeps the crop to the thing being read.
 */
export const trimToTooltipPanel = async (dataUrl: string): Promise<string> => {
  if (!import.meta.client) return dataUrl

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('Could not read the tooltip crop'))
    element.src = dataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl

  ctx.drawImage(image, 0, 0)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const edge = findPanelLeftEdge(data, canvas.width, canvas.height)
  // No panel found means no tooltip was open, or the look changed. Returning
  // the crop untouched is the safe answer; guessing an edge would crop at
  // random.
  if (edge === null || edge <= 0) return dataUrl

  const trimmed = document.createElement('canvas')
  trimmed.width = canvas.width - edge
  trimmed.height = canvas.height
  const trimmedCtx = trimmed.getContext('2d')
  if (!trimmedCtx) return dataUrl

  trimmedCtx.drawImage(canvas, edge, 0, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height)
  return trimmed.toDataURL('image/png')
}

/**
 * Reads a price by matching the client's own glyphs.
 *
 * Preferred over OCR because it is deterministic: the same pixels always give
 * the same answer, where the recognizer could read one price correctly and the
 * next identical-looking one as "sessarr ge". Returns null when the atlas has
 * not been taught, or when any glyph in the line is unknown — a refusal is
 * always better than a wrong digit in a price.
 */
export const readPriceByGlyphs = async (dataUrl: string): Promise<number | null> => {
  if (!import.meta.client) return null

  const atlas = loadGlyphAtlas()
  if (!isAtlasReady(atlas)) return null

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('Could not read the price strip'))
    element.src = dataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(image, 0, 0)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const mask = inkMask(data, canvas.width, canvas.height)
  const result = readLine(atlas, mask, canvas.width, canvas.height)

  // Any unread glyph disqualifies the whole line. Half a price is worse than
  // none: "2 750 000" missing a digit is what produced a 2 750 kama "bargain".
  if (!result.complete) return null

  return pickPriceFromStrip(result.text)
}

/**
 * Trims a generous price band down to the line of text the pointer was on.
 *
 * The band is cut around the cursor, so it contains whatever else shares that
 * part of the screen. Narrowing it by content rather than by a tighter constant
 * is what lets the crop be loose enough never to clip the digits — see
 * `textBand.ts`. Returns the crop untouched when no text is found, because
 * guessing a band would be worse than reading a slightly loose one.
 */
export const trimToTextBand = async (
  dataUrl: string,
  cursorRow: number,
): Promise<string> => {
  if (!import.meta.client) return dataUrl

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('Could not read the price strip'))
    element.src = dataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl

  ctx.drawImage(image, 0, 0)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const band = findTextBand(data, canvas.width, canvas.height, cursorRow)
  if (!band) return dataUrl

  const height = band.bottom - band.top + 1
  if (height <= 0 || height >= canvas.height) return dataUrl

  const trimmed = document.createElement('canvas')
  trimmed.width = canvas.width
  trimmed.height = height
  const trimmedCtx = trimmed.getContext('2d')
  if (!trimmedCtx) return dataUrl

  trimmedCtx.drawImage(canvas, 0, band.top, canvas.width, height, 0, 0, canvas.width, height)
  return trimmed.toDataURL('image/png')
}

/**
 * Reads a price by reconstruction, using an atlas built from real captures.
 *
 * This replaces `readPriceByGlyphs`, which never once produced a reading in
 * thirty-nine real captures — its atlas had to be taught a character at a time
 * by hand and in practice never became ready, so every price the app ever
 * stored came from the statistical fallback nobody wanted to trust.
 *
 * The atlas here is cut from the client's own pixels using prices the user has
 * confirmed, so it exists as soon as a handful of captures have been reviewed.
 * Measured on the first thirty, leave-one-out: 24 read correctly, 0 wrong, 6
 * refused.
 */
export const readPriceByReconstruction = async (
  dataUrl: string,
  atlas: GlyphAtlasRaster,
): Promise<PriceReading | null> => {
  if (!import.meta.client) return null

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('Could not read the price strip'))
    element.src = dataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(image, 0, 0)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  return readPrice({ width: canvas.width, height: canvas.height, data }, { atlas })
}

export interface PageScanRow {
  ordinal: number
  price: number | null
  reason: PriceReading['reason']
  residual: number
  /** Where down the frame it was found, for lining up a re-scan. */
  top: number
}

/**
 * Reads every listing visible in a full frame.
 *
 * One press instead of one per row. The cursor plays no part: rows are found by
 * their kamas symbols, so what the pointer was over stops mattering entirely —
 * which is also why this could not have been done while the crop was positioned
 * from the cursor.
 *
 * Prices only. Rolls live in a tooltip that appears on hover, so exos still
 * need a pass with the mouse; what this removes is the thirty presses needed to
 * learn what a page costs.
 */
export const readPagePrices = async (
  frameDataUrl: string,
  atlas: GlyphAtlasRaster,
): Promise<PageScanRow[]> => {
  if (!import.meta.client) return []

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('Could not read the capture frame'))
    element.src = frameDataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return []

  ctx.drawImage(image, 0, 0)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  return splitPageRows({ width: canvas.width, height: canvas.height, data })
    .map((row) => {
      const reading = readPrice(row.image, { atlas })
      return {
        ordinal: row.ordinal,
        price: reading.value,
        reason: reading.reason,
        residual: reading.residual,
        top: row.band.top,
      }
    })
}

/** Natural pixel size of a data URL, needed before any cropping can be planned. */
export const imageSize = async (dataUrl: string): Promise<{ width: number; height: number }> => {
  if (!import.meta.client) return { width: 0, height: 0 }

  return new Promise((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve({ width: element.naturalWidth, height: element.naturalHeight })
    element.onerror = () => reject(new Error('Could not read the capture frame'))
    element.src = dataUrl
  })
}
