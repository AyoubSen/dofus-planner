<template>
  <div class="min-h-screen bg-[#1a1410] relative">
    <!-- Parchment texture overlay -->
    <div class="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]"></div>
    
    <!-- Decorative top border -->
    <div class="h-2 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>

    <div class="relative z-10 max-w-6xl mx-auto px-8 pt-12 pb-16">
      <!-- Hero Section -->
      <div class="text-center mb-16">
        <!-- Ornate frame -->
        <div class="inline-block relative mb-8">
          <div class="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-amber-600"></div>
          <div class="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-amber-600"></div>
          <div class="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-amber-600"></div>
          <div class="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-amber-600"></div>
          
          <div class="px-12 py-6">
            <div class="flex items-center justify-center gap-4 mb-4">
              <div class="w-12 h-12 bg-gradient-to-b from-amber-500 to-amber-700 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-400">
                <svg class="w-6 h-6 text-amber-100" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
                </svg>
              </div>
            </div>
            <h1 class="text-5xl font-serif font-bold text-amber-100 tracking-wide">Dofus Stuff</h1>
            <div class="flex items-center justify-center gap-4 mt-2">
              <div class="h-[1px] w-16 bg-gradient-to-r from-transparent to-amber-600"></div>
              <span class="text-amber-600">✦</span>
              <div class="h-[1px] w-16 bg-gradient-to-l from-transparent to-amber-600"></div>
            </div>
          </div>
        </div>
        
        <p class="text-lg text-amber-200/70 max-w-2xl mx-auto font-serif italic">
          "Your trusted companion through the mystical World of Twelve. 
          May your hunts be fruitful and your gear legendary."
        </p>
      </div>

      <!-- Feature Cards Grid -->
      <div class="grid md:grid-cols-2 gap-8 mb-16">
        <!-- Archimonstres Card -->
        <NuxtLink
          to="/archimonstres"
          class="group relative bg-gradient-to-b from-amber-950/50 to-stone-950/50 border border-amber-800/30 rounded-sm p-8 hover:border-amber-600/60 transition-all duration-500"
        >
          <!-- Corner decorations -->
          <div class="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-700/50"></div>
          <div class="absolute top-2 right-2 w-4 h-4 border-t border-r border-amber-700/50"></div>
          <div class="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-amber-700/50"></div>
          <div class="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-amber-700/50"></div>
          
          <div class="flex items-start gap-6">
            <div class="w-20 h-20 bg-gradient-to-b from-orange-600 to-orange-800 rounded-full flex items-center justify-center shadow-xl border-4 border-orange-500/30 group-hover:scale-105 transition-transform">
              <svg class="w-10 h-10 text-orange-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            
            <div class="flex-1">
              <h2 class="text-2xl font-serif font-bold text-amber-100 mb-2 group-hover:text-orange-400 transition-colors">
                Archimonstres
              </h2>
              <p class="text-amber-200/60 mb-4 font-serif">
                Track the legendary beasts across all realms. Master the hunt for the coveted Dofus Ocre.
              </p>
              
              <div class="flex flex-wrap gap-2 mb-4">
                <span class="px-3 py-1 bg-orange-900/30 text-orange-300 text-sm rounded-full border border-orange-700/30 font-serif">
                  ⚔ Dofus Ocre
                </span>
                <span class="px-3 py-1 bg-green-900/30 text-green-300 text-sm rounded-full border border-green-700/30 font-serif">
                  ◈ Multi-Server
                </span>
              </div>
              
              <div class="text-amber-600 text-sm font-serif flex items-center gap-2 group-hover:text-amber-400 transition-colors">
                Begin your hunt →
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Items Card -->
        <NuxtLink
          to="/items"
          class="group relative bg-gradient-to-b from-blue-950/50 to-stone-950/50 border border-blue-800/30 rounded-sm p-8 hover:border-blue-600/60 transition-all duration-500"
        >
          <div class="absolute top-2 left-2 w-4 h-4 border-t border-l border-blue-700/50"></div>
          <div class="absolute top-2 right-2 w-4 h-4 border-t border-r border-blue-700/50"></div>
          <div class="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-blue-700/50"></div>
          <div class="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-blue-700/50"></div>
          
          <div class="flex items-start gap-6">
            <div class="w-20 h-20 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-xl border-4 border-blue-500/30 group-hover:scale-105 transition-transform">
              <svg class="w-10 h-10 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            
            <div class="flex-1">
              <h2 class="text-2xl font-serif font-bold text-amber-100 mb-2 group-hover:text-blue-400 transition-colors">
                Items & Gear
              </h2>
              <p class="text-amber-200/60 mb-4 font-serif">
                Browse the grand archives of equipment. Find the perfect gear for your champion.
              </p>
              
              <div class="flex flex-wrap gap-2 mb-4">
                <span class="px-3 py-1 bg-blue-900/30 text-blue-300 text-sm rounded-full border border-blue-700/30 font-serif">
                  📜 Database
                </span>
                <span class="px-3 py-1 bg-purple-900/30 text-purple-300 text-sm rounded-full border border-purple-700/30 font-serif">
                  ⚖ Compare
                </span>
              </div>
              
              <div class="text-blue-600 text-sm font-serif flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                Enter the archives →
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Crafting Card -->
        <NuxtLink
          to="/crafting"
          class="group relative bg-gradient-to-b from-emerald-950/50 to-stone-950/50 border border-emerald-800/30 rounded-sm p-8 hover:border-emerald-600/60 transition-all duration-500"
        >
          <div class="absolute top-2 left-2 w-4 h-4 border-t border-l border-emerald-700/50"></div>
          <div class="absolute top-2 right-2 w-4 h-4 border-t border-r border-emerald-700/50"></div>
          <div class="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-emerald-700/50"></div>
          <div class="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-emerald-700/50"></div>
          
          <div class="flex items-start gap-6">
            <div class="w-20 h-20 bg-gradient-to-b from-emerald-600 to-emerald-800 rounded-full flex items-center justify-center shadow-xl border-4 border-emerald-500/30 group-hover:scale-105 transition-transform">
              <svg class="w-10 h-10 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            
            <div class="flex-1">
              <h2 class="text-2xl font-serif font-bold text-amber-100 mb-2 group-hover:text-emerald-400 transition-colors">
                Crafted Sales
              </h2>
              <p class="text-amber-200/60 mb-4 font-serif">
                Chronicle your artisan endeavors. Track sales and profits from your workshop.
              </p>
              
              <div class="flex flex-wrap gap-2 mb-4">
                <span class="px-3 py-1 bg-emerald-900/30 text-emerald-300 text-sm rounded-full border border-emerald-700/30 font-serif">
                  💰 Sales
                </span>
                <span class="px-3 py-1 bg-teal-900/30 text-teal-300 text-sm rounded-full border border-teal-700/30 font-serif">
                  📊 Profits
                </span>
              </div>
              
              <div class="text-emerald-600 text-sm font-serif flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
                View your ledger →
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Succès Card -->
        <NuxtLink
          to="/succes"
          class="group relative bg-gradient-to-b from-yellow-950/50 to-stone-950/50 border border-yellow-800/30 rounded-sm p-8 hover:border-yellow-600/60 transition-all duration-500"
        >
          <div class="absolute top-2 left-2 w-4 h-4 border-t border-l border-yellow-700/50"></div>
          <div class="absolute top-2 right-2 w-4 h-4 border-t border-r border-yellow-700/50"></div>
          <div class="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-yellow-700/50"></div>
          <div class="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-yellow-700/50"></div>
          
          <div class="flex items-start gap-6">
            <div class="w-20 h-20 bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-full flex items-center justify-center shadow-xl border-4 border-yellow-500/30 group-hover:scale-105 transition-transform">
              <svg class="w-10 h-10 text-yellow-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            
            <div class="flex-1">
              <h2 class="text-2xl font-serif font-bold text-amber-100 mb-2 group-hover:text-yellow-400 transition-colors">
                Succès
              </h2>
              <p class="text-amber-200/60 mb-4 font-serif">
                Discover all achievements waiting to be claimed. Plan your path to glory.
              </p>
              
              <div class="flex flex-wrap gap-2 mb-4">
                <span class="px-3 py-1 bg-yellow-900/30 text-yellow-300 text-sm rounded-full border border-yellow-700/30 font-serif">
                  🏆 Achievements
                </span>
                <span class="px-3 py-1 bg-orange-900/30 text-orange-300 text-sm rounded-full border border-orange-700/30 font-serif">
                  🎁 Rewards
                </span>
              </div>
              
              <div class="text-yellow-600 text-sm font-serif flex items-center gap-2 group-hover:text-yellow-400 transition-colors">
                Seek glory →
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Stats Section -->
      <div class="relative border border-amber-800/30 bg-stone-950/50 rounded-sm p-8">
        <div class="absolute top-2 left-2 w-6 h-6 border-t border-l border-amber-700/50"></div>
        <div class="absolute top-2 right-2 w-6 h-6 border-t border-r border-amber-700/50"></div>
        <div class="absolute bottom-2 left-2 w-6 h-6 border-b border-l border-amber-700/50"></div>
        <div class="absolute bottom-2 right-2 w-6 h-6 border-b border-r border-amber-700/50"></div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-4xl font-serif font-bold text-orange-400 mb-1">286</div>
            <div class="text-amber-200/50 text-sm font-serif">Legendary Beasts</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-serif font-bold text-blue-400 mb-1">1000+</div>
            <div class="text-amber-200/50 text-sm font-serif">Sacred Items</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-serif font-bold text-green-400 mb-1">100%</div>
            <div class="text-amber-200/50 text-sm font-serif">Local Storage</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-serif font-bold text-purple-400 mb-1">∞</div>
            <div class="text-amber-200/50 text-sm font-serif">Adventures Await</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom border -->
    <div class="h-2 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
    <slot name="theme-switcher" />
  </div>
</template>

<script setup>
useHead({
  title: "Dofus Stuff - Chronicles of the World of Twelve",
  meta: [
    {
      name: "description",
      content: "Track archimonstres, manage your gear, and optimize your Dofus adventure.",
    },
  ],
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');

.font-serif {
  font-family: 'Cinzel', serif;
}
</style>