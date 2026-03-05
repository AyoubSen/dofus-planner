<template>
  <div>
    <!-- Filters bar -->
    <div class="v2-items-filters">
      <!-- Element -->
      <div class="v2-filter-group">
        <span class="v2-filter-label">{{ $t('items.filters.elements.title') }}</span>
        <div class="v2-filter-chips">
          <button
            class="v2-fchip"
            :class="{ 'v2-fchip--on': !filters.element }"
            @click="setFilter('element', '')"
          >{{ $t('items.filters.elements.all') }}</button>
          <button
            v-for="el in ELEMENTS"
            :key="el.name"
            class="v2-fchip v2-fchip--icon"
            :class="{ 'v2-fchip--on': filters.element === el.name }"
            :title="el.name"
            @click="setFilter('element', el.name)"
          >
            <img :src="el.icon" :alt="el.name" class="w-4 h-4 object-contain" @error="noImg" />
          </button>
        </div>
      </div>

      <!-- Mode -->
      <div class="v2-filter-group">
        <span class="v2-filter-label">{{ $t('items.filters.mode.title') }}</span>
        <div class="v2-filter-chips">
          <button class="v2-fchip" :class="{ 'v2-fchip--on': !filters.mode }" @click="setFilter('mode', '')">{{ $t('items.filters.mode.all') }}</button>
          <button
            v-for="m in MODES"
            :key="m"
            class="v2-fchip"
            :class="{ 'v2-fchip--on': filters.mode === m }"
            @click="setFilter('mode', m)"
          >{{ m.toUpperCase() }}</button>
        </div>
      </div>

      <!-- Level -->
      <div class="v2-filter-group">
        <span class="v2-filter-label">{{ $t('items.filters.level.title') }}</span>
        <div class="v2-filter-chips">
          <button class="v2-fchip" :class="{ 'v2-fchip--on': !filters.level }" @click="setFilter('level', '')">{{ $t('items.filters.level.all') }}</button>
          <button
            v-for="lv in LEVELS"
            :key="lv"
            class="v2-fchip"
            :class="{ 'v2-fchip--on': filters.level === lv }"
            @click="setFilter('level', lv)"
          >{{ lv }}</button>
        </div>
      </div>

      <!-- Budget -->
      <div class="v2-filter-group">
        <span class="v2-filter-label">{{ $t('items.filters.budget.title') }}</span>
        <div class="v2-filter-chips">
          <button class="v2-fchip" :class="{ 'v2-fchip--on': !filters.budget }" @click="setFilter('budget', '')">{{ $t('items.filters.budget.all') }}</button>
          <button
            v-for="b in BUDGETS"
            :key="b"
            class="v2-fchip"
            :class="{ 'v2-fchip--on': filters.budget === b }"
            @click="setFilter('budget', b)"
          >{{ b.charAt(0).toUpperCase() + b.slice(1) }}</button>
        </div>
      </div>

      <!-- Class -->
      <div class="v2-filter-group">
        <span class="v2-filter-label">{{ $t('items.filters.classes.title') }}</span>
        <div class="v2-filter-chips">
          <button class="v2-fchip" :class="{ 'v2-fchip--on': !filters.classe }" @click="setFilter('classe', '')">{{ $t('items.filters.classes.all') }}</button>
          <button
            v-for="cl in CLASSES"
            :key="cl.name"
            class="v2-fchip v2-fchip--icon"
            :class="{ 'v2-fchip--on': filters.classe === cl.name }"
            :title="cl.name"
            @click="setFilter('classe', cl.name)"
          >
            <img :src="cl.icon" :alt="cl.name" class="w-5 h-5 object-cover object-top rounded" @error="noImg" />
          </button>
        </div>
      </div>
    </div>

    <!-- Stats strip -->
    <div class="v2-items-stats" v-if="stats">
      <div class="v2-stat-card">
        <div class="v2-stat-card__val">{{ stats.totalEquipments }}</div>
        <div class="v2-stat-card__label">{{ $t('items.stats.totalEquipment') }}</div>
      </div>
      <div class="v2-stat-card">
        <div class="v2-stat-card__val">{{ stats.uniqueItems }}</div>
        <div class="v2-stat-card__label">{{ $t('items.stats.uniqueItems') }}</div>
      </div>
      <div class="v2-stat-card">
        <div class="v2-stat-card__val">{{ stats.mostPopularSlot?.slot ?? '—' }}</div>
        <div class="v2-stat-card__label">{{ $t('items.stats.mostVariedSlot') }}</div>
      </div>
      <div class="v2-stat-card">
        <div class="v2-stat-card__val">{{ stats.avgItemsPerSet.toFixed(1) }}</div>
        <div class="v2-stat-card__label">{{ $t('items.stats.avgItemsPerSet') }}</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="v2-center-loader">
      <div class="v2-spin" /> {{ $t('items.loading') }}
    </div>

    <template v-else-if="stats">
      <!-- Slot tabs -->
      <div class="v2-slot-tabs">
        <button
          v-for="slot in SLOTS"
          :key="slot.key"
          class="v2-slot-tab"
          :class="{ 'v2-slot-tab--on': activeSlot === slot.key }"
          @click="activeSlot = slot.key"
        >
          <span class="v2-slot-tab__icon">{{ slot.icon }}</span>
          <span class="v2-slot-tab__label">{{ $t(`items.slots.${slot.key}`) }}</span>
          <span class="v2-slot-tab__count">{{ getSlotStats(slot.key)?.totalItems ?? 0 }}</span>
        </button>
      </div>

      <!-- Slot content -->
      <div v-if="currentSlotStats" class="v2-slot-content">
        <!-- Header row -->
        <div class="v2-slot-head">
          <span class="v2-slot-head__title">
            {{ $t('items.mostUsed', { slot: $t(`items.slots.${activeSlot}`) }) }}
          </span>
          <div class="v2-view-toggle">
            <button class="v2-view-btn" :class="{ 'v2-view-btn--on': viewMode === 'grid' }" @click="viewMode = 'grid'" :title="$t('items.viewModes.grid')">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button class="v2-view-btn" :class="{ 'v2-view-btn--on': viewMode === 'list' }" @click="viewMode = 'list'" :title="$t('items.viewModes.list')">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button class="v2-view-btn" :class="{ 'v2-view-btn--on': viewMode === 'table' }" @click="viewMode = 'table'" :title="$t('items.viewModes.table')">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- GRID VIEW -->
        <div v-if="viewMode === 'grid'" class="v2-items-grid">
          <div
            v-for="(item, i) in currentSlotStats.topItems.slice(0, 20)"
            :key="item.name"
            class="v2-item-card"
          >
            <div class="v2-item-card__rank">#{{ i + 1 }}</div>
            <div class="v2-item-card__img-wrap">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="v2-item-card__img" @error="noImg" />
              <div v-else class="v2-item-card__img-ph">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" /></svg>
              </div>
            </div>
            <div class="v2-item-card__name" :title="item.name">{{ item.name }}</div>
            <div class="v2-item-card__usage">{{ item.count }} · {{ pct(item.count) }}%</div>
            <div class="v2-item-bar"><div class="v2-item-bar__fill" :style="{ width: barW(item.count) }" /></div>
          </div>
        </div>

        <!-- LIST VIEW -->
        <div v-else-if="viewMode === 'list'" class="v2-items-list">
          <div
            v-for="(item, i) in currentSlotStats.topItems.slice(0, 15)"
            :key="item.name"
            class="v2-item-row"
          >
            <span class="v2-item-row__rank">#{{ i + 1 }}</span>
            <div class="v2-item-row__img-wrap">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="v2-item-row__img" @error="noImg" />
              <div v-else class="v2-item-row__img-ph" />
            </div>
            <span class="v2-item-row__name">{{ item.name }}</span>
            <div class="v2-item-row__bar-wrap">
              <div class="v2-item-bar v2-item-bar--sm">
                <div class="v2-item-bar__fill" :style="{ width: barW(item.count) }" />
              </div>
            </div>
            <span class="v2-item-row__count">{{ item.count }}</span>
            <span class="v2-item-row__pct">{{ pct(item.count) }}%</span>
          </div>
        </div>

        <!-- TABLE VIEW -->
        <div v-else-if="viewMode === 'table'" class="v2-items-table-wrap">
          <table class="v2-items-table">
            <thead>
              <tr>
                <th>#</th>
                <th></th>
                <th>{{ $t('items.table.name') }}</th>
                <th class="text-right">{{ $t('items.table.count') }}</th>
                <th class="text-right">%</th>
                <th>{{ $t('items.table.distribution') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in currentSlotStats.topItems.slice(0, 20)" :key="item.name">
                <td class="v2-table-rank">{{ i + 1 }}</td>
                <td>
                  <div class="v2-table-img-wrap">
                    <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="v2-table-img" @error="noImg" />
                    <div v-else class="v2-table-img-ph" />
                  </div>
                </td>
                <td class="v2-table-name">{{ item.name }}</td>
                <td class="v2-table-num text-right">{{ item.count }}</td>
                <td class="v2-table-pct text-right">{{ pct(item.count) }}%</td>
                <td>
                  <div class="v2-item-bar v2-item-bar--sm">
                    <div class="v2-item-bar__fill" :style="{ width: barW(item.count) }" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="currentSlotStats.topItems.length === 0" class="v2-empty-full">
          {{ $t('items.noData') }}
        </div>
      </div>

      <div v-else class="v2-empty-full" style="padding:3rem">
        No data for this slot yet.
      </div>
    </template>

    <div v-else-if="!loading" class="v2-empty-full" style="padding:4rem">
      No equipment data found. Try removing some filters.
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'v2' })

