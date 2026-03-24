<template>
  <div class="mon-page">
    <!-- ── Hero ─────────────────────────────────────────────── -->
    <div class="mon-hero">
      <div class="mon-hero__left">
        <div class="mon-hero__icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <div class="mon-hero__kicker">{{ $t('monsters.kicker') }}</div>
          <h1 class="mon-hero__title">{{ $t('monsters.title') }}</h1>
          <p class="mon-hero__sub">{{ $t('monsters.subtitle') }}</p>
        </div>
      </div>
      <div class="mon-hero__stat">
        <div class="mon-hero__stat-val">{{ response?.total ?? 0 }}</div>
        <div class="mon-hero__stat-lbl">{{ $t('monsters.totalResults') }}</div>
      </div>
    </div>

    <!-- ── Toolbar ───────────────────────────────────────────── -->
    <div class="mon-toolbar">
      <label class="mon-search">
        <span class="sr-only">{{ $t('monsters.searchLabel') }}</span>
        <svg class="mon-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
        </svg>
        <input
          v-model="searchInput"
          type="search"
          class="mon-search__input"
          :placeholder="$t('monsters.searchPlaceholder')"
        />
      </label>
      <div class="mon-toolbar__right">
        <span class="mon-toolbar__page">{{ $t('monsters.pageLabel', { page: currentPage }) }}</span>
        <span v-if="debouncedSearch" class="mon-toolbar__chip">{{ debouncedSearch }}</span>
      </div>
    </div>

    <!-- ── Loading ───────────────────────────────────────────── -->
    <div v-if="pending" class="mon-state">
      <div class="mon-spinner" />
      <span>{{ $t('v2.common.loading') }}</span>
    </div>

    <!-- ── Error ─────────────────────────────────────────────── -->
    <div v-else-if="error" class="mon-state mon-state--error">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:.4">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <h2>{{ $t('monsters.errorTitle') }}</h2>
      <p>{{ $t('monsters.errorDescription') }}</p>
    </div>

    <!-- ── Empty ─────────────────────────────────────────────── -->
    <div v-else-if="!monsters.length" class="mon-state">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:.25">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
      </svg>
      <h2>{{ $t('monsters.emptyTitle') }}</h2>
      <p>{{ $t('monsters.emptyDescription') }}</p>
    </div>

    <!-- ── Grid ──────────────────────────────────────────────── -->
    <div v-else class="mon-grid">
      <NuxtLink
        v-for="monster in monsters"
        :key="monster.id"
        :to="getMonsterLink(monster.id)"
        class="mon-card"
        :class="{ 'mon-card--boss': monster.isBoss, 'mon-card--mini': monster.isMiniBoss }"
      >
        <div class="mon-card__img">
          <img
            :src="monster.img || '/monster-fallback.svg'"
            :alt="monster.name?.fr || monster.slug?.fr || `Monster ${monster.id}`"
            @error="onImgError"
          />
          <span v-if="monster.isBoss" class="mon-badge mon-badge--boss">{{ $t('monsters.badges.boss') }}</span>
          <span v-else-if="monster.isMiniBoss" class="mon-badge mon-badge--mini">{{ $t('monsters.badges.miniBoss') }}</span>
        </div>
        <div class="mon-card__body">
          <div class="mon-card__name">{{ monster.name?.fr || monster.name?.en || monster.slug?.fr }}</div>
          <div class="mon-card__meta">
            <span class="mon-level">Lv. {{ getPrimaryLevel(monster) }}</span>
            <span class="mon-dot">·</span>
            <span class="mon-spells">{{ monster.spells?.length || 0 }} spells</span>
            <span v-if="monster.isQuestMonster" class="mon-chip mon-chip--quest">{{ $t('monsters.badges.quest') }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- ── Pagination ─────────────────────────────────────────── -->
    <div v-if="!pending && !error && totalPages > 1" class="mon-pagination">
      <button class="mon-page-btn" :disabled="currentPage <= 1" @click="setPage(currentPage - 1)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ $t('monsters.previous') }}
      </button>
      <span class="mon-pagination__status">{{ currentPage }} / {{ totalPages }}</span>
      <button class="mon-page-btn" :disabled="currentPage >= totalPages" @click="setPage(currentPage + 1)">
        {{ $t('monsters.next') }}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'v2' })

type MonsterListItem = {
  id: number
  img?: string
  isBoss?: boolean
  isMiniBoss?: boolean
  isQuestMonster?: boolean
  spells?: number[]
  tags?: string[]
  grades?: Array<{ level?: number }>
  name?: { fr?: string; en?: string }
  slug?: { fr?: string; en?: string }
}

