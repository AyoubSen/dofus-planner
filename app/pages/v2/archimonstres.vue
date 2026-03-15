<template>
  <div>
    <div v-if="!hasContext" class="v2-no-context">
      <div class="v2-no-context__icon">
        <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div class="v2-no-context__title">{{ $t('v2.common.noCharacterTitle') }}</div>
      <div class="v2-no-context__desc">{{ $t('v2.archi.noCharacterDesc') }}</div>
    </div>

    <template v-else>
      <!-- Toolbar -->
      <div class="v2-archi-bar">
        <!-- Mode toggle -->
        <div class="v2-toggle">
          <button class="v2-toggle__btn" :class="{ 'v2-toggle__btn--on': mode === 'dofus-ocre' }" @click="mode = 'dofus-ocre'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Dofus Ocre
          </button>
          <button class="v2-toggle__btn" :class="{ 'v2-toggle__btn--on': mode === 'sell' }" @click="mode = 'sell'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Sell Only
          </button>
        </div>

        <!-- Dofus-Ocre filters -->
        <template v-if="mode === 'dofus-ocre'">
          <div class="v2-pills">
            <button v-for="f in FILTERS" :key="f.v" class="v2-pill" :class="{ 'v2-pill--on': filter === f.v }" @click="filter = f.v">{{ f.l }}</button>
          </div>
          <select v-model="typeFilter" class="v2-inline-select" style="font-size:.8125rem;padding:.3rem .6rem">
            <option value="archimonstre">Archimonstres</option>
            <option value="monstre">Monstres</option>
            <option value="boss">Boss</option>
            <option value="all">All types</option>
          </select>
          <div class="v2-searchbox" style="margin-left:auto">
            <svg class="v2-searchbox__icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="search" type="text" :placeholder="$t('v2.common.search')" class="v2-searchbox__input" />
            <button v-if="search" class="v2-searchbox__clear" @click="search=''">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </template>
      </div>

      <!-- ── DOFUS OCRE MODE ── -->
      <template v-if="mode === 'dofus-ocre'">
        <!-- Progress strip -->
        <div class="v2-prog-strip">
          <div class="v2-prog-strip__top">
            <span class="v2-prog-strip__label">Overall progress</span>
            <div class="v2-prog-strip__badges">
              <span class="v2-prog-badge v2-prog-badge--red">{{ zeroCount }} missing</span>
              <span class="v2-prog-badge v2-prog-badge--yellow">{{ oneCount }} × 1</span>
              <span class="v2-prog-badge v2-prog-badge--green">{{ manyCount }} × 2+</span>
            </div>
            <span class="v2-prog-strip__count"><strong>{{ completedCount }}</strong>/{{ archiMonsters.length }} · {{ pct }}%</span>
          </div>
          <div class="v2-progress"><div class="v2-progress__fill" :style="{ width: `${pct}%` }" /></div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="v2-center-loader">
          <div class="v2-spin" />{{ $t('v2.archi.loadingMonsters') }}
        </div>

        <!-- Grid -->
        <div v-else class="v2-mgrid">
          <div
            v-for="m in visible"
            :key="m.id"
            class="v2-mc"
            :class="{ 'v2-mc--done': getCount(m) > 0, 'v2-mc--archi': m.type === 'archimonstre' }"
          >
            <div class="v2-mc__img">
              <img :src="getMonsterImg(m)" :alt="m.nom" loading="lazy" @error="onImgErr" />
              <span v-if="m.type === 'archimonstre'" class="v2-mc__badge">A</span>
            </div>
            <div class="v2-mc__info">
              <div class="v2-mc__name" :title="m.nom">{{ m.nom }}</div>
              <div class="v2-mc__zone">{{ m.zone }}</div>
            </div>
            <div class="v2-mc__ctrl">
              <button class="v2-cc v2-cc--m" :disabled="getCount(m) === 0" @click="dec(m)">−</button>
              <span class="v2-cv" :class="getCount(m) > 0 ? 'v2-cv--pos' : 'v2-cv--zero'">{{ getCount(m) }}</span>
              <button class="v2-cc v2-cc--p" @click="inc(m)">+</button>
            </div>
          </div>

          <div v-if="visible.length === 0" class="v2-mgrid__empty">
            No monsters match your filters.
            <button class="v2-btn-ghost mt-3 px-4 py-2 text-sm" @click="search=''; filter='all'">Clear filters</button>
          </div>
        </div>
      </template>

      <!-- ── SELL MODE ── -->
      <div v-else class="v2-sell">

        <!-- Stats row -->
        <div class="v2-sell-stats">
          <!-- Items for sale -->
          <div class="v2-sstat v2-sstat--amber">
            <div class="v2-sstat__icon">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div class="v2-sstat__body">
              <div class="v2-sstat__label">Items for sale</div>
              <div class="v2-sstat__val">{{ pendingItems.length }}</div>
              <div class="v2-sstat__sub">{{ formatKamas(totalPendingValue) }} total value</div>
            </div>
          </div>

          <!-- Slow moving -->
          <div class="v2-sstat v2-sstat--orange" style="position:relative">
            <div v-if="slowMovingItems.length > 0" class="v2-sstat__pulse" />
            <div class="v2-sstat__icon">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="v2-sstat__body">
              <div class="v2-sstat__label">Slow-moving <span class="v2-sstat__thresh">>{{ slowMovingDays }}d</span></div>
              <div class="v2-sstat__val" :style="slowMovingItems.length > 0 ? 'color:#fbbf24' : ''">{{ slowMovingItems.length }}</div>
              <div class="v2-sstat__sub">
                <select v-model="slowMovingDays" class="v2-inline-select">
                  <option :value="1">1 day</option>
                  <option :value="3">3 days</option>
                  <option :value="5">5 days</option>
                  <option :value="7">7 days</option>
                  <option :value="10">10 days</option>
                  <option :value="14">14 days</option>
                  <option :value="21">21 days</option>
                  <option :value="30">30 days</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Today's sales -->
          <div class="v2-sstat v2-sstat--green">
            <div class="v2-sstat__icon">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div class="v2-sstat__body">
              <div class="v2-sstat__label">Today's sales</div>
              <div class="v2-sstat__val">{{ todaySales.length }}</div>
              <div class="v2-sstat__sub">{{ formatKamas(todayTotal) }}</div>
            </div>
          </div>

          <!-- Total earned -->
          <div class="v2-sstat v2-sstat--blue">
            <div class="v2-sstat__icon">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="v2-sstat__body">
              <div class="v2-sstat__label">Total earned</div>
              <div class="v2-sstat__val">{{ formatKamas(totalEarned) }}</div>
              <div class="v2-sstat__sub">{{ soldItems.length }} sales</div>
            </div>
          </div>
        </div>

        <!-- Add to queue form -->
        <div class="v2-add-form">
          <div class="v2-add-form__title">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add to selling queue
          </div>
          <div class="v2-add-form__row">
            <!-- Monster search -->
            <div ref="monsterAutoEl" class="v2-autocomplete">
              <input
                v-model="searchMonster"
                type="text"
                :placeholder="$t('v2.archi.searchMonster')"
                class="v2-add-input v2-add-input--wide"
                @input="showDropdown = true; selectedMonster = null"
                @focus="showDropdown = true"
                @keyup.escape="showDropdown = false"
              />
              <div v-if="showDropdown && monsterSuggestions.length > 0" class="v2-dropdown">
                <button
                  v-for="s in monsterSuggestions"
                  :key="s.id"
                  class="v2-dropdown__item"
                  @mousedown.prevent="selectMonster(s)"
                >
                  <img :src="getMonsterImg(s)" class="v2-dropdown__img" @error="onImgErr" />
                  <span class="v2-dropdown__name">{{ s.nom }}</span>
                  <span class="v2-dropdown__zone">{{ s.zone }}</span>
                </button>
              </div>
            </div>

            <!-- Quantity -->
            <input
              v-model.number="addQuantity"
              type="number"
              min="1"
              placeholder="Qty"
              class="v2-add-input v2-add-input--sm"
            />

            <!-- Price -->
            <div class="v2-price-wrap">
              <input
                v-model.number="addPrice"
                type="number"
                min="0"
                placeholder="Price / unit"
                class="v2-add-input v2-add-input--md"
              />
              <span v-if="suggestedPrice > 0" class="v2-price-hint" @click="addPrice = suggestedPrice">
                Suggested: {{ formatKamas(suggestedPrice) }}
              </span>
            </div>

            <!-- Add button -->
            <button
              class="v2-add-btn"
              :disabled="!selectedMonster || addPrice <= 0 || addQuantity < 1"
              @click="addToQueue"
            >
              {{ $t('v2.archi.addToQueue') }}
            </button>
          </div>
        </div>

        <!-- Sub-tabs: Queue / History / Analytics -->
        <div class="v2-sell-tabs">
          <button class="v2-sell-tab" :class="{ 'v2-sell-tab--on': sellTab === 'queue' }" @click="sellTab = 'queue'">
            {{ $t('v2.archi.queue') }}
            <span class="v2-sell-tab__badge" v-if="pendingItems.length > 0">{{ pendingItems.length }}</span>
          </button>
          <button class="v2-sell-tab" :class="{ 'v2-sell-tab--on': sellTab === 'history' }" @click="sellTab = 'history'">
            {{ $t('v2.archi.history') }}
            <span class="v2-sell-tab__badge v2-sell-tab__badge--green" v-if="soldItems.length > 0">{{ soldItems.length }}</span>
          </button>
          <button class="v2-sell-tab" :class="{ 'v2-sell-tab--on': sellTab === 'analytics' }" @click="sellTab = 'analytics'">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {{ $t('v2.archi.analytics') }}
            <span v-if="pricingInconsistencies.length > 0" class="v2-sell-tab__badge v2-sell-tab__badge--red">{{ pricingInconsistencies.length }}</span>
          </button>
        </div>

        <!-- Queue tab -->
        <div v-if="sellTab === 'queue'">
          <!-- Slow-moving warning -->
          <div v-if="slowMovingItems.length > 0" class="v2-slow-warn">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>{{ slowMovingItems.length }} item{{ slowMovingItems.length > 1 ? 's have' : ' has' }} been listed for more than {{ slowMovingDays }} day{{ slowMovingDays > 1 ? 's' : '' }}. Consider lowering the price.</span>
          </div>

          <!-- Empty state -->
          <div v-if="pendingItems.length === 0" class="v2-empty">
            <svg class="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <div>No items in your selling queue.</div>
            <div class="v2-empty__sub">Use the form above to add monsters you're selling.</div>
          </div>

          <!-- Pending list -->
          <div v-else class="v2-pending-list">
            <div
              v-for="item in pendingItems"
              :key="item.id"
              class="v2-pending-item"
              :class="{ 'v2-pending-item--slow': isSlowMoving(item) }"
            >
              <img :src="getMonsterImg(item)" class="v2-pitem__img" @error="onImgErr" />
              <div class="v2-pitem__info">
                <div class="v2-pitem__name">{{ item.monsterName }}</div>
                <div class="v2-pitem__date">Listed {{ daysSince(item.dateAdded) }}d ago</div>
                <div v-if="isSlowMoving(item)" class="v2-pitem__slow-tag">Slow</div>
              </div>
              <!-- Price edit -->
              <div class="v2-pitem__price-wrap">
                <template v-if="editingPriceId === item.id">
                  <input
                    v-model.number="editingPriceVal"
                    type="number"
                    class="v2-pitem__price-input"
                    @keyup.enter="savePrice(item)"
                    @keyup.escape="editingPriceId = null"
                    ref="priceEditInput"
                  />
                  <button class="v2-pitem__price-ok" @click="savePrice(item)">✓</button>
                  <button class="v2-pitem__price-cancel" @click="editingPriceId = null">✕</button>
                </template>
                <template v-else>
                  <span class="v2-pitem__price" @click="startEditPrice(item)">{{ formatKamas(item.price) }}</span>
                  <button class="v2-pitem__edit-btn" @click="startEditPrice(item)" title="Edit price">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </template>
              </div>
              <!-- Actions -->
              <div class="v2-pitem__actions">
                <button class="v2-pitem__sold-btn" @click="markSold(item)" title="Mark as sold">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Sold
                </button>
                <button class="v2-pitem__del-btn" @click="removePending(item.id)" title="Remove">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- History tab -->
        <div v-if="sellTab === 'history'">
          <div v-if="soldItems.length === 0" class="v2-empty">
            <svg class="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div>No sales recorded yet.</div>
          </div>

          <div v-else>
            <div class="v2-history-header">
              <span>{{ soldItems.length }} sale{{ soldItems.length !== 1 ? 's' : '' }}</span>
              <button class="v2-clear-btn" @click="clearHistory">{{ $t('v2.archi.clearHistory') }}</button>
            </div>
            <div class="v2-pending-list">
              <div v-for="item in soldItems" :key="item.id" class="v2-pending-item v2-pending-item--sold">
                <img :src="getMonsterImg(item)" class="v2-pitem__img" @error="onImgErr" />
                <div class="v2-pitem__info">
                  <div class="v2-pitem__name">{{ item.monsterName }}</div>
                  <div class="v2-pitem__date">Sold {{ formatDate(item.dateSold) }}</div>
                </div>
                <div class="v2-pitem__price-wrap">
                  <span class="v2-pitem__price v2-pitem__price--sold">{{ formatKamas(item.soldPrice ?? item.price) }}</span>
                </div>
                <div class="v2-pitem__actions">
                  <button class="v2-pitem__undo-btn" @click="undoSale(item)" title="Undo sale">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Undo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analytics tab -->
        <div v-if="sellTab === 'analytics'" class="v2-analytics">

          <!-- Analytics sub-tabs -->
          <div class="v2-atabs">
            <button class="v2-atab" :class="{ 'v2-atab--on': analyticsTab === 'performance' }" @click="analyticsTab = 'performance'">Sales</button>
            <button class="v2-atab" :class="{ 'v2-atab--on': analyticsTab === 'trends' }" @click="analyticsTab = 'trends'">Price trends</button>
            <button class="v2-atab" :class="{ 'v2-atab--on': analyticsTab === 'inconsistencies' }" @click="analyticsTab = 'inconsistencies'">
              Inconsistencies
              <span v-if="pricingInconsistencies.length > 0" class="v2-sell-tab__badge v2-sell-tab__badge--red">{{ pricingInconsistencies.length }}</span>
            </button>
          </div>

          <!-- ─ Sales Performance ─ -->
          <div v-if="analyticsTab === 'performance'">
            <!-- Quick stats -->
            <div class="v2-sell-stats" style="margin-bottom:.75rem">
              <div class="v2-sstat v2-sstat--blue">
                <div class="v2-sstat__icon">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <div class="v2-sstat__body">
                  <div class="v2-sstat__label">Unique monsters</div>
                  <div class="v2-sstat__val">{{ analyticsData.uniqueMonsters }}</div>
                  <div class="v2-sstat__sub">types sold</div>
                </div>
              </div>
              <div class="v2-sstat v2-sstat--green">
                <div class="v2-sstat__icon">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </div>
                <div class="v2-sstat__body">
                  <div class="v2-sstat__label">Best seller</div>
                  <div class="v2-sstat__val" style="font-size:1rem">{{ analyticsData.bestSeller?.name || 'N/A' }}</div>
                  <div class="v2-sstat__sub">{{ analyticsData.bestSeller?.quantity ?? 0 }} sold</div>
                </div>
              </div>
              <div class="v2-sstat v2-sstat--amber">
                <div class="v2-sstat__icon">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div class="v2-sstat__body">
                  <div class="v2-sstat__label">Top revenue</div>
                  <div class="v2-sstat__val" style="font-size:1rem">{{ analyticsData.highestRevenue?.name || 'N/A' }}</div>
                  <div class="v2-sstat__sub">{{ formatKamas(analyticsData.highestRevenue?.revenue ?? 0) }}</div>
                </div>
              </div>
              <div class="v2-sstat" style="background:var(--v2-hover);border-color:var(--v2-border-med)">
                <div class="v2-sstat__icon" style="background:var(--v2-active-strong);color:var(--v2-accent)">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                </div>
                <div class="v2-sstat__body">
                  <div class="v2-sstat__label">Avg price / sale</div>
                  <div class="v2-sstat__val">{{ formatKamas(Math.round(analyticsData.avgSalePrice)) }}</div>
                  <div class="v2-sstat__sub">per unit</div>
                </div>
              </div>
            </div>

            <!-- Sort + filter row -->
            <div class="v2-analytics-bar">
              <div class="v2-analytics-bar__label">Sort by</div>
              <select v-model="analyticsSortBy" class="v2-inline-select" style="font-size:.8125rem;padding:.3rem .6rem">
                <option value="quantity">Quantity</option>
                <option value="revenue">Revenue</option>
                <option value="avgPrice">Avg price</option>
                <option value="frequency">Sales count</option>
              </select>
              <div class="v2-analytics-bar__label" style="margin-left:.75rem">Timeframe</div>
              <select v-model="analyticsTimeframe" class="v2-inline-select" style="font-size:.8125rem;padding:.3rem .6rem">
                <option value="all">All time</option>
                <option value="month">This month</option>
                <option value="week">This week</option>
              </select>
            </div>

            <!-- Empty -->
            <div v-if="filteredAnalyticsData.length === 0" class="v2-empty">
              <svg class="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              <div>No sales data yet.</div>
              <div class="v2-empty__sub">Mark items as sold to see performance analytics.</div>
            </div>

            <!-- Ranked list -->
            <div v-else class="v2-ranked-list">
              <div v-for="(monster, idx) in filteredAnalyticsData" :key="monster.name" class="v2-ranked-item">
                <div class="v2-rank-badge" :class="idx === 0 ? 'v2-rank-badge--gold' : idx === 1 ? 'v2-rank-badge--silver' : idx === 2 ? 'v2-rank-badge--bronze' : ''">{{ idx + 1 }}</div>
                <img :src="getMonsterImg(monster)" class="v2-pitem__img" @error="onImgErr" />
                <div class="v2-ranked-info">
                  <div class="v2-pitem__name">{{ monster.name }}</div>
                  <div class="v2-ranked-bar-wrap">
                    <div class="v2-ranked-bar">
                      <div class="v2-ranked-bar__fill" :style="{ width: `${Math.round((monster.quantity / (filteredAnalyticsData[0]?.quantity || 1)) * 100)}%` }" />
                    </div>
                  </div>
                </div>
                <div class="v2-ranked-stats">
                  <div class="v2-rstat">
                    <div class="v2-rstat__val">{{ monster.quantity }}</div>
                    <div class="v2-rstat__lbl">sold</div>
                  </div>
                  <div class="v2-rstat">
                    <div class="v2-rstat__val">{{ formatKamas(monster.revenue) }}</div>
                    <div class="v2-rstat__lbl">revenue</div>
                  </div>
                  <div class="v2-rstat">
                    <div class="v2-rstat__val">{{ formatKamas(Math.round(monster.avgPrice)) }}</div>
                    <div class="v2-rstat__lbl">avg</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ─ Price Trends ─ -->
          <div v-if="analyticsTab === 'trends'">
            <div class="v2-analytics-bar">
              <div class="v2-analytics-bar__label">Timeframe</div>
              <select v-model="trendTimeframe" class="v2-inline-select" style="font-size:.8125rem;padding:.3rem .6rem">
                <option value="all">All time</option>
                <option value="month">This month</option>
                <option value="week">This week</option>
              </select>
              <div class="v2-analytics-bar__label" style="margin-left:.75rem">Monster</div>
              <select v-model="selectedTrendMonster" class="v2-inline-select" style="font-size:.8125rem;padding:.3rem .6rem">
                <option value="">All</option>
                <option v-for="name in monstersWithPriceData" :key="name" :value="name">{{ name }}</option>
              </select>
            </div>

            <div v-if="filteredPriceTrends.length === 0" class="v2-empty">
              <svg class="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              <div>Not enough data yet.</div>
              <div class="v2-empty__sub">You need at least 2 sales of the same monster to see price trends.</div>
            </div>

            <div v-else class="v2-pending-list">
              <div v-for="trend in filteredPriceTrends" :key="trend.name" class="v2-pending-item">
                <img :src="getMonsterImg(trend)" class="v2-pitem__img" @error="onImgErr" />
                <div class="v2-pitem__info">
                  <div class="v2-pitem__name">{{ trend.name }}</div>
                  <div class="v2-pitem__date">{{ trend.salesCount }} sales · {{ formatDate(trend.firstDate) }} → {{ formatDate(trend.latestDate) }}</div>
                </div>
                <div class="v2-trend-prices">
                  <div class="v2-trend-prices__row">
                    <span class="v2-trend-prices__lbl">First</span>
                    <span class="v2-trend-prices__val">{{ formatKamas(trend.firstPrice) }}</span>
                  </div>
                  <div class="v2-trend-prices__row">
                    <span class="v2-trend-prices__lbl">Latest</span>
                    <span class="v2-trend-prices__val">{{ formatKamas(trend.latestPrice) }}</span>
                  </div>
                </div>
                <div class="v2-trend-badge" :class="trend.priceChange > 5 ? 'v2-trend-badge--up' : trend.priceChange < -5 ? 'v2-trend-badge--down' : 'v2-trend-badge--stable'">
                  <svg v-if="trend.priceChange > 5" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  <svg v-else-if="trend.priceChange < -5" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                  <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
                  {{ trend.priceChange > 5 ? 'Rising' : trend.priceChange < -5 ? 'Falling' : 'Stable' }}
                  ({{ trend.priceChange > 0 ? '+' : '' }}{{ Math.round(trend.priceChange) }}%)
                </div>
              </div>
            </div>
          </div>

          <!-- ─ Pricing Inconsistencies ─ -->
          <div v-if="analyticsTab === 'inconsistencies'">
            <div v-if="pricingInconsistencies.length === 0" class="v2-empty">
              <svg class="w-10 h-10" style="color:#34d399;opacity:.7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div style="color:#34d399">All prices are consistent!</div>
              <div class="v2-empty__sub">No items with conflicting prices in your sell queue.</div>
            </div>

            <div v-else class="v2-pending-list">
              <div v-for="inc in pricingInconsistencies" :key="inc.name" class="v2-incons-item">
                <div class="v2-incons-item__header">
                  <img :src="getMonsterImg(inc)" class="v2-pitem__img" @error="onImgErr" />
                  <div class="v2-pitem__info">
                    <div class="v2-pitem__name">{{ inc.name }}</div>
                    <div class="v2-pitem__date">{{ inc.items.length }} listings · {{ inc.priceGroups.length }} different prices · {{ inc.priceVariation }}% variation</div>
                  </div>
                  <div class="v2-incons-range">
                    <div class="v2-rstat">
                      <div class="v2-rstat__val" style="color:#f87171">{{ formatKamas(inc.minPrice) }}</div>
                      <div class="v2-rstat__lbl">min</div>
                    </div>
                    <div class="v2-rstat">
                      <div class="v2-rstat__val" style="color:#34d399">{{ formatKamas(inc.maxPrice) }}</div>
                      <div class="v2-rstat__lbl">max</div>
                    </div>
                    <div class="v2-rstat">
                      <div class="v2-rstat__val" style="color:#60a5fa">{{ formatKamas(inc.avgPrice) }}</div>
                      <div class="v2-rstat__lbl">avg</div>
                    </div>
                  </div>
                </div>
                <!-- Price groups -->
                <div class="v2-price-groups">
                  <div v-for="g in inc.priceGroups" :key="g.price" class="v2-price-group">
                    <div class="v2-price-group__price">{{ formatKamas(g.price) }}</div>
                    <div class="v2-price-group__count">×{{ g.count }}</div>
                  </div>
                </div>
                <!-- Quick actions -->
                <div class="v2-incons-actions">
                  <button class="v2-ia-btn v2-ia-btn--green" @click="standardizePrices(inc.name, inc.minPrice)">
                    Set all to lowest ({{ formatKamas(inc.minPrice) }})
                  </button>
                  <button class="v2-ia-btn v2-ia-btn--blue" @click="standardizePrices(inc.name, inc.avgPrice)">
                    Set all to avg ({{ formatKamas(inc.avgPrice) }})
                  </button>
                  <button class="v2-ia-btn v2-ia-btn--red" @click="standardizePrices(inc.name, inc.maxPrice)">
                    Set all to highest ({{ formatKamas(inc.maxPrice) }})
                  </button>
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
import monstersJson from '@/data/monsters.json'
definePageMeta({ layout: 'v2' })

