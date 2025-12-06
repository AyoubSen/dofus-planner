// composables/useGameData.ts

import type { Server, Character, GameDataStore } from '~/types/game'

const STORAGE_KEY = 'dofus-game-data'
const CURRENT_VERSION = 1

export const useGameData = () => {
  // State inside the composable function (SSR safe with useState)
  const gameData = useState<GameDataStore>('game-data', () => ({
    servers: [],
    version: CURRENT_VERSION,
  }))

  const isInitialized = useState<boolean>('game-data-initialized', () => false)
  const currentServerId = useState<string | null>('current-server-id', () => null)
  const currentCharacterId = useState<string | null>('current-character-id', () => null)

  // Auto-initialize function
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
        const parsed = JSON.parse(stored) as GameDataStore
        gameData.value = parsed
      }
    } catch (error) {
      console.error('Failed to load game data:', error)
    }
  }

  const saveToStorage = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData.value))
    } catch (error) {
      console.error('Failed to save game data:', error)
    }
  }

  // Auto-initialize on first use
  ensureInitialized()

  // Computed properties
  const servers = computed(() => gameData.value.servers)
  
  const currentServer = computed(() => {
    if (!currentServerId.value) return null
    return gameData.value.servers.find(s => s.id === currentServerId.value) || null
  })
  
  const currentCharacter = computed(() => {
    if (!currentServer.value || !currentCharacterId.value) return null
    return currentServer.value.characters.find(c => c.id === currentCharacterId.value) || null
  })

  // Watch for changes and auto-save
  watch(gameData, () => {
    if (isInitialized.value) {
      saveToStorage()
    }
  }, { deep: true })

  // Server operations
  const addServer = (name: string): Server => {
    const newServer: Server = {
      id: crypto.randomUUID(),
      name: name.trim(),
      characters: [],
      createdAt: new Date().toISOString(),
    }
    gameData.value.servers.push(newServer)
    return newServer
  }

  const deleteServer = (serverId: string) => {
    const index = gameData.value.servers.findIndex(s => s.id === serverId)
    if (index !== -1) {
      gameData.value.servers.splice(index, 1)
      if (currentServerId.value === serverId) {
        currentServerId.value = null
        currentCharacterId.value = null
      }
    }
  }

  const selectServer = (serverId: string | null) => {
    currentServerId.value = serverId
    currentCharacterId.value = null
  }

  // Character operations
  const addCharacter = (serverId: string, data: { name: string; class: string; level?: number }): Character | null => {
    const server = gameData.value.servers.find(s => s.id === serverId)
    if (!server) return null

    const newCharacter: Character = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      class: data.class,
      level: data.level || 200,
      createdAt: new Date().toISOString(),
    }

    server.characters.push(newCharacter)
    return newCharacter
  }

  const deleteCharacter = (serverId: string, characterId: string) => {
    const server = gameData.value.servers.find(s => s.id === serverId)
    if (!server) return

    const index = server.characters.findIndex(c => c.id === characterId)
    if (index !== -1) {
      server.characters.splice(index, 1)
      if (currentCharacterId.value === characterId) {
        currentCharacterId.value = null
      }
    }
  }

  const selectCharacter = (characterId: string | null) => {
    currentCharacterId.value = characterId
  }

  const updateCharacter = (serverId: string, characterId: string, updates: Partial<Character>) => {
    const server = gameData.value.servers.find(s => s.id === serverId)
    if (!server) return

    const character = server.characters.find(c => c.id === characterId)
    if (character) {
      Object.assign(character, updates)
    }
  }

  // Archimonstres progress
  const getArchimonstresProgress = (serverId: string, characterId: string) => {
    const server = gameData.value.servers.find(s => s.id === serverId)
    const character = server?.characters.find(c => c.id === characterId)
    return character?.archimonstresProgress || null
  }

  const updateArchimonstresProgress = (
    serverId: string,
    characterId: string,
    updates: Partial<NonNullable<Character['archimonstresProgress']>>
  ) => {
    const server = gameData.value.servers.find(s => s.id === serverId)
    const character = server?.characters.find(c => c.id === characterId)
    
    if (character) {
      if (!character.archimonstresProgress) {
        character.archimonstresProgress = {
          mode: null,
          monsters: {},
          lastUpdated: new Date().toISOString(),
        }
      }
      Object.assign(character.archimonstresProgress, updates, {
        lastUpdated: new Date().toISOString(),
      })
    }
  }

  const setMonsterStatus = (
    serverId: string,
    characterId: string,
    monsterId: string,
    status: { captured?: boolean; sold?: boolean; notes?: string }
  ) => {
    const server = gameData.value.servers.find(s => s.id === serverId)
    const character = server?.characters.find(c => c.id === characterId)
    
    if (character) {
      if (!character.archimonstresProgress) {
        character.archimonstresProgress = {
          mode: null,
          monsters: {},
          lastUpdated: new Date().toISOString(),
        }
      }
      
      const current = character.archimonstresProgress.monsters[monsterId] || { captured: false }
      character.archimonstresProgress.monsters[monsterId] = { ...current, ...status }
      character.archimonstresProgress.lastUpdated = new Date().toISOString()
    }
  }

  // Achievements progress
  const getAchievementsProgress = (serverId: string, characterId: string) => {
    const server = gameData.value.servers.find(s => s.id === serverId)
    const character = server?.characters.find(c => c.id === characterId)
    return character?.achievementsProgress || null
  }

  const toggleAchievementComplete = (
    serverId: string,
    characterId: string,
    achievementId: string
  ) => {
    const server = gameData.value.servers.find(s => s.id === serverId)
    const character = server?.characters.find(c => c.id === characterId)
    
    if (character) {
      if (!character.achievementsProgress) {
        character.achievementsProgress = {
          completed: [],
          lastUpdated: new Date().toISOString(),
        }
      }
      
      const index = character.achievementsProgress.completed.indexOf(achievementId)
      if (index === -1) {
        character.achievementsProgress.completed.push(achievementId)
      } else {
        character.achievementsProgress.completed.splice(index, 1)
      }
      character.achievementsProgress.lastUpdated = new Date().toISOString()
    }
  }

  return {
    // State
    servers,
    currentServer,
    currentCharacter,
    currentServerId: readonly(currentServerId),
    currentCharacterId: readonly(currentCharacterId),
    isInitialized: readonly(isInitialized),
    
    // Server operations
    addServer,
    deleteServer,
    selectServer,
    
    // Character operations
    addCharacter,
    deleteCharacter,
    selectCharacter,
    updateCharacter,
    
    // Archimonstres
    getArchimonstresProgress,
    updateArchimonstresProgress,
    setMonsterStatus,
    
    // Achievements
    getAchievementsProgress,
    toggleAchievementComplete,
  }
}