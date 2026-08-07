<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="size-[1.25em] shrink-0"
    aria-hidden="true"
    v-html="path"
  />
</template>

<script setup lang="ts">
// One icon set, one grid, one stroke width, sized in em so it tracks the
// surrounding text under useFontScale(). Replaces nine separate single-purpose
// components in which /prices, /items and /kamas all shared the same glyph.

const props = defineProps<{ name: IconName }>()

const paths = {
  // ── Navigation ──────────────────────────────────────────────────────────
  /** Dashboard — panel grid */
  home: '<rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/>',
  /** Flip items — buy low, sell high */
  resale: '<path d="M3 8h13m0 0-3.5-3.5M16 8l-3.5 3.5"/><path d="M21 16H8m0 0 3.5-3.5M8 16l3.5 3.5"/>',
  /** Craft & FM — hammer */
  crafting: '<path d="M14.5 3.5 20 9l-2.5 2.5L12 6z"/><path d="m11 7-7.5 7.5a2 2 0 0 0 0 2.8l.7.7a2 2 0 0 0 2.8 0L14.5 10.5"/>',
  /** Break items — fracture */
  brisage: '<path d="M13 2 5.5 12H11l-1 10 8.5-11.5H13z"/>',
  /** Sell archis — trophy */
  archimonstres: '<path d="M8 3h8v5a4 4 0 0 1-8 0z"/><path d="M8 4H5v2a3 3 0 0 0 3 3M16 4h3v2a3 3 0 0 1-3 3"/><path d="M12 12v4m-3 5h6l-1-5h-4z"/>',
  /** Prices — trend line */
  prices: '<path d="M3 20V4"/><path d="M3 20h18"/><path d="m7 15 4-5 3 3 5-7"/>',
  /** Items — equipment satchel */
  items: '<path d="M4 8h16l-1 12H5z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  /** History — ledger */
  kamas: '<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M18 16h2M9 8h6M9 12h6"/>',
  /** Monsters — beast */
  monsters: '<path d="M4 5 6 9m14-4-2 4"/><path d="M5 9h14v5a7 7 0 0 1-14 0z"/><path d="M9.5 13h.01M14.5 13h.01M10 17h4"/>',
  /** Achievements — medal */
  succes: '<circle cx="12" cy="14" r="5"/><path d="M9 9 7 3h10l-2 6"/><path d="m12 12 .8 1.7 1.8.3-1.3 1.3.3 1.8-1.6-.9-1.6.9.3-1.8L9.4 14l1.8-.3z"/>',
  /** Pets — paw */
  familiers: '<circle cx="8" cy="7" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="5" cy="13" r="2"/><circle cx="19" cy="13" r="2"/><path d="M12 12c2.5 0 4.5 2 4.5 4.5S14.5 21 12 21s-4.5-2-4.5-4.5S9.5 12 12 12z"/>',

  // ── Interface ───────────────────────────────────────────────────────────
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
  download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  upload: '<path d="M12 21V9m0 0 4 4M12 9l-4 4"/><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14A8.5 8.5 0 0 1 10 4a8.5 8.5 0 1 0 10 10z"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8m-4-4v4"/>',
  database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5 13 5a7.5 7.5 0 0 1 2 .8l2.4-.9 1.7 1.7-.9 2.4a7.5 7.5 0 0 1 .8 2l2.5 1v2.4l-2.5 1a7.5 7.5 0 0 1-.8 2l.9 2.4-1.7 1.7-2.4-.9a7.5 7.5 0 0 1-2 .8l-1 2.5h-2.4l-1-2.5a7.5 7.5 0 0 1-2-.8l-2.4.9-1.7-1.7.9-2.4a7.5 7.5 0 0 1-.8-2l-2.5-1v-2.4l2.5-1a7.5 7.5 0 0 1 .8-2l-.9-2.4 1.7-1.7 2.4.9a7.5 7.5 0 0 1 2-.8z"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5h.01"/>',
  check: '<path d="m5 13 4 4 10-10"/>',
} as const

export type IconName = keyof typeof paths

const path = computed(() => paths[props.name] ?? '')
</script>
