<template>
  <div>
    <div v-if="!hasContext" class="v2-no-context">
      <div class="v2-no-context__icon">
        <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
      <div class="v2-no-context__title">{{ $t('v2.common.noCharacterTitle') }}</div>
      <div class="v2-no-context__desc">{{ $t('v2.succes.noCharacterDesc') }}</div>
    </div>

    <template v-else>
      <!-- Progress strip -->
      <div class="v2-succ-progress">
        <div class="v2-succ-progress__left">
          <span class="v2-succ-progress__label">Completion</span>
          <span class="v2-succ-progress__count">
            <strong>{{ completedIds.size }}</strong> / {{ totalCount }}
          </span>
          <span class="v2-succ-progress__pct">{{ completionPct }}%</span>
        </div>
        <div class="v2-progress-bar">
          <div class="v2-progress-bar__fill" :style="{ width: `${completionPct}%` }" />
        </div>
      </div>

      <!-- Layout -->
      <div class="v2-succ-layout">
        <!-- Category sidebar -->
        <div class="v2-panel v2-succ-cats">
          <div class="v2-panel-title">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
            Categories
          </div>

          <div v-if="catsLoading" class="v2-inline-loader">
            <div class="v2-spin-sm" /> {{ $t('v2.common.loading') }}
          </div>

          <div v-else class="v2-cat-list">
            <button
              class="v2-cat-btn"
              :class="{ 'v2-cat-btn--sel': !selectedCategoryId }"
              @click="selectCategory(null)"
            >All achievements</button>

            <template v-for="cat in rootCategories" :key="cat.id">
              <button
                class="v2-cat-btn"
                :class="{ 'v2-cat-btn--sel': selectedCategoryId === cat.id }"
                @click="selectCategory(cat.id)"
              >
                {{ cat.name?.fr ?? cat.id }}
              </button>
              <button
                v-for="child in childCategories(cat.id)"
                :key="child.id"
                class="v2-cat-btn v2-cat-btn--child"
                :class="{ 'v2-cat-btn--sel': selectedCategoryId === child.id }"
                @click="selectCategory(child.id)"
              >
                {{ child.name?.fr ?? child.id }}
              </button>
            </template>
          </div>
        </div>

        <!-- Achievement list -->
        <div class="v2-succ-main">
          <!-- Toolbar -->
          <div class="v2-succ-bar">
            <div class="v2-searchbox" style="flex:1;max-width:320px">
              <svg class="v2-searchbox__icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input v-model="search" type="text" :placeholder="$t('v2.succes.searchAchievements')" class="v2-searchbox__input" @input="onSearchInput" />
              <button v-if="search" class="v2-searchbox__clear" @click="clearSearch">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="v2-pills">
              <button v-for="f in FILTERS" :key="f.v" class="v2-pill" :class="{ 'v2-pill--on': completionFilter === f.v }" @click="completionFilter = f.v">
                {{ f.l }}
              </button>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="v2-center-loader">
            <div class="v2-spin" /> {{ $t('v2.succes.loadingAchievements') }}
          </div>

          <!-- List -->
          <div v-else>
            <div v-if="achievements.length === 0" class="v2-empty-full">
              <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:var(--v2-text-dim)">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No achievements found.
            </div>

            <div v-else class="v2-succ-list">
              <div
                v-for="ach in filteredAchievements"
                :key="ach.id"
                class="v2-ach-row"
                :class="{ 'v2-ach-row--done': completedIds.has(String(ach.id)) }"
              >
                <button
                  class="v2-ach-check"
                  :class="{ 'v2-ach-check--on': completedIds.has(String(ach.id)) }"
                  @click="toggleAchievement(ach.id)"
                  :title="completedIds.has(String(ach.id)) ? 'Mark as incomplete' : 'Mark as complete'"
                >
                  <svg v-if="completedIds.has(String(ach.id))" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>

                <img
                  v-if="ach.img"
                  :src="ach.img"
                  :alt="ach.name?.fr ?? ''"
                  class="v2-ach-img"
                  @error="onImgErr"
                />
                <div v-else class="v2-ach-img-placeholder">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>

                <div class="v2-ach-info">
                  <div class="v2-ach-name">{{ ach.name?.fr ?? ach.id }}</div>
                  <div v-if="ach.description?.fr" class="v2-ach-desc">{{ ach.description.fr }}</div>
                </div>

                <div v-if="ach.points" class="v2-ach-points">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {{ ach.points }}
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalCount > pageSize" class="v2-pagination">
              <button
                class="v2-page-btn"
                :disabled="currentPage <= 1"
                @click="goToPage(currentPage - 1)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span class="v2-page-info">{{ currentPage }} / {{ totalPages }}</span>
              <button
                class="v2-page-btn"
                :disabled="currentPage >= totalPages"
                @click="goToPage(currentPage + 1)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'v2' })

const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()
const { fetchAchievementsPage, fetchAchievementCategories } = useAchievementsApi()

