<script setup lang="ts">
// The review queue.
//
// Turning archived captures into a measurement. Every sample here has a crop of
// the price row exactly as the readers saw it and whatever they made of it; the
// job is to say what it actually said. Until enough samples carry a confirmed
// truth, the only thing the corpus can report is whether the two readers
// agreed — and agreement is not correctness, because they share a crop and a
// segmentation and therefore fail together.
//
// Confirming is one click because the common case is "yes, that is right", and
// a review flow that costs more than that is a review flow that never gets done.

interface Reading {
  reader: 'glyph' | 'ocr'
  value: number | null
  text: string
  ms: number
}

interface Sample {
  id: string
  capturedAt: string
  itemName: string
  storedPrice: number | null
  truth: number | null
  agreed: boolean
  error: string
  readings: Reading[]
  profile: { screenWidth: number; screenHeight: number; devicePixelRatio: number }
  stripUrl: string
  tooltipUrl: string
}

const onlyUnreviewed = ref(true)
const samples = ref<Sample[]>([])
const total = ref(0)
const reviewed = ref(0)
const busy = ref('')
const corrections = reactive<Record<string, string>>({})

const load = async () => {
  const response = await $fetch<{ total: number; reviewed: number; samples: Sample[] }>(
    '/api/corpus/samples',
    { query: onlyUnreviewed.value ? { unreviewed: '1' } : {} },
  )
  total.value = response.total
  reviewed.value = response.reviewed
  samples.value = response.samples
}

const setTruth = async (sample: Sample, truth: number | null) => {
  busy.value = sample.id
  try {
    await $fetch(`/api/corpus/${sample.id}/truth`, { method: 'POST', body: { truth } })
    await load()
  } finally {
    busy.value = ''
  }
}

const confirmStored = (sample: Sample) => {
  if (sample.storedPrice === null) return
  void setTruth(sample, sample.storedPrice)
}

const submitCorrection = (sample: Sample) => {
  // Digits only: prices are written with spaces in the French client and it is
  // far easier to retype them the way they look than to strip them by hand.
  const raw = (corrections[sample.id] || '').replace(/[^\d]/g, '')
  if (!raw) return
  void setTruth(sample, Number(raw))
}

const formatKamas = (value: number | null) =>
  value === null ? '—' : value.toLocaleString('fr-FR')

onMounted(load)
watch(onlyUnreviewed, load)
</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-4 p-4">
    <header class="flex flex-col gap-1">
      <h1 class="text-lg font-semibold text-ink">Capture review</h1>
      <p class="text-sm text-subtle">
        Say what each capture actually said. This is what turns the archive into a
        measured error rate — until then it can only report whether two readers
        agreed, and they can agree and both be wrong.
      </p>
      <p class="text-sm text-subtle">
        <strong class="text-ink">{{ reviewed }}</strong> of
        <strong class="text-ink">{{ total }}</strong> confirmed.
      </p>
      <label class="mt-1 flex items-center gap-2 text-sm text-subtle">
        <input v-model="onlyUnreviewed" type="checkbox" class="accent-accent">
        Only show captures I have not confirmed yet
      </label>
    </header>

    <p v-if="!samples.length" class="rounded-md border border-line bg-sunken p-4 text-sm text-subtle">
      Nothing to review. Capture some listings on the HDV first — every capture is
      archived automatically.
    </p>

    <article
      v-for="sample in samples"
      :key="sample.id"
      class="flex flex-col gap-3 rounded-md border border-line bg-sunken p-3"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <span class="text-sm font-medium text-ink">{{ sample.itemName || 'unknown item' }}</span>
        <span class="text-xs text-subtle">
          {{ sample.profile.screenWidth }}×{{ sample.profile.screenHeight }}
          @{{ sample.profile.devicePixelRatio }} · {{ new Date(sample.capturedAt).toLocaleString() }}
        </span>
      </div>

      <!-- The crop at native size and again enlarged: the small one is what the
           reader saw, the big one is what a human can actually check. -->
      <div class="flex flex-col gap-2 overflow-x-auto rounded bg-black/40 p-2">
        <img :src="sample.stripUrl" alt="price strip" class="max-w-full">
        <img
          :src="sample.stripUrl"
          alt="price strip enlarged"
          class="max-w-full"
          style="image-rendering: pixelated; transform-origin: left top; zoom: 3"
        >
      </div>

      <dl class="flex flex-wrap gap-x-6 gap-y-1 text-xs text-subtle">
        <div>
          <dt class="inline">stored:</dt>
          <dd class="inline tabular text-ink">{{ formatKamas(sample.storedPrice) }}</dd>
        </div>
        <div v-for="reading in sample.readings" :key="reading.reader">
          <dt class="inline">{{ reading.reader }}:</dt>
          <dd class="inline tabular">{{ formatKamas(reading.value) }}</dd>
        </div>
        <div v-if="!sample.agreed" class="font-medium text-warning">readers disagreed</div>
        <div v-if="sample.error" class="font-medium text-negative">{{ sample.error }}</div>
        <div v-if="sample.truth !== null" class="font-medium text-positive">
          confirmed {{ formatKamas(sample.truth) }}
        </div>
      </dl>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-if="sample.storedPrice !== null"
          type="button"
          class="rounded border border-line px-2 py-1 text-xs text-ink hover:border-line-strong disabled:opacity-50"
          :disabled="busy === sample.id"
          @click="confirmStored(sample)"
        >
          Correct — it said {{ formatKamas(sample.storedPrice) }}
        </button>

        <span class="text-xs text-subtle">or type what it really said:</span>
        <input
          v-model="corrections[sample.id]"
          inputmode="numeric"
          placeholder="2 750 000"
          class="w-32 rounded border border-line bg-transparent px-2 py-1 text-xs text-ink"
          @keyup.enter="submitCorrection(sample)"
        >
        <button
          type="button"
          class="rounded border border-line px-2 py-1 text-xs text-ink hover:border-line-strong disabled:opacity-50"
          :disabled="busy === sample.id || !corrections[sample.id]"
          @click="submitCorrection(sample)"
        >
          Save
        </button>

        <button
          v-if="sample.truth !== null"
          type="button"
          class="rounded border border-line px-2 py-1 text-xs text-subtle hover:border-line-strong"
          :disabled="busy === sample.id"
          @click="setTruth(sample, null)"
        >
          Undo
        </button>
      </div>
    </article>
  </div>
</template>
