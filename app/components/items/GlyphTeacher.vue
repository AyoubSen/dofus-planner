<script setup lang="ts">
// Teaching the reader your client's digits, once.
//
// The reader compares pixels rather than recognising shapes, so it has to be
// shown each digit a single time. After that a "7" is always a 7, because it is
// always the same pixels — which is the whole reason for replacing the OCR that
// could read the same price two different ways.

import {
  emptyAtlas,
  inkMask,
  readLine,
  segmentGlyphs,
  teachGlyph,
  unknownGlyphs,
} from '~/utils/glyphMatch'
import type { GlyphAtlas, GlyphBox } from '~/utils/glyphMatch'
import {
  isAtlasReady,
  loadGlyphAtlas,
  missingDigits,
  saveGlyphAtlas,
} from '~/utils/glyphAtlasStore'

const props = defineProps<{
  /** A price-strip crop to learn from; blank until one has been captured. */
  sample: string
}>()

const { t } = useI18n()

const atlas = ref<GlyphAtlas>(emptyAtlas())
const pending = ref<GlyphBox[]>([])
const thumbnails = ref<string[]>([])
const preview = ref('')
const busy = ref(false)

onMounted(() => {
  atlas.value = loadGlyphAtlas()
})

const ready = computed(() => isAtlasReady(atlas.value))
const missing = computed(() => missingDigits(atlas.value))

/** Pulls the ink mask out of the sample so glyphs can be cut from it. */
const maskFromSample = async () => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('Could not read the sample'))
    element.src = props.sample
  })

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No canvas')

  ctx.drawImage(image, 0, 0)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  return {
    mask: inkMask(data, canvas.width, canvas.height),
    width: canvas.width,
    height: canvas.height,
    canvas,
  }
}

/** Cuts a glyph out for display, scaled up so it can actually be seen. */
const thumbnailFor = (canvas: HTMLCanvasElement, box: GlyphBox) => {
  const scale = 6
  const width = box.x1 - box.x0 + 1
  const height = box.y1 - box.y0 + 1
  const out = document.createElement('canvas')
  out.width = width * scale
  out.height = height * scale
  const ctx = out.getContext('2d')
  if (!ctx) return ''
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(canvas, box.x0, box.y0, width, height, 0, 0, out.width, out.height)
  return out.toDataURL('image/png')
}

const scan = async () => {
  if (!props.sample) return
  busy.value = true

  try {
    const { mask, width, height, canvas } = await maskFromSample()
    const boxes = segmentGlyphs(mask, width, height)
    pending.value = unknownGlyphs(atlas.value, boxes)
    thumbnails.value = pending.value.map((box) => thumbnailFor(canvas, box))
    preview.value = readLine(atlas.value, mask, width, height).text
  } finally {
    busy.value = false
  }
}

watch(() => props.sample, scan, { immediate: true })

const label = (index: number, value: string) => {
  const character = value.trim().slice(0, 1)
  if (!character) return

  atlas.value = teachGlyph(atlas.value, pending.value[index]!.signature, character)
  saveGlyphAtlas(atlas.value)
  scan()
}

const forget = () => {
  atlas.value = emptyAtlas()
  saveGlyphAtlas(atlas.value)
  scan()
}
</script>

<template>
  <UiCard :title="$t('items.detail.glyphs.title')">
    <template #actions>
      <UiBadge :tone="ready ? 'positive' : 'warning'" dot>
        {{ ready
          ? $t('items.detail.glyphs.ready')
          : $t('items.detail.glyphs.missing', { digits: missing.join(' ') }) }}
      </UiBadge>
      <UiButton variant="ghost" size="sm" :disabled="!sample || busy" @click="scan">
        {{ $t('items.detail.glyphs.rescan') }}
      </UiButton>
      <UiButton variant="danger" size="sm" @click="forget">
        {{ $t('items.detail.glyphs.forget') }}
      </UiButton>
    </template>

    <p class="text-xs text-muted">{{ $t('items.detail.glyphs.hint') }}</p>

    <p v-if="!sample" class="mt-2 text-xs text-subtle">
      {{ $t('items.detail.glyphs.noSample') }}
    </p>

    <template v-else>
      <div v-if="preview" class="mt-3">
        <p class="text-xs text-muted">{{ $t('items.detail.glyphs.reads') }}</p>
        <code class="tabular text-lg text-ink">{{ preview }}</code>
      </div>

      <!-- One box per glyph it cannot name. Type the character it shows. -->
      <div v-if="pending.length" class="mt-3">
        <p class="mb-2 text-xs text-warning">
          {{ $t('items.detail.glyphs.teachThese', { count: pending.length }) }}
        </p>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="(box, index) in pending"
            :key="box.signature"
            class="flex flex-col items-center gap-1 rounded-md border border-line bg-sunken p-2"
          >
            <img :src="thumbnails[index]" alt="" class="border border-line" style="image-rendering: pixelated">
            <input
              class="w-12 rounded-sm border border-line bg-surface px-1 py-0.5 text-center text-sm text-ink"
              maxlength="1"
              inputmode="numeric"
              :aria-label="$t('items.detail.glyphs.whatIsThis')"
              @change="label(index, ($event.target as HTMLInputElement).value)"
            >
          </div>
        </div>
      </div>

      <p v-else class="mt-3 text-xs text-positive">
        {{ $t('items.detail.glyphs.allKnown') }}
      </p>
    </template>
  </UiCard>
</template>
