<template>
  <div class="flex flex-col gap-5">
    <ItemsFilterBar
      v-model:collapsed="filtersCollapsed"
      :filters="filters"
      @set="setFilter"
      @open-guide="openGuide('main')"
    />

    <!-- ── How this page is meant to be used ────────────────────────────── -->
    <UiCard :title="$t('items.pricesWorkflow.title')" :subtitle="$t('items.pricesWorkflow.eyebrow')">
      <p class="text-sm text-muted">{{ $t('items.pricesWorkflow.intro') }}</p>
      <ol class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <li
          v-for="(step, index) in workflowSteps"
          :key="step"
          class="rounded-md border border-line bg-sunken p-2.5"
        >
          <div class="flex items-baseline gap-2">
            <span class="tabular text-xs text-subtle">{{ index + 1 }}</span>
            <span class="text-sm font-medium text-ink">{{ $t(`items.pricesWorkflow.steps.${step}`) }}</span>
          </div>
          <p class="mt-0.5 text-xs text-subtle">{{ $t(`items.pricesWorkflow.steps.${step}Hint`) }}</p>
        </li>
      </ol>
    </UiCard>

    <p class="text-xs text-subtle">{{ $t('items.usageHint') }}</p>

    <ItemsGuideModal :open="guideOpen" :mode="guideMode" @close="guideOpen = false" />

    <ItemsCraftingPicker
      :open="craftingPickerState.isOpen"
      :item="craftingPickerState.item"
      :saving="craftingPickerState.isSaving"
      :error="craftingPickerState.error"
      :has-context="canUseCraftingSessions"
      :sessions="craftingSessionsPreview"
      :session-title="getCraftingSessionTitle"
      :session-meta="getCraftingSessionMeta"
      @close="closeCraftingPicker"
      @create="createCraftingSessionFromPicker"
      @add="addItemToExistingCraftingSession"
    />

    <!-- Utility classes, not a named transition: no `fade` CSS exists, and
         these are what prefers-reduced-motion neutralises app-wide. -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="craftingToast.message"
        class="fixed right-4 bottom-4 z-50 rounded-md border px-3 py-2 text-sm shadow-md"
        :class="craftingToast.tone === 'error'
          ? 'border-negative/40 bg-negative/10 text-negative'
          : 'border-positive/40 bg-positive/10 text-positive'"
        role="status"
      >
        {{ craftingToast.message }}
      </div>
    </Transition>

    <!-- ── Data slice ───────────────────────────────────────────────────── -->
    <template v-if="stats">
      <UiStatRow min="10rem">
        <UiStat :label="$t('items.stats.totalEquipment')" :value="stats.totalEquipments" />
        <UiStat :label="$t('items.stats.uniqueItems')" :value="stats.uniqueItems" />
        <UiStat :label="$t('items.stats.mostVariedSlot')" :value="stats.mostPopularSlot?.slot ?? '—'" />
        <UiStat :label="$t('items.stats.avgItemsPerSet')" :value="stats.avgItemsPerSet.toFixed(1)" />
      </UiStatRow>

      <div>
        <p class="text-xs font-medium tracking-wide text-subtle uppercase">{{ $t('items.contextTitle') }}</p>
        <p class="mt-0.5 text-sm text-muted">{{ itemsDataContextSubtitle }}</p>
      </div>
    </template>

    <div v-if="loading" class="flex flex-col gap-2">
      <UiSkeleton v-for="i in 6" :key="i" height="4rem" />
    </div>

    <template v-else-if="stats">
      <!-- Slot tabs -->
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="slot in SLOT_GROUPS"
          :key="slot.key"
          type="button"
          :class="[
            'inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-xs transition-colors',
            activeSlot === slot.key
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-line bg-raised text-muted hover:border-line-strong hover:text-ink',
          ]"
          @click="activeSlot = slot.key"
        >
          <span aria-hidden="true">{{ slot.icon }}</span>
          <span>{{ $t(`items.slots.${slot.key}`) }}</span>
          <span class="tabular text-subtle">{{ getSlotStats(slot.key)?.totalItems ?? 0 }}</span>
        </button>
      </div>

      <!-- Slot content -->
      <div v-if="currentSlotStats">
        <div v-if="!selectedRecipeItem && !aggregateRecipeState.isOpen" class="mb-3">
          <h2 class="text-sm font-semibold text-ink">{{ $t(`items.slots.${activeSlot}`) }}</h2>
          <p class="mt-0.5 text-xs text-subtle">{{ activeSlotContextSubtitle }}</p>
        </div>
        <div v-if="selectedRecipeItem" class="flex flex-col gap-4">
          <ItemsRecipeHeader
            :item="selectedRecipeItem"
            :slot-label="$t(`items.slots.${activeSlot}`)"
            :confidence="recipeLookupState.confidence"
            :source="recipeLookupState.source"
            :ocr="ocrState"
            :saved-price-count="selectedItemObservations.length"
            :format-kamas="formatKamasFull"
            @back="resetRecipeView"
            @open-guide="openGuide('recipe')"
            @refetch="refetchSelectedRecipe"
            @open-ocr-picker="openOcrPicker"
            @paste-screenshot="pasteMarketScreenshot"
            @save-ocr-prices="saveOcrSnapshotPrices"
            @use-candidate="selectedRecipeSellPrice = $event"
            @focus-best-buys="focusObservedBestBuys"
          />

          <div v-if="recipeLookupState.isLoading" class="flex flex-col gap-2">
            <UiSkeleton v-for="i in 4" :key="i" height="3rem" />
          </div>

          <p v-else-if="recipeLookupState.error" class="text-xs text-negative">
            {{ $t('items.detail.flipFlow.loadError') }}
          </p>

          <template v-else>
            <ItemsObservationDetail
              v-if="selectedObservationDetail"
              ref="observationDetailComp"
              v-model:detail-tab="observationDetailTab"
              :observation="selectedObservationDetail"
              :stats-health="selectedObservationStatsHealth"
              :stat-options="observationStatOptions"
              :explanation="selectedObservationValuationExplanation"
              :stats-ocr="statsOcrState"
              :is-tracked="resaleTrackedObservationIds.has(selectedObservationDetail.id)"
              :can-track="canUseCraftingSessions"
              :feedback="resaleTrackerFeedback[selectedObservationDetail.id] ?? ''"
              :format-kamas="formatKamasFull"
              @back="closeObservationDetail"
              @use-as-sell-price="selectedRecipeSellPrice = $event"
              @clear-market-screenshot="clearObservationScreenshots(selectedObservationDetail.id, { market: true })"
              @clear-stats-screenshot="clearObservationScreenshots(selectedObservationDetail.id, { stats: true })"
              @upload-stats-screenshot="openStatsScreenshotPicker(selectedObservationDetail.id)"
              @paste-stats-screenshot="pasteStatsScreenshot(selectedObservationDetail.id)"
              @send-to-tracker="sendObservationToResaleTracker(selectedObservationDetail)"
              @add-expected-stat="addExpectedObservationStat"
              @add-stat-entry="addObservationStatEntry"
              @update-stat-key="updateObservationStatKey"
              @update-stat-value="updateObservationStatValue"
              @remove-stat-entry="removeObservationStatEntry"
            />

            <ItemsObservedPrices
              v-else-if="selectedItemObservations.length"
              ref="observedPricesComp"
              v-model:expanded="showObservedPrices"
              v-model:sort-mode="observedSortMode"
              v-model:valuation-mode="valuationMode"
              v-model:only-undervalued="showOnlyUndervaluedListings"
              v-model:show-table="showAdvancedValuationTable"
              :observations="selectedItemObservations"
              :screenshot-summary="selectedItemScreenshotSummary"
              :valuation-map="allObservedValuationMap"
              :valuations="allObservedValuations"
              :displayed-valuations="displayedObservedValuations"
              :best-buy="bestBuyObservation"
              :badges-for="getObservationBadges"
              :freshness-for="formatPriceFreshness"
              :tracked-ids="resaleTrackedObservationIds"
              :can-track="canUseCraftingSessions"
              :valuation-confidence="valuationConfidence"
              :valuation-mode-summary="valuationModeSummary"
              :format-kamas="formatKamasFull"
              @use-as-sell-price="selectedRecipeSellPrice = $event"
              @open-detail="openObservationDetail"
              @upload-stats-screenshot="openStatsScreenshotPicker"
              @clear-screenshots="clearObservationScreenshots($event, { market: true, stats: true })"
              @send-to-tracker="sendObservationToResaleTracker"
              @remove="removeObservation"
              @clear-all-screenshots="clearAllObservationScreenshots"
              @remove-all="removeAllObservations"
            />
          </template>
        </div>

        <ItemsAggregateRecipe
          v-else-if="aggregateRecipeState.isOpen"
          v-model:sort-mode="aggregateSortMode"
          :slot-label="$t(`items.slots.${activeSlot}`)"
          :limit="aggregateRecipeState.limit"
          :limits="aggregateLimits"
          :is-loading="aggregateRecipeState.isLoading"
          :error="aggregateRecipeState.error"
          :selected-items="aggregateRecipeState.selectedItems"
          :ingredients="aggregateIngredients"
          :filters="aggregateResourceFilters"
          @back="resetAggregateRecipeView"
          @update:limit="openAggregateRecipeView"
          @toggle-filter="toggleAggregateFilter"
          @open-item="openRecipeView"
        />
        <ItemsResultsView
          v-else
          v-model:view-mode="viewMode"
          :items="currentSlotStats.topItems"
          :slot-label="$t(`items.slots.${activeSlot}`)"
          :can-add-to-session="canUseCraftingSessions"
          :pct="pct"
          :bar-width="barW"
          @open="openRecipeView"
          @add-to-session="openCraftingPicker"
          @open-pressure="openAggregateRecipeView(aggregateRecipeState.limit)"
        />
      </div>

      <UiEmptyState v-else :title="$t('items.noSlotData')">
        <template #icon><UiIcon name="items" /></template>
      </UiEmptyState>
    </template>

    <UiEmptyState v-else-if="!loading" :title="$t('items.noEquipmentData')">
      <template #icon><UiIcon name="items" /></template>
    </UiEmptyState>

    <!-- The pickers are driven from several places in the detail panel, so the
         inputs themselves stay here where the click handlers can reach them. -->
    <input ref="ocrFileInput" type="file" accept="image/*" class="hidden" @change="handleOcrFileChange">
    <input ref="statsScreenshotInput" type="file" accept="image/*" class="hidden" @change="handleStatsScreenshotChange">
  </div>
</template>

<script setup lang="ts">
import { useResaleTracker } from '~/composables/useResaleTracker'

const { t } = useI18n()
const { appendActivity } = useAppDataStore()
const { selectedServer, selectedCharacter } = useV2Context()
const { entries: resaleTrackerEntries, createEntry: createResaleTrackerEntry } = useResaleTracker()
const route = useRoute()
const router = useRouter()

const SLOT_GROUPS = [
  { key: 'ar', icon: '⚔️' },
  { key: 'ch', icon: '🎩' },
  { key: 'ca', icon: '🦸' },
  { key: 'am', icon: '📿' },
  { key: 'br', icon: '🛡️' },
  { key: 'ce', icon: '👑' },
  { key: 'bo', icon: '👢' },
  { key: 'ring', icon: '💍' },
  { key: 'fa', icon: '🐾' },
  { key: 'dofus', icon: '🥚' },
]

const SLOT_GROUP_MEMBERS: Record<string, string[]> = {
  ar: ['ar'],
  ch: ['ch'],
  ca: ['ca'],
  am: ['am'],
  br: ['br'],
  ce: ['ce'],
  bo: ['bo'],
  ring: ['a1', 'a2'],
  fa: ['fa'],
  dofus: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'],
}

const SLOT_KEY_TO_GROUP = Object.fromEntries(
  Object.entries(SLOT_GROUP_MEMBERS).flatMap(([groupKey, members]) =>
    members.map(member => [member, groupKey] as const),
  ),
)

const filters = reactive({ element: '', mode: '', classe: '', level: '', budget: '' })
const filtersCollapsed = ref(false)
// ItemsFilterBar owns the toggle; persistence stays here so the preference
// survives a reload the same way it did before the split.
watch(filtersCollapsed, value => localStorage.setItem('items-filters-collapsed', String(value)))

const guideOpen = ref(false)
const guideMode = ref<'main' | 'recipe'>('main')
const loading = ref(false)
const activeSlot = ref('ar')
const viewMode = ref<'grid' | 'list' | 'table'>('grid')
const stats = ref<any>(null)
const selectedRecipeItem = ref<any>(null)
const selectedRecipeSellPrice = ref(0)
const ocrFileInput = ref<HTMLInputElement | null>(null)
const statsScreenshotInput = ref<HTMLInputElement | null>(null)
const pendingStatsObservationId = ref('')
type RecipeLookupSource = 'cache' | 'network' | ''
type RecipeMatchConfidence = 'exact' | 'approx' | ''
type CachedDofusdbRecipeEntry = {
  normalizedName: string
  dofusdbId: number
  matchedName: string
  confidence: Exclude<RecipeMatchConfidence, ''>
  recipe: any
  updatedAt: string
}
type CachedEffectEntry = {
  id: number
  data: any
}
type StoredResourcePriceEntry = {
  resourceId: number
  name: string
  price: number
  updatedAt: string
}
type StoredObservedPriceEntry = {
  id: string
  itemKey: string
  itemName: string
  price: number
  createdAt: string
  source: 'ocr'
  marketScreenshotDataUrl: string
  statsScreenshotDataUrl?: string
  statsRawText?: string
  statsEntries: Array<{
    key: string
    label: string
    value: number | null
    suffix: string
    rangeText: string
    raw?: string
    isManual?: boolean
  }>
}

type WorkflowMode = 'craft' | 'fm' | 'craft_fm'
type SessionFocus = 'clean' | 'perfect' | 'over' | 'exo' | 'mixed'
type AcquisitionMode = 'crafted' | 'bought' | 'mixed'
type TargetMode = 'clean' | 'perfect' | 'over' | 'exo'
type OutcomeMode = 'in_progress' | 'listed' | 'sold' | 'kept' | 'brisaged' | 'failed'
type AttemptTag = 'setup' | 'upgrade' | 'stabilized' | 'exo_hit' | 'brick' | 'stop'
type TargetPriority = 'ignore' | 'low' | 'normal' | 'high' | 'critical'

interface DraftTargetStat {
  id: string
  effectId: number
  label: string
  min: number
  max: number
  baseValue: number
  targetValue: number
  priority: TargetPriority
}

interface DraftAttempt {
  id: string
  date: string
  runeCost: number
  estimatedValue: number
  tag: AttemptTag
  statsNote: string
  notes: string
}

interface DraftCraftFmItem {
  id: string
  itemId: string | number
  item: any
  acquisitionMode: AcquisitionMode
  craftKamasBefore: number
  craftKamasAfter: number
  extraExpenses: number
  runeValueBeforeFm: number
  runePurchases: number
  runeValueAfterFm: number
  targetMode: TargetMode
  targetSummary: string
  stopRule: string
  expectedSalePrice: number
  listedPrice: number
  realizedSalePrice: number
  brisageRecovery: number
  outcome: OutcomeMode
  notes: string
  targetStats: DraftTargetStat[]
  attempts: DraftAttempt[]
}

interface RecipeChecklistResource {
  id: number
  name: string
  image: string | null
  typeName: string | null
  totalQuantity: number
  hasRecipe: boolean
  isDone: boolean
}

