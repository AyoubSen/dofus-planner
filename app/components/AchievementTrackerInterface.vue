<!-- components/AchievementTrackerInterface.vue -->
<template>
  <div>
    <!-- Character Stats Header -->
    <div class="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- Level Input -->
      <div
        class="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-4"
      >
        <label class="block text-sm text-blue-400 mb-2">Character Level</label>
        <input
          v-model.number="characterLevel"
          type="number"
          min="1"
          max="200"
          class="w-full bg-gray-800/50 border border-blue-500/30 rounded-lg px-3 py-2 text-blue-300 font-bold text-xl focus:outline-none focus:border-blue-400"
          @change="saveCharacterData"
        />
      </div>

      <!-- Completed Count -->
      <div
        class="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-4"
      >
        <div class="text-sm text-green-400 mb-1">Completed</div>
        <div class="text-2xl font-bold text-green-300">
          {{ completedCount }}
          <span class="text-sm text-green-400/70"
            >/ {{ totalAchievements }}</span
          >
        </div>
        <div class="text-xs text-green-400/50 mt-1">
          {{ completionPercentage }}% done
        </div>
      </div>

      <!-- Total Points -->
      <div
        class="bg-gradient-to-br from-yellow-500/10 to-orange-600/10 border border-yellow-500/30 rounded-xl p-4"
      >
        <div class="text-sm text-yellow-400 mb-1">Points Earned</div>
        <div class="text-2xl font-bold text-yellow-300">
          {{ formatNumber(earnedPoints) }}
        </div>
        <div class="text-xs text-yellow-400/50 mt-1">
          {{ formatNumber(totalPoints - earnedPoints) }} remaining
        </div>
      </div>

      <!-- Potential Rewards -->
      <div
        class="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-4"
      >
        <div class="text-sm text-purple-400 mb-1">Unclaimed XP</div>
        <div class="text-2xl font-bold text-purple-300">
          {{ formatNumber(unclaimedXP) }}
        </div>
        <div class="text-xs text-purple-400/50 mt-1">
          At Lv.{{ characterLevel }}
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-400">Overall Progress</span>
        <span class="text-sm text-yellow-400 font-medium"
          >{{ completionPercentage }}%</span
        >
      </div>
      <div class="h-3 bg-gray-700/50 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
          :style="{ width: `${completionPercentage}%` }"
        ></div>
      </div>
    </div>

    <!-- Filters Bar -->
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

      <!-- Category Filter -->
      <select
        v-model="selectedCategory"
        @change="onFilterChange"
        class="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-yellow-500/50"
      >
        <option value="">All Categories</option>
        <option
          v-for="category in organizedCategories"
          :key="category.id"
          :value="category.id"
        >
          {{ category.name.fr }}
        </option>
      </select>

      <!-- Status Filter -->
      <div class="flex items-center gap-2">
        <button
          v-for="status in statusFilters"
          :key="status.value"
          @click="selectedStatus = status.value"
          :class="[
            'px-4 py-2 rounded-lg border transition-all duration-200',
            selectedStatus === status.value
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
              : 'bg-gray-700/30 border-gray-600/50 text-gray-400 hover:border-gray-500',
          ]"
        >
          {{ status.label }}
        </button>
      </div>

      <!-- Points Filter -->
      <select
        v-model="selectedPoints"
        @change="onFilterChange"
        class="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-yellow-500/50"
      >
        <option value="">All Points</option>
        <option value="1-5">1-5 pts</option>
        <option value="6-10">6-10 pts</option>
        <option value="10+">10+ pts</option>
      </select>

      <!-- Bulk Actions -->
      <div class="flex items-center gap-2 ml-auto">
        <button
          @click="showBulkActions = !showBulkActions"
          class="flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-lg text-gray-300 transition-colors"
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
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          Actions
        </button>
      </div>
    </div>

    <!-- Bulk Actions Panel -->
    <Transition name="slide-down">
      <div
        v-if="showBulkActions"
        class="mb-6 bg-gray-800/50 border border-gray-700/50 rounded-xl p-4"
      >
        <div class="flex flex-wrap items-center gap-4">
          <span class="text-gray-400 text-sm">Bulk Actions:</span>
          <button
            @click="markAllFiltered(true)"
            class="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 text-sm transition-colors"
          >
            ✓ Mark Filtered as Done
          </button>
          <button
            @click="markAllFiltered(false)"
            class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 text-sm transition-colors"
          >
            ✗ Mark Filtered as Undone
          </button>
          <div class="ml-auto flex items-center gap-2">
            <button
              @click="exportProgress"
              class="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 text-sm transition-colors"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Export
            </button>
            <label
              class="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-400 text-sm transition-colors cursor-pointer"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Import
              <input
                type="file"
                accept=".json"
                class="hidden"
                @change="importProgress"
              />
            </label>
            <button
              @click="confirmReset"
              class="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 text-sm transition-colors"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Reset All
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Stats Summary -->
    <div
      class="mb-6 flex items-center justify-between bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-3"
    >
      <span class="text-gray-400">
        Showing
        <span class="text-yellow-400 font-semibold">{{
          displayedAchievements.length
        }}</span>
        of
        <span class="text-yellow-400 font-semibold">{{ total }}</span>
        achievements
      </span>
      <div class="flex items-center gap-4 text-sm">
        <span class="text-green-400"
          >✓ {{ displayedCompletedCount }} completed</span
        >
        <span class="text-gray-400"
          >○ {{ displayedAchievements.length - displayedCompletedCount }}
          remaining</span
        >
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

    <!-- Achievements Grid -->
    <div
      v-else-if="displayedAchievements.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="achievement in displayedAchievements"
        :key="achievement.id"
        :class="[
          'group bg-gradient-to-br backdrop-blur-sm border rounded-xl p-4 transition-all duration-300 hover:shadow-xl cursor-pointer',
          isCompleted(achievement.id)
            ? 'from-green-900/30 to-green-950/30 border-green-500/30 hover:border-green-400/50 hover:shadow-green-500/10'
            : 'from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-yellow-500/50 hover:shadow-yellow-500/10',
        ]"
        @click="toggleCompletion(achievement)"
      >
        <div class="flex items-start gap-4">
          <!-- Completion Checkbox -->
          <div class="flex-shrink-0 pt-1">
            <div
              :class="[
                'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200',
                isCompleted(achievement.id)
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-500 group-hover:border-yellow-500',
              ]"
            >
              <svg
                v-if="isCompleted(achievement.id)"
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
          </div>

          <!-- Achievement Icon -->
          <div
            class="flex-shrink-0"
            @click.stop="openAchievementDetail(achievement)"
          >
            <div
              :class="[
                'w-14 h-14 rounded-xl border-2 transition-colors overflow-hidden',
                isCompleted(achievement.id)
                  ? 'bg-green-700/30 border-green-500/50'
                  : 'bg-gray-700/50 border-gray-600/50 group-hover:border-yellow-500/50',
              ]"
            >
              <img
                v-if="achievement.img"
                :src="achievement.img"
                :alt="achievement.name?.fr"
                class="w-full h-full object-cover"
                :class="{ 'opacity-50': isCompleted(achievement.id) }"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-gray-500"
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
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- Achievement Info -->
          <div
            class="flex-1 min-w-0"
            @click.stop="openAchievementDetail(achievement)"
          >
            <h3
              :class="[
                'font-semibold transition-colors truncate',
                isCompleted(achievement.id)
                  ? 'text-green-300 line-through opacity-70'
                  : 'text-gray-100 group-hover:text-yellow-400',
              ]"
            >
              {{ achievement.name?.fr || "Unknown" }}
            </h3>
            <p
              class="text-sm text-gray-400 mt-1 line-clamp-2"
              :class="{ 'opacity-50': isCompleted(achievement.id) }"
            >
              {{ achievement.description?.fr || "No description" }}
            </p>

            <!-- Meta Info -->
            <div class="flex items-center gap-2 mt-2 flex-wrap">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border',
                  isCompleted(achievement.id)
                    ? 'bg-green-500/10 text-green-300 border-green-500/30'
                    : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
                ]"
              >
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </svg>
                {{ achievement.points }}
              </span>
              <span
                v-if="achievement.level"
                class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-300 text-xs font-medium rounded border border-blue-500/30"
              >
                Lv.{{ achievement.level }}
              </span>
              <span
                v-if="achievement.category?.name?.fr"
                class="px-2 py-0.5 bg-purple-500/10 text-purple-300 text-xs font-medium rounded border border-purple-500/30 truncate max-w-20"
              >
                {{ achievement.category.name.fr }}
              </span>
            </div>
          </div>

          <!-- Info Button -->
          <button
            @click.stop="openAchievementDetail(achievement)"
            class="flex-shrink-0 p-2 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-gray-700/50 transition-all duration-200"
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
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
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p class="text-lg text-gray-400">No achievements found</p>
      <p class="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
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
                  :class="[
                    'w-20 h-20 rounded-xl border-2 overflow-hidden',
                    isCompleted(selectedAchievement.id)
                      ? 'bg-green-700/30 border-green-500/50'
                      : 'bg-gray-700/50 border-yellow-500/50',
                  ]"
                >
                  <img
                    v-if="selectedAchievement.img"
                    :src="selectedAchievement.img"
                    :alt="selectedAchievement.name?.fr"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2
                    :class="[
                      'text-2xl font-bold',
                      isCompleted(selectedAchievement.id)
                        ? 'text-green-400'
                        : 'text-yellow-400',
                    ]"
                  >
                    {{ selectedAchievement.name?.fr }}
                  </h2>
                  <p class="text-gray-400 mt-1">
                    {{
                      selectedAchievement.category?.name?.fr || "No category"
                    }}
                  </p>
                  <div
                    v-if="isCompleted(selectedAchievement.id)"
                    class="flex items-center gap-2 mt-2 text-green-400 text-sm"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Completed
                  </div>
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

            <!-- Toggle Completion Button -->
            <button
              @click="toggleCompletion(selectedAchievement)"
              :class="[
                'w-full mb-6 py-3 rounded-xl font-semibold transition-all duration-200',
                isCompleted(selectedAchievement.id)
                  ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400'
                  : 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400',
              ]"
            >
              {{
                isCompleted(selectedAchievement.id)
                  ? "✗ Mark as Not Completed"
                  : "✓ Mark as Completed"
              }}
            </button>

            <!-- Description -->
            <div class="mb-6">
              <h3 class="text-sm font-semibold text-yellow-400 uppercase mb-2">
                Description
              </h3>
              <p class="text-gray-300">
                {{ selectedAchievement.description?.fr || "No description" }}
              </p>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div
                class="bg-gray-700/30 rounded-xl p-4 text-center border border-gray-600/30"
              >
                <div class="text-2xl font-bold text-yellow-400">
                  {{ selectedAchievement.points }}
                </div>
                <div class="text-sm text-gray-400">Points</div>
              </div>
              <div
                class="bg-gray-700/30 rounded-xl p-4 text-center border border-gray-600/30"
              >
                <div class="text-2xl font-bold text-blue-400">
                  {{ selectedAchievement.level || "N/A" }}
                </div>
                <div class="text-sm text-gray-400">Level</div>
              </div>
              <div
                class="bg-gray-700/30 rounded-xl p-4 text-center border border-gray-600/30"
              >
                <div class="text-2xl font-bold text-purple-400">
                  {{ selectedAchievement.id }}
                </div>
                <div class="text-sm text-gray-400">ID</div>
              </div>
            </div>

            <!-- Rewards -->
            <div
              v-if="
                selectedAchievement.rewards &&
                selectedAchievement.rewards.length > 0
              "
            >
              <h3 class="text-sm font-semibold text-yellow-400 uppercase mb-3">
                Rewards (at Lv.{{ characterLevel }})
              </h3>

              <div class="flex flex-wrap gap-3 mb-4">
                <div
                  v-if="
                    getTotalExperienceRatio(selectedAchievement.rewards) > 0
                  "
                  class="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                >
                  <span class="text-blue-400 text-lg">⭐</span>
                  <div>
                    <div class="text-blue-300 font-medium">
                      {{
                        formatNumber(
                          calculateXP(
                            characterLevel,
                            getTotalExperienceRatio(selectedAchievement.rewards)
                          )
                        )
                      }}
                      XP
                    </div>
                  </div>
                </div>

                <div
                  v-if="getTotalKamasRatio(selectedAchievement.rewards) > 0"
                  class="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                >
                  <span class="text-yellow-400 text-lg">💰</span>
                  <div>
                    <div class="text-yellow-300 font-medium">
                      {{
                        formatNumber(
                          calculateKamas(
                            selectedAchievement.level,
                            getTotalKamasRatio(selectedAchievement.rewards)
                          )
                        )
                      }}
                      Kamas
                    </div>
                  </div>
                </div>

                <div
                  v-if="getTotalGuildPoints(selectedAchievement.rewards) > 0"
                  class="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg"
                >
                  <span class="text-purple-400 text-lg">🏰</span>
                  <div>
                    <div class="text-purple-300 font-medium">
                      {{ getTotalGuildPoints(selectedAchievement.rewards) }}
                      Guild Points
                    </div>
                  </div>
                </div>
              </div>

              <!-- Item Rewards -->
              <div
                v-if="getItemRewards(selectedAchievement.rewards).length > 0"
              >
                <h4 class="text-xs font-semibold text-gray-400 uppercase mb-2">
                  Item Rewards
                </h4>
                <div class="grid grid-cols-1 gap-2">
                  <div
                    v-for="item in getItemRewards(selectedAchievement.rewards)"
                    :key="item.id"
                    class="flex items-center gap-3 p-3 bg-gray-700/30 border border-gray-600/30 rounded-lg"
                  >
                    <div
                      class="w-10 h-10 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0"
                    >
                      <img
                        v-if="item.img"
                        :src="item.img"
                        :alt="item.name?.fr"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-gray-200 font-medium truncate">
                        {{ item.name?.fr || "Unknown Item" }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ item.type?.name?.fr || "Item" }}
                      </div>
                    </div>
                    <div class="text-yellow-400 font-bold text-lg">
                      x{{ item.quantity }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Title Rewards -->
              <div
                v-if="getTitleRewards(selectedAchievement.rewards).length > 0"
                class="mt-3"
              >
                <h4 class="text-xs font-semibold text-gray-400 uppercase mb-2">
                  Titles
                </h4>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="title in getTitleRewards(
                      selectedAchievement.rewards
                    )"
                    :key="title.id"
                    class="px-3 py-1 bg-pink-500/10 border border-pink-500/30 rounded-lg text-pink-300 text-sm"
                  >
                    🏷️ {{ title.name?.fr || title }}
                  </span>
                </div>
              </div>

              <!-- Ornament Rewards -->
              <div
                v-if="
                  getOrnamentRewards(selectedAchievement.rewards).length > 0
                "
                class="mt-3"
              >
                <h4 class="text-xs font-semibold text-gray-400 uppercase mb-2">
                  Ornaments
                </h4>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="ornament in getOrnamentRewards(
                      selectedAchievement.rewards
                    )"
                    :key="ornament.id"
                    class="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-300 text-sm"
                  >
                    ✨ {{ ornament.name?.fr || ornament }}
                  </span>
                </div>
              </div>

              <!-- Emote Rewards -->
              <div
                v-if="getEmoteRewards(selectedAchievement.rewards).length > 0"
                class="mt-3"
              >
                <h4 class="text-xs font-semibold text-gray-400 uppercase mb-2">
                  Emotes
                </h4>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="emote in getEmoteRewards(
                      selectedAchievement.rewards
                    )"
                    :key="emote"
                    class="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-sm"
                  >
                    😄 Emote #{{ emote }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Reset Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showResetConfirm"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showResetConfirm = false"
      >
        <div
          class="bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/50 rounded-2xl max-w-md w-full p-6"
        >
          <div class="text-center">
            <div
              class="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-red-400"
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
            <h3 class="text-xl font-bold text-gray-100 mb-2">Reset Progress?</h3>
            <p class="text-gray-400 mb-6">
              This will clear all completion data for this character. This
              action cannot be undone.
            </p>
            <div class="flex gap-3">
              <button
                @click="showResetConfirm = false"
                class="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-lg text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="resetProgress"
                class="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
