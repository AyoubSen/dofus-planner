<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto p-8">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-8">
        <NuxtLink
          to="/"
          class="text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← Back to Home
        </NuxtLink>
        <h1 class="text-4xl font-bold text-gray-100">
          Statistiques d'Équipements
        </h1>
      </div>

      <div class="flex gap-8">
        <!-- Filters Sidebar -->
        <div class="w-80 bg-gray-800 rounded-lg p-6 h-fit">
          <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
            <span class="bg-pink-500 p-1 rounded text-sm">📊</span>
            FILTRES
          </h2>

          <!-- Element Filter -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold mb-3 text-red-400">ÉLÉMENT</h3>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="radio"
                  value=""
                  v-model="filters.element"
                  @change="applyFilters"
                  class="mr-2"
                />
                <span>Tous les éléments</span>
              </label>
              <label
                v-for="element in elements"
                :key="element.name"
                class="flex items-center"
              >
                <input
                  type="radio"
                  :value="element.name"
                  v-model="filters.element"
                  @change="applyFilters"
                  class="mr-2"
                />
                <span class="flex items-center gap-2">
                  <span>{{ element.icon }}</span>
                  {{ element.label }}
                </span>
              </label>
            </div>
          </div>

          <!-- Mode Filter -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold mb-3 text-red-400">MODE</h3>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="radio"
                  value=""
                  v-model="filters.mode"
                  @change="applyFilters"
                  class="mr-2"
                />
                <span>Tous les modes</span>
              </label>
              <label
                v-for="mode in modes"
                :key="mode"
                class="flex items-center"
              >
                <input
                  type="radio"
                  :value="mode"
                  v-model="filters.mode"
                  @change="applyFilters"
                  class="mr-2"
                />
                <span class="uppercase">{{ mode }}</span>
              </label>
            </div>
          </div>

          <!-- Class Filter -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold mb-3 text-red-400">CLASSE</h3>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="radio"
                  value=""
                  v-model="filters.classe"
                  @change="applyFilters"
                  class="mr-2"
                />
                <span>Toutes les classes</span>
              </label>
              <label
                v-for="classe in classes"
                :key="classe.name"
                class="flex items-center"
              >
                <input
                  type="radio"
                  :value="classe.name"
                  v-model="filters.classe"
                  @change="applyFilters"
                  class="mr-2"
                />
                <span class="flex items-center gap-2">
                  <img
                    :src="classe.icon"
                    :alt="classe.name"
                    class="w-4 h-4 rounded"
                    @error="handleImageError"
                  />
                  {{
                    classe.name.charAt(0).toUpperCase() + classe.name.slice(1)
                  }}
                </span>
              </label>
            </div>
          </div>

          <!-- Level Filter -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold mb-3 text-red-400">NIVEAU</h3>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="radio"
                  value=""
                  v-model="filters.level"
                  @change="applyFilters"
                  class="mr-2"
                />
                <span>Tous niveaux</span>
              </label>
              <label
                v-for="level in levels"
                :key="level"
                class="flex items-center"
              >
                <input
                  type="radio"
                  :value="level"
                  v-model="filters.level"
                  @change="applyFilters"
                  class="mr-2"
                />
                <span>{{ level }}</span>
              </label>
            </div>
          </div>

          <!-- Budget Filter -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold mb-3 text-red-400">BUDGET</h3>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="radio"
                  value=""
                  v-model="filters.budget"
                  @change="applyFilters"
                  class="mr-2"
                />
                <span>Tous budgets</span>
              </label>
              <label
                v-for="budget in budgets"
                :key="budget"
                class="flex items-center"
              >
                <input
                  type="radio"
                  :value="budget"
                  v-model="filters.budget"
                  @change="applyFilters"
                  class="mr-2"
                />
                <span class="capitalize">{{ budget }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Statistics Content -->
        <div class="flex-1">
          <!-- Loading State -->
          <div v-if="isLoading" class="flex justify-center items-center h-64">
            <div
              class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"
            ></div>
          </div>

          <!-- Statistics Content -->
          <div v-else class="space-y-8">
            <!-- Summary Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="bg-gray-800 rounded-lg p-6 text-center">
                <div class="text-3xl font-bold text-blue-400">
                  {{ totalEquipments }}
                </div>
                <div class="text-gray-400">Total Équipements</div>
              </div>
              <div class="bg-gray-800 rounded-lg p-6 text-center">
                <div class="text-3xl font-bold text-green-400">
                  {{ uniqueItems }}
                </div>
                <div class="text-gray-400">Objets Uniques</div>
              </div>
              <div class="bg-gray-800 rounded-lg p-6 text-center">
                <div class="text-3xl font-bold text-purple-400">
                  {{ mostPopularSlot?.slot || "N/A" }}
                </div>
                <div class="text-gray-400">Slot le Plus Varié</div>
              </div>
              <div class="bg-gray-800 rounded-lg p-6 text-center">
                <div class="text-3xl font-bold text-yellow-400">
                  {{ averageItemsPerSet.toFixed(1) }}
                </div>
                <div class="text-gray-400">Objets/Set Moyen</div>
              </div>
            </div>

            <!-- Equipment Slot Tabs -->
            <div class="bg-gray-800 rounded-lg">
              <div class="flex flex-wrap border-b border-gray-700">
                <button
                  v-for="slot in equipmentSlots"
                  :key="slot.key"
                  @click="activeSlot = slot.key"
                  :class="[
                    'px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2',
                    activeSlot === slot.key
                      ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700',
                  ]"
                >
                  <span>{{ slot.icon }}</span>
                  {{ slot.name }}
                  <span class="bg-gray-600 px-2 py-1 rounded text-xs">
                    {{ getSlotStats(slot.key)?.totalItems || 0 }}
                  </span>
                </button>
              </div>

              <!-- Slot Statistics -->
              <div class="p-6">
                <div v-if="getSlotStats(activeSlot)" class="space-y-6">
                  <!-- Top Items for Selected Slot -->
                  <div>
                    <h3 class="text-xl font-bold mb-4">
                      Top
                      {{
                        equipmentSlots.find((s) => s.key === activeSlot)?.name
                      }}
                      les plus utilisés
                    </h3>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div
                        v-for="(item, index) in getSlotStats(
                          activeSlot
                        ).topItems.slice(0, 10)"
                        :key="item.name"
                        class="bg-gray-700 rounded-lg p-4 flex items-center gap-4"
                      >
                        <div class="flex-shrink-0">
                          <div
                            class="w-12 h-12 bg-gray-600 rounded border-2 border-gray-500 p-1"
                          >
                            <img
                              v-if="item.image_url"
                              :src="item.image_url"
                              :alt="item.name"
                              class="w-full h-full object-cover rounded"
                              @error="handleImageError"
                            />
                            <div
                              v-else
                              class="w-full h-full bg-gray-500 rounded"
                            ></div>
                          </div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="font-medium text-white truncate">
                            {{ item.name }}
                          </div>
                          <div class="text-sm text-gray-400">
                            Utilisé {{ item.count }} fois ({{
                              ((item.count / totalEquipments) * 100).toFixed(1)
                            }}%)
                          </div>
                        </div>
                        <div class="flex-shrink-0">
                          <span class="text-lg font-bold text-blue-400"
                            >#{{ index + 1 }}</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Usage Distribution Chart (Text-based) -->
                  <div>
                    <h3 class="text-xl font-bold mb-4">
                      Distribution d'utilisation
                    </h3>
                    <div class="space-y-2">
                      <div
                        v-for="item in getSlotStats(activeSlot).topItems.slice(
                          0,
                          5
                        )"
                        :key="item.name"
                        class="flex items-center gap-4"
                      >
                        <div class="w-24 text-sm text-gray-400 truncate">
                          {{ item.name }}
                        </div>
                        <div
                          class="flex-1 bg-gray-700 rounded-full h-4 relative"
                        >
                          <div
                            class="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                            :style="{
                              width: `${
                                (item.count /
                                  getSlotStats(activeSlot).topItems[0].count) *
                                100
                              }%`,
                            }"
                          ></div>
                        </div>
                        <div class="w-16 text-sm text-white text-right">
                          {{ item.count }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-8 text-gray-400">
                  Aucune donnée disponible pour ce slot
                </div>
              </div>
            </div>

            <!-- Cross-Slot Analysis -->
            <div class="bg-gray-800 rounded-lg p-6">
              <h3 class="text-xl font-bold mb-4">Analyse Globale</h3>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Most Diverse Slots -->
                <div>
                  <h4 class="text-lg font-semibold mb-3 text-blue-400">
                    Slots les plus variés
                  </h4>
                  <div class="space-y-2">
                    <div
                      v-for="slot in sortedSlotsByDiversity.slice(0, 5)"
                      :key="slot.key"
                      class="flex justify-between items-center p-3 bg-gray-700 rounded"
                    >
                      <span class="flex items-center gap-2">
                        <span>{{ slot.icon }}</span>
                        {{ slot.name }}
                      </span>
                      <span class="text-blue-400 font-medium"
                        >{{ slot.uniqueItems }} objets</span
                      >
                    </div>
                  </div>
                </div>

                <!-- Most Standardized Slots -->
                <div>
                  <h4 class="text-lg font-semibold mb-3 text-green-400">
                    Slots les plus standardisés
                  </h4>
                  <div class="space-y-2">
                    <div
                      v-for="slot in sortedSlotsByStandardization.slice(0, 5)"
                      :key="slot.key"
                      class="flex justify-between items-center p-3 bg-gray-700 rounded"
                    >
                      <span class="flex items-center gap-2">
                        <span>{{ slot.icon }}</span>
                        {{ slot.name }}
                      </span>
                      <span class="text-green-400 font-medium"
                        >{{ slot.topItemPercentage }}%</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Data
const statistics = ref(null);
const isLoading = ref(false);
const activeSlot = ref("ar"); // Default to weapon

// Equipment slots configuration
const equipmentSlots = [
  { key: "ar", name: "Arme", icon: "⚔️" },
  { key: "ch", name: "Chapeau", icon: "🎩" },
  { key: "ca", name: "Cape", icon: "🦸" },
  { key: "am", name: "Amulette", icon: "📿" },
  { key: "br", name: "Bouclier", icon: "🛡️" },
  { key: "ce", name: "Ceinture", icon: "👑" },
  { key: "bo", name: "Bottes", icon: "👢" },
  { key: "a1", name: "Anneau 1", icon: "💍" },
  { key: "a2", name: "Anneau 2", icon: "💍" },
  { key: "fa", name: "Familier", icon: "🐾" },
  { key: "d1", name: "Dofus 1", icon: "🥚" },
  { key: "d2", name: "Dofus 2", icon: "🥚" },
  { key: "d3", name: "Dofus 3", icon: "🥚" },
  { key: "d4", name: "Dofus 4", icon: "🥚" },
  { key: "d5", name: "Dofus 5", icon: "🥚" },
  { key: "d6", name: "Dofus 6", icon: "🥚" },
];

// Filter options
const elements = [
  { name: "eau", label: "Eau", icon: "💧" },
  { name: "feu", label: "Feu", icon: "🔥" },
  { name: "terre", label: "Terre", icon: "🌱" },
  { name: "air", label: "Air", icon: "💨" },
  { name: "neutre", label: "Neutre", icon: "⚪" },
];

const modes = ["pvm", "pvp"];
const classes = [
  { name: "iop", icon: "/iop.webp" },
  { name: "cra", icon: "/cra.webp" },
  { name: "sacrieur", icon: "/sacrieur.webp" },
  { name: "eniripsa", icon: "/eniripsa.webp" },
  { name: "sram", icon: "/sram.webp" },
  { name: "ouginak", icon: "/ouginak.webp" },
  { name: "forgelance", icon: "/forgelance.webp" },
  { name: "osamodas", icon: "/osamodas.webp" },
  { name: "enutrof", icon: "/enutrof.webp" },
  { name: "ecaflip", icon: "/ecaflip.webp" },
  { name: "steamer", icon: "/steamer.webp" },
  { name: "feca", icon: "/feca.webp" },
  { name: "huppermage", icon: "/huppermage.webp" },
  { name: "zobal", icon: "/zobal.webp" },
  { name: "pandawa", icon: "/pandawa.webp" },
  { name: "eliotrope", icon: "/eliotrope.webp" },
  { name: "sadida", icon: "/sadida.webp" },
  { name: "roublard", icon: "/roublard.webp" },
  { name: "xelor", icon: "/xelor.webp" },
];
const levels = [
  "20",
  "40",
  "60",
  "80",
  "110",
  "130",
  "160",
  "180",
  "199",
  "200",
];
const budgets = ["low", "moyen", "gros"];

const filters = ref({
  element: "",
  mode: "",
  classe: "",
  level: "",
  budget: "",
});

const totalEquipments = computed(() => {
  return statistics.value?.totalEquipments || 0;
});

const uniqueItems = computed(() => {
  if (!statistics.value?.slotStats) return 0;
  const allItems = new Set();
  Object.values(statistics.value.slotStats).forEach((slot) => {
    Object.keys(slot.items).forEach((itemName) => allItems.add(itemName));
  });
  return allItems.size;
});

const mostPopularSlot = computed(() => {
  if (!statistics.value?.slotStats) return null;
  let maxItems = 0;
  let mostPopular = null;

  Object.entries(statistics.value.slotStats).forEach(([slotKey, slotData]) => {
    const uniqueItemsCount = Object.keys(slotData.items).length;
    if (uniqueItemsCount > maxItems) {
      maxItems = uniqueItemsCount;
      mostPopular = {
        slot: equipmentSlots.find((s) => s.key === slotKey)?.name || slotKey,
        count: uniqueItemsCount,
      };
    }
  });

  return mostPopular;
});

const averageItemsPerSet = computed(() => {
  if (!statistics.value?.slotStats || totalEquipments.value === 0) return 0;

  const totalItemsUsed = Object.values(statistics.value.slotStats).reduce(
    (total, slot) => {
      return (
        total + Object.values(slot.items).reduce((sum, count) => sum + count, 0)
      );
    },
    0
  );

  return totalItemsUsed / totalEquipments.value;
});

const sortedSlotsByDiversity = computed(() => {
  if (!statistics.value?.slotStats) return [];

  return equipmentSlots
    .map((slot) => ({
      ...slot,
      uniqueItems: statistics.value.slotStats[slot.key]
        ? Object.keys(statistics.value.slotStats[slot.key].items).length
        : 0,
    }))
    .sort((a, b) => b.uniqueItems - a.uniqueItems);
});

const sortedSlotsByStandardization = computed(() => {
  if (!statistics.value?.slotStats) return [];

  return equipmentSlots
    .map((slot) => {
      const slotData = statistics.value.slotStats[slot.key];
      if (!slotData) return { ...slot, topItemPercentage: 0 };

      const items = Object.values(slotData.items);
      const maxCount = Math.max(...items);
      const totalCount = items.reduce((sum, count) => sum + count, 0);
      const topItemPercentage =
        totalCount > 0 ? Math.round((maxCount / totalCount) * 100) : 0;

      return { ...slot, topItemPercentage };
    })
    .sort((a, b) => b.topItemPercentage - a.topItemPercentage);
});

const getSlotStats = (slotKey) => {
  if (!statistics.value?.slotStats?.[slotKey]) return null;

  const slotData = statistics.value.slotStats[slotKey];
  const topItems = Object.entries(slotData.items)
    .map(([name, count]) => ({
      name,
      count,
      image_url: slotData.itemDetails[name]?.image_url || null,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    topItems,
    totalItems: Object.keys(slotData.items).length,
    totalUsage: Object.values(slotData.items).reduce(
      (sum, count) => sum + count,
      0
    ),
  };
};

const applyFilters = async () => {
  await fetchStatistics();
};

const buildQueryString = () => {
  const params = new URLSearchParams();

  if (filters.value.element) {
    params.append("where[tags][in][0]", filters.value.element);
  }

  if (filters.value.mode) {
    params.append("where[mode][equals]", filters.value.mode);
  }

  if (filters.value.classe) {
    params.append("where[classe][equals]", filters.value.classe);
  }

  if (filters.value.level) {
    params.append("where[level][equals]", filters.value.level);
  }

  if (filters.value.budget) {
    params.append("where[budget][equals]", filters.value.budget);
  }

  params.append("limit", "1000");

  return params.toString();
};

const fetchStatistics = async () => {
  isLoading.value = true;
  try {
    const queryString = buildQueryString();
    const url = `/api/items/items${queryString ? "?" + queryString : ""}`;
    const response = await $fetch(url);

    processStatistics(response.docs || []);
  } catch (error) {
    console.error("Error fetching statistics:", error);
  } finally {
    isLoading.value = false;
  }
};

const processStatistics = (equipments) => {
  const slotStats = {};
  let totalEquipments = equipments.length;

  equipmentSlots.forEach((slot) => {
    slotStats[slot.key] = {
      items: {},
      itemDetails: {},
    };
  });

  equipments.forEach((equipment) => {
    if (equipment.items) {
      Object.entries(equipment.items).forEach(([slotKey, item]) => {
        if (item && item.name) {
          if (!slotStats[slotKey].items[item.name]) {
            slotStats[slotKey].items[item.name] = 0;
            slotStats[slotKey].itemDetails[item.name] = {
              image_url: item.image_url,
            };
          }
          slotStats[slotKey].items[item.name]++;
        }
      });
    }
  });

  statistics.value = {
    slotStats,
    totalEquipments,
  };
};

const handleImageError = (event) => {
  event.target.style.display = "none";
};

onMounted(() => {
  fetchStatistics();
});
</script>

<style scoped>
.hover\:bg-gray-750:hover {
  background-color: rgb(55, 65, 81);
}
</style>
