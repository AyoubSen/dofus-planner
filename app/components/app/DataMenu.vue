<template>
  <UiMenu :label="$t('v2.data.label')" width="15rem" :close-on-select="false">
    <template #trigger>
      <UiIcon name="database" />
      <span class="hidden sm:inline">{{ $t('v2.data.label') }}</span>
    </template>

    <template #default="{ close }">
      <UiMenuItem @click="exportBackup(); close()">
        <template #icon><UiIcon name="download" /></template>
        {{ $t('v2.data.export') }}
      </UiMenuItem>

      <UiMenuItem as="label">
        <template #icon><UiIcon name="upload" /></template>
        {{ $t('v2.data.importMerge') }}
        <input type="file" accept=".json" class="hidden" @change="onImport($event, 'merge')">
      </UiMenuItem>

      <UiMenuItem as="label" danger>
        <template #icon><UiIcon name="upload" /></template>
        {{ $t('v2.data.importReplace') }}
        <input type="file" accept=".json" class="hidden" @change="onImport($event, 'replace')">
      </UiMenuItem>

      <div class="my-1 border-t border-line" />

      <UiMenuItem @click="restoreBackup()">
        <template #icon><UiIcon name="database" /></template>
        {{ $t('v2.data.restore') }}
      </UiMenuItem>

      <p v-if="message" :class="['border-t border-line px-2.5 pt-2 pb-1 text-xs', isError ? 'text-negative' : 'text-positive']">
        {{ message }}
      </p>
    </template>
  </UiMenu>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { init, exportStore, importStore, restoreLastBackup } = useAppDataStore()

const message = ref('')
const isError = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

const setStatus = (text: string, error = false) => {
  message.value = text
  isError.value = error
  clearTimeout(timer)
  timer = setTimeout(() => { message.value = '' }, 4000)
}

const exportBackup = () => {
  try {
    const blob = new Blob([exportStore()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dofus-app-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus(t('v2.data.exported'))
  } catch {
    setStatus(t('v2.data.exportFailed'), true)
  }
}

const onImport = async (event: Event, strategy: 'replace' | 'merge') => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Replacing wipes everything that isn't in the file — worth one confirmation.
  if (strategy === 'replace' && !window.confirm(t('v2.data.confirmReplace'))) {
    input.value = ''
    return
  }

  try {
    const raw = await file.text()
    const result = importStore(raw, strategy)
    setStatus(result.message, !result.success)
  } catch {
    setStatus(t('v2.data.importFailed'), true)
  } finally {
    input.value = ''
  }
}

const restoreBackup = () => {
  const ok = restoreLastBackup()
  setStatus(ok ? t('v2.data.restored') : t('v2.data.noBackup'), !ok)
}

onMounted(init)
onUnmounted(() => clearTimeout(timer))
</script>
