<template>
  <div>
    <div v-if="!hasContext" class="v2-no-context">
      <div class="v2-no-context__icon">
        <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div class="v2-no-context__title">{{ $t('v2.common.noCharacterTitle') }}</div>
      <div class="v2-no-context__desc">{{ $t('v2.crafting.noCharacterDesc') }}</div>
    </div>

    <template v-else>
      <div class="cf-stats">
        <div class="cf-stat">
          <div class="cf-stat__label">{{ $t('v2.crafting.stats.sessions') }}</div>
          <div class="cf-stat__value">{{ sessions.length }}</div>
        </div>
        <div class="cf-stat">
          <div class="cf-stat__label">{{ $t('v2.crafting.stats.itemsLogged') }}</div>
          <div class="cf-stat__value">{{ totalItemsLogged }}</div>
        </div>
        <div class="cf-stat">
          <div class="cf-stat__label">{{ $t('v2.crafting.stats.invested') }}</div>
          <div class="cf-stat__value">{{ formatKamas(totalInvested) }}</div>
        </div>
        <div class="cf-stat">
          <div class="cf-stat__label">{{ $t('v2.crafting.stats.realized') }}</div>
          <div class="cf-stat__value">{{ formatKamas(totalRealized) }}</div>
        </div>
        <div class="cf-stat" :class="totalProfit >= 0 ? 'cf-stat--pos' : 'cf-stat--neg'">
          <div class="cf-stat__label">{{ $t('v2.crafting.stats.netPL') }}</div>
          <div class="cf-stat__value">{{ totalProfit >= 0 ? '+' : '' }}{{ formatKamas(totalProfit) }}</div>
        </div>
      </div>

      <template v-if="!isEditorOpen">
        <div class="cf-layout cf-layout--single">
          <div class="cf-panel">
            <div class="cf-panel__title">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ $t('v2.crafting.index.createSession') }}
            </div>
            <div class="cf-empty-box">
              {{ $t('v2.crafting.index.createSessionDesc') }}
            </div>
            <button class="cf-btn cf-btn--primary cf-btn--wide" @click="startNewSession">
              {{ $t('v2.crafting.actions.newSession') }}
            </button>
          </div>

          <div class="cf-panel">
            <div class="cf-panel__title">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ $t('v2.crafting.index.sessions') }}
              <span class="cf-badge">{{ sessions.length }}</span>
            </div>

            <div v-if="sessions.length === 0" class="cf-empty-box">
              {{ $t('v2.crafting.index.emptySessions') }}
            </div>

            <div v-else class="cf-history">
              <div v-for="session in sessions" :key="session.id" class="cf-history-card">
                <div class="cf-history-card__head">
                  <div>
                    <div class="cf-history-card__name">{{ sessionTitle(session) }}</div>
                    <div class="cf-history-card__sub">{{ formatDisplayDate(session.date) }} · {{ formatWorkflowLabel(session.workflow) }} · {{ t('v2.crafting.index.itemsCount', { count: session.items.length }) }}</div>
                  </div>
                  <div class="cf-history-card__actions">
                    <button class="cf-btn cf-btn--ghost" @click="openSessionEditor(session.id)">
                      {{ $t('v2.crafting.actions.edit') }}
                    </button>
                    <button class="cf-btn cf-btn--ghost" @click="toggleSession(session.id)">
                      {{ isSessionExpanded(session.id) ? $t('v2.crafting.actions.hideDetails') : $t('v2.crafting.actions.showDetails') }}
                    </button>
                    <button class="cf-icon-btn" :title="$t('v2.crafting.actions.deleteSession')" @click="deleteSession(session.id)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="cf-history-card__stats">
                  <div class="cf-mini-stat">
                    <div class="cf-mini-stat__label">{{ $t('v2.crafting.stats.invested') }}</div>
                    <div class="cf-mini-stat__value">{{ formatKamas(sessionTotals(session).invested) }}</div>
                  </div>
                  <div class="cf-mini-stat">
                    <div class="cf-mini-stat__label">{{ $t('v2.crafting.stats.realized') }}</div>
                    <div class="cf-mini-stat__value">{{ formatKamas(sessionTotals(session).realized) }}</div>
                  </div>
                  <div class="cf-mini-stat">
                    <div class="cf-mini-stat__label">{{ $t('v2.crafting.stats.expected') }}</div>
                    <div class="cf-mini-stat__value">{{ formatKamas(sessionTotals(session).expected) }}</div>
                  </div>
                  <div class="cf-mini-stat">
                    <div class="cf-mini-stat__label">{{ $t('v2.crafting.stats.assets') }}</div>
                    <div class="cf-mini-stat__value">{{ formatKamas(sessionTotals(session).currentAssets) }}</div>
                  </div>
                  <div class="cf-mini-stat">
                    <div class="cf-mini-stat__label">{{ $t('v2.crafting.stats.bankrollDelta') }}</div>
                    <div class="cf-mini-stat__value" :class="sessionTotals(session).bankrollDelta >= 0 ? 'cf-profit--up' : 'cf-profit--down'">
                      {{ sessionTotals(session).bankrollDelta >= 0 ? '+' : '' }}{{ formatKamas(sessionTotals(session).bankrollDelta) }}
                    </div>
                  </div>
                </div>

                <div v-if="isSessionExpanded(session.id)" class="cf-session-items">
                  <div v-for="item in session.items" :key="item.id" class="cf-session-item">
                    <div class="cf-session-item__head">
                      <div class="cf-draft-card__meta">
                        <img :src="getItemImg(item.item)" :alt="item.item?.name?.fr ?? ''" class="cf-draft-card__img" @error="onImgErr" />
                        <div>
                          <div class="cf-draft-card__name">{{ item.item?.name?.fr ?? item.itemId }}</div>
                          <div class="cf-draft-card__sub">{{ formatTargetModeLabel(item.targetMode) }} · {{ formatOutcomeLabel(item.outcome) }}</div>
                        </div>
                      </div>
                      <div class="cf-session-item__profit" :class="itemProfit(item) >= 0 ? 'cf-profit--up' : 'cf-profit--down'">
                        {{ itemProfit(item) >= 0 ? '+' : '' }}{{ formatKamas(itemProfit(item)) }}
                      </div>
                    </div>

                    <div class="cf-session-item__summary">
                      <span>{{ $t('v2.crafting.summary.craft') }} {{ formatKamas(itemCraftCost(item)) }}</span>
                      <span>{{ $t('v2.crafting.summary.fm') }} {{ formatKamas(itemFmCost(item)) }}</span>
                      <span v-if="item.listedPrice > 0">{{ $t('v2.crafting.summary.list') }} {{ formatKamas(item.listedPrice) }}</span>
                      <span>{{ $t('v2.crafting.summary.realized') }} {{ formatKamas(itemRealized(item)) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="cf-layout cf-layout--single">
        <div class="cf-panel">
          <div class="cf-panel__title">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0l-4-4m4 4l-4 4" />
            </svg>
            {{ editingSessionId && editingSessionId !== '__new__' ? $t('v2.crafting.editor.editSession') : $t('v2.crafting.editor.newSession') }}
          </div>

          <div class="cf-history-card__actions cf-history-card__actions--top">
            <button class="cf-btn cf-btn--ghost" @click="closeEditor">
              {{ $t('v2.crafting.actions.backToSessions') }}
            </button>
          </div>

          <div class="cf-form-grid">
            <div class="cf-field">
                <label class="cf-field__label">{{ $t('v2.crafting.fields.date') }}</label>
              <V2DateInput v-model="draftSession.date" />
            </div>
            <div class="cf-field">
                <label class="cf-field__label">{{ $t('v2.crafting.fields.workflow') }}</label>
                <V2Select v-model="draftSession.workflow" :options="workflowOptions" :placeholder="$t('v2.crafting.placeholders.selectWorkflow')" />
            </div>
            <div class="cf-field">
                <label class="cf-field__label">{{ $t('v2.crafting.fields.sessionFocus') }}</label>
                <V2Select v-model="draftSession.focus" :options="focusOptions" :placeholder="$t('v2.crafting.placeholders.selectFocus')" />
            </div>
            <div class="cf-field cf-field--full">
                <label class="cf-field__label">{{ $t('v2.crafting.fields.notes') }}</label>
              <input
                v-model="draftSession.notes"
                type="text"
                class="cf-input"
                  :placeholder="$t('v2.crafting.placeholders.sessionNotes')"
              />
            </div>
          </div>

          <div class="cf-targets">
              <div class="cf-panel__subtitle">{{ $t('v2.crafting.sections.sessionBankroll') }}</div>
            <div class="cf-form-grid">
              <div class="cf-field">
                  <label class="cf-field__label">{{ $t('v2.crafting.fields.startingKamas') }}</label>
                <input v-model.number="draftSession.startingKamas" type="number" min="0" step="1000" class="cf-input" />
              </div>
              <div class="cf-field">
                  <label class="cf-field__label">{{ $t('v2.crafting.fields.currentKamas') }}</label>
                <input v-model.number="draftSession.currentKamas" type="number" min="0" step="1000" class="cf-input" />
              </div>
              <div class="cf-field">
                  <label class="cf-field__label">{{ $t('v2.crafting.fields.startingRuneStockValue') }}</label>
                <input v-model.number="draftSession.startingRuneStockValue" type="number" min="0" step="1000" class="cf-input" />
              </div>
              <div class="cf-field">
                  <label class="cf-field__label">{{ $t('v2.crafting.fields.currentRuneStockValue') }}</label>
                <input v-model.number="draftSession.currentRuneStockValue" type="number" min="0" step="1000" class="cf-input" />
              </div>
              <div class="cf-field cf-field--full">
                  <label class="cf-field__label">{{ $t('v2.crafting.fields.globalExpenses') }}</label>
                  <input v-model.number="draftSession.sessionExpenses" type="number" min="0" step="1000" class="cf-input" :placeholder="$t('v2.crafting.placeholders.globalExpenses')" />
              </div>
            </div>

            <div class="cf-profit-preview">
              <div class="cf-profit-preview__row">
                  <span>{{ $t('v2.crafting.summary.startingBankroll') }}</span>
                <span>{{ formatKamas(sessionDraftSummary.startingBankroll) }}</span>
              </div>
              <div class="cf-profit-preview__row">
                  <span>{{ $t('v2.crafting.summary.currentAssets') }}</span>
                <span>{{ formatKamas(sessionDraftSummary.currentAssets) }}</span>
              </div>
              <div class="cf-profit-preview__row">
                  <span>{{ $t('v2.crafting.summary.itemsBuiltValue') }}</span>
                <span>{{ formatKamas(sessionDraftSummary.builtItemsValue) }}</span>
              </div>
              <div class="cf-profit-preview__row">
                  <span>{{ $t('v2.crafting.summary.bankrollDelta') }}</span>
                <span :class="sessionDraftSummary.bankrollDelta >= 0 ? 'cf-profit--up' : 'cf-profit--down'">
                  {{ sessionDraftSummary.bankrollDelta >= 0 ? '+' : '' }}{{ formatKamas(sessionDraftSummary.bankrollDelta) }}
                </span>
              </div>
            </div>
          </div>

          <div ref="searchAreaEl" class="cf-search-area">
              <div class="cf-panel__subtitle">{{ $t('v2.crafting.sections.addItems') }}</div>
            <div class="cf-searchbox">
              <svg class="cf-searchbox__icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input v-model="search" type="text" :placeholder="$t('v2.common.searchItems')" class="cf-searchbox__input" @input="onSearchInput" />
              <button v-if="search" class="cf-searchbox__clear" @click="clearSearch">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="searching" class="cf-inline-loader">
              <div class="cf-spin" /> {{ $t('v2.common.searching') }}
            </div>

            <div v-else-if="results.length" class="cf-results">
              <button
                v-for="item in results"
                :key="item.id"
                class="cf-result"
                :class="{ 'cf-result--disabled': draftItemIdSet.has(String(item.id)) }"
                @click="addItemToDraft(item)"
              >
                <img :src="getItemImg(item)" :alt="item.name?.fr ?? ''" class="cf-result__img" @error="onImgErr" />
                <div class="cf-result__body">
                  <div class="cf-result__name">{{ item.name?.fr ?? item.id }}</div>
                  <div class="cf-result__sub">{{ item.type?.name?.fr ?? '' }} · Lv {{ item.level ?? '?' }}</div>
                </div>
                <span class="cf-result__cta">{{ draftItemIdSet.has(String(item.id)) ? $t('v2.crafting.actions.added') : $t('v2.crafting.actions.add') }}</span>
              </button>
            </div>

            <div v-else-if="search && !searching" class="cf-empty-hint">{{ $t('v2.crafting.messages.noItemsFound', { search }) }}</div>
          </div>

          <div v-if="draftItems.length" class="cf-draft-list">
            <div v-for="draftItem in draftItems" :key="draftItem.id" class="cf-draft-card">
              <div class="cf-draft-card__head">
                <div class="cf-draft-card__meta">
                  <img :src="getItemImg(draftItem.item)" :alt="draftItem.item?.name?.fr ?? ''" class="cf-draft-card__img" @error="onImgErr" />
                  <div>
                    <div class="cf-draft-card__name">{{ draftItem.item?.name?.fr ?? draftItem.itemId }}</div>
                    <div class="cf-draft-card__sub">{{ draftItem.item?.type?.name?.fr ?? '' }} · Lv {{ draftItem.item?.level ?? '?' }}</div>
                  </div>
                </div>
                <div class="cf-draft-card__actions">
                  <button class="cf-btn cf-btn--ghost" @click="toggleDraftItem(draftItem.id)">
                    {{ isDraftItemExpanded(draftItem.id) ? $t('v2.crafting.actions.hideDetails') : $t('v2.crafting.actions.editDetails') }}
                  </button>
                  <button class="cf-icon-btn" :title="$t('v2.crafting.actions.removeItem')" @click="removeDraftItem(draftItem.id)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="cf-draft-card__summary">
                <span>{{ formatOutcomeLabel(draftItem.outcome) }}</span>
                <span>{{ $t('v2.crafting.summary.invested') }} {{ formatKamas(itemInvested(draftItem)) }}</span>
                <span>{{ $t('v2.crafting.summary.realized') }} {{ formatKamas(itemRealized(draftItem)) }}</span>
                <span :class="itemProfit(draftItem) >= 0 ? 'cf-profit--up' : 'cf-profit--down'">
                  {{ itemProfit(draftItem) >= 0 ? '+' : '' }}{{ formatKamas(itemProfit(draftItem)) }}
                </span>
              </div>

              <div v-if="isDraftItemExpanded(draftItem.id)" class="cf-draft-card__details">
                <div class="cf-form-grid">
                  <div class="cf-field">
                    <label class="cf-field__label">{{ $t('v2.crafting.fields.acquisition') }}</label>
                    <V2Select v-model="draftItem.acquisitionMode" :options="acquisitionOptions" :placeholder="$t('v2.crafting.placeholders.selectAcquisition')" />
                  </div>
                  <div class="cf-field">
                    <label class="cf-field__label">{{ $t('v2.crafting.fields.craftKamasBefore') }}</label>
                    <input v-model.number="draftItem.craftKamasBefore" type="number" min="0" step="1000" class="cf-input" />
                  </div>
                  <div class="cf-field">
                    <label class="cf-field__label">{{ $t('v2.crafting.fields.craftKamasAfter') }}</label>
                    <input v-model.number="draftItem.craftKamasAfter" type="number" min="0" step="1000" class="cf-input" />
                  </div>
                  <div class="cf-field">
                    <label class="cf-field__label">{{ $t('v2.crafting.fields.craftCost') }}</label>
                    <input :value="formatKamas(itemCraftCost(draftItem))" type="text" class="cf-input" readonly />
                  </div>
                  <div class="cf-field">
                    <label class="cf-field__label">{{ $t('v2.crafting.fields.extraItemExpenses') }}</label>
                    <input v-model.number="draftItem.extraExpenses" type="number" min="0" step="1000" class="cf-input" />
                  </div>
                  <div class="cf-field">
                    <label class="cf-field__label">{{ $t('v2.crafting.fields.targetMode') }}</label>
                    <V2Select v-model="draftItem.targetMode" :options="targetModeOptions" :placeholder="$t('v2.crafting.placeholders.selectTargetMode')" />
                  </div>
                  <div class="cf-field">
                    <label class="cf-field__label">{{ $t('v2.crafting.fields.expectedSellPrice') }}</label>
                    <input v-model.number="draftItem.expectedSalePrice" type="number" min="0" step="1000" class="cf-input" />
                  </div>
                  <div class="cf-field">
                    <label class="cf-field__label">{{ $t('v2.crafting.fields.listPrice') }}</label>
                    <input v-model.number="draftItem.listedPrice" type="number" min="0" step="1000" class="cf-input" />
                  </div>
                  <div class="cf-field">
                    <label class="cf-field__label">{{ $t('v2.crafting.fields.outcome') }}</label>
                    <V2Select v-model="draftItem.outcome" :options="outcomeOptions" :placeholder="$t('v2.crafting.placeholders.selectOutcome')" />
                  </div>
                </div>

                <div class="cf-targets">
                  <div class="cf-panel__subtitle">{{ $t('v2.crafting.sections.fmCost') }}</div>
                  <div class="cf-form-grid">
                    <div class="cf-field">
                      <label class="cf-field__label">{{ $t('v2.crafting.fields.runeValueBeforeFm') }}</label>
                      <input v-model.number="draftItem.runeValueBeforeFm" type="number" min="0" step="1000" class="cf-input" />
                    </div>
                    <div class="cf-field">
                      <label class="cf-field__label">{{ $t('v2.crafting.fields.runePurchases') }}</label>
                      <input v-model.number="draftItem.runePurchases" type="number" min="0" step="1000" class="cf-input" />
                    </div>
                    <div class="cf-field">
                      <label class="cf-field__label">{{ $t('v2.crafting.fields.runeValueAfterFm') }}</label>
                      <input v-model.number="draftItem.runeValueAfterFm" type="number" min="0" step="1000" class="cf-input" />
                    </div>
                    <div class="cf-field">
                      <label class="cf-field__label">{{ $t('v2.crafting.fields.fmCost') }}</label>
                      <input :value="formatKamas(itemFmCost(draftItem))" type="text" class="cf-input" readonly />
                    </div>
                  </div>
                </div>

                <div class="cf-targets">
                  <div class="cf-panel__subtitle">{{ $t('v2.crafting.sections.sale') }}</div>
                  <div class="cf-form-grid">
                    <div class="cf-field">
                      <label class="cf-field__label">{{ $t('v2.crafting.fields.soldPrice') }}</label>
                      <input v-model.number="draftItem.realizedSalePrice" type="number" min="0" step="1000" class="cf-input" />
                    </div>
                    <div class="cf-field">
                      <label class="cf-field__label">{{ $t('v2.crafting.fields.brisageRecovery') }}</label>
                      <input v-model.number="draftItem.brisageRecovery" type="number" min="0" step="1000" class="cf-input" />
                    </div>
                  </div>

                  <div class="cf-profit-preview">
                    <div class="cf-profit-preview__row">
                      <span>{{ $t('v2.crafting.summary.fmCost') }}</span>
                      <span>{{ formatKamas(itemFmCost(draftItem)) }}</span>
                    </div>
                    <div class="cf-profit-preview__row">
                      <span>{{ $t('v2.crafting.summary.totalInvested') }}</span>
                      <span>{{ formatKamas(itemInvested(draftItem)) }}</span>
                    </div>
                    <div class="cf-profit-preview__row">
                      <span>{{ $t('v2.crafting.summary.realizedValue') }}</span>
                      <span>{{ formatKamas(itemRealized(draftItem)) }}</span>
                    </div>
                    <div class="cf-profit-preview__row">
                      <span>{{ $t('v2.crafting.summary.pl') }}</span>
                      <span :class="itemProfit(draftItem) >= 0 ? 'cf-profit--up' : 'cf-profit--down'">
                        {{ itemProfit(draftItem) >= 0 ? '+' : '' }}{{ formatKamas(itemProfit(draftItem)) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="cf-empty-box">
            {{ $t('v2.crafting.editor.emptyDraft') }}
          </div>

          <div class="cf-targets">
            <div class="cf-targets__head">
              <div class="cf-panel__subtitle">{{ $t('v2.crafting.sections.recipeChecklist') }}</div>
              <button class="cf-btn cf-btn--ghost" :disabled="draftItems.length === 0 || recipeChecklistState.isLoading" @click="fetchRecipeChecklist">
                {{ recipeChecklistState.isLoading ? $t('v2.common.loading') : $t('v2.crafting.actions.fetchRecipes') }}
              </button>
            </div>
            <div v-if="recipeChecklistState.error" class="cf-empty-hint">{{ recipeChecklistState.error }}</div>
            <div v-if="draftResourceChecklist.length" class="cf-resource-list">
              <label v-for="resource in draftResourceChecklist" :key="resource.id" class="cf-resource-row">
                <input type="checkbox" :checked="resource.isDone" @change="toggleDraftResourceDone(resource.id)" />
                <img v-if="resource.image" :src="resource.image" :alt="resource.name" class="cf-resource-row__img" @error="onImgErr" />
                <div v-else class="cf-resource-row__img cf-resource-row__img--fallback" />
                <div class="cf-resource-row__meta">
                  <div class="cf-resource-row__name" :class="{ 'cf-resource-row__name--done': resource.isDone }">{{ resource.name }}</div>
                  <div class="cf-resource-row__sub">{{ resource.typeName ?? $t('v2.crafting.common.resource') }}</div>
                </div>
                <div class="cf-resource-row__qty">{{ resource.totalQuantity }}</div>
              </label>
            </div>
          </div>

          <button class="cf-btn cf-btn--primary cf-btn--wide" :disabled="draftItems.length === 0" @click="saveSession">
            {{ editingSessionId && editingSessionId !== '__new__' ? $t('v2.crafting.actions.updateSession') : $t('v2.crafting.actions.saveSession') }}
          </button>
        </div>

        <div class="cf-panel">
          <div class="cf-panel__title">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ $t('v2.crafting.index.sessionHistory') }}
            <span class="cf-badge">{{ sessions.length }}</span>
          </div>

          <div v-if="sessions.length === 0" class="cf-empty-box">
            {{ $t('v2.crafting.index.emptySessions') }}
          </div>

          <div v-else class="cf-history">
            <div v-for="session in sessions" :key="session.id" class="cf-history-card">
              <div class="cf-history-card__head">
                <div>
                  <div class="cf-history-card__name">{{ sessionTitle(session) }}</div>
                    <div class="cf-history-card__sub">{{ formatDisplayDate(session.date) }} · {{ formatWorkflowLabel(session.workflow) }} · {{ t('v2.crafting.index.itemsCount', { count: session.items.length }) }}</div>
                </div>
                <div class="cf-history-card__actions">
                  <button class="cf-btn cf-btn--ghost" @click="openSessionEditor(session.id)">
                    {{ $t('v2.crafting.actions.edit') }}
                  </button>
                  <button class="cf-btn cf-btn--ghost" @click="toggleSession(session.id)">
                    {{ isSessionExpanded(session.id) ? $t('v2.crafting.actions.hideDetails') : $t('v2.crafting.actions.showDetails') }}
                  </button>
                  <button class="cf-icon-btn" :title="$t('v2.crafting.actions.deleteSession')" @click="deleteSession(session.id)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="cf-history-card__stats">
                <div class="cf-mini-stat">
                    <div class="cf-mini-stat__label">{{ $t('v2.crafting.stats.invested') }}</div>
                  <div class="cf-mini-stat__value">{{ formatKamas(sessionTotals(session).invested) }}</div>
                </div>
                <div class="cf-mini-stat">
                    <div class="cf-mini-stat__label">{{ $t('v2.crafting.stats.realized') }}</div>
                  <div class="cf-mini-stat__value">{{ formatKamas(sessionTotals(session).realized) }}</div>
                </div>
                <div class="cf-mini-stat">
                    <div class="cf-mini-stat__label">{{ $t('v2.crafting.stats.expected') }}</div>
                  <div class="cf-mini-stat__value">{{ formatKamas(sessionTotals(session).expected) }}</div>
                </div>
                <div class="cf-mini-stat">
                    <div class="cf-mini-stat__label">{{ $t('v2.crafting.stats.assets') }}</div>
                  <div class="cf-mini-stat__value">{{ formatKamas(sessionTotals(session).currentAssets) }}</div>
                </div>
                <div class="cf-mini-stat">
                    <div class="cf-mini-stat__label">{{ $t('v2.crafting.stats.bankrollDelta') }}</div>
                  <div class="cf-mini-stat__value" :class="sessionTotals(session).bankrollDelta >= 0 ? 'cf-profit--up' : 'cf-profit--down'">
                    {{ sessionTotals(session).bankrollDelta >= 0 ? '+' : '' }}{{ formatKamas(sessionTotals(session).bankrollDelta) }}
                  </div>
                </div>
              </div>

              <div v-if="isSessionExpanded(session.id)" class="cf-session-items">
                <div v-for="item in session.items" :key="item.id" class="cf-session-item">
                  <div class="cf-session-item__head">
                    <div class="cf-draft-card__meta">
                      <img :src="getItemImg(item.item)" :alt="item.item?.name?.fr ?? ''" class="cf-draft-card__img" @error="onImgErr" />
                      <div>
                        <div class="cf-draft-card__name">{{ item.item?.name?.fr ?? item.itemId }}</div>
                        <div class="cf-draft-card__sub">{{ formatTargetModeLabel(item.targetMode) }} · {{ formatOutcomeLabel(item.outcome) }}</div>
                      </div>
                    </div>
                    <div class="cf-session-item__profit" :class="itemProfit(item) >= 0 ? 'cf-profit--up' : 'cf-profit--down'">
                      {{ itemProfit(item) >= 0 ? '+' : '' }}{{ formatKamas(itemProfit(item)) }}
                    </div>
                  </div>

                  <div class="cf-session-item__summary">
                    <span>{{ $t('v2.crafting.summary.craft') }} {{ formatKamas(itemCraftCost(item)) }}</span>
                    <span>{{ $t('v2.crafting.summary.fm') }} {{ formatKamas(itemFmCost(item)) }}</span>
                    <span v-if="item.listedPrice > 0">{{ $t('v2.crafting.summary.list') }} {{ formatKamas(item.listedPrice) }}</span>
                    <span>{{ $t('v2.crafting.summary.realized') }} {{ formatKamas(itemRealized(item)) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { SoldItem } from '~/types/game'

definePageMeta({ layout: 'v2' })
const { t } = useI18n()

type WorkflowMode = 'craft' | 'fm' | 'craft_fm'
type SessionFocus = 'clean' | 'perfect' | 'over' | 'exo' | 'mixed'
type AcquisitionMode = 'crafted' | 'bought' | 'mixed'
type TargetMode = 'clean' | 'perfect' | 'over' | 'exo'
type OutcomeMode = 'in_progress' | 'listed' | 'sold' | 'kept' | 'brisaged' | 'failed'
type AttemptTag = 'setup' | 'upgrade' | 'stabilized' | 'exo_hit' | 'brick' | 'stop'
type TargetPriority = 'ignore' | 'low' | 'normal' | 'high' | 'critical'

const workflowOptions = computed(() => ([
  { key: 'craft', label: t('v2.crafting.options.workflow.craft'), value: 'craft' },
  { key: 'fm', label: t('v2.crafting.options.workflow.fm'), value: 'fm' },
  { key: 'craft_fm', label: t('v2.crafting.options.workflow.craftFm'), value: 'craft_fm' },
]) satisfies Array<{ key: string; label: string; value: WorkflowMode }>)

const focusOptions = computed(() => ([
  { key: 'clean', label: t('v2.crafting.options.focus.clean'), value: 'clean' },
  { key: 'perfect', label: t('v2.crafting.options.focus.perfect'), value: 'perfect' },
  { key: 'over', label: t('v2.crafting.options.focus.over'), value: 'over' },
  { key: 'exo', label: t('v2.crafting.options.focus.exo'), value: 'exo' },
  { key: 'mixed', label: t('v2.crafting.options.focus.mixed'), value: 'mixed' },
]) satisfies Array<{ key: string; label: string; value: SessionFocus }>)

const acquisitionOptions = computed(() => ([
  { key: 'crafted', label: t('v2.crafting.options.acquisition.crafted'), value: 'crafted' },
  { key: 'bought', label: t('v2.crafting.options.acquisition.bought'), value: 'bought' },
  { key: 'mixed', label: t('v2.crafting.options.acquisition.mixed'), value: 'mixed' },
]) satisfies Array<{ key: string; label: string; value: AcquisitionMode }>)

const targetModeOptions = computed(() => ([
  { key: 'clean', label: t('v2.crafting.options.targetMode.clean'), value: 'clean' },
  { key: 'perfect', label: t('v2.crafting.options.targetMode.perfect'), value: 'perfect' },
  { key: 'over', label: t('v2.crafting.options.targetMode.over'), value: 'over' },
  { key: 'exo', label: t('v2.crafting.options.targetMode.exo'), value: 'exo' },
]) satisfies Array<{ key: string; label: string; value: TargetMode }>)

const outcomeOptions = computed(() => ([
  { key: 'in_progress', label: t('v2.crafting.options.outcome.inProgress'), value: 'in_progress' },
  { key: 'listed', label: t('v2.crafting.options.outcome.listed'), value: 'listed' },
  { key: 'sold', label: t('v2.crafting.options.outcome.sold'), value: 'sold' },
  { key: 'kept', label: t('v2.crafting.options.outcome.kept'), value: 'kept' },
  { key: 'brisaged', label: t('v2.crafting.options.outcome.brisaged'), value: 'brisaged' },
  { key: 'failed', label: t('v2.crafting.options.outcome.failed'), value: 'failed' },
]) satisfies Array<{ key: string; label: string; value: OutcomeMode }>)

interface DraftTargetStat {
  id: string
  effectId: number
  label: string
  min: number
  max: number
  baseValue: number
  targetValue: number
  priority: TargetPriority
}

interface DraftAttempt {
  id: string
  date: string
  runeCost: number
  estimatedValue: number
  tag: AttemptTag
  statsNote: string
  notes: string
}

interface RecipeChecklistResource {
  id: number
  name: string
  image: string | null
  typeName: string | null
  totalQuantity: number
  hasRecipe: boolean
  isDone: boolean
}

interface DraftCraftFmItem {
  id: string
  itemId: string | number
  item: any
  acquisitionMode: AcquisitionMode
  craftKamasBefore: number
  craftKamasAfter: number
  extraExpenses: number
  runeValueBeforeFm: number
  runePurchases: number
  runeValueAfterFm: number
  targetMode: TargetMode
  targetSummary: string
  stopRule: string
  expectedSalePrice: number
  listedPrice: number
  realizedSalePrice: number
  brisageRecovery: number
  outcome: OutcomeMode
  notes: string
  targetStats: DraftTargetStat[]
  attempts: DraftAttempt[]
}

interface CraftFmSession {
  id: string
  date: string
  workflow: WorkflowMode
  focus: SessionFocus
  startingKamas: number
  currentKamas: number
  startingRuneStockValue: number
  currentRuneStockValue: number
  sessionExpenses: number
  notes: string
  items: DraftCraftFmItem[]
  resourceChecklist: RecipeChecklistResource[]
}

const LEGACY_CRAFT_TAG = '[Crafted]'

const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()
const { data, init: initStore } = useAppDataStore()

const sessionsKey = computed(() => `craft_fm_sessions_${selectedServer.value?.id}_${selectedCharacter.value?.id}`)

const sessions = ref<CraftFmSession[]>([])
const draftItems = ref<DraftCraftFmItem[]>([])
const expandedDraftItemIds = ref<string[]>([])
const expandedSessionIds = ref<string[]>([])
const editingSessionId = ref<string>('')
const draftResourceChecklist = ref<RecipeChecklistResource[]>([])
const recipeChecklistState = ref({
  hasFetched: false,
  isLoading: false,
  error: '',
})

const draftSession = ref({
  date: todayISO(),
  workflow: 'craft_fm' as WorkflowMode,
  focus: 'mixed' as SessionFocus,
  startingKamas: 0,
  currentKamas: 0,
  startingRuneStockValue: 0,
  currentRuneStockValue: 0,
  sessionExpenses: 0,
  notes: '',
})

const search = ref('')
const searching = ref(false)
const results = ref<any[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

const searchAreaEl = ref<HTMLElement | null>(null)
const isEditorOpen = computed(() => editingSessionId.value === '__new__' || Boolean(editingSessionId.value))

const draftItemIdSet = computed(() => new Set(draftItems.value.map((item) => String(item.itemId))))

const totalItemsLogged = computed(() =>
  sessions.value.reduce((sum, session) => sum + session.items.length, 0),
)

const totalInvested = computed(() =>
  sessions.value.reduce((sum, session) => sum + sessionTotals(session).invested, 0),
)

const totalRealized = computed(() =>
  sessions.value.reduce((sum, session) => sum + sessionTotals(session).realized, 0),
)

const totalProfit = computed(() => totalRealized.value - totalInvested.value)

const effectCache = ref<Record<string, any>>({})

const readEffectCache = () => {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem('craft-fm-effect-cache-v1')
    if (!raw) return
    const parsed = JSON.parse(raw)
    effectCache.value = parsed && typeof parsed === 'object' ? parsed : {}
  }
  catch {
    effectCache.value = {}
  }
}

const writeEffectCache = () => {
  if (!import.meta.client) return
  localStorage.setItem('craft-fm-effect-cache-v1', JSON.stringify(effectCache.value))
}

const saveSessions = () => {
  if (!import.meta.client) return
  localStorage.setItem(sessionsKey.value, JSON.stringify(sessions.value))
}

const createEmptyAttempt = (): DraftAttempt => ({
  id: crypto.randomUUID(),
  date: todayISO(),
  runeCost: 0,
  estimatedValue: 0,
  tag: 'setup',
  statsNote: '',
  notes: '',
})

const formatEffectLabel = (effData: any, eff: any) => {
  let desc = effData?.description?.fr ?? effData?.description?.en ?? `Effet ${eff.effectId ?? eff.id}`
  const from = Number(eff.from ?? eff.value ?? 0)
  const to = Number(eff.to ?? eff.value ?? 0)

  if (from === to) {
    desc = desc
      .replace(/\{[^}]*\}/g, '')
      .replace(/#1/g, String(from))
      .replace(/#2/g, '')
      .trim()
  }
  else {
    desc = desc
      .replace(/#1/g, String(from))
      .replace(/#2/g, String(to))
      .replace(/\{~1~2 ([^}]*)\}/g, '$1')
      .replace(/\{[^}]*\}/g, '')
      .trim()
  }

  return desc.replace(/\s{2,}/g, ' ').trim()
}

const fetchEffect = async (effectId: number) => {
  const cacheKey = String(effectId)
  if (effectCache.value[cacheKey]) return effectCache.value[cacheKey]
  const fetched = await $fetch<any>(`/api/dofusdb/effects/${effectId}`)
  effectCache.value[cacheKey] = fetched
  writeEffectCache()
  return fetched
}

const buildTargetStats = async (item: any): Promise<DraftTargetStat[]> => {
  if (!Array.isArray(item?.effects) || !item.effects.length) return []

  const stats = await Promise.all(
    item.effects.map(async (effect: any, index: number) => {
      const effectId = Number(effect.effectId ?? effect.id ?? 0)
      if (!effectId) return null

      let effectData: any = null
      try {
        effectData = await fetchEffect(effectId)
      }
      catch {
        effectData = null
      }

      const min = Number(effect.from ?? effect.value ?? 0)
      const max = Number(effect.to ?? effect.value ?? 0)

      return {
        id: `${effectId}-${index}`,
        effectId,
        label: formatEffectLabel(effectData, effect),
        min,
        max: max || min,
        baseValue: Number(effect.value ?? effect.from ?? 0),
        targetValue: max || min,
        priority: 'normal' as TargetPriority,
      }
    }),
  )

  return stats.filter(Boolean) as DraftTargetStat[]
}

const buildDraftItem = async (item: any): Promise<DraftCraftFmItem> => ({
  id: crypto.randomUUID(),
  itemId: item.id,
  item,
  acquisitionMode: 'crafted',
  craftKamasBefore: 0,
  craftKamasAfter: 0,
  extraExpenses: 0,
  runeValueBeforeFm: 0,
  runePurchases: 0,
  runeValueAfterFm: 0,
  targetMode: 'clean',
  targetSummary: '',
  stopRule: '',
  expectedSalePrice: 0,
  listedPrice: 0,
  realizedSalePrice: 0,
  brisageRecovery: 0,
  outcome: 'in_progress',
  notes: '',
  targetStats: await buildTargetStats(item),
  attempts: [createEmptyAttempt()],
})

const normalizeAttempt = (value: any): DraftAttempt | null => {
  if (!value?.id) return null
  return {
    id: String(value.id),
    date: String(value.date ?? todayISO()),
    runeCost: Math.max(0, Number(value.runeCost ?? 0) || 0),
    estimatedValue: Math.max(0, Number(value.estimatedValue ?? 0) || 0),
    tag: isAttemptTag(value.tag) ? value.tag : 'setup',
    statsNote: String(value.statsNote ?? ''),
    notes: String(value.notes ?? ''),
  }
}

const normalizeTargetStats = (stats: any): DraftTargetStat[] => {
  if (!Array.isArray(stats)) return []
  return stats
    .map((entry, index) => {
      const effectId = Number(entry?.effectId ?? 0)
      return {
        id: String(entry?.id ?? `${effectId}-${index}`),
        effectId,
        label: String(entry?.label ?? `Stat ${index + 1}`),
        min: Number(entry?.min ?? 0) || 0,
        max: Number(entry?.max ?? entry?.min ?? 0) || 0,
        baseValue: Number(entry?.baseValue ?? 0) || 0,
        targetValue: Number(entry?.targetValue ?? entry?.max ?? entry?.min ?? 0) || 0,
        priority: isTargetPriority(entry?.priority) ? entry.priority : 'normal',
      }
    })
    .filter((entry) => entry.label)
}

const normalizeDraftItem = (value: any): DraftCraftFmItem | null => {
  if (!value?.id || !value?.item) return null
  return {
    id: String(value.id),
    itemId: value.itemId,
    item: value.item,
    acquisitionMode: isAcquisitionMode(value.acquisitionMode) ? value.acquisitionMode : 'crafted',
    craftKamasBefore: Math.max(0, Number(value.craftKamasBefore ?? value.craftCost ?? value.baseCost ?? 0) || 0),
    craftKamasAfter: Math.max(0, Number(value.craftKamasAfter ?? 0) || 0),
    extraExpenses: Math.max(0, Number(value.extraExpenses ?? value.otherCost ?? 0) || 0),
    runeValueBeforeFm: Math.max(0, Number(value.runeValueBeforeFm ?? 0) || 0),
    runePurchases: Math.max(0, Number(value.runePurchases ?? 0) || 0),
    runeValueAfterFm: Math.max(0, Number(value.runeValueAfterFm ?? 0) || 0),
    targetMode: isTargetMode(value.targetMode) ? value.targetMode : 'clean',
    targetSummary: String(value.targetSummary ?? ''),
    stopRule: String(value.stopRule ?? ''),
    expectedSalePrice: Math.max(0, Number(value.expectedSalePrice ?? 0) || 0),
    listedPrice: Math.max(0, Number(value.listedPrice ?? 0) || 0),
    realizedSalePrice: Math.max(0, Number(value.realizedSalePrice ?? 0) || 0),
    brisageRecovery: Math.max(0, Number(value.brisageRecovery ?? 0) || 0),
    outcome: isOutcomeMode(value.outcome) ? value.outcome : 'in_progress',
    notes: String(value.notes ?? ''),
    targetStats: normalizeTargetStats(value.targetStats),
    attempts: Array.isArray(value.attempts)
      ? value.attempts.map(normalizeAttempt).filter(Boolean) as DraftAttempt[]
      : [createEmptyAttempt()],
  }
}

const normalizeRecipeChecklistResource = (value: any): RecipeChecklistResource | null => {
  const id = Number(value?.id ?? 0)
  if (!id) return null
  return {
    id,
    name: String(value?.name ?? `Ingredient #${id}`),
    image: typeof value?.image === 'string' ? value.image : null,
    typeName: typeof value?.typeName === 'string' ? value.typeName : null,
    totalQuantity: Math.max(0, Number(value?.totalQuantity ?? 0) || 0),
    hasRecipe: Boolean(value?.hasRecipe),
    isDone: Boolean(value?.isDone),
  }
}

const normalizeSession = (value: any): CraftFmSession | null => {
  if (!value?.id) return null
  return {
    id: String(value.id),
    date: String(value.date ?? todayISO()),
    workflow: isWorkflowMode(value.workflow) ? value.workflow : 'craft_fm',
    focus: isSessionFocus(value.focus) ? value.focus : 'mixed',
    startingKamas: Math.max(0, Number(value.startingKamas ?? 0) || 0),
    currentKamas: Math.max(0, Number(value.currentKamas ?? 0) || 0),
    startingRuneStockValue: Math.max(0, Number(value.startingRuneStockValue ?? 0) || 0),
    currentRuneStockValue: Math.max(0, Number(value.currentRuneStockValue ?? 0) || 0),
    sessionExpenses: Math.max(0, Number(value.sessionExpenses ?? 0) || 0),
    notes: String(value.notes ?? ''),
    items: Array.isArray(value.items)
      ? value.items.map(normalizeDraftItem).filter(Boolean) as DraftCraftFmItem[]
      : [],
    resourceChecklist: Array.isArray(value.resourceChecklist)
      ? value.resourceChecklist.map(normalizeRecipeChecklistResource).filter(Boolean) as RecipeChecklistResource[]
      : [],
  }
}

const migrateLegacyCrafts = () => {
  const legacyCrafts = [...data.value.sales.items]
    .filter((item: SoldItem) => (
      item.serverId === selectedServer.value?.id &&
      item.characterId === selectedCharacter.value?.id &&
      (item.notes?.startsWith(LEGACY_CRAFT_TAG) ?? false)
    ))
    .sort((a, b) => new Date(b.dateSold).getTime() - new Date(a.dateSold).getTime())

  if (!legacyCrafts.length) return []

  return legacyCrafts.map((craft) => ({
    id: `legacy-${craft.id}`,
    date: craft.dateSold?.slice(0, 10) || todayISO(),
    workflow: 'craft' as WorkflowMode,
    focus: 'clean' as SessionFocus,
    startingKamas: 0,
    currentKamas: 0,
    startingRuneStockValue: 0,
    currentRuneStockValue: 0,
    sessionExpenses: 0,
    notes: extractLegacyNotes(craft.notes),
    items: [{
      id: `legacy-item-${craft.id}`,
      itemId: craft.itemId,
      item: craft.item,
      acquisitionMode: 'crafted' as AcquisitionMode,
      craftKamasBefore: 0,
      craftKamasAfter: 0,
      extraExpenses: 0,
      runeValueBeforeFm: 0,
      runePurchases: 0,
      runeValueAfterFm: 0,
      targetMode: 'clean' as TargetMode,
      targetSummary: craft.customEffects?.map(effect => `${effect.description}: ${effect.customValue}`).join(' · ') ?? '',
      stopRule: '',
      expectedSalePrice: craft.price ?? 0,
      listedPrice: 0,
      realizedSalePrice: craft.price ?? 0,
      brisageRecovery: 0,
      outcome: 'sold' as OutcomeMode,
      notes: extractLegacyNotes(craft.notes),
      targetStats: [],
      attempts: [],
    }],
    resourceChecklist: [],
  }))
}

const loadData = () => {
  if (!import.meta.client || !hasContext.value) return

  draftItems.value = []
  expandedDraftItemIds.value = []
  draftResourceChecklist.value = []
  recipeChecklistState.value = { hasFetched: false, isLoading: false, error: '' }

  const raw = localStorage.getItem(sessionsKey.value)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      sessions.value = Array.isArray(parsed)
        ? parsed.map(normalizeSession).filter(Boolean) as CraftFmSession[]
        : []
      saveSessions()
      return
    }
    catch {
      sessions.value = []
    }
  }

  sessions.value = migrateLegacyCrafts()
  saveSessions()
}

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(doSearch, 350)
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
        lang: 'fr',
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
  results.value = []
}

const addItemToDraft = async (item: any) => {
  const existing = draftItems.value.find((entry) => String(entry.itemId) === String(item?.id))
  if (existing) {
    if (!expandedDraftItemIds.value.includes(existing.id)) {
      expandedDraftItemIds.value = [...expandedDraftItemIds.value, existing.id]
    }
    clearSearch()
    return
  }

  const nextItem = await buildDraftItem(item)
  draftItems.value.unshift(nextItem)
  expandedDraftItemIds.value = [...new Set([nextItem.id, ...expandedDraftItemIds.value])]
  clearSearch()
}

const removeDraftItem = (id: string) => {
  draftItems.value = draftItems.value.filter((item) => item.id !== id)
  expandedDraftItemIds.value = expandedDraftItemIds.value.filter((currentId) => currentId !== id)
}

const isDraftItemExpanded = (id: string) => expandedDraftItemIds.value.includes(id)

const toggleDraftItem = (id: string) => {
  expandedDraftItemIds.value = isDraftItemExpanded(id)
    ? expandedDraftItemIds.value.filter((currentId) => currentId !== id)
    : [...expandedDraftItemIds.value, id]
}

const isSessionExpanded = (id: string) => expandedSessionIds.value.includes(id)

const toggleSession = (id: string) => {
  expandedSessionIds.value = isSessionExpanded(id)
    ? expandedSessionIds.value.filter((currentId) => currentId !== id)
    : [...expandedSessionIds.value, id]
}

const itemCraftCost = (item: DraftCraftFmItem) =>
  Math.max(0, (Number(item.craftKamasBefore) || 0) - (Number(item.craftKamasAfter) || 0))

const itemFmCost = (item: DraftCraftFmItem) =>
  Math.max(0, (Number(item.runeValueBeforeFm) || 0) + (Number(item.runePurchases) || 0) - (Number(item.runeValueAfterFm) || 0))

const itemInvested = (item: DraftCraftFmItem) =>
  itemCraftCost(item)
  + Math.max(0, Number(item.extraExpenses) || 0)
  + itemFmCost(item)

const itemRealized = (item: DraftCraftFmItem) =>
  Math.max(0, Number(item.realizedSalePrice) || 0) + Math.max(0, Number(item.brisageRecovery) || 0)

const itemExpected = (item: DraftCraftFmItem) => {
  if (item.outcome === 'sold' || item.outcome === 'brisaged') return itemRealized(item)
  if (item.outcome === 'listed') return Math.max(0, Number(item.listedPrice) || 0)
  return Math.max(0, Number(item.expectedSalePrice) || 0)
}

const itemProfit = (item: DraftCraftFmItem) => itemRealized(item) - itemInvested(item)

const sessionTotals = (session: CraftFmSession) => {
  const invested = session.items.reduce((sum, item) => sum + itemInvested(item), 0)
  const realized = session.items.reduce((sum, item) => sum + itemRealized(item), 0)
  const expected = session.items.reduce((sum, item) => sum + itemExpected(item), 0)
  const startingBankroll = (Number(session.startingKamas) || 0) + (Number(session.startingRuneStockValue) || 0)
  const currentAssets = (Number(session.currentKamas) || 0) + (Number(session.currentRuneStockValue) || 0) + expected
  return {
    invested,
    realized,
    expected,
    startingBankroll,
    currentAssets,
    bankrollDelta: currentAssets - startingBankroll - (Number(session.sessionExpenses) || 0),
    profit: realized - invested,
  }
}

const sessionDraftSummary = computed(() => {
  const builtItemsValue = draftItems.value.reduce((sum, item) => sum + itemExpected(item), 0)
  const startingBankroll = (Number(draftSession.value.startingKamas) || 0) + (Number(draftSession.value.startingRuneStockValue) || 0)
  const currentAssets =
    (Number(draftSession.value.currentKamas) || 0)
    + (Number(draftSession.value.currentRuneStockValue) || 0)
    + builtItemsValue

  return {
    startingBankroll,
    currentAssets,
    builtItemsValue,
    bankrollDelta: currentAssets - startingBankroll - (Number(draftSession.value.sessionExpenses) || 0),
  }
})

const resetDraft = () => {
  draftItems.value = []
  expandedDraftItemIds.value = []
  draftResourceChecklist.value = []
  recipeChecklistState.value = { hasFetched: false, isLoading: false, error: '' }
  draftSession.value = {
    date: todayISO(),
    workflow: 'craft_fm',
    focus: 'mixed',
    startingKamas: 0,
    currentKamas: 0,
    startingRuneStockValue: 0,
    currentRuneStockValue: 0,
    sessionExpenses: 0,
    notes: '',
  }
  clearSearch()
}

const startNewSession = () => {
  editingSessionId.value = '__new__'
  resetDraft()
}

const closeEditor = () => {
  editingSessionId.value = ''
  resetDraft()
}

const saveSession = () => {
  if (!draftItems.value.length) return

  const sessionId = editingSessionId.value && editingSessionId.value !== '__new__'
    ? editingSessionId.value
    : crypto.randomUUID()

  const nextSession: CraftFmSession = {
    id: sessionId,
    date: draftSession.value.date || todayISO(),
    workflow: draftSession.value.workflow,
    focus: draftSession.value.focus,
    startingKamas: Math.max(0, Number(draftSession.value.startingKamas) || 0),
    currentKamas: Math.max(0, Number(draftSession.value.currentKamas) || 0),
    startingRuneStockValue: Math.max(0, Number(draftSession.value.startingRuneStockValue) || 0),
    currentRuneStockValue: Math.max(0, Number(draftSession.value.currentRuneStockValue) || 0),
    sessionExpenses: Math.max(0, Number(draftSession.value.sessionExpenses) || 0),
    notes: draftSession.value.notes.trim(),
    items: draftItems.value.map((item) => ({
      id: item.id,
      itemId: item.itemId,
      item: item.item,
      acquisitionMode: item.acquisitionMode,
      craftKamasBefore: Math.max(0, Number(item.craftKamasBefore) || 0),
      craftKamasAfter: Math.max(0, Number(item.craftKamasAfter) || 0),
      extraExpenses: Math.max(0, Number(item.extraExpenses) || 0),
      runeValueBeforeFm: Math.max(0, Number(item.runeValueBeforeFm) || 0),
      runePurchases: Math.max(0, Number(item.runePurchases) || 0),
      runeValueAfterFm: Math.max(0, Number(item.runeValueAfterFm) || 0),
      targetMode: item.targetMode,
      targetSummary: item.targetSummary.trim(),
      stopRule: item.stopRule.trim(),
      expectedSalePrice: Math.max(0, Number(item.expectedSalePrice) || 0),
      listedPrice: Math.max(0, Number(item.listedPrice) || 0),
      realizedSalePrice: Math.max(0, Number(item.realizedSalePrice) || 0),
      brisageRecovery: Math.max(0, Number(item.brisageRecovery) || 0),
      outcome: item.outcome,
      notes: item.notes.trim(),
      targetStats: item.targetStats.map((stat) => ({
        ...stat,
        targetValue: Number(stat.targetValue) || 0,
      })),
      attempts: item.attempts.map((attempt) => ({
        id: attempt.id,
        date: attempt.date || todayISO(),
        runeCost: Math.max(0, Number(attempt.runeCost) || 0),
        estimatedValue: Math.max(0, Number(attempt.estimatedValue) || 0),
        tag: attempt.tag,
        statsNote: attempt.statsNote.trim(),
        notes: attempt.notes.trim(),
      })),
    })),
    resourceChecklist: draftResourceChecklist.value.map((resource) => ({ ...resource })),
  }

  const existingIndex = sessions.value.findIndex(session => session.id === sessionId)
  if (existingIndex >= 0) sessions.value[existingIndex] = nextSession
  else sessions.value.unshift(nextSession)

  saveSessions()
  closeEditor()
}

const deleteSession = (id: string) => {
  sessions.value = sessions.value.filter((session) => session.id !== id)
  saveSessions()
}

const openSessionEditor = (id: string) => {
  const session = sessions.value.find(entry => entry.id === id)
  if (!session) return

  editingSessionId.value = id
  draftSession.value = {
    date: session.date || todayISO(),
    workflow: session.workflow,
    focus: session.focus,
    startingKamas: Math.max(0, Number(session.startingKamas) || 0),
    currentKamas: Math.max(0, Number(session.currentKamas) || 0),
    startingRuneStockValue: Math.max(0, Number(session.startingRuneStockValue) || 0),
    currentRuneStockValue: Math.max(0, Number(session.currentRuneStockValue) || 0),
    sessionExpenses: Math.max(0, Number(session.sessionExpenses) || 0),
    notes: session.notes || '',
  }

  draftItems.value = session.items.map(item => ({
    ...item,
    targetStats: item.targetStats.map(stat => ({ ...stat })),
    attempts: item.attempts.map(attempt => ({ ...attempt })),
  }))
  draftResourceChecklist.value = session.resourceChecklist.map(resource => ({ ...resource }))
  expandedDraftItemIds.value = draftItems.value.map(item => item.id)
  recipeChecklistState.value = {
    hasFetched: draftResourceChecklist.value.length > 0,
    isLoading: false,
    error: '',
  }
}

const fetchRecipeChecklist = async () => {
  if (!draftItems.value.length) {
    draftResourceChecklist.value = []
    recipeChecklistState.value = { hasFetched: false, isLoading: false, error: 'Add items first.' }
    return
  }

  recipeChecklistState.value = { hasFetched: true, isLoading: true, error: '' }

  try {
    const existingChecks = new Map<number, boolean>(
      draftResourceChecklist.value.map((resource) => [resource.id, resource.isDone]),
    )
    const ingredientMap = new Map<number, RecipeChecklistResource>()

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

      recipe.ingredientIds.forEach((ingredientId: number, index: number) => {
        const ingredient = recipe.ingredients?.find((candidate: any) => candidate.id === ingredientId)
        const totalQuantity = Number(recipe.quantities?.[index] ?? 0) || 0
        const existing = ingredientMap.get(ingredientId)

        if (existing) {
          existing.totalQuantity += totalQuantity
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
  draftResourceChecklist.value = draftResourceChecklist.value.map((resource) =>
    resource.id === resourceId
      ? { ...resource, isDone: !resource.isDone }
      : resource,
  )
}

const draftRecipeSignature = computed(() =>
  JSON.stringify(
    draftItems.value.map((item) => ({
      itemId: item.itemId,
    })),
  ),
)

const sessionTitle = (session: CraftFmSession) => {
  const first = session.items[0]
  if (!first) return 'Empty session'
  if (session.items.length === 1) return first.item?.name?.fr ?? String(first.itemId)
  return `${first.item?.name?.fr ?? first.itemId} + ${session.items.length - 1} more`
}

const formatWorkflowLabel = (value: WorkflowMode) =>
  value === 'craft' ? 'Craft'
    : value === 'fm' ? 'FM'
      : 'Craft + FM'

const formatAttemptTag = (value: AttemptTag) =>
  value === 'exo_hit' ? 'Exo hit'
    : value.charAt(0).toUpperCase() + value.slice(1)

const formatTargetModeLabel = (value: TargetMode) =>
  value === 'clean' ? 'Clean resale'
    : value === 'perfect' ? 'Near perfect'
      : value === 'over' ? 'Overmage'
        : 'Exo'

const formatOutcomeLabel = (value: OutcomeMode) =>
  value === 'in_progress' ? 'In progress'
    : value === 'listed' ? 'Listed'
      : value === 'sold' ? 'Sold'
        : value === 'kept' ? 'Kept'
          : value === 'brisaged' ? 'Brisaged'
            : 'Failed'

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

const formatDisplayDate = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })
}

function todayISO() {
  const date = new Date()
  return date.toISOString().slice(0, 10)
}

const extractLegacyNotes = (value: string | null) =>
  String(value ?? '').replace(LEGACY_CRAFT_TAG, '').trim()

const isWorkflowMode = (value: unknown): value is WorkflowMode =>
  value === 'craft' || value === 'fm' || value === 'craft_fm'

const isSessionFocus = (value: unknown): value is SessionFocus =>
  value === 'clean' || value === 'perfect' || value === 'over' || value === 'exo' || value === 'mixed'

const isAcquisitionMode = (value: unknown): value is AcquisitionMode =>
  value === 'crafted' || value === 'bought' || value === 'mixed'

const isTargetMode = (value: unknown): value is TargetMode =>
  value === 'clean' || value === 'perfect' || value === 'over' || value === 'exo'

const isOutcomeMode = (value: unknown): value is OutcomeMode =>
  value === 'in_progress' || value === 'listed' || value === 'sold' || value === 'kept' || value === 'brisaged' || value === 'failed'

const isAttemptTag = (value: unknown): value is AttemptTag =>
  value === 'setup' || value === 'upgrade' || value === 'stabilized' || value === 'exo_hit' || value === 'brick' || value === 'stop'

const isTargetPriority = (value: unknown): value is TargetPriority =>
  value === 'ignore' || value === 'low' || value === 'normal' || value === 'high' || value === 'critical'

const onDocMousedown = (event: MouseEvent) => {
  const target = event.target as Node
  if (searchAreaEl.value && !searchAreaEl.value.contains(target)) {
    results.value = []
  }
}

watch(draftRecipeSignature, async () => {
  if (!draftItems.value.length) {
    draftResourceChecklist.value = []
    recipeChecklistState.value = { hasFetched: false, isLoading: false, error: '' }
    return
  }

  if (!recipeChecklistState.value.hasFetched || recipeChecklistState.value.isLoading) return
  await fetchRecipeChecklist()
})

watch([selectedServer, selectedCharacter], loadData)

onMounted(() => {
  initContext()
  initStore()
  readEffectCache()
  loadData()
  document.addEventListener('mousedown', onDocMousedown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocMousedown)
})
</script>

<style scoped>
.cf-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: .75rem;
  margin-bottom: 1rem;
}

@media (max-width: 960px) {
  .cf-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 520px) {
  .cf-stats { grid-template-columns: 1fr; }
}

.cf-stat {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px;
  padding: .95rem 1rem;
}

.cf-stat--pos { border-color: rgba(52,211,153,.35); }
.cf-stat--neg { border-color: rgba(248,113,113,.35); }
.cf-stat__label {
  font-size: .6875rem;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--v2-text-dim);
  font-weight: 700;
}

.cf-stat__value {
  margin-top: .3rem;
  font-size: 1.25rem;
  color: var(--v2-text);
  font-weight: 800;
}

.cf-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr);
  gap: 1rem;
  align-items: start;
}

