// Shared vocabulary for the item valuation engine.
//
// Everything here is plain data. The engine is deliberately free of Vue and of
// localStorage so the scoring rules can be unit-tested directly — the whole
// point of pulling this out of items.vue was to be able to prove that "high
// means near-max" actually holds.

/** One stat line as captured from a listing (OCR or hand-edited). */
export interface ObservationStatEntry {
  key: string
  label: string
  value: number | null
  suffix: string
  /** The `[11 à 20]` text lifted from the client tooltip. Source of the bounds. */
  rangeText: string
  raw?: string
  isManual?: boolean
  /**
   * How sure the matcher was that this line is this stat, 0..1.
   *
   * The matcher has always computed this and the write path has always thrown it
   * away, so a line that scraped past the 0.55 accept threshold was stored
   * indistinguishably from an exact match. That is the difference between "this
   * item does not have that stat" and "we could not read that stat", and the
   * valuation engine needs it: the first is information about the item, the
   * second is an absence of information, and treating them alike is how a
   * misread turns into a confident price.
   *
   * Optional because entries written before this existed have no value for it —
   * `undefined` means unknown provenance, not high confidence.
   */
  confidence?: number
  /** Which pass claimed the line: the item's expected rolls, or the catalogue. */
  matchSource?: 'expected' | 'catalogue'
}

/** Whether a captured listing is still on the market, and how we learned that. */
export type ObservationStatus = 'listed' | 'sold' | 'relisted' | 'unknown'

/** A saved HDV listing for one item. Mirrors what lives in localStorage. */
export interface ObservedPrice {
  id: string
  itemKey: string
  itemName: string
  /**
   * Which server's market this listing was seen on.
   *
   * Optional because rows captured before this existed have no answer, and
   * guessing one would be a fabrication. Unknown means "comparable with
   * anything"; a known-but-different server means "not comparable".
   */
  serverId?: string
  price: number
  createdAt: string
  source: 'ocr'
  scanHash?: string
  statsRawText?: string
  statsEntries: ObservationStatEntry[]
  /**
   * True when the price was stored without anything to check it against.
   *
   * The first listing captured for an item has no history, so its price is
   * accepted unverified — and then becomes the baseline every later price is
   * judged against. Marking it keeps that visible instead of letting an
   * unexamined number pass as an examined one.
   */
  priceUnverified?: boolean
  /**
   * How much the stored price is believed.
   *
   * `verified` — the deterministic glyph reader resolved every character.
   * `proposed` — only the statistical reader answered, so this is a *guess*
   *   that happened to be plausible. Real example from the corpus: a strip
   *   plainly reading `4 899 999` where the glyph reader correctly refused and
   *   tesseract returned `4090094`, which then sailed through the plausibility
   *   band and was stored as fact. A proposal is kept, shown, and excluded from
   *   valuation until a human confirms it.
   * `confirmed` — a human read the crop and said what it was.
   *
   * Absent on rows written before this existed; treated as `verified` for
   * compatibility, since those predate the distinction.
   */
  priceTrust?: 'verified' | 'proposed' | 'confirmed'
  /** Stat-signature digest used to recognise the same listing across rescans. */
  signatureHash?: string
  firstSeenAt?: string
  lastSeenAt?: string
  status?: ObservationStatus
}

/** A line the item is *supposed* to have, with its official roll bounds. */
export interface ExpectedLine {
  statKey: string
  label: string
  min: number
  max: number
}

export type StatPriority = 'ignore' | 'low' | 'normal' | 'high' | 'critical'

/**
 * Where a rolled value sits relative to the line's maximum. `near-max` is the
 * tier the user means by "high": at max, or short of it by a hair.
 */
export type QualityTier = 'max' | 'near-max' | 'good' | 'mid' | 'low' | 'absent'

export interface LineQuality {
  statKey: string
  label: string
  value: number | null
  min: number
  max: number
  span: number
  /** `max - value`. Negative when overmaged. */
  deficit: number
  /** Raw position in the range, 0..1. */
  q: number
  /** Convex quality with the near-max/max bonuses and overmage. Can exceed 1. */
  qEff: number
  tier: QualityTier
  /** How far below max still counts as near-max for this line. */
  tolerance: number
  priority: StatPriority
  /** Base weight x priority multiplier. */
  weight: number
  contribution: number
  overmageAmount: number
  present: boolean
  /**
   * A stat the item cannot normally roll — an exo.
   *
   * Exos have no official range to measure against, which is why they used to
   * be dropped from scoring entirely: an item with a +1% Dommages aux Sorts exo
   * scored exactly the same as one without it.
   */
  isExo: boolean
}

export interface ItemQuality {
  /**
   * Final score: the base roll, lifted by whatever exos and overmage it carries.
   *
   * The lift is multiplicative on purpose. An exo on a well-rolled item is worth
   * a great deal; the same exo on an item that lost 15 Force is not, and must
   * not be able to rescue it.
   */
  quality: number
  /** The roll on the lines the item is supposed to have, normalised to 1. */
  baseQuality: number
  /** Fractional lift from exos, e.g. 0.26 for a +1% Dommages aux Sorts. */
  exoBoost: number
  /** Fractional lift from stats rolled above their maximum. */
  overBoost: number
  lines: LineQuality[]
  totalWeight: number
}

export interface RequirementFailure {
  statKey: string
  label: string
  priority: StatPriority
  /** Minimum rolled value that would have satisfied the requirement. */
  needed: number
  got: number | null
  max: number
}

export interface RequirementResult {
  passed: boolean
  failures: RequirementFailure[]
  /** Lines the user marked high/critical, whether or not they passed. */
  requiredCount: number
}
