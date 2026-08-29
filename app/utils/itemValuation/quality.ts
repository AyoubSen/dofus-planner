// Roll quality, measured as distance from the line's maximum.
//
// The old model scored a line by its linear position in the range, which meant
// 34/40 and 40/40 differed by a rounding error. The market doesn't work that
// way: the last few points of a stat carry most of the price. So quality here
// is convex, and the top of the range gets explicit step bonuses that match how
// a player reads a tooltip — "max", "one off max", "meh".

import type {
  ExpectedLine,
  ItemQuality,
  LineQuality,
  ObservationStatEntry,
  ObservedPrice,
  QualityTier,
  StatPriority,
} from './types'
import { baseStatWeight, priorityMultiplier } from './statWeights'

/** Exponent on the raw range position. >1 makes the top of the range count more. */
export const QUALITY_EXPONENT = 1.6
export const NEAR_MAX_BONUS = 0.1
export const MAX_BONUS = 0.2

/**
 * Lift an exo of the heaviest stat gives, as a fraction of the base roll.
 *
 * Scaled by the stat's own weight, so an exo PA lifts by the full amount and an
 * exo Vitalité by a fraction of it. The lift multiplies the base roll rather
 * than adding to it: an exo says "this item is special", and an item that gave
 * up 15 Force to get one is not special, it is just different.
 */
export const EXO_UNIT = 0.35

/** Lift from a line rolled a full range above its maximum. */
export const OVER_UNIT = 0.25

/** The heaviest stat in the catalogue, used to scale an exo's lift. */
const MAX_STAT_WEIGHT = 4

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/** Pulls `{min,max}` out of a `[11 à 20]` / `[6]` tooltip fragment. */
export const parseObservationRange = (rangeText: string | null | undefined) => {
  const numbers = String(rangeText ?? '').match(/-?\d+/g)?.map(Number) || []
  if (!numbers.length) return null
  if (numbers.length === 1) return { min: numbers[0]!, max: numbers[0]! }
  return {
    min: Math.min(numbers[0]!, numbers[1]!),
    max: Math.max(numbers[0]!, numbers[1]!),
  }
}

/**
 * How far below max still reads as "near max" for a line of this width.
 *
 * Scaled rather than flat, because a flat 5 would call 15/20 damage near-max
 * (it isn't) while being meaningless on a 1-point PA line. 15% of the span,
 * capped at 5, lands where a player's intuition does: -1 on a 11-20 damage
 * line, -4 on a 51-80 vitality line, exact match on PA/PM/PO.
 */
export const toleranceForSpan = (span: number): number => {
  if (span <= 0) return 0
  return clamp(Math.round(span * 0.15), 1, 5)
}

/** The tighter tolerance a `critical` line has to satisfy. */
export const criticalTolerance = (span: number): number => {
  const base = toleranceForSpan(span)
  if (base <= 0) return 0
  return Math.max(1, Math.floor(base / 2))
}

/** Lowest rolled value that still satisfies the given priority on this line. */
export const requiredValueFor = (
  line: Pick<ExpectedLine, 'min' | 'max'>,
  priority: StatPriority,
): number => {
  const span = Math.max(0, line.max - line.min)
  if (priority === 'critical') return line.max - criticalTolerance(span)
  if (priority === 'high') return line.max - toleranceForSpan(span)
  return line.min
}

export const tierFor = (value: number, min: number, max: number): QualityTier => {
  const span = Math.max(0, max - min)
  const deficit = max - value
  if (deficit <= 0) return 'max'
  if (span <= 0) return 'low'
  if (deficit <= toleranceForSpan(span)) return 'near-max'
  const q = clamp((value - min) / span, 0, 1)
  if (q >= 0.6) return 'good'
  if (q >= 0.3) return 'mid'
  return 'low'
}

export interface LineQualityInput {
  statKey: string
  label: string
  value: number | null
  min: number
  max: number
  priority: StatPriority
  /** True when the item cannot normally roll this stat at all. */
  isExo?: boolean
}

export const computeLineQuality = (input: LineQualityInput): LineQuality => {
  const { statKey, label, value, min, max, priority } = input
  const isExo = Boolean(input.isExo)
  const span = Math.max(0, max - min)
  const weight = baseStatWeight(statKey) * priorityMultiplier(priority)
  const present = value !== null && value !== undefined

  if (!present) {
    return {
      statKey,
      label,
      value: null,
      min,
      max,
      span,
      deficit: max,
      q: 0,
      qEff: 0,
      tier: 'absent',
      tolerance: toleranceForSpan(span),
      priority,
      weight,
      contribution: 0,
      overmageAmount: 0,
      present: false,
      isExo,
    }
  }

  const rolled = value as number
  const q = span > 0 ? clamp((rolled - min) / span, 0, 1) : rolled >= max ? 1 : 0
  const tier = tierFor(rolled, min, max)
  const overmageAmount = rolled > max ? rolled - max : 0
  // Overmage is intentionally uncapped: an exo/overmaged line is a different
  // product and should be able to push quality past a perfect natural roll.
  const overmage = overmageAmount > 0 ? overmageAmount / Math.max(span, 1) : 0
  const qEff = Math.pow(q, QUALITY_EXPONENT)
    + (tier === 'near-max' ? NEAR_MAX_BONUS : 0)
    + (tier === 'max' ? MAX_BONUS : 0)
    + overmage

  return {
    statKey,
    label,
    value: rolled,
    min,
    max,
    span,
    deficit: max - rolled,
    q,
    qEff,
    tier,
    tolerance: toleranceForSpan(span),
    priority,
    weight,
    contribution: qEff * weight,
    overmageAmount,
    present: true,
    isExo,
  }
}

