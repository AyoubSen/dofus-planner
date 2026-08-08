export type MarketPriceKind = 'rune' | 'resource' | 'finished-item'
export type PriceFreshness = 'fresh' | 'aging' | 'stale'

export interface MarketPrice {
  id: string
  itemId?: string | number | null
  name: string
  kind: MarketPriceKind
  price: number
  quantityBasis: number
  serverId: string
  timestamp: string
  note: string
}

export interface MarketPriceDraft {
  itemId?: string | number | null
  name: string
  kind: MarketPriceKind
  price: number
  quantityBasis?: number | null
  serverId: string
  note?: string
}

const STORAGE_PREFIX = 'brisage_market_prices_v1'

const num = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const marketPricesKey = (serverId?: string | number | null): string =>
  `${STORAGE_PREFIX}_${serverId || 'server'}`

export const normalizeMarketPriceName = (name: unknown): string =>
  String(name ?? '').trim().toLowerCase()

export const marketPriceLookupKey = (entry: Pick<MarketPrice, 'itemId' | 'name'>): string =>
  entry.itemId != null && entry.itemId !== ''
    ? `id:${String(entry.itemId)}`
    : `name:${normalizeMarketPriceName(entry.name)}`

export const normalizeMarketPrice = (record: any, fallbackServerId: string): MarketPrice | null => {
  const name = String(record?.name ?? '').trim()
  const price = Math.max(0, num(record?.price))
  if (!name || price <= 0) return null

  const kind = ['rune', 'resource', 'finished-item'].includes(record?.kind)
    ? record.kind as MarketPriceKind
    : 'resource'

  return {
    id: String(record?.id || crypto.randomUUID()),
    itemId: record?.itemId ?? null,
    name,
    kind,
    price,
    quantityBasis: Math.max(1, num(record?.quantityBasis) || 1),
    serverId: String(record?.serverId || fallbackServerId),
    timestamp: String(record?.timestamp || new Date().toISOString()),
    note: String(record?.note ?? ''),
  }
}

export const createMarketPrice = (draft: MarketPriceDraft): MarketPrice => ({
  id: crypto.randomUUID(),
  itemId: draft.itemId ?? null,
  name: draft.name.trim(),
  kind: draft.kind,
  price: Math.max(0, num(draft.price)),
  quantityBasis: Math.max(1, num(draft.quantityBasis) || 1),
  serverId: String(draft.serverId || 'server'),
  timestamp: new Date().toISOString(),
  note: String(draft.note ?? '').trim(),
})

export const loadMarketPrices = (serverId?: string | number | null): MarketPrice[] => {
  if (!import.meta.client) return []
  const key = marketPricesKey(serverId)
  const raw = localStorage.getItem(key)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.map(record => normalizeMarketPrice(record, String(serverId || 'server'))).filter(Boolean) as MarketPrice[]
      : []
  }
  catch {
    return []
  }
}

export const saveMarketPrices = (serverId: string | number | null | undefined, prices: MarketPrice[]): void => {
  if (!import.meta.client) return
  localStorage.setItem(marketPricesKey(serverId), JSON.stringify(prices))
}

export const priceFreshness = (timestamp: string, now = new Date()): PriceFreshness => {
  const then = new Date(timestamp)
  const ageMs = now.getTime() - then.getTime()
  const ageHours = ageMs / 3_600_000
  if (!Number.isFinite(ageHours) || ageHours < 24) return 'fresh'
  if (ageHours <= 72) return 'aging'
  return 'stale'
}

export const unitMarketPrice = (entry?: MarketPrice | null): number | null => {
  if (!entry || entry.price <= 0) return null
  return entry.price / Math.max(1, entry.quantityBasis)
}

export const marketPriceMap = (prices: MarketPrice[]): Map<string, MarketPrice> => {
  const map = new Map<string, MarketPrice>()
  latestMarketPrices(prices).forEach((price) => {
    map.set(marketPriceLookupKey(price), price)
    map.set(`name:${normalizeMarketPriceName(price.name)}`, price)
  })
  return map
}

export const latestMarketPrices = (prices: MarketPrice[]): MarketPrice[] => {
  const latest = new Map<string, MarketPrice>()
  prices.forEach((price) => {
    const key = `${price.kind}:${marketPriceLookupKey(price)}`
    const existing = latest.get(key)
    if (!existing || new Date(price.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
      latest.set(key, price)
    }
  })
  return Array.from(latest.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export const marketPriceHistoryFor = (
  prices: MarketPrice[],
  entry: Pick<MarketPrice, 'kind' | 'itemId' | 'name'>,
): MarketPrice[] => {
  const idKey = entry.itemId != null && entry.itemId !== '' ? String(entry.itemId) : ''
  const nameKey = normalizeMarketPriceName(entry.name)
  return prices
    .filter(price =>
      price.kind === entry.kind
      && (
        (idKey && String(price.itemId ?? '') === idKey)
        || normalizeMarketPriceName(price.name) === nameKey
      ),
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const marketPriceTrendPercent = (history: MarketPrice[]): number | null => {
  if (history.length < 2) return null
  const latest = unitMarketPrice(history[0])
  const previous = unitMarketPrice(history[1])
  if (latest == null || previous == null || previous <= 0) return null
  return Math.round(((latest - previous) / previous) * 100)
}
