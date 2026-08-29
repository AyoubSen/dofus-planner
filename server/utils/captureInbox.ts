// The hand-off between the in-game companion and the browser.
//
// The companion grabs two screen regions when the hotkey fires and drops them
// here; the app drains them, reads them with the client-side OCR, and posts a
// verdict back for the companion to show over the game. The images travel
// rather than the OCR result on purpose: the good recognizer (French model,
// constrained matcher) lives in the browser, and duplicating it in PowerShell
// or on the server would mean two implementations drifting apart.
//
// In memory by design, like `hdvScanInbox`. This is a localhost session tool,
// and screenshots of your own screen should not outlive the process.

/**
 * Where to grab, per axis.
 *
 * The HDV needs both kinds at once. A listing's price is in a fixed *column*
 * but on a moving *row*, so X must be absolute while Y follows the mouse.
 * Anchoring both axes to the cursor — as this first did — meant that pointing
 * at the item icon on the left of a row slid the box off the price entirely,
 * and it only read correctly when the pointer happened to be near the number.
 */
export type CaptureAnchor = 'cursor' | 'screen'

export interface CaptureRegion {
  /** Absolute when the matching axis is `screen`, else an offset from the cursor. */
  x: number
  y: number
  width: number
  height: number
  anchorX: CaptureAnchor
  anchorY: CaptureAnchor
}

export interface CaptureRegions {
  /** Where the listing's price sits. */
  price: CaptureRegion | null
  /** Where the hovered item's tooltip appears. */
  stats: CaptureRegion | null
  updatedAt: string | null
}

export interface CaptureVerdict {
  isDeal: boolean
  /** Short line for the toast, e.g. "DEAL +420k". */
  headline: string
  /** Supporting line, e.g. "Q 0.86 · fair 1.2M" or "Dommages 12/20". */
  detail: string
  price: number | null
  /**
   * What the app actually looked at and read.
   *
   * Kept because describing a bad read over chat is hopeless: the crops move
   * with where the pointer was, so the only way to tell a mis-crop from a
   * mis-read is to see both the picture and the text it produced.
   */
  debug?: {
    stripImage: string
    tooltipImage: string
    priceText: string
    statsText: string
    unmatched: string[]
  }
}

export type CaptureStatus = 'pending' | 'done' | 'failed'

export interface CaptureEntry {
  id: string
  /**
   * The whole screen, plus where the pointer was.
   *
   * Cropping happens in the browser rather than in the companion because the
   * app can find the price and the tooltip by looking at them, where the
   * companion could only ever be told coordinates. Calibrated rectangles were
   * wrong the moment the pointer sat anywhere but on the price itself.
   */
  frame: string
  cursorX: number
  cursorY: number
  itemName: string
  createdAt: string
  status: CaptureStatus
  verdict: CaptureVerdict | null
  error: string
}

interface CaptureState {
  entries: CaptureEntry[]
  regions: CaptureRegions
  /** Full-screen frame parked for the calibration UI to draw on. */
  calibrationFrame: string
  /**
   * Where the mouse was in that frame.
   *
   * This is what makes cursor-anchored regions possible: the boxes drawn over
   * the frame are turned into offsets from this point.
   */
  calibrationCursor: { x: number; y: number } | null
  lastCaptureAt: string | null
}

/** Enough history for the session log without holding many megabytes of PNGs. */
export const MAX_CAPTURE_ENTRIES = 50

const state: CaptureState = {
  entries: [],
  regions: { price: null, stats: null, updatedAt: null },
  calibrationFrame: '',
  calibrationCursor: null,
  lastCaptureAt: null,
}

export const getCaptureState = () => state

