<template>
  <div class="max-w-2xl mx-auto">
    <Transition name="fade-slide" mode="out-in">
      <!-- Character List -->
      <div v-if="!showAddForm" key="character-list" class="space-y-4">
        <TransitionGroup name="list" tag="div" class="space-y-3">
          <div
            v-for="(character, index) in server.characters"
            :key="character.id"
            :style="{ animationDelay: `${index * 50}ms` }"
            class="group relative bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 hover:bg-gray-800/80 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer animate-fade-in-up"
            @click="$emit('characterSelected', character)"
          >
            <!-- Hover glow -->
            <div
              class="absolute -inset-px bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"
            ></div>

            <div class="relative z-10 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div
                  class="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 group-hover:shadow-emerald-500/30 transition-all duration-300"
                >
                  <span class="text-white font-bold text-xl">
                    {{ character.name.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <div
                    class="font-semibold text-gray-100 text-lg group-hover:text-emerald-300 transition-colors duration-300"
                  >
                    {{ character.name }}
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="px-2.5 py-0.5 bg-gray-700/50 text-gray-300 text-xs font-medium rounded-full border border-gray-600/50"
                    >
                      {{ character.class }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <button
                  @click.stop="showDeleteConfirmation(character)"
                  class="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                  title="Delete character"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                <div
                  class="w-10 h-10 rounded-xl bg-gray-700/50 flex items-center justify-center text-gray-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/20 transition-all duration-300"
                >
                  <svg
                    class="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-300"
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
            </div>
          </div>
        </TransitionGroup>

        <!-- Empty State -->
        <div
          v-if="server.characters.length === 0"
          class="text-center py-12 animate-fade-in"
        >
          <div
            class="w-20 h-20 bg-gray-800/60 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-10 h-10 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <p class="text-gray-400 mb-2">No characters on this server</p>
          <p class="text-gray-500 text-sm">
            Create your first character to start tracking
          </p>
        </div>

        <!-- Add Character Button -->
        <button
          @click="showAddForm = true"
          class="group w-full p-6 border-2 border-dashed border-gray-600/50 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300"
        >
          <div class="flex items-center justify-center gap-4">
            <div
              class="w-12 h-12 border-2 border-gray-600 rounded-xl flex items-center justify-center group-hover:border-emerald-500 group-hover:bg-emerald-500/10 transition-all duration-300"
            >
              <svg
                class="w-6 h-6 text-gray-500 group-hover:text-emerald-400 transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <span
              class="font-medium text-gray-400 group-hover:text-emerald-300 transition-colors duration-300"
            >
              Add New Character
            </span>
          </div>
        </button>
      </div>

      <!-- Add Character Form -->
      <div
        v-else
        key="add-form"
        class="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 animate-fade-in-up"
      >
        <div class="flex items-center gap-4 mb-6">
          <div
            class="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center border border-emerald-500/20"
          >
            <svg
              class="w-6 h-6 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-100">Add New Character</h3>
            <p class="text-sm text-gray-400">
              Create a character on {{ server.name }}
            </p>
          </div>
        </div>

        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Character Name
            </label>
            <input
              v-model="characterName"
              type="text"
              placeholder="Enter character name"
              class="w-full px-5 py-4 border border-gray-600/50 rounded-xl bg-gray-900/50 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
              autofocus
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Class
            </label>
            <div class="relative">
              <select
                v-model="characterClass"
                class="w-full px-5 py-4 border border-gray-600/50 rounded-xl bg-gray-900/50 text-gray-100 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 appearance-none cursor-pointer"
              >
                <option value="" disabled>Select a class</option>
                <option
                  v-for="className in characterClasses"
                  :key="className"
                  :value="className"
                >
                  {{ className }}
                </option>
              </select>
              <div
                class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                <svg
                  class="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- Class Preview -->
          <Transition name="fade">
            <div
              v-if="characterClass"
              class="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
            >
              <div
                class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center"
              >
                <span class="text-white font-bold">
                  {{ characterClass.charAt(0) }}
                </span>
              </div>
              <div>
                <div class="text-emerald-300 font-medium">
                  {{ characterClass }}
                </div>
                <div class="text-emerald-400/60 text-sm">Class selected</div>
              </div>
            </div>
          </Transition>

          <div class="flex gap-3 pt-2">
            <button
              @click="handleAddCharacter"
              :disabled="!characterName.trim() || !characterClass"
              class="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Add Character
            </button>
            <button
              @click="cancelAdd"
              class="px-6 py-3.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-medium rounded-xl border border-gray-600/50 hover:border-gray-500 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Transition>

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

const cancelAdd = () => {
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

<style scoped>
/* Animations */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out forwards;
}

.animate-fade-in-up {
  animation: fade-in-up 0.4s ease-out forwards;
}

/* Transition animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* List transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.4s ease;
}
</style>