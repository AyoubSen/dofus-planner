<template>
  <section class="min-w-0">
    <header v-if="title || $slots.actions" class="mb-3 flex items-center gap-3">
      <div class="min-w-0 flex-1">
        <h2 class="truncate text-sm font-semibold text-ink">{{ title }}</h2>
        <p v-if="description" class="mt-0.5 text-xs text-subtle">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </section>
</template>

<script setup lang="ts">
// A titled band of content that is *not* a card. Most pages were wrapping
// every group in a bordered box, which stacked borders until the page read
// as a grid of cages.
defineProps<{
  title?: string
  description?: string
}>()
</script>