export const createCaptureId = () =>
  `capture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const addCaptureEntry = (entry: CaptureEntry) => {
  state.entries.unshift(entry)
  state.entries = state.entries.slice(0, MAX_CAPTURE_ENTRIES)
  state.lastCaptureAt = entry.createdAt
  return entry
}

export const findCaptureEntry = (id: string) =>
  state.entries.find((entry) => entry.id === id) || null

/**
 * Hands the browser everything still waiting, oldest first.
 *
 * Marking them as taken here rather than leaving that to the caller keeps two
 * polls landing on top of each other from ingesting the same capture twice —
 * which would look to the user like a phantom duplicate listing.
 */
export const takePendingCaptures = () => {
  const pending = state.entries.filter((entry) => entry.status === 'pending')
  const handed = pending.map((entry) => ({ ...entry }))

  for (const entry of pending) {
    entry.status = 'done'
    // Release the screenshot the moment it has been handed over. It is a
    // picture of the whole desktop, and fifty of them is upwards of 100 MB held
    // for a session that has no further use for any of them.
    entry.frame = ''
  }

  return handed.reverse()
}

export const setCaptureVerdict = (id: string, verdict: CaptureVerdict) => {
  const entry = findCaptureEntry(id)
  if (!entry) return null
  entry.verdict = verdict
  entry.status = 'done'
  return entry
}

export const failCapture = (id: string, error: string) => {
  const entry = findCaptureEntry(id)
  if (!entry) return null
  entry.status = 'failed'
  entry.error = error
  return entry
}

const normalizeRegion = (value: any): CaptureRegion | null => {
  const x = Number(value?.x)
  const y = Number(value?.y)
  const width = Number(value?.width)
  const height = Number(value?.height)

  if (![x, y, width, height].every(Number.isFinite)) return null
  if (width <= 0 || height <= 0) return null

  // Defaults match the HDV: a fixed column, a moving row. `anchor` is still
  // read so a calibration saved before the axes were split keeps working.
  const legacy: CaptureAnchor | null = value?.anchor === 'screen' ? 'screen'
    : value?.anchor === 'cursor' ? 'cursor'
      : null

  return {
    // Cursor offsets are signed: a tooltip above the pointer is a negative Y.
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
    anchorX: value?.anchorX === 'cursor' ? 'cursor' : value?.anchorX === 'screen' ? 'screen' : (legacy ?? 'screen'),
    anchorY: value?.anchorY === 'screen' ? 'screen' : value?.anchorY === 'cursor' ? 'cursor' : (legacy ?? 'cursor'),
  }
}

/**
 * Regions are the one piece of state worth keeping on disk.
 *
 * Everything else here is a session artefact, but calibration is a manual step
 * the user performs with the game open — losing it to a dev-server restart
 * means walking through the whole setup again, which is exactly the tedium this
 * feature exists to remove. It is two rectangles, so the cost is nil.
 */
const REGIONS_FILE = 'capture-regions.json'

const persistRegions = async (regions: CaptureRegions) => {
  // Never let a test run overwrite a real calibration the user spent time on.
  if (process.env.VITEST) return

  try {
    const { writeFile } = await import('node:fs/promises')
    await writeFile(REGIONS_FILE, JSON.stringify(regions, null, 2), 'utf8')
  } catch {
    // Calibration still works for this session; only the persistence failed.
  }
}

let restored = false

/** Loads regions from disk once, so a restart keeps the last calibration. */
export const restoreCaptureRegions = async () => {
  if (restored) return state.regions
  restored = true

  try {
    const { readFile } = await import('node:fs/promises')
    const raw = await readFile(REGIONS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    state.regions = {
      price: normalizeRegion(parsed?.price),
      stats: normalizeRegion(parsed?.stats),
      updatedAt: parsed?.updatedAt || null,
    }
  } catch {
    // No calibration yet, which is the normal first-run state.
  }

  return state.regions
}

export const setCaptureRegions = (input: { price?: any; stats?: any }) => {
  state.regions = {
    price: normalizeRegion(input?.price),
    stats: normalizeRegion(input?.stats),
    updatedAt: new Date().toISOString(),
  }
  restored = true
  void persistRegions(state.regions)
  return state.regions
}

export const resetCaptureState = () => {
  state.entries = []
  state.regions = { price: null, stats: null, updatedAt: null }
  state.calibrationFrame = ''
  state.calibrationCursor = null
  state.lastCaptureAt = null
}
