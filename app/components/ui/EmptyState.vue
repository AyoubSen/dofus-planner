<template>
  <div class="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
    <div v-if="$slots.icon" class="flex size-11 items-center justify-center rounded-lg border border-line bg-surface text-subtle">
      <slot name="icon" />
    </div>

    <div class="max-w-sm">
      <p class="text-sm font-medium text-ink">{{ title }}</p>
      <p v-if="description" class="mt-1 text-sm text-muted">{{ description }}</p>
    </div>

    <div v-if="$slots.action" class="mt-1">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Replaces .v2-no-context, which was pasted verbatim into ten pages.
defineProps<{
  title: string
  description?: string
}>()
</script>
