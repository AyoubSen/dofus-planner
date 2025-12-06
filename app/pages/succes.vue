<!-- pages/succes.vue -->
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
            class="group flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-all duration-200 text-lg"
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

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg"
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
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <div>
              <h1
                class="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
              >
                Succès
              </h1>
              <p class="text-gray-400 text-lg mt-1">
                Browse and track your Dofus achievements
              </p>
            </div>
          </div>

          <!-- Mode Toggle -->
          <div class="flex items-center gap-3">
            <!-- Bookmarks Toggle (only in browse mode) -->
            <button
              v-if="currentMode === 'browse'"
              @click="showBookmarksOnly = !showBookmarksOnly"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200',
                showBookmarksOnly
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600',
              ]"
            >
              <svg
                class="w-5 h-5"
                :fill="showBookmarksOnly ? 'currentColor' : 'none'"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <span>Bookmarks</span>
              <span
                v-if="bookmarkedAchievements.length > 0"
                class="px-2 py-0.5 bg-yellow-500/30 rounded-full text-xs"
              >
                {{ bookmarkedAchievements.length }}
              </span>
            </button>

            <!-- Mode Switch -->
            <div
              class="flex items-center bg-gray-800/50 border border-gray-700/50 rounded-xl p-1"
            >
              <button
                @click="switchMode('browse')"
                :class="[
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                  currentMode === 'browse'
                    ? 'bg-yellow-500 text-gray-900 font-semibold'
                    : 'text-gray-400 hover:text-gray-200',
                ]"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Browse
              </button>
              <button
                @click="switchMode('track')"
                :class="[
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                  currentMode === 'track'
                    ? 'bg-yellow-500 text-gray-900 font-semibold'
                    : 'text-gray-400 hover:text-gray-200',
                ]"
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                Track Progress
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Track Mode -->
      <Transition name="fade" mode="out-in">
        <div v-if="currentMode === 'track'" key="track-mode">
          <!-- Breadcrumb Navigation -->
          <div class="mb-8">
            <div class="flex items-center gap-2 text-sm">
              <span
                :class="[
                  'px-3 py-1 rounded-full border',
                  currentServer
                    ? 'bg-gray-800/50 text-gray-300 border-gray-700/50'
                    : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
                ]"
              >
                {{ currentServer ? "✓" : "1" }} Server
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
                      ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
                      : 'bg-gray-700/30 text-gray-500 border-gray-600/30',
                ]"
              >
                {{ currentCharacter ? "✓" : "2" }} Character
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
                    ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
                    : 'bg-gray-700/30 text-gray-500 border-gray-600/30',
                ]"
              >
                3 Tracking
              </span>
            </div>
          </div>

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
                    Select a server to track your achievements progress
                  </p>
                </div>

                <AchievementServerSelector
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
                      <span class="text-yellow-400 font-semibold">{{
                        currentServer.name
                      }}</span>
                    </p>
                  </div>
                  <button
                    @click="currentServer = null"
                    class="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-yellow-400 transition-colors duration-200"
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

                <AchievementCharacterSelector
                  :server="currentServer"
                  @character-selected="selectCharacter"
                  @character-added="addCharacter"
                  @character-deleted="deleteCharacter"
                />
              </div>
            </div>

            <!-- Tracker Interface -->
            <div v-else key="tracker-interface">
              <div
                class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
              >
                <!-- Header -->
                <div
                  class="bg-gradient-to-r from-yellow-500/10 to-orange-600/10 border-b border-gray-700/50 p-6"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <div
                        class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center"
                      >
                        <span class="text-white font-bold text-lg">{{
                          currentCharacter.name.charAt(0).toUpperCase()
                        }}</span>
                      </div>
                      <div>
                        <h2 class="text-2xl font-bold text-gray-100">
                          {{ currentCharacter.name }}
                        </h2>
                        <p class="text-gray-400">
                          {{ currentCharacter.class }} •
                          {{ currentServer.name }}
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
                        class="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-yellow-400 transition-colors duration-200"
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

                <!-- Tracker Content -->
                <div class="p-6">
                  <AchievementTrackerInterface
                    :server="currentServer"
                    :character="currentCharacter"
                    :categories="categories"
                  />
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Browse Mode -->
        <div v-else key="browse-mode">
          <div class="flex gap-8">
            <!-- Filters Sidebar -->
            <div
              v-if="!showBookmarksOnly"
              class="w-72 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 h-fit shadow-2xl flex-shrink-0"
            >
              <div class="flex items-center gap-3 mb-6">
                <div
                  class="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center"
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
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                </div>
                <h2 class="text-xl font-bold text-gray-100">FILTERS</h2>
              </div>

              <div class="mb-6">
                <h3
                  class="text-sm font-semibold mb-3 text-yellow-400 uppercase tracking-wide"
                >
                  Search
                </h3>
                <input
                  v-model="filters.search"
                  type="text"
                  placeholder="Search achievements..."
                  class="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50"
                  @input="debouncedSearch"
                />
              </div>

              <!-- Category Filter -->
              <div class="mb-6">
                <h3
                  class="text-sm font-semibold mb-3 text-yellow-400 uppercase tracking-wide"
                >
                  Category
                </h3>
                <div class="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
                  <label
                    class="flex items-center p-2 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                  >
                    <input
                      type="radio"
                      value=""
                      v-model="filters.categoryId"
                      @change="fetchAchievements"
                      class="mr-3 text-yellow-500 focus:ring-yellow-500 focus:ring-2"
                    />
                    <span class="text-gray-300">All Categories</span>
                  </label>

                  <template
                    v-for="parent in organizedCategories"
                    :key="parent.id"
                  >
                    <div class="flex items-center">
                      <label
                        class="flex-1 flex items-center p-2 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                      >
                        <input
                          type="radio"
                          :value="parent.id"
                          v-model="filters.categoryId"
                          @change="fetchAchievements"
                          class="mr-3 text-yellow-500 focus:ring-yellow-500 focus:ring-2"
                        />
                        <span class="text-gray-200 font-medium">{{
                          parent.name.fr
                        }}</span>
                        <span
                          v-if="parent.children.length > 0"
                          class="ml-1 text-gray-500 text-xs"
                        >
                          ({{ parent.children.length }})
                        </span>
                      </label>
                      <button
                        v-if="parent.children.length > 0"
                        @click="toggleCategory(parent.id)"
                        class="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-yellow-400 transition-colors"
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

                    <div
                      v-if="parent.children.length > 0"
                      v-show="expandedCategories.has(parent.id)"
                      class="overflow-hidden"
                    >
                      <label
                        v-for="child in parent.children"
                        :key="child.id"
                        class="flex items-center p-2 pl-6 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                      >
                        <input
                          type="radio"
                          :value="child.id"
                          v-model="filters.categoryId"
                          @change="fetchAchievements"
                          class="mr-3 text-yellow-500 focus:ring-yellow-500 focus:ring-2"
                        />
                        <span class="text-gray-400 text-sm">{{
                          child.name.fr
                        }}</span>
                      </label>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Points Range Filter -->
              <div class="mb-6">
                <h3
                  class="text-sm font-semibold mb-3 text-yellow-400 uppercase tracking-wide"
                >
                  Points
                </h3>
                <div class="grid grid-cols-2 gap-2">
                  <label
                    v-for="pointRange in pointRanges"
                    :key="pointRange.label"
                    class="group cursor-pointer"
                  >
                    <input
                      type="radio"
                      :value="pointRange.value"
                      v-model="filters.points"
                      @change="fetchAchievements"
                      class="sr-only"
                    />
                    <div
                      :class="[
                        'w-full py-2 px-3 rounded-lg border transition-all duration-200 text-center',
                        'group-hover:border-gray-500 group-hover:bg-gray-700/50',
                        filters.points === pointRange.value
                          ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                          : 'border-gray-600/50 bg-gray-700/30 text-gray-400',
                      ]"
                    >
                      <span class="font-medium text-sm">{{
                        pointRange.label
                      }}</span>
                    </div>
                  </label>
                </div>
              </div>

              <button
                @click="resetFilters"
                class="w-full px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-lg text-gray-300 transition-colors"
              >
                Reset Filters
              </button>
            </div>

            <!-- Main Content -->
            <div class="flex-1">
              <!-- Stats Bar -->
              <div
                class="mb-6 flex items-center justify-between bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4"
              >
                <div class="flex items-center gap-4">
                  <span v-if="showBookmarksOnly" class="text-gray-400">
                    <span class="text-yellow-400 font-semibold">{{
                      bookmarkedAchievements.length
                    }}</span>
                    bookmarked achievements
                  </span>
                  <span v-else class="text-gray-400">
                    Showing
                    <span class="text-yellow-400 font-semibold">{{
                      achievements.length
                    }}</span>
                    of
                    <span class="text-yellow-400 font-semibold">{{
                      total
                    }}</span>
                    achievements
                  </span>
                </div>

                <div
                  v-if="showBookmarksOnly && bookmarkedAchievements.length > 0"
                  class="flex items-center gap-4"
                >
                  <div
                    class="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                  >
                    <span class="text-yellow-400">💰</span>
                    <span class="text-yellow-300 font-medium">{{
                      formatNumber(totalBookmarkedKamas)
                    }}</span>
                    <span class="text-yellow-400/70 text-sm">Kamas</span>
                  </div>
                  <div
                    class="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                  >
                    <span class="text-blue-400">⭐</span>
                    <span class="text-blue-300 font-medium">{{
                      formatNumber(totalBookmarkedXP)
                    }}</span>
                    <span class="text-blue-400/70 text-sm">XP (Lv.200)</span>
                  </div>
                  <div
                    class="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-lg"
                  >
                    <svg
                      class="w-4 h-4 text-orange-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                    <span class="text-orange-300 font-medium">{{
                      totalBookmarkedPoints
                    }}</span>
                    <span class="text-orange-400/70 text-sm">Points</span>
                  </div>
                </div>

                <div v-if="!showBookmarksOnly" class="flex items-center gap-2">
                  <span class="text-gray-400 text-sm">Per page:</span>
                  <select
                    v-model="limit"
                    @change="fetchAchievements"
                    class="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1 text-gray-200 focus:outline-none focus:border-yellow-500/50"
                  >
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                  </select>
                </div>
              </div>

              <!-- Loading State -->
              <div
                v-if="isLoading && !showBookmarksOnly"
                class="flex justify-center items-center h-64"
              >
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
                  class="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10"
                >
                  <div class="flex items-start gap-4">
                    <div
                      class="flex-shrink-0 cursor-pointer"
                      @click="handleAchievementClick(achievement)"
                    >
                      <div
                        class="w-16 h-16 bg-gray-700/50 rounded-xl border-2 border-gray-600/50 group-hover:border-yellow-500/50 transition-colors overflow-hidden"
                      >
                        <img
                          v-if="achievement.img"
                          :src="achievement.img"
                          :alt="achievement.name?.fr"
                          class="w-full h-full object-cover"
                          @error="handleImageError"
                        />
                        <div
                          v-else
                          class="w-full h-full flex items-center justify-center text-gray-500"
                        >
                          <svg
                            class="w-8 h-8"
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

                    <div
                      class="flex-1 min-w-0 cursor-pointer"
                      @click="handleAchievementClick(achievement)"
                    >
                      <h3
                        class="font-semibold text-gray-100 group-hover:text-yellow-400 transition-colors truncate"
                      >
                        {{ achievement.name?.fr || "Unknown" }}
                      </h3>
                      <p class="text-sm text-gray-400 mt-1 line-clamp-2">
                        {{ achievement.description?.fr || "No description" }}
                      </p>

                      <div class="flex items-center gap-2 mt-3 flex-wrap">
                        <span
                          class="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-300 text-xs font-medium rounded border border-yellow-500/30"
                        >
                          <svg
                            class="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
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

                    <button
                      @click.stop="toggleBookmark(achievement)"
                      :class="[
                        'flex-shrink-0 p-2 rounded-lg transition-all duration-200',
                        isBookmarked(achievement.id)
                          ? 'text-yellow-400 bg-yellow-500/20'
                          : 'text-gray-500 hover:text-yellow-400 hover:bg-gray-700/50',
                      ]"
                    >
                      <svg
                        class="w-5 h-5"
                        :fill="
                          isBookmarked(achievement.id) ? 'currentColor' : 'none'
                        "
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
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
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                <p v-if="showBookmarksOnly" class="text-lg text-gray-400">
                  No bookmarked achievements
                </p>
                <p v-else class="text-lg text-gray-400">No achievements found</p>
                <p class="text-sm text-gray-500 mt-2">
                  {{
                    showBookmarksOnly
                      ? "Bookmark some achievements to see them here"
                      : "Try adjusting your filters"
                  }}
                </p>
              </div>

              <!-- Pagination -->
              <div
                v-if="!showBookmarksOnly && totalPages > 1"
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
            </div>
          </div>
        </div>
      </Transition>
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
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-4">
                <div
                  class="w-20 h-20 bg-gray-700/50 rounded-xl border-2 border-yellow-500/50 overflow-hidden"
                >
                  <img
                    v-if="selectedAchievement.img"
                    :src="selectedAchievement.img"
                    :alt="selectedAchievement.name?.fr"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 class="text-2xl font-bold text-yellow-400">
                    {{ selectedAchievement.name?.fr }}
                  </h2>
                  <p class="text-gray-400 mt-1">
                    {{
                      selectedAchievement.category?.name?.fr || "No category"
                    }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="toggleBookmark(selectedAchievement)"
                  :class="[
                    'p-2 rounded-lg transition-all duration-200',
                    isBookmarked(selectedAchievement.id)
                      ? 'text-yellow-400 bg-yellow-500/20'
                      : 'text-gray-400 hover:text-yellow-400 hover:bg-gray-700/50',
                  ]"
                >
                  <svg
                    class="w-6 h-6"
                    :fill="
                      isBookmarked(selectedAchievement.id)
                        ? 'currentColor'
                        : 'none'
                    "
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>
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
            </div>

            <div class="mb-6">
              <h3 class="text-sm font-semibold text-yellow-400 uppercase mb-2">
                Description
              </h3>
              <p class="text-gray-300">
                {{ selectedAchievement.description?.fr || "No description" }}
              </p>
            </div>

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

            <div
              v-if="
                selectedAchievement.rewards &&
                selectedAchievement.rewards.length > 0
              "
              class="mb-6"
            >
              <h3 class="text-sm font-semibold text-yellow-400 uppercase mb-3">
                Rewards
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
                            200,
                            getTotalExperienceRatio(selectedAchievement.rewards)
                          )
                        )
                      }}
                      XP
                    </div>
                    <div class="text-xs text-blue-400/70">
                      {{
                        (
                          getTotalExperienceRatio(
                            selectedAchievement.rewards
                          ) * 100
                        ).toFixed(0)
                      }}%
                      ratio (at Lv.200)
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
                    <div class="text-xs text-yellow-400/70">
                      {{
                        (
                          getTotalKamasRatio(selectedAchievement.rewards) * 100
                        ).toFixed(0)
                      }}%
                      ratio (Lv.{{ selectedAchievement.level }})
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

              <div
                v-if="!hasAnyRewards(selectedAchievement.rewards)"
                class="text-gray-500 text-sm"
              >
                No rewards for this achievement
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
useHead({
  title: "Succès - Dofus Stuff",
  meta: [
    {
      name: "description",
      content: "Browse and track Dofus achievements",
    },
  ],
});

