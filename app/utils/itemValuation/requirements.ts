// The priority gate.
//
// Previously a stat priority was a weight multiplier, which meant "this stat is
// critical" only nudged a score — a listing rolling 12/20 on the stat you care
// about could still surface as a deal. Here `high` and `critical` are
// requirements: the line has to land within tolerance of its max or the listing
// is not a candidate at all. Weight still applies on top, for ranking among the
// listings that do qualify.

import type {
  ExpectedLine,
  ItemQuality,
  RequirementFailure,
  RequirementResult,
  StatPriority,
} from './types'
import { defaultStatPriorities, isGatingPriority } from './statWeights'
import { requiredValueFor } from './quality'

/** Per-item overrides layered over the global default profile. */
export interface PriorityProfiles {
  global: Record<string, StatPriority>
  byItem: Record<string, Record<string, StatPriority>>
}

export const emptyPriorityProfiles = (): PriorityProfiles => ({
  global: {},
  byItem: {},
})

/**
 * Flattens the profile stack for one item: item override wins, then the user's
 * global profile, then the shipped defaults, then `normal`.
 */
export const resolvePriorities = (
  profiles: PriorityProfiles,
  itemKey: string,
  statKeys: Iterable<string>,
): Record<string, StatPriority> => {
  const itemOverrides = profiles.byItem[itemKey] || {}
  const resolved: Record<string, StatPriority> = {}
  for (const statKey of statKeys) {
    resolved[statKey] = itemOverrides[statKey]
      ?? profiles.global[statKey]
      ?? defaultStatPriorities[statKey]
      ?? 'normal'
  }
  return resolved
}

/** Human-readable statement of what a gating priority demands on a line. */
export const describeRequirement = (
  line: Pick<ExpectedLine, 'label' | 'min' | 'max'>,
  priority: StatPriority,
): string => {
  if (!isGatingPriority(priority)) return ''
  const needed = requiredValueFor(line, priority)
  if (needed >= line.max) return `needs ${line.max} / ${line.max}`
  return `needs ≥ ${needed} / ${line.max}`
}

/**
 * Checks an already-scored item against its gating priorities.
 *
 * Runs off `ItemQuality.lines` rather than the raw observation so the verdict
 * always agrees with the number shown next to it — the deficit that failed the
 * gate is the same deficit the explain panel renders.
 */
export const evaluateRequirements = (quality: ItemQuality): RequirementResult => {
  const failures: RequirementFailure[] = []
  let requiredCount = 0

  for (const line of quality.lines) {
    if (!isGatingPriority(line.priority)) continue
    requiredCount += 1

    const needed = requiredValueFor(line, line.priority)
    // An absent line can never satisfy a requirement, however wide the range.
    if (!line.present || (line.value as number) < needed) {
      failures.push({
        statKey: line.statKey,
        label: line.label,
        priority: line.priority,
        needed,
        got: line.value,
        max: line.max,
      })
    }
  }

  return { passed: failures.length === 0, failures, requiredCount }
}

/** Short reason string for the "below your requirements" badge. */
export const summariseFailures = (result: RequirementResult): string => {
  if (result.passed) return ''
  return result.failures
    .map((failure) => `${failure.label} ${failure.got ?? '—'}/${failure.max} (needs ${failure.needed})`)
    .join(', ')
}
