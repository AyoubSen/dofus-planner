import { getCaptureState, takePendingCaptures } from '../../utils/captureInbox'
import { getHdvScanState } from '../../utils/hdvScanInbox'

/**
 * The browser drains whatever the companion has pushed since the last poll.
 *
 * It also re-states which item it has open, and that re-statement is the point:
 * arming used to be a single POST kept in server memory, so a restart — or a
 * page that was already showing the item — left the server with no armed item
 * and every capture bouncing back as "NO ITEM" with nothing to indicate why.
 * Repeating it on each poll means the two can never drift for more than one
 * tick, whatever happens to either side.
 */
export default defineEventHandler((event) => {
  const state = getCaptureState()
  const itemName = String(getQuery(event)?.itemName || '').trim()

  if (itemName) {
    const scanState = getHdvScanState()
    if (scanState.activeItem?.itemName !== itemName) {
      scanState.activeItem = {
        itemName,
        source: 'items-live-capture',
        updatedAt: new Date().toISOString(),
      }
    }
  }

  return {
    captures: takePendingCaptures(),
    lastCaptureAt: state.lastCaptureAt,
    activeItem: getHdvScanState().activeItem,
  }
})
