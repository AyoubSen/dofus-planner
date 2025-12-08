<template>
  <div class="min-h-screen bg-[#1a1410] relative">
    <!-- Parchment texture overlay -->
    <div
      class="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]"
    ></div>

    <!-- Decorative top border -->
    <div
      class="h-2 bg-gradient-to-r from-transparent via-amber-600 to-transparent"
    ></div>

    <div class="relative z-10 max-w-6xl mx-auto px-8 py-12">
      <!-- Header -->
      <div class="mb-12">
        <div class="flex items-center gap-6 mb-6">
          <NuxtLink
            to="/"
            class="group flex items-center gap-2 text-amber-600/70 hover:text-amber-400 transition-all duration-200 font-serif text-sm"
          >
            <svg
              class="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Return to the Hall
          </NuxtLink>
        </div>

        <!-- Ornate title frame -->
        <div class="inline-block relative">
          <div
            class="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-amber-600"
          ></div>
          <div
            class="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-amber-600"
          ></div>
          <div
            class="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-amber-600"
          ></div>
          <div
            class="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-amber-600"
          ></div>

          <div class="px-8 py-4 flex items-center gap-4">
            <div
              class="w-14 h-14 bg-gradient-to-b from-orange-500 to-orange-700 rounded-full flex items-center justify-center shadow-xl border-4 border-orange-400/30"
            >
              <svg
                class="w-7 h-7 text-orange-100"
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
            <div>
              <h1 class="text-4xl font-serif font-bold text-amber-100 tracking-wide">
                Archimonstres
              </h1>
              <div class="flex items-center gap-3 mt-1">
                <div
                  class="h-[1px] w-12 bg-gradient-to-r from-transparent to-amber-600"
                ></div>
                <p class="text-amber-600/70 font-serif text-sm italic">
                  The Hunter's Chronicle
                </p>
                <div
                  class="h-[1px] w-12 bg-gradient-to-l from-transparent to-amber-600"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Breadcrumb Navigation -->
      <div class="mb-8">
        <div class="flex items-center gap-3 text-sm font-serif">
          <span
            :class="[
              'px-4 py-2 border rounded-sm',
              currentServer
                ? 'bg-amber-900/20 text-amber-400 border-amber-600/50'
                : 'bg-amber-900/30 text-amber-300 border-amber-500/50 animate-pulse',
            ]"
          >
            {{ currentServer ? "✓" : "I" }} Choose Thy Realm
          </span>
          <span class="text-amber-700">⟫</span>
          <span
            :class="[
              'px-4 py-2 border rounded-sm',
              currentCharacter
                ? 'bg-orange-900/20 text-orange-400 border-orange-600/50'
                : currentServer
                  ? 'bg-orange-900/30 text-orange-300 border-orange-500/50 animate-pulse'
                  : 'bg-stone-900/30 text-amber-700/50 border-amber-800/30',
            ]"
          >
            {{ currentCharacter ? "✓" : "II" }} Select Champion
          </span>
          <span class="text-amber-700">⟫</span>
          <span
            :class="[
              'px-4 py-2 border rounded-sm',
              currentCharacter
                ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500/50 animate-pulse'
                : 'bg-stone-900/30 text-amber-700/50 border-amber-800/30',
            ]"
          >
            III · Track the Beasts
          </span>
        </div>
      </div>

      <!-- Content Container -->
      <div class="relative">
        <!-- Server Selection -->
        <Transition name="fade-slide" mode="out-in">
          <div v-if="!currentServer" key="server-selection">
            <div
              class="relative bg-gradient-to-b from-amber-950/30 to-stone-950/50 border border-amber-800/30 rounded-sm p-8"
            >
              <!-- Corner decorations -->
              <div
                class="absolute top-2 left-2 w-5 h-5 border-t border-l border-amber-700/50"
              ></div>
              <div
                class="absolute top-2 right-2 w-5 h-5 border-t border-r border-amber-700/50"
              ></div>
              <div
                class="absolute bottom-2 left-2 w-5 h-5 border-b border-l border-amber-700/50"
              ></div>
              <div
                class="absolute bottom-2 right-2 w-5 h-5 border-b border-r border-amber-700/50"
              ></div>

              <div class="text-center mb-8">
                <h2
                  class="text-3xl font-serif font-bold text-amber-100 mb-3 tracking-wide"
                >
                  Choose Thy Realm
                </h2>
                <div class="flex items-center justify-center gap-4 mb-4">
                  <div
                    class="h-[1px] w-16 bg-gradient-to-r from-transparent to-amber-600"
                  ></div>
                  <span class="text-amber-600">✦</span>
                  <div
                    class="h-[1px] w-16 bg-gradient-to-l from-transparent to-amber-600"
                  ></div>
                </div>
                <p class="text-amber-200/60 font-serif italic">
                  Select a server to begin thy hunt for glory
                </p>
              </div>

              <ServerSelector
                :servers="servers"
                @server-selected="selectServer"
                @server-added="addServer"
                @server-deleted="deleteServer"
              />
            </div>
          </div>

          <!-- Character Selection -->
          <div v-else-if="!currentCharacter" key="character-selection">
            <div
              class="relative bg-gradient-to-b from-orange-950/30 to-stone-950/50 border border-orange-800/30 rounded-sm p-8"
            >
              <div
                class="absolute top-2 left-2 w-5 h-5 border-t border-l border-orange-700/50"
              ></div>
              <div
                class="absolute top-2 right-2 w-5 h-5 border-t border-r border-orange-700/50"
              ></div>
              <div
                class="absolute bottom-2 left-2 w-5 h-5 border-b border-l border-orange-700/50"
              ></div>
              <div
                class="absolute bottom-2 right-2 w-5 h-5 border-b border-r border-orange-700/50"
              ></div>

              <div class="flex items-center justify-between mb-8">
                <div>
                  <h2
                    class="text-3xl font-serif font-bold text-amber-100 mb-2 tracking-wide"
                  >
                    Select Thy Champion
                  </h2>
                  <p class="text-amber-200/60 font-serif">
                    Realm:
                    <span class="text-orange-400 font-semibold">{{
                      currentServer.name
                    }}</span>
                  </p>
                </div>
                <button
                  @click="currentServer = null"
                  class="flex items-center gap-2 px-4 py-2 text-amber-600/70 hover:text-amber-400 transition-colors duration-200 font-serif text-sm border border-amber-800/30 hover:border-amber-600/50 rounded-sm"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Change Realm
                </button>
              </div>

              <CharacterSelector
                :server="currentServer"
                @character-selected="selectCharacter"
                @character-added="addCharacter"
                @character-deleted="deleteCharacter"
                @back-to-servers="currentServer = null"
              />
            </div>
          </div>

          <!-- Main Tracker Interface -->
          <div v-else key="tracker-interface">
            <div
              class="relative bg-gradient-to-b from-emerald-950/20 to-stone-950/50 border border-emerald-800/30 rounded-sm overflow-hidden"
            >
              <div
                class="absolute top-2 left-2 w-5 h-5 border-t border-l border-emerald-700/50"
              ></div>
              <div
                class="absolute top-2 right-2 w-5 h-5 border-t border-r border-emerald-700/50"
              ></div>

              <!-- Header with character info -->
              <div
                class="bg-gradient-to-r from-emerald-900/20 to-orange-900/20 border-b border-amber-800/30 p-6"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-16 h-16 bg-gradient-to-b from-emerald-600 to-emerald-800 rounded-full flex items-center justify-center shadow-xl border-4 border-emerald-500/30"
                    >
                      <span class="text-emerald-100 font-serif font-bold text-2xl">{{
                        currentCharacter.name.charAt(0).toUpperCase()
                      }}</span>
                    </div>
                    <div>
                      <h2
                        class="text-2xl font-serif font-bold text-amber-100 tracking-wide"
                      >
                        {{ currentCharacter.name }}
                      </h2>
                      <p class="text-amber-200/60 font-serif">
                        <span class="text-orange-400">{{
                          currentCharacter.class
                        }}</span>
                        ·
                        <span class="text-emerald-400">{{
                          currentServer.name
                        }}</span>
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      @click="currentCharacter = null"
                      class="flex items-center gap-2 px-4 py-2 text-amber-600/70 hover:text-orange-400 transition-colors duration-200 font-serif text-sm border border-amber-800/30 hover:border-orange-600/50 rounded-sm"
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Change Champion
                    </button>
                    <button
                      @click="currentServer = null"
                      class="flex items-center gap-2 px-4 py-2 text-amber-600/70 hover:text-amber-400 transition-colors duration-200 font-serif text-sm border border-amber-800/30 hover:border-amber-600/50 rounded-sm"
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
                          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Change Realm
                    </button>
                  </div>
                </div>

                <!-- Loading indicator -->
                <div
                  v-if="isLoadingCharacter || isLoadingMonsters"
                  class="mt-4"
                >
                  <div
                    class="flex items-center gap-3 text-amber-400 font-serif text-sm"
                  >
                    <div
                      class="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"
                    ></div>
                    <span class="italic">{{
                      isLoadingMonsters
                        ? "Consulting the ancient scrolls..."
                        : "Summoning thy champion..."
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Tracker content -->
              <div class="p-8">
                <TrackerInterface
                  :server="currentServer"
                  :character="currentCharacter"
                  :monsters-data="monstersData"
                  :is-loading-character="isLoadingCharacter"
                  :is-loading-monsters="isLoadingMonsters"
                  @change-character="currentCharacter = null"
                  @change-server="currentServer = null"
                  @mode-selected="selectMode"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Stats Section -->
      <div
        class="mt-12 relative border border-amber-800/30 bg-stone-950/50 rounded-sm p-8"
      >
        <div
          class="absolute top-2 left-2 w-5 h-5 border-t border-l border-amber-700/50"
        ></div>
        <div
          class="absolute top-2 right-2 w-5 h-5 border-t border-r border-amber-700/50"
        ></div>
        <div
          class="absolute bottom-2 left-2 w-5 h-5 border-b border-l border-amber-700/50"
        ></div>
        <div
          class="absolute bottom-2 right-2 w-5 h-5 border-b border-r border-amber-700/50"
        ></div>

        <div class="grid grid-cols-3 gap-8">
          <div class="text-center">
            <div class="text-3xl font-serif font-bold text-amber-400 mb-1">
              {{ servers.length }}
            </div>
            <div class="text-amber-200/50 text-sm font-serif">Realms</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-serif font-bold text-orange-400 mb-1">
              {{ totalCharacters }}
            </div>
            <div class="text-amber-200/50 text-sm font-serif">Champions</div>
          </div>
          <div class="text-center">
            <div
              class="flex items-center justify-center gap-2 text-3xl font-serif font-bold text-emerald-400 mb-1"
            >
              <span
                class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
              ></span>
              Ready
            </div>
            <div class="text-amber-200/50 text-sm font-serif">Chronicle Status</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom border -->
    <div
      class="h-2 bg-gradient-to-r from-transparent via-amber-600 to-transparent"
    ></div>
    <slot name="theme-switcher" />
  </div>
</template>

<script setup>
const servers = ref([]);
const currentServer = ref(null);
const currentCharacter = ref(null);
const isLoadingCharacter = ref(false);

const monstersData = ref(null);
const isLoadingMonsters = ref(false);

const totalCharacters = computed(() => {
  return servers.value.reduce(
    (total, server) => total + (server.characters?.length || 0),
    0
  );
});

onMounted(() => {
  loadData();
  loadMonstersData();
});

const loadData = () => {
  const savedServers = localStorage.getItem("archimonstres-servers");
  if (savedServers) {
    servers.value = JSON.parse(savedServers);
  }
};

const saveData = () => {
  localStorage.setItem("archimonstres-servers", JSON.stringify(servers.value));
};

const loadMonstersData = () => {
  const savedMonsters = localStorage.getItem("archimonstres-monsters");
  if (savedMonsters) {
    try {
      monstersData.value = JSON.parse(savedMonsters);
    } catch (error) {
      console.error("Failed to parse monsters data from localStorage:", error);
    }
  }
};

const saveMonstersData = (data) => {
  localStorage.setItem("archimonstres-monsters", JSON.stringify(data));
};

const addServer = (serverName) => {
  const newServer = {
    id: Date.now().toString(),
    name: serverName.trim(),
    characters: [],
  };

  servers.value.push(newServer);
  saveData();
  selectServer(newServer);
};

const selectServer = (server) => {
  currentServer.value = server;
  currentCharacter.value = null;
};

const deleteServer = (serverId) => {
  const index = servers.value.findIndex((server) => server.id === serverId);
  if (index !== -1) {
    servers.value.splice(index, 1);
    saveData();

    if (currentServer.value && currentServer.value.id === serverId) {
      currentServer.value = null;
      currentCharacter.value = null;
    }
  }
};

const addCharacter = (characterData) => {
  const newCharacter = {
    id: Date.now().toString(),
    name: characterData.name.trim(),
    class: characterData.class,
  };

  currentServer.value.characters.push(newCharacter);
  saveData();
  selectCharacter(newCharacter);
};

const selectCharacter = async (character) => {
  currentCharacter.value = character;
  isLoadingCharacter.value = true;

  if (!monstersData.value) {
    isLoadingMonsters.value = true;
    try {
      const data = await $fetch("/api/metamob/user");
      monstersData.value = data;
      saveMonstersData(data);
      console.log(
        "Monsters data fetched and saved:",
        data?.length || 0,
        "monsters"
      );
    } catch (error) {
      console.error("Failed to fetch monsters data:", error);
    } finally {
      isLoadingMonsters.value = false;
    }
  } else {
    console.log(
      "Using cached monsters data:",
      monstersData.value?.length || 0,
      "monsters"
    );
  }

  isLoadingCharacter.value = false;
};

const deleteCharacter = (characterId) => {
  const characterIndex = currentServer.value.characters.findIndex(
    (char) => char.id === characterId
  );
  if (characterIndex !== -1) {
    currentServer.value.characters.splice(characterIndex, 1);
    saveData();

    if (currentCharacter.value && currentCharacter.value.id === characterId) {
      currentCharacter.value = null;
      monstersData.value = null;
    }
  }
};

const selectMode = (selectedMode) => {};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap");

.font-serif {
  font-family: "Cinzel", serif;
}

/* Transition animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Loading spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>