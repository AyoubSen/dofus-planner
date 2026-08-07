<template>
  <span :class="classes">
    <span v-if="dot" :class="['size-1.5 shrink-0 rounded-full', dotTone]" />
    <slot />
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  tone?: 'neutral' | 'accent' | 'positive' | 'negative' | 'warning' | 'info'
  dot?: boolean
}>(), {
  tone: 'neutral',
})

const tones = {
  neutral: 'bg-sunken text-muted border-line',
  accent: 'bg-accent-soft text-accent border-accent/25',
  positive: 'bg-positive/10 text-positive border-positive/25',
  negative: 'bg-negative/10 text-negative border-negative/25',
  warning: 'bg-warning/10 text-warning border-warning/25',
  info: 'bg-info/10 text-info border-info/25',
}

const dotTones = {
  neutral: 'bg-subtle',
  accent: 'bg-accent',
  positive: 'bg-positive',
  negative: 'bg-negative',
  warning: 'bg-warning',
  info: 'bg-info',
}

const dotTone = computed(() => dotTones[props.tone])
const classes = computed(() => [
  'inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
  tones[props.tone],
])
</script>
