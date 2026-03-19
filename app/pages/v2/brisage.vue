<template>
  <div>
    <div v-if="!hasContext" class="v2-no-context">
      <div class="v2-no-context__icon">
        <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.5 3.5L21 10l-4 4M9.5 20.5L3 14l4-4m8-6.5l-9 9" />
        </svg>
      </div>
      <div class="v2-no-context__title">{{ $t('v2.common.noCharacterTitle') }}</div>
      <div class="v2-no-context__desc">{{ $t('v2.brisage.noCharacterDesc') }}</div>
    </div>

    <template v-else>
      <div class="br-stats">
        <div class="br-stat">
          <div class="br-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="br-stat__body">
            <div class="br-stat__val">{{ sessions.length }}</div>
            <div class="br-stat__lbl">Sessions</div>
          </div>
        </div>

        <div class="br-stat">
          <div class="br-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div class="br-stat__body">
            <div class="br-stat__val">{{ totalItemsLogged }}</div>
            <div class="br-stat__lbl">Items logged</div>
          </div>
        </div>

        <div class="br-stat" :class="totalPL >= 0 ? 'br-stat--green' : 'br-stat--red'">
          <div class="br-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="br-stat__body">
            <div class="br-stat__val" :style="totalPL >= 0 ? 'color:#34d399' : 'color:#f87171'">
              {{ totalPL >= 0 ? '+' : '' }}{{ formatKamas(totalPL) }}
            </div>
            <div class="br-stat__lbl">Total P/L</div>
          </div>
        </div>

        <div class="br-stat">
          <div class="br-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4" />
            </svg>
          </div>
          <div class="br-stat__body">
            <div class="br-stat__val" :style="avgSessionPL >= 0 ? 'color:#34d399' : 'color:#f87171'">
              {{ avgSessionPL >= 0 ? '+' : '' }}{{ formatKamas(avgSessionPL) }}
            </div>
            <div class="br-stat__lbl">Avg session P/L</div>
          </div>
        </div>
      </div>

      <div class="br-layout">
        <div class="br-panel">
          <div class="br-panel-title">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.5 3.5L21 10l-4 4M9.5 20.5L3 14l4-4m8-6.5l-9 9" />
            </svg>
            Session builder
          </div>

          <div class="br-form">
            <div class="br-form__row">
              <div class="br-form__field">
                <label class="br-field-lbl">Date</label>
                <input v-model="draftSession.date" type="date" class="br-field-input" />
              </div>
              <div class="br-form__field">
                <label class="br-field-lbl">Focus category</label>
                <input v-model="draftSession.categoryLabel" type="text" placeholder="Amulets, rings, capes..." class="br-field-input" />
              </div>
            </div>

            <div class="br-form__row">
              <div class="br-form__field">
                <label class="br-field-lbl">Level min</label>
                <input v-model.number="draftSession.levelMin" type="number" min="1" max="200" class="br-field-input" />
              </div>
              <div class="br-form__field">
                <label class="br-field-lbl">Level max</label>
                <input v-model.number="draftSession.levelMax" type="number" min="1" max="200" class="br-field-input" />
              </div>
            </div>

            <div class="br-form__field">
              <label class="br-field-lbl">Session notes</label>
              <input v-model="draftSession.notes" type="text" placeholder="What are you targeting in this batch?" class="br-field-input" />
            </div>

            <div class="br-form__row br-form__row--triple">
              <div class="br-form__field">
                <label class="br-field-lbl">Starting kamas</label>
                <input v-model.number="draftSession.startingKamas" type="number" step="1000" class="br-field-input" />
              </div>
              <div class="br-form__field">
                <label class="br-field-lbl">Ending kamas</label>
                <input v-model.number="draftSession.endingKamas" type="number" step="1000" class="br-field-input" />
              </div>
              <div class="br-form__field">
                <label class="br-field-lbl">External delta</label>
                <input v-model.number="draftSession.externalDelta" type="number" step="1000" class="br-field-input" />
                <div class="br-field-help">Use this for kamas changes outside this brisage batch, like unrelated buys, sales, or taxes.</div>
              </div>
            </div>

            <div class="br-session-summary">
              <div class="br-session-summary__item">
                <div class="br-session-summary__label">Draft items</div>
                <div class="br-session-summary__value">{{ draftItems.length }}</div>
              </div>
              <div class="br-session-summary__item">
                <div class="br-session-summary__label">Craft total</div>
                <div class="br-session-summary__value">{{ formatKamas(draftTotals.craft) }}</div>
              </div>
              <div class="br-session-summary__item">
                <div class="br-session-summary__label">Realized value</div>
                <div class="br-session-summary__value">{{ formatKamas(draftTotals.realized) }}</div>
              </div>
              <div class="br-session-summary__item">
                <div class="br-session-summary__label">Session P/L</div>
                <div class="br-session-summary__value" :class="draftTotals.profit >= 0 ? 'br-profit--up' : 'br-profit--down'">
                  {{ draftTotals.profit >= 0 ? '+' : '' }}{{ formatKamas(draftTotals.profit) }}
                </div>
              </div>
              <div class="br-session-summary__item">
                <div class="br-session-summary__label">Cash delta</div>
                <div class="br-session-summary__value" :class="sessionCashDelta >= 0 ? 'br-profit--up' : 'br-profit--down'">
                  {{ sessionCashDelta >= 0 ? '+' : '' }}{{ formatKamas(sessionCashDelta) }}
                </div>
              </div>
              <div class="br-session-summary__item">
                <div class="br-session-summary__label">Reconciliation gap</div>
                <div class="br-session-summary__value" :class="sessionCashGap >= 0 ? 'br-profit--up' : 'br-profit--down'">
                  {{ sessionCashGap >= 0 ? '+' : '' }}{{ formatKamas(sessionCashGap) }}
                </div>
              </div>
            </div>
          </div>

          <div class="br-panel-title br-panel-title--sub">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Add items to this session
          </div>

          <div ref="searchAreaEl" class="br-search-area">
            <div class="br-search">
              <svg class="br-search__icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input v-model="search" type="text" :placeholder="$t('v2.common.searchItems')" class="br-search__input" @input="onSearchInput" />
              <button v-if="search" class="br-search__clear" @click="clearSearch">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="searching" class="br-inline-loader"><div class="br-spin" /> {{ $t('v2.common.searching') }}</div>

            <div v-else-if="results.length" class="br-results">
              <button
                v-for="item in results"
                :key="item.id"
                class="br-result"
                @click="addItemToDraft(item)"
              >
                <img :src="getItemImg(item)" :alt="item.name?.fr ?? ''" class="br-result__img" @error="onImgErr" />
                <div class="br-result__info">
                  <div class="br-result__name">{{ item.name?.fr ?? item.id }}</div>
                  <div class="br-result__sub">{{ item.type?.name?.fr ?? '' }} · Lv {{ item.level ?? '?' }}</div>
                </div>
                <span class="br-result__cta">Add</span>
              </button>
            </div>
            <div v-else-if="search && !searching" class="br-empty-hint">No items found for "{{ search }}"</div>
          </div>

          <div v-if="draftItems.length" class="br-draft-list">
            <div v-for="draftItem in draftItems" :key="draftItem.id" class="br-draft-card">
              <div class="br-draft-card__header">
                <div class="br-draft-card__meta">
                  <img :src="getItemImg(draftItem.item)" :alt="draftItem.item?.name?.fr ?? ''" class="br-draft-card__img" @error="onImgErr" />
                  <div>
                    <div class="br-draft-card__name">{{ draftItem.item?.name?.fr ?? draftItem.itemId }}</div>
                    <div class="br-draft-card__sub">{{ draftItem.item?.type?.name?.fr ?? '' }} · Lv {{ draftItem.item?.level ?? '?' }}</div>
                  </div>
                </div>
                <button class="br-entry__del" @click="removeDraftItem(draftItem.id)" title="Remove">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="br-form__row br-form__row--triple">
                <div class="br-form__field">
                  <label class="br-field-lbl">Qty</label>
                  <input v-model.number="draftItem.quantity" type="number" min="1" class="br-field-input" />
                </div>
                <div class="br-form__field">
                  <label class="br-field-lbl">Unit craft cost</label>
                  <input v-model.number="draftItem.unitCraftCost" type="number" min="0" step="1000" class="br-field-input" />
                </div>
                <div class="br-form__field">
                  <label class="br-field-lbl">Rune value total</label>
                  <input v-model.number="draftItem.realizedRuneValue" type="number" min="0" step="1000" class="br-field-input" />
                </div>
              </div>

              <div class="br-form__row">
                <div class="br-form__field">
                  <label class="br-field-lbl">Optional HDV reference</label>
                  <input v-model.number="draftItem.hdvReference" type="number" min="0" step="1000" class="br-field-input" />
                </div>
                <div class="br-form__field">
                  <label class="br-field-lbl">Item note</label>
                  <input v-model="draftItem.notes" type="text" placeholder="Any quick note about this break" class="br-field-input" />
                </div>
              </div>

              <div class="br-profit-preview">
                <div class="br-profit-row">
                  <span>Total craft cost</span>
                  <span>{{ formatKamas(itemCraftTotal(draftItem)) }}</span>
                </div>
                <div class="br-profit-row">
                  <span>Per-item P/L</span>
                  <span :class="itemProfit(draftItem) >= 0 ? 'br-profit--up' : 'br-profit--down'">
                    {{ itemProfit(draftItem) >= 0 ? '+' : '' }}{{ formatKamas(itemProfit(draftItem)) }}
                  </span>
                </div>
                <div class="br-profit-row" v-if="draftItem.quantity > 0">
                  <span>Avg per copy</span>
                  <span>{{ formatKamas(Math.round(itemProfit(draftItem) / draftItem.quantity)) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="br-log-empty br-log-empty--compact">
            Search for an item, add it to the draft session, then enter the total rune value you realized after breaking it in game.
          </div>

          <button class="br-submit-btn" :disabled="draftItems.length === 0" @click="saveSession">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Save session
          </button>
        </div>

        <div class="br-panel">
          <div class="br-panel-title">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.5 3.5L21 10l-4 4M9.5 20.5L3 14l4-4m8-6.5l-9 9" />
            </svg>
            Session history
            <span class="br-badge">{{ sessions.length }}</span>
          </div>

          <div v-if="sessions.length === 0" class="br-log-empty">
            <svg class="w-10 h-10 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.5 3.5L21 10l-4 4M9.5 20.5L3 14l4-4m8-6.5l-9 9" />
            </svg>
            No brisage sessions recorded yet.<br />
            <span style="font-size:.8125rem;opacity:.5">Create a draft session on the left and save it once your batch is logged.</span>
          </div>

          <div v-else class="br-log-scroll">
            <div v-for="session in sessions" :key="session.id" class="br-entry">
              <div class="br-entry__header">
                <div class="br-entry__meta">
                  <div class="br-entry__name">{{ session.categoryLabel || 'General session' }}</div>
                  <div class="br-entry__sub">{{ describeSessionScope(session) }}</div>
                  <div class="br-entry__date">{{ formatDisplayDate(session.date) }}</div>
                </div>
                <button class="br-entry__del" @click="deleteSession(session.id)" title="Delete session">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div class="br-entry__prices">
                <div class="br-price-cell br-price-cell--craft">
                  <div class="br-price-cell__lbl">Craft total</div>
                  <div class="br-price-cell__val">{{ formatKamas(sessionTotals(session).craft) }}</div>
                </div>
                <div class="br-price-cell br-price-cell--hdv">
                  <div class="br-price-cell__lbl">Cash delta</div>
                  <div class="br-price-cell__val">{{ formatKamas((session.endingKamas || 0) - (session.startingKamas || 0) - (session.externalDelta || 0)) }}</div>
                </div>
                <div class="br-price-cell br-price-cell--rune">
                  <div class="br-price-cell__lbl">Realized value</div>
                  <div class="br-price-cell__val" style="color:var(--v2-accent)">{{ formatKamas(sessionTotals(session).realized) }}</div>
                </div>
              </div>

              <div class="br-entry__profits">
                <div class="br-profit-pill" :class="sessionTotals(session).profit >= 0 ? 'br-profit-pill--pos' : 'br-profit-pill--neg'">
                  Session P/L: {{ sessionTotals(session).profit >= 0 ? '+' : '' }}{{ formatKamas(sessionTotals(session).profit) }}
                </div>
                <div class="br-profit-pill" :class="sessionMargin(session) >= 0 ? 'br-profit-pill--pos' : 'br-profit-pill--neg'">
                  Margin: {{ sessionMargin(session) >= 0 ? '+' : '' }}{{ sessionMargin(session) }}%
                </div>
                <div class="br-profit-pill" :class="(((session.endingKamas || 0) - (session.startingKamas || 0) - (session.externalDelta || 0)) - sessionTotals(session).profit) >= 0 ? 'br-profit-pill--pos' : 'br-profit-pill--neg'">
                  Gap: {{ (((session.endingKamas || 0) - (session.startingKamas || 0) - (session.externalDelta || 0)) - sessionTotals(session).profit) >= 0 ? '+' : '' }}{{ formatKamas(((session.endingKamas || 0) - (session.startingKamas || 0) - (session.externalDelta || 0)) - sessionTotals(session).profit) }}
                </div>
              </div>

              <div class="br-session-items">
                <div v-for="item in session.items" :key="item.id" class="br-session-item-row">
                  <div class="br-session-item-row__meta">
                    <img :src="getItemImg(item.item)" :alt="item.item?.name?.fr ?? ''" class="br-session-item-row__img" @error="onImgErr" />
                    <div>
                      <div class="br-session-item-row__name">{{ item.item?.name?.fr ?? item.itemId }}</div>
                      <div class="br-session-item-row__sub">x{{ item.quantity }} · Unit {{ formatKamas(item.unitCraftCost) }} · Total {{ formatKamas(itemCraftTotal(item)) }} · Realized {{ formatKamas(item.realizedRuneValue) }}</div>
                    </div>
                  </div>
                  <div class="br-session-item-row__profit" :class="itemProfit(item) >= 0 ? 'br-profit--up' : 'br-profit--down'">
                    {{ itemProfit(item) >= 0 ? '+' : '' }}{{ formatKamas(itemProfit(item)) }}
                  </div>
                </div>
              </div>

              <div v-if="session.notes" class="br-entry__notes">{{ session.notes }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'v2' })

const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()

interface BrisageSessionItem {
  id: string
  itemId: string | number
  item: any
  quantity: number
  unitCraftCost: number
  hdvReference: number
  realizedRuneValue: number
  notes: string
}

interface BrisageSession {
  id: string
  date: string
  startingKamas: number
  endingKamas: number
  externalDelta: number
  levelMin: number | null
  levelMax: number | null
  categoryLabel: string
  notes: string
  items: BrisageSessionItem[]
}

interface LegacyBrisageEntry {
  id: string
  itemId: string | number
  item: any
  craftPrice: number
  hdvPrice: number
  runeValue: number
  date: string
  notes: string
}

const sessionsKey = computed(() =>
  `brisage_sessions_${selectedServer.value?.id}_${selectedCharacter.value?.id}`,
)
const legacyEntriesKey = computed(() =>
  `brisage_entries_${selectedServer.value?.id}_${selectedCharacter.value?.id}`,
)

const sessions = ref<BrisageSession[]>([])
const draftItems = ref<BrisageSessionItem[]>([])
const draftSession = ref({
  date: todayISO(),
  startingKamas: 0,
  endingKamas: 0,
  externalDelta: 0,
  levelMin: null as number | null,
  levelMax: null as number | null,
  categoryLabel: '',
  notes: '',
})

const search = ref('')
const searching = ref(false)
const results = ref<any[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

const normalizeLevelValue = (value: unknown) => {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null
  return Math.max(1, Math.min(200, Math.round(num)))
}

const normalizeSessionItem = (record: any): BrisageSessionItem | null => {
  if (!record?.id || !record?.item) return null
  return {
    id: String(record.id),
    itemId: record.itemId,
    item: record.item,
    quantity: Math.max(1, Number(record.quantity ?? 1) || 1),
    unitCraftCost: Math.max(0, Number(record.unitCraftCost ?? record.craftCost ?? 0) || 0),
    hdvReference: Math.max(0, Number(record.hdvReference ?? 0) || 0),
    realizedRuneValue: Math.max(0, Number(record.realizedRuneValue ?? 0) || 0),
    notes: String(record.notes ?? ''),
  }
}

const normalizeSessionRecord = (record: any): BrisageSession | null => {
  if (!record?.id) return null
  const items = Array.isArray(record?.items)
    ? record.items.map(normalizeSessionItem).filter(Boolean) as BrisageSessionItem[]
    : []
  return {
    id: String(record.id),
    date: String(record.date ?? todayISO()),
    startingKamas: Number(record.startingKamas ?? 0) || 0,
    endingKamas: Number(record.endingKamas ?? 0) || 0,
    externalDelta: Number(record.externalDelta ?? 0) || 0,
    levelMin: normalizeLevelValue(record.levelMin),
    levelMax: normalizeLevelValue(record.levelMax),
    categoryLabel: String(record.categoryLabel ?? ''),
    notes: String(record.notes ?? ''),
    items,
  }
}

const normalizeLegacyEntry = (record: any): LegacyBrisageEntry | null => {
  if (!record?.id || !record?.item) return null
  return {
    id: String(record.id),
    itemId: record.itemId,
    item: record.item,
    craftPrice: Math.max(0, Number(record.craftPrice ?? 0) || 0),
    hdvPrice: Math.max(0, Number(record.hdvPrice ?? 0) || 0),
    runeValue: Math.max(0, Number(record.runeValue ?? 0) || 0),
    date: String(record.date ?? todayISO()),
    notes: String(record.notes ?? ''),
  }
}

const migrateLegacyEntries = (legacyEntries: LegacyBrisageEntry[]) =>
  legacyEntries.map(entry => ({
    id: `legacy-${entry.id}`,
    date: entry.date || todayISO(),
    startingKamas: 0,
    endingKamas: 0,
    externalDelta: 0,
    levelMin: normalizeLevelValue(entry.item?.level),
    levelMax: normalizeLevelValue(entry.item?.level),
    categoryLabel: String(entry.item?.type?.name?.fr ?? ''),
    notes: entry.notes,
    items: [
      {
        id: entry.id,
        itemId: entry.itemId,
        item: entry.item,
        quantity: 1,
        unitCraftCost: entry.craftPrice,
        hdvReference: entry.hdvPrice,
        realizedRuneValue: entry.runeValue,
        notes: entry.notes,
      },
    ],
  } satisfies BrisageSession))

const saveSessions = () =>
  localStorage.setItem(sessionsKey.value, JSON.stringify(sessions.value))

const loadData = () => {
  if (!hasContext.value) return

  const rawSessions = localStorage.getItem(sessionsKey.value)
  if (rawSessions) {
    const parsed = JSON.parse(rawSessions)
    sessions.value = Array.isArray(parsed)
      ? parsed.map(normalizeSessionRecord).filter(Boolean) as BrisageSession[]
      : []
    saveSessions()
    return
  }

  const rawLegacyEntries = localStorage.getItem(legacyEntriesKey.value)
  const parsedLegacyEntries = rawLegacyEntries ? JSON.parse(rawLegacyEntries) : []
  const normalizedLegacyEntries = Array.isArray(parsedLegacyEntries)
    ? parsedLegacyEntries.map(normalizeLegacyEntry).filter(Boolean) as LegacyBrisageEntry[]
    : []

  sessions.value = migrateLegacyEntries(normalizedLegacyEntries)
  saveSessions()
}

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(doSearch, 350)
}

const doSearch = async () => {
  if (!search.value.trim()) {
    results.value = []
    return
  }
  searching.value = true
  try {
    const res = await $fetch<any>('/api/dofusdb/items', {
      query: {
        'slug.fr[$search]': search.value.trim(),
        'typeId[$ne]': 203,
        '$sort': '-id',
        'level[$gte]': 0,
        'level[$lte]': 200,
        '$skip': 0,
        'lang': 'fr',
      },
    })
    results.value = res?.data ?? []
  }
  catch {
    results.value = []
  }
  finally {
    searching.value = false
  }
}

const clearSearch = () => {
  search.value = ''
  results.value = []
}

const addItemToDraft = (item: any) => {
  draftItems.value.unshift({
    id: crypto.randomUUID(),
    itemId: item.id,
    item,
    quantity: 1,
    unitCraftCost: 0,
    hdvReference: 0,
    realizedRuneValue: 0,
    notes: '',
  })

  if (!draftSession.value.categoryLabel) {
    draftSession.value.categoryLabel = String(item?.type?.name?.fr ?? '')
  }
  if (draftSession.value.levelMin == null && item?.level) {
    draftSession.value.levelMin = normalizeLevelValue(item.level)
  }
  if (draftSession.value.levelMax == null && item?.level) {
    draftSession.value.levelMax = normalizeLevelValue(item.level)
  }

  clearSearch()
}

const removeDraftItem = (id: string) => {
  draftItems.value = draftItems.value.filter(item => item.id !== id)
}

const itemCraftTotal = (item: BrisageSessionItem) =>
  Math.max(1, Number(item.quantity) || 1) * (Number(item.unitCraftCost) || 0)

const itemProfit = (item: BrisageSessionItem) =>
  (Number(item.realizedRuneValue) || 0) - itemCraftTotal(item)

const sessionTotals = (session: BrisageSession) => {
  const craft = session.items.reduce((sum, item) => sum + itemCraftTotal(item), 0)
  const realized = session.items.reduce((sum, item) => sum + (Number(item.realizedRuneValue) || 0), 0)
  return { craft, realized, profit: realized - craft }
}

const draftTotals = computed(() => {
  const craft = draftItems.value.reduce((sum, item) => sum + itemCraftTotal(item), 0)
  const realized = draftItems.value.reduce((sum, item) => sum + (Number(item.realizedRuneValue) || 0), 0)
  return { craft, realized, profit: realized - craft }
})

const sessionCashDelta = computed(() =>
  (Number(draftSession.value.endingKamas) || 0)
  - (Number(draftSession.value.startingKamas) || 0)
  - (Number(draftSession.value.externalDelta) || 0),
)

const sessionCashGap = computed(() => sessionCashDelta.value - draftTotals.value.profit)

const totalItemsLogged = computed(() =>
  sessions.value.reduce((sum, session) => sum + session.items.length, 0),
)

const totalPL = computed(() =>
  sessions.value.reduce((sum, session) => sum + sessionTotals(session).profit, 0),
)

const avgSessionPL = computed(() => {
  if (!sessions.value.length) return 0
  return Math.round(totalPL.value / sessions.value.length)
})

const sessionMargin = (session: BrisageSession) => {
  const totals = sessionTotals(session)
  if (!totals.craft) return 0
  return Math.round((totals.profit / totals.craft) * 100)
}

const resetDraft = () => {
  draftItems.value = []
  draftSession.value = {
    date: todayISO(),
    startingKamas: 0,
    endingKamas: 0,
    externalDelta: 0,
    levelMin: null,
    levelMax: null,
    categoryLabel: '',
    notes: '',
  }
  clearSearch()
}

const saveSession = () => {
  if (!draftItems.value.length) return

  sessions.value.unshift({
    id: crypto.randomUUID(),
    date: draftSession.value.date || todayISO(),
    startingKamas: Number(draftSession.value.startingKamas) || 0,
    endingKamas: Number(draftSession.value.endingKamas) || 0,
    externalDelta: Number(draftSession.value.externalDelta) || 0,
    levelMin: normalizeLevelValue(draftSession.value.levelMin),
    levelMax: normalizeLevelValue(draftSession.value.levelMax),
    categoryLabel: draftSession.value.categoryLabel.trim(),
    notes: draftSession.value.notes.trim(),
    items: draftItems.value.map(item => ({
      ...item,
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitCraftCost: Math.max(0, Number(item.unitCraftCost) || 0),
      hdvReference: Math.max(0, Number(item.hdvReference) || 0),
      realizedRuneValue: Math.max(0, Number(item.realizedRuneValue) || 0),
      notes: item.notes.trim(),
    })),
  })

  saveSessions()
  resetDraft()
}

const deleteSession = (id: string) => {
  sessions.value = sessions.value.filter(session => session.id !== id)
  saveSessions()
}

const describeSessionScope = (session: BrisageSession) => {
  const parts: string[] = []
  if (session.levelMin && session.levelMax) parts.push(`Lv ${session.levelMin}-${session.levelMax}`)
  else if (session.levelMin) parts.push(`Lv ${session.levelMin}+`)
  else if (session.levelMax) parts.push(`Up to Lv ${session.levelMax}`)
  if (session.categoryLabel) parts.push(session.categoryLabel)
  return parts.join(' · ') || 'No explicit scope'
}

const getItemImg = (item: any) => item?.img ?? ''
const onImgErr = (e: Event) => {
  const img = e.target as HTMLImageElement
  if (img.dataset.fb) return
  img.dataset.fb = '1'
  img.src = '/item-fallback.svg'
}

const formatKamas = (n: number) => {
  if (!n) return '0'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${Math.round(n / 1_000)}K`
  return Math.round(n).toLocaleString()
}

function todayISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

const formatDisplayDate = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })
}

const searchAreaEl = ref<HTMLElement | null>(null)
const onDocMousedown = (e: MouseEvent) => {
  const t = e.target as Node
  if (searchAreaEl.value && !searchAreaEl.value.contains(t)) {
    results.value = []
  }
}

onMounted(() => {
  initContext()
  loadData()
  document.addEventListener('mousedown', onDocMousedown)
})

onUnmounted(() => document.removeEventListener('mousedown', onDocMousedown))
watch([selectedServer, selectedCharacter], loadData)
</script>

<style scoped>
.br-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: .625rem;
  margin-bottom: .875rem;
}

.br-stat {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .875rem 1rem;
  border-radius: 12px;
  background: var(--v2-hover);
  border: 1px solid var(--v2-border-med);
}

.br-stat--green { border-color: rgba(52,211,153,.2); background: rgba(52,211,153,.05); }
.br-stat--red { border-color: rgba(248,113,113,.2); background: rgba(248,113,113,.05); }

.br-stat__icon {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 9px;
  background: var(--v2-border-med);
  color: var(--v2-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.br-stat--green .br-stat__icon { background: rgba(52,211,153,.15); color: #34d399; }
.br-stat--red .br-stat__icon { background: rgba(248,113,113,.15); color: #f87171; }
.br-stat__val { font-size: 1.25rem; font-weight: 800; color: var(--v2-text); line-height: 1.2; }
.br-stat__lbl { font-size: .6875rem; color: var(--v2-text-dim); margin-top: 1px; }

.br-layout {
  display: grid;
  grid-template-columns: minmax(340px, 440px) 1fr;
  gap: 1rem;
  align-items: start;
}

@media (max-width: 980px) {
  .br-layout { grid-template-columns: 1fr; }
}

.br-panel {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  padding: 1rem;
}

.br-panel-title {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-size: .875rem;
  font-weight: 700;
  color: var(--v2-accent);
  margin-bottom: .875rem;
}

.br-panel-title--sub {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--v2-active);
}

.br-badge {
  background: var(--v2-active-strong);
  color: var(--v2-accent);
  font-size: .6875rem;
  font-weight: 600;
  padding: .125rem .4375rem;
  border-radius: 999px;
}

.br-form {
  background: rgba(0,0,0,.18);
  border: 1px solid var(--v2-border);
  border-radius: 12px;
  padding: .875rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.br-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .5rem;
}

.br-form__row--triple {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 540px) {
  .br-form__row,
  .br-form__row--triple {
    grid-template-columns: 1fr;
  }
}

.br-form__field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.br-field-lbl { font-size: .6875rem; color: var(--v2-text-secondary); font-weight: 500; }
.br-field-help { font-size: .6875rem; color: var(--v2-text-muted); line-height: 1.35; margin-top: 2px; }

.br-field-input {
  background: rgba(0,0,0,.3);
  border: 1px solid var(--v2-active-strong);
  border-radius: 8px;
  padding: .4375rem .75rem;
  color: var(--v2-text);
  font-size: .875rem;
  outline: none;
  transition: border-color .15s;
  width: 100%;
}

.br-field-input:focus { border-color: var(--v2-border-focus); }
.br-field-input::placeholder { color: var(--v2-text-dim); }

.br-session-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .5rem;
}

.br-session-summary__item {
  padding: .625rem .75rem;
  border-radius: 10px;
  background: rgba(0,0,0,.22);
  border: 1px solid var(--v2-border-med);
}

.br-session-summary__label {
  font-size: .6875rem;
  color: var(--v2-text-muted);
  text-transform: uppercase;
  letter-spacing: .04em;
}

.br-session-summary__value {
  margin-top: .25rem;
  font-size: .95rem;
  font-weight: 800;
  color: var(--v2-text);
}

.br-search { position: relative; display: flex; align-items: center; margin-bottom: .75rem; }
.br-search__icon { position: absolute; left: .75rem; color: var(--v2-text-muted); pointer-events: none; }

.br-search__input {
  background: rgba(0,0,0,.3);
  border: 1px solid var(--v2-border);
  border-radius: 10px;
  padding: .5rem 2.25rem;
  color: var(--v2-text);
  font-size: .875rem;
  outline: none;
  width: 100%;
  transition: border-color .18s;
}

.br-search__input:focus { border-color: var(--v2-border-focus); }
.br-search__input::placeholder { color: var(--v2-text-dim); }

.br-search__clear {
  position: absolute;
  right: .625rem;
  background: none;
  border: none;
  color: var(--v2-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
}

.br-search__clear:hover { color: var(--v2-accent); }
.br-inline-loader { display: flex; align-items: center; gap: .5rem; font-size: .8125rem; color: var(--v2-text-secondary); padding: .375rem 0; }

.br-spin {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 2px solid var(--v2-border-med);
  border-top-color: var(--v2-accent);
  border-radius: 50%;
  animation: brspin .8s linear infinite;
}

@keyframes brspin { to { transform: rotate(360deg); } }

.br-empty-hint { font-size: .8125rem; color: var(--v2-text-muted); padding: .375rem 0; }

.br-results {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 200px;
  overflow-y: auto;
}

.br-result {
  display: flex;
  align-items: center;
  gap: .625rem;
  padding: .4375rem .625rem;
  border-radius: 9px;
  border: 1px solid transparent;
  background: rgba(0,0,0,.15);
  cursor: pointer;
  transition: all .15s;
  text-align: left;
}

.br-result:hover { background: var(--v2-glow); border-color: var(--v2-active-strong); }
.br-result__img { width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; }
.br-result__name { font-size: .8125rem; font-weight: 600; color: var(--v2-text); }
.br-result__sub { font-size: .6875rem; color: var(--v2-text-muted); margin-top: 1px; }
.br-result__info { flex: 1; min-width: 0; }
.br-result__cta { font-size: .6875rem; font-weight: 700; color: var(--v2-accent); }

.br-draft-list {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  margin-top: .75rem;
  margin-bottom: .875rem;
}

.br-draft-card {
  background: rgba(0,0,0,.18);
  border: 1px solid var(--v2-active);
  border-radius: 12px;
  padding: .875rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.br-draft-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: .75rem;
}

.br-draft-card__meta {
  display: flex;
  align-items: center;
  gap: .75rem;
  min-width: 0;
}

.br-draft-card__img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  flex-shrink: 0;
}

.br-draft-card__name { font-size: .9375rem; font-weight: 700; color: var(--v2-text); }
.br-draft-card__sub { font-size: .75rem; color: var(--v2-text-secondary); margin-top: 2px; }

.br-profit-preview {
  background: rgba(0,0,0,.2);
  border: 1px solid var(--v2-active);
  border-radius: 8px;
  padding: .5rem .75rem;
  display: flex;
  flex-direction: column;
  gap: .25rem;
}

.br-profit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: .8125rem;
  color: var(--v2-text-secondary);
}

.br-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: .625rem 1rem;
  border-radius: 10px;
  background: var(--v2-border-med);
  border: 1px solid var(--v2-border-strong);
  color: var(--v2-text);
  font-size: .875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .18s;
  width: 100%;
}

.br-submit-btn:hover:not(:disabled) { background: var(--v2-border-strong); }
.br-submit-btn:disabled { opacity: .35; cursor: not-allowed; }

.br-log-empty {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--v2-text-muted);
  font-size: .9375rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .25rem;
}

.br-log-empty--compact {
  padding: 1rem;
  margin-top: .75rem;
  margin-bottom: .875rem;
  border: 1px dashed var(--v2-active);
  border-radius: 12px;
}

.br-log-scroll {
  display: flex;
  flex-direction: column;
  gap: .625rem;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

.br-entry {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 12px;
  padding: .875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: .625rem;
}

.br-entry:hover { border-color: var(--v2-border-strong); }
.br-entry__header { display: flex; align-items: flex-start; gap: .75rem; }
.br-entry__meta { flex: 1; min-width: 0; }
.br-entry__name { font-size: .9375rem; font-weight: 700; color: var(--v2-text); }
.br-entry__sub { font-size: .6875rem; color: var(--v2-text-secondary); margin-top: 1px; }
.br-entry__date { font-size: .6875rem; color: var(--v2-text-secondary); margin-top: 3px; }

.br-entry__del {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--v2-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 5px;
  transition: all .15s;
}

.br-entry__del:hover { color: #f87171; background: rgba(248,113,113,.1); }

.br-entry__prices {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .5rem;
}

@media (max-width: 640px) {
  .br-entry__prices { grid-template-columns: 1fr; }
}

.br-price-cell { padding: .5rem .625rem; border-radius: 8px; text-align: center; }
.br-price-cell--craft { background: var(--v2-hover); border: 1px solid var(--v2-border-med); }
.br-price-cell--hdv { background: rgba(96,165,250,.06); border: 1px solid rgba(96,165,250,.15); }
.br-price-cell--rune { background: var(--v2-hover); border: 1px solid var(--v2-border-med); }
.br-price-cell__lbl { font-size: .625rem; color: var(--v2-text-dim); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px; }
.br-price-cell__val { font-size: .9375rem; font-weight: 700; color: var(--v2-text); }

.br-entry__profits { display: flex; flex-wrap: wrap; gap: .375rem; }

.br-profit-pill {
  display: flex;
  align-items: center;
  gap: .3125rem;
  padding: .3125rem .625rem;
  border-radius: 999px;
  font-size: .75rem;
  font-weight: 600;
}

.br-profit-pill--pos { background: rgba(52,211,153,.1); color: #34d399; border: 1px solid rgba(52,211,153,.22); }
.br-profit-pill--neg { background: rgba(248,113,113,.1); color: #f87171; border: 1px solid rgba(248,113,113,.22); }
.br-profit--up { color: #86efac; }
.br-profit--down { color: #fca5a5; }

.br-session-items {
  display: flex;
  flex-direction: column;
  gap: .375rem;
}

.br-session-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  padding: .5rem .625rem;
  border-radius: 8px;
  background: rgba(0,0,0,.15);
  border: 1px solid var(--v2-active);
}

@media (max-width: 640px) {
  .br-session-item-row {
    flex-direction: column;
    align-items: stretch;
  }
}

.br-session-item-row__meta {
  display: flex;
  align-items: center;
  gap: .625rem;
  min-width: 0;
}

.br-session-item-row__img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  flex-shrink: 0;
}

.br-session-item-row__name { font-size: .8125rem; font-weight: 700; color: var(--v2-text); }
.br-session-item-row__sub { font-size: .6875rem; color: var(--v2-text-secondary); margin-top: 2px; }
.br-session-item-row__profit { font-size: .8125rem; font-weight: 700; flex-shrink: 0; }
.br-entry__notes { font-size: .75rem; color: var(--v2-text-secondary); font-style: italic; }
</style>
