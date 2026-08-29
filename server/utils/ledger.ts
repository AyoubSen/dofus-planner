// The durable market ledger.
//
// Observations have lived in one browser's localStorage: not backed up, not
// portable, not queryable, and silently capped by a quota nobody is told about.
// It is the most valuable data the app produces and the least safe thing it
// owns.
//
// This is the store the plan calls for, minus the database. SQLite was the
// intended shape and was attempted twice — `node:sqlite` needs an experimental
// flag the Nitro server cannot rely on, and the native module segfaulted on a
// skipped build. Rather than take a dependency that fails on the user's own
// machine, the ledger is an append-only JSON-lines log with the schema SQLite
// would have had. Append-only matters more than the storage engine: a log
// cannot lose an earlier write to a later bug, every state is reconstructible,
// and importing it into a real database later is a read of this file.
//
// Records are never mutated in place. A correction is a new record that
// supersedes an older one, so the history of what was believed and when
// survives — which is exactly what a market history is for.

import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const LEDGER_DIR = 'ledger'
export const LEDGER_FILE = join(LEDGER_DIR, 'observations.jsonl')
export const LEDGER_VERSION = 1

/** One stat line as observed. Mirrors the client's shape exactly. */
export interface LedgerStat {
  key: string
  label: string
  value: number | null
  suffix: string
  rangeText: string
  raw?: string
  confidence?: number
  matchSource?: 'expected' | 'catalogue'
  isManual?: boolean
}

export interface LedgerObservation {
  /** Stable id; a correction reuses it and supersedes the earlier record. */
  id: string
  itemKey: string
  itemName: string
  /** Separate economies never mix. Empty means unknown provenance. */
  serverId: string
  price: number
  createdAt: string
  source: 'ocr' | 'manual' | 'legacy_import'
  priceTrust?: 'verified' | 'proposed' | 'confirmed'
  priceUnverified?: boolean
  scanHash?: string
  statsRawText?: string
  statsEntries: LedgerStat[]
  signatureHash?: string
  firstSeenAt?: string
  lastSeenAt?: string
  status?: 'listed' | 'sold' | 'relisted' | 'unknown'
}

export interface LedgerRecord {
  /** Schema version of this line, so old lines stay readable forever. */
  v: number
  /** When it was written, which is not when the listing was seen. */
  at: string
  kind: 'observation' | 'delete'
  observation?: LedgerObservation
  /** For deletes. */
  id?: string
}

const ensureDir = async () => {
  if (!existsSync(LEDGER_DIR)) await mkdir(LEDGER_DIR, { recursive: true })
}

/**
 * Replaces one file with another, tolerating a transiently locked target.
 *
 * A plain rename is atomic and is the right primitive, but on Windows it fails
 * with EPERM whenever something else holds the target open for even a moment —
 * and on this project that is routine, because the working copy lives inside a
 * OneDrive folder where the sync client and the virus scanner both take brief
 * handles. The failure showed up as an intermittently red test, which is the
 * kindest way it could have arrived; in a session it would have surfaced as a
 * compaction that lost the log.
 *
 * So: retry briefly, then fall back to copy-then-replace. Slower and no longer
 * atomic, but the temporary file is only removed after the copy has succeeded,
 * so a failure at any point leaves a complete copy of the data on disk.
 */
const replaceFile = async (from: string, to: string): Promise<void> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rename(from, to)
      return
    } catch (error: any) {
      if (error?.code !== 'EPERM' && error?.code !== 'EBUSY' && error?.code !== 'EACCES') throw error
      await new Promise((resolve) => setTimeout(resolve, 40 * (attempt + 1)))
    }
  }

  const { copyFile, unlink } = await import('node:fs/promises')
  await copyFile(from, to)
  await unlink(from).catch(() => {})
}

/**
 * Appends records.
 *
 * One write for the batch: a per-record append would leave a half-written
 * import behind if the process died mid-way, and a log that can be truncated
 * mid-record is not a log.
 */
export const appendRecords = async (records: LedgerRecord[]): Promise<number> => {
  if (!records.length) return 0
  await ensureDir()
  const payload = records.map((record) => JSON.stringify(record)).join('\n') + '\n'
  await appendFile(LEDGER_FILE, payload, 'utf8')
  return records.length
}

export const writeObservations = async (
  observations: LedgerObservation[],
  source: LedgerObservation['source'] = 'ocr',
): Promise<number> => appendRecords(observations.map((observation) => ({
  v: LEDGER_VERSION,
  at: new Date().toISOString(),
  kind: 'observation',
  observation: { ...observation, source: observation.source ?? source },
})))

