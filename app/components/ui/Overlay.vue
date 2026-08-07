<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        ref="rootEl"
        class="fixed inset-0 bg-black/55"
        :style="{ zIndex: 'var(--z-modal)' }"
        @click.self="$emit('close')"
      >
        <Transition
          appear
          :enter-active-class="`transition-transform duration-200 ease-out`"
          :enter-from-class="side === 'right' ? 'translate-x-full' : 'scale-95 opacity-0'"
        >
          <div :class="panelClasses" role="dialog" aria-modal="true" :aria-label="title">
            <header
              v-if="title || $slots.header"
              class="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3"
            >
              <h2 class="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                <slot name="header">{{ title }}</slot>
              </h2>
              <UiButton variant="ghost" size="sm" icon :aria-label="$t('v2.common.close')" @click="$emit('close')">
                <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </UiButton>
            </header>

            <div class="min-h-0 flex-1 overflow-y-auto p-4">
              <slot />
            </div>

            <footer v-if="$slots.footer" class="shrink-0 border-t border-line px-4 py-3">
              <slot name="footer" />
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// One focus-trapped, ESC-closing overlay backing both UiModal and UiDrawer.
// The character picker and the items detail panel each hand-rolled this
// before, with different close behaviour.
const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  side?: 'center' | 'right'
  size?: 'sm' | 'md' | 'lg'
}>(), {
  side: 'center',
  size: 'md',
})

const emit = defineEmits<{ close: [] }>()

const rootEl = ref<HTMLElement | null>(null)

const widths = { sm: 'max-w-sm', md: 'max-w-xl', lg: 'max-w-3xl' }

const panelClasses = computed(() =>
  props.side === 'right'
    ? [
        'absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-surface shadow-md',
        widths[props.size],
      ]
    : [
        'absolute top-1/2 left-1/2 flex max-h-[85dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
        'flex-col rounded-lg border border-line bg-surface shadow-md',
        widths[props.size],
      ],
)

const onKeydown = (event: KeyboardEvent) => {
  if (!props.open) return

  if (event.key === 'Escape') return emit('close')
  if (event.key !== 'Tab' || !rootEl.value) return

  // Keep Tab inside the panel while it is open.
  const focusable = rootEl.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  if (!focusable.length) return
  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

// Lock the page behind the overlay, and restore focus to whatever opened it.
let restoreFocus: HTMLElement | null = null

watch(
  () => props.open,
  async (isOpen) => {
    if (!import.meta.client) return
    if (isOpen) {
      restoreFocus = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      await nextTick()
      rootEl.value?.querySelector<HTMLElement>('button, input, a[href]')?.focus()
    } else {
      document.body.style.overflow = ''
      restoreFocus?.focus?.()
      restoreFocus = null
    }
  },
)

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  if (import.meta.client) document.body.style.overflow = ''
})
</script>