.cf-layout--single {
  grid-template-columns: 1fr;
}

@media (max-width: 980px) {
  .cf-layout { grid-template-columns: 1fr; }
}

.cf-panel {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 16px;
  padding: 1rem;
}

.cf-panel__title {
  display: flex;
  align-items: center;
  gap: .5rem;
  color: var(--v2-accent);
  font-size: .95rem;
  font-weight: 700;
  margin-bottom: .9rem;
}

.cf-panel__subtitle {
  font-size: .75rem;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--v2-text-dim);
  font-weight: 700;
}

.cf-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .75rem;
}

@media (max-width: 760px) {
  .cf-form-grid { grid-template-columns: 1fr; }
}

.cf-field--full { grid-column: 1 / -1; }

.cf-field__label {
  display: block;
  font-size: .6875rem;
  color: var(--v2-text-secondary);
  font-weight: 600;
  margin-bottom: .35rem;
}

.cf-input {
  width: 100%;
  background: rgba(0,0,0,.25);
  border: 1px solid var(--v2-border-med);
  border-radius: 10px;
  padding: .5rem .75rem;
  color: var(--v2-text);
  font-size: .875rem;
  outline: none;
}

.cf-input:focus { border-color: var(--v2-border-focus); }
.cf-input--small { min-width: 110px; }