interface CraftFmSession {
  id: string
  date: string
  workflow: WorkflowMode
  focus: SessionFocus
  startingKamas: number
  currentKamas: number
  startingRuneStockValue: number
  currentRuneStockValue: number
  sessionExpenses: number
  notes: string
  items: DraftCraftFmItem[]
  resourceChecklist: RecipeChecklistResource[]
}

type OcrWord = {
  text?: string
  confidence?: number
  bbox?: {
    x0: number
    y0: number
    x1: number
    y1: number
  }
}

const DOFUSDB_RECIPE_CACHE_KEY = 'dofus-items-dofusdb-recipe-cache-v1'
const ITEM_RESOURCE_PRICES_KEY = 'dofus-items-resource-prices-v1'
const ITEM_OBSERVED_PRICES_KEY = 'dofus-items-observed-prices-v1'
const DOFUS_EFFECT_CACHE_KEY = 'dofus-items-effect-cache-v1'
const ITEM_STAT_PRIORITY_KEY = 'dofus-items-stat-priority-v1'
const CRAFT_FM_SESSIONS_KEY_PREFIX = 'craft_fm_sessions_'

const recipeLookupState = ref<{
  isLoading: boolean
  error: string
  data: any | null
  source: RecipeLookupSource
  confidence: RecipeMatchConfidence
}>({
  isLoading: false,
  error: '',
  data: null,
  source: '',
  confidence: '',
})
const resourcePrices = ref<Record<string, StoredResourcePriceEntry>>({})
const observedPrices = ref<Record<string, StoredObservedPriceEntry[]>>({})
const selectedObservationId = ref('')
const showPriceManager = ref(false)
const showAdvancedCraftDetails = ref(false)
const showAdvancedValuationTable = ref(false)
const showValuationFocus = ref(false)
const showObservedPrices = ref(true)
const showIngredients = ref(false)
const ocrState = ref<{
  isLoading: boolean
  error: string
  candidates: number[]
  rawText: string
  debugMode: string
  screenshotDataUrl: string
  debugRows: Array<{
    source: string
    raw: string
    tokens: string[]
    candidate: number | null
  }>
}>({
  isLoading: false,
  error: '',
  candidates: [],
  rawText: '',
  debugMode: '',
  screenshotDataUrl: '',
  debugRows: [],
})
const aggregateLimits = [3, 5, 10, 20]
const aggregateSortMode = ref<'items' | 'quantity'>('items')
const aggregateResourceFilters = reactive({
  hideSpecial: false,
  onlyMonsterDrops: false,
  onlyNonCrafted: false,
  minItemUsage: 1,
})

/** All four resource filters are chips; minItemUsage toggles 1 <-> 2 rather
 *  than false <-> true, which is why they can't be a plain v-model. */
const toggleAggregateFilter = (key: keyof typeof aggregateResourceFilters) => {
  if (key === 'minItemUsage') {
    aggregateResourceFilters.minItemUsage = aggregateResourceFilters.minItemUsage === 2 ? 1 : 2
    return
  }
  aggregateResourceFilters[key] = !aggregateResourceFilters[key]
}

const aggregateRecipeState = ref<{
  isOpen: boolean
  isLoading: boolean
  error: string
  data: any[]
  limit: number
  selectedItems: Array<{ name: string; image_url?: string | null; count: number }>
}>({
  isOpen: false,
  isLoading: false,
  error: '',
  data: [],
  limit: 5,
  selectedItems: [],
})
const statsOcrState = ref({
  isLoading: false,
  error: '',
})
const observationDetailTab = ref<'stats' | 'explain'>('stats')
// The two scroll targets now live inside child components, which expose the
// element they own so the page can still bring them into view.
const observedPricesComp = ref<{ sectionEl: HTMLElement | null } | null>(null)
const observationDetailComp = ref<{ exactStatsEl: HTMLElement | null } | null>(null)
const resaleTrackerFeedback = ref<Record<string, string>>({})
const observedSortMode = ref<'newest' | 'price_asc' | 'price_desc' | 'delta' | 'best_buy'>('newest')
const showOnlyUndervaluedListings = ref(false)
type ValuationMode = 'score' | 'comparables' | 'auto'
const valuationMode = ref<ValuationMode>('auto')
const effectCache = ref<Record<string, CachedEffectEntry>>({})
const itemStatPriorities = ref<Record<string, Record<string, number>>>({})
const craftingSessionsPreview = ref<CraftFmSession[]>([])
const craftingPickerState = ref<{
  isOpen: boolean
  isSaving: boolean
  item: { name: string; image_url?: string | null; count: number; rawItem?: any } | null
  error: string
}>({
  isOpen: false,
  isSaving: false,
  item: null,
  error: '',
})
const craftingToast = ref<{ message: string; tone: 'success' | 'error' }>({
  message: '',
  tone: 'success',
})
let craftingToastTimer: ReturnType<typeof setTimeout> | null = null
const observationStatOptions = [
  { key: 'vitalite', label: 'Vitalité', suffix: '' },
  { key: 'force', label: 'Force', suffix: '' },
  { key: 'intelligence', label: 'Intelligence', suffix: '' },
  { key: 'chance', label: 'Chance', suffix: '' },
  { key: 'agilite', label: 'Agilité', suffix: '' },
  { key: 'sagesse', label: 'Sagesse', suffix: '' },
  { key: 'initiative', label: 'Initiative', suffix: '' },
  { key: 'critique', label: 'Critique', suffix: '%' },
  { key: 'dommages_critiques', label: 'Dommages Critiques', suffix: '' },
  { key: 'resistance_critique', label: 'Résistance Critique', suffix: '' },
  { key: 'pa', label: 'PA', suffix: '' },
  { key: 'pm', label: 'PM', suffix: '' },
  { key: 'po', label: 'PO', suffix: '' },
  { key: 'invocation', label: 'Invocation', suffix: '' },
  { key: 'dommages_neutre', label: 'Dommages Neutre', suffix: '' },
  { key: 'dommages_terre', label: 'Dommages Terre', suffix: '' },
  { key: 'dommages_feu', label: 'Dommages Feu', suffix: '' },
  { key: 'dommages_eau', label: 'Dommages Eau', suffix: '' },
  { key: 'dommages_air', label: 'Dommages Air', suffix: '' },
  { key: 'prospection', label: 'Prospection', suffix: '' },
  { key: 'resistance_air', label: 'Résistance Air', suffix: '%' },
  { key: 'resistance_terre', label: 'Résistance Terre', suffix: '%' },
  { key: 'resistance_feu', label: 'Résistance Feu', suffix: '%' },
  { key: 'resistance_eau', label: 'Résistance Eau', suffix: '%' },
  { key: 'resistance_neutre', label: 'Résistance Neutre', suffix: '%' },
  { key: 'fuite', label: 'Fuite', suffix: '' },
  { key: 'tacle', label: 'Tacle', suffix: '' },
  { key: 'dommages_poussee', label: 'Dommages Poussée', suffix: '' },
  { key: 'retrait_pa', label: 'Retrait PA', suffix: '' },
  { key: 'retrait_pm', label: 'Retrait PM', suffix: '' },
  { key: 'esquive_pa', label: 'Esquive PA', suffix: '' },
  { key: 'esquive_pm', label: 'Esquive PM', suffix: '' },
  { key: 'dommages_distance', label: 'Dommages Distance', suffix: '%' },
  { key: 'dommages_melee', label: 'Dommages Melee', suffix: '%' },
  { key: 'dommages_sort', label: 'Dommages Sort', suffix: '%' },
  { key: 'arme_de_chasse', label: 'Arme de Chasse', suffix: '' },
]
const statsOcrDefs = [
  { key: 'vitalite', label: 'Vitalité', aliases: ['vitalite'] },
  { key: 'force', label: 'Force', aliases: ['force'] },
  { key: 'intelligence', label: 'Intelligence', aliases: ['intelligence'] },
  { key: 'chance', label: 'Chance', aliases: ['chance'] },
  { key: 'agilite', label: 'Agilité', aliases: ['agilite'] },
  { key: 'sagesse', label: 'Sagesse', aliases: ['sagesse'] },
  { key: 'initiative', label: 'Initiative', aliases: ['initiative', 'ini'] },
  { key: 'retrait_pa', label: 'Retrait PA', aliases: ['retrait pa'] },
  { key: 'retrait_pm', label: 'Retrait PM', aliases: ['retrait pm'] },
  { key: 'esquive_pa', label: 'Esquive PA', aliases: ['esquive pa'] },
  { key: 'esquive_pm', label: 'Esquive PM', aliases: ['esquive pm'] },
  { key: 'critique', label: 'Critique', aliases: ['critique'], suffix: '%' as const },
  { key: 'dommages_critiques', label: 'Dommages Critiques', aliases: ['dommages critiques', 'dommage critique', 'do crit', 'do cri'] },
  { key: 'resistance_critique', label: 'Résistance Critique', aliases: ['resistance critique', 'résistance critique', 'resistances critiques', 'résistances critiques'] },
  { key: 'pa', label: 'PA', aliases: [' pa ', 'pa [', 'pa'] },
  { key: 'pm', label: 'PM', aliases: [' pm ', 'pm [', 'pm'] },
  { key: 'po', label: 'PO', aliases: [' po ', 'portee', 'portée', 'po ['] },
  { key: 'invocation', label: 'Invocation', aliases: ['invocation'] },
  { key: 'dommages_neutre', label: 'Dommages Neutre', aliases: ['dommages neutre'] },
  { key: 'dommages_terre', label: 'Dommages Terre', aliases: ['dommages terre'] },
  { key: 'dommages_feu', label: 'Dommages Feu', aliases: ['dommages feu'] },
  { key: 'dommages_eau', label: 'Dommages Eau', aliases: ['dommages eau'] },
  { key: 'dommages_air', label: 'Dommages Air', aliases: ['dommages air'] },
  { key: 'prospection', label: 'Prospection', aliases: ['prospection'] },
  { key: 'resistance_air', label: 'Résistance Air', aliases: ['resistance air', 'résistance air'], suffix: '%' as const },
  { key: 'resistance_terre', label: 'Résistance Terre', aliases: ['resistance terre', 'résistance terre'], suffix: '%' as const },
  { key: 'resistance_feu', label: 'Résistance Feu', aliases: ['resistance feu', 'résistance feu'], suffix: '%' as const },
  { key: 'resistance_eau', label: 'Résistance Eau', aliases: ['resistance eau', 'résistance eau'], suffix: '%' as const },
  { key: 'resistance_neutre', label: 'Résistance Neutre', aliases: ['resistance neutre', 'résistance neutre'], suffix: '%' as const },
  { key: 'fuite', label: 'Fuite', aliases: ['fuite'] },
  { key: 'tacle', label: 'Tacle', aliases: ['tacle'] },
  { key: 'dommages_poussee', label: 'Dommages Poussée', aliases: ['dommages poussee', 'dommage poussee', 'dommages poussée', 'dommage poussée', 'do pou', 'dopou'] },
  { key: 'dommages_distance', label: 'Dommages Distance', aliases: ['dommages distance', 'dommages distances', 'dommages a distance', 'dommages à distance', 'do distance', 'do distances', 'do a distance', 'do à distance'], suffix: '%' as const },
  { key: 'dommages_melee', label: 'Dommages Melee', aliases: ['dommages melee', 'dommages mêlee', 'dommages mêlée', 'dommages au corps a corps', 'dommages au corps à corps', 'corps a corps', 'corps à corps', 'do melee', 'do mêlee', 'do mêlée'], suffix: '%' as const },
  { key: 'dommages_sort', label: 'Dommages Sort', aliases: ['dommages sort', 'dommages sorts', 'dommages au sort', 'dommages aux sorts', 'dommages sorts', 'do sort', 'do sorts'], suffix: '%' as const },
  { key: 'arme_de_chasse', label: 'Arme de Chasse', aliases: ['arme de chasse', 'arme chasse', 'chasse'], binary: true as const },
]
const statPriorityPresets = [
  { key: 'ignore', label: 'Ignore', multiplier: 0 },
  { key: 'low', label: 'Low', multiplier: 0.75 },
  { key: 'normal', label: 'Normal', multiplier: 1 },
  { key: 'high', label: 'High', multiplier: 1.5 },
  { key: 'critical', label: 'Critical', multiplier: 2 },
]
const observationStatWeightMap: Record<string, number> = {
  vitalite: 1,
  force: 1,
  intelligence: 1,
  chance: 1,
  agilite: 1,
  initiative: 0.4,
  critique: 1.5,
  dommages_critiques: 2.4,
  resistance_critique: 1.8,
  pa: 4,
  pm: 4,
  po: 3,
  invocation: 2,
  dommages_neutre: 1.4,
  dommages_terre: 1.4,
  dommages_feu: 1.4,
  dommages_eau: 1.4,
  dommages_air: 1.4,
  prospection: 0.8,
  resistance_air: 1.8,
  resistance_terre: 1.8,
  resistance_feu: 1.8,
  resistance_eau: 1.8,
  resistance_neutre: 1.8,
  fuite: 1.3,
  tacle: 1.3,
  dommages_poussee: 2.2,
  retrait_pa: 2.2,
  retrait_pm: 2.2,
  esquive_pa: 2.2,
  esquive_pm: 2.2,
  dommages_distance: 2.8,
  dommages_melee: 2.8,
  dommages_sort: 3,
  arme_de_chasse: 2.5,
}
const specialMageStatKeys = new Set([
  'pa',
  'pm',
  'po',
  'invocation',
  'dommages_critiques',
  'dommages_poussee',
  'dommages_distance',
  'dommages_melee',
  'dommages_sort',
  'arme_de_chasse',
])

const setFilter = (key: keyof typeof filters, val: string) => {
  filters[key] = val
  fetchData()
}

const getSlotStats = (slotKey: string) => stats.value?.slotStats?.[slotKey] ?? null

const currentSlotStats = computed(() => getSlotStats(activeSlot.value))

const titleCase = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value

const itemsDataContextSubtitle = computed(() => {
  const parts = [
    filters.mode ? filters.mode.toUpperCase() : t('items.detail.context.allModes'),
    filters.level ? t('items.detail.context.level', { level: filters.level }) : t('items.detail.context.allLevels'),
    filters.classe ? titleCase(filters.classe) : t('items.detail.context.allClasses'),
    filters.element ? titleCase(filters.element) : t('items.detail.context.allElements'),
    filters.budget ? t('items.detail.context.budget', { budget: titleCase(filters.budget) }) : t('items.detail.context.allBudgets'),
  ]

  const count = stats.value?.totalEquipments ?? 0
  return `${parts.join(' · ')} · ${t('items.detail.context.matchingBuilds', { count })}`
})

const activeSlotContextSubtitle = computed(() => {
  const slot = currentSlotStats.value
  if (!slot) return ''

  const topCount = slot.topItems?.[0]?.count ?? 0
  const totalItems = slot.totalItems ?? 0
  const slotName = t(`items.slots.${activeSlot.value}`)
  return t('items.detail.context.slotSummary', {
    count: totalItems,
    slot: slotName.toLowerCase(),
    topCount,
  })
})

const craftingSessionsKey = computed(() => {
  if (!selectedServer.value?.id || !selectedCharacter.value?.id) return ''
  return `${CRAFT_FM_SESSIONS_KEY_PREFIX}${selectedServer.value.id}_${selectedCharacter.value.id}`
})

const normalizeDofusdbSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’`]/g, "'")
    .toLowerCase()
    .trim()

const getRecipeMatchConfidence = (searchedName: string, matchedName: string): Exclude<RecipeMatchConfidence, ''> => {
  return normalizeDofusdbSearch(searchedName) === normalizeDofusdbSearch(matchedName)
    ? 'exact'
    : 'approx'
}

const readRecipeCache = (): Record<string, CachedDofusdbRecipeEntry> => {
  if (!import.meta.client) return {}

  try {
    const raw = localStorage.getItem(DOFUSDB_RECIPE_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeRecipeCache = (cache: Record<string, CachedDofusdbRecipeEntry>) => {
  if (!import.meta.client) return
  localStorage.setItem(DOFUSDB_RECIPE_CACHE_KEY, JSON.stringify(cache))
}

const readResourcePrices = (): Record<string, StoredResourcePriceEntry> => {
  if (!import.meta.client) return {}

  try {
    const raw = localStorage.getItem(ITEM_RESOURCE_PRICES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeResourcePrices = (prices: Record<string, StoredResourcePriceEntry>) => {
  if (!import.meta.client) return
  localStorage.setItem(ITEM_RESOURCE_PRICES_KEY, JSON.stringify(prices))
}

const readObservedPrices = (): Record<string, StoredObservedPriceEntry[]> => {
  if (!import.meta.client) return {}

  try {
    const raw = localStorage.getItem(ITEM_OBSERVED_PRICES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}

    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [
        key,
        Array.isArray(value)
          ? value.map((entry: any) => ({
              ...entry,
              statsEntries: Array.isArray(entry?.statsEntries)
                ? entry.statsEntries
                : Array.isArray(entry?.statsLines)
                  ? entry.statsLines.map((line: string) => ({
                      key: 'unknown',
                      label: line,
                      value: null,
                      suffix: '',
                      rangeText: '',
                      raw: line,
                    }))
                  : [],
              statsRawText: typeof entry?.statsRawText === 'string' ? entry.statsRawText : '',
              statsScreenshotDataUrl: entry?.statsScreenshotDataUrl || '',
              marketScreenshotDataUrl: entry?.marketScreenshotDataUrl || '',
            }))
          : [],
      ])
    )
  } catch {
    return {}
  }
}

const writeObservedPrices = (entries: Record<string, StoredObservedPriceEntry[]>) => {
  if (!import.meta.client) return
  localStorage.setItem(ITEM_OBSERVED_PRICES_KEY, JSON.stringify(entries))
}

const readEffectCache = (): Record<string, CachedEffectEntry> => {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(DOFUS_EFFECT_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeEffectCache = (entries: Record<string, CachedEffectEntry>) => {
  if (!import.meta.client) return
  localStorage.setItem(DOFUS_EFFECT_CACHE_KEY, JSON.stringify(entries))
}

const readItemStatPriorities = (): Record<string, Record<string, number>> => {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(ITEM_STAT_PRIORITY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeItemStatPriorities = (entries: Record<string, Record<string, number>>) => {
  if (!import.meta.client) return
  localStorage.setItem(ITEM_STAT_PRIORITY_KEY, JSON.stringify(entries))
}

const ensureEffectLabels = async (effects: Array<{ effectId?: number; id?: number }> | null | undefined) => {
  if (!Array.isArray(effects) || !effects.length) return

  const missingIds = [...new Set(
    effects
      .map((effect) => effect?.effectId ?? effect?.id)
      .filter((value): value is number => Number.isFinite(value) && !effectCache.value[String(value)]?.data)
  )]

  if (!missingIds.length) return

  const fetched = await Promise.all(
    missingIds.map(async (effectId) => {
      try {
        const data = await $fetch(`/api/dofusdb/effects/${effectId}`)
        return [String(effectId), { id: effectId, data }] as const
      } catch {
        return null
      }
    })
  )

  const nextEntries = fetched.filter(Boolean)
  if (!nextEntries.length) return

  const nextCache = {
    ...effectCache.value,
    ...Object.fromEntries(nextEntries),
  }

  effectCache.value = nextCache
  writeEffectCache(nextCache)
}

const formatEffectLabel = (effData: any, eff: any): string => {
  let desc = effData?.description?.fr ?? effData?.description?.en ?? `Effet ${eff.effectId ?? eff.id}`
  const from = eff.from ?? eff.value ?? 0
  const to = eff.to ?? eff.value ?? 0
  if (from === to) {
    desc = desc
      .replace(/\{[^}]*\}/g, '')
      .replace(/#1/g, String(from))
      .replace(/#2/g, '')
      .trim()
  } else {
    desc = desc
      .replace(/#1/g, String(from))
      .replace(/#2/g, String(to))
      .replace(/\{~1~2 ([^}]*)\}/g, '$1')
      .replace(/\{[^}]*\}/g, '')
      .trim()
  }
  return desc.replace(/\s{2,}/g, ' ').trim()
}

const readCraftingSessions = (): CraftFmSession[] => {
  if (!import.meta.client || !craftingSessionsKey.value) return []

  try {
    const raw = localStorage.getItem(craftingSessionsKey.value)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((session): session is CraftFmSession =>
      Boolean(session && typeof session === 'object' && session.id),
    )
  } catch {
    return []
  }
}

const writeCraftingSessions = (sessions: CraftFmSession[]) => {
  if (!import.meta.client || !craftingSessionsKey.value) return
  localStorage.setItem(craftingSessionsKey.value, JSON.stringify(sessions))
}

const refreshCraftingSessionsPreview = () => {
  craftingSessionsPreview.value = readCraftingSessions()
}

const showCraftingToast = (message: string, tone: 'success' | 'error' = 'success') => {
  craftingToast.value = { message, tone }
  if (craftingToastTimer) clearTimeout(craftingToastTimer)
  craftingToastTimer = setTimeout(() => {
    craftingToast.value = { message: '', tone: 'success' }
  }, 2600)
}

const getCraftingSessionTitle = (session: CraftFmSession) => {
  const first = session.items?.[0]
  if (!first) return t('items.craftingPicker.emptySession')
  const name = first.item?.name?.fr ?? first.item?.name?.en ?? String(first.itemId)
  const count = session.items?.length || 0
  if (count === 1) return name
  return t('items.craftingPicker.plusMore', { name, count: count - 1 })
}

/** Sessions are saved per character, so both picker actions need a context. */
const canUseCraftingSessions = computed(() => Boolean(selectedServer.value && selectedCharacter.value))

const getCraftingSessionMeta = (session: CraftFmSession) => [
  session.date || todayISO(),
  formatWorkflowShortLabel(session.workflow),
  t('v2.crafting.index.itemsCount', { count: session.items?.length || 0 }),
].join(' · ')

const workflowSteps = ['search', 'save', 'compare', 'track'] as const

const formatWorkflowShortLabel = (value: WorkflowMode | string | undefined) =>
  value === 'craft'
    ? 'Craft'
    : value === 'fm'
      ? 'FM'
      : 'Craft + FM'

function todayISO() {
  const date = new Date()
  return date.toISOString().slice(0, 10)
}

const createCraftingAttempt = (): DraftAttempt => ({
  id: crypto.randomUUID(),
  date: todayISO(),
  runeCost: 0,
  estimatedValue: 0,
  tag: 'setup',
  statsNote: '',
  notes: '',
})

const buildCraftingTargetStats = async (item: any): Promise<DraftTargetStat[]> => {
  if (!Array.isArray(item?.effects) || !item.effects.length) return []

  await ensureEffectLabels(item.effects)

  return item.effects
    .map((effect: any, index: number) => {
      const effectId = Number(effect.effectId ?? effect.id ?? 0)
      if (!effectId) return null

      const effectData = effectCache.value[String(effectId)]?.data
      const min = Number(effect.from ?? effect.value ?? 0)
      const max = Number(effect.to ?? effect.value ?? 0)

      return {
        id: `${effectId}-${index}`,
        effectId,
        label: formatEffectLabel(effectData, effect),
        min,
        max: max || min,
        baseValue: Number(effect.value ?? effect.from ?? 0),
        targetValue: max || min,
        priority: 'normal' as TargetPriority,
      }
    })
    .filter(Boolean) as DraftTargetStat[]
}

const buildCraftingDraftItem = async (item: any): Promise<DraftCraftFmItem> => ({
  id: crypto.randomUUID(),
  itemId: item.id,
  item,
  acquisitionMode: 'crafted',
  craftKamasBefore: 0,
  craftKamasAfter: 0,
  extraExpenses: 0,
  runeValueBeforeFm: 0,
  runePurchases: 0,
  runeValueAfterFm: 0,
  targetMode: 'clean',
  targetSummary: '',
  stopRule: '',
  expectedSalePrice: 0,
  listedPrice: 0,
  realizedSalePrice: 0,
  brisageRecovery: 0,
  outcome: 'in_progress',
  notes: '',
  targetStats: await buildCraftingTargetStats(item),
  attempts: [createCraftingAttempt()],
})

const resolveCraftingItem = async (item: { name: string; rawItem?: any }) => {
  const rawItem = item.rawItem
  if (rawItem?.id && Array.isArray(rawItem?.effects)) return rawItem

  if (
    selectedRecipeItem.value?.name === item.name &&
    recipeLookupState.value.data?.result?.id &&
    Array.isArray(recipeLookupState.value.data?.result?.effects)
  ) {
    return recipeLookupState.value.data.result
  }

  const searchResponse = await $fetch<any>('/api/dofusdb/items', {
    query: {
      'typeId[$ne]': 203,
      '$sort': '-id',
      'slug.fr[$search]': normalizeDofusdbSearch(item.name),
      'level[$gte]': 0,
      'level[$lte]': 200,
      '$skip': 0,
      lang: 'fr',
    },
  })

  const results = Array.isArray(searchResponse?.data) ? searchResponse.data : []
  const exactMatch = results.find((entry: any) =>
    normalizeDofusdbSearch(entry?.name?.fr || entry?.name?.en || '') === normalizeDofusdbSearch(item.name),
  )
  const matchedItem = exactMatch || results[0]

  if (!matchedItem?.id) {
    throw new Error(`Could not resolve "${item.name}" from DofusDB.`)
  }

  return matchedItem
}

const closeCraftingPicker = () => {
  craftingPickerState.value = {
    isOpen: false,
    isSaving: false,
    item: null,
    error: '',
  }
}

const openCraftingPicker = (item: { name: string; image_url?: string | null; count: number; rawItem?: any }) => {
  craftingPickerState.value = {
    isOpen: true,
    isSaving: false,
    item,
    error: '',
  }
  refreshCraftingSessionsPreview()
}

const appendItemToCraftingSession = async (sessionId?: string) => {
  const pickedItem = craftingPickerState.value.item
  if (!pickedItem) return
  if (!selectedServer.value?.id || !selectedCharacter.value?.id) {
    craftingPickerState.value.error = 'Select a server and character first.'
    return
  }

  craftingPickerState.value.isSaving = true
  craftingPickerState.value.error = ''

  try {
    const resolvedItem = await resolveCraftingItem(pickedItem)
    const nextItem = await buildCraftingDraftItem(resolvedItem)
    const sessions = readCraftingSessions()

    if (sessionId) {
      const targetSession = sessions.find((session) => session.id === sessionId)
      if (!targetSession) {
        throw new Error('The selected session was not found.')
      }

      const alreadyTracked = (targetSession.items || []).some((entry) => String(entry.itemId) === String(resolvedItem.id))
      if (alreadyTracked) {
        throw new Error(`"${pickedItem.name}" is already in that session.`)
      }

      targetSession.items = [nextItem, ...(targetSession.items || [])]
    } else {
      sessions.unshift({
        id: crypto.randomUUID(),
        date: todayISO(),
        workflow: 'craft_fm',
        focus: 'mixed',
        startingKamas: 0,
        currentKamas: 0,
        startingRuneStockValue: 0,
        currentRuneStockValue: 0,
        sessionExpenses: 0,
        notes: '',
        items: [nextItem],
        resourceChecklist: [],
      })
    }

    writeCraftingSessions(sessions)
    refreshCraftingSessionsPreview()
    closeCraftingPicker()
    showCraftingToast(
      sessionId
        ? `Added ${pickedItem.name} to crafting session.`
        : `Created a new crafting session with ${pickedItem.name}.`,
      'success',
    )
  } catch (error: any) {
    craftingPickerState.value = {
      ...craftingPickerState.value,
      isSaving: false,
      error: error?.message || 'Failed to save the item to a crafting session.',
    }
    return
  }

  craftingPickerState.value.isSaving = false
}

const createCraftingSessionFromPicker = async () => {
  await appendItemToCraftingSession()
}

const addItemToExistingCraftingSession = async (sessionId: string) => {
  await appendItemToCraftingSession(sessionId)
}

const selectedObservationKey = computed(() =>
  selectedRecipeItem.value?.name ? normalizeDofusdbSearch(selectedRecipeItem.value.name) : ''
)

const baseSelectedItemObservations = computed(() => {
  const key = selectedObservationKey.value
  if (!key) return []
  return (observedPrices.value[key] || []).slice()
})

const parseObservationRange = (rangeText: string) => {
  const numbers = rangeText.match(/-?\d+/g)?.map(Number) || []
  if (!numbers.length) return null
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] }
  return {
    min: Math.min(numbers[0], numbers[1]),
    max: Math.max(numbers[0], numbers[1]),
  }
}

const normalizeLabelForStatKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[{}[\]()]/g, ' ')
    .replace(/[^a-z0-9%+\-\s]/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\bdommage\b/g, 'dommages')
    .replace(/\bresistances?\b/g, 'resistance')
    .replace(/\s+/g, ' ')
    .trim()

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const hasWholeWordStatAliasMatch = (normalizedLabel: string, normalizedAlias: string) => {
  if (!normalizedLabel || !normalizedAlias) return false
  if (normalizedLabel === normalizedAlias) return true
  if (normalizedAlias.length < 3 || normalizedLabel.length < 3) return false

  const aliasPattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedAlias)}(\\s|$)`)
  const labelPattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedLabel)}(\\s|$)`)

  return aliasPattern.test(normalizedLabel) || labelPattern.test(normalizedAlias)
}

const normalizeSpecialMageSignature = (value: string) =>
  normalizeLabelForStatKey(value)
    .replace(/\b(aux|au|a|de|des|du|les|le|la)\b/g, ' ')
    .replace(/\bcorps a corps\b/g, 'melee')
    .replace(/\bcorps\b/g, 'melee')
    .replace(/\bsorts?\b/g, 'sort')
    .replace(/\bdistances?\b/g, 'distance')
    .replace(/\s+/g, '')
    .trim()

const findSpecialMageDef = (label: string) => {
  const signature = normalizeSpecialMageSignature(label)
  if (!signature) return undefined

  return statsOcrDefs.find((def) => {
    if (!specialMageStatKeys.has(def.key)) return false
    return [def.label, ...def.aliases].some((alias) => {
      const aliasSignature = normalizeSpecialMageSignature(alias)
      return signature === aliasSignature
        || signature.includes(aliasSignature)
        || aliasSignature.includes(signature)
    })
  })
}

const scrollSectionIntoView = async (getTarget: () => HTMLElement | null | undefined) => {
  await nextTick()
  // The CSS `scroll-behavior` override can't reach a scripted smooth scroll,
  // so reduced-motion has to be honoured here explicitly.
  const reduceMotion = import.meta.client
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  getTarget()?.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
  })
}

const findStatOptionByLabel = (label: string) => {
  const specialDef = findSpecialMageDef(label)
  if (specialDef) {
    return observationStatOptions.find((option) => option.key === specialDef.key)
  }

  const normalized = normalizeLabelForStatKey(label)
  const exactDef = statsOcrDefs.find((def) =>
    [def.label, ...def.aliases].some((alias) => normalizeLabelForStatKey(alias) === normalized),
  )
  if (exactDef) {
    return observationStatOptions.find((option) => option.key === exactDef.key)
  }

  const partialDef = statsOcrDefs
    .map((def) => ({
      def,
      matchedAlias: [def.label, ...def.aliases]
        .map((alias) => normalizeLabelForStatKey(alias))
        .find((alias) => hasWholeWordStatAliasMatch(normalized, alias)) || '',
    }))
    .filter((entry) => entry.matchedAlias)
    .sort((a, b) => b.matchedAlias.length - a.matchedAlias.length)[0]?.def

  return partialDef
    ? observationStatOptions.find((option) => option.key === partialDef.key)
    : undefined
}

const currentItemKey = computed(() =>
  selectedRecipeItem.value?.name ? normalizeDofusdbSearch(selectedRecipeItem.value.name) : ''
)

const shouldIgnoreOfficialObservationEffect = (rawLabel: string) => {
  const normalized = normalizeLabelForStatKey(rawLabel)
  return normalized.startsWith('vol ') || normalized.includes(' vol ')
}

const currentItemEffectMappings = computed(() => {
  const effects = recipeLookupState.value.data?.result?.effects
  if (!Array.isArray(effects)) return []

  return effects
    .map((effect: any) => {
      const cached = effectCache.value[String(effect.effectId)]?.data
      if (!cached) return null
      const label = formatEffectLabel(cached, effect)
      const option = findStatOptionByLabel(label)
      const range = effect.from === effect.to
        ? `[${effect.from}]`
        : `[${effect.from} à ${effect.to}]`
      return {
        effectId: effect.effectId,
        rawLabel: label,
        matchedKey: option?.key || '',
        matchedLabel: option?.label || '',
        rangeText: range,
        matched: Boolean(option),
        ignoredForObservation: shouldIgnoreOfficialObservationEffect(label),
      }
    })
    .filter(Boolean)
})

const currentItemPriorityOptions = computed(() => {
  const seen = new Set<string>()
  return currentItemEffectMappings.value
    .filter((entry) => !entry.ignoredForObservation)
    .filter((entry) => entry.matched && entry.matchedKey)
    .filter((entry) => {
      if (seen.has(entry.matchedKey)) return false
      seen.add(entry.matchedKey)
      return true
    })
    .map((entry) => ({
      key: entry.matchedKey,
      label: entry.matchedLabel,
      rangeText: entry.rangeText,
    }))
})

const currentExpectedObservationStats = computed(() =>
  currentItemPriorityOptions.value.map((option) => {
    const statOption = observationStatOptions.find((entry) => entry.key === option.key)
    return {
      key: option.key,
      label: option.label,
      rangeText: option.rangeText,
      suffix: statOption?.suffix || '',
    }
  })
)

const getItemStatMultiplier = (statKey: string) => {
  const itemKey = currentItemKey.value
  if (!itemKey) return 1
  return itemStatPriorities.value[itemKey]?.[statKey] ?? 1
}

const setItemStatMultiplier = (statKey: string, multiplier: number) => {
  const itemKey = currentItemKey.value
  if (!itemKey) return
  const next = {
    ...itemStatPriorities.value,
    [itemKey]: {
      ...(itemStatPriorities.value[itemKey] || {}),
      [statKey]: multiplier,
    },
  }
  itemStatPriorities.value = next
  writeItemStatPriorities(next)
}

const computeObservationRangeProgress = (value: number, range: { min: number; max: number }) => {
  if (range.max <= range.min) {
    return value >= range.max ? 1 + Math.max(0, value - range.max) : Math.max(0, value)
  }

  if (value <= range.min) {
    return Math.max(0, (value - range.min) / (range.max - range.min))
  }

  const span = range.max - range.min
  const cappedProgress = Math.min(1, (value - range.min) / span)
  const overmageProgress = value > range.max ? (value - range.max) / span : 0
  return cappedProgress + overmageProgress
}

const computeObservationStatContribution = (entry: StoredObservedPriceEntry['statsEntries'][number], index: number) => {
  const value = entry.value
  const range = parseObservationRange(entry.rangeText)
  const weight = (observationStatWeightMap[entry.key] ?? 1) * getItemStatMultiplier(entry.key)
  const progress = value === null || value === undefined
    ? 0
    : range
      ? computeObservationRangeProgress(value, range)
      : 1
  const overmageAmount = value !== null && value !== undefined && range && value > range.max
    ? value - range.max
    : 0

  return {
    index,
    key: entry.key,
    label: entry.label,
    value,
    suffix: entry.suffix || '',
    rangeText: entry.rangeText || '',
    weight,
    progress,
    overmageAmount,
    contribution: weight > 0 ? progress * weight : 0,
  }
}

const computeObservationScore = (observation: StoredObservedPriceEntry) => {
  return observation.statsEntries.reduce((sum, entry) => {
    if (entry.value === null || entry.value === undefined) return sum
    const range = parseObservationRange(entry.rangeText)
    const weight = (observationStatWeightMap[entry.key] ?? 1) * getItemStatMultiplier(entry.key)

    if (weight <= 0) return sum

    if (!range) return sum + weight

    const normalized = computeObservationRangeProgress(entry.value, range)

    return sum + normalized * weight
  }, 0)
}

const observationHasUsableStats = (observation: StoredObservedPriceEntry) =>
  computeObservationScore(observation) > 0

const medianOf = (values: number[]) => {
  if (!values.length) return 0
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

const roundRelistPrice = (value: number) => {
  const rounded = Math.max(0, Math.round(value))
  if (rounded <= 1000) return rounded
  return rounded - 1
}

const pickScoreComparablePeers = <
  T extends { id: string; score: number }
>(entry: T, peers: T[]) => {
  if (peers.length <= 3) return peers

  return peers
    .slice()
    .sort((a, b) => {
      const distanceA = Math.abs(a.score - entry.score)
      const distanceB = Math.abs(b.score - entry.score)
      if (distanceA !== distanceB) return distanceA - distanceB
      return b.score - a.score
    })
    .slice(0, 3)
}

const getObservationEntriesByKey = (observation: StoredObservedPriceEntry) => {
  const statsMap = new Map<string, StoredObservedPriceEntry['statsEntries'][number]>()
  observation.statsEntries.forEach((entry) => {
    if (entry.value === null || entry.value === undefined || Number.isNaN(Number(entry.value))) return
    statsMap.set(entry.key, entry)
  })
  return statsMap
}

const computeObservationComparableDistance = (
  target: StoredObservedPriceEntry,
  peer: StoredObservedPriceEntry,
) => {
  const targetStats = getObservationEntriesByKey(target)
  const peerStats = getObservationEntriesByKey(peer)
  const keys = new Set([...targetStats.keys(), ...peerStats.keys()])

  if (!keys.size) {
    return {
      distance: Number.POSITIVE_INFINITY,
      overlapRatio: 0,
      comparableCount: 0,
    }
  }

  let weightedDistance = 0
  let totalWeight = 0
  let overlapCount = 0

  keys.forEach((key) => {
    const weight = (observationStatWeightMap[key] ?? 1) * getItemStatMultiplier(key)
    if (weight <= 0) return
    const missingPenaltyMultiplier = specialMageStatKeys.has(key) ? 2 : 1.15

    const targetEntry = targetStats.get(key)
    const peerEntry = peerStats.get(key)

    if (!targetEntry || !peerEntry) {
      weightedDistance += weight * missingPenaltyMultiplier
      totalWeight += weight
      return
    }

    overlapCount += 1
    totalWeight += weight

    const targetRange = parseObservationRange(targetEntry.rangeText)
    const peerRange = parseObservationRange(peerEntry.rangeText)
    const targetValue = Number(targetEntry.value)
    const peerValue = Number(peerEntry.value)

    if (targetRange && peerRange) {
      const targetProgress = computeObservationRangeProgress(targetValue, targetRange)
      const peerProgress = computeObservationRangeProgress(peerValue, peerRange)
      weightedDistance += Math.abs(targetProgress - peerProgress) * weight
      return
    }

    const denom = Math.max(Math.abs(targetValue), Math.abs(peerValue), 1)
    weightedDistance += (Math.abs(targetValue - peerValue) / denom) * weight
  })

  if (totalWeight <= 0) {
    return {
      distance: Number.POSITIVE_INFINITY,
      overlapRatio: 0,
      comparableCount: 0,
    }
  }

  const overlapRatio = overlapCount / Math.max(keys.size, 1)
  const normalizedDistance = weightedDistance / totalWeight
  const coveragePenalty = overlapRatio < 0.5 ? (0.5 - overlapRatio) * 1.5 : 0

  return {
    distance: normalizedDistance + coveragePenalty,
    overlapRatio,
    comparableCount: overlapCount,
  }
}

const buildRelistTargets = (entryPrice: number, fairValue: number, peerPrices: number[]) => {
  const sortedHigherPeers = peerPrices
    .filter((price) => price > entryPrice)
    .sort((a, b) => a - b)
  const nearestHigherPeer = sortedHigherPeers[0]
  const highestPeer = peerPrices.slice().sort((a, b) => b - a)[0]
  const quickRelist = nearestHigherPeer
    ? roundRelistPrice(nearestHigherPeer)
    : roundRelistPrice(Math.max(fairValue * 0.98, entryPrice))
  const fairRelist = roundRelistPrice(Math.max(fairValue, entryPrice))
  const greedyRelist = roundRelistPrice(
    Math.max(
      nearestHigherPeer ? Math.min(highestPeer || fairValue, nearestHigherPeer * 1.02) : fairValue * 1.05,
      fairRelist,
    )
  )

  return {
    quickRelist,
    fairRelist,
    greedyRelist,
  }
}

const computeScoreModelValuation = (
  entry: StoredObservedPriceEntry & { score: number },
  allPeers: Array<StoredObservedPriceEntry & { score: number }>,
) => {
  const peers = pickScoreComparablePeers(entry, allPeers.filter((candidate) => candidate.score > 0))
  if (!peers.length) return null

  const referencePricePerPoint = medianOf(
    peers.map((peer) => peer.price / peer.score).filter((value) => Number.isFinite(value) && value > 0),
  )

  if (!referencePricePerPoint) return null

  const fairValue = Math.round(entry.score * referencePricePerPoint)
  const relists = buildRelistTargets(entry.price, fairValue, peers.map((peer) => peer.price))

  return {
    modelUsed: 'score' as const,
    id: entry.id,
    price: entry.price,
    score: entry.score,
    fairValue,
    delta: entry.price - fairValue,
    referencePricePerPoint,
    comparableCount: peers.length,
    medianPeerDistance: medianOf(peers.map((peer) => Math.abs(peer.score - entry.score))),
    peerMetricLabel: t('items.detail.valuation.peerMetric.pricePerPoint'),
    peerMetricKind: 'currency' as const,
    peerMetricValues: Object.fromEntries(peers.map((peer) => [peer.id, peer.price / peer.score])),
    peers: peers.map((peer) => ({
      ...peer,
      distance: Math.abs(peer.score - entry.score),
    })),
    ...relists,
  }
}

const computeComparableModelValuation = (
  entry: StoredObservedPriceEntry & { score: number },
  allPeers: Array<StoredObservedPriceEntry & { score: number }>,
) => {
  const peerDistances = allPeers
    .map((peer) => ({
      peer,
      ...computeObservationComparableDistance(entry, peer),
    }))
    .filter((candidate) => Number.isFinite(candidate.distance) && candidate.overlapRatio >= 0.35)
    .sort((a, b) => a.distance - b.distance)

  const peers = peerDistances.slice(0, 4)
  if (peers.length < 2) return null

  const localReferencePricePerPoint = medianOf(
    peers.map(({ peer }) => peer.price / peer.score).filter((value) => Number.isFinite(value) && value > 0),
  )
  const weightedAdjustedPrices = peers.map(({ peer, distance }) => {
    const closenessWeight = 1 / Math.max(0.2, distance + 0.05)
    const scoreAdjustment = localReferencePricePerPoint
      ? (entry.score - peer.score) * localReferencePricePerPoint * 0.5
      : 0
    return {
      peer,
      distance,
      closenessWeight,
      adjustedPrice: Math.max(0, peer.price + scoreAdjustment),
    }
  })

  const weightSum = weightedAdjustedPrices.reduce((sum, candidate) => sum + candidate.closenessWeight, 0)
  if (weightSum <= 0) return null

  const fairValue = Math.round(
    weightedAdjustedPrices.reduce((sum, candidate) => sum + candidate.adjustedPrice * candidate.closenessWeight, 0)
    / weightSum,
  )
  const relists = buildRelistTargets(entry.price, fairValue, peers.map(({ peer }) => peer.price))

  return {
    modelUsed: 'comparables' as const,
    id: entry.id,
    price: entry.price,
    score: entry.score,
    fairValue,
    delta: entry.price - fairValue,
    referencePricePerPoint: localReferencePricePerPoint,
    comparableCount: peers.length,
    medianPeerDistance: medianOf(peers.map((candidate) => candidate.distance)),
    peerMetricLabel: t('items.detail.valuation.peerMetric.adjustedPrice'),
    peerMetricKind: 'currency' as const,
    peerMetricValues: Object.fromEntries(weightedAdjustedPrices.map((candidate) => [candidate.peer.id, candidate.adjustedPrice])),
    peers: peers.map(({ peer, distance, overlapRatio }) => ({
      ...peer,
      distance,
      overlapRatio,
    })),
    ...relists,
  }
}

const allObservedValuations = computed(() => {
  const withScores = baseSelectedItemObservations.value
    .map((entry) => ({
      ...entry,
      score: computeObservationScore(entry),
    }))
    .filter((entry) => entry.score > 0)

  if (withScores.length < 2) return []

  return withScores.map((entry) => {
    const allPeers = withScores.filter((candidate) => candidate.id !== entry.id && candidate.score > 0)
    const scoreValuation = computeScoreModelValuation(entry, allPeers)
    const comparableValuation = computeComparableModelValuation(entry, allPeers)

    const activeValuation = valuationMode.value === 'score'
      ? scoreValuation
      : valuationMode.value === 'comparables'
        ? comparableValuation
        : comparableValuation && comparableValuation.comparableCount >= 2 && comparableValuation.medianPeerDistance <= 0.7
          ? comparableValuation
          : scoreValuation

    if (activeValuation) return activeValuation

    return {
      modelUsed: 'score' as const,
      id: entry.id,
      price: entry.price,
      score: entry.score,
      fairValue: entry.price,
      delta: 0,
      quickRelist: entry.price,
      fairRelist: entry.price,
      greedyRelist: entry.price,
      referencePricePerPoint: 0,
      comparableCount: 0,
      medianPeerDistance: Number.POSITIVE_INFINITY,
      peerMetricLabel: t('items.detail.valuation.peerMetric.pricePerPoint'),
      peerMetricKind: 'currency' as const,
      peerMetricValues: {},
      peers: [],
    }
  })
})

const allObservedValuationMap = computed(() =>
  Object.fromEntries(allObservedValuations.value.map((row) => [row.id, row]))
)

const bestBuyObservationId = computed(() => {
  const undervalued = allObservedValuations.value.filter((row) => row.delta < 0)
  if (!undervalued.length) return ''
  return undervalued.slice().sort((a, b) => a.delta - b.delta)[0]?.id || ''
})

const bestBuyObservation = computed(() => {
  const id = bestBuyObservationId.value
  if (!id) return null
  const valuation = allObservedValuationMap.value[id]
  const observation = baseSelectedItemObservations.value.find((entry) => entry.id === id)
  return valuation && observation ? { ...observation, ...valuation } : null
})

const selectedItemObservations = computed(() => {
  const rows = baseSelectedItemObservations.value.slice()

  return rows.sort((a, b) => {
    if (observedSortMode.value === 'price_asc') {
      if (a.price !== b.price) return a.price - b.price
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    if (observedSortMode.value === 'price_desc') {
      if (b.price !== a.price) return b.price - a.price
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    if (observedSortMode.value === 'delta') {
      const deltaA = allObservedValuationMap.value[a.id]?.delta ?? Number.POSITIVE_INFINITY
      const deltaB = allObservedValuationMap.value[b.id]?.delta ?? Number.POSITIVE_INFINITY
      if (deltaA !== deltaB) return deltaA - deltaB
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    if (observedSortMode.value === 'best_buy') {
      const bestId = bestBuyObservationId.value
      if (a.id === bestId && b.id !== bestId) return -1
      if (b.id === bestId && a.id !== bestId) return 1

      const deltaA = allObservedValuationMap.value[a.id]?.delta ?? Number.POSITIVE_INFINITY
      const deltaB = allObservedValuationMap.value[b.id]?.delta ?? Number.POSITIVE_INFINITY
      if (deltaA !== deltaB) return deltaA - deltaB
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

const displayedObservedValuations = computed(() => {
  return showOnlyUndervaluedListings.value
    ? allObservedValuations.value.filter((row) => row.delta < 0)
    : allObservedValuations.value
})

const valuationModeSummary = computed(() => {
  if (valuationMode.value === 'score') {
    return t('items.detail.valuation.modeSummary.score')
  }

  if (valuationMode.value === 'comparables') {
    return t('items.detail.valuation.modeSummary.comparables')
  }

  return t('items.detail.valuation.modeSummary.auto')
})

const medianAbsoluteDeviation = (values: number[]) => {
  if (!values.length) return 0
  const center = medianOf(values)
  const deviations = values.map((value) => Math.abs(value - center))
  return medianOf(deviations)
}

const valuationConfidence = computed(() => {
  const rows = allObservedValuations.value
  const sample = rows.length
  const expectedStats = currentItemPriorityOptions.value.length || 0

  if (!sample) {
    return {
      level: 'low' as const,
      label: t('items.detail.valuation.confidence.low'),
      details: t('items.detail.valuation.confidence.noUsable'),
    }
  }

  const completenessScores = selectedItemObservations.value
    .map((observation) => {
      if (!observationHasUsableStats(observation)) return 0
      if (!expectedStats) return 1

      const matchedStats = observation.statsEntries.filter((entry) =>
        currentItemPriorityOptions.value.some((option) => option.key === entry.key) &&
        entry.value !== null &&
        entry.value !== undefined
      ).length

      return Math.min(1, matchedStats / expectedStats)
    })
    .filter((value) => value > 0)

  const avgCompleteness = completenessScores.length
    ? completenessScores.reduce((sum, value) => sum + value, 0) / completenessScores.length
    : 0

  const avgComparableCount = rows.reduce((sum, row) => sum + (row.comparableCount ?? 0), 0) / sample
  const comparableRows = rows.filter((row) => row.modelUsed === 'comparables')
  const comparableCoverage = comparableRows.length / Math.max(sample, 1)
  const priceRatios = rows
    .map((row) => row.referencePricePerPoint)
    .filter((value) => Number.isFinite(value) && value > 0)
  const priceSpreadRatio = priceRatios.length > 1
    ? medianAbsoluteDeviation(priceRatios) / Math.max(medianOf(priceRatios), 1)
    : 1
  const medianPeerDistance = medianOf(
    comparableRows
      .map((row) => row.medianPeerDistance)
      .filter((value) => Number.isFinite(value) && value >= 0),
  )

  let score = 0

  if (sample >= 6) score += 2
  else if (sample >= 4) score += 1

  if (avgComparableCount >= 3) score += 2
  else if (avgComparableCount >= 2) score += 1

  if (avgCompleteness >= 0.9) score += 2
  else if (avgCompleteness >= 0.7) score += 1

  if (valuationMode.value === 'comparables') {
    if (medianPeerDistance <= 0.3) score += 2
    else if (medianPeerDistance <= 0.55) score += 1
  } else if (valuationMode.value === 'auto') {
    if (comparableCoverage >= 0.75) score += 2
    else if (comparableCoverage >= 0.4) score += 1
  } else {
    if (priceSpreadRatio <= 0.08) score += 2
    else if (priceSpreadRatio <= 0.18) score += 1
  }

  const level =
    score >= 7 ? 'high'
      : score >= 4 ? 'medium'
        : 'low'

  const completenessPct = Math.round(avgCompleteness * 100)
  const spreadPct = Math.round(priceSpreadRatio * 100)
  const coveragePct = Math.round(comparableCoverage * 100)

  return {
    level,
    label: level === 'high'
      ? t('items.detail.valuation.confidence.high')
      : level === 'medium'
        ? t('items.detail.valuation.confidence.medium')
        : t('items.detail.valuation.confidence.low'),
    details: valuationMode.value === 'comparables'
      ? t('items.detail.valuation.confidence.detailsComparables', {
        sample,
        avg: avgComparableCount.toFixed(1),
        coverage: completenessPct,
        distance: medianPeerDistance.toFixed(2),
      })
      : valuationMode.value === 'auto'
        ? t('items.detail.valuation.confidence.detailsAuto', {
          sample,
          avg: avgComparableCount.toFixed(1),
          coverage: completenessPct,
          comparableCoverage: coveragePct,
        })
        : t('items.detail.valuation.confidence.detailsScore', {
          sample,
          avg: avgComparableCount.toFixed(1),
          coverage: completenessPct,
          spread: spreadPct,
        }),
  }
})

const getObservationBadges = (observation: StoredObservedPriceEntry) => {
  const badges: Array<{ label: string; tone: 'good' | 'bad' | 'warn' | 'neutral' }> = []
  const valuation = allObservedValuationMap.value[observation.id]

  if (!observationHasUsableStats(observation)) {
    badges.push({ label: t('items.detail.observed.badges.missingStats'), tone: 'warn' })
  }

  if (valuation) {
    if (valuation.delta < 0) {
      badges.push({ label: t('items.detail.observed.badges.underpriced'), tone: 'good' })
    } else if (valuation.delta > 0) {
      badges.push({ label: t('items.detail.observed.badges.overpriced'), tone: 'bad' })
    }

    if (bestBuyObservationId.value === observation.id) {
      badges.push({ label: t('items.detail.observed.badges.bestBuy'), tone: 'good' })
    }
  }

  if (valuationConfidence.value.level === 'low') {
    badges.push({ label: t('items.detail.valuation.confidence.low'), tone: 'neutral' })
  }

  return badges
}

const selectedObservationDetail = computed(() => {
  if (!selectedObservationId.value) return null
  return selectedItemObservations.value.find((entry) => entry.id === selectedObservationId.value) || null
})

const selectedItemScreenshotSummary = computed(() => {
  const observations = selectedItemObservations.value
  let marketCount = 0
  let statsCount = 0

  observations.forEach((entry) => {
    if (entry.marketScreenshotDataUrl) marketCount += 1
    if (entry.statsScreenshotDataUrl) statsCount += 1
  })

  return {
    marketCount,
    statsCount,
    totalCount: marketCount + statsCount,
  }
})

const selectedObservationStatsHealth = computed(() => {
  const observation = selectedObservationDetail.value
  if (!observation) {
    return {
      missing: [] as Array<{ key: string; label: string; rangeText: string; suffix: string }>,
      unmatchedOfficial: [] as Array<{ effectId: number; rawLabel: string; rangeText: string }>,
      unexpected: [] as Array<{ index: number; label: string }>,
      duplicates: [] as Array<{ key: string; label: string; count: number }>,
      incomplete: [] as Array<{ index: number; label: string }>,
    }
  }

  const expected = currentExpectedObservationStats.value
  const expectedKeys = new Set(expected.map((entry) => entry.key))
  const keyCounts = new Map<string, number>()

  observation.statsEntries.forEach((entry) => {
    keyCounts.set(entry.key, (keyCounts.get(entry.key) || 0) + 1)
  })

  const missing = expected.filter((entry) => !observation.statsEntries.some((line) => line.key === entry.key))
  const unmatchedOfficial = currentItemEffectMappings.value
    .filter((entry) => !entry.ignoredForObservation && !entry.matched)
    .map((entry) => ({
      effectId: entry.effectId,
      rawLabel: entry.rawLabel,
      rangeText: entry.rangeText,
    }))
  const unexpected = observation.statsEntries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !expectedKeys.has(entry.key) && !specialMageStatKeys.has(entry.key))
    .map(({ entry, index }) => ({ index, label: entry.label || entry.key || t('items.detail.observed.statsHealth.lineFallback', { index: index + 1 }) }))

  const duplicates = Array.from(keyCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({
      key,
      label: observation.statsEntries.find((entry) => entry.key === key)?.label || key,
      count,
    }))

  const incomplete = observation.statsEntries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.value === null || entry.value === undefined || Number.isNaN(Number(entry.value)))
    .map(({ entry, index }) => ({ index, label: entry.label || entry.key || t('items.detail.observed.statsHealth.lineFallback', { index: index + 1 }) }))

  return {
    missing,
    unmatchedOfficial,
    unexpected,
    duplicates,
    incomplete,
  }
})

const selectedObservationValuationExplanation = computed(() => {
  const observation = selectedObservationDetail.value
  if (!observation) return null

  const score = computeObservationScore(observation)
  if (score <= 0) return null

  const withScores = baseSelectedItemObservations.value
    .map((entry) => ({
      ...entry,
      score: computeObservationScore(entry),
    }))
    .filter((entry) => entry.score > 0)

  const allPeers = withScores.filter((candidate) => candidate.id !== observation.id)
  const scoreValuation = computeScoreModelValuation({ ...observation, score }, allPeers)
  const comparableValuation = computeComparableModelValuation({ ...observation, score }, allPeers)
  const valuation = valuationMode.value === 'score'
    ? scoreValuation
    : valuationMode.value === 'comparables'
      ? comparableValuation
      : comparableValuation && comparableValuation.comparableCount >= 2 && comparableValuation.medianPeerDistance <= 0.7
        ? comparableValuation
        : scoreValuation
  if (!valuation) return null

  const contributions = observation.statsEntries.map((entry, index) => computeObservationStatContribution(entry, index))

  return {
    score: valuation.score,
    fairValue: valuation.fairValue,
    delta: valuation.delta,
    referencePricePerPoint: valuation.referencePricePerPoint,
    methodLabel: valuation.modelUsed === 'comparables' ? t('items.detail.valuation.models.comparables') : t('items.detail.valuation.models.score'),
    referenceLabel: valuation.modelUsed === 'comparables' ? t('items.detail.valuation.reference.medianDistance') : t('items.detail.valuation.reference.referencePerPoint'),
    referenceDisplay: valuation.modelUsed === 'comparables'
      ? valuation.medianPeerDistance.toFixed(2)
      : formatKamasFull(Math.round(valuation.referencePricePerPoint)),
    peerMetricLabel: valuation.peerMetricLabel,
    contributions,
    peers: valuation.peers.map((peer) => ({
      id: peer.id,
      price: peer.price,
      score: peer.score,
      metricDisplay: valuation.peerMetricKind === 'currency'
        ? formatKamasFull(Math.round(valuation.peerMetricValues[peer.id] ?? 0))
        : String(valuation.peerMetricValues[peer.id] ?? t('items.detail.common.emptyValue')),
      distance: peer.distance,
    })),
  }
})

const resaleTrackedObservationIds = computed(() =>
  new Set(
    resaleTrackerEntries.value
      .map((entry) => entry.observedListingId)
      .filter((value) => typeof value === 'string' && value.length > 0),
  ),
)

const fetchResolvedRecipe = async (item: { name: string }, options: { forceRefresh?: boolean } = {}) => {
  const normalizedName = normalizeDofusdbSearch(item.name)
  const cache = readRecipeCache()
  const cachedEntry = cache[normalizedName]

  if (cachedEntry && !options.forceRefresh) {
    return {
      recipe: cachedEntry.recipe,
      dofusdbId: cachedEntry.dofusdbId,
      source: 'cache' as const,
      confidence: cachedEntry.confidence,
    }
  }

  let dofusdbId = cachedEntry?.dofusdbId
  let matchedName = cachedEntry?.matchedName || item.name
  let confidence: Exclude<RecipeMatchConfidence, ''> = cachedEntry?.confidence || 'approx'

  if (!dofusdbId || options.forceRefresh) {
    const searchResponse = await $fetch<any>('/api/dofusdb/items', {
      query: {
        'typeId[$ne]': 203,
        '$sort': '-id',
        'slug.fr[$search]': normalizedName,
        'level[$gte]': 0,
        'level[$lte]': 200,
        '$skip': 0,
        lang: 'fr',
      },
    })

    const matchedItem = searchResponse?.data?.[0]

    if (!matchedItem?.id) {
      throw new Error(t('items.detail.recipe.errors.resolveFailed', { name: item.name }))
    }

    dofusdbId = matchedItem.id
    matchedName = matchedItem?.name?.fr || matchedItem?.name?.en || item.name
    confidence = getRecipeMatchConfidence(item.name, matchedName)
  }

  const recipe = await $fetch(`/api/dofusdb/recipes/${dofusdbId}`, {
    query: { lang: 'fr' },
  })

  cache[normalizedName] = {
    normalizedName,
    dofusdbId,
    matchedName,
    confidence,
    recipe,
    updatedAt: new Date().toISOString(),
  }
  writeRecipeCache(cache)

  return {
    recipe,
    dofusdbId,
    source: 'network' as const,
    confidence,
  }
}

const recipeIngredients = computed(() => {
  const recipe = recipeLookupState.value.data

  if (!recipe?.ingredientIds?.length || !recipe?.quantities?.length) return []

  return recipe.ingredientIds.map((ingredientId: number, index: number) => {
    const ingredient = recipe.ingredients?.find((entry: any) => entry.id === ingredientId)
    const normalizedTypeName = normalizeDofusdbSearch(ingredient?.type?.name?.fr || ingredient?.type?.name?.en || '')
    const normalizedIngredientName = normalizeDofusdbSearch(ingredient?.name?.fr || ingredient?.name?.en || '')
    const isSpecial =
      ingredientId === 14635 ||
      ['pepite', 'pepita', 'nugget'].includes(normalizedIngredientName) ||
      ['subtrat', 'substrat', 'concentrado', 'galet'].some((token) => normalizedTypeName.includes(token))

    return {
      id: ingredientId,
      quantity: recipe.quantities[index] ?? 0,
      name: ingredient?.name?.fr || ingredient?.name?.en || `Ingredient #${ingredientId}`,
      image: ingredient?.img || null,
      level: ingredient?.level ?? null,
      typeName: ingredient?.type?.name?.fr || ingredient?.type?.name?.en || null,
      hasRecipe: Boolean(ingredient?.hasRecipe),
      dropMonsterCount: Array.isArray(ingredient?.dropMonsterIds) ? ingredient.dropMonsterIds.length : 0,
      isSpecial,
      unitPrice: resourcePrices.value[String(ingredientId)]?.price ?? 0,
      priceUpdatedAt: resourcePrices.value[String(ingredientId)]?.updatedAt || null,
      priceUpdatedLabel: resourcePrices.value[String(ingredientId)]?.updatedAt
        ? formatPriceFreshness(resourcePrices.value[String(ingredientId)]?.updatedAt)
        : null,
    }
  }).sort((a, b) => {
    const aMissing = a.unitPrice > 0 ? 1 : 0
    const bMissing = b.unitPrice > 0 ? 1 : 0
    if (aMissing !== bMissing) return aMissing - bMissing
    return a.name.localeCompare(b.name)
  })
})

