import { describe, expect, it } from 'vitest'
import { isLocalToolPath, localToolsEnabled } from './localTools'

describe('local tool deployment guard', () => {
  it('recognises owner-only server routes', () => {
    expect(isLocalToolPath('/api/capture/pending')).toBe(true)
    expect(isLocalToolPath('/api/corpus/sample/image')).toBe(true)
    expect(isLocalToolPath('/api/ledger')).toBe(true)
    expect(isLocalToolPath('/api/hdv-scan/results')).toBe(true)
    expect(isLocalToolPath('/api/ocr/hdv-prices')).toBe(true)
    expect(isLocalToolPath('/api/metamob/quest')).toBe(false)
    expect(isLocalToolPath('/api/items/items')).toBe(false)
  })

  it('allows development but rejects production and deployment platforms', () => {
    expect(localToolsEnabled({ NODE_ENV: 'development' })).toBe(true)
    expect(localToolsEnabled({ NODE_ENV: 'production' })).toBe(false)
    expect(localToolsEnabled({ NODE_ENV: 'development', VERCEL: '1' })).toBe(false)
    expect(localToolsEnabled({ NODE_ENV: 'development', NETLIFY: 'true' })).toBe(false)
    expect(localToolsEnabled({ NODE_ENV: 'development', CF_PAGES: '1' })).toBe(false)
  })
})
