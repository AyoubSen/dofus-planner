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
      <section class="rt-guide v2-card">
        <div class="rt-guide__main">
          <div class="rt-guide__eyebrow">Beginner flipping flow</div>
          <h2 class="rt-guide__title">{{ resaleNextAction.title }}</h2>
          <p class="rt-guide__desc">{{ resaleNextAction.desc }}</p>
          <div class="rt-guide__actions">
            <button
              v-if="resaleNextAction.filter"
              type="button"
              class="rt-guide__btn"
              @click="statusFilter = resaleNextAction.filter"
            >
              {{ resaleNextAction.cta }}
            </button>
            <NuxtLink v-else :to="localePath(resaleNextAction.path)" class="rt-guide__btn">
              {{ resaleNextAction.cta }}
            </NuxtLink>
            <span class="rt-guide__hint">{{ resaleNextAction.hint }}</span>
          </div>
        </div>
        <div class="rt-guide__steps" aria-label="Resale workflow">
          <div
            v-for="step in beginnerSteps"
            :key="step.key"
            class="rt-guide-step"
            :class="{ 'rt-guide-step--active': step.active }"
          >
            <span>{{ step.number }}</span>
            <div>
              <strong>{{ step.title }}</strong>
              <small>{{ step.desc }}</small>
            </div>
          </div>
        </div>
      </section>

      <section class="rt-create v2-card">
        <button type="button" class="rt-create__head" @click="showCreateForm = !showCreateForm">
          <div>
            <div class="rt-create__eyebrow">Add a beginner flip</div>
            <h2>Watch one item before buying</h2>
          </div>
          <svg class="v2-collapse-chevron" :class="{ 'v2-collapse-chevron--open': showCreateForm }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
        </button>

        <div v-show="showCreateForm" class="rt-create__body">
          <div class="rt-create__intro">
            <strong>Beginner rule:</strong>
            start with one watched item. Enter the price you think it can sell for and the minimum profit you want. The app calculates the maximum buy price.
          </div>

          <div class="rt-create__grid">
            <label class="rt-field">
              <span class="rt-field__lbl">Item name</span>
              <input v-model="newFlip.itemName" class="v2-input rt-field__input" type="text" placeholder="Gelano, rune, resource...">
            </label>
            <label class="rt-field">
              <span class="rt-field__lbl">Observed / target sell price</span>
              <input v-model="newFlip.targetSellPrice" class="v2-input rt-field__input" type="number" min="0" step="1" placeholder="100000">
            </label>
            <label class="rt-field">
              <span class="rt-field__lbl">Minimum profit wanted</span>
              <input v-model="newFlip.minProfit" class="v2-input rt-field__input" type="number" min="0" step="1" placeholder="20000">
            </label>
            <label class="rt-field">
              <span class="rt-field__lbl">Optional note</span>
              <input v-model="newFlip.note" class="v2-input rt-field__input" type="text" placeholder="Why this item looked interesting...">
            </label>
          </div>

          <div class="rt-create-result">
            <div>
              <span>Safe buy price</span>
              <strong>{{ createSafeBuyPriceLabel }}</strong>
            </div>
            <p>{{ createSafeBuyHint }}</p>
          </div>

          <div class="rt-create__actions">
            <button type="button" class="rt-guide__btn" :disabled="!canCreateWatchedFlip" @click="createWatchedFlip">
              Create watched flip
            </button>
            <button type="button" class="v2-btn-ghost rt-create__reset" @click="resetCreateForm">
              Reset
            </button>
          </div>
        </div>
      </section>

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
              <V2Select
                v-model="transferFromKey"
                :options="allCharacterOptions"
                :placeholder="$t('v2.resale.transfer.selectCharacter')"
                size="compact"
                aria-label="Transfer from character"
              />
              <span v-if="transferFromKey" class="rt-transfer-count">{{ $t('v2.resale.transfer.entriesCount', { count: transferFromCount }) }}</span>
            </div>
            <div class="rt-transfer-arrow">→</div>
            <div class="rt-transfer-col">
              <label class="rt-transfer-label">{{ $t('v2.resale.transfer.to') }}</label>
              <V2Select
                v-model="transferToKey"
                :options="transferToOptions"
                :placeholder="$t('v2.resale.transfer.selectCharacter')"
                size="compact"
                aria-label="Transfer to character"
              />
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

          <div class="rt-entry-guide">
            <div class="rt-entry-guide__head">
              <span>{{ entryGuidance(entry).label }}</span>
              <strong :class="entryGuidance(entry).tone">{{ entryGuidance(entry).value }}</strong>
            </div>
            <p>{{ entryGuidance(entry).desc }}</p>
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
import { useResaleTracker } from '~/composables/useResaleTracker'

