/**
 * Zone/subzone breakdown of the quest, for planning hunt runs.
 *
 * This is the good spawn data: a monster can appear in several subzones (up to
 * 11), which app/data/monsters.json cannot express — it stores a single
 * zone/souszone per monster, and one that largely disagrees with metamob.
 */

type ZoneMonster = {
  id: number
  name: { fr: string }
  image: string
  type: { id: number }
  step: number
  owned: number
  required: number
  status: 'validated' | 'completed' | 'incomplete'
}

type ZoneNode = {
  id: number
  name: { fr: string }
  completed: number
  total: number
  subzones: { id: number, name: { fr: string }, completed: number, total: number, monsters: ZoneMonster[] }[]
}

const IMG_BASE = 'https://www.metamob.fr/img/monsters/'

export default defineEventHandler(async () => {
  try {
    const { quest } = await resolveQuest()
    const res = await metamobFetch<{ data: ZoneNode[] }>(`/quests/${quest.slug}/zones`)

    const zones = (res?.data ?? []).map(zone => ({
      id: zone.id,
      name: zone.name.fr,
      completed: zone.completed,
      total: zone.total,
      subzones: zone.subzones.map(sub => ({
        id: sub.id,
        name: sub.name.fr,
        completed: sub.completed,
        total: sub.total,
        monsters: sub.monsters.map(m => ({
          id: m.id,
          name: m.name.fr,
          image: IMG_BASE + m.image,
          typeId: m.type?.id ?? 0,
          step: m.step,
          owned: m.owned,
          required: m.required,
          status: m.status,
        })),
      })),
    }))

    return { slug: quest.slug, currentStep: quest.current_step, zones }
  } catch (error: any) {
    if (error?.statusCode === 500 || error?.statusCode === 404) throw error
    console.error('Error fetching metamob zones:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: 'Failed to fetch metamob zones',
    })
  }
})
