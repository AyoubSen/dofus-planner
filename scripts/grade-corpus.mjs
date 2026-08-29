#!/usr/bin/env node
// Grades the capture archive and prints the selective-risk report.
//
// This is the phase 1a gate in executable form. It reads `corpus/`, keeps only
// the samples someone has confirmed the truth of, runs the reader over them,
// and reports coverage against false-accept rate per profile — with the 95%
// upper bound, because a clean run on a small sample is not a guarantee and
// printing the count alone invites reading it as one.
//
//   node scripts/grade-corpus.mjs            report only
//   node scripts/grade-corpus.mjs --gate     exit non-zero if a profile fails
//
// Until the real Dofus glyph atlas exists this reports on whatever samples
// carry a confirmed `truth`, and says plainly when there are none. That is the
// intended state: the machinery is finished and validated synthetically, and
// the measurement it produces is waiting on captures that only real use can
// supply. See `docs/recognition-validation.md`.

import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const CORPUS_DIR = 'corpus'

const readManifests = async () => {
  let entries
  try {
    entries = await readdir(CORPUS_DIR, { withFileTypes: true })
  } catch {
    return []
  }

  const samples = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    try {
      const raw = await readFile(join(CORPUS_DIR, entry.name, 'sample.json'), 'utf8')
      samples.push(JSON.parse(raw))
    } catch {
      // Half-written sample from an interrupted run.
    }
  }
  return samples
}

/** Groups by the things that actually change the pixels. */
const profileIdOf = (sample) =>
  `${sample.profile?.screenWidth ?? 0}x${sample.profile?.screenHeight ?? 0}`
  + `@${sample.profile?.devicePixelRatio ?? 1}`
  + `/${sample.profile?.locale ?? 'fr'}`

const upperBound95 = (failures, trials) => {
  if (trials <= 0) return 1
  if (failures === 0) return Math.min(1, 3 / trials)
  const z = 1.96
  const p = failures / trials
  const denominator = 1 + (z * z) / trials
  const centre = p + (z * z) / (2 * trials)
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * trials)) / trials)
  return Math.min(1, (centre + spread) / denominator)
}

const main = async () => {
  const gate = process.argv.includes('--gate')
  const samples = await readManifests()

  if (!samples.length) {
    console.log('corpus is empty — nothing to grade yet.')
    console.log('Use the app on the HDV with capture armed; samples accumulate under corpus/.')
    process.exit(0)
  }

  const labelled = samples.filter((sample) => typeof sample.truth === 'number')

  console.log(`corpus: ${samples.length} samples, ${labelled.length} with confirmed truth`)

  // Disagreement between the two readers is available without any labelling at
  // all, and it is the first honest signal about the current pipeline: every
  // disagreement is a case where at least one reader is definitely wrong.
  const comparable = samples.filter(
    (sample) => (sample.readings || []).filter((reading) => reading.value !== null).length >= 2,
  )
  const disagreed = comparable.filter((sample) => sample.agreed === false)
  if (comparable.length) {
    const rate = (disagreed.length / comparable.length) * 100
    console.log(
      `reader disagreement: ${disagreed.length}/${comparable.length} (${rate.toFixed(1)}%) `
      + '— each one is a case where a reader is definitely wrong',
    )
  }

  if (!labelled.length) {
    console.log('')
    console.log('No confirmed truths yet, so no false-accept rate can be reported.')
    console.log('Confirm prices on captured samples to turn this into a measurement.')
    process.exit(0)
  }

  const byProfile = new Map()
  for (const sample of labelled) {
    const id = profileIdOf(sample)
    if (!byProfile.has(id)) byProfile.set(id, [])
    byProfile.get(id).push(sample)
  }

  let failed = false
  console.log('')

  for (const [profileId, group] of [...byProfile.entries()].sort((a, b) => b[1].length - a[1].length)) {
    // Zero is a refusal, not an answer. No listing costs nothing, so a stored 0
    // always means "declined", and counting it as an answer would score the
    // reader's correct behaviour — abstaining instead of guessing — as a false
    // accept. Handled here as well as at the write side, because samples
    // archived before that fix carry the zero.
    const answered = group.filter((sample) => sample.storedPrice !== null && sample.storedPrice !== 0)
    const wrong = answered.filter((sample) => sample.storedPrice !== sample.truth)
    const coverage = group.length ? answered.length / group.length : 0
    const bound = upperBound95(wrong.length, answered.length)

    console.log(
      `${profileId}: ${answered.length}/${group.length} answered `
      + `(${(coverage * 100).toFixed(1)}% coverage), ${wrong.length} wrong, `
      + `false-accept <= ${(bound * 100).toFixed(2)}% at 95%`,
    )

    for (const sample of wrong.slice(0, 5)) {
      console.log(`   wrong: ${sample.id} stored ${sample.storedPrice} truth ${sample.truth}`)
    }

    // Both bars. A reader that refuses everything is perfectly accurate and
    // useless, so zero-wrong alone is not a pass.
    if (wrong.length > 0 || coverage < 0.5) failed = true
  }

  if (gate && failed) {
    console.log('')
    console.error('GATE FAILED: a profile has wrong reads or insufficient coverage.')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
