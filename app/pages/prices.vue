<template>
  <div v-if="hasContext" class="flex flex-col gap-5">
    <!-- ── Header ───────────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-center gap-3">
      <UiSegmented v-model="activeTab" :options="tabOptions" :aria-label="$t('prices.modeLabel')" @update:model-value="onTabChange" />

      <p class="text-sm text-subtle">
        {{ $t('prices.trackedCount', { count: trackedItems.length }) }}
        · {{ $t('prices.checkedToday', { count: todayLoggedCount }) }}
      </p>

      <div class="ml-auto flex items-center gap-2">
        <UiButton size="sm" :disabled="!trackedItems.length" @click="exportPrices">
          <template #icon><UiIcon name="download" /></template>
          {{ $t('prices.export') }}
        </UiButton>
        <label class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-line bg-raised px-2.5 text-xs text-ink transition-colors hover:border-line-strong">
          <UiIcon name="upload" />
          {{ $t('prices.import') }}
          <input type="file" accept=".json,application/json" class="hidden" @change="importPrices">
        </label>
      </div>
      <p v-if="transferMessage" :class="['w-full text-xs', transferError ? 'text-negative' : 'text-positive']">
        {{ transferMessage }}
      </p>
    </div>

    <!-- ── Tracked ──────────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'tracked'">
      <UiToolbar>
        <template #search>
          <UiInput
            v-model.trim="draftName"
            :placeholder="$t('prices.addPlaceholder')"
            @keyup.enter="addTrackedItem"
          >
            <template #prefix><UiIcon name="plus" /></template>
          </UiInput>
        </template>
        <template #filters>
          <UiButton variant="primary" size="sm" :disabled="!draftName" @click="addTrackedItem">
            {{ $t('prices.track') }}
          </UiButton>
          <UiSelect v-model="categoryFilter" :options="categoryFilterOptions" size="sm" class="w-40" :aria-label="$t('prices.category')" />
          <UiSelect v-model="chartPeriod" :options="chartPeriodOptions" size="sm" class="w-36" :aria-label="$t('prices.chartPeriod')" />
        </template>
      </UiToolbar>

      <UiEmptyState
        v-if="!trackedItems.length"
        :title="$t('prices.emptyTitle')"
        :description="$t('prices.emptyDesc')"
      >
        <template #icon><UiIcon name="prices" /></template>
      </UiEmptyState>

      <UiEmptyState v-else-if="!sortedItems.length" :title="$t('prices.emptyCategory')" />

      <div v-else class="flex flex-col gap-3">
        <UiCard
          v-for="item in sortedItems"
          :key="item.id"
          :variant="lastChangedItemId === item.id ? 'raised' : 'flat'"
        >
          <!-- Identity -->
          <div class="flex flex-wrap items-start gap-3">
            <div class="min-w-0 flex-1">
              <UiInput
                v-if="editingItemId === item.id"
                v-model.trim="editName"
                size="sm"
                :placeholder="$t('prices.itemName')"
                @keyup.enter="saveItemEdit(item.id)"
              />
              <template v-else>
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="truncate text-sm font-semibold text-ink">{{ item.name }}</h2>
                  <UiButton variant="ghost" size="sm" @click="copyItemName(item)">
                    {{ copiedItemId === item.id ? $t('v2.kamas.scanner.copied') : $t('prices.copy') }}
                  </UiButton>
                  <UiBadge v-if="lastChangedItemId === item.id" tone="accent">{{ $t('prices.lastUpdated') }}</UiBadge>
                </div>
                <p class="mt-0.5 text-xs text-subtle">
                  {{ $t('prices.observationCount', { count: item.observations.length }) }}
                  · {{ $t('prices.latest') }} <UiMoney :value="getLatestObservation(item)?.price ?? 0" short size="sm" />
                </p>
              </template>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <UiSelect
                :model-value="item.category"
                :options="categoryOptions"
                size="sm"
                class="w-32"
                :aria-label="$t('prices.category')"
                @update:model-value="setItemCategory(item.id, $event)"
              />
              <UiButton v-if="editingItemId !== item.id" variant="ghost" size="sm" @click="startEditingItem(item)">
                {{ $t('prices.edit') }}
              </UiButton>
              <UiButton v-else variant="primary" size="sm" :disabled="!editName" @click="saveItemEdit(item.id)">
                {{ $t('prices.save') }}
              </UiButton>
              <!-- Two-step delete: the first click arms, the second confirms. -->
              <UiButton variant="danger" size="sm" @click="removeTrackedItem(item.id)">
                {{ pendingRemoveItemId === item.id ? $t('prices.confirm') : $t('prices.remove') }}
              </UiButton>
            </div>
          </div>

          <!-- Entry -->
          <div class="mt-3 flex flex-wrap items-end gap-2">
            <UiField :label="$t('prices.hdvPrice')" class="w-36">
              <UiNumberInput
                v-model="priceDrafts[item.id]"
                :min="0"
                size="sm"
                :placeholder="$t('prices.hdvPrice')"
                @keyup.enter="addObservation(item.id)"
              />
            </UiField>
            <UiField :label="$t('prices.lot')" class="w-24">
              <UiSelect
                :model-value="lotDrafts[item.id] || 100"
                :options="lotOptions"
                size="sm"
                :aria-label="$t('prices.lot')"
                @update:model-value="setLotDraft(item.id, $event)"
              />
            </UiField>
            <UiField :label="$t('prices.date')" class="w-40">
              <UiDateInput v-model="dateDrafts[item.id]" size="sm" />
            </UiField>
            <UiField :label="$t('prices.time')" class="w-28">
              <UiSelect
                :model-value="slotDrafts[item.id] || 'auto'"
                :options="slotOptions"
                size="sm"
                :aria-label="$t('prices.time')"
                @update:model-value="setSlotDraft(item.id, $event)"
              />
            </UiField>
            <UiButton variant="primary" size="sm" :disabled="!priceDrafts[item.id]" @click="addObservation(item.id)">
              {{ $t('prices.save') }}
            </UiButton>
          </div>

          <!-- Metrics + chart -->
          <div class="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <dl class="grid grid-cols-2 gap-x-4 gap-y-1.5 self-start">
              <div v-for="metric in itemMetrics(item)" :key="metric.label" class="flex items-baseline justify-between gap-2">
                <dt class="text-xs text-subtle">{{ metric.label }}</dt>
                <dd class="tabular text-sm text-ink">{{ metric.value }}</dd>
              </div>
            </dl>

            <div v-if="getChartPoints(item).length >= 2" class="h-20">
              <UiSparkline :points="getChartPoints(item)" :label="$t('prices.chartLabel', { name: item.name })" />
            </div>
          </div>

          <!-- History -->
          <div v-if="item.observations.length" class="mt-3 border-t border-line pt-2">
            <div
              v-for="observation in item.observations.slice(0, 8)"
              :key="observation.id"
              class="group flex items-center gap-3 py-1 text-xs"
            >
              <span class="min-w-0 flex-1 truncate text-subtle">
                {{ formatDateTime(observation.createdAt) }} · {{ slotLabel(observation.slot) }} · ×{{ getLotSize(observation) }}
              </span>
              <UiMoney :value="observation.price" short size="sm" />
              <UiButton
                variant="ghost"
                size="sm"
                icon
                class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                :aria-label="$t('prices.deletePrice')"
                @click="removeObservation(item.id, observation.id)"
              >
                <UiIcon name="close" />
              </UiButton>
            </div>
          </div>
          <p v-else class="mt-3 text-xs text-subtle">{{ $t('prices.noPrices') }}</p>
        </UiCard>
      </div>
    </template>

    <!-- ── Pressure ─────────────────────────────────────────────────────── -->
    <template v-else>
      <UiPageSection :title="$t('prices.pressure.title')" :description="$t('prices.pressure.desc')">
        <template #actions>
          <UiButton size="sm" :disabled="pressureState.isLoading" :loading="pressureState.isLoading" @click="refreshPressure">
            {{ $t('prices.pressure.refresh') }}
          </UiButton>
          <UiButton size="sm" :disabled="!untrackedPressureResources.length" @click="trackTopPressureResources">
            {{ $t('prices.pressure.trackTop') }}
          </UiButton>
          <UiButton size="sm" :disabled="!untrackedSelectedPressureResources.length" @click="trackSelectedPressureResources">
            {{ $t('prices.pressure.trackSelected') }}
          </UiButton>
        </template>

        <UiToolbar>
          <template #filters>
            <UiSelect v-model="pressureSlot" :options="pressureSlotOptions" size="sm" class="w-36" :aria-label="$t('prices.pressure.slot')" />
            <UiSelect v-model="pressureLimit" :options="pressureLimitOptions" size="sm" class="w-32" :aria-label="$t('prices.pressure.topItems')" />
            <UiSelect v-model="pressureSort" :options="pressureSortOptions" size="sm" class="w-36" :aria-label="$t('prices.pressure.sort')" />
          </template>
          <template #extra>
            <UiSelect v-model="pressureFilters.element" :options="pressureElementOptions" size="sm" class="w-32" :aria-label="$t('prices.pressure.element')" />
            <UiSelect v-model="pressureFilters.mode" :options="pressureModeOptions" size="sm" class="w-32" :aria-label="$t('prices.pressure.mode')" />
            <UiSelect v-model="pressureFilters.classe" :options="pressureClassOptions" size="sm" class="w-32" :aria-label="$t('prices.pressure.class')" />
            <UiSelect v-model="pressureFilters.level" :options="pressureLevelOptions" size="sm" class="w-28" :aria-label="$t('prices.pressure.level')" />
            <UiSelect v-model="pressureFilters.budget" :options="pressureBudgetOptions" size="sm" class="w-32" :aria-label="$t('prices.pressure.budget')" />

            <UiButton
              v-for="toggle in pressureToggles"
              :key="toggle.key"
              :variant="toggle.on ? 'primary' : 'ghost'"
              size="sm"
              @click="toggle.action()"
            >
              {{ toggle.label }}
            </UiButton>
          </template>
        </UiToolbar>

        <UiEmptyState v-if="pressureState.error" :title="pressureState.error">
          <template #icon><UiIcon name="alert" /></template>
        </UiEmptyState>

        <div v-else-if="pressureState.isLoading" class="flex flex-col gap-2">
          <UiSkeleton v-for="i in 5" :key="i" height="6rem" />
        </div>

        <UiEmptyState
          v-else-if="!pressureResources.length"
          :title="$t('prices.pressure.emptyTitle')"
          :description="$t('prices.pressure.emptyDesc')"
        >
          <template #icon><UiIcon name="crafting" /></template>
        </UiEmptyState>

        <template v-else>
          <UiStatRow min="8rem">
            <UiStat :label="$t('prices.pressure.craftTargets')" :value="pressureState.selectedItems.length" />
            <UiStat :label="$t('prices.pressure.resources')" :value="pressureResources.length" />
            <UiStat :label="$t('prices.pressure.untracked')" :value="untrackedPressureResources.length" />
            <UiStat :label="$t('prices.pressure.selected')" :value="untrackedSelectedPressureResources.length" />
          </UiStatRow>

          <div class="mt-4 flex flex-col gap-2">
            <article
              v-for="resource in pressureResources"
              :key="resource.id"
              class="flex flex-wrap items-start gap-3 rounded-lg border border-line bg-surface p-3"
            >
              <input
                type="checkbox"
                class="mt-1 size-4 shrink-0 accent-[var(--c-accent)]"
                :checked="isPressureResourceSelected(resource.id)"
                :aria-label="resource.name"
                @change="togglePressureResourceSelection(resource.id)"
              >

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <img v-if="resource.image" :src="resource.image" :alt="''" loading="lazy" class="size-8 shrink-0 rounded-md bg-sunken object-contain">
                  <div class="min-w-0">
                    <h3 class="truncate text-sm font-medium text-ink">{{ resource.name }}</h3>
                    <p class="truncate text-xs text-subtle">
                      {{ resource.typeName || $t('prices.pressure.resource') }}
                      <span v-if="resource.level !== null" class="tabular"> · {{ $t('monsters.level', { level: resource.level }) }}</span>
                    </p>
                  </div>
                </div>

                <div class="mt-1.5 flex flex-wrap gap-1">
                  <UiBadge v-for="reason in getPressureReasons(resource)" :key="reason">{{ reason }}</UiBadge>
                </div>

                <p class="mt-1.5 truncate text-xs text-subtle">
                  {{ $t('prices.pressure.usedIn') }}:
                  {{ resource.items.slice(0, 4).map((i) => i.name).join(' · ') }}
                </p>
              </div>

              <dl class="flex shrink-0 gap-4 text-xs">
                <div v-for="stat in pressureStats(resource)" :key="stat.label" class="text-right">
                  <dt class="text-subtle">{{ stat.label }}</dt>
                  <dd class="tabular text-ink">{{ stat.value }}</dd>
                </div>
              </dl>

              <div class="flex shrink-0 items-center gap-2">
                <UiBadge :tone="getPressureSignal(resource).tone === 'good' ? 'positive' : getPressureSignal(resource).tone === 'bad' ? 'negative' : 'neutral'">
                  {{ getPressureSignal(resource).label }}
                </UiBadge>
                <UiButton variant="ghost" size="sm" @click="copyPressureName(resource)">
                  {{ copiedPressureId === resource.id ? $t('v2.kamas.scanner.copied') : $t('prices.copy') }}
                </UiButton>
                <UiButton size="sm" @click="trackPressureResource(resource)">
                  {{ getPressureTrackedItem(resource) ? $t('prices.pressure.openTracked') : $t('prices.track') }}
                </UiButton>
              </div>
            </article>
          </div>
        </template>
      </UiPageSection>
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

