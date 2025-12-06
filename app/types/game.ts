// types/game.ts

export interface Character {
  id: string
  name: string
  class: string
  level: number
  createdAt: string
  
  // Feature-specific progress (stored with character)
  archimonstresProgress?: ArchimonstresProgress
  achievementsProgress?: AchievementsProgress
}

export interface Server {
  id: string
  name: string
  characters: Character[]
  createdAt: string
}

export interface ArchimonstresProgress {
  mode: 'ocre' | 'sell' | null
  monsters: Record<string, MonsterStatus> // monsterId -> status
  lastUpdated: string
}

export interface MonsterStatus {
  captured: boolean
  sold?: boolean
  notes?: string
}

export interface AchievementsProgress {
  completed: string[] // achievement IDs
  lastUpdated: string
}

export interface SoldItem {
  id: string
  itemId: number
  item: any // The item data from API
  price: number
  notes: string | null
  customEffects: CustomEffect[]
  serverId: string
  characterId: string
  dateSold: string
}

export interface CustomEffect {
  effectId: number
  customValue: number
  description: string
}

// What gets stored in localStorage
export interface GameDataStore {
  servers: Server[]
  version: number // For future migrations
}