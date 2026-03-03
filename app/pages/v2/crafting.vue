<template>
  <div>
    <div v-if="!hasContext" class="v2-no-context">
      <div class="v2-no-context__icon">
        <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div class="v2-no-context__title">No character selected</div>
      <div class="v2-no-context__desc">Select a character in the sidebar to track your crafted items.</div>
    </div>

    <template v-else>
      <div class="v2-craft-layout">

        <!-- Left: Search & add panel -->
        <div class="v2-panel">
          <div class="v2-panel-title">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find item to craft
          </div>

          <div class="v2-searchbox">
            <svg class="v2-searchbox__icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="search" type="text" placeholder="Search items…" class="v2-searchbox__input" @input="onSearchInput" />
            <button v-if="search" class="v2-searchbox__clear" @click="clearSearch">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div v-if="searching" class="v2-inline-loader">
            <div class="v2-spin-sm" /> Searching…
          </div>

          <div v-else-if="results.length" class="v2-results-list">
            <button
              v-for="item in results"
              :key="item.id"
              class="v2-result-row"
              :class="{ 'v2-result-row--sel': selectedItem?.id === item.id }"
              @click="selectItem(item)"
            >
              <img :src="getItemImg(item)" :alt="item.name?.fr ?? ''" class="v2-result-img" @error="onImgErr" />
              <div class="v2-result-info">
                <div class="v2-result-name">{{ item.name?.fr ?? item.id }}</div>
                <div class="v2-result-sub">{{ item.type?.name?.fr ?? '' }} · Lv {{ item.level ?? '?' }}</div>
              </div>
              <svg v-if="selectedItem?.id === item.id" class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style="color:#34d399">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <div v-else-if="search && !searching" class="v2-empty-hint">No items found for "{{ search }}"</div>

          <!-- Item detail + add craft form -->
          <Transition name="v2-slide-fade">
            <div v-if="selectedItem" class="v2-craft-form">
              <div class="v2-craft-item-header">
                <img :src="getItemImg(selectedItem)" :alt="selectedItem.name?.fr ?? ''" class="v2-craft-item-img" @error="onImgErr" />
                <div>
                  <div class="v2-craft-item-name">{{ selectedItem.name?.fr ?? selectedItem.id }}</div>
                  <div class="v2-craft-item-sub">{{ selectedItem.type?.name?.fr ?? '' }} · Lv {{ selectedItem.level ?? '?' }}</div>
                </div>
                <button class="v2-form-close" @click="selectedItem = null">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Effects -->
              <div v-if="effectsLoading" class="v2-inline-loader" style="padding:.5rem 0">
                <div class="v2-spin-sm" /> Loading effects…
              </div>
              <div v-else-if="effects.length" class="v2-effects">
                <div class="v2-effects-label">Rolled stats</div>
                <div v-for="(eff, i) in effects" :key="`${eff.id}-${i}`" class="v2-effect-row">
                  <span class="v2-effect-name">{{ eff.label }}</span>
                  <span class="v2-effect-range">{{ eff.from }}–{{ eff.to }}</span>
                  <input
                    v-model.number="customValues[`${eff.id}-${i}`]"
                    type="number"
                    class="v2-effect-input"
                    :min="eff.from"
                    :max="eff.to"
                    :placeholder="String(eff.value ?? 0)"
                  />
                </div>
              </div>

              <!-- Price & Notes -->
              <div class="v2-sale-fields">
                <div class="v2-sale-field">
                  <label class="v2-field-label">Sell price (kamas)</label>
                  <input v-model.number="salePrice" type="number" min="0" step="1000" placeholder="0" class="v2-field-input" />
                </div>
                <div class="v2-sale-field">
                  <label class="v2-field-label">Notes</label>
                  <input v-model="saleNotes" type="text" placeholder="Optional notes…" class="v2-field-input" />
                </div>
              </div>

              <button class="v2-btn-craft" @click="addCraft">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add to crafting log
              </button>
            </div>
          </Transition>
        </div>

        <!-- Right: Crafted items history -->
        <div class="v2-panel">
          <div class="v2-panel-title">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Crafting log
            <span class="v2-badge-count">{{ characterCrafts.length }}</span>
            <span class="v2-badge-total">{{ formattedTotal }} kamas</span>
          </div>

          <div v-if="characterCrafts.length === 0" class="v2-empty-full">
            <svg class="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:#2d3d2d">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            No crafted items logged yet.<br />
            <span style="font-size:.8125rem;color:#3d4a3d">Search for an item and add your first craft.</span>
          </div>

          <div v-else class="v2-crafts-scroll">
            <div v-for="craft in characterCrafts" :key="craft.id" class="v2-craft-row">
              <img :src="getItemImg(craft.item)" :alt="craft.item?.name?.fr ?? ''" class="v2-craft-img" @error="onImgErr" />
              <div class="v2-craft-info">
                <div class="v2-craft-name">{{ craft.item?.name?.fr ?? 'Unknown item' }}</div>
                <div class="v2-craft-meta">
                  {{ formatDate(craft.dateSold) }}
                  <span v-if="craft.notes" class="v2-craft-note"> · {{ craft.notes }}</span>
                </div>
                <div v-if="craft.customEffects?.length" class="v2-craft-chips">
                  <span v-for="e in craft.customEffects.slice(0, 3)" :key="e.effectId" class="v2-chip">
                    {{ e.description }}: {{ e.customValue }}
                  </span>
                  <span v-if="craft.customEffects.length > 3" class="v2-chip v2-chip--more">
                    +{{ craft.customEffects.length - 3 }}
                  </span>
                </div>
              </div>
              <div class="v2-craft-price">{{ formatKamas(craft.price) }}</div>
              <button class="v2-craft-del" title="Remove" @click="deleteCraft(craft.id)">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { SoldItem, CustomEffect } from '~/types/game'
