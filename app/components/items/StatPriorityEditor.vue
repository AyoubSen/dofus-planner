<script setup lang="ts">
// Where the user says what actually matters on an item.
//
// This is deliberately blunt about consequences. The previous version of this
// control multiplied a weight behind the scenes, which made "critical" feel
// decorative — a listing missing the stat by eight points could still be
// presented as a bargain. High and Critical are now requirements, so each row
// spells out the threshold it enforces and the strip says how many are live.
import { statPriorityPresets } from '~/utils/itemValuation'
import type { StatPriority } from '~/utils/itemValuation'

const props = defineProps<{
  rows: Array<{
    statKey: string
    label: string
    min: number
    max: number
    priority: StatPriority
    requirement: string
    isGating: boolean
  }>
  /** Collapsed by default on the list view, open in the detail panel. */
  dense?: boolean
}>()

const emit = defineEmits<{
  set: [statKey: string, priority: StatPriority]
  reset: []
}>()

const { t } = useI18n()

const options = computed(() =>
  statPriorityPresets.map((preset) => ({
    label: t(`items.detail.priorities.presets.${preset.key}`),
    value: preset.key,
  })))

const gatingCount = computed(() => props.rows.filter((row) => row.isGating).length)

const rangeLabel = (row: { min: number; max: number }) =>
  row.max > row.min ? `${row.min}–${row.max}` : String(row.max)
</script>

<template>
  <section class="rounded-md border border-line bg-raised p-3">
    <header class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-medium text-ink">{{ $t('items.detail.priorities.title') }}</h3>
        <UiBadge v-if="gatingCount" tone="warning">
          {{ $t('items.detail.priorities.gatingNote', { count: gatingCount }) }}
        </UiBadge>
      </div>
      <UiButton v-if="gatingCount" variant="ghost" size="sm" @click="emit('reset')">
        {{ $t('items.detail.priorities.reset') }}
      </UiButton>
    </header>

    <p v-if="!dense" class="mb-3 text-xs text-muted">
      {{ $t('items.detail.priorities.hint') }}
    </p>

    <p v-if="!rows.length" class="text-xs text-subtle">
      {{ $t('items.detail.priorities.noLines') }}
    </p>

    <ul v-else class="flex flex-col gap-1.5">
      <li
        v-for="row in rows"
        :key="row.statKey"
        class="flex flex-wrap items-center justify-between gap-2 rounded-sm px-1 py-1"
        :class="row.isGating && 'bg-warning/5'"
      >
        <div class="flex min-w-0 flex-col">
          <span class="truncate text-sm text-ink">{{ row.label }}</span>
          <span class="text-xs text-subtle">
            {{ rangeLabel(row) }}
            <span v-if="row.requirement" class="text-warning">· {{ row.requirement }}</span>
          </span>
        </div>
        <UiSegmented
          :model-value="row.priority"
          :options="options"
          size="sm"
          :aria-label="row.label"
          @update:model-value="emit('set', row.statKey, $event as StatPriority)"
        />
      </li>
    </ul>
  </section>
</template>
