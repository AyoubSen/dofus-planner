<template>
  <div class="space-y-8">
    <!-- Mode Selection -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Dofus Ocre Mode -->
      <button
        @click="handleModeSelection('dofus-ocre')"
        :class="[
          'group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-500',
          selectedMode === 'dofus-ocre'
            ? 'bg-gradient-to-br from-orange-500/20 to-red-600/20 border-2 border-orange-500/50 shadow-xl shadow-orange-500/10'
            : 'bg-gray-800/40 border-2 border-gray-700/50 hover:border-orange-500/30 hover:bg-gray-800/60',
        ]"
      >
        <!-- Animated background -->
        <div
          :class="[
            'absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-600/10 transition-opacity duration-500',
            selectedMode === 'dofus-ocre' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50',
          ]"
        ></div>

        <!-- Glow effect -->
        <div
          :class="[
            'absolute -inset-px bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl blur transition-opacity duration-500',
            selectedMode === 'dofus-ocre' ? 'opacity-20' : 'opacity-0 group-hover:opacity-10',
          ]"
        ></div>

        <div class="relative z-10">
          <div class="flex items-start justify-between mb-4">
            <div
              :class="[
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500',
                selectedMode === 'dofus-ocre'
                  ? 'bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30'
                  : 'bg-gray-700/50 group-hover:bg-gradient-to-br group-hover:from-orange-500/50 group-hover:to-red-600/50',
              ]"
            >
              <svg
                class="w-7 h-7 text-white"
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

            <!-- Selected indicator -->
            <Transition name="scale">
              <div
                v-if="selectedMode === 'dofus-ocre'"
                class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30"
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
                    stroke-width="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </Transition>
          </div>

          <h3
            :class="[
              'text-2xl font-bold mb-2 transition-colors duration-300',
              selectedMode === 'dofus-ocre' ? 'text-orange-300' : 'text-gray-100 group-hover:text-orange-300',
            ]"
          >
            Dofus Ocre
          </h3>
          <p
            :class="[
              'text-sm leading-relaxed transition-colors duration-300',
              selectedMode === 'dofus-ocre' ? 'text-orange-200/70' : 'text-gray-400 group-hover:text-gray-300',
            ]"
          >
            Track your progress towards the legendary Ochre Dofus. Monitor archimonstres and collect all souls.
          </p>

          <!-- Features -->
          <div class="flex flex-wrap gap-2 mt-4">
            <span
              class="px-2.5 py-1 bg-orange-500/10 text-orange-300 text-xs font-medium rounded-full border border-orange-500/20"
            >
              286 Archimonstres
            </span>
            <span
              class="px-2.5 py-1 bg-red-500/10 text-red-300 text-xs font-medium rounded-full border border-red-500/20"
            >
              Progress Tracking
            </span>
          </div>
        </div>
      </button>

      <!-- Sell Only Mode -->
      <button
        @click="handleModeSelection('sell-only')"
        :class="[
          'group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-500',
          selectedMode === 'sell-only'
            ? 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/10'
            : 'bg-gray-800/40 border-2 border-gray-700/50 hover:border-emerald-500/30 hover:bg-gray-800/60',
        ]"
      >
        <div
          :class="[
            'absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 transition-opacity duration-500',
            selectedMode === 'sell-only' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50',
          ]"
        ></div>

        <div
          :class="[
            'absolute -inset-px bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur transition-opacity duration-500',
            selectedMode === 'sell-only' ? 'opacity-20' : 'opacity-0 group-hover:opacity-10',
          ]"
        ></div>

        <div class="relative z-10">
          <div class="flex items-start justify-between mb-4">
            <div
              :class="[
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500',
                selectedMode === 'sell-only'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30'
                  : 'bg-gray-700/50 group-hover:bg-gradient-to-br group-hover:from-emerald-500/50 group-hover:to-teal-600/50',
              ]"
            >
              <svg
                class="w-7 h-7 text-white"
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

            <Transition name="scale">
              <div
                v-if="selectedMode === 'sell-only'"
                class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
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
                    stroke-width="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </Transition>
          </div>

          <h3
            :class="[
              'text-2xl font-bold mb-2 transition-colors duration-300',
              selectedMode === 'sell-only' ? 'text-emerald-300' : 'text-gray-100 group-hover:text-emerald-300',
            ]"
          >
            Sell Only Mode
          </h3>
          <p
            :class="[
              'text-sm leading-relaxed transition-colors duration-300',
              selectedMode === 'sell-only' ? 'text-emerald-200/70' : 'text-gray-400 group-hover:text-gray-300',
            ]"
          >
            Track archimonstres for selling purposes. Perfect for hunters focused on kamas.
          </p>

          <div class="flex flex-wrap gap-2 mt-4">
            <span
              class="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-medium rounded-full border border-emerald-500/20"
            >
              Sell Tracking
            </span>
            <span
              class="px-2.5 py-1 bg-teal-500/10 text-teal-300 text-xs font-medium rounded-full border border-teal-500/20"
            >
              Quick Mode
            </span>
          </div>
        </div>
      </button>
    </div>

    <!-- Content Area -->
    <Transition name="fade-slide" mode="out-in">
      <div v-if="selectedMode" key="content">
        <!-- Loading State -->
        <Transition name="fade" mode="out-in">
          <div
            v-if="isLoadingMonsters"
            key="loading"
            class="flex flex-col items-center justify-center py-16"
          >
            <div class="relative mb-6">
              <div class="w-16 h-16 border-4 border-gray-700 rounded-full"></div>
              <div
                class="absolute inset-0 w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"
              ></div>
            </div>
            <h3 class="text-xl font-semibold text-gray-200 mb-2">
              Loading Monsters Data
            </h3>
            <p class="text-gray-400">Please wait while we fetch the latest data...</p>
          </div>

          <!-- Dofus Ocre Content -->
          <div
            v-else-if="selectedMode === 'dofus-ocre' && monstersData"
            key="dofus-ocre"
          >
            <MonstersGrid
              :monsters="monstersData"
              :mode="selectedMode"
              :server="server"
              :character="character"
            />
          </div>

          <!-- Sell Only Content -->
          <div v-else-if="selectedMode === 'sell-only'" key="sell-only">
            <SellingInterface
              v-if="monstersData"
              :server="server"
              :character="character"
              :monsters-data="monstersData"
            />
          </div>
        </Transition>
      </div>

      <!-- Empty State -->
      <div v-else key="empty" class="text-center py-16">
        <div
          class="w-24 h-24 bg-gray-800/60 rounded-2xl flex items-center justify-center mx-auto mb-6"
        >
          <svg
            class="w-12 h-12 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-300 mb-2">
          Select a Tracking Mode
        </h3>
        <p class="text-gray-500">
          Choose how you want to track your archimonstres above
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup>
defineProps({
  server: {
    type: Object,
    required: true,
  },
  character: {
    type: Object,
    required: true,
  },
  monstersData: {
    type: [Array, Object],
    default: null,
  },
  isLoadingCharacter: {
    type: Boolean,
    default: false,
  },
  isLoadingMonsters: {
    type: Boolean,
    default: false,
  },
});

const $emit = defineEmits(["changeCharacter", "changeServer", "modeSelected"]);
const selectedMode = ref(null);

const handleModeSelection = (mode) => {
  selectedMode.value = mode;
  $emit("modeSelected", mode);
};
</script>

<style scoped>
/* Animations */
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
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0);
}
</style>