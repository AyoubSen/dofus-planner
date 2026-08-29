import { describe, expect, it } from 'vitest'
import {
  computeItemQuality,
  computeLineQuality,
  criticalTolerance,
  parseObservationRange,
  requiredValueFor,
  tierFor,
  toleranceForSpan,
} from './quality'
import type { ExpectedLine, StatPriority } from './types'

const line = (
  statKey: string,
  value: number | null,
  min: number,
  max: number,
  priority: StatPriority = 'normal',
) => computeLineQuality({ statKey, label: statKey, value, min, max, priority })

describe('parseObservationRange', () => {
  it('reads a two-bound tooltip range', () => {
    expect(parseObservationRange('[11 à 20]')).toEqual({ min: 11, max: 20 })
  })

  it('treats a single bound as a fixed line', () => {
    expect(parseObservationRange('[6]')).toEqual({ min: 6, max: 6 })
  })

  it('orders the bounds regardless of how they were written', () => {
    expect(parseObservationRange('[20 à 11]')).toEqual({ min: 11, max: 20 })
  })

  it('returns null when there is no number to read', () => {
    expect(parseObservationRange('')).toBeNull()
    expect(parseObservationRange(undefined)).toBeNull()
  })
})

describe('tolerance scales with the width of the range', () => {
  it('is exact-match for a fixed line like PA/PM/PO', () => {
    expect(toleranceForSpan(0)).toBe(0)
    expect(criticalTolerance(0)).toBe(0)
  })

  it('tolerates a single point on a narrow damage line', () => {
    // 11..20 -> span 9 -> round(1.35) = 1
    expect(toleranceForSpan(9)).toBe(1)
    expect(criticalTolerance(9)).toBe(1)
  })

  it('tolerates a few points on a wide vitality line', () => {
    // 51..80 -> span 29 -> round(4.35) = 4
    expect(toleranceForSpan(29)).toBe(4)
    expect(criticalTolerance(29)).toBe(2)
  })

  it('never tolerates more than five points, however wide the line', () => {
    expect(toleranceForSpan(400)).toBe(5)
    expect(criticalTolerance(400)).toBe(2)
  })
})

describe('requiredValueFor', () => {
  it('demands max on a fixed line for high and critical alike', () => {
    expect(requiredValueFor({ min: 1, max: 1 }, 'high')).toBe(1)
    expect(requiredValueFor({ min: 1, max: 1 }, 'critical')).toBe(1)
  })

  it('demands near-max on a damage line', () => {
    expect(requiredValueFor({ min: 11, max: 20 }, 'high')).toBe(19)
    expect(requiredValueFor({ min: 11, max: 20 }, 'critical')).toBe(19)
  })

  it('demands only the floor for non-gating priorities', () => {
    expect(requiredValueFor({ min: 51, max: 80 }, 'normal')).toBe(51)
    expect(requiredValueFor({ min: 51, max: 80 }, 'low')).toBe(51)
  })
})

describe('tiers', () => {
  it('calls the top of the range max', () => {
    expect(tierFor(20, 11, 20)).toBe('max')
  })

  it('calls one off max near-max on a narrow line', () => {
    expect(tierFor(19, 11, 20)).toBe('near-max')
  })

  it('does not call a middling roll near-max', () => {
    expect(tierFor(17, 11, 20)).toBe('good')
    expect(tierFor(16, 11, 20)).toBe('mid')
    expect(tierFor(12, 11, 20)).toBe('low')
  })

  it('scales near-max with the range width', () => {
    expect(tierFor(76, 51, 80)).toBe('near-max')
    expect(tierFor(75, 51, 80)).toBe('good')
  })
})

