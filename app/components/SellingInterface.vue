<template>
  <div class="space-y-8">
    <!-- Tab Navigation -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Sales Management Tab -->
      <button
        @click="activeTab = 'sales'"
        :class="[
          'group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-500',
          activeTab === 'sales'
            ? 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border-2 border-blue-500/50 shadow-xl shadow-blue-500/10'
            : 'bg-gray-800/40 border-2 border-gray-700/50 hover:border-blue-500/30 hover:bg-gray-800/60',
        ]"
      >
        <!-- Animated background -->
        <div
          :class="[
            'absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 transition-opacity duration-500',
            activeTab === 'sales' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50',
          ]"
        ></div>

        <!-- Glow effect -->
        <div
          :class="[
            'absolute -inset-px bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur transition-opacity duration-500',
            activeTab === 'sales' ? 'opacity-20' : 'opacity-0 group-hover:opacity-10',
          ]"
        ></div>

        <div class="relative z-10">
          <div class="flex items-start justify-between mb-4">
            <div
              :class="[
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500',
                activeTab === 'sales'
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30'
                  : 'bg-gray-700/50 group-hover:bg-gradient-to-br group-hover:from-blue-500/50 group-hover:to-indigo-600/50',
              ]"
            >
              <svg
                class="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>

            <!-- Selected indicator -->
            <Transition name="scale">
              <div
                v-if="activeTab === 'sales'"
                class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30"
              >
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </Transition>
          </div>

          <h3
            :class="[
              'text-2xl font-bold mb-2 transition-colors duration-300',
              activeTab === 'sales' ? 'text-blue-300' : 'text-gray-100 group-hover:text-blue-300',
            ]"
          >
            Sales Management
          </h3>
          <p
            :class="[
              'text-sm leading-relaxed transition-colors duration-300',
              activeTab === 'sales' ? 'text-blue-200/70' : 'text-gray-400 group-hover:text-gray-300',
            ]"
          >
            Add items to sell, set prices, and manage your inventory. Track pending and sold items.
          </p>

          <!-- Features -->
          <div class="flex flex-wrap gap-2 mt-4">
            <span
              class="px-2.5 py-1 bg-blue-500/10 text-blue-300 text-xs font-medium rounded-full border border-blue-500/20"
            >
              {{ pendingItems.length }} Pending
            </span>
            <span
              class="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 text-xs font-medium rounded-full border border-indigo-500/20"
            >
              Bulk Actions
            </span>
          </div>
        </div>
      </button>

      <!-- Sales Analytics Tab -->
      <button
        @click="activeTab = 'analytics'"
        :class="[
          'group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-500',
          activeTab === 'analytics'
            ? 'bg-gradient-to-br from-purple-500/20 to-pink-600/20 border-2 border-purple-500/50 shadow-xl shadow-purple-500/10'
            : 'bg-gray-800/40 border-2 border-gray-700/50 hover:border-purple-500/30 hover:bg-gray-800/60',
        ]"
      >
        <div
          :class="[
            'absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-600/10 transition-opacity duration-500',
            activeTab === 'analytics' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50',
          ]"
        ></div>

        <div
          :class="[
            'absolute -inset-px bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur transition-opacity duration-500',
            activeTab === 'analytics' ? 'opacity-20' : 'opacity-0 group-hover:opacity-10',
          ]"
        ></div>

        <div class="relative z-10">
          <div class="flex items-start justify-between mb-4">
            <div
              :class="[
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500',
                activeTab === 'analytics'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/30'
                  : 'bg-gray-700/50 group-hover:bg-gradient-to-br group-hover:from-purple-500/50 group-hover:to-pink-600/50',
              ]"
            >
              <svg
                class="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>

            <Transition name="scale">
              <div
                v-if="activeTab === 'analytics'"
                class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30"
              >
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </Transition>
          </div>

          <h3
            :class="[
              'text-2xl font-bold mb-2 transition-colors duration-300',
              activeTab === 'analytics' ? 'text-purple-300' : 'text-gray-100 group-hover:text-purple-300',
            ]"
          >
            Sales Analytics
          </h3>
          <p
            :class="[
              'text-sm leading-relaxed transition-colors duration-300',
              activeTab === 'analytics' ? 'text-purple-200/70' : 'text-gray-400 group-hover:text-gray-300',
            ]"
          >
            View your sales statistics, earnings breakdown, and performance insights.
          </p>

          <div class="flex flex-wrap gap-2 mt-4">
            <span
              class="px-2.5 py-1 bg-purple-500/10 text-purple-300 text-xs font-medium rounded-full border border-purple-500/20"
            >
              {{ soldItems.length }} Sold
            </span>
            <span
              class="px-2.5 py-1 bg-pink-500/10 text-pink-300 text-xs font-medium rounded-full border border-pink-500/20"
            >
              {{ formatKamas(totalEarnings) }} Earned
            </span>
          </div>
        </div>
      </button>
    </div>

    <!-- Content Area -->
    <Transition name="fade-slide" mode="out-in">
      <!-- Sales Management View -->
      <SalesManagement
        v-if="activeTab === 'sales'"
        key="sales"
        :server="props.server"
        :character="props.character"
        :monsters-data="props.monstersData"
        :pending-items="pendingItems"
        :sold-items="soldItems"
        :initial-selections="selectionsForSalesTab"
        @add-item="handleAddItem"
        @sell-item="handleSellItem"
        @remove-item="handleRemoveItem"
        @bulk-sell="handleBulkSell"
        @bulk-delete="handleBulkDelete"
        @update-prices="handleUpdatePrices"
        @undo-sale="handleUndoSale"
        @clear-history="handleClearHistory"
      />

      <!-- Sales Analytics View -->
      <SalesAnalytics
        v-else-if="activeTab === 'analytics'"
        key="analytics"
        :pending-items="pendingItems"
        :sold-items="soldItems"
        @select-monster-items="handleSelectMonsterItems"
        @update-prices="handleUpdatePrices"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import SalesManagement from "./SalesManagement.vue";
