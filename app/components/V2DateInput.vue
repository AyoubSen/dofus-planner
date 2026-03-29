<template>
  <div class="v2d">
    <button type="button" class="v2d__trigger" @click="openPicker">
      <div class="v2d__body">
        <span class="v2d__value" :class="{ 'v2d__value--placeholder': !modelValue }">
          {{ displayValue }}
        </span>
      </div>
      <span class="v2d__icon-wrap">
        <svg class="v2d__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
        </svg>
      </span>
    </button>
    <input
      ref="inputEl"
      :value="modelValue"
      type="date"
      class="v2d__native"
      @input="onInput"
    >
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
}>(), {
  placeholder: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const { t } = useI18n()
const placeholderText = computed(() => props.placeholder || t('v2.common.pickDate'))

const displayValue = computed(() => {
  if (!props.modelValue) return placeholderText.value
  const date = new Date(props.modelValue)
  if (Number.isNaN(date.getTime())) return props.modelValue
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
})

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const openPicker = async () => {
  const input = inputEl.value
  if (!input) return
  if (typeof input.showPicker === 'function') {
    input.showPicker()
    return
  }
  input.focus()
  input.click()
}
</script>

<style scoped>
.v2d {
  position: relative;
}

.v2d__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  border: 1px solid var(--v2-border-med);
  border-radius: 10px;
  background: rgba(0,0,0,.25);
  color: var(--v2-text);
  padding: .5rem .75rem;
  font-size: .875rem;
  text-align: left;
  cursor: pointer;
  transition: border-color .16s ease, background .16s ease;
}

.v2d__trigger:hover {
  border-color: var(--v2-border-focus);
  background: rgba(0,0,0,.3);
}

.v2d__body {
  min-width: 0;
  flex: 1;
}

.v2d__value {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v2d__value--placeholder {
  color: var(--v2-text-dim);
}

.v2d__icon-wrap {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255,255,255,.05);
  color: var(--v2-accent);
  flex-shrink: 0;
}

.v2d__icon {
  width: 16px;
  height: 16px;
}

.v2d__native {
  position: absolute;
  opacity: 0;
  inset: auto;
  width: 1px;
  height: 1px;
  pointer-events: none;
}
</style>
