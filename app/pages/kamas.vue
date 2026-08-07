<template>
  <div class="ka-page">
    <div v-if="!hasContext" class="v2-no-context">
      <div class="v2-no-context__icon">
        <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-2.8 0-5 1.3-5 3s2.2 3 5 3 5-1.3 5-3-2.2-3-5-3Zm0 0V4m0 10v6m-4-3h8" />
        </svg>
      </div>
      <div class="v2-no-context__title">{{ $t('v2.common.noCharacterTitle') }}</div>
      <div class="v2-no-context__desc">{{ $t('v2.kamas.noCharacterDesc') }}</div>
    </div>

    <template v-else>
      <section class="ka-stats">
        <div class="ka-stat">
          <div class="ka-stat__label">{{ $t('v2.kamas.stats.total') }}</div>
          <div class="ka-stat__value">{{ opportunities.length }}</div>
        </div>
        <div class="ka-stat">
          <div class="ka-stat__label">{{ $t('v2.kamas.stats.expectedProfit') }}</div>
          <div class="ka-stat__value" :class="totalExpectedProfit >= 0 ? 'ka-positive' : 'ka-negative'">
            {{ totalExpectedProfit >= 0 ? '+' : '' }}{{ formatKamasCompact(totalExpectedProfit) }}
          </div>
        </div>
        <div class="ka-stat">
          <div class="ka-stat__label">{{ $t('v2.kamas.stats.missingData') }}</div>
          <div class="ka-stat__value">{{ missingDataItems.length }}</div>
        </div>
        <div class="ka-stat">
          <div class="ka-stat__label">{{ $t('v2.kamas.stats.stale') }}</div>
          <div class="ka-stat__value">{{ staleItems.length }}</div>
        </div>
      </section>

      <section class="ka-toolbar">
        <div class="ka-search">
          <svg class="ka-search__icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="search" class="ka-search__input" type="search" :placeholder="$t('v2.kamas.filters.search')" />
        </div>
        <V2Select v-model="typeFilter" :options="typeFilterOptions" :placeholder="$t('v2.kamas.filters.allTypes')" size="compact" aria-label="History type filter" />
        <V2Select v-model="confidenceFilter" :options="confidenceFilterOptions" :placeholder="$t('v2.kamas.filters.allConfidence')" size="compact" aria-label="History confidence filter" />
        <V2Select v-model="sortBy" :options="sortOptions" placeholder="Sort" size="compact" aria-label="History sort" />
      </section>

      <details class="ka-panel ka-advanced">
        <summary class="ka-advanced__summary">
          <div>
            <h2>{{ $t('v2.kamas.scanner.title') }}</h2>
            <p>{{ $t('v2.kamas.scanner.desc') }}</p>
          </div>
          <span>Advanced</span>
        </summary>
        <div class="ka-panel__head ka-panel__head--inside">
          <div />
          <button class="ka-btn" @click="buildScanQueue">{{ $t('v2.kamas.scanner.buildQueue') }}</button>
        </div>

        <div class="ka-scanner__grid">
          <div class="ka-scanner__current">
            <div class="ka-scanner__eyebrow">
              {{ scanQueue.length ? $t('v2.kamas.scanner.position', { current: scanQueueIndex + 1, total: scanQueue.length }) : $t('v2.kamas.scanner.noQueue') }}
            </div>
            <div class="ka-scanner__name">{{ currentScanItem || $t('v2.kamas.scanner.emptyCurrent') }}</div>
            <div class="ka-scanner__actions">
              <button class="ka-btn" :disabled="!currentScanItem" @click="copyCurrentScanItem">{{ scanCopyStatus || $t('v2.kamas.scanner.copy') }}</button>
              <button class="ka-btn" :disabled="!currentScanItem" @click="setActiveScanItem">{{ $t('v2.kamas.scanner.arm') }}</button>
              <button class="ka-btn ka-btn--ghost" :disabled="!currentScanItem" @click="skipScanItem">{{ $t('v2.kamas.scanner.skip') }}</button>
              <button class="ka-btn ka-btn--ghost" :disabled="!scanQueue.length" @click="clearScanQueue">{{ $t('v2.kamas.scanner.clear') }}</button>
            </div>
          </div>

          <div class="ka-scanner__inbox">
            <div class="ka-scanner__inbox-head">
              <strong>{{ $t('v2.kamas.scanner.inbox') }}</strong>
              <button class="ka-btn ka-btn--ghost" @click="pollScanResults">{{ $t('v2.kamas.scanner.refresh') }}</button>
            </div>
            <div v-if="scanResults.length" class="ka-scanner__results">
              <div v-for="result in scanResults.slice(0, 5)" :key="result.id" class="ka-scanner-result">
                <div>
                  <strong>{{ result.itemName }}</strong>
                  <span>{{ formatKamasCompact(result.price) }} · {{ result.confidence }}</span>
                </div>
                <div class="ka-scanner-result__actions">
                  <button class="ka-btn" @click="acceptScanResult(result)">{{ $t('v2.kamas.scanner.accept') }}</button>
                  <button class="ka-btn ka-btn--ghost" @click="dismissScanResult(result.id)">{{ $t('v2.kamas.scanner.dismiss') }}</button>
                </div>
              </div>
            </div>
            <div v-else class="ka-empty">{{ $t('v2.kamas.scanner.emptyInbox') }}</div>
          </div>
        </div>
      </details>

      <section class="ka-grid">
        <div class="ka-panel ka-panel--large">
          <div class="ka-panel__head">
            <div>
              <h2>{{ $t('v2.kamas.sections.doToday') }}</h2>
              <p>{{ $t('v2.kamas.sections.doTodayDesc') }}</p>
            </div>
          </div>
          <div v-if="topActions.length" class="ka-action-list">
            <NuxtLink v-for="opportunity in topActions" :key="opportunity.id" :to="localePath(opportunity.path)" class="ka-action">
              <div class="ka-action__main">
                <span class="ka-pill" :class="`ka-pill--${opportunity.type}`">{{ $t(`v2.kamas.types.${opportunity.type}`) }}</span>
                <h3>{{ opportunity.title }}</h3>
                <p>{{ opportunity.suggestedAction }}</p>
              </div>
              <div class="ka-action__side">
                <strong :class="(opportunity.estimatedProfit ?? 0) >= 0 ? 'ka-positive' : 'ka-negative'">
                  {{ opportunity.estimatedProfit === null ? '-' : `${opportunity.estimatedProfit >= 0 ? '+' : ''}${formatKamasCompact(opportunity.estimatedProfit)}` }}
                </strong>
                <span>{{ opportunity.marginPercent === null ? '-' : `${opportunity.marginPercent}%` }}</span>
              </div>
            </NuxtLink>
          </div>
          <div v-else class="ka-empty">{{ $t('v2.kamas.empty.noActions') }}</div>
        </div>

        <div class="ka-panel">
          <div class="ka-panel__head">
            <div>
              <h2>{{ $t('v2.kamas.sections.performance') }}</h2>
              <p>{{ $t('v2.kamas.sections.performanceDesc') }}</p>
            </div>
          </div>
          <div class="ka-source-list">
            <div v-for="source in sourceSummary" :key="source.type" class="ka-source">
              <div>
                <span>{{ $t(`v2.kamas.types.${source.type}`) }}</span>
                <strong>{{ source.count }}</strong>
              </div>
              <div :class="source.profit >= 0 ? 'ka-positive' : 'ka-negative'">
                {{ source.profit >= 0 ? '+' : '' }}{{ formatKamasCompact(source.profit) }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="ka-panel">
        <div class="ka-panel__head">
          <div>
            <h2>{{ $t('v2.kamas.sections.best') }}</h2>
            <p>{{ $t('v2.kamas.sections.bestDesc') }}</p>
          </div>
        </div>
        <div class="ka-table">
          <div class="ka-table__head">
            <span>{{ $t('v2.kamas.table.action') }}</span>
            <span>{{ $t('v2.kamas.table.cost') }}</span>
            <span>{{ $t('v2.kamas.table.revenue') }}</span>
            <span>{{ $t('v2.kamas.table.profit') }}</span>
            <span>{{ $t('v2.kamas.table.confidence') }}</span>
          </div>
          <NuxtLink v-for="opportunity in filteredOpportunities" :key="opportunity.id" :to="localePath(opportunity.path)" class="ka-row">
            <div class="ka-row__action">
              <span class="ka-pill" :class="`ka-pill--${opportunity.type}`">{{ $t(`v2.kamas.types.${opportunity.type}`) }}</span>
              <strong>{{ opportunity.title }}</strong>
              <small>{{ opportunity.reason }}</small>
            </div>
            <span>{{ formatKamasCompact(opportunity.estimatedCost) }}</span>
            <span>{{ formatKamasCompact(opportunity.estimatedRevenue) }}</span>
            <span :class="(opportunity.estimatedProfit ?? 0) >= 0 ? 'ka-positive' : 'ka-negative'">
              {{ opportunity.estimatedProfit === null ? '-' : `${opportunity.estimatedProfit >= 0 ? '+' : ''}${formatKamasCompact(opportunity.estimatedProfit)}` }}
            </span>
            <span>{{ $t(`v2.kamas.confidence.${opportunity.confidence}`) }}</span>
          </NuxtLink>
          <div v-if="!filteredOpportunities.length" class="ka-empty">{{ $t('v2.kamas.empty.noMatches') }}</div>
        </div>
      </section>

      <section class="ka-grid">
        <div class="ka-panel">
          <div class="ka-panel__head">
            <div>
              <h2>{{ $t('v2.kamas.sections.missing') }}</h2>
              <p>{{ $t('v2.kamas.sections.missingDesc') }}</p>
            </div>
          </div>
          <div class="ka-compact-list">
            <NuxtLink v-for="item in missingDataItems.slice(0, 8)" :key="item.id" :to="localePath(item.path)" class="ka-compact">
              <strong>{{ item.itemName }}</strong>
              <span>{{ item.missingData.join(', ') }}</span>
            </NuxtLink>
            <div v-if="!missingDataItems.length" class="ka-empty">{{ $t('v2.kamas.empty.noMissingData') }}</div>
          </div>
        </div>

        <div class="ka-panel">
          <div class="ka-panel__head">
            <div>
              <h2>{{ $t('v2.kamas.sections.lessons') }}</h2>
              <p>{{ $t('v2.kamas.sections.lessonsDesc') }}</p>
            </div>
          </div>
          <div class="ka-compact-list">
            <NuxtLink v-for="item in lessons.slice(0, 8)" :key="item.id" :to="localePath(item.path)" class="ka-compact">
              <strong>{{ item.itemName }}</strong>
              <span>{{ item.reason }}</span>
            </NuxtLink>
            <div v-if="!lessons.length" class="ka-empty">{{ $t('v2.kamas.empty.noLessons') }}</div>
          </div>
        </div>
      </section>

      <details class="ka-panel ka-advanced">
        <summary class="ka-advanced__summary">
          <div>
            <h2>{{ $t('v2.kamas.sections.audit') }}</h2>
            <p>{{ $t('v2.kamas.sections.auditDesc') }}</p>
          </div>
          <span>Advanced</span>
        </summary>
        <div class="ka-audit">
          <div v-for="item in auditItems" :key="item.key" class="ka-audit__item">
            <strong>{{ item.label }}</strong>
            <span>{{ item.storage }}</span>
            <p>{{ item.backupNote }}</p>
          </div>
        </div>
      </details>
    </template>
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
  ...typeOptions.map((type) => ({ key: type, label: t(`v2.kamas.types.${type}`), value: type })),
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
  opportunities.value
    .filter((item) => item.type !== 'missing-data')
    .slice(0, 6),
)

