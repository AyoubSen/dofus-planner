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
      <!-- Stats strip -->
      <div class="br-stats">
        <div class="br-stat">
          <div class="br-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="br-stat__body">
            <div class="br-stat__val">{{ entries.length }}</div>
            <div class="br-stat__lbl">Sessions</div>
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
            <div class="br-stat__lbl">Total P/L (vs craft)</div>
          </div>
        </div>
        <div class="br-stat">
          <div class="br-stat__icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4" />
            </svg>
          </div>
          <div class="br-stat__body">
            <div class="br-stat__val" :style="avgMargin >= 0 ? 'color:#34d399' : 'color:#f87171'">
              {{ avgMargin >= 0 ? '+' : '' }}{{ avgMargin }}%
            </div>
            <div class="br-stat__lbl">Avg margin</div>
          </div>
        </div>
        <div class="br-stat">
          <div class="br-stat__icon">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div class="br-stat__body">
            <div class="br-stat__val" style="font-size:.9375rem">{{ bestItem?.name ?? '—' }}</div>
            <div class="br-stat__lbl">Best margin item</div>
          </div>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="br-layout">

        <!-- ─── LEFT: Search + form + rune prices ─── -->
        <div class="br-panel">

          <!-- Item search -->
          <div class="br-panel-title">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find item to break
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
                :class="{ 'br-result--sel': selectedItem?.id === item.id }"
                @click="selectItem(item)"
              >
                <img :src="getItemImg(item)" :alt="item.name?.fr ?? ''" class="br-result__img" @error="onImgErr" />
                <div class="br-result__info">
                  <div class="br-result__name">{{ item.name?.fr ?? item.id }}</div>
                  <div class="br-result__sub">{{ item.type?.name?.fr ?? '' }} · Lv {{ item.level ?? '?' }}</div>
                </div>
                <svg v-if="selectedItem?.id === item.id" class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style="color:var(--v2-accent)">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            <div v-else-if="search && !searching" class="br-empty-hint">No items found for "{{ search }}"</div>
          </div>

          <!-- Entry form -->
          <Transition name="br-slide">
            <div v-if="selectedItem" class="br-form">
              <!-- Item header -->
              <div class="br-form__item-header">
                <img :src="getItemImg(selectedItem)" :alt="selectedItem.name?.fr ?? ''" class="br-form__item-img" @error="onImgErr" />
                <div>
                  <div class="br-form__item-name">{{ selectedItem.name?.fr ?? selectedItem.id }}</div>
                  <div class="br-form__item-sub">{{ selectedItem.type?.name?.fr ?? '' }} · Lv {{ selectedItem.level ?? '?' }}</div>
                </div>
                <button class="br-form__close" @click="selectedItem = null">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Prices row -->
              <div class="br-form__row">
                <div class="br-form__field">
                  <label class="br-field-lbl">Craft price (kamas)</label>
                  <input v-model.number="formCraftPrice" type="number" min="0" step="1000" placeholder="0" class="br-field-input" />
                </div>
                <div class="br-form__field">
                  <label class="br-field-lbl">HDV price (kamas)</label>
                  <input v-model.number="formHdvPrice" type="number" min="0" step="1000" placeholder="0" class="br-field-input" />
                </div>
              </div>

              <div class="br-form__field">
                <label class="br-field-lbl">Date</label>
                <input v-model="formDate" type="date" class="br-field-input" />
              </div>

              <!-- Rune breakdown -->
              <div class="br-runes-section">
                <div class="br-runes-header">
                  <span class="br-field-lbl">Runes obtained</span>
                  <span v-if="formRunes.length > 0" class="br-runes-total">{{ formatKamas(formRuneTotal) }}</span>
                </div>

                <!-- Add rune form -->
                <div class="br-rune-add">
                  <div class="br-rune-add__row">
                    <div ref="addRuneWrapEl" class="br-rune-add__name-wrap">
                      <input
                        v-model="addRuneForm.name"
                        type="text"
                        placeholder="Rune name…"
                        class="br-rune-add__name"
                        @input="onAddRuneNameInput"
                        @focus="addRuneDropOpen = true"
                        @keyup.enter="commitAddRune"
                        @keyup.escape="addRuneDropOpen = false"
                      />
                      <div v-if="addRuneDropOpen && addRuneSuggestions.length" class="br-rune-dropdown">
                        <button
                          v-for="s in addRuneSuggestions"
                          :key="s.id"
                          class="br-rune-dropdown__item"
                          @mousedown.prevent="pickAddRune(s)"
                        >
                          <span class="br-rune-dropdown__name">{{ s.name }}</span>
                          <span class="br-rune-dropdown__price">{{ formatKamas(s.price) }}/u</span>
                        </button>
                      </div>
                    </div>
                    <input
                      v-model.number="addRuneForm.qty"
                      type="number"
                      min="1"
                      placeholder="Qty"
                      class="br-rune-add__qty"
                      @keyup.enter="commitAddRune"
                    />
                  </div>
                  <!-- Price preview when rune is known -->
                  <div v-if="addRunePreview > 0" class="br-rune-add__preview">
                    {{ addRuneForm.qty || 1 }}× {{ formatKamas(addRunePreview) }} = <strong>{{ formatKamas((addRuneForm.qty || 1) * addRunePreview) }}</strong>
                  </div>
                  <!-- Manual price when rune is unknown -->
                  <div v-else-if="addRuneForm.name.trim() && !addRuneKnown" class="br-rune-add__manual-row">
                    <label class="br-field-lbl">Price per unit</label>
                    <input
                      v-model.number="addRuneForm.unitPrice"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="br-rune-add__price"
                      @keyup.enter="commitAddRune"
                    />
                  </div>
                  <button
                    class="br-rune-add__btn"
                    :disabled="!addRuneForm.name.trim() || effectiveAddPrice === 0"
                    @click="commitAddRune"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add rune
                  </button>
                </div>

                <!-- Added runes list -->
                <div v-if="formRunes.length > 0" class="br-rune-list">
                  <div v-for="(rune, idx) in formRunes" :key="idx" class="br-rune-item">
                    <span class="br-rune-item__label">
                      <span class="br-rune-item__qty">{{ rune.qty }}×</span>
                      <span class="br-rune-item__name">{{ rune.name }}</span>
                    </span>
                    <span class="br-rune-item__val">{{ formatKamas((rune.qty || 0) * (rune.unitPrice || 0)) }}</span>
                    <button class="br-rune-item__del" @click="formRunes.splice(idx, 1)" title="Remove">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div class="br-rune-list__total">
                    <span>Total rune value</span>
                    <span class="br-rune-list__total-val">{{ formatKamas(formRuneTotal) }}</span>
                  </div>
                </div>
              </div>

              <!-- Profit preview -->
              <div v-if="formCraftPrice > 0 || formRuneTotal > 0" class="br-profit-preview">
                <div class="br-profit-row">
                  <span>vs Craft:</span>
                  <span :style="(formRuneTotal - formCraftPrice) >= 0 ? 'color:#34d399' : 'color:#f87171'">
                    {{ (formRuneTotal - formCraftPrice) >= 0 ? '+' : '' }}{{ formatKamas(formRuneTotal - formCraftPrice) }}
                    <span style="font-size:.6875rem;opacity:.7">
                      ({{ formCraftPrice > 0 ? (((formRuneTotal - formCraftPrice) / formCraftPrice) * 100).toFixed(0) : '∞' }}%)
                    </span>
                  </span>
                </div>
                <div v-if="formHdvPrice > 0" class="br-profit-row">
                  <span>vs HDV:</span>
                  <span :style="(formRuneTotal - formHdvPrice) >= 0 ? 'color:#34d399' : 'color:#f87171'">
                    {{ (formRuneTotal - formHdvPrice) >= 0 ? '+' : '' }}{{ formatKamas(formRuneTotal - formHdvPrice) }}
                    <span style="font-size:.6875rem;opacity:.7">
                      ({{ formHdvPrice > 0 ? (((formRuneTotal - formHdvPrice) / formHdvPrice) * 100).toFixed(0) : '∞' }}%)
                    </span>
                  </span>
                </div>
              </div>

              <div class="br-form__field">
                <label class="br-field-lbl">Notes (optional)</label>
                <input v-model="formNotes" type="text" placeholder="Optional notes…" class="br-field-input" />
              </div>

              <button class="br-submit-btn" :disabled="!selectedItem || formRuneTotal === 0" @click="addEntry">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.5 3.5L21 10l-4 4M9.5 20.5L3 14l4-4m8-6.5l-9 9" />
                </svg>
                Add to brisage log
              </button>
            </div>
          </Transition>

          <!-- ─── Rune prices manager ─── -->
          <div class="br-rune-prices">
            <button class="br-rune-prices__toggle" @click="showRunePrices = !showRunePrices">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Rune prices
              <span class="br-rune-prices__count">{{ runePrices.length }}</span>
              <svg class="w-3.5 h-3.5 ml-auto transition-transform" :class="{ 'rotate-180': showRunePrices }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div v-if="showRunePrices" class="br-rune-prices__body">
              <!-- Add rune price -->
              <div class="br-rune-prices__add-form">
                <input v-model="newRuneName" type="text" placeholder="Rune name (e.g. Rvit)" class="br-rune-prices__input" @keyup.enter="addRunePrice" />
                <input v-model.number="newRunePrice" type="number" min="0" placeholder="Price" class="br-rune-prices__input br-rune-prices__input--sm" @keyup.enter="addRunePrice" />
                <button class="br-rune-prices__add-btn" @click="addRunePrice" :disabled="!newRuneName.trim() || newRunePrice <= 0">+</button>
              </div>

              <div v-if="runePrices.length === 0" class="br-rune-prices__empty">
                No rune prices saved yet.
              </div>
              <div v-else class="br-rune-prices__list">
                <div v-for="rp in runePrices" :key="rp.id" class="br-rp-row">
                  <span class="br-rp-name">{{ rp.name }}</span>
                  <template v-if="editingRune?.id === rp.id">
                    <input v-model.number="editingRune.price" type="number" class="br-rp-input" @keyup.enter="saveRunePrice" @keyup.escape="editingRune = null" />
                    <button class="br-rp-ok" @click="saveRunePrice">✓</button>
                    <button class="br-rp-cancel" @click="editingRune = null">✕</button>
                  </template>
                  <template v-else>
                    <span class="br-rp-price" @click="startEditRune(rp)">{{ formatKamas(rp.price) }}</span>
                    <button class="br-rp-edit" @click="startEditRune(rp)" title="Edit">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button class="br-rp-del" @click="deleteRunePrice(rp.id)" title="Delete">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── RIGHT: Log ─── -->
        <div class="br-panel">
          <div class="br-panel-title">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.5 3.5L21 10l-4 4M9.5 20.5L3 14l4-4m8-6.5l-9 9" />
            </svg>
            Brisage log
            <span class="br-badge">{{ entries.length }}</span>
          </div>

          <div v-if="entries.length === 0" class="br-log-empty">
            <svg class="w-10 h-10 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.5 3.5L21 10l-4 4M9.5 20.5L3 14l4-4m8-6.5l-9 9" />
            </svg>
            No brisage sessions recorded yet.<br />
            <span style="font-size:.8125rem;opacity:.5">Search for an item and log your first break.</span>
          </div>

          <div v-else class="br-log-scroll">
            <div v-for="entry in entries" :key="entry.id" class="br-entry">
              <!-- Header row -->
              <div class="br-entry__header">
                <img :src="getItemImg(entry.item)" :alt="entry.item?.name?.fr ?? ''" class="br-entry__img" @error="onImgErr" />
                <div class="br-entry__meta">
                  <div class="br-entry__name">{{ entry.item?.name?.fr ?? 'Unknown item' }}</div>
                  <div class="br-entry__sub">{{ entry.item?.type?.name?.fr ?? '' }} · Lv {{ entry.item?.level ?? '?' }}</div>
                  <div class="br-entry__date">{{ formatDisplayDate(entry.date) }}</div>
                </div>
                <button class="br-entry__del" @click="deleteEntry(entry.id)" title="Delete">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <!-- Price trio -->
              <div class="br-entry__prices">
                <div class="br-price-cell br-price-cell--craft">
                  <div class="br-price-cell__lbl">Craft cost</div>
                  <div class="br-price-cell__val">{{ formatKamas(entry.craftPrice) }}</div>
                </div>
                <div class="br-price-cell br-price-cell--hdv">
                  <div class="br-price-cell__lbl">HDV price</div>
                  <div class="br-price-cell__val">{{ formatKamas(entry.hdvPrice) }}</div>
                </div>
                <div class="br-price-cell br-price-cell--rune">
                  <div class="br-price-cell__lbl">Rune value</div>
                  <div class="br-price-cell__val" style="color:var(--v2-accent)">{{ formatKamas(entry.runeValue) }}</div>
                </div>
              </div>

              <!-- Profit indicators -->
              <div class="br-entry__profits">
                <div class="br-profit-pill" :class="(entry.runeValue - entry.craftPrice) >= 0 ? 'br-profit-pill--pos' : 'br-profit-pill--neg'">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  vs Craft: {{ (entry.runeValue - entry.craftPrice) >= 0 ? '+' : '' }}{{ formatKamas(entry.runeValue - entry.craftPrice) }}
                  <span class="br-profit-pct" v-if="entry.craftPrice > 0">
                    ({{ (((entry.runeValue - entry.craftPrice) / entry.craftPrice) * 100).toFixed(0) }}%)
                  </span>
                </div>
                <div v-if="entry.hdvPrice > 0" class="br-profit-pill" :class="(entry.runeValue - entry.hdvPrice) >= 0 ? 'br-profit-pill--pos' : 'br-profit-pill--neg'">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  vs HDV: {{ (entry.runeValue - entry.hdvPrice) >= 0 ? '+' : '' }}{{ formatKamas(entry.runeValue - entry.hdvPrice) }}
                  <span class="br-profit-pct" v-if="entry.hdvPrice > 0">
                    ({{ (((entry.runeValue - entry.hdvPrice) / entry.hdvPrice) * 100).toFixed(0) }}%)
                  </span>
                </div>
              </div>

              <!-- Rune chips -->
              <div v-if="entry.runes.length > 0" class="br-entry__rune-chips">
                <span v-for="(r, i) in entry.runes" :key="i" class="br-rune-chip">
                  {{ r.qty }}× {{ r.name }}
                  <span class="br-rune-chip__val">{{ formatKamas(r.qty * r.unitPrice) }}</span>
                </span>
              </div>

              <div v-if="entry.notes" class="br-entry__notes">{{ entry.notes }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'v2' })

