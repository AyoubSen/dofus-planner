<script setup lang="ts">
// The in-game capture loop, controlled from the app.
//
// Arm it, then stay in Dofus: every hotkey press lands here as a complete
// listing and answers with a verdict the companion shows over the game. The
// calibration step exists because the companion needs to know where the price
// and the tooltip sit on screen, and dragging two boxes over a screenshot is a
// great deal easier than working out pixel coordinates by hand.

const props = defineProps<{
  armed: boolean
  /** Most recent verdicts, newest first, so a missed toast is recoverable. */
  log: Array<{ id: string; at: string; cursor?: { x: number; y: number }; verdict: any }>
  error: string
  itemName: string
  /** What the server reports it is armed on. Blank means captures will bounce. */
  armedItem: string
}>()

const emit = defineEmits<{
  'update:armed': [value: boolean]
}>()

const { t } = useI18n()

const expanded = ref(false)
const openRow = ref('')
const frame = ref('')
const regions = ref<{ price: any; stats: any; calibrated: boolean } | null>(null)
const calibrationTarget = ref<'price' | 'stats' | ''>('')
const saveState = ref<{ message: string; tone: 'good' | 'bad' | '' }>({ message: '', tone: '' })

/** Rectangles in natural image pixels, which is what the companion needs. */
const draft = ref<{ price: any; stats: any }>({ price: null, stats: null })
const dragStart = ref<{ x: number; y: number } | null>(null)
const dragCurrent = ref<{ x: number; y: number } | null>(null)
const frameEl = ref<HTMLImageElement | null>(null)

const loadRegions = async () => {
  try {
    regions.value = await $fetch('/api/capture/regions')
    if (regions.value?.price) draft.value.price = regions.value.price
    if (regions.value?.stats) draft.value.stats = regions.value.stats
  } catch {
    regions.value = null
  }
}

const cursor = ref<{ x: number; y: number } | null>(null)

const loadFrame = async () => {
  try {
    const response = await $fetch<{ frame: string; cursor: { x: number; y: number } | null }>('/api/capture/frame')
    frame.value = response.frame || ''
    cursor.value = response.cursor || null
  } catch {
    frame.value = ''
    cursor.value = null
  }
}

onMounted(() => {
  loadRegions()
  loadFrame()
})

/** Screen pixels per displayed pixel — the image is scaled down to fit. */
const scale = () => {
  const el = frameEl.value
  if (!el || !el.naturalWidth) return 1
  return el.naturalWidth / el.clientWidth
}

const toImageSpace = (event: MouseEvent) => {
  const el = frameEl.value
  if (!el) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  const factor = scale()
  return {
    x: Math.round((event.clientX - rect.left) * factor),
    y: Math.round((event.clientY - rect.top) * factor),
  }
}

const startDrag = (event: MouseEvent) => {
  if (!calibrationTarget.value) return
  event.preventDefault()
  dragStart.value = toImageSpace(event)
  dragCurrent.value = dragStart.value
}

const moveDrag = (event: MouseEvent) => {
  if (!dragStart.value) return
  dragCurrent.value = toImageSpace(event)
}

const endDrag = () => {
  if (!dragStart.value || !dragCurrent.value || !calibrationTarget.value) return

  const rect = {
    x: Math.min(dragStart.value.x, dragCurrent.value.x),
    y: Math.min(dragStart.value.y, dragCurrent.value.y),
    width: Math.abs(dragCurrent.value.x - dragStart.value.x),
    height: Math.abs(dragCurrent.value.y - dragStart.value.y),
  }

  // A stray click is a zero-sized box; ignore it rather than saving a region
  // that would capture nothing.
  if (rect.width > 4 && rect.height > 4) {
    // X stays absolute because the price column never moves; Y is stored as an
    // offset because the row does. Anchoring both to the cursor made the box
    // slide off the price whenever the pointer sat left of it.
    const anchored = cursor.value
      ? { ...rect, y: rect.y - cursor.value.y, anchorX: 'screen' as const, anchorY: 'cursor' as const }
      : { ...rect, anchorX: 'screen' as const, anchorY: 'screen' as const }
    draft.value = { ...draft.value, [calibrationTarget.value]: anchored }
  }

  dragStart.value = null
  dragCurrent.value = null
  calibrationTarget.value = ''
}

/** The live drag, or a saved box, positioned in displayed pixels. */
const boxStyle = (rect: any) => {
  if (!rect) return { display: 'none' }
  const factor = scale() || 1
  const offsetX = rect.anchorX === 'cursor' && cursor.value ? cursor.value.x : 0
  const offsetY = rect.anchorY === 'cursor' && cursor.value ? cursor.value.y : 0
  return {
    left: `${(rect.x + offsetX) / factor}px`,
    top: `${(rect.y + offsetY) / factor}px`,
    width: `${rect.width / factor}px`,
    height: `${rect.height / factor}px`,
  }
}

