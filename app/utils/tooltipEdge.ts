// Finding where the tooltip actually starts.
//
// The tooltip crop was anchored to the cursor, on the assumption that Dofus
// opens it beside the pointer. It does not: across captures with the pointer at
// x=841 and x=998 the tooltip's left edge sat at ~1205 both times, because the
// game anchors it to the panel rather than to the mouse. Cropping from the
// cursor therefore dragged in the whole price list, and the stat matcher was
// handed fifteen lines of "1 3 500 000 ACHETER" to make sense of.
//
// Rather than hardcode a column — which is what the calibration approach did,
// and it broke the moment anything moved — the edge is found by looking at the
// picture. A Dofus tooltip is a large panel of near-uniform background, which
// is a very different thing from the game scene beside it.

/** A column counts as panel when this much of it sits at one brightness. */
export const PANEL_UNIFORMITY = 0.45

/** Below this the run is a UI element, not a tooltip. */
export const MIN_PANEL_WIDTH = 180

/** Luma either side of the column median that still counts as "the same". */
const LUMA_TOLERANCE = 14

const luma = (data: Uint8ClampedArray, index: number) =>
  data[index]! * 0.299 + data[index + 1]! * 0.587 + data[index + 2]! * 0.114

/**
 * How uniform each column is, 0..1.
 *
 * A tooltip's background is flat, so most of a column sits at one brightness.
 * The game scene behind it is textured and scores far lower.
 */
export const columnUniformity = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
): number[] => {
  const scores: number[] = new Array(width).fill(0)
  if (!width || !height) return scores

  for (let x = 0; x < width; x += 1) {
    // Sampling every few rows is plenty and keeps this cheap on a tall crop.
    const step = Math.max(1, Math.floor(height / 120))
    const samples: number[] = []
    for (let y = 0; y < height; y += step) {
      samples.push(luma(data, (y * width + x) * 4))
    }
    if (!samples.length) continue

    samples.sort((a, b) => a - b)
    const median = samples[Math.floor(samples.length / 2)]!
    const near = samples.filter((value) => Math.abs(value - median) <= LUMA_TOLERANCE).length
    scores[x] = near / samples.length
  }

  return scores
}

/**
 * The left edge of the widest uniform panel, or null when there isn't one.
 *
 * Returning null matters: guessing an edge on a frame with no tooltip would
 * crop somewhere arbitrary, and an honest "not found" lets the caller fall back
 * to the whole area instead.
 */
export const findPanelLeftEdge = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
): number | null => {
  const scores = columnUniformity(data, width, height)

  let bestStart = -1
  let bestWidth = 0
  let runStart = -1

  for (let x = 0; x <= width; x += 1) {
    const isPanel = x < width && scores[x]! >= PANEL_UNIFORMITY

    if (isPanel && runStart < 0) {
      runStart = x
    } else if (!isPanel && runStart >= 0) {
      const runWidth = x - runStart
      if (runWidth > bestWidth) {
        bestWidth = runWidth
        bestStart = runStart
      }
      runStart = -1
    }
  }

  if (bestWidth < MIN_PANEL_WIDTH) return null
  return bestStart
}