const { t } = useI18n()

const ELEMENTS = [
  { name: 'eau', icon: '/eau.png' },
  { name: 'feu', icon: '/feu.png' },
  { name: 'terre', icon: '/terre.png' },
  { name: 'air', icon: '/air.png' },
  { name: 'multi', icon: '/multi.png' },
  { name: 'tank', icon: '/tank.png' },
  { name: 'doPou', icon: '/doPou.png' },
  { name: 'pp', icon: '/pp.png' },
]

const MODES = ['pvm', 'pvp']

const LEVELS = ['20', '40', '60', '80', '110', '130', '160', '180', '199', '200']

const BUDGETS = ['low', 'mid', 'high']

const CLASSES = [
  { name: 'iop', icon: '/Iop.png' },
  { name: 'cra', icon: '/Cra.png' },
  { name: 'sacrieur', icon: '/Sacrieur.png' },
  { name: 'eniripsa', icon: '/Eniripsa.png' },
  { name: 'sram', icon: '/Sram.png' },
  { name: 'ouginak', icon: '/Ouginak.png' },
  { name: 'forgelance', icon: '/Forgelance.png' },
  { name: 'osamodas', icon: '/Osamodas.png' },
  { name: 'enutrof', icon: '/Enutrof.png' },
  { name: 'ecaflip', icon: '/Ecaflip.png' },
  { name: 'steamer', icon: '/Steamer.png' },
  { name: 'feca', icon: '/Feca.png' },
  { name: 'huppermage', icon: '/Huppermage.png' },
  { name: 'zobal', icon: '/Zobal.png' },
  { name: 'pandawa', icon: '/Pandawa.png' },
  { name: 'eliotrope', icon: '/Eliotrope.png' },
  { name: 'sadida', icon: '/Sadida.png' },
  { name: 'roublard', icon: '/Roublard.png' },
  { name: 'xelor', icon: '/Xelor.png' },
]

