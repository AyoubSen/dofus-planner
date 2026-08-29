// The Dofus stat catalogue and the label-matching helpers that sit on top of it.
// Shared because the items page needs them for its stat editor and health
// checks, while the OCR pipeline needs them to turn a screenshot line into a
// known stat key. Pure data and pure functions — no component state.

export interface StatDef {
  key: string
  label: string
  aliases: string[]
  suffix?: string
  binary?: boolean
}

export const statsOcrDefs: StatDef[] = [
  { key: 'vitalite', label: 'Vitalité', aliases: ['vitalite'] },
  { key: 'force', label: 'Force', aliases: ['force'] },
  { key: 'intelligence', label: 'Intelligence', aliases: ['intelligence'] },
  { key: 'chance', label: 'Chance', aliases: ['chance'] },
  { key: 'agilite', label: 'Agilité', aliases: ['agilite'] },
  { key: 'sagesse', label: 'Sagesse', aliases: ['sagesse'] },
  { key: 'initiative', label: 'Initiative', aliases: ['initiative', 'ini'] },
  { key: 'retrait_pa', label: 'Retrait PA', aliases: ['retrait pa'] },
  { key: 'retrait_pm', label: 'Retrait PM', aliases: ['retrait pm'] },
  { key: 'esquive_pa', label: 'Esquive PA', aliases: ['esquive pa'] },
  { key: 'esquive_pm', label: 'Esquive PM', aliases: ['esquive pm'] },
  { key: 'critique', label: 'Critique', aliases: ['critique'], suffix: '%' as const },
  { key: 'dommages', label: 'Dommages', aliases: ['dommages', 'dommage'] },
  { key: 'dommages_critiques', label: 'Dommages Critiques', aliases: ['dommages critiques', 'dommage critique', 'do crit', 'do cri'] },
  { key: 'resistance_critique', label: 'Résistance Critique', aliases: ['resistance critique', 'résistance critique', 'resistances critiques', 'résistances critiques'] },
  { key: 'pa', label: 'PA', aliases: [' pa ', 'pa [', 'pa'] },
  { key: 'pm', label: 'PM', aliases: [' pm ', 'pm [', 'pm'] },
  { key: 'po', label: 'PO', aliases: [' po ', 'portee', 'portée', 'po ['] },
  { key: 'invocation', label: 'Invocation', aliases: ['invocation'] },
  { key: 'dommages_neutre', label: 'Dommages Neutre', aliases: ['dommages neutre'] },
  { key: 'dommages_terre', label: 'Dommages Terre', aliases: ['dommages terre'] },
  { key: 'dommages_feu', label: 'Dommages Feu', aliases: ['dommages feu'] },
  { key: 'dommages_eau', label: 'Dommages Eau', aliases: ['dommages eau'] },
  { key: 'dommages_air', label: 'Dommages Air', aliases: ['dommages air'] },
  { key: 'prospection', label: 'Prospection', aliases: ['prospection'] },
  { key: 'resistance_air', label: 'Résistance Air', aliases: ['resistance air', 'résistance air'], suffix: '%' as const },
  { key: 'resistance_terre', label: 'Résistance Terre', aliases: ['resistance terre', 'résistance terre'], suffix: '%' as const },
  { key: 'resistance_feu', label: 'Résistance Feu', aliases: ['resistance feu', 'résistance feu'], suffix: '%' as const },
  { key: 'resistance_eau', label: 'Résistance Eau', aliases: ['resistance eau', 'résistance eau'], suffix: '%' as const },
  { key: 'resistance_neutre', label: 'Résistance Neutre', aliases: ['resistance neutre', 'résistance neutre'], suffix: '%' as const },
  // Flat ("fixe") elemental resistance is a different stat from the percentage
  // one, not a different way of writing it: different mechanic, different unit,
  // different rune weight, different price. They shared a key, so an item with
  // both reported one line with whichever value happened to be matched last,
  // and a flat 5 could be scored against a percentage roll's bounds.
  //
  // The label is identical in the client — only the `%` separates them — so the
  // suffix is what the matcher discriminates on. DofusDB is unambiguous:
  // characteristics 33-37 are "(%)" and 54-58 are "(fixe)".
  { key: 'resistance_terre_fixe', label: 'Résistance Terre (fixe)', aliases: ['resistance terre fixe', 'résistance terre (fixe)', 'resistance terre (fixe)'] },
  { key: 'resistance_feu_fixe', label: 'Résistance Feu (fixe)', aliases: ['resistance feu fixe', 'résistance feu (fixe)', 'resistance feu (fixe)'] },
  { key: 'resistance_eau_fixe', label: 'Résistance Eau (fixe)', aliases: ['resistance eau fixe', 'résistance eau (fixe)', 'resistance eau (fixe)'] },
  { key: 'resistance_air_fixe', label: 'Résistance Air (fixe)', aliases: ['resistance air fixe', 'résistance air (fixe)', 'resistance air (fixe)'] },
  { key: 'resistance_neutre_fixe', label: 'Résistance Neutre (fixe)', aliases: ['resistance neutre fixe', 'résistance neutre (fixe)', 'resistance neutre (fixe)'] },
  { key: 'fuite', label: 'Fuite', aliases: ['fuite'] },
  { key: 'tacle', label: 'Tacle', aliases: ['tacle'] },
  { key: 'dommages_poussee', label: 'Dommages Poussée', aliases: ['dommages poussee', 'dommage poussee', 'dommages poussée', 'dommage poussée', 'do pou', 'dopou'] },
  { key: 'resistance_poussee', label: 'Résistance Poussée', aliases: ['resistance poussee', 'résistance poussée', 'resistances poussee', 'résistances poussée', 'res pou'] },
  { key: 'dommages_distance', label: 'Dommages Distance', aliases: ['dommages distance', 'dommages distances', 'dommages a distance', 'dommages à distance', 'do distance', 'do distances', 'do a distance', 'do à distance'], suffix: '%' as const },
  { key: 'dommages_melee', label: 'Dommages Melee', aliases: ['dommages melee', 'dommages mêlee', 'dommages mêlée', 'dommages au corps a corps', 'dommages au corps à corps', 'corps a corps', 'corps à corps', 'do melee', 'do mêlee', 'do mêlée'], suffix: '%' as const },
  { key: 'dommages_sort', label: 'Dommages Sort', aliases: ['dommages sort', 'dommages sorts', 'dommages au sort', 'dommages aux sorts', 'dommages sorts', 'do sort', 'do sorts'], suffix: '%' as const },
  { key: 'arme_de_chasse', label: 'Arme de Chasse', aliases: ['arme de chasse', 'arme chasse', 'chasse'], binary: true as const },
]

