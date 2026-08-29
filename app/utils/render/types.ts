// The renderer model: what the client is assumed to have drawn.
//
// Phase 1a of the enhancement plan. The central idea is that Dofus text is not
// a photograph to be recognised but a rendering to be *reproduced*: if we can
// redraw a candidate string and land on the same pixels, that candidate is the
// one the client drew. The check is against the original pixels rather than
// against a second opinion, which is what makes it stronger evidence than two
// recognisers agreeing — they share a crop and a segmentation, so they fail
// together.
//
// What it is not: proof. Everything below is a *model* of the client's
// rasteriser, and Dofus 3 draws through Unity/TextMeshPro with signed-distance
// fields, configurable dilate and softness, an outline, and gamma-aware
// blending. Possessing the font does not reproduce that automatically. So the
// parameters here are fitted against real captures and the fit quality is
// reported, rather than assumed — a sub-epsilon residual says "compatible with
// a model that was itself validated on held-out captures at a measured rate",
// and never more than that.

/**
 * One glyph as coverage, not as colour.
 *
 * Coverage is the quantity the rasteriser actually computed before it blended
 * anything, so it survives the text being drawn over any background. Storing
 * colour instead would bake in the panel it happened to be drawn on, and the
 * atlas would stop matching the moment an item icon sat behind the number.
 */
export interface GlyphCoverage {
  char: string
  width: number
  height: number
  /** Row-major alpha in 0..1, length width*height. */
  alpha: Float32Array
  /**
   * Pixels from the glyph's left edge to the next glyph's left edge.
   *
   * Kept separately from `width` because glyphs overhang: advance is layout,
   * width is ink, and conflating them mis-places every character after the
   * first.
   */
  advance: number
  /** Rows from the text baseline to the top of this glyph's box. */
  bearingY: number
}

/** A complete set of glyphs at one size and one sub-pixel phase. */
export interface GlyphAtlasRaster {
  /** Identifies the profile this was built for. Atlases never mix. */
  profileId: string
  /** Sub-pixel phase in 0..1 that these rasters were generated at. */
  phase: number
  pixelSize: number
  glyphs: Map<string, GlyphCoverage>
}

/**
 * How the client turns coverage into pixels.
 *
 * These are the knobs that a font file alone does not tell you, and they are
 * exactly the reason "extract the font and render it" is insufficient. Every
 * one of them is fitted (see `calibrate.ts`), never guessed.
 */
export interface RenderParams {
  /** Text colour, 0..255 per channel. */
  foreground: [number, number, number]
  /**
   * Coverage gamma.
   *
   * TextMeshPro blends in a space that is not linear alpha, so a glyph's edge
   * pixels sit systematically lighter or darker than naive compositing gives.
   * One exponent absorbs most of that.
   */
  gamma: number
  /**
   * Coverage bias, akin to TMP's dilate: positive fattens the stroke.
   *
   * Applied before gamma, because dilation is a shape operation and gamma is a
   * blending one.
   */
  dilate: number
  /** Edge softness; higher blurs the coverage ramp. 0 leaves it untouched. */
  softness: number
  /** Extra pixels inserted between glyph advances, positive or negative. */
  tracking: number
  /** Outline darkness in 0..1. 0 disables the outline entirely. */
  outlineStrength: number
  /** Outline colour, used only when `outlineStrength` is above zero. */
  outline: [number, number, number]
}

export const defaultRenderParams = (): RenderParams => ({
  foreground: [255, 255, 255],
  gamma: 1,
  dilate: 0,
  softness: 0,
  tracking: 0,
  outlineStrength: 0,
  outline: [0, 0, 0],
})

/** A grayscale image the verifier works on. */
export interface GrayImage {
  width: number
  height: number
  /** Row-major luma in 0..255. */
  data: Float32Array
}

/**
 * The verdict on one candidate string.
 *
 * `margin` matters as much as `residual`: a candidate that fits well *and* fits
 * far better than the next-best candidate is a different kind of evidence from
 * one that merely fits well. Recording both is what lets epsilon be chosen from
 * data rather than by hand.
 */
export interface ReconstructionResult {
  candidate: string
  /**
   * Unexplained share of the available signal, roughly 0..1. Lower is better.
   *
   * Normalised over inked pixels and by contrast so it compares across crop
   * sizes and panel brightnesses — see `residualFor` for why both were needed.
   */
  residual: number
  /** Sub-pixel x offset that produced this residual. */
  offsetX: number
  /** Baseline row that produced this residual. */
  baselineY: number
}
