<script setup lang="ts">
// Every listing saved for the open item, plus the optional valuation table.
export interface ObservationBadge {
  label: string
  tone: 'good' | 'bad' | 'warn' | 'neutral'
}

defineProps<{
  observations: any[]
  expanded: boolean
  sortMode: string
  valuationMap: Record<string, any>
  valuations: any[]
  displayedValuations: any[]
  bestBuy: any | null
  badgesFor: (observation: any) => ObservationBadge[]
  freshnessFor: (createdAt: string) => string
  trackedIds: Set<string>
  /** Tracker entries are per character; without one, nothing can be sent. */
  canTrack: boolean
  valuationConfidence: { level: string; label: string; details: string }
  valuationModeSummary: string
  onlyUndervalued: boolean
  fullSweep: boolean
  showTable: boolean
  /** Row whose inline stats capture is open, if any. */
  captureRowId: string
  statsLoading: boolean
  formatKamas: (value: number) => string
}>()

const emit = defineEmits<{
  'update:expanded': [value: boolean]
  'update:sortMode': [value: string]
  'update:onlyUndervalued': [value: boolean]
  'update:fullSweep': [value: boolean]
  'update:showTable': [value: boolean]
  'update:captureRowId': [value: string]
  useAsSellPrice: [price: number]
  openDetail: [id: string]
  statsImage: [id: string, dataUrl: string]
  sendToTracker: [observation: any]
  remove: [id: string]
  removeAll: []
  /** Dump this item's listings and their valuations to a file. */
  export: []
}>()

const { t } = useI18n()

const sectionEl = ref<HTMLElement | null>(null)
defineExpose({ sectionEl })

const sortOptions = computed(() => ([
  { label: t('items.detail.observed.sort.newest'), value: 'newest' },
  { label: t('items.detail.observed.sort.priceAsc'), value: 'price_asc' },
  { label: t('items.detail.observed.sort.priceDesc'), value: 'price_desc' },
  { label: t('items.detail.observed.sort.netProfit'), value: 'net_profit' },
  { label: t('items.detail.observed.sort.quality'), value: 'quality' },
  { label: t('items.detail.observed.sort.bestBuy'), value: 'best_buy' },
]))

const badgeTone = (tone: ObservationBadge['tone']) =>
  tone === 'good' ? 'positive' : tone === 'bad' ? 'negative' : tone === 'warn' ? 'warning' : 'neutral'

const valuationColumns = computed(() => ([
  { key: 'price', label: t('items.detail.valuation.peerTable.price'), align: 'right' as const },
  { key: 'score', label: t('items.detail.valuation.peerTable.score'), align: 'right' as const },
  { key: 'fair', label: t('items.detail.valuation.fairValue'), align: 'right' as const },
  { key: 'net', label: t('items.detail.valuation.netProfit'), align: 'right' as const },
  { key: 'edge', label: t('items.detail.valuation.edge.label'), align: 'right' as const },
  { key: 'quick', label: t('items.detail.observed.relist.quick'), align: 'right' as const },
  { key: 'fairRelist', label: t('items.detail.observed.relist.fair'), align: 'right' as const },
  { key: 'greedy', label: t('items.detail.observed.relist.greedy'), align: 'right' as const },
]))
</script>

