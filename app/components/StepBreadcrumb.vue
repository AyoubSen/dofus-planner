<!-- components/StepBreadcrumb.vue -->
<template>
  <div class="flex items-center gap-2 text-sm">
    <template v-for="(step, index) in steps" :key="step">
      <span
        :class="[
          'px-3 py-1 rounded-full border transition-colors',
          index < currentStep
            ? 'bg-gray-800/50 text-gray-300 border-gray-700/50'
            : index === currentStep
              ? 'bg-primary-500/10 text-primary-300 border-primary-500/30'
              : 'bg-gray-700/30 text-gray-500 border-gray-600/30',
        ]"
      >
        {{ index < currentStep ? '✓' : index + 1 }} {{ step }}
      </span>
      <svg
        v-if="index < steps.length - 1"
        class="w-4 h-4 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  steps: string[]
  currentStep: number
}>()
</script>

<style scoped>
.bg-primary-500\/10 {
  background-color: rgb(249 115 22 / 0.1);
}
.text-primary-300 {
  color: #fdba74;
}
.border-primary-500\/30 {
  border-color: rgb(249 115 22 / 0.3);
}
</style>