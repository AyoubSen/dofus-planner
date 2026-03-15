// composables/useTheme.ts
export type ThemeType = 'minimal' | 'graphite' | 'amakna';

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
  },
  {
    id: 'amakna',
    name: 'Amakna',
    description: 'Warm tavern gold — cozy RPG vibes, glows included'
  }
];

const normalizeTheme = (theme: string | null | undefined): ThemeType | null => {
  if (theme === 'minimal' || theme === 'graphite' || theme === 'amakna') {
    return theme;
  }

  if (theme === 'shadcn') {
    return 'minimal';
  }

  return null;
};

export const useTheme = () => {
  const { data, init } = useAppDataStore();
  const currentTheme = useState<ThemeType>('theme', () => 'minimal');

  const initTheme = () => {
    if (import.meta.server) return;

    init();

    const savedFromStore = data.value.settings.theme as ThemeType | null;
  const savedLegacy = localStorage.getItem('theme');
    const saved = savedFromStore || savedLegacy;

  const normalizedSaved = normalizeTheme(saved);

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

    if (import.meta.client) {
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  };

  watch(currentTheme, (newTheme) => {
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  });

  const isMinimal = computed(() => currentTheme.value === 'minimal');
  const isGraphite = computed(() => currentTheme.value === 'graphite');
  const isAmakna = computed(() => currentTheme.value === 'amakna');

  return {
    currentTheme,
    initTheme,
    setTheme,
    themes,
    isMinimal,
    isGraphite,
    isAmakna,
  };
};
