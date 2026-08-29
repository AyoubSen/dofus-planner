// The valuation engine's single entry point.
//
// `items.vue` used to carry ~500 lines of this logic inline, untested, which is
// how a dead priority multiplier went unnoticed for a whole refactor. The page
// now calls one function and renders what comes back.

import { computeItemQuality, requiredValueFor } from './quality'
import { evaluateRequirements, resolvePriorities } from './requirements'
import type { PriorityProfiles } from './requirements'
import { groupBySegment, segmentSignature, selectPeers } from './segments'
import type { PeerScope, ScoredObservation } from './segments'
import {
  defaultPriceModelConfig,
  fitPriceCurve,
  sampleFromObservation,
  valueListing,
} from './priceModel'
import type { ListingValuation, PriceModelConfig } from './priceModel'
import { allocate, defaultAllocationLimits } from './allocator'
import type { AllocationPlan, Candidate } from './allocator'
import { daysOnMarket } from './saleTracking'
import {
  expectedDaysToSell,
  fitHazard,
  saleProbability,
  toDurationObservations,
} from './hazard'
import type { HazardModel, SaleProbability } from './hazard'
import { computeMaxBuy, defaultFeePolicy, scoreOpportunity } from './fees'
import type { FeePolicy, OpportunityScore } from './fees'
import type {
  ExpectedLine,
  ItemQuality,
  ObservedPrice,
  RequirementResult,
  StatPriority,
} from './types'

export * from './types'
export * from './quality'
export * from './requirements'
export * from './segments'
export * from './priceModel'
export * from './saleTracking'
export * from './statWeights'
export * from './hazard'
export * from './fees'
export * from './allocator'

export type Confidence = 'high' | 'medium' | 'low'

export type ValuationBadge =
  | 'underpriced'
  | 'best-buy'
  | 'below-requirement'
  | 'low-confidence'
  | 'unpriced'

export interface ValuedObservation {
  observation: ObservedPrice
  quality: ItemQuality
  /** Normalised roll quality; ~1 is a perfect roll. */
  score: number
  requirements: RequirementResult
  segment: string
  peerIds: string[]
  peerScope: PeerScope
  valuation: ListingValuation | null
  confidence: Confidence
  /** Net profit at the fair relist price, after tax. */
  netProfit: number
  daysOnMarket: number | null
  badges: ValuationBadge[]
  /**
   * Liquidity and the buy ceiling, when there is enough evidence for them.
   *
   * Null rather than zero-filled when unsupported: an absent estimate and an
   * estimate of zero mean opposite things, and conflating them is how "we do
   * not know" turns into "it will never sell".
   */
  liquidity: {
    /** P(sale within the model horizon) at this price, as an interval. */
    saleProbability: SaleProbability
    /** Expected days to sell, pessimistic and optimistic ends. */
    expectedDays: { low: number; high: number }
    /** Most you could pay and still expect to profit, at the pessimistic end. */
    maxBuy: number
    /** Return per kama of capital per day — the bounded-bankroll metric. */
    opportunity: OpportunityScore
  } | null
}

export interface ValuationSummary {
  total: number
  qualifying: number
  belowRequirement: number
  candidates: number
  segments: number
  clearedSamples: number
  requirementsInForce: Array<{ statKey: string; label: string; priority: StatPriority; needs: number }>
}

export interface ValuationResult {
  results: ValuedObservation[]
  summary: ValuationSummary
  /**
   * What to actually buy, given a bankroll.
   *
   * Null when no bankroll was supplied: without a constraint there is nothing
   * to allocate, and an unconstrained plan is the ranked list under another
   * name. Ranking answers "which is best"; this answers "which set do I take,
   * with what I have, under the slot limit".
   */
  plan: AllocationPlan | null
}

export interface ValuationInput {
  observations: ObservedPrice[]
  expectedLines: ExpectedLine[]
  profiles: PriorityProfiles
  itemKey: string
  config?: PriceModelConfig
  /** Market fee rules. Versioned, because Ankama changes them. */
  feePolicy?: FeePolicy
  /** Bankroll, so a trade's concentration risk can be scored. Optional. */
  bankroll?: number
  /**
   * The server whose market is being valued.
   *
   * Dofus servers are separate economies: the same item can differ several-fold
   * between them, so an ask from one is not evidence about another. Observations
   * were stored under browser-global keys with no server on them at all, which
   * meant a Hell Mina listing could set the fair value of a Draconiros item and
   * nothing about the result would look wrong.
   *
   * Left undefined, everything is comparable — which is the right behaviour for
   * a history captured before this field existed.
   */
  serverId?: string
}

