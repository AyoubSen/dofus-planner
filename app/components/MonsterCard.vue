<template>
  <div
    class="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-750 transition-colors"
  >
    <div class="flex items-start gap-6">
      <!-- Monster Image -->
      <div class="flex-shrink-0">
        <img
          :src="monster.image_url"
          :alt="monster.nom"
          class="w-20 h-20 rounded-lg object-cover border border-gray-600"
          @error="handleImageError"
        />
      </div>

      <!-- Monster Info -->
      <div class="flex-1 min-w-0">
        <h3 class="text-xl font-semibold text-gray-100 mb-2 break-words">
          {{ monster.nom }}
        </h3>
        <p class="text-base text-gray-400 mb-4">{{ monster.nom_normal }}</p>

        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="text-gray-500 text-sm w-16">Type:</span>
            <span class="text-blue-400 font-medium">{{ monster.type }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500 text-sm w-16">Étape:</span>
            <span class="text-orange-400 font-medium">{{ monster.etape }}</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-gray-500 text-sm w-16 mt-0.5">Zone:</span>
            <span class="text-green-400 font-medium break-words">{{
              monster.zone
            }}</span>
          </div>
          <div v-if="monster.souszone" class="flex items-start gap-2">
            <span class="text-gray-500 text-sm w-16 mt-0.5">Sous-zone:</span>
            <span class="text-purple-400 font-medium break-words">{{
              monster.souszone
            }}</span>
          </div>

          <!-- Tracking Controls (only for dofus-ocre mode) -->
          <div
            v-if="mode === 'dofus-ocre'"
            class="flex items-center gap-2 pt-3 border-t border-gray-600"
          >
            <span class="text-gray-500 text-sm w-16">Count:</span>
            <div class="flex items-center gap-2">
              <button
                @click="decrementCount"
                :disabled="monsterCount === 0"
                class="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 12H4"
                  ></path>
                </svg>
              </button>
              <span
                class="text-yellow-400 font-bold text-lg min-w-[2rem] text-center"
                >{{ monsterCount }}</span
              >
              <button
                @click="incrementCount"
                class="w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  monster: {
    type: Object,
    required: true,
  },
  mode: {
    type: String,
    default: null,
  },
  server: {
    type: Object,
    default: null,
  },
  character: {
    type: Object,
    default: null,
  },
});

const monsterCount = ref(0);

const getStorageKey = () => {
  if (!props.server || !props.character || !props.monster) return null;
  return `monster_count_${props.server.id}_${props.character.id}_${props.monster.id}`;
};

onMounted(() => {
  loadCount();
});

watch([() => props.server, () => props.character], () => {
  loadCount();
});

const loadCount = () => {
  const key = getStorageKey();
  if (key) {
    const saved = localStorage.getItem(key);
    monsterCount.value = saved ? parseInt(saved, 10) : 0;
  }
};

const saveCount = () => {
  const key = getStorageKey();
  if (key) {
    localStorage.setItem(key, monsterCount.value.toString());
  }
};

const incrementCount = () => {
  monsterCount.value++;
  saveCount();
};

const decrementCount = () => {
  if (monsterCount.value > 0) {
    monsterCount.value--;
    saveCount();
  }
};

const handleImageError = (event) => {
  event.target.src =
    "https://via.placeholder.com/80x80/374151/9CA3AF?text=Monster";
};
</script>

<style scoped>
.hover\:bg-gray-750:hover {
  background-color: #374151;
}
</style>
