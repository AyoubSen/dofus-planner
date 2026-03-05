<template>
  <div class="v2-root" :data-v2-theme="currentV2Theme">
    <!-- Mobile sidebar backdrop -->
    <Transition name="v2-fade">
      <div
        v-if="mobileSidebarOpen"
        class="fixed inset-0 bg-black/70 z-40 lg:hidden"
        style="backdrop-filter: blur(2px)"
        @click="mobileSidebarOpen = false"
      />
    </Transition>

    <!-- ─── Sidebar ─────────────────────────────────────────── -->
    <aside
      class="v2-sidebar"
      :class="{
        'v2-sidebar--collapsed': sidebarCollapsed,
        'v2-sidebar--open': mobileSidebarOpen,
      }"
    >
      <!-- Brand -->
      <div class="v2-brand">
        <NuxtLink :to="localePath('/v2')" class="v2-brand__link">
          <div class="v2-brand__icon">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
            </svg>
          </div>
          <span v-show="!sidebarCollapsed" class="v2-brand__name">{{ $t('v2.layout.brand') }}</span>
        </NuxtLink>
        <button
          class="v2-brand__collapse hidden lg:flex"
          @click="sidebarCollapsed = !sidebarCollapsed"
          :title="sidebarCollapsed ? $t('v2.layout.expandSidebar') : $t('v2.layout.collapseSidebar')"
        >
          <svg
            class="w-4 h-4 transition-transform duration-300"
            :class="{ 'rotate-180': sidebarCollapsed }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="v2-nav">
        <div v-show="!sidebarCollapsed" class="v2-nav__label">{{ $t('v2.layout.navigation') }}</div>
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="localePath(item.path)"
          class="v2-nav__item"
          :class="{ 'v2-nav__item--active': isActive(item.path) }"
          :title="sidebarCollapsed ? $t(item.label) : ''"
          @click="mobileSidebarOpen = false"
        >
          <div class="v2-nav__icon" :style="isActive(item.path) ? { color: item.color } : {}">
            <component :is="item.icon" class="w-[18px] h-[18px]" />
          </div>
          <span v-show="!sidebarCollapsed" class="v2-nav__label-text">{{ $t(item.label) }}</span>
          <div
            v-show="!sidebarCollapsed && isActive(item.path)"
            class="v2-nav__dot"
            :style="{ background: item.color }"
          />
        </NuxtLink>
      </nav>

      <div class="v2-divider" />

      <!-- Character context -->
      <button
        class="v2-context"
        :class="{ 'v2-context--empty': !hasContext }"
        @click="openPicker"
        :title="sidebarCollapsed ? (hasContext ? selectedCharacter?.name : $t('v2.layout.selectCharacter')) : ''"
      >
        <div class="v2-context__avatar" :style="hasContext ? { background: charColor } : {}">
          <span v-if="hasContext">{{ selectedCharacter?.name?.[0]?.toUpperCase() }}</span>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div v-show="!sidebarCollapsed" class="v2-context__info">
          <div class="v2-context__name">
            {{ hasContext ? selectedCharacter?.name : $t('v2.layout.selectCharacter') }}
          </div>
          <div class="v2-context__meta">
            {{ hasContext ? `${selectedCharacter?.class} · ${selectedServer?.name}` : $t('v2.layout.clickToStart') }}
          </div>
        </div>
        <svg v-show="!sidebarCollapsed" class="v2-context__chevron w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div class="v2-divider" />

      <!-- Bottom: back to v1 -->
      <div class="v2-sidebar__bottom">
        <NuxtLink
          :to="localePath('/')"
          class="v2-nav__item"
          :title="sidebarCollapsed ? $t('v2.layout.backToV1') : ''"
        >
          <div class="v2-nav__icon">
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </div>
          <span v-show="!sidebarCollapsed" class="v2-nav__label-text text-xs opacity-60">{{ $t('v2.layout.backToV1') }}</span>
        </NuxtLink>
      </div>
    </aside>

    <!-- ─── Main area ──────────────────────────────────────── -->
    <div class="v2-main">
      <!-- Topbar -->
      <header class="v2-topbar">
        <!-- Mobile hamburger -->
        <button class="v2-topbar__hamburger lg:hidden" @click="mobileSidebarOpen = !mobileSidebarOpen">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- Page title (desktop shows nav item label, mobile shows same) -->
        <div class="v2-topbar__title">
          <span>{{ currentPageTitle }}</span>
          <span class="v2-topbar__badge">{{ $t('v2.layout.badge') }}</span>
        </div>

        <div class="flex items-center gap-1 ml-auto">
          <DataBackupControls />
          <V2ThemeSwitcher />
          <LanguageSwitcher />
          <!-- Mobile character pill -->
          <button
            v-if="hasContext"
            class="v2-topbar__char lg:hidden"
            @click="openPicker"
          >
            <div class="v2-context__avatar v2-context__avatar--sm" :style="{ background: charColor }">
              {{ selectedCharacter?.name?.[0]?.toUpperCase() }}
            </div>
          </button>
        </div>
      </header>

      <!-- Page content -->
      <main class="v2-content">
        <slot />
      </main>
    </div>

    <!-- ─── Character Picker Modal ───────────────────────── -->
    <Teleport to="body">
      <Transition name="v2-modal">
        <div v-if="showPicker" class="v2-overlay" @click.self="showPicker = false">
          <div class="v2-picker">
            <!-- Header -->
            <div class="v2-picker__header">
              <div>
                <h2 class="v2-picker__title">{{ $t('v2.layout.characters') }}</h2>
                <p class="v2-picker__subtitle">{{ $t('v2.layout.charactersSubtitle') }}</p>
              </div>
              <button class="v2-picker__close" @click="showPicker = false">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body: servers | characters -->
            <div class="v2-picker__body">
              <!-- Servers column -->
              <div class="v2-picker__col">
                <div class="v2-picker__col-label">{{ $t('v2.layout.servers') }}</div>
                <div class="v2-picker__list">
                  <button
                    v-for="server in servers"
                    :key="server.id"
                    class="v2-picker__server"
                    :class="{ 'v2-picker__server--active': pickerServerId === server.id }"
                    @click="pickerServerId = server.id; showAddChar = false"
                  >
                    <div class="v2-picker__server-icon">{{ server.name[0].toUpperCase() }}</div>
                    <div class="v2-picker__server-info">
                      <div class="v2-picker__server-name">{{ server.name }}</div>
                      <div class="v2-picker__server-count">
                        {{ server.characters.length }} {{ $t('v2.layout.charactersCount', { count: server.characters.length }) }}
                      </div>
                    </div>
                    <button
                      v-if="server.characters.length === 0"
                      class="v2-picker__delete"
                      @click.stop="deleteServer(server.id)"
                      :title="$t('v2.layout.deleteServer')"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </button>

                  <!-- Add server -->
                  <div v-if="!showAddServer" class="mt-2">
                    <button class="v2-picker__add-btn" @click="showAddServer = true">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      {{ $t('v2.layout.addServer') }}
                    </button>
                  </div>
                  <div v-else class="v2-picker__add-form mt-2">
                    <input
                      ref="serverInputRef"
                      v-model="newServerName"
                      type="text"
                      :placeholder="$t('v2.layout.serverName')"
                      class="v2-picker__input"
                      @keyup.enter="submitServer"
                      @keyup.esc="showAddServer = false; newServerName = ''"
                    />
                    <div class="flex gap-2 mt-2">
                      <button class="v2-btn-gold text-xs px-3 py-1.5" @click="submitServer">{{ $t('v2.layout.add') }}</button>
                      <button class="v2-btn-ghost text-xs px-3 py-1.5" @click="showAddServer = false; newServerName = ''">{{ $t('v2.layout.cancel') }}</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Characters column -->
              <div class="v2-picker__col v2-picker__col--chars">
                <div class="v2-picker__col-label">
                  {{ pickerServer ? pickerServer.name : $t('v2.layout.selectServer') }}
                </div>

                <div v-if="!pickerServer" class="v2-picker__empty">
                  <svg class="w-8 h-8 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p>{{ $t('v2.layout.selectServerFirst') }}</p>
                </div>

                <div v-else class="v2-picker__list">
                  <button
                    v-for="char in pickerServer.characters"
                    :key="char.id"
                    class="v2-picker__char"
                    :class="{
                      'v2-picker__char--active':
                        selectedCharacterId === char.id && selectedServerId === pickerServerId,
                    }"
                    @click="selectChar(char)"
                  >
                    <div class="v2-picker__char-avatar" :style="{ background: getColor(char) }">
                      {{ char.name[0].toUpperCase() }}
                    </div>
                    <div class="v2-picker__char-info">
                      <div class="v2-picker__char-name">{{ char.name }}</div>
                      <div class="v2-picker__char-meta">{{ char.class }}</div>
                    </div>
                    <button
                      class="v2-picker__delete"
                      @click.stop="deleteCharacter(pickerServerId!, char.id)"
                      :title="$t('v2.layout.deleteCharacter')"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </button>

                  <!-- Add character -->
                  <div v-if="!showAddChar" class="mt-2">
                    <button class="v2-picker__add-btn" @click="showAddChar = true">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      {{ $t('v2.layout.addCharacter') }}
                    </button>
                  </div>
                  <div v-else class="v2-picker__add-form mt-2">
                    <input
                      v-model="newCharName"
                      type="text"
                      :placeholder="$t('v2.layout.characterName')"
                      class="v2-picker__input mb-2"
                      @keyup.esc="showAddChar = false; newCharName = ''; newCharClass = ''"
                    />
                    <select v-model="newCharClass" class="v2-picker__input mb-2">
                      <option value="">{{ $t('v2.layout.selectClass') }}</option>
                      <option v-for="cls in DOFUS_CLASSES" :key="cls" :value="cls">{{ cls }}</option>
                    </select>
                    <div class="flex gap-2">
                      <button class="v2-btn-gold text-xs px-3 py-1.5" @click="submitChar">{{ $t('v2.layout.add') }}</button>
                      <button class="v2-btn-ghost text-xs px-3 py-1.5" @click="showAddChar = false; newCharName = ''; newCharClass = ''">{{ $t('v2.layout.cancel') }}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const route = useRoute()
