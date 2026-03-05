<template>
  <div>
    <!-- Welcome hero -->
    <div
      class="v2-dash-hero"
      :style="hasContext ? { background: `linear-gradient(135deg, ${charColor}14 0%, transparent 55%)` } : {}"
    >
      <div class="v2-dash-hero__left">
        <div class="v2-dash-hero__avatar" :style="hasContext ? { background: charColor } : {}">
          <span v-if="hasContext">{{ selectedCharacter?.name?.[0]?.toUpperCase() }}</span>
          <svg v-else class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h1 class="v2-dash-hero__title">
            {{ hasContext ? t('v2.dashboard.welcomeBack', { name: selectedCharacter?.name }) : t('v2.dashboard.welcome') }}
          </h1>
          <p class="v2-dash-hero__sub">
            {{ hasContext
              ? `${selectedCharacter?.class} · ${selectedServer?.name}`
              : t('v2.dashboard.startHint') }}
          </p>
        </div>
      </div>
      <div class="v2-topbar__badge" style="font-size:0.75rem;padding:0.25rem 0.625rem;">{{ t('v2.dashboard.beta') }}</div>
    </div>

    <!-- Stats grid -->
    <div class="v2-dash-stats">
      <div class="v2-stat-card">
        <div class="v2-stat-card__icon" style="background:rgba(248,113,113,.12);color:#f87171">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div class="v2-stat-card__body">
          <div class="v2-stat-card__value">
            {{ monstersCompleted }}<span class="v2-stat-card__of">/{{ totalMonsters }}</span>
          </div>
          <div class="v2-stat-card__label">Archimonstres</div>
          <div class="v2-progress" style="margin-top:0.5rem">
            <div class="v2-progress__fill" :style="{ width: `${monstersPercent}%` }" />
          </div>
        </div>
      </div>

      <div class="v2-stat-card">
        <div class="v2-stat-card__icon" style="background:rgba(252,211,77,.12);color:#fcd34d">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <div class="v2-stat-card__body">
          <div class="v2-stat-card__value">{{ salesCount }}</div>
          <div class="v2-stat-card__label">{{ t('v2.dashboard.itemsSold') }}</div>
          <div class="v2-stat-card__sub">{{ t('v2.dashboard.kamasEarned', { amount: formatKamas(totalKamas) }) }}</div>
        </div>
      </div>

      <div class="v2-stat-card">
        <div class="v2-stat-card__icon" style="background:rgba(96,165,250,.12);color:#60a5fa">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div class="v2-stat-card__body">
          <div class="v2-stat-card__value">{{ allCharCount }}</div>
          <div class="v2-stat-card__label">{{ t('v2.dashboard.characters') }}</div>
          <div class="v2-stat-card__sub">{{ t('v2.dashboard.acrossServers', { count: servers.length }) }}</div>
        </div>
      </div>

      <div class="v2-stat-card">
        <div class="v2-stat-card__icon" style="background:rgba(52,211,153,.12);color:#34d399">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <div class="v2-stat-card__body">
          <div class="v2-stat-card__value">{{ monstersPercent }}<span style="font-size:1.1rem">%</span></div>
          <div class="v2-stat-card__label">{{ t('v2.dashboard.overallCompletion') }}</div>
          <div class="v2-stat-card__sub">{{ t('v2.dashboard.monstersCollected', { count: monstersCompleted }) }}</div>
        </div>
      </div>
    </div>

    <!-- Bottom: recent sales + quick nav -->
    <div class="v2-dash-bottom">
      <!-- Recent sales -->
      <div class="v2-card v2-dash-panel">
        <div class="v2-dash-panel__header">
          <h2 class="v2-dash-panel__title">{{ t('v2.dashboard.recentSales') }}</h2>
          <NuxtLink :to="localePath('/v2/items')" class="v2-dash-panel__link">{{ t('v2.dashboard.viewAll') }} →</NuxtLink>
        </div>

        <div v-if="recentSales.length === 0" class="v2-dash-empty">
          <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:.2">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p>{{ t('v2.dashboard.noSales') }}</p>
          <NuxtLink :to="localePath('/v2/items')" class="v2-btn-gold mt-3 px-4 py-2 text-sm font-semibold inline-block">
            {{ t('v2.dashboard.trackFirstSale') }} →
          </NuxtLink>
        </div>

        <div v-else class="v2-dash-sales">
          <div v-for="sale in recentSales" :key="sale.id" class="v2-dash-sale">
            <div class="v2-dash-sale__img">
              <img
                v-if="sale.item?.img"
                :src="sale.item.img"
                :alt="sale.item?.name?.fr"
                class="w-full h-full object-cover"
                @error="(e: Event) => { (e.target as HTMLImageElement).style.display='none' }"
              />
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:.3">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div class="v2-dash-sale__info">
              <div class="v2-dash-sale__name">{{ sale.item?.name?.fr || sale.item?.name?.en || t('v2.dashboard.itemFallback') }}</div>
              <div class="v2-dash-sale__meta">{{ sale.character }} · {{ formatDate(sale.dateSold) }}</div>
            </div>
            <div class="v2-dash-sale__price">{{ formatKamas(sale.price) }}</div>
          </div>
        </div>
      </div>

      <!-- Quick nav -->
      <div>
        <h2 class="v2-dash-panel__title" style="margin-bottom:0.875rem">{{ t('v2.dashboard.quickAccess') }}</h2>
        <div class="v2-dash-quicknav">
          <NuxtLink
            v-for="item in quickItems"
            :key="item.path"
            :to="localePath(item.path)"
            class="v2-dash-quicklink"
            :style="{ '--c': item.color }"
          >
            <div class="v2-dash-quicklink__icon" :style="{ background: `${item.color}1a`, color: item.color }">
              <component :is="item.icon" class="w-5 h-5" />
            </div>
            <span class="v2-dash-quicklink__label">{{ $t(item.label) }}</span>
            <svg class="v2-dash-quicklink__arrow w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'v2' })

