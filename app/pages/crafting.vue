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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div>
            <h1
              class="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
            >
              Dofus Crafting Tracker
            </h1>
            <p class="text-gray-400 text-lg mt-1">
              Search and track your crafted items
            </p>
          </div>
        </div>
      </div>

      <!-- Breadcrumb Navigation -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-sm">
          <span
            class="px-3 py-1 bg-gray-800/50 text-gray-300 rounded-full border border-gray-700/50"
          >
            {{ currentServer ? "✓" : "1" }} Server Selection
          </span>
          <svg
            class="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span
            :class="[
              'px-3 py-1 rounded-full border',
              currentCharacter
                ? 'bg-gray-800/50 text-gray-300 border-gray-700/50'
                : currentServer
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                : 'bg-gray-700/30 text-gray-500 border-gray-600/30',
            ]"
          >
            {{ currentCharacter ? "✓" : currentServer ? "2" : "2" }} Character
            Selection
          </span>
          <svg
            class="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span
            :class="[
              'px-3 py-1 rounded-full border',
              currentCharacter
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                : 'bg-gray-700/30 text-gray-500 border-gray-600/30',
            ]"
          >
            {{ currentCharacter ? "3" : "3" }} Item Search
          </span>
        </div>
      </div>

      <!-- Content Container -->
      <div class="relative overflow-visible">
        <!-- Server Selection -->
        <Transition name="fade-slide" mode="out-in">
          <div v-if="!currentServer" key="server-selection">
            <div
              class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl"
            >
              <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gray-100 mb-3">
                  Choose Your Server
                </h2>
                <p class="text-gray-400 text-lg">
                  Select a server to begin searching items
                </p>
              </div>

              <ServerSelector
                :servers="servers"
                @server-selected="selectServer"
                @server-added="addServer"
                @server-deleted="deleteServer"
              />
            </div>
          </div>

          <!-- Character Selection -->
          <div v-else-if="!currentCharacter" key="character-selection">
            <div
              class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl"
            >
              <div class="flex items-center justify-between mb-8">
                <div>
                  <h2 class="text-3xl font-bold text-gray-100 mb-2">
                    Choose Your Character
                  </h2>
                  <p class="text-gray-400 text-lg">
                    Server:
                    <span class="text-blue-400 font-semibold">{{
                      currentServer.name
                    }}</span>
                  </p>
                </div>
                <button
                  @click="currentServer = null"
                  class="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-blue-400 transition-colors duration-200"
                >
                  <svg
                    class="w-4 h-4"
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
                  Change Server
                </button>
              </div>

              <CharacterSelector
                :server="currentServer"
                @character-selected="selectCharacter"
                @character-added="addCharacter"
                @character-deleted="deleteCharacter"
                @back-to-servers="currentServer = null"
              />
            </div>
          </div>

          <!-- Item Search Interface -->
          <div v-else key="search-interface">
            <!-- Tab Navigation -->
            <div class="mb-6">
              <div
                class="flex space-x-1 bg-gray-800/50 p-1 rounded-lg border border-gray-700/50"
              >
                <button
                  @click="activeTab = 'search'"
                  :class="[
                    'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
                    activeTab === 'search'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50',
                  ]"
                >
                  <div class="flex items-center justify-center gap-2">
                    <svg
                      class="w-4 h-4"
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
                    Item Search
                  </div>
                </button>
                <button
                  @click="activeTab = 'sold'"
                  :class="[
                    'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
                    activeTab === 'sold'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50',
                  ]"
                >
                  <div class="flex items-center justify-center gap-2">
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    Sold Items ({{ soldItems.length }})
                  </div>
                </button>
              </div>
            </div>

            <div
              class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl overflow-visible"
            >
              <!-- Header with character info -->
              <div
                class="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border-b border-gray-700/50 p-6"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
                    >
                      <span class="text-white font-bold text-lg">{{
                        currentCharacter.name.charAt(0).toUpperCase()
                      }}</span>
                    </div>
                    <div>
                      <h2 class="text-2xl font-bold text-gray-100">
                        {{ currentCharacter.name }}
                      </h2>
                      <p class="text-gray-300">
                        {{ currentCharacter.class }} • {{ currentServer.name }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      @click="currentCharacter = null"
                      class="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-blue-400 transition-colors duration-200"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Change Character
                    </button>
                    <button
                      @click="currentServer = null"
                      class="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-blue-400 transition-colors duration-200"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Change Server
                    </button>
                  </div>
                </div>
              </div>

              <!-- Tab Content -->
              <div class="p-8 overflow-visible">
                <!-- Search Tab -->
                <div v-if="activeTab === 'search'" class="space-y-6">
                  <!-- Item Search with Floating UI -->
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">
                      Search Item
                    </label>
                    <div class="relative">
                      <input
                        ref="searchInput"
                        v-model="itemSearch"
                        @input="searchItems"
                        @focus="showDropdown = true"
                        @blur="handleInputBlur"
                        type="text"
                        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tapez pour rechercher des objets..."
                      />

                      <!-- Loading indicator -->
                      <div v-if="isSearching" class="absolute right-3 top-3">
                        <div
                          class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"
                        ></div>
                      </div>

                      <!-- Floating Search Results Dropdown -->
                      <div
                        v-if="
                          showDropdown &&
                          (searchResults.length > 0 ||
                            (itemSearch.length > 1 && !isSearching))
                        "
                        ref="dropdown"
                        class="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50 mt-2"
                      >
                        <!-- Search Results -->
                        <div v-if="searchResults.length > 0">
                          <div
                            v-for="item in searchResults"
                            :key="item.id"
                            @mousedown="selectItem(item)"
                            class="px-4 py-3 hover:bg-gray-600 cursor-pointer flex items-center gap-3 border-b border-gray-600 last:border-b-0"
                          >
                            <img
                              :src="item.img"
                              :alt="getItemName(item)"
                              class="w-8 h-8 rounded"
                              @error="
                                $event.target.src = '/placeholder-item.png'
                              "
                            />
                            <div class="flex-1">
                              <div class="text-gray-100 font-medium">
                                {{ getItemName(item) }}
                              </div>
                              <div class="text-gray-400 text-sm">
                                {{ getTypeName(item) }} • Niveau
                                {{ item.level }}
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- No results -->
                        <div
                          v-else-if="itemSearch.length > 1 && !isSearching"
                          class="p-4 text-center text-gray-400"
                        >
                          Aucun objet trouvé
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Selected Item Preview and Customization -->
                  <div
                    v-if="selectedItem"
                    class="bg-gray-700 border border-gray-600 rounded-lg p-6"
                  >
                    <div class="flex items-center gap-4 mb-6">
                      <img
                        :src="selectedItem.img"
                        :alt="getItemName(selectedItem)"
                        class="w-16 h-16 rounded-lg"
                        @error="$event.target.src = '/placeholder-item.png'"
                      />
                      <div>
                        <h4 class="text-xl font-semibold text-gray-100">
                          {{ getItemName(selectedItem) }}
                        </h4>
                        <p class="text-gray-400">
                          {{ getTypeName(selectedItem) }} • Niveau
                          {{ selectedItem.level }}
                        </p>
                        <p class="text-gray-500 text-sm mt-1">
                          {{ getItemDescription(selectedItem) }}
                        </p>
                      </div>
                    </div>

                    <!-- Customizable Effects -->
                    <div
                      v-if="
                        selectedItem.effects && selectedItem.effects.length > 0
                      "
                      class="mb-6"
                    >
                      <h5 class="text-lg font-medium text-gray-300 mb-4">
                        Customize Item Stats:
                      </h5>
                      <div
                        v-if="isLoadingEffects"
                        class="flex items-center gap-2 text-gray-400"
                      >
                        <div
                          class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"
                        ></div>
                        <span class="text-sm">Chargement des effets...</span>
                      </div>
                      <div v-else class="space-y-4">
                        <div
                          v-for="(effect, index) in processedEffects"
                          :key="`${effect.effectId}-${index}`"
                          class="bg-gray-800 rounded-lg p-4"
                        >
                          <div class="flex items-center justify-between gap-4">
                            <div class="flex-1">
                              <label
                                class="block text-sm font-medium text-gray-300 mb-2"
                              >
                                {{ getEffectBaseDescription(effect) }}
                              </label>
                              <p class="text-xs text-gray-500 mb-2">
                                Range: {{ effect.from }} - {{ effect.to }}
                              </p>
                            </div>
                            <div class="w-32">
                              <input
                                v-model.number="
                                  customEffectValues[
                                    `${effect.effectId}-${index}`
                                  ]
                                "
                                type="number"
                                :min="effect.from"
                                :max="effect.to"
                                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                :placeholder="effect.from.toString()"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Price Input and Save Button -->
                    <div class="border-t border-gray-600 pt-6">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-300 mb-2"
                          >
                            Sale Price (kamas)
                          </label>
                          <input
                            v-model.number="salePrice"
                            type="number"
                            min="0"
                            step="1000"
                            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter sale price..."
                          />
                        </div>
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-300 mb-2"
                          >
                            Notes (optional)
                          </label>
                          <input
                            v-model="itemNotes"
                            type="text"
                            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Add notes..."
                          />
                        </div>
                      </div>

                      <div class="flex gap-4">
                        <button
                          @click="saveItemAsSold"
                          :disabled="!salePrice || salePrice <= 0"
                          class="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
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
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Add to Sold Items
                        </button>
                        <button
                          @click="resetItemForm"
                          class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Sold Items Tab -->
                <div
                  v-else-if="activeTab === 'sold'"
                  class="space-y-6 overflow-visible"
                >
                  <div class="flex items-center justify-between">
                    <h3 class="text-2xl font-bold text-gray-100">
                      Sold Equipment
                    </h3>
                    <div class="text-sm text-gray-400">
                      Total: {{ formatPrice(totalSoldValue) }} kamas
                    </div>
                  </div>

                  <div v-if="soldItems.length === 0" class="text-center py-12">
                    <svg
                      class="w-16 h-16 text-gray-600 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4a2 2 0 00-2 2v1a2 2 0 01-2 2H8a2 2 0 01-2-2v-1a2 2 0 00-2-2H0"
                      />
                    </svg>
                    <p class="text-gray-400 text-lg">No sold items yet</p>
                    <p class="text-gray-500">Items you sell will appear here</p>
                  </div>

                  <div v-else class="grid gap-4 overflow-visible">
                    <div
                      v-for="soldItem in soldItems"
                      :key="soldItem.id"
                      class="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:bg-gray-650 transition-colors duration-200 relative overflow-visible"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4 flex-1">
                          <div
                            class="relative"
                            @mouseenter="showTooltip = soldItem.id"
                            @mouseleave="showTooltip = null"
                          >
                            <img
                              :src="soldItem.item.img"
                              :alt="getItemName(soldItem.item)"
                              class="w-12 h-12 rounded cursor-pointer border-2 border-transparent hover:border-yellow-400 transition-colors"
                              @error="
                                $event.target.src = '/placeholder-item.png'
                              "
                            />

                            <ItemTooltip
                              v-if="showTooltip === soldItem.id"
                              :item="soldItem.item"
                              :custom-effects="soldItem.customEffects"
                              :sale-info="{
                                price: soldItem.price,
                                dateSold: soldItem.dateSold,
                                notes: soldItem.notes,
                              }"
                            />
                          </div>

                          <div class="flex-1">
                            <h4
                              class="text-lg font-semibold text-gray-100 mb-1"
                            >
                              {{ getItemName(soldItem.item) }}
                            </h4>
                            <p class="text-gray-400 text-sm mb-2">
                              {{ getTypeName(soldItem.item) }} • Niveau
                              {{ soldItem.item.level }}
                            </p>
                            <div class="flex items-center gap-4 text-sm">
                              <span class="text-green-400 font-semibold">
                                {{ formatPrice(soldItem.price) }} kamas
                              </span>
                              <span class="text-gray-500">
                                {{ formatDate(soldItem.dateSold) }}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          @click="deleteSoldItem(soldItem.id)"
                          class="p-2 text-gray-400 hover:text-red-400 transition-colors duration-200"
                          title="Delete item"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
