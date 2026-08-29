import { getCaptureState } from '../../utils/captureInbox'

/** The calibration UI reads back the frame to draw rectangles over. */
export default defineEventHandler(() => {
  const state = getCaptureState()
  return {
    frame: state.calibrationFrame,
    hasFrame: Boolean(state.calibrationFrame),
    cursor: state.calibrationCursor,
  }
})
