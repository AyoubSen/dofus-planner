import type { Server, Character } from '~/types/game'

const LEGACY_KEYS = ['archimonstres-servers', 'dofus-achievement-servers']

interface AddResult {
  success: boolean
  error?: string
  data?: Server | Character
}

export const useAccounts = () => {
  const { data, init } = useAppDataStore()
  const servers = computed({
    get: () => data.value.accounts.servers,
    set: (value) => {
      data.value.accounts.servers = value
    },
  })
  const isInitialized = useState<boolean>('accounts-initialized', () => false)

  const initAccounts = () => {
    if (!import.meta.client) return
    if (isInitialized.value) return

    init()

    // Keep this compatibility migration for old account keys until dedicated migration work.
    if (servers.value.length === 0) {
      migrateFromOldKeys()
    }

    isInitialized.value = true
  }

  const migrateFromOldKeys = () => {
    const allServers: Server[] = []
    const seenServerNames = new Set<string>()

    for (const oldKey of LEGACY_KEYS) {
      const oldData = localStorage.getItem(oldKey)
      if (oldData) {
        try {
          const oldServers: Server[] = JSON.parse(oldData)
          for (const server of oldServers) {
            const normalizedName = server.name.toLowerCase().trim()
            if (!seenServerNames.has(normalizedName)) {
              seenServerNames.add(normalizedName)
              allServers.push({
                ...server,
                createdAt: server.createdAt || new Date().toISOString()
              })
            } else {
              // Merge characters from duplicate server
              const existingServer = allServers.find(
                s => s.name.toLowerCase().trim() === normalizedName
              )
              if (existingServer && server.characters) {
                const existingCharNames = new Set(
                  existingServer.characters.map(c => c.name.toLowerCase().trim())
                )
                for (const char of server.characters) {
                  if (!existingCharNames.has(char.name.toLowerCase().trim())) {
                    existingServer.characters.push(char)
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error migrating from ${oldKey}:`, error)
        }
      }
    }

    if (allServers.length > 0) {
      servers.value = allServers
    }
  }

  const getServerById = (serverId: string): Server | undefined => {
    return servers.value.find(s => s.id === serverId)
  }

  const getCharacterById = (serverId: string, characterId: string): Character | undefined => {
    const server = getServerById(serverId)
    return server?.characters.find(c => c.id === characterId)
  }

  const addServer = (name: string): AddResult => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return { success: false, error: 'Server name is required' }
    }

    // Check for duplicate (case-insensitive)
    const exists = servers.value.some(
      s => s.name.toLowerCase() === trimmedName.toLowerCase()
    )

    if (exists) {
      return { success: false, error: 'A server with this name already exists' }
    }

    const newServer: Server = {
      id: Date.now().toString(),
      name: trimmedName,
      characters: [],
      createdAt: new Date().toISOString()
    }

    servers.value.push(newServer)
    return { success: true, data: newServer }
  }

  const deleteServer = (serverId: string): boolean => {
    const index = servers.value.findIndex(s => s.id === serverId)
    if (index !== -1) {
      servers.value.splice(index, 1)
      return true
    }
    return false
  }

  const addCharacter = (
    serverId: string,
    characterData: { name: string; class: string; level?: number }
  ): AddResult => {
    const server = getServerById(serverId)

    if (!server) {
      return { success: false, error: 'Server not found' }
    }

    const trimmedName = characterData.name.trim()

    if (!trimmedName) {
      return { success: false, error: 'Character name is required' }
    }

    // Check for duplicate character name on this server (case-insensitive)
    const exists = server.characters.some(
      c => c.name.toLowerCase() === trimmedName.toLowerCase()
    )

    if (exists) {
      return { success: false, error: 'A character with this name already exists on this server' }
    }

    const newCharacter: Character = {
      id: Date.now().toString(),
      name: trimmedName,
      class: characterData.class,
      level: characterData.level || 200,
      createdAt: new Date().toISOString()
    }

    server.characters.push(newCharacter)
    return { success: true, data: newCharacter }
  }

  const deleteCharacter = (serverId: string, characterId: string): boolean => {
    const server = getServerById(serverId)
    if (!server) return false

    const index = server.characters.findIndex(c => c.id === characterId)
    if (index !== -1) {
      server.characters.splice(index, 1)
      return true
    }
    return false
  }

  const updateCharacter = (
    serverId: string,
    characterId: string,
    updates: Partial<Pick<Character, 'name' | 'class' | 'level'>>
  ): AddResult => {
    const server = getServerById(serverId)
    if (!server) {
      return { success: false, error: 'Server not found' }
    }

    const character = server.characters.find(c => c.id === characterId)
    if (!character) {
      return { success: false, error: 'Character not found' }
    }

    // If updating name, check for duplicates
    if (updates.name) {
      const trimmedName = updates.name.trim()
      const exists = server.characters.some(
        c => c.id !== characterId && c.name.toLowerCase() === trimmedName.toLowerCase()
      )
      if (exists) {
        return { success: false, error: 'A character with this name already exists on this server' }
      }
      character.name = trimmedName
    }

    if (updates.class) character.class = updates.class
    if (updates.level !== undefined) character.level = updates.level

    return { success: true, data: character }
  }

  return {
    servers,
    initAccounts,
    getServerById,
    getCharacterById,
    addServer,
    deleteServer,
    addCharacter,
    deleteCharacter,
    updateCharacter
  }
}