const recipeCostSummary = computed(() => {
  const ingredients = recipeIngredients.value
  const pricedCount = ingredients.filter((ingredient) => ingredient.unitPrice > 0).length
  const missingCount = ingredients.length - pricedCount
  const totalCost = ingredients.reduce(
    (sum, ingredient) => sum + ingredient.quantity * ingredient.unitPrice,
    0
  )

  return {
    totalCost,
    pricedCount,
    missingCount,
    totalIngredients: ingredients.length,
  }
})

const recipeProfitSummary = computed(() => {
  const sellPrice = Number(selectedRecipeSellPrice.value || 0)
  const craftCost = recipeCostSummary.value.totalCost
  const margin = sellPrice - craftCost
  const marginRate = sellPrice > 0 ? (margin / sellPrice) * 100 : 0

  return {
    sellPrice,
    craftCost,
    margin,
    marginRate,
  }
})

const aggregateIngredients = computed(() => {
  const source = aggregateRecipeState.value.data
  if (!source.length) return []

  const ingredientMap = new Map<number, {
    id: number
    name: string
    image: string | null
    level: number | null
    typeName: string | null
    hasRecipe: boolean
    dropMonsterCount: number
    isSpecial: boolean
    usageCount: number
    totalQuantity: number
    buildUsageCount: number
    pressureScore: number
    items: Array<{ name: string; image_url?: string | null; count: number }>
  }>()

  source.forEach((entry: any) => {
    const itemRef = entry.item
    const seenInThisRecipe = new Set<number>()

    entry.recipe?.ingredientIds?.forEach((ingredientId: number, index: number) => {
      const quantity = entry.recipe?.quantities?.[index] ?? 0
      const wasSeen = seenInThisRecipe.has(ingredientId)
      if (!wasSeen) seenInThisRecipe.add(ingredientId)

      const ingredient = entry.recipe.ingredients?.find((candidate: any) => candidate.id === ingredientId)
      const existing = ingredientMap.get(ingredientId)
      const normalizedTypeName = normalizeDofusdbSearch(ingredient?.type?.name?.fr || ingredient?.type?.name?.en || '')
      const normalizedIngredientName = normalizeDofusdbSearch(ingredient?.name?.fr || ingredient?.name?.en || '')

      if (existing) {
        if (!wasSeen) {
          existing.usageCount += 1
          existing.items.push(itemRef)
          existing.buildUsageCount += itemRef.count ?? 0
        }
        existing.totalQuantity += quantity
        existing.pressureScore += quantity * (itemRef.count ?? 0)
        return
      }

      ingredientMap.set(ingredientId, {
        id: ingredientId,
        name: ingredient?.name?.fr || ingredient?.name?.en || `Ingredient #${ingredientId}`,
        image: ingredient?.img || null,
        level: ingredient?.level ?? null,
        typeName: ingredient?.type?.name?.fr || ingredient?.type?.name?.en || null,
        hasRecipe: Boolean(ingredient?.hasRecipe),
        dropMonsterCount: Array.isArray(ingredient?.dropMonsterIds) ? ingredient.dropMonsterIds.length : 0,
        isSpecial:
          ingredientId === 14635 ||
          ['pepite', 'pepita', 'nugget'].includes(normalizedIngredientName) ||
          ['subtrat', 'substrat', 'concentrado', 'galet'].some((token) => normalizedTypeName.includes(token)),
        usageCount: 1,
        totalQuantity: quantity,
        buildUsageCount: itemRef.count ?? 0,
        pressureScore: quantity * (itemRef.count ?? 0),
        items: [itemRef],
      })
    })
  })

  const filtered = Array.from(ingredientMap.values()).filter((ingredient) => {
    if (aggregateResourceFilters.hideSpecial && ingredient.isSpecial) return false
    if (aggregateResourceFilters.onlyMonsterDrops && ingredient.dropMonsterCount === 0) return false
    if (aggregateResourceFilters.onlyNonCrafted && ingredient.hasRecipe) return false
    if (ingredient.usageCount < aggregateResourceFilters.minItemUsage) return false
    return true
  })

  return filtered.sort((a, b) => {
    if (aggregateSortMode.value === 'quantity') {
      if (b.totalQuantity !== a.totalQuantity) return b.totalQuantity - a.totalQuantity
      if (b.pressureScore !== a.pressureScore) return b.pressureScore - a.pressureScore
      if (b.buildUsageCount !== a.buildUsageCount) return b.buildUsageCount - a.buildUsageCount
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount
      return a.name.localeCompare(b.name)
    }

    if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount
    if (b.buildUsageCount !== a.buildUsageCount) return b.buildUsageCount - a.buildUsageCount
    if (b.pressureScore !== a.pressureScore) return b.pressureScore - a.pressureScore
    if (b.totalQuantity !== a.totalQuantity) return b.totalQuantity - a.totalQuantity
    return a.name.localeCompare(b.name)
  })
})

