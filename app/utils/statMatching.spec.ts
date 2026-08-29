import { describe, expect, it } from 'vitest'
import {
  CATALOGUE_ACCEPT_THRESHOLD,
  editDistance,
  extractValues,
  matchStatLines,
  pickValue,
  scoreCandidate,
  similarity,
} from './statMatching'
import type { CandidateLine } from './statMatching'
import { statsOcrDefs } from './itemStats'

/** A plausible damage-and-vitality item that also rolls water damage. */
const damageItem: CandidateLine[] = [
  { statKey: 'dommages', label: 'Dommages', min: 11, max: 20 },
  { statKey: 'dommages_eau', label: 'Dommages Eau', min: 5, max: 12 },
  { statKey: 'vitalite', label: 'Vitalité', min: 51, max: 80 },
  { statKey: 'pa', label: 'PA', min: 1, max: 1 },
]

const dodgeItem: CandidateLine[] = [
  { statKey: 'esquive_pm', label: 'Esquive PM', min: 3, max: 8 },
  { statKey: 'pm', label: 'PM', min: 1, max: 1 },
  { statKey: 'prospection', label: 'Prospection', min: 10, max: 20 },
]

const keysOf = (lines: string[], expected: CandidateLine[]) =>
  matchStatLines(lines, expected).entries.map((entry) => entry.key)

const matchFor = (lines: string[], expected: CandidateLine[], key: string) =>
  matchStatLines(lines, expected).entries.find((entry) => entry.key === key)

describe('editDistance', () => {
  it('counts a substitution as one', () => {
    expect(editDistance('dommages', 'dommaqes')).toBe(1)
  })

  it('counts an adjacent transposition as one', () => {
    expect(editDistance('vitalite', 'vitaltie')).toBe(1)
  })

  it('handles the empty cases', () => {
    expect(editDistance('', 'abc')).toBe(3)
    expect(editDistance('abc', 'abc')).toBe(0)
  })
})

describe('similarity does not let a prefix impersonate the whole name', () => {
  it('scores an exact match at 1', () => {
    expect(similarity('Dommages Eau', 'Dommages Eau')).toBe(1)
  })

  it('ranks the qualified name above the bare one for a qualified line', () => {
    expect(similarity('Dommages Eau', 'Dommages Eau'))
      .toBeGreaterThan(similarity('Dommages Eau', 'Dommages'))
  })

  it('ranks the bare name above the qualified one for a bare line', () => {
    expect(similarity('Dommages', 'Dommages'))
      .toBeGreaterThan(similarity('Dommages', 'Dommages Eau'))
  })

  it('tolerates a misread character', () => {
    expect(similarity('Dommaqes Eau', 'Dommages Eau')).toBeGreaterThan(0.7)
  })

  it('tolerates a stripped accent', () => {
    expect(similarity('Vitalite', 'Vitalité')).toBe(1)
    expect(similarity('Resistance Feu', 'Résistance Feu')).toBe(1)
  })
})

describe('the reported confusions', () => {
  it('keeps Dommages and Dommages Eau apart', () => {
    const result = matchStatLines(['20 Dommages', '11 Dommages Eau'], damageItem)
    expect(result.entries.find((e) => e.raw === '20 Dommages')?.key).toBe('dommages')
    expect(result.entries.find((e) => e.raw === '11 Dommages Eau')?.key).toBe('dommages_eau')
  })

  it('keeps them apart when the water line is misread', () => {
    const result = matchStatLines(['20 Dommages', '11 Dommaqes Eav'], damageItem)
    expect(result.entries.find((e) => e.raw === '20 Dommages')?.key).toBe('dommages')
    expect(result.entries.find((e) => e.raw === '11 Dommaqes Eav')?.key).toBe('dommages_eau')
  })

  it('keeps Esquive PM and PM apart', () => {
    const result = matchStatLines(['1 PM', '6 Esquive PM'], dodgeItem)
    expect(result.entries.find((e) => e.raw === '1 PM')?.key).toBe('pm')
    expect(result.entries.find((e) => e.raw === '6 Esquive PM')?.key).toBe('esquive_pm')
  })

  it('does not let PO swallow Prospection', () => {
    expect(matchFor(['15 Prospection'], dodgeItem, 'prospection')).toBeTruthy()
    expect(keysOf(['15 Prospection'], dodgeItem)).not.toContain('po')
  })

  it('never assigns two lines to the same stat', () => {
    const keys = keysOf(['20 Dommages', '18 Dommages', '11 Dommages Eau'], damageItem)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('a value glued to the stat name', () => {
  // Observed for real: tesseract reads "1 PA" as "1PA" on short lines, which
  // defeated the old exact matcher entirely — the line just disappeared.
  it('reads a glued fixed line', () => {
    const match = matchFor(['1PA'], damageItem, 'pa')
    expect(match).toBeTruthy()
    expect(match!.value).toBe(1)
  })

  it('reads a glued ordinary line', () => {
    const match = matchFor(['76Vitalité'], damageItem, 'vitalite')
    expect(match).toBeTruthy()
    expect(match!.value).toBe(76)
  })
})

describe('one-to-one assignment', () => {
  it('pushes the weaker line onto its next-best candidate', () => {
    // Both lines read as plain "Dommages"; only one can have it.
    const result = matchStatLines(['20 Dommages', '9 Dommages Eau'], damageItem)
    expect(result.entries.map((e) => e.key).sort()).toEqual(['dommages', 'dommages_eau'])
  })

  it('leaves a genuinely unreadable line unmatched instead of forcing it', () => {
    const result = matchStatLines(['20 Dommages', '### ????'], damageItem)
    expect(result.entries).toHaveLength(1)
    expect(result.unmatched).toHaveLength(1)
    expect(result.unmatched[0]!.raw).toBe('### ????')
  })

  it('reports a best guess on an unmatched line', () => {
    const result = matchStatLines(['xyzzy'], damageItem)
    expect(result.unmatched[0]!.bestScore).toBeLessThan(CATALOGUE_ACCEPT_THRESHOLD)
  })
})

describe('lines the item cannot roll', () => {
  it('still resolves an exo PA via the global catalogue', () => {
    // dodgeItem has no PA line at all; an exo'd PA is real and must survive.
    const result = matchStatLines(['1 PA', '6 Esquive PM'], dodgeItem)
    const pa = result.entries.find((entry) => entry.key === 'pa')
    expect(pa).toBeTruthy()
    expect(pa!.source).toBe('catalogue')
  })

  it('prefers the item&apos;s own lines over the catalogue', () => {
    const result = matchStatLines(['70 Vitalité'], damageItem)
    expect(result.entries[0]!.source).toBe('expected')
  })

  it('holds the catalogue to a stricter bar', () => {
    // A mangled line the item cannot roll: better unmatched than mislabelled.
    const result = matchStatLines(['7 Esqvv PZ'], damageItem)
    expect(result.entries).toHaveLength(0)
  })
})

describe('values', () => {
  it('ignores numbers inside a range span', () => {
    expect(extractValues('20 Dommages [11 à 20]')).toEqual([20])
  })

  it('takes the rolled value, not a leading range', () => {
    expect(pickValue('[11 à 20] 18 Dommages', damageItem[0]!)).toBe(18)
  })

  it('picks the in-range number when an icon digit leads', () => {
    expect(pickValue('7 70 Vitalité', damageItem[2]!)).toBe(70)
  })

  it('accepts an overmaged value above max', () => {
    expect(pickValue('24 Dommages', damageItem[0]!)).toBe(24)
  })

  it('returns null when there is no number and the stat is not binary', () => {
    expect(pickValue('Dommages', damageItem[0]!)).toBeNull()
  })
})

describe('range text comes from the item, not the screenshot', () => {
  it('uses the official bounds even when the line carries none', () => {
    expect(matchFor(['18 Dommages'], damageItem, 'dommages')!.rangeText).toBe('[11 à 20]')
  })

  it('collapses a fixed line to a single bound', () => {
    expect(matchFor(['1 PA'], damageItem, 'pa')!.rangeText).toBe('[1]')
  })

  it('overrides a misread range from the screenshot', () => {
    expect(matchFor(['18 Dommages [11 à 2O]'], damageItem, 'dommages')!.rangeText)
      .toBe('[11 à 20]')
  })
})

describe('scoreCandidate', () => {
  it('rewards a value that fits the bounds', () => {
    const fits = scoreCandidate('70 Vitalité', damageItem[2]!)
    const doesNot = scoreCandidate('3 Vitalité', damageItem[2]!)
    expect(fits).toBeGreaterThan(doesNot)
  })

  it('rewards suffix agreement', () => {
    const percentCandidate: CandidateLine = {
      statKey: 'resistance_feu',
      label: 'Résistance Feu',
      min: 1,
      max: 10,
      suffix: '%',
    }
    expect(scoreCandidate('6% Résistance Feu', percentCandidate))
      .toBeGreaterThan(scoreCandidate('6 Résistance Feu', percentCandidate))
  })
})

describe('every stat in the catalogue resolves to itself', () => {
  // The confusions reported all involve names that contain another name
  // ("Dommages" inside "Dommages Eau", "PM" inside "Esquive PM"). Sweeping the
  // whole catalogue catches the rest of that family before a user does.
  it.each(statsOcrDefs.map((def) => [def.key, def.label] as const))(
    'reads a clean %s line correctly',
    (key, label) => {
      const line = `${key === 'arme_de_chasse' ? '' : '7 '}${label}`
      const result = matchStatLines([line], [])
      expect(result.entries[0]?.key).toBe(key)
    },
  )

  it.each(statsOcrDefs.map((def) => [def.key, def.label] as const))(
    'reads a %s line with one misread character correctly',
    (key, label) => {
      // Swap a middle character for a lookalike, the commonest OCR failure.
      const damaged = label.length > 5
        ? `${label.slice(0, 3)}${label[3] === 'o' ? '0' : 'o'}${label.slice(4)}`
        : label
      const line = `${key === 'arme_de_chasse' ? '' : '7 '}${damaged}`
      const result = matchStatLines([line], [])
      expect(result.entries[0]?.key).toBe(key)
    },
  )
})

describe('a whole tooltip at once', () => {
  it('reads every line of a realistic item', () => {
    const expected: CandidateLine[] = [
      { statKey: 'vitalite', label: 'Vitalité', min: 51, max: 80 },
      { statKey: 'force', label: 'Force', min: 21, max: 40 },
      { statKey: 'dommages', label: 'Dommages', min: 11, max: 20 },
      { statKey: 'dommages_terre', label: 'Dommages Terre', min: 5, max: 12 },
      { statKey: 'critique', label: 'Critique', min: 1, max: 3, suffix: '%' },
      { statKey: 'pa', label: 'PA', min: 1, max: 1 },
    ]
    const lines = [
      '76 Vitalité',
      '38 Force',
      '18 Dommages',
      '11 Dommages Terre',
      '3% Critique',
      '1 PA',
    ]
    const result = matchStatLines(lines, expected)

    expect(result.unmatched).toHaveLength(0)
    expect(result.entries.map((e) => e.key)).toEqual([
      'vitalite', 'force', 'dommages', 'dommages_terre', 'critique', 'pa',
    ])
    expect(result.entries.map((e) => e.value)).toEqual([76, 38, 18, 11, 3, 1])
  })

  it('survives the same tooltip after a bad scan', () => {
    const expected: CandidateLine[] = [
      { statKey: 'vitalite', label: 'Vitalité', min: 51, max: 80 },
      { statKey: 'dommages', label: 'Dommages', min: 11, max: 20 },
      { statKey: 'dommages_terre', label: 'Dommages Terre', min: 5, max: 12 },
      { statKey: 'esquive_pm', label: 'Esquive PM', min: 3, max: 8 },
    ]
    const lines = ['76 Vitalite', '18 Dommaqes', '11 Dommages Terre', '6 Esqvive PM']
    const result = matchStatLines(lines, expected)

    expect(result.entries.map((e) => e.key)).toEqual([
      'vitalite', 'dommages', 'dommages_terre', 'esquive_pm',
    ])
  })
})

describe('Cape au Logis — a real capture that failed', () => {
  // The item's real roll table (DofusDB item 14168). Note characteristic 87 is
  // Résistance Critiques, which the app used to mis-map onto Dommages
  // Critiques — so it reported a missing stat the cape never had, and then
  // refused the correctly-read line that would have filled it.
  const capeAuLogis: CandidateLine[] = [
    { statKey: 'vitalite', label: 'Vitalité', min: 301, max: 350 },
    { statKey: 'force', label: 'Force', min: 71, max: 100 },
    { statKey: 'critique', label: 'Critique', min: 4, max: 6, suffix: '%' },
    { statKey: 'pm', label: 'PM', min: 1, max: 1 },
    { statKey: 'dommages_neutre', label: 'Dommages Neutre', min: 14, max: 18 },
    { statKey: 'dommages_terre', label: 'Dommages Terre', min: 14, max: 18 },
    { statKey: 'resistance_feu', label: 'Résistance Feu', min: 7, max: 10, suffix: '%' },
    { statKey: 'resistance_eau', label: 'Résistance Eau', min: 6, max: 8, suffix: '%' },
    { statKey: 'resistance_air', label: 'Résistance Air', min: 4, max: 5, suffix: '%' },
    { statKey: 'resistance_critique', label: 'Résistance Critique', min: 11, max: 15 },
  ]

  const scanned = [
    '350 Vitalité [301 à 350]',
    '95 Force [71 à 100]',
    '6% Critique [4 à 6]',
    '1 PM [1]',
    '2 Dommages Neutre [14 à 18]',
    '18 Dommages Terre [14 à 18]',
    '10% Résistance Feu [7 à 10]',
    '8% Résistance Eau [6 à 8]',
    '5% Résistance Air [4 à 5]',
    '0 Résistance Critiques [11 à 15]',
  ]

  it('places every line, leaving nothing unattributed', () => {
    const result = matchStatLines(scanned, capeAuLogis)
    expect(result.unmatched).toHaveLength(0)
    expect(result.entries).toHaveLength(10)
  })

  it('reads the critical resistance line that used to be rejected', () => {
    const match = matchFor(scanned, capeAuLogis, 'resistance_critique')
    expect(match).toBeTruthy()
    expect(match!.value).toBe(0)
    expect(match!.source).toBe('expected')
  })

  it('does not invent a critical damage stat', () => {
    expect(keysOf(scanned, capeAuLogis)).not.toContain('dommages_critiques')
  })

  it('keeps the plural form scoring as a strong match', () => {
    // "Résistance Critiques" vs "Résistance Critique" scored 0.75 while the
    // bracketed range leaked into the comparison; it should be near-perfect.
    expect(similarity('0 Résistance Critiques [11 à 15]', 'Résistance Critique'))
      .toBeGreaterThan(0.9)
  })

  it('keeps every value, including a zero roll', () => {
    const result = matchStatLines(scanned, capeAuLogis)
    const byKey = Object.fromEntries(result.entries.map((e) => [e.key, e.value]))
    expect(byKey).toMatchObject({
      vitalite: 350,
      force: 95,
      critique: 6,
      pm: 1,
      dommages_neutre: 2,
      dommages_terre: 18,
      resistance_feu: 10,
      resistance_eau: 8,
      resistance_air: 5,
      resistance_critique: 0,
    })
  })
})

describe('empty and degenerate input', () => {
  it('copes with no lines', () => {
    expect(matchStatLines([], damageItem).entries).toHaveLength(0)
  })

  it('copes with no expected lines by falling back to the catalogue', () => {
    const result = matchStatLines(['70 Vitalité'], [])
    expect(result.entries[0]?.key).toBe('vitalite')
    expect(result.entries[0]?.source).toBe('catalogue')
  })
})

describe('a short stat name with one bad character', () => {
  const capeLines: CandidateLine[] = [
    { statKey: 'vitalite', label: 'Vitalité', min: 301, max: 350 },
    { statKey: 'force', label: 'Force', min: 71, max: 100 },
    { statKey: 'pm', label: 'PM', min: 1, max: 1 },
  ]

  it('rescues PM when the P was read as an F', () => {
    // Straight from a real capture: "1 PM [1]" came back as "1FM 1]", and PM
    // was reported missing on an item that plainly had it.
    const match = matchFor(['324 Vitalité', '100 Force', '1FM 1]'], capeLines, 'pm')
    expect(match).toBeTruthy()
    expect(match!.value).toBe(1)
  })

  it('refuses to guess when the item could roll PA as well', () => {
    // PA, PM and PO are all one edit apart; picking between them would be a
    // coin toss, and a wrong mage stat is worse than a missing one.
    const ambiguous: CandidateLine[] = [
      ...capeLines,
      { statKey: 'pa', label: 'PA', min: 1, max: 1 },
    ]
    // 'pn' sits one edit from both PM and PA, so there is no honest answer.
    const result = matchStatLines(['324 Vitalité', '1PN 1]'], ambiguous)
    expect(result.entries.some((entry) => entry.raw === '1PN 1]')).toBe(false)
  })

  it('does not rescue a line whose value cannot fit', () => {
    const result = matchStatLines(['350 FM'], capeLines)
    expect(result.entries.some((entry) => entry.key === 'pm')).toBe(false)
  })

  it('leaves long names to the normal matcher', () => {
    // The rescue is only for names too short to survive a single bad character.
    const result = matchStatLines(['324 VitalitX'], capeLines)
    expect(result.entries.find((entry) => entry.key === 'vitalite')).toBeTruthy()
  })

  it('does not claim a stat that is already matched', () => {
    const result = matchStatLines(['1 PM [1]', '1FM 1]'], capeLines)
    expect(result.entries.filter((entry) => entry.key === 'pm')).toHaveLength(1)
  })
})
