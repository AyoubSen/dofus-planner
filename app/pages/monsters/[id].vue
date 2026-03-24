<template>
  <div class="mdet-page">
    <!-- ── Back link ──────────────────────────────────────────── -->
    <NuxtLink :to="backLink" class="mdet-back">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      {{ $t('monsters.backToList') }}
    </NuxtLink>

    <!-- ── Skeleton ─────────────────────────────────────────── -->
    <template v-if="pending">
      <!-- Hero skeleton -->
      <div class="mdet-hero">
        <div class="mdet-hero__img mdet-skel" />
        <div class="mdet-hero__info" style="gap:.75rem;display:flex;flex-direction:column">
          <div class="mdet-skel" style="width:60px;height:12px;border-radius:4px" />
          <div class="mdet-skel" style="width:55%;height:32px;border-radius:8px" />
          <div class="mdet-skel" style="width:35%;height:14px;border-radius:4px" />
          <div style="display:flex;gap:.5rem;margin-top:.25rem">
            <div class="mdet-skel" style="width:60px;height:24px;border-radius:999px" />
            <div class="mdet-skel" style="width:80px;height:24px;border-radius:999px" />
          </div>
        </div>
      </div>

      <!-- Stats strip skeleton -->
      <div class="mdet-stats">
        <div v-for="i in 4" :key="i" class="mdet-stat">
          <div class="mdet-skel" style="width:36px;height:36px;border-radius:10px;flex-shrink:0" />
          <div style="flex:1;display:flex;flex-direction:column;gap:.4rem">
            <div class="mdet-skel" style="width:50%;height:22px;border-radius:6px" />
            <div class="mdet-skel" style="width:70%;height:11px;border-radius:4px" />
          </div>
        </div>
      </div>

      <!-- Panels skeleton -->
      <div class="mdet-panels">
        <div v-for="i in 3" :key="i" class="mdet-panel">
          <div class="mdet-panel__head mdet-skel-head">
            <div class="mdet-skel" style="width:120px;height:14px;border-radius:4px" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;padding:.75rem">
            <div v-for="j in 5" :key="j" class="mdet-skel" style="height:34px;border-radius:8px" />
          </div>
        </div>
        <div class="mdet-panel mdet-panel--wide">
          <div class="mdet-panel__head mdet-skel-head">
            <div class="mdet-skel" style="width:80px;height:14px;border-radius:4px" />
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;padding:.75rem">
            <div v-for="j in 4" :key="j" class="mdet-skel" style="height:34px;border-radius:8px" />
          </div>
        </div>
      </div>
    </template>

    <!-- ── Error ─────────────────────────────────────────────── -->
    <div v-else-if="error || !monster" class="mdet-state mdet-state--error">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:.35">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <h1>{{ $t('monsters.detail.errorTitle') }}</h1>
      <p>{{ $t('monsters.detail.errorDescription') }}</p>
    </div>

    <template v-else>
      <!-- ── Hero ────────────────────────────────────────────── -->
      <div class="mdet-hero">
        <div class="mdet-hero__img">
          <img
            :src="monster.img || '/monster-fallback.svg'"
            :alt="monster.name?.fr || monster.name?.en || `Monster ${monster.id}`"
            @error="onImgError"
          />
        </div>
        <div class="mdet-hero__info">
          <div class="mdet-hero__kicker">ID {{ monster.id }}</div>
          <h1 class="mdet-hero__name">{{ monster.name?.fr || monster.name?.en }}</h1>
          <p v-if="monster.slug?.fr" class="mdet-hero__slug">{{ monster.slug.fr }}</p>
          <div class="mdet-hero__badges">
            <span v-if="monster.isBoss" class="mdet-badge mdet-badge--boss">{{ $t('monsters.badges.boss') }}</span>
            <span v-if="monster.isMiniBoss" class="mdet-badge mdet-badge--mini">{{ $t('monsters.badges.miniBoss') }}</span>
            <span v-if="monster.isQuestMonster" class="mdet-badge mdet-badge--quest">{{ $t('monsters.badges.quest') }}</span>
            <span v-for="tag in monster.tags?.slice(0, 4)" :key="tag" class="mdet-tag">{{ tag }}</span>
          </div>
        </div>
      </div>

      <!-- ── Subareas ──────────────────────────────────────── -->
      <div v-if="subareas?.length" class="mdet-zones">
        <div class="mdet-zones__label">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Found in
        </div>
        <div class="mdet-zones__list">
          <div v-for="zone in subareas" :key="zone.id" class="mdet-zone-card">
            <div class="mdet-zone-card__name">{{ zone.name?.fr || zone.name?.en }}</div>
            <div class="mdet-zone-card__meta">
              <span class="mdet-zone-card__level">Lv. {{ zone.level }}</span>
              <span v-if="zone.dungeonId > 0" class="mdet-zone-card__dungeon">Donjon</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Kill-spell warning ────────────────────────────── -->
      <div v-if="killSpells.length" class="mdet-kill-banner">
        <div class="mdet-kill-banner__icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div class="mdet-kill-banner__body">
          <span class="mdet-kill-banner__title">Instant-kill spells</span>
          <span class="mdet-kill-banner__desc">
            <span v-for="(ks, i) in killSpells" :key="ks.spellId">
              <strong>{{ ks.name }}</strong>
              <span v-if="ks.chance !== null"> ({{ Math.round(ks.chance) }}% chance)</span>
              <span v-if="i < killSpells.length - 1">, </span>
            </span>
          </span>
        </div>
      </div>

      <!-- ── Key stats strip ───────────────────────────────── -->
      <div class="mdet-stats">
        <div class="mdet-stat">
          <div class="mdet-stat__icon" style="background:rgba(245,158,11,.1);color:#f59e0b">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="mdet-stat__body">
            <div class="mdet-stat__val">{{ primaryGrade?.level ?? '—' }}</div>
            <div class="mdet-stat__lbl">{{ $t('monsters.detail.mainLevel') }}</div>
          </div>
        </div>
        <div class="mdet-stat">
          <div class="mdet-stat__icon" style="background:rgba(248,113,113,.1);color:#f87171">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div class="mdet-stat__body">
            <div class="mdet-stat__val">{{ primaryGrade?.lifePoints ?? '—' }}</div>
            <div class="mdet-stat__lbl">{{ $t('monsters.detail.lifePoints') }}</div>
          </div>
        </div>
        <div class="mdet-stat">
          <div class="mdet-stat__icon" style="background:rgba(96,165,250,.1);color:#60a5fa">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div class="mdet-stat__body">
            <div class="mdet-stat__val">
              {{ primaryGrade?.actionPoints ?? '—' }}<span class="mdet-stat__sep">/</span>{{ primaryGrade?.movementPoints ?? '—' }}
            </div>
            <div class="mdet-stat__lbl">{{ $t('monsters.detail.apMp') }}</div>
          </div>
        </div>
        <div class="mdet-stat">
          <div class="mdet-stat__icon" style="background:rgba(52,211,153,.1);color:#34d399">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div class="mdet-stat__body">
            <div class="mdet-stat__val">{{ monster.spells?.length ?? 0 }}</div>
            <div class="mdet-stat__lbl">{{ $t('monsters.detail.spells') }}</div>
          </div>
        </div>
      </div>

      <!-- ── Panels ─────────────────────────────────────────── -->
      <div class="mdet-panels">
        <!-- Characteristics -->
        <div class="mdet-panel">
          <div class="mdet-panel__head">{{ $t('monsters.detail.characteristics') }}</div>
          <div class="mdet-table">
            <div class="mdet-row">
              <span>{{ $t('monsters.detail.strength') }}</span>
              <strong>{{ primaryGrade?.strength ?? 0 }}</strong>
            </div>
            <div class="mdet-row">
              <span>{{ $t('monsters.detail.intelligence') }}</span>
              <strong>{{ primaryGrade?.intelligence ?? 0 }}</strong>
            </div>
            <div class="mdet-row">
              <span>{{ $t('monsters.detail.chance') }}</span>
              <strong>{{ primaryGrade?.chance ?? 0 }}</strong>
            </div>
            <div class="mdet-row">
              <span>{{ $t('monsters.detail.agility') }}</span>
              <strong>{{ primaryGrade?.agility ?? 0 }}</strong>
            </div>
            <div class="mdet-row">
              <span>{{ $t('monsters.detail.wisdom') }}</span>
              <strong>{{ primaryGrade?.wisdom ?? 0 }}</strong>
            </div>
          </div>
        </div>

        <!-- Resistances -->
        <div class="mdet-panel">
          <div class="mdet-panel__head">{{ $t('monsters.detail.resistances') }}</div>
          <div class="mdet-table">
            <div class="mdet-row">
              <span class="mdet-elem">
                <span class="mdet-elem__dot" style="background:#9ca3af" />
                {{ $t('monsters.detail.neutral') }}
              </span>
              <strong :class="resistClass(primaryGrade?.neutralResistance)">{{ primaryGrade?.neutralResistance ?? 0 }}%</strong>
            </div>
            <div class="mdet-row">
              <span class="mdet-elem">
                <span class="mdet-elem__dot" style="background:#b45309" />
                {{ $t('monsters.detail.earth') }}
              </span>
              <strong :class="resistClass(primaryGrade?.earthResistance)">{{ primaryGrade?.earthResistance ?? 0 }}%</strong>
            </div>
            <div class="mdet-row">
              <span class="mdet-elem">
                <span class="mdet-elem__dot" style="background:#ef4444" />
                {{ $t('monsters.detail.fire') }}
              </span>
              <strong :class="resistClass(primaryGrade?.fireResistance)">{{ primaryGrade?.fireResistance ?? 0 }}%</strong>
            </div>
            <div class="mdet-row">
              <span class="mdet-elem">
                <span class="mdet-elem__dot" style="background:#3b82f6" />
                {{ $t('monsters.detail.water') }}
              </span>
              <strong :class="resistClass(primaryGrade?.waterResistance)">{{ primaryGrade?.waterResistance ?? 0 }}%</strong>
            </div>
            <div class="mdet-row">
              <span class="mdet-elem">
                <span class="mdet-elem__dot" style="background:#22c55e" />
                {{ $t('monsters.detail.air') }}
              </span>
              <strong :class="resistClass(primaryGrade?.airResistance)">{{ primaryGrade?.airResistance ?? 0 }}%</strong>
            </div>
          </div>
        </div>

        <!-- Drops -->
        <div class="mdet-panel mdet-panel--wide">
          <div class="mdet-panel__head">
            {{ $t('monsters.detail.drops') }}
            <span class="mdet-count-badge">{{ monster.drops?.length ?? 0 }}</span>
          </div>
          <div v-if="monster.drops?.length" class="mdet-drop-table">
            <div class="mdet-drop-head">
              <span>Item</span>
              <span>Drop rate</span>
            </div>
            <div
              v-for="drop in monster.drops"
              :key="`${drop.objectId}-${drop.alterationId}`"
              class="mdet-row"
            >
              <span class="mdet-drop-name">
                <span v-if="dropItemNames?.[drop.objectId]">{{ dropItemNames[drop.objectId] }}</span>
                <span v-else class="mdet-drop-id">{{ $t('monsters.detail.objectId', { id: drop.objectId }) }}</span>
                <span v-if="drop.hasCriterions" class="mdet-drop-cond" title="Drop has conditions">cond.</span>
              </span>
              <strong class="mdet-drop-rate">{{ formatDropRate(drop) }}</strong>
            </div>
          </div>
          <p v-else class="mdet-muted">{{ $t('monsters.detail.noDrops') }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'v2' })

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
  name?: { fr?: string; en?: string }
  slug?: { fr?: string; en?: string }
}


