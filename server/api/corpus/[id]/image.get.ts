import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CORPUS_DIR } from '../../../utils/corpusStore'

/** Serves one archived crop so the review page can show what was actually read. */
export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') || '')
  const which = String(getQuery(event)?.which || 'strip')

  // The id comes from the URL and is used to build a path, so it is checked
  // against the shape ids are actually generated with rather than merely
  // scanned for "..". Anything else does not get near the filesystem.
  if (!/^[0-9TZ:.-]+-[a-z0-9]{6}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad sample id' })
  }
  if (which !== 'strip' && which !== 'tooltip') {
    throw createError({ statusCode: 400, statusMessage: 'Bad image name' })
  }

  try {
    const buffer = await readFile(join(CORPUS_DIR, id, `${which}.png`))
    setHeader(event, 'content-type', 'image/png')
    // Archived crops never change once written.
    setHeader(event, 'cache-control', 'private, max-age=31536000, immutable')
    return buffer
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'No such image' })
  }
})
