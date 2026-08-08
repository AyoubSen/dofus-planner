import type { AppDataStore, ResaleTrackerEntry } from '~/composables/useAppDataStore'

export type KamaOpportunityType = 'resale' | 'craft' | 'brisage' | 'familiar' | 'maintenance' | 'missing-data'
export type KamaOpportunityConfidence = 'low' | 'medium' | 'high'
export type KamaOpportunityLevel = 'low' | 'medium' | 'high'

export interface KamaOpportunity {
  id: string
  type: KamaOpportunityType
  title: string
  itemName: string
  sourceTool: string
  path: string
  estimatedCost: number | null
  estimatedRevenue: number | null
  estimatedProfit: number | null
  marginPercent: number | null
  maxBuyPrice: number | null
  targetSellPrice: number | null
  quantity: number | null
  confidence: KamaOpportunityConfidence
  effort: KamaOpportunityLevel
  risk: KamaOpportunityLevel
  reason: string
  suggestedAction: string
  missingData: string[]
  lastUpdated: string | null
}

export interface KamasAuditItem {
  key: string
  label: string
  storage: string
  scope: string
  usableFields: string[]
  missingFields: string[]
  backupNote: string
}

export interface KamasOpportunityInput {
  store: AppDataStore
  serverId: string | null
  characterId: string | null
  craftingSessions: any[]
  brisageSessions: any[]
  familiarPrices: Record<string, number>
  resourcePrices: Record<string, number>
}

const numberOrNull = (value: unknown): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const num = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const formatKamasCompact = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  return `${Math.round(value).toLocaleString('fr-FR')} k`
}

export const marginPercent = (profit: number, cost: number): number | null => {
  if (!Number.isFinite(profit) || !Number.isFinite(cost) || cost <= 0) return null
  return Math.round((profit / cost) * 100)
}

const daysSince = (iso: string | null | undefined, now = Date.now()): number | null => {
  if (!iso) return null
  const time = new Date(iso).getTime()
  if (!Number.isFinite(time)) return null
  return Math.max(0, Math.floor((now - time) / 86_400_000))
}

const opportunityScore = (opportunity: KamaOpportunity): number => {
  const profit = opportunity.estimatedProfit ?? 0
  const margin = opportunity.marginPercent ?? 0
  const confidence = opportunity.confidence === 'high' ? 1.25 : opportunity.confidence === 'medium' ? 1 : 0.65
  const risk = opportunity.risk === 'low' ? 1.1 : opportunity.risk === 'medium' ? 1 : 0.8
  return (profit + margin * 1_000) * confidence * risk
}

const resaleProfit = (entry: ResaleTrackerEntry): number | null => {
  const buy = numberOrNull(entry.buyPrice)
  const sold = numberOrNull(entry.soldPrice)
  if (!buy || !sold) return null
  return sold - buy
}