<template>
  <div ref="sectionEl" class="flex flex-col gap-3">
    <UiCard :title="$t('items.detail.observed.listTitle')">
      <template #actions>
        <UiSegmented
          :model-value="sortMode"
          :options="sortOptions"
          size="sm"
          :aria-label="$t('items.detail.observed.sort.label')"
          @update:model-value="emit('update:sortMode', String($event))"
        />
        <UiButton variant="ghost" size="sm" @click="emit('update:expanded', !expanded)">
          {{ expanded ? $t('items.detail.common.collapse') : $t('items.detail.common.expand') }}
        </UiButton>
        <UiButton variant="ghost" size="sm" @click="emit('export')">
          {{ $t('items.detail.observed.actions.export') }}
        </UiButton>
        <UiButton variant="danger" size="sm" @click="emit('removeAll')">
          {{ $t('items.detail.observed.actions.removeAll') }}
        </UiButton>
      </template>

      <!-- One actionable line, only when there is something to act on. -->
      <div
        v-if="bestBuy"
        class="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-line bg-sunken px-3 py-2"
      >
        <p class="min-w-0 flex-1 text-sm text-ink">
          {{ $t('items.detail.nextStep.best', {
            buy: formatKamas(bestBuy.price),
            relist: formatKamas(bestBuy.fairRelist),
          }) }}
        </p>
        <UiButton
          variant="primary"
          size="sm"
          :disabled="trackedIds.has(bestBuy.id) || !canTrack"
          @click="emit('sendToTracker', bestBuy)"
        >
          {{ trackedIds.has(bestBuy.id)
            ? $t('items.detail.observed.actions.tracked')
            : $t('items.detail.nextStep.trackBest') }}
        </UiButton>
      </div>

      <div v-show="expanded" class="flex flex-col gap-2">
        <article
          v-for="observation in observations"
          :key="observation.id"
          class="rounded-md border border-line bg-surface p-2.5"
        >
          <div class="flex flex-wrap items-start gap-3">
            <button
              type="button"
              class="tabular shrink-0 rounded-md border border-line bg-sunken px-2.5 py-1.5 text-sm text-ink transition-colors hover:border-line-strong"
              @click="emit('useAsSellPrice', observation.price)"
            >
              {{ formatKamas(observation.price) }}
            </button>

            <div class="min-w-0 flex-1">
              <p class="text-xs text-subtle">
                {{ freshnessFor(observation.createdAt) }}
                <!--
                  The first price on an item goes in with nothing to check it
                  against, and then becomes the baseline every later price is
                  judged by. Saying so is the difference between a number that
                  was examined and one that merely was not caught.
                -->
                <span
                  v-if="observation.priceUnverified"
                  class="ml-1 rounded bg-warning/15 px-1 text-[10px] font-medium uppercase text-warning"
                  :title="$t('items.detail.observed.unverifiedPriceHint')"
                >{{ $t('items.detail.observed.unverifiedPrice') }}</span>
                <!--
                  Only the statistical reader produced this number, after the
                  deterministic one declined. It is kept and shown, but it does
                  not price anything until a human confirms it.
                -->
                <span
                  v-if="observation.priceTrust === 'proposed'"
                  class="ml-1 rounded bg-negative/15 px-1 text-[10px] font-medium uppercase text-negative"
                  :title="$t('items.detail.observed.proposedPriceHint')"
                >{{ $t('items.detail.observed.proposedPrice') }}</span>
              </p>

              <div v-if="badgesFor(observation).length" class="mt-1 flex flex-wrap gap-1">
                <UiBadge
                  v-for="badge in badgesFor(observation)"
                  :key="`${observation.id}-${badge.label}`"
                  :tone="badgeTone(badge.tone)"
                >
                  {{ badge.label }}
                </UiBadge>
              </div>

              <div v-if="valuationMap[observation.id]" class="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-subtle">
                <span class="tabular">
                  {{ $t('items.detail.observed.relist.quick') }} {{ formatKamas(valuationMap[observation.id].quickRelist) }}
                </span>
                <span class="tabular">
                  {{ $t('items.detail.observed.relist.fair') }} {{ formatKamas(valuationMap[observation.id].fairRelist) }}
                </span>
                <span class="tabular">
                  {{ $t('items.detail.observed.relist.greedy') }} {{ formatKamas(valuationMap[observation.id].greedyRelist) }}
                </span>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-1.5">
              <!-- Stats without leaving the list: arm this row, then paste. -->
              <UiButton
                size="sm"
                :variant="captureRowId === observation.id ? 'primary' : 'secondary'"
                @click="emit('update:captureRowId', captureRowId === observation.id ? '' : observation.id)"
              >
                {{ observation.statsEntries.length
                  ? $t('items.detail.observed.actions.viewStats')
                  : $t('items.detail.observed.actions.addStats') }}
              </UiButton>
              <UiButton
                variant="primary"
                size="sm"
                :disabled="trackedIds.has(observation.id) || !canTrack"
                @click="emit('sendToTracker', observation)"
              >
                {{ trackedIds.has(observation.id)
                  ? $t('items.detail.observed.actions.tracked')
                  : $t('items.detail.observed.actions.trackResale') }}
              </UiButton>
              <UiButton
                variant="danger"
                size="sm"
                icon
                :aria-label="$t('items.detail.common.remove')"
                @click="emit('remove', observation.id)"
              >
                <UiIcon name="trash" />
              </UiButton>
            </div>
          </div>

          <div v-if="captureRowId === observation.id" class="mt-2.5 flex flex-col gap-2 border-t border-line pt-2.5">
            <UiDropZone
              size="sm"
              :label="$t('items.detail.capture.stats')"
              :loading="statsLoading"
              @image="emit('statsImage', observation.id, $event)"
            />
            <UiButton
              v-if="observation.statsEntries.length"
              variant="ghost"
              size="sm"
              @click="emit('openDetail', observation.id)"
            >
              {{ $t('items.detail.capture.openStats', { count: observation.statsEntries.length }) }}
            </UiButton>
          </div>
        </article>
      </div>
    </UiCard>

    <UiCard v-if="valuations.length >= 2 && expanded" :title="$t('items.detail.valuation.listingTitle')">
      <template #actions>
        <UiBadge :tone="valuationConfidence.level === 'high' ? 'positive' : valuationConfidence.level === 'medium' ? 'warning' : 'neutral'">
          {{ valuationConfidence.label }}
        </UiBadge>
        <UiButton size="sm" @click="emit('update:showTable', !showTable)">
          {{ showTable
            ? $t('items.detail.advancedValuation.hide')
            : $t('items.detail.advancedValuation.show') }}
        </UiButton>
      </template>

      <p class="mb-2 text-xs text-muted">{{ valuationModeSummary }}</p>

      <template v-if="showTable">
        <UiToolbar>
          <template #filters>
            <label class="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                class="size-4 accent-[var(--c-accent)]"
                :checked="onlyUndervalued"
                @change="emit('update:onlyUndervalued', !onlyUndervalued)"
              >
              {{ $t('items.detail.valuation.buyCandidatesOnly') }}
            </label>
            <!-- Only an exhaustive capture licenses reading a vanished listing
                 as a sale, so the claim is the user's to make. -->
            <label class="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                class="size-4 accent-[var(--c-accent)]"
                :checked="fullSweep"
                @change="emit('update:fullSweep', !fullSweep)"
              >
              {{ $t('items.detail.valuation.fullSweep') }}
            </label>
          </template>
        </UiToolbar>

        <UiEmptyState
          v-if="!displayedValuations.length"
          :title="$t('items.detail.valuation.noFilteredListings')"
        />

        <UiTable v-else :columns="valuationColumns">
          <tr v-for="row in displayedValuations" :key="`valuation-${row.id}`" class="border-t border-line">
            <td class="tabular px-3 py-2 text-right text-ink">{{ formatKamas(row.price) }}</td>
            <td class="tabular px-3 py-2 text-right">{{ row.score.toFixed(2) }}</td>
            <td class="tabular px-3 py-2 text-right">{{ formatKamas(row.fairValue) }}</td>
            <!-- Net of the sale tax: what the flip is actually worth. -->
            <td
              class="tabular px-3 py-2 text-right"
              :class="row.netProfit > 0 ? 'text-positive' : row.netProfit < 0 ? 'text-negative' : ''"
            >
              {{ row.netProfit > 0 ? '+' : '' }}{{ formatKamas(row.netProfit) }}
            </td>
            <!-- A gap only counts once it clears the segment's own scatter. -->
            <td class="tabular px-3 py-2 text-right" :class="row.isDeal ? 'text-positive' : 'text-subtle'">
              {{ row.edgeRatio.toFixed(2) }}x
            </td>
            <td class="tabular px-3 py-2 text-right text-subtle">{{ formatKamas(row.quickRelist) }}</td>
            <td class="tabular px-3 py-2 text-right text-subtle">{{ formatKamas(row.fairRelist) }}</td>
            <td class="tabular px-3 py-2 text-right text-subtle">{{ formatKamas(row.greedyRelist) }}</td>
          </tr>
        </UiTable>
      </template>
    </UiCard>
  </div>
</template>
