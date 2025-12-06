// composables/useSoldItems.ts

import type { SoldItem } from '~/types/game'

const STORAGE_KEY = 'dofus-sold-items'

export const useSoldItems = () => {
  const soldItems = useState<SoldItem[]>('sold-items', () => [])
  const isInitialized = useState<boolean>('sold-items-initialized', () => false)

  const ensureInitialized = () => {
    if (isInitialized.value) return
    if (!import.meta.client) return
    
    loadFromStorage()
    isInitialized.value = true
  }

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        soldItems.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load sold items:', error)
    }
  }

  const saveToStorage = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(soldItems.value))
    } catch (error) {
      console.error('Failed to save sold items:', error)
    }
  }

  // Auto-initialize
  ensureInitialized()

  watch(soldItems, () => {
    if (isInitialized.value) {
      saveToStorage()
    }
  }, { deep: true })

  const getItemsForCharacter = (serverId: string, characterId: string) => {
    return computed(() => 
      soldItems.value.filter(
        item => item.serverId === serverId && item.characterId === characterId
      )
    )
  }

  const getItemsForServer = (serverId: string) => {
    return computed(() => 
      soldItems.value.filter(item => item.serverId === serverId)
    )
  }

  const addSoldItem = (item: Omit<SoldItem, 'id' | 'dateSold'>) => {
    const newItem: SoldItem = {
      ...item,
      id: crypto.randomUUID(),
      dateSold: new Date().toISOString(),
    }
    soldItems.value.unshift(newItem)
    return newItem
  }

  const deleteSoldItem = (itemId: string) => {
    const index = soldItems.value.findIndex(i => i.id === itemId)
    if (index !== -1) {
      soldItems.value.splice(index, 1)
    }
  }

  const getTotalValue = (serverId?: string, characterId?: string) => {
    return computed(() => {
      let items = soldItems.value
      
      if (serverId) {
        items = items.filter(i => i.serverId === serverId)
      }
      if (characterId) {
        items = items.filter(i => i.characterId === characterId)
      }
      
      return items.reduce((total, item) => total + item.price, 0)
    })
  }

  return {
    soldItems: readonly(soldItems),
    getItemsForCharacter,
    getItemsForServer,
    addSoldItem,
    deleteSoldItem,
    getTotalValue,
  }
}