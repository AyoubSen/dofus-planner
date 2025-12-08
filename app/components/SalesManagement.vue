<template>
  <div class="space-y-6">
    <!-- Header Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Items for Sale -->
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 class="text-sm font-medium text-yellow-200/80">Items for Sale</h3>
          </div>
          <p class="text-3xl font-bold text-yellow-300">
            {{ totalPendingQuantity }}
          </p>
          <p class="text-sm text-yellow-200/60 mt-1">
            {{ formatKamas(previewTotal) }} total
          </p>
        </div>
      </div>

      <!-- Slow Moving -->
      <div
        class="group relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/30 hover:border-amber-500/50 transition-all duration-300"
      >
        <div
          class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        ></div>
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-2">
            <div
              class="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20"
            >
              <svg
                class="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="text-sm font-medium text-amber-200/80">Slow Moving</h3>
          </div>
          <p
            class="text-3xl font-bold"
            :class="slowMovingItems.length > 0 ? 'text-amber-300' : 'text-gray-500'"
          >
            {{ slowMovingItems.length }}
          </p>
          <p class="text-sm text-amber-200/60 mt-1">
            {{ slowMovingThreshold }}+ days old
          </p>
        </div>
        <!-- Alert indicator -->
        <div
          v-if="slowMovingItems.length > 0"
          class="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse"
        ></div>
      </div>

      <!-- Today's Sales -->
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
            <h3 class="text-sm font-medium text-green-200/80">Today's Sales</h3>
          </div>
          <p class="text-3xl font-bold text-green-300">
            {{ todaysSales.count }}
          </p>
          <p class="text-sm text-green-200/60 mt-1">
            {{ formatKamas(todaysSales.total) }}
          </p>
        </div>
      </div>

      <!-- Total Earned -->
      <div
        class="group relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300"
      >
        <div
          class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        ></div>
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-2">
            <div
              class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
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
            <h3 class="text-sm font-medium text-blue-200/80">Total Earned</h3>
          </div>
          <p class="text-3xl font-bold text-blue-300">
            {{ allTimeSales.count }}
          </p>
          <p class="text-sm text-blue-200/60 mt-1">
            {{ formatKamas(allTimeSales.total) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Add New Item Form -->
    <div
      class="relative rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 backdrop-blur-sm"
    >
      <div
        class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"
      ></div>
      <div class="relative z-10 p-6">
        <div class="flex items-center gap-3 mb-6">
          <div
            class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-100">Add Item for Sale</h3>
            <p class="text-sm text-gray-400">List a new archimonstre soul</p>
          </div>
        </div>

        <div class="grid md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Monster Name
            </label>
            <div class="relative input-with-suggestions">
  <input
    v-model="newItem.monsterName"
    @input="onMonsterNameInput"
    @focus="onInputFocus"
    @blur="onInputBlur"
    @keydown="handleKeydown"
    ref="monsterInputRef"
    type="text"
    placeholder="Search monster..."
    class="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
  />

  <!-- Teleport dropdown to body -->
 <!-- Teleport dropdown to body -->
<Teleport to="body">
  <Transition name="dropdown">
    <div
      v-if="showSuggestions && filteredSuggestions.length > 0"
      class="fixed bg-gray-800 border border-gray-600/50 rounded-xl shadow-2xl shadow-black/50 max-h-64 overflow-y-auto"
      :style="dropdownStyle"
    >
      <div
        v-for="(suggestion, index) in filteredSuggestions"
        :key="suggestion.id"
        @mousedown.prevent="selectSuggestion(suggestion)"
        :class="[
          'px-4 py-3 cursor-pointer flex items-center gap-3 transition-all duration-150',
          index === selectedSuggestionIndex
            ? 'bg-blue-600/30 border-l-2 border-blue-500'
            : 'hover:bg-gray-700/50 border-l-2 border-transparent',
        ]"
      >
        <img
          v-if="suggestion.image_url"
          :src="suggestion.image_url"
          :alt="suggestion.nom"
          class="w-10 h-10 rounded-lg object-cover border border-gray-600/50"
        />
        <div
          v-else
          class="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center"
        >
          <svg
            class="w-5 h-5 text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clip-rule="evenodd"
            />
          </svg>
        </div>

        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-100 truncate">
            {{ suggestion.nom }}
          </div>
          <div class="text-sm text-gray-400 truncate">
            {{ suggestion.nom_normal }} • {{ suggestion.zone }}
          </div>
          <div
            v-if="getSmartPrice(suggestion)"
            class="text-xs text-blue-400 mt-0.5"
          >
            💡 Suggested: {{ formatKamas(getSmartPrice(suggestion)) }}
          </div>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
</div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Quantity
            </label>
            <input
              v-model.number="newItem.quantity"
              type="number"
              min="1"
              placeholder="1"
              class="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Price per Unit
            </label>
            <div class="relative">
              <input
                v-model.number="newItem.price"
                type="number"
                min="0"
                placeholder="0"
                class="w-full px-4 py-3 pr-10 bg-gray-800/60 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400">
                ⚡
              </span>
            </div>
            <p
              v-if="newItem.quantity > 1 && newItem.price"
              class="text-xs text-gray-400 mt-1.5"
            >
              Total: {{ formatKamas(newItem.price * newItem.quantity) }}
            </p>
          </div>

          <div class="flex items-end">
            <button
              @click="addItem"
              :disabled="!canAddItem"
              class="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:shadow-none"
            >
              <span class="flex items-center justify-center gap-2">
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
                Add to List
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Slow Moving Items Section -->
    <div
      class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-900/20 via-gray-800/80 to-orange-900/20 border border-amber-500/30"
    >
      <div
        class="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5"
      ></div>

      <div class="relative z-10 p-5 border-b border-amber-500/20">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <div class="relative">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20"
              >
                <svg
                  class="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div
                v-if="slowMovingItems.length > 0"
                class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-800 animate-bounce"
              ></div>
            </div>

            <div>
              <h3 class="text-xl font-bold text-amber-200">Slow Moving Items</h3>
              <p class="text-sm text-amber-200/60">
                Items listed for {{ slowMovingThreshold }}+ days
              </p>
            </div>

            <span
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-300',
                slowMovingItems.length > 0
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                  : 'bg-gray-700/50 text-gray-400 border border-gray-600/50',
              ]"
            >
              {{ slowMovingItems.length }} item{{
                slowMovingItems.length !== 1 ? "s" : ""
              }}
            </span>
          </div>

          <div class="flex items-center gap-3">
            <label class="text-sm text-amber-200/80 font-medium">Alert after:</label>
            <select
              v-model="slowMovingThreshold"
              @change="updateSlowMovingThreshold"
              class="px-4 py-2 bg-gray-800/80 border border-amber-500/30 rounded-xl text-amber-100 text-sm font-medium focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-200"
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

      <!-- Empty State -->
      <div v-if="slowMovingItems.length === 0" class="relative z-10 p-10 text-center">
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
            <div class="absolute -bottom-1 -left-4 text-xl animate-bounce delay-150">
              ⭐
            </div>
          </div>
          <p class="text-xl font-bold text-green-300 mb-2">All items moving fast!</p>
          <p class="text-green-200/70 text-sm">
            No items have been sitting for more than {{ slowMovingThreshold }} days.
          </p>
        </div>
      </div>

      <!-- Slow Moving Items List -->
      <div v-else class="relative z-10 p-4">
        <div
          class="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-4 mb-4"
        >
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center"
              >
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p class="text-amber-100 font-bold">
                  {{ slowMovingItems.length }} items need attention
                </p>
                <p class="text-amber-200/70 text-sm">
                  Consider adjusting prices or removing them
                </p>
              </div>
            </div>
            <button
              @click="selectAllSlowMovingItems"
              class="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-200"
            >
              Select All Slow Items
            </button>
          </div>
        </div>

        <div class="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
          <div
            v-for="item in slowMovingItems"
            :key="item.id"
            class="group flex items-center justify-between bg-gray-800/60 border border-amber-500/20 rounded-xl p-3 hover:bg-amber-900/20 hover:border-amber-400/40 transition-all duration-200"
          >
            <div class="flex items-center gap-3">
              <div class="relative">
                <div
                  class="w-12 h-12 rounded-xl overflow-hidden bg-gray-700 border-2 border-amber-500/30"
                >
                  <img
                    v-if="item.image_url"
                    :src="item.image_url"
                    :alt="item.monsterName"
                    class="w-full h-full object-cover"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center"
                  >
                    <svg class="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div
                  class="absolute -bottom-1 -left-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg"
                >
                  {{ getDaysListed(item.dateAdded) }}
                </div>
              </div>

              <div>
                <h4 class="font-semibold text-amber-100 group-hover:text-white transition-colors">
                  {{ item.monsterName }}
                </h4>
                <p
                  :class="[
                    'text-sm font-medium',
                    getDaysListed(item.dateAdded) >= slowMovingThreshold * 2
                      ? 'text-red-400'
                      : 'text-amber-300/80',
                  ]"
                >
                  {{ getDaysListed(item.dateAdded) }} days old
                  <span
                    v-if="getDaysListed(item.dateAdded) >= slowMovingThreshold * 2"
                    class="ml-1 text-red-400"
                  >
                    ⚠️ URGENT
                  </span>
                </p>
              </div>
            </div>

            <div class="text-right">
              <p class="font-bold text-amber-200">
                {{ formatKamas(item.price * item.quantity) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending Sales List -->
    <div
      class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50"
    >
      <div class="relative z-10 p-6 border-b border-gray-700/50">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20"
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-100">
                Items for Sale
                <span v-if="selectedItems.length > 0" class="text-blue-400 text-base font-medium">
                  ({{ selectedItems.length }} selected)
                </span>
              </h3>
              <p class="text-sm text-gray-400">
                {{ totalPendingQuantity }} items • {{ formatKamas(previewTotal) }} total
                <span v-if="selectedItems.length > 0" class="text-blue-300">
                  • {{ formatKamas(selectedItemsTotal) }} selected
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Search and Sort Controls -->
        <div class="flex flex-wrap gap-3 items-center">
          <!-- Search -->
          <div class="relative flex-1 min-w-48">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
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
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search items..."
              class="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm"
            />
          </div>

          <!-- Price Range -->
          <div class="flex items-center gap-2">
            <input
              v-model.number="priceFilterMin"
              type="number"
              min="0"
              placeholder="Min"
              class="w-20 px-3 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm"
            />
            <span class="text-gray-500">–</span>
            <input
              v-model.number="priceFilterMax"
              type="number"
              min="0"
              placeholder="Max"
              class="w-20 px-3 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm"
            />
          </div>

          <!-- Sort -->
          <div class="flex gap-2">
            <select
              v-model="sortBy"
              class="px-3 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-xl text-gray-100 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
            >
              <option value="dateAdded">Date Added</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="total">Total Value</option>
            </select>

            <button
              @click="toggleSortDirection"
              class="px-3 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-xl text-gray-100 hover:bg-gray-700/60 transition-all duration-200"
              :title="sortDirection === 'asc' ? 'Ascending' : 'Descending'"
            >
              <svg
                class="w-4 h-4 transition-transform duration-200"
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
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Bulk Operations -->
        <Transition name="slide-fade">
          <div
            v-if="selectedItems.length > 0"
            class="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
          >
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center gap-4 flex-wrap">
                <span class="text-blue-200 font-medium">
                  {{ selectedItems.length }} selected
                </span>

                <div class="flex items-center gap-2 flex-wrap">
                  <select
                    v-model="bulkPriceAction"
                    class="px-3 py-1.5 bg-gray-800/80 border border-gray-600/50 rounded-lg text-gray-100 text-sm"
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
                    class="w-20 px-2 py-1.5 bg-gray-800/80 border border-gray-600/50 rounded-lg text-gray-100 text-sm"
                  />
                  <button
                    @click="applyBulkPriceChange"
                    :disabled="!bulkPriceValue || bulkPriceValue <= 0"
                    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div class="flex gap-2 flex-wrap">
                <button
                  @click="bulkMarkAsSold"
                  class="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Mark as Sold
                </button>
                <button
                  @click="bulkDelete"
                  class="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Delete
                </button>
                <button
                  @click="clearSelection"
                  class="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Select All -->
        <div class="flex items-center gap-4 mt-4 flex-wrap">
          <label class="flex items-center gap-2 cursor-pointer group">
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
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200',
                  isAllSelected || isPartiallySelected
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-gray-700/50 border-gray-600 group-hover:border-gray-500',
                ]"
              >
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
                  />
                </svg>
                <div
                  v-else-if="isPartiallySelected"
                  class="w-2.5 h-0.5 bg-white rounded"
                ></div>
              </div>
            </div>
            <span class="text-sm text-gray-300 group-hover:text-gray-200">
              {{ isAllSelected ? "Deselect All" : "Select All" }}
              ({{ filteredAndSortedPendingItems.length }})
            </span>
          </label>

          <div class="flex gap-4 text-sm">
            <button
              @click="selectByPriceRange"
              class="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Select by price
            </button>
            <button
              @click="selectByMonsterType"
              class="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Select by type
            </button>
          </div>
        </div>
      </div>

      <!-- Items List -->
      <div v-if="filteredAndSortedPendingItems.length === 0" class="p-10 text-center">
        <div
          class="w-16 h-16 mx-auto bg-gray-700/50 rounded-2xl flex items-center justify-center mb-4"
        >
          <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <p class="text-gray-400">
          {{ searchQuery ? "No items match your search" : "No items listed for sale" }}
        </p>
      </div>

      <div v-else class="divide-y divide-gray-700/50 max-h-[500px] overflow-y-auto custom-scrollbar">
        <div
          v-for="item in filteredAndSortedPendingItems"
          :key="item.id"
          class="p-4 hover:bg-gray-700/30 transition-all duration-200"
          :class="{ 'bg-blue-900/20': selectedItems.includes(item.id) }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <!-- Checkbox -->
              <label class="cursor-pointer">
                <input
                  type="checkbox"
                  :checked="selectedItems.includes(item.id)"
                  @change="toggleItemSelection(item.id)"
                  class="sr-only"
                />
                <div
                  :class="[
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200',
                    selectedItems.includes(item.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-gray-700/50 border-gray-600 hover:border-gray-500',
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
                    />
                  </svg>
                </div>
              </label>

              <!-- Image -->
              <div
                class="w-12 h-12 rounded-xl overflow-hidden bg-gray-700/50 border border-gray-600/50 flex items-center justify-center relative"
              >
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  alt="monster"
                  class="w-full h-full object-cover"
                />
                <svg
                  v-else
                  class="w-6 h-6 text-yellow-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div
                  v-if="item.quantity > 1"
                  class="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                >
                  {{ item.quantity }}
                </div>
              </div>

              <!-- Info -->
              <div>
                <h4 class="font-medium text-gray-100">
                  {{ item.monsterName }}
                  <span v-if="item.quantity > 1" class="text-gray-400 text-sm">
                    ({{ item.quantity }}x)
                  </span>
                </h4>
                <p class="text-sm text-gray-500">
                  Added {{ formatDate(item.dateAdded) }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <!-- Price Editor -->
              <div class="flex items-center gap-2">
                <div class="relative">
                  <!-- Display Mode -->
                  <div
                    v-if="!editingPrice[item.id]"
                    @click="startEditingPrice(item)"
                    class="flex items-center gap-2 px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl cursor-pointer hover:bg-gray-600/50 hover:border-gray-500/50 transition-all duration-200 min-w-28"
                  >
                    <span class="text-gray-100 font-medium">
                      {{ formatPriceForDisplay(item.price) }}
                    </span>
                    <svg
                      class="w-3.5 h-3.5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
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
                      class="w-24 px-3 py-2 bg-gray-700 border-2 rounded-xl text-gray-100 text-sm focus:outline-none transition-all duration-200"
                      :class="{
                        'border-red-500': priceErrors[item.id],
                        'border-green-500': priceChanged[item.id] && !priceErrors[item.id],
                        'border-blue-500': !priceErrors[item.id] && !priceChanged[item.id],
                      }"
                    />
                    <button
                      @click="finishEditingPrice(item)"
                      :disabled="priceErrors[item.id]"
                      class="p-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button
                      @click="cancelEditingPrice(item)"
                      class="p-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <!-- Change indicator -->
                  <div
                    v-if="priceChanged[item.id] && !editingPrice[item.id]"
                    class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"
                  ></div>
                </div>

                <!-- Copy button -->
                <button
                  @click.stop="handleCopyItemPrice(item)"
                  class="p-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-lg text-gray-100 transition-all duration-200"
                  :title="copiedPrice[item.id] ? 'Copied!' : 'Copy price'"
                >
                  <svg
                    v-if="!copiedPrice[item.id]"
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M8 16h8a2 2 0 002-2V8m-6 8H8a2 2 0 01-2-2v-2"
                    />
                  </svg>
                  <svg
                    v-else
                    class="w-4 h-4 text-green-400"
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
                </button>

                <span class="text-yellow-400">⚡</span>
              </div>

              <!-- Total -->
              <div class="text-right min-w-20">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                <p class="font-bold text-yellow-300">
                  {{
                    formatKamas(
                      (editingPrice[item.id] ? tempPrices[item.id] || 0 : item.price) *
                        item.quantity
                    )
                  }}
                </p>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button
                  @click="confirmSale(item)"
                  class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-green-500/20"
                >
                  Sold!
                </button>
                <button
                  @click="removeItem(item.id)"
                  class="px-4 py-2 bg-gray-700/50 hover:bg-red-500/20 border border-gray-600/50 hover:border-red-500/50 text-gray-300 hover:text-red-400 rounded-xl text-sm transition-all duration-200"
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
    <div
      class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50"
    >
      <div class="relative z-10 p-6 border-b border-gray-700/50">
        <div class="flex items-center justify-between">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-100">Sales History</h3>
              <p class="text-sm text-gray-400">Track your completed sales</p>
            </div>
          </div>

          <div class="flex gap-3">
            <select
              v-model="historyFilter"
              class="px-4 py-2 bg-gray-800/60 border border-gray-600/50 rounded-xl text-gray-100 text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="all">All Time</option>
            </select>
            <button
              v-if="soldItems.length > 0"
              @click="clearHistory"
              class="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-xl text-sm font-medium transition-all duration-200"
            >
              Clear History
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredSoldItems.length === 0" class="p-10 text-center">
        <div
          class="w-16 h-16 mx-auto bg-gray-700/50 rounded-2xl flex items-center justify-center mb-4"
        >
          <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p class="text-gray-400">No sales recorded yet</p>
      </div>

      <div
        v-else
        class="divide-y divide-gray-700/50 max-h-96 overflow-y-auto custom-scrollbar"
      >
        <div
          v-for="item in filteredSoldItems"
          :key="item.id"
          class="p-4 hover:bg-gray-700/30 transition-all duration-200"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl overflow-hidden bg-green-500/20 border border-green-500/30 flex items-center justify-center relative"
              >
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  :alt="item.nom"
                  class="w-full h-full object-cover"
                />
                <svg
                  v-else
                  class="w-5 h-5 text-green-400"
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
                <div
                  v-if="item.quantity > 1"
                  class="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold"
                >
                  {{ item.quantity }}
                </div>
              </div>

              <div>
                <h4 class="font-medium text-gray-100">
                  {{ item.monsterName }}
                  <span v-if="item.quantity > 1" class="text-gray-400 text-sm">
                    ({{ item.quantity }}x @ {{ formatKamas(item.soldPrice) }} each)
                  </span>
                </h4>
                <p class="text-sm text-gray-500">
                  Sold {{ formatDate(item.dateSold) }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-4">
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

              <button
                @click="undoSale(item)"
                class="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 text-orange-400 rounded-lg text-sm font-medium transition-all duration-200"
                title="Move back to items for sale"
              >
                ↶ Undo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Price Range Modal -->
    <Transition name="modal">
      <div
        v-if="showPriceRangeModal"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showPriceRangeModal = false"
      >
        <div
          class="bg-gray-800 border border-gray-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        >
          <h3 class="text-xl font-bold text-gray-100 mb-6">Select by Price Range</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Minimum Price
              </label>
              <input
                v-model.number="priceRangeMin"
                type="number"
                min="0"
                placeholder="0"
                class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Maximum Price
              </label>
              <input
                v-model.number="priceRangeMax"
                type="number"
                min="0"
                placeholder="999999"
                class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              />
            </div>
            <div class="flex gap-3 pt-4">
              <button
                @click="applyPriceRangeSelection"
                class="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200"
              >
                Select Items
              </button>
              <button
                @click="showPriceRangeModal = false"
                class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Monster Type Modal -->
    <Transition name="modal">
      <div
        v-if="showMonsterTypeModal"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showMonsterTypeModal = false"
      >
        <div
          class="bg-gray-800 border border-gray-700/50 rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
        >
          <h3 class="text-xl font-bold text-gray-100 mb-6">Select by Monster Type</h3>
          <div class="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar">
            <div
              v-for="monsterType in uniqueMonsterTypes"
              :key="monsterType.name"
              class="flex items-center justify-between p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-200"
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
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200',
                      selectedMonsterTypes.includes(monsterType.name)
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-gray-700/50 border-gray-600 hover:border-gray-500',
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
                      />
                    </svg>
                  </div>
                </div>
                <span class="text-gray-100">{{ monsterType.name }}</span>
              </label>
              <span
                class="text-sm text-gray-400 bg-gray-700/50 px-2.5 py-1 rounded-lg">
                {{ monsterType.count }}
              </span>
            </div>
          </div>
          <div class="flex gap-3 pt-4 border-t border-gray-700/50">
            <button
              @click="applyMonsterTypeSelection"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Select Items
            </button>
            <button
              @click="showMonsterTypeModal = false"
              class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";

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
  pendingItems: {
    type: Array,
    required: true,
  },
  soldItems: {
    type: Array,
    required: true,
  },
  initialSelections: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "add-item",
  "sell-item",
  "remove-item",
  "bulk-sell",
  "bulk-delete",
  "update-prices",
  "undo-sale",
  "clear-history",
]);

// Form state
const newItem = ref({
  monsterName: "",
  price: null,
  quantity: 1,
});

const monsterInputRef = ref(null);
const dropdownPosition = ref({ top: 0, left: 0, width: 0 });

// UI state
const historyFilter = ref("today");
const showSuggestions = ref(false);
const selectedSuggestionIndex = ref(-1);
const searchQuery = ref("");
const sortBy = ref("price");
const sortDirection = ref("asc");
const priceFilterMin = ref(null);
const priceFilterMax = ref(null);
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
const copiedPrice = ref({});
const slowMovingThreshold = ref(7);

// Helpers
const getPriceHistoryKey = () => {
  return `selling_price_history_${props.server.id}_${props.character.id}`;
};

// Computed

const dropdownStyle = computed(() => ({
  top: `${dropdownPosition.value.top}px`,
  left: `${dropdownPosition.value.left}px`,
  width: `${dropdownPosition.value.width}px`,
  zIndex: 9999,
}));


const slowMovingItems = computed(() => {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - slowMovingThreshold.value);
  return props.pendingItems
    .filter((item) => new Date(item.dateAdded) <= threshold)
    .sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
});

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
        (monster.nom_normal && monster.nom_normal.toLowerCase().includes(searchTerm)) ||
        (monster.zone && monster.zone.toLowerCase().includes(searchTerm)) ||
        (monster.souszone && monster.souszone.toLowerCase().includes(searchTerm))
    )
    .slice(0, 8);
});

