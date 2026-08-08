import { getHdvScanState } from '../../utils/hdvScanInbox'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    itemName?: string
    price?: number
    candidates?: number[]
    confidence?: 'low' | 'medium' | 'high'
    source?: string
  }>(event)

  const activeItem = getHdvScanState().activeItem
  const itemName = String(body?.itemName || activeItem?.itemName || '').trim()
  const price = Number(body?.price)

  if (!itemName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing item name',
    })
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing price',
    })
  }

  const result = {
    id: `hdv-scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemName,
    price: Math.round(price),
    candidates: Array.isArray(body?.candidates)
      ? body.candidates.map((candidate) => Math.round(Number(candidate))).filter((candidate) => Number.isFinite(candidate) && candidate > 0)
      : [Math.round(price)],
    confidence: body?.confidence || 'medium',
    source: String(body?.source || 'companion'),
    createdAt: new Date().toISOString(),
  } as const

  const state = getHdvScanState()
  state.results.unshift(result)
  state.results = state.results.slice(0, 50)

  return result
})

