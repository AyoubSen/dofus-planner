import { failCapture, setCaptureVerdict } from '../../../utils/captureInbox'

/** The browser reports what it made of a capture, for the companion to show. */
export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') || '')
  const body = await readBody<{
    isDeal?: boolean
    headline?: string
    detail?: string
    price?: number | null
    error?: string
    debug?: unknown
  }>(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing capture id' })
  }

  // A capture the browser could not read still needs an answer, or the
  // companion sits waiting for a verdict that is never coming. The crops are
  // kept on the failure too — a read that failed is precisely the one worth
  // looking at, and discarding them left nothing to diagnose.
  if (body?.error) {
    const failed = failCapture(id, String(body.error))
    if (!failed) throw createError({ statusCode: 404, statusMessage: 'Unknown capture' })
    if (body.debug) {
      failed.verdict = {
        isDeal: false,
        // The browser distinguishes "could not read it" from "that was a
        // different item"; the companion should show which.
        headline: String(body.headline || 'UNREAD'),
        detail: String(body.error),
        price: null,
        debug: body.debug as any,
      }
    }
    return failed
  }

  const price = Number(body?.price)
  const entry = setCaptureVerdict(id, {
    isDeal: Boolean(body?.isDeal),
    headline: String(body?.headline || ''),
    detail: String(body?.detail || ''),
    price: Number.isFinite(price) ? Math.round(price) : null,
  })

  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown capture' })
  }

  return entry
})
