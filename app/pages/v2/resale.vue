<template>
  <div class="rs-page">
    <section v-if="!hasContext" class="rs-empty">
      <div class="rs-empty-card">
        <p class="rs-eyebrow">Resale Tracker</p>
        <h1>Select a server and character first</h1>
        <p>
          The tracker is scoped to the active v2 context so buys, listings, and
          sales stay attached to one character.
        </p>
      </div>
    </section>

    <template v-else>
      <section class="rs-hero">
        <div>
          <p class="rs-eyebrow">Resale Tracker</p>
          <h1>Track what you actually tried to flip</h1>
          <p>
            Move entries from watched to bought, listed, sold, or cancelled and
            keep the real outcome next to the model snapshot.
          </p>
        </div>
      </section>

      <section class="rs-stats">
        <article class="rs-stat">
          <span class="rs-stat-label">Tracked</span>
          <strong>{{ filteredEntries.length }}</strong>
        </article>
        <article class="rs-stat">
          <span class="rs-stat-label">Active</span>
          <strong>{{ activeEntries.length }}</strong>
        </article>
        <article class="rs-stat">
          <span class="rs-stat-label">Sold</span>
          <strong>{{ soldEntries.length }}</strong>
        </article>
        <article class="rs-stat">
          <span class="rs-stat-label">Realized P/L</span>
          <strong :class="realizedProfit >= 0 ? 'is-profit' : 'is-loss'">
            {{ formatKamasFull(realizedProfit) }}
          </strong>
        </article>
        <article class="rs-stat">
          <span class="rs-stat-label">Avg hold time</span>
          <strong>{{ formatDuration(averageHoldDurationMs) }}</strong>
        </article>
        <article class="rs-stat">
          <span class="rs-stat-label">Avg on market</span>
          <strong>{{ formatDuration(averageMarketDurationMs) }}</strong>
        </article>
        <article class="rs-stat">
          <span class="rs-stat-label">Avg reprices before sale</span>
          <strong>{{ averageRepricesBeforeSale }}</strong>
        </article>
      </section>

      <section class="rs-toolbar">
        <div class="rs-filters">
          <button
            v-for="filter in statusFilters"
            :key="filter.id"
            type="button"
            class="rs-filter"
            :class="{ 'is-active': statusFilter === filter.id }"
            @click="statusFilter = filter.id"
          >
            <span>{{ filter.label }}</span>
            <strong>{{ filter.count }}</strong>
          </button>
        </div>
      </section>

      <section v-if="visibleEntries.length" class="rs-list">
        <article
          v-for="entry in visibleEntries"
          :key="entry.id"
          class="rs-card"
        >
          <header class="rs-card-head">
            <div class="rs-item">
              <img
                v-if="entry.itemImage"
                :src="entry.itemImage"
                :alt="entry.itemName"
                class="rs-item-image"
              >
              <div>
                <h2>{{ entry.itemName }}</h2>
                <div class="rs-meta">
                  <span class="rs-pill" :class="`is-${entry.status}`">
                    {{ statusLabelMap[entry.status] }}
                  </span>
                  <span>{{ sourceLabel(entry.source) }}</span>
                  <span>{{ formatRelativeDate(entry.updatedAt) }}</span>
                </div>
              </div>
            </div>

            <button type="button" class="rs-remove" @click="removeEntry(entry.id)">
              Remove
            </button>
          </header>

          <div class="rs-grid">
            <label class="rs-field">
              <span>Buy price</span>
              <input
                :value="entry.buyPrice ?? ''"
                type="number"
                min="0"
                step="1"
                @input="updateNumberField(entry, 'buyPrice', ($event.target as HTMLInputElement).value)"
              >
            </label>

            <label class="rs-field">
              <span>List price</span>
              <input
                :value="entry.listPrice ?? ''"
                type="number"
                min="0"
                step="1"
                @input="updateNumberField(entry, 'listPrice', ($event.target as HTMLInputElement).value)"
              >
            </label>

            <label class="rs-field">
              <span>Sold price</span>
              <input
                :value="entry.soldPrice ?? ''"
                type="number"
                min="0"
                step="1"
                @input="updateNumberField(entry, 'soldPrice', ($event.target as HTMLInputElement).value)"
              >
            </label>
          </div>

          <section class="rs-model">
            <div class="rs-model-line">
              <span>Observed</span>
              <strong>{{ formatKamasFull(entry.buyPrice ?? 0) }}</strong>
            </div>
            <div class="rs-model-line">
              <span>Quick target</span>
              <strong>{{ formatKamasOptional(getEstimate(entry, 'estimatedQuickRelistPrice', 'estimatedQuickRelist')) }}</strong>
            </div>
            <div class="rs-model-line">
              <span>Fair target</span>
              <strong>{{ formatKamasOptional(getEstimate(entry, 'estimatedFairRelistPrice', 'estimatedFairValue')) }}</strong>
            </div>
            <div class="rs-model-line">
              <span>Greedy target</span>
              <strong>{{ formatKamasOptional(getEstimate(entry, 'estimatedGreedyRelistPrice', 'estimatedGreedyRelist')) }}</strong>
            </div>
            <div class="rs-model-line">
              <span>Predicted delta</span>
              <strong
                :class="(getEstimate(entry, 'estimatedDelta') ?? 0) >= 0 ? 'is-profit' : 'is-loss'"
              >
                {{ formatKamasOptional(getEstimate(entry, 'estimatedDelta')) }}
              </strong>
            </div>
          </section>

          <section class="rs-actions">
            <button
              type="button"
              class="rs-action"
              :disabled="entry.status === 'bought'"
              @click="setStatus(entry, 'bought')"
            >
              Mark bought
            </button>
            <button
              type="button"
              class="rs-action"
              :disabled="entry.status === 'listed'"
              @click="setStatus(entry, 'listed')"
            >
              Mark listed
            </button>
            <button
              type="button"
              class="rs-action"
              :disabled="entry.status === 'sold'"
              @click="setStatus(entry, 'sold')"
            >
              Mark sold
            </button>
            <button
              type="button"
              class="rs-action is-cancel"
              :disabled="entry.status === 'cancelled'"
              @click="setStatus(entry, 'cancelled')"
            >
              Cancel
            </button>
          </section>

          <section class="rs-adjustments">
            <div class="rs-adjustments-head">
              <div>
                <h3>Price adjustment history</h3>
                <p>Record each relist or price cut instead of overwriting the story.</p>
              </div>

              <button
                type="button"
                class="rs-action"
                :disabled="!canAddAdjustment(entry)"
                @click="addAdjustmentFromCurrentPrice(entry)"
              >
                Add current list price
              </button>
            </div>

            <div v-if="entry.priceAdjustments?.length" class="rs-adjustment-list">
              <article
                v-for="adjustment in [...entry.priceAdjustments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())"
                :key="adjustment.id"
                class="rs-adjustment"
              >
                <div class="rs-adjustment-line">
                  <strong>{{ formatKamasFull(adjustment.fromPrice) }}</strong>
                  <span>&rarr;</span>
                  <strong>{{ formatKamasFull(adjustment.toPrice) }}</strong>
                </div>
                <div class="rs-adjustment-meta">
                  <span>{{ formatRelativeDate(adjustment.createdAt) }}</span>
                  <span v-if="adjustment.reason">{{ adjustment.reason }}</span>
                </div>
              </article>
            </div>

            <p v-else class="rs-adjustment-empty">
              No reprices logged yet.
            </p>

            <div class="rs-grid">
              <label class="rs-field">
                <span>New price</span>
                <input
                  :value="adjustmentDrafts[entry.id]?.toPrice ?? ''"
                  type="number"
                  min="0"
                  step="1"
                  @input="updateAdjustmentDraft(entry.id, 'toPrice', ($event.target as HTMLInputElement).value)"
                >
              </label>

              <label class="rs-field">
                <span>Reason</span>
                <input
                  :value="adjustmentDrafts[entry.id]?.reason ?? ''"
                  type="text"
                  placeholder="Undercut, slow market, urgent sale..."
                  @input="updateAdjustmentDraft(entry.id, 'reason', ($event.target as HTMLInputElement).value)"
                >
              </label>
            </div>

            <button
              type="button"
              class="rs-action"
              :disabled="!canSaveAdjustment(entry)"
              @click="saveAdjustment(entry)"
            >
              Save adjustment
            </button>
          </section>

          <label class="rs-field">
            <span>Notes</span>
            <textarea
              rows="3"
              :value="entry.notes ?? ''"
              @input="updateTextField(entry, 'notes', ($event.target as HTMLTextAreaElement).value)"
            />
          </label>

          <footer class="rs-card-foot">
            <span>
              Realized:
              <strong :class="realizedEntryProfit(entry) >= 0 ? 'is-profit' : 'is-loss'">
                {{ formatKamasFull(realizedEntryProfit(entry)) }}
              </strong>
            </span>
            <span>
              Held {{ formatDuration(getHoldDurationMs(entry)) }}
            </span>
            <span>
              On market {{ formatDuration(getMarketDurationMs(entry)) }}
            </span>
            <span>
              Reprices {{ entry.priceAdjustments?.length ?? 0 }}
            </span>
            <span v-if="entry.soldAt">
              Sold {{ formatRelativeDate(entry.soldAt) }}
            </span>
          </footer>
        </article>
      </section>

      <section v-else class="rs-empty">
        <div class="rs-empty-card">
          <p class="rs-eyebrow">No entries yet</p>
          <h2>Send an observed listing from the items page</h2>
          <p>
            New resale entries start in <strong>watched</strong>, then you can
            move them through the full flip lifecycle here.
          </p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ResaleTrackerEntry, ResaleTrackerStatus } from '~/app/composables/useAppDataStore'
