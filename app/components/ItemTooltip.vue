<!-- components/ItemTooltip.vue -->
<template>
  <div
    class="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-gray-800 border-2 border-yellow-600 rounded-lg shadow-2xl p-4 min-w-80 max-w-96 pointer-events-none z-[9999]"
  >
    <!-- Item Header -->
    <div class="flex items-center gap-3 mb-3">
      <img
        :src="item.img"
        :alt="getItemName(item)"
        class="w-12 h-12 rounded"
        @error="$event.target.src = '/placeholder-item.png'"
      />
      <div class="flex-1">
        <h3 class="text-yellow-300 font-bold text-lg">
          {{ getItemName(item) }}
        </h3>
        <p class="text-gray-300 text-sm">{{ getTypeName(item) }}</p>
        <p class="text-blue-300 text-sm">Niveau {{ item.level }}</p>
      </div>
    </div>

    <!-- Item Effects -->
    <div
      v-if="customEffects && customEffects.length > 0"
      class="space-y-1 mb-3"
    >
      <div
        v-for="effect in customEffects"
        :key="effect.effectId"
        class="text-green-300 text-sm"
      >
        {{ effect.description }}
      </div>
    </div>

    <!-- Base Effects (if no custom effects) -->
    <div
      v-else-if="item.effects && item.effects.length > 0"
      class="space-y-1 mb-3"
    >
      <div
        v-for="effect in item.effects"
        :key="effect.effectId"
        class="text-green-300 text-sm"
      >
        {{ formatEffect(effect) }}
      </div>
    </div>

    <!-- Sale Info (if provided) -->
    <div v-if="saleInfo" class="border-t border-gray-600 pt-2 mt-2 space-y-1">
      <p class="text-yellow-400 text-sm font-semibold">
        Vendu: {{ formatPrice(saleInfo.price) }} kamas
      </p>
      <p class="text-gray-400 text-xs">{{ formatDate(saleInfo.dateSold) }}</p>
      <p v-if="saleInfo.notes" class="text-gray-400 text-xs italic">
        "{{ saleInfo.notes }}"
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  customEffects: {
    type: Array,
    default: () => [],
  },
  saleInfo: {
    type: Object,
    default: null,
  },
});

const getItemName = (item) => {
  return item.name?.fr || item.name?.en || "Objet Inconnu";
};

const getTypeName = (item) => {
  return item.type?.name?.fr || item.type?.name?.en || "Type Inconnu";
};

const getItemDescription = (item) => {
  return item.description?.fr || item.description?.en || "";
};

const formatEffect = (effect) => {
  if (effect.from === effect.to) {
    return `+${effect.from} (effet ${effect.effectId})`;
  } else {
    return `${effect.from} à ${effect.to} (effet ${effect.effectId})`;
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat("fr-FR").format(price);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>
