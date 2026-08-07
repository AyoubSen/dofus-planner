<template>
  <div v-if="hasContext" class="flex flex-col gap-6">
    <UiStatRow>
      <UiStat :label="$t('v2.kamas.stats.total')" :value="opportunities.length" />
      <UiStat :label="$t('v2.kamas.stats.expectedProfit')">
        <UiMoney :value="totalExpectedProfit" signed short size="lg" />
      </UiStat>
      <UiStat :label="$t('v2.kamas.stats.missingData')" :value="missingDataItems.length" />
      <UiStat :label="$t('v2.kamas.stats.stale')" :value="staleItems.length" />
    </UiStatRow>

    <!-- ── Do today ─────────────────────────────────────────────────────── -->
    <UiPageSection :title="$t('v2.kamas.sections.doToday')" :description="$t('v2.kamas.sections.doTodayDesc')">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div class="flex min-w-0 flex-col gap-2">
          <NuxtLink
            v-for="opportunity in topActions"
            :key="opportunity.id"
            :to="localePath(opportunity.path)"
            class="flex items-start gap-4 rounded-lg border border-line bg-surface p-3 transition-colors hover:border-line-strong"
          >
            <div class="min-w-0 flex-1">
              <UiBadge>{{ $t('v2.kamas.types.' + opportunity.type) }}</UiBadge>
              <h3 class="mt-1.5 text-sm font-medium text-ink">{{ opportunity.title }}</h3>
              <p class="mt-0.5 text-sm text-muted">{{ opportunity.suggestedAction }}</p>
            </div>
            <div class="flex shrink-0 flex-col items-end">
              <UiMoney :value="opportunity.estimatedProfit" signed short />
              <span class="tabular text-xs text-subtle">
                {{ opportunity.marginPercent === null ? '—' : opportunity.marginPercent + '%' }}
              </span>
            </div>
          </NuxtLink>
          <UiEmptyState v-if="!topActions.length" :title="$t('v2.kamas.empty.noActions')" />
        </div>

        <UiCard :title="$t('v2.kamas.sections.performance')" :subtitle="$t('v2.kamas.sections.performanceDesc')">
          <div class="flex flex-col gap-2.5">
            <div v-for="source in sourceSummary" :key="source.type" class="flex items-baseline justify-between gap-3">
              <span class="min-w-0 truncate text-sm text-muted">
                {{ $t('v2.kamas.types.' + source.type) }}
                <span class="tabular text-subtle">· {{ source.count }}</span>
              </span>
              <UiMoney :value="source.profit" signed short />
            </div>
            <p v-if="!sourceSummary.length" class="text-sm text-subtle">{{ $t('v2.kamas.empty.noActions') }}</p>
          </div>
        </UiCard>
      </div>
    </UiPageSection>

    <!-- ── All opportunities ────────────────────────────────────────────── -->
    <UiPageSection :title="$t('v2.kamas.sections.best')" :description="$t('v2.kamas.sections.bestDesc')">
      <UiToolbar>
        <template #search>
          <UiInput v-model="search" type="search" :placeholder="$t('v2.kamas.filters.search')">
            <template #prefix><UiIcon name="search" /></template>
          </UiInput>
        </template>
        <template #filters>
          <UiSelect v-model="typeFilter" :options="typeFilterOptions" size="sm" class="w-40" :aria-label="$t('v2.kamas.filters.allTypes')" />
          <UiSelect v-model="confidenceFilter" :options="confidenceFilterOptions" size="sm" class="w-40" :aria-label="$t('v2.kamas.filters.allConfidence')" />
          <UiSelect v-model="sortBy" :options="sortOptions" size="sm" class="w-40" :aria-label="$t('v2.kamas.sort.score')" />
        </template>
      </UiToolbar>

      <UiTable :columns="tableColumns" :empty="!filteredOpportunities.length" :empty-text="$t('v2.kamas.empty.noMatches')">
        <tr
          v-for="opportunity in filteredOpportunities"
          :key="opportunity.id"
          class="cursor-pointer border-t border-line transition-colors hover:bg-sunken"
          @click="navigateTo(localePath(opportunity.path))"
        >
          <td class="px-3 py-2.5">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <UiBadge>{{ $t('v2.kamas.types.' + opportunity.type) }}</UiBadge>
                <span class="min-w-0 truncate text-sm font-medium text-ink">{{ opportunity.title }}</span>
              </div>
              <span class="text-xs text-subtle">{{ opportunity.reason }}</span>
            </div>
          </td>
          <td class="px-3 py-2.5 text-right"><UiMoney :value="opportunity.estimatedCost" short /></td>
          <td class="px-3 py-2.5 text-right"><UiMoney :value="opportunity.estimatedRevenue" short /></td>
          <td class="px-3 py-2.5 text-right"><UiMoney :value="opportunity.estimatedProfit" signed short /></td>
          <td class="px-3 py-2.5 text-right text-xs text-muted">
            {{ $t('v2.kamas.confidence.' + opportunity.confidence) }}
          </td>
        </tr>
      </UiTable>
    </UiPageSection>

    <!-- ── Follow-ups ───────────────────────────────────────────────────── -->
    <div class="grid gap-4 md:grid-cols-2">
      <UiCard :title="$t('v2.kamas.sections.missing')" :subtitle="$t('v2.kamas.sections.missingDesc')">
        <div class="flex flex-col gap-1.5">
          <NuxtLink
            v-for="item in missingDataItems.slice(0, 8)"
            :key="item.id"
            :to="localePath(item.path)"
            class="flex flex-col gap-0.5 rounded-md px-2 py-1.5 transition-colors hover:bg-sunken"
          >
            <span class="truncate text-sm text-ink">{{ item.itemName }}</span>
            <span class="text-xs text-subtle">{{ item.missingData.join(', ') }}</span>
          </NuxtLink>
          <p v-if="!missingDataItems.length" class="text-sm text-subtle">{{ $t('v2.kamas.empty.noMissingData') }}</p>
        </div>
      </UiCard>

      <UiCard :title="$t('v2.kamas.sections.lessons')" :subtitle="$t('v2.kamas.sections.lessonsDesc')">
        <div class="flex flex-col gap-1.5">
          <NuxtLink
            v-for="item in lessons.slice(0, 8)"
            :key="item.id"
            :to="localePath(item.path)"
            class="flex flex-col gap-0.5 rounded-md px-2 py-1.5 transition-colors hover:bg-sunken"
          >
            <span class="truncate text-sm text-ink">{{ item.itemName }}</span>
            <span class="text-xs text-subtle">{{ item.reason }}</span>
          </NuxtLink>
          <p v-if="!lessons.length" class="text-sm text-subtle">{{ $t('v2.kamas.empty.noLessons') }}</p>
        </div>
      </UiCard>
    </div>

    <!-- ── Advanced ─────────────────────────────────────────────────────── -->
    <details class="rounded-lg border border-line bg-surface">
      <summary class="flex cursor-pointer items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-semibold text-ink">{{ $t('v2.kamas.scanner.title') }}</h2>
          <p class="mt-0.5 text-xs text-subtle">{{ $t('v2.kamas.scanner.desc') }}</p>
        </div>
        <UiBadge>{{ $t('v2.common.advanced') }}</UiBadge>
      </summary>

      <div class="grid gap-4 border-t border-line p-4 lg:grid-cols-2">
        <div class="min-w-0">
          <p class="text-xs font-medium tracking-wide text-subtle uppercase">
            {{ scanQueue.length ? $t('v2.kamas.scanner.position', { current: scanQueueIndex + 1, total: scanQueue.length }) : $t('v2.kamas.scanner.noQueue') }}
          </p>
          <p class="mt-1 text-lg font-semibold break-words text-ink">
            {{ currentScanItem || $t('v2.kamas.scanner.emptyCurrent') }}
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <UiButton size="sm" @click="buildScanQueue">{{ $t('v2.kamas.scanner.buildQueue') }}</UiButton>
            <UiButton size="sm" :disabled="!currentScanItem" @click="copyCurrentScanItem">
              {{ scanCopyStatus || $t('v2.kamas.scanner.copy') }}
            </UiButton>
            <UiButton size="sm" :disabled="!currentScanItem" @click="setActiveScanItem">{{ $t('v2.kamas.scanner.arm') }}</UiButton>
            <UiButton variant="ghost" size="sm" :disabled="!currentScanItem" @click="skipScanItem">{{ $t('v2.kamas.scanner.skip') }}</UiButton>
            <UiButton variant="ghost" size="sm" :disabled="!scanQueue.length" @click="clearScanQueue">{{ $t('v2.kamas.scanner.clear') }}</UiButton>
          </div>
        </div>

        <div class="min-w-0">
          <div class="mb-2 flex items-center justify-between gap-3">
            <span class="text-xs font-medium tracking-wide text-subtle uppercase">{{ $t('v2.kamas.scanner.inbox') }}</span>
            <UiButton variant="ghost" size="sm" @click="pollScanResults">{{ $t('v2.kamas.scanner.refresh') }}</UiButton>
          </div>
          <div v-if="scanResults.length" class="flex flex-col gap-2">
            <div
              v-for="result in scanResults.slice(0, 5)"
              :key="result.id"
              class="flex items-center gap-3 rounded-md border border-line p-2.5"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm text-ink">{{ result.itemName }}</p>
                <p class="flex items-center gap-1 text-xs text-subtle">
                  <UiMoney :value="result.price" short size="sm" /> · {{ result.confidence }}
                </p>
              </div>
              <div class="flex shrink-0 gap-1.5">
                <UiButton size="sm" @click="acceptScanResult(result)">{{ $t('v2.kamas.scanner.accept') }}</UiButton>
                <UiButton variant="ghost" size="sm" @click="dismissScanResult(result.id)">{{ $t('v2.kamas.scanner.dismiss') }}</UiButton>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-subtle">{{ $t('v2.kamas.scanner.emptyInbox') }}</p>
        </div>
      </div>
    </details>

    <details class="rounded-lg border border-line bg-surface">
      <summary class="flex cursor-pointer items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-semibold text-ink">{{ $t('v2.kamas.sections.audit') }}</h2>
          <p class="mt-0.5 text-xs text-subtle">{{ $t('v2.kamas.sections.auditDesc') }}</p>
        </div>
        <UiBadge>{{ $t('v2.common.advanced') }}</UiBadge>
      </summary>
      <div class="grid gap-3 border-t border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="item in auditItems" :key="item.key" class="rounded-md border border-line p-3">
          <p class="text-sm font-medium text-ink">{{ item.label }}</p>
          <p class="mt-1 text-xs break-words text-accent">{{ item.storage }}</p>
          <p class="mt-1.5 text-xs text-subtle">{{ item.backupNote }}</p>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import type { KamaOpportunity, KamaOpportunityConfidence, KamaOpportunityType } from '~/utils/kamasOpportunities'

