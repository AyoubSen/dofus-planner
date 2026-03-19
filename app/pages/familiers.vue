<template>
  <div>
    <!-- ── Constants strip ───────────────────────────────────────── -->
    <div class="fam-stats">
      <div class="fam-stat">
        <div class="fam-stat__val">{{ fmt(TOTAL_XP) }}</div>
        <div class="fam-stat__label">XP total (1→100)</div>
      </div>
      <div class="fam-stat">
        <div class="fam-stat__val">{{ XP_PER_KIBBLE }}</div>
        <div class="fam-stat__label">XP / croquette</div>
      </div>
      <div class="fam-stat">
        <div class="fam-stat__val">{{ Math.ceil(TOTAL_XP / XP_PER_KIBBLE) }}</div>
        <div class="fam-stat__label">Croquettes nécessaires</div>
      </div>
      <div class="fam-stat">
        <div class="fam-stat__val">{{ fmt(Math.round(pricePerKibble)) }} k</div>
        <div class="fam-stat__label">Prix / croquette (réf.)</div>
      </div>
    </div>

    <!-- ── Budget control ────────────────────────────────────────── -->
    <div class="fam-budget">
      <span class="fam-budget__label">Budget de référence</span>
      <div class="fam-budget__input-wrap">
        <input
          v-model.number="budget"
          type="number"
          min="0"
          step="100000"
          class="fam-budget__input"
        />
        <span class="fam-budget__unit">kamas</span>
      </div>
      <span class="fam-budget__hint">
        → Chaque item avec <strong>X XP</strong> vaut max
        <strong>{{ fmt(Math.round(pricePerKibble)) }} × X / {{ XP_PER_KIBBLE }}</strong> k
      </span>
    </div>

    <!-- ── Tab selector ──────────────────────────────────────────── -->
    <div class="fam-tabs">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        class="fam-tab"
        :class="{ 'fam-tab--on': activeTab === tab.id }"
        @click="activeTab = tab.id; search = ''"
      >{{ tab.label }}</button>
    </div>

    <!-- ── Search + sort ─────────────────────────────────────────── -->
    <div class="fam-controls">
      <input
        v-model="search"
        type="text"
        placeholder="Rechercher un item…"
        class="fam-search"
      />
      <div class="fam-sort">
        <span class="fam-sort__label">Trier par</span>
        <button
          class="fam-sort__btn"
          :class="{ 'fam-sort__btn--on': sortBy === 'xp' }"
          @click="toggleSort('xp')"
        >XP {{ sortBy === 'xp' ? (sortDir === 'desc' ? '↓' : '↑') : '' }}</button>
        <button
          class="fam-sort__btn"
          :class="{ 'fam-sort__btn--on': sortBy === 'qty' }"
          @click="toggleSort('qty')"
        >Qté {{ sortBy === 'qty' ? (sortDir === 'desc' ? '↓' : '↑') : '' }}</button>
        <button
          class="fam-sort__btn"
          :class="{ 'fam-sort__btn--on': sortBy === 'price' }"
          @click="toggleSort('price')"
        >Prix max {{ sortBy === 'price' ? (sortDir === 'desc' ? '↓' : '↑') : '' }}</button>
        <button
          class="fam-sort__btn"
          :class="{ 'fam-sort__btn--on': sortBy === 'name' }"
          @click="toggleSort('name')"
        >Nom {{ sortBy === 'name' ? (sortDir === 'desc' ? '↓' : '↑') : '' }}</button>
      </div>
    </div>

    <!-- ── Zone mode ─────────────────────────────────────────────── -->
    <template v-if="activeTab === 'zones'">
      <!-- Zone tabs -->
      <div class="fam-zones">
        <button
          v-for="zone in data.zones"
          :key="zone.id"
          class="fam-zone-chip"
          :class="{ 'fam-zone-chip--on': activeZone === zone.id }"
          @click="activeZone = zone.id"
        >{{ zone.name }}</button>
      </div>

      <!-- Items table for selected zone -->
      <div v-if="currentZone" class="fam-table-wrap">
        <div class="fam-table-head">
          <span class="fam-table-title">{{ currentZone.name }}</span>
          <span class="fam-table-count">{{ filteredZoneItems.length }} items</span>
        </div>
        <table class="fam-table">
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right">XP / unité</th>
              <th class="text-right">Qté nécessaire</th>
              <th class="text-right">Prix max / unité</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredZoneItems" :key="item.name">
              <td class="fam-item-name">{{ item.name }}</td>
              <td class="fam-num fam-xp text-right">{{ item.xp }}</td>
              <td class="fam-num text-right">{{ fmtQty(qtyNeeded(item.xp)) }}</td>
              <td class="fam-num fam-price text-right">{{ fmt(maxPrice(item.xp)) }} k</td>
            </tr>
            <tr v-if="filteredZoneItems.length === 0">
              <td colspan="4" class="fam-empty">Aucun item trouvé.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ── Essences mode ─────────────────────────────────────────── -->
    <template v-else-if="activeTab === 'essences'">
      <div class="fam-table-wrap">
        <div class="fam-table-head">
          <span class="fam-table-title">Essences de gardien de donjon</span>
          <span class="fam-table-count">{{ filteredEssences.length }} essences</span>
        </div>
        <table class="fam-table">
          <thead>
            <tr>
              <th>Essence</th>
              <th class="text-right">Niv. donjon</th>
              <th class="text-right">XP / unité</th>
              <th class="text-right">Qté nécessaire</th>
              <th class="text-right">Prix max / unité</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredEssences" :key="item.name">
              <td class="fam-item-name">{{ item.name }}</td>
              <td class="fam-num fam-lvl text-right">{{ item.dungeonLevel }}</td>
              <td class="fam-num fam-xp text-right">{{ item.xp }}</td>
              <td class="fam-num text-right">{{ fmtQty(qtyNeeded(item.xp)) }}</td>
              <td class="fam-num fam-price text-right">{{ fmt(maxPrice(item.xp)) }} k</td>
            </tr>
            <tr v-if="filteredEssences.length === 0">
              <td colspan="5" class="fam-empty">Aucune essence trouvée.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ── All items mode ────────────────────────────────────────── -->
    <template v-else>
      <div class="fam-table-wrap">
        <div class="fam-table-head">
          <span class="fam-table-title">Tous les items</span>
          <span class="fam-table-count">{{ filteredAllItems.length }} items</span>
        </div>
        <table class="fam-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Zone / Source</th>
              <th class="text-right">XP / unité</th>
              <th class="text-right">Qté nécessaire</th>
              <th class="text-right">Prix max / unité</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredAllItems" :key="item.name + item.source">
              <td class="fam-item-name">{{ item.name }}</td>
              <td class="fam-source">{{ item.source }}</td>
              <td class="fam-num fam-xp text-right">{{ item.xp }}</td>
              <td class="fam-num text-right">{{ fmtQty(qtyNeeded(item.xp)) }}</td>
              <td class="fam-num fam-price text-right">{{ fmt(maxPrice(item.xp)) }} k</td>
            </tr>
            <tr v-if="filteredAllItems.length === 0">
              <td colspan="5" class="fam-empty">Aucun item trouvé.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import familierData from '~/data/familiers.json'