const { t } = useI18n()
const { currentV2Theme, initV2Theme } = useV2Theme()
const {
  servers,
  selectedServer,
  selectedCharacter,
  selectedServerId,
  selectedCharacterId,
  hasContext,
  initContext,
  setContext,
  addServer,
  deleteServer,
  addCharacter,
  deleteCharacter,
} = useV2Context()

const sidebarCollapsed = ref(false)
const mobileSidebarOpen = ref(false)
const showPicker = ref(false)

// Picker state
const pickerServerId = ref<string | null>(null)
const showAddServer = ref(false)
const showAddChar = ref(false)
const newServerName = ref('')
const newCharName = ref('')
const newCharClass = ref('')
const serverInputRef = ref<HTMLInputElement | null>(null)

const DOFUS_CLASSES = [
  'Crâ', 'Ecaflip', 'Eniripsa', 'Enutrof', 'Féca',
  'Iop', 'Osamodas', 'Pandawa', 'Roublard', 'Sacrieur',
  'Sadida', 'Sram', 'Xélor', 'Zobal', 'Masqueraider',
  'Steamer', 'Eliotrope', 'Huppermage', 'Ouginak', 'Forgelance',
]

const AVATAR_COLORS = [
  '#b85c38', '#3873b8', '#38a868', '#8838b8',
  '#b89038', '#38a8b8', '#b8386e', '#6888b8',
  '#38b878', '#b85890',
]

