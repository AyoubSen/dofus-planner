<template>
  <UiModal :open="open" :title="$t('v2.layout.characters')" size="lg" @close="$emit('close')">
    <div class="grid gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <!-- Servers -->
      <div class="min-w-0">
        <p class="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
          {{ $t('v2.layout.servers') }}
        </p>

        <div class="flex flex-col gap-1">
          <div
            v-for="server in servers"
            :key="server.id"
            :class="[
              'group flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors',
              pickerServerId === server.id
                ? 'border-accent/40 bg-accent-soft'
                : 'border-line hover:border-line-strong',
            ]"
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
              @click="pickerServerId = server.id; showAddChar = false"
            >
              <span class="truncate text-sm text-ink">{{ server.name }}</span>
              <span class="ml-auto shrink-0 text-xs text-subtle">{{ server.characters.length }}</span>
            </button>
            <!-- Only offered once the server is empty, so it can't destroy characters. -->
            <UiButton
              v-if="server.characters.length === 0"
              variant="ghost"
              size="sm"
              icon
              class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              :aria-label="$t('v2.layout.deleteServer')"
              @click="deleteServer(server.id)"
            >
              <UiIcon name="trash" />
            </UiButton>
          </div>

          <form v-if="showAddServer" class="mt-1 flex flex-col gap-2" @submit.prevent="submitServer">
            <UiInput
              ref="serverInputRef"
              v-model="newServerName"
              size="sm"
              :placeholder="$t('v2.layout.serverName')"
              @keyup.esc="cancelAddServer"
            />
            <div class="flex gap-2">
              <UiButton type="submit" variant="primary" size="sm">{{ $t('v2.layout.add') }}</UiButton>
              <UiButton variant="ghost" size="sm" @click="cancelAddServer">{{ $t('v2.layout.cancel') }}</UiButton>
            </div>
          </form>
          <UiButton v-else variant="ghost" size="sm" class="mt-1 justify-start" @click="showAddServer = true">
            <template #icon><UiIcon name="plus" /></template>
            {{ $t('v2.layout.addServer') }}
          </UiButton>
        </div>
      </div>

      <!-- Characters -->
      <div class="min-w-0 sm:border-l sm:border-line sm:pl-4">
        <p class="mb-2 truncate text-xs font-medium tracking-wide text-subtle uppercase">
          {{ pickerServer ? pickerServer.name : $t('v2.layout.selectServer') }}
        </p>

        <UiEmptyState v-if="!pickerServer" :title="$t('v2.layout.selectServerFirst')">
          <template #icon><UiIcon name="user" /></template>
        </UiEmptyState>

        <div v-else class="flex flex-col gap-1">
          <div
            v-for="char in pickerServer.characters"
            :key="char.id"
            :class="[
              'group flex items-center gap-2.5 rounded-md border px-2 py-1.5 transition-colors',
              isCurrent(char.id) ? 'border-accent/40 bg-accent-soft' : 'border-line hover:border-line-strong',
            ]"
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left"
              @click="selectChar(char)"
            >
              <UiAvatar :name="char.name" size="sm" />
              <span class="flex min-w-0 flex-col">
                <span class="truncate text-sm text-ink">{{ char.name }}</span>
                <span class="truncate text-xs text-subtle">{{ char.class }}</span>
              </span>
            </button>
            <UiButton
              variant="ghost"
              size="sm"
              icon
              class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              :aria-label="$t('v2.layout.deleteCharacter')"
              @click="confirmDeleteCharacter(char)"
            >
              <UiIcon name="trash" />
            </UiButton>
          </div>

          <form v-if="showAddChar" class="mt-1 flex flex-col gap-2" @submit.prevent="submitChar">
            <UiInput v-model="newCharName" size="sm" :placeholder="$t('v2.layout.characterName')" @keyup.esc="cancelAddChar" />
            <UiSelect
              v-model="newCharClass"
              :options="classOptions"
              size="sm"
              :placeholder="$t('v2.layout.selectClass')"
              :aria-label="$t('v2.layout.selectClass')"
            />
            <div class="flex gap-2">
              <UiButton type="submit" variant="primary" size="sm" :disabled="!newCharName.trim() || !newCharClass">
                {{ $t('v2.layout.add') }}
              </UiButton>
              <UiButton variant="ghost" size="sm" @click="cancelAddChar">{{ $t('v2.layout.cancel') }}</UiButton>
            </div>
          </form>
          <UiButton v-else variant="ghost" size="sm" class="mt-1 justify-start" @click="showAddChar = true">
            <template #icon><UiIcon name="plus" /></template>
            {{ $t('v2.layout.addCharacter') }}
          </UiButton>
        </div>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const {
  servers, selectedServerId, selectedCharacterId,
  setContext, addServer, deleteServer, addCharacter, deleteCharacter,
} = useV2Context()

const DOFUS_CLASSES = [
  'Crâ', 'Ecaflip', 'Eniripsa', 'Enutrof', 'Féca',
  'Iop', 'Osamodas', 'Pandawa', 'Roublard', 'Sacrieur',
  'Sadida', 'Sram', 'Xélor', 'Zobal', 'Masqueraider',
  'Steamer', 'Eliotrope', 'Huppermage', 'Ouginak', 'Forgelance',
]
const classOptions = DOFUS_CLASSES.map(cls => ({ key: cls, label: cls, value: cls }))

const pickerServerId = ref<string | null>(null)
const showAddServer = ref(false)
const showAddChar = ref(false)
const newServerName = ref('')
const newCharName = ref('')
const newCharClass = ref('')
const serverInputRef = ref<{ $el: HTMLElement } | null>(null)

const pickerServer = computed(() => servers.value.find(s => s.id === pickerServerId.value) ?? null)

const isCurrent = (charId: string) =>
  selectedCharacterId.value === charId && selectedServerId.value === pickerServerId.value

// Default to the active server each time the modal opens.
watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  pickerServerId.value = selectedServerId.value ?? servers.value[0]?.id ?? null
  showAddServer.value = false
  showAddChar.value = false
})

watch(showAddServer, async (v) => {
  if (!v) return
  await nextTick()
  serverInputRef.value?.$el?.querySelector('input')?.focus()
})

const cancelAddServer = () => { showAddServer.value = false; newServerName.value = '' }
const cancelAddChar = () => { showAddChar.value = false; newCharName.value = ''; newCharClass.value = '' }

const selectChar = (char: { id: string }) => {
  if (!pickerServerId.value) return
  setContext(pickerServerId.value, char.id)
  emit('close')
}

const submitServer = () => {
  const name = newServerName.value.trim()
  if (!name) return
  const result = addServer(name)
  if (result.success && result.data) pickerServerId.value = result.data.id
  cancelAddServer()
}

const submitChar = () => {
  if (!pickerServerId.value || !newCharName.value.trim() || !newCharClass.value) return
  const result = addCharacter(pickerServerId.value, {
    name: newCharName.value.trim(),
    class: newCharClass.value,
  })
  cancelAddChar()
  if (result.success && result.data) selectChar(result.data)
}

// Characters carry tracked sessions and prices, so deleting one is worth a stop.
const confirmDeleteCharacter = (char: { id: string, name: string }) => {
  if (!pickerServerId.value) return
  if (!window.confirm(t('v2.layout.confirmDeleteCharacter', { name: char.name }))) return
  deleteCharacter(pickerServerId.value, char.id)
}
</script>
