<template>
  <div v-if="hasContext" class="flex flex-col gap-5">
    <UiSegmented v-model="mode" :options="modeOptions" :aria-label="$t('v2.archi.modeLabel')" />

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
      <UiToolbar>
        <template #search>
          <div ref="routeAutoEl" class="relative">
            <UiInput
              v-model="routeSearch"
              :placeholder="$t('v2.archi.route.searchPlaceholder')"
              @update:model-value="showRouteDropdown = true; selectedRouteMonster = null"
              @focus="showRouteDropdown = true"
              @keyup.escape="showRouteDropdown = false"
            >
              <template #prefix><UiIcon name="search" /></template>
            </UiInput>

            <div
              v-if="showRouteDropdown && routeMonsterSuggestions.length"
              class="absolute top-[calc(100%+0.25rem)] right-0 left-0 max-h-72 overflow-y-auto rounded-md border border-line bg-raised p-1 shadow-md"
              :style="{ zIndex: 'var(--z-dropdown)' }"
            >
              <button
                v-for="s in routeMonsterSuggestions"
                :key="s.id"
                type="button"
                class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-sunken"
                @mousedown.prevent="selectRouteMonster(s)"
              >
                <img :src="getMonsterImg(s)" :alt="''" class="size-6 shrink-0 rounded object-contain" @error="onImgErr">
                <span class="min-w-0 flex-1 truncate text-sm text-ink">{{ s.nom }}</span>
                <span class="shrink-0 text-xs text-subtle">{{ s.souszone || s.zone }}</span>
              </button>
            </div>
          </div>
        </template>
        <template #filters>
          <UiButton variant="primary" size="sm" :disabled="!selectedRouteMonster || resolvingRoute" :loading="resolvingRoute" @click="addRouteTarget">
            {{ $t('v2.archi.route.add') }}
          </UiButton>
          <UiButton v-if="routeTargets.length" variant="ghost" size="sm" @click="clearRouteTargets">
            {{ $t('v2.archi.route.clearAll') }}
          </UiButton>
        </template>
      </UiToolbar>

      <UiEmptyState
        v-if="!routeTargets.length"
        :title="$t('v2.archi.route.emptyTitle')"
        :description="$t('v2.archi.route.emptyDesc')"
      >
        <template #icon><UiIcon name="archimonstres" /></template>
      </UiEmptyState>

      <div v-else class="grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <UiCard :padded="false">
          <template #title>
            {{ $t('v2.archi.route.tracked') }}
            <span class="tabular text-subtle">({{ routeTargets.length }})</span>
          </template>

          <div class="p-2">
            <UiInput v-model="routeSidebarFilter" size="sm" :placeholder="$t('v2.archi.route.checkPlaceholder')">
              <template #prefix><UiIcon name="search" /></template>
            </UiInput>

            <p v-if="routeSidebarFilter && !routeSidebarMatches.length" class="mt-2 px-1 text-xs text-negative">
              {{ $t('v2.archi.route.notInRoute') }}
            </p>

            <div class="mt-2 flex max-h-96 flex-col gap-1 overflow-y-auto">
              <div
                v-for="target in routeSidebarVisible"
                :key="target.monsterId"
                :class="[
                  'group flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors',
                  routeSidebarFilter ? 'bg-accent-soft' : 'hover:bg-sunken',
                ]"
              >
                <img :src="getMonsterImg(target)" :alt="''" class="size-6 shrink-0 rounded object-contain" @error="onImgErr">
                <span class="min-w-0 flex-1 truncate text-sm text-ink">{{ target.monsterName }}</span>
                <UiButton
                  variant="ghost"
                  size="sm"
                  icon
                  class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  :aria-label="$t('v2.archi.route.remove')"
                  @click="removeRouteTarget(target.monsterId)"
                >
                  <UiIcon name="close" />
                </UiButton>
              </div>
            </div>
          </div>
        </UiCard>

        <div class="flex min-w-0 flex-col gap-3">
          <UiCard v-for="group in routeSubareaGroups" :key="group.name">
            <template #title>{{ group.name }}</template>
            <template #actions>
              <span class="tabular text-xs text-subtle">
                {{ $t('v2.archi.route.targetCount', { count: group.monsters.length }) }}
              </span>
            </template>
            <p class="-mt-2 mb-2 text-xs text-subtle">{{ group.zoneLabel }}</p>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="monster in group.monsters"
                :key="`${group.name}-${monster.monsterId}`"
                class="flex items-center gap-1.5 rounded-md border border-line px-2 py-1"
              >
                <img :src="getMonsterImg(monster)" :alt="''" class="size-5 shrink-0 rounded object-contain" @error="onImgErr">
                <span class="text-xs text-ink">{{ monster.monsterName }}</span>
              </div>
            </div>
          </UiCard>
        </div>
      </div>
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

