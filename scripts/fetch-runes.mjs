// Regenerates app/data/runes.json from DofusDB.
//
// Forgemagie runes are typeId 78. The list only changes when Ankama ships new
// runes, so it is checked in as static data rather than fetched at runtime —
// the brisage session builder is the busiest form in the app and should not
// have a loading state or a network failure path.
//
//   node scripts/fetch-runes.mjs
import fs from 'node:fs'

const PAGE = 50
const OUT = 'app/data/runes.json'

const page = async (skip) => {
  const url = `https://api.dofusdb.fr/items?typeId=78&$limit=${PAGE}&$skip=${skip}&$sort=id&lang=fr`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`DofusDB responded ${res.status}`)
  return res.json()
}

const first = await page(0)
const total = first.total
const rows = [...first.data]

for (let skip = PAGE; skip < total; skip += PAGE) {
  rows.push(...(await page(skip)).data)
}

const runes = rows
  .map(item => ({ id: item.id, name: item.name?.fr || item.name?.en || '' }))
  .filter(rune => rune.name)
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

const names = new Set(runes.map(r => r.name))
if (names.size !== runes.length) throw new Error('duplicate rune names — the name match would be ambiguous')
if (runes.length !== total) console.warn(`warning: kept ${runes.length} of ${total} (some had no name)`)

fs.writeFileSync(OUT, `${JSON.stringify(runes, null, 2)}\n`)
console.log(`wrote ${runes.length} runes to ${OUT}`)
