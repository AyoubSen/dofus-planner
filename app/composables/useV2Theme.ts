// composables/useV2Theme.ts
export type V2ThemeType = 'classic' | 'royal-green' | 'midnight';

export interface V2Theme {
  id: V2ThemeType;
  name: string;
  description: string;
}

export const v2Themes: V2Theme[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Warm dark gold — the original Dofus RPG feel',
  },
  {
    id: 'royal-green',
    name: 'Royal Green',
    description: 'Deep forest emerald — verdant and easy on the eyes',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark ocean blue — cool, calm and focused',
  },
];

const V2_THEME_KEY = 'v2-theme';

export const useV2Theme = () => {
  const currentV2Theme = useState<V2ThemeType>('v2-theme', () => 'classic');
  const v2RootEl = ref<HTMLElement | null>(null);

  const applyTheme = (theme: V2ThemeType, el?: HTMLElement | null) => {
    const target = el ?? v2RootEl.value ?? document.querySelector('.v2-root') as HTMLElement | null;
    if (target) target.setAttribute('data-v2-theme', theme);
  };

  const initV2Theme = () => {
    if (import.meta.server) return;
    const saved = localStorage.getItem(V2_THEME_KEY) as V2ThemeType | null;
    if (saved && v2Themes.some(t => t.id === saved)) {
      currentV2Theme.value = saved;
    } else {
      currentV2Theme.value = 'classic';
    }
    applyTheme(currentV2Theme.value);
  };

  const setV2Theme = (theme: V2ThemeType) => {
    currentV2Theme.value = theme;
    if (import.meta.client) {
      localStorage.setItem(V2_THEME_KEY, theme);
      applyTheme(theme);
    }
  };

  return {
    currentV2Theme,
    v2Themes,
    initV2Theme,
    setV2Theme,
  };
};
