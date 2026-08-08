<script setup lang="ts">
// One saved listing, opened up: its exact stats (typed or OCR'd) and the
// explanation of how those stats produced a fair value.
defineProps<{
  observation: any
  detailTab: 'stats' | 'explain'
  statsHealth: any
  statOptions: { key: string; label: string }[]
  explanation: any
  statsOcr: { isLoading: boolean; error: string }
  isTracked: boolean
  /** Tracker entries are per character; without one, nothing can be sent. */
  canTrack: boolean
  feedback: string
  formatKamas: (value: number) => string
}>()

const emit = defineEmits<{
  back: []
  'update:detailTab': [value: 'stats' | 'explain']
  useAsSellPrice: [price: number]
  sendToTracker: []
  addExpectedStat: [key: string]
  addStatEntry: []
  updateStatKey: [index: number, key: string]
  updateStatValue: [index: number, value: string]
  removeStatEntry: [index: number]
}>()

const { t } = useI18n()

const tabOptions = computed(() => ([
  { label: t('items.detail.observed.tabs.stats'), value: 'stats' },
  { label: t('items.detail.observed.tabs.explain'), value: 'explain' },
]))

// The page scrolls here after adding an expected stat, so it needs the node.
const exactStatsEl = ref<HTMLElement | null>(null)
defineExpose({ exactStatsEl })

const healthSections = [
  { key: 'unmatchedOfficial', label: 'unmatchedOfficial' },
  { key: 'missing', label: 'missing' },
  { key: 'unexpected', label: 'unexpected' },
  { key: 'duplicates', label: 'duplicates' },
  { key: 'incomplete', label: 'incomplete' },
] as const