const SLOTS = [
  { key: 'ar', icon: '⚔️' },
  { key: 'ch', icon: '🎩' },
  { key: 'ca', icon: '🦸' },
  { key: 'am', icon: '📿' },
  { key: 'br', icon: '🛡️' },
  { key: 'ce', icon: '👑' },
  { key: 'bo', icon: '👢' },
  { key: 'a1', icon: '💍' },
  { key: 'a2', icon: '💍' },
  { key: 'fa', icon: '🐾' },
  { key: 'd1', icon: '🥚' },
  { key: 'd2', icon: '🥚' },
  { key: 'd3', icon: '🥚' },
  { key: 'd4', icon: '🥚' },
  { key: 'd5', icon: '🥚' },
  { key: 'd6', icon: '🥚' },
]

const filters = reactive({ element: '', mode: '', classe: '', level: '', budget: '' })
const loading = ref(false)
const activeSlot = ref('ar')
const viewMode = ref<'grid' | 'list' | 'table'>('grid')
const stats = ref<any>(null)

const setFilter = (key: keyof typeof filters, val: string) => {
  filters[key] = val
  fetchData()
}

const getSlotStats = (slotKey: string) => stats.value?.slotStats?.[slotKey] ?? null

const currentSlotStats = computed(() => getSlotStats(activeSlot.value))

