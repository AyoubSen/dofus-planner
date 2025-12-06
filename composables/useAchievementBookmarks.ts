// composables/useAchievementBookmarks.ts

const STORAGE_KEY = 'dofus-achievement-bookmarks'

const bookmarks = ref<any[]>([]) // Achievement objects
const isInitialized = ref(false)

export const useAchievementBookmarks = () => {
  const initialize = () => {
    if (isInitialized.value) return
    
    if (import.meta.client) {
      loadFromStorage()
      isInitialized.value = true
    }
  }

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        bookmarks.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
    }
  }

  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks.value))
    } catch (error) {
      console.error('Failed to save bookmarks:', error)
    }
  }

  watch(bookmarks, () => {
    if (isInitialized.value) {
      saveToStorage()
    }
  }, { deep: true })

  const isBookmarked = (achievementId: number) => {
    return bookmarks.value.some(a => a.id === achievementId)
  }

  const toggleBookmark = (achievement: any) => {
    const index = bookmarks.value.findIndex(a => a.id === achievement.id)
    if (index === -1) {
      bookmarks.value.push({ ...achievement })
    } else {
      bookmarks.value.splice(index, 1)
    }
  }

  const totalPoints = computed(() => 
    bookmarks.value.reduce((sum, a) => sum + (a.points || 0), 0)
  )

  return {
    bookmarks: readonly(bookmarks),
    initialize,
    isBookmarked,
    toggleBookmark,
    totalPoints,
  }
}