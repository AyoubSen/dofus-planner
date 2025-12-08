<!-- components/themes/ThemeDefault.vue -->
<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
  >
    <div class="max-w-6xl mx-auto px-6 py-10">
      <!-- Hero Section -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center"
          >
            <svg
              class="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"
              />
            </svg>
          </div>
          <h1
            class="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent"
          >
            Dofus Stuff
          </h1>
        </div>
        <p class="text-base text-gray-400 max-w-2xl mx-auto">
          Your ultimate companion for mastering the World of Twelve. Track
          archimonstres, manage your gear, and optimize your adventure.
        </p>
      </div>

      <!-- Feature Cards Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <!-- Archimonstres Card -->
        <NuxtLink
          to="/archimonstres"
          class="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>

          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <div
                class="w-11 h-11 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <svg
                class="w-5 h-5 text-gray-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all duration-300"
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
            </div>

            <h2
              class="text-lg font-semibold text-gray-100 mb-2 group-hover:text-orange-400 transition-colors duration-300"
            >
              Archimonstres
            </h2>

            <p class="text-gray-500 text-sm mb-4 line-clamp-2">
              Track your Dofus Ocre quest progress across multiple servers and
              characters.
            </p>

            <div class="flex flex-wrap gap-1.5">
              <span
                class="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-xs rounded-full"
              >
                Ocre Quest
              </span>
              <span
                class="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full"
              >
                Multi-Server
              </span>
            </div>
          </div>
        </NuxtLink>

        <!-- Items Card -->
        <NuxtLink
          to="/items"
          class="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>

          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <div
                class="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
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
              <svg
                class="w-5 h-5 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300"
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
            </div>

            <h2
              class="text-lg font-semibold text-gray-100 mb-2 group-hover:text-blue-400 transition-colors duration-300"
            >
              Items & Gear
            </h2>

            <p class="text-gray-500 text-sm mb-4 line-clamp-2">
              Comprehensive item database with filtering and comparison tools.
            </p>

            <div class="flex flex-wrap gap-1.5">
              <span
                class="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full"
              >
                Database
              </span>
              <span
                class="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded-full"
              >
                Builds
              </span>
            </div>
          </div>
        </NuxtLink>

        <!-- Crafting Card -->
        <NuxtLink
          to="/crafting"
          class="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>

          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <div
                class="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
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
              <svg
                class="w-5 h-5 text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-300"
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
            </div>

            <h2
              class="text-lg font-semibold text-gray-100 mb-2 group-hover:text-emerald-400 transition-colors duration-300"
            >
              Sales Tracker
            </h2>

            <p class="text-gray-500 text-sm mb-4 line-clamp-2">
              Monitor crafted equipment sales and track profit margins.
            </p>

            <div class="flex flex-wrap gap-1.5">
              <span
                class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full"
              >
                Sales
              </span>
              <span
                class="px-2 py-0.5 bg-teal-500/10 text-teal-400 text-xs rounded-full"
              >
                Profits
              </span>
            </div>
          </div>
        </NuxtLink>

        <!-- Succès Card -->
        <NuxtLink
          to="/succes"
          class="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>

          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <div
                class="w-11 h-11 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
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
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <svg
                class="w-5 h-5 text-gray-600 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all duration-300"
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
            </div>

            <h2
              class="text-lg font-semibold text-gray-100 mb-2 group-hover:text-yellow-400 transition-colors duration-300"
            >
              Succès
            </h2>

            <p class="text-gray-500 text-sm mb-4 line-clamp-2">
              Browse achievements, discover rewards, and plan your progress.
            </p>

            <div class="flex flex-wrap gap-1.5">
              <span
                class="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-full"
              >
                Achievements
              </span>
              <span
                class="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-xs rounded-full"
              >
                Rewards
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Stats Section -->
      <div
        class="grid grid-cols-4 gap-6 py-6 px-8 bg-gray-800/30 rounded-xl border border-gray-700/30"
      >
        <div class="text-center">
          <div class="text-2xl font-bold text-orange-400">286</div>
          <div class="text-gray-500 text-xs mt-1">Archimonstres</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-400">1000+</div>
          <div class="text-gray-500 text-xs mt-1">Items</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-emerald-400">100%</div>
          <div class="text-gray-500 text-xs mt-1">Local</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-400">24/7</div>
          <div class="text-gray-500 text-xs mt-1">Available</div>
        </div>
      </div>
    </div>

    <slot name="theme-switcher" />
  </div>
</template>

<script setup>
useHead({
  title: "Dofus Stuff - Your Ultimate Dofus Companion",
  meta: [
    {
      name: "description",
      content:
        "Track archimonstres, manage your gear, and optimize your Dofus adventure.",
    },
  ],
});
</script>

<style scoped>
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>