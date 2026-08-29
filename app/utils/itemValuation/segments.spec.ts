import { describe, expect, it } from 'vitest'
import { comparableDistance, groupBySegment, segmentSignature, selectPeers } from './segments'
import type { ScoredObservation } from './segments'
import { computeItemQuality } from './quality'
import type { ExpectedLine } from './types'

const expectedLines: ExpectedLine[] = [
  { statKey: 'dommages', label: 'Dommages', min: 11, max: 20 },
  { statKey: 'vitalite', label: 'Vitalité', min: 51, max: 80 },
]

const make = (
  id: string,
  price: number,
  values: Record<string, number>,
  requirementsPassed = true,
): ScoredObservation => {
  const quality = computeItemQuality(
    {
      statsEntries: Object.entries(values).map(([key, value]) => ({
        key,
        label: key,
        value,
        suffix: '',
        rangeText: key === 'pa' ? '[1]' : key === 'pm' ? '[1]' : '',
      })),
    },
    { expectedLines, priorities: {} },
  )
  return { id, price, quality: quality.quality, lines: quality.lines, requirementsPassed }
}

describe('segment signature', () => {
  it('separates a mage stat from a plain roll', () => {
    const plain = make('a', 100, { dommages: 20, vitalite: 80 })
    const withPa = make('b', 100, { dommages: 20, vitalite: 80, pa: 1 })
    expect(segmentSignature(plain)).not.toBe(segmentSignature(withPa))
  })

  it('separates the two sides of the requirement gate', () => {
    const passing = make('a', 100, { dommages: 20 }, true)
    const failing = make('b', 100, { dommages: 20 }, false)
    expect(segmentSignature(passing)).not.toBe(segmentSignature(failing))
  })

  it('is stable regardless of the order the stats were captured in', () => {
    const one = make('a', 100, { pa: 1, pm: 1, dommages: 20 })
    const two = make('b', 100, { pm: 1, pa: 1, dommages: 20 })
    expect(segmentSignature(one)).toBe(segmentSignature(two))
  })

  it('does not split on an ordinary stat', () => {
    const withVitality = make('a', 100, { dommages: 20, vitalite: 80 })
    const withoutVitality = make('b', 100, { dommages: 20 })
    expect(segmentSignature(withVitality)).toBe(segmentSignature(withoutVitality))
  })
})

describe('comparable distance', () => {
  it('is zero between identical rolls', () => {
    const a = make('a', 100, { dommages: 20, vitalite: 80 })
    const b = make('b', 200, { dommages: 20, vitalite: 80 })
    expect(comparableDistance(a, b).distance).toBeCloseTo(0)
  })

  it('grows with the gap in roll quality', () => {
    const target = make('a', 100, { dommages: 20, vitalite: 80 })
    const close = make('b', 100, { dommages: 19, vitalite: 78 })
    const far = make('c', 100, { dommages: 11, vitalite: 51 })
    expect(comparableDistance(target, close).distance)
      .toBeLessThan(comparableDistance(target, far).distance)
  })

  it('punishes a missing mage stat harder than a missing ordinary stat', () => {
    const target = make('a', 100, { dommages: 20, vitalite: 80, pa: 1 })
    const noPa = make('b', 100, { dommages: 20, vitalite: 80 })
    const noVitality = make('c', 100, { dommages: 20, pa: 1 })
    expect(comparableDistance(target, noPa).distance)
      .toBeGreaterThan(comparableDistance(target, noVitality).distance)
  })
})

describe('peer selection', () => {
  const passingPool = [
    make('p1', 100, { dommages: 20, vitalite: 80 }),
    make('p2', 110, { dommages: 19, vitalite: 78 }),
    make('p3', 120, { dommages: 20, vitalite: 76 }),
    make('p4', 130, { dommages: 18, vitalite: 80 }),
  ]

  it('prefers the exact segment when it is populated', () => {
    const target = make('t', 90, { dommages: 20, vitalite: 79 })
    const selection = selectPeers(target, [...passingPool, target])
    expect(selection.scope).toBe('exact-segment')
    expect(selection.confidencePenalty).toBe(0)
    expect(selection.peers.map((p) => p.id)).not.toContain('t')
  })

  it('never lends a failing listing to a passing one', () => {
    const target = make('t', 90, { dommages: 20, vitalite: 79 }, true)
    const failing = [
      make('f1', 10, { dommages: 12 }, false),
      make('f2', 11, { dommages: 12 }, false),
      make('f3', 12, { dommages: 12 }, false),
    ]
    const selection = selectPeers(target, [target, ...failing])
    expect(selection.scope).toBe('none')
    expect(selection.peers).toHaveLength(0)
  })

  it('falls back with a confidence penalty when the exact segment is thin', () => {
    const target = make('t', 90, { dommages: 20, vitalite: 79, pa: 1 })
    const selection = selectPeers(target, [target, ...passingPool])
    expect(selection.scope).toBe('same-gate')
    expect(selection.confidencePenalty).toBeGreaterThan(0)
  })

  it('gives up rather than valuing off one or two listings', () => {
    const target = make('t', 90, { dommages: 20 })
    const selection = selectPeers(target, [target, make('p1', 100, { dommages: 19 })])
    expect(selection.scope).toBe('none')
  })

  it('ranks the closest listings first', () => {
    const target = make('t', 90, { dommages: 20, vitalite: 80 })
    const selection = selectPeers(target, [...passingPool, target], { maxPeers: 2 })
    expect(selection.peers).toHaveLength(2)
    expect(selection.peers[0]!.id).toBe('p1')
  })
})

describe('groupBySegment', () => {
  it('buckets a population by market identity', () => {
    const groups = groupBySegment([
      make('a', 100, { dommages: 20 }),
      make('b', 100, { dommages: 19 }),
      make('c', 100, { dommages: 20, pa: 1 }),
    ])
    expect(groups.size).toBe(2)
  })
})
