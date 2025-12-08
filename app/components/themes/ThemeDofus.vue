<!-- components/themes/ThemeDofus.vue -->
<template>
  <div class="min-h-screen bg-[#87CEEB] relative overflow-hidden">
    <!-- Sky with clouds -->
    <div class="absolute inset-0">
      <div
        class="absolute top-10 left-[10%] w-32 h-16 bg-white rounded-full opacity-80 animate-cloud-1"
      ></div>
      <div
        class="absolute top-10 left-[10%] w-20 h-12 bg-white rounded-full opacity-80 -translate-x-4 translate-y-4 animate-cloud-1"
      ></div>
      <div
        class="absolute top-20 left-[60%] w-40 h-20 bg-white rounded-full opacity-70 animate-cloud-2"
      ></div>
      <div
        class="absolute top-20 left-[60%] w-24 h-14 bg-white rounded-full opacity-70 translate-x-8 translate-y-6 animate-cloud-2"
      ></div>
      <div
        class="absolute top-32 left-[30%] w-28 h-14 bg-white rounded-full opacity-60 animate-cloud-3"
      ></div>
    </div>

    <!-- Grass ground -->
    <div
      class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#228B22] via-[#32CD32] to-[#90EE90]"
    >
      <div
        class="absolute top-0 left-0 right-0 h-8 bg-[repeating-linear-gradient(90deg,#32CD32_0px,#228B22_20px,#32CD32_40px)]"
      ></div>
    </div>

    <!-- Main content -->
    <div class="relative z-10 max-w-4xl mx-auto px-6 py-8">
      <!-- Title Banner - Parchment scroll style -->
      <div class="flex justify-center mb-8">
        <div class="relative">
          <!-- Scroll ends -->
          <div
            class="absolute -left-6 top-1/2 -translate-y-1/2 w-8 h-24 bg-gradient-to-r from-[#8B4513] via-[#DEB887] to-[#8B4513] rounded-full shadow-lg"
          ></div>
          <div
            class="absolute -right-6 top-1/2 -translate-y-1/2 w-8 h-24 bg-gradient-to-r from-[#8B4513] via-[#DEB887] to-[#8B4513] rounded-full shadow-lg"
          ></div>

          <!-- Main scroll -->
          <div
            class="relative bg-gradient-to-b from-[#F5DEB3] via-[#FAEBD7] to-[#F5DEB3] px-16 py-6 shadow-xl"
            style="
              border-image: linear-gradient(
                  to bottom,
                  #8b4513,
                  #deb887,
                  #8b4513
                )
                1;
              border-width: 4px;
              border-style: solid;
            "
          >
            <div class="flex items-center justify-center gap-4">
              <!-- Dofus egg -->
              <div class="relative">
                <div
                  class="w-14 h-16 bg-gradient-to-b from-[#FFD700] via-[#FFA500] to-[#FF8C00] rounded-[50%] shadow-lg animate-float"
                >
                  <div
                    class="absolute top-2 left-3 w-4 h-6 bg-gradient-to-br from-white/50 to-transparent rounded-full"
                  ></div>
                </div>
                <div
                  class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-2 bg-black/20 rounded-full blur-sm"
                ></div>
              </div>

              <div class="text-center">
                <h1
                  class="text-4xl font-black text-[#8B4513] tracking-wide"
                  style="
                    text-shadow:
                      2px 2px 0 #deb887,
                      -1px -1px 0 #654321;
                  "
                >
                  DOFUS STUFF
                </h1>
                <p class="text-[#8B4513]/70 text-sm font-medium mt-1">
                  ✨ World of Twelve Companion ✨
                </p>
              </div>

              <!-- Another egg -->
              <div class="relative">
                <div
                  class="w-14 h-16 bg-gradient-to-b from-[#00CED1] via-[#20B2AA] to-[#008B8B] rounded-[50%] shadow-lg animate-float-delayed"
                >
                  <div
                    class="absolute top-2 left-3 w-4 h-6 bg-gradient-to-br from-white/50 to-transparent rounded-full"
                  ></div>
                </div>
                <div
                  class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-2 bg-black/20 rounded-full blur-sm"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Cards - Wooden panel style -->
      <div class="grid md:grid-cols-2 gap-5">
        <!-- Archimonstres Card -->
        <NuxtLink to="/archimonstres" class="group">
          <div
            class="relative bg-gradient-to-b from-[#DEB887] to-[#D2B48C] rounded-xl p-1 shadow-xl hover:scale-[1.02] transition-transform duration-300"
          >
            <!-- Wood frame -->
            <div
              class="absolute inset-0 rounded-xl border-4 border-[#8B4513] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
            ></div>

            <!-- Inner content -->
            <div
              class="relative bg-gradient-to-br from-[#FAEBD7] to-[#F5DEB3] rounded-lg p-5"
            >
              <!-- Corner rivets -->
              <div
                class="absolute top-2 left-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>
              <div
                class="absolute top-2 right-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>
              <div
                class="absolute bottom-2 left-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>
              <div
                class="absolute bottom-2 right-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>

              <div class="flex items-start gap-4">
                <!-- Monster icon bubble -->
                <div
                  class="w-16 h-16 bg-gradient-to-b from-[#FF6347] to-[#DC143C] rounded-2xl flex items-center justify-center shadow-lg border-2 border-[#8B0000] group-hover:rotate-6 transition-transform"
                >
                  <span class="text-3xl">👹</span>
                </div>

                <div class="flex-1">
                  <h2
                    class="text-xl font-black text-[#8B4513] group-hover:text-[#CD853F] transition-colors"
                  >
                    Archimonstres
                  </h2>
                  <p class="text-[#8B4513]/70 text-sm mt-1">
                    Hunt 286 legendary creatures for your Dofus Ocre!
                  </p>

                  <div class="flex gap-2 mt-3">
                    <span
                      class="px-3 py-1 bg-[#FF6347] text-white text-xs font-bold rounded-full shadow"
                    >
                      🎯 OCRE QUEST
                    </span>
                    <span
                      class="px-3 py-1 bg-[#32CD32] text-white text-xs font-bold rounded-full shadow"
                    >
                      📊 TRACKING
                    </span>
                  </div>
                </div>

                <div
                  class="text-[#8B4513] group-hover:translate-x-2 transition-transform"
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
                      stroke-width="3"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Items Card -->
        <NuxtLink to="/items" class="group">
          <div
            class="relative bg-gradient-to-b from-[#DEB887] to-[#D2B48C] rounded-xl p-1 shadow-xl hover:scale-[1.02] transition-transform duration-300"
          >
            <div
              class="absolute inset-0 rounded-xl border-4 border-[#8B4513] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
            ></div>

            <div
              class="relative bg-gradient-to-br from-[#FAEBD7] to-[#F5DEB3] rounded-lg p-5"
            >
              <div
                class="absolute top-2 left-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>
              <div
                class="absolute top-2 right-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>
              <div
                class="absolute bottom-2 left-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>
              <div
                class="absolute bottom-2 right-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>

              <div class="flex items-start gap-4">
                <div
                  class="w-16 h-16 bg-gradient-to-b from-[#4169E1] to-[#0000CD] rounded-2xl flex items-center justify-center shadow-lg border-2 border-[#00008B] group-hover:rotate-6 transition-transform"
                >
                  <span class="text-3xl">⚔️</span>
                </div>

                <div class="flex-1">
                  <h2
                    class="text-xl font-black text-[#8B4513] group-hover:text-[#CD853F] transition-colors"
                  >
                    Items & Gear
                  </h2>
                  <p class="text-[#8B4513]/70 text-sm mt-1">
                    1000+ equipment pieces to browse and compare!
                  </p>

                  <div class="flex gap-2 mt-3">
                    <span
                      class="px-3 py-1 bg-[#4169E1] text-white text-xs font-bold rounded-full shadow"
                    >
                      📦 DATABASE
                    </span>
                    <span
                      class="px-3 py-1 bg-[#9932CC] text-white text-xs font-bold rounded-full shadow"
                    >
                      🛡️ BUILDS
                    </span>
                  </div>
                </div>

                <div
                  class="text-[#8B4513] group-hover:translate-x-2 transition-transform"
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
                      stroke-width="3"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Sales Tracker Card -->
        <NuxtLink to="/crafting" class="group">
          <div
            class="relative bg-gradient-to-b from-[#DEB887] to-[#D2B48C] rounded-xl p-1 shadow-xl hover:scale-[1.02] transition-transform duration-300"
          >
            <div
              class="absolute inset-0 rounded-xl border-4 border-[#8B4513] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
            ></div>

            <div
              class="relative bg-gradient-to-br from-[#FAEBD7] to-[#F5DEB3] rounded-lg p-5"
            >
              <div
                class="absolute top-2 left-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>
              <div
                class="absolute top-2 right-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>
              <div
                class="absolute bottom-2 left-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>
              <div
                class="absolute bottom-2 right-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>

              <div class="flex items-start gap-4">
                <div
                  class="w-16 h-16 bg-gradient-to-b from-[#FFD700] to-[#DAA520] rounded-2xl flex items-center justify-center shadow-lg border-2 border-[#B8860B] group-hover:rotate-6 transition-transform"
                >
                  <span class="text-3xl">💰</span>
                </div>

                <div class="flex-1">
                  <h2
                    class="text-xl font-black text-[#8B4513] group-hover:text-[#CD853F] transition-colors"
                  >
                    Kamas Tracker
                  </h2>
                  <p class="text-[#8B4513]/70 text-sm mt-1">
                    Track your crafting sales and maximize profits!
                  </p>

                  <div class="flex gap-2 mt-3">
                    <span
                      class="px-3 py-1 bg-[#FFD700] text-[#8B4513] text-xs font-bold rounded-full shadow"
                    >
                      💎 SALES
                    </span>
                    <span
                      class="px-3 py-1 bg-[#32CD32] text-white text-xs font-bold rounded-full shadow"
                    >
                      📈 PROFITS
                    </span>
                  </div>
                </div>

                <div
                  class="text-[#8B4513] group-hover:translate-x-2 transition-transform"
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
                      stroke-width="3"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Succès Card -->
        <NuxtLink to="/succes" class="group">
          <div
            class="relative bg-gradient-to-b from-[#DEB887] to-[#D2B48C] rounded-xl p-1 shadow-xl hover:scale-[1.02] transition-transform duration-300"
          >
            <div
              class="absolute inset-0 rounded-xl border-4 border-[#8B4513] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
            ></div>

            <div
              class="relative bg-gradient-to-br from-[#FAEBD7] to-[#F5DEB3] rounded-lg p-5"
            >
              <div
                class="absolute top-2 left-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>
              <div
                class="absolute top-2 right-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>
              <div
                class="absolute bottom-2 left-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>
              <div
                class="absolute bottom-2 right-2 w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full shadow-inner"
              ></div>

              <div class="flex items-start gap-4">
                <div
                  class="w-16 h-16 bg-gradient-to-b from-[#FF69B4] to-[#DB7093] rounded-2xl flex items-center justify-center shadow-lg border-2 border-[#C71585] group-hover:rotate-6 transition-transform"
                >
                  <span class="text-3xl">⭐</span>
                </div>

                <div class="flex-1">
                  <h2
                    class="text-xl font-black text-[#8B4513] group-hover:text-[#CD853F] transition-colors"
                  >
                    Succès
                  </h2>
                  <p class="text-[#8B4513]/70 text-sm mt-1">
                    Complete achievements and unlock rewards!
                  </p>

                  <div class="flex gap-2 mt-3">
                    <span
                      class="px-3 py-1 bg-[#FF69B4] text-white text-xs font-bold rounded-full shadow"
                    >
                      🏆 ACHIEVEMENTS
                    </span>
                    <span
                      class="px-3 py-1 bg-[#FFA500] text-white text-xs font-bold rounded-full shadow"
                    >
                      🎁 REWARDS
                    </span>
                  </div>
                </div>

                <div
                  class="text-[#8B4513] group-hover:translate-x-2 transition-transform"
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
                      stroke-width="3"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Dofus Eggs Row -->
      <div class="flex justify-center items-center gap-4 mt-8">
        <div
          class="w-8 h-10 bg-gradient-to-b from-[#FF6347] to-[#DC143C] rounded-[50%] shadow-md animate-bounce-slow"
          style="animation-delay: 0s"
        ></div>
        <div
          class="w-8 h-10 bg-gradient-to-b from-[#4169E1] to-[#0000CD] rounded-[50%] shadow-md animate-bounce-slow"
          style="animation-delay: 0.1s"
        ></div>
        <div
          class="w-8 h-10 bg-gradient-to-b from-[#32CD32] to-[#228B22] rounded-[50%] shadow-md animate-bounce-slow"
          style="animation-delay: 0.2s"
        ></div>
        <div
          class="w-8 h-10 bg-gradient-to-b from-[#FFD700] to-[#FFA500] rounded-[50%] shadow-md animate-bounce-slow"
          style="animation-delay: 0.3s"
        ></div>
        <div
          class="w-8 h-10 bg-gradient-to-b from-[#9932CC] to-[#4B0082] rounded-[50%] shadow-md animate-bounce-slow"
          style="animation-delay: 0.4s"
        ></div>
        <div
          class="w-8 h-10 bg-gradient-to-b from-[#00CED1] to-[#008B8B] rounded-[50%] shadow-md animate-bounce-slow"
          style="animation-delay: 0.5s"
        ></div>
      </div>

      <!-- Stats in wooden sign style -->
      <div class="flex justify-center mt-6">
        <div class="relative">
          <!-- Sign post -->
          <div
            class="absolute left-1/2 -translate-x-1/2 -bottom-8 w-4 h-12 bg-gradient-to-r from-[#8B4513] via-[#A0522D] to-[#8B4513]"
          ></div>
          <!-- Sign board -->
          <div
            class="relative bg-gradient-to-b from-[#A0522D] to-[#8B4513] rounded-lg px-8 py-4 border-4 border-[#654321] shadow-xl"
          >
            <div class="grid grid-cols-4 gap-8 text-center">
              <div>
                <div class="text-2xl font-black text-[#FFD700]">286</div>
                <div class="text-[#DEB887] text-xs">Monsters</div>
              </div>
              <div>
                <div class="text-2xl font-black text-[#FFD700]">1K+</div>
                <div class="text-[#DEB887] text-xs">Items</div>
              </div>
              <div>
                <div class="text-2xl font-black text-[#FFD700]">100%</div>
                <div class="text-[#DEB887] text-xs">Local</div>
              </div>
              <div>
                <div class="text-2xl font-black text-[#FFD700]">24/7</div>
                <div class="text-[#DEB887] text-xs">Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <slot name="theme-switcher" />
  </div>
</template>

<script setup>
useHead({
  title: "Dofus Stuff - World of Twelve Companion",
  meta: [
    {
      name: "description",
      content: "Your companion for the World of Twelve",
    },
  ],
});
</script>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes float-delayed {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 3s ease-in-out infinite;
  animation-delay: 1.5s;
}

@keyframes cloud-1 {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(30px);
  }
}

@keyframes cloud-2 {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-20px);
  }
}

@keyframes cloud-3 {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(15px);
  }
}

.animate-cloud-1 {
  animation: cloud-1 20s ease-in-out infinite;
}
.animate-cloud-2 {
  animation: cloud-2 25s ease-in-out infinite;
}
.animate-cloud-3 {
  animation: cloud-3 18s ease-in-out infinite;
}

@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}
</style>