import { useResaleTracker } from '../../../composables/useResaleTracker'

definePageMeta({
  layout: 'v2',
})

const { hasContext, selectedServer, selectedCharacter } = useV2Context()
const { entries, upsertEntry, updateStatus, addPriceAdjustment, removeEntry } = useResaleTracker()

const statusFilter = ref<'all' | ResaleTrackerStatus>('all')
const adjustmentDrafts = ref<Record<string, { toPrice: string, reason: string }>>({})

const statusLabelMap: Record<ResaleTrackerStatus, string> = {
  watched: 'Watched',
  bought: 'Bought',
  listed: 'Listed',
  sold: 'Sold',
  cancelled: 'Cancelled',
}

const filteredEntries = computed(() =>
  entries.value.filter((entry) =>
    entry.serverId === selectedServer.value?.id
    && entry.characterId === selectedCharacter.value?.id,
  ),
)

const activeEntries = computed(() =>
  filteredEntries.value.filter((entry) =>
    entry.status === 'watched'
    || entry.status === 'bought'
    || entry.status === 'listed',
  ),
)

const soldEntries = computed(() =>
  filteredEntries.value.filter((entry) => entry.status === 'sold'),
)

const realizedProfit = computed(() =>
  soldEntries.value.reduce((total, entry) => total + realizedEntryProfit(entry), 0),
)

