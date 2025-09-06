<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
  >
    <div class="max-w-7xl mx-auto px-8 py-12">
      <!-- Header -->
      <div class="mb-12">
        <div class="flex items-center gap-6 mb-6">
          <NuxtLink
            to="/"
            class="group flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-all duration-200 text-lg"
          >
            <svg
              class="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200"
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
            Back to Home
          </NuxtLink>
        </div>

        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <svg
              class="w-6 h-6 text-white"
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
            <h1
              class="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent"
            >
              Archimonstres
            </h1>
            <p class="text-gray-400 text-lg mt-1">
              Track your monster hunting progress
            </p>
          </div>
        </div>
      </div>

      <!-- Breadcrumb Navigation -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-sm">
          <span
            class="px-3 py-1 bg-gray-800/50 text-gray-300 rounded-full border border-gray-700/50"
          >
            {{ currentServer ? "✓" : "1" }} Server Selection
          </span>
          <svg
            class="w-4 h-4 text-gray-600"
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
              'px-3 py-1 rounded-full border',
              currentCharacter
                ? 'bg-gray-800/50 text-gray-300 border-gray-700/50'
                : currentServer
                ? 'bg-orange-500/10 text-orange-300 border-orange-500/30'
                : 'bg-gray-700/30 text-gray-500 border-gray-600/30',
            ]"
          >
            {{ currentCharacter ? "✓" : currentServer ? "2" : "2" }} Character
            Selection
          </span>
          <svg
            class="w-4 h-4 text-gray-600"
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
              'px-3 py-1 rounded-full border',
              currentCharacter
                ? 'bg-orange-500/10 text-orange-300 border-orange-500/30'
                : 'bg-gray-700/30 text-gray-500 border-gray-600/30',
            ]"
          >
            {{ currentCharacter ? "3" : "3" }} Monster Tracking
          </span>
        </div>
      </div>

      <!-- Content Container -->
      <div class="relative">
        <!-- Server Selection -->
        <Transition name="fade-slide" mode="out-in">
          <div v-if="!currentServer" key="server-selection">
            <div
              class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl"
            >
              <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gray-100 mb-3">
                  Choose Your Server
                </h2>
                <p class="text-gray-400 text-lg">
                  Select a server to begin tracking your archimonstres progress
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
              class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl"
            >
              <div class="flex items-center justify-between mb-8">
                <div>
                  <h2 class="text-3xl font-bold text-gray-100 mb-2">
                    Choose Your Character
                  </h2>
                  <p class="text-gray-400 text-lg">
                    Server:
                    <span class="text-orange-400 font-semibold">{{
                      currentServer.name
                    }}</span>
                  </p>
                </div>
                <button
                  @click="currentServer = null"
                  class="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-orange-400 transition-colors duration-200"
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
                  Change Server
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
              class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
            >
              <!-- Header with character info -->
              <div
                class="bg-gradient-to-r from-orange-500/10 to-red-600/10 border-b border-gray-700/50 p-6"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center"
                    >
                      <span class="text-white font-bold text-lg">{{
                        currentCharacter.name.charAt(0).toUpperCase()
                      }}</span>
                    </div>
                    <div>
                      <h2 class="text-2xl font-bold text-gray-100">
                        {{ currentCharacter.name }}
                      </h2>
                      <p class="text-gray-300">
                        {{ currentCharacter.class }} • {{ currentServer.name }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      @click="currentCharacter = null"
                      class="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-blue-400 transition-colors duration-200"
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
                      Change Character
                    </button>
                    <button
                      @click="currentServer = null"
                      class="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-orange-400 transition-colors duration-200"
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
                      Change Server
                    </button>
                  </div>
                </div>

                <!-- Loading indicator -->
                <div
                  v-if="isLoadingCharacter || isLoadingMonsters"
                  class="mt-4"
                >
                  <div class="flex items-center gap-3 text-blue-400">
                    <div
                      class="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
                    ></div>
                    <span>{{
                      isLoadingMonsters
                        ? "Loading monsters data..."
                        : "Loading character data..."
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
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

.backdrop-blur-sm {
  backdrop-filter: blur(4px);
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
</style>
