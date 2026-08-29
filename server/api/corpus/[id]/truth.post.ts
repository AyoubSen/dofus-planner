import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CORPUS_DIR } from '../../../utils/corpusStore'

/**
 * Records what a capture actually said.
 *
 * This is the step that turns an archive into a measurement. Without a
 * confirmed truth a sample can only ever tell you whether two readers agreed,
 * and agreement is not correctness — they share a crop and a segmentation, so
 * they fail together.
 *
 * Confirming is deliberately cheap and correcting is deliberately explicit: the
 * common case is "yes, that is what it said", and making that one click is what
 * decides whether a corpus ever actually gets labelled.
 */
export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') || '')
  if (!/^[0-9TZ:.-]+-[a-z0-9]{6}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad sample id' })
  }

  const body = await readBody<{ truth?: number | null }>(event)
  const path = join(CORPUS_DIR, id, 'sample.json')

  let sample: any
  try {
    sample = JSON.parse(await readFile(path, 'utf8'))
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'No such sample' })
  }

  if (body?.truth === null) {
    // Clearing a truth is allowed: a mis-click that silently became ground
    // truth would poison the very measurement this exists to produce.
    delete sample.truth
  } else {
    const truth = Number(body?.truth)
    if (!Number.isFinite(truth) || truth <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Truth must be a positive number' })
    }
    sample.truth = Math.round(truth)
  }

  sample.reviewedAt = new Date().toISOString()
  await writeFile(path, JSON.stringify(sample, null, 2), 'utf8')

  return { id, truth: sample.truth ?? null }
})
