import { getHdvScanState } from '../../../utils/hdvScanInbox'

export default defineEventHandler((event) => {
  const id = String(getRouterParam(event, 'id') || '')
  const state = getHdvScanState()
  const before = state.results.length
  state.results = state.results.filter((result) => result.id !== id)
  return {
    removed: state.results.length !== before,
  }
})