definePageMeta({ layout: 'v2' })

const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()
const { data, init: initStore } = useAppDataStore()

// Crafted items are stored in the same sales.items array, tagged by notes prefix
const CRAFT_TAG = '[Crafted]'

// Search
const search = ref('')
const searching = ref(false)
const results = ref<any[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

// Selected item & effects
const selectedItem = ref<any>(null)
const effects = ref<any[]>([])
const effectsLoading = ref(false)
const customValues = reactive<Record<string, number>>({})

// Form
const salePrice = ref(0)
const saleNotes = ref('')

const characterCrafts = computed(() => {
  if (!selectedServer.value || !selectedCharacter.value) return []
  return [...data.value.sales.items]
    .filter(s =>
      s.serverId === selectedServer.value!.id &&
      s.characterId === selectedCharacter.value!.id &&
      (s.notes?.startsWith(CRAFT_TAG) ?? false)
    )
    .sort((a, b) => new Date(b.dateSold).getTime() - new Date(a.dateSold).getTime())
})

const formattedTotal = computed(() => {
  const total = characterCrafts.value.reduce((sum, s) => sum + (s.price ?? 0), 0)
  return formatKamas(total)
})

const getItemImg = (item: any) => item?.img ?? ''

const formatEffectLabel = (effData: any, eff: any): string => {
  let desc = effData?.description?.fr ?? effData?.description?.en ?? `Effet ${eff.effectId ?? eff.id}`
  const from = eff.from ?? eff.value ?? 0
  const to = eff.to ?? eff.value ?? 0
  if (from === to) {
    // Fixed value: strip all {token} blocks, insert value, drop #2
    desc = desc
      .replace(/\{[^}]*\}/g, '')
      .replace(/#1/g, String(from))
      .replace(/#2/g, '')
      .trim()
  } else {
    // Range: keep the separator text inside {~1~2 …}, then strip all remaining tokens
    desc = desc
      .replace(/#1/g, String(from))
      .replace(/#2/g, String(to))
      .replace(/\{~1~2 ([^}]*)\}/g, '$1')
      .replace(/\{[^}]*\}/g, '')   // remove {~ps}, {~zs}, and any other leftover tokens
      .trim()
  }
  // collapse multiple spaces that may result from removed tokens
  return desc.replace(/\s{2,}/g, ' ').trim()
}

const formatKamas = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(doSearch, 350)
}

const doSearch = async () => {
  if (!search.value.trim()) { results.value = []; return }
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
  } catch {
    results.value = []
  } finally {
    searching.value = false
  }
}

