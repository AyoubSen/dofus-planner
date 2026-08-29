// Telling apart what sold from what merely sat there.
//
// Every price on the page starts life as an *ask*. Asks are not evidence of
// value — a listing 40% over the going rate can sit for a week and still drag
// the model upward. The only way to learn the real clearing price without a
// server-side price history is to look at the same item twice and see what
// disappeared. That is what this module does.

import type { ObservationStatus, ObservedPrice } from './types'

/**
 * Identity of a roll, independent of its price. Two listings with the same
 * signature are the same product, so one vanishing and another appearing at a
 * different price is a relist, not a sale.
 */
export const statSignature = (observation: Pick<ObservedPrice, 'statsEntries'>): string =>
  (observation.statsEntries || [])
    .filter((entry) => entry.value !== null && entry.value !== undefined)
    .map((entry) => `${entry.key}:${entry.value}`)
    .sort()
    .join('|')

/** Identity of a specific listing: the roll at the price it is offered at. */
export const listingSignature = (
  observation: Pick<ObservedPrice, 'statsEntries' | 'price'>,
): string => `${statSignature(observation)}@${observation.price}`

const median = (values: number[]): number => {
  if (!values.length) return 0
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

export interface ReconcileOptions {
  /**
   * Whether the capture covers every listing for this item.
   *
   * This matters enormously: a screenshot of one page of the HDV is a partial
   * view, and treating everything absent from it as sold would invent sales
   * wholesale. Disappearance is only interpreted when the caller confirms the
   * capture was a full sweep.
   */
  fullSweep?: boolean
  now?: string
}

export interface ReconcileResult {
  observations: ObservedPrice[]
  added: number
  stillListed: number
  markedSold: number
  markedRelisted: number
}

const isOnMarket = (status: ObservationStatus | undefined) =>
  status === 'listed' || status === 'unknown' || status === undefined

/**
 * Folds a fresh capture into the stored observations for one item.
 *
 * - seen again            → `listed`, timestamp bumped
 * - gone, was priced at or under the median ask → `sold`
 * - gone, was priced above it, and the same roll is back at a new price
 *                         → `relisted` (proof it did *not* clear at the old price)
 *
 * A listing that vanishes from an expensive perch without reappearing is left
 * `unknown` rather than counted as a sale — it may just have been pulled.
 */
export const reconcileObservations = (
  stored: ObservedPrice[],
  captured: ObservedPrice[],
  options: ReconcileOptions = {},
): ReconcileResult => {
  const now = options.now ?? new Date().toISOString()
  const result: ObservedPrice[] = []
  let added = 0
  let stillListed = 0
  let markedSold = 0
  let markedRelisted = 0

  // Listings are a multiset, not a set.
  //
  // Two sellers can list the same roll at the same price, and that is not a
  // duplicate — it is two units of supply. Keying stored listings by signature
  // in a plain Map made the second overwrite the first, so market depth was
  // undercounted, and a sweep showing one of the two remaining looked like
  // "still listed" rather than "one of them went". Each occurrence is now held
  // and consumed individually.
  const storedByListing = new Map<string, ObservedPrice[]>()
  const storedByStats = new Map<string, ObservedPrice[]>()
  for (const observation of stored) {
    const listingKey = listingSignature(observation)
    const listingBucket = storedByListing.get(listingKey)
    if (listingBucket) listingBucket.push(observation)
    else storedByListing.set(listingKey, [observation])

    const key = statSignature(observation)
    const bucket = storedByStats.get(key)
    if (bucket) bucket.push(observation)
    else storedByStats.set(key, [observation])
  }

  const capturedListings = new Set(captured.map((observation) => listingSignature(observation)))
  const capturedStats = new Set(captured.map((observation) => statSignature(observation)))
  const seen = new Set<string>()
  const relisted = new Set<string>()

  // Anything the capture still shows is on the market, whatever we thought.
  for (const capture of captured) {
    const listingKey = listingSignature(capture)
    // Take one occurrence per captured row. Three stored at this price and two
    // captured means two are still up and one is gone — which is exactly the
    // arithmetic a Set destroyed.
    const bucket = storedByListing.get(listingKey)
    const existing = bucket?.shift()

    if (existing) {
      seen.add(existing.id)
      stillListed += 1
      result.push({
        ...existing,
        status: 'listed',
        lastSeenAt: now,
        firstSeenAt: existing.firstSeenAt ?? existing.createdAt,
        signatureHash: listingKey,
      })
      continue
    }

    // Same roll, new price: whatever it was asking before did not clear.
    //
    // Only when the roll is actually known. A price-only capture has an empty
    // signature, and treating every statless listing as "the same roll" would
    // manufacture relists out of unrelated listings.
    const captureStats = statSignature(capture)
    for (const sibling of (captureStats ? storedByStats.get(captureStats) : undefined) || []) {
      // A sibling already matched to a row in this capture is demonstrably
      // still up, so it cannot also be something that was relisted.
      if (seen.has(sibling.id)) continue
      if (!capturedListings.has(listingSignature(sibling)) && isOnMarket(sibling.status)) {
        relisted.add(sibling.id)
      }
    }

    added += 1
    result.push({
      ...capture,
      status: 'listed',
      firstSeenAt: capture.firstSeenAt ?? capture.createdAt ?? now,
      lastSeenAt: now,
      signatureHash: listingKey,
    })
  }

  const askMedian = median(stored.map((observation) => observation.price))

  for (const observation of stored) {
    if (seen.has(observation.id)) continue

    if (relisted.has(observation.id)) {
      markedRelisted += 1
      result.push({ ...observation, status: 'relisted', lastSeenAt: observation.lastSeenAt ?? now })
      continue
    }

    if (!options.fullSweep || !isOnMarket(observation.status)) {
      result.push(observation)
      continue
    }

    // Gone from a full sweep. Cheap listings clear; dear ones more often get
    // pulled or relisted, so only the cheap side is counted as a sale.
    const storedStats = statSignature(observation)
    const rollReappeared = Boolean(storedStats) && capturedStats.has(storedStats)
    const cleared = observation.price <= askMedian && !rollReappeared
    if (cleared) {
      markedSold += 1
      result.push({ ...observation, status: 'sold', lastSeenAt: observation.lastSeenAt ?? now })
    } else {
      result.push({ ...observation, status: 'unknown' })
    }
  }

  return { observations: result, added, stillListed, markedSold, markedRelisted }
}

/** Days a listing has been on the market — the liquidity signal. */
export const daysOnMarket = (
  observation: Pick<ObservedPrice, 'firstSeenAt' | 'lastSeenAt' | 'createdAt'>,
  now = new Date(),
): number | null => {
  const start = observation.firstSeenAt ?? observation.createdAt
  const end = observation.lastSeenAt
  if (!start || !end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(ms) || ms < 0) return null
  return ms / 86_400_000
}

/** Brings a v1 row up to the v2 shape without inventing any market history. */
export const migrateObservation = (observation: ObservedPrice): ObservedPrice => ({
  ...observation,
  status: observation.status ?? 'unknown',
  firstSeenAt: observation.firstSeenAt ?? observation.createdAt,
  lastSeenAt: observation.lastSeenAt ?? observation.createdAt,
  signatureHash: observation.signatureHash ?? listingSignature(observation),
})
