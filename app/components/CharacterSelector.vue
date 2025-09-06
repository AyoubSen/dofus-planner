<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-3xl font-bold text-gray-100 mb-2">
          Characters on {{ server.name }}
        </h2>
        <p class="text-gray-400">Select a character to start tracking</p>
      </div>
      <button
        @click="$emit('backToServers')"
        class="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-blue-400 transition-colors"
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
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          ></path>
        </svg>
        Change Server
      </button>
    </div>

    <div v-if="!showAddForm" class="space-y-4">
      <div v-if="server.characters.length > 0" class="space-y-3">
        <div
          v-for="character in server.characters"
          :key="character.id"
          class="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:bg-gray-750 hover:border-gray-600 transition-all duration-200 cursor-pointer group"
          @click="$emit('characterSelected', character)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  ></path>
                </svg>
              </div>
              <div>
                <div class="font-semibold text-gray-100 text-lg">
                  {{ character.name }}
                </div>
                <div class="text-sm text-gray-400">{{ character.class }}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div
                class="text-gray-500 group-hover:text-green-400 transition-colors"
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
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </div>
              <button
                @click.stop="$emit('characterDeleted', character.id)"
                class="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                title="Delete character"
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
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        @click="showAddForm = true"
        class="w-full p-6 border-2 border-dashed border-gray-600 rounded-xl hover:border-gray-500 hover:bg-gray-800 transition-all duration-200 text-gray-400 hover:text-gray-300 group"
      >
        <div class="flex items-center justify-center gap-3">
          <div
            class="w-8 h-8 border-2 border-gray-500 rounded-full flex items-center justify-center group-hover:border-gray-400 transition-colors"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
          </div>
          <span class="font-medium">Add New Character</span>
        </div>
      </button>
    </div>

    <div v-else class="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 class="text-lg font-semibold text-gray-100 mb-4">
        Add New Character
      </h3>
      <div class="space-y-4">
        <input
          v-model="characterName"
          type="text"
          placeholder="Character name"
          class="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          v-model="characterClass"
          class="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select class</option>
          <option
            v-for="className in characterClasses"
            :key="className"
            :value="className"
          >
            {{ className }}
          </option>
        </select>
        <div class="flex gap-3">
          <button
            @click="handleAddCharacter"
            :disabled="!characterName || !characterClass"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Character
          </button>
          <button
            @click="showAddForm = false"
            class="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      :show="confirmationModal.show"
      :title="confirmationModal.title"
      :message="confirmationModal.message"
      :confirm-text="confirmationModal.confirmText"
      @confirm="handleDeleteConfirmation"
      @cancel="hideDeleteConfirmation"
    />
  </div>
</template>

<script setup>
defineProps({
  server: {
    type: Object,
    required: true,
  },
});

const $emit = defineEmits([
  "characterSelected",
  "characterAdded",
  "characterDeleted",
  "backToServers",
]);

const showAddForm = ref(false);
const characterName = ref("");
const characterClass = ref("");

const confirmationModal = ref({
  show: false,
  title: "",
  message: "",
  confirmText: "",
  characterId: null,
});

const characterClasses = [
  "Iop",
  "Cra",
  "Enutrof",
  "Sram",
  "Xelor",
  "Sacrieur",
  "Sadida",
  "Osamodas",
  "Eniripsa",
  "Feca",
  "Ecaflip",
  "Pandawa",
  "Roublard",
  "Zobal",
  "Steamer",
  "Eliotrope",
  "Huppermage",
  "Ouginak",
  "Forgelance",
  "Croum",
];

const handleAddCharacter = () => {
  if (!characterName.value.trim() || !characterClass.value) return;

  $emit("characterAdded", {
    name: characterName.value,
    class: characterClass.value,
  });

  characterName.value = "";
  characterClass.value = "";
  showAddForm.value = false;
};

const showDeleteConfirmation = (character) => {
  confirmationModal.value = {
    show: true,
    title: "Delete Character",
    message: `Are you sure you want to delete "${character.name}" (${character.class})?`,
    confirmText: "Delete",
    characterId: character.id,
  };
};

const handleDeleteConfirmation = () => {
  $emit("characterDeleted", confirmationModal.value.characterId);
  hideDeleteConfirmation();
};

const hideDeleteConfirmation = () => {
  confirmationModal.value.show = false;
};
</script>
