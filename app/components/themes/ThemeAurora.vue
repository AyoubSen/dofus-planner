<!-- components/themes/ThemeVaporwave.vue -->
<template>
  <div class="min-h-screen bg-[#0d0221] relative overflow-hidden">
    <!-- Grid floor -->
    <div class="absolute inset-0" style="perspective: 500px">
      <div
        class="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-[#0d0221] via-transparent to-transparent z-10"
      ></div>
      <div
        class="absolute bottom-0 left-[-50%] right-[-50%] h-[50vh] origin-bottom"
        style="
          transform: rotateX(60deg);
          background-image: linear-gradient(#ff00ff33 1px, transparent 1px),
            linear-gradient(90deg, #ff00ff33 1px, transparent 1px);
          background-size: 40px 40px;
          animation: grid-move 20s linear infinite;
        "
      ></div>
    </div>

    <!-- Sun -->
    <div class="absolute bottom-[20%] left-1/2 -translate-x-1/2 z-0">
      <div
        class="w-64 h-64 rounded-full bg-gradient-to-b from-[#ff6b6b] via-[#feca57] to-[#ff9ff3] opacity-80"
      ></div>
      <!-- Sun lines -->
      <div
        class="absolute inset-0 overflow-hidden rounded-full"
        style="
          background: repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 8px,
            #0d0221 8px,
            #0d0221 16px
          );
        "
      ></div>
    </div>

    <!-- Palm trees silhouettes -->
    <div
      class="absolute bottom-[15%] left-[10%] text-7xl opacity-50"
      style="filter: drop-shadow(0 0 10px #ff00ff)"
    >
      🌴
    </div>
    <div
      class="absolute bottom-[18%] right-[8%] text-8xl opacity-40"
      style="filter: drop-shadow(0 0 10px #00ffff)"
    >
      🌴
    </div>

    <!-- Stars -->
    <div class="absolute inset-0">
      <div
        v-for="i in 50"
        :key="i"
        class="absolute w-0.5 h-0.5 bg-white rounded-full"
        :style="{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 50}%`,
          opacity: Math.random() * 0.8 + 0.2,
        }"
      ></div>
    </div>

    <!-- Main content -->
    <div class="relative z-20 max-w-4xl mx-auto px-6 py-10">
      <!-- Title -->
      <div class="text-center mb-10">
        <h1
          class="text-5xl font-black tracking-wider mb-2"
          style="
            background: linear-gradient(
              180deg,
              #ff6ad5 0%,
              #c774e8 25%,
              #ad8cff 50%,
              #8795e8 75%,
              #94d0ff 100%
            );
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 0 30px #ff00ff80);
          "
        >
          D O F U S
        </h1>
        <h2
          class="text-3xl font-black tracking-[0.5em] text-transparent"
          style="
            -webkit-text-stroke: 2px #00ffff;
            filter: drop-shadow(0 0 20px #00ffff);
          "
        >
          STUFF
        </h2>
        <p
          class="text-[#ff71ce] mt-4 tracking-widest text-sm font-mono animate-pulse"
        >
          ▸ W O R L D _ O F _ T W E L V E ◂
        </p>
      </div>

      <!-- Cards Grid -->
      <div class="grid md:grid-cols-2 gap-5">
        <!-- Archimonstres -->
        <NuxtLink to="/archimonstres" class="group">
          <div
            class="relative p-[2px] rounded-lg overflow-hidden hover:scale-[1.02] transition-transform"
            style="
              background: linear-gradient(
                135deg,
                #ff00ff,
                #00ffff,
                #ff00ff,
                #00ffff
              );
              background-size: 300% 300%;
              animation: gradient-border 4s ease infinite;
            "
          >
            <div
              class="bg-[#0d0221]/95 backdrop-blur rounded-lg p-5 h-full relative overflow-hidden"
            >
              <!-- Scanlines -->
              <div
                class="absolute inset-0 opacity-10 pointer-events-none"
                style="
                  background: repeating-linear-gradient(
                    0deg,
                    transparent 0px,
                    transparent 2px,
                    #ffffff10 2px,
                    #ffffff10 4px
                  );
                "
              ></div>

              <div class="relative z-10 flex items-start gap-4">
                <div
                  class="w-14 h-14 bg-gradient-to-br from-[#ff6ad5] to-[#ff00ff] rounded-lg flex items-center justify-center shadow-[0_0_30px_#ff00ff50] group-hover:shadow-[0_0_50px_#ff00ff80] transition-shadow"
                >
                  <span class="text-2xl">👾</span>
                </div>

                <div class="flex-1">
                  <h3
                    class="text-lg font-bold text-[#ff6ad5] group-hover:text-[#ff00ff] transition-colors tracking-wide"
                  >
                    ARCHIMONSTRES
                  </h3>
                  <p
                    class="text-[#8795e8] text-sm mt-1 font-mono"
                  >
                    Hunt legendary creatures
                  </p>

                  <div class="flex gap-2 mt-3">
                    <span
                      class="px-2 py-1 bg-[#ff00ff]/20 text-[#ff6ad5] text-xs font-mono rounded border border-[#ff00ff]/30"
                    >
                      OCRE.exe
                    </span>
                    <span
                      class="px-2 py-1 bg-[#00ffff]/20 text-[#00ffff] text-xs font-mono rounded border border-[#00ffff]/30"
                    >
                      286_TARGETS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Items -->
        <NuxtLink to="/items" class="group">
          <div
            class="relative p-[2px] rounded-lg overflow-hidden hover:scale-[1.02] transition-transform"
            style="
              background: linear-gradient(
                135deg,
                #00ffff,
                #ff00ff,
                #00ffff,
                #ff00ff
              );
              background-size: 300% 300%;
              animation: gradient-border 4s ease infinite;
              animation-delay: 1s;
            "
          >
            <div
              class="bg-[#0d0221]/95 backdrop-blur rounded-lg p-5 h-full relative overflow-hidden"
            >
              <div
                class="absolute inset-0 opacity-10 pointer-events-none"
                style="
                  background: repeating-linear-gradient(
                    0deg,
                    transparent 0px,
                    transparent 2px,
                    #ffffff10 2px,
                    #ffffff10 4px
                  );
                "
              ></div>

              <div class="relative z-10 flex items-start gap-4">
                <div
                  class="w-14 h-14 bg-gradient-to-br from-[#00ffff] to-[#01cdfe] rounded-lg flex items-center justify-center shadow-[0_0_30px_#00ffff50] group-hover:shadow-[0_0_50px_#00ffff80] transition-shadow"
                >
                  <span class="text-2xl">💎</span>
                </div>

                <div class="flex-1">
                  <h3
                    class="text-lg font-bold text-[#00ffff] group-hover:text-[#01cdfe] transition-colors tracking-wide"
                  >
                    ITEMS & GEAR
                  </h3>
                  <p
                    class="text-[#8795e8] text-sm mt-1 font-mono"
                  >
                    Browse equipment database
                  </p>

                  <div class="flex gap-2 mt-3">
                    <span
                      class="px-2 py-1 bg-[#00ffff]/20 text-[#00ffff] text-xs font-mono rounded border border-[#00ffff]/30"
                    >
                      DATA.db
                    </span>
                    <span
                      class="px-2 py-1 bg-[#ff00ff]/20 text-[#ff6ad5] text-xs font-mono rounded border border-[#ff00ff]/30"
                    >
                      1K+_ITEMS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Sales -->
        <NuxtLink to="/crafting" class="group">
          <div
            class="relative p-[2px] rounded-lg overflow-hidden hover:scale-[1.02] transition-transform"
            style="
              background: linear-gradient(
                135deg,
                #feca57,
                #ff6b6b,
                #feca57,
                #ff6b6b
              );
              background-size: 300% 300%;
              animation: gradient-border 4s ease infinite;
              animation-delay: 2s;
            "
          >
            <div
              class="bg-[#0d0221]/95 backdrop-blur rounded-lg p-5 h-full relative overflow-hidden"
            >
              <div
                class="absolute inset-0 opacity-10 pointer-events-none"
                style="
                  background: repeating-linear-gradient(
                    0deg,
                    transparent 0px,
                    transparent 2px,
                    #ffffff10 2px,
                    #ffffff10 4px
                  );
                "
              ></div>

              <div class="relative z-10 flex items-start gap-4">
                <div
                  class="w-14 h-14 bg-gradient-to-br from-[#feca57] to-[#ff9f43] rounded-lg flex items-center justify-center shadow-[0_0_30px_#feca5750] group-hover:shadow-[0_0_50px_#feca5780] transition-shadow"
                >
                  <span class="text-2xl">💸</span>
                </div>

                <div class="flex-1">
                  <h3
                    class="text-lg font-bold text-[#feca57] group-hover:text-[#ff9f43] transition-colors tracking-wide"
                  >
                    KAMAS TRACKER
                  </h3>
                  <p
                    class="text-[#8795e8] text-sm mt-1 font-mono"
                  >
                    Track sales & profits
                  </p>

                  <div class="flex gap-2 mt-3">
                    <span
                      class="px-2 py-1 bg-[#feca57]/20 text-[#feca57] text-xs font-mono rounded border border-[#feca57]/30"
                    >
                      PROFIT.sys
                    </span>
                    <span
                      class="px-2 py-1 bg-[#ff6b6b]/20 text-[#ff6b6b] text-xs font-mono rounded border border-[#ff6b6b]/30"
                    >
                      ANALYTICS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Succès -->
        <NuxtLink to="/succes" class="group">
          <div
            class="relative p-[2px] rounded-lg overflow-hidden hover:scale-[1.02] transition-transform"
            style="
              background: linear-gradient(
                135deg,
                #ff9ff3,
                #f368e0,
                #ff9ff3,
                #f368e0
              );
              background-size: 300% 300%;
              animation: gradient-border 4s ease infinite;
              animation-delay: 3s;
            "
          >
            <div
              class="bg-[#0d0221]/95 backdrop-blur rounded-lg p-5 h-full relative overflow-hidden"
            >
              <div
                class="absolute inset-0 opacity-10 pointer-events-none"
                style="
                  background: repeating-linear-gradient(
                    0deg,
                    transparent 0px,
                    transparent 2px,
                    #ffffff10 2px,
                    #ffffff10 4px
                  );
                "
              ></div>

              <div class="relative z-10 flex items-start gap-4">
                <div
                  class="w-14 h-14 bg-gradient-to-br from-[#ff9ff3] to-[#f368e0] rounded-lg flex items-center justify-center shadow-[0_0_30px_#ff9ff350] group-hover:shadow-[0_0_50px_#ff9ff380] transition-shadow"
                >
                  <span class="text-2xl">🏆</span>
                </div>

                <div class="flex-1">
                  <h3
                    class="text-lg font-bold text-[#ff9ff3] group-hover:text-[#f368e0] transition-colors tracking-wide"
                  >
                    SUCCÈS
                  </h3>
                  <p
                    class="text-[#8795e8] text-sm mt-1 font-mono"
                  >
                    Achievements & rewards
                  </p>

                  <div class="flex gap-2 mt-3">
                    <span
                      class="px-2 py-1 bg-[#ff9ff3]/20 text-[#ff9ff3] text-xs font-mono rounded border border-[#ff9ff3]/30"
                    >
                      ACHIEVE.log
                    </span>
                    <span
                      class="px-2 py-1 bg-[#f368e0]/20 text-[#f368e0] text-xs font-mono rounded border border-[#f368e0]/30"
                    >
                      REWARDS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Stats -->
      <div
        class="mt-10 p-5 rounded-lg border border-[#ff00ff]/30 bg-[#0d0221]/80 backdrop-blur relative overflow-hidden"
      >
        <div
          class="absolute inset-0 opacity-5 pointer-events-none"
          style="
            background: repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              #ffffff 2px,
              #ffffff 4px
            );
          "
        ></div>

        <div class="relative z-10 grid grid-cols-4 gap-6 text-center">
          <div>
            <div
              class="text-2xl font-black text-transparent"
              style="
                background: linear-gradient(180deg, #ff6ad5, #ff00ff);
                -webkit-background-clip: text;
              "
            >
              286
            </div>
            <div class="text-[#8795e8] text-xs font-mono mt-1">MONSTERS</div>
          </div>
          <div>
            <div
              class="text-2xl font-black text-transparent"
              style="
                background: linear-gradient(180deg, #00ffff, #01cdfe);
                -webkit-background-clip: text;
              "
            >
              1K+
            </div>
            <div class="text-[#8795e8] text-xs font-mono mt-1">ITEMS</div>
          </div>
          <div>
            <div
              class="text-2xl font-black text-transparent"
              style="
                background: linear-gradient(180deg, #feca57, #ff9f43);
                -webkit-background-clip: text;
              "
            >
              100%
            </div>
            <div class="text-[#8795e8] text-xs font-mono mt-1">LOCAL</div>
          </div>
          <div>
            <div
              class="text-2xl font-black text-transparent"
              style="
                background: linear-gradient(180deg, #ff9ff3, #f368e0);
                -webkit-background-clip: text;
              "
            >
              24/7
            </div>
            <div class="text-[#8795e8] text-xs font-mono mt-1">ONLINE</div>
          </div>
        </div>
      </div>
    </div>

    <slot name="theme-switcher" />
  </div>
</template>

<script setup>
useHead({
  title: "DOFUS STUFF // Vaporwave Edition",
  meta: [
    {
      name: "description",
      content: "Your retro-futuristic companion for the World of Twelve",
    },
  ],
});
</script>

<style scoped>
@keyframes grid-move {
  0% {
    transform: rotateX(60deg) translateY(0);
  }
  100% {
    transform: rotateX(60deg) translateY(40px);
  }
}

@keyframes gradient-border {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>