import { describe, expect, it } from 'vitest'
import { MIN_PANEL_WIDTH, columnUniformity, findPanelLeftEdge } from './tooltipEdge'

/**
 * Builds a frame shaped like the real one: a textured game scene on the left,
 * a flat tooltip panel on the right, with text scattered over both.
 */
const makeFrame = (options: {
  width: number
  height: number
  panelFrom: number | null
  panelLuma?: number
}) => {
  const { width, height, panelFrom, panelLuma = 48 } = options
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const inPanel = panelFrom !== null && x >= panelFrom

      // Panel: flat, with occasional text pixels. Scene: noisy.
      const value = inPanel
        ? (y % 17 === 0 && x % 5 === 0 ? 210 : panelLuma)
        : 20 + ((x * 37 + y * 61) % 160)

      data[i] = value
      data[i + 1] = value
      data[i + 2] = value
      data[i + 3] = 255
    }
  }

  return { data, width, height }
}

describe('columnUniformity', () => {
  it('scores a flat panel far above a textured scene', () => {
    const { data, width, height } = makeFrame({ width: 400, height: 300, panelFrom: 200 })
    const scores = columnUniformity(data, width, height)
    expect(scores[300]!).toBeGreaterThan(0.8)
    expect(scores[50]!).toBeLessThan(0.4)
  })

  it('copes with an empty image rather than throwing', () => {
    expect(columnUniformity(new Uint8ClampedArray(0), 0, 0)).toEqual([])
  })
})

describe('findPanelLeftEdge', () => {
  it('finds the edge of the tooltip panel', () => {
    const { data, width, height } = makeFrame({ width: 700, height: 500, panelFrom: 356 })
    const edge = findPanelLeftEdge(data, width, height)
    expect(edge).not.toBeNull()
    expect(Math.abs(edge! - 356)).toBeLessThanOrEqual(4)
  })

  it('finds it wherever the panel happens to sit', () => {
    // The whole point: the edge does not move with the cursor, so it has to be
    // located rather than assumed.
    for (const from of [120, 300, 500]) {
      const { data, width, height } = makeFrame({ width: 800, height: 400, panelFrom: from })
      expect(Math.abs(findPanelLeftEdge(data, width, height)! - from)).toBeLessThanOrEqual(4)
    }
  })

  it('says so honestly when there is no panel at all', () => {
    const { data, width, height } = makeFrame({ width: 600, height: 400, panelFrom: null })
    expect(findPanelLeftEdge(data, width, height)).toBeNull()
  })

  it('ignores a panel too narrow to be a tooltip', () => {
    const { data, width, height } = makeFrame({
      width: 600,
      height: 400,
      panelFrom: 600 - Math.floor(MIN_PANEL_WIDTH / 2),
    })
    expect(findPanelLeftEdge(data, width, height)).toBeNull()
  })

  it('works on a light panel as well as a dark one', () => {
    const { data, width, height } = makeFrame({ width: 700, height: 400, panelFrom: 300, panelLuma: 200 })
    expect(Math.abs(findPanelLeftEdge(data, width, height)! - 300)).toBeLessThanOrEqual(4)
  })
})
