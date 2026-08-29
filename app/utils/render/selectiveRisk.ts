// Turning a pile of graded samples into the number that decides everything.
//
// The claim this project is allowed to make about its reader is not "never
// wrong". It is: *wrong only if the renderer model is wrong in a way validation
// missed, at a false-accept rate measured on held-out real captures and
// reported with its bound, and abstaining otherwise.* Every word of that is a
// measurement, and this module produces them.
//
// Two numbers matter and they trade against each other:
//
//   coverage    — share of samples answered automatically
//   false accept— share of *answered* samples that were answered wrongly
//
// Reporting accuracy alone is meaningless here, because a reader that refuses
// everything is perfectly accurate and perfectly useless, while one that
// answers everything is useful right up until it buys the wrong item. The pair
// is the honest description, and the threshold is what moves you along it.

/** One graded sample: what the reader said, and what was actually true. */
export interface GradedSample {
  id: string
  /** Null when the reader refused to answer. */
  predicted: string | null
  truth: string
  /** Profile the sample belongs to; risk is reported per profile, never pooled. */
  profileId: string
  residual?: number
  margin?: number
}

export interface RiskReport {
  profileId: string
  total: number
  answered: number
  correct: number
  wrong: number
  /** Share of samples the reader answered at all. */
  coverage: number
  /** Share of answered samples that were wrong. The number that matters. */
  falseAcceptRate: number
  /**
   * Upper bound on the true false-accept rate at 95% confidence.
   *
   * With zero observed failures in `n` trials the rule of three gives roughly
   * `3/n`, and that is the honest ceiling — a clean run on 300 samples buys
   * "under about 1%", not "never". Stating the count without the bound is how
   * a small clean sample gets mistaken for a guarantee.
   */
  falseAcceptUpperBound95: number
  /** Wrong answers, listed so they can be looked at rather than summarised away. */
  failures: GradedSample[]
}

/**
 * Wilson upper bound, falling back to the rule of three when nothing failed.
 *
 * Wilson rather than the textbook normal interval because the interesting case
 * is a handful of failures in a small sample, which is exactly where the normal
 * approximation is worst and most flattering.
 */
export const upperBound95 = (failures: number, trials: number): number => {
  if (trials <= 0) return 1
  if (failures === 0) return Math.min(1, 3 / trials)

  const z = 1.96
  const p = failures / trials
  const denominator = 1 + (z * z) / trials
  const centre = p + (z * z) / (2 * trials)
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * trials)) / trials)

  return Math.min(1, (centre + spread) / denominator)
}

/** Grades one profile's samples. */
export const reportRisk = (profileId: string, samples: GradedSample[]): RiskReport => {
  const answered = samples.filter((sample) => sample.predicted !== null)
  const failures = answered.filter((sample) => sample.predicted !== sample.truth)
  const correct = answered.length - failures.length

  return {
    profileId,
    total: samples.length,
    answered: answered.length,
    correct,
    wrong: failures.length,
    coverage: samples.length ? answered.length / samples.length : 0,
    falseAcceptRate: answered.length ? failures.length / answered.length : 0,
    falseAcceptUpperBound95: upperBound95(failures.length, answered.length),
    failures,
  }
}

/**
 * Grades every profile separately.
 *
 * Pooling profiles would let a well-behaved one carry a broken one: a reader
 * that is flawless at 1080p and hopeless at 1440p reports respectably on the
 * average and misreads half of what the second user captures. Profiles are the
 * unit at which a reader is enabled, so they are the unit at which it is graded.
 */
export const reportRiskByProfile = (samples: GradedSample[]): RiskReport[] => {
  const byProfile = new Map<string, GradedSample[]>()

  for (const sample of samples) {
    const bucket = byProfile.get(sample.profileId)
    if (bucket) bucket.push(sample)
    else byProfile.set(sample.profileId, [sample])
  }

  return [...byProfile.entries()]
    .map(([profileId, group]) => reportRisk(profileId, group))
    .sort((a, b) => b.total - a.total)
}

export interface GateLimits {
  /** Wrong answers permitted. Zero, for anything that authorises a purchase. */
  maxWrong: number
  /** Floor on coverage, so "refuse everything" cannot pass as safe. */
  minCoverage: number
  /** Smallest sample that may be called validated at all. */
  minSamples: number
}

export interface GateOutcome {
  passed: boolean
  reasons: string[]
}

/**
 * Whether a profile may be enabled for automatic reading.
 *
 * The coverage floor is not decoration. Without it the cheapest way to satisfy
 * a zero-error gate is to answer nothing, and a reader optimised for that is
 * worse than the one it replaced while scoring perfectly. Both bars, always.
 */
export const judgeGate = (report: RiskReport, limits: GateLimits): GateOutcome => {
  const reasons: string[] = []

  if (report.total < limits.minSamples) {
    reasons.push(`only ${report.total} samples, need ${limits.minSamples}`)
  }
  if (report.wrong > limits.maxWrong) {
    reasons.push(`${report.wrong} wrong reads, limit ${limits.maxWrong}`)
  }
  if (report.coverage < limits.minCoverage) {
    reasons.push(`coverage ${(report.coverage * 100).toFixed(1)}% below ${(limits.minCoverage * 100).toFixed(1)}%`)
  }

  return { passed: !reasons.length, reasons }
}

/** Human-readable one-liner for a report, for CLI output and CI logs. */
export const formatRisk = (report: RiskReport): string => {
  const coverage = (report.coverage * 100).toFixed(1)
  const bound = (report.falseAcceptUpperBound95 * 100).toFixed(2)
  return `${report.profileId}: ${report.answered}/${report.total} answered (${coverage}% coverage), `
    + `${report.wrong} wrong, false-accept <= ${bound}% at 95%`
}
