// Screenshot -> numbers. Everything here is pure client-side: the image is
// preprocessed on a canvas, handed to tesseract.js, and the text is parsed into
// either HDV listing prices or item stat entries.
//
// The image never leaves the browser and is never persisted — callers get the
// parsed result and drop the data URL.
//
// Extracted from items.vue so /brisage can read prices from a screenshot too.
// The preprocessing constants and the token-grouping rules are tuned against
// real Dofus screenshots; treat them as load-bearing.

import { normalizeLabelForStatKey, statsOcrDefs } from '~/utils/itemStats'
import { matchStatLines, splitLeadingValue } from '~/utils/statMatching'
import type { CandidateLine } from '~/utils/statMatching'

export interface OcrWord {
  text?: string
  confidence?: number
  bbox?: { x0: number, y0: number, x1: number, y1: number }
}

export interface OcrDebugRow {
  source: string
  raw: string
  tokens: string[]
  candidate: number | null
}

export interface OcrStatEntry {
  key: string
  label: string
  value: number | null
  suffix: string
  rangeText: string
  raw: string
}

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })

const normalizeOcrLine = (line: string) =>
  line
    .replace(/\s+/g, ' ')
    .replace(/[€$£¥]/g, '')
    .trim()

const loadImageElement = (dataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    if (!import.meta.client) {
      reject(new Error('Image loading is only available in the browser.'))
      return
    }

    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load screenshot image'))
    image.src = dataUrl
  })

const buildProcessedImageDataUrl = async (
  imageBase64: string,
  options: {
    cropLeftRatio?: number
    cropTopRatio?: number
    cropWidthRatio?: number
    cropHeightRatio?: number
    scale?: number
    grayscale?: boolean
    threshold?: number | null
    contrast?: number
    brightness?: number
    /** Stretch the luma range to 0-255 before the contrast pass. */
    normalize?: boolean
    /** Unsharp amount. 0 disables; ~0.6 recovers upscaled glyph edges. */
    sharpen?: number
  }
) => {
  if (!import.meta.client) {
    return imageBase64
  }

  const image = await loadImageElement(imageBase64)
  const cropLeft = Math.max(0, Math.floor(image.width * (options.cropLeftRatio ?? 0)))
  const cropTop = Math.max(0, Math.floor(image.height * (options.cropTopRatio ?? 0)))
  const cropWidth = Math.max(1, Math.floor(image.width * (options.cropWidthRatio ?? 1)))
  const cropHeight = Math.max(1, Math.floor(image.height * (options.cropHeightRatio ?? 1)))
  const scale = options.scale ?? 1

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(cropWidth * scale))
  canvas.height = Math.max(1, Math.floor(cropHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return imageBase64
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    image,
    cropLeft,
    cropTop,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  )

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData
  const contrast = options.contrast ?? 1
  const brightness = options.brightness ?? 0
  const threshold = options.threshold ?? null
  const grayscale = options.grayscale !== false

  // Stretch to the full range before the contrast pass, the way the sharp
  // pipeline on the server already does. A Dofus tooltip is light text on a
  // dark panel and rarely uses more than half the available range, so contrast
  // alone was amplifying a washed-out image instead of a clean one.
  if (options.normalize) {
    let min = 255
    let max = 0
    for (let i = 0; i < data.length; i += 4) {
      const luma = data[i]! * 0.299 + data[i + 1]! * 0.587 + data[i + 2]! * 0.114
      if (luma < min) min = luma
      if (luma > max) max = luma
    }

    const span = max - min
    // Below this the image is flat enough that stretching is amplifying noise.
    if (span > 8) {
      const gain = 255 / span
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, Math.min(255, (data[i]! - min) * gain))
        data[i + 1] = Math.max(0, Math.min(255, (data[i + 1]! - min) * gain))
        data[i + 2] = Math.max(0, Math.min(255, (data[i + 2]! - min) * gain))
      }
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    if (grayscale) {
      const gray = r * 0.299 + g * 0.587 + b * 0.114
      r = gray
      g = gray
      b = gray
    }

    r = Math.max(0, Math.min(255, (r - 128) * contrast + 128 + brightness))
    g = Math.max(0, Math.min(255, (g - 128) * contrast + 128 + brightness))
    b = Math.max(0, Math.min(255, (b - 128) * contrast + 128 + brightness))

    if (threshold !== null) {
      const binary = r >= threshold ? 255 : 0
      r = binary
      g = binary
      b = binary
    }

    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }

  // Unsharp mask last, so it sharpens the corrected image rather than the raw
  // one. Upscaling 3x with smoothing softens every glyph edge; this puts the
  // edge back, which is what the server's sharp pipeline was already doing.
  if (options.sharpen && options.sharpen > 0) {
    applyUnsharpMask(data, canvas.width, canvas.height, options.sharpen)
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * 3x3 unsharp mask over the luma channel.
 *
 * Works on a copy of the source so each output pixel is computed from the
 * original neighbourhood rather than from partially-sharpened neighbours.
 */
const applyUnsharpMask = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
) => {
  const source = new Uint8ClampedArray(data)
  const at = (x: number, y: number) => {
    const cx = Math.max(0, Math.min(width - 1, x))
    const cy = Math.max(0, Math.min(height - 1, y))
    return source[(cy * width + cx) * 4]!
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const blurred = (
        at(x - 1, y - 1) + at(x, y - 1) + at(x + 1, y - 1)
        + at(x - 1, y) + at(x, y) + at(x + 1, y)
        + at(x - 1, y + 1) + at(x, y + 1) + at(x + 1, y + 1)
      ) / 9
      const original = source[index]!
      const sharpened = Math.max(0, Math.min(255, original + (original - blurred) * amount))
      data[index] = sharpened
      data[index + 1] = sharpened
      data[index + 2] = sharpened
    }
  }
}

