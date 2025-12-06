<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
  >
    <!-- Hero Section -->
    <div class="max-w-7xl mx-auto px-8 pt-16 pb-12">
      <div class="text-center mb-16">
        <div class="inline-flex items-center gap-3 mb-6">
          <div
            class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center"
          >
            <svg
              class="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"
              />
            </svg>
          </div>
          <h1
            class="text-6xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent"
          >
            Dofus Stuff
          </h1>
        </div>
        <p class="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Your ultimate companion for mastering the World of Twelve. Track
          archimonstres, manage your gear, and optimize your Dofus adventure.
        </p>
      </div>

      <!-- Feature Cards Grid -->
      <div class="grid md:grid-cols-3 gap-8 max-w-8xl mx-auto">
        <!-- Archimonstres Card -->
        <NuxtLink
          to="/archimonstres"
          class="group relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/10"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>

          <div class="relative z-10">
            <div class="flex items-start justify-between mb-6">
              <div
                class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg"
              >
                <svg
                  class="w-8 h-8 text-white"
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

              <div
                class="text-gray-500 group-hover:text-orange-400 transition-colors duration-300"
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>

            <h2
              class="text-3xl font-bold text-gray-100 mb-4 group-hover:text-orange-400 transition-colors duration-300"
            >
              Archimonstres
            </h2>

            <p class="text-gray-400 mb-6 leading-relaxed">
              Master the hunt with comprehensive tracking tools. Manage multiple
              servers, characters, and monitor your archimonstre collection
              progress.
            </p>

            <!-- Updated badges based on actual functionality -->
            <div class="flex flex-wrap gap-2">
              <span
                class="px-3 py-1 bg-orange-500/10 text-orange-300 text-sm rounded-full border border-orange-500/30"
              >
                Dofus Ocre Quest
              </span>
              <span
                class="px-3 py-1 bg-green-500/10 text-green-300 text-sm rounded-full border border-green-500/30"
              >
                Sell-Only Mode
              </span>
              <span
                class="px-3 py-1 bg-blue-500/10 text-blue-300 text-sm rounded-full border border-blue-500/30"
              >
                Multi-Character
              </span>
              <span
                class="px-3 py-1 bg-purple-500/10 text-purple-300 text-sm rounded-full border border-purple-500/30"
              >
                Progress Tracking
              </span>
            </div>

            <!-- Feature highlights -->
            <div class="mt-4 pt-4 border-t border-gray-700/50">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="flex items-center gap-2 text-gray-400">
                  <div class="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>Server Management</span>
                </div>
                <div class="flex items-center gap-2 text-gray-400">
                  <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Monster Grid View</span>
                </div>
                <div class="flex items-center gap-2 text-gray-400">
                  <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Character Profiles</span>
                </div>
                <div class="flex items-center gap-2 text-gray-400">
                  <div class="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Local Storage</span>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Items Card -->
        <NuxtLink
          to="/items"
          class="group relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>

          <div class="relative z-10">
            <div class="flex items-start justify-between mb-6">
              <div
                class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg"
              >
                <svg
                  class="w-8 h-8 text-white"
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

              <div
                class="text-gray-500 group-hover:text-blue-400 transition-colors duration-300"
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>

            <h2
              class="text-3xl font-bold text-gray-100 mb-4 group-hover:text-blue-400 transition-colors duration-300"
            >
              Items & Gear
            </h2>

            <p class="text-gray-400 mb-6 leading-relaxed">
              Optimize your equipment and stay ahead of the meta. Comprehensive
              item database with advanced filtering and comparison tools.
            </p>

            <div class="flex flex-wrap gap-2">
              <span
                class="px-3 py-1 bg-blue-500/10 text-blue-300 text-sm rounded-full border border-blue-500/30"
              >
                Item Database
              </span>
              <span
                class="px-3 py-1 bg-purple-500/10 text-purple-300 text-sm rounded-full border border-purple-500/30"
              >
                Meta Analysis
              </span>
              <span
                class="px-3 py-1 bg-cyan-500/10 text-cyan-300 text-sm rounded-full border border-cyan-500/30"
              >
                Build Optimizer
              </span>
            </div>

            <div class="mt-4 pt-4 border-t border-gray-700/50">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="flex items-center gap-2 text-gray-400">
                  <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Equipment Sets</span>
                </div>
                <div class="flex items-center gap-2 text-gray-400">
                  <div class="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Stat Comparison</span>
                </div>
                <!-- <div class="flex items-center gap-2 text-gray-400">
                  <div class="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Price Tracking</span>
                </div> -->
                <div class="flex items-center gap-2 text-gray-400">
                  <div class="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <span>Class Builds</span>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Crafting Card -->
        <NuxtLink
          to="/crafting"
          class="group relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          ></div>

          <div class="relative z-10">
            <div class="flex items-start justify-between mb-6">
              <div
                class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg"
              >
                <!-- Better crafting icon -->
                <svg
                  class="w-8 h-8 text-white"
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
                <!-- Alternative hammer/anvil icon -->
                <!-- <svg
          class="w-8 h-8 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M18.5 3.5L12 10L5.5 3.5L2 7L8.5 13.5L7 15L5.5 13.5L2 17L5.5 20.5L9 17L7.5 15.5L14 9L20.5 15.5L22 14L18.5 10.5L22 7L18.5 3.5Z"/>
        </svg> -->
              </div>

              <div
                class="text-gray-500 group-hover:text-emerald-400 transition-colors duration-300"
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>

            <h2
              class="text-3xl font-bold text-gray-100 mb-4 group-hover:text-emerald-400 transition-colors duration-300"
            >
              Crafted Sales Tracker
            </h2>

            <p class="text-gray-400 mb-6 leading-relaxed">
              Monitor your crafted equipment sales with precision. Track custom
              stats, sale prices, and profit margins to maximize your crafting
              business.
            </p>

            <div class="flex flex-wrap gap-2">
              <span
                class="px-3 py-1 bg-emerald-500/10 text-emerald-300 text-sm rounded-full border border-emerald-500/30"
              >
                Sales Tracking
              </span>
              <span
                class="px-3 py-1 bg-teal-500/10 text-teal-300 text-sm rounded-full border border-teal-500/30"
              >
                Custom Stats
              </span>
              <span
                class="px-3 py-1 bg-green-500/10 text-green-300 text-sm rounded-full border border-green-500/30"
              >
                Profit Analysis
              </span>
            </div>

            <div class="mt-4 pt-4 border-t border-gray-700/50">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="flex items-center gap-2 text-gray-400">
                  <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Item Search</span>
                </div>
                <div class="flex items-center gap-2 text-gray-400">
                  <div class="w-2 h-2 bg-teal-400 rounded-full"></div>
                  <span>Stat Customization</span>
                </div>
                <div class="flex items-center gap-2 text-gray-400">
                  <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Revenue Reports</span>
                </div>
                <div class="flex items-center gap-2 text-gray-400">
                  <div class="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Multi-Character</span>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Succès Card -->
        <NuxtLink
  to="/succes"
  class="group relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-yellow-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/10"
