<template>
  <div class="space-y-6">
    <!-- Analytics Header -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-100">Sales Analytics</h2>
          <p class="text-gray-400 mt-1">
            Track your best-selling monsters and sales performance
          </p>
        </div>
        <div class="flex gap-3">
          <select
            v-model="analyticsTimeframe"
            class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
          </select>
          <select
            v-model="analyticsSortBy"
            class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="quantity">Most Sold (Quantity)</option>
            <option value="revenue">Highest Revenue</option>
            <option value="avgPrice">Highest Avg Price</option>
            <option value="frequency">Most Frequent</option>
          </select>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gray-700 rounded-lg p-4 text-center">
          <h3 class="text-sm font-medium text-gray-300">
            Unique Monsters Sold
          </h3>
          <p class="text-2xl font-bold text-blue-400">
            {{ analyticsData.uniqueMonsters }}
          </p>
        </div>
        <div class="bg-gray-700 rounded-lg p-4 text-center">
          <h3 class="text-sm font-medium text-gray-300">Best Seller</h3>
          <p class="text-lg font-bold text-green-400">
            {{ analyticsData.bestSeller?.name || "N/A" }}
          </p>
          <p class="text-xs text-gray-400">
            {{ analyticsData.bestSeller?.quantity || 0 }} sold
          </p>
        </div>
        <div class="bg-gray-700 rounded-lg p-4 text-center">
          <h3 class="text-sm font-medium text-gray-300">
            Highest Revenue Monster
          </h3>
          <p class="text-lg font-bold text-yellow-400">
            {{ analyticsData.highestRevenue?.name || "N/A" }}
          </p>
          <p class="text-xs text-gray-400">
            {{ formatKamas(analyticsData.highestRevenue?.revenue || 0) }}
          </p>
        </div>
        <div class="bg-gray-700 rounded-lg p-4 text-center">
          <h3 class="text-sm font-medium text-gray-300">Avg Sale Price</h3>
          <p class="text-2xl font-bold text-purple-400">
            {{ formatKamas(analyticsData.avgSalePrice) }}
          </p>
        </div>
      </div>
    </div>

    <div class="bg-gray-700 border border-gray-600 rounded-lg">
      <div class="flex">
        <button
          @click="analyticsSubTab = 'sales-analytics'"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2',
            analyticsSubTab === 'sales-analytics'
              ? 'border-green-400 text-green-200 bg-green-900/20'
              : 'border-transparent text-gray-300 hover:text-white hover:bg-gray-600',
          ]"
        >
          📊 Sales Performance
        </button>
        <button
          @click="analyticsSubTab = 'capture-patterns'"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2',
            analyticsSubTab === 'capture-patterns'
              ? 'border-purple-400 text-purple-200 bg-purple-900/20'
              : 'border-transparent text-gray-300 hover:text-white hover:bg-gray-600',
          ]"
        >
          🎯 Capture Patterns
        </button>
        <button
          @click="analyticsSubTab = 'price-trends'"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2',
            analyticsSubTab === 'price-trends'
              ? 'border-blue-400 text-blue-200 bg-blue-900/20'
              : 'border-transparent text-gray-300 hover:text-white hover:bg-gray-600',
          ]"
        >
          📈 Price Trends
        </button>
        <button
          @click="analyticsSubTab = 'pricing-inconsistencies'"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2',
            analyticsSubTab === 'pricing-inconsistencies'
              ? 'border-orange-400 text-orange-200 bg-orange-900/20'
              : 'border-transparent text-gray-300 hover:text-white hover:bg-gray-600',
          ]"
        >
          ⚠️ Price Inconsistencies
        </button>
      </div>
    </div>

    <!-- Monster Sales Ranking -->
    <div v-if="analyticsSubTab === 'sales-analytics'" class="space-y-6">
      <div class="bg-gray-800 border border-gray-700 rounded-lg">
        <div class="p-6 border-b border-gray-700">
          <h3 class="text-xl font-semibold text-gray-100">
            Monster Sales Ranking
          </h3>
          <p class="text-sm text-gray-400 mt-1">
            {{ filteredAnalyticsData.length }} monsters • Showing top performers
          </p>
        </div>

        <div v-if="filteredAnalyticsData.length === 0" class="p-6 text-center">
          <div class="text-gray-400">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              ></path>
            </svg>
            <p class="text-lg font-medium">No sales data available</p>
            <p class="text-sm">Start selling monsters to see analytics here!</p>
          </div>
        </div>

        <div v-else class="divide-y divide-gray-700 max-h-96 overflow-y-auto">
          <div
            v-for="(monster, index) in filteredAnalyticsData"
            :key="monster.name"
            class="p-4 hover:bg-gray-750 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <!-- Ranking Badge -->
                <div
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                    index === 0
                      ? 'bg-yellow-500 text-yellow-900'
                      : index === 1
                      ? 'bg-gray-400 text-gray-900'
                      : index === 2
                      ? 'bg-amber-600 text-amber-100'
                      : 'bg-gray-600 text-gray-200',
                  ]"
                >
                  {{ index + 1 }}
                </div>

                <!-- Monster Info -->
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center"
                  >
                    <img
                      v-if="monster.image_url"
                      :src="monster.image_url"
                      :alt="monster.name"
                      class="w-full h-full object-cover"
                    />
                    <svg
                      v-else
                      class="w-6 h-6 text-yellow-200"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 class="font-medium text-gray-100">
                      {{ monster.name }}
                    </h4>
                    <p class="text-sm text-gray-400">
                      {{ monster.salesCount }} sale{{
                        monster.salesCount > 1 ? "s" : ""
                      }}
                      • Last sold {{ formatDate(monster.lastSold) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Stats -->
              <div class="flex items-center gap-6 text-right">
                <div>
                  <p class="text-sm text-gray-300">Quantity Sold</p>
                  <p class="font-bold text-blue-400">
                    {{ monster.quantity }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-300">Total Revenue</p>
                  <p class="font-bold text-green-400">
                    {{ formatKamas(monster.revenue) }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-300">Avg Price</p>
                  <p class="font-bold text-yellow-400">
                    {{ formatKamas(monster.avgPrice) }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-300">Price Range</p>
                  <p class="text-sm text-gray-400">
                    {{ formatKamas(monster.minPrice) }} -
                    {{ formatKamas(monster.maxPrice) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Progress Bar for Visual Representation -->
            <div class="mt-3">
              <div
                class="flex items-center justify-between text-xs text-gray-400 mb-1"
              >
                <span>Performance</span>
                <span
                  >{{
                    Math.round(
                      (monster.quantity /
                        (filteredAnalyticsData[0]?.quantity || 1)) *
                        100
                    )
                  }}% of top seller</span
                >
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                <div
                  class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  :style="{
                    width: `${Math.round(
                      (monster.quantity /
                        (filteredAnalyticsData[0]?.quantity || 1)) *
                        100
                    )}%`,
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="analyticsSubTab === 'capture-patterns'" class="space-y-6">
      <div class="bg-gray-800 border border-gray-700 rounded-lg">
        <div class="p-6 border-b border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-semibold text-gray-100">
                Capture Patterns
              </h3>
              <p class="text-sm text-gray-400 mt-1">
                Based on items you've added for sale (your captures)
              </p>
            </div>
            <select
              v-model="captureTimeframe"
              class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
              <option value="today">Today</option>
            </select>
          </div>

          <!-- Quick Capture Stats -->
          <div class="grid md:grid-cols-3 gap-4 mt-6">
            <div class="bg-gray-700 rounded-lg p-4 text-center">
              <h3 class="text-sm font-medium text-gray-300">Items Captured</h3>
              <p class="text-2xl font-bold text-purple-400">
                {{ captureStats.totalItems }}
              </p>
              <p class="text-xs text-gray-400">
                {{ captureStats.uniqueMonsters }} unique monsters
              </p>
            </div>
            <div class="bg-gray-700 rounded-lg p-4 text-center">
              <h3 class="text-sm font-medium text-gray-300">Most Captured</h3>
              <p class="text-lg font-bold text-green-400">
                {{ captureStats.mostCaptured?.name || "N/A" }}
              </p>
              <p class="text-xs text-gray-400">
                {{ captureStats.mostCaptured?.count || 0 }} times
              </p>
            </div>
            <div class="bg-gray-700 rounded-lg p-4 text-center">
              <h3 class="text-sm font-medium text-gray-300">Avg per Day</h3>
              <p class="text-2xl font-bold text-blue-400">
                {{ captureStats.avgPerDay }}
              </p>
            </div>
          </div>
        </div>

        <!-- Capture Ranking -->
        <div class="divide-y divide-gray-700 max-h-96 overflow-y-auto">
          <div
            v-for="(monster, index) in captureRanking"
            :key="monster.name"
            class="p-4 hover:bg-gray-750 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <!-- Ranking Badge -->
                <div
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                    index === 0
                      ? 'bg-purple-500 text-white'
                      : index === 1
                      ? 'bg-gray-400 text-gray-900'
                      : index === 2
                      ? 'bg-amber-600 text-amber-100'
                      : 'bg-gray-600 text-gray-200',
                  ]"
                >
                  {{ index + 1 }}
                </div>

                <!-- Monster Info -->
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center"
                  >
                    <img
                      v-if="monster.image_url"
                      :src="monster.image_url"
                      :alt="monster.name"
                      class="w-full h-full object-cover"
                    />
                    <svg
                      v-else
                      class="w-6 h-6 text-purple-200"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 class="font-medium text-gray-100">
                      {{ monster.name }}
                    </h4>
                    <p class="text-sm text-gray-400">
                      First captured {{ formatDate(monster.firstCapture) }} •
                      Last: {{ formatDate(monster.lastCapture) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Stats -->
              <div class="flex items-center gap-6 text-right">
                <div>
                  <p class="text-sm text-gray-300">Captured</p>
                  <p class="font-bold text-purple-400">{{ monster.count }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-300">% of Total</p>
                  <p class="font-bold text-blue-400">
                    {{
                      Math.round(
                        (monster.count / captureStats.totalItems) * 100
                      )
                    }}%
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-300">Days Active</p>
                  <p class="text-sm text-gray-400">
                    {{ monster.daysActive }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-3">
              <div class="w-full bg-gray-700 rounded-full h-2">
                <div
                  class="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
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
    <div v-if="analyticsSubTab === 'price-trends'" class="space-y-6">
      <div class="bg-gray-800 border border-gray-700 rounded-lg">
        <div class="p-6 border-b border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-semibold text-gray-100">Price Trends</h3>
              <p class="text-sm text-gray-400 mt-1">
                Track how prices change over time for each monster
              </p>
            </div>
            <div class="flex gap-3">
              <select
                v-model="trendTimeframe"
                class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="month">Last Month</option>
                <option value="week">Last Week</option>
              </select>
              <select
                v-model="selectedTrendMonster"
                class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Monsters</option>
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

          <!-- Price Trend Summary Stats -->
          <div class="grid md:grid-cols-4 gap-4 mt-6" v-if="priceTrendStats">
            <div class="bg-gray-700 rounded-lg p-4 text-center">
              <h3 class="text-sm font-medium text-gray-300">
                Monsters Tracked
              </h3>
              <p class="text-2xl font-bold text-blue-400">
                {{ priceTrendStats.monstersCount }}
              </p>
            </div>
            <div class="bg-gray-700 rounded-lg p-4 text-center">
              <h3 class="text-sm font-medium text-gray-300">
                Avg Price Change
              </h3>
              <p
                :class="[
                  'text-2xl font-bold',
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
            <div class="bg-gray-700 rounded-lg p-4 text-center">
              <h3 class="text-sm font-medium text-gray-300">Biggest Gainer</h3>
              <p class="text-lg font-bold text-green-400">
                {{ priceTrendStats.biggestGainer?.name || "N/A" }}
              </p>
              <p class="text-xs text-gray-400">
                +{{ Math.round(priceTrendStats.biggestGainer?.change || 0) }}%
              </p>
            </div>
            <div class="bg-gray-700 rounded-lg p-4 text-center">
              <h3 class="text-sm font-medium text-gray-300">Biggest Loser</h3>
              <p class="text-lg font-bold text-red-400">
                {{ priceTrendStats.biggestLoser?.name || "N/A" }}
              </p>
              <p class="text-xs text-gray-400">
                {{ Math.round(priceTrendStats.biggestLoser?.change || 0) }}%
              </p>
            </div>
          </div>
        </div>

        <!-- Price Trends List -->
        <div v-if="filteredPriceTrends.length === 0" class="p-6 text-center">
          <div class="text-gray-400">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              ></path>
            </svg>
            <p class="text-lg font-medium">No price trend data available</p>
            <p class="text-sm">
              You need at least 2 sales of the same monster to see price trends!
            </p>
          </div>
        </div>

        <div v-else class="divide-y divide-gray-700 max-h-96 overflow-y-auto">
          <div
            v-for="trend in filteredPriceTrends"
            :key="trend.name"
            class="p-4 hover:bg-gray-750 transition-colors"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-4">
                <!-- Monster Info -->
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center"
                  >
                    <img
                      v-if="trend.image_url"
                      :src="trend.image_url"
                      :alt="trend.name"
                      class="w-full h-full object-cover"
                    />
                    <svg
                      v-else
                      class="w-6 h-6 text-yellow-200"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 class="font-medium text-gray-100">
                      {{ trend.name }}
                    </h4>
                    <p class="text-sm text-gray-400">
                      {{ trend.salesCount }} sales tracked
                    </p>
                  </div>
                </div>
              </div>

              <!-- Price Stats -->
              <div class="flex items-center gap-6 text-right">
                <div>
                  <p class="text-sm text-gray-300">First Sale</p>
                  <p class="font-bold text-blue-400">
                    {{ formatKamas(trend.firstPrice) }}
                  </p>
                  <p class="text-xs text-gray-400">
                    {{ formatDate(trend.firstDate) }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-300">Latest Sale</p>
                  <p class="font-bold text-yellow-400">
                    {{ formatKamas(trend.latestPrice) }}
                  </p>
                  <p class="text-xs text-gray-400">
                    {{ formatDate(trend.latestDate) }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-300">Change</p>
                  <p
                    :class="[
                      'font-bold text-lg',
                      trend.priceChange > 0
                        ? 'text-green-400'
                        : trend.priceChange < 0
                        ? 'text-red-400'
                        : 'text-gray-400',
                    ]"
                  >
                    {{ trend.priceChange > 0 ? "+" : ""
                    }}{{ Math.round(trend.priceChange) }}%
                  </p>
                  <p
                    :class="[
                      'text-xs',
                      trend.priceChange > 0
                        ? 'text-green-300'
                        : trend.priceChange < 0
                        ? 'text-red-300'
                        : 'text-gray-400',
                    ]"
                  >
                    {{ trend.priceChange > 0 ? "+" : ""
                    }}{{ formatKamas(trend.latestPrice - trend.firstPrice) }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-300">Avg Price</p>
                  <p class="font-bold text-purple-400">
                    {{ formatKamas(trend.avgPrice) }}
                  </p>
                  <p class="text-xs text-gray-400">
                    Range: {{ formatKamas(trend.minPrice) }} -
                    {{ formatKamas(trend.maxPrice) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Mini Price Chart (Visual Representation) -->
            <div class="mt-4">
              <div
                class="flex items-center justify-between text-xs text-gray-400 mb-2"
              >
                <span>Price History</span>
                <span>{{ trend.salesCount }} data points</span>
              </div>
              <div
                class="relative h-12 bg-gray-700 rounded-lg p-2 flex items-end justify-between"
              >
                <!-- Simple bar chart showing price progression -->
                <div
                  v-for="(sale, index) in trend.priceHistory.slice(-10)"
                  :key="index"
                  class="flex-1 mx-0.5 rounded-t transition-all duration-200 hover:opacity-80 relative group"
                  :style="{
                    height: `${Math.max(
                      8,
                      (sale.price / trend.maxPrice) * 100
                    )}%`,
                    backgroundColor: getBarColor(
                      sale.price,
                      trend.firstPrice,
                      trend.latestPrice
                    ),
                  }"
                  :title="`${formatKamas(sale.price)} on ${formatDate(
                    sale.date
                  )}`"
                >
                  <!-- Tooltip -->
                  <div
                    class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
                  >
                    {{ formatKamas(sale.price) }}<br />
                    <span class="text-gray-300">{{
                      formatDate(sale.date)
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Trend Arrow -->
              <div class="flex items-center justify-center mt-2">
                <div
                  :class="[
                    'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                    trend.priceChange > 5
                      ? 'bg-green-900 text-green-300'
                      : trend.priceChange < -5
                      ? 'bg-red-900 text-red-300'
                      : 'bg-gray-700 text-gray-300',
                  ]"
                >
                  <svg
                    v-if="trend.priceChange > 5"
                    class="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    ></path>
                  </svg>
                  <svg
                    v-else-if="trend.priceChange < -5"
                    class="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                    ></path>
                  </svg>
                  <svg
                    v-else
                    class="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 12H4"
                    ></path>
                  </svg>
                  {{
                    trend.priceChange > 5
                      ? "Rising"
                      : trend.priceChange < -5
                      ? "Falling"
                      : "Stable"
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="analyticsSubTab === 'pricing-inconsistencies'" class="space-y-6">
      <div class="bg-gray-800 border border-gray-700 rounded-lg">
        <div class="p-6 border-b border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-semibold text-gray-100">
                Price Inconsistencies
              </h3>
              <p class="text-sm text-gray-400 mt-1">
                Monsters with different prices in your current listings
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'px-3 py-1.5 rounded-full text-sm font-bold border-2',
                  pricingInconsistencies.length > 0
                    ? 'bg-orange-600 text-white border-orange-400'
                    : 'bg-gray-700 text-gray-300 border-gray-600',
                ]"
              >
                {{ pricingInconsistencies.length }} inconsistenc{{
                  pricingInconsistencies.length !== 1 ? "ies" : "y"
                }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="pricingInconsistencies.length === 0" class="p-8 text-center">
          <div class="text-center max-w-md mx-auto">
            <div class="mb-4">
              <div
                class="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg"
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
                  ></path>
                </svg>
              </div>
            </div>
            <p class="text-xl font-bold text-green-300 mb-2">
              Perfect pricing! ✨
            </p>
            <p class="text-green-200/80">
              All your monsters have consistent pricing across listings.
            </p>
          </div>
        </div>

        <div v-else class="divide-y divide-gray-700 max-h-96 overflow-y-auto">
          <div
            v-for="inconsistency in pricingInconsistencies"
            :key="inconsistency.name"
            class="p-4 hover:bg-gray-750 transition-colors"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-4">
                <!-- Monster Info -->
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center relative"
                  >
                    <img
                      v-if="inconsistency.image_url"
                      :src="inconsistency.image_url"
                      :alt="inconsistency.name"
                      class="w-full h-full object-cover"
                    />
                    <svg
                      v-else
                      class="w-6 h-6 text-orange-200"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    <!-- Warning badge -->
                    <div
                      class="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
                    >
                      <span class="text-white text-xs font-bold">!</span>
                    </div>
                  </div>
                  <div>
                    <h4 class="font-medium text-gray-100">
                      {{ inconsistency.name }}
                    </h4>
                    <p class="text-sm text-gray-400">
                      {{ inconsistency.items.length }} items •
                      {{ inconsistency.priceGroups.length }} different prices
                    </p>
                  </div>
                </div>
              </div>

              <!-- Price Stats -->
              <div class="flex items-center gap-6 text-right">
                <div>
                  <p class="text-sm text-gray-300">Price Range</p>
                  <p class="font-bold text-orange-400">
                    {{ formatKamas(inconsistency.minPrice) }} -
                    {{ formatKamas(inconsistency.maxPrice) }}
                  </p>
                  <p class="text-xs text-orange-300">
                    +{{ inconsistency.priceVariation }}% variation
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-300">Average</p>
                  <p class="font-bold text-blue-400">
                    {{ formatKamas(inconsistency.avgPrice) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Price Groups Display -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div
                v-for="group in inconsistency.priceGroups"
                :key="group.price"
                class="bg-gray-700/50 border border-gray-600 rounded-lg p-3"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium text-gray-200">{{
                    formatKamas(group.price)
                  }}</span>
                  <span
                    class="text-sm text-gray-400 bg-gray-600 px-2 py-1 rounded"
                    >{{ group.count }}x</span
                  >
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="flex gap-2 flex-wrap">
              <button
                @click="standardizeToLowest(inconsistency.name)"
                class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                title="Set all to lowest price"
              >
                ↓ Use Lowest ({{ formatKamas(inconsistency.minPrice) }})
              </button>
              <button
                @click="standardizeToHighest(inconsistency.name)"
                class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                title="Set all to highest price"
              >
                ↑ Use Highest ({{ formatKamas(inconsistency.maxPrice) }})
              </button>
              <button
                @click="standardizeToAverage(inconsistency.name)"
                class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                title="Set all to average price"
              >
                ≈ Use Average ({{ formatKamas(inconsistency.avgPrice) }})
              </button>
              <!-- Quick select all items of this monster -->
              <button
                @click="selectMonsterItems(inconsistency.name)"
                class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
                title="Select all items for manual editing"
              >
                📝 Select All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

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
          avgPrice: Math.round(
            prices.reduce((a, b) => a + b, 0) / prices.length
          ),
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
    monsterCounts[item.monsterName] =
      (monsterCounts[item.monsterName] || 0) + 1;
  });
  return Object.entries(monsterCounts)
    .filter(([name, count]) => count >= 2)
    .map(([name]) => name)
    .sort();
});

const priceTrendStats = computed(() => {
  const trends = filteredPriceTrends.value;
  if (trends.length === 0) return null;
  const changes = trends.map((t) => t.priceChange).filter((c) => !isNaN(c));
  const avgChange =
    changes.length > 0
      ? changes.reduce((a, b) => a + b, 0) / changes.length
      : 0;
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
      const monthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
      );
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
  const mostCaptured = Object.entries(monsterCounts).sort(
    ([, a], [, b]) => b - a
  )[0];
  const dates = captures.map((item) => new Date(item.dateAdded));
  const firstDate = new Date(Math.min(...dates));
  const lastDate = new Date(Math.max(...dates));
  const daysDiff = Math.max(
    1,
    Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24))
  );
  const totalItems = captures.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );
  return {
    totalItems,
    uniqueMonsters: Object.keys(monsterCounts).length,
    mostCaptured: mostCaptured
      ? { name: mostCaptured[0], count: mostCaptured[1] }
      : null,
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
    monster.daysActive =
      Math.max(1, Math.ceil((last - first) / (1000 * 60 * 60 * 24))) + 1;
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
    (best, current) =>
      current.quantity > (best?.quantity || 0) ? current : best,
    null
  );
  const highestRevenue = monsters.reduce(
    (best, current) =>
      current.revenue > (best?.revenue || 0) ? current : best,
    null
  );
  const totalRevenue = monsters.reduce(
    (sum, monster) => sum + monster.revenue,
    0
  );
  const totalQuantity = monsters.reduce(
    (sum, monster) => sum + monster.quantity,
    0
  );
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
      const monthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
      );
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
      const monthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
      );
      filtered = filtered.filter(
        (item) => new Date(item.dateAdded) >= monthAgo
      );
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
  const items = props.pendingItems.filter(
    (item) => item.monsterName === monsterName
  );
  const lowestPrice = Math.min(...items.map((item) => item.price || 0));
  standardizeMonsterPrice(monsterName, lowestPrice);
};

const standardizeToHighest = (monsterName) => {
  const items = props.pendingItems.filter(
    (item) => item.monsterName === monsterName
  );
  const highestPrice = Math.max(...items.map((item) => item.price || 0));
  standardizeMonsterPrice(monsterName, highestPrice);
};

const standardizeToAverage = (monsterName) => {
  const items = props.pendingItems.filter(
    (item) => item.monsterName === monsterName
  );
  const prices = items.map((item) => item.price || 0);
  const avgPrice = Math.round(
    prices.reduce((a, b) => a + b, 0) / prices.length
  );
  standardizeMonsterPrice(monsterName, avgPrice);
};

const getBarColor = (price, firstPrice, latestPrice) => {
  if (price > firstPrice * 1.1) return "#10b981";
  if (price < firstPrice * 0.9) return "#ef4444";
  return "#6b7280";
};

const formatKamas = (amount) => {
  if (amount === 0) return "0 ⚡";
  return new Intl.NumberFormat("fr-FR").format(amount) + " ⚡";
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(
    now.getTime() - 24 * 60 * 60 * 1000
  ).toDateString();

  if (date.toDateString() === today) {
    return (
      "Today " +
      date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
  } else if (date.toDateString() === yesterday) {
    return (
      "Yesterday " +
      date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
  } else {
    return (
      date.toLocaleDateString("fr-FR") +
      " " +
      date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
  }
};

const selectMonsterItems = (monsterName) => {
  emit("select-monster-items", monsterName);
};
</script>