const { hasContext, selectedServer, selectedCharacter, servers } = useV2Context()
const { entries, createEntry, upsertEntry, updateStatus, addPriceAdjustment, removeEntry, transferEntries } = useResaleTracker()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const showTransferPanel = ref(false)
const showCreateForm = ref(true)
const transferFromKey = ref('')
const transferToKey = ref('')
const statusMessages = ref<Record<string, string>>({})

const newFlip = reactive({
  itemName: '',
  targetSellPrice: '',
  minProfit: '',
  note: '',
})

const allCharacterOptions = computed(() =>
  servers.value.flatMap(server =>
    server.characters.map(char => ({
      key: `${server.id}:${char.id}`,
      value: `${server.id}:${char.id}`,
      label: `${server.name} · ${char.name}`,
      serverId: server.id,
      characterId: char.id,
    }))
  )
)
const transferToOptions = computed(() =>
  allCharacterOptions.value.filter(option => option.key !== transferFromKey.value)
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

const watchedEntries = computed(() =>
  filteredEntries.value.filter((entry) => entry.status === 'watched'),
)

const boughtEntries = computed(() =>
  filteredEntries.value.filter((entry) => entry.status === 'bought'),
)

const listedEntries = computed(() =>
  filteredEntries.value.filter((entry) => entry.status === 'listed'),
)

const soldEntries = computed(() =>
  filteredEntries.value.filter((entry) => entry.status === 'sold'),
)

const staleListedEntries = computed(() =>
  listedEntries.value.filter((entry) => daysSince(entry.listedAt ?? entry.updatedAt) >= 3),
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

const createTargetSellPrice = computed(() => parsePositiveNumber(newFlip.targetSellPrice))
const createMinProfit = computed(() => parsePositiveNumber(newFlip.minProfit) ?? 0)
const createSafeBuyPrice = computed(() => {
  if (createTargetSellPrice.value == null) return null
  return Math.max(0, createTargetSellPrice.value - createMinProfit.value)
})
const createSafeBuyPriceLabel = computed(() =>
  createSafeBuyPrice.value == null ? 'Enter a target price' : `${formatKamasFull(createSafeBuyPrice.value)} kamas or less`,
)
const createSafeBuyHint = computed(() => {
  if (!newFlip.itemName.trim()) return 'Start by naming the item you want to watch.'
  if (createTargetSellPrice.value == null) return 'Enter the price you realistically expect to sell it for.'
  if (createMinProfit.value <= 0) return 'Add a minimum profit so you do not buy with a tiny unsafe margin.'
  return `If you want at least ${formatKamasFull(createMinProfit.value)} kamas profit, do not buy above ${formatKamasFull(createSafeBuyPrice.value ?? 0)} kamas.`
})
const canCreateWatchedFlip = computed(() =>
  Boolean(newFlip.itemName.trim())
  && createTargetSellPrice.value != null
  && createTargetSellPrice.value > 0
  && createSafeBuyPrice.value != null
  && selectedServer.value
  && selectedCharacter.value,
)

const resaleNextAction = computed<{
  title: string
  desc: string
  cta: string
  hint: string
  path: string
  filter: 'all' | ResaleTrackerStatus | null
}>(() => {
  if (!filteredEntries.value.length) {
    return {
      title: 'Start with one item, not a portfolio.',
      desc: 'Pick a familiar item from Prices, record the observed market price, then only buy if the margin is obvious. The first goal is learning, not scaling.',
      cta: 'Open Prices to find an item',
      hint: 'Beginner rule: one tracked flip is enough until it sells or fails.',
      path: '/prices',
      filter: null,
    }
  }

  if (staleListedEntries.value.length) {
    return {
      title: 'Relist or cancel stale listings first.',
      desc: `${staleListedEntries.value.length} listed flip${staleListedEntries.value.length === 1 ? ' has' : 's have'} been sitting for 3+ days. Locked capital is the hidden cost of flipping.`,
      cta: 'Show listed flips',
      hint: 'If it does not sell, lower price, relist, or cancel and record the lesson.',
      path: '/resale',
      filter: 'listed',
    }
  }

  if (boughtEntries.value.length) {
    return {
      title: 'List bought items before hunting more deals.',
      desc: `You have ${boughtEntries.value.length} bought item${boughtEntries.value.length === 1 ? '' : 's'} that still need a listing price. Profit starts as a plan, but it only becomes real after sale.`,
      cta: 'Show bought flips',
      hint: 'Set list price, then mark as listed so hold time starts making sense.',
      path: '/resale',
      filter: 'bought',
    }
  }

  if (watchedEntries.value.length) {
    return {
      title: 'Decide: buy, ignore, or keep watching.',
      desc: `You have ${watchedEntries.value.length} watched item${watchedEntries.value.length === 1 ? '' : 's'}. Do not buy unless the expected margin comfortably beats your risk.`,
      cta: 'Show watched flips',
      hint: 'If the spread is small or price data is old, skip it.',
      path: '/resale',
      filter: 'watched',
    }
  }

  if (soldEntries.value.length) {
    return {
      title: 'Review what sold before repeating it.',
      desc: `You have ${soldEntries.value.length} completed flip${soldEntries.value.length === 1 ? '' : 's'} with ${formatKamasFull(realizedProfit.value)} realized P/L. Repeat winners, avoid slow losers.`,
      cta: 'Show sold flips',
      hint: 'Realized profit teaches more than estimated profit.',
      path: '/resale',
      filter: 'sold',
    }
  }

  return {
    title: 'Keep the loop small and measurable.',
    desc: 'Watch one item, buy only with a safe margin, list it, then mark sold or cancelled with notes.',
    cta: 'Show all flips',
    hint: 'The app should teach from your actual outcomes.',
    path: '/resale',
    filter: 'all',
  }
})

const beginnerSteps = computed(() => [
  {
    key: 'watch',
    number: 1,
    title: 'Watch',
    desc: 'Save an observed item and target price.',
    active: watchedEntries.value.length > 0 || !filteredEntries.value.length,
  },
  {
    key: 'buy',
    number: 2,
    title: 'Buy safely',
    desc: 'Only buy below your safe price.',
    active: boughtEntries.value.length > 0,
  },
  {
    key: 'list',
    number: 3,
    title: 'List/reprice',
    desc: 'Track list price and stale listings.',
    active: listedEntries.value.length > 0,
  },
  {
    key: 'learn',
    number: 4,
    title: 'Learn',
    desc: 'Mark sold/cancelled and keep the lesson.',
    active: soldEntries.value.length > 0,
  },
])

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

function resetCreateForm() {
  newFlip.itemName = ''
  newFlip.targetSellPrice = ''
  newFlip.minProfit = ''
  newFlip.note = ''
}

function createWatchedFlip() {
  if (!canCreateWatchedFlip.value || !selectedServer.value || !selectedCharacter.value) return

  const itemName = newFlip.itemName.trim()
  const targetPrice = createTargetSellPrice.value ?? 0
  const safeBuyPrice = createSafeBuyPrice.value ?? 0
  const minProfit = createMinProfit.value
  const itemKey = itemName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `manual-${Date.now()}`
  const notes = [
    newFlip.note.trim(),
    `Beginner plan: sell around ${formatKamasFull(targetPrice)}, buy at or below ${formatKamasFull(safeBuyPrice)}, minimum desired profit ${formatKamasFull(minProfit)}.`,
  ].filter(Boolean).join('\n')

  createEntry({
    itemKey,
    itemId: null,
    itemName,
    itemImageUrl: '',
    status: 'watched',
    source: 'manual',
    serverId: selectedServer.value.id,
    characterId: selectedCharacter.value.id,
    boughtAt: null,
    listedAt: null,
    soldAt: null,
    cancelledAt: null,
    buyPrice: safeBuyPrice,
    listPrice: targetPrice,
    targetPrice,
    soldPrice: 0,
    estimatedFairValue: targetPrice,
    estimatedQuickRelist: targetPrice,
    estimatedGreedyRelist: Math.round(targetPrice * 1.08),
    estimatedScore: minProfit > 0 && targetPrice > 0 ? Math.round((minProfit / targetPrice) * 100) : 0,
    estimatedDelta: minProfit,
    observedListingId: '',
    marketScreenshotDataUrl: '',
    statsScreenshotDataUrl: '',
    statsEntries: [],
    notes,
  })

  statusFilter.value = 'watched'
  resetCreateForm()
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
  const latestAdjustment = [...(entry.priceAdjustments ?? [])]
    .sort((a, b) => getAdjustmentCreatedAtMs(b) - getAdjustmentCreatedAtMs(a))[0]
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

function parsePositiveNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function daysSince(value: string | null | undefined) {
  if (!value) return 0
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return 0
  return Math.floor((Date.now() - time) / 86_400_000)
}

function marginPercent(entry: ResaleTrackerEntry) {
  const buyPrice = entry.buyPrice ?? 0
  const targetPrice = entry.soldPrice || entry.listPrice || latestTrackedListPrice(entry)
  if (!buyPrice || !targetPrice) return null
  return ((targetPrice - buyPrice) / buyPrice) * 100
}

function entryGuidance(entry: ResaleTrackerEntry) {
  if (entry.status === 'watched') {
    const delta = getEstimate(entry, 'estimatedDelta')
    const target = getEstimate(entry, 'estimatedQuickRelistPrice', 'estimatedQuickRelist', 'estimatedFairRelistPrice', 'estimatedFairValue')
    return {
      label: 'Beginner decision',
      value: delta != null && delta > 0 ? `Potential +${formatKamasFull(delta)}` : 'Only buy with margin',
      tone: delta != null && delta > 0 ? 'rt-pos' : '',
      desc: target
        ? `If you buy, aim to list around ${formatKamasFull(target)}. Skip it if the safe profit feels too small or price data is old.`
        : 'This is still a watchlist item. Add a realistic buy/list price before spending kamas.',
    }
  }

  if (entry.status === 'bought') {
    const target = entry.listPrice || getEstimate(entry, 'estimatedQuickRelistPrice', 'estimatedQuickRelist')
    return {
      label: 'Next step',
      value: target ? `List near ${formatKamasFull(target)}` : 'Set list price',
      tone: '',
      desc: 'You already spent capital. List it before looking for more flips so money is not stuck idle.',
    }
  }

  if (entry.status === 'listed') {
    const days = daysSince(entry.listedAt ?? entry.updatedAt)
    return {
      label: days >= 3 ? 'Stale listing' : 'Waiting for sale',
      value: days >= 3 ? `${days}d listed` : `${days}d listed`,
      tone: days >= 3 ? 'rt-neg' : '',
      desc: days >= 3
        ? 'Consider relisting lower or cancelling. Slow flips can be worse than small losses because they lock capital.'
        : 'Let it sit for now. If it does not sell after a few days, log a reprice instead of guessing later.',
    }
  }

  if (entry.status === 'sold') {
    const profit = realizedEntryProfit(entry)
    const margin = marginPercent(entry)
    return {
      label: 'Realized result',
      value: `${profit >= 0 ? '+' : ''}${formatKamasFull(profit)}`,
      tone: profit >= 0 ? 'rt-pos' : 'rt-neg',
      desc: margin == null
        ? 'This is real profit/loss because the item sold. Add notes so you remember why it worked or failed.'
        : `Real margin was ${margin.toFixed(1)}%. Repeat only if the hold time and effort were worth it.`,
    }
  }

  return {
    label: 'Lesson',
    value: 'Cancelled',
    tone: 'rt-neg',
    desc: 'Cancelled flips are useful data. Note why you bailed so you avoid the same trap next time.',
  }
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
/* ── Beginner guide ───────────────────────────────────────── */
.rt-guide {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 1rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
  border-color: var(--v2-border-med);
  background: linear-gradient(135deg, var(--v2-hover-subtle), rgba(0,0,0,.12));
}
.rt-guide__main { min-width: 0; }
.rt-guide__eyebrow {
  font-size: .625rem;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--v2-accent);
}
.rt-guide__title {
  margin-top: .25rem;
  color: var(--v2-text);
  font-size: 1.25rem;
  font-weight: 850;
  letter-spacing: -.02em;
}
.rt-guide__desc {
  margin-top: .5rem;
  color: var(--v2-text-secondary);
  font-size: .9rem;
  line-height: 1.55;
  max-width: 68ch;
}
.rt-guide__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .75rem;
  margin-top: .875rem;
}
.rt-guide__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: .55rem .875rem;
  border-radius: 9px;
  border: 1px solid var(--v2-border-focus);
  background: var(--v2-active-strong);
  color: var(--v2-text);
  font-size: .8125rem;
  font-weight: 850;
  text-decoration: none;
  cursor: pointer;
}
.rt-guide__btn:hover { border-color: var(--v2-accent); color: var(--v2-accent); }
.rt-guide__hint {
  color: var(--v2-text-dim);
  font-size: .75rem;
  line-height: 1.4;
}
.rt-guide__steps {
  display: grid;
  gap: .5rem;
}
.rt-guide-step {
  display: flex;
  gap: .625rem;
  padding: .625rem;
  border-radius: 11px;
  border: 1px solid var(--v2-border-subtle);
  background: rgba(0,0,0,.12);
}
.rt-guide-step--active {
  border-color: var(--v2-border-focus);
  background: var(--v2-active);
}
.rt-guide-step > span {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--v2-hover);
  color: var(--v2-text-secondary);
  font-size: .75rem;
  font-weight: 900;
}
.rt-guide-step--active > span {
  background: var(--v2-accent);
  color: var(--v2-bg);
}
.rt-guide-step strong {
  display: block;
  color: var(--v2-text);
  font-size: .8125rem;
  font-weight: 850;
}
.rt-guide-step small {
  display: block;
  margin-top: .125rem;
  color: var(--v2-text-secondary);
  font-size: .72rem;
  line-height: 1.35;
}

