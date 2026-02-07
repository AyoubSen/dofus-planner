// composables/useSoldItems.ts

import type { SoldItem } from '~/types/game'

export const useSoldItems = () => {
  const { data, init } = useAppDataStore()
  const soldItems = computed(() => data.value.sales.items)
  const isInitialized = useState<boolean>('sold-items-initialized', () => false)

  const ensureInitialized = () => {
    if (isInitialized.value) return
    if (!import.meta.client) return
    
    init()
    isInitialized.value = true
  }

  // Auto-initialize
  ensureInitialized()

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
    data.value.sales.items.unshift(newItem)
    return newItem
  }

  const deleteSoldItem = (itemId: string) => {
    const index = data.value.sales.items.findIndex(i => i.id === itemId)
    if (index !== -1) {
      data.value.sales.items.splice(index, 1)
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
    soldItems,
    getItemsForCharacter,
    getItemsForServer,
    addSoldItem,
    deleteSoldItem,
    getTotalValue,
  }
}