const clearSearch = () => {
  search.value = ''
  results.value = []
  selectedItem.value = null
}

const selectItem = async (item: any) => {
  selectedItem.value = item
  effects.value = []
  Object.keys(customValues).forEach(k => delete customValues[k])
  salePrice.value = 0
  saleNotes.value = ''

  if (!item.effects?.length) return

  effectsLoading.value = true
  try {
    const fetched: any[] = []
    for (const eff of item.effects) {
      const effId = eff.effectId ?? eff.id
      if (!effId) continue

      const cacheKey = `dofus-effect-${effId}`
      let effData: any = null
      try {
        const raw = localStorage.getItem(cacheKey)
        if (raw) effData = JSON.parse(raw)
      } catch {}

      if (!effData) {
        try {
          effData = await $fetch<any>(`/api/dofusdb/effects/${effId}`)
          if (effData) localStorage.setItem(cacheKey, JSON.stringify(effData))
        } catch {}
      }

      const idx = fetched.length
      const val = eff.value ?? eff.from ?? 0
      fetched.push({
        id: effId,
        index: idx,
        label: formatEffectLabel(effData, eff),
        value: val,
        from: eff.from ?? val,
        to: eff.to ?? val,
      })
      customValues[`${effId}-${idx}`] = val
    }
    effects.value = fetched
  } finally {
    effectsLoading.value = false
  }
}

const addCraft = () => {
  if (!selectedItem.value || !selectedServer.value || !selectedCharacter.value) return

  const customEffectsList: CustomEffect[] = effects.value.map((eff, i) => ({
    effectId: eff.id,
    customValue: customValues[`${eff.id}-${i}`] ?? eff.value ?? 0,
    description: eff.label,
  }))

  const craftNotes = saleNotes.value
    ? `${CRAFT_TAG} ${saleNotes.value}`
    : CRAFT_TAG

  const sale: SoldItem = {
    id: crypto.randomUUID(),
    itemId: selectedItem.value.id,
    item: selectedItem.value,
    price: salePrice.value ?? 0,
    notes: craftNotes,
    customEffects: customEffectsList,
    serverId: selectedServer.value.id,
    characterId: selectedCharacter.value.id,
    dateSold: new Date().toISOString(),
  }

  data.value.sales.items.push(sale)
  selectedItem.value = null
  effects.value = []
  salePrice.value = 0
  saleNotes.value = ''
  search.value = ''
  results.value = []
}

const deleteCraft = (id: string) => {
  data.value.sales.items = data.value.sales.items.filter(s => s.id !== id)
}

const onImgErr = (e: Event) => {
  const img = e.target as HTMLImageElement
  if (img.dataset.fb) return
  img.dataset.fb = '1'
  img.src = '/item-fallback.svg'
}

onMounted(() => { initContext(); initStore() })
</script>

<style scoped>
.v2-craft-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1rem;
  align-items: start;
}

@media (max-width: 840px) {
  .v2-craft-layout { grid-template-columns: 1fr; }
}

.v2-panel {
  background: rgba(52,211,153,.03);
  border: 1px solid rgba(52,211,153,.1);
  border-radius: 14px;
  padding: 1rem;
}

.v2-panel-title {
  display: flex; align-items: center; gap: .5rem;
  font-size: .875rem; font-weight: 700; color: #52a880;
  margin-bottom: .875rem;
}

