// Copies owned monster quantities from one metamob quest to another.
//
// Metamob has no quest-creation endpoint (POST /quests is 404), so the target
// quest must already exist and be the *same quest template* as the source —
// monster ids are only comparable within a template, and writing template-1 ids
// into a template-4 quest would silently address the wrong monsters.
//
// Needs METAMOB_BEARER and METAMOB_USERNAME from .env.
//
//   node scripts/copy-quest.mjs <fromSlug> <toSlug> [--apply]
//
// The source may also be a backup file rather than a live quest, which is how a
// deleted quest gets restored into its replacement:
//
//   node scripts/copy-quest.mjs backups/metamob-quest-6d53ae6c.json <toSlug> [--apply]
//
// Without --apply it is a dry run: it reports what would change and writes
// nothing.
import fs from 'node:fs'

const PAGE = 200
const BATCH = 200
const MAX_QUANTITY = 30

const [from, to, ...flags] = process.argv.slice(2)
const apply = flags.includes('--apply')
if (!from || !to) throw new Error('usage: node scripts/copy-quest.mjs <fromSlug> <toSlug> [--apply]')
if (from === to) throw new Error('source and target are the same quest')

const env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : ''
const fromEnv = key => env.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim()
const token = process.env.METAMOB_BEARER || fromEnv('METAMOB_BEARER')
const username = process.env.METAMOB_USERNAME || fromEnv('METAMOB_USERNAME')
if (!token) throw new Error('METAMOB_BEARER not set (env or .env)')
if (!username) throw new Error('METAMOB_USERNAME not set (env or .env)')

const api = async (path, options = {}) => {
  const res = await fetch(`https://www.metamob.fr/api/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`metamob responded ${res.status} for ${path}: ${await res.text()}`)
  return res.json()
}

const fromFile = from.endsWith('.json')

const profile = await api(`/users/${username}`)
const quests = profile?.data?.quests ?? []
const target = quests.find(q => q.slug === to)
if (!target) throw new Error(`quest "${to}" not found on account "${username}"`)

// A backup file carries the template it was taken from, so the guard below
// works identically whether the source is live or restored from disk.
const backup = fromFile ? JSON.parse(fs.readFileSync(from, 'utf8')) : null
const source = fromFile
  ? { slug: from, character_name: backup.character, quest_template: { id: backup.template, monster_count: backup.monsters.length } }
  : quests.find(q => q.slug === from)
if (!source) throw new Error(`quest "${from}" not found on account "${username}"`)

const describe = q => `${q.slug} (${q.character_name}, template ${q.quest_template.id}, ${q.quest_template.monster_count} monsters)`
console.log(`from ${describe(source)}${fromFile ? ` [backup taken ${backup.takenAt}]` : ''}`)
console.log(`to   ${describe(target)}`)

// The guard that matters: ids only mean the same monster within one template.
if (source.quest_template.id !== target.quest_template.id) {
  throw new Error(
    `template mismatch (${source.quest_template.id} -> ${target.quest_template.id}). `
    + 'Monster ids are not comparable across templates; create the target as the same quest type.',
  )
}

const readCounts = async (slug) => {
  const counts = {}
  let offset = 0
  let total = Infinity
  while (offset < total) {
    const page = await api(`/users/${username}/quests/${slug}?limit=${PAGE}&offset=${offset}`)
    const data = page?.data
    if (!data) break
    for (const m of data.monsters ?? []) counts[m.id] = m.quantity ?? 0
    total = data.pagination?.total ?? 0
    offset += PAGE
  }
  return counts
}

const sourceCounts = fromFile
  ? Object.fromEntries(backup.monsters.map(m => [m.id, m.quantity ?? 0]))
  : await readCounts(from)
const targetCounts = await readCounts(to)

// Only send rows that actually differ — a no-op PATCH still costs rate limit.
const changes = Object.entries(sourceCounts)
  .map(([id, quantity]) => ({
    monster_id: Number(id),
    quantity: Math.max(0, Math.min(MAX_QUANTITY, Number(quantity) || 0)),
  }))
  .filter(row => Number.isFinite(row.monster_id) && (targetCounts[row.monster_id] ?? 0) !== row.quantity)

const owned = Object.values(sourceCounts).filter(q => q > 0).length
const totalQuantity = Object.values(sourceCounts).reduce((sum, q) => sum + q, 0)
console.log(`\nsource: ${owned} monsters owned, ${totalQuantity} total quantity`)
console.log(`${changes.length} rows differ from the target`)
for (const row of changes.slice(0, 10)) {
  console.log(`  ${row.monster_id}: ${targetCounts[row.monster_id] ?? 0} -> ${row.quantity}`)
}
if (changes.length > 10) console.log(`  ... and ${changes.length - 10} more`)

if (!apply) {
  console.log('\ndry run — nothing written. Re-run with --apply to copy.')
  process.exit(0)
}

let updated = 0
for (let i = 0; i < changes.length; i += BATCH) {
  const res = await api(`/quests/${to}/monsters`, {
    method: 'PATCH',
    body: JSON.stringify({ monsters: changes.slice(i, i + BATCH) }),
  })
  updated += res?.data?.updated_count ?? 0
}
console.log(`\nupdated ${updated} monsters on ${to}`)

const after = await readCounts(to)
const mismatched = changes.filter(row => after[row.monster_id] !== row.quantity)
console.log(mismatched.length
  ? `WARNING: ${mismatched.length} rows did not take the expected value`
  : 'verified: target now matches the source')
