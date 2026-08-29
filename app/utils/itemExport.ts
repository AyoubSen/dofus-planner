// A dump of everything behind one item's verdicts.
//
// Screenshots are the wrong thing to reason about a valuation from: they show
// the answer but none of the arithmetic. This carries the inputs (what was
// captured, what the item can roll, which stats were made requirements) and the
// outputs (score, fair value, peers used) together, so a disagreement about a
// verdict can be settled by looking at the numbers rather than by guessing.
//
// Deliberately no images: they are large, they are pictures of the whole
// desktop, and nothing here needs them.

import type { ExpectedLine, StatPriority, ValuedObservation } from './itemValuation'

export interface ItemExport {
  format: 'dofus-items-export'
  version: 1
  exportedAt: string
  item: {
    key: string
    name: string
    /** The roll table from DofusDB — what quality is measured against. */
    expectedLines: ExpectedLine[]
    /** Only the stats the user has moved off the default. */
    priorities: Record<string, StatPriority>
  }
  listings: Array<{
    price: number
    capturedAt: string
    status: string
    /** What was read off the tooltip. */
    stats: Array<{ key: string; value: number | null; range: string }>
    /** Lines read but not attributed, which is where a bad read shows up. */
    score: number
    baseQuality: number
    exoBoost: number
    overBoost: number
    tiers: Array<{ key: string; value: number | null; max: number; tier: string; isExo: boolean; overmage: number }>
    requirementsPassed: boolean
    requirementFailures: Array<{ label: string; needed: number; got: number | null }>
    segment: string
    peerScope: string
    peerCount: number
    confidence: string
    valuation: {
      fairValue: number
      netProfit: number
      marginPercent: number
      edgeRatio: number
      isDeal: boolean
      quick: number
      fair: number
      greedy: number
      curveKind: string
      kappa: number
      sampleCount: number
      clearedCount: number
      sampleMin: number
      sampleMax: number
    } | null
  }>
}

export interface ItemExportInput {
  itemKey: string
  itemName: string
  expectedLines: ExpectedLine[]
  priorities: Record<string, StatPriority>
  results: ValuedObservation[]
}

const round = (value: number, places = 4) => {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

export const buildItemExport = (input: ItemExportInput): ItemExport => ({
  format: 'dofus-items-export',
  version: 1,
  exportedAt: new Date().toISOString(),
  item: {
    key: input.itemKey,
    name: input.itemName,
    expectedLines: input.expectedLines,
    priorities: input.priorities,
  },
  listings: input.results.map((result) => ({
    price: result.observation.price,
    capturedAt: result.observation.createdAt,
    status: result.observation.status || 'unknown',
    stats: (result.observation.statsEntries || []).map((entry) => ({
      key: entry.key,
      value: entry.value,
      range: entry.rangeText,
    })),
    score: round(result.score),
    baseQuality: round(result.quality.baseQuality),
    exoBoost: round(result.quality.exoBoost),
    overBoost: round(result.quality.overBoost),
    tiers: result.quality.lines.map((line) => ({
      key: line.statKey,
      value: line.value,
      max: line.max,
      tier: line.tier,
      isExo: line.isExo,
      overmage: line.overmageAmount,
    })),
    requirementsPassed: result.requirements.passed,
    requirementFailures: result.requirements.failures.map((failure) => ({
      label: failure.label,
      needed: failure.needed,
      got: failure.got,
    })),
    segment: result.segment,
    peerScope: result.peerScope,
    peerCount: result.peerIds.length,
    confidence: result.confidence,
    valuation: result.valuation
      ? {
          fairValue: result.valuation.fairValue,
          netProfit: result.netProfit,
          marginPercent: round(result.valuation.marginPercent, 2),
          edgeRatio: round(result.valuation.edgeRatio, 3),
          isDeal: result.valuation.isDeal,
          quick: result.valuation.relists.quickRelist,
          fair: result.valuation.relists.fairRelist,
          greedy: result.valuation.relists.greedyRelist,
          curveKind: result.valuation.curve.kind,
          kappa: round(result.valuation.curve.kappa, 3),
          sampleCount: result.valuation.curve.sampleCount,
          clearedCount: result.valuation.curve.clearedCount,
          sampleMin: result.valuation.curve.sampleMin,
          sampleMax: result.valuation.curve.sampleMax,
        }
      : null,
  })),
})

/** Filename that sorts by item then time, so several exports stay tellable apart. */
export const itemExportFilename = (itemKey: string, at = new Date()): string => {
  const stamp = at.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const safeKey = (itemKey || 'item').replace(/[^a-z0-9-]+/gi, '-').toLowerCase()
  return `${safeKey}-${stamp}.json`
}
