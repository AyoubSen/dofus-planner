<!-- components/GameServerSelector.vue -->
<template>
  <div class="space-y-6">
    <!-- Existing Servers -->
    <div v-if="servers.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <button
        v-for="server in servers"
        :key="server.id"
        @click="$emit('select', server)"
        class="group relative bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-gray-600/50 rounded-xl p-6 hover:border-primary-500/50 transition-all duration-300 hover:shadow-lg text-left"
      >
        <div class="flex items-center justify-between mb-3">
          <div
            class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center"
          >
            <span class="text-white font-bold">{{ server.name.charAt(0).toUpperCase() }}</span>
          </div>
          <button
            @click.stop="confirmDelete(server)"
            class="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-400 transition-all duration-200"
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

        <h3 class="text-lg font-semibold text-gray-100 mb-1">{{ server.name }}</h3>
        <p class="text-sm text-gray-400">
          {{ server.characters.length }} character{{ server.characters.length !== 1 ? 's' : '' }}
        </p>
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
          d="M5 12h14M12 5l7 7-7 7"
        />
      </svg>
      <p class="text-gray-400 mb-2">No servers configured yet</p>
      <p class="text-sm text-gray-500">Add your first server to get started</p>
    </div>

    <!-- Add Server Form -->
    <div class="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
      <h3 class="text-lg font-semibold text-gray-200 mb-4">Add New Server</h3>
      <form @submit.prevent="handleAddServer" class="flex gap-3">
        <input
          v-model="newServerName"
          type="text"
          placeholder="Server name (e.g., Draconiros)"
          class="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <button
          type="submit"
          :disabled="!newServerName.trim()"
          class="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
        >
          Add Server
        </button>
      </form>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="serverToDelete"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="serverToDelete = null"
      >
        <div class="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4">
          <h3 class="text-xl font-bold text-gray-100 mb-4">Delete Server</h3>
          <p class="text-gray-400 mb-6">
            Are you sure you want to delete
            <span class="text-white font-semibold">{{ serverToDelete.name }}</span>? This will also
            delete all {{ serverToDelete.characters.length }} character(s) and their progress.
          </p>
          <div class="flex gap-3">
            <button
              @click="serverToDelete = null"
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
import type { Server } from '~/types/game'

defineProps<{
  servers: Server[]
}>()

const emit = defineEmits<{
  select: [server: Server]
  add: [name: string]
  delete: [serverId: string]
}>()

const newServerName = ref('')
const serverToDelete = ref<Server | null>(null)

const handleAddServer = () => {
  if (newServerName.value.trim()) {
    emit('add', newServerName.value.trim())
    newServerName.value = ''
  }
}

const confirmDelete = (server: Server) => {
  serverToDelete.value = server
}

const handleDelete = () => {
  if (serverToDelete.value) {
    emit('delete', serverToDelete.value.id)
    serverToDelete.value = null
  }
}
</script>

<style scoped>
.from-primary-500 {
  --tw-gradient-from: #f97316;
}
.to-primary-600 {
  --tw-gradient-to: #ea580c;
}
.bg-primary-600 {
  background-color: #ea580c;
}
.bg-primary-700 {
  background-color: #c2410c;
}
.focus\:ring-primary-500:focus {
  --tw-ring-color: #f97316;
}
.hover\:border-primary-500\/50:hover {
  border-color: rgb(249 115 22 / 0.5);
}
</style>