const pct = (count: number) =>
  stats.value?.totalEquipments > 0
    ? ((count / stats.value.totalEquipments) * 100).toFixed(1)
    : '0'

const barW = (count: number) => {
  const top = currentSlotStats.value?.topItems?.[0]?.count ?? 1
  return `${(count / top) * 100}%`
}

const buildQuery = () => {
  const params = new URLSearchParams()
  if (filters.element) params.append('where[tags][in][0]', filters.element)
  if (filters.mode) params.append('where[mode][equals]', filters.mode)
  if (filters.classe) params.append('where[classe][equals]', filters.classe)
  if (filters.level) params.append('where[level][equals]', filters.level)
  if (filters.budget) params.append('where[budget][equals]', filters.budget)
  params.append('limit', '1000')
  return params.toString()
}

const upsertResourcePrice = (
  ingredient: { id: number; name: string },
  rawValue: number | string
) => {
  const parsedValue = Number(rawValue)
  const nextPrice = Number.isFinite(parsedValue) && parsedValue > 0 ? Math.round(parsedValue) : 0
  const nextPrices = {
    ...resourcePrices.value,
  }

  if (nextPrice <= 0) {
    delete nextPrices[String(ingredient.id)]
  } else {
    nextPrices[String(ingredient.id)] = {
      resourceId: ingredient.id,
      name: ingredient.name,
      price: nextPrice,
      updatedAt: new Date().toISOString(),
    }
  }

  resourcePrices.value = nextPrices
  writeResourcePrices(nextPrices)
}

