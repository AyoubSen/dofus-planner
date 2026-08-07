<template>
  <div :class="wrapper">
    <div class="flex items-center gap-1.5">
      <span class="truncate text-xs font-medium tracking-wide text-subtle uppercase">{{ label }}</span>
      <span
        v-if="hint"
        class="cursor-help text-subtle"
        :title="hint"
        aria-hidden="true"
      >?</span>
    </div>

    <div class="mt-1.5 flex items-baseline gap-2">
      <slot>
        <span :class="['tabular text-xl font-semibold', valueTone]">{{ value ?? '—' }}</span>
      </slot>
      <span v-if="unit" class="text-xs text-subtle">{{ unit }}</span>
    </div>

    <p v-if="sub" class="mt-1 truncate text-xs text-subtle">{{ sub }}</p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  value?: string | number | null
  unit?: string
  /** Secondary line under the figure. */
  sub?: string
  /** Tooltip for labels that aren't self-explanatory (Invested, Realized…). */
  hint?: string
  tone?: 'neutral' | 'positive' | 'negative' | 'accent'
  /** Game constants render recessed, so they never read as live metrics. */
  kind?: 'metric' | 'constant'
}>(), {
  tone: 'neutral',
  kind: 'metric',
})

const tones = {
  neutral: 'text-ink',
  positive: 'text-positive',
  negative: 'text-negative',
  accent: 'text-accent',
}

const valueTone = computed(() => (props.kind === 'constant' ? 'text-muted' : tones[props.tone]))

const wrapper = computed(() => [
  'min-w-0 rounded-md px-3 py-2.5',
  props.kind === 'constant'
    ? 'bg-transparent border border-dashed border-line'
    : 'bg-surface border border-line',
])
</script>
