<!-- components/ThemeSwitcher.vue -->
<template>
  <div class="fixed bottom-6 right-6 z-50">
    <div class="relative">
      <button
        @click="isOpen = !isOpen"
        class="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all shadow-lg"
        :class="buttonClass"
      >
        <svg
          class="w-5 h-5"
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
      </button>

      <!-- Dropdown -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="isOpen"
          class="absolute bottom-16 right-0 w-48 py-2 rounded-xl shadow-xl border"
          :class="dropdownClass"
        >
          <div class="px-3 py-2 text-xs uppercase tracking-wider opacity-50">
            Choose Theme
          </div>
          <button
            v-for="theme in themes"
            :key="theme.id"
            @click="selectTheme(theme.id)"
            class="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-white/10 transition-colors"
            :class="{ 'bg-white/10': currentTheme === theme.id }"
          >
            <span>{{ theme.icon }}</span>
            <span>{{ theme.name }}</span>
            <svg
              v-if="currentTheme === theme.id"
              class="w-4 h-4 ml-auto"
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
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
const { currentTheme, setTheme, themes } = useTheme();
const isOpen = ref(false);

const selectTheme = (themeId: (typeof themes)[number]["id"]) => {
  setTheme(themeId);
  isOpen.value = false;
};

// Theme-aware styling
const buttonClass = computed(() => {
  switch (currentTheme.value) {
    case "cyberpunk":
      return "text-cyan-400 border-cyan-500/30";
    case "medieval":
      return "text-amber-400 border-amber-700/30";
    default:
      return "text-white";
  }
});

const dropdownClass = computed(() => {
  switch (currentTheme.value) {
    case "cyberpunk":
      return "bg-black border-cyan-500/30 text-cyan-100";
    case "medieval":
      return "bg-stone-900 border-amber-700/30 text-amber-100";
    default:
      return "bg-gray-800 border-gray-700 text-gray-100";
  }
});

// Close on click outside
onMounted(() => {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".fixed.bottom-6.right-6")) {
      isOpen.value = false;
    }
  });
});
</script>