import { createWorker } from 'tesseract.js'
import sharp from 'sharp'

export const maxDuration = 60

type ParsedStatEntry = {
  key: string
  label: string
  value: number | null
  suffix: '%' | ''
  rangeText: string
  raw: string
}

const STAT_DEFS = [
  { key: 'vitalite', label: 'Vitalité', aliases: ['vitalite'] },
  { key: 'force', label: 'Force', aliases: ['force'] },
  { key: 'intelligence', label: 'Intelligence', aliases: ['intelligence'] },
  { key: 'chance', label: 'Chance', aliases: ['chance'] },
  { key: 'agilite', label: 'Agilité', aliases: ['agilite'] },
  { key: 'sagesse', label: 'Sagesse', aliases: ['sagesse'] },
  { key: 'initiative', label: 'Initiative', aliases: ['initiative', 'ini'] },
  { key: 'retrait_pa', label: 'Retrait PA', aliases: ['retrait pa'] },
  { key: 'retrait_pm', label: 'Retrait PM', aliases: ['retrait pm'] },
  { key: 'esquive_pa', label: 'Esquive PA', aliases: ['esquive pa'] },
  { key: 'esquive_pm', label: 'Esquive PM', aliases: ['esquive pm'] },
  { key: 'critique', label: 'Critique', aliases: ['critique'], suffix: '%' as const },
  { key: 'resistance_critique', label: 'Résistance Critique', aliases: ['resistance critique', 'résistance critique', 'resistances critiques', 'résistances critiques'] },
  { key: 'pa', label: 'PA', aliases: [' pa ', 'pa [', 'pa'] },
  { key: 'pm', label: 'PM', aliases: [' pm ', 'pm [', 'pm'] },
  { key: 'po', label: 'PO', aliases: [' po ', 'portee', 'portée', 'po ['] },
  { key: 'invocation', label: 'Invocation', aliases: ['invocation'] },
  { key: 'dommages_neutre', label: 'Dommages Neutre', aliases: ['dommages neutre'] },
  { key: 'dommages_terre', label: 'Dommages Terre', aliases: ['dommages terre'] },
  { key: 'dommages_feu', label: 'Dommages Feu', aliases: ['dommages feu'] },
  { key: 'dommages_eau', label: 'Dommages Eau', aliases: ['dommages eau'] },
  { key: 'dommages_air', label: 'Dommages Air', aliases: ['dommages air'] },
  { key: 'prospection', label: 'Prospection', aliases: ['prospection'] },
  { key: 'resistance_air', label: 'Résistance Air', aliases: ['resistance air', 'résistance air'], suffix: '%' as const },
  { key: 'resistance_terre', label: 'Résistance Terre', aliases: ['resistance terre', 'résistance terre'], suffix: '%' as const },
  { key: 'resistance_feu', label: 'Résistance Feu', aliases: ['resistance feu', 'résistance feu'], suffix: '%' as const },
  { key: 'resistance_eau', label: 'Résistance Eau', aliases: ['resistance eau', 'résistance eau'], suffix: '%' as const },
  { key: 'resistance_neutre', label: 'Résistance Neutre', aliases: ['resistance neutre', 'résistance neutre'], suffix: '%' as const },
  { key: 'fuite', label: 'Fuite', aliases: ['fuite'] },
  { key: 'tacle', label: 'Tacle', aliases: ['tacle'] },
]

const normalizeLine = (line: string) =>
  line
    .replace(/\s+/g, ' ')
    .replace(/[€$£¥]/g, '')
    .trim()

const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b\d+\b/g, ' ')
    .replace(/\bresistances?\b/g, 'resistance')
    .replace(/\s+/g, ' ')
    .trim()

const dataUrlToBuffer = (imageBase64: string) => {
  const base64Payload = imageBase64.includes(',')
    ? imageBase64.split(',').slice(1).join(',')
    : imageBase64

  return Buffer.from(base64Payload, 'base64')
}