const averageHoldDurationMs = computed(() =>
  averageDuration(
    soldEntries.value
      .map((entry) => getHoldDurationMs(entry))
      .filter((value): value is number => value != null),
  ),
)

const averageMarketDurationMs = computed(() =>
  averageDuration(
    soldEntries.value
      .map((entry) => getMarketDurationMs(entry))
      .filter((value): value is number => value != null),
  ),
)

const averageRepricesBeforeSale = computed(() => {
  if (!soldEntries.value.length) {
    return 0
  }

  const total = soldEntries.value.reduce(
    (sum, entry) => sum + (entry.priceAdjustments?.length ?? 0),
    0,
  )

  return Number((total / soldEntries.value.length).toFixed(1))
})

const statusFilters = computed(() => [
  { id: 'all' as const, label: 'All', count: filteredEntries.value.length },
  { id: 'watched' as const, label: 'Watched', count: filteredEntries.value.filter((entry) => entry.status === 'watched').length },
  { id: 'bought' as const, label: 'Bought', count: filteredEntries.value.filter((entry) => entry.status === 'bought').length },
  { id: 'listed' as const, label: 'Listed', count: filteredEntries.value.filter((entry) => entry.status === 'listed').length },
  { id: 'sold' as const, label: 'Sold', count: filteredEntries.value.filter((entry) => entry.status === 'sold').length },
  { id: 'cancelled' as const, label: 'Cancelled', count: filteredEntries.value.filter((entry) => entry.status === 'cancelled').length },
])

const visibleEntries = computed(() => {
  const source = statusFilter.value === 'all'
    ? filteredEntries.value
    : filteredEntries.value.filter((entry) => entry.status === statusFilter.value)

  return [...source].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
})

function patchEntry(entry: ResaleTrackerEntry, patch: Partial<ResaleTrackerEntry>) {
  upsertEntry({
    ...entry,
    ...patch,
  })
}

function updateNumberField(
  entry: ResaleTrackerEntry,
  field: 'buyPrice' | 'listPrice' | 'soldPrice',
  raw: string,
) {
  const value = raw.trim()

  patchEntry(entry, {
    [field]: value ? Number(value) : null,
  } as Partial<ResaleTrackerEntry>)
}

function updateTextField(
  entry: ResaleTrackerEntry,
  field: 'notes',
  value: string,
) {
  patchEntry(entry, { [field]: value } as Partial<ResaleTrackerEntry>)
}

function setStatus(entry: ResaleTrackerEntry, status: ResaleTrackerStatus) {
  updateStatus(entry.id, status)
}

