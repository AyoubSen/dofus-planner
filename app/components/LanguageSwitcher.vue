<template>
  <div class="fixed bottom-6 right-6 z-50">
    <div class="relative">
      <!-- Toggle Button -->
      <button
        @click="isOpen = !isOpen"
        class="group flex items-center gap-2 px-4 py-3 bg-gray-800/80 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-lg shadow-black/20 hover:border-orange-500/50 hover:shadow-orange-500/10 transition-all duration-300"
      >
        <svg
          class="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
        <span class="text-sm font-semibold text-gray-200 uppercase">
          {{ locale }}
        </span>
        <svg
          :class="[
            'w-4 h-4 text-gray-500 transition-transform duration-300',
            isOpen ? 'rotate-180' : '',
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <!-- Dropdown -->
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          class="absolute bottom-full right-0 mb-2 bg-gray-800/90 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-xl shadow-black/30 overflow-hidden min-w-[120px]"
        >
          <button
            v-for="lang in availableLocales"
            :key="lang.code"
            @click="switchLanguage(lang.code)"
            :class="[
              'w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200',
              locale === lang.code
                ? 'bg-orange-500/20 text-orange-300'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white',
            ]"
          >
            <span class="text-lg">{{ lang.flag }}</span>
            <span class="text-sm font-medium">{{ lang.name }}</span>
            <svg
              v-if="locale === lang.code"
              class="w-4 h-4 ml-auto text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
const { locale, setLocale } = useI18n();
const switchLocalePath = useSwitchLocalePath();
const router = useRouter();

const isOpen = ref(false);

const availableLocales = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

const switchLanguage = (langCode) => {
  const path = switchLocalePath(langCode);
  router.push(path);
  isOpen.value = false;
};

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const handleClickOutside = (event) => {
  if (!event.target.closest('.fixed.bottom-6.right-6')) {
    isOpen.value = false;
  }
};
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>