import { describe, expect, it } from 'vitest'
import { orderStopsByWalk, zaapSubzone } from './huntRoute'

const at = (name: string, x: number | null, y: number | null) => ({ name, x, y })

describe('orderStopsByWalk', () => {
  it('walks nearest-first from the zaap', () => {
    const stops = [at('far', 5, 5), at('near', 1, 1), at('mid', 3, 3)]
    expect(orderStopsByWalk(stops, { x: 0, y: 0 }).map(s => s.name))
      .toEqual(['near', 'mid', 'far'])
  })

  it('chains from the last stop, not from the origin', () => {
    // 'east' is closest to the zaap, but 'far-east' is then closest to 'east'
    // even though 'west' is nearer the origin.
    const stops = [at('west', -4, 0), at('east', 3, 0), at('far-east', 6, 0)]
    expect(orderStopsByWalk(stops, { x: 0, y: 0 }).map(s => s.name))
      .toEqual(['east', 'far-east', 'west'])
  })

  it('puts stops with no coordinates at the tail, in their original order', () => {
    const stops = [at('nowhere', null, null), at('far', 9, 9), at('elsewhere', 4, null), at('near', 1, 1)]
    expect(orderStopsByWalk(stops, { x: 0, y: 0 }).map(s => s.name))
      .toEqual(['near', 'far', 'nowhere', 'elsewhere'])
  })

  it('falls back to the first stop when the zaap has no position', () => {
    const stops = [at('a', 10, 10), at('b', 11, 11), at('c', 0, 0)]
    expect(orderStopsByWalk(stops, { x: null, y: null }).map(s => s.name))
      .toEqual(['a', 'b', 'c'])
  })

  it('handles empty and single-stop groups', () => {
    expect(orderStopsByWalk([], { x: 0, y: 0 })).toEqual([])
    expect(orderStopsByWalk([at('only', 2, 2)], { x: 0, y: 0 }).map(s => s.name)).toEqual(['only'])
  })

  it('sends a stop on another world-map layer to the tail, however near it looks', () => {
    // [1,1] underground is not one tile from [0,0] on the surface — the grids
    // are unrelated, so the distance is meaningless and must not be trusted.
    const stops = [
      { name: 'underground', x: 1, y: 1, world: 3 },
      { name: 'far-surface', x: 9, y: 9, world: 1 },
    ]
    expect(orderStopsByWalk(stops, { x: 0, y: 0, world: 1 }).map(s => s.name))
      .toEqual(['far-surface', 'underground'])
  })

  it('still orders stops that share the origin layer', () => {
    const stops = [
      { name: 'far', x: 5, y: 5, world: 1 },
      { name: 'near', x: 1, y: 1, world: 1 },
    ]
    expect(orderStopsByWalk(stops, { x: 0, y: 0, world: 1 }).map(s => s.name))
      .toEqual(['near', 'far'])
  })

  it('ignores layers entirely when the origin declares none', () => {
    // Backwards compatible: callers with no layer data behave as before.
    const stops = [{ name: 'a', x: 5, y: 5, world: 3 }, { name: 'b', x: 1, y: 1, world: 9 }]
    expect(orderStopsByWalk(stops, { x: 0, y: 0 }).map(s => s.name)).toEqual(['b', 'a'])
  })

  it('keeps cross-layer stops in their original order at the tail', () => {
    const stops = [
      { name: 'other-1', x: 1, y: 1, world: 3 },
      { name: 'surface', x: 8, y: 8, world: 1 },
      { name: 'other-2', x: 2, y: 2, world: 3 },
    ]
    expect(orderStopsByWalk(stops, { x: 0, y: 0, world: 1 }).map(s => s.name))
      .toEqual(['surface', 'other-1', 'other-2'])
  })

  it('never drops or duplicates a stop', () => {

    const stops = [at('a', 1, 1), at('b', null, 2), at('c', 3, 3), at('d', 4, 4)]
    const result = orderStopsByWalk(stops, { x: 0, y: 0 })
    expect(result).toHaveLength(stops.length)
    expect(new Set(result.map(s => s.name))).toEqual(new Set(['a', 'b', 'c', 'd']))
  })
})

describe('zaapSubzone', () => {
  const spots = [
    { subzone: 'Champs d\'Astrub' },
    { subzone: 'Cité d\'Astrub' },
    { subzone: 'Égouts d\'Astrub' },
  ]

  it('finds the sous-zone the zaap sits in', () => {
    expect(zaapSubzone(spots, 'Cité d\'Astrub')?.subzone).toBe('Cité d\'Astrub')
  })

  it('matches through accents, case and punctuation', () => {
    expect(zaapSubzone(spots, 'CITE DASTRUB')?.subzone).toBe('Cité d\'Astrub')
    expect(zaapSubzone(spots, 'egouts d astrub')?.subzone).toBe('Égouts d\'Astrub')
  })

  it('returns null when the zaap sous-zone holds nothing you need', () => {
    // Not an error: it is exactly the trip worth skipping on a one-fée run.
    expect(zaapSubzone(spots, 'Bonta')).toBeNull()
  })

  it('returns null for a group with no zaap at all', () => {
    expect(zaapSubzone(spots, '')).toBeNull()
  })

  it('handles an empty group', () => {
    expect(zaapSubzone([], 'Bonta')).toBeNull()
  })
})
