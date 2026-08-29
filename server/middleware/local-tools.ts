import { isLocalToolPath, localToolsEnabled } from '../utils/localTools'

export default defineEventHandler((event) => {
  if (!isLocalToolPath(getRequestURL(event).pathname) || localToolsEnabled()) return

  throw createError({ statusCode: 404, statusMessage: 'Not found' })
})