describe('line quality is convex toward the top', () => {
  it('rewards the last points far more than the first', () => {
    const low = line('dommages', 13, 11, 20)
    const mid = line('dommages', 16, 11, 20)
    const top = line('dommages', 20, 11, 20)

    const firstHalfGain = mid.qEff - low.qEff
    const secondHalfGain = top.qEff - mid.qEff
    expect(secondHalfGain).toBeGreaterThan(firstHalfGain)
  })

  it('separates max from near-max by a visible step', () => {
    const nearMax = line('dommages', 19, 11, 20)
    const max = line('dommages', 20, 11, 20)
    expect(max.qEff - nearMax.qEff).toBeGreaterThan(0.1)
  })

  it('lets an overmaged line exceed a perfect natural roll', () => {
    const perfect = line('dommages', 20, 11, 20)
    const overmaged = line('dommages', 23, 11, 20)
    expect(overmaged.qEff).toBeGreaterThan(perfect.qEff)
    expect(overmaged.overmageAmount).toBe(3)
    expect(overmaged.tier).toBe('max')
  })

  it('treats a fixed line as present-or-not', () => {
    expect(line('pa', 1, 1, 1).qEff).toBeGreaterThan(1)
    expect(line('pa', 0, 1, 1).qEff).toBe(0)
  })

  it('scores an absent line as zero but keeps its weight', () => {
    const absent = line('dommages', null, 11, 20)
    expect(absent.present).toBe(false)
    expect(absent.tier).toBe('absent')
    expect(absent.contribution).toBe(0)
    expect(absent.weight).toBeGreaterThan(0)
  })

  it('multiplies weight by the priority', () => {
    expect(line('dommages', 20, 11, 20, 'critical').weight)
      .toBeCloseTo(line('dommages', 20, 11, 20, 'normal').weight * 3)
    expect(line('dommages', 20, 11, 20, 'ignore').weight).toBe(0)
  })
})

describe('item quality', () => {
  const expectedLines: ExpectedLine[] = [
    { statKey: 'pa', label: 'PA', min: 1, max: 1 },
    { statKey: 'dommages', label: 'Dommages', min: 11, max: 20 },
    { statKey: 'vitalite', label: 'Vitalité', min: 51, max: 80 },
  ]

  const observation = (values: Record<string, number>) => ({
    statsEntries: Object.entries(values).map(([key, value]) => ({
      key,
      label: key,
      value,
      suffix: '',
      rangeText: '',
    })),
  })

  it('normalises a perfect roll to at least 1', () => {
    const result = computeItemQuality(
      observation({ pa: 1, dommages: 20, vitalite: 80 }),
      { expectedLines, priorities: {} },
    )
    expect(result.quality).toBeGreaterThanOrEqual(1)
  })

  it('ranks a focused max roll above a broad mediocre one', () => {
    const focused = computeItemQuality(
      observation({ pa: 1, dommages: 20, vitalite: 55 }),
      { expectedLines, priorities: {} },
    )
    const broad = computeItemQuality(
      observation({ pa: 1, dommages: 15, vitalite: 70 }),
      { expectedLines, priorities: {} },
    )
    expect(focused.quality).toBeGreaterThan(broad.quality)
  })

  it('penalises a missing official line', () => {
    const complete = computeItemQuality(
      observation({ pa: 1, dommages: 20, vitalite: 80 }),
      { expectedLines, priorities: {} },
    )
    const missingPa = computeItemQuality(
      observation({ dommages: 20, vitalite: 80 }),
      { expectedLines, priorities: {} },
    )
    expect(missingPa.quality).toBeLessThan(complete.quality)
    expect(missingPa.lines.find((l) => l.statKey === 'pa')?.tier).toBe('absent')
  })

  it('drops ignored stats from the score entirely', () => {
    const result = computeItemQuality(
      observation({ pa: 1, dommages: 20, vitalite: 51 }),
      { expectedLines, priorities: { vitalite: 'ignore' } },
    )
    expect(result.lines.some((l) => l.statKey === 'vitalite')).toBe(false)
  })

  it('lets a priority change reorder two items', () => {
    const damageItem = observation({ pa: 1, dommages: 20, vitalite: 51 })
    const vitalityItem = observation({ pa: 1, dommages: 11, vitalite: 80 })

    const neutral = {
      damage: computeItemQuality(damageItem, { expectedLines, priorities: {} }).quality,
      vitality: computeItemQuality(vitalityItem, { expectedLines, priorities: {} }).quality,
    }
    const vitalityFirst = {
      damage: computeItemQuality(damageItem, {
        expectedLines,
        priorities: { vitalite: 'critical' },
      }).quality,
      vitality: computeItemQuality(vitalityItem, {
        expectedLines,
        priorities: { vitalite: 'critical' },
      }).quality,
    }

    expect(neutral.damage).toBeGreaterThan(neutral.vitality)
    expect(vitalityFirst.vitality).toBeGreaterThan(vitalityFirst.damage)
  })

  it('falls back to the listing tooltip range for unexpected stats', () => {
    const result = computeItemQuality(
      {
        statsEntries: [
          { key: 'sagesse', label: 'Sagesse', value: 30, suffix: '', rangeText: '[21 à 30]' },
        ],
      },
      { expectedLines: [], priorities: {} },
    )
    expect(result.lines).toHaveLength(1)
    expect(result.lines[0]!.tier).toBe('max')
  })
})

