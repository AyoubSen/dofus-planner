<script setup lang="ts">
// Every listing saved for the open item, plus the optional full valuation
// table. The plain-language recommendation above the list is the part most
// users act on; the table is opt-in.
export interface ObservationBadge {
  label: string
  tone: 'good' | 'bad' | 'warn' | 'neutral'
}

defineProps<{
  observations: any[]
  expanded: boolean
  sortMode: string
  screenshotSummary: { totalCount: number; marketCount: number; statsCount: number }
  valuationMap: Record<string, any>
  valuations: any[]
  displayedValuations: any[]
  bestBuy: any | null
  badgesFor: (observation: any) => ObservationBadge[]
  freshnessFor: (createdAt: string) => string
  trackedIds: Set<string>
  /** Tracker entries are per character; without one, nothing can be sent. */
  canTrack: boolean
  valuationMode: string
  valuationConfidence: { level: string; label: string; details: string }
  valuationModeSummary: string
  onlyUndervalued: boolean
  showTable: boolean
  formatKamas: (value: number) => string
}>()

const emit = defineEmits<{
  'update:expanded': [value: boolean]
  'update:sortMode': [value: string]
  'update:valuationMode': [value: string]
  'update:onlyUndervalued': [value: boolean]
  'update:showTable': [value: boolean]
  useAsSellPrice: [price: number]
  openDetail: [id: string]
  uploadStatsScreenshot: [id: string]
  clearScreenshots: [id: string]
  sendToTracker: [observation: any]
  remove: [id: string]
  clearAllScreenshots: []
  removeAll: []
}>()

const { t } = useI18n()

// The page scrolls here after saving prices or jumping to "best buys".
const sectionEl = ref<HTMLElement | null>(null)
defineExpose({ sectionEl })

const sortOptions = computed(() => ([
  { label: t('items.detail.observed.sort.newest'), value: 'newest' },
  { label: t('items.detail.observed.sort.priceAsc'), value: 'price_asc' },
  { label: t('items.detail.observed.sort.priceDesc'), value: 'price_desc' },
  { label: t('items.detail.observed.sort.delta'), value: 'delta' },
  { label: t('items.detail.observed.sort.bestBuy'), value: 'best_buy' },
]))

const modelOptions = computed(() => ([
  { label: t('items.detail.valuation.models.score'), value: 'score' },
  { label: t('items.detail.valuation.models.comparables'), value: 'comparables' },
  { label: t('items.detail.valuation.models.auto'), value: 'auto' },
]))

const badgeTone = (tone: ObservationBadge['tone']) =>
  tone === 'good' ? 'positive' : tone === 'bad' ? 'negative' : tone === 'warn' ? 'warning' : 'neutral'

const valuationColumns = computed(() => ([
  { key: 'price', label: t('items.detail.valuation.peerTable.price'), align: 'right' as const },
  { key: 'score', label: t('items.detail.valuation.peerTable.score'), align: 'right' as const },
  { key: 'fair', label: t('items.detail.valuation.fairValue'), align: 'right' as const },
  { key: 'delta', label: t('items.detail.valuation.delta'), align: 'right' as const },
  { key: 'quick', label: t('items.detail.observed.relist.quick'), align: 'right' as const },
  { key: 'fairRelist', label: t('items.detail.observed.relist.fair'), align: 'right' as const },
  { key: 'greedy', label: t('items.detail.observed.relist.greedy'), align: 'right' as const },
]))
</script>

