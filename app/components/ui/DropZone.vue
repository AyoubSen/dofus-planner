<script setup lang="ts">
// One capture control instead of a "browse" button next to a "paste" button.
// Accepts all three ways a screenshot can arrive — click, drop, Ctrl+V — and
// emits a single data URL. The caller decides what to do with it and is
// expected to throw it away once parsed.
const props = withDefaults(defineProps<{
  label: string
  hint?: string
  loading?: boolean
  disabled?: boolean
  /** `sm` is the inline variant used inside a list row. */
  size?: 'sm' | 'md'
}>(), {
  size: 'md',
})

const emit = defineEmits<{ image: [dataUrl: string] }>()

const fileInput = ref<HTMLInputElement | null>(null)
const rootEl = ref<HTMLElement | null>(null)
const isDragging = ref(false)

defineExpose({ focus: () => rootEl.value?.focus() })

const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })

const handleFile = async (file: File | null | undefined) => {
  if (!file || props.disabled || props.loading) return
  emit('image', await readFile(file))
}

const onPick = () => {
  if (props.disabled || props.loading) return
  fileInput.value?.click()
}

const onInputChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  await handleFile(input.files?.[0])
  // Reset so picking the same file twice still fires a change event.
  input.value = ''
}

const onDrop = async (event: DragEvent) => {
  isDragging.value = false
  await handleFile(event.dataTransfer?.files?.[0])
}

const onDragOver = () => {
  if (props.disabled || props.loading) return
  isDragging.value = true
}

// Only handles paste while focused; the page keeps a window-level handler for
// the common case where the user has not clicked this control first.
const onPaste = async (event: ClipboardEvent) => {
  const item = Array.from(event.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
  if (!item) return
  event.preventDefault()
  await handleFile(item.getAsFile())
}
</script>

<template>
  <div
    ref="rootEl"
    :class="[
      'flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-center transition-colors',
      'focus:outline-none',
      size === 'sm' ? 'px-3 py-2' : 'px-4 py-6',
      disabled || loading ? 'cursor-not-allowed opacity-60' : 'hover:border-accent hover:bg-accent-soft',
      isDragging ? 'border-accent bg-accent-soft' : 'border-line-strong bg-sunken',
    ]"
    :tabindex="disabled ? -1 : 0"
    role="button"
    :aria-label="label"
    :aria-disabled="disabled || undefined"
    @click="onPick"
    @keydown.enter.prevent="onPick"
    @keydown.space.prevent="onPick"
    @paste="onPaste"
    @dragover.prevent="onDragOver"
    @dragleave="isDragging = false"
    @drop.prevent="onDrop"
  >
    <UiIcon :name="loading ? 'settings' : 'upload'" :class="['shrink-0 text-subtle', loading && 'animate-spin']" />
    <div class="min-w-0">
      <p :class="['truncate text-ink', size === 'sm' ? 'text-xs' : 'text-sm']">{{ label }}</p>
      <p v-if="hint && size !== 'sm'" class="mt-0.5 text-xs text-subtle">{{ hint }}</p>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onInputChange"
    >
  </div>
</template>
