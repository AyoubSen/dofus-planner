<template>
  <nav v-if="totalPages > 1" class="flex items-center justify-center gap-2 py-3" :aria-label="$t('v2.common.pagination')">
    <UiButton size="sm" icon :disabled="page <= 1" :aria-label="$t('v2.common.previous')" @click="$emit('update:page', page - 1)">
      <UiIcon name="chevronLeft" />
    </UiButton>
    <span class="tabular text-sm text-muted">{{ page }} / {{ totalPages }}</span>
    <UiButton size="sm" icon :disabled="page >= totalPages" :aria-label="$t('v2.common.next')" @click="$emit('update:page', page + 1)">
      <UiIcon name="chevronRight" />
    </UiButton>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  page: number
  totalPages: number
}>()

defineEmits<{ 'update:page': [page: number] }>()
</script>
