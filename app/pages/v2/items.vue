<template>
  <div>
    <!-- Filters bar -->
    <div class="v2-items-filters">
      <!-- Element -->
      <div class="v2-filter-group">
        <span class="v2-filter-label">{{ $t('items.filters.elements.title') }}</span>
        <div class="v2-filter-chips">
          <button
            class="v2-fchip"
            :class="{ 'v2-fchip--on': !filters.element }"
            @click="setFilter('element', '')"
          >{{ $t('items.filters.elements.all') }}</button>
          <button
            v-for="el in ELEMENTS"
            :key="el.name"
            class="v2-fchip v2-fchip--icon"
            :class="{ 'v2-fchip--on': filters.element === el.name }"
            :title="el.name"
            @click="setFilter('element', el.name)"
          >
            <img :src="el.icon" :alt="el.name" class="w-4 h-4 object-contain" @error="noImg" />
          </button>
        </div>
      </div>

      <!-- Mode -->
      <div class="v2-filter-group">
        <span class="v2-filter-label">{{ $t('items.filters.mode.title') }}</span>
        <div class="v2-filter-chips">
          <button class="v2-fchip" :class="{ 'v2-fchip--on': !filters.mode }" @click="setFilter('mode', '')">{{ $t('items.filters.mode.all') }}</button>
          <button
            v-for="m in MODES"
            :key="m"
            class="v2-fchip"
            :class="{ 'v2-fchip--on': filters.mode === m }"
            @click="setFilter('mode', m)"
          >{{ m.toUpperCase() }}</button>
        </div>
      </div>

      <!-- Level -->
      <div class="v2-filter-group">
        <span class="v2-filter-label">{{ $t('items.filters.level.title') }}</span>
        <div class="v2-filter-chips">
          <button class="v2-fchip" :class="{ 'v2-fchip--on': !filters.level }" @click="setFilter('level', '')">{{ $t('items.filters.level.all') }}</button>
          <button
            v-for="lv in LEVELS"
            :key="lv"
            class="v2-fchip"
            :class="{ 'v2-fchip--on': filters.level === lv }"
            @click="setFilter('level', lv)"
          >{{ lv }}</button>
        </div>
      </div>

      <!-- Budget -->
      <div class="v2-filter-group">
        <span class="v2-filter-label">{{ $t('items.filters.budget.title') }}</span>
        <div class="v2-filter-chips">
          <button class="v2-fchip" :class="{ 'v2-fchip--on': !filters.budget }" @click="setFilter('budget', '')">{{ $t('items.filters.budget.all') }}</button>
          <button
            v-for="b in BUDGETS"
            :key="b"
            class="v2-fchip"
            :class="{ 'v2-fchip--on': filters.budget === b }"
            @click="setFilter('budget', b)"
          >{{ b.charAt(0).toUpperCase() + b.slice(1) }}</button>
        </div>
      </div>

      <!-- Class -->
      <div class="v2-filter-group">
        <span class="v2-filter-label">{{ $t('items.filters.classes.title') }}</span>
        <div class="v2-filter-chips">
          <button class="v2-fchip" :class="{ 'v2-fchip--on': !filters.classe }" @click="setFilter('classe', '')">{{ $t('items.filters.classes.all') }}</button>
          <button
            v-for="cl in CLASSES"
            :key="cl.name"
            class="v2-fchip v2-fchip--icon"
            :class="{ 'v2-fchip--on': filters.classe === cl.name }"
            :title="cl.name"
            @click="setFilter('classe', cl.name)"
          >
            <img :src="cl.icon" :alt="cl.name" class="w-5 h-5 object-cover object-top rounded" @error="noImg" />
          </button>
        </div>
      </div>
    </div>

    <!-- Stats strip -->
    <div class="v2-items-stats" v-if="stats">
      <div class="v2-stat-card">
        <div class="v2-stat-card__val">{{ stats.totalEquipments }}</div>
        <div class="v2-stat-card__label">{{ $t('items.stats.totalEquipment') }}</div>
      </div>
      <div class="v2-stat-card">
        <div class="v2-stat-card__val">{{ stats.uniqueItems }}</div>
        <div class="v2-stat-card__label">{{ $t('items.stats.uniqueItems') }}</div>
      </div>
      <div class="v2-stat-card">
        <div class="v2-stat-card__val">{{ stats.mostPopularSlot?.slot ?? '—' }}</div>
        <div class="v2-stat-card__label">{{ $t('items.stats.mostVariedSlot') }}</div>
      </div>
      <div class="v2-stat-card">
        <div class="v2-stat-card__val">{{ stats.avgItemsPerSet.toFixed(1) }}</div>
        <div class="v2-stat-card__label">{{ $t('items.stats.avgItemsPerSet') }}</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="v2-center-loader">
      <div class="v2-spin" /> {{ $t('items.loading') }}
    </div>

    <template v-else-if="stats">
      <!-- Slot tabs -->
      <div class="v2-slot-tabs">
        <button
          v-for="slot in SLOTS"
          :key="slot.key"
          class="v2-slot-tab"
          :class="{ 'v2-slot-tab--on': activeSlot === slot.key }"
          @click="activeSlot = slot.key"
        >
          <span class="v2-slot-tab__icon">{{ slot.icon }}</span>
          <span class="v2-slot-tab__label">{{ $t(`items.slots.${slot.key}`) }}</span>
          <span class="v2-slot-tab__count">{{ getSlotStats(slot.key)?.totalItems ?? 0 }}</span>
        </button>
      </div>

      <!-- Slot content -->
      <div v-if="currentSlotStats" class="v2-slot-content">
        <template v-if="selectedRecipeItem">
          <div class="v2-recipe-shell">
            <div class="v2-recipe-top">
              <button class="v2-recipe-back" @click="resetRecipeView">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <span class="v2-recipe-kicker">Recipe proof of concept</span>
            </div>

            <div class="v2-recipe-item">
              <div class="v2-recipe-item__img-wrap">
                <img v-if="selectedRecipeItem.image_url" :src="selectedRecipeItem.image_url" :alt="selectedRecipeItem.name" class="v2-recipe-item__img" @error="noImg" />
                <div v-else class="v2-recipe-item__img-ph" />
              </div>
              <div class="min-w-0">
                <div class="v2-recipe-item__name">{{ selectedRecipeItem.name }}</div>
                <div class="v2-recipe-item__meta">{{ $t(`items.slots.${activeSlot}`) }} · {{ selectedRecipeItem.count }} uses</div>
                <div class="v2-recipe-item__actions">
                  <button class="v2-recipe-refresh" @click="refetchSelectedRecipe">
                    Refetch recipe
                  </button>
                  <button class="v2-recipe-refresh" @click="openOcrPicker">
                    OCR screenshot
                  </button>
                  <input
                    ref="ocrFileInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleOcrFileChange"
                  />
                  <span
                    v-if="recipeLookupState.confidence"
                    class="v2-recipe-confidence"
                    :class="{
                      'v2-recipe-confidence--exact': recipeLookupState.confidence === 'exact',
                      'v2-recipe-confidence--approx': recipeLookupState.confidence === 'approx',
                    }"
                  >
                    {{ recipeLookupState.confidence === 'exact' ? 'Exact match' : 'Approx match' }}
                  </span>
                  <span v-if="recipeLookupState.source" class="v2-recipe-cache-hint">
                    {{ recipeLookupState.source === 'cache' ? 'Loaded from cache' : 'Fresh fetch' }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="ocrState.isLoading" class="v2-inline-ocr">
              <div class="v2-spin-sm" /> Extracting price candidates from screenshot...
            </div>

            <div v-else-if="ocrState.error" class="v2-recipe-error">
              {{ ocrState.error }}
            </div>

            <div v-else-if="ocrState.candidates.length" class="v2-ocr-panel">
              <div class="v2-ocr-panel__head">
                <span class="v2-rstat__label">OCR price candidates</span>
                <div class="v2-recipe-item__actions">
                  <span class="v2-recipe-cache-hint">Click one to fill the sell price</span>
                  <button
                    v-if="ocrState.screenshotDataUrl"
                    class="v2-recipe-refresh"
                    @click="saveOcrSnapshotPrices"
                  >
                    Save OCR prices
                  </button>
                </div>
              </div>
              <div class="v2-selected-items__list">
                <button
                  v-for="candidate in ocrState.candidates"
                  :key="candidate"
                  class="v2-selected-items__chip v2-selected-items__chip--btn"
                  @click="selectedRecipeSellPrice = candidate"
                >
                  {{ formatKamasFull(candidate) }}
                </button>
              </div>
              <div v-if="ocrState.debugRows.length" class="v2-ocr-debug">
                <div class="v2-ocr-debug__head">
                  <span class="v2-rstat__label">OCR debug rows</span>
                  <span class="v2-recipe-cache-hint">Mode: {{ ocrState.debugMode || 'unknown' }}</span>
                </div>
                <div class="v2-ocr-debug__list">
                  <div
                    v-for="(row, index) in ocrState.debugRows"
                    :key="`${row.source}-${index}-${row.raw}`"
                    class="v2-ocr-debug__row"
                  >
                    <span class="v2-ocr-debug__raw">{{ row.raw || '∅' }}</span>
                    <span class="v2-ocr-debug__tokens">
                      [{{ row.tokens.join(', ') || 'no tokens' }}]
                    </span>
                    <span class="v2-ocr-debug__candidate">
                      {{ row.candidate ? formatKamasFull(row.candidate) : 'rejected' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="recipeLookupState.isLoading" class="v2-center-loader">
              <div class="v2-spin" /> Loading recipe...
            </div>

            <div v-else-if="recipeLookupState.error" class="v2-recipe-error">
              {{ recipeLookupState.error }}
            </div>

            <template v-else-if="recipeLookupState.data">
              <div class="v2-recipe-stats">
                <div class="v2-rstat">
                  <div class="v2-rstat__label">Profession</div>
                  <div class="v2-rstat__val">{{ recipeLookupState.data.job?.name?.fr || recipeLookupState.data.job?.name?.en || 'Unknown' }}</div>
                </div>
                <div class="v2-rstat">
                  <div class="v2-rstat__label">Ingredients</div>
                  <div class="v2-rstat__val">{{ recipeIngredients.length }}</div>
                </div>
                <div class="v2-rstat">
                  <div class="v2-rstat__label">Recipe ID</div>
                  <div class="v2-rstat__val">{{ recipeLookupState.data.id }}</div>
                </div>
              </div>

              <div class="v2-recipe-cost">
                <div class="v2-rstat">
                  <div class="v2-rstat__label">Craft cost</div>
                  <div class="v2-rstat__val">{{ formatKamasFull(recipeCostSummary.totalCost) }}</div>
                </div>
                <div class="v2-rstat">
                  <div class="v2-rstat__label">Priced ingredients</div>
                  <div class="v2-rstat__val">{{ recipeCostSummary.pricedCount }} / {{ recipeCostSummary.totalIngredients }}</div>
                </div>
                <div class="v2-rstat">
                  <div class="v2-rstat__label">Missing prices</div>
                  <div class="v2-rstat__val">{{ recipeCostSummary.missingCount }}</div>
                </div>
              </div>

              <div class="v2-recipe-sell">
                <div class="v2-rstat">
                  <div class="v2-rstat__label">Sell price</div>
                  <input
                    v-model.number="selectedRecipeSellPrice"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    class="v2-recipe-price-entry__input v2-recipe-price-entry__input--wide"
                  />
                </div>
                <div class="v2-rstat">
                  <div class="v2-rstat__label">Estimated margin</div>
                  <div
                    class="v2-rstat__val"
                    :class="{
                      'v2-profit--up': recipeProfitSummary.margin > 0,
                      'v2-profit--down': recipeProfitSummary.margin < 0,
                    }"
                  >
                    {{ recipeProfitSummary.margin >= 0 ? '+' : '' }}{{ formatKamasFull(recipeProfitSummary.margin) }}
                  </div>
                </div>
                <div class="v2-rstat">
                  <div class="v2-rstat__label">Margin rate</div>
                  <div
                    class="v2-rstat__val"
                    :class="{
                      'v2-profit--up': recipeProfitSummary.marginRate > 0,
                      'v2-profit--down': recipeProfitSummary.marginRate < 0,
                    }"
                  >
                    {{ recipeProfitSummary.marginRate >= 0 ? '+' : '' }}{{ recipeProfitSummary.marginRate.toFixed(1) }}%
                  </div>
                </div>
              </div>

              <div v-if="currentItemPriorityOptions.length" class="v2-priority-panel">
                <div class="v2-price-manager__head">
                  <span class="v2-rstat__label">Valuation focus</span>
                  <span class="v2-recipe-cache-hint">Choose which stats matter more for this item</span>
                </div>
                <div class="v2-priority-list">
                  <div
                    v-for="option in currentItemPriorityOptions"
                    :key="`priority-${option.key}`"
                    class="v2-priority-row"
                  >
                    <div class="v2-priority-row__label">
                      {{ option.label }}
                      <span v-if="option.rangeText" class="v2-priority-row__range">{{ option.rangeText }}</span>
                    </div>
                    <div class="v2-priority-row__controls">
                      <button
                        v-for="preset in statPriorityPresets"
                        :key="`${option.key}-${preset.key}`"
                        class="v2-fchip"
                        :class="{ 'v2-fchip--on': getItemStatMultiplier(option.key) === preset.multiplier }"
                        @click="setItemStatMultiplier(option.key, preset.multiplier)"
                      >
                        {{ preset.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="selectedObservationDetail" class="v2-observation-detail">
                <div class="v2-recipe-top">
                  <button class="v2-recipe-back" @click="closeObservationDetail">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to observed prices
                  </button>
                  <span class="v2-recipe-kicker">Observed listing stats</span>
                </div>
                <div class="v2-observation-detail__head">
                  <div class="v2-rstat">
                    <div class="v2-rstat__label">Observed price</div>
                    <div class="v2-rstat__val">{{ formatKamasFull(selectedObservationDetail.price) }}</div>
                  </div>
                  <div class="v2-observation-detail__actions">
                    <button class="v2-recipe-refresh" @click="selectedRecipeSellPrice = selectedObservationDetail.price">
                      Use as sell price
                    </button>
                    <button class="v2-recipe-refresh" @click="openStatsScreenshotPicker(selectedObservationDetail.id)">
                      {{ selectedObservationDetail.statsScreenshotDataUrl ? 'Replace stats screenshot' : 'Upload stats screenshot' }}
                    </button>
                  </div>
                </div>

                <div v-if="statsOcrState.isLoading" class="v2-inline-ocr">
                  <div class="v2-spin-sm" /> Extracting stat lines from screenshot...
                </div>

                <div v-else-if="statsOcrState.error" class="v2-recipe-error">
                  {{ statsOcrState.error }}
                </div>

                <div v-if="selectedObservationDetail.statsScreenshotDataUrl" class="v2-observation-detail__image-wrap">
                  <img
                    :src="selectedObservationDetail.statsScreenshotDataUrl"
                    alt="Observed stats screenshot"
                    class="v2-observation-detail__image"
                  />
                </div>

                <div class="v2-observation-detail__stats">
                  <div class="v2-price-manager__head">
                    <span class="v2-rstat__label">Exact stats</span>
                    <button class="v2-recipe-refresh" @click="addObservationStatEntry">
                      Add stat
                    </button>
                  </div>
                  <div v-if="selectedObservationDetail.statsEntries.length" class="v2-observation-detail__stats-list">
                    <div
                      v-for="(entry, index) in selectedObservationDetail.statsEntries"
                      :key="`${selectedObservationDetail.id}-entry-${index}`"
                      class="v2-observation-detail__stats-row"
                    >
                      <select
                        v-if="entry.isManual"
                        :value="entry.key"
                        class="v2-recipe-price-entry__input v2-observation-detail__stats-select"
                        @change="updateObservationStatKey(index, ($event.target as HTMLSelectElement).value)"
                      >
                        <option
                          v-for="option in observationStatOptions"
                          :key="option.key"
                          :value="option.key"
                        >
                          {{ option.label }}
                        </option>
                      </select>
                      <div v-else class="v2-observation-detail__stats-label">
                        {{ entry.label }}
                        <span v-if="entry.rangeText" class="v2-observation-detail__stats-range">
                          {{ entry.rangeText }}
                        </span>
                      </div>
                      <div class="v2-observation-detail__stats-value">
                        <input
                          :value="entry.value ?? ''"
                          type="number"
                          step="1"
                          class="v2-recipe-price-entry__input v2-observation-detail__stats-input"
                          @input="updateObservationStatValue(index, ($event.target as HTMLInputElement).value)"
                        />
                        <span v-if="entry.suffix" class="v2-observation-detail__stats-suffix">{{ entry.suffix }}</span>
                      </div>
                      <button class="v2-recipe-refresh" @click="removeObservationStatEntry(index)">
                        Remove
                      </button>
                    </div>
                  </div>
                  <div v-else class="v2-empty-full">
                    No stat lines saved yet. Upload a stats screenshot or add them manually.
                  </div>
                </div>

                <div v-if="selectedObservationDetail.statsRawText" class="v2-ocr-debug">
                  <div class="v2-ocr-debug__head">
                    <span class="v2-rstat__label">Stats OCR raw text</span>
                  </div>
                  <pre class="v2-observation-detail__raw">{{ selectedObservationDetail.statsRawText }}</pre>
                </div>
              </div>

              <div v-if="selectedItemObservations.length && !selectedObservationDetail" class="v2-observed-prices">
                <div class="v2-price-manager__head">
                  <span class="v2-rstat__label">Observed prices</span>
                  <div class="v2-observation-summary-actions">
                    <span class="v2-recipe-cache-hint">{{ selectedItemObservations.length }} saved</span>
                    <button class="v2-recipe-refresh" @click="selectAllObservedPrices">
                      Select all
                    </button>
                    <button class="v2-recipe-refresh" @click="clearObservedPriceSelection">
                      Clear
                    </button>
                  </div>
                </div>
                <div class="v2-observed-prices__list">
                  <div
                    v-for="observation in selectedItemObservations"
                    :key="observation.id"
                    class="v2-observed-prices__row"
                  >
                    <label class="v2-observed-prices__select">
                      <input
                        type="checkbox"
                        :checked="selectedObservedPriceIds.includes(observation.id)"
                        @change="toggleObservedPriceSelection(observation.id)"
                      />
                    </label>
                    <button
                      class="v2-observed-prices__price"
                      @click="selectedRecipeSellPrice = observation.price"
                    >
                      {{ formatKamasFull(observation.price) }}
                    </button>
                    <span class="v2-observed-prices__meta">
                      {{ formatPriceFreshness(observation.createdAt) }}
                    </span>
                    <div class="v2-observed-prices__actions">
                      <button
                        class="v2-recipe-refresh"
                        @click="openObservationDetail(observation.id)"
                      >
                        {{ observation.statsEntries.length ? 'View stats' : 'Add stats' }}
                      </button>
                      <button
                        class="v2-recipe-refresh"
                        @click="openStatsScreenshotPicker(observation.id)"
                      >
                        {{ observation.statsScreenshotDataUrl ? 'Replace stats screenshot' : 'Add stats screenshot' }}
                      </button>
                      <button
                        class="v2-recipe-refresh"
                        @click="removeObservation(observation.id)"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                <input
                  ref="statsScreenshotInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleStatsScreenshotChange"
                />
                <div v-if="selectedObservedValuations.length >= 2" class="v2-valuation-panel">
                  <div class="v2-price-manager__head">
                    <span class="v2-rstat__label">Listing valuation</span>
                    <div class="v2-observation-summary-actions">
                      <span
                        class="v2-recipe-confidence"
                        :class="{
                          'v2-recipe-confidence--exact': valuationConfidence.level === 'high',
                          'v2-recipe-confidence--approx': valuationConfidence.level !== 'high',
                        }"
                      >
                        {{ valuationConfidence.label }}
                      </span>
                      <label class="v2-recipe-cache-hint">
                        <input
                          type="checkbox"
                          :checked="showOnlyUndervaluedListings"
                          @change="showOnlyUndervaluedListings = !showOnlyUndervaluedListings"
                        />
                        Buy candidates only
                      </label>
                      <span class="v2-recipe-cache-hint">
                        {{ selectedObservedValuations.length }} selected · leave-one-out model
                      </span>
                    </div>
                  </div>
                  <div v-if="displayedObservedValuations.length" class="v2-valuation-table">
                    <div class="v2-valuation-table__head">Price</div>
                    <div class="v2-valuation-table__head">Score</div>
                    <div class="v2-valuation-table__head">Fair value</div>
                    <div class="v2-valuation-table__head">Delta</div>
                    <div class="v2-valuation-table__head">Quick</div>
                    <div class="v2-valuation-table__head">Fair</div>
                    <div class="v2-valuation-table__head">Greedy</div>
                    <template v-for="row in displayedObservedValuations" :key="`valuation-${row.id}`">
                      <div class="v2-valuation-table__cell">
                        {{ formatKamasFull(row.price) }}
                      </div>
                      <div class="v2-valuation-table__cell">
                        {{ row.score.toFixed(2) }}
                      </div>
                      <div class="v2-valuation-table__cell">
                        {{ formatKamasFull(row.fairValue) }}
                      </div>
                      <div
                        class="v2-valuation-table__cell"
                        :class="{
                          'v2-profit--up': row.delta < 0,
                          'v2-profit--down': row.delta > 0,
                        }"
                      >
                        {{ row.delta > 0 ? '+' : '' }}{{ formatKamasFull(row.delta) }}
                      </div>
                      <div class="v2-valuation-table__cell">
                        {{ formatKamasFull(row.quickRelist) }}
                      </div>
                      <div class="v2-valuation-table__cell">
                        {{ formatKamasFull(row.fairRelist) }}
                      </div>
                      <div class="v2-valuation-table__cell">
                        {{ formatKamasFull(row.greedyRelist) }}
                      </div>
                    </template>
                  </div>
                  <div v-else class="v2-empty-full">
                    No selected listings match the current valuation filter.
                  </div>
                  <div class="v2-valuation-note">
                    Negative delta means the listing is below the model fair value. Quick/fair/greedy are relist suggestions for undervalued buys.
                  </div>
                </div>
              </div>

              <div class="v2-recipe-toolbar">
                <button class="v2-recipe-refresh" @click="showPriceManager = !showPriceManager">
                  {{ showPriceManager ? 'Hide price manager' : 'Manage prices' }}
                </button>
                <span class="v2-recipe-cache-hint">
                  Missing prices are shown first
                </span>
              </div>

              <div v-if="showPriceManager" class="v2-price-manager">
                <div class="v2-price-manager__head">
                  <span class="v2-rstat__label">Current recipe prices</span>
                </div>
                <div class="v2-price-manager__list">
                  <div v-for="ingredient in recipeIngredients" :key="`manager-${ingredient.id}`" class="v2-price-manager__row">
                    <span class="v2-price-manager__name">{{ ingredient.name }}</span>
                    <input
                      :value="ingredient.unitPrice || ''"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      class="v2-recipe-price-entry__input"
                      @input="upsertResourcePrice(ingredient, ($event.target as HTMLInputElement).value)"
                    />
                    <span class="v2-price-manager__freshness">
                      {{ ingredient.priceUpdatedLabel || 'No saved price' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="v2-recipe-list">
                <div class="v2-recipe-list__head">Ingredients</div>
                <div v-if="recipeIngredients.length" class="v2-recipe-lines">
                  <div v-for="ingredient in recipeIngredients" :key="ingredient.id" class="v2-recipe-line">
                    <div class="v2-recipe-line__img-wrap">
                      <img v-if="ingredient.image" :src="ingredient.image" :alt="ingredient.name" class="v2-recipe-line__img" @error="noImg" />
                      <div v-else class="v2-recipe-line__img-ph" />
                    </div>
                    <div class="v2-recipe-line__body">
                      <div class="v2-recipe-line__name">{{ ingredient.name }}</div>
                      <div class="v2-recipe-line__meta">
                        <span v-if="ingredient.typeName">{{ ingredient.typeName }}</span>
                        <span v-if="ingredient.level !== null"> · Level {{ ingredient.level }}</span>
                      </div>
                      <div class="v2-resource-badges v2-resource-badges--compact">
                        <span v-if="ingredient.dropMonsterCount > 0" class="v2-resource-badge v2-resource-badge--drop">
                          Monster drop
                        </span>
                        <span v-if="ingredient.hasRecipe" class="v2-resource-badge v2-resource-badge--crafted">
                          Crafted
                        </span>
                        <span v-if="ingredient.isSpecial" class="v2-resource-badge v2-resource-badge--special">
                          Special
                        </span>
                      </div>
                      <div class="v2-recipe-price-entry">
                        <label class="v2-recipe-price-entry__label">Unit price</label>
                        <input
                          :value="ingredient.unitPrice || ''"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          class="v2-recipe-price-entry__input"
                          @input="upsertResourcePrice(ingredient, ($event.target as HTMLInputElement).value)"
                        />
                        <span class="v2-recipe-price-entry__total">
                          Total {{ formatKamasFull(ingredient.unitPrice * ingredient.quantity) }}
                        </span>
                        <span class="v2-recipe-price-entry__freshness">
                          {{ ingredient.priceUpdatedLabel || 'No saved price' }}
                        </span>
                      </div>
                    </div>
                    <div class="v2-recipe-line__qty">
                      <span class="v2-recipe-line__qty-label">Qty</span>
                      <strong>{{ ingredient.quantity }}</strong>
                    </div>
                  </div>
                </div>
                <div v-else class="v2-empty-full">
                  No ingredients found for this recipe.
                </div>
              </div>
            </template>
          </div>
        </template>

        <template v-else-if="aggregateRecipeState.isOpen">
          <div class="v2-recipe-shell">
            <div class="v2-recipe-top">
              <button class="v2-recipe-back" @click="resetAggregateRecipeView">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <span class="v2-recipe-kicker">Aggregate recipe proof of concept</span>
            </div>

            <div class="v2-recipe-item">
              <div class="min-w-0 flex-1">
                <div class="v2-recipe-item__name">
                  {{ $t(`items.slots.${activeSlot}`) }} recipe pressure
                </div>
                <div class="v2-recipe-item__meta">
                  Top {{ aggregateRecipeState.limit }} items from current filters · counts ingredient presence per item recipe
                </div>
              </div>
              <div class="v2-bulk-limit">
                <button
                  v-for="limit in aggregateLimits"
                  :key="limit"
                  class="v2-bulk-limit__btn"
                  :class="{ 'v2-bulk-limit__btn--on': aggregateRecipeState.limit === limit }"
                  @click="openAggregateRecipeView(limit)"
                >
                  {{ limit }}
                </button>
              </div>
            </div>

            <div v-if="aggregateRecipeState.isLoading" class="v2-center-loader">
              <div class="v2-spin" /> Loading aggregate recipes...
            </div>

            <div v-else-if="aggregateRecipeState.error" class="v2-recipe-error">
              {{ aggregateRecipeState.error }}
            </div>

            <template v-else>
              <div class="v2-recipe-stats">
                <div class="v2-rstat">
                  <div class="v2-rstat__label">Selected items</div>
                  <div class="v2-rstat__val">{{ aggregateRecipeState.selectedItems.length }}</div>
                </div>
                <div class="v2-rstat">
                  <div class="v2-rstat__label">Unique resources</div>
                  <div class="v2-rstat__val">{{ aggregateIngredients.length }}</div>
                </div>
                <div class="v2-rstat">
                  <div class="v2-rstat__label">Metric</div>
                  <div class="v2-rstat__val">{{ aggregateSortMode === 'items' ? 'Items first' : 'Qty first' }}</div>
                </div>
              </div>

              <div class="v2-aggregate-sort">
                <span class="v2-aggregate-sort__label">Sort by</span>
                <div class="v2-bulk-limit">
                  <button
                    class="v2-bulk-limit__btn"
                    :class="{ 'v2-bulk-limit__btn--on': aggregateSortMode === 'items' }"
                    @click="aggregateSortMode = 'items'"
                  >
                    Items
                  </button>
                  <button
                    class="v2-bulk-limit__btn"
                    :class="{ 'v2-bulk-limit__btn--on': aggregateSortMode === 'quantity' }"
                    @click="aggregateSortMode = 'quantity'"
                  >
                    Qty
                  </button>
                </div>
              </div>

              <div class="v2-aggregate-filters">
                <span class="v2-aggregate-sort__label">Resource filters</span>
                <div class="v2-aggregate-filters__row">
                  <button
                    class="v2-bulk-limit__btn"
                    :class="{ 'v2-bulk-limit__btn--on': aggregateResourceFilters.hideSpecial }"
                    @click="aggregateResourceFilters.hideSpecial = !aggregateResourceFilters.hideSpecial"
                  >
                    Hide special
                  </button>
                  <button
                    class="v2-bulk-limit__btn"
                    :class="{ 'v2-bulk-limit__btn--on': aggregateResourceFilters.onlyMonsterDrops }"
                    @click="aggregateResourceFilters.onlyMonsterDrops = !aggregateResourceFilters.onlyMonsterDrops"
                  >
                    Monster drops
                  </button>
                  <button
                    class="v2-bulk-limit__btn"
                    :class="{ 'v2-bulk-limit__btn--on': aggregateResourceFilters.onlyNonCrafted }"
                    @click="aggregateResourceFilters.onlyNonCrafted = !aggregateResourceFilters.onlyNonCrafted"
                  >
                    Non-crafted
                  </button>
                  <button
                    class="v2-bulk-limit__btn"
                    :class="{ 'v2-bulk-limit__btn--on': aggregateResourceFilters.minItemUsage === 2 }"
                    @click="aggregateResourceFilters.minItemUsage = aggregateResourceFilters.minItemUsage === 2 ? 1 : 2"
                  >
                    Items >= 2
                  </button>
                </div>
              </div>

              <div v-if="aggregateRecipeState.selectedItems.length" class="v2-selected-items">
                <span class="v2-selected-items__label">Selected items</span>
                <div class="v2-selected-items__list">
                  <span v-for="item in aggregateRecipeState.selectedItems" :key="item.name" class="v2-selected-items__chip">
                    {{ item.name }}
                  </span>
                </div>
              </div>

              <div class="v2-recipe-list">
                <div class="v2-recipe-list__head">Resources ranked by recipe presence</div>
                <div v-if="aggregateIngredients.length" class="v2-recipe-lines">
                  <div v-for="ingredient in aggregateIngredients" :key="ingredient.id" class="v2-recipe-line">
                      <div class="v2-recipe-line__img-wrap">
                        <img v-if="ingredient.image" :src="ingredient.image" :alt="ingredient.name" class="v2-recipe-line__img" @error="noImg" />
                        <div v-else class="v2-recipe-line__img-ph" />
                      </div>
                      <div class="v2-recipe-line__body">
                        <div class="v2-recipe-line__name">{{ ingredient.name }}</div>
                        <div class="v2-recipe-line__meta">
                        <span v-if="ingredient.typeName">{{ ingredient.typeName }}</span>
                        <span v-if="ingredient.level !== null"> · Level {{ ingredient.level }}</span>
                      </div>
                      <div class="v2-resource-badges v2-resource-badges--compact">
                        <span v-if="ingredient.dropMonsterCount > 0" class="v2-resource-badge v2-resource-badge--drop">
                          Monster drop
                        </span>
                        <span v-if="ingredient.hasRecipe" class="v2-resource-badge v2-resource-badge--crafted">
                          Crafted
                        </span>
                        <span v-if="ingredient.isSpecial" class="v2-resource-badge v2-resource-badge--special">
                          Special
                        </span>
                      </div>
                      <div v-if="ingredient.items.length" class="v2-recipe-line__links">
                      <span class="v2-recipe-line__links-label">Used in</span>
                      <button
                        v-for="item in ingredient.items"
                        :key="item.name"
                        class="v2-recipe-item-chip"
                        @click="openRecipeView(item)"
                      >
                        {{ item.name }}
                      </button>
                    </div>
                    </div>
                    <div class="v2-recipe-line__qty">
                      <span class="v2-recipe-line__qty-label">Items</span>
                      <strong>{{ ingredient.usageCount }}</strong>
                      <span class="v2-recipe-line__qty-sub">Qty {{ ingredient.totalQuantity }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="v2-empty-full">
                  No aggregate recipe data found.
                </div>
              </div>
            </template>
          </div>
        </template>

        <template v-else>
          <!-- Header row -->
          <div class="v2-slot-head">
            <span class="v2-slot-head__title">
              {{ $t('items.mostUsed', { slot: $t(`items.slots.${activeSlot}`) }) }}
            </span>
            <div class="v2-slot-head__actions">
              <button class="v2-bulk-open" @click="openAggregateRecipeView(aggregateRecipeState.limit)">
                Recipe pressure
              </button>
              <div class="v2-view-toggle">
              <button class="v2-view-btn" :class="{ 'v2-view-btn--on': viewMode === 'grid' }" @click="viewMode = 'grid'" :title="$t('items.viewModes.grid')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button class="v2-view-btn" :class="{ 'v2-view-btn--on': viewMode === 'list' }" @click="viewMode = 'list'" :title="$t('items.viewModes.list')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button class="v2-view-btn" :class="{ 'v2-view-btn--on': viewMode === 'table' }" @click="viewMode = 'table'" :title="$t('items.viewModes.table')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              </div>
            </div>
          </div>

          <div v-if="viewMode === 'grid'" class="v2-items-grid">
            <div
              v-for="(item, i) in currentSlotStats.topItems.slice(0, 20)"
              :key="item.name"
              class="v2-item-card"
              @click="openRecipeView(item)"
            >
              <div class="v2-item-card__rank">#{{ i + 1 }}</div>
              <div class="v2-item-card__img-wrap">
                <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="v2-item-card__img" @error="noImg" />
                <div v-else class="v2-item-card__img-ph">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" /></svg>
                </div>
              </div>
              <div class="v2-item-card__name" :title="item.name">{{ item.name }}</div>
              <div class="v2-item-card__usage">{{ item.count }} · {{ pct(item.count) }}%</div>
              <div class="v2-item-bar"><div class="v2-item-bar__fill" :style="{ width: barW(item.count) }" /></div>
            </div>
          </div>

          <div v-else-if="viewMode === 'list'" class="v2-items-list">
            <div
              v-for="(item, i) in currentSlotStats.topItems.slice(0, 15)"
              :key="item.name"
              class="v2-item-row"
              @click="openRecipeView(item)"
            >
              <span class="v2-item-row__rank">#{{ i + 1 }}</span>
              <div class="v2-item-row__img-wrap">
                <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="v2-item-row__img" @error="noImg" />
                <div v-else class="v2-item-row__img-ph" />
              </div>
              <span class="v2-item-row__name">{{ item.name }}</span>
              <div class="v2-item-row__bar-wrap">
                <div class="v2-item-bar v2-item-bar--sm">
                  <div class="v2-item-bar__fill" :style="{ width: barW(item.count) }" />
                </div>
              </div>
              <span class="v2-item-row__count">{{ item.count }}</span>
              <span class="v2-item-row__pct">{{ pct(item.count) }}%</span>
            </div>
          </div>

          <div v-else-if="viewMode === 'table'" class="v2-items-table-wrap">
            <table class="v2-items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th></th>
                  <th>{{ $t('items.table.name') }}</th>
                  <th class="text-right">{{ $t('items.table.count') }}</th>
                  <th class="text-right">%</th>
                  <th>{{ $t('items.table.distribution') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in currentSlotStats.topItems.slice(0, 20)" :key="item.name" @click="openRecipeView(item)">
                  <td class="v2-table-rank">{{ i + 1 }}</td>
                  <td>
                    <div class="v2-table-img-wrap">
                      <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="v2-table-img" @error="noImg" />
                      <div v-else class="v2-table-img-ph" />
                    </div>
                  </td>
                  <td class="v2-table-name">{{ item.name }}</td>
                  <td class="v2-table-num text-right">{{ item.count }}</td>
                  <td class="v2-table-pct text-right">{{ pct(item.count) }}%</td>
                  <td>
                    <div class="v2-item-bar v2-item-bar--sm">
                      <div class="v2-item-bar__fill" :style="{ width: barW(item.count) }" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="currentSlotStats.topItems.length === 0" class="v2-empty-full">
            {{ $t('items.noData') }}
          </div>
        </template>
      </div>

      <div v-else class="v2-empty-full" style="padding:3rem">
        No data for this slot yet.
      </div>
    </template>

    <div v-else-if="!loading" class="v2-empty-full" style="padding:4rem">
      No equipment data found. Try removing some filters.
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'v2' })

const { t } = useI18n()

const ELEMENTS = [
  { name: 'eau', icon: '/eau.png' },
  { name: 'feu', icon: '/feu.png' },
  { name: 'terre', icon: '/terre.png' },
  { name: 'air', icon: '/air.png' },
  { name: 'multi', icon: '/multi.png' },
  { name: 'tank', icon: '/tank.png' },
  { name: 'doPou', icon: '/doPou.png' },
  { name: 'pp', icon: '/pp.png' },
]

const MODES = ['pvm', 'pvp']

const LEVELS = ['20', '40', '60', '80', '110', '130', '160', '180', '199', '200']

const BUDGETS = ['low', 'mid', 'high']

const CLASSES = [
  { name: 'iop', icon: '/Iop.png' },
  { name: 'cra', icon: '/Cra.png' },
  { name: 'sacrieur', icon: '/Sacrieur.png' },
  { name: 'eniripsa', icon: '/Eniripsa.png' },
  { name: 'sram', icon: '/Sram.png' },
  { name: 'ouginak', icon: '/Ouginak.png' },
  { name: 'forgelance', icon: '/Forgelance.png' },
  { name: 'osamodas', icon: '/Osamodas.png' },
  { name: 'enutrof', icon: '/Enutrof.png' },
  { name: 'ecaflip', icon: '/Ecaflip.png' },
  { name: 'steamer', icon: '/Steamer.png' },
  { name: 'feca', icon: '/Feca.png' },
  { name: 'huppermage', icon: '/Huppermage.png' },
  { name: 'zobal', icon: '/Zobal.png' },
  { name: 'pandawa', icon: '/Pandawa.png' },
  { name: 'eliotrope', icon: '/Eliotrope.png' },
  { name: 'sadida', icon: '/Sadida.png' },
  { name: 'roublard', icon: '/Roublard.png' },
  { name: 'xelor', icon: '/Xelor.png' },
]

const SLOTS = [
  { key: 'ar', icon: '⚔️' },
  { key: 'ch', icon: '🎩' },
  { key: 'ca', icon: '🦸' },
  { key: 'am', icon: '📿' },
  { key: 'br', icon: '🛡️' },
  { key: 'ce', icon: '👑' },
  { key: 'bo', icon: '👢' },
  { key: 'a1', icon: '💍' },
  { key: 'a2', icon: '💍' },
  { key: 'fa', icon: '🐾' },
  { key: 'd1', icon: '🥚' },
  { key: 'd2', icon: '🥚' },
  { key: 'd3', icon: '🥚' },
  { key: 'd4', icon: '🥚' },
  { key: 'd5', icon: '🥚' },
  { key: 'd6', icon: '🥚' },
]

const filters = reactive({ element: '', mode: '', classe: '', level: '', budget: '' })
const loading = ref(false)
const activeSlot = ref('ar')
const viewMode = ref<'grid' | 'list' | 'table'>('grid')
const stats = ref<any>(null)
const selectedRecipeItem = ref<any>(null)
const selectedRecipeSellPrice = ref(0)
const ocrFileInput = ref<HTMLInputElement | null>(null)
const statsScreenshotInput = ref<HTMLInputElement | null>(null)
const pendingStatsObservationId = ref('')
type RecipeLookupSource = 'cache' | 'network' | ''
type RecipeMatchConfidence = 'exact' | 'approx' | ''
type CachedDofusdbRecipeEntry = {
  normalizedName: string
  dofusdbId: number
  matchedName: string
  confidence: Exclude<RecipeMatchConfidence, ''>
  recipe: any
  updatedAt: string
}
type CachedEffectEntry = {
  id: number
  data: any
}
type StoredResourcePriceEntry = {
  resourceId: number
  name: string
  price: number
  updatedAt: string
}
type StoredObservedPriceEntry = {
  id: string
  itemKey: string
  itemName: string
  price: number
  createdAt: string
  source: 'ocr'
  marketScreenshotDataUrl: string
  statsScreenshotDataUrl?: string
  statsRawText?: string
  statsEntries: Array<{
    key: string
    label: string
    value: number | null
    suffix: string
    rangeText: string
    raw?: string
    isManual?: boolean
  }>
}

const DOFUSDB_RECIPE_CACHE_KEY = 'dofus-items-dofusdb-recipe-cache-v1'
const ITEM_RESOURCE_PRICES_KEY = 'dofus-items-resource-prices-v1'
const ITEM_OBSERVED_PRICES_KEY = 'dofus-items-observed-prices-v1'
const DOFUS_EFFECT_CACHE_KEY = 'dofus-items-effect-cache-v1'
const ITEM_STAT_PRIORITY_KEY = 'dofus-items-stat-priority-v1'

const recipeLookupState = ref<{
  isLoading: boolean
  error: string
  data: any | null
  source: RecipeLookupSource
  confidence: RecipeMatchConfidence
}>({
  isLoading: false,
  error: '',
  data: null,
  source: '',
  confidence: '',
})
const resourcePrices = ref<Record<string, StoredResourcePriceEntry>>({})
const observedPrices = ref<Record<string, StoredObservedPriceEntry[]>>({})
const selectedObservationId = ref('')
const showPriceManager = ref(false)
const ocrState = ref<{
  isLoading: boolean
  error: string
  candidates: number[]
  rawText: string
  debugMode: string
  screenshotDataUrl: string
  debugRows: Array<{
    source: string
    raw: string
    tokens: string[]
    candidate: number | null
  }>
}>({
  isLoading: false,
  error: '',
  candidates: [],
  rawText: '',
  debugMode: '',
  screenshotDataUrl: '',
  debugRows: [],
})
const aggregateLimits = [3, 5, 10, 20]
const aggregateSortMode = ref<'items' | 'quantity'>('items')
const aggregateResourceFilters = reactive({
  hideSpecial: false,
  onlyMonsterDrops: false,
  onlyNonCrafted: false,
  minItemUsage: 1,
})
const aggregateRecipeState = ref<{
  isOpen: boolean
  isLoading: boolean
  error: string
  data: any[]
  limit: number
  selectedItems: Array<{ name: string; image_url?: string | null; count: number }>
}>({
  isOpen: false,
  isLoading: false,
  error: '',
  data: [],
  limit: 5,
  selectedItems: [],
})
const statsOcrState = ref({
  isLoading: false,
  error: '',
})
const selectedObservedPriceIds = ref<string[]>([])
const showOnlyUndervaluedListings = ref(false)
const effectCache = ref<Record<string, CachedEffectEntry>>({})
const itemStatPriorities = ref<Record<string, Record<string, number>>>({})
const observationStatOptions = [
  { key: 'vitalite', label: 'Vitalité', suffix: '' },
  { key: 'force', label: 'Force', suffix: '' },
  { key: 'intelligence', label: 'Intelligence', suffix: '' },
  { key: 'chance', label: 'Chance', suffix: '' },
  { key: 'agilite', label: 'Agilité', suffix: '' },
  { key: 'critique', label: 'Critique', suffix: '%' },
  { key: 'pa', label: 'PA', suffix: '' },
  { key: 'pm', label: 'PM', suffix: '' },
  { key: 'po', label: 'PO', suffix: '' },
  { key: 'invocation', label: 'Invocation', suffix: '' },
  { key: 'dommages_neutre', label: 'Dommages Neutre', suffix: '' },
  { key: 'dommages_terre', label: 'Dommages Terre', suffix: '' },
  { key: 'dommages_feu', label: 'Dommages Feu', suffix: '' },
  { key: 'dommages_eau', label: 'Dommages Eau', suffix: '' },
  { key: 'dommages_air', label: 'Dommages Air', suffix: '' },
  { key: 'prospection', label: 'Prospection', suffix: '' },
  { key: 'resistance_air', label: 'Résistance Air', suffix: '%' },
  { key: 'resistance_terre', label: 'Résistance Terre', suffix: '%' },
  { key: 'resistance_feu', label: 'Résistance Feu', suffix: '%' },
  { key: 'resistance_eau', label: 'Résistance Eau', suffix: '%' },
  { key: 'resistance_neutre', label: 'Résistance Neutre', suffix: '%' },
  { key: 'fuite', label: 'Fuite', suffix: '' },
  { key: 'tacle', label: 'Tacle', suffix: '' },
  { key: 'retrait_pa', label: 'Retrait PA', suffix: '' },
  { key: 'retrait_pm', label: 'Retrait PM', suffix: '' },
]
const statPriorityPresets = [
  { key: 'ignore', label: 'Ignore', multiplier: 0 },
  { key: 'low', label: 'Low', multiplier: 0.75 },
  { key: 'normal', label: 'Normal', multiplier: 1 },
  { key: 'high', label: 'High', multiplier: 1.5 },
  { key: 'critical', label: 'Critical', multiplier: 2 },
]
const observationStatWeightMap: Record<string, number> = {
  vitalite: 1,
  force: 1,
  intelligence: 1,
  chance: 1,
  agilite: 1,
  critique: 1.5,
  pa: 4,
  pm: 4,
  po: 3,
  invocation: 2,
  dommages_neutre: 1.4,
  dommages_terre: 1.4,
  dommages_feu: 1.4,
  dommages_eau: 1.4,
  dommages_air: 1.4,
  prospection: 0.8,
  resistance_air: 1.8,
  resistance_terre: 1.8,
  resistance_feu: 1.8,
  resistance_eau: 1.8,
  resistance_neutre: 1.8,
  fuite: 1.3,
  tacle: 1.3,
  retrait_pa: 2.2,
  retrait_pm: 2.2,
}

const setFilter = (key: keyof typeof filters, val: string) => {
  filters[key] = val
  fetchData()
}

const getSlotStats = (slotKey: string) => stats.value?.slotStats?.[slotKey] ?? null

const currentSlotStats = computed(() => getSlotStats(activeSlot.value))

const normalizeDofusdbSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’`]/g, "'")
    .toLowerCase()
    .trim()

const getRecipeMatchConfidence = (searchedName: string, matchedName: string): Exclude<RecipeMatchConfidence, ''> => {
  return normalizeDofusdbSearch(searchedName) === normalizeDofusdbSearch(matchedName)
    ? 'exact'
    : 'approx'
}

const readRecipeCache = (): Record<string, CachedDofusdbRecipeEntry> => {
  if (!import.meta.client) return {}

  try {
    const raw = localStorage.getItem(DOFUSDB_RECIPE_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeRecipeCache = (cache: Record<string, CachedDofusdbRecipeEntry>) => {
  if (!import.meta.client) return
  localStorage.setItem(DOFUSDB_RECIPE_CACHE_KEY, JSON.stringify(cache))
}

const readResourcePrices = (): Record<string, StoredResourcePriceEntry> => {
  if (!import.meta.client) return {}

  try {
    const raw = localStorage.getItem(ITEM_RESOURCE_PRICES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeResourcePrices = (prices: Record<string, StoredResourcePriceEntry>) => {
  if (!import.meta.client) return
  localStorage.setItem(ITEM_RESOURCE_PRICES_KEY, JSON.stringify(prices))
}

const readObservedPrices = (): Record<string, StoredObservedPriceEntry[]> => {
  if (!import.meta.client) return {}

  try {
    const raw = localStorage.getItem(ITEM_OBSERVED_PRICES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}

    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [
        key,
        Array.isArray(value)
          ? value.map((entry: any) => ({
              ...entry,
              statsEntries: Array.isArray(entry?.statsEntries)
                ? entry.statsEntries
                : Array.isArray(entry?.statsLines)
                  ? entry.statsLines.map((line: string) => ({
                      key: 'unknown',
                      label: line,
                      value: null,
                      suffix: '',
                      rangeText: '',
                      raw: line,
                    }))
                  : [],
              statsRawText: typeof entry?.statsRawText === 'string' ? entry.statsRawText : '',
              statsScreenshotDataUrl: entry?.statsScreenshotDataUrl || '',
              marketScreenshotDataUrl: entry?.marketScreenshotDataUrl || '',
            }))
          : [],
      ])
    )
  } catch {
    return {}
  }
}

const writeObservedPrices = (entries: Record<string, StoredObservedPriceEntry[]>) => {
  if (!import.meta.client) return
  localStorage.setItem(ITEM_OBSERVED_PRICES_KEY, JSON.stringify(entries))
}

const readEffectCache = (): Record<string, CachedEffectEntry> => {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(DOFUS_EFFECT_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeEffectCache = (entries: Record<string, CachedEffectEntry>) => {
  if (!import.meta.client) return
  localStorage.setItem(DOFUS_EFFECT_CACHE_KEY, JSON.stringify(entries))
}

const readItemStatPriorities = (): Record<string, Record<string, number>> => {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(ITEM_STAT_PRIORITY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeItemStatPriorities = (entries: Record<string, Record<string, number>>) => {
  if (!import.meta.client) return
  localStorage.setItem(ITEM_STAT_PRIORITY_KEY, JSON.stringify(entries))
}

const ensureEffectLabels = async (effects: Array<{ effectId?: number; id?: number }> | null | undefined) => {
  if (!Array.isArray(effects) || !effects.length) return

  const missingIds = [...new Set(
    effects
      .map((effect) => effect?.effectId ?? effect?.id)
      .filter((value): value is number => Number.isFinite(value) && !effectCache.value[String(value)]?.data)
  )]

  if (!missingIds.length) return

  const fetched = await Promise.all(
    missingIds.map(async (effectId) => {
      try {
        const data = await $fetch(`/api/dofusdb/effects/${effectId}`)
        return [String(effectId), { id: effectId, data }] as const
      } catch {
        return null
      }
    })
  )

  const nextEntries = fetched.filter(Boolean)
  if (!nextEntries.length) return

  const nextCache = {
    ...effectCache.value,
    ...Object.fromEntries(nextEntries),
  }

  effectCache.value = nextCache
  writeEffectCache(nextCache)
}

const formatEffectLabel = (effData: any, eff: any): string => {
  let desc = effData?.description?.fr ?? effData?.description?.en ?? `Effet ${eff.effectId ?? eff.id}`
  const from = eff.from ?? eff.value ?? 0
  const to = eff.to ?? eff.value ?? 0
  if (from === to) {
    desc = desc
      .replace(/\{[^}]*\}/g, '')
      .replace(/#1/g, String(from))
      .replace(/#2/g, '')
      .trim()
  } else {
    desc = desc
      .replace(/#1/g, String(from))
      .replace(/#2/g, String(to))
      .replace(/\{~1~2 ([^}]*)\}/g, '$1')
      .replace(/\{[^}]*\}/g, '')
      .trim()
  }
  return desc.replace(/\s{2,}/g, ' ').trim()
}

const selectedObservationKey = computed(() =>
  selectedRecipeItem.value?.name ? normalizeDofusdbSearch(selectedRecipeItem.value.name) : ''
)

const selectedItemObservations = computed(() => {
  const key = selectedObservationKey.value
  if (!key) return []
  return (observedPrices.value[key] || []).slice().sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const parseObservationRange = (rangeText: string) => {
  const numbers = rangeText.match(/-?\d+/g)?.map(Number) || []
  if (!numbers.length) return null
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] }
  return {
    min: Math.min(numbers[0], numbers[1]),
    max: Math.max(numbers[0], numbers[1]),
  }
}

const normalizeLabelForStatKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

const findStatOptionByLabel = (label: string) => {
  const normalized = normalizeLabelForStatKey(label)
  return observationStatOptions.find((option) => normalized.includes(normalizeLabelForStatKey(option.label)))
}

const currentItemKey = computed(() =>
  selectedRecipeItem.value?.name ? normalizeDofusdbSearch(selectedRecipeItem.value.name) : ''
)

const currentItemPriorityOptions = computed(() => {
  const effects = recipeLookupState.value.data?.result?.effects
  if (!Array.isArray(effects)) return []

  const seen = new Set<string>()
  return effects
    .map((effect: any) => {
      const cached = effectCache.value[String(effect.effectId)]?.data
      if (!cached) return null
      const label = formatEffectLabel(cached, effect)
      const option = findStatOptionByLabel(label)
      if (!option) return null
      if (seen.has(option.key)) return null
      seen.add(option.key)
      const range = effect.from === effect.to
        ? `[${effect.from}]`
        : `[${effect.from} à ${effect.to}]`
      return {
        key: option.key,
        label: option.label,
        rangeText: range,
      }
    })
    .filter(Boolean)
})

const getItemStatMultiplier = (statKey: string) => {
  const itemKey = currentItemKey.value
  if (!itemKey) return 1
  return itemStatPriorities.value[itemKey]?.[statKey] ?? 1
}

const setItemStatMultiplier = (statKey: string, multiplier: number) => {
  const itemKey = currentItemKey.value
  if (!itemKey) return
  const next = {
    ...itemStatPriorities.value,
    [itemKey]: {
      ...(itemStatPriorities.value[itemKey] || {}),
      [statKey]: multiplier,
    },
  }
  itemStatPriorities.value = next
  writeItemStatPriorities(next)
}

const computeObservationScore = (observation: StoredObservedPriceEntry) => {
  return observation.statsEntries.reduce((sum, entry) => {
    if (entry.value === null || entry.value === undefined) return sum
    const range = parseObservationRange(entry.rangeText)
    const weight = (observationStatWeightMap[entry.key] ?? 1) * getItemStatMultiplier(entry.key)

    if (weight <= 0) return sum

    if (!range) return sum + weight

    if (range.max === range.min) {
      return sum + weight
    }

    const normalized = Math.max(
      0,
      Math.min(1, (entry.value - range.min) / (range.max - range.min))
    )

    return sum + normalized * weight
  }, 0)
}

const medianOf = (values: number[]) => {
  if (!values.length) return 0
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

const roundRelistPrice = (value: number) => {
  const rounded = Math.max(0, Math.round(value))
  if (rounded <= 1000) return rounded
  return rounded - 1
}

const selectedObservedValuations = computed(() => {
  const selected = selectedItemObservations.value.filter((entry) =>
    selectedObservedPriceIds.value.includes(entry.id)
  )

  const withScores = selected
    .map((entry) => ({
      ...entry,
      score: computeObservationScore(entry),
    }))
    .filter((entry) => entry.score > 0)

  if (withScores.length < 2) return []

  return withScores.map((entry) => {
    const peers = withScores.filter((candidate) => candidate.id !== entry.id && candidate.score > 0)
    if (!peers.length) {
      return {
        id: entry.id,
        price: entry.price,
        score: entry.score,
        fairValue: entry.price,
        delta: 0,
        quickRelist: entry.price,
        fairRelist: entry.price,
        greedyRelist: entry.price,
        referencePricePerPoint: 0,
      }
    }

    const referencePricePerPoint = medianOf(
      peers.map((peer) => peer.price / peer.score).filter((value) => Number.isFinite(value) && value > 0)
    )
    const fairValue = Math.round(entry.score * referencePricePerPoint)
    const sortedHigherPeers = peers
      .filter((peer) => peer.price > entry.price)
      .sort((a, b) => a.price - b.price)
    const nearestHigherPeer = sortedHigherPeers[0]
    const highestPeer = peers.slice().sort((a, b) => b.price - a.price)[0]
    const quickRelist = nearestHigherPeer
      ? roundRelistPrice(nearestHigherPeer.price)
      : roundRelistPrice(Math.max(fairValue * 0.98, entry.price))
    const fairRelist = roundRelistPrice(Math.max(fairValue, entry.price))
    const greedyRelist = roundRelistPrice(
      Math.max(
        nearestHigherPeer ? Math.min(highestPeer?.price || fairValue, nearestHigherPeer.price * 1.02) : fairValue * 1.05,
        fairRelist
      )
    )

    return {
      id: entry.id,
      price: entry.price,
      score: entry.score,
      fairValue,
      delta: entry.price - fairValue,
      quickRelist,
      fairRelist,
      greedyRelist,
      referencePricePerPoint,
    }
  })
})

const displayedObservedValuations = computed(() => {
  return showOnlyUndervaluedListings.value
    ? selectedObservedValuations.value.filter((row) => row.delta < 0)
    : selectedObservedValuations.value
})

const valuationSummary = computed(() => {
  const rows = selectedObservedValuations.value
  if (!rows.length) {
    return {
      referencePricePerPoint: 0,
    }
  }

  return {
    referencePricePerPoint: medianOf(
      rows.map((row) => row.referencePricePerPoint).filter((value) => value > 0)
    ),
  }
})

const valuationConfidence = computed(() => {
  const sample = selectedObservedValuations.value.length
  if (sample >= 6) {
    return { level: 'high', label: 'High confidence' }
  }
  if (sample >= 4) {
    return { level: 'medium', label: 'Medium confidence' }
  }
  return { level: 'low', label: 'Low confidence' }
})

const selectedObservationDetail = computed(() => {
  if (!selectedObservationId.value) return null
  return selectedItemObservations.value.find((entry) => entry.id === selectedObservationId.value) || null
})

const fetchResolvedRecipe = async (item: { name: string }, options: { forceRefresh?: boolean } = {}) => {
  const normalizedName = normalizeDofusdbSearch(item.name)
  const cache = readRecipeCache()
  const cachedEntry = cache[normalizedName]

  if (cachedEntry && !options.forceRefresh) {
    return {
      recipe: cachedEntry.recipe,
      dofusdbId: cachedEntry.dofusdbId,
      source: 'cache' as const,
      confidence: cachedEntry.confidence,
    }
  }

  let dofusdbId = cachedEntry?.dofusdbId
  let matchedName = cachedEntry?.matchedName || item.name
  let confidence: Exclude<RecipeMatchConfidence, ''> = cachedEntry?.confidence || 'approx'

  if (!dofusdbId || options.forceRefresh) {
    const searchResponse = await $fetch<any>('/api/dofusdb/items', {
      query: {
        'typeId[$ne]': 203,
        '$sort': '-id',
        'slug.fr[$search]': normalizedName,
        'level[$gte]': 0,
        'level[$lte]': 200,
        '$skip': 0,
        lang: 'fr',
      },
    })

    const matchedItem = searchResponse?.data?.[0]

    if (!matchedItem?.id) {
      throw new Error(`Could not resolve DofusDB item for "${item.name}"`)
    }

    dofusdbId = matchedItem.id
    matchedName = matchedItem?.name?.fr || matchedItem?.name?.en || item.name
    confidence = getRecipeMatchConfidence(item.name, matchedName)
  }

  const recipe = await $fetch(`/api/dofusdb/recipes/${dofusdbId}`, {
    query: { lang: 'fr' },
  })

  cache[normalizedName] = {
    normalizedName,
    dofusdbId,
    matchedName,
    confidence,
    recipe,
    updatedAt: new Date().toISOString(),
  }
  writeRecipeCache(cache)

  return {
    recipe,
    dofusdbId,
    source: 'network' as const,
    confidence,
  }
}

const recipeIngredients = computed(() => {
  const recipe = recipeLookupState.value.data

  if (!recipe?.ingredientIds?.length || !recipe?.quantities?.length) return []

  return recipe.ingredientIds.map((ingredientId: number, index: number) => {
    const ingredient = recipe.ingredients?.find((entry: any) => entry.id === ingredientId)
    const normalizedTypeName = normalizeDofusdbSearch(ingredient?.type?.name?.fr || ingredient?.type?.name?.en || '')
    const normalizedIngredientName = normalizeDofusdbSearch(ingredient?.name?.fr || ingredient?.name?.en || '')
    const isSpecial =
      ingredientId === 14635 ||
      ['pepite', 'pepita', 'nugget'].includes(normalizedIngredientName) ||
      ['subtrat', 'substrat', 'concentrado', 'galet'].some((token) => normalizedTypeName.includes(token))

    return {
      id: ingredientId,
      quantity: recipe.quantities[index] ?? 0,
      name: ingredient?.name?.fr || ingredient?.name?.en || `Ingredient #${ingredientId}`,
      image: ingredient?.img || null,
      level: ingredient?.level ?? null,
      typeName: ingredient?.type?.name?.fr || ingredient?.type?.name?.en || null,
      hasRecipe: Boolean(ingredient?.hasRecipe),
      dropMonsterCount: Array.isArray(ingredient?.dropMonsterIds) ? ingredient.dropMonsterIds.length : 0,
      isSpecial,
      unitPrice: resourcePrices.value[String(ingredientId)]?.price ?? 0,
      priceUpdatedAt: resourcePrices.value[String(ingredientId)]?.updatedAt || null,
      priceUpdatedLabel: resourcePrices.value[String(ingredientId)]?.updatedAt
        ? formatPriceFreshness(resourcePrices.value[String(ingredientId)]?.updatedAt)
        : null,
    }
  }).sort((a, b) => {
    const aMissing = a.unitPrice > 0 ? 1 : 0
    const bMissing = b.unitPrice > 0 ? 1 : 0
    if (aMissing !== bMissing) return aMissing - bMissing
    return a.name.localeCompare(b.name)
  })
})

