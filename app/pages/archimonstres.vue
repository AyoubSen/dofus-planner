<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden"
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
        class="absolute bottom-1/3 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"
      ></div>
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-8 py-12">
      <!-- Header -->
      <div class="mb-10 animate-fade-in-down">
        <div class="flex items-center gap-6 mb-8">
          <NuxtLink
            to="/"
            class="group flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-orange-400 bg-gray-800/40 hover:bg-gray-800/60 rounded-xl border border-gray-700/50 hover:border-orange-500/30 transition-all duration-300"
          >
            <svg
              class="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-300"
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
            <span class="text-sm font-medium">Back to Home</span>
          </NuxtLink>
        </div>

        <div class="flex items-center gap-5">
          <div
            class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 animate-float"
          >
            <svg
              class="w-8 h-8 text-white"
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
              class="text-5xl font-black bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
            >
              Archimonstres
            </h1>
            <p class="text-gray-400 text-lg mt-2">
              Track your monster hunting progress across the World of Twelve
            </p>
          </div>
        </div>
      </div>

      <!-- Breadcrumb Navigation -->
      <div class="mb-10 animate-fade-in opacity-0 animation-delay-200">
        <div
          class="inline-flex items-center gap-3 bg-gray-800/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-gray-700/50"
        >
          <div
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300',
              !currentServer
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
            ]"
          >
            <div
              :class="[
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                !currentServer ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white',
              ]"
            >
              <svg
                v-if="currentServer"
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span v-else>1</span>
            </div>
            <span class="text-sm font-medium">Server</span>
          </div>

          <div class="flex items-center">
            <div
              :class="[
                'w-8 h-0.5 rounded-full transition-all duration-500',
                currentServer ? 'bg-emerald-500' : 'bg-gray-600',
              ]"
            ></div>
          </div>

          <div
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300',
              currentCharacter
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : currentServer
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                : 'bg-gray-700/30 text-gray-500 border border-gray-600/30',
            ]"
          >
            <div
              :class="[
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                currentCharacter
                  ? 'bg-emerald-500 text-white'
                  : currentServer
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-600 text-gray-400',
              ]"
            >
              <svg
                v-if="currentCharacter"
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span v-else>2</span>
            </div>
            <span class="text-sm font-medium">Character</span>
          </div>

          <div class="flex items-center">
            <div
              :class="[
                'w-8 h-0.5 rounded-full transition-all duration-500',
                currentCharacter ? 'bg-emerald-500' : 'bg-gray-600',
              ]"
            ></div>
          </div>

          <div
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300',
              currentCharacter
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                : 'bg-gray-700/30 text-gray-500 border border-gray-600/30',
            ]"
          >
            <div
              :class="[
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                currentCharacter
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-600 text-gray-400',
              ]"
            >
              3
            </div>
            <span class="text-sm font-medium">Tracking</span>
          </div>
        </div>
      </div>

      <!-- Content Container -->
      <div class="relative animate-fade-in-up opacity-0 animation-delay-300">
        <!-- Server Selection -->
        <Transition name="fade-slide" mode="out-in">
          <div v-if="!currentServer" key="server-selection">
            <div
              class="group relative bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-3xl p-10 shadow-2xl overflow-hidden"
            >
              <!-- Glow effect -->
              <div
                class="absolute -inset-px bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-3xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500"
              ></div>

              <div class="relative z-10">
                <div class="text-center mb-10">
                  <div
                    class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-3xl mb-6 border border-orange-500/20"
                  >
                    <svg
                      class="w-10 h-10 text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2
                    class="text-3xl font-bold text-gray-100 mb-3"
                  >
                    Choose Your Server
                  </h2>
                  <p class="text-gray-400 text-lg max-w-md mx-auto">
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
          </div>

          <!-- Character Selection -->
          <div v-else-if="!currentCharacter" key="character-selection">
            <div
              class="group relative bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-3xl p-10 shadow-2xl overflow-hidden"
            >
              <div
                class="absolute -inset-px bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-3xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500"
              ></div>

              <div class="relative z-10">
                <div class="flex items-center justify-between mb-10">
                  <div>
                    <div class="flex items-center gap-3 mb-2">
                      <div
                        class="px-3 py-1 bg-orange-500/20 text-orange-300 text-sm font-medium rounded-full border border-orange-500/30"
                      >
                        {{ currentServer.name }}
                      </div>
                    </div>
                    <h2 class="text-3xl font-bold text-gray-100 mb-2">
                      Choose Your Character
                    </h2>
                    <p class="text-gray-400">
                      Select or create a character to track progress
                    </p>
                  </div>
                  <button
                    @click="currentServer = null"
                    class="flex items-center gap-2 px-5 py-2.5 text-gray-400 hover:text-orange-400 bg-gray-800/50 hover:bg-gray-800/80 rounded-xl border border-gray-700/50 hover:border-orange-500/30 transition-all duration-300"
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
                    <span class="text-sm font-medium">Change Server</span>
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
          </div>

          <!-- Main Tracker Interface -->
          <div v-else key="tracker-interface">
            <div
              class="relative bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden"
            >
              <!-- Header with character info -->
              <div
                class="relative bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border-b border-gray-700/50 p-8"
              >
                <!-- Animated background pattern -->
                <div
                  class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_25%,rgba(255,255,255,0.02)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.02)_75%)] bg-[length:20px_20px]"
                ></div>

                <div class="relative z-10 flex items-center justify-between">
                  <div class="flex items-center gap-5">
                    <div
                      class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 ring-4 ring-orange-500/20"
                    >
                      <span class="text-white font-bold text-2xl">{{
                        currentCharacter.name.charAt(0).toUpperCase()
                      }}</span>
                    </div>
                    <div>
                      <div class="flex items-center gap-3 mb-1">
                        <h2 class="text-2xl font-bold text-gray-100">
                          {{ currentCharacter.name }}
                        </h2>
                        <span
                          class="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30"
                        >
                          {{ currentCharacter.class }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2 text-gray-400">
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
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                          />
                        </svg>
                        <span>{{ currentServer.name }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      @click="currentCharacter = null"
                      class="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-blue-400 bg-gray-800/50 hover:bg-gray-800/80 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300"
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
                      <span class="text-sm font-medium">Character</span>
                    </button>
                    <button
                      @click="currentServer = null"
                      class="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-orange-400 bg-gray-800/50 hover:bg-gray-800/80 rounded-xl border border-gray-700/50 hover:border-orange-500/30 transition-all duration-300"
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
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                      <span class="text-sm font-medium">Server</span>
                    </button>
                  </div>
                </div>

                <!-- Loading indicator -->
                <Transition name="fade">
                  <div
                    v-if="isLoadingCharacter || isLoadingMonsters"
                    class="mt-6"
                  >
                    <div
                      class="flex items-center gap-4 bg-blue-500/10 border border-blue-500/30 rounded-xl px-5 py-3"
                    >
                      <div class="relative">
                        <div
                          class="w-5 h-5 border-2 border-blue-400/30 rounded-full"
                        ></div>
                        <div
                          class="absolute inset-0 w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"
                        ></div>
                      </div>
                      <span class="text-blue-300 font-medium">{{
                        isLoadingMonsters
                          ? "Loading monsters data..."
                          : "Loading character data..."
                      }}</span>
                    </div>
                  </div>
                </Transition>
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

.backdrop-blur-md {
  backdrop-filter: blur(12px);
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
    transform: translateY(-8px);
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

@keyframes spin {
  to {
    transform: rotate(360deg);
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

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Animation delays */
.animation-delay-200 {
  animation-delay: 200ms;
}
.animation-delay-300 {
  animation-delay: 300ms;
}
.animation-delay-2000 {
  animation-delay: 2000ms;
}

/* Transition animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>