import SalesAnalytics from "./SalesAnalytics.vue";

const props = defineProps({
  server: {
    type: Object,
    required: true,
  },
  character: {
    type: Object,
    required: true,
  },
  monstersData: {
    type: Array,
    default: () => [],
  },
});

const activeTab = ref("sales");
const pendingItems = ref([]);
const soldItems = ref([]);
const selectionsForSalesTab = ref([]);

const totalEarnings = computed(() =>
  soldItems.value.reduce((sum, item) => sum + (item.soldPrice || 0), 0)
);

const formatKamas = (value) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  } else if (value >= 1000) {
    return (value / 1000).toFixed(0) + "K";
  }
  return value.toString();
};

const getPendingItemsKey = () =>
  `selling_pending_${props.server.id}_${props.character.id}`;
const getSoldItemsKey = () =>
  `selling_sold_${props.server.id}_${props.character.id}`;
const getPriceHistoryKey = () =>
  `selling_price_history_${props.server.id}_${props.character.id}`;

onMounted(() => {
  loadData();
});

watch([() => props.server, () => props.character], () => {
  loadData();
});

const loadData = () => {
  const pendingKey = getPendingItemsKey();
  const pendingSaved = localStorage.getItem(pendingKey);
  const loadedPending = pendingSaved ? JSON.parse(pendingSaved) : [];
  pendingItems.value = loadedPending.map((item) => ({
    ...item,
    quantity: item.quantity || 1,
  }));

  const soldKey = getSoldItemsKey();
  const soldSaved = localStorage.getItem(soldKey);
  const loadedSold = soldSaved ? JSON.parse(soldSaved) : [];
  soldItems.value = loadedSold.map((item) => ({
    ...item,
    quantity: item.quantity || 1,
  }));
};

