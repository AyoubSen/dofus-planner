// What a flip actually costs, and the most you can pay and still make money.
//
// The old model applied a flat 2% haircut to the sale, as though cost were
// something deducted from a transaction that happens. It is not. The listing
// fee, every repricing fee, and the non-refundable fee on expiry are paid
// whether or not the item ever sells — they are cash flow, and they belong in a
// reserve computed *before* the purchase decision, not in a discount applied
// after an imagined sale.
//
// The other half is that a buy ceiling has to be built on a conservative sale
// estimate and survive the pessimistic end of everything uncertain. A ceiling
// derived from a median sale price and a point estimate of liquidity is a
// coin-flip with a spreadsheet attached.
//
// Every constant here is a *policy*, versioned and verified against the live
// client, not a hardcoded number. Ankama changes them.

export interface FeePolicy {
  /** Version tag, so a stored decision records which rules it was made under. */
  version: string
  /** Share of the asking price charged to list. Paid up front, not refunded. */
  listingFeeRate: number
  /** Share charged to change the price of a live listing. */
  repriceFeeRate: number
  /** Days a listing stays up before it expires and must be relisted. */
  listingDurationDays: number
  /** How many listings can be held at once. Bankroll constraint, not a cost. */
  sellingSlots: number
}

/**
 * Placeholder policy.
 *
 * These match the community wiki's description of the market at time of
 * writing and **must be verified in the live client before any of this
 * authorises a purchase.** They are versioned precisely so that a stale set is
 * detectable rather than silently assumed to still hold.
 */
export const defaultFeePolicy = (): FeePolicy => ({
  version: 'unverified-2026-08',
  listingFeeRate: 0.02,
  repriceFeeRate: 0.02,
  listingDurationDays: 28,
  sellingSlots: 30,
})

export interface CostInputs {
  /** What you would pay for the item. */
  buyPrice: number
  /** The conservative sale estimate — a low quantile, never the median. */
  conservativeSale: number
  /** Pessimistic expected days to sell, from the hazard model. */
  expectedDays: number
  policy: FeePolicy
  /** Kamas-per-day opportunity cost per kama tied up, as a rate. */
  capitalCostPerDay?: number
}

export interface CostBreakdown {
  listingFee: number
  /** Expected repricing fees, from how many listing cycles the hold implies. */
  repriceFees: number
  /** Reserve for the case where it does not sell and must be relisted. */
  expiryReserve: number
  /** Opportunity cost of the kamas being locked up for the expected hold. */
  capitalCost: number
  total: number
}

/** Default opportunity cost: 1% of tied capital per day. */
export const DEFAULT_CAPITAL_COST_PER_DAY = 0.01

/**
 * Everything the flip costs besides the purchase itself.
 *
 * Repricing is derived from the hold rather than assumed to be zero: an item
 * expected to sit for six weeks will cross at least one listing expiry and be
 * relisted, and pretending otherwise understates cost precisely on the slow
 * items where cost matters most.
 */
export const computeCosts = (inputs: CostInputs): CostBreakdown => {
  const { policy, conservativeSale, expectedDays, buyPrice } = inputs
  const capitalCostPerDay = inputs.capitalCostPerDay ?? DEFAULT_CAPITAL_COST_PER_DAY

  const listingFee = conservativeSale * policy.listingFeeRate

  // Each expiry means another listing cycle, and a reprice is the usual
  // response to something not moving.
  const cycles = Math.max(0, Math.ceil(expectedDays / Math.max(1, policy.listingDurationDays)) - 1)
  const repriceFees = cycles * conservativeSale * policy.repriceFeeRate
  const expiryReserve = cycles * conservativeSale * policy.listingFeeRate

  const capitalCost = buyPrice * capitalCostPerDay * expectedDays

  return {
    listingFee,
    repriceFees,
    expiryReserve,
    capitalCost,
    total: listingFee + repriceFees + expiryReserve + capitalCost,
  }
}

export interface MaxBuyInputs {
  /** Conservative sale estimate: a low quantile of the peer distribution. */
  conservativeSale: number
  /** Pessimistic expected hold. */
  expectedDays: number
  policy: FeePolicy
  /** Width of the valuation interval, as a share. Widens the risk reserve. */
  uncertainty: number
  /** Absolute kamas you require from a trade. */
  minProfitKamas: number
  /** Return you require on the capital, as a share of the buy price. */
  minReturnRate: number
  capitalCostPerDay?: number
}

export interface MaxBuyResult {
  maxBuy: number
  costs: CostBreakdown
  riskReserve: number
  requiredProfit: number
  /** False when the item cannot clear the bars at any positive price. */
  viable: boolean
}

