import { slugName } from './slugName'

/**
 * A position, and the world-map layer it belongs to.
 *
 * `world` matters because Dofus coordinates repeat across layers — [5,-18]
 * exists on the surface and again underground — so comparing a distance across
 * two of them produces a number with no meaning. Optional, so callers that have
 * no layer information behave exactly as before.
 */
export type Point = { x: number | null, y: number | null, world?: number | null }

/**
 * The sous-zone you are standing in the moment you arrive.
 *
 * This is the one a single fée d'artifice covers: the item scans the sous-zone
 * you occupy, not the surrounding area, so for a hunter who pops one fée at the
 * zaap and moves on, everything else under that zaap is unreachable.
 *
 * `subzoneGeo.zaap` holds the *name of the sous-zone containing the zaap map*,
 * so the match is a name comparison — normalised through slugName, like every
 * other join in this feature, or accents and apostrophes break it.
 */
export const zaapSubzone = <T extends { subzone: string }>(spots: T[], zaap: string): T | null => {
  if (!zaap) return null
  const target = slugName(zaap)
  return spots.find(s => slugName(s.subzone) === target) ?? null
}

/**
 * Orders the stops of one zaap group into a walk, nearest first, starting from
 * the zaap itself.
 *
 * This deliberately does NOT decide *which* stops to visit — a set cover has
 * already done that, and re-running it here would change which archi each stop
 * claims. It only reorders, so a stop late in the walk may still list more
 * monsters than an earlier one: each stop shows what it was first to cover, not
 * everything that spawns there.
 *
 * Greedy nearest-neighbour, not an optimal tour. Groups are typically five
 * stops or fewer, where the difference does not matter.
 */
export const orderStopsByWalk = <T extends Point>(stops: T[], origin: Point): T[] => {
  // A stop on another layer is as unsortable as one with no coordinates at all:
  // the distance would be arithmetic on two unrelated grids. Only compare when
  // both sides actually declare a layer, so callers without one are unaffected.
  const comparable = (s: Point) =>
    s.x !== null && s.y !== null
    && !(s.world != null && origin.world != null && s.world !== origin.world)

  const located = stops.filter(comparable)
  // No usable position means no opinion about order — keep set-cover order.
  const unlocated = stops.filter(s => !comparable(s))

  const ordered: T[] = []
  const pool = [...located]
  let current: Point = origin.x !== null && origin.y !== null ? origin : (located[0] ?? origin)

  while (pool.length) {
    let bestIndex = 0
    let bestDistance = Infinity

    pool.forEach((stop, index) => {
      // Squared distance: ordering only, so the square root is wasted work.
      const dx = (stop.x as number) - (current.x as number)
      const dy = (stop.y as number) - (current.y as number)
      const distance = dx * dx + dy * dy
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })

    const [next] = pool.splice(bestIndex, 1)
    if (!next) break
    ordered.push(next)
    current = next
  }

  return [...ordered, ...unlocated]
}
