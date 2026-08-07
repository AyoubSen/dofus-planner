<script setup lang="ts">
export interface CraftingPickerItem {
  name: string
  image_url?: string | null
  count: number
}

export interface CraftingSessionPreview {
  id: string
  date?: string
  workflow?: string
  items?: unknown[]
}

defineProps<{
  open: boolean
  item: CraftingPickerItem | null
  saving: boolean
  error: string
  /** Sessions are stored per character, so without a context there is
   *  nowhere to add the item — the dialog says so instead of failing later. */
  hasContext: boolean
  sessions: CraftingSessionPreview[]
  sessionTitle: (session: CraftingSessionPreview) => string
  /** Date · workflow · item count, assembled by the page so this component
   *  needs no knowledge of the crafting session shape. */
  sessionMeta: (session: CraftingSessionPreview) => string
}>()

defineEmits<{
  close: []
  create: []
  add: [sessionId: string]
}>()
</script>

<template>
  <UiModal :open="open" :title="$t('items.craftingPicker.title')" @close="$emit('close')">
    <p class="text-xs tracking-wide text-subtle uppercase">{{ $t('items.craftingPicker.eyebrow') }}</p>

    <div v-if="item" class="mt-3 flex flex-wrap items-center gap-3">
      <img
        v-if="item.image_url"
        :src="item.image_url"
        :alt="''"
        class="size-10 shrink-0 rounded-md bg-sunken object-contain"
      >
      <div v-else class="size-10 shrink-0 rounded-md bg-sunken" />
      <div class="min-w-0 flex-1">
        <div class="truncate text-sm font-semibold text-ink">{{ item.name }}</div>
        <div class="tabular truncate text-xs text-subtle">
          {{ $t('items.craftingPicker.usesInResults', { count: item.count }) }}
        </div>
      </div>
      <UiButton
        variant="primary"
        size="sm"
        :disabled="!hasContext"
        :loading="saving"
        @click="$emit('create')"
      >
        {{ $t('items.craftingPicker.createSession') }}
      </UiButton>
    </div>

    <UiEmptyState
      v-if="!hasContext"
      :title="$t('items.craftingPicker.noContext')"
    >
      <template #icon><UiIcon name="user" /></template>
    </UiEmptyState>

    <div v-else-if="sessions.length" class="mt-4 flex flex-col gap-1">
      <button
        v-for="session in sessions"
        :key="session.id"
        type="button"
        class="flex items-center gap-3 rounded-md border border-line bg-surface p-2.5 text-left transition-colors hover:border-line-strong disabled:opacity-45"
        :disabled="saving"
        @click="$emit('add', session.id)"
      >
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm text-ink">{{ sessionTitle(session) }}</div>
          <div class="truncate text-xs text-subtle">{{ sessionMeta(session) }}</div>
        </div>
        <span class="shrink-0 text-xs text-accent">{{ $t('v2.brisage.actions.add') }}</span>
      </button>
    </div>

    <UiEmptyState v-else :title="$t('items.craftingPicker.noSessions')">
      <template #icon><UiIcon name="crafting" /></template>
    </UiEmptyState>

    <p v-if="error" class="mt-3 text-xs text-negative">{{ error }}</p>
  </UiModal>
</template>
