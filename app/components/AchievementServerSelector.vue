<template>
  <div>
    <!-- Existing Servers -->
    <div v-if="servers.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      <button
        v-for="server in servers"
        :key="server.id"
        class="group relative bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-yellow-500/20 hover:to-orange-500/20 border border-gray-600/50 hover:border-yellow-500/50 rounded-xl p-6 transition-all duration-300 text-left"
        @click="$emit('server-selected', server)"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center"
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
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
              />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h3
              class="font-semibold text-gray-100 group-hover:text-yellow-400 transition-colors truncate"
            >
              {{ server.name }}
            </h3>
            <p class="text-sm text-gray-400">
              {{ $t('succes.serverSelector.characters', { count: server.characters?.length || 0 }, server.characters?.length || 0) }}
            </p>
          </div>
        </div>

        <!-- Delete Button -->
        <button
          @click.stop="confirmDelete(server)"
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

    <!-- Add Server Form -->
    <div
      class="bg-gray-800/30 border border-gray-700/50 border-dashed rounded-xl p-6"
    >
      <form @submit.prevent="handleAddServer" class="flex gap-4">
        <div class="flex-1">
          <input
            v-model="newServerName"
            type="text"
            :placeholder="$t('succes.serverSelector.placeholder')"
            class="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50"
            required
          />
        </div>
        <button
          type="submit"
          :disabled="!newServerName.trim()"
          class="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-gray-900 transition-all duration-200"
        >
          {{ $t('succes.serverSelector.addButton') }}
        </button>
      </form>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="serverToDelete"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="serverToDelete = null"
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
              {{ $t('succes.serverSelector.deleteTitle') }}
            </h3>
            <p class="text-gray-400 mb-2">
              {{ $t('succes.serverSelector.deleteMessage') }}
              <span class="text-yellow-400 font-semibold">{{
                serverToDelete.name
              }}</span>?
            </p>
            <p class="text-sm text-red-400 mb-6">
              {{ $t('succes.serverSelector.deleteWarning') }}
            </p>
            <div class="flex gap-3">
              <button
                @click="serverToDelete = null"
                class="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-lg text-gray-300 transition-colors"
              >
                {{ $t('succes.serverSelector.cancel') }}
              </button>
              <button
                @click="handleDelete"
                class="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 transition-colors"
              >
                {{ $t('succes.serverSelector.delete') }}
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
  servers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["server-selected", "server-added", "server-deleted"]);

const newServerName = ref("");
const serverToDelete = ref(null);

const handleAddServer = () => {
  if (newServerName.value.trim()) {
    emit("server-added", newServerName.value.trim());
    newServerName.value = "";
  }
};

const confirmDelete = (server) => {
  serverToDelete.value = server;
};

const handleDelete = () => {
  if (serverToDelete.value) {
    emit("server-deleted", serverToDelete.value.id);
    serverToDelete.value = null;
  }
};
</script>

