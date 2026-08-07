<template>
  <div class="flex h-dvh overflow-hidden bg-canvas text-ink">
    <!-- Mobile backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileOpen"
        class="fixed inset-0 bg-black/50 lg:hidden"
        :style="{ zIndex: 'calc(var(--z-sidebar) - 1)' }"
        @click="mobileOpen = false"
      />
    </Transition>

    <!-- ── Sidebar ─────────────────────────────────────────────────────── -->
    <aside
      :class="[
        'flex h-full shrink-0 flex-col border-r border-line bg-surface',
        'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:w-56 max-lg:transition-transform max-lg:duration-200',
        collapsed ? 'lg:w-14' : 'lg:w-56',
        mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
      ]"
      :style="{ zIndex: 'var(--z-sidebar)' }"
    >
      <!-- Brand -->
      <div class="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3">
        <NuxtLink :to="localePath('/')" class="flex min-w-0 flex-1 items-center gap-2.5">
          <span class="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-ink">
            <svg class="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2 2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7z" />
            </svg>
          </span>
          <span v-if="!collapsed" class="truncate text-sm font-semibold">{{ $t('v2.layout.brand') }}</span>
        </NuxtLink>
        <UiButton
          variant="ghost"
          size="sm"
          icon
          class="hidden lg:inline-flex"
          :aria-label="collapsed ? $t('v2.layout.expandSidebar') : $t('v2.layout.collapseSidebar')"
          @click="toggleCollapsed"
        >
          <UiIcon name="chevronLeft" :class="collapsed && 'rotate-180'" />
        </UiButton>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-x-hidden overflow-y-auto p-2">
        <NuxtLink
          v-for="item in primaryNav"
          :key="item.path"
          :to="localePath(item.path)"
          :class="navClass(item.path)"
          :title="collapsed ? $t(item.label) : undefined"
          :aria-current="isActive(item.path) ? 'page' : undefined"
          @click="mobileOpen = false"
        >
          <UiIcon :name="item.icon" />
          <span v-if="!collapsed" class="truncate">{{ $t(item.label) }}</span>
        </NuxtLink>

        <!-- Secondary tools live behind one disclosure so the primary six
             read as the actual workflow rather than one list of eleven. -->
        <template v-if="!collapsed">
          <button
            type="button"
            class="mt-3 flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium tracking-wide text-subtle uppercase transition-colors hover:text-ink"
            :aria-expanded="moreOpen"
            @click="toggleMore"
          >
            <span class="flex-1 text-left">{{ $t('nav.more') }}</span>
            <UiIcon name="chevronDown" :class="['transition-transform', !moreOpen && '-rotate-90']" />
          </button>

          <div v-if="moreOpen" class="mt-0.5">
            <NuxtLink
              v-for="item in secondaryNav"
              :key="item.path"
              :to="localePath(item.path)"
              :class="navClass(item.path)"
              :aria-current="isActive(item.path) ? 'page' : undefined"
              @click="mobileOpen = false"
            >
              <UiIcon :name="item.icon" />
              <span class="truncate">{{ $t(item.label) }}</span>
            </NuxtLink>
          </div>
        </template>

        <!-- Collapsed rail still needs to reach every route. -->
        <template v-else>
          <div class="my-2 border-t border-line" />
          <NuxtLink
            v-for="item in secondaryNav"
            :key="item.path"
            :to="localePath(item.path)"
            :class="navClass(item.path)"
            :title="$t(item.label)"
            :aria-current="isActive(item.path) ? 'page' : undefined"
          >
            <UiIcon :name="item.icon" />
          </NuxtLink>
        </template>
      </nav>

      <!-- Character context — the primary CTA for a new user, so it reads as
           a control: border, label, chevron. -->
      <div class="shrink-0 border-t border-line p-2">
        <button
          type="button"
          :class="[
            'flex w-full cursor-pointer items-center gap-2.5 rounded-md border px-2 py-1.5 text-left transition-colors',
            hasContext ? 'border-line hover:border-line-strong' : 'border-accent/40 bg-accent-soft hover:border-accent',
            collapsed && 'justify-center px-0',
          ]"
          :title="collapsed ? (selectedCharacter?.name ?? $t('v2.layout.selectCharacter')) : undefined"
          @click="pickerOpen = true"
        >
          <UiAvatar :name="selectedCharacter?.name" size="sm" />
          <template v-if="!collapsed">
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="truncate text-sm text-ink">
                {{ selectedCharacter?.name ?? $t('v2.layout.selectCharacter') }}
              </span>
              <span class="truncate text-xs text-subtle">
                {{ hasContext ? `${selectedCharacter?.class} · ${selectedServer?.name}` : $t('v2.layout.clickToStart') }}
              </span>
            </span>
            <UiIcon name="chevronDown" class="text-subtle" />
          </template>
        </button>

        <!-- Storage: the number is always visible, not a hover reveal. -->
        <button
          v-if="!collapsed"
          type="button"
          class="mt-2 w-full cursor-pointer px-1 text-left"
          :aria-label="$t('v2.layout.storageBreakdown')"
          @click="storageOpen = true"
        >
          <UiProgress
            :value="storageBytes"
            :max="STORAGE_LIMIT"
            tone="auto"
            :label="$t('v2.layout.storage')"
            show-value
            :value-text="`${formatBytes(storageBytes)} / ${formatBytes(STORAGE_LIMIT)}`"
          />
        </button>
      </div>
    </aside>

    <!-- ── Main ────────────────────────────────────────────────────────── -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3"
        :style="{ zIndex: 'var(--z-topbar)' }"
      >
        <UiButton variant="ghost" size="sm" icon class="lg:hidden" :aria-label="$t('v2.layout.navigation')" @click="mobileOpen = true">
          <UiIcon name="menu" />
        </UiButton>

        <h1 class="min-w-0 flex-1 truncate text-sm font-semibold">{{ pageTitle }}</h1>

        <div class="flex shrink-0 items-center gap-1">
          <AppDataMenu />
          <AppAppearanceMenu />
          <AppLanguageMenu />
        </div>
      </header>

      <main class="min-h-0 flex-1 overflow-y-auto">
        <div class="mx-auto w-full max-w-7xl p-4 lg:p-6">
          <!-- No character yet, on a page that needs one: say so once, here,
               instead of every page rendering its own full-height empty state. -->
          <UiCard v-if="needsCharacter && !hasContext" class="mb-5">
            <div class="flex flex-wrap items-center gap-3">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-ink">{{ $t('v2.layout.selectCharacter') }}</p>
                <p class="mt-0.5 text-sm text-muted">{{ $t('v2.layout.clickToStart') }}</p>
              </div>
              <UiButton variant="primary" size="sm" @click="pickerOpen = true">
                {{ $t('v2.layout.selectCharacterAction') }}
              </UiButton>
            </div>
          </UiCard>

          <slot />
        </div>
      </main>
    </div>

    <AppCharacterPicker :open="pickerOpen" @close="pickerOpen = false" />

    <UiModal :open="storageOpen" :title="$t('v2.layout.storageBreakdown')" size="sm" @close="storageOpen = false">
      <div class="flex flex-col gap-3">
        <UiProgress
          :value="storageBytes"
          :max="STORAGE_LIMIT"
          tone="auto"
          show-value
          :value-text="`${formatBytes(storageBytes)} / ${formatBytes(STORAGE_LIMIT)}`"
        />
        <div v-for="item in storageBreakdown" :key="item.key" class="flex items-baseline justify-between gap-3 text-sm">
          <span class="min-w-0 truncate text-muted" :title="item.key">{{ item.label }}</span>
          <span class="tabular shrink-0 text-subtle">{{ formatBytes(item.bytes) }}</span>
        </div>
      </div>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { IconName } from '~/components/ui/Icon.vue'