const filteredAndSortedPendingItems = computed(() => {
  let filtered = [...props.pendingItems];

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((item) =>
      item.monsterName.toLowerCase().includes(query)
    );
  }
  if (priceFilterMin.value) {
    filtered = filtered.filter((item) => (item.price || 0) >= priceFilterMin.value);
  }
  if (priceFilterMax.value) {
    filtered = filtered.filter((item) => (item.price || 0) <= priceFilterMax.value);
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
    const item = props.pendingItems.find((i) => i.id === itemId);
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
  return props.pendingItems.reduce((total, item) => total + (item.quantity || 1), 0);
});

const previewTotal = computed(() => {
  return props.pendingItems.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );
});

const todaysSales = computed(() => {
  const today = new Date().toDateString();
  const todaysItems = props.soldItems.filter(
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
    count: props.soldItems.reduce((total, item) => total + (item.quantity || 1), 0),
    total: props.soldItems.reduce(
      (total, item) => total + item.soldPrice * (item.quantity || 1),
      0
    ),
  };
});

const filteredSoldItems = computed(() => {
  const now = new Date();
  let filtered = [...props.soldItems];

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

// Watchers
watch(
  () => props.initialSelections,
  (newSelections) => {
    if (newSelections && newSelections.length > 0) {
      selectedItems.value = [...new Set([...selectedItems.value, ...newSelections])];
    }
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener("scroll", updateDropdownPosition, true);
  window.addEventListener("resize", updateDropdownPosition);
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateDropdownPosition, true);
  window.removeEventListener("resize", updateDropdownPosition);
});

// Methods

const updateDropdownPosition = () => {
  if (monsterInputRef.value) {
    const rect = monsterInputRef.value.getBoundingClientRect();
    dropdownPosition.value = {
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    };
  }
};


const formatPriceForDisplay = (price) => {
  if (!price && price !== 0) return "0";
  return new Intl.NumberFormat("fr-FR").format(price);
};

const formatKamas = (amount) => {
  if (amount === 0) return "0 ⚡";
  return new Intl.NumberFormat("fr-FR").format(amount) + " ⚡";
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

  if (date.toDateString() === today) {
    return "Today " + date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } else if (date.toDateString() === yesterday) {
    return "Yesterday " + date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } else {
    return (
      date.toLocaleDateString("fr-FR") +
      " " +
      date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
  }
};

const getDaysListed = (dateAdded) => {
  const now = new Date();
  const added = new Date(dateAdded);
  const diffTime = Math.abs(now - added);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
    return Math.round(recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length);
  }
  return lastPrice;
};

const updateSlowMovingThreshold = () => {
  localStorage.setItem(
    `slow_moving_threshold_${props.server.id}_${props.character.id}`,
    slowMovingThreshold.value.toString()
  );
};

// Price editing
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
    priceErrors.value[item.id] = "Must be positive";
    return false;
  }
  if (value > 999999999) {
    priceErrors.value[item.id] = "Price too high";
    return false;
  }
  priceErrors.value[item.id] = null;
  return true;
};