const recipeCostSummary = computed(() => {
  const ingredients = recipeIngredients.value
  const pricedCount = ingredients.filter((ingredient) => ingredient.unitPrice > 0).length
  const missingCount = ingredients.length - pricedCount
  const totalCost = ingredients.reduce(
    (sum, ingredient) => sum + ingredient.quantity * ingredient.unitPrice,
    0
  )

  return {
    totalCost,
    pricedCount,
    missingCount,
    totalIngredients: ingredients.length,
  }
})

const recipeProfitSummary = computed(() => {
  const sellPrice = Number(selectedRecipeSellPrice.value || 0)
  const craftCost = recipeCostSummary.value.totalCost
  const margin = sellPrice - craftCost
  const marginRate = sellPrice > 0 ? (margin / sellPrice) * 100 : 0

  return {
    sellPrice,
    craftCost,
    margin,
    marginRate,
  }
})

const aggregateIngredients = computed(() => {
  const source = aggregateRecipeState.value.data
  if (!source.length) return []

  const ingredientMap = new Map<number, {
    id: number
    name: string
    image: string | null
    level: number | null
    typeName: string | null
    hasRecipe: boolean
    dropMonsterCount: number
    isSpecial: boolean
    usageCount: number
    totalQuantity: number
    items: Array<{ name: string; image_url?: string | null; count: number }>
  }>()

  source.forEach((entry: any) => {
    const itemRef = entry.item
    const seenInThisRecipe = new Set<number>()

    entry.recipe?.ingredientIds?.forEach((ingredientId: number, index: number) => {
      const quantity = entry.recipe?.quantities?.[index] ?? 0
      const wasSeen = seenInThisRecipe.has(ingredientId)
      if (!wasSeen) seenInThisRecipe.add(ingredientId)

      const ingredient = entry.recipe.ingredients?.find((candidate: any) => candidate.id === ingredientId)
      const existing = ingredientMap.get(ingredientId)
      const normalizedTypeName = normalizeDofusdbSearch(ingredient?.type?.name?.fr || ingredient?.type?.name?.en || '')
      const normalizedIngredientName = normalizeDofusdbSearch(ingredient?.name?.fr || ingredient?.name?.en || '')

      if (existing) {
        if (!wasSeen) {
          existing.usageCount += 1
          existing.items.push(itemRef)
        }
        existing.totalQuantity += quantity
        return
      }

      ingredientMap.set(ingredientId, {
        id: ingredientId,
        name: ingredient?.name?.fr || ingredient?.name?.en || `Ingredient #${ingredientId}`,
        image: ingredient?.img || null,
        level: ingredient?.level ?? null,
        typeName: ingredient?.type?.name?.fr || ingredient?.type?.name?.en || null,
        hasRecipe: Boolean(ingredient?.hasRecipe),
        dropMonsterCount: Array.isArray(ingredient?.dropMonsterIds) ? ingredient.dropMonsterIds.length : 0,
        isSpecial:
          ingredientId === 14635 ||
          ['pepite', 'pepita', 'nugget'].includes(normalizedIngredientName) ||
          ['subtrat', 'substrat', 'concentrado', 'galet'].some((token) => normalizedTypeName.includes(token)),
        usageCount: 1,
        totalQuantity: quantity,
        items: [itemRef],
      })
    })
  })

  const filtered = Array.from(ingredientMap.values()).filter((ingredient) => {
    if (aggregateResourceFilters.hideSpecial && ingredient.isSpecial) return false
    if (aggregateResourceFilters.onlyMonsterDrops && ingredient.dropMonsterCount === 0) return false
    if (aggregateResourceFilters.onlyNonCrafted && ingredient.hasRecipe) return false
    if (ingredient.usageCount < aggregateResourceFilters.minItemUsage) return false
    return true
  })

  return filtered.sort((a, b) => {
    if (aggregateSortMode.value === 'quantity') {
      if (b.totalQuantity !== a.totalQuantity) return b.totalQuantity - a.totalQuantity
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount
      return a.name.localeCompare(b.name)
    }

    if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount
    if (b.totalQuantity !== a.totalQuantity) return b.totalQuantity - a.totalQuantity
    return a.name.localeCompare(b.name)
  })
})

