import { describe, expect, it } from 'vitest'
import { computeItemQuality } from './quality'
import {
  describeRequirement,
  emptyPriorityProfiles,
  evaluateRequirements,
  resolvePriorities,
  summariseFailures,
} from './requirements'
import type { ExpectedLine, StatPriority } from './types'

const expectedLines: ExpectedLine[] = [
  { statKey: 'pa', label: 'PA', min: 1, max: 1 },
  { statKey: 'dommages', label: 'Dommages', min: 11, max: 20 },
  { statKey: 'vitalite', label: 'Vitalité', min: 51, max: 80 },
]

const check = (values: Record<string, number>, priorities: Record<string, StatPriority>) => {
  const quality = computeItemQuality(
    {
      statsEntries: Object.entries(values).map(([key, value]) => ({
        key,
        label: key,
        value,
        suffix: '',
        rangeText: '',
      })),
    },
    { expectedLines, priorities },
  )
  return evaluateRequirements(quality)
}

describe('the gate takes "high" literally', () => {
  it('rejects a line eight points below max', () => {
    const result = check({ pa: 1, dommages: 12, vitalite: 80 }, { dommages: 'high' })
    expect(result.passed).toBe(false)
    expect(result.failures[0]).toMatchObject({ statKey: 'dommages', needed: 19, got: 12 })
  })

  it('accepts a line one point below max', () => {
    expect(check({ pa: 1, dommages: 19, vitalite: 80 }, { dommages: 'high' }).passed).toBe(true)
  })

  it('accepts max itself', () => {
    expect(check({ pa: 1, dommages: 20, vitalite: 80 }, { dommages: 'high' }).passed).toBe(true)
  })

  it('accepts an overmaged line', () => {
    expect(check({ pa: 1, dommages: 24, vitalite: 80 }, { dommages: 'high' }).passed).toBe(true)
  })

  it('rejects a line that is missing entirely', () => {
    const result = check({ pa: 1, vitalite: 80 }, { dommages: 'high' })
    expect(result.passed).toBe(false)
    expect(result.failures[0]!.got).toBeNull()
  })
})

describe('"critical" is tighter than "high"', () => {
  it('lets high pass at -4 on a wide line where critical fails', () => {
    // vitalité 51..80 -> high tolerates -4, critical only -2
    expect(check({ pa: 1, dommages: 20, vitalite: 76 }, { vitalite: 'high' }).passed).toBe(true)
    expect(check({ pa: 1, dommages: 20, vitalite: 76 }, { vitalite: 'critical' }).passed).toBe(false)
  })

  it('accepts a critical line one point off max', () => {
    expect(check({ pa: 1, dommages: 20, vitalite: 79 }, { vitalite: 'critical' }).passed).toBe(true)
  })
})

describe('non-gating priorities never reject', () => {
  it.each(['normal', 'low', 'ignore'] as StatPriority[])('%s lets a floor roll through', (priority) => {
    const result = check({ pa: 1, dommages: 11, vitalite: 51 }, { dommages: priority })
    expect(result.passed).toBe(true)
    expect(result.requiredCount).toBe(0)
  })
})

describe('fixed lines are present-or-not', () => {
  it('passes when the fixed line is there', () => {
    expect(check({ pa: 1, dommages: 20, vitalite: 80 }, { pa: 'critical' }).passed).toBe(true)
  })

  it('fails when the fixed line is missing', () => {
    expect(check({ dommages: 20, vitalite: 80 }, { pa: 'critical' }).passed).toBe(false)
  })
})

describe('several requirements at once', () => {
  it('reports every failing line, not just the first', () => {
    const result = check({ dommages: 12, vitalite: 51 }, {
      pa: 'critical',
      dommages: 'high',
      vitalite: 'high',
    })
    expect(result.requiredCount).toBe(3)
    expect(result.failures.map((f) => f.statKey).sort()).toEqual(['dommages', 'pa', 'vitalite'])
    expect(summariseFailures(result)).toContain('needs')
  })
})

describe('priority resolution', () => {
  it('prefers the item override over the global profile', () => {
    const profiles = {
      global: { dommages: 'low' as StatPriority },
      byItem: { gelano: { dommages: 'critical' as StatPriority } },
    }
    expect(resolvePriorities(profiles, 'gelano', ['dommages']).dommages).toBe('critical')
    expect(resolvePriorities(profiles, 'other', ['dommages']).dommages).toBe('low')
  })

  it('falls back to normal for an unknown stat', () => {
    expect(resolvePriorities(emptyPriorityProfiles(), 'x', ['tacle']).tacle).toBe('normal')
  })

  it('ships no gating priority by default, so nothing is filtered unasked', () => {
    const resolved = resolvePriorities(emptyPriorityProfiles(), 'x', ['pa', 'pm', 'dommages'])
    expect(Object.values(resolved).every((p) => p !== 'high' && p !== 'critical')).toBe(true)
  })
})

describe('describeRequirement', () => {
  it('states the threshold in plain terms', () => {
    expect(describeRequirement({ label: 'Dommages', min: 11, max: 20 }, 'high')).toBe('needs ≥ 19 / 20')
    expect(describeRequirement({ label: 'PA', min: 1, max: 1 }, 'critical')).toBe('needs 1 / 1')
    expect(describeRequirement({ label: 'Dommages', min: 11, max: 20 }, 'normal')).toBe('')
  })
})
