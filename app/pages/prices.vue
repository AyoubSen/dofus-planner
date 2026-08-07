<template>
  <div class="mp-page">
    <div v-if="!hasContext" class="v2-no-context">
      <div class="v2-no-context__title">Select a character first</div>
      <div class="v2-no-context__desc">Prices are saved locally per character and server.</div>
    </div>

    <template v-else>
      <header class="mp-topbar">
        <div class="mp-title">
          <h1>Prices</h1>
          <span>{{ trackedItems.length }} tracked · {{ todayLoggedCount }} checked today</span>
          <div class="mp-tabs" role="tablist" aria-label="Prices mode">
            <button class="mp-tab" :class="{ 'mp-tab--active': activeTab === 'tracked' }" type="button" @click="activeTab = 'tracked'">
              Tracked
            </button>
            <button class="mp-tab" :class="{ 'mp-tab--active': activeTab === 'pressure' }" type="button" @click="openPressureTab">
              Pressure
            </button>
          </div>
        </div>

        <div class="mp-tools">
          <button class="mp-tool-btn" type="button" :disabled="!trackedItems.length" @click="exportPrices">
            Export
          </button>
          <label class="mp-tool-btn mp-tool-btn--label">
            Import
            <input type="file" accept=".json,application/json" @change="importPrices" />
          </label>
          <span v-if="transferMessage" class="mp-transfer-msg" :class="{ 'mp-transfer-msg--error': transferError }">
            {{ transferMessage }}
          </span>
        </div>

        <div class="mp-add">
          <input
            v-model.trim="draftName"
            class="mp-input"
            type="text"
            placeholder="Add item to track"
            @keyup.enter="addTrackedItem"
          />
          <button class="mp-btn" type="button" :disabled="!draftName" @click="addTrackedItem">
            Track
          </button>
        </div>

        <div v-if="activeTab === 'tracked'" class="mp-filters">
          <V2Select
            v-model="categoryFilter"
            :options="categoryFilterOptions"
            placeholder="Category"
            size="compact"
            aria-label="Category filter"
          />
          <V2Select
            v-model="chartPeriod"
            :options="chartPeriodOptions"
            placeholder="Chart"
            size="compact"
            aria-label="Chart period"
          />
        </div>
      </header>

      <section v-if="activeTab === 'pressure'" class="mp-pressure">
        <div class="mp-pressure-head">
          <div>
            <h2>Recipe pressure</h2>
            <p>Resources used by popular craft targets. Track the ones with pressure before checking HDV prices.</p>
          </div>
          <div class="mp-pressure-actions">
            <V2Select
              v-model="pressureSlot"
              :options="pressureSlotOptions"
              placeholder="Slot"
              size="compact"
              aria-label="Pressure slot"
            />
            <V2Select
              v-model="pressureLimit"
              :options="pressureLimitOptions"
              placeholder="Top items"
              size="compact"
              aria-label="Pressure item limit"
            />
            <V2Select
              v-model="pressureSort"
              :options="pressureSortOptions"
              placeholder="Sort"
              size="compact"
              aria-label="Pressure sort"
            />
            <button class="mp-tool-btn" type="button" :disabled="pressureState.isLoading" @click="refreshPressure">
              {{ pressureState.isLoading ? 'Loading' : 'Refresh' }}
            </button>
            <button class="mp-tool-btn" type="button" :disabled="!untrackedPressureResources.length" @click="trackTopPressureResources">
              Track top
            </button>
            <button class="mp-tool-btn" type="button" :disabled="!untrackedSelectedPressureResources.length" @click="trackSelectedPressureResources">
              Track selected
            </button>
          </div>
        </div>

        <div class="mp-pressure-filters">
          <V2Select
            v-model="pressureFilters.element"
            :options="pressureElementOptions"
            placeholder="Element"
            size="compact"
            aria-label="Pressure element"
          />
          <V2Select
            v-model="pressureFilters.mode"
            :options="pressureModeOptions"
            placeholder="Mode"
            size="compact"
            aria-label="Pressure mode"
          />
          <V2Select
            v-model="pressureFilters.classe"
            :options="pressureClassOptions"
            placeholder="Class"
            size="compact"
            aria-label="Pressure class"
          />
          <V2Select
            v-model="pressureFilters.level"
            :options="pressureLevelOptions"
            placeholder="Level"
            size="compact"
            aria-label="Pressure level"
          />
          <V2Select
            v-model="pressureFilters.budget"
            :options="pressureBudgetOptions"
            placeholder="Budget"
            size="compact"
            aria-label="Pressure budget"
          />
          <button class="mp-filter-chip" :class="{ 'mp-filter-chip--on': pressureFilters.hideSpecial }" type="button" @click="pressureFilters.hideSpecial = !pressureFilters.hideSpecial">
            Hide special
          </button>
          <button class="mp-filter-chip" :class="{ 'mp-filter-chip--on': pressureFilters.onlyMonsterDrops }" type="button" @click="pressureFilters.onlyMonsterDrops = !pressureFilters.onlyMonsterDrops">
            Monster drops
          </button>
          <button class="mp-filter-chip" :class="{ 'mp-filter-chip--on': pressureFilters.onlyNonCrafted }" type="button" @click="pressureFilters.onlyNonCrafted = !pressureFilters.onlyNonCrafted">
            Non-crafted
          </button>
          <button class="mp-filter-chip" :class="{ 'mp-filter-chip--on': pressureFilters.minItemUsage === 2 }" type="button" @click="pressureFilters.minItemUsage = pressureFilters.minItemUsage === 2 ? 1 : 2">
            Used by 2+
          </button>
        </div>

        <div v-if="pressureState.error" class="mp-empty-page mp-empty-page--error">
          {{ pressureState.error }}
        </div>
        <div v-else-if="pressureState.isLoading" class="mp-empty-page">
          Loading pressure resources.
        </div>
        <div v-else-if="!pressureResources.length" class="mp-empty-page">
          No pressure data yet. Refresh to scan popular recipes.
        </div>
        <template v-else>
          <div class="mp-pressure-summary">
            <div><span>Craft targets</span><strong>{{ pressureState.selectedItems.length }}</strong></div>
            <div><span>Resources</span><strong>{{ pressureResources.length }}</strong></div>
            <div><span>Untracked</span><strong>{{ untrackedPressureResources.length }}</strong></div>
            <div><span>Selected</span><strong>{{ untrackedSelectedPressureResources.length }}</strong></div>
          </div>

          <div v-if="pressureState.selectedItems.length" class="mp-pressure-targets">
            <span>Based on</span>
            <button v-for="item in pressureState.selectedItems" :key="item.name" class="mp-pressure-target" type="button">
              {{ item.name }} · {{ item.count }}
            </button>
          </div>

          <div class="mp-pressure-list">
            <article v-for="resource in pressureResources" :key="resource.id" class="mp-pressure-card">
              <label class="mp-pressure-check" :aria-label="`Select ${resource.name}`">
                <input type="checkbox" :checked="isPressureResourceSelected(resource.id)" @change="togglePressureResourceSelection(resource.id)" />
              </label>
              <div class="mp-pressure-card__main">
                <div class="mp-pressure-card__name-row">
                  <img v-if="resource.image" :src="resource.image" :alt="resource.name" class="mp-pressure-card__img" />
                  <div>
                    <h3>{{ resource.name }}</h3>
                    <p>{{ resource.typeName || 'Resource' }}<span v-if="resource.level !== null"> · lvl {{ resource.level }}</span></p>
                  </div>
                </div>
                <div class="mp-pressure-reasons">
                  <span v-for="reason in getPressureReasons(resource)" :key="reason">{{ reason }}</span>
                </div>
                <div class="mp-pressure-used">
                  <span>Used in</span>
                  <button v-for="item in resource.items.slice(0, 4)" :key="item.name" type="button" class="mp-pressure-target">
                    {{ item.name }}
                  </button>
                </div>
              </div>

              <div class="mp-pressure-stats">
                <div><span>Pressure</span><strong>{{ resource.pressureScore }}</strong></div>
                <div><span>Builds</span><strong>{{ resource.buildUsageCount }}</strong></div>
                <div><span>Qty</span><strong>{{ resource.totalQuantity }}</strong></div>
                <div><span>Latest</span><strong>{{ formatKamas(getPressureTrackedItem(resource)?.observations[0]?.price ?? 0) }}</strong></div>
              </div>

              <div class="mp-pressure-card__actions">
                <span class="mp-pressure-signal" :class="`mp-pressure-signal--${getPressureSignal(resource).tone}`">
                  {{ getPressureSignal(resource).label }}
                </span>
                <button class="mp-copy-btn" type="button" @click="copyPressureName(resource)">
                  {{ copiedPressureId === resource.id ? 'Copied' : 'Copy' }}
                </button>
                <button class="mp-icon-btn" type="button" @click="trackPressureResource(resource)">
                  {{ getPressureTrackedItem(resource) ? 'Open tracked' : 'Track' }}
                </button>
              </div>
            </article>
          </div>
        </template>
      </section>

      <section v-else-if="trackedItems.length" class="mp-list">
        <article
          v-for="item in sortedItems"
          :key="item.id"
          class="mp-card"
          :class="{ 'mp-card--last': lastChangedItemId === item.id }"
        >
          <div class="mp-card__top">
            <div class="mp-card__identity">
              <template v-if="editingItemId === item.id">
                <input v-model.trim="editName" class="mp-input" type="text" placeholder="Item name" @keyup.enter="saveItemEdit(item.id)" />
              </template>
              <template v-else>
                <div class="mp-card__name-row">
                  <h2>{{ item.name }}</h2>
                  <button class="mp-copy-btn" type="button" :title="`Copy ${item.name}`" @click="copyItemName(item)">
                    {{ copiedItemId === item.id ? 'Copied' : 'Copy' }}
                  </button>
                  <span v-if="lastChangedItemId === item.id" class="mp-last-badge">Last updated</span>
                </div>
                <span>{{ item.observations.length }} prices · latest {{ formatKamas(getLatestObservation(item)?.price ?? 0) }}</span>
              </template>
            </div>

            <div class="mp-card__actions">
              <V2Select
                :model-value="item.category"
                :options="categoryOptions"
                placeholder="Category"
                size="compact"
                aria-label="Item category"
                @update:model-value="setItemCategory(item.id, $event)"
              />
              <button v-if="editingItemId !== item.id" class="mp-icon-btn" type="button" title="Edit" @click="startEditingItem(item)">
                Edit
              </button>
              <button v-else class="mp-icon-btn" type="button" :disabled="!editName" @click="saveItemEdit(item.id)">
                Save
              </button>
              <button class="mp-icon-btn mp-icon-btn--danger" type="button" :title="pendingRemoveItemId === item.id ? 'Confirm remove' : 'Remove'" @click="removeTrackedItem(item.id)">
                {{ pendingRemoveItemId === item.id ? 'Confirm' : 'Remove' }}
              </button>
            </div>
          </div>

          <div class="mp-entry">
            <input
              v-model.number="priceDrafts[item.id]"
              class="mp-input"
              type="number"
              min="0"
              placeholder="HDV price"
              @keyup.enter="addObservation(item.id)"
            />
            <V2Select
              :model-value="lotDrafts[item.id] || 100"
              :options="lotOptions"
              placeholder="Lot"
              size="compact"
              aria-label="Lot size"
              @update:model-value="setLotDraft(item.id, $event)"
            />
            <V2DateInput v-model="dateDrafts[item.id]" placeholder="Date" />
            <V2Select
              :model-value="slotDrafts[item.id] || 'auto'"
              :options="slotOptions"
              placeholder="Time"
              size="compact"
              aria-label="Price check time"
              @update:model-value="setSlotDraft(item.id, $event)"
            />
            <button class="mp-btn" type="button" :disabled="!priceDrafts[item.id]" @click="addObservation(item.id)">
              Save
            </button>
          </div>

          <div class="mp-metrics">
            <div><span>Latest</span><strong>{{ formatKamas(getLatestObservation(item)?.price ?? 0) }}</strong></div>
            <div><span>Today</span><strong>{{ formatRange(getTodayRange(item)) }}</strong></div>
            <div><span>7 days</span><strong>{{ formatRange(getWeekRange(item)) }}</strong></div>
            <div><span>All time</span><strong>{{ formatRange(getAllTimeRange(item)) }}</strong></div>
          </div>

          <div v-if="getChartPoints(item).length >= 2" class="mp-graph">
            <PriceSparkline :points="getChartPoints(item)" :label="`${item.name} price graph`" />
          </div>

          <div v-if="item.observations.length" class="mp-history">
            <div v-for="observation in item.observations.slice(0, 8)" :key="observation.id" class="mp-history__row">
              <span>{{ formatDateTime(observation.createdAt) }} · {{ slotLabel(observation.slot) }} · x{{ getLotSize(observation) }}</span>
              <div class="mp-history__value">
                <strong>{{ formatKamas(observation.price) }}</strong>
                <button class="mp-text-btn" type="button" title="Delete price" @click="removeObservation(item.id, observation.id)">
                  Delete
                </button>
              </div>
            </div>
          </div>
          <div v-else class="mp-empty">No prices yet.</div>
        </article>

        <div v-if="sortedItems.length === 0" class="mp-empty-page">
          No items in this category.
        </div>
      </section>

      <section v-else class="mp-empty-page">
        Add your first item above.
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { MarketCategory, MarketLotSize, MarketObservation, MarketSlot, TrackedMarketItem } from '~/composables/useAppDataStore'


