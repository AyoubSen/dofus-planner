<template>
  <div v-if="hasContext" class="flex flex-col gap-5">
    <!-- Completion -->
    <UiCard>
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span class="text-xs font-medium tracking-wide text-subtle uppercase">{{ $t('v2.succes.completion') }}</span>
        <span class="tabular text-lg font-semibold text-ink">{{ completedIds.size }}</span>
        <span class="tabular text-sm text-subtle">/ {{ totalCount }}</span>
        <span class="tabular ml-auto text-sm text-accent">{{ completionPct }}%</span>
      </div>
      <UiProgress :value="completionPct" class="mt-2" :aria-label="$t('v2.succes.completion')" />
    </UiCard>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <!-- Categories -->
      <UiCard :title="$t('v2.succes.categories')" :padded="false">
        <div v-if="catsLoading" class="p-3">
          <UiSkeleton v-for="i in 6" :key="i" height="1.75rem" class="mb-1" />
        </div>

        <!-- Caps the rail so a long category list can't push the achievements
             below the fold on short screens. Deliberately not a flex column:
             as flex items the ~50 rows shrank to 12px each to fit the cap
             instead of scrolling, which squashed every label into its border. -->
        <div v-else class="max-h-[26rem] overflow-y-auto p-2">
          <button
            type="button"
            :class="catClass(null)"
            @click="selectCategory(null)"
          >
            {{ $t('v2.succes.allAchievements') }}
          </button>

          <template v-for="cat in rootCategories" :key="cat.id">
            <button type="button" :class="catClass(cat.id)" @click="selectCategory(cat.id)">
              {{ localizedName(cat.name, String(cat.id)) }}
            </button>
            <button
              v-for="child in childCategories(cat.id)"
              :key="child.id"
              type="button"
              :class="[catClass(child.id), 'pl-5']"
              @click="selectCategory(child.id)"
            >
              {{ localizedName(child.name, String(child.id)) }}
            </button>
          </template>
        </div>
      </UiCard>

      <!-- Achievements -->
      <div class="min-w-0">
        <UiToolbar>
          <template #search>
            <UiInput
              v-model="search"
              type="search"
              :placeholder="$t('v2.succes.searchAchievements')"
              @update:model-value="onSearchInput"
            >
              <template #prefix><UiIcon name="search" /></template>
            </UiInput>
          </template>
          <template #filters>
            <UiSegmented
              v-model="completionFilter"
              :options="filterOptions"
              size="sm"
              :aria-label="$t('v2.succes.filterLabel')"
            />
          </template>
        </UiToolbar>

        <div v-if="loading" class="flex flex-col gap-2">
          <UiSkeleton v-for="i in 8" :key="i" height="3.5rem" />
        </div>

        <UiEmptyState
          v-else-if="!filteredAchievements.length"
          :title="$t('v2.succes.empty')"
          :description="$t('v2.succes.emptyDesc')"
        >
          <template #icon><UiIcon name="succes" /></template>
        </UiEmptyState>

        <div v-else class="flex flex-col gap-1.5">
          <div
            v-for="ach in filteredAchievements"
            :key="ach.id"
            :class="[
              'flex items-center gap-3 rounded-lg border p-2.5 transition-colors',
              isDone(ach.id) ? 'border-line bg-sunken' : 'border-line bg-surface',
            ]"
          >
            <button
              type="button"
              :class="[
                'flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors',
                isDone(ach.id)
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line-strong hover:border-accent',
              ]"
              role="checkbox"
              :aria-checked="isDone(ach.id)"
              :aria-label="localizedName(ach.name, String(ach.id))"
              @click="toggleAchievement(ach.id)"
            >
              <UiIcon v-if="isDone(ach.id)" name="check" class="size-[0.875rem]" />
            </button>

            <img
              v-if="ach.img"
              :src="ach.img"
              :alt="''"
              class="size-9 shrink-0 rounded-md object-contain"
              loading="lazy"
              @error="onImgErr"
            >
            <span v-else class="flex size-9 shrink-0 items-center justify-center rounded-md bg-sunken text-subtle">
              <UiIcon name="succes" />
            </span>

            <div class="min-w-0 flex-1">
              <p :class="['truncate text-sm', isDone(ach.id) ? 'text-muted' : 'font-medium text-ink']">
                {{ localizedName(ach.name, String(ach.id)) }}
              </p>
              <p v-if="localizedName(ach.description)" class="truncate text-xs text-subtle">
                {{ localizedName(ach.description) }}
              </p>
            </div>

            <UiBadge v-if="ach.points" tone="neutral">{{ ach.points }}</UiBadge>
          </div>
        </div>

        <UiPagination :page="currentPage" :total-pages="totalPages" @update:page="goToPage" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()
