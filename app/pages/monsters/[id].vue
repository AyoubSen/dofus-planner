<template>
  <div class="flex flex-col gap-5">
    <UiButton variant="ghost" size="sm" :to="backLink" class="self-start">
      <template #icon><UiIcon name="chevronLeft" /></template>
      {{ $t('monsters.backToList') }}
    </UiButton>

    <!-- ── Loading ──────────────────────────────────────────────────────── -->
    <template v-if="pending">
      <div class="flex gap-4">
        <UiSkeleton width="7.5rem" height="7.5rem" />
        <div class="flex flex-1 flex-col gap-2">
          <UiSkeleton width="4rem" height="0.75rem" />
          <UiSkeleton width="55%" height="2rem" />
          <UiSkeleton width="35%" height="0.875rem" />
        </div>
      </div>
      <div class="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(9rem,1fr))]">
        <UiSkeleton v-for="i in 4" :key="i" height="4.5rem" />
      </div>
      <div class="grid gap-4 lg:grid-cols-3">
        <UiSkeleton v-for="i in 3" :key="i" height="14rem" />
      </div>
    </template>

    <!-- ── Error ────────────────────────────────────────────────────────── -->
    <UiEmptyState
      v-else-if="error || !monster"
      :title="$t('monsters.detail.errorTitle')"
      :description="$t('monsters.detail.errorDescription')"
    >
      <template #icon><UiIcon name="alert" /></template>
    </UiEmptyState>

    <template v-else>
      <!-- ── Identity ───────────────────────────────────────────────────── -->
      <div class="flex flex-wrap items-start gap-4">
        <div class="flex size-30 shrink-0 items-center justify-center rounded-lg border border-line bg-sunken p-2">
          <img
            :src="monster.img || '/monster-fallback.svg'"
            :alt="''"
            class="max-h-full max-w-full object-contain"
            @error="onImgError"
          >
        </div>
        <div class="min-w-0 flex-1">
          <p class="tabular text-xs text-subtle">ID {{ monster.id }}</p>
          <h1 class="mt-0.5 text-2xl font-semibold text-ink">{{ localizedName(monster.name) }}</h1>
          <p v-if="localizedName(monster.slug)" class="text-sm text-subtle">{{ localizedName(monster.slug) }}</p>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <UiBadge v-if="monster.isBoss" tone="accent">{{ $t('monsters.badges.boss') }}</UiBadge>
            <UiBadge v-if="monster.isMiniBoss">{{ $t('monsters.badges.miniBoss') }}</UiBadge>
            <UiBadge v-if="monster.isQuestMonster">{{ $t('monsters.badges.quest') }}</UiBadge>
            <UiBadge v-for="tag in monster.tags?.slice(0, 4)" :key="tag">{{ tag }}</UiBadge>
          </div>
        </div>
      </div>

      <!-- Instant-kill spells are the one genuinely dangerous fact on this
           page, so this is where a warning colour earns its place. -->
      <div
        v-if="killSpells.length"
        class="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 p-3"
      >
        <UiIcon name="alert" class="mt-0.5 shrink-0 text-warning" />
        <div class="min-w-0 text-sm">
          <p class="font-medium text-ink">{{ $t('monsters.detail.killSpells') }}</p>
          <p class="mt-0.5 text-muted">
            <span v-for="(ks, i) in killSpells" :key="ks.spellId">
              {{ ks.name }}<span v-if="ks.chance !== null" class="tabular"> ({{ Math.round(ks.chance) }}%)</span
              ><span v-if="i < killSpells.length - 1">, </span>
            </span>
          </p>
        </div>
      </div>

      <!-- ── Key stats ──────────────────────────────────────────────────── -->
      <UiStatRow>
        <UiStat :label="$t('monsters.detail.mainLevel')" :value="primaryGrade?.level ?? '—'" />
        <UiStat :label="$t('monsters.detail.lifePoints')" :value="primaryGrade?.lifePoints ?? '—'" />
        <UiStat
          :label="$t('monsters.detail.apMp')"
          :value="`${primaryGrade?.actionPoints ?? '—'} / ${primaryGrade?.movementPoints ?? '—'}`"
        />
        <UiStat :label="$t('monsters.detail.spells')" :value="monster.spells?.length ?? 0" />
      </UiStatRow>

      <!-- ── Zones ──────────────────────────────────────────────────────── -->
      <UiCard v-if="subareas?.length" :title="$t('monsters.detail.foundIn')">
        <div class="flex flex-wrap gap-2">
          <div v-for="zone in subareas" :key="zone.id" class="rounded-md border border-line px-2.5 py-1.5">
            <p class="text-sm text-ink">{{ localizedName(zone.name) }}</p>
            <p class="text-xs text-subtle">
              <span class="tabular">{{ $t('monsters.level', { level: zone.level }) }}</span>
              <span v-if="zone.dungeonId > 0"> · {{ $t('monsters.detail.dungeon') }}</span>
            </p>
          </div>
        </div>
      </UiCard>

      <!-- ── Detail panels ──────────────────────────────────────────────── -->
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)]">
        <UiCard :title="$t('monsters.detail.characteristics')">
          <dl class="flex flex-col">
            <div v-for="row in characteristics" :key="row.label" class="flex justify-between gap-3 border-b border-line py-1.5 last:border-0">
              <dt class="text-sm text-muted">{{ row.label }}</dt>
              <dd class="tabular text-sm font-medium text-ink">{{ row.value }}</dd>
            </div>
          </dl>
        </UiCard>

        <UiCard :title="$t('monsters.detail.resistances')">
          <dl class="flex flex-col">
            <div v-for="row in resistances" :key="row.label" class="flex justify-between gap-3 border-b border-line py-1.5 last:border-0">
              <dt class="text-sm text-muted">{{ row.label }}</dt>
              <dd :class="['tabular text-sm font-medium', resistTone(row.value)]">{{ row.value }}%</dd>
            </div>
          </dl>
        </UiCard>

        <UiCard :padded="false">
          <template #title>
            {{ $t('monsters.detail.drops') }}
            <span class="tabular text-subtle">({{ monster.drops?.length ?? 0 }})</span>
          </template>

          <div v-if="monster.drops?.length" class="max-h-80 overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-surface">
                <tr class="border-b border-line">
                  <th scope="col" class="px-4 py-2 text-left text-xs font-medium tracking-wide text-subtle uppercase">
                    {{ $t('monsters.detail.item') }}
                  </th>
                  <th scope="col" class="px-4 py-2 text-right text-xs font-medium tracking-wide text-subtle uppercase">
                    {{ $t('monsters.detail.dropRate') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="drop in monster.drops"
                  :key="`${drop.objectId}-${drop.alterationId}`"
                  class="border-b border-line last:border-0"
                >
                  <td class="px-4 py-1.5">
                    <span class="text-ink">
                      {{ dropItemNames?.[drop.objectId] ?? $t('monsters.detail.objectId', { id: drop.objectId }) }}
                    </span>
                    <span v-if="drop.hasCriterions" class="ml-1.5 text-xs text-subtle" :title="$t('monsters.detail.conditional')">
                      {{ $t('monsters.detail.conditionalShort') }}
                    </span>
                  </td>
                  <td class="tabular px-4 py-1.5 text-right whitespace-nowrap text-muted">{{ formatDropRate(drop) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="p-4 text-sm text-subtle">{{ $t('monsters.detail.noDrops') }}</p>
        </UiCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
type MonsterGrade = {
  level?: number
  lifePoints?: number
  actionPoints?: number
  movementPoints?: number
  wisdom?: number
  strength?: number
  intelligence?: number
  chance?: number
  agility?: number
  earthResistance?: number
  fireResistance?: number
  waterResistance?: number
  airResistance?: number
  neutralResistance?: number
}

type MonsterDrop = {
  objectId: number
  alterationId?: number
  percentDropForGrade1?: number
  percentDropForGrade2?: number
  percentDropForGrade3?: number
  percentDropForGrade4?: number
  percentDropForGrade5?: number
  minPercentDrop?: number
  maxPercentDrop?: number
  isGlobal?: boolean
  hasCriterions?: boolean
}

type MonsterDetail = {
  id: number
  img?: string
  tags?: string[]
  spells?: number[]
  grades?: MonsterGrade[]
  drops?: MonsterDrop[]
  subareas?: number[]
  isBoss?: boolean
  isMiniBoss?: boolean
  isQuestMonster?: boolean
  canPlay?: boolean
  canTackle?: boolean
  canUsePortal?: boolean
  name?: Record<string, string>
  slug?: Record<string, string>
}

const localePath = useLocalePath()
const route = useRoute()
const { t } = useI18n()
const { localizedName } = useLocalizedName()

const monsterId = computed(() => String(route.params.id || ''))

const backLink = computed(() => {
  const searchParams = new URLSearchParams()
  if (typeof route.query.q === 'string') searchParams.set('q', route.query.q)
  if (typeof route.query.page === 'string') searchParams.set('page', route.query.page)

  const basePath = localePath('/monsters')
  const queryString = searchParams.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
})

const { data: monster, pending, error } = await useAsyncData<MonsterDetail>(
  `dofusdb-monster-${monsterId.value}`,
  () => $fetch(`/api/dofusdb/monsters/${monsterId.value}`, { query: { lang: 'fr' } }),
  { watch: [monsterId], lazy: true },
)

const primaryGrade = computed(() => monster.value?.grades?.[0] ?? null)

const characteristics = computed(() => [
  { label: t('monsters.detail.strength'), value: primaryGrade.value?.strength ?? 0 },
  { label: t('monsters.detail.intelligence'), value: primaryGrade.value?.intelligence ?? 0 },
  { label: t('monsters.detail.chance'), value: primaryGrade.value?.chance ?? 0 },
  { label: t('monsters.detail.agility'), value: primaryGrade.value?.agility ?? 0 },
  { label: t('monsters.detail.wisdom'), value: primaryGrade.value?.wisdom ?? 0 },
])

const resistances = computed(() => [
  { label: t('monsters.detail.neutral'), value: primaryGrade.value?.neutralResistance ?? 0 },
  { label: t('monsters.detail.earth'), value: primaryGrade.value?.earthResistance ?? 0 },
  { label: t('monsters.detail.fire'), value: primaryGrade.value?.fireResistance ?? 0 },
  { label: t('monsters.detail.water'), value: primaryGrade.value?.waterResistance ?? 0 },
  { label: t('monsters.detail.air'), value: primaryGrade.value?.airResistance ?? 0 },
])

// ── Types for secondary data ──────────────────────────────────
type SubareaData = { id: number, level: number, dungeonId: number, name?: Record<string, string> }
type SpellData = { id: number, spellLevels: number[], name?: Record<string, string> }
type SpellLevelEffect = { effectId: number, random?: number }
type SpellLevelData = { id: number, spellId: number, effects: SpellLevelEffect[] }
type KillSpell = { spellId: number, name: string, chance: number | null }

// effectId 405 = "Tue la cible et remplace par l'invocation"
const KILL_EFFECT_IDS = new Set([405])

// ── Secondary data — all driven by a single watcher ──────────
// Using useAsyncData with `watch` for secondary fetches causes i18n
// context errors because their watchers fire outside component setup.
// One plain watch on `monster` avoids all of that.
const subareas = ref<SubareaData[]>([])
const dropItemNames = ref<Record<number, string>>({})
const spellsRaw = ref<SpellData[]>([])
const spellLevelsRaw = ref<SpellLevelData[]>([])

watch(
  monster,
  async (mon) => {
    if (!mon) {
      subareas.value = []
      dropItemNames.value = {}
      spellsRaw.value = []
      spellLevelsRaw.value = []
      return
    }

    const [subareasRes, dropsRes, spellsRes] = await Promise.all([
      (async () => {
        const ids = mon.subareas ?? []
        if (!ids.length) return []
        try {
          const res = await $fetch<{ data: SubareaData[] }>('/api/dofusdb/subareas', {
            query: { 'id[]': ids, 'lang': 'fr', '$limit': 20 },
          })
          return res.data
        } catch { return [] }
      })(),
      (async () => {
        const ids = [...new Set(mon.drops?.map(d => d.objectId) ?? [])]
        if (!ids.length) return {}
        try {
          const query: Record<string, unknown> = { '$limit': ids.length + 5, 'lang': 'fr' }
          ids.forEach((id, i) => { query[`id[$in][${i}]`] = id })
          const res = await $fetch<{ data: Array<{ id: number, name?: Record<string, string> }> }>(
            '/api/dofusdb/items', { query },
          )
          return Object.fromEntries(
            res.data.map(item => [item.id, localizedName(item.name, `#${item.id}`)]),
          )
        } catch { return {} }
      })(),
      (async () => {
        const ids = mon.spells ?? []
        if (!ids.length) return []
        try {
          const query: Record<string, unknown> = { '$limit': ids.length + 5, 'lang': 'fr' }
          ids.forEach((id, i) => { query[`id[$in][${i}]`] = id })
          const res = await $fetch<{ data: SpellData[] }>('/api/dofusdb/spells', { query })
          return res.data
        } catch { return [] }
      })(),
    ])

    subareas.value = subareasRes as SubareaData[]
    dropItemNames.value = dropsRes as Record<number, string>
    spellsRaw.value = spellsRes as SpellData[]

    // Spell levels depend on spells — fetch after
    const levelIds = (spellsRes as SpellData[]).map(s => s.spellLevels[0]).filter(Boolean)
    if (levelIds.length) {
      try {
        const query: Record<string, unknown> = { '$limit': levelIds.length + 5, 'lang': 'fr' }
        levelIds.forEach((id, i) => { query[`id[$in][${i}]`] = id })
        const res = await $fetch<{ data: SpellLevelData[] }>('/api/dofusdb/spell-levels', { query })
        spellLevelsRaw.value = res.data
      } catch { spellLevelsRaw.value = [] }
    } else {
      spellLevelsRaw.value = []
    }
  },
  { immediate: true },
)

const killSpells = computed<KillSpell[]>(() => {
  const spellNames = Object.fromEntries(
    spellsRaw.value.map(s => [s.id, localizedName(s.name, `#${s.id}`)]),
  )
  const found: KillSpell[] = []

  for (const level of spellLevelsRaw.value) {
    const killEffect = level.effects.find(e => KILL_EFFECT_IDS.has(e.effectId))
    if (!killEffect) continue
    found.push({
      spellId: level.spellId,
      name: spellNames[level.spellId] ?? `Spell ${level.spellId}`,
      chance: killEffect.random && killEffect.random < 100 ? killEffect.random : null,
    })
  }

  return found
})

const formatDropRate = (drop: MonsterDrop): string => {
  const fmt = (n: number) => (n % 1 === 0 ? `${n}%` : `${Number.parseFloat(n.toFixed(2))}%`)

  if (drop.isGlobal && drop.minPercentDrop != null) {
    return drop.minPercentDrop === drop.maxPercentDrop
      ? fmt(drop.minPercentDrop)
      : `${fmt(drop.minPercentDrop)} – ${fmt(drop.maxPercentDrop ?? drop.minPercentDrop)}`
  }

  const grades = [
    drop.percentDropForGrade1,
    drop.percentDropForGrade2,
    drop.percentDropForGrade3,
    drop.percentDropForGrade4,
    drop.percentDropForGrade5,
  ].filter((v): v is number => v != null && v > 0)

  if (!grades.length) return '—'

  const min = Math.min(...grades)
  const max = Math.max(...grades)
  return min === max ? fmt(max) : `${fmt(min)} – ${fmt(max)}`
}

const resistTone = (value: number) => {
  if (!value) return 'text-muted'
  return value > 0 ? 'text-positive' : 'text-negative'
}

const onImgError = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img.dataset.fallbackApplied === '1') return
  img.dataset.fallbackApplied = '1'
  img.src = '/monster-fallback.svg'
}
</script>