const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()
const appStore = useAppDataStore()
const { data } = appStore

const priceDrafts = reactive<Record<string, number | null>>({})
const lotDrafts = reactive<Record<string, MarketLotSize>>({})
const dateDrafts = reactive<Record<string, string>>({})
const slotDrafts = reactive<Record<string, MarketSlot | 'auto'>>({})
const draftName = ref('')
const editName = ref('')
const editingItemId = ref<string | null>(null)
const pendingRemoveItemId = ref<string | null>(null)
const transferMessage = ref('')
const transferError = ref(false)
const lastChangedItemId = ref<string | null>(null)
const copiedItemId = ref<string | null>(null)
let lastChangedTimeout: number | null = null

type CategoryFilter = MarketCategory | 'all'
type ChartPeriod = 'day' | 'week' | 'month'
type PriceTab = 'tracked' | 'pressure'
type PressureSlot = 'ar' | 'ch' | 'ca' | 'am' | 'br' | 'ce' | 'bo' | 'ring' | 'fa' | 'dofus'
type PressureLimit = 3 | 5 | 10 | 20
type PressureSort = 'usage' | 'pressure' | 'unchecked' | 'rising' | 'dipping'

interface PressureTopItem {
  name: string
  count: number
  image_url?: string | null
}

interface PressureRecipeEntry {
  item: PressureTopItem
  recipe: any
}

interface PressureResource {
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
  items: PressureTopItem[]
}

const activeTab = ref<PriceTab>('tracked')
const categoryFilter = ref<CategoryFilter>('all')
const chartPeriod = ref<ChartPeriod>('week')
const pressureSlot = ref<PressureSlot>('ring')
const pressureLimit = ref<PressureLimit>(5)
const pressureSort = ref<PressureSort>('usage')
const copiedPressureId = ref<number | null>(null)
const selectedPressureResourceIds = ref<number[]>([])
let pressureSettingsHydrating = false

const pressureFilters = reactive({
  element: '',
  mode: '',
  classe: '',
  level: '',
  budget: '',
  hideSpecial: true,
  onlyMonsterDrops: false,
  onlyNonCrafted: false,
  minItemUsage: 1,
})

const pressureState = ref<{
  isLoading: boolean
  error: string
  loadedAt: string | null
  selectedItems: PressureTopItem[]
  data: PressureRecipeEntry[]
}>({
  isLoading: false,
  error: '',
  loadedAt: null,
  selectedItems: [],
  data: [],
})

const slotOptions = [
  { key: 'auto', label: 'Auto', value: 'auto' },
  { key: 'morning', label: 'Morning', value: 'morning' },
  { key: 'midday', label: 'Midday', value: 'midday' },
  { key: 'evening', label: 'Evening', value: 'evening' },
  { key: 'night', label: 'Night', value: 'night' },
] satisfies Array<{ key: string; label: string; value: MarketSlot | 'auto' }>

const lotOptions = [
  { key: '1', label: 'x1', value: 1 },
  { key: '10', label: 'x10', value: 10 },
  { key: '100', label: 'x100', value: 100 },
] satisfies Array<{ key: string; label: string; value: MarketLotSize }>

const categoryOptions = [
  { key: 'rune', label: 'Rune', value: 'rune' },
  { key: 'miner', label: 'Miner', value: 'miner' },
  { key: 'farmer', label: 'Farmer', value: 'farmer' },
  { key: 'alchemist', label: 'Alchemist', value: 'alchemist' },
  { key: 'resource', label: 'Resource', value: 'resource' },
  { key: 'other', label: 'Other', value: 'other' },
] satisfies Array<{ key: string; label: string; value: MarketCategory }>

const categoryFilterOptions = [
  { key: 'all', label: 'All categories', value: 'all' },
  ...categoryOptions,
] satisfies Array<{ key: string; label: string; value: CategoryFilter }>

const chartPeriodOptions = [
  { key: 'day', label: 'Day chart', value: 'day' },
  { key: 'week', label: 'Week chart', value: 'week' },
  { key: 'month', label: 'Month chart', value: 'month' },
] satisfies Array<{ key: string; label: string; value: ChartPeriod }>

const pressureSlotOptions = [
  { key: 'ar', label: 'Weapon', value: 'ar' },
  { key: 'ch', label: 'Hat', value: 'ch' },
  { key: 'ca', label: 'Cloak', value: 'ca' },
  { key: 'am', label: 'Amulet', value: 'am' },
  { key: 'br', label: 'Shield', value: 'br' },
  { key: 'ce', label: 'Belt', value: 'ce' },
  { key: 'bo', label: 'Boots', value: 'bo' },
  { key: 'ring', label: 'Ring', value: 'ring' },
  { key: 'fa', label: 'Pet', value: 'fa' },
  { key: 'dofus', label: 'Dofus', value: 'dofus' },
] satisfies Array<{ key: string; label: string; value: PressureSlot }>

