<template>
  <div class="space-y-6">
    <!-- Tab Navigation -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg">
      <div class="flex border-b border-gray-700">
        <button
          @click="activeTab = 'sales'"
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeTab === 'sales'
              ? 'bg-blue-600 text-white border-b-2 border-blue-400'
              : 'text-gray-300 hover:text-white hover:bg-gray-700',
          ]"
        >
          Sales Management
        </button>
        <button
          @click="activeTab = 'analytics'"
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white border-b-2 border-blue-400'
              : 'text-gray-300 hover:text-white hover:bg-gray-700',
          ]"
        >
          Sales Analytics
        </button>
      </div>
    </div>

    <!-- Sales Management View -->
    <SalesManagement
      v-if="activeTab === 'sales'"
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
      v-if="activeTab === 'analytics'"
      :pending-items="pendingItems"
      :sold-items="soldItems"
      @select-monster-items="handleSelectMonsterItems"
      @update-prices="handleUpdatePrices"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
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
    const pendingSection = document.querySelector(
      '.bg-gray-800.border.border-gray-700.rounded-lg:has(h3:contains("Items for Sale"))'
    );
    if (pendingSection) {
      pendingSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    selectionsForSalesTab.value = [];
  });
};
</script>
