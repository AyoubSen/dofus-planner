import { addCaptureEntry, createCaptureId } from '../../utils/captureInbox'
import { getHdvScanState } from '../../utils/hdvScanInbox'

/** Companion submits one captured listing: the price crop and the tooltip crop. */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    frame?: string
    cursorX?: number
    cursorY?: number
    itemName?: string
  }>(event)

  const frame = String(body?.frame || '')

  if (!frame) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing capture frame',
    })
  }

  // The armed item decides where this lands. Without one the browser would have
  // to guess which item the screenshot belongs to, and a capture filed against
  // the wrong item is worse than one that was never taken.
  const activeItem = getHdvScanState().activeItem
  const itemName = String(body?.itemName || activeItem?.itemName || '').trim()

  if (!itemName) {
    throw createError({
      statusCode: 409,
      statusMessage: 'No item is armed. Select an item in the app first.',
    })
  }

  const entry = addCaptureEntry({
    id: createCaptureId(),
    frame,
    cursorX: Math.round(Number(body?.cursorX) || 0),
    cursorY: Math.round(Number(body?.cursorY) || 0),
    itemName,
    createdAt: new Date().toISOString(),
    status: 'pending',
    verdict: null,
    error: '',
  })

  return { id: entry.id, itemName: entry.itemName, createdAt: entry.createdAt }
})