const pressureLimitOptions = [
  { key: '3', label: 'Top 3', value: 3 },
  { key: '5', label: 'Top 5', value: 5 },
  { key: '10', label: 'Top 10', value: 10 },
  { key: '20', label: 'Top 20', value: 20 },
] satisfies Array<{ key: string; label: string; value: PressureLimit }>

const pressureSortOptions = [
  { key: 'usage', label: 'Most used', value: 'usage' },
  { key: 'pressure', label: 'Highest pressure', value: 'pressure' },
  { key: 'unchecked', label: 'Unchecked first', value: 'unchecked' },
  { key: 'rising', label: 'Price rising', value: 'rising' },
  { key: 'dipping', label: 'Price dipping', value: 'dipping' },
] satisfies Array<{ key: string; label: string; value: PressureSort }>

const pressureElementOptions = [
  { key: 'all', label: 'All elements', value: '' },
  { key: 'eau', label: 'Eau', value: 'eau' },
  { key: 'feu', label: 'Feu', value: 'feu' },
  { key: 'terre', label: 'Terre', value: 'terre' },
  { key: 'air', label: 'Air', value: 'air' },
  { key: 'multi', label: 'Multi', value: 'multi' },
  { key: 'tank', label: 'Tank', value: 'tank' },
  { key: 'doPou', label: 'Do Pou', value: 'doPou' },
  { key: 'pp', label: 'PP', value: 'pp' },
] satisfies Array<{ key: string; label: string; value: string }>

const pressureModeOptions = [
  { key: 'all', label: 'All modes', value: '' },
  { key: 'pvm', label: 'PvM', value: 'pvm' },
  { key: 'pvp', label: 'PvP', value: 'pvp' },
] satisfies Array<{ key: string; label: string; value: string }>

const pressureClassOptions = [
  { key: 'all', label: 'All classes', value: '' },
  { key: 'iop', label: 'Iop', value: 'iop' },
  { key: 'cra', label: 'Cra', value: 'cra' },
  { key: 'sacrieur', label: 'Sacrieur', value: 'sacrieur' },
  { key: 'eniripsa', label: 'Eniripsa', value: 'eniripsa' },
  { key: 'sram', label: 'Sram', value: 'sram' },
  { key: 'ouginak', label: 'Ouginak', value: 'ouginak' },
  { key: 'forgelance', label: 'Forgelance', value: 'forgelance' },
  { key: 'osamodas', label: 'Osamodas', value: 'osamodas' },
  { key: 'enutrof', label: 'Enutrof', value: 'enutrof' },
  { key: 'ecaflip', label: 'Ecaflip', value: 'ecaflip' },
  { key: 'steamer', label: 'Steamer', value: 'steamer' },
  { key: 'feca', label: 'Feca', value: 'feca' },
  { key: 'huppermage', label: 'Huppermage', value: 'huppermage' },
  { key: 'zobal', label: 'Zobal', value: 'zobal' },
  { key: 'pandawa', label: 'Pandawa', value: 'pandawa' },
  { key: 'eliotrope', label: 'Eliotrope', value: 'eliotrope' },
  { key: 'sadida', label: 'Sadida', value: 'sadida' },
  { key: 'roublard', label: 'Roublard', value: 'roublard' },
  { key: 'xelor', label: 'Xelor', value: 'xelor' },
] satisfies Array<{ key: string; label: string; value: string }>

const pressureLevelOptions = [
  { key: 'all', label: 'All levels', value: '' },
  ...['20', '40', '60', '80', '110', '130', '160', '180', '199', '200'].map((level) => ({
    key: level,
    label: `Lvl ${level}`,
    value: level,
  })),
] satisfies Array<{ key: string; label: string; value: string }>

const pressureBudgetOptions = [
  { key: 'all', label: 'All budgets', value: '' },
  { key: 'low', label: 'Low', value: 'low' },
  { key: 'mid', label: 'Mid', value: 'mid' },
  { key: 'high', label: 'High', value: 'high' },
] satisfies Array<{ key: string; label: string; value: string }>

