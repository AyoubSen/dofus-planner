import type { ResalePriceAdjustment, ResaleTrackerEntry, ResaleTrackerStatus } from '~/app/composables/useAppDataStore'

const createResaleEntryId = () =>
  `resale-${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}`

const cloneResaleEntry = (entry: ResaleTrackerEntry): ResaleTrackerEntry => ({
  ...entry,
  statsEntries: entry.statsEntries.map((stat) => ({ ...stat })),
  priceAdjustments: entry.priceAdjustments.map((adjustment) => ({ ...adjustment })),
})

export const useResaleTracker = () => {
  const { data, init } = useAppDataStore()

  const entries = computed(() => data.value.resale.entries)

  const upsertEntry = (entry: ResaleTrackerEntry) => {
    init()
    const next = cloneResaleEntry(entry)
    const index = data.value.resale.entries.findIndex((current) => current.id === next.id)
    if (index === -1) {
      data.value.resale.entries.unshift(next)
      return next
    }

    data.value.resale.entries[index] = next
    return next
  }

  const createEntry = (input: Omit<ResaleTrackerEntry, 'id' | 'createdAt' | 'updatedAt' | 'priceAdjustments'> & {
    priceAdjustments?: ResalePriceAdjustment[]
  }) => {
    init()
    const now = new Date().toISOString()
    const entry: ResaleTrackerEntry = {
      ...input,
      id: createResaleEntryId(),
      createdAt: now,
      updatedAt: now,
      priceAdjustments: input.priceAdjustments ? input.priceAdjustments.map((adjustment) => ({ ...adjustment })) : [],
    }
    data.value.resale.entries.unshift(entry)
    return entry
  }

  const updateStatus = (id: string, status: ResaleTrackerStatus, changedAt = new Date().toISOString()) => {
    init()
    const entry = data.value.resale.entries.find((current) => current.id === id)
    if (!entry) return null

    entry.status = status
    entry.updatedAt = changedAt
    if (status === 'bought') entry.boughtAt = changedAt
    if (status === 'listed') entry.listedAt = changedAt
    if (status === 'sold') entry.soldAt = changedAt
    if (status === 'cancelled') entry.cancelledAt = changedAt
    return entry
  }

  const addPriceAdjustment = (
    id: string,
    adjustmentInput: {
      fromPrice: number
      toPrice: number
      reason?: string
      createdAt?: string
    },
  ) => {
    init()
    const entry = data.value.resale.entries.find((current) => current.id === id)
    if (!entry) return null

    const createdAt = adjustmentInput.createdAt || new Date().toISOString()
    const adjustment: ResalePriceAdjustment = {
      id: `${id}-adj-${createdAt}-${Math.random().toString(36).slice(2, 6)}`,
      fromPrice: adjustmentInput.fromPrice,
      toPrice: adjustmentInput.toPrice,
      createdAt,
      reason: adjustmentInput.reason || '',
    }
    entry.priceAdjustments.unshift(adjustment)
    entry.listPrice = adjustment.toPrice
    entry.updatedAt = createdAt
    return adjustment
  }

  const removeEntry = (id: string) => {
    init()
    const before = data.value.resale.entries.length
    data.value.resale.entries = data.value.resale.entries.filter((entry) => entry.id !== id)
    return data.value.resale.entries.length !== before
  }

  const transferEntries = (
    fromServerId: string,
    fromCharacterId: string,
    toServerId: string,
    toCharacterId: string,
  ): number => {
    init()
    let count = 0
    data.value.resale.entries = data.value.resale.entries.map((entry) => {
      if (entry.serverId === fromServerId && entry.characterId === fromCharacterId) {
        count++
        return { ...entry, serverId: toServerId, characterId: toCharacterId }
      }
      return entry
    })
    return count
  }

  return {
    entries,
    createEntry,
    upsertEntry,
    updateStatus,
    addPriceAdjustment,
    removeEntry,
    transferEntries,
  }
}
