// What happened during a hunt: which archi you took, and which zaaps you swept
// and found nothing at.
//
// The respawn counter in Dofus is per-archimonster and server-wide, not per
// zone (v2.6 patch notes), so a capture record needs no location at all — the
// monster id and a timestamp are the whole fact. That is why this file is small
// and why nothing here touches geography.
//
// The cooldown *length* is not documented. Ankama scales it with server
// population and tunes it per server, so callers pass their own estimate and
// every surface that shows it must label it as one.
//
// Sweeps are the other half: "I stood at this zaap, popped a fairy, nothing".
// That says a lot for a few minutes and nothing at all after an hour, so they
// decay fast and are pruned hard.
//
// Storage is a small dedicated key rather than the app store: dofus-app-store
// persists with no try/catch, so a QuotaExceededError there throws uncaught.
// Keeping this bounded and separate means a long hunt cannot take the app down.

/** metamob monster id + epoch SECONDS. Short keys — this is the one growing structure. */
export type Capture = { m: number, t: number }
/**
 * A sous-zone you checked and found empty: its key + epoch SECONDS.
 *
 * Per sous-zone, not per zaap, because that is what a fée actually scans. It
 * also has to be, now that a sous-zone can sit inside the radius of several
 * zaaps: keyed by zaap, sweeping one group left the same sous-zone looking
 * fresh under its neighbour, and discounted fifteen others you never visited.
 */
export type Sweep = { z: string, t: number }
export type HuntLog = { captures: Capture[], sweeps: Sweep[] }

export const HUNT_LOG_PREFIX = 'archi_hunt_log_v1'

/** A sweep is stale advice within the hour; two is generous. */
const SWEEP_HORIZON_MS = 2 * 60 * 60_000
/** Even with a tiny cooldown, keep two days of captures — they are cheap and readable. */
const MIN_CAPTURE_HORIZON_MS = 48 * 60 * 60_000

/** Backstops, not expected limits: only 337 archi exist and pruning runs first. */
const MAX_CAPTURES = 400
const MAX_SWEEPS = 200

/** Default sweep decay window: how long a fruitless check keeps a zaap unattractive. */
export const SWEEP_WINDOW_MS = 30 * 60_000
/** A swept zaap sinks but never disappears — the floor is what makes the penalty soft. */
const SWEEP_FLOOR = 0.35

export const emptyHuntLog = (): HuntLog => ({ captures: [], sweeps: [] })

export const huntLogKey = (serverId: string | number, characterId: string | number) =>
  `${HUNT_LOG_PREFIX}_${serverId}_${characterId}`

const seconds = (now: number) => Math.floor(now / 1000)

/**
 * Drop what can no longer change an answer, then cap what is left.
 *
 * Runs on every load and every write, so the stored value is always already
 * pruned and the file never needs a migration for size.
 */
export const pruneLog = (log: HuntLog, cooldownMs: number, now: number = Date.now()): HuntLog => {
  const captureHorizon = seconds(now - Math.max(cooldownMs * 2, MIN_CAPTURE_HORIZON_MS))
  const sweepHorizon = seconds(now - SWEEP_HORIZON_MS)

  const captures = log.captures
    .filter(c => Number.isFinite(c.m) && Number.isFinite(c.t) && c.t >= captureHorizon)
    .sort((a, b) => b.t - a.t)
    .slice(0, MAX_CAPTURES)

  const sweeps = log.sweeps
    .filter(s => s.z && Number.isFinite(s.t) && s.t >= sweepHorizon)
    .sort((a, b) => b.t - a.t)
    .slice(0, MAX_SWEEPS)

  return { captures, sweeps }
}

// Feature-detected rather than the `import.meta.client` used elsewhere in
// app/utils: it means the same thing on the server, where localStorage does not
// exist, but it also lets these two functions be tested against a stub.
const noStorage = () => typeof localStorage === 'undefined'

export const loadHuntLog = (serverId: string | number, characterId: string | number): HuntLog => {
  if (noStorage()) return emptyHuntLog()

  try {
    const raw = localStorage.getItem(huntLogKey(serverId, characterId))
    if (!raw) return emptyHuntLog()

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return emptyHuntLog()

    return {
      captures: Array.isArray(parsed.captures) ? parsed.captures : [],
      sweeps: Array.isArray(parsed.sweeps) ? parsed.sweeps : [],
    }
  } catch {
    return emptyHuntLog()
  }
}

export const saveHuntLog = (serverId: string | number, characterId: string | number, log: HuntLog) => {
  if (noStorage()) return
  try {
    localStorage.setItem(huntLogKey(serverId, characterId), JSON.stringify(log))
  } catch {
    // A full quota must not break the tick that triggered the save — the count
    // itself is already persisted elsewhere and pushed to metamob.
  }
}

/** Append a capture. Repeat captures of the same archi are kept; the latest wins. */
export const addCapture = (log: HuntLog, monsterId: number, now: number = Date.now()): HuntLog => ({
  ...log,
  captures: [{ m: monsterId, t: seconds(now) }, ...log.captures],
})

/** Undo one tick: removes only the most recent capture of that archi. */
export const removeLatestCapture = (log: HuntLog, monsterId: number): HuntLog => {
  let newest = -1
  let newestTime = -Infinity
  log.captures.forEach((c, i) => {
    if (c.m === monsterId && c.t > newestTime) { newestTime = c.t; newest = i }
  })
  if (newest < 0) return log
  return { ...log, captures: log.captures.filter((_, i) => i !== newest) }
}

/** Mark a sous-zone as swept-and-empty. One mark each — a re-sweep replaces it. */
export const addSweep = (log: HuntLog, key: string, now: number = Date.now()): HuntLog => ({
  ...log,
  sweeps: [{ z: key, t: seconds(now) }, ...log.sweeps.filter(s => s.z !== key)],
})

/** Milliseconds until this archi could plausibly be back. 0 means ready. */
export const cooldownLeftMs = (
  log: HuntLog,
  monsterId: number,
  cooldownMs: number,
  now: number = Date.now(),
): number => {
  let newest = -Infinity
  for (const c of log.captures) if (c.m === monsterId && c.t > newest) newest = c.t
  if (newest === -Infinity) return 0
  return Math.max(0, newest * 1000 + cooldownMs - now)
}

/** When this sous-zone was last swept for nothing, in ms ago; null if never (or pruned). */
export const sweptAgoMs = (log: HuntLog, key: string, now: number = Date.now()): number | null => {
  const sweep = log.sweeps.find(s => s.z === key)
  return sweep ? Math.max(0, now - sweep.t * 1000) : null
}

/**
 * Ranking multiplier for a sous-zone you recently found empty: SWEEP_FLOOR
 * right after the sweep, ramping linearly back to 1 across the window.
 *
 * The floor is deliberate. An empty sweep is weak evidence — archi drop into
 * existing groups on their own counters, so one can appear a minute after you
 * left — and the whole point of the soft penalty is that a swept spot sinks in
 * the list without ever vanishing from it.
 */
export const sweepFactor = (
  log: HuntLog,
  key: string,
  now: number = Date.now(),
  windowMs: number = SWEEP_WINDOW_MS,
): number => {
  const ago = sweptAgoMs(log, key, now)
  if (ago === null || ago >= windowMs || windowMs <= 0) return 1
  return SWEEP_FLOOR + (1 - SWEEP_FLOOR) * (ago / windowMs)
}
