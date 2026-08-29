import { describe, expect, it } from 'vitest'
import {
  daysOnMarket,
  listingSignature,
  migrateObservation,
  reconcileObservations,
  statSignature,
} from './saleTracking'
import type { ObservedPrice } from './types'

const observation = (
  id: string,
  price: number,
  values: Record<string, number>,
  overrides: Partial<ObservedPrice> = {},
): ObservedPrice => ({
  id,
  itemKey: 'gelano',
  itemName: 'Gelano',
  price,
  createdAt: '2026-08-01T00:00:00.000Z',
  source: 'ocr',
  statsEntries: Object.entries(values).map(([key, value]) => ({
    key,
    label: key,
    value,
    suffix: '',
    rangeText: '',
  })),
  ...overrides,
})

const NOW = '2026-08-09T00:00:00.000Z'

describe('signatures', () => {
  it('identifies a roll independently of price', () => {
    expect(statSignature(observation('a', 100, { pa: 1, dommages: 20 })))
      .toBe(statSignature(observation('b', 999, { pa: 1, dommages: 20 })))
  })

  it('does not depend on the order stats were captured in', () => {
    expect(statSignature(observation('a', 100, { pa: 1, dommages: 20 })))
      .toBe(statSignature(observation('b', 100, { dommages: 20, pa: 1 })))
  })

  it('separates two different rolls', () => {
    expect(statSignature(observation('a', 100, { dommages: 20 })))
      .not.toBe(statSignature(observation('b', 100, { dommages: 19 })))
  })

  it('includes the price in the listing identity', () => {
    expect(listingSignature(observation('a', 100, { dommages: 20 })))
      .not.toBe(listingSignature(observation('b', 200, { dommages: 20 })))
  })
})

describe('a listing seen again is still listed', () => {
  it('bumps lastSeenAt and keeps the original id', () => {
    const stored = [observation('a', 100, { dommages: 20 })]
    const result = reconcileObservations(stored, [observation('new', 100, { dommages: 20 })], { now: NOW })

    expect(result.stillListed).toBe(1)
    expect(result.added).toBe(0)
    expect(result.observations).toHaveLength(1)
    expect(result.observations[0]!.id).toBe('a')
    expect(result.observations[0]!.status).toBe('listed')
    expect(result.observations[0]!.lastSeenAt).toBe(NOW)
  })
})

describe('a new listing is added', () => {
  it('records it as listed from now', () => {
    const result = reconcileObservations(
      [observation('a', 100, { dommages: 20 })],
      [observation('a', 100, { dommages: 20 }), observation('b', 150, { dommages: 19 })],
      { now: NOW },
    )
    expect(result.added).toBe(1)
    expect(result.observations).toHaveLength(2)
  })
})

describe('disappearance is only read as a sale on a full sweep', () => {
  const stored = [
    observation('cheap', 100, { dommages: 20 }),
    observation('mid', 200, { dommages: 19 }),
    observation('dear', 900, { dommages: 18 }),
  ]

  it('invents nothing from a partial capture', () => {
    const result = reconcileObservations(stored, [observation('x', 200, { dommages: 19 })], { now: NOW })
    expect(result.markedSold).toBe(0)
    expect(result.observations.find((o) => o.id === 'cheap')!.status).toBeUndefined()
  })

  it('marks a cheap vanished listing as sold on a full sweep', () => {
    const result = reconcileObservations(
      stored,
      [observation('x', 900, { dommages: 18 })],
      { now: NOW, fullSweep: true },
    )
    expect(result.observations.find((o) => o.id === 'cheap')!.status).toBe('sold')
    expect(result.markedSold).toBeGreaterThanOrEqual(1)
  })

  it('leaves an expensive vanished listing unknown rather than calling it a sale', () => {
    const result = reconcileObservations(
      stored,
      [observation('x', 100, { dommages: 20 })],
      { now: NOW, fullSweep: true },
    )
    expect(result.observations.find((o) => o.id === 'dear')!.status).toBe('unknown')
  })
})

describe('the same roll at a new price is a relist', () => {
  it('marks the old price as relisted, not sold', () => {
    const stored = [observation('old', 500, { dommages: 20 })]
    const result = reconcileObservations(
      stored,
      [observation('new', 380, { dommages: 20 })],
      { now: NOW, fullSweep: true },
    )

    const old = result.observations.find((o) => o.id === 'old')!
    expect(old.status).toBe('relisted')
    expect(result.markedRelisted).toBe(1)
    expect(result.markedSold).toBe(0)
    expect(result.added).toBe(1)
  })

  it('does not relabel a listing that is already off the market', () => {
    const stored = [observation('old', 500, { dommages: 20 }, { status: 'sold' })]
    const result = reconcileObservations(
      stored,
      [observation('new', 380, { dommages: 20 })],
      { now: NOW, fullSweep: true },
    )
    expect(result.observations.find((o) => o.id === 'old')!.status).toBe('sold')
  })
})

