import { createWorker } from 'tesseract.js'
import sharp from 'sharp'

const normalizeLine = (line: string) =>
  line
    .replace(/\s+/g, ' ')
    .replace(/[€$£¥]/g, '')
    .trim()

type OcrWord = {
  text?: string
  confidence?: number
  bbox?: {
    x0: number
    y0: number
    x1: number
    y1: number
  }
}

type OcrDebugRow = {
  source: 'word' | 'text'
  raw: string
  tokens: string[]
  candidate: number | null
}

const parsePriceFromNumericTokens = (tokens: string[]) => {
  if (!tokens.length) {
    return null
  }

  const normalized = tokens
    .map((token) => token.replace(/[^\d]/g, ''))
    .filter(Boolean)

  if (!normalized.length) {
    return null
  }

  // HDV rows usually look like:
  // quantity + price groups + optional OCR junk
  // e.g. ["1", "666", "665", "4"] -> 666665
  for (let start = 0; start < normalized.length; start++) {
    for (let end = normalized.length; end > start; end--) {
      const slice = normalized.slice(start, end)
      if (slice.length < 2) continue
      if (slice[0].length < 1 || slice[0].length > 3) continue
      if (!slice.slice(1).every((part) => part.length === 3)) continue

      const raw = slice.join('')
      const value = Number(raw)
      if (!Number.isFinite(value)) continue
      if (value < 100000 || value > 100000000) continue

      const hasSingleDigitPrefix = start > 0 && normalized[start - 1].length === 1
      if (hasSingleDigitPrefix) {
        return value
      }

      if (slice[0].length >= 2 || slice.length >= 2) {
        return value
      }
    }
  }

  const standalone = normalized
    .map((token) => Number(token))
    .filter((value) => Number.isFinite(value) && value >= 100000 && value <= 100000000)

  if (!standalone.length) {
    return null
  }

  return Math.max(...standalone)
}

const extractListingCandidatesFromWords = (words: OcrWord[]) => {
  const validWords = words
    .filter((word) => word.text?.trim() && word.bbox)
    .map((word) => ({
      text: normalizeLine(word.text || ''),
      confidence: word.confidence ?? 0,
      x0: word.bbox!.x0,
      y0: word.bbox!.y0,
      x1: word.bbox!.x1,
      y1: word.bbox!.y1,
    }))
    .filter((word) => word.text)

  if (!validWords.length) {
    return {
      candidates: [],
      debugRows: [],
    }
  }

  const maxX = Math.max(...validWords.map((word) => word.x1))
  const maxY = Math.max(...validWords.map((word) => word.y1))
  const listingWords = validWords
    .filter((word) => {
      const lower = word.text.toLowerCase()
      if (/(acheter|prix|moyen|inventaire|banque|havre|sac|niv|niveau|lot)/.test(lower)) {
        return false
      }

      // Restrict to the right-side price column and below the header card.
      return word.x0 >= maxX * 0.45 && word.y0 >= maxY * 0.18
    })
    .sort((a, b) => {
      if (Math.abs(a.y0 - b.y0) > 6) {
        return a.y0 - b.y0
      }

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
      continue
    }

    rows.push([word])
  }

  const seen = new Set<number>()
  const candidates: number[] = []
  const debugRows: OcrDebugRow[] = []

  for (const row of rows) {
    const rowTokens = row.map((word) => word.text).filter(Boolean)
    const numericTokens = rowTokens
      .filter((token) => /\d/.test(token))
      .map((token) => token.replace(/[^\d]/g, ''))
      .filter((token) => token.length > 0)

    if (!numericTokens.length && !rowTokens.length) {
      continue
    }

    const numeric = parsePriceFromNumericTokens(numericTokens)
    debugRows.push({
      source: 'word',
      raw: rowTokens.join(' '),
      tokens: numericTokens,
      candidate: numeric,
    })

    if (!numeric) continue
    if (seen.has(numeric)) continue
    seen.add(numeric)
    candidates.push(numeric)
  }

  return {
    candidates,
    debugRows,
  }
}

const extractListingCandidates = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean)

  const seen = new Set<number>()
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
    if (seen.has(numeric)) continue
    seen.add(numeric)
    candidates.push(numeric)
  }

  return {
    candidates,
    debugRows,
  }
}

const dataUrlToBuffer = (imageBase64: string) => {
  const base64Payload = imageBase64.includes(',')
    ? imageBase64.split(',').slice(1).join(',')
    : imageBase64

  return Buffer.from(base64Payload, 'base64')
}

const preprocessImageForPriceOcr = async (imageBase64: string) => {
  const sourceBuffer = dataUrlToBuffer(imageBase64)
  const image = sharp(sourceBuffer, { failOn: 'none' })
  const metadata = await image.metadata()
  const width = metadata.width || 0
  const height = metadata.height || 0

  if (!width || !height) {
    return imageBase64
  }

  const isNarrowPriceCrop = width < 220
  const cropLeft = isNarrowPriceCrop ? 0 : Math.floor(width * 0.48)
  const cropTop = isNarrowPriceCrop ? 0 : Math.floor(height * 0.14)
  const cropWidth = isNarrowPriceCrop ? width : Math.max(1, width - cropLeft)
  const cropHeight = isNarrowPriceCrop ? height : Math.max(1, height - cropTop)

  const processedBuffer = await image
    .extract({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
    })
    .grayscale()
    .normalize()
    .sharpen()
    .resize({
      width: cropWidth * 3,
      height: cropHeight * 3,
      fit: 'fill',
      kernel: sharp.kernel.lanczos3,
    })
    .threshold(150)
    .png()
    .toBuffer()

  return `data:image/png;base64,${processedBuffer.toString('base64')}`
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ imageBase64?: string }>(event)
  const imageBase64 = body?.imageBase64

  if (!imageBase64) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing image payload',
    })
  }

  const worker = await createWorker('eng')

  try {
    let ocrInput = imageBase64
    try {
      ocrInput = await preprocessImageForPriceOcr(imageBase64)
    } catch {
      ocrInput = imageBase64
    }

    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,\'-:",
      preserve_interword_spaces: '1',
    })

    const result = await worker.recognize(ocrInput)
    const text = result?.data?.text || ''
    const wordResult = extractListingCandidatesFromWords(result?.data?.words || [])
    const fallbackResult = extractListingCandidates(text)
    const useWordCandidates = wordResult.candidates.length > 0

    return {
      text,
      candidates: useWordCandidates ? wordResult.candidates : fallbackResult.candidates,
      debug: {
        mode: useWordCandidates ? 'word' : 'text',
        rows: useWordCandidates ? wordResult.debugRows : fallbackResult.debugRows,
      },
    }
  } finally {
    await worker.terminate()
  }
})
