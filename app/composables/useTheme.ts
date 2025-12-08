// composables/useTheme.ts
export type ThemeType = 'default' | 'cyberpunk' | 'medieval';

export const useTheme = () => {
  const currentTheme = useState<ThemeType>('theme', () => 'default');

  const initTheme = () => {
    // Only run on client
    if (import.meta.server) return;

    const saved = localStorage.getItem('theme') as ThemeType | null;
    if (saved && ['default', 'cyberpunk', 'medieval'].includes(saved)) {
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

  return { currentTheme, initTheme, setTheme };
};