const getColor = (char: { id: string } | null) => {
  if (!char) return '#5a4830'
  const hash = char.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

const charColor = computed(() => getColor(selectedCharacter.value))

const pickerServer = computed(() =>
  servers.value.find((s) => s.id === pickerServerId.value) ?? null,
)

const navItems = [
  { path: '/v2', label: 'nav.dashboard', icon: resolveComponent('IconsIconDashboard'), color: '#f5a523' },
  { path: '/v2/archimonstres', label: 'nav.archimonstres', icon: resolveComponent('IconsIconArchimonstres'), color: '#f87171' },
  { path: '/v2/items', label: 'nav.items', icon: resolveComponent('IconsIconItems'), color: '#60a5fa' },
  { path: '/v2/crafting', label: 'nav.crafting', icon: resolveComponent('IconsIconCrafting'), color: '#34d399' },
  { path: '/v2/brisage', label: 'nav.brisage', icon: resolveComponent('IconsIconBrisage'), color: '#a78bfa' },
  { path: '/v2/succes', label: 'nav.succes', icon: resolveComponent('IconsIconSucces'), color: '#fcd34d' },
  { path: '/v2/familiers', label: 'nav.familiers', icon: resolveComponent('IconsIconFamiliers'), color: '#fb923c' },
]

const isActive = (path: string) => {
  const full = localePath(path)
  if (path === '/v2') return route.path === full
  return route.path === full || route.path.startsWith(full + '/')
}

const currentPageTitle = computed(() => {
  const active = navItems.find((i) => isActive(i.path))
  return active ? t(active.label) : t('v2.layout.badge')
})

const openPicker = () => {
  pickerServerId.value = selectedServerId.value ?? (servers.value[0]?.id ?? null)
  showPicker.value = true
  showAddServer.value = false
  showAddChar.value = false
}

const selectChar = (char: { id: string }) => {
  if (!pickerServerId.value) return
  setContext(pickerServerId.value, char.id)
  showPicker.value = false
}

const submitServer = () => {
  const name = newServerName.value.trim()
  if (!name) return
  const result = addServer(name)
  if (result.success && result.data) {
    pickerServerId.value = result.data.id
  }
  newServerName.value = ''
  showAddServer.value = false
}

const submitChar = () => {
  if (!pickerServerId.value || !newCharName.value.trim() || !newCharClass.value) return
  const result = addCharacter(pickerServerId.value, {
    name: newCharName.value.trim(),
    class: newCharClass.value,
  })
  if (result.success && result.data) {
    selectChar(result.data)
  }
  newCharName.value = ''
  newCharClass.value = ''
  showAddChar.value = false
}

watch(
  () => route.path,
  () => {
    mobileSidebarOpen.value = false
  },
)

watch(showAddServer, async (v) => {
  if (v) {
    await nextTick()
    serverInputRef.value?.focus()
  }
})

onMounted(() => {
  initV2Theme()
  initContext()
})
</script>

<style>
/* ── V2 Root ─────────────────────────────────────────────── */
.v2-root {
  display: flex;
  height: 100dvh;
  overflow: hidden;
  background: var(--v2-bg);
  color: var(--v2-text);
}

/* ── Sidebar ─────────────────────────────────────────────── */
.v2-sidebar {
  display: flex;
  flex-direction: column;
  width: 224px;
  flex-shrink: 0;
  height: 100%;
  background: var(--v2-surface);
  border-right: 1px solid var(--v2-border);
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  z-index: 30;
}

@media (max-width: 1023px) {
  .v2-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    width: 224px !important;
    z-index: 50;
  }
  .v2-sidebar--open {
    transform: translateX(0);
  }
}
@media (min-width: 1024px) {
  .v2-sidebar--collapsed {
    width: 56px;
  }
}