definePageMeta({ layout: 'v2' })

const data = familierData
const TOTAL_XP = data.constants.totalXP
const XP_PER_KIBBLE = data.constants.xpPerKibble
const KIBBLE_COUNT = TOTAL_XP / XP_PER_KIBBLE

const budget = ref(5_000_000)
const pricePerKibble = computed(() => budget.value / KIBBLE_COUNT)

const TABS = [
  { id: 'zones', label: 'Par zone' },
  { id: 'essences', label: 'Essences gardiens' },
  { id: 'all', label: 'Tout afficher' },
]

const activeTab = ref('zones')
const activeZone = ref(data.zones[0]?.id ?? '')
const search = ref('')
const sortBy = ref<'xp' | 'qty' | 'price' | 'name'>('xp')
const sortDir = ref<'desc' | 'asc'>('desc')

const currentZone = computed(() => data.zones.find(z => z.id === activeZone.value) ?? null)

// Formulas
const qtyNeeded = (xp: number) => XP_PER_KIBBLE / xp
const maxPrice = (xp: number) => Math.round((pricePerKibble.value * xp) / XP_PER_KIBBLE)

const fmt = (n: number) => n.toLocaleString('fr-FR')
const fmtQty = (n: number) => n % 1 === 0 ? n.toString() : n.toFixed(1)

