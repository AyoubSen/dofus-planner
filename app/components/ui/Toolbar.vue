<template>
  <div class="mb-4 flex flex-col gap-2">
    <!-- Search always gets its own full-width row below `md`, so filters can
         wrap freely instead of squeezing it to nothing. This is the fix for
         the toolbars that collapsed on medium screens. -->
    <div class="flex flex-col gap-2 md:flex-row md:items-center">
      <div v-if="$slots.search" class="min-w-0 md:max-w-xs md:flex-1">
        <slot name="search" />
      </div>

      <div v-if="$slots.filters" class="flex min-w-0 flex-wrap items-center gap-2">
        <slot name="filters" />
      </div>

      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2 md:ml-auto">
        <slot name="actions" />
      </div>
    </div>

    <!-- Secondary controls that only matter once a filter is active. -->
    <div v-if="$slots.extra" class="flex flex-wrap items-center gap-2">
      <slot name="extra" />
    </div>
  </div>
</template>
