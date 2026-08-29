import { describe, expect, it } from 'vitest'
import { findSpawns, listSpares } from './huntQuery'
import type { QueryZone } from './huntQuery'

const mon = (id: number, name: string, extra: Partial<{ step: number, owned: number, required: number, status: string, typeId: number }> = {}) => ({
  id,
  name,
  image: `img/${id}.png`,
  typeId: extra.typeId ?? 3,
  step: extra.step ?? 4,
  owned: extra.owned ?? 0,
  required: extra.required ?? 1,
  status: extra.status ?? 'incomplete',
})

const zones = (...defs: [string, [number, string, ReturnType<typeof mon>[]][]][]): QueryZone[] =>
  defs.map(([name, subs]) => ({
    name,
    subzones: subs.map(([id, subName, monsters]) => ({ id, name: subName, monsters })),
  }))

describe('listSpares', () => {
  const world = zones(['Astrub', [[19, 'Cité d\'Astrub', [
    mon(1, 'Ginsenk le Stimulant'),
    mon(2, 'Boufdégou le Refoulant'),
    mon(3, 'Roz la Magicienne'),
  ]]]])

  it('lists only what you hold more than one of', () => {
    const spares = listSpares(world, { 1: 2, 2: 1, 3: 0 })
    expect(spares.map(s => s.name)).toEqual(['Ginsenk le Stimulant'])
    expect(spares[0]).toMatchObject({ owned: 2, spare: 1, step: 4 })
  })

  it('reports the surplus, not the total', () => {
    expect(listSpares(world, { 1: 5 })[0]?.spare).toBe(4)
  })

  it('respects a required above one rather than assuming it', () => {
    const needsTwo = zones(['Z', [[1, 'S', [mon(1, 'A', { required: 2 })]]]])
    expect(listSpares(needsTwo, { 1: 2 })).toEqual([])
    expect(listSpares(needsTwo, { 1: 3 })[0]?.spare).toBe(1)
  })

  it('falls back to the quest owned count when the live map has no entry', () => {
    const owned = zones(['Z', [[1, 'S', [mon(1, 'A', { owned: 3 })]]]])
    expect(listSpares(owned, {})[0]?.spare).toBe(2)
  })

  it('counts a monster once however many sous-zones it spawns in', () => {
    const repeated = zones(['Z', [[1, 'S1', [mon(1, 'A')]], [2, 'S2', [mon(1, 'A')]]]])
    expect(listSpares(repeated, { 1: 3 })).toHaveLength(1)
  })

  it('sorts by surplus, then step, then name', () => {
    const many = zones(['Z', [[1, 'S', [
      mon(1, 'Zed', { step: 9 }), mon(2, 'Abe', { step: 4 }), mon(3, 'Mid', { step: 4 }),
    ]]]])
    expect(listSpares(many, { 1: 2, 2: 2, 3: 4 }).map(s => s.name)).toEqual(['Mid', 'Abe', 'Zed'])
  })

  it('returns nothing when you hold no duplicates', () => {
    expect(listSpares(world, { 1: 1, 2: 1 })).toEqual([])
  })
})

describe('findSpawns', () => {
  const geo = {
    19: { zaap: 'Cité d\'Astrub', dungeon: false },
    53: { zaap: 'Cité d\'Astrub', dungeon: false },
    77: { zaap: '', dungeon: false },
    99: { zaap: 'Donjon', dungeon: true },
  }
  const world = zones(
    ['Astrub', [
      [19, 'Cité d\'Astrub', [mon(1, 'Ginsenk le Stimulant')]],
      [53, 'Champs d\'Astrub', [mon(1, 'Ginsenk le Stimulant'), mon(2, 'Autre')]],
      [77, 'Calanques d\'Astrub', [mon(1, 'Ginsenk le Stimulant')]],
    ]],
    ['Donjons', [[99, 'Salle', [mon(1, 'Ginsenk le Stimulant')]]]],
  )

  it('lists every sous-zone the archi spawns in', () => {
    const [found] = findSpawns(world, 'ginsenk', geo)
    expect(found?.spots.map(s => s.subzone).sort())
      .toEqual(['Calanques d\'Astrub', 'Champs d\'Astrub', 'Cité d\'Astrub'])
  })

  it('marks the spot you land in, which is the one a single fée covers', () => {
    const [found] = findSpawns(world, 'ginsenk', geo)
    expect(found?.spots[0]).toMatchObject({ subzone: 'Cité d\'Astrub', atZaap: true })
    expect(found?.spots.filter(s => s.atZaap)).toHaveLength(1)
  })

  it('excludes dungeons unless asked', () => {
    expect(findSpawns(world, 'ginsenk', geo)[0]?.spots.some(s => s.subzone === 'Salle')).toBe(false)
    expect(findSpawns(world, 'ginsenk', geo, { includeDungeons: true })[0]?.spots.some(s => s.subzone === 'Salle')).toBe(true)
  })

  it('matches partially and through accents and case', () => {
    expect(findSpawns(world, 'GINSENK', geo)).toHaveLength(1)
    expect(findSpawns(world, 'stimulant', geo)).toHaveLength(1)
    expect(findSpawns(world, 'cité', geo)).toEqual([])
  })

  it('returns nothing for an empty or unmatched query', () => {
    expect(findSpawns(world, '', geo)).toEqual([])
    expect(findSpawns(world, '   ', geo)).toEqual([])
    expect(findSpawns(world, 'bouftou', geo)).toEqual([])
  })

  it('treats a sous-zone with no zaap as a walk, not as the landing spot', () => {
    const [found] = findSpawns(world, 'ginsenk', geo)
    const calanques = found?.spots.find(s => s.subzone === 'Calanques d\'Astrub')
    expect(calanques).toMatchObject({ zaap: '', atZaap: false })
  })
})