.cf-search-area {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--v2-border-subtle);
}

.cf-searchbox {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: .55rem;
}

.cf-searchbox__icon {
  position: absolute;
  left: .75rem;
  color: var(--v2-text-muted);
  pointer-events: none;
}

.cf-searchbox__input {
  width: 100%;
  padding: .55rem 2.2rem;
  background: rgba(0,0,0,.25);
  border: 1px solid var(--v2-border-med);
  border-radius: 10px;
  color: var(--v2-text);
  outline: none;
}

.cf-searchbox__input:focus { border-color: var(--v2-border-focus); }
.cf-searchbox__clear {
  position: absolute;
  right: .6rem;
  background: none;
  border: none;
  color: var(--v2-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
}

.cf-inline-loader,
.cf-empty-hint {
  font-size: .8125rem;
  color: var(--v2-text-secondary);
  margin-top: .6rem;
}

.cf-inline-loader {
  display: flex;
  align-items: center;
  gap: .45rem;
}

.cf-spin {
  width: 15px;
  height: 15px;
  border: 2px solid var(--v2-border-med);
  border-top-color: var(--v2-accent);
  border-radius: 50%;
  animation: cf-spin .8s linear infinite;
}

@keyframes cf-spin {
  to { transform: rotate(360deg); }
}

.cf-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 230px;
  overflow-y: auto;
  margin-top: .65rem;
}