const resetOcrState = () => {
  ocrState.value = {
    isLoading: false,
    error: '',
    candidates: [],
    rawText: '',
    debugMode: '',
    screenshotDataUrl: '',
    debugRows: [],
  }
  if (ocrFileInput.value) {
    ocrFileInput.value.value = ''
  }
}

const openOcrPicker = () => {
  ocrFileInput.value?.click()
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })

const normalizeOcrLine = (line: string) =>
  line
    .replace(/\s+/g, ' ')
    .replace(/[€$£¥]/g, '')
    .trim()

const loadImageElement = (dataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    if (!import.meta.client) {
      reject(new Error('Image loading is only available in the browser.'))
      return
    }

    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load screenshot image'))
    image.src = dataUrl
  })

const buildProcessedImageDataUrl = async (
  imageBase64: string,
  options: {
    cropLeftRatio?: number
    cropTopRatio?: number
    cropWidthRatio?: number
    cropHeightRatio?: number
    scale?: number
    grayscale?: boolean
    threshold?: number | null
    contrast?: number
    brightness?: number
  }
) => {
  if (!import.meta.client) {
    return imageBase64
  }

  const image = await loadImageElement(imageBase64)
  const cropLeft = Math.max(0, Math.floor(image.width * (options.cropLeftRatio ?? 0)))
  const cropTop = Math.max(0, Math.floor(image.height * (options.cropTopRatio ?? 0)))
  const cropWidth = Math.max(1, Math.floor(image.width * (options.cropWidthRatio ?? 1)))
  const cropHeight = Math.max(1, Math.floor(image.height * (options.cropHeightRatio ?? 1)))
  const scale = options.scale ?? 1

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(cropWidth * scale))
  canvas.height = Math.max(1, Math.floor(cropHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return imageBase64
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    image,
    cropLeft,
    cropTop,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  )

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData
  const contrast = options.contrast ?? 1
  const brightness = options.brightness ?? 0
  const threshold = options.threshold ?? null
  const grayscale = options.grayscale !== false

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    if (grayscale) {
      const gray = r * 0.299 + g * 0.587 + b * 0.114
      r = gray
      g = gray
      b = gray
    }

    r = Math.max(0, Math.min(255, (r - 128) * contrast + 128 + brightness))
    g = Math.max(0, Math.min(255, (g - 128) * contrast + 128 + brightness))
    b = Math.max(0, Math.min(255, (b - 128) * contrast + 128 + brightness))

    if (threshold !== null) {
      const binary = r >= threshold ? 255 : 0
      r = binary
      g = binary
      b = binary
    }

    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

const preprocessImageForPriceOcrClient = async (imageBase64: string) => {
  const image = await loadImageElement(imageBase64)
  const isNarrowPriceCrop = image.width < 220

  return buildProcessedImageDataUrl(imageBase64, {
    cropLeftRatio: isNarrowPriceCrop ? 0 : 0.48,
    cropTopRatio: isNarrowPriceCrop ? 0 : 0.14,
    cropWidthRatio: isNarrowPriceCrop ? 1 : 0.52,
    cropHeightRatio: isNarrowPriceCrop ? 1 : 0.86,
    scale: 3,
    grayscale: true,
    contrast: 1.35,
    threshold: 150,
  })
}

const preprocessStatsImageClient = async (imageBase64: string) =>
  buildProcessedImageDataUrl(imageBase64, {
    scale: 3,
    grayscale: true,
    contrast: 1.15,
    brightness: -10,
    threshold: null,
  })

let tesseractModulePromise: Promise<any> | null = null

const loadTesseractModule = async () => {
  if (!import.meta.client) {
    throw new Error(t('items.detail.ocr.errors.browserOnly'))
  }

  if (!tesseractModulePromise) {
    tesseractModulePromise = import('tesseract.js')
  }

  return tesseractModulePromise
}

const parsePriceFromNumericTokens = (tokens: string[]) => {
  if (!tokens.length) return null

  const normalized = tokens
    .map((token) => token.replace(/[^\d]/g, ''))
    .filter(Boolean)
    .flatMap((token) => {
      if (token.length <= 3) return [token]

      const groups: string[] = []
      let cursor = token
      while (cursor.length > 3) {
        groups.unshift(cursor.slice(-3))
        cursor = cursor.slice(0, -3)
      }
      if (cursor) groups.unshift(cursor)
      return groups
    })

  if (!normalized.length) return null

  for (let start = 0; start < normalized.length; start++) {
    for (let end = normalized.length; end > start; end--) {
      const slice = normalized.slice(start, end)
      if (slice.length < 2) continue
      if (slice[0].length < 1 || slice[0].length > 3) continue
      if (!slice.slice(1).every((part) => part.length === 3)) continue

      const value = Number(slice.join(''))
      if (!Number.isFinite(value) || value < 100000 || value > 100000000) continue

      const hasSingleDigitPrefix = start > 0 && normalized[start - 1].length === 1
      if (hasSingleDigitPrefix || slice[0].length >= 2 || slice.length >= 2) {
        return value
      }
    }
  }

  const standalone = normalized
    .map((token) => Number(token))
    .filter((value) => Number.isFinite(value) && value >= 100000 && value <= 100000000)

  return standalone.length ? Math.max(...standalone) : null
}

const extractListingCandidatesFromWords = (words: OcrWord[]) => {
  const validWords = words
    .filter((word) => word.text?.trim() && word.bbox)
    .map((word) => ({
      text: normalizeOcrLine(word.text || ''),
      confidence: word.confidence ?? 0,
      x0: word.bbox!.x0,
      y0: word.bbox!.y0,
      x1: word.bbox!.x1,
      y1: word.bbox!.y1,
    }))
    .filter((word) => word.text)

  if (!validWords.length) {
    return { candidates: [] as number[], debugRows: [] as typeof ocrState.value.debugRows }
  }

  const maxX = Math.max(...validWords.map((word) => word.x1))
  const maxY = Math.max(...validWords.map((word) => word.y1))
  const listingWords = validWords
    .filter((word) => {
      const lower = word.text.toLowerCase()
      if (/(acheter|prix|moyen|inventaire|banque|havre|sac|niv|niveau|lot)/.test(lower)) {
        return false
      }
      return word.x0 >= maxX * 0.45 && word.y0 >= maxY * 0.18
    })
    .sort((a, b) => {
      if (Math.abs(a.y0 - b.y0) > 6) return a.y0 - b.y0
      return a.x0 - b.x0
    })

  const rows: typeof listingWords[] = []
  for (const word of listingWords) {
    const lastRow = rows.at(-1)
    if (!lastRow) {
      rows.push([word])
      continue
    }
    const lastY = lastRow.reduce((sum, item) => sum + item.y0, 0) / lastRow.length
    if (Math.abs(word.y0 - lastY) <= 10) {
      lastRow.push(word)
    } else {
      rows.push([word])
    }
  }

  const candidates: number[] = []
  const debugRows: typeof ocrState.value.debugRows = []

  for (const row of rows) {
    const rowTokens = row.map((word) => word.text).filter(Boolean)
    const numericTokens = rowTokens
      .filter((token) => /\d/.test(token))
      .map((token) => token.replace(/[^\d]/g, ''))
      .filter((token) => token.length > 0)

    if (!numericTokens.length && !rowTokens.length) continue

    const numeric = parsePriceFromNumericTokens(numericTokens)
    debugRows.push({
      source: 'word',
      raw: rowTokens.join(' '),
      tokens: numericTokens,
      candidate: numeric,
    })

    if (!numeric) continue
    candidates.push(numeric)
  }

  return { candidates, debugRows }
}

const extractListingCandidatesFromText = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeOcrLine)
    .filter(Boolean)

  const candidates: number[] = []
  const debugRows: typeof ocrState.value.debugRows = []

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (
      lower.includes('prix moyen') ||
      lower.includes('quantite en inventaire') ||
      lower.includes('quantite en banque') ||
      lower.includes('quantite en havre-sac') ||
      lower.includes('niv.') ||
      lower.includes('niveau')
    ) {
      continue
    }

    const numericTokens = line.match(/\d+/g) ?? []
    const numeric = parsePriceFromNumericTokens(numericTokens)
    debugRows.push({
      source: 'text',
      raw: line,
      tokens: numericTokens,
      candidate: numeric,
    })

    if (!numeric) continue
    candidates.push(numeric)
  }

  return { candidates, debugRows }
}

