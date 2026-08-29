// Regenerates app/data/subzoneGeo.json from DofusDB.
//
// Metamob knows which subzone a monster spawns in but has no coordinates, no
// zaap and no dungeon flag, so a hunt route built on it alone cannot say what
// is near what. DofusDB has all three:
//
//   subareas.associatedZaapMapId -> the zaap you travel to
//   subareas.dungeonId (-1 = not a dungeon)
//   map-positions.posX/posY      -> a centroid per subarea
//   map-positions.worldMap       -> WHICH coordinate space those are in
//
// That last one is not optional. Dofus coordinates only mean anything within a
// single world-map layer: [5,-18] exists on layer 1 and again on layer -1, in
// different subareas. 246 of 532 subareas span more than one layer, so
// averaging every map in a subarea — which this script used to do — produces a
// point that exists in neither. It put 91 of the planner's 156 sous-zones in
// the wrong place, Refuge sylvestre by 39 tiles.
//
// This is static Ankama content that only moves on a game patch, and rebuilding
// it costs ~320 upstream requests, so it is checked in rather than fetched at
// runtime — the same reasoning as fetch-runes.mjs, and doubly so here because
// the app deploys to Vercel where a server-side cache dies with each lambda.
//
//   node scripts/fetch-subzone-geo.mjs
import fs from 'node:fs'

const PAGE = 50
const OUT = 'app/data/subzoneGeo.json'

