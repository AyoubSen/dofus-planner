<script setup lang="ts">
import type { TableColumn } from '~/components/ui/Table.vue'

export interface ResultItem {
  name: string
  image_url?: string | null
  count: number
}

const props = defineProps<{
  items: ResultItem[]
  viewMode: 'grid' | 'list' | 'table'
  slotLabel: string
  /** Sessions are per character; without one, "add to session" can't work. */
  canAddToSession: boolean
  /** Share of the slot a single item's count represents. */
  pct: (count: number) => string
  barWidth: (count: number) => string
}>()

defineEmits<{
  'update:viewMode': [value: 'grid' | 'list' | 'table']
  open: [item: ResultItem]
  addToSession: [item: ResultItem]
  openPressure: []
}>()

const { t } = useI18n()

const viewOptions = computed(() => ([
  { label: t('items.viewModes.grid'), value: 'grid' },
  { label: t('items.viewModes.list'), value: 'list' },
  { label: t('items.viewModes.table'), value: 'table' },
]))

// Grid and table show 20, the list view 15 — kept from the original so the
// three modes stay visually comparable at their own densities.
const gridItems = computed(() => props.items.slice(0, 20))
const listItems = computed(() => props.items.slice(0, 15))

const columns = computed<TableColumn[]>(() => ([
  { key: 'rank', label: '#', width: '3rem' },
  { key: 'image', label: '', width: '3rem' },
  { key: 'name', label: t('items.table.name') },
  { key: 'count', label: t('items.table.count'), align: 'right' },
  { key: 'pct', label: '%', align: 'right' },
  { key: 'distribution', label: t('items.table.distribution') },
  { key: 'action', label: t('items.craftFm'), align: 'right' },
]))
</script>

<template>
  <UiPageSection :title="$t('items.mostUsed', { slot: slotLabel })">
    <template #actions>
      <UiButton size="sm" @click="$emit('openPressure')">
        {{ $t('items.recipePressure') }}
      </UiButton>
      <UiSegmented
        :model-value="viewMode"
        :options="viewOptions"
        size="sm"
        :aria-label="$t('items.viewModes.grid')"
        @update:model-value="$emit('update:viewMode', $event as 'grid' | 'list' | 'table')"
      />
    </template>

    <UiEmptyState v-if="!items.length" :title="$t('items.noData')">
      <template #icon><UiIcon name="items" /></template>
    </UiEmptyState>

    <!-- Grid -->
    <div
      v-else-if="viewMode === 'grid'"
      class="grid gap-2"
      style="grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr))"
    >
      <article
        v-for="(item, index) in gridItems"
        :key="item.name"
        class="flex cursor-pointer flex-col gap-2 rounded-lg border border-line bg-surface p-3 transition-colors hover:border-line-strong"
        @click="$emit('open', item)"
      >
        <div class="flex items-start gap-2">
          <span class="tabular text-xs text-subtle">#{{ index + 1 }}</span>
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="''"
            class="ml-auto size-10 shrink-0 rounded-md bg-sunken object-contain"
          >
          <div v-else class="ml-auto size-10 shrink-0 rounded-md bg-sunken" />
        </div>

        <div class="min-w-0">
          <div class="truncate text-sm font-medium text-ink" :title="item.name">{{ item.name }}</div>
          <div class="tabular text-xs text-subtle">{{ item.count }} · {{ pct(item.count) }}%</div>
        </div>

        <UiProgress :value="Number.parseFloat(barWidth(item.count))" />

        <UiButton
          size="sm"
          block
          :disabled="!canAddToSession"
          @click.stop="$emit('addToSession', item)"
        >
          {{ $t('items.addToSession') }}
        </UiButton>
      </article>
    </div>

    <!-- List -->
    <div v-else-if="viewMode === 'list'" class="flex flex-col gap-1">
      <div
        v-for="(item, index) in listItems"
        :key="item.name"
        class="flex cursor-pointer items-center gap-3 rounded-md border border-line bg-surface p-2 transition-colors hover:border-line-strong"
        @click="$emit('open', item)"
      >
        <span class="tabular w-8 shrink-0 text-xs text-subtle">#{{ index + 1 }}</span>
        <img
          v-if="item.image_url"
          :src="item.image_url"
          :alt="''"
          class="size-8 shrink-0 rounded-md bg-sunken object-contain"
        >
        <div v-else class="size-8 shrink-0 rounded-md bg-sunken" />
        <span class="min-w-0 flex-1 truncate text-sm text-ink">{{ item.name }}</span>
        <div class="hidden w-32 shrink-0 sm:block">
          <UiProgress :value="Number.parseFloat(barWidth(item.count))" />
        </div>
        <UiButton
          size="sm"
          :disabled="!canAddToSession"
          @click.stop="$emit('addToSession', item)"
        >
          {{ $t('v2.brisage.actions.add') }}
        </UiButton>
        <span class="tabular w-12 shrink-0 text-right text-sm text-ink">{{ item.count }}</span>
        <span class="tabular w-14 shrink-0 text-right text-xs text-subtle">{{ pct(item.count) }}%</span>
      </div>
    </div>

    <!-- Table -->
    <UiTable v-else :columns="columns">
      <tr
        v-for="(item, index) in gridItems"
        :key="item.name"
        class="cursor-pointer border-t border-line transition-colors hover:bg-sunken"
        @click="$emit('open', item)"
      >
        <td class="tabular px-3 py-2.5 text-subtle">{{ index + 1 }}</td>
        <td class="px-3 py-2.5">
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="''"
            class="size-8 rounded-md bg-sunken object-contain"
          >
          <div v-else class="size-8 rounded-md bg-sunken" />
        </td>
        <td class="px-3 py-2.5 text-ink">{{ item.name }}</td>
        <td class="tabular px-3 py-2.5 text-right">{{ item.count }}</td>
        <td class="tabular px-3 py-2.5 text-right text-subtle">{{ pct(item.count) }}%</td>
        <td class="px-3 py-2.5"><UiProgress :value="Number.parseFloat(barWidth(item.count))" /></td>
        <td class="px-3 py-2.5 text-right">
          <UiButton
            size="sm"
            :disabled="!canAddToSession"
            @click.stop="$emit('addToSession', item)"
          >
            {{ $t('v2.brisage.actions.add') }}
          </UiButton>
        </td>
      </tr>
    </UiTable>
  </UiPageSection>
</template>
