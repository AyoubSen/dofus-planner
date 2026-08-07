<template>
  <!-- Wide tables scroll inside their own box; the page never scrolls sideways. -->
  <div class="w-full overflow-x-auto rounded-lg border border-line">
    <table class="w-full border-collapse text-sm">
      <thead class="sticky top-0 z-10 bg-surface">
        <tr class="border-b border-line">
          <th
            v-for="col in columns"
            :key="col.key"
            scope="col"
            :class="[
              'px-3 py-2 text-xs font-medium tracking-wide text-subtle uppercase whitespace-nowrap',
              col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
              col.sortable && 'cursor-pointer select-none hover:text-ink',
            ]"
            :aria-sort="ariaSort(col)"
            :style="col.width ? { width: col.width } : undefined"
            @click="col.sortable && $emit('sort', col.key)"
          >
            {{ col.label }}
            <span v-if="col.sortable && sortKey === col.key" aria-hidden="true">{{ sortDesc ? '↓' : '↑' }}</span>
          </th>
        </tr>
      </thead>

      <tbody>
        <slot />
      </tbody>
    </table>

    <div v-if="empty" class="px-3 py-8 text-center text-sm text-subtle">
      <slot name="empty">{{ emptyText || $t('v2.common.noResults') }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface TableColumn {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  width?: string
}

const props = defineProps<{
  columns: TableColumn[]
  sortKey?: string | null
  sortDesc?: boolean
  empty?: boolean
  emptyText?: string
}>()

defineEmits<{ sort: [key: string] }>()

const ariaSort = (col: TableColumn) => {
  if (!col.sortable) return undefined
  if (props.sortKey !== col.key) return 'none'
  return props.sortDesc ? 'descending' : 'ascending'
}
</script>