const BOOKMARKS_KEY = "dofus-achievement-bookmarks";
const SERVERS_KEY = "dofus-achievement-servers";

// Mode state
const currentMode = ref("browse");

// Track mode state
const servers = ref([]);
const currentServer = ref(null);
const currentCharacter = ref(null);

// Browse mode state
const achievements = ref([]);
const categories = ref([]);
const isLoading = ref(false);
const selectedAchievement = ref(null);
const total = ref(0);
const currentPage = ref(1);
const limit = ref(20);
const showBookmarksOnly = ref(false);
const bookmarkedAchievements = ref([]);
const expandedCategories = ref(new Set());

const filters = ref({
  search: "",
  categoryId: "",
  points: "",
});

const pointRanges = [
  { label: "All", value: "" },
  { label: "1-5", value: "1-5" },
  { label: "6-10", value: "6-10" },
  { label: "10+", value: "10+" },
];

// Computed
const totalPages = computed(() => Math.ceil(total.value / limit.value));

const totalBookmarkedKamas = computed(() => {
  return bookmarkedAchievements.value.reduce((total, achievement) => {
    if (!achievement.rewards) return total;
    const kamasRatio = getTotalKamasRatio(achievement.rewards);
    return total + calculateKamas(achievement.level, kamasRatio);
  }, 0);
});