const pressureSlotMembers: Record<PressureSlot, string[]> = {
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

const pressureSlotKeyToGroup = Object.fromEntries(
  Object.entries(pressureSlotMembers).flatMap(([groupKey, members]) =>
    members.map(member => [member, groupKey] as const),
  ),
) as Record<string, PressureSlot>

const recipeCacheKey = 'dofus-items-dofusdb-recipe-cache-v1'

const storageKey = computed(() => {
  if (!selectedServer.value?.id || !selectedCharacter.value?.id) return ''
  return `dofus-market-watch-${selectedServer.value.id}-${selectedCharacter.value.id}`
})

const pressureSettingsStorageKey = computed(() => {
  if (!selectedServer.value?.id || !selectedCharacter.value?.id) return ''
  return `dofus-prices-pressure-settings-${selectedServer.value.id}-${selectedCharacter.value.id}`
})

const trackedItems = computed(() => {
  const serverId = selectedServer.value?.id
  const characterId = selectedCharacter.value?.id
  if (!serverId || !characterId) return []
  return data.value.market.trackedItems.filter((item) => item.serverId === serverId && item.characterId === characterId)
})

const visibleItems = computed(() => trackedItems.value.filter((item) => categoryFilter.value === 'all' || item.category === categoryFilter.value))

const getItemCheckedAtMs = (item: TrackedMarketItem) => new Date(item.lastCheckedAt || getLatestObservation(item)?.createdAt || item.createdAt).getTime()
const needsUpdate = (item: TrackedMarketItem) => !isToday(item.lastCheckedAt || '') && !item.observations.some((entry) => isToday(entry.createdAt))

const sortedItems = computed(() => visibleItems.value.slice().sort((a, b) => {
  const updateRank = Number(needsUpdate(b)) - Number(needsUpdate(a))
  if (updateRank !== 0) return updateRank
  return getItemCheckedAtMs(a) - getItemCheckedAtMs(b)
}))

const todayLoggedCount = computed(() => trackedItems.value.filter((item) => !needsUpdate(item)).length)

const normalizePressureName = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/['`]/g, "'")
  .toLowerCase()
  .trim()

const trackedItemNameMap = computed(() => {
  const map = new Map<string, TrackedMarketItem>()
  trackedItems.value.forEach((item) => map.set(normalizePressureName(item.name), item))
  return map
})

const getPressureTrackedItem = (resource: PressureResource) => trackedItemNameMap.value.get(normalizePressureName(resource.name)) ?? null

const getPressureTrendPercent = (item: TrackedMarketItem | null) => {
  if (!item || item.observations.length < 2) return null
  const latest = item.observations[0]?.price ?? 0
  const previous = item.observations[1]?.price ?? 0
  if (latest <= 0 || previous <= 0) return null
  return Math.round(((latest - previous) / previous) * 100)
}

const basePressureResourceSort = (a: PressureResource, b: PressureResource) => {
  if (b.buildUsageCount !== a.buildUsageCount) return b.buildUsageCount - a.buildUsageCount
  if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount
  if (b.pressureScore !== a.pressureScore) return b.pressureScore - a.pressureScore
  return a.name.localeCompare(b.name)
}

const pressureUncheckedRank = (resource: PressureResource) => {
  const item = getPressureTrackedItem(resource)
  if (!item) return 0
  return needsUpdate(item) ? 1 : 2
}

const pressureTrendSort = (a: PressureResource, b: PressureResource, direction: 'asc' | 'desc') => {
  const aTrend = getPressureTrendPercent(getPressureTrackedItem(a))
  const bTrend = getPressureTrendPercent(getPressureTrackedItem(b))
  if (aTrend === null && bTrend !== null) return 1
  if (aTrend !== null && bTrend === null) return -1
  if (aTrend !== null && bTrend !== null && aTrend !== bTrend) {
    return direction === 'asc' ? aTrend - bTrend : bTrend - aTrend
  }
  return basePressureResourceSort(a, b)
}

const comparePressureResources = (a: PressureResource, b: PressureResource) => {
  if (pressureSort.value === 'pressure') {
    if (b.pressureScore !== a.pressureScore) return b.pressureScore - a.pressureScore
    return basePressureResourceSort(a, b)
  }
  if (pressureSort.value === 'unchecked') {
    const rank = pressureUncheckedRank(a) - pressureUncheckedRank(b)
    return rank || basePressureResourceSort(a, b)
  }
  if (pressureSort.value === 'rising') return pressureTrendSort(a, b, 'desc')
  if (pressureSort.value === 'dipping') return pressureTrendSort(a, b, 'asc')
  return basePressureResourceSort(a, b)
}

const processPressureEquipments = (equipments: any[], slot: PressureSlot): PressureTopItem[] => {
  const counts = new Map<string, { count: number; image_url?: string | null }>()

  equipments.forEach((equipment) => {
    if (!equipment?.items) return
    const seen = new Set<string>()

    Object.entries(equipment.items).forEach(([slotKey, item]: [string, any]) => {
      if (pressureSlotKeyToGroup[slotKey] !== slot || !item?.name || seen.has(item.name)) return
      seen.add(item.name)
      const existing = counts.get(item.name)
      counts.set(item.name, {
        count: (existing?.count ?? 0) + 1,
        image_url: existing?.image_url ?? item.image_url ?? null,
      })
    })
  })

  return Array.from(counts.entries())
    .map(([name, entry]) => ({ name, count: entry.count, image_url: entry.image_url ?? null }))
    .sort((a, b) => b.count - a.count)
}

const buildPressureQuery = () => {
  const params = new URLSearchParams()
  if (pressureFilters.element) params.append('where[tags][in][0]', pressureFilters.element)
  if (pressureFilters.mode) params.append('where[mode][equals]', pressureFilters.mode)
  if (pressureFilters.classe) params.append('where[classe][equals]', pressureFilters.classe)
  if (pressureFilters.level) params.append('where[level][equals]', pressureFilters.level)
  if (pressureFilters.budget) params.append('where[budget][equals]', pressureFilters.budget)
  params.append('limit', '1000')
  return params.toString()
}

const readRecipeCache = (): Record<string, any> => {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(recipeCacheKey)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeRecipeCache = (cache: Record<string, any>) => {
  if (!import.meta.client) return
  localStorage.setItem(recipeCacheKey, JSON.stringify(cache))
}

const pressureErrorText = (error: unknown) => {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const value = error as { statusMessage?: string; message?: string }
    return value.statusMessage || value.message || 'Unknown error'
  }
  return 'Unknown error'
}

const fetchPressureRecipe = async (item: PressureTopItem): Promise<PressureRecipeEntry> => {
  const normalizedName = normalizePressureName(item.name)
  const cache = readRecipeCache()
  const cachedEntry = cache[normalizedName]

  if (cachedEntry?.recipe) {
    return { item, recipe: cachedEntry.recipe }
  }

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
  if (!matchedItem?.id) throw new Error(`Could not resolve ${item.name}`)

  const recipe = await $fetch(`/api/dofusdb/recipes/${matchedItem.id}`, { query: { lang: 'fr' } })
  cache[normalizedName] = {
    normalizedName,
    dofusdbId: matchedItem.id,
    matchedName: matchedItem?.name?.fr || matchedItem?.name?.en || item.name,
    confidence: normalizePressureName(item.name) === normalizePressureName(matchedItem?.name?.fr || matchedItem?.name?.en || '') ? 'exact' : 'approx',
    recipe,
    updatedAt: new Date().toISOString(),
  }
  writeRecipeCache(cache)

  return { item, recipe }
}

const isSpecialPressureIngredient = (ingredientId: number, ingredient: any) => {
  const normalizedTypeName = normalizePressureName(ingredient?.type?.name?.fr || ingredient?.type?.name?.en || '')
  const normalizedIngredientName = normalizePressureName(ingredient?.name?.fr || ingredient?.name?.en || '')
  return ingredientId === 14635 ||
    ['pepite', 'pepita', 'nugget'].includes(normalizedIngredientName) ||
    ['subtrat', 'substrat', 'concentrado', 'galet'].some((token) => normalizedTypeName.includes(token))
}

const pressureResources = computed(() => {
  const ingredientMap = new Map<number, PressureResource>()

  pressureState.value.data.forEach((entry) => {
    const seenInRecipe = new Set<number>()

    entry.recipe?.ingredientIds?.forEach((ingredientId: number, index: number) => {
      const quantity = Number(entry.recipe?.quantities?.[index] ?? 0)
      if (!Number.isFinite(quantity) || quantity <= 0) return

      const ingredient = entry.recipe?.ingredients?.find((candidate: any) => candidate.id === ingredientId)
      const existing = ingredientMap.get(ingredientId)
      const wasSeen = seenInRecipe.has(ingredientId)
      if (!wasSeen) seenInRecipe.add(ingredientId)

      if (existing) {
        if (!wasSeen) {
          existing.usageCount += 1
          existing.buildUsageCount += entry.item.count
          existing.items.push(entry.item)
        }
        existing.totalQuantity += quantity
        existing.pressureScore += quantity * entry.item.count
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
        isSpecial: isSpecialPressureIngredient(ingredientId, ingredient),
        usageCount: 1,
        totalQuantity: quantity,
        buildUsageCount: entry.item.count,
        pressureScore: quantity * entry.item.count,
        items: [entry.item],
      })
    })
  })

  return Array.from(ingredientMap.values())
    .filter((resource) => {
      if (pressureFilters.hideSpecial && resource.isSpecial) return false
      if (pressureFilters.onlyMonsterDrops && resource.dropMonsterCount === 0) return false
      if (pressureFilters.onlyNonCrafted && resource.hasRecipe) return false
      if (resource.usageCount < pressureFilters.minItemUsage) return false
      return true
    })
    .sort(comparePressureResources)
})

const untrackedPressureResources = computed(() => pressureResources.value.filter((resource) => !getPressureTrackedItem(resource)))
const selectedPressureResources = computed(() => pressureResources.value.filter((resource) => selectedPressureResourceIds.value.includes(resource.id)))
const untrackedSelectedPressureResources = computed(() => selectedPressureResources.value.filter((resource) => !getPressureTrackedItem(resource)))

const isPressureResourceSelected = (resourceId: number) => selectedPressureResourceIds.value.includes(resourceId)

const togglePressureResourceSelection = (resourceId: number) => {
  selectedPressureResourceIds.value = isPressureResourceSelected(resourceId)
    ? selectedPressureResourceIds.value.filter((id) => id !== resourceId)
    : [...selectedPressureResourceIds.value, resourceId]
}

const refreshPressure = async () => {
  if (pressureState.value.isLoading) return
  pressureState.value = {
    ...pressureState.value,
    isLoading: true,
    error: '',
    data: [],
  }

  try {
    const response = await $fetch<any>(`/api/items/items?${buildPressureQuery()}`)
    const selectedItems = processPressureEquipments(response?.docs ?? [], pressureSlot.value).slice(0, Number(pressureLimit.value) || 5)
    if (!selectedItems.length) {
      pressureState.value = {
        isLoading: false,
        error: '',
        loadedAt: new Date().toISOString(),
        selectedItems: [],
        data: [],
      }
      return
    }

    const recipeResults = await Promise.allSettled(selectedItems.map(fetchPressureRecipe))
    const recipes = recipeResults
      .filter((result): result is PromiseFulfilledResult<PressureRecipeEntry> => result.status === 'fulfilled')
      .map((result) => result.value)

    if (!recipes.length && selectedItems.length) {
      const firstFailure = recipeResults.find((result): result is PromiseRejectedResult => result.status === 'rejected')
      throw new Error(`No recipes resolved: ${pressureErrorText(firstFailure?.reason)}`)
    }

    pressureState.value = {
      isLoading: false,
      error: '',
      loadedAt: new Date().toISOString(),
      selectedItems,
      data: recipes,
    }
    if (recipes.length < selectedItems.length) {
      setTransferMessage('Some recipes could not be resolved; showing partial pressure.', true)
    }
  } catch (error) {
    console.error('Error loading recipe pressure:', error)
    pressureState.value = {
      ...pressureState.value,
      isLoading: false,
      error: `Could not load recipe pressure: ${pressureErrorText(error)}`,
      data: [],
    }
  }
}

const openPressureTab = () => {
  activeTab.value = 'pressure'
  if (!pressureState.value.loadedAt && !pressureState.value.isLoading) refreshPressure()
}

const getPressureSignal = (resource: PressureResource) => {
  const item = getPressureTrackedItem(resource)
  if (!item) return { label: 'Track first', tone: 'new' }
  if (needsUpdate(item)) return { label: 'Check today', tone: 'warn' }

  const trend = getPressureTrendPercent(item)
  if (trend !== null && trend <= -8) return { label: `${Math.abs(trend)}% cheaper`, tone: 'good' }
  if (trend !== null && trend >= 8) return { label: `${trend}% rising`, tone: 'hot' }
  return { label: 'Tracked', tone: 'neutral' }
}

const getPressureReasons = (resource: PressureResource) => {
  const item = getPressureTrackedItem(resource)
  const trend = getPressureTrendPercent(item)
  const reasons = [
    `${resource.buildUsageCount} build uses`,
    `${resource.usageCount} recipes`,
  ]

  if (!item) reasons.push('Untracked')
  else if (needsUpdate(item)) reasons.push('Needs check')
  if (resource.dropMonsterCount > 0) reasons.push('Monster drop')
  if (!resource.hasRecipe) reasons.push('Non-crafted')
  if (trend !== null && trend <= -8) reasons.push('Price dipping')
  if (trend !== null && trend >= 8) reasons.push('Price rising')
  return reasons.slice(0, 5)
}

const trackPressureResource = (resource: PressureResource) => {
  if (!selectedServer.value?.id || !selectedCharacter.value?.id) return
  const existing = getPressureTrackedItem(resource)

  if (existing) {
    if (existing.category !== 'resource') existing.category = 'resource'
    activeTab.value = 'tracked'
    categoryFilter.value = 'resource'
    markItemChanged(existing.id)
    return
  }

  const item: TrackedMarketItem = {
    id: crypto.randomUUID(),
    name: resource.name,
    category: 'resource',
    preferredLotSize: 100,
    buyBelow: 0,
    sellAround: 0,
    serverId: selectedServer.value.id,
    characterId: selectedCharacter.value.id,
    createdAt: new Date().toISOString(),
    lastCheckedAt: null,
    observations: [],
  }

  data.value.market.trackedItems.unshift(item)
  priceDrafts[item.id] = null
  lotDrafts[item.id] = 100
  dateDrafts[item.id] = todayInput()
  slotDrafts[item.id] = 'auto'
  activeTab.value = 'tracked'
  categoryFilter.value = 'resource'
  markItemChanged(item.id)
}

const trackTopPressureResources = () => {
  untrackedPressureResources.value.slice(0, 8).forEach((resource) => trackPressureResource(resource))
  activeTab.value = 'tracked'
  categoryFilter.value = 'resource'
}

const trackSelectedPressureResources = () => {
  const resources = untrackedSelectedPressureResources.value
  if (!resources.length) return
  resources.forEach((resource) => trackPressureResource(resource))
  selectedPressureResourceIds.value = selectedPressureResourceIds.value.filter((id) => !resources.some((resource) => resource.id === id))
  activeTab.value = 'tracked'
  categoryFilter.value = 'resource'
}

const copyPressureName = async (resource: PressureResource) => {
  if (!import.meta.client) return
  try {
    await navigator.clipboard.writeText(resource.name)
    copiedPressureId.value = resource.id
    window.setTimeout(() => {
      if (copiedPressureId.value === resource.id) copiedPressureId.value = null
    }, 1400)
  } catch {
    setTransferMessage('Could not copy resource name.', true)
  }
}

const todayInput = () => {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

const initDrafts = () => {
  for (const item of trackedItems.value) {
    if (!(item.id in priceDrafts)) priceDrafts[item.id] = null
    if (!validLotSizes.includes(Number(item.preferredLotSize) as MarketLotSize)) item.preferredLotSize = 100
    if (!lotDrafts[item.id]) lotDrafts[item.id] = item.preferredLotSize
    if (!dateDrafts[item.id]) dateDrafts[item.id] = todayInput()
    if (!slotDrafts[item.id]) slotDrafts[item.id] = 'auto'
    for (const observation of item.observations) {
      if (!validLotSizes.includes(Number(observation.lotSize) as MarketLotSize)) {
        observation.lotSize = 100
      }
    }
  }
}

const setTransferMessage = (message: string, isError = false) => {
  transferMessage.value = message
  transferError.value = isError
  if (!import.meta.client) return
  window.setTimeout(() => {
    if (transferMessage.value === message) {
      transferMessage.value = ''
      transferError.value = false
    }
  }, 4000)
}

const hasOptionValue = (options: Array<{ value: string | number }>, value: unknown) => options.some((option) => option.value === value)

const loadPressureSettings = () => {
  if (!import.meta.client || !pressureSettingsStorageKey.value) return
  pressureSettingsHydrating = true
  try {
    const raw = localStorage.getItem(pressureSettingsStorageKey.value)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object') return

    if (hasOptionValue(pressureSlotOptions, parsed.slot)) pressureSlot.value = parsed.slot
    if (hasOptionValue(pressureLimitOptions, parsed.limit)) pressureLimit.value = parsed.limit
    if (hasOptionValue(pressureSortOptions, parsed.sort)) pressureSort.value = parsed.sort

    const filters = parsed.filters && typeof parsed.filters === 'object' ? parsed.filters : {}
    if (hasOptionValue(pressureElementOptions, filters.element)) pressureFilters.element = filters.element
    if (hasOptionValue(pressureModeOptions, filters.mode)) pressureFilters.mode = filters.mode
    if (hasOptionValue(pressureClassOptions, filters.classe)) pressureFilters.classe = filters.classe
    if (hasOptionValue(pressureLevelOptions, filters.level)) pressureFilters.level = filters.level
    if (hasOptionValue(pressureBudgetOptions, filters.budget)) pressureFilters.budget = filters.budget
    if (typeof filters.hideSpecial === 'boolean') pressureFilters.hideSpecial = filters.hideSpecial
    if (typeof filters.onlyMonsterDrops === 'boolean') pressureFilters.onlyMonsterDrops = filters.onlyMonsterDrops
    if (typeof filters.onlyNonCrafted === 'boolean') pressureFilters.onlyNonCrafted = filters.onlyNonCrafted
    pressureFilters.minItemUsage = filters.minItemUsage === 2 ? 2 : 1
  } catch {
    localStorage.removeItem(pressureSettingsStorageKey.value)
  } finally {
    pressureSettingsHydrating = false
  }
}

const savePressureSettings = () => {
  if (!import.meta.client || pressureSettingsHydrating || !pressureSettingsStorageKey.value) return
  localStorage.setItem(pressureSettingsStorageKey.value, JSON.stringify({
    slot: pressureSlot.value,
    limit: pressureLimit.value,
    sort: pressureSort.value,
    filters: {
      element: pressureFilters.element,
      mode: pressureFilters.mode,
      classe: pressureFilters.classe,
      level: pressureFilters.level,
      budget: pressureFilters.budget,
      hideSpecial: pressureFilters.hideSpecial,
      onlyMonsterDrops: pressureFilters.onlyMonsterDrops,
      onlyNonCrafted: pressureFilters.onlyNonCrafted,
      minItemUsage: pressureFilters.minItemUsage,
    },
  }))
}

const markItemChanged = (id: string) => {
  lastChangedItemId.value = id
  if (!import.meta.client) return
  if (lastChangedTimeout) window.clearTimeout(lastChangedTimeout)
  lastChangedTimeout = window.setTimeout(() => {
    if (lastChangedItemId.value === id) lastChangedItemId.value = null
    lastChangedTimeout = null
  }, 4500)
}

const nowSlot = (): MarketSlot => {
  const hour = new Date().getHours()
  if (hour < 11) return 'morning'
  if (hour < 17) return 'midday'
  if (hour < 22) return 'evening'
  return 'night'
}

const slotHour = (slot: MarketSlot) => ({
  morning: 9,
  midday: 13,
  evening: 19,
  night: 23,
}[slot])

const buildObservationDate = (dateValue: string, slot: MarketSlot) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : todayInput()
  const today = todayInput()
  if (date === today && slot === nowSlot()) return new Date().toISOString()
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, slotHour(slot), 0, 0, 0).toISOString()
}