const pct = (count: number) =>
  stats.value?.totalEquipments > 0
    ? ((count / stats.value.totalEquipments) * 100).toFixed(1)
    : '0'

const barW = (count: number) => {
  const top = currentSlotStats.value?.topItems?.[0]?.count ?? 1
  return `${(count / top) * 100}%`
}

const buildQuery = () => {
  const params = new URLSearchParams()
  if (filters.element) params.append('where[tags][in][0]', filters.element)
  if (filters.mode) params.append('where[mode][equals]', filters.mode)
  if (filters.classe) params.append('where[classe][equals]', filters.classe)
  if (filters.level) params.append('where[level][equals]', filters.level)
  if (filters.budget) params.append('where[budget][equals]', filters.budget)
  params.append('limit', '1000')
  return params.toString()
}

const processData = (equipments: any[]) => {
  const slotStats: Record<string, { items: Record<string, number>; itemDetails: Record<string, any> }> = {}
  SLOTS.forEach(s => { slotStats[s.key] = { items: {}, itemDetails: {} } })

  equipments.forEach(eq => {
    if (!eq.items) return
    Object.entries(eq.items).forEach(([slotKey, item]: [string, any]) => {
      if (!item?.name || !slotStats[slotKey]) return
      slotStats[slotKey].items[item.name] = (slotStats[slotKey].items[item.name] ?? 0) + 1
      if (!slotStats[slotKey].itemDetails[item.name]) {
        slotStats[slotKey].itemDetails[item.name] = { image_url: item.image_url ?? null }
      }
    })
  })

  // Build sorted topItems per slot
  const processedSlots: Record<string, any> = {}
  SLOTS.forEach(s => {
    const raw = slotStats[s.key]
    const topItems = Object.entries(raw.items)
      .map(([name, count]) => ({ name, count, image_url: raw.itemDetails[name]?.image_url ?? null }))
      .sort((a, b) => b.count - a.count)
    processedSlots[s.key] = { topItems, totalItems: topItems.length }
  })

  const allItems = new Set<string>()
  SLOTS.forEach(s => { Object.keys(slotStats[s.key].items).forEach(n => allItems.add(n)) })

  let mostPopularSlot: { slot: string; count: number } | null = null
  SLOTS.forEach(s => {
    const c = Object.keys(slotStats[s.key].items).length
    if (!mostPopularSlot || c > mostPopularSlot.count) {
      mostPopularSlot = { slot: t(`items.slots.${s.key}`), count: c }
    }
  })

  const total = equipments.length
  const totalItemsUsed = SLOTS.reduce((sum, s) => {
    return sum + Object.values(slotStats[s.key].items).reduce((a, b) => a + b, 0)
  }, 0)

  stats.value = {
    slotStats: processedSlots,
    totalEquipments: total,
    uniqueItems: allItems.size,
    mostPopularSlot,
    avgItemsPerSet: total > 0 ? totalItemsUsed / total : 0,
  }
}

const fetchData = async () => {
  loading.value = true
  stats.value = null
  try {
    const qs = buildQuery()
    const res = await $fetch<any>(`/api/items/items${qs ? '?' + qs : ''}`)
    processData(res?.docs ?? [])
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
}

const noImg = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

onMounted(fetchData)
</script>

<style scoped>
/* ── Filters ─────────────────────────────────────────────── */
.v2-items-filters {
  display: flex; flex-direction: column; gap: .625rem;
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-active);
  border-radius: 14px; padding: .875rem 1rem; margin-bottom: .875rem;
}

.v2-filter-group {
  display: flex; align-items: center; gap: .625rem; flex-wrap: wrap;
}

.v2-filter-label {
  font-size: .6875rem; font-weight: 700; color: var(--v2-text-secondary);
  text-transform: uppercase; letter-spacing: .04em;
  min-width: 52px; flex-shrink: 0;
}

.v2-filter-chips { display: flex; flex-wrap: wrap; gap: 3px; }