/**
 * Whether a row's price is believed well enough to price other rows with.
 *
 * A proposal is a number only the statistical reader produced, after the
 * deterministic one refused. The corpus has a real instance of one being wrong
 * by 800k while looking entirely reasonable, so proposals are shown to the user
 * but never allowed to set a fair value, form a peer, or move a median.
 *
 * Rows written before trust states existed have no marking and are treated as
 * verified — they predate the distinction, and retroactively demoting a
 * history the user has been relying on would be its own kind of dishonesty.
 */
export const isTrustedPrice = (observation: ObservedPrice): boolean =>
  observation.priceTrust === undefined
  || observation.priceTrust === 'verified'
  || observation.priceTrust === 'confirmed'

/**
 * Whether an observation may be compared against the market being valued.
 *
 * Unknown provenance is *not* treated as a mismatch. Rows captured before
 * servers were recorded almost certainly came from the server the user plays
 * on, and discarding them would destroy a real history to protect against a
 * hypothetical one. A row with a *known and different* server is another
 * matter: that is positive evidence of incomparability, and it is excluded.
 */
export const isComparableServer = (
  observationServerId: string | undefined,
  serverId: string | undefined,
): boolean => {
  if (!serverId || !observationServerId) return true
  return observationServerId === serverId
}

/**
 * Confidence in one listing's valuation.
 *
 * Deliberately pessimistic: a number the user might spend a million kamas on
 * should advertise its own shakiness. Any valuation still resting on asking
 * prices is capped at medium however much data backs it, because asks only
 * prove what someone hoped for.
 */
const gradeConfidence = (
  valuation: ListingValuation | null,
  peerScope: PeerScope,
  requirementCoverage: number,
): Confidence => {
  if (!valuation) return 'low'

  let points = 0
  if (valuation.curve.sampleCount >= 8) points += 2
  else if (valuation.curve.sampleCount >= 5) points += 1

  if (valuation.curve.kind === 'fitted') points += 1
  if (peerScope === 'exact-segment') points += 2
  else if (peerScope === 'same-gate') points += 1

  if (requirementCoverage > 0) points += 1

  const restingOnAsks = valuation.curve.clearedCount < 3
  if (valuation.curve.clearedCount >= 5) points += 2
  else if (valuation.curve.clearedCount >= 3) points += 1

  if (points >= 6 && !restingOnAsks) return 'high'
  if (points >= 3) return 'medium'
  return 'low'
}

/**
 * Scores, gates, segments and prices every captured listing for one item.
 *
 * Order matters: quality and the requirement gate come first, because the gate
 * decides which listings are allowed to price each other. A listing that fails
 * the user's stated requirements never sets the value of one that meets them.
 */
