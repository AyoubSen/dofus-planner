import { getHdvScanState } from '../../utils/hdvScanInbox'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ itemName?: string; source?: string }>(event)
  const itemName = String(body?.itemName || '').trim()

  if (!itemName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing item name',
    })
  }

  const activeItem = {
    itemName,
    source: String(body?.source || 'app'),
    updatedAt: new Date().toISOString(),
  }

  getHdvScanState().activeItem = activeItem
  return activeItem
})