const { fetchAchievementsPage, fetchAchievementCategories } = useAchievementsApi()
const { localizedName } = useLocalizedName()

// Categories
const categories = ref<any[]>([])
const catsLoading = ref(false)
const selectedCategoryId = ref<number | null>(null)

const rootCategories = computed(() =>
  categories.value.filter(c => !c.parentId || c.parentId === 0 || c.parentId === null),
)

const childCategories = (parentId: number) =>
  categories.value.filter(c => Number(c.parentId) === parentId)

const catClass = (id: number | null) => [
  'w-full cursor-pointer truncate rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
  selectedCategoryId.value === id
    ? 'bg-accent-soft text-accent font-medium'
    : 'text-muted hover:bg-sunken hover:text-ink',
]

// Achievements
const achievements = ref<any[]>([])
const loading = ref(false)
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = 30

const search = ref('')
const completionFilter = ref<'all' | 'done' | 'todo'>('all')
let searchTimer: ReturnType<typeof setTimeout> | null = null

const filterOptions = computed(() => [
  { label: t('v2.succes.filters.all'), value: 'all' },
  { label: t('v2.succes.filters.done'), value: 'done' },
  { label: t('v2.succes.filters.todo'), value: 'todo' },
])

// Completion tracking
const completedIds = ref<Set<string>>(new Set())
const isDone = (id: number | string) => completedIds.value.has(String(id))

const storageKey = computed(() =>
  selectedServer.value && selectedCharacter.value
    ? `achievements-${selectedServer.value.id}-${selectedCharacter.value.id}`
    : null,
)

const loadCompletions = () => {
  if (!storageKey.value) return
  try {
    const raw = localStorage.getItem(storageKey.value)
    completedIds.value = raw
      ? new Set((JSON.parse(raw).completedIds ?? []).map(String))
      : new Set()
  } catch {
    completedIds.value = new Set()
  }
}

const saveCompletions = () => {
  if (!storageKey.value) return
  try {
    localStorage.setItem(storageKey.value, JSON.stringify({
      completedIds: Array.from(completedIds.value),
    }))
  } catch {}
}

const toggleAchievement = (id: number | string) => {
  const key = String(id)
  if (completedIds.value.has(key)) completedIds.value.delete(key)
  else completedIds.value.add(key)
  completedIds.value = new Set(completedIds.value) // trigger reactivity
  saveCompletions()
}

const completionPct = computed(() =>
  totalCount.value > 0 ? Math.round((completedIds.value.size / totalCount.value) * 100) : 0,
)

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

const filteredAchievements = computed(() => {
  if (completionFilter.value === 'all') return achievements.value
  if (completionFilter.value === 'done') return achievements.value.filter(a => isDone(a.id))
  return achievements.value.filter(a => !isDone(a.id))
})

// Fetching
const fetchAchievements = async (resetPage = false) => {
  if (resetPage) currentPage.value = 1
  loading.value = true
  try {
    const res = await fetchAchievementsPage({
      limit: pageSize,
      skip: (currentPage.value - 1) * pageSize,
      search: search.value || undefined,
      selectedCategoryId: selectedCategoryId.value,
      categories: categories.value,
    })
    achievements.value = res.data ?? []
    totalCount.value = res.total ?? 0
  } catch {
    achievements.value = []
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  catsLoading.value = true
  try {
    const res = await fetchAchievementCategories(200)
    categories.value = res.data ?? []
  } catch {
    categories.value = []
  } finally {
    catsLoading.value = false
  }
}

const selectCategory = (id: number | null) => {
  selectedCategoryId.value = id
  fetchAchievements(true)
}

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchAchievements(true), 400)
}

const goToPage = (page: number) => {
  currentPage.value = page
  fetchAchievements()
}

const onImgErr = (e: Event) => {
  const img = e.target as HTMLImageElement
  if (img.dataset.fb) return
  img.dataset.fb = '1'
  img.style.display = 'none'
}

watch([selectedServer, selectedCharacter], loadCompletions)

onMounted(async () => {
  initContext()
  loadCompletions()
  await loadCategories()
  fetchAchievements()
})
</script>
