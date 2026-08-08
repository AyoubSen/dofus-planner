<template>
  <!-- Three rules keep labels readable: segments size to their content unless
       `block` is set (equal-width division clipped "Table view" to "Table vi..."),
       selection reads from the surface, never from font weight (bolding the
       active label made it wider than its own flex basis), and no segment ever
       shrinks below its label — when the row cannot fit, as on a phone, it
       scrolls sideways instead of ellipsising every option at once. -->
  <div
    :class="['inline-flex min-w-0 max-w-full gap-0.5 overflow-x-auto rounded-md border border-line bg-sunken p-0.5', block && 'flex w-full']"
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
        'rounded-sm px-2.5 transition-colors',
        block ? 'min-w-fit flex-1 whitespace-nowrap' : 'shrink-0 whitespace-nowrap',
        'disabled:cursor-not-allowed disabled:opacity-45',
        size === 'sm' ? 'h-7 text-xs' : 'h-8 text-sm',
        isSelected(option.value)
          ? 'bg-raised text-ink shadow-sm'
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