const localePath = useLocalePath()
const { t } = useI18n()
const { data } = useAppDataStore()
const { servers, selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()

const COLORS = ['#b85c38','#3873b8','#38a868','#8838b8','#b89038','#38a8b8','#b8386e','#6888b8']
const charColor = computed(() => {
  if (!selectedCharacter.value) return 'var(--v2-text-dim)'
  const h = selectedCharacter.value.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
  return COLORS[h % COLORS.length]
})

// Monster stats
const totalMonsters = ref(0)
const monstersCompleted = ref(0)
const monstersPercent = computed(() =>
  totalMonsters.value > 0 ? Math.round((monstersCompleted.value / totalMonsters.value) * 100) : 0
)

// Sales
const allSales = computed(() => (data.value.sales?.items ?? []) as any[])
const salesCount = computed(() => allSales.value.length)
const totalKamas = computed(() => allSales.value.reduce((s, i) => s + (i.price || 0), 0))
const recentSales = computed(() =>
  [...allSales.value]
    .sort((a, b) => new Date(b.dateSold).getTime() - new Date(a.dateSold).getTime())
    .slice(0, 6)
)

// Accounts
const allCharCount = computed(() => servers.value.reduce((s, sv) => s + sv.characters.length, 0))

const formatKamas = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}
const formatDate = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)
  if (diff === 0) return t('v2.dashboard.today')
  if (diff === 1) return t('v2.dashboard.yesterday')
  if (diff < 7) return t('v2.dashboard.daysAgo', { count: diff })
  return new Date(d).toLocaleDateString()
}

const quickItems = [
  { path: '/v2/archimonstres', label: 'nav.archimonstres', icon: resolveComponent('IconsIconArchimonstres'), color: '#f87171' },
  { path: '/v2/items', label: 'nav.items', icon: resolveComponent('IconsIconItems'), color: '#60a5fa' },
  { path: '/v2/crafting', label: 'nav.crafting', icon: resolveComponent('IconsIconCrafting'), color: '#34d399' },
  { path: '/v2/succes', label: 'nav.succes', icon: resolveComponent('IconsIconSucces'), color: '#fcd34d' },
]

const loadMonsterStats = async () => {
  if (!import.meta.client || !selectedCharacter.value || !selectedServer.value) return
  try {
    const raw = localStorage.getItem('archimonstres-monsters')
    const monsters: any[] = raw ? JSON.parse(raw) : (await import('@/data/monsters.json')).default as any[]
    totalMonsters.value = monsters.length
    monstersCompleted.value = monsters.filter(m => {
      const key = `monster_count_${selectedServer.value!.id}_${selectedCharacter.value!.id}_${m.id}`
      return parseInt(localStorage.getItem(key) ?? '0', 10) > 0
    }).length
  } catch {}
}

onMounted(() => { initContext(); loadMonsterStats() })
watch([selectedCharacter, selectedServer], loadMonsterStats)
</script>

