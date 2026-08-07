// composables/useAppTheme.ts
//
// One theme, two appearances. The previous version shipped five structurally
// identical single-hue dark palettes, which multiplied the token surface
// without giving anyone a meaningfully different UI.

export type ThemePreference = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'

export interface ThemeOption {
  id: ThemePreference
  labelKey: string
}

export const themeOptions: ThemeOption[] = [
  { id: 'light', labelKey: 'v2.theme.light' },
  { id: 'dark', labelKey: 'v2.theme.dark' },
  { id: 'system', labelKey: 'v2.theme.system' },
]

const THEME_KEY = 'app-theme'
const LEGACY_KEY = 'v2-theme'

const isPreference = (v: unknown): v is ThemePreference =>
  v === 'dark' || v === 'light' || v === 'system'

const systemTheme = (): ResolvedTheme =>
  import.meta.client && window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'

export const useAppTheme = () => {
  const preference = useState<ThemePreference>('app-theme', () => 'system')
  const resolved = useState<ResolvedTheme>('app-theme-resolved', () => 'dark')

  const apply = (pref: ThemePreference) => {
    if (!import.meta.client) return
    resolved.value = pref === 'system' ? systemTheme() : pref
    document.documentElement.setAttribute('data-theme', resolved.value)
  }

  const initTheme = () => {
    if (import.meta.server) return

    const saved = localStorage.getItem(THEME_KEY)
    if (isPreference(saved)) {
      preference.value = saved
    } else if (localStorage.getItem(LEGACY_KEY)) {
      // Every legacy palette (classic/royal-green/midnight/amethyst/void) was
      // dark, so honour that rather than dropping the user into system light.
      preference.value = 'dark'
      localStorage.setItem(THEME_KEY, 'dark')
      localStorage.removeItem(LEGACY_KEY)
    } else {
      preference.value = 'system'
    }

    apply(preference.value)

    // Follow the OS while the preference is 'system'.
    window
      .matchMedia('(prefers-color-scheme: light)')
      .addEventListener('change', () => {
        if (preference.value === 'system') apply('system')
      })
  }

  const setTheme = (pref: ThemePreference) => {
    preference.value = pref
    if (!import.meta.client) return
    localStorage.setItem(THEME_KEY, pref)
    apply(pref)
  }

  return { preference, resolved, themeOptions, initTheme, setTheme }
}
