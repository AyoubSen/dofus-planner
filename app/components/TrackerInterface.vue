<template>
  <div class="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <button
        @click="handleModeSelection('dofus-ocre')"
        :class="[
          'p-6 border-2 rounded-lg transition-all duration-200 text-left',
          selectedMode === 'dofus-ocre'
            ? 'border-orange-500 bg-orange-900/30 text-orange-200 shadow-lg'
            : 'border-orange-600 hover:bg-orange-900/20 text-orange-300 hover:text-orange-200',
        ]"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xl font-semibold">Dofus Ocre</h3>
          <div v-if="selectedMode === 'dofus-ocre'" class="text-orange-400">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </div>
        </div>
        <p>Track your progress towards the Ocre Dofus</p>
      </button>

      <button
        @click="handleModeSelection('sell-only')"
        :class="[
          'p-6 border-2 rounded-lg transition-all duration-200 text-left',
          selectedMode === 'sell-only'
            ? 'border-green-500 bg-green-900/30 text-green-200 shadow-lg'
            : 'border-green-600 hover:bg-green-900/20 text-green-300 hover:text-green-200',
        ]"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xl font-semibold">Sell Only Mode</h3>
          <div v-if="selectedMode === 'sell-only'" class="text-green-400">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </div>
        </div>
        <p>Track items for selling purposes</p>
      </button>
    </div>

    <div v-if="selectedMode">
      <div v-if="selectedMode === 'dofus-ocre' && monstersData">
        <div v-if="isLoadingMonsters" class="text-center py-8">
          <div class="text-blue-400 text-lg">Loading monsters data...</div>
        </div>
        <MonstersGrid
          v-else
          :monsters="monstersData"
          :mode="selectedMode"
          :server="server"
          :character="character"
        />
      </div>

      <div v-else-if="selectedMode === 'sell-only'">
        <SellingInterface
          v-if="monstersData"
          :server="server"
          :character="character"
          :monsters-data="monstersData"
        />
      </div>
    </div>
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