const servers = ref([]);
const currentServer = ref(null);
const currentCharacter = ref(null);

const activeTab = ref("search");

const itemSearch = ref("");
const searchResults = ref([]);
const selectedItem = ref(null);
const showDropdown = ref(false);
const isSearching = ref(false);
const isLoadingEffects = ref(false);
const processedEffects = ref([]);

const customEffectValues = ref({});
const salePrice = ref(null);
const itemNotes = ref("");

const soldItems = ref([]);

const showTooltip = ref(null);

const searchInput = ref(null);
const dropdown = ref(null);

const effectsCache = ref({});

const totalSoldValue = computed(() => {
  return soldItems.value.reduce((total, item) => total + item.price, 0);
});

onMounted(async () => {
  loadServersData();
  loadEffectsCache();
  loadSoldItems();

  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const handleClickOutside = (event) => {
  if (
    searchInput.value &&
    dropdown.value &&
    !searchInput.value.contains(event.target) &&
    !dropdown.value.contains(event.target)
  ) {
    showDropdown.value = false;
  }
};

const handleInputBlur = () => {
  setTimeout(() => {
    showDropdown.value = false;
  }, 150);
};

const loadServersData = () => {
  const savedServers = localStorage.getItem("archimonstres-servers");
  if (savedServers) {
    servers.value = JSON.parse(savedServers);
  }
};

const saveServersData = () => {
  localStorage.setItem("archimonstres-servers", JSON.stringify(servers.value));
};

const loadEffectsCache = () => {
  const savedEffects = localStorage.getItem("dofus-effects-cache");
  if (savedEffects) {
    effectsCache.value = JSON.parse(savedEffects);
  }
};

const loadSoldItems = () => {
  const saved = localStorage.getItem("sold-equipments");
  if (saved) {
    soldItems.value = JSON.parse(saved);
  }
};

const saveSoldItems = () => {
  localStorage.setItem("sold-equipments", JSON.stringify(soldItems.value));
};

watch(
  effectsCache,
  (newCache) => {
    localStorage.setItem("dofus-effects-cache", JSON.stringify(newCache));
  },
  { deep: true }
);

const addServer = (serverName) => {
  const newServer = {
    id: Date.now().toString(),
    name: serverName.trim(),
    characters: [],
  };

  servers.value.push(newServer);
  saveServersData();
  selectServer(newServer);
};

const selectServer = (server) => {
  currentServer.value = server;
  currentCharacter.value = null;
};

const deleteServer = (serverId) => {
  const index = servers.value.findIndex((server) => server.id === serverId);
  if (index !== -1) {
    servers.value.splice(index, 1);
    saveServersData();

    if (currentServer.value && currentServer.value.id === serverId) {
      currentServer.value = null;
      currentCharacter.value = null;
    }
  }
};

const addCharacter = (characterData) => {
  const newCharacter = {
    id: Date.now().toString(),
    name: characterData.name.trim(),
    class: characterData.class,
  };

  currentServer.value.characters.push(newCharacter);
  saveServersData();
  selectCharacter(newCharacter);
};

const selectCharacter = (character) => {
  currentCharacter.value = character;
};

const deleteCharacter = (characterId) => {
  const characterIndex = currentServer.value.characters.findIndex(
    (char) => char.id === characterId
  );
  if (characterIndex !== -1) {
    currentServer.value.characters.splice(characterIndex, 1);
    saveServersData();

    if (currentCharacter.value && currentCharacter.value.id === characterId) {
      currentCharacter.value = null;
    }
  }
};

const searchItems = async () => {
  if (itemSearch.value.length < 2) {
    searchResults.value = [];
    showDropdown.value = false;
    return;
  }

  isSearching.value = true;

  try {
    const searchQuery = encodeURIComponent(itemSearch.value);
    const url = `https://api.dofusdb.fr/items?typeId[$ne]=203&$sort=-id&slug.fr[$search]=${searchQuery}&level[$gte]=0&level[$lte]=200&$skip=0&lang=fr`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.data) {
      searchResults.value = data.data.slice(0, 15);
      showDropdown.value = true;
    } else {
      searchResults.value = [];
    }
  } catch (error) {
    console.error("Error searching items:", error);
    searchResults.value = [];
  }

  isSearching.value = false;
};

const selectItem = async (item) => {
  selectedItem.value = item;
  itemSearch.value = getItemName(item);
  showDropdown.value = false;
  searchResults.value = [];

  customEffectValues.value = {};
  salePrice.value = null;
  itemNotes.value = "";

  await processItemEffects(item);
};

const processItemEffects = async (item) => {
  if (!item.effects || item.effects.length === 0) {
    processedEffects.value = [];
    return;
  }

  isLoadingEffects.value = true;
  const effects = [];

  for (const [index, effect] of item.effects.entries()) {
    const effectId = effect.effectId;
    const effectKey = `${effectId}-${index}`;

    customEffectValues.value[effectKey] = effect.from;

    if (effectsCache.value[effectId]) {
      effects.push({
        ...effect,
        description: formatEffectWithData(effect, effectsCache.value[effectId]),
      });
    } else {
      try {
        const response = await fetch(
          `https://api.dofusdb.fr/effects/${effectId}`
        );
        const data = await response.json();

        if (data && data.description) {
          effectsCache.value[effectId] = data;

          effects.push({
            ...effect,
            description: formatEffectWithData(effect, data),
          });
        } else {
          effects.push({
            ...effect,
            description: formatEffectFallback(effect),
          });
        }
      } catch (error) {
        console.error(`Error fetching effect ${effectId}:`, error);
        effects.push({
          ...effect,
          description: formatEffectFallback(effect),
        });
      }
    }
  }

  processedEffects.value = effects;
  isLoadingEffects.value = false;
};

const formatEffectWithData = (effect, effectData) => {
  let description =
    effectData.description?.fr ||
    effectData.description?.en ||
    `Effet ${effect.effectId}`;

  if (description.includes("#1") || description.includes("#2")) {
    if (effect.from !== undefined && effect.to !== undefined) {
      if (effect.from === effect.to) {
        description = description
          .replace(/{[^}]*}/g, "")
          .replace(/#1/g, effect.from)
          .replace(/#2/g, "")
          .trim();
      } else {
        description = description
          .replace(/#1/g, effect.from)
          .replace(/#2/g, effect.to)
          .replace(/{~1~2 ([^}]*)}/g, "$1")
          .trim();
      }
    }
  }

  return description;
};
const formatEffectFallback = (effect) => {
  if (effect.from === effect.to) {
    return `Effet ${effect.effectId}: ${effect.from}`;
  } else {
    return `Effet ${effect.effectId}: ${effect.from} à ${effect.to}`;
  }
};

const getEffectBaseDescription = (effect) => {
  const effectData = effectsCache.value[effect.effectId];
  if (!effectData) return `Effect ${effect.effectId}`;

  let description =
    effectData.description?.fr ||
    effectData.description?.en ||
    `Effect ${effect.effectId}`;

  description = description
    .replace(/{{[^}]*}}/g, "")
    .replace(/#[12]/g, "X")
    .replace(/^X+\s*/, "")
    .replace(/\s+X+(?=\s|$)/g, " X")
    .trim();

  return description;
};

const saveItemAsSold = () => {
  if (!selectedItem.value || !salePrice.value || salePrice.value <= 0) {
    return;
  }

  const customEffects = processedEffects.value.map((effect, index) => {
    const effectKey = `${effect.effectId}-${index}`;
    const customValue = customEffectValues.value[effectKey] || effect.from;

    return {
      effectId: effect.effectId,
      customValue,
      description: formatCustomEffectDescription(effect, customValue),
    };
  });

  const soldItem = {
    id: Date.now().toString(),
    item: selectedItem.value,
    price: salePrice.value,
    notes: itemNotes.value.trim() || null,
    customEffects,
    server: currentServer.value.name,
    character: currentCharacter.value.name,
    dateSold: new Date().toISOString(),
  };

  soldItems.value.unshift(soldItem);
  saveSoldItems();

  resetItemForm();
  activeTab.value = "sold";
};

const formatCustomEffectDescription = (effect, customValue) => {
  const effectData = effectsCache.value[effect.effectId];
  if (!effectData) return `Effect ${effect.effectId}: ${customValue}`;

  let effectName =
    effectData.description?.fr ||
    effectData.description?.en ||
    `Effect ${effect.effectId}`;

  effectName = effectName
    .replace(/#[12]/g, "")
    .replace(/{[^}]*}/g, "")
    .replace(/{{[^}]*}}/g, "")
    .replace(/[{}]/g, "")
    .replace(/~\d+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return `${customValue} ${effectName}`;
};
const resetItemForm = () => {
  selectedItem.value = null;
  itemSearch.value = "";
  customEffectValues.value = {};
  salePrice.value = null;
  itemNotes.value = "";
  processedEffects.value = [];
};

const deleteSoldItem = (itemId) => {
  const index = soldItems.value.findIndex((item) => item.id === itemId);
  if (index !== -1) {
    soldItems.value.splice(index, 1);
    saveSoldItems();
  }
};

const getItemName = (item) => {
  return item.name?.fr || item.name?.en || "Objet Inconnu";
};

const getTypeName = (item) => {
  return item.type?.name?.fr || item.type?.name?.en || "Type Inconnu";
};

const getItemDescription = (item) => {
  return item.description?.fr || item.description?.en || "";
};

const formatPrice = (price) => {
  return new Intl.NumberFormat("fr-FR").format(price);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Ensure tooltips can escape overflow */
.overflow-visible {
  overflow: visible !important;
}
</style>
