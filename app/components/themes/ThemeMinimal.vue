<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top accent bar -->
    <div class="h-1 bg-gradient-to-r from-orange-500 via-blue-500 to-emerald-500"></div>

    <div class="max-w-5xl mx-auto px-6 py-16">
      <!-- Hero Section -->
      <div class="text-center mb-20">
        <div class="inline-flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
            </svg>
          </div>
          <h1 class="text-4xl font-semibold text-gray-900">Dofus Stuff</h1>
        </div>
        <p class="text-lg text-gray-500 max-w-xl mx-auto">
          Simple tools for your Dofus adventure. Track monsters, manage gear, optimize everything.
        </p>
      </div>

      <!-- Feature Cards -->
      <div class="space-y-4 mb-20">
        <!-- Archimonstres -->
        <NuxtLink
          to="/archimonstres"
          class="group flex items-center gap-6 p-6 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100 transition-all duration-300"
        >
          <div class="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
            <svg class="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
              Archimonstres
            </h2>
            <p class="text-gray-500">
              Track your progress on the Dofus Ocre quest across multiple servers and characters.
            </p>
          </div>
          
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 bg-orange-50 text-orange-600 text-sm rounded-full">Ocre Quest</span>
            <svg class="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>

        <!-- Items -->
        <NuxtLink
          to="/items"
          class="group flex items-center gap-6 p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100 transition-all duration-300"
        >
          <div class="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <svg class="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              Items & Gear
            </h2>
            <p class="text-gray-500">
              Browse equipment database, compare stats, and find the perfect build for your class.
            </p>
          </div>
          
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">Database</span>
            <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>

        <!-- Crafting -->
        <NuxtLink
          to="/crafting"
          class="group flex items-center gap-6 p-6 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300"
        >
          <div class="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <svg class="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
              Crafted Sales Tracker
            </h2>
            <p class="text-gray-500">
              Monitor your crafted equipment sales, track profits, and optimize your crafting business.
            </p>
          </div>
          
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 bg-emerald-50 text-emerald-600 text-sm rounded-full">Sales</span>
            <svg class="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>

        <!-- Succès -->
        <NuxtLink
          to="/succes"
          class="group flex items-center gap-6 p-6 bg-white rounded-xl border border-gray-200 hover:border-yellow-300 hover:shadow-lg hover:shadow-yellow-100 transition-all duration-300"
        >
          <div class="w-14 h-14 bg-yellow-50 rounded-xl flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
            <svg class="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-gray-900 mb-1 group-hover:text-yellow-600 transition-colors">
              Succès
            </h2>
            <p class="text-gray-500">
              Browse achievements, discover rewards, and plan your next accomplishments.
            </p>
          </div>
          
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 bg-yellow-50 text-yellow-600 text-sm rounded-full">Achievements</span>
            <svg class="w-5 h-5 text-gray-400 group-hover:text-yellow-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-4 gap-8 py-8 border-t border-gray-200">
        <div class="text-center">
          <div class="text-3xl font-bold text-gray-900">286</div>
          <div class="text-sm text-gray-500">Archimonstres</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-gray-900">1000+</div>
          <div class="text-sm text-gray-500">Items</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-gray-900">100%</div>
          <div class="text-sm text-gray-500">Local</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-gray-900">24/7</div>
          <div class="text-sm text-gray-500">Available</div>
        </div>
      </div>
    </div>
    <slot name="theme-switcher" />
  </div>
</template>

<script setup>
useHead({
  title: "Dofus Stuff - Simple Dofus Tools",
  meta: [
    {
      name: "description",
      content: "Simple tools for your Dofus adventure. Track monsters, manage gear, optimize everything.",
    },
  ],
});
</script>