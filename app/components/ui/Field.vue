<template>
  <div class="min-w-0">
    <label v-if="label" :for="id" class="mb-1 block text-xs font-medium text-muted">
      {{ label }}
      <span v-if="required" class="text-negative" aria-hidden="true">*</span>
    </label>

    <slot :id="id" />

    <p v-if="error" class="mt-1 text-xs text-negative">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-subtle">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  hint?: string
  error?: string
  required?: boolean
}>()

// Exposed to the slot so the caller can wire label -> control without
// inventing an id at every call site.
const id = useId()
</script>