// Mirrors app/utils/slugName.ts — .mjs cannot import TS. Keep them in step.
const slugName = value =>
  (value ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

// $sort=id keeps pages stable: without it a mid-run change to `total` shifts
// every later window and rows go missing.
const fetchAll = async (path, extra = '') => {
  const page = async (skip) => {
    const res = await fetch(`https://api.dofusdb.fr/${path}?$limit=${PAGE}&$skip=${skip}&$sort=id${extra}`)
    if (!res.ok) throw new Error(`DofusDB responded ${res.status} for ${path}`)
    return res.json()
  }

  const first = await page(0)
  const rows = [...first.data]
  for (let skip = PAGE; skip < first.total; skip += PAGE) {
    rows.push(...(await page(skip)).data)
    if (rows.length % 1000 === 0) process.stderr.write('.')
  }
  process.stderr.write('\n')
  return { rows, total: first.total }
}

const subareas = await fetchAll('subareas', '&lang=fr')
const areas = await fetchAll('areas', '&lang=fr')
const positions = await fetchAll('map-positions')

// Subzone names are not unique on their own — there are two "Cimetière", one in
// Amakna and one by Sufokia — so the area name has to travel with each row for
// the metamob join to tell them apart.
const areaName = new Map(areas.rows.map(a => [a.id, a.name?.fr ?? '']))

const posByMap = new Map()
const coords = new Map()
for (const p of positions.rows) {
  posByMap.set(p.id, p)
  if (p.subAreaId === undefined || p.subAreaId === null) continue
  if (!coords.has(p.subAreaId)) coords.set(p.subAreaId, [])
  coords.get(p.subAreaId).push(p)
}

/** The main surface world map — the space zaaps and the in-game map live in. */
const SURFACE = 1

/**
 * [0,0] is DofusDB's "not placed" default, not a position: 3357 of the 15360
 * maps share it, across every layer. Averaging them in drags centroids toward
 * the origin, and 91 subareas have layer-1 maps that are *only* placeholders —
 * enough to make the surface look present when it is not.
 */
const placed = p => !(p.posX === 0 && p.posY === 0)

/**
 * Which coordinate space a subarea should be measured in.
 *
 * Layer 1 wins whenever the subarea has any map on it. "Most maps wins" is
 * wrong: Village d'Amakna is an ordinary outdoor hunt zone whose maps are
 * mostly layer -1 ("not placed on the world map"), and 42 of the planner's
 * sous-zones are like it. Only subareas with no surface presence at all — the
 * Astrub sewers, Village de la Canopée, the labyrinths — keep their own layer.
 */
const pickLayer = (list) => {
  if (list.some(p => p.worldMap === SURFACE)) return SURFACE
  const counts = new Map()
  for (const p of list) counts.set(p.worldMap, (counts.get(p.worldMap) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

/**
 * A real map near the middle of the subarea, on one layer.
 *
 * Snapped to an actual map rather than left as the raw mean, so every stored
 * coordinate is somewhere you can stand — the mean already lands on a real map
 * about three times in four, and this makes it always.
 */
const centroid = (subAreaId) => {
  const all = (coords.get(subAreaId) ?? []).filter(placed)
  if (!all.length) return null

  const layer = pickLayer(all)
  const list = all.filter(p => p.worldMap === layer)
  if (!list.length) return null

  const x = list.reduce((sum, p) => sum + p.posX, 0) / list.length
  const y = list.reduce((sum, p) => sum + p.posY, 0) / list.length

  const nearest = list.reduce((best, p) => {
    const d = (p.posX - x) ** 2 + (p.posY - y) ** 2
    return d < best.d ? { d, p } : best
  }, { d: Infinity, p: list[0] }).p

  return { x: nearest.posX, y: nearest.posY, world: layer, layers: new Set(all.map(p => p.worldMap)).size }
}

const byId = new Map(subareas.rows.map(s => [s.id, s]))

const rows = subareas.rows.map((sub) => {
  const here = centroid(sub.id)

  // The zaap is a map, not a subarea: resolve it back to the subarea it sits in
  // for a human-readable name, but keep the zaap map's own coordinates — they
  // are where you actually arrive, and more precise than that subarea's mean.
  const zaapMap = sub.associatedZaapMapId ? posByMap.get(sub.associatedZaapMapId) : null
  const zaapSub = zaapMap ? byId.get(zaapMap.subAreaId) : null

  return {
    slug: slugName(sub.name?.fr),
    name: sub.name?.fr ?? '',
    area: areaName.get(sub.areaId) ?? '',
    zaap: zaapSub?.name?.fr ?? null,
    zaapX: zaapMap?.posX ?? null,
    zaapY: zaapMap?.posY ?? null,
    // The zaap's own layer: 43 of the 57 zaaps sit on the surface, and a group
    // whose sous-zones are elsewhere cannot be distance-sorted against it.
    zaapWorld: zaapMap?.worldMap ?? null,
    x: here?.x ?? null,
    y: here?.y ?? null,
    world: here?.world ?? null,
    dungeon: sub.dungeonId !== undefined && sub.dungeonId !== -1,
  }
}).filter(row => row.slug)

rows.sort((a, b) => a.slug.localeCompare(b.slug))

// Collisions are only a problem if area+subzone is *also* ambiguous — that pair
// is what the app joins on.
const seen = new Set()
const collisions = rows.filter((r) => {
  const pair = `${slugName(r.area)}/${r.slug}`
  if (seen.has(pair)) return true
  seen.add(pair)
  return false
})

// A regeneration should be auditable rather than a silent 562-row diff, so
// report what moved against the file already on disk.
const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : []
const wasByPair = new Map(previous.map(r => [`${slugName(r.area)}/${r.slug}`, r]))
const moved = rows.filter((r) => {
  const before = wasByPair.get(`${slugName(r.area)}/${r.slug}`)
  return before && (before.x !== r.x || before.y !== r.y)
})

fs.writeFileSync(OUT, `${JSON.stringify(rows, null, 2)}\n`)

const layerCounts = new Map()
for (const r of rows) if (r.world !== null) layerCounts.set(r.world, (layerCounts.get(r.world) ?? 0) + 1)

console.log(`subareas ${subareas.total}, map-positions ${positions.total}`)
console.log(`wrote ${rows.length} rows to ${OUT}`)
console.log(`  with a zaap : ${rows.filter(r => r.zaap).length}`)
console.log(`  with coords : ${rows.filter(r => r.x !== null).length}`)
console.log(`  dungeons    : ${rows.filter(r => r.dungeon).length}`)
console.log(`  off-surface : ${rows.filter(r => r.world !== null && r.world !== SURFACE).length} (own coordinate space)`)
console.log(`  layers      : ${[...layerCounts.entries()].sort((a, b) => b[1] - a[1]).map(([w, n]) => `${w}:${n}`).join(' ')}`)

if (previous.length) {
  console.log(`\n${moved.length} of ${previous.length} rows changed position since the last run`)
  for (const r of [...moved].sort((a, b) => {
    const pa = wasByPair.get(`${slugName(a.area)}/${a.slug}`)
    const pb = wasByPair.get(`${slugName(b.area)}/${b.slug}`)
    return Math.hypot(pb.x - b.x, pb.y - b.y) - Math.hypot(pa.x - a.x, pa.y - a.y)
  }).slice(0, 10)) {
    const was = wasByPair.get(`${slugName(r.area)}/${r.slug}`)
    console.log(`  ${r.name}: [${was.x},${was.y}] -> [${r.x},${r.y}] (layer ${r.world})`)
  }
}
if (collisions.length) {
  console.warn(`\n${collisions.length} slugs are not unique — the name join will be ambiguous for:`)
  for (const c of collisions) console.warn(`  - ${c.name}`)
}