/* Brand */
.v2-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.125rem 0.75rem;
  border-bottom: 1px solid var(--v2-border-subtle);
  min-height: 64px;
  flex-shrink: 0;
}
.v2-brand__link {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  text-decoration: none;
  flex: 1;
  min-width: 0;
}
.v2-brand__icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--v2-accent), var(--v2-accent-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--v2-bg);
  box-shadow: 0 0 16px var(--v2-glow-strong);
}
.v2-brand__name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--v2-text);
  white-space: nowrap;
  overflow: hidden;
}
.v2-brand__collapse {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--v2-text-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.2s, background 0.2s;
}
.v2-brand__collapse:hover {
  color: var(--v2-accent);
  background: var(--v2-active);
}

/* Nav */
.v2-nav {
  flex: 1;
  padding: 0.625rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
  overflow-x: hidden;
}
.v2-nav__label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--v2-text-dimmer);
  text-transform: uppercase;
  padding: 0.25rem 0.5rem 0.375rem;
}
.v2-nav__item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5625rem 0.625rem;
  border-radius: 9px;
  text-decoration: none;
  color: var(--v2-text-muted);
  transition: color 0.18s, background 0.18s;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
}
.v2-nav__item:hover {
  color: var(--v2-text-hover);
  background: var(--v2-hover);
}
.v2-nav__item--active {
  color: var(--v2-text);
  background: var(--v2-active);
  border-left: 3px solid var(--v2-accent);
  padding-left: calc(0.625rem - 3px);
}
.v2-nav__icon {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.v2-nav__label-text {
  font-size: 0.875rem;
  font-weight: 500;
  flex: 1;
}
.v2-nav__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-right: 2px;
}