// Categories
const categories = ref<any[]>([])
const catsLoading = ref(false)
const selectedCategoryId = ref<number | null>(null)

const rootCategories = computed(() =>
  categories.value.filter(c => !c.parentId || c.parentId === 0 || c.parentId === null)
)

const childCategories = (parentId: number) =>
  categories.value.filter(c => Number(c.parentId) === parentId)

// Achievements list
const achievements = ref<any[]>([])
const loading = ref(false)
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = 30

// Filters
const search = ref('')
const completionFilter = ref<'all' | 'done' | 'todo'>('all')
let searchTimer: ReturnType<typeof setTimeout> | null = null

const FILTERS = [
  { l: 'All', v: 'all' },
  { l: 'Completed', v: 'done' },
  { l: 'To do', v: 'todo' },
] as const

// Completion tracking
const completedIds = ref<Set<string>>(new Set())

const storageKey = computed(() =>
  selectedServer.value && selectedCharacter.value
    ? `achievements-${selectedServer.value.id}-${selectedCharacter.value.id}`
    : null
)

const loadCompletions = () => {
  if (!storageKey.value) return
  try {
    const raw = localStorage.getItem(storageKey.value)
    if (raw) {
      const parsed = JSON.parse(raw)
      completedIds.value = new Set((parsed.completedIds ?? []).map(String))
    } else {
      completedIds.value = new Set()
    }
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
  if (completedIds.value.has(key)) {
    completedIds.value.delete(key)
  } else {
    completedIds.value.add(key)
  }
  // trigger reactivity
  completedIds.value = new Set(completedIds.value)
  saveCompletions()
}

// Computed
const completionPct = computed(() =>
  totalCount.value > 0 ? Math.round((completedIds.value.size / totalCount.value) * 100) : 0
)

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

const filteredAchievements = computed(() => {
  if (completionFilter.value === 'all') return achievements.value
  if (completionFilter.value === 'done')
    return achievements.value.filter(a => completedIds.value.has(String(a.id)))
  return achievements.value.filter(a => !completedIds.value.has(String(a.id)))
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

const clearSearch = () => {
  search.value = ''
  fetchAchievements(true)
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

watch([selectedServer, selectedCharacter], () => {
  loadCompletions()
})

onMounted(async () => {
  initContext()
  loadCompletions()
  await loadCategories()
  fetchAchievements()
})
</script>

<style scoped>
/* Progress strip */
.v2-succ-progress {
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-active);
  border-radius: 14px; padding: .875rem 1.125rem; margin-bottom: .875rem;
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
}
.v2-succ-progress__left {
  display: flex; align-items: center; gap: .75rem;
}
.v2-succ-progress__label { font-size: .8125rem; color: var(--v2-text-secondary); font-weight: 500; }
.v2-succ-progress__count { font-size: .875rem; color: var(--v2-text); font-weight: 600; }
.v2-succ-progress__pct {
  font-size: .75rem; font-weight: 700; color: var(--v2-accent);
  background: var(--v2-border-med); padding: .125rem .4375rem; border-radius: 999px;
}
.v2-progress-bar {
  flex: 1; min-width: 120px; height: 5px;
  background: var(--v2-border-subtle); border-radius: 999px; overflow: hidden;
}
.v2-progress-bar__fill {
  height: 100%; background: linear-gradient(90deg, var(--v2-accent), var(--v2-accent-light));
  border-radius: 999px; transition: width .4s ease;
}

/* Main layout */
.v2-succ-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1rem;
  align-items: start;
}

@media (max-width: 700px) {
  .v2-succ-layout { grid-template-columns: 1fr; }
}

.v2-panel {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  padding: 1rem;
}
.v2-panel-title {
  display: flex; align-items: center; gap: .5rem;
  font-size: .875rem; font-weight: 700; color: var(--v2-text-hover);
  margin-bottom: .875rem;
}

/* Category list */
.v2-succ-cats { position: sticky; top: 1rem; }
.v2-cat-list { display: flex; flex-direction: column; gap: 2px; max-height: 70vh; overflow-y: auto; }
.v2-cat-btn {
  text-align: left; padding: .375rem .625rem; border-radius: 8px;
  border: none; background: transparent; color: var(--v2-text-secondary);
  font-size: .8125rem; cursor: pointer; transition: all .15s; line-height: 1.4;
}
.v2-cat-btn:hover { background: var(--v2-border-subtle); color: var(--v2-text-hover); }
.v2-cat-btn--sel { background: var(--v2-border-med); color: var(--v2-text); font-weight: 600; }
.v2-cat-btn--child { padding-left: 1.25rem; font-size: .75rem; }

/* Toolbar */
.v2-succ-bar {
  display: flex; align-items: center; gap: .625rem; flex-wrap: wrap; margin-bottom: .75rem;
}

/* Searchbox */
.v2-searchbox {
  position: relative; display: flex; align-items: center;
}
.v2-searchbox__icon { position: absolute; left: .75rem; color: var(--v2-text-dim); pointer-events: none; }
.v2-searchbox__input {
  background: rgba(0,0,0,.3); border: 1px solid var(--v2-border); border-radius: 10px;
  padding: .5rem 2.25rem; color: var(--v2-text); font-size: .875rem;
  outline: none; width: 100%; transition: border-color .18s;
}
.v2-searchbox__input:focus { border-color: var(--v2-border-focus); }
.v2-searchbox__input::placeholder { color: var(--v2-text-dimmer); }
.v2-searchbox__clear {
  position: absolute; right: .625rem; background: none; border: none;
  color: var(--v2-text-dim); cursor: pointer; display: flex; align-items: center; transition: color .15s;
}
.v2-searchbox__clear:hover { color: var(--v2-accent); }

/* Pills */
.v2-pills { display: flex; gap: 4px; }
.v2-pill {
  padding: .375rem .875rem; border-radius: 999px;
  border: 1px solid var(--v2-border); background: transparent;
  color: var(--v2-text-secondary); font-size: .8125rem; font-weight: 500; cursor: pointer; transition: all .15s;
}
.v2-pill:hover { border-color: var(--v2-border-strong); color: var(--v2-text-hover); }
.v2-pill--on { background: var(--v2-border-med); border-color: var(--v2-border-strong); color: var(--v2-text); }

/* Loaders */
.v2-inline-loader {
  display: flex; align-items: center; gap: .5rem;
  font-size: .8125rem; color: var(--v2-text-secondary); padding: .375rem 0;
}
.v2-spin-sm {
  width: 16px; height: 16px; flex-shrink: 0;
  border: 2px solid var(--v2-border-med); border-top-color: var(--v2-accent);
  border-radius: 50%; animation: vspin .8s linear infinite;
}
.v2-center-loader {
  display: flex; align-items: center; justify-content: center;
  gap: .75rem; padding: 4rem; color: var(--v2-text-secondary); font-size: .9375rem;
}
.v2-spin {
  width: 22px; height: 22px;
  border: 2px solid var(--v2-border-med); border-top-color: var(--v2-accent);
  border-radius: 50%; animation: vspin .8s linear infinite; flex-shrink: 0;
}
@keyframes vspin { to { transform: rotate(360deg); } }

/* Empty state */
.v2-empty-full {
  padding: 2.5rem 1rem; text-align: center;
  color: var(--v2-text-dim); font-size: .9375rem;
  display: flex; flex-direction: column; align-items: center; gap: .25rem;
}

/* Achievement list */
.v2-succ-list { display: flex; flex-direction: column; gap: 3px; }
.v2-ach-row {
  display: flex; align-items: center; gap: .625rem;
  padding: .5rem .75rem; border-radius: 10px;
  background: rgba(0,0,0,.15); border: 1px solid var(--v2-glow);
  transition: all .15s;
}
.v2-ach-row:hover { border-color: var(--v2-border-med); }
.v2-ach-row--done {
  background: rgba(52,211,153,.03); border-color: rgba(52,211,153,.15);
}

.v2-ach-check {
  width: 22px; height: 22px; flex-shrink: 0; border-radius: 6px;
  border: 2px solid var(--v2-border-med); background: transparent;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: transparent; transition: all .15s;
}
.v2-ach-check:hover { border-color: rgba(52,211,153,.4); }
.v2-ach-check--on { background: rgba(52,211,153,.18); border-color: rgba(52,211,153,.4); color: #34d399; }

.v2-ach-img {
  width: 36px; height: 36px; object-fit: contain; flex-shrink: 0; border-radius: 6px;
}
.v2-ach-img-placeholder {
  width: 36px; height: 36px; flex-shrink: 0; border-radius: 6px;
  background: var(--v2-hover); border: 1px solid var(--v2-active);
  display: flex; align-items: center; justify-content: center; color: var(--v2-text-dim);
}

.v2-ach-info { flex: 1; min-width: 0; }
.v2-ach-name {
  font-size: .875rem; font-weight: 600; color: var(--v2-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.v2-ach-desc {
  font-size: .6875rem; color: var(--v2-text-muted); margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.v2-ach-points {
  display: flex; align-items: center; gap: .25rem;
  font-size: .75rem; font-weight: 600; color: var(--v2-accent); flex-shrink: 0;
}

/* Pagination */
.v2-pagination {
  display: flex; align-items: center; justify-content: center; gap: .75rem;
  padding: .875rem 0;
}
.v2-page-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--v2-border-med); background: var(--v2-hover);
  color: var(--v2-text-hover); cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .15s;
}
.v2-page-btn:hover:not(:disabled) { background: var(--v2-border-med); border-color: var(--v2-border-strong); }
.v2-page-btn:disabled { opacity: .3; cursor: not-allowed; }
.v2-page-info { font-size: .875rem; color: var(--v2-text-secondary); font-weight: 500; }
</style>



