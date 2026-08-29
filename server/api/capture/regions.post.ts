import { setCaptureRegions } from '../../utils/captureInbox'

/** The calibration UI saves the two rectangles the user dragged. */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ price?: unknown; stats?: unknown }>(event)
  const regions = setCaptureRegions(body || {})

  if (!regions.price || !regions.stats) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Both a price region and a stats region are required',
    })
  }

  return regions
})
