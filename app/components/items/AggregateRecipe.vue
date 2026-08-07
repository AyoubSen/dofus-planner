<script setup lang="ts">
// "Recipe pressure": which resources the top N items of a slot consume most.
export interface AggregateItemRef {
  name: string
  [key: string]: unknown
}

export interface AggregateIngredient {
  id: string | number
  name: string
  image?: string | null
  typeName?: string | null
  level: number | null
  dropMonsterCount: number
  hasRecipe: boolean
  isSpecial: boolean
  items: AggregateItemRef[]
  usageCount: number
  totalQuantity: number
  buildUsageCount: number
  pressureScore: number
}

export interface AggregateResourceFilters {
  hideSpecial: boolean
  onlyMonsterDrops: boolean
  onlyNonCrafted: boolean
  minItemUsage: number
}

defineProps<{
  slotLabel: string
  limit: number
  limits: number[]
  isLoading: boolean
  error: string
  selectedItems: AggregateItemRef[]
  ingredients: AggregateIngredient[]
  sortMode: 'items' | 'quantity'
  filters: AggregateResourceFilters
}>()

const emit = defineEmits<{
  back: []
  'update:limit': [value: number]
  'update:sortMode': [value: 'items' | 'quantity']
  toggleFilter: [key: keyof AggregateResourceFilters]
  openItem: [item: AggregateItemRef]
}>()

const { t } = useI18n()

const limitOptions = (limits: number[]) => limits.map(value => ({ label: String(value), value }))

const sortOptions = computed(() => ([
  { label: t('items.aggregate.sort.items'), value: 'items' },
  { label: t('items.aggregate.sort.qty'), value: 'quantity' },
]))

const filterChips = computed(() => ([
  { key: 'hideSpecial' as const, label: t('items.aggregate.filters.hideSpecial') },
  { key: 'onlyMonsterDrops' as const, label: t('items.aggregate.filters.monsterDrops') },
  { key: 'onlyNonCrafted' as const, label: t('items.aggregate.filters.nonCrafted') },
  { key: 'minItemUsage' as const, label: t('items.aggregate.filters.itemsMinTwo') },
]))

const isFilterOn = (filters: AggregateResourceFilters, key: keyof AggregateResourceFilters) =>
  key === 'minItemUsage' ? filters.minItemUsage === 2 : Boolean(filters[key])

const chipClass = (active: boolean) => [
  'inline-flex h-8 cursor-pointer items-center rounded-md border px-2.5 text-xs transition-colors',
  active
    ? 'border-accent bg-accent-soft text-accent'
    : 'border-line bg-raised text-muted hover:border-line-strong hover:text-ink',
]

const onImgErr = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img.dataset.fb) return
  img.dataset.fb = '1'
  img.src = '/item-fallback.svg'
}
</script>

