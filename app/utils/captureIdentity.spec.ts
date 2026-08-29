import { describe, expect, it } from 'vitest'
import { resolveCaptureIdentity } from './captureIdentity'

/** Stands in for `normalizeDofusdbSearch`: case and accent folding. */
const normalize = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

const resolve = (captureItemName: string, openItemName: string) =>
  resolveCaptureIdentity({ captureItemName, openItemName, normalize })

describe('resolveCaptureIdentity', () => {
  it('accepts a capture of the item that is open', () => {
    const outcome = resolve('Gelano', 'Gelano')
    expect(outcome.ok).toBe(true)
    expect(outcome.ok && outcome.itemKey).toBe('gelano')
  })

  it('accepts across accent and case differences', () => {
    const outcome = resolve('Épée du Bouftou', 'epee du bouftou')
    expect(outcome.ok).toBe(true)
  })

  // The regression this whole file exists for: switching items while a capture
  // is in flight used to save the old item's price under the new item.
  it('refuses a capture armed on a different item', () => {
    const outcome = resolve('Gelano', 'Amulette du Bouftou')
    expect(outcome.ok).toBe(false)
    expect(outcome.ok === false && outcome.reason).toBe('mismatch')
    expect(outcome.ok === false && outcome.headline).toBe('WRONG ITEM')
  })

  it('names both items so the mismatch can be understood', () => {
    const outcome = resolve('Gelano', 'Amulette du Bouftou')
    expect(outcome.ok === false && outcome.message).toContain('Gelano')
    expect(outcome.ok === false && outcome.message).toContain('Amulette du Bouftou')
  })

  it('refuses a capture that carries no identity at all', () => {
    expect(resolve('', 'Gelano').ok).toBe(false)
    expect(resolve('   ', 'Gelano').ok).toBe(false)
  })

  it('refuses when nothing is open, rather than inventing a key', () => {
    const outcome = resolve('Gelano', '')
    expect(outcome.ok).toBe(false)
    expect(outcome.ok === false && outcome.reason).toBe('no-open-item')
  })

  it('never returns a key when it refuses', () => {
    for (const outcome of [resolve('A', 'B'), resolve('', 'B'), resolve('A', '')]) {
      expect(outcome).not.toHaveProperty('itemKey')
    }
  })
})