/**
 * The most you can pay and still expect to profit.
 *
 * Solved rather than assumed, because two of the terms depend on the buy price
 * itself — the capital cost and the return requirement both scale with it. One
 * fixed-point pass from a sensible starting guess is plenty at this precision,
 * and it converges from above so the result errs low.
 */
export const computeMaxBuy = (inputs: MaxBuyInputs): MaxBuyResult => {
  const { conservativeSale, expectedDays, policy, uncertainty } = inputs

  // Wider intervals buy less. A valuation that could be 40% out has to be
  // discounted by something like that much before it is spent against.
  const riskReserve = conservativeSale * Math.max(0, uncertainty)

  let buyPrice = conservativeSale * 0.5
  let costs = computeCosts({ buyPrice, conservativeSale, expectedDays, policy, capitalCostPerDay: inputs.capitalCostPerDay })
  let requiredProfit = Math.max(inputs.minProfitKamas, buyPrice * inputs.minReturnRate)

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const next = conservativeSale - costs.total - riskReserve - requiredProfit
    const candidate = Math.max(0, next)
    if (Math.abs(candidate - buyPrice) < 1) {
      buyPrice = candidate
      break
    }
    buyPrice = candidate
    costs = computeCosts({ buyPrice, conservativeSale, expectedDays, policy, capitalCostPerDay: inputs.capitalCostPerDay })
    requiredProfit = Math.max(inputs.minProfitKamas, buyPrice * inputs.minReturnRate)
  }

  return {
    maxBuy: Math.floor(buyPrice),
    costs,
    riskReserve,
    requiredProfit,
    viable: buyPrice > 0,
  }
}

export interface OpportunityInputs {
  buyPrice: number
  conservativeSale: number
  expectedDays: number
  policy: FeePolicy
  /** Confidence in 0..1, from the evidence tier. Scales the score down. */
  evidenceReliability: number
  /** Share of bankroll this trade would consume. */
  bankrollShare: number
  capitalCostPerDay?: number
}

export interface OpportunityScore {
  netProfitLow: number
  /** Return per kama of capital per day — the metric a bounded bankroll wants. */
  returnPerKamaPerDay: number
  score: number
  /** Components, shown rather than hidden inside one opaque number. */
  components: {
    grossMargin: number
    costs: number
    days: number
    reliability: number
    exposurePenalty: number
  }
}

/**
 * Ranks a trade by return per kama per day, not by absolute profit.
 *
 * With a bounded bankroll, absolute profit is the wrong objective: a 200k gain
 * over three weeks ranks above a 150k gain that turns around the same day, and
 * that ordering is backwards for anyone who can redeploy the capital. Dividing
 * by both the capital and the time is what makes the two comparable.
 */
export const scoreOpportunity = (inputs: OpportunityInputs): OpportunityScore => {
  const costs = computeCosts({
    buyPrice: inputs.buyPrice,
    conservativeSale: inputs.conservativeSale,
    expectedDays: inputs.expectedDays,
    policy: inputs.policy,
    capitalCostPerDay: inputs.capitalCostPerDay,
  })

  const grossMargin = inputs.conservativeSale - inputs.buyPrice
  const netProfitLow = grossMargin - costs.total
  const days = Math.max(0.5, inputs.expectedDays)
  const capital = Math.max(1, inputs.buyPrice)

  const returnPerKamaPerDay = netProfitLow / capital / days

  // Concentration is a real risk even on a good trade: one listing that ties up
  // most of the bankroll blocks every other opportunity while it sits.
  const exposurePenalty = 1 - Math.min(0.9, Math.max(0, inputs.bankrollShare))
  const reliability = Math.min(1, Math.max(0, inputs.evidenceReliability))

  // Penalties have to make a trade *worse* regardless of which side of zero it
  // sits on. Multiplying works for a profit and inverts for a loss — a losing
  // trade scaled by 0.2 comes out five times closer to zero, so the riskiest,
  // least-evidenced losses would have ranked as the most attractive ones. So
  // divide instead when the return is negative, which pushes it further down.
  const penalty = Math.max(0.05, reliability * exposurePenalty)
  const score = returnPerKamaPerDay >= 0
    ? returnPerKamaPerDay * penalty
    : returnPerKamaPerDay / penalty

  return {
    netProfitLow,
    returnPerKamaPerDay,
    score,
    components: {
      grossMargin,
      costs: costs.total,
      days,
      reliability,
      exposurePenalty,
    },
  }
}