const localePath = useLocalePath()
const route = useRoute()

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
  () =>
    $fetch(`/api/dofusdb/monsters/${monsterId.value}`, {
      query: { lang: 'fr' },
    }),
  {
    watch: [monsterId],
    lazy: true,
  }
)

const primaryGrade = computed(() => monster.value?.grades?.[0] ?? null)

// ── Types for secondary data ──────────────────────────────────
type SubareaData = {
  id: number
  level: number
  dungeonId: number
  name?: { fr?: string; en?: string }
}
type SpellData = { id: number; spellLevels: number[]; name?: { fr?: string } }
type SpellLevelEffect = { effectId: number; random?: number }
type SpellLevelData = { id: number; spellId: number; effects: SpellLevelEffect[] }
type KillSpell = { spellId: number; name: string; chance: number | null }

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

    // Fetch subareas, drop item names and spells in parallel
    const [subareasRes, dropsRes, spellsRes] = await Promise.all([
      // Subareas
      (async () => {
        const ids = mon.subareas ?? []
        if (!ids.length) return []
        try {
          const res = await $fetch<{ data: SubareaData[] }>('/api/dofusdb/subareas', {
            query: { 'id[]': ids, lang: 'fr', '$limit': 20 },
          })
          return res.data
        } catch { return [] }
      })(),
      // Drop item names
      (async () => {
        const ids = [...new Set(mon.drops?.map(d => d.objectId) ?? [])]
        if (!ids.length) return {}
        try {
          const query: Record<string, unknown> = { '$limit': ids.length + 5, lang: 'fr' }
          ids.forEach((id, i) => { query[`id[$in][${i}]`] = id })
          const res = await $fetch<{ data: Array<{ id: number; name?: { fr?: string; en?: string } }> }>(
            '/api/dofusdb/items', { query }
          )
          return Object.fromEntries(
            res.data.map(item => [item.id, item.name?.fr || item.name?.en || `#${item.id}`])
          )
        } catch { return {} }
      })(),
      // Spells
      (async () => {
        const ids = mon.spells ?? []
        if (!ids.length) return []
        try {
          const query: Record<string, unknown> = { '$limit': ids.length + 5, lang: 'fr' }
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
        const query: Record<string, unknown> = { '$limit': levelIds.length + 5, lang: 'fr' }
        levelIds.forEach((id, i) => { query[`id[$in][${i}]`] = id })
        const res = await $fetch<{ data: SpellLevelData[] }>('/api/dofusdb/spell-levels', { query })
        spellLevelsRaw.value = res.data
      } catch { spellLevelsRaw.value = [] }
    } else {
      spellLevelsRaw.value = []
    }
  },
  { immediate: true }
)

// ── Kill-spell detection ──────────────────────────────────────
const killSpells = computed<KillSpell[]>(() => {
  const levels = spellLevelsRaw.value
  const spellNames = Object.fromEntries(spellsRaw.value.map(s => [s.id, s.name?.fr ?? `#${s.id}`]))
  const found: KillSpell[] = []

  for (const level of levels) {
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

// ── Drop rate helpers ─────────────────────────────────────────
const formatDropRate = (drop: MonsterDrop): string => {
  if (drop.isGlobal && drop.minPercentDrop != null) {
    const fmt = (n: number) => `${n}%`
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

  const fmt = (n: number) => n % 1 === 0 ? `${n}%` : `${parseFloat(n.toFixed(2))}%`
  const min = Math.min(...grades)
  const max = Math.max(...grades)
  return min === max ? fmt(max) : `${fmt(min)} – ${fmt(max)}`
}

// ── Resistance class ──────────────────────────────────────────
const resistClass = (val?: number) => {
  if (!val) return 'mdet-val--neutral'
  if (val > 0) return 'mdet-val--pos'
  return 'mdet-val--neg'
}

const onImgError = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img.dataset.fallbackApplied === '1') return
  img.dataset.fallbackApplied = '1'
  img.src = '/monster-fallback.svg'
}
</script>

<style scoped>
.mdet-page {
  display: flex;
  flex-direction: column;
  gap: .875rem;
}

/* ── Back link ───────────────────────────────────────────── */
.mdet-back {
  display: inline-flex;
  align-items: center;
  gap: .375rem;
  width: fit-content;
  text-decoration: none;
  color: var(--v2-accent);
  font-size: .875rem;
  font-weight: 600;
  opacity: .8;
  transition: opacity .15s;
}
.mdet-back:hover { opacity: 1; }

/* ── States ──────────────────────────────────────────────── */
.mdet-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .6rem;
  min-height: 260px;
  padding: 3rem 1.5rem;
  text-align: center;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 16px;
  color: var(--v2-text-secondary);
}
.mdet-state h1 { font-size: 1.125rem; font-weight: 700; color: var(--v2-text); margin-top: .25rem; }
.mdet-state p { font-size: .875rem; }
.mdet-state--error { color: #fca5a5; }
.mdet-state--error h1 { color: #fca5a5; }

/* ── Hero ────────────────────────────────────────────────── */
.mdet-hero {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.25rem;
  padding: 1.25rem;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 16px;
}
.mdet-hero__img {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  border-radius: 12px;
  background: rgba(0, 0, 0, .18);
}
.mdet-hero__img img {
  width: 100%;
  max-width: 180px;
  height: auto;
  object-fit: contain;
}
.mdet-hero__kicker {
  font-size: .6875rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--v2-text-dim);
}
.mdet-hero__name {
  margin-top: .25rem;
  font-size: 1.875rem;
  font-weight: 800;
  color: var(--v2-text);
  letter-spacing: -.02em;
  line-height: 1.1;
}
.mdet-hero__slug {
  margin-top: .2rem;
  font-size: .875rem;
  color: var(--v2-text-secondary);
}
.mdet-hero__badges {
  display: flex;
  flex-wrap: wrap;
  gap: .375rem;
  margin-top: .875rem;
}
.mdet-badge, .mdet-tag {
  padding: .25rem .6rem;
  border-radius: 999px;
  font-size: .72rem;
  font-weight: 600;
}
.mdet-badge--boss {
  background: rgba(248, 113, 113, .14);
  color: #fca5a5;
  border: 1px solid rgba(248, 113, 113, .25);
}
.mdet-badge--mini {
  background: rgba(250, 204, 21, .12);
  color: #fde68a;
  border: 1px solid rgba(250, 204, 21, .2);
}
.mdet-badge--quest {
  background: rgba(96, 165, 250, .12);
  color: #93c5fd;
  border: 1px solid rgba(96, 165, 250, .2);
}
.mdet-tag {
  background: var(--v2-active);
  color: var(--v2-text-secondary);
  border: 1px solid var(--v2-border);
}

/* ── Subareas ────────────────────────────────────────────── */
.mdet-zones {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: .75rem 1.125rem;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  flex-wrap: wrap;
}
.mdet-zones__label {
  display: flex;
  align-items: center;
  gap: .375rem;
  font-size: .6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--v2-text-dim);
  white-space: nowrap;
  flex-shrink: 0;
}
.mdet-zones__list {
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
}
.mdet-zone-card {
  display: flex;
  align-items: center;
  gap: .625rem;
  padding: .4rem .75rem;
  border-radius: 10px;
  background: rgba(0, 0, 0, .18);
  border: 1px solid var(--v2-border);
}
.mdet-zone-card__name {
  font-size: .875rem;
  font-weight: 600;
  color: var(--v2-text);
}
.mdet-zone-card__meta {
  display: flex;
  align-items: center;
  gap: .375rem;
}
.mdet-zone-card__level {
  font-size: .75rem;
  color: var(--v2-text-dim);
}
.mdet-zone-card__dungeon {
  padding: .1rem .4rem;
  border-radius: 999px;
  font-size: .65rem;
  font-weight: 700;
  background: rgba(167, 139, 250, .12);
  color: #c4b5fd;
  border: 1px solid rgba(167, 139, 250, .22);
}

/* ── Kill-spell banner ───────────────────────────────────── */
.mdet-kill-banner {
  display: flex;
  align-items: center;
  gap: .875rem;
  padding: .875rem 1.125rem;
  border-radius: 14px;
  background: rgba(239, 68, 68, .08);
  border: 1px solid rgba(239, 68, 68, .28);
}
.mdet-kill-banner__icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(239, 68, 68, .14);
  color: #f87171;
}
.mdet-kill-banner__body {
  display: flex;
  flex-direction: column;
  gap: .2rem;
}
.mdet-kill-banner__title {
  font-size: .75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #f87171;
}
.mdet-kill-banner__desc {
  font-size: .875rem;
  color: var(--v2-text-secondary);
}
.mdet-kill-banner__desc strong {
  color: var(--v2-text);
  font-weight: 600;
}

/* ── Stats strip ─────────────────────────────────────────── */
.mdet-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: .75rem;
}
.mdet-stat {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .875rem 1rem;
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px;
}
.mdet-stat__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mdet-stat__body { flex: 1; min-width: 0; }
.mdet-stat__val {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--v2-text);
  line-height: 1;
  letter-spacing: -.02em;
}
.mdet-stat__sep {
  font-size: .875rem;
  font-weight: 400;
  color: var(--v2-text-dim);
  margin: 0 .1rem;
}
.mdet-stat__lbl {
  font-size: .6875rem;
  color: var(--v2-text-secondary);
  margin-top: .25rem;
  text-transform: uppercase;
  letter-spacing: .04em;
}

