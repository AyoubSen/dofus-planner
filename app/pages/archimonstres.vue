<template>
  <div class="max-w-7xl mx-auto p-8">
    <div class="flex items-center gap-4 mb-8">
      <NuxtLink
        to="/"
        class="text-blue-400 hover:text-blue-300 transition-colors"
      >
        ← Back to Home
      </NuxtLink>
      <h1 class="text-4xl font-bold text-gray-100">Archimonstres</h1>
    </div>

    <!-- Server Selection -->
    <ServerSelector
      v-if="!currentServer"
      :servers="servers"
      @server-selected="selectServer"
      @server-added="addServer"
      @server-deleted="deleteServer"
    />

    <!-- Character Selection -->
    <CharacterSelector
      v-else-if="!currentCharacter"
      :server="currentServer"
      @character-selected="selectCharacter"
      @character-added="addCharacter"
      @character-deleted="deleteCharacter"
      @back-to-servers="currentServer = null"
    />

    <!-- Main Tracker Interface -->
    <TrackerInterface
      v-else
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
