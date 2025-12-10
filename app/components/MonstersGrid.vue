<template>
  <div class="space-y-8">
    <!-- Header & Filters -->
    <div
      class="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6"
    >
      <!-- Stats Row -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-xl flex items-center justify-center border border-orange-500/20"
          >
            <svg
              class="w-6 h-6 text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-100">
              {{ t('archimonstres.monstersGrid.title') }}
              <span class="text-orange-400"
                >({{ filteredMonsters.length }})</span
              >
            </h2>
            <p class="text-sm text-gray-400">
              {{
                t('archimonstres.monstersGrid.showing', {
                  displayed: displayedMonsters.length,
                  total: filteredMonsters.length,
                })
              }}
            </p>
          </div>
        </div>

        <!-- Quick Stats -->
        <div v-if="mode === 'dofus-ocre'" class="flex items-center gap-3">
          <div
            class="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <span class="text-red-400 font-semibold">{{
              countStats.zero
            }}</span>
            <span class="text-red-400/60 text-sm ml-1">{{
              t('archimonstres.monstersGrid.stats.missing')
            }}</span>
          </div>
          <div
            class="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl"
          >
            <span class="text-yellow-400 font-semibold">{{
              countStats.one
            }}</span>
            <span class="text-yellow-400/60 text-sm ml-1">{{
              t('archimonstres.monstersGrid.stats.haveOne')
            }}</span>
          </div>
          <div
            class="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
          >
            <span class="text-emerald-400 font-semibold">{{
              countStats.multiple
            }}</span>
            <span class="text-emerald-400/60 text-sm ml-1">{{
              t('archimonstres.monstersGrid.stats.haveMultiple')
            }}</span>
          </div>
        </div>
      </div>

      <!-- Filters Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Search -->
        <div class="relative">
          <div
            class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
          >
            <svg
              class="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            v-model="searchTerm"
            type="text"
            :placeholder="t('archimonstres.monstersGrid.filters.searchPlaceholder')"
            class="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300"
          />
        </div>

        <!-- Type Filter -->
        <div class="relative">
          <select
            v-model="filterType"
            class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-xl text-gray-100 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 appearance-none cursor-pointer"
          >
            <option value="">
              {{ t('archimonstres.monstersGrid.filters.allTypes') }}
            </option>
            <option value="archimonstre">
              {{ t('archimonstres.monstersGrid.filters.archimonstres') }}
            </option>
            <option value="monstre">
              {{ t('archimonstres.monstersGrid.filters.monstres') }}
            </option>
          </select>
          <div
            class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"
          >
            <svg
              class="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <!-- Étape Filter -->
        <div class="relative">
          <select
            v-model="filterEtape"
            class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-xl text-gray-100 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 appearance-none cursor-pointer"
          >
            <option value="">
              {{ t('archimonstres.monstersGrid.filters.allEtapes') }}
            </option>
            <option
              v-for="etape in availableEtapes"
              :key="etape"
              :value="etape"
            >
              {{ t('archimonstres.monstersGrid.filters.etape', { number: etape }) }}
            </option>
          </select>
          <div
            class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"
          >
            <svg
              class="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <!-- Count Filter (only for dofus-ocre mode) -->
        <div v-if="mode === 'dofus-ocre'" class="relative">
          <select
            v-model="filterCount"
            class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-xl text-gray-100 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 appearance-none cursor-pointer"
          >
            <option value="">
              {{ t('archimonstres.monstersGrid.filters.allCounts') }}
            </option>
            <option value="0">
              {{
                t('archimonstres.monstersGrid.filters.missingCount', {
                  count: countStats.zero,
                })
              }}
            </option>
            <option value="1">
              {{
                t('archimonstres.monstersGrid.filters.haveOneCount', {
                  count: countStats.one,
                })
              }}
            </option>
            <option value="2+">
              {{
                t('archimonstres.monstersGrid.filters.haveMultipleCount', {
                  count: countStats.multiple,
                })
              }}
            </option>
          </select>
          <div
            class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"
          >
            <svg
              class="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Active Filters Tags -->
      <Transition name="fade">
        <div
          v-if="searchTerm || filterType || filterEtape || filterCount"
          class="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-700/50"
        >
          <span class="text-sm text-gray-500">{{
            t('archimonstres.monstersGrid.filters.activeFilters')
          }}</span>

          <span
            v-if="searchTerm"
            class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-300 text-sm rounded-full border border-blue-500/20"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            "{{ searchTerm }}"
            <button @click="searchTerm = ''" class="ml-1 hover:text-blue-100">
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>

          <span
            v-if="filterType"
            class="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-300 text-sm rounded-full border border-purple-500/20"
          >
            {{ filterType }}
            <button
              @click="filterType = ''"
              class="ml-1 hover:text-purple-100"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>

          <span
            v-if="filterEtape"
            class="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-300 text-sm rounded-full border border-orange-500/20"
          >
            {{ t('archimonstres.monstersGrid.filters.etape', { number: filterEtape }) }}
            <button
              @click="filterEtape = ''"
              class="ml-1 hover:text-orange-100"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>

          <span
            v-if="filterCount"
            class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-300 text-sm rounded-full border border-emerald-500/20"
          >
            {{ getCountFilterLabel(filterCount) }}
            <button
              @click="filterCount = ''"
              class="ml-1 hover:text-emerald-100"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>

          <button
            @click="clearAllFilters"
            class="text-sm text-gray-400 hover:text-red-400 transition-colors ml-2"
          >
            {{ t('archimonstres.monstersGrid.filters.clearAll') }}
          </button>
        </div>
      </Transition>
    </div>

    <!-- Monsters Grid -->
    <TransitionGroup
      v-if="displayedMonsters.length > 0"
      name="grid"
      tag="div"
      class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <MonsterCard
        v-for="(monster, index) in displayedMonsters"
        :key="monster.id"
        :monster="monster"
        :mode="mode"
        :server="server"
        :character="character"
        :style="{ animationDelay: `${(index % itemsPerPage) * 30}ms` }"
        class="animate-fade-in-up"
      />
    </TransitionGroup>

    <!-- Loading Spinner -->
    <Transition name="fade">
      <div
        v-if="isLoading && displayedMonsters.length > 0"
        class="flex justify-center py-8"
      >
        <div class="flex items-center gap-3 text-blue-400">
          <div class="relative">
            <div
              class="w-8 h-8 border-2 border-blue-400/30 rounded-full"
            ></div>
            <div
              class="absolute inset-0 w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"
            ></div>
          </div>
          <span class="font-medium">{{
            t('archimonstres.monstersGrid.loadingMore')
          }}</span>
        </div>
      </div>
    </Transition>

    <!-- Load More Trigger -->
    <div
      v-if="hasMoreToLoad && !isLoading"
      ref="loadMoreTrigger"
      class="flex items-center justify-center py-8"
    >
      <button
        @click="loadMore"
        class="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-medium rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300"
      >
        <svg
          class="w-5 h-5 group-hover:translate-y-0.5 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
        {{ t('archimonstres.monstersGrid.loadMoreButton') }}
      </button>
    </div>

    <!-- No Results -->
    <Transition name="fade">
      <div v-if="filteredMonsters.length === 0" class="text-center py-16">
        <div
          class="w-24 h-24 bg-gray-800/60 rounded-2xl flex items-center justify-center mx-auto mb-6"
        >
          <svg
            class="w-12 h-12 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-300 mb-2">
          {{ t('archimonstres.monstersGrid.noResults.title') }}
        </h3>
        <p class="text-gray-500 mb-6">
          {{ t('archimonstres.monstersGrid.noResults.description') }}
        </p>
        <button
          @click="clearAllFilters"
          class="px-5 py-2.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-medium rounded-xl border border-gray-600/50 hover:border-gray-500 transition-all duration-300"
        >
          {{ t('archimonstres.monstersGrid.noResults.clearButton') }}
        </button>
      </div>
    </Transition>

    <!-- All Loaded Message -->
    <Transition name="fade">
      <div
        v-if="
          displayedMonsters.length === filteredMonsters.length &&
          displayedMonsters.length > itemsPerPage
        "
        class="text-center py-8"
      >
        <div
          class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span class="font-medium">{{
            t('archimonstres.monstersGrid.allLoaded', {
              count: filteredMonsters.length,
            })
          }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import MonsterCard from './MonsterCard.vue';

const { t } = useI18n();

const props = defineProps({
  monsters: {
    type: Array,
    required: true,
  },
  mode: {
    type: String,
    default: null,
  },
  server: {
    type: Object,
    default: null,
  },
  character: {
    type: Object,
    default: null,
  },
});

const itemsPerPage = 20;
const currentPage = ref(1);
const isLoading = ref(false);
const loadMoreTrigger = ref(null);

const searchTerm = ref('');
const filterType = ref('');
const filterEtape = ref('');
const filterCount = ref('');

const getMonsterCount = (monster) => {
  if (!props.server || !props.character || !monster) return 0;
  const key = `monster_count_${props.server.id}_${props.character.id}_${monster.id}`;
  const saved = localStorage.getItem(key);
  return saved ? parseInt(saved, 10) : 0;
};

const getCountFilterLabel = (filterValue) => {
  switch (filterValue) {
    case '0':
      return t('archimonstres.monstersGrid.filters.countLabels.missing');
    case '1':
      return t('archimonstres.monstersGrid.filters.countLabels.haveOne');
    case '2+':
      return t('archimonstres.monstersGrid.filters.countLabels.haveMultiple');
    default:
      return t('archimonstres.monstersGrid.filters.allCounts');
  }
};

const clearAllFilters = () => {
  searchTerm.value = '';
  filterType.value = '';
  filterEtape.value = '';
  filterCount.value = '';
};

const availableEtapes = computed(() => {
  if (!props.monsters || props.monsters.length === 0) return [];
  const etapes = [
    ...new Set(props.monsters.map((monster) => monster.etape).filter(Boolean)),
  ];
  return etapes.sort((a, b) => parseInt(a) - parseInt(b));
});

const countStats = computed(() => {
  if (!props.monsters || props.mode !== 'dofus-ocre') {
    return { zero: 0, one: 0, multiple: 0 };
  }

  const stats = { zero: 0, one: 0, multiple: 0 };

  props.monsters.forEach((monster) => {
    const count = getMonsterCount(monster);
    if (count === 0) stats.zero++;
    else if (count === 1) stats.one++;
    else stats.multiple++;
  });

  return stats;
});

const filteredMonsters = computed(() => {
  let filtered = props.monsters || [];

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter((monster) => {
      return (
        (monster.nom && monster.nom.toLowerCase().includes(term)) ||
        (monster.nom_normal &&
          monster.nom_normal.toLowerCase().includes(term)) ||
        (monster.zone && monster.zone.toLowerCase().includes(term)) ||
        (monster.souszone && monster.souszone.toLowerCase().includes(term))
      );
    });
  }

  if (filterType.value) {
    filtered = filtered.filter((monster) => monster.type === filterType.value);
  }

  if (filterEtape.value) {
    filtered = filtered.filter(
      (monster) => monster.etape === filterEtape.value
    );
  }

  if (props.mode === 'dofus-ocre' && filterCount.value) {
    filtered = filtered.filter((monster) => {
      const count = getMonsterCount(monster);
      switch (filterCount.value) {
        case '0':
          return count === 0;
        case '1':
          return count === 1;
        case '2+':
          return count >= 2;
        default:
          return true;
      }
    });
  }

  return filtered;
});