const cleanStatLine = (line: string) => {
  let cleaned = normalizeOcrLine(line)
  cleaned = cleaned.replace(/^[^0-9A-Za-zàâäçéèêëîïôöùûüÿœ%+\-\[]+/, '')
  cleaned = cleaned.replace(/^[A-Za-z]{1,2}\s+(?=\d)/, '')
  cleaned = cleaned.replace(/^(\d{1,2})\s+(\d{1,3})(?=\s+[A-Za-zàâäçéèêëîïôöùûüÿœ])/i, '$2')
  cleaned = cleaned.replace(/(\d)\s+%/g, '$1%')
  cleaned = cleaned.replace(/\[\s+/g, '[').replace(/\s+\]/g, ']')
  return cleaned.trim()
}

const parseClientStatLine = (line: string) => {
  const specialDef = findSpecialMageDef(line)
  if (specialDef) {
    const rangeMatch = line.match(/\[[^\]]+\]/)
    const firstNumberMatch = line.match(/-?\d+/)
    const value = firstNumberMatch
      ? Number(firstNumberMatch[0])
      : specialDef.binary
        ? 1
        : null

    return {
      key: specialDef.key,
      label: specialDef.label,
      value: Number.isFinite(value as number) ? value : null,
      suffix: specialDef.suffix || '',
      rangeText: rangeMatch?.[0] || '',
      raw: line,
    }
  }

  const normalized = normalizeLabelForStatKey(line)
  const exactDef = statsOcrDefs.find((def) =>
    [def.label, ...def.aliases].some((alias) => normalizeLabelForStatKey(alias) === normalized),
  )
  const matchedDef = exactDef || statsOcrDefs
    .map((def) => ({
      def,
      matchedAlias: [def.label, ...def.aliases]
        .map((alias) => normalizeLabelForStatKey(alias))
        .find((alias) => hasWholeWordStatAliasMatch(normalized, alias)) || '',
    }))
    .filter((entry) => entry.matchedAlias)
    .sort((a, b) => b.matchedAlias.length - a.matchedAlias.length)[0]?.def

  if (!matchedDef) return null

  const firstNumberMatch = line.match(/-?\d+/)
  const value = firstNumberMatch
    ? Number(firstNumberMatch[0])
    : matchedDef.binary
      ? 1
      : null
  const rangeMatch = line.match(/\[[^\]]+\]/)

  return {
    key: matchedDef.key,
    label: matchedDef.label,
    value: Number.isFinite(value as number) ? value : null,
    suffix: matchedDef.suffix || '',
    rangeText: rangeMatch?.[0] || '',
    raw: line,
  }
}

const extractClientStatEntries = (rawLines: string[]) => {
  const lines = rawLines.map(cleanStatLine).filter(Boolean)
  const candidates = lines.filter((line) => {
    const lower = line.toLowerCase()
    if (lower.includes('niv.') || lower.includes('niveau')) return false
    if (lower.includes('armes') || lower.includes('weapon')) return false
    if (line.length < 4) return false
    if (!/[A-Za-zàâäçéèêëîïôöùûüÿœ]/i.test(line)) return false

    if (/\d/.test(line)) return true

    const normalized = normalizeLabelForStatKey(line)
    return statsOcrDefs.some((def) =>
      def.binary && [def.label, ...def.aliases].some((alias) => normalizeLabelForStatKey(alias) === normalized),
    )
  })

  const unique: Array<StoredObservedPriceEntry['statsEntries'][number]> = []
  const seen = new Set<string>()

  for (const line of candidates) {
    const parsed = parseClientStatLine(line)
    if (!parsed) continue
    const dedupeKey = `${parsed.key}:${parsed.value ?? 'na'}:${parsed.rangeText}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    unique.push(parsed)
  }

  return unique
}

const runClientPriceOcr = async (imageBase64: string) => {
  const { createWorker } = await loadTesseractModule()
  const worker = await createWorker('eng')

  try {
    const ocrInput = await preprocessImageForPriceOcrClient(imageBase64)
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,'-:",
      preserve_interword_spaces: '1',
    })

    const result = await worker.recognize(ocrInput)
    const text = result?.data?.text || ''
    const wordResult = extractListingCandidatesFromWords(result?.data?.words || [])
    const fallbackResult = extractListingCandidatesFromText(text)
    const useWordCandidates = wordResult.candidates.length > 0

    return {
      text,
      candidates: useWordCandidates ? wordResult.candidates : fallbackResult.candidates,
      debugMode: useWordCandidates ? 'word' : 'text',
      debugRows: useWordCandidates ? wordResult.debugRows : fallbackResult.debugRows,
    }
  } finally {
    await worker.terminate()
  }
}

const runClientStatsOcr = async (imageBase64: string) => {
  const { createWorker } = await loadTesseractModule()
  const worker = await createWorker('eng')

  try {
    const ocrInput = await preprocessStatsImageClient(imageBase64)
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzàâäçéèêëîïôöùûüÿœ%+-[]() .,'-:",
      preserve_interword_spaces: '1',
    })

    const result = await worker.recognize(ocrInput)
    const text = result?.data?.text || ''
    const ocrLines = Array.isArray(result?.data?.lines)
      ? result.data.lines.map((line: any) => normalizeOcrLine(line?.text || '')).filter(Boolean)
      : text.split(/\r?\n/).map(normalizeOcrLine).filter(Boolean)

    return {
      text,
      entries: extractClientStatEntries(ocrLines),
    }
  } finally {
    await worker.terminate()
  }
}

const processMarketScreenshotImage = async (imageBase64: string) => {
  ocrState.value = {
    isLoading: true,
    error: '',
    candidates: [],
    rawText: '',
    debugMode: '',
    screenshotDataUrl: '',
    debugRows: [],
  }

  try {
    const result = await runClientPriceOcr(imageBase64)

    ocrState.value = {
      isLoading: false,
      error: result.candidates.length ? '' : t('items.detail.ocr.errors.noPriceCandidates'),
      candidates: result.candidates,
      rawText: result.text,
      debugMode: result.debugMode || '',
      screenshotDataUrl: imageBase64,
      debugRows: result.debugRows || [],
    }
  } catch (error) {
    console.error('Error running OCR:', error)
    ocrState.value = {
      isLoading: false,
      error: t('items.detail.ocr.errors.marketFailed'),
      candidates: [],
      rawText: '',
      debugMode: '',
      screenshotDataUrl: '',
      debugRows: [],
    }
  }
}

const processStatsScreenshotImage = async (imageBase64: string, observationId: string) => {
  const itemKey = selectedObservationKey.value
  if (!itemKey || !observationId) return

  try {
    statsOcrState.value = {
      isLoading: true,
      error: '',
    }

    const result = await runClientStatsOcr(imageBase64)

    updateObservationEntries(itemKey, (entry) =>
      entry.id === observationId
        ? {
            ...entry,
            statsScreenshotDataUrl: imageBase64,
            statsRawText: result.text,
            statsEntries: result.entries,
          }
        : entry
    )

    selectedObservationId.value = observationId
    statsOcrState.value = {
      isLoading: false,
      error: '',
    }
  } catch (error) {
    console.error('Error running stats OCR:', error)
    statsOcrState.value = {
      isLoading: false,
      error: t('items.detail.ocr.errors.statsFailed'),
    }
  } finally {
    pendingStatsObservationId.value = ''
    if (statsScreenshotInput.value) {
      statsScreenshotInput.value.value = ''
    }
  }
}

const readClipboardImageDataUrl = async () => {
  if (!import.meta.client || !navigator.clipboard?.read) {
    throw new Error('Clipboard image reading is not supported here.')
  }

  const clipboardItems = await navigator.clipboard.read()
  for (const item of clipboardItems) {
    const imageType = item.types.find((type) => type.startsWith('image/'))
    if (!imageType) continue
    const blob = await item.getType(imageType)
    return await readFileAsDataUrl(new File([blob], `clipboard.${imageType.split('/')[1] || 'png'}`, { type: imageType }))
  }

  throw new Error('No image found in clipboard.')
}

const pasteMarketScreenshot = async () => {
  try {
    const imageBase64 = await readClipboardImageDataUrl()
    await processMarketScreenshotImage(imageBase64)
  } catch (error) {
    console.error('Error pasting market screenshot:', error)
    ocrState.value = {
      ...ocrState.value,
      isLoading: false,
      error: 'Failed to paste an image from the clipboard.',
    }
  }
}

const pasteStatsScreenshot = async (observationId: string) => {
  try {
    const imageBase64 = await readClipboardImageDataUrl()
    await processStatsScreenshotImage(imageBase64, observationId)
  } catch (error) {
    console.error('Error pasting stats screenshot:', error)
    statsOcrState.value = {
      isLoading: false,
      error: 'Failed to paste an image from the clipboard.',
    }
  }
}

const handleGlobalPaste = async (event: ClipboardEvent) => {
  if (!import.meta.client) return

  const target = event.target as HTMLElement | null
  const tagName = target?.tagName?.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
    return
  }

  const item = Array.from(event.clipboardData?.items || []).find((entry) => entry.type.startsWith('image/'))
  if (!item) return

  const file = item.getAsFile()
  if (!file) return

  event.preventDefault()
  const imageBase64 = await readFileAsDataUrl(file)

  if (selectedObservationDetail.value) {
    await processStatsScreenshotImage(imageBase64, selectedObservationDetail.value.id)
    return
  }

  if (selectedRecipeItem.value) {
    await processMarketScreenshotImage(imageBase64)
  }
}

const buildObservationStatsSignature = (statsEntries: StoredObservedPriceEntry['statsEntries']) =>
  statsEntries
    .filter((entry) => entry.key && entry.value !== null && entry.value !== undefined)
    .map((entry) => `${entry.key}:${entry.value}`)
    .sort((a, b) => a.localeCompare(b))
    .join('|')

const isDuplicateObservedEntry = (
  candidate: Pick<StoredObservedPriceEntry, 'price' | 'statsEntries' | 'createdAt' | 'source' | 'marketScreenshotDataUrl'>,
  existing: StoredObservedPriceEntry
) => {
  if (candidate.price !== existing.price) return false

  const candidateSignature = buildObservationStatsSignature(candidate.statsEntries)
  const existingSignature = buildObservationStatsSignature(existing.statsEntries)

  if (candidateSignature !== existingSignature) return false

  if (!candidateSignature && candidate.source === 'ocr' && existing.source === 'ocr') {
    if (!candidate.marketScreenshotDataUrl || candidate.marketScreenshotDataUrl !== existing.marketScreenshotDataUrl) {
      return false
    }
  }

  const candidateTime = new Date(candidate.createdAt).getTime()
  const existingTime = new Date(existing.createdAt).getTime()
  const diffMs = Math.abs(candidateTime - existingTime)

  return diffMs <= 15 * 60 * 1000
}

const handleOcrFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const imageBase64 = await readFileAsDataUrl(file)
  await processMarketScreenshotImage(imageBase64)
}

const saveOcrSnapshotPrices = async () => {
  const item = selectedRecipeItem.value
  const itemKey = selectedObservationKey.value

  if (!item || !itemKey || !ocrState.value.screenshotDataUrl || !ocrState.value.candidates.length) {
    return
  }

  const existing = observedPrices.value[itemKey] || []
  const createdAt = new Date().toISOString()
  const candidateEntries = ocrState.value.candidates.map((price) => ({
    id: `${itemKey}-${price}-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    itemKey,
    itemName: item.name,
    price,
    createdAt,
    source: 'ocr' as const,
    marketScreenshotDataUrl: ocrState.value.screenshotDataUrl,
    statsScreenshotDataUrl: '',
    statsRawText: '',
    statsEntries: [],
  }))

  const additions = candidateEntries.filter((candidate) =>
    !existing.some((entry) => isDuplicateObservedEntry(candidate, entry))
  )

  if (!additions.length) {
    return
  }

  const nextObserved = {
    ...observedPrices.value,
    [itemKey]: [...additions, ...existing],
  }

  observedPrices.value = nextObserved
  writeObservedPrices(nextObserved)
  if (selectedServer.value?.id && selectedCharacter.value?.id) {
    appendActivity({
      type: 'items',
      action: 'observations-saved',
      createdAt,
      serverId: String(selectedServer.value.id),
      characterId: String(selectedCharacter.value.id),
      title: item.name,
      description: `Saved ${additions.length} observed price${additions.length > 1 ? 's' : ''}`,
      path: '/items',
      imageUrl: item.image_url || item.img || '',
      meta: {
        itemKey,
        count: additions.length,
      },
    })
  }
  await scrollSectionIntoView(() => observedPricesComp.value?.sectionEl)
}

const focusObservedBestBuys = async () => {
  observedSortMode.value = 'best_buy'
  showObservedPrices.value = true
  await scrollSectionIntoView(() => observedPricesComp.value?.sectionEl)
}

const sendObservationToResaleTracker = (observation: StoredObservedPriceEntry) => {
  if (!selectedServer.value?.id || !selectedCharacter.value?.id) {
    resaleTrackerFeedback.value = {
      ...resaleTrackerFeedback.value,
      [observation.id]: 'Select a server and character first.',
    }
    return
  }

  if (resaleTrackedObservationIds.value.has(observation.id)) {
    resaleTrackerFeedback.value = {
      ...resaleTrackerFeedback.value,
      [observation.id]: 'This listing is already in the resale tracker.',
    }
    return
  }

  const valuation = allObservedValuationMap.value[observation.id]
  const item = selectedRecipeItem.value
  const itemKey = selectedObservationKey.value || observation.itemKey
  const targetRelistPrice = valuation?.fairRelist ?? valuation?.quickRelist ?? observation.price
  const estimatedProfit = Math.max(0, targetRelistPrice - observation.price)

  createResaleTrackerEntry({
    itemKey,
    itemId: item?.id ?? null,
      itemName: observation.itemName || item?.name || t('items.detail.common.unknownItem'),
    itemImageUrl: item?.image_url ?? item?.img ?? '',
    status: 'watched',
    source: 'observed',
    serverId: String(selectedServer.value.id),
    characterId: String(selectedCharacter.value.id),
    boughtAt: null,
    listedAt: null,
    soldAt: null,
    cancelledAt: null,
    buyPrice: observation.price,
    listPrice: targetRelistPrice,
    targetPrice: valuation?.fairValue ?? targetRelistPrice,
    soldPrice: 0,
    estimatedFairValue: valuation?.fairValue ?? observation.price,
    estimatedQuickRelist: valuation?.quickRelist ?? observation.price,
    estimatedGreedyRelist: valuation?.greedyRelist ?? observation.price,
    estimatedScore: valuation?.score ?? computeObservationScore(observation),
    estimatedDelta: estimatedProfit,
    observedListingId: observation.id,
    marketScreenshotDataUrl: observation.marketScreenshotDataUrl || '',
    statsScreenshotDataUrl: observation.statsScreenshotDataUrl || '',
    statsEntries: observation.statsEntries.map((entry) => ({ ...entry })),
    notes: valuation
      ? `Tracked from Prices. Observed at ${formatKamasFull(observation.price)}. Suggested relist ${formatKamasFull(targetRelistPrice)}. Estimated gross profit ${formatKamasFull(estimatedProfit)}.`
      : '',
  })

  resaleTrackerFeedback.value = {
    ...resaleTrackerFeedback.value,
    [observation.id]: t('items.detail.observed.feedback.savedToResale'),
  }
  appendActivity({
    type: 'items',
    action: 'sent-to-resale',
    serverId: String(selectedServer.value.id),
    characterId: String(selectedCharacter.value.id),
    title: observation.itemName || item?.name || t('items.detail.common.unknownItem'),
    description: t('items.detail.observed.feedback.sentToResaleActivity'),
    path: '/items',
    imageUrl: item?.image_url || item?.img || '',
    meta: {
      observationId: observation.id,
      itemKey,
      price: observation.price,
    },
  })
}

