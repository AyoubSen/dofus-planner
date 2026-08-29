import { corpusDiskBytes, readCorpusManifests, summariseCorpus } from '../../utils/corpusStore'

/**
 * What the archive knows so far.
 *
 * The disagreement rate here is the number phase 0b exists to produce: the
 * first honest measurement of how often the current readers contradict each
 * other on real captures, and therefore the baseline a replacement must beat.
 */
export default defineEventHandler(async () => {
  const samples = await readCorpusManifests()
  return {
    ...summariseCorpus(samples),
    diskBytes: await corpusDiskBytes(),
  }
})
