<template>
  <div class="space-y-6">
    <!-- Tab Navigation -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg">
      <div class="flex border-b border-gray-700">
        <button
          @click="activeTab = 'sales'"
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeTab === 'sales'
              ? 'bg-blue-600 text-white border-b-2 border-blue-400'
              : 'text-gray-300 hover:text-white hover:bg-gray-700',
          ]"
        >
          Sales Management
        </button>
        <button
          @click="activeTab = 'analytics'"
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white border-b-2 border-blue-400'
              : 'text-gray-300 hover:text-white hover:bg-gray-700',
          ]"
        >
          Sales Analytics
        </button>
      </div>
    </div>

    <!-- Sales Management Tab -->
    <div v-if="activeTab === 'sales'" class="space-y-6">
      <!-- Header with Stats -->
      <div class="bg-gray-700 border border-gray-600 rounded-lg p-4">
        <div class="grid md:grid-cols-4 gap-4 text-center">
          <!-- Changed from 3 to 4 columns -->
          <div>
            <h3 class="text-lg font-semibold text-gray-100">Items for Sale</h3>
            <p class="text-2xl font-bold text-yellow-400">
              {{ totalPendingQuantity }}
            </p>
            <p class="text-sm text-gray-400">
              Preview: {{ formatKamas(previewTotal) }}
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-100">Slow Moving</h3>
            <p
              class="text-2xl font-bold"
              :class="
                slowMovingItems.length > 0 ? 'text-amber-400' : 'text-gray-500'
              "
            >
              {{ slowMovingItems.length }}
            </p>
            <p class="text-sm text-gray-400">
              {{ slowMovingThreshold }}+ days old
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-100">Today's Sales</h3>
            <p class="text-2xl font-bold text-green-400">
              {{ todaysSales.count }}
            </p>
            <p class="text-sm text-gray-400">
              {{ formatKamas(todaysSales.total) }}
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-100">Total Earned</h3>
            <p class="text-2xl font-bold text-blue-400">
              {{ allTimeSales.count }}
            </p>
            <p class="text-sm text-gray-400">
              {{ formatKamas(allTimeSales.total) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Add New Item Form -->
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 class="text-xl font-semibold text-gray-100 mb-4">
          Add Item for Sale
        </h3>
        <div class="grid md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Monster Name</label
            >
            <div class="relative">
              <input
                v-model="newItem.monsterName"
                @input="onMonsterNameInput"
                @focus="showSuggestions = true"
                @blur="onInputBlur"
                @keydown="handleKeydown"
                type="text"
                placeholder="e.g., Archi-monstre : Crakmitaine"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <!-- Suggestions Dropdown -->
              <div
                v-if="showSuggestions && filteredSuggestions.length > 0"
                class="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                <div
                  v-for="(suggestion, index) in filteredSuggestions"
                  :key="suggestion.id"
                  @mousedown.prevent="selectSuggestion(suggestion)"
                  :class="[
                    'px-3 py-2 cursor-pointer flex items-center gap-3 transition-colors',
                    index === selectedSuggestionIndex
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-600 text-gray-100',
                  ]"
                >
                  <!-- Monster Image -->
                  <img
                    v-if="suggestion.image_url"
                    :src="suggestion.image_url"
                    :alt="suggestion.nom"
                    class="w-8 h-8 rounded object-cover border border-gray-600"
                  />

                  <!-- Monster Info -->
                  <div class="flex-1">
                    <div class="font-medium">{{ suggestion.nom }}</div>
                    <div class="text-sm text-gray-400">
                      {{ suggestion.nom_normal }} • {{ suggestion.zone }}
                      <span v-if="suggestion.souszone">
                        ({{ suggestion.souszone }})</span
                      >
                    </div>
                    <!-- Smart Price Suggestion -->
                    <div
                      v-if="getSmartPrice(suggestion)"
                      class="text-xs text-blue-300"
                    >
                      Suggested: {{ formatKamas(getSmartPrice(suggestion)) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Quantity</label
            >
            <input
              v-model.number="newItem.quantity"
              type="number"
              min="1"
              placeholder="1"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Price per Unit (Kamas)</label
            >
            <input
              v-model.number="newItem.price"
              type="number"
              min="0"
              placeholder="0"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p
              v-if="newItem.quantity > 1 && newItem.price"
              class="text-xs text-gray-400 mt-1"
            >
              Total: {{ formatKamas(newItem.price * newItem.quantity) }}
            </p>
          </div>
          <div class="flex items-end">
            <button
              @click="addItem"
              :disabled="!canAddItem"
              class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Add to Sale List
            </button>
          </div>
        </div>
      </div>

      <div
        class="bg-gradient-to-br from-amber-900/20 via-gray-800 to-orange-900/20 border border-amber-500/30 rounded-lg relative overflow-hidden"
      >
        <!-- Animated background accent -->
        <div
          class="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 animate-pulse"
        ></div>

        <div class="p-4 border-b border-amber-500/20 relative z-10">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <!-- Enhanced icon with glow effect -->
                <div class="relative">
                  <svg
                    class="w-6 h-6 text-amber-400 drop-shadow-glow animate-pulse"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <!-- Notification dot -->
                  <div
                    v-if="slowMovingItems.length > 0"
                    class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-800 animate-bounce"
                  ></div>
                </div>

                <h3 class="text-xl font-bold text-amber-300">
                  ⚠️ Slow Moving Items
                </h3>
              </div>

              <!-- Enhanced count and threshold info with better styling -->
              <div class="flex items-center gap-3 text-sm">
                <span
                  :class="[
                    'px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-all duration-300',
                    slowMovingItems.length > 0
                      ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-500/25 animate-pulse'
                      : 'bg-gray-700 text-gray-300 border-gray-600',
                  ]"
                >
                  🐌 {{ slowMovingItems.length }} item{{
                    slowMovingItems.length !== 1 ? "s" : ""
                  }}
                </span>

                <span class="text-amber-200/80 font-medium">
                  stale for {{ slowMovingThreshold }}+ day{{
                    slowMovingThreshold !== 1 ? "s" : ""
                  }}
                </span>
              </div>
            </div>

            <!-- Enhanced threshold selector with better styling -->
            <div class="flex items-center gap-3">
              <label
                class="text-sm text-amber-200 font-medium whitespace-nowrap"
              >
                📊 Alert after:
              </label>
              <select
                v-model="slowMovingThreshold"
                @change="updateSlowMovingThreshold"
                class="px-4 py-2 bg-gray-700/80 border-2 border-amber-500/30 rounded-lg text-amber-100 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 backdrop-blur-sm"
              >
                <option :value="1">1 day</option>
                <option :value="3">3 days</option>
                <option :value="5">5 days</option>
                <option :value="7">7 days</option>
                <option :value="10">10 days</option>
                <option :value="14">14 days</option>
                <option :value="21">21 days</option>
                <option :value="30">30 days</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Content area with enhanced styling -->
        <div
          v-if="slowMovingItems.length === 0"
          class="p-8 text-center relative z-10"
        >
          <!-- Success state with celebration -->
          <div class="text-center max-w-md mx-auto">
            <div class="mb-4 relative">
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
              <!-- Floating celebration elements -->
              <div
                class="absolute -top-2 -right-2 text-2xl animate-bounce delay-100"
              >
                🎉
              </div>
              <div
                class="absolute -bottom-1 -left-2 text-xl animate-bounce delay-300"
              >
                ⭐
              </div>
            </div>

            <p class="text-xl font-bold text-green-300 mb-2">
              Excellent work! 🚀
            </p>
            <p class="text-green-200/80">
              All your items are moving fast! No items have been sitting for
              more than
              {{ slowMovingThreshold }} day{{
                slowMovingThreshold !== 1 ? "s" : ""
              }}.
            </p>
            <p class="text-sm text-green-300/60 mt-2">
              Keep up the great sales momentum! 💪
            </p>
          </div>
        </div>

        <div v-else class="p-4 relative z-10">
          <!-- Enhanced warning message with action button -->
          <div
            class="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/40 rounded-lg p-4 mb-4 backdrop-blur-sm"
          >
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                  <div
                    class="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <svg
                      class="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                </div>

                <div>
                  <p class="text-amber-100 font-bold text-lg">
                    📈 {{ slowMovingItems.length }} Item{{
                      slowMovingItems.length !== 1 ? "s" : ""
                    }}
                    Need Attention
                  </p>
                  <p class="text-amber-200/80 text-sm">
                    These items haven't sold in {{ slowMovingThreshold }}+ days.
                    Consider adjusting prices or removing them.
                  </p>
                </div>
              </div>

              <!-- Quick action button -->
              <button
                @click="selectAllSlowMovingItems"
                class="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-amber-500/25"
              >
                ⚡ Select All Slow Items
              </button>
            </div>
          </div>

          <!-- Enhanced Slow Moving Items List -->
          <div class="space-y-2 max-h-80 overflow-y-auto">
            <div
              v-for="(item, index) in slowMovingItems"
              :key="item.id"
              class="group flex items-center justify-between bg-gradient-to-r from-gray-800/60 to-gray-700/60 border border-amber-500/20 rounded-lg p-3 hover:from-amber-900/20 hover:to-orange-900/20 hover:border-amber-400/40 transition-all duration-200 backdrop-blur-sm"
            >
              <div class="flex items-center gap-3">
                <!-- Enhanced item display with urgency indicator -->
                <div class="relative">
                  <div
                    class="w-12 h-12 rounded-lg overflow-hidden bg-gray-600 flex items-center justify-center relative border-2 border-amber-500/30 shadow-lg"
                  >
                    <img
                      v-if="item.image_url"
                      :src="item.image_url"
                      :alt="item.monsterName"
                      class="w-full h-full object-cover"
                    />
                    <svg
                      v-else
                      class="w-6 h-6 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>

                    <!-- Quantity badge with enhanced styling -->
                    <div
                      v-if="item.quantity > 1"
                      class="absolute -top-1 -right-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg border border-white/20"
                    >
                      {{ item.quantity }}
                    </div>

                    <!-- Days indicator -->
                    <div
                      class="absolute -bottom-1 -left-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse"
                    >
                      {{ getDaysListed(item.dateAdded) }}
                    </div>
                  </div>

                  <!-- Urgency glow effect -->
                  <div
                    :class="[
                      'absolute inset-0 rounded-lg blur-sm -z-10 opacity-0 group-hover:opacity-30 transition-opacity duration-200',
                      getDaysListed(item.dateAdded) >= slowMovingThreshold * 2
                        ? 'bg-red-500/40'
                        : 'bg-amber-500/40',
                    ]"
                  ></div>
                </div>

                <div>
                  <h4
                    class="font-bold text-amber-100 text-lg group-hover:text-white transition-colors"
                  >
                    {{ item.monsterName }}
                  </h4>
                  <p
                    :class="[
                      'text-sm font-medium',
                      getDaysListed(item.dateAdded) >= slowMovingThreshold * 2
                        ? 'text-red-300'
                        : 'text-amber-300',
                    ]"
                  >
                    🕐 {{ getDaysListed(item.dateAdded) }} day{{
                      getDaysListed(item.dateAdded) !== 1 ? "s" : ""
                    }}
                    old
                    <span
                      v-if="
                        getDaysListed(item.dateAdded) >= slowMovingThreshold * 2
                      "
                      class="ml-2"
                      >⚠️ URGENT</span
                    >
                  </p>
                </div>
              </div>

              <div class="text-right">
                <p class="font-bold text-amber-200 text-lg">
                  {{ formatKamas(item.price * item.quantity) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Sales List -->
      <div class="bg-gray-800 border border-gray-700 rounded-lg">
        <div class="p-6 border-b border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-xl font-semibold text-gray-100">
                Items for Sale ({{ totalPendingQuantity }} items)
                <span v-if="selectedItems.length > 0" class="text-blue-400">
                  - {{ selectedItems.length }} selected
                </span>
              </h3>
              <p class="text-sm text-gray-400 mt-1">
                Preview Total: {{ formatKamas(previewTotal) }}
                <span v-if="selectedItems.length > 0" class="text-blue-300">
                  • Selected: {{ formatKamas(selectedItemsTotal) }}
                </span>
              </p>
            </div>

            <!-- Search and Sort Controls -->
            <div class="flex gap-3">
              <!-- Search Input -->
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search items..."
                  class="w-48 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <svg
                  class="absolute right-3 top-2.5 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>

              <!-- Sort Controls -->
              <div class="flex gap-2">
                <select
                  v-model="sortBy"
                  class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="dateAdded">Date Added</option>
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="total">Total Value</option>
                </select>

                <button
                  @click="toggleSortDirection"
                  class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 hover:bg-gray-600 transition-colors"
                  :title="
                    sortDirection === 'asc'
                      ? 'Sort Ascending'
                      : 'Sort Descending'
                  "
                >
                  <svg
                    class="w-4 h-4 transform transition-transform"
                    :class="{ 'rotate-180': sortDirection === 'desc' }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 15l7-7 7 7"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Bulk Operations Bar -->
          <div
            v-if="selectedItems.length > 0"
            class="bg-gray-700 border border-gray-600 rounded-lg p-4 mb-4"
          >
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center gap-4 flex-wrap">
                <span class="text-gray-100 font-medium">
                  {{ selectedItems.length }} item{{
                    selectedItems.length > 1 ? "s" : ""
                  }}
                  selected
                </span>

                <!-- Bulk Price Adjustment -->
                <div class="flex items-center gap-2 flex-wrap">
                  <label class="text-sm text-gray-300 whitespace-nowrap"
                    >Adjust prices:</label
                  >
                  <select
                    v-model="bulkPriceAction"
                    class="px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="set">Set to</option>
                    <option value="increase">Increase by</option>
                    <option value="decrease">Decrease by</option>
                    <option value="multiply">Multiply by</option>
                  </select>
                  <input
                    v-model.number="bulkPriceValue"
                    type="number"
                    :min="bulkPriceAction === 'multiply' ? 0.1 : 0"
                    :step="bulkPriceAction === 'multiply' ? 0.1 : 1"
                    placeholder="0"
                    class="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    @click="applyBulkPriceChange"
                    :disabled="!bulkPriceValue || bulkPriceValue <= 0"
                    class="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <!-- Bulk Action Buttons -->
              <div class="flex gap-2 flex-wrap">
                <button
                  @click="bulkMarkAsSold"
                  class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                >
                  Mark All as Sold
                </button>
                <button
                  @click="bulkDelete"
                  class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  Delete Selected
                </button>
                <button
                  @click="clearSelection"
                  class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>

          <!-- Select All Controls -->
          <div class="flex items-center gap-4 mb-4 flex-wrap">
            <label class="flex items-center gap-2 cursor-pointer">
              <div class="relative">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate="isPartiallySelected"
                  @change="toggleSelectAll"
                  class="sr-only"
                />
                <div
                  :class="[
                    'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                    isAllSelected
                      ? 'bg-blue-600 border-blue-600'
                      : isPartiallySelected
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-gray-700 border-gray-600 hover:border-gray-500',
                  ]"
                >
                  <!-- Checkmark for fully selected -->
                  <svg
                    v-if="isAllSelected"
                    class="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <!-- Dash for partially selected -->
                  <div
                    v-else-if="isPartiallySelected"
                    class="w-2 h-0.5 bg-white rounded"
                  ></div>
                </div>
              </div>
              <span class="text-sm text-gray-300">
                {{ isAllSelected ? "Deselect All" : "Select All" }}
                {{
                  filteredAndSortedPendingItems.length > 0
                    ? `(${filteredAndSortedPendingItems.length})`
                    : ""
                }}
              </span>
            </label>

            <!-- Quick Select Options -->
            <div class="flex gap-4 text-sm">
              <button
                @click="selectByPriceRange"
                class="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                Select by price range
              </button>
              <button
                @click="selectByMonsterType"
                class="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                Select same monster types
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="filteredAndSortedPendingItems.length === 0"
          class="p-6 text-center"
        >
          <p class="text-gray-400">
            {{
              searchQuery
                ? "No items match your search"
                : "No items currently listed for sale"
            }}
          </p>
        </div>

        <div v-else class="divide-y divide-gray-700 h-96 overflow-y-auto">
          <div
            v-for="item in filteredAndSortedPendingItems"
            :key="item.id"
            class="p-4 hover:bg-gray-750 transition-colors"
            :class="{
              'bg-blue-900 bg-opacity-20': selectedItems.includes(item.id),
            }"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <!-- Custom Styled Checkbox -->
                <label class="cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="selectedItems.includes(item.id)"
                    @change="toggleItemSelection(item.id)"
                    class="sr-only"
                  />
                  <div
                    :class="[
                      'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                      selectedItems.includes(item.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-gray-700 border-gray-600 hover:border-gray-500',
                    ]"
                  >
                    <svg
                      v-if="selectedItems.includes(item.id)"
                      class="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                </label>

                <div
                  class="w-10 h-10 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center relative"
                >
                  <img
                    v-if="item.image_url"
                    :src="item.image_url"
                    alt="monster"
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
                  <!-- Quantity Badge -->
                  <div
                    v-if="item.quantity > 1"
                    class="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {{ item.quantity }}
                  </div>
                </div>
                <div>
                  <h4 class="font-medium text-gray-100">
                    {{ item.monsterName }}
                    <span
                      v-if="item.quantity > 1"
                      class="text-gray-400 text-sm"
                    >
                      ({{ item.quantity }}x)
                    </span>
                  </h4>
                  <p class="text-sm text-gray-400">
                    Added {{ formatDate(item.dateAdded) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <!-- Enhanced Price Editor -->
                <div class="flex items-center gap-2">
                  <div class="relative">
                    <!-- Display Mode -->
                    <div
                      v-if="!editingPrice[item.id]"
                      @click="startEditingPrice(item)"
                      class="flex items-center gap-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors group min-w-24"
                    >
                      <span class="text-gray-100 font-medium">{{
                        formatPriceForDisplay(item.price)
                      }}</span>
                      <svg
                        class="w-3 h-3 text-gray-400 group-hover:text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        ></path>
                      </svg>
                    </div>

                    <!-- Edit Mode -->
                    <div v-else class="flex items-center gap-1">
                      <input
                        :ref="(el) => (priceInputRefs[item.id] = el)"
                        v-model.number="tempPrices[item.id]"
                        @blur="finishEditingPrice(item)"
                        @keydown.enter="finishEditingPrice(item)"
                        @keydown.escape="cancelEditingPrice(item)"
                        @input="validatePriceInput(item)"
                        type="number"
                        min="0"
                        step="1"
                        class="w-24 px-2 py-1 bg-gray-600 border border-blue-500 rounded text-gray-100 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        :class="{
                          'border-red-500 focus:ring-red-400':
                            priceErrors[item.id],
                          'border-green-500 focus:ring-green-400':
                            priceChanged[item.id] && !priceErrors[item.id],
                        }"
                      />
                      <div class="flex flex-col gap-1">
                        <button
                          @click="finishEditingPrice(item)"
                          :disabled="priceErrors[item.id]"
                          class="p-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-xs transition-colors"
                          title="Save price"
                        >
                          <svg
                            class="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                        </button>
                        <button
                          @click="cancelEditingPrice(item)"
                          class="p-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
                          title="Cancel editing"
                        >
                          <svg
                            class="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M6 18L18 6M6 6l12 12"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Price Error Message -->
                    <div
                      v-if="priceErrors[item.id]"
                      class="absolute top-full left-0 mt-1 px-2 py-1 bg-red-600 text-white text-xs rounded shadow-lg whitespace-nowrap z-10"
                    >
                      {{ priceErrors[item.id] }}
                    </div>

                    <!-- Price Change Indicator -->
                    <div
                      v-if="priceChanged[item.id] && !editingPrice[item.id]"
                      class="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    ></div>
                  </div>
                  <span class="text-yellow-400 font-medium">⚡</span>
                </div>

                <!-- Total Price Display -->
                <div class="text-right min-w-20">
                  <p class="text-sm text-gray-300">Total:</p>
                  <p class="font-bold text-yellow-400">
                    {{
                      formatKamas(
                        (editingPrice[item.id]
                          ? tempPrices[item.id] || 0
                          : item.price) * item.quantity
                      )
                    }}
                  </p>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2">
                  <button
                    @click="confirmSale(item)"
                    class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                  >
                    Sold!
                  </button>
                  <button
                    @click="removeItem(item.id)"
                    class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sales History -->
      <div class="bg-gray-800 border border-gray-700 rounded-lg">
        <div class="p-6 border-b border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-gray-100">Sales History</h3>
            <div class="flex gap-2">
              <select
                v-model="historyFilter"
                class="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm focus:ring-1 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="all">All Time</option>
              </select>
              <button
                v-if="soldItems.length > 0"
                @click="clearHistory"
                class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredSoldItems.length === 0" class="p-6 text-center">
          <p class="text-gray-400">No sales recorded yet</p>
        </div>

        <div v-else class="divide-y divide-gray-700 max-h-96 overflow-y-auto">
          <div v-for="item in filteredSoldItems" :key="item.id" class="p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center relative"
                >
                  <img
                    v-if="item.image_url"
                    :src="item.image_url"
                    :alt="item.nom"
                    class="w-8 h-8 rounded object-cover border border-gray-600"
                  />
                  <div
                    v-if="item.quantity > 1"
                    class="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    {{ item.quantity }}
                  </div>
                </div>
                <div>
                  <h4 class="font-medium text-gray-100">
                    {{ item.monsterName }}
                    <span
                      v-if="item.quantity > 1"
                      class="text-gray-400 text-sm"
                    >
                      ({{ item.quantity }}x @
                      {{ formatKamas(item.soldPrice) }} each)
                    </span>
                  </h4>
                  <p class="text-sm text-gray-400">
                    Sold {{ formatDate(item.dateSold) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <p class="font-bold text-green-400">
                    {{ formatKamas(item.soldPrice * item.quantity) }}
                  </p>
                  <p
                    v-if="item.originalPrice !== item.soldPrice"
                    class="text-xs text-gray-500 line-through"
                  >
                    {{ formatKamas(item.originalPrice * item.quantity) }}
                  </p>
                </div>
                <!-- Undo Sale Button -->
                <button
                  @click="undoSale(item)"
                  class="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs transition-colors"
                  title="Undo sale - move back to items for sale"
                >
                  ↶ Undo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sales Analytics Tab -->
    <div v-if="activeTab === 'analytics'" class="space-y-6">
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
              {{ filteredAnalyticsData.length }} monsters • Showing top
              performers
            </p>
          </div>

          <div
            v-if="filteredAnalyticsData.length === 0"
            class="p-6 text-center"
          >
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
              <p class="text-sm">
                Start selling monsters to see analytics here!
              </p>
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
                <h3 class="text-sm font-medium text-gray-300">
                  Items Captured
                </h3>
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
                <h3 class="text-xl font-semibold text-gray-100">
                  Price Trends
                </h3>
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
                <h3 class="text-sm font-medium text-gray-300">
                  Biggest Gainer
                </h3>
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
                You need at least 2 sales of the same monster to see price
                trends!
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
    </div>

    <!-- Price Range Selection Modal -->
    <div
      v-if="showPriceRangeModal"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      @click.self="showPriceRangeModal = false"
    >
      <div
        class="bg-gray-800 border border-gray-600 rounded-lg p-6 w-full max-w-md shadow-2xl"
      >
        <h3 class="text-lg font-semibold text-gray-100 mb-4">
          Select by Price Range
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Minimum Price</label
            >
            <input
              v-model.number="priceRangeMin"
              type="number"
              min="0"
              placeholder="0"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Maximum Price</label
            >
            <input
              v-model.number="priceRangeMax"
              type="number"
              min="0"
              placeholder="999999"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div class="flex gap-3 pt-4">
            <button
              @click="applyPriceRangeSelection"
              class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Select Items
            </button>
            <button
              @click="showPriceRangeModal = false"
              class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Monster Type Selection Modal -->
    <div
      v-if="showMonsterTypeModal"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      @click.self="showMonsterTypeModal = false"
    >
      <div
        class="bg-gray-800 border border-gray-600 rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
      >
        <h3 class="text-lg font-semibold text-gray-100 mb-4">
          Select by Monster Type
        </h3>
        <div class="flex-1 overflow-y-auto space-y-2 mb-4">
          <div
            v-for="monsterType in uniqueMonsterTypes"
            :key="monsterType.name"
            class="flex items-center justify-between p-3 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <label class="flex items-center gap-3 cursor-pointer flex-1">
              <div class="relative">
                <input
                  type="checkbox"
                  :checked="selectedMonsterTypes.includes(monsterType.name)"
                  @change="toggleMonsterTypeSelection(monsterType.name)"
                  class="sr-only"
                />
                <div
                  :class="[
                    'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                    selectedMonsterTypes.includes(monsterType.name)
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-gray-700 border-gray-600 hover:border-gray-500',
                  ]"
                >
                  <svg
                    v-if="selectedMonsterTypes.includes(monsterType.name)"
                    class="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
              </div>
              <span class="text-gray-100 flex-1">{{ monsterType.name }}</span>
            </label>
            <span class="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">{{
              monsterType.count
            }}</span>
          </div>
        </div>
        <div class="flex gap-3 pt-4 border-t border-gray-700">
          <button
            @click="applyMonsterTypeSelection"
            class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Select Items
          </button>
          <button
            @click="showMonsterTypeModal = false"
            class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  server: {
    type: Object,
    required: true,
  },
  character: {
    type: Object,
    required: true,
  },
  monstersData: {
    type: Array,
    default: () => [],
  },
});

const activeTab = ref("sales");
const analyticsTimeframe = ref("all");
const analyticsSortBy = ref("quantity");

const newItem = ref({
  monsterName: "",
  price: null,
  quantity: 1,
});

const pendingItems = ref([]);
const soldItems = ref([]);
const historyFilter = ref("today");
const showSuggestions = ref(false);
const selectedSuggestionIndex = ref(-1);

const searchQuery = ref("");
const sortBy = ref("dateAdded");
const sortDirection = ref("desc");

const selectedItems = ref([]);
const bulkPriceAction = ref("set");
const bulkPriceValue = ref(null);

const showPriceRangeModal = ref(false);
const showMonsterTypeModal = ref(false);
const priceRangeMin = ref(0);
const priceRangeMax = ref(999999);
const selectedMonsterTypes = ref([]);

const editingPrice = ref({});
const tempPrices = ref({});
const priceErrors = ref({});
const priceChanged = ref({});
const priceInputRefs = ref({});

const captureTimeframe = ref("all");

const trendTimeframe = ref("all");
const selectedTrendMonster = ref("");

const analyticsSubTab = ref("sales-analytics");

const slowMovingThreshold = ref(7); // Default to 7 days

const slowMovingItems = computed(() => {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - slowMovingThreshold.value);

  return pendingItems.value
    .filter((item) => new Date(item.dateAdded) <= threshold)
    .sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded)); // Oldest first
});

