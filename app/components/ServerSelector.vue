<template>
  <div class="max-w-2xl mx-auto">
    <Transition name="fade-slide" mode="out-in">
      <!-- Server List -->
      <div v-if="!showAddForm" key="server-list" class="space-y-4">
        <TransitionGroup name="list" tag="div" class="space-y-3">
          <div
            v-for="(server, index) in servers"
            :key="server.id"
            :style="{ animationDelay: `${index * 50}ms` }"
            class="group relative bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 hover:bg-gray-800/80 hover:border-blue-500/30 transition-all duration-300 cursor-pointer animate-fade-in-up"
            @click="$emit('serverSelected', server)"
          >
            <!-- Hover glow -->
            <div
              class="absolute -inset-px bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"
            ></div>

            <div class="relative z-10 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div
                  class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 group-hover:shadow-blue-500/30 transition-all duration-300"
                >
                  <svg
                    class="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                    />
                  </svg>
                </div>
                <div>
                  <div
                    class="font-semibold text-gray-100 text-lg group-hover:text-blue-300 transition-colors duration-300"
                  >
                    {{ server.name }}
                  </div>
                  <div class="flex items-center gap-2 text-sm text-gray-400">
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>{{
                      t(
                        'archimonstres.serverSelector.characters',
                        server.characters.length
                      )
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <button
                  @click.stop="showDeleteConfirmation(server)"
                  class="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                  :title="t('archimonstres.serverSelector.deleteTitle')"
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
                  class="w-10 h-10 rounded-xl bg-gray-700/50 flex items-center justify-center text-gray-500 group-hover:text-blue-400 group-hover:bg-blue-500/20 transition-all duration-300"
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
          v-if="servers.length === 0"
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
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
              />
            </svg>
          </div>
          <p class="text-gray-400 mb-2">
            {{ t('archimonstres.serverSelector.emptyTitle') }}
          </p>
          <p class="text-gray-500 text-sm">
            {{ t('archimonstres.serverSelector.emptyDescription') }}
          </p>
        </div>

        <!-- Add Server Button -->
        <button
          @click="showAddForm = true"
          class="group w-full p-6 border-2 border-dashed border-gray-600/50 rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300"
        >
          <div class="flex items-center justify-center gap-4">
            <div
              class="w-12 h-12 border-2 border-gray-600 rounded-xl flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-500/10 transition-all duration-300"
            >
              <svg
                class="w-6 h-6 text-gray-500 group-hover:text-blue-400 transition-colors duration-300"
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
              class="font-medium text-gray-400 group-hover:text-blue-300 transition-colors duration-300"
            >
              {{ t('archimonstres.serverSelector.addButton') }}
            </span>
          </div>
        </button>
      </div>

      <!-- Add Server Form -->
      <div
        v-else
        key="add-form"
        class="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 animate-fade-in-up"
      >
        <div class="flex items-center gap-4 mb-6">
          <div
            class="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-blue-500/20"
          >
            <svg
              class="w-6 h-6 text-blue-400"
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
          <div>
            <h3 class="text-xl font-bold text-gray-100">
              {{ t('archimonstres.serverSelector.formTitle') }}
            </h3>
            <p class="text-sm text-gray-400">
              {{ t('archimonstres.serverSelector.formDescription') }}
            </p>
          </div>
        </div>

        <div class="space-y-5">
          <div class="relative">
            <input
              v-model="serverName"
              type="text"
              :placeholder="t('archimonstres.serverSelector.placeholder')"
              class="w-full px-5 py-4 border border-gray-600/50 rounded-xl bg-gray-900/50 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              @keyup.enter="handleAddServer"
              autofocus
            />
            <div
              class="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 focus-within:opacity-100 pointer-events-none transition-opacity duration-300"
            ></div>
          </div>

          <div class="flex gap-3">
            <button
              @click="handleAddServer"
              :disabled="!serverName.trim()"
              class="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              {{ t('archimonstres.serverSelector.submitButton') }}
            </button>
            <button
              @click="cancelAdd"
              class="px-6 py-3.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-medium rounded-xl border border-gray-600/50 hover:border-gray-500 transition-all duration-300"
            >
              {{ t('archimonstres.serverSelector.cancelButton') }}
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
const { t } = useI18n();

defineProps({
  servers: {
    type: Array,
    required: true,
  },
});

const $emit = defineEmits(['serverSelected', 'serverAdded', 'serverDeleted']);

const showAddForm = ref(false);
const serverName = ref('');

const confirmationModal = ref({
  show: false,
  title: '',
  message: '',
  confirmText: '',
  serverId: null,
});

const handleAddServer = () => {
  if (!serverName.value.trim()) return;

  $emit('serverAdded', serverName.value);
  serverName.value = '';
  showAddForm.value = false;
};

const cancelAdd = () => {
  serverName.value = '';
  showAddForm.value = false;
};

const showDeleteConfirmation = (server) => {
  confirmationModal.value = {
    show: true,
    title: t('archimonstres.serverSelector.deleteTitle'),
    message: t('archimonstres.serverSelector.deleteMessage', {
      name: server.name,
    }),
    confirmText: t('archimonstres.serverSelector.deleteConfirm'),
    serverId: server.id,
  };
};

const handleDeleteConfirmation = () => {
  $emit('serverDeleted', confirmationModal.value.serverId);
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