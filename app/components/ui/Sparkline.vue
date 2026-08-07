<template>
  <div ref="wrapEl" class="relative h-full min-h-[3.625rem] w-full" :aria-label="label || 'Price trend'">
    <div ref="chartEl" class="size-full [&_.uplot]:!size-full [&_.uplot]:bg-transparent" />
    <div
      v-if="hoverText"
      class="tabular pointer-events-none absolute top-1 -translate-x-1/2 rounded-full border border-line bg-raised px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-ink shadow-sm"
      :style="{ left: `${hoverLeft}px` }"
    >
      {{ hoverText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { formatNumber } from '~/utils/format'

interface SparklinePoint {
  id?: string
  price: number
  createdAt: string
  label?: string
}

const props = defineProps<{
  points: SparklinePoint[]
  label?: string
}>()

const wrapEl = ref<HTMLDivElement | null>(null)
const chartEl = ref<HTMLDivElement | null>(null)
const hoverText = ref('')
const hoverLeft = ref(0)

let chart: uPlot | null = null
let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null

const chartPoints = computed(() => props.points
  .filter(p => Number.isFinite(p.price) && p.price > 0 && !Number.isNaN(new Date(p.createdAt).getTime()))
  .slice()
  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  .slice(-14))

const buildData = (): uPlot.AlignedData => [
  chartPoints.value.map(p => new Date(p.createdAt).getTime() / 1000),
  chartPoints.value.map(p => p.price),
]

// Pull the stroke from the live token rather than hardcoding a hex, so the
// chart follows the theme instead of staying amber in light mode.
const accent = () =>
  (import.meta.client
    ? getComputedStyle(document.documentElement).getPropertyValue('--c-accent').trim()
    : '') || '#d4a24c'

const getSize = () => ({
  width: Math.max(chartEl.value?.clientWidth || 280, 160),
  height: Math.max(chartEl.value?.clientHeight || 78, 58),
})

const getOptions = (): uPlot.Options => ({
  ...getSize(),
  padding: [6, 4, 6, 4],
  legend: { show: false },
  cursor: { drag: { setScale: false }, points: { show: false } },
  scales: {
    x: { time: true },
    y: {
      range: (_self, min, max) => {
        const safeMin = typeof min === 'number' ? min : 0
        const safeMax = typeof max === 'number' ? max : safeMin + 1
        const pad = Math.max((safeMax - safeMin) * 0.16, safeMax * 0.025, 1)
        return [Math.max(0, safeMin - pad), safeMax + pad]
      },
    },
  },
  axes: [{ show: false }, { show: false }],
  series: [{}, { stroke: accent(), width: 1.5, points: { show: false } }],
  hooks: {
    setCursor: [
      (plot) => {
        const index = plot.cursor.idx
        const point = typeof index === 'number' ? chartPoints.value[index] : null
        if (!point || !chartEl.value) {
          hoverText.value = ''
          return
        }
        const maxLeft = Math.max(chartEl.value.clientWidth - 34, 0)
        hoverLeft.value = Math.min(Math.max(plot.cursor.left ?? 0, 34), maxLeft)
        hoverText.value = point.label || formatNumber(Math.round(point.price))
      },
    ],
  },
})

const renderChart = () => {
  if (!chartEl.value || chartPoints.value.length < 2) return
  const data = buildData()
  if (!chart) {
    chart = new uPlot(getOptions(), data, chartEl.value)
    return
  }
  chart.setSize(getSize())
  chart.setData(data)
}

/** uPlot bakes the stroke in at construction, so a theme flip needs a rebuild. */
const rebuild = () => {
  chart?.destroy()
  chart = null
  renderChart()
}

watch(chartPoints, () => {
  hoverText.value = ''
  nextTick(renderChart)
}, { deep: true })

onMounted(() => {
  renderChart()
  if (chartEl.value) {
    resizeObserver = new ResizeObserver(() => renderChart())
    resizeObserver.observe(chartEl.value)
  }
  themeObserver = new MutationObserver(rebuild)
  themeObserver.observe(document.documentElement, { attributeFilter: ['data-theme'] })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  chart?.destroy()
  chart = null
})
</script>
