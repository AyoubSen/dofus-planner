<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
  >
    <div class="max-w-7xl mx-auto px-8 py-12">
      <!-- Header -->
      <div class="mb-12">
        <div class="flex items-center gap-6 mb-6">
          <NuxtLink
            to="/"
            class="group flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-all duration-200 text-lg"
          >
            <svg
              class="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </NuxtLink>
        </div>

        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <svg
              class="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h1
              class="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
            >
              Equipment Statistics
            </h1>
            <p class="text-gray-400 text-lg mt-1">
              Analyze equipment usage patterns and meta trends
            </p>
          </div>
        </div>
      </div>

      <div class="flex gap-8">
        <!-- Filters Sidebar -->
        <!-- Filters Sidebar -->
        <div
          class="w-80 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 h-fit shadow-2xl"
        >
          <div class="flex items-center gap-3 mb-6">
            <div
              class="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-gray-100">FILTERS</h2>
          </div>

          <!-- Element Filter -->
          <div class="mb-6">
            <h3
              class="text-sm font-semibold mb-3 text-orange-400 uppercase tracking-wide"
            >
              Elements
            </h3>
            <div class="space-y-3">
              <!-- All Elements Option -->
              <label
                class="flex items-center p-2 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <input
                  type="radio"
                  value=""
                  v-model="filters.element"
                  @change="applyFilters"
                  class="mr-3 text-blue-500 focus:ring-blue-500 focus:ring-2"
                />
                <span class="text-gray-300">All Elements</span>
              </label>

              <!-- Element Grid -->
              <div class="grid grid-cols-3 gap-2">
                <label
                  v-for="element in elements"
                  :key="element.name"
                  class="group cursor-pointer"
                >
                  <input
                    type="radio"
                    :value="element.name"
                    v-model="filters.element"
                    @change="applyFilters"
                    class="sr-only"
                  />
                  <div
                    :class="[
                      'w-full h-12 bg-gray-700/50 rounded-lg border-2 p-2 transition-all duration-200 flex flex-col items-center justify-center',
                      'group-hover:border-gray-400/70 group-hover:bg-gray-600/50',
                      filters.element === element.name
                        ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                        : 'border-gray-600/50',
                    ]"
                  >
                    <img
                      :src="element.icon"
                      :alt="element.label"
                      class="w-6 h-6 object-contain"
                      @error="handleImageError"
                      loading="lazy"
                    />
                    <span class="text-xs text-gray-300 font-medium">{{
                      element.label
                    }}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Mode Filter -->
          <div class="mb-6">
            <h3
              class="text-sm font-semibold mb-3 text-orange-400 uppercase tracking-wide"
            >
              Mode
            </h3>
            <div class="space-y-3">
              <!-- All Modes Option -->
              <label
                class="flex items-center p-2 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <input
                  type="radio"
                  value=""
                  v-model="filters.mode"
                  @change="applyFilters"
                  class="mr-3 text-blue-500 focus:ring-blue-500 focus:ring-2"
                />
                <span class="text-gray-300">All Modes</span>
              </label>

              <!-- Mode Grid -->
              <div class="grid grid-cols-2 gap-2">
                <label
                  v-for="mode in modes"
                  :key="mode"
                  class="group cursor-pointer"
                >
                  <input
                    type="radio"
                    :value="mode"
                    v-model="filters.mode"
                    @change="applyFilters"
                    class="sr-only"
                  />
                  <div
                    :class="[
                      'w-full h-12 bg-gray-700/50 rounded-lg border-2 p-2 transition-all duration-200 flex items-center justify-center',
                      'group-hover:border-gray-400/70 group-hover:bg-gray-600/50',
                      filters.mode === mode
                        ? 'border-green-400 bg-green-500/20 shadow-lg shadow-green-500/25'
                        : 'border-gray-600/50',
                    ]"
                  >
                    <span class="uppercase text-gray-300 font-bold text-sm">{{
                      mode
                    }}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Class Filter -->
          <div class="mb-6">
            <h3
              class="text-sm font-semibold mb-3 text-orange-400 uppercase tracking-wide"
            >
              Classes
            </h3>
            <div class="space-y-3">
              <!-- All Classes Option -->
              <label
                class="flex items-center p-2 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <input
                  type="radio"
                  value=""
                  v-model="filters.classe"
                  @change="applyFilters"
                  class="mr-3 text-blue-500 focus:ring-blue-500 focus:ring-2"
                />
                <span class="text-gray-300">All Classes</span>
              </label>

              <!-- Class Grid -->
              <div
                class="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto custom-scrollbar"
              >
                <label
                  v-for="classe in classes"
                  :key="classe.name"
                  class="group cursor-pointer"
                >
                  <input
                    type="radio"
                    :value="classe.name"
                    v-model="filters.classe"
                    @change="applyFilters"
                    class="sr-only"
                  />
                  <div
                    :class="[
                      'w-12 h-12 bg-gray-700/50 rounded-lg border-2 p-1 transition-all duration-200 overflow-hidden',
                      'group-hover:border-gray-400/70 group-hover:bg-gray-600/50',
                      filters.classe === classe.name
                        ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                        : 'border-gray-600/50',
                    ]"
                  >
                    <img
                      :src="classe.icon"
                      :alt="classe.name"
                      :title="
                        classe.name.charAt(0).toUpperCase() +
                        classe.name.slice(1)
                      "
                      class="w-full h-full object-cover object-top rounded"
                      @error="handleImageError"
                      loading="lazy"
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Level Filter -->
          <div class="mb-6">
            <h3
              class="text-sm font-semibold mb-3 text-orange-400 uppercase tracking-wide"
            >
              Level
            </h3>
            <div class="space-y-3">
              <!-- All Levels Option -->
              <label
                class="flex items-center p-2 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <input
                  type="radio"
                  value=""
                  v-model="filters.level"
                  @change="applyFilters"
                  class="mr-3 text-blue-500 focus:ring-blue-500 focus:ring-2"
                />
                <span class="text-gray-300">All Levels</span>
              </label>

              <!-- Level Grid -->
              <div class="grid grid-cols-5 gap-2">
                <label
                  v-for="level in levels"
                  :key="level"
                  class="group cursor-pointer"
                >
                  <input
                    type="radio"
                    :value="level"
                    v-model="filters.level"
                    @change="applyFilters"
                    class="sr-only"
                  />
                  <div
                    :class="[
                      'w-full h-10 bg-gray-700/50 rounded-lg border-2 p-1 transition-all duration-200 flex items-center justify-center',
                      'group-hover:border-gray-400/70 group-hover:bg-gray-600/50',
                      filters.level === level
                        ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/25'
                        : 'border-gray-600/50',
                    ]"
                  >
                    <span class="text-gray-300 font-bold text-sm">{{
                      level
                    }}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Budget Filter -->
          <div class="mb-6">
            <h3
              class="text-sm font-semibold mb-3 text-orange-400 uppercase tracking-wide"
            >
              Budget
            </h3>
            <div class="space-y-3">
              <!-- All Budgets Option -->
              <label
                class="flex items-center p-2 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <input
                  type="radio"
                  value=""
                  v-model="filters.budget"
                  @change="applyFilters"
                  class="mr-3 text-blue-500 focus:ring-blue-500 focus:ring-2"
                />
                <span class="text-gray-300">All Budgets</span>
              </label>

              <!-- Budget Grid -->
              <div class="grid grid-cols-3 gap-2">
                <label
                  v-for="budget in budgets"
                  :key="budget"
                  class="group cursor-pointer"
                >
                  <input
                    type="radio"
                    :value="budget"
                    v-model="filters.budget"
                    @change="applyFilters"
                    class="sr-only"
                  />
                  <div
                    :class="[
                      'w-full h-10 bg-gray-700/50 rounded-lg border-2 p-1 transition-all duration-200 flex items-center justify-center',
                      'group-hover:border-gray-400/70 group-hover:bg-gray-600/50',
                      filters.budget === budget
                        ? 'border-yellow-400 bg-yellow-500/20 shadow-lg shadow-yellow-500/25'
                        : 'border-gray-600/50',
                    ]"
                  >
                    <span
                      class="capitalize text-gray-300 font-medium text-sm"
                      >{{ budget }}</span
                    >
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics Content -->
        <div class="flex-1">
          <!-- Loading State -->
          <div v-if="isLoading" class="flex justify-center items-center h-64">
            <div class="flex items-center gap-3 text-blue-400">
              <div
                class="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full"
              ></div>
              <span class="text-lg">Loading statistics...</span>
            </div>
          </div>

          <!-- Statistics Content -->
          <div v-else class="space-y-8">
            <!-- Summary Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div
                class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-center shadow-lg"
              >
                <div class="text-3xl font-bold text-blue-400 mb-2">
                  {{ totalEquipments }}
                </div>
                <div class="text-gray-400">Total Equipment</div>
              </div>
              <div
                class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-center shadow-lg"
              >
                <div class="text-3xl font-bold text-green-400 mb-2">
                  {{ uniqueItems }}
                </div>
                <div class="text-gray-400">Unique Items</div>
              </div>
              <div
                class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-center shadow-lg"
              >
                <div class="text-3xl font-bold text-purple-400 mb-2">
                  {{ mostPopularSlot?.slot || "N/A" }}
                </div>
                <div class="text-gray-400">Most Varied Slot</div>
              </div>
              <div
                class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-center shadow-lg"
              >
                <div class="text-3xl font-bold text-yellow-400 mb-2">
                  {{ averageItemsPerSet.toFixed(1) }}
                </div>
                <div class="text-gray-400">Avg Items/Set</div>
              </div>
            </div>

            <!-- Equipment Slot Tabs -->
            <div
              class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div
                class="flex flex-wrap border-b border-gray-700/50 bg-gray-800/30"
              >
                <button
                  v-for="slot in equipmentSlots"
                  :key="slot.key"
                  @click="activeSlot = slot.key"
                  :class="[
                    'px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 border-b-2',
                    activeSlot === slot.key
                      ? 'bg-blue-600/20 text-blue-300 border-blue-400 shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50 border-transparent',
                  ]"
                >
                  <span class="text-lg">{{ slot.icon }}</span>
                  {{ slot.name }}
                  <span
                    class="bg-gray-600/50 px-2 py-1 rounded-full text-xs border border-gray-500/50"
                  >
                    {{ getSlotStats(slot.key)?.totalItems || 0 }}
                  </span>
                </button>
              </div>

              <!-- Slot Statistics -->
              <div class="p-8">
                <div v-if="getSlotStats(activeSlot)" class="space-y-8">
                  <!-- Top Items for Selected Slot -->
                  <div>
                    <h3 class="text-2xl font-bold mb-6 text-gray-100">
                      Most Used
                      {{
                        equipmentSlots.find((s) => s.key === activeSlot)?.name
                      }}
                    </h3>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div
                        v-for="(item, index) in getSlotStats(
                          activeSlot
                        ).topItems.slice(0, 10)"
                        :key="item.name"
                        class="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-xl p-4 flex items-center gap-4 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200"
                      >
                        <div class="flex-shrink-0">
                          <div
                            class="w-12 h-12 bg-gray-600/50 rounded-lg border-2 border-gray-500/50 p-1"
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
                              class="w-full h-full bg-gray-500/50 rounded"
                            ></div>
                          </div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="font-medium text-white truncate">
                            {{ item.name }}
                          </div>
                          <div class="text-sm text-gray-400">
                            Used {{ item.count }} times ({{
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

                  <!-- Usage Distribution Chart -->
                  <div>
                    <h3 class="text-2xl font-bold mb-6 text-gray-100">
                      Usage Distribution
                    </h3>
                    <div class="space-y-3">
                      <div
                        v-for="item in getSlotStats(activeSlot).topItems.slice(
                          0,
                          5
                        )"
                        :key="item.name"
                        class="flex items-center gap-4"
                      >
                        <div
                          class="w-32 text-sm text-gray-300 truncate font-medium"
                        >
                          {{ item.name }}
                        </div>
                        <div
                          class="flex-1 bg-gray-700/50 rounded-full h-6 relative overflow-hidden"
                        >
                          <div
                            class="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
                            :style="{
                              width: `${
                                (item.count /
                                  getSlotStats(activeSlot).topItems[0].count) *
                                100
                              }%`,
                            }"
                          ></div>
                        </div>
                        <div
                          class="w-16 text-sm text-white text-right font-medium"
                        >
                          {{ item.count }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-12 text-gray-400">
                  <svg
                    class="w-16 h-16 mx-auto mb-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p class="text-lg">No data available for this slot</p>
                </div>
              </div>
            </div>

            <!-- Cross-Slot Analysis -->
            <div
              class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl"
            >
              <h3 class="text-2xl font-bold mb-6 text-gray-100">
                Global Analysis
              </h3>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Most Diverse Slots -->
                <div>
                  <h4
                    class="text-lg font-semibold mb-4 text-blue-400 flex items-center gap-2"
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
                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                      />
                    </svg>
                    Most Diverse Slots
                  </h4>
                  <div class="space-y-3">
                    <div
                      v-for="slot in sortedSlotsByDiversity.slice(0, 5)"
                      :key="slot.key"
                      class="flex justify-between items-center p-4 bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-xl border border-gray-600/30"
                    >
                      <span class="flex items-center gap-3 text-gray-200">
                        <span class="text-lg">{{ slot.icon }}</span>
                        {{ slot.name }}
                      </span>
                      <span class="text-blue-400 font-semibold"
                        >{{ slot.uniqueItems }} items</span
                      >
                    </div>
                  </div>
                </div>

                <!-- Most Standardized Slots -->
                <div>
                  <h4
                    class="text-lg font-semibold mb-4 text-green-400 flex items-center gap-2"
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Most Standardized Slots
                  </h4>
                  <div class="space-y-3">
                    <div
                      v-for="slot in sortedSlotsByStandardization.slice(0, 5)"
                      :key="slot.key"
                      class="flex justify-between items-center p-4 bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-xl border border-gray-600/30"
                    >
                      <span class="flex items-center gap-3 text-gray-200">
                        <span class="text-lg">{{ slot.icon }}</span>
                        {{ slot.name }}
                      </span>
                      <span class="text-green-400 font-semibold"
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
  { name: "eau", label: "Eau", icon: "/eau.png" },
  { name: "feu", label: "Feu", icon: "/feu.png" },
  { name: "terre", label: "Terre", icon: "/terre.png" },
  { name: "air", label: "Air", icon: "/air.png" },
  { name: "multi", label: "Multi", icon: "/multi.png" },
  { name: "tank", label: "Tank", icon: "/tank.png" },
  { name: "doPou", label: "Do Pou", icon: "/doPou.png" },
  { name: "pp", label: "Prospection", icon: "/pp.png" },
];

const modes = ["pvm", "pvp"];
const classes = [
  { name: "iop", icon: "/Iop.png" },
  { name: "cra", icon: "/Cra.png" },
  { name: "sacrieur", icon: "/Sacrieur.png" },
  { name: "eniripsa", icon: "/Eniripsa.png" },
  { name: "sram", icon: "/Sram.png" },
  { name: "ouginak", icon: "/Ouginak.png" },
  { name: "forgelance", icon: "/Forgelance.png" },
  { name: "osamodas", icon: "/Osamodas.png" },
  { name: "enutrof", icon: "/Enutrof.png" },
  { name: "ecaflip", icon: "/Ecaflip.png" },
  { name: "steamer", icon: "/Steamer.png" },
  { name: "feca", icon: "/Feca.png" },
  { name: "huppermage", icon: "/Huppermage.png" },
  { name: "zobal", icon: "/Zobal.png" },
  { name: "pandawa", icon: "/Pandawa.png" },
  { name: "eliotrope", icon: "/Eliotrope.png" },
  { name: "sadida", icon: "/Sadida.png" },
  { name: "roublard", icon: "/Roublard.png" },
  { name: "xelor", icon: "/Xelor.png" },
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
const budgets = ["low", "mid", "high"];

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
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(55, 65, 81, 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.7);
}

/* Loading spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
