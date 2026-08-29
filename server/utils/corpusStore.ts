// The archive of what the readers actually saw.
//
// Phase 0b of the enhancement plan. Every claim this project wants to make
// about recognition accuracy — "wrong only if the renderer model is wrong, at a
// measured rate" — needs a set of real captures with known answers to measure
// against. There is no such set today, which is why the current error rate is
// not merely bad or good but *unknown*.
//
// So: while the app is used normally, every capture is written here with both
// readers' answers and the value that was actually stored. Two things come out
// of that. Today, a disagreement log that says how often the current pipeline
// is wrong. Later, the validation corpus phase 1a is graded on — the fitted
// renderer model has to reproduce these exact crops, and a model that cannot is
// rejected before it ever prices anything.
//
// Deliberately on disk rather than in the browser. IndexedDB would hold the
// images but nothing outside the tab could read them, and the whole point is
// that a training or calibration script can.
//
// Privacy: crops only. The desktop frame the companion sends is never written
// here — it is a picture of whatever else was on screen, it is large, and
// nothing downstream needs it.

import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** What one reader made of one image. */
export interface ReaderReading {
  /** Which reader: the deterministic glyph atlas, or general OCR. */
  reader: 'glyph' | 'ocr'
  /** The value it settled on, or null when it refused. */
  value: number | null
  /** Raw text, kept because a refusal is only diagnosable from what it saw. */
  text: string
  /** Milliseconds spent, so latency regressions are visible later. */
  ms: number
}

export interface CorpusSample {
  id: string
  capturedAt: string
  /** Item the capture was armed on. Identity, not decoration — see captureIdentity. */
  itemName: string
  itemKey: string
  serverId: string
  /**
   * Profile fingerprint: what the pixels depend on.
   *
   * A corpus without this cannot be split by profile, and per-profile
   * validation is the entire discipline phase 1a rests on.
   */
  profile: {
    screenWidth: number
    screenHeight: number
    cursorX: number
    cursorY: number
    devicePixelRatio: number
    locale: string
  }
  /** Every reader's answer for the price strip. */
  readings: ReaderReading[]
  /** What was actually stored, after all the gates. Null when nothing was. */
  storedPrice: number | null
  /** Whether the readers that produced a value all produced the same one. */
  agreed: boolean
  /** Ground truth, filled in later by review. Absent until someone confirms it. */
  truth?: number
  /** Why the capture failed, when it did. */
  error?: string
  /** Stat lines read, for the tooltip half of the corpus. */
  stats?: Array<{ key: string; value: number | null; confidence: number }>
  statsText?: string
}

export interface CorpusWriteInput extends Omit<CorpusSample, 'id' | 'capturedAt'> {
  /** PNG data URL of the price strip. Required — it is the thing being graded. */
  stripImage: string
  /** PNG data URL of the tooltip panel, when there was one. */
  tooltipImage?: string
}

/** Where samples land. Gitignored: it is image data, and it is personal. */
export const CORPUS_DIR = 'corpus'

/**
 * Cap on stored samples.
 *
 * Large enough to be a real validation set — the plan wants thousands — and
 * bounded so an unattended session cannot fill a disk. At roughly 10-40 kB a
 * sample this is a few hundred megabytes at worst.
 */
export const MAX_CORPUS_SAMPLES = 20_000

const dataUrlToBuffer = (dataUrl: string): Buffer | null => {
  const match = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(String(dataUrl || ''))
  if (!match) return null
  return Buffer.from(match[2]!, 'base64')
}

export const createSampleId = () =>
  `${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}`

/**
 * Writes one capture to the archive.
 *
 * Images and manifest are separate files rather than one JSON blob with base64
 * inside: a corpus you cannot look through with an image viewer does not get
 * looked through, and a manifest you cannot grep does not get audited.
 */
export const writeCorpusSample = async (input: CorpusWriteInput): Promise<CorpusSample | null> => {
  const strip = dataUrlToBuffer(input.stripImage)
  // No image, nothing to grade. Recording the numbers alone would build a
  // corpus that cannot validate a reader, which is the only reason it exists.
  if (!strip) return null

  const id = createSampleId()
  const capturedAt = new Date().toISOString()
  const dir = join(CORPUS_DIR, id)

  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'strip.png'), strip)

  const tooltip = input.tooltipImage ? dataUrlToBuffer(input.tooltipImage) : null
  if (tooltip) await writeFile(join(dir, 'tooltip.png'), tooltip)

  const { stripImage: _s, tooltipImage: _t, ...rest } = input
  const sample: CorpusSample = { id, capturedAt, ...rest }
  await writeFile(join(dir, 'sample.json'), JSON.stringify(sample, null, 2), 'utf8')

  return sample
}