const { appendActivity } = useAppDataStore()
const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()

// ── Shared ──────────────────────────────────────────────────────────────────
const mode = ref<'dofus-ocre' | 'sell'>('dofus-ocre')
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
const counts = reactive<Record<string, number>>({})

const FILTERS: Array<{ l: string; v: OcreFilter }> = [
  { l: 'All', v: 'all' },
  { l: 'Missing', v: 'missing' },
  { l: 'Collected', v: 'done' },
]

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
    path: '/v2/archimonstres',
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

const sellTab = ref<'queue' | 'history' | 'analytics'>('queue')
const pendingItems = ref<PendingItem[]>([])
const soldItems = ref<SoldItem[]>([])
const priceHistory = ref<Record<string, number[]>>({})
const slowMovingDays = ref(7)

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

// Monster autocomplete
const monsterSuggestions = computed(() => {
  if (!searchMonster.value || searchMonster.value.length < 2) return []
  const q = searchMonster.value.toLowerCase()
  return monsters.value.filter(m => m.nom?.toLowerCase().includes(q)).slice(0, 8)
})

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
      path: '/v2/archimonstres',
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

const onDocMousedownArchi = (e: MouseEvent) => {
  if (monsterAutoEl.value && !monsterAutoEl.value.contains(e.target as Node)) {
    showDropdown.value = false
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

<style scoped>
/* ── Base ────────────────────────────────────────────────────────────────── */
.v2-archi-bar {
  display: flex; align-items: center; gap: .625rem; flex-wrap: wrap; margin-bottom: .875rem;
}
.v2-toggle {
  display: flex; background: rgba(0,0,0,.25);
  border: 1px solid var(--v2-border); border-radius: 10px; padding: 3px; gap: 2px;
}
.v2-toggle__btn {
  display: flex; align-items: center; gap: .375rem;
  padding: .375rem .75rem; border-radius: 7px; border: none;
  background: transparent; color: var(--v2-text-secondary); font-size: .8125rem; font-weight: 500; cursor: pointer;
  transition: all .18s; white-space: nowrap;
}
.v2-toggle__btn--on { background: var(--v2-active-strong); color: var(--v2-text); }

.v2-pills { display: flex; gap: 4px; }
.v2-pill {
  padding: .375rem .875rem; border-radius: 999px;
  border: 1px solid var(--v2-border); background: transparent;
  color: var(--v2-text-secondary); font-size: .8125rem; font-weight: 500; cursor: pointer; transition: all .15s;
}
.v2-pill:hover { border-color: var(--v2-border-strong); color: var(--v2-text-hover); }
.v2-pill--on { background: var(--v2-border-med); border-color: var(--v2-border-strong); color: var(--v2-text); }

.v2-searchbox {
  position: relative; display: flex; align-items: center; min-width: 180px;
}
.v2-searchbox__icon { position: absolute; left: .75rem; color: var(--v2-text-dim); pointer-events: none; }
.v2-searchbox__input {
  background: rgba(0,0,0,.3); border: 1px solid var(--v2-border); border-radius: 10px;
  padding: .5rem 2.25rem 0.5rem 2.25rem; color: var(--v2-text); font-size: .875rem;
  outline: none; width: 100%; transition: border-color .18s;
}
.v2-searchbox__input:focus { border-color: var(--v2-border-focus); }
.v2-searchbox__input::placeholder { color: var(--v2-text-dimmer); }
.v2-searchbox__clear {
  position: absolute; right: .625rem; background: none; border: none;
  color: var(--v2-text-dim); cursor: pointer; display: flex; align-items: center; transition: color .15s;
}
.v2-searchbox__clear:hover { color: var(--v2-accent); }

/* ── Progress strip ──────────────────────────────────────────────────────── */
.v2-prog-strip {
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-active);
  border-radius: 14px; padding: .875rem 1.125rem; margin-bottom: .875rem;
}
.v2-prog-strip__top {
  display: flex; align-items: center; gap: .75rem; margin-bottom: .5rem; flex-wrap: wrap;
}
.v2-prog-strip__label { font-size: .8125rem; color: var(--v2-text-secondary); font-weight: 500; }
.v2-prog-strip__count { font-size: .875rem; color: var(--v2-text); font-weight: 600; margin-left: auto; }
.v2-prog-strip__badges { display: flex; gap: .375rem; }
.v2-prog-badge {
  font-size: .6875rem; font-weight: 600; padding: .125rem .5rem; border-radius: 999px;
}
.v2-prog-badge--red { background: rgba(248,113,113,.12); color: #f87171; }
.v2-prog-badge--yellow { background: rgba(252,211,77,.12); color: #fcd34d; }
.v2-prog-badge--green { background: rgba(52,211,153,.12); color: #34d399; }
.v2-progress { height: 6px; background: var(--v2-border-subtle); border-radius: 999px; overflow: hidden; }
.v2-progress__fill { height: 100%; background: var(--v2-accent); border-radius: 999px; transition: width .4s; }

/* ── Monster grid ────────────────────────────────────────────────────────── */
.v2-center-loader {
  display: flex; align-items: center; justify-content: center;
  gap: .75rem; padding: 4rem; color: var(--v2-text-secondary); font-size: .9375rem;
}
.v2-spin {
  width: 22px; height: 22px;
  border: 2px solid var(--v2-border-med); border-top-color: var(--v2-accent);
  border-radius: 50%; animation: vspin .8s linear infinite; flex-shrink: 0;
}
@keyframes vspin { to { transform: rotate(360deg); } }

.v2-mgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: .625rem;
}
.v2-mc {
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-active);
  border-radius: 12px; overflow: hidden;
  display: flex; flex-direction: column; transition: border-color .18s, box-shadow .18s;
}
.v2-mc:hover { border-color: var(--v2-border-strong); box-shadow: 0 0 20px var(--v2-hover); }
.v2-mc--done { border-color: rgba(52,211,153,.22); background: rgba(52,211,153,.03); }
.v2-mc--archi { border-color: rgba(248,113,113,.18); }
.v2-mc__img {
  position: relative; width: 100%; aspect-ratio: 1;
  background: rgba(0,0,0,.2); overflow: hidden;
}
.v2-mc__img img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
.v2-mc:hover .v2-mc__img img { transform: scale(1.06); }
.v2-mc__badge {
  position: absolute; top: 5px; right: 5px;
  width: 18px; height: 18px; border-radius: 5px;
  background: #f87171; color: white; font-size: .5625rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.v2-mc__info { padding: .5rem .625rem .375rem; flex: 1; }
.v2-mc__name {
  font-size: .8125rem; font-weight: 600; color: var(--v2-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;
}
.v2-mc__zone {
  font-size: .6875rem; color: var(--v2-text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px;
}
.v2-mc__ctrl {
  display: flex; align-items: center; justify-content: center; gap: .5rem;
  padding: .5rem .625rem; border-top: 1px solid var(--v2-border-subtle);
}
.v2-cc {
  width: 26px; height: 26px; border-radius: 7px;
  border: 1px solid var(--v2-border-med); background: var(--v2-hover);
  color: var(--v2-text-hover); font-size: 1rem; font-weight: 700; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s;
}
.v2-cc--m:hover:not(:disabled) { background: rgba(248,113,113,.15); border-color: rgba(248,113,113,.3); color: #f87171; }
.v2-cc--p:hover { background: rgba(52,211,153,.15); border-color: rgba(52,211,153,.3); color: #34d399; }
.v2-cc:disabled { opacity: .35; cursor: not-allowed; }
.v2-cv { min-width: 22px; text-align: center; font-size: 1rem; font-weight: 800; }
.v2-cv--zero { color: #f87171; }
.v2-cv--pos { color: #34d399; }
.v2-mgrid__empty {
  grid-column: 1/-1; padding: 3rem; text-align: center;
  color: var(--v2-text-dim); font-size: .9375rem;
  display: flex; flex-direction: column; align-items: center;
}

/* ── Sell Mode ───────────────────────────────────────────────────────────── */
.v2-sell { display: flex; flex-direction: column; gap: .75rem; }

/* Stats cards */
.v2-sell-stats {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: .625rem;
}
.v2-sstat {
  display: flex; align-items: flex-start; gap: .75rem;
  padding: .875rem 1rem; border-radius: 12px; border: 1px solid;
}
.v2-sstat--amber { background: var(--v2-hover); border-color: var(--v2-border-med); }
.v2-sstat--orange { background: rgba(251,146,60,.06); border-color: rgba(251,146,60,.2); }
.v2-sstat--green { background: rgba(52,211,153,.06); border-color: rgba(52,211,153,.2); }
.v2-sstat--blue { background: rgba(96,165,250,.06); border-color: rgba(96,165,250,.2); }
.v2-sstat__icon {
  width: 36px; height: 36px; flex-shrink: 0; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
}
.v2-sstat--amber .v2-sstat__icon { background: var(--v2-active-strong); color: var(--v2-accent); }
.v2-sstat--orange .v2-sstat__icon { background: rgba(251,146,60,.18); color: #fb923c; }
.v2-sstat--green .v2-sstat__icon { background: rgba(52,211,153,.18); color: #34d399; }
.v2-sstat--blue .v2-sstat__icon { background: rgba(96,165,250,.18); color: #60a5fa; }
.v2-sstat__body { flex: 1; min-width: 0; }
.v2-sstat__label { font-size: .75rem; color: var(--v2-text-secondary); font-weight: 500; margin-bottom: .125rem; }
.v2-sstat__val { font-size: 1.375rem; font-weight: 800; color: var(--v2-text); line-height: 1.2; }
.v2-sstat__sub { font-size: .6875rem; color: var(--v2-text-dim); margin-top: .125rem; }
.v2-sstat__thresh { font-size: .625rem; color: var(--v2-text-dim); margin-left: .25rem; }
.v2-sstat__pulse {
  position: absolute; top: .625rem; right: .625rem;
  width: 8px; height: 8px; background: #f87171; border-radius: 50%; animation: vpulse 1.5s infinite;
}
@keyframes vpulse { 0%,100% { opacity: 1 } 50% { opacity: .4 } }

/* Inline select inside stat card */
.v2-inline-select {
  background: rgba(0,0,0,.25); border: 1px solid var(--v2-border-med); border-radius: 6px;
  color: #a07840; font-size: .6875rem; padding: .125rem .375rem; outline: none; cursor: pointer;
}

/* Add form */
.v2-add-form {
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-border);
  border-radius: 14px; padding: .875rem 1rem;
}
.v2-add-form__title {
  display: flex; align-items: center; gap: .5rem;
  font-size: .8125rem; font-weight: 600; color: var(--v2-text-hover); margin-bottom: .75rem;
}
.v2-add-form__row { display: flex; align-items: flex-start; gap: .625rem; flex-wrap: wrap; }
.v2-autocomplete { position: relative; flex: 1; min-width: 200px; }
.v2-add-input {
  background: rgba(0,0,0,.3); border: 1px solid var(--v2-border-med); border-radius: 10px;
  padding: .5rem .875rem; color: var(--v2-text); font-size: .875rem; outline: none;
  transition: border-color .18s; width: 100%;
}
.v2-add-input:focus { border-color: var(--v2-border-focus); }
.v2-add-input::placeholder { color: var(--v2-text-dimmer); }
.v2-add-input--sm { width: 80px; flex-shrink: 0; min-width: 0; }
.v2-add-input--md { width: 140px; flex-shrink: 0; min-width: 0; }
.v2-add-input--wide { width: 100%; }

.v2-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50;
  background: var(--v2-surface-elevated);
  border: 1px solid var(--v2-border-med);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0,0,0,.4), 0 16px 40px rgba(0,0,0,.65);
  max-height: 280px; overflow-y: auto;
}
.v2-dropdown__item {
  display: flex; align-items: center; gap: .625rem;
  padding: .5rem .75rem; cursor: pointer; border: none; background: transparent;
  width: 100%; text-align: left; transition: background .12s;
}
.v2-dropdown__item:hover { background: var(--v2-border-subtle); }
.v2-dropdown__img { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.v2-dropdown__name { font-size: .875rem; color: var(--v2-text); font-weight: 500; flex: 1; }
.v2-dropdown__zone { font-size: .6875rem; color: var(--v2-text-dim); }

.v2-price-wrap { display: flex; flex-direction: column; gap: .25rem; flex-shrink: 0; }
.v2-price-hint {
  font-size: .6875rem; color: var(--v2-accent); cursor: pointer; text-decoration: underline; padding-left: .25rem;
}
.v2-price-hint:hover { color: #fbbf24; }

.v2-add-btn {
  padding: .5rem 1.125rem; border-radius: 10px;
  background: var(--v2-active-strong); border: 1px solid var(--v2-border-strong);
  color: var(--v2-text); font-size: .875rem; font-weight: 600; cursor: pointer;
  transition: all .18s; white-space: nowrap; align-self: flex-start;
}
.v2-add-btn:hover:not(:disabled) { background: var(--v2-border-strong); }
.v2-add-btn:disabled { opacity: .35; cursor: not-allowed; }

/* Sub tabs */
.v2-sell-tabs { display: flex; gap: .375rem; }
.v2-sell-tab {
  display: flex; align-items: center; gap: .375rem;
  padding: .4375rem .875rem; border-radius: 8px; border: 1px solid var(--v2-border);
  background: transparent; color: var(--v2-text-secondary); font-size: .8125rem; font-weight: 500; cursor: pointer;
  transition: all .15s;
}
.v2-sell-tab:hover { border-color: var(--v2-border-strong); color: var(--v2-text-hover); }
.v2-sell-tab--on { background: var(--v2-border-med); border-color: var(--v2-border-strong); color: var(--v2-text); }
.v2-sell-tab__badge {
  padding: .0625rem .375rem; border-radius: 999px;
  background: var(--v2-border-med); color: var(--v2-accent); font-size: .625rem; font-weight: 700;
}
.v2-sell-tab__badge--green { background: rgba(52,211,153,.2); color: #34d399; }
.v2-sell-tab__badge--red { background: rgba(248,113,113,.2); color: #f87171; }

/* Slow warning */
.v2-slow-warn {
  display: flex; align-items: flex-start; gap: .625rem;
  background: rgba(251,146,60,.07); border: 1px solid rgba(251,146,60,.22);
  border-radius: 10px; padding: .75rem 1rem;
  color: #fb923c; font-size: .8125rem;
}

/* Empty state */
.v2-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: .625rem; padding: 3rem 2rem; text-align: center;
  color: var(--v2-text-dim); font-size: .9375rem;
}
.v2-empty__sub { font-size: .8125rem; color: var(--v2-text-dimmer); }

/* Pending list */
.v2-pending-list { display: flex; flex-direction: column; gap: .5rem; }
.v2-pending-item {
  display: flex; align-items: center; gap: .75rem;
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-active);
  border-radius: 12px; padding: .625rem .875rem; transition: border-color .18s;
}
.v2-pending-item:hover { border-color: var(--v2-border-strong); }
.v2-pending-item--slow { border-color: rgba(251,146,60,.25); background: rgba(251,146,60,.04); }
.v2-pending-item--sold { border-color: rgba(52,211,153,.15); background: rgba(52,211,153,.03); }

.v2-pitem__img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.v2-pitem__info { flex: 1; min-width: 0; }
.v2-pitem__name { font-size: .875rem; font-weight: 600; color: var(--v2-text); }
.v2-pitem__date { font-size: .6875rem; color: var(--v2-text-dim); margin-top: 1px; }
.v2-pitem__slow-tag {
  display: inline-block; margin-top: 2px;
  padding: .0625rem .375rem; border-radius: 999px;
  background: rgba(251,146,60,.2); color: #fb923c; font-size: .625rem; font-weight: 700;
}

.v2-pitem__price-wrap {
  display: flex; align-items: center; gap: .375rem; flex-shrink: 0;
}
.v2-pitem__price {
  font-size: 1rem; font-weight: 700; color: var(--v2-accent); cursor: pointer;
  padding: .25rem .5rem; border-radius: 6px; transition: background .15s;
}
.v2-pitem__price:hover { background: var(--v2-active); }
.v2-pitem__price--sold { color: #34d399; cursor: default; }
.v2-pitem__price--sold:hover { background: transparent; }
.v2-pitem__edit-btn {
  background: none; border: none; color: var(--v2-text-dim); cursor: pointer; padding: .25rem;
  display: flex; align-items: center; transition: color .15s;
}
.v2-pitem__edit-btn:hover { color: var(--v2-accent); }
.v2-pitem__price-input {
  width: 100px; background: rgba(0,0,0,.4); border: 1px solid var(--v2-border-strong);
  border-radius: 7px; padding: .25rem .5rem; color: var(--v2-text); font-size: .875rem; outline: none;
}
.v2-pitem__price-ok {
  background: rgba(52,211,153,.15); border: 1px solid rgba(52,211,153,.3);
  color: #34d399; border-radius: 6px; padding: .25rem .5rem;
  cursor: pointer; font-size: .875rem; transition: background .15s;
}
.v2-pitem__price-ok:hover { background: rgba(52,211,153,.25); }
.v2-pitem__price-cancel {
  background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.2);
  color: #f87171; border-radius: 6px; padding: .25rem .5rem;
  cursor: pointer; font-size: .875rem; transition: background .15s;
}
.v2-pitem__price-cancel:hover { background: rgba(248,113,113,.2); }

.v2-pitem__actions { display: flex; align-items: center; gap: .375rem; flex-shrink: 0; }
.v2-pitem__sold-btn {
  display: flex; align-items: center; gap: .25rem;
  padding: .375rem .75rem; border-radius: 8px;
  background: rgba(52,211,153,.12); border: 1px solid rgba(52,211,153,.25);
  color: #34d399; font-size: .8125rem; font-weight: 600; cursor: pointer; transition: all .15s;
}
.v2-pitem__sold-btn:hover { background: rgba(52,211,153,.22); }
.v2-pitem__del-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  background: transparent; border: 1px solid rgba(248,113,113,.15);
  color: var(--v2-text-dim); cursor: pointer; transition: all .15s;
}
.v2-pitem__del-btn:hover { background: rgba(248,113,113,.12); border-color: rgba(248,113,113,.3); color: #f87171; }
.v2-pitem__undo-btn {
  display: flex; align-items: center; gap: .25rem;
  padding: .375rem .75rem; border-radius: 8px;
  background: var(--v2-active); border: 1px solid var(--v2-border-med);
  color: var(--v2-text-hover); font-size: .8125rem; font-weight: 500; cursor: pointer; transition: all .15s;
}
.v2-pitem__undo-btn:hover { background: var(--v2-active-strong); }

/* Analytics */
.v2-analytics { display: flex; flex-direction: column; gap: .75rem; }
.v2-atabs { display: flex; gap: .375rem; flex-wrap: wrap; }
.v2-atab {
  display: flex; align-items: center; gap: .375rem;
  padding: .375rem .875rem; border-radius: 8px; border: 1px solid var(--v2-active);
  background: transparent; color: var(--v2-text-muted); font-size: .8125rem; cursor: pointer; transition: all .15s;
}
.v2-atab:hover { border-color: var(--v2-border-strong); color: var(--v2-text-hover); }
.v2-atab--on { background: var(--v2-border); border-color: var(--v2-border-strong); color: var(--v2-text); }

.v2-analytics-bar {
  display: flex; align-items: center; gap: .5rem; flex-wrap: wrap;
  margin-bottom: .625rem;
}
.v2-analytics-bar__label { font-size: .75rem; color: var(--v2-text-dim); }

/* Ranked list */
.v2-ranked-list { display: flex; flex-direction: column; gap: .5rem; }
.v2-ranked-item {
  display: flex; align-items: center; gap: .75rem;
  background: var(--v2-hover-subtle); border: 1px solid var(--v2-active);
  border-radius: 12px; padding: .625rem .875rem; transition: border-color .18s;
}
.v2-ranked-item:hover { border-color: var(--v2-border-strong); }
.v2-rank-badge {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: .8125rem; font-weight: 800;
  background: var(--v2-active); color: var(--v2-text-secondary);
}
.v2-rank-badge--gold { background: var(--v2-border-strong); color: var(--v2-accent); }
.v2-rank-badge--silver { background: rgba(200,200,200,.2); color: #d4d4d4; }
.v2-rank-badge--bronze { background: rgba(180,100,50,.2); color: #cd7c3a; }
.v2-ranked-info { flex: 1; min-width: 0; }
.v2-ranked-bar-wrap { margin-top: .3rem; }
.v2-ranked-bar { height: 4px; background: var(--v2-border-subtle); border-radius: 999px; overflow: hidden; }
.v2-ranked-bar__fill { height: 100%; background: var(--v2-accent); border-radius: 999px; transition: width .4s; }
.v2-ranked-stats { display: flex; gap: 1rem; flex-shrink: 0; }
.v2-rstat { text-align: center; }
.v2-rstat__val { font-size: .9375rem; font-weight: 700; color: var(--v2-text); }
.v2-rstat__lbl { font-size: .625rem; color: var(--v2-text-dim); text-transform: uppercase; letter-spacing: .03em; }

/* Price trend badges */
.v2-trend-prices { display: flex; flex-direction: column; gap: .25rem; flex-shrink: 0; }
.v2-trend-prices__row { display: flex; align-items: center; gap: .5rem; }
.v2-trend-prices__lbl { font-size: .6875rem; color: var(--v2-text-dim); width: 36px; }
.v2-trend-prices__val { font-size: .8125rem; font-weight: 600; color: var(--v2-text); }
.v2-trend-badge {
  display: flex; align-items: center; gap: .3rem;
  padding: .3125rem .625rem; border-radius: 8px; font-size: .75rem; font-weight: 600; flex-shrink: 0;
}
.v2-trend-badge--up { background: rgba(52,211,153,.12); color: #34d399; border: 1px solid rgba(52,211,153,.25); }
.v2-trend-badge--down { background: rgba(248,113,113,.12); color: #f87171; border: 1px solid rgba(248,113,113,.25); }
.v2-trend-badge--stable { background: var(--v2-border-subtle); color: var(--v2-text-hover); border: 1px solid var(--v2-border-med); }

/* Inconsistencies */
.v2-incons-item {
  background: rgba(251,146,60,.04); border: 1px solid rgba(251,146,60,.18);
  border-radius: 12px; padding: .75rem .875rem; display: flex; flex-direction: column; gap: .625rem;
}
.v2-incons-item__header { display: flex; align-items: center; gap: .75rem; }
.v2-incons-range { display: flex; gap: 1rem; margin-left: auto; flex-shrink: 0; }
.v2-price-groups { display: flex; flex-wrap: wrap; gap: .375rem; }
.v2-price-group {
  display: flex; align-items: center; gap: .375rem;
  padding: .25rem .625rem; border-radius: 7px;
  background: rgba(0,0,0,.25); border: 1px solid var(--v2-active);
}
.v2-price-group__price { font-size: .8125rem; font-weight: 600; color: var(--v2-text); }
.v2-price-group__count { font-size: .75rem; color: var(--v2-text-secondary); }
.v2-incons-actions { display: flex; gap: .5rem; flex-wrap: wrap; }
.v2-ia-btn {
  padding: .375rem .75rem; border-radius: 8px; font-size: .75rem; font-weight: 600; cursor: pointer; transition: all .15s; border: 1px solid;
}
.v2-ia-btn--green { background: rgba(52,211,153,.1); border-color: rgba(52,211,153,.25); color: #34d399; }
.v2-ia-btn--green:hover { background: rgba(52,211,153,.2); }
.v2-ia-btn--blue { background: rgba(96,165,250,.1); border-color: rgba(96,165,250,.25); color: #60a5fa; }
.v2-ia-btn--blue:hover { background: rgba(96,165,250,.2); }
.v2-ia-btn--red { background: rgba(248,113,113,.1); border-color: rgba(248,113,113,.25); color: #f87171; }
.v2-ia-btn--red:hover { background: rgba(248,113,113,.2); }

/* History header */
.v2-history-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: .5rem; padding: 0 .25rem;
  font-size: .8125rem; color: var(--v2-text-secondary);
}
.v2-clear-btn {
  background: transparent; border: 1px solid rgba(248,113,113,.2);
  color: #f87171; border-radius: 7px; padding: .25rem .625rem;
  font-size: .75rem; cursor: pointer; transition: all .15s;
}
.v2-clear-btn:hover { background: rgba(248,113,113,.1); }
</style>



