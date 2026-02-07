<template>
  <div
    class="group relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 hover:bg-gray-800/60 hover:border-orange-500/30 transition-all duration-300"
  >
    <!-- Hover glow -->
    <div
      class="absolute -inset-px bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"
    ></div>

    <div class="relative z-10 flex items-start gap-5">
      <!-- Monster Image -->
      <div class="flex-shrink-0 relative">
        <div
          class="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-700/50 group-hover:border-orange-500/30 transition-colors duration-300"
        >
          <img
            :src="monster.image_url"
            :alt="monster.nom"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            @error="handleImageError"
            loading="lazy"
          />
        </div>
        <!-- Type badge -->
        <div
          :class="[
            'absolute -bottom-1 -right-1 px-2 py-0.5 text-xs font-bold rounded-full border shadow-lg',
            monster.type === 'archimonstre'
              ? 'bg-orange-500 text-white border-orange-400'
              : 'bg-gray-600 text-gray-200 border-gray-500',
          ]"
        >
          {{
            monster.type === 'archimonstre'
              ? t('archimonstres.monsterCard.typeArchi')
              : t('archimonstres.monsterCard.typeMob')
          }}
        </div>
      </div>

      <!-- Monster Info -->
      <div class="flex-1 min-w-0">
        <h3
          class="text-lg font-bold text-gray-100 mb-1 truncate group-hover:text-orange-300 transition-colors duration-300"
        >
          {{ monster.nom }}
        </h3>
        <p class="text-sm text-gray-400 mb-3 truncate">
          {{ monster.nom_normal }}
        </p>

        <!-- Info Grid -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span
              class="px-2 py-0.5 bg-orange-500/10 text-orange-300 text-xs font-medium rounded-md border border-orange-500/20"
            >
              {{
                t('archimonstres.monsterCard.etape', { number: monster.etape })
              }}
            </span>
          </div>

          <div class="flex items-center gap-2 text-sm">
            <svg
              class="w-4 h-4 text-emerald-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span class="text-gray-300 truncate">{{ monster.zone }}</span>
          </div>

          <div v-if="monster.souszone" class="flex items-center gap-2 text-sm">
            <svg
              class="w-4 h-4 text-purple-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <span class="text-gray-400 truncate">{{ monster.souszone }}</span>
          </div>
        </div>

        <!-- Tracking Controls (only for dofus-ocre mode) -->
        <Transition name="slide-fade">
          <div
            v-if="mode === 'dofus-ocre'"
            class="mt-4 pt-4 border-t border-gray-700/50"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-400">{{
                t('archimonstres.monsterCard.collected')
              }}</span>
              <div class="flex items-center gap-3">
                <button
                  @click="decrementCount"
                  :disabled="monsterCount === 0"
                  class="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 disabled:bg-gray-700/30 disabled:border-gray-600/30 disabled:cursor-not-allowed text-red-400 disabled:text-gray-500 flex items-center justify-center transition-all duration-200"
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
                    />
                  </svg>
                </button>

                <div
                  :class="[
                    'min-w-[3rem] h-9 px-3 rounded-xl flex items-center justify-center font-bold text-lg border transition-all duration-300',
                    monsterCount === 0
                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                  ]"
                >
                  {{ monsterCount }}
                </div>

                <button
                  @click="incrementCount"
                  class="w-9 h-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 flex items-center justify-center transition-all duration-200"
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
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Progress indicator -->
            <div class="mt-3">
              <div class="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                <div
                  :class="[
                    'h-full rounded-full transition-all duration-500',
                    monsterCount === 0
                      ? 'w-0'
                      : 'w-full bg-gradient-to-r from-emerald-500 to-teal-400',
                  ]"
                ></div>
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-xs text-gray-500">{{
                  t('archimonstres.monsterCard.missing')
                }}</span>
                <span class="text-xs text-gray-500">{{
                  t('archimonstres.monsterCard.complete')
                }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
const { t } = useI18n();

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
  const img = event.target;
  if (img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  img.src = '/monster-fallback.svg';
};
</script>

<style scoped>
/* Transitions */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
