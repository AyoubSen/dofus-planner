import { describe, expect, it } from 'vitest'
import {
  formatRisk,
  judgeGate,
  reportRisk,
  reportRiskByProfile,
  upperBound95,
  type GradedSample,
} from './selectiveRisk'

const sample = (
  id: string,
  predicted: string | null,
  truth: string,
  profileId = 'p1',
): GradedSample => ({ id, predicted, truth, profileId })

describe('the 95% upper bound', () => {
  it('uses the rule of three when nothing failed', () => {
    // The correction that matters: a clean run is not proof of zero.
    expect(upperBound95(0, 300)).toBeCloseTo(0.01, 4)
    expect(upperBound95(0, 3_000)).toBeCloseTo(0.001, 4)
  })

  it('never claims certainty from a tiny clean sample', () => {
    // Ten clean samples bound the rate at 30%, not at nothing.
    expect(upperBound95(0, 10)).toBeCloseTo(0.3, 4)
  })

  it('is above the observed rate once something has failed', () => {
    const bound = upperBound95(1, 100)
    expect(bound).toBeGreaterThan(0.01)
    expect(bound).toBeLessThan(1)
  })

  it('shrinks as evidence accumulates', () => {
    expect(upperBound95(1, 1_000)).toBeLessThan(upperBound95(1, 100))
  })

  it('is total ignorance with no trials at all', () => {
    expect(upperBound95(0, 0)).toBe(1)
  })
})

describe('risk reporting', () => {
  it('separates refusing from being wrong', () => {
    // A refusal costs coverage; a wrong answer costs money. Conflating them is
    // what makes an accuracy figure meaningless.
    const report = reportRisk('p1', [
      sample('a', '100', '100'),
      sample('b', null, '200'),
      sample('c', '999', '300'),
    ])

    expect(report.answered).toBe(2)
    expect(report.correct).toBe(1)
    expect(report.wrong).toBe(1)
    expect(report.coverage).toBeCloseTo(2 / 3, 5)
    expect(report.falseAcceptRate).toBeCloseTo(0.5, 5)
  })

  it('scores a reader that refuses everything as zero coverage, not perfect', () => {
    const report = reportRisk('p1', [sample('a', null, '1'), sample('b', null, '2')])
    expect(report.coverage).toBe(0)
    expect(report.falseAcceptRate).toBe(0)
    // And the gate must still fail it — see the gate tests below.
  })

  it('keeps the failures rather than only counting them', () => {
    const report = reportRisk('p1', [sample('a', '999', '100')])
    expect(report.failures).toHaveLength(1)
    expect(report.failures[0]!.id).toBe('a')
  })

  it('reports a clean run with its bound, not as a guarantee', () => {
    const clean = Array.from({ length: 50 }, (_, i) => sample(`s${i}`, '100', '100'))
    const report = reportRisk('p1', clean)
    expect(report.wrong).toBe(0)
    expect(report.falseAcceptUpperBound95).toBeCloseTo(0.06, 3)
  })
})

describe('per-profile reporting', () => {
  it('does not let a good profile carry a broken one', () => {
    // Pooled, this reads as 1 wrong in 4. Split, it reads as one profile that
    // is fine and one that is unusable — which is the actionable version.
    const reports = reportRiskByProfile([
      sample('a', '100', '100', '1080p'),
      sample('b', '200', '200', '1080p'),
      sample('c', '999', '300', '1440p'),
      sample('d', '400', '400', '1440p'),
    ])

    const hd = reports.find((report) => report.profileId === '1080p')!
    const qhd = reports.find((report) => report.profileId === '1440p')!
    expect(hd.wrong).toBe(0)
    expect(qhd.wrong).toBe(1)
  })

  it('orders profiles by how much evidence they have', () => {
    const reports = reportRiskByProfile([
      sample('a', '1', '1', 'small'),
      sample('b', '1', '1', 'big'),
      sample('c', '1', '1', 'big'),
    ])
    expect(reports[0]!.profileId).toBe('big')
  })
})

describe('the enabling gate', () => {
  const limits = { maxWrong: 0, minCoverage: 0.5, minSamples: 20 }

  it('passes a profile that is both correct and useful', () => {
    const report = reportRisk('p1', Array.from({ length: 40 }, (_, i) => sample(`s${i}`, '100', '100')))
    expect(judgeGate(report, limits).passed).toBe(true)
  })

  it('fails a single wrong read', () => {
    const samples = Array.from({ length: 40 }, (_, i) => sample(`s${i}`, '100', '100'))
    samples[0] = sample('s0', '999', '100')
    const outcome = judgeGate(reportRisk('p1', samples), limits)
    expect(outcome.passed).toBe(false)
    expect(outcome.reasons.join(' ')).toContain('wrong')
  })

  it('fails a reader that bought its accuracy by refusing everything', () => {
    // Without a coverage floor this is the cheapest way to pass a zero-error
    // gate, and the result is worse than what it replaced.
    const samples = Array.from({ length: 40 }, (_, i) => sample(`s${i}`, null, '100'))
    const outcome = judgeGate(reportRisk('p1', samples), limits)
    expect(outcome.passed).toBe(false)
    expect(outcome.reasons.join(' ')).toContain('coverage')
  })

  it('refuses to call a tiny sample validated', () => {
    const outcome = judgeGate(reportRisk('p1', [sample('a', '1', '1')]), limits)
    expect(outcome.passed).toBe(false)
    expect(outcome.reasons.join(' ')).toContain('samples')
  })

  it('lists every reason it failed, not just the first', () => {
    const samples = [sample('a', '999', '1')]
    const outcome = judgeGate(reportRisk('p1', samples), limits)
    expect(outcome.reasons.length).toBeGreaterThan(1)
  })
})

describe('formatting', () => {
  it('always states the bound alongside the count', () => {
    const line = formatRisk(reportRisk('p1', [sample('a', '1', '1')]))
    expect(line).toContain('coverage')
    expect(line).toContain('false-accept <=')
  })
})
