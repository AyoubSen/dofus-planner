<template>
  <div class="min-w-0">
    <div v-if="label || showValue" class="mb-1 flex items-baseline justify-between gap-2 text-xs">
      <span class="truncate text-muted">{{ label }}</span>
      <span v-if="showValue" class="tabular shrink-0 text-subtle">{{ valueText }}</span>
    </div>

    <div
      class="h-1.5 w-full overflow-hidden rounded-full bg-sunken"
      role="progressbar"
      :aria-valuenow="Math.round(percent)"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="label"
    >
      <div :class="['h-full rounded-full transition-[width] duration-300', barTone]" :style="{ width: `${percent}%` }" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: number
  max?: number
  label?: string
  showValue?: boolean
  valueText?: string
  /** `auto` turns warning/negative as the bar fills — for quota meters. */
  tone?: 'auto' | 'accent' | 'neutral' | 'positive'
}>(), {
  max: 100,
  tone: 'accent',
})

const percent = computed(() => {
  if (!Number.isFinite(props.value) || props.max <= 0) return 0
  return Math.min(100, Math.max(0, (props.value / props.max) * 100))
})

const barTone = computed(() => {
  if (props.tone === 'auto') {
    if (percent.value >= 90) return 'bg-negative'
    if (percent.value >= 70) return 'bg-warning'
    return 'bg-accent'
  }
  return { accent: 'bg-accent', neutral: 'bg-line-strong', positive: 'bg-positive' }[props.tone]
})
</script>
