import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addCapture,
  addSweep,
  cooldownLeftMs,
  emptyHuntLog,
  huntLogKey,
  loadHuntLog,
  pruneLog,
  removeLatestCapture,
  saveHuntLog,
  sweepFactor,
  sweptAgoMs,
} from './huntLog'
import type { HuntLog } from './huntLog'

const HOUR = 60 * 60_000
const NOW = 1_755_000_000_000
const at = (msAgo: number) => Math.floor((NOW - msAgo) / 1000)

const log = (captures: [number, number][] = [], sweeps: [string, number][] = []): HuntLog => ({
  captures: captures.map(([m, msAgo]) => ({ m, t: at(msAgo) })),
  sweeps: sweeps.map(([z, msAgo]) => ({ z, t: at(msAgo) })),
})

describe('cooldownLeftMs', () => {
  it('returns 0 for an archi never captured', () => {
    expect(cooldownLeftMs(log([[482, HOUR]]), 999, 3 * HOUR, NOW)).toBe(0)
  })

  it('counts down from the capture', () => {
    expect(cooldownLeftMs(log([[482, HOUR]]), 482, 3 * HOUR, NOW)).toBe(2 * HOUR)
  })

  it('returns 0 once the cooldown has elapsed', () => {
    expect(cooldownLeftMs(log([[482, 4 * HOUR]]), 482, 3 * HOUR, NOW)).toBe(0)
  })

  it('uses the most recent capture, not the first one found', () => {
    // Oldest first, so a naive implementation would pick the stale entry.
    const twice = log([[482, 5 * HOUR], [482, HOUR]])
    expect(cooldownLeftMs(twice, 482, 3 * HOUR, NOW)).toBe(2 * HOUR)
  })

  it('follows the configured cooldown, since the real value is unknown', () => {
    const caught = log([[482, 2 * HOUR]])
    expect(cooldownLeftMs(caught, 482, 6 * HOUR, NOW)).toBe(4 * HOUR)
    expect(cooldownLeftMs(caught, 482, 1 * HOUR, NOW)).toBe(0)
  })
})

describe('addCapture / removeLatestCapture', () => {
  it('records the capture', () => {
    const next = addCapture(emptyHuntLog(), 482, NOW)
    expect(next.captures).toEqual([{ m: 482, t: at(0) }])
  })

  it('removes exactly one entry, the newest', () => {
    const next = removeLatestCapture(log([[482, 5 * HOUR], [482, HOUR], [7, HOUR]]), 482)
    expect(next.captures.filter(c => c.m === 482)).toEqual([{ m: 482, t: at(5 * HOUR) }])
    expect(next.captures).toHaveLength(2)
  })

  it('leaves the log alone when that archi was never captured', () => {
    const before = log([[482, HOUR]])
    expect(removeLatestCapture(before, 999)).toBe(before)
  })

  it('untick after tick is a round trip', () => {
    const before = emptyHuntLog()
    expect(removeLatestCapture(addCapture(before, 482, NOW), 482).captures).toEqual([])
  })
})

describe('addSweep', () => {
  it('replaces the previous mark for the same sous-zone instead of appending', () => {
    const next = addSweep(log([], [['Amakna-12', HOUR]]), 'Amakna-12', NOW)
    expect(next.sweeps).toEqual([{ z: 'Amakna-12', t: at(0) }])
  })

  it('keeps marks for other sous-zones', () => {
    const next = addSweep(log([], [['Amakna-99', HOUR]]), 'Amakna-12', NOW)
    expect(next.sweeps.map(s => s.z).sort()).toEqual(['Amakna-12', 'Amakna-99'])
  })

  it('marks one sous-zone without touching its neighbours', () => {
    // The bug this replaced: sweeping a zaap discounted every sous-zone in its
    // radius, including fifteen the player never visited.
    const before = log([], [['Amakna-1', 0], ['Amakna-2', 0]])
    const next = addSweep(before, 'Amakna-3', NOW)
    expect(next.sweeps).toHaveLength(3)
    expect(sweepFactor(next, 'Amakna-9', NOW)).toBe(1)
  })
})