.v2-fchip {
  padding: .25rem .625rem; border-radius: 7px;
  border: 1px solid var(--v2-border); background: transparent;
  color: var(--v2-text-muted); font-size: .75rem; font-weight: 500; cursor: pointer;
  transition: all .15s; white-space: nowrap;
}
.v2-fchip:hover { border-color: var(--v2-border-strong); color: var(--v2-text-hover); }
.v2-fchip--on { background: var(--v2-active-strong); border-color: var(--v2-border-focus); color: var(--v2-text); }
.v2-fchip--icon { padding: .25rem .375rem; }

/* ── Stats strip ─────────────────────────────────────────── */
.v2-items-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: .625rem; margin-bottom: .875rem;
}

@media (max-width: 640px) { .v2-items-stats { grid-template-columns: repeat(2, 1fr); } }

.v2-stat-card {
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-active);
  border-radius: 12px; padding: .875rem 1rem; text-align: center;
}
.v2-stat-card__val { font-size: 1.375rem; font-weight: 800; color: var(--v2-accent); line-height: 1.2; }
.v2-stat-card__label { font-size: .6875rem; color: var(--v2-text-secondary); margin-top: 2px; }

/* ── Loader ──────────────────────────────────────────────── */
.v2-center-loader {
  display: flex; align-items: center; justify-content: center;
  gap: .75rem; padding: 5rem; color: var(--v2-text-secondary); font-size: .9375rem;
}
.v2-spin {
  width: 22px; height: 22px; flex-shrink: 0;
  border: 2px solid var(--v2-border-med); border-top-color: var(--v2-accent);
  border-radius: 50%; animation: vspin .8s linear infinite;
}
@keyframes vspin { to { transform: rotate(360deg); } }

.v2-empty-full {
  text-align: center; color: var(--v2-text-dim); font-size: .9375rem; padding: 2rem;
}

/* ── Slot tabs ───────────────────────────────────────────── */
.v2-slot-tabs {
  display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: .75rem;
  background: rgba(0,0,0,.15); border: 1px solid var(--v2-border-subtle);
  border-radius: 12px; padding: .375rem;
}
.v2-slot-tab {
  display: flex; align-items: center; gap: .375rem;
  padding: .375rem .625rem; border-radius: 8px; border: none;
  background: transparent; color: var(--v2-text-secondary); font-size: .8125rem;
  cursor: pointer; transition: all .15s; white-space: nowrap;
}
.v2-slot-tab:hover { background: var(--v2-border-subtle); color: var(--v2-text-hover); }
.v2-slot-tab--on { background: var(--v2-active-strong); color: var(--v2-text); font-weight: 600; }
.v2-slot-tab__icon { font-size: .875rem; line-height: 1; }
.v2-slot-tab__label { font-size: .8125rem; }
.v2-slot-tab__count {
  font-size: .625rem; background: var(--v2-border); color: var(--v2-accent);
  padding: .0625rem .3125rem; border-radius: 999px; font-weight: 600;
}

/* ── Slot content header ─────────────────────────────────── */
.v2-slot-content {
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-active);
  border-radius: 14px; padding: 1rem;
}
.v2-slot-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: .875rem; flex-wrap: wrap; gap: .5rem;
}
.v2-slot-head__title { font-size: .9375rem; font-weight: 700; color: var(--v2-text-hover); }

.v2-view-toggle { display: flex; gap: 2px; background: rgba(0,0,0,.2); border-radius: 8px; padding: 2px; }
.v2-view-btn {
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  border-radius: 6px; border: none; background: transparent; color: var(--v2-text-dim);
  cursor: pointer; transition: all .15s;
}
.v2-view-btn:hover { color: var(--v2-text-hover); }
.v2-view-btn--on { background: var(--v2-active-strong); color: var(--v2-text); }

/* ── Progress bar (shared) ───────────────────────────────── */
.v2-item-bar {
  height: 5px; background: var(--v2-border-subtle); border-radius: 999px; overflow: hidden; margin-top: 4px;
}
.v2-item-bar--sm { height: 4px; margin-top: 0; flex: 1; }
.v2-item-bar__fill {
  height: 100%; background: linear-gradient(90deg, var(--v2-accent), var(--v2-accent-light));
  border-radius: 999px; transition: width .4s ease;
}