const removeObservation = (observationId: string) => {
  const itemKey = selectedObservationKey.value
  if (!itemKey) return
  const removedObservation = (observedPrices.value[itemKey] || []).find((entry) => entry.id === observationId) || null
  const item = selectedRecipeItem.value

  const nextObserved = {
    ...observedPrices.value,
    [itemKey]: (observedPrices.value[itemKey] || []).filter((entry) => entry.id !== observationId),
  }

  observedPrices.value = nextObserved
  writeObservedPrices(nextObserved)
  if (selectedObservationId.value === observationId) {
    selectedObservationId.value = ''
  }
  if (removedObservation && selectedServer.value?.id && selectedCharacter.value?.id) {
    appendActivity({
      type: 'items',
      action: 'observation-removed',
      serverId: String(selectedServer.value.id),
      characterId: String(selectedCharacter.value.id),
      title: removedObservation.itemName || item?.name || t('items.detail.common.unknownItem'),
      description: t('items.detail.observed.feedback.removedActivity'),
      path: '/items',
      imageUrl: item?.image_url || item?.img || '',
      meta: {
        observationId,
        itemKey,
        price: removedObservation.price,
      },
    })
  }
}

const clearObservationScreenshots = (
  observationId: string,
  options: { market?: boolean; stats?: boolean } = { market: true, stats: true },
) => {
  const itemKey = selectedObservationKey.value
  if (!itemKey) return

  const removeMarket = options.market ?? false
  const removeStats = options.stats ?? false
  if (!removeMarket && !removeStats) return

  updateObservationEntries(itemKey, (entry) => {
    if (entry.id !== observationId) return entry
    return {
      ...entry,
      marketScreenshotDataUrl: removeMarket ? '' : entry.marketScreenshotDataUrl,
      statsScreenshotDataUrl: removeStats ? '' : entry.statsScreenshotDataUrl,
      statsRawText: removeStats ? '' : entry.statsRawText,
    }
  })
}

const clearAllObservationScreenshots = () => {
  const itemKey = selectedObservationKey.value
  const summary = selectedItemScreenshotSummary.value
  if (!itemKey || !summary.totalCount) return
  if (!confirm(t('items.detail.observed.confirm.clearScreenshots', { count: summary.totalCount }))) return

  updateObservationEntries(itemKey, (entry) => ({
    ...entry,
    marketScreenshotDataUrl: '',
    statsScreenshotDataUrl: '',
    statsRawText: '',
  }))
}

const removeAllObservations = () => {
  const itemKey = selectedObservationKey.value
  if (!itemKey) return
  if (!confirm(t('items.detail.observed.confirm.removeAll', { count: (observedPrices.value[itemKey] || []).length }))) return

  const nextObserved = { ...observedPrices.value, [itemKey]: [] }
  observedPrices.value = nextObserved
  writeObservedPrices(nextObserved)
  selectedObservationId.value = ''
}

const openStatsScreenshotPicker = (observationId: string) => {
  pendingStatsObservationId.value = observationId
  statsScreenshotInput.value?.click()
}

const openObservationDetail = (observationId: string) => {
  selectedObservationId.value = observationId
  observationDetailTab.value = 'stats'
}

const closeObservationDetail = () => {
  selectedObservationId.value = ''
  observationDetailTab.value = 'stats'
  statsOcrState.value = {
    isLoading: false,
    error: '',
  }
}

const updateObservationEntries = (
  itemKey: string,
  updater: (entry: StoredObservedPriceEntry) => StoredObservedPriceEntry
) => {
  const nextObserved = {
    ...observedPrices.value,
    [itemKey]: (observedPrices.value[itemKey] || []).map((entry) => updater(entry)),
  }

  observedPrices.value = nextObserved
  writeObservedPrices(nextObserved)
}

const updateObservationStatValue = (index: number, value: string) => {
  const itemKey = selectedObservationKey.value
  const observationId = selectedObservationId.value
  if (!itemKey || !observationId) return

  updateObservationEntries(itemKey, (entry) => {
    if (entry.id !== observationId) return entry
    const nextEntries = entry.statsEntries.slice()
    nextEntries[index] = {
      ...nextEntries[index],
      value: value === '' ? null : Number(value),
    }
    return {
      ...entry,
      statsEntries: nextEntries,
    }
  })
}

const updateObservationStatKey = (index: number, key: string) => {
  const itemKey = selectedObservationKey.value
  const observationId = selectedObservationId.value
  if (!itemKey || !observationId) return

  const option = observationStatOptions.find((entry) => entry.key === key)
  if (!option) return

  updateObservationEntries(itemKey, (entry) => {
    if (entry.id !== observationId) return entry
    const nextEntries = entry.statsEntries.slice()
    nextEntries[index] = {
      ...nextEntries[index],
      key: option.key,
      label: option.label,
      suffix: option.suffix,
    }
    return {
      ...entry,
      statsEntries: nextEntries,
    }
  })
}

const addObservationStatEntry = () => {
  const itemKey = selectedObservationKey.value
  const observationId = selectedObservationId.value
  if (!itemKey || !observationId) return

  const defaultOption = observationStatOptions[0]
  updateObservationEntries(itemKey, (entry) => {
    if (entry.id !== observationId) return entry
    return {
      ...entry,
      statsEntries: [
        ...entry.statsEntries,
        {
          key: defaultOption.key,
          label: defaultOption.label,
          value: null,
          suffix: defaultOption.suffix,
          rangeText: '',
          isManual: true,
        },
      ],
    }
  })
}

const addExpectedObservationStat = async (expectedKey: string) => {
  const itemKey = selectedObservationKey.value
  const observationId = selectedObservationId.value
  if (!itemKey || !observationId) return

  const expected = currentExpectedObservationStats.value.find((entry) => entry.key === expectedKey)
  if (!expected) return

  updateObservationEntries(itemKey, (entry) => {
    if (entry.id !== observationId) return entry
    if (entry.statsEntries.some((line) => line.key === expected.key)) return entry

    return {
      ...entry,
      statsEntries: [
        ...entry.statsEntries,
        {
          key: expected.key,
          label: expected.label,
          value: null,
          suffix: expected.suffix,
          rangeText: expected.rangeText,
          isManual: true,
        },
      ],
    }
  })
  await scrollSectionIntoView(() => observationDetailComp.value?.exactStatsEl)
}

const removeObservationStatEntry = (index: number) => {
  const itemKey = selectedObservationKey.value
  const observationId = selectedObservationId.value
  if (!itemKey || !observationId) return

  updateObservationEntries(itemKey, (entry) => {
    if (entry.id !== observationId) return entry
    return {
      ...entry,
      statsEntries: entry.statsEntries.filter((_, lineIndex) => lineIndex !== index),
    }
  })
}

const handleStatsScreenshotChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  const observationId = pendingStatsObservationId.value

  if (!file || !observationId) return
  const imageBase64 = await readFileAsDataUrl(file)
  await processStatsScreenshotImage(imageBase64, observationId)
}

const formatPriceFreshness = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return t('items.detail.priceManager.freshness.ltHour')
  if (diffHours < 24) return t('items.detail.priceManager.freshness.hours', { count: diffHours })
  const diffDays = Math.floor(diffHours / 24)
  return t('items.detail.priceManager.freshness.days', { count: diffDays })
}

const resetRecipeView = () => {
  selectedRecipeItem.value = null
  selectedRecipeSellPrice.value = 0
  selectedObservationId.value = ''
  showPriceManager.value = false
  resetOcrState()
  recipeLookupState.value = {
    isLoading: false,
    error: '',
    data: null,
    source: '',
    confidence: '',
  }
}

const resetAggregateRecipeView = () => {
  aggregateResourceFilters.hideSpecial = false
  aggregateResourceFilters.onlyMonsterDrops = false
  aggregateResourceFilters.onlyNonCrafted = false
  aggregateResourceFilters.minItemUsage = 1
  aggregateRecipeState.value = {
    ...aggregateRecipeState.value,
    isOpen: false,
    isLoading: false,
    error: '',
    data: [],
    selectedItems: [],
  }
}

const loadRecipeIntoView = async (
  item: { name: string; image_url?: string | null; count: number },
  options: { forceRefresh?: boolean } = {}
) => {
  resetAggregateRecipeView()
  selectedRecipeItem.value = item
  recipeLookupState.value = {
    isLoading: true,
    error: '',
    data: null,
    source: '',
    confidence: '',
  }

  try {
    const result = await fetchResolvedRecipe(item, options)

    recipeLookupState.value = {
      isLoading: false,
      error: '',
      data: result.recipe,
      source: result.source,
      confidence: result.confidence,
    }
  } catch (error) {
    console.error('Error fetching recipe:', error)
    recipeLookupState.value = {
      isLoading: false,
      error: t('items.detail.recipe.errors.loadFailed'),
      data: null,
      source: '',
      confidence: '',
    }
  }
}

const openRecipeView = async (item: { name: string; image_url?: string | null; count: number }) => {
  await loadRecipeIntoView(item)
}

const refetchSelectedRecipe = async () => {
  if (!selectedRecipeItem.value) return
  await loadRecipeIntoView(selectedRecipeItem.value, { forceRefresh: true })
}

const openAggregateRecipeView = async (limit: number) => {
  resetRecipeView()

  const selectedItems = (currentSlotStats.value?.topItems ?? []).slice(0, limit)

  aggregateRecipeState.value = {
    ...aggregateRecipeState.value,
    isOpen: true,
    isLoading: true,
    error: '',
    data: [],
    limit,
    selectedItems,
  }

  if (!selectedItems.length) {
    aggregateRecipeState.value = {
      ...aggregateRecipeState.value,
      isLoading: false,
      error: t('items.aggregate.errors.noItems'),
    }
    return
  }

  try {
    const recipes = await Promise.all(
      selectedItems.map(async (item) => {
        const result = await fetchResolvedRecipe(item)

        return {
          item,
          recipe: result.recipe,
        }
      })
    )

    aggregateRecipeState.value = {
      ...aggregateRecipeState.value,
      isLoading: false,
      data: recipes,
    }
  } catch (error) {
    console.error('Error fetching aggregate recipes:', error)
    aggregateRecipeState.value = {
      ...aggregateRecipeState.value,
      isLoading: false,
      error: 'Failed to load aggregate recipe data.',
      data: [],
    }
  }
}

const processData = (equipments: any[]) => {
  const slotStats: Record<string, { items: Record<string, number>; itemDetails: Record<string, any> }> = {}
  SLOT_GROUPS.forEach(s => { slotStats[s.key] = { items: {}, itemDetails: {} } })

  equipments.forEach(eq => {
    if (!eq.items) return
    const seenItemsByGroup: Record<string, Set<string>> = {}
    Object.entries(eq.items).forEach(([slotKey, item]: [string, any]) => {
      const groupKey = SLOT_KEY_TO_GROUP[slotKey] ?? slotKey
      if (!item?.name || !slotStats[groupKey]) return
      if (!seenItemsByGroup[groupKey]) seenItemsByGroup[groupKey] = new Set<string>()
      if (seenItemsByGroup[groupKey].has(item.name)) return

      seenItemsByGroup[groupKey].add(item.name)
      slotStats[groupKey].items[item.name] = (slotStats[groupKey].items[item.name] ?? 0) + 1
      if (!slotStats[groupKey].itemDetails[item.name]) {
        slotStats[groupKey].itemDetails[item.name] = { image_url: item.image_url ?? null, item }
      }
    })
  })

  // Build sorted topItems per slot
  const processedSlots: Record<string, any> = {}
  SLOT_GROUPS.forEach(s => {
    const raw = slotStats[s.key]
    const topItems = Object.entries(raw.items)
      .map(([name, count]) => ({ name, count, image_url: raw.itemDetails[name]?.image_url ?? null, rawItem: raw.itemDetails[name]?.item ?? null }))
      .sort((a, b) => b.count - a.count)
    processedSlots[s.key] = { topItems, totalItems: topItems.length }
  })

  const allItems = new Set<string>()
  SLOT_GROUPS.forEach(s => { Object.keys(slotStats[s.key].items).forEach(n => allItems.add(n)) })

  let mostPopularSlot: { slot: string; count: number } | null = null
  SLOT_GROUPS.forEach(s => {
    const c = Object.keys(slotStats[s.key].items).length
    if (!mostPopularSlot || c > mostPopularSlot.count) {
      mostPopularSlot = { slot: t(`items.slots.${s.key}`), count: c }
    }
  })

  const total = equipments.length
  const totalItemsUsed = equipments.reduce((sum, eq) => {
    if (!eq?.items) return sum
    return sum + Object.values(eq.items).filter((item: any) => item?.name).length
  }, 0)

  stats.value = {
    slotStats: processedSlots,
    totalEquipments: total,
    uniqueItems: allItems.size,
    mostPopularSlot,
    avgItemsPerSet: total > 0 ? totalItemsUsed / total : 0,
  }
}

let hasRestoredFromUrl = false

const restoreFromUrl = async () => {
  if (hasRestoredFromUrl) return
  hasRestoredFromUrl = true

  const slot = route.query.slot as string | undefined
  const itemName = route.query.item as string | undefined
  const obsId = route.query.obs as string | undefined

  if (!slot && !itemName && !obsId) return

  if (slot && SLOT_GROUPS.some(s => s.key === slot)) {
    activeSlot.value = slot
  }

  if (itemName) {
    await nextTick()
    const slotKey = slot || activeSlot.value
    const found = getSlotStats(slotKey)?.topItems?.find((i: any) => i.name === itemName)
    if (found) await loadRecipeIntoView(found)
  }

  if (obsId) {
    selectedObservationId.value = obsId
    observationDetailTab.value = 'stats'
  }
}

const fetchData = async () => {
  loading.value = true
  stats.value = null
  resetRecipeView()
  resetAggregateRecipeView()
  try {
    const qs = buildQuery()
    const res = await $fetch<any>(`/api/items/items${qs ? '?' + qs : ''}`)
    processData(res?.docs ?? [])
    await restoreFromUrl()
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
}

const noImg = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

const formatKamasFull = (value: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(value || 0))

const openGuide = (mode: 'main' | 'recipe') => {
  guideMode.value = mode
  guideOpen.value = true
}

onMounted(() => {
  filtersCollapsed.value = localStorage.getItem('items-filters-collapsed') === 'true'
  resourcePrices.value = readResourcePrices()
  observedPrices.value = readObservedPrices()
  effectCache.value = readEffectCache()
  itemStatPriorities.value = readItemStatPriorities()
  window.addEventListener('paste', handleGlobalPaste)
  fetchData()
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('paste', handleGlobalPaste)
})

watch(activeSlot, (slot) => {
  resetRecipeView()
  resetAggregateRecipeView()
  router.replace({ query: { slot } })
})

watch(() => selectedRecipeItem.value?.name, (name) => {
  const q: Record<string, string> = { slot: activeSlot.value }
  if (name) q.item = name
  router.replace({ query: q })
})

watch(selectedObservationId, (id) => {
  const q: Record<string, string> = { slot: activeSlot.value }
  if (selectedRecipeItem.value?.name) q.item = selectedRecipeItem.value.name
  if (id) q.obs = id
  router.replace({ query: q })
})

watch(
  () => recipeLookupState.value.data?.result?.effects,
  async (effects) => {
    await ensureEffectLabels(effects)
  },
  { immediate: true }
)

watch(
  () => [selectedRecipeItem.value?.name, currentItemEffectMappings.value],
  ([itemName, mappings]) => {
    if (!import.meta.client || !itemName || !mappings.length) return
    console.groupCollapsed(`[items:v2] DofusDB effect mapping for ${itemName}`)
    mappings.forEach((entry) => {
      console.log({
        effectId: entry.effectId,
        rawLabel: entry.rawLabel,
        rangeText: entry.rangeText,
        matched: entry.matched,
        ignoredForObservation: entry.ignoredForObservation,
        matchedKey: entry.matchedKey || null,
        matchedLabel: entry.matchedLabel || null,
      })
    })
    console.groupEnd()
  },
  { immediate: true }
)
</script>