export const specialMageStatKeys = new Set([
  'pa',
  'pm',
  'po',
  'invocation',
  'dommages_critiques',
  'dommages_poussee',
  'dommages_distance',
  'dommages_melee',
  'dommages_sort',
  'arme_de_chasse',
])

export const normalizeLabelForStatKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[{}[\]()]/g, ' ')
    .replace(/[^a-z0-9%+\-\s]/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\bdommage\b/g, 'dommages')
    .replace(/\bresistances?\b/g, 'resistance')
    .replace(/\s+/g, ' ')
    .trim()

export const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const hasWholeWordStatAliasMatch = (normalizedLabel: string, normalizedAlias: string) => {
  if (!normalizedLabel || !normalizedAlias) return false
  if (normalizedLabel === normalizedAlias) return true
  if (normalizedAlias.length < 3 || normalizedLabel.length < 3) return false

  const aliasPattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedAlias)}(\\s|$)`)
  const labelPattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedLabel)}(\\s|$)`)

  return aliasPattern.test(normalizedLabel) || labelPattern.test(normalizedAlias)
}

export const normalizeSpecialMageSignature = (value: string) =>
  normalizeLabelForStatKey(value)
    .replace(/\b(aux|au|a|de|des|du|les|le|la)\b/g, ' ')
    .replace(/\bcorps a corps\b/g, 'melee')
    .replace(/\bcorps\b/g, 'melee')
    .replace(/\bsorts?\b/g, 'sort')
    .replace(/\bdistances?\b/g, 'distance')
    .replace(/\s+/g, '')
    .trim()

