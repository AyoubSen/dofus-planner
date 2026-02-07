<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3 py-2 text-sm rounded-theme-button border border-theme-border hover:border-theme-border-hover bg-theme-bg-secondary/50 hover:bg-theme-bg-secondary text-theme-text-secondary hover:text-theme-text-primary transition-all duration-200"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 7h18M8 7V5a4 4 0 118 0v2m-9 4h10m-8 4h6m-8 4h10a2 2 0 002-2V7H5v10a2 2 0 002 2z"
        />
      </svg>
      <span class="hidden sm:inline">Data</span>
      <svg
        class="w-3 h-3 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-64 rounded-theme-card border border-theme-border bg-theme-bg-secondary shadow-theme-lg z-50"
      >
        <div class="p-2 space-y-1">
          <button
            @click="exportBackup"
            class="w-full text-left px-3 py-2 rounded-theme-button text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary transition-all duration-200"
          >
            Export Full Backup
          </button>

          <label
            class="block w-full text-left px-3 py-2 rounded-theme-button text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary transition-all duration-200 cursor-pointer"
          >
            Import Backup (Replace)
            <input type="file" accept=".json" class="hidden" @change="onImportReplace" />
          </label>

          <label
            class="block w-full text-left px-3 py-2 rounded-theme-button text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary transition-all duration-200 cursor-pointer"
          >
            Import Backup (Merge)
            <input type="file" accept=".json" class="hidden" @change="onImportMerge" />
          </label>

          <button
            @click="restoreBackup"
            class="w-full text-left px-3 py-2 rounded-theme-button text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary transition-all duration-200"
          >
            Restore Last Backup
          </button>
        </div>

        <div
          v-if="message"
          class="px-3 py-2 border-t border-theme-border text-xs"
          :class="isError ? 'text-red-400' : 'text-emerald-400'"
        >
          {{ message }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { init, exportStore, importStore, restoreLastBackup } = useAppDataStore()
const isOpen = ref(false)
const message = ref('')
const isError = ref(false)

onMounted(() => {
  init()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    isOpen.value = false
  }
}

const setStatus = (text: string, error = false) => {
  message.value = text
  isError.value = error
  setTimeout(() => {
    message.value = ''
    isError.value = false
  }, 4000)
}

const exportBackup = () => {
  try {
    const content = exportStore()
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dofus-app-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus('Backup exported.')
  } catch (error) {
    setStatus('Failed to export backup.', true)
  }
}

const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })

const handleImport = async (event: Event, strategy: 'replace' | 'merge') => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const raw = await readFile(file)
    const result = importStore(raw, strategy)
    setStatus(result.message, !result.success)
  } catch (error) {
    setStatus('Failed to import backup.', true)
  } finally {
    input.value = ''
  }
}

const onImportReplace = async (event: Event) => {
  await handleImport(event, 'replace')
}

const onImportMerge = async (event: Event) => {
  await handleImport(event, 'merge')
}

const restoreBackup = () => {
  const ok = restoreLastBackup()
  setStatus(ok ? 'Last backup restored.' : 'No restorable backup found.', !ok)
}
</script>