const monstersWithPriceData = computed(() => {
  const monsterCounts = {};
  soldItems.value.forEach((item) => {
    monsterCounts[item.monsterName] =
      (monsterCounts[item.monsterName] || 0) + 1;
  });

  // Only show monsters with 2+ sales for trend analysis
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
  let filtered = [...soldItems.value];

  // Apply timeframe filter
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

  // Apply monster filter
  if (selectedTrendMonster.value) {
    filtered = filtered.filter(
      (item) => item.monsterName === selectedTrendMonster.value
    );
  }

  // Group by monster and calculate trends
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

  // Calculate trend statistics for each monster
  const trends = Object.values(monsterTrends)
    .filter((monster) => monster.salesCount >= 2) // Need at least 2 sales for trend
    .map((monster) => {
      // Sort by date
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
    .sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange)); // Sort by biggest change

  return trends;
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

  // Group by monster
  const monsterCounts = {};
  captures.forEach((item) => {
    const name = item.monsterName;
    monsterCounts[name] = (monsterCounts[name] || 0) + (item.quantity || 1);
  });

  const mostCaptured = Object.entries(monsterCounts).sort(
    ([, a], [, b]) => b - a
  )[0];

  // Calculate time-based stats
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

  // Calculate days active for each monster
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

const getDaysListed = (dateAdded) => {
  const now = new Date();
  const added = new Date(dateAdded);
  const diffTime = Math.abs(now - added);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const bulkRemoveSlowMovingItems = () => {
  const count = slowMovingItems.value.length;
  if (!confirm(`Remove ${count} slow-moving items from your listing?`)) return;

  const slowMovingIds = slowMovingItems.value.map((item) => item.id);
  pendingItems.value = pendingItems.value.filter(
    (item) => !slowMovingIds.includes(item.id)
  );

  // Remove from selection if any were selected
  selectedItems.value = selectedItems.value.filter(
    (id) => !slowMovingIds.includes(id)
  );

  saveData();
};

const updateSlowMovingThreshold = () => {
  // Save the threshold preference
  localStorage.setItem(
    `slow_moving_threshold_${props.server.id}_${props.character.id}`,
    slowMovingThreshold.value.toString()
  );
};

const getFilteredSoldItemsForAnalytics = () => {
  const now = new Date();
  let filtered = [...soldItems.value];

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

const getPendingItemsKey = () => {
  return `selling_pending_${props.server.id}_${props.character.id}`;
};

const getSoldItemsKey = () => {
  return `selling_sold_${props.server.id}_${props.character.id}`;
};

const getPriceHistoryKey = () => {
  return `selling_price_history_${props.server.id}_${props.character.id}`;
};

onMounted(() => {
  loadData();
});

watch([() => props.server, () => props.character], () => {
  loadData();
  selectedItems.value = [];
  editingPrice.value = {};
  tempPrices.value = {};
  priceErrors.value = {};
  priceChanged.value = {};
});

watch(activeTab, (newTab) => {
  if (newTab === "analytics" && !analyticsSubTab.value) {
    analyticsSubTab.value = "sales-analytics";
  }
});

const formatPriceForDisplay = (price) => {
  if (!price && price !== 0) return "0";
  return new Intl.NumberFormat("fr-FR").format(price);
};

const startEditingPrice = (item) => {
  editingPrice.value[item.id] = true;
  tempPrices.value[item.id] = item.price || 0;
  priceErrors.value[item.id] = null;

  nextTick(() => {
    const input = priceInputRefs.value[item.id];
    if (input) {
      input.focus();
      input.select();
    }
  });
};

const validatePriceInput = (item) => {
  const value = tempPrices.value[item.id];

  if (value === null || value === undefined || value === "") {
    priceErrors.value[item.id] = "Price is required";
    return false;
  }

  if (isNaN(value) || value < 0) {
    priceErrors.value[item.id] = "Price must be a positive number";
    return false;
  }

  if (value > 999999999) {
    priceErrors.value[item.id] = "Price is too high";
    return false;
  }

  priceErrors.value[item.id] = null;
  return true;
};

const finishEditingPrice = (item) => {
  if (!validatePriceInput(item)) {
    return;
  }

  const newPrice = Math.floor(tempPrices.value[item.id] || 0);
  const oldPrice = item.price;

  if (newPrice !== oldPrice) {
    item.price = newPrice;
    priceChanged.value[item.id] = true;

    setTimeout(() => {
      priceChanged.value[item.id] = false;
    }, 2000);

    saveData();
  }

  editingPrice.value[item.id] = false;
  tempPrices.value[item.id] = null;
  priceErrors.value[item.id] = null;
};

const cancelEditingPrice = (item) => {
  editingPrice.value[item.id] = false;
  tempPrices.value[item.id] = null;
  priceErrors.value[item.id] = null;
};

const loadData = () => {
  const pendingKey = getPendingItemsKey();
  const pendingSaved = localStorage.getItem(pendingKey);
  const loadedPending = pendingSaved ? JSON.parse(pendingSaved) : [];

  pendingItems.value = loadedPending.map((item) => ({
    ...item,
    quantity: item.quantity || 1,
  }));

  const soldKey = getSoldItemsKey();
  const soldSaved = localStorage.getItem(soldKey);
  const loadedSold = soldSaved ? JSON.parse(soldSaved) : [];

  soldItems.value = loadedSold.map((item) => ({
    ...item,
    quantity: item.quantity || 1,
  }));

  const thresholdKey = `slow_moving_threshold_${props.server.id}_${props.character.id}`;
  const savedThreshold = localStorage.getItem(thresholdKey);
  if (savedThreshold) {
    slowMovingThreshold.value = parseInt(savedThreshold);
  }
};

const saveData = () => {
  localStorage.setItem(
    getPendingItemsKey(),
    JSON.stringify(pendingItems.value)
  );
  localStorage.setItem(getSoldItemsKey(), JSON.stringify(soldItems.value));
};

const getBarColor = (price, firstPrice, latestPrice) => {
  if (price > firstPrice * 1.1) return "#10b981"; // green for higher prices
  if (price < firstPrice * 0.9) return "#ef4444"; // red for lower prices
  return "#6b7280"; // gray for stable prices
};

const savePriceHistory = (monsterId, monsterName, price) => {
  const key = getPriceHistoryKey();
  const existing = JSON.parse(localStorage.getItem(key) || "{}");

  if (!existing[monsterId]) {
    existing[monsterId] = {
      name: monsterName,
      prices: [],
    };
  }

  existing[monsterId].prices.push({
    price: price,
    date: new Date().toISOString(),
  });

  existing[monsterId].prices = existing[monsterId].prices.slice(-10);
  localStorage.setItem(key, JSON.stringify(existing));
};

const getSmartPrice = (monster) => {
  const key = getPriceHistoryKey();
  const priceHistory = JSON.parse(localStorage.getItem(key) || "{}");

  if (!priceHistory[monster.id] || !priceHistory[monster.id].prices.length) {
    return null;
  }

  const prices = priceHistory[monster.id].prices;
  const lastPrice = prices[prices.length - 1].price;

  if (prices.length >= 3) {
    const recentPrices = prices.slice(-3).map((p) => p.price);
    const average = Math.round(
      recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length
    );
    return average;
  }

  return lastPrice;
};

const canAddItem = computed(() => {
  return (
    newItem.value.monsterName.trim() &&
    newItem.value.price > 0 &&
    newItem.value.quantity >= 1
  );
});

const filteredSuggestions = computed(() => {
  if (!newItem.value.monsterName || !props.monstersData) return [];

  const searchTerm = newItem.value.monsterName.toLowerCase();
  return props.monstersData
    .filter(
      (monster) =>
        (monster.nom && monster.nom.toLowerCase().includes(searchTerm)) ||
        (monster.nom_normal &&
          monster.nom_normal.toLowerCase().includes(searchTerm)) ||
        (monster.zone && monster.zone.toLowerCase().includes(searchTerm)) ||
        (monster.souszone &&
          monster.souszone.toLowerCase().includes(searchTerm))
    )
    .slice(0, 8);
});

const filteredAndSortedPendingItems = computed(() => {
  let filtered = [...pendingItems.value];

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((item) =>
      item.monsterName.toLowerCase().includes(query)
    );
  }

  filtered.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy.value) {
      case "name":
        aValue = a.monsterName.toLowerCase();
        bValue = b.monsterName.toLowerCase();
        break;
      case "price":
        aValue = a.price || 0;
        bValue = b.price || 0;
        break;
      case "total":
        aValue = (a.price || 0) * (a.quantity || 1);
        bValue = (b.price || 0) * (b.quantity || 1);
        break;
      case "dateAdded":
      default:
        aValue = new Date(a.dateAdded);
        bValue = new Date(b.dateAdded);
        break;
    }

    if (sortDirection.value === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  return filtered;
});
const selectedItemsTotal = computed(() => {
  return selectedItems.value.reduce((total, itemId) => {
    const item = pendingItems.value.find((i) => i.id === itemId);
    return total + (item ? (item.price || 0) * (item.quantity || 1) : 0);
  }, 0);
});

const isAllSelected = computed(() => {
  return (
    filteredAndSortedPendingItems.value.length > 0 &&
    filteredAndSortedPendingItems.value.every((item) =>
      selectedItems.value.includes(item.id)
    )
  );
});

const isPartiallySelected = computed(() => {
  return selectedItems.value.length > 0 && !isAllSelected.value;
});

const uniqueMonsterTypes = computed(() => {
  const types = {};
  filteredAndSortedPendingItems.value.forEach((item) => {
    if (!types[item.monsterName]) {
      types[item.monsterName] = 0;
    }
    types[item.monsterName]++;
  });

  return Object.entries(types)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
});

const totalPendingQuantity = computed(() => {
  return pendingItems.value.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );
});

const previewTotal = computed(() => {
  return pendingItems.value.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );
});

const todaysSales = computed(() => {
  const today = new Date().toDateString();
  const todaysItems = soldItems.value.filter(
    (item) => new Date(item.dateSold).toDateString() === today
  );
  return {
    count: todaysItems.reduce((total, item) => total + (item.quantity || 1), 0),
    total: todaysItems.reduce(
      (total, item) => total + item.soldPrice * (item.quantity || 1),
      0
    ),
  };
});

const allTimeSales = computed(() => {
  return {
    count: soldItems.value.reduce(
      (total, item) => total + (item.quantity || 1),
      0
    ),
    total: soldItems.value.reduce(
      (total, item) => total + item.soldPrice * (item.quantity || 1),
      0
    ),
  };
});

const filteredSoldItems = computed(() => {
  const now = new Date();
  let filtered = [...soldItems.value];

  switch (historyFilter.value) {
    case "today":
      filtered = filtered.filter(
        (item) => new Date(item.dateSold).toDateString() === now.toDateString()
      );
      break;
    case "week":
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((item) => new Date(item.dateSold) >= weekAgo);
      break;
    case "all":
    default:
      break;
  }

  return filtered.sort((a, b) => new Date(b.dateSold) - new Date(a.dateSold));
});

const getFilteredCaptures = () => {
  const now = new Date();
  let filtered = [...pendingItems.value, ...soldItems.value]; // All items you've ever added

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

const toggleItemSelection = (itemId) => {
  const index = selectedItems.value.indexOf(itemId);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(itemId);
  }
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = [];
  } else {
    selectedItems.value = filteredAndSortedPendingItems.value.map(
      (item) => item.id
    );
  }
};

