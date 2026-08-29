<template>
  <div class="flex flex-col gap-5">
    <ItemsFilterBar
      v-model:collapsed="filtersCollapsed"
      :filters="filters"
      @set="setFilter"
    />

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
        <div v-if="selectedRecipeItem" class="flex flex-col gap-4">
          <ItemsRecipeHeader
            :item="selectedRecipeItem"
            :slot-label="$t(`items.slots.${activeSlot}`)"
            :confidence="recipeLookupState.confidence"
            :source="recipeLookupState.source"
            :ocr-loading="ocrState.isLoading"
            :ocr-error="ocrState.error"
            :saved-price-count="selectedItemObservations.length"
            @back="resetRecipeView"
            @refetch="refetchSelectedRecipe"
            @image="captureMarketScreenshot"
          />

          <ItemsLiveCapture
            :armed="liveCaptureArmed"
            :log="liveCaptureLog"
            :error="liveCaptureError"
            :item-name="selectedRecipeItem?.name || ''"
            @update:armed="setLiveCaptureArmed"
          />

          <ItemsGlyphTeacher :sample="lastPriceStrip" />

          <div v-if="recipeLookupState.isLoading" class="flex flex-col gap-2">
            <UiSkeleton v-for="i in 4" :key="i" height="3rem" />
          </div>

          <p v-else-if="recipeLookupState.error" class="text-xs text-negative">
            {{ $t('items.detail.recipe.loadError') }}
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
              :priority-rows="statPriorityRows"
              :unmatched-lines="ocrUnmatchedLines"
              @back="closeObservationDetail"
              @use-as-sell-price="selectedRecipeSellPrice = $event"
              @send-to-tracker="sendObservationToResaleTracker(selectedObservationDetail)"
              @add-expected-stat="addExpectedObservationStat"
              @add-stat-entry="addObservationStatEntry"
              @update-stat-key="updateObservationStatKey"
              @update-stat-value="updateObservationStatValue"
              @remove-stat-entry="removeObservationStatEntry"
              @set-priority="setStatPriority"
              @reset-priorities="clearStatPriorities"
            />

            <ItemsObservedPrices
              v-else-if="selectedItemObservations.length"
              ref="observedPricesComp"
              v-model:expanded="showObservedPrices"
              v-model:sort-mode="observedSortMode"
              v-model:only-undervalued="showOnlyUndervaluedListings"
              v-model:full-sweep="fullSweepCapture"
              v-model:show-table="showAdvancedValuationTable"
              v-model:capture-row-id="statsCaptureRowId"
              :observations="selectedItemObservations"
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
              :stats-loading="statsOcrState.isLoading"
              :format-kamas="formatKamasFull"
              @use-as-sell-price="selectedRecipeSellPrice = $event"
              @open-detail="openObservationDetail"
              @stats-image="captureStatsScreenshot"
              @send-to-tracker="sendObservationToResaleTracker"
              @remove="removeObservation"
              @remove-all="removeAllObservations"
              @export="exportCurrentItem"
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

    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="undoState"
        class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-md border border-line bg-raised px-3 py-2 text-sm shadow-md"
        role="status"
      >
        <span class="text-ink">{{ t('items.detail.capture.saved', { count: undoState.count }) }}</span>
        <UiButton variant="ghost" size="sm" @click="undoLastScan">
          {{ $t('items.detail.capture.undo') }}
        </UiButton>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useResaleTracker } from '~/composables/useResaleTracker'
import {
  readClipboardImageDataUrl,
  readFileAsDataUrl,
  runPriceOcr,
  runStatsOcr,
} from '~/composables/useScreenshotOcr'
import {
  CHARACTERISTIC_TO_STAT_KEY,
  WEAPON_ATTACK_EFFECT_CATEGORY,
  findSpecialMageDef,
  hasWholeWordStatAliasMatch,
  normalizeLabelForStatKey,
  specialMageStatKeys,
  statsOcrDefs,
} from '~/utils/itemStats'
import { buildItemExport, itemExportFilename } from '~/utils/itemExport'
import {
  checkPriceAgainst,
  cropDataUrl,
  imageSize,
  pickPriceFromStrip,
  priceStripRect,
  readPriceByGlyphs,
  readPagePrices,
  readPriceByReconstruction,
  tooltipRect,
  trimToTextBand,
  trimToTooltipPanel,
} from '~/utils/captureCrop'
import { resolveCaptureIdentity } from '~/utils/captureIdentity'
import {
  defaultPriceModelConfig,
  describeRequirement,
  emptyPriorityProfiles,
  migrateObservation,
  parseObservationRange,
  reconcileObservations,
  statPriorityPresets,
  summariseFailures,
  valueObservations,
} from '~/utils/itemValuation'
import type {
  ExpectedLine,
  PriorityProfiles,
  StatPriority,
  ValuedObservation,
} from '~/utils/itemValuation'

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

const loading = ref(false)
const activeSlot = ref('ar')
const viewMode = ref<'grid' | 'list' | 'table'>('grid')
const stats = ref<any>(null)
const selectedRecipeItem = ref<any>(null)
const selectedRecipeSellPrice = ref(0)
/** Which price row has its inline stats capture open, so a stray Ctrl+V lands
 *  on that row instead of the item. */
