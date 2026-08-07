<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="to ? undefined : (disabled || loading)"
    :aria-busy="loading || undefined"
    :class="classes"
  >
    <svg v-if="loading" class="size-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
      <path class="opacity-90" fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2Z" />
    </svg>
    <slot name="icon" />
    <slot />
  </component>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  /** Square button sized for a lone icon. */
  icon?: boolean
  block?: boolean
  to?: string
}>(), {
  variant: 'secondary',
  size: 'md',
  type: 'button',
})

const variants = {
  // The only filled, saturated element on any screen. Used sparingly, it
  // reliably means "this is the thing to click".
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover border border-transparent font-medium',
  secondary: 'bg-raised text-ink border border-line hover:border-line-strong hover:bg-sunken',
  ghost: 'bg-transparent text-muted border border-transparent hover:text-ink hover:bg-raised',
  danger: 'bg-transparent text-negative border border-line hover:bg-negative/10 hover:border-negative/40',
}

const sizes = {
  sm: 'text-xs gap-1.5 h-8',
  md: 'text-sm gap-2 h-9',
}

const padding = { sm: 'px-2.5', md: 'px-3.5' }
const iconPadding = { sm: 'w-8 justify-center', md: 'w-9 justify-center' }

const classes = computed(() => [
  'inline-flex items-center rounded-md transition-colors cursor-pointer select-none whitespace-nowrap',
  'disabled:opacity-45 disabled:pointer-events-none',
  sizes[props.size],
  props.icon ? iconPadding[props.size] : padding[props.size],
  variants[props.variant],
  props.block && 'w-full justify-center',
])
</script>
