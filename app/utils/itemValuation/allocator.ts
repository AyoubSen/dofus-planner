// Deciding which trades to actually take.
//
// Ranking opportunities is not the same as choosing them. A list sorted by
// return per kama per day says which single trade is best; it does not say what
// to do with a bankroll that can fund four of them, or that the HDV only lets
// you hold so many listings at once, or that putting eighty percent of your
// kamas into one slow item is a worse position than three fast ones even when
// its rate is higher.
//
// This is the last step of the plan and the one the whole engine has been
// building toward: an answer to "what do I buy right now, with what I have".
//
// It is deliberately a greedy allocator rather than an optimiser. The inputs —
// sale probability, expected hold, fair value — are intervals with real width,
// and an exact solution to an approximate problem buys precision that the data
// cannot support while making the result impossible to explain. Greedy by rate,
// with explicit caps, produces a plan a person can read and disagree with.

export interface Candidate {
  observationId: string
  itemKey: string
  itemName: string
  /** What it would cost to buy. */
  buyPrice: number
  /** Conservative net profit, already after fees and capital cost. */
  netProfitLow: number
  /** Return per kama of capital per day, the ranking metric. */
  returnPerKamaPerDay: number
  /** Pessimistic days to sell. */
  expectedDays: number
  /** 0..1, from the evidence tier. */
  reliability: number
  /** False for anything not confirmed; those may inform but never authorise. */
  actionable: boolean
}

export interface AllocationLimits {
  /** Kamas available to spend. */
  bankroll: number
  /** How many listings can be held at once. */
  sellingSlots: number
  /** Ceiling on the share of bankroll any single trade may take. */
  maxSharePerTrade: number
  /** Ceiling on the share of bankroll any single *item* may take. */
  maxSharePerItem: number
  /** Trades below this rate are not worth the slot. */
  minReturnPerKamaPerDay: number
}

export const defaultAllocationLimits = (bankroll: number): AllocationLimits => ({
  bankroll,
  sellingSlots: 30,
  // A third in one trade is already aggressive; more and a single slow sale
  // stalls everything else.
  maxSharePerTrade: 0.33,
  // Several listings of the same item are one bet on that item's market, not
  // three independent ones — they sell to the same buyers at the same time.
  maxSharePerItem: 0.5,
  minReturnPerKamaPerDay: 0.005,
})

export interface AllocationEntry {
  candidate: Candidate
  /** Why it was taken, or why it was not. */
  reason: 'taken' | 'not-actionable' | 'below-rate' | 'no-bankroll' | 'trade-cap' | 'item-cap' | 'no-slots'
}

export interface AllocationPlan {
  taken: Candidate[]
  rejected: AllocationEntry[]
  spend: number
  /** Sum of conservative net profit across the plan. */
  expectedProfit: number
  /** Kamas left unspent. */
  remaining: number
  /** Weighted mean days the capital is tied up. */
  meanHoldDays: number
  slotsUsed: number
}

/**
 * Builds a purchase plan under the given limits.
 *
 * Takes candidates by descending rate, skipping any that would breach a cap.
 * Skipping rather than stopping matters: a single huge trade near the top of
 * the list would otherwise block every smaller one behind it, which is the
 * opposite of what a bankroll constraint should do.
 */
export const allocate = (
  candidates: Candidate[],
  limits: AllocationLimits,
): AllocationPlan => {
  const ranked = candidates
    .slice()
    .sort((a, b) => b.returnPerKamaPerDay - a.returnPerKamaPerDay)

  const taken: Candidate[] = []
  const rejected: AllocationEntry[] = []
  const spentPerItem = new Map<string, number>()

  let spend = 0
  let expectedProfit = 0
  let holdWeighted = 0

  for (const candidate of ranked) {
    // An unconfirmed price may inform the market picture but cannot authorise
    // spending. The reader has been wrong by 800k while looking reasonable.
    if (!candidate.actionable) {
      rejected.push({ candidate, reason: 'not-actionable' })
      continue
    }
    if (candidate.returnPerKamaPerDay < limits.minReturnPerKamaPerDay) {
      rejected.push({ candidate, reason: 'below-rate' })
      continue
    }
    if (taken.length >= limits.sellingSlots) {
      rejected.push({ candidate, reason: 'no-slots' })
      continue
    }
    if (candidate.buyPrice > limits.bankroll * limits.maxSharePerTrade) {
      rejected.push({ candidate, reason: 'trade-cap' })
      continue
    }

    const itemSpend = (spentPerItem.get(candidate.itemKey) || 0) + candidate.buyPrice
    if (itemSpend > limits.bankroll * limits.maxSharePerItem) {
      rejected.push({ candidate, reason: 'item-cap' })
      continue
    }
    if (spend + candidate.buyPrice > limits.bankroll) {
      rejected.push({ candidate, reason: 'no-bankroll' })
      continue
    }

    taken.push(candidate)
    spentPerItem.set(candidate.itemKey, itemSpend)
    spend += candidate.buyPrice
    expectedProfit += candidate.netProfitLow
    holdWeighted += candidate.expectedDays * candidate.buyPrice
  }

  return {
    taken,
    rejected,
    spend,
    expectedProfit,
    remaining: limits.bankroll - spend,
    meanHoldDays: spend > 0 ? holdWeighted / spend : 0,
    slotsUsed: taken.length,
  }
}

/**
 * The plan's return, expressed the way a bankroll owner experiences it.
 *
 * Against the *whole* bankroll, not just the part deployed: idle kamas earn
 * nothing, and a plan that leaves most of them unspent is worse than its own
 * per-trade rate suggests. Reporting only the deployed return would flatter
 * exactly the plans that fail to find anything to do.
 */
export const planReturnPerDay = (plan: AllocationPlan, bankroll: number): number => {
  if (bankroll <= 0 || plan.meanHoldDays <= 0) return 0
  return plan.expectedProfit / bankroll / plan.meanHoldDays
}
