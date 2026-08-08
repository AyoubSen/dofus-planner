<template>
  <div class="flex flex-col gap-6">
    <!-- Greeting. The old version was a gradient-washed hero the height of a
         card; the name is the only part that was ever load-bearing. -->
    <div class="flex flex-wrap items-center gap-3">
      <UiAvatar :name="selectedCharacter?.name" />
      <!-- basis-64 so the CTA wraps below on a phone instead of squeezing the
           greeting into "Welcome ba…" — the name is the load-bearing part. -->
      <div class="min-w-0 flex-1 basis-64">
        <h1 class="truncate text-xl font-semibold text-ink">
          {{ hasContext ? t('v2.dashboard.welcomeBack', { name: selectedCharacter?.name }) : t('v2.dashboard.welcome') }}
        </h1>
        <p class="truncate text-sm text-subtle">
          {{ hasContext ? `${selectedCharacter?.class} · ${selectedServer?.name}` : t('v2.dashboard.startHint') }}
        </p>
      </div>
      <UiButton variant="primary" :to="localePath('/kamas')">
        {{ t('v2.dashboard.startAction') }}
      </UiButton>
    </div>

    <!-- ── What next ────────────────────────────────────────────────────── -->
    <UiPageSection :title="t('v2.dashboard.whatNext')" >
      <div class="grid gap-3 md:grid-cols-2">
        <NuxtLink
          v-for="action in nextActions"
          :key="action.title"
          :to="localePath(action.path)"
          class="flex gap-3 rounded-lg border border-line bg-surface p-3.5 transition-colors hover:border-line-strong"
        >
          <UiIcon :name="action.icon" class="mt-0.5 shrink-0 text-accent" />
          <div class="min-w-0">
            <p class="text-sm font-medium text-ink">{{ action.title }}</p>
            <p class="mt-1 text-sm text-muted">{{ action.reason }}</p>
            <p class="mt-1.5 text-xs text-accent">{{ action.cta }} →</p>
          </div>
        </NuxtLink>
      </div>
    </UiPageSection>

    <!-- ── Onboarding, only while there is no character ──────────────────── -->
    <UiCard v-if="!hasContext" :title="t('v2.dashboard.onboarding.title')">
      <ol class="flex flex-col gap-3">
        <li v-for="(step, i) in onboardingSteps" :key="step.title" class="flex gap-3">
          <span class="tabular flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-xs text-muted">
            {{ i + 1 }}
          </span>
          <div class="min-w-0">
            <p class="text-sm font-medium text-ink">{{ step.title }}</p>
            <p class="text-sm text-muted">{{ step.desc }}</p>
          </div>
        </li>
      </ol>
    </UiCard>

    <!-- ── Stats ────────────────────────────────────────────────────────── -->
    <UiStatRow :label="t('v2.dashboard.overview')" min="11rem">
      <UiStat
        :label="t('nav.sellArchis')"
        :sub="hasContext ? t('v2.dashboard.currentCharacter') : t('v2.dashboard.selectCharacterHint')"
      >
        <span class="tabular text-xl font-semibold text-ink">{{ monstersCompleted }}</span>
        <span class="tabular text-sm text-subtle">/ {{ totalMonsters }}</span>
      </UiStat>

      <UiStat
        :label="t('v2.dashboard.itemsSold')"
        :value="scopedSalesCount"
        :sub="`${salesScopeLabel} · ${t('v2.dashboard.kamasEarned', { amount: formatKamas(scopedTotalKamas) })}`"
      />

      <UiStat
        v-if="resaleActiveCount > 0 || resaleSoldCount > 0"
        :label="t('nav.flipItems')"
        :value="resaleActiveCount"
        :sub="`${resaleScopeLabel} · ${t('v2.dashboard.soldCount', { count: resaleSoldCount })} · ${realizedProfitLabel}`"
      />
      <UiStat v-else :label="t('nav.flipItems')" :sub="t('v2.dashboard.resaleNotTracked')">
        <NuxtLink :to="localePath('/resale')" class="text-sm text-accent hover:underline">
          {{ t('v2.dashboard.startTrackingResale') }} →
        </NuxtLink>
      </UiStat>

      <UiStat
        :label="t('v2.dashboard.achievementsDone')"
        :value="succesCompletedCount"
        :sub="hasContext ? t('v2.dashboard.currentCharacter') : t('v2.dashboard.noCharacterSelected')"
      />
    </UiStatRow>

    <!-- ── Workflows ────────────────────────────────────────────────────── -->
    <UiPageSection :title="t('v2.dashboard.workflows')">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NuxtLink
          v-for="workflow in beginnerWorkflows"
          :key="workflow.path"
          :to="localePath(workflow.path)"
          class="flex flex-col rounded-lg border border-line bg-surface p-3.5 transition-colors hover:border-line-strong"
        >
          <div class="flex items-center gap-2">
            <UiIcon :name="workflow.icon" class="text-muted" />
            <UiBadge class="ml-auto">{{ workflow.status }}</UiBadge>
          </div>
          <p class="mt-2 text-sm font-medium text-ink">{{ workflow.title }}</p>
          <p class="mt-1 text-sm text-muted">{{ workflow.desc }}</p>
        </NuxtLink>
      </div>
    </UiPageSection>

    <!-- ── Activity ─────────────────────────────────────────────────────── -->
    <UiCard :title="activityFeedTitle" :subtitle="activityScopeLabel" :padded="false">
      <UiEmptyState
        v-if="!activityFeed.length"
        :title="t('v2.dashboard.activityEmpty')"
        :description="t('v2.dashboard.startTrackingHint')"
      >
        <template #icon><UiIcon name="kamas" /></template>
        <template #action>
          <div class="flex flex-wrap justify-center gap-2">
            <UiButton size="sm" :to="localePath('/resale')">{{ $t('nav.flipItems') }}</UiButton>
            <UiButton size="sm" :to="localePath('/brisage')">{{ $t('nav.breakItems') }}</UiButton>
            <UiButton size="sm" :to="localePath('/prices')">{{ $t('nav.prices') }}</UiButton>
          </div>
        </template>
      </UiEmptyState>

      <div v-else class="flex flex-col">
        <NuxtLink
          v-for="activity in activityFeed"
          :key="activity.id"
          :to="localePath(activity.path)"
          class="flex items-center gap-3 border-b border-line px-4 py-2.5 transition-colors last:border-0 hover:bg-sunken"
        >
          <img
            v-if="activity.imageUrl"
            :src="activity.imageUrl"
            :alt="''"
            loading="lazy"
            class="size-9 shrink-0 rounded-md bg-sunken object-cover"
            @error="(e: Event) => { (e.target as HTMLImageElement).style.display = 'none' }"
          >
          <span v-else class="flex size-9 shrink-0 items-center justify-center rounded-md bg-sunken text-subtle">
            <UiIcon :name="activity.icon" />
          </span>

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-ink">{{ activity.title }}</p>
            <p class="truncate text-xs text-subtle">{{ activity.description }} · {{ formatDate(activity.date) }}</p>
          </div>
          <UiIcon name="chevronRight" class="shrink-0 text-subtle" />
        </NuxtLink>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import monstersJson from '@/data/monsters.json'
