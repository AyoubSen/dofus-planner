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

import {
  findSpecialMageDef,
  hasWholeWordStatAliasMatch,
  normalizeLabelForStatKey,
  statsOcrDefs,
} from '~/utils/itemStats'

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

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

const preprocessImageForPriceOcrClient = async (imageBase64: string) => {
  const image = await loadImageElement(imageBase64)
  const isNarrowPriceCrop = image.width < 220

  return buildProcessedImageDataUrl(imageBase64, {
    cropLeftRatio: isNarrowPriceCrop ? 0 : 0.48,
    cropTopRatio: isNarrowPriceCrop ? 0 : 0.14,
    cropWidthRatio: isNarrowPriceCrop ? 1 : 0.52,
    cropHeightRatio: isNarrowPriceCrop ? 1 : 0.86,
    scale: 3,
    grayscale: true,
    contrast: 1.35,
    threshold: 150,
  })
}

const preprocessStatsImageClient = async (imageBase64: string) =>
  buildProcessedImageDataUrl(imageBase64, {
    scale: 3,
    grayscale: true,
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
  cleaned = cleaned.replace(/\[\s+/g, '[').replace(/\s+\]/g, ']')
  return cleaned.trim()
}

const parseClientStatLine = (line: string) => {
  const specialDef = findSpecialMageDef(line)
  if (specialDef) {
    const rangeMatch = line.match(/\[[^\]]+\]/)
    const firstNumberMatch = line.match(/-?\d+/)
    const value = firstNumberMatch
      ? Number(firstNumberMatch[0])
      : specialDef.binary
        ? 1
        : null

    return {
      key: specialDef.key,
      label: specialDef.label,
      value: Number.isFinite(value as number) ? value : null,
      suffix: specialDef.suffix || '',
      rangeText: rangeMatch?.[0] || '',
      raw: line,
    }
  }

  const normalized = normalizeLabelForStatKey(line)
  const exactDef = statsOcrDefs.find((def) =>
    [def.label, ...def.aliases].some((alias) => normalizeLabelForStatKey(alias) === normalized),
  )
  const matchedDef = exactDef || statsOcrDefs
    .map((def) => ({
      def,
      matchedAlias: [def.label, ...def.aliases]
        .map((alias) => normalizeLabelForStatKey(alias))
        .find((alias) => hasWholeWordStatAliasMatch(normalized, alias)) || '',
    }))
    .filter((entry) => entry.matchedAlias)
    .sort((a, b) => b.matchedAlias.length - a.matchedAlias.length)[0]?.def

  if (!matchedDef) return null

  const firstNumberMatch = line.match(/-?\d+/)
  const value = firstNumberMatch
    ? Number(firstNumberMatch[0])
    : matchedDef.binary
      ? 1
      : null
  const rangeMatch = line.match(/\[[^\]]+\]/)

  return {
    key: matchedDef.key,
    label: matchedDef.label,
    value: Number.isFinite(value as number) ? value : null,
    suffix: matchedDef.suffix || '',
    rangeText: rangeMatch?.[0] || '',
    raw: line,
  }
}

const extractClientStatEntries = (rawLines: string[]) => {
  const lines = rawLines.map(cleanStatLine).filter(Boolean)
  const candidates = lines.filter((line) => {
    const lower = line.toLowerCase()
    if (lower.includes('niv.') || lower.includes('niveau')) return false
    if (lower.includes('armes') || lower.includes('weapon')) return false
    if (line.length < 4) return false
    if (!/[A-Za-zàâäçéèêëîïôöùûüÿœ]/i.test(line)) return false

    if (/\d/.test(line)) return true

    const normalized = normalizeLabelForStatKey(line)
    return statsOcrDefs.some((def) =>
      def.binary && [def.label, ...def.aliases].some((alias) => normalizeLabelForStatKey(alias) === normalized),
    )
  })

  const unique: OcrStatEntry[] = []
  const seen = new Set<string>()

  for (const line of candidates) {
    const parsed = parseClientStatLine(line)
    if (!parsed) continue
    const dedupeKey = `${parsed.key}:${parsed.value ?? 'na'}:${parsed.rangeText}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    unique.push(parsed)
  }

  return unique
}

export const runPriceOcr = async (imageBase64: string) => {
  const { createWorker } = await loadTesseractModule()
  const worker = await createWorker('eng')

  try {
    const ocrInput = await preprocessImageForPriceOcrClient(imageBase64)
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,'-:",
      preserve_interword_spaces: '1',
    })

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
    }
  } finally {
    await worker.terminate()
  }
}

export const runStatsOcr = async (imageBase64: string) => {
  const { createWorker } = await loadTesseractModule()
  const worker = await createWorker('eng')

  try {
    const ocrInput = await preprocessStatsImageClient(imageBase64)
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzàâäçéèêëîïôöùûüÿœ%+-[]() .,'-:",
      preserve_interword_spaces: '1',
    })

    const result = await worker.recognize(ocrInput)
    const text = result?.data?.text || ''
    const ocrLines = Array.isArray(result?.data?.lines)
      ? result.data.lines.map((line: any) => normalizeOcrLine(line?.text || '')).filter(Boolean)
      : text.split(/\r?\n/).map(normalizeOcrLine).filter(Boolean)

    return {
      text,
      entries: extractClientStatEntries(ocrLines),
    }
  } finally {
    await worker.terminate()
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