const pct = (count: number) =>
  stats.value?.totalEquipments > 0
    ? ((count / stats.value.totalEquipments) * 100).toFixed(1)
    : '0'

const barW = (count: number) => {
  const top = currentSlotStats.value?.topItems?.[0]?.count ?? 1
  return `${(count / top) * 100}%`
}

const buildQuery = () => {
  const params = new URLSearchParams()
  if (filters.element) params.append('where[tags][in][0]', filters.element)
  if (filters.mode) params.append('where[mode][equals]', filters.mode)
  if (filters.classe) params.append('where[classe][equals]', filters.classe)
  if (filters.level) params.append('where[level][equals]', filters.level)
  if (filters.budget) params.append('where[budget][equals]', filters.budget)
  params.append('limit', '1000')
  return params.toString()
}

const upsertResourcePrice = (
  ingredient: { id: number; name: string },
  rawValue: number | string
) => {
  const parsedValue = Number(rawValue)
  const nextPrice = Number.isFinite(parsedValue) && parsedValue > 0 ? Math.round(parsedValue) : 0
  const nextPrices = {
    ...resourcePrices.value,
  }

  if (nextPrice <= 0) {
    delete nextPrices[String(ingredient.id)]
  } else {
    nextPrices[String(ingredient.id)] = {
      resourceId: ingredient.id,
      name: ingredient.name,
      price: nextPrice,
      updatedAt: new Date().toISOString(),
    }
  }

  resourcePrices.value = nextPrices
  writeResourcePrices(nextPrices)
}

