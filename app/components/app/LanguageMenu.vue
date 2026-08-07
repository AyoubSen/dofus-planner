<template>
  <UiMenu :label="$t('v2.language.label')" width="11rem">
    <template #trigger>
      <UiIcon name="globe" />
      <span class="hidden font-medium uppercase sm:inline">{{ locale }}</span>
    </template>

    <UiMenuItem
      v-for="lang in languages"
      :key="lang.code"
      :active="locale === lang.code"
      @click="switchLanguage(lang.code)"
    >
      <template #icon><span class="text-base leading-none">{{ lang.flag }}</span></template>
      {{ lang.name }}
    </UiMenuItem>
  </UiMenu>
</template>

<script setup lang="ts">
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const router = useRouter()

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
]

const switchLanguage = (code: string) => router.push(switchLocalePath(code as 'en' | 'fr'))
</script>
