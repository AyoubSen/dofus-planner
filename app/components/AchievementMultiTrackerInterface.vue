<!-- components/AchievementMultiTrackerInterface.vue -->
<template>
  <div>
    <!-- Character Selection Header -->
    <div
      class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 mb-6"
    >
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center"
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-100">
              Select Characters to Compare
            </h2>
            <p class="text-sm text-gray-400">
              Choose up to {{ maxCharacters }} characters
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-gray-400 text-sm">
            {{ selectedCharacters.length }} / {{ maxCharacters }} selected
          </span>
          <button
            v-if="selectedCharacters.length > 0"
            @click="clearSelection"
            class="px-3 py-1.5 text-sm bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-lg text-gray-300 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <!-- Character Pills -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="char in allCharacters"
          :key="`${char.serverId}-${char.id}`"
          @click="toggleCharacterSelection(char)"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200',
            isCharacterSelected(char)
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
              : 'bg-gray-700/30 border-gray-600/50 text-gray-400 hover:border-gray-500 hover:text-gray-300',
            selectedCharacters.length >= maxCharacters &&
            !isCharacterSelected(char)
              ? 'opacity-50 cursor-not-allowed'
              : '',
          ]"
          :disabled="
            selectedCharacters.length >= maxCharacters &&
            !isCharacterSelected(char)
          "
        >
          <div
            :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
              isCharacterSelected(char)
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-600 text-gray-300',
            ]"
          >
            {{ char.name.charAt(0).toUpperCase() }}
          </div>
          <div class="text-left">
            <div class="font-medium text-sm">{{ char.name }}</div>
            <div class="text-xs opacity-70">
              {{ char.class }} • {{ char.serverName }}
            </div>
          </div>
          <svg
            v-if="isCharacterSelected(char)"
            class="w-4 h-4 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- No Selection State -->
    <div
      v-if="selectedCharacters.length === 0"
      class="text-center py-16 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl"
    >
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
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <p class="text-lg text-gray-400">Select characters to start comparing</p>
      <p class="text-sm text-gray-500 mt-2">
        Click on characters above to add them to the comparison
      </p>
    </div>

    <!-- Multi-Tracker Content -->
    <template v-else>
      <!-- Aggregated Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Total Completed -->
        <div
          class="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-green-400"
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
              <div class="text-sm text-green-400">Total Completed</div>
              <div class="text-2xl font-bold text-green-300">
                {{ aggregatedStats.totalCompleted }}
              </div>
            </div>
          </div>
        </div>

        <!-- Unique Completed -->
        <div
          class="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <div>
              <div class="text-sm text-blue-400">Unique Achievements</div>
              <div class="text-2xl font-bold text-blue-300">
                {{ aggregatedStats.uniqueCompleted }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="mb-6 flex flex-wrap items-center gap-4 bg-gray-800/30 border border-gray-700/50 rounded-xl p-4"
      >
        <!-- Search -->
        <div class="flex-1 min-w-48">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search achievements..."
            class="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
            @input="debouncedSearch"
          />
        </div>

        <!-- Category Filter Dropdown -->
        <div class="relative" ref="categoryDropdownRef">
          <button
            @click="showCategoryDropdown = !showCategoryDropdown"
            class="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-yellow-500/50 min-w-48"
          >
            <span class="flex-1 text-left truncate">
              {{ selectedCategoryName || "All Categories" }}
            </span>
            <svg
              class="w-4 h-4 transition-transform duration-200"
              :class="{ 'rotate-180': showCategoryDropdown }"
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
          </button>

          <!-- Category Dropdown -->
          <div
            v-if="showCategoryDropdown"
            class="absolute top-full left-0 mt-1 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto custom-scrollbar"
          >
            <div class="p-2">
              <button
                @click="selectCategory('')"
                :class="[
                  'w-full text-left px-3 py-2 rounded-lg transition-colors',
                  selectedCategory === ''
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'text-gray-300 hover:bg-gray-700/50',
                ]"
              >
                All Categories
              </button>

              <template
                v-for="parent in organizedCategories"
                :key="parent.id"
              >
                <div class="flex items-center">
                  <button
                    @click="selectCategory(parent.id)"
                    :class="[
                      'flex-1 text-left px-3 py-2 rounded-lg transition-colors',
                      selectedCategory === parent.id
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'text-gray-200 hover:bg-gray-700/50',
                    ]"
                  >
                    {{ parent.name.fr }}
                  </button>
                  <button
                    v-if="parent.children && parent.children.length > 0"
                    @click.stop="toggleCategoryExpand(parent.id)"
                    class="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-yellow-400 transition-colors"
                  >
                    <svg
                      class="w-4 h-4 transition-transform duration-200"
                      :class="{
                        'rotate-180': expandedCategories.has(parent.id),
                      }"
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
                  </button>
                </div>

                <!-- Child categories -->
                <div
                  v-if="
                    parent.children &&
                    parent.children.length > 0 &&
                    expandedCategories.has(parent.id)
                  "
                  class="ml-4 border-l border-gray-700 pl-2"
                >
                  <button
                    v-for="child in parent.children"
                    :key="child.id"
                    @click="selectCategory(child.id)"
                    :class="[
                      'w-full text-left px-3 py-1.5 rounded-lg transition-colors text-sm',
                      selectedCategory === child.id
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200',
                    ]"
                  >
                    {{ child.name.fr }}
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Completion Filter -->
        <select
          v-model="completionFilter"
          class="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-yellow-500/50"
        >
          <option value="all">All Achievements</option>
          <option value="none-completed">None Completed</option>
          <option value="some-completed">Partially Completed</option>
          <option value="all-completed">All Characters Completed</option>
        </select>

        <!-- View Toggle -->
        <div class="flex items-center gap-2 ml-auto">
          <button
            @click="viewMode = 'table'"
            :class="[
              'p-2 rounded-lg transition-colors',
              viewMode === 'table'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'text-gray-400 hover:text-gray-300',
            ]"
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
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
          <button
            @click="viewMode = 'grid'"
            :class="[
              'p-2 rounded-lg transition-colors',
              viewMode === 'grid'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'text-gray-400 hover:text-gray-300',
            ]"
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
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <div class="flex items-center gap-3 text-yellow-400">
          <div
            class="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full"
          ></div>
          <span class="text-lg">Loading achievements...</span>
        </div>
      </div>

      <!-- Table View -->
      <div
        v-else-if="viewMode === 'table'"
        class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-700/50">
                <th
                  class="sticky left-0 bg-gray-800/90 backdrop-blur-sm px-4 py-3 text-left text-sm font-semibold text-yellow-400 min-w-64"
                >
                  Achievement
                </th>
                <th
                  v-for="char in selectedCharacters"
                  :key="`header-${char.serverId}-${char.id}`"
                  class="px-4 py-3 text-center text-sm font-semibold text-gray-300 min-w-32"
                >
                  <div class="flex flex-col items-center gap-1">
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      :style="{
                        backgroundColor: getCharacterColor(char, 0.3),
                        color: getCharacterColor(char, 1),
                      }"
                    >
                      {{ char.name.charAt(0).toUpperCase() }}
                    </div>
                    <span class="truncate max-w-24">{{ char.name }}</span>
                    <span class="text-xs text-gray-500">{{
                      char.serverName
                    }}</span>
                  </div>
                </th>
                <th
                  class="px-4 py-3 text-center text-sm font-semibold text-gray-300 min-w-24"
                >
                  XP (Lv.200)
                </th>
                <th
                  class="px-4 py-3 text-center text-sm font-semibold text-gray-300 min-w-24"
                >
                  Kamas
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="achievement in filteredAchievements"
                :key="achievement.id"
                class="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
              >
                <!-- Achievement Info (Sticky) -->
                <td
                  class="sticky left-0 bg-gray-800/90 backdrop-blur-sm px-4 py-3"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 bg-gray-700/50 rounded-lg border border-gray-600/50 overflow-hidden flex-shrink-0"
                    >
                      <img
                        v-if="achievement.img"
                        :src="achievement.img"
                        :alt="achievement.name?.fr"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="min-w-0">
                      <div
                        class="font-medium text-gray-200 truncate cursor-pointer hover:text-yellow-400"
                        @click="openAchievementDetail(achievement)"
                      >
                        {{ achievement.name?.fr || "Unknown" }}
                      </div>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span
                          v-if="achievement.level"
                          class="text-xs text-blue-400"
                        >
                          Lv.{{ achievement.level }}
                        </span>
                        <span
                          v-if="achievement.category?.name?.fr"
                          class="text-xs text-gray-500 truncate max-w-24"
                        >
                          {{ achievement.category.name.fr }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Character Completion Status -->
                <td
                  v-for="char in selectedCharacters"
                  :key="`cell-${char.serverId}-${char.id}-${achievement.id}`"
                  class="px-4 py-3 text-center"
                >
                  <button
                    @click="toggleCompletion(char, achievement)"
                    :class="[
                      'w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-200 mx-auto',
                      isCompletedByCharacter(char, achievement.id)
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-600 hover:border-yellow-500',
                    ]"
                  >
                    <svg
                      v-if="isCompletedByCharacter(char, achievement.id)"
                      class="w-4 h-4 text-white"
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
                  </button>
                </td>

                <!-- XP -->
                <td class="px-4 py-3 text-center">
                  <span
                    v-if="getAchievementXP(achievement) > 0"
                    class="text-blue-300 text-sm"
                  >
                    {{ formatNumber(getAchievementXP(achievement)) }}
                  </span>
                  <span v-else class="text-gray-600">-</span>
                </td>

                <!-- Kamas -->
                <td class="px-4 py-3 text-center">
                  <span
                    v-if="getAchievementKamas(achievement) > 0"
                    class="text-yellow-300 text-sm"
                  >
                    {{ formatNumber(getAchievementKamas(achievement)) }}
                  </span>
                  <span v-else class="text-gray-600">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty Table State -->
        <div
          v-if="filteredAchievements.length === 0"
          class="text-center py-12"
        >
          <p class="text-gray-400">No achievements match your filters</p>
        </div>
      </div>

      <!-- Grid View -->
      <div
        v-else-if="viewMode === 'grid'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="achievement in filteredAchievements"
          :key="achievement.id"
          class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:border-yellow-500/30 transition-all duration-300"
        >
          <!-- Achievement Header -->
          <div class="flex items-start gap-3 mb-4">
            <div
              class="w-12 h-12 bg-gray-700/50 rounded-xl border border-gray-600/50 overflow-hidden flex-shrink-0 cursor-pointer"
              @click="openAchievementDetail(achievement)"
            >
              <img
                v-if="achievement.img"
                :src="achievement.img"
                :alt="achievement.name?.fr"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3
                class="font-semibold text-gray-200 truncate cursor-pointer hover:text-yellow-400"
                @click="openAchievementDetail(achievement)"
              >
                {{ achievement.name?.fr || "Unknown" }}
              </h3>
              <div class="flex items-center gap-2 mt-1">
                <span v-if="achievement.level" class="text-xs text-blue-400">
                  Lv.{{ achievement.level }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ getCompletionCount(achievement.id) }}/{{
                    selectedCharacters.length
                  }}
                  done
                </span>
              </div>
            </div>
          </div>

          <!-- Character Checkboxes -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="char in selectedCharacters"
              :key="`grid-${char.serverId}-${char.id}-${achievement.id}`"
              @click="toggleCompletion(char, achievement)"
              :class="[
                'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 text-sm',
                isCompletedByCharacter(char, achievement.id)
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : 'bg-gray-700/30 border-gray-600/50 text-gray-400 hover:border-gray-500',
              ]"
            >
              <div
                :class="[
                  'w-4 h-4 rounded border flex items-center justify-center',
                  isCompletedByCharacter(char, achievement.id)
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-500',
                ]"
              >
                <svg
                  v-if="isCompletedByCharacter(char, achievement.id)"
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
              <span class="truncate max-w-16">{{ char.name }}</span>
            </button>
          </div>

          <!-- Rewards Preview -->
          <div
            v-if="
              getAchievementXP(achievement) > 0 ||
              getAchievementKamas(achievement) > 0
            "
            class="flex items-center gap-3 mt-3 pt-3 border-t border-gray-700/50"
          >
            <span
              v-if="getAchievementXP(achievement) > 0"
              class="text-xs text-blue-400"
            >
              ⭐ {{ formatNumber(getAchievementXP(achievement)) }} XP
            </span>
            <span
              v-if="getAchievementKamas(achievement) > 0"
              class="text-xs text-yellow-400"
            >
              💰 {{ formatNumber(getAchievementKamas(achievement)) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State for Grid -->
      <div
        v-if="!isLoading && filteredAchievements.length === 0 && viewMode === 'grid'"
        class="text-center py-16 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl"
      >
        <p class="text-gray-400">No achievements match your filters</p>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="mt-8 flex items-center justify-center gap-2"
      >
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600/50 rounded-lg text-gray-300 transition-colors"
        >
          Previous
        </button>
        <div class="flex items-center gap-1">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'w-10 h-10 rounded-lg font-medium transition-all duration-200',
              currentPage === page
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50',
            ]"
          >
            {{ page }}
          </button>
        </div>
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600/50 rounded-lg text-gray-300 transition-colors"
        >
          Next
        </button>
      </div>
    </template>

    <!-- Achievement Detail Modal -->
    <Teleport to="body">
      <div
        v-if="selectedAchievement"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="selectedAchievement = null"
      >
        <div
          class="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div class="p-6">
            <!-- Header -->
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-4">
                <div
                  class="w-16 h-16 bg-gray-700/50 rounded-xl border-2 border-yellow-500/50 overflow-hidden"
                >
                  <img
                    v-if="selectedAchievement.img"
                    :src="selectedAchievement.img"
                    :alt="selectedAchievement.name?.fr"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 class="text-xl font-bold text-yellow-400">
                    {{ selectedAchievement.name?.fr }}
                  </h2>
                  <p class="text-gray-400 text-sm mt-1">
                    {{ selectedAchievement.category?.name?.fr || "No category" }}
                  </p>
                </div>
              </div>
              <button
                @click="selectedAchievement = null"
                class="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  class="w-6 h-6"
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
            </div>

            <!-- Character Completion Grid -->
            <div class="mb-6">
              <h3
                class="text-sm font-semibold text-yellow-400 uppercase mb-3"
              >
                Character Progress
              </h3>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="char in selectedCharacters"
                  :key="`modal-${char.serverId}-${char.id}`"
                  @click="toggleCompletion(char, selectedAchievement)"
                  :class="[
                    'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
                    isCompletedByCharacter(char, selectedAchievement.id)
                      ? 'bg-green-500/20 border-green-500/50'
                      : 'bg-gray-700/30 border-gray-600/50 hover:border-gray-500',
                  ]"
                >
                  <div
                    :class="[
                      'w-6 h-6 rounded-lg border-2 flex items-center justify-center',
                      isCompletedByCharacter(char, selectedAchievement.id)
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-500',
                    ]"
                  >
                    <svg
                      v-if="isCompletedByCharacter(char, selectedAchievement.id)"
                      class="w-4 h-4 text-white"
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
                  <div class="text-left">
                    <div
                      :class="[
                        'font-medium',
                        isCompletedByCharacter(char, selectedAchievement.id)
                          ? 'text-green-300'
                          : 'text-gray-300',
                      ]"
                    >
                      {{ char.name }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ char.class }} • {{ char.serverName }}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Description -->
            <div class="mb-6">
              <h3
                class="text-sm font-semibold text-yellow-400 uppercase mb-2"
              >
                Description
              </h3>
              <p class="text-gray-300 text-sm">
                {{ selectedAchievement.description?.fr || "No description" }}
              </p>
            </div>

            <!-- Rewards -->
            <div
              v-if="
                getAchievementXP(selectedAchievement) > 0 ||
                getAchievementKamas(selectedAchievement) > 0
              "
            >
              <h3
                class="text-sm font-semibold text-yellow-400 uppercase mb-3"
              >
                Rewards
              </h3>
              <div class="flex flex-wrap gap-3">
                <div
                  v-if="getAchievementXP(selectedAchievement) > 0"
                  class="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                >
                  <span class="text-blue-400">⭐</span>
                  <span class="text-blue-300 font-medium">
                    {{ formatNumber(getAchievementXP(selectedAchievement)) }} XP
                  </span>
                </div>
                <div
                  v-if="getAchievementKamas(selectedAchievement) > 0"
                  class="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                >
                  <span class="text-yellow-400">💰</span>
                  <span class="text-yellow-300 font-medium">
                    {{ formatNumber(getAchievementKamas(selectedAchievement)) }}
                    Kamas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { onClickOutside } from "@vueuse/core";

