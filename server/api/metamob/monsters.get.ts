const IMG_BASE = 'https://www.metamob.fr/img/monsters/'
const LIMIT = 200

export default defineEventHandler(async (event) => {
  const credentials = readMetamobCredentials(event)
  try {
    const all: any[] = []

    // First page — also tells us the total
    const first = await metamobFetch<any>(credentials, `/monsters?limit=${LIMIT}&offset=0`)
    if (!first?.data) return {}
    all.push(...first.data)

    const total: number = first.pagination?.total ?? 0

    // Fetch remaining pages in parallel
    if (total > LIMIT) {
      const remaining = Math.ceil(total / LIMIT) - 1
      const pages = await Promise.all(
        Array.from({ length: remaining }, (_, i) =>
          metamobFetch<any>(credentials, `/monsters?limit=${LIMIT}&offset=${(i + 1) * LIMIT}`)
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
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: 'Failed to fetch metamob monsters',
    })
  }
})
