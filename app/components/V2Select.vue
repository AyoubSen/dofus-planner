<template>
  <div ref="rootEl" class="v2s">
    <button
      type="button"
      class="v2s__trigger"
      :class="{ 'v2s__trigger--open': open, 'v2s__trigger--placeholder': !selectedOption }"
      @click="toggleOpen"
    >
      <span class="v2s__label">{{ selectedOption?.label ?? placeholderText }}</span>
      <svg class="v2s__icon" :class="{ 'v2s__icon--open': open }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div v-if="open" class="v2s__menu">
      <button
        v-for="option in options"
        :key="option.key"
        type="button"
        class="v2s__option"
        :class="{ 'v2s__option--active': isSelected(option.value) }"
        @click="selectOption(option.value)"
      >
        <span>{{ option.label }}</span>
        <svg v-if="isSelected(option.value)" class="v2s__check" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SelectOption {
  key: string
  label: string
  value: string | number | null
}

const props = withDefaults(defineProps<{
  modelValue: string | number | null
  options: SelectOption[]
  placeholder?: string
}>(), {
  placeholder: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const { t } = useI18n()

const placeholderText = computed(() => props.placeholder || t('v2.common.selectOption'))

const selectedOption = computed(() =>
  props.options.find(option => Object.is(option.value, props.modelValue)) ?? null,
)

const toggleOpen = () => {
  open.value = !open.value
}

const selectOption = (value: string | number | null) => {
  emit('update:modelValue', value)
  open.value = false
}

const isSelected = (value: string | number | null) => Object.is(value, props.modelValue)

const onDocumentPointerdown = (event: MouseEvent) => {
  const target = event.target as Node
  if (rootEl.value && !rootEl.value.contains(target)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentPointerdown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocumentPointerdown)
})
</script>

<style scoped>
.v2s { position: relative; }

.v2s__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  border: 1px solid var(--v2-border-med);
  border-radius: 10px;
  background: color-mix(in srgb, var(--v2-hover-subtle) 88%, black 12%);
  color: var(--v2-text);
  padding: .5rem .75rem;
  font-size: .875rem;
  text-align: left;
  cursor: pointer;
  transition: border-color .16s ease, background .16s ease;
}

.v2s__trigger:hover,
.v2s__trigger--open {
  border-color: var(--v2-border-focus);
  background: color-mix(in srgb, var(--v2-hover-subtle) 78%, black 22%);
}

.v2s__trigger--placeholder .v2s__label { color: var(--v2-text-dim); }

.v2s__label {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v2s__icon {
  width: 16px;
  height: 16px;
  color: var(--v2-text-muted);
  flex-shrink: 0;
  transition: transform .16s ease;
}

.v2s__icon--open { transform: rotate(180deg); }

.v2s__menu {
  position: absolute;
  top: calc(100% + .4rem);
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: .45rem;
  border: 1px solid var(--v2-border-med);
  border-radius: 12px;
  background: color-mix(in srgb, var(--v2-hover-subtle) 96%, black 4%);
  backdrop-filter: blur(10px);
  box-shadow: 0 16px 32px rgba(0,0,0,.42);
  max-height: 280px;
  overflow-y: auto;
}

.v2s__option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  border: 1px solid var(--v2-border-subtle);
  border-radius: 10px;
  background: color-mix(in srgb, var(--v2-hover) 84%, black 16%);
  color: var(--v2-text);
  padding: .55rem .65rem;
  font-size: .8125rem;
  text-align: left;
  cursor: pointer;
}

.v2s__option:hover,
.v2s__option--active {
  border-color: var(--v2-border-focus);
  background: color-mix(in srgb, var(--v2-active-strong) 78%, black 22%);
}

.v2s__check {
  width: 16px;
  height: 16px;
  color: var(--v2-accent);
  flex-shrink: 0;
}
</style>