const preprocessImageForPriceOcrClient = async (imageBase64: string, preCropped = false) => {
  const image = await loadImageElement(imageBase64)
  // The ratios below crop a full HDV screenshot down to its price column. An
  // image that is already a crop must skip them, or the crop is applied twice:
  // a 920x32 row strip came out sliced at 48% and trimmed top and bottom, which
  // cut prices clean in half - "3 695 477" read back as "3695".
  const skipCrop = preCropped || image.width < 220

  return buildProcessedImageDataUrl(imageBase64, {
    cropLeftRatio: skipCrop ? 0 : 0.48,
    cropTopRatio: skipCrop ? 0 : 0.14,
    cropWidthRatio: skipCrop ? 1 : 0.52,
    cropHeightRatio: skipCrop ? 1 : 0.86,
    // A row strip is short, so it needs more upscaling than a tall panel to
    // give tesseract enough pixels per digit.
    scale: preCropped ? 4 : 3,
    grayscale: true,
    // No hard threshold on a row strip. Binarising at 150 was destroying digits
    // outright - measured over eleven rows of a real HDV list it read 5 of 8
    // correctly, against 11 of 11 with the softer treatment the stats path
    // already uses. The full-panel path keeps the threshold, which suits it.
    normalize: preCropped,
    sharpen: preCropped ? 0.6 : 0,
    contrast: preCropped ? 1.15 : 1.35,
    brightness: preCropped ? -10 : 0,
    threshold: preCropped ? null : 150,
  })
}

const preprocessStatsImageClient = async (imageBase64: string) =>
  buildProcessedImageDataUrl(imageBase64, {
    scale: 3,
    grayscale: true,
    normalize: true,
    sharpen: 0.6,
    contrast: 1.15,
    brightness: -10,
    threshold: null,
  })

let tesseractModulePromise: Promise<any> | null = null

const loadTesseractModule = async () => {
  if (!import.meta.client) {
    throw new Error('OCR is only available in the browser.')
  }

  if (!tesseractModulePromise) {
    tesseractModulePromise = import('tesseract.js')
  }

  return tesseractModulePromise
}

/**
 * Dofus is played in French and its tooltips are French, so the recognizer has
 * to be. This used to run `eng`, with the accented characters merely permitted
 * by the character whitelist — a whitelist lets a glyph through, it does not
 * teach the model to read it, so `Vitalité`, `Résistance` and `Poussée` were
 * being decoded by weights that had never seen French.
 *
 * The traineddata is served from `public/tessdata` rather than the tesseract.js
 * CDN so scans work offline and the first paste after a reload doesn't stall on
 * a download.
 */
const OCR_LANGUAGE = 'fra'
const OCR_WORKER_OPTIONS = { langPath: '/tessdata', gzip: false }