<template>
  <UiPageSection :title="$t('items.aggregate.pressureTitle', { slot: slotLabel })">
    <template #actions>
      <UiButton variant="ghost" size="sm" @click="emit('back')">
        <template #icon><UiIcon name="chevronLeft" /></template>
        {{ $t('items.detail.common.back') }}
      </UiButton>
      <UiSegmented
        :model-value="limit"
        :options="limitOptions(limits)"
        size="sm"
        :aria-label="$t('items.aggregate.meta', { limit })"
        @update:model-value="emit('update:limit', Number($event))"
      />
    </template>

    <p class="mb-3 text-xs text-subtle">{{ $t('items.aggregate.kicker') }}</p>

    <div v-if="isLoading" class="flex flex-col gap-2">
      <UiSkeleton v-for="i in 5" :key="i" height="4rem" />
    </div>

    <UiEmptyState v-else-if="error" :title="error">
      <template #icon><UiIcon name="alert" /></template>
    </UiEmptyState>

    <template v-else>
      <UiStatRow min="10rem">
        <UiStat :label="$t('items.aggregate.stats.selectedItems')" :value="selectedItems.length" />
        <UiStat :label="$t('items.aggregate.stats.uniqueResources')" :value="ingredients.length" />
        <UiStat
          :label="$t('items.aggregate.stats.metric')"
          :value="sortMode === 'items' ? $t('items.aggregate.sort.itemsFirst') : $t('items.aggregate.sort.qtyFirst')"
        />
      </UiStatRow>

      <UiToolbar class="mt-4">
        <template #filters>
          <span class="text-xs text-subtle">{{ $t('items.aggregate.sort.label') }}</span>
          <UiSegmented
            :model-value="sortMode"
            :options="sortOptions"
            size="sm"
            :aria-label="$t('items.aggregate.sort.label')"
            @update:model-value="emit('update:sortMode', $event as 'items' | 'quantity')"
          />
        </template>
        <template #extra>
          <span class="text-xs text-subtle">{{ $t('items.aggregate.filters.title') }}</span>
          <button
            v-for="chip in filterChips"
            :key="chip.key"
            type="button"
            :class="chipClass(isFilterOn(filters, chip.key))"
            :aria-pressed="isFilterOn(filters, chip.key)"
            @click="emit('toggleFilter', chip.key)"
          >
            {{ chip.label }}
          </button>
        </template>
      </UiToolbar>

      <div v-if="selectedItems.length" class="mb-4 flex flex-wrap items-center gap-1.5">
        <span class="text-xs text-subtle">{{ $t('items.aggregate.selectedItems') }}</span>
        <UiButton
          v-for="item in selectedItems"
          :key="item.name"
          variant="ghost"
          size="sm"
          @click="emit('openItem', item)"
        >
          {{ item.name }}
        </UiButton>
      </div>

      <UiCard :title="$t('items.aggregate.resourcesTitle')">
        <UiEmptyState v-if="!ingredients.length" :title="$t('items.aggregate.noData')">
          <template #icon><UiIcon name="crafting" /></template>
        </UiEmptyState>

        <div v-else class="flex flex-col gap-2">
          <article
            v-for="ingredient in ingredients"
            :key="ingredient.id"
            class="flex flex-wrap items-start gap-3 rounded-md border border-line bg-sunken p-2.5"
          >
            <img
              v-if="ingredient.image"
              :src="ingredient.image"
              :alt="''"
              class="size-9 shrink-0 rounded-md bg-surface object-contain"
              @error="onImgErr"
            >
            <div v-else class="size-9 shrink-0 rounded-md bg-surface" />

            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium text-ink">{{ ingredient.name }}</div>
              <div class="truncate text-xs text-subtle">
                <span v-if="ingredient.typeName">{{ ingredient.typeName }}</span>
                <span v-if="ingredient.level !== null" class="tabular">
                  · {{ $t('items.detail.ingredients.level', { level: ingredient.level }) }}
                </span>
              </div>

              <div class="mt-1.5 flex flex-wrap gap-1">
                <UiBadge v-if="ingredient.dropMonsterCount > 0">
                  {{ $t('items.detail.ingredients.badges.monsterDrop') }}
                </UiBadge>
                <UiBadge v-if="ingredient.hasRecipe" tone="info">
                  {{ $t('items.detail.ingredients.badges.crafted') }}
                </UiBadge>
                <UiBadge v-if="ingredient.isSpecial" tone="warning">
                  {{ $t('items.detail.ingredients.badges.special') }}
                </UiBadge>
              </div>

              <div v-if="ingredient.items.length" class="mt-1.5 flex flex-wrap items-center gap-1">
                <span class="text-xs text-subtle">{{ $t('items.aggregate.usedIn') }}</span>
                <UiButton
                  v-for="item in ingredient.items"
                  :key="item.name"
                  variant="ghost"
                  size="sm"
                  @click="emit('openItem', item)"
                >
                  {{ item.name }}
                </UiButton>
              </div>
            </div>

            <dl class="shrink-0 text-right">
              <dt class="text-xs text-subtle">{{ $t('items.aggregate.itemsLabel') }}</dt>
              <dd class="tabular text-lg font-semibold text-ink">{{ ingredient.usageCount }}</dd>
              <dd class="tabular text-xs text-subtle">{{ $t('items.aggregate.qty', { count: ingredient.totalQuantity }) }}</dd>
              <dd class="tabular text-xs text-subtle">{{ $t('items.aggregate.builds', { count: ingredient.buildUsageCount }) }}</dd>
              <dd class="tabular text-xs text-subtle">{{ $t('items.aggregate.pressure', { count: ingredient.pressureScore }) }}</dd>
            </dl>
          </article>
        </div>
      </UiCard>
    </template>
  </UiPageSection>
</template>