const displayedMonsters = computed(() => {
  const endIndex = currentPage.value * itemsPerPage;
  return filteredMonsters.value.slice(0, endIndex);
});

const hasMoreToLoad = computed(() => {
  return displayedMonsters.value.length < filteredMonsters.value.length;
});

const loadMore = async () => {
  if (isLoading.value || !hasMoreToLoad.value) return;

  isLoading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 300));
  currentPage.value += 1;
  isLoading.value = false;
};

const resetPagination = () => {
  currentPage.value = 1;
};

watch([searchTerm, filterType, filterEtape, filterCount], resetPagination, {
  deep: true,
});

let observer = null;

const setupIntersectionObserver = () => {
  if (typeof window === 'undefined') return;

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isLoading.value && hasMoreToLoad.value) {
        loadMore();
      }
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    }
  );
};

onMounted(() => {
  setupIntersectionObserver();
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

watch(
  loadMoreTrigger,
  (newTrigger, oldTrigger) => {
    if (observer && oldTrigger) {
      observer.unobserve(oldTrigger);
    }
    if (observer && newTrigger) {
      observer.observe(newTrigger);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Animations */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.4s ease-out forwards;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Grid transitions */
.grid-enter-active,
.grid-leave-active {
  transition: all 0.4s ease;
}

.grid-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.grid-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.grid-move {
  transition: transform 0.4s ease;
}
</style>