const statsCaptureRowId = ref('')
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
  /** Which server's market this was seen on. Empty on pre-scoping rows. */
  serverId?: string
  price: number
  createdAt: string
  source: 'ocr'
  /** True when nothing existed to check this price against when it was saved. */
  priceUnverified?: boolean
  /** Short digest of the screenshot this price came from. Lets a rescan of the
   *  same image dedupe without keeping the image itself. */
  scanHash?: string
  statsRawText?: string
  statsEntries: Array<{
    key: string
    label: string
    value: number | null
    suffix: string
    rangeText: string
    raw?: string
    isManual?: boolean
    /** 0..1 match confidence, kept so a weak read stays distinguishable. */
    confidence?: number
    matchSource?: 'expected' | 'catalogue'
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


const DOFUSDB_RECIPE_CACHE_KEY = 'dofus-items-dofusdb-recipe-cache-v1'
const ITEM_RESOURCE_PRICES_KEY = 'dofus-items-resource-prices-v1'
const ITEM_OBSERVED_PRICES_KEY = 'dofus-items-observed-prices-v2'
const ITEM_OBSERVED_PRICES_KEY_V1 = 'dofus-items-observed-prices-v1'
const DOFUS_EFFECT_CACHE_KEY = 'dofus-items-effect-cache-v1'
const ITEM_STAT_PRIORITY_KEY = 'dofus-items-stat-priority-v2'
const ITEM_STAT_PRIORITY_KEY_V1 = 'dofus-items-stat-priority-v1'
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
const observedSortMode = ref<'newest' | 'price_asc' | 'price_desc' | 'net_profit' | 'quality' | 'best_buy'>('newest')
const showOnlyUndervaluedListings = ref(false)
/**
 * Whether a price capture covers every listing for the item.
 *
 * Off by default and deliberately opt-in: reading disappearance as a sale is
 * only sound when the capture was exhaustive, and guessing wrong would seed the
 * price history with sales that never happened.
 */
const fullSweepCapture = ref(false)
/**
 * Kamas available to spend, used to turn the ranked list into a purchase plan.
 *
 * Zero by default and left that way until the user says otherwise: an assumed
 * bankroll would produce a confident plan for money that may not exist.
 */
const itemsBankroll = ref(0)
const ITEMS_BANKROLL_KEY = 'dofus-items-bankroll-v1'
// Declared here rather than beside the other watchers near the top of the file:
// a `watch` on a ref that has not been initialised yet is a temporal dead zone
// error, and it took the whole page down with a 500 rather than failing where
// it was written.
watch(itemsBankroll, (value) => {
  if (import.meta.client) localStorage.setItem(ITEMS_BANKROLL_KEY, String(value || 0))
})
/**
 * Lines the last scan read but could not confidently assign to a stat.
 *
 * Surfaced rather than dropped: silently discarding an unreadable line is how
 * a missing stat goes unnoticed until the valuation is already wrong.
 */
const ocrUnmatchedLines = ref<Array<{ raw: string; bestGuessKey: string; bestScore: number }>>([])
/**
 * Prices the last manual save refused as out of line with this item.
 *
 * Surfaced rather than dropped silently: a rejected candidate is usually a
 * truncated read of a real listing, so it tells you the crop needs redoing.
 */
const ocrRejectedPrices = ref<number[]>([])
const effectCache = ref<Record<string, CachedEffectEntry>>({})
const statPriorityProfiles = ref<PriorityProfiles>(emptyPriorityProfiles())
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
/**
 * The stat picker's options, derived from the one catalogue rather than
 * hand-maintained beside it. The two lists were byte-identical, but nothing
 * kept them that way — a stat added to `statsOcrDefs` alone would have matched
 * during OCR and then had no option to correct it to.
 */
const observationStatOptions = statsOcrDefs.map((def) => ({
  key: def.key,
  label: def.label,
  suffix: def.suffix || '',
}))
const setFilter = (key: keyof typeof filters, val: string) => {
  filters[key] = val
  fetchData()
}

const getSlotStats = (slotKey: string) => stats.value?.slotStats?.[slotKey] ?? null

const currentSlotStats = computed(() => getSlotStats(activeSlot.value))

const craftingSessionsKey = computed(() => {
  if (!selectedServer.value?.id || !selectedCharacter.value?.id) return ''
  return `${CRAFT_FM_SESSIONS_KEY_PREFIX}${selectedServer.value.id}_${selectedCharacter.value.id}`
})

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
    // v2 added the sale-tracking fields. Fall back to the v1 store so an
    // existing price history survives the upgrade untouched.
    const raw = localStorage.getItem(ITEM_OBSERVED_PRICES_KEY)
      ?? localStorage.getItem(ITEM_OBSERVED_PRICES_KEY_V1)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}

    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [
        key,
        Array.isArray(value)
          // Rebuilt field by field rather than spread, so the screenshot data
          // URLs older versions stored are dropped here rather than carried
          // forward invisibly.
          ? value.map((entry: any) => ({
              id: entry?.id,
              itemKey: entry?.itemKey,
              itemName: entry?.itemName,
              // Absent on rows written before servers were recorded. Left
              // empty rather than filled in with the server that happens to be
              // selected now — an assumed provenance is still a fabrication,
              // and unknown already means "comparable with anything".
              serverId: typeof entry?.serverId === 'string' ? entry.serverId : '',
              price: entry?.price,
              createdAt: entry?.createdAt,
              source: entry?.source,
              priceUnverified: entry?.priceUnverified === true,
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
              scanHash: typeof entry?.scanHash === 'string' ? entry.scanHash : '',
              status: entry?.status,
              firstSeenAt: entry?.firstSeenAt,
              lastSeenAt: entry?.lastSeenAt,
              signatureHash: entry?.signatureHash,
            }))
            .map((entry: any) => migrateObservation(entry))
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

/** Maps the v1 numeric multipliers onto the named priorities that replaced them. */
const priorityFromLegacyMultiplier = (multiplier: number): StatPriority => {
  if (multiplier <= 0) return 'ignore'
  if (multiplier < 1) return 'low'
  if (multiplier < 1.5) return 'normal'
  if (multiplier < 2) return 'high'
  return 'critical'
}

const readStatPriorityProfiles = (): PriorityProfiles => {
  if (!import.meta.client) return emptyPriorityProfiles()

  try {
    const raw = localStorage.getItem(ITEM_STAT_PRIORITY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        return {
          global: parsed.global && typeof parsed.global === 'object' ? parsed.global : {},
          byItem: parsed.byItem && typeof parsed.byItem === 'object' ? parsed.byItem : {},
        }
      }
    }

    // Nothing in v2 yet: carry across whatever the numeric v1 store held, so a
    // user who tuned priorities before doesn't silently lose them.
    const legacyRaw = localStorage.getItem(ITEM_STAT_PRIORITY_KEY_V1)
    if (!legacyRaw) return emptyPriorityProfiles()
    const legacy = JSON.parse(legacyRaw)
    if (!legacy || typeof legacy !== 'object') return emptyPriorityProfiles()

    const byItem: Record<string, Record<string, StatPriority>> = {}
    for (const [itemKey, stats] of Object.entries(legacy as Record<string, Record<string, number>>)) {
      if (!stats || typeof stats !== 'object') continue
      const mapped: Record<string, StatPriority> = {}
      for (const [statKey, multiplier] of Object.entries(stats)) {
        if (typeof multiplier !== 'number' || multiplier === 1) continue
        mapped[statKey] = priorityFromLegacyMultiplier(multiplier)
      }
      if (Object.keys(mapped).length) byItem[itemKey] = mapped
    }
    return { global: {}, byItem }
  } catch {
    return emptyPriorityProfiles()
  }
}

