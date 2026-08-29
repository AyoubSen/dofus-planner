import { readLedger, summariseLedger } from '../../utils/ledger'

/** The live state of the ledger, plus what it is made of. */
export default defineEventHandler(async (event) => {
  const observations = await readLedger()
  const itemKey = String(getQuery(event)?.itemKey || '')

  return {
    stats: summariseLedger(observations, observations.length),
    observations: itemKey
      ? observations.filter((observation) => observation.itemKey === itemKey)
      : observations,
  }
})