const toggleSort = (key: typeof sortBy.value) => {
  if (sortBy.value === key) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortBy.value = key
    sortDir.value = key === 'name' ? 'asc' : 'desc'
  }
}

const sortItems = <T extends { name: string; xp: number }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    let diff = 0
    if (sortBy.value === 'xp') diff = a.xp - b.xp
    else if (sortBy.value === 'qty') diff = qtyNeeded(b.xp) - qtyNeeded(a.xp)
    else if (sortBy.value === 'price') diff = maxPrice(a.xp) - maxPrice(b.xp)
    else diff = a.name.localeCompare(b.name)
    return sortDir.value === 'desc' ? -diff : diff
  })
}

const filteredZoneItems = computed(() => {
  const items = currentZone.value?.items ?? []
  const q = search.value.toLowerCase()
  const filtered = q ? items.filter(i => i.name.toLowerCase().includes(q)) : items
  return sortItems(filtered)
})

const filteredEssences = computed(() => {
  const q = search.value.toLowerCase()
  const filtered = q
    ? data.essences.filter(i => i.name.toLowerCase().includes(q))
    : data.essences
  return sortItems(filtered)
})

const allItems = computed(() => [
  ...data.zones.flatMap(z => z.items.map(i => ({ ...i, source: z.name }))),
  ...data.essences.map(i => ({ ...i, source: `Essence (niv. ${i.dungeonLevel})` })),
])

const filteredAllItems = computed(() => {
  const q = search.value.toLowerCase()
  const filtered = q ? allItems.value.filter(i => i.name.toLowerCase().includes(q)) : allItems.value
  return sortItems(filtered)
})
</script>

<style scoped>
/* ── Stats strip ───────────────────────────────────────────── */
.fam-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: .625rem;
  margin-bottom: .875rem;
}
@media (max-width: 640px) { .fam-stats { grid-template-columns: repeat(2, 1fr); } }

.fam-stat {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 12px;
  padding: .875rem 1rem;
  text-align: center;
}
.fam-stat__val { font-size: 1.25rem; font-weight: 800; color: var(--v2-accent); line-height: 1.2; }
.fam-stat__label { font-size: .6875rem; color: var(--v2-text-secondary); margin-top: 2px; }

/* ── Budget control ────────────────────────────────────────── */
.fam-budget {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .75rem;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 12px;
  padding: .75rem 1rem;
  margin-bottom: .875rem;
}
.fam-budget__label {
  font-size: .75rem;
  font-weight: 700;
  color: var(--v2-text-secondary);
  text-transform: uppercase;
  letter-spacing: .04em;
  white-space: nowrap;
}
.fam-budget__input-wrap { display: flex; align-items: center; gap: .375rem; }
.fam-budget__input {
  background: rgba(0,0,0,.25);
  border: 1px solid var(--v2-border-med);
  border-radius: 8px;
  padding: .375rem .625rem;
  color: var(--v2-text);
  font-size: .9375rem;
  font-weight: 700;
  width: 140px;
  outline: none;
  transition: border-color .15s;
}
.fam-budget__input:focus { border-color: var(--v2-border-focus); }
.fam-budget__unit { font-size: .8125rem; color: var(--v2-text-secondary); }
.fam-budget__hint { font-size: .8125rem; color: var(--v2-text-muted); }
.fam-budget__hint strong { color: var(--v2-text-hover); }

/* ── Main tabs ─────────────────────────────────────────────── */
.fam-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: .75rem;
  background: rgba(0,0,0,.15);
  border: 1px solid var(--v2-border-subtle);
  border-radius: 12px;
  padding: .375rem;
}
.fam-tab {
  flex: 1;
  padding: .375rem .625rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--v2-text-secondary);
  font-size: .8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
}
.fam-tab:hover { background: var(--v2-border-subtle); color: var(--v2-text-hover); }
.fam-tab--on { background: var(--v2-active-strong); color: var(--v2-text); font-weight: 700; }