<style scoped>
.v2-dash-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.375rem 1.5rem;
  border-radius: 16px;
  border: 1px solid var(--v2-active);
  background: var(--v2-hover-subtle);
  margin-bottom: 1rem;
  gap: 1rem;
}
.v2-dash-hero__left { display: flex; align-items: center; gap: 1rem; }
.v2-dash-hero__avatar {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; font-weight: 800; color: white; flex-shrink: 0;
  background: var(--v2-active);
  border: 1px dashed var(--v2-border-med);
  color: var(--v2-text-secondary);
}
.v2-dash-hero__title { font-size: 1.375rem; font-weight: 800; color: var(--v2-text); letter-spacing: -.02em; }
.v2-dash-hero__sub { font-size: .875rem; color: var(--v2-text-secondary); margin-top: .125rem; }

.v2-dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: .75rem;
  margin-bottom: 1rem;
}
@media (max-width: 900px) { .v2-dash-stats { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 480px) { .v2-dash-stats { grid-template-columns: 1fr; } }

.v2-stat-card {
  display: flex; align-items: flex-start; gap: .875rem;
  padding: 1rem 1.125rem;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  transition: border-color .2s;
}
.v2-stat-card:hover { border-color: var(--v2-border-strong); }
.v2-stat-card__icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.v2-stat-card__body { flex: 1; min-width: 0; }
.v2-stat-card__value { font-size: 1.875rem; font-weight: 800; color: var(--v2-text); line-height: 1; letter-spacing: -.03em; }
.v2-stat-card__of { font-size: 1rem; font-weight: 500; color: var(--v2-text-dimmer); }
.v2-stat-card__label { font-size: .8125rem; color: var(--v2-text-secondary); margin-top: .25rem; font-weight: 500; }
.v2-stat-card__sub { font-size: .75rem; color: var(--v2-text-dim); margin-top: .125rem; }

.v2-dash-bottom {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1rem;
  align-items: start;
}
@media (max-width: 860px) { .v2-dash-bottom { grid-template-columns: 1fr; } }

.v2-dash-panel { padding: 1.25rem; }
.v2-dash-panel__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.v2-dash-panel__title { font-size: 1rem; font-weight: 700; color: var(--v2-text); }
.v2-dash-panel__link { font-size: .8125rem; color: var(--v2-accent); text-decoration: none; opacity: .8; }
.v2-dash-panel__link:hover { opacity: 1; }

.v2-dash-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 2.5rem; color: var(--v2-text-dim); font-size: .875rem; text-align: center;
}

.v2-dash-sales { display: flex; flex-direction: column; gap: 2px; }
.v2-dash-sale {
  display: flex; align-items: center; gap: .75rem;
  padding: .5rem .625rem; border-radius: 10px; transition: background .15s;
}
.v2-dash-sale:hover { background: var(--v2-hover); }
.v2-dash-sale__img {
  width: 38px; height: 38px; border-radius: 9px;
  background: var(--v2-border-subtle); overflow: hidden;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--v2-text-dim);
}
.v2-dash-sale__info { flex: 1; min-width: 0; }
.v2-dash-sale__name { font-size: .875rem; font-weight: 600; color: var(--v2-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.v2-dash-sale__meta { font-size: .6875rem; color: var(--v2-text-muted); }
.v2-dash-sale__price { font-size: .9375rem; font-weight: 700; color: var(--v2-accent); white-space: nowrap; flex-shrink: 0; }

.v2-dash-quicknav { display: flex; flex-direction: column; gap: .5rem; }
.v2-dash-quicklink {
  display: flex; align-items: center; gap: .875rem;
  padding: .875rem 1rem; border-radius: 12px;
  border: 1px solid var(--v2-border-subtle);
  background: var(--v2-hover-subtle);
  text-decoration: none; transition: all .18s;
}
.v2-dash-quicklink:hover {
  border-color: var(--c, var(--v2-border-strong));
  background: var(--v2-hover);
  transform: translateX(2px);
}
.v2-dash-quicklink__icon {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.v2-dash-quicklink__label { flex: 1; font-size: .9375rem; font-weight: 600; color: var(--v2-text); text-transform: capitalize; }
.v2-dash-quicklink__arrow { color: var(--v2-text-dim); flex-shrink: 0; }
.v2-dash-quicklink:hover .v2-dash-quicklink__arrow { color: var(--v2-accent); }
</style>



