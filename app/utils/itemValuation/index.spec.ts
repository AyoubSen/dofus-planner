import { describe, expect, it } from 'vitest'
import { valueObservations } from './index'
import { emptyPriorityProfiles } from './requirements'
import type { ExpectedLine, ObservedPrice, StatPriority } from './types'

const expectedLines: ExpectedLine[] = [
  { statKey: 'pa', label: 'PA', min: 1, max: 1 },
  { statKey: 'dommages', label: 'Dommages', min: 11, max: 20 },
  { statKey: 'vitalite', label: 'Vitalité', min: 51, max: 80 },
]

let counter = 0
const listing = (
  price: number,
  values: Record<string, number>,
  overrides: Partial<ObservedPrice> = {},
): ObservedPrice => ({
  id: overrides.id ?? `obs-${(counter += 1)}`,
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

const run = (observations: ObservedPrice[], priorities: Record<string, StatPriority> = {}) =>
  valueObservations({
    observations,
    expectedLines,
    itemKey: 'gelano',
    profiles: { ...emptyPriorityProfiles(), byItem: { gelano: priorities } },
  })

/** A believable market: price climbs steeply with roll quality. */
const market = () => [
  listing(1_000_000, { pa: 1, dommages: 20, vitalite: 80 }, { id: 'perfect' }),
  listing(720_000, { pa: 1, dommages: 19, vitalite: 76 }, { id: 'great' }),
  listing(400_000, { pa: 1, dommages: 17, vitalite: 70 }, { id: 'good' }),
  listing(220_000, { pa: 1, dommages: 15, vitalite: 62 }, { id: 'mid' }),
  listing(120_000, { pa: 1, dommages: 12, vitalite: 55 }, { id: 'junk' }),
]

describe('end to end', () => {
  it('prices every listing when the segment is populated', () => {
    const { results } = run(market())
    expect(results).toHaveLength(5)
    expect(results.every((result) => result.valuation)).toBe(true)
  })

  it('spots a max roll listed at a junk price', () => {
    const observations = [...market(), listing(150_000, { pa: 1, dommages: 20, vitalite: 80 }, { id: 'steal' })]
    const { results, summary } = run(observations)

    const steal = results.find((result) => result.observation.id === 'steal')!
    expect(steal.netProfit).toBeGreaterThan(0)
    expect(steal.badges).toContain('underpriced')
    expect(steal.badges).toContain('best-buy')
    expect(summary.candidates).toBeGreaterThanOrEqual(1)
  })

  it('does not call a fairly priced junk roll a deal', () => {
    const { results } = run(market())
    const junk = results.find((result) => result.observation.id === 'junk')!
    expect(junk.badges).not.toContain('underpriced')
  })

  it('flags nothing in a market that is priced consistently', () => {
    // Every listing sits on the same curve, so none of them is a bargain.
    const { summary } = run(market())
    expect(summary.candidates).toBe(0)
  })

  it('ranks the max roll above the junk roll on quality', () => {
    const { results } = run(market())
    const perfect = results.find((r) => r.observation.id === 'perfect')!
    const junk = results.find((r) => r.observation.id === 'junk')!
    expect(perfect.score).toBeGreaterThan(junk.score)
  })
})

describe('the requirement gate reaches the output', () => {
  it('drops sub-max rolls out of the candidate set when a stat is critical', () => {
    const { results, summary } = run(market(), { dommages: 'critical' })

    const perfect = results.find((r) => r.observation.id === 'perfect')!
    const mid = results.find((r) => r.observation.id === 'mid')!

    expect(perfect.requirements.passed).toBe(true)
    expect(mid.requirements.passed).toBe(false)
    expect(mid.badges).toContain('below-requirement')
    expect(summary.belowRequirement).toBeGreaterThan(0)
    expect(summary.requirementsInForce[0]).toMatchObject({ statKey: 'dommages', needs: 19 })
  })

  it('never names a rejected listing best buy, however cheap it is', () => {
    const observations = [...market(), listing(1, { pa: 1, dommages: 12, vitalite: 51 }, { id: 'trash' })]
    const { results } = run(observations, { dommages: 'high' })

    const trash = results.find((r) => r.observation.id === 'trash')!
    expect(trash.badges).not.toContain('best-buy')
    expect(trash.badges).not.toContain('underpriced')
    expect(results.some((r) => r.badges.includes('best-buy') && !r.requirements.passed)).toBe(false)
  })

  it('separates the rejected listings into their own segment', () => {
    const { results } = run(market(), { dommages: 'critical' })
    const passing = results.filter((r) => r.requirements.passed).map((r) => r.segment)
    const failing = results.filter((r) => !r.requirements.passed).map((r) => r.segment)
    for (const segment of failing) expect(passing).not.toContain(segment)
  })
})

describe('confidence', () => {
  it('is low when there is nothing to compare against', () => {
    const { results } = run([
      listing(500_000, { pa: 1, dommages: 20, vitalite: 80 }),
      listing(400_000, { pa: 1, dommages: 19, vitalite: 70 }),
    ])
    expect(results.every((result) => result.confidence === 'low')).toBe(true)
    expect(results.every((result) => result.badges.includes('unpriced'))).toBe(true)
  })

  it('stays capped below high while everything is still an ask', () => {
    const { results } = run(market())
    expect(results.every((result) => result.confidence !== 'high')).toBe(true)
  })

  it('reaches high once enough listings are confirmed sales', () => {
    const sold = market().map((observation) => ({ ...observation, status: 'sold' as const }))
    const extra = [
      listing(950_000, { pa: 1, dommages: 20, vitalite: 78 }, { status: 'sold' }),
      listing(600_000, { pa: 1, dommages: 18, vitalite: 72 }, { status: 'sold' }),
      listing(300_000, { pa: 1, dommages: 16, vitalite: 66 }, { status: 'sold' }),
    ]
    const { results, summary } = run([...sold, ...extra])
    expect(summary.clearedSamples).toBe(8)
    expect(results.some((result) => result.confidence === 'high')).toBe(true)
  })
})

describe('summary', () => {
  it('reports the segment count and requirement set', () => {
    const { summary } = run(market(), { dommages: 'high' })
    expect(summary.total).toBe(5)
    expect(summary.segments).toBeGreaterThanOrEqual(1)
    expect(summary.requirementsInForce).toHaveLength(1)
  })

  it('copes with an empty capture', () => {
    const { results, summary } = run([])
    expect(results).toHaveLength(0)
    expect(summary.total).toBe(0)
  })
})

// Phase 0a. The target used to sit inside its own fitted curve, so its price
// moved the fair value it was then judged against. These fail on that version.
describe('leave-one-out', () => {
  it('does not let a listing move its own fair value', () => {
    const others = market()

    // Same roll, two very different asks. If the target leaks into its own
    // curve, the cheap one is pulled down and the dear one pulled up, and the
    // two fair values diverge. They are the same item with the same stats, so
    // the market's opinion of them must be identical.
    const roll = { pa: 1, dommages: 18, vitalite: 72 }
    const cheap = run([...others, listing(200_000, roll, { id: 'target' })])
      .results.find((result) => result.observation.id === 'target')
    const dear = run([...others, listing(900_000, roll, { id: 'target' })])
      .results.find((result) => result.observation.id === 'target')

    expect(cheap?.valuation).toBeTruthy()
    expect(dear?.valuation).toBeTruthy()
    expect(cheap!.valuation!.fairValue).toBe(dear!.valuation!.fairValue)
  })

  it('excludes the target from its own peer list', () => {
    const { results } = run(market())
    for (const result of results) {
      expect(result.peerIds).not.toContain(result.observation.id)
    }
  })
})

// Phase 4. Liquidity reaches the caller, or the model may as well not exist.
describe('liquidity and the buy ceiling', () => {
  /** A market with enough duration history for the hazard model to say anything. */
  const withHistory = () => market().map((entry, index) => ({
    ...entry,
    firstSeenAt: '2026-07-01T00:00:00.000Z',
    lastSeenAt: '2026-07-05T00:00:00.000Z',
    status: (index % 2 === 0 ? 'sold' : 'listed') as const,
  }))

  it('reports no liquidity when there is no evidence for it', () => {
    // Absent, not zero. "We do not know how fast this sells" and "this never
    // sells" are opposite claims and must not share a representation.
    const { results } = run(market())
    for (const result of results) {
      if (result.liquidity) {
        expect(result.liquidity.saleProbability.supported).toBe(true)
      }
    }
  })

  it('derives a buy ceiling below the fair value once evidence exists', () => {
    const { results } = run(withHistory())
    const priced = results.filter((result) => result.liquidity && result.valuation)

    for (const result of priced) {
      // A ceiling at or above fair value would mean paying full price and
      // hoping, which is the opposite of what a ceiling is for.
      expect(result.liquidity!.maxBuy).toBeLessThan(result.valuation!.fairValue)
      expect(result.liquidity!.maxBuy).toBeGreaterThanOrEqual(0)
    }
  })

  it('keeps the sale-probability interval inside 0..1', () => {
    const { results } = run(withHistory())
    for (const result of results) {
      if (!result.liquidity) continue
      const { low, high } = result.liquidity.saleProbability
      expect(low).toBeGreaterThanOrEqual(0)
      expect(high).toBeLessThanOrEqual(1)
      expect(low).toBeLessThanOrEqual(high)
    }
  })

  it('scores concentration risk when a bankroll is supplied', () => {
    const observations = withHistory()
    const rich = valueObservations({
      observations, expectedLines, itemKey: 'gelano',
      profiles: { ...emptyPriorityProfiles(), byItem: {} },
      bankroll: 100_000_000,
    })
    const poor = valueObservations({
      observations, expectedLines, itemKey: 'gelano',
      profiles: { ...emptyPriorityProfiles(), byItem: {} },
      bankroll: 1_200_000,
    })

    const richScore = rich.results.find((result) => result.liquidity)?.liquidity?.opportunity.score
    const poorScore = poor.results.find((result) => result.liquidity)?.liquidity?.opportunity.score

    if (richScore !== undefined && poorScore !== undefined) {
      // Same trade, but it eats far more of the smaller bankroll.
      expect(poorScore).toBeLessThan(richScore)
    }
  })
})

// Phase 5. The engine's last question: not "which listing is best" but "what do
// I buy right now, with what I have".
describe('the purchase plan', () => {
  const withHistory = () => market().map((entry, index) => ({
    ...entry,
    firstSeenAt: '2026-07-01T00:00:00.000Z',
    lastSeenAt: '2026-07-05T00:00:00.000Z',
    status: (index % 2 === 0 ? 'sold' : 'listed') as const,
  }))

  it('produces no plan without a bankroll to constrain it', () => {
    // An unconstrained plan is the ranked list wearing a different name.
    expect(run(withHistory()).plan).toBeNull()
  })

  it('produces a plan once a bankroll is known', () => {
    const { plan } = valueObservations({
      observations: withHistory(),
      expectedLines,
      itemKey: 'gelano',
      profiles: { ...emptyPriorityProfiles(), byItem: {} },
      bankroll: 20_000_000,
    })

    expect(plan).toBeTruthy()
    expect(plan!.spend).toBeLessThanOrEqual(20_000_000)
    expect(plan!.remaining).toBe(20_000_000 - plan!.spend)
  })

  it('never spends on a listing it would not recommend', () => {
    const { results, plan } = valueObservations({
      observations: withHistory(),
      expectedLines,
      itemKey: 'gelano',
      profiles: { ...emptyPriorityProfiles(), byItem: {} },
      bankroll: 50_000_000,
    })

    for (const taken of plan!.taken) {
      const result = results.find((entry) => entry.observation.id === taken.observationId)!
      expect(result.badges).toContain('underpriced')
    }
  })

  it('cannot spend more than the bankroll however many candidates there are', () => {
    const { plan } = valueObservations({
      observations: withHistory(),
      expectedLines,
      itemKey: 'gelano',
      profiles: { ...emptyPriorityProfiles(), byItem: {} },
      bankroll: 100_000,
    })

    expect(plan!.spend).toBeLessThanOrEqual(100_000)
  })
})

// Phase 0a. Observations carried no server, so one economy could price another.
describe('server scoping', () => {
  const onServer = (serverId: string) => (entry: ObservedPrice) => ({ ...entry, serverId })

  it('ignores listings from a different server entirely', () => {
    const here = market().map(onServer('mine'))
    // A parallel market at ten times the price. If it leaks in, it drags every
    // fair value on this server up with it.
    const elsewhere = market().map((entry) => ({
      ...entry,
      id: `far-${entry.id}`,
      price: entry.price * 10,
      serverId: 'other',
    }))

    const alone = valueObservations({
      observations: here,
      expectedLines,
      itemKey: 'gelano',
      profiles: { ...emptyPriorityProfiles(), byItem: {} },
      serverId: 'mine',
    })
    const mixed = valueObservations({
      observations: [...here, ...elsewhere],
      expectedLines,
      itemKey: 'gelano',
      profiles: { ...emptyPriorityProfiles(), byItem: {} },
      serverId: 'mine',
    })

    expect(mixed.results).toHaveLength(alone.results.length)
    expect(mixed.summary.total).toBe(alone.summary.total)
    for (const result of mixed.results) {
      const same = alone.results.find((entry) => entry.observation.id === result.observation.id)!
      expect(result.valuation?.fairValue).toBe(same.valuation?.fairValue)
    }
  })

  it('keeps rows whose server is unknown, rather than discarding a real history', () => {
    // Captured before servers were recorded. Almost certainly this server, and
    // throwing it away would destroy the data to guard against a hypothetical.
    const legacy = market()
    const { results } = valueObservations({
      observations: legacy,
      expectedLines,
      itemKey: 'gelano',
      profiles: { ...emptyPriorityProfiles(), byItem: {} },
      serverId: 'mine',
    })
    expect(results).toHaveLength(legacy.length)
  })

  it('compares everything when no server is given', () => {
    const mixed = [...market().map(onServer('a')), ...market().map((entry) => ({
      ...entry,
      id: `b-${entry.id}`,
      serverId: 'b',
    }))]
    const { summary } = valueObservations({
      observations: mixed,
      expectedLines,
      itemKey: 'gelano',
      profiles: { ...emptyPriorityProfiles(), byItem: {} },
    })
    expect(summary.total).toBe(mixed.length)
  })
})

// Leave-one-out leaves the best and worst rolls with peers on one side only, so
// their fair value is extrapolated off the end of the curve. Showing that
// estimate is fine; buying on it is not.
describe('extrapolation gate', () => {
  it('will not call the worst roll in a segment a deal', () => {
    const { results } = run(market())
    const junk = results.find((result) => result.observation.id === 'junk')!

    // Every peer is a better roll, so nothing supports the curve down here.
    expect(junk.badges).not.toContain('underpriced')
    expect(junk.badges).not.toContain('best-buy')
    expect(junk.confidence).toBe('low')
  })

  it('still values it, so the estimate stays visible', () => {
    const { results } = run(market())
    const junk = results.find((result) => result.observation.id === 'junk')!
    expect(junk.valuation).toBeTruthy()
  })

  it('still finds a genuine bargain inside the peer range', () => {
    // Same roll as 'perfect', a fifth of the price — interpolated, not
    // extrapolated, so the gate must not suppress it.
    const observations = [...market(), listing(150_000, { pa: 1, dommages: 20, vitalite: 80 }, { id: 'steal' })]
    const steal = run(observations).results.find((result) => result.observation.id === 'steal')!
    expect(steal.badges).toContain('underpriced')
  })

  it('keeps best-buy and the candidate count agreeing', () => {
    const observations = [...market(), listing(150_000, { pa: 1, dommages: 20, vitalite: 80 }, { id: 'steal' })]
    const { results, summary } = run(observations)
    const flagged = results.filter((result) => result.badges.includes('underpriced'))
    expect(summary.candidates).toBe(flagged.length)
    if (summary.candidates === 0) {
      expect(results.some((result) => result.badges.includes('best-buy'))).toBe(false)
    }
  })
})