const resetOcrState = () => {
  ocrState.value = {
    isLoading: false,
    error: '',
    candidates: [],
    rawText: '',
    debugMode: '',
    screenshotDataUrl: '',
    debugRows: [],
  }
  if (ocrFileInput.value) {
    ocrFileInput.value.value = ''
  }
}

const openOcrPicker = () => {
  ocrFileInput.value?.click()
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })

const handleOcrFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  ocrState.value = {
    isLoading: true,
    error: '',
    candidates: [],
    rawText: '',
    debugMode: '',
    screenshotDataUrl: '',
    debugRows: [],
  }

  try {
    const imageBase64 = await readFileAsDataUrl(file)
    const result = await $fetch<{
      text: string
      candidates: number[]
      debug?: {
        mode?: string
        rows?: Array<{
          source: string
          raw: string
          tokens: string[]
          candidate: number | null
        }>
      }
    }>('/api/ocr/hdv-prices', {
      method: 'POST',
      body: { imageBase64 },
    })

    ocrState.value = {
      isLoading: false,
      error: result.candidates.length ? '' : 'OCR ran, but no price candidates were detected.',
      candidates: result.candidates,
      rawText: result.text,
      debugMode: result.debug?.mode || '',
      screenshotDataUrl: imageBase64,
      debugRows: result.debug?.rows || [],
    }
  } catch (error) {
    console.error('Error running OCR:', error)
    ocrState.value = {
      isLoading: false,
      error: 'Failed to run OCR on this screenshot.',
      candidates: [],
      rawText: '',
      debugMode: '',
      screenshotDataUrl: '',
      debugRows: [],
    }
  }
}

