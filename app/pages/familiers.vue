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
        <div class="fam-stat__val">{{ fmtQty(KIBBLE_COUNT) }}</div>
        <div class="fam-stat__label">Croquettes équivalentes</div>
      </div>
      <div class="fam-stat">
        <div class="fam-stat__val">{{ pricingMode === 'reference' ? `${fmt(Math.round(pricePerKibble))} k` : `${manualPricedCount}` }}</div>
        <div class="fam-stat__label">{{ pricingMode === 'reference' ? 'Prix cible / croquette' : 'Items avec prix saisi' }}</div>
      </div>
    </div>

    <!-- ── Budget control ────────────────────────────────────────── -->
    <div class="fam-budget fam-budget--mode">
      <span class="fam-budget__label">Mode de calcul</span>
      <div class="fam-mode-toggle">
        <button class="fam-mode-toggle__btn" :class="{ 'fam-mode-toggle__btn--on': pricingMode === 'reference' }" @click="pricingMode = 'reference'">Référence</button>
        <button class="fam-mode-toggle__btn" :class="{ 'fam-mode-toggle__btn--on': pricingMode === 'manual' }" @click="pricingMode = 'manual'">Prix manuels</button>
      </div>
      <span class="fam-budget__hint">
        {{ pricingMode === 'reference' ? 'Compare les prix max selon ton budget croquettes.' : 'Saisis tes prix HDV et vois le coût réel pour monter un familier niveau 100.' }}
      </span>
      <button class="fam-help-btn" type="button" aria-label="Ouvrir l'aide de la page" @click="guideOpen = true">?</button>
    </div>

    <div v-if="pricingMode === 'reference'" class="fam-budget">
      <span class="fam-budget__label">Budget total croquettes</span>
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
        → Avec ce budget, 1 croquette revient à <strong>{{ fmt(Math.round(pricePerKibble)) }} k</strong>, donc un item de <strong>X XP</strong> vaut max
        <strong>{{ fmt(Math.round(pricePerKibble)) }} × X / {{ XP_PER_KIBBLE }}</strong> k par unité
      </span>
      <span class="fam-budget__hint fam-budget__hint--soft">
        Ce budget sert uniquement de repère pour calculer un <strong>prix cible par unité</strong>. Le montant réellement payé pour un familier est la colonne
        <strong>Coût total au prix cible</strong>.
      </span>
    </div>

    <div v-else class="fam-budget">
      <span class="fam-budget__label">Prix manuels</span>
      <span class="fam-budget__hint">
        Le coût niveau 100 = <strong>prix saisi × quantité nécessaire</strong>. Les valeurs sont sauvegardées localement.
      </span>
      <button class="fam-clear-btn" @click="clearManualPrices">Effacer les prix</button>
    </div>

    <Transition name="fam-modal">
      <div v-if="guideOpen" class="fam-guide-modal" role="dialog" aria-modal="true" aria-label="Guide familiers" @click.self="guideOpen = false">
        <div class="fam-guide">
          <div class="fam-guide__topbar">
            <div>
              <div class="fam-guide__eyebrow">Guide rapide</div>
              <div class="fam-guide__title">Choisis un mode, repère un item, lis le coût final</div>
            </div>
            <button class="fam-guide__close" type="button" aria-label="Fermer l'aide" @click="guideOpen = false">×</button>
          </div>

          <div class="fam-guide__hero">
            <div class="fam-guide__intro">
              {{ pricingMode === 'reference'
                ? 'Le mode référence part d’un budget croquettes pour te donner un plafond d’achat par item et le coût total si tu montes un familier 1→100 avec cet item seul.'
                : 'Le mode prix manuels part de tes prix HDV réels et calcule directement combien te coûterait un familier 1→100 avec chaque item.' }}
            </div>
            <div class="fam-guide__mode-badge">
              <span class="fam-guide__mode-label">Mode actif</span>
              <strong>{{ pricingMode === 'reference' ? 'Référence croquettes' : 'Prix HDV manuels' }}</strong>
            </div>
          </div>

          <div class="fam-guide__steps">
            <div class="fam-guide-step">
              <div class="fam-guide-step__num">1</div>
              <div>
                <div class="fam-guide-step__title">{{ pricingMode === 'reference' ? 'Définis ton budget croquettes' : 'Renseigne tes prix HDV' }}</div>
                <div class="fam-guide-step__text">
                  {{ pricingMode === 'reference'
                    ? 'Entre le budget total que tu paierais pour monter un familier avec des croquettes. La page convertit ensuite ce budget en prix cible par XP.'
                    : 'Tape le prix unitaire vu en HDV pour les items qui t’intéressent. Les autres lignes peuvent rester vides.' }}
                </div>
              </div>
            </div>
            <div class="fam-guide-step">
              <div class="fam-guide-step__num">2</div>
              <div>
                <div class="fam-guide-step__title">Choisis un item ou une essence</div>
                <div class="fam-guide-step__text">
                  Utilise les onglets, la recherche et le tri pour isoler la source que tu veux comparer ou acheter en boucle.
                </div>
              </div>
            </div>
            <div class="fam-guide-step">
              <div class="fam-guide-step__num">3</div>
              <div>
                <div class="fam-guide-step__title">Lis d’abord la dernière colonne</div>
                <div class="fam-guide-step__text">
                  {{ pricingMode === 'reference' ? 'Coût total au prix cible' : 'Coût total lvl 100' }} est le vrai total estimé pour monter un familier 1→100 avec cet item seul.
                </div>
              </div>
            </div>
          </div>

          <div class="fam-guide__legend">
            <div class="fam-guide-card">
              <div class="fam-guide-card__title">Colonnes</div>
              <div class="fam-guide-card__list">
                <div><strong>XP / unité</strong> = XP donné par un item.</div>
                <div><strong>Qté nécessaire</strong> = nombre d’unités nécessaires pour monter 1→100.</div>
                <div><strong>{{ pricingMode === 'reference' ? 'Prix cible / unité' : 'Prix saisi / unité' }}</strong> = {{ pricingMode === 'reference' ? 'plafond d’achat conseillé par unité.' : 'prix HDV unitaire que tu as saisi.' }}</div>
                <div><strong>{{ pricingMode === 'reference' ? 'Coût total au prix cible' : 'Coût total lvl 100' }}</strong> = montant final estimé.</div>
              </div>
            </div>
            <div class="fam-guide-card">
              <div class="fam-guide-card__title">Exemple</div>
              <div class="fam-guide-card__list">
                <div>Si une ligne affiche <strong>13 815</strong> en quantité et <strong>362 k</strong> en prix unitaire, il faut environ <strong>13 815</strong> unités.</div>
                <div>Le total sera donc environ <strong>13 815 × 362</strong>, soit un coût proche du budget de référence.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

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
              <th class="text-right">{{ pricingMode === 'reference' ? 'Prix cible / unité' : 'Prix saisi / unité' }}</th>
              <th class="text-right">{{ pricingMode === 'reference' ? 'Coût total au prix cible' : 'Coût total lvl 100' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredZoneItems" :key="item.name">
              <td class="fam-item-name">{{ item.name }}</td>
              <td class="fam-num fam-xp text-right">{{ item.xp }}</td>
              <td class="fam-num text-right">{{ fmtQty(qtyNeeded(item.xp)) }}</td>
              <td v-if="pricingMode === 'reference'" class="fam-num fam-price text-right">{{ fmt(maxPrice(item.xp)) }} k</td>
              <td v-else class="text-right">
                <input
                  :value="manualPrices[item.name] ?? ''"
                  type="number"
                  min="0"
                  step="1"
                  class="fam-price-input"
                  @input="setManualPrice(item.name, ($event.target as HTMLInputElement).value)"
                />
              </td>
              <td class="fam-num fam-price text-right">{{ levelCostLabel(item) }}</td>
            </tr>
            <tr v-if="filteredZoneItems.length === 0">
              <td colspan="5" class="fam-empty">Aucun item trouvé.</td>
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
              <th class="text-right">{{ pricingMode === 'reference' ? 'Prix cible / unité' : 'Prix saisi / unité' }}</th>
              <th class="text-right">{{ pricingMode === 'reference' ? 'Coût total au prix cible' : 'Coût total lvl 100' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredEssences" :key="item.name">
              <td class="fam-item-name">{{ item.name }}</td>
              <td class="fam-num fam-lvl text-right">{{ item.dungeonLevel }}</td>
              <td class="fam-num fam-xp text-right">{{ item.xp }}</td>
              <td class="fam-num text-right">{{ fmtQty(qtyNeeded(item.xp)) }}</td>
              <td v-if="pricingMode === 'reference'" class="fam-num fam-price text-right">{{ fmt(maxPrice(item.xp)) }} k</td>
              <td v-else class="text-right">
                <input
                  :value="manualPrices[item.name] ?? ''"
                  type="number"
                  min="0"
                  step="1"
                  class="fam-price-input"
                  @input="setManualPrice(item.name, ($event.target as HTMLInputElement).value)"
                />
              </td>
              <td class="fam-num fam-price text-right">{{ levelCostLabel(item) }}</td>
            </tr>
            <tr v-if="filteredEssences.length === 0">
              <td colspan="6" class="fam-empty">Aucune essence trouvée.</td>
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
              <th class="text-right">{{ pricingMode === 'reference' ? 'Prix cible / unité' : 'Prix saisi / unité' }}</th>
              <th class="text-right">{{ pricingMode === 'reference' ? 'Coût total au prix cible' : 'Coût total lvl 100' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredAllItems" :key="item.name + item.source">
              <td class="fam-item-name">{{ item.name }}</td>
              <td class="fam-source">{{ item.source }}</td>
              <td class="fam-num fam-xp text-right">{{ item.xp }}</td>
              <td class="fam-num text-right">{{ fmtQty(qtyNeeded(item.xp)) }}</td>
              <td v-if="pricingMode === 'reference'" class="fam-num fam-price text-right">{{ fmt(maxPrice(item.xp)) }} k</td>
              <td v-else class="text-right">
                <input
                  :value="manualPrices[item.name] ?? ''"
                  type="number"
                  min="0"
                  step="1"
                  class="fam-price-input"
                  @input="setManualPrice(item.name, ($event.target as HTMLInputElement).value)"
                />
              </td>
              <td class="fam-num fam-price text-right">{{ levelCostLabel(item) }}</td>
            </tr>
            <tr v-if="filteredAllItems.length === 0">
              <td colspan="6" class="fam-empty">Aucun item trouvé.</td>
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
const pricingMode = ref<'reference' | 'manual'>('reference')
const manualPrices = ref<Record<string, number>>({})
const guideOpen = ref(false)

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
const MANUAL_PRICES_KEY = 'familiers_manual_prices_v1'

const currentZone = computed(() => data.zones.find(z => z.id === activeZone.value) ?? null)

// Formulas
const qtyNeeded = (xp: number) => TOTAL_XP / xp
const maxPrice = (xp: number) => Math.round((pricePerKibble.value * xp) / XP_PER_KIBBLE)
const referenceLevelCost = (item: { xp: number }) => Math.round(maxPrice(item.xp) * qtyNeeded(item.xp))
const manualLevelCost = (item: { name: string; xp: number }) => {
  const price = manualPrices.value[item.name]
  if (!(typeof price === 'number') || price < 0) return null
  return Math.round(price * qtyNeeded(item.xp))
}

const fmt = (n: number) => n.toLocaleString('fr-FR')
const fmtQty = (n: number) => n % 1 === 0 ? n.toString() : n.toFixed(1)
const manualPricedCount = computed(() =>
  Object.values(manualPrices.value).filter((value) => typeof value === 'number' && value > 0).length
)

const setManualPrice = (itemName: string, value: string | number) => {
  const raw = typeof value === 'number' ? String(value) : value
  if (!raw.trim()) {
    delete manualPrices.value[itemName]
    return
  }
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) return
  manualPrices.value[itemName] = Math.round(parsed)
}

const clearManualPrices = () => {
  manualPrices.value = {}
}

const manualLevelCostLabel = (item: { name: string; xp: number }) => {
  const total = manualLevelCost(item)
  return total === null ? '—' : `${fmt(total)} k`
}
const levelCostLabel = (item: { name: string; xp: number }) =>
  pricingMode.value === 'reference'
    ? `${fmt(referenceLevelCost(item))} k`
    : manualLevelCostLabel(item)

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

onMounted(() => {
  try {
    const raw = localStorage.getItem(MANUAL_PRICES_KEY)
    manualPrices.value = raw ? JSON.parse(raw) : {}
  } catch {
    manualPrices.value = {}
  }
})

watch(manualPrices, (value) => {
  localStorage.setItem(MANUAL_PRICES_KEY, JSON.stringify(value))
}, { deep: true })
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
.fam-budget--mode { justify-content: space-between; }
.fam-budget__label {
  font-size: .75rem;
  font-weight: 700;
  color: var(--v2-text-secondary);
  text-transform: uppercase;
  letter-spacing: .04em;
  white-space: nowrap;
}
.fam-mode-toggle {
  display: flex;
  gap: 4px;
  padding: .25rem;
  border-radius: 10px;
  background: rgba(0,0,0,.2);
  border: 1px solid var(--v2-border-subtle);
}
.fam-mode-toggle__btn {
  padding: .375rem .75rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--v2-text-secondary);
  font-size: .8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
}
.fam-mode-toggle__btn--on { background: var(--v2-active-strong); color: var(--v2-text); }
.fam-help-btn {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid var(--v2-active);
  background: linear-gradient(180deg, var(--v2-active-strong), var(--v2-active));
  color: var(--v2-text);
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--v2-active-strong) 35%, transparent), 0 8px 20px rgba(0, 0, 0, .18);
  transition: all .15s;
}
.fam-help-btn:hover {
  transform: translateY(-1px);
  border-color: var(--v2-border-strong);
  filter: brightness(1.05);
}
.fam-clear-btn {
  padding: .375rem .75rem;
  border-radius: 8px;
  border: 1px solid rgba(248,113,113,.2);
  background: transparent;
  color: #f87171;
  font-size: .75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
}
.fam-clear-btn:hover { background: rgba(248,113,113,.1); }
.fam-guide-modal {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, .72);
}
.fam-guide {
  width: min(960px, 100%);
  max-height: min(88vh, 900px);
  overflow: auto;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid var(--v2-border-med);
  background: var(--v2-bg);
  box-shadow: 0 24px 70px rgba(0, 0, 0, .55);
}
.fam-guide__topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: .8rem;
}
.fam-guide__close {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.06);
  color: #f2fff8;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
}
.fam-guide__close:hover {
  border-color: rgba(255,255,255,.2);
  background: rgba(255,255,255,.1);
}
.fam-guide__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: .9rem;
}
.fam-guide__eyebrow {
  font-size: .6875rem;
  font-weight: 800;
  color: var(--v2-accent);
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: .35rem;
}
.fam-guide__title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--v2-text-hover);
  line-height: 1.25;
  margin-bottom: .35rem;
}
.fam-guide__intro {
  max-width: 70ch;
  font-size: .84rem;
  color: #dbece4;
  line-height: 1.5;
}
.fam-guide__mode-badge {
  min-width: 180px;
  padding: .75rem .85rem;
  border-radius: 12px;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-border-subtle);
}
.fam-guide__mode-label {
  display: block;
  font-size: .6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--v2-text-muted);
  margin-bottom: .2rem;
}
.fam-guide__mode-badge strong {
  color: var(--v2-text-hover);
  font-size: .86rem;
}
.fam-guide__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .75rem;
  margin-bottom: .85rem;
}
.fam-guide-step {
  display: flex;
  gap: .7rem;
  padding: .85rem .9rem;
  border-radius: 12px;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-border-subtle);
}
.fam-guide-step__num {
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--v2-active-strong) 24%, transparent);
  border: 1px solid color-mix(in srgb, var(--v2-active-strong) 38%, transparent);
  color: var(--v2-accent);
  font-size: .8rem;
  font-weight: 800;
}
.fam-guide-step__title {
  font-size: .82rem;
  font-weight: 700;
  color: var(--v2-text-hover);
  margin-bottom: .22rem;
}
.fam-guide-step__text {
  font-size: .8rem;
  color: #d6e7de;
  line-height: 1.45;
}
.fam-guide__legend {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: .75rem;
}
.fam-guide-card {
  padding: .85rem .95rem;
  border-radius: 12px;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-border-subtle);
}
.fam-guide-card__title {
  font-size: .78rem;
  font-weight: 800;
  color: var(--v2-text-hover);
  margin-bottom: .45rem;
}
.fam-guide-card__list {
  display: grid;
  gap: .38rem;
  font-size: .8rem;
  color: #d8e8e1;
  line-height: 1.45;
}
.fam-modal-enter-active,
.fam-modal-leave-active {
  transition: opacity .18s ease;
}
.fam-modal-enter-from,
.fam-modal-leave-to {
  opacity: 0;
}
.fam-modal-enter-from .fam-guide,
.fam-modal-leave-to .fam-guide {
  transform: translateY(10px) scale(.98);
}
.fam-guide {
  transition: transform .18s ease;
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

@media (max-width: 900px) {
  .fam-guide__hero,
  .fam-guide__legend {
    grid-template-columns: 1fr;
    display: grid;
  }
  .fam-guide__mode-badge {
    min-width: 0;
  }
  .fam-guide__steps {
    grid-template-columns: 1fr;
  }
}

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
.fam-price-input {
  width: 120px;
  max-width: 100%;
  background: rgba(0,0,0,.25);
  border: 1px solid var(--v2-border-med);
  border-radius: 8px;
  padding: .35rem .55rem;
  color: var(--v2-text);
  font-size: .8125rem;
  text-align: right;
  outline: none;
  transition: border-color .15s;
}
.fam-price-input:focus { border-color: var(--v2-border-focus); }
.fam-xp { color: var(--v2-text-hover); font-weight: 600; }
.fam-price { color: var(--v2-accent); font-weight: 700; }
.fam-lvl { color: var(--v2-text-secondary); }

@media (max-width: 720px) {
  .fam-guide__grid { grid-template-columns: 1fr; }
}

.fam-empty {
  text-align: center;
  color: var(--v2-text-dim);
  font-size: .875rem;
  padding: 2.5rem;
}
</style>