const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormRune { name: string; qty: number; unitPrice: number }
interface BrisageRune { name: string; qty: number; unitPrice: number }
interface BrisageEntry {
  id: string
  itemId: string | number
  item: any
  craftPrice: number
  hdvPrice: number
  runeValue: number
  runes: BrisageRune[]
  date: string
  notes: string
}
interface RunePrice { id: string; name: string; price: number }

// ── Storage keys ──────────────────────────────────────────────────────────────
const entriesKey = computed(() =>
  `brisage_entries_${selectedServer.value?.id}_${selectedCharacter.value?.id}`
)
const runePricesKey = computed(() =>
  `brisage_rune_prices_${selectedServer.value?.id}`
)

// ── State ─────────────────────────────────────────────────────────────────────
const entries = ref<BrisageEntry[]>([])
const runePrices = ref<RunePrice[]>([])
const showRunePrices = ref(false)

// Search
const search = ref('')
const searching = ref(false)
const results = ref<any[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

// Selected item
const selectedItem = ref<any>(null)

// Form fields
const formCraftPrice = ref(0)
const formHdvPrice = ref(0)
const formDate = ref(todayISO())
const formRunes = ref<FormRune[]>([])
const formNotes = ref('')

// Add-rune mini form
const addRuneForm = ref({ name: '', qty: 1, unitPrice: 0 })
const addRuneDropOpen = ref(false)

// Rune price management
const newRuneName = ref('')
const newRunePrice = ref(0)
const editingRune = ref<{ id: string; price: number } | null>(null)

// ── Load/save ─────────────────────────────────────────────────────────────────
const loadData = () => {
  if (!hasContext.value) return
  const eRaw = localStorage.getItem(entriesKey.value)
  const rRaw = localStorage.getItem(runePricesKey.value)
  entries.value = eRaw ? JSON.parse(eRaw) : []
  runePrices.value = rRaw ? JSON.parse(rRaw) : []
}
const saveEntries = () => localStorage.setItem(entriesKey.value, JSON.stringify(entries.value))
const saveRunePrices = () => localStorage.setItem(runePricesKey.value, JSON.stringify(runePrices.value))

// ── Search ────────────────────────────────────────────────────────────────────
const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(doSearch, 350)
}
const doSearch = async () => {
  if (!search.value.trim()) { results.value = []; return }
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
  } catch { results.value = [] }
  finally { searching.value = false }
}
const clearSearch = () => { search.value = ''; results.value = []; selectedItem.value = null }

