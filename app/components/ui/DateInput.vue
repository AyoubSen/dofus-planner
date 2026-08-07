<template>
  <div class="relative min-w-0">
    <button
      :id="id"
      type="button"
      :class="classes"
      :disabled="disabled"
      @click="openPicker"
    >
      <span :class="['truncate', modelValue ? 'text-ink' : 'text-subtle']">{{ displayValue }}</span>
      <svg class="size-4 shrink-0 text-subtle" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
      </svg>
    </button>

    <!-- The native control stays in the DOM but invisible: it supplies the
         platform date picker while the button supplies the styling. -->
    <input
      ref="inputEl"
      :value="modelValue"
      type="date"
      tabindex="-1"
      aria-hidden="true"
      class="pointer-events-none absolute size-px opacity-0"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/utils/format'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  id?: string
}>(), {
  placeholder: '',
  size: 'md',
})

defineEmits<{ 'update:modelValue': [value: string] }>()

const inputEl = ref<HTMLInputElement | null>(null)
const { t } = useI18n()

const displayValue = computed(() =>
  props.modelValue ? formatDate(props.modelValue) : props.placeholder || t('v2.common.pickDate'),
)

const classes = computed(() => [
  'flex w-full items-center justify-between gap-2 rounded-md border border-line bg-sunken px-2.5',
  'transition-colors hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50',
  props.size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm',
])

const openPicker = () => {
  const input = inputEl.value
  if (!input) return
  if (typeof input.showPicker === 'function') return input.showPicker()
  input.focus()
  input.click()
}
</script>