const props = defineProps({
  servers: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
});

const emit = defineEmits(["update-servers"]);

// Constants
const maxCharacters = 8;
const characterColors = [
  "#f59e0b", // yellow
  "#3b82f6", // blue
  "#10b981", // green
  "#8b5cf6", // purple
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

// State
const selectedCharacters = ref([]);
const achievements = ref([]);
const isLoading = ref(false);
const selectedAchievement = ref(null);
const characterCompletionData = ref({});

// Category dropdown state
const showCategoryDropdown = ref(false);
const expandedCategories = ref(new Set());
const categoryDropdownRef = ref(null);

// Close dropdown when clicking outside
onClickOutside(categoryDropdownRef, () => {
  showCategoryDropdown.value = false;
});

// Filters
const searchQuery = ref("");
const selectedCategory = ref("");
const completionFilter = ref("all");
const viewMode = ref("table");

// Pagination
const total = ref(0);
const currentPage = ref(1);
const limit = ref(50);

// Computed
const allCharacters = computed(() => {
  const chars = [];
  props.servers.forEach((server) => {
    (server.characters || []).forEach((char) => {
      chars.push({
        ...char,
        serverId: server.id,
        serverName: server.name,
      });
    });
  });
  return chars;
});

const organizedCategories = computed(() => {
  const parents = props.categories.filter((c) => c.parentId === 0);
  return parents
    .map((parent) => ({
      ...parent,
      children: props.categories
        .filter((c) => c.parentId === parent.id)
        .sort((a, b) => a.order - b.order),
    }))
    .sort((a, b) => a.order - b.order);
});

const selectedCategoryName = computed(() => {
  if (!selectedCategory.value) return "";
  const category = props.categories.find(
    (c) => c.id === selectedCategory.value
  );
  return category?.name?.fr || "";
});

const totalPages = computed(() => Math.ceil(total.value / limit.value));

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

const filteredAchievements = computed(() => {
  let result = achievements.value;

  // Apply completion filter
  if (completionFilter.value === "none-completed") {
    result = result.filter(
      (a) =>
        !selectedCharacters.value.some((char) =>
          isCompletedByCharacter(char, a.id)
        )
    );
  } else if (completionFilter.value === "some-completed") {
    result = result.filter((a) => {
      const count = getCompletionCount(a.id);
      return count > 0 && count < selectedCharacters.value.length;
    });
  } else if (completionFilter.value === "all-completed") {
    result = result.filter(
      (a) => getCompletionCount(a.id) === selectedCharacters.value.length
    );
  }

  return result;
});

const aggregatedStats = computed(() => {
  let totalCompleted = 0;
  const uniqueCompletedSet = new Set();

  selectedCharacters.value.forEach((char) => {
    const key = getStorageKey(char);
    const data = characterCompletionData.value[key];
    if (data?.completedIds) {
      totalCompleted += data.completedIds.length;
      data.completedIds.forEach((id) => uniqueCompletedSet.add(id));
    }
  });

  return {
    totalCompleted,
    uniqueCompleted: uniqueCompletedSet.size,
  };
});

// Methods
const getStorageKey = (char) => `achievements-${char.serverId}-${char.id}`;

const getCharacterColor = (char, alpha = 1) => {
  const index = selectedCharacters.value.findIndex(
    (c) => c.serverId === char.serverId && c.id === char.id
  );
  const color = characterColors[index % characterColors.length];
  if (alpha === 1) return color;
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const isCharacterSelected = (char) => {
  return selectedCharacters.value.some(
    (c) => c.serverId === char.serverId && c.id === char.id
  );
};

const toggleCharacterSelection = (char) => {
  const index = selectedCharacters.value.findIndex(
    (c) => c.serverId === char.serverId && c.id === char.id
  );
  if (index !== -1) {
    selectedCharacters.value.splice(index, 1);
  } else if (selectedCharacters.value.length < maxCharacters) {
    selectedCharacters.value.push(char);
    loadCharacterData(char);
  }
};

const clearSelection = () => {
  selectedCharacters.value = [];
};

const loadCharacterData = (char) => {
  try {
    const key = getStorageKey(char);
    const saved = localStorage.getItem(key);
    if (saved) {
      characterCompletionData.value[key] = JSON.parse(saved);
    } else {
      characterCompletionData.value[key] = { level: 200, completedIds: [] };
    }
  } catch (error) {
    console.error("Failed to load character data:", error);
  }
};

const saveCharacterData = (char) => {
  try {
    const key = getStorageKey(char);
    const data = characterCompletionData.value[key];
    if (data) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error("Failed to save character data:", error);
  }
};

const isCompletedByCharacter = (char, achievementId) => {
  const key = getStorageKey(char);
  const data = characterCompletionData.value[key];
  return data?.completedIds?.includes(achievementId) || false;
};

const toggleCompletion = (char, achievement) => {
  const key = getStorageKey(char);
  if (!characterCompletionData.value[key]) {
    characterCompletionData.value[key] = { level: 200, completedIds: [] };
  }

  const data = characterCompletionData.value[key];
  const index = data.completedIds.indexOf(achievement.id);

  if (index !== -1) {
    data.completedIds.splice(index, 1);
  } else {
    data.completedIds.push(achievement.id);
  }

  // Trigger reactivity
  characterCompletionData.value = { ...characterCompletionData.value };
  saveCharacterData(char);
};

const getCompletionCount = (achievementId) => {
  return selectedCharacters.value.filter((char) =>
    isCompletedByCharacter(char, achievementId)
  ).length;
};

const getAchievementXP = (achievement) => {
  if (!achievement.rewards) return 0;
  const ratio = achievement.rewards.reduce(
    (sum, r) => sum + (r.experienceRatio || 0),
    0
  );
  if (ratio === 0) return 0;
  const base = Math.floor(200 * 200 + 20 * 200 - 20);
  return Math.floor(base * ratio);
};

const getAchievementKamas = (achievement) => {
  if (!achievement.rewards) return 0;
  const ratio = achievement.rewards.reduce(
    (sum, r) => sum + (r.kamasRatio || 0),
    0
  );
  if (ratio === 0) return 0;
  const level = achievement.level || 1;
  const base = Math.floor(level * level + 20 * level - 20);
  return Math.floor(base * ratio);
};

const formatNumber = (num) => num.toLocaleString("fr-FR");

const openAchievementDetail = (achievement) => {
  selectedAchievement.value = achievement;
};

const toggleCategoryExpand = (categoryId) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId);
  } else {
    expandedCategories.value.add(categoryId);
  }
  expandedCategories.value = new Set(expandedCategories.value);
};

