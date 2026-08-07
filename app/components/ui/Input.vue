<template>
  <div class="relative flex items-center">
    <span v-if="$slots.prefix" class="pointer-events-none absolute left-2.5 flex text-subtle">
      <slot name="prefix" />
    </span>

    <input
      :id="id"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :inputmode="inputmode"
      :class="classes"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >

    <span v-if="$slots.suffix" class="absolute right-2.5 flex text-subtle">
      <slot name="suffix" />
    </span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string | number | null
  type?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  inputmode?: 'text' | 'numeric' | 'decimal' | 'search'
  size?: 'sm' | 'md'
  id?: string
}>(), {
  type: 'text',
  size: 'md',
})

defineEmits<{ 'update:modelValue': [value: string] }>()

const slots = useSlots()

const classes = computed(() => [
  'w-full min-w-0 rounded-md border border-line bg-sunken text-ink',
  'transition-colors hover:border-line-strong focus:border-accent focus:outline-none',
  'disabled:opacity-50 disabled:cursor-not-allowed read-only:text-muted',
  props.size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm',
  slots.prefix ? 'pl-8' : 'pl-2.5',
  slots.suffix ? 'pr-8' : 'pr-2.5',
])
</script>