const resaleOpportunities = (entries: ResaleTrackerEntry[], serverId: string | null, characterId: string | null): KamaOpportunity[] => {
  const scoped = entries.filter((entry) =>
    (!serverId || entry.serverId === serverId) && (!characterId || entry.characterId === characterId)
  )
  const now = Date.now()
  const opportunities: KamaOpportunity[] = []

  for (const entry of scoped) {
    const lastTouched = entry.updatedAt || entry.listedAt || entry.createdAt
    const age = daysSince(lastTouched, now)
    const buy = numberOrNull(entry.buyPrice)
    const target = numberOrNull(entry.targetPrice || entry.listPrice || entry.estimatedFairValue)
    const estimatedProfit = buy && target ? target - buy : null

    if ((entry.status === 'listed' || entry.status === 'bought' || entry.status === 'watched') && age !== null && age >= 3) {
      opportunities.push({
        id: `resale-stale-${entry.id}`,
        type: 'maintenance',
        title: `${entry.itemName} needs review`,
        itemName: entry.itemName,
        sourceTool: 'resale',
        path: '/resale',
        estimatedCost: buy,
        estimatedRevenue: target,
        estimatedProfit,
        marginPercent: estimatedProfit !== null && buy ? marginPercent(estimatedProfit, buy) : null,
        maxBuyPrice: buy,
        targetSellPrice: target,
        quantity: 1,
        confidence: entry.priceAdjustments.length || entry.soldPrice > 0 ? 'medium' : 'low',
        effort: 'low',
        risk: age >= 7 ? 'high' : 'medium',
        reason: `This ${entry.status} resale entry has not moved for ${age} day${age === 1 ? '' : 's'}.`,
        suggestedAction: 'Check the market and reprice, cancel, or mark it sold.',
        missingData: target ? [] : ['target sell price'],
        lastUpdated: lastTouched || null,
      })
    }

    if (entry.status === 'sold') {
      const profit = resaleProfit(entry)
      if (profit !== null) {
        opportunities.push({
          id: `resale-repeat-${entry.id}`,
          type: 'resale',
          title: `Repeat profitable flip: ${entry.itemName}`,
          itemName: entry.itemName,
          sourceTool: 'resale',
          path: '/resale',
          estimatedCost: entry.buyPrice,
          estimatedRevenue: entry.soldPrice,
          estimatedProfit: profit,
          marginPercent: marginPercent(profit, entry.buyPrice),
          maxBuyPrice: entry.buyPrice,
          targetSellPrice: entry.soldPrice,
          quantity: 1,
          confidence: profit > 0 ? 'high' : 'medium',
          effort: 'medium',
          risk: profit > 0 ? 'medium' : 'high',
          reason: profit > 0
            ? `You already sold this for ${formatKamasCompact(profit)} profit.`
            : `This past flip lost ${formatKamasCompact(Math.abs(profit))}.`,
          suggestedAction: profit > 0
            ? `Look for another copy below ${formatKamasCompact(entry.buyPrice)}.`
            : 'Avoid repeating this unless the buy price is much lower.',
          missingData: [],
          lastUpdated: entry.soldAt || entry.updatedAt || null,
        })
      }
    }

    if (!buy || !target) {
      opportunities.push({
        id: `resale-missing-${entry.id}`,
        type: 'missing-data',
        title: `Missing resale data: ${entry.itemName}`,
        itemName: entry.itemName,
        sourceTool: 'resale',
        path: '/resale',
        estimatedCost: buy,
        estimatedRevenue: target,
        estimatedProfit: null,
        marginPercent: null,
        maxBuyPrice: buy,
        targetSellPrice: target,
        quantity: 1,
        confidence: 'low',
        effort: 'low',
        risk: 'low',
        reason: 'This entry cannot produce a useful recommendation yet.',
        suggestedAction: 'Add the missing buy price or target sell price.',
        missingData: [!buy ? 'buy price' : '', !target ? 'target/list price' : ''].filter(Boolean),
        lastUpdated: entry.updatedAt || null,
      })
    }
  }

  return opportunities
}

const craftItemCost = (item: any): number =>
  Math.max(0, num(item.craftKamasBefore) - num(item.craftKamasAfter)) + num(item.extraExpenses)

const craftItemFmCost = (item: any): number =>
  Math.max(0, num(item.runeValueBeforeFm) + num(item.runePurchases) - num(item.runeValueAfterFm))

const craftItemInvested = (item: any): number => craftItemCost(item) + craftItemFmCost(item)

const craftItemRealized = (item: any): number => num(item.realizedSalePrice) + num(item.brisageRecovery)

const craftItemExpected = (item: any): number => Math.max(num(item.realizedSalePrice), num(item.listedPrice), num(item.expectedSalePrice), num(item.brisageRecovery))

const itemDisplayName = (item: any): string =>
  item?.item?.name?.fr || item?.item?.name?.en || item?.itemName || item?.name || String(item?.itemId || 'Unknown item')

