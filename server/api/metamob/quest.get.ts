/** Pull the metamob collection so the page can show what the site knows. */
export default defineEventHandler(async () => {
  try {
    const { username, quest } = await resolveQuest()
    const counts = await fetchOwnedCounts(username, quest.slug)

    return {
      username,
      slug: quest.slug,
      characterName: quest.character_name,
      currentStep: quest.current_step,
      parallelQuests: quest.parallel_quests,
      counts,
    }
  } catch (error: any) {
    if (error?.statusCode === 500 || error?.statusCode === 404) throw error
    console.error('Error fetching metamob quest:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: 'Failed to fetch metamob quest',
    })
  }
})
