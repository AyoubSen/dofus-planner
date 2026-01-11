<template>
  <div class="min-h-screen flex flex-col bg-theme-bg-primary text-theme-text-primary">
    <!-- Header -->
    <header
      class="sticky top-0 z-50 w-full border-b border-theme-border bg-theme-header-bg backdrop-blur-md"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <NuxtLink
            :to="localePath('/')"
            class="flex items-center gap-3 group"
          >
            <div
              class="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200"
            >
              <svg
                class="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"
                />
              </svg>
            </div>
            <span class="text-xl font-bold text-theme-text-primary">
              {{ $t('home.title') }}
            </span>
          </NuxtLink>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.path"
              :to="localePath(item.path)"
              class="relative px-4 py-2 text-sm font-medium rounded-theme-button transition-all duration-200"
              :class="[
                isActive(item.path)
                  ? 'text-theme-text-primary bg-theme-bg-secondary'
                  : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary/50',
              ]"
            >
              <span class="flex items-center gap-2">
                <component :is="item.icon" class="w-4 h-4" />
                {{ $t(item.label) }}
              </span>
              <span
                v-if="isActive(item.path)"
                class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                :class="item.color"
              ></span>
            </NuxtLink>
          </nav>

          <!-- Right side actions -->
          <div class="flex items-center gap-2">
            <!-- Theme Switcher -->
            <ThemeSwitcher />

            <!-- Language Switcher -->
            <LanguageSwitcher />

            <!-- Mobile menu button -->
            <button
              @click="isMobileMenuOpen = !isMobileMenuOpen"
              class="md:hidden p-2 rounded-theme-button text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary transition-colors"
            >
              <svg
                v-if="!isMobileMenuOpen"
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                v-else
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Navigation -->
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div
            v-if="isMobileMenuOpen"
            class="md:hidden py-4 border-t border-theme-border"
          >
            <nav class="flex flex-col gap-1">
              <NuxtLink
                v-for="item in navItems"
                :key="item.path"
                :to="localePath(item.path)"
                @click="isMobileMenuOpen = false"
                class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-theme-button transition-all duration-200"
                :class="[
                  isActive(item.path)
                    ? 'text-theme-text-primary bg-theme-bg-secondary'
                    : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary/50',
                ]"
              >
                <component :is="item.icon" class="w-5 h-5" />
                {{ $t(item.label) }}
              </NuxtLink>
            </nav>
          </div>
        </Transition>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-theme-border bg-theme-footer-bg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <!-- Logo and tagline -->
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"
                />
              </svg>
            </div>
            <span class="text-theme-text-secondary text-sm">
              {{ $t('home.title') }}
            </span>
          </div>

          <!-- Footer text -->
          <p class="text-theme-text-muted text-sm">
            <i18n-t keypath="home.footer.madeWith" tag="span">
              <template #heart>
                <span class="text-red-500">♥</span>
              </template>
            </i18n-t>
          </p>

          <!-- Footer links -->
          <div class="flex items-center gap-4 text-theme-text-muted text-sm">
            <span>© {{ new Date().getFullYear() }}</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath();
const route = useRoute();
const { initTheme } = useTheme();

const isMobileMenuOpen = ref(false);

// Navigation items
const navItems = [
  {
    path: '/archimonstres',
    label: 'nav.archimonstres',
    icon: resolveComponent('IconsIconArchimonstres'),
    color: 'bg-orange-500'
  },
  {
    path: '/items',
    label: 'nav.items',
    icon: resolveComponent('IconsIconItems'),
    color: 'bg-blue-500'
  },
  {
    path: '/crafting',
    label: 'nav.crafting',
    icon: resolveComponent('IconsIconCrafting'),
    color: 'bg-emerald-500'
  },
  {
    path: '/succes',
    label: 'nav.succes',
    icon: resolveComponent('IconsIconSucces'),
    color: 'bg-yellow-500'
  }
];

const isActive = (path: string) => {
  const currentPath = route.path;
  const localizedPath = localePath(path);
  return currentPath === localizedPath || currentPath.startsWith(localizedPath + '/');
};

// Close mobile menu on route change
watch(() => route.path, () => {
  isMobileMenuOpen.value = false;
});

onMounted(() => {
  initTheme();
});
</script>