describe('price-only captures carry no roll identity', () => {
  const statless = (id: string, price: number): ObservedPrice => ({
    id,
    itemKey: 'gelano',
    itemName: 'Gelano',
    price,
    createdAt: '2026-08-01T00:00:00.000Z',
    source: 'ocr',
    statsEntries: [],
  })

  it('does not treat two unrelated statless listings as the same roll', () => {
    const result = reconcileObservations(
      [statless('a', 500)],
      [statless('b', 380)],
      { now: NOW, fullSweep: true },
    )
    expect(result.markedRelisted).toBe(0)
    expect(result.added).toBe(1)
  })
})

describe('daysOnMarket', () => {
  it('measures the span between first and last sighting', () => {
    expect(daysOnMarket({
      createdAt: '2026-08-01T00:00:00.000Z',
      firstSeenAt: '2026-08-01T00:00:00.000Z',
      lastSeenAt: '2026-08-08T00:00:00.000Z',
    })).toBe(7)
  })

  it('returns null when it was never seen twice', () => {
    expect(daysOnMarket({ createdAt: '2026-08-01T00:00:00.000Z' })).toBeNull()
  })
})

// Phase 0a. Two sellers can list the same roll at the same price; that is two
// units of supply, not a duplicate. Keying by signature in a Map collapsed them.
describe('identical listings keep their multiplicity', () => {
  const roll = { dommages: 20 }

  it('keeps both when both are still up', () => {
    const stored = [observation('a', 100_000, roll), observation('b', 100_000, roll)]
    const captured = [observation('x', 100_000, roll), observation('y', 100_000, roll)]

    const result = reconcileObservations(stored, captured, { now: NOW, fullSweep: true })
    expect(result.observations).toHaveLength(2)
    expect(result.stillListed).toBe(2)
    expect(result.markedSold).toBe(0)
    expect(result.observations.every((entry) => entry.status === 'listed')).toBe(true)
  })

  it('retires exactly one when one of two disappears', () => {
    const stored = [observation('a', 100_000, roll), observation('b', 100_000, roll)]
    const captured = [observation('x', 100_000, roll)]

    const result = reconcileObservations(stored, captured, { now: NOW, fullSweep: true })
    expect(result.observations).toHaveLength(2)
    expect(result.stillListed).toBe(1)

    // One stays on the market, one leaves it. Which of the two is arbitrary —
    // they are indistinguishable — but the *count* must be right.
    const listed = result.observations.filter((entry) => entry.status === 'listed')
    expect(listed).toHaveLength(1)
    expect(result.observations.filter((entry) => entry.status !== 'listed')).toHaveLength(1)
  })

  it('does not invent a new listing when supply is unchanged', () => {
    const stored = [observation('a', 100_000, roll), observation('b', 100_000, roll)]
    const captured = [observation('x', 100_000, roll), observation('y', 100_000, roll)]
    expect(reconcileObservations(stored, captured, { now: NOW }).added).toBe(0)
  })

  it('counts a third identical listing as added supply', () => {
    const stored = [observation('a', 100_000, roll), observation('b', 100_000, roll)]
    const captured = [
      observation('x', 100_000, roll),
      observation('y', 100_000, roll),
      observation('z', 100_000, roll),
    ]

    const result = reconcileObservations(stored, captured, { now: NOW })
    expect(result.added).toBe(1)
    expect(result.observations).toHaveLength(3)
  })
})

describe('migration from v1', () => {
  it('adds the tracking fields without claiming any history', () => {
    const migrated = migrateObservation(observation('a', 100, { dommages: 20 }))
    expect(migrated.status).toBe('unknown')
    expect(migrated.firstSeenAt).toBe('2026-08-01T00:00:00.000Z')
    expect(migrated.signatureHash).toBeTruthy()
  })

  it('leaves an already-migrated row alone', () => {
    const already = observation('a', 100, { dommages: 20 }, { status: 'sold', lastSeenAt: NOW })
    expect(migrateObservation(already).status).toBe('sold')
    expect(migrateObservation(already).lastSeenAt).toBe(NOW)
  })

  it('preserves the price and stats verbatim', () => {
    const original = observation('a', 123_456, { dommages: 20, pa: 1 })
    const migrated = migrateObservation(original)
    expect(migrated.price).toBe(123_456)
    expect(migrated.statsEntries).toEqual(original.statsEntries)
  })
})
