<template>
  <div ref="rootEl" class="relative min-w-0">
    <button
      :id="id"
      type="button"
      :class="triggerClasses"
      :disabled="disabled"
      :aria-expanded="open"
      :aria-label="ariaLabel || placeholderText"
      aria-haspopup="listbox"
      @click="toggleOpen"
      @keydown.down.prevent="openAndMove(1)"
      @keydown.up.prevent="openAndMove(-1)"
      @keydown.enter.prevent="open ? selectHighlighted() : toggleOpen()"
      @keydown.esc.prevent="open = false"
    >
      <span class="flex min-w-0 flex-col text-left">
        <span :class="['truncate', selectedOption ? 'text-ink' : 'text-subtle']">
          {{ selectedOption?.label ?? placeholderText }}
        </span>
        <span v-if="selectedOption?.description" class="truncate text-xs text-subtle">
          {{ selectedOption.description }}
        </span>
      </span>
      <svg
        :class="['size-4 shrink-0 text-subtle transition-transform', open && 'rotate-180']"
        fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute top-[calc(100%+0.25rem)] right-0 left-0 max-h-72 overflow-y-auto rounded-md border border-line bg-raised p-1 shadow-md"
      :style="{ zIndex: 'var(--z-dropdown)' }"
      role="listbox"
    >
      <button
        v-for="option in options"
        :key="option.key"
        type="button"
        :class="[
          'flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-45',
          highlightedKey === option.key ? 'bg-sunken text-ink' : 'text-muted',
          isSelected(option.value) && 'text-accent',
        ]"
        :disabled="option.disabled"
        role="option"
        :aria-selected="isSelected(option.value)"
        @mouseenter="highlightedKey = option.key"
        @click="selectOption(option.value)"
      >
        <span class="flex min-w-0 flex-col">
          <span class="truncate">{{ option.label }}</span>
          <span v-if="option.description" class="truncate text-xs text-subtle">{{ option.description }}</span>
        </span>
        <svg v-if="isSelected(option.value)" class="size-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Behaviour is carried over from the previous V2Select (keyboard nav,
// outside-click close, description lines); only the styling changed.
export interface SelectOption {
  key: string
  label: string
  value: string | number | null
  description?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue: string | number | null
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  ariaLabel?: string
  id?: string
}>(), {
  placeholder: '',
  disabled: false,
  size: 'md',
  ariaLabel: '',
})

const emit = defineEmits<{ 'update:modelValue': [value: string | number | null] }>()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const highlightedKey = ref<string | null>(null)
const { t } = useI18n()

const placeholderText = computed(() => props.placeholder || t('v2.common.selectOption'))

const selectedOption = computed(
  () => props.options.find(o => Object.is(o.value, props.modelValue)) ?? null,
)

const triggerClasses = computed(() => [
  'flex w-full items-center justify-between gap-2 rounded-md border border-line bg-sunken px-2.5',
  'transition-colors hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50',
  open.value && 'border-accent',
  props.size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm',
])

const enabledOptions = computed(() => props.options.filter(o => !o.disabled))

const toggleOpen = () => {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) highlightedKey.value = selectedOption.value?.key ?? enabledOptions.value[0]?.key ?? null
}

const selectOption = (value: string | number | null) => {
  if (props.options.find(o => Object.is(o.value, value))?.disabled) return
  emit('update:modelValue', value)
  open.value = false
}

const isSelected = (value: string | number | null) => Object.is(value, props.modelValue)

const openAndMove = (delta: number) => {
  if (props.disabled) return
  if (!open.value) {
    open.value = true
    highlightedKey.value = selectedOption.value?.key ?? enabledOptions.value[0]?.key ?? null
    return
  }
  const enabled = enabledOptions.value
  if (!enabled.length) return
  const current = enabled.findIndex(o => o.key === highlightedKey.value)
  const next = current < 0 ? 0 : (current + delta + enabled.length) % enabled.length
  highlightedKey.value = enabled[next]?.key ?? null
}

const selectHighlighted = () => {
  const option = props.options.find(o => o.key === highlightedKey.value)
  if (option) selectOption(option.value)
}

const onPointerdown = (event: MouseEvent) => {
  if (rootEl.value && !rootEl.value.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onPointerdown))
onUnmounted(() => document.removeEventListener('mousedown', onPointerdown))
</script>
