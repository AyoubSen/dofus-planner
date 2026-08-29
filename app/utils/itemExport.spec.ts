import { describe, expect, it } from 'vitest'
import { buildItemExport, itemExportFilename } from './itemExport'
import { emptyPriorityProfiles, valueObservations } from './itemValuation'
import type { ExpectedLine, ObservedPrice } from './itemValuation'

const expectedLines: ExpectedLine[] = [
  { statKey: 'vitalite', label: 'Vitalité', min: 301, max: 350 },
  { statKey: 'pm', label: 'PM', min: 1, max: 1 },
  { statKey: 'dommages_terre', label: 'Dommages Terre', min: 7, max: 10 },
]

let counter = 0
const listing = (price: number, values: Record<string, number>): ObservedPrice => ({
  id: `obs-${(counter += 1)}`,
  itemKey: 'bottes-du-cycloide',
  itemName: 'Bottes du Cycloïde',
  price,
  createdAt: '2026-08-09T12:00:00.000Z',
  source: 'ocr',
  statsEntries: Object.entries(values).map(([key, value]) => ({
    key, label: key, value, suffix: '', rangeText: '',
  })),
})

const priorities = { pm: 'critical' as const }

const exportOf = (observations: ObservedPrice[]) => {
  const run = valueObservations({
    observations,
    expectedLines,
    itemKey: 'bottes-du-cycloide',
    // The same priorities the export reports, or the two would disagree.
    profiles: { ...emptyPriorityProfiles(), byItem: { 'bottes-du-cycloide': priorities } },
  })
  return buildItemExport({
    itemKey: 'bottes-du-cycloide',
    itemName: 'Bottes du Cycloïde',
    expectedLines,
    priorities,
    results: run.results,
  })
}

const market = () => [
  listing(3000000, { vitalite: 350, pm: 1, dommages_terre: 10 }),
  listing(2400000, { vitalite: 330, pm: 1, dommages_terre: 9 }),
  listing(1800000, { vitalite: 320, dommages_terre: 8 }),
  listing(1500000, { vitalite: 305, dommages_terre: 7 }),
]

describe('the export carries the arithmetic, not just the answer', () => {
  it('includes what the item can roll', () => {
    expect(exportOf(market()).item.expectedLines).toEqual(expectedLines)
  })

  it('includes the priorities in force', () => {
    expect(exportOf(market()).item.priorities).toEqual({ pm: 'critical' })
  })

  it('includes every listing with its price and stats', () => {
    const data = exportOf(market())
    expect(data.listings).toHaveLength(4)
    expect(data.listings.map((row) => row.price)).toContain(1800000)
    expect(data.listings[0]!.stats.length).toBeGreaterThan(0)
  })

  it('explains each listing: score, tiers and requirement outcome', () => {
    const row = exportOf(market()).listings[0]!
    expect(row.score).toBeGreaterThan(0)
    expect(row.tiers.some((tier) => tier.key === 'vitalite')).toBe(true)
    expect(typeof row.requirementsPassed).toBe('boolean')
  })

  it('records why a listing failed a requirement', () => {
    // PM is critical here, so the listings without it must say so.
    const failing = exportOf(market()).listings.filter((row) => !row.requirementsPassed)
    expect(failing.length).toBeGreaterThan(0)
    expect(failing[0]!.requirementFailures[0]!.label).toBe('PM')
  })

  it('records the curve a valuation came from', () => {
    const valued = exportOf(market()).listings.find((row) => row.valuation)
    if (valued) {
      expect(valued.valuation!.sampleMax).toBeGreaterThanOrEqual(valued.valuation!.sampleMin)
      expect(['fitted', 'anchored']).toContain(valued.valuation!.curveKind)
    }
  })

  it('carries no images', () => {
    const serialised = JSON.stringify(exportOf(market()))
    expect(serialised).not.toContain('data:image')
    expect(serialised).not.toContain('base64')
  })

  it('survives an item with nothing captured yet', () => {
    const data = exportOf([])
    expect(data.listings).toEqual([])
    expect(data.item.name).toBe('Bottes du Cycloïde')
  })
})

describe('itemExportFilename', () => {
  it('names the file after the item and the moment', () => {
    const name = itemExportFilename('bottes-du-cycloide', new Date('2026-08-09T12:34:56.000Z'))
    expect(name).toBe('bottes-du-cycloide-2026-08-09T12-34-56.json')
  })

  it('copes with an awkward key', () => {
    expect(itemExportFilename('Cape au Logis !')).toMatch(/^cape-au-logis-/)
  })
})