const writeStatPriorityProfiles = (profiles: PriorityProfiles) => {
  if (!import.meta.client) return
  localStorage.setItem(ITEM_STAT_PRIORITY_KEY, JSON.stringify(profiles))
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

/** DofusDB descriptions are templates like `#1{{~1~2 à }}#2 Dommage{{~ps}}{{~zs}}`.
 *  `#1`/`#2` are the bounds; a `{{~1~2 ...}}` group is kept only when the two
 *  differ, and `{{~ps}}`/`{{~zs}}` are pluralisation markers. The braces are
 *  doubled — reading them as single ones ate the " à " separator and left
 *  stray `}}` behind ("5 à 7 Dommages" came out as "57 Dommage}}"). */
const formatEffectLabel = (effData: any, eff: any): string => {
  const template = effData?.description?.fr ?? effData?.description?.en ?? `Effet ${eff.effectId ?? eff.id}`
  const from = eff.from ?? eff.value ?? 0
  const to = eff.to ?? eff.value ?? 0
  // DofusDB encodes a fixed value as `to: 0` (that is how the tooltip's
  // "-1 PA" and "1 Portée" are stored), not as from === to.
  const isRange = from !== to && to !== 0

  const desc = template
    // Range-only group: keep its text when the bounds differ, else drop it.
    .replace(/\{\{~1~2([^}]*)\}\}/g, isRange ? '$1' : '')
    // Pluralisation and other conditional markers carry no text we need.
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/#1/g, String(from))
    .replace(/#2/g, isRange ? String(to) : '')

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
  // Falling back to the first of several fuzzy hits picks an item that merely
  // resembles this one, and its effects become the crafting target's stats. One
  // candidate is an unambiguous answer; several without an exact hit is not.
  const matchedItem = exactMatch || (results.length === 1 ? results[0] : null)

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
    // The weapon's own attack line is not a roll the player can observe.
    .filter((effect: any) => effect?.category !== WEAPON_ATTACK_EFFECT_CATEGORY)
    .map((effect: any) => {
      const cached = effectCache.value[String(effect.effectId)]?.data
      if (!cached) return null
      const label = formatEffectLabel(cached, effect)
      // Prefer DofusDB's numeric characteristic; fall back to reading the
      // French description only when the effect has no usable one.
      const byCharacteristic = CHARACTERISTIC_TO_STAT_KEY[effect?.characteristic as number]
      const option = (byCharacteristic
        && observationStatOptions.find(entry => entry.key === byCharacteristic))
        || findStatOptionByLabel(label)
      const range = (effect.from === effect.to || effect.to === 0)
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

/**
 * Whether this item's roll table is fully known yet.
 *
 * `currentItemEffectMappings` drops any effect whose definition has not arrived
 * from the cache yet, so while those requests are in flight the item looks like
 * it has fewer rolls than it does. Reading a tooltip against that partial
 * vocabulary is how a real line ends up "unmatched" — or worse, gets claimed by
 * the catalogue pass as some other stat entirely — and the resulting
 * observation is wrong in a way no later capture corrects.
 *
 * So capture waits. An item whose schema is still loading is not ready to be
 * read against, and a few hundred milliseconds is nothing next to a bad row.
 */
const currentItemSchemaReady = computed(() => {
  const effects = recipeLookupState.value.data?.result?.effects
  if (!Array.isArray(effects)) return false

  // An approximate name match means DofusDB handed back an item that merely
  // resembles this one. Its roll table is then somebody else's, and reading a
  // tooltip against it produces confident nonsense. The page still shows what
  // it found — the user can see the match is approximate and correct it — but
  // capture does not run on a schema we are not sure belongs to this item.
  if (recipeLookupState.value.confidence !== 'exact') return false

  return effects
    .filter((effect: any) => effect?.category !== WEAPON_ATTACK_EFFECT_CATEGORY)
    .every((effect: any) => Boolean(effectCache.value[String(effect.effectId)]?.data))
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

const priceModelConfig = computed(() => defaultPriceModelConfig())

/** The item's official roll bounds — what quality and requirements measure against. */
const currentExpectedLines = computed<ExpectedLine[]>(() =>
  currentItemPriorityOptions.value.map((option) => {
    const range = parseObservationRange(option.rangeText)
    return {
      statKey: option.key,
      label: option.label,
      min: range?.min ?? 0,
      max: range?.max ?? 0,
    }
  })
)

const getStatPriority = (statKey: string): StatPriority => {
  const itemKey = currentItemKey.value
  return statPriorityProfiles.value.byItem[itemKey]?.[statKey]
    ?? statPriorityProfiles.value.global[statKey]
    ?? 'normal'
}

const setStatPriority = (statKey: string, priority: StatPriority) => {
  const itemKey = currentItemKey.value
  if (!itemKey) return

  const next: PriorityProfiles = {
    global: { ...statPriorityProfiles.value.global },
    byItem: {
      ...statPriorityProfiles.value.byItem,
      [itemKey]: {
        ...(statPriorityProfiles.value.byItem[itemKey] || {}),
        [statKey]: priority,
      },
    },
  }
  statPriorityProfiles.value = next
  writeStatPriorityProfiles(next)
}

const clearStatPriorities = () => {
  const itemKey = currentItemKey.value
  if (!itemKey) return
  const byItem = { ...statPriorityProfiles.value.byItem }
  delete byItem[itemKey]
  const next: PriorityProfiles = { global: { ...statPriorityProfiles.value.global }, byItem }
  statPriorityProfiles.value = next
  writeStatPriorityProfiles(next)
}

/**
 * The priority strip the user actually edits, one row per official roll line,
 * each stating in words what the current setting demands.
 */
const statPriorityRows = computed(() =>
  currentExpectedLines.value.map((line) => {
    const priority = getStatPriority(line.statKey)
    return {
      ...line,
      priority,
      requirement: describeRequirement(line, priority),
      isGating: priority === 'high' || priority === 'critical',
    }
  })
)

/** Everything the engine knows about the captured listings for this item. */
const valuationRun = computed(() =>
  valueObservations({
    observations: baseSelectedItemObservations.value as any,
    expectedLines: currentExpectedLines.value,
    profiles: statPriorityProfiles.value,
    itemKey: currentItemKey.value,
    config: priceModelConfig.value,
    // Separate economies. A listing from another server is not evidence here.
    serverId: selectedServer.value?.id ? String(selectedServer.value.id) : '',
    // Zero means "not told", and the engine returns no plan rather than
    // pretending an unconstrained ranking is one.
    bankroll: itemsBankroll.value,
  })
)

const valuationById = computed(() => {
  const map: Record<string, ValuedObservation> = {}
  for (const result of valuationRun.value.results) map[result.observation.id] = result
  return map
})

/**
 * Adapter onto the row shape the observed-price components render.
 *
 * `delta` is kept as the legacy signed gap so existing bindings keep working,
 * but every decision now hangs off `netProfit` and `isDeal` — a positive gap
 * that doesn't survive the sale tax and the segment's own price scatter is not
 * a deal, and that distinction is what stopped the page crying wolf.
 */
const allObservedValuations = computed(() =>
  valuationRun.value.results
    .filter((result) => result.valuation)
    .map((result) => {
      const valuation = result.valuation!
      return {
        id: result.observation.id,
        price: result.observation.price,
        score: result.score,
        fairValue: valuation.fairValue,
        delta: result.observation.price - valuation.fairValue,
        netProfit: result.netProfit,
        netAtQuick: valuation.netAtQuick,
        netAtGreedy: valuation.netAtGreedy,
        marginPercent: valuation.marginPercent,
        edgeRatio: valuation.edgeRatio,
        isDeal: valuation.isDeal,
        quickRelist: valuation.relists.quickRelist,
        fairRelist: valuation.relists.fairRelist,
        greedyRelist: valuation.relists.greedyRelist,
        modelUsed: valuation.curve.kind,
        comparableCount: result.peerIds.length,
        peerScope: result.peerScope,
        segment: result.segment,
        confidence: result.confidence,
        requirementsPassed: result.requirements.passed,
        requirementSummary: summariseFailures(result.requirements),
        daysOnMarket: result.daysOnMarket,
        status: result.observation.status,
        peers: result.peerIds
          .map((peerId) => valuationById.value[peerId])
          .filter((peer): peer is ValuedObservation => Boolean(peer))
          .map((peer) => ({
            id: peer.observation.id,
            price: peer.observation.price,
            score: peer.score,
            distance: Math.abs(peer.score - result.score),
          })),
      }
    })
)

const allObservedValuationMap = computed(() =>
  Object.fromEntries(allObservedValuations.value.map((row) => [row.id, row]))
)

const bestBuyObservationId = computed(() =>
  valuationRun.value.results.find((result) => result.badges.includes('best-buy'))?.observation.id || ''
)

const bestBuyObservation = computed(() => {
  const id = bestBuyObservationId.value
  if (!id) return null
  const valuation = allObservedValuationMap.value[id]
  const observation = baseSelectedItemObservations.value.find((entry) => entry.id === id)
  return valuation && observation ? { ...observation, ...valuation } : null
})

const selectedItemObservations = computed(() => {
  const rows = baseSelectedItemObservations.value.slice()
  const newestFirst = (a: StoredObservedPriceEntry, b: StoredObservedPriceEntry) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

  return rows.sort((a, b) => {
    if (observedSortMode.value === 'price_asc') {
      if (a.price !== b.price) return a.price - b.price
      return newestFirst(a, b)
    }

    if (observedSortMode.value === 'price_desc') {
      if (b.price !== a.price) return b.price - a.price
      return newestFirst(a, b)
    }

    if (observedSortMode.value === 'quality') {
      const qualityA = valuationById.value[a.id]?.score ?? 0
      const qualityB = valuationById.value[b.id]?.score ?? 0
      if (qualityA !== qualityB) return qualityB - qualityA
      return newestFirst(a, b)
    }

    // Both the profit sort and best-buy rank on what the flip actually nets;
    // unpriced rows sink rather than floating on a default of zero.
    if (observedSortMode.value === 'net_profit' || observedSortMode.value === 'best_buy') {
      const netA = valuationById.value[a.id]?.valuation ? valuationById.value[a.id]!.netProfit : -Infinity
      const netB = valuationById.value[b.id]?.valuation ? valuationById.value[b.id]!.netProfit : -Infinity
      if (netA !== netB) return netB - netA
      return newestFirst(a, b)
    }

    return newestFirst(a, b)
  })
})

const displayedObservedValuations = computed(() =>
  showOnlyUndervaluedListings.value
    ? allObservedValuations.value.filter((row) => row.isDeal && row.requirementsPassed)
    : allObservedValuations.value
)

const valuationModeSummary = computed(() => {
  const summary = valuationRun.value.summary
  const requirements = summary.requirementsInForce
    .map((entry) => `${entry.label} ≥ ${entry.needs}`)
    .join(', ')

  return [
    t('items.detail.valuation.summary.counts', {
      total: summary.total,
      candidates: summary.candidates,
      segments: summary.segments,
    }),
    summary.belowRequirement
      ? t('items.detail.valuation.summary.rejected', { count: summary.belowRequirement })
      : '',
    requirements ? t('items.detail.valuation.summary.requirements', { requirements }) : '',
    summary.clearedSamples
      ? t('items.detail.valuation.summary.cleared', { count: summary.clearedSamples })
      : t('items.detail.valuation.summary.asksOnly'),
  ].filter(Boolean).join(' · ')
})

/**
 * Item-level confidence: the weakest reading among the listings that are
 * actually priced, so the header can't advertise more certainty than the rows.
 */
const valuationConfidence = computed(() => {
  const priced = valuationRun.value.results.filter((result) => result.valuation)
  const summary = valuationRun.value.summary

  const level = !priced.length
    ? 'low' as const
    : priced.some((result) => result.confidence === 'high')
      && !priced.some((result) => result.confidence === 'low')
      ? 'high' as const
      : priced.some((result) => result.confidence !== 'low')
        ? 'medium' as const
        : 'low' as const

  return {
    level,
    label: level === 'high'
      ? t('items.detail.valuation.confidence.high')
      : level === 'medium'
        ? t('items.detail.valuation.confidence.medium')
        : t('items.detail.valuation.confidence.low'),
    details: priced.length
      ? t('items.detail.valuation.confidence.details', {
        priced: priced.length,
        total: summary.total,
        cleared: summary.clearedSamples,
        segments: summary.segments,
      })
      : t('items.detail.valuation.confidence.noUsable'),
  }
})

const getObservationBadges = (observation: StoredObservedPriceEntry) => {
  const badges: Array<{ label: string; tone: 'good' | 'bad' | 'warn' | 'neutral' }> = []
  const result = valuationById.value[observation.id]
  if (!result) return badges

  if (result.badges.includes('below-requirement')) {
    badges.push({
      label: t('items.detail.observed.badges.belowRequirement'),
      tone: 'warn',
    })
  }

  if (result.badges.includes('best-buy')) {
    badges.push({ label: t('items.detail.observed.badges.bestBuy'), tone: 'good' })
  }

  if (result.badges.includes('underpriced')) {
    badges.push({ label: t('items.detail.observed.badges.underpriced'), tone: 'good' })
  } else if (result.valuation && result.netProfit < 0) {
    badges.push({ label: t('items.detail.observed.badges.overpriced'), tone: 'bad' })
  }

  if (result.observation.status === 'sold') {
    badges.push({ label: t('items.detail.observed.badges.sold'), tone: 'neutral' })
  } else if (result.observation.status === 'relisted') {
    badges.push({ label: t('items.detail.observed.badges.relisted'), tone: 'warn' })
  }

  if (result.badges.includes('unpriced')) {
    badges.push({ label: t('items.detail.observed.badges.unpriced'), tone: 'neutral' })
  } else if (result.badges.includes('low-confidence')) {
    badges.push({ label: t('items.detail.valuation.confidence.low'), tone: 'neutral' })
  }

  return badges
}

const selectedObservationDetail = computed(() => {
  if (!selectedObservationId.value) return null
  return selectedItemObservations.value.find((entry) => entry.id === selectedObservationId.value) || null
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

  const result = valuationById.value[observation.id]
  if (!result?.valuation) return null

  const valuation = result.valuation
  const row = allObservedValuationMap.value[observation.id]

  return {
    score: result.score,
    fairValue: valuation.fairValue,
    delta: row?.delta ?? 0,
    netProfit: result.netProfit,
    marginPercent: valuation.marginPercent,
    edgeRatio: valuation.edgeRatio,
    isDeal: valuation.isDeal,
    requirementsPassed: result.requirements.passed,
    requirementFailures: result.requirements.failures,
    segment: result.segment,
    confidence: result.confidence,
    exoBoost: result.quality.exoBoost,
    overBoost: result.quality.overBoost,
    baseQuality: result.quality.baseQuality,
    methodLabel: valuation.curve.kind === 'fitted'
      ? t('items.detail.valuation.models.fitted')
      : t('items.detail.valuation.models.anchored'),
    referenceLabel: t('items.detail.valuation.reference.curve'),
    referenceDisplay: t('items.detail.valuation.reference.curveValue', {
      kappa: valuation.curve.kappa.toFixed(2),
      samples: valuation.curve.sampleCount,
      cleared: valuation.curve.clearedCount,
    }),
    peerScopeLabel: t(`items.detail.valuation.peerScope.${result.peerScope}`),
    peerMetricLabel: t('items.detail.valuation.peerMetric.quality'),
    // One row per rolled line: where it landed in its range, what the user's
    // priority demanded of it, and how much of the score it actually carried.
    contributions: result.quality.lines.map((line, index) => ({
      index,
      key: line.statKey,
      label: line.label,
      value: line.value,
      suffix: observation.statsEntries.find((entry) => entry.key === line.statKey)?.suffix || '',
      rangeText: line.span > 0 ? `[${line.min} à ${line.max}]` : `[${line.max}]`,
      weight: line.weight,
      progress: line.qEff,
      tier: line.tier,
      deficit: line.deficit,
      priority: line.priority,
      requirement: describeRequirement(line, line.priority),
      overmageAmount: line.overmageAmount,
      isExo: line.isExo,
      contribution: line.contribution,
    })),
    peers: (row?.peers ?? []).map((peer) => ({
      id: peer.id,
      price: peer.price,
      score: peer.score,
      metricDisplay: peer.score.toFixed(2),
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

    // Prefer the item that actually bears this name.
    //
    // `$search` is fuzzy and `$sort: -id` orders by recency, so taking the first
    // row meant the newest *similar* item won — and that item's effects then
    // became the roll table the OCR decodes against and the valuation measures
    // quality with. A wrong schema is not a cosmetic mismatch: every stat read
    // through it is scored against the wrong bounds.
    const results: any[] = Array.isArray(searchResponse?.data) ? searchResponse.data : []
    const exactMatch = results.find((entry: any) =>
      normalizeDofusdbSearch(entry?.name?.fr || entry?.name?.en || '') === normalizedName)
    const matchedItem = exactMatch || results[0]

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
    const result = await runPriceOcr(imageBase64)

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

    // The item's own roll table is the vocabulary the matcher decodes against —
    // deciding between ~5 known lines beats reading arbitrary French correctly.
    const result = await runStatsOcr(imageBase64, currentExpectedLines.value.map((line) => ({
      statKey: line.statKey,
      label: line.label,
      min: line.min,
      max: line.max,
      suffix: observationStatOptions.find((option) => option.key === line.statKey)?.suffix || '',
    })))

    ocrUnmatchedLines.value = result.unmatched

    // A rescan that read nothing must not erase what is already there.
    //
    // This replaced `statsEntries` wholesale, so a scan that "succeeded" with
    // zero matched lines — a mis-crop, a tooltip that had not opened yet —
    // silently wiped stats the user had hand-corrected, with no undo. Reading
    // nothing is not evidence that the item has nothing.
    if (!result.entries.length) {
      statsOcrState.value = {
        isLoading: false,
        error: t('items.detail.ocr.errors.statsEmpty'),
      }
      return
    }

    updateObservationEntries(itemKey, (entry) =>
      entry.id === observationId
        ? {
            ...entry,
            statsRawText: result.text,
            statsEntries: result.entries.map((matched) => ({
              key: matched.key,
              label: matched.label,
              value: matched.value,
              suffix: matched.suffix,
              rangeText: matched.rangeText,
              raw: matched.raw,
              // Carried through rather than dropped: see
              // ObservationStatEntry.confidence.
              confidence: matched.confidence,
              matchSource: matched.source,
            })),
          }
        : entry
    )

    // Deliberately does not open the detail view: the point of the inline
    // capture is that a row can be filled in without leaving the list.
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
    statsCaptureRowId.value = ''
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
  await ingestCaptureDataUrl(await readFileAsDataUrl(file))
}

/**
 * Routes one captured image to whatever the user currently has open.
 *
 * Lifted out of the paste handler so a pushed capture takes exactly the same
 * path a pasted one does — the routing rules were previously trapped inside a
 * ClipboardEvent listener and could not be reached any other way.
 *
 * Most specific target first: an armed row, then the open listing, then the
 * item itself.
 */
const ingestCaptureDataUrl = async (imageBase64: string) => {
  if (statsCaptureRowId.value) {
    await captureStatsScreenshot(statsCaptureRowId.value, imageBase64)
    return
  }

  if (selectedObservationDetail.value) {
    await captureStatsScreenshot(selectedObservationDetail.value.id, imageBase64)
    return
  }

  if (selectedRecipeItem.value) {
    await captureMarketScreenshot(imageBase64)
  }
}

const buildObservationStatsSignature = (statsEntries: StoredObservedPriceEntry['statsEntries']) =>
  statsEntries
    .filter((entry) => entry.key && entry.value !== null && entry.value !== undefined)
    .map((entry) => `${entry.key}:${entry.value}`)
    .sort((a, b) => a.localeCompare(b))
    .join('|')

/** FNV-1a over the data URL. Not cryptographic — it only has to tell two
 *  screenshots apart, at ~8 characters instead of a megabyte of base64. */
const hashScreenshot = (dataUrl: string) => {
  if (!dataUrl) return ''
  let hash = 0x811c9dc5
  for (let i = 0; i < dataUrl.length; i++) {
    hash ^= dataUrl.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

const isDuplicateObservedEntry = (
  candidate: Pick<StoredObservedPriceEntry, 'price' | 'statsEntries' | 'createdAt' | 'source' | 'scanHash'>,
  existing: StoredObservedPriceEntry
) => {
  if (candidate.price !== existing.price) return false

  const candidateSignature = buildObservationStatsSignature(candidate.statsEntries)
  const existingSignature = buildObservationStatsSignature(existing.statsEntries)

  if (candidateSignature !== existingSignature) return false

  if (!candidateSignature && candidate.source === 'ocr' && existing.source === 'ocr') {
    if (!candidate.scanHash || candidate.scanHash !== existing.scanHash) {
      return false
    }
  }

  const candidateTime = new Date(candidate.createdAt).getTime()
  const existingTime = new Date(existing.createdAt).getTime()
  const diffMs = Math.abs(candidateTime - existingTime)

  return diffMs <= 15 * 60 * 1000
}

interface LiveCaptureEntry {
  id: string
  /** The whole screen; the app decides which parts of it matter. */
  frame: string
  cursorX: number
  cursorY: number
  itemName: string
  createdAt: string
}

/** What the companion shows over the game. Kept short — it is read at a glance. */
interface LiveCaptureVerdict {
  isDeal: boolean
  headline: string
  detail: string
  price: number | null
  /** What the app looked at and read, so a bad result can be diagnosed. */
  debug?: {
    stripImage: string
    tooltipImage: string
    stripProcessed: string
    tooltipProcessed: string
    priceText: string
    statsText: string
    unmatched: string[]
  }
}

const liveCaptureArmed = ref(false)
const liveCaptureLog = ref<Array<{ id: string; at: string; verdict: LiveCaptureVerdict; cursor: { x: number; y: number } }>>([])
const liveCaptureError = ref('')
/** What the server says it is armed on — the truth the companion actually uses. */
const liveCaptureArmedItem = ref('')
/** Last price strip captured, used as the sample the glyph teacher learns from. */
const lastPriceStrip = ref('')
/**
 * Whether captures are archived to disk for later validation (phase 0b).
 *
 * On by default: the corpus is the only route to a measured error rate, and it
 * can only be collected while the app is being used normally. It writes crops
 * of the price row and tooltip — never the desktop frame — under `corpus/`.
 */
const corpusArchiveEnabled = ref(true)
/** Reconstruction atlas for this screen profile, when one has been built. */
const glyphAtlas = useGlyphAtlas()
/** Prices read off the rest of the page in the last capture's frame. */
const lastPageScan = ref<Array<{ ordinal: number; price: number | null; reason: string; residual: number; top: number }>>([])
let liveCaptureTimer: ReturnType<typeof setInterval> | null = null
let liveCaptureBusy = false

/**
 * Reads one pushed capture and turns it into a valued observation.
 *
 * This is the whole point of the live flow: the manual path needs two pastes
 * (price, then stats) and leaves them to be matched up afterwards, whereas one
 * hotkey press already carries both halves of the same listing — so the
 * observation can be born complete, and judged immediately.
 */
/**
 * A read that failed, carrying what it managed to see.
 *
 * Plain errors were useless here: a failure discarded the crops, so the one
 * case where you most need to look at what the app cropped showed nothing at
 * all.
 */
class CaptureReadError extends Error {
  debug: LiveCaptureVerdict['debug']
  /** Shown over the game. "UNREAD" unless the failure has a more useful name. */
  headline: string

  constructor(message: string, debug: LiveCaptureVerdict['debug'], headline = 'UNREAD') {
    super(message)
    this.debug = debug
    this.headline = headline
  }
}

/**
 * Files one capture in the on-disk archive.
 *
 * Best-effort and never awaited by the caller: the archive is a research
 * artefact, and a failure to write it must not cost the user a reading. See
 * `server/utils/corpusStore.ts` for why it exists at all.
 */
const archiveCorpusSample = async (input: {
  stripImage: string
  tooltipImage?: string
  itemKey: string
  itemName: string
  capture: LiveCaptureEntry
  screen: { width: number; height: number }
  readings: Array<{ reader: 'glyph' | 'ocr'; value: number | null; text: string; ms: number }>
  storedPrice: number | null
  agreed: boolean
  error?: string
  stats?: Array<{ key: string; value: number | null; confidence: number }>
  statsText?: string
}) => {
  if (!import.meta.client || !corpusArchiveEnabled.value) return

  try {
    await $fetch('/api/corpus', {
      method: 'POST',
      body: {
        stripImage: input.stripImage,
        tooltipImage: input.tooltipImage,
        itemKey: input.itemKey,
        itemName: input.itemName,
        serverId: selectedServer.value?.id ? String(selectedServer.value.id) : '',
        profile: {
          screenWidth: input.screen.width,
          screenHeight: input.screen.height,
          cursorX: input.capture.cursorX,
          cursorY: input.capture.cursorY,
          devicePixelRatio: window.devicePixelRatio || 1,
          locale: 'fr',
        },
        readings: input.readings,
        storedPrice: input.storedPrice,
        agreed: input.agreed,
        error: input.error,
        stats: input.stats,
        statsText: input.statsText,
      },
    })
  } catch {
    // Archiving is never load-bearing.
  }
}

const ingestLiveCapture = async (capture: LiveCaptureEntry): Promise<LiveCaptureVerdict> => {
  // Identity comes from the capture, never from the page.
  //
  // This used to read `selectedRecipeItem` here, which meant the observation was
  // filed against whatever happened to be open when recognition *finished*, not
  // what was armed when the screenshot was *taken*. Switching items mid-flight —
  // or a second tab draining the same queue — therefore saved item A's price
  // under item B, and nothing recorded that it had happened. A perfectly read
  // price under the wrong item is exactly as poisonous as a misread one, and far
  // harder to notice, because the number itself looks entirely reasonable.
  const item = selectedRecipeItem.value
  const identity = resolveCaptureIdentity({
    captureItemName: capture.itemName,
    openItemName: item?.name || '',
    normalize: normalizeDofusdbSearch,
  })

  // Both crops happen up front so a failure at any stage still has them to show.
  const screen = await imageSize(capture.frame)
  // Cut generously, then narrow by content. A band positioned from the cursor
  // cannot know where the text is, so the tight version clipped the digits
  // whenever the hover was near a row's edge.
  const priceRect = priceStripRect(capture.cursorX, capture.cursorY, screen.width, screen.height)
  const stripImage = await trimToTextBand(
    await cropDataUrl(capture.frame, priceRect),
    capture.cursorY - priceRect.y,
  )
  const tooltipImage = await trimToTooltipPanel(await cropDataUrl(
    capture.frame,
    tooltipRect(capture.cursorX, capture.cursorY, screen.width, screen.height),
  ))
  lastPriceStrip.value = stripImage
  const debug = {
    stripImage,
    tooltipImage,
    // The processed versions are what tesseract sees; the crops above are only
    // what it was cut from. A legible crop says nothing about a legible input.
    stripProcessed: '',
    tooltipProcessed: '',
    priceText: '',
    statsText: '',
    unmatched: [] as string[],
  }

  if (!identity.ok) {
    throw new CaptureReadError(identity.message, debug, identity.headline)
  }

  // Belt and braces alongside the arming gate: a capture already in flight when
  // the item changed could still arrive while the new schema is loading.
  if (!currentItemSchemaReady.value) {
    throw new CaptureReadError(
      'Item stats are still loading - capture again in a moment',
      debug,
      'NOT READY',
    )
  }

  // From here on the capture's own key is the one that is used — never the
  // page's, which may have moved on since the screenshot was taken.
  const itemKey = identity.itemKey

  // Shadow mode: both readers run on every capture, always.
  //
  // The pipeline only ever needed one answer — glyphs first, OCR as a fallback —
  // so when the glyph atlas succeeded, OCR's opinion was never asked for and a
  // disagreement between them was invisible. That is exactly the measurement
  // this project lacks: how often is the current reader wrong? Running both and
  // recording when they differ is what turns "unknown error rate" into a number,
  // and it costs a few hundred milliseconds on a hotkey press.
  //
  // The *decision* is unchanged: glyphs still win when they resolve, because
  // they are deterministic and refuse rather than guess. OCR's answer is
  // recorded, not obeyed.
  const glyphStart = performance.now()
  // Reconstruction first, falling back to the old hand-taught atlas only where
  // no reconstruction atlas has been built for this profile yet.
  const atlasEntry = await glyphAtlas.load(
    profileIdFor(screen.width, screen.height, window.devicePixelRatio || 1),
  ).catch(() => null)

  const reconstructed = atlasEntry
    ? await readPriceByReconstruction(stripImage, atlasEntry.atlas).catch(() => null)
    : null
  const glyphPrice = reconstructed?.value ?? (atlasEntry ? null : await readPriceByGlyphs(stripImage))
  const glyphMs = performance.now() - glyphStart

  const ocrStart = performance.now()
  const priceResult = await runPriceOcr(stripImage, true).catch(() => null)
  const ocrMs = performance.now() - ocrStart
  const ocrPrice = priceResult
    ? (pickPriceFromStrip(priceResult.text)
      ?? priceResult.candidates.slice().sort((a, b) => b - a)[0]
      ?? null)
    : null

  const readings = [
    {
      reader: 'glyph' as const,
      value: glyphPrice,
      // Carries the reason it declined, which is the difference between "the
      // atlas has never seen a 6" and "two digits fitted equally well".
      text: reconstructed
        ? `${reconstructed.text} (${reconstructed.reason}, res ${reconstructed.residual.toFixed(3)})`
        : glyphPrice ? String(glyphPrice) : '',
      ms: Math.round(glyphMs),
    },
    { reader: 'ocr' as const, value: ocrPrice, text: priceResult?.text || '', ms: Math.round(ocrMs) },
  ]
  const answered = readings.filter((reading) => reading.value !== null)
  const agreed = answered.length < 2
    || answered.every((reading) => reading.value === answered[0]!.value)

  // A glyph refusal is a refusal, not a cue to trust the other reader.
  //
  // This was `glyphPrice ?? ocrPrice ?? 0`, which meant that when the
  // deterministic reader said "I cannot read this", the statistical one's guess
  // was promoted straight to stored fact. The corpus caught it doing exactly
  // that: a strip plainly reading `4 899 999`, glyphs correctly refusing, and
  // tesseract's `4090094` stored as the price — close enough to the item's
  // other listings to clear the plausibility band, so nothing downstream
  // objected. The disagreement metric could not flag it either, because only
  // one reader had answered.
  //
  // So the OCR-only path still produces a row — throwing the capture away would
  // cost real work — but the row is marked a *proposal* and kept out of
  // valuation until someone confirms it.
  const price = glyphPrice ?? ocrPrice ?? 0
  const priceTrust: 'verified' | 'proposed' = glyphPrice !== null ? 'verified' : 'proposed'
  debug.priceText = glyphPrice
    ? `glyphs: ${glyphPrice}${ocrPrice !== null && ocrPrice !== glyphPrice ? ` (ocr disagreed: ${ocrPrice})` : ''}`
    : priceResult?.text || ''
  debug.stripProcessed = glyphPrice ? stripImage : (priceResult?.processedImage || '')

  if (!price) {
    void archiveCorpusSample({
      stripImage,
      tooltipImage,
      itemKey: identity.itemKey,
      itemName: capture.itemName,
      capture,
      screen,
      readings,
      storedPrice: null,
      agreed,
      error: 'no-price',
    })
    throw new CaptureReadError('Could not read the price on that row', debug)
  }

  // A price wildly out of line with what this item already sells for is a
  // misread, not a find. Refusing it matters more than reading it: a truncated
  // "2 750 000" saved as "2 750" did not just record a wrong number, it
  // surfaced as the best buy on the list and told you to go and purchase it.
  const knownPrices = (observedPrices.value[itemKey] || []).map((entry) => entry.price)
  const priceCheck = checkPriceAgainst(price, knownPrices)
  if (!priceCheck.ok) {
    // Archived too. A rejected read is the most informative kind of sample
    // there is — it is a known failure with the pixels that caused it attached.
    void archiveCorpusSample({
      stripImage,
      tooltipImage,
      itemKey,
      itemName: capture.itemName,
      capture,
      screen,
      readings,
      storedPrice: null,
      agreed,
      error: 'implausible-price',
    })
    throw new CaptureReadError(
      `Read ${formatKamasFull(price)} - out of line with this item, ignored`,
      debug,
    )
  }

  const statsResult = await runStatsOcr(tooltipImage, currentExpectedLines.value.map((line) => ({
    statKey: line.statKey,
    label: line.label,
    min: line.min,
    max: line.max,
    suffix: observationStatOptions.find((option) => option.key === line.statKey)?.suffix || '',
  })))

  const createdAt = new Date().toISOString()
  const observation: StoredObservedPriceEntry = {
    id: `${itemKey}-${price}-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    itemKey,
    // The name the capture was armed on, not the one currently on screen.
    itemName: capture.itemName,
    serverId: selectedServer.value?.id ? String(selectedServer.value.id) : '',
    price,
    createdAt,
    source: 'ocr',
    // Nothing existed to compare this against, so it went in unexamined.
    priceUnverified: !priceCheck.checked,
    priceTrust,
    scanHash: hashScreenshot(stripImage),
    statsRawText: statsResult.text,
    statsEntries: statsResult.entries.map((matched) => ({
      key: matched.key,
      label: matched.label,
      value: matched.value,
      suffix: matched.suffix,
      rangeText: matched.rangeText,
      raw: matched.raw,
      // Carried through rather than dropped: see ObservationStatEntry.confidence.
      confidence: matched.confidence,
      matchSource: matched.source,
    })),
  }

  const existing = observedPrices.value[itemKey] || []
  // Capturing the same lot twice is easy to do mid-session; it must not read as
  // a second listing at the same price.
  const duplicate = existing.some((entry) => isDuplicateObservedEntry(observation, entry))
  if (!duplicate) {
    const nextObserved = {
      ...observedPrices.value,
      [itemKey]: [observation, ...existing],
    }
    observedPrices.value = nextObserved
    writeObservedPrices(nextObserved)
    // Mirrored to the durable ledger. localStorage stays the read path for now
    // so nothing depends on the server being up, but the ledger is where the
    // history actually survives: a browser profile is not a backup.
    void $fetch('/api/ledger', { method: 'POST', body: { observations: [observation] } })
      .catch(() => {})
  }

  await nextTick()

  const valued = valuationById.value[duplicate
    ? existing.find((entry) => isDuplicateObservedEntry(observation, entry))!.id
    : observation.id]

  debug.statsText = statsResult.text || ''
  debug.tooltipProcessed = statsResult.processedImage || ''
  debug.unmatched = statsResult.unmatched.map((line) => line.raw)

  // Read the rest of the page while the frame is already in hand.
  //
  // The hovered row is the one with a tooltip, so it is the only one that can
  // contribute rolls — but every other row's *price* is right there in the same
  // frame, and throwing it away meant a hotkey press per listing to learn what
  // a page costs. Prices only, recorded as proposals: nothing here has been
  // confirmed and none of it may authorise a purchase.
  if (atlasEntry) {
    void readPagePrices(capture.frame, atlasEntry.atlas)
      .then((rows) => {
        lastPageScan.value = rows.filter((row) => row.price !== null)
      })
      .catch(() => {})
  }

  void archiveCorpusSample({
    stripImage,
    tooltipImage,
    itemKey,
    itemName: capture.itemName,
    capture,
    screen,
    readings,
    storedPrice: price,
    agreed,
    stats: statsResult.entries.map((matched) => ({
      key: matched.key,
      value: matched.value,
      confidence: matched.confidence,
    })),
    statsText: statsResult.text || '',
  })

  return { ...buildLiveCaptureVerdict(price, valued, statsResult.unmatched.length), debug }
}

/**
 * The console the companion prints to is not UTF-8, so the narrow no-break
 * spaces French number formatting inserts arrive as mojibake ("2â¯500").
 * Plain spaces read correctly everywhere.
 */
const toConsoleSafe = (value: string) => value.replace(/[  ]/g, ' ')

const buildLiveCaptureVerdict = (
  price: number,
  valued: ValuedObservation | undefined,
  unmatchedCount: number,
): LiveCaptureVerdict => {
  const priceLabel = toConsoleSafe(formatKamasFull(price))

  if (!valued) {
    return { isDeal: false, headline: 'SAVED', detail: priceLabel, price }
  }

  // A listing that fails the user's own requirements is not a deal however
  // cheap it is, and saying which line failed is more useful than a number.
  if (!valued.requirements.passed) {
    const failure = valued.requirements.failures[0]
    return {
      isDeal: false,
      headline: 'SKIP',
      detail: failure
        ? `${failure.label} ${failure.got ?? '-'}/${failure.max}`
        : 'below requirements',
      price,
    }
  }

  if (!valued.valuation) {
    return {
      isDeal: false,
      headline: 'SAVED',
      detail: `${priceLabel} · need more listings`,
      price,
    }
  }

  const quality = valued.score.toFixed(2)
  // Exos and overmage are the reason an item is worth chasing, so they belong
  // in the one line you read over the game rather than buried in the app.
  const extras = valued.quality.lines.filter((line) => line.isExo && line.present)
  const overs = valued.quality.lines.filter((line) => line.overmageAmount > 0)
  const extraLabel = [
    extras.length ? `EXO ${extras.map((line) => line.label).join('/')}` : '',
    overs.length ? `OVER ${overs.map((line) => `${line.label}+${line.overmageAmount}`).join('/')}` : '',
  ].filter(Boolean).join(' · ')

  if (valued.valuation.isDeal) {
    return {
      isDeal: true,
      headline: `DEAL +${toConsoleSafe(formatKamasFull(valued.netProfit))}`,
      detail: [
        `Q ${quality}`,
        extraLabel,
        `fair ${toConsoleSafe(formatKamasFull(valued.valuation.fairValue))}`,
      ].filter(Boolean).join(' · '),
      price,
    }
  }

  return {
    isDeal: false,
    headline: 'SKIP',
    detail: [
      `Q ${quality}`,
      extraLabel,
      `fair ${toConsoleSafe(formatKamasFull(valued.valuation.fairValue))}`,
      unmatchedCount ? `${unmatchedCount} unread` : '',
    ].filter(Boolean).join(' · '),
    price,
  }
}

const pollLiveCaptures = async () => {
  // Ingestion is slower than the poll interval, so without this a slow capture
  // would be overlapped by the next tick and valued against a half-written list.
  if (liveCaptureBusy) return
  liveCaptureBusy = true

  try {
    // The item goes with every poll rather than once at start-up: a one-shot
    // arm is lost the moment the server restarts, and nothing on the page can
    // tell that it happened.
    const response = await $fetch<{ captures: LiveCaptureEntry[]; activeItem: { itemName: string } | null }>(
      '/api/capture/pending',
      { query: { itemName: selectedRecipeItem.value?.name || '' } },
    )
    liveCaptureArmedItem.value = response.activeItem?.itemName || ''
    liveCaptureError.value = ''

    for (const capture of response.captures || []) {
      try {
        const verdict = await ingestLiveCapture(capture)
        await $fetch(`/api/capture/${capture.id}/verdict`, { method: 'POST', body: verdict })
        liveCaptureLog.value = [
          { id: capture.id, at: new Date().toISOString(), verdict, cursor: { x: capture.cursorX, y: capture.cursorY } },
          ...liveCaptureLog.value,
        ].slice(0, 10)
      } catch (error: any) {
        // Always answer, even on failure — the companion is waiting, and a
        // silent drop leaves it hanging until its timeout. The crops go too, so
        // a failure can be looked at rather than only described.
        const message = String(error?.message || 'Could not read the capture')
        // A mis-filed capture and an unreadable one need different words: the
        // first is a mistake you can correct by re-arming, the second by
        // re-hovering. "UNREAD" for both taught you nothing.
        const headline = String(error?.headline || 'UNREAD')
        await $fetch(`/api/capture/${capture.id}/verdict`, {
          method: 'POST',
          body: { error: message, headline, debug: error?.debug },
        }).catch(() => {})

        if (error?.debug) {
          liveCaptureLog.value = [
            {
              id: capture.id,
              at: new Date().toISOString(),
              cursor: { x: capture.cursorX, y: capture.cursorY },
              verdict: { isDeal: false, headline, detail: message, price: null, debug: error.debug },
            },
            ...liveCaptureLog.value,
          ].slice(0, 10)
        }
      }
    }
  } catch {
    liveCaptureError.value = t('items.detail.liveCapture.offline')
  } finally {
    liveCaptureBusy = false
  }
}

const setLiveCaptureArmed = async (armed: boolean) => {
  // Server-side there is no companion to listen to, and no timers to own.
  if (!import.meta.client) return
  liveCaptureArmed.value = armed

  if (liveCaptureTimer) {
    clearInterval(liveCaptureTimer)
    liveCaptureTimer = null
  }

  if (!armed) return

  // Tell the server which item every capture belongs to, so the companion can
  // stay item-agnostic exactly the way the /kamas one already does.
  const item = selectedRecipeItem.value
  if (item?.name) {
    await $fetch('/api/hdv-scan/active', {
      method: 'POST',
      body: { itemName: item.name, source: 'items-live-capture' },
    }).catch(() => {})
  }

  liveCaptureTimer = setInterval(pollLiveCaptures, 500)
}

/**
 * Listening starts by itself once an item is open.
 *
 * Requiring a button press first meant a capture could be taken, accepted and
 * then sit in the queue with nothing to read it — the hotkey appeared to do
 * nothing. The button remains, as a way to stop.
 */
watch(() => selectedRecipeItem.value?.name, (name, previous) => {
  // The session log belongs to the item it was captured for. Left alone it
  // followed you to the next item, showing verdicts and crops for listings of
  // something else entirely — which reads as the app having captured them.
  if (name !== previous) {
    liveCaptureLog.value = []
    lastPriceStrip.value = ''
    liveCaptureError.value = ''
    // "I swept every page" is a claim about *this* item's market, and it was
    // sticky. Left set, the next item's partial capture inherited it and every
    // listing missing from a single page looked like it had left the market —
    // manufacturing sales wholesale out of a scan that never claimed to be
    // complete. The claim has to be re-made per item, deliberately.
    fullSweepCapture.value = false
  }

  if (!name && liveCaptureArmed.value) setLiveCaptureArmed(false)
}, { immediate: true })

// Arming waits for the schema, not just for the item.
//
// Auto-arming on the name alone meant the hotkey was live while the effect
// definitions were still arriving, so the first capture or two of every item
// were matched against a half-built vocabulary.
watch(
  () => [Boolean(selectedRecipeItem.value?.name), currentItemSchemaReady.value] as const,
  ([hasItem, ready]) => {
    if (hasItem && ready && !liveCaptureArmed.value) setLiveCaptureArmed(true)
    else if ((!hasItem || !ready) && liveCaptureArmed.value) setLiveCaptureArmed(false)
  },
  { immediate: true },
)

/**
 * Everything behind this item's verdicts, as a file.
 *
 * A screenshot shows the answer but none of the arithmetic, which is why
 * disagreements about a valuation kept coming down to guesswork. This carries
 * the inputs and the outputs together so the numbers can be read directly.
 */
const exportCurrentItem = () => {
  if (!import.meta.client) return

  const data = buildItemExport({
    itemKey: selectedObservationKey.value,
    itemName: selectedRecipeItem.value?.name || '',
    expectedLines: currentExpectedLines.value,
    // Only what has been changed from the default, so the file stays readable.
    priorities: Object.fromEntries(
      statPriorityRows.value
        .filter((row) => row.priority !== 'normal')
        .map((row) => [row.statKey, row.priority]),
    ),
    results: valuationRun.value.results,
  })

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = itemExportFilename(selectedObservationKey.value)
  link.click()
  URL.revokeObjectURL(url)
}

const saveOcrSnapshotPrices = async () => {
  const item = selectedRecipeItem.value
  const itemKey = selectedObservationKey.value

  if (!item || !itemKey || !ocrState.value.screenshotDataUrl || !ocrState.value.candidates.length) {
    return 0
  }

  const existing = observedPrices.value[itemKey] || []
  const createdAt = new Date().toISOString()
  const knownPrices = existing.map((entry) => entry.price)

  // The manual path had no plausibility gate at all.
  //
  // The live path refuses a price an order of magnitude away from what the item
  // already sells for, because that is a dropped digit rather than a find. This
  // path wrote straight to storage, so the same truncated read that the live
  // path rejects was accepted here without comment — and one bad row is enough
  // to move the median that every later check is judged against.
  const rejected: number[] = []
  const candidateEntries = ocrState.value.candidates
    .map((price) => ({ price, check: checkPriceAgainst(price, knownPrices) }))
    .filter(({ price, check }) => {
      if (!check.ok) rejected.push(price)
      return check.ok
    })
    .map(({ price, check }) => ({
      id: `${itemKey}-${price}-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
      itemKey,
      itemName: item.name,
      serverId: selectedServer.value?.id ? String(selectedServer.value.id) : '',
      price,
      createdAt,
      source: 'ocr' as const,
      priceUnverified: !check.checked,
      scanHash: hashScreenshot(ocrState.value.screenshotDataUrl),
      statsRawText: '',
      statsEntries: [],
    }))

  ocrRejectedPrices.value = rejected
  if (rejected.length) {
    // Checked after `processMarketScreenshotImage` has already gated on it, so
    // this reports the outcome rather than blocking the save that produced it.
    ocrState.value = {
      ...ocrState.value,
      error: t('items.detail.ocr.errors.pricesRejected', {
        prices: rejected.map((price) => formatKamasFull(price)).join(', '),
      }),
    }
  }

  // Reconciling a capture whose implausible rows were dropped would read those
  // listings as having left the market. Nothing here is trustworthy enough to
  // conclude that from, so a capture with a bad read in it does not get to
  // claim completeness.
  const sweepClaimed = fullSweepCapture.value && !rejected.length

  const additions = candidateEntries.filter((candidate) =>
    !existing.some((entry) => isDuplicateObservedEntry(candidate, entry))
  )

  // Fold the capture into the history rather than only appending to it: seeing
  // the same listing again proves it did not sell, and a listing that has left
  // a full sweep is the closest thing to a confirmed sale this page can get.
  const reconciled = reconcileObservations(existing as any, candidateEntries as any, {
    fullSweep: sweepClaimed,
    now: createdAt,
  })

  if (!additions.length && !reconciled.markedSold && !reconciled.markedRelisted) return 0

  const nextObserved = {
    ...observedPrices.value,
    [itemKey]: reconciled.observations as any,
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
  return additions.length
}

/** A paste should be one action, so prices save themselves. `undoLastScan`
 *  restores the previous list while the toast is still up. */
const undoState = ref<{ itemKey: string, entries: StoredObservedPriceEntry[], count: number } | null>(null)
let undoTimer: ReturnType<typeof setTimeout> | undefined

const undoLastScan = () => {
  const snapshot = undoState.value
  if (!snapshot) return
  const nextObserved = { ...observedPrices.value, [snapshot.itemKey]: snapshot.entries }
  observedPrices.value = nextObserved
  writeObservedPrices(nextObserved)
  undoState.value = null
  clearTimeout(undoTimer)
}

const captureMarketScreenshot = async (dataUrl: string) => {
  const itemKey = selectedObservationKey.value
  if (!itemKey) return
  const before = [...(observedPrices.value[itemKey] || [])]

  await processMarketScreenshotImage(dataUrl)
  if (ocrState.value.error || !ocrState.value.candidates.length) return

  const saved = await saveOcrSnapshotPrices()
  // Drop the image as soon as it has been read.
  ocrState.value = { ...ocrState.value, screenshotDataUrl: '', candidates: [] }
  if (!saved) return

  undoState.value = { itemKey, entries: before, count: saved }
  clearTimeout(undoTimer)
  undoTimer = setTimeout(() => { undoState.value = null }, 10_000)
}

const captureStatsScreenshot = async (observationId: string, dataUrl: string) => {
  await processStatsScreenshotImage(dataUrl, observationId)
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
  // Net of the HDV cut: the tracker should carry the number that lands in the
  // pocket, not a gross spread the sale tax will quietly eat into.
  const estimatedProfit = Math.max(0, valuation?.netProfit ?? (targetRelistPrice - observation.price))

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
    estimatedScore: valuation?.score ?? 0,
    estimatedDelta: estimatedProfit,
    observedListingId: observation.id,
    marketScreenshotDataUrl: '',
    statsScreenshotDataUrl: '',
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

const removeAllObservations = () => {
  const itemKey = selectedObservationKey.value
  if (!itemKey) return
  if (!confirm(t('items.detail.observed.confirm.removeAll', { count: (observedPrices.value[itemKey] || []).length }))) return

  const nextObserved = { ...observedPrices.value, [itemKey]: [] }
  observedPrices.value = nextObserved
  writeObservedPrices(nextObserved)
  selectedObservationId.value = ''
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

onMounted(() => {
  filtersCollapsed.value = localStorage.getItem('items-filters-collapsed') === 'true'
  resourcePrices.value = readResourcePrices()
  // Screenshots used to be persisted alongside every price (the same market
  // image once per detected price). They are never needed after OCR, so the
  // first load after this change drops them and writes the storage back.
  const storedRaw = import.meta.client ? localStorage.getItem(ITEM_OBSERVED_PRICES_KEY) : null
  observedPrices.value = readObservedPrices()
  const storedBankroll = Number(localStorage.getItem(ITEMS_BANKROLL_KEY) || 0)
  itemsBankroll.value = Number.isFinite(storedBankroll) && storedBankroll > 0 ? storedBankroll : 0
  if (storedRaw?.includes('ScreenshotDataUrl')) {
    writeObservedPrices(observedPrices.value)
  }
  effectCache.value = readEffectCache()
  statPriorityProfiles.value = readStatPriorityProfiles()
  window.addEventListener('paste', handleGlobalPaste)
  fetchData()
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('paste', handleGlobalPaste)
  if (liveCaptureTimer) {
    clearInterval(liveCaptureTimer)
    liveCaptureTimer = null
  }
})

watch(activeSlot, (slot) => {
  resetRecipeView()
  resetAggregateRecipeView()
  router.replace({ query: { slot } })
})

// Deliberately not immediate: on load `name` is still undefined, and replacing
// the query then would strip ?item= and ?obs= before restoreFromUrl reads them.
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