export const valueObservations = (input: ValuationInput): ValuationResult => {
  const { expectedLines, profiles, itemKey } = input
  const config = input.config ?? defaultPriceModelConfig()

  // Cross-server rows are dropped outright: another economy is not evidence
  // here under any circumstances.
  //
  // Unverified proposals are *kept*. The intent was to drop them too, and on
  // the current pipeline that would have emptied the app — the deterministic
  // reader has answered zero times in thirty-nine real captures, so every row
  // is a proposal and excluding them leaves nothing to value. A safety rule
  // that removes all the data is not safety, it is a broken tool.
  //
  // The distinction that survives is between *informing* and *authorising*: a
  // proposal contributes to the market picture, and cannot be recommended as a
  // purchase (see the `underpriced` gate below). One of them was already caught
  // being wrong by 800k while looking entirely reasonable.
  const observations = input.observations
    .filter((observation) => isComparableServer(observation.serverId, input.serverId))

  const statKeys = new Set<string>([
    ...expectedLines.map((line) => line.statKey),
    ...observations.flatMap((observation) =>
      (observation.statsEntries || []).map((entry) => entry.key)),
  ])
  const priorities = resolvePriorities(profiles, itemKey, statKeys)

  const scored = observations.map((observation) => {
    const quality = computeItemQuality(observation, { expectedLines, priorities })
    const requirements = evaluateRequirements(quality)
    return { observation, quality, requirements }
  })

  const population: ScoredObservation[] = scored.map((entry) => ({
    id: entry.observation.id,
    price: entry.observation.price,
    quality: entry.quality.quality,
    lines: entry.quality.lines,
    requirementsPassed: entry.requirements.passed,
  }))
  const populationById = new Map(population.map((entry) => [entry.id, entry]))
  const statusById = new Map(observations.map((o) => [o.id, o.status]))

  // Liquidity is a property of the market, so it is fitted once over every
  // observation rather than per listing. Prices are the covariate; how long
  // things sat is the outcome.
  const feePolicy = input.feePolicy ?? defaultFeePolicy()
  const hazard: HazardModel = fitHazard(toDurationObservations(observations))
  const priceMedian = (() => {
    const sorted = observations.map((entry) => entry.price).sort((a, b) => a - b)
    return sorted.length ? sorted[Math.floor(sorted.length / 2)]! : 0
  })()

  const results: ValuedObservation[] = scored.map((entry) => {
    const self = populationById.get(entry.observation.id)!
    const selection = selectPeers(self, population)

    // Leave-one-out: the listing being valued is never in its own curve.
    //
    // It used to be, "so a segment of comparable rolls still supports a
    // valuation for each of them" — but that is target leakage. A cheap listing
    // dragged down the very fair value it was then compared against, damping
    // exactly the underpriced listings this engine exists to find, and an
    // expensive one talked itself up the same way. The fair value has to be an
    // estimate of what *other* listings say the market is, or the comparison is
    // circular.
    //
    // The cost is real and is accepted: with self excluded, a segment needs
    // three peers rather than two to price at all, so thin items now report
    // unpriced where they used to report a number. That number was an artefact
    // of the target's own price, so losing it is a gain.
    const curveSamples = selection.peers.map((member) =>
      sampleFromObservation({ ...member, status: statusById.get(member.id) }))
    const curve = curveSamples.length ? fitPriceCurve(curveSamples) : null

    const valuation = curve
      ? valueListing(
          { price: self.price, quality: self.quality },
          curve,
          selection.peers.map((peer) => peer.price),
          config,
        )
      : null

    // Is this listing inside the range its peers actually cover?
    //
    // Leave-one-out means the best and worst rolls in a segment have peers only
    // on one side of them, so their fair value is an *extrapolation* off the end
    // of the fitted curve rather than an interpolation between observations. The
    // curve's exponent is estimated from the middle of the market and there is
    // nothing out there to check it against, so the number can be arbitrarily
    // wrong — and it is wrong in the dangerous direction for the cheapest
    // listing, which extrapolates to a fair value above its ask and reads as a
    // bargain when it is simply the worst roll on offer.
    //
    // So an extrapolated valuation is still shown, but it cannot authorise a
    // purchase. Displaying an estimate and acting on one are different bars.
    const peerQualities = selection.peers.map((peer) => peer.quality)
    const extrapolated = peerQualities.length > 0
      && (self.quality > Math.max(...peerQualities) || self.quality < Math.min(...peerQualities))

    const confidence = extrapolated
      ? 'low'
      : gradeConfidence(
          valuation,
          selection.scope,
          entry.requirements.requiredCount,
        )
    const net = valuation?.netAtFair ?? 0

    const badges: ValuationBadge[] = []
    if (!entry.requirements.passed) badges.push('below-requirement')
    if (!valuation) badges.push('unpriced')
    // An unconfirmed price may not be recommended as a buy. It still shows, and
    // still informs the curve, but "go and spend a million kamas on this" is a
    // different bar from "this is roughly what the market looks like".
    else if (valuation.isDeal && entry.requirements.passed && !extrapolated
      && isTrustedPrice(entry.observation)) badges.push('underpriced')
    if (valuation && confidence === 'low') badges.push('low-confidence')

    // Liquidity only when there is a fair value to sell at and a hazard band
    // with evidence in it. Anything else would be arithmetic on assumptions.
    const relativePrice = priceMedian > 0 ? self.price / priceMedian : 1
    const probability = saleProbability(hazard, relativePrice)
    let liquidity: ValuedObservation['liquidity'] = null

    if (valuation && probability.supported) {
      const days = expectedDaysToSell(probability, hazard.horizonDays)
      // Conservative throughout: the sale price is the fair value discounted by
      // the interval's own width, and the hold is the pessimistic end. A buy
      // ceiling built on the median of everything is a coin flip.
      const uncertainty = confidence === 'high' ? 0.1 : confidence === 'medium' ? 0.2 : 0.35
      const conservativeSale = valuation.fairValue * (1 - uncertainty)

      const ceiling = computeMaxBuy({
        conservativeSale,
        expectedDays: days.high,
        policy: feePolicy,
        uncertainty,
        minProfitKamas: 0,
        minReturnRate: config.minMargin,
      })

      liquidity = {
        saleProbability: probability,
        expectedDays: days,
        maxBuy: ceiling.maxBuy,
        opportunity: scoreOpportunity({
          buyPrice: self.price,
          conservativeSale,
          expectedDays: days.high,
          policy: feePolicy,
          evidenceReliability: confidence === 'high' ? 1 : confidence === 'medium' ? 0.6 : 0.3,
          bankrollShare: input.bankroll && input.bankroll > 0 ? self.price / input.bankroll : 0,
        }),
      }
    }

    return {
      observation: entry.observation,
      quality: entry.quality,
      score: entry.quality.quality,
      requirements: entry.requirements,
      segment: segmentSignature(self),
      peerIds: selection.peers.map((peer) => peer.id),
      peerScope: selection.scope,
      valuation,
      confidence,
      netProfit: net,
      daysOnMarket: daysOnMarket(entry.observation),
      badges,
      liquidity,
    }
  })

  // One definition of "actionable", used by both the best-buy pick and the
  // summary count. They each re-derived it from `valuation.isDeal`, which meant
  // a listing could be excluded from the badge and still be counted as a
  // candidate — and after the extrapolation gate above, that divergence would
  // have let an unactionable listing be named best buy.
  const isActionable = (result: ValuedObservation) => result.badges.includes('underpriced')

  const bestBuy = results
    .filter(isActionable)
    .sort((a, b) => b.netProfit - a.netProfit)[0]
  if (bestBuy) bestBuy.badges.unshift('best-buy')

  // Turn the valued listings into buy candidates. Ranking says which single
  // trade is best; a bankroll needs to know which *set* to take, under the slot
  // limit and the concentration caps.
  const candidates: Candidate[] = results
    .filter((result) => result.liquidity && result.valuation)
    .map((result) => ({
      observationId: result.observation.id,
      itemKey: result.observation.itemKey,
      itemName: result.observation.itemName,
      buyPrice: result.observation.price,
      netProfitLow: result.liquidity!.opportunity.netProfitLow,
      returnPerKamaPerDay: result.liquidity!.opportunity.returnPerKamaPerDay,
      expectedDays: result.liquidity!.expectedDays.high,
      reliability: result.liquidity!.opportunity.components.reliability,
      // Everything the badge gate already decided: requirements met, priced,
      // not extrapolated, and the price confirmed rather than guessed.
      actionable: result.badges.includes('underpriced'),
    }))

  const requirementsInForce = expectedLines
    .filter((line) => priorities[line.statKey] === 'high' || priorities[line.statKey] === 'critical')
    .map((line) => ({
      statKey: line.statKey,
      label: line.label,
      priority: priorities[line.statKey]!,
      needs: requiredValueFor(line, priorities[line.statKey]!),
    }))

  return {
    results,
    // Only when a bankroll is known: without one there is no constraint to
    // allocate against, and an unconstrained "plan" is just the ranked list
    // again wearing a different name.
    plan: input.bankroll && input.bankroll > 0
      ? allocate(candidates, defaultAllocationLimits(input.bankroll))
      : null,
    summary: {
      total: results.length,
      qualifying: results.filter((result) => result.requirements.passed).length,
      belowRequirement: results.filter((result) => !result.requirements.passed).length,
      candidates: results.filter(isActionable).length,
      segments: groupBySegment(population).size,
      clearedSamples: observations.filter((observation) => observation.status === 'sold').length,
      requirementsInForce,
    },
  }
}
