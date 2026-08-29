// Peer selection: compare like with like.
//
// The old model picked peers by raw score proximity, which let structurally
// different items price each other — a mage'd PA copy and a raw one land on
// similar totals by completely different routes. Here a listing only ever
// compares against listings with the same market identity: the same set of
// special/mage stats, on the same side of the user's requirement gate.

import { specialMageStatKeys } from '../itemStats'
import type { LineQuality } from './types'

/** A listing after quality scoring, which is what peer matching works on. */
export interface ScoredObservation {
  id: string
  price: number
  quality: number
  lines: LineQuality[]
  requirementsPassed: boolean
}

/**
 * The listing's market identity: which special/mage stats it carries, plus
 * which side of the gate it sits on. Ignored stats are already absent from
 * `lines`, so a stat the user doesn't care about can't split the segment.
 */
export const segmentSignature = (observation: ScoredObservation): string => {
  const specials = observation.lines
    .filter((line) => line.present && specialMageStatKeys.has(line.statKey))
    .map((line) => line.statKey)
    .sort()

  // An exo is a different product, not a better roll of the same one, so it
  // gets its own segment rather than being priced against plain copies.
  const exos = observation.lines
    .filter((line) => line.present && line.isExo)
    .map((line) => line.statKey)
    .sort()

  return [
    observation.requirementsPassed ? 'pass' : 'fail',
    specials.join('+') || 'plain',
    exos.length ? `exo:${exos.join('+')}` : 'noexo',
  ].join('|')
}

const lineMap = (observation: ScoredObservation) => {
  const map = new Map<string, LineQuality>()
  for (const line of observation.lines) {
    if (line.present && line.weight > 0) map.set(line.statKey, line)
  }
  return map
}

export interface ComparableDistance {
  distance: number
  overlapRatio: number
  comparableCount: number
}

/**
 * Weighted difference in per-line quality between two listings.
 *
 * Carried over from the previous comparables model, which got this part right:
 * a stat present on one side and absent on the other is a real difference, and
 * costs double when it is a special/mage stat because those define the item.
 */
export const comparableDistance = (
  target: ScoredObservation,
  peer: ScoredObservation,
): ComparableDistance => {
  const targetLines = lineMap(target)
  const peerLines = lineMap(peer)
  const keys = new Set([...targetLines.keys(), ...peerLines.keys()])

  if (!keys.size) {
    return { distance: Number.POSITIVE_INFINITY, overlapRatio: 0, comparableCount: 0 }
  }

  let weightedDistance = 0
  let totalWeight = 0
  let overlapCount = 0

  for (const key of keys) {
    const targetLine = targetLines.get(key)
    const peerLine = peerLines.get(key)
    const weight = targetLine?.weight ?? peerLine?.weight ?? 0
    if (weight <= 0) continue

    if (!targetLine || !peerLine) {
      weightedDistance += weight * (specialMageStatKeys.has(key) ? 2 : 1.15)
      totalWeight += weight
      continue
    }

    overlapCount += 1
    totalWeight += weight
    weightedDistance += Math.abs(targetLine.qEff - peerLine.qEff) * weight
  }

  if (totalWeight <= 0) {
    return { distance: Number.POSITIVE_INFINITY, overlapRatio: 0, comparableCount: 0 }
  }

  const overlapRatio = overlapCount / keys.size
  const coveragePenalty = overlapRatio < 0.5 ? (0.5 - overlapRatio) * 1.5 : 0

  return {
    distance: weightedDistance / totalWeight + coveragePenalty,
    overlapRatio,
    comparableCount: overlapCount,
  }
}

/** How the peer set was found — drives how much the valuation is trusted. */
export type PeerScope = 'exact-segment' | 'same-gate' | 'all-passing' | 'none'

export interface PeerSelection {
  peers: ScoredObservation[]
  scope: PeerScope
  medianDistance: number
  /** Multiplier applied to the valuation's confidence for a loosened scope. */
  confidencePenalty: number
}

const MIN_PEERS = 3

const median = (values: number[]): number => {
  if (!values.length) return 0
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

/**
 * Finds comparables for one listing, loosening the net only as far as needed
 * and never silently: each fallback step carries an explicit confidence cost,
 * and crossing the requirement gate is not something the model does at all.
 */
export const selectPeers = (
  target: ScoredObservation,
  population: ScoredObservation[],
  options: { maxPeers?: number } = {},
): PeerSelection => {
  const maxPeers = options.maxPeers ?? 5
  const others = population.filter((candidate) => candidate.id !== target.id)
  const targetSignature = segmentSignature(target)

  const tiers: Array<{ scope: PeerScope; pool: ScoredObservation[]; penalty: number }> = [
    {
      scope: 'exact-segment',
      pool: others.filter((candidate) => segmentSignature(candidate) === targetSignature),
      penalty: 0,
    },
    {
      scope: 'same-gate',
      pool: others.filter((candidate) => candidate.requirementsPassed === target.requirementsPassed),
      penalty: 1,
    },
  ]

  // The last resort still respects the gate for a qualifying item: a listing
  // that fails the user's requirements is a different product and must never
  // set the price of one that meets them.
  if (target.requirementsPassed) {
    tiers.push({
      scope: 'all-passing',
      pool: others.filter((candidate) => candidate.requirementsPassed),
      penalty: 2,
    })
  }

  for (const tier of tiers) {
    if (tier.pool.length < MIN_PEERS) continue
    const comparable = tier.pool
      .map((candidate) => ({ candidate, ...comparableDistance(target, candidate) }))
      .filter((entry) => Number.isFinite(entry.distance))
      .sort((a, b) => a.distance - b.distance)

    // The floor applies to how many comparables exist, not to how many the
    // caller asked to keep — `maxPeers` is a display/weighting choice.
    if (comparable.length < MIN_PEERS) continue
    const ranked = comparable.slice(0, maxPeers)

    return {
      peers: ranked.map((entry) => entry.candidate),
      scope: tier.scope,
      medianDistance: median(ranked.map((entry) => entry.distance)),
      confidencePenalty: tier.penalty,
    }
  }

  return { peers: [], scope: 'none', medianDistance: Number.POSITIVE_INFINITY, confidencePenalty: 3 }
}

/** Groups a population into its market segments, for the item summary line. */
export const groupBySegment = (
  population: ScoredObservation[],
): Map<string, ScoredObservation[]> => {
  const groups = new Map<string, ScoredObservation[]>()
  for (const observation of population) {
    const signature = segmentSignature(observation)
    const bucket = groups.get(signature)
    if (bucket) bucket.push(observation)
    else groups.set(signature, [observation])
  }
  return groups
}
