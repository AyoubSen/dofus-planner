<template>
  <div>
    <!-- No context -->
    <div v-if="!hasContext" class="v2-no-context">
      <div class="v2-no-context__icon">
        <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>
      <div class="v2-no-context__title">{{ $t('v2.common.noCharacterTitle') }}</div>
      <div class="v2-no-context__desc">{{ $t('v2.resale.noCharacterDesc') }}</div>
    </div>

    <template v-else>
      <!-- Stats strip -->
      <div class="rt-stats">
        <div class="rt-stat">
          <div class="rt-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="rt-stat__body">
            <div class="rt-stat__val">{{ filteredEntries.length }}</div>
            <div class="rt-stat__lbl">{{ $t('v2.resale.stats.tracked') }}</div>
          </div>
        </div>
        <div class="rt-stat">
          <div class="rt-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="rt-stat__body">
            <div class="rt-stat__val">{{ activeEntries.length }}</div>
            <div class="rt-stat__lbl">{{ $t('v2.resale.stats.active') }}</div>
          </div>
        </div>
        <div class="rt-stat">
          <div class="rt-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="rt-stat__body">
            <div class="rt-stat__val">{{ soldEntries.length }}</div>
            <div class="rt-stat__lbl">{{ $t('v2.resale.stats.sold') }}</div>
          </div>
        </div>
        <div class="rt-stat" :class="realizedProfit >= 0 ? 'rt-stat--pos' : 'rt-stat--neg'">
          <div class="rt-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="rt-stat__body">
            <div class="rt-stat__val" :style="realizedProfit >= 0 ? 'color:#34d399' : 'color:#f87171'">
              {{ realizedProfit >= 0 ? '+' : '' }}{{ formatKamasFull(realizedProfit) }}
            </div>
            <div class="rt-stat__lbl">{{ $t('v2.resale.stats.realizedPL') }}</div>
          </div>
        </div>
        <div class="rt-stat">
          <div class="rt-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="rt-stat__body">
            <div class="rt-stat__val" style="font-size:.9375rem">{{ formatDuration(averageHoldDurationMs) }}</div>
            <div class="rt-stat__lbl">{{ $t('v2.resale.stats.avgHold') }}</div>
          </div>
        </div>
        <div class="rt-stat">
          <div class="rt-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4" />
            </svg>
          </div>
          <div class="rt-stat__body">
            <div class="rt-stat__val" style="font-size:.9375rem">{{ averageRepricesBeforeSale }}</div>
            <div class="rt-stat__lbl">{{ $t('v2.resale.stats.avgReprices') }}</div>
          </div>
        </div>
      </div>

      <!-- Transfer panel -->
      <div class="rt-transfer-panel">
        <button class="rt-transfer-panel__head" @click="showTransferPanel = !showTransferPanel">
          <span class="rt-transfer-panel__title">{{ $t('v2.resale.transfer.title') }}</span>
          <svg class="v2-collapse-chevron" :class="{ 'v2-collapse-chevron--open': showTransferPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div v-show="showTransferPanel" class="rt-transfer-panel__body">
          <p class="rt-transfer-hint">{{ $t('v2.resale.transfer.hint') }}</p>
          <div class="rt-transfer-row">
            <div class="rt-transfer-col">
              <label class="rt-transfer-label">{{ $t('v2.resale.transfer.from') }}</label>
              <select v-model="transferFromKey" class="rt-transfer-select">
                <option value="">{{ $t('v2.resale.transfer.selectCharacter') }}</option>
                <option v-for="opt in allCharacterOptions" :key="opt.key" :value="opt.key">{{ opt.label }}</option>
              </select>
              <span v-if="transferFromKey" class="rt-transfer-count">{{ $t('v2.resale.transfer.entriesCount', { count: transferFromCount }) }}</span>
            </div>
            <div class="rt-transfer-arrow">→</div>
            <div class="rt-transfer-col">
              <label class="rt-transfer-label">{{ $t('v2.resale.transfer.to') }}</label>
              <select v-model="transferToKey" class="rt-transfer-select">
                <option value="">{{ $t('v2.resale.transfer.selectCharacter') }}</option>
                <option
                  v-for="opt in allCharacterOptions.filter(o => o.key !== transferFromKey)"
                  :key="opt.key"
                  :value="opt.key"
                >{{ opt.label }}</option>
              </select>
            </div>
          </div>
          <button
            class="rt-transfer-btn"
            :disabled="!transferFromKey || !transferToKey || transferFromCount === 0"
            @click="doTransfer"
          >
            {{ $t('v2.resale.transfer.action', { count: transferFromCount }) }}
          </button>
        </div>
      </div>

      <!-- Status filter tabs -->
      <div class="rt-tabs">
        <button
          v-for="filter in statusFilters"
          :key="filter.id"
          type="button"
          class="rt-tab"
          :class="{ 'rt-tab--on': statusFilter === filter.id }"
          @click="statusFilter = filter.id"
        >
          {{ filter.label }}
          <span class="rt-badge">{{ filter.count }}</span>
        </button>
      </div>

      <!-- Entry list -->
      <div v-if="visibleEntries.length" class="rt-list">
        <div
          v-for="entry in visibleEntries"
          :key="entry.id"
          class="v2-card rt-entry"
        >
          <!-- Entry header -->
          <div class="rt-entry__header">
            <img
              v-if="entry.itemImageUrl"
              :src="entry.itemImageUrl"
              :alt="entry.itemName"
              class="rt-entry__img"
            >
            <div v-else class="rt-entry__img-placeholder">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:.3">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div class="rt-entry__meta">
              <div class="rt-entry__name">{{ entry.itemName }}</div>
              <div class="rt-entry__sub">
                <span class="rt-pill" :class="`rt-pill--${entry.status}`">{{ statusLabelMap[entry.status] }}</span>
                <span>{{ sourceLabel(entry.source) }}</span>
                <span>{{ formatRelativeDate(entry.updatedAt) }}</span>
              </div>
            </div>
            <button type="button" class="rt-del v2-btn-ghost" @click="removeEntry(entry.id)" :title="$t('v2.resale.actions.removeEntry')">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <!-- Price fields -->
          <div class="rt-prices">
            <label class="rt-field">
              <span class="rt-field__lbl">{{ $t('v2.resale.fields.buyPrice') }}</span>
              <input
                :value="entry.buyPrice ?? ''"
                type="number"
                min="0"
                step="1"
                class="v2-input rt-field__input"
                @input="updateNumberField(entry, 'buyPrice', ($event.target as HTMLInputElement).value)"
              >
            </label>
            <label class="rt-field">
              <span class="rt-field__lbl">{{ $t('v2.resale.fields.listPrice') }}</span>
              <input
                :value="entry.listPrice ?? ''"
                type="number"
                min="0"
                step="1"
                class="v2-input rt-field__input"
                @input="updateNumberField(entry, 'listPrice', ($event.target as HTMLInputElement).value)"
              >
            </label>
            <label class="rt-field">
              <span class="rt-field__lbl">{{ $t('v2.resale.fields.soldPrice') }}</span>
              <input
                :value="entry.soldPrice ?? ''"
                type="number"
                min="0"
                step="1"
                class="v2-input rt-field__input"
                @input="updateNumberField(entry, 'soldPrice', ($event.target as HTMLInputElement).value)"
              >
              <span v-if="statusMessages[entry.id]" class="rt-field__hint rt-field__hint--warn">{{ statusMessages[entry.id] }}</span>
            </label>
          </div>

          <!-- Model estimates -->
          <div class="rt-model">
            <div class="rt-model__row">
              <span>{{ $t('v2.resale.model.observed') }}</span>
              <strong>{{ formatKamasFull(entry.buyPrice ?? 0) }}</strong>
            </div>
            <div class="rt-model__row">
              <span>{{ $t('v2.resale.model.quickTarget') }}</span>
              <strong>{{ formatKamasOptional(getEstimate(entry, 'estimatedQuickRelistPrice', 'estimatedQuickRelist')) }}</strong>
            </div>
            <div class="rt-model__row">
              <span>{{ $t('v2.resale.model.fairTarget') }}</span>
              <strong>{{ formatKamasOptional(getEstimate(entry, 'estimatedFairRelistPrice', 'estimatedFairValue')) }}</strong>
            </div>
            <div class="rt-model__row">
              <span>{{ $t('v2.resale.model.greedyTarget') }}</span>
              <strong>{{ formatKamasOptional(getEstimate(entry, 'estimatedGreedyRelistPrice', 'estimatedGreedyRelist')) }}</strong>
            </div>
            <div class="rt-model__row">
              <span>{{ $t('v2.resale.model.predictedDelta') }}</span>
              <strong :class="(getEstimate(entry, 'estimatedDelta') ?? 0) >= 0 ? 'rt-pos' : 'rt-neg'">
                {{ formatKamasOptional(getEstimate(entry, 'estimatedDelta')) }}
              </strong>
            </div>
          </div>

          <!-- Status actions -->
          <div class="rt-actions">
            <button
              type="button"
              class="rt-action-btn"
              :class="{ 'rt-action-btn--on': entry.status === 'bought' }"
              :disabled="entry.status === 'bought'"
              @click="setStatus(entry, 'bought')"
            >
              {{ statusLabel('bought') }}
            </button>
            <button
              type="button"
              class="rt-action-btn"
              :class="{ 'rt-action-btn--on': entry.status === 'listed' }"
              :disabled="entry.status === 'listed'"
              @click="setStatus(entry, 'listed')"
            >
              {{ statusLabel('listed') }}
            </button>
            <button
              type="button"
              class="rt-action-btn"
              :class="{ 'rt-action-btn--on': entry.status === 'sold' }"
              :disabled="entry.status === 'sold' || !canMarkSold(entry)"
              @click="setStatus(entry, 'sold')"
              :title="canMarkSold(entry) ? $t('v2.resale.actions.markAsSold') : $t('v2.resale.messages.enterSoldPriceFirst')"
            >
              {{ statusLabel('sold') }}
            </button>
            <button
              type="button"
              class="rt-action-btn rt-action-btn--cancel"
              :class="{ 'rt-action-btn--on': entry.status === 'cancelled' }"
              :disabled="entry.status === 'cancelled'"
              @click="setStatus(entry, 'cancelled')"
            >
              {{ $t('v2.resale.actions.cancel') }}
            </button>
          </div>

          <!-- Price adjustment history -->
          <div class="rt-adj">
            <div class="rt-adj__head">
              <div>
                <div class="rt-adj__title">{{ $t('v2.resale.adjustments.title') }}</div>
                <div class="rt-adj__desc">{{ $t('v2.resale.adjustments.desc') }}</div>
              </div>
              <button
                type="button"
                class="v2-btn-ghost rt-adj__snap"
                :disabled="!canAddAdjustment(entry)"
                @click="addAdjustmentFromCurrentPrice(entry)"
              >
                {{ $t('v2.resale.adjustments.snapCurrentPrice') }}
              </button>
            </div>

            <div v-if="entry.priceAdjustments?.length" class="rt-adj__list">
              <div
                v-for="adjustment in [...entry.priceAdjustments].sort((a, b) => getAdjustmentCreatedAtMs(b) - getAdjustmentCreatedAtMs(a))"
                :key="adjustment.id"
                class="rt-adj__item"
              >
                <div class="rt-adj__prices">
                  <strong>{{ formatKamasFull(getAdjustmentFromPrice(adjustment)) }}</strong>
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:.45">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <strong>{{ formatKamasFull(getAdjustmentToPrice(adjustment)) }}</strong>
                </div>
                <div class="rt-adj__when">
                  <span>{{ formatRelativeDate(getAdjustmentCreatedAt(adjustment)) }}</span>
                  <span v-if="getAdjustmentReason(adjustment)" style="opacity:.6">· {{ getAdjustmentReason(adjustment) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="rt-adj__empty">{{ $t('v2.resale.adjustments.empty') }}</div>

            <div class="rt-prices" style="margin-top:.75rem">
              <label class="rt-field">
                <span class="rt-field__lbl">{{ $t('v2.resale.fields.newPrice') }}</span>
                <input
                  :value="adjustmentDrafts[entry.id]?.toPrice ?? ''"
                  type="number"
                  min="0"
                  step="1"
                  class="v2-input rt-field__input"
                  @input="updateAdjustmentDraft(entry.id, 'toPrice', ($event.target as HTMLInputElement).value)"
                >
              </label>
              <label class="rt-field">
                <span class="rt-field__lbl">{{ $t('v2.resale.fields.reason') }}</span>
                <input
                  :value="adjustmentDrafts[entry.id]?.reason ?? ''"
                  type="text"
                  :placeholder="$t('v2.resale.placeholders.adjustmentReason')"
                  class="v2-input rt-field__input"
                  @input="updateAdjustmentDraft(entry.id, 'reason', ($event.target as HTMLInputElement).value)"
                >
              </label>
            </div>
            <button
              type="button"
              class="v2-btn-gold rt-adj__save"
              :disabled="!canSaveAdjustment(entry)"
              @click="saveAdjustment(entry)"
            >
              {{ $t('v2.resale.adjustments.save') }}
            </button>
          </div>

          <!-- Notes -->
          <label class="rt-field rt-notes">
            <span class="rt-field__lbl">{{ $t('v2.resale.fields.notes') }}</span>
            <textarea
              rows="2"
              :value="entry.notes ?? ''"
              class="v2-input"
              style="resize:vertical"
              @input="updateTextField(entry, 'notes', ($event.target as HTMLTextAreaElement).value)"
            />
          </label>

          <!-- Footer stats -->
          <div class="rt-entry__foot">
            <span>
              {{ $t('v2.resale.footer.pl') }}:
              <strong :class="realizedEntryProfit(entry) >= 0 ? 'rt-pos' : 'rt-neg'">
                {{ realizedEntryProfit(entry) >= 0 ? '+' : '' }}{{ formatKamasFull(realizedEntryProfit(entry)) }}
              </strong>
            </span>
            <span>{{ $t('v2.resale.footer.held', { duration: formatDuration(getHoldDurationMs(entry)) }) }}</span>
            <span>{{ $t('v2.resale.footer.market', { duration: formatDuration(getMarketDurationMs(entry)) }) }}</span>
            <span>{{ $t('v2.resale.footer.reprices', { count: entry.priceAdjustments?.length ?? 0 }) }}</span>
            <span v-if="entry.soldAt">{{ $t('v2.resale.footer.sold', { date: formatRelativeDate(entry.soldAt) }) }}</span>
          </div>
        </div>
      </div>

      <!-- Empty entries state -->
      <div v-else class="v2-no-context">
        <div class="v2-no-context__icon">
          <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <div class="v2-no-context__title">
          {{ emptyTitle }}
        </div>
        <div class="v2-no-context__desc">
          {{ statusFilter === 'all'
            ? $t('v2.resale.empty.descAll')
            : $t('v2.resale.empty.descFiltered') }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ResaleTrackerEntry, ResaleTrackerStatus } from '../composables/useAppDataStore'
import { useResaleTracker } from '../../composables/useResaleTracker'

definePageMeta({
  layout: 'v2',
})

const { hasContext, selectedServer, selectedCharacter, servers } = useV2Context()
const { entries, upsertEntry, updateStatus, addPriceAdjustment, removeEntry, transferEntries } = useResaleTracker()
const { t, locale } = useI18n()

const showTransferPanel = ref(false)
const transferFromKey = ref('')
const transferToKey = ref('')
const statusMessages = ref<Record<string, string>>({})

const allCharacterOptions = computed(() =>
  servers.value.flatMap(server =>
    server.characters.map(char => ({
      key: `${server.id}:${char.id}`,
      label: `${server.name} · ${char.name}`,
      serverId: server.id,
      characterId: char.id,
    }))
  )
)

const transferFromCount = computed(() => {
  if (!transferFromKey.value) return 0
  const [sId, cId] = transferFromKey.value.split(':')
  return entries.value.filter(e => e.serverId === sId && e.characterId === cId).length
})

const doTransfer = () => {
  if (!transferFromKey.value || !transferToKey.value) return
  if (transferFromKey.value === transferToKey.value) return
  const [fromSid, fromCid] = transferFromKey.value.split(':')
  const [toSid, toCid] = transferToKey.value.split(':')
  if (!fromSid || !fromCid || !toSid || !toCid) return
  const count = transferEntries(fromSid, fromCid, toSid, toCid)
  if (!count) return
  alert(t('v2.resale.transfer.success', { count }))
  transferFromKey.value = ''
  transferToKey.value = ''
  showTransferPanel.value = false
}

const statusFilter = ref<'all' | ResaleTrackerStatus>('all')
const adjustmentDrafts = ref<Record<string, { toPrice: string, reason: string }>>({})

const statusLabel = (status: ResaleTrackerStatus | 'all') => t(`v2.resale.status.${status}`)

const statusLabelMap = computed<Record<ResaleTrackerStatus, string>>(() => ({
  watched: statusLabel('watched'),
  bought: statusLabel('bought'),
  listed: statusLabel('listed'),
  sold: statusLabel('sold'),
  cancelled: statusLabel('cancelled'),
}))

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
  { id: 'all' as const, label: statusLabel('all'), count: filteredEntries.value.length },
  { id: 'watched' as const, label: statusLabel('watched'), count: filteredEntries.value.filter((entry) => entry.status === 'watched').length },
  { id: 'bought' as const, label: statusLabel('bought'), count: filteredEntries.value.filter((entry) => entry.status === 'bought').length },
  { id: 'listed' as const, label: statusLabel('listed'), count: filteredEntries.value.filter((entry) => entry.status === 'listed').length },
  { id: 'sold' as const, label: statusLabel('sold'), count: filteredEntries.value.filter((entry) => entry.status === 'sold').length },
  { id: 'cancelled' as const, label: statusLabel('cancelled'), count: filteredEntries.value.filter((entry) => entry.status === 'cancelled').length },
])

const emptyTitle = computed(() =>
  statusFilter.value === 'all'
    ? t('v2.resale.empty.titleAll')
    : t('v2.resale.empty.titleFiltered', { status: statusLabel(statusFilter.value) }),
)

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

function setStatusMessage(entryId: string, message = '') {
  statusMessages.value = {
    ...statusMessages.value,
    [entryId]: message,
  }
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

  if (field === 'soldPrice' && value && Number(value) > 0) {
    setStatusMessage(entry.id, '')
  }
}

function updateTextField(
  entry: ResaleTrackerEntry,
  field: 'notes',
  value: string,
) {
  patchEntry(entry, { [field]: value } as Partial<ResaleTrackerEntry>)
}

function setStatus(entry: ResaleTrackerEntry, status: ResaleTrackerStatus) {
  if (status === 'sold' && !canMarkSold(entry)) {
    setStatusMessage(entry.id, t('v2.resale.messages.enterActualSoldPrice'))
    return
  }

  setStatusMessage(entry.id, '')
  updateStatus(entry.id, status)
}

function canMarkSold(entry: ResaleTrackerEntry) {
  return typeof entry.soldPrice === 'number' && Number.isFinite(entry.soldPrice) && entry.soldPrice > 0
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
    reason: t('v2.resale.adjustments.manualRelist'),
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

function getAdjustmentFromPrice(adjustment: any) {
  const value = adjustment?.fromPrice ?? adjustment?.previousPrice
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function getAdjustmentToPrice(adjustment: any) {
  const value = adjustment?.toPrice ?? adjustment?.nextPrice
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function getAdjustmentCreatedAt(adjustment: any) {
  if (typeof adjustment?.createdAt === 'string' && adjustment.createdAt) return adjustment.createdAt
  if (typeof adjustment?.changedAt === 'string' && adjustment.changedAt) return adjustment.changedAt
  return new Date().toISOString()
}

function getAdjustmentCreatedAtMs(adjustment: any) {
  return new Date(getAdjustmentCreatedAt(adjustment)).getTime()
}

function getAdjustmentReason(adjustment: any) {
  if (typeof adjustment?.reason === 'string' && adjustment.reason) return adjustment.reason
  if (typeof adjustment?.note === 'string' && adjustment.note) return adjustment.note
  return ''
}

function latestTrackedListPrice(entry: ResaleTrackerEntry) {
  const latestAdjustment = entry.priceAdjustments?.[entry.priceAdjustments.length - 1]
  if (latestAdjustment) {
    return getAdjustmentToPrice(latestAdjustment)
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
  const rawEntry = entry as unknown as Record<string, unknown>

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
    return t('v2.resale.source.observed')
  }
  if (source === 'crafted') {
    return t('v2.resale.source.crafted')
  }

  return t('v2.resale.source.manual')
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
    return t('v2.resale.time.now')
  }

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) {
    return t('v2.resale.time.now')
  }

  const diffMs = timestamp - Date.now()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const formatter = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })

  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour')
  }

  return formatter.format(Math.round(diffHours / 24), 'day')
}
</script>

<style scoped>
/* ── Stats strip ─────────────────────────────────────────── */
.rt-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: .625rem;
  margin-bottom: 1rem;
}
.rt-stat {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .875rem 1rem;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-border);
  border-radius: 12px;
  transition: border-color .2s;
}
.rt-stat:hover { border-color: var(--v2-border-med); }
.rt-stat--pos { border-color: rgba(52,211,153,.2); background: rgba(52,211,153,.04); }
.rt-stat--neg { border-color: rgba(248,113,113,.2); background: rgba(248,113,113,.04); }
.rt-stat__icon {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  background: var(--v2-active);
  color: var(--v2-accent);
  display: flex; align-items: center; justify-content: center;
}
.rt-stat--pos .rt-stat__icon { background: rgba(52,211,153,.15); color: #34d399; }
.rt-stat--neg .rt-stat__icon { background: rgba(248,113,113,.15); color: #f87171; }
.rt-stat__body { flex: 1; min-width: 0; }
.rt-stat__val { font-size: 1.25rem; font-weight: 800; color: var(--v2-text); line-height: 1.2; }
.rt-stat__lbl { font-size: .6875rem; color: var(--v2-text-dim); margin-top: 1px; }

/* ── Status filter tabs ───────────────────────────────────── */
.rt-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: .375rem;
  margin-bottom: 1rem;
}
.rt-tab {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .4375rem .875rem;
  border-radius: 8px;
  border: 1px solid var(--v2-border);
  background: transparent;
  color: var(--v2-text-secondary);
  font-size: .8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s;
}
.rt-tab:hover { border-color: var(--v2-border-strong); color: var(--v2-text); }
.rt-tab--on {
  background: var(--v2-active-strong);
  border-color: var(--v2-border-focus);
  color: var(--v2-text);
  font-weight: 600;
}
.rt-badge {
  background: var(--v2-active);
  color: var(--v2-text-secondary);
  border-radius: 99px;
  padding: 1px 7px;
  font-size: .6875rem;
  font-weight: 700;
}
.rt-tab--on .rt-badge { background: var(--v2-active-strong); color: var(--v2-accent); }

/* ── Entry list ───────────────────────────────────────────── */
.rt-list { display: flex; flex-direction: column; gap: .625rem; }

.rt-entry {
  display: flex;
  flex-direction: column;
  gap: .875rem;
  padding: 1rem 1.125rem;
}

/* Entry header */
.rt-entry__header {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
}
.rt-entry__img {
  width: 44px; height: 44px;
  object-fit: contain; flex-shrink: 0;
  border-radius: 10px;
  background: var(--v2-active);
  padding: 4px;
}
.rt-entry__img-placeholder {
  width: 44px; height: 44px; flex-shrink: 0; border-radius: 10px;
  background: var(--v2-active);
  display: flex; align-items: center; justify-content: center;
  color: var(--v2-text-dim);
}
.rt-entry__meta { flex: 1; min-width: 0; }
.rt-entry__name { font-size: .9375rem; font-weight: 700; color: var(--v2-text); }
.rt-entry__sub {
  display: flex; flex-wrap: wrap; align-items: center;
  gap: .375rem; margin-top: .25rem;
  font-size: .75rem; color: var(--v2-text-secondary);
}
.rt-del {
  width: 32px; height: 32px; padding: 0;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.rt-del:hover { color: #f87171; border-color: rgba(248,113,113,.35); }

/* Status pills */
.rt-pill {
  border-radius: 99px;
  padding: 2px 8px;
  font-size: .6875rem;
  font-weight: 700;
}
.rt-pill--watched { background: rgba(245,165,35,.15); color: var(--v2-accent-light, #fbbf24); }
.rt-pill--bought  { background: rgba(96,165,250,.15); color: #93c5fd; }
.rt-pill--listed  { background: rgba(52,211,153,.15); color: #86efac; }
.rt-pill--sold    { background: rgba(168,85,247,.15);  color: #d8b4fe; }
.rt-pill--cancelled { background: rgba(248,113,113,.12); color: #fca5a5; }

/* Price fields row */
.rt-prices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: .625rem;
}
.rt-field { display: flex; flex-direction: column; gap: .3125rem; }
.rt-field__lbl { font-size: .75rem; font-weight: 500; color: var(--v2-text-secondary); }
.rt-field__input { font-size: .875rem; padding: .5rem .75rem; }
.rt-field__hint { font-size: .6875rem; line-height: 1.35; }
.rt-field__hint--warn { color: #fca5a5; }
.rt-notes { gap: .3125rem; }

/* Model estimates */
.rt-model {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-border-subtle);
  border-radius: 10px;
  overflow: hidden;
}
.rt-model__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .5rem;
  padding: .4375rem .75rem;
  font-size: .8125rem;
  border-bottom: 1px solid var(--v2-border-subtle);
}
.rt-model__row:last-child { border-bottom: none; }
.rt-model__row span { color: var(--v2-text-secondary); }
.rt-model__row strong { color: var(--v2-text); font-size: .875rem; }

/* Status action buttons */
.rt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: .375rem;
}
.rt-action-btn {
  padding: .4375rem .875rem;
  border-radius: 8px;
  border: 1px solid var(--v2-border);
  background: transparent;
  color: var(--v2-text-secondary);
  font-size: .8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s;
}
.rt-action-btn:hover:not(:disabled) { border-color: var(--v2-border-strong); color: var(--v2-text); }
.rt-action-btn--on {
  background: var(--v2-active-strong);
  border-color: var(--v2-border-focus);
  color: var(--v2-text);
  font-weight: 600;
  cursor: default;
}
.rt-action-btn--cancel { border-color: rgba(248,113,113,.22); color: #fca5a5; }
.rt-action-btn--cancel:hover:not(:disabled) { border-color: rgba(248,113,113,.5); background: rgba(248,113,113,.08); color: #f87171; }
.rt-action-btn:disabled { opacity: .4; cursor: default; }

/* Price adjustments panel */
.rt-adj {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  padding: .875rem;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-border-subtle);
  border-radius: 10px;
}
.rt-adj__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: .75rem;
  flex-wrap: wrap;
}
.rt-adj__title { font-size: .875rem; font-weight: 600; color: var(--v2-text); }
.rt-adj__desc { font-size: .75rem; color: var(--v2-text-dim); margin-top: 2px; }
.rt-adj__snap { font-size: .75rem; padding: .375rem .75rem; white-space: nowrap; }
.rt-adj__snap:disabled { opacity: .35; cursor: default; }

.rt-adj__list { display: flex; flex-direction: column; gap: .375rem; }
.rt-adj__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  flex-wrap: wrap;
  padding: .4375rem .75rem;
  border-radius: 8px;
  background: var(--v2-hover);
  font-size: .8125rem;
}
.rt-adj__prices {
  display: flex; align-items: center; gap: .375rem;
  font-size: .875rem; font-weight: 600; color: var(--v2-text);
}
.rt-adj__when { font-size: .6875rem; color: var(--v2-text-dim); }
.rt-adj__empty { font-size: .8125rem; color: var(--v2-text-dim); }

.rt-adj__save {
  align-self: flex-start;
  font-size: .8125rem;
  padding: .4375rem .875rem;
}
.rt-adj__save:disabled { opacity: .35; cursor: default; }

/* Entry footer */
.rt-entry__foot {
  display: flex;
  flex-wrap: wrap;
  gap: .375rem .875rem;
  padding-top: .625rem;
  border-top: 1px solid var(--v2-border-subtle);
  font-size: .75rem;
  color: var(--v2-text-dim);
}
.rt-entry__foot strong { font-weight: 700; }

/* Profit/loss colors */
.rt-pos { color: #34d399; }
.rt-neg { color: #f87171; }

@media (max-width: 520px) {
  .rt-stats { grid-template-columns: repeat(2, 1fr); }
  .rt-actions { flex-direction: column; }
  .rt-adj__head { flex-direction: column; }
}

/* ── Transfer panel ───────────────────────────────────────── */
.rt-transfer-panel {
  margin-bottom: 1rem;
  border: 1px solid var(--v2-border);
  border-radius: 12px;
  overflow: hidden;
}
.rt-transfer-panel__head {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: .75rem 1rem;
  background: var(--v2-hover-subtle); border: none; cursor: pointer;
  color: var(--v2-text-secondary);
}
.rt-transfer-panel__head:hover { color: var(--v2-text); background: var(--v2-hover); }
.rt-transfer-panel__title {
  font-size: .8125rem; font-weight: 600;
}
.v2-collapse-chevron {
  width: 14px; height: 14px; flex-shrink: 0; color: var(--v2-text-dim); transition: transform .2s ease;
}
.v2-collapse-chevron--open { transform: rotate(180deg); }
.rt-transfer-panel__body {
  display: flex; flex-direction: column; gap: .875rem;
  padding: 1rem;
  border-top: 1px solid var(--v2-border);
}
.rt-transfer-hint { font-size: .8125rem; color: var(--v2-text-secondary); margin: 0; }
.rt-transfer-row {
  display: flex; align-items: flex-end; gap: .75rem; flex-wrap: wrap;
}
.rt-transfer-col { display: flex; flex-direction: column; gap: .375rem; flex: 1; min-width: 160px; }
.rt-transfer-label { font-size: .6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--v2-text-dim); }
.rt-transfer-select {
  border: 1px solid var(--v2-border); border-radius: 8px;
  background: rgba(0,0,0,.18); color: var(--v2-text);
  padding: .4375rem .625rem; font-size: .8125rem; font-weight: 500;
}
.rt-transfer-select:focus { outline: none; border-color: var(--v2-border-focus); }
.rt-transfer-count { font-size: .6875rem; color: var(--v2-accent); font-weight: 700; }
.rt-transfer-arrow { font-size: 1.25rem; color: var(--v2-text-dim); padding-bottom: .25rem; }
.rt-transfer-btn {
  align-self: flex-start;
  border: 1px solid var(--v2-border); border-radius: 9px;
  background: rgba(0,0,0,.18); color: var(--v2-text);
  padding: .5rem 1rem; font-size: .8125rem; font-weight: 700; cursor: pointer;
}
.rt-transfer-btn:hover:not(:disabled) { border-color: var(--v2-border-focus); background: var(--v2-hover-subtle); }
.rt-transfer-btn:disabled { opacity: .45; cursor: not-allowed; }
</style>
