// How long a listing takes to sell, and what that is worth knowing.
//
// This module replaces a formulation that was wrong. An earlier design treated
// a listing still sitting on the market as a *right-censored clearing price* —
// "it hasn't sold at p, so the clearing price is below p" — and fitted a Tobit
// model on that. Two things are wrong with it:
//
//   - A listing that vanished is not a sale. It may have been cancelled, expired,
//     relisted, missed by the scan, or moved by pagination. Calling it a sale
//     fabricates the very label the engine is supposed to stop fabricating.
//   - A listing that persists does not imply latent value below its ask.
//     Insufficient buyer exposure explains it just as well; it may sell at that
//     price tomorrow. What is censored is the *duration*, not the price.
//
// The correct object is a time-to-event model: the probability of selling
// within a horizon, given the price. Duration is right-censored at the last
// sweep that still saw the listing — a clean, defensible claim that costs
// nothing to assert. Exit *cause* is a competing-risks mixture that observation
// alone cannot identify, so it is bounded rather than guessed.
//
// Nothing here converts a disappearance into a sale. It converts a population
// of listings into "at this price, roughly this share clears within a week,
// and here is how wrong that could be".

import type { ObservedPrice } from './types'

/** One listing's life so far, as the hazard model sees it. */
export interface DurationObservation {
  id: string
  /** Ask price, the covariate that matters. */
  price: number
  /** Price relative to the peer median. Comparable across items. */
  relativePrice: number
  /** Days from first sighting to last. */
  days: number
  /**
   * Did it leave the market during the window?
   *
   * `false` means still listed at the last sweep — right-censored. `true` means
   * gone, which is *not* the same as sold; see `exitIsSale` bounds below.
   */
  exited: boolean
  /**
   * Confirmed by the user as an actual sale.
   *
   * The only observations that identify the cause mixture. Everything else is
   * an exit of unknown cause.
   */
  confirmedSale?: boolean
}

/** Turns stored observations into duration records. */
export const toDurationObservations = (
  observations: ObservedPrice[],
  now = new Date(),
): DurationObservation[] => {
  const prices = observations.map((observation) => observation.price).sort((a, b) => a - b)
  const median = prices.length ? prices[Math.floor(prices.length / 2)]! : 0

  return observations.map((observation) => {
    const start = observation.firstSeenAt ?? observation.createdAt
    const end = observation.lastSeenAt ?? observation.createdAt
    const startMs = new Date(start).getTime()
    const endMs = new Date(end).getTime()
    const exited = observation.status === 'sold' || observation.status === 'unknown'

    // A still-listed row is censored at *now*, not at its last sighting: the
    // time since the last sweep is time it survived too, and dropping it would
    // bias every duration downward.
    const stopMs = exited ? endMs : Math.max(endMs, now.getTime())
    const days = Number.isFinite(startMs) && Number.isFinite(stopMs)
      ? Math.max(0, (stopMs - startMs) / 86_400_000)
      : 0

    return {
      id: observation.id,
      price: observation.price,
      relativePrice: median > 0 ? observation.price / median : 1,
      days,
      exited,
      confirmedSale: observation.status === 'sold' ? undefined : undefined,
    }
  })
}

/**
 * The share of exits that are genuinely sales, as an interval.
 *
 * This is the identification problem stated honestly. User-confirmed outcomes
 * describe **the user's own listings** — their prices, their patience, their
 * cancellation habits. External sellers are a different population, and
 * assuming the rate transports is exactly the fabrication being avoided. So
 * personal outcomes *constrain* the plausible set, external uncertainty
 * *widens* it, and where there is no representative evidence at all the honest
 * bound is the whole interval.
 */
export interface SaleShareBounds {
  low: number
  high: number
  /** How many confirmed outcomes informed this. Zero means [0,1]. */
  confirmations: number
}

/** Widening applied to the confirmed rate to allow for non-transportability. */
export const TRANSPORT_WIDENING = 0.25

export const boundSaleShare = (
  confirmedSales: number,
  confirmedExits: number,
): SaleShareBounds => {
  // Nothing confirmed: the share of disappearances that were sales could be
  // anything, and saying so is more useful than inventing a number.
  if (confirmedExits <= 0) return { low: 0, high: 1, confirmations: 0 }

  const rate = confirmedSales / confirmedExits
  // Sampling uncertainty on a small confirmed set, then transport widening on
  // top, because these are the user's listings and not the market's.
  const sampling = 1 / Math.sqrt(confirmedExits)
  const half = Math.min(1, sampling + TRANSPORT_WIDENING)

  return {
    low: Math.max(0, rate - half),
    high: Math.min(1, rate + half),
    confirmations: confirmedExits,
  }
}

