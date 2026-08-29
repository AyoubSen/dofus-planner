<template>
  <div v-if="hasContext" class="flex flex-col gap-5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <UiSegmented v-model="mode" :options="modeOptions" :aria-label="$t('v2.archi.modeLabel')" />
      <div class="flex items-center gap-2">
        <UiBadge v-if="metamobConnected" :tone="metamobSync.state === 'error' ? 'negative' : 'positive'" dot>
          {{ metamobStatusLabel }}
        </UiBadge>
        <UiButton size="sm" @click="openMetamobConnection">
          {{ metamobConnected ? $t('v2.archi.metamob.manage') : $t('v2.archi.metamob.connect') }}
        </UiButton>
      </div>
    </div>

    <UiCard v-if="!metamobConnected" :title="$t('v2.archi.metamob.cardTitle')">
      <div class="flex flex-wrap items-center gap-3">
        <p class="min-w-0 flex-1 text-sm text-muted">{{ $t('v2.archi.metamob.cardDescription') }}</p>
        <UiButton variant="primary" size="sm" @click="openMetamobConnection">
          {{ $t('v2.archi.metamob.connect') }}
        </UiButton>
      </div>
    </UiCard>

    <p v-else-if="metamobSync.error" class="text-sm text-negative">{{ metamobSync.error }}</p>

    <UiModal
      :open="metamobConnectionOpen"
      :title="$t('v2.archi.metamob.modalTitle')"
      size="sm"
      @close="metamobConnectionOpen = false"
    >
      <form class="flex flex-col gap-4" @submit.prevent="connectMetamob">
        <p class="text-sm text-muted">{{ $t('v2.archi.metamob.sessionNote') }}</p>

        <UiField :label="$t('v2.archi.metamob.username')" required>
          <template #default="{ id }">
            <UiInput :id="id" v-model="metamobDraft.username" :placeholder="$t('v2.archi.metamob.usernamePlaceholder')" />
          </template>
        </UiField>

        <UiField
          :label="$t('v2.archi.metamob.token')"
          :hint="$t('v2.archi.metamob.tokenHint')"
          required
        >
          <template #default="{ id }">
            <UiInput :id="id" v-model="metamobDraft.token" type="password" />
          </template>
        </UiField>

        <UiField :label="$t('v2.archi.metamob.questSlug')" :hint="$t('v2.archi.metamob.questSlugHint')">
          <template #default="{ id }">
            <UiInput :id="id" v-model="metamobDraft.questSlug" />
          </template>
        </UiField>

        <p v-if="metamobConnectionError" class="text-sm text-negative">{{ metamobConnectionError }}</p>

        <div class="flex flex-wrap justify-end gap-2">
          <UiButton
            v-if="metamobConnected"
            variant="danger"
            class="mr-auto"
            @click="disconnectMetamob"
          >
            {{ $t('v2.archi.metamob.disconnect') }}
          </UiButton>
          <UiButton variant="ghost" @click="metamobConnectionOpen = false">
            {{ $t('v2.archi.metamob.cancel') }}
          </UiButton>
          <UiButton
            type="submit"
            variant="primary"
            :loading="metamobConnecting"
            :disabled="!metamobDraft.username.trim() || !metamobDraft.token.trim()"
          >
            {{ $t('v2.archi.metamob.save') }}
          </UiButton>
        </div>
      </form>
    </UiModal>

    <!-- ══ Dofus Ocre ═════════════════════════════════════════════════════ -->
    <template v-if="mode === 'dofus-ocre'">
      <UiCard>
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span class="text-xs font-medium tracking-wide text-subtle uppercase">{{ $t('v2.archi.overallProgress') }}</span>
          <span class="tabular text-lg font-semibold text-ink">{{ completedCount }}</span>
          <span class="tabular text-sm text-subtle">/ {{ archiMonsters.length }}</span>
          <span class="tabular ml-auto text-sm text-accent">{{ pct }}%</span>
        </div>
        <UiProgress :value="pct" class="mt-2" :aria-label="$t('v2.archi.overallProgress')" />
        <div class="mt-2.5 flex flex-wrap gap-2">
          <UiBadge tone="negative" dot>{{ $t('v2.archi.missingCount', { count: zeroCount }) }}</UiBadge>
          <UiBadge tone="warning" dot>{{ $t('v2.archi.onceCount', { count: oneCount }) }}</UiBadge>
          <UiBadge tone="positive" dot>{{ $t('v2.archi.manyCount', { count: manyCount }) }}</UiBadge>
        </div>
      </UiCard>

      <!-- Every filter here is now the same kind of control, rather than
           pills beside a lone <select>. -->
      <UiToolbar>
        <template #search>
          <UiInput v-model="search" type="search" :placeholder="$t('v2.common.search')">
            <template #prefix><UiIcon name="search" /></template>
          </UiInput>
        </template>
        <template #filters>
          <UiSegmented v-model="filter" :options="filterOptions" size="sm" :aria-label="$t('v2.archi.filterLabel')" />
          <UiSelect v-model="typeFilter" :options="monsterTypeOptions" size="sm" class="w-40" :aria-label="$t('v2.archi.typeFilter')" />
        </template>
      </UiToolbar>

      <div v-if="loading" class="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(13rem,1fr))]">
        <UiSkeleton v-for="i in 12" :key="i" height="4.5rem" />
      </div>

      <UiEmptyState v-else-if="!visible.length" :title="$t('v2.archi.noMatches')">
        <template #icon><UiIcon name="search" /></template>
        <template #action>
          <UiButton size="sm" @click="search = ''; filter = 'all'; typeFilter = 'all'">
            {{ $t('v2.archi.clearFilters') }}
          </UiButton>
        </template>
      </UiEmptyState>

      <div v-else class="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(13rem,1fr))]">
        <div
          v-for="m in visible"
          :key="m.id"
          :class="[
            'flex items-center gap-2.5 rounded-lg border bg-surface p-2.5 transition-colors',
            getCount(m) > 0 ? 'border-accent/30' : 'border-line',
          ]"
        >
          <div class="relative shrink-0">
            <img :src="getMonsterImg(m)" :alt="''" loading="lazy" class="size-10 rounded-md bg-sunken object-contain" @error="onImgErr">
            <span
              v-if="m.type === 'archimonstre'"
              class="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-accent text-[0.5rem] font-bold text-accent-ink"
              :title="$t('v2.archi.isArchimonstre')"
            >A</span>
          </div>

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-ink" :title="m.nom">{{ m.nom }}</p>
            <p class="truncate text-xs text-subtle">{{ m.zone }}</p>
          </div>

          <div class="flex shrink-0 items-center gap-1">
            <UiButton variant="ghost" size="sm" icon :disabled="getCount(m) === 0" :aria-label="$t('v2.archi.decrement')" @click="dec(m)">
              −
            </UiButton>
            <span :class="['tabular w-5 text-center text-sm', getCount(m) > 0 ? 'font-semibold text-accent' : 'text-subtle']">
              {{ getCount(m) }}
            </span>
            <UiButton variant="ghost" size="sm" icon :aria-label="$t('v2.archi.increment')" @click="inc(m)">
              +
            </UiButton>
          </div>
        </div>
      </div>
    </template>

    <!-- ══ Route planner ══════════════════════════════════════════════════ -->
    <template v-else-if="mode === 'route-planner'">

      <!-- Run planner: zaap groups ranked by value, stops ordered into a walk -->
      <UiCard :padded="false">
        <template #title>{{ $t('v2.archi.route.title') }}</template>
        <template #actions>
          <span class="tabular text-xs text-subtle">
            {{ huntView === 'route'
              ? $t('v2.archi.route.routeSummary', { zones: huntRouteTotals.zones, stops: huntRouteTotals.stops, monsters: huntTotals.monsters })
              : $t('v2.archi.route.spotsSummary', { spots: huntTotals.spots, monsters: huntTotals.monsters }) }}
          </span>
        </template>

        <!-- Where to go now, so the answer isn't buried in 34 groups -->
        <div v-if="huntView === 'route' && huntTopGroup" class="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line bg-sunken p-3">
          <span class="text-xs tracking-wide text-subtle uppercase">{{ $t('v2.archi.route.heroLabel') }}</span>
          <span class="text-base font-medium text-ink">{{ huntTopGroup.zone }}</span>
          <span v-if="huntSweepMode === 'quick'" class="tabular text-xs text-subtle">
            {{ $t('v2.archi.route.heroNear', {
              archi: huntTopGroup.near,
              spots: huntTopGroup.nearby.length,
              radius: huntRadius,
            }) }}
          </span>
          <span v-else class="tabular text-xs text-subtle">
            {{ $t('v2.archi.route.heroLine', { archi: huntTopGroup.total, stops: huntTopGroup.stops.length }) }}
          </span>
          <!-- Only when they differ, or every hero line would carry a redundant
               "31 of 31 available". -->
          <span
            v-if="huntSweepMode === 'quick' ? huntTopGroup.nearReady !== huntTopGroup.near : huntTopGroup.ready !== huntTopGroup.total"
            class="tabular text-xs text-subtle"
          >
            {{ $t('v2.archi.route.readyOf', { ready: huntSweepMode === 'quick' ? huntTopGroup.nearReady : huntTopGroup.ready }) }}
          </span>
          <UiBadge v-if="huntTopGroup.exclusive" tone="negative">
            {{ $t('v2.archi.route.exclusive', { count: huntTopGroup.exclusive }) }}
          </UiBadge>
          <UiBadge v-else-if="huntTopGroup.oneShot" tone="positive">{{ $t('v2.archi.route.oneShot') }}</UiBadge>
        </div>

        <div class="flex flex-wrap items-center gap-2 border-b border-line p-2">
          <UiSegmented
            v-model="huntView"
            :options="[
              { label: $t('v2.archi.route.viewRoute'), value: 'route' },
              { label: $t('v2.archi.route.viewSpots'), value: 'spots' },
              { label: $t('v2.archi.route.viewSteps'), value: 'steps' },
              { label: $t('v2.archi.route.viewSpares'), value: 'spares' },
              { label: $t('v2.archi.route.viewFind'), value: 'find' },
            ]"
          />
          <UiSegmented
            v-if="huntView === 'route'"
            v-model="huntSweepMode"
            :options="[
              { label: $t('v2.archi.route.modeQuick'), value: 'quick' },
              { label: $t('v2.archi.route.modeWalk'), value: 'walk' },
            ]"
          />
          <UiSegmented
            v-if="huntView === 'route' && huntSweepMode === 'walk'"
            v-model="huntSort"
            :options="[
              { label: $t('v2.archi.route.sortTotal'), value: 'total' },
              { label: $t('v2.archi.route.sortYield'), value: 'yield' },
            ]"
          />
          <UiInput v-model="huntZoneFilter" size="sm" :placeholder="$t('v2.archi.route.zonePlaceholder')" class="min-w-40 flex-1">
            <template #prefix><UiIcon name="search" /></template>
          </UiInput>
          <UiButton :variant="huntHideOwned ? 'primary' : 'ghost'" size="sm" @click="huntHideOwned = !huntHideOwned">
            {{ $t('v2.archi.route.filterMissing') }}
          </UiButton>
          <UiButton :variant="huntNextStepOnly ? 'primary' : 'ghost'" size="sm" @click="huntToggleStepFilter">
            {{ $t('v2.archi.route.filterStep', { step: huntTargetStep }) }}
          </UiButton>
          <label
            v-if="huntSweepMode === 'quick'"
            class="flex items-center gap-1.5 text-xs text-subtle"
            :title="$t('v2.archi.route.radiusTitle')"
          >
            {{ $t('v2.archi.route.radiusLabel') }}
            <input
              v-model.number="huntRadius"
              type="number"
              min="0"
              max="60"
              step="1"
              class="tabular w-14 rounded-md border border-line bg-sunken px-1.5 py-1 text-xs text-ink"
            >
          </label>
          <label class="flex items-center gap-1.5 text-xs text-subtle" :title="$t('v2.archi.route.cooldownTitle')">
            {{ $t('v2.archi.route.cooldownLabel') }}
            <input
              v-model.number="huntCooldownHours"
              type="number"
              min="0.5"
              max="48"
              step="0.5"
              class="tabular w-14 rounded-md border border-line bg-sunken px-1.5 py-1 text-xs text-ink"
            >
          </label>
        </div>

        <!-- The two folded-away filters are still active; say so rather than
             leaving the user wondering where the dungeons went. -->
        <p class="border-b border-line px-3 py-1.5 text-xs text-subtle">
          {{ $t('v2.archi.route.defaultsNote') }}
        </p>

        <p v-if="huntLoading" class="p-4 text-sm text-subtle">{{ $t('v2.archi.route.spotsLoading') }}</p>
        <p v-else-if="huntError" class="p-4 text-sm text-negative">{{ huntError }}</p>
        <!-- Only the two spot-driven views depend on huntSpots; steps, spares
             and lookup still have something to say when the filters empty it. -->
        <p
          v-else-if="!huntSpots.length && (huntView === 'route' || huntView === 'spots')"
          class="p-4 text-sm text-subtle"
        >
          {{ $t('v2.archi.route.spotsEmpty') }}
        </p>

        <!-- Route: one group per zaap, collapsed apart from the next trip -->
        <div v-else-if="huntView === 'route'" class="flex max-h-[32rem] flex-col divide-y divide-line overflow-y-auto">
          <div v-for="zone in huntRoute" :key="zone.zone">
            <!-- The sweep control is a sibling, not a child: a button inside a
                 button is invalid and browsers handle it inconsistently. -->
            <div class="flex items-center gap-2 p-3 transition-colors hover:bg-sunken">
              <button
                type="button"
                class="flex min-w-0 flex-1 cursor-pointer items-baseline gap-2 text-left"
                :aria-expanded="huntIsOpen(zone.zone)"
                @click="huntToggle(zone.zone)"
              >
                <UiIcon :name="huntIsOpen(zone.zone) ? 'chevronDown' : 'chevronRight'" class="shrink-0 self-center" />
                <span class="text-sm font-medium text-ink">{{ zone.zone }}</span>
                <span class="tabular min-w-0 flex-1 truncate text-xs text-subtle">
                  <!-- Quick mode is about one sous-zone, so stop counts and
                       per-stop yield say nothing; what matters is how much is
                       at the zaap versus how much the walk would add. -->
                  <template v-if="huntSweepMode === 'quick'">
                    {{ $t('v2.archi.route.nearMeta', {
                      here: zone.own,
                      near: zone.near,
                      radius: huntRadius,
                      spots: zone.nearby.length,
                    }) }}
                    <template v-if="zone.sweptSpots">
                      · {{ $t('v2.archi.route.sweptSpots', { n: zone.sweptSpots, of: zone.nearby.length }) }}
                    </template>
                  </template>
                  <template v-else>
                    {{ $t('v2.archi.route.groupMeta', {
                      stops: zone.stops.length,
                      n: zone.yield.toFixed(1),
                    }) }}
                  </template>
                </span>
              </button>
              <UiBadge v-if="zone.exclusive" tone="negative">
                {{ $t('v2.archi.route.exclusive', { count: zone.exclusive }) }}
              </UiBadge>
              <UiBadge v-else-if="zone.oneShot" tone="positive">{{ $t('v2.archi.route.oneShot') }}</UiBadge>
              <UiBadge v-if="huntSweepMode === 'quick'">
                {{ zone.nearReady !== zone.near ? `${zone.nearReady}/${zone.near}` : zone.near }}
              </UiBadge>
              <UiBadge v-else>{{ zone.ready !== zone.total ? `${zone.ready}/${zone.total}` : zone.total }}</UiBadge>
            </div>

            <div v-show="huntIsOpen(zone.zone)" class="flex flex-col gap-2 px-3 pb-3">
              <div
                v-for="(stop, i) in (huntSweepMode === 'quick' ? zone.nearby : zone.stops)"
                :key="stop.key"
                class="rounded-md border border-line p-2"
              >
                <div class="mb-1.5 flex items-baseline gap-2">
                  <span v-if="huntSweepMode === 'walk'" class="tabular text-xs text-subtle">{{ i + 1 }}.</span>
                  <!-- Distance from the zaap: the thing that decides whether a
                       spot is worth walking to, and 0 means you land on it. -->
                  <span
                    v-else
                    class="tabular shrink-0 text-xs"
                    :class="stop.dist < 1 ? 'text-positive' : 'text-subtle'"
                  >
                    {{ stop.dist < 1
                      ? $t('v2.archi.route.atZaap')
                      : $t('v2.archi.route.tiles', { n: Math.round(stop.dist) }) }}
                  </span>
                  <span class="min-w-0 flex-1 truncate text-xs font-medium text-ink">{{ stop.subzone }}</span>
                  <span v-if="huntIsSwept(stop.key)" class="tabular shrink-0 text-xs text-subtle">
                    {{ huntSweptLabel(stop.key) }}
                  </span>
                  <!-- One fée scans one sous-zone, so this is where the sweep
                       belongs — on the spot you actually checked. -->
                  <button
                    type="button"
                    class="shrink-0 cursor-pointer rounded-md px-1.5 py-0.5 text-xs transition-colors"
                    :class="huntIsSwept(stop.key)
                      ? 'bg-accent-soft text-subtle'
                      : 'text-subtle hover:bg-raised hover:text-ink'"
                    :aria-pressed="huntIsSwept(stop.key)"
                    :title="$t('v2.archi.route.sweepTitle')"
                    @click="huntSweep(stop.key)"
                  >
                    {{ $t('v2.archi.route.sweepNothing') }}
                  </button>
                  <span
                    class="tabular shrink-0 text-xs text-subtle"
                    :title="huntSweepMode === 'quick' ? $t('v2.archi.route.atZaapTitle') : $t('v2.archi.route.firstToCover')"
                  >
                    +{{ stop.monsters.length }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="m in stop.monsters"
                    :key="`${stop.key}-${m.id}`"
                    type="button"
                    :class="[
                      'flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors',
                      huntIsCooling(m.id) ? 'bg-accent-soft opacity-50' : 'bg-sunken hover:bg-raised',
                    ]"
                    :aria-pressed="huntIsCooling(m.id)"
                    :title="$t('v2.archi.route.monsterTitle', { step: m.step, owned: m.owned, required: m.required })"
                    @click="huntCatch(m)"
                  >
                    <img :src="m.image" :alt="''" class="size-4 shrink-0 rounded object-contain" @error="onImgErr">
                    <span :class="['text-xs text-ink', huntIsCooling(m.id) && 'line-through']">{{ m.name }}</span>
                    <span v-if="huntIsCooling(m.id)" class="tabular shrink-0 text-xs text-subtle">
                      {{ $t('v2.archi.route.readyIn', { duration: huntCoolingLabel(m.id) }) }}
                    </span>
                    <UiIcon v-if="huntIsCooling(m.id)" name="check" class="shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Steps: "250 missing" is not a goal; "step 14 needs 11" is -->
        <div v-else-if="huntView === 'steps'" class="flex max-h-[32rem] flex-col divide-y divide-line overflow-y-auto">
          <button
            v-for="s in huntSteps"
            :key="s.step"
            type="button"
            :class="[
              'flex cursor-pointer items-center gap-3 p-3 text-left transition-colors hover:bg-sunken',
              s.step === huntNearestStep && 'bg-accent-soft',
            ]"
            @click="huntFocusStep(s.step)"
          >
            <span class="w-16 shrink-0 text-sm font-medium text-ink">
              {{ $t('v2.archi.route.stepLabel', { step: s.step }) }}
            </span>
            <UiProgress :value="s.done" :max="s.total" class="min-w-0 flex-1" />
            <span class="tabular w-14 shrink-0 text-right text-xs text-subtle">{{ s.done }}/{{ s.total }}</span>
            <UiBadge v-if="s.left" :tone="s.step === huntNearestStep ? 'positive' : 'neutral'">
              {{ $t('v2.archi.route.stepLeft', { count: s.left }) }}
            </UiBadge>
            <UiBadge v-else tone="positive">{{ $t('v2.archi.route.stepDone') }}</UiBadge>
          </button>
        </div>

        <!-- Spares: required is 1 for every quest monster, so anything past the
             first is surplus and tradeable in game -->
        <div v-else-if="huntView === 'spares'" class="flex max-h-[32rem] flex-col overflow-y-auto p-3">
          <p v-if="!huntSpares.length" class="text-sm text-subtle">{{ $t('v2.archi.route.sparesEmpty') }}</p>
          <div v-else class="flex flex-wrap gap-2">
            <div
              v-for="s in huntSpares"
              :key="s.id"
              class="flex items-center gap-2 rounded-md border border-line px-2 py-1"
              :title="$t('v2.archi.route.monsterTitle', { step: s.step, owned: s.owned, required: 1 })"
            >
              <img :src="s.image" :alt="''" class="size-5 shrink-0 rounded object-contain" @error="onImgErr">
              <span class="text-xs text-ink">{{ s.name }}</span>
              <span class="tabular text-xs text-subtle">{{ $t('v2.archi.route.stepLabel', { step: s.step }) }}</span>
              <UiBadge tone="positive">+{{ s.spare }}</UiBadge>
            </div>
          </div>
        </div>

        <!-- Lookup: where does this archi actually spawn, and can I get it with
             one fée at a zaap -->
        <div v-else-if="huntView === 'find'" class="flex max-h-[32rem] flex-col overflow-y-auto p-3">
          <UiInput
            v-model="huntFindQuery"
            size="sm"
            :placeholder="$t('v2.archi.route.findPlaceholder')"
            class="mb-3"
          >
            <template #prefix><UiIcon name="search" /></template>
          </UiInput>
          <p v-if="huntFindQuery && !huntFound.length" class="text-sm text-subtle">
            {{ $t('v2.archi.route.findEmpty') }}
          </p>
          <div v-else class="flex flex-col gap-3">
            <div v-for="f in huntFound" :key="f.id" class="rounded-md border border-line p-2">
              <div class="mb-1.5 flex items-center gap-2">
                <img :src="f.image" :alt="''" class="size-5 shrink-0 rounded object-contain" @error="onImgErr">
                <span class="text-sm font-medium text-ink">{{ f.name }}</span>
                <span class="tabular text-xs text-subtle">{{ $t('v2.archi.route.stepLabel', { step: f.step }) }}</span>
                <UiBadge v-if="f.status !== 'incomplete'" tone="positive">{{ $t('v2.archi.route.stepDone') }}</UiBadge>
              </div>
              <div class="flex flex-col gap-1">
                <div
                  v-for="spot in f.spots"
                  :key="`${f.id}-${spot.zone}-${spot.subzone}`"
                  class="flex items-baseline gap-2 text-xs"
                >
                  <UiBadge v-if="spot.atZaap" tone="positive">{{ $t('v2.archi.route.atZaap') }}</UiBadge>
                  <span class="text-ink">{{ spot.subzone }}</span>
                  <span class="min-w-0 flex-1 truncate text-subtle">
                    {{ spot.zaap
                      ? $t('v2.archi.route.viaZaap', { zaap: spot.zaap })
                      : $t('v2.archi.route.noZaap') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex max-h-[32rem] flex-col divide-y divide-line overflow-y-auto">
          <div v-for="spot in huntSpots" :key="spot.key" class="p-3">
            <div class="mb-2 flex items-baseline gap-2">
              <span class="text-sm font-medium text-ink">{{ spot.subzone }}</span>
              <span class="min-w-0 flex-1 truncate text-xs text-subtle">{{ spot.zone }}</span>
              <UiBadge>{{ spot.monsters.length }}</UiBadge>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="m in spot.monsters"
                :key="`${spot.key}-${m.id}`"
                type="button"
                :class="[
                  'flex cursor-pointer items-center gap-1.5 rounded-md border border-line px-2 py-1 transition-colors',
                  huntIsCooling(m.id) ? 'bg-accent-soft opacity-50' : 'hover:bg-sunken',
                ]"
                :aria-pressed="huntIsCooling(m.id)"
                :title="$t('v2.archi.route.monsterTitle', { step: m.step, owned: m.owned, required: m.required })"
                @click="huntCatch(m)"
              >
                <img :src="m.image" :alt="''" class="size-5 shrink-0 rounded object-contain" @error="onImgErr">
                <span :class="['text-xs text-ink', huntIsCooling(m.id) && 'line-through']">{{ m.name }}</span>
                <span class="tabular text-xs text-subtle">
                  {{ huntIsCooling(m.id)
                    ? $t('v2.archi.route.readyIn', { duration: huntCoolingLabel(m.id) })
                    : `${m.owned}/${m.required}` }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </UiCard>

    </template>

    <!-- ══ Sell ═══════════════════════════════════════════════════════════ -->
    <template v-else>
      <UiStatRow>
        <UiStat
          :label="$t('v2.archi.sell.forSale')"
          :value="pendingItems.length"
          :sub="$t('v2.archi.sell.totalValue', { amount: formatKamas(totalPendingValue) })"
        />
        <UiStat
          :label="$t('v2.archi.sell.slowMoving')"
          :value="slowMovingItems.length"
          :tone="slowMovingItems.length > 0 ? 'negative' : 'neutral'"
        >
          <template #default>
            <div class="flex items-center gap-2">
              <span :class="['tabular text-xl font-semibold', slowMovingItems.length > 0 ? 'text-negative' : 'text-ink']">
                {{ slowMovingItems.length }}
              </span>
              <UiSelect
                v-model="slowMovingDays"
                :options="slowMovingDayOptions"
                size="sm"
                class="w-24"
                :aria-label="$t('v2.archi.sell.slowThreshold')"
              />
            </div>
          </template>
        </UiStat>
        <UiStat :label="$t('v2.archi.sell.todaySales')" :value="todaySales.length" :sub="formatKamas(todayTotal)" />
        <UiStat
          :label="$t('v2.archi.sell.totalEarned')"
          :sub="$t('v2.archi.sell.salesCount', { count: soldItems.length })"
        >
          <UiMoney :value="totalEarned" short size="lg" />
        </UiStat>
      </UiStatRow>

      <!-- Add to queue -->
      <UiCard :title="$t('v2.archi.sell.addTitle')">
        <div class="flex flex-wrap items-end gap-2">
          <UiField :label="$t('v2.archi.sell.monster')" class="min-w-56 flex-1">
            <div ref="monsterAutoEl" class="relative">
              <UiInput
                v-model="searchMonster"
                :placeholder="$t('v2.archi.searchMonster')"
                @update:model-value="showDropdown = true; selectedMonster = null"
                @focus="showDropdown = true"
                @keyup.escape="showDropdown = false"
              >
                <template #prefix><UiIcon name="search" /></template>
              </UiInput>

              <div
                v-if="showDropdown && monsterSuggestions.length"
                class="absolute top-[calc(100%+0.25rem)] right-0 left-0 max-h-72 overflow-y-auto rounded-md border border-line bg-raised p-1 shadow-md"
                :style="{ zIndex: 'var(--z-dropdown)' }"
              >
                <button
                  v-for="s in monsterSuggestions"
                  :key="s.id"
                  type="button"
                  class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-sunken"
                  @mousedown.prevent="selectMonster(s)"
                >
                  <img :src="getMonsterImg(s)" :alt="''" class="size-6 shrink-0 rounded object-contain" @error="onImgErr">
                  <span class="min-w-0 flex-1 truncate text-sm text-ink">{{ s.nom }}</span>
                  <span class="shrink-0 text-xs text-subtle">{{ s.zone }}</span>
                </button>
              </div>
            </div>
          </UiField>

          <UiField :label="$t('v2.archi.sell.qty')" class="w-20">
            <UiNumberInput v-model="addQuantity" :min="1" />
          </UiField>

          <UiField :label="$t('v2.archi.sell.pricePerUnit')" class="w-40">
            <UiNumberInput v-model="addPrice" :min="0" />
          </UiField>

          <UiButton
            variant="primary"
            :disabled="!selectedMonster || addPrice <= 0 || addQuantity < 1"
            @click="addToQueue"
          >
            {{ $t('v2.archi.addToQueue') }}
          </UiButton>
        </div>

        <UiButton v-if="suggestedPrice > 0" variant="ghost" size="sm" class="mt-2" @click="addPrice = suggestedPrice">
          {{ $t('v2.archi.sell.suggested', { amount: formatKamas(suggestedPrice) }) }}
        </UiButton>
      </UiCard>

      <UiSegmented v-model="sellTab" :options="sellTabOptions" :aria-label="$t('v2.archi.sell.tabsLabel')" />

      <!-- ── Queue ────────────────────────────────────────────────────── -->
      <template v-if="sellTab === 'queue'">
        <div
          v-if="slowMovingItems.length"
          class="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 p-3"
        >
          <UiIcon name="alert" class="mt-0.5 shrink-0 text-warning" />
          <p class="text-sm text-muted">
            {{ $t('v2.archi.sell.slowWarning', { count: slowMovingItems.length, days: slowMovingDays }) }}
          </p>
        </div>

        <UiEmptyState
          v-if="!pendingItems.length"
          :title="$t('v2.archi.sell.queueEmpty')"
          :description="$t('v2.archi.sell.queueEmptyDesc')"
        >
          <template #icon><UiIcon name="items" /></template>
        </UiEmptyState>

        <div v-else class="flex flex-col gap-2">
          <div
            v-for="item in pendingItems"
            :key="item.id"
            :class="[
              'group flex flex-wrap items-center gap-3 rounded-lg border bg-surface p-2.5',
              isSlowMoving(item) ? 'border-warning/40' : 'border-line',
            ]"
          >
            <img :src="getMonsterImg(item)" :alt="''" loading="lazy" class="size-10 shrink-0 rounded-md bg-sunken object-contain" @error="onImgErr">

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm text-ink">{{ item.monsterName }}</p>
              <p class="flex items-center gap-1.5 text-xs text-subtle">
                {{ $t('v2.archi.sell.listedAgo', { days: daysSince(item.dateAdded) }) }}
                <UiBadge v-if="isSlowMoving(item)" tone="warning">{{ $t('v2.archi.sell.slow') }}</UiBadge>
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-1.5">
              <template v-if="editingPriceId === item.id">
                <UiNumberInput
                  v-model="editingPriceVal"
                  :min="0"
                  size="sm"
                  class="w-32"
                  @keyup.enter="savePrice(item)"
                  @keyup.escape="editingPriceId = null"
                />
                <UiButton variant="primary" size="sm" @click="savePrice(item)">{{ $t('prices.save') }}</UiButton>
                <UiButton variant="ghost" size="sm" @click="editingPriceId = null">{{ $t('v2.layout.cancel') }}</UiButton>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="tabular cursor-pointer rounded-md px-2 py-1 text-sm text-ink transition-colors hover:bg-sunken"
                  :title="$t('v2.archi.sell.editPrice')"
                  @click="startEditPrice(item)"
                >
                  {{ formatKamas(item.price) }}
                </button>
                <UiButton variant="secondary" size="sm" @click="markSold(item)">
                  <template #icon><UiIcon name="check" /></template>
                  {{ $t('v2.archi.sell.sold') }}
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="sm"
                  icon
                  class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  :aria-label="$t('v2.archi.route.remove')"
                  @click="removePending(item.id)"
                >
                  <UiIcon name="trash" />
                </UiButton>
              </template>
            </div>
          </div>
        </div>
      </template>

      <!-- ── History ──────────────────────────────────────────────────── -->
      <template v-else-if="sellTab === 'history'">
        <UiEmptyState v-if="!soldItems.length" :title="$t('v2.archi.sell.historyEmpty')">
          <template #icon><UiIcon name="kamas" /></template>
        </UiEmptyState>

        <template v-else>
          <div class="flex items-center gap-3">
            <span class="text-sm text-muted">{{ $t('v2.archi.sell.salesCount', { count: soldItems.length }) }}</span>
            <UiButton variant="danger" size="sm" class="ml-auto" @click="clearHistory">
              {{ $t('v2.archi.clearHistory') }}
            </UiButton>
          </div>

          <div class="flex flex-col gap-2">
            <div
              v-for="item in soldItems"
              :key="item.id"
              class="group flex items-center gap-3 rounded-lg border border-line bg-surface p-2.5"
            >
              <img :src="getMonsterImg(item)" :alt="''" loading="lazy" class="size-10 shrink-0 rounded-md bg-sunken object-contain" @error="onImgErr">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm text-ink">{{ item.monsterName }}</p>
                <p class="text-xs text-subtle">{{ $t('v2.archi.sell.soldOn', { date: formatDate(item.dateSold) }) }}</p>
              </div>
              <UiMoney :value="item.soldPrice ?? item.price" short />
              <UiButton
                variant="ghost"
                size="sm"
                class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                @click="undoSale(item)"
              >
                {{ $t('v2.archi.sell.undo') }}
              </UiButton>
            </div>
          </div>
        </template>
      </template>

      <!-- ── Analytics ────────────────────────────────────────────────── -->
      <template v-else>
        <UiSegmented v-model="analyticsTab" :options="analyticsTabOptions" size="sm" :aria-label="$t('v2.archi.analytics')" />

        <!-- Sales performance -->
        <template v-if="analyticsTab === 'performance'">
          <UiStatRow>
            <UiStat :label="$t('v2.archi.stats.uniqueMonsters')" :value="analyticsData.uniqueMonsters" :sub="$t('v2.archi.stats.typesSold')" />
            <UiStat
              :label="$t('v2.archi.stats.bestSeller')"
              :value="analyticsData.bestSeller?.name || '—'"
              :sub="$t('v2.archi.sell.soldCount', { count: analyticsData.bestSeller?.quantity ?? 0 })"
            />
            <UiStat
              :label="$t('v2.archi.stats.topRevenue')"
              :value="analyticsData.highestRevenue?.name || '—'"
              :sub="formatKamas(analyticsData.highestRevenue?.revenue ?? 0)"
            />
            <UiStat :label="$t('v2.archi.stats.avgPrice')" :sub="$t('v2.archi.stats.perUnit')">
              <UiMoney :value="Math.round(analyticsData.avgSalePrice)" short size="lg" />
            </UiStat>
          </UiStatRow>

          <UiToolbar>
            <template #filters>
              <UiSelect v-model="analyticsSortBy" :options="analyticsSortOptions" size="sm" class="w-44" :aria-label="$t('v2.archi.stats.sortBy')" />
              <UiSelect v-model="analyticsTimeframe" :options="timeframeOptions" size="sm" class="w-40" :aria-label="$t('v2.archi.stats.timeframe')" />
            </template>
          </UiToolbar>

          <UiEmptyState
            v-if="!filteredAnalyticsData.length"
            :title="$t('v2.archi.stats.noData')"
            :description="$t('v2.archi.stats.noDataDesc')"
          >
            <template #icon><UiIcon name="prices" /></template>
          </UiEmptyState>

          <div v-else class="flex flex-col gap-2">
            <div
              v-for="(monster, idx) in filteredAnalyticsData"
              :key="monster.name"
              class="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-2.5"
            >
              <span class="tabular w-6 shrink-0 text-center text-sm text-subtle">{{ idx + 1 }}</span>
              <img :src="getMonsterImg(monster)" :alt="''" loading="lazy" class="size-9 shrink-0 rounded-md bg-sunken object-contain" @error="onImgErr">

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm text-ink">{{ monster.name }}</p>
                <UiProgress
                  :value="monster.quantity"
                  :max="filteredAnalyticsData[0]?.quantity || 1"
                  tone="neutral"
                  class="mt-1"
                />
              </div>

              <dl class="flex shrink-0 gap-4 text-xs">
                <div class="text-right">
                  <dt class="text-subtle">{{ $t('v2.archi.sell.soldLabel') }}</dt>
                  <dd class="tabular text-ink">{{ monster.quantity }}</dd>
                </div>
                <div class="text-right">
                  <dt class="text-subtle">{{ $t('v2.archi.stats.revenue') }}</dt>
                  <dd class="tabular text-ink">{{ formatKamas(monster.revenue) }}</dd>
                </div>
                <div class="text-right">
                  <dt class="text-subtle">{{ $t('v2.archi.stats.avg') }}</dt>
                  <dd class="tabular text-ink">{{ formatKamas(Math.round(monster.avgPrice)) }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </template>

        <!-- Price trends -->
        <template v-else-if="analyticsTab === 'trends'">
          <UiToolbar>
            <template #filters>
              <UiSelect v-model="trendTimeframe" :options="timeframeOptions" size="sm" class="w-40" :aria-label="$t('v2.archi.stats.timeframe')" />
              <UiSelect v-model="selectedTrendMonster" :options="trendMonsterOptions" size="sm" class="w-48" :aria-label="$t('v2.archi.stats.monster')" />
            </template>
          </UiToolbar>

          <UiEmptyState
            v-if="!filteredPriceTrends.length"
            :title="$t('v2.archi.stats.notEnoughData')"
            :description="$t('v2.archi.stats.notEnoughDataDesc')"
          >
            <template #icon><UiIcon name="prices" /></template>
          </UiEmptyState>

          <div v-else class="flex flex-col gap-2">
            <div
              v-for="trend in filteredPriceTrends"
              :key="trend.name"
              class="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-2.5"
            >
              <img :src="getMonsterImg(trend)" :alt="''" loading="lazy" class="size-9 shrink-0 rounded-md bg-sunken object-contain" @error="onImgErr">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm text-ink">{{ trend.name }}</p>
                <p class="truncate text-xs text-subtle">
                  {{ $t('v2.archi.sell.salesCount', { count: trend.salesCount }) }}
                  · {{ formatDate(trend.firstDate) }} → {{ formatDate(trend.latestDate) }}
                </p>
              </div>
              <dl class="flex shrink-0 gap-4 text-xs">
                <div class="text-right">
                  <dt class="text-subtle">{{ $t('v2.archi.stats.first') }}</dt>
                  <dd class="tabular text-ink">{{ formatKamas(trend.firstPrice) }}</dd>
                </div>
                <div class="text-right">
                  <dt class="text-subtle">{{ $t('prices.latest') }}</dt>
                  <dd class="tabular text-ink">{{ formatKamas(trend.latestPrice) }}</dd>
                </div>
              </dl>
              <UiBadge :tone="trendTone(trend.priceChange)">
                {{ trendLabel(trend.priceChange) }} ({{ trend.priceChange > 0 ? '+' : '' }}{{ Math.round(trend.priceChange) }}%)
              </UiBadge>
            </div>
          </div>
        </template>

        <!-- Inconsistencies -->
        <template v-else>
          <UiEmptyState
            v-if="!pricingInconsistencies.length"
            :title="$t('v2.archi.stats.consistentTitle')"
            :description="$t('v2.archi.stats.consistentDesc')"
          >
            <template #icon><UiIcon name="check" /></template>
          </UiEmptyState>

          <div v-else class="flex flex-col gap-3">
            <UiCard v-for="inc in pricingInconsistencies" :key="inc.name">
              <div class="flex flex-wrap items-center gap-3">
                <img :src="getMonsterImg(inc)" :alt="''" loading="lazy" class="size-9 shrink-0 rounded-md bg-sunken object-contain" @error="onImgErr">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-ink">{{ inc.name }}</p>
                  <p class="truncate text-xs text-subtle">
                    {{ $t('v2.archi.stats.listings', { count: inc.items.length }) }}
                    · {{ $t('v2.archi.stats.differentPrices', { count: inc.priceGroups.length }) }}
                    · {{ $t('v2.archi.stats.variation', { pct: inc.priceVariation }) }}
                  </p>
                </div>
                <dl class="flex shrink-0 gap-4 text-xs">
                  <div class="text-right">
                    <dt class="text-subtle">{{ $t('v2.archi.stats.min') }}</dt>
                    <dd class="tabular text-ink">{{ formatKamas(inc.minPrice) }}</dd>
                  </div>
                  <div class="text-right">
                    <dt class="text-subtle">{{ $t('v2.archi.stats.avg') }}</dt>
                    <dd class="tabular text-ink">{{ formatKamas(inc.avgPrice) }}</dd>
                  </div>
                  <div class="text-right">
                    <dt class="text-subtle">{{ $t('v2.archi.stats.max') }}</dt>
                    <dd class="tabular text-ink">{{ formatKamas(inc.maxPrice) }}</dd>
                  </div>
                </dl>
              </div>

              <div class="mt-2.5 flex flex-wrap gap-1.5">
                <UiBadge v-for="g in inc.priceGroups" :key="g.price">
                  {{ formatKamas(g.price) }} ×{{ g.count }}
                </UiBadge>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <UiButton size="sm" @click="standardizePrices(inc.name, inc.minPrice)">
                  {{ $t('v2.archi.stats.setLowest', { amount: formatKamas(inc.minPrice) }) }}
                </UiButton>
                <UiButton size="sm" @click="standardizePrices(inc.name, inc.avgPrice)">
                  {{ $t('v2.archi.stats.setAvg', { amount: formatKamas(inc.avgPrice) }) }}
                </UiButton>
                <UiButton size="sm" @click="standardizePrices(inc.name, inc.maxPrice)">
                  {{ $t('v2.archi.stats.setHighest', { amount: formatKamas(inc.maxPrice) }) }}
                </UiButton>
              </div>
            </UiCard>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import monstersJson from '@/data/monsters.json'
import subzoneZaaps from '@/data/subzoneZaaps.json'
import subzoneGeo from '@/data/subzoneGeo.json'
import { slugName } from '@/utils/slugName'
import { orderStopsByWalk, zaapSubzone } from '@/utils/huntRoute'
import { nearestStep, stepProgress } from '@/utils/huntSteps'
import { findSpawns, listSpares } from '@/utils/huntQuery'
import {
  addCapture,
  addSweep,
  cooldownLeftMs,
  emptyHuntLog,
  loadHuntLog,
  pruneLog,
  removeLatestCapture,
  saveHuntLog,
  sweepFactor,
  sweptAgoMs,
} from '@/utils/huntLog'
import { formatDuration } from '@/utils/format'

const { appendActivity } = useAppDataStore()
const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()
const { t } = useI18n()

interface BrowserMetamobCredentials {
  username: string
  token: string
  questSlug: string
}

const METAMOB_SESSION_KEY = 'metamob-connection-v1'
const metamobCredentials = ref<BrowserMetamobCredentials | null>(null)
const metamobConnectionOpen = ref(false)
const metamobConnecting = ref(false)
const metamobConnectionError = ref('')
const metamobDraft = reactive<BrowserMetamobCredentials>({ username: '', token: '', questSlug: '' })
const metamobConnected = computed(() => Boolean(metamobCredentials.value))

const metamobHeaders = (credentials: BrowserMetamobCredentials) => ({
  'x-metamob-token': credentials.token,
  'x-metamob-username': encodeURIComponent(credentials.username),
  'x-metamob-quest': encodeURIComponent(credentials.questSlug),
})

const metamobRequest = <T>(
  path: string,
  options: Record<string, any> = {},
  credentials = metamobCredentials.value,
) => {
  if (!credentials) throw new Error('MetaMob connection required')
  return $fetch<T>(path, {
    ...options,
    headers: { ...options.headers, ...metamobHeaders(credentials) },
  })
}

const restoreMetamobConnection = () => {
  const raw = sessionStorage.getItem(METAMOB_SESSION_KEY)
  if (!raw) return

  try {
    const saved = JSON.parse(raw)
    const username = String(saved?.username || '').trim()
    const token = String(saved?.token || '').trim()
    const questSlug = String(saved?.questSlug || '').trim()
    if (username && token) metamobCredentials.value = { username, token, questSlug }
  } catch {
    sessionStorage.removeItem(METAMOB_SESSION_KEY)
  }
}

const openMetamobConnection = () => {
  metamobConnectionError.value = ''
  metamobDraft.username = metamobCredentials.value?.username || ''
  metamobDraft.token = metamobCredentials.value?.token || ''
  metamobDraft.questSlug = metamobCredentials.value?.questSlug || ''
  metamobConnectionOpen.value = true
}

// ── Shared ──────────────────────────────────────────────────────────────────
const mode = ref<'dofus-ocre' | 'sell' | 'route-planner'>('dofus-ocre')
const loading = ref(true)
const monsters = ref<any[]>([])

// Metamob image cache: French name → full image URL
const metamobImgMap = ref<Record<string, string>>({})

const getMonsterImg = (m: any): string => {
  const name = m.nom ?? m.monsterName ?? m.name
  return (name ? metamobImgMap.value[name] : undefined) ?? m.image_url ?? ''
}

const onImgErr = (e: Event) => {
  const img = e.target as HTMLImageElement
  if (img.dataset.fb) return; img.dataset.fb = '1'; img.src = '/monster-fallback.svg'
}

const METAMOB_CACHE_KEY = 'metamob_img_map'

const loadMetamobImages = async (credentials = metamobCredentials.value) => {
  const cached = localStorage.getItem(METAMOB_CACHE_KEY)
  if (cached) {
    try { metamobImgMap.value = JSON.parse(cached) } catch { /* ignore */ }
    return
  }
  if (!credentials) return

  // Not cached yet — fetch from the proxy using this browser's connection.
  try {
    const map = await metamobRequest<Record<string, string>>('/api/metamob/monsters', {}, credentials)
    if (map && Object.keys(map).length > 0) {
      metamobImgMap.value = map
      localStorage.setItem(METAMOB_CACHE_KEY, JSON.stringify(map))
    }
  } catch {
    // monsters.json already carries fallback image URLs.
  }
}

// ── Dofus Ocre ───────────────────────────────────────────────────────────────
type OcreFilter = 'all' | 'missing' | 'done'

const search = ref('')
const filter = ref<OcreFilter>('all')
const typeFilter = ref('archimonstre')
const monsterTypeOptions = [
  { key: 'archimonstre', label: 'Archimonstres', value: 'archimonstre' },
  { key: 'monstre', label: 'Monstres', value: 'monstre' },
  { key: 'boss', label: 'Boss', value: 'boss' },
  { key: 'all', label: 'All types', value: 'all' },
]
const counts = reactive<Record<string, number>>({})

// ── Control options ───────────────────────────────────────────────────────
// Every either/or control on this page now renders as the same component,
// instead of pills in one place and a <select> in the next.
const modeOptions = computed(() => [
  { label: t('v2.archi.modes.ocre'), value: 'dofus-ocre' },
  { label: t('v2.archi.modes.sell'), value: 'sell' },
  { label: t('v2.archi.modes.route'), value: 'route-planner' },
])

const filterOptions = computed(() => [
  { label: t('v2.archi.filters.all'), value: 'all' },
  { label: t('v2.archi.filters.missing'), value: 'missing' },
  { label: t('v2.archi.filters.done'), value: 'done' },
])

const sellTabOptions = computed(() => [
  { label: `${t('v2.archi.queue')} (${pendingItems.value.length})`, value: 'queue' },
  { label: `${t('v2.archi.history')} (${soldItems.value.length})`, value: 'history' },
  { label: t('v2.archi.analytics'), value: 'analytics' },
])

const analyticsTabOptions = computed(() => [
  { label: t('v2.archi.stats.sales'), value: 'performance' },
  { label: t('v2.archi.stats.trends'), value: 'trends' },
  { label: `${t('v2.archi.stats.inconsistencies')}${pricingInconsistencies.value.length ? ` (${pricingInconsistencies.value.length})` : ''}`, value: 'inconsistencies' },
])

const trendTone = (change: number) => (change > 5 ? 'positive' : change < -5 ? 'negative' : 'neutral')
const trendLabel = (change: number) =>
  change > 5 ? t('v2.archi.stats.rising') : change < -5 ? t('v2.archi.stats.falling') : t('v2.archi.stats.stable')

/**
 * Counts are keyed by the *metamob* monster id, never by the monsters.json id —
 * the two disagree for 316 of the 332 monsters they share, so keying on the
 * local id would push quantities onto the wrong monsters upstream.
 *
 * monsters.json is the Retro list (636 rows) while the quest is Unity (337), so
 * ~300 monsters have no metamobId. They still count locally under a `local:`
 * key, which is deliberately non-numeric so it can never be mistaken for a
 * metamob id and is dropped before any push.
 */
const countKey = (m: any): string | number => m?.metamobId ?? `local:${m?.id}`

const isSyncable = (k: string | number) => Number.isFinite(Number(k))

const key = (m: any) =>
  `monster_count_${selectedServer.value?.id}_${selectedCharacter.value?.id}_${countKey(m)}`

const getCount = (m: any) => counts[countKey(m)] ?? 0

const ensureArchimonstresProgress = () => {
  if (!selectedCharacter.value) return null

  if (!selectedCharacter.value.archimonstresProgress) {
    selectedCharacter.value.archimonstresProgress = {
      mode: 'ocre',
      monsters: {},
      lastUpdated: new Date().toISOString(),
    }
  }

  return selectedCharacter.value.archimonstresProgress
}

const getStoredCountFromProgress = (monsterId: string | number) => {
  const entry = selectedCharacter.value?.archimonstresProgress?.monsters?.[String(monsterId)]
  if (!entry) return null
  if (typeof entry.count === 'number' && Number.isFinite(entry.count)) {
    return Math.max(0, entry.count)
  }
  return entry.captured ? 1 : 0
}

const persistMonsterCount = (monsterId: string | number, count: number) => {
  const progress = ensureArchimonstresProgress()
  if (!progress) return

  const normalizedCount = Math.max(0, Math.floor(count))
  const existing = progress.monsters[String(monsterId)]

  progress.mode = 'ocre'
  progress.monsters[String(monsterId)] = {
    captured: normalizedCount > 0,
    count: normalizedCount,
    sold: existing?.sold,
    notes: existing?.notes,
  }
  progress.lastUpdated = new Date().toISOString()
}

/**
 * Progress saved before the metamob rekey is filed under the monsters.json id.
 * Left alone it would silently reattach to whichever monster now holds that id,
 * so move each entry across once, keyed by the row it actually belongs to.
 */
const migrateProgressToMetamobIds = () => {
  const progress = ensureArchimonstresProgress()
  if (!progress) return

  monsters.value.forEach((m: any) => {
    const target = String(countKey(m))
    const legacy = String(m.id)
    if (target === legacy) return

    const entry = progress.monsters[legacy]
    if (!entry || progress.monsters[target]) return

    progress.monsters[target] = entry
    delete progress.monsters[legacy]
  })

  progress.lastUpdated = new Date().toISOString()
}

const loadCounts = () => {
  Object.keys(counts).forEach((monsterId) => {
    counts[monsterId] = 0
  })

  if (!monsters.value.length || !selectedCharacter.value) return
  let migratedLegacyData = false

  monsters.value.forEach(m => {
    const id = countKey(m)
    const progressCount = getStoredCountFromProgress(id)
    if (progressCount !== null) {
      counts[id] = progressCount
      return
    }

    const legacyCount = parseInt(localStorage.getItem(key(m)) ?? '0', 10)
    counts[id] = legacyCount
    if (legacyCount > 0) {
      persistMonsterCount(id, legacyCount)
      migratedLegacyData = true
    }
  })

  if (migratedLegacyData) {
    const progress = ensureArchimonstresProgress()
    if (progress) {
      progress.lastUpdated = new Date().toISOString()
    }
  }
}

const logMonsterCountActivity = (monster: any, previousCount: number, nextCount: number) => {
  if (!selectedServer.value?.id || !selectedCharacter.value?.id || previousCount === nextCount) return

  appendActivity({
    type: 'archimonstres',
    action: nextCount > previousCount ? 'count-increased' : 'count-decreased',
    serverId: String(selectedServer.value.id),
    characterId: String(selectedCharacter.value.id),
    title: monster.nom || 'Archimonstre',
    description: nextCount > previousCount
      ? `Count increased to ${nextCount}`
      : nextCount === 0
        ? 'Removed from tracked captures'
        : `Count decreased to ${nextCount}`,
    path: '/archimonstres',
    imageUrl: getMonsterImg(monster),
    meta: {
      // countKey, not monster.id: the local and metamob ids disagree for 316 of
      // the 332 shared rows, so the raw id would file the same monster under two
      // different numbers depending on which row the caller happened to hold.
      monsterId: countKey(monster),
      previousCount,
      nextCount,
    },
  })
}

// ── Metamob sync ────────────────────────────────────────────────────────────
// The counts map is keyed by the metamob monster id, so both directions are a
// plain id → quantity transfer. We pull on page open and push after any edit.
const metamobSync = reactive({
  state: 'idle' as 'idle' | 'pulling' | 'pushing' | 'ready' | 'error',
  characterName: '',
  error: '',
})

const metamobStatusLabel = computed(() => {
  if (metamobSync.state === 'pulling') return t('v2.archi.metamob.pulling')
  if (metamobSync.state === 'pushing') return t('v2.archi.metamob.pushing')
  if (metamobSync.state === 'error') return t('v2.archi.metamob.syncError')
  return t('v2.archi.metamob.connectedAs', {
    name: metamobSync.characterName || metamobCredentials.value?.username || '',
  })
})

// Never push before a pull succeeded — otherwise a failed pull would overwrite
// the metamob collection with whatever empty state the app started with.
let metamobPullOk = false
let metamobPushTimer: ReturnType<typeof setTimeout> | null = null

type MetamobQuestResponse = { characterName: string, counts: Record<string, number> }

const applyMetamobQuest = (res: MetamobQuestResponse) => {
  Object.entries(res.counts ?? {}).forEach(([monsterId, quantity]) => {
    counts[monsterId] = quantity
    persistMonsterCount(monsterId, quantity)
    // Match on metamobId — monsters.json ids are a different numbering.
    const m = monsters.value.find((x: any) => String(x.metamobId) === monsterId)
    if (m) localStorage.setItem(key(m), String(quantity))
  })
  metamobSync.characterName = res.characterName ?? ''
}

const pullFromMetamob = async (credentials = metamobCredentials.value) => {
  if (!credentials) return false
  metamobSync.state = 'pulling'
  metamobSync.error = ''
  try {
    const res = await metamobRequest<MetamobQuestResponse>('/api/metamob/quest', {}, credentials)
    applyMetamobQuest(res)
    metamobSync.state = 'ready'
    metamobPullOk = true
    return true
  } catch {
    metamobSync.state = 'error'
    metamobSync.error = t('v2.archi.metamob.connectionFailed')
    return false
  }
}

const pushToMetamob = async () => {
  if (!metamobPullOk || !metamobCredentials.value) return
  metamobSync.state = 'pushing'
  try {
    // Retro-only monsters carry a `local:` key and have no metamob counterpart.
    const syncable = Object.fromEntries(Object.entries(counts).filter(([id]) => isSyncable(id)))
    await metamobRequest('/api/metamob/quest', { method: 'PATCH', body: { counts: syncable } })
    metamobSync.state = 'ready'
  } catch {
    metamobSync.state = 'error'
    metamobSync.error = t('v2.archi.metamob.syncFailed')
  }
}

// Coalesce rapid +/- clicks into one batch request.
const queueMetamobPush = () => {
  if (!metamobConnected.value) return
  if (metamobPushTimer) clearTimeout(metamobPushTimer)
  metamobPushTimer = setTimeout(pushToMetamob, 1500)
}

const connectMetamob = async () => {
  const candidate = {
    username: metamobDraft.username.trim(),
    token: metamobDraft.token.trim(),
    questSlug: metamobDraft.questSlug.trim(),
  }
  if (!candidate.username || !candidate.token) return

  const previousCredentials = metamobCredentials.value
  const previousPullOk = metamobPullOk
  metamobConnecting.value = true
  metamobConnectionError.value = ''
  metamobPullOk = false

  try {
    if (!await pullFromMetamob(candidate)) {
      metamobPullOk = previousPullOk
      metamobSync.state = previousCredentials ? 'ready' : 'idle'
      metamobSync.error = ''
      metamobConnectionError.value = t('v2.archi.metamob.connectionFailed')
      return
    }

    metamobCredentials.value = candidate
    sessionStorage.setItem(METAMOB_SESSION_KEY, JSON.stringify(candidate))
    metamobConnectionOpen.value = false
    await Promise.all([loadMetamobImages(candidate), loadHuntZones(candidate)])
  } finally {
    metamobConnecting.value = false
  }
}

const disconnectMetamob = () => {
  if (metamobPushTimer) clearTimeout(metamobPushTimer)
  metamobPushTimer = null
  metamobPullOk = false
  metamobCredentials.value = null
  metamobSync.state = 'idle'
  metamobSync.characterName = ''
  metamobSync.error = ''
  metamobConnectionError.value = ''
  sessionStorage.removeItem(METAMOB_SESSION_KEY)
  huntZones.value = []
  huntError.value = t('v2.archi.metamob.connectForPlanner')
  metamobConnectionOpen.value = false
}

// ── Hunt log ────────────────────────────────────────────────────────────────
// When each archi was captured, so the planner can stop suggesting one you just
// took. Written from inc/dec rather than from the planner chip: every capture
// path goes through here, and because the respawn counter is per-archimonster
// and server-wide, the monster id and a timestamp are the whole record — no
// location needed.
const huntLog = ref(emptyHuntLog())

/**
 * How long a captured archi stays "gone", in hours.
 *
 * Nobody outside Ankama knows this number. It scales with server population and
 * is tuned per server, and the widely-repeated "2-3h" is folklore traceable to
 * an uncited wiki line — hence a setting rather than a constant, and hence the
 * "est." on every surface that shows it.
 */
const HUNT_COOLDOWN_KEY = 'archi_cooldown_hours'
const huntCooldownHours = ref(3)
const huntCooldownMs = computed(() => Math.max(0, huntCooldownHours.value) * 60 * 60_000)

// Drives every countdown on the page. One timer, coarse on purpose: the value
// is an estimate, so a per-second countdown would imply precision it lacks.
const huntNow = ref(Date.now())
let huntClock: ReturnType<typeof setInterval> | null = null

const writeHuntLog = (next: typeof huntLog.value) => {
  huntLog.value = pruneLog(next, huntCooldownMs.value)
  if (selectedServer.value?.id && selectedCharacter.value?.id) {
    saveHuntLog(selectedServer.value.id, selectedCharacter.value.id, huntLog.value)
  }
}

const saveCount = (m: any) => {
  const id = countKey(m)
  const count = counts[id] ?? 0
  persistMonsterCount(id, count)
  localStorage.setItem(key(m), String(count))
  if (isSyncable(id)) queueMetamobPush()
}
const inc = (m: any) => {
  const id = countKey(m)
  const previousCount = counts[id] ?? 0
  counts[id] = previousCount + 1
  saveCount(m)
  // Retro-only rows have no metamob id, so no cooldown to model.
  if (isSyncable(id)) writeHuntLog(addCapture(huntLog.value, Number(id)))
  logMonsterCountActivity(m, previousCount, counts[id] ?? 0)
}
const dec = (m: any) => {
  const id = countKey(m)
  const current = counts[id] ?? 0
  if (current > 0) {
    const previousCount = current
    counts[id] = current - 1
    saveCount(m)
    if (isSyncable(id)) writeHuntLog(removeLatestCapture(huntLog.value, Number(id)))
    logMonsterCountActivity(m, previousCount, counts[id] ?? 0)
  }
}

const visible = computed(() => {
  if (!monsters.value) return []
  return monsters.value.filter(m => {
    if (typeFilter.value !== 'all' && m.type !== typeFilter.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      if (!m.nom?.toLowerCase().includes(q) && !m.zone?.toLowerCase().includes(q)) return false
    }
    if (filter.value === 'done' && getCount(m) === 0) return false
    if (filter.value === 'missing' && getCount(m) > 0) return false
    return true
  })
})

// Progress counts always scoped to archimonstres only (regardless of type filter)
const archiMonsters = computed(() => monsters.value.filter(m => m.type === 'archimonstre'))
const completedCount = computed(() => archiMonsters.value.filter(m => getCount(m) > 0).length)
const zeroCount = computed(() => archiMonsters.value.filter(m => getCount(m) === 0).length)
const oneCount = computed(() => archiMonsters.value.filter(m => getCount(m) === 1).length)
const manyCount = computed(() => archiMonsters.value.filter(m => getCount(m) >= 2).length)
const pct = computed(() =>
  archiMonsters.value.length > 0 ? Math.round((completedCount.value / archiMonsters.value.length) * 100) : 0
)

// ── Sell Mode ─────────────────────────────────────────────────────────────────
interface PendingItem {
  id: string
  monsterId: string | number
  monsterName: string
  image_url: string
  price: number
  quantity: number
  originalPrice: number
  dateAdded: string
}
interface SoldItem extends PendingItem {
  dateSold: string
  soldPrice: number
}
const sellTab = ref<'queue' | 'history' | 'analytics'>('queue')
const pendingItems = ref<PendingItem[]>([])
const soldItems = ref<SoldItem[]>([])
const priceHistory = ref<Record<string, number[]>>({})
const slowMovingDays = ref(7)
const slowMovingDayOptions = [1, 3, 5, 7, 10, 14, 21, 30].map(days => ({
  key: String(days),
  label: `${days} day${days === 1 ? '' : 's'}`,
  value: days,
}))

// Add form
const searchMonster = ref('')
const addQuantity = ref(1)
const addPrice = ref(0)
const selectedMonster = ref<any>(null)
const showDropdown = ref(false)
// Price editing
const editingPriceId = ref<string | null>(null)
const editingPriceVal = ref(0)

// Storage keys
const pendingKey = computed(() =>
  `selling_pending_${selectedServer.value?.id}_${selectedCharacter.value?.id}`
)
const soldKey = computed(() =>
  `selling_sold_${selectedServer.value?.id}_${selectedCharacter.value?.id}`
)
const historyKey = computed(() =>
  `selling_price_history_${selectedServer.value?.id}_${selectedCharacter.value?.id}`
)
const loadSellData = () => {
  if (!hasContext.value) return
  const pRaw = localStorage.getItem(pendingKey.value)
  const sRaw = localStorage.getItem(soldKey.value)
  const hRaw = localStorage.getItem(historyKey.value)
  pendingItems.value = pRaw ? JSON.parse(pRaw) : []
  soldItems.value = sRaw ? JSON.parse(sRaw) : []
  priceHistory.value = hRaw ? JSON.parse(hRaw) : {}
}

const savePending = () => localStorage.setItem(pendingKey.value, JSON.stringify(pendingItems.value))
const saveSold = () => localStorage.setItem(soldKey.value, JSON.stringify(soldItems.value))
const saveHistory = () => localStorage.setItem(historyKey.value, JSON.stringify(priceHistory.value))

const getSuggestions = (query: string, archiOnly = false) => {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  return monsters.value
    .filter((monster) => {
      if (archiOnly && monster.type !== 'archimonstre') return false
      return [
        monster.nom,
        monster.nom_normal,
        monster.zone,
        monster.souszone,
      ].some(value => value?.toLowerCase().includes(q))
    })
    .slice(0, 8)
}

// Monster autocomplete
const monsterSuggestions = computed(() => getSuggestions(searchMonster.value))

const suggestedPrice = computed(() => {
  if (!selectedMonster.value) return 0
  const hist = priceHistory.value[String(selectedMonster.value.id)] ?? []
  const last = hist[hist.length - 1]
  if (typeof last === 'number') return last
  return 0
})

const selectMonster = (m: any) => {
  selectedMonster.value = m
  searchMonster.value = m.nom
  showDropdown.value = false
  if (suggestedPrice.value > 0) addPrice.value = suggestedPrice.value
}

const addToQueue = () => {
  if (!selectedMonster.value || addPrice.value <= 0 || addQuantity.value < 1) return
  for (let i = 0; i < addQuantity.value; i++) {
    pendingItems.value.unshift({
      id: `${Date.now()}-${i}`,
      monsterId: selectedMonster.value.id,
      monsterName: selectedMonster.value.nom,
      image_url: selectedMonster.value.image_url,
      price: addPrice.value,
      quantity: 1,
      originalPrice: addPrice.value,
      dateAdded: new Date().toISOString(),
    })
  }
  savePending()
  searchMonster.value = ''
  selectedMonster.value = null
  addQuantity.value = 1
  addPrice.value = 0
}

const markSold = (item: PendingItem) => {
  const soldAt = new Date().toISOString()
  soldItems.value.unshift({ ...item, dateSold: soldAt, soldPrice: item.price })
  pendingItems.value = pendingItems.value.filter(p => p.id !== item.id)
  // Save price history
  const mid = String(item.monsterId)
  if (!priceHistory.value[mid]) priceHistory.value[mid] = []
  priceHistory.value[mid].push(item.price)
  if (priceHistory.value[mid].length > 10) priceHistory.value[mid].shift()
  if (selectedServer.value?.id && selectedCharacter.value?.id) {
    appendActivity({
      type: 'sales',
      action: 'sold',
      createdAt: soldAt,
      serverId: String(selectedServer.value.id),
      characterId: String(selectedCharacter.value.id),
      title: item.monsterName,
      description: `Sold for ${formatKamas(item.price)}`,
      path: '/archimonstres',
      imageUrl: item.image_url || '',
      meta: {
        monsterId: String(item.monsterId),
        price: item.price,
      },
    })
  }
  savePending(); saveSold(); saveHistory()
}

const removePending = (id: string) => {
  pendingItems.value = pendingItems.value.filter(p => p.id !== id)
  savePending()
}

const undoSale = (item: SoldItem) => {
  pendingItems.value.unshift({ ...item })
  soldItems.value = soldItems.value.filter(s => s.id !== item.id)
  savePending(); saveSold()
}

const clearHistory = () => {
  if (confirm('Clear all sales history? This cannot be undone.')) {
    soldItems.value = []
    saveSold()
  }
}

const startEditPrice = (item: PendingItem) => {
  editingPriceId.value = item.id
  editingPriceVal.value = item.price
}

const savePrice = (item: PendingItem) => {
  if (editingPriceVal.value > 0) {
    item.price = editingPriceVal.value
    savePending()
  }
  editingPriceId.value = null
}

// Stats
const totalPendingValue = computed(() => pendingItems.value.reduce((s, i) => s + (i.price ?? 0), 0))
const slowMovingItems = computed(() => {
  const threshold = slowMovingDays.value * 24 * 60 * 60 * 1000
  const now = Date.now()
  return pendingItems.value.filter(i => now - new Date(i.dateAdded).getTime() > threshold)
})
const isSlowMoving = (item: PendingItem) =>
  Date.now() - new Date(item.dateAdded).getTime() > slowMovingDays.value * 24 * 60 * 60 * 1000

const todaySales = computed(() => {
  const today = new Date().toDateString()
  return soldItems.value.filter(s => new Date(s.dateSold).toDateString() === today)
})
const todayTotal = computed(() => todaySales.value.reduce((s, i) => s + (i.soldPrice ?? 0), 0))
const totalEarned = computed(() => soldItems.value.reduce((s, i) => s + (i.soldPrice ?? 0), 0))

// Helpers
const formatKamas = (v: number) => {
  if (!v) return '0'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`
  return v.toLocaleString()
}

const daysSince = (dateStr: string) =>
  Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'today'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ── Analytics ─────────────────────────────────────────────────────────────────
const analyticsTab = ref<'performance' | 'trends' | 'inconsistencies'>('performance')
const analyticsSortBy = ref<'quantity' | 'revenue' | 'avgPrice' | 'frequency'>('quantity')
const analyticsTimeframe = ref<'all' | 'month' | 'week'>('all')
const trendTimeframe = ref<'all' | 'month' | 'week'>('all')
const selectedTrendMonster = ref('')
const analyticsSortOptions = [
  { key: 'quantity', label: 'Quantity', value: 'quantity' },
  { key: 'revenue', label: 'Revenue', value: 'revenue' },
  { key: 'avgPrice', label: 'Avg price', value: 'avgPrice' },
  { key: 'frequency', label: 'Sales count', value: 'frequency' },
]
const timeframeOptions = [
  { key: 'all', label: 'All time', value: 'all' },
  { key: 'month', label: 'This month', value: 'month' },
  { key: 'week', label: 'This week', value: 'week' },
]
const trendMonsterOptions = computed(() => [
  { key: 'all', label: 'All', value: '' },
  ...monstersWithPriceData.value.map(name => ({ key: name, label: name, value: name })),
])

const getFilteredSold = () => {
  const now = new Date()
  let filtered = [...soldItems.value]
  if (analyticsTimeframe.value === 'week') {
    const cut = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    filtered = filtered.filter(i => new Date(i.dateSold) >= cut)
  } else if (analyticsTimeframe.value === 'month') {
    const cut = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    filtered = filtered.filter(i => new Date(i.dateSold) >= cut)
  }
  return filtered
}

const buildMonsterStats = (items: SoldItem[]) => {
  const stats: Record<string, any> = {}
  items.forEach(item => {
    const n = item.monsterName
    if (!stats[n]) stats[n] = { name: n, image_url: item.image_url, quantity: 0, revenue: 0, salesCount: 0, prices: [] }
    stats[n].quantity += item.quantity ?? 1
    stats[n].revenue += (item.soldPrice ?? 0) * (item.quantity ?? 1)
    stats[n].salesCount += 1
    stats[n].prices.push(item.soldPrice ?? 0)
  })
  return Object.values(stats).map((m: any) => ({
    ...m,
    avgPrice: m.quantity > 0 ? m.revenue / m.quantity : 0,
    minPrice: Math.min(...m.prices),
    maxPrice: Math.max(...m.prices),
  }))
}

const analyticsData = computed(() => {
  const monsters = buildMonsterStats(getFilteredSold())
  if (!monsters.length) return { uniqueMonsters: 0, bestSeller: null, highestRevenue: null, avgSalePrice: 0 }
  const totalRev = monsters.reduce((s: number, m: any) => s + m.revenue, 0)
  const totalQty = monsters.reduce((s: number, m: any) => s + m.quantity, 0)
  return {
    uniqueMonsters: monsters.length,
    bestSeller: monsters.reduce((b: any, c: any) => c.quantity > (b?.quantity ?? 0) ? c : b, null),
    highestRevenue: monsters.reduce((b: any, c: any) => c.revenue > (b?.revenue ?? 0) ? c : b, null),
    avgSalePrice: totalQty > 0 ? totalRev / totalQty : 0,
  }
})

const filteredAnalyticsData = computed(() => {
  const monsters = buildMonsterStats(getFilteredSold())
  monsters.sort((a: any, b: any) => {
    if (analyticsSortBy.value === 'quantity') return b.quantity - a.quantity
    if (analyticsSortBy.value === 'revenue') return b.revenue - a.revenue
    if (analyticsSortBy.value === 'avgPrice') return b.avgPrice - a.avgPrice
    return b.salesCount - a.salesCount
  })
  return monsters
})

const monstersWithPriceData = computed(() => {
  const counts: Record<string, number> = {}
  soldItems.value.forEach(i => { counts[i.monsterName] = (counts[i.monsterName] ?? 0) + 1 })
  return Object.entries(counts).filter(([, c]) => c >= 2).map(([n]) => n).sort()
})

const filteredPriceTrends = computed(() => {
  const now = new Date()
  let filtered = [...soldItems.value]
  if (trendTimeframe.value === 'week') {
    const cut = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    filtered = filtered.filter(i => new Date(i.dateSold) >= cut)
  } else if (trendTimeframe.value === 'month') {
    const cut = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    filtered = filtered.filter(i => new Date(i.dateSold) >= cut)
  }
  if (selectedTrendMonster.value) filtered = filtered.filter(i => i.monsterName === selectedTrendMonster.value)

  const map: Record<string, any> = {}
  filtered.forEach(item => {
    const n = item.monsterName
    if (!map[n]) map[n] = { name: n, image_url: item.image_url, priceHistory: [], salesCount: 0 }
    map[n].priceHistory.push({ price: item.soldPrice, date: item.dateSold })
    map[n].salesCount++
  })
  return Object.values(map)
    .filter((m: any) => m.salesCount >= 2)
    .map((m: any) => {
      m.priceHistory.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      const prices = m.priceHistory.map((p: any) => p.price)
      const first = prices[0], latest = prices[prices.length - 1]
      return {
        ...m, firstPrice: first, latestPrice: latest,
        firstDate: m.priceHistory[0].date,
        latestDate: m.priceHistory[m.priceHistory.length - 1].date,
        priceChange: first > 0 ? ((latest - first) / first) * 100 : 0,
      }
    })
    .sort((a: any, b: any) => Math.abs(b.priceChange) - Math.abs(a.priceChange))
})

const pricingInconsistencies = computed(() => {
  const groups: Record<string, PendingItem[]> = {}
  pendingItems.value.forEach(item => {
    const bucket = groups[item.monsterName] ?? (groups[item.monsterName] = [])
    bucket.push(item)
  })
  const result: any[] = []
  Object.entries(groups).forEach(([name, items]) => {
    if (items.length < 2) return
    const prices = items.map(i => i.price)
    const unique = [...new Set(prices)]
    if (unique.length < 2) return
    const min = Math.min(...prices), max = Math.max(...prices)
    const variation = min > 0 ? ((max - min) / min) * 100 : 0
    if (variation <= 5) return
    const priceMap: Record<number, number> = {}
    prices.forEach(p => { priceMap[p] = (priceMap[p] ?? 0) + 1 })
    result.push({
      name, items,
      image_url: items[0]?.image_url ?? '',
      minPrice: min, maxPrice: max,
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      priceVariation: Math.round(variation),
      priceGroups: Object.entries(priceMap).map(([price, count]) => ({ price: Number(price), count })).sort((a, b) => a.price - b.price),
    })
  })
  return result.sort((a, b) => b.priceVariation - a.priceVariation)
})

const standardizePrices = (monsterName: string, targetPrice: number) => {
  pendingItems.value.forEach(item => {
    if (item.monsterName === monsterName) item.price = targetPrice
  })
  savePending()
}

// ── Init ──────────────────────────────────────────────────────────────────────
// v2 ships metamobId on every row. Anything cached at v1 predates it and would
// leave the whole page keyed on the wrong ids, so that cache must be replaced
// and the stored progress moved across before counts are read.
const MONSTERS_VERSION = 2

const init = () => {
  const ver = parseInt(localStorage.getItem('archimonstres-monsters-version') ?? '0', 10)
  const stale = ver < MONSTERS_VERSION

  if (stale) {
    monsters.value = monstersJson as any[]
    localStorage.setItem('archimonstres-monsters', JSON.stringify(monstersJson))
    localStorage.setItem('archimonstres-monsters-version', String(MONSTERS_VERSION))
  } else {
    const raw = localStorage.getItem('archimonstres-monsters')
    monsters.value = raw ? JSON.parse(raw) : (monstersJson as any[])
  }

  if (stale) migrateProgressToMetamobIds()

  loadCounts()
  loadSellData()
  loading.value = false
}

// ── Hunt planner (metamob zones) ────────────────────────────────────────────
// Ranks subzones by how many archi you still need there, so a run is "go to
// these subzones" instead of "here is every spawn in the game".
type HuntMonster = {
  id: number
  name: string
  image: string
  typeId: number
  step: number
  owned: number
  required: number
  status: 'validated' | 'completed' | 'incomplete'
}

const huntZones = ref<{ name: string, subzones: { id: number, name: string, monsters: HuntMonster[] }[] }[]>([])

/**
 * Where each metamob subzone actually is.
 *
 * Metamob gives no coordinates, no zaap and no dungeon flag, so those come from
 * DofusDB (app/data/subzoneGeo.json, rebuilt by scripts/fetch-subzone-geo.mjs).
 * subzoneZaaps.json survives for two reasons: it is the only place the metamob
 * subzone id is tied to a name, and DofusDB has no zaap for 15 subzones —
 * most of Astrub — where the hand-typed value is still the right answer.
 *
 * The join is on area + subzone, not subzone alone: there are two "Cimetière",
 * one in Amakna and one in Incarnam.
 */
type ZaapRow = { subzoneId: number, zone: string, subzone: string, zaap: string, skip: boolean }
type GeoRow = {
  slug: string, name: string, area: string, zaap: string | null,
  zaapX: number | null, zaapY: number | null, zaapWorld: number | null,
  x: number | null, y: number | null, world: number | null, dungeon: boolean
}
// `world` is the world-map layer the coordinates belong to. Without it a
// distance between two sous-zones can be arithmetic on unrelated grids.
type SubzoneGeo = {
  zaap: string, zaapX: number | null, zaapY: number | null, zaapWorld: number | null,
  x: number | null, y: number | null, world: number | null, dungeon: boolean
}

const huntGeo = computed(() => {
  const byPair = new Map<string, GeoRow>()
  const bySlug = new Map<string, GeoRow>()
  ;(subzoneGeo as GeoRow[]).forEach((row) => {
    byPair.set(`${slugName(row.area)}/${row.slug}`, row)
    if (!bySlug.has(row.slug)) bySlug.set(row.slug, row)
  })

  const map: Record<number, SubzoneGeo> = {}
  const unmatched: string[] = []

  // A sous-zone that other rows name as their zaap is its own zaap. DofusDB has
  // no zaap for any Astrub sous-zone, and the hand table fills "Cité d'Astrub"
  // in on the seven around it but leaves it blank on Cité d'Astrub itself — so
  // without this the zaap's own sous-zone splits into a separate group and its
  // archi never count as reachable on arrival.
  const zaapNames = new Set((subzoneZaaps as ZaapRow[]).map(r => slugName(r.zaap)).filter(Boolean))

  ;(subzoneZaaps as ZaapRow[]).forEach((row) => {
    const slug = slugName(row.subzone)
    const geo = byPair.get(`${slugName(row.zone)}/${slug}`) ?? bySlug.get(slug)
    if (!geo) { unmatched.push(row.subzone); return }

    map[row.subzoneId] = {
      // DofusDB wins; the hand value only fills the gaps it leaves. `||`, not
      // `??`: the hand table uses "" rather than null for "no zaap".
      zaap: geo.zaap || row.zaap || (zaapNames.has(slug) ? row.subzone : ''),
      zaapX: geo.zaapX,
      zaapY: geo.zaapY,
      zaapWorld: geo.zaapWorld,
      x: geo.x,
      y: geo.y,
      world: geo.world,
      dungeon: geo.dungeon,
    }
  })

  return { map, unmatched }
})
const huntCurrentStep = ref(0)
const huntLoading = ref(false)
const huntError = ref('')

const huntHideOwned = ref(true)
const huntArchiOnly = ref(true)
// Off by default: archi sit at steps above the quest's current step, so a
// "step <= current step" filter would hide every one of them.
const huntNextStepOnly = ref(false)
const huntZoneFilter = ref('')
// Folded into defaults — no longer user-toggleable, but still read by
// keepHuntMonster, huntNextStep and huntSpots, so the refs stay.
const huntRoamableOnly = ref(true)
const huntSort = ref<'total' | 'yield'>('total')
const huntView = ref<'route' | 'spots' | 'steps' | 'spares' | 'find'>('route')

/**
 * Which run you are actually doing.
 *
 * The fée d'artifice scans the sous-zone you are standing in, not the area
 * around it. Popping one at the zaap and moving on ("quick") therefore only
 * ever reaches the zaap's own sous-zone, and ranking by everything under the
 * zaap sends you to places worth nothing on that loop — Village côtier leads
 * the walk ranking with 31 archi and has none at the zaap itself.
 *
 * "walk" is the older behaviour: several sous-zones per zaap, a fée in each.
 */
const huntSweepMode = ref<'quick' | 'walk'>('quick')

/**
 * How far you are willing to move from a zaap, in map tiles.
 *
 * Quick mode used to show only the zaap's own sous-zone, which hid the point of
 * going: standing at Bord de la forêt maléfique there are ~47 archi within a
 * dozen tiles, and the app was showing 4. The rest were filed under other
 * zaaps, because DofusDB's zaap assignment says which zaap *owns* a sous-zone,
 * not what is near what.
 */
const HUNT_RADIUS_KEY = 'archi_hunt_radius'
const huntRadius = ref(10)

/** Where each zaap is, so a radius can be measured from it. */
const huntZaapPos = computed(() => {
  const pos: Record<string, { x: number, y: number, world: number | null }> = {}
  Object.values(huntGeo.value.map).forEach((g) => {
    if (!g.zaap || g.zaapX === null || g.zaapY === null) return
    if (!pos[g.zaap]) pos[g.zaap] = { x: g.zaapX, y: g.zaapY, world: g.zaapWorld }
  })
  return pos
})

const loadHuntZones = async (credentials = metamobCredentials.value) => {
  if (!credentials) {
    huntZones.value = []
    huntError.value = t('v2.archi.metamob.connectForPlanner')
    return
  }

  huntLoading.value = true
  huntError.value = ''
  try {
    const res = await metamobRequest<{ currentStep: number, zones: typeof huntZones.value }>(
      '/api/metamob/zones',
      {},
      credentials,
    )
    huntZones.value = res.zones ?? []
    huntCurrentStep.value = res.currentStep ?? 0

    // A rename upstream would silently drop a subzone to zone-level grouping,
    // and a metamob addition would drop it out of the route entirely.
    if (huntGeo.value.unmatched.length) {
      console.warn('No DofusDB geography for:', huntGeo.value.unmatched.join(', '))
    }
    const known = new Set((subzoneZaaps as ZaapRow[]).map(r => r.subzoneId))
    const missing = huntZones.value
      .flatMap(z => z.subzones.filter(s => !known.has(s.id)).map(s => s.name))
    if (missing.length) {
      console.warn('Subzones metamob reports but subzoneZaaps.json does not list:', missing.join(', '))
    }

    // Real today for Village de la Canopée (layer 10, zaap on the surface).
    // Those stops cannot be walk-ordered, so they sit at the tail — visible
    // here rather than as a route that quietly stops making sense.
    const crossLayer = Object.values(huntGeo.value.map)
      .filter(g => g.zaap && g.world !== null && g.zaapWorld !== null && g.world !== g.zaapWorld)
    if (crossLayer.length) {
      console.warn(`${crossLayer.length} subzones sit on a different world-map layer from their zaap; their stops are not distance-ordered.`)
    }
  } catch {
    huntError.value = t('v2.archi.metamob.zonesFailed')
  } finally {
    huntLoading.value = false
  }
}

/** Lowest step that still has something missing — the step you're actually on. */
const huntNextStep = computed(() => {
  let lowest = Infinity
  huntZones.value.forEach(zone => zone.subzones.forEach(sub => sub.monsters.forEach((m) => {
    if (m.status !== 'incomplete') return
    if (huntArchiOnly.value && m.typeId !== 3) return
    if (m.step < lowest) lowest = m.step
  })))
  return Number.isFinite(lowest) ? lowest : 0
})

/**
 * Which step the step filter targets: whatever the steps view last picked, or
 * the lowest incomplete one when nothing has been chosen.
 */
const huntStepFilter = ref<number | null>(null)
const huntTargetStep = computed(() => huntStepFilter.value ?? huntNextStep.value)

const keepHuntMonster = (m: HuntMonster) => {
  if (huntArchiOnly.value && m.typeId !== 3) return false
  if (huntHideOwned.value && m.status !== 'incomplete') return false
  if (huntNextStepOnly.value && huntTargetStep.value && m.step !== huntTargetStep.value) return false
  return true
}

/** Subzones that still have something worth farming, densest first. */
const huntSpots = computed(() => {
  const needle = huntZoneFilter.value.trim().toLowerCase()
  const spots: {
    key: string, subzoneId: number, zone: string, subzone: string,
    x: number | null, y: number | null, world: number | null, monsters: HuntMonster[]
  }[] = []

  huntZones.value.forEach((zone) => {
    zone.subzones.forEach((sub) => {
      const geo = huntGeo.value.map[sub.id]
      if (huntRoamableOnly.value && geo?.dungeon) return
      if (needle && !zone.name.toLowerCase().includes(needle) && !sub.name.toLowerCase().includes(needle)) return
      const monsters = sub.monsters.filter(keepHuntMonster)
      if (!monsters.length) return
      spots.push({
        key: `${zone.name}-${sub.id}`,
        subzoneId: sub.id,
        zone: zone.name,
        subzone: sub.name,
        x: geo?.x ?? null,
        y: geo?.y ?? null,
        world: geo?.world ?? null,
        monsters: monsters.sort((a, b) => a.step - b.step || a.name.localeCompare(b.name)),
      })
    })
  })

  return spots.sort((a, b) => b.monsters.length - a.monsters.length || a.zone.localeCompare(b.zone))
})

/**
 * Group the run by zaap, then pick the fewest subzones that still cover every
 * archi under it (greedy set cover), then order those stops into a walk.
 *
 * Each stop lists only the archi it is the *first* to cover, so an archi that
 * spawns in 11 subzones stops padding all 11 — which means a later stop can
 * legitimately show more monsters than an earlier one once the walk reorders
 * them. Set cover chooses the stops; distance only sorts them.
 */
const huntRoute = computed(() => {
  const byZone = new Map<string, typeof huntSpots.value>()
  huntSpots.value.forEach((spot) => {
    // Subzones DofusDB gives no zaap for fall back to their parent zone.
    const group = huntGeo.value.map[spot.subzoneId]?.zaap || spot.zone
    if (!byZone.has(group)) byZone.set(group, [])
    byZone.get(group)!.push(spot)
  })

  /**
   * Everything within the radius of a zaap, nearest first — regardless of which
   * zaap DofusDB says owns it.
   *
   * That ownership is the whole problem quick mode had: Forêt d'Amakna is five
   * tiles from Bord de la forêt maléfique but filed under Rivage sufokien, so
   * it was invisible from the group you were standing in. A sous-zone can
   * therefore appear under several zaaps here, which is correct — it really is
   * reachable from each of them.
   */
  const withinRadius = (zone: string) => {
    const at = huntZaapPos.value[zone]
    if (!at) return null
    const r2 = huntRadius.value ** 2
    return huntSpots.value
      .filter(s => s.x !== null && s.y !== null && s.world === at.world)
      .map(s => ({ ...s, dist: Math.hypot((s.x as number) - at.x, (s.y as number) - at.y) }))
      .filter(s => s.dist ** 2 <= r2)
      .sort((a, b) => a.dist - b.dist || b.monsters.length - a.monsters.length)
  }

  const zones = [...byZone.entries()].map(([zone, spots]) => {
    const remaining = new Set(spots.flatMap(s => s.monsters.map(m => m.id)))
    const total = remaining.size
    const stops: {
      key: string, subzone: string, x: number | null, y: number | null,
      world: number | null, monsters: HuntMonster[]
    }[] = []
    const pool = [...spots]

    while (remaining.size) {
      // Whichever subzone knocks out the most of what's still missing.
      let best: typeof pool[number] | null = null
      let bestNew: HuntMonster[] = []
      for (const spot of pool) {
        const gained = spot.monsters.filter(m => remaining.has(m.id))
        if (gained.length > bestNew.length) { best = spot; bestNew = gained }
      }
      if (!best || !bestNew.length) break

      stops.push({
        key: best.key, subzone: best.subzone,
        x: best.x, y: best.y, world: best.world, monsters: bestNew,
      })
      bestNew.forEach(m => remaining.delete(m.id))
      pool.splice(pool.indexOf(best), 1)
    }

    // You arrive at the zaap, so the walk starts there. Any spot in the group
    // carries the same zaap position.
    const origin = spots.map(s => huntGeo.value.map[s.subzoneId]).find(g => g?.zaapX != null)
    const walked = orderStopsByWalk(stops, {
      x: origin?.zaapX ?? null,
      y: origin?.zaapY ?? null,
      // Stops on a different layer from the zaap cannot be distance-sorted
      // against it; orderStopsByWalk parks them at the tail instead.
      world: origin?.zaapWorld ?? null,
    })

    // Read from `spots`, not from `stops`: set cover assigns each archi to the
    // first stop that covers it, so the sous-zone you actually land in is often
    // not among the chosen stops even when it holds archi you need.
    const landing = zaapSubzone(spots, zone)

    // Zaaps with no coordinates (Astrub's, which DofusDB has no zaap map for)
    // cannot have a radius measured, so they keep the assigned-zaap grouping.
    const nearby = withinRadius(zone) ?? spots.map(s => ({ ...s, dist: 0 }))

    return { zone, total, stops: walked, landing, nearby }
  })

  // An archi that spawns under only one zaap makes that trip mandatory — you
  // cannot pick it up anywhere else, however poor the rest of the group is.
  const groupsPerMonster = new Map<number, number>()
  zones.forEach(z => new Set(z.stops.flatMap(s => s.monsters.map(m => m.id)))
    .forEach(id => groupsPerMonster.set(id, (groupsPerMonster.get(id) ?? 0) + 1)))

  const ranked = zones.map((z) => {
    const ids = new Set(z.stops.flatMap(s => s.monsters.map(m => m.id)))
    const exclusive = new Set(ids)
    exclusive.forEach((id) => { if ((groupsPerMonster.get(id) ?? 0) > 1) exclusive.delete(id) })

    // The richest stop, not the first one — the walk order no longer puts the
    // biggest stop at the front.
    const topStop = z.stops.reduce((n, s) => Math.max(n, s.monsters.length), 0)

    // What is actually catchable right now. `total` stays what it always was —
    // everything still missing here — so the two numbers together read as
    // "31 archi, 24 of them available".
    const ready = [...ids].filter(id => !huntCooling.value.has(id)).length

    // What one fée at the zaap itself reaches — kept as a separate figure so
    // "4 at the zaap, 47 within 10" can both be shown.
    const ownMonsters = z.landing?.monsters ?? []
    const ownReady = ownMonsters.filter(m => !huntCooling.value.has(m.id)).length

    // Everything inside the radius, deduped: one archi spawning in six of the
    // nearby sous-zones is still one archi to catch.
    //
    // An archi is only discounted when *every* nearby sous-zone holding it has
    // been swept — if it also spawns somewhere you have not checked, it is
    // still there to find. That is why the weight is a max, not a product.
    const weights = new Map<number, number>()
    z.nearby.forEach((spot) => {
      const w = sweepFactor(huntLog.value, spot.key, huntNow.value)
      spot.monsters.forEach(m => weights.set(m.id, Math.max(weights.get(m.id) ?? 0, w)))
    })

    const near = weights.size
    const nearReady = [...weights.entries()]
      .filter(([id, w]) => w === 1 && !huntCooling.value.has(id)).length
    const nearScore = [...weights.entries()]
      .reduce((sum, [id, w]) => sum + (huntCooling.value.has(id) ? 0 : w), 0)

    const counted = huntSweepMode.value === 'quick' ? nearScore : ready

    return {
      ...z,
      ready,
      own: ownMonsters.length,
      ownReady,
      near,
      nearReady,
      // Sweeps already discounted per sous-zone inside `counted`; applying a
      // group-level factor on top would penalise the same check twice.
      score: counted,
      // How much of this group you have already checked, shown in the header so
      // "I've done most of this one" is visible without expanding it.
      sweptSpots: z.nearby.filter(s => huntIsSwept(s.key)).length,
      // How much you get per subzone you actually have to walk.
      yield: z.stops.length ? z.total / z.stops.length : 0,
      exclusive: exclusive.size,
      // Most of the value sits in one stop: tele, sweep one map, leave.
      oneShot: z.total > 0 && z.stops.length > 1 && topStop / z.total >= 0.6,
    }
  })

  // Ranking runs on `score` (cooldowns and sweeps applied); `total` and `yield`
  // stay untouched as the honest "what is here" figures the UI displays.
  //
  // The yield sort is meaningless in quick mode — every group is one stop by
  // definition — so it only splits the ranking on a walk.
  return huntSort.value === 'yield' && huntSweepMode.value === 'walk'
    ? ranked.sort((a, b) =>
        (b.score / (b.stops.length || 1)) - (a.score / (a.stops.length || 1)) || b.score - a.score)
    : ranked.sort((a, b) => b.score - a.score || a.zone.localeCompare(b.zone))
})

const huntRouteTotals = computed(() => ({
  zones: huntRoute.value.length,
  stops: huntRoute.value.reduce((n, z) => n + z.stops.length, 0),
}))

/** The trip to make next — whichever group the active sort put first. */
const huntTopGroup = computed(() => huntRoute.value[0] ?? null)

/**
 * Archi you have taken recently and that therefore cannot be caught again yet.
 *
 * This replaces what used to be a session-only Set of ticked chips. Deriving it
 * from the hunt log instead means a ticked chip survives a reload, which is what
 * you want halfway through a run — and it costs nothing, because "captured
 * within the cooldown" and "ticked just now" are the same fact.
 *
 * The old invariant still holds: huntSpots filters on metamob's `status`, which
 * does not change on a tick, so nothing may call loadHuntZones() mid-run or the
 * chips will vanish underneath you.
 */
const huntCooling = computed(() => {
  const map = new Map<number, number>()
  huntLog.value.captures.forEach((c) => {
    if (map.has(c.m)) return
    const left = cooldownLeftMs(huntLog.value, c.m, huntCooldownMs.value, huntNow.value)
    if (left > 0) map.set(c.m, left)
  })
  return map
})

const huntIsCooling = (id: number) => huntCooling.value.has(id)

/**
 * "~2h 10m" — always behind a "~", never a precise countdown.
 *
 * formatDuration floors to whole minutes, so the last minute would render as
 * the confusing "~0m"; under a minute it is effectively back anyway.
 */
const huntCoolingLabel = (id: number) => {
  const left = huntCooling.value.get(id) ?? 0
  return left < 60_000 ? t('v2.archi.route.readySoon') : formatDuration(left)
}

const huntCatch = (m: HuntMonster) => {
  // Same row the Ocre grid uses, so the activity log gets a name and an image.
  const row = monsters.value.find((x: any) => x.metamobId === m.id)
    ?? { id: m.id, metamobId: m.id, nom: m.name, image_url: m.image }

  // inc/dec write the hunt log themselves, so the cooling state follows.
  huntIsCooling(m.id) ? dec(row) : inc(row)
}

// ── Sweeps ──────────────────────────────────────────────────────────────────
// "I stood at this zaap, popped a fairy, nothing." Weak evidence — an archi can
// drop into a group a minute after you leave — so it only ever nudges the
// ranking down and expires within the hour.
const huntSweep = (spotKey: string) => writeHuntLog(addSweep(huntLog.value, spotKey))

const huntIsSwept = (spotKey: string) =>
  sweptAgoMs(huntLog.value, spotKey, huntNow.value) !== null

/** The whole phrase, because "just now" does not take an "ago". */
const huntSweptLabel = (spotKey: string) => {
  const ago = sweptAgoMs(huntLog.value, spotKey, huntNow.value)
  if (ago === null) return ''
  // The clock ticks once a minute, so a fresh tap sits at "0m" for a while.
  return ago < 60_000
    ? t('v2.archi.route.sweptNow')
    : t('v2.archi.route.sweptAgo', { duration: formatDuration(ago) })
}

// ── Group collapsing ────────────────────────────────────────────────────────
const huntOpen = ref(new Set<string>())
let huntLastTop: string | null = null

const huntIsOpen = (zone: string) => huntOpen.value.has(zone)

const huntToggle = (zone: string) => {
  const next = new Set(huntOpen.value)
  next.has(zone) ? next.delete(zone) : next.add(zone)
  huntOpen.value = next
}

// Follow the ranking when it genuinely changes, but leave manual expansions
// alone while the user is working within the same top group.
watch(huntTopGroup, (top) => {
  const zone = top?.zone ?? null
  if (zone === huntLastTop) return
  huntLastTop = zone
  huntOpen.value = new Set(zone ? [zone] : [])
}, { immediate: true })

// ── Steps, spares, lookup ───────────────────────────────────────────────────
// All three read huntZones, which is already in memory — no extra requests.

const huntSteps = computed(() => stepProgress(huntZones.value, huntArchiOnly.value))

/** The step you are closest to finishing, which is rarely the lowest one. */
const huntNearestStep = computed(() => nearestStep(huntSteps.value))

/** Jump from the steps view straight to a planner filtered to that step. */
const huntFocusStep = (step: number) => {
  huntStepFilter.value = step
  huntNextStepOnly.value = true
  huntView.value = 'route'
}

// Turning the filter off also drops a step picked in the steps view, so the
// button goes back to tracking the lowest incomplete step on its own.
const huntToggleStepFilter = () => {
  huntNextStepOnly.value = !huntNextStepOnly.value
  if (!huntNextStepOnly.value) huntStepFilter.value = null
}

const huntSpares = computed(() => listSpares(huntZones.value, counts))

const huntFindQuery = ref('')
const huntFound = computed(() =>
  findSpawns(huntZones.value, huntFindQuery.value, huntGeo.value.map, { archiOnly: huntArchiOnly.value }))

const huntTotals = computed(() => ({
  spots: huntSpots.value.length,
  // A monster spawning in several subzones must only be counted once.
  monsters: new Set(huntSpots.value.flatMap(s => s.monsters.map(m => m.id))).size,
}))

const monsterAutoEl = ref<HTMLElement | null>(null)

const onDocMousedownArchi = (e: MouseEvent) => {
  if (monsterAutoEl.value && !monsterAutoEl.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}

const loadHuntState = () => {
  const stored = Number(localStorage.getItem(HUNT_COOLDOWN_KEY))
  if (Number.isFinite(stored) && stored > 0) huntCooldownHours.value = stored

  const radius = Number(localStorage.getItem(HUNT_RADIUS_KEY))
  if (Number.isFinite(radius) && radius >= 0) huntRadius.value = radius

  if (!selectedServer.value?.id || !selectedCharacter.value?.id) {
    huntLog.value = emptyHuntLog()
    return
  }
  huntLog.value = pruneLog(
    loadHuntLog(selectedServer.value.id, selectedCharacter.value.id),
    huntCooldownMs.value,
  )
}

watch(huntCooldownHours, (hours) => {
  if (!Number.isFinite(hours) || hours <= 0) return
  localStorage.setItem(HUNT_COOLDOWN_KEY, String(hours))
})

watch(huntRadius, (radius) => {
  if (!Number.isFinite(radius) || radius < 0) return
  localStorage.setItem(HUNT_RADIUS_KEY, String(radius))
})

onMounted(() => {
  initContext()
  init()
  restoreMetamobConnection()
  loadMetamobImages()
  if (metamobConnected.value) {
    void pullFromMetamob().then((pulled) => {
      if (pulled) void loadHuntZones()
    })
  } else {
    void loadHuntZones()
  }
  loadHuntState()
  // A minute is fine: every countdown here is an estimate, and re-ranking more
  // often than that would move the list under the user's cursor for no gain.
  huntClock = setInterval(() => { huntNow.value = Date.now() }, 60_000)
  document.addEventListener('mousedown', onDocMousedownArchi)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onDocMousedownArchi)
  if (huntClock) clearInterval(huntClock)
  // Don't lose an edit made right before navigating away.
  if (metamobPushTimer && metamobConnected.value) {
    clearTimeout(metamobPushTimer)
    pushToMetamob()
  }
})
watch([selectedServer, selectedCharacter], () => {
  if (monsters.value.length) { loadCounts(); loadSellData() }
  // The log is per character — switching must not carry captures across.
  loadHuntState()
})
</script>