export const deleteObservation = async (id: string): Promise<void> => {
  await appendRecords([{ v: LEDGER_VERSION, at: new Date().toISOString(), kind: 'delete', id }])
}

/** Reads the log back, newest write winning per id. */
export const readLedger = async (): Promise<LedgerObservation[]> => {
  if (!existsSync(LEDGER_FILE)) return []

  const raw = await readFile(LEDGER_FILE, 'utf8')
  const byId = new Map<string, LedgerObservation>()

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    let record: LedgerRecord
    try {
      record = JSON.parse(line)
    } catch {
      // A truncated final line from an interrupted write. Everything before it
      // is intact, which is the property append-only buys.
      continue
    }

    if (record.kind === 'delete' && record.id) {
      byId.delete(record.id)
      continue
    }
    if (record.observation?.id) byId.set(record.observation.id, record.observation)
  }

  return [...byId.values()]
}

export interface LedgerStats {
  observations: number
  records: number
  byServer: Record<string, number>
  byItem: Record<string, number>
  oldest: string
  newest: string
  proposals: number
}

export const summariseLedger = (observations: LedgerObservation[], records: number): LedgerStats => {
  const byServer: Record<string, number> = {}
  const byItem: Record<string, number> = {}
  let proposals = 0

  for (const observation of observations) {
    const server = observation.serverId || 'unknown'
    byServer[server] = (byServer[server] || 0) + 1
    byItem[observation.itemKey] = (byItem[observation.itemKey] || 0) + 1
    if (observation.priceTrust === 'proposed') proposals += 1
  }

  const dates = observations.map((observation) => observation.createdAt).sort()

  return {
    observations: observations.length,
    records,
    byServer,
    byItem,
    proposals,
    oldest: dates[0] || '',
    newest: dates[dates.length - 1] || '',
  }
}

/**
 * Rewrites the log with only the live state.
 *
 * The one operation that discards history, so it writes a new file and renames
 * it over the old one — a compaction that dies half-way must leave the original
 * intact, or it is a data-loss bug wearing a maintenance task's clothes.
 */
export const compactLedger = async (): Promise<{ before: number; after: number }> => {
  const observations = await readLedger()
  const raw = existsSync(LEDGER_FILE) ? await readFile(LEDGER_FILE, 'utf8') : ''
  const before = raw.split('\n').filter((line) => line.trim()).length

  await ensureDir()
  const temporary = LEDGER_FILE + '.compact'
  const payload = observations.map((observation) => JSON.stringify({
    v: LEDGER_VERSION,
    at: new Date().toISOString(),
    kind: 'observation',
    observation,
  })).join('\n') + (observations.length ? '\n' : '')

  await mkdir(dirname(temporary), { recursive: true })
  await writeFile(temporary, payload, 'utf8')
  await replaceFile(temporary, LEDGER_FILE)

  return { before, after: observations.length }
}

/**
 * Folds a browser export into the ledger.
 *
 * Rows arrive with unknown provenance: written before servers were recorded,
 * before trust states existed, possibly on a different machine. They are
 * marked `legacy_import` and keep whatever they had rather than being
 * back-filled with plausible-looking values — an assumed server is a
 * fabrication, and this store exists to stop those.
 */
export const importFromBrowser = async (
  payload: Record<string, unknown[]>,
): Promise<{ imported: number; skipped: number }> => {
  const records: LedgerRecord[] = []
  let skipped = 0

  for (const [itemKey, rows] of Object.entries(payload || {})) {
    if (!Array.isArray(rows)) continue

    for (const row of rows as any[]) {
      if (!row?.id || !Number.isFinite(Number(row.price))) {
        skipped += 1
        continue
      }

      records.push({
        v: LEDGER_VERSION,
        at: new Date().toISOString(),
        kind: 'observation',
        observation: {
          id: String(row.id),
          itemKey: String(row.itemKey || itemKey),
          itemName: String(row.itemName || ''),
          serverId: String(row.serverId || ''),
          price: Number(row.price),
          createdAt: String(row.createdAt || new Date().toISOString()),
          source: 'legacy_import',
          priceTrust: row.priceTrust,
          priceUnverified: row.priceUnverified === true,
          scanHash: row.scanHash ? String(row.scanHash) : undefined,
          statsRawText: row.statsRawText ? String(row.statsRawText) : undefined,
          statsEntries: Array.isArray(row.statsEntries) ? row.statsEntries : [],
          signatureHash: row.signatureHash,
          firstSeenAt: row.firstSeenAt,
          lastSeenAt: row.lastSeenAt,
          status: row.status,
        },
      })
    }
  }

  await appendRecords(records)
  return { imported: records.length, skipped }
}
