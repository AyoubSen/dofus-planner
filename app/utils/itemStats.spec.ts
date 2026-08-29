import { describe, expect, it } from 'vitest'
import {
  CHARACTERISTIC_TO_STAT_KEY,
  findSpecialMageDef,
  hasWholeWordStatAliasMatch,
  normalizeLabelForStatKey,
  statsOcrDefs,
} from './itemStats'

describe('normalizeLabelForStatKey', () => {
  it('strips accents so a stripped-accent scan still matches', () => {
    expect(normalizeLabelForStatKey('Vitalité')).toBe(normalizeLabelForStatKey('Vitalite'))
  })

  it('folds the singular damage spelling onto the plural', () => {
    expect(normalizeLabelForStatKey('Dommage Eau')).toBe('dommages eau')
  })

  it('drops standalone numbers', () => {
    expect(normalizeLabelForStatKey('76 Vitalité')).toBe('vitalite')
  })
})

describe('findSpecialMageDef resolves the longest name, not the first', () => {
  it('does not let PO swallow Dommages Poussée', () => {
    // The live bug: `po` sits earlier in the catalogue and "dommagespoussee"
    // contains "po", so array order decided the answer.
    expect(findSpecialMageDef('Dommages Poussée')?.key).toBe('dommages_poussee')
  })

  it('still resolves a bare PO line', () => {
    expect(findSpecialMageDef('PO')?.key).toBe('po')
    expect(findSpecialMageDef('1 PO')?.key).toBe('po')
  })

  it('keeps Dommages Critiques off plain Dommages', () => {
    expect(findSpecialMageDef('Dommages Critiques')?.key).toBe('dommages_critiques')
  })

  it('resolves the other mage lines', () => {
    expect(findSpecialMageDef('Dommages Distance')?.key).toBe('dommages_distance')
    expect(findSpecialMageDef('Dommages aux Sorts')?.key).toBe('dommages_sort')
    expect(findSpecialMageDef('Dommages au Corps à Corps')?.key).toBe('dommages_melee')
    expect(findSpecialMageDef('Arme de Chasse')?.key).toBe('arme_de_chasse')
  })

  it('does not claim a stat that is not a mage line', () => {
    expect(findSpecialMageDef('Prospection')).toBeUndefined()
    expect(findSpecialMageDef('Vitalité')).toBeUndefined()
    expect(findSpecialMageDef('Tacle')).toBeUndefined()
  })

  it('returns nothing for empty input', () => {
    expect(findSpecialMageDef('')).toBeUndefined()
    expect(findSpecialMageDef('   ')).toBeUndefined()
  })
})

describe('the characteristic map', () => {
  // A wrong entry here is worse than a missing one: the characteristic is
  // trusted ahead of the effect's own French description, so a bad row makes
  // the app insist an item rolls a stat it has never had.
  //
  // Ids and meanings verified against https://api.dofusdb.fr/characteristics
  // and the effect templates that use them.
  it('maps the "(fixe)" twins to resistance, not damage', () => {
    // char 85 = "Poussée (fixe)", effect 416: "… Résistance … Poussée"
    expect(CHARACTERISTIC_TO_STAT_KEY[85]).toBe('resistance_poussee')
    // char 87 = "Critiques (fixe)", effect 420: "… Résistance … Critiques"
    expect(CHARACTERISTIC_TO_STAT_KEY[87]).toBe('resistance_critique')
  })

  it('keeps the bare twins on damage', () => {
    // char 84 = "Poussée", effect 414: "… Dommage … Poussée"
    expect(CHARACTERISTIC_TO_STAT_KEY[84]).toBe('dommages_poussee')
    // char 86 = "Critiques", effect 418: "… Dommage … Critiques"
    expect(CHARACTERISTIC_TO_STAT_KEY[86]).toBe('dommages_critiques')
  })

  it('never maps a damage id and its resistance twin to the same key', () => {
    for (const [damageId, resistanceId] of [[84, 85], [86, 87]]) {
      expect(CHARACTERISTIC_TO_STAT_KEY[damageId!])
        .not.toBe(CHARACTERISTIC_TO_STAT_KEY[resistanceId!])
    }
  })

  it('maps elemental damage ids to damage, not resistance', () => {
    // 88-92 are the bare elemental ids; effect 422 (char 88) is "Dommage Terre".
    expect(CHARACTERISTIC_TO_STAT_KEY[88]).toBe('dommages_terre')
    expect(CHARACTERISTIC_TO_STAT_KEY[92]).toBe('dommages_neutre')
  })

  // Phase 0a. 33-37 and 54-58 both pointed at the same five keys, so an item
  // with both kinds of resistance reported one, and a flat value could be
  // scored against a percentage roll's bounds.
  it('keeps percentage and flat elemental resistance apart', () => {
    // DofusDB: 33-37 are "Terre (%)" … "Neutre (%)".
    expect(CHARACTERISTIC_TO_STAT_KEY[33]).toBe('resistance_terre')
    expect(CHARACTERISTIC_TO_STAT_KEY[37]).toBe('resistance_neutre')
    // DofusDB: 54-58 are "Terre (fixe)" … "Neutre (fixe)".
    expect(CHARACTERISTIC_TO_STAT_KEY[54]).toBe('resistance_terre_fixe')
    expect(CHARACTERISTIC_TO_STAT_KEY[58]).toBe('resistance_neutre_fixe')

    for (const [percentId, flatId] of [[33, 54], [34, 55], [35, 56], [36, 57], [37, 58]]) {
      expect(CHARACTERISTIC_TO_STAT_KEY[percentId!])
        .not.toBe(CHARACTERISTIC_TO_STAT_KEY[flatId!])
    }
  })

  it('marks the percentage resistances with a % suffix and the flat ones without', () => {
    const def = (key: string) => statsOcrDefs.find((entry) => entry.key === key)!
    expect(def('resistance_terre').suffix).toBe('%')
    expect(def('resistance_terre_fixe').suffix).toBeFalsy()
  })

  it('points every mapped id at a stat that exists in the catalogue', () => {
    const keys = new Set(statsOcrDefs.map((def) => def.key))
    for (const [id, key] of Object.entries(CHARACTERISTIC_TO_STAT_KEY)) {
      expect(keys.has(key), `characteristic ${id} -> unknown stat "${key}"`).toBe(true)
    }
  })
})

describe('catalogue integrity', () => {
  it('has no duplicate keys', () => {
    const keys = statsOcrDefs.map((def) => def.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('gives every def a label and at least one alias', () => {
    for (const def of statsOcrDefs) {
      expect(def.label.length).toBeGreaterThan(0)
      expect(def.aliases.length).toBeGreaterThan(0)
    }
  })
})

describe('hasWholeWordStatAliasMatch', () => {
  it('matches a whole word inside a longer label', () => {
    expect(hasWholeWordStatAliasMatch('esquive pm', 'esquive pm')).toBe(true)
  })

  it('refuses a fragment', () => {
    expect(hasWholeWordStatAliasMatch('prospection', 'prospe')).toBe(false)
  })
})
