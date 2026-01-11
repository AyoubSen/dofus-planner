<template>
  <div
    class="min-h-full relative overflow-hidden"
    :style="{ background: 'var(--theme-gradient-bg)' }"
  >
    <!-- Animated Background Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"
      ></div>
      <div
        class="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow"
      ></div>
      <div
        class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"
      ></div>
      <div
        class="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-4000"
      ></div>
    </div>

    <!-- Hero Section -->
    <div class="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-16">
      <div class="text-center mb-20">
        <div class="inline-flex items-center gap-4 mb-8 animate-fade-in-down">
          <div
            class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 animate-float"
          >
            <svg
              class="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"
              />
            </svg>
          </div>
          <h1
            class="text-7xl font-black bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
          >
            {{ $t('home.title') }}
          </h1>
        </div>

        <p
          class="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed animate-fade-in opacity-0 animation-delay-300"
        >
          <i18n-t keypath="home.subtitle" tag="span">
            <template #highlight>
              <span class="text-orange-400 font-semibold">{{
                $t('home.worldOfTwelve')
              }}</span>
            </template>
          </i18n-t>
        </p>

        <div
          class="mt-8 flex items-center justify-center gap-2 text-gray-500 animate-fade-in opacity-0 animation-delay-500"
        >
          <span class="text-sm">{{ $t('home.exploreTools') }}</span>
          <svg
            class="w-4 h-4 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>

      <!-- Feature Cards Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-8xl mx-auto">
        <!-- Archimonstres Card -->
        <NuxtLink
          :to="localePath('/archimonstres')"
          class="group relative overflow-hidden bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-3xl p-6 hover:border-orange-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20 animate-fade-in-up opacity-0 animation-delay-100"
        >
          <div
            class="absolute -inset-px bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500"
          ></div>
          <div
            class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
          ></div>

          <div class="relative z-10">
            <div class="flex items-start justify-between mb-5">
              <div
                class="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-orange-500/25"
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
              <div
                class="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-500 group-hover:text-orange-400 group-hover:bg-orange-500/20 transition-all duration-300"
              >
                <svg
                  class="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            <h2
              class="text-2xl font-bold text-gray-100 mb-3 group-hover:text-orange-400 transition-colors duration-300"
            >
              {{ $t('home.cards.archimonstres.title') }}
            </h2>
            <p class="text-gray-400 text-sm mb-5 leading-relaxed line-clamp-2">
              {{ $t('home.cards.archimonstres.description') }}
            </p>

            <div class="flex flex-wrap gap-1.5 mb-4">
              <span
                class="px-2.5 py-1 bg-orange-500/10 text-orange-300 text-xs font-medium rounded-full border border-orange-500/20"
              >
                {{ $t('home.cards.archimonstres.tags[0]') }}
              </span>
              <span
                class="px-2.5 py-1 bg-green-500/10 text-green-300 text-xs font-medium rounded-full border border-green-500/20"
              >
                {{ $t('home.cards.archimonstres.tags[1]') }}
              </span>
            </div>

            <div class="h-1 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                class="h-full w-0 group-hover:w-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-700 ease-out"
              ></div>
            </div>
          </div>
        </NuxtLink>

        <!-- Items Card -->
        <NuxtLink
          :to="localePath('/items')"
          class="group relative overflow-hidden bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-3xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 animate-fade-in-up opacity-0 animation-delay-200"
        >
          <div
            class="absolute -inset-px bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500"
          ></div>
          <div
            class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
          ></div>

          <div class="relative z-10">
            <div class="flex items-start justify-between mb-5">
              <div
                class="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-blue-500/25"
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div
                class="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-500 group-hover:text-blue-400 group-hover:bg-blue-500/20 transition-all duration-300"
              >
                <svg
                  class="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            <h2
              class="text-2xl font-bold text-gray-100 mb-3 group-hover:text-blue-400 transition-colors duration-300"
            >
              {{ $t('home.cards.items.title') }}
            </h2>
            <p class="text-gray-400 text-sm mb-5 leading-relaxed line-clamp-2">
              {{ $t('home.cards.items.description') }}
            </p>

            <div class="flex flex-wrap gap-1.5 mb-4">
              <span
                class="px-2.5 py-1 bg-blue-500/10 text-blue-300 text-xs font-medium rounded-full border border-blue-500/20"
              >
                {{ $t('home.cards.items.tags[0]') }}
              </span>
              <span
                class="px-2.5 py-1 bg-purple-500/10 text-purple-300 text-xs font-medium rounded-full border border-purple-500/20"
              >
                {{ $t('home.cards.items.tags[1]') }}
              </span>
            </div>

            <div class="h-1 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                class="h-full w-0 group-hover:w-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out"
              ></div>
            </div>
          </div>
        </NuxtLink>

        <!-- Crafting Card -->
        <NuxtLink
         :to="localePath('/crafting')"
          class="group relative overflow-hidden bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-3xl p-6 hover:border-emerald-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 animate-fade-in-up opacity-0 animation-delay-300"
        >
          <div
            class="absolute -inset-px bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500"
          ></div>
          <div
            class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
          ></div>

          <div class="relative z-10">
            <div class="flex items-start justify-between mb-5">
              <div
                class="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-emerald-500/25"
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
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </div>
              <div
                class="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/20 transition-all duration-300"
              >
                <svg
                  class="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            <h2
              class="text-2xl font-bold text-gray-100 mb-3 group-hover:text-emerald-400 transition-colors duration-300"
            >
              {{ $t('home.cards.crafting.title') }}
            </h2>
            <p class="text-gray-400 text-sm mb-5 leading-relaxed line-clamp-2">
              {{ $t('home.cards.crafting.description') }}
            </p>

            <div class="flex flex-wrap gap-1.5 mb-4">
              <span
                class="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-medium rounded-full border border-emerald-500/20"
              >
                {{ $t('home.cards.crafting.tags[0]') }}
              </span>
              <span
                class="px-2.5 py-1 bg-teal-500/10 text-teal-300 text-xs font-medium rounded-full border border-teal-500/20"
              >
                {{ $t('home.cards.crafting.tags[1]') }}
              </span>
            </div>

            <div class="h-1 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                class="h-full w-0 group-hover:w-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 ease-out"
              ></div>
            </div>
          </div>
        </NuxtLink>

        <!-- Succès Card -->
        <NuxtLink
          :to="localePath('/succes')"
          class="group relative overflow-hidden bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-3xl p-6 hover:border-yellow-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/20 animate-fade-in-up opacity-0 animation-delay-400"
        >
          <div
            class="absolute -inset-px bg-gradient-to-r from-yellow-500 to-orange-600 rounded-3xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500"
          ></div>
          <div
            class="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
          ></div>

          <div class="relative z-10">
            <div class="flex items-start justify-between mb-5">
              <div
                class="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-yellow-500/25"
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
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <div
                class="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-500 group-hover:text-yellow-400 group-hover:bg-yellow-500/20 transition-all duration-300"
              >
                <svg
                  class="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            <h2
              class="text-2xl font-bold text-gray-100 mb-3 group-hover:text-yellow-400 transition-colors duration-300"
            >
              {{ $t('home.cards.succes.title') }}
            </h2>
            <p class="text-gray-400 text-sm mb-5 leading-relaxed line-clamp-2">
              {{ $t('home.cards.succes.description') }}
            </p>

            <div class="flex flex-wrap gap-1.5 mb-4">
              <span
                class="px-2.5 py-1 bg-yellow-500/10 text-yellow-300 text-xs font-medium rounded-full border border-yellow-500/20"
              >
                {{ $t('home.cards.succes.tags[0]') }}
              </span>
              <span
                class="px-2.5 py-1 bg-orange-500/10 text-orange-300 text-xs font-medium rounded-full border border-orange-500/20"
              >
                {{ $t('home.cards.succes.tags[1]') }}
              </span>
            </div>

            <div class="h-1 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                class="h-full w-0 group-hover:w-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-700 ease-out"
              ></div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Stats Section -->
      <div
        class="mt-24 relative animate-fade-in opacity-0 animation-delay-600"
      >
        <div
          class="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/50 to-transparent rounded-3xl"
        ></div>

        <div
          class="relative grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto py-12 px-8"
        >
          <div class="text-center group">
            <div
              class="text-4xl font-black bg-gradient-to-b from-orange-400 to-orange-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300"
            >
              286
            </div>
            <div class="text-gray-500 text-sm font-medium tracking-wide">
              {{ $t('home.stats.archimonstres') }}
            </div>
          </div>
          <div class="text-center group">
            <div
              class="text-4xl font-black bg-gradient-to-b from-blue-400 to-blue-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300"
            >
              1000+
            </div>
            <div class="text-gray-500 text-sm font-medium tracking-wide">
              {{ $t('home.stats.itemsTracked') }}
            </div>
          </div>
          <div class="text-center group">
            <div
              class="text-4xl font-black bg-gradient-to-b from-emerald-400 to-emerald-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300"
            >
              100%
            </div>
            <div class="text-gray-500 text-sm font-medium tracking-wide">
              {{ $t('home.stats.localStorage') }}
            </div>
          </div>
          <div class="text-center group">
            <div
              class="text-4xl font-black bg-gradient-to-b from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300"
            >
              24/7
            </div>
            <div class="text-gray-500 text-sm font-medium tracking-wide">
              {{ $t('home.stats.available') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer
        class="mt-24 pb-8 text-center animate-fade-in opacity-0 animation-delay-700"
      >
        <div class="flex items-center justify-center gap-2 text-gray-600 mb-4">
          <div
            class="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center"
          >
            <svg
              class="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"
              />
            </svg>
          </div>
          <span class="font-semibold text-gray-400">{{ $t('home.title') }}</span>
        </div>
        <p class="text-gray-600 text-sm">
          <i18n-t keypath="home.footer.madeWith" tag="span">
            <template #heart>
              <span class="text-red-500">♥</span>
            </template>
          </i18n-t>
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup>
const { t } = useI18n();
const localePath = useLocalePath();

useHead({
  title: t('meta.title'),
  meta: [
    {
      name: 'description',
      content: t('meta.description'),
    },
  ],
});
</script>

<style scoped>
.backdrop-blur-md {
  backdrop-filter: blur(12px);
}

.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

/* Animations */
@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes gradient {
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

@keyframes pulse-slow {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.animate-fade-in-down {
  animation: fade-in-down 0.6s ease-out forwards;
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out forwards;
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-gradient {
  animation: gradient 3s ease infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 6s ease-in-out infinite;
}

/* Animation delays */
.animation-delay-100 {
  animation-delay: 100ms;
}
.animation-delay-200 {
  animation-delay: 200ms;
}
.animation-delay-300 {
  animation-delay: 300ms;
}
.animation-delay-400 {
  animation-delay: 400ms;
}
.animation-delay-500 {
  animation-delay: 500ms;
}
.animation-delay-600 {
  animation-delay: 600ms;
}
.animation-delay-700 {
  animation-delay: 700ms;
}
.animation-delay-2000 {
  animation-delay: 2000ms;
}
.animation-delay-4000 {
  animation-delay: 4000ms;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>