<template>
  <div class="max-w-7xl mx-auto p-8">
    <div class="text-center mb-12">
      <h1 class="text-5xl font-bold text-gray-100 mb-4">Dofus Stuff</h1>
      <p class="text-lg text-gray-400 max-w-2xl mx-auto">
        Your personal companion for tracking archimonstres and managing your
        Dofus journey
      </p>
    </div>

    <div class="max-w-2xl mx-auto mb-4">
      <NuxtLink
        to="/archimonstres"
        class="block bg-gray-800 border border-gray-700 rounded-xl p-8 hover:bg-gray-750 hover:border-gray-600 transition-all duration-200 group"
      >
        <div class="flex items-center gap-6">
          <div
            class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200"
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
              ></path>
            </svg>
          </div>

          <div class="flex-1">
            <h2
              class="text-2xl font-semibold text-gray-100 mb-2 group-hover:text-orange-400 transition-colors duration-200"
            >
              Archimonstres
            </h2>
            <p class="text-gray-400 mb-3">
              Track your progress through the world of archimonstres. Manage
              your servers, characters, and monitor your collection.
            </p>
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <span>Server & character management</span>
              <span>•</span>
              <span>Monster tracking</span>
              <span>•</span>
              <span>Progress visualization</span>
            </div>
          </div>

          <div
            class="text-gray-600 group-hover:text-orange-400 transition-colors duration-200"
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
              ></path>
            </svg>
          </div>
        </div>
      </NuxtLink>
    </div>
    <div class="max-w-2xl mx-auto">
      <NuxtLink
        to="/items"
        class="block bg-gray-800 border border-gray-700 rounded-xl p-8 hover:bg-gray-750 hover:border-gray-600 transition-all duration-200 group"
      >
        <div class="flex items-center gap-6">
          <div
            class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200"
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
              ></path>
            </svg>
          </div>

          <div class="flex-1">
            <h2
              class="text-2xl font-semibold text-gray-100 mb-2 group-hover:text-orange-400 transition-colors duration-200"
            >
              Items
            </h2>
            <p class="text-gray-400 mb-3"></p>
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <span>Items management</span>
              <span>•</span>
              <span>Meta visualization</span>
            </div>
          </div>

          <div
            class="text-gray-600 group-hover:text-orange-400 transition-colors duration-200"
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
              ></path>
            </svg>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.hover\:bg-gray-750:hover {
  background-color: #374151;
}
</style>
