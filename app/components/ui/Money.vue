<template>
  <span :class="classes" :title="exact">{{ text }}</span>
</template>

<script setup lang="ts">
import { formatKamas, formatKamasShort, formatSigned } from '~/utils/format'

const props = withDefaults(defineProps<{
  value: number | null | undefined
  /** Show an explicit +/− and colour by direction. Profit/loss only. */
  signed?: boolean
  /** Abbreviate to 1.2M k for dense rows. */
  short?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** Suppress the red/green even when signed — for neutral running totals. */
  muted?: boolean
}>(), {
  size: 'md',
})

const text = computed(() => {
  if (props.signed) return props.short ? formatKamasShort(props.value) : formatSigned(props.value)
  return props.short ? formatKamasShort(props.value) : formatKamas(props.value)
})

/** Always expose the exact figure on hover, even when the label is short. */
const exact = computed(() =>
  props.short && Number.isFinite(props.value as number) ? formatKamas(props.value) : undefined,
)

const sizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg font-semibold' }

const tone = computed(() => {
  if (!props.signed || props.muted) return 'text-ink'
  const v = props.value
  if (!Number.isFinite(v as number) || v === 0) return 'text-muted'
  return (v as number) > 0 ? 'text-positive' : 'text-negative'
})

const classes = computed(() => ['tabular whitespace-nowrap', sizes[props.size], tone.value])
</script>
