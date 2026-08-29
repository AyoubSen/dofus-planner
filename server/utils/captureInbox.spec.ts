import { beforeEach, describe, expect, it } from 'vitest'
import {
  MAX_CAPTURE_ENTRIES,
  addCaptureEntry,
  createCaptureId,
  failCapture,
  findCaptureEntry,
  getCaptureState,
  resetCaptureState,
  setCaptureRegions,
  setCaptureVerdict,
  takePendingCaptures,
} from './captureInbox'
import type { CaptureEntry } from './captureInbox'

const entry = (overrides: Partial<CaptureEntry> = {}): CaptureEntry => ({
  id: createCaptureId(),
  frame: 'data:image/png;base64,frame',
  cursorX: 998,
  cursorY: 381,
  itemName: 'Cape au Logis',
  createdAt: new Date().toISOString(),
  status: 'pending',
  verdict: null,
  error: '',
  ...overrides,
})

beforeEach(() => {
  resetCaptureState()
})

describe('ids', () => {
  it('are unique across rapid captures', () => {
    const ids = new Set(Array.from({ length: 200 }, () => createCaptureId()))
    expect(ids.size).toBe(200)
  })
})

describe('draining pending captures', () => {
  it('hands over what is waiting, oldest first', () => {
    const first = addCaptureEntry(entry())
    const second = addCaptureEntry(entry())

    const taken = takePendingCaptures()
    expect(taken.map((c) => c.id)).toEqual([first.id, second.id])
  })

  it('never hands the same capture over twice', () => {
    // Two polls overlapping used to double-ingest, which reads to the user as a
    // phantom duplicate listing.
    addCaptureEntry(entry())
    expect(takePendingCaptures()).toHaveLength(1)
    expect(takePendingCaptures()).toHaveLength(0)
  })

  it('returns nothing when the companion has pushed nothing', () => {
    expect(takePendingCaptures()).toEqual([])
  })

  it('carries the frame and the pointer through', () => {
    // Both are needed: the app crops the row and the tooltip out of the frame
    // using where the pointer was, rather than being handed fixed rectangles.
    addCaptureEntry(entry())
    const [taken] = takePendingCaptures()
    expect(taken!.frame).toContain('frame')
    expect(taken!.cursorX).toBe(998)
    expect(taken!.cursorY).toBe(381)
  })
})

describe('verdicts', () => {
  it('attaches to the right capture', () => {
    const a = addCaptureEntry(entry())
    const b = addCaptureEntry(entry())

    setCaptureVerdict(b.id, { isDeal: true, headline: 'DEAL +420k', detail: 'Q 0.86', price: 800000 })

    expect(findCaptureEntry(b.id)?.verdict?.headline).toBe('DEAL +420k')
    expect(findCaptureEntry(a.id)?.verdict).toBeNull()
  })

  it('refuses an unknown id rather than inventing an entry', () => {
    expect(setCaptureVerdict('nope', { isDeal: false, headline: '', detail: '', price: null })).toBeNull()
    expect(failCapture('nope', 'boom')).toBeNull()
  })

  it('records a failure so the companion stops waiting', () => {
    const created = addCaptureEntry(entry())
    failCapture(created.id, 'Could not read the price')

    const found = findCaptureEntry(created.id)
    expect(found?.status).toBe('failed')
    expect(found?.error).toBe('Could not read the price')
  })
})

describe('the entry cap', () => {
  it('keeps the newest and trims the oldest', () => {
    const first = addCaptureEntry(entry())
    for (let i = 0; i < MAX_CAPTURE_ENTRIES + 5; i += 1) addCaptureEntry(entry())

    expect(getCaptureState().entries).toHaveLength(MAX_CAPTURE_ENTRIES)
    expect(findCaptureEntry(first.id)).toBeNull()
  })

  it('tracks when the companion was last heard from', () => {
    expect(getCaptureState().lastCaptureAt).toBeNull()
    const created = addCaptureEntry(entry())
    expect(getCaptureState().lastCaptureAt).toBe(created.createdAt)
  })
})