const setSlotDraft = (itemId: string, value: string | number | null) => {
  slotDrafts[itemId] = ['morning', 'midday', 'evening', 'night', 'auto'].includes(String(value))
    ? String(value) as MarketSlot | 'auto'
    : 'auto'
}

const setLotDraft = (itemId: string, value: string | number | null) => {
  const lotSize = Number(value)
  const normalizedLotSize = ([1, 10, 100].includes(lotSize) ? lotSize : 100) as MarketLotSize
  lotDrafts[itemId] = normalizedLotSize
  const item = data.value.market.trackedItems.find((entry) => entry.id === itemId)
  if (item) item.preferredLotSize = normalizedLotSize
}

const setItemCategory = (itemId: string, value: string | number | null) => {
  const category = String(value) as MarketCategory
  if (!validCategories.includes(category)) return
  const item = data.value.market.trackedItems.find((entry) => entry.id === itemId)
  if (!item || item.category === category) return
  item.category = category
  markItemChanged(itemId)
}

const runeBackfillKey = 'dofus-prices-rune-backfill-v1'

const tagExistingItemsAsRuneOnce = () => {
  if (!import.meta.client || localStorage.getItem(runeBackfillKey)) return
  if (!data.value.market.trackedItems.length) return
  for (const item of data.value.market.trackedItems) {
    item.category = 'rune'
  }
  localStorage.setItem(runeBackfillKey, new Date().toISOString())
}

const copyItemName = async (item: TrackedMarketItem) => {
  if (!import.meta.client) return
  try {
    await navigator.clipboard.writeText(item.name)
    copiedItemId.value = item.id
    window.setTimeout(() => {
      if (copiedItemId.value === item.id) copiedItemId.value = null
    }, 1400)
  } catch {
    setTransferMessage('Could not copy item name.', true)
  }
}

