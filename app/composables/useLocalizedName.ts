// The upstream Dofus APIs return names as { fr, en, es, … }. Pages were
// reaching straight for `.fr`, so an English user got French category names.
export const useLocalizedName = () => {
  const { locale } = useI18n()

  const localizedName = (
    value: Record<string, string> | string | null | undefined,
    fallback = '',
  ): string => {
    if (!value) return fallback
    if (typeof value === 'string') return value
    return value[locale.value] || value.en || value.fr || fallback
  }

  return { localizedName }
}
