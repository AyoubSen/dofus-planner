const LOCAL_TOOL_PREFIXES = [
  '/api/capture',
  '/api/corpus',
  '/api/ledger',
  '/api/hdv-scan',
]

const LOCAL_TOOL_ROUTES = new Set(['/api/ocr/hdv-prices'])

export const isLocalToolPath = (path: string) =>
  LOCAL_TOOL_ROUTES.has(path)
  || LOCAL_TOOL_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))

export const localToolsEnabled = (env: Record<string, string | undefined> = process.env) =>
  env.NODE_ENV !== 'production' && !env.VERCEL && !env.NETLIFY && !env.CF_PAGES
