<template>
  <div v-if="hasContext" class="flex flex-col gap-5">
    <UiSegmented
      v-model="activeMainTab"
      :options="mainTabOptions"
      block
      :aria-label="$t('v2.brisage.sections.sessionHistory')"
    />

    <!-- ── Realized history ─────────────────────────────────────────────── -->
    <template v-if="activeMainTab === 'history'">
      <UiStatRow min="10rem">
        <UiStat :label="$t('v2.brisage.stats.sessions')" :value="sessions.length" />
        <UiStat :label="$t('v2.brisage.stats.itemsLogged')" :value="totalItemsLogged" />
        <UiStat :label="$t('v2.brisage.stats.totalPL')">
          <UiMoney :value="totalPL" signed short size="lg" />
        </UiStat>
        <UiStat :label="$t('v2.brisage.stats.avgSessionPL')">
          <UiMoney :value="avgSessionPL" signed short size="lg" />
        </UiStat>
      </UiStatRow>

      <UiSegmented
        :model-value="brisageMode"
        :options="modeOptions"
        size="sm"
        block
        :aria-label="$t('v2.brisage.sections.sessionHistory')"
        @update:model-value="onModeChange"
      />

      <!-- ── Builder ────────────────────────────────────────────────────── -->
      <div v-if="brisageMode === 'builder'" class="flex flex-col gap-4">
        <UiCard :title="$t('v2.brisage.sections.sessionBuilder')">
          <div class="grid gap-3 sm:grid-cols-2">
            <UiField :label="$t('v2.brisage.fields.date')">
              <UiDateInput v-model="draftSession.date" />
            </UiField>

            <UiField
              :label="$t('v2.brisage.fields.focusCategory')"
              :hint="$t('v2.brisage.fields.focusCategoryHint')"
            >
              <div ref="categoryPickerEl" class="relative">
                <button
                  type="button"
                  class="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-line bg-sunken px-2.5 text-sm transition-colors hover:border-line-strong"
                  :class="selectedCategoryOptions.length ? 'text-ink' : 'text-subtle'"
                  @click="categoryPickerOpen = !categoryPickerOpen"
                >
                  <span class="truncate">{{ categoryPickerLabel }}</span>
                  <UiIcon
                    name="chevronDown"
                    :class="['shrink-0 transition-transform', categoryPickerOpen && 'rotate-180']"
                  />
                </button>
                <div
                  v-if="categoryPickerOpen"
                  class="absolute top-full left-0 z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-line bg-raised p-1 shadow-md"
                >
                  <label
                    v-for="option in BRISAGE_CATEGORY_OPTIONS"
                    :key="option.typeId"
                    class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-ink transition-colors hover:bg-sunken"
                  >
                    <input
                      type="checkbox"
                      class="size-4 shrink-0 accent-[var(--c-accent)]"
                      :checked="draftSession.categoryTypeIds.includes(option.typeId)"
                      @change="toggleCategoryType(option.typeId)"
                    >
                    <span class="truncate">{{ option.label }}</span>
                  </label>
                </div>
              </div>
            </UiField>

            <!-- Min and max are one decision, so they read as one control. -->
            <UiField :label="$t('v2.brisage.fields.levelRange')">
              <div class="flex items-center gap-2">
                <UiNumberInput
                  v-model="draftSession.levelMin"
                  :min="1"
                  :placeholder="$t('v2.brisage.fields.levelMin')"
                />
                <span class="shrink-0 text-sm text-subtle" aria-hidden="true">–</span>
                <UiNumberInput
                  v-model="draftSession.levelMax"
                  :min="1"
                  :placeholder="$t('v2.brisage.fields.levelMax')"
                />
              </div>
            </UiField>

            <UiField :label="$t('v2.brisage.fields.sessionNotes')">
              <UiInput v-model="draftSession.notes" :placeholder="$t('v2.brisage.placeholders.sessionNotes')" />
            </UiField>
          </div>

          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <UiField :label="$t('v2.brisage.fields.startingKamas')">
              <UiNumberInput v-model="draftSession.startingKamas" />
            </UiField>
            <UiField :label="$t('v2.brisage.fields.endingKamas')">
              <UiNumberInput v-model="draftSession.endingKamas" />
            </UiField>
            <UiField :label="$t('v2.brisage.fields.collectedKamas')">
              <UiNumberInput v-model="draftSession.externalDelta" />
            </UiField>
          </div>

          <dl class="mt-4 grid gap-x-6 gap-y-1.5 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-3">
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-xs text-subtle">{{ $t('v2.brisage.summary.draftItems') }}</dt>
              <dd class="tabular text-sm text-ink">{{ draftItems.length }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-xs text-subtle">{{ $t('v2.brisage.summary.craftTotal') }}</dt>
              <dd><UiMoney :value="draftTotals.craft" short size="sm" /></dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-xs text-subtle">{{ $t('v2.brisage.summary.realizedValue') }}</dt>
              <dd><UiMoney :value="draftTotals.realized" short size="sm" /></dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-xs text-subtle">{{ $t('v2.brisage.summary.sessionPL') }}</dt>
              <dd><UiMoney :value="draftTotals.profit" signed short size="sm" /></dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-xs text-subtle">{{ $t('v2.brisage.summary.expectedEndKamas') }}</dt>
              <dd><UiMoney :value="draftTotals.expectedEndKamas" short size="sm" /></dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-xs text-subtle">{{ $t('v2.brisage.summary.bankrollDelta') }}</dt>
              <dd><UiMoney :value="draftTotals.bankrollDelta" signed short size="sm" /></dd>
            </div>
          </dl>
        </UiCard>

        <!-- Add items -->
        <UiCard :title="$t('v2.brisage.sections.addItems')">
          <template #actions>
            <UiButton
              size="sm"
              :disabled="!canLoadBatch"
              :loading="loadingBatchResults"
              @click="loadCategoryBatch"
            >
              {{ $t('v2.brisage.actions.loadMatchingItems') }}
            </UiButton>
          </template>

          <p class="mb-3 text-xs text-subtle">{{ $t('v2.brisage.messages.batchHelp') }}</p>

          <div ref="searchAreaEl">
            <UiInput v-model="search" :placeholder="$t('v2.common.searchItems')" @update:model-value="onSearchInput">
              <template #prefix><UiIcon name="search" /></template>
              <template v-if="search" #suffix>
                <button
                  type="button"
                  class="text-subtle transition-colors hover:text-ink"
                  :aria-label="$t('v2.common.clearSearch')"
                  @click="clearSearch"
                >
                  <UiIcon name="close" />
                </button>
              </template>
            </UiInput>

            <div v-if="searching" class="mt-3 flex flex-col gap-2">
              <UiSkeleton v-for="i in 3" :key="i" height="3rem" />
            </div>

            <div v-else-if="results.length" class="mt-3 flex flex-col gap-1">
              <button
                v-for="item in results"
                :key="item.id"
                type="button"
                class="flex items-center gap-3 rounded-md border border-line bg-surface p-2 text-left transition-colors hover:border-line-strong"
                @click="addItemToDraft(item)"
              >
                <img
                  :src="getItemImg(item)"
                  :alt="''"
                  class="size-9 shrink-0 rounded-md bg-sunken object-contain"
                  @error="onImgErr"
                >
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm text-ink">{{ item.name?.fr ?? item.id }}</div>
                  <div class="truncate text-xs text-subtle">
                    {{ item.type?.name?.fr ?? '' }}
                    <span class="tabular">· {{ $t('monsters.level', { level: item.level ?? '?' }) }}</span>
                  </div>
                </div>
                <span class="shrink-0 text-xs text-accent">{{ $t('v2.brisage.actions.add') }}</span>
              </button>
            </div>

            <p v-else-if="search" class="mt-3 text-xs text-subtle">
              {{ $t('v2.brisage.messages.noItemsFound', { search }) }}
            </p>
          </div>
        </UiCard>

        <!-- Draft items -->
        <UiEmptyState v-if="!draftItems.length" :title="$t('v2.brisage.messages.emptyDraft')">
          <template #icon><UiIcon name="brisage" /></template>
        </UiEmptyState>

        <UiCard v-for="draftItem in draftItems" v-else :key="draftItem.id">
          <div class="flex flex-wrap items-start gap-3">
            <img
              :src="getItemImg(draftItem.item)"
              :alt="''"
              class="size-10 shrink-0 rounded-md bg-sunken object-contain"
              @error="onImgErr"
            >
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-semibold text-ink">
                {{ draftItem.item?.name?.fr ?? draftItem.itemId }}
              </div>
              <div class="truncate text-xs text-subtle">
                {{ draftItem.item?.type?.name?.fr ?? '' }}
                <span class="tabular">· {{ $t('monsters.level', { level: draftItem.item?.level ?? '?' }) }}</span>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <UiButton variant="ghost" size="sm" @click="toggleDraftItem(draftItem.id)">
                {{ isDraftItemExpanded(draftItem.id) ? $t('v2.brisage.actions.hideDetails') : $t('v2.brisage.actions.editDetails') }}
              </UiButton>
              <UiButton
                variant="danger"
                size="sm"
                icon
                :aria-label="$t('v2.brisage.actions.remove')"
                @click="removeDraftItem(draftItem.id)"
              >
                <UiIcon name="trash" />
              </UiButton>
            </div>
          </div>

          <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
            <span>{{ t('v2.brisage.labels.runCount', { count: draftItem.runs.length }) }}</span>
            <span class="tabular">{{ $t('v2.brisage.labels.runCountShort', { count: itemQuantityTotal(draftItem) }) }}</span>
            <span>{{ $t('v2.brisage.summary.craft') }} <UiMoney :value="itemCraftTotal(draftItem)" short size="sm" /></span>
            <span>{{ $t('v2.brisage.summary.realized') }} <UiMoney :value="itemRealizedTotal(draftItem)" short size="sm" /></span>
            <UiMoney :value="itemProfit(draftItem)" signed short size="sm" />
          </div>

          <div v-if="isDraftItemExpanded(draftItem.id)" class="mt-4 flex flex-col gap-4 border-t border-line pt-4">
            <!-- Runs -->
            <div
              v-for="(run, runIndex) in draftItem.runs"
              :key="run.id"
              class="rounded-lg border border-line bg-sunken p-3"
            >
              <div class="mb-3 flex items-center gap-3">
                <h3 class="flex-1 text-xs font-semibold tracking-wide text-muted uppercase">
                  {{ $t('v2.brisage.labels.runNumber', { index: runIndex + 1 }) }}
                </h3>
                <UiButton variant="ghost" size="sm" @click="removeRunFromDraftItem(draftItem.id, run.id)">
                  {{ $t('v2.brisage.actions.removeRun') }}
                </UiButton>
              </div>

              <div class="grid gap-3 sm:grid-cols-4">
                <UiField :label="$t('v2.brisage.fields.qtyCrafted')">
                  <UiNumberInput v-model="run.quantity" :min="1" size="sm" />
                </UiField>
                <UiField :label="$t('v2.brisage.fields.kamasBeforeBuying')">
                  <UiNumberInput v-model="run.buyStartKamas" :min="0" size="sm" />
                </UiField>
                <UiField :label="$t('v2.brisage.fields.kamasAfterBuying')">
                  <UiNumberInput v-model="run.buyEndKamas" :min="0" size="sm" />
                </UiField>
                <UiField :label="$t('v2.brisage.summary.runCraftCost')">
                  <div class="flex h-8 items-center rounded-md border border-dashed border-line px-2.5">
                    <UiMoney :value="runCraftCost(run)" short size="sm" />
                  </div>
                </UiField>
              </div>

              <!-- Rune outputs. These are the only place rune value is entered;
                   the run totals below are read out of them. -->
              <div class="mt-3 rounded-md border border-line bg-surface p-3">
                <div class="flex flex-wrap items-center gap-3">
                  <h4 class="min-w-0 flex-1 text-xs font-semibold text-ink">
                    {{ $t('v2.brisage.labels.runeOutputs') }}
                  </h4>
                  <UiButton size="sm" @click="addRuneOutputToRun(run)">
                    <template #icon><UiIcon name="plus" /></template>
                    {{ $t('v2.brisage.actions.addRune') }}
                  </UiButton>
                </div>

                <p v-if="!run.runeOutputs.length" class="mt-2 text-xs text-subtle">
                  {{ $t('v2.brisage.messages.noRuneOutputs') }}
                </p>

                <div
                  v-for="output in run.runeOutputs"
                  :key="output.id"
                  class="mt-2 grid items-end gap-2 border-t border-line pt-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_minmax(0,1.2fr)_auto]"
                >
                  <UiField :label="$t('v2.brisage.fields.rune')">
                    <UiSelect
                      :model-value="output.runeId"
                      :options="runeOptions"
                      size="sm"
                      :placeholder="$t('v2.brisage.placeholders.selectRune')"
                      @update:model-value="setRuneOutput(run, output, $event)"
                    />
                  </UiField>
                  <UiField :label="$t('v2.brisage.fields.quantityGot')">
                    <UiNumberInput
                      v-model="output.quantity"
                      :min="0"
                      size="sm"
                      @update:model-value="refreshRunRuneValues(run)"
                    />
                  </UiField>
                  <UiField :label="$t('v2.brisage.fields.soldQuantity')">
                    <UiNumberInput
                      v-model="output.soldQuantity"
                      :min="0"
                      size="sm"
                      @update:model-value="refreshRunRuneValues(run)"
                    />
                  </UiField>
                  <UiField :label="$t('v2.brisage.fields.soldValue')">
                    <UiNumberInput
                      v-model="output.actualSoldValue"
                      :min="0"
                      size="sm"
                      @update:model-value="refreshRunRuneValues(run)"
                    />
                  </UiField>
                  <div class="flex flex-col gap-0.5 text-xs">
                    <!-- Nothing to say about a price until a rune is chosen. -->
                    <span v-if="outputPriceState(output).kind !== 'none'" :class="outputPriceTone(output)">
                      <template v-if="outputPriceState(output).kind === 'missing'">
                        {{ outputPriceState(output).label }}
                      </template>
                      <template v-else>
                        {{ $t('v2.brisage.labels.unitPrice') }}
                        <UiMoney :value="outputUnitPrice(output)" short size="sm" />
                        <span v-if="outputPriceState(output).label"> · {{ outputPriceState(output).label }}</span>
                      </template>
                    </span>
                    <span class="text-subtle">
                      {{ $t('v2.brisage.labels.outputPaperValue') }}
                      <UiMoney :value="output.theoreticalValue" short size="sm" />
                    </span>
                  </div>
                  <UiButton
                    variant="danger"
                    size="sm"
                    icon
                    :aria-label="$t('v2.brisage.actions.remove')"
                    @click="removeRuneOutputFromRun(run, output.id)"
                  >
                    <UiIcon name="trash" />
                  </UiButton>
                </div>

                <UiDropZone
                  class="mt-3"
                  size="sm"
                  :label="$t('v2.brisage.capture.soldValue')"
                  :loading="runCaptureId === run.id"
                  @image="captureRunSoldValue(run, $event)"
                />
              </div>

              <UiField :label="$t('v2.brisage.fields.saleNotes')" class="mt-3">
                <UiInput v-model="run.saleNotes" size="sm" :placeholder="$t('v2.brisage.placeholders.saleNotes')" />
              </UiField>

              <label class="mt-3 flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input v-model="run.soldConfirmed" type="checkbox" class="size-4 accent-[var(--c-accent)]">
                {{ $t('v2.brisage.labels.soldConfirmed') }}
              </label>

              <UiField :label="$t('v2.brisage.fields.runNote')" class="mt-3">
                <UiInput v-model="run.notes" size="sm" :placeholder="$t('v2.brisage.placeholders.runNote')" />
              </UiField>

              <dl class="mt-3 grid gap-x-6 gap-y-1.5 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-4">
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-xs text-subtle">{{ $t('v2.brisage.labels.outputPaperValue') }}</dt>
                  <dd><UiMoney :value="runRuneOutputTheoreticalValue(run)" short size="sm" /></dd>
                </div>
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-xs text-subtle">{{ $t('v2.brisage.labels.outputSoldValue') }}</dt>
                  <dd><UiMoney :value="runRuneOutputSoldValue(run)" short size="sm" /></dd>
                </div>
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-xs text-subtle">{{ $t('v2.brisage.labels.paperProfit') }}</dt>
                  <dd><UiMoney :value="runPaperProfit(run)" signed short size="sm" /></dd>
                </div>
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-xs text-subtle">{{ $t('v2.brisage.labels.realizedProfit') }}</dt>
                  <dd><UiMoney :value="runRealizedProfit(run)" signed short size="sm" /></dd>
                </div>
                <div v-if="run.quantity > 0" class="flex items-baseline justify-between gap-3">
                  <dt class="text-xs text-subtle">{{ $t('v2.brisage.summary.avgPerCopy') }}</dt>
                  <dd><UiMoney :value="Math.round(runRealizedProfit(run) / run.quantity)" short size="sm" /></dd>
                </div>
              </dl>
            </div>

            <UiField :label="$t('v2.brisage.fields.itemNote')">
              <UiInput v-model="draftItem.notes" :placeholder="$t('v2.brisage.placeholders.itemNote')" />
            </UiField>

            <div>
              <UiButton size="sm" @click="addRunToDraftItem(draftItem.id)">
                <template #icon><UiIcon name="plus" /></template>
                {{ $t('v2.brisage.actions.addAnotherRun') }}
              </UiButton>
            </div>
          </div>
        </UiCard>

        <!-- Resource checklist -->
        <UiCard :title="$t('v2.brisage.sections.resourceChecklist')">
          <template #actions>
            <UiButton variant="ghost" size="sm" @click="showDraftResourceChecklist = !showDraftResourceChecklist">
              {{ showDraftResourceChecklist ? $t('v2.brisage.actions.hide') : $t('v2.brisage.actions.show') }}
            </UiButton>
            <UiButton
              v-if="showDraftResourceChecklist"
              size="sm"
              :disabled="draftItems.length === 0"
              :loading="recipeChecklistState.isLoading"
              @click="fetchRecipeChecklist"
            >
              {{ $t('v2.brisage.actions.fetchRecipesForDraft') }}
            </UiButton>
          </template>

          <template v-if="showDraftResourceChecklist">
            <p class="text-xs text-subtle">{{ $t('v2.brisage.messages.recipeHelp') }}</p>
            <p v-if="recipeChecklistState.error" class="mt-2 text-xs text-negative">
              {{ recipeChecklistState.error }}
            </p>

            <UiSegmented
              v-if="draftResourceChecklist.length"
              v-model="resourceChecklistView"
              :options="resourceViewOptions"
              size="sm"
              class="mt-3"
              :aria-label="$t('v2.brisage.labels.resourceViewMode')"
            />

            <div v-if="draftResourceChecklist.length && resourceChecklistView === 'all'" class="mt-3 flex flex-col gap-1">
              <label
                v-for="resource in draftResourceChecklist"
                :key="resource.id"
                class="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-raised"
              >
                <input
                  type="checkbox"
                  class="size-4 shrink-0 accent-[var(--c-accent)]"
                  :checked="resource.isDone"
                  @change="toggleDraftResourceDone(resource.id)"
                >
                <img
                  v-if="resource.image"
                  :src="resource.image"
                  :alt="''"
                  class="size-7 shrink-0 rounded-md bg-sunken object-contain"
                  @error="onImgErr"
                >
                <div v-else class="size-7 shrink-0 rounded-md bg-sunken" />
                <div class="min-w-0 flex-1">
                  <div :class="['truncate text-sm', resource.isDone ? 'text-subtle line-through' : 'text-ink']">
                    {{ resource.name }}
                  </div>
                  <div class="truncate text-xs text-subtle">
                    {{ resource.typeName ?? $t('v2.brisage.common.resource') }}
                  </div>
                </div>
                <span class="tabular shrink-0 text-sm text-muted">{{ resource.totalQuantity }}</span>
              </label>
            </div>

            <div v-else-if="draftResourceChecklist.length" class="mt-3 flex flex-col gap-3">
              <div v-for="group in draftResourceChecklistByItem" :key="group.itemKey">
                <div class="mb-1.5 flex items-center gap-2">
                  <img
                    v-if="group.image"
                    :src="group.image"
                    :alt="''"
                    class="size-7 shrink-0 rounded-md bg-sunken object-contain"
                    @error="onImgErr"
                  >
                  <div v-else class="size-7 shrink-0 rounded-md bg-sunken" />
                  <div class="min-w-0">
                    <div class="truncate text-sm font-medium text-ink">{{ group.itemName }}</div>
                    <div class="tabular truncate text-xs text-subtle">
                      {{ $t('v2.brisage.labels.craftedQuantity', { quantity: group.quantity }) }}
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-1 border-l border-line pl-3">
                  <label
                    v-for="resource in group.resources"
                    :key="`${group.itemKey}-${resource.id}`"
                    class="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-raised"
                  >
                    <input
                      type="checkbox"
                      class="size-4 shrink-0 accent-[var(--c-accent)]"
                      :checked="resource.isDone"
                      @change="toggleDraftResourceDone(resource.id)"
                    >
                    <img
                      v-if="resource.image"
                      :src="resource.image"
                      :alt="''"
                      class="size-7 shrink-0 rounded-md bg-sunken object-contain"
                      @error="onImgErr"
                    >
                    <div v-else class="size-7 shrink-0 rounded-md bg-sunken" />
                    <div class="min-w-0 flex-1">
                      <div :class="['truncate text-sm', resource.isDone ? 'text-subtle line-through' : 'text-ink']">
                        {{ resource.name }}
                      </div>
                      <div class="truncate text-xs text-subtle">
                        {{ resource.typeName ?? $t('v2.brisage.common.resource') }}
                      </div>
                    </div>
                    <span class="tabular shrink-0 text-sm text-muted">{{ resource.totalQuantity }}</span>
                  </label>
                </div>
              </div>
            </div>
          </template>
        </UiCard>

        <div class="flex flex-wrap items-center gap-2">
          <UiButton size="sm" @click="showSessionHistory">
            {{ $t('v2.crafting.actions.backToSessions') }}
          </UiButton>
          <UiButton variant="primary" size="sm" :disabled="draftItems.length === 0" @click="saveSession">
            {{ editingSessionId ? $t('v2.brisage.actions.updateSession') : $t('v2.brisage.actions.saveSession') }}
          </UiButton>
        </div>
      </div>

      <!-- ── Session history ────────────────────────────────────────────── -->
      <template v-else>
        <UiEmptyState
          v-if="sessions.length === 0"
          :title="$t('v2.brisage.messages.noSessions')"
          :description="$t('v2.brisage.messages.noSessionsHint')"
        >
          <template #icon><UiIcon name="brisage" /></template>
          <template #action>
            <UiButton variant="primary" size="sm" @click="startSessionBuilder">
              {{ $t('v2.brisage.sections.sessionBuilder') }}
            </UiButton>
          </template>
        </UiEmptyState>

        <div v-else class="flex flex-col gap-3">
          <UiToolbar>
            <template #filters>
              <span class="text-xs text-subtle">{{ $t('v2.brisage.sort.label') }}</span>
              <UiSegmented
                v-model="sessionSort"
                :options="sessionSortOptions"
                size="sm"
                :aria-label="$t('v2.brisage.sort.label')"
              />
            </template>
          </UiToolbar>

          <UiCard v-for="session in sortedSessions" :key="session.id">
            <div class="flex flex-wrap items-start gap-3">
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold text-ink">
                  {{ session.categoryLabel || $t('v2.brisage.labels.generalSession') }}
                </div>
                <div class="truncate text-xs text-subtle">
                  {{ describeSessionScope(session) }} · {{ formatDisplayDate(session.date) }}
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <UiButton variant="ghost" size="sm" @click="openSessionEditor(session.id)">
                  {{ $t('v2.brisage.actions.edit') }}
                </UiButton>
                <UiButton variant="ghost" size="sm" @click="toggleSession(session.id)">
                  {{ isSessionExpanded(session.id) ? $t('v2.brisage.actions.hideDetails') : $t('v2.brisage.actions.showDetails') }}
                </UiButton>
                <UiButton
                  variant="danger"
                  size="sm"
                  icon
                  :aria-label="$t('v2.brisage.actions.deleteSession')"
                  @click="deleteSession(session.id)"
                >
                  <UiIcon name="trash" />
                </UiButton>
              </div>
            </div>

            <dl class="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt class="text-xs text-subtle">{{ $t('v2.brisage.summary.craftTotal') }}</dt>
                <dd class="mt-0.5"><UiMoney :value="sessionTotals(session).craft" short size="sm" /></dd>
              </div>
              <div>
                <dt class="text-xs text-subtle">{{ $t('v2.brisage.summary.totalItems') }}</dt>
                <dd class="tabular mt-0.5 text-sm text-ink">{{ sessionQuantityTotal(session) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-subtle">{{ $t('v2.brisage.summary.realizedValue') }}</dt>
                <dd class="mt-0.5"><UiMoney :value="sessionTotals(session).realized" short size="sm" /></dd>
              </div>
              <div>
                <dt class="text-xs text-subtle">{{ $t('v2.brisage.summary.expectedEndKamas') }}</dt>
                <dd class="mt-0.5"><UiMoney :value="sessionTotals(session).expectedEndKamas" short size="sm" /></dd>
              </div>
            </dl>

            <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
              <span>
                {{ $t('v2.brisage.summary.sessionPL') }}
                <UiMoney :value="sessionTotals(session).profit" signed short size="sm" />
              </span>
              <span>
                {{ $t('v2.brisage.summary.margin') }}
                <span :class="['tabular', sessionMargin(session) >= 0 ? 'text-positive' : 'text-negative']">
                  {{ sessionMargin(session) >= 0 ? '+' : '' }}{{ sessionMargin(session) }}%
                </span>
              </span>
              <span>
                {{ $t('v2.brisage.summary.bankrollDelta') }}
                <UiMoney :value="sessionTotals(session).bankrollDelta" signed short size="sm" />
              </span>
            </div>

            <template v-if="isSessionExpanded(session.id)">
              <div class="mt-3 flex flex-col gap-2 border-t border-line pt-3">
                <div
                  v-for="item in session.items"
                  :key="item.id"
                  class="flex flex-wrap items-center gap-3 rounded-md border border-line bg-sunken p-2.5"
                >
                  <img
                    :src="getItemImg(item.item)"
                    :alt="''"
                    class="size-8 shrink-0 rounded-md bg-surface object-contain"
                    @error="onImgErr"
                  >
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm text-ink">{{ item.item?.name?.fr ?? item.itemId }}</div>
                    <div class="flex flex-wrap items-center gap-x-2 text-xs text-subtle">
                      <span>{{ t('v2.brisage.labels.runCount', { count: item.runs.length }) }}</span>
                      <span class="tabular">· {{ $t('v2.brisage.labels.runCountShort', { count: itemQuantityTotal(item) }) }}</span>
                      <span>· {{ $t('v2.brisage.summary.cost') }} <UiMoney :value="itemCraftTotal(item)" short size="sm" /></span>
                      <span>· {{ $t('v2.brisage.summary.realized') }} <UiMoney :value="itemRealizedTotal(item)" short size="sm" /></span>
                    </div>
                  </div>
                  <UiMoney :value="itemProfit(item)" signed short size="sm" />
                </div>
              </div>

              <div v-if="session.resourceChecklist?.length" class="mt-3 flex flex-col gap-1 border-t border-line pt-3">
                <div
                  v-for="resource in session.resourceChecklist"
                  :key="resource.id"
                  class="flex items-center gap-3 px-2 py-1"
                >
                  <UiIcon v-if="resource.isDone" name="check" class="shrink-0 text-positive" />
                  <span v-else class="w-[1em] shrink-0 text-center text-subtle">·</span>
                  <img
                    v-if="resource.image"
                    :src="resource.image"
                    :alt="''"
                    class="size-7 shrink-0 rounded-md bg-sunken object-contain"
                    @error="onImgErr"
                  >
                  <div v-else class="size-7 shrink-0 rounded-md bg-sunken" />
                  <div class="min-w-0 flex-1">
                    <div :class="['truncate text-sm', resource.isDone ? 'text-subtle line-through' : 'text-ink']">
                      {{ resource.name }}
                    </div>
                    <div class="truncate text-xs text-subtle">
                      {{ resource.typeName ?? $t('v2.brisage.common.resource') }}
                    </div>
                  </div>
                  <span class="tabular shrink-0 text-sm text-muted">{{ resource.totalQuantity }}</span>
                </div>
              </div>

              <p v-if="session.notes" class="mt-3 border-t border-line pt-3 text-xs text-muted">
                {{ session.notes }}
              </p>
            </template>
          </UiCard>
        </div>
      </template>
    </template>

    <!-- ── Opportunities ────────────────────────────────────────────────── -->
    <template v-else-if="activeMainTab === 'opportunities'">
      <UiPageSection :title="$t('v2.brisage.tabs.opportunities')">
        <template #actions>
          <UiBadge tone="warning">{{ $t('v2.brisage.messages.evNotGuaranteed') }}</UiBadge>
        </template>

        <UiCard>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <UiField :label="$t('v2.brisage.fields.candidateCategory')">
              <UiSelect
                :model-value="draftSession.categoryTypeIds[0] ?? null"
                :options="brisageCategorySelectOptions"
                :placeholder="$t('v2.brisage.placeholders.selectCategory')"
                @update:model-value="setSingleOpportunityCategory"
              />
            </UiField>

            <UiField :label="$t('v2.brisage.fields.levelRange')">
              <div class="flex items-center gap-2">
                <UiNumberInput
                  v-model="draftSession.levelMin"
                  :min="1"
                  :placeholder="$t('v2.brisage.fields.levelMin')"
                />
                <span class="shrink-0 text-sm text-subtle" aria-hidden="true">–</span>
                <UiNumberInput
                  v-model="draftSession.levelMax"
                  :min="1"
                  :placeholder="$t('v2.brisage.fields.levelMax')"
                />
              </div>
            </UiField>

            <UiField :label="$t('v2.brisage.fields.bankroll')">
              <UiNumberInput v-model="opportunityConfig.bankroll" @update:model-value="saveOpportunitySettings" />
            </UiField>
            <UiField :label="$t('v2.brisage.fields.safetyMarkup')">
              <UiNumberInput v-model="opportunityConfig.safetyMarkupPercent" :min="0" @update:model-value="saveOpportunitySettings" />
            </UiField>
            <UiField :label="$t('v2.brisage.fields.pessimisticMultiplier')">
              <!-- The only fractional field on the page, so it stays a raw
                   number input rather than the kamas-grouping UiNumberInput. -->
              <UiInput
                :model-value="opportunityConfig.pessimisticRuneMultiplier"
                type="number"
                inputmode="decimal"
                @update:model-value="setPessimisticMultiplier"
              />
            </UiField>
            <UiField :label="$t('v2.brisage.fields.batchBankrollPercent')">
              <UiNumberInput v-model="opportunityConfig.bankrollBatchPercent" :min="1" @update:model-value="saveOpportunitySettings" />
            </UiField>
            <UiField :label="$t('v2.brisage.fields.maxBatchCap')">
              <UiNumberInput v-model="opportunityConfig.maxBatchCostCap" @update:model-value="saveOpportunitySettings" />
            </UiField>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
            <UiButton size="sm" :disabled="!canLoadBatch" :loading="loadingBatchResults" @click="loadCategoryBatch">
              {{ $t('v2.brisage.actions.loadCandidates') }}
            </UiButton>
            <p class="text-xs text-subtle">{{ $t('v2.brisage.messages.candidateHelp') }}</p>
          </div>

          <div v-if="results.length" class="mt-3 flex flex-col gap-1">
            <button
              v-for="item in results.slice(0, 20)"
              :key="`opp-${item.id}`"
              type="button"
              class="flex items-center gap-3 rounded-md border border-line bg-surface p-2 text-left transition-colors hover:border-line-strong"
              @click="addOpportunityFromItem(item)"
            >
              <img
                :src="getItemImg(item)"
                :alt="''"
                class="size-9 shrink-0 rounded-md bg-sunken object-contain"
                @error="onImgErr"
              >
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm text-ink">{{ item.name?.fr ?? item.id }}</div>
                <div class="truncate text-xs text-subtle">
                  {{ item.type?.name?.fr ?? '' }}
                  <span class="tabular">· {{ $t('monsters.level', { level: item.level ?? '?' }) }}</span>
                </div>
              </div>
              <span class="shrink-0 text-xs text-accent">{{ $t('v2.brisage.actions.trackEv') }}</span>
            </button>
          </div>
        </UiCard>

        <UiEmptyState
          v-if="!brisageOpportunities.length"
          :title="$t('v2.brisage.messages.emptyOpportunities')"
          class="mt-3"
        >
          <template #icon><UiIcon name="prices" /></template>
        </UiEmptyState>

        <div v-else class="mt-3 flex flex-col gap-3">
          <UiCard v-for="opportunity in brisageOpportunities" :key="opportunity.id">
            <div class="flex flex-wrap items-start gap-3">
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold text-ink">{{ opportunity.itemName }}</div>
                <div class="truncate text-xs text-subtle">
                  {{ $t('v2.brisage.labels.opportunityScope', {
                    status: opportunityStatusLabel(opportunity.status),
                    risk: opportunity.riskLevel,
                    quantity: opportunity.recommendedQuantity,
                  }) }}
                </div>
              </div>
              <UiButton
                variant="danger"
                size="sm"
                icon
                :aria-label="$t('v2.brisage.actions.remove')"
                @click="removeOpportunityCandidate(opportunity.id)"
              >
                <UiIcon name="trash" />
              </UiButton>
            </div>

            <dl class="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt class="text-xs text-subtle">{{ $t('v2.brisage.labels.craftCost') }}</dt>
                <dd class="mt-0.5"><UiMoney :value="opportunity.craftCost" short size="sm" /></dd>
              </div>
              <div>
                <dt class="text-xs text-subtle">{{ $t('v2.brisage.labels.conservativeCost') }}</dt>
                <dd class="mt-0.5"><UiMoney :value="opportunity.conservativeCraftCost" short size="sm" /></dd>
              </div>
              <div>
                <dt class="text-xs text-subtle">{{ $t('v2.brisage.labels.estimatedRunes') }}</dt>
                <dd class="mt-0.5"><UiMoney :value="opportunity.estimatedRuneValue" short size="sm" /></dd>
              </div>
              <div>
                <dt class="text-xs text-subtle">{{ $t('v2.brisage.labels.pessimisticProfit') }}</dt>
                <dd class="mt-0.5"><UiMoney :value="opportunity.pessimisticProfit" signed short size="sm" /></dd>
              </div>
            </dl>

            <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
              <span>
                {{ $t('v2.brisage.labels.ev') }}
                <UiMoney :value="opportunity.expectedProfit" signed short size="sm" />
              </span>
              <span>
                {{ $t('v2.brisage.summary.margin') }}
                <span class="tabular text-ink">
                  {{ opportunity.marginPercent >= 0 ? '+' : '' }}{{ opportunity.marginPercent }}%
                </span>
              </span>
              <span>
                {{ $t('v2.brisage.labels.batch') }}
                <UiMoney :value="opportunity.recommendedBatchCost" short size="sm" />
                <span class="tabular"> / {{ opportunity.bankrollExposurePercent }}%</span>
              </span>
              <UiBadge v-if="opportunity.missingPriceCount" tone="warning">
                {{ $t('v2.brisage.labels.missingPrices') }}: {{ opportunity.missingPriceCount }}
              </UiBadge>
            </div>

            <ul v-if="opportunity.warnings.length" class="mt-3 flex flex-col gap-1">
              <li v-for="warning in opportunity.warnings" :key="warning" class="text-xs text-warning">
                {{ warning }}
              </li>
            </ul>

            <template v-for="candidate in candidatesFor(opportunity.id)" :key="candidate.id">
              <div class="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <UiField :label="$t('v2.brisage.fields.status')">
                  <UiSelect
                    v-model="candidate.status"
                    :options="opportunityStatusOptions"
                    size="sm"
                    :placeholder="$t('v2.brisage.placeholders.selectStatus')"
                    @update:model-value="updateOpportunityCandidate(candidate)"
                  />
                </UiField>
                <UiField :label="$t('v2.brisage.fields.manualRuneValue')">
                  <UiNumberInput
                    v-model="candidate.expectedRuneValueManual"
                    size="sm"
                    @update:model-value="updateOpportunityCandidate(candidate)"
                  />
                </UiField>
                <UiField :label="$t('v2.brisage.fields.sampleSize')">
                  <UiNumberInput
                    v-model="candidate.sampleSize"
                    :min="0"
                    size="sm"
                    @update:model-value="updateOpportunityCandidate(candidate)"
                  />
                </UiField>
                <UiField :label="$t('v2.brisage.fields.unsoldRuneValue')">
                  <UiNumberInput
                    v-model="candidate.unsoldRuneValue"
                    :min="0"
                    size="sm"
                    @update:model-value="updateOpportunityCandidate(candidate)"
                  />
                </UiField>
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-3">
                <UiButton size="sm" @click="applyStatusSuggestion(candidate)">
                  {{ $t('v2.brisage.actions.applyHistoryStatus') }}
                </UiButton>
                <p class="text-xs text-subtle">
                  {{ $t('v2.brisage.labels.soldConfirmedSessions', { count: soldConfirmedSessionCount(candidate) }) }}
                </p>
              </div>
            </template>
          </UiCard>
        </div>
      </UiPageSection>
    </template>

    <!-- ── Market prices ────────────────────────────────────────────────── -->
    <template v-else>
      <UiPageSection :title="$t('v2.brisage.tabs.prices')">
        <UiCard>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <UiField :label="$t('v2.brisage.fields.priceName')">
              <UiSelect
                v-if="marketPriceDraft.kind === 'rune'"
                :model-value="marketPriceRuneId"
                :options="runeOptions"
                :placeholder="$t('v2.brisage.placeholders.selectRune')"
                @update:model-value="setMarketPriceRune"
              />
              <UiInput v-else v-model="marketPriceDraft.name" :placeholder="$t('v2.brisage.placeholders.priceName')" />
            </UiField>
            <UiField :label="$t('v2.brisage.fields.priceItemId')">
              <UiInput v-model="marketPriceDraft.itemId" />
            </UiField>
            <UiField :label="$t('v2.brisage.fields.priceKind')">
              <UiSelect
                v-model="marketPriceDraft.kind"
                :options="marketPriceKindOptions"
                :placeholder="$t('v2.brisage.placeholders.selectKind')"
              />
            </UiField>
            <UiField :label="$t('v2.brisage.fields.price')">
              <UiNumberInput v-model="marketPriceDraft.price" :min="0" />
            </UiField>
            <UiField :label="$t('v2.brisage.fields.quantityBasis')">
              <UiNumberInput v-model="marketPriceDraft.quantityBasis" :min="1" />
            </UiField>
            <UiField :label="$t('v2.brisage.fields.priceNote')">
              <UiInput v-model="marketPriceDraft.note" />
            </UiField>
          </div>

          <UiDropZone
            class="mt-3"
            size="sm"
            :label="$t('v2.brisage.capture.price')"
            :loading="priceCapture.isLoading"
            @image="capturePriceScreenshot"
          />

          <div v-if="priceCapture.candidates.length > 1" class="mt-2 flex flex-wrap items-center gap-1.5">
            <span class="text-xs text-subtle">{{ $t('v2.brisage.capture.picked') }}</span>
            <UiButton
              v-for="candidate in priceCapture.candidates"
              :key="candidate"
              size="sm"
              @click="marketPriceDraft.price = candidate"
            >
              {{ formatKamasShort(candidate) }}
            </UiButton>
          </div>

          <p v-if="priceCapture.error" class="mt-2 text-xs text-negative">{{ priceCapture.error }}</p>

          <div class="mt-4 border-t border-line pt-3">
            <UiButton variant="primary" size="sm" @click="addMarketPrice">
              {{ $t('v2.brisage.actions.savePrice') }}
            </UiButton>
          </div>
        </UiCard>

        <UiEmptyState v-if="!marketPrices.length" :title="$t('v2.brisage.messages.emptyPrices')" class="mt-3">
          <template #icon><UiIcon name="prices" /></template>
        </UiEmptyState>

        <template v-else>
          <UiCard v-if="latestRunePrices.length" :title="$t('v2.brisage.labels.latestRunePrices')" class="mt-3">
            <div class="flex flex-col gap-1">
              <div
                v-for="price in latestRunePrices"
                :key="`latest-rune-${price.id}`"
                class="flex flex-wrap items-center gap-3 border-b border-line px-1 py-2 last:border-0"
              >
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm text-ink">{{ price.name }}</div>
                  <div class="flex flex-wrap items-center gap-x-1.5 text-xs text-subtle">
                    <span>{{ freshnessLabel(price.timestamp) }}</span>
                    <span>· {{ $t('v2.brisage.labels.unitPrice') }}</span>
                    <UiMoney :value="unitMarketPrice(price) ?? 0" short size="sm" />
                    <span
                      v-if="priceTrend(price) !== null"
                      :class="['tabular', priceTrend(price)! >= 0 ? 'text-positive' : 'text-negative']"
                    >
                      · {{ priceTrend(price)! >= 0 ? '+' : '' }}{{ priceTrend(price) }}% {{ $t('v2.brisage.labels.vsPrevious') }}
                    </span>
                  </div>
                  <div v-if="price.note" class="truncate text-xs text-subtle">{{ price.note }}</div>
                </div>
                <div v-if="priceChartPoints(price).length >= 2" class="h-10 w-32 shrink-0">
                  <UiSparkline :points="priceChartPoints(price)" :label="price.name" />
                </div>
                <div class="shrink-0 text-right">
                  <UiMoney :value="price.price" short size="sm" />
                  <span class="tabular text-xs text-subtle"> {{ $t('v2.brisage.labels.perBasis', { basis: price.quantityBasis }) }}</span>
                  <div class="text-xs text-subtle">
                    {{ t('v2.brisage.labels.pricePoints', { count: priceHistoryCount(price) }) }}
                  </div>
                </div>
              </div>
            </div>
          </UiCard>

          <UiCard v-if="latestResourcePrices.length" :title="$t('v2.brisage.labels.latestResourcePrices')" class="mt-3">
            <div class="flex flex-col gap-1">
              <div
                v-for="price in latestResourcePrices"
                :key="`latest-resource-${price.id}`"
                class="flex flex-wrap items-center gap-3 border-b border-line px-1 py-2 last:border-0"
              >
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm text-ink">{{ price.name }}</div>
                  <div class="flex flex-wrap items-center gap-x-1.5 text-xs text-subtle">
                    <span>{{ priceKindLabel(price.kind) }} · {{ freshnessLabel(price.timestamp) }} · {{ $t('v2.brisage.labels.unitPrice') }}</span>
                    <UiMoney :value="unitMarketPrice(price) ?? 0" short size="sm" />
                  </div>
                  <div v-if="price.note" class="truncate text-xs text-subtle">{{ price.note }}</div>
                </div>
                <div class="shrink-0 text-right">
                  <UiMoney :value="price.price" short size="sm" />
                  <span class="tabular text-xs text-subtle"> {{ $t('v2.brisage.labels.perBasis', { basis: price.quantityBasis }) }}</span>
                </div>
              </div>
            </div>
          </UiCard>

          <UiCard :title="$t('v2.brisage.labels.recentPriceEntries')" class="mt-3">
            <div class="flex flex-col gap-1">
              <div
                v-for="price in marketPrices.slice(0, 20)"
                :key="price.id"
                class="flex flex-wrap items-center gap-3 border-b border-line px-1 py-2 last:border-0"
              >
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm text-ink">{{ price.name }}</div>
                  <div class="flex flex-wrap items-center gap-x-1.5 text-xs text-subtle">
                    <span>{{ priceKindLabel(price.kind) }} · {{ formatDisplayDate(price.timestamp) }} · {{ $t('v2.brisage.labels.unitPrice') }}</span>
                    <UiMoney :value="unitMarketPrice(price) ?? 0" short size="sm" />
                  </div>
                </div>
                <div class="shrink-0 text-right">
                  <UiMoney :value="price.price" short size="sm" />
                  <span class="tabular text-xs text-subtle"> {{ $t('v2.brisage.labels.perBasis', { basis: price.quantityBasis }) }}</span>
                </div>
                <UiButton
                  variant="danger"
                  size="sm"
                  icon
                  :aria-label="$t('v2.brisage.actions.removeEntry')"
                  @click="removeMarketPrice(price.id)"
                >
                  <UiIcon name="trash" />
                </UiButton>
              </div>
            </div>
          </UiCard>
        </template>
      </UiPageSection>
    </template>
  </div>
</template>

<script setup lang="ts">
import { BRISAGE_CATEGORY_OPTIONS } from '@/data/brisageCategories'
import type { BrisageOpportunityCandidate, BrisageOpportunityConfig, OpportunityStatus } from '@/utils/brisageOpportunities'
import { buildBrisageOpportunity, defaultBrisageOpportunityConfig, rankBrisageOpportunities } from '@/utils/brisageOpportunities'
import type { MarketPrice, MarketPriceKind } from '@/utils/marketPrices'
import { createMarketPrice, latestMarketPrices, loadMarketPrices, marketPriceHistoryFor, marketPriceTrendPercent, normalizeMarketPriceName, priceFreshness, saveMarketPrices, unitMarketPrice } from '@/utils/marketPrices'
import {
  itemActualSoldRuneValue,
  itemCraftTotal,
  itemQuantityTotal,
  itemRealizedProfit,
  brisageMarginPercent,
  runCraftCost,
  runPaperProfit,
  runRealizedProfit,
  runRuneOutputSoldValue,
  runRuneOutputTheoreticalValue,
  sessionQuantityTotal,
  sessionTotals as accountingSessionTotals,
} from '@/utils/brisageAccounting'
import { formatKamasShort } from '~/utils/format'
import { runPriceOcr } from '~/composables/useScreenshotOcr'
import runeCatalogue from '~/data/runes.json'
import { normalizeDofusdbSearch } from '~/utils/dofusdb'

const { t } = useI18n()

const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()

interface BrisageSessionItem {
  id: string
  itemId: string | number
  item: any
  notes: string
  runs: BrisageItemRun[]
}

interface BrisageItemRun {
  id: string
  quantity: number
  buyStartKamas: number
  buyEndKamas: number
  realizedRuneValue: number
  theoreticalRuneValue: number
  actualSoldRuneValue: number
  unsoldRuneValue: number
  soldConfirmed: boolean
  saleNotes: string
  runeOutputs: BrisageRunRuneOutput[]
  notes: string
}

interface BrisageRunRuneOutput {
  id: string
  runeId: string | number | null
  runeName: string
  quantity: number
  soldQuantity: number
  actualSoldValue: number
  theoreticalValue: number
  note: string
}

interface BrisageSessionResource {
  id: number
  name: string
  image: string | null
  typeName: string | null
  totalQuantity: number
  hasRecipe: boolean
  isDone: boolean
  sourceItems?: BrisageSessionResourceSource[]
}

interface BrisageSessionResourceSource {
  itemKey: string
  itemName: string
  itemImage: string | null
  quantity: number
  totalQuantity: number
}

interface BrisageSession {
  id: string
  date: string
  startingKamas: number
  endingKamas: number
  externalDelta: number
  categoryTypeId: number | null
  categoryTypeIds: number[]
  levelMin: number | null
  levelMax: number | null
  categoryLabel: string
  notes: string
  items: BrisageSessionItem[]
  resourceChecklist: BrisageSessionResource[]
}

interface LegacyBrisageEntry {
  id: string
  itemId: string | number
  item: any
  craftPrice: number
  hdvPrice: number
  runeValue: number
  date: string
  notes: string
}

const draftKey = computed(() =>
  `brisage_draft_${selectedServer.value?.id}_${selectedCharacter.value?.id}`,
)
const sessionsKey = computed(() =>
  `brisage_sessions_${selectedServer.value?.id}_${selectedCharacter.value?.id}`,
)
const legacyEntriesKey = computed(() =>
  `brisage_entries_${selectedServer.value?.id}_${selectedCharacter.value?.id}`,
)
const opportunityCandidatesKey = computed(() =>
  `brisage_opportunity_candidates_v1_${selectedServer.value?.id}_${selectedCharacter.value?.id}`,
)
const opportunityConfigKey = computed(() =>
  `brisage_opportunity_config_v1_${selectedServer.value?.id}_${selectedCharacter.value?.id}`,
)

const sessions = ref<BrisageSession[]>([])
const marketPrices = ref<MarketPrice[]>([])
const opportunityCandidates = ref<BrisageOpportunityCandidate[]>([])
const opportunityConfig = ref<BrisageOpportunityConfig>(defaultBrisageOpportunityConfig())
const activeMainTab = ref<'history' | 'opportunities' | 'prices'>('history')
const draftItems = ref<BrisageSessionItem[]>([])
const expandedDraftItemIds = ref<string[]>([])
const expandedSessionIds = ref<string[]>([])
const brisageMode = ref<'history' | 'builder'>('history')
const editingSessionId = ref<string | null>(null)
const showDraftResourceChecklist = ref(true)
const resourceChecklistView = ref<'all' | 'perItem'>('all')
const draftResourceChecklist = ref<BrisageSessionResource[]>([])
const recipeChecklistState = ref({
  hasFetched: false,
  isLoading: false,
  error: '',
})

const mainTabOptions = computed(() => ([
  { label: `${t('v2.brisage.tabs.history')} (${sessions.value.length})`, value: 'history' },
  { label: `${t('v2.brisage.tabs.opportunities')} (${brisageOpportunities.value.length})`, value: 'opportunities' },
  { label: `${t('v2.brisage.tabs.prices')} (${marketPrices.value.length})`, value: 'prices' },
]))

const modeOptions = computed(() => ([
  { label: `${t('v2.brisage.sections.sessionHistory')} (${sessions.value.length})`, value: 'history' },
  {
    label: draftItems.value.length
      ? `${t('v2.brisage.sections.sessionBuilder')} (${draftItems.value.length})`
      : t('v2.brisage.sections.sessionBuilder'),
    value: 'builder',
  },
]))

const resourceViewOptions = computed(() => ([
  { label: t('v2.brisage.actions.showAllIngredients'), value: 'all' },
  { label: t('v2.brisage.actions.showIngredientsPerItem'), value: 'perItem' },
]))

/** Both entry points need a category and a full level range before the batch
 *  fetch has anything to ask DofusDB for. */
const canLoadBatch = computed(() =>
  Boolean(draftSession.value.categoryTypeIds.length && draftSession.value.levelMin && draftSession.value.levelMax),
)

const candidatesFor = (id: string) => opportunityCandidates.value.filter(candidate => candidate.id === id)

/** Reads the price off an HDV screenshot into the draft. The image is parsed
 *  and dropped — nothing about it is stored. */
const priceCapture = ref({ isLoading: false, error: '', candidates: [] as number[] })

const capturePriceScreenshot = async (dataUrl: string) => {
  priceCapture.value = { isLoading: true, error: '', candidates: [] }
  try {
    const result = await runPriceOcr(dataUrl)
    if (!result.candidates.length) {
      priceCapture.value = { isLoading: false, error: t('items.detail.ocr.errors.noPriceCandidates'), candidates: [] }
      return
    }
    priceCapture.value = { isLoading: false, error: '', candidates: result.candidates }
    marketPriceDraft.value.price = result.candidates[0]!
  }
  catch {
    priceCapture.value = { isLoading: false, error: t('items.detail.ocr.errors.marketFailed'), candidates: [] }
  }
}

const onModeChange = (value: string | number | null) => {
  if (value === 'builder') startSessionBuilder()
  else showSessionHistory()
}

const draftSession = ref({
  date: todayISO(),
  startingKamas: 0,
  endingKamas: 0,
  externalDelta: 0,
  categoryTypeId: null as number | null,
  categoryTypeIds: [] as number[],
  levelMin: null as number | null,
  levelMax: null as number | null,
  categoryLabel: '',
  notes: '',
})

const search = ref('')
const searching = ref(false)
const results = ref<any[]>([])
const loadedBatchResults = ref<any[]>([])
const loadingBatchResults = ref(false)
const categoryPickerOpen = ref(false)
const categoryPickerEl = ref<HTMLElement | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const marketPriceDraft = ref({
  itemId: '',
  name: '',
  kind: 'resource' as MarketPriceKind,
  price: 0,
  quantityBasis: 1,
  note: '',
})

const brisageCategorySelectOptions = computed(() => [
  { key: 'none', label: t('v2.brisage.placeholders.selectCategory'), value: null },
  ...BRISAGE_CATEGORY_OPTIONS.map(option => ({
    key: String(option.typeId),
    label: option.label,
    value: option.typeId,
  })),
])

const opportunityStatusOptions = computed(() => ([
  { key: 'idea', label: t('v2.brisage.opportunityStatus.idea'), value: 'idea', description: t('v2.brisage.opportunityStatus.ideaDesc') },
  { key: 'test-batch', label: t('v2.brisage.opportunityStatus.testBatch'), value: 'test-batch', description: t('v2.brisage.opportunityStatus.testBatchDesc') },
  { key: 'validated', label: t('v2.brisage.opportunityStatus.validated'), value: 'validated', description: t('v2.brisage.opportunityStatus.validatedDesc') },
  { key: 'scaled', label: t('v2.brisage.opportunityStatus.scaled'), value: 'scaled', description: t('v2.brisage.opportunityStatus.scaledDesc') },
  { key: 'retired', label: t('v2.brisage.opportunityStatus.retired'), value: 'retired', description: t('v2.brisage.opportunityStatus.retiredDesc') },
]))

const opportunityStatusLabel = (status: OpportunityStatus) =>
  opportunityStatusOptions.value.find(option => option.value === status)?.label ?? status

const marketPriceKindOptions = computed(() => ([
  { key: 'resource', label: t('v2.brisage.kind.resource'), value: 'resource' },
  { key: 'rune', label: t('v2.brisage.kind.rune'), value: 'rune' },
  { key: 'finished-item', label: t('v2.brisage.kind.finishedItem'), value: 'finished-item' },
]))

const latestPrices = computed(() => latestMarketPrices(marketPrices.value))
const latestRunePrices = computed(() => latestPrices.value.filter(price => price.kind === 'rune'))
const latestResourcePrices = computed(() => latestPrices.value.filter(price => price.kind !== 'rune'))

/** The canonical forgemagie runes (app/data/runes.json, regenerate with
 *  scripts/fetch-runes.mjs). Picking from this list is what lets a rune output
 *  carry a real `runeId`, so the price book matches on id instead of on however
 *  the name happened to be typed. */
const runeOptions = runeCatalogue.map(rune => ({
  key: String(rune.id),
  label: rune.name,
  value: rune.id,
}))

const runeNameById = new Map(runeCatalogue.map(rune => [String(rune.id), rune.name]))

const normalizeLevelValue = (value: unknown) => {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null
  return Math.max(1, Math.min(200, Math.round(num)))
}

const normalizeCategoryTypeIds = (value: unknown, fallback?: unknown) => {
  const rawValues = Array.isArray(value)
    ? value
    : value != null
      ? [value]
      : fallback != null
        ? [fallback]
        : []

  return Array.from(new Set(
    rawValues
      .map(typeId => Number(typeId))
      .filter(typeId => Number.isFinite(typeId) && typeId > 0),
  ))
}

const normalizeSessionItem = (record: any): BrisageSessionItem | null => {
  if (!record?.id || !record?.item) return null
  const runs = Array.isArray(record?.runs)
    ? record.runs.map(normalizeItemRun).filter(Boolean) as BrisageItemRun[]
    : buildFallbackRuns(record)
  return {
    id: String(record.id),
    itemId: record.itemId,
    item: record.item,
    notes: String(record.notes ?? ''),
    runs,
  }
}

const normalizeItemRun = (record: any): BrisageItemRun | null => {
  if (!record?.id) return null
  const theoreticalRuneValue = Math.max(0, Number(record.theoreticalRuneValue ?? record.realizedRuneValue ?? 0) || 0)
  const actualSoldRuneValue = Math.max(0, Number(record.actualSoldRuneValue ?? record.realizedRuneValue ?? 0) || 0)
  const runeOutputs = Array.isArray(record.runeOutputs)
    ? record.runeOutputs.map(normalizeRuneOutput).filter(Boolean) as BrisageRunRuneOutput[]
    : []
  return {
    id: String(record.id),
    quantity: Math.max(1, Number(record.quantity ?? 1) || 1),
    buyStartKamas: Math.max(0, Number(record.buyStartKamas ?? 0) || 0),
    buyEndKamas: Math.max(0, Number(record.buyEndKamas ?? 0) || 0),
    realizedRuneValue: theoreticalRuneValue,
    theoreticalRuneValue,
    actualSoldRuneValue,
    unsoldRuneValue: Math.max(0, Number(record.unsoldRuneValue ?? Math.max(0, theoreticalRuneValue - actualSoldRuneValue)) || 0),
    soldConfirmed: Boolean(record.soldConfirmed ?? actualSoldRuneValue > 0),
    saleNotes: String(record.saleNotes ?? ''),
    runeOutputs,
    notes: String(record.notes ?? ''),
  }
}

const normalizeRuneOutput = (record: any): BrisageRunRuneOutput | null => {
  const runeName = String(record?.runeName ?? '').trim()
  if (!runeName) return null
  return {
    id: String(record?.id || crypto.randomUUID()),
    runeId: record?.runeId ?? null,
    runeName,
    quantity: Math.max(0, Number(record?.quantity ?? 0) || 0),
    soldQuantity: Math.max(0, Number(record?.soldQuantity ?? 0) || 0),
    actualSoldValue: Math.max(0, Number(record?.actualSoldValue ?? 0) || 0),
    theoreticalValue: Math.max(0, Number(record?.theoreticalValue ?? 0) || 0),
    note: String(record?.note ?? ''),
  }
}

const buildFallbackRuns = (record: any): BrisageItemRun[] => {
  const quantity = Math.max(1, Number(record?.quantity ?? 1) || 1)
  const totalCraftCost = Math.max(0, Number(record?.craftCost ?? 0) || 0)
  const unitCraftCost = Math.max(0, Number(record?.unitCraftCost ?? 0) || 0)
  const fallbackCost = totalCraftCost || (quantity * unitCraftCost)

  return [{
    id: crypto.randomUUID(),
    quantity,
    buyStartKamas: fallbackCost,
    buyEndKamas: 0,
    realizedRuneValue: Math.max(0, Number(record?.realizedRuneValue ?? 0) || 0),
    theoreticalRuneValue: Math.max(0, Number(record?.theoreticalRuneValue ?? record?.realizedRuneValue ?? 0) || 0),
    actualSoldRuneValue: Math.max(0, Number(record?.actualSoldRuneValue ?? record?.realizedRuneValue ?? 0) || 0),
    unsoldRuneValue: Math.max(0, Number(record?.unsoldRuneValue ?? 0) || 0),
    soldConfirmed: Boolean(record?.soldConfirmed ?? record?.realizedRuneValue > 0),
    saleNotes: String(record?.saleNotes ?? ''),
    runeOutputs: [],
    notes: String(record?.notes ?? ''),
  }]
}

const normalizeSessionRecord = (record: any): BrisageSession | null => {
  if (!record?.id) return null
  const items = Array.isArray(record?.items)
    ? record.items.map(normalizeSessionItem).filter(Boolean) as BrisageSessionItem[]
    : []
  const resourceChecklist = Array.isArray(record?.resourceChecklist)
    ? record.resourceChecklist.map(normalizeSessionResource).filter(Boolean) as BrisageSessionResource[]
    : []
  return {
    id: String(record.id),
    date: String(record.date ?? todayISO()),
    startingKamas: Number(record.startingKamas ?? 0) || 0,
    endingKamas: Number(record.endingKamas ?? 0) || 0,
    externalDelta: Math.max(0, Number(record.externalDelta ?? 0) || 0),
    categoryTypeId: Number(record.categoryTypeId ?? 0) || null,
    categoryTypeIds: normalizeCategoryTypeIds(record.categoryTypeIds, record.categoryTypeId),
    levelMin: normalizeLevelValue(record.levelMin),
    levelMax: normalizeLevelValue(record.levelMax),
    categoryLabel: String(record.categoryLabel ?? ''),
    notes: String(record.notes ?? ''),
    items,
    resourceChecklist,
  }
}

const normalizeSessionResource = (record: any): BrisageSessionResource | null => {
  const id = Number(record?.id ?? 0)
  if (!id) return null
  const sourceItems = Array.isArray(record?.sourceItems)
    ? record.sourceItems.map((source: any) => ({
        itemKey: String(source?.itemKey ?? ''),
        itemName: String(source?.itemName ?? ''),
        itemImage: typeof source?.itemImage === 'string' ? source.itemImage : null,
        quantity: Math.max(0, Number(source?.quantity ?? 0) || 0),
        totalQuantity: Math.max(0, Number(source?.totalQuantity ?? 0) || 0),
      })).filter((source: BrisageSessionResourceSource) => source.itemKey && source.itemName && source.totalQuantity > 0)
    : undefined

  return {
    id,
    name: String(record?.name ?? `Ingredient #${id}`),
    image: typeof record?.image === 'string' ? record.image : null,
    typeName: typeof record?.typeName === 'string' ? record.typeName : null,
    totalQuantity: Math.max(0, Number(record?.totalQuantity ?? 0) || 0),
    hasRecipe: Boolean(record?.hasRecipe),
    isDone: Boolean(record?.isDone),
    sourceItems,
  }
}

const normalizeLegacyEntry = (record: any): LegacyBrisageEntry | null => {
  if (!record?.id || !record?.item) return null
  return {
    id: String(record.id),
    itemId: record.itemId,
    item: record.item,
    craftPrice: Math.max(0, Number(record.craftPrice ?? 0) || 0),
    hdvPrice: Math.max(0, Number(record.hdvPrice ?? 0) || 0),
    runeValue: Math.max(0, Number(record.runeValue ?? 0) || 0),
    date: String(record.date ?? todayISO()),
    notes: String(record.notes ?? ''),
  }
}

const migrateLegacyEntries = (legacyEntries: LegacyBrisageEntry[]) =>
  legacyEntries.map(entry => ({
    id: `legacy-${entry.id}`,
    date: entry.date || todayISO(),
    startingKamas: 0,
    endingKamas: 0,
    externalDelta: 0,
    categoryTypeId: Number(entry.item?.type?.id ?? 0) || null,
    categoryTypeIds: normalizeCategoryTypeIds(entry.item?.type?.id),
    levelMin: normalizeLevelValue(entry.item?.level),
    levelMax: normalizeLevelValue(entry.item?.level),
    categoryLabel: String(entry.item?.type?.name?.fr ?? ''),
    notes: entry.notes,
    items: [
      {
        id: entry.id,
        itemId: entry.itemId,
        item: entry.item,
        notes: entry.notes,
        runs: [
          {
            id: `legacy-run-${entry.id}`,
            quantity: 1,
            buyStartKamas: entry.craftPrice,
            buyEndKamas: 0,
            realizedRuneValue: entry.runeValue,
            theoreticalRuneValue: entry.runeValue,
            actualSoldRuneValue: entry.runeValue,
            unsoldRuneValue: 0,
            soldConfirmed: true,
            saleNotes: 'Migrated legacy brisage value.',
            runeOutputs: [],
            notes: entry.notes,
          },
        ],
      },
    ],
    resourceChecklist: [],
  } satisfies BrisageSession))

const saveSessions = () =>
  localStorage.setItem(sessionsKey.value, JSON.stringify(sessions.value))

/** A session is easily a hundred typed fields, and nothing else on the page
 *  writes the draft, so leaving the tab used to discard all of it. */
const draftIsEmpty = () =>
  !draftItems.value.length
  && !draftSession.value.categoryTypeIds.length
  && !draftSession.value.levelMin
  && !draftSession.value.levelMax
  && !draftSession.value.notes
  && !draftSession.value.startingKamas
  && !draftSession.value.endingKamas
  && !draftSession.value.externalDelta

const clearStoredDraft = () => {
  if (import.meta.client && hasContext.value) localStorage.removeItem(draftKey.value)
}

const saveDraft = () => {
  if (!import.meta.client || !hasContext.value) return
  if (draftIsEmpty()) return clearStoredDraft()
  localStorage.setItem(draftKey.value, JSON.stringify({
    editingSessionId: editingSessionId.value,
    session: draftSession.value,
    items: draftItems.value,
  }))
}

const loadDraft = () => {
  if (!import.meta.client || !hasContext.value) return
  const raw = localStorage.getItem(draftKey.value)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    // Run it through the same normalisers as a saved session, so a stale or
    // hand-edited draft cannot put a malformed run into the builder.
    const items = Array.isArray(parsed?.items)
      ? parsed.items.map(normalizeSessionItem).filter(Boolean) as BrisageSessionItem[]
      : []
    if (!items.length && !parsed?.session) return
    draftItems.value = items
    if (parsed?.session) draftSession.value = { ...draftSession.value, ...parsed.session }
    editingSessionId.value = parsed?.editingSessionId ?? null
  }
  catch {
    clearStoredDraft()
  }
}

const saveOpportunityCandidates = () =>
  localStorage.setItem(opportunityCandidatesKey.value, JSON.stringify(opportunityCandidates.value))

const saveOpportunityConfig = () =>
  localStorage.setItem(opportunityConfigKey.value, JSON.stringify(opportunityConfig.value))

const loadData = () => {
  if (!hasContext.value) return
  loadDraft()

  const rawSessions = localStorage.getItem(sessionsKey.value)
  if (rawSessions) {
    const parsed = JSON.parse(rawSessions)
    sessions.value = Array.isArray(parsed)
      ? parsed.map(normalizeSessionRecord).filter(Boolean) as BrisageSession[]
      : []
    saveSessions()
    return
  }

  const rawLegacyEntries = localStorage.getItem(legacyEntriesKey.value)
  const parsedLegacyEntries = rawLegacyEntries ? JSON.parse(rawLegacyEntries) : []
  const normalizedLegacyEntries = Array.isArray(parsedLegacyEntries)
    ? parsedLegacyEntries.map(normalizeLegacyEntry).filter(Boolean) as LegacyBrisageEntry[]
    : []

  sessions.value = migrateLegacyEntries(normalizedLegacyEntries)
  saveSessions()
}

const normalizeOpportunityCandidate = (record: any): BrisageOpportunityCandidate | null => {
  if (!record?.id || !record?.item || record?.itemId == null) return null
  const status = ['idea', 'test-batch', 'validated', 'scaled', 'retired'].includes(record.status)
    ? record.status as OpportunityStatus
    : 'idea'
  return {
    id: String(record.id),
    itemId: record.itemId,
    item: record.item,
    status,
    expectedRuneValueManual: Math.max(0, Number(record.expectedRuneValueManual ?? 0) || 0),
    expectedRuneOutputs: Array.isArray(record.expectedRuneOutputs) ? record.expectedRuneOutputs : [],
    sampleSize: Math.max(0, Number(record.sampleSize ?? 0) || 0),
    soldConfirmedSessions: Math.max(0, Number(record.soldConfirmedSessions ?? 0) || 0),
    unsoldRuneValue: Math.max(0, Number(record.unsoldRuneValue ?? 0) || 0),
    note: String(record.note ?? ''),
  }
}

const loadMarketAndOpportunities = () => {
  if (!hasContext.value) return
  marketPrices.value = loadMarketPrices(selectedServer.value?.id)

  const rawCandidates = localStorage.getItem(opportunityCandidatesKey.value)
  const parsedCandidates = rawCandidates ? JSON.parse(rawCandidates) : []
  opportunityCandidates.value = Array.isArray(parsedCandidates)
    ? parsedCandidates.map(normalizeOpportunityCandidate).filter(Boolean) as BrisageOpportunityCandidate[]
    : []

  const rawConfig = localStorage.getItem(opportunityConfigKey.value)
  const parsedConfig = rawConfig ? JSON.parse(rawConfig) : {}
  opportunityConfig.value = {
    ...defaultBrisageOpportunityConfig(),
    ...parsedConfig,
    bankroll: Number(parsedConfig?.bankroll ?? draftSession.value.startingKamas ?? 0) || 0,
  }
}

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  if (loadedBatchResults.value.length) {
    filterLoadedBatchResults()
    return
  }
  searchTimer = setTimeout(doSearch, 350)
}

const itemSearchHaystack = (item: any) =>
  [
    item?.name?.fr,
    item?.name?.en,
    item?.slug?.fr,
    item?.slug?.en,
    item?.type?.name?.fr,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

const filterLoadedBatchResults = () => {
  const query = search.value.trim().toLowerCase()
  const filteredResults = query
    ? loadedBatchResults.value.filter(item => itemSearchHaystack(item).includes(query))
    : [...loadedBatchResults.value]
  results.value = excludeDraftItems(filteredResults)
}

const clearLoadedBatchResults = () => {
  loadedBatchResults.value = []
  results.value = []
}

const doSearch = async () => {
  if (!search.value.trim()) {
    results.value = []
    return
  }
  searching.value = true
  try {
    const res = await $fetch<any>('/api/dofusdb/items', {
      query: {
        'slug.fr[$search]': normalizeDofusdbSearch(search.value),
        'typeId[$ne]': 203,
        '$sort': '-id',
        'level[$gte]': 0,
        'level[$lte]': 200,
        '$skip': 0,
        'lang': 'fr',
      },
    })
    results.value = res?.data ?? []
  }
  catch {
    results.value = []
  }
  finally {
    searching.value = false
  }
}

const clearSearch = () => {
  search.value = ''
  results.value = loadedBatchResults.value.length ? excludeDraftItems(loadedBatchResults.value) : []
}

const selectedCategoryOptions = computed(() =>
  BRISAGE_CATEGORY_OPTIONS.filter(option => draftSession.value.categoryTypeIds.includes(option.typeId)),
)

const categoryPickerLabel = computed(() => {
  if (!selectedCategoryOptions.value.length) return t('v2.brisage.placeholders.selectCategory')
  if (selectedCategoryOptions.value.length <= 2) {
    return selectedCategoryOptions.value.map(option => option.label).join(', ')
  }
  return `${selectedCategoryOptions.value.length} ${t('v2.brisage.fields.focusCategory')}`
})

const selectedCategoryLabel = computed(() =>
  selectedCategoryOptions.value.map(option => option.label).join(', '),
)

const syncDraftCategoryMeta = () => {
  draftSession.value.categoryTypeId = draftSession.value.categoryTypeIds[0] ?? null
  draftSession.value.categoryLabel = selectedCategoryLabel.value
}

const toggleCategoryType = (typeId: number) => {
  draftSession.value.categoryTypeIds = draftSession.value.categoryTypeIds.includes(typeId)
    ? draftSession.value.categoryTypeIds.filter(currentId => currentId !== typeId)
    : [...draftSession.value.categoryTypeIds, typeId]
  syncDraftCategoryMeta()
}

const setSingleOpportunityCategory = (value: string | number | null) => {
  const typeId = Number(value)
  draftSession.value.categoryTypeIds = Number.isFinite(typeId) && typeId > 0 ? [typeId] : []
  syncDraftCategoryMeta()
}

const draftItemIdSet = computed(() =>
  new Set(draftItems.value.map(item => String(item.itemId))),
)

const excludeDraftItems = (items: any[]) =>
  items.filter(item => !draftItemIdSet.value.has(String(item?.id)))

const addItemToDraft = (item: any) => {
  const existing = draftItems.value.find(draftItem => String(draftItem.itemId) === String(item?.id))
  if (existing) {
    if (!expandedDraftItemIds.value.includes(existing.id)) {
      expandedDraftItemIds.value = [...expandedDraftItemIds.value, existing.id]
    }
    return
  }

  const draftId = crypto.randomUUID()
  draftItems.value.unshift({
    id: draftId,
    itemId: item.id,
    item,
    notes: '',
    runs: [createEmptyRun()],
  })

  if (!draftSession.value.categoryLabel) {
    draftSession.value.categoryLabel = String(item?.type?.name?.fr ?? '')
  }
  if (draftSession.value.categoryTypeId == null) {
    draftSession.value.categoryTypeId = Number(item?.type?.id ?? 0) || null
  }
  if (!draftSession.value.categoryTypeIds.length && draftSession.value.categoryTypeId != null) {
    draftSession.value.categoryTypeIds = [draftSession.value.categoryTypeId]
  }
  if (draftSession.value.levelMin == null && item?.level) {
    draftSession.value.levelMin = normalizeLevelValue(item.level)
  }
  if (draftSession.value.levelMax == null && item?.level) {
    draftSession.value.levelMax = normalizeLevelValue(item.level)
  }
  if (loadedBatchResults.value.length) {
    filterLoadedBatchResults()
  }
}

const ensureItemRecipe = async (item: any) => {
  if (item?.recipe?.ingredientIds?.length) return item
  try {
    const recipe = await $fetch<any>(`/api/dofusdb/recipes/${encodeURIComponent(String(item.id))}`, {
      query: { lang: 'fr' },
    })
    return { ...item, recipe }
  }
  catch {
    return item
  }
}

/** For runes the name and id come from the catalogue, so a price and the run
 *  that consumes it always agree on which rune they mean. */
const marketPriceRuneId = computed(() => {
  const match = runeCatalogue.find(rune => rune.name === marketPriceDraft.value.name)
  return match ? match.id : null
})

const setMarketPriceRune = (value: string | number | null) => {
  const name = value == null ? '' : (runeNameById.get(String(value)) ?? '')
  marketPriceDraft.value.name = name
  marketPriceDraft.value.itemId = value == null ? '' : String(value)
}

const addMarketPrice = () => {
  if (!marketPriceDraft.value.name.trim() || marketPriceDraft.value.price <= 0) return
  const next = createMarketPrice({
    itemId: marketPriceDraft.value.itemId || null,
    name: marketPriceDraft.value.name,
    kind: marketPriceDraft.value.kind,
    price: marketPriceDraft.value.price,
    quantityBasis: marketPriceDraft.value.quantityBasis,
    serverId: String(selectedServer.value?.id || 'server'),
    note: marketPriceDraft.value.note,
  })
  marketPrices.value = [next, ...marketPrices.value]
  saveMarketPrices(selectedServer.value?.id, marketPrices.value)
  marketPriceDraft.value = { itemId: '', name: '', kind: 'resource', price: 0, quantityBasis: 1, note: '' }
}

const removeMarketPrice = (id: string) => {
  marketPrices.value = marketPrices.value.filter(price => price.id !== id)
  saveMarketPrices(selectedServer.value?.id, marketPrices.value)
}

const addOpportunityFromItem = async (item: any) => {
  const itemWithRecipe = await ensureItemRecipe(item)
  opportunityCandidates.value.unshift({
    id: crypto.randomUUID(),
    itemId: itemWithRecipe.id,
    item: itemWithRecipe,
    status: 'idea',
    expectedRuneValueManual: 0,
    expectedRuneOutputs: [],
    sampleSize: 0,
    soldConfirmedSessions: 0,
    unsoldRuneValue: 0,
    note: '',
  })
  saveOpportunityCandidates()
  activeMainTab.value = 'opportunities'
}

const removeOpportunityCandidate = (id: string) => {
  opportunityCandidates.value = opportunityCandidates.value.filter(candidate => candidate.id !== id)
  saveOpportunityCandidates()
}

const updateOpportunityCandidate = (candidate: BrisageOpportunityCandidate) => {
  const index = opportunityCandidates.value.findIndex(entry => entry.id === candidate.id)
  if (index < 0) return
  opportunityCandidates.value[index] = { ...candidate }
  saveOpportunityCandidates()
}

const opportunityStatusSuggestion = (candidate: BrisageOpportunityCandidate): OpportunityStatus => {
  const profitableSoldSessions = sessions.value.filter(session =>
    session.items.some(item => String(item.itemId) === String(candidate.itemId))
    && sessionTotals(session).realizedProfit > 0
    && session.items.some(item => item.runs.some(run => run.soldConfirmed)),
  ).length
  if (profitableSoldSessions >= 2) return 'validated'
  if (profitableSoldSessions >= 1) return 'test-batch'
  return candidate.status
}

const applyStatusSuggestion = (candidate: BrisageOpportunityCandidate) => {
  updateOpportunityCandidate({
    ...candidate,
    status: opportunityStatusSuggestion(candidate),
    sampleSize: Math.max(Number(candidate.sampleSize ?? 0) || 0, sessions.value.filter(session =>
      session.items.some(item => String(item.itemId) === String(candidate.itemId)),
    ).length),
  })
}

const loadCategoryBatch = async () => {
  const typeIds = draftSession.value.categoryTypeIds
  const levelMin = normalizeLevelValue(draftSession.value.levelMin)
  const levelMax = normalizeLevelValue(draftSession.value.levelMax)

  if (!typeIds.length || !levelMin || !levelMax) {
    loadedBatchResults.value = []
    results.value = []
    return
  }

  loadingBatchResults.value = true
  syncDraftCategoryMeta()

  try {
    const collected: any[] = []
    let skip = 0
    let total = Infinity
    let pageSize = 0

    while (skip < total) {
      const res = await $fetch<any>('/api/dofusdb/items', {
        query: {
          'typeId[$ne]': 203,
          'typeId[$in][]': typeIds,
          'level[$gte]': levelMin,
          'level[$lte]': levelMax,
          '$sort': 'level',
          '$skip': skip,
          'lang': 'fr',
        },
      })

      const pageItems = Array.isArray(res?.data) ? res.data : []
      total = Number(res?.total ?? pageItems.length)
      pageSize = Number(res?.limit ?? pageItems.length)

      if (!pageItems.length) break

      collected.push(...pageItems)

      if (collected.length >= total) break

      skip += pageItems.length || pageSize
      if (!skip) break
    }

    const deduped = new Map<string | number, any>()
    collected.forEach((item) => {
      deduped.set(item?.id ?? crypto.randomUUID(), item)
    })

    loadedBatchResults.value = Array.from(deduped.values()).sort((a, b) => {
      const levelDiff = (Number(a?.level) || 0) - (Number(b?.level) || 0)
      if (levelDiff) return levelDiff
      return String(a?.name?.fr ?? a?.id ?? '').localeCompare(String(b?.name?.fr ?? b?.id ?? ''))
    })
    filterLoadedBatchResults()
  }
  catch {
    loadedBatchResults.value = []
    results.value = []
  }
  finally {
    loadingBatchResults.value = false
  }
}

/** Only guard deletes that destroy real typing. A single rune row or price
 *  entry is cheap to redo, so those stay instant. */
const runHasData = (run: BrisageItemRun) =>
  run.runeOutputs.length > 0 || run.buyStartKamas > 0 || run.buyEndKamas > 0 || run.quantity > 1

const removeDraftItem = (id: string) => {
  const item = draftItems.value.find(entry => entry.id === id)
  if (item?.runs.some(runHasData)) {
    const name = item.item?.name?.fr ?? item.item?.name?.en ?? String(item.itemId)
    if (!confirm(t('v2.brisage.confirm.removeItem', { name }))) return
  }
  draftItems.value = draftItems.value.filter(item => item.id !== id)
  expandedDraftItemIds.value = expandedDraftItemIds.value.filter(currentId => currentId !== id)
  if (loadedBatchResults.value.length) {
    filterLoadedBatchResults()
  }
}

const isDraftItemExpanded = (id: string) => expandedDraftItemIds.value.includes(id)

const toggleDraftItem = (id: string) => {
  expandedDraftItemIds.value = isDraftItemExpanded(id)
    ? expandedDraftItemIds.value.filter(currentId => currentId !== id)
    : [...expandedDraftItemIds.value, id]
}

const isSessionExpanded = (id: string) => expandedSessionIds.value.includes(id)

const toggleSession = (id: string) => {
  expandedSessionIds.value = isSessionExpanded(id)
    ? expandedSessionIds.value.filter(currentId => currentId !== id)
    : [...expandedSessionIds.value, id]
}

const createEmptyRun = (): BrisageItemRun => ({
  id: crypto.randomUUID(),
  quantity: 1,
  buyStartKamas: 0,
  buyEndKamas: 0,
  realizedRuneValue: 0,
  theoreticalRuneValue: 0,
  actualSoldRuneValue: 0,
  unsoldRuneValue: 0,
  soldConfirmed: false,
  saleNotes: '',
  runeOutputs: [],
  notes: '',
})

const createEmptyRuneOutput = (): BrisageRunRuneOutput => ({
  id: crypto.randomUUID(),
  runeId: null,
  runeName: '',
  quantity: 0,
  soldQuantity: 0,
  actualSoldValue: 0,
  theoreticalValue: 0,
  note: '',
})

const addRunToDraftItem = (itemId: string) => {
  const item = draftItems.value.find(entry => entry.id === itemId)
  if (!item) return
  item.runs.push(createEmptyRun())
  if (!isDraftItemExpanded(itemId)) {
    toggleDraftItem(itemId)
  }
}

const removeRunFromDraftItem = (itemId: string, runId: string) => {
  const item = draftItems.value.find(entry => entry.id === itemId)
  if (!item) return
  const run = item.runs.find(entry => entry.id === runId)
  if (run && runHasData(run) && !confirm(t('v2.brisage.confirm.removeRun'))) return
  if (item.runs.length === 1) {
    item.runs[0] = createEmptyRun()
    return
  }
  item.runs = item.runs.filter(run => run.id !== runId)
}

const addRuneOutputToRun = (run: BrisageItemRun) => {
  run.runeOutputs.push(createEmptyRuneOutput())
}

const removeRuneOutputFromRun = (run: BrisageItemRun, outputId: string) => {
  run.runeOutputs = run.runeOutputs.filter(output => output.id !== outputId)
  refreshRunRuneValues(run)
}

const latestRunePriceForOutput = (output: BrisageRunRuneOutput): MarketPrice | null => {
  const idKey = output.runeId != null && output.runeId !== '' ? String(output.runeId) : ''
  const nameKey = normalizeMarketPriceName(output.runeName)
  return latestRunePrices.value.find(price =>
    (idKey && String(price.itemId ?? '') === idKey)
    || normalizeMarketPriceName(price.name) === nameKey,
  ) ?? null
}

const outputUnitPrice = (output: BrisageRunRuneOutput): number => unitMarketPrice(latestRunePriceForOutput(output)) ?? 0

/** The paper value on a rune row is only as good as the price behind it, so the
 *  row says how old that price is — and says plainly when there is none, which
 *  previously just showed a confident "Unit 0". */
const outputPriceState = (output: BrisageRunRuneOutput) => {
  if (!output.runeId && !output.runeName) return { kind: 'none' as const, label: '' }
  const price = latestRunePriceForOutput(output)
  if (!price) return { kind: 'missing' as const, label: t('v2.brisage.labels.noPrice') }
  return { kind: priceFreshness(price.timestamp), label: freshnessLabel(price.timestamp) }
}

const outputPriceTone = (output: BrisageRunRuneOutput) => {
  const state = outputPriceState(output)
  if (state.kind === 'missing' || state.kind === 'stale') return 'text-warning'
  if (state.kind === 'aging') return 'text-warning'
  return 'text-subtle'
}

const refreshRuneOutputValue = (output: BrisageRunRuneOutput) => {
  const unit = outputUnitPrice(output)
  output.theoreticalValue = Math.round(output.quantity * unit)
  if (output.soldQuantity > 0 && output.actualSoldValue <= 0 && unit > 0) {
    output.actualSoldValue = Math.round(output.soldQuantity * unit)
  }
}

/** Rune outputs are the single source of truth for a run's rune value.
 *
 *  brisageAccounting only falls back to the outputs when the stored totals are
 *  zero, so sessions saved before this change keep the exact figures they were
 *  saved with. The moment their runes are edited we clear those stored
 *  overrides, which hands the run over to the derived values. */
const refreshRunRuneValues = (run: BrisageItemRun) => {
  run.runeOutputs.forEach(refreshRuneOutputValue)
  run.theoreticalRuneValue = 0
  run.realizedRuneValue = 0
  run.actualSoldRuneValue = 0
  run.unsoldRuneValue = 0
}

/** Which run's capture zone is busy, so only that one shows a spinner. */
const runCaptureId = ref('')

const captureRunSoldValue = async (run: BrisageItemRun, dataUrl: string) => {
  runCaptureId.value = run.id
  try {
    const result = await runPriceOcr(dataUrl)
    const value = result.candidates[0]
    if (!value) return
    // Applied to the last rune row, which is the one just sold.
    const target = run.runeOutputs.at(-1)
    if (target) {
      target.actualSoldValue = value
      refreshRunRuneValues(run)
    }
  }
  finally {
    runCaptureId.value = ''
  }
}

const setRuneOutput = (run: BrisageItemRun, output: BrisageRunRuneOutput, value: string | number | null) => {
  const id = value == null || value === '' ? null : value
  output.runeId = id
  output.runeName = id == null ? '' : (runeNameById.get(String(id)) ?? '')
  refreshRunRuneValues(run)
}

const runProfit = (run: BrisageItemRun) => runRealizedProfit(run)
const itemProfit = (item: BrisageSessionItem) => itemRealizedProfit(item)
const itemRealizedTotal = (item: BrisageSessionItem) => itemActualSoldRuneValue(item)

const draftRecipeSignature = computed(() =>
  JSON.stringify(
    draftItems.value.map(item => ({
      itemId: item.itemId,
      quantity: itemQuantityTotal(item),
    })),
  ),
)

const draftResourceChecklistByItem = computed(() => {
  const groups = new Map<string, {
    itemKey: string
    itemName: string
    image: string | null
    quantity: number
    resources: BrisageSessionResource[]
  }>()

  draftResourceChecklist.value.forEach((resource) => {
    resource.sourceItems?.forEach((source) => {
      const group = groups.get(source.itemKey) ?? {
        itemKey: source.itemKey,
        itemName: source.itemName,
        image: source.itemImage,
        quantity: source.quantity,
        resources: [],
      }

      group.resources.push({
        ...resource,
        totalQuantity: source.totalQuantity,
      })
      groups.set(source.itemKey, group)
    })
  })

  return Array.from(groups.values()).map(group => ({
    ...group,
    resources: group.resources.sort((a, b) => {
      if (a.isDone !== b.isDone) return Number(a.isDone) - Number(b.isDone)
      if (b.totalQuantity !== a.totalQuantity) return b.totalQuantity - a.totalQuantity
      return a.name.localeCompare(b.name)
    }),
  }))
})

const fetchRecipeChecklist = async () => {
  if (!draftItems.value.length) {
    draftResourceChecklist.value = []
    recipeChecklistState.value = { hasFetched: false, isLoading: false, error: 'Add items first.' }
    return
  }

  recipeChecklistState.value = { hasFetched: true, isLoading: true, error: '' }

  try {
    const existingChecks = new Map<number, boolean>(
      draftResourceChecklist.value.map(resource => [resource.id, resource.isDone]),
    )

    const ingredientMap = new Map<number, BrisageSessionResource>()

    const recipes = await Promise.allSettled(
      draftItems.value.map(async (item) => {
        const recipe = await $fetch<any>(`/api/dofusdb/recipes/${encodeURIComponent(String(item.itemId))}`, {
          query: { lang: 'fr' },
        })
        return { item, recipe }
      }),
    )

    recipes.forEach((result) => {
      if (result.status !== 'fulfilled') return

      const { item, recipe } = result.value
      if (!recipe?.ingredientIds?.length || !recipe?.quantities?.length) return
      const multiplier = Math.max(1, itemQuantityTotal(item))
      const source = {
        itemKey: item.id,
        itemName: item.item?.name?.fr || item.item?.name?.en || `Item #${item.itemId}`,
        itemImage: getItemImg(item.item),
        quantity: multiplier,
      }

      recipe.ingredientIds.forEach((ingredientId: number, index: number) => {
        const ingredient = recipe.ingredients?.find((candidate: any) => candidate.id === ingredientId)
        const baseQuantity = Number(recipe.quantities?.[index] ?? 0) || 0
        const totalQuantity = baseQuantity * multiplier
        const existing = ingredientMap.get(ingredientId)

        if (existing) {
          existing.totalQuantity += totalQuantity
          existing.sourceItems = [
            ...(existing.sourceItems ?? []),
            {
              ...source,
              totalQuantity,
            },
          ]
          return
        }

        ingredientMap.set(ingredientId, {
          id: ingredientId,
          name: ingredient?.name?.fr || ingredient?.name?.en || `Ingredient #${ingredientId}`,
          image: ingredient?.img || null,
          typeName: ingredient?.type?.name?.fr || ingredient?.type?.name?.en || null,
          totalQuantity,
          hasRecipe: Boolean(ingredient?.hasRecipe),
          isDone: existingChecks.get(ingredientId) ?? false,
          sourceItems: [
            {
              ...source,
              totalQuantity,
            },
          ],
        })
      })
    })

    if (!ingredientMap.size) {
      draftResourceChecklist.value = []
      recipeChecklistState.value = {
        hasFetched: true,
        isLoading: false,
        error: 'No recipe ingredients found for the current draft items.',
      }
      return
    }

    draftResourceChecklist.value = Array.from(ingredientMap.values()).sort((a, b) => {
      if (a.isDone !== b.isDone) return Number(a.isDone) - Number(b.isDone)
      if (b.totalQuantity !== a.totalQuantity) return b.totalQuantity - a.totalQuantity
      return a.name.localeCompare(b.name)
    })

    recipeChecklistState.value = { hasFetched: true, isLoading: false, error: '' }
  }
  catch {
    draftResourceChecklist.value = []
    recipeChecklistState.value = {
      hasFetched: true,
      isLoading: false,
      error: 'Failed to load recipe resources for the current draft.',
    }
  }
}

const toggleDraftResourceDone = (resourceId: number) => {
  draftResourceChecklist.value = draftResourceChecklist.value.map(resource =>
    resource.id === resourceId
      ? { ...resource, isDone: !resource.isDone }
      : resource,
  )
}

const sessionTotals = (session: BrisageSession) => {
  const totals = accountingSessionTotals(session)
  return {
    ...totals,
    realized: totals.actualSoldRuneValue,
    profit: totals.realizedProfit,
  }
}

const draftTotals = computed(() => {
  const totals = accountingSessionTotals({
    ...draftSession.value,
    items: draftItems.value,
  })
  return {
    ...totals,
    realized: totals.actualSoldRuneValue,
    profit: totals.realizedProfit,
  }
})

const totalItemsLogged = computed(() =>
  sessions.value.reduce((sum, session) => sum + session.items.length, 0),
)

const totalPL = computed(() =>
  sessions.value.reduce((sum, session) => sum + sessionTotals(session).profit, 0),
)

const avgSessionPL = computed(() => {
  if (!sessions.value.length) return 0
  return Math.round(totalPL.value / sessions.value.length)
})

const sessionSort = ref<'date' | 'profit' | 'margin'>('date')

const sessionSortOptions = computed(() => ([
  { label: t('v2.brisage.sort.date'), value: 'date' },
  { label: t('v2.brisage.summary.sessionPL'), value: 'profit' },
  { label: t('v2.brisage.summary.margin'), value: 'margin' },
]))

/** Sorts a copy — the stored order is the order sessions were logged in and
 *  must not change just because the list is being viewed differently. */
const sortedSessions = computed(() => {
  const list = [...sessions.value]
  if (sessionSort.value === 'profit') {
    return list.sort((a, b) => sessionTotals(b).profit - sessionTotals(a).profit)
  }
  if (sessionSort.value === 'margin') {
    return list.sort((a, b) => sessionMargin(b) - sessionMargin(a))
  }
  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const sessionMargin = (session: BrisageSession) => {
  const totals = sessionTotals(session)
  return brisageMarginPercent(totals.realizedProfit, totals.craft)
}

const brisageOpportunities = computed(() =>
  rankBrisageOpportunities(
    opportunityCandidates.value.map(candidate =>
      buildBrisageOpportunity(candidate, marketPrices.value, opportunityConfig.value),
    ),
  ),
)

const soldConfirmedSessionCount = (candidate: BrisageOpportunityCandidate) =>
  sessions.value.filter(session =>
    session.items.some(item => String(item.itemId) === String(candidate.itemId))
    && sessionTotals(session).realizedProfit > 0
    && session.items.some(item => item.runs.some(run => run.soldConfirmed)),
  ).length

const freshnessLabel = (timestamp: string) => {
  const freshness = priceFreshness(timestamp)
  if (freshness === 'fresh') return t('v2.brisage.freshness.fresh')
  if (freshness === 'aging') return t('v2.brisage.freshness.aging')
  return t('v2.brisage.freshness.stale')
}

const priceKindLabel = (kind: MarketPriceKind) => {
  if (kind === 'finished-item') return t('v2.brisage.kind.finishedItem')
  if (kind === 'rune') return t('v2.brisage.kind.rune')
  return t('v2.brisage.kind.resource')
}

const priceHistory = (price: MarketPrice) => marketPriceHistoryFor(marketPrices.value, price)

const priceHistoryCount = (price: MarketPrice) => priceHistory(price).length

const priceTrend = (price: MarketPrice) => marketPriceTrendPercent(priceHistory(price))

/** History comes back newest-first; the chart wants it chronological. Plots the
 *  unit price so the line stays comparable when quantityBasis differs between
 *  entries. */
const priceChartPoints = (price: MarketPrice) =>
  [...priceHistory(price)]
    .reverse()
    .map(entry => ({
      id: entry.id,
      price: unitMarketPrice(entry) ?? entry.price,
      createdAt: entry.timestamp,
    }))

const saveOpportunitySettings = () => {
  opportunityConfig.value = {
    ...opportunityConfig.value,
    safetyMarkupPercent: Math.max(0, Number(opportunityConfig.value.safetyMarkupPercent) || 0),
    pessimisticRuneMultiplier: Math.max(0, Number(opportunityConfig.value.pessimisticRuneMultiplier) || 0),
    bankroll: Math.max(0, Number(opportunityConfig.value.bankroll) || 0),
    bankrollBatchPercent: Math.max(0, Number(opportunityConfig.value.bankrollBatchPercent) || 0),
    maxBatchCostCap: Math.max(0, Number(opportunityConfig.value.maxBatchCostCap) || 0),
    maxExposureWarningPercent: Math.max(0, Number(opportunityConfig.value.maxExposureWarningPercent) || 0),
  }
  saveOpportunityConfig()
}

const setPessimisticMultiplier = (value: string) => {
  opportunityConfig.value.pessimisticRuneMultiplier = Number(value) || 0
  saveOpportunitySettings()
}

const resetDraft = () => {
  clearStoredDraft()
  editingSessionId.value = null
  draftItems.value = []
  expandedDraftItemIds.value = []
  draftResourceChecklist.value = []
  recipeChecklistState.value = { hasFetched: false, isLoading: false, error: '' }
  draftSession.value = {
    date: todayISO(),
    startingKamas: 0,
    endingKamas: 0,
    externalDelta: 0,
    categoryTypeId: null,
    categoryTypeIds: [],
    levelMin: null,
    levelMax: null,
    categoryLabel: '',
    notes: '',
  }
  clearSearch()
}

const startSessionBuilder = () => {
  brisageMode.value = 'builder'
}

const showSessionHistory = () => {
  brisageMode.value = 'history'
}

const openSessionEditor = (id: string) => {
  const session = sessions.value.find(entry => entry.id === id)
  if (!session) return

  editingSessionId.value = session.id
  draftSession.value = {
    date: session.date || todayISO(),
    startingKamas: Math.max(0, Number(session.startingKamas) || 0),
    endingKamas: Math.max(0, Number(session.endingKamas) || 0),
    externalDelta: Math.max(0, Number(session.externalDelta) || 0),
    categoryTypeId: session.categoryTypeId,
    categoryTypeIds: [...session.categoryTypeIds],
    levelMin: normalizeLevelValue(session.levelMin),
    levelMax: normalizeLevelValue(session.levelMax),
    categoryLabel: session.categoryLabel || '',
    notes: session.notes || '',
  }
  draftItems.value = session.items.map(item => ({
    ...item,
    runs: item.runs.map(run => ({ ...run })),
  }))
  draftResourceChecklist.value = session.resourceChecklist.map(resource => ({
    ...resource,
    sourceItems: resource.sourceItems?.map(source => ({ ...source })),
  }))
  expandedDraftItemIds.value = []
  recipeChecklistState.value = { hasFetched: Boolean(draftResourceChecklist.value.length), isLoading: false, error: '' }
  clearSearch()
  startSessionBuilder()
}

const saveSession = () => {
  if (!draftItems.value.length) return

  const sessionId = editingSessionId.value ?? crypto.randomUUID()
  const nextSession: BrisageSession = {
    id: sessionId,
    date: draftSession.value.date || todayISO(),
    startingKamas: Number(draftSession.value.startingKamas) || 0,
    endingKamas: Number(draftSession.value.endingKamas) || 0,
    externalDelta: Math.max(0, Number(draftSession.value.externalDelta) || 0),
    categoryTypeId: draftSession.value.categoryTypeIds[0] ?? null,
    categoryTypeIds: [...draftSession.value.categoryTypeIds],
    levelMin: normalizeLevelValue(draftSession.value.levelMin),
    levelMax: normalizeLevelValue(draftSession.value.levelMax),
    categoryLabel: (selectedCategoryLabel.value || draftSession.value.categoryLabel).trim(),
    notes: draftSession.value.notes.trim(),
    items: draftItems.value.map(item => ({
      id: item.id,
      itemId: item.itemId,
      item: item.item,
      notes: item.notes.trim(),
      runs: item.runs.map(run => ({
        id: run.id,
        quantity: Math.max(1, Number(run.quantity) || 1),
        buyStartKamas: Math.max(0, Number(run.buyStartKamas) || 0),
        buyEndKamas: Math.max(0, Number(run.buyEndKamas) || 0),
        realizedRuneValue: Math.max(0, Number(run.theoreticalRuneValue ?? run.realizedRuneValue) || 0),
        theoreticalRuneValue: Math.max(0, Number(run.theoreticalRuneValue ?? run.realizedRuneValue) || 0),
        actualSoldRuneValue: Math.max(0, Number(run.actualSoldRuneValue) || 0),
        unsoldRuneValue: Math.max(0, Number(run.unsoldRuneValue) || 0),
        soldConfirmed: Boolean(run.soldConfirmed),
        saleNotes: run.saleNotes.trim(),
        runeOutputs: run.runeOutputs.map(output => ({
          id: output.id,
          runeId: output.runeId ?? null,
          runeName: output.runeName.trim(),
          quantity: Math.max(0, Number(output.quantity) || 0),
          soldQuantity: Math.max(0, Number(output.soldQuantity) || 0),
          actualSoldValue: Math.max(0, Number(output.actualSoldValue) || 0),
          theoreticalValue: Math.max(0, Number(output.theoreticalValue) || 0),
          note: output.note.trim(),
        })).filter(output => output.runeName && output.quantity > 0),
        notes: run.notes.trim(),
      })),
    })),
    resourceChecklist: draftResourceChecklist.value.map(resource => ({ ...resource })),
  }

  const existingIndex = sessions.value.findIndex(session => session.id === sessionId)
  if (existingIndex >= 0) sessions.value[existingIndex] = nextSession
  else sessions.value.unshift(nextSession)

  saveSessions()
  resetDraft()
  showSessionHistory()
}

const deleteSession = (id: string) => {
  const session = sessions.value.find(entry => entry.id === id)
  if (session) {
    const name = session.categoryLabel || t('v2.brisage.labels.generalSession')
    if (!confirm(t('v2.brisage.confirm.deleteSession', { name, count: session.items.length }))) return
  }
  sessions.value = sessions.value.filter(session => session.id !== id)
  if (editingSessionId.value === id) resetDraft()
  saveSessions()
}

const describeSessionScope = (session: BrisageSession) => {
  const parts: string[] = []
  if (session.levelMin && session.levelMax) parts.push(t('v2.brisage.scope.range', { min: session.levelMin, max: session.levelMax }))
  else if (session.levelMin) parts.push(t('v2.brisage.scope.minOnly', { min: session.levelMin }))
  else if (session.levelMax) parts.push(t('v2.brisage.scope.maxOnly', { max: session.levelMax }))
  if (session.categoryLabel) parts.push(session.categoryLabel)
  return parts.join(' · ') || t('v2.brisage.scope.none')
}

const getItemImg = (item: any) => item?.img ?? ''
const onImgErr = (e: Event) => {
  const img = e.target as HTMLImageElement
  if (img.dataset.fb) return
  img.dataset.fb = '1'
  img.src = '/item-fallback.svg'
}

function todayISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

const formatDisplayDate = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })
}

const searchAreaEl = ref<HTMLElement | null>(null)
const onDocMousedown = (e: MouseEvent) => {
  const t = e.target as Node
  if (searchAreaEl.value && !searchAreaEl.value.contains(t)) {
    results.value = []
  }
  if (categoryPickerEl.value && !categoryPickerEl.value.contains(t)) {
    categoryPickerOpen.value = false
  }
}

onMounted(() => {
  initContext()
  loadData()
  loadMarketAndOpportunities()
  document.addEventListener('mousedown', onDocMousedown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocMousedown)
  // Navigating away inside the debounce window would otherwise drop the last
  // keystrokes; flush rather than wait.
  clearTimeout(draftSaveTimer)
  saveDraft()
})
watch([selectedServer, selectedCharacter], () => {
  loadData()
  loadMarketAndOpportunities()
})

// Watches only the mutable parts of the draft. A deep watch would traverse the
// embedded DofusDB item payload (~40KB per item, never edited after it is added)
// on every keystroke; runs and notes are the only things that change.
const draftSignature = computed(() => [
  editingSessionId.value,
  JSON.stringify(draftSession.value),
  draftItems.value.map(item => `${item.id}:${item.notes}:${JSON.stringify(item.runs)}`).join('|'),
].join('~'))

// Debounced so a burst of keystrokes writes once, not per character.
let draftSaveTimer: ReturnType<typeof setTimeout> | undefined
watch(draftSignature, () => {
  clearTimeout(draftSaveTimer)
  draftSaveTimer = setTimeout(saveDraft, 400)
})
watch(
  () => [
    draftSession.value.categoryTypeIds.join(','),
    draftSession.value.levelMin,
    draftSession.value.levelMax,
  ],
  clearLoadedBatchResults,
)
watch(draftRecipeSignature, async () => {
  if (!draftItems.value.length) {
    draftResourceChecklist.value = []
    recipeChecklistState.value = {
      hasFetched: false,
      isLoading: false,
      error: '',
    }
    return
  }

  if (!recipeChecklistState.value.hasFetched || recipeChecklistState.value.isLoading) {
    return
  }

  await fetchRecipeChecklist()
})
</script>