const craftingOpportunities = (sessions: any[]): KamaOpportunity[] => {
  const opportunities: KamaOpportunity[] = []
  for (const session of sessions) {
    for (const item of Array.isArray(session?.items) ? session.items : []) {
      const invested = craftItemInvested(item)
      const realized = craftItemRealized(item)
      const expected = craftItemExpected(item)
      const name = itemDisplayName(item)
      const outcome = String(item.outcome || '')

      if ((outcome === 'sold' || outcome === 'brisaged') && invested > 0 && realized > 0) {
        const profit = realized - invested
        opportunities.push({
          id: `craft-result-${session.id}-${item.id}`,
          type: 'craft',
          title: profit >= 0 ? `Craft worked: ${name}` : `Craft lost kamas: ${name}`,
          itemName: name,
          sourceTool: 'crafting',
          path: '/crafting',
          estimatedCost: invested,
          estimatedRevenue: realized,
          estimatedProfit: profit,
          marginPercent: marginPercent(profit, invested),
          maxBuyPrice: invested,
          targetSellPrice: realized,
          quantity: 1,
          confidence: 'high',
          effort: 'medium',
          risk: profit >= 0 ? 'medium' : 'high',
          reason: `This is based on a recorded ${outcome} crafting result.`,
          suggestedAction: profit >= 0
            ? `Repeat only if total cost stays near ${formatKamasCompact(invested)} or lower.`
            : 'Review why this lost money before repeating it.',
          missingData: [],
          lastUpdated: session.date || null,
        })
        continue
      }

      if (invested > 0 && expected > 0) {
        const profit = expected - invested
        opportunities.push({
          id: `craft-open-${session.id}-${item.id}`,
          type: 'craft',
          title: `Open craft position: ${name}`,
          itemName: name,
          sourceTool: 'crafting',
          path: '/crafting',
          estimatedCost: invested,
          estimatedRevenue: expected,
          estimatedProfit: profit,
          marginPercent: marginPercent(profit, invested),
          maxBuyPrice: invested,
          targetSellPrice: expected,
          quantity: 1,
          confidence: outcome === 'listed' ? 'medium' : 'low',
          effort: 'medium',
          risk: profit >= 0 ? 'medium' : 'high',
          reason: 'This uses your recorded cost and expected/listed value.',
          suggestedAction: profit >= 0 ? 'Check if this can still sell near the target.' : 'Do not repeat unless the cost drops or the target rises.',
          missingData: [],
          lastUpdated: session.date || null,
        })
      } else {
        opportunities.push({
          id: `craft-missing-${session.id}-${item.id}`,
          type: 'missing-data',
          title: `Missing craft data: ${name}`,
          itemName: name,
          sourceTool: 'crafting',
          path: '/crafting',
          estimatedCost: invested || null,
          estimatedRevenue: expected || null,
          estimatedProfit: null,
          marginPercent: null,
          maxBuyPrice: null,
          targetSellPrice: null,
          quantity: 1,
          confidence: 'low',
          effort: 'low',
          risk: 'low',
          reason: 'Crafting recommendation needs both cost and expected or realized value.',
          suggestedAction: 'Add craft/FM cost and expected/list/sold value.',
          missingData: [invested <= 0 ? 'craft/FM cost' : '', expected <= 0 ? 'expected/list/sold value' : ''].filter(Boolean),
          lastUpdated: session.date || null,
        })
      }
    }
  }
  return opportunities
}

const brisageItemCost = (item: any): number =>
  (Array.isArray(item?.runs) ? item.runs : []).reduce((sum: number, run: any) => sum + Math.max(0, num(run.buyStartKamas) - num(run.buyEndKamas)), 0)

const brisageItemRealized = (item: any): number =>
  (Array.isArray(item?.runs) ? item.runs : []).reduce((sum: number, run: any) => sum + num(run.actualSoldRuneValue ?? run.realizedRuneValue), 0)

const brisageItemPaperValue = (item: any): number =>
  (Array.isArray(item?.runs) ? item.runs : []).reduce((sum: number, run: any) => sum + num(run.theoreticalRuneValue ?? run.realizedRuneValue), 0)

const brisageItemSoldConfirmed = (item: any): boolean =>
  (Array.isArray(item?.runs) ? item.runs : []).some((run: any) => Boolean(run.soldConfirmed))

const brisageQuantity = (item: any): number =>
  (Array.isArray(item?.runs) ? item.runs : []).reduce((sum: number, run: any) => sum + num(run.quantity), 0)

const brisageOpportunities = (sessions: any[]): KamaOpportunity[] => {
  const opportunities: KamaOpportunity[] = []
  for (const session of sessions) {
    for (const item of Array.isArray(session?.items) ? session.items : []) {
      const cost = brisageItemCost(item)
      const realized = brisageItemRealized(item)
      const paperValue = brisageItemPaperValue(item)
      const soldConfirmed = brisageItemSoldConfirmed(item)
      const quantity = brisageQuantity(item)
      const name = itemDisplayName(item)

      if (cost > 0 && (realized > 0 || paperValue > 0)) {
        const profit = realized - cost
        const paperProfit = paperValue - cost
        opportunities.push({
          id: `brisage-result-${session.id}-${item.id}`,
          type: 'brisage',
          title: profit >= 0 ? `Brisage worked: ${name}` : `Brisage lost kamas: ${name}`,
          itemName: name,
          sourceTool: 'brisage',
          path: '/brisage',
          estimatedCost: cost,
          estimatedRevenue: realized || paperValue,
          estimatedProfit: profit,
          marginPercent: marginPercent(profit, cost),
          maxBuyPrice: quantity > 0 ? Math.floor(cost / quantity) : cost,
          targetSellPrice: realized || paperValue,
          quantity: quantity || null,
          confidence: soldConfirmed ? 'high' : 'medium',
          effort: 'medium',
          risk: soldConfirmed && profit >= 0 ? 'medium' : 'high',
          reason: soldConfirmed
            ? `This uses confirmed sold rune value from a recorded brisage run with ${quantity || 1} crafted item${quantity === 1 ? '' : 's'}.`
            : `This is paper brisage value, not confirmed sold profit. Paper profit: ${formatKamasCompact(paperProfit)}.`,
          suggestedAction: profit >= 0
            ? 'Check if the same item/category still has similar costs and rune value.'
            : 'Avoid repeating this run unless the craft cost drops or sold rune value improves.',
          missingData: soldConfirmed ? [] : ['sold rune confirmation'],
          lastUpdated: session.date || null,
        })
      } else {
        opportunities.push({
          id: `brisage-missing-${session.id}-${item.id}`,
          type: 'missing-data',
          title: `Missing brisage data: ${name}`,
          itemName: name,
          sourceTool: 'brisage',
          path: '/brisage',
          estimatedCost: cost || null,
          estimatedRevenue: realized || null,
          estimatedProfit: null,
          marginPercent: null,
          maxBuyPrice: null,
          targetSellPrice: null,
          quantity: quantity || null,
          confidence: 'low',
          effort: 'low',
          risk: 'low',
          reason: 'Brisage recommendation needs craft/buy cost and realized rune value.',
          suggestedAction: 'Add the missing before/after kamas or rune value.',
          missingData: [cost <= 0 ? 'craft/buy cost' : '', realized <= 0 ? 'rune value' : ''].filter(Boolean),
          lastUpdated: session.date || null,
        })
      }
    }
  }
  return opportunities
}

