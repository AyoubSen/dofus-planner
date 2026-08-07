<template>
  <span :class="classes" :title="name || undefined" aria-hidden="true">
    <template v-if="name">{{ name[0]?.toUpperCase() }}</template>
    <UiIcon v-else name="user" />
  </span>
</template>

<script setup lang="ts">
// Neutral by default. The old avatars picked from ten saturated hues, which
// put a random loud colour in the sidebar of every screen for no information
// gain — the name is right next to it.
const props = withDefaults(defineProps<{
  name?: string | null
  size?: 'sm' | 'md'
}>(), {
  size: 'md',
})

const sizes = {
  sm: 'size-7 text-xs',
  md: 'size-8 text-sm',
}

const classes = computed(() => [
  'inline-flex shrink-0 items-center justify-center rounded-md border border-line bg-sunken font-semibold text-muted select-none',
  sizes[props.size],
])
</script>
