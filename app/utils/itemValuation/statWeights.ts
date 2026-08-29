// Base desirability of each stat, and what the user's priority chips do to it.
//
// The base numbers are the ones the items page shipped with — they were sane
// and this pass deliberately doesn't relitigate them. What changed is the
// priority scale: it now spreads much wider, because a stat the user calls
// critical should dominate the score, not nudge it.

import type { StatPriority } from './types'

export const observationStatWeightMap: Record<string, number> = {
  vitalite: 1,
  force: 1,
  intelligence: 1,
  chance: 1,
  agilite: 1,
  sagesse: 1,
  initiative: 0.4,
  critique: 1.5,
  dommages: 2.4,
  dommages_critiques: 2.4,
  resistance_critique: 1.8,
  pa: 4,
  pm: 4,
  po: 3,
  invocation: 2,
  dommages_neutre: 1.4,
  dommages_terre: 1.4,
  dommages_feu: 1.4,
  dommages_eau: 1.4,
  dommages_air: 1.4,
  prospection: 0.8,
  resistance_air: 1.8,
  resistance_terre: 1.8,
  resistance_feu: 1.8,
  resistance_eau: 1.8,
  resistance_neutre: 1.8,
  // Flat resistance is worth markedly less than the percentage kind: a point of
  // "%" scales with every hit taken, where a flat point is a fixed subtraction
  // that late-game damage swamps. Same family, different market — which is the
  // whole reason they stopped sharing a key.
  resistance_air_fixe: 0.9,
  resistance_terre_fixe: 0.9,
  resistance_feu_fixe: 0.9,
  resistance_eau_fixe: 0.9,
  resistance_neutre_fixe: 0.9,
  fuite: 1.3,
  tacle: 1.3,
  dommages_poussee: 2.2,
  resistance_poussee: 1.8,
  retrait_pa: 2.2,
  retrait_pm: 2.2,
  esquive_pa: 2.2,
  esquive_pm: 2.2,
  dommages_distance: 2.8,
  dommages_melee: 2.8,
  dommages_sort: 3,
  arme_de_chasse: 2.5,
}

export const baseStatWeight = (statKey: string): number =>
  observationStatWeightMap[statKey] ?? 1

export const statPriorityMultipliers: Record<StatPriority, number> = {
  ignore: 0,
  low: 0.6,
  normal: 1,
  high: 2,
  critical: 3,
}

export const statPriorityPresets: Array<{ key: StatPriority; label: string; hint: string }> = [
  { key: 'ignore', label: 'Ignore', hint: 'Excluded from score, matching and requirements' },
  { key: 'low', label: 'Low', hint: 'Counted, but barely' },
  { key: 'normal', label: 'Normal', hint: 'Default weight for the stat' },
  { key: 'high', label: 'High', hint: 'Must roll near max, or the item is rejected' },
  { key: 'critical', label: 'Critical', hint: 'Must roll at or within a point of max' },
]

/** Priorities that act as a hard gate rather than only a weight. */
export const gatingPriorities: StatPriority[] = ['high', 'critical']

export const isGatingPriority = (priority: StatPriority): boolean =>
  priority === 'high' || priority === 'critical'

export const priorityMultiplier = (priority: StatPriority): number =>
  statPriorityMultipliers[priority] ?? 1

/**
 * Global fallback priorities, applied to every item until the user overrides a
 * stat on that specific item. Deliberately contains no gating priority: a hard
 * gate should only ever exist because the user asked for it, never by default.
 */
export const defaultStatPriorities: Record<string, StatPriority> = {
  prospection: 'low',
  initiative: 'low',
}