describe('exos and overmage', () => {
  // Cape au Logis: no Dommages Sort line, so one is an exo.
  const cape: ExpectedLine[] = [
    { statKey: 'vitalite', label: 'Vitalité', min: 301, max: 350 },
    { statKey: 'force', label: 'Force', min: 71, max: 100 },
    { statKey: 'dommages_terre', label: 'Dommages Terre', min: 14, max: 18 },
  ]

  const roll = (values: Record<string, number>) => ({
    statsEntries: Object.entries(values).map(([key, value]) => ({
      key, label: key, value, suffix: '', rangeText: '',
    })),
  })

  const score = (values: Record<string, number>) =>
    computeItemQuality(roll(values), { expectedLines: cape, priorities: {} })

  it('counts an exo at all', () => {
    // It used to score identically with and without — the exo was dropped.
    const without = score({ vitalite: 350, force: 100, dommages_terre: 18 })
    const withExo = score({ vitalite: 350, force: 100, dommages_terre: 18, dommages_sort: 1 })
    expect(withExo.quality).toBeGreaterThan(without.quality)
    expect(withExo.exoBoost).toBeGreaterThan(0)
  })

  it('does not let an exo dilute the base roll', () => {
    const perfect = score({ vitalite: 350, force: 100, dommages_terre: 18 })
    const perfectPlusExo = score({ vitalite: 350, force: 100, dommages_terre: 18, dommages_sort: 1 })
    expect(perfectPlusExo.baseQuality).toBeCloseTo(perfect.baseQuality)
  })

  it('weighs a heavy exo above a light one', () => {
    const exoPa = score({ vitalite: 350, force: 100, dommages_terre: 18, pa: 1 })
    const exoProspe = score({ vitalite: 350, force: 100, dommages_terre: 18, prospection: 10 })
    expect(exoPa.exoBoost).toBeGreaterThan(exoProspe.exoBoost)
  })

  it('will not let an exo rescue a weak roll', () => {
    // The stated rule: 1% do sort with 85 Force is worse than a clean 100 Force.
    const exoButWeak = score({ vitalite: 320, force: 85, dommages_terre: 15, dommages_sort: 1 })
    const cleanAndStrong = score({ vitalite: 350, force: 100, dommages_terre: 18 })
    expect(exoButWeak.quality).toBeLessThan(cleanAndStrong.quality)
  })

  it('is worth more on a strong item than a weak one', () => {
    const strongGain = score({ vitalite: 350, force: 100, dommages_terre: 18, dommages_sort: 1 }).quality
      - score({ vitalite: 350, force: 100, dommages_terre: 18 }).quality
    const weakGain = score({ vitalite: 305, force: 72, dommages_terre: 14, dommages_sort: 1 }).quality
      - score({ vitalite: 305, force: 72, dommages_terre: 14 }).quality
    expect(strongGain).toBeGreaterThan(weakGain)
  })

  it('rewards an overmaged line above a merely perfect one', () => {
    const perfect = score({ vitalite: 350, force: 100, dommages_terre: 18 })
    const over = score({ vitalite: 380, force: 100, dommages_terre: 18 })
    expect(over.quality).toBeGreaterThan(perfect.quality)
    expect(over.overBoost).toBeGreaterThan(0)
  })

  it('marks which lines are exos so the UI can say so', () => {
    const result = score({ vitalite: 350, force: 100, dommages_terre: 18, dommages_sort: 1 })
    expect(result.lines.find((l) => l.statKey === 'dommages_sort')?.isExo).toBe(true)
    expect(result.lines.find((l) => l.statKey === 'force')?.isExo).toBe(false)
  })

  it('leaves a plain item unboosted', () => {
    const plain = score({ vitalite: 340, force: 95, dommages_terre: 17 })
    expect(plain.exoBoost).toBe(0)
    expect(plain.overBoost).toBe(0)
    expect(plain.quality).toBeCloseTo(plain.baseQuality)
  })
})
