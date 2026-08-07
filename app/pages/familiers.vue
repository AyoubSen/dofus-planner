<template>
  <div class="flex flex-col gap-5">
    <!-- Game constants render recessed and dashed so they never read as
         live, user-driven numbers the way they used to. -->
    <UiStatRow>
      <UiStat
        kind="constant"
        :label="$t('familiers.page.stats.totalXp', { level: targetLevel })"
        :value="fmt(targetXp)"
      />
      <UiStat kind="constant" :label="$t('familiers.page.stats.xpPerKibble')" :value="XP_PER_KIBBLE" />
      <UiStat kind="constant" :label="$t('familiers.page.stats.equivalentKibbles')" :value="fmtQty(KIBBLE_COUNT)" />
      <UiStat
        :label="pricingMode === 'reference' ? $t('familiers.page.stats.targetPricePerKibble') : $t('familiers.page.stats.manualPricedItems')"
        tone="accent"
      >
        <UiMoney v-if="pricingMode === 'reference'" :value="Math.round(pricePerKibble)" size="lg" />
        <span v-else class="tabular text-xl font-semibold text-accent">{{ manualPricedCount }}</span>
      </UiStat>
    </UiStatRow>

    <!-- ── Mode + target ────────────────────────────────────────────────── -->
    <UiCard>
      <div class="flex flex-wrap items-end gap-4">
        <UiField :label="$t('familiers.page.mode.label')">
          <UiSegmented
            v-model="pricingMode"
            :options="modeOptions"
            :aria-label="$t('familiers.page.mode.label')"
          />
        </UiField>

        <UiField :label="$t('familiers.page.targetLevel.label')" class="w-28">
          <UiNumberInput v-model="targetLevel" :min="1" @update:model-value="clampTargetLevel" />
        </UiField>

        <UiField v-if="pricingMode === 'reference'" :label="$t('familiers.page.reference.budgetLabel')" class="w-44">
          <UiNumberInput v-model="budget" :min="0" :unit="$t('familiers.page.reference.kamasUnit')" />
        </UiField>

        <UiButton variant="ghost" size="sm" class="ml-auto" @click="guideOpen = true">
          {{ $t('familiers.guide.openAria') }}
        </UiButton>
      </div>

      <p class="mt-3 text-sm text-muted">
        <template v-if="pricingMode === 'reference'">
          {{ $t('familiers.page.reference.formulaPrefix') }}
          <span class="tabular text-ink">{{ fmt(Math.round(pricePerKibble)) }} k</span>,
          {{ $t('familiers.page.reference.formulaMiddle') }} <span class="text-ink">X XP</span>
          {{ $t('familiers.page.reference.formulaSuffix') }}
          <span class="tabular text-ink">{{ fmt(Math.round(pricePerKibble)) }} × X / {{ XP_PER_KIBBLE }}</span>
          {{ $t('familiers.page.reference.kamasShort') }}
        </template>
        <template v-else>
          {{ $t('familiers.page.manual.hintPrefix') }}
          <span class="text-ink">{{ $t('familiers.page.manual.hintFormula') }}</span>.
          {{ $t('familiers.page.manual.hintSuffix') }}
          <UiButton variant="ghost" size="sm" class="ml-2" @click="clearManualPrices">
            {{ $t('familiers.page.manual.clear') }}
          </UiButton>
        </template>
      </p>
    </UiCard>

    <!-- ── Progress ─────────────────────────────────────────────────────── -->
    <UiCard :title="$t('familiers.page.progress.title')" :subtitle="$t('familiers.page.progress.hint')">
      <template #actions>
        <UiButton variant="ghost" size="sm" :disabled="!plannedPurchases.length" @click="clearPlannedPurchases">
          {{ $t('familiers.page.progress.clear') }}
        </UiButton>
      </template>

      <UiProgress
        :value="purchasedXp"
        :max="targetXp"
        tone="positive"
        :label="$t('familiers.page.progress.boughtXp')"
        show-value
        :value-text="`${fmt(purchasedXp)} / ${fmt(targetXp)} (${progressPercent.toLocaleString(numberLocale, { maximumFractionDigits: 1 })}%)`"
      />
      <p class="mt-1.5 text-xs text-subtle">
        {{ $t('familiers.page.progress.remainingXp') }}:
        <span class="tabular text-muted">{{ fmt(remainingXp) }}</span>
      </p>

      <div class="mt-3 flex flex-wrap items-end gap-2">
        <input
          ref="purchaseNameInput"
          type="text"
          :class="[inputClass, 'min-w-0 flex-1']"
          :placeholder="$t('familiers.page.progress.itemPlaceholder')"
        >
        <input
          ref="purchaseQtyInput"
          type="number"
          min="0"
          step="1"
          :class="[inputClass, 'tabular w-24']"
          :placeholder="$t('familiers.page.progress.qtyPlaceholder')"
          @keydown.enter.prevent="addPlannedPurchase"
        >
        <UiButton variant="primary" @click="addPlannedPurchase">{{ $t('familiers.page.progress.add') }}</UiButton>
      </div>
      <p v-if="purchaseError" class="mt-1.5 text-xs text-negative">{{ purchaseError }}</p>

      <div v-if="plannedPurchases.length" class="mt-3 flex flex-col">
        <div
          v-for="entry in plannedPurchases"
          :key="entry.name"
          class="flex items-center gap-3 border-b border-line py-1.5 text-sm last:border-0"
        >
          <span class="min-w-0 flex-1 truncate text-ink">{{ entry.name }}</span>
          <span class="tabular text-muted">
            {{ fmtQty(entry.qty) }} × {{ fmtDecimal(entry.xp) }} = {{ fmt(Math.round(entry.qty * entry.xp)) }} XP
          </span>
          <UiButton variant="ghost" size="sm" icon :aria-label="$t('familiers.page.progress.remove')" @click="removePlannedPurchase(entry.name)">
            <UiIcon name="close" />
          </UiButton>
        </div>
      </div>
    </UiCard>

    <!-- ── Bulk prices (manual mode only) ───────────────────────────────── -->
    <UiCard v-if="pricingMode === 'manual'" :title="$t('familiers.page.bulk.title')" :subtitle="$t('familiers.page.bulk.hint')">
      <textarea
        v-model="bulkText"
        rows="4"
        :class="[inputClass, 'h-auto w-full py-2 leading-relaxed']"
        :placeholder="$t('familiers.page.bulk.placeholder')"
      />
      <div class="mt-2 flex gap-2">
        <UiButton variant="primary" size="sm" @click="applyBulkPrices">{{ $t('familiers.page.bulk.apply') }}</UiButton>
        <UiButton variant="ghost" size="sm" @click="bulkText = ''; bulkResult = null">{{ $t('familiers.page.bulk.reset') }}</UiButton>
      </div>
      <p v-if="bulkResult" class="mt-2 text-sm">
        <span class="text-positive">{{ $t('familiers.page.bulk.matched', { count: bulkResult.matched }) }}</span>
        <span class="ml-2 text-muted">{{ $t('familiers.page.bulk.unmatched', { count: bulkResult.unmatched.length }) }}</span>
        <span v-if="bulkResult.unmatched.length" class="mt-1 block text-xs text-subtle">
          {{ bulkResult.unmatched.slice(0, 6).join(' · ') }}
        </span>
      </p>
    </UiCard>

    <!-- ── Price-check queue ────────────────────────────────────────────── -->
    <UiCard :title="$t('familiers.page.queue.title')" :subtitle="$t('familiers.page.queue.hint')">
      <template #actions>
        <UiButton size="sm" @click="buildCheckQueue">{{ $t('familiers.page.queue.build') }}</UiButton>
        <UiButton variant="ghost" size="sm" :disabled="!checkQueue.length" @click="clearCheckQueue">
          {{ $t('familiers.page.queue.clear') }}
        </UiButton>
      </template>

      <div v-if="currentQueueItem">
        <p class="text-xs font-medium tracking-wide text-subtle uppercase">
          {{ $t('familiers.page.queue.position', { current: queueIndex + 1, total: checkQueue.length }) }}
        </p>
        <p class="mt-0.5 text-lg font-semibold text-ink">{{ currentQueueItem.name }}</p>
        <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span>{{ $t('familiers.page.table.xpPerUnit') }}: <span class="tabular">{{ fmtDecimal(currentQueueItem.xp) }}</span></span>
          <span>{{ $t('familiers.page.table.qtyNeeded') }}: <span class="tabular">{{ fmtQty(qtyToBuy(currentQueueItem.xp)) }}</span></span>
          <span>{{ $t('familiers.page.table.targetPricePerUnit') }}: <span class="tabular">{{ fmt(maxPrice(currentQueueItem.xp)) }} k</span></span>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <UiButton size="sm" @click="copyQueueItemName">{{ queueCopyStatus || $t('familiers.page.queue.copy') }}</UiButton>
          <input
            ref="queuePriceInput"
            type="number"
            min="0"
            step="1"
            :class="[inputClass, 'tabular w-32']"
            :placeholder="$t('familiers.page.queue.pricePlaceholder')"
            @keydown.enter.prevent="saveQueuePriceAndNext"
          >
          <UiButton variant="primary" size="sm" @click="saveQueuePriceAndNext">{{ $t('familiers.page.queue.saveNext') }}</UiButton>
          <UiButton variant="ghost" size="sm" @click="skipQueueItem">{{ $t('familiers.page.queue.skip') }}</UiButton>
        </div>
      </div>
      <p v-else class="text-sm text-subtle">{{ $t('familiers.page.queue.empty') }}</p>
    </UiCard>

    <!-- ── Recommendations ──────────────────────────────────────────────── -->
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <UiCard v-for="panel in recommendationPanels" :key="panel.id" :title="$t(panel.title)">
        <div v-if="panel.items.length" class="flex flex-col">
          <div
            v-for="item in panel.items"
            :key="`${panel.id}-${item.name}`"
            class="flex items-baseline justify-between gap-3 border-b border-line py-1.5 text-sm last:border-0"
          >
            <span class="min-w-0 truncate text-muted">{{ item.name }}</span>
            <span class="tabular shrink-0 text-ink">{{ recommendationValue(panel.id, item) }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-subtle">{{ $t('familiers.page.empty.recommendations') }}</p>
      </UiCard>
    </div>

    <!-- ── Items table ──────────────────────────────────────────────────── -->
    <UiPageSection :title="currentSectionTitle">
      <template #actions>
        <span class="tabular text-xs text-subtle">
          {{ visibleTableItems.length }} / {{ filteredItems.length }} {{ $t('familiers.page.count.items') }}
        </span>
      </template>

      <UiToolbar>
        <template #search>
          <UiInput v-model="search" type="search" :placeholder="$t('familiers.page.search.placeholder')">
            <template #prefix><UiIcon name="search" /></template>
          </UiInput>
        </template>
        <template #filters>
          <UiSegmented v-model="activeView" :options="viewSegments" size="sm" :aria-label="$t('familiers.page.sort.label')" />
          <UiSelect
            v-if="activeView === 'zones'"
            v-model="selectedZone"
            :options="zoneOptions"
            size="sm"
            class="w-44"
            :aria-label="$t('familiers.page.filters.allZones')"
          />
          <UiSelect
            v-model="pricedFilter"
            :options="pricedOptions"
            size="sm"
            class="w-40"
            :aria-label="$t('familiers.page.filters.allPrices')"
          />
        </template>
        <template #extra>
          <!-- Numeric bounds are secondary: they live on their own row so the
               primary filters above stay readable on medium screens. -->
          <UiNumberInput v-model="filters.minXp" :min="0" size="sm" class="w-28" :placeholder="$t('familiers.page.filters.minXp')" />
          <UiNumberInput v-model="filters.maxXp" :min="0" size="sm" class="w-28" :placeholder="$t('familiers.page.filters.maxXp')" />
          <UiNumberInput v-model="filters.maxQty" :min="0" size="sm" class="w-28" :placeholder="$t('familiers.page.filters.maxQty')" />
          <UiNumberInput v-model="filters.maxUnitPrice" :min="0" size="sm" class="w-32" :placeholder="$t('familiers.page.filters.maxUnitPrice')" />
          <UiNumberInput v-model="filters.maxTotalCost" :min="0" size="sm" class="w-32" :placeholder="$t('familiers.page.filters.maxTotalCost')" />
          <UiNumberInput
            v-if="activeView === 'essences'"
            v-model="filters.maxDungeonLevel"
            :min="0"
            size="sm"
            class="w-32"
            :placeholder="$t('familiers.page.filters.maxDungeonLevel')"
          />
        </template>
      </UiToolbar>

      <UiTable
        :columns="tableColumns"
        :sort-key="sortBy"
        :sort-desc="sortDesc"
        :empty="!filteredItems.length"
        :empty-text="$t('familiers.page.empty.items')"
        @sort="toggleSort"
      >
        <tr v-for="item in visibleTableItems" :key="item.key" class="border-t border-line hover:bg-sunken">
          <td class="px-3 py-2 text-sm text-ink">{{ item.name }}</td>
          <td class="px-3 py-2 text-sm text-subtle">{{ item.groupName }}</td>
          <td class="tabular px-3 py-2 text-right text-sm text-muted">{{ fmtDecimal(item.xp) }}</td>
          <td class="tabular px-3 py-2 text-right text-sm text-muted">{{ fmtQty(qtyToBuy(item.xp)) }}</td>
          <td class="tabular px-3 py-2 text-right text-sm text-accent">{{ fmt(maxPrice(item.xp)) }} k</td>
          <td class="px-3 py-2 text-right">
            <input
              :value="draftManualPrices[item.name] ?? manualPrices[item.name] ?? ''"
              type="number"
              min="0"
              step="1"
              :class="[inputClass, 'tabular h-8 w-24 text-right text-xs']"
              @input="setDraftManualPrice(item.name, ($event.target as HTMLInputElement).value)"
              @change="commitDraftManualPrice(item.name)"
              @keydown.enter.prevent="commitDraftManualPrice(item.name)"
            >
            <p v-if="manualPrices[item.name] == null && importedResourcePrice(item.name) != null" class="tabular mt-0.5 text-xs text-subtle">
              {{ fmt(importedResourcePrice(item.name) || 0) }} k {{ $t('familiers.page.table.fromResources') }}
            </p>
          </td>
          <td class="tabular px-3 py-2 text-right text-sm text-ink">{{ levelCostLabel(item) }}</td>
          <td class="tabular px-3 py-2 text-right text-sm text-muted">{{ xpPerKamaLabel(item) }}</td>
        </tr>
        <tr v-if="filteredItems.length > visibleTableItems.length">
          <td colspan="8" class="px-3 py-3 text-center text-xs text-subtle">
            {{ $t('familiers.page.table.limited', { shown: visibleTableItems.length, total: filteredItems.length }) }}
          </td>
        </tr>
      </UiTable>
    </UiPageSection>

    <!-- ── Guide ────────────────────────────────────────────────────────── -->
    <UiModal :open="guideOpen" :title="$t('familiers.guide.title')" size="lg" @close="guideOpen = false">
      <p class="text-sm text-muted">
        {{ pricingMode === 'reference' ? $t('familiers.guide.referenceIntro') : $t('familiers.guide.manualIntro') }}
      </p>
      <p class="mt-2 text-sm">
        <span class="text-subtle">{{ $t('familiers.guide.activeModeLabel') }}</span>
        <span class="ml-1.5 font-medium text-accent">
          {{ pricingMode === 'reference' ? $t('familiers.guide.referenceModeName') : $t('familiers.guide.manualModeName') }}
        </span>
      </p>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p class="mb-1.5 text-xs font-medium tracking-wide text-subtle uppercase">
            {{ $t('familiers.guide.cards.columns.title') }}
          </p>
          <dl class="flex flex-col gap-1 text-sm text-muted">
            <div><span class="text-ink">{{ $t('familiers.guide.cards.columns.xpLabel') }}</span> = {{ $t('familiers.guide.cards.columns.xpText') }}</div>
            <div><span class="text-ink">{{ $t('familiers.guide.cards.columns.qtyLabel') }}</span> = {{ $t('familiers.guide.cards.columns.qtyText') }}</div>
            <div>
              <span class="text-ink">{{ pricingMode === 'reference' ? $t('familiers.guide.cards.columns.referencePriceLabel') : $t('familiers.guide.cards.columns.manualPriceLabel') }}</span>
              = {{ pricingMode === 'reference' ? $t('familiers.guide.cards.columns.referencePriceText') : $t('familiers.guide.cards.columns.manualPriceText') }}
            </div>
            <div>
              <span class="text-ink">{{ pricingMode === 'reference' ? $t('familiers.guide.cards.columns.referenceTotalLabel') : $t('familiers.guide.cards.columns.manualTotalLabel') }}</span>
              = {{ $t('familiers.guide.cards.columns.totalText') }}
            </div>
          </dl>
        </div>
        <div>
          <p class="mb-1.5 text-xs font-medium tracking-wide text-subtle uppercase">
            {{ $t('familiers.guide.cards.example.title') }}
          </p>
          <div class="flex flex-col gap-1 text-sm text-muted">
            <p>{{ $t('familiers.guide.cards.example.line1') }}</p>
            <p>{{ $t('familiers.guide.cards.example.line2') }}</p>
          </div>
        </div>
      </div>
    </UiModal>
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
const sortDesc = computed(() => sortDir.value === 'desc')

// Shared styling for the handful of inputs that keep a template ref, so they
// can't be swapped for UiInput without rewriting the logic that reads them.
const inputClass = 'h-9 rounded-md border border-line bg-sunken px-2.5 text-sm text-ink transition-colors hover:border-line-strong focus:border-accent focus:outline-none'

const modeOptions = computed(() => [
  { label: t('familiers.page.mode.reference'), value: 'reference' },
  { label: t('familiers.page.mode.manual'), value: 'manual' },
])

const viewSegments = computed(() =>
  viewOptions.map(view => ({ label: t(view.label), value: view.id })),
)

const zoneOptions = computed(() => [
  { key: 'all', label: t('familiers.page.filters.allZones'), value: '' },
  ...zones.map(zone => ({ key: zone.id, label: zone.name, value: zone.id })),
])

const pricedOptions = computed(() => [
  { key: 'all', label: t('familiers.page.filters.allPrices'), value: 'all' },
  { key: 'priced', label: t('familiers.page.filters.priced'), value: 'priced' },
  { key: 'unpriced', label: t('familiers.page.filters.unpriced'), value: 'unpriced' },
])

// Column keys double as sort keys, so the header click maps straight onto
// toggleSort without a lookup table.
const tableColumns = computed(() => [
  { key: 'name', label: t('familiers.page.table.item'), sortable: true },
  { key: 'group', label: t('familiers.page.table.group') },
  { key: 'xp', label: t('familiers.page.table.xpPerUnit'), align: 'right' as const, sortable: true },
  { key: 'qty', label: t('familiers.page.table.qtyNeeded'), align: 'right' as const, sortable: true },
  { key: 'targetPrice', label: t('familiers.page.table.targetPricePerUnit'), align: 'right' as const, sortable: true },
  { key: 'manualPrice', label: t('familiers.page.table.manualPricePerUnit'), align: 'right' as const, sortable: true },
  { key: 'totalCost', label: t('familiers.page.table.totalTargetLevel', { level: targetLevel.value }), align: 'right' as const, sortable: true },
  { key: 'xpPerKama', label: t('familiers.page.table.xpPerKama'), align: 'right' as const, sortable: true },
])

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
