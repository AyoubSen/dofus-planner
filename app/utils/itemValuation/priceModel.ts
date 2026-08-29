// What a listing will actually resell for, and what you net on the flip.
//
// The old model priced by `score × median(peerPrice / peerScore)` — a straight
// line through the origin. That is the wrong shape twice over: it hands a junk
// roll the price-per-point of the good rolls (false "underpriced" flags, wasted
// attention), and it caps a great roll at the same rate (missed edge). Real HDV
// prices climb steeply toward the top of the roll range, so the curve here is
// convex, and it is fitted from the listings rather than assumed.

import type { ScoredObservation } from './segments'

/** Default exponent when there isn't enough data to fit one. */
export const DEFAULT_KAPPA = 2.5
export const MIN_KAPPA = 1.2
export const MAX_KAPPA = 5
/** Samples needed before the exponent is fitted rather than assumed. */
export const MIN_SAMPLES_FOR_FIT = 4
/** Samples below which no valuation is offered at all. */
export const MIN_SAMPLES_FOR_VALUATION = 3

/** Sale tax the HDV takes off the seller, as a fraction. */
export const DEFAULT_HDV_TAX = 0.02

/** Net margin below which a flip isn't worth the click, as a fraction. */
export const DEFAULT_MIN_MARGIN = 0.15

export interface PriceModelConfig {
  hdvTaxRate: number
  minMargin: number
}

export const defaultPriceModelConfig = (): PriceModelConfig => ({
  hdvTaxRate: DEFAULT_HDV_TAX,
  minMargin: DEFAULT_MIN_MARGIN,
})

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/** Linear-interpolated percentile, on a copy of the input. */
export const percentile = (values: number[], p: number): number => {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b)
  if (!sorted.length) return 0
  if (sorted.length === 1) return sorted[0]!
  const position = clamp(p, 0, 1) * (sorted.length - 1)
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower]!
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (position - lower)
}

export const median = (values: number[]): number => percentile(values, 0.5)

/**
 * Theil–Sen slope: the median of the slopes of every pair of points.
 *
 * Chosen over least squares because HDV data is full of nonsense — one listing
 * at ten times the going rate, one at a tenth. Least squares chases those;
 * Theil–Sen ignores anything short of half the sample being wrong.
 */
/**
 * Quality gap below which a pair says nothing about the slope.
 *
 * Two listings of nearly identical quality divide by nearly zero, so their
 * pairwise slope explodes. Enough such pairs and the fitted exponent pins to its
 * ceiling, which is how an item surrounded by 2.7M-4.3M listings was valued at
 * 8M: not a steep market, just an unstable fit.
 */
export const MIN_SLOPE_GAP = 0.02

export const theilSenSlope = (points: Array<{ x: number; y: number }>): number | null => {
  const slopes: number[] = []
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const dx = points[j]!.x - points[i]!.x
      if (Math.abs(dx) < MIN_SLOPE_GAP) continue
      const slope = (points[j]!.y - points[i]!.y) / dx
      if (Number.isFinite(slope)) slopes.push(slope)
    }
  }
  if (!slopes.length) return null
  return median(slopes)
}

/** Matching robust intercept: the median residual once the slope is fixed. */
export const theilSenIntercept = (
  points: Array<{ x: number; y: number }>,
  slope: number,
): number => median(points.map((point) => point.y - slope * point.x))

export interface PriceCurve {
  kind: 'fitted' | 'anchored'
  /** Convexity exponent: how much faster price climbs than quality. */
  kappa: number
  /** Log-space intercept. Only meaningful for a fitted curve. */
  intercept: number
  /** Weak-roll anchor. Only meaningful for an anchored curve. */
  base: number
  /** Strong-roll anchor. Only meaningful for an anchored curve. */
  ceiling: number
  sampleCount: number
  /** How many of the samples were confirmed sales rather than open asks. */
  clearedCount: number
  /** Cheapest and dearest price the curve was fitted on. */
  sampleMin: number
  sampleMax: number
  /**
   * Typical scatter around the curve, as a median absolute deviation in log
   * space. This is the noise floor: half the segment sits below the curve by
   * construction, so a listing only counts as cheap once it is cheap by more
   * than the market's ordinary spread.
   */
  residualMad: number
}

/** A price sample, tagged with whether it is a confirmed sale or just an ask. */
export interface PriceSample {
  quality: number
  price: number
  cleared: boolean
}

