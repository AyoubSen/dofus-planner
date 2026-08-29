import { writeObservations } from '../../utils/ledger'

/** Appends observations. Never overwrites: a correction supersedes by id. */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ observations?: any[] }>(event)
  const rows = Array.isArray(body?.observations) ? body.observations : []

  if (!rows.length) return { written: 0 }
  return { written: await writeObservations(rows) }
})