const clearSelection = () => {
  selectedItems.value = [];
};

const applyBulkPriceChange = () => {
  if (!bulkPriceValue.value || bulkPriceValue.value <= 0) return;

  selectedItems.value.forEach((itemId) => {
    const item = pendingItems.value.find((i) => i.id === itemId);
    if (!item) return;

    switch (bulkPriceAction.value) {
      case "set":
        item.price = bulkPriceValue.value;
        break;
      case "increase":
        item.price = (item.price || 0) + bulkPriceValue.value;
        break;
      case "decrease":
        item.price = Math.max(0, (item.price || 0) - bulkPriceValue.value);
        break;
      case "multiply":
        item.price = Math.round((item.price || 0) * bulkPriceValue.value);
        break;
    }
  });

  saveData();
  bulkPriceValue.value = null;
};

const selectAllSlowMovingItems = () => {
  const slowMovingIds = slowMovingItems.value.map((item) => item.id);
  selectedItems.value = [
    ...new Set([...selectedItems.value, ...slowMovingIds]),
  ];

  // Scroll to the main pending list
  nextTick(() => {
    const pendingSection = document.querySelector(
      '.bg-gray-800.border.border-gray-700.rounded-lg:has(h3:contains("Items for Sale"))'
    );
    if (pendingSection) {
      pendingSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
};

const bulkMarkAsSold = () => {
  if (!confirm(`Mark ${selectedItems.value.length} items as sold?`)) return;

  const itemsToSell = selectedItems.value
    .map((itemId) => pendingItems.value.find((i) => i.id === itemId))
    .filter(Boolean);

  itemsToSell.forEach((item) => {
    const soldItem = {
      ...item,
      dateSold: new Date().toISOString(),
      soldPrice: item.price,
    };

    if (item.monsterId) {
      savePriceHistory(item.monsterId, item.monsterName, item.price);
    }

    soldItems.value.push(soldItem);
  });

  pendingItems.value = pendingItems.value.filter(
    (item) => !selectedItems.value.includes(item.id)
  );

  selectedItems.value = [];
  saveData();
};

const bulkDelete = () => {
  if (!confirm(`Delete ${selectedItems.value.length} selected items?`)) return;

  pendingItems.value = pendingItems.value.filter(
    (item) => !selectedItems.value.includes(item.id)
  );

  selectedItems.value = [];
  saveData();
};

const selectByPriceRange = () => {
  priceRangeMin.value = 0;
  priceRangeMax.value = 999999;
  showPriceRangeModal.value = true;
};

const applyPriceRangeSelection = () => {
  const min = priceRangeMin.value || 0;
  const max = priceRangeMax.value || 999999;

  selectedItems.value = filteredAndSortedPendingItems.value
    .filter((item) => {
      const price = item.price || 0;
      return price >= min && price <= max;
    })
    .map((item) => item.id);

  showPriceRangeModal.value = false;
};

const selectByMonsterType = () => {
  selectedMonsterTypes.value = [];
  showMonsterTypeModal.value = true;
};

const toggleMonsterTypeSelection = (monsterName) => {
  const index = selectedMonsterTypes.value.indexOf(monsterName);
  if (index > -1) {
    selectedMonsterTypes.value.splice(index, 1);
  } else {
    selectedMonsterTypes.value.push(monsterName);
  }
};

const applyMonsterTypeSelection = () => {
  selectedItems.value = filteredAndSortedPendingItems.value
    .filter((item) => selectedMonsterTypes.value.includes(item.monsterName))
    .map((item) => item.id);

  showMonsterTypeModal.value = false;
};

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
};

const onMonsterNameInput = () => {
  showSuggestions.value = true;
  selectedSuggestionIndex.value = -1;
};

const onInputBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 150);
};