const readLegacyItems = () => {
  if (!import.meta.client || !storageKey.value) return []
  try {
    const raw = localStorage.getItem(storageKey.value)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const migrateLegacyItems = () => {
  if (!selectedServer.value?.id || !selectedCharacter.value?.id) return
  if (trackedItems.value.length > 0) return

  const legacyItems = readLegacyItems().map((item: any) => ({
    id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
    name: typeof item.name === 'string' ? item.name : 'Unnamed item',
    category: ['rune', 'miner', 'farmer', 'alchemist', 'resource', 'other'].includes(item.category) ? item.category as MarketCategory : 'other',
    preferredLotSize: [1, 10, 100].includes(Number(item.preferredLotSize)) ? Number(item.preferredLotSize) as MarketLotSize : 100,
    buyBelow: Number(item.buyBelow || 0),
    sellAround: Number(item.sellAround || 0),
    serverId: selectedServer.value!.id,
    characterId: selectedCharacter.value!.id,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    lastCheckedAt: typeof item.lastCheckedAt === 'string' ? item.lastCheckedAt : null,
    observations: Array.isArray(item.observations)
      ? item.observations
        .map((observation: any) => ({
          id: typeof observation.id === 'string' ? observation.id : crypto.randomUUID(),
          price: Number(observation.price || 0),
          lotSize: [1, 10, 100].includes(Number(observation.lotSize)) ? Number(observation.lotSize) as MarketLotSize : 100,
          slot: ['morning', 'midday', 'evening', 'night'].includes(observation.slot) ? observation.slot as MarketSlot : nowSlot(),
          createdAt: typeof observation.createdAt === 'string' ? observation.createdAt : new Date().toISOString(),
        }))
        .filter((observation: MarketObservation) => observation.price > 0)
      : [],
  }))

  if (legacyItems.length) data.value.market.trackedItems.unshift(...legacyItems)
}

const cloneMarketItemForExport = (item: TrackedMarketItem) => ({
  ...item,
  observations: item.observations.map((observation) => ({
    ...observation,
    lotSize: getLotSize(observation),
  })),
})

const exportPrices = () => {
  if (!import.meta.client || !selectedServer.value?.id || !selectedCharacter.value?.id) return
  const payload = {
    type: 'dofus-prices-export',
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    server: {
      id: selectedServer.value.id,
      name: selectedServer.value.name,
    },
    character: {
      id: selectedCharacter.value.id,
      name: selectedCharacter.value.name,
    },
    items: trackedItems.value.map(cloneMarketItemForExport),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `dofus-prices-${selectedServer.value.name}-${selectedCharacter.value.name}-${new Date().toISOString().slice(0, 10)}.json`.replace(/[\\/:*?"<>|]/g, '-')
  link.click()
  URL.revokeObjectURL(url)
  setTransferMessage(`Exported ${trackedItems.value.length} item${trackedItems.value.length === 1 ? '' : 's'}.`)
}

const readImportFile = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(new Error('Failed to read file'))
  reader.readAsText(file)
})

const isPlainObject = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object'
const validSlots: MarketSlot[] = ['morning', 'midday', 'evening', 'night']
const validCategories: MarketCategory[] = ['rune', 'miner', 'farmer', 'alchemist', 'resource', 'other']
const validLotSizes: MarketLotSize[] = [1, 10, 100]

const normalizeImportedObservation = (value: unknown, itemId: string, index: number): MarketObservation | null => {
  if (!isPlainObject(value)) return null
  const price = Number(value.price || 0)
  if (!Number.isFinite(price) || price <= 0) return null
  const createdAt = typeof value.createdAt === 'string' && !Number.isNaN(new Date(value.createdAt).getTime())
    ? value.createdAt
    : new Date().toISOString()
  return {
    id: typeof value.id === 'string' && value.id ? value.id : `${itemId}-import-${createdAt}-${index}`,
    price,
    lotSize: validLotSizes.includes(Number(value.lotSize) as MarketLotSize) ? Number(value.lotSize) as MarketLotSize : 100,
    slot: typeof value.slot === 'string' && validSlots.includes(value.slot as MarketSlot) ? value.slot as MarketSlot : nowSlot(),
    createdAt,
  }
}

const normalizeImportedItem = (value: unknown, index: number): TrackedMarketItem | null => {
  if (!isPlainObject(value) || !selectedServer.value?.id || !selectedCharacter.value?.id) return null
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  if (!name) return null
  const id = typeof value.id === 'string' && value.id ? value.id : `prices-import-${Date.now()}-${index}`
  const observations = Array.isArray(value.observations)
    ? value.observations
      .map((observation, observationIndex) => normalizeImportedObservation(observation, id, observationIndex))
      .filter(Boolean) as MarketObservation[]
    : []

  return {
    id,
    name,
    category: typeof value.category === 'string' && validCategories.includes(value.category as MarketCategory) ? value.category as MarketCategory : 'other',
    preferredLotSize: validLotSizes.includes(Number(value.preferredLotSize) as MarketLotSize) ? Number(value.preferredLotSize) as MarketLotSize : 100,
    buyBelow: Number(value.buyBelow || 0),
    sellAround: Number(value.sellAround || 0),
    serverId: selectedServer.value.id,
    characterId: selectedCharacter.value.id,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    lastCheckedAt: typeof value.lastCheckedAt === 'string' ? value.lastCheckedAt : null,
    observations: observations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  }
}

const getImportItems = (parsed: unknown) => {
  if (!isPlainObject(parsed)) return []
  if (parsed.type === 'dofus-prices-export' && Array.isArray(parsed.items)) return parsed.items
  const storeItems = isPlainObject(parsed.store) && isPlainObject(parsed.store.market) && Array.isArray(parsed.store.market.trackedItems)
    ? parsed.store.market.trackedItems
    : isPlainObject(parsed.market) && Array.isArray(parsed.market.trackedItems)
      ? parsed.market.trackedItems
      : []
  if (!selectedServer.value?.id || !selectedCharacter.value?.id) return []
  return storeItems.filter((item: any) => item?.serverId === selectedServer.value?.id && item?.characterId === selectedCharacter.value?.id)
}

const getLotSize = (observation: MarketObservation) => validLotSizes.includes(Number(observation.lotSize) as MarketLotSize) ? observation.lotSize : 100
const observationKey = (observation: MarketObservation) => `${observation.createdAt}|${observation.slot}|${getLotSize(observation)}|${observation.price}`

const mergeImportedItem = (incoming: TrackedMarketItem) => {
  const nameKey = incoming.name.trim().toLowerCase()
  const existing = data.value.market.trackedItems.find((item) =>
    item.serverId === incoming.serverId &&
    item.characterId === incoming.characterId &&
    (item.id === incoming.id || item.name.trim().toLowerCase() === nameKey)
  )

  if (!existing) {
    data.value.market.trackedItems.unshift(incoming)
    return { added: 1, updated: 0, observations: incoming.observations.length }
  }

  existing.name = existing.name || incoming.name
  if (!existing.lastCheckedAt && incoming.lastCheckedAt) existing.lastCheckedAt = incoming.lastCheckedAt
  if (existing.category === 'other' && incoming.category !== 'other') existing.category = incoming.category
  if (!validLotSizes.includes(Number(existing.preferredLotSize) as MarketLotSize)) existing.preferredLotSize = incoming.preferredLotSize
  if (!existing.buyBelow && incoming.buyBelow) existing.buyBelow = incoming.buyBelow
  if (!existing.sellAround && incoming.sellAround) existing.sellAround = incoming.sellAround

  const seen = new Set(existing.observations.map(observationKey))
  const newObservations = incoming.observations.filter((observation) => !seen.has(observationKey(observation)))
  existing.observations.push(...newObservations)
  existing.observations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return { added: 0, updated: 1, observations: newObservations.length }
}

const importPrices = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const raw = await readImportFile(file)
    const parsed = JSON.parse(raw)
    const importedItems = getImportItems(parsed)
      .map((item, index) => normalizeImportedItem(item, index))
      .filter(Boolean) as TrackedMarketItem[]

    if (!importedItems.length) {
      setTransferMessage('No Prices items found for this character.', true)
      return
    }

    appStore.createBackup('before-prices-import')
    const result = importedItems.reduce((totals, item) => {
      const next = mergeImportedItem(item)
      totals.added += next.added
      totals.updated += next.updated
      totals.observations += next.observations
      return totals
    }, { added: 0, updated: 0, observations: 0 })

    initDrafts()
    setTransferMessage(`Imported ${result.added} new, merged ${result.updated}, added ${result.observations} prices.`)
  } catch (error) {
    setTransferMessage('Import failed. Use a Prices JSON export.', true)
  } finally {
    input.value = ''
  }
}

const addTrackedItem = () => {
  const name = draftName.value.trim()
  if (!name || !selectedServer.value?.id || !selectedCharacter.value?.id) return

  const item: TrackedMarketItem = {
    id: crypto.randomUUID(),
    name,
    category: categoryFilter.value === 'all' ? 'rune' : categoryFilter.value,
    preferredLotSize: 100,
    buyBelow: 0,
    sellAround: 0,
    serverId: selectedServer.value.id,
    characterId: selectedCharacter.value.id,
    createdAt: new Date().toISOString(),
    lastCheckedAt: null,
    observations: [],
  }

  data.value.market.trackedItems.unshift(item)
  priceDrafts[item.id] = null
  lotDrafts[item.id] = 100
  dateDrafts[item.id] = todayInput()
  slotDrafts[item.id] = 'auto'
  markItemChanged(item.id)
  draftName.value = ''
}

const removeTrackedItem = (id: string) => {
  if (pendingRemoveItemId.value !== id) {
    pendingRemoveItemId.value = id
    return
  }
  data.value.market.trackedItems = data.value.market.trackedItems.filter((item) => item.id !== id)
  delete priceDrafts[id]
  delete lotDrafts[id]
  delete dateDrafts[id]
  delete slotDrafts[id]
  pendingRemoveItemId.value = null
  if (editingItemId.value === id) cancelItemEdit()
}

const startEditingItem = (item: TrackedMarketItem) => {
  editingItemId.value = item.id
  editName.value = item.name
}

const cancelItemEdit = () => {
  editingItemId.value = null
  editName.value = ''
}

const saveItemEdit = (id: string) => {
  const item = data.value.market.trackedItems.find((entry) => entry.id === id)
  const name = editName.value.trim()
  if (!item || !name) return
  if (item.name === name) {
    cancelItemEdit()
    return
  }
  item.name = name
  markItemChanged(id)
  cancelItemEdit()
}

const addObservation = (id: string) => {
  const price = Number(priceDrafts[id] || 0)
  if (price <= 0) return

  const item = data.value.market.trackedItems.find((entry) => entry.id === id)
  if (!item) return

  const slot = slotDrafts[id] === 'auto' || !slotDrafts[id] ? nowSlot() : slotDrafts[id] as MarketSlot
  const lotSize = lotDrafts[id] || item.preferredLotSize || 100
  item.preferredLotSize = lotSize
  item.observations.unshift({
    id: crypto.randomUUID(),
    price,
    lotSize,
    slot,
    createdAt: buildObservationDate(dateDrafts[id], slot),
  })
  item.lastCheckedAt = new Date().toISOString()
  item.observations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  priceDrafts[id] = null
  lotDrafts[id] = lotSize
  dateDrafts[id] = todayInput()
  slotDrafts[id] = 'auto'
  markItemChanged(id)
}

const removeObservation = (itemId: string, observationId: string) => {
  const item = data.value.market.trackedItems.find((entry) => entry.id === itemId)
  if (!item) return
  item.observations = item.observations.filter((observation) => observation.id !== observationId)
  markItemChanged(itemId)
}

const getLatestObservation = (item: TrackedMarketItem) => item.observations[0] ?? null

const startOfToday = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

const isToday = (value: string) => new Date(value).getTime() >= startOfToday()
const daysAgo = (days: number) => Date.now() - days * 24 * 60 * 60 * 1000

const rangeFrom = (observations: MarketObservation[]) => {
  if (!observations.length) return null
  const prices = observations.map((entry) => entry.price)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

const getTodayRange = (item: TrackedMarketItem) => rangeFrom(item.observations.filter((entry) => isToday(entry.createdAt)))
const getWeekRange = (item: TrackedMarketItem) => rangeFrom(item.observations.filter((entry) => new Date(entry.createdAt).getTime() >= daysAgo(7)))
const getAllTimeRange = (item: TrackedMarketItem) => rangeFrom(item.observations)

const getTimeline = (item: TrackedMarketItem) => item.observations.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

const chartPeriodDays = computed(() => ({
  day: 1,
  week: 7,
  month: 30,
}[chartPeriod.value]))

const getChartPoints = (item: TrackedMarketItem) => getTimeline(item)
  .filter((entry) => new Date(entry.createdAt).getTime() >= daysAgo(chartPeriodDays.value))
  .slice(-32)
  .map((entry) => ({
  id: entry.id,
  price: entry.price,
  createdAt: entry.createdAt,
  label: `${formatDateTime(entry.createdAt)} · x${getLotSize(entry)} · ${formatKamas(entry.price)}`,
  }))

const slotLabel = (slot: MarketSlot) => ({
  morning: 'Morning',
  midday: 'Midday',
  evening: 'Evening',
  night: 'Night',
}[slot])

const formatKamas = (value: number) => value > 0 ? Math.round(value).toLocaleString('fr-FR') : '-'
const formatRange = (range: { min: number; max: number } | null) => range ? `${formatKamas(range.min)} - ${formatKamas(range.max)}` : '-'
const formatDateTime = (value: string) => new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))

