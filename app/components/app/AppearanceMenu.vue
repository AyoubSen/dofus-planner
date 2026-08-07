<template>
  <UiMenu :label="$t('v2.theme.label')" width="12rem" :close-on-select="false" hide-chevron>
    <template #trigger>
      <UiIcon :name="resolved === 'light' ? 'sun' : 'moon'" />
    </template>

    <p class="px-2.5 pt-1.5 pb-1 text-xs font-medium tracking-wide text-subtle uppercase">
      {{ $t('v2.theme.label') }}
    </p>
    <UiMenuItem
      v-for="option in themeOptions"
      :key="option.id"
      :active="preference === option.id"
      @click="setTheme(option.id)"
    >
      <template #icon>
        <UiIcon :name="option.id === 'light' ? 'sun' : option.id === 'dark' ? 'moon' : 'monitor'" />
      </template>
      {{ $t(option.labelKey) }}
    </UiMenuItem>

    <div class="my-1 border-t border-line" />

    <p class="px-2.5 pt-1.5 pb-1 text-xs font-medium tracking-wide text-subtle uppercase">
      {{ $t('v2.theme.textSize') }}
    </p>
    <div class="px-1.5 pb-1">
      <UiSegmented
        v-model="scaleModel"
        :options="scaleOptions"
        size="sm"
        block
        :aria-label="$t('v2.theme.textSize')"
      />
    </div>
  </UiMenu>
</template>

<script setup lang="ts">
const { preference, resolved, themeOptions, setTheme } = useAppTheme()
const { currentScale, fontScales, setFontScale } = useFontScale()

const scaleOptions = fontScales.map(s => ({ label: s.id.toUpperCase(), value: s.id }))

const scaleModel = computed({
  get: () => currentScale.value,
  set: (value) => setFontScale(value as typeof currentScale.value),
})
</script>