.v2-badge-count {
  background: rgba(52,211,153,.15); color: #34d399;
  font-size: .6875rem; font-weight: 600; padding: .125rem .4375rem;
  border-radius: 999px;
}

.v2-badge-total {
  font-size: .75rem; color: #60a5fa; font-weight: 600; margin-left: auto;
}

/* Search */
.v2-searchbox {
  position: relative; display: flex; align-items: center; margin-bottom: .75rem;
}
.v2-searchbox__icon { position: absolute; left: .75rem; color: #2d5e47; pointer-events: none; }
.v2-searchbox__input {
  background: rgba(0,0,0,.3); border: 1px solid rgba(52,211,153,.14); border-radius: 10px;
  padding: .5rem 2.25rem; color: #c8f5e5; font-size: .875rem;
  outline: none; width: 100%; transition: border-color .18s;
}
.v2-searchbox__input:focus { border-color: rgba(52,211,153,.4); }
.v2-searchbox__input::placeholder { color: #1a4030; }
.v2-searchbox__clear {
  position: absolute; right: .625rem; background: none; border: none;
  color: #2d5e47; cursor: pointer; display: flex; align-items: center; transition: color .15s;
}
.v2-searchbox__clear:hover { color: #34d399; }

.v2-inline-loader {
  display: flex; align-items: center; gap: .5rem;
  font-size: .8125rem; color: #3a7a5a; padding: .375rem 0;
}
.v2-spin-sm {
  width: 16px; height: 16px; flex-shrink: 0;
  border: 2px solid rgba(52,211,153,.15); border-top-color: #34d399;
  border-radius: 50%; animation: vspin .8s linear infinite;
}
@keyframes vspin { to { transform: rotate(360deg); } }

.v2-empty-hint { font-size: .8125rem; color: #2d5e47; padding: .375rem 0; }

/* Results */
.v2-results-list {
  display: flex; flex-direction: column; gap: 2px; max-height: 220px;
  overflow-y: auto; margin-bottom: .75rem;
}
.v2-result-row {
  display: flex; align-items: center; gap: .625rem;
  padding: .4375rem .625rem; border-radius: 9px;
  border: 1px solid transparent; background: rgba(0,0,0,.15);
  cursor: pointer; transition: all .15s; text-align: left;
}
.v2-result-row:hover { background: rgba(52,211,153,.07); border-color: rgba(52,211,153,.18); }
.v2-result-row--sel { background: rgba(52,211,153,.1); border-color: rgba(52,211,153,.3); }
.v2-result-img { width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; }
.v2-result-name { font-size: .8125rem; font-weight: 600; color: #c8f5e5; }
.v2-result-sub { font-size: .6875rem; color: #2d5e47; margin-top: 1px; }
.v2-result-info { flex: 1; min-width: 0; }

/* Craft form */
.v2-craft-form {
  background: rgba(0,0,0,.18); border: 1px solid rgba(52,211,153,.12);
  border-radius: 12px; padding: .875rem;
  display: flex; flex-direction: column; gap: .75rem; margin-top: .5rem;
}
.v2-craft-item-header { display: flex; align-items: center; gap: .75rem; }
.v2-craft-item-img { width: 44px; height: 44px; object-fit: contain; flex-shrink: 0; }
.v2-craft-item-name { font-size: .9375rem; font-weight: 700; color: #c8f5e5; }
.v2-craft-item-sub { font-size: .75rem; color: #3a7a5a; margin-top: 2px; }
.v2-form-close {
  margin-left: auto; flex-shrink: 0; background: none; border: none;
  color: #2d5e47; cursor: pointer; display: flex; align-items: center; transition: color .15s;
}
.v2-form-close:hover { color: #f87171; }

/* Effects */
.v2-effects { display: flex; flex-direction: column; gap: 4px; }
.v2-effects-label { font-size: .6875rem; color: #3a7a5a; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px; }
.v2-effect-row { display: flex; align-items: center; gap: .5rem; }
.v2-effect-name {
  flex: 1; font-size: .75rem; color: #6dcfa0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.v2-effect-range { font-size: .6875rem; color: #2d5e47; flex-shrink: 0; }
.v2-effect-input {
  width: 68px; flex-shrink: 0;
  background: rgba(0,0,0,.3); border: 1px solid rgba(52,211,153,.18); border-radius: 7px;
  padding: .25rem .5rem; color: #c8f5e5; font-size: .8125rem; text-align: right;
  outline: none; transition: border-color .15s;
}
.v2-effect-input:focus { border-color: rgba(52,211,153,.45); }

/* Fields */
.v2-sale-fields { display: flex; flex-direction: column; gap: 6px; }
.v2-field-label { font-size: .6875rem; color: #3a7a5a; margin-bottom: 3px; display: block; }
.v2-field-input {
  width: 100%;
  background: rgba(0,0,0,.3); border: 1px solid rgba(52,211,153,.18); border-radius: 8px;
  padding: .4375rem .75rem; color: #c8f5e5; font-size: .875rem;
  outline: none; transition: border-color .15s;
}
.v2-field-input:focus { border-color: rgba(52,211,153,.45); }
.v2-field-input::placeholder { color: #1a4030; }

.v2-btn-craft {
  display: flex; align-items: center; justify-content: center; gap: .5rem;
  padding: .625rem 1rem; border-radius: 10px;
  background: rgba(52,211,153,.15); border: 1px solid rgba(52,211,153,.3);
  color: #c8f5e5; font-size: .875rem; font-weight: 600; cursor: pointer; transition: all .18s;
}
.v2-btn-craft:hover { background: rgba(52,211,153,.25); border-color: rgba(52,211,153,.5); }

/* Empty states */
.v2-empty-full {
  padding: 2.5rem 1rem; text-align: center;
  color: #2d5e47; font-size: .9375rem;
  display: flex; flex-direction: column; align-items: center; gap: .25rem;
}

/* Crafts list */
.v2-crafts-scroll {
  display: flex; flex-direction: column; gap: 4px;
  max-height: calc(100vh - 180px); overflow-y: auto;
}
.v2-craft-row {
  display: flex; align-items: flex-start; gap: .625rem;
  padding: .625rem .75rem; border-radius: 10px;
  background: rgba(0,0,0,.15); border: 1px solid rgba(52,211,153,.07);
  transition: border-color .15s;
}
.v2-craft-row:hover { border-color: rgba(52,211,153,.2); }
.v2-craft-img { width: 36px; height: 36px; object-fit: contain; flex-shrink: 0; margin-top: 2px; }
.v2-craft-info { flex: 1; min-width: 0; }
.v2-craft-name { font-size: .8125rem; font-weight: 600; color: #c8f5e5; }
.v2-craft-meta { font-size: .6875rem; color: #2d5e47; margin-top: 1px; }
.v2-craft-note { color: #3a7a5a; }
.v2-craft-chips { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px; }
.v2-chip {
  font-size: .625rem; padding: .125rem .375rem;
  background: rgba(52,211,153,.08); border: 1px solid rgba(52,211,153,.15);
  border-radius: 4px; color: #6dcfa0;
}
.v2-chip--more { color: #3a7a5a; }
.v2-craft-price {
  font-size: .875rem; font-weight: 700; color: #34d399; flex-shrink: 0; white-space: nowrap;
}
.v2-craft-del {
  flex-shrink: 0; background: none; border: none; color: #1a4030;
  cursor: pointer; display: flex; align-items: center; transition: color .15s; padding: 2px;
}
.v2-craft-del:hover { color: #f87171; }

/* Transition */
.v2-slide-fade-enter-active, .v2-slide-fade-leave-active { transition: all .2s ease; }
.v2-slide-fade-enter-from, .v2-slide-fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
