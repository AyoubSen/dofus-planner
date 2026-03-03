// composables/useV2Context.ts
const V2_CONTEXT_KEY = 'v2-context'

export const useV2Context = () => {
  const {
    servers,
    initAccounts,
    addServer: storeAddServer,
    deleteServer: storeDeleteServer,
    addCharacter: storeAddCharacter,
    deleteCharacter: storeDeleteCharacter,
  } = useAccounts()

  const selectedServerId = useState<string | null>('v2-server-id', () => null)
  const selectedCharacterId = useState<string | null>('v2-character-id', () => null)

  const selectedServer = computed(() =>
    servers.value.find((s) => s.id === selectedServerId.value) ?? null,
  )

  const selectedCharacter = computed(() =>
    selectedServer.value?.characters.find((c) => c.id === selectedCharacterId.value) ?? null,
  )

  const hasContext = computed(() => !!(selectedServer.value && selectedCharacter.value))

  const initContext = () => {
    if (import.meta.server) return
    initAccounts()

    const saved = localStorage.getItem(V2_CONTEXT_KEY)
    if (saved) {
      try {
        const { serverId, characterId } = JSON.parse(saved)
        const server = servers.value.find((s) => s.id === serverId)
        if (server) {
          selectedServerId.value = serverId
          const character = server.characters.find((c) => c.id === characterId)
          if (character) {
            selectedCharacterId.value = characterId
            return
          }
        }
      } catch {}
    }

    // Auto-select if only one server + character
    if (!selectedServerId.value && servers.value.length === 1) {
      const server = servers.value[0]
      selectedServerId.value = server.id
      if (server.characters.length === 1) {
        selectedCharacterId.value = server.characters[0].id
        persistContext()
      }
    }
  }

  const setContext = (serverId: string, characterId: string) => {
    selectedServerId.value = serverId
    selectedCharacterId.value = characterId
    persistContext()
  }

  const persistContext = () => {
    if (!import.meta.client) return
    localStorage.setItem(
      V2_CONTEXT_KEY,
      JSON.stringify({ serverId: selectedServerId.value, characterId: selectedCharacterId.value }),
    )
  }

  const addServer = (name: string) => storeAddServer(name)

  const deleteServer = (serverId: string) => {
    if (selectedServerId.value === serverId) {
      selectedServerId.value = null
      selectedCharacterId.value = null
      persistContext()
    }
    storeDeleteServer(serverId)
  }

  const addCharacter = (serverId: string, data: { name: string; class: string }) =>
    storeAddCharacter(serverId, data)

  const deleteCharacter = (serverId: string, characterId: string) => {
    if (selectedCharacterId.value === characterId) {
      selectedCharacterId.value = null
      persistContext()
    }
    storeDeleteCharacter(serverId, characterId)
  }

  return {
    servers,
    selectedServer,
    selectedCharacter,
    selectedServerId,
    selectedCharacterId,
    hasContext,
    initContext,
    setContext,
    addServer,
    deleteServer,
    addCharacter,
    deleteCharacter,
  }
}
