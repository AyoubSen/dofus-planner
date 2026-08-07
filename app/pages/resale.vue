<template>
  <div v-if="hasContext" class="flex flex-col gap-5">
    <!-- ── Next action ──────────────────────────────────────────────────── -->
    <UiCard>
      <div class="flex flex-wrap gap-5">
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium tracking-wide text-subtle uppercase">{{ $t('v2.resale.guide.eyebrow') }}</p>
          <h2 class="mt-1 text-lg font-semibold text-ink">{{ resaleNextAction.title }}</h2>
          <p class="mt-1 text-sm text-muted">{{ resaleNextAction.desc }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <UiButton v-if="resaleNextAction.filter" variant="primary" size="sm" @click="statusFilter = resaleNextAction.filter">
              {{ resaleNextAction.cta }}
            </UiButton>
            <UiButton v-else variant="primary" size="sm" :to="localePath(resaleNextAction.path)">
              {{ resaleNextAction.cta }}
            </UiButton>
            <span class="text-xs text-subtle">{{ resaleNextAction.hint }}</span>
          </div>
        </div>

        <!-- The four-step flow, with the current step marked. -->
        <ol class="flex min-w-60 flex-col gap-1.5" :aria-label="$t('v2.resale.guide.workflow')">
          <li
            v-for="step in beginnerSteps"
            :key="step.key"
            :class="[
              'flex gap-2.5 rounded-md px-2 py-1.5',
              step.active ? 'bg-accent-soft' : '',
            ]"
          >
            <span
              :class="[
                'tabular flex size-5 shrink-0 items-center justify-center rounded-full border text-xs',
                step.active ? 'border-accent text-accent' : 'border-line text-subtle',
              ]"
            >{{ step.number }}</span>
            <div class="min-w-0">
              <p :class="['text-sm', step.active ? 'font-medium text-ink' : 'text-muted']">{{ step.title }}</p>
              <p class="text-xs text-subtle">{{ step.desc }}</p>
            </div>
          </li>
        </ol>
      </div>
    </UiCard>

    <!-- ── Stats ────────────────────────────────────────────────────────── -->
    <UiStatRow>
      <UiStat :label="$t('v2.resale.stats.tracked')" :value="filteredEntries.length" />
      <UiStat :label="$t('v2.resale.stats.active')" :value="activeEntries.length" />
      <UiStat :label="$t('v2.resale.stats.sold')" :value="soldEntries.length" />
      <UiStat :label="$t('v2.resale.stats.realizedPL')">
        <UiMoney :value="realizedProfit" signed size="lg" />
      </UiStat>
      <UiStat :label="$t('v2.resale.stats.avgHold')" :value="formatDuration(averageHoldDurationMs)" />
      <UiStat :label="$t('v2.resale.stats.avgReprices')" :value="averageRepricesBeforeSale" />
    </UiStatRow>

    <!-- ── Add a flip ───────────────────────────────────────────────────── -->
    <UiCard :padded="false">
      <button
        type="button"
        class="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
        :aria-expanded="showCreateForm"
        @click="showCreateForm = !showCreateForm"
      >
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-semibold text-ink">{{ $t('v2.resale.create.title') }}</h2>
          <p class="mt-0.5 text-xs text-subtle">{{ $t('v2.resale.create.eyebrow') }}</p>
        </div>
        <UiIcon name="chevronDown" :class="['text-subtle transition-transform', showCreateForm && 'rotate-180']" />
      </button>

      <div v-show="showCreateForm" class="border-t border-line p-4">
        <p class="text-sm text-muted">
          <span class="text-ink">{{ $t('v2.resale.create.ruleLabel') }}</span>
          {{ $t('v2.resale.create.rule') }}
        </p>

        <div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <UiField :label="$t('v2.resale.create.itemName')">
            <UiInput v-model="newFlip.itemName" :placeholder="$t('v2.resale.create.itemNamePlaceholder')" />
          </UiField>
          <UiField :label="$t('v2.resale.create.targetSellPrice')">
            <UiNumberInput v-model="newFlip.targetSellPrice" :min="0" />
          </UiField>
          <UiField :label="$t('v2.resale.create.minProfit')">
            <UiNumberInput v-model="newFlip.minProfit" :min="0" />
          </UiField>
          <UiField :label="$t('v2.resale.create.note')">
            <UiInput v-model="newFlip.note" :placeholder="$t('v2.resale.create.notePlaceholder')" />
          </UiField>
        </div>

        <!-- The computed output is the point of the form, so it gets the accent. -->
        <div class="mt-3 rounded-md border border-accent/30 bg-accent-soft p-3">
          <div class="flex items-baseline justify-between gap-3">
            <span class="text-sm text-muted">{{ $t('v2.resale.create.safeBuyPrice') }}</span>
            <span class="tabular text-lg font-semibold text-accent">{{ createSafeBuyPriceLabel }}</span>
          </div>
          <p class="mt-1 text-xs text-subtle">{{ createSafeBuyHint }}</p>
        </div>

        <div class="mt-3 flex gap-2">
          <UiButton variant="primary" :disabled="!canCreateWatchedFlip" @click="createWatchedFlip">
            {{ $t('v2.resale.create.submit') }}
          </UiButton>
          <UiButton variant="ghost" @click="resetCreateForm">{{ $t('v2.resale.create.reset') }}</UiButton>
        </div>
      </div>
    </UiCard>

    <!-- ── Entries ──────────────────────────────────────────────────────── -->
    <UiPageSection>
      <UiToolbar>
        <template #filters>
          <UiSegmented v-model="statusFilter" :options="statusSegments" :aria-label="$t('v2.resale.stats.tracked')" />
        </template>
      </UiToolbar>

      <UiEmptyState
        v-if="!visibleEntries.length"
        :title="emptyTitle"
        :description="statusFilter === 'all' ? $t('v2.resale.empty.descAll') : $t('v2.resale.empty.descFiltered')"
      >
        <template #icon><UiIcon name="resale" /></template>
      </UiEmptyState>

      <div v-else class="flex flex-col gap-3">
        <UiCard v-for="entry in visibleEntries" :key="entry.id">
          <!-- Header -->
          <div class="flex items-start gap-3">
            <img
              v-if="entry.itemImageUrl"
              :src="entry.itemImageUrl"
              :alt="''"
              loading="lazy"
              class="size-10 shrink-0 rounded-md bg-sunken object-contain"
            >
            <span v-else class="flex size-10 shrink-0 items-center justify-center rounded-md bg-sunken text-subtle">
              <UiIcon name="items" />
            </span>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-ink">{{ entry.itemName }}</p>
              <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-subtle">
                <UiBadge :tone="statusTone(entry.status)">{{ statusLabelMap[entry.status] }}</UiBadge>
                <span>{{ sourceLabel(entry.source) }}</span>
                <span>{{ formatRelativeDate(entry.updatedAt) }}</span>
              </div>
            </div>

            <UiButton variant="ghost" size="sm" icon :aria-label="$t('v2.resale.actions.removeEntry')" @click="removeEntry(entry.id)">
              <UiIcon name="trash" />
            </UiButton>
          </div>

          <!-- Prices -->
          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <UiField :label="$t('v2.resale.fields.buyPrice')">
              <UiNumberInput
                :model-value="entry.buyPrice ?? null"
                :min="0"
                @update:model-value="updateNumberField(entry, 'buyPrice', $event === null ? '' : String($event))"
              />
            </UiField>
            <UiField :label="$t('v2.resale.fields.listPrice')">
              <UiNumberInput
                :model-value="entry.listPrice ?? null"
                :min="0"
                @update:model-value="updateNumberField(entry, 'listPrice', $event === null ? '' : String($event))"
              />
            </UiField>
            <UiField :label="$t('v2.resale.fields.soldPrice')" :error="statusMessages[entry.id]">
              <UiNumberInput
                :model-value="entry.soldPrice ?? null"
                :min="0"
                @update:model-value="updateNumberField(entry, 'soldPrice', $event === null ? '' : String($event))"
              />
            </UiField>
          </div>

          <!-- Estimates -->
          <dl class="mt-3 grid gap-x-4 gap-y-1 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-5">
            <div v-for="row in modelRows(entry)" :key="row.label" class="flex items-baseline justify-between gap-2">
              <dt class="text-xs text-subtle">{{ row.label }}</dt>
              <dd v-if="row.signed" class="shrink-0"><UiMoney :value="row.raw" signed short size="sm" /></dd>
              <dd v-else class="tabular shrink-0 text-sm text-ink">{{ row.value }}</dd>
            </div>
          </dl>

          <!-- Guidance -->
          <div class="mt-3 rounded-md border border-line bg-sunken p-2.5">
            <div class="flex items-baseline justify-between gap-3">
              <span class="text-xs text-subtle">{{ entryGuidance(entry).label }}</span>
              <span :class="['tabular text-sm font-medium', guidanceTone(entryGuidance(entry).tone)]">
                {{ entryGuidance(entry).value }}
              </span>
            </div>
            <p class="mt-1 text-xs text-muted">{{ entryGuidance(entry).desc }}</p>
          </div>

          <!-- Status -->
          <div class="mt-3 flex flex-wrap gap-2">
            <UiButton
              v-for="action in statusActions(entry)"
              :key="action.status"
              :variant="action.current ? 'primary' : action.status === 'cancelled' ? 'danger' : 'secondary'"
              size="sm"
              :disabled="action.disabled"
              :title="action.title"
              @click="setStatus(entry, action.status)"
            >
              {{ action.label }}
            </UiButton>
          </div>

          <!-- Reprice history -->
          <details class="mt-3 border-t border-line pt-3">
            <summary class="flex cursor-pointer items-center gap-2 text-sm text-muted [&::-webkit-details-marker]:hidden">
              <UiIcon name="chevronRight" class="transition-transform [details[open]_&]:rotate-90" />
              {{ $t('v2.resale.adjustments.title') }}
              <span class="tabular text-subtle">({{ entry.priceAdjustments?.length ?? 0 }})</span>
            </summary>

            <p class="mt-1.5 text-xs text-subtle">{{ $t('v2.resale.adjustments.desc') }}</p>

            <div v-if="entry.priceAdjustments?.length" class="mt-2 flex flex-col">
              <div
                v-for="adjustment in sortedAdjustments(entry)"
                :key="adjustment.id"
                class="flex flex-wrap items-baseline gap-x-2 border-b border-line py-1.5 text-xs last:border-0"
              >
                <UiMoney :value="getAdjustmentFromPrice(adjustment)" short size="sm" />
                <UiIcon name="chevronRight" class="text-subtle" />
                <UiMoney :value="getAdjustmentToPrice(adjustment)" short size="sm" />
                <span class="ml-auto text-subtle">
                  {{ formatRelativeDate(getAdjustmentCreatedAt(adjustment)) }}
                  <span v-if="getAdjustmentReason(adjustment)">· {{ getAdjustmentReason(adjustment) }}</span>
                </span>
              </div>
            </div>
            <p v-else class="mt-2 text-xs text-subtle">{{ $t('v2.resale.adjustments.empty') }}</p>

            <div class="mt-3 flex flex-wrap items-end gap-2">
              <UiField :label="$t('v2.resale.fields.newPrice')" class="w-36">
                <UiNumberInput
                  :model-value="adjustmentDrafts[entry.id]?.toPrice ?? null"
                  :min="0"
                  size="sm"
                  @update:model-value="updateAdjustmentDraft(entry.id, 'toPrice', $event === null ? '' : String($event))"
                />
              </UiField>
              <UiField :label="$t('v2.resale.fields.reason')" class="min-w-48 flex-1">
                <UiInput
                  :model-value="adjustmentDrafts[entry.id]?.reason ?? ''"
                  size="sm"
                  :placeholder="$t('v2.resale.placeholders.adjustmentReason')"
                  @update:model-value="updateAdjustmentDraft(entry.id, 'reason', $event)"
                />
              </UiField>
              <UiButton variant="primary" size="sm" :disabled="!canSaveAdjustment(entry)" @click="saveAdjustment(entry)">
                {{ $t('v2.resale.adjustments.save') }}
              </UiButton>
              <UiButton variant="ghost" size="sm" :disabled="!canAddAdjustment(entry)" @click="addAdjustmentFromCurrentPrice(entry)">
                {{ $t('v2.resale.adjustments.snapCurrentPrice') }}
              </UiButton>
            </div>
          </details>

          <!-- Notes -->
          <UiField :label="$t('v2.resale.fields.notes')" class="mt-3">
            <textarea
              rows="2"
              :value="entry.notes ?? ''"
              class="w-full resize-y rounded-md border border-line bg-sunken px-2.5 py-1.5 text-sm text-ink transition-colors hover:border-line-strong focus:border-accent focus:outline-none"
              @input="updateTextField(entry, 'notes', ($event.target as HTMLTextAreaElement).value)"
            />
          </UiField>

          <!-- Footer -->
          <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-2.5 text-xs text-subtle">
            <span class="flex items-center gap-1">
              {{ $t('v2.resale.footer.pl') }}:
              <UiMoney :value="realizedEntryProfit(entry)" signed short size="sm" />
            </span>
            <span>{{ $t('v2.resale.footer.held', { duration: formatDuration(getHoldDurationMs(entry)) }) }}</span>
            <span>{{ $t('v2.resale.footer.market', { duration: formatDuration(getMarketDurationMs(entry)) }) }}</span>
            <span>{{ $t('v2.resale.footer.reprices', { count: entry.priceAdjustments?.length ?? 0 }) }}</span>
            <span v-if="entry.soldAt">{{ $t('v2.resale.footer.sold', { date: formatRelativeDate(entry.soldAt) }) }}</span>
          </div>
        </UiCard>
      </div>
    </UiPageSection>

    <!-- ── Transfer (advanced) ──────────────────────────────────────────── -->
    <details class="rounded-lg border border-line bg-surface">
      <summary class="flex cursor-pointer items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span class="min-w-0 flex-1 text-sm font-semibold text-ink">{{ $t('v2.resale.transfer.title') }}</span>
        <UiBadge>{{ $t('v2.common.advanced') }}</UiBadge>
      </summary>

      <div class="border-t border-line p-4">
        <p class="text-sm text-muted">{{ $t('v2.resale.transfer.hint') }}</p>
        <div class="mt-3 flex flex-wrap items-end gap-3">
          <UiField :label="$t('v2.resale.transfer.from')" class="min-w-52 flex-1">
            <UiSelect
              v-model="transferFromKey"
              :options="allCharacterOptions"
              :placeholder="$t('v2.resale.transfer.selectCharacter')"
              :aria-label="$t('v2.resale.transfer.from')"
            />
          </UiField>
          <UiField :label="$t('v2.resale.transfer.to')" class="min-w-52 flex-1">
            <UiSelect
              v-model="transferToKey"
              :options="transferToOptions"
              :placeholder="$t('v2.resale.transfer.selectCharacter')"
              :aria-label="$t('v2.resale.transfer.to')"
            />
          </UiField>
          <UiButton
            variant="primary"
            :disabled="!transferFromKey || !transferToKey || transferFromCount === 0"
            @click="doTransfer"
          >
            {{ $t('v2.resale.transfer.action', { count: transferFromCount }) }}
          </UiButton>
        </div>
        <p v-if="transferFromKey" class="mt-1.5 text-xs text-subtle">
          {{ $t('v2.resale.transfer.entriesCount', { count: transferFromCount }) }}
        </p>
      </div>
    </details>
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
  createSafeBuyPrice.value == null
    ? t('v2.resale.create.enterTarget')
    : t('v2.resale.create.orLess', { amount: formatKamasFull(createSafeBuyPrice.value) }),
)
const createSafeBuyHint = computed(() => {
  if (!newFlip.itemName.trim()) return t('v2.resale.create.hintName')
  if (createTargetSellPrice.value == null) return t('v2.resale.create.hintTarget')
  if (createMinProfit.value <= 0) return t('v2.resale.create.hintProfit')
  return t('v2.resale.create.hintResult', {
    profit: formatKamasFull(createMinProfit.value),
    max: formatKamasFull(createSafeBuyPrice.value ?? 0),
  })
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
  filter?: ResaleStatusFilter
}>(() => {
  const g = (key: string, params?: Record<string, unknown>) =>
    t(`v2.resale.next.${key}`, params ?? {})

  // Priority order matches where capital is most at risk: money already
  // locked in stale listings, then unlisted purchases, then decisions.
  if (staleListedEntries.value.length > 0) {
    return {
      title: g('stale.title'),
      desc: g('stale.desc', { count: staleListedEntries.value.length }),
      cta: g('stale.cta'),
      hint: g('stale.hint'),
      path: '/resale',
      filter: 'listed',
    }
  }

  if (boughtEntries.value.length > 0) {
    return {
      title: g('bought.title'),
      desc: g('bought.desc', { count: boughtEntries.value.length }),
      cta: g('bought.cta'),
      hint: g('bought.hint'),
      path: '/resale',
      filter: 'bought',
    }
  }

  if (watchedEntries.value.length > 0) {
    return {
      title: g('watched.title'),
      desc: g('watched.desc', { count: watchedEntries.value.length }),
      cta: g('watched.cta'),
      hint: g('watched.hint'),
      path: '/resale',
      filter: 'watched',
    }
  }

  if (soldEntries.value.length > 0) {
    return {
      title: g('sold.title'),
      desc: g('sold.desc', { count: soldEntries.value.length, profit: formatKamasFull(realizedProfit.value) }),
      cta: g('sold.cta'),
      hint: g('sold.hint'),
      path: '/resale',
      filter: 'sold',
    }
  }

  return {
    title: g('idle.title'),
    desc: g('idle.desc'),
    cta: g('idle.cta'),
    hint: g('idle.hint'),
    path: '/resale',
    filter: 'all',
  }
})

const beginnerSteps = computed(() => [
  {
    key: 'watch',
    number: 1,
    title: t('v2.resale.steps.watch.title'),
    desc: t('v2.resale.steps.watch.desc'),
    active: watchedEntries.value.length > 0,
  },
  {
    key: 'buy',
    number: 2,
    title: t('v2.resale.steps.buy.title'),
    desc: t('v2.resale.steps.buy.desc'),
    active: boughtEntries.value.length > 0,
  },
  {
    key: 'list',
    number: 3,
    title: t('v2.resale.steps.list.title'),
    desc: t('v2.resale.steps.list.desc'),
    active: listedEntries.value.length > 0,
  },
  {
    key: 'close',
    number: 4,
    title: t('v2.resale.steps.close.title'),
    desc: t('v2.resale.steps.close.desc'),
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

// ── View-model helpers ────────────────────────────────────────────────────

// The counts stay in the label so the segmented control still tells you how
// much is sitting in each stage without a second row of badges.
const statusSegments = computed(() =>
  statusFilters.value.map(f => ({ label: `${f.label} (${f.count})`, value: f.id })),
)

const statusTone = (status: ResaleTrackerStatus) => {
  if (status === 'sold') return 'positive'
  if (status === 'cancelled') return 'negative'
  if (status === 'listed') return 'accent'
  return 'neutral'
}

/** The old markup carried `rt-pos` / `rt-neg` class names through the data. */
const guidanceTone = (tone: string) => {
  if (tone === 'rt-pos') return 'text-positive'
  if (tone === 'rt-neg') return 'text-negative'
  return 'text-ink'
}

const modelRows = (entry: ResaleTrackerEntry) => [
  { label: t('v2.resale.model.observed'), value: formatKamasFull(entry.buyPrice ?? 0), signed: false, raw: entry.buyPrice ?? 0 },
  { label: t('v2.resale.model.quickTarget'), value: formatKamasOptional(getEstimate(entry, 'estimatedQuickRelistPrice', 'estimatedQuickRelist')), signed: false, raw: 0 },
  { label: t('v2.resale.model.fairTarget'), value: formatKamasOptional(getEstimate(entry, 'estimatedFairRelistPrice', 'estimatedFairValue')), signed: false, raw: 0 },
  { label: t('v2.resale.model.greedyTarget'), value: formatKamasOptional(getEstimate(entry, 'estimatedGreedyRelistPrice', 'estimatedGreedyRelist')), signed: false, raw: 0 },
  { label: t('v2.resale.model.predictedDelta'), value: '', signed: true, raw: getEstimate(entry, 'estimatedDelta') },
]

const statusActions = (entry: ResaleTrackerEntry) => [
  { status: 'bought' as const, label: statusLabel('bought'), current: entry.status === 'bought', disabled: entry.status === 'bought', title: undefined },
  { status: 'listed' as const, label: statusLabel('listed'), current: entry.status === 'listed', disabled: entry.status === 'listed', title: undefined },
  {
    status: 'sold' as const,
    label: statusLabel('sold'),
    current: entry.status === 'sold',
    disabled: entry.status === 'sold' || !canMarkSold(entry),
    title: canMarkSold(entry) ? t('v2.resale.actions.markAsSold') : t('v2.resale.messages.enterSoldPriceFirst'),
  },
  { status: 'cancelled' as const, label: t('v2.resale.actions.cancel'), current: entry.status === 'cancelled', disabled: entry.status === 'cancelled', title: undefined },
]

const sortedAdjustments = (entry: ResaleTrackerEntry) =>
  [...(entry.priceAdjustments ?? [])].sort(
    (a, b) => getAdjustmentCreatedAtMs(b) - getAdjustmentCreatedAtMs(a),
  )

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
