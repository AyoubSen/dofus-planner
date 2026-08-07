<template>
  <div
    :class="['inline-flex min-w-0 gap-0.5 rounded-md border border-line bg-sunken p-0.5', block && 'flex w-full']"
    role="tablist"
    :aria-label="ariaLabel"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      role="tab"
      :aria-selected="isSelected(option.value)"
      :disabled="option.disabled"
      :class="[
        'min-w-0 flex-1 truncate rounded-sm px-2.5 transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-45',
        size === 'sm' ? 'h-7 text-xs' : 'h-8 text-sm',
        isSelected(option.value)
          ? 'bg-raised text-ink font-medium shadow-sm'
          : 'text-muted hover:text-ink',
      ]"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
// One control for every mutually-exclusive choice in the app. Previously
// these were pills on one page and a <select> on the next, which made the
// same decision look like two different kinds of thing.
export interface SegmentOption {
  label: string
  value: string | number | null
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue: string | number | null
  options: SegmentOption[]
  size?: 'sm' | 'md'
  block?: boolean
  ariaLabel?: string
}>(), {
  size: 'md',
})

defineEmits<{ 'update:modelValue': [value: string | number | null] }>()

const isSelected = (value: string | number | null) => Object.is(value, props.modelValue)
</script>
