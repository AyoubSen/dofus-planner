<template>
  <div v-if="label" class="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
    {{ label }}
  </div>
  <div class="grid gap-2" :style="`grid-template-columns: repeat(auto-fit, minmax(${min}, 1fr))`">
    <slot />
  </div>
</template>

<script setup lang="ts">
// A single responsive stat grid, replacing the four hand-rolled strips
// (.br-stats, .cf-stats, .fam-stats, .rt-stats) that each broke differently.
withDefaults(defineProps<{
  label?: string
  /** Minimum tile width; raise it when values are long. rem keeps font-scale working. */
  min?: string
}>(), {
  min: '9rem',
})
</script>
