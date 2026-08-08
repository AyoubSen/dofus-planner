<script setup lang="ts">
// The five equipment filters. These lists are display-only — the page never
// reads them — so they live with the markup that renders them.
const ELEMENTS = [
  { name: 'eau', icon: '/eau.png', short: 'Eau' },
  { name: 'feu', icon: '/feu.png', short: 'Feu' },
  { name: 'terre', icon: '/terre.png', short: 'Ter' },
  { name: 'air', icon: '/air.png', short: 'Air' },
  { name: 'multi', icon: '/multi.png', short: 'Mul' },
  { name: 'tank', icon: '/tank.png', short: 'Tnk' },
  { name: 'doPou', icon: '/doPou.png', short: 'DP' },
  { name: 'pp', icon: '/pp.png', short: 'PP' },
]

const MODES = ['pvm', 'pvp']
const LEVELS = ['20', '40', '60', '80', '110', '130', '160', '180', '199', '200']
const BUDGETS = ['low', 'mid', 'high']

const CLASSES = [
  { name: 'iop', icon: '/Iop.png', short: 'Iop' },
  { name: 'cra', icon: '/Cra.png', short: 'Cra' },
  { name: 'sacrieur', icon: '/Sacrieur.png', short: 'Sac' },
  { name: 'eniripsa', icon: '/Eniripsa.png', short: 'Eni' },
  { name: 'sram', icon: '/Sram.png', short: 'Sra' },
  { name: 'ouginak', icon: '/Ouginak.png', short: 'Oug' },
  { name: 'forgelance', icon: '/Forgelance.png', short: 'For' },
  { name: 'osamodas', icon: '/Osamodas.png', short: 'Osa' },
  { name: 'enutrof', icon: '/Enutrof.png', short: 'Enu' },
  { name: 'ecaflip', icon: '/Ecaflip.png', short: 'Eca' },
  { name: 'steamer', icon: '/Steamer.png', short: 'Ste' },
  { name: 'feca', icon: '/Feca.png', short: 'Fec' },
  { name: 'huppermage', icon: '/Huppermage.png', short: 'Hup' },
  { name: 'zobal', icon: '/Zobal.png', short: 'Zob' },
  { name: 'pandawa', icon: '/Pandawa.png', short: 'Pan' },
  { name: 'eliotrope', icon: '/Eliotrope.png', short: 'Eli' },
  { name: 'sadida', icon: '/Sadida.png', short: 'Sad' },
  { name: 'roublard', icon: '/Roublard.png', short: 'Rou' },
  { name: 'xelor', icon: '/Xelor.png', short: 'Xel' },
]

export interface ItemFilters {
  element: string
  mode: string
  classe: string
  level: string
  budget: string
}

defineProps<{ filters: ItemFilters; collapsed: boolean }>()

const emit = defineEmits<{
  set: [key: keyof ItemFilters, value: string]
  'update:collapsed': [value: boolean]
}>()

// Icons are remote-ish assets; a broken one falls back to a short text label
// rather than leaving a hole in the row.
const elementIconErrors = reactive(new Set<string>())
const classIconErrors = reactive(new Set<string>())

const chipClass = (active: boolean) => [
  'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors',
  active
    ? 'border-accent bg-accent-soft text-accent'
    : 'border-line bg-raised text-muted hover:border-line-strong hover:text-ink',
]
</script>

<template>
  <UiCard
    :title="$t('items.filters.title')"
  >
    <template #actions>
      <UiButton size="sm" @click="emit('update:collapsed', !collapsed)">
        {{ collapsed ? $t('items.filters.showFilters') : $t('items.filters.hideFilters') }}
      </UiButton>
    </template>

    <div v-show="!collapsed" class="flex flex-col gap-3">
      <!-- Element -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="w-20 shrink-0 text-xs font-medium text-subtle">{{ $t('items.filters.elements.title') }}</span>
        <button type="button" :class="chipClass(!filters.element)" @click="emit('set', 'element', '')">
          {{ $t('items.filters.elements.all') }}
        </button>
        <button
          v-for="el in ELEMENTS"
          :key="el.name"
          type="button"
          :class="chipClass(filters.element === el.name)"
          :title="$t('items.filters.elements.' + el.name)"
          @click="emit('set', 'element', el.name)"
        >
          <img
            v-if="!elementIconErrors.has(el.name)"
            :src="el.icon"
            :alt="$t('items.filters.elements.' + el.name)"
            class="size-4 object-contain"
            @error="elementIconErrors.add(el.name)"
          >
          <span v-else>{{ el.short }}</span>
        </button>
      </div>

      <!-- Mode -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="w-20 shrink-0 text-xs font-medium text-subtle">{{ $t('items.filters.mode.title') }}</span>
        <button type="button" :class="chipClass(!filters.mode)" @click="emit('set', 'mode', '')">
          {{ $t('items.filters.mode.all') }}
        </button>
        <button
          v-for="m in MODES"
          :key="m"
          type="button"
          :class="chipClass(filters.mode === m)"
          @click="emit('set', 'mode', m)"
        >
          {{ $t('items.filters.mode.' + m) }}
        </button>
      </div>

      <!-- Level -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="w-20 shrink-0 text-xs font-medium text-subtle">{{ $t('items.filters.level.title') }}</span>
        <button type="button" :class="chipClass(!filters.level)" @click="emit('set', 'level', '')">
          {{ $t('items.filters.level.all') }}
        </button>
        <button
          v-for="lv in LEVELS"
          :key="lv"
          type="button"
          :class="[chipClass(filters.level === lv), 'tabular']"
          @click="emit('set', 'level', lv)"
        >
          {{ lv }}
        </button>
      </div>

      <!-- Budget -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="w-20 shrink-0 text-xs font-medium text-subtle">{{ $t('items.filters.budget.title') }}</span>
        <button type="button" :class="chipClass(!filters.budget)" @click="emit('set', 'budget', '')">
          {{ $t('items.filters.budget.all') }}
        </button>
        <button
          v-for="b in BUDGETS"
          :key="b"
          type="button"
          :class="chipClass(filters.budget === b)"
          @click="emit('set', 'budget', b)"
        >
          {{ $t('items.filters.budget.' + b) }}
        </button>
      </div>

      <!-- Class -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="w-20 shrink-0 text-xs font-medium text-subtle">{{ $t('items.filters.classes.title') }}</span>
        <button type="button" :class="chipClass(!filters.classe)" @click="emit('set', 'classe', '')">
          {{ $t('items.filters.classes.all') }}
        </button>
        <button
          v-for="cl in CLASSES"
          :key="cl.name"
          type="button"
          :class="chipClass(filters.classe === cl.name)"
          :title="cl.name"
          @click="emit('set', 'classe', cl.name)"
        >
          <img
            v-if="!classIconErrors.has(cl.name)"
            :src="cl.icon"
            :alt="cl.name"
            class="size-5 rounded-sm object-cover object-top"
            @error="classIconErrors.add(cl.name)"
          >
          <span v-else>{{ cl.short }}</span>
        </button>
      </div>
    </div>
  </UiCard>
</template>