import { formatBytes } from '~/utils/format'

const localePath = useLocalePath()
const route = useRoute()
const { t } = useI18n()

const { initTheme } = useAppTheme()
const { initFontScale } = useFontScale()
const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()

const mobileOpen = ref(false)
const pickerOpen = ref(false)
const storageOpen = ref(false)
const collapsed = ref(false)
const moreOpen = ref(false)

interface NavItem { path: string, label: string, icon: IconName, needsCharacter?: boolean }

// The six that make up the actual money-making loop.
const primaryNav: NavItem[] = [
  { path: '/', label: 'nav.home', icon: 'home' },
  { path: '/resale', label: 'nav.flipItems', icon: 'resale', needsCharacter: true },
  { path: '/crafting', label: 'nav.craftFm', icon: 'crafting', needsCharacter: true },
  { path: '/brisage', label: 'nav.breakItems', icon: 'brisage', needsCharacter: true },
  { path: '/archimonstres', label: 'nav.sellArchis', icon: 'archimonstres', needsCharacter: true },
  { path: '/prices', label: 'nav.prices', icon: 'prices', needsCharacter: true },
]

// Reference material and side tools. Nothing is removed — just demoted.
const secondaryNav: NavItem[] = [
  { path: '/kamas', label: 'nav.history', icon: 'kamas', needsCharacter: true },
  { path: '/items', label: 'nav.items', icon: 'items' },
  { path: '/monsters', label: 'nav.monsters', icon: 'monsters' },
  { path: '/succes', label: 'nav.succes', icon: 'succes', needsCharacter: true },
  { path: '/familiers', label: 'nav.familiers', icon: 'familiers' },
]