describe('regions', () => {
  it('rounds and stores both rectangles', () => {
    const regions = setCaptureRegions({
      price: { x: 10.4, y: 20.6, width: 200.2, height: 40.9, anchorX: 'screen', anchorY: 'cursor' },
      stats: { x: 300, y: 100, width: 320, height: 400, anchorX: 'screen', anchorY: 'screen' },
    })

    expect(regions.price).toEqual({
      x: 10, y: 21, width: 200, height: 41, anchorX: 'screen', anchorY: 'cursor',
    })
    expect(regions.stats).toEqual({
      x: 300, y: 100, width: 320, height: 400, anchorX: 'screen', anchorY: 'screen',
    })
    expect(regions.updatedAt).toBeTruthy()
  })

  it('keeps negative offsets, which cursor anchoring depends on', () => {
    // A tooltip that opens above the pointer has a negative Y offset; clamping
    // it to zero would drag every capture back down to the cursor.
    const regions = setCaptureRegions({
      price: { x: 1006, y: -12, width: 200, height: 26 },
      stats: { x: 1205, y: -300, width: 320, height: 400 },
    })
    expect(regions.price!.y).toBe(-12)
    expect(regions.stats!.y).toBe(-300)
  })

  it('defaults to a fixed column on a moving row', () => {
    // The HDV shape: the price column never moves, the row always does.
    const regions = setCaptureRegions({
      price: { x: 0, y: 0, width: 10, height: 10 },
      stats: { x: 0, y: 0, width: 10, height: 10 },
    })
    expect(regions.price).toMatchObject({ anchorX: 'screen', anchorY: 'cursor' })
    expect(regions.stats).toMatchObject({ anchorX: 'screen', anchorY: 'cursor' })
  })

  it('still reads a calibration saved before the axes were split', () => {
    const regions = setCaptureRegions({
      price: { x: 5, y: -10, width: 100, height: 20, anchor: 'cursor' },
      stats: { x: 300, y: 100, width: 320, height: 400, anchor: 'screen' },
    })
    expect(regions.price).toMatchObject({ anchorX: 'cursor', anchorY: 'cursor' })
    expect(regions.stats).toMatchObject({ anchorX: 'screen', anchorY: 'screen' })
  })

  it('rejects a zero-sized rectangle instead of capturing nothing', () => {
    const regions = setCaptureRegions({
      price: { x: 0, y: 0, width: 0, height: 40 },
      stats: { x: 0, y: 0, width: 10, height: 10 },
    })
    expect(regions.price).toBeNull()
    expect(regions.stats).not.toBeNull()
  })

  it('rejects a malformed rectangle', () => {
    const regions = setCaptureRegions({ price: { x: 'abc' }, stats: null })
    expect(regions.price).toBeNull()
    expect(regions.stats).toBeNull()
  })

  it('starts uncalibrated', () => {
    expect(getCaptureState().regions.price).toBeNull()
    expect(getCaptureState().regions.stats).toBeNull()
  })
})

describe('screenshots do not linger', () => {
  it('hands the frame over and then lets go of it', () => {
    // Each frame is a picture of the whole desktop; fifty of them is over
    // 100 MB held for a session that has no further use for any of them.
    const created = addCaptureEntry(entry())
    const [taken] = takePendingCaptures()

    expect(taken!.frame).toContain('frame')
    expect(findCaptureEntry(created.id)!.frame).toBe('')
  })

  it('keeps everything else the verdict needs', () => {
    const created = addCaptureEntry(entry())
    takePendingCaptures()

    const kept = findCaptureEntry(created.id)!
    expect(kept.id).toBe(created.id)
    expect(kept.itemName).toBe('Cape au Logis')
    expect(kept.cursorX).toBe(998)
  })

  it('never writes an image anywhere but memory', () => {
    // Only the two calibration rectangles are persisted; the pictures are not.
    const created = addCaptureEntry(entry())
    expect(created.frame.startsWith('data:')).toBe(true)
    expect(getCaptureState().entries[0]!.frame).toBe(created.frame)
  })
})
