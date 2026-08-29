/**
 * Push the app's counts back to metamob.
 * Body: { counts: { [monsterId]: quantity } }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ counts?: Record<string, number> }>(event)
  const counts = body?.counts
  if (!counts || typeof counts !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Expected a "counts" object' })
  }

  const monsters = Object.entries(counts)
    .map(([id, quantity]) => ({
      monster_id: Number(id),
      quantity: Math.min(MAX_QUANTITY, Math.max(0, Math.floor(Number(quantity) || 0))),
    }))
    .filter(m => Number.isFinite(m.monster_id) && m.monster_id > 0)

  if (!monsters.length) return { updated: 0 }

  try {
    const { quest } = await resolveQuest()
    return { updated: await pushOwnedCounts(quest.slug, monsters), slug: quest.slug }
  } catch (error: any) {
    if (error?.statusCode === 500 || error?.statusCode === 404) throw error
    console.error('Error pushing metamob quest:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: 'Failed to push counts to metamob',
    })
  }
})
