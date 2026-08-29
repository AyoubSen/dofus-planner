// Two lookups over the quest data the planner already holds client-side:
// what you own spares of, and where a given archi actually spawns.
//
// Neither needs a request. huntZones is the full zone/sous-zone breakdown, and
// the counts map is already keyed by metamob id, so both are joins over data in
// memory.

import { slugName } from './slugName'

export type QueryMonster = {
  id: number
  name: string
  image: string
  typeId: number
  step: number
  owned: number
  required: number
  status: string
}
export type QueryZone = { name: string, subzones: { id: number, name: string, monsters: QueryMonster[] }[] }

export type Spare = {
  id: number, name: string, image: string, step: number, owned: number, spare: number
}

/**
 * Archi you hold more than one of.
 *
 * `required` is 1 for every monster in the quest, so the surplus is everything
 * past the first — but the field is read rather than assumed, in case a future
 * quest template needs more than one of something.
 *
 * Counts come from the live map rather than the quest payload so a capture made
 * this session shows up without a refetch.
 */
export const listSpares = (zones: QueryZone[], counts: Record<string, number>): Spare[] => {
  const seen = new Map<number, QueryMonster>()
  zones.forEach(zone => zone.subzones.forEach(sub => sub.monsters.forEach((m) => {
    if (!seen.has(m.id)) seen.set(m.id, m)
  })))

  const spares: Spare[] = []
  seen.forEach((m) => {
    const owned = counts[m.id] ?? m.owned ?? 0
    const required = m.required || 1
    if (owned <= required) return
    spares.push({ id: m.id, name: m.name, image: m.image, step: m.step, owned, spare: owned - required })
  })

  return spares.sort((a, b) => b.spare - a.spare || a.step - b.step || a.name.localeCompare(b.name))
}

export type SpawnSpot = { zone: string, subzone: string, zaap: string, atZaap: boolean }
export type Spawn = {
  id: number, name: string, image: string, step: number, status: string, spots: SpawnSpot[]
}

/**
 * Every sous-zone a matching archi spawns in, with the zaap for each.
 *
 * `atZaap` is the part that matters on a one-fée run: it marks the spots you
 * land directly in, as opposed to the ones you would have to walk to.
 */
export const findSpawns = (
  zones: QueryZone[],
  query: string,
  geo: Record<number, { zaap: string, dungeon: boolean }>,
  { archiOnly = true, includeDungeons = false } = {},
): Spawn[] => {
  const needle = slugName(query)
  if (!needle) return []

  const found = new Map<number, Spawn>()

  zones.forEach(zone => zone.subzones.forEach((sub) => {
    const here = geo[sub.id]
    if (!includeDungeons && here?.dungeon) return

    sub.monsters.forEach((m) => {
      if (archiOnly && m.typeId !== 3) return
      if (!slugName(m.name).includes(needle)) return

      const entry = found.get(m.id) ?? {
        id: m.id, name: m.name, image: m.image, step: m.step, status: m.status, spots: [],
      }
      const zaap = here?.zaap ?? ''
      entry.spots.push({
        zone: zone.name,
        subzone: sub.name,
        zaap,
        atZaap: !!zaap && slugName(sub.name) === slugName(zaap),
      })
      found.set(m.id, entry)
    })
  }))

  // Spots you can reach with one fée first — that is the answer to "where do I
  // go", and the walk-to spots are the fallback.
  found.forEach(entry => entry.spots.sort((a, b) =>
    Number(b.atZaap) - Number(a.atZaap) || a.subzone.localeCompare(b.subzone)))

  return [...found.values()].sort((a, b) => a.step - b.step || a.name.localeCompare(b.name))
}
