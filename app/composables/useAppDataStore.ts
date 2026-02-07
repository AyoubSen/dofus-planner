import type { Server, SoldItem } from '~/types/game'

export interface AppDataStore {
  version: number
  metadata: {
    createdAt: string
    updatedAt: string
    lastMigrationAt: string | null
    lastMigratedFrom: number | null
  }
  settings: {
    theme: string | null
    locale: string | null
  }
  accounts: {
    servers: Server[]
  }
  achievements: {
    bookmarks: any[]
  }
  sales: {
    items: SoldItem[]
  }
}

const STORAGE_KEY = 'dofus-app-store'
const MIGRATION_BACKUP_PREFIX = 'dofus-app-store-backup'
const MIGRATION_LOG_KEY = 'dofus-app-store-last-migration'
const LAST_BACKUP_POINTER_KEY = 'dofus-app-store-last-backup-key'
const STORAGE_VERSION = 2

const LEGACY_KEYS = {
  accounts: 'dofus-game-accounts',
  soldItems: 'dofus-sold-items',
  bookmarks: 'dofus-achievement-bookmarks',
  theme: 'theme',
}

type MigrationFn = (store: AppDataStore) => AppDataStore
type ImportStrategy = 'replace' | 'merge'

interface ImportResult {
  success: boolean
  message: string
  strategy: ImportStrategy
}

const normalizeTheme = (value: string | null | undefined): string | null => {
  if (!value) return null
  if (value === 'minimal' || value === 'graphite') return value
  if (
    value === 'shadcn' ||
    value === 'default' ||
    value === 'slate' ||
    value === 'paper' ||
    value === 'ink'
  ) {
    return 'minimal'
  }
  return 'minimal'
}

const createDefaultStore = (): AppDataStore => {
  const now = new Date().toISOString()
  return {
    version: STORAGE_VERSION,
    metadata: {
      createdAt: now,
      updatedAt: now,
      lastMigrationAt: null,
      lastMigratedFrom: null,
    },
    settings: {
      theme: 'minimal',
      locale: null,
    },
    accounts: {
      servers: [],
    },
    achievements: {
      bookmarks: [],
    },
    sales: {
      items: [],
    },
  }
}

const isObject = (value: unknown): value is Record<string, any> => {
  return !!value && typeof value === 'object'
}

const coerceStoreShape = (input: unknown): AppDataStore | null => {
  if (!isObject(input)) return null

  const defaultStore = createDefaultStore()
  const inputMetadata = isObject(input.metadata) ? input.metadata : {}
  const inputSettings = isObject(input.settings) ? input.settings : {}
  const inputAccounts = isObject(input.accounts) ? input.accounts : {}
  const inputAchievements = isObject(input.achievements) ? input.achievements : {}
  const inputSales = isObject(input.sales) ? input.sales : {}

  return {
    version:
      typeof input.version === 'number' && Number.isFinite(input.version)
        ? input.version
        : 1,
    metadata: {
      createdAt:
        typeof inputMetadata.createdAt === 'string'
          ? inputMetadata.createdAt
          : defaultStore.metadata.createdAt,
      updatedAt:
        typeof inputMetadata.updatedAt === 'string'
          ? inputMetadata.updatedAt
          : defaultStore.metadata.updatedAt,
      lastMigrationAt:
        typeof inputMetadata.lastMigrationAt === 'string'
          ? inputMetadata.lastMigrationAt
          : null,
      lastMigratedFrom:
        typeof inputMetadata.lastMigratedFrom === 'number'
          ? inputMetadata.lastMigratedFrom
          : null,
    },
    settings: {
      theme:
        typeof inputSettings.theme === 'string' || inputSettings.theme === null
          ? inputSettings.theme
          : defaultStore.settings.theme,
      locale:
        typeof inputSettings.locale === 'string' || inputSettings.locale === null
          ? inputSettings.locale
          : defaultStore.settings.locale,
    },
    accounts: {
      servers: Array.isArray(inputAccounts.servers)
        ? (inputAccounts.servers as Server[])
        : [],
    },
    achievements: {
      bookmarks: Array.isArray(inputAchievements.bookmarks)
        ? inputAchievements.bookmarks
        : [],
    },
    sales: {
      items: Array.isArray(inputSales.items) ? (inputSales.items as SoldItem[]) : [],
    },
  }
}

const migrationV1ToV2: MigrationFn = (store) => {
  const now = new Date().toISOString()
  return {
    ...store,
    version: 2,
    settings: {
      ...store.settings,
      theme: normalizeTheme(store.settings.theme),
    },
    metadata: {
      ...store.metadata,
      updatedAt: now,
      lastMigrationAt: now,
      lastMigratedFrom: 1,
    },
  }
}