const missingDataItems = computed(() =>
  opportunities.value.filter((item) => item.type === 'missing-data' || item.missingData.length > 0),
)

const staleItems = computed(() =>
  opportunities.value.filter((item) => item.type === 'maintenance'),
)

const lessons = computed(() =>
  opportunities.value.filter((item) => (item.estimatedProfit ?? 0) < 0 || item.risk === 'high'),
)

const totalExpectedProfit = computed(() =>
  opportunities.value
    .filter((item) => item.type !== 'missing-data')
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
    .filter((item) => item.type === 'missing-data' || item.missingData.length || item.type === 'familiar')
    .map((item) => item.itemName)
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
  scanCopyStatus.value = 'Copied'
  window.setTimeout(() => {
    scanCopyStatus.value = ''
  }, 900)
}

const setActiveScanItem = async () => {
  if (!currentScanItem.value) return
  await $fetch('/api/hdv-scan/active', {
    method: 'POST',
    body: {
      itemName: currentScanItem.value,
      source: 'kamas-page',
    },
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
  const familiarKey = Object.keys(familiarPrices.value).find((key) => normalizeName(key) === normalized)
  const resourceKey = Object.keys(resourcePrices.value).find((key) => normalizeName(key) === normalized)

  if (familiarKey) {
    familiarPrices.value = { ...familiarPrices.value, [familiarKey]: result.price }
  } else if (resourceKey) {
    resourcePrices.value = { ...resourcePrices.value, [resourceKey]: result.price }
  } else {
    resourcePrices.value = { ...resourcePrices.value, [result.itemName]: result.price }
  }

  writePriceMaps()
  await dismissScanResult(result.id)
  if (normalizeName(currentScanItem.value) === normalized) {
    skipScanItem()
  }
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

<style scoped>
.ka-page { display: flex; flex-direction: column; gap: 1rem; }
.ka-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; }
.ka-stat, .ka-panel {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-border);
  border-radius: 14px;
}
.ka-stat { padding: 1rem; }
.ka-stat__label { font-size: .7rem; color: var(--v2-text-dim); text-transform: uppercase; font-weight: 800; letter-spacing: .08em; }
.ka-stat__value { margin-top: .35rem; font-size: 1.35rem; color: var(--v2-text); font-weight: 850; }
.ka-toolbar { display: grid; grid-template-columns: minmax(220px, 1fr) 180px 180px 180px; gap: .75rem; }
.ka-search { position: relative; }
.ka-search__icon { position: absolute; left: .8rem; top: 50%; transform: translateY(-50%); color: var(--v2-text-dim); }
.ka-search__input {
  width: 100%;
  height: 42px;
  border-radius: 10px;
  border: 1px solid var(--v2-border);
  background: rgba(0,0,0,.28);
  color: var(--v2-text);
  outline: none;
}
.ka-search__input { padding: 0 .85rem 0 2.35rem; }
.ka-toolbar :deep(.v2s__trigger) { min-height: 42px; }
.ka-advanced {
  padding: 0;
  overflow: hidden;
}
.ka-advanced__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  cursor: pointer;
  list-style: none;
}
.ka-advanced__summary::-webkit-details-marker { display: none; }
.ka-advanced__summary:hover { background: var(--v2-hover); }
.ka-advanced__summary h2 {
  font-size: 1rem;
  font-weight: 850;
  color: var(--v2-text);
}
.ka-advanced__summary p {
  margin-top: .2rem;
  color: var(--v2-text-muted);
  font-size: .85rem;
}
.ka-advanced__summary span {
  border: 1px solid var(--v2-border);
  border-radius: 999px;
  padding: .2rem .55rem;
  color: var(--v2-text-secondary);
  font-size: .7rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.ka-panel__head--inside {
  padding: 0 1rem .75rem;
  margin-bottom: 0;
}
.ka-advanced .ka-scanner__grid,
.ka-advanced .ka-audit {
  margin: 0 1rem 1rem;
}
.ka-btn {
  min-height: 34px;
  border: 1px solid var(--v2-border-med);
  border-radius: 9px;
  padding: .45rem .7rem;
  background: var(--v2-active);
  color: var(--v2-text);
  font-size: .78rem;
  font-weight: 800;
  cursor: pointer;
}
.ka-btn:hover:not(:disabled) { border-color: var(--v2-border-focus); background: var(--v2-hover); }
.ka-btn:disabled { opacity: .45; cursor: not-allowed; }
.ka-btn--ghost { background: transparent; color: var(--v2-text-muted); }
.ka-scanner__grid { display: grid; grid-template-columns: minmax(260px, .9fr) minmax(0, 1.1fr); gap: 1rem; }
.ka-scanner__current, .ka-scanner__inbox {
  border: 1px solid var(--v2-border);
  border-radius: 12px;
  background: rgba(0,0,0,.16);
  padding: .9rem;
}
.ka-scanner__eyebrow {
  color: var(--v2-text-dim);
  font-size: .68rem;
  font-weight: 850;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.ka-scanner__name {
  margin-top: .35rem;
  font-size: 1.15rem;
  font-weight: 900;
  color: var(--v2-text);
  overflow-wrap: anywhere;
}
.ka-scanner__actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .8rem; }
.ka-scanner__inbox-head { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: .6rem; }
.ka-scanner__inbox-head strong { color: var(--v2-text); }
.ka-scanner__results { display: flex; flex-direction: column; gap: .5rem; }
.ka-scanner-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  border: 1px solid var(--v2-border);
  border-radius: 10px;
  padding: .65rem;
}
.ka-scanner-result strong { display: block; color: var(--v2-text); font-size: .88rem; }
.ka-scanner-result span { display: block; margin-top: .15rem; color: var(--v2-text-muted); font-size: .78rem; }
.ka-scanner-result__actions { display: flex; gap: .45rem; flex-wrap: wrap; justify-content: flex-end; }
.ka-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, .9fr); gap: 1rem; }
.ka-panel { padding: 1rem; min-width: 0; }
.ka-panel__head { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: .8rem; }
.ka-panel__head h2 { font-size: 1rem; font-weight: 850; color: var(--v2-text); }
.ka-panel__head p { margin-top: .2rem; color: var(--v2-text-muted); font-size: .85rem; }
.ka-action-list, .ka-compact-list, .ka-source-list { display: flex; flex-direction: column; gap: .55rem; }
.ka-action, .ka-compact, .ka-source {
  text-decoration: none;
  color: var(--v2-text);
  border: 1px solid var(--v2-border);
  background: rgba(0,0,0,.16);
  border-radius: 10px;
}
.ka-action { display: flex; justify-content: space-between; gap: 1rem; padding: .8rem; }
.ka-action:hover, .ka-compact:hover { border-color: var(--v2-border-med); background: var(--v2-hover); }
.ka-action h3 { margin-top: .3rem; font-size: .95rem; font-weight: 800; }
.ka-action p { margin-top: .2rem; color: var(--v2-text-muted); font-size: .82rem; line-height: 1.35; }
.ka-action__side { display: flex; min-width: 110px; flex-direction: column; align-items: flex-end; justify-content: center; gap: .2rem; }
.ka-action__side strong { font-size: .95rem; }
.ka-action__side span { color: var(--v2-text-dim); font-size: .78rem; }
.ka-pill { display: inline-flex; align-items: center; width: fit-content; border-radius: 999px; padding: .18rem .45rem; font-size: .68rem; font-weight: 800; text-transform: uppercase; color: var(--v2-text); border: 1px solid var(--v2-border); background: var(--v2-active); }
.ka-pill--resale { color: #86efac; }
.ka-pill--craft { color: #67e8f9; }
.ka-pill--brisage { color: #c4b5fd; }
.ka-pill--familiar { color: #fdba74; }
.ka-pill--maintenance { color: #fde68a; }
.ka-pill--missing-data { color: #fca5a5; }
.ka-source { display: flex; align-items: center; justify-content: space-between; padding: .75rem; }
.ka-source span { display: block; color: var(--v2-text-muted); font-size: .78rem; }
.ka-source strong { display: block; margin-top: .1rem; }
.ka-table { overflow: hidden; border: 1px solid var(--v2-border); border-radius: 10px; }
.ka-table__head, .ka-row { display: grid; grid-template-columns: minmax(260px, 1fr) 130px 130px 130px 110px; gap: .75rem; align-items: center; }
.ka-table__head { padding: .65rem .8rem; color: var(--v2-text-dim); font-size: .7rem; font-weight: 850; text-transform: uppercase; letter-spacing: .06em; background: rgba(0,0,0,.22); }
.ka-row { padding: .75rem .8rem; color: var(--v2-text); text-decoration: none; border-top: 1px solid var(--v2-border); }
.ka-row:hover { background: var(--v2-hover); }
.ka-row__action { min-width: 0; display: flex; flex-direction: column; gap: .25rem; }
.ka-row__action strong { font-size: .9rem; }
.ka-row__action small { color: var(--v2-text-muted); line-height: 1.35; }
.ka-compact { display: flex; flex-direction: column; gap: .2rem; padding: .7rem .75rem; }
.ka-compact strong { font-size: .88rem; }
.ka-compact span { color: var(--v2-text-muted); font-size: .78rem; line-height: 1.35; }
.ka-audit { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; }
.ka-audit__item { border: 1px solid var(--v2-border); background: rgba(0,0,0,.14); border-radius: 10px; padding: .75rem; }
.ka-audit__item strong { display: block; color: var(--v2-text); font-size: .88rem; }
.ka-audit__item span { display: block; margin-top: .25rem; color: var(--v2-accent); font-size: .74rem; overflow-wrap: anywhere; }
.ka-audit__item p { margin-top: .45rem; color: var(--v2-text-muted); font-size: .78rem; line-height: 1.35; }
.ka-empty { padding: 1rem; color: var(--v2-text-muted); text-align: center; border: 1px dashed var(--v2-border); border-radius: 10px; }
.ka-positive { color: #86efac; }
.ka-negative { color: #fca5a5; }
@media (max-width: 1100px) {
  .ka-stats, .ka-grid, .ka-audit { grid-template-columns: 1fr 1fr; }
  .ka-toolbar { grid-template-columns: 1fr 1fr; }
  .ka-table__head { display: none; }
  .ka-row { grid-template-columns: 1fr; gap: .35rem; }
}
@media (max-width: 720px) {
  .ka-stats, .ka-grid, .ka-audit, .ka-toolbar { grid-template-columns: 1fr; }
  .ka-scanner__grid { grid-template-columns: 1fr; }
  .ka-action { flex-direction: column; }
  .ka-action__side { align-items: flex-start; }
}
</style>