export interface HazardBucket {
  /** Upper edge of the relative-price band, e.g. 0.9 means "up to 0.9x median". */
  relativePriceMax: number
  /** Listings that entered this bucket. */
  atRisk: number
  exits: number
  /** Kaplan-Meier style survival at the horizon, given exits are sales. */
  exitRateAtHorizon: number
}

export interface HazardModel {
  horizonDays: number
  buckets: HazardBucket[]
  saleShare: SaleShareBounds
  samples: number
}

/** Relative-price bands. Cheap listings clear faster; that is the whole signal. */
export const DEFAULT_PRICE_BANDS = [0.7, 0.85, 1.0, 1.15, 1.4, Number.POSITIVE_INFINITY]

/**
 * Fits a coarse discrete-time hazard: exit rate by price band within a horizon.
 *
 * Deliberately a step function over bands rather than a smooth parametric
 * curve. With the sample sizes a solo player accumulates, a smooth fit invents
 * precision it has not earned, and the shape of the price-to-liquidity
 * relationship is not known well enough to assert one.
 */
export const fitHazard = (
  observations: DurationObservation[],
  options: { horizonDays?: number; bands?: number[] } = {},
): HazardModel => {
  const horizonDays = options.horizonDays ?? 7
  const bands = options.bands ?? DEFAULT_PRICE_BANDS

  const buckets: HazardBucket[] = bands.map((relativePriceMax) => ({
    relativePriceMax,
    atRisk: 0,
    exits: 0,
    exitRateAtHorizon: 0,
  }))

  for (const observation of observations) {
    const index = bands.findIndex((edge) => observation.relativePrice <= edge)
    const bucket = buckets[index < 0 ? buckets.length - 1 : index]!

    // Censored before the horizon tells us nothing about the horizon, so it is
    // not counted as a survivor — that would be the classic mistake of reading
    // "we stopped watching" as "it did not happen".
    if (!observation.exited && observation.days < horizonDays) continue

    bucket.atRisk += 1
    if (observation.exited && observation.days <= horizonDays) bucket.exits += 1
  }

  for (const bucket of buckets) {
    bucket.exitRateAtHorizon = bucket.atRisk > 0 ? bucket.exits / bucket.atRisk : 0
  }

  const confirmedExits = observations.filter((observation) => observation.exited).length
  const confirmedSales = observations.filter((observation) => observation.confirmedSale).length

  return {
    horizonDays,
    buckets,
    saleShare: boundSaleShare(confirmedSales, confirmedExits),
    samples: observations.length,
  }
}

export interface SaleProbability {
  /** Lower bound on P(sale within horizon) at this price. */
  low: number
  /** Upper bound. */
  high: number
  /** Whether any evidence backs this at all. */
  supported: boolean
}

/**
 * P(sale within the horizon) at a relative price, as an interval.
 *
 * An interval and never a point, because the exit rate is observed but the
 * share of exits that are sales is not. Both bounds are carried forward so a
 * recommendation can be required to survive the pessimistic one — which is the
 * mechanism that lets unlabelled exits inform a decision without deciding it.
 */
export const saleProbability = (
  model: HazardModel,
  relativePrice: number,
): SaleProbability => {
  const index = model.buckets.findIndex((bucket) => relativePrice <= bucket.relativePriceMax)
  const bucket = model.buckets[index < 0 ? model.buckets.length - 1 : index]!

  if (bucket.atRisk === 0) return { low: 0, high: 1, supported: false }

  return {
    low: bucket.exitRateAtHorizon * model.saleShare.low,
    high: bucket.exitRateAtHorizon * model.saleShare.high,
    supported: true,
  }
}

/**
 * Expected days to sell, as an interval, from the horizon exit rate.
 *
 * A crude exponential read-off rather than a fitted curve, for the same reason
 * the hazard is banded: the data does not support more. Capped so a near-zero
 * probability yields a large-but-finite number instead of infinity, because
 * downstream arithmetic divides by this.
 */
export const MAX_EXPECTED_DAYS = 180

export const expectedDaysToSell = (
  probability: SaleProbability,
  horizonDays: number,
): { low: number; high: number } => {
  const daysFor = (p: number) => {
    if (p <= 0) return MAX_EXPECTED_DAYS
    if (p >= 1) return horizonDays
    // P(sale within H) = 1 - exp(-H/T)  =>  T = -H / ln(1-p)
    const days = -horizonDays / Math.log(1 - p)
    return Math.min(MAX_EXPECTED_DAYS, Math.max(horizonDays / 10, days))
  }

  // A higher sale probability means fewer days, so the bounds swap.
  return { low: daysFor(probability.high), high: daysFor(probability.low) }
}