const saveOcrSnapshotPrices = () => {
  const item = selectedRecipeItem.value
  const itemKey = selectedObservationKey.value

  if (!item || !itemKey || !ocrState.value.screenshotDataUrl || !ocrState.value.candidates.length) {
    return
  }

  const existing = observedPrices.value[itemKey] || []
  const createdAt = new Date().toISOString()
  const additions = ocrState.value.candidates.map((price) => ({
    id: `${itemKey}-${price}-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    itemKey,
    itemName: item.name,
    price,
    createdAt,
    source: 'ocr' as const,
    marketScreenshotDataUrl: ocrState.value.screenshotDataUrl,
    statsScreenshotDataUrl: '',
    statsRawText: '',
    statsEntries: [],
  }))

  const nextObserved = {
    ...observedPrices.value,
    [itemKey]: [...additions, ...existing],
  }

  observedPrices.value = nextObserved
  writeObservedPrices(nextObserved)
  selectedObservedPriceIds.value = [...new Set([...ocrState.value.candidates.map((price, index) => additions[index].id), ...selectedObservedPriceIds.value])]
}

const removeObservation = (observationId: string) => {
  const itemKey = selectedObservationKey.value
  if (!itemKey) return

  const nextObserved = {
    ...observedPrices.value,
    [itemKey]: (observedPrices.value[itemKey] || []).filter((entry) => entry.id !== observationId),
  }

  observedPrices.value = nextObserved
  writeObservedPrices(nextObserved)
  if (selectedObservationId.value === observationId) {
    selectedObservationId.value = ''
  }
  selectedObservedPriceIds.value = selectedObservedPriceIds.value.filter((id) => id !== observationId)
}

const openStatsScreenshotPicker = (observationId: string) => {
  pendingStatsObservationId.value = observationId
  statsScreenshotInput.value?.click()
}

const openObservationDetail = (observationId: string) => {
  selectedObservationId.value = observationId
}

const closeObservationDetail = () => {
  selectedObservationId.value = ''
  statsOcrState.value = {
    isLoading: false,
    error: '',
  }
}

const toggleObservedPriceSelection = (observationId: string) => {
  selectedObservedPriceIds.value = selectedObservedPriceIds.value.includes(observationId)
    ? selectedObservedPriceIds.value.filter((id) => id !== observationId)
    : [...selectedObservedPriceIds.value, observationId]
}

const selectAllObservedPrices = () => {
  selectedObservedPriceIds.value = selectedItemObservations.value.map((entry) => entry.id)
}

const clearObservedPriceSelection = () => {
  selectedObservedPriceIds.value = []
}

const updateObservationEntries = (
  itemKey: string,
  updater: (entry: StoredObservedPriceEntry) => StoredObservedPriceEntry
) => {
  const nextObserved = {
    ...observedPrices.value,
    [itemKey]: (observedPrices.value[itemKey] || []).map((entry) => updater(entry)),
  }

  observedPrices.value = nextObserved
  writeObservedPrices(nextObserved)
}

const updateObservationStatValue = (index: number, value: string) => {
  const itemKey = selectedObservationKey.value
  const observationId = selectedObservationId.value
  if (!itemKey || !observationId) return

  updateObservationEntries(itemKey, (entry) => {
    if (entry.id !== observationId) return entry
    const nextEntries = entry.statsEntries.slice()
    nextEntries[index] = {
      ...nextEntries[index],
      value: value === '' ? null : Number(value),
    }
    return {
      ...entry,
      statsEntries: nextEntries,
    }
  })
}

const updateObservationStatKey = (index: number, key: string) => {
  const itemKey = selectedObservationKey.value
  const observationId = selectedObservationId.value
  if (!itemKey || !observationId) return

  const option = observationStatOptions.find((entry) => entry.key === key)
  if (!option) return

  updateObservationEntries(itemKey, (entry) => {
    if (entry.id !== observationId) return entry
    const nextEntries = entry.statsEntries.slice()
    nextEntries[index] = {
      ...nextEntries[index],
      key: option.key,
      label: option.label,
      suffix: option.suffix,
    }
    return {
      ...entry,
      statsEntries: nextEntries,
    }
  })
}

const addObservationStatEntry = () => {
  const itemKey = selectedObservationKey.value
  const observationId = selectedObservationId.value
  if (!itemKey || !observationId) return

  const defaultOption = observationStatOptions[0]
  updateObservationEntries(itemKey, (entry) => {
    if (entry.id !== observationId) return entry
    return {
      ...entry,
      statsEntries: [
        ...entry.statsEntries,
        {
          key: defaultOption.key,
          label: defaultOption.label,
          value: null,
          suffix: defaultOption.suffix,
          rangeText: '',
          isManual: true,
        },
      ],
    }
  })
}

const removeObservationStatEntry = (index: number) => {
  const itemKey = selectedObservationKey.value
  const observationId = selectedObservationId.value
  if (!itemKey || !observationId) return

  updateObservationEntries(itemKey, (entry) => {
    if (entry.id !== observationId) return entry
    return {
      ...entry,
      statsEntries: entry.statsEntries.filter((_, lineIndex) => lineIndex !== index),
    }
  })
}

const handleStatsScreenshotChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  const itemKey = selectedObservationKey.value
  const observationId = pendingStatsObservationId.value

  if (!file || !itemKey || !observationId) return

  try {
    const imageBase64 = await readFileAsDataUrl(file)
    statsOcrState.value = {
      isLoading: true,
      error: '',
    }

    const result = await $fetch<{
      text: string
      entries: Array<{
        key: string
        label: string
        value: number | null
        suffix: string
        rangeText: string
        raw: string
      }>
    }>('/api/ocr/item-stats', {
      method: 'POST',
      body: { imageBase64 },
    })

    updateObservationEntries(itemKey, (entry) =>
      entry.id === observationId
          ? {
            ...entry,
            statsScreenshotDataUrl: imageBase64,
            statsRawText: result.text,
            statsEntries: result.entries,
          }
        : entry
    )

    selectedObservationId.value = observationId
    statsOcrState.value = {
      isLoading: false,
      error: '',
    }
  } catch (error) {
    console.error('Error running stats OCR:', error)
    statsOcrState.value = {
      isLoading: false,
      error: 'Failed to run OCR on the stats screenshot.',
    }
  } finally {
    pendingStatsObservationId.value = ''
    if (statsScreenshotInput.value) {
      statsScreenshotInput.value.value = ''
    }
  }
}

const formatPriceFreshness = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'Updated < 1h ago'
  if (diffHours < 24) return `Updated ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `Updated ${diffDays}d ago`
}

const resetRecipeView = () => {
  selectedRecipeItem.value = null
  selectedRecipeSellPrice.value = 0
  selectedObservationId.value = ''
  selectedObservedPriceIds.value = []
  showPriceManager.value = false
  resetOcrState()
  recipeLookupState.value = {
    isLoading: false,
    error: '',
    data: null,
    source: '',
    confidence: '',
  }
}

const resetAggregateRecipeView = () => {
  aggregateResourceFilters.hideSpecial = false
  aggregateResourceFilters.onlyMonsterDrops = false
  aggregateResourceFilters.onlyNonCrafted = false
  aggregateResourceFilters.minItemUsage = 1
  aggregateRecipeState.value = {
    ...aggregateRecipeState.value,
    isOpen: false,
    isLoading: false,
    error: '',
    data: [],
    selectedItems: [],
  }
}

const loadRecipeIntoView = async (
  item: { name: string; image_url?: string | null; count: number },
  options: { forceRefresh?: boolean } = {}
) => {
  resetAggregateRecipeView()
  selectedRecipeItem.value = item
  recipeLookupState.value = {
    isLoading: true,
    error: '',
    data: null,
    source: '',
    confidence: '',
  }

  try {
    const result = await fetchResolvedRecipe(item, options)

    recipeLookupState.value = {
      isLoading: false,
      error: '',
      data: result.recipe,
      source: result.source,
      confidence: result.confidence,
    }
  } catch (error) {
    console.error('Error fetching recipe:', error)
    recipeLookupState.value = {
      isLoading: false,
      error: 'Failed to load recipe for this item.',
      data: null,
      source: '',
      confidence: '',
    }
  }
}

const openRecipeView = async (item: { name: string; image_url?: string | null; count: number }) => {
  await loadRecipeIntoView(item)
}

const refetchSelectedRecipe = async () => {
  if (!selectedRecipeItem.value) return
  await loadRecipeIntoView(selectedRecipeItem.value, { forceRefresh: true })
}

const openAggregateRecipeView = async (limit: number) => {
  resetRecipeView()

  const selectedItems = (currentSlotStats.value?.topItems ?? []).slice(0, limit)

  aggregateRecipeState.value = {
    ...aggregateRecipeState.value,
    isOpen: true,
    isLoading: true,
    error: '',
    data: [],
    limit,
    selectedItems,
  }

  if (!selectedItems.length) {
    aggregateRecipeState.value = {
      ...aggregateRecipeState.value,
      isLoading: false,
      error: 'No items available for this selection.',
    }
    return
  }

  try {
    const recipes = await Promise.all(
      selectedItems.map(async (item) => {
        const result = await fetchResolvedRecipe(item)

        return {
          item,
          recipe: result.recipe,
        }
      })
    )

    aggregateRecipeState.value = {
      ...aggregateRecipeState.value,
      isLoading: false,
      data: recipes,
    }
  } catch (error) {
    console.error('Error fetching aggregate recipes:', error)
    aggregateRecipeState.value = {
      ...aggregateRecipeState.value,
      isLoading: false,
      error: 'Failed to load aggregate recipe data.',
      data: [],
    }
  }
}

const processData = (equipments: any[]) => {
  const slotStats: Record<string, { items: Record<string, number>; itemDetails: Record<string, any> }> = {}
  SLOTS.forEach(s => { slotStats[s.key] = { items: {}, itemDetails: {} } })

  equipments.forEach(eq => {
    if (!eq.items) return
    Object.entries(eq.items).forEach(([slotKey, item]: [string, any]) => {
      if (!item?.name || !slotStats[slotKey]) return
      slotStats[slotKey].items[item.name] = (slotStats[slotKey].items[item.name] ?? 0) + 1
      if (!slotStats[slotKey].itemDetails[item.name]) {
        slotStats[slotKey].itemDetails[item.name] = { image_url: item.image_url ?? null, item }
      }
    })
  })

  // Build sorted topItems per slot
  const processedSlots: Record<string, any> = {}
  SLOTS.forEach(s => {
    const raw = slotStats[s.key]
    const topItems = Object.entries(raw.items)
      .map(([name, count]) => ({ name, count, image_url: raw.itemDetails[name]?.image_url ?? null, rawItem: raw.itemDetails[name]?.item ?? null }))
      .sort((a, b) => b.count - a.count)
    processedSlots[s.key] = { topItems, totalItems: topItems.length }
  })

  const allItems = new Set<string>()
  SLOTS.forEach(s => { Object.keys(slotStats[s.key].items).forEach(n => allItems.add(n)) })

  let mostPopularSlot: { slot: string; count: number } | null = null
  SLOTS.forEach(s => {
    const c = Object.keys(slotStats[s.key].items).length
    if (!mostPopularSlot || c > mostPopularSlot.count) {
      mostPopularSlot = { slot: t(`items.slots.${s.key}`), count: c }
    }
  })

  const total = equipments.length
  const totalItemsUsed = SLOTS.reduce((sum, s) => {
    return sum + Object.values(slotStats[s.key].items).reduce((a, b) => a + b, 0)
  }, 0)

  stats.value = {
    slotStats: processedSlots,
    totalEquipments: total,
    uniqueItems: allItems.size,
    mostPopularSlot,
    avgItemsPerSet: total > 0 ? totalItemsUsed / total : 0,
  }
}

const fetchData = async () => {
  loading.value = true
  stats.value = null
  resetRecipeView()
  resetAggregateRecipeView()
  try {
    const qs = buildQuery()
    const res = await $fetch<any>(`/api/items/items${qs ? '?' + qs : ''}`)
    processData(res?.docs ?? [])
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
}

const noImg = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

const formatKamasFull = (value: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(value || 0))

onMounted(() => {
  resourcePrices.value = readResourcePrices()
  observedPrices.value = readObservedPrices()
  effectCache.value = readEffectCache()
  itemStatPriorities.value = readItemStatPriorities()
  fetchData()
})

watch(activeSlot, () => {
  resetRecipeView()
  resetAggregateRecipeView()
})

watch(selectedItemObservations, (observations) => {
  const validIds = new Set(observations.map((entry) => entry.id))
  selectedObservedPriceIds.value = selectedObservedPriceIds.value.filter((id) => validIds.has(id))
})

watch(
  () => recipeLookupState.value.data?.result?.effects,
  async (effects) => {
    await ensureEffectLabels(effects)
  },
  { immediate: true }
)
</script>

<style scoped>
/* ── Filters ─────────────────────────────────────────────── */
.v2-items-filters {
  display: flex; flex-direction: column; gap: .625rem;
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-active);
  border-radius: 14px; padding: .875rem 1rem; margin-bottom: .875rem;
}

.v2-filter-group {
  display: flex; align-items: center; gap: .625rem; flex-wrap: wrap;
}

.v2-filter-label {
  font-size: .6875rem; font-weight: 700; color: var(--v2-text-secondary);
  text-transform: uppercase; letter-spacing: .04em;
  min-width: 52px; flex-shrink: 0;
}

.v2-filter-chips { display: flex; flex-wrap: wrap; gap: 3px; }

.v2-fchip {
  padding: .25rem .625rem; border-radius: 7px;
  border: 1px solid var(--v2-border); background: transparent;
  color: var(--v2-text-muted); font-size: .75rem; font-weight: 500; cursor: pointer;
  transition: all .15s; white-space: nowrap;
}
.v2-fchip:hover { border-color: var(--v2-border-strong); color: var(--v2-text-hover); }
.v2-fchip--on { background: var(--v2-active-strong); border-color: var(--v2-border-focus); color: var(--v2-text); }
.v2-fchip--icon { padding: .25rem .375rem; }

/* ── Stats strip ─────────────────────────────────────────── */
.v2-items-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: .625rem; margin-bottom: .875rem;
}

@media (max-width: 640px) { .v2-items-stats { grid-template-columns: repeat(2, 1fr); } }

.v2-stat-card {
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-active);
  border-radius: 12px; padding: .875rem 1rem; text-align: center;
}
.v2-stat-card__val { font-size: 1.375rem; font-weight: 800; color: var(--v2-accent); line-height: 1.2; }
.v2-stat-card__label { font-size: .6875rem; color: var(--v2-text-secondary); margin-top: 2px; }

/* ── Loader ──────────────────────────────────────────────── */
.v2-center-loader {
  display: flex; align-items: center; justify-content: center;
  gap: .75rem; padding: 5rem; color: var(--v2-text-secondary); font-size: .9375rem;
}
.v2-inline-ocr {
  display: flex; align-items: center; gap: .55rem; color: var(--v2-text-secondary); font-size: .8125rem;
}
.v2-ocr-debug {
  margin-top: .875rem;
  border-top: 1px solid var(--v2-border-subtle);
  padding-top: .75rem;
}
.v2-ocr-debug__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  margin-bottom: .5rem;
}
.v2-ocr-debug__list {
  display: flex;
  flex-direction: column;
  gap: .375rem;
  max-height: 240px;
  overflow: auto;
}
.v2-ocr-debug__row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
  gap: .5rem;
  align-items: center;
  padding: .45rem .55rem;
  border-radius: 8px;
  background: rgba(255,255,255,.03);
  border: 1px solid var(--v2-border-subtle);
  font-size: .75rem;
}
.v2-ocr-debug__raw,
.v2-ocr-debug__tokens {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--v2-text-secondary);
}
.v2-ocr-debug__candidate {
  color: var(--v2-text);
  font-weight: 700;
  white-space: nowrap;
}
.v2-observed-prices {
  display: flex;
  flex-direction: column;
  gap: .625rem;
  padding: .875rem 1rem;
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  background: rgba(255,255,255,.02);
}
.v2-observed-prices__list {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}
.v2-observed-prices__row {
  display: grid;
  grid-template-columns: auto auto auto 1fr;
  gap: .75rem;
  align-items: center;
  padding: .5rem .625rem;
  border-radius: 10px;
  border: 1px solid var(--v2-border-subtle);
  background: rgba(255,255,255,.02);
}
.v2-observed-prices__select {
  display: flex;
  align-items: center;
  justify-content: center;
}
.v2-observation-summary-actions {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-wrap: wrap;
}
.v2-observed-prices__price {
  border: 1px solid var(--v2-border);
  background: transparent;
  color: var(--v2-text);
  font-weight: 700;
  border-radius: 999px;
  padding: .3rem .7rem;
  cursor: pointer;
}
.v2-observed-prices__price:hover {
  border-color: var(--v2-border-strong);
}
.v2-observed-prices__meta {
  color: var(--v2-text-secondary);
  font-size: .75rem;
  white-space: nowrap;
}
.v2-observed-prices__actions {
  display: flex;
  align-items: center;
  gap: .5rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}