const totalBookmarkedXP = computed(() => {
  return bookmarkedAchievements.value.reduce((total, achievement) => {
    if (!achievement.rewards) return total;
    const xpRatio = getTotalExperienceRatio(achievement.rewards);
    return total + calculateXP(200, xpRatio);
  }, 0);
});

const totalBookmarkedPoints = computed(() => {
  return bookmarkedAchievements.value.reduce((total, achievement) => {
    return total + (achievement.points || 0);
  }, 0);
});

const displayedAchievements = computed(() => {
  if (showBookmarksOnly.value) {
    return bookmarkedAchievements.value;
  }
  return achievements.value;
});

const organizedCategories = computed(() => {
  const parents = categories.value.filter((c) => c.parentId === 0);
  return parents
    .map((parent) => ({
      ...parent,
      children: categories.value
        .filter((c) => c.parentId === parent.id)
        .sort((a, b) => a.order - b.order),
    }))
    .sort((a, b) => a.order - b.order);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// Methods
const switchMode = (mode) => {
  currentMode.value = mode;
  if (mode === "browse") {
    showBookmarksOnly.value = false;
  }
};

const toggleCategory = (categoryId) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId);
  } else {
    expandedCategories.value.add(categoryId);
  }
  expandedCategories.value = new Set(expandedCategories.value);
};

