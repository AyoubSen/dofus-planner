export interface BrisageAccountingRun {
  quantity?: number | null
  buyStartKamas?: number | null
  buyEndKamas?: number | null
  realizedRuneValue?: number | null
  theoreticalRuneValue?: number | null
  actualSoldRuneValue?: number | null
  unsoldRuneValue?: number | null
  runeOutputs?: BrisageRuneOutput[] | null
}

export interface BrisageRuneOutput {
  id?: string
  runeId?: string | number | null
  runeName: string
  quantity: number
  soldQuantity?: number | null
  actualSoldValue?: number | null
  theoreticalValue?: number | null
  note?: string
}

export interface BrisageAccountingItem {
  runs?: BrisageAccountingRun[] | null
}

export interface BrisageAccountingSession {
  startingKamas?: number | null
  endingKamas?: number | null
  externalDelta?: number | null
  items?: BrisageAccountingItem[] | null
}

export interface BrisageAccountingTotals {
  craft: number
  theoreticalRuneValue: number
  actualSoldRuneValue: number
  unsoldRuneValue: number
  paperProfit: number
  realizedProfit: number
  expectedEndKamas: number
  bankrollDelta: number
}

const num = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const runCraftCost = (run: BrisageAccountingRun): number =>
  Math.max(0, num(run.buyStartKamas) - num(run.buyEndKamas))

export const runQuantity = (run: BrisageAccountingRun): number =>
  Math.max(0, num(run.quantity))

export const runTheoreticalRuneValue = (run: BrisageAccountingRun): number =>
  Math.max(0, num(run.theoreticalRuneValue ?? run.realizedRuneValue) || runRuneOutputTheoreticalValue(run))

export const runActualSoldRuneValue = (run: BrisageAccountingRun): number =>
  Math.max(0, num(run.actualSoldRuneValue ?? run.realizedRuneValue) || runRuneOutputSoldValue(run))

export const runUnsoldRuneValue = (run: BrisageAccountingRun): number =>
  Math.max(0, num(run.unsoldRuneValue) || Math.max(0, runRuneOutputTheoreticalValue(run) - runRuneOutputSoldValue(run)))

const runOutputs = (run: BrisageAccountingRun): BrisageRuneOutput[] =>
  Array.isArray(run.runeOutputs) ? run.runeOutputs : []

export const runRuneOutputTheoreticalValue = (run: BrisageAccountingRun): number =>
  runOutputs(run).reduce((sum, output) => sum + Math.max(0, num(output.theoreticalValue)), 0)

export const runRuneOutputSoldValue = (run: BrisageAccountingRun): number =>
  runOutputs(run).reduce((sum, output) => sum + Math.max(0, num(output.actualSoldValue)), 0)

// Paper profit is expected/theoretical rune value minus craft cost.
// Realized profit only counts rune value that was actually sold/confirmed.
export const runPaperProfit = (run: BrisageAccountingRun): number =>
  runTheoreticalRuneValue(run) - runCraftCost(run)

export const runRealizedProfit = (run: BrisageAccountingRun): number =>
  runActualSoldRuneValue(run) - runCraftCost(run)

const itemRuns = (item: BrisageAccountingItem): BrisageAccountingRun[] =>
  Array.isArray(item.runs) ? item.runs : []

export const itemQuantityTotal = (item: BrisageAccountingItem): number =>
  itemRuns(item).reduce((sum, run) => sum + runQuantity(run), 0)

export const itemCraftTotal = (item: BrisageAccountingItem): number =>
  itemRuns(item).reduce((sum, run) => sum + runCraftCost(run), 0)

export const itemTheoreticalRuneValue = (item: BrisageAccountingItem): number =>
  itemRuns(item).reduce((sum, run) => sum + runTheoreticalRuneValue(run), 0)

export const itemActualSoldRuneValue = (item: BrisageAccountingItem): number =>
  itemRuns(item).reduce((sum, run) => sum + runActualSoldRuneValue(run), 0)

export const itemUnsoldRuneValue = (item: BrisageAccountingItem): number =>
  itemRuns(item).reduce((sum, run) => sum + runUnsoldRuneValue(run), 0)

export const itemPaperProfit = (item: BrisageAccountingItem): number =>
  itemTheoreticalRuneValue(item) - itemCraftTotal(item)

export const itemRealizedProfit = (item: BrisageAccountingItem): number =>
  itemActualSoldRuneValue(item) - itemCraftTotal(item)

export const sessionQuantityTotal = (session: BrisageAccountingSession): number =>
  (Array.isArray(session.items) ? session.items : []).reduce((sum, item) => sum + itemQuantityTotal(item), 0)

export const sessionTotals = (session: BrisageAccountingSession): BrisageAccountingTotals => {
  const items = Array.isArray(session.items) ? session.items : []
  const craft = items.reduce((sum, item) => sum + itemCraftTotal(item), 0)
  const theoreticalRuneValue = items.reduce((sum, item) => sum + itemTheoreticalRuneValue(item), 0)
  const actualSoldRuneValue = items.reduce((sum, item) => sum + itemActualSoldRuneValue(item), 0)
  const unsoldRuneValue = items.reduce((sum, item) => sum + itemUnsoldRuneValue(item), 0)
  const startingKamas = num(session.startingKamas)
  const endingKamas = num(session.endingKamas)
  const collectedKamas = num(session.externalDelta)
  const expectedEndKamas = startingKamas - craft + endingKamas + collectedKamas

  return {
    craft,
    theoreticalRuneValue,
    actualSoldRuneValue,
    unsoldRuneValue,
    paperProfit: theoreticalRuneValue - craft,
    realizedProfit: actualSoldRuneValue - craft,
    expectedEndKamas,
    bankrollDelta: expectedEndKamas - startingKamas,
  }
}

export const brisageMarginPercent = (profit: number, cost: number): number => {
  if (!Number.isFinite(cost) || cost <= 0) return 0
  return Math.round((profit / cost) * 100)
}