const handleKeydown = (event) => {
  if (!showSuggestions.value || filteredSuggestions.value.length === 0) return;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        filteredSuggestions.value.length - 1
      );
      break;
    case "ArrowUp":
      event.preventDefault();
      selectedSuggestionIndex.value = Math.max(
        selectedSuggestionIndex.value - 1,
        -1
      );
      break;
    case "Enter":
      event.preventDefault();
      if (selectedSuggestionIndex.value >= 0) {
        selectSuggestion(
          filteredSuggestions.value[selectedSuggestionIndex.value]
        );
      }
      break;
    case "Escape":
      showSuggestions.value = false;
      selectedSuggestionIndex.value = -1;
      break;
  }
};

const selectSuggestion = (suggestion) => {
  newItem.value.monsterName = suggestion.nom;
  newItem.value.monsterId = suggestion.id;
  newItem.value.image_url = suggestion.image_url;

  const smartPrice = getSmartPrice(suggestion);
  if (smartPrice && !newItem.value.price) {
    newItem.value.price = smartPrice;
  }

  showSuggestions.value = false;
  selectedSuggestionIndex.value = -1;

  nextTick(() => {
    const nextInput =
      newItem.value.quantity === 1
        ? document.querySelector('input[placeholder="1"]')
        : document.querySelector('input[placeholder="0"]');
    if (nextInput) nextInput.focus();
  });
};

