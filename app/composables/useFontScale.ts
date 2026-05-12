export type FontScaleId = 'sm' | 'md' | 'lg' | 'xl'

export interface FontScale {
  id: FontScaleId
  label: string
  size: string
}

export const fontScales: FontScale[] = [
  { id: 'sm', label: 'Small',  size: '87.5%' },
  { id: 'md', label: 'Normal', size: '100%'  },
  { id: 'lg', label: 'Large',  size: '112.5%'},
  { id: 'xl', label: 'XL',     size: '125%'  },
]

const FONT_SCALE_KEY = 'font-scale'

export const useFontScale = () => {
  const currentScale = useState<FontScaleId>('font-scale', () => 'md')

  const applyScale = (id: FontScaleId) => {
    const scale = fontScales.find(s => s.id === id)
    if (scale) document.documentElement.style.fontSize = scale.size
  }

  const initFontScale = () => {
    if (import.meta.server) return
    const saved = localStorage.getItem(FONT_SCALE_KEY) as FontScaleId | null
    currentScale.value = (saved && fontScales.some(s => s.id === saved)) ? saved : 'md'
    applyScale(currentScale.value)
  }

  const setFontScale = (id: FontScaleId) => {
    currentScale.value = id
    if (!import.meta.client) return
    localStorage.setItem(FONT_SCALE_KEY, id)
    applyScale(id)
  }

  return { currentScale, fontScales, initFontScale, setFontScale }
}
