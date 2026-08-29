import { existsSync, rmSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  LEDGER_DIR,
  appendRecords,
  compactLedger,
  deleteObservation,
  importFromBrowser,
  readLedger,
  summariseLedger,
  writeObservations,
  type LedgerObservation,
} from './ledger'

const observation = (id: string, overrides: Partial<LedgerObservation> = {}): LedgerObservation => ({
  id,
  itemKey: 'gelano',
  itemName: 'Gelano',
  serverId: 'draconiros',
  price: 1_000_000,
  createdAt: '2026-08-10T00:00:00.000Z',
  source: 'ocr',
  statsEntries: [],
  ...overrides,
})

const clean = () => {
  if (existsSync(LEDGER_DIR)) rmSync(LEDGER_DIR, { recursive: true, force: true })
}

beforeEach(clean)
afterEach(clean)

describe('append-only behaviour', () => {
  it('reads back what it wrote', async () => {
    await writeObservations([observation('a'), observation('b')])
    const rows = await readLedger()
    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.id).sort()).toEqual(['a', 'b'])
  })

  it('supersedes an earlier record by id rather than editing it', async () => {
    // A correction is a new record. The earlier belief stays in the log, which
    // is what makes the file a history rather than a snapshot.
    await writeObservations([observation('a', { price: 1_000_000 })])
    await writeObservations([observation('a', { price: 2_000_000 })])

    const rows = await readLedger()
    expect(rows).toHaveLength(1)
    expect(rows[0]!.price).toBe(2_000_000)
  })

  it('honours a delete without rewriting history', async () => {
    await writeObservations([observation('a'), observation('b')])
    await deleteObservation('a')
    const rows = await readLedger()
    expect(rows.map((row) => row.id)).toEqual(['b'])
  })

  it('survives a truncated final line', async () => {
    // The exact failure an append-only log is chosen to tolerate: a process
    // killed mid-write must not cost every record before it.
    await writeObservations([observation('a'), observation('b')])
    const { appendFile } = await import('node:fs/promises')
    await appendFile('ledger/observations.jsonl', '{"v":1,"kind":"observ', 'utf8')

    const rows = await readLedger()
    expect(rows).toHaveLength(2)
  })

  it('returns nothing when no ledger exists yet', async () => {
    expect(await readLedger()).toEqual([])
  })
})

describe('compaction', () => {
  it('keeps live state and drops superseded records', async () => {
    await writeObservations([observation('a', { price: 1 })])
    await writeObservations([observation('a', { price: 2 })])
    await writeObservations([observation('b')])
    await deleteObservation('b')

    const result = await compactLedger()
    expect(result.before).toBeGreaterThan(result.after)

    const rows = await readLedger()
    expect(rows).toHaveLength(1)
    expect(rows[0]!.price).toBe(2)
  })

  it('leaves an empty ledger readable', async () => {
    await writeObservations([observation('a')])
    await deleteObservation('a')
    await compactLedger()
    expect(await readLedger()).toEqual([])
  })
})

describe('importing the browser store', () => {
  it('marks imported rows as legacy rather than claiming provenance', async () => {
    const result = await importFromBrowser({
      gelano: [{ id: 'x', itemKey: 'gelano', price: 500, createdAt: '2026-01-01T00:00:00.000Z' }],
    })

    expect(result.imported).toBe(1)
    const rows = await readLedger()
    expect(rows[0]!.source).toBe('legacy_import')
  })

  it('does not invent a server for rows that never had one', async () => {
    // An assumed provenance is a fabrication, and this store exists to stop
    // those. Unknown stays unknown.
    await importFromBrowser({ gelano: [{ id: 'x', price: 500 }] })
    expect((await readLedger())[0]!.serverId).toBe('')
  })

  it('skips rows with no id or no usable price', async () => {
    const result = await importFromBrowser({
      gelano: [{ price: 500 }, { id: 'y' }, { id: 'z', price: 'abc' }],
    })
    expect(result.imported).toBe(0)
    expect(result.skipped).toBe(3)
  })

  it('is safe to run twice', async () => {
    const payload = { gelano: [{ id: 'x', price: 500 }] }
    await importFromBrowser(payload)
    await importFromBrowser(payload)
    expect(await readLedger()).toHaveLength(1)
  })
})

describe('summary', () => {
  it('splits by server and counts unconfirmed proposals', async () => {
    await writeObservations([
      observation('a', { serverId: 'draconiros' }),
      observation('b', { serverId: 'hellmina' }),
      observation('c', { serverId: '', priceTrust: 'proposed' }),
    ])

    const stats = summariseLedger(await readLedger(), 3)
    expect(stats.observations).toBe(3)
    expect(stats.byServer.draconiros).toBe(1)
    expect(stats.byServer.unknown).toBe(1)
    expect(stats.proposals).toBe(1)
  })

  it('reports an empty ledger without dates', async () => {
    const stats = summariseLedger([], 0)
    expect(stats.observations).toBe(0)
    expect(stats.oldest).toBe('')
  })
})

describe('record shape', () => {
  it('stamps a schema version on every line', async () => {
    await appendRecords([{ v: 1, at: '2026-08-10T00:00:00.000Z', kind: 'observation', observation: observation('a') }])
    const { readFile } = await import('node:fs/promises')
    const raw = await readFile('ledger/observations.jsonl', 'utf8')
    expect(JSON.parse(raw.trim()).v).toBe(1)
  })
})