const finishEditingPrice = (item) => {
  if (!validatePriceInput(item)) return;
  const newPrice = Math.floor(tempPrices.value[item.id] || 0);
  const oldPrice = item.price;
  if (newPrice !== oldPrice) {
    emit("update-prices", [{ ...item, price: newPrice }]);
    priceChanged.value[item.id] = true;
    setTimeout(() => {
      priceChanged.value[item.id] = false;
    }, 2000);
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

// Clipboard
const copyPriceToClipboard = async (price) => {
  try {
    await navigator.clipboard.writeText(String(price));
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = String(price);
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }
};

const handleCopyItemPrice = async (item) => {
  const price = editingPrice.value[item.id]
    ? tempPrices.value[item.id] || 0
    : item.price || 0;
  const ok = await copyPriceToClipboard(price);
  if (ok) {
    copiedPrice.value[item.id] = true;
    setTimeout(() => {
      copiedPrice.value[item.id] = false;
    }, 1200);
  }
};

// Selection
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
    selectedItems.value = filteredAndSortedPendingItems.value.map((item) => item.id);
  }
};

const clearSelection = () => {
  selectedItems.value = [];
};

const selectAllSlowMovingItems = () => {
  const slowMovingIds = slowMovingItems.value.map((item) => item.id);
  selectedItems.value = [...new Set([...selectedItems.value, ...slowMovingIds])];
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

// Bulk actions
const applyBulkPriceChange = () => {
  if (!bulkPriceValue.value || bulkPriceValue.value <= 0) return;
  const itemsToUpdate = [];
  selectedItems.value.forEach((itemId) => {
    const item = props.pendingItems.find((i) => i.id === itemId);
    if (!item) return;
    let newPrice = item.price;
    switch (bulkPriceAction.value) {
      case "set":
        newPrice = bulkPriceValue.value;
        break;
      case "increase":
        newPrice = (item.price || 0) + bulkPriceValue.value;
        break;
      case "decrease":
        newPrice = Math.max(0, (item.price || 0) - bulkPriceValue.value);
        break;
      case "multiply":
        newPrice = Math.round((item.price || 0) * bulkPriceValue.value);
        break;
    }
    itemsToUpdate.push({ ...item, price: newPrice });
  });
  emit("update-prices", itemsToUpdate);
  bulkPriceValue.value = null;
};

const bulkMarkAsSold = () => {
  if (!confirm(`Mark ${selectedItems.value.length} items as sold?`)) return;
  emit("bulk-sell", selectedItems.value);
  selectedItems.value = [];
};

const bulkDelete = () => {
  if (!confirm(`Delete ${selectedItems.value.length} selected items?`)) return;
  emit("bulk-delete", selectedItems.value);
  selectedItems.value = [];
};

// Sorting
const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
};

