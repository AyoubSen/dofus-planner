import { getHdvScanState } from '../../utils/hdvScanInbox'

export default defineEventHandler(() => {
  const state = getHdvScanState()
  return {
    activeItem: state.activeItem,
    results: state.results,
  }
})