/* ── Grid view ───────────────────────────────────────────── */
.v2-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: .625rem;
}
.v2-item-card {
  background: rgba(0,0,0,.18); border: 1px solid var(--v2-border-subtle);
  border-radius: 12px; padding: .75rem .625rem;
  display: flex; flex-direction: column; align-items: center; gap: .25rem;
  transition: border-color .18s;
}
.v2-item-card:hover { border-color: var(--v2-border-strong); }
.v2-item-card__rank {
  font-size: .625rem; font-weight: 700; color: var(--v2-accent);
  background: var(--v2-border); padding: .125rem .375rem; border-radius: 999px;
  align-self: flex-start;
}
.v2-item-card__img-wrap {
  width: 52px; height: 52px; background: rgba(0,0,0,.2);
  border: 1px solid var(--v2-active); border-radius: 8px;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.v2-item-card__img { width: 100%; height: 100%; object-fit: cover; }
.v2-item-card__img-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--v2-text-dim); }
.v2-item-card__name {
  font-size: .75rem; font-weight: 600; color: var(--v2-text);
  text-align: center; line-height: 1.3; width: 100%;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.v2-item-card__usage { font-size: .6875rem; color: var(--v2-text-muted); }

/* ── List view ───────────────────────────────────────────── */
.v2-items-list { display: flex; flex-direction: column; gap: 4px; }
.v2-item-row {
  display: flex; align-items: center; gap: .625rem;
  padding: .5rem .625rem; border-radius: 9px;
  background: rgba(0,0,0,.15); border: 1px solid var(--v2-glow);
  transition: border-color .15s;
}
.v2-item-row:hover { border-color: var(--v2-border-med); }
.v2-item-row__rank { font-size: .75rem; font-weight: 700; color: var(--v2-accent); min-width: 28px; }
.v2-item-row__img-wrap {
  width: 32px; height: 32px; flex-shrink: 0; border-radius: 7px;
  background: rgba(0,0,0,.2); overflow: hidden;
}
.v2-item-row__img { width: 100%; height: 100%; object-fit: cover; }
.v2-item-row__img-ph { width: 100%; height: 100%; background: var(--v2-hover); }
.v2-item-row__name { flex: 1; font-size: .875rem; font-weight: 600; color: var(--v2-text); min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.v2-item-row__bar-wrap { flex: 1; min-width: 60px; max-width: 200px; }
.v2-item-row__count { font-size: .8125rem; color: var(--v2-text-hover); font-weight: 600; min-width: 32px; text-align: right; }
.v2-item-row__pct { font-size: .75rem; color: var(--v2-text-secondary); min-width: 42px; text-align: right; }

/* ── Table view ──────────────────────────────────────────── */
.v2-items-table-wrap { overflow-x: auto; }
.v2-items-table {
  width: 100%; border-collapse: collapse;
}
.v2-items-table thead tr {
  border-bottom: 1px solid var(--v2-active);
}
.v2-items-table th {
  padding: .5rem .75rem; font-size: .6875rem; font-weight: 700;
  color: var(--v2-text-secondary); text-transform: uppercase; letter-spacing: .04em;
  text-align: left; white-space: nowrap;
}
.v2-items-table tbody tr {
  border-bottom: 1px solid var(--v2-hover); transition: background .12s;
}
.v2-items-table tbody tr:hover { background: var(--v2-hover-subtle); }
.v2-items-table td { padding: .5rem .75rem; }
.v2-table-rank { font-size: .875rem; font-weight: 700; color: var(--v2-accent); }
.v2-table-img-wrap {
  width: 36px; height: 36px; border-radius: 7px;
  background: rgba(0,0,0,.2); overflow: hidden;
}
.v2-table-img { width: 100%; height: 100%; object-fit: cover; }
.v2-table-img-ph { width: 100%; height: 100%; background: var(--v2-hover); }
.v2-table-name { font-size: .875rem; font-weight: 600; color: var(--v2-text); min-width: 160px; }
.v2-table-num { font-size: .875rem; color: var(--v2-text-hover); font-weight: 600; }
.v2-table-pct { font-size: .8125rem; color: var(--v2-accent); font-weight: 600; white-space: nowrap; }
</style>



