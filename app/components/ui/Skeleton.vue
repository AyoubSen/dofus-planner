<template>
  <div
    :class="['animate-pulse bg-sunken', rounded === 'full' ? 'rounded-full' : 'rounded-md']"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  width?: string
  height?: string
  rounded?: 'md' | 'full'
}>(), {
  width: '100%',
  height: '1rem',
  rounded: 'md',
})
</script>
