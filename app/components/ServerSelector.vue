<template>
  <div class="max-w-2xl mx-auto">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-gray-100 mb-2">Select Your Server</h2>
      <p class="text-gray-400">Choose a server to manage your characters</p>
    </div>

    <div v-if="!showAddForm" class="space-y-4">
      <div v-if="servers.length > 0" class="space-y-3">
        <div
          v-for="server in servers"
          :key="server.id"
          class="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:bg-gray-750 hover:border-gray-600 transition-all duration-200 cursor-pointer group"
          @click="$emit('serverSelected', server)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center"
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
                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                  ></path>
                </svg>
              </div>
              <div>
                <div class="font-semibold text-gray-100 text-lg">
                  {{ server.name }}
                </div>
                <div class="text-sm text-gray-400">
                  {{ server.characters.length }} character{{
                    server.characters.length !== 1 ? "s" : ""
                  }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div
                class="text-gray-500 group-hover:text-blue-400 transition-colors"
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
                @click.stop="showDeleteConfirmation(server)"
                class="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                title="Delete server"
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
          <span class="font-medium">Add New Server</span>
        </div>
      </button>
    </div>

    <div v-else class="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 class="text-lg font-semibold text-gray-100 mb-4">Add New Server</h3>
      <div class="space-y-4">
        <input
          v-model="serverName"
          type="text"
          placeholder="Enter server name"
          class="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @keyup.enter="handleAddServer"
        />
        <div class="flex gap-3">
          <button
            @click="handleAddServer"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Server
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
  servers: {
    type: Array,
    required: true,
  },
});

const $emit = defineEmits(["serverSelected", "serverAdded", "serverDeleted"]);

const showAddForm = ref(false);
const serverName = ref("");

const confirmationModal = ref({
  show: false,
  title: "",
  message: "",
  confirmText: "",
  serverId: null,
});

const handleAddServer = () => {
  if (!serverName.value.trim()) return;

  $emit("serverAdded", serverName.value);
  serverName.value = "";
  showAddForm.value = false;
};

const showDeleteConfirmation = (server) => {
  confirmationModal.value = {
    show: true,
    title: "Delete Server",
    message: `Are you sure you want to delete "${server.name}"? This will also delete all characters on this server.`,
    confirmText: "Delete",
    serverId: server.id,
  };
};

const handleDeleteConfirmation = () => {
  $emit("serverDeleted", confirmationModal.value.serverId);
  hideDeleteConfirmation();
};

const hideDeleteConfirmation = () => {
  confirmationModal.value.show = false;
};
</script>