/* Divider */
.v2-divider {
  height: 1px;
  background: var(--v2-border-subtle);
  margin: 0 0.5rem;
  flex-shrink: 0;
}

/* Character context */
.v2-context {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem;
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  transition: background 0.18s;
  overflow: hidden;
  flex-shrink: 0;
}
.v2-context:hover {
  background: var(--v2-hover);
}
.v2-context--empty .v2-context__avatar {
  background: var(--v2-border-subtle) !important;
  border: 1px dashed var(--v2-border-med);
  color: var(--v2-text-muted);
}
.v2-context__avatar {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  text-transform: uppercase;
}
.v2-context__avatar--sm {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  font-size: 0.75rem;
}
.v2-context__info {
  flex: 1;
  min-width: 0;
}
.v2-context__name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--v2-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.v2-context__meta {
  font-size: 0.6875rem;
  color: var(--v2-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.v2-context__chevron {
  color: var(--v2-text-dim);
  flex-shrink: 0;
}

/* Sidebar bottom */
.v2-sidebar__bottom {
  padding: 0.5rem;
  flex-shrink: 0;
}

/* ── Main ────────────────────────────────────────────────── */
.v2-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* Topbar */
.v2-topbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  height: 56px;
  background: var(--v2-surface);
  border-bottom: 1px solid var(--v2-border);
  flex-shrink: 0;
}
.v2-topbar__hamburger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--v2-text-secondary);
  cursor: pointer;
  transition: all 0.18s;
}
.v2-topbar__hamburger:hover {
  color: var(--v2-accent);
  background: var(--v2-active);
}
.v2-topbar__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--v2-text);
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: capitalize;
}
.v2-topbar__badge {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  background: var(--v2-active-strong);
  color: var(--v2-accent);
  border: 1px solid var(--v2-border-med);
}
.v2-topbar__char {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

/* Content */
.v2-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.5rem;
  scrollbar-width: thin;
  scrollbar-color: var(--v2-scrollbar) transparent;
}
.v2-content::-webkit-scrollbar { width: 6px; }
.v2-content::-webkit-scrollbar-track { background: transparent; }
.v2-content::-webkit-scrollbar-thumb {
  background: var(--v2-active-strong);
  border-radius: 3px;
}

/* ── Character picker modal ──────────────────────────────── */
.v2-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(3px);
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.v2-picker {
  background: var(--v2-surface-elevated);
  border: 1px solid var(--v2-border-med);
  border-radius: 18px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.7), 0 0 60px var(--v2-glow);
}
.v2-picker__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--v2-border);
  flex-shrink: 0;
}
.v2-picker__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--v2-text);
}
.v2-picker__subtitle {
  font-size: 0.8125rem;
  color: var(--v2-text-muted);
  margin-top: 0.125rem;
}
.v2-picker__close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--v2-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
  flex-shrink: 0;
}
.v2-picker__close:hover {
  background: var(--v2-active);
  color: var(--v2-text);
}
.v2-picker__body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: 1;
  overflow: hidden;
  min-height: 320px;
}
.v2-picker__col {
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: var(--v2-active-strong) transparent;
}
.v2-picker__col--chars {
  border-left: 1px solid var(--v2-border-subtle);
}
.v2-picker__col-label {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--v2-text-dim);
  margin-bottom: 0.5rem;
  padding: 0 0.25rem;
}
.v2-picker__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.v2-picker__server,
.v2-picker__char {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.15s;
  position: relative;
}
.v2-picker__server:hover,
.v2-picker__char:hover {
  background: var(--v2-hover-subtle);
  border-color: var(--v2-border);
}
.v2-picker__server--active,
.v2-picker__char--active {
  background: var(--v2-active);
  border-color: var(--v2-border-strong);
}
.v2-picker__server-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--v2-active-strong);
  color: var(--v2-accent);
  font-size: 0.875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.v2-picker__server-info,