/** One worker for the whole session, rather than one per screenshot. */
const workerCache = new Map<string, Promise<any>>()

const getWorker = async (params: Record<string, string>) => {
  const cacheKey = JSON.stringify(params)
  const cached = workerCache.get(cacheKey)
  if (cached) return cached

  const created = (async () => {
    const { createWorker } = await loadTesseractModule()
    const worker = await createWorker(OCR_LANGUAGE, undefined, OCR_WORKER_OPTIONS)
    await worker.setParameters(params)
    return worker
  })()

  workerCache.set(cacheKey, created)

  try {
    return await created
  } catch (error) {
    // A failed init must not poison the cache, or every later scan inherits it.
    workerCache.delete(cacheKey)
    throw error
  }
}

/** Releases the workers. Call on teardown; scans re-create them on demand. */
export const terminateOcrWorkers = async () => {
  const pending = [...workerCache.values()]
  workerCache.clear()
  await Promise.all(pending.map(async (entry) => {
    try {
      const worker = await entry
      await worker.terminate()
    } catch {
      // Nothing useful to do if a worker never came up.
    }
  }))
}

const parsePriceFromNumericTokens = (tokens: string[]) => {
  if (!tokens.length) return null

  const normalized = tokens
    .map((token) => token.replace(/[^\d]/g, ''))
    .filter(Boolean)
    .flatMap((token) => {
      if (token.length <= 3) return [token]

      const groups: string[] = []
      let cursor = token
      while (cursor.length > 3) {
        groups.unshift(cursor.slice(-3))
        cursor = cursor.slice(0, -3)
      }
      if (cursor) groups.unshift(cursor)
      return groups
    })

  if (!normalized.length) return null

  for (let start = 0; start < normalized.length; start++) {
    for (let end = normalized.length; end > start; end--) {
      const slice = normalized.slice(start, end)
      if (slice.length < 2) continue
      if (slice[0].length < 1 || slice[0].length > 3) continue
      if (!slice.slice(1).every((part) => part.length === 3)) continue

      const value = Number(slice.join(''))
      if (!Number.isFinite(value) || value < 100000 || value > 100000000) continue

      const hasSingleDigitPrefix = start > 0 && normalized[start - 1].length === 1
      if (hasSingleDigitPrefix || slice[0].length >= 2 || slice.length >= 2) {
        return value
      }
    }
  }

  const standalone = normalized
    .map((token) => Number(token))
    .filter((value) => Number.isFinite(value) && value >= 100000 && value <= 100000000)

  return standalone.length ? Math.max(...standalone) : null
}

const extractListingCandidatesFromWords = (words: OcrWord[]) => {
  const validWords = words
    .filter((word) => word.text?.trim() && word.bbox)
    .map((word) => ({
      text: normalizeOcrLine(word.text || ''),
      confidence: word.confidence ?? 0,
      x0: word.bbox!.x0,
      y0: word.bbox!.y0,
      x1: word.bbox!.x1,
      y1: word.bbox!.y1,
    }))
    .filter((word) => word.text)

  if (!validWords.length) {
    return { candidates: [] as number[], debugRows: [] as OcrDebugRow[] }
  }

  const maxX = Math.max(...validWords.map((word) => word.x1))
  const maxY = Math.max(...validWords.map((word) => word.y1))
  const listingWords = validWords
    .filter((word) => {
      const lower = word.text.toLowerCase()
      if (/(acheter|prix|moyen|inventaire|banque|havre|sac|niv|niveau|lot)/.test(lower)) {
        return false
      }
      return word.x0 >= maxX * 0.45 && word.y0 >= maxY * 0.18
    })
    .sort((a, b) => {
      if (Math.abs(a.y0 - b.y0) > 6) return a.y0 - b.y0
      return a.x0 - b.x0
    })

  const rows: typeof listingWords[] = []
  for (const word of listingWords) {
    const lastRow = rows.at(-1)
    if (!lastRow) {
      rows.push([word])
      continue
    }
    const lastY = lastRow.reduce((sum, item) => sum + item.y0, 0) / lastRow.length
    if (Math.abs(word.y0 - lastY) <= 10) {
      lastRow.push(word)
    } else {
      rows.push([word])
    }
  }

  const candidates: number[] = []
  const debugRows: OcrDebugRow[] = []

  for (const row of rows) {
    const rowTokens = row.map((word) => word.text).filter(Boolean)
    const numericTokens = rowTokens
      .filter((token) => /\d/.test(token))
      .map((token) => token.replace(/[^\d]/g, ''))
      .filter((token) => token.length > 0)

    if (!numericTokens.length && !rowTokens.length) continue

    const numeric = parsePriceFromNumericTokens(numericTokens)
    debugRows.push({
      source: 'word',
      raw: rowTokens.join(' '),
      tokens: numericTokens,
      candidate: numeric,
    })

    if (!numeric) continue
    candidates.push(numeric)
  }

  return { candidates, debugRows }
}

