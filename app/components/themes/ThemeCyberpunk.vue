<template>
  <div class="min-h-screen bg-black relative overflow-hidden">
    <!-- Animated background grid -->
    <div class="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
    
    <!-- Glowing orbs -->
    <div class="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] animate-pulse"></div>
    <div class="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-[128px] animate-pulse"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-8 pt-16 pb-12">
      <!-- Hero Section -->
      <div class="text-center mb-20">
        <div class="inline-flex items-center gap-4 mb-8">
          <div class="w-14 h-14 relative">
            <div class="absolute inset-0 bg-cyan-400 rounded-lg blur-md animate-pulse"></div>
            <div class="relative w-full h-full bg-black border-2 border-cyan-400 rounded-lg flex items-center justify-center">
              <svg class="w-7 h-7 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
              </svg>
            </div>
          </div>
          <h1 class="text-7xl font-black tracking-tighter">
            <span class="text-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.5)]">DOFUS</span>
            <span class="text-pink-400 drop-shadow-[0_0_25px_rgba(244,114,182,0.5)]">STUFF</span>
          </h1>
        </div>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto font-mono">
          &gt; INITIALIZE_COMPANION.exe<br>
          <span class="text-cyan-400">[ SYSTEM READY ]</span> Track. Manage. Dominate.
        </p>
      </div>

      <!-- Feature Cards Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Archimonstres Card -->
        <NuxtLink
          to="/archimonstres"
          class="group relative bg-black border border-cyan-500/30 p-6 hover:border-cyan-400 transition-all duration-300 clip-corner"
        >
          <div class="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div class="relative z-10">
            <div class="w-12 h-12 border border-cyan-400 flex items-center justify-center mb-4 group-hover:bg-cyan-400/10 transition-colors">
              <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            
            <h2 class="text-xl font-bold text-cyan-400 mb-2 font-mono">ARCHIMONSTRES</h2>
            <p class="text-gray-500 text-sm mb-4">Hunt tracking system v2.0</p>
            
            <div class="flex flex-wrap gap-1">
              <span class="px-2 py-0.5 bg-cyan-400/10 text-cyan-400 text-xs font-mono border border-cyan-400/30">OCRE</span>
              <span class="px-2 py-0.5 bg-pink-400/10 text-pink-400 text-xs font-mono border border-pink-400/30">TRACK</span>
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-800">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-gray-600">STATUS:</span>
                <span class="text-green-400 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  ONLINE
                </span>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Items Card -->
        <NuxtLink
          to="/items"
          class="group relative bg-black border border-pink-500/30 p-6 hover:border-pink-400 transition-all duration-300 clip-corner"
        >
          <div class="absolute inset-0 bg-gradient-to-b from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div class="relative z-10">
            <div class="w-12 h-12 border border-pink-400 flex items-center justify-center mb-4 group-hover:bg-pink-400/10 transition-colors">
              <svg class="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            
            <h2 class="text-xl font-bold text-pink-400 mb-2 font-mono">ITEMS & GEAR</h2>
            <p class="text-gray-500 text-sm mb-4">Equipment database v3.1</p>
            
            <div class="flex flex-wrap gap-1">
              <span class="px-2 py-0.5 bg-pink-400/10 text-pink-400 text-xs font-mono border border-pink-400/30">DATABASE</span>
              <span class="px-2 py-0.5 bg-purple-400/10 text-purple-400 text-xs font-mono border border-purple-400/30">META</span>
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-800">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-gray-600">STATUS:</span>
                <span class="text-green-400 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  ONLINE
                </span>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Crafting Card -->
        <NuxtLink
          to="/crafting"
          class="group relative bg-black border border-green-500/30 p-6 hover:border-green-400 transition-all duration-300 clip-corner"
        >
          <div class="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div class="relative z-10">
            <div class="w-12 h-12 border border-green-400 flex items-center justify-center mb-4 group-hover:bg-green-400/10 transition-colors">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            
            <h2 class="text-xl font-bold text-green-400 mb-2 font-mono">SALES TRACKER</h2>
            <p class="text-gray-500 text-sm mb-4">Profit analysis v1.5</p>
            
            <div class="flex flex-wrap gap-1">
              <span class="px-2 py-0.5 bg-green-400/10 text-green-400 text-xs font-mono border border-green-400/30">SALES</span>
              <span class="px-2 py-0.5 bg-teal-400/10 text-teal-400 text-xs font-mono border border-teal-400/30">PROFIT</span>
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-800">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-gray-600">STATUS:</span>
                <span class="text-green-400 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  ONLINE
                </span>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Succès Card -->
        <NuxtLink
          to="/succes"
          class="group relative bg-black border border-yellow-500/30 p-6 hover:border-yellow-400 transition-all duration-300 clip-corner"
        >
          <div class="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div class="relative z-10">
            <div class="w-12 h-12 border border-yellow-400 flex items-center justify-center mb-4 group-hover:bg-yellow-400/10 transition-colors">
              <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            
            <h2 class="text-xl font-bold text-yellow-400 mb-2 font-mono">SUCCÈS</h2>
            <p class="text-gray-500 text-sm mb-4">Achievement browser v2.2</p>
            
            <div class="flex flex-wrap gap-1">
              <span class="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 text-xs font-mono border border-yellow-400/30">ACHIEVE</span>
              <span class="px-2 py-0.5 bg-orange-400/10 text-orange-400 text-xs font-mono border border-orange-400/30">REWARDS</span>
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-800">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-gray-600">STATUS:</span>
                <span class="text-green-400 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  ONLINE
                </span>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Stats Section -->
      <div class="mt-20 border border-gray-800 bg-black/50 p-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-4xl font-black text-cyan-400 font-mono mb-1 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">286</div>
            <div class="text-gray-600 text-xs font-mono uppercase tracking-wider">Archimonstres</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-black text-pink-400 font-mono mb-1 drop-shadow-[0_0_10px_rgba(244,114,182,0.5)]">1K+</div>
            <div class="text-gray-600 text-xs font-mono uppercase tracking-wider">Items</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-black text-green-400 font-mono mb-1 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">100%</div>
            <div class="text-gray-600 text-xs font-mono uppercase tracking-wider">Local</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-black text-yellow-400 font-mono mb-1 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">24/7</div>
            <div class="text-gray-600 text-xs font-mono uppercase tracking-wider">Uptime</div>
          </div>
        </div>
      </div>
    </div>
    <slot name="theme-switcher" />
  </div>
</template>

<script setup>
useHead({
  title: "DOFUS STUFF // System Online",
  meta: [
    {
      name: "description",
      content: "Track archimonstres, manage your gear, and optimize your Dofus adventure.",
    },
  ],
});
</script>

<style scoped>
.clip-corner {
  clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
}
</style>