const migrations: Record<number, MigrationFn> = {
  1: migrationV1ToV2,
}

const saveBackupSnapshot = (
  raw: string,
  reason: string,
  details: Record<string, unknown> = {}
) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupKey = `${MIGRATION_BACKUP_PREFIX}-${reason}-${timestamp}`
  localStorage.setItem(backupKey, raw)
  localStorage.setItem(LAST_BACKUP_POINTER_KEY, backupKey)
  return backupKey
}

const backupStoreSnapshot = (raw: string, fromVersion: number, toVersion: number) => {
  const backupKey = saveBackupSnapshot(raw, 'migration', { fromVersion, toVersion })
  localStorage.setItem(
    MIGRATION_LOG_KEY,
    JSON.stringify({
      backupKey,
      fromVersion,
      toVersion,
      timestamp: new Date().toISOString(),
    })
  )
}

const runMigrations = (store: AppDataStore): AppDataStore => {
  let current = store
  while (current.version < STORAGE_VERSION) {
    const migrate = migrations[current.version]
    if (!migrate) break
    current = migrate(current)
  }
  return current
}

const mergeServers = (current: Server[], incoming: Server[]): Server[] => {
  const merged: Server[] = current.map((server) => ({
    ...server,
    characters: [...server.characters],
  }))

  for (const incomingServer of incoming) {
    const serverIndex = merged.findIndex(
      (server) => server.name.toLowerCase().trim() === incomingServer.name.toLowerCase().trim()
    )

    if (serverIndex === -1) {
      merged.push({ ...incomingServer, characters: [...incomingServer.characters] })
      continue
    }

    const existingServer = merged[serverIndex]
    for (const incomingChar of incomingServer.characters || []) {
      const existingCharIndex = existingServer.characters.findIndex(
        (char) => char.name.toLowerCase().trim() === incomingChar.name.toLowerCase().trim()
      )

      if (existingCharIndex === -1) {
        existingServer.characters.push({ ...incomingChar })
      } else {
        existingServer.characters[existingCharIndex] = {
          ...existingServer.characters[existingCharIndex],
          ...incomingChar,
        }
      }
    }
  }

  return merged
}

const mergeStores = (current: AppDataStore, incoming: AppDataStore): AppDataStore => {
  const mergedBookmarksMap = new Map<number | string, any>()
  for (const bookmark of current.achievements.bookmarks) {
    const key = bookmark?.id ?? JSON.stringify(bookmark)
    mergedBookmarksMap.set(key, bookmark)
  }
  for (const bookmark of incoming.achievements.bookmarks) {
    const key = bookmark?.id ?? JSON.stringify(bookmark)
    mergedBookmarksMap.set(key, bookmark)
  }

  const mergedSalesMap = new Map<string, SoldItem>()
  for (const item of current.sales.items) {
    mergedSalesMap.set(item.id, item)
  }
  for (const item of incoming.sales.items) {
    mergedSalesMap.set(item.id, item)
  }

  return {
    ...current,
    version: STORAGE_VERSION,
    settings: {
      theme: normalizeTheme(incoming.settings.theme || current.settings.theme),
      locale: incoming.settings.locale || current.settings.locale,
    },
    accounts: {
      servers: mergeServers(current.accounts.servers, incoming.accounts.servers),
    },
    achievements: {
      bookmarks: Array.from(mergedBookmarksMap.values()),
    },
    sales: {
      items: Array.from(mergedSalesMap.values()),
    },
    metadata: {
      ...current.metadata,
      updatedAt: new Date().toISOString(),
      lastMigrationAt: current.metadata.lastMigrationAt,
      lastMigratedFrom: current.metadata.lastMigratedFrom,
    },
  }
}

