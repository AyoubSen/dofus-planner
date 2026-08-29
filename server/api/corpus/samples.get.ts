import { readCorpusManifests } from '../../utils/corpusStore'

/**
 * Samples for review, newest first.
 *
 * Unreviewed ones lead, because the whole point of the queue is to turn
 * unlabelled captures into labelled ones and a list that buries them under
 * already-confirmed rows does not get worked through.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const onlyUnreviewed = String(query?.unreviewed || '') === '1'

  const samples = await readCorpusManifests()
  const filtered = onlyUnreviewed
    ? samples.filter((sample) => typeof sample.truth !== 'number')
    : samples

  return {
    total: samples.length,
    reviewed: samples.filter((sample) => typeof sample.truth === 'number').length,
    samples: filtered
      .slice()
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
      .map((sample) => ({
        id: sample.id,
        capturedAt: sample.capturedAt,
        itemName: sample.itemName,
        itemKey: sample.itemKey,
        storedPrice: sample.storedPrice,
        truth: sample.truth ?? null,
        agreed: sample.agreed,
        error: sample.error ?? '',
        readings: sample.readings,
        profile: sample.profile,
        stripUrl: `/api/corpus/${sample.id}/image?which=strip`,
        tooltipUrl: `/api/corpus/${sample.id}/image?which=tooltip`,
      })),
  }
})