const addItem = () => {
  if (!canAddItem.value) return;

  for (let i = 0; i < newItem.value.quantity; i++) {
    const item = {
      id: Date.now() + Math.random() + i,
      monsterId: newItem.value.monsterId,
      monsterName: newItem.value.monsterName.trim(),
      image_url: newItem.value.image_url,
      price: newItem.value.price,
      quantity: 1,
      originalPrice: newItem.value.price,
      dateAdded: new Date().toISOString(),
    };

    pendingItems.value.push(item);
  }

  saveData();

  newItem.value = {
    monsterName: "",
    price: null,
    quantity: 1,
    monsterId: null,
    image_url: null,
  };
};

const updateItemPrice = (item) => {
  saveData();
};

const confirmSale = (item) => {
  const soldItem = {
    ...item,
    dateSold: new Date().toISOString(),
    soldPrice: item.price,
  };

  if (item.monsterId) {
    savePriceHistory(item.monsterId, item.monsterName, item.price);
  }

  soldItems.value.push(soldItem);
  pendingItems.value = pendingItems.value.filter((p) => p.id !== item.id);

  const selectionIndex = selectedItems.value.indexOf(item.id);
  if (selectionIndex > -1) {
    selectedItems.value.splice(selectionIndex, 1);
  }

  saveData();
};

