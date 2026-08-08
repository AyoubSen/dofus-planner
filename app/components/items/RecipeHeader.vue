<script setup lang="ts">
// Identity of the opened item, and the one control that turns a screenshot
// into saved prices.
defineProps<{
  item: { name: string; image_url?: string | null; count: number }
  slotLabel: string
  confidence: '' | 'exact' | 'approx'
  source: '' | 'cache' | 'fresh'
  ocrLoading: boolean
  ocrError: string
  savedPriceCount: number
}>()

defineEmits<{
  back: []
  refetch: []
  image: [dataUrl: string]
}>()

const onImgErr = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img.dataset.fb) return
  img.dataset.fb = '1'
  img.src = '/item-fallback.svg'
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-3">
      <UiButton variant="ghost" size="sm" @click="$emit('back')">
        <template #icon><UiIcon name="chevronLeft" /></template>
        {{ $t('items.detail.common.back') }}
      </UiButton>

      <img
        v-if="item.image_url"
        :src="item.image_url"
        :alt="''"
        class="size-9 shrink-0 rounded-md bg-sunken object-contain"
        @error="onImgErr"
      >
      <div v-else class="size-9 shrink-0 rounded-md bg-sunken" />

      <!-- basis-56: with a bare flex-1 (0% basis) this column never forces the
           row to wrap, so on a phone the item name collapsed to "G…". -->
      <div class="min-w-0 flex-1 basis-56">
        <h2 class="truncate text-base font-semibold text-ink">{{ item.name }}</h2>
        <p class="tabular truncate text-xs text-subtle">
          {{ slotLabel }} · {{ item.count }} {{ $t('items.uses') }}
          <span v-if="savedPriceCount">· {{ $t('items.detail.observed.savedCount', { count: savedPriceCount }) }}</span>
        </p>
      </div>

      <UiBadge v-if="confidence" :tone="confidence === 'exact' ? 'positive' : 'warning'">
        {{ confidence === 'exact'
          ? $t('items.detail.recipe.confidence.exact')
          : $t('items.detail.recipe.confidence.approx') }}
      </UiBadge>
      <UiButton size="sm" @click="$emit('refetch')">
        {{ $t('items.detail.recipe.actions.refetch') }}
      </UiButton>
    </div>

    <UiDropZone
      :label="$t('items.detail.capture.prices')"
      :hint="$t('items.detail.capture.pricesHint')"
      :loading="ocrLoading"
      @image="$emit('image', $event)"
    />

    <p v-if="ocrError" class="text-xs text-negative">{{ ocrError }}</p>
  </div>
</template>