.v2-valuation-panel {
  display: flex;
  flex-direction: column;
  gap: .625rem;
  padding: .875rem 1rem;
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  background: rgba(255,255,255,.02);
}
.v2-valuation-table {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: .5rem .75rem;
  align-items: center;
}
.v2-valuation-table__head {
  color: var(--v2-text-secondary);
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.v2-valuation-table__cell {
  color: var(--v2-text);
  font-weight: 600;
}
.v2-valuation-note {
  color: var(--v2-text-secondary);
  font-size: .78rem;
}
.v2-priority-panel {
  display: flex;
  flex-direction: column;
  gap: .875rem;
  padding: .875rem 1rem;
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  background: rgba(255,255,255,.02);
}
.v2-priority-list {
  display: flex;
  flex-direction: column;
  gap: .625rem;
}
.v2-priority-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: .7rem .8rem;
  border-radius: 12px;
  border: 1px solid var(--v2-border-subtle);
  background: rgba(255,255,255,.02);
}
.v2-priority-row__label {
  display: flex;
  align-items: baseline;
  gap: .45rem;
  color: var(--v2-text);
  font-weight: 700;
}
.v2-priority-row__range {
  color: var(--v2-text-secondary);
  font-weight: 500;
  font-size: .8rem;
}
.v2-priority-row__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: .45rem;
}
.v2-observation-detail {
  display: flex;
  flex-direction: column;
  gap: .875rem;
  padding: .875rem 1rem;
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  background: rgba(255,255,255,.02);
}
.v2-observation-detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: .75rem;
  flex-wrap: wrap;
}
.v2-observation-detail__actions {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-wrap: wrap;
}
.v2-observation-detail__image-wrap {
  display: flex;
  justify-content: flex-start;
}
.v2-observation-detail__image {
  max-width: 100%;
  max-height: 360px;
  border-radius: 12px;
  border: 1px solid var(--v2-border-subtle);
  background: rgba(0,0,0,.2);
}
.v2-observation-detail__stats {
  display: flex;
  flex-direction: column;
  gap: .625rem;
}
.v2-observation-detail__stats-list {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}
.v2-observation-detail__stats-row {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(140px, .7fr) auto;
  gap: .5rem;
  align-items: center;
}
.v2-observation-detail__stats-label {
  display: flex;
  align-items: center;
  gap: .4rem;
  min-width: 0;
  color: var(--v2-text);
  font-weight: 600;
}
.v2-observation-detail__stats-range {
  color: var(--v2-text-secondary);
  font-weight: 500;
  font-size: .8rem;
}
.v2-observation-detail__stats-value {
  display: flex;
  align-items: center;
  gap: .35rem;
}
.v2-observation-detail__stats-input {
  width: 100%;
}
.v2-observation-detail__stats-select {
  width: 100%;
}
.v2-observation-detail__stats-suffix {
  color: var(--v2-text-secondary);
  font-weight: 700;
}
.v2-observation-detail__raw {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: .75rem;
  color: var(--v2-text-secondary);
}
@media (max-width: 800px) {
  .v2-observed-prices__row {
    grid-template-columns: 1fr;
    justify-items: flex-start;
  }
  .v2-observed-prices__actions {
    justify-content: flex-start;
  }
  .v2-observation-detail__stats-row {
    grid-template-columns: 1fr;
  }
  .v2-valuation-table {
    grid-template-columns: 1fr 1fr;
  }
  .v2-priority-row {
    align-items: flex-start;
    flex-direction: column;
  }
  .v2-priority-row__controls {
    justify-content: flex-start;
  }
}
.v2-spin {
  width: 22px; height: 22px; flex-shrink: 0;
  border: 2px solid var(--v2-border-med); border-top-color: var(--v2-accent);
  border-radius: 50%; animation: vspin .8s linear infinite;
}
.v2-spin-sm {
  width: 14px; height: 14px; flex-shrink: 0;
  border: 2px solid var(--v2-border-med); border-top-color: var(--v2-accent);
  border-radius: 50%; animation: vspin .8s linear infinite;
}
@keyframes vspin { to { transform: rotate(360deg); } }