/** Aliases this short must match the whole signature, never a fragment of it. */
const SHORT_ALIAS_LENGTH = 3

export const findSpecialMageDef = (label: string) => {
  const signature = normalizeSpecialMageSignature(label)
  if (!signature) return undefined

  // Longest match wins, rather than whichever def happens to come first in the
  // catalogue. Order used to decide it, so "Dommages Poussée" resolved to PO —
  // `po` sits earlier in the list and `dommagespoussee` contains `po`. Short
  // aliases now have to match outright, which is what stops a two-letter stat
  // name being found inside a longer one at all.
  let best: { def: StatDef; length: number } | undefined

  for (const def of statsOcrDefs) {
    if (!specialMageStatKeys.has(def.key)) continue

    for (const alias of [def.label, ...def.aliases]) {
      const aliasSignature = normalizeSpecialMageSignature(alias)
      if (!aliasSignature) continue

      const matches = aliasSignature.length <= SHORT_ALIAS_LENGTH
        ? signature === aliasSignature
        : signature === aliasSignature || signature.includes(aliasSignature)

      if (matches && (!best || aliasSignature.length > best.length)) {
        best = { def, length: aliasSignature.length }
      }
    }
  }

  return best?.def
}

/** DofusDB gives every effect a numeric `characteristic`, which is far more
 *  reliable than matching its French description. Ids come from
 *  https://api.dofusdb.fr/characteristics.
 *
 *  Percentage (33-37) and flat (54-58) elemental resistances are separate keys:
 *  they are separate mechanics with separate units and separate market value,
 *  and collapsing them meant an item carrying both reported one. Ids left out
 *  (melee/weapon %) fall through to label matching rather than risk a wrong
 *  mapping — but note that a *wrong* entry here is worse than a missing one,
 *  because the characteristic is trusted ahead of the effect's own French
 *  description. `itemStats.spec.ts` pins the ids that have a "(fixe)" twin. */
export const CHARACTERISTIC_TO_STAT_KEY: Record<number, string> = {
  1: 'pa',
  10: 'force',
  11: 'vitalite',
  12: 'sagesse',
  13: 'chance',
  14: 'agilite',
  15: 'intelligence',
  16: 'dommages',
  18: 'critique',
  19: 'po',
  23: 'pm',
  26: 'invocation',
  27: 'esquive_pa',
  28: 'esquive_pm',
  33: 'resistance_terre',
  34: 'resistance_feu',
  35: 'resistance_eau',
  36: 'resistance_air',
  37: 'resistance_neutre',
  44: 'initiative',
  48: 'prospection',
  // "(fixe)" per DofusDB — flat resistance, a different stat from the % twin
  // above. These used to point at the same keys as 33-37.
  54: 'resistance_terre_fixe',
  55: 'resistance_feu_fixe',
  56: 'resistance_eau_fixe',
  57: 'resistance_air_fixe',
  58: 'resistance_neutre_fixe',
  78: 'fuite',
  79: 'tacle',
  82: 'retrait_pa',
  83: 'retrait_pm',
  84: 'dommages_poussee',
  // The "(fixe)" twin of an id is always the resistance, never the damage.
  // DofusDB spells it out: effect 416 (char 85) is "Résistance Poussée" and
  // effect 420 (char 87) is "Résistance Critiques". Mapping both onto the
  // damage key made every item carrying one report a stat it does not have.
  85: 'resistance_poussee',
  86: 'dommages_critiques',
  87: 'resistance_critique',
  88: 'dommages_terre',
  89: 'dommages_feu',
  90: 'dommages_eau',
  91: 'dommages_air',
  92: 'dommages_neutre',
  123: 'dommages_sort',
}

/** `category: 2` is the weapon's own attack line — the "EFFETS DE L'ARME"
 *  block. It is identical on every copy of the weapon and never appears in the
 *  stats panel a player screenshots, so it is not an expected roll. */
export const WEAPON_ATTACK_EFFECT_CATEGORY = 2
