import { getCaptureState } from '../../utils/captureInbox'

/**
 * The companion parks one full-screen frame here for calibration.
 *
 * Only the latest is kept — this is a picture of the user's whole desktop, so
 * holding a history of them would be both wasteful and nosy.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ frame?: string; cursorX?: number; cursorY?: number }>(event)
  const frame = String(body?.frame || '')

  if (!frame) {
    throw createError({ statusCode: 400, statusMessage: 'Missing frame' })
  }

  const state = getCaptureState()
  state.calibrationFrame = frame

  // Where the pointer was when the shot was taken. The calibration UI turns the
  // boxes drawn over this frame into offsets from here, which is what lets one
  // calibration cover every row of the HDV list rather than just one.
  const cursorX = Number(body?.cursorX)
  const cursorY = Number(body?.cursorY)
  state.calibrationCursor = Number.isFinite(cursorX) && Number.isFinite(cursorY)
    ? { x: Math.round(cursorX), y: Math.round(cursorY) }
    : null

  return { ok: true, bytes: frame.length, cursor: state.calibrationCursor }
})
