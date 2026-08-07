<script setup lang="ts">
// The two help sheets — one for the page, one for the OCR flow inside an
// item's detail. They differ only in copy, so they share one shell.
defineProps<{ open: boolean; mode: 'main' | 'recipe' }>()
defineEmits<{ close: [] }>()

// The example screenshots are optional files under /public; if an install
// doesn't ship them, the card shows the expected path instead of a broken img.
const marketImageVisible = ref(true)
const statsImageVisible = ref(true)

const mainSteps = ['filter', 'slot', 'detail'] as const
const recipeSteps = ['crop', 'framing', 'quality'] as const
</script>

<template>
  <UiModal
    :open="open"
    size="lg"
    :title="mode === 'main' ? $t('items.guide.main.title') : $t('items.guide.recipe.title')"
    @close="$emit('close')"
  >
    <p class="text-xs tracking-wide text-subtle uppercase">{{ $t('items.guide.eyebrow') }}</p>

    <template v-if="mode === 'main'">
      <p class="mt-3 text-sm text-muted">{{ $t('items.guide.main.intro') }}</p>

      <ol class="mt-4 flex flex-col gap-3">
        <li v-for="(step, index) in mainSteps" :key="step" class="flex gap-3">
          <span class="tabular flex size-6 shrink-0 items-center justify-center rounded-md border border-line text-xs text-muted">
            {{ index + 1 }}
          </span>
          <div class="min-w-0">
            <div class="text-sm font-medium text-ink">{{ $t(`items.guide.main.steps.${step}.title`) }}</div>
            <p class="mt-0.5 text-xs text-muted">{{ $t(`items.guide.main.steps.${step}.text`) }}</p>
          </div>
        </li>
      </ol>

      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <UiCard v-for="card in ['overview', 'next']" :key="card">
          <div class="text-sm font-medium text-ink">{{ $t(`items.guide.main.cards.${card}.title`) }}</div>
          <p class="mt-1 text-xs text-muted">{{ $t(`items.guide.main.cards.${card}.text`) }}</p>
        </UiCard>
      </div>
    </template>

    <template v-else>
      <p class="mt-3 text-sm text-muted">{{ $t('items.guide.recipe.intro') }}</p>

      <ol class="mt-4 flex flex-col gap-3">
        <li v-for="(step, index) in recipeSteps" :key="step" class="flex gap-3">
          <span class="tabular flex size-6 shrink-0 items-center justify-center rounded-md border border-line text-xs text-muted">
            {{ index + 1 }}
          </span>
          <div class="min-w-0">
            <div class="text-sm font-medium text-ink">{{ $t(`items.guide.recipe.steps.${step}.title`) }}</div>
            <p class="mt-0.5 text-xs text-muted">{{ $t(`items.guide.recipe.steps.${step}.text`) }}</p>
          </div>
        </li>
      </ol>

      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <UiCard>
          <div class="text-sm font-medium text-ink">{{ $t('items.guide.recipe.cards.market.title') }}</div>
          <p class="mt-1 text-xs text-muted">{{ $t('items.guide.recipe.cards.market.text') }}</p>
          <div class="mt-2 overflow-hidden rounded-md border border-line bg-sunken">
            <img
              v-if="marketImageVisible"
              src="/guide/items-market-example.png"
              :alt="$t('items.guide.recipe.cards.market.title')"
              class="w-full object-contain"
              @error="marketImageVisible = false"
            >
            <div v-else class="flex flex-col gap-1 p-3 text-xs">
              <strong class="text-ink">{{ $t('items.guide.recipe.placeholderTitle') }}</strong>
              <code class="text-subtle">/public/guide/items-market-example.png</code>
            </div>
          </div>
        </UiCard>

        <UiCard>
          <div class="text-sm font-medium text-ink">{{ $t('items.guide.recipe.cards.stats.title') }}</div>
          <p class="mt-1 text-xs text-muted">{{ $t('items.guide.recipe.cards.stats.text') }}</p>
          <div class="mt-2 overflow-hidden rounded-md border border-line bg-sunken">
            <img
              v-if="statsImageVisible"
              src="/guide/items-stats-example.png"
              :alt="$t('items.guide.recipe.cards.stats.title')"
              class="w-full object-contain"
              @error="statsImageVisible = false"
            >
            <div v-else class="flex flex-col gap-1 p-3 text-xs">
              <strong class="text-ink">{{ $t('items.guide.recipe.placeholderTitle') }}</strong>
              <code class="text-subtle">/public/guide/items-stats-example.png</code>
            </div>
          </div>
        </UiCard>
      </div>
    </template>
  </UiModal>
</template>