const selectItem = (item: any) => {
  selectedItem.value = item
  results.value = []
  search.value = ''
  formCraftPrice.value = 0
  formHdvPrice.value = 0
  formDate.value = todayISO()
  formRunes.value = []
  formNotes.value = ''
  addRuneForm.value = { name: '', qty: 1, unitPrice: 0 }
}

// ── Rune form helpers ─────────────────────────────────────────────────────────
const addRuneSuggestions = computed(() => {
  const q = addRuneForm.value.name.toLowerCase()
  if (!q) return runePrices.value
  return runePrices.value.filter(r => r.name.toLowerCase().includes(q))
})

const addRuneKnown = computed(() =>
  runePrices.value.some(r => r.name.toLowerCase() === addRuneForm.value.name.toLowerCase())
)

const addRunePreview = computed(() => {
  const match = runePrices.value.find(r => r.name.toLowerCase() === addRuneForm.value.name.toLowerCase())
  return match?.price ?? 0
})

const effectiveAddPrice = computed(() => addRunePreview.value || addRuneForm.value.unitPrice || 0)

const onAddRuneNameInput = () => {
  addRuneForm.value.unitPrice = 0
}

const pickAddRune = (rp: RunePrice) => {
  addRuneForm.value.name = rp.name
  addRuneDropOpen.value = false
}

