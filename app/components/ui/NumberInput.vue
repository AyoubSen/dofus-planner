<template>
  <div class="relative flex items-center">
    <input
      :id="id"
      :value="display"
      type="text"
      inputmode="numeric"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="classes"
      @focus="focused = true"
      @blur="focused = false"
      @input="onInput"
    >
    <span v-if="unit" class="pointer-events-none absolute right-2.5 text-xs text-subtle">{{ unit }}</span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: number | null
  placeholder?: string
  disabled?: boolean
  unit?: string
  size?: 'sm' | 'md'
  min?: number
  id?: string
}>(), {
  size: 'md',
})

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const focused = ref(false)

// Grouped while idle so large kamas figures stay readable, raw while focused
// so separators never fight the caret.
const display = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return ''
  if (focused.value) return String(props.modelValue)
  return props.modelValue.toLocaleString('fr-FR')
})

const onInput = (event: Event) => {
  const el = event.target as HTMLInputElement
  const digits = el.value.replace(/[^\d-]/g, '')
  if (digits === '' || digits === '-') return emit('update:modelValue', null)
  let parsed = Number(digits)
  if (!Number.isFinite(parsed)) return emit('update:modelValue', null)
  if (props.min !== undefined) parsed = Math.max(props.min, parsed)
  emit('update:modelValue', parsed)
}

const classes = computed(() => [
  'tabular w-full min-w-0 rounded-md border border-line bg-sunken pl-2.5 text-ink',
  'transition-colors hover:border-line-strong focus:border-accent focus:outline-none',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  props.size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm',
  props.unit ? 'pr-8' : 'pr-2.5',
])
</script>
