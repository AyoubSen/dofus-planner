<!-- components/AchievementCharacterSelector.vue -->
<template>
  <div>
    <!-- Existing Characters -->
    <div
      v-if="server.characters && server.characters.length > 0"
      class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
    >
      <button
        v-for="character in server.characters"
        :key="character.id"
        class="group relative bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-yellow-500/20 hover:to-orange-500/20 border border-gray-600/50 hover:border-yellow-500/50 rounded-xl p-6 transition-all duration-300 text-left"
        @click="$emit('character-selected', character)"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
          >
            <span class="text-white font-bold text-lg">{{
              character.name.charAt(0).toUpperCase()
            }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3
              class="font-semibold text-gray-100 group-hover:text-yellow-400 transition-colors truncate"
            >
              {{ character.name }}
            </h3>
            <p class="text-sm text-gray-400">
              {{ character.class }}
              <span v-if="character.level" class="text-blue-400"
                >• Lv.{{ character.level }}</span
              >
            </p>
          </div>
        </div>

        <!-- Delete Button -->
        <button
          @click.stop="confirmDelete(character)"
          class="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </button>
    </div>

    <!-- Add Character Form -->
    <div
      class="bg-gray-800/30 border border-gray-700/50 border-dashed rounded-xl p-6"
    >
      <form @submit.prevent="handleAddCharacter" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm text-gray-400 mb-2"
              >Character Name</label
            >
            <input
              v-model="newCharacter.name"
              type="text"
              placeholder="Enter name..."
              class="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">Class</label>
            <select
              v-model="newCharacter.class"
              class="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-yellow-500/50"
              required
            >
              <option value="" disabled>Select class...</option>
              <option v-for="c in classes" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">Level</label>
            <input
              v-model.number="newCharacter.level"
              type="number"
              min="1"
              max="200"
              placeholder="200"
              class="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50"
            />
          </div>
        </div>
        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="!newCharacter.name.trim() || !newCharacter.class"
            class="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-gray-900 transition-all duration-200"
          >
            Add Character
          </button>
        </div>
      </form>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="characterToDelete"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="characterToDelete = null"
      >
        <div
          class="bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/50 rounded-2xl max-w-md w-full p-6"
        >
          <div class="text-center">
            <div
              class="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-100 mb-2">
              Delete Character?
            </h3>
            <p class="text-gray-400 mb-2">
              Are you sure you want to delete
              <span class="text-yellow-400 font-semibold">{{
                characterToDelete.name
              }}</span
              >?
            </p>
            <p class="text-sm text-red-400 mb-6">
              All achievement progress data will be lost.
            </p>
            <div class="flex gap-3">
              <button
                @click="characterToDelete = null"
                class="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-lg text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="handleDelete"
                class="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
defineProps({
  server: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits([
  "character-selected",
  "character-added",
  "character-deleted",
]);

const classes = [
  "Cra",
  "Ecaflip",
  "Eliotrope",
  "Eniripsa",
  "Enutrof",
  "Feca",
  "Forgelance",
  "Huppermage",
  "Iop",
  "Osamodas",
  "Ouginak",
  "Pandawa",
  "Roublard",
  "Sacrieur",
  "Sadida",
  "Sram",
  "Steamer",
  "Xelor",
  "Zobal",
];

const newCharacter = ref({
  name: "",
  class: "",
  level: 200,
});

const characterToDelete = ref(null);

const handleAddCharacter = () => {
  if (newCharacter.value.name.trim() && newCharacter.value.class) {
    emit("character-added", {
      name: newCharacter.value.name.trim(),
      class: newCharacter.value.class,
      level: newCharacter.value.level || 200,
    });
    newCharacter.value = { name: "", class: "", level: 200 };
  }
};

const confirmDelete = (character) => {
  characterToDelete.value = character;
};

const handleDelete = () => {
  if (characterToDelete.value) {
    emit("character-deleted", characterToDelete.value.id);
    characterToDelete.value = null;
  }
};
</script>