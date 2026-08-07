<template>
  <UiOverlay v-bind="props" side="center" @close="$emit('close')">
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </UiOverlay>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg'
}>()

defineEmits<{ close: [] }>()
</script>