let searchTimeout = null;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchAchievements();
  }, 300);
};

const getChildCategoryIds = (parentId) => {
  return categories.value
    .filter((c) => c.parentId === parentId)
    .map((c) => c.id);
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

const hasAnyRewards = (rewards) => {
  if (!rewards) return false;
  return (
    getTotalExperienceRatio(rewards) > 0 ||
    getTotalKamasRatio(rewards) > 0 ||
    getTotalGuildPoints(rewards) > 0 ||
    getItemRewards(rewards).length > 0 ||
    getTitleRewards(rewards).length > 0 ||
    getOrnamentRewards(rewards).length > 0 ||
    getEmoteRewards(rewards).length > 0
  );
};

const calculateKamas = (achievementLevel, kamasRatio) => {
  if (!kamasRatio || kamasRatio === 0) return 0;
  const base = Math.floor(
    achievementLevel * achievementLevel + 20 * achievementLevel - 20
  );
  return Math.floor(base * kamasRatio);
};

const calculateXP = (characterLevel, experienceRatio) => {
  if (!experienceRatio || experienceRatio === 0) return 0;
  const base = Math.floor(
    characterLevel * characterLevel + 20 * characterLevel - 20
  );
  return Math.floor(base * experienceRatio);
};

const formatNumber = (num) => {
  return num.toLocaleString("fr-FR");
};

// Bookmark functions
const loadBookmarks = () => {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    if (stored) {
      bookmarkedAchievements.value = JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading bookmarks:", error);
    bookmarkedAchievements.value = [];
  }
};

const saveBookmarks = () => {
  try {
    localStorage.setItem(
      BOOKMARKS_KEY,
      JSON.stringify(bookmarkedAchievements.value)
    );
  } catch (error) {
    console.error("Error saving bookmarks:", error);
  }
};

const isBookmarked = (achievementId) => {
  return bookmarkedAchievements.value.some((a) => a.id === achievementId);
};

const toggleBookmark = (achievement) => {
  const index = bookmarkedAchievements.value.findIndex(
    (a) => a.id === achievement.id
  );
  if (index === -1) {
    bookmarkedAchievements.value.push({ ...achievement });
  } else {
    bookmarkedAchievements.value.splice(index, 1);
  }
  saveBookmarks();
};

// Server/Character functions
const loadServers = () => {
  try {
    const stored = localStorage.getItem(SERVERS_KEY);
    if (stored) {
      servers.value = JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading servers:", error);
    servers.value = [];
  }
};

const saveServers = () => {
  try {
    localStorage.setItem(SERVERS_KEY, JSON.stringify(servers.value));
  } catch (error) {
    console.error("Error saving servers:", error);
  }
};

const selectServer = (server) => {
  currentServer.value = server;
  currentCharacter.value = null;
};

const addServer = (serverName) => {
  const newServer = {
    id: Date.now().toString(),
    name: serverName.trim(),
    characters: [],
  };
  servers.value.push(newServer);
  saveServers();
  selectServer(newServer);
};

const deleteServer = (serverId) => {
  const index = servers.value.findIndex((s) => s.id === serverId);
  if (index !== -1) {
    servers.value.splice(index, 1);
    saveServers();
    if (currentServer.value?.id === serverId) {
      currentServer.value = null;
      currentCharacter.value = null;
    }
  }
};

const selectCharacter = (character) => {
  currentCharacter.value = character;
};

const addCharacter = (characterData) => {
  const newCharacter = {
    id: Date.now().toString(),
    name: characterData.name.trim(),
    class: characterData.class,
    level: characterData.level || 200,
  };
  currentServer.value.characters.push(newCharacter);
  saveServers();
  selectCharacter(newCharacter);
};

const deleteCharacter = (characterId) => {
  const index = currentServer.value.characters.findIndex(
    (c) => c.id === characterId
  );
  if (index !== -1) {
    currentServer.value.characters.splice(index, 1);
    saveServers();
    if (currentCharacter.value?.id === characterId) {
      currentCharacter.value = null;
    }
  }
};

// Fetch functions
const fetchAchievements = async () => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.append("$limit", String(limit.value));
    params.append("$skip", String((currentPage.value - 1) * limit.value));

    if (filters.value.search) {
      params.append("slug.fr[$search]", filters.value.search);
    }

    if (filters.value.categoryId) {
      const selectedCategory = categories.value.find(
        (c) => c.id === filters.value.categoryId
      );
      if (selectedCategory) {
        const childIds = getChildCategoryIds(selectedCategory.id);
        if (childIds.length > 0) {
          childIds.forEach((id) => {
            params.append("categoryId[$in][]", String(id));
          });
        } else {
          params.append("categoryId", String(filters.value.categoryId));
        }
      }
    }

    if (filters.value.points) {
      if (filters.value.points === "1-5") {
        params.append("points[$gte]", "1");
        params.append("points[$lte]", "5");
      } else if (filters.value.points === "6-10") {
        params.append("points[$gte]", "6");
        params.append("points[$lte]", "10");
      } else if (filters.value.points === "10+") {
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

const fetchCategories = async () => {
  try {
    const response = await $fetch(
      "https://api.dofusdb.fr/achievement-categories?$limit=200"
    );
    categories.value = response.data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
};

const handleAchievementClick = (achievement) => {
  selectedAchievement.value = achievement;
};

const handleImageError = (event) => {
  event.target.style.display = "none";
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchAchievements();
  }
};

const resetFilters = () => {
  filters.value = {
    search: "",
    categoryId: "",
    points: "",
  };
  currentPage.value = 1;
  fetchAchievements();
};

onMounted(() => {
  loadBookmarks();
  loadServers();
  fetchCategories().then(() => {
    fetchAchievements();
  });
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
</style>