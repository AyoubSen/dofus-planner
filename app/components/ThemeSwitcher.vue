<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3 py-2 text-sm rounded-theme-button border border-theme-border hover:border-theme-border-hover bg-theme-bg-secondary/50 hover:bg-theme-bg-secondary text-theme-text-secondary hover:text-theme-text-primary transition-all duration-200"
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
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
      <span class="hidden sm:inline">{{ currentThemeLabel }}</span>
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
        class="absolute right-0 mt-2 w-56 rounded-theme-card border border-theme-border bg-theme-bg-secondary shadow-theme-lg z-50"
      >
        <div class="p-2">
          <div class="px-3 py-2 text-xs font-semibold text-theme-text-muted uppercase tracking-wider">
            {{ $t('theme.title') }}
          </div>
          <button
            v-for="theme in themes"
            :key="theme.id"
            @click="selectTheme(theme.id)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-theme-button text-left transition-all duration-200"
            :class="[
              currentTheme === theme.id
                ? 'bg-theme-accent-orange/10 text-theme-accent-orange'
                : 'text-theme-text-secondary hover:bg-theme-bg-tertiary hover:text-theme-text-primary',
            ]"
          >
            <!-- Theme preview -->
            <div
              class="w-8 h-8 rounded-md border overflow-hidden flex-shrink-0"
              :class="getThemePreviewClass(theme.id)"
            >
              <div class="w-full h-1/2" :class="getThemePreviewTopClass(theme.id)"></div>
              <div class="w-full h-1/2" :class="getThemePreviewBottomClass(theme.id)"></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium">{{ theme.name }}</div>
              <div class="text-xs text-theme-text-muted truncate">
                {{ theme.description }}
              </div>
            </div>
            <svg
              v-if="currentTheme === theme.id"
              class="w-4 h-4 flex-shrink-0"
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

<script setup lang="ts">
const { currentTheme, setTheme, themes } = useTheme();
const isOpen = ref(false);

const currentThemeLabel = computed(() => {
  const theme = themes.find((t) => t.id === currentTheme.value);
  return theme?.name || 'Theme';
});

const selectTheme = (themeId: (typeof themes)[number]['id']) => {
  setTheme(themeId);
  isOpen.value = false;
};

const getThemePreviewClass = (themeId: string) => {
  switch (themeId) {
    case 'graphite':
      return 'border-zinc-700';
    case 'minimal':
      return 'border-zinc-700';
    default:
      return 'border-gray-600';
  }
};

const getThemePreviewTopClass = (themeId: string) => {
  switch (themeId) {
    case 'graphite':
      return 'bg-zinc-950';
    case 'minimal':
      return 'bg-zinc-900';
    default:
      return 'bg-gradient-to-r from-gray-800 to-gray-900';
  }
};

const getThemePreviewBottomClass = (themeId: string) => {
  switch (themeId) {
    case 'graphite':
      return 'bg-zinc-800';
    case 'minimal':
      return 'bg-zinc-800';
    default:
      return 'bg-gradient-to-r from-orange-500/20 to-blue-500/20';
  }
};

// Close on click outside
onMounted(() => {
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.relative')) {
      isOpen.value = false;
    }
  };
  document.addEventListener('click', handleClickOutside);
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
});
</script>
