const API_BASE = 'https://www.metamob.fr/api/v1'

/** Metamob caps a monster's owned quantity at 30, and a batch PATCH at 200 entries. */
export const MAX_QUANTITY = 30
export const MAX_BATCH = 200

/** Page size for the paginated quest-detail endpoint (its documented max). */
const PAGE_LIMIT = 200

export type MetamobCredentials = {
  token: string
  username: string
  questSlug: string
}

export type MetamobQuest = {
  slug: string
  character_name: string
  current_step: number
  parallel_quests: number
}

const decodeHeader = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return ''
  }
}

export const parseMetamobCredentials = (
  tokenHeader: string,
  usernameHeader: string,
  questHeader = '',
): MetamobCredentials | null => {
  const token = tokenHeader.trim()
  const username = decodeHeader(usernameHeader.trim()).trim()
  const questSlug = decodeHeader(questHeader.trim()).trim()

  if (!token || !username || token.length > 500 || username.length > 100 || questSlug.length > 200) {
    return null
  }

  return { token, username, questSlug }
}

/** Credentials are supplied by the current browser session, never by deployment env. */
export const readMetamobCredentials = (event: any): MetamobCredentials => {
  const credentials = parseMetamobCredentials(
    getHeader(event, 'x-metamob-token') || '',
    getHeader(event, 'x-metamob-username') || '',
    getHeader(event, 'x-metamob-quest') || '',
  )

  if (!credentials) {
    throw createError({ statusCode: 401, statusMessage: 'MetaMob connection required' })
  }

  return credentials
}

export const metamobFetch = <T>(credentials: MetamobCredentials, path: string, options: Record<string, any> = {}) =>
  $fetch<T>(`${API_BASE}${path}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${credentials.token}` },
  })

/**
 * The write endpoints are all scoped to a quest slug, so we need one before we
 * can sync anything. A caller-supplied quest slug pins it; otherwise we take
 * the first quest on that caller's account.
 */
export const resolveQuest = async (credentials: MetamobCredentials): Promise<{ username: string, quest: MetamobQuest }> => {
  const username = credentials.username
  const profile = await metamobFetch<{ data: { quests: MetamobQuest[] } }>(
    credentials,
    `/users/${encodeURIComponent(username)}`,
  )
  const quests = profile?.data?.quests ?? []
  if (!quests.length) {
    throw createError({
      statusCode: 404,
      statusMessage: `No metamob quest found for "${username}" — create one on metamob.fr first`,
    })
  }

  const pinned = credentials.questSlug
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
export const fetchOwnedCounts = async (credentials: MetamobCredentials, username: string, slug: string) => {
  const counts: Record<number, number> = {}
  let offset = 0
  let total = Infinity

  while (offset < total) {
    const page = await metamobFetch<{
      data: { monsters: QuestMonster[], pagination: { total: number } }
    }>(
      credentials,
      `/users/${encodeURIComponent(username)}/quests/${encodeURIComponent(slug)}?limit=${PAGE_LIMIT}&offset=${offset}`,
    )

    const data = page?.data
    if (!data) break

    for (const monster of data.monsters ?? []) counts[monster.id] = monster.quantity ?? 0

    total = data.pagination?.total ?? 0
    offset += PAGE_LIMIT
  }

  return counts
}

/** Push owned quantities, chunked to the batch limit. */
export const pushOwnedCounts = async (
  credentials: MetamobCredentials,
  slug: string,
  monsters: { monster_id: number, quantity: number }[],
) => {
  let updated = 0

  for (let i = 0; i < monsters.length; i += MAX_BATCH) {
    const chunk = monsters.slice(i, i + MAX_BATCH)
    const res = await metamobFetch<{ data: { updated_count: number } }>(
      credentials,
      `/quests/${encodeURIComponent(slug)}/monsters`,
      {
        method: 'PATCH',
        body: { monsters: chunk },
      },
    )
    updated += res?.data?.updated_count ?? 0
  }

  return updated
}