const allNav = [...primaryNav, ...secondaryNav]

const isActive = (path: string) => {
  const full = localePath(path)
  if (path === '/') return route.path === full
  return route.path === full || route.path.startsWith(`${full}/`)
}

const navClass = (path: string) => [
  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
  collapsed.value && 'justify-center px-0',
  isActive(path)
    ? 'bg-accent-soft text-accent font-medium'
    : 'text-muted hover:bg-sunken hover:text-ink',
]

const activeItem = computed(() => allNav.find(i => isActive(i.path)) ?? null)
const pageTitle = computed(() => (activeItem.value ? t(activeItem.value.label) : t('v2.layout.brand')))
const needsCharacter = computed(() => activeItem.value?.needsCharacter ?? false)

// Persist the two sidebar disclosures; re-deciding them every load is friction.
const SIDEBAR_KEY = 'sidebar-collapsed'
const MORE_KEY = 'sidebar-more-open'

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
  localStorage.setItem(SIDEBAR_KEY, String(collapsed.value))
}
const toggleMore = () => {
  moreOpen.value = !moreOpen.value
  localStorage.setItem(MORE_KEY, String(moreOpen.value))
}

watch(() => route.path, () => { mobileOpen.value = false })

// ── Storage meter ─────────────────────────────────────────────────────────
const STORAGE_LIMIT = 10 * 1024 * 1024
const storageBytes = ref(0)
let storageTimer: ReturnType<typeof setInterval> | undefined

const STORAGE_KEY_LABELS: Record<string, string> = {
  'dofus-app-store': 'App data (resale, accounts…)',
  'dofus-items-observed-prices-v1': 'Observed prices + screenshots',
  'dofus-items-dofusdb-recipe-cache-v1': 'Recipe cache',
  'dofus-items-resource-prices-v1': 'Resource prices',
  'dofus-items-stat-priorities-v1': 'Stat priorities',
  'v2-context': 'Selected character',
}

const storageEntries = ref<{ key: string, bytes: number }[]>([])

const measureStorage = () => {
  if (!import.meta.client) return
  const entries: { key: string, bytes: number }[] = []
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    const bytes = (key.length + (localStorage.getItem(key)?.length ?? 0)) * 2
    entries.push({ key, bytes })
    total += bytes
  }
  storageEntries.value = entries.sort((a, b) => b.bytes - a.bytes)
  storageBytes.value = total
}

const storageBreakdown = computed(() =>
  storageEntries.value.map(e => ({ ...e, label: STORAGE_KEY_LABELS[e.key] ?? e.key })),
)

watch(storageOpen, (open) => { if (open) measureStorage() })

onMounted(() => {
  initTheme()
  initFontScale()
  initContext()
  collapsed.value = localStorage.getItem(SIDEBAR_KEY) === 'true'
  moreOpen.value = localStorage.getItem(MORE_KEY) === 'true'
  measureStorage()
  storageTimer = setInterval(measureStorage, 30_000)
})

onBeforeUnmount(() => clearInterval(storageTimer))

// A route inside "More" must not look like it came from nowhere.
watch(activeItem, (item) => {
  if (item && secondaryNav.includes(item)) moreOpen.value = true
}, { immediate: true })
</script>