/* ── Controls ──────────────────────────────────────────────── */
.fam-controls {
  display: flex;
  flex-wrap: wrap;
  gap: .625rem;
  align-items: center;
  margin-bottom: .75rem;
}
.fam-search {
  flex: 1;
  min-width: 180px;
  background: rgba(0,0,0,.25);
  border: 1px solid var(--v2-border-med);
  border-radius: 9px;
  padding: .4375rem .75rem;
  color: var(--v2-text);
  font-size: .875rem;
  outline: none;
  transition: border-color .15s;
}
.fam-search::placeholder { color: var(--v2-text-dim); }
.fam-search:focus { border-color: var(--v2-border-focus); }
.fam-sort {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
}
.fam-sort__label {
  font-size: .6875rem;
  font-weight: 700;
  color: var(--v2-text-muted);
  text-transform: uppercase;
  letter-spacing: .04em;
  margin-right: .25rem;
}
.fam-sort__btn {
  padding: .3125rem .625rem;
  border-radius: 7px;
  border: 1px solid var(--v2-active);
  background: transparent;
  color: var(--v2-text-muted);
  font-size: .75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
}
.fam-sort__btn:hover { border-color: var(--v2-border-strong); color: var(--v2-text-hover); }
.fam-sort__btn--on { background: var(--v2-border-med); border-color: var(--v2-border-strong); color: var(--v2-text); }

/* ── Zone chips ────────────────────────────────────────────── */
.fam-zones {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: .75rem;
}
.fam-zone-chip {
  padding: .3125rem .75rem;
  border-radius: 999px;
  border: 1px solid var(--v2-border);
  background: transparent;
  color: var(--v2-text-muted);
  font-size: .75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
}
.fam-zone-chip:hover { border-color: var(--v2-border-strong); color: var(--v2-text-hover); }
.fam-zone-chip--on { background: var(--v2-active-strong); border-color: var(--v2-border-focus); color: var(--v2-text); }

/* ── Table ─────────────────────────────────────────────────── */
.fam-table-wrap {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  overflow: hidden;
}
.fam-table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .75rem 1rem;
  border-bottom: 1px solid var(--v2-border-subtle);
}
.fam-table-title { font-size: .9375rem; font-weight: 700; color: var(--v2-text-hover); }
.fam-table-count {
  font-size: .6875rem;
  background: var(--v2-active);
  color: var(--v2-accent);
  padding: .125rem .5rem;
  border-radius: 999px;
  font-weight: 600;
}
.fam-table {
  width: 100%;
  border-collapse: collapse;
  overflow-x: auto;
  display: block;
}
.fam-table thead tr {
  border-bottom: 1px solid var(--v2-border-subtle);
}
.fam-table th {
  padding: .5rem .875rem;
  font-size: .6875rem;
  font-weight: 700;
  color: var(--v2-text-secondary);
  text-transform: uppercase;
  letter-spacing: .04em;
  text-align: left;
  white-space: nowrap;
}
.fam-table tbody tr {
  border-bottom: 1px solid var(--v2-hover-subtle);
  transition: background .12s;
}
.fam-table tbody tr:last-child { border-bottom: none; }
.fam-table tbody tr:hover { background: var(--v2-hover-subtle); }
.fam-table td { padding: .5rem .875rem; }

.fam-item-name {
  font-size: .875rem;
  font-weight: 600;
  color: var(--v2-text);
  min-width: 180px;
}
.fam-source {
  font-size: .8125rem;
  color: var(--v2-text-muted);
  white-space: nowrap;
}
.fam-num {
  font-size: .875rem;
  white-space: nowrap;
}
.fam-xp { color: var(--v2-text-hover); font-weight: 600; }
.fam-price { color: var(--v2-accent); font-weight: 700; }
.fam-lvl { color: var(--v2-text-secondary); }

.fam-empty {
  text-align: center;
  color: var(--v2-text-dim);
  font-size: .875rem;
  padding: 2.5rem;
}
</style>