type MonsterListResponse = {
  total: number
  limit: number
  skip: number
  data: MonsterListItem[]
}

const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 24

const getQueryString = (value: unknown) => (typeof value === 'string' ? value : '')
const getQueryPage = (value: unknown) => {
  const parsed = Number.parseInt(typeof value === 'string' ? value : '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const searchInput = ref(getQueryString(route.query.q))
const debouncedSearch = ref(getQueryString(route.query.q))
const currentPage = ref(getQueryPage(route.query.page))

let debounceHandle: ReturnType<typeof setTimeout> | null = null

watch(searchInput, (value) => {
  if (debounceHandle) clearTimeout(debounceHandle)
  debounceHandle = setTimeout(() => {
    debouncedSearch.value = value.trim()
    currentPage.value = 1
  }, 300)
})

watch(
  () => route.query,
  (query) => {
    const nextSearch = getQueryString(query.q)
    const nextPage = getQueryPage(query.page)
    if (nextSearch !== searchInput.value && nextSearch !== debouncedSearch.value) {
      searchInput.value = nextSearch
      debouncedSearch.value = nextSearch
    }
    if (nextPage !== currentPage.value) {
      currentPage.value = nextPage
    }
  }
)

watch([debouncedSearch, currentPage], async () => {
  const nextQuery: Record<string, string> = {}
  if (debouncedSearch.value) nextQuery.q = debouncedSearch.value
  if (currentPage.value > 1) nextQuery.page = String(currentPage.value)

  if (route.query.q === nextQuery.q && route.query.page === nextQuery.page) return
  await router.replace({ query: nextQuery })
})

const { data: response, pending, error } = await useAsyncData<MonsterListResponse>(
  'dofusdb-monsters-list',
  () =>
    $fetch('/api/dofusdb/monsters', {
      query: {
        '$sort[id]': -1,
        '$limit': PAGE_SIZE,
        '$populate': false,
        '$skip': (currentPage.value - 1) * PAGE_SIZE,
        lang: 'fr',
        ...(debouncedSearch.value ? { 'slug.fr[$search]': debouncedSearch.value } : {}),
      },
    }),
  {
    watch: [debouncedSearch, currentPage],
    default: () => ({ total: 0, limit: PAGE_SIZE, skip: 0, data: [] }),
  }
)

const monsters = computed(() => response.value?.data ?? [])
const totalPages = computed(() => {
  const total = response.value?.total ?? 0
  return Math.max(1, Math.ceil(total / PAGE_SIZE))
})
const routeQuery = computed(() => {
  const query: Record<string, string> = {}
  if (debouncedSearch.value) query.q = debouncedSearch.value
  if (currentPage.value > 1) query.page = String(currentPage.value)
  return query
})

const getMonsterLink = (monsterId: number) => {
  const basePath = localePath(`/monsters/${monsterId}`)
  const searchParams = new URLSearchParams(routeQuery.value)
  const queryString = searchParams.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

const setPage = (page: number) => {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}

const getPrimaryLevel = (monster: MonsterListItem) => monster.grades?.[0]?.level ?? '—'

const onImgError = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img.dataset.fallbackApplied === '1') return
  img.dataset.fallbackApplied = '1'
  img.src = '/monster-fallback.svg'
}
</script>

<style scoped>
.mon-page {
  display: flex;
  flex-direction: column;
  gap: .875rem;
}

/* ── Hero ───────────────────────────────────────────────────── */
.mon-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.375rem;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 16px;
}
.mon-hero__left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.mon-hero__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(245, 158, 11, .12);
  color: #f59e0b;
}
.mon-hero__kicker {
  font-size: .6875rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--v2-text-dim);
}
.mon-hero__title {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--v2-text);
  letter-spacing: -.02em;
}
.mon-hero__sub {
  font-size: .8125rem;
  color: var(--v2-text-secondary);
  margin-top: .125rem;
  max-width: 50rem;
}
.mon-hero__stat {
  text-align: right;
  flex-shrink: 0;
}
.mon-hero__stat-val {
  font-size: 2rem;
  font-weight: 800;
  color: #f59e0b;
  line-height: 1;
  letter-spacing: -.03em;
}
.mon-hero__stat-lbl {
  font-size: .6875rem;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--v2-text-dim);
  margin-top: .2rem;
}

