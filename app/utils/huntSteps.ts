// Progress through the Ocre quest, step by step.
//
// The quest is 18 steps of 20 monsters each (the last is 6), and captures count
// toward whatever step the monster belongs to regardless of which step metamob
// calls "current" — so progress spreads across every step at once rather than
// filling in order. That makes "250 missing" useless as a goal and "step 14
// needs 11 more" the number actually worth chasing.

export type StepMonster = { id: number, step: number, typeId: number, status: string }
export type StepZone = { subzones: { monsters: StepMonster[] }[] }

export type StepProgress = { step: number, done: number, total: number, left: number }

/**
 * Per-step completion.
 *
 * Monsters repeat across sous-zones — one archi can spawn in eleven — so every
 * count here dedupes by monster id first. Without that, totals inflate by the
 * number of places each monster happens to appear.
 */
export const stepProgress = (zones: StepZone[], archiOnly = true): StepProgress[] => {
  const seen = new Map<number, StepMonster>()
  zones.forEach(zone => zone.subzones.forEach(sub => sub.monsters.forEach((m) => {
    if (archiOnly && m.typeId !== 3) return
    if (!seen.has(m.id)) seen.set(m.id, m)
  })))

  const steps = new Map<number, { done: number, total: number }>()
  seen.forEach((m) => {
    const entry = steps.get(m.step) ?? { done: 0, total: 0 }
    entry.total++
    if (m.status !== 'incomplete') entry.done++
    steps.set(m.step, entry)
  })

  return [...steps.entries()]
    .map(([step, v]) => ({ step, done: v.done, total: v.total, left: v.total - v.done }))
    .sort((a, b) => a.step - b.step)
}

/**
 * The step you are closest to finishing, which is rarely the lowest one.
 *
 * Ties break toward the lower step, so the answer is stable as counts move.
 */
export const nearestStep = (steps: StepProgress[]): number | null => {
  const open = steps.filter(s => s.left > 0)
  if (!open.length) return null
  return open.reduce((best, s) => (s.left < best.left || (s.left === best.left && s.step < best.step) ? s : best)).step
}