import type { IconName } from '~/components/ui/Icon.vue'


const localePath = useLocalePath()
const { $i18n } = useNuxtApp()
const t = $i18n.t.bind($i18n)
const { data } = useAppDataStore()
const { servers, selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()

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

const onboardingSteps = computed(() => [
  { title: t('v2.dashboard.onboarding.serverCharacter'), desc: t('v2.dashboard.onboarding.serverCharacterDesc') },
  { title: t('v2.dashboard.onboarding.pickTool'), desc: t('v2.dashboard.onboarding.pickToolDesc') },
  { title: t('v2.dashboard.onboarding.backup'), desc: t('v2.dashboard.onboarding.backupDesc') },
])

const buildAction = (key: string, path: string, icon: IconName, params?: Record<string, unknown>) => ({
  title: t(`v2.dashboard.actions.${key}.title`),
  reason: t(`v2.dashboard.actions.${key}.reason`, params ?? {}),
  cta: t(`v2.dashboard.actions.${key}.cta`),
  path,
  icon,
})

// Three states, in priority order: no character at all, capital already tied
// up in active flips, or a fresh start with nothing in flight.
const nextActions = computed(() => {
  if (!hasContext.value) {
    return [
      buildAction('context', '/', 'home'),
      buildAction('prices', '/prices', 'prices'),
    ]
  }

  if (resaleActiveCount.value > 0) {
    return [
      buildAction('activeFlips', '/resale', 'resale', { count: resaleActiveCount.value }),
      buildAction('reviewSold', '/kamas', 'kamas'),
    ]
  }

  return [
    buildAction('firstFlip', '/resale', 'resale'),
    buildAction('tryBrisage', '/brisage', 'brisage'),
  ]
})

const beginnerWorkflows = computed(() =>
  ([
    { key: 'flip', path: '/resale', icon: 'resale' as IconName },
    { key: 'break', path: '/brisage', icon: 'brisage' as IconName },
    { key: 'craft', path: '/crafting', icon: 'crafting' as IconName },
    { key: 'archis', path: '/archimonstres', icon: 'archimonstres' as IconName },
  ]).map(w => ({
    title: t(`v2.dashboard.workflowCards.${w.key}.title`),
    desc: t(`v2.dashboard.workflowCards.${w.key}.desc`),
    status: t(`v2.dashboard.workflowCards.${w.key}.status`),
    path: w.path,
    icon: w.icon,
  })),
)

const activityFeed = computed(() =>
  scopedActivityEntries.value
    .map((entry) => ({
      id: entry.id,
      date: entry.createdAt,
      title: entry.title,
      description: entry.description,
      path: entry.path,
      icon: (entry.type === 'resale'
        ? 'resale'
        : entry.type === 'archimonstres'
          ? 'archimonstres'
          : 'items') as IconName,
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
onMounted(() => { initContext() })
</script>