const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId;
  showCategoryDropdown.value = false;
  currentPage.value = 1;
  fetchAchievements();
};

// Fetch
const getChildCategoryIds = (parentId) => {
  return props.categories
    .filter((c) => c.parentId === parentId)
    .map((c) => c.id);
};

const fetchAchievements = async () => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.append("$limit", String(limit.value));
    params.append("$skip", String((currentPage.value - 1) * limit.value));

    if (searchQuery.value) {
      params.append("slug.fr[$search]", searchQuery.value);
    }

    if (selectedCategory.value) {
      const categoryId = parseInt(selectedCategory.value);
      const childIds = getChildCategoryIds(categoryId);
      if (childIds.length > 0) {
        childIds.forEach((id) => {
          params.append("categoryId[$in][]", String(id));
        });
      } else {
        params.append("categoryId", String(selectedCategory.value));
      }
    }

    const response = await $fetch(`/api/achievements?${params.toString()}`);
    achievements.value = response.data || [];
    total.value = response.total || 0;
  } catch (error) {
    console.error("Error fetching achievements:", error);
    achievements.value = [];
  } finally {
    isLoading.value = false;
  }
};

let searchTimeout = null;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchAchievements();
  }, 300);
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchAchievements();
  }
};

// Watch for character selection changes
watch(
  selectedCharacters,
  (newVal) => {
    if (newVal.length > 0) {
      fetchAchievements();
    }
  },
  { deep: true }
);

onMounted(() => {
  selectedCharacters.value.forEach((char) => {
    loadCharacterData(char);
  });
});
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Sticky column shadow */
.sticky {
  z-index: 10;
}

table {
  border-collapse: separate;
  border-spacing: 0;
}

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
</style>