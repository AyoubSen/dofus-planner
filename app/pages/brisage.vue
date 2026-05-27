<template>
  <div>
    <div v-if="!hasContext" class="v2-no-context">
      <div class="v2-no-context__icon">
        <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.5 3.5L21 10l-4 4M9.5 20.5L3 14l4-4m8-6.5l-9 9" />
        </svg>
      </div>
      <div class="v2-no-context__title">{{ $t('v2.common.noCharacterTitle') }}</div>
      <div class="v2-no-context__desc">{{ $t('v2.brisage.noCharacterDesc') }}</div>
    </div>

    <template v-else>
      <div class="br-stats">
        <div class="br-stat">
          <div class="br-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="br-stat__body">
            <div class="br-stat__val">{{ sessions.length }}</div>
            <div class="br-stat__lbl">{{ $t('v2.brisage.stats.sessions') }}</div>
          </div>
        </div>

        <div class="br-stat">
          <div class="br-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div class="br-stat__body">
            <div class="br-stat__val">{{ totalItemsLogged }}</div>
            <div class="br-stat__lbl">{{ $t('v2.brisage.stats.itemsLogged') }}</div>
          </div>
        </div>

        <div class="br-stat" :class="totalPL >= 0 ? 'br-stat--green' : 'br-stat--red'">
          <div class="br-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="br-stat__body">
            <div class="br-stat__val" :style="totalPL >= 0 ? 'color:#34d399' : 'color:#f87171'">
              {{ totalPL >= 0 ? '+' : '' }}{{ formatKamas(totalPL) }}
            </div>
            <div class="br-stat__lbl">{{ $t('v2.brisage.stats.totalPL') }}</div>
          </div>
        </div>

        <div class="br-stat">
          <div class="br-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4" />
            </svg>
          </div>
          <div class="br-stat__body">
            <div class="br-stat__val" :style="avgSessionPL >= 0 ? 'color:#34d399' : 'color:#f87171'">
              {{ avgSessionPL >= 0 ? '+' : '' }}{{ formatKamas(avgSessionPL) }}
            </div>
            <div class="br-stat__lbl">{{ $t('v2.brisage.stats.avgSessionPL') }}</div>
          </div>
        </div>
      </div>

      <div class="br-flow">
        <div class="br-flow__actions">
          <button class="br-flow-tab" :class="{ 'br-flow-tab--active': brisageMode === 'history' }" @click="showSessionHistory">
            {{ $t('v2.brisage.sections.sessionHistory') }}
            <span class="br-badge">{{ sessions.length }}</span>
          </button>
          <button class="br-flow-tab" :class="{ 'br-flow-tab--active': brisageMode === 'builder' }" @click="startSessionBuilder">
            {{ $t('v2.brisage.sections.sessionBuilder') }}
            <span v-if="draftItems.length" class="br-badge">{{ draftItems.length }}</span>
          </button>
        </div>

        <div v-if="brisageMode === 'builder'" class="br-flow-steps">
          <div class="br-flow-step" :class="{ 'br-flow-step--done': draftSession.categoryTypeIds.length || draftSession.levelMin || draftSession.levelMax }">
            <span>1</span>
            {{ $t('v2.brisage.sections.sessionBuilder') }}
          </div>
          <div class="br-flow-step" :class="{ 'br-flow-step--done': draftItems.length > 0 }">
            <span>2</span>
            {{ $t('v2.brisage.sections.addItems') }}
          </div>
          <div class="br-flow-step" :class="{ 'br-flow-step--done': draftResourceChecklist.length > 0 }">
            <span>3</span>
            {{ $t('v2.brisage.sections.resourceChecklist') }}
          </div>
        </div>
      </div>

      <div class="br-layout" :class="`br-layout--${brisageMode}`">
        <div v-show="brisageMode === 'builder'" class="br-panel">
          <div class="br-panel-title">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.5 3.5L21 10l-4 4M9.5 20.5L3 14l4-4m8-6.5l-9 9" />
            </svg>
            {{ $t('v2.brisage.sections.sessionBuilder') }}
          </div>

          <div class="br-form">
            <div class="br-form__row">
              <div class="br-form__field">
                <label class="br-field-lbl">{{ $t('v2.brisage.fields.date') }}</label>
                <V2DateInput v-model="draftSession.date" />
              </div>
              <div class="br-form__field">
                <label class="br-field-lbl">{{ $t('v2.brisage.fields.focusCategory') }}</label>
                <div ref="categoryPickerEl" class="br-multi">
                  <button
                    type="button"
                    class="br-multi__trigger"
                    :class="{ 'br-multi__trigger--placeholder': !selectedCategoryOptions.length }"
                    @click="categoryPickerOpen = !categoryPickerOpen"
                  >
                    <span>{{ categoryPickerLabel }}</span>
                    <svg class="w-4 h-4" :class="{ 'br-multi__chevron--open': categoryPickerOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div v-if="categoryPickerOpen" class="br-multi__menu">
                    <label v-for="option in BRISAGE_CATEGORY_OPTIONS" :key="option.typeId" class="br-multi__option">
                      <input
                        type="checkbox"
                        class="br-multi__check"
                        :checked="draftSession.categoryTypeIds.includes(option.typeId)"
                        @change="toggleCategoryType(option.typeId)"
                      >
                      <span>{{ option.label }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="br-form__row">
              <div class="br-form__field">
                <label class="br-field-lbl">{{ $t('v2.brisage.fields.levelMin') }}</label>
                <input v-model.number="draftSession.levelMin" type="number" min="1" max="200" class="br-field-input" />
              </div>
              <div class="br-form__field">
                <label class="br-field-lbl">{{ $t('v2.brisage.fields.levelMax') }}</label>
                <input v-model.number="draftSession.levelMax" type="number" min="1" max="200" class="br-field-input" />
              </div>
            </div>

            <div class="br-form__field">
              <label class="br-field-lbl">{{ $t('v2.brisage.fields.sessionNotes') }}</label>
              <input v-model="draftSession.notes" type="text" :placeholder="$t('v2.brisage.placeholders.sessionNotes')" class="br-field-input" />
            </div>

            <div class="br-form__row br-form__row--triple">
              <div class="br-form__field">
                <label class="br-field-lbl">{{ $t('v2.brisage.fields.startingKamas') }}</label>
                <input v-model.number="draftSession.startingKamas" type="number" step="1000" class="br-field-input" />
              </div>
              <div class="br-form__field">
                <label class="br-field-lbl">{{ $t('v2.brisage.fields.endingKamas') }}</label>
                <input v-model.number="draftSession.endingKamas" type="number" step="1000" class="br-field-input" />
              </div>
            </div>

            <div class="br-session-summary">
              <div class="br-session-summary__item">
                <div class="br-session-summary__label">{{ $t('v2.brisage.summary.draftItems') }}</div>
                <div class="br-session-summary__value">{{ draftItems.length }}</div>
              </div>
              <div class="br-session-summary__item">
                <div class="br-session-summary__label">{{ $t('v2.brisage.summary.craftTotal') }}</div>
                <div class="br-session-summary__value">{{ formatKamas(draftTotals.craft) }}</div>
              </div>
              <div class="br-session-summary__item">
                <div class="br-session-summary__label">{{ $t('v2.brisage.summary.realizedValue') }}</div>
                <div class="br-session-summary__value">{{ formatKamas(draftTotals.realized) }}</div>
              </div>
              <div class="br-session-summary__item">
                <div class="br-session-summary__label">{{ $t('v2.brisage.summary.sessionPL') }}</div>
                <div class="br-session-summary__value" :class="draftTotals.profit >= 0 ? 'br-profit--up' : 'br-profit--down'">
                  {{ draftTotals.profit >= 0 ? '+' : '' }}{{ formatKamas(draftTotals.profit) }}
                </div>
              </div>
            </div>
          </div>

          <div class="br-panel-title br-panel-title--sub">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {{ $t('v2.brisage.sections.addItems') }}
          </div>

          <div class="br-batch-controls">
            <button
              class="br-submit-btn br-submit-btn--secondary"
              :disabled="!draftSession.categoryTypeIds.length || !draftSession.levelMin || !draftSession.levelMax || loadingBatchResults"
              @click="loadCategoryBatch"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m14.836 2A8.001 8.001 0 005.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-13.837-2m13.837 2H15" />
              </svg>
              {{ loadingBatchResults ? $t('v2.brisage.actions.loadingBatch') : $t('v2.brisage.actions.loadMatchingItems') }}
            </button>
            <div class="br-field-help">{{ $t('v2.brisage.messages.batchHelp') }}</div>
          </div>

          <div ref="searchAreaEl" class="br-search-area">
            <div class="br-search">
              <svg class="br-search__icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input v-model="search" type="text" :placeholder="$t('v2.common.searchItems')" class="br-search__input" @input="onSearchInput" />
              <button v-if="search" class="br-search__clear" @click="clearSearch">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="searching" class="br-inline-loader"><div class="br-spin" /> {{ $t('v2.common.searching') }}</div>

            <div v-else-if="results.length" class="br-results">
              <button
                v-for="item in results"
                :key="item.id"
                class="br-result"
                @click="addItemToDraft(item)"
              >
                <img :src="getItemImg(item)" :alt="item.name?.fr ?? ''" class="br-result__img" @error="onImgErr" />
                <div class="br-result__info">
                  <div class="br-result__name">{{ item.name?.fr ?? item.id }}</div>
                  <div class="br-result__sub">{{ item.type?.name?.fr ?? '' }} · Lv {{ item.level ?? '?' }}</div>
                </div>
                <span class="br-result__cta">{{ $t('v2.brisage.actions.add') }}</span>
              </button>
            </div>
            <div v-else-if="search && !searching" class="br-empty-hint">{{ $t('v2.brisage.messages.noItemsFound', { search }) }}</div>
          </div>

          <div v-if="draftItems.length" class="br-draft-list">
            <div v-for="draftItem in draftItems" :key="draftItem.id" class="br-draft-card">
              <div class="br-draft-card__header">
                <div class="br-draft-card__meta">
                  <img :src="getItemImg(draftItem.item)" :alt="draftItem.item?.name?.fr ?? ''" class="br-draft-card__img" @error="onImgErr" />
                  <div>
                    <div class="br-draft-card__name">{{ draftItem.item?.name?.fr ?? draftItem.itemId }}</div>
                    <div class="br-draft-card__sub">{{ draftItem.item?.type?.name?.fr ?? '' }} · Lv {{ draftItem.item?.level ?? '?' }}</div>
                  </div>
                </div>
                <div class="br-draft-card__actions">
                  <button class="br-draft-card__toggle" @click="toggleDraftItem(draftItem.id)">
                    {{ isDraftItemExpanded(draftItem.id) ? $t('v2.brisage.actions.hideDetails') : $t('v2.brisage.actions.editDetails') }}
                  </button>
                  <button class="br-entry__del" @click="removeDraftItem(draftItem.id)" :title="$t('v2.brisage.actions.remove')">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="br-draft-card__summary">
                <span>{{ draftItem.runs.length }} run{{ draftItem.runs.length !== 1 ? 's' : '' }}</span>
                <span>x{{ itemQuantityTotal(draftItem) }}</span>
                <span>{{ $t('v2.brisage.summary.craft') }} {{ formatKamas(itemCraftTotal(draftItem)) }}</span>
                <span>{{ $t('v2.brisage.summary.realized') }} {{ formatKamas(itemRealizedTotal(draftItem)) }}</span>
                <span :class="itemProfit(draftItem) >= 0 ? 'br-profit--up' : 'br-profit--down'">
                  {{ itemProfit(draftItem) >= 0 ? '+' : '' }}{{ formatKamas(itemProfit(draftItem)) }}
                </span>
              </div>

              <div v-if="isDraftItemExpanded(draftItem.id)" class="br-draft-card__details">
                <div class="br-item-runs">
                  <div v-for="(run, runIndex) in draftItem.runs" :key="run.id" class="br-item-run">
                    <div class="br-item-run__head">
                      <div class="br-item-run__title">{{ $t('v2.brisage.labels.runNumber', { index: runIndex + 1 }) }}</div>
                      <button class="br-item-run__del" @click="removeRunFromDraftItem(draftItem.id, run.id)">{{ $t('v2.brisage.actions.removeRun') }}</button>
                    </div>

                    <div class="br-form__row br-form__row--triple">
                      <div class="br-form__field">
                        <label class="br-field-lbl">{{ $t('v2.brisage.fields.qtyCrafted') }}</label>
                        <input v-model.number="run.quantity" type="number" min="1" class="br-field-input" />
                      </div>
                      <div class="br-form__field">
                        <label class="br-field-lbl">{{ $t('v2.brisage.fields.kamasBeforeBuying') }}</label>
                        <input v-model.number="run.buyStartKamas" type="number" min="0" step="1000" class="br-field-input" />
                      </div>
                      <div class="br-form__field">
                        <label class="br-field-lbl">{{ $t('v2.brisage.fields.kamasAfterBuying') }}</label>
                        <input v-model.number="run.buyEndKamas" type="number" min="0" step="1000" class="br-field-input" />
                      </div>
                    </div>

                    <div class="br-form__row">
                      <div class="br-form__field">
                        <label class="br-field-lbl">{{ $t('v2.brisage.fields.estimatedRuneValue') }}</label>
                        <input v-model.number="run.realizedRuneValue" type="number" min="0" step="1000" class="br-field-input" />
                      </div>
                      <div class="br-form__field">
                        <label class="br-field-lbl">{{ $t('v2.brisage.fields.runNote') }}</label>
                        <input v-model="run.notes" type="text" :placeholder="$t('v2.brisage.placeholders.runNote')" class="br-field-input" />
                      </div>
                    </div>

                    <div class="br-profit-preview">
                      <div class="br-profit-row">
                        <span>{{ $t('v2.brisage.summary.runCraftCost') }}</span>
                        <span>{{ formatKamas(runCraftCost(run)) }}</span>
                      </div>
                      <div class="br-profit-row">
                        <span>{{ $t('v2.brisage.summary.runPL') }}</span>
                        <span :class="runProfit(run) >= 0 ? 'br-profit--up' : 'br-profit--down'">
                          {{ runProfit(run) >= 0 ? '+' : '' }}{{ formatKamas(runProfit(run)) }}
                        </span>
                      </div>
                      <div class="br-profit-row" v-if="run.quantity > 0">
                        <span>{{ $t('v2.brisage.summary.avgPerCopy') }}</span>
                        <span>{{ formatKamas(Math.round(runProfit(run) / run.quantity)) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="br-form__row">
                  <div class="br-form__field">
                    <label class="br-field-lbl">{{ $t('v2.brisage.fields.itemNote') }}</label>
                    <input v-model="draftItem.notes" type="text" :placeholder="$t('v2.brisage.placeholders.itemNote')" class="br-field-input" />
                  </div>
                </div>

                <button class="br-submit-btn br-submit-btn--secondary" @click="addRunToDraftItem(draftItem.id)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  {{ $t('v2.brisage.actions.addAnotherRun') }}
                </button>
              </div>
            </div>
          </div>

          <div v-else class="br-log-empty br-log-empty--compact">
            {{ $t('v2.brisage.messages.emptyDraft') }}
          </div>

          <div class="br-panel-title br-panel-title--sub">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V7a2 2 0 00-2-2h-4M4 7h10M4 7v10a2 2 0 002 2h12a2 2 0 002-2v-4M4 7l4 4m0 0l4-4m-4 4V3" />
            </svg>
            {{ $t('v2.brisage.sections.resourceChecklist') }}
            <button class="br-collapse-toggle" @click="showDraftResourceChecklist = !showDraftResourceChecklist">
              {{ showDraftResourceChecklist ? $t('v2.brisage.actions.hide') : $t('v2.brisage.actions.show') }}
            </button>
          </div>

          <div v-if="showDraftResourceChecklist" class="br-batch-controls">
            <button
              class="br-submit-btn br-submit-btn--secondary"
              :disabled="draftItems.length === 0 || recipeChecklistState.isLoading"
              @click="fetchRecipeChecklist"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m14.836 2A8.001 8.001 0 005.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-13.837-2m13.837 2H15" />
              </svg>
              {{ recipeChecklistState.isLoading ? $t('v2.brisage.actions.loadingResources') : $t('v2.brisage.actions.fetchRecipesForDraft') }}
            </button>
            <div class="br-field-help">{{ $t('v2.brisage.messages.recipeHelp') }}</div>
            <div v-if="draftResourceChecklist.length" class="br-resource-view-toggle" role="group" :aria-label="$t('v2.brisage.labels.resourceViewMode')">
              <button
                type="button"
                class="br-resource-view-toggle__btn"
                :class="{ 'br-resource-view-toggle__btn--active': resourceChecklistView === 'all' }"
                @click="resourceChecklistView = 'all'"
              >
                {{ $t('v2.brisage.actions.showAllIngredients') }}
              </button>
              <button
                type="button"
                class="br-resource-view-toggle__btn"
                :class="{ 'br-resource-view-toggle__btn--active': resourceChecklistView === 'perItem' }"
                @click="resourceChecklistView = 'perItem'"
              >
                {{ $t('v2.brisage.actions.showIngredientsPerItem') }}
              </button>
            </div>
          </div>

          <div v-if="showDraftResourceChecklist">
            <div v-if="recipeChecklistState.error" class="br-empty-hint">{{ recipeChecklistState.error }}</div>

            <div v-if="draftResourceChecklist.length && resourceChecklistView === 'all'" class="br-resource-list">
              <label v-for="resource in draftResourceChecklist" :key="resource.id" class="br-resource-row">
                <input
                  type="checkbox"
                  :checked="resource.isDone"
                  class="br-resource-row__check"
                  @change="toggleDraftResourceDone(resource.id)"
                >
                <img v-if="resource.image" :src="resource.image" :alt="resource.name" class="br-resource-row__img" @error="onImgErr" />
                <div v-else class="br-resource-row__img br-resource-row__img--fallback" />
                <div class="br-resource-row__meta">
                  <div class="br-resource-row__name" :class="{ 'br-resource-row__name--done': resource.isDone }">{{ resource.name }}</div>
                  <div class="br-resource-row__sub">{{ resource.typeName ?? $t('v2.brisage.common.resource') }}</div>
                </div>
                <div class="br-resource-row__qty">{{ resource.totalQuantity }}</div>
              </label>
            </div>

            <div v-else-if="draftResourceChecklist.length" class="br-resource-groups">
              <div v-for="group in draftResourceChecklistByItem" :key="group.itemKey" class="br-resource-group">
                <div class="br-resource-group__head">
                  <img v-if="group.image" :src="group.image" :alt="group.itemName" class="br-resource-group__img" @error="onImgErr" />
                  <div v-else class="br-resource-group__img br-resource-row__img--fallback" />
                  <div class="br-resource-group__meta">
                    <div class="br-resource-group__name">{{ group.itemName }}</div>
                    <div class="br-resource-group__sub">{{ $t('v2.brisage.labels.craftedQuantity', { quantity: group.quantity }) }}</div>
                  </div>
                </div>

                <div class="br-resource-list br-resource-list--grouped">
                  <label v-for="resource in group.resources" :key="`${group.itemKey}-${resource.id}`" class="br-resource-row">
                    <input
                      type="checkbox"
                      :checked="resource.isDone"
                      class="br-resource-row__check"
                      @change="toggleDraftResourceDone(resource.id)"
                    >
                    <img v-if="resource.image" :src="resource.image" :alt="resource.name" class="br-resource-row__img" @error="onImgErr" />
                    <div v-else class="br-resource-row__img br-resource-row__img--fallback" />
                    <div class="br-resource-row__meta">
                      <div class="br-resource-row__name" :class="{ 'br-resource-row__name--done': resource.isDone }">{{ resource.name }}</div>
                      <div class="br-resource-row__sub">{{ resource.typeName ?? $t('v2.brisage.common.resource') }}</div>
                    </div>
                    <div class="br-resource-row__qty">{{ resource.totalQuantity }}</div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="br-builder-actions">
            <button class="br-submit-btn br-submit-btn--secondary" @click="showSessionHistory">
              {{ $t('v2.crafting.actions.backToSessions') }}
            </button>
            <button class="br-submit-btn" :disabled="draftItems.length === 0" @click="saveSession">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ $t('v2.brisage.actions.saveSession') }}
            </button>
          </div>
        </div>

        <div v-show="brisageMode === 'history'" class="br-panel">
          <div class="br-panel-title">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.5 3.5L21 10l-4 4M9.5 20.5L3 14l4-4m8-6.5l-9 9" />
            </svg>
            {{ $t('v2.brisage.sections.sessionHistory') }}
            <span class="br-badge">{{ sessions.length }}</span>
          </div>

          <div v-if="sessions.length === 0" class="br-log-empty">
            <svg class="w-10 h-10 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.5 3.5L21 10l-4 4M9.5 20.5L3 14l4-4m8-6.5l-9 9" />
            </svg>
            {{ $t('v2.brisage.messages.noSessions') }}<br />
            <span style="font-size:.8125rem;opacity:.5">{{ $t('v2.brisage.messages.noSessionsHint') }}</span>
          </div>

          <div v-else class="br-log-scroll">
            <div v-for="session in sessions" :key="session.id" class="br-entry">
              <div class="br-entry__header">
                <div class="br-entry__meta">
                  <div class="br-entry__name">{{ session.categoryLabel || $t('v2.brisage.labels.generalSession') }}</div>
                  <div class="br-entry__sub">{{ describeSessionScope(session) }}</div>
                  <div class="br-entry__date">{{ formatDisplayDate(session.date) }}</div>
                </div>
                <button class="br-entry__del" @click="deleteSession(session.id)" :title="$t('v2.brisage.actions.deleteSession')">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div class="br-entry__prices">
                <div class="br-price-cell br-price-cell--craft">
                  <div class="br-price-cell__lbl">{{ $t('v2.brisage.summary.craftTotal') }}</div>
                  <div class="br-price-cell__val">{{ formatKamas(sessionTotals(session).craft) }}</div>
                </div>
                <div class="br-price-cell br-price-cell--hdv">
                  <div class="br-price-cell__lbl">{{ $t('v2.brisage.summary.totalItems') }}</div>
                  <div class="br-price-cell__val">{{ sessionQuantityTotal(session) }}</div>
                </div>
                <div class="br-price-cell br-price-cell--rune">
                  <div class="br-price-cell__lbl">{{ $t('v2.brisage.summary.realizedValue') }}</div>
                  <div class="br-price-cell__val" style="color:var(--v2-accent)">{{ formatKamas(sessionTotals(session).realized) }}</div>
                </div>
              </div>

              <div class="br-entry__profits">
                <div class="br-profit-pill" :class="sessionTotals(session).profit >= 0 ? 'br-profit-pill--pos' : 'br-profit-pill--neg'">
                  {{ $t('v2.brisage.summary.sessionPL') }}: {{ sessionTotals(session).profit >= 0 ? '+' : '' }}{{ formatKamas(sessionTotals(session).profit) }}
                </div>
                <div class="br-profit-pill" :class="sessionMargin(session) >= 0 ? 'br-profit-pill--pos' : 'br-profit-pill--neg'">
                  {{ $t('v2.brisage.summary.margin') }}: {{ sessionMargin(session) >= 0 ? '+' : '' }}{{ sessionMargin(session) }}%
                </div>
                <button class="br-collapse-toggle br-collapse-toggle--inline" @click="toggleSession(session.id)">
                  {{ isSessionExpanded(session.id) ? $t('v2.brisage.actions.hideDetails') : $t('v2.brisage.actions.showDetails') }}
                </button>
              </div>

              <div v-if="isSessionExpanded(session.id)" class="br-session-items">
                <div v-for="item in session.items" :key="item.id" class="br-session-item-row">
                  <div class="br-session-item-row__meta">
                    <img :src="getItemImg(item.item)" :alt="item.item?.name?.fr ?? ''" class="br-session-item-row__img" @error="onImgErr" />
                    <div>
                      <div class="br-session-item-row__name">{{ item.item?.name?.fr ?? item.itemId }}</div>
                      <div class="br-session-item-row__sub">{{ t('v2.brisage.labels.runCount', { count: item.runs.length }) }} · x{{ itemQuantityTotal(item) }} · {{ $t('v2.brisage.summary.cost') }} {{ formatKamas(itemCraftTotal(item)) }} · {{ $t('v2.brisage.summary.realized') }} {{ formatKamas(itemRealizedTotal(item)) }}</div>
                    </div>
                  </div>
                  <div class="br-session-item-row__profit" :class="itemProfit(item) >= 0 ? 'br-profit--up' : 'br-profit--down'">
                    {{ itemProfit(item) >= 0 ? '+' : '' }}{{ formatKamas(itemProfit(item)) }}
                  </div>
                </div>
              </div>

              <div v-if="isSessionExpanded(session.id) && session.resourceChecklist?.length" class="br-resource-list br-resource-list--saved">
                <div v-for="resource in session.resourceChecklist" :key="resource.id" class="br-resource-row br-resource-row--saved">
                  <div class="br-resource-row__check br-resource-row__check--static">{{ resource.isDone ? '✓' : '•' }}</div>
                  <img v-if="resource.image" :src="resource.image" :alt="resource.name" class="br-resource-row__img" @error="onImgErr" />
                  <div v-else class="br-resource-row__img br-resource-row__img--fallback" />
                  <div class="br-resource-row__meta">
                    <div class="br-resource-row__name" :class="{ 'br-resource-row__name--done': resource.isDone }">{{ resource.name }}</div>
                    <div class="br-resource-row__sub">{{ resource.typeName ?? $t('v2.brisage.common.resource') }}</div>
                  </div>
                  <div class="br-resource-row__qty">{{ resource.totalQuantity }}</div>
                </div>
              </div>

              <div v-if="isSessionExpanded(session.id) && session.notes" class="br-entry__notes">{{ session.notes }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { BRISAGE_CATEGORY_OPTIONS } from '@/data/brisageCategories'

definePageMeta({ layout: 'v2' })
const { t } = useI18n()

const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()

interface BrisageSessionItem {
  id: string
  itemId: string | number
  item: any
  notes: string
  runs: BrisageItemRun[]
}

interface BrisageItemRun {
  id: string
  quantity: number
  buyStartKamas: number
  buyEndKamas: number
  realizedRuneValue: number
  notes: string
}

interface BrisageSessionResource {
  id: number
  name: string
  image: string | null
  typeName: string | null
  totalQuantity: number
  hasRecipe: boolean
  isDone: boolean
  sourceItems?: BrisageSessionResourceSource[]
}

interface BrisageSessionResourceSource {
  itemKey: string
  itemName: string
  itemImage: string | null
  quantity: number
  totalQuantity: number
}

interface BrisageSession {
  id: string
  date: string
  startingKamas: number
  endingKamas: number
  externalDelta: number
  categoryTypeId: number | null
  categoryTypeIds: number[]
  levelMin: number | null
  levelMax: number | null
  categoryLabel: string
  notes: string
  items: BrisageSessionItem[]
  resourceChecklist: BrisageSessionResource[]
}

interface LegacyBrisageEntry {
  id: string
  itemId: string | number
  item: any
  craftPrice: number
  hdvPrice: number
  runeValue: number
  date: string
  notes: string
}

const sessionsKey = computed(() =>
  `brisage_sessions_${selectedServer.value?.id}_${selectedCharacter.value?.id}`,
)
const legacyEntriesKey = computed(() =>
  `brisage_entries_${selectedServer.value?.id}_${selectedCharacter.value?.id}`,
)

const sessions = ref<BrisageSession[]>([])
const draftItems = ref<BrisageSessionItem[]>([])
const expandedDraftItemIds = ref<string[]>([])
const expandedSessionIds = ref<string[]>([])
const brisageMode = ref<'history' | 'builder'>('history')
const showDraftResourceChecklist = ref(true)
const resourceChecklistView = ref<'all' | 'perItem'>('all')
const draftResourceChecklist = ref<BrisageSessionResource[]>([])
const recipeChecklistState = ref({
  hasFetched: false,
  isLoading: false,
  error: '',
})
const draftSession = ref({
  date: todayISO(),
  startingKamas: 0,
  endingKamas: 0,
  externalDelta: 0,
  categoryTypeId: null as number | null,
  categoryTypeIds: [] as number[],
  levelMin: null as number | null,
  levelMax: null as number | null,
  categoryLabel: '',
  notes: '',
})

const search = ref('')
const searching = ref(false)
const results = ref<any[]>([])
const loadedBatchResults = ref<any[]>([])
const loadingBatchResults = ref(false)
const categoryPickerOpen = ref(false)
const categoryPickerEl = ref<HTMLElement | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const normalizeLevelValue = (value: unknown) => {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null
  return Math.max(1, Math.min(200, Math.round(num)))
}

const normalizeCategoryTypeIds = (value: unknown, fallback?: unknown) => {
  const rawValues = Array.isArray(value)
    ? value
    : value != null
      ? [value]
      : fallback != null
        ? [fallback]
        : []

  return Array.from(new Set(
    rawValues
      .map(typeId => Number(typeId))
      .filter(typeId => Number.isFinite(typeId) && typeId > 0),
  ))
}

const normalizeSessionItem = (record: any): BrisageSessionItem | null => {
  if (!record?.id || !record?.item) return null
  const runs = Array.isArray(record?.runs)
    ? record.runs.map(normalizeItemRun).filter(Boolean) as BrisageItemRun[]
    : buildFallbackRuns(record)
  return {
    id: String(record.id),
    itemId: record.itemId,
    item: record.item,
    notes: String(record.notes ?? ''),
    runs,
  }
}

const normalizeItemRun = (record: any): BrisageItemRun | null => {
  if (!record?.id) return null
  return {
    id: String(record.id),
    quantity: Math.max(1, Number(record.quantity ?? 1) || 1),
    buyStartKamas: Math.max(0, Number(record.buyStartKamas ?? 0) || 0),
    buyEndKamas: Math.max(0, Number(record.buyEndKamas ?? 0) || 0),
    realizedRuneValue: Math.max(0, Number(record.realizedRuneValue ?? 0) || 0),
    notes: String(record.notes ?? ''),
  }
}

const buildFallbackRuns = (record: any): BrisageItemRun[] => {
  const quantity = Math.max(1, Number(record?.quantity ?? 1) || 1)
  const totalCraftCost = Math.max(0, Number(record?.craftCost ?? 0) || 0)
  const unitCraftCost = Math.max(0, Number(record?.unitCraftCost ?? 0) || 0)
  const fallbackCost = totalCraftCost || (quantity * unitCraftCost)

  return [{
    id: crypto.randomUUID(),
    quantity,
    buyStartKamas: fallbackCost,
    buyEndKamas: 0,
    realizedRuneValue: Math.max(0, Number(record?.realizedRuneValue ?? 0) || 0),
    notes: String(record?.notes ?? ''),
  }]
}

const normalizeSessionRecord = (record: any): BrisageSession | null => {
  if (!record?.id) return null
  const items = Array.isArray(record?.items)
    ? record.items.map(normalizeSessionItem).filter(Boolean) as BrisageSessionItem[]
    : []
  const resourceChecklist = Array.isArray(record?.resourceChecklist)
    ? record.resourceChecklist.map(normalizeSessionResource).filter(Boolean) as BrisageSessionResource[]
    : []
  return {
    id: String(record.id),
    date: String(record.date ?? todayISO()),
    startingKamas: Number(record.startingKamas ?? 0) || 0,
    endingKamas: Number(record.endingKamas ?? 0) || 0,
    externalDelta: Number(record.externalDelta ?? 0) || 0,
    categoryTypeId: Number(record.categoryTypeId ?? 0) || null,
    categoryTypeIds: normalizeCategoryTypeIds(record.categoryTypeIds, record.categoryTypeId),
    levelMin: normalizeLevelValue(record.levelMin),
    levelMax: normalizeLevelValue(record.levelMax),
    categoryLabel: String(record.categoryLabel ?? ''),
    notes: String(record.notes ?? ''),
    items,
    resourceChecklist,
  }
}

const normalizeSessionResource = (record: any): BrisageSessionResource | null => {
  const id = Number(record?.id ?? 0)
  if (!id) return null
  const sourceItems = Array.isArray(record?.sourceItems)
    ? record.sourceItems.map((source: any) => ({
        itemKey: String(source?.itemKey ?? ''),
        itemName: String(source?.itemName ?? ''),
        itemImage: typeof source?.itemImage === 'string' ? source.itemImage : null,
        quantity: Math.max(0, Number(source?.quantity ?? 0) || 0),
        totalQuantity: Math.max(0, Number(source?.totalQuantity ?? 0) || 0),
      })).filter((source: BrisageSessionResourceSource) => source.itemKey && source.itemName && source.totalQuantity > 0)
    : undefined

  return {
    id,
    name: String(record?.name ?? `Ingredient #${id}`),
    image: typeof record?.image === 'string' ? record.image : null,
    typeName: typeof record?.typeName === 'string' ? record.typeName : null,
    totalQuantity: Math.max(0, Number(record?.totalQuantity ?? 0) || 0),
    hasRecipe: Boolean(record?.hasRecipe),
    isDone: Boolean(record?.isDone),
    sourceItems,
  }
}

const normalizeLegacyEntry = (record: any): LegacyBrisageEntry | null => {
  if (!record?.id || !record?.item) return null
  return {
    id: String(record.id),
    itemId: record.itemId,
    item: record.item,
    craftPrice: Math.max(0, Number(record.craftPrice ?? 0) || 0),
    hdvPrice: Math.max(0, Number(record.hdvPrice ?? 0) || 0),
    runeValue: Math.max(0, Number(record.runeValue ?? 0) || 0),
    date: String(record.date ?? todayISO()),
    notes: String(record.notes ?? ''),
  }
}

const migrateLegacyEntries = (legacyEntries: LegacyBrisageEntry[]) =>
  legacyEntries.map(entry => ({
    id: `legacy-${entry.id}`,
    date: entry.date || todayISO(),
    startingKamas: 0,
    endingKamas: 0,
    externalDelta: 0,
    categoryTypeId: Number(entry.item?.type?.id ?? 0) || null,
    categoryTypeIds: normalizeCategoryTypeIds(entry.item?.type?.id),
    levelMin: normalizeLevelValue(entry.item?.level),
    levelMax: normalizeLevelValue(entry.item?.level),
    categoryLabel: String(entry.item?.type?.name?.fr ?? ''),
    notes: entry.notes,
    items: [
      {
        id: entry.id,
        itemId: entry.itemId,
        item: entry.item,
        notes: entry.notes,
        runs: [
          {
            id: `legacy-run-${entry.id}`,
            quantity: 1,
            buyStartKamas: entry.craftPrice,
            buyEndKamas: 0,
            realizedRuneValue: entry.runeValue,
            notes: entry.notes,
          },
        ],
      },
    ],
    resourceChecklist: [],
  } satisfies BrisageSession))

const saveSessions = () =>
  localStorage.setItem(sessionsKey.value, JSON.stringify(sessions.value))

const loadData = () => {
  if (!hasContext.value) return

  const rawSessions = localStorage.getItem(sessionsKey.value)
  if (rawSessions) {
    const parsed = JSON.parse(rawSessions)
    sessions.value = Array.isArray(parsed)
      ? parsed.map(normalizeSessionRecord).filter(Boolean) as BrisageSession[]
      : []
    saveSessions()
    return
  }

  const rawLegacyEntries = localStorage.getItem(legacyEntriesKey.value)
  const parsedLegacyEntries = rawLegacyEntries ? JSON.parse(rawLegacyEntries) : []
  const normalizedLegacyEntries = Array.isArray(parsedLegacyEntries)
    ? parsedLegacyEntries.map(normalizeLegacyEntry).filter(Boolean) as LegacyBrisageEntry[]
    : []

  sessions.value = migrateLegacyEntries(normalizedLegacyEntries)
  saveSessions()
}

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  if (loadedBatchResults.value.length) {
    filterLoadedBatchResults()
    return
  }
  searchTimer = setTimeout(doSearch, 350)
}

const itemSearchHaystack = (item: any) =>
  [
    item?.name?.fr,
    item?.name?.en,
    item?.slug?.fr,
    item?.slug?.en,
    item?.type?.name?.fr,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

const filterLoadedBatchResults = () => {
  const query = search.value.trim().toLowerCase()
  const filteredResults = query
    ? loadedBatchResults.value.filter(item => itemSearchHaystack(item).includes(query))
    : [...loadedBatchResults.value]
  results.value = excludeDraftItems(filteredResults)
}

const clearLoadedBatchResults = () => {
  loadedBatchResults.value = []
  results.value = []
}

const doSearch = async () => {
  if (!search.value.trim()) {
    results.value = []
    return
  }
  searching.value = true
  try {
    const res = await $fetch<any>('/api/dofusdb/items', {
      query: {
        'slug.fr[$search]': search.value.trim(),
        'typeId[$ne]': 203,
        '$sort': '-id',
        'level[$gte]': 0,
        'level[$lte]': 200,
        '$skip': 0,
        'lang': 'fr',
      },
    })
    results.value = res?.data ?? []
  }
  catch {
    results.value = []
  }
  finally {
    searching.value = false
  }
}

const clearSearch = () => {
  search.value = ''
  results.value = loadedBatchResults.value.length ? excludeDraftItems(loadedBatchResults.value) : []
}

const selectedCategoryOptions = computed(() =>
  BRISAGE_CATEGORY_OPTIONS.filter(option => draftSession.value.categoryTypeIds.includes(option.typeId)),
)

const categoryPickerLabel = computed(() => {
  if (!selectedCategoryOptions.value.length) return t('v2.brisage.placeholders.selectCategory')
  if (selectedCategoryOptions.value.length <= 2) {
    return selectedCategoryOptions.value.map(option => option.label).join(', ')
  }
  return `${selectedCategoryOptions.value.length} ${t('v2.brisage.fields.focusCategory')}`
})

const selectedCategoryLabel = computed(() =>
  selectedCategoryOptions.value.map(option => option.label).join(', '),
)

const syncDraftCategoryMeta = () => {
  draftSession.value.categoryTypeId = draftSession.value.categoryTypeIds[0] ?? null
  draftSession.value.categoryLabel = selectedCategoryLabel.value
}

const toggleCategoryType = (typeId: number) => {
  draftSession.value.categoryTypeIds = draftSession.value.categoryTypeIds.includes(typeId)
    ? draftSession.value.categoryTypeIds.filter(currentId => currentId !== typeId)
    : [...draftSession.value.categoryTypeIds, typeId]
  syncDraftCategoryMeta()
}

const draftItemIdSet = computed(() =>
  new Set(draftItems.value.map(item => String(item.itemId))),
)

const excludeDraftItems = (items: any[]) =>
  items.filter(item => !draftItemIdSet.value.has(String(item?.id)))

const addItemToDraft = (item: any) => {
  const existing = draftItems.value.find(draftItem => String(draftItem.itemId) === String(item?.id))
  if (existing) {
    if (!expandedDraftItemIds.value.includes(existing.id)) {
      expandedDraftItemIds.value = [...expandedDraftItemIds.value, existing.id]
    }
    return
  }

  const draftId = crypto.randomUUID()
  draftItems.value.unshift({
    id: draftId,
    itemId: item.id,
    item,
    notes: '',
    runs: [createEmptyRun()],
  })

  if (!draftSession.value.categoryLabel) {
    draftSession.value.categoryLabel = String(item?.type?.name?.fr ?? '')
  }
  if (draftSession.value.categoryTypeId == null) {
    draftSession.value.categoryTypeId = Number(item?.type?.id ?? 0) || null
  }
  if (!draftSession.value.categoryTypeIds.length && draftSession.value.categoryTypeId != null) {
    draftSession.value.categoryTypeIds = [draftSession.value.categoryTypeId]
  }
  if (draftSession.value.levelMin == null && item?.level) {
    draftSession.value.levelMin = normalizeLevelValue(item.level)
  }
  if (draftSession.value.levelMax == null && item?.level) {
    draftSession.value.levelMax = normalizeLevelValue(item.level)
  }
  if (loadedBatchResults.value.length) {
    filterLoadedBatchResults()
  }
}

const loadCategoryBatch = async () => {
  const typeIds = draftSession.value.categoryTypeIds
  const levelMin = normalizeLevelValue(draftSession.value.levelMin)
  const levelMax = normalizeLevelValue(draftSession.value.levelMax)

  if (!typeIds.length || !levelMin || !levelMax) {
    loadedBatchResults.value = []
    results.value = []
    return
  }

  loadingBatchResults.value = true
  syncDraftCategoryMeta()

  try {
    const collected: any[] = []
    let skip = 0
    let total = Infinity
    let pageSize = 0

    while (skip < total) {
      const res = await $fetch<any>('/api/dofusdb/items', {
        query: {
          'typeId[$ne]': 203,
          'typeId[$in][]': typeIds,
          'level[$gte]': levelMin,
          'level[$lte]': levelMax,
          '$sort': 'level',
          '$skip': skip,
          'lang': 'fr',
        },
      })

      const pageItems = Array.isArray(res?.data) ? res.data : []
      total = Number(res?.total ?? pageItems.length)
      pageSize = Number(res?.limit ?? pageItems.length)

      if (!pageItems.length) break

      collected.push(...pageItems)

      if (collected.length >= total) break

      skip += pageItems.length || pageSize
      if (!skip) break
    }

    const deduped = new Map<string | number, any>()
    collected.forEach((item) => {
      deduped.set(item?.id ?? crypto.randomUUID(), item)
    })

    loadedBatchResults.value = Array.from(deduped.values()).sort((a, b) => {
      const levelDiff = (Number(a?.level) || 0) - (Number(b?.level) || 0)
      if (levelDiff) return levelDiff
      return String(a?.name?.fr ?? a?.id ?? '').localeCompare(String(b?.name?.fr ?? b?.id ?? ''))
    })
    filterLoadedBatchResults()
  }
  catch {
    loadedBatchResults.value = []
    results.value = []
  }
  finally {
    loadingBatchResults.value = false
  }
}

const removeDraftItem = (id: string) => {
  draftItems.value = draftItems.value.filter(item => item.id !== id)
  expandedDraftItemIds.value = expandedDraftItemIds.value.filter(currentId => currentId !== id)
  if (loadedBatchResults.value.length) {
    filterLoadedBatchResults()
  }
}

const isDraftItemExpanded = (id: string) => expandedDraftItemIds.value.includes(id)

const toggleDraftItem = (id: string) => {
  expandedDraftItemIds.value = isDraftItemExpanded(id)
    ? expandedDraftItemIds.value.filter(currentId => currentId !== id)
    : [...expandedDraftItemIds.value, id]
}

const isSessionExpanded = (id: string) => expandedSessionIds.value.includes(id)

const toggleSession = (id: string) => {
  expandedSessionIds.value = isSessionExpanded(id)
    ? expandedSessionIds.value.filter(currentId => currentId !== id)
    : [...expandedSessionIds.value, id]
}

const createEmptyRun = (): BrisageItemRun => ({
  id: crypto.randomUUID(),
  quantity: 1,
  buyStartKamas: 0,
  buyEndKamas: 0,
  realizedRuneValue: 0,
  notes: '',
})

const addRunToDraftItem = (itemId: string) => {
  const item = draftItems.value.find(entry => entry.id === itemId)
  if (!item) return
  item.runs.push(createEmptyRun())
  if (!isDraftItemExpanded(itemId)) {
    toggleDraftItem(itemId)
  }
}

const removeRunFromDraftItem = (itemId: string, runId: string) => {
  const item = draftItems.value.find(entry => entry.id === itemId)
  if (!item) return
  if (item.runs.length === 1) {
    item.runs[0] = createEmptyRun()
    return
  }
  item.runs = item.runs.filter(run => run.id !== runId)
}

const runCraftCost = (run: BrisageItemRun) =>
  Math.max(0, (Number(run.buyStartKamas) || 0) - (Number(run.buyEndKamas) || 0))

const runProfit = (run: BrisageItemRun) =>
  (Number(run.realizedRuneValue) || 0) - runCraftCost(run)

const itemQuantityTotal = (item: BrisageSessionItem) =>
  item.runs.reduce((sum, run) => sum + (Number(run.quantity) || 0), 0)

const sessionQuantityTotal = (session: BrisageSession) =>
  session.items.reduce((sum, item) => sum + itemQuantityTotal(item), 0)

const itemCraftTotal = (item: BrisageSessionItem) =>
  item.runs.reduce((sum, run) => sum + runCraftCost(run), 0)

const itemRealizedTotal = (item: BrisageSessionItem) =>
  item.runs.reduce((sum, run) => sum + (Number(run.realizedRuneValue) || 0), 0)

const draftRecipeSignature = computed(() =>
  JSON.stringify(
    draftItems.value.map(item => ({
      itemId: item.itemId,
      quantity: itemQuantityTotal(item),
    })),
  ),
)

const draftResourceChecklistByItem = computed(() => {
  const groups = new Map<string, {
    itemKey: string
    itemName: string
    image: string | null
    quantity: number
    resources: BrisageSessionResource[]
  }>()

  draftResourceChecklist.value.forEach((resource) => {
    resource.sourceItems?.forEach((source) => {
      const group = groups.get(source.itemKey) ?? {
        itemKey: source.itemKey,
        itemName: source.itemName,
        image: source.itemImage,
        quantity: source.quantity,
        resources: [],
      }

      group.resources.push({
        ...resource,
        totalQuantity: source.totalQuantity,
      })
      groups.set(source.itemKey, group)
    })
  })

  return Array.from(groups.values()).map(group => ({
    ...group,
    resources: group.resources.sort((a, b) => {
      if (a.isDone !== b.isDone) return Number(a.isDone) - Number(b.isDone)
      if (b.totalQuantity !== a.totalQuantity) return b.totalQuantity - a.totalQuantity
      return a.name.localeCompare(b.name)
    }),
  }))
})

const fetchRecipeChecklist = async () => {
  if (!draftItems.value.length) {
    draftResourceChecklist.value = []
    recipeChecklistState.value = { hasFetched: false, isLoading: false, error: 'Add items first.' }
    return
  }

  recipeChecklistState.value = { hasFetched: true, isLoading: true, error: '' }

  try {
    const existingChecks = new Map<number, boolean>(
      draftResourceChecklist.value.map(resource => [resource.id, resource.isDone]),
    )

    const ingredientMap = new Map<number, BrisageSessionResource>()

    const recipes = await Promise.allSettled(
      draftItems.value.map(async (item) => {
        const recipe = await $fetch<any>(`/api/dofusdb/recipes/${encodeURIComponent(String(item.itemId))}`, {
          query: { lang: 'fr' },
        })
        return { item, recipe }
      }),
    )

    recipes.forEach((result) => {
      if (result.status !== 'fulfilled') return

      const { item, recipe } = result.value
      if (!recipe?.ingredientIds?.length || !recipe?.quantities?.length) return
      const multiplier = Math.max(1, itemQuantityTotal(item))
      const source = {
        itemKey: item.id,
        itemName: item.item?.name?.fr || item.item?.name?.en || `Item #${item.itemId}`,
        itemImage: getItemImg(item.item),
        quantity: multiplier,
      }

      recipe.ingredientIds.forEach((ingredientId: number, index: number) => {
        const ingredient = recipe.ingredients?.find((candidate: any) => candidate.id === ingredientId)
        const baseQuantity = Number(recipe.quantities?.[index] ?? 0) || 0
        const totalQuantity = baseQuantity * multiplier
        const existing = ingredientMap.get(ingredientId)

        if (existing) {
          existing.totalQuantity += totalQuantity
          existing.sourceItems = [
            ...(existing.sourceItems ?? []),
            {
              ...source,
              totalQuantity,
            },
          ]
          return
        }

        ingredientMap.set(ingredientId, {
          id: ingredientId,
          name: ingredient?.name?.fr || ingredient?.name?.en || `Ingredient #${ingredientId}`,
          image: ingredient?.img || null,
          typeName: ingredient?.type?.name?.fr || ingredient?.type?.name?.en || null,
          totalQuantity,
          hasRecipe: Boolean(ingredient?.hasRecipe),
          isDone: existingChecks.get(ingredientId) ?? false,
          sourceItems: [
            {
              ...source,
              totalQuantity,
            },
          ],
        })
      })
    })

    if (!ingredientMap.size) {
      draftResourceChecklist.value = []
      recipeChecklistState.value = {
        hasFetched: true,
        isLoading: false,
        error: 'No recipe ingredients found for the current draft items.',
      }
      return
    }

    draftResourceChecklist.value = Array.from(ingredientMap.values()).sort((a, b) => {
      if (a.isDone !== b.isDone) return Number(a.isDone) - Number(b.isDone)
      if (b.totalQuantity !== a.totalQuantity) return b.totalQuantity - a.totalQuantity
      return a.name.localeCompare(b.name)
    })

    recipeChecklistState.value = { hasFetched: true, isLoading: false, error: '' }
  }
  catch {
    draftResourceChecklist.value = []
    recipeChecklistState.value = {
      hasFetched: true,
      isLoading: false,
      error: 'Failed to load recipe resources for the current draft.',
    }
  }
}

const toggleDraftResourceDone = (resourceId: number) => {
  draftResourceChecklist.value = draftResourceChecklist.value.map(resource =>
    resource.id === resourceId
      ? { ...resource, isDone: !resource.isDone }
      : resource,
  )
}

const itemProfit = (item: BrisageSessionItem) =>
  itemRealizedTotal(item) - itemCraftTotal(item)

const sessionTotals = (session: BrisageSession) => {
  const craft = session.items.reduce((sum, item) => sum + itemCraftTotal(item), 0)
  const realized = session.items.reduce((sum, item) => sum + itemRealizedTotal(item), 0)
  return { craft, realized, profit: realized - craft }
}

const draftTotals = computed(() => {
  const craft = draftItems.value.reduce((sum, item) => sum + itemCraftTotal(item), 0)
  const realized = draftItems.value.reduce((sum, item) => sum + itemRealizedTotal(item), 0)
  return { craft, realized, profit: realized - craft }
})

const totalItemsLogged = computed(() =>
  sessions.value.reduce((sum, session) => sum + session.items.length, 0),
)

const totalPL = computed(() =>
  sessions.value.reduce((sum, session) => sum + sessionTotals(session).profit, 0),
)

const avgSessionPL = computed(() => {
  if (!sessions.value.length) return 0
  return Math.round(totalPL.value / sessions.value.length)
})

const sessionMargin = (session: BrisageSession) => {
  const totals = sessionTotals(session)
  if (!totals.craft) return 0
  return Math.round((totals.profit / totals.craft) * 100)
}

const resetDraft = () => {
  draftItems.value = []
  expandedDraftItemIds.value = []
  draftResourceChecklist.value = []
  recipeChecklistState.value = { hasFetched: false, isLoading: false, error: '' }
  draftSession.value = {
    date: todayISO(),
    startingKamas: 0,
    endingKamas: 0,
    externalDelta: 0,
    categoryTypeId: null,
    categoryTypeIds: [],
    levelMin: null,
    levelMax: null,
    categoryLabel: '',
    notes: '',
  }
  clearSearch()
}

const startSessionBuilder = () => {
  brisageMode.value = 'builder'
}

const showSessionHistory = () => {
  brisageMode.value = 'history'
}

const saveSession = () => {
  if (!draftItems.value.length) return

  sessions.value.unshift({
    id: crypto.randomUUID(),
    date: draftSession.value.date || todayISO(),
    startingKamas: Number(draftSession.value.startingKamas) || 0,
    endingKamas: Number(draftSession.value.endingKamas) || 0,
    externalDelta: Number(draftSession.value.externalDelta) || 0,
    categoryTypeId: draftSession.value.categoryTypeIds[0] ?? null,
    categoryTypeIds: [...draftSession.value.categoryTypeIds],
    levelMin: normalizeLevelValue(draftSession.value.levelMin),
    levelMax: normalizeLevelValue(draftSession.value.levelMax),
    categoryLabel: (selectedCategoryLabel.value || draftSession.value.categoryLabel).trim(),
    notes: draftSession.value.notes.trim(),
    items: draftItems.value.map(item => ({
      id: item.id,
      itemId: item.itemId,
      item: item.item,
      notes: item.notes.trim(),
      runs: item.runs.map(run => ({
        id: run.id,
        quantity: Math.max(1, Number(run.quantity) || 1),
        buyStartKamas: Math.max(0, Number(run.buyStartKamas) || 0),
        buyEndKamas: Math.max(0, Number(run.buyEndKamas) || 0),
        realizedRuneValue: Math.max(0, Number(run.realizedRuneValue) || 0),
        notes: run.notes.trim(),
      })),
    })),
    resourceChecklist: draftResourceChecklist.value.map(resource => ({ ...resource })),
  })

  saveSessions()
  resetDraft()
  showSessionHistory()
}

const deleteSession = (id: string) => {
  sessions.value = sessions.value.filter(session => session.id !== id)
  saveSessions()
}

const describeSessionScope = (session: BrisageSession) => {
  const parts: string[] = []
  if (session.levelMin && session.levelMax) parts.push(`Lv ${session.levelMin}-${session.levelMax}`)
  else if (session.levelMin) parts.push(`Lv ${session.levelMin}+`)
  else if (session.levelMax) parts.push(`Up to Lv ${session.levelMax}`)
  if (session.categoryLabel) parts.push(session.categoryLabel)
  return parts.join(' · ') || 'No explicit scope'
}

const getItemImg = (item: any) => item?.img ?? ''
const onImgErr = (e: Event) => {
  const img = e.target as HTMLImageElement
  if (img.dataset.fb) return
  img.dataset.fb = '1'
  img.src = '/item-fallback.svg'
}

const formatKamas = (n: number) => {
  if (!n) return '0'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${Math.round(n / 1_000)}K`
  return Math.round(n).toLocaleString()
}

function todayISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

const formatDisplayDate = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })
}

const searchAreaEl = ref<HTMLElement | null>(null)
const onDocMousedown = (e: MouseEvent) => {
  const t = e.target as Node
  if (searchAreaEl.value && !searchAreaEl.value.contains(t)) {
    results.value = []
  }
  if (categoryPickerEl.value && !categoryPickerEl.value.contains(t)) {
    categoryPickerOpen.value = false
  }
}

onMounted(() => {
  initContext()
  loadData()
  document.addEventListener('mousedown', onDocMousedown)
})

onUnmounted(() => document.removeEventListener('mousedown', onDocMousedown))
watch([selectedServer, selectedCharacter], loadData)
watch(
  () => [
    draftSession.value.categoryTypeIds.join(','),
    draftSession.value.levelMin,
    draftSession.value.levelMax,
  ],
  clearLoadedBatchResults,
)
watch(draftRecipeSignature, async () => {
  if (!draftItems.value.length) {
    draftResourceChecklist.value = []
    recipeChecklistState.value = {
      hasFetched: false,
      isLoading: false,
      error: '',
    }
    return
  }

  if (!recipeChecklistState.value.hasFetched || recipeChecklistState.value.isLoading) {
    return
  }

  await fetchRecipeChecklist()
})
</script>

<style scoped>
.br-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: .625rem;
  margin-bottom: .875rem;
}

.br-stat {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .875rem 1rem;
  border-radius: 12px;
  background: var(--v2-hover);
  border: 1px solid var(--v2-border-med);
}

.br-stat--green { border-color: rgba(52,211,153,.2); background: rgba(52,211,153,.05); }
.br-stat--red { border-color: rgba(248,113,113,.2); background: rgba(248,113,113,.05); }

.br-stat__icon {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 9px;
  background: var(--v2-border-med);
  color: var(--v2-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.br-stat--green .br-stat__icon { background: rgba(52,211,153,.15); color: #34d399; }
.br-stat--red .br-stat__icon { background: rgba(248,113,113,.15); color: #f87171; }
.br-stat__val { font-size: 1.25rem; font-weight: 800; color: var(--v2-text); line-height: 1.2; }
.br-stat__lbl { font-size: .6875rem; color: var(--v2-text-dim); margin-top: 1px; }

.br-flow {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  margin-bottom: 1rem;
}

.br-flow__actions {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
}

.br-flow-tab {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  min-height: 38px;
  padding: .5rem .875rem;
  border-radius: 10px;
  border: 1px solid var(--v2-active);
  background: rgba(0,0,0,.16);
  color: var(--v2-text-secondary);
  font-size: .875rem;
  font-weight: 700;
  cursor: pointer;
  transition: .16s ease;
}

.br-flow-tab:hover,
.br-flow-tab--active {
  border-color: var(--v2-border-strong);
  background: var(--v2-hover);
  color: var(--v2-text);
}

.br-flow-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .5rem;
}

.br-flow-step {
  display: flex;
  align-items: center;
  gap: .5rem;
  min-width: 0;
  padding: .625rem .75rem;
  border-radius: 10px;
  border: 1px solid var(--v2-active);
  background: rgba(0,0,0,.14);
  color: var(--v2-text-secondary);
  font-size: .75rem;
  font-weight: 700;
}

.br-flow-step span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--v2-border-med);
  color: var(--v2-text);
  font-size: .75rem;
}

.br-flow-step--done {
  border-color: rgba(52,211,153,.22);
  background: rgba(52,211,153,.06);
  color: var(--v2-text);
}

.br-flow-step--done span {
  background: rgba(52,211,153,.18);
  color: #86efac;
}

@media (max-width: 720px) {
  .br-flow-steps { grid-template-columns: 1fr; }
  .br-flow-tab { flex: 1; justify-content: center; }
}

.br-layout {
  display: grid;
  grid-template-columns: minmax(340px, 440px) 1fr;
  gap: 1rem;
  align-items: start;
}

.br-layout--builder,
.br-layout--history {
  grid-template-columns: minmax(0, 1fr);
}

@media (max-width: 980px) {
  .br-layout { grid-template-columns: 1fr; }
}

.br-panel {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  padding: 1rem;
}

.br-panel-title {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-size: .875rem;
  font-weight: 700;
  color: var(--v2-accent);
  margin-bottom: .875rem;
}

.br-collapse-toggle {
  margin-left: auto;
  border: 1px solid var(--v2-active);
  background: rgba(0,0,0,.18);
  color: var(--v2-text-secondary);
  border-radius: 999px;
  padding: .25rem .625rem;
  font-size: .75rem;
  cursor: pointer;
}

.br-collapse-toggle--inline {
  margin-left: 0;
}

.br-panel-title--sub {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--v2-active);
}

.br-badge {
  background: var(--v2-active-strong);
  color: var(--v2-accent);
  font-size: .6875rem;
  font-weight: 600;
  padding: .125rem .4375rem;
  border-radius: 999px;
}

.br-form {
  background: rgba(0,0,0,.18);
  border: 1px solid var(--v2-border);
  border-radius: 12px;
  padding: .875rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.br-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .5rem;
}

.br-form__row--triple {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 540px) {
  .br-form__row,
  .br-form__row--triple {
    grid-template-columns: 1fr;
  }
}

.br-form__field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.br-field-lbl { font-size: .6875rem; color: var(--v2-text-secondary); font-weight: 500; }
.br-field-help { font-size: .6875rem; color: var(--v2-text-muted); line-height: 1.35; margin-top: 2px; }

.br-field-input {
  background: rgba(0,0,0,.3);
  border: 1px solid var(--v2-active-strong);
  border-radius: 8px;
  padding: .4375rem .75rem;
  color: var(--v2-text);
  font-size: .875rem;
  outline: none;
  transition: border-color .15s;
  width: 100%;
}

.br-field-input:focus { border-color: var(--v2-border-focus); }
.br-field-input::placeholder { color: var(--v2-text-dim); }

.br-multi {
  position: relative;
}

.br-multi__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  border: 1px solid var(--v2-border-med);
  border-radius: 10px;
  background: color-mix(in srgb, var(--v2-hover-subtle) 88%, black 12%);
  color: var(--v2-text);
  padding: .5rem .75rem;
  font-size: .875rem;
  text-align: left;
  cursor: pointer;
  transition: border-color .16s ease, background .16s ease;
}

.br-multi__trigger:hover {
  border-color: var(--v2-border-focus);
  background: color-mix(in srgb, var(--v2-hover-subtle) 78%, black 22%);
}

.br-multi__trigger span {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.br-multi__trigger--placeholder span {
  color: var(--v2-text-dim);
}

.br-multi__chevron--open {
  transform: rotate(180deg);
}

.br-multi__menu {
  position: absolute;
  top: calc(100% + .4rem);
  left: 0;
  right: 0;
  z-index: 35;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: .45rem;
  border: 1px solid var(--v2-border-med);
  border-radius: 12px;
  background: color-mix(in srgb, var(--v2-hover-subtle) 96%, black 4%);
  backdrop-filter: blur(10px);
  box-shadow: 0 16px 32px rgba(0,0,0,.42);
  max-height: 280px;
  overflow-y: auto;
}

.br-multi__option {
  display: flex;
  align-items: center;
  gap: .625rem;
  padding: .55rem .65rem;
  border: 1px solid var(--v2-border-subtle);
  border-radius: 10px;
  background: color-mix(in srgb, var(--v2-hover) 84%, black 16%);
  color: var(--v2-text);
  font-size: .8125rem;
  cursor: pointer;
}

.br-multi__option:hover {
  border-color: var(--v2-border-focus);
  background: color-mix(in srgb, var(--v2-active-strong) 78%, black 22%);
}

.br-multi__check {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  accent-color: var(--v2-accent);
}

.br-session-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .5rem;
}

.br-session-summary__item {
  padding: .625rem .75rem;
  border-radius: 10px;
  background: rgba(0,0,0,.22);
  border: 1px solid var(--v2-border-med);
}

.br-session-summary__label {
  font-size: .6875rem;
  color: var(--v2-text-muted);
  text-transform: uppercase;
  letter-spacing: .04em;
}

.br-session-summary__value {
  margin-top: .25rem;
  font-size: .95rem;
  font-weight: 800;
  color: var(--v2-text);
}

.br-search { position: relative; display: flex; align-items: center; margin-bottom: .75rem; }
.br-search__icon { position: absolute; left: .75rem; color: var(--v2-text-muted); pointer-events: none; }

.br-batch-controls {
  display: flex;
  flex-direction: column;
  gap: .375rem;
  margin-top: .875rem;
  margin-bottom: .75rem;
}

.br-search__input {
  background: rgba(0,0,0,.3);
  border: 1px solid var(--v2-border);
  border-radius: 10px;
  padding: .5rem 2.25rem;
  color: var(--v2-text);
  font-size: .875rem;
  outline: none;
  width: 100%;
  transition: border-color .18s;
}

.br-search__input:focus { border-color: var(--v2-border-focus); }
.br-search__input::placeholder { color: var(--v2-text-dim); }

.br-search__clear {
  position: absolute;
  right: .625rem;
  background: none;
  border: none;
  color: var(--v2-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
}

.br-search__clear:hover { color: var(--v2-accent); }
.br-inline-loader { display: flex; align-items: center; gap: .5rem; font-size: .8125rem; color: var(--v2-text-secondary); padding: .375rem 0; }

.br-spin {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 2px solid var(--v2-border-med);
  border-top-color: var(--v2-accent);
  border-radius: 50%;
  animation: brspin .8s linear infinite;
}

@keyframes brspin { to { transform: rotate(360deg); } }

.br-empty-hint { font-size: .8125rem; color: var(--v2-text-muted); padding: .375rem 0; }

.br-results {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 200px;
  overflow-y: auto;
}

.br-result {
  display: flex;
  align-items: center;
  gap: .625rem;
  padding: .4375rem .625rem;
  border-radius: 9px;
  border: 1px solid transparent;
  background: rgba(0,0,0,.15);
  cursor: pointer;
  transition: all .15s;
  text-align: left;
}

.br-result:hover { background: var(--v2-glow); border-color: var(--v2-active-strong); }
.br-result--disabled { border-color: var(--v2-active); background: rgba(0,0,0,.22); }
.br-result__img { width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; }
.br-result__name { font-size: .8125rem; font-weight: 600; color: var(--v2-text); }
.br-result__sub { font-size: .6875rem; color: var(--v2-text-muted); margin-top: 1px; }
.br-result__info { flex: 1; min-width: 0; }
.br-result__cta { font-size: .6875rem; font-weight: 700; color: var(--v2-accent); }

.br-draft-list {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  margin-top: .75rem;
  margin-bottom: .875rem;
}

.br-draft-card {
  background: rgba(0,0,0,.18);
  border: 1px solid var(--v2-active);
  border-radius: 12px;
  padding: .875rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.br-draft-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: .75rem;
}

.br-draft-card__actions {
  display: flex;
  align-items: center;
  gap: .375rem;
}

.br-draft-card__toggle {
  border: 1px solid var(--v2-active);
  background: rgba(0,0,0,.2);
  color: var(--v2-text-secondary);
  border-radius: 999px;
  padding: .3125rem .625rem;
  font-size: .75rem;
  cursor: pointer;
  transition: .15s ease;
}

.br-draft-card__toggle:hover {
  color: var(--v2-text);
  border-color: var(--v2-border-strong);
}

.br-draft-card__meta {
  display: flex;
  align-items: center;
  gap: .75rem;
  min-width: 0;
}

.br-draft-card__img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  flex-shrink: 0;
}

.br-draft-card__name { font-size: .9375rem; font-weight: 700; color: var(--v2-text); }
.br-draft-card__sub { font-size: .75rem; color: var(--v2-text-secondary); margin-top: 2px; }

.br-draft-card__summary {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  font-size: .75rem;
  color: var(--v2-text-secondary);
}

.br-draft-card__summary span {
  padding: .25rem .5rem;
  border-radius: 999px;
  background: rgba(0,0,0,.18);
  border: 1px solid var(--v2-active);
}

.br-draft-card__details {
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.br-item-runs {
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.br-item-run {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  padding: .75rem;
  border-radius: 10px;
  background: rgba(0,0,0,.18);
  border: 1px solid var(--v2-active);
}

.br-item-run__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
}

.br-item-run__title {
  font-size: .8125rem;
  font-weight: 700;
  color: var(--v2-text);
}

.br-item-run__del {
  border: 1px solid rgba(248,113,113,.25);
  background: rgba(248,113,113,.08);
  color: #fca5a5;
  border-radius: 999px;
  padding: .25rem .625rem;
  font-size: .75rem;
  cursor: pointer;
}

.br-resource-list {
  display: flex;
  flex-direction: column;
  gap: .375rem;
  margin-top: .75rem;
  margin-bottom: .875rem;
}

.br-resource-list--grouped {
  margin-top: .5rem;
  margin-bottom: 0;
}

.br-resource-view-toggle {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--v2-active);
  border-radius: 10px;
  background: rgba(0,0,0,.2);
}

.br-resource-view-toggle__btn {
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--v2-text-secondary);
  padding: .375rem .625rem;
  font-size: .75rem;
  font-weight: 700;
  cursor: pointer;
  transition: .15s ease;
}

.br-resource-view-toggle__btn:hover,
.br-resource-view-toggle__btn--active {
  background: var(--v2-active-strong);
  color: var(--v2-text);
}

.br-resource-groups {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  margin-top: .75rem;
  margin-bottom: .875rem;
}

.br-resource-group {
  padding: .75rem;
  border: 1px solid var(--v2-active);
  border-radius: 12px;
  background: rgba(0,0,0,.16);
}

.br-resource-group__head {
  display: flex;
  align-items: center;
  gap: .625rem;
}

.br-resource-group__img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  flex-shrink: 0;
}

.br-resource-group__meta {
  min-width: 0;
}

.br-resource-group__name {
  font-size: .875rem;
  font-weight: 800;
  color: var(--v2-text);
}

.br-resource-group__sub {
  font-size: .6875rem;
  color: var(--v2-text-secondary);
  margin-top: 2px;
}

.br-resource-row {
  display: grid;
  grid-template-columns: 20px 28px 1fr auto;
  align-items: center;
  gap: .625rem;
  padding: .5rem .625rem;
  border-radius: 10px;
  background: rgba(0,0,0,.18);
  border: 1px solid var(--v2-active);
  cursor: pointer;
}

.br-resource-row--saved { cursor: default; }

.br-resource-row__check {
  width: 16px;
  height: 16px;
  accent-color: #86efac;
}

.br-resource-row__check--static {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86efac;
  font-weight: 700;
}

.br-resource-row__img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.br-resource-row__img--fallback {
  border-radius: 6px;
  background: rgba(255,255,255,.05);
}

.br-resource-row__meta {
  min-width: 0;
}

.br-resource-row__name {
  font-size: .8125rem;
  font-weight: 700;
  color: var(--v2-text);
}

.br-resource-row__name--done {
  text-decoration: line-through;
  opacity: .65;
}

.br-resource-row__sub {
  font-size: .6875rem;
  color: var(--v2-text-secondary);
  margin-top: 2px;
}

.br-resource-row__qty {
  font-size: .875rem;
  font-weight: 800;
  color: var(--v2-text);
}

.br-profit-preview {
  background: rgba(0,0,0,.2);
  border: 1px solid var(--v2-active);
  border-radius: 8px;
  padding: .5rem .75rem;
  display: flex;
  flex-direction: column;
  gap: .25rem;
}

.br-profit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: .8125rem;
  color: var(--v2-text-secondary);
}

.br-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: .625rem 1rem;
  border-radius: 10px;
  background: var(--v2-border-med);
  border: 1px solid var(--v2-border-strong);
  color: var(--v2-text);
  font-size: .875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .18s;
  width: 100%;
}

.br-submit-btn:hover:not(:disabled) { background: var(--v2-border-strong); }
.br-submit-btn:disabled { opacity: .35; cursor: not-allowed; }
.br-submit-btn--secondary { width: auto; justify-content: flex-start; }

.br-builder-actions {
  display: grid;
  grid-template-columns: auto minmax(220px, 1fr);
  gap: .625rem;
  align-items: center;
}

@media (max-width: 640px) {
  .br-builder-actions {
    grid-template-columns: 1fr;
  }

  .br-builder-actions .br-submit-btn--secondary {
    width: 100%;
    justify-content: center;
  }
}

.br-log-empty {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--v2-text-muted);
  font-size: .9375rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .25rem;
}

.br-log-empty--compact {
  padding: 1rem;
  margin-top: .75rem;
  margin-bottom: .875rem;
  border: 1px dashed var(--v2-active);
  border-radius: 12px;
}

.br-log-scroll {
  display: flex;
  flex-direction: column;
  gap: .625rem;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

.br-entry {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 12px;
  padding: .875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: .625rem;
}

.br-entry:hover { border-color: var(--v2-border-strong); }
.br-entry__header { display: flex; align-items: flex-start; gap: .75rem; }
.br-entry__meta { flex: 1; min-width: 0; }
.br-entry__name { font-size: .9375rem; font-weight: 700; color: var(--v2-text); }
.br-entry__sub { font-size: .6875rem; color: var(--v2-text-secondary); margin-top: 1px; }
.br-entry__date { font-size: .6875rem; color: var(--v2-text-secondary); margin-top: 3px; }

.br-entry__del {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--v2-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 5px;
  transition: all .15s;
}

.br-entry__del:hover { color: #f87171; background: rgba(248,113,113,.1); }

.br-entry__prices {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .5rem;
}

@media (max-width: 640px) {
  .br-entry__prices { grid-template-columns: 1fr; }
}

.br-price-cell { padding: .5rem .625rem; border-radius: 8px; text-align: center; }
.br-price-cell--craft { background: var(--v2-hover); border: 1px solid var(--v2-border-med); }
.br-price-cell--hdv { background: rgba(96,165,250,.06); border: 1px solid rgba(96,165,250,.15); }
.br-price-cell--rune { background: var(--v2-hover); border: 1px solid var(--v2-border-med); }
.br-price-cell__lbl { font-size: .625rem; color: var(--v2-text-dim); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px; }
.br-price-cell__val { font-size: .9375rem; font-weight: 700; color: var(--v2-text); }

.br-entry__profits { display: flex; flex-wrap: wrap; gap: .375rem; }

.br-profit-pill {
  display: flex;
  align-items: center;
  gap: .3125rem;
  padding: .3125rem .625rem;
  border-radius: 999px;
  font-size: .75rem;
  font-weight: 600;
}

.br-profit-pill--pos { background: rgba(52,211,153,.1); color: #34d399; border: 1px solid rgba(52,211,153,.22); }
.br-profit-pill--neg { background: rgba(248,113,113,.1); color: #f87171; border: 1px solid rgba(248,113,113,.22); }
.br-profit--up { color: #86efac; }
.br-profit--down { color: #fca5a5; }

.br-session-items {
  display: flex;
  flex-direction: column;
  gap: .375rem;
}

.br-session-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  padding: .5rem .625rem;
  border-radius: 8px;
  background: rgba(0,0,0,.15);
  border: 1px solid var(--v2-active);
}

@media (max-width: 640px) {
  .br-session-item-row {
    flex-direction: column;
    align-items: stretch;
  }
}

.br-session-item-row__meta {
  display: flex;
  align-items: center;
  gap: .625rem;
  min-width: 0;
}

.br-session-item-row__img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  flex-shrink: 0;
}

.br-session-item-row__name { font-size: .8125rem; font-weight: 700; color: var(--v2-text); }
.br-session-item-row__sub { font-size: .6875rem; color: var(--v2-text-secondary); margin-top: 2px; }
.br-session-item-row__profit { font-size: .8125rem; font-weight: 700; flex-shrink: 0; }
.br-entry__notes { font-size: .75rem; color: var(--v2-text-secondary); font-style: italic; }
</style>
