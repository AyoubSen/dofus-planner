<template>
  <div class="flex flex-col gap-4">
    <UiToolbar>
      <template #search>
        <UiInput
          v-model="searchInput"
          type="search"
          :placeholder="$t('monsters.searchPlaceholder')"
          :aria-label="$t('monsters.searchLabel')"
        >
          <template #prefix><UiIcon name="search" /></template>
        </UiInput>
      </template>
      <template #actions>
        <span class="tabular text-sm text-subtle">
          {{ $t('monsters.totalResults') }}: {{ response?.total ?? 0 }}
        </span>
      </template>
    </UiToolbar>

    <div v-if="pending" class="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(9.5rem,1fr))]">
      <UiSkeleton v-for="i in 12" :key="i" height="11rem" />
    </div>

    <UiEmptyState
      v-else-if="error"
      :title="$t('monsters.errorTitle')"
      :description="$t('monsters.errorDescription')"
    >
      <template #icon><UiIcon name="alert" /></template>
    </UiEmptyState>

    <UiEmptyState
      v-else-if="!monsters.length"
      :title="$t('monsters.emptyTitle')"
      :description="$t('monsters.emptyDescription')"
    >
      <template #icon><UiIcon name="search" /></template>
    </UiEmptyState>

    <div v-else class="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(9.5rem,1fr))]">
      <NuxtLink
        v-for="monster in monsters"
        :key="monster.id"
        :to="getMonsterLink(monster.id)"
        class="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-line-strong"
      >
        <div class="relative flex aspect-square items-center justify-center bg-sunken p-2">
          <img
            :src="monster.img || '/monster-fallback.svg'"
            :alt="''"
            loading="lazy"
            class="max-h-full max-w-full object-contain"
            @error="onImgError"
          >
          <!-- Boss / mini-boss is the one distinction worth colour here. -->
          <UiBadge v-if="monster.isBoss" tone="accent" class="absolute top-1.5 left-1.5">
            {{ $t('monsters.badges.boss') }}
          </UiBadge>
          <UiBadge v-else-if="monster.isMiniBoss" tone="neutral" class="absolute top-1.5 left-1.5">
            {{ $t('monsters.badges.miniBoss') }}
          </UiBadge>
        </div>

        <div class="min-w-0 p-2.5">
          <p class="truncate text-sm font-medium text-ink">
            {{ localizedName(monster.name, localizedName(monster.slug, String(monster.id))) }}
          </p>
          <p class="mt-0.5 truncate text-xs text-subtle">
            <span class="tabular">{{ $t('monsters.level', { level: getPrimaryLevel(monster) }) }}</span>
            ·
            {{ $t('monsters.spellCount', { count: monster.spells?.length || 0 }) }}
          </p>
        </div>
      </NuxtLink>
    </div>

    <UiPagination
      v-if="!pending && !error"
      :page="currentPage"
      :total-pages="totalPages"
      @update:page="setPage"
    />
  </div>
</template>

<script setup lang="ts">
type MonsterListItem = {
  id: number
  img?: string
  isBoss?: boolean
  isMiniBoss?: boolean
  isQuestMonster?: boolean
  spells?: number[]
  tags?: string[]
  grades?: Array<{ level?: number }>
  name?: Record<string, string>
  slug?: Record<string, string>
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
const { localizedName } = useLocalizedName()

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
    if (nextPage !== currentPage.value) currentPage.value = nextPage
  },
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
        'lang': 'fr',
        ...(debouncedSearch.value ? { 'slug.fr[$search]': debouncedSearch.value } : {}),
      },
    }),
  {
    watch: [debouncedSearch, currentPage],
    default: () => ({ total: 0, limit: PAGE_SIZE, skip: 0, data: [] }),
  },
)

const monsters = computed(() => response.value?.data ?? [])
const totalPages = computed(() =>
  Math.max(1, Math.ceil((response.value?.total ?? 0) / PAGE_SIZE)),
)

const routeQuery = computed(() => {
  const query: Record<string, string> = {}
  if (debouncedSearch.value) query.q = debouncedSearch.value
  if (currentPage.value > 1) query.page = String(currentPage.value)
  return query
})

// Carry the search back to the list so the detail page's "back" lands where
// the user left off.
const getMonsterLink = (monsterId: number) => {
  const basePath = localePath(`/monsters/${monsterId}`)
  const queryString = new URLSearchParams(routeQuery.value).toString()
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
