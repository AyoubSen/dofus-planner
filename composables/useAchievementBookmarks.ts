// composables/useAchievementBookmarks.ts

const bookmarks = ref<any[]>([]) // Achievement objects
const isInitialized = ref(false)

export const useAchievementBookmarks = () => {
  const { data, init } = useAppDataStore()

  const initialize = () => {
    if (isInitialized.value) return
    
    if (import.meta.client) {
      init()
      bookmarks.value = data.value.achievements.bookmarks
      isInitialized.value = true
    }
  }

  watch(bookmarks, () => {
    if (isInitialized.value) {
      data.value.achievements.bookmarks = bookmarks.value
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