/** Sample directories, oldest first. */
const listSampleDirs = async (): Promise<string[]> => {
  try {
    const entries = await readdir(CORPUS_DIR, { withFileTypes: true })
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
  } catch {
    return []
  }
}

/** Reads every manifest. Images stay on disk; this is for counting and stats. */
export const readCorpusManifests = async (): Promise<CorpusSample[]> => {
  const dirs = await listSampleDirs()
  const samples: CorpusSample[] = []

  for (const dir of dirs) {
    try {
      const raw = await readFile(join(CORPUS_DIR, dir, 'sample.json'), 'utf8')
      samples.push(JSON.parse(raw))
    } catch {
      // A half-written sample from an interrupted run is skipped rather than
      // failing the whole read — the corpus is append-only and self-healing.
    }
  }

  return samples
}

/**
 * Drops the oldest samples once the cap is passed.
 *
 * Oldest-first because a UI profile that has since changed is the least useful
 * thing to keep, and because it makes retention predictable.
 */
export const pruneCorpus = async (max = MAX_CORPUS_SAMPLES): Promise<number> => {
  const dirs = await listSampleDirs()
  if (dirs.length <= max) return 0

  const excess = dirs.slice(0, dirs.length - max)
  let removed = 0

  for (const dir of excess) {
    try {
      const path = join(CORPUS_DIR, dir)
      for (const file of await readdir(path)) await unlink(join(path, file))
      const { rmdir } = await import('node:fs/promises')
      await rmdir(path)
      removed += 1
    } catch {
      // Leaving one undeletable sample behind is harmless.
    }
  }

  return removed
}

/**
 * What the archive currently says about the pipeline.
 *
 * The disagreement rate is the headline: it is the first honest measurement of
 * how often the current readers contradict each other, and therefore the
 * baseline that any replacement has to beat.
 */
export interface CorpusStats {
  samples: number
  withTruth: number
  disagreements: number
  refusals: number
  errors: number
  /** Disagreements as a share of samples where at least two readers answered. */
  disagreementRate: number
  /** Wrong stored values among samples that have a confirmed truth. */
  knownWrong: number
  byItem: Record<string, number>
  oldest: string
  newest: string
}

export const summariseCorpus = (samples: CorpusSample[]): CorpusStats => {
  const byItem: Record<string, number> = {}
  let disagreements = 0
  let comparable = 0
  let refusals = 0
  let errors = 0
  let withTruth = 0
  let knownWrong = 0

  for (const sample of samples) {
    byItem[sample.itemKey] = (byItem[sample.itemKey] || 0) + 1
    if (sample.error) errors += 1

    const answered = sample.readings.filter((reading) => reading.value !== null)
    if (sample.readings.length && !answered.length) refusals += 1
    if (answered.length >= 2) {
      comparable += 1
      if (!sample.agreed) disagreements += 1
    }

    if (typeof sample.truth === 'number') {
      withTruth += 1
      if (sample.storedPrice !== sample.truth) knownWrong += 1
    }
  }

  const sorted = samples.map((sample) => sample.capturedAt).sort()

  return {
    samples: samples.length,
    withTruth,
    disagreements,
    refusals,
    errors,
    disagreementRate: comparable ? disagreements / comparable : 0,
    knownWrong,
    byItem,
    oldest: sorted[0] || '',
    newest: sorted[sorted.length - 1] || '',
  }
}

/** Bytes on disk, so the archive's cost is visible rather than discovered. */
export const corpusDiskBytes = async (): Promise<number> => {
  const dirs = await listSampleDirs()
  let total = 0

  for (const dir of dirs) {
    try {
      const path = join(CORPUS_DIR, dir)
      for (const file of await readdir(path)) {
        total += (await stat(join(path, file))).size
      }
    } catch {
      // Skip anything that vanished mid-walk.
    }
  }

  return total
}