const localePath = useLocalePath()
const { t } = useI18n()
const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()
const { data, init: initStore } = useAppDataStore()

const search = ref('')
const typeFilter = ref<KamaOpportunityType | 'all'>('all')
const confidenceFilter = ref<KamaOpportunityConfidence | 'all'>('all')
const sortBy = ref<'score' | 'profit' | 'margin' | 'updated'>('score')
const craftingSessions = shallowRef<any[]>([])
const brisageSessions = shallowRef<any[]>([])
const familiarPrices = shallowRef<Record<string, number>>({})
const resourcePrices = shallowRef<Record<string, number>>({})
const scanQueue = ref<string[]>([])
const scanQueueIndex = ref(0)
const scanCopyStatus = ref('')
const scanResults = ref<Array<{
  id: string
  itemName: string
  price: number
  candidates: number[]
  confidence: 'low' | 'medium' | 'high'
  source: string
  createdAt: string
}>>([])
let scanPollTimer: ReturnType<typeof setInterval> | null = null

const typeOptions: KamaOpportunityType[] = ['resale', 'craft', 'brisage', 'familiar', 'maintenance', 'missing-data']
const typeFilterOptions = computed(() => [
  { key: 'all', label: t('v2.kamas.filters.allTypes'), value: 'all' },
  ...typeOptions.map(type => ({ key: type, label: t(`v2.kamas.types.${type}`), value: type })),
])
const confidenceFilterOptions = computed(() => [
  { key: 'all', label: t('v2.kamas.filters.allConfidence'), value: 'all' },
  { key: 'high', label: t('v2.kamas.confidence.high'), value: 'high' },
  { key: 'medium', label: t('v2.kamas.confidence.medium'), value: 'medium' },
  { key: 'low', label: t('v2.kamas.confidence.low'), value: 'low' },
])
const sortOptions = computed(() => [
  { key: 'score', label: t('v2.kamas.sort.score'), value: 'score' },
  { key: 'profit', label: t('v2.kamas.sort.profit'), value: 'profit' },
  { key: 'margin', label: t('v2.kamas.sort.margin'), value: 'margin' },
  { key: 'updated', label: t('v2.kamas.sort.updated'), value: 'updated' },
])

