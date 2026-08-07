<script setup lang="ts">
// Identity of the opened item, the OCR entry points, and the four-step
// "how a flip gets found" band that sits above the price data.
export interface OcrDebugRow {
  source: string
  raw: string
  tokens: string[]
  candidate: number | null
}

defineProps<{
  item: { name: string; image_url?: string | null; count: number }
  slotLabel: string
  confidence: '' | 'exact' | 'approx'
  source: '' | 'cache' | 'fresh'
  ocr: {
    isLoading: boolean
    error: string
    candidates: number[]
    screenshotDataUrl: string
    debugRows: OcrDebugRow[]
    debugMode: string
  }
  savedPriceCount: number
  formatKamas: (value: number) => string
}>()

defineEmits<{
  back: []
  openGuide: []
  refetch: []
  openOcrPicker: []
  pasteScreenshot: []
  saveOcrPrices: []
  useCandidate: [price: number]
  focusBestBuys: []
}>()

const onImgErr = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img.dataset.fb) return
  img.dataset.fb = '1'
  img.src = '/item-fallback.svg'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <UiButton variant="ghost" size="sm" @click="$emit('back')">
        <template #icon><UiIcon name="chevronLeft" /></template>
        {{ $t('items.detail.common.back') }}
      </UiButton>
      <span class="text-xs tracking-wide text-subtle uppercase">{{ $t('items.recipe.kicker') }}</span>
      <UiButton
        variant="ghost"
        size="sm"
        icon
        class="ml-auto"
        :aria-label="$t('items.guide.openRecipeAria')"
        @click="$emit('openGuide')"
      >
        ?
      </UiButton>
    </div>

    <!-- Identity -->
    <UiCard>
      <div class="flex flex-wrap items-start gap-3">
        <img
          v-if="item.image_url"
          :src="item.image_url"
          :alt="''"
          class="size-12 shrink-0 rounded-md bg-sunken object-contain"
          @error="onImgErr"
        >
        <div v-else class="size-12 shrink-0 rounded-md bg-sunken" />

        <div class="min-w-0 flex-1">
          <h2 class="truncate text-base font-semibold text-ink">{{ item.name }}</h2>
          <p class="tabular truncate text-xs text-subtle">
            {{ slotLabel }} · {{ item.count }} {{ $t('items.uses') }}
          </p>

          <div class="mt-2 flex flex-wrap items-center gap-2">
            <UiButton size="sm" @click="$emit('refetch')">
              {{ $t('items.detail.recipe.actions.refetch') }}
            </UiButton>
            <UiButton size="sm" @click="$emit('openOcrPicker')">
              {{ $t('items.detail.recipe.actions.ocrScreenshot') }}
            </UiButton>
            <UiButton size="sm" @click="$emit('pasteScreenshot')">
              {{ $t('items.detail.recipe.actions.pasteScreenshot') }}
            </UiButton>

            <UiBadge v-if="confidence" :tone="confidence === 'exact' ? 'positive' : 'warning'">
              {{ confidence === 'exact'
                ? $t('items.detail.recipe.confidence.exact')
                : $t('items.detail.recipe.confidence.approx') }}
            </UiBadge>
            <span v-if="source" class="text-xs text-subtle">
              {{ source === 'cache'
                ? $t('items.detail.recipe.source.cache')
                : $t('items.detail.recipe.source.fresh') }}
            </span>
          </div>
        </div>
      </div>
    </UiCard>

    <!-- OCR results -->
    <div v-if="ocr.isLoading" class="flex flex-col gap-2">
      <UiSkeleton v-for="i in 3" :key="i" height="2.5rem" />
    </div>

    <p v-else-if="ocr.error" class="text-xs text-negative">{{ ocr.error }}</p>

    <UiCard v-else-if="ocr.candidates.length" :title="$t('items.detail.ocr.candidatesTitle')">
      <template #actions>
        <span class="text-xs text-subtle">{{ $t('items.detail.ocr.clickHint') }}</span>
        <UiButton v-if="ocr.screenshotDataUrl" size="sm" @click="$emit('saveOcrPrices')">
          {{ $t('items.detail.ocr.save') }}
        </UiButton>
      </template>

      <div class="flex flex-wrap gap-1.5">
        <UiButton
          v-for="(candidate, index) in ocr.candidates"
          :key="`${candidate}-${index}`"
          size="sm"
          @click="$emit('useCandidate', candidate)"
        >
          {{ formatKamas(candidate) }}
        </UiButton>
      </div>

      <div v-if="ocr.debugRows.length" class="mt-4 border-t border-line pt-3">
        <div class="mb-2 flex flex-wrap items-baseline gap-2">
          <span class="text-xs font-medium text-muted">{{ $t('items.detail.ocr.debugTitle') }}</span>
          <span class="text-xs text-subtle">
            {{ $t('items.detail.ocr.mode') }}: {{ ocr.debugMode || $t('items.detail.common.unknown') }}
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <div
            v-for="(row, index) in ocr.debugRows"
            :key="`${row.source}-${index}-${row.raw}`"
            class="grid gap-2 rounded-sm bg-sunken px-2 py-1 text-xs sm:grid-cols-3"
          >
            <span class="truncate text-ink">{{ row.raw || $t('items.detail.common.emptySymbol') }}</span>
            <span class="truncate text-subtle">[{{ row.tokens.join(', ') || $t('items.detail.ocr.noTokens') }}]</span>
            <span class="tabular text-muted">
              {{ row.candidate ? formatKamas(row.candidate) : $t('items.detail.ocr.rejected') }}
            </span>
          </div>
        </div>
      </div>
    </UiCard>

    <!-- How a flip gets found -->
    <UiCard :title="$t('items.detail.flipFlow.title')" :subtitle="$t('items.detail.flipFlow.eyebrow')">
      <template #actions>
        <span class="text-xs text-subtle">
          {{ $t('items.detail.flipFlow.savedCount', { count: savedPriceCount }) }}
        </span>
      </template>

      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          class="rounded-md border border-line bg-sunken p-2.5 text-left transition-colors hover:border-line-strong"
          @click="$emit('openOcrPicker')"
        >
          <div class="text-sm font-medium text-ink">{{ $t('items.detail.flipFlow.scanTitle') }}</div>
          <p class="mt-0.5 text-xs text-subtle">{{ $t('items.detail.flipFlow.scanHint') }}</p>
        </button>
        <button
          type="button"
          class="rounded-md border border-line bg-sunken p-2.5 text-left transition-colors hover:border-line-strong"
          @click="$emit('pasteScreenshot')"
        >
          <div class="text-sm font-medium text-ink">{{ $t('items.detail.flipFlow.pasteTitle') }}</div>
          <p class="mt-0.5 text-xs text-subtle">{{ $t('items.detail.flipFlow.pasteHint') }}</p>
        </button>
        <button
          type="button"
          class="rounded-md border border-line bg-sunken p-2.5 text-left transition-colors hover:border-line-strong"
          @click="$emit('focusBestBuys')"
        >
          <div class="text-sm font-medium text-ink">{{ $t('items.detail.flipFlow.compareTitle') }}</div>
          <p class="mt-0.5 text-xs text-subtle">{{ $t('items.detail.flipFlow.compareHint') }}</p>
        </button>
        <NuxtLink
          to="/resale"
          class="rounded-md border border-line bg-sunken p-2.5 transition-colors hover:border-line-strong"
        >
          <div class="text-sm font-medium text-ink">{{ $t('items.detail.flipFlow.manageTitle') }}</div>
          <p class="mt-0.5 text-xs text-subtle">{{ $t('items.detail.flipFlow.manageHint') }}</p>
        </NuxtLink>
      </div>

      <p class="mt-3 text-xs text-muted">{{ $t('items.detail.flipFlow.rule') }}</p>
    </UiCard>
  </div>
</template>