const undoSale = (soldItem) => {
  const pendingItem = {
    ...soldItem,
    id: Date.now() + Math.random(),
    price: soldItem.soldPrice,
    dateAdded: new Date().toISOString(),
  };

  delete pendingItem.dateSold;
  delete pendingItem.soldPrice;

  pendingItems.value.push(pendingItem);
  soldItems.value = soldItems.value.filter((item) => item.id !== soldItem.id);
  saveData();
};

const removeItem = (itemId) => {
  pendingItems.value = pendingItems.value.filter((item) => item.id !== itemId);

  const selectionIndex = selectedItems.value.indexOf(itemId);
  if (selectionIndex > -1) {
    selectedItems.value.splice(selectionIndex, 1);
  }

  saveData();
};

const clearHistory = () => {
  if (
    confirm(
      "Are you sure you want to clear all sales history? This cannot be undone."
    )
  ) {
    soldItems.value = [];
    saveData();
  }
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
</script>

<style scoped>
.hover\:bg-gray-750:hover {
  background-color: #374151;
}

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
    transform: translateY(-8px);
  }
  70% {
    transform: translateY(-4px);
  }
  90% {
    transform: translateY(-2px);
  }
}

.animate-bounce {
  animation: bounce 1.5s infinite;
}

.drop-shadow-glow {
  filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));
}
</style>
