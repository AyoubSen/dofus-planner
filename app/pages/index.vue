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
      <NuxtLink :to="localePath('/kamas')" class="v2-dash-hero__action">
        Start with one action
      </NuxtLink>
    </div>

    <section class="guided-home">
      <div class="guided-home__main v2-card">
        <div class="guided-section-head">
          <div>
            <div class="guided-eyebrow">Beginner mode</div>
            <h2 class="guided-title">What should I do next?</h2>
          </div>
          <span class="guided-pill">Local only</span>
        </div>

        <div class="next-action-list">
          <NuxtLink
            v-for="action in nextActions"
            :key="action.title"
            :to="localePath(action.path)"
            class="next-action-card"
            :style="{ '--action-color': action.color }"
          >
            <div class="next-action-card__icon">
              <component :is="action.icon" class="w-5 h-5" />
            </div>
            <div class="next-action-card__body">
              <div class="next-action-card__title">{{ action.title }}</div>
              <p>{{ action.reason }}</p>
              <span>{{ action.cta }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <div class="guided-home__side v2-card">
        <div class="guided-eyebrow">Rule of thumb</div>
        <h2 class="guided-title">Do not trust paper profit blindly.</h2>
        <p class="guided-copy">
          The app is moving toward realized profit first: sold flips, sold runes, and completed sessions matter more than theoretical value.
        </p>
      </div>
    </section>

    <section class="workflow-grid">
      <NuxtLink
        v-for="workflow in beginnerWorkflows"
        :key="workflow.title"
        :to="localePath(workflow.path)"
        class="workflow-card"
      >
        <div class="workflow-card__top">
          <div class="workflow-card__icon" :style="{ color: workflow.color, background: `${workflow.color}18` }">
            <component :is="workflow.icon" class="w-5 h-5" />
          </div>
          <span>{{ workflow.status }}</span>
        </div>
        <h3>{{ workflow.title }}</h3>
        <p>{{ workflow.desc }}</p>
      </NuxtLink>
    </section>

    <div v-if="!hasContext" class="v2-onboarding">
      <div class="v2-onboarding__head">
        <div>
          <div class="v2-onboarding__eyebrow">{{ t('v2.dashboard.onboarding.eyebrow') }}</div>
          <h2 class="v2-onboarding__title">{{ t('v2.dashboard.onboarding.title') }}</h2>
        </div>
      </div>
      <div class="v2-onboarding__steps">
        <div class="v2-onboarding-step">
          <span class="v2-onboarding-step__num">1</span>
          <div>
            <div class="v2-onboarding-step__title">{{ t('v2.dashboard.onboarding.serverCharacter') }}</div>
            <div class="v2-onboarding-step__desc">{{ t('v2.dashboard.onboarding.serverCharacterDesc') }}</div>
          </div>
        </div>
        <div class="v2-onboarding-step">
          <span class="v2-onboarding-step__num">2</span>
          <div>
            <div class="v2-onboarding-step__title">{{ t('v2.dashboard.onboarding.pickTool') }}</div>
            <div class="v2-onboarding-step__desc">{{ t('v2.dashboard.onboarding.pickToolDesc') }}</div>
          </div>
        </div>
        <div class="v2-onboarding-step">
          <span class="v2-onboarding-step__num">3</span>
          <div>
            <div class="v2-onboarding-step__title">{{ t('v2.dashboard.onboarding.backup') }}</div>
            <div class="v2-onboarding-step__desc">{{ t('v2.dashboard.onboarding.backupDesc') }}</div>
          </div>
        </div>
      </div>
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
          <div class="v2-stat-card__sub">{{ hasContext ? t('v2.dashboard.currentCharacter') : t('v2.dashboard.selectCharacterHint') }}</div>
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
          <div class="v2-stat-card__value">{{ scopedSalesCount }}</div>
          <div class="v2-stat-card__label">{{ t('v2.dashboard.itemsSold') }}</div>
          <div class="v2-stat-card__sub">{{ salesScopeLabel }} · {{ t('v2.dashboard.kamasEarned', { amount: formatKamas(scopedTotalKamas) }) }}</div>
        </div>
      </div>

      <div class="v2-stat-card">
        <div class="v2-stat-card__icon" style="background:rgba(96,165,250,.12);color:#60a5fa">
          <IconsIconResale class="w-5 h-5" />
        </div>
        <div v-if="resaleActiveCount > 0 || resaleSoldCount > 0" class="v2-stat-card__body">
          <div class="v2-stat-card__value">{{ resaleActiveCount }}</div>
          <div class="v2-stat-card__label">{{ $t('nav.resale') }}</div>
          <div class="v2-stat-card__sub">
            {{ resaleScopeLabel }} · {{ resaleSoldCount }} sold · {{ realizedProfitLabel }}
          </div>
          <div class="v2-stat-card__sub">{{ resaleHoldLabel }}</div>
        </div>
        <div v-else class="v2-stat-card__body">
          <div class="v2-stat-card__label" style="margin-top:.25rem">{{ $t('nav.resale') }}</div>
          <div class="v2-stat-card__sub" style="margin-top:.375rem">{{ t('v2.dashboard.resaleNotTracked') }}</div>
          <NuxtLink :to="localePath('/resale')" class="v2-stat-card__action">{{ t('v2.dashboard.startTrackingResale') }}</NuxtLink>
        </div>
      </div>

      <div class="v2-stat-card">
        <div class="v2-stat-card__icon" style="background:rgba(252,211,77,.12);color:#fcd34d">
          <IconsIconSucces class="w-5 h-5" />
        </div>
        <div class="v2-stat-card__body">
          <div class="v2-stat-card__value">{{ succesCompletedCount }}</div>
          <div class="v2-stat-card__label">{{ t('v2.dashboard.achievementsDone') }}</div>
          <div class="v2-stat-card__sub">{{ hasContext ? t('v2.dashboard.currentCharacter') : t('v2.dashboard.noCharacterSelected') }}</div>
        </div>
      </div>
    </div>

    <!-- Bottom: activity + quick nav -->
    <div class="v2-dash-bottom">
      <!-- Activity feed -->
      <div class="v2-card v2-dash-panel">
        <div class="v2-dash-panel__header">
          <h2 class="v2-dash-panel__title">{{ activityFeedTitle }}</h2>
          <span class="v2-dash-panel__link">{{ activityScopeLabel }}</span>
        </div>

        <div v-if="activityFeed.length === 0" class="v2-dash-empty">
          <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:.2">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{{ t('v2.dashboard.activityEmpty') }}</p>
          <p class="v2-dash-empty__hint">{{ t('v2.dashboard.startTrackingHint') }}</p>
          <div class="v2-dash-empty-links">
            <NuxtLink :to="localePath('/kamas')" class="v2-dash-empty-link">{{ $t('nav.kamas') }}</NuxtLink>
            <NuxtLink :to="localePath('/archimonstres')" class="v2-dash-empty-link">{{ $t('nav.archimonstres') }}</NuxtLink>
            <NuxtLink :to="localePath('/prices')" class="v2-dash-empty-link">{{ $t('nav.prices') }}</NuxtLink>
            <NuxtLink :to="localePath('/crafting')" class="v2-dash-empty-link">{{ $t('nav.crafting') }}</NuxtLink>
            <NuxtLink :to="localePath('/brisage')" class="v2-dash-empty-link">{{ $t('nav.brisage') }}</NuxtLink>
          </div>
        </div>

        <div v-else class="v2-dash-sales">
          <div v-for="activity in activityFeed" :key="activity.id" class="v2-dash-sale">
            <div class="v2-dash-sale__img">
              <img
                v-if="activity.imageUrl"
                :src="activity.imageUrl"
                :alt="activity.title"
                class="w-full h-full object-cover"
                @error="(e: Event) => { (e.target as HTMLImageElement).style.display='none' }"
              />
              <div
                v-else
                class="v2-dash-sale__icon-fallback"
                :style="{ color: activity.color, background: `${activity.color}18` }"
              >
                <component :is="activity.icon" class="w-5 h-5" />
              </div>
            </div>
            <div class="v2-dash-sale__info">
              <div class="v2-dash-sale__name">{{ activity.title }}</div>
              <div class="v2-dash-sale__meta">{{ activity.description }} · {{ formatDate(activity.date) }}</div>
            </div>
            <NuxtLink :to="localePath(activity.path)" class="v2-dash-panel__link">{{ activity.cta }} →</NuxtLink>
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
import monstersJson from '@/data/monsters.json'


const localePath = useLocalePath()
const { $i18n } = useNuxtApp()
const t = $i18n.t.bind($i18n)
const { data } = useAppDataStore()
const { servers, selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()

const COLORS = ['#b85c38','#3873b8','#38a868','#8838b8','#b89038','#38a8b8','#b8386e','#6888b8']
const charColor = computed(() => {
  if (!selectedCharacter.value) return 'var(--v2-text-dim)'
  const h = selectedCharacter.value.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
  return COLORS[h % COLORS.length]
})

const succesCompletedCount = computed(() => {
  if (!hasContext.value || !selectedCharacter.value || !selectedServer.value) return 0
  try {
    const key = `achievements-${selectedServer.value.id}-${selectedCharacter.value.id}`
    const raw = localStorage.getItem(key)
    if (!raw) return 0
    const parsed = JSON.parse(raw)
    return (parsed.completedIds ?? []).length
  } catch { return 0 }
})

const archiMonsters = monstersJson.filter((monster) => monster.type === 'archimonstre')
const totalMonsters = archiMonsters.length
const monstersCompleted = computed(() => {
  const progress = selectedCharacter.value?.archimonstresProgress?.monsters
  if (!progress) return 0

  return archiMonsters.reduce((count, monster) => {
    return progress[String(monster.id)]?.captured ? count + 1 : count
  }, 0)
})
const monstersPercent = computed(() =>
  totalMonsters > 0 ? Math.round((monstersCompleted.value / totalMonsters) * 100) : 0
)
const archiCompletedCountForCharacter = (character: any) => {
  const progress = character?.archimonstresProgress?.monsters
  if (!progress) return 0

  return archiMonsters.reduce((count, monster) => {
    return progress[String(monster.id)]?.captured ? count + 1 : count
  }, 0)
}

// Sales
const allSales = computed(() => (data.value.sales?.items ?? []) as any[])
const selectedCharacterSales = computed(() => {
  if (!selectedCharacter.value || !selectedServer.value) return []
  return allSales.value.filter((sale) =>
    String(sale.characterId) === String(selectedCharacter.value?.id)
    && String(sale.serverId) === String(selectedServer.value?.id)
  )
})
const scopedSales = computed(() => (hasContext.value ? selectedCharacterSales.value : allSales.value))
const scopedSalesCount = computed(() => scopedSales.value.length)
const scopedTotalKamas = computed(() => scopedSales.value.reduce((sum, sale) => sum + (sale.price || 0), 0))
const salesScopeLabel = computed(() => hasContext.value ? t('v2.dashboard.currentCharacter') : t('v2.dashboard.allCharacters'))
const activityScopeLabel = computed(() => hasContext.value ? t('v2.dashboard.currentCharacter') : t('v2.dashboard.allCharacters'))
const activityFeedTitle = computed(() => t('v2.dashboard.recentActivity'))
const scopedActivityEntries = computed(() => {
  const entries = data.value.activity?.entries ?? []
  if (!hasContext.value || !selectedCharacter.value || !selectedServer.value) return entries
  return entries.filter((entry) =>
    String(entry.characterId) === String(selectedCharacter.value?.id)
    && String(entry.serverId) === String(selectedServer.value?.id)
  )
})

const scopedResaleEntries = computed(() => {
  const entries = data.value.resale?.entries ?? []
  if (!hasContext.value || !selectedCharacter.value || !selectedServer.value) return entries
  return entries.filter((entry) =>
    String(entry.characterId) === String(selectedCharacter.value?.id)
    && String(entry.serverId) === String(selectedServer.value?.id)
  )
})
const resaleActiveEntries = computed(() =>
  scopedResaleEntries.value.filter((entry) =>
    entry.status === 'watched'
    || entry.status === 'bought'
    || entry.status === 'listed',
  ),
)
const resaleSoldEntries = computed(() =>
  scopedResaleEntries.value.filter((entry) => entry.status === 'sold'),
)
const resaleActiveCount = computed(() => resaleActiveEntries.value.length)
const resaleSoldCount = computed(() => resaleSoldEntries.value.length)
const realizedProfit = computed(() =>
  resaleSoldEntries.value.reduce((total, entry) => total + ((entry.soldPrice ?? 0) - (entry.buyPrice ?? 0)), 0),
)
const averageResaleHoldDurationMs = computed(() => {
  const values = resaleSoldEntries.value
    .map((entry) => getDurationMs(entry.boughtAt, entry.soldAt))
    .filter((value): value is number => value != null)

  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
})
const resaleScopeLabel = computed(() => hasContext.value ? t('v2.dashboard.currentCharacter') : t('v2.dashboard.allCharacters'))
const realizedProfitLabel = computed(() =>
  `${realizedProfit.value >= 0 ? '+' : ''}${formatKamas(Math.abs(realizedProfit.value))}${realizedProfit.value < 0 ? ' loss' : ' realized'}`
)
const resaleHoldLabel = computed(() =>
  averageResaleHoldDurationMs.value == null
    ? 'Avg hold: n/a'
    : `Avg hold: ${formatDuration(averageResaleHoldDurationMs.value)}`
)

const nextActions = computed(() => {
  if (!hasContext.value) {
    return [
      {
        title: 'Create your first character context',
        reason: 'Most money tracking needs a server and character so your prices, flips, and sessions do not mix together.',
        cta: 'Use the character button in the sidebar',
        path: '/',
        color: '#f5a523',
        icon: resolveComponent('IconsIconDashboard'),
      },
      {
        title: 'Start with prices, not guesses',
        reason: 'Resale, brisage, and craft/FM decisions are only useful when market prices are fresh.',
        cta: 'Open Prices',
        path: '/prices',
        color: '#60a5fa',
        icon: resolveComponent('IconsIconItems'),
      },
    ]
  }

  if (resaleActiveCount.value > 0) {
    return [
      {
        title: 'Check active flips first',
        reason: `You have ${resaleActiveCount.value} active resale item${resaleActiveCount.value === 1 ? '' : 's'}. Relisting or cancelling stale items protects your capital.`,
        cta: 'Open Flip Items',
        path: '/resale',
        color: '#22c55e',
        icon: resolveComponent('IconsIconResale'),
      },
      {
        title: 'Review what actually sold',
        reason: 'Use realized sales to learn what worked before trusting another opportunity.',
        cta: 'Open History',
        path: '/kamas',
        color: '#eab308',
        icon: resolveComponent('IconsIconItems'),
      },
    ]
  }

  return [
    {
      title: 'Learn one small flip',
      reason: 'Watch one item, set a safe buy price, list it, and track the result before scaling up.',
      cta: 'Open Flip Items',
      path: '/resale',
      color: '#22c55e',
      icon: resolveComponent('IconsIconResale'),
    },
    {
      title: 'Try brisage carefully',
      reason: 'Brisage can look profitable on paper. Start by comparing item cost with rune prices and mark profit as paper until runes sell.',
      cta: 'Open Break Items',
      path: '/brisage',
      color: '#a78bfa',
      icon: resolveComponent('IconsIconBrisage'),
    },
  ]
})

const beginnerWorkflows = [
  {
    title: 'Flip Items',
    desc: 'Beginner resale flow: watch, buy under a safe price, list, sell, then learn.',
    status: 'Start here',
    path: '/resale',
    color: '#22c55e',
    icon: resolveComponent('IconsIconResale'),
  },
  {
    title: 'Break Items',
    desc: 'Track brisage without lying to yourself about unsold rune value.',
    status: 'Good next',
    path: '/brisage',
    color: '#a78bfa',
    icon: resolveComponent('IconsIconBrisage'),
  },
  {
    title: 'Craft/FM',
    desc: 'Run craft experiments with recipe cost, FM budget, and break-even price.',
    status: 'Experiment',
    path: '/crafting',
    color: '#34d399',
    icon: resolveComponent('IconsIconCrafting'),
  },
  {
    title: 'Sell Archis',
    desc: 'Track captures, listings, stale prices, and real archimonstre sales.',
    status: 'Optional loop',
    path: '/archimonstres',
    color: '#f87171',
    icon: resolveComponent('IconsIconArchimonstres'),
  },
]

const activityFeed = computed(() =>
  scopedActivityEntries.value
    .map((entry) => ({
      id: entry.id,
      date: entry.createdAt,
      title: entry.title,
      description: entry.description,
      path: entry.path,
      cta: entry.type === 'resale'
        ? 'Open resale'
        : entry.type === 'archimonstres'
          ? 'Open archimonstres'
          : entry.type === 'sales'
            ? 'Open items'
            : 'Open',
      color: entry.type === 'resale'
        ? '#22c55e'
        : entry.type === 'archimonstres'
          ? '#f87171'
          : entry.type === 'sales'
            ? '#fcd34d'
            : '#60a5fa',
      icon: resolveComponent(
        entry.type === 'resale'
          ? 'IconsIconResale'
          : entry.type === 'archimonstres'
            ? 'IconsIconArchimonstres'
            : 'IconsIconItems'
      ),
      imageUrl: entry.imageUrl || '',
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
)

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
const getDurationMs = (start: string | null | undefined, end: string | null | undefined) => {
  if (!start || !end) return null

  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return null

  return endMs - startMs
}
const formatDuration = (value: number | null) => {
  if (value == null) return 'n/a'

  const totalHours = Math.round(value / (1000 * 60 * 60))
  if (totalHours < 24) return `${totalHours}h`

  const totalDays = Math.round(totalHours / 24)
  if (totalDays < 30) return `${totalDays}d`

  return `${(totalDays / 30).toFixed(1)}mo`
}
const quickItems = [
  { path: '/resale', label: 'nav.flipItems', icon: resolveComponent('IconsIconResale'), color: '#22c55e' },
  { path: '/brisage', label: 'nav.breakItems', icon: resolveComponent('IconsIconBrisage'), color: '#a78bfa' },
  { path: '/crafting', label: 'nav.craftFm', icon: resolveComponent('IconsIconCrafting'), color: '#34d399' },
  { path: '/archimonstres', label: 'nav.sellArchis', icon: resolveComponent('IconsIconArchimonstres'), color: '#f87171' },
  { path: '/prices', label: 'nav.prices', icon: resolveComponent('IconsIconItems'), color: '#60a5fa' },
  { path: '/kamas', label: 'nav.history', icon: resolveComponent('IconsIconItems'), color: '#eab308' },
]

onMounted(() => { initContext() })
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
.v2-dash-hero__action {
  flex-shrink: 0;
  padding: .625rem .875rem;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--v2-accent), var(--v2-accent-dark));
  color: var(--v2-bg);
  font-size: .8125rem;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
}
.v2-dash-hero__action:hover { box-shadow: 0 0 16px var(--v2-glow-strong); }
@media (max-width: 640px) {
  .v2-dash-hero {
    align-items: stretch;
    flex-direction: column;
  }
  .v2-dash-hero__action {
    text-align: center;
  }
}

.guided-home {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1rem;
  margin-bottom: 1rem;
}
.guided-home__main,
.guided-home__side {
  padding: 1.25rem;
}
.guided-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.guided-eyebrow {
  font-size: .625rem;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--v2-accent);
}
.guided-title {
  margin-top: .25rem;
  font-size: 1.125rem;
  font-weight: 850;
  color: var(--v2-text);
  letter-spacing: -.02em;
}
.guided-pill {
  padding: .25rem .5rem;
  border-radius: 999px;
  border: 1px solid var(--v2-border-med);
  color: var(--v2-text-secondary);
  background: var(--v2-hover-subtle);
  font-size: .6875rem;
  font-weight: 800;
  white-space: nowrap;
}
.guided-copy {
  margin-top: .625rem;
  color: var(--v2-text-secondary);
  font-size: .875rem;
  line-height: 1.6;
}
.next-action-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .75rem;
}
.next-action-card {
  display: flex;
  gap: .875rem;
  padding: .875rem;
  border-radius: 13px;
  border: 1px solid var(--v2-border-subtle);
  background: var(--v2-hover-subtle);
  text-decoration: none;
  transition: border-color .18s, background .18s, transform .18s;
}
.next-action-card:hover {
  border-color: var(--action-color, var(--v2-accent));
  background: var(--v2-hover);
  transform: translateY(-1px);
}
.next-action-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--action-color, var(--v2-accent));
  background: color-mix(in srgb, var(--action-color, #f5a523) 14%, transparent);
}
.next-action-card__body { min-width: 0; }
.next-action-card__title {
  color: var(--v2-text);
  font-size: .9375rem;
  font-weight: 850;
}
.next-action-card__body p {
  margin-top: .25rem;
  color: var(--v2-text-secondary);
  font-size: .8125rem;
  line-height: 1.45;
}
.next-action-card__body span {
  display: inline-block;
  margin-top: .625rem;
  color: var(--action-color, var(--v2-accent));
  font-size: .75rem;
  font-weight: 850;
}
.workflow-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .75rem;
  margin-bottom: 1rem;
}
.workflow-card {
  padding: 1rem;
  border-radius: 14px;
  border: 1px solid var(--v2-border-subtle);
  background: var(--v2-hover-subtle);
  text-decoration: none;
  transition: border-color .18s, background .18s;
}
.workflow-card:hover {
  border-color: var(--v2-border-strong);
  background: var(--v2-hover);
}
.workflow-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  margin-bottom: .875rem;
}
.workflow-card__icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.workflow-card__top span {
  color: var(--v2-text-dim);
  font-size: .6875rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.workflow-card h3 {
  color: var(--v2-text);
  font-size: .9375rem;
  font-weight: 850;
}
.workflow-card p {
  margin-top: .375rem;
  color: var(--v2-text-secondary);
  font-size: .8125rem;
  line-height: 1.45;
}
@media (max-width: 1020px) {
  .guided-home { grid-template-columns: 1fr; }
  .workflow-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .next-action-list,
  .workflow-grid {
    grid-template-columns: 1fr;
  }
}

.v2-onboarding {
  padding: 1.125rem;
  margin-bottom: 1rem;
  border-radius: 14px;
  border: 1px solid var(--v2-border-focus);
  background: linear-gradient(135deg, var(--v2-active-strong), var(--v2-hover-subtle));
}
.v2-onboarding__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .875rem;
}
.v2-onboarding__eyebrow {
  font-size: .625rem;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--v2-accent);
}
.v2-onboarding__title {
  margin-top: .25rem;
  font-size: 1rem;
  font-weight: 800;
  color: var(--v2-text);
}
.v2-onboarding__steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .75rem;
}
.v2-onboarding-step {
  display: flex;
  gap: .75rem;
  min-width: 0;
  padding: .75rem;
  border-radius: 11px;
  background: rgba(0,0,0,.16);
  border: 1px solid var(--v2-border-subtle);
}
.v2-onboarding-step__num {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--v2-accent);
  color: var(--v2-bg);
  font-size: .75rem;
  font-weight: 900;
}
.v2-onboarding-step__title {
  font-size: .875rem;
  font-weight: 800;
  color: var(--v2-text);
}
.v2-onboarding-step__desc {
  margin-top: .2rem;
  font-size: .75rem;
  line-height: 1.4;
  color: var(--v2-text-secondary);
}
@media (max-width: 760px) {
  .v2-onboarding__steps { grid-template-columns: 1fr; }
}

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
.v2-dash-empty__hint { font-size: .8125rem; color: var(--v2-text-dim); margin-top: .5rem; }
.v2-dash-empty-links {
  display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; margin-top: .875rem;
}
.v2-dash-empty-link {
  padding: .375rem .875rem; border-radius: 8px;
  border: 1px solid var(--v2-border-subtle);
  background: var(--v2-hover-subtle);
  font-size: .8125rem; font-weight: 600; color: var(--v2-text-secondary);
  text-decoration: none; transition: all .15s;
}
.v2-dash-empty-link:hover { border-color: var(--v2-accent); color: var(--v2-accent); background: var(--v2-hover); }
.v2-stat-card__action {
  display: inline-block; margin-top: .5rem;
  font-size: .75rem; font-weight: 600; color: var(--v2-accent);
  text-decoration: none; opacity: .85;
}
.v2-stat-card__action:hover { opacity: 1; }

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
.v2-dash-sale__icon-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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
