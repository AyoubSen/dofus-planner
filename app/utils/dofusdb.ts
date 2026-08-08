/** DofusDB's `slug.fr[$search]` index is accent-free and lower-case, so a term
 *  typed as "Grésilosceptre" matches nothing while "gresilosceptre" matches.
 *  Every search against that endpoint has to go through this first.
 *
 *  Shared by the items page and the brisage session builder. */
export const normalizeDofusdbSearch = (value: string): string =>
  value
    .normalize('NFD')
    // Combining diacritical marks, left behind by NFD decomposition.
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`]/g, '\'')
    .toLowerCase()
    .trim()