const familiarOpportunities = (familiarPrices: Record<string, number>, resourcePrices: Record<string, number>): KamaOpportunity[] => {
  const priced = Object.entries({ ...resourcePrices, ...familiarPrices })
    .map(([itemName, price]) => ({ itemName, price: numberOrNull(price) }))
    .filter((entry): entry is { itemName: string, price: number } => !!entry.price)
    .sort((a, b) => a.price - b.price)
    .slice(0, 8)

  return priced.map((entry) => ({
    id: `familiar-priced-${entry.itemName}`,
    type: 'familiar',
    title: `Cheap familiar input: ${entry.itemName}`,
    itemName: entry.itemName,
    sourceTool: 'familiers',
    path: '/familiers',
    estimatedCost: entry.price,
    estimatedRevenue: null,
    estimatedProfit: null,
    marginPercent: null,
    maxBuyPrice: entry.price,
    targetSellPrice: null,
    quantity: null,
    confidence: 'medium',
    effort: 'low',
    risk: 'low',
    reason: 'This is a low recorded unit price from your familiar/resource price data.',
    suggestedAction: 'Use it as a cost-saving lead, not direct profit, and verify XP/kama on the familiers page.',
    missingData: [],
    lastUpdated: null,
  }))
}

export const buildKamaOpportunities = (input: KamasOpportunityInput): KamaOpportunity[] => {
  const opportunities = [
    ...resaleOpportunities(input.store.resale.entries, input.serverId, input.characterId),
    ...craftingOpportunities(input.craftingSessions),
    ...brisageOpportunities(input.brisageSessions),
    ...familiarOpportunities(input.familiarPrices, input.resourcePrices),
  ]

  return opportunities
    .sort((a, b) => opportunityScore(b) - opportunityScore(a))
    .slice(0, 120)
}

export const buildKamasDataAudit = (serverId: string | null, characterId: string | null): KamasAuditItem[] => [
  {
    key: 'store',
    label: 'Central app store',
    storage: 'dofus-app-store',
    scope: 'Global, with character/server fields on entries',
    usableFields: ['accounts', 'sales', 'resale entries', 'activity'],
    missingFields: ['crafting sessions', 'brisage sessions', 'familiers prices', 'resource prices'],
    backupNote: 'Included by current backup/export controls.',
  },
  {
    key: 'crafting',
    label: 'Craft/FM sessions',
    storage: `craft_fm_sessions_${serverId || 'server'}_${characterId || 'character'}`,
    scope: 'Selected character',
    usableFields: ['item cost', 'FM cost', 'expected/list/sold value', 'outcome'],
    missingFields: ['live market validation', 'recipe price confidence'],
    backupNote: 'Separate localStorage key; not part of the central store.',
  },
  {
    key: 'brisage',
    label: 'Brisage sessions',
    storage: `brisage_sessions_${serverId || 'server'}_${characterId || 'character'}`,
    scope: 'Selected character',
    usableFields: ['buy/craft cost', 'rune value', 'quantity', 'session date'],
    missingFields: ['pre-crush expected rune value', 'live rune prices'],
    backupNote: 'Separate localStorage key; not part of the central store.',
  },
  {
    key: 'prices',
    label: 'Resource and familiar prices',
    storage: 'dofus-items-resource-prices-v1, familiers_manual_prices_v1',
    scope: 'Browser-wide',
    usableFields: ['manual unit prices'],
    missingFields: ['price timestamp', 'server scope', 'confidence'],
    backupNote: 'Separate localStorage keys; read-only here.',
  },
]