describe('sweepFactor', () => {
  it('is 1 for a zaap never swept', () => {
    expect(sweepFactor(emptyHuntLog(), 'Bonta', NOW)).toBe(1)
  })

  it('is at its lowest right after a sweep, but never 0 — the penalty is soft', () => {
    const factor = sweepFactor(log([], [['Bonta', 0]]), 'Bonta', NOW)
    expect(factor).toBeCloseTo(0.35)
    expect(factor).toBeGreaterThan(0)
  })

  it('ramps back to 1 across the window', () => {
    const swept = log([], [['Bonta', 15 * 60_000]])
    expect(sweepFactor(swept, 'Bonta', NOW, 30 * 60_000)).toBeCloseTo(0.675)
  })

  it('is fully recovered once the window has passed', () => {
    expect(sweepFactor(log([], [['Bonta', 31 * 60_000]]), 'Bonta', NOW, 30 * 60_000)).toBe(1)
  })

  it('increases monotonically as the sweep ages', () => {
    const factors = [0, 5, 10, 20, 29].map(mins =>
      sweepFactor(log([], [['Bonta', mins * 60_000]]), 'Bonta', NOW, 30 * 60_000))
    expect(factors).toEqual([...factors].sort((a, b) => a - b))
  })

  it('never penalises a zaap out of the running', () => {
    // 30 archi behind a fresh sweep still outranks 5 behind none.
    expect(30 * sweepFactor(log([], [['Bonta', 0]]), 'Bonta', NOW))
      .toBeGreaterThan(5 * sweepFactor(emptyHuntLog(), 'Brakmar', NOW))
  })
})

describe('sweptAgoMs', () => {
  it('reports the age of the mark, or null when there is none', () => {
    expect(sweptAgoMs(log([], [['Bonta', HOUR]]), 'Bonta', NOW)).toBe(HOUR)
    expect(sweptAgoMs(emptyHuntLog(), 'Bonta', NOW)).toBeNull()
  })
})

describe('pruneLog', () => {
  it('keeps captures inside the horizon and drops the rest', () => {
    const before = log([[1, 10 * HOUR], [2, 60 * HOUR]])
    expect(pruneLog(before, 3 * HOUR, NOW).captures.map(c => c.m)).toEqual([1])
  })

  it('never prunes below 48h, however short the cooldown', () => {
    expect(pruneLog(log([[1, 40 * HOUR]]), 1 * HOUR, NOW).captures).toHaveLength(1)
  })

  it('extends the horizon for a long cooldown', () => {
    // 2x a 30h cooldown is 60h, past the 48h floor.
    expect(pruneLog(log([[1, 55 * HOUR]]), 30 * HOUR, NOW).captures).toHaveLength(1)
  })

  it('drops sweeps older than two hours', () => {
    const before = log([], [['fresh', 30 * 60_000], ['stale', 3 * HOUR]])
    expect(pruneLog(before, 3 * HOUR, NOW).sweeps.map(s => s.z)).toEqual(['fresh'])
  })

  it('caps captures at 400, keeping the newest', () => {
    const many = { captures: Array.from({ length: 500 }, (_, i) => ({ m: i, t: at(i * 1000) })), sweeps: [] }
    const pruned = pruneLog(many, 3 * HOUR, NOW)
    expect(pruned.captures).toHaveLength(400)
    expect(pruned.captures[0]?.m).toBe(0)
  })

  it('discards malformed rows rather than letting them poison the maths', () => {
    const dirty = {
      captures: [{ m: Number.NaN, t: at(0) }, { m: 5, t: Number.NaN }, { m: 7, t: at(0) }],
      sweeps: [{ z: '', t: at(0) }, { z: 'Bonta', t: at(0) }],
    } as HuntLog
    const pruned = pruneLog(dirty, 3 * HOUR, NOW)
    expect(pruned.captures).toEqual([{ m: 7, t: at(0) }])
    expect(pruned.sweeps).toEqual([{ z: 'Bonta', t: at(0) }])
  })

  it('stays small across a long hunt', () => {
    const busy = { captures: Array.from({ length: 500 }, (_, i) => ({ m: i % 337, t: at(i * 1000) })), sweeps: [] }
    expect(JSON.stringify(pruneLog(busy, 3 * HOUR, NOW)).length).toBeLessThan(15_000)
  })
})

describe('load / save', () => {
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v) },
    })
  })
  afterEach(() => { vi.unstubAllGlobals() })

  it('round-trips a log', () => {
    const before = addSweep(addCapture(emptyHuntLog(), 482, NOW), 'Bonta', NOW)
    saveHuntLog(4, 12, before)
    expect(loadHuntLog(4, 12)).toEqual(before)
  })

  it('scopes the key to server and character', () => {
    expect(huntLogKey(4, 12)).toBe('archi_hunt_log_v1_4_12')
    saveHuntLog(4, 12, addCapture(emptyHuntLog(), 482, NOW))
    expect(loadHuntLog(4, 99)).toEqual(emptyHuntLog())
  })

  it('returns an empty log for missing, malformed or wrongly-shaped data', () => {
    expect(loadHuntLog(4, 12)).toEqual(emptyHuntLog())
    store.set(huntLogKey(4, 12), 'not json')
    expect(loadHuntLog(4, 12)).toEqual(emptyHuntLog())
    store.set(huntLogKey(4, 12), '{"captures":"nope"}')
    expect(loadHuntLog(4, 12)).toEqual(emptyHuntLog())
  })

  it('does not throw when the quota is full', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError') },
    })
    expect(() => saveHuntLog(4, 12, emptyHuntLog())).not.toThrow()
  })
})