const commitAddRune = () => {
  const name = addRuneForm.value.name.trim()
  const qty = addRuneForm.value.qty || 1
  const price = effectiveAddPrice.value
  if (!name || price === 0) return
  formRunes.value.push({ name, qty, unitPrice: price })
  addRuneForm.value = { name: '', qty: 1, unitPrice: 0 }
}

const formRuneTotal = computed(() =>
  formRunes.value.reduce((s, r) => s + (r.qty ?? 0) * (r.unitPrice ?? 0), 0)
)

// ── Add entry ─────────────────────────────────────────────────────────────────
const addEntry = () => {
  if (!selectedItem.value) return
  const entry: BrisageEntry = {
    id: crypto.randomUUID(),
    itemId: selectedItem.value.id,
    item: selectedItem.value,
    craftPrice: formCraftPrice.value ?? 0,
    hdvPrice: formHdvPrice.value ?? 0,
    runeValue: formRuneTotal.value,
    runes: formRunes.value.map(r => ({ ...r })),
    date: formDate.value || todayISO(),
    notes: formNotes.value,
  }
  entries.value.unshift(entry)
  saveEntries()
  // reset form
  selectedItem.value = null
  formCraftPrice.value = 0
  formHdvPrice.value = 0
  formDate.value = todayISO()
  formRunes.value = []
  formNotes.value = ''
  addRuneForm.value = { name: '', qty: 1, unitPrice: 0 }
  search.value = ''
  results.value = []
}

const deleteEntry = (id: string) => {
  entries.value = entries.value.filter(e => e.id !== id)
  saveEntries()
}