const preprocessStatsImage = async (imageBase64: string) => {
  const sourceBuffer = dataUrlToBuffer(imageBase64)
  const image = sharp(sourceBuffer, { failOn: 'none' })
  const metadata = await image.metadata()
  const width = metadata.width || 0
  const height = metadata.height || 0

  if (!width || !height) {
    return imageBase64
  }

  const processedBuffer = await image
    .grayscale()
    .normalize()
    .sharpen()
    .linear(1.15, -10)
    .resize({
      width: width * 3,
      height: height * 3,
      fit: 'fill',
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer()

  return `data:image/png;base64,${processedBuffer.toString('base64')}`
}

const cleanStatLine = (line: string) => {
  let cleaned = normalizeLine(line)

  // Strip leading icon/junk OCR noise.
  cleaned = cleaned.replace(/^[^0-9A-Za-zàâäçéèêëîïôöùûüÿœ%+\-\[]+/, '')
  cleaned = cleaned.replace(/^[A-Za-z]{1,2}\s+(?=\d)/, '')

  // Common OCR failure on stat rows with an icon before the real value:
  // "77 172 Vitalité" -> "172 Vitalité"
  cleaned = cleaned.replace(/^(\d{1,2})\s+(\d{1,3})(?=\s+[A-Za-zàâäçéèêëîïôöùûüÿœ])/i, '$2')

  // Normalize spaced percentages and brackets.
  cleaned = cleaned.replace(/(\d)\s+%/g, '$1%')
  cleaned = cleaned.replace(/\[\s+/g, '[').replace(/\s+\]/g, ']')

  return cleaned.trim()
}

const parseStatLine = (line: string): ParsedStatEntry | null => {
  const normalized = normalizeSearch(line)

  const exactDef = STAT_DEFS.find((def) =>
    [def.label, ...def.aliases].some((alias) => normalizeSearch(alias) === normalized),
  )

  const matchedDef = exactDef || STAT_DEFS
    .map((def) => ({
      def,
      matchedAlias: [def.label, ...def.aliases]
        .map((alias) => normalizeSearch(alias))
        .find((alias) => normalized.includes(alias) || alias.includes(normalized)) || '',
    }))
    .filter((entry) => entry.matchedAlias)
    .sort((a, b) => b.matchedAlias.length - a.matchedAlias.length)[0]?.def

  if (!matchedDef) {
    return null
  }

  const firstNumberMatch = line.match(/-?\d+/)
  const value = firstNumberMatch ? Number(firstNumberMatch[0]) : null
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

const extractStatEntries = (rawLines: string[]) => {
  const lines = rawLines
    .map(cleanStatLine)
    .filter(Boolean)

  const candidates = lines.filter((line) => {
    const hasDigit = /\d/.test(line)
    if (!hasDigit) return false

    const lower = line.toLowerCase()
    if (lower.includes('niv.') || lower.includes('niveau')) return false
    if (lower.includes('armes') || lower.includes('weapon')) return false
    if (line.length < 4) return false

    // Keep stat-like rows only.
    if (!/[A-Za-zàâäçéèêëîïôöùûüÿœ]/i.test(line)) return false

    return true
  })

  const unique: ParsedStatEntry[] = []
  const seen = new Set<string>()

  for (const line of candidates) {
    const parsed = parseStatLine(line)
    if (!parsed) continue

    const dedupeKey = `${parsed.key}:${parsed.value ?? 'na'}:${parsed.rangeText}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    unique.push(parsed)
  }

  return unique
}

export default defineEventHandler(async (event) => {
  const requestId = Math.random().toString(36).slice(2, 8)
  const startedAt = Date.now()
  const body = await readBody<{ imageBase64?: string }>(event)
  const imageBase64 = body?.imageBase64

  if (!imageBase64) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing image payload',
    })
  }

  console.log(`[ocr:stats:${requestId}] request start`)
  const worker = await createWorker('eng')
  console.log(`[ocr:stats:${requestId}] worker created in ${Date.now() - startedAt}ms`)

  try {
    let ocrInput = imageBase64
    try {
      const preprocessStartedAt = Date.now()
      ocrInput = await preprocessStatsImage(imageBase64)
      console.log(`[ocr:stats:${requestId}] preprocess ok in ${Date.now() - preprocessStartedAt}ms`)
    } catch {
      ocrInput = imageBase64
      console.warn(`[ocr:stats:${requestId}] preprocess failed, falling back to original image`)
    }

    const paramsStartedAt = Date.now()
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzàâäçéèêëîïôöùûüÿœ%+-[]() .,\'-:",
      preserve_interword_spaces: '1',
    })
    console.log(`[ocr:stats:${requestId}] params set in ${Date.now() - paramsStartedAt}ms`)

    const recognizeStartedAt = Date.now()
    const result = await worker.recognize(ocrInput)
    console.log(`[ocr:stats:${requestId}] recognize ok in ${Date.now() - recognizeStartedAt}ms`)
    const text = result?.data?.text || ''
    const ocrLines = Array.isArray(result?.data?.lines)
      ? result.data.lines
          .map((line: any) => normalizeLine(line?.text || ''))
          .filter(Boolean)
      : text
          .split(/\r?\n/)
          .map(normalizeLine)
          .filter(Boolean)

    console.log(`[ocr:stats:${requestId}] done in ${Date.now() - startedAt}ms`)
    return {
      text,
      entries: extractStatEntries(ocrLines),
    }
  } catch (error) {
    console.error(`[ocr:stats:${requestId}] failed after ${Date.now() - startedAt}ms`, error)
    throw error
  } finally {
    const terminateStartedAt = Date.now()
    await worker.terminate()
    console.log(`[ocr:stats:${requestId}] worker terminated in ${Date.now() - terminateStartedAt}ms`)
  }
})