const props = defineProps({
  server: { type: Object, required: true },
  character: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
});

// State
const achievements = ref([]);
const isLoading = ref(false);
const selectedAchievement = ref(null);
const showBulkActions = ref(false);
const showResetConfirm = ref(false);

// Pagination
const total = ref(0);
const currentPage = ref(1);
const limit = ref(30);

// Character data
const characterLevel = ref(200);
const completedAchievements = ref(new Set());

// Stats data (fetched separately for accurate totals)
const totalAchievements = ref(0);
const totalPoints = ref(0);
const allAchievementsForStats = ref([]);

// Filters
const searchQuery = ref("");
const selectedCategory = ref("");
const selectedStatus = ref("");
const selectedPoints = ref("");

const statusFilters = [
  { label: "All", value: "" },
  { label: "Completed", value: "completed" },
  { label: "Remaining", value: "remaining" },
];

// Computed
const organizedCategories = computed(() => {
  return props.categories
    .filter((c) => c.parentId === 0)
    .sort((a, b) => a.order - b.order);
});

// Apply client-side status filter to server-fetched achievements
const displayedAchievements = computed(() => {
  let result = achievements.value;

  if (selectedStatus.value === "completed") {
    result = result.filter((a) => completedAchievements.value.has(a.id));
  } else if (selectedStatus.value === "remaining") {
    result = result.filter((a) => !completedAchievements.value.has(a.id));
  }

  return result;
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

const completedCount = computed(() => completedAchievements.value.size);

const completionPercentage = computed(() => {
  if (totalAchievements.value === 0) return 0;
  return Math.round((completedCount.value / totalAchievements.value) * 100);
});

const displayedCompletedCount = computed(() => {
  return displayedAchievements.value.filter((a) =>
    completedAchievements.value.has(a.id)
  ).length;
});

const earnedPoints = computed(() => {
  return allAchievementsForStats.value
    .filter((a) => completedAchievements.value.has(a.id))
    .reduce((sum, a) => sum + (a.points || 0), 0);
});

const unclaimedXP = computed(() => {
  return allAchievementsForStats.value
    .filter((a) => !completedAchievements.value.has(a.id) && a.rewards)
    .reduce((sum, a) => {
      const ratio = getTotalExperienceRatio(a.rewards);
      return sum + calculateXP(characterLevel.value, ratio);
    }, 0);
});

// Methods
const isCompleted = (achievementId) =>
  completedAchievements.value.has(achievementId);

const toggleCompletion = (achievement) => {
  if (completedAchievements.value.has(achievement.id)) {
    completedAchievements.value.delete(achievement.id);
  } else {
    completedAchievements.value.add(achievement.id);
  }
  completedAchievements.value = new Set(completedAchievements.value);
  saveCharacterData();
};

const openAchievementDetail = (achievement) => {
  selectedAchievement.value = achievement;
};

// Debounced search
let searchTimeout = null;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchAchievements();
  }, 300);
};