.cf-result {
  display: flex;
  align-items: center;
  gap: .65rem;
  background: rgba(0,0,0,.16);
  border: 1px solid transparent;
  border-radius: 10px;
  padding: .5rem .65rem;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.cf-result:hover { border-color: var(--v2-border-med); }
.cf-result--disabled { opacity: .7; }
.cf-result__img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  flex-shrink: 0;
}

.cf-result__body { min-width: 0; flex: 1; }
.cf-result__name {
  font-size: .8125rem;
  font-weight: 600;
  color: var(--v2-text);
}

.cf-result__sub {
  font-size: .6875rem;
  color: var(--v2-text-muted);
}

.cf-result__cta {
  font-size: .6875rem;
  font-weight: 700;
  color: var(--v2-accent);
}

.cf-draft-list,
.cf-history {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  margin-top: 1rem;
}

.cf-draft-card,
.cf-history-card,
.cf-targets,
.cf-empty-box {
  background: rgba(0,0,0,.14);
  border: 1px solid var(--v2-border-subtle);
  border-radius: 14px;
  padding: .9rem;
}

.cf-empty-box {
  color: var(--v2-text-muted);
  font-size: .875rem;
}

.cf-draft-card__head,
.cf-history-card__head,
.cf-session-item__head,
.cf-attempt-card__head,
.cf-targets__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
}