const saveData = () => {
  localStorage.setItem(
    getPendingItemsKey(),
    JSON.stringify(pendingItems.value)
  );
  localStorage.setItem(getSoldItemsKey(), JSON.stringify(soldItems.value));
};

const savePriceHistory = (monsterId, monsterName, price) => {
  const key = getPriceHistoryKey();
  const existing = JSON.parse(localStorage.getItem(key) || "{}");
  if (!existing[monsterId]) {
    existing[monsterId] = { name: monsterName, prices: [] };
  }
  existing[monsterId].prices.push({
    price: price,
    date: new Date().toISOString(),
  });
  existing[monsterId].prices = existing[monsterId].prices.slice(-10);
  localStorage.setItem(key, JSON.stringify(existing));
};

const handleAddItem = (newItemData) => {
  for (let i = 0; i < newItemData.quantity; i++) {
    const item = {
      id: Date.now() + Math.random() + i,
      monsterId: newItemData.monsterId,
      monsterName: newItemData.monsterName.trim(),
      image_url: newItemData.image_url,
      price: newItemData.price,
      quantity: 1,
      originalPrice: newItemData.price,
      dateAdded: new Date().toISOString(),
    };
    pendingItems.value.push(item);
  }
  saveData();
};

const handleSellItem = (itemToSell) => {
  const soldItem = {
    ...itemToSell,
    dateSold: new Date().toISOString(),
    soldPrice: itemToSell.price,
  };
  if (itemToSell.monsterId) {
    savePriceHistory(
      itemToSell.monsterId,
      itemToSell.monsterName,
      itemToSell.price
    );
  }
  soldItems.value.push(soldItem);
  pendingItems.value = pendingItems.value.filter((p) => p.id !== itemToSell.id);
  saveData();
};

const handleRemoveItem = (itemId) => {
  pendingItems.value = pendingItems.value.filter((item) => item.id !== itemId);
  saveData();
};

const handleBulkSell = (itemIds) => {
  const itemsToSell = itemIds
    .map((itemId) => pendingItems.value.find((i) => i.id === itemId))
    .filter(Boolean);

  itemsToSell.forEach((item) => {
    const soldItem = {
      ...item,
      dateSold: new Date().toISOString(),
      soldPrice: item.price,
    };
    if (item.monsterId) {
      savePriceHistory(item.monsterId, item.monsterName, item.price);
    }
    soldItems.value.push(soldItem);
  });

  pendingItems.value = pendingItems.value.filter(
    (item) => !itemIds.includes(item.id)
  );
  saveData();
};

const handleBulkDelete = (itemIds) => {
  pendingItems.value = pendingItems.value.filter(
    (item) => !itemIds.includes(item.id)
  );
  saveData();
};

const handleUpdatePrices = (itemsToUpdate) => {
  itemsToUpdate.forEach((updatedItem) => {
    const index = pendingItems.value.findIndex((p) => p.id === updatedItem.id);
    if (index !== -1) {
      pendingItems.value[index] = updatedItem;
    }
  });
  saveData();
};

const handleUndoSale = (soldItem) => {
  const pendingItem = {
    ...soldItem,
    id: Date.now() + Math.random(),
    price: soldItem.soldPrice,
    dateAdded: new Date().toISOString(),
  };
  delete pendingItem.dateSold;
  delete pendingItem.soldPrice;

  pendingItems.value.push(pendingItem);
  soldItems.value = soldItems.value.filter((item) => item.id !== soldItem.id);
  saveData();
};

const handleClearHistory = () => {
  soldItems.value = [];
  saveData();
};

const handleSelectMonsterItems = (monsterName) => {
  const monsterItems = pendingItems.value
    .filter((item) => item.monsterName === monsterName)
    .map((item) => item.id);

  selectionsForSalesTab.value = monsterItems;
  activeTab.value = "sales";

  nextTick(() => {
    selectionsForSalesTab.value = [];
  });
};
</script>

<style scoped>
/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0);
}
</style>