const onFilterChange = () => {
  currentPage.value = 1;
  fetchAchievements();
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchAchievements();
  }
};

const getChildCategoryIds = (parentId) => {
  return props.categories.filter((c) => c.parentId === parentId).map((c) => c.id);
};

// Fetch achievements with server-side filtering (same as browse mode)
const fetchAchievements = async () => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.append("$limit", String(limit.value));
    params.append("$skip", String((currentPage.value - 1) * limit.value));

    // Search filter (server-side)
    if (searchQuery.value) {
      params.append("slug.fr[$search]", searchQuery.value);
    }

    // Category filter
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

    // Points filter
    if (selectedPoints.value) {
      if (selectedPoints.value === "1-5") {
        params.append("points[$gte]", "1");
        params.append("points[$lte]", "5");
      } else if (selectedPoints.value === "6-10") {
        params.append("points[$gte]", "6");
        params.append("points[$lte]", "10");
      } else if (selectedPoints.value === "10+") {
        params.append("points[$gt]", "10");
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

// Fetch all achievements for stats calculation (runs once)
const fetchAllAchievementsForStats = async () => {
  try {
    const allAchievements = [];
    let skip = 0;
    const batchLimit = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await $fetch(
        `/api/achievements?$limit=${batchLimit}&$skip=${skip}`
      );
      allAchievements.push(...(response.data || []));
      hasMore = response.data?.length === batchLimit;
      skip += batchLimit;
    }

    allAchievementsForStats.value = allAchievements;
    totalAchievements.value = allAchievements.length;
    totalPoints.value = allAchievements.reduce(
      (sum, a) => sum + (a.points || 0),
      0
    );
  } catch (error) {
    console.error("Error fetching all achievements for stats:", error);
  }
};

const markAllFiltered = (completed) => {
  displayedAchievements.value.forEach((a) => {
    if (completed) {
      completedAchievements.value.add(a.id);
    } else {
      completedAchievements.value.delete(a.id);
    }
  });
  completedAchievements.value = new Set(completedAchievements.value);
  saveCharacterData();
};

const confirmReset = () => {
  showResetConfirm.value = true;
};

const resetProgress = () => {
  completedAchievements.value = new Set();
  showResetConfirm.value = false;
  saveCharacterData();
};

const exportProgress = () => {
  const data = {
    server: props.server.name,
    character: props.character.name,
    level: characterLevel.value,
    completedIds: Array.from(completedAchievements.value),
    exportDate: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `achievements-${props.server.name}-${props.character.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const importProgress = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.completedIds && Array.isArray(data.completedIds)) {
        completedAchievements.value = new Set(data.completedIds);
        if (data.level) characterLevel.value = data.level;
        saveCharacterData();
      }
    } catch (error) {
      console.error("Failed to import progress:", error);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
};

// Reward helpers
const getTotalExperienceRatio = (rewards) => {
  if (!rewards) return 0;
  return rewards.reduce((sum, r) => sum + (r.experienceRatio || 0), 0);
};

const getTotalKamasRatio = (rewards) => {
  if (!rewards) return 0;
  return rewards.reduce((sum, r) => sum + (r.kamasRatio || 0), 0);
};

const getTotalGuildPoints = (rewards) => {
  if (!rewards) return 0;
  return rewards.reduce((sum, r) => sum + (r.guildPoints || 0), 0);
};

const getItemRewards = (rewards) => {
  if (!rewards) return [];
  const items = [];
  rewards.forEach((reward) => {
    if (reward.items && reward.itemsQuantityReward) {
      reward.items.forEach((item, index) => {
        items.push({
          ...item,
          quantity: reward.itemsQuantityReward[index] || 1,
        });
      });
    }
  });
  return items;
};

const getTitleRewards = (rewards) => {
  if (!rewards) return [];
  const titles = [];
  rewards.forEach((reward) => {
    if (reward.titles && reward.titles.length > 0) {
      titles.push(...reward.titles);
    } else if (reward.titlesReward && reward.titlesReward.length > 0) {
      titles.push(...reward.titlesReward);
    }
  });
  return titles;
};

const getOrnamentRewards = (rewards) => {
  if (!rewards) return [];
  const ornaments = [];
  rewards.forEach((reward) => {
    if (reward.ornaments && reward.ornaments.length > 0) {
      ornaments.push(...reward.ornaments);
    } else if (reward.ornamentsReward && reward.ornamentsReward.length > 0) {
      ornaments.push(...reward.ornamentsReward);
    }
  });
  return ornaments;
};

const getEmoteRewards = (rewards) => {
  if (!rewards) return [];
  const emotes = [];
  rewards.forEach((reward) => {
    if (reward.emotesReward && reward.emotesReward.length > 0) {
      emotes.push(...reward.emotesReward);
    }
  });
  return emotes;
};

const calculateKamas = (achievementLevel, kamasRatio) => {
  if (!kamasRatio || kamasRatio === 0) return 0;
  const base = Math.floor(
    achievementLevel * achievementLevel + 20 * achievementLevel - 20
  );
  return Math.floor(base * kamasRatio);
};

const calculateXP = (charLevel, experienceRatio) => {
  if (!experienceRatio || experienceRatio === 0) return 0;
  const base = Math.floor(charLevel * charLevel + 20 * charLevel - 20);
  return Math.floor(base * experienceRatio);
};

const formatNumber = (num) => num.toLocaleString("fr-FR");

// Storage
const getStorageKey = () =>
  `achievements-${props.server.id}-${props.character.id}`;

const loadCharacterData = () => {
  try {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      const data = JSON.parse(saved);
      characterLevel.value = data.level || 200;
      completedAchievements.value = new Set(data.completedIds || []);
    }
  } catch (error) {
    console.error("Failed to load character data:", error);
  }
};

const saveCharacterData = () => {
  try {
    const data = {
      level: characterLevel.value,
      completedIds: Array.from(completedAchievements.value),
    };
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save character data:", error);
  }
};

onMounted(() => {
  loadCharacterData();
  fetchAchievements();
  fetchAllAchievementsForStats();
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>