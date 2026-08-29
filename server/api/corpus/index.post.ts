import { pruneCorpus, writeCorpusSample } from '../../utils/corpusStore'

/**
 * Archives one capture for later validation.
 *
 * Fire-and-forget from the browser's point of view: a failure here must never
 * cost the user a reading, so everything is best-effort and the response says
 * what happened rather than throwing.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<any>(event)

  const stripImage = String(body?.stripImage || '')
  if (!stripImage) {
    // Not an error worth failing on — a capture that produced no strip has
    // nothing to grade, and the caller should not have to care.
    return { stored: false, reason: 'no-strip' }
  }

  try {
    const sample = await writeCorpusSample({
      stripImage,
      tooltipImage: String(body?.tooltipImage || '') || undefined,
      itemName: String(body?.itemName || ''),
      itemKey: String(body?.itemKey || ''),
      serverId: String(body?.serverId || ''),
      profile: {
        screenWidth: Math.round(Number(body?.profile?.screenWidth) || 0),
        screenHeight: Math.round(Number(body?.profile?.screenHeight) || 0),
        cursorX: Math.round(Number(body?.profile?.cursorX) || 0),
        cursorY: Math.round(Number(body?.profile?.cursorY) || 0),
        devicePixelRatio: Number(body?.profile?.devicePixelRatio) || 1,
        locale: String(body?.profile?.locale || 'fr'),
      },
      readings: Array.isArray(body?.readings)
        ? body.readings.map((reading: any) => ({
            reader: reading?.reader === 'glyph' ? 'glyph' : 'ocr',
            // A refusal must stay null. `Number(null)` is 0 and `isFinite(0)`
            // is true, so the obvious coercion silently turned "I could not
            // read this" into "I read zero" — which then counted as an answer,
            // inflating the agreement rate with samples where one reader had
            // in fact declined to answer at all.
            value: reading?.value === null || reading?.value === undefined
              ? null
              : Number.isFinite(Number(reading.value)) ? Number(reading.value) : null,
            text: String(reading?.text || ''),
            ms: Math.round(Number(reading?.ms) || 0),
          }))
        : [],
      // Same null-coercion trap as `readings.value`, and worse here: a refusal
      // archived as a stored 0 reads back as "answered, and answered wrongly",
      // so a reader behaving exactly as designed — declining rather than
      // guessing — is scored as a false accept and fails its own gate.
      storedPrice: body?.storedPrice === null || body?.storedPrice === undefined
        ? null
        : Number.isFinite(Number(body.storedPrice)) ? Number(body.storedPrice) : null,
      agreed: body?.agreed !== false,
      error: String(body?.error || '') || undefined,
      stats: Array.isArray(body?.stats)
        ? body.stats.map((stat: any) => ({
            key: String(stat?.key || ''),
            value: Number.isFinite(Number(stat?.value)) ? Number(stat.value) : null,
            confidence: Number(stat?.confidence) || 0,
          }))
        : undefined,
      statsText: String(body?.statsText || '') || undefined,
    })

    if (!sample) return { stored: false, reason: 'bad-image' }

    await pruneCorpus()
    return { stored: true, id: sample.id }
  } catch (error: any) {
    // The archive is a research artefact. It must never break capture.
    return { stored: false, reason: String(error?.message || 'write-failed') }
  }
})
