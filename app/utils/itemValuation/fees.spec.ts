import { describe, expect, it } from 'vitest'
import {
  computeCosts,
  computeMaxBuy,
  defaultFeePolicy,
  scoreOpportunity,
} from './fees'

const policy = defaultFeePolicy()

describe('costs are cash flow, not a haircut', () => {
  it('charges the listing fee even on a fast sale', () => {
    // Paid whether or not it sells. The old flat-haircut model only ever
    // subtracted it from a sale that was assumed to happen.
    const costs = computeCosts({ buyPrice: 1_000_000, conservativeSale: 1_500_000, expectedDays: 1, policy })
    expect(costs.listingFee).toBeGreaterThan(0)
  })

  it('adds repricing and expiry cost once the hold crosses a listing cycle', () => {
    const quick = computeCosts({ buyPrice: 1_000_000, conservativeSale: 1_500_000, expectedDays: 5, policy })
    const slow = computeCosts({ buyPrice: 1_000_000, conservativeSale: 1_500_000, expectedDays: 60, policy })

    expect(quick.repriceFees).toBe(0)
    expect(slow.repriceFees).toBeGreaterThan(0)
    expect(slow.expiryReserve).toBeGreaterThan(0)
  })

  it('charges for capital tied up, in proportion to the wait', () => {
    const quick = computeCosts({ buyPrice: 1_000_000, conservativeSale: 1_500_000, expectedDays: 1, policy })
    const slow = computeCosts({ buyPrice: 1_000_000, conservativeSale: 1_500_000, expectedDays: 30, policy })
    expect(slow.capitalCost).toBeGreaterThan(quick.capitalCost * 20)
  })
})

describe('the buy ceiling', () => {
  const base = {
    conservativeSale: 1_000_000,
    expectedDays: 7,
    policy,
    uncertainty: 0.1,
    minProfitKamas: 50_000,
    minReturnRate: 0.15,
  }

  it('sits below the conservative sale price by more than the fees alone', () => {
    const result = computeMaxBuy(base)
    expect(result.maxBuy).toBeLessThan(base.conservativeSale - result.costs.listingFee)
    expect(result.viable).toBe(true)
  })

  it('falls as the valuation gets less certain', () => {
    // A number that could be 40% out has to be discounted before it is spent.
    const tight = computeMaxBuy({ ...base, uncertainty: 0.05 })
    const loose = computeMaxBuy({ ...base, uncertainty: 0.4 })
    expect(loose.maxBuy).toBeLessThan(tight.maxBuy)
  })

  it('falls as the expected hold lengthens', () => {
    const fast = computeMaxBuy({ ...base, expectedDays: 2 })
    const slow = computeMaxBuy({ ...base, expectedDays: 60 })
    expect(slow.maxBuy).toBeLessThan(fast.maxBuy)
  })

  it('refuses to price a trade that cannot clear the bars', () => {
    // Demanding more profit than the whole sale is worth must not produce a
    // negative ceiling that some caller then treats as a number.
    const result = computeMaxBuy({ ...base, minProfitKamas: 5_000_000 })
    expect(result.maxBuy).toBe(0)
    expect(result.viable).toBe(false)
  })

  it('never returns a ceiling that loses money at its own assumptions', () => {
    const result = computeMaxBuy(base)
    const costs = computeCosts({
      buyPrice: result.maxBuy,
      conservativeSale: base.conservativeSale,
      expectedDays: base.expectedDays,
      policy,
    })
    const net = base.conservativeSale - result.maxBuy - costs.total
    expect(net).toBeGreaterThanOrEqual(0)
  })
})

describe('ranking by return per kama per day', () => {
  const base = {
    conservativeSale: 1_000_000,
    policy,
    evidenceReliability: 1,
    bankrollShare: 0.1,
  }

  it('prefers a smaller fast flip to a bigger slow one', () => {
    // The ordering the old absolute-profit ranking got backwards. The slow
    // trade is genuinely the more profitable one in absolute kamas — it has to
    // be, or the test would prove nothing — and is still the worse trade for
    // anyone whose capital could be turned over meanwhile.
    const fast = scoreOpportunity({ ...base, buyPrice: 850_000, expectedDays: 1 })
    const slow = scoreOpportunity({
      ...base,
      conservativeSale: 2_000_000,
      buyPrice: 1_000_000,
      expectedDays: 30,
    })

    expect(slow.netProfitLow).toBeGreaterThan(fast.netProfitLow)
    expect(fast.score).toBeGreaterThan(slow.score)
  })

  it('turns a long hold into a real cost rather than a footnote', () => {
    // A trade with a fat headline margin can still be a loss once the capital
    // charge is applied, and the engine has to be able to say so.
    const bloated = scoreOpportunity({
      ...base,
      conservativeSale: 2_000_000,
      buyPrice: 1_750_000,
      expectedDays: 30,
    })
    expect(bloated.components.grossMargin).toBeGreaterThan(0)
    expect(bloated.netProfitLow).toBeLessThan(0)
  })

  it('penalises a trade that would eat the bankroll', () => {
    const small = scoreOpportunity({ ...base, buyPrice: 800_000, expectedDays: 3, bankrollShare: 0.05 })
    const huge = scoreOpportunity({ ...base, buyPrice: 800_000, expectedDays: 3, bankrollShare: 0.8 })
    expect(huge.score).toBeLessThan(small.score)
  })

  it('discounts weak evidence', () => {
    const solid = scoreOpportunity({ ...base, buyPrice: 800_000, expectedDays: 3, evidenceReliability: 1 })
    const shaky = scoreOpportunity({ ...base, buyPrice: 800_000, expectedDays: 3, evidenceReliability: 0.3 })
    expect(shaky.score).toBeLessThan(solid.score)
  })

  it('shows its components rather than hiding them in one number', () => {
    const scored = scoreOpportunity({ ...base, buyPrice: 800_000, expectedDays: 3 })
    expect(scored.components.grossMargin).toBeGreaterThan(0)
    expect(scored.components.costs).toBeGreaterThan(0)
    expect(scored.components.days).toBe(3)
  })

  it('scores a losing trade negatively rather than clamping it to zero', () => {
    const bad = scoreOpportunity({ ...base, buyPrice: 1_200_000, expectedDays: 10 })
    expect(bad.netProfitLow).toBeLessThan(0)
    expect(bad.score).toBeLessThan(0)
  })

  it('makes a losing trade worse when it is riskier, not better', () => {
    // Penalties multiply, and multiplying a negative by 0.2 moves it *towards*
    // zero — so before this was fixed, the riskiest and least-evidenced losses
    // ranked as the most attractive trades on the board.
    const losing = { ...base, buyPrice: 1_200_000, expectedDays: 10 }
    const safe = scoreOpportunity({ ...losing, bankrollShare: 0.05, evidenceReliability: 1 })
    const risky = scoreOpportunity({ ...losing, bankrollShare: 0.8, evidenceReliability: 0.3 })

    expect(risky.score).toBeLessThan(safe.score)
  })
})

describe('the fee policy is versioned', () => {
  it('advertises that its constants are unverified', () => {
    // A stale policy has to be detectable. Silence here would mean a number
    // from a patch ago quietly pricing today's trades.
    expect(defaultFeePolicy().version).toContain('unverified')
  })
})