const tableColumns = computed(() => [
  { key: 'action', label: t('v2.kamas.table.action') },
  { key: 'cost', label: t('v2.kamas.table.cost'), align: 'right' as const, width: '8rem' },
  { key: 'revenue', label: t('v2.kamas.table.revenue'), align: 'right' as const, width: '8rem' },
  { key: 'profit', label: t('v2.kamas.table.profit'), align: 'right' as const, width: '8rem' },
  { key: 'confidence', label: t('v2.kamas.table.confidence'), align: 'right' as const, width: '7rem' },
])

const SCAN_QUEUE_KEY = 'kamas_hdv_scan_queue_v1'
const SCAN_QUEUE_INDEX_KEY = 'kamas_hdv_scan_queue_index_v1'
const FAMILIAR_PRICES_KEY = 'familiers_manual_prices_v1'
const RESOURCE_PRICES_KEY = 'dofus-items-resource-prices-v1'

const readJson = <T,>(key: string, fallback: T): T => {
  if (!import.meta.client) return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const loadExternalData = () => {
  if (!import.meta.client || !selectedServer.value || !selectedCharacter.value) return
  const serverId = selectedServer.value.id
  const characterId = selectedCharacter.value.id
  craftingSessions.value = readJson<any[]>(`craft_fm_sessions_${serverId}_${characterId}`, [])
  brisageSessions.value = readJson<any[]>(`brisage_sessions_${serverId}_${characterId}`, [])
  familiarPrices.value = readJson<Record<string, number>>(FAMILIAR_PRICES_KEY, {})
  resourcePrices.value = readJson<Record<string, number>>(RESOURCE_PRICES_KEY, {})
  scanQueue.value = readJson<string[]>(SCAN_QUEUE_KEY, [])
  scanQueueIndex.value = Number(localStorage.getItem(SCAN_QUEUE_INDEX_KEY) || 0) || 0
}

const opportunities = computed(() =>
  buildKamaOpportunities({
    store: data.value,
    serverId: selectedServer.value?.id ?? null,
    characterId: selectedCharacter.value?.id ?? null,
    craftingSessions: craftingSessions.value,
    brisageSessions: brisageSessions.value,
    familiarPrices: familiarPrices.value,
    resourcePrices: resourcePrices.value,
  }),
)

const scoreOpportunity = (opportunity: KamaOpportunity): number => {
  const confidence = opportunity.confidence === 'high' ? 3 : opportunity.confidence === 'medium' ? 2 : 1
  return (opportunity.estimatedProfit ?? 0) + (opportunity.marginPercent ?? 0) * 1000 + confidence * 500
}

const filteredOpportunities = computed(() => {
  const needle = search.value.trim().toLowerCase()
  const filtered = opportunities.value.filter((opportunity) => {
    if (typeFilter.value !== 'all' && opportunity.type !== typeFilter.value) return false
    if (confidenceFilter.value !== 'all' && opportunity.confidence !== confidenceFilter.value) return false
    if (!needle) return true
    return [
      opportunity.title,
      opportunity.itemName,
      opportunity.sourceTool,
      opportunity.reason,
      opportunity.suggestedAction,
    ].join(' ').toLowerCase().includes(needle)
  })

  return [...filtered].sort((a, b) => {
    if (sortBy.value === 'profit') return (b.estimatedProfit ?? -Infinity) - (a.estimatedProfit ?? -Infinity)
    if (sortBy.value === 'margin') return (b.marginPercent ?? -Infinity) - (a.marginPercent ?? -Infinity)
    if (sortBy.value === 'updated') return new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime()
    return scoreOpportunity(b) - scoreOpportunity(a)
  })
})

const topActions = computed(() =>
  opportunities.value.filter(item => item.type !== 'missing-data').slice(0, 6),
)

const missingDataItems = computed(() =>
  opportunities.value.filter(item => item.type === 'missing-data' || item.missingData.length > 0),
)

const staleItems = computed(() =>
  opportunities.value.filter(item => item.type === 'maintenance'),
)

const lessons = computed(() =>
  opportunities.value.filter(item => (item.estimatedProfit ?? 0) < 0 || item.risk === 'high'),
)

const totalExpectedProfit = computed(() =>
  opportunities.value
    .filter(item => item.type !== 'missing-data')
    .reduce((sum, item) => sum + (item.estimatedProfit ?? 0), 0),
)

const sourceSummary = computed(() => {
  const map = new Map<KamaOpportunityType, { type: KamaOpportunityType, count: number, profit: number }>()
  for (const item of opportunities.value) {
    if (item.type === 'missing-data') continue
    const current = map.get(item.type) ?? { type: item.type, count: 0, profit: 0 }
    current.count += 1
    current.profit += item.estimatedProfit ?? 0
    map.set(item.type, current)
  }
  return Array.from(map.values()).sort((a, b) => b.profit - a.profit)
})

const auditItems = computed(() =>
  buildKamasDataAudit(selectedServer.value?.id ?? null, selectedCharacter.value?.id ?? null),
)

const currentScanItem = computed(() => scanQueue.value[scanQueueIndex.value] || '')

const persistScanQueue = () => {
  if (!import.meta.client) return
  localStorage.setItem(SCAN_QUEUE_KEY, JSON.stringify(scanQueue.value))
  localStorage.setItem(SCAN_QUEUE_INDEX_KEY, String(scanQueueIndex.value))
}

const buildScanQueue = () => {
  const names = opportunities.value
    .filter(item => item.type === 'missing-data' || item.missingData.length || item.type === 'familiar')
    .map(item => item.itemName)
    .filter(Boolean)

  scanQueue.value = Array.from(new Set(names)).slice(0, 30)
  scanQueueIndex.value = 0
  persistScanQueue()
  setActiveScanItem()
}

const clearScanQueue = () => {
  scanQueue.value = []
  scanQueueIndex.value = 0
  persistScanQueue()
}

const skipScanItem = () => {
  scanQueueIndex.value = Math.min(scanQueueIndex.value + 1, scanQueue.value.length)
  persistScanQueue()
  setActiveScanItem()
}

const copyCurrentScanItem = async () => {
  if (!import.meta.client || !currentScanItem.value || !navigator.clipboard?.writeText) return
  await navigator.clipboard.writeText(currentScanItem.value)
  scanCopyStatus.value = t('v2.kamas.scanner.copied')
  window.setTimeout(() => { scanCopyStatus.value = '' }, 900)
}

const setActiveScanItem = async () => {
  if (!currentScanItem.value) return
  await $fetch('/api/hdv-scan/active', {
    method: 'POST',
    body: { itemName: currentScanItem.value, source: 'kamas-page' },
  })
}

const pollScanResults = async () => {
  try {
    const response = await $fetch<{ results: typeof scanResults.value }>('/api/hdv-scan/results')
    scanResults.value = response.results || []
  } catch {
    scanResults.value = []
  }
}

const normalizeName = (value: string) =>
  value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

const writePriceMaps = () => {
  if (!import.meta.client) return
  localStorage.setItem(FAMILIAR_PRICES_KEY, JSON.stringify(familiarPrices.value))
  localStorage.setItem(RESOURCE_PRICES_KEY, JSON.stringify(resourcePrices.value))
}

const acceptScanResult = async (result: typeof scanResults.value[number]) => {
  const normalized = normalizeName(result.itemName)
  const familiarKey = Object.keys(familiarPrices.value).find(key => normalizeName(key) === normalized)
  const resourceKey = Object.keys(resourcePrices.value).find(key => normalizeName(key) === normalized)

  if (familiarKey) {
    familiarPrices.value = { ...familiarPrices.value, [familiarKey]: result.price }
  } else if (resourceKey) {
    resourcePrices.value = { ...resourcePrices.value, [resourceKey]: result.price }
  } else {
    resourcePrices.value = { ...resourcePrices.value, [result.itemName]: result.price }
  }

  writePriceMaps()
  await dismissScanResult(result.id)
  if (normalizeName(currentScanItem.value) === normalized) skipScanItem()
}

const dismissScanResult = async (id: string) => {
  await $fetch(`/api/hdv-scan/results/${encodeURIComponent(id)}`, { method: 'DELETE' })
  await pollScanResults()
}

onMounted(() => {
  initContext()
  initStore()
  loadExternalData()
  pollScanResults()
  scanPollTimer = window.setInterval(pollScanResults, 2500)
})

watch([selectedServer, selectedCharacter], loadExternalData)

onBeforeUnmount(() => {
  if (scanPollTimer) window.clearInterval(scanPollTimer)
})
</script>
