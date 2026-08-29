import { importFromBrowser } from '../../utils/ledger'

/**
 * Folds the browser's localStorage store into the ledger.
 *
 * Additive by construction — the log is append-only and ids supersede — so
 * running it twice cannot duplicate rows or damage what is already there.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ observedPrices?: Record<string, unknown[]> }>(event)
  return importFromBrowser(body?.observedPrices || {})
})