function updateAdjustmentDraft(
  entryId: string,
  field: 'toPrice' | 'reason',
  value: string,
) {
  const current = adjustmentDrafts.value[entryId] ?? { toPrice: '', reason: '' }
  adjustmentDrafts.value = {
    ...adjustmentDrafts.value,
    [entryId]: {
      ...current,
      [field]: value,
    },
  }
}

function canAddAdjustment(entry: ResaleTrackerEntry) {
  return typeof entry.listPrice === 'number' && entry.listPrice > 0
}

function addAdjustmentFromCurrentPrice(entry: ResaleTrackerEntry) {
  if (!canAddAdjustment(entry)) {
    return
  }

  const previousPrice = latestTrackedListPrice(entry)
  const nextPrice = entry.listPrice as number

  if (previousPrice === nextPrice) {
    return
  }

  addPriceAdjustment(entry.id, {
    fromPrice: previousPrice,
    toPrice: nextPrice,
    reason: 'Manual relist',
  })
}

function canSaveAdjustment(entry: ResaleTrackerEntry) {
  const draft = adjustmentDrafts.value[entry.id]
  if (!draft) {
    return false
  }

  const nextPrice = Number(draft.toPrice)
  return Number.isFinite(nextPrice) && nextPrice > 0 && nextPrice !== latestTrackedListPrice(entry)
}

function saveAdjustment(entry: ResaleTrackerEntry) {
  const draft = adjustmentDrafts.value[entry.id]
  if (!draft) {
    return
  }

  const nextPrice = Number(draft.toPrice)
  if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
    return
  }

  const previousPrice = latestTrackedListPrice(entry)
  if (previousPrice === nextPrice) {
    return
  }

  addPriceAdjustment(entry.id, {
    fromPrice: previousPrice,
    toPrice: nextPrice,
    reason: draft.reason.trim() || undefined,
  })

  patchEntry(entry, {
    listPrice: nextPrice,
  })

  adjustmentDrafts.value = {
    ...adjustmentDrafts.value,
    [entry.id]: {
      toPrice: '',
      reason: '',
    },
  }
}

function latestTrackedListPrice(entry: ResaleTrackerEntry) {
  const latestAdjustment = entry.priceAdjustments?.[entry.priceAdjustments.length - 1]
  if (latestAdjustment) {
    return latestAdjustment.toPrice
  }

  return entry.listPrice ?? entry.buyPrice ?? 0
}

function realizedEntryProfit(entry: ResaleTrackerEntry) {
  return (entry.soldPrice ?? 0) - (entry.buyPrice ?? 0)
}

function getHoldDurationMs(entry: ResaleTrackerEntry) {
  return getDurationMs(entry.boughtAt, entry.soldAt)
}

function getMarketDurationMs(entry: ResaleTrackerEntry) {
  return getDurationMs(entry.listedAt, entry.soldAt)
}

function getDurationMs(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) {
    return null
  }

  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return null
  }

  return endMs - startMs
}

function averageDuration(values: number[]) {
  if (!values.length) {
    return null
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function getEstimate(entry: ResaleTrackerEntry, ...keys: string[]) {
  const rawEntry = entry as Record<string, unknown>

  for (const key of keys) {
    const value = rawEntry[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }

  return null
}

function sourceLabel(source: string) {
  if (source === 'observed') {
    return 'Observed'
  }
  if (source === 'crafted') {
    return 'Crafted'
  }

  return 'Manual'
}

function formatKamasFull(value: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value))
}

function formatKamasOptional(value: number | null) {
  if (value == null) {
    return '-'
  }

  return formatKamasFull(value)
}

function formatDuration(value: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return '-'
  }

  const totalHours = Math.round(value / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24

  if (!days) {
    return `${hours}h`
  }

  if (!hours) {
    return `${days}d`
  }

  return `${days}d ${hours}h`
}

function formatRelativeDate(value: string | null | undefined) {
  if (!value) {
    return 'now'
  }

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) {
    return 'now'
  }

  const diffMs = timestamp - Date.now()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour')
  }

  return formatter.format(Math.round(diffHours / 24), 'day')
}
</script>

<style scoped>
.rs-page {
  display: grid;
  gap: 20px;
}

.rs-hero,
.rs-empty-card,
.rs-stat,
.rs-card {
  border: 1px solid rgba(245, 158, 11, 0.18);
  background:
    linear-gradient(180deg, rgba(28, 18, 6, 0.96), rgba(16, 10, 3, 0.96));
  border-radius: 20px;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.18);
}

.rs-hero,
.rs-empty-card,
.rs-card {
  padding: 22px;
}

.rs-eyebrow {
  margin: 0 0 8px;
  color: #f59e0b;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.rs-hero h1,
.rs-empty-card h1,
.rs-empty-card h2,
.rs-item h2 {
  margin: 0;
}

.rs-hero p,
.rs-empty-card p {
  margin: 8px 0 0;
  color: rgba(255, 248, 220, 0.72);
  max-width: 72ch;
}

.rs-stats {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.rs-stat {
  padding: 18px 20px;
}

.rs-stat-label {
  display: block;
  margin-bottom: 8px;
  color: rgba(255, 248, 220, 0.64);
  font-size: 0.85rem;
}

.rs-stat strong {
  font-size: 1.45rem;
}

.rs-toolbar {
  display: flex;
  justify-content: flex-start;
}

.rs-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.rs-filter {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(245, 158, 11, 0.18);
  background: rgba(28, 18, 6, 0.82);
  border-radius: 999px;
  color: rgba(255, 248, 220, 0.82);
  padding: 10px 14px;
}

.rs-filter.is-active {
  border-color: rgba(34, 197, 94, 0.55);
  background: rgba(22, 101, 52, 0.24);
  color: #dcfce7;
}

.rs-list {
  display: grid;
  gap: 16px;
}

.rs-card {
  display: grid;
  gap: 18px;
}

.rs-card-head,
.rs-card-foot,
.rs-actions,
.rs-model-line,
.rs-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.rs-item {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rs-item-image {
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  padding: 6px;
}

.rs-meta {
  justify-content: flex-start;
  color: rgba(255, 248, 220, 0.68);
  font-size: 0.88rem;
}

.rs-pill {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.78rem;
  font-weight: 700;
}

.rs-pill.is-watched {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
}

.rs-pill.is-bought {
  background: rgba(59, 130, 246, 0.18);
  color: #93c5fd;
}

.rs-pill.is-listed {
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
}

.rs-pill.is-sold {
  background: rgba(168, 85, 247, 0.18);
  color: #d8b4fe;
}

.rs-pill.is-cancelled {
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
}

.rs-remove,
.rs-action {
  border: 1px solid rgba(245, 158, 11, 0.18);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  color: rgba(255, 248, 220, 0.88);
  padding: 10px 12px;
}

.rs-action.is-cancel {
  border-color: rgba(239, 68, 68, 0.25);
}

.rs-remove:hover,
.rs-action:hover,
.rs-filter:hover {
  border-color: rgba(245, 158, 11, 0.36);
}

.rs-action:disabled {
  opacity: 0.45;
  cursor: default;
}

.rs-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.rs-field {
  display: grid;
  gap: 8px;
}

.rs-field span {
  color: rgba(255, 248, 220, 0.72);
  font-size: 0.86rem;
}

.rs-field input,
.rs-field textarea {
  width: 100%;
  border: 1px solid rgba(245, 158, 11, 0.16);
  background: rgba(8, 6, 2, 0.72);
  color: #fff7db;
  border-radius: 12px;
  padding: 12px 14px;
}

.rs-field textarea {
  resize: vertical;
}

.rs-model {
  display: grid;
  gap: 10px;
  border: 1px solid rgba(245, 158, 11, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  padding: 14px;
}

.rs-adjustments {
  display: grid;
  gap: 14px;
  border: 1px solid rgba(245, 158, 11, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  padding: 16px;
}

.rs-adjustments-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.rs-adjustments-head h3 {
  margin: 0;
}

.rs-adjustments-head p,
.rs-adjustment-empty,
.rs-adjustment-meta {
  margin: 0;
  color: rgba(255, 248, 220, 0.68);
}

.rs-adjustment-list {
  display: grid;
  gap: 10px;
}

.rs-adjustment {
  display: grid;
  gap: 6px;
  border: 1px solid rgba(245, 158, 11, 0.12);
  border-radius: 14px;
  background: rgba(8, 6, 2, 0.5);
  padding: 12px 14px;
}

.rs-adjustment-line,
.rs-adjustment-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.rs-model-line span,
.rs-card-foot span {
  color: rgba(255, 248, 220, 0.7);
}

.is-profit {
  color: #86efac;
}

.is-loss {
  color: #fca5a5;
}

@media (max-width: 720px) {
  .rs-card-head,
  .rs-actions,
  .rs-model-line,
  .rs-card-foot {
    align-items: flex-start;
    flex-direction: column;
  }

  .rs-item {
    align-items: flex-start;
  }
}
</style>