/* ── Toolbar ──────────────────────────────────────────────── */
.mon-toolbar {
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-wrap: wrap;
  padding: .625rem .875rem;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px;
}
.mon-search {
  position: relative;
  flex: 1;
  min-width: 220px;
}
.mon-search__icon {
  position: absolute;
  left: .75rem;
  top: 50%;
  width: 1rem;
  height: 1rem;
  transform: translateY(-50%);
  color: var(--v2-text-dim);
  pointer-events: none;
}
.mon-search__input {
  width: 100%;
  padding: .4375rem .75rem .4375rem 2.25rem;
  border-radius: 9px;
  border: 1px solid var(--v2-border-med);
  background: rgba(0, 0, 0, .25);
  color: var(--v2-text);
  font-size: .875rem;
  outline: none;
  transition: border-color .15s;
}
.mon-search__input::placeholder { color: var(--v2-text-dim); }
.mon-search__input:focus { border-color: var(--v2-border-focus); }
.mon-toolbar__right {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-shrink: 0;
}
.mon-toolbar__page {
  font-size: .75rem;
  color: var(--v2-text-muted);
}
.mon-toolbar__chip {
  padding: .2rem .55rem;
  border-radius: 999px;
  background: rgba(245, 158, 11, .12);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, .2);
  font-size: .6875rem;
  font-weight: 600;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── States ──────────────────────────────────────────────── */
.mon-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: 3.5rem 1.5rem;
  text-align: center;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  color: var(--v2-text-secondary);
}
.mon-state h2 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--v2-text);
  margin-top: .25rem;
}
.mon-state p { font-size: .875rem; }
.mon-state--error { color: #fca5a5; }
.mon-state--error h2 { color: #fca5a5; }
.mon-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--v2-border-med);
  border-top-color: #f59e0b;
  border-radius: 999px;
  animation: mon-spin .8s linear infinite;
}
@keyframes mon-spin { to { transform: rotate(360deg); } }

/* ── Grid ────────────────────────────────────────────────── */
.mon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: .75rem;
}
.mon-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-decoration: none;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  transition: border-color .18s, box-shadow .18s, transform .18s;
}
.mon-card:hover {
  border-color: var(--v2-border-strong);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .2);
  transform: translateY(-2px);
}
.mon-card--boss { border-top: 2px solid rgba(248, 113, 113, .5); }
.mon-card--mini { border-top: 2px solid rgba(250, 204, 21, .45); }
.mon-card__img {
  position: relative;
  aspect-ratio: 4 / 3;
  background: rgba(0, 0, 0, .18);
  display: flex;
  align-items: center;
  justify-content: center;
}
.mon-card__img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: .75rem;
}
.mon-badge {
  position: absolute;
  top: .5rem;
  right: .5rem;
  padding: .2rem .5rem;
  border-radius: 999px;
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .03em;
}
.mon-badge--boss {
  background: rgba(248, 113, 113, .18);
  color: #fca5a5;
  border: 1px solid rgba(248, 113, 113, .28);
}
.mon-badge--mini {
  background: rgba(250, 204, 21, .14);
  color: #fde68a;
  border: 1px solid rgba(250, 204, 21, .22);
}
.mon-card__body {
  padding: .75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: .3rem;
}
.mon-card__name {
  font-size: .9375rem;
  font-weight: 700;
  color: var(--v2-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mon-card__meta {
  display: flex;
  align-items: center;
  gap: .3rem;
  flex-wrap: wrap;
}
.mon-level {
  font-size: .75rem;
  color: var(--v2-text-secondary);
  font-weight: 500;
}
.mon-dot {
  font-size: .75rem;
  color: var(--v2-text-dim);
}
.mon-spells {
  font-size: .75rem;
  color: var(--v2-text-dim);
}
.mon-chip {
  padding: .15rem .45rem;
  border-radius: 999px;
  font-size: .65rem;
  font-weight: 600;
}
.mon-chip--quest {
  background: rgba(96, 165, 250, .12);
  color: #93c5fd;
  border: 1px solid rgba(96, 165, 250, .2);
}

/* ── Pagination ───────────────────────────────────────────── */
.mon-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  padding: .875rem 1rem;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px;
}
.mon-page-btn {
  display: flex;
  align-items: center;
  gap: .375rem;
  padding: .4375rem .875rem;
  border-radius: 9px;
  border: 1px solid var(--v2-border-med);
  background: rgba(0, 0, 0, .2);
  color: var(--v2-text);
  font-size: .875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
}
.mon-page-btn:hover:not(:disabled) {
  border-color: var(--v2-border-strong);
  background: rgba(0, 0, 0, .3);
}
.mon-page-btn:disabled {
  opacity: .4;
  cursor: not-allowed;
}
.mon-pagination__status {
  font-size: .875rem;
  color: var(--v2-text-secondary);
  font-weight: 600;
  min-width: 60px;
  text-align: center;
}

@media (max-width: 640px) {
  .mon-hero { flex-direction: column; align-items: flex-start; }
  .mon-hero__stat { align-self: flex-end; }
  .mon-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
}
</style>
