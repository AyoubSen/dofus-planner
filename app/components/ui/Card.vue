<template>
  <section :class="classes">
    <header
      v-if="title || $slots.title || $slots.actions"
      class="flex items-center gap-3 border-b border-line px-4 py-3"
    >
      <div class="min-w-0 flex-1">
        <h2 v-if="title || $slots.title" class="truncate text-sm font-semibold text-ink">
          <slot name="title">{{ title }}</slot>
        </h2>
        <p v-if="subtitle" class="mt-0.5 truncate text-xs text-subtle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <div :class="padded ? 'p-4' : ''">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="border-t border-line px-4 py-3">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  /** `raised` floats above the page; `flat` sits on it. Cards separate by
   *  spacing first — reach for `raised` only when something truly overlaps. */
  variant?: 'flat' | 'raised'
  padded?: boolean
}>(), {
  variant: 'flat',
  padded: true,
})

const classes = computed(() => [
  'rounded-lg border border-line overflow-hidden',
  props.variant === 'raised' ? 'bg-raised shadow-md' : 'bg-surface',
])
</script>
