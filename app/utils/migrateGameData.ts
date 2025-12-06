// utils/migrateGameData.ts

import type { Server, Character, GameDataStore } from '~/types/game'

const OLD_KEYS = {
  archimonstres: 'archimonstres-servers',
  achievements: 'dofus-achievement-servers',
  soldItems: 'sold-equipments',
}

const NEW_KEY = 'dofus-game-data'
const MIGRATION_FLAG = 'dofus-migration-v1-complete'

export const migrateGameData = (): boolean => {
  // Check if already migrated
  if (localStorage.getItem(MIGRATION_FLAG)) {
    return false
  }

  // Check if new data already exists
  if (localStorage.getItem(NEW_KEY)) {
    localStorage.setItem(MIGRATION_FLAG, 'true')
    return false
  }

  console.log('Starting game data migration...')

  try {
    const mergedServers = new Map<string, Server>()

    // Process archimonstres servers
    const archiData = localStorage.getItem(OLD_KEYS.archimonstres)
    if (archiData) {
      const servers = JSON.parse(archiData) as any[]
      
      servers.forEach(oldServer => {
        const serverKey = oldServer.name.toLowerCase().trim()
        
        if (!mergedServers.has(serverKey)) {
          mergedServers.set(serverKey, {
            id: oldServer.id || crypto.randomUUID(),
            name: oldServer.name,
            characters: [],
            createdAt: new Date().toISOString(),
          })
        }

        const server = mergedServers.get(serverKey)!
        
        // Add characters
        if (oldServer.characters) {
          oldServer.characters.forEach((oldChar: any) => {
            // Check if character already exists
            const existingChar = server.characters.find(
              c => c.name.toLowerCase() === oldChar.name.toLowerCase()
            )
            
            if (!existingChar) {
              const newChar: Character = {
                id: oldChar.id || crypto.randomUUID(),
                name: oldChar.name,
                class: oldChar.class || 'Unknown',
                level: oldChar.level || 200,
                createdAt: new Date().toISOString(),
              }

              // Migrate archimonstres progress if exists
              if (oldChar.monsters || oldChar.progress) {
                newChar.archimonstresProgress = {
                  mode: oldChar.mode || null,
                  monsters: oldChar.monsters || oldChar.progress || {},
                  lastUpdated: new Date().toISOString(),
                }
              }

              server.characters.push(newChar)
            }
          })
        }
      })
    }

    // Process achievements servers
    const achieveData = localStorage.getItem(OLD_KEYS.achievements)
    if (achieveData) {
      const servers = JSON.parse(achieveData) as any[]
      
      servers.forEach(oldServer => {
        const serverKey = oldServer.name.toLowerCase().trim()
        
        if (!mergedServers.has(serverKey)) {
          mergedServers.set(serverKey, {
            id: oldServer.id || crypto.randomUUID(),
            name: oldServer.name,
            characters: [],
            createdAt: new Date().toISOString(),
          })
        }

        const server = mergedServers.get(serverKey)!
        
        if (oldServer.characters) {
          oldServer.characters.forEach((oldChar: any) => {
            // Find existing character or create new
            let character = server.characters.find(
              c => c.name.toLowerCase() === oldChar.name.toLowerCase()
            )
            
            if (!character) {
              character = {
                id: oldChar.id || crypto.randomUUID(),
                name: oldChar.name,
                class: oldChar.class || 'Unknown',
                level: oldChar.level || 200,
                createdAt: new Date().toISOString(),
              }
              server.characters.push(character)
            }

            // Migrate achievements progress
            if (oldChar.completed || oldChar.achievements) {
              character.achievementsProgress = {
                completed: oldChar.completed || oldChar.achievements || [],
                lastUpdated: new Date().toISOString(),
              }
            }
          })
        }
      })
    }

    // Migrate sold items - update references
    const soldData = localStorage.getItem(OLD_KEYS.soldItems)
    if (soldData) {
      const soldItems = JSON.parse(soldData) as any[]
      
      // Update sold items with new server/character IDs
      const updatedSoldItems = soldItems.map(item => {
        // Try to find matching server and character
        let serverId = item.serverId
        let characterId = item.characterId

        // If using old format with names, find new IDs
        if (item.server && !item.serverId) {
          const serverKey = item.server.toLowerCase().trim()
          const server = mergedServers.get(serverKey)
          if (server) {
            serverId = server.id
            
            if (item.character) {
              const char = server.characters.find(
                c => c.name.toLowerCase() === item.character.toLowerCase()
              )
              if (char) {
                characterId = char.id
              }
            }
          }
        }

        return {
          ...item,
          serverId,
          characterId,
        }
      })

      localStorage.setItem('dofus-sold-items', JSON.stringify(updatedSoldItems))
    }

    // Save merged data
    const newData: GameDataStore = {
      servers: Array.from(mergedServers.values()),
      version: 1,
    }

    localStorage.setItem(NEW_KEY, JSON.stringify(newData))
    localStorage.setItem(MIGRATION_FLAG, 'true')

    // Clean up old keys (optional - you might want to keep them for safety)
    // localStorage.removeItem(OLD_KEYS.archimonstres)
    // localStorage.removeItem(OLD_KEYS.achievements)
    // localStorage.removeItem(OLD_KEYS.soldItems)

    console.log('Migration complete!', {
      servers: newData.servers.length,
      characters: newData.servers.reduce((sum, s) => sum + s.characters.length, 0),
    })

    return true
  } catch (error) {
    console.error('Migration failed:', error)
    return false
  }
}

// Helper to check if migration is needed
export const needsMigration = (): boolean => {
  if (localStorage.getItem(MIGRATION_FLAG)) return false
  if (localStorage.getItem(NEW_KEY)) return false
  
  return !!(
    localStorage.getItem(OLD_KEYS.archimonstres) ||
    localStorage.getItem(OLD_KEYS.achievements)
  )
}