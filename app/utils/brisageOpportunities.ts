import {
  type MarketPrice,
  type PriceFreshness,
  marketPriceMap,
  marketPriceLookupKey,
  priceFreshness,
  unitMarketPrice,
} from './marketPrices'

export type RiskLevel = 'low' | 'medium' | 'high'
export type OpportunityStatus = 'idea' | 'test-batch' | 'validated' | 'scaled' | 'retired'

export interface ExpectedRuneOutput {
  runeName: string
  runeId?: string | number | null
  quantity: number
}

export interface BrisageOpportunityConfig {
  safetyMarkupPercent: number
  pessimisticRuneMultiplier: number
  bankroll: number
  bankrollBatchPercent: number
  maxBatchCostCap: number
  maxExposureWarningPercent: number
}

export interface BrisageOpportunityCandidate {
  id: string
  itemId: string | number
  item: any
  status: OpportunityStatus
  expectedRuneValueManual?: number | null
  expectedRuneOutputs?: ExpectedRuneOutput[]
  sampleSize?: number
  soldConfirmedSessions?: number
  unsoldRuneValue?: number
  note?: string
}

export interface BrisageOpportunity {
  id: string
  itemId: string | number
  item: any
  itemName: string
  status: OpportunityStatus
  craftCost: number
  missingPriceCount: number
  missingPrices: string[]
  stalePriceCount: number
  agingPriceCount: number
  conservativeCraftCost: number
  estimatedRuneValue: number
  pessimisticRuneValue: number
  expectedProfit: number
  pessimisticProfit: number
  marginPercent: number
  riskLevel: RiskLevel
  riskReasons: string[]
  maxRecommendedBatchCost: number
  recommendedQuantity: number
  recommendedBatchCost: number
  bankrollExposurePercent: number
  warnings: string[]
  score: number
}

const DEFAULT_CONFIG: BrisageOpportunityConfig = {
  safetyMarkupPercent: 5,
  pessimisticRuneMultiplier: 0.8,
  bankroll: 0,
  bankrollBatchPercent: 30,
  maxBatchCostCap: 2_000_000,
  maxExposureWarningPercent: 40,
}

const num = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const defaultBrisageOpportunityConfig = (): BrisageOpportunityConfig => ({ ...DEFAULT_CONFIG })

export const itemDisplayName = (item: any): string =>
  item?.name?.fr || item?.name?.en || item?.name || `Item #${item?.id ?? '?'}`

const recipeIngredients = (item: any): any[] => {
  const recipe = item?.recipe
  if (!recipe?.ingredientIds?.length || !recipe?.quantities?.length) return []
  return recipe.ingredientIds.map((ingredientId: number, index: number) => {
    const ingredient = recipe.ingredients?.find((candidate: any) => String(candidate.id) === String(ingredientId))
    return {
      id: ingredientId,
      name: ingredient?.name?.fr || ingredient?.name?.en || `Ingredient #${ingredientId}`,
      quantity: Math.max(0, num(recipe.quantities[index])),
    }
  })
}

export const deriveEstimatedRuneValue = (
  candidate: BrisageOpportunityCandidate,
  prices: MarketPrice[],
): number => {
  const manual = num(candidate.expectedRuneValueManual)
  if (manual > 0) return manual

  const lookup = marketPriceMap(prices)
  return (candidate.expectedRuneOutputs ?? []).reduce((sum, output) => {
    const price = lookup.get(marketPriceLookupKey({ itemId: output.runeId ?? null, name: output.runeName }))
      ?? lookup.get(`name:${String(output.runeName ?? '').trim().toLowerCase()}`)
    const unitPrice = unitMarketPrice(price)
    return unitPrice == null ? sum : sum + unitPrice * Math.max(0, num(output.quantity))
  }, 0)
}

