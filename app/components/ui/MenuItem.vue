<template>
  <component
    :is="as"
    :type="as === 'button' ? 'button' : undefined"
    role="menuitem"
    :class="[
      'flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors',
      active ? 'text-accent bg-accent-soft' : 'text-muted hover:bg-sunken hover:text-ink',
      danger && 'text-negative hover:bg-negative/10 hover:text-negative',
    ]"
  >
    <slot name="icon" />
    <span class="min-w-0 flex-1 truncate"><slot /></span>
    <UiIcon v-if="active" name="check" class="text-accent" />
    <slot name="trailing" />
  </component>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  active?: boolean
  danger?: boolean
  /** `label` lets a menu row wrap a hidden file input. */
  as?: 'button' | 'label' | 'a'
}>(), {
  as: 'button',
})
</script>
