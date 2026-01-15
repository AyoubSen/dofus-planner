<template>
  <div
    class="min-h-full"
    :style="{ background: 'var(--theme-gradient-bg)' }"
  >
    <div class="max-w-7xl mx-auto px-8 py-12">
      <!-- Header -->
      <div class="mb-12">
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
              {{ $t('items.title') }}
            </h1>
            <p class="text-gray-400 text-lg mt-1">
              {{ $t('items.subtitle') }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex gap-8">
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
            <h2 class="text-xl font-bold text-gray-100">{{ $t('items.filters.title') }}</h2>
          </div>

          <!-- Element Filter -->
          <div class="mb-6">
            <h3
              class="text-sm font-semibold mb-3 text-orange-400 uppercase tracking-wide"
            >
              {{ $t('items.filters.elements.title') }}
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
                <span class="text-gray-300">{{ $t('items.filters.elements.all') }}</span>
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
                      :alt="$t(`items.filters.elements.${element.name}`)"
                      class="w-6 h-6 object-contain"
                      @error="handleImageError"
                      loading="lazy"
                    />
                    <span class="text-xs text-gray-300 font-medium">{{
                      $t(`items.filters.elements.${element.name}`)
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
              {{ $t('items.filters.mode.title') }}
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
                <span class="text-gray-300">{{ $t('items.filters.mode.all') }}</span>
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
                      $t(`items.filters.mode.${mode}`)
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
              {{ $t('items.filters.classes.title') }}
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
                <span class="text-gray-300">{{ $t('items.filters.classes.all') }}</span>
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
                      :title="classe.name.charAt(0).toUpperCase() + classe.name.slice(1)"
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
              {{ $t('items.filters.level.title') }}
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
                <span class="text-gray-300">{{ $t('items.filters.level.all') }}</span>
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
              {{ $t('items.filters.budget.title') }}
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
                <span class="text-gray-300">{{ $t('items.filters.budget.all') }}</span>
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
                    <span class="capitalize text-gray-300 font-medium text-sm">{{
                      $t(`items.filters.budget.${budget}`)
                    }}</span>
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
              <span class="text-lg">{{ $t('items.loading') }}</span>
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
                <div class="text-gray-400">{{ $t('items.stats.totalEquipment') }}</div>
              </div>
              <div
                class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-center shadow-lg"
              >
                <div class="text-3xl font-bold text-green-400 mb-2">
                  {{ uniqueItems }}
                </div>
                <div class="text-gray-400">{{ $t('items.stats.uniqueItems') }}</div>
              </div>
              <div
                class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-center shadow-lg"
              >
                <div class="text-3xl font-bold text-purple-400 mb-2">
                  {{ mostPopularSlot?.slot || $t('items.stats.na') }}
                </div>
                <div class="text-gray-400">{{ $t('items.stats.mostVariedSlot') }}</div>
              </div>
              <div
                class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-center shadow-lg"
              >
                <div class="text-3xl font-bold text-yellow-400 mb-2">
                  {{ averageItemsPerSet.toFixed(1) }}
                </div>
                <div class="text-gray-400">{{ $t('items.stats.avgItemsPerSet') }}</div>
              </div>
            </div>

            <!-- Equipment Slot Tabs -->
            <div
              class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div
                class="flex flex-wrap items-center border-b border-gray-700/50 bg-gray-800/30"
              >
                <div class="flex flex-wrap flex-1">
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
                    {{ $t(`items.slots.${slot.key}`) }}
                    <span
                      class="bg-gray-600/50 px-2 py-1 rounded-full text-xs border border-gray-500/50"
                    >
                      {{ getSlotStats(slot.key)?.totalItems || 0 }}
                    </span>
                  </button>
                </div>

                <!-- View Mode Toggle -->
                <div class="flex items-center gap-1 px-4">
                  <button
                    @click="viewMode = 'list'"
                    :class="[
                      'p-2 rounded-lg transition-colors',
                      viewMode === 'list'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-400 hover:text-gray-300',
                    ]"
                    :title="$t('items.viewModes.list')"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    @click="viewMode = 'grid'"
                    :class="[
                      'p-2 rounded-lg transition-colors',
                      viewMode === 'grid'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-400 hover:text-gray-300',
                    ]"
                    :title="$t('items.viewModes.grid')"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    @click="viewMode = 'table'"
                    :class="[
                      'p-2 rounded-lg transition-colors',
                      viewMode === 'table'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-400 hover:text-gray-300',
                    ]"
                    :title="$t('items.viewModes.table')"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Slot Statistics -->
              <div class="p-8">
                <template v-if="getSlotStats(activeSlot)">
                  <!-- LIST VIEW -->
                  <div v-if="viewMode === 'list'" class="space-y-8">
                    <!-- Top Items for Selected Slot -->
                    <div>
                      <h3 class="text-2xl font-bold mb-6 text-gray-100">
                        {{ $t('items.mostUsed', { slot: $t(`items.slots.${activeSlot}`) }) }}
                      </h3>
                      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div
                          v-for="(item, index) in getSlotStats(activeSlot).topItems.slice(0, 10)"
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
                              {{ $t('items.usedTimes', {
                                count: item.count,
                                percent: ((item.count / totalEquipments) * 100).toFixed(1)
                              }) }}
                            </div>
                          </div>
                          <div class="flex-shrink-0">
                            <span class="text-lg font-bold text-blue-400">#{{ index + 1 }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Usage Distribution Chart -->
                    <div>
                      <h3 class="text-2xl font-bold mb-6 text-gray-100">
                        {{ $t('items.usageDistribution') }}
                      </h3>
                      <div class="space-y-3">
                        <div
                          v-for="item in getSlotStats(activeSlot).topItems.slice(0, 5)"
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

                  <!-- GRID VIEW -->
                  <div v-else-if="viewMode === 'grid'">
                    <h3 class="text-2xl font-bold mb-6 text-gray-100">
                      {{ $t('items.mostUsed', { slot: $t(`items.slots.${activeSlot}`) }) }}
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div
                        v-for="(item, index) in getSlotStats(activeSlot).topItems.slice(0, 20)"
                        :key="item.name"
                        class="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-4 border border-gray-600/30 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 group"
                      >
                        <!-- Rank Badge -->
                        <div class="flex justify-between items-start mb-3">
                          <span class="text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
                            #{{ index + 1 }}
                          </span>
                          <span class="text-xs text-gray-500">
                            {{ ((item.count / totalEquipments) * 100).toFixed(1) }}%
                          </span>
                        </div>

                        <!-- Item Image -->
                        <div class="flex justify-center mb-3">
                          <div class="w-16 h-16 bg-gray-600/50 rounded-lg border-2 border-gray-500/50 p-1 group-hover:border-blue-500/50 transition-colors">
                            <img
                              v-if="item.image_url"
                              :src="item.image_url"
                              :alt="item.name"
                              class="w-full h-full object-cover rounded"
                              @error="handleImageError"
                            />
                            <div
                              v-else
                              class="w-full h-full bg-gray-500/50 rounded flex items-center justify-center"
                            >
                              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <!-- Item Name -->
                        <div class="text-center mb-3">
                          <div class="font-medium text-white text-sm truncate" :title="item.name">
                            {{ item.name }}
                          </div>
                          <div class="text-xs text-gray-400 mt-1">
                            {{ item.count }} {{ $t('items.uses') }}
                          </div>
                        </div>

                        <!-- Usage Bar -->
                        <div class="bg-gray-700/50 rounded-full h-2 overflow-hidden">
                          <div
                            class="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                            :style="{
                              width: `${(item.count / getSlotStats(activeSlot).topItems[0].count) * 100}%`,
                            }"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- TABLE VIEW -->
                  <div v-else-if="viewMode === 'table'">
                    <h3 class="text-2xl font-bold mb-6 text-gray-100">
                      {{ $t('items.mostUsed', { slot: $t(`items.slots.${activeSlot}`) }) }}
                    </h3>
                    <div class="overflow-x-auto">
                      <table class="w-full">
                        <thead>
                          <tr class="border-b border-gray-700/50">
                            <th class="text-left py-3 px-4 text-gray-400 font-semibold text-sm">#</th>
                            <th class="text-left py-3 px-4 text-gray-400 font-semibold text-sm">{{ $t('items.table.image') }}</th>
                            <th class="text-left py-3 px-4 text-gray-400 font-semibold text-sm">{{ $t('items.table.name') }}</th>
                            <th class="text-right py-3 px-4 text-gray-400 font-semibold text-sm">{{ $t('items.table.count') }}</th>
                            <th class="text-right py-3 px-4 text-gray-400 font-semibold text-sm">{{ $t('items.table.percentage') }}</th>
                            <th class="text-left py-3 px-4 text-gray-400 font-semibold text-sm w-48">{{ $t('items.table.distribution') }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(item, index) in getSlotStats(activeSlot).topItems.slice(0, 20)"
                            :key="item.name"
                            class="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                          >
                            <td class="py-3 px-4">
                              <span class="text-blue-400 font-bold">{{ index + 1 }}</span>
                            </td>
                            <td class="py-3 px-4">
                              <div class="w-10 h-10 bg-gray-600/50 rounded-lg border border-gray-500/50 p-0.5">
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
                            </td>
                            <td class="py-3 px-4">
                              <span class="text-white font-medium">{{ item.name }}</span>
                            </td>
                            <td class="py-3 px-4 text-right">
                              <span class="text-gray-300">{{ item.count }}</span>
                            </td>
                            <td class="py-3 px-4 text-right">
                              <span class="text-purple-400 font-medium">
                                {{ ((item.count / totalEquipments) * 100).toFixed(1) }}%
                              </span>
                            </td>
                            <td class="py-3 px-4">
                              <div class="bg-gray-700/50 rounded-full h-3 overflow-hidden">
                                <div
                                  class="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                                  :style="{
                                    width: `${(item.count / getSlotStats(activeSlot).topItems[0].count) * 100}%`,
                                  }"
                                ></div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </template>

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
                  <p class="text-lg">{{ $t('items.noData') }}</p>
                </div>
              </div>
            </div>

            <!-- Cross-Slot Analysis -->
            <div
              class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl"
            >
              <h3 class="text-2xl font-bold mb-6 text-gray-100">
                {{ $t('items.globalAnalysis.title') }}
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
                    {{ $t('items.globalAnalysis.mostDiverse') }}
                  </h4>
                  <div class="space-y-3">
                    <div
                      v-for="slot in sortedSlotsByDiversity.slice(0, 5)"
                      :key="slot.key"
                      class="flex justify-between items-center p-4 bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-xl border border-gray-600/30"
                    >
                      <span class="flex items-center gap-3 text-gray-200">
                        <span class="text-lg">{{ slot.icon }}</span>
                        {{ $t(`items.slots.${slot.key}`) }}
                      </span>
                      <span class="text-blue-400 font-semibold">
                        {{ $t('items.globalAnalysis.itemsCount', { count: slot.uniqueItems }) }}
                      </span>
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
                    {{ $t('items.globalAnalysis.mostStandardized') }}
                  </h4>
                  <div class="space-y-3">
                    <div
                      v-for="slot in sortedSlotsByStandardization.slice(0, 5)"
                      :key="slot.key"
                      class="flex justify-between items-center p-4 bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-xl border border-gray-600/30"
                    >
                      <span class="flex items-center gap-3 text-gray-200">
                        <span class="text-lg">{{ slot.icon }}</span>
                        {{ $t(`items.slots.${slot.key}`) }}
                      </span>
                      <span class="text-green-400 font-semibold">
                        {{ slot.topItemPercentage }}%
                      </span>
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
const { t } = useI18n();
const localePath = useLocalePath();

// Data
const statistics = ref(null);
const isLoading = ref(false);
const activeSlot = ref("ar");
const viewMode = ref("list"); // 'list' | 'grid' | 'table'

// Equipment slots configuration (icons only, names come from i18n)
const equipmentSlots = [
  { key: "ar", icon: "⚔️" },
  { key: "ch", icon: "🎩" },
  { key: "ca", icon: "🦸" },
  { key: "am", icon: "📿" },
  { key: "br", icon: "🛡️" },
  { key: "ce", icon: "👑" },
  { key: "bo", icon: "👢" },
  { key: "a1", icon: "💍" },
  { key: "a2", icon: "💍" },
  { key: "fa", icon: "🐾" },
  { key: "d1", icon: "🥚" },
  { key: "d2", icon: "🥚" },
  { key: "d3", icon: "🥚" },
  { key: "d4", icon: "🥚" },
  { key: "d5", icon: "🥚" },
  { key: "d6", icon: "🥚" },
];

// Filter options
const elements = [
  { name: "eau", icon: "/eau.png" },
  { name: "feu", icon: "/feu.png" },
  { name: "terre", icon: "/terre.png" },
  { name: "air", icon: "/air.png" },
  { name: "multi", icon: "/multi.png" },
  { name: "tank", icon: "/tank.png" },
  { name: "doPou", icon: "/doPou.png" },
  { name: "pp", icon: "/pp.png" },
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
const levels = ["20", "40", "60", "80", "110", "130", "160", "180", "199", "200"];
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
        slot: t(`items.slots.${slotKey}`),
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
