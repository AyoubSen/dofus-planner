<template>
  <div class="v2-ts" ref="wrapEl">
    <button class="v2-ts__btn" @click="isOpen = !isOpen">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
      <span class="v2-ts__label">{{ currentLabel }}</span>
      <svg class="v2-ts__chevron w-3 h-3" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition name="v2-ts-drop">
      <div v-if="isOpen" class="v2-ts__drop">
        <div class="v2-ts__drop-header">Theme</div>
        <button
          v-for="theme in v2Themes"
          :key="theme.id"
          class="v2-ts__item"
          :class="{ 'v2-ts__item--active': currentV2Theme === theme.id }"
          @click="pick(theme.id)"
        >
          <!-- mini preview -->
          <div class="v2-ts__preview" :class="previewBorder(theme.id)">
            <div class="v2-ts__preview-top" :class="previewTop(theme.id)" />
            <div class="v2-ts__preview-bot" :class="previewBot(theme.id)" />
          </div>
          <div class="v2-ts__item-body">
            <div class="v2-ts__item-name">{{ theme.name }}</div>
            <div class="v2-ts__item-desc">{{ theme.description }}</div>
          </div>
          <svg v-if="currentV2Theme === theme.id" class="v2-ts__check w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { currentV2Theme, v2Themes, setV2Theme } = useV2Theme()
const isOpen = ref(false)
const wrapEl = ref<HTMLElement | null>(null)

const currentLabel = computed(() => v2Themes.find(t => t.id === currentV2Theme.value)?.name ?? 'Theme')

const pick = (id: typeof v2Themes[number]['id']) => {
  setV2Theme(id)
  isOpen.value = false
}

const previewBorder = (id: string) => ({
  'classic':     'v2-ts__preview--classic',
  'royal-green': 'v2-ts__preview--green',
  'midnight':    'v2-ts__preview--blue',
}[id] ?? '')

const previewTop = (id: string) => ({
  'classic':     'v2-ts__preview-top--classic',
  'royal-green': 'v2-ts__preview-top--green',
  'midnight':    'v2-ts__preview-top--blue',
}[id] ?? '')

const previewBot = (id: string) => ({
  'classic':     'v2-ts__preview-bot--classic',
  'royal-green': 'v2-ts__preview-bot--green',
  'midnight':    'v2-ts__preview-bot--blue',
}[id] ?? '')

const onClickOutside = (e: MouseEvent) => {
  if (wrapEl.value && !wrapEl.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.v2-ts { position: relative; }

.v2-ts__btn {
  display: flex; align-items: center; gap: .5rem;
  padding: .5rem .75rem; border-radius: 8px;
  border: 1px solid var(--v2-border-med);
  background: rgba(0,0,0,.2);
  color: var(--v2-text-secondary);
  font-size: .8125rem; cursor: pointer;
  transition: all .18s;
}
.v2-ts__btn:hover {
  border-color: var(--v2-border-strong);
  color: var(--v2-text);
  background: var(--v2-active);
}
.v2-ts__label { display: none; }
@media (min-width: 640px) { .v2-ts__label { display: inline; } }
.v2-ts__chevron { transition: transform .2s; flex-shrink: 0; }

.v2-ts__drop {
  position: absolute; right: 0; top: calc(100% + 6px);
  width: 220px; z-index: 100;
  background: var(--v2-surface-elevated);
  border: 1px solid var(--v2-border-med);
  border-radius: 12px;
  box-shadow: var(--theme-shadow-lg, 0 8px 32px rgba(0,0,0,.7));
  padding: .375rem;
  overflow: hidden;
}
.v2-ts__drop-header {
  font-size: .625rem; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--v2-text-dimmer);
  padding: .375rem .625rem .25rem;
}
.v2-ts__item {
  display: flex; align-items: center; gap: .625rem;
  width: 100%; padding: .5rem .625rem; border-radius: 8px;
  border: none; background: transparent;
  cursor: pointer; text-align: left; transition: background .15s;
  color: var(--v2-text-secondary);
}
.v2-ts__item:hover { background: var(--v2-hover); color: var(--v2-text); }
.v2-ts__item--active { background: var(--v2-active); color: var(--v2-accent); }
.v2-ts__item-body { flex: 1; min-width: 0; }
.v2-ts__item-name { font-size: .8125rem; font-weight: 600; }
.v2-ts__item-desc { font-size: .6875rem; color: var(--v2-text-dimmer); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.v2-ts__check { flex-shrink: 0; }

/* Preview swatch */
.v2-ts__preview {
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid; overflow: hidden; flex-shrink: 0;
  display: flex; flex-direction: column;
}
.v2-ts__preview-top,.v2-ts__preview-bot { flex: 1; }

.v2-ts__preview--classic  { border-color: rgba(245,165,35,.4); }
.v2-ts__preview--green    { border-color: rgba(74,222,128,.4); }
.v2-ts__preview--blue     { border-color: rgba(96,165,250,.4); }

.v2-ts__preview-top--classic  { background: #110e09; }
.v2-ts__preview-top--green    { background: #091209; }
.v2-ts__preview-top--blue     { background: #080d18; }

.v2-ts__preview-bot--classic  { background: linear-gradient(90deg, rgba(245,165,35,.6), rgba(247,192,80,.4)); }
.v2-ts__preview-bot--green    { background: linear-gradient(90deg, rgba(74,222,128,.6), rgba(134,239,172,.4)); }
.v2-ts__preview-bot--blue     { background: linear-gradient(90deg, rgba(96,165,250,.6), rgba(147,197,253,.4)); }

/* Transition */
.v2-ts-drop-enter-active, .v2-ts-drop-leave-active { transition: opacity .18s, transform .18s; }
.v2-ts-drop-enter-from, .v2-ts-drop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