.v2-picker__char-info {
  flex: 1;
  min-width: 0;
}
.v2-picker__server-name,
.v2-picker__char-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--v2-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.v2-picker__server-count,
.v2-picker__char-meta {
  font-size: 0.6875rem;
  color: var(--v2-text-muted);
}
.v2-picker__char-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}
.v2-picker__delete {
  opacity: 0;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.18);
  color: #f87171;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.v2-picker__server:hover .v2-picker__delete,
.v2-picker__char:hover .v2-picker__delete {
  opacity: 1;
}
.v2-picker__delete:hover {
  background: rgba(239, 68, 68, 0.18);
}
.v2-picker__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--v2-text-dim);
  font-size: 0.8125rem;
  text-align: center;
  padding: 2rem;
  gap: 0.5rem;
}
.v2-picker__add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4375rem 0.5rem;
  border-radius: 8px;
  border: 1px dashed var(--v2-border-med);
  background: transparent;
  color: var(--v2-text-muted);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.18s;
  width: 100%;
}
.v2-picker__add-btn:hover {
  border-color: var(--v2-border-focus);
  color: var(--v2-accent);
  background: var(--v2-hover-subtle);
}
.v2-picker__input {
  width: 100%;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--v2-border-med);
  border-radius: 8px;
  padding: 0.4375rem 0.75rem;
  font-size: 0.875rem;
  color: var(--v2-text);
  outline: none;
  display: block;
  transition: border-color 0.18s;
}
.v2-picker__input:focus {
  border-color: var(--v2-border-focus);
}
.v2-picker__input::placeholder {
  color: var(--v2-text-dim);
}
.v2-picker__add-form { padding: 0; }

/* ── Shared buttons ─────────────────────────────────────── */
.v2-btn-gold {
  background: linear-gradient(135deg, var(--v2-accent), var(--v2-accent-dark));
  color: var(--v2-bg);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.v2-btn-gold:hover {
  box-shadow: 0 0 16px var(--v2-glow-strong);
}
.v2-btn-ghost {
  background: transparent;
  color: var(--v2-text-secondary);
  border: 1px solid var(--v2-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.v2-btn-ghost:hover {
  background: var(--v2-hover);
  color: var(--v2-text);
}

/* ── Shared page elements ────────────────────────────────── */
.v2-card {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-border);
  border-radius: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.v2-card:hover {
  border-color: var(--v2-border-med);
  box-shadow: 0 0 28px var(--v2-glow);
}
.v2-progress {
  height: 6px;
  background: var(--v2-active);
  border-radius: 99px;
  overflow: hidden;
}
.v2-progress__fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--v2-accent), var(--v2-accent-light));
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.v2-input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--v2-border);
  border-radius: 10px;
  padding: 0.625rem 1rem;
  color: var(--v2-text);
  font-size: 0.9375rem;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
  width: 100%;
}
.v2-input:focus {
  border-color: var(--v2-border-focus);
  box-shadow: 0 0 0 3px var(--v2-glow-focus);
}
.v2-input::placeholder { color: var(--v2-text-dim); }
.v2-no-context {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  gap: 1.25rem;
  color: var(--v2-text-muted);
}
.v2-no-context__icon {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: var(--v2-hover);
  border: 1px solid var(--v2-border);
  display: flex;
  align-items: center;
  justify-content: center;
}
.v2-no-context__title { font-size: 1.25rem; font-weight: 700; color: var(--v2-text); }
.v2-no-context__desc { font-size: 0.9375rem; max-width: 320px; line-height: 1.6; }

/* ── Transitions ─────────────────────────────────────────── */
.v2-fade-enter-active, .v2-fade-leave-active { transition: opacity 0.2s; }
.v2-fade-enter-from, .v2-fade-leave-to { opacity: 0; }

.v2-modal-enter-active, .v2-modal-leave-active { transition: opacity 0.22s; }
.v2-modal-enter-active .v2-picker, .v2-modal-leave-active .v2-picker {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s;
}
.v2-modal-enter-from, .v2-modal-leave-to { opacity: 0; }
.v2-modal-enter-from .v2-picker, .v2-modal-leave-to .v2-picker {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
</style>