>
  <div
    class="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
  ></div>

  <div class="relative z-10">
    <div class="flex items-start justify-between mb-6">
      <div
        class="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg"
      >
        <svg
          class="w-8 h-8 text-white"
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

      <div
        class="text-gray-500 group-hover:text-yellow-400 transition-colors duration-300"
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
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      </div>
    </div>

    <h2
      class="text-3xl font-bold text-gray-100 mb-4 group-hover:text-yellow-400 transition-colors duration-300"
    >
      Succès
    </h2>

    <p class="text-gray-400 mb-6 leading-relaxed">
      Browse the complete achievement database. Track your progress,
      discover rewards, and plan your next accomplishments.
    </p>

    <div class="flex flex-wrap gap-2">
      <span
        class="px-3 py-1 bg-yellow-500/10 text-yellow-300 text-sm rounded-full border border-yellow-500/30"
      >
        Achievement Browser
      </span>
      <span
        class="px-3 py-1 bg-orange-500/10 text-orange-300 text-sm rounded-full border border-orange-500/30"
      >
        Category Filters
      </span>
      <span
        class="px-3 py-1 bg-amber-500/10 text-amber-300 text-sm rounded-full border border-amber-500/30"
      >
        Reward Info
      </span>
    </div>

    <div class="mt-4 pt-4 border-t border-gray-700/50">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="flex items-center gap-2 text-gray-400">
          <div class="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span>Search & Filter</span>
        </div>
        <div class="flex items-center gap-2 text-gray-400">
          <div class="w-2 h-2 bg-orange-400 rounded-full"></div>
          <span>Point Ranges</span>
        </div>
        <div class="flex items-center gap-2 text-gray-400">
          <div class="w-2 h-2 bg-amber-400 rounded-full"></div>
          <span>Categories</span>
        </div>
        <div class="flex items-center gap-2 text-gray-400">
          <div class="w-2 h-2 bg-red-400 rounded-full"></div>
          <span>Detailed View</span>
        </div>
      </div>
    </div>
  </div>
</NuxtLink>
      </div>

      <!-- Stats Section -->
      <div
        class="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
      >
        <div class="text-center">
          <div class="text-3xl font-bold text-orange-400 mb-2">286</div>
          <div class="text-gray-400 text-sm">Archimonstres</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-400 mb-2">1000+</div>
          <div class="text-gray-400 text-sm">Items Tracked</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-400 mb-2">100%</div>
          <div class="text-gray-400 text-sm">Local</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-400 mb-2">24/7</div>
          <div class="text-gray-400 text-sm">Tracking</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: "Dofus Stuff - Your Ultimate Dofus Companion",
  meta: [
    {
      name: "description",
      content:
        "Track archimonstres, manage your gear, and optimize your Dofus adventure with our comprehensive tools.",
    },
  ],
});
</script>

<style scoped>
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}
</style>
