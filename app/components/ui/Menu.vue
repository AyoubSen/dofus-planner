<template>
  <div ref="rootEl" class="relative">
    <UiButton
      variant="ghost"
      :size="size"
      :aria-expanded="open"
      aria-haspopup="menu"
      :aria-label="label"
      @click="open = !open"
    >
      <slot name="trigger" />
      <UiIcon v-if="!hideChevron" name="chevronDown" :class="['transition-transform', open && 'rotate-180']" />
    </UiButton>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        :class="[
          'absolute top-[calc(100%+0.375rem)] rounded-lg border border-line bg-raised p-1 shadow-md',
          align === 'right' ? 'right-0' : 'left-0',
        ]"
        :style="{ zIndex: 'var(--z-dropdown)', width }"
        role="menu"
        @click="closeOnSelect && (open = false)"
      >
        <slot :close="() => (open = false)" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// The topbar previously carried three separate copies of this popover, each
// with its own transition, its own outside-click handler keyed on a shared
// `.relative` selector (so they closed each other), and its own styling.
withDefaults(defineProps<{
  label: string
  align?: 'left' | 'right'
  width?: string
  size?: 'sm' | 'md'
  hideChevron?: boolean
  closeOnSelect?: boolean
}>(), {
  align: 'right',
  width: '13rem',
  size: 'sm',
  closeOnSelect: true,
})

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const onPointerdown = (event: MouseEvent) => {
  if (rootEl.value && !rootEl.value.contains(event.target as Node)) open.value = false
}
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', onPointerdown)
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onPointerdown)
  document.removeEventListener('keydown', onKeydown)
})

defineExpose({ close: () => (open.value = false) })
</script>