const hasHealthIssues = (health: any) =>
  healthSections.some(section => health?.[section.key]?.length)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <UiButton variant="ghost" size="sm" @click="emit('back')">
        <template #icon><UiIcon name="chevronLeft" /></template>
        {{ $t('items.detail.observed.backToList') }}
      </UiButton>
      <span class="text-xs tracking-wide text-subtle uppercase">{{ $t('items.detail.observed.kicker') }}</span>
    </div>

    <UiCard>
      <div class="flex flex-wrap items-start gap-4">
        <div class="min-w-0">
          <p class="text-xs tracking-wide text-subtle uppercase">{{ $t('items.detail.observed.price') }}</p>
          <p class="tabular mt-1 text-xl font-semibold text-ink">{{ formatKamas(observation.price) }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UiButton size="sm" @click="emit('useAsSellPrice', observation.price)">
            {{ $t('items.detail.observed.actions.useAsSellPrice') }}
          </UiButton>
          <UiButton
            variant="primary"
            size="sm"
            :disabled="isTracked || !canTrack"
            @click="emit('sendToTracker')"
          >
            {{ isTracked
              ? $t('items.detail.observed.actions.tracked')
              : $t('items.detail.observed.actions.sendToTracker') }}
          </UiButton>
          <UiButton size="sm" to="/resale">
            {{ $t('items.detail.observed.actions.openTracker') }}
          </UiButton>
        </div>
      </div>

      <p v-if="feedback" class="mt-2 text-xs text-subtle">{{ feedback }}</p>
    </UiCard>

    <UiSegmented
      :model-value="detailTab"
      :options="tabOptions"
      size="sm"
      :aria-label="$t('items.detail.observed.tabs.stats')"
      @update:model-value="emit('update:detailTab', $event as 'stats' | 'explain')"
    />

    <div v-if="statsOcr.isLoading" class="flex flex-col gap-2">
      <UiSkeleton v-for="i in 3" :key="i" height="2.5rem" />
    </div>
    <p v-else-if="statsOcr.error" class="text-xs text-negative">{{ statsOcr.error }}</p>

    <!-- ── Stats ────────────────────────────────────────────────────────── -->
    <template v-if="detailTab === 'stats'">
      <UiCard v-if="hasHealthIssues(statsHealth)" :title="$t('items.detail.observed.statsHealth.title')">
        <template #actions>
          <UiBadge v-if="statsHealth.missing.length" tone="warning">
            {{ statsHealth.missing.length }} {{ $t('items.detail.observed.statsHealth.badges.missing') }}
          </UiBadge>
          <UiBadge v-if="statsHealth.unmatchedOfficial.length">
            {{ statsHealth.unmatchedOfficial.length }} {{ $t('items.detail.observed.statsHealth.badges.unmatchedOfficial') }}
          </UiBadge>
          <UiBadge v-if="statsHealth.unexpected.length">
            {{ statsHealth.unexpected.length }} {{ $t('items.detail.observed.statsHealth.badges.unexpected') }}
          </UiBadge>
          <UiBadge v-if="statsHealth.duplicates.length">
            {{ statsHealth.duplicates.length }} {{ $t('items.detail.observed.statsHealth.badges.duplicateKeys') }}
          </UiBadge>
          <UiBadge v-if="statsHealth.incomplete.length" tone="warning">
            {{ statsHealth.incomplete.length }} {{ $t('items.detail.observed.statsHealth.badges.incomplete') }}
          </UiBadge>
        </template>

        <div v-if="statsHealth.unmatchedOfficial.length" class="mb-3">
          <h4 class="mb-1.5 text-xs font-medium text-muted">
            {{ $t('items.detail.observed.statsHealth.sections.unmatchedOfficial') }}
          </h4>
          <div
            v-for="entry in statsHealth.unmatchedOfficial"
            :key="`official-unmatched-${entry.effectId}-${entry.rawLabel}`"
            class="flex items-center gap-3 border-b border-line py-1.5 last:border-0"
          >
            <span class="min-w-0 flex-1 truncate text-sm text-ink">
              {{ entry.rawLabel }}
              <span v-if="entry.rangeText" class="tabular text-xs text-subtle">{{ entry.rangeText }}</span>
            </span>
            <span class="tabular shrink-0 text-xs text-subtle">effect {{ entry.effectId }}</span>
          </div>
        </div>

        <div v-if="statsHealth.missing.length" class="mb-3">
          <h4 class="mb-1.5 text-xs font-medium text-muted">
            {{ $t('items.detail.observed.statsHealth.sections.missing') }}
          </h4>
          <div
            v-for="entry in statsHealth.missing"
            :key="`missing-${entry.key}`"
            class="flex items-center gap-3 border-b border-line py-1.5 last:border-0"
          >
            <span class="min-w-0 flex-1 truncate text-sm text-ink">
              {{ entry.label }}
              <span v-if="entry.rangeText" class="tabular text-xs text-subtle">{{ entry.rangeText }}</span>
            </span>
            <UiButton size="sm" @click="emit('addExpectedStat', entry.key)">
              {{ $t('items.detail.observed.statsHealth.actions.add') }}
            </UiButton>
          </div>
        </div>

        <div v-if="statsHealth.unexpected.length" class="mb-3">
          <h4 class="mb-1.5 text-xs font-medium text-muted">
            {{ $t('items.detail.observed.statsHealth.sections.unexpected') }}
          </h4>
          <div
            v-for="entry in statsHealth.unexpected"
            :key="`unexpected-${entry.index}`"
            class="flex items-center gap-3 border-b border-line py-1.5 last:border-0"
          >
            <span class="min-w-0 flex-1 truncate text-sm text-ink">{{ entry.label }}</span>
            <span class="shrink-0 text-xs text-subtle">
              {{ $t('items.detail.observed.statsHealth.reviewOrRemove') }}
            </span>
          </div>
        </div>

        <div v-if="statsHealth.duplicates.length" class="mb-3">
          <h4 class="mb-1.5 text-xs font-medium text-muted">
            {{ $t('items.detail.observed.statsHealth.sections.duplicates') }}
          </h4>
          <div
            v-for="entry in statsHealth.duplicates"
            :key="`duplicate-${entry.key}`"
            class="flex items-center gap-3 border-b border-line py-1.5 last:border-0"
          >
            <span class="min-w-0 flex-1 truncate text-sm text-ink">{{ entry.label }}</span>
            <span class="shrink-0 text-xs text-subtle">
              {{ $t('items.detail.observed.statsHealth.entryCount', { count: entry.count }) }}
            </span>
          </div>
        </div>

        <div v-if="statsHealth.incomplete.length">
          <h4 class="mb-1.5 text-xs font-medium text-muted">
            {{ $t('items.detail.observed.statsHealth.sections.incomplete') }}
          </h4>
          <div
            v-for="entry in statsHealth.incomplete"
            :key="`incomplete-${entry.index}`"
            class="flex items-center gap-3 border-b border-line py-1.5 last:border-0"
          >
            <span class="min-w-0 flex-1 truncate text-sm text-ink">{{ entry.label }}</span>
            <span class="shrink-0 text-xs text-subtle">
              {{ $t('items.detail.observed.statsHealth.missingValue') }}
            </span>
          </div>
        </div>
      </UiCard>

      <div ref="exactStatsEl">
        <UiCard :title="$t('items.detail.observed.exactStats.title')">
          <template #actions>
            <UiButton size="sm" @click="emit('addStatEntry')">
              {{ $t('items.detail.observed.exactStats.add') }}
            </UiButton>
          </template>

          <UiEmptyState
            v-if="!observation.statsEntries.length"
            :title="$t('items.detail.observed.exactStats.empty')"
          />

          <div v-else class="flex flex-col gap-2">
            <div
              v-for="(entry, index) in observation.statsEntries"
              :key="`${observation.id}-entry-${index}`"
              class="flex flex-wrap items-center gap-2"
            >
              <UiSelect
                v-if="entry.isManual"
                :model-value="entry.key"
                :options="statOptions.map(o => ({ key: o.key, label: o.label, value: o.key }))"
                size="sm"
                class="min-w-0 flex-1"
                :aria-label="$t('items.detail.observed.exactStats.title')"
                @update:model-value="emit('updateStatKey', index, String($event))"
              />
              <div v-else class="min-w-0 flex-1 truncate text-sm text-ink">
                {{ entry.label }}
                <span v-if="entry.rangeText" class="tabular text-xs text-subtle">{{ entry.rangeText }}</span>
              </div>

              <div class="flex w-32 shrink-0 items-center gap-1">
                <UiInput
                  :model-value="entry.value ?? ''"
                  type="number"
                  size="sm"
                  :aria-label="entry.label"
                  @update:model-value="emit('updateStatValue', index, $event)"
                />
                <span v-if="entry.suffix" class="text-xs text-subtle">{{ entry.suffix }}</span>
              </div>

              <UiButton
                variant="danger"
                size="sm"
                icon
                :aria-label="$t('items.detail.common.remove')"
                @click="emit('removeStatEntry', index)"
              >
                <UiIcon name="trash" />
              </UiButton>
            </div>
          </div>
        </UiCard>
      </div>

      <UiCard v-if="observation.statsRawText" :title="$t('items.detail.observed.rawText')">
        <pre class="overflow-x-auto rounded-md bg-sunken p-2 text-xs whitespace-pre-wrap text-muted">{{ observation.statsRawText }}</pre>
      </UiCard>
    </template>

    <!-- ── Explanation ──────────────────────────────────────────────────── -->
    <template v-else>
      <UiEmptyState v-if="!explanation" :title="$t('items.detail.valuation.notEnoughData')">
        <template #icon><UiIcon name="prices" /></template>
      </UiEmptyState>

      <template v-else>
        <UiStatRow min="9rem">
          <UiStat :label="$t('items.detail.valuation.model')" :value="explanation.methodLabel" />
          <UiStat :label="$t('items.detail.valuation.score')" :value="explanation.score.toFixed(2)" />
          <UiStat :label="$t('items.detail.valuation.fairValue')">
            <span class="tabular text-xl font-semibold text-ink">{{ formatKamas(explanation.fairValue) }}</span>
          </UiStat>
          <UiStat :label="$t('items.detail.valuation.delta')">
            <!-- A negative delta means the listing sits under fair value: good
                 for a buyer, so it reads positive here. -->
            <span
              class="tabular text-xl font-semibold"
              :class="explanation.delta < 0 ? 'text-positive' : explanation.delta > 0 ? 'text-negative' : 'text-ink'"
            >
              {{ explanation.delta > 0 ? '+' : '' }}{{ formatKamas(explanation.delta) }}
            </span>
          </UiStat>
          <UiStat :label="explanation.referenceLabel" :value="explanation.referenceDisplay" />
        </UiStatRow>

        <UiCard :title="$t('items.detail.valuation.scoreBuildTitle')">
          <template #actions>
            <span class="text-xs text-subtle">{{ $t('items.detail.valuation.scoreBuildHint') }}</span>
          </template>

          <UiTable :columns="[
            { key: 'stat', label: $t('items.detail.valuation.table.stat') },
            { key: 'value', label: $t('items.detail.valuation.table.value'), align: 'right' },
            { key: 'range', label: $t('items.detail.valuation.table.range'), align: 'right' },
            { key: 'progress', label: $t('items.detail.valuation.table.progress'), align: 'right' },
            { key: 'weight', label: $t('items.detail.valuation.table.weight'), align: 'right' },
            { key: 'contribution', label: $t('items.detail.valuation.table.contribution'), align: 'right' },
          ]">
            <tr
              v-for="row in explanation.contributions"
              :key="`${observation.id}-${row.index}-${row.key}`"
              class="border-t border-line"
            >
              <td class="px-3 py-2 text-ink">
                {{ row.label }}
                <span v-if="row.overmageAmount > 0" class="tabular text-xs text-subtle">
                  +{{ row.overmageAmount }} {{ $t('items.detail.valuation.overmage') }}
                </span>
              </td>
              <td class="tabular px-3 py-2 text-right">{{ row.value ?? '—' }}{{ row.suffix }}</td>
              <td class="tabular px-3 py-2 text-right text-subtle">{{ row.rangeText || '—' }}</td>
              <td class="tabular px-3 py-2 text-right">{{ row.progress.toFixed(2) }}</td>
              <td class="tabular px-3 py-2 text-right">{{ row.weight.toFixed(2) }}</td>
              <td class="tabular px-3 py-2 text-right">{{ row.contribution.toFixed(2) }}</td>
            </tr>
          </UiTable>
        </UiCard>

        <UiCard :title="$t('items.detail.valuation.comparablesTitle')">
          <template #actions>
            <span class="text-xs text-subtle">
              {{ $t('items.detail.valuation.peersSummary', { count: explanation.peers.length }) }}
            </span>
          </template>

          <UiEmptyState v-if="!explanation.peers.length" :title="$t('items.detail.valuation.noComparables')" />

          <UiTable v-else :columns="[
            { key: 'price', label: $t('items.detail.valuation.peerTable.price'), align: 'right' },
            { key: 'score', label: $t('items.detail.valuation.peerTable.score'), align: 'right' },
            { key: 'metric', label: explanation.peerMetricLabel, align: 'right' },
            { key: 'distance', label: $t('items.detail.valuation.peerTable.distance'), align: 'right' },
          ]">
            <tr v-for="peer in explanation.peers" :key="peer.id" class="border-t border-line">
              <td class="tabular px-3 py-2 text-right text-ink">{{ formatKamas(peer.price) }}</td>
              <td class="tabular px-3 py-2 text-right">{{ peer.score.toFixed(2) }}</td>
              <td class="tabular px-3 py-2 text-right">{{ peer.metricDisplay }}</td>
              <td class="tabular px-3 py-2 text-right text-subtle">{{ peer.distance.toFixed(2) }}</td>
            </tr>
          </UiTable>
        </UiCard>
      </template>
    </template>
  </div>
</template>
