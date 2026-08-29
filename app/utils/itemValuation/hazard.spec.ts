import { describe, expect, it } from 'vitest'
import {
  boundSaleShare,
  expectedDaysToSell,
  fitHazard,
  MAX_EXPECTED_DAYS,
  saleProbability,
  toDurationObservations,
  type DurationObservation,
} from './hazard'
import type { ObservedPrice } from './types'

const duration = (
  id: string,
  relativePrice: number,
  days: number,
  exited: boolean,
  confirmedSale = false,
): DurationObservation => ({
  id, price: relativePrice * 1_000_000, relativePrice, days, exited, confirmedSale,
})

describe('bounding the share of exits that are sales', () => {
  it('admits total ignorance when nothing has been confirmed', () => {
    // The honest answer, and the one an earlier design refused to give by
    // simply calling every disappearance a sale.
    expect(boundSaleShare(0, 0)).toEqual({ low: 0, high: 1, confirmations: 0 })
  })

  it('stays wide even when every confirmed exit was a sale', () => {
    // Confirmed outcomes describe the *user's own* listings. External sellers
    // cancel and expire for their own reasons, so the rate does not transport
    // and the bound must not collapse onto it.
    const bounds = boundSaleShare(4, 4)
    expect(bounds.high).toBe(1)
    expect(bounds.low).toBeLessThan(1)
  })

  it('narrows as confirmations accumulate', () => {
    const few = boundSaleShare(5, 10)
    const many = boundSaleShare(50, 100)
    expect(many.high - many.low).toBeLessThan(few.high - few.low)
  })

  it('never narrows past the transport allowance', () => {
    // No amount of personal data identifies other sellers' behaviour, so the
    // interval has a floor on its width however much is confirmed.
    const enormous = boundSaleShare(5_000, 10_000)
    expect(enormous.high - enormous.low).toBeGreaterThan(0.4)
  })
})

describe('fitting the hazard', () => {
  it('finds that cheaper listings leave the market faster', () => {
    const observations = [
      ...Array.from({ length: 10 }, (_, i) => duration(`cheap${i}`, 0.6, 2, true)),
      ...Array.from({ length: 10 }, (_, i) => duration(`dear${i}`, 1.5, 30, false)),
    ]
    const model = fitHazard(observations)

    const cheap = saleProbability(model, 0.6)
    const dear = saleProbability(model, 1.5)
    expect(cheap.high).toBeGreaterThan(dear.high)
  })

  it('does not count a listing censored before the horizon as a survivor', () => {
    // "We stopped watching after two days" is not evidence that it lasted a
    // week. Counting it as one is the classic survival-analysis error.
    const observations = [duration('a', 1, 2, false)]
    const model = fitHazard(observations, { horizonDays: 7 })
    const bucket = model.buckets.find((entry) => entry.relativePriceMax >= 1)!
    expect(bucket.atRisk).toBe(0)
  })

  it('counts a listing still up past the horizon as a survivor', () => {
    const observations = [duration('a', 1, 30, false)]
    const model = fitHazard(observations, { horizonDays: 7 })
    const bucket = model.buckets.find((entry) => entry.relativePriceMax >= 1)!
    expect(bucket.atRisk).toBe(1)
    expect(bucket.exits).toBe(0)
  })

  it('reports no support for a price band it has never seen', () => {
    const model = fitHazard([duration('a', 0.6, 10, true)])
    const unseen = saleProbability(model, 2.0)
    expect(unseen.supported).toBe(false)
    // Unsupported means "anything", not "zero" — an absence of evidence must
    // not read as evidence of absence.
    expect(unseen.low).toBe(0)
    expect(unseen.high).toBe(1)
  })

  it('never claims a sale probability above the sale-share bound', () => {
    // Everything left the market, but nothing was confirmed as sold, so the
    // upper bound may be 1 while the lower bound must stay at 0.
    const observations = Array.from({ length: 20 }, (_, i) => duration(`x${i}`, 0.6, 1, true))
    const model = fitHazard(observations)
    const probability = saleProbability(model, 0.6)
    expect(probability.low).toBe(0)
    expect(probability.high).toBeLessThanOrEqual(1)
  })
})

describe('expected days to sell', () => {
  it('is shorter when the sale probability is higher', () => {
    const fast = expectedDaysToSell({ low: 0.5, high: 0.9, supported: true }, 7)
    const slow = expectedDaysToSell({ low: 0.05, high: 0.1, supported: true }, 7)
    expect(fast.high).toBeLessThan(slow.high)
  })

  it('stays finite when nothing ever sells, so downstream maths survives', () => {
    const never = expectedDaysToSell({ low: 0, high: 0, supported: false }, 7)
    expect(never.low).toBe(MAX_EXPECTED_DAYS)
    expect(never.high).toBe(MAX_EXPECTED_DAYS)
  })

  it('orders its bounds low-to-high', () => {
    const range = expectedDaysToSell({ low: 0.2, high: 0.6, supported: true }, 7)
    expect(range.low).toBeLessThanOrEqual(range.high)
  })
})

describe('building durations from stored observations', () => {
  const observation = (overrides: Partial<ObservedPrice>): ObservedPrice => ({
    id: 'a',
    itemKey: 'gelano',
    itemName: 'Gelano',
    price: 1_000_000,
    createdAt: '2026-08-01T00:00:00.000Z',
    source: 'ocr',
    statsEntries: [],
    ...overrides,
  })

  it('censors a still-listed row at now, not at its last sighting', () => {
    // The time since the last sweep is time it survived. Dropping it would bias
    // every duration downward and make everything look more liquid than it is.
    const now = new Date('2026-08-20T00:00:00.000Z')
    const [result] = toDurationObservations([
      observation({
        status: 'listed',
        firstSeenAt: '2026-08-01T00:00:00.000Z',
        lastSeenAt: '2026-08-05T00:00:00.000Z',
      }),
    ], now)

    expect(result!.exited).toBe(false)
    expect(result!.days).toBeCloseTo(19, 0)
  })

  it('stops the clock at the last sighting for a row that left', () => {
    const now = new Date('2026-08-20T00:00:00.000Z')
    const [result] = toDurationObservations([
      observation({
        status: 'sold',
        firstSeenAt: '2026-08-01T00:00:00.000Z',
        lastSeenAt: '2026-08-05T00:00:00.000Z',
      }),
    ], now)

    expect(result!.exited).toBe(true)
    expect(result!.days).toBeCloseTo(4, 0)
  })

  it('scores price relative to the population median', () => {
    const results = toDurationObservations([
      observation({ id: 'a', price: 500_000 }),
      observation({ id: 'b', price: 1_000_000 }),
      observation({ id: 'c', price: 1_500_000 }),
    ])
    expect(results.find((entry) => entry.id === 'b')!.relativePrice).toBeCloseTo(1, 5)
    expect(results.find((entry) => entry.id === 'a')!.relativePrice).toBeCloseTo(0.5, 5)
  })
})
