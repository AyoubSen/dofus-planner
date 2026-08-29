import { describe, expect, it } from 'vitest'
import { slugName } from './slugName'

describe('slugName', () => {
  it('strips accents so the two sources spell the same name the same way', () => {
    expect(slugName('Cimetière d\'Astrub')).toBe('cimetieredastrub')
    expect(slugName('Égouts d\'Astrub')).toBe('egoutsdastrub')
    expect(slugName('Île d\'Otomaï')).toBe('iledotomai')
    expect(slugName('Forêt des Abraknydes')).toBe('foretdesabraknydes')
  })

  it('matches across punctuation and spacing differences', () => {
    expect(slugName('Cimetière d\'Astrub')).toBe(slugName('cimetiere d astrub'))
    expect(slugName('Plage de la Tortue')).toBe(slugName('  PLAGE  DE LA TORTUE  '))
  })

  it('keeps digits, which some subzone names carry', () => {
    expect(slugName('Zone 51')).toBe('zone51')
  })

  it('does not collapse genuinely different names', () => {
    expect(slugName('Village d\'Amakna')).not.toBe(slugName('Village des Dopeuls'))
    expect(slugName('Cimetière')).not.toBe(slugName('Cimetière d\'Astrub'))
  })

  it('survives empty and missing input rather than throwing', () => {
    expect(slugName('')).toBe('')
    expect(slugName(undefined as unknown as string)).toBe('')
  })
})
