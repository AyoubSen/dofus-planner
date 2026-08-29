// Stamps the metamob monster id onto every row of app/data/monsters.json.
//
// The ids already in monsters.json are NOT metamob ids — joined by name, 316 of
// 332 disagree (local 301 is "Mob l'Éponge", metamob 301 is "Blop Coco Royal").
// Anything keyed on the local id and sent to metamob writes to the wrong
// monster, so the sync keys on `metamobId` and this script produces it.
//
// The join is against a *quest template*, not the global /monsters catalogue:
// that catalogue spans game versions and repeats names across them (two
// "Crognan le Barbare"), which makes a name join ambiguous. A template is one
// (quest type × game version) pair and has unique names. Template 1 is
// Ocre × Dofus (Unity), the 337-monster list this app's quest uses.
//
// monsters.json holds 636 rows — the Retro list — so ~300 rows match no Unity
// monster and stay unstamped. They simply cannot sync, which is correct.
//
// Needs METAMOB_BEARER from .env.
//
//   node scripts/fetch-monster-ids.mjs [templateId]
import fs from 'node:fs'

const PAGE = 200
const OUT = 'app/data/monsters.json'
const TEMPLATE = process.argv[2] ?? '1'

// Mirrors app/utils/slugName.ts — .mjs cannot import TS. Keep them in step.
const slugName = value =>
  (value ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

const token = process.env.METAMOB_BEARER
  || (fs.existsSync('.env') && fs.readFileSync('.env', 'utf8').match(/^METAMOB_BEARER=(.*)$/m)?.[1]?.trim())
if (!token) throw new Error('METAMOB_BEARER not set (env or .env)')

const page = async (offset) => {
  const url = `https://www.metamob.fr/api/v1/quest-templates/${TEMPLATE}?limit=${PAGE}&offset=${offset}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`metamob responded ${res.status}`)
  return res.json()
}

const first = await page(0)
const total = first.data?.pagination?.total ?? 0
const catalogue = [...first.data.monsters]
for (let offset = PAGE; offset < total; offset += PAGE) {
  catalogue.push(...(await page(offset)).data.monsters)
}

const byName = new Map()
for (const m of catalogue) {
  const key = slugName(m.name?.fr)
  if (!key) continue
  if (byName.has(key) && byName.get(key) !== m.id) {
    throw new Error(`template ${TEMPLATE} has two monsters named "${m.name.fr}" — the name join is ambiguous`)
  }
  byName.set(key, m.id)
}

const rows = JSON.parse(fs.readFileSync(OUT, 'utf8'))
const unmatched = []
let changed = 0

for (const row of rows) {
  const metamobId = byName.get(slugName(row.nom))
  if (metamobId === undefined) {
    // Retro-only monster: nothing on metamob's Unity list to sync it to.
    if (row.metamobId !== undefined) { delete row.metamobId; changed++ }
    unmatched.push(row.nom)
    continue
  }
  if (row.metamobId !== metamobId) changed++
  row.metamobId = metamobId
}

const stamped = rows.length - unmatched.length
const seen = new Set(rows.filter(r => r.metamobId !== undefined).map(r => r.metamobId))
if (seen.size !== stamped) throw new Error('two monsters.json rows resolved to the same metamobId')

fs.writeFileSync(OUT, `${JSON.stringify(rows, null, 2)}\n`)

console.log(`template ${TEMPLATE}: ${catalogue.length} monsters`)
console.log(`stamped metamobId on ${stamped}/${rows.length} rows (${changed} changed)`)
console.log(`${catalogue.length - stamped} template monsters have no monsters.json row`)
if (unmatched.length) {
  console.log(`${unmatched.length} rows are not on this template and cannot sync (Retro-only)`)
}