export const buildBrisageOpportunity = (
  candidate: BrisageOpportunityCandidate,
  prices: MarketPrice[],
  configInput: Partial<BrisageOpportunityConfig> = {},
): BrisageOpportunity => {
  const config = { ...DEFAULT_CONFIG, ...configInput }
  const lookup = marketPriceMap(prices)
  const missingPrices: string[] = []
  let craftCost = 0
  let stalePriceCount = 0
  let agingPriceCount = 0

  recipeIngredients(candidate.item).forEach((ingredient) => {
    const price = lookup.get(marketPriceLookupKey({ itemId: ingredient.id, name: ingredient.name }))
      ?? lookup.get(`name:${String(ingredient.name).trim().toLowerCase()}`)
    const unitPrice = unitMarketPrice(price)
    if (unitPrice == null) {
      missingPrices.push(ingredient.name)
      return
    }
    const freshness = priceFreshness(price.timestamp)
    if (freshness === 'stale') stalePriceCount += 1
    if (freshness === 'aging') agingPriceCount += 1
    craftCost += unitPrice * ingredient.quantity
  })

  const safetyMultiplier = 1 + Math.max(0, config.safetyMarkupPercent) / 100
  const conservativeCraftCost = Math.round(craftCost * safetyMultiplier)
  const estimatedRuneValue = Math.round(deriveEstimatedRuneValue(candidate, prices))
  const pessimisticRuneValue = Math.round(estimatedRuneValue * Math.max(0, config.pessimisticRuneMultiplier))
  const expectedProfit = estimatedRuneValue - conservativeCraftCost
  const pessimisticProfit = pessimisticRuneValue - conservativeCraftCost
  const marginPercent = conservativeCraftCost > 0 ? Math.round((expectedProfit / conservativeCraftCost) * 100) : 0
  const maxRecommendedBatchCost = Math.max(0, Math.min(
    config.bankroll * Math.max(0, config.bankrollBatchPercent) / 100,
    Math.max(0, config.maxBatchCostCap),
  ))
  const recommendedQuantity = conservativeCraftCost > 0
    ? Math.max(1, Math.floor(maxRecommendedBatchCost / conservativeCraftCost))
    : 0
  const recommendedBatchCost = recommendedQuantity * conservativeCraftCost
  const bankrollExposurePercent = config.bankroll > 0
    ? Math.round((recommendedBatchCost / config.bankroll) * 100)
    : 0

  const riskReasons: string[] = []
  const warnings: string[] = []
  const sampleSize = Math.max(0, num(candidate.sampleSize))

  if (stalePriceCount > 0) {
    riskReasons.push('stale prices')
    warnings.push('Price data is stale.')
  }
  if (agingPriceCount > 0) riskReasons.push('aging prices')
  if (missingPrices.length > 0) {
    riskReasons.push('missing prices')
    warnings.push('Some ingredient prices are missing.')
  }
  if (marginPercent < 10) {
    riskReasons.push('low margin')
    warnings.push('Low margin: validate with a small batch first.')
  }
  if (bankrollExposurePercent > config.maxExposureWarningPercent) {
    riskReasons.push('high bankroll exposure')
    warnings.push('This batch uses too much of your bankroll.')
  }
  if (num(candidate.unsoldRuneValue) > 0) {
    riskReasons.push('unsold rune value')
    warnings.push('Rune value is theoretical until sold.')
  }
  if (sampleSize < 2) {
    riskReasons.push('small sample size')
    warnings.push('Low sample size: validate with a small batch first.')
  }
  if (expectedProfit > 0 && pessimisticProfit < 0) {
    riskReasons.push('negative pessimistic profit')
    warnings.push('Expected profit is positive, but pessimistic profit is negative.')
  }

  const riskScore = (
    stalePriceCount * 2
    + agingPriceCount
    + missingPrices.length * 2
    + (marginPercent < 10 ? 1 : 0)
    + (bankrollExposurePercent > config.maxExposureWarningPercent ? 2 : 0)
    + (num(candidate.unsoldRuneValue) > 0 ? 1 : 0)
    + (sampleSize < 2 ? 1 : 0)
    + (pessimisticProfit < 0 ? 2 : 0)
  )
  const riskLevel: RiskLevel = riskScore >= 4 ? 'high' : riskScore >= 2 ? 'medium' : 'low'
  const statusBoost = candidate.status === 'validated' ? 3 : candidate.status === 'scaled' ? 2 : candidate.status === 'test-batch' ? 1 : 0
  const score = (
    (pessimisticProfit > 0 ? 1_000_000 : 0)
    + pessimisticProfit
    + expectedProfit * 0.25
    + marginPercent * 1_000
    + statusBoost * 100_000
    - missingPrices.length * 200_000
    - stalePriceCount * 150_000
    - bankrollExposurePercent * 1_000
  )

  return {
    id: candidate.id,
    itemId: candidate.itemId,
    item: candidate.item,
    itemName: itemDisplayName(candidate.item),
    status: candidate.status,
    craftCost: Math.round(craftCost),
    missingPriceCount: missingPrices.length,
    missingPrices,
    stalePriceCount,
    agingPriceCount,
    conservativeCraftCost,
    estimatedRuneValue,
    pessimisticRuneValue,
    expectedProfit,
    pessimisticProfit,
    marginPercent,
    riskLevel,
    riskReasons,
    maxRecommendedBatchCost: Math.round(maxRecommendedBatchCost),
    recommendedQuantity,
    recommendedBatchCost: Math.round(recommendedBatchCost),
    bankrollExposurePercent,
    warnings,
    score,
  }
}

export const rankBrisageOpportunities = (opportunities: BrisageOpportunity[]): BrisageOpportunity[] =>
  [...opportunities].sort((a, b) => {
    if ((b.pessimisticProfit > 0 ? 1 : 0) !== (a.pessimisticProfit > 0 ? 1 : 0)) {
      return (b.pessimisticProfit > 0 ? 1 : 0) - (a.pessimisticProfit > 0 ? 1 : 0)
    }
    if (a.stalePriceCount !== b.stalePriceCount) return a.stalePriceCount - b.stalePriceCount
    if (a.missingPriceCount !== b.missingPriceCount) return a.missingPriceCount - b.missingPriceCount
    if (b.marginPercent !== a.marginPercent) return b.marginPercent - a.marginPercent
    if (a.bankrollExposurePercent !== b.bankrollExposurePercent) return a.bankrollExposurePercent - b.bankrollExposurePercent
    const statusRank: Record<OpportunityStatus, number> = {
      validated: 5,
      scaled: 4,
      'test-batch': 3,
      idea: 2,
      retired: 1,
    }
    if (statusRank[b.status] !== statusRank[a.status]) return statusRank[b.status] - statusRank[a.status]
    return b.score - a.score
  })

export const hasAnyStalePrice = (opportunity: Pick<BrisageOpportunity, 'stalePriceCount'>): boolean =>
  opportunity.stalePriceCount > 0
