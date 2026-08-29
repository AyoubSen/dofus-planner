import { describe, expect, it } from 'vitest'
import { summariseCorpus, type CorpusSample } from './corpusStore'

const sample = (overrides: Partial<CorpusSample> = {}): CorpusSample => ({
  id: overrides.id ?? 'sample-1',
  capturedAt: overrides.capturedAt ?? '2026-08-10T12:00:00.000Z',
  itemName: 'Gelano',
  itemKey: 'gelano',
  serverId: 'draconiros',
  profile: {
    screenWidth: 1920,
    screenHeight: 1080,
    cursorX: 800,
    cursorY: 400,
    devicePixelRatio: 1,
    locale: 'fr',
  },
  readings: [],
  storedPrice: null,
  agreed: true,
  ...overrides,
})

const reading = (reader: 'glyph' | 'ocr', value: number | null) =>
  ({ reader, value, text: value === null ? '' : String(value), ms: 5 })

describe('corpus summary', () => {
  it('counts nothing for an empty archive', () => {
    const stats = summariseCorpus([])
    expect(stats.samples).toBe(0)
    expect(stats.disagreementRate).toBe(0)
  })

  // The measurement phase 0b exists to produce.
  it('counts a disagreement only when two readers both answered', () => {
    const stats = summariseCorpus([
      sample({ id: 'a', readings: [reading('glyph', 100), reading('ocr', 100)], agreed: true }),
      sample({ id: 'b', readings: [reading('glyph', 100), reading('ocr', 999)], agreed: false }),
    ])
    expect(stats.disagreements).toBe(1)
    expect(stats.disagreementRate).toBe(0.5)
  })

  it('does not treat a refusal as agreement', () => {
    // One reader answering and the other declining is not corroboration, and
    // counting it as such would flatter the pipeline exactly where it is weak.
    const stats = summariseCorpus([
      sample({ id: 'a', readings: [reading('glyph', null), reading('ocr', 100)], agreed: true }),
    ])
    expect(stats.disagreementRate).toBe(0)
    expect(stats.disagreements).toBe(0)
  })

  it('treats a zero reading as an answer, not as a refusal', () => {
    // Guards the coercion bug that produced this test: `Number(null)` is 0 and
    // `isFinite(0)` is true, so refusals were being archived as "read zero" and
    // then counted as answers — which inflated the agreement rate using samples
    // where a reader had actually declined.
    const stats = summariseCorpus([
      sample({ id: 'a', readings: [reading('glyph', 0), reading('ocr', 59_464_844)], agreed: false }),
    ])
    expect(stats.disagreements).toBe(1)
    expect(stats.refusals).toBe(0)
  })

  it('counts a sample where every reader refused', () => {
    const stats = summariseCorpus([
      sample({ id: 'a', readings: [reading('glyph', null), reading('ocr', null)] }),
    ])
    expect(stats.refusals).toBe(1)
  })

  it('scores stored values against confirmed truth only', () => {
    const stats = summariseCorpus([
      sample({ id: 'a', storedPrice: 100, truth: 100 }),
      sample({ id: 'b', storedPrice: 2_750, truth: 2_750_000 }),
      // No truth yet, so it cannot be right or wrong.
      sample({ id: 'c', storedPrice: 500 }),
    ])
    expect(stats.withTruth).toBe(2)
    expect(stats.knownWrong).toBe(1)
  })

  it('groups by item and reports the window covered', () => {
    const stats = summariseCorpus([
      sample({ id: 'a', itemKey: 'gelano', capturedAt: '2026-08-01T00:00:00.000Z' }),
      sample({ id: 'b', itemKey: 'gelano', capturedAt: '2026-08-05T00:00:00.000Z' }),
      sample({ id: 'c', itemKey: 'amulette', capturedAt: '2026-08-03T00:00:00.000Z' }),
    ])
    expect(stats.byItem.gelano).toBe(2)
    expect(stats.byItem.amulette).toBe(1)
    expect(stats.oldest).toBe('2026-08-01T00:00:00.000Z')
    expect(stats.newest).toBe('2026-08-05T00:00:00.000Z')
  })

  it('counts errored captures', () => {
    const stats = summariseCorpus([
      sample({ id: 'a', error: 'no-price' }),
      sample({ id: 'b' }),
    ])
    expect(stats.errors).toBe(1)
  })
})
