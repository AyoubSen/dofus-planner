import { describe, expect, it } from 'vitest'
import {
  applyFocus,
  breakEvenCoefficient,
  buildRuneFamilies,
  calibratePoids,
  computeRuneYield,
  linePoids,
  planTiers,
  poidsTableVerified,
  runeFamilies,
  statPoidsTable,
  tierMultipliers,
  toExpectedRuneOutputs,
} from './runeYield'

describe('buildRuneFamilies', () => {
  it('groups the three tiers of a family under one entry', () => {
    const families = buildRuneFamilies([
      { id: 1519, name: 'Rune Fo' },
      { id: 1545, name: 'Rune Pa Fo' },
      { id: 1551, name: 'Rune Ra Fo' },
    ])
    expect(families.get('Fo')?.tiers).toEqual({
      ga: { runeId: 1519, runeName: 'Rune Fo', tier: 'ga' },
      pa: { runeId: 1545, runeName: 'Rune Pa Fo', tier: 'pa' },
      ra: { runeId: 1551, runeName: 'Rune Ra Fo', tier: 'ra' },
    })
  })

  it('reads an explicit Ga prefix as the base tier, not as a family name', () => {
    // "Rune Ga Pa" is the base PA rune. Treating "Ga Pa" as a family name would
    // orphan it from the pa/ra tiers and silently drop PA yield.
    const families = buildRuneFamilies([{ id: 1557, name: 'Rune Ga Pa' }])
    expect(families.get('Pa')?.tiers.ga?.runeId).toBe(1557)
    expect(families.has('Ga Pa')).toBe(false)
  })

  it('keeps percentage and flat resistance in separate families', () => {
    // "Per" means pourcentage. These are different stats with different prices,
    // so collapsing them would misprice every resistance break.
    expect(runeFamilies.get('Ré Air')?.tiers.ga?.runeId).toBe(7453)
    expect(runeFamilies.get('Ré Per Air')?.tiers.ga?.runeId).toBe(7458)
  })
})

describe('poids table integrity', () => {
  it('ships unverified so nothing downstream can trust it by accident', () => {
    expect(poidsTableVerified).toBe(false)
  })

  it('maps every stat to a rune family that actually exists', () => {
    const missing = Object.entries(statPoidsTable)
      .filter(([, entry]) => !runeFamilies.has(entry.family))
      .map(([key, entry]) => `${key} -> ${entry.family}`)
    expect(missing).toEqual([])
  })

  it('never assigns two stats to the same rune family', () => {
    const seen = new Map<string, string>()
    const collisions: string[] = []
    for (const [key, entry] of Object.entries(statPoidsTable)) {
      const previous = seen.get(entry.family)
      if (previous) collisions.push(`${previous} and ${key} both claim ${entry.family}`)
      seen.set(entry.family, key)
    }
    expect(collisions).toEqual([])
  })
})

describe('linePoids', () => {
  it('multiplies the rolled value by the stat poids', () => {
    expect(linePoids({ key: 'vitalite', value: 50 })).toBe(50)
    expect(linePoids({ key: 'sagesse', value: 10 })).toBe(30)
  })

  it('returns zero for a stat with no poids entry', () => {
    expect(linePoids({ key: 'arme_de_chasse', value: 1 })).toBe(0)
  })

  it('honours an override, which is how a calibrated table is applied', () => {
    expect(linePoids({ key: 'vitalite', value: 50 }, { vitalite: 2 })).toBe(100)
  })
})

describe('applyFocus', () => {
  it('is a no-op without a focus target', () => {
    const poids = new Map([['force', 10], ['vitalite', 40]])
    expect(applyFocus(poids, null, 0.5)).toBe(poids)
  })

  it('redirects a fraction of the other stats into the focused one', () => {
    const poids = new Map([['force', 10], ['vitalite', 40]])
    const focused = applyFocus(poids, 'force', 0.5)
    expect([...focused.entries()]).toEqual([['force', 30]])
  })

  it('loses total poids, so focus is a real trade and not free', () => {
    const poids = new Map([['force', 10], ['vitalite', 40]])
    const before = [...poids.values()].reduce((a, b) => a + b, 0)
    const after = [...applyFocus(poids, 'force', 0.5).values()].reduce((a, b) => a + b, 0)
    expect(after).toBeLessThan(before)
  })

  it('ignores a focus target the item does not carry', () => {
    const poids = new Map([['force', 10]])
    expect(applyFocus(poids, 'chance', 0.5)).toBe(poids)
  })
})