/* ── Panels ──────────────────────────────────────────────── */
.mdet-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .875rem;
}
.mdet-panel {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  overflow: hidden;
}
.mdet-panel--wide {
  grid-column: 1 / -1;
}
.mdet-panel__head {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .75rem 1rem;
  font-size: .875rem;
  font-weight: 700;
  color: var(--v2-text-hover);
  border-bottom: 1px solid var(--v2-border-subtle);
}
.mdet-count-badge {
  padding: .1rem .45rem;
  border-radius: 999px;
  background: var(--v2-active);
  color: var(--v2-accent);
  font-size: .6875rem;
  font-weight: 600;
}

/* ── Table rows ──────────────────────────────────────────── */
.mdet-table {
  display: flex;
  flex-direction: column;
  padding: .5rem;
  gap: 2px;
}
.mdet-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .75rem;
  padding: .5rem .625rem;
  border-radius: 8px;
  transition: background .12s;
}
.mdet-row:hover { background: rgba(0, 0, 0, .14); }
.mdet-row span { font-size: .875rem; color: var(--v2-text-secondary); }
.mdet-row strong { font-size: .875rem; color: var(--v2-text); font-weight: 600; }

/* Resistance coloring */
.mdet-val--pos { color: #34d399 !important; }
.mdet-val--neg { color: #f87171 !important; }
.mdet-val--neutral { color: var(--v2-text-dim) !important; }

/* Element dots */
.mdet-elem {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.mdet-elem__dot {
  width: 8px;
  height: 8px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* ── Drops ───────────────────────────────────────────────── */
.mdet-drop-table {
  display: flex;
  flex-direction: column;
  padding: .5rem;
  gap: 2px;
}
.mdet-drop-head {
  display: flex;
  justify-content: space-between;
  padding: .25rem .625rem;
  font-size: .6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--v2-text-dim);
}
.mdet-drop-name {
  display: flex;
  align-items: center;
  gap: .4rem;
  font-size: .875rem;
  color: var(--v2-text);
  font-weight: 500;
}
.mdet-drop-id { color: var(--v2-text-secondary); font-weight: 400; }
.mdet-drop-cond {
  padding: .1rem .4rem;
  border-radius: 999px;
  font-size: .65rem;
  font-weight: 600;
  background: rgba(251, 191, 36, .1);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, .2);
  white-space: nowrap;
}
.mdet-drop-rate { font-size: .875rem; color: var(--v2-accent); font-weight: 600; }
.mdet-muted {
  padding: 1.5rem 1rem;
  font-size: .875rem;
  color: var(--v2-text-dim);
  text-align: center;
}

/* ── Skeletons ────────────────────────────────────────────── */
.mdet-skel {
  background: linear-gradient(
    90deg,
    var(--v2-active) 25%,
    var(--v2-border-subtle) 50%,
    var(--v2-active) 75%
  );
  background-size: 200% 100%;
  animation: mdet-shimmer 1.4s ease infinite;
}
.mdet-skel-head {
  background: transparent;
}
@keyframes mdet-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 900px) {
  .mdet-hero { grid-template-columns: 1fr; }
  .mdet-hero__img { min-height: 160px; }
  .mdet-stats { grid-template-columns: repeat(2, 1fr); }
  .mdet-panels { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .mdet-stats { grid-template-columns: repeat(2, 1fr); }
  .mdet-hero__name { font-size: 1.5rem; }
}
</style>