<template>
  <div ref="sectionEl" class="flex flex-col gap-3">
    <UiCard :title="$t('items.detail.observed.listTitle')">
      <template #actions>
        <UiButton variant="ghost" size="sm" @click="emit('update:expanded', !expanded)">
          {{ expanded ? $t('items.detail.common.collapse') : $t('items.detail.common.expand') }}
        </UiButton>
      </template>

      <UiToolbar>
        <template #filters>
          <span class="text-xs text-subtle">{{ $t('items.detail.observed.sort.label') }}</span>
          <UiSegmented
            :model-value="sortMode"
            :options="sortOptions"
            size="sm"
            :aria-label="$t('items.detail.observed.sort.label')"
            @update:model-value="emit('update:sortMode', String($event))"
          />
        </template>
        <template #actions>
          <UiButton
            v-if="screenshotSummary.totalCount"
            size="sm"
            @click="emit('clearAllScreenshots')"
          >
            {{ $t('items.detail.observed.actions.clearScreenshots') }}
          </UiButton>
          <UiButton variant="danger" size="sm" @click="emit('removeAll')">
            {{ $t('items.detail.observed.actions.removeAll') }}
          </UiButton>
        </template>
        <template #extra>
          <span class="text-xs text-subtle">
            {{ $t('items.detail.observed.savedCount', { count: observations.length }) }}
          </span>
          <span v-if="screenshotSummary.totalCount" class="text-xs text-subtle">
            {{ $t('items.detail.observed.screenshotSummary', {
              market: screenshotSummary.marketCount,
              stats: screenshotSummary.statsCount,
            }) }}
          </span>
        </template>
      </UiToolbar>

      <!-- Plain-language recommendation -->
      <div class="flex flex-wrap items-center gap-3 rounded-md border border-line bg-sunken p-3">
        <div class="min-w-0 flex-1">
          <p class="text-xs tracking-wide text-subtle uppercase">{{ $t('items.detail.nextStep.eyebrow') }}</p>
          <p class="mt-0.5 text-sm font-medium text-ink">
            <template v-if="bestBuy">
              {{ $t('items.detail.nextStep.best', {
                buy: formatKamas(bestBuy.price),
                relist: formatKamas(bestBuy.fairRelist),
              }) }}
            </template>
            <template v-else-if="valuations.length >= 2">{{ $t('items.detail.nextStep.noneYet') }}</template>
            <template v-else>{{ $t('items.detail.nextStep.needMore') }}</template>
          </p>
          <p class="mt-0.5 text-xs text-subtle">{{ $t('items.detail.nextStep.hint') }}</p>
        </div>
        <UiButton
          v-if="bestBuy"
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

      <!-- Listings -->
      <div v-show="expanded" class="mt-3 flex flex-col gap-2">
        <article
          v-for="observation in observations"
          :key="observation.id"
          class="flex flex-wrap items-start gap-3 rounded-md border border-line bg-surface p-2.5"
        >
          <button
            type="button"
            class="tabular shrink-0 rounded-md border border-line bg-sunken px-2.5 py-1.5 text-sm text-ink transition-colors hover:border-line-strong"
            @click="emit('useAsSellPrice', observation.price)"
          >
            {{ formatKamas(observation.price) }}
          </button>

          <div class="min-w-0 flex-1">
            <p class="text-xs text-subtle">{{ freshnessFor(observation.createdAt) }}</p>

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
              <span>{{ $t('items.detail.observed.relist.label') }}</span>
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
            <UiButton
              v-if="observation.marketScreenshotDataUrl || observation.statsScreenshotDataUrl"
              size="sm"
              @click="emit('clearScreenshots', observation.id)"
            >
              {{ $t('items.detail.observed.actions.clearScreenshots') }}
            </UiButton>
            <UiButton size="sm" @click="emit('openDetail', observation.id)">
              {{ observation.statsEntries.length
                ? $t('items.detail.observed.actions.viewStats')
                : $t('items.detail.observed.actions.addStats') }}
            </UiButton>
            <UiButton size="sm" @click="emit('uploadStatsScreenshot', observation.id)">
              {{ observation.statsScreenshotDataUrl
                ? $t('items.detail.observed.actions.replaceStatsScreenshot')
                : $t('items.detail.observed.actions.addStatsScreenshot') }}
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
            <UiButton size="sm" to="/resale">
              {{ $t('items.detail.observed.actions.openTracker') }}
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
        </article>
      </div>
    </UiCard>

    <!-- Opt-in valuation table -->
    <template v-if="valuations.length >= 2 && expanded">
      <div class="flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface p-3">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-ink">{{ $t('items.detail.advancedValuation.title') }}</p>
          <p class="mt-0.5 text-xs text-subtle">{{ $t('items.detail.advancedValuation.hint') }}</p>
        </div>
        <UiButton size="sm" @click="emit('update:showTable', !showTable)">
          {{ showTable
            ? $t('items.detail.advancedValuation.hide')
            : $t('items.detail.advancedValuation.show') }}
        </UiButton>
      </div>

      <UiCard v-if="showTable" :title="$t('items.detail.valuation.listingTitle')">
        <template #actions>
          <UiBadge :tone="valuationConfidence.level === 'high' ? 'positive' : 'warning'">
            {{ valuationConfidence.label }}
          </UiBadge>
        </template>

        <UiToolbar>
          <template #filters>
            <span class="text-xs text-subtle">{{ $t('items.detail.valuation.model') }}</span>
            <UiSegmented
              :model-value="valuationMode"
              :options="modelOptions"
              size="sm"
              :aria-label="$t('items.detail.valuation.model')"
              @update:model-value="emit('update:valuationMode', String($event))"
            />
            <label class="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                class="size-4 accent-[var(--c-accent)]"
                :checked="onlyUndervalued"
                @change="emit('update:onlyUndervalued', !onlyUndervalued)"
              >
              {{ $t('items.detail.valuation.buyCandidatesOnly') }}
            </label>
          </template>
          <template #extra>
            <span class="text-xs text-subtle">
              {{ $t('items.detail.valuation.summary', { count: valuations.length, mode: valuationModeSummary }) }}
            </span>
            <span class="text-xs text-subtle">{{ valuationConfidence.details }}</span>
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
            <!-- Below fair value is the buy signal, so a negative delta is green. -->
            <td
              class="tabular px-3 py-2 text-right"
              :class="row.delta < 0 ? 'text-positive' : row.delta > 0 ? 'text-negative' : ''"
            >
              {{ row.delta > 0 ? '+' : '' }}{{ formatKamas(row.delta) }}
            </td>
            <td class="tabular px-3 py-2 text-right text-subtle">{{ formatKamas(row.quickRelist) }}</td>
            <td class="tabular px-3 py-2 text-right text-subtle">{{ formatKamas(row.fairRelist) }}</td>
            <td class="tabular px-3 py-2 text-right text-subtle">{{ formatKamas(row.greedyRelist) }}</td>
          </tr>
        </UiTable>

        <p class="mt-3 text-xs text-subtle">{{ $t('items.detail.valuation.note') }}</p>
      </UiCard>
    </template>
  </div>
</template>
