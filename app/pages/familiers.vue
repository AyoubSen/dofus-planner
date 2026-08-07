<template>
  <div>
    <div class="fam-stats">
      <div class="fam-stat">
        <div class="fam-stat__val">{{ fmt(targetXp) }}</div>
        <div class="fam-stat__label">{{ $t('familiers.page.stats.totalXp', { level: targetLevel }) }}</div>
      </div>
      <div class="fam-stat">
        <div class="fam-stat__val">{{ XP_PER_KIBBLE }}</div>
        <div class="fam-stat__label">{{ $t('familiers.page.stats.xpPerKibble') }}</div>
      </div>
      <div class="fam-stat">
        <div class="fam-stat__val">{{ fmtQty(KIBBLE_COUNT) }}</div>
        <div class="fam-stat__label">{{ $t('familiers.page.stats.equivalentKibbles') }}</div>
      </div>
      <div class="fam-stat">
        <div class="fam-stat__val">{{ pricingMode === 'reference' ? `${fmt(Math.round(pricePerKibble))} k` : `${manualPricedCount}` }}</div>
        <div class="fam-stat__label">{{ pricingMode === 'reference' ? $t('familiers.page.stats.targetPricePerKibble') : $t('familiers.page.stats.manualPricedItems') }}</div>
      </div>
    </div>

    <div class="fam-budget fam-budget--mode">
      <span class="fam-budget__label">{{ $t('familiers.page.mode.label') }}</span>
      <div class="fam-mode-toggle">
        <button class="fam-mode-toggle__btn" :class="{ 'fam-mode-toggle__btn--on': pricingMode === 'reference' }" @click="pricingMode = 'reference'">{{ $t('familiers.page.mode.reference') }}</button>
        <button class="fam-mode-toggle__btn" :class="{ 'fam-mode-toggle__btn--on': pricingMode === 'manual' }" @click="pricingMode = 'manual'">{{ $t('familiers.page.mode.manual') }}</button>
      </div>
      <label class="fam-target-level">
        <span>{{ $t('familiers.page.targetLevel.label') }}</span>
        <input v-model.number="targetLevel" type="number" min="1" max="100" step="1" class="fam-target-level__input" @change="clampTargetLevel" />
      </label>
      <span class="fam-budget__hint">
        {{ pricingMode === 'reference' ? $t('familiers.page.mode.referenceHint') : $t('familiers.page.mode.manualHint') }}
      </span>
      <button class="fam-help-btn" type="button" :aria-label="$t('familiers.guide.openAria')" @click="guideOpen = true">?</button>
    </div>

    <div v-if="pricingMode === 'reference'" class="fam-budget">
      <span class="fam-budget__label">{{ $t('familiers.page.reference.budgetLabel') }}</span>
      <div class="fam-budget__input-wrap">
        <input v-model.number="budget" type="number" min="0" step="100000" class="fam-budget__input" />
        <span class="fam-budget__unit">{{ $t('familiers.page.reference.kamasUnit') }}</span>
      </div>
      <span class="fam-budget__hint">
        {{ $t('familiers.page.reference.formulaPrefix') }}
        <strong>{{ fmt(Math.round(pricePerKibble)) }} k</strong>, {{ $t('familiers.page.reference.formulaMiddle') }} <strong>X XP</strong>
        {{ $t('familiers.page.reference.formulaSuffix') }}
        <strong>{{ fmt(Math.round(pricePerKibble)) }} x X / {{ XP_PER_KIBBLE }}</strong> {{ $t('familiers.page.reference.kamasShort') }}
      </span>
    </div>

    <div v-else class="fam-budget fam-budget--manual">
      <span class="fam-budget__label">{{ $t('familiers.page.manual.label') }}</span>
      <span class="fam-budget__hint">
        {{ $t('familiers.page.manual.hintPrefix') }}
        <strong>{{ $t('familiers.page.manual.hintFormula') }}</strong>. {{ $t('familiers.page.manual.hintSuffix') }}
      </span>
      <button class="fam-clear-btn" @click="clearManualPrices">{{ $t('familiers.page.manual.clear') }}</button>
    </div>

    <div class="fam-panel fam-progress">
      <div class="fam-progress__top">
        <div>
          <div class="fam-section-title">{{ $t('familiers.page.progress.title') }}</div>
          <div class="fam-muted">{{ $t('familiers.page.progress.hint') }}</div>
        </div>
        <button class="fam-clear-btn" :disabled="plannedPurchases.length === 0" @click="clearPlannedPurchases">{{ $t('familiers.page.progress.clear') }}</button>
      </div>
      <div class="fam-progress__stats">
        <div>
          <span>{{ $t('familiers.page.progress.boughtXp') }}</span>
          <strong>{{ fmt(purchasedXp) }} / {{ fmt(targetXp) }}</strong>
        </div>
        <div>
          <span>{{ $t('familiers.page.progress.remainingXp') }}</span>
          <strong>{{ fmt(remainingXp) }}</strong>
        </div>
        <div>
          <span>{{ $t('familiers.page.progress.progress') }}</span>
          <strong>{{ progressPercent.toLocaleString(numberLocale, { maximumFractionDigits: 1 }) }}%</strong>
        </div>
      </div>
      <div class="fam-progress__entry">
        <input ref="purchaseNameInput" type="text" class="fam-field" :placeholder="$t('familiers.page.progress.itemPlaceholder')" />
        <input ref="purchaseQtyInput" type="number" min="0" step="1" class="fam-field fam-progress__qty" :placeholder="$t('familiers.page.progress.qtyPlaceholder')" @keydown.enter.prevent="addPlannedPurchase" />
        <button class="fam-action-btn" @click="addPlannedPurchase">{{ $t('familiers.page.progress.add') }}</button>
      </div>
      <div v-if="purchaseError" class="fam-error">{{ purchaseError }}</div>
      <div v-if="plannedPurchases.length" class="fam-progress__list">
        <div v-for="entry in plannedPurchases" :key="entry.name" class="fam-progress__row">
          <span>{{ entry.name }}</span>
          <strong>{{ fmtQty(entry.qty) }} x {{ fmtDecimal(entry.xp) }} XP = {{ fmt(Math.round(entry.qty * entry.xp)) }} XP</strong>
          <button class="fam-clear-btn" @click="removePlannedPurchase(entry.name)">{{ $t('familiers.page.progress.remove') }}</button>
        </div>
      </div>
    </div>

    <Transition name="fam-modal">
      <div v-if="guideOpen" class="fam-guide-modal" role="dialog" aria-modal="true" :aria-label="$t('familiers.guide.dialogAria')" @click.self="guideOpen = false">
        <div class="fam-guide">
          <div class="fam-guide__topbar">
            <div>
              <div class="fam-guide__eyebrow">{{ $t('familiers.guide.eyebrow') }}</div>
              <div class="fam-guide__title">{{ $t('familiers.guide.title') }}</div>
            </div>
            <button class="fam-guide__close" type="button" :aria-label="$t('familiers.guide.closeAria')" @click="guideOpen = false">x</button>
          </div>
          <div class="fam-guide__hero">
            <div class="fam-guide__intro">
              {{ pricingMode === 'reference' ? $t('familiers.guide.referenceIntro') : $t('familiers.guide.manualIntro') }}
            </div>
            <div class="fam-guide__mode-badge">
              <span class="fam-guide__mode-label">{{ $t('familiers.guide.activeModeLabel') }}</span>
              <strong>{{ pricingMode === 'reference' ? $t('familiers.guide.referenceModeName') : $t('familiers.guide.manualModeName') }}</strong>
            </div>
          </div>
          <div class="fam-guide__legend">
            <div class="fam-guide-card">
              <div class="fam-guide-card__title">{{ $t('familiers.guide.cards.columns.title') }}</div>
              <div class="fam-guide-card__list">
                <div><strong>{{ $t('familiers.guide.cards.columns.xpLabel') }}</strong> = {{ $t('familiers.guide.cards.columns.xpText') }}</div>
                <div><strong>{{ $t('familiers.guide.cards.columns.qtyLabel') }}</strong> = {{ $t('familiers.guide.cards.columns.qtyText') }}</div>
                <div><strong>{{ pricingMode === 'reference' ? $t('familiers.guide.cards.columns.referencePriceLabel') : $t('familiers.guide.cards.columns.manualPriceLabel') }}</strong> = {{ pricingMode === 'reference' ? $t('familiers.guide.cards.columns.referencePriceText') : $t('familiers.guide.cards.columns.manualPriceText') }}</div>
                <div><strong>{{ pricingMode === 'reference' ? $t('familiers.guide.cards.columns.referenceTotalLabel') : $t('familiers.guide.cards.columns.manualTotalLabel') }}</strong> = {{ $t('familiers.guide.cards.columns.totalText') }}</div>
              </div>
            </div>
            <div class="fam-guide-card">
              <div class="fam-guide-card__title">{{ $t('familiers.guide.cards.example.title') }}</div>
              <div class="fam-guide-card__list">
                <div>{{ $t('familiers.guide.cards.example.line1') }}</div>
                <div>{{ $t('familiers.guide.cards.example.line2') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <div class="fam-panel">
      <div class="fam-tabs">
        <button v-for="view in viewOptions" :key="view.id" class="fam-tab" :class="{ 'fam-tab--on': activeView === view.id }" @click="activeView = view.id">
          {{ $t(view.label) }}
        </button>
      </div>

      <div class="fam-filter-grid">
        <input v-model="search" type="text" :placeholder="$t('familiers.page.search.placeholder')" class="fam-field fam-field--wide" />
        <select v-if="activeView === 'zones'" v-model="selectedZone" class="fam-field">
          <option value="">{{ $t('familiers.page.filters.allZones') }}</option>
          <option v-for="zone in zones" :key="zone.id" :value="zone.id">{{ zone.name }}</option>
        </select>
        <select v-model="pricedFilter" class="fam-field">
          <option value="all">{{ $t('familiers.page.filters.allPrices') }}</option>
          <option value="priced">{{ $t('familiers.page.filters.priced') }}</option>
          <option value="unpriced">{{ $t('familiers.page.filters.unpriced') }}</option>
        </select>
        <input v-model.number="filters.minXp" type="number" min="0" class="fam-field" :placeholder="$t('familiers.page.filters.minXp')" />
        <input v-model.number="filters.maxXp" type="number" min="0" class="fam-field" :placeholder="$t('familiers.page.filters.maxXp')" />
        <input v-model.number="filters.maxQty" type="number" min="0" class="fam-field" :placeholder="$t('familiers.page.filters.maxQty')" />
        <input v-model.number="filters.maxUnitPrice" type="number" min="0" class="fam-field" :placeholder="$t('familiers.page.filters.maxUnitPrice')" />
        <input v-model.number="filters.maxTotalCost" type="number" min="0" class="fam-field" :placeholder="$t('familiers.page.filters.maxTotalCost')" />
        <input v-if="activeView === 'essences'" v-model.number="filters.maxDungeonLevel" type="number" min="0" class="fam-field" :placeholder="$t('familiers.page.filters.maxDungeonLevel')" />
      </div>

      <div class="fam-sort">
        <span class="fam-sort__label">{{ $t('familiers.page.sort.label') }}</span>
        <button v-for="sort in sortOptions" :key="sort.id" class="fam-sort__btn" :class="{ 'fam-sort__btn--on': sortBy === sort.id }" @click="toggleSort(sort.id)">
          {{ $t(sort.label) }} {{ sortBy === sort.id ? sortArrow : '' }}
        </button>
      </div>
    </div>

    <div v-if="pricingMode === 'manual'" class="fam-panel fam-bulk">
      <div>
        <div class="fam-section-title">{{ $t('familiers.page.bulk.title') }}</div>
        <div class="fam-muted">{{ $t('familiers.page.bulk.hint') }}</div>
      </div>
      <textarea v-model="bulkText" class="fam-bulk__input" :placeholder="$t('familiers.page.bulk.placeholder')" />
      <div class="fam-bulk__actions">
        <button class="fam-action-btn" @click="applyBulkPrices">{{ $t('familiers.page.bulk.apply') }}</button>
        <button class="fam-clear-btn" @click="bulkText = ''; bulkResult = null">{{ $t('familiers.page.bulk.reset') }}</button>
      </div>
      <div v-if="bulkResult" class="fam-bulk__result">
        <strong>{{ $t('familiers.page.bulk.matched', { count: bulkResult.matched }) }}</strong>
        <span>{{ $t('familiers.page.bulk.unmatched', { count: bulkResult.unmatched.length }) }}</span>
        <div v-if="bulkResult.unmatched.length" class="fam-muted">{{ bulkResult.unmatched.slice(0, 6).join(' | ') }}</div>
      </div>
    </div>

    <div class="fam-panel fam-queue">
      <div class="fam-queue__top">
        <div>
          <div class="fam-section-title">{{ $t('familiers.page.queue.title') }}</div>
          <div class="fam-muted">{{ $t('familiers.page.queue.hint') }}</div>
        </div>
        <div class="fam-queue__actions">
          <button class="fam-action-btn" @click="buildCheckQueue">{{ $t('familiers.page.queue.build') }}</button>
          <button class="fam-clear-btn" :disabled="checkQueue.length === 0" @click="clearCheckQueue">{{ $t('familiers.page.queue.clear') }}</button>
        </div>
      </div>

      <div v-if="currentQueueItem" class="fam-queue-card">
        <div class="fam-queue-card__main">
          <div class="fam-queue-card__eyebrow">{{ $t('familiers.page.queue.position', { current: queueIndex + 1, total: checkQueue.length }) }}</div>
          <div class="fam-queue-card__name">{{ currentQueueItem.name }}</div>
          <div class="fam-queue-card__meta">
            <span>{{ $t('familiers.page.table.xpPerUnit') }}: {{ fmtDecimal(currentQueueItem.xp) }}</span>
            <span>{{ $t('familiers.page.table.qtyNeeded') }}: {{ fmtQty(qtyToBuy(currentQueueItem.xp)) }}</span>
            <span>{{ $t('familiers.page.table.targetPricePerUnit') }}: {{ fmt(maxPrice(currentQueueItem.xp)) }} k</span>
          </div>
        </div>
        <div class="fam-queue-card__entry">
          <button class="fam-action-btn" @click="copyQueueItemName">{{ queueCopyStatus || $t('familiers.page.queue.copy') }}</button>
          <input
            ref="queuePriceInput"
            type="number"
            min="0"
            step="1"
            class="fam-field fam-queue-price"
            :placeholder="$t('familiers.page.queue.pricePlaceholder')"
            @keydown.enter.prevent="saveQueuePriceAndNext"
          />
          <button class="fam-action-btn" @click="saveQueuePriceAndNext">{{ $t('familiers.page.queue.saveNext') }}</button>
          <button class="fam-clear-btn" @click="skipQueueItem">{{ $t('familiers.page.queue.skip') }}</button>
        </div>
      </div>
      <div v-else class="fam-empty fam-empty--small">{{ $t('familiers.page.queue.empty') }}</div>
    </div>

    <div class="fam-recs">
      <div v-for="panel in recommendationPanels" :key="panel.id" class="fam-rec">
        <div class="fam-section-title">{{ $t(panel.title) }}</div>
        <div v-if="panel.items.length" class="fam-rec__list">
          <div v-for="item in panel.items" :key="`${panel.id}-${item.name}`" class="fam-rec__row">
            <span>{{ item.name }}</span>
            <strong>{{ recommendationValue(panel.id, item) }}</strong>
          </div>
        </div>
        <div v-else class="fam-empty fam-empty--small">{{ $t('familiers.page.empty.recommendations') }}</div>
      </div>
    </div>

    <div class="fam-table-wrap">
      <div class="fam-table-head">
        <span class="fam-table-title">{{ currentSectionTitle }}</span>
        <span class="fam-table-count">{{ visibleTableItems.length }} / {{ filteredItems.length }} {{ $t('familiers.page.count.items') }}</span>
      </div>
      <table class="fam-table">
        <thead>
          <tr>
            <th>{{ $t('familiers.page.table.item') }}</th>
            <th>{{ $t('familiers.page.table.group') }}</th>
            <th class="text-right">{{ $t('familiers.page.table.xpPerUnit') }}</th>
            <th class="text-right">{{ $t('familiers.page.table.qtyNeeded') }}</th>
            <th class="text-right">{{ $t('familiers.page.table.targetPricePerUnit') }}</th>
            <th class="text-right">{{ $t('familiers.page.table.manualPricePerUnit') }}</th>
            <th class="text-right">{{ $t('familiers.page.table.totalTargetLevel', { level: targetLevel }) }}</th>
            <th class="text-right">{{ $t('familiers.page.table.xpPerKama') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in visibleTableItems" :key="item.key">
            <td class="fam-item-name">{{ item.name }}</td>
            <td class="fam-muted">{{ item.groupName }}</td>
            <td class="fam-num fam-xp text-right">{{ fmtDecimal(item.xp) }}</td>
            <td class="fam-num text-right">{{ fmtQty(qtyToBuy(item.xp)) }}</td>
            <td class="fam-num fam-price text-right">{{ fmt(maxPrice(item.xp)) }} k</td>
            <td class="text-right">
              <input
                :value="draftManualPrices[item.name] ?? manualPrices[item.name] ?? ''"
                type="number"
                min="0"
                step="1"
                class="fam-price-input"
                @input="setDraftManualPrice(item.name, ($event.target as HTMLInputElement).value)"
                @change="commitDraftManualPrice(item.name)"
                @keydown.enter.prevent="commitDraftManualPrice(item.name)"
              />
              <div v-if="manualPrices[item.name] == null && importedResourcePrice(item.name) != null" class="fam-price-source">
                {{ fmt(importedResourcePrice(item.name) || 0) }} k {{ $t('familiers.page.table.fromResources') }}
              </div>
            </td>
            <td class="fam-num fam-price text-right">{{ levelCostLabel(item) }}</td>
            <td class="fam-num text-right">{{ xpPerKamaLabel(item) }}</td>
          </tr>
          <tr v-if="filteredItems.length === 0">
            <td colspan="8" class="fam-empty">{{ $t('familiers.page.empty.items') }}</td>
          </tr>
          <tr v-else-if="filteredItems.length > visibleTableItems.length">
            <td colspan="8" class="fam-empty fam-empty--small">{{ $t('familiers.page.table.limited', { shown: visibleTableItems.length, total: filteredItems.length }) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { constants, essences, zones } from '~/data/familiers.json'
import allResources from '~/data/familiers-resources.json'


type PricingMode = 'reference' | 'manual'
type ViewId = 'complete' | 'zones' | 'essences' | 'best'
type SortId = 'xp' | 'qty' | 'targetPrice' | 'manualPrice' | 'totalCost' | 'xpPerKama' | 'name'
type PricedFilter = 'all' | 'priced' | 'unpriced'
type FamiliarItem = {
  key: string
  name: string
  xp: number
  source: 'complete' | 'zone' | 'essence'
  groupId: string
  groupName: string
  dungeonLevel?: number
}

const { t, locale } = useI18n()

const XP_PER_KIBBLE = constants.xpPerKibble
const levelXp = constants.levelXp as number[]
const targetLevel = ref(100)
const targetXp = computed(() => levelXp[targetLevel.value - 1] ?? constants.totalXP)
const KIBBLE_COUNT = computed(() => targetXp.value / XP_PER_KIBBLE)
const MANUAL_PRICES_KEY = 'familiers_manual_prices_v1'
const RESOURCE_PRICES_KEY = 'dofus-items-resource-prices-v1'
const PLANNED_PURCHASES_KEY = 'familiers_planned_purchases_v1'

const budget = ref(5_000_000)
const pricePerKibble = computed(() => budget.value / KIBBLE_COUNT.value)
const pricingMode = ref<PricingMode>('reference')
const manualPrices = shallowRef<Record<string, number>>({})
const draftManualPrices = shallowRef<Record<string, string>>({})
const resourcePrices = shallowRef<Record<string, number>>({})
const plannedPurchases = shallowRef<Array<{ name: string; qty: number; xp: number }>>([])
const guideOpen = ref(false)
const search = ref('')
const activeView = ref<ViewId>('complete')
const selectedZone = ref('')
const pricedFilter = ref<PricedFilter>('all')
const sortBy = ref<SortId>('xp')
const sortDir = ref<'desc' | 'asc'>('desc')
const bulkText = ref('')
const bulkResult = ref<{ matched: number; unmatched: string[] } | null>(null)
const checkQueue = ref<string[]>([])
const queueIndex = ref(0)
const queueCopyStatus = ref('')
const queuePriceInput = ref<HTMLInputElement | null>(null)
const purchaseNameInput = ref<HTMLInputElement | null>(null)
const purchaseQtyInput = ref<HTMLInputElement | null>(null)
const purchaseError = ref('')
const filters = reactive({
  minXp: null as number | null,
  maxXp: null as number | null,
  maxQty: null as number | null,
  maxUnitPrice: null as number | null,
  maxTotalCost: null as number | null,
  maxDungeonLevel: null as number | null,
})

const viewOptions: Array<{ id: ViewId; label: string }> = [
  { id: 'complete', label: 'familiers.page.views.complete' },
  { id: 'zones', label: 'familiers.page.views.zones' },
  { id: 'essences', label: 'familiers.page.views.essences' },
  { id: 'best', label: 'familiers.page.views.best' },
]

const sortOptions: Array<{ id: SortId; label: string }> = [
  { id: 'xp', label: 'familiers.page.sort.xp' },
  { id: 'qty', label: 'familiers.page.sort.qty' },
  { id: 'targetPrice', label: 'familiers.page.sort.targetPrice' },
  { id: 'manualPrice', label: 'familiers.page.sort.manualPrice' },
  { id: 'totalCost', label: 'familiers.page.sort.totalCost' },
  { id: 'xpPerKama', label: 'familiers.page.sort.xpPerKama' },
  { id: 'name', label: 'familiers.page.sort.name' },
]

const numberLocale = computed(() => locale.value === 'fr' ? 'fr-FR' : 'en-US')
const fmt = (n: number) => Math.round(n).toLocaleString(numberLocale.value)
const fmtDecimal = (n: number) => n.toLocaleString(numberLocale.value, { maximumFractionDigits: 3 })
const fmtQty = (n: number) => n % 1 === 0 ? n.toString() : n.toLocaleString(numberLocale.value, { maximumFractionDigits: 1 })
const sortArrow = computed(() => sortDir.value === 'desc' ? 'down' : 'up')

const normalizeName = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[œ]/g, 'oe')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const purchasedXp = computed(() => plannedPurchases.value.reduce((sum, entry) => sum + entry.qty * entry.xp, 0))
const remainingXp = computed(() => Math.max(0, targetXp.value - purchasedXp.value))
const progressPercent = computed(() => targetXp.value > 0 ? Math.min(100, (purchasedXp.value / targetXp.value) * 100) : 0)
const qtyNeeded = (xp: number) => remainingXp.value / xp
const qtyToBuy = (xp: number) => remainingXp.value <= 0 ? 0 : Math.ceil(qtyNeeded(xp))
const maxPrice = (xp: number) => Math.round((pricePerKibble.value * xp) / XP_PER_KIBBLE)
const referenceLevelCost = (item: { xp: number }) => Math.round(maxPrice(item.xp) * qtyToBuy(item.xp))
const importedResourcePrice = (name: string) => resourcePrices.value[normalizeName(name)] ?? null
const effectiveManualPrice = (name: string) => manualPrices.value[name] ?? importedResourcePrice(name)
const manualLevelCost = (item: { name: string; xp: number }) => {
  const price = effectiveManualPrice(item.name)
  if (!(typeof price === 'number') || price <= 0) return null
  return Math.round(price * qtyToBuy(item.xp))
}
const xpPerKama = (item: { name: string; xp: number }) => {
  const price = effectiveManualPrice(item.name)
  return price && price > 0 ? item.xp / price : null
}

const manualPricedCount = computed(() =>
  Object.values(manualPrices.value).filter((value) => typeof value === 'number' && value > 0).length
)

const completeItems = computed<FamiliarItem[]>(() => [
  ...(allResources as Array<{ name: string; xp: number }>).map(item => ({
    key: `complete-${item.name}`,
    name: item.name,
    xp: item.xp,
    source: 'complete' as const,
    groupId: 'complete',
    groupName: t('familiers.page.sections.completeList'),
  })),
  ...essences.map(item => ({
    key: `essence-${item.name}`,
    name: item.name,
    xp: item.xp,
    source: 'essence' as const,
    groupId: 'essences',
    groupName: t('familiers.page.sections.essences'),
    dungeonLevel: item.dungeonLevel,
  })),
])

const zoneItems = computed<FamiliarItem[]>(() =>
  zones.flatMap(zone => zone.items.map(item => ({
    key: `zone-${zone.id}-${item.name}`,
    name: item.name,
    xp: item.xp,
    source: 'zone' as const,
    groupId: zone.id,
    groupName: zone.name,
  })))
)

const essenceItems = computed<FamiliarItem[]>(() => completeItems.value.filter(item => item.source === 'essence'))
const baseItems = computed(() => {
  if (activeView.value === 'zones') return selectedZone.value ? zoneItems.value.filter(item => item.groupId === selectedZone.value) : zoneItems.value
  if (activeView.value === 'essences') return essenceItems.value
  if (activeView.value === 'best') return completeItems.value.filter(item => effectiveManualPrice(item.name) || item.xp >= 100)
  return completeItems.value
})

const passesNumberFilter = (value: number, max: number | null) => max == null || max === 0 || value <= max
const filteredItems = computed(() => {
  const q = normalizeName(search.value)
  const filtered = baseItems.value.filter((item) => {
    const manualPrice = effectiveManualPrice(item.name)
    const totalCost = pricingMode.value === 'manual' ? manualLevelCost(item) : referenceLevelCost(item)
    if (q && !normalizeName(`${item.name} ${item.groupName}`).includes(q)) return false
    if (filters.minXp && item.xp < filters.minXp) return false
    if (filters.maxXp && item.xp > filters.maxXp) return false
    if (!passesNumberFilter(qtyToBuy(item.xp), filters.maxQty)) return false
    if (!passesNumberFilter(pricingMode.value === 'manual' ? (manualPrice ?? Number.POSITIVE_INFINITY) : maxPrice(item.xp), filters.maxUnitPrice)) return false
    if (!passesNumberFilter(totalCost ?? Number.POSITIVE_INFINITY, filters.maxTotalCost)) return false
    if (activeView.value === 'essences' && filters.maxDungeonLevel && (item.dungeonLevel ?? 0) > filters.maxDungeonLevel) return false
    if (pricedFilter.value === 'priced' && !manualPrice) return false
    if (pricedFilter.value === 'unpriced' && manualPrice) return false
    return true
  })
  return sortItems(filtered)
})

const visibleTableItems = computed(() => filteredItems.value.slice(0, 80))

const sortValue = (item: FamiliarItem) => {
  if (sortBy.value === 'xp') return item.xp
  if (sortBy.value === 'qty') return qtyToBuy(item.xp)
  if (sortBy.value === 'targetPrice') return maxPrice(item.xp)
  if (sortBy.value === 'manualPrice') return effectiveManualPrice(item.name) ?? -1
  if (sortBy.value === 'totalCost') return pricingMode.value === 'manual' ? manualLevelCost(item) ?? Number.POSITIVE_INFINITY : referenceLevelCost(item)
  if (sortBy.value === 'xpPerKama') return xpPerKama(item) ?? -1
  return item.name
}

const sortItems = (items: FamiliarItem[]) => [...items].sort((a, b) => {
  const av = sortValue(a)
  const bv = sortValue(b)
  const diff = typeof av === 'string' || typeof bv === 'string'
    ? String(av).localeCompare(String(bv), numberLocale.value)
    : av - bv
  return sortDir.value === 'desc' ? -diff : diff
})

const toggleSort = (key: SortId) => {
  if (sortBy.value === key) sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  else {
    sortBy.value = key
    sortDir.value = key === 'name' || key === 'qty' || key === 'manualPrice' || key === 'totalCost' ? 'asc' : 'desc'
  }
}

const clampTargetLevel = () => {
  const next = Math.round(Number(targetLevel.value) || 100)
  targetLevel.value = Math.min(100, Math.max(1, next))
}

const currentSectionTitle = computed(() => {
  const option = viewOptions.find(view => view.id === activeView.value)
  return option ? t(option.label) : t('familiers.page.sections.completeList')
})

const setManualPrice = (itemName: string, value: string | number) => {
  const raw = typeof value === 'number' ? String(value) : value
  if (!raw.trim()) {
    const { [itemName]: _removed, ...next } = manualPrices.value
    manualPrices.value = next
    return
  }
  const parsed = Number(raw.replace(/\s/g, ''))
  if (!Number.isFinite(parsed) || parsed < 0) return
  manualPrices.value = { ...manualPrices.value, [itemName]: Math.round(parsed) }
}

const setDraftManualPrice = (itemName: string, value: string) => {
  draftManualPrices.value[itemName] = value
}

const commitDraftManualPrice = (itemName: string) => {
  const raw = draftManualPrices.value[itemName]
  if (raw == null) return
  setManualPrice(itemName, raw)
  delete draftManualPrices.value[itemName]
}

const clearManualPrices = () => {
  manualPrices.value = {}
}

const addPlannedPurchase = () => {
  purchaseError.value = ''
  const rawName = purchaseNameInput.value?.value ?? ''
  const rawQty = purchaseQtyInput.value?.value ?? ''
  const canonical = knownNameMap.value.get(normalizeName(rawName))
  const qty = Number(rawQty.replace(/\s/g, ''))
  if (!canonical) {
    purchaseError.value = t('familiers.page.progress.errors.unknownItem')
    return
  }
  if (!Number.isFinite(qty) || qty <= 0) {
    purchaseError.value = t('familiers.page.progress.errors.badQty')
    return
  }
  const item = itemByName.value.get(canonical)
  if (!item) {
    purchaseError.value = t('familiers.page.progress.errors.unknownItem')
    return
  }
  const existing = plannedPurchases.value.find(entry => entry.name === canonical)
  const next = plannedPurchases.value.filter(entry => entry.name !== canonical)
  next.push({ name: canonical, qty: (existing?.qty ?? 0) + qty, xp: item.xp })
  plannedPurchases.value = next.sort((a, b) => a.name.localeCompare(b.name, numberLocale.value))
  if (purchaseNameInput.value) purchaseNameInput.value.value = ''
  if (purchaseQtyInput.value) purchaseQtyInput.value.value = ''
}

const removePlannedPurchase = (itemName: string) => {
  plannedPurchases.value = plannedPurchases.value.filter(entry => entry.name !== itemName)
}

const clearPlannedPurchases = () => {
  plannedPurchases.value = []
}

const manualLevelCostLabel = (item: { name: string; xp: number }) => {
  const total = manualLevelCost(item)
  return total === null ? t('familiers.page.misc.emptyValue') : `${fmt(total)} k`
}
const levelCostLabel = (item: { name: string; xp: number }) =>
  pricingMode.value === 'reference' ? `${fmt(referenceLevelCost(item))} k` : manualLevelCostLabel(item)
const xpPerKamaLabel = (item: FamiliarItem) => {
  const value = xpPerKama(item)
  return value == null ? t('familiers.page.misc.emptyValue') : value.toLocaleString(numberLocale.value, { maximumFractionDigits: 4 })
}

const knownNameMap = computed(() => {
  const map = new Map<string, string>()
  for (const item of [...completeItems.value, ...zoneItems.value]) map.set(normalizeName(item.name), item.name)
  return map
})

const itemByName = computed(() => {
  const map = new Map<string, FamiliarItem>()
  for (const item of [...completeItems.value, ...zoneItems.value]) {
    if (!map.has(item.name)) map.set(item.name, item)
  }
  return map
})

const currentQueueItem = computed(() => {
  const name = checkQueue.value[queueIndex.value]
  return name ? itemByName.value.get(name) ?? null : null
})

const parsePriceLine = (line: string) => {
  const cleaned = line.trim()
  const match = cleaned.match(/^(.*?)[\s;,\t:=-]+([0-9][0-9\s.]*)\s*k?$/i)
  if (!match) return null
  const parsed = Number(match[2].replace(/[\s.]/g, ''))
  if (!Number.isFinite(parsed)) return null
  return { name: match[1].trim(), price: Math.round(parsed) }
}

const applyBulkPrices = () => {
  let matched = 0
  const unmatched: string[] = []
  const nextPrices = { ...manualPrices.value }
  for (const line of bulkText.value.split(/\r?\n/)) {
    if (!line.trim()) continue
    const parsed = parsePriceLine(line)
    if (!parsed) {
      unmatched.push(line.trim())
      continue
    }
    const canonical = knownNameMap.value.get(normalizeName(parsed.name))
    if (!canonical) {
      unmatched.push(parsed.name)
      continue
    }
    nextPrices[canonical] = parsed.price
    matched += 1
  }
  manualPrices.value = nextPrices
  bulkResult.value = { matched, unmatched }
}

const buildCheckQueue = () => {
  const seen = new Set<string>()
  const candidates = completeItems.value
    .filter(item => item.xp >= 100)
    .filter(item => qtyToBuy(item.xp) <= 750)
    .filter(item => maxPrice(item.xp) >= 1000)
    .filter(item => !effectiveManualPrice(item.name))
    .filter((item) => {
      if (seen.has(item.name)) return false
      seen.add(item.name)
      return true
    })
    .sort((a, b) => {
      const scoreA = a.xp * 2 + maxPrice(a.xp) / 100 - qtyToBuy(a.xp)
      const scoreB = b.xp * 2 + maxPrice(b.xp) / 100 - qtyToBuy(b.xp)
      return scoreB - scoreA
    })
    .slice(0, 40)

  checkQueue.value = candidates.map(item => item.name)
  queueIndex.value = 0
  if (queuePriceInput.value) queuePriceInput.value.value = ''
  queueCopyStatus.value = ''
}

const clearCheckQueue = () => {
  checkQueue.value = []
  queueIndex.value = 0
  if (queuePriceInput.value) queuePriceInput.value.value = ''
  queueCopyStatus.value = ''
}

const advanceQueue = () => {
  if (queuePriceInput.value) queuePriceInput.value.value = ''
  queueCopyStatus.value = ''
  queueIndex.value = Math.min(queueIndex.value + 1, checkQueue.value.length)
}

const saveQueuePriceAndNext = () => {
  const item = currentQueueItem.value
  if (!item) return
  const price = queuePriceInput.value?.value ?? ''
  if (price.trim()) setManualPrice(item.name, price)
  advanceQueue()
}

const skipQueueItem = () => {
  advanceQueue()
}

const copyQueueItemName = async () => {
  const item = currentQueueItem.value
  if (!item || !import.meta.client || !navigator.clipboard?.writeText) return
  try {
    await navigator.clipboard.writeText(item.name)
    queueCopyStatus.value = t('familiers.page.queue.copied')
    window.setTimeout(() => {
      queueCopyStatus.value = ''
    }, 1200)
  } catch {
    queueCopyStatus.value = ''
  }
}

const pricedItems = computed(() => completeItems.value.filter(item => effectiveManualPrice(item.name)))
const takeBest = (items: FamiliarItem[], compare: (a: FamiliarItem, b: FamiliarItem) => number) => [...items].sort(compare).slice(0, 5)
const recommendationPanels = computed(() => [
  {
    id: 'cheapest',
    title: 'familiers.page.recommendations.cheapest',
    items: takeBest(pricedItems.value.filter(item => manualLevelCost(item) != null), (a, b) => (manualLevelCost(a) ?? 0) - (manualLevelCost(b) ?? 0)),
  },
  {
    id: 'bestXp',
    title: 'familiers.page.recommendations.bestXpKama',
    items: takeBest(pricedItems.value, (a, b) => (xpPerKama(b) ?? 0) - (xpPerKama(a) ?? 0)),
  },
  {
    id: 'underTarget',
    title: 'familiers.page.recommendations.underTarget',
    items: takeBest(pricedItems.value.filter(item => (effectiveManualPrice(item.name) ?? 0) <= maxPrice(item.xp)), (a, b) => (effectiveManualPrice(a.name) ?? 0) - maxPrice(a.xp) - ((effectiveManualPrice(b.name) ?? 0) - maxPrice(b.xp))),
  },
  {
    id: 'lowQty',
    title: 'familiers.page.recommendations.lowQty',
    items: takeBest(completeItems.value, (a, b) => qtyToBuy(a.xp) - qtyToBuy(b.xp)),
  },
])

const recommendationValue = (panelId: string, item: FamiliarItem) => {
  if (panelId === 'cheapest') return manualLevelCostLabel(item)
  if (panelId === 'bestXp') return xpPerKamaLabel(item)
  if (panelId === 'underTarget') return `${fmt(effectiveManualPrice(item.name) ?? 0)} / ${fmt(maxPrice(item.xp))} k`
  return fmtQty(qtyToBuy(item.xp))
}

const readResourcePrices = () => {
  const next: Record<string, number> = {}
  try {
    const raw = localStorage.getItem(RESOURCE_PRICES_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    for (const value of Object.values(parsed) as Array<{ name?: string; price?: number; unitPrice?: number }>) {
      if (!value?.name) continue
      const price = Number(value.price ?? value.unitPrice ?? 0)
      if (Number.isFinite(price) && price > 0) next[normalizeName(value.name)] = Math.round(price)
    }
  } catch {}
  resourcePrices.value = next
}

onMounted(() => {
  try {
    const raw = localStorage.getItem(MANUAL_PRICES_KEY)
    manualPrices.value = raw ? JSON.parse(raw) : {}
  } catch {
    manualPrices.value = {}
  }
  try {
    const raw = localStorage.getItem(PLANNED_PURCHASES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    plannedPurchases.value = Array.isArray(parsed)
      ? parsed.filter(entry => entry?.name && Number(entry.qty) > 0 && Number(entry.xp) > 0)
      : []
  } catch {
    plannedPurchases.value = []
  }
  readResourcePrices()
})

watch(manualPrices, (value) => {
  localStorage.setItem(MANUAL_PRICES_KEY, JSON.stringify(value))
})

watch(plannedPurchases, (value) => {
  localStorage.setItem(PLANNED_PURCHASES_KEY, JSON.stringify(value))
})
</script>

<style scoped>
.fam-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: .625rem;
  margin-bottom: .875rem;
}
@media (max-width: 640px) { .fam-stats { grid-template-columns: repeat(2, 1fr); } }
.fam-stat, .fam-panel, .fam-rec, .fam-table-wrap {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 12px;
}
.fam-stat { padding: .875rem 1rem; text-align: center; }
.fam-stat__val { font-size: 1.25rem; font-weight: 800; color: var(--v2-accent); line-height: 1.2; }
.fam-stat__label { font-size: .6875rem; color: var(--v2-text-secondary); margin-top: 2px; }
.fam-budget {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .75rem;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 12px;
  padding: .75rem 1rem;
  margin-bottom: .875rem;
}
.fam-budget--mode { justify-content: space-between; }
.fam-budget__label, .fam-sort__label {
  font-size: .75rem;
  font-weight: 700;
  color: var(--v2-text-secondary);
  text-transform: uppercase;
  letter-spacing: .04em;
  white-space: nowrap;
}
.fam-mode-toggle, .fam-tabs {
  display: flex;
  gap: 4px;
  padding: .25rem;
  border-radius: 10px;
  background: rgba(0,0,0,.2);
  border: 1px solid var(--v2-border-subtle);
  flex-wrap: wrap;
}
.fam-mode-toggle__btn, .fam-tab {
  padding: .375rem .75rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--v2-text-secondary);
  font-size: .8125rem;
  font-weight: 600;
  cursor: pointer;
}
.fam-mode-toggle__btn--on, .fam-tab--on { background: var(--v2-active-strong); color: var(--v2-text); }
.fam-target-level {
  display: flex;
  align-items: center;
  gap: .45rem;
  color: var(--v2-text-secondary);
  font-size: .75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.fam-target-level__input {
  width: 74px;
  padding: .36rem .5rem;
  border-radius: 8px;
  border: 1px solid var(--v2-border-med);
  background: rgba(0,0,0,.25);
  color: var(--v2-text);
  font-size: .85rem;
  font-weight: 800;
  text-align: center;
  outline: none;
}
.fam-help-btn {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid var(--v2-active);
  background: linear-gradient(180deg, var(--v2-active-strong), var(--v2-active));
  color: var(--v2-text);
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
}
.fam-clear-btn, .fam-action-btn {
  padding: .42rem .75rem;
  border-radius: 8px;
  font-size: .75rem;
  font-weight: 700;
  cursor: pointer;
}
.fam-clear-btn {
  border: 1px solid rgba(248,113,113,.2);
  background: transparent;
  color: #f87171;
}
.fam-action-btn {
  border: 1px solid var(--v2-border-med);
  background: var(--v2-active-strong);
  color: var(--v2-text);
}
.fam-budget__input-wrap { display: flex; align-items: center; gap: .375rem; }
.fam-budget__input, .fam-field, .fam-bulk__input, .fam-price-input {
  background: rgba(0,0,0,.25);
  border: 1px solid var(--v2-border-med);
  border-radius: 8px;
  color: var(--v2-text);
  outline: none;
}
.fam-budget__input { padding: .375rem .625rem; width: 140px; font-size: .9375rem; font-weight: 700; }
.fam-budget__unit, .fam-budget__hint, .fam-muted { font-size: .8125rem; color: var(--v2-text-muted); }
.fam-budget__hint strong { color: var(--v2-text-hover); }
.fam-panel {
  padding: .75rem;
  margin-bottom: .875rem;
}
.fam-filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .5rem;
  margin: .75rem 0;
}
.fam-field { min-width: 0; padding: .46rem .65rem; font-size: .82rem; }
.fam-field--wide { grid-column: span 2; }
.fam-sort { display: flex; align-items: center; gap: 3px; flex-wrap: wrap; }
.fam-sort__btn {
  padding: .3125rem .625rem;
  border-radius: 7px;
  border: 1px solid var(--v2-active);
  background: transparent;
  color: var(--v2-text-muted);
  font-size: .75rem;
  font-weight: 500;
  cursor: pointer;
}
.fam-sort__btn--on { background: var(--v2-border-med); border-color: var(--v2-border-strong); color: var(--v2-text); }
.fam-bulk { display: grid; gap: .625rem; }
.fam-bulk__input { width: 100%; min-height: 92px; padding: .65rem; resize: vertical; }
.fam-bulk__actions, .fam-bulk__result { display: flex; gap: .625rem; align-items: center; flex-wrap: wrap; }
.fam-section-title { font-size: .9rem; font-weight: 800; color: var(--v2-text-hover); }
.fam-queue { display: grid; gap: .75rem; }
.fam-queue__top {
  display: flex;
  justify-content: space-between;
  gap: .75rem;
  align-items: flex-start;
  flex-wrap: wrap;
}
.fam-queue__actions, .fam-queue-card__entry {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-wrap: wrap;
}
.fam-queue-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: .85rem;
  border: 1px solid var(--v2-border-subtle);
  border-radius: 10px;
  background: rgba(0,0,0,.16);
}
.fam-queue-card__main { min-width: 220px; }
.fam-queue-card__eyebrow {
  font-size: .68rem;
  font-weight: 800;
  color: var(--v2-accent);
  text-transform: uppercase;
  letter-spacing: .06em;
  margin-bottom: .25rem;
}
.fam-queue-card__name {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--v2-text-hover);
  margin-bottom: .35rem;
}
.fam-queue-card__meta {
  display: flex;
  gap: .65rem;
  flex-wrap: wrap;
  font-size: .78rem;
  color: var(--v2-text-muted);
}
.fam-queue-price { width: 150px; }
.fam-progress { display: grid; gap: .7rem; }
.fam-progress__top,
.fam-progress__entry,
.fam-progress__row {
  display: flex;
  align-items: center;
  gap: .65rem;
  flex-wrap: wrap;
}
.fam-progress__top { justify-content: space-between; align-items: flex-start; }
.fam-progress__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .5rem;
}
.fam-progress__stats div {
  padding: .65rem .75rem;
  border: 1px solid var(--v2-border-subtle);
  border-radius: 8px;
  background: rgba(0,0,0,.16);
}
.fam-progress__stats span {
  display: block;
  margin-bottom: .2rem;
  font-size: .68rem;
  font-weight: 800;
  color: var(--v2-text-muted);
  text-transform: uppercase;
  letter-spacing: .04em;
}
.fam-progress__stats strong { color: var(--v2-accent); font-size: .95rem; }
.fam-progress__entry .fam-field:first-child { flex: 1 1 260px; }
.fam-progress__qty { width: 130px; }
.fam-progress__list { display: grid; gap: .4rem; }
.fam-progress__row {
  justify-content: space-between;
  padding: .5rem .6rem;
  border: 1px solid var(--v2-border-subtle);
  border-radius: 8px;
  background: rgba(0,0,0,.12);
  font-size: .78rem;
}
.fam-progress__row span { color: var(--v2-text-hover); font-weight: 700; }
.fam-progress__row strong { color: var(--v2-text-secondary); font-weight: 600; }
.fam-error { color: #f87171; font-size: .78rem; font-weight: 700; }
.fam-recs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .625rem;
  margin-bottom: .875rem;
}
.fam-rec { padding: .75rem; min-height: 160px; }
.fam-rec__list { display: grid; gap: .45rem; margin-top: .6rem; }
.fam-rec__row {
  display: flex;
  justify-content: space-between;
  gap: .65rem;
  font-size: .78rem;
  color: var(--v2-text-secondary);
}
.fam-rec__row span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fam-rec__row strong { color: var(--v2-accent); white-space: nowrap; }
.fam-table-wrap { overflow: hidden; }
.fam-table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .75rem 1rem;
  border-bottom: 1px solid var(--v2-border-subtle);
}
.fam-table-title { font-size: .9375rem; font-weight: 700; color: var(--v2-text-hover); }
.fam-table-count {
  font-size: .6875rem;
  background: var(--v2-active);
  color: var(--v2-accent);
  padding: .125rem .5rem;
  border-radius: 999px;
  font-weight: 600;
}
.fam-table { width: 100%; border-collapse: collapse; overflow-x: auto; display: block; }
.fam-table thead tr, .fam-table tbody tr { border-bottom: 1px solid var(--v2-border-subtle); }
.fam-table th {
  padding: .5rem .875rem;
  font-size: .6875rem;
  font-weight: 700;
  color: var(--v2-text-secondary);
  text-transform: uppercase;
  letter-spacing: .04em;
  text-align: left;
  white-space: nowrap;
}
.fam-table td { padding: .5rem .875rem; vertical-align: top; }
.fam-item-name { font-size: .875rem; font-weight: 600; color: var(--v2-text); min-width: 180px; }
.fam-num { font-size: .875rem; white-space: nowrap; }
.fam-price-input { width: 120px; max-width: 100%; padding: .35rem .55rem; font-size: .8125rem; text-align: right; }
.fam-price-source { margin-top: .2rem; font-size: .67rem; color: var(--v2-text-muted); white-space: nowrap; }
.fam-xp { color: var(--v2-text-hover); font-weight: 600; }
.fam-price { color: var(--v2-accent); font-weight: 700; }
.fam-empty { text-align: center; color: var(--v2-text-dim); font-size: .875rem; padding: 2.5rem; }
.fam-empty--small { padding: 1rem .25rem; font-size: .78rem; }
.fam-guide-modal {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, .72);
}
.fam-guide {
  width: min(960px, 100%);
  max-height: min(88vh, 900px);
  overflow: auto;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid var(--v2-border-med);
  background: var(--v2-bg);
  box-shadow: 0 24px 70px rgba(0, 0, 0, .55);
}
.fam-guide__topbar, .fam-guide__hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: .8rem; }
.fam-guide__close { width: 34px; height: 34px; border-radius: 10px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); color: #f2fff8; cursor: pointer; }
.fam-guide__eyebrow { font-size: .6875rem; font-weight: 800; color: var(--v2-accent); text-transform: uppercase; letter-spacing: .08em; margin-bottom: .35rem; }
.fam-guide__title { font-size: 1rem; font-weight: 800; color: var(--v2-text-hover); }
.fam-guide__intro { max-width: 70ch; font-size: .84rem; color: #dbece4; line-height: 1.5; }
.fam-guide__mode-badge, .fam-guide-card { padding: .75rem .85rem; border-radius: 12px; background: var(--v2-hover-subtle); border: 1px solid var(--v2-border-subtle); }
.fam-guide__mode-label { display: block; font-size: .6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--v2-text-muted); margin-bottom: .2rem; }
.fam-guide__legend { display: grid; grid-template-columns: 1.4fr 1fr; gap: .75rem; }
.fam-guide-card__title { font-size: .78rem; font-weight: 800; color: var(--v2-text-hover); margin-bottom: .45rem; }
.fam-guide-card__list { display: grid; gap: .38rem; font-size: .8rem; color: #d8e8e1; line-height: 1.45; }
.fam-modal-enter-active, .fam-modal-leave-active { transition: opacity .18s ease; }
.fam-modal-enter-from, .fam-modal-leave-to { opacity: 0; }
@media (max-width: 980px) {
  .fam-filter-grid, .fam-recs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .fam-field--wide { grid-column: span 2; }
  .fam-queue-card { align-items: flex-start; flex-direction: column; }
}
@media (max-width: 640px) {
  .fam-filter-grid, .fam-recs, .fam-guide__legend, .fam-progress__stats { grid-template-columns: 1fr; }
  .fam-field--wide { grid-column: span 1; }
}
</style>