// Suggestions
const onMonsterNameInput = () => {
  showSuggestions.value = true;
  selectedSuggestionIndex.value = -1;
  nextTick(updateDropdownPosition);
};

const onInputFocus = () => {
  showSuggestions.value = true;
  nextTick(updateDropdownPosition);
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
      selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1);
      break;
    case "Enter":
      event.preventDefault();
      if (selectedSuggestionIndex.value >= 0) {
        selectSuggestion(filteredSuggestions.value[selectedSuggestionIndex.value]);
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
};

// CRUD
const addItem = () => {
  if (!canAddItem.value) return;
  emit("add-item", { ...newItem.value });
  newItem.value = { monsterName: "", price: null, quantity: 1 };
};

const confirmSale = (item) => {
  emit("sell-item", item);
  const selectionIndex = selectedItems.value.indexOf(item.id);
  if (selectionIndex > -1) {
    selectedItems.value.splice(selectionIndex, 1);
  }
};

const undoSale = (soldItem) => {
  emit("undo-sale", soldItem);
};

const removeItem = (itemId) => {
  emit("remove-item", itemId);
  const selectionIndex = selectedItems.value.indexOf(itemId);
  if (selectionIndex > -1) {
    selectedItems.value.splice(selectionIndex, 1);
  }
};

const clearHistory = () => {
  if (confirm("Clear all sales history? This cannot be undone.")) {
    emit("clear-history");
  }
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

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}

/* Suggestions */

.input-with-suggestions {
  position: relative;
  isolation: isolate;
  z-index: 30;
}

.suggestions-popover {
  z-index: 9999 !important;
}

/* Number input */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>