const { appendActivity } = useAppDataStore()
const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()

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

const loadMetamobImages = async () => {
  const cached = localStorage.getItem(METAMOB_CACHE_KEY)
  if (cached) {
    try { metamobImgMap.value = JSON.parse(cached) } catch { /* ignore */ }
    return
  }
  // Not cached yet — fetch from server proxy
  try {
    const map = await $fetch<Record<string, string>>('/api/metamob/monsters')
    if (map && Object.keys(map).length > 0) {
      metamobImgMap.value = map
      localStorage.setItem(METAMOB_CACHE_KEY, JSON.stringify(map))
    }
  } catch (e) {
    console.warn('Could not load metamob images, using fallback URLs', e)
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

const { t } = useI18n()

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

const key = (m: any) =>
  `monster_count_${selectedServer.value?.id}_${selectedCharacter.value?.id}_${m.id}`

const getCount = (m: any) => counts[m.id] ?? 0

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

const loadCounts = () => {
  Object.keys(counts).forEach((monsterId) => {
    counts[monsterId] = 0
  })

  if (!monsters.value.length || !selectedCharacter.value) return
  let migratedLegacyData = false

  monsters.value.forEach(m => {
    const progressCount = getStoredCountFromProgress(m.id)
    if (progressCount !== null) {
      counts[m.id] = progressCount
      return
    }

    const legacyCount = parseInt(localStorage.getItem(key(m)) ?? '0', 10)
    counts[m.id] = legacyCount
    if (legacyCount > 0) {
      persistMonsterCount(m.id, legacyCount)
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
      monsterId: monster.id,
      previousCount,
      nextCount,
    },
  })
}

const saveCount = (m: any) => {
  const count = counts[m.id] ?? 0
  persistMonsterCount(m.id, count)
  localStorage.setItem(key(m), String(count))
}
const inc = (m: any) => {
  const previousCount = counts[m.id] ?? 0
  counts[m.id] = previousCount + 1
  saveCount(m)
  logMonsterCountActivity(m, previousCount, counts[m.id] ?? 0)
}
const dec = (m: any) => {
  const current = counts[m.id] ?? 0
  if (current > 0) {
    const previousCount = current
    counts[m.id] = current - 1
    saveCount(m)
    logMonsterCountActivity(m, previousCount, counts[m.id] ?? 0)
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
interface RouteTarget {
  monsterId: string | number
  monsterName: string
  baseMonsterName: string
  image_url: string
  zone: string
  souszone: string
  subareas: string[]
  addedAt: string
}

const sellTab = ref<'queue' | 'history' | 'analytics'>('queue')
const pendingItems = ref<PendingItem[]>([])
const soldItems = ref<SoldItem[]>([])
const priceHistory = ref<Record<string, number[]>>({})
const routeTargets = ref<RouteTarget[]>([])
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
const routeSearch = ref('')
const routeSidebarFilter = ref('')
const selectedRouteMonster = ref<any>(null)
const showRouteDropdown = ref(false)
const resolvingRoute = ref(false)

// The sidebar filter highlights rather than hides, so you can confirm a
// monster is already in the route without losing sight of the rest.
const routeSidebarMatches = computed(() => {
  const needle = routeSidebarFilter.value.trim().toLowerCase()
  if (!needle) return routeTargets.value
  return routeTargets.value.filter(target => target.monsterName.toLowerCase().includes(needle))
})

const routeSidebarVisible = computed(() =>
  routeSidebarFilter.value.trim() ? routeSidebarMatches.value : routeTargets.value,
)

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
const routeKey = computed(() =>
  `archi_route_targets_${selectedServer.value?.id}_${selectedCharacter.value?.id}`
)

const loadSellData = () => {
  if (!hasContext.value) return
  const pRaw = localStorage.getItem(pendingKey.value)
  const sRaw = localStorage.getItem(soldKey.value)
  const hRaw = localStorage.getItem(historyKey.value)
  const rRaw = localStorage.getItem(routeKey.value)
  pendingItems.value = pRaw ? JSON.parse(pRaw) : []
  soldItems.value = sRaw ? JSON.parse(sRaw) : []
  priceHistory.value = hRaw ? JSON.parse(hRaw) : {}
  routeTargets.value = rRaw ? JSON.parse(rRaw) : []
}

const savePending = () => localStorage.setItem(pendingKey.value, JSON.stringify(pendingItems.value))
const saveSold = () => localStorage.setItem(soldKey.value, JSON.stringify(soldItems.value))
const saveHistory = () => localStorage.setItem(historyKey.value, JSON.stringify(priceHistory.value))
const saveRouteTargets = () => localStorage.setItem(routeKey.value, JSON.stringify(routeTargets.value))

const normalizeDofusdbSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’`]/g, "'")
    .toLowerCase()
    .trim()

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
const routeMonsterSuggestions = computed(() => getSuggestions(routeSearch.value, true))

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

const selectRouteMonster = (m: any) => {
  selectedRouteMonster.value = m
  routeSearch.value = m.nom
  showRouteDropdown.value = false
}

const resolveRouteSubareas = async (monster: any): Promise<{ subareas: string[]; baseMonsterName: string }> => {
  const fallbackSubareas = [monster.souszone, monster.zone].filter(Boolean)
  const searchTerms = [monster.nom_normal, monster.nom].filter(Boolean) as string[]

  for (const term of searchTerms) {
    try {
      const res = await $fetch<{ data?: Array<{ id: number; name?: { fr?: string }; subareas?: number[] }> }>('/api/dofusdb/monsters', {
        query: {
          '$limit': 10,
          '$populate': false,
          lang: 'fr',
          'slug.fr[$search]': normalizeDofusdbSearch(term),
        },
      })

      const candidates = res.data ?? []
      const exact = candidates.find((candidate) =>
        normalizeDofusdbSearch(candidate.name?.fr ?? '') === normalizeDofusdbSearch(term)
      ) ?? candidates[0]

      const subareaIds = exact?.subareas ?? []
      if (!subareaIds.length) {
        if (fallbackSubareas.length) {
          return { subareas: [...new Set(fallbackSubareas)], baseMonsterName: exact?.name?.fr ?? term }
        }
        continue
      }

      const subareasRes = await $fetch<{ data?: Array<{ id: number; name?: { fr?: string } }> }>('/api/dofusdb/subareas', {
        query: { 'id[]': subareaIds, lang: 'fr', '$limit': Math.max(subareaIds.length, 20) },
      })

      const names = (subareasRes.data ?? [])
        .map(subarea => subarea.name?.fr)
        .filter((name): name is string => Boolean(name))

      if (names.length) {
        return {
          subareas: [...new Set(names)],
          baseMonsterName: exact?.name?.fr ?? term,
        }
      }
    } catch {
      // Keep fallback below.
    }
  }

  return {
    subareas: [...new Set(fallbackSubareas)],
    baseMonsterName: monster.nom_normal || monster.nom,
  }
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

const addRouteTarget = async () => {
  if (!selectedRouteMonster.value || resolvingRoute.value) return
  if (routeTargets.value.some(target => String(target.monsterId) === String(selectedRouteMonster.value.id))) {
    routeSearch.value = ''
    selectedRouteMonster.value = null
    return
  }

  resolvingRoute.value = true
  try {
    const resolved = await resolveRouteSubareas(selectedRouteMonster.value)
    routeTargets.value.unshift({
      monsterId: selectedRouteMonster.value.id,
      monsterName: selectedRouteMonster.value.nom,
      baseMonsterName: resolved.baseMonsterName,
      image_url: selectedRouteMonster.value.image_url,
      zone: selectedRouteMonster.value.zone ?? '',
      souszone: selectedRouteMonster.value.souszone ?? '',
      subareas: resolved.subareas.length ? resolved.subareas : [selectedRouteMonster.value.souszone || selectedRouteMonster.value.zone].filter(Boolean),
      addedAt: new Date().toISOString(),
    })
    saveRouteTargets()
    routeSearch.value = ''
    selectedRouteMonster.value = null
  } finally {
    resolvingRoute.value = false
  }
}

const removeRouteTarget = (monsterId: string | number) => {
  routeTargets.value = routeTargets.value.filter(target => String(target.monsterId) !== String(monsterId))
  saveRouteTargets()
}

const clearRouteTargets = () => {
  routeTargets.value = []
  saveRouteTargets()
}

const routeSubareaGroups = computed(() => {
  const groups = new Map<string, { name: string; zoneLabel: string; monsters: RouteTarget[] }>()

  routeTargets.value.forEach((target) => {
    target.subareas.forEach((subarea) => {
      const existing = groups.get(subarea)
      if (existing) {
        existing.monsters.push(target)
        return
      }

      groups.set(subarea, {
        name: subarea,
        zoneLabel: target.zone || 'Unknown zone',
        monsters: [target],
      })
    })
  })

  return [...groups.values()]
    .map(group => ({
      ...group,
      monsters: group.monsters.sort((a, b) => a.monsterName.localeCompare(b.monsterName, 'fr')),
    }))
    .sort((a, b) => {
      if (b.monsters.length !== a.monsters.length) return b.monsters.length - a.monsters.length
      return a.name.localeCompare(b.name, 'fr')
    })
})

const routeSubareaSummary = computed(() =>
  routeSubareaGroups.value.map(group => ({
    name: group.name,
    zoneLabel: group.zoneLabel,
    count: group.monsters.length,
  }))
)

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
const init = () => {
  const ver = parseInt(localStorage.getItem('archimonstres-monsters-version') ?? '0', 10)
  if (ver < 1) {
    monsters.value = monstersJson as any[]
    localStorage.setItem('archimonstres-monsters', JSON.stringify(monstersJson))
    localStorage.setItem('archimonstres-monsters-version', '1')
  } else {
    const raw = localStorage.getItem('archimonstres-monsters')
    monsters.value = raw ? JSON.parse(raw) : (monstersJson as any[])
  }
  loadCounts()
  loadSellData()
  loading.value = false
}

const monsterAutoEl = ref<HTMLElement | null>(null)
const routeAutoEl = ref<HTMLElement | null>(null)

const onDocMousedownArchi = (e: MouseEvent) => {
  if (monsterAutoEl.value && !monsterAutoEl.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
  if (routeAutoEl.value && !routeAutoEl.value.contains(e.target as Node)) {
    showRouteDropdown.value = false
  }
}

onMounted(() => {
  initContext()
  init()
  loadMetamobImages()
  document.addEventListener('mousedown', onDocMousedownArchi)
})
onUnmounted(() => document.removeEventListener('mousedown', onDocMousedownArchi))
watch([selectedServer, selectedCharacter], () => {
  if (monsters.value.length) { loadCounts(); loadSellData() }
})
</script>
