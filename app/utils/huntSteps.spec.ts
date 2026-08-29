import { describe, expect, it } from 'vitest'
import { nearestStep, stepProgress } from './huntSteps'
import type { StepZone } from './huntSteps'

const m = (id: number, step: number, status = 'incomplete', typeId = 3) => ({ id, step, status, typeId })
const zone = (...subs: ReturnType<typeof m>[][]): StepZone => ({ subzones: subs.map(monsters => ({ monsters })) })

describe('stepProgress', () => {
  it('counts done against total per step', () => {
    const zones = [zone([m(1, 4, 'validated'), m(2, 4), m(3, 5)])]
    expect(stepProgress(zones)).toEqual([
      { step: 4, done: 1, total: 2, left: 1 },
      { step: 5, done: 0, total: 1, left: 1 },
    ])
  })

  it('counts a monster once however many sous-zones it spawns in', () => {
    // The real failure this guards: one archi can appear in eleven sous-zones,
    // which would otherwise report step 4 as needing 11 of it.
    const zones = [zone([m(1, 4)], [m(1, 4)], [m(1, 4)])]
    expect(stepProgress(zones)).toEqual([{ step: 4, done: 0, total: 1, left: 1 }])
  })

  it('dedupes across zones as well as sous-zones', () => {
    expect(stepProgress([zone([m(1, 4)]), zone([m(1, 4)])])).toEqual([
      { step: 4, done: 0, total: 1, left: 1 },
    ])
  })

  it('treats validated and completed alike as done', () => {
    const zones = [zone([m(1, 4, 'validated'), m(2, 4, 'completed'), m(3, 4)])]
    expect(stepProgress(zones)[0]).toEqual({ step: 4, done: 2, total: 3, left: 1 })
  })

  it('ignores non-archi unless asked', () => {
    const zones = [zone([m(1, 4), m(2, 4, 'incomplete', 1)])]
    expect(stepProgress(zones)[0]?.total).toBe(1)
    expect(stepProgress(zones, false)[0]?.total).toBe(2)
  })

  it('returns steps in order regardless of encounter order', () => {
    const zones = [zone([m(1, 9), m(2, 4), m(3, 18)])]
    expect(stepProgress(zones).map(s => s.step)).toEqual([4, 9, 18])
  })

  it('handles no zones at all', () => {
    expect(stepProgress([])).toEqual([])
  })
})

describe('nearestStep', () => {
  it('picks the step with the fewest left, not the lowest', () => {
    const steps = [
      { step: 4, done: 6, total: 20, left: 14 },
      { step: 14, done: 9, total: 20, left: 11 },
      { step: 17, done: 4, total: 20, left: 16 },
    ]
    expect(nearestStep(steps)).toBe(14)
  })

  it('skips finished steps', () => {
    const steps = [
      { step: 4, done: 20, total: 20, left: 0 },
      { step: 5, done: 1, total: 20, left: 19 },
    ]
    expect(nearestStep(steps)).toBe(5)
  })

  it('breaks ties toward the lower step so the target does not jitter', () => {
    const steps = [
      { step: 9, done: 9, total: 20, left: 11 },
      { step: 4, done: 9, total: 20, left: 11 },
    ]
    expect(nearestStep(steps)).toBe(4)
  })

  it('returns null when the quest is complete', () => {
    expect(nearestStep([{ step: 4, done: 20, total: 20, left: 0 }])).toBeNull()
    expect(nearestStep([])).toBeNull()
  })
})