export const useAppDataStore = () => {
  const data = useState<AppDataStore>('app-data-store', createDefaultStore)
  const isInitialized = useState<boolean>('app-data-store-initialized', () => false)
  let isPersisting = false

  const persist = () => {
    if (!import.meta.client || !isInitialized.value || isPersisting) return

    isPersisting = true
    data.value.metadata.updatedAt = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.value))
    queueMicrotask(() => {
      isPersisting = false
    })
  }

  const hydrateLegacyData = () => {
    if (!import.meta.client) return

    let hasChanges = false

    if (data.value.accounts.servers.length === 0) {
      const legacyAccounts = localStorage.getItem(LEGACY_KEYS.accounts)
      if (legacyAccounts) {
        try {
          const parsed = JSON.parse(legacyAccounts)
          if (Array.isArray(parsed)) {
            data.value.accounts.servers = parsed
            hasChanges = true
          }
        } catch (error) {
          console.error('Failed to parse legacy accounts data:', error)
        }
      }
    }

    if (data.value.sales.items.length === 0) {
      const legacySoldItems = localStorage.getItem(LEGACY_KEYS.soldItems)
      if (legacySoldItems) {
        try {
          const parsed = JSON.parse(legacySoldItems)
          if (Array.isArray(parsed)) {
            data.value.sales.items = parsed
            hasChanges = true
          }
        } catch (error) {
          console.error('Failed to parse legacy sold items data:', error)
        }
      }
    }

    if (data.value.achievements.bookmarks.length === 0) {
      const legacyBookmarks = localStorage.getItem(LEGACY_KEYS.bookmarks)
      if (legacyBookmarks) {
        try {
          const parsed = JSON.parse(legacyBookmarks)
          if (Array.isArray(parsed)) {
            data.value.achievements.bookmarks = parsed
            hasChanges = true
          }
        } catch (error) {
          console.error('Failed to parse legacy bookmarks data:', error)
        }
      }
    }

    if (!data.value.settings.theme) {
      const legacyTheme = localStorage.getItem(LEGACY_KEYS.theme)
      if (legacyTheme) {
        data.value.settings.theme = normalizeTheme(legacyTheme)
        hasChanges = true
      }
    } else {
      const normalizedTheme = normalizeTheme(data.value.settings.theme)
      if (normalizedTheme !== data.value.settings.theme) {
        data.value.settings.theme = normalizedTheme
        hasChanges = true
      }
    }

    if (hasChanges) {
      persist()
    }
  }

  const init = () => {
    if (!import.meta.client || isInitialized.value) return

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      data.value = createDefaultStore()
    } else {
      try {
        const parsedRaw = JSON.parse(raw)
        const coerced = coerceStoreShape(parsedRaw)

        if (!coerced) {
          data.value = createDefaultStore()
        } else {
          const fromVersion = coerced.version
          const migrated = runMigrations(coerced)

          if (fromVersion < migrated.version) {
            backupStoreSnapshot(raw, fromVersion, migrated.version)
          }

          data.value = migrated
        }
      } catch (error) {
        console.error('Failed to parse unified app data store:', error)
        data.value = createDefaultStore()
      }
    }

    isInitialized.value = true
    hydrateLegacyData()
    persist()
  }

  const createBackup = (reason: string) => {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || JSON.stringify(data.value)
      return saveBackupSnapshot(raw, reason)
    } catch (error) {
      console.error('Failed to create store backup:', error)
      return null
    }
  }

  const exportStore = () => {
    const payload = {
      type: 'dofus-app-backup',
      exportedAt: new Date().toISOString(),
      schemaVersion: STORAGE_VERSION,
      store: data.value,
    }
    return JSON.stringify(payload, null, 2)
  }

  const parseImportedStore = (raw: string): AppDataStore | null => {
    try {
      const parsed = JSON.parse(raw)
      const candidate = isObject(parsed) && isObject(parsed.store) ? parsed.store : parsed
      const coerced = coerceStoreShape(candidate)
      if (!coerced) return null
      return runMigrations(coerced)
    } catch (error) {
      console.error('Failed to parse imported store:', error)
      return null
    }
  }

  const importStore = (raw: string, strategy: ImportStrategy = 'replace'): ImportResult => {
    if (!import.meta.client) {
      return { success: false, message: 'Import is only available on client.', strategy }
    }

    const parsed = parseImportedStore(raw)
    if (!parsed) {
      return { success: false, message: 'Invalid backup file format.', strategy }
    }

    createBackup('before-import')

    if (strategy === 'replace') {
      data.value = {
        ...parsed,
        settings: {
          ...parsed.settings,
          theme: normalizeTheme(parsed.settings.theme),
        },
      }
    } else {
      data.value = mergeStores(data.value, parsed)
    }

    persist()
    return {
      success: true,
      message:
        strategy === 'replace'
          ? 'Backup imported (replace mode).'
          : 'Backup imported (merge mode).',
      strategy,
    }
  }

  const restoreLastBackup = (): boolean => {
    if (!import.meta.client) return false
    const backupKey = localStorage.getItem(LAST_BACKUP_POINTER_KEY)
    if (!backupKey) return false

    const backupRaw = localStorage.getItem(backupKey)
    if (!backupRaw) return false

    const parsed = parseImportedStore(backupRaw)
    if (!parsed) return false

    data.value = parsed
    persist()
    return true
  }

  watch(
    data,
    () => {
      persist()
    },
    { deep: true }
  )

  return {
    data,
    init,
    createBackup,
    exportStore,
    importStore,
    restoreLastBackup,
    isInitialized: readonly(isInitialized),
  }
}