export const sampleFromObservation = (
  observation: ScoredObservation & { status?: string },
): PriceSample => ({
  quality: observation.quality,
  price: observation.price,
  cleared: observation.status === 'sold',
})

/**
 * Builds the price curve for one segment.
 *
 * Confirmed sales are used exclusively once there are enough of them: an asking
 * price nobody paid is not evidence of value, and mixing the two lets stubborn
 * listings drag the curve upward forever.
 */
export const fitPriceCurve = (samples: PriceSample[]): PriceCurve | null => {
  const usable = samples.filter(
    (sample) => Number.isFinite(sample.price) && sample.price > 0 && sample.quality > 0,
  )
  const cleared = usable.filter((sample) => sample.cleared)
  const population = cleared.length >= MIN_SAMPLES_FOR_VALUATION ? cleared : usable

  if (population.length < MIN_SAMPLES_FOR_VALUATION) return null

  const prices = population.map((sample) => sample.price)

  const anchors = {
    base: percentile(prices, 0.25),
    ceiling: percentile(prices, 0.9),
    sampleCount: population.length,
    clearedCount: cleared.length,
    sampleMin: Math.min(...prices),
    sampleMax: Math.max(...prices),
    residualMad: 0,
  }

  let curve: PriceCurve = {
    kind: 'anchored',
    kappa: DEFAULT_KAPPA,
    intercept: 0,
    ...anchors,
  }

  if (population.length >= MIN_SAMPLES_FOR_FIT) {
    const points = population.map((sample) => ({
      x: Math.log(sample.quality),
      y: Math.log(sample.price),
    }))
    const slope = theilSenSlope(points)
    if (slope !== null && Number.isFinite(slope)) {
      const kappa = clamp(slope, MIN_KAPPA, MAX_KAPPA)
      curve = {
        kind: 'fitted',
        kappa,
        intercept: theilSenIntercept(points, kappa),
        ...anchors,
      }
    }
  }

  return { ...curve, residualMad: residualMad(curve, population) }
}

/** Median absolute log-residual of the samples about the fitted curve. */
const residualMad = (curve: PriceCurve, samples: PriceSample[]): number => {
  const residuals = samples
    .map((sample) => {
      const predicted = predictPrice(curve, sample.quality)
      if (predicted <= 0) return null
      return Math.abs(Math.log(sample.price / predicted))
    })
    .filter((value): value is number => value !== null && Number.isFinite(value))
  return residuals.length ? median(residuals) : 0
}

/**
 * Price the curve predicts for a given roll quality.
 *
 * The anchored form interpolates between what a weak roll goes for and what a
 * strong one goes for — both read off the data, so the bottom of the curve is
 * a price someone actually paid rather than an extrapolation toward zero.
 */
/**
 * How far past the dearest observed listing a prediction may go.
 *
 * An item better than anything currently listed can be worth more than all of
 * them — but not without evidence, and not by multiples. Extrapolating a fitted
 * curve unchecked produced a fair value of 8M for an item whose entire market
 * sat between 2.7M and 4.3M, and that inflated number then read as a bargain.
 */
export const MAX_EXTRAPOLATION = 1.4
export const MIN_EXTRAPOLATION = 0.5

export const predictPrice = (curve: PriceCurve, quality: number): number => {
  const safeQuality = Math.max(quality, 1e-6)

  const raw = curve.kind === 'fitted'
    ? Math.exp(curve.intercept + curve.kappa * Math.log(safeQuality))
    : curve.base + Math.max(0, curve.ceiling - curve.base)
      * Math.pow(Math.min(safeQuality, 1), curve.kappa)

  // Held to the range the market actually showed. Without this the model is
  // free to invent a price nobody has ever paid or asked.
  const floor = curve.sampleMin * MIN_EXTRAPOLATION
  const cap = curve.sampleMax * MAX_EXTRAPOLATION

  return Math.round(Math.min(Math.max(raw, floor), cap))
}

/** Undercut by one above 1k — the same listing psychology the page always used. */
export const roundRelistPrice = (value: number): number => {
  const rounded = Math.max(0, Math.round(value))
  return rounded <= 1000 ? rounded : rounded - 1
}

/**
 * How far above fair value a greedy ask sits.
 *
 * Enough to be a distinct choice from fair — the point of offering three
 * targets is that they are three different bets.
 */
export const GREEDY_PREMIUM = 1.08

export interface RelistTargets {
  quickRelist: number
  fairRelist: number
  greedyRelist: number
}