/**
 * Bounds for a stat line: the item's official effect range when we know it,
 * otherwise whatever the tooltip text on the listing itself carried.
 */
const boundsFor = (
  statKey: string,
  entry: ObservationStatEntry | undefined,
  expected: ExpectedLine | undefined,
) => {
  if (expected) return { min: expected.min, max: expected.max }
  const parsed = parseObservationRange(entry?.rangeText)
  if (parsed) return parsed
  return null
}

export interface ItemQualityOptions {
  /** Official lines for the item, from DofusDB. Drives bounds and completeness. */
  expectedLines: ExpectedLine[]
  /** Resolved priority per stat key (item override merged over global default). */
  priorities: Record<string, StatPriority>
}

/**
 * Weighted mean of per-line quality, normalised so a perfect roll scores 1.
 *
 * Normalising by total weight (rather than summing, as the old score did) is
 * what stops a wide mediocre item from tying a focused max-rolled one, and it
 * makes quality comparable across items and across time.
 */
export const computeItemQuality = (
  observation: Pick<ObservedPrice, 'statsEntries'>,
  options: ItemQualityOptions,
): ItemQuality => {
  const entriesByKey = new Map<string, ObservationStatEntry>()
  for (const entry of observation.statsEntries || []) {
    if (!entriesByKey.has(entry.key)) entriesByKey.set(entry.key, entry)
  }

  const expectedByKey = new Map(options.expectedLines.map((line) => [line.statKey, line]))
  // Every official line counts, present or not — a missing line is a real
  // downgrade, not an absence of information.
  const statKeys = new Set<string>([
    ...options.expectedLines.map((line) => line.statKey),
    ...entriesByKey.keys(),
  ])

  const lines: LineQuality[] = []
  for (const statKey of statKeys) {
    const priority = options.priorities[statKey] ?? 'normal'
    if (priority === 'ignore') continue

    const entry = entriesByKey.get(statKey)
    const expected = expectedByKey.get(statKey)
    const bounds = boundsFor(statKey, entry, expected)
    const isExo = !expected && Boolean(entry)

    // An exo has no official range, and used to be dropped here for want of
    // one — so an item carrying +1% Dommages aux Sorts scored identically to
    // one without it. Its presence is the point, so it is scored on presence.
    if (!bounds) {
      if (!isExo || entry?.value === null || entry?.value === undefined) continue

      lines.push(computeLineQuality({
        statKey,
        label: entry?.label || statKey,
        value: entry?.value ?? null,
        min: 0,
        max: entry?.value ?? 0,
        priority,
        isExo: true,
      }))
      continue
    }

    lines.push(computeLineQuality({
      statKey,
      label: expected?.label || entry?.label || statKey,
      value: entry?.value ?? null,
      min: bounds.min,
      max: bounds.max,
      priority,
      isExo,
    }))
  }

  // Base quality counts only the lines the item is supposed to have, so that
  // an exo cannot dilute or inflate the roll it is judged against.
  const baseLines = lines.filter((line) => !line.isExo)
  const totalWeight = baseLines.reduce((sum, line) => sum + line.weight, 0)
  const baseQuality = totalWeight > 0
    ? baseLines.reduce((sum, line) => sum + line.contribution, 0) / totalWeight
    : 0

  const exoBoost = lines
    .filter((line) => line.isExo && line.present && line.weight > 0)
    .reduce((sum, line) => sum + (baseStatWeight(line.statKey) / MAX_STAT_WEIGHT) * EXO_UNIT, 0)

  const overBoost = baseLines.reduce((sum, line) => {
    if (line.overmageAmount <= 0 || totalWeight <= 0) return sum
    const share = line.weight / totalWeight
    const depth = line.overmageAmount / Math.max(line.span, 1)
    return sum + share * depth * OVER_UNIT
  }, 0)

  return {
    // Multiplicative: the same exo is worth far more on a well-rolled item than
    // on one that gave up 15 Force to get it, which is exactly how the market
    // treats them.
    quality: baseQuality * (1 + exoBoost + overBoost),
    baseQuality,
    exoBoost,
    overBoost,
    lines,
    totalWeight,
  }
}