const dragRect = computed(() => {
  if (!dragStart.value || !dragCurrent.value) return null
  return {
    x: Math.min(dragStart.value.x, dragCurrent.value.x),
    y: Math.min(dragStart.value.y, dragCurrent.value.y),
    width: Math.abs(dragCurrent.value.x - dragStart.value.x),
    height: Math.abs(dragCurrent.value.y - dragStart.value.y),
  }
})

const canSave = computed(() => Boolean(draft.value.price && draft.value.stats))

const saveRegions = async () => {
  try {
    regions.value = await $fetch('/api/capture/regions', {
      method: 'POST',
      body: { price: draft.value.price, stats: draft.value.stats },
    })
    saveState.value = { message: t('items.detail.liveCapture.saved'), tone: 'good' }
  } catch {
    saveState.value = { message: t('items.detail.liveCapture.saveFailed'), tone: 'bad' }
  }
}

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString()
</script>

<template>
  <UiCard :title="$t('items.detail.liveCapture.title')">
    <template #actions>
      <UiBadge :tone="armed ? 'positive' : 'neutral'" dot>
        {{ armed ? $t('items.detail.liveCapture.armed') : $t('items.detail.liveCapture.idle') }}
      </UiBadge>
      <UiButton
        size="sm"
        :variant="armed ? 'danger' : 'primary'"
        :disabled="!itemName"
        @click="emit('update:armed', !armed)"
      >
        {{ armed ? $t('items.detail.liveCapture.disarm') : $t('items.detail.liveCapture.arm') }}
      </UiButton>
      <UiButton variant="ghost" size="sm" @click="expanded = !expanded">
        {{ expanded ? $t('items.detail.common.collapse') : $t('items.detail.liveCapture.setup') }}
      </UiButton>
    </template>

    <p class="text-xs text-muted">
      {{ itemName
        ? $t('items.detail.liveCapture.hint', { item: itemName })
        : $t('items.detail.liveCapture.needItem') }}
    </p>
    <p v-if="error" class="mt-1 text-xs text-negative">{{ error }}</p>

    <!-- Show what the server is armed on, not what the page thinks. The two
         drifting apart is what produced "NO ITEM" with the item plainly open. -->
    <p class="mt-1 text-xs" :class="armedItem ? 'text-subtle' : 'text-warning'">
      {{ armedItem
        ? $t('items.detail.liveCapture.serverArmed', { item: armedItem })
        : $t('items.detail.liveCapture.serverNotArmed') }}
    </p>

    <!-- Verdicts, so a toast missed behind the game is still recoverable. -->
    <ul v-if="log.length" class="mt-3 flex flex-col gap-1">
      <li
        v-for="row in log"
        :key="row.id"
        class="flex items-center justify-between gap-3 rounded-sm border border-line bg-sunken px-2 py-1"
      >
        <span
          class="text-sm font-medium"
          :class="row.verdict.headline === 'UNREAD' ? 'text-warning' : row.verdict.isDeal ? 'text-positive' : 'text-muted'"
        >
          {{ row.verdict.headline }}
        </span>
        <span class="min-w-0 flex-1 truncate text-xs text-subtle">{{ row.verdict.detail }}</span>
        <UiButton
          v-if="row.verdict.debug"
          variant="ghost"
          size="sm"
          @click="openRow = openRow === row.id ? '' : row.id"
        >
          {{ openRow === row.id ? $t('items.detail.common.collapse') : $t('items.detail.liveCapture.whatItRead') }}
        </UiButton>
        <span class="tabular shrink-0 text-xs text-subtle">{{ timeOf(row.at) }}</span>
      </li>

      <!-- Exactly what the app looked at. Without this a bad read can only be
           described, and a mis-crop is indistinguishable from a mis-read. -->
      <li v-if="openRow" class="rounded-sm border border-line bg-sunken p-2">
        <template v-for="row in log" :key="`dbg-${row.id}`">
          <div v-if="row.id === openRow && row.verdict.debug" class="flex flex-col gap-2">
            <p class="text-xs text-subtle">
              {{ $t('items.detail.liveCapture.pointerAt', { x: row.cursor?.x ?? 0, y: row.cursor?.y ?? 0 }) }}
            </p>

            <div>
              <p class="text-xs text-muted">{{ $t('items.detail.liveCapture.priceStrip') }}</p>
              <img :src="row.verdict.debug.stripImage" alt="" class="max-w-full border border-line">
              <!-- The image below is the one that matters: it is what tesseract
                   was handed, not what it was cut from. -->
              <p class="mt-1 text-xs text-muted">{{ $t('items.detail.liveCapture.asOcrSaw') }}</p>
              <img
                v-if="row.verdict.debug.stripProcessed"
                :src="row.verdict.debug.stripProcessed"
                alt=""
                class="max-w-full border border-warning"
              >
              <code class="block text-xs break-all text-subtle">{{ row.verdict.debug.priceText || '(nothing read)' }}</code>
            </div>

            <div>
              <p class="text-xs text-muted">{{ $t('items.detail.liveCapture.tooltipCrop') }}</p>
              <img :src="row.verdict.debug.tooltipImage" alt="" class="max-h-80 border border-line">
              <p class="mt-1 text-xs text-muted">{{ $t('items.detail.liveCapture.asOcrSaw') }}</p>
              <img
                v-if="row.verdict.debug.tooltipProcessed"
                :src="row.verdict.debug.tooltipProcessed"
                alt=""
                class="max-h-80 border border-warning"
              >
              <code class="block max-h-32 overflow-auto text-xs whitespace-pre-wrap text-subtle">{{ row.verdict.debug.statsText || '(nothing read)' }}</code>
            </div>

            <div v-if="row.verdict.debug.unmatched.length">
              <p class="text-xs text-warning">
                {{ $t('items.detail.liveCapture.unread', { count: row.verdict.debug.unmatched.length }) }}
              </p>
              <code
                v-for="(line, i) in row.verdict.debug.unmatched"
                :key="`unread-${row.id}-${i}`"
                class="block text-xs text-subtle"
              >{{ line }}</code>
            </div>
          </div>
        </template>
      </li>
    </ul>

    <!-- ── Setup ────────────────────────────────────────────────────────── -->
    <div v-if="expanded" class="mt-4 border-t border-line pt-4">
      <ol class="mb-3 flex flex-col gap-1 text-xs text-muted">
        <li>{{ $t('items.detail.liveCapture.steps.calibrate') }}</li>
        <li>{{ $t('items.detail.liveCapture.steps.drag') }}</li>
        <li>{{ $t('items.detail.liveCapture.steps.run') }}</li>
      </ol>

      <div class="mb-3 flex flex-wrap items-center gap-2">
        <UiButton size="sm" @click="loadFrame">{{ $t('items.detail.liveCapture.reloadFrame') }}</UiButton>
        <UiButton
          size="sm"
          :variant="calibrationTarget === 'price' ? 'primary' : 'secondary'"
          :disabled="!frame"
          @click="calibrationTarget = 'price'"
        >
          {{ $t('items.detail.liveCapture.markPrice') }}
        </UiButton>
        <UiButton
          size="sm"
          :variant="calibrationTarget === 'stats' ? 'primary' : 'secondary'"
          :disabled="!frame"
          @click="calibrationTarget = 'stats'"
        >
          {{ $t('items.detail.liveCapture.markStats') }}
        </UiButton>
        <UiButton size="sm" variant="primary" :disabled="!canSave" @click="saveRegions">
          {{ $t('items.detail.liveCapture.save') }}
        </UiButton>
        <span
          v-if="saveState.message"
          class="text-xs"
          :class="saveState.tone === 'bad' ? 'text-negative' : 'text-positive'"
        >{{ saveState.message }}</span>
      </div>

      <p v-if="!frame" class="text-xs text-subtle">
        {{ $t('items.detail.liveCapture.noFrame') }}
      </p>

      <div
        v-else
        class="relative inline-block max-w-full overflow-hidden rounded-md border border-line"
        :class="calibrationTarget && 'cursor-crosshair'"
        @mousedown="startDrag"
        @mousemove="moveDrag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
      >
        <img ref="frameEl" :src="frame" alt="" class="block max-w-full select-none" draggable="false">

        <div
          v-if="draft.price"
          class="pointer-events-none absolute border-2 border-positive bg-positive/10"
          :style="boxStyle(draft.price)"
        >
          <span class="absolute -top-5 left-0 text-xs text-positive">{{ $t('items.detail.liveCapture.price') }}</span>
        </div>
        <div
          v-if="draft.stats"
          class="pointer-events-none absolute border-2 border-accent bg-accent/10"
          :style="boxStyle(draft.stats)"
        >
          <span class="absolute -top-5 left-0 text-xs text-accent">{{ $t('items.detail.liveCapture.stats') }}</span>
        </div>
        <div
          v-if="dragRect"
          class="pointer-events-none absolute border-2 border-dashed border-ink"
          :style="boxStyle(dragRect)"
        />

        <!-- Where the pointer was. Both boxes are stored relative to this, so
             one calibration covers every row of the list. -->
        <div
          v-if="cursor"
          class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-warning bg-warning/30"
          :style="{
            left: `${cursor.x / (scale() || 1)}px`,
            top: `${cursor.y / (scale() || 1)}px`,
            width: '14px',
            height: '14px',
          }"
        />
      </div>
    </div>
  </UiCard>
</template>
