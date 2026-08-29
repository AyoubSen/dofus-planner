/** Pull the metamob collection so the page can show what the site knows. */
export default defineEventHandler(async (event) => {
  try {
    const credentials = readMetamobCredentials(event)
    const { username, quest } = await resolveQuest(credentials)
    const counts = await fetchOwnedCounts(credentials, username, quest.slug)

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
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: 'Failed to fetch metamob quest',
    })
  }
})
