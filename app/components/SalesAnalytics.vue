<template>
  <div class="space-y-6">
    <!-- Analytics Header -->
    <div
      class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 backdrop-blur-sm"
    >
      <div
        class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"
      ></div>
      <div class="relative z-10 p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <div
              class="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20"
            >
              <svg
                class="w-7 h-7 text-white"
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
              <h2 class="text-2xl font-bold text-gray-100">
                {{ t('archimonstres.salesAnalytics.header.title') }}
              </h2>
              <p class="text-gray-400 mt-1">
                {{ t('archimonstres.salesAnalytics.header.subtitle') }}
              </p>
            </div>
          </div>
          <div class="flex gap-3">
            <select
              v-model="analyticsTimeframe"
              class="px-4 py-2.5 bg-gray-800/80 border border-gray-600/50 rounded-xl text-gray-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
            >
              <option value="all">{{ t('archimonstres.salesAnalytics.timeframes.all') }}</option>
              <option value="month">{{ t('archimonstres.salesAnalytics.timeframes.month') }}</option>
              <option value="week">{{ t('archimonstres.salesAnalytics.timeframes.week') }}</option>
            </select>
            <select
              v-model="analyticsSortBy"
              class="px-4 py-2.5 bg-gray-800/80 border border-gray-600/50 rounded-xl text-gray-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
            >
              <option value="quantity">{{ t('archimonstres.salesAnalytics.sortOptions.quantity') }}</option>
              <option value="revenue">{{ t('archimonstres.salesAnalytics.sortOptions.revenue') }}</option>
              <option value="avgPrice">{{ t('archimonstres.salesAnalytics.sortOptions.avgPrice') }}</option>
              <option value="frequency">{{ t('archimonstres.salesAnalytics.sortOptions.frequency') }}</option>
            </select>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Unique Monsters -->
          <div
            class="group relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
                >
                  <svg
                    class="w-5 h-5 text-white"
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
                <h3 class="text-sm font-medium text-blue-200/80">
                  {{ t('archimonstres.salesAnalytics.quickStats.uniqueMonsters') }}
                </h3>
              </div>
              <p class="text-3xl font-bold text-blue-300">
                {{ analyticsData.uniqueMonsters }}
              </p>
              <p class="text-sm text-blue-200/60 mt-1">
                {{ t('archimonstres.salesAnalytics.quickStats.typesSold') }}
              </p>
            </div>
          </div>

          <!-- Best Seller -->
          <div
            class="group relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30 hover:border-green-500/50 transition-all duration-300"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                </div>
                <h3 class="text-sm font-medium text-green-200/80">
                  {{ t('archimonstres.salesAnalytics.quickStats.bestSeller') }}
                </h3>
              </div>
              <p class="text-xl font-bold text-green-300 truncate">
                {{ analyticsData.bestSeller?.name || "N/A" }}
              </p>
              <p class="text-sm text-green-200/60 mt-1">
                {{ t('archimonstres.salesAnalytics.quickStats.sold', { count: analyticsData.bestSeller?.quantity || 0 }) }}
              </p>
            </div>
          </div>

          <!-- Highest Revenue -->
          <div
            class="group relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 class="text-sm font-medium text-yellow-200/80">
                  {{ t('archimonstres.salesAnalytics.quickStats.topRevenue') }}
                </h3>
              </div>
              <p class="text-xl font-bold text-yellow-300 truncate">
                {{ analyticsData.highestRevenue?.name || "N/A" }}
              </p>
              <p class="text-sm text-yellow-200/60 mt-1">
                {{ formatKamas(analyticsData.highestRevenue?.revenue || 0) }}
              </p>
            </div>
          </div>

          <!-- Average Price -->
          <div
            class="group relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20"
                >
                  <svg
                    class="w-5 h-5 text-white"
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
                </div>
                <h3 class="text-sm font-medium text-purple-200/80">
                  {{ t('archimonstres.salesAnalytics.quickStats.avgPrice') }}
                </h3>
              </div>
              <p class="text-3xl font-bold text-purple-300">
                {{ formatKamasShort(analyticsData.avgSalePrice) }}
              </p>
              <p class="text-sm text-purple-200/60 mt-1">
                {{ t('archimonstres.salesAnalytics.quickStats.perSale') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div
      class="relative overflow-hidden rounded-xl bg-gray-800/60 border border-gray-700/50 p-1.5"
    >
      <div class="flex gap-1">
        <button
          @click="analyticsSubTab = 'sales-analytics'"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2',
            analyticsSubTab === 'sales-analytics'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50',
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          {{ t('archimonstres.salesAnalytics.tabs.salesPerformance') }}
        </button>
        <button
          @click="analyticsSubTab = 'capture-patterns'"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2',
            analyticsSubTab === 'capture-patterns'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50',
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {{ t('archimonstres.salesAnalytics.tabs.capturePatterns') }}
        </button>
        <button
          @click="analyticsSubTab = 'price-trends'"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2',
            analyticsSubTab === 'price-trends'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50',
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          {{ t('archimonstres.salesAnalytics.tabs.priceTrends') }}
        </button>
        <button
          @click="analyticsSubTab = 'pricing-inconsistencies'"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 relative',
            analyticsSubTab === 'pricing-inconsistencies'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50',
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {{ t('archimonstres.salesAnalytics.tabs.inconsistencies') }}
          <span
            v-if="pricingInconsistencies.length > 0"
            class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse"
          >
            {{ pricingInconsistencies.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Sales Performance Tab -->
    <Transition name="fade" mode="out-in">
      <div v-if="analyticsSubTab === 'sales-analytics'" key="sales" class="space-y-6">
        <div
          class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50"
        >
          <div class="relative z-10 p-6 border-b border-gray-700/50">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20"
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
                    d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-100">
                  {{ t('archimonstres.salesAnalytics.salesPerformance.title') }}
                </h3>
                <p class="text-sm text-gray-400">
                  {{ t('archimonstres.salesAnalytics.salesPerformance.subtitle', { count: filteredAnalyticsData.length }) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredAnalyticsData.length === 0" class="p-10 text-center">
            <div class="max-w-sm mx-auto">
              <div
                class="w-20 h-20 mx-auto bg-gray-700/50 rounded-2xl flex items-center justify-center mb-4"
              >
                <svg
                  class="w-10 h-10 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p class="text-lg font-medium text-gray-300 mb-2">
                {{ t('archimonstres.salesAnalytics.salesPerformance.emptyTitle') }}
              </p>
              <p class="text-gray-500">
                {{ t('archimonstres.salesAnalytics.salesPerformance.emptyDescription') }}
              </p>
            </div>
          </div>

          <!-- Rankings List -->
          <div
            v-else
            class="divide-y divide-gray-700/50 max-h-[500px] overflow-y-auto custom-scrollbar"
          >
            <div
              v-for="(monster, index) in filteredAnalyticsData"
              :key="monster.name"
              class="group p-4 hover:bg-gray-700/30 transition-all duration-200"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <!-- Ranking Badge -->
                  <div
                    :class="[
                      'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg transition-transform duration-200 group-hover:scale-110',
                      index === 0
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900 shadow-yellow-500/30'
                        : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 shadow-gray-400/30'
                          : index === 2
                            ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-amber-100 shadow-amber-600/30'
                            : 'bg-gray-700/80 text-gray-300 border border-gray-600/50',
                    ]"
                  >
                    <span v-if="index === 0">👑</span>
                    <span v-else-if="index === 1">🥈</span>
                    <span v-else-if="index === 2">🥉</span>
                    <span v-else>{{ index + 1 }}</span>
                  </div>

                  <!-- Monster Info -->
                  <div class="flex items-center gap-3">
                    <div
                      class="w-14 h-14 rounded-xl overflow-hidden bg-gray-700/50 border border-gray-600/50 flex items-center justify-center"
                    >
                      <img
                        v-if="monster.image_url"
                        :src="monster.image_url"
                        :alt="monster.name"
                        class="w-full h-full object-cover"
                      />
                      <svg
                        v-else
                        class="w-7 h-7 text-yellow-300"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-100 group-hover:text-white transition-colors">
                        {{ monster.name }}
                      </h4>
                      <p class="text-sm text-gray-500">
                        {{ t('archimonstres.salesAnalytics.salesPerformance.sales', monster.salesCount) }}
                        • {{ t('archimonstres.salesAnalytics.salesPerformance.last', { date: formatDateShort(monster.lastSold) }) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Stats -->
                <div class="flex items-center gap-6">
                  <div class="text-center">
                    <p class="text-xs text-gray-500 uppercase tracking-wide">
                      {{ t('archimonstres.salesAnalytics.salesPerformance.quantity') }}
                    </p>
                    <p class="font-bold text-blue-400 text-lg">{{ monster.quantity }}</p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-gray-500 uppercase tracking-wide">
                      {{ t('archimonstres.salesAnalytics.salesPerformance.revenue') }}
                    </p>
                    <p class="font-bold text-green-400 text-lg">
                      {{ formatKamasShort(monster.revenue) }}
                    </p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-gray-500 uppercase tracking-wide">
                      {{ t('archimonstres.salesAnalytics.salesPerformance.avgPrice') }}
                    </p>
                    <p class="font-bold text-yellow-400 text-lg">
                      {{ formatKamasShort(monster.avgPrice) }}
                    </p>
                  </div>
                  <div class="text-center min-w-24">
                    <p class="text-xs text-gray-500 uppercase tracking-wide">
                      {{ t('archimonstres.salesAnalytics.salesPerformance.range') }}
                    </p>
                    <p class="text-sm text-gray-400">
                      {{ formatKamasShort(monster.minPrice) }} -
                      {{ formatKamasShort(monster.maxPrice) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mt-4">
                <div class="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>{{ t('archimonstres.salesAnalytics.salesPerformance.performance') }}</span>
                  <span>
                    {{ t('archimonstres.salesAnalytics.salesPerformance.ofTopSeller', {
                      percent: Math.round((monster.quantity / (filteredAnalyticsData[0]?.quantity || 1)) * 100)
                    }) }}
                  </span>
                </div>
                <div class="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500 ease-out"
                    :class="[
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                        : index === 1
                          ? 'bg-gradient-to-r from-gray-300 to-gray-400'
                          : index === 2
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                            : 'bg-gradient-to-r from-blue-500 to-green-500',
                    ]"
                    :style="{
                      width: `${Math.round(
                        (monster.quantity / (filteredAnalyticsData[0]?.quantity || 1)) * 100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Capture Patterns Tab -->
    <Transition name="fade" mode="out-in">
      <div v-if="analyticsSubTab === 'capture-patterns'" key="capture" class="space-y-6">
        <div
          class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/20 via-gray-800/80 to-indigo-900/20 border border-purple-500/30"
        >
          <div
            class="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5"
          ></div>

          <div class="relative z-10 p-6 border-b border-purple-500/20">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20"
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-purple-200">
                    {{ t('archimonstres.salesAnalytics.capturePatterns.title') }}
                  </h3>
                  <p class="text-sm text-purple-200/60">
                    {{ t('archimonstres.salesAnalytics.capturePatterns.subtitle') }}
                  </p>
                </div>
              </div>
              <select
                v-model="captureTimeframe"
                class="px-4 py-2 bg-gray-800/80 border border-purple-500/30 rounded-xl text-purple-100 text-sm font-medium focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-200"
              >
                <option value="all">{{ t('archimonstres.salesAnalytics.timeframes.all') }}</option>
                <option value="month">{{ t('archimonstres.salesAnalytics.timeframes.month') }}</option>
                <option value="week">{{ t('archimonstres.salesAnalytics.timeframes.week') }}</option>
                <option value="today">{{ t('archimonstres.salesAnalytics.timeframes.today') }}</option>
              </select>
            </div>

            <!-- Capture Stats -->
            <div class="grid md:grid-cols-3 gap-4 mt-6">
              <div
                class="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center"
              >
                <h3 class="text-sm font-medium text-purple-300/80">
                  {{ t('archimonstres.salesAnalytics.capturePatterns.itemsCaptured') }}
                </h3>
                <p class="text-3xl font-bold text-purple-300">
                  {{ captureStats.totalItems }}
                </p>
                <p class="text-xs text-purple-200/60">
                  {{ t('archimonstres.salesAnalytics.capturePatterns.uniqueMonsters', { count: captureStats.uniqueMonsters }) }}
                </p>
              </div>
              <div
                class="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center"
              >
                <h3 class="text-sm font-medium text-purple-300/80">
                  {{ t('archimonstres.salesAnalytics.capturePatterns.mostCaptured') }}
                </h3>
                <p class="text-xl font-bold text-green-400 truncate">
                  {{ captureStats.mostCaptured?.name || "N/A" }}
                </p>
                <p class="text-xs text-purple-200/60">
                  {{ t('archimonstres.salesAnalytics.capturePatterns.times', { count: captureStats.mostCaptured?.count || 0 }) }}
                </p>
              </div>
              <div
                class="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center"
              >
                <h3 class="text-sm font-medium text-purple-300/80">
                  {{ t('archimonstres.salesAnalytics.capturePatterns.avgPerDay') }}
                </h3>
                <p class="text-3xl font-bold text-blue-400">
                  {{ captureStats.avgPerDay }}
                </p>
                <p class="text-xs text-purple-200/60">
                  {{ t('archimonstres.salesAnalytics.capturePatterns.capturesDaily') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Capture Ranking -->
          <div
            v-if="captureRanking.length === 0"
            class="relative z-10 p-10 text-center"
          >
            <div class="max-w-sm mx-auto">
              <div
                class="w-20 h-20 mx-auto bg-gray-700/50 rounded-2xl flex items-center justify-center mb-4"
              >
                <svg
                  class="w-10 h-10 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                </svg>
              </div>
              <p class="text-lg font-medium text-gray-300 mb-2">
                {{ t('archimonstres.salesAnalytics.capturePatterns.emptyTitle') }}
              </p>
              <p class="text-gray-500">
                {{ t('archimonstres.salesAnalytics.capturePatterns.emptyDescription') }}
              </p>
            </div>
          </div>

          <div
            v-else
            class="relative z-10 divide-y divide-purple-500/20 max-h-[400px] overflow-y-auto custom-scrollbar"
          >
            <div
              v-for="(monster, index) in captureRanking"
              :key="monster.name"
              class="group p-4 hover:bg-purple-900/20 transition-all duration-200"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <!-- Ranking Badge -->
                  <div
                    :class="[
                      'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg transition-transform duration-200 group-hover:scale-110',
                      index === 0
                        ? 'bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-purple-500/30'
                        : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 shadow-gray-400/30'
                          : index === 2
                            ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-amber-100 shadow-amber-600/30'
                            : 'bg-gray-700/80 text-gray-300 border border-gray-600/50',
                    ]"
                  >
                    {{ index + 1 }}
                  </div>

                  <!-- Monster Info -->
                  <div class="flex items-center gap-3">
                    <div
                      class="w-14 h-14 rounded-xl overflow-hidden bg-gray-700/50 border border-purple-500/30 flex items-center justify-center"
                    >
                      <img
                        v-if="monster.image_url"
                        :src="monster.image_url"
                        :alt="monster.name"
                        class="w-full h-full object-cover"
                      />
                      <svg
                        v-else
                        class="w-7 h-7 text-purple-300"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 class="font-semibold text-purple-100 group-hover:text-white transition-colors">
                        {{ monster.name }}
                      </h4>
                      <p class="text-sm text-purple-200/60">
                        {{ t('archimonstres.salesAnalytics.capturePatterns.firstLast', {
                          first: formatDateShort(monster.firstCapture),
                          last: formatDateShort(monster.lastCapture)
                        }) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Stats -->
                <div class="flex items-center gap-6">
                  <div class="text-center">
                    <p class="text-xs text-purple-300/60 uppercase tracking-wide">
                      {{ t('archimonstres.salesAnalytics.capturePatterns.captured') }}
                    </p>
                    <p class="font-bold text-purple-300 text-lg">{{ monster.count }}</p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-purple-300/60 uppercase tracking-wide">
                      {{ t('archimonstres.salesAnalytics.capturePatterns.percentTotal') }}
                    </p>
                    <p class="font-bold text-blue-400 text-lg">
                      {{ Math.round((monster.count / captureStats.totalItems) * 100) }}%
                    </p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-purple-300/60 uppercase tracking-wide">
                      {{ t('archimonstres.salesAnalytics.capturePatterns.daysActive') }}
                    </p>
                    <p class="text-gray-400">{{ monster.daysActive }}</p>
                  </div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mt-4">
                <div class="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
                    :style="{
                      width: `${Math.round(
                        (monster.count / (captureRanking[0]?.count || 1)) * 100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Price Trends Tab -->
    <Transition name="fade" mode="out-in">
      <div v-if="analyticsSubTab === 'price-trends'" key="trends" class="space-y-6">
        <div
          class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/20 via-gray-800/80 to-cyan-900/20 border border-blue-500/30"
        >
          <div
            class="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5"
          ></div>

          <div class="relative z-10 p-6 border-b border-blue-500/20">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
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
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-blue-200">
                    {{ t('archimonstres.salesAnalytics.priceTrends.title') }}
                  </h3>
                  <p class="text-sm text-blue-200/60">
                    {{ t('archimonstres.salesAnalytics.priceTrends.subtitle') }}
                  </p>
                </div>
              </div>
              <div class="flex gap-3">
                <select
                  v-model="trendTimeframe"
                  class="px-4 py-2 bg-gray-800/80 border border-blue-500/30 rounded-xl text-blue-100 text-sm font-medium focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200"
                >
                  <option value="all">{{ t('archimonstres.salesAnalytics.timeframes.all') }}</option>
                  <option value="month">{{ t('archimonstres.salesAnalytics.timeframes.month') }}</option>
                  <option value="week">{{ t('archimonstres.salesAnalytics.timeframes.week') }}</option>
                </select>
                <select
                  v-model="selectedTrendMonster"
                  class="px-4 py-2 bg-gray-800/80 border border-blue-500/30 rounded-xl text-blue-100 text-sm font-medium focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200"
                >
                  <option value="">{{ t('archimonstres.salesAnalytics.priceTrends.allMonsters') }}</option>
                  <option
                    v-for="monster in monstersWithPriceData"
                    :key="monster"
                    :value="monster"
                  >
                    {{ monster }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Price Trend Stats -->
            <div v-if="priceTrendStats" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div
                class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center"
              >
                <h3 class="text-sm font-medium text-blue-300/80">
                  {{ t('archimonstres.salesAnalytics.priceTrends.monstersTracked') }}
                </h3>
                <p class="text-3xl font-bold text-blue-300">
                  {{ priceTrendStats.monstersCount }}
                </p>
              </div>
              <div
                class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center"
              >
                <h3 class="text-sm font-medium text-blue-300/80">
                  {{ t('archimonstres.salesAnalytics.priceTrends.avgPriceChange') }}
                </h3>
                <p
                  :class="[
                    'text-3xl font-bold',
                    priceTrendStats.avgPriceChange > 0
                      ? 'text-green-400'
                      : priceTrendStats.avgPriceChange < 0
                        ? 'text-red-400'
                        : 'text-gray-400',
                  ]"
                >
                  {{ priceTrendStats.avgPriceChange > 0 ? "+" : ""
                  }}{{ Math.round(priceTrendStats.avgPriceChange) }}%
                </p>
              </div>
              <div
                class="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center"
              >
                <h3 class="text-sm font-medium text-green-300/80">
                  {{ t('archimonstres.salesAnalytics.priceTrends.biggestGainer') }}
                </h3>
                <p class="text-xl font-bold text-green-400 truncate">
                  {{ priceTrendStats.biggestGainer?.name || "N/A" }}
                </p>
                <p class="text-xs text-green-200/60">
                  +{{ Math.round(priceTrendStats.biggestGainer?.change || 0) }}%
                </p>
              </div>
              <div
                class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center"
              >
                <h3 class="text-sm font-medium text-red-300/80">
                  {{ t('archimonstres.salesAnalytics.priceTrends.biggestLoser') }}
                </h3>
                <p class="text-xl font-bold text-red-400 truncate">
                  {{ priceTrendStats.biggestLoser?.name || "N/A" }}
                </p>
                <p class="text-xs text-red-200/60">
                  {{ Math.round(priceTrendStats.biggestLoser?.change || 0) }}%
                </p>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="filteredPriceTrends.length === 0"
            class="relative z-10 p-10 text-center"
          >
            <div class="max-w-sm mx-auto">
              <div
                class="w-20 h-20 mx-auto bg-gray-700/50 rounded-2xl flex items-center justify-center mb-4"
              >
                <svg
                  class="w-10 h-10 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <p class="text-lg font-medium text-gray-300 mb-2">
                {{ t('archimonstres.salesAnalytics.priceTrends.emptyTitle') }}
              </p>
              <p class="text-gray-500">
                {{ t('archimonstres.salesAnalytics.priceTrends.emptyDescription') }}
              </p>
            </div>
          </div>

          <!-- Price Trends List -->
          <div
            v-else
            class="relative z-10 divide-y divide-blue-500/20 max-h-[500px] overflow-y-auto custom-scrollbar"
          >
            <div
              v-for="trend in filteredPriceTrends"
              :key="trend.name"
              class="p-4 hover:bg-blue-900/20 transition-all duration-200"
            >
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-14 h-14 rounded-xl overflow-hidden bg-gray-700/50 border border-blue-500/30 flex items-center justify-center"
                  >
                    <img
                      v-if="trend.image_url"
                      :src="trend.image_url"
                      :alt="trend.name"
                      class="w-full h-full object-cover"
                    />
                    <svg
                      v-else
                      class="w-7 h-7 text-blue-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2ha1 1 0 100-2H7z"
                        clip-rule="evenodd"/>
                        </svg>
                  </div>
                  <div>
                    <h4 class="font-semibold text-blue-100">{{ trend.name }}</h4>
                    <p class="text-sm text-blue-200/60">
                      {{ t('archimonstres.salesAnalytics.priceTrends.salesTracked', { count: trend.salesCount }) }}
                    </p>
                  </div>
                </div>

                <!-- Stats -->
                <div class="flex items-center gap-6">
                  <div class="text-center">
                    <p class="text-xs text-blue-300/60 uppercase tracking-wide">
                      {{ t('archimonstres.salesAnalytics.priceTrends.first') }}
                    </p>
                    <p class="font-bold text-blue-400">{{ formatKamasShort(trend.firstPrice) }}</p>
                    <p class="text-xs text-gray-500">{{ formatDateShort(trend.firstDate) }}</p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-blue-300/60 uppercase tracking-wide">
                      {{ t('archimonstres.salesAnalytics.priceTrends.latest') }}
                    </p>
                    <p class="font-bold text-yellow-400">
                      {{ formatKamasShort(trend.latestPrice) }}
                    </p>
                    <p class="text-xs text-gray-500">{{ formatDateShort(trend.latestDate) }}</p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-blue-300/60 uppercase tracking-wide">
                      {{ t('archimonstres.salesAnalytics.priceTrends.change') }}
                    </p>
                    <p
                      :class="[
                        'font-bold text-xl',
                        trend.priceChange > 0
                          ? 'text-green-400'
                          : trend.priceChange < 0
                            ? 'text-red-400'
                            : 'text-gray-400',
                      ]"
                    >
                      {{ trend.priceChange > 0 ? "+" : "" }}{{ Math.round(trend.priceChange) }}%
                    </p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-blue-300/60 uppercase tracking-wide">
                      {{ t('archimonstres.salesAnalytics.priceTrends.avg') }}
                    </p>
                    <p class="font-bold text-purple-400">{{ formatKamasShort(trend.avgPrice) }}</p>
                  </div>
                </div>
              </div>

              <!-- Mini Chart -->
              <div class="mt-4">
                <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{{ t('archimonstres.salesAnalytics.priceTrends.priceHistory') }}</span>
                  <span>{{ t('archimonstres.salesAnalytics.priceTrends.dataPoints', { count: trend.salesCount }) }}</span>
                </div>
                <div
                  class="relative h-14 bg-gray-700/50 rounded-xl p-2 flex items-end justify-between gap-0.5"
                >
                  <div
                    v-for="(sale, index) in trend.priceHistory.slice(-12)"
                    :key="index"
                    class="flex-1 rounded-t transition-all duration-200 hover:opacity-80 relative group cursor-pointer"
                    :style="{
                      height: `${Math.max(12, (sale.price / trend.maxPrice) * 100)}%`,
                      backgroundColor: getBarColor(sale.price, trend.firstPrice, trend.latestPrice),
                    }"
                  >
                    <!-- Tooltip -->
                    <div
                      class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-xl"
                    >
                      <p class="font-bold text-yellow-300">{{ formatKamas(sale.price) }}</p>
                      <p class="text-gray-400">{{ formatDateShort(sale.date) }}</p>
                    </div>
                  </div>
                </div>

                <!-- Trend Indicator -->
                <div class="flex items-center justify-center mt-3">
                  <div
                    :class="[
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border',
                      trend.priceChange > 5
                        ? 'bg-green-500/10 border-green-500/30 text-green-300'
                        : trend.priceChange < -5
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : 'bg-gray-700/50 border-gray-600/50 text-gray-300',
                    ]"
                  >
                    <svg
                      v-if="trend.priceChange > 5"
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    <svg
                      v-else-if="trend.priceChange < -5"
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M20 12H4"
                      />
                    </svg>
                    {{
                      trend.priceChange > 5
                        ? t('archimonstres.salesAnalytics.priceTrends.rising')
                        : trend.priceChange < -5
                          ? t('archimonstres.salesAnalytics.priceTrends.falling')
                          : t('archimonstres.salesAnalytics.priceTrends.stable')
                    }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Pricing Inconsistencies Tab -->
    <Transition name="fade" mode="out-in">
      <div v-if="analyticsSubTab === 'pricing-inconsistencies'" key="inconsistencies" class="space-y-6">
        <div
          class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-900/20 via-gray-800/80 to-red-900/20 border border-orange-500/30"
        >
          <div
            class="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5"
          ></div>

          <div class="relative z-10 p-6 border-b border-orange-500/20">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center gap-4">
                <div class="relative">
                  <div
                    class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20"
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div
                    v-if="pricingInconsistencies.length > 0"
                    class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-800 animate-bounce"
                  ></div>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-orange-200">
                    {{ t('archimonstres.salesAnalytics.inconsistencies.title') }}
                  </h3>
                  <p class="text-sm text-orange-200/60">
                    {{ t('archimonstres.salesAnalytics.inconsistencies.subtitle') }}
                  </p>
                </div>
              </div>

              <span
                :class="[
                  'px-4 py-2 rounded-full text-sm font-bold transition-all duration-300',
                  pricingInconsistencies.length > 0
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/50',
                ]"
              >
                {{ t('archimonstres.salesAnalytics.inconsistencies.count', pricingInconsistencies.length) }}
              </span>
            </div>
          </div>

          <!-- Perfect State -->
          <div
            v-if="pricingInconsistencies.length === 0"
            class="relative z-10 p-10 text-center"
          >
            <div class="max-w-sm mx-auto">
              <div class="relative mb-4">
                <div
                  class="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/20"
                >
                  <svg
                    class="w-10 h-10 text-white"
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
                </div>
                <div class="absolute -top-1 -right-4 text-2xl animate-bounce">🎉</div>
                <div class="absolute -bottom-1 -left-4 text-xl animate-bounce delay-150">⭐</div>
              </div>
              <p class="text-xl font-bold text-green-300 mb-2">
                {{ t('archimonstres.salesAnalytics.inconsistencies.perfectTitle') }} ✨
              </p>
              <p class="text-green-200/70 text-sm">
                {{ t('archimonstres.salesAnalytics.inconsistencies.perfectDescription') }}
              </p>
            </div>
          </div>

          <!-- Inconsistencies List -->
          <div
            v-else
            class="relative z-10 divide-y divide-orange-500/20 max-h-[500px] overflow-y-auto custom-scrollbar"
          >
            <div
              v-for="inconsistency in pricingInconsistencies"
              :key="inconsistency.name"
              class="p-4 hover:bg-orange-900/20 transition-all duration-200"
            >
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-4">
                  <!-- Monster Info -->
                  <div class="relative">
                    <div
                      class="w-14 h-14 rounded-xl overflow-hidden bg-gray-700/50 border-2 border-orange-500/30 flex items-center justify-center"
                    >
                      <img
                        v-if="inconsistency.image_url"
                        :src="inconsistency.image_url"
                        :alt="inconsistency.name"
                        class="w-full h-full object-cover"
                      />
                      <svg
                        v-else
                        class="w-7 h-7 text-orange-300"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                    <div
                      class="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <span class="text-white text-xs font-bold">!</span>
                    </div>
                  </div>
                  <div>
                    <h4 class="font-semibold text-orange-100">{{ inconsistency.name }}</h4>
                    <p class="text-sm text-orange-200/60">
                      {{ t('archimonstres.salesAnalytics.inconsistencies.itemsAndPrices', {
                        items: inconsistency.items.length,
                        prices: inconsistency.priceGroups.length
                      }) }}
                    </p>
                  </div>
                </div>

                <!-- Stats -->
                <div class="flex items-center gap-6">
                  <div class="text-center">
                    <p class="text-xs text-orange-300/60 uppercase tracking-wide">
                      {{ t('archimonstres.salesAnalytics.inconsistencies.range') }}
                    </p>
                    <p class="font-bold text-orange-300">
                      {{ formatKamasShort(inconsistency.minPrice) }} -
                      {{ formatKamasShort(inconsistency.maxPrice) }}
                    </p>
                    <p class="text-xs text-red-400">
                      {{ t('archimonstres.salesAnalytics.inconsistencies.variation', { percent: inconsistency.priceVariation }) }}
                    </p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-orange-300/60 uppercase tracking-wide">
                      {{ t('archimonstres.salesAnalytics.inconsistencies.average') }}
                    </p>
                    <p class="font-bold text-blue-400 text-lg">
                      {{ formatKamasShort(inconsistency.avgPrice) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Price Groups -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <div
                  v-for="group in inconsistency.priceGroups"
                  :key="group.price"
                  class="bg-gray-700/50 border border-gray-600/50 rounded-xl p-3 text-center"
                >
                  <p class="font-medium text-gray-200">{{ formatKamasShort(group.price) }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ group.count }}x</p>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="flex gap-2 flex-wrap">
                <button
                  @click="standardizeToLowest(inconsistency.name)"
                  class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-green-500/20 flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                  {{ t('archimonstres.salesAnalytics.inconsistencies.lowest') }} ({{ formatKamasShort(inconsistency.minPrice) }})
                </button>
                <button
                  @click="standardizeToHighest(inconsistency.name)"
                  class="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-red-500/20 flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                  {{ t('archimonstres.salesAnalytics.inconsistencies.highest') }} ({{ formatKamasShort(inconsistency.maxPrice) }})
                </button>
                <button
                  @click="standardizeToAverage(inconsistency.name)"
                  class="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 12H4"
                    />
                  </svg>
                  {{ t('archimonstres.salesAnalytics.inconsistencies.average') }} ({{ formatKamasShort(inconsistency.avgPrice) }})
                </button>
                <button
                  @click="selectMonsterItems(inconsistency.name)"
                  class="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500/50 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  {{ t('archimonstres.salesAnalytics.inconsistencies.selectAll') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
                   

<script setup>
import { ref, computed } from "vue";

const { t } = useI18n();

const props = defineProps({
  pendingItems: {
    type: Array,
    required: true,
  },
  soldItems: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["select-monster-items", "update-prices"]);

const analyticsTimeframe = ref("all");
const analyticsSortBy = ref("quantity");
const captureTimeframe = ref("all");
const trendTimeframe = ref("all");
const selectedTrendMonster = ref("");
const analyticsSubTab = ref("sales-analytics");

const pricingInconsistencies = computed(() => {
  const monsterGroups = {};
  props.pendingItems.forEach((item) => {
    const name = item.monsterName;
    if (!monsterGroups[name]) {
      monsterGroups[name] = [];
    }
    monsterGroups[name].push(item);
  });

  const inconsistencies = [];
  Object.entries(monsterGroups).forEach(([name, items]) => {
    if (items.length < 2) return;
    const prices = items.map((item) => item.price || 0);
    const uniquePrices = [...new Set(prices)];
    if (uniquePrices.length > 1) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceVariation =
        maxPrice > 0 ? ((maxPrice - minPrice) / minPrice) * 100 : 0;
      if (priceVariation > 5) {
        inconsistencies.push({
          name,
          items,
          minPrice,
          maxPrice,
          priceVariation: Math.round(priceVariation),
          avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          image_url: items[0].image_url,
          priceGroups: groupItemsByPrice(items),
        });
      }
    }
  });

  return inconsistencies.sort((a, b) => b.priceVariation - a.priceVariation);
});

const monstersWithPriceData = computed(() => {
  const monsterCounts = {};
  props.soldItems.forEach((item) => {
    monsterCounts[item.monsterName] = (monsterCounts[item.monsterName] || 0) + 1;
  });
  return Object.entries(monsterCounts)
    .filter(([, count]) => count >= 2)
    .map(([name]) => name)
    .sort();
});

const priceTrendStats = computed(() => {
  const trends = filteredPriceTrends.value;
  if (trends.length === 0) return null;
  const changes = trends.map((t) => t.priceChange).filter((c) => !isNaN(c));
  const avgChange =
    changes.length > 0 ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
  const biggestGainer = trends.reduce(
    (best, current) =>
      current.priceChange > (best?.priceChange || -Infinity) ? current : best,
    null
  );
  const biggestLoser = trends.reduce(
    (worst, current) =>
      current.priceChange < (worst?.priceChange || Infinity) ? current : worst,
    null
  );
  return {
    monstersCount: trends.length,
    avgPriceChange: avgChange,
    biggestGainer: biggestGainer
      ? { name: biggestGainer.name, change: biggestGainer.priceChange }
      : null,
    biggestLoser: biggestLoser
      ? { name: biggestLoser.name, change: biggestLoser.priceChange }
      : null,
  };
});

const filteredPriceTrends = computed(() => {
  const now = new Date();
  let filtered = [...props.soldItems];
  switch (trendTimeframe.value) {
    case "week":
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((item) => new Date(item.dateSold) >= weekAgo);
      break;
    case "month":
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filtered = filtered.filter((item) => new Date(item.dateSold) >= monthAgo);
      break;
  }
  if (selectedTrendMonster.value) {
    filtered = filtered.filter(
      (item) => item.monsterName === selectedTrendMonster.value
    );
  }
  const monsterTrends = {};
  filtered.forEach((item) => {
    const name = item.monsterName;
    if (!monsterTrends[name]) {
      monsterTrends[name] = {
        name,
        image_url: item.image_url,
        priceHistory: [],
        salesCount: 0,
      };
    }
    monsterTrends[name].priceHistory.push({
      price: item.soldPrice,
      date: item.dateSold,
    });
    monsterTrends[name].salesCount++;
  });
  return Object.values(monsterTrends)
    .filter((monster) => monster.salesCount >= 2)
    .map((monster) => {
      monster.priceHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
      const prices = monster.priceHistory.map((p) => p.price);
      const firstPrice = prices[0];
      const latestPrice = prices[prices.length - 1];
      const priceChange =
        firstPrice > 0 ? ((latestPrice - firstPrice) / firstPrice) * 100 : 0;
      return {
        ...monster,
        firstPrice,
        latestPrice,
        firstDate: monster.priceHistory[0].date,
        latestDate: monster.priceHistory[monster.priceHistory.length - 1].date,
        priceChange,
        avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
      };
    })
    .sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange));
});

const captureStats = computed(() => {
  const captures = getFilteredCaptures();
  if (captures.length === 0) {
    return {
      totalItems: 0,
      uniqueMonsters: 0,
      mostCaptured: null,
      avgPerDay: 0,
    };
  }
  const monsterCounts = {};
  captures.forEach((item) => {
    const name = item.monsterName;
    monsterCounts[name] = (monsterCounts[name] || 0) + (item.quantity || 1);
  });
  const mostCaptured = Object.entries(monsterCounts).sort(([, a], [, b]) => b - a)[0];
  const dates = captures.map((item) => new Date(item.dateAdded));
  const firstDate = new Date(Math.min(...dates));
  const lastDate = new Date(Math.max(...dates));
  const daysDiff = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
  const totalItems = captures.reduce((sum, item) => sum + (item.quantity || 1), 0);
  return {
    totalItems,
    uniqueMonsters: Object.keys(monsterCounts).length,
    mostCaptured: mostCaptured ? { name: mostCaptured[0], count: mostCaptured[1] } : null,
    avgPerDay: Math.round((totalItems / daysDiff) * 10) / 10,
  };
});

const captureRanking = computed(() => {
  const captures = getFilteredCaptures();
  const monsterStats = {};
  captures.forEach((item) => {
    const name = item.monsterName;
    if (!monsterStats[name]) {
      monsterStats[name] = {
        name,
        count: 0,
        firstCapture: item.dateAdded,
        lastCapture: item.dateAdded,
        image_url: item.image_url,
      };
    }
    monsterStats[name].count += item.quantity || 1;
    if (new Date(item.dateAdded) < new Date(monsterStats[name].firstCapture)) {
      monsterStats[name].firstCapture = item.dateAdded;
    }
    if (new Date(item.dateAdded) > new Date(monsterStats[name].lastCapture)) {
      monsterStats[name].lastCapture = item.dateAdded;
    }
  });
  Object.values(monsterStats).forEach((monster) => {
    const first = new Date(monster.firstCapture);
    const last = new Date(monster.lastCapture);
    monster.daysActive = Math.max(1, Math.ceil((last - first) / (1000 * 60 * 60 * 24))) + 1;
  });
  return Object.values(monsterStats).sort((a, b) => b.count - a.count);
});

const analyticsData = computed(() => {
  const filtered = getFilteredSoldItemsForAnalytics();
  if (filtered.length === 0) {
    return {
      uniqueMonsters: 0,
      bestSeller: null,
      highestRevenue: null,
      avgSalePrice: 0,
    };
  }
  const monsterStats = {};
  filtered.forEach((item) => {
    const name = item.monsterName;
    if (!monsterStats[name]) {
      monsterStats[name] = {
        name,
        quantity: 0,
        revenue: 0,
        salesCount: 0,
        prices: [],
        image_url: item.image_url,
        lastSold: item.dateSold,
      };
    }
    monsterStats[name].quantity += item.quantity || 1;
    monsterStats[name].revenue += (item.soldPrice || 0) * (item.quantity || 1);
    monsterStats[name].salesCount += 1;
    monsterStats[name].prices.push(item.soldPrice || 0);
    if (new Date(item.dateSold) > new Date(monsterStats[name].lastSold)) {
      monsterStats[name].lastSold = item.dateSold;
    }
  });
  const monsters = Object.values(monsterStats);
  monsters.forEach((monster) => {
    monster.avgPrice = monster.revenue / monster.quantity;
    monster.minPrice = Math.min(...monster.prices);
    monster.maxPrice = Math.max(...monster.prices);
  });
  const bestSeller = monsters.reduce(
    (best, current) => (current.quantity > (best?.quantity || 0) ? current : best),
    null
  );
  const highestRevenue = monsters.reduce(
    (best, current) => (current.revenue > (best?.revenue || 0) ? current : best),
    null
  );
  const totalRevenue = monsters.reduce((sum, monster) => sum + monster.revenue, 0);
  const totalQuantity = monsters.reduce((sum, monster) => sum + monster.quantity, 0);
  return {
    uniqueMonsters: monsters.length,
    bestSeller,
    highestRevenue,
    avgSalePrice: totalQuantity > 0 ? totalRevenue / totalQuantity : 0,
  };
});

const filteredAnalyticsData = computed(() => {
  const filtered = getFilteredSoldItemsForAnalytics();
  if (filtered.length === 0) return [];
  const monsterStats = {};
  filtered.forEach((item) => {
    const name = item.monsterName;
    if (!monsterStats[name]) {
      monsterStats[name] = {
        name,
        quantity: 0,
        revenue: 0,
        salesCount: 0,
        prices: [],
        image_url: item.image_url,
        lastSold: item.dateSold,
      };
    }
    monsterStats[name].quantity += item.quantity || 1;
    monsterStats[name].revenue += (item.soldPrice || 0) * (item.quantity || 1);
    monsterStats[name].salesCount += 1;
    monsterStats[name].prices.push(item.soldPrice || 0);
    if (new Date(item.dateSold) > new Date(monsterStats[name].lastSold)) {
      monsterStats[name].lastSold = item.dateSold;
    }
  });
  let monsters = Object.values(monsterStats);
  monsters.forEach((monster) => {
    monster.avgPrice = monster.revenue / monster.quantity;
    monster.minPrice = Math.min(...monster.prices);
    monster.maxPrice = Math.max(...monster.prices);
  });
  monsters.sort((a, b) => {
    switch (analyticsSortBy.value) {
      case "quantity":
        return b.quantity - a.quantity;
      case "revenue":
        return b.revenue - a.revenue;
      case "avgPrice":
        return b.avgPrice - a.avgPrice;
      case "frequency":
        return b.salesCount - a.salesCount;
      default:
        return b.quantity - a.quantity;
    }
  });
  return monsters;
});

const getFilteredSoldItemsForAnalytics = () => {
  const now = new Date();
  let filtered = [...props.soldItems];
  switch (analyticsTimeframe.value) {
    case "week":
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((item) => new Date(item.dateSold) >= weekAgo);
      break;
    case "month":
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filtered = filtered.filter((item) => new Date(item.dateSold) >= monthAgo);
      break;
    case "all":
    default:
      break;
  }
  return filtered;
};

const getFilteredCaptures = () => {
  const now = new Date();
  let filtered = [...props.pendingItems, ...props.soldItems];
  switch (captureTimeframe.value) {
    case "today":
      filtered = filtered.filter(
        (item) => new Date(item.dateAdded).toDateString() === now.toDateString()
      );
      break;
    case "week":
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((item) => new Date(item.dateAdded) >= weekAgo);
      break;
    case "month":
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filtered = filtered.filter((item) => new Date(item.dateAdded) >= monthAgo);
      break;
    case "all":
    default:
      break;
  }
  return filtered;
};

const groupItemsByPrice = (items) => {
  const groups = {};
  items.forEach((item) => {
    const price = item.price || 0;
    if (!groups[price]) {
      groups[price] = [];
    }
    groups[price].push(item);
  });
  return Object.entries(groups)
    .map(([price, items]) => ({
      price: parseInt(price),
      count: items.length,
      items,
    }))
    .sort((a, b) => a.price - b.price);
};

const standardizeMonsterPrice = (monsterName, targetPrice) => {
  const itemsToUpdate = props.pendingItems
    .filter((item) => item.monsterName === monsterName)
    .map((item) => ({ ...item, price: targetPrice }));
  emit("update-prices", itemsToUpdate);
};

const standardizeToLowest = (monsterName) => {
  const items = props.pendingItems.filter((item) => item.monsterName === monsterName);
  const lowestPrice = Math.min(...items.map((item) => item.price || 0));
  standardizeMonsterPrice(monsterName, lowestPrice);
};

const standardizeToHighest = (monsterName) => {
  const items = props.pendingItems.filter((item) => item.monsterName === monsterName);
  const highestPrice = Math.max(...items.map((item) => item.price || 0));
  standardizeMonsterPrice(monsterName, highestPrice);
};

const standardizeToAverage = (monsterName) => {
  const items = props.pendingItems.filter((item) => item.monsterName === monsterName);
  const prices = items.map((item) => item.price || 0);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  standardizeMonsterPrice(monsterName, avgPrice);
};

const getBarColor = (price, firstPrice, latestPrice) => {
  if (price > firstPrice * 1.1) return "#10b981";
  if (price < firstPrice * 0.9) return "#ef4444";
  return "#6b7280";
};

const formatKamas = (amount) => {
  if (amount === 0) return "0 ⚡";
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " ⚡";
};

const formatKamasShort = (amount) => {
  if (amount === 0) return "0";
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount));
};

const formatDateShort = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

  if (date.toDateString() === today) {
    return "Today";
  } else if (date.toDateString() === yesterday) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }
};

const selectMonsterItems = (monsterName) => {
  emit("select-monster-items", monsterName);
};
</script>

<style scoped>
/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.7);
}

/* Animations */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes bounce {
  0%,
  20%,
  53%,
  80%,
  100% {
    transform: translateY(0);
  }
  40%,
  43% {
    transform: translateY(-6px);
  }
  70% {
    transform: translateY(-3px);
  }
}

.animate-bounce {
  animation: bounce 1.5s infinite;
}

.delay-150 {
  animation-delay: 150ms;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>