.v2-empty-full {
  text-align: center; color: var(--v2-text-dim); font-size: .9375rem; padding: 2rem;
}

/* ── Slot tabs ───────────────────────────────────────────── */
.v2-slot-tabs {
  display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: .75rem;
  background: rgba(0,0,0,.15); border: 1px solid var(--v2-border-subtle);
  border-radius: 12px; padding: .375rem;
}
.v2-slot-tab {
  display: flex; align-items: center; gap: .375rem;
  padding: .375rem .625rem; border-radius: 8px; border: none;
  background: transparent; color: var(--v2-text-secondary); font-size: .8125rem;
  cursor: pointer; transition: all .15s; white-space: nowrap;
}
.v2-slot-tab:hover { background: var(--v2-border-subtle); color: var(--v2-text-hover); }
.v2-slot-tab--on { background: var(--v2-active-strong); color: var(--v2-text); font-weight: 600; }
.v2-slot-tab__icon { font-size: .875rem; line-height: 1; }
.v2-slot-tab__label { font-size: .8125rem; }
.v2-slot-tab__count {
  font-size: .625rem; background: var(--v2-border); color: var(--v2-accent);
  padding: .0625rem .3125rem; border-radius: 999px; font-weight: 600;
}

/* ── Slot content header ─────────────────────────────────── */
.v2-slot-content {
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-active);
  border-radius: 14px; padding: 1rem;
}
.v2-slot-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: .875rem; flex-wrap: wrap; gap: .5rem;
}
.v2-slot-head__title { font-size: .9375rem; font-weight: 700; color: var(--v2-text-hover); }
.v2-slot-head__actions { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.v2-bulk-open {
  border: 1px solid var(--v2-border); background: rgba(0,0,0,.18); color: var(--v2-text);
  border-radius: 8px; padding: .45rem .7rem; font-size: .75rem; font-weight: 700; cursor: pointer;
}
.v2-bulk-open:hover { border-color: var(--v2-border-strong); background: var(--v2-hover-subtle); }

.v2-view-toggle { display: flex; gap: 2px; background: rgba(0,0,0,.2); border-radius: 8px; padding: 2px; }
.v2-view-btn {
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  border-radius: 6px; border: none; background: transparent; color: var(--v2-text-dim);
  cursor: pointer; transition: all .15s;
}
.v2-view-btn:hover { color: var(--v2-text-hover); }
.v2-view-btn--on { background: var(--v2-active-strong); color: var(--v2-text); }

/* ── Progress bar (shared) ───────────────────────────────── */
.v2-item-bar {
  height: 5px; background: var(--v2-border-subtle); border-radius: 999px; overflow: hidden; margin-top: 4px;
}
.v2-item-bar--sm { height: 4px; margin-top: 0; flex: 1; }
.v2-item-bar__fill {
  height: 100%; background: linear-gradient(90deg, var(--v2-accent), var(--v2-accent-light));
  border-radius: 999px; transition: width .4s ease;
}

/* ── Grid view ───────────────────────────────────────────── */
.v2-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: .625rem;
}
.v2-item-card {
  background: rgba(0,0,0,.18); border: 1px solid var(--v2-border-subtle);
  border-radius: 12px; padding: .75rem .625rem;
  display: flex; flex-direction: column; align-items: center; gap: .25rem;
  transition: border-color .18s;
  cursor: pointer;
}
.v2-item-card:hover { border-color: var(--v2-border-strong); }
.v2-item-card__rank {
  font-size: .625rem; font-weight: 700; color: var(--v2-accent);
  background: var(--v2-border); padding: .125rem .375rem; border-radius: 999px;
  align-self: flex-start;
}
.v2-item-card__img-wrap {
  width: 52px; height: 52px; background: rgba(0,0,0,.2);
  border: 1px solid var(--v2-active); border-radius: 8px;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.v2-item-card__img { width: 100%; height: 100%; object-fit: cover; }
.v2-item-card__img-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--v2-text-dim); }
.v2-item-card__name {
  font-size: .75rem; font-weight: 600; color: var(--v2-text);
  text-align: center; line-height: 1.3; width: 100%;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.v2-item-card__usage { font-size: .6875rem; color: var(--v2-text-muted); }

/* ── List view ───────────────────────────────────────────── */
.v2-items-list { display: flex; flex-direction: column; gap: 4px; }
.v2-item-row {
  display: flex; align-items: center; gap: .625rem;
  padding: .5rem .625rem; border-radius: 9px;
  background: rgba(0,0,0,.15); border: 1px solid var(--v2-glow);
  transition: border-color .15s;
  cursor: pointer;
}
.v2-item-row:hover { border-color: var(--v2-border-med); }
.v2-item-row__rank { font-size: .75rem; font-weight: 700; color: var(--v2-accent); min-width: 28px; }
.v2-item-row__img-wrap {
  width: 32px; height: 32px; flex-shrink: 0; border-radius: 7px;
  background: rgba(0,0,0,.2); overflow: hidden;
}
.v2-item-row__img { width: 100%; height: 100%; object-fit: cover; }
.v2-item-row__img-ph { width: 100%; height: 100%; background: var(--v2-hover); }
.v2-item-row__name { flex: 1; font-size: .875rem; font-weight: 600; color: var(--v2-text); min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.v2-item-row__bar-wrap { flex: 1; min-width: 60px; max-width: 200px; }
.v2-item-row__count { font-size: .8125rem; color: var(--v2-text-hover); font-weight: 600; min-width: 32px; text-align: right; }
.v2-item-row__pct { font-size: .75rem; color: var(--v2-text-secondary); min-width: 42px; text-align: right; }

/* ── Table view ──────────────────────────────────────────── */
.v2-items-table-wrap { overflow-x: auto; }
.v2-items-table {
  width: 100%; border-collapse: collapse;
}
.v2-items-table thead tr {
  border-bottom: 1px solid var(--v2-active);
}
.v2-items-table th {
  padding: .5rem .75rem; font-size: .6875rem; font-weight: 700;
  color: var(--v2-text-secondary); text-transform: uppercase; letter-spacing: .04em;
  text-align: left; white-space: nowrap;
}
.v2-items-table tbody tr {
  border-bottom: 1px solid var(--v2-hover); transition: background .12s;
  cursor: pointer;
}
.v2-items-table tbody tr:hover { background: var(--v2-hover-subtle); }
.v2-items-table td { padding: .5rem .75rem; }
.v2-table-rank { font-size: .875rem; font-weight: 700; color: var(--v2-accent); }
.v2-table-img-wrap {
  width: 36px; height: 36px; border-radius: 7px;
  background: rgba(0,0,0,.2); overflow: hidden;
}
.v2-table-img { width: 100%; height: 100%; object-fit: cover; }
.v2-table-img-ph { width: 100%; height: 100%; background: var(--v2-hover); }
.v2-table-name { font-size: .875rem; font-weight: 600; color: var(--v2-text); min-width: 160px; }
.v2-table-num { font-size: .875rem; color: var(--v2-text-hover); font-weight: 600; }
.v2-table-pct { font-size: .8125rem; color: var(--v2-accent); font-weight: 600; white-space: nowrap; }

/* ── Recipe view ─────────────────────────────────────────── */
.v2-recipe-shell { display: flex; flex-direction: column; gap: .875rem; }
.v2-recipe-top {
  display: flex; align-items: center; justify-content: space-between; gap: .75rem; flex-wrap: wrap;
}
.v2-recipe-back {
  display: inline-flex; align-items: center; gap: .375rem;
  padding: .5rem .75rem; border-radius: 9px; border: 1px solid var(--v2-border);
  background: rgba(0,0,0,.18); color: var(--v2-text); font-size: .8125rem; font-weight: 600; cursor: pointer;
}
.v2-recipe-back:hover { border-color: var(--v2-border-strong); background: var(--v2-hover-subtle); }
.v2-recipe-kicker {
  font-size: .6875rem; text-transform: uppercase; letter-spacing: .08em; color: var(--v2-text-dim); font-weight: 700;
}
.v2-bulk-limit { display: flex; gap: .25rem; flex-wrap: wrap; }
.v2-bulk-limit__btn {
  border: 1px solid var(--v2-border); background: rgba(0,0,0,.18); color: var(--v2-text-secondary);
  border-radius: 8px; padding: .375rem .55rem; font-size: .75rem; font-weight: 700; cursor: pointer; min-width: 34px;
}
.v2-bulk-limit__btn:hover { border-color: var(--v2-border-strong); color: var(--v2-text); }
.v2-bulk-limit__btn--on { background: var(--v2-active-strong); border-color: var(--v2-border-focus); color: var(--v2-text); }
.v2-recipe-item {
  display: flex; align-items: center; gap: .875rem;
  padding: .875rem; border-radius: 12px; background: rgba(0,0,0,.18); border: 1px solid var(--v2-active);
}
.v2-recipe-item__img-wrap, .v2-recipe-line__img-wrap {
  background: rgba(0,0,0,.2); border: 1px solid var(--v2-active); border-radius: 10px; overflow: hidden; flex-shrink: 0;
}
.v2-recipe-item__img-wrap { width: 64px; height: 64px; }
.v2-recipe-line__img-wrap { width: 48px; height: 48px; }
.v2-recipe-item__img, .v2-recipe-line__img { width: 100%; height: 100%; object-fit: cover; }
.v2-recipe-item__img-ph, .v2-recipe-line__img-ph { width: 100%; height: 100%; background: var(--v2-hover); }
.v2-recipe-item__name { font-size: 1.05rem; font-weight: 700; color: var(--v2-text-hover); }
.v2-recipe-item__meta { margin-top: .2rem; font-size: .8125rem; color: var(--v2-text-secondary); }
.v2-recipe-item__actions {
  display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; margin-top: .5rem;
}
.v2-recipe-refresh {
  border: 1px solid var(--v2-border); background: rgba(0,0,0,.18); color: var(--v2-text);
  border-radius: 999px; padding: .28rem .6rem; font-size: .75rem; font-weight: 700; cursor: pointer;
}
.v2-recipe-refresh:hover { border-color: var(--v2-border-focus); background: var(--v2-hover-subtle); }
.v2-recipe-confidence {
  border-radius: 999px; padding: .28rem .6rem; font-size: .75rem; font-weight: 700;
}
.v2-recipe-confidence--exact {
  background: rgba(34,197,94,.14); color: #86efac; border: 1px solid rgba(34,197,94,.25);
}
.v2-recipe-confidence--approx {
  background: rgba(245,158,11,.14); color: #fcd34d; border: 1px solid rgba(245,158,11,.25);
}
.v2-recipe-cache-hint { font-size: .6875rem; color: var(--v2-text-dim); font-weight: 600; }
.v2-recipe-error {
  border: 1px solid rgba(239,68,68,.35); background: rgba(239,68,68,.12); color: #fecaca;
  border-radius: 12px; padding: .875rem 1rem; font-size: .875rem;
}
.v2-recipe-stats {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: .625rem;
}
@media (max-width: 760px) { .v2-recipe-stats { grid-template-columns: 1fr; } }
.v2-rstat {
  background: rgba(0,0,0,.15); border: 1px solid var(--v2-border-subtle); border-radius: 12px; padding: .875rem 1rem;
}
.v2-rstat__label { font-size: .6875rem; text-transform: uppercase; letter-spacing: .05em; color: var(--v2-text-dim); font-weight: 700; }
.v2-rstat__val { margin-top: .25rem; font-size: 1rem; color: var(--v2-text); font-weight: 700; }
.v2-recipe-cost {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: .625rem;
}
@media (max-width: 760px) { .v2-recipe-cost { grid-template-columns: 1fr; } }
.v2-recipe-sell {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: .625rem;
}
@media (max-width: 760px) { .v2-recipe-sell { grid-template-columns: 1fr; } }
.v2-recipe-toolbar {
  display: flex; align-items: center; justify-content: space-between; gap: .75rem; flex-wrap: wrap;
}
.v2-price-manager {
  background: rgba(0,0,0,.15); border: 1px solid var(--v2-border-subtle); border-radius: 12px; padding: .875rem 1rem;
}
.v2-price-manager__head { margin-bottom: .625rem; }
.v2-price-manager__list { display: flex; flex-direction: column; gap: .45rem; }
.v2-price-manager__row {
  display: grid; grid-template-columns: minmax(0, 1fr) 110px 140px; gap: .5rem; align-items: center;
}
@media (max-width: 760px) {
  .v2-price-manager__row { grid-template-columns: 1fr; }
}
.v2-price-manager__name {
  font-size: .8125rem; font-weight: 600; color: var(--v2-text); min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.v2-price-manager__freshness {
  font-size: .6875rem; color: var(--v2-text-dim); font-weight: 600;
}
.v2-ocr-panel {
  background: rgba(0,0,0,.15); border: 1px solid var(--v2-border-subtle); border-radius: 12px; padding: .875rem 1rem;
}
.v2-ocr-panel__head {
  display: flex; align-items: center; justify-content: space-between; gap: .5rem; flex-wrap: wrap; margin-bottom: .625rem;
}
.v2-selected-items {
  background: rgba(0,0,0,.15); border: 1px solid var(--v2-border-subtle); border-radius: 12px; padding: .875rem 1rem;
}
.v2-aggregate-sort {
  display: flex; align-items: center; justify-content: space-between; gap: .75rem; flex-wrap: wrap;
  background: rgba(0,0,0,.15); border: 1px solid var(--v2-border-subtle); border-radius: 12px; padding: .75rem 1rem;
}
.v2-aggregate-filters {
  display: flex; flex-direction: column; gap: .5rem;
  background: rgba(0,0,0,.15); border: 1px solid var(--v2-border-subtle); border-radius: 12px; padding: .75rem 1rem;
}
.v2-aggregate-filters__row { display: flex; gap: .35rem; flex-wrap: wrap; }
.v2-aggregate-sort__label {
  font-size: .6875rem; text-transform: uppercase; letter-spacing: .05em; color: var(--v2-text-dim); font-weight: 700;
}
.v2-selected-items__label {
  display: block; font-size: .6875rem; text-transform: uppercase; letter-spacing: .05em; color: var(--v2-text-dim); font-weight: 700; margin-bottom: .5rem;
}
.v2-selected-items__list { display: flex; flex-wrap: wrap; gap: .375rem; }
.v2-selected-items__chip {
  border-radius: 999px; background: var(--v2-active-strong); color: var(--v2-text); padding: .25rem .55rem; font-size: .75rem; font-weight: 600;
}
.v2-selected-items__chip--btn {
  border: 1px solid var(--v2-border); cursor: pointer;
}
.v2-selected-items__chip--btn:hover { border-color: var(--v2-border-focus); }
.v2-recipe-list {
  background: rgba(0,0,0,.15); border: 1px solid var(--v2-active); border-radius: 12px; overflow: hidden;
}
.v2-recipe-list__head {
  padding: .875rem 1rem; border-bottom: 1px solid var(--v2-border-subtle); font-size: .875rem; font-weight: 700; color: var(--v2-text-hover);
}
.v2-recipe-lines { display: flex; flex-direction: column; }
.v2-recipe-line {
  display: flex; align-items: center; gap: .75rem; padding: .75rem 1rem; border-top: 1px solid var(--v2-hover);
}
.v2-recipe-line:first-child { border-top: none; }
.v2-recipe-line__body { flex: 1; min-width: 0; }
.v2-recipe-line__name {
  font-size: .875rem; font-weight: 600; color: var(--v2-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.v2-recipe-line__meta { margin-top: .15rem; font-size: .75rem; color: var(--v2-text-secondary); }
.v2-resource-badges {
  display: flex; gap: .35rem; flex-wrap: wrap; margin-top: .35rem;
}
.v2-resource-badges--compact { margin-top: .4rem; }
.v2-resource-badge {
  border-radius: 999px; padding: .18rem .45rem; font-size: .6875rem; font-weight: 700; letter-spacing: .01em;
}
.v2-resource-badge--drop {
  background: rgba(59,130,246,.14); color: #93c5fd; border: 1px solid rgba(59,130,246,.25);
}
.v2-resource-badge--crafted {
  background: rgba(168,85,247,.14); color: #d8b4fe; border: 1px solid rgba(168,85,247,.25);
}
.v2-resource-badge--special {
  background: rgba(245,158,11,.14); color: #fcd34d; border: 1px solid rgba(245,158,11,.25);
}
.v2-recipe-price-entry {
  display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; margin-top: .5rem;
}
.v2-recipe-price-entry__label {
  font-size: .6875rem; color: var(--v2-text-dim); font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
}
.v2-recipe-price-entry__input {
  width: 110px; border-radius: 8px; border: 1px solid var(--v2-border); background: rgba(0,0,0,.18);
  color: var(--v2-text); padding: .35rem .5rem; font-size: .8125rem; font-weight: 600;
}
.v2-recipe-price-entry__input--wide { width: 100%; }
.v2-recipe-price-entry__input:focus { outline: none; border-color: var(--v2-border-focus); }
.v2-recipe-price-entry__total {
  font-size: .75rem; color: var(--v2-accent); font-weight: 700;
}
.v2-recipe-price-entry__freshness {
  font-size: .6875rem; color: var(--v2-text-dim); font-weight: 600;
}
.v2-recipe-line__links {
  display: flex; align-items: center; gap: .35rem; flex-wrap: wrap; margin-top: .35rem;
}
.v2-recipe-line__links-label {
  font-size: .6875rem; color: var(--v2-text-dim); font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
}
.v2-recipe-item-chip {
  border: 1px solid var(--v2-border); background: var(--v2-active-strong); color: var(--v2-text);
  border-radius: 999px; padding: .2rem .5rem; font-size: .75rem; font-weight: 600; cursor: pointer;
}
.v2-recipe-item-chip:hover { border-color: var(--v2-border-focus); color: var(--v2-text-hover); }
.v2-recipe-line__qty {
  text-align: right; min-width: 56px; color: var(--v2-accent); display: flex; flex-direction: column; gap: .1rem;
}
.v2-profit--up { color: #86efac; }
.v2-profit--down { color: #fca5a5; }
.v2-recipe-line__qty-label {
  font-size: .625rem; text-transform: uppercase; letter-spacing: .05em; color: var(--v2-text-dim); font-weight: 700;
}
.v2-recipe-line__qty-sub {
  font-size: .6875rem; color: var(--v2-text-secondary); font-weight: 600;
}
</style>