// ── View-model helpers ────────────────────────────────────────────────────
const { t } = useI18n()

const tabOptions = computed(() => [
  { label: t('prices.tabs.tracked'), value: 'tracked' },
  { label: t('prices.tabs.pressure'), value: 'pressure' },
])

// Switching to Pressure kicks off its first scan; the segmented control
// can't call openPressureTab directly because it also sets the value.
const onTabChange = (value: string | number | null) => {
  if (value === 'pressure') openPressureTab()
}

const itemMetrics = (item: TrackedMarketItem) => [
  { label: t('prices.latest'), value: formatKamas(getLatestObservation(item)?.price ?? 0) },
  { label: t('prices.today'), value: formatRange(getTodayRange(item)) },
  { label: t('prices.week'), value: formatRange(getWeekRange(item)) },
  { label: t('prices.allTime'), value: formatRange(getAllTimeRange(item)) },
]

const pressureStats = (resource: PressureResource) => [
  { label: t('prices.pressure.score'), value: resource.pressureScore },
  { label: t('prices.pressure.builds'), value: resource.buildUsageCount },
  { label: t('prices.pressure.qty'), value: resource.totalQuantity },
  { label: t('prices.latest'), value: formatKamas(getPressureTrackedItem(resource)?.observations[0]?.price ?? 0) },
]

const pressureToggles = computed(() => [
  {
    key: 'hideSpecial',
    label: t('prices.pressure.hideSpecial'),
    on: pressureFilters.hideSpecial,
    action: () => { pressureFilters.hideSpecial = !pressureFilters.hideSpecial },
  },
  {
    key: 'monsterDrops',
    label: t('prices.pressure.monsterDrops'),
    on: pressureFilters.onlyMonsterDrops,
    action: () => { pressureFilters.onlyMonsterDrops = !pressureFilters.onlyMonsterDrops },
  },
  {
    key: 'nonCrafted',
    label: t('prices.pressure.nonCrafted'),
    on: pressureFilters.onlyNonCrafted,
    action: () => { pressureFilters.onlyNonCrafted = !pressureFilters.onlyNonCrafted },
  },
  {
    key: 'usedBy2',
    label: t('prices.pressure.usedByTwo'),
    on: pressureFilters.minItemUsage === 2,
    action: () => { pressureFilters.minItemUsage = pressureFilters.minItemUsage === 2 ? 1 : 2 },
  },
])

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
