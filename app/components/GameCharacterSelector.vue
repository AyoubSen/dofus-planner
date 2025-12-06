<!-- components/GameCharacterSelector.vue -->
<template>
  <div class="space-y-6">
    <!-- Existing Characters -->
    <div v-if="server.characters.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <button
        v-for="character in server.characters"
        :key="character.id"
        @click="$emit('select', character)"
        class="group relative bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-gray-600/50 rounded-xl p-4 hover:border-primary-500/50 transition-all duration-300 hover:shadow-lg text-left"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 bg-gray-700 rounded-lg border border-gray-600 overflow-hidden"
            >
              <img
                v-if="getClassIcon(character.class)"
                :src="getClassIcon(character.class)"
                :alt="character.class"
                class="w-full h-full object-cover object-top"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-gray-400"
              >
                {{ character.name.charAt(0).toUpperCase() }}
              </div>
            </div>
            <div>
              <h4 class="font-semibold text-gray-100">{{ character.name }}</h4>
              <p class="text-sm text-gray-400">{{ character.class }}</p>
            </div>
          </div>

          <button
            @click.stop="confirmDelete(character)"
            class="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-400 transition-all duration-200"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        <!-- Progress indicators -->
        <div class="flex gap-2 mt-3">
          <span
            v-if="character.archimonstresProgress"
            class="px-2 py-0.5 bg-orange-500/10 text-orange-300 text-xs rounded border border-orange-500/30"
            :title="`${getArchimonstresCount(character)} monsters tracked`"
          >
            🏆 {{ getArchimonstresCount(character) }}
          </span>
          <span
            v-if="character.achievementsProgress"
            class="px-2 py-0.5 bg-yellow-500/10 text-yellow-300 text-xs rounded border border-yellow-500/30"
            :title="`${character.achievementsProgress.completed.length} achievements completed`"
          >
            ⭐ {{ character.achievementsProgress.completed.length }}
          </span>
        </div>
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-12 bg-gray-800/30 border border-gray-700/50 rounded-xl border-dashed"
    >
      <svg
        class="w-12 h-12 mx-auto mb-4 text-gray-600"
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
      <p class="text-gray-400 mb-2">No characters on this server</p>
      <p class="text-sm text-gray-500">Add your first character to start tracking</p>
    </div>

    <!-- Add Character Form -->
    <div class="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
      <h3 class="text-lg font-semibold text-gray-200 mb-4">Add New Character</h3>
      <form @submit.prevent="handleAddCharacter" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            v-model="newCharacter.name"
            type="text"
            placeholder="Character name"
            class="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <select
            v-model="newCharacter.class"
            class="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="" disabled>Select class</option>
            <option v-for="cls in classes" :key="cls" :value="cls">{{ cls }}</option>
          </select>
        </div>
        <button
          type="submit"
          :disabled="!newCharacter.name.trim() || !newCharacter.class"
          class="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
        >
          Add Character
        </button>
      </form>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="characterToDelete"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="characterToDelete = null"
      >
        <div class="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4">
          <h3 class="text-xl font-bold text-gray-100 mb-4">Delete Character</h3>
          <p class="text-gray-400 mb-6">
            Are you sure you want to delete
            <span class="text-white font-semibold">{{ characterToDelete.name }}</span>? All
            progress for this character will be lost.
          </p>
          <div class="flex gap-3">
            <button
              @click="characterToDelete = null"
              class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleDelete"
              class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Server, Character } from '~/types/game'

const props = defineProps<{
  server: Server
}>()

const emit = defineEmits<{
  select: [character: Character]
  add: [data: { name: string; class: string }]
  delete: [characterId: string]
}>()

const classes = [
  'Cra',
  'Ecaflip',
  'Eliotrope',
  'Eniripsa',
  'Enutrof',
  'Feca',
  'Forgelance',
  'Huppermage',
  'Iop',
  'Osamodas',
  'Ouginak',
  'Pandawa',
  'Roublard',
  'Sacrieur',
  'Sadida',
  'Sram',
  'Steamer',
  'Xelor',
  'Zobal',
]

const newCharacter = ref({
  name: '',
  class: '',
})

const characterToDelete = ref<Character | null>(null)

const getClassIcon = (className: string) => {
  return `/${className}.png`
}

const getArchimonstresCount = (character: Character) => {
  if (!character.archimonstresProgress?.monsters) return 0
  return Object.values(character.archimonstresProgress.monsters).filter(m => m.captured).length
}

const handleAddCharacter = () => {
  if (newCharacter.value.name.trim() && newCharacter.value.class) {
    emit('add', {
      name: newCharacter.value.name.trim(),
      class: newCharacter.value.class,
    })
    newCharacter.value = { name: '', class: '' }
  }
}

const confirmDelete = (character: Character) => {
  characterToDelete.value = character
}

const handleDelete = () => {
  if (characterToDelete.value) {
    emit('delete', characterToDelete.value.id)
    characterToDelete.value = null
  }
}
</script>