describe('computeRuneYield', () => {
  const statLines = [
    { key: 'vitalite', value: 50 },
    { key: 'sagesse', value: 10 },
  ]

  it('scales linearly with the coefficient', () => {
    const at100 = computeRuneYield(statLines, { coefficientPercent: 100 })
    const at50 = computeRuneYield(statLines, { coefficientPercent: 50 })
    expect(at50.totalPoids).toBe(at100.totalPoids)
    expect(at50.lines[0]!.gaEquivalent).toBeCloseTo(at100.lines[0]!.gaEquivalent / 2)
  })

  it('reports the fractional remainder as a chance rather than rounding it away', () => {
    // 50 vitalite at 87% is 43.5 runes: 43 certain, plus a coin flip. Rounding
    // that off would systematically understate a batch.
    const result = computeRuneYield([{ key: 'vitalite', value: 50 }], { coefficientPercent: 87 })
    const line = result.lines[0]!
    expect(line.guaranteed).toBe(43)
    expect(line.fractionalChance).toBeCloseTo(0.5)
    expect(line.expected).toBeCloseTo(43.5)
  })

  it('collects stats it cannot price instead of silently dropping them', () => {
    const result = computeRuneYield([...statLines, { key: 'arme_de_chasse', value: 1 }])
    expect(result.unmappedStatKeys).toEqual(['arme_de_chasse'])
  })

  it('does not report a zero-valued unmapped stat as a gap', () => {
    const result = computeRuneYield([{ key: 'arme_de_chasse', value: 0 }])
    expect(result.unmappedStatKeys).toEqual([])
  })

  it('marks output unverified while the poids table is unverified', () => {
    expect(computeRuneYield(statLines).verified).toBe(false)
  })

  it('concentrates output into one rune when focused', () => {
    const result = computeRuneYield(statLines, { focusStatKey: 'sagesse', focusEfficiency: 0.5 })
    expect(result.lines).toHaveLength(1)
    expect(result.lines[0]!.statKey).toBe('sagesse')
    // 30 own poids + half of vitalite's 50
    expect(result.lines[0]!.gaEquivalent).toBeCloseTo(55)
  })

  it('sorts the biggest yield first', () => {
    const result = computeRuneYield(statLines)
    expect(result.lines.map(line => line.statKey)).toEqual(['vitalite', 'sagesse'])
  })

  it('applies calibrated poids when supplied', () => {
    const result = computeRuneYield([{ key: 'vitalite', value: 10 }], {
      poidsOverrides: { vitalite: 4 },
    })
    expect(result.lines[0]!.gaEquivalent).toBe(40)
  })
})

describe('planTiers', () => {
  it('packs into the densest tiers first', () => {
    expect(planTiers(100)).toEqual({ ra: 11, pa: 0, ga: 1 })
  })

  it('leaves a sub-Pa remainder as basic runes', () => {
    expect(planTiers(2)).toEqual({ ra: 0, pa: 0, ga: 2 })
  })

  it('conserves total value across the split', () => {
    const plan = planTiers(100)
    expect(plan.ra * tierMultipliers.ra + plan.pa * tierMultipliers.pa + plan.ga).toBe(100)
  })
})

describe('toExpectedRuneOutputs', () => {
  it('produces the shape brisageOpportunities already consumes', () => {
    const result = computeRuneYield([{ key: 'vitalite', value: 50 }])
    expect(toExpectedRuneOutputs(result)).toEqual([
      { runeName: 'Rune Vi', runeId: 1523, quantity: 50 },
    ])
  })

  it('divides the quantity when reporting a higher tier', () => {
    const result = computeRuneYield([{ key: 'vitalite', value: 90 }])
    expect(toExpectedRuneOutputs(result, 'ra')).toEqual([
      { runeName: 'Rune Ra Vi', runeId: 1554, quantity: 10 },
    ])
  })

  it('falls back to the base rune when a family has no such tier', () => {
    // Invo has no Pa tier; asking for one must not drop the line entirely.
    const result = computeRuneYield([{ key: 'invocation', value: 1 }])
    expect(toExpectedRuneOutputs(result, 'pa')).toEqual([
      { runeName: 'Rune Invo', runeId: 7442, quantity: 30 },
    ])
  })
})

describe('breakEvenCoefficient', () => {
  it('is the coefficient at which breaking exactly repays the cost', () => {
    expect(breakEvenCoefficient(50_000, 100_000)).toBe(50)
  })

  it('returns null rather than Infinity when runes are worthless', () => {
    expect(breakEvenCoefficient(50_000, 0)).toBeNull()
  })
})

describe('calibratePoids', () => {
  it('recovers the poids per point from clean observations', () => {
    const result = calibratePoids([
      {
        statLines: [{ key: 'vitalite', value: 50 }],
        coefficientPercent: 100,
        observedGaEquivalent: { vitalite: 100 },
      },
      {
        statLines: [{ key: 'vitalite', value: 20 }],
        coefficientPercent: 50,
        observedGaEquivalent: { vitalite: 20 },
      },
    ])
    expect(result.poidsPerPoint.vitalite).toBeCloseTo(2)
    expect(result.sampleCount.vitalite).toBe(2)
  })

  it('takes the median so one bad break cannot drag the estimate', () => {
    const observation = (observed: number) => ({
      statLines: [{ key: 'force', value: 10 }],
      coefficientPercent: 100,
      observedGaEquivalent: { force: observed },
    })
    const result = calibratePoids([observation(10), observation(10), observation(500)])
    expect(result.poidsPerPoint.force).toBeCloseTo(1)
  })

  it('reports dispersion so disagreeing estimates are visible', () => {
    const observation = (observed: number) => ({
      statLines: [{ key: 'force', value: 10 }],
      coefficientPercent: 100,
      observedGaEquivalent: { force: observed },
    })
    const tight = calibratePoids([observation(10), observation(10)])
    const loose = calibratePoids([observation(10), observation(10), observation(500)])
    expect(tight.dispersion.force).toBeCloseTo(0)
    expect(loose.dispersion.force).toBeGreaterThan(1)
  })

  it('skips focused breaks, which would confound two unknowns', () => {
    const result = calibratePoids([
      {
        statLines: [{ key: 'force', value: 10 }],
        coefficientPercent: 100,
        focusStatKey: 'force',
        observedGaEquivalent: { force: 999 },
      },
    ])
    expect(result.poidsPerPoint.force).toBeUndefined()
  })
})