/**
 * Three exit prices: undercut the cheapest listing above you, sit at fair
 * value, or lean on the top of the segment.
 */
export const buildRelistTargets = (
  buyPrice: number,
  fairValue: number,
  peerPrices: number[],
): RelistTargets => {
  const higherPeers = peerPrices.filter((price) => price > buyPrice).sort((a, b) => a - b)
  const nearestHigherPeer = higherPeers[0]
  const highestPeer = peerPrices.slice().sort((a, b) => b - a)[0]

  // Round first, then take the maxima. Rounding afterwards would shave the
  // undercut off an already-undercut number and let greedy land below fair.
  const fairRelist = Math.max(roundRelistPrice(fairValue), buyPrice)

  // Undercut the cheapest listing above you, but never ask more than the item
  // is worth. Undercutting alone put quick *above* fair on ten of seventeen
  // listings in a real capture — asking over fair value is the one thing that
  // guarantees a listing sits, which is the opposite of a quick sale.
  const quickRelist = nearestHigherPeer
    ? Math.min(roundRelistPrice(nearestHigherPeer), fairRelist)
    : Math.max(roundRelistPrice(fairValue * 0.98), buyPrice)

  // Greedy means the top of the market, not "a hair above the next listing".
  // Undercutting the nearest higher peer is what quick already does, and since
  // greedy could never drop below fair it simply collapsed onto it whenever
  // fair sat above that peer — leaving two identical numbers and no third
  // option. Anchored to the dearest listing, and always meaningfully above fair.
  const topOfMarket = peerPrices.length ? Math.max(...peerPrices) : 0
  const greedyRelist = Math.max(
    roundRelistPrice(Math.max(topOfMarket, fairValue * GREEDY_PREMIUM)),
    roundRelistPrice(fairRelist * GREEDY_PREMIUM),
  )

  return { quickRelist, fairRelist, greedyRelist }
}

/** What lands in your pocket after the HDV takes its cut. */
export const netProceeds = (salePrice: number, config: PriceModelConfig): number =>
  Math.round(salePrice * (1 - config.hdvTaxRate))

export const netProfit = (
  buyPrice: number,
  salePrice: number,
  config: PriceModelConfig,
): number => netProceeds(salePrice, config) - buyPrice

export interface ListingValuation {
  fairValue: number
  /** Net of tax, at the fair relist price. The headline number. */
  netAtFair: number
  netAtQuick: number
  netAtGreedy: number
  /** Net profit as a fraction of what you'd tie up buying it. */
  marginPercent: number
  relists: RelistTargets
  curve: PriceCurve
  /**
   * How far below the curve this listing sits, in units of the segment's own
   * scatter. Above 1 means it is cheap by more than the market's ordinary
   * noise — that, not a positive delta, is what makes a deal worth chasing.
   */
  edgeRatio: number
  /** True only when the margin clears both the noise floor and `minMargin`. */
  isDeal: boolean
}

/**
 * Values one listing against its segment's curve.
 *
 * Everything downstream ranks on `netAtFair` rather than on a raw price delta,
 * because the question being asked is "what do I make on this flip", and a
 * delta that ignores the sale tax is not that number.
 */
export const valueListing = (
  listing: { price: number; quality: number },
  curve: PriceCurve,
  peerPrices: number[],
  config: PriceModelConfig = defaultPriceModelConfig(),
): ListingValuation => {
  const fairValue = predictPrice(curve, listing.quality)
  const relists = buildRelistTargets(listing.price, fairValue, peerPrices)
  const netAtFair = netProfit(listing.price, relists.fairRelist, config)
  const marginPercent = listing.price > 0 ? (netAtFair / listing.price) * 100 : 0

  // How cheap it is relative to how noisy this segment is. A segment where
  // everything is scattered 40% either side of the curve has to give up a lot
  // more before one listing is genuinely mispriced rather than merely low.
  const noiseFloor = Math.max(curve.residualMad, Math.log(1 + config.minMargin))
  const discount = listing.price > 0 && fairValue > 0
    ? Math.log(fairValue / listing.price)
    : 0
  const edgeRatio = noiseFloor > 0 ? discount / noiseFloor : 0

  return {
    fairValue,
    netAtFair,
    netAtQuick: netProfit(listing.price, relists.quickRelist, config),
    netAtGreedy: netProfit(listing.price, relists.greedyRelist, config),
    marginPercent,
    relists,
    curve,
    edgeRatio,
    isDeal: edgeRatio >= 1 && marginPercent >= config.minMargin * 100,
  }
}
