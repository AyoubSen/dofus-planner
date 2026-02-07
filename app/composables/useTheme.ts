// composables/useTheme.ts
export type ThemeType = 'minimal' | 'graphite';

export interface Theme {
  id: ThemeType;
  name: string;
  description: string;
}

export const themes: Theme[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean minimal dark theme with soft color accents'
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Flat dark UI with reduced visual noise'
  }
];

export const useTheme = () => {
  const { data, init } = useAppDataStore();
  const currentTheme = useState<ThemeType>('theme', () => 'minimal');

  const initTheme = () => {
    // Only run on client
    if (import.meta.server) return;

    init();

    const savedFromStore = data.value.settings.theme as ThemeType | null;
    const savedLegacy = localStorage.getItem('theme') as ThemeType | null;
    const saved = savedFromStore || savedLegacy;

    const normalizedSaved = saved === 'shadcn' ? 'minimal' : saved;

    if (normalizedSaved && themes.some(t => t.id === normalizedSaved)) {
      currentTheme.value = normalizedSaved as ThemeType;
    } else {
      currentTheme.value = 'minimal';
    }

    data.value.settings.theme = currentTheme.value;
    document.documentElement.setAttribute('data-theme', currentTheme.value);
  };

  const setTheme = (theme: ThemeType) => {
    currentTheme.value = theme;
    data.value.settings.theme = theme;

    // Only access browser APIs on client
    if (import.meta.client) {
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  };

  // Watch for theme changes (useful if theme changes from another component)
  watch(currentTheme, (newTheme) => {
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  });

  // Computed properties for theme-specific styling
  const isMinimal = computed(() => currentTheme.value === 'minimal');
  const isGraphite = computed(() => currentTheme.value === 'graphite');

  return {
    currentTheme,
    initTheme,
    setTheme,
    themes,
    isMinimal,
    isGraphite,
  };
};
