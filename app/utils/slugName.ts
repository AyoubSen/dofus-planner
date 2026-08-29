/**
 * The join key used whenever two data sources have to be matched on a French
 * name — metamob subzones against DofusDB subareas, or monsters.json against
 * the metamob catalogue. Neither side shares an id with us, so the name is all
 * there is, and it has to survive accents, apostrophes and spacing differences
 * ("Cimetière d'Astrub" vs "Cimetiere d Astrub").
 *
 * The generator scripts in scripts/ are plain .mjs and cannot import this file,
 * so each inlines its own copy. If this changes, change it there too.
 */
export const slugName = (value: string): string =>
  (value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
