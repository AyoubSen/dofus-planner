const METAMOB_URL = 'https://www.metamob.fr/api/v1/monsters'
const IMG_BASE = 'https://www.metamob.fr/img/monsters/'
const LIMIT = 200

export default defineEventHandler(async () => {
  const token = process.env.METAMOB_BEARER
  if (!token) throw createError({ statusCode: 500, statusMessage: 'METAMOB_BEARER not set' })

  const headers = { Authorization: `Bearer ${token}` }

  try {
    const all: any[] = []

    // First page — also tells us the total
    const first = await $fetch<any>(`${METAMOB_URL}?limit=${LIMIT}&offset=0`, { headers })
    if (!first?.data) return {}
    all.push(...first.data)

    const total: number = first.pagination?.total ?? 0

    // Fetch remaining pages in parallel
    if (total > LIMIT) {
      const remaining = Math.ceil(total / LIMIT) - 1
      const pages = await Promise.all(
        Array.from({ length: remaining }, (_, i) =>
          $fetch<any>(`${METAMOB_URL}?limit=${LIMIT}&offset=${(i + 1) * LIMIT}`, { headers })
        )
      )
      for (const page of pages) {
        if (page?.data) all.push(...page.data)
      }
    }

    // Return a compact name→imageUrl map (French name as key)
    const map: Record<string, string> = {}
    for (const m of all) {
      const nameFr: string = m.name?.fr
      if (nameFr && m.image) {
        map[nameFr] = IMG_BASE + m.image
      }
    }
    return map
  } catch (error: any) {
    console.error('Error fetching metamob monsters:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: 'Failed to fetch metamob monsters',
    })
  }
})