// ── Rune price management ─────────────────────────────────────────────────────
const addRunePrice = () => {
  const name = newRuneName.value.trim()
  if (!name || newRunePrice.value <= 0) return
  const existing = runePrices.value.find(r => r.name.toLowerCase() === name.toLowerCase())
  if (existing) { existing.price = newRunePrice.value }
  else { runePrices.value.push({ id: crypto.randomUUID(), name, price: newRunePrice.value }) }
  runePrices.value.sort((a, b) => a.name.localeCompare(b.name))
  saveRunePrices()
  newRuneName.value = ''
  newRunePrice.value = 0
}
const startEditRune = (rp: RunePrice) => { editingRune.value = { id: rp.id, price: rp.price } }
const saveRunePrice = () => {
  if (!editingRune.value) return
  const rp = runePrices.value.find(r => r.id === editingRune.value!.id)
  if (rp) { rp.price = editingRune.value.price; saveRunePrices() }
  editingRune.value = null
}
const deleteRunePrice = (id: string) => {
  runePrices.value = runePrices.value.filter(r => r.id !== id)
  saveRunePrices()
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const totalPL = computed(() =>
  entries.value.reduce((s, e) => s + (e.runeValue - e.craftPrice), 0)
)
const avgMargin = computed(() => {
  if (!entries.value.length) return 0
  const margins = entries.value
    .filter(e => e.craftPrice > 0)
    .map(e => ((e.runeValue - e.craftPrice) / e.craftPrice) * 100)
  if (!margins.length) return 0
  return Math.round(margins.reduce((a, b) => a + b, 0) / margins.length)
})
const bestItem = computed(() => {
  if (!entries.value.length) return null
  const withMargin = entries.value
    .filter(e => e.craftPrice > 0)
    .map(e => ({ name: e.item?.name?.fr ?? 'Unknown', margin: (e.runeValue - e.craftPrice) / e.craftPrice }))
  if (!withMargin.length) return null
  return withMargin.reduce((b, c) => c.margin > b.margin ? c : b, withMargin[0])
})

// ── Helpers ───────────────────────────────────────────────────────────────────
const getItemImg = (item: any) => item?.img ?? ''
const onImgErr = (e: Event) => {
  const img = e.target as HTMLImageElement
  if (img.dataset.fb) return; img.dataset.fb = '1'; img.src = '/item-fallback.svg'
}
const formatKamas = (n: number) => {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString()
}
function todayISO() {
  const d = new Date(); return d.toISOString().slice(0, 10)
}
const formatDisplayDate = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })
}

// ── Init ──────────────────────────────────────────────────────────────────────
const addRuneWrapEl = ref<HTMLElement | null>(null)
const searchAreaEl = ref<HTMLElement | null>(null)

const onDocMousedown = (e: MouseEvent) => {
  const t = e.target as Node
  if (addRuneWrapEl.value && !addRuneWrapEl.value.contains(t)) {
    addRuneDropOpen.value = false
  }
  if (searchAreaEl.value && !searchAreaEl.value.contains(t)) {
    results.value = []
  }
}

onMounted(() => {
  initContext()
  loadData()
  document.addEventListener('mousedown', onDocMousedown)
})
onUnmounted(() => document.removeEventListener('mousedown', onDocMousedown))
watch([selectedServer, selectedCharacter], loadData)
</script>

<style scoped>
/* ── Accent: violet ──────────────────────────────────────────────────────────*/
/* primary: var(--v2-accent)  bg/border follow --v2-* tokens */