watch(storageKey, () => {
  migrateLegacyItems()
  initDrafts()
}, { immediate: true })

watch(pressureSettingsStorageKey, loadPressureSettings)

watch(trackedItems, initDrafts, { immediate: true })

watch(() => [
  pressureSlot.value,
  pressureLimit.value,
  pressureFilters.element,
  pressureFilters.mode,
  pressureFilters.classe,
  pressureFilters.level,
  pressureFilters.budget,
], () => {
  if (activeTab.value === 'pressure') refreshPressure()
})

watch(() => ({
  slot: pressureSlot.value,
  limit: pressureLimit.value,
  sort: pressureSort.value,
  element: pressureFilters.element,
  mode: pressureFilters.mode,
  classe: pressureFilters.classe,
  level: pressureFilters.level,
  budget: pressureFilters.budget,
  hideSpecial: pressureFilters.hideSpecial,
  onlyMonsterDrops: pressureFilters.onlyMonsterDrops,
  onlyNonCrafted: pressureFilters.onlyNonCrafted,
  minItemUsage: pressureFilters.minItemUsage,
}), savePressureSettings)

watch(pressureResources, (resources) => {
  const visibleIds = new Set(resources.map((resource) => resource.id))
  selectedPressureResourceIds.value = selectedPressureResourceIds.value.filter((id) => visibleIds.has(id))
})

onMounted(() => {
  appStore.init()
  initContext()
  loadPressureSettings()
  migrateLegacyItems()
  tagExistingItemsAsRuneOnce()
  initDrafts()
})

onUnmounted(() => {
  if (lastChangedTimeout) window.clearTimeout(lastChangedTimeout)
})
</script>