.cf-draft-card__meta {
  display: flex;
  align-items: center;
  gap: .75rem;
  min-width: 0;
}

.cf-draft-card__img,
.cf-resource-row__img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}

.cf-resource-row__img--fallback {
  background: rgba(255,255,255,.05);
  border-radius: 8px;
}

.cf-draft-card__name,
.cf-history-card__name {
  font-size: .95rem;
  color: var(--v2-text);
  font-weight: 700;
}

.cf-draft-card__sub,
.cf-history-card__sub,
.cf-session-item__note,
.cf-resource-row__sub,
.cf-attempt-timeline__note {
  font-size: .75rem;
  color: var(--v2-text-secondary);
}

.cf-draft-card__actions,
.cf-history-card__actions {
  display: flex;
  align-items: center;
  gap: .45rem;
}

.cf-history-card__actions--top {
  margin-bottom: .9rem;
}

.cf-btn,
.cf-icon-btn {
  border: 1px solid var(--v2-border-med);
  background: rgba(0,0,0,.18);
  color: var(--v2-text);
  cursor: pointer;
}

.cf-btn {
  border-radius: 999px;
  padding: .42rem .72rem;
  font-size: .75rem;
  font-weight: 700;
}

.cf-btn--ghost:hover,
.cf-icon-btn:hover { border-color: var(--v2-border-focus); }

