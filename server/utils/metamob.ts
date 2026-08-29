const API_BASE = 'https://www.metamob.fr/api/v1'

/** Metamob caps a monster's owned quantity at 30, and a batch PATCH at 200 entries. */
export const MAX_QUANTITY = 30
export const MAX_BATCH = 200

/** Page size for the paginated quest-detail endpoint (its documented max). */
const PAGE_LIMIT = 200

export type MetamobQuest = {
  slug: string
  character_name: string
  current_step: number
  parallel_quests: number
}

const token = () => {
  const value = process.env.METAMOB_BEARER
  if (!value) throw createError({ statusCode: 500, statusMessage: 'METAMOB_BEARER not set' })
  return value
}

export const metamobFetch = <T>(path: string, options: Record<string, any> = {}) =>
  $fetch<T>(`${API_BASE}${path}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token()}` },
  })

/**
 * The write endpoints are all scoped to a quest slug, so we need one before we
 * can sync anything. METAMOB_QUEST_SLUG pins it; otherwise we take the first
 * quest on the configured account.
 */
export const resolveQuest = async (): Promise<{ username: string, quest: MetamobQuest }> => {
  const username = process.env.METAMOB_USERNAME
  if (!username) throw createError({ statusCode: 500, statusMessage: 'METAMOB_USERNAME not set' })

  const profile = await metamobFetch<{ data: { quests: MetamobQuest[] } }>(`/users/${username}`)
  const quests = profile?.data?.quests ?? []
  if (!quests.length) {
    throw createError({
      statusCode: 404,
      statusMessage: `No metamob quest found for "${username}" — create one on metamob.fr first`,
    })
  }

  const pinned = process.env.METAMOB_QUEST_SLUG
  const quest = pinned ? quests.find(q => q.slug === pinned) : quests[0]
  if (!quest) {
    throw createError({ statusCode: 404, statusMessage: `Quest "${pinned}" not found on account "${username}"` })
  }

  return { username, quest }
}

type QuestMonster = { id: number, quantity: number }

/**
 * Owned quantities for the whole quest, as a monsterId → quantity map.
 * Note the field is `quantity` here; the PATCH responses call the same thing
 * `owned`, so don't reuse one shape for the other.
 */
export const fetchOwnedCounts = async (username: string, slug: string) => {
  const counts: Record<number, number> = {}
  let offset = 0
  let total = Infinity

  while (offset < total) {
    const page = await metamobFetch<{
      data: { monsters: QuestMonster[], pagination: { total: number } }
    }>(`/users/${username}/quests/${slug}?limit=${PAGE_LIMIT}&offset=${offset}`)

    const data = page?.data
    if (!data) break

    for (const monster of data.monsters ?? []) counts[monster.id] = monster.quantity ?? 0

    total = data.pagination?.total ?? 0
    offset += PAGE_LIMIT
  }

  return counts
}

/** Push owned quantities, chunked to the batch limit. */
export const pushOwnedCounts = async (slug: string, monsters: { monster_id: number, quantity: number }[]) => {
  let updated = 0

  for (let i = 0; i < monsters.length; i += MAX_BATCH) {
    const chunk = monsters.slice(i, i + MAX_BATCH)
    const res = await metamobFetch<{ data: { updated_count: number } }>(`/quests/${slug}/monsters`, {
      method: 'PATCH',
      body: { monsters: chunk },
    })
    updated += res?.data?.updated_count ?? 0
  }

  return updated
}
