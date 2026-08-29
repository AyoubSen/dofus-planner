import { describe, expect, it } from 'vitest'
import {
  allocate,
  defaultAllocationLimits,
  planReturnPerDay,
  type Candidate,
} from './allocator'

const candidate = (id: string, overrides: Partial<Candidate> = {}): Candidate => ({
  observationId: id,
  itemKey: 'gelano',
  itemName: 'Gelano',
  buyPrice: 1_000_000,
  netProfitLow: 200_000,
  returnPerKamaPerDay: 0.05,
  expectedDays: 4,
  reliability: 1,
  actionable: true,
  ...overrides,
})

const limits = (bankroll: number, overrides = {}) => ({
  ...defaultAllocationLimits(bankroll),
  ...overrides,
})

describe('choosing trades', () => {
  it('takes the best rate first', () => {
    const plan = allocate([
      candidate('slow', { returnPerKamaPerDay: 0.01, itemKey: 'a' }),
      candidate('fast', { returnPerKamaPerDay: 0.09, itemKey: 'b' }),
    ], limits(10_000_000))

    expect(plan.taken[0]!.observationId).toBe('fast')
  })

  it('skips a trade too big for the bankroll and keeps going', () => {
    // Stopping at the first unaffordable trade would let one huge listing block
    // every smaller one behind it, which is backwards.
    const plan = allocate([
      candidate('huge', { buyPrice: 9_000_000, returnPerKamaPerDay: 0.09, itemKey: 'a' }),
      candidate('small', { buyPrice: 500_000, returnPerKamaPerDay: 0.05, itemKey: 'b' }),
    ], limits(3_000_000))

    expect(plan.taken.map((entry) => entry.observationId)).toEqual(['small'])
    expect(plan.rejected.find((entry) => entry.candidate.observationId === 'huge')?.reason)
      .toBe('trade-cap')
  })

  it('refuses to spend on an unconfirmed price', () => {
    // Reading well is not the same as being confirmed, and the reader has been
    // wrong by 800k while looking entirely reasonable.
    const plan = allocate([
      candidate('guess', { actionable: false, returnPerKamaPerDay: 0.5 }),
    ], limits(10_000_000))

    expect(plan.taken).toHaveLength(0)
    expect(plan.rejected[0]!.reason).toBe('not-actionable')
  })

  it('leaves trades that do not clear the rate floor', () => {
    const plan = allocate([
      candidate('meh', { returnPerKamaPerDay: 0.0001 }),
    ], limits(10_000_000))
    expect(plan.rejected[0]!.reason).toBe('below-rate')
  })
})

describe('concentration limits', () => {
  it('caps how much of the bankroll one trade may take', () => {
    const plan = allocate([
      candidate('big', { buyPrice: 900_000, itemKey: 'a' }),
    ], limits(1_000_000))

    expect(plan.taken).toHaveLength(0)
    expect(plan.rejected[0]!.reason).toBe('trade-cap')
  })

  it('caps how much may go into a single item', () => {
    // Three listings of one item is one bet on that item's market: they sell to
    // the same buyers at the same time, so they are not diversification.
    const plan = allocate([
      candidate('a1', { buyPrice: 300_000, itemKey: 'gelano' }),
      candidate('a2', { buyPrice: 300_000, itemKey: 'gelano' }),
      candidate('a3', { buyPrice: 300_000, itemKey: 'gelano' }),
    ], limits(1_000_000))

    expect(plan.taken.length).toBeLessThan(3)
    expect(plan.rejected.some((entry) => entry.reason === 'item-cap')).toBe(true)
  })

  it('allows the same total across different items', () => {
    const plan = allocate([
      candidate('a', { buyPrice: 300_000, itemKey: 'one' }),
      candidate('b', { buyPrice: 300_000, itemKey: 'two' }),
      candidate('c', { buyPrice: 300_000, itemKey: 'three' }),
    ], limits(1_000_000))

    expect(plan.taken).toHaveLength(3)
  })

  it('respects the selling-slot limit', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      candidate(`c${i}`, { buyPrice: 100_000, itemKey: `item${i}` }))
    const plan = allocate(many, limits(100_000_000, { sellingSlots: 3 }))

    expect(plan.taken).toHaveLength(3)
    expect(plan.rejected.some((entry) => entry.reason === 'no-slots')).toBe(true)
  })
})

describe('what the plan reports', () => {
  it('adds up spend, profit and slots', () => {
    const plan = allocate([
      candidate('a', { buyPrice: 200_000, netProfitLow: 50_000, itemKey: 'one' }),
      candidate('b', { buyPrice: 300_000, netProfitLow: 90_000, itemKey: 'two' }),
    ], limits(10_000_000))

    expect(plan.spend).toBe(500_000)
    expect(plan.expectedProfit).toBe(140_000)
    expect(plan.slotsUsed).toBe(2)
    expect(plan.remaining).toBe(9_500_000)
  })

  it('weights hold time by capital, not by count', () => {
    // A big slow trade ties up the bankroll far longer than a small one, and an
    // unweighted mean would hide that.
    const plan = allocate([
      candidate('big-slow', { buyPrice: 900_000, expectedDays: 30, itemKey: 'one' }),
      candidate('small-fast', { buyPrice: 100_000, expectedDays: 1, itemKey: 'two' }),
    ], limits(10_000_000))

    expect(plan.meanHoldDays).toBeGreaterThan(20)
  })

  it('scores return against the whole bankroll, not just what was spent', () => {
    // Idle kamas earn nothing. A plan that deploys a tenth of the bankroll at a
    // great rate is not a great plan, and reporting only the deployed return
    // would flatter exactly the plans that failed to find anything to do.
    const plan = allocate([
      candidate('a', { buyPrice: 100_000, netProfitLow: 50_000, expectedDays: 1, itemKey: 'one' }),
    ], limits(10_000_000))

    const deployed = plan.expectedProfit / plan.spend / plan.meanHoldDays
    expect(planReturnPerDay(plan, 10_000_000)).toBeLessThan(deployed)
  })

  it('returns an empty plan rather than throwing when nothing qualifies', () => {
    const plan = allocate([], limits(1_000_000))
    expect(plan.taken).toEqual([])
    expect(plan.spend).toBe(0)
    expect(planReturnPerDay(plan, 1_000_000)).toBe(0)
  })
})