/* Stats strip */
.br-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: .625rem;
  margin-bottom: .875rem;
}
.br-stat {
  display: flex; align-items: center; gap: .75rem;
  padding: .875rem 1rem; border-radius: 12px;
  background: var(--v2-hover); border: 1px solid var(--v2-border-med);
}
.br-stat--green { border-color: rgba(52,211,153,.2); background: rgba(52,211,153,.05); }
.br-stat--red   { border-color: rgba(248,113,113,.2); background: rgba(248,113,113,.05); }
.br-stat__icon {
  width: 34px; height: 34px; flex-shrink: 0; border-radius: 9px;
  background: var(--v2-border-med); color: var(--v2-accent);
  display: flex; align-items: center; justify-content: center;
}
.br-stat--green .br-stat__icon { background: rgba(52,211,153,.15); color: #34d399; }
.br-stat--red   .br-stat__icon { background: rgba(248,113,113,.15); color: #f87171; }
.br-stat__val { font-size: 1.25rem; font-weight: 800; color: var(--v2-text); line-height: 1.2; }
.br-stat__lbl { font-size: .6875rem; color: var(--v2-text-dim); margin-top: 1px; }

/* Layout */
.br-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1rem;
  align-items: start;
}
@media (max-width: 860px) { .br-layout { grid-template-columns: 1fr; } }

/* Panel */
.br-panel {
  background: var(--v2-hover-subtle);
  border: 1px solid var(--v2-active);
  border-radius: 14px; padding: 1rem;
}
.br-panel-title {
  display: flex; align-items: center; gap: .5rem;
  font-size: .875rem; font-weight: 700; color: var(--v2-accent);
  margin-bottom: .875rem;
}
.br-badge {
  background: var(--v2-active-strong); color: var(--v2-accent);
  font-size: .6875rem; font-weight: 600; padding: .125rem .4375rem;
  border-radius: 999px;
}

/* Search */
.br-search { position: relative; display: flex; align-items: center; margin-bottom: .75rem; }
.br-search__icon { position: absolute; left: .75rem; color: var(--v2-text-muted); pointer-events: none; }
.br-search__input {
  background: rgba(0,0,0,.3); border: 1px solid var(--v2-border); border-radius: 10px;
  padding: .5rem 2.25rem; color: var(--v2-text); font-size: .875rem;
  outline: none; width: 100%; transition: border-color .18s;
}
.br-search__input:focus { border-color: var(--v2-border-focus); }
.br-search__input::placeholder { color: var(--v2-text-dim); }
.br-search__clear {
  position: absolute; right: .625rem; background: none; border: none;
  color: var(--v2-text-muted); cursor: pointer; display: flex; align-items: center;
}
.br-search__clear:hover { color: var(--v2-accent); }

.br-inline-loader { display: flex; align-items: center; gap: .5rem; font-size: .8125rem; color: var(--v2-text-secondary); padding: .375rem 0; }
.br-spin {
  width: 16px; height: 16px; flex-shrink: 0;
  border: 2px solid var(--v2-border-med); border-top-color: var(--v2-accent);
  border-radius: 50%; animation: brspin .8s linear infinite;
}
@keyframes brspin { to { transform: rotate(360deg); } }
.br-empty-hint { font-size: .8125rem; color: var(--v2-text-muted); padding: .375rem 0; }

/* Results */
.br-results {
  display: flex; flex-direction: column; gap: 2px;
  max-height: 200px; overflow-y: auto; margin-bottom: .75rem;
}
.br-result {
  display: flex; align-items: center; gap: .625rem;
  padding: .4375rem .625rem; border-radius: 9px;
  border: 1px solid transparent; background: rgba(0,0,0,.15);
  cursor: pointer; transition: all .15s; text-align: left;
}
.br-result:hover { background: var(--v2-glow); border-color: var(--v2-active-strong); }
.br-result--sel { background: var(--v2-active); border-color: var(--v2-border-strong); }
.br-result__img { width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; }
.br-result__name { font-size: .8125rem; font-weight: 600; color: var(--v2-text); }
.br-result__sub { font-size: .6875rem; color: var(--v2-text-muted); margin-top: 1px; }
.br-result__info { flex: 1; min-width: 0; }

/* Entry form */
.br-form {
  background: rgba(0,0,0,.18); border: 1px solid var(--v2-border);
  border-radius: 12px; padding: .875rem;
  display: flex; flex-direction: column; gap: .75rem; margin-top: .5rem;
}
.br-form__item-header { display: flex; align-items: center; gap: .75rem; }
.br-form__item-img { width: 44px; height: 44px; object-fit: contain; flex-shrink: 0; }
.br-form__item-name { font-size: .9375rem; font-weight: 700; color: var(--v2-text); }
.br-form__item-sub { font-size: .75rem; color: var(--v2-text-secondary); margin-top: 2px; }
.br-form__close {
  margin-left: auto; flex-shrink: 0; background: none; border: none;
  color: var(--v2-text-muted); cursor: pointer; display: flex; align-items: center; transition: color .15s;
}
.br-form__close:hover { color: #f87171; }
.br-form__row { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
.br-form__field { display: flex; flex-direction: column; gap: 3px; }
.br-field-lbl { font-size: .6875rem; color: var(--v2-text-secondary); font-weight: 500; }
.br-field-input {
  background: rgba(0,0,0,.3); border: 1px solid var(--v2-active-strong); border-radius: 8px;
  padding: .4375rem .75rem; color: var(--v2-text); font-size: .875rem;
  outline: none; transition: border-color .15s; width: 100%;
}
.br-field-input:focus { border-color: var(--v2-border-focus); }
.br-field-input::placeholder { color: var(--v2-text-dim); }

/* Runes section */
.br-runes-section {
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-active);
  border-radius: 10px; padding: .75rem;
  display: flex; flex-direction: column; gap: .625rem;
}
.br-runes-header { display: flex; align-items: center; justify-content: space-between; }
.br-runes-total { font-size: .75rem; font-weight: 600; color: var(--v2-accent); }

/* Add-rune form */
.br-rune-add { display: flex; flex-direction: column; gap: .4375rem; }
.br-rune-add__row { display: grid; grid-template-columns: 1fr 68px; gap: .375rem; align-items: center; }
.br-rune-add__name-wrap { position: relative; }
.br-rune-add__name {
  width: 100%; background: rgba(0,0,0,.3); border: 1px solid var(--v2-active-strong);
  border-radius: 8px; padding: .4375rem .625rem; color: var(--v2-text); font-size: .8125rem;
  outline: none; transition: border-color .15s;
}
.br-rune-add__name:focus { border-color: var(--v2-border-focus); }
.br-rune-add__name::placeholder { color: var(--v2-text-dim); }
.br-rune-add__qty {
  width: 100%; background: rgba(0,0,0,.3); border: 1px solid var(--v2-active-strong);
  border-radius: 8px; padding: .4375rem .5rem; color: var(--v2-text); font-size: .8125rem;
  outline: none; text-align: center; transition: border-color .15s;
}
.br-rune-add__qty:focus { border-color: var(--v2-border-focus); }
.br-rune-add__preview {
  font-size: .75rem; color: var(--v2-text-secondary);
  background: var(--v2-hover); border-radius: 6px; padding: .25rem .5rem;
}
.br-rune-add__preview strong { color: var(--v2-accent); }
.br-rune-add__manual-row { display: flex; flex-direction: column; gap: 2px; }
.br-rune-add__price {
  width: 100%; background: rgba(0,0,0,.3); border: 1px solid var(--v2-active-strong);
  border-radius: 8px; padding: .4375rem .625rem; color: var(--v2-text); font-size: .8125rem;
  outline: none; transition: border-color .15s;
}
.br-rune-add__price:focus { border-color: var(--v2-border-focus); }
.br-rune-add__btn {
  display: flex; align-items: center; justify-content: center; gap: .375rem;
  padding: .375rem .75rem; border-radius: 8px;
  background: var(--v2-border); border: 1px solid var(--v2-border-strong);
  color: var(--v2-accent); font-size: .8125rem; font-weight: 600; cursor: pointer; transition: all .15s;
}
.br-rune-add__btn:hover:not(:disabled) { background: var(--v2-border-strong); }
.br-rune-add__btn:disabled { opacity: .35; cursor: not-allowed; }

/* Dropdown (shared by add-form) */
.br-rune-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50;
  background: var(--v2-surface-elevated);
  border: 1px solid var(--v2-active-strong);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0,0,0,.4), 0 16px 40px rgba(0,0,0,.6);
  max-height: 200px; overflow-y: auto;
}
.br-rune-dropdown__item {
  display: flex; align-items: center; justify-content: space-between;
  padding: .4375rem .75rem; cursor: pointer; border: none; background: transparent; width: 100%;
  transition: background .1s; text-align: left;
}
.br-rune-dropdown__item:hover { background: var(--v2-border); }
.br-rune-dropdown__name { font-size: .8125rem; color: var(--v2-text); font-weight: 500; }
.br-rune-dropdown__price { font-size: .6875rem; color: #7a5fa0; }

/* Added runes list */
.br-rune-list { display: flex; flex-direction: column; gap: .25rem; }
.br-rune-item {
  display: flex; align-items: center; gap: .5rem;
  padding: .3125rem .5rem; border-radius: 7px;
  background: var(--v2-hover); border: 1px solid var(--v2-active);
}
.br-rune-item__label { flex: 1; display: flex; align-items: baseline; gap: .3125rem; min-width: 0; }
.br-rune-item__qty { font-size: .75rem; color: #6d4fa0; font-weight: 600; flex-shrink: 0; }
.br-rune-item__name {
  font-size: .8125rem; color: var(--v2-text); font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.br-rune-item__val { font-size: .8125rem; font-weight: 700; color: var(--v2-accent); flex-shrink: 0; }
.br-rune-item__del {
  background: none; border: none; cursor: pointer; color: var(--v2-text-dim);
  display: flex; align-items: center; padding: 2px; border-radius: 4px; flex-shrink: 0; transition: all .15s;
}
.br-rune-item__del:hover { color: #f87171; }
.br-rune-list__total {
  display: flex; justify-content: space-between; align-items: center;
  padding: .375rem .5rem; border-top: 1px solid var(--v2-active);
  margin-top: .125rem; font-size: .8125rem; color: #6d4fa0;
}
.br-rune-list__total-val { font-size: .875rem; font-weight: 700; color: var(--v2-accent); }

/* Profit preview */
.br-profit-preview {
  background: rgba(0,0,0,.2); border: 1px solid var(--v2-active);
  border-radius: 8px; padding: .5rem .75rem;
  display: flex; flex-direction: column; gap: .25rem;
}
.br-profit-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: .8125rem; color: #6d4fa0;
}
.br-profit-row strong { color: var(--v2-text); }

/* Submit */
.br-submit-btn {
  display: flex; align-items: center; justify-content: center; gap: .5rem;
  padding: .625rem 1rem; border-radius: 10px;
  background: var(--v2-border-med); border: 1px solid var(--v2-border-strong);
  color: var(--v2-text); font-size: .875rem; font-weight: 600; cursor: pointer; transition: all .18s;
}
.br-submit-btn:hover:not(:disabled) { background: var(--v2-border-strong); }
.br-submit-btn:disabled { opacity: .35; cursor: not-allowed; }

/* Rune prices manager */
.br-rune-prices { margin-top: 1rem; }
.br-rune-prices__toggle {
  display: flex; align-items: center; gap: .5rem;
  width: 100%; padding: .5rem .75rem; border-radius: 10px;
  background: rgba(0,0,0,.2); border: 1px solid var(--v2-active);
  color: #6d4fa0; font-size: .8125rem; font-weight: 500; cursor: pointer; transition: all .15s;
}
.br-rune-prices__toggle:hover { border-color: var(--v2-border-strong); color: var(--v2-text); }
.br-rune-prices__count {
  background: var(--v2-border-med); color: var(--v2-accent);
  font-size: .625rem; padding: .0625rem .375rem; border-radius: 999px; font-weight: 600;
}
.br-rune-prices__body {
  margin-top: .5rem; padding: .75rem;
  background: rgba(0,0,0,.18); border: 1px solid var(--v2-active);
  border-radius: 10px; display: flex; flex-direction: column; gap: .5rem;
}
.br-rune-prices__add-form { display: flex; gap: .375rem; align-items: center; }
.br-rune-prices__input {
  flex: 1; background: rgba(0,0,0,.3); border: 1px solid var(--v2-active-strong); border-radius: 7px;
  padding: .375rem .625rem; color: var(--v2-text); font-size: .8125rem; outline: none; transition: border-color .15s;
}
.br-rune-prices__input:focus { border-color: var(--v2-border-focus); }
.br-rune-prices__input::placeholder { color: var(--v2-text-dim); }
.br-rune-prices__input--sm { flex: 0 0 80px; }
.br-rune-prices__add-btn {
  width: 28px; height: 28px; flex-shrink: 0; border-radius: 7px;
  background: var(--v2-border-med); border: 1px solid var(--v2-border-strong);
  color: var(--v2-accent); font-size: 1rem; font-weight: 700; cursor: pointer; transition: all .15s;
  display: flex; align-items: center; justify-content: center;
}
.br-rune-prices__add-btn:hover:not(:disabled) { background: var(--v2-border-strong); }
.br-rune-prices__add-btn:disabled { opacity: .35; cursor: not-allowed; }
.br-rune-prices__empty { font-size: .75rem; color: var(--v2-text-muted); text-align: center; padding: .25rem; }
.br-rune-prices__list { display: flex; flex-direction: column; gap: 2px; }
.br-rp-row {
  display: flex; align-items: center; gap: .375rem;
  padding: .3125rem .5rem; border-radius: 6px; background: rgba(0,0,0,.15);
}
.br-rp-name { font-size: .8125rem; font-weight: 600; color: var(--v2-text); flex: 1; }
.br-rp-price {
  font-size: .8125rem; font-weight: 600; color: var(--v2-accent); cursor: pointer;
  padding: .125rem .375rem; border-radius: 5px; transition: background .15s;
}
.br-rp-price:hover { background: var(--v2-active); }
.br-rp-input {
  width: 80px; background: rgba(0,0,0,.4); border: 1px solid var(--v2-border-strong);
  border-radius: 5px; padding: .1875rem .375rem; color: var(--v2-text); font-size: .8125rem; outline: none;
}
.br-rp-ok, .br-rp-cancel {
  background: none; border: none; cursor: pointer; font-size: .8125rem; padding: .125rem .25rem;
  border-radius: 4px; transition: all .15s;
}
.br-rp-ok { color: #34d399; }
.br-rp-ok:hover { background: rgba(52,211,153,.12); }
.br-rp-cancel { color: #f87171; }
.br-rp-cancel:hover { background: rgba(248,113,113,.12); }
.br-rp-edit, .br-rp-del {
  background: none; border: none; cursor: pointer;
  display: flex; align-items: center; padding: 2px; border-radius: 4px; transition: all .15s;
}
.br-rp-edit { color: var(--v2-text-muted); }
.br-rp-edit:hover { color: var(--v2-accent); }
.br-rp-del { color: var(--v2-text-dim); }
.br-rp-del:hover { color: #f87171; }

/* Log */
.br-log-empty {
  padding: 2.5rem 1rem; text-align: center;
  color: var(--v2-text-muted); font-size: .9375rem;
  display: flex; flex-direction: column; align-items: center; gap: .25rem;
}
.br-log-scroll { display: flex; flex-direction: column; gap: .625rem; max-height: calc(100vh - 220px); overflow-y: auto; }

.br-entry {
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-active);
  border-radius: 12px; padding: .875rem 1rem;
  display: flex; flex-direction: column; gap: .625rem;
  transition: border-color .18s;
}
.br-entry:hover { border-color: var(--v2-border-strong); }

.br-entry__header { display: flex; align-items: flex-start; gap: .75rem; }
.br-entry__img { width: 44px; height: 44px; object-fit: contain; flex-shrink: 0; }
.br-entry__meta { flex: 1; min-width: 0; }
.br-entry__name { font-size: .9375rem; font-weight: 700; color: var(--v2-text); }
.br-entry__sub { font-size: .6875rem; color: var(--v2-text-secondary); margin-top: 1px; }
.br-entry__date { font-size: .6875rem; color: var(--v2-text-secondary); margin-top: 3px; }
.br-entry__del {
  flex-shrink: 0; background: none; border: none; color: var(--v2-text-muted);
  cursor: pointer; display: flex; align-items: center; padding: 2px; border-radius: 5px; transition: all .15s;
}
.br-entry__del:hover { color: #f87171; background: rgba(248,113,113,.1); }

.br-entry__prices {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .5rem;
}
.br-price-cell {
  padding: .5rem .625rem; border-radius: 8px; text-align: center;
}
.br-price-cell--craft { background: var(--v2-hover); border: 1px solid var(--v2-border-med); }
.br-price-cell--hdv   { background: rgba(96,165,250,.06); border: 1px solid rgba(96,165,250,.15); }
.br-price-cell--rune  { background: var(--v2-hover); border: 1px solid var(--v2-border-med); }
.br-price-cell__lbl { font-size: .625rem; color: var(--v2-text-dim); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px; }
.br-price-cell--hdv .br-price-cell__lbl   { color: #2d4a70; }
.br-price-cell--rune .br-price-cell__lbl  { color: var(--v2-text-secondary); }
.br-price-cell__val { font-size: .9375rem; font-weight: 700; color: var(--v2-text); }

.br-entry__profits { display: flex; flex-wrap: wrap; gap: .375rem; }
.br-profit-pill {
  display: flex; align-items: center; gap: .3125rem;
  padding: .3125rem .625rem; border-radius: 999px; font-size: .75rem; font-weight: 600;
}
.br-profit-pill--pos { background: rgba(52,211,153,.1); color: #34d399; border: 1px solid rgba(52,211,153,.22); }
.br-profit-pill--neg { background: rgba(248,113,113,.1); color: #f87171; border: 1px solid rgba(248,113,113,.22); }
.br-profit-pct { font-weight: 400; opacity: .75; margin-left: .25rem; }

.br-entry__rune-chips { display: flex; flex-wrap: wrap; gap: .3125rem; }
.br-rune-chip {
  display: flex; align-items: center; gap: .3125rem;
  font-size: .6875rem; padding: .125rem .5rem;
  background: var(--v2-border-subtle); border: 1px solid var(--v2-active-strong);
  border-radius: 5px; color: var(--v2-text);
}
.br-rune-chip__val { color: var(--v2-accent); font-weight: 600; }

.br-entry__notes { font-size: .75rem; color: var(--v2-text-secondary); font-style: italic; }

/* Transition */
.br-slide-enter-active, .br-slide-leave-active { transition: all .2s ease; }
.br-slide-enter-from, .br-slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>