<style scoped>
.mp-page { display: flex; flex-direction: column; gap: .85rem; }
.mp-topbar, .mp-card, .mp-empty-page { border: 1px solid var(--v2-border-subtle); border-radius: 16px; background: rgba(0,0,0,.16); }
.mp-topbar { display: grid; grid-template-columns: minmax(160px, .6fr) auto minmax(260px, 1fr); gap: .85rem; align-items: center; padding: .85rem; }
.mp-title h1 { color: var(--v2-text); font-size: 1.2rem; font-weight: 900; line-height: 1.1; }
.mp-title span { display: block; margin-top: .25rem; color: var(--v2-text-secondary); font-size: .78rem; }
.mp-tabs { display: inline-flex; gap: .25rem; margin-top: .6rem; padding: .2rem; border: 1px solid var(--v2-border-subtle); border-radius: 999px; background: rgba(0,0,0,.18); }
.mp-tab { border: 0; border-radius: 999px; background: transparent; color: var(--v2-text-secondary); padding: .28rem .62rem; font-size: .68rem; font-weight: 900; cursor: pointer; }
.mp-tab--active { background: rgba(245,158,11,.16); color: var(--v2-text); box-shadow: 0 0 0 1px rgba(245,158,11,.24) inset; }
.mp-tools { display: flex; align-items: center; gap: .4rem; min-width: 0; }
.mp-tool-btn { min-height: 34px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--v2-border-subtle); border-radius: 10px; background: rgba(255,255,255,.035); color: var(--v2-text-secondary); padding: .42rem .65rem; font-size: .72rem; font-weight: 850; cursor: pointer; }
.mp-tool-btn:hover { color: var(--v2-text); border-color: rgba(245,158,11,.38); }
.mp-tool-btn:disabled { opacity: .45; cursor: not-allowed; }
.mp-tool-btn input { display: none; }
.mp-transfer-msg { color: #86efac; font-size: .72rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-transfer-msg--error { color: #fca5a5; }
.mp-add { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .5rem; }
.mp-filters { grid-column: 1 / -1; display: flex; align-items: center; justify-content: flex-end; gap: .5rem; }
.mp-filters :deep(.v2s) { min-width: 150px; }
.mp-input { width: 100%; border: 1px solid var(--v2-border-med); border-radius: 10px; background: rgba(0,0,0,.18); color: var(--v2-text); padding: .62rem .72rem; }
.mp-input:focus { outline: none; border-color: rgba(245,158,11,.58); box-shadow: 0 0 0 3px rgba(245,158,11,.1); }
.mp-btn, .mp-icon-btn { border: 1px solid rgba(245,158,11,.42); border-radius: 10px; background: rgba(245,158,11,.16); color: var(--v2-text); font-weight: 850; cursor: pointer; }
.mp-btn { min-height: 42px; padding: .62rem .9rem; }
.mp-btn:disabled, .mp-icon-btn:disabled { opacity: .45; cursor: not-allowed; }
.mp-list { display: grid; gap: .75rem; }
.mp-card { padding: .9rem; display: grid; gap: .75rem; }
.mp-card--last { border-color: rgba(245,158,11,.5); background: linear-gradient(135deg, rgba(245,158,11,.11), rgba(0,0,0,.16) 42%); box-shadow: 0 0 0 1px rgba(245,158,11,.08) inset; }
.mp-card__top { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; }
.mp-card__identity { min-width: 0; flex: 1; }
.mp-card__name-row { display: flex; align-items: center; gap: .5rem; min-width: 0; }
.mp-card__identity h2 { color: var(--v2-text); font-size: 1rem; font-weight: 900; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp-card__identity span { display: block; margin-top: .2rem; color: var(--v2-text-secondary); font-size: .76rem; }
.mp-card__identity .mp-last-badge { margin-top: 0; display: inline-flex; flex-shrink: 0; border: 1px solid rgba(245,158,11,.38); border-radius: 999px; background: rgba(245,158,11,.12); color: var(--v2-accent); padding: .16rem .45rem; font-size: .62rem; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; }
.mp-copy-btn { flex-shrink: 0; border: 1px solid var(--v2-border-subtle); border-radius: 999px; background: rgba(255,255,255,.035); color: var(--v2-text-secondary); padding: .16rem .46rem; font-size: .62rem; font-weight: 900; cursor: pointer; }
.mp-copy-btn:hover { color: var(--v2-text); border-color: rgba(245,158,11,.38); }
.mp-card__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .35rem; }
.mp-card__actions :deep(.v2s) { min-width: 120px; }
.mp-card__actions :deep(.v2s__trigger) { min-height: 32px; padding: .35rem .55rem; border-radius: 10px; background: rgba(0,0,0,.18); }
.mp-icon-btn { min-height: 32px; padding: .35rem .55rem; font-size: .72rem; }
.mp-icon-btn--danger { border-color: rgba(248,113,113,.34); background: rgba(248,113,113,.08); color: #fecaca; }
.mp-entry { display: grid; grid-template-columns: minmax(150px, 1fr) 110px 150px 150px auto; gap: .5rem; align-items: center; }
.mp-entry :deep(.v2s__trigger),
.mp-entry :deep(.v2d__trigger) { min-height: 42px; padding: .58rem .7rem; border-radius: 10px; background: rgba(0,0,0,.18); }
.mp-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .45rem; }
.mp-metrics div { border: 1px solid var(--v2-border-subtle); border-radius: 10px; padding: .55rem; background: rgba(255,255,255,.025); }
.mp-metrics span { display: block; color: var(--v2-text-secondary); font-size: .66rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
.mp-metrics strong { display: block; margin-top: .2rem; color: var(--v2-text); font-size: .78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp-graph { height: 82px; border: 1px solid var(--v2-border-subtle); border-radius: 12px; padding: .55rem; background: rgba(255,255,255,.018); overflow: hidden; }
.mp-history { display: grid; gap: .35rem; }
.mp-history__row { display: flex; align-items: center; justify-content: space-between; gap: .75rem; color: var(--v2-text-secondary); font-size: .78rem; }
.mp-history__row strong { color: var(--v2-text); }
.mp-history__value { display: inline-flex; align-items: center; gap: .5rem; white-space: nowrap; }
.mp-text-btn { border: 0; background: transparent; color: var(--v2-text-dim); cursor: pointer; font-size: .7rem; font-weight: 850; padding: 0; }
.mp-text-btn:hover { color: var(--v2-danger, #f87171); }
.mp-empty, .mp-empty-page { color: var(--v2-text-dim); font-size: .82rem; }
.mp-empty { padding: .7rem; border: 1px dashed var(--v2-border-subtle); border-radius: 12px; }
.mp-empty-page { padding: 1rem; text-align: center; }
.mp-empty-page--error { color: #fca5a5; border-color: rgba(248,113,113,.25); }
.mp-pressure { display: grid; gap: .75rem; }
.mp-pressure-head, .mp-pressure-card, .mp-pressure-summary, .mp-pressure-targets, .mp-pressure-filters { border: 1px solid var(--v2-border-subtle); border-radius: 16px; background: rgba(0,0,0,.16); }
.mp-pressure-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; padding: .9rem; }
.mp-pressure-head h2 { color: var(--v2-text); font-size: 1rem; font-weight: 900; }
.mp-pressure-head p { margin-top: .2rem; color: var(--v2-text-secondary); font-size: .78rem; }
.mp-pressure-actions { display: flex; align-items: center; justify-content: flex-end; gap: .45rem; flex-wrap: wrap; }
.mp-pressure-actions :deep(.v2s) { min-width: 130px; }
.mp-pressure-filters { display: flex; gap: .4rem; flex-wrap: wrap; padding: .65rem; }
.mp-pressure-filters :deep(.v2s) { min-width: 126px; }
.mp-filter-chip { border: 1px solid var(--v2-border-subtle); border-radius: 999px; background: rgba(255,255,255,.03); color: var(--v2-text-secondary); padding: .32rem .62rem; font-size: .68rem; font-weight: 900; cursor: pointer; }
.mp-filter-chip--on { border-color: rgba(245,158,11,.4); background: rgba(245,158,11,.12); color: var(--v2-text); }
.mp-pressure-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .45rem; padding: .65rem; }
.mp-pressure-summary div { border: 1px solid var(--v2-border-subtle); border-radius: 12px; padding: .58rem; background: rgba(255,255,255,.025); }
.mp-pressure-summary span { display: block; color: var(--v2-text-secondary); font-size: .66rem; font-weight: 850; text-transform: uppercase; letter-spacing: .06em; }
.mp-pressure-summary strong { display: block; margin-top: .18rem; color: var(--v2-text); font-size: .95rem; }
.mp-pressure-targets { display: flex; align-items: center; gap: .35rem; flex-wrap: wrap; padding: .65rem; }
.mp-pressure-targets > span { color: var(--v2-text-secondary); font-size: .7rem; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; }
.mp-pressure-target { border: 1px solid var(--v2-border-subtle); border-radius: 999px; background: rgba(255,255,255,.035); color: var(--v2-text-secondary); padding: .18rem .48rem; font-size: .66rem; font-weight: 850; }
.mp-pressure-list { display: grid; gap: .65rem; }
.mp-pressure-card { display: grid; grid-template-columns: auto minmax(220px, 1fr) minmax(280px, .85fr) auto; gap: .75rem; align-items: center; padding: .85rem; }
.mp-pressure-check { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: 1px solid var(--v2-border-subtle); border-radius: 10px; background: rgba(255,255,255,.03); cursor: pointer; }
.mp-pressure-check input { width: 14px; height: 14px; accent-color: rgb(245,158,11); cursor: pointer; }
.mp-pressure-card__main { min-width: 0; display: grid; gap: .45rem; }
.mp-pressure-card__name-row { display: flex; align-items: center; gap: .65rem; min-width: 0; }
.mp-pressure-card__img { width: 42px; height: 42px; border-radius: 10px; object-fit: cover; border: 1px solid var(--v2-border-subtle); background: rgba(255,255,255,.04); }
.mp-pressure-card h3 { color: var(--v2-text); font-size: .95rem; font-weight: 900; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp-pressure-card p { color: var(--v2-text-secondary); font-size: .72rem; }
.mp-pressure-reasons { display: flex; align-items: center; gap: .3rem; flex-wrap: wrap; }
.mp-pressure-reasons span { border: 1px solid var(--v2-border-subtle); border-radius: 999px; background: rgba(255,255,255,.025); color: var(--v2-text-secondary); padding: .16rem .42rem; font-size: .62rem; font-weight: 850; }
.mp-pressure-used { display: flex; align-items: center; gap: .35rem; flex-wrap: wrap; }
.mp-pressure-used > span { color: var(--v2-text-dim); font-size: .66rem; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; }
.mp-pressure-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .35rem; }
.mp-pressure-stats div { border: 1px solid var(--v2-border-subtle); border-radius: 10px; padding: .48rem; background: rgba(255,255,255,.025); min-width: 0; }
.mp-pressure-stats span { display: block; color: var(--v2-text-secondary); font-size: .62rem; font-weight: 850; text-transform: uppercase; letter-spacing: .06em; }
.mp-pressure-stats strong { display: block; margin-top: .15rem; color: var(--v2-text); font-size: .76rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp-pressure-card__actions { display: flex; align-items: center; justify-content: flex-end; gap: .4rem; flex-wrap: wrap; }
.mp-pressure-signal { border: 1px solid var(--v2-border-subtle); border-radius: 999px; background: rgba(255,255,255,.035); color: var(--v2-text-secondary); padding: .2rem .5rem; font-size: .66rem; font-weight: 900; white-space: nowrap; }
.mp-pressure-signal--new { border-color: rgba(96,165,250,.35); color: #bfdbfe; background: rgba(96,165,250,.1); }
.mp-pressure-signal--warn { border-color: rgba(245,158,11,.35); color: #fde68a; background: rgba(245,158,11,.11); }
.mp-pressure-signal--good { border-color: rgba(34,197,94,.35); color: #bbf7d0; background: rgba(34,197,94,.1); }
.mp-pressure-signal--hot { border-color: rgba(248,113,113,.35); color: #fecaca; background: rgba(248,113,113,.1); }
@media (max-width: 900px) {
  .mp-topbar, .mp-entry, .mp-metrics { grid-template-columns: 1fr; }
  .mp-tools, .mp-filters { flex-wrap: wrap; justify-content: flex-start; }
  .mp-pressure-head, .mp-pressure-card { grid-template-columns: 1fr; }
  .mp-pressure-head { flex-direction: column; }
  .mp-pressure-actions { justify-content: flex-start; }
  .mp-pressure-card__actions { justify-content: flex-start; }
}
@media (max-width: 560px) {
  .mp-card__top { flex-direction: column; }
  .mp-card__actions { justify-content: flex-start; }
  .mp-add { grid-template-columns: 1fr; }
  .mp-filters :deep(.v2s), .mp-card__actions :deep(.v2s) { width: 100%; }
  .mp-history__row { align-items: flex-start; flex-direction: column; gap: .25rem; }
  .mp-pressure-summary, .mp-pressure-stats { grid-template-columns: 1fr 1fr; }
  .mp-pressure-actions :deep(.v2s), .mp-pressure-filters :deep(.v2s) { width: 100%; }
}
</style>
