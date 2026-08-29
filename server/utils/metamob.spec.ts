import { describe, expect, it } from 'vitest'
import { parseMetamobCredentials } from './metamob'

describe('MetaMob request credentials', () => {
  it('reads credentials supplied by one browser session', () => {
    expect(parseMetamobCredentials(
      'token-value',
      encodeURIComponent('player name'),
      encodeURIComponent('quest/slug'),
    )).toEqual({
      token: 'token-value',
      username: 'player name',
      questSlug: 'quest/slug',
    })
  })

  it('requires both a token and username', () => {
    expect(parseMetamobCredentials('', 'player')).toBeNull()
    expect(parseMetamobCredentials('token', '')).toBeNull()
  })

  it('rejects malformed or oversized headers', () => {
    expect(parseMetamobCredentials('token', '%E0%A4%A')).toBeNull()
    expect(parseMetamobCredentials('x'.repeat(501), 'player')).toBeNull()
    expect(parseMetamobCredentials('token', 'x'.repeat(101))).toBeNull()
  })
})
