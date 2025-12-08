<template>
  <div class="min-h-screen bg-black relative overflow-hidden">
    <!-- Animated background grid -->
    <div
      class="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"
    ></div>

    <!-- Glowing orbs -->
    <div
      class="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] animate-pulse"
    ></div>
    <div
      class="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-[128px] animate-pulse"
    ></div>

    <div class="relative z-10 max-w-7xl mx-auto px-8 py-12">
      <!-- Header -->
      <div class="mb-12">
        <div class="flex items-center gap-6 mb-6">
          <NuxtLink
            to="/"
            class="group flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-all duration-200 font-mono text-sm"
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
            &lt; BACK_TO_HOME
          </NuxtLink>
        </div>

        <div class="flex items-center gap-4">
          <div class="w-14 h-14 relative">
            <div
              class="absolute inset-0 bg-cyan-400 rounded-lg blur-md animate-pulse"
            ></div>
            <div
              class="relative w-full h-full bg-black border-2 border-cyan-400 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-7 h-7 text-cyan-400"
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
          </div>
          <div>
            <h1 class="text-5xl font-black tracking-tighter">
              <span
                class="text-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.5)]"
                >ARCHI</span
              >
              <span
                class="text-pink-400 drop-shadow-[0_0_25px_rgba(244,114,182,0.5)]"
                >MONSTRES</span
              >
            </h1>
            <p class="text-gray-500 font-mono text-sm mt-1">
              &gt; HUNT_TRACKING_SYSTEM v2.0
            </p>
          </div>
        </div>
      </div>

      <!-- Breadcrumb Navigation -->
      <div class="mb-8">
        <div class="flex items-center gap-3 text-xs font-mono">
          <span
            :class="[
              'px-3 py-1.5 border clip-corner-sm',
              currentServer
                ? 'bg-cyan-400/10 text-cyan-400 border-cyan-400/50'
                : 'bg-cyan-400/5 text-cyan-400 border-cyan-400/30 animate-pulse',
            ]"
          >
            {{ currentServer ? "[✓]" : "[1]" }} SERVER_SELECT
          </span>
          <svg
            class="w-4 h-4 text-gray-700"
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
          <span
            :class="[
              'px-3 py-1.5 border clip-corner-sm',
              currentCharacter
                ? 'bg-pink-400/10 text-pink-400 border-pink-400/50'
                : currentServer
                  ? 'bg-pink-400/5 text-pink-400 border-pink-400/30 animate-pulse'
                  : 'bg-gray-900 text-gray-600 border-gray-800',
            ]"
          >
            {{ currentCharacter ? "[✓]" : "[2]" }} CHAR_SELECT
          </span>
          <svg
            class="w-4 h-4 text-gray-700"
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
          <span
            :class="[
              'px-3 py-1.5 border clip-corner-sm',
              currentCharacter
                ? 'bg-green-400/5 text-green-400 border-green-400/30 animate-pulse'
                : 'bg-gray-900 text-gray-600 border-gray-800',
            ]"
          >
            [3] MONSTER_TRACK
          </span>
        </div>
      </div>

      <!-- Content Container -->
      <div class="relative">
        <!-- Server Selection -->
        <Transition name="fade-slide" mode="out-in">
          <div v-if="!currentServer" key="server-selection">
            <div
              class="bg-black/80 border border-cyan-500/30 p-8 clip-corner relative"
            >
              <div
                class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              ></div>
              <div
                class="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
              ></div>

              <div class="text-center mb-8">
                <h2
                  class="text-3xl font-black text-cyan-400 mb-3 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                >
                  &gt; SELECT_SERVER
                </h2>
                <p class="text-gray-500 font-mono text-sm">
                  Initialize connection to begin hunt tracking protocol
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
              class="bg-black/80 border border-pink-500/30 p-8 clip-corner relative"
            >
              <div
                class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-pink-400 to-transparent"
              ></div>
              <div
                class="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-pink-400/30 to-transparent"
              ></div>

              <div class="flex items-center justify-between mb-8">
                <div>
                  <h2
                    class="text-3xl font-black text-pink-400 mb-2 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(244,114,182,0.3)]"
                  >
                    &gt; SELECT_CHARACTER
                  </h2>
                  <p class="text-gray-500 font-mono text-sm">
                    Connected to:
                    <span
                      class="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"
                      >{{ currentServer.name }}</span
                    >
                  </p>
                </div>
                <button
                  @click="currentServer = null"
                  class="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-cyan-400 transition-colors duration-200 font-mono text-sm border border-gray-800 hover:border-cyan-400/50"
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
                  CHANGE_SERVER
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
            <div class="bg-black/80 border border-green-500/30 clip-corner relative overflow-hidden">
              <div
                class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-400 to-transparent"
              ></div>

              <!-- Header with character info -->
              <div
                class="bg-gradient-to-r from-green-500/5 to-cyan-500/5 border-b border-gray-800 p-6"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="w-14 h-14 relative">
                      <div
                        class="absolute inset-0 bg-green-400 rounded-lg blur-md opacity-50"
                      ></div>
                      <div
                        class="relative w-full h-full bg-black border-2 border-green-400 rounded-lg flex items-center justify-center"
                      >
                        <span
                          class="text-green-400 font-black text-xl font-mono"
                          >{{
                            currentCharacter.name.charAt(0).toUpperCase()
                          }}</span
                        >
                      </div>
                    </div>
                    <div>
                      <h2
                        class="text-2xl font-black text-green-400 font-mono tracking-tight drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]"
                      >
                        {{ currentCharacter.name }}
                      </h2>
                      <p class="text-gray-500 font-mono text-sm">
                        <span class="text-pink-400">{{
                          currentCharacter.class
                        }}</span>
                        //
                        <span class="text-cyan-400">{{
                          currentServer.name
                        }}</span>
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      @click="currentCharacter = null"
                      class="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-pink-400 transition-colors duration-200 font-mono text-xs border border-gray-800 hover:border-pink-400/50"
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
                      CHANGE_CHAR
                    </button>
                    <button
                      @click="currentServer = null"
                      class="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-cyan-400 transition-colors duration-200 font-mono text-xs border border-gray-800 hover:border-cyan-400/50"
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
                      CHANGE_SERVER
                    </button>
                  </div>
                </div>

                <!-- Loading indicator -->
                <div
                  v-if="isLoadingCharacter || isLoadingMonsters"
                  class="mt-4"
                >
                  <div class="flex items-center gap-3 text-cyan-400 font-mono text-sm">
                    <div
                      class="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"
                    ></div>
                    <span class="animate-pulse">{{
                      isLoadingMonsters
                        ? "LOADING_MONSTERS_DATA..."
                        : "LOADING_CHARACTER_DATA..."
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

      <!-- System Status Footer -->
      <div class="mt-12 border border-gray-800 bg-black/50 p-6">
        <div class="grid grid-cols-3 gap-8">
          <div class="text-center">
            <div
              class="text-2xl font-black text-cyan-400 font-mono mb-1 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            >
              {{ servers.length }}
            </div>
            <div class="text-gray-600 text-xs font-mono uppercase tracking-wider">
              SERVERS
            </div>
          </div>
          <div class="text-center">
            <div
              class="text-2xl font-black text-pink-400 font-mono mb-1 drop-shadow-[0_0_10px_rgba(244,114,182,0.5)]"
            >
              {{ totalCharacters }}
            </div>
            <div class="text-gray-600 text-xs font-mono uppercase tracking-wider">
              CHARACTERS
            </div>
          </div>
          <div class="text-center">
            <div class="flex items-center justify-center gap-2">
              <span
                class="w-2 h-2 bg-green-400 rounded-full animate-pulse"
              ></span>
              <span
                class="text-2xl font-black text-green-400 font-mono drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                >ONLINE</span
              >
            </div>
            <div class="text-gray-600 text-xs font-mono uppercase tracking-wider">
              SYSTEM_STATUS
            </div>
          </div>
        </div>
      </div>
    </div>
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
.clip-corner {
  clip-path: polygon(
    0 0,
    calc(100% - 20px) 0,
    100% 20px,
    100% 100%,
    20px 100%,
    0 calc(100% - 20px)
  );
}

.clip-corner-sm {
  clip-path: polygon(
    0 0,
    calc(100% - 8px) 0,
    100% 8px,
    100% 100%,
    8px 100%,
    0 calc(100% - 8px)
  );
}

/* Transition animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
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