.cf-btn--primary {
  background: var(--v2-active-strong);
  border-color: var(--v2-border-strong);
}

.cf-btn--wide {
  width: 100%;
  justify-content: center;
  margin-top: 1rem;
}

.cf-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cf-draft-card__summary,
.cf-session-item__summary {
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
  margin-top: .75rem;
  font-size: .75rem;
  color: var(--v2-text-secondary);
}

.cf-draft-card__summary span,
.cf-session-item__summary span,
.cf-attempt-timeline__pill,
.cf-badge {
  background: rgba(255,255,255,.05);
  border: 1px solid var(--v2-border-subtle);
  border-radius: 999px;
  padding: .22rem .55rem;
}

.cf-draft-card__details,
.cf-session-items {
  margin-top: .9rem;
  display: flex;
  flex-direction: column;
  gap: .9rem;
}

.cf-targets { margin-top: .9rem; }

.cf-targets__list,
.cf-attempts,
.cf-resource-list,
.cf-attempt-timeline {
  display: flex;
  flex-direction: column;
  gap: .6rem;
  margin-top: .75rem;
}

.cf-target-row,
.cf-resource-row,
.cf-attempt-card,
.cf-session-item,
.cf-attempt-timeline__row {
  background: rgba(0,0,0,.12);
  border: 1px solid var(--v2-border-subtle);
  border-radius: 12px;
  padding: .75rem;
}

