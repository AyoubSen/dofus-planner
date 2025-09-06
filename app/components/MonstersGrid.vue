<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-100">
          Monsters ({{ filteredMonsters.length }})
        </h2>
        <p class="text-sm text-gray-400">
          Showing {{ displayedMonsters.length }} of
          {{ filteredMonsters.length }} | Search: "{{ searchTerm }}" | Type:
          {{ filterType || "All" }} | Étape: {{ filterEtape || "All" }}
          {{
            mode === "dofus-ocre" && filterCount
              ? " | Count: " + getCountFilterLabel(filterCount)
              : ""
          }}
        </p>
      </div>
      <div class="flex gap-2">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search monsters..."
          class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          v-model="filterType"
          class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Types</option>
          <option value="archimonstre">Archimonstres</option>
          <option value="monstre">Monstres</option>
        </select>
        <select
          v-model="filterEtape"
          class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Étapes</option>
          <option v-for="etape in availableEtapes" :key="etape" :value="etape">
            {{ etape }}
          </option>
        </select>
        <!-- Count Filter (only for dofus-ocre mode) -->
        <select
          v-if="mode === 'dofus-ocre'"
          v-model="filterCount"
          class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Counts</option>
          <option value="0">Have 0 ({{ countStats.zero }})</option>
          <option value="1">Have 1 ({{ countStats.one }})</option>
          <option value="2+">Have 2+ ({{ countStats.multiple }})</option>
        </select>
      </div>
    </div>

    <!-- Monsters Grid -->
    <div
      v-if="displayedMonsters.length > 0"
      class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <MonsterCard
        v-for="monster in displayedMonsters"
        :key="monster.id"
        :monster="monster"
        :mode="mode"
        :server="server"
        :character="character"
      />
    </div>

    <!-- Loading Spinner -->
    <div
      v-if="isLoading && displayedMonsters.length > 0"
      class="flex justify-center py-8"
    >
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
      ></div>
    </div>

    <!-- Load More Trigger (Intersection Observer target) -->
    <div
      v-if="hasMoreToLoad && !isLoading"
      ref="loadMoreTrigger"
      class="h-20 flex items-center justify-center"
    >
      <button
        @click="loadMore"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Load More
      </button>
    </div>

    <!-- No Results -->
    <div v-else-if="filteredMonsters.length === 0" class="text-center py-12">
      <p class="text-gray-400 text-lg">
        No monsters found matching your criteria.
      </p>
    </div>

    <!-- All Loaded Message -->
    <div
      v-else-if="
        displayedMonsters.length === filteredMonsters.length &&
        displayedMonsters.length > itemsPerPage
      "
      class="text-center py-8"
    >
      <p class="text-gray-400">All monsters loaded!</p>
    </div>
  </div>
</template>

<script setup>
import MonsterCard from "./MonsterCard.vue";

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

const searchTerm = ref("");
const filterType = ref("");
const filterEtape = ref("");
const filterCount = ref("");

const getMonsterCount = (monster) => {
  if (!props.server || !props.character || !monster) return 0;
  const key = `monster_count_${props.server.id}_${props.character.id}_${monster.id}`;
  const saved = localStorage.getItem(key);
  return saved ? parseInt(saved, 10) : 0;
};

const getCountFilterLabel = (filterValue) => {
  switch (filterValue) {
    case "0":
      return "Have 0";
    case "1":
      return "Have 1";
    case "2+":
      return "Have 2+";
    default:
      return "All";
  }
};

const availableEtapes = computed(() => {
  if (!props.monsters || props.monsters.length === 0) return [];
  const etapes = [
    ...new Set(props.monsters.map((monster) => monster.etape).filter(Boolean)),
  ];
  return etapes.sort((a, b) => parseInt(a) - parseInt(b));
});

const countStats = computed(() => {
  if (!props.monsters || props.mode !== "dofus-ocre") {
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

  if (props.mode === "dofus-ocre" && filterCount.value) {
    filtered = filtered.filter((monster) => {
      const count = getMonsterCount(monster);
      switch (filterCount.value) {
        case "0":
          return count === 0;
        case "1":
          return count === 1;
        case "2+":
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
  if (typeof window === "undefined") return;

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isLoading.value && hasMoreToLoad.value) {
        loadMore();
      }
    },
    {
      root: null,
      rootMargin: "100px",
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
  (newTrigger) => {
    if (observer && newTrigger) {
      observer.observe(newTrigger);
    }
  },
  { immediate: true }
);

watch(loadMoreTrigger, (newTrigger, oldTrigger) => {
  if (observer && oldTrigger) {
    observer.unobserve(oldTrigger);
  }
  if (observer && newTrigger) {
    observer.observe(newTrigger);
  }
});
</script>