/* ── Create watched flip ──────────────────────────────────── */
.rt-create {
  margin-bottom: 1rem;
  padding: 0;
  overflow: hidden;
}
.rt-create__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 1rem 1.125rem;
  border: 0;
  background: var(--v2-hover-subtle);
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.rt-create__head:hover { background: var(--v2-hover); }
.rt-create__eyebrow {
  font-size: .625rem;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--v2-accent);
}
.rt-create__head h2 {
  margin-top: .2rem;
  color: var(--v2-text);
  font-size: 1rem;
  font-weight: 850;
}
.rt-create__body {
  padding: 1rem 1.125rem 1.125rem;
  border-top: 1px solid var(--v2-border-subtle);
}
.rt-create__intro {
  padding: .75rem .875rem;
  border-radius: 10px;
  border: 1px solid var(--v2-border-subtle);
  background: rgba(0,0,0,.12);
  color: var(--v2-text-secondary);
  font-size: .8125rem;
  line-height: 1.45;
  margin-bottom: .875rem;
}
.rt-create__intro strong { color: var(--v2-text); }
.rt-create__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .625rem;
}
.rt-create-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: .875rem;
  padding: .875rem;
  border-radius: 12px;
  border: 1px solid var(--v2-border-focus);
  background: var(--v2-active);
}
.rt-create-result span {
  display: block;
  color: var(--v2-text-secondary);
  font-size: .72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.rt-create-result strong {
  display: block;
  margin-top: .2rem;
  color: var(--v2-accent);
  font-size: 1.05rem;
  font-weight: 900;
}
.rt-create-result p {
  max-width: 52ch;
  color: var(--v2-text-secondary);
  font-size: .8125rem;
  line-height: 1.45;
  text-align: right;
}
.rt-create__actions {
  display: flex;
  align-items: center;
  gap: .625rem;
  margin-top: .875rem;
}
.rt-create__actions .rt-guide__btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}
.rt-create__reset { padding: .5rem .875rem; font-size: .8125rem; }

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

.rt-entry-guide {
  padding: .75rem .875rem;
  border-radius: 10px;
  border: 1px solid var(--v2-border-subtle);
  background: rgba(0,0,0,.12);
}
.rt-entry-guide__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
}
.rt-entry-guide__head span {
  color: var(--v2-text-secondary);
  font-size: .75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.rt-entry-guide__head strong {
  color: var(--v2-text);
  font-size: .875rem;
  font-weight: 850;
  text-align: right;
}
.rt-entry-guide p {
  margin-top: .35rem;
  color: var(--v2-text-secondary);
  font-size: .8125rem;
  line-height: 1.45;
}

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
  .rt-guide { grid-template-columns: 1fr; }
  .rt-create__actions,
  .rt-create-result {
    align-items: stretch;
    flex-direction: column;
  }
  .rt-create-result p { text-align: left; }
  .rt-stats { grid-template-columns: repeat(2, 1fr); }
  .rt-actions { flex-direction: column; }
  .rt-adj__head { flex-direction: column; }
}

@media (max-width: 900px) {
  .rt-guide { grid-template-columns: 1fr; }
  .rt-create__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .rt-create__grid { grid-template-columns: 1fr; }
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