const extractListingCandidatesFromText = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeOcrLine)
    .filter(Boolean)

  const candidates: number[] = []
  const debugRows: OcrDebugRow[] = []

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (
      lower.includes('prix moyen') ||
      lower.includes('quantite en inventaire') ||
      lower.includes('quantite en banque') ||
      lower.includes('quantite en havre-sac') ||
      lower.includes('niv.') ||
      lower.includes('niveau')
    ) {
      continue
    }

    const numericTokens = line.match(/\d+/g) ?? []
    const numeric = parsePriceFromNumericTokens(numericTokens)
    debugRows.push({
      source: 'text',
      raw: line,
      tokens: numericTokens,
      candidate: numeric,
    })

    if (!numeric) continue
    candidates.push(numeric)
  }

  return { candidates, debugRows }
}

const cleanStatLine = (line: string) => {
  let cleaned = normalizeOcrLine(line)
  cleaned = cleaned.replace(/^[^0-9A-Za-zàâäçéèêëîïôöùûüÿœ%+\-\[]+/, '')
  cleaned = cleaned.replace(/^[A-Za-z]{1,2}\s+(?=\d)/, '')
  cleaned = cleaned.replace(/^(\d{1,2})\s+(\d{1,3})(?=\s+[A-Za-zàâäçéèêëîïôöùûüÿœ])/i, '$2')
  cleaned = cleaned.replace(/(\d)\s+%/g, '$1%')
  // "1PA" — tesseract drops the space on short lines often enough to matter,
  // and glued together the value and the stat name are both unreadable.
  cleaned = splitLeadingValue(cleaned)
  cleaned = cleaned.replace(/\[\s+/g, '[').replace(/\s+\]/g, ']')
  return cleaned.trim()
}

/**
 * Whether a cleaned line could plausibly be a stat at all.
 *
 * Kept as a cheap pre-filter so tooltip chrome (level lines, weapon headers)
 * never reaches the matcher. Deciding *which* stat a line is now belongs
 * entirely to `matchStatLines`, which has the item's own roll table to work
 * from and does not need to be defended from noise here.
 */
const isPlausibleStatLine = (line: string) => {
  const lower = line.toLowerCase()
  if (lower.includes('niv.') || lower.includes('niveau')) return false
  if (lower.includes('armes') || lower.includes('weapon')) return false
  if (line.length < 4) return false
  if (!/[A-Za-zÀ-ſ]/.test(line)) return false

  if (/[0-9]/.test(line)) return true

  // A line with no number is only a stat if it is one of the binary ones.
  const normalized = normalizeLabelForStatKey(line)
  return statsOcrDefs.some((def) =>
    def.binary && [def.label, ...def.aliases].some((alias) => normalizeLabelForStatKey(alias) === normalized),
  )
}


/** Left edge of the tooltip, taken from where EFFETS was read. */
const EFFETS_LEFT_MARGIN = 40

/**
 * Drops everything left of the tooltip's own heading.
 *
 * Returns null when the heading was not found, so the caller keeps every line
 * rather than throwing away a whole capture on a heading the recognizer
 * happened to miss.
 */
export const keepTooltipLines = (lines: any[] | undefined): string[] | null => {
  if (!Array.isArray(lines) || !lines.length) return null

  const heading = lines.find((line: any) =>
    normalizeLabelForStatKey(String(line?.text || '')).includes('effets'))
  const headingX = heading?.bbox?.x0
  if (!Number.isFinite(headingX)) return null

  const cutoff = Number(headingX) - EFFETS_LEFT_MARGIN

  return lines
    .filter((line: any) => Number(line?.bbox?.x0 ?? 0) >= cutoff)
    .map((line: any) => normalizeOcrLine(String(line?.text || '')))
    .filter(Boolean)
}

const PRICE_OCR_PARAMS = {
  tessedit_pageseg_mode: '6',
  tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,'-:",
  preserve_interword_spaces: '1',
}

/** Accented capitals and the typographic apostrophe were unrepresentable. */
const STATS_OCR_PARAMS = {
  tessedit_pageseg_mode: '6',
  tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸŒabcdefghijklmnopqrstuvwxyzàâäçéèêëîïôöùûüÿœ%+-[]() .,'’:",
  preserve_interword_spaces: '1',
}

/**
 * Reads prices off a screenshot.
 *
 * `preCropped` says the caller has already isolated the area — a single row
 * strip, say — so the built-in crop to the HDV price column must be skipped.
 */
export const runPriceOcr = async (imageBase64: string, preCropped = false) => {
  const worker = await getWorker(PRICE_OCR_PARAMS)
  const ocrInput = await preprocessImageForPriceOcrClient(imageBase64, preCropped)
  const result = await worker.recognize(ocrInput)
  const text = result?.data?.text || ''
  const wordResult = extractListingCandidatesFromWords(result?.data?.words || [])
  const fallbackResult = extractListingCandidatesFromText(text)
  const useWordCandidates = wordResult.candidates.length > 0

  return {
    text,
    candidates: useWordCandidates ? wordResult.candidates : fallbackResult.candidates,
    debugMode: useWordCandidates ? 'word' : 'text',
    debugRows: useWordCandidates ? wordResult.debugRows : fallbackResult.debugRows,
    // What the recognizer was actually given. Showing the raw crop instead hid
    // the real fault for hours: the crop looked perfectly legible while the
    // preprocessed image handed to tesseract was mush.
    processedImage: ocrInput,
  }
}

/**
 * Reads the stat lines off a tooltip screenshot.
 *
 * `expectedLines` is the item's own roll table. Passing it turns the hard
 * problem (read arbitrary French text correctly) into an easy one (decide which
 * of about five known lines this is), which is where most of the accuracy comes
 * from — see `app/utils/statMatching.ts`. It stays optional so a caller without
 * a resolved item still gets the catalogue-wide fuzzy match.
 */
export const runStatsOcr = async (
  imageBase64: string,
  expectedLines: CandidateLine[] = [],
) => {
  const worker = await getWorker(STATS_OCR_PARAMS)
  const ocrInput = await preprocessStatsImageClient(imageBase64)
  const result = await worker.recognize(ocrInput)
  const text = result?.data?.text || ''
  const ocrLines = Array.isArray(result?.data?.lines)
    ? result.data.lines.map((line: any) => normalizeOcrLine(line?.text || '')).filter(Boolean)
    : text.split(/\r?\n/).map(normalizeOcrLine).filter(Boolean)

  // Keep only what sits inside the tooltip.
  //
  // The crop starts at the cursor but Dofus anchors the tooltip to the panel,
  // so everything between is price rows, inventory and taskbar — fifteen lines
  // of "1 3 500 000 ACHETER" offered to the stat matcher every capture.
  // Detecting the panel by pixels failed because both sides are flat UI, but
  // the tooltip announces itself: it contains EFFETS, and tesseract reports
  // where it read it.
  const keptLines = keepTooltipLines(result?.data?.lines)
  const sourceLines = keptLines ?? ocrLines

  const cleaned = sourceLines
    .map(cleanStatLine)
    .filter(Boolean)
    .filter(isPlausibleStatLine)

  return {
    text,
    processedImage: ocrInput,
    ...matchStatLines(cleaned, expectedLines),
  }
}

export const readClipboardImageDataUrl = async () => {
  if (!import.meta.client || !navigator.clipboard?.read) {
    throw new Error('Clipboard image reading is not supported here.')
  }

  const clipboardItems = await navigator.clipboard.read()
  for (const item of clipboardItems) {
    const imageType = item.types.find((type) => type.startsWith('image/'))
    if (!imageType) continue
    const blob = await item.getType(imageType)
    return await readFileAsDataUrl(new File([blob], `clipboard.${imageType.split('/')[1] || 'png'}`, { type: imageType }))
  }

  throw new Error('No image found in clipboard.')
}
