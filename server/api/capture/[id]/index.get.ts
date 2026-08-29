import { findCaptureEntry } from '../../../utils/captureInbox'

/**
 * The companion polls this after submitting, waiting for the verdict.
 *
 * The images are stripped from the response: the companion already has them,
 * and shipping a pair of PNGs back on every poll would make the wait for a
 * verdict slower than the verdict itself.
 */
export default defineEventHandler((event) => {
  const id = String(getRouterParam(event, 'id') || '')
  const entry = findCaptureEntry(id)

  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown capture' })
  }

  return {
    id: entry.id,
    itemName: entry.itemName,
    status: entry.status,
    verdict: entry.verdict,
    error: entry.error,
    createdAt: entry.createdAt,
  }
})