.cf-target-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px 130px;
  gap: .65rem;
  align-items: center;
}

@media (max-width: 760px) {
  .cf-target-row { grid-template-columns: 1fr; }
}

.cf-target-row__name {
  font-size: .8125rem;
  font-weight: 600;
  color: var(--v2-text);
}

.cf-target-row__sub {
  font-size: .6875rem;
  color: var(--v2-text-muted);
}

.cf-attempt-card__title,
.cf-resource-row__name {
  font-size: .8125rem;
  font-weight: 700;
  color: var(--v2-text);
}

.cf-resource-row {
  display: grid;
  grid-template-columns: 18px 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: .65rem;
}

.cf-resource-row__name--done {
  text-decoration: line-through;
  color: var(--v2-text-muted);
}

.cf-resource-row__qty {
  font-size: .8125rem;
  font-weight: 700;
  color: var(--v2-accent);
}

.cf-profit-preview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .55rem;
  margin-top: .75rem;
}

@media (max-width: 760px) {
  .cf-profit-preview { grid-template-columns: 1fr; }
}

.cf-profit-preview__row,
.cf-mini-stat {
  background: rgba(255,255,255,.04);
  border: 1px solid var(--v2-border-subtle);
  border-radius: 12px;
  padding: .7rem .8rem;
}

.cf-profit-preview__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .6rem;
  font-size: .8rem;
  color: var(--v2-text-secondary);
}

.cf-history-card__stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: .6rem;
  margin-top: .8rem;
}

@media (max-width: 760px) {
  .cf-history-card__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.cf-mini-stat__label {
  font-size: .6875rem;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--v2-text-dim);
  font-weight: 700;
}

.cf-mini-stat__value {
  margin-top: .22rem;
  font-size: .9rem;
  color: var(--v2-text);
  font-weight: 700;
}

.cf-session-item__profit {
  font-size: .875rem;
  font-weight: 800;
  white-space: nowrap;
}

.cf-attempt-timeline__row {
  display: flex;
  align-items: flex-start;
  gap: .7rem;
}

.cf-attempt-timeline__body {
  min-width: 0;
  flex: 1;
}

.cf-attempt-timeline__top {
  display: flex;
  flex-wrap: wrap;
  gap: .45rem;
  font-size: .75rem;
  color: var(--v2-text-secondary);
  margin-bottom: .25rem;
}

.cf-profit--up { color: #34d399; }
.cf-profit--down { color: #f87171; }
</style>
