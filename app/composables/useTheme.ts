// composables/useTheme.ts
export type ThemeType = 'default' | 'slate';

export interface Theme {
  id: ThemeType;
  name: string;
  description: string;
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Dark gradient theme with vibrant accents'
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Clean, minimal design with neutral tones'
  }
];

export const useTheme = () => {
  const currentTheme = useState<ThemeType>('theme', () => 'default');

  const initTheme = () => {
    // Only run on client
    if (import.meta.server) return;

    const saved = localStorage.getItem('theme') as ThemeType | null;
    if (saved && themes.some(t => t.id === saved)) {
      currentTheme.value = saved;
    }
    document.documentElement.setAttribute('data-theme', currentTheme.value);
  };

  const setTheme = (theme: ThemeType) => {
    currentTheme.value = theme;

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
  const isSlate = computed(() => currentTheme.value === 'slate');
  const isDefault = computed(() => currentTheme.value === 'default');

  return {
    currentTheme,
    initTheme,
    setTheme,
    themes,
    isSlate,
    isDefault
  };
};
