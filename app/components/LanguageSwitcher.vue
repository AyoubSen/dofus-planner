<template>
  <div class="relative">
    <!-- Toggle Button -->
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3 py-2 text-sm rounded-theme-button border border-theme-border hover:border-theme-border-hover bg-theme-bg-secondary/50 hover:bg-theme-bg-secondary text-theme-text-secondary hover:text-theme-text-primary transition-all duration-200"
    >
      <span class="text-base">{{ currentLocaleFlag }}</span>
      <span class="hidden sm:inline uppercase font-medium">{{ locale }}</span>
      <svg
        class="w-3 h-3 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
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
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-40 rounded-theme-card border border-theme-border bg-theme-bg-secondary shadow-theme-lg z-50"
      >
        <div class="p-1">
          <button
            v-for="lang in availableLocales"
            :key="lang.code"
            @click="switchLanguage(lang.code)"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-theme-button text-left transition-all duration-200"
            :class="[
              locale === lang.code
                ? 'bg-theme-accent-orange/10 text-theme-accent-orange'
                : 'text-theme-text-secondary hover:bg-theme-bg-tertiary hover:text-theme-text-primary',
            ]"
          >
            <span class="text-lg">{{ lang.flag }}</span>
            <span class="text-sm font-medium flex-1">{{ lang.name }}</span>
            <svg
              v-if="locale === lang.code"
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const { locale } = useI18n();
const switchLocalePath = useSwitchLocalePath();
const router = useRouter();

const isOpen = ref(false);

const availableLocales = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

const currentLocaleFlag = computed(() => {
  const current = availableLocales.find((l) => l.code === locale.value);
  return current?.flag || '🌐';
});

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
  if (!event.target.closest('.relative')) {
    isOpen.value = false;
  }
};
</script>
