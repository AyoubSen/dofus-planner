import { getCaptureState, restoreCaptureRegions } from '../../utils/captureInbox'

/** The companion asks where to look; the app decides during calibration. */
export default defineEventHandler(async () => {
  // Pick up the last calibration from disk, so restarting the dev server does
  // not silently un-calibrate the companion.
  await restoreCaptureRegions()
  const state = getCaptureState()

  return {
    ...state.regions,
    calibrated: Boolean(state.regions.price && state.regions.stats),
  }
})
