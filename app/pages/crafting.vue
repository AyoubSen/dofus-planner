<template>
  <div v-if="hasContext" class="flex flex-col gap-5">
    <!-- ── Totals ───────────────────────────────────────────────────────── -->
    <UiStatRow min="10rem">
      <UiStat :label="$t('v2.crafting.stats.sessions')" :value="sessions.length" />
      <UiStat :label="$t('v2.crafting.stats.itemsLogged')" :value="totalItemsLogged" />
      <UiStat :label="$t('v2.crafting.stats.invested')">
        <UiMoney :value="totalInvested" short size="lg" />
      </UiStat>
      <UiStat :label="$t('v2.crafting.stats.realized')">
        <UiMoney :value="totalRealized" short size="lg" />
      </UiStat>
      <UiStat :label="$t('v2.crafting.stats.netPL')">
        <UiMoney :value="totalProfit" signed short size="lg" />
      </UiStat>
    </UiStatRow>

    <!-- ── Editor ───────────────────────────────────────────────────────── -->
    <UiPageSection
      v-if="isEditorOpen"
      :title="isEditingExisting ? $t('v2.crafting.editor.editSession') : $t('v2.crafting.editor.newSession')"
    >
      <template #actions>
        <UiButton size="sm" @click="closeEditor">
          {{ $t('v2.crafting.actions.backToSessions') }}
        </UiButton>
        <UiButton variant="primary" size="sm" :disabled="draftItems.length === 0" @click="saveSession">
          {{ isEditingExisting ? $t('v2.crafting.actions.updateSession') : $t('v2.crafting.actions.saveSession') }}
        </UiButton>
      </template>

      <div class="flex flex-col gap-4">
        <!-- Session identity -->
        <UiCard>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <UiField :label="$t('v2.crafting.fields.date')">
              <UiDateInput v-model="draftSession.date" />
            </UiField>
            <UiField :label="$t('v2.crafting.fields.workflow')">
              <UiSelect
                v-model="draftSession.workflow"
                :options="workflowOptions"
                :placeholder="$t('v2.crafting.placeholders.selectWorkflow')"
              />
            </UiField>
            <UiField :label="$t('v2.crafting.fields.sessionFocus')">
              <UiSelect
                v-model="draftSession.focus"
                :options="focusOptions"
                :placeholder="$t('v2.crafting.placeholders.selectFocus')"
              />
            </UiField>
            <UiField :label="$t('v2.crafting.fields.notes')" class="sm:col-span-2 lg:col-span-3">
              <UiInput v-model="draftSession.notes" :placeholder="$t('v2.crafting.placeholders.sessionNotes')" />
            </UiField>
          </div>
        </UiCard>

        <!-- Bankroll -->
        <UiCard :title="$t('v2.crafting.sections.sessionBankroll')">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <p class="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
                {{ $t('v2.crafting.sections.bankrollStart') }}
              </p>
              <div class="grid gap-3 sm:grid-cols-2">
                <UiField :label="$t('v2.crafting.sections.bankrollKamas')">
                  <UiNumberInput v-model="draftSession.startingKamas" :min="0" />
                </UiField>
                <UiField :label="$t('v2.crafting.sections.bankrollRunes')">
                  <UiNumberInput v-model="draftSession.startingRuneStockValue" :min="0" />
                </UiField>
              </div>
            </div>
            <div>
              <p class="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
                {{ $t('v2.crafting.sections.bankrollCurrent') }}
              </p>
              <div class="grid gap-3 sm:grid-cols-2">
                <UiField :label="$t('v2.crafting.sections.bankrollKamas')">
                  <UiNumberInput v-model="draftSession.currentKamas" :min="0" />
                </UiField>
                <UiField :label="$t('v2.crafting.sections.bankrollRunes')">
                  <UiNumberInput v-model="draftSession.currentRuneStockValue" :min="0" />
                </UiField>
              </div>
            </div>
          </div>

          <UiField :label="$t('v2.crafting.fields.globalExpenses')" class="mt-3 sm:max-w-xs">
            <UiNumberInput
              v-model="draftSession.sessionExpenses"
              :min="0"
              :placeholder="$t('v2.crafting.placeholders.globalExpenses')"
            />
          </UiField>

          <dl class="mt-4 grid gap-x-6 gap-y-1.5 border-t border-line pt-3 sm:grid-cols-2">
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-xs text-subtle">{{ $t('v2.crafting.summary.startingBankroll') }}</dt>
              <dd><UiMoney :value="sessionDraftSummary.startingBankroll" short size="sm" /></dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-xs text-subtle">{{ $t('v2.crafting.summary.currentAssets') }}</dt>
              <dd><UiMoney :value="sessionDraftSummary.currentAssets" short size="sm" /></dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-xs text-subtle">{{ $t('v2.crafting.summary.itemsBuiltValue') }}</dt>
              <dd><UiMoney :value="sessionDraftSummary.builtItemsValue" short size="sm" /></dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-xs text-subtle">{{ $t('v2.crafting.summary.bankrollDelta') }}</dt>
              <dd><UiMoney :value="sessionDraftSummary.bankrollDelta" signed short size="sm" /></dd>
            </div>
          </dl>
        </UiCard>

        <!-- Item search -->
        <UiCard :title="$t('v2.crafting.sections.addItems')">
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
                class="flex items-center gap-3 rounded-md border border-line bg-surface p-2 text-left transition-colors hover:border-line-strong disabled:opacity-45"
                :disabled="draftItemIdSet.has(String(item.id))"
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
                <span class="shrink-0 text-xs text-accent">
                  {{ draftItemIdSet.has(String(item.id)) ? $t('v2.crafting.actions.added') : $t('v2.crafting.actions.add') }}
                </span>
              </button>
            </div>

            <p v-else-if="search" class="mt-3 text-xs text-subtle">
              {{ $t('v2.crafting.messages.noItemsFound', { search }) }}
            </p>
          </div>
        </UiCard>

        <!-- Draft items -->
        <UiEmptyState v-if="!draftItems.length" :title="$t('v2.crafting.editor.emptyDraft')">
          <template #icon><UiIcon name="crafting" /></template>
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
                {{ isDraftItemExpanded(draftItem.id) ? $t('v2.crafting.actions.hideDetails') : $t('v2.crafting.actions.editDetails') }}
              </UiButton>
              <UiButton
                variant="danger"
                size="sm"
                icon
                :aria-label="$t('v2.crafting.actions.removeItem')"
                @click="removeDraftItem(draftItem.id)"
              >
                <UiIcon name="trash" />
              </UiButton>
            </div>
          </div>

          <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
            <UiBadge>{{ formatOutcomeLabel(draftItem.outcome) }}</UiBadge>
            <span>{{ $t('v2.crafting.summary.invested') }} <UiMoney :value="itemInvested(draftItem)" short size="sm" /></span>
            <span>{{ $t('v2.crafting.summary.realized') }} <UiMoney :value="itemRealized(draftItem)" short size="sm" /></span>
            <UiMoney :value="itemProfit(draftItem)" signed short size="sm" />
          </div>

          <div v-if="isDraftItemExpanded(draftItem.id)" class="mt-4 border-t border-line pt-4">
            <div class="grid gap-3 sm:grid-cols-3">
              <UiField :label="$t('v2.crafting.fields.acquisition')">
                <UiSelect
                  v-model="draftItem.acquisitionMode"
                  :options="acquisitionOptions"
                  size="sm"
                  :placeholder="$t('v2.crafting.placeholders.selectAcquisition')"
                />
              </UiField>
              <UiField :label="$t('v2.crafting.fields.targetMode')">
                <UiSelect
                  v-model="draftItem.targetMode"
                  :options="targetModeOptions"
                  size="sm"
                  :placeholder="$t('v2.crafting.placeholders.selectTargetMode')"
                />
              </UiField>
              <UiField :label="$t('v2.crafting.fields.outcome')">
                <UiSelect
                  v-model="draftItem.outcome"
                  :options="outcomeOptions"
                  size="sm"
                  :placeholder="$t('v2.crafting.placeholders.selectOutcome')"
                />
              </UiField>
            </div>

            <div class="mt-4">
              <UiSegmented
                :model-value="getItemTab(draftItem.id)"
                :options="itemTabOptions"
                size="sm"
                :aria-label="$t('v2.crafting.sections.addItems')"
                @update:model-value="setItemTab(draftItem.id, $event as 'craft' | 'fm' | 'sale')"
              />
            </div>

            <div v-if="getItemTab(draftItem.id) === 'craft'" class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <UiField :label="$t('v2.crafting.fields.craftKamasBefore')">
                <UiNumberInput v-model="draftItem.craftKamasBefore" :min="0" size="sm" />
              </UiField>
              <UiField :label="$t('v2.crafting.fields.craftKamasAfter')">
                <UiNumberInput v-model="draftItem.craftKamasAfter" :min="0" size="sm" />
              </UiField>
              <UiField :label="$t('v2.crafting.fields.craftCost')">
                <div class="flex h-8 items-center rounded-md border border-dashed border-line px-2.5">
                  <UiMoney :value="itemCraftCost(draftItem)" short size="sm" />
                </div>
              </UiField>
              <UiField :label="$t('v2.crafting.fields.extraItemExpenses')">
                <UiNumberInput v-model="draftItem.extraExpenses" :min="0" size="sm" />
              </UiField>
            </div>

            <div v-else-if="getItemTab(draftItem.id) === 'fm'" class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <UiField :label="$t('v2.crafting.fields.runeValueBeforeFm')">
                <UiNumberInput v-model="draftItem.runeValueBeforeFm" :min="0" size="sm" />
              </UiField>
              <UiField :label="$t('v2.crafting.fields.runePurchases')">
                <UiNumberInput v-model="draftItem.runePurchases" :min="0" size="sm" />
              </UiField>
              <UiField :label="$t('v2.crafting.fields.runeValueAfterFm')">
                <UiNumberInput v-model="draftItem.runeValueAfterFm" :min="0" size="sm" />
              </UiField>
              <UiField :label="$t('v2.crafting.fields.fmCost')">
                <div class="flex h-8 items-center rounded-md border border-dashed border-line px-2.5">
                  <UiMoney :value="itemFmCost(draftItem)" short size="sm" />
                </div>
              </UiField>
            </div>

            <template v-else>
              <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <UiField :label="$t('v2.crafting.fields.expectedSellPrice')">
                  <UiNumberInput v-model="draftItem.expectedSalePrice" :min="0" size="sm" />
                </UiField>
                <UiField :label="$t('v2.crafting.fields.listPrice')">
                  <UiNumberInput v-model="draftItem.listedPrice" :min="0" size="sm" />
                </UiField>
                <UiField :label="$t('v2.crafting.fields.soldPrice')">
                  <UiNumberInput v-model="draftItem.realizedSalePrice" :min="0" size="sm" />
                </UiField>
                <UiField :label="$t('v2.crafting.fields.brisageRecovery')">
                  <UiNumberInput v-model="draftItem.brisageRecovery" :min="0" size="sm" />
                </UiField>
              </div>

              <dl class="mt-3 grid gap-x-6 gap-y-1.5 border-t border-line pt-3 sm:grid-cols-2">
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-xs text-subtle">{{ $t('v2.crafting.summary.fmCost') }}</dt>
                  <dd><UiMoney :value="itemFmCost(draftItem)" short size="sm" /></dd>
                </div>
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-xs text-subtle">{{ $t('v2.crafting.summary.totalInvested') }}</dt>
                  <dd><UiMoney :value="itemInvested(draftItem)" short size="sm" /></dd>
                </div>
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-xs text-subtle">{{ $t('v2.crafting.summary.realizedValue') }}</dt>
                  <dd><UiMoney :value="itemRealized(draftItem)" short size="sm" /></dd>
                </div>
                <div class="flex items-baseline justify-between gap-3">
                  <dt class="text-xs text-subtle">{{ $t('v2.crafting.summary.pl') }}</dt>
                  <dd><UiMoney :value="itemProfit(draftItem)" signed short size="sm" /></dd>
                </div>
              </dl>
            </template>
          </div>
        </UiCard>

        <!-- Recipe checklist -->
        <UiCard :title="$t('v2.crafting.sections.recipeChecklist')">
          <template #actions>
            <UiButton
              size="sm"
              :disabled="draftItems.length === 0"
              :loading="recipeChecklistState.isLoading"
              @click="fetchRecipeChecklist"
            >
              {{ $t('v2.crafting.actions.fetchRecipes') }}
            </UiButton>
          </template>

          <p v-if="recipeChecklistState.error" class="text-xs text-negative">
            {{ recipeChecklistState.error }}
          </p>

          <div v-if="draftResourceChecklist.length" class="flex flex-col gap-1">
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
                  {{ resource.typeName ?? $t('v2.crafting.common.resource') }}
                </div>
              </div>
              <span class="tabular shrink-0 text-sm text-muted">{{ resource.totalQuantity }}</span>
            </label>
          </div>
        </UiCard>
      </div>
    </UiPageSection>

    <!-- ── History ──────────────────────────────────────────────────────── -->
    <UiPageSection
      :title="$t('v2.crafting.index.sessionHistory')"
      :description="isEditorOpen ? undefined : $t('v2.crafting.index.createSessionDesc')"
    >
      <template #actions>
        <UiBadge>{{ sessions.length }}</UiBadge>
        <UiButton v-if="!isEditorOpen" variant="primary" size="sm" @click="startNewSession">
          <template #icon><UiIcon name="plus" /></template>
          {{ $t('v2.crafting.actions.newSession') }}
        </UiButton>
      </template>

      <UiEmptyState v-if="sessions.length === 0" :title="$t('v2.crafting.index.emptySessions')">
        <template #icon><UiIcon name="crafting" /></template>
      </UiEmptyState>

      <div v-else class="flex flex-col gap-3">
        <UiCard v-for="session in sessions" :key="session.id">
          <div class="flex flex-wrap items-start gap-3">
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-semibold text-ink">{{ sessionTitle(session) }}</div>
              <div class="truncate text-xs text-subtle">
                {{ formatDisplayDate(session.date) }} · {{ formatWorkflowLabel(session.workflow) }}
                · {{ t('v2.crafting.index.itemsCount', { count: session.items.length }) }}
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <UiButton variant="ghost" size="sm" @click="openSessionEditor(session.id)">
                {{ $t('v2.crafting.actions.edit') }}
              </UiButton>
              <UiButton variant="ghost" size="sm" @click="toggleSession(session.id)">
                {{ isSessionExpanded(session.id) ? $t('v2.crafting.actions.hideDetails') : $t('v2.crafting.actions.showDetails') }}
              </UiButton>
              <UiButton
                variant="danger"
                size="sm"
                icon
                :aria-label="$t('v2.crafting.actions.deleteSession')"
                @click="deleteSession(session.id)"
              >
                <UiIcon name="trash" />
              </UiButton>
            </div>
          </div>

          <dl class="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <dt class="text-xs text-subtle">{{ $t('v2.crafting.stats.invested') }}</dt>
              <dd class="mt-0.5"><UiMoney :value="sessionTotals(session).invested" short size="sm" /></dd>
            </div>
            <div>
              <dt class="text-xs text-subtle">{{ $t('v2.crafting.stats.realized') }}</dt>
              <dd class="mt-0.5"><UiMoney :value="sessionTotals(session).realized" short size="sm" /></dd>
            </div>
            <div>
              <dt class="text-xs text-subtle">{{ $t('v2.crafting.stats.expected') }}</dt>
              <dd class="mt-0.5"><UiMoney :value="sessionTotals(session).expected" short size="sm" /></dd>
            </div>
            <div>
              <dt class="text-xs text-subtle">{{ $t('v2.crafting.stats.assets') }}</dt>
              <dd class="mt-0.5"><UiMoney :value="sessionTotals(session).currentAssets" short size="sm" /></dd>
            </div>
            <div>
              <dt class="text-xs text-subtle">{{ $t('v2.crafting.stats.bankrollDelta') }}</dt>
              <dd class="mt-0.5"><UiMoney :value="sessionTotals(session).bankrollDelta" signed short size="sm" /></dd>
            </div>
          </dl>

          <div v-if="isSessionExpanded(session.id)" class="mt-3 flex flex-col gap-2 border-t border-line pt-3">
            <div
              v-for="item in session.items"
              :key="item.id"
              class="rounded-md border border-line bg-sunken p-2.5"
            >
              <div class="flex flex-wrap items-center gap-3">
                <img
                  :src="getItemImg(item.item)"
                  :alt="''"
                  class="size-8 shrink-0 rounded-md bg-surface object-contain"
                  @error="onImgErr"
                >
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm text-ink">{{ item.item?.name?.fr ?? item.itemId }}</div>
                  <div class="truncate text-xs text-subtle">
                    {{ formatTargetModeLabel(item.targetMode) }} · {{ formatOutcomeLabel(item.outcome) }}
                  </div>
                </div>
                <UiMoney :value="itemProfit(item)" signed short size="sm" />
              </div>

              <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
                <span>{{ $t('v2.crafting.summary.craft') }} <UiMoney :value="itemCraftCost(item)" short size="sm" /></span>
                <span>{{ $t('v2.crafting.summary.fm') }} <UiMoney :value="itemFmCost(item)" short size="sm" /></span>
                <span v-if="item.listedPrice > 0">{{ $t('v2.crafting.summary.list') }} <UiMoney :value="item.listedPrice" short size="sm" /></span>
                <span>{{ $t('v2.crafting.summary.realized') }} <UiMoney :value="itemRealized(item)" short size="sm" /></span>
              </div>
            </div>
          </div>
        </UiCard>
      </div>
    </UiPageSection>
  </div>
</template>

<script setup lang="ts">
import type { SoldItem } from '~/types/game'

const { t } = useI18n()

type WorkflowMode = 'craft' | 'fm' | 'craft_fm'
type SessionFocus = 'clean' | 'perfect' | 'over' | 'exo' | 'mixed'
type AcquisitionMode = 'crafted' | 'bought' | 'mixed'
type TargetMode = 'clean' | 'perfect' | 'over' | 'exo'
type OutcomeMode = 'in_progress' | 'listed' | 'sold' | 'kept' | 'brisaged' | 'failed'
type AttemptTag = 'setup' | 'upgrade' | 'stabilized' | 'exo_hit' | 'brick' | 'stop'
type TargetPriority = 'ignore' | 'low' | 'normal' | 'high' | 'critical'

const workflowOptions = computed(() => ([
  { key: 'craft', label: t('v2.crafting.options.workflow.craft'), value: 'craft' },
  { key: 'fm', label: t('v2.crafting.options.workflow.fm'), value: 'fm' },
  { key: 'craft_fm', label: t('v2.crafting.options.workflow.craftFm'), value: 'craft_fm' },
]) satisfies Array<{ key: string; label: string; value: WorkflowMode }>)

const focusOptions = computed(() => ([
  { key: 'clean', label: t('v2.crafting.options.focus.clean'), value: 'clean' },
  { key: 'perfect', label: t('v2.crafting.options.focus.perfect'), value: 'perfect' },
  { key: 'over', label: t('v2.crafting.options.focus.over'), value: 'over' },
  { key: 'exo', label: t('v2.crafting.options.focus.exo'), value: 'exo' },
  { key: 'mixed', label: t('v2.crafting.options.focus.mixed'), value: 'mixed' },
]) satisfies Array<{ key: string; label: string; value: SessionFocus }>)

const acquisitionOptions = computed(() => ([
  { key: 'crafted', label: t('v2.crafting.options.acquisition.crafted'), value: 'crafted' },
  { key: 'bought', label: t('v2.crafting.options.acquisition.bought'), value: 'bought' },
  { key: 'mixed', label: t('v2.crafting.options.acquisition.mixed'), value: 'mixed' },
]) satisfies Array<{ key: string; label: string; value: AcquisitionMode }>)

const targetModeOptions = computed(() => ([
  { key: 'clean', label: t('v2.crafting.options.targetMode.clean'), value: 'clean' },
  { key: 'perfect', label: t('v2.crafting.options.targetMode.perfect'), value: 'perfect' },
  { key: 'over', label: t('v2.crafting.options.targetMode.over'), value: 'over' },
  { key: 'exo', label: t('v2.crafting.options.targetMode.exo'), value: 'exo' },
]) satisfies Array<{ key: string; label: string; value: TargetMode }>)

const outcomeOptions = computed(() => ([
  { key: 'in_progress', label: t('v2.crafting.options.outcome.inProgress'), value: 'in_progress' },
  { key: 'listed', label: t('v2.crafting.options.outcome.listed'), value: 'listed' },
  { key: 'sold', label: t('v2.crafting.options.outcome.sold'), value: 'sold' },
  { key: 'kept', label: t('v2.crafting.options.outcome.kept'), value: 'kept' },
  { key: 'brisaged', label: t('v2.crafting.options.outcome.brisaged'), value: 'brisaged' },
  { key: 'failed', label: t('v2.crafting.options.outcome.failed'), value: 'failed' },
]) satisfies Array<{ key: string; label: string; value: OutcomeMode }>)

interface DraftTargetStat {
  id: string
  effectId: number
  label: string
  min: number
  max: number
  baseValue: number
  targetValue: number
  priority: TargetPriority
}

interface DraftAttempt {
  id: string
  date: string
  runeCost: number
  estimatedValue: number
  tag: AttemptTag
  statsNote: string
  notes: string
}

interface RecipeChecklistResource {
  id: number
  name: string
  image: string | null
  typeName: string | null
  totalQuantity: number
  hasRecipe: boolean
  isDone: boolean
}

interface DraftCraftFmItem {
  id: string
  itemId: string | number
  item: any
  acquisitionMode: AcquisitionMode
  craftKamasBefore: number
  craftKamasAfter: number
  extraExpenses: number
  runeValueBeforeFm: number
  runePurchases: number
  runeValueAfterFm: number
  targetMode: TargetMode
  targetSummary: string
  stopRule: string
  expectedSalePrice: number
  listedPrice: number
  realizedSalePrice: number
  brisageRecovery: number
  outcome: OutcomeMode
  notes: string
  targetStats: DraftTargetStat[]
  attempts: DraftAttempt[]
}

interface CraftFmSession {
  id: string
  date: string
  workflow: WorkflowMode
  focus: SessionFocus
  startingKamas: number
  currentKamas: number
  startingRuneStockValue: number
  currentRuneStockValue: number
  sessionExpenses: number
  notes: string
  items: DraftCraftFmItem[]
  resourceChecklist: RecipeChecklistResource[]
}

const LEGACY_CRAFT_TAG = '[Crafted]'

const { selectedServer, selectedCharacter, hasContext, initContext } = useV2Context()
const { data, init: initStore } = useAppDataStore()

const sessionsKey = computed(() => `craft_fm_sessions_${selectedServer.value?.id}_${selectedCharacter.value?.id}`)

const sessions = ref<CraftFmSession[]>([])
const draftItems = ref<DraftCraftFmItem[]>([])
const expandedDraftItemIds = ref<string[]>([])
const expandedSessionIds = ref<string[]>([])
const itemTabs = ref<Record<string, 'craft' | 'fm' | 'sale'>>({})

const getItemTab = (id: string): 'craft' | 'fm' | 'sale' => itemTabs.value[id] ?? 'craft'
const setItemTab = (id: string, tab: 'craft' | 'fm' | 'sale') => { itemTabs.value[id] = tab }
const editingSessionId = ref<string>('')
const draftResourceChecklist = ref<RecipeChecklistResource[]>([])
const recipeChecklistState = ref({
  hasFetched: false,
  isLoading: false,
  error: '',
})

const draftSession = ref({
  date: todayISO(),
  workflow: 'craft_fm' as WorkflowMode,
  focus: 'mixed' as SessionFocus,
  startingKamas: 0,
  currentKamas: 0,
  startingRuneStockValue: 0,
  currentRuneStockValue: 0,
  sessionExpenses: 0,
  notes: '',
})

const search = ref('')
const searching = ref(false)
const results = ref<any[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

const searchAreaEl = ref<HTMLElement | null>(null)
const isEditorOpen = computed(() => editingSessionId.value === '__new__' || Boolean(editingSessionId.value))
const isEditingExisting = computed(() => Boolean(editingSessionId.value) && editingSessionId.value !== '__new__')

const itemTabOptions = computed(() => ([
  { label: t('v2.crafting.sections.craft'), value: 'craft' },
  { label: 'FM', value: 'fm' },
  { label: t('v2.crafting.sections.sale'), value: 'sale' },
]))

const draftItemIdSet = computed(() => new Set(draftItems.value.map((item) => String(item.itemId))))

const totalItemsLogged = computed(() =>
  sessions.value.reduce((sum, session) => sum + session.items.length, 0),
)

const totalInvested = computed(() =>
  sessions.value.reduce((sum, session) => sum + sessionTotals(session).invested, 0),
)

const totalRealized = computed(() =>
  sessions.value.reduce((sum, session) => sum + sessionTotals(session).realized, 0),
)

const totalProfit = computed(() => totalRealized.value - totalInvested.value)

const effectCache = ref<Record<string, any>>({})

const readEffectCache = () => {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem('craft-fm-effect-cache-v1')
    if (!raw) return
    const parsed = JSON.parse(raw)
    effectCache.value = parsed && typeof parsed === 'object' ? parsed : {}
  }
  catch {
    effectCache.value = {}
  }
}

const writeEffectCache = () => {
  if (!import.meta.client) return
  localStorage.setItem('craft-fm-effect-cache-v1', JSON.stringify(effectCache.value))
}

const saveSessions = () => {
  if (!import.meta.client) return
  localStorage.setItem(sessionsKey.value, JSON.stringify(sessions.value))
}

const createEmptyAttempt = (): DraftAttempt => ({
  id: crypto.randomUUID(),
  date: todayISO(),
  runeCost: 0,
  estimatedValue: 0,
  tag: 'setup',
  statsNote: '',
  notes: '',
})

const formatEffectLabel = (effData: any, eff: any) => {
  let desc = effData?.description?.fr ?? effData?.description?.en ?? `Effet ${eff.effectId ?? eff.id}`
  const from = Number(eff.from ?? eff.value ?? 0)
  const to = Number(eff.to ?? eff.value ?? 0)

  if (from === to) {
    desc = desc
      .replace(/\{[^}]*\}/g, '')
      .replace(/#1/g, String(from))
      .replace(/#2/g, '')
      .trim()
  }
  else {
    desc = desc
      .replace(/#1/g, String(from))
      .replace(/#2/g, String(to))
      .replace(/\{~1~2 ([^}]*)\}/g, '$1')
      .replace(/\{[^}]*\}/g, '')
      .trim()
  }

  return desc.replace(/\s{2,}/g, ' ').trim()
}

const fetchEffect = async (effectId: number) => {
  const cacheKey = String(effectId)
  if (effectCache.value[cacheKey]) return effectCache.value[cacheKey]
  const fetched = await $fetch<any>(`/api/dofusdb/effects/${effectId}`)
  effectCache.value[cacheKey] = fetched
  writeEffectCache()
  return fetched
}

const buildTargetStats = async (item: any): Promise<DraftTargetStat[]> => {
  if (!Array.isArray(item?.effects) || !item.effects.length) return []

  const stats = await Promise.all(
    item.effects.map(async (effect: any, index: number) => {
      const effectId = Number(effect.effectId ?? effect.id ?? 0)
      if (!effectId) return null

      let effectData: any = null
      try {
        effectData = await fetchEffect(effectId)
      }
      catch {
        effectData = null
      }

      const min = Number(effect.from ?? effect.value ?? 0)
      const max = Number(effect.to ?? effect.value ?? 0)

      return {
        id: `${effectId}-${index}`,
        effectId,
        label: formatEffectLabel(effectData, effect),
        min,
        max: max || min,
        baseValue: Number(effect.value ?? effect.from ?? 0),
        targetValue: max || min,
        priority: 'normal' as TargetPriority,
      }
    }),
  )

  return stats.filter(Boolean) as DraftTargetStat[]
}

const buildDraftItem = async (item: any): Promise<DraftCraftFmItem> => ({
  id: crypto.randomUUID(),
  itemId: item.id,
  item,
  acquisitionMode: 'crafted',
  craftKamasBefore: 0,
  craftKamasAfter: 0,
  extraExpenses: 0,
  runeValueBeforeFm: 0,
  runePurchases: 0,
  runeValueAfterFm: 0,
  targetMode: 'clean',
  targetSummary: '',
  stopRule: '',
  expectedSalePrice: 0,
  listedPrice: 0,
  realizedSalePrice: 0,
  brisageRecovery: 0,
  outcome: 'in_progress',
  notes: '',
  targetStats: await buildTargetStats(item),
  attempts: [createEmptyAttempt()],
})

const normalizeAttempt = (value: any): DraftAttempt | null => {
  if (!value?.id) return null
  return {
    id: String(value.id),
    date: String(value.date ?? todayISO()),
    runeCost: Math.max(0, Number(value.runeCost ?? 0) || 0),
    estimatedValue: Math.max(0, Number(value.estimatedValue ?? 0) || 0),
    tag: isAttemptTag(value.tag) ? value.tag : 'setup',
    statsNote: String(value.statsNote ?? ''),
    notes: String(value.notes ?? ''),
  }
}

const normalizeTargetStats = (stats: any): DraftTargetStat[] => {
  if (!Array.isArray(stats)) return []
  return stats
    .map((entry, index) => {
      const effectId = Number(entry?.effectId ?? 0)
      return {
        id: String(entry?.id ?? `${effectId}-${index}`),
        effectId,
        label: String(entry?.label ?? `Stat ${index + 1}`),
        min: Number(entry?.min ?? 0) || 0,
        max: Number(entry?.max ?? entry?.min ?? 0) || 0,
        baseValue: Number(entry?.baseValue ?? 0) || 0,
        targetValue: Number(entry?.targetValue ?? entry?.max ?? entry?.min ?? 0) || 0,
        priority: isTargetPriority(entry?.priority) ? entry.priority : 'normal',
      }
    })
    .filter((entry) => entry.label)
}

const normalizeDraftItem = (value: any): DraftCraftFmItem | null => {
  if (!value?.id || !value?.item) return null
  return {
    id: String(value.id),
    itemId: value.itemId,
    item: value.item,
    acquisitionMode: isAcquisitionMode(value.acquisitionMode) ? value.acquisitionMode : 'crafted',
    craftKamasBefore: Math.max(0, Number(value.craftKamasBefore ?? value.craftCost ?? value.baseCost ?? 0) || 0),
    craftKamasAfter: Math.max(0, Number(value.craftKamasAfter ?? 0) || 0),
    extraExpenses: Math.max(0, Number(value.extraExpenses ?? value.otherCost ?? 0) || 0),
    runeValueBeforeFm: Math.max(0, Number(value.runeValueBeforeFm ?? 0) || 0),
    runePurchases: Math.max(0, Number(value.runePurchases ?? 0) || 0),
    runeValueAfterFm: Math.max(0, Number(value.runeValueAfterFm ?? 0) || 0),
    targetMode: isTargetMode(value.targetMode) ? value.targetMode : 'clean',
    targetSummary: String(value.targetSummary ?? ''),
    stopRule: String(value.stopRule ?? ''),
    expectedSalePrice: Math.max(0, Number(value.expectedSalePrice ?? 0) || 0),
    listedPrice: Math.max(0, Number(value.listedPrice ?? 0) || 0),
    realizedSalePrice: Math.max(0, Number(value.realizedSalePrice ?? 0) || 0),
    brisageRecovery: Math.max(0, Number(value.brisageRecovery ?? 0) || 0),
    outcome: isOutcomeMode(value.outcome) ? value.outcome : 'in_progress',
    notes: String(value.notes ?? ''),
    targetStats: normalizeTargetStats(value.targetStats),
    attempts: Array.isArray(value.attempts)
      ? value.attempts.map(normalizeAttempt).filter(Boolean) as DraftAttempt[]
      : [createEmptyAttempt()],
  }
}

const normalizeRecipeChecklistResource = (value: any): RecipeChecklistResource | null => {
  const id = Number(value?.id ?? 0)
  if (!id) return null
  return {
    id,
    name: String(value?.name ?? `Ingredient #${id}`),
    image: typeof value?.image === 'string' ? value.image : null,
    typeName: typeof value?.typeName === 'string' ? value.typeName : null,
    totalQuantity: Math.max(0, Number(value?.totalQuantity ?? 0) || 0),
    hasRecipe: Boolean(value?.hasRecipe),
    isDone: Boolean(value?.isDone),
  }
}

const normalizeSession = (value: any): CraftFmSession | null => {
  if (!value?.id) return null
  return {
    id: String(value.id),
    date: String(value.date ?? todayISO()),
    workflow: isWorkflowMode(value.workflow) ? value.workflow : 'craft_fm',
    focus: isSessionFocus(value.focus) ? value.focus : 'mixed',
    startingKamas: Math.max(0, Number(value.startingKamas ?? 0) || 0),
    currentKamas: Math.max(0, Number(value.currentKamas ?? 0) || 0),
    startingRuneStockValue: Math.max(0, Number(value.startingRuneStockValue ?? 0) || 0),
    currentRuneStockValue: Math.max(0, Number(value.currentRuneStockValue ?? 0) || 0),
    sessionExpenses: Math.max(0, Number(value.sessionExpenses ?? 0) || 0),
    notes: String(value.notes ?? ''),
    items: Array.isArray(value.items)
      ? value.items.map(normalizeDraftItem).filter(Boolean) as DraftCraftFmItem[]
      : [],
    resourceChecklist: Array.isArray(value.resourceChecklist)
      ? value.resourceChecklist.map(normalizeRecipeChecklistResource).filter(Boolean) as RecipeChecklistResource[]
      : [],
  }
}

const migrateLegacyCrafts = () => {
  const legacyCrafts = [...data.value.sales.items]
    .filter((item: SoldItem) => (
      item.serverId === selectedServer.value?.id &&
      item.characterId === selectedCharacter.value?.id &&
      (item.notes?.startsWith(LEGACY_CRAFT_TAG) ?? false)
    ))
    .sort((a, b) => new Date(b.dateSold).getTime() - new Date(a.dateSold).getTime())

  if (!legacyCrafts.length) return []

  return legacyCrafts.map((craft) => ({
    id: `legacy-${craft.id}`,
    date: craft.dateSold?.slice(0, 10) || todayISO(),
    workflow: 'craft' as WorkflowMode,
    focus: 'clean' as SessionFocus,
    startingKamas: 0,
    currentKamas: 0,
    startingRuneStockValue: 0,
    currentRuneStockValue: 0,
    sessionExpenses: 0,
    notes: extractLegacyNotes(craft.notes),
    items: [{
      id: `legacy-item-${craft.id}`,
      itemId: craft.itemId,
      item: craft.item,
      acquisitionMode: 'crafted' as AcquisitionMode,
      craftKamasBefore: 0,
      craftKamasAfter: 0,
      extraExpenses: 0,
      runeValueBeforeFm: 0,
      runePurchases: 0,
      runeValueAfterFm: 0,
      targetMode: 'clean' as TargetMode,
      targetSummary: craft.customEffects?.map(effect => `${effect.description}: ${effect.customValue}`).join(' · ') ?? '',
      stopRule: '',
      expectedSalePrice: craft.price ?? 0,
      listedPrice: 0,
      realizedSalePrice: craft.price ?? 0,
      brisageRecovery: 0,
      outcome: 'sold' as OutcomeMode,
      notes: extractLegacyNotes(craft.notes),
      targetStats: [],
      attempts: [],
    }],
    resourceChecklist: [],
  }))
}

const loadData = () => {
  if (!import.meta.client || !hasContext.value) return

  draftItems.value = []
  expandedDraftItemIds.value = []
  draftResourceChecklist.value = []
  recipeChecklistState.value = { hasFetched: false, isLoading: false, error: '' }

  const raw = localStorage.getItem(sessionsKey.value)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      sessions.value = Array.isArray(parsed)
        ? parsed.map(normalizeSession).filter(Boolean) as CraftFmSession[]
        : []
      saveSessions()
      return
    }
    catch {
      sessions.value = []
    }
  }

  sessions.value = migrateLegacyCrafts()
  saveSessions()
}

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(doSearch, 350)
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
        'slug.fr[$search]': search.value.trim(),
        'typeId[$ne]': 203,
        '$sort': '-id',
        'level[$gte]': 0,
        'level[$lte]': 200,
        '$skip': 0,
        lang: 'fr',
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
  results.value = []
}

const addItemToDraft = async (item: any) => {
  const existing = draftItems.value.find((entry) => String(entry.itemId) === String(item?.id))
  if (existing) {
    if (!expandedDraftItemIds.value.includes(existing.id)) {
      expandedDraftItemIds.value = [...expandedDraftItemIds.value, existing.id]
    }
    clearSearch()
    return
  }

  const nextItem = await buildDraftItem(item)
  draftItems.value.unshift(nextItem)
  expandedDraftItemIds.value = [...new Set([nextItem.id, ...expandedDraftItemIds.value])]
  clearSearch()
}

const removeDraftItem = (id: string) => {
  draftItems.value = draftItems.value.filter((item) => item.id !== id)
  expandedDraftItemIds.value = expandedDraftItemIds.value.filter((currentId) => currentId !== id)
}

const isDraftItemExpanded = (id: string) => expandedDraftItemIds.value.includes(id)

const toggleDraftItem = (id: string) => {
  expandedDraftItemIds.value = isDraftItemExpanded(id)
    ? expandedDraftItemIds.value.filter((currentId) => currentId !== id)
    : [...expandedDraftItemIds.value, id]
}

const isSessionExpanded = (id: string) => expandedSessionIds.value.includes(id)

const toggleSession = (id: string) => {
  expandedSessionIds.value = isSessionExpanded(id)
    ? expandedSessionIds.value.filter((currentId) => currentId !== id)
    : [...expandedSessionIds.value, id]
}

const itemCraftCost = (item: DraftCraftFmItem) =>
  Math.max(0, (Number(item.craftKamasBefore) || 0) - (Number(item.craftKamasAfter) || 0))

const itemFmCost = (item: DraftCraftFmItem) =>
  Math.max(0, (Number(item.runeValueBeforeFm) || 0) + (Number(item.runePurchases) || 0) - (Number(item.runeValueAfterFm) || 0))

const itemInvested = (item: DraftCraftFmItem) =>
  itemCraftCost(item)
  + Math.max(0, Number(item.extraExpenses) || 0)
  + itemFmCost(item)

const itemRealized = (item: DraftCraftFmItem) =>
  Math.max(0, Number(item.realizedSalePrice) || 0) + Math.max(0, Number(item.brisageRecovery) || 0)

const itemExpected = (item: DraftCraftFmItem) => {
  if (item.outcome === 'sold' || item.outcome === 'brisaged') return itemRealized(item)
  if (item.outcome === 'listed') return Math.max(0, Number(item.listedPrice) || 0)
  return Math.max(0, Number(item.expectedSalePrice) || 0)
}

const itemProfit = (item: DraftCraftFmItem) => itemRealized(item) - itemInvested(item)

const sessionTotals = (session: CraftFmSession) => {
  const invested = session.items.reduce((sum, item) => sum + itemInvested(item), 0)
  const realized = session.items.reduce((sum, item) => sum + itemRealized(item), 0)
  const expected = session.items.reduce((sum, item) => sum + itemExpected(item), 0)
  const startingBankroll = (Number(session.startingKamas) || 0) + (Number(session.startingRuneStockValue) || 0)
  const currentAssets = (Number(session.currentKamas) || 0) + (Number(session.currentRuneStockValue) || 0) + expected
  return {
    invested,
    realized,
    expected,
    startingBankroll,
    currentAssets,
    bankrollDelta: currentAssets - startingBankroll - (Number(session.sessionExpenses) || 0),
    profit: realized - invested,
  }
}

const sessionDraftSummary = computed(() => {
  const builtItemsValue = draftItems.value.reduce((sum, item) => sum + itemExpected(item), 0)
  const startingBankroll = (Number(draftSession.value.startingKamas) || 0) + (Number(draftSession.value.startingRuneStockValue) || 0)
  const currentAssets =
    (Number(draftSession.value.currentKamas) || 0)
    + (Number(draftSession.value.currentRuneStockValue) || 0)
    + builtItemsValue

  return {
    startingBankroll,
    currentAssets,
    builtItemsValue,
    bankrollDelta: currentAssets - startingBankroll - (Number(draftSession.value.sessionExpenses) || 0),
  }
})

const resetDraft = () => {
  draftItems.value = []
  expandedDraftItemIds.value = []
  itemTabs.value = {}
  draftResourceChecklist.value = []
  recipeChecklistState.value = { hasFetched: false, isLoading: false, error: '' }
  draftSession.value = {
    date: todayISO(),
    workflow: 'craft_fm',
    focus: 'mixed',
    startingKamas: 0,
    currentKamas: 0,
    startingRuneStockValue: 0,
    currentRuneStockValue: 0,
    sessionExpenses: 0,
    notes: '',
  }
  clearSearch()
}

const startNewSession = () => {
  editingSessionId.value = '__new__'
  resetDraft()
}

const closeEditor = () => {
  editingSessionId.value = ''
  resetDraft()
}

const saveSession = () => {
  if (!draftItems.value.length) return

  const sessionId = editingSessionId.value && editingSessionId.value !== '__new__'
    ? editingSessionId.value
    : crypto.randomUUID()

  const nextSession: CraftFmSession = {
    id: sessionId,
    date: draftSession.value.date || todayISO(),
    workflow: draftSession.value.workflow,
    focus: draftSession.value.focus,
    startingKamas: Math.max(0, Number(draftSession.value.startingKamas) || 0),
    currentKamas: Math.max(0, Number(draftSession.value.currentKamas) || 0),
    startingRuneStockValue: Math.max(0, Number(draftSession.value.startingRuneStockValue) || 0),
    currentRuneStockValue: Math.max(0, Number(draftSession.value.currentRuneStockValue) || 0),
    sessionExpenses: Math.max(0, Number(draftSession.value.sessionExpenses) || 0),
    notes: draftSession.value.notes.trim(),
    items: draftItems.value.map((item) => ({
      id: item.id,
      itemId: item.itemId,
      item: item.item,
      acquisitionMode: item.acquisitionMode,
      craftKamasBefore: Math.max(0, Number(item.craftKamasBefore) || 0),
      craftKamasAfter: Math.max(0, Number(item.craftKamasAfter) || 0),
      extraExpenses: Math.max(0, Number(item.extraExpenses) || 0),
      runeValueBeforeFm: Math.max(0, Number(item.runeValueBeforeFm) || 0),
      runePurchases: Math.max(0, Number(item.runePurchases) || 0),
      runeValueAfterFm: Math.max(0, Number(item.runeValueAfterFm) || 0),
      targetMode: item.targetMode,
      targetSummary: item.targetSummary.trim(),
      stopRule: item.stopRule.trim(),
      expectedSalePrice: Math.max(0, Number(item.expectedSalePrice) || 0),
      listedPrice: Math.max(0, Number(item.listedPrice) || 0),
      realizedSalePrice: Math.max(0, Number(item.realizedSalePrice) || 0),
      brisageRecovery: Math.max(0, Number(item.brisageRecovery) || 0),
      outcome: item.outcome,
      notes: item.notes.trim(),
      targetStats: item.targetStats.map((stat) => ({
        ...stat,
        targetValue: Number(stat.targetValue) || 0,
      })),
      attempts: item.attempts.map((attempt) => ({
        id: attempt.id,
        date: attempt.date || todayISO(),
        runeCost: Math.max(0, Number(attempt.runeCost) || 0),
        estimatedValue: Math.max(0, Number(attempt.estimatedValue) || 0),
        tag: attempt.tag,
        statsNote: attempt.statsNote.trim(),
        notes: attempt.notes.trim(),
      })),
    })),
    resourceChecklist: draftResourceChecklist.value.map((resource) => ({ ...resource })),
  }

  const existingIndex = sessions.value.findIndex(session => session.id === sessionId)
  if (existingIndex >= 0) sessions.value[existingIndex] = nextSession
  else sessions.value.unshift(nextSession)

  saveSessions()
  closeEditor()
}

const deleteSession = (id: string) => {
  sessions.value = sessions.value.filter((session) => session.id !== id)
  saveSessions()
}

const openSessionEditor = (id: string) => {
  const session = sessions.value.find(entry => entry.id === id)
  if (!session) return

  editingSessionId.value = id
  draftSession.value = {
    date: session.date || todayISO(),
    workflow: session.workflow,
    focus: session.focus,
    startingKamas: Math.max(0, Number(session.startingKamas) || 0),
    currentKamas: Math.max(0, Number(session.currentKamas) || 0),
    startingRuneStockValue: Math.max(0, Number(session.startingRuneStockValue) || 0),
    currentRuneStockValue: Math.max(0, Number(session.currentRuneStockValue) || 0),
    sessionExpenses: Math.max(0, Number(session.sessionExpenses) || 0),
    notes: session.notes || '',
  }

  draftItems.value = session.items.map(item => ({
    ...item,
    targetStats: item.targetStats.map(stat => ({ ...stat })),
    attempts: item.attempts.map(attempt => ({ ...attempt })),
  }))
  draftResourceChecklist.value = session.resourceChecklist.map(resource => ({ ...resource }))
  expandedDraftItemIds.value = draftItems.value.map(item => item.id)
  recipeChecklistState.value = {
    hasFetched: draftResourceChecklist.value.length > 0,
    isLoading: false,
    error: '',
  }
}

const fetchRecipeChecklist = async () => {
  if (!draftItems.value.length) {
    draftResourceChecklist.value = []
    recipeChecklistState.value = { hasFetched: false, isLoading: false, error: 'Add items first.' }
    return
  }

  recipeChecklistState.value = { hasFetched: true, isLoading: true, error: '' }

  try {
    const existingChecks = new Map<number, boolean>(
      draftResourceChecklist.value.map((resource) => [resource.id, resource.isDone]),
    )
    const ingredientMap = new Map<number, RecipeChecklistResource>()

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

      recipe.ingredientIds.forEach((ingredientId: number, index: number) => {
        const ingredient = recipe.ingredients?.find((candidate: any) => candidate.id === ingredientId)
        const totalQuantity = Number(recipe.quantities?.[index] ?? 0) || 0
        const existing = ingredientMap.get(ingredientId)

        if (existing) {
          existing.totalQuantity += totalQuantity
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
  draftResourceChecklist.value = draftResourceChecklist.value.map((resource) =>
    resource.id === resourceId
      ? { ...resource, isDone: !resource.isDone }
      : resource,
  )
}

const draftRecipeSignature = computed(() =>
  JSON.stringify(
    draftItems.value.map((item) => ({
      itemId: item.itemId,
    })),
  ),
)

const sessionTitle = (session: CraftFmSession) => {
  const first = session.items[0]
  if (!first) return 'Empty session'
  if (session.items.length === 1) return first.item?.name?.fr ?? String(first.itemId)
  return `${first.item?.name?.fr ?? first.itemId} + ${session.items.length - 1} more`
}

const formatWorkflowLabel = (value: WorkflowMode) =>
  value === 'craft' ? 'Craft'
    : value === 'fm' ? 'FM'
      : 'Craft + FM'

const formatAttemptTag = (value: AttemptTag) =>
  value === 'exo_hit' ? 'Exo hit'
    : value.charAt(0).toUpperCase() + value.slice(1)

const formatTargetModeLabel = (value: TargetMode) =>
  value === 'clean' ? 'Clean resale'
    : value === 'perfect' ? 'Near perfect'
      : value === 'over' ? 'Overmage'
        : 'Exo'

const formatOutcomeLabel = (value: OutcomeMode) =>
  value === 'in_progress' ? 'In progress'
    : value === 'listed' ? 'Listed'
      : value === 'sold' ? 'Sold'
        : value === 'kept' ? 'Kept'
          : value === 'brisaged' ? 'Brisaged'
            : 'Failed'

const getItemImg = (item: any) => item?.img ?? ''

const onImgErr = (e: Event) => {
  const img = e.target as HTMLImageElement
  if (img.dataset.fb) return
  img.dataset.fb = '1'
  img.src = '/item-fallback.svg'
}


const formatDisplayDate = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })
}

function todayISO() {
  const date = new Date()
  return date.toISOString().slice(0, 10)
}

const extractLegacyNotes = (value: string | null) =>
  String(value ?? '').replace(LEGACY_CRAFT_TAG, '').trim()

const isWorkflowMode = (value: unknown): value is WorkflowMode =>
  value === 'craft' || value === 'fm' || value === 'craft_fm'

const isSessionFocus = (value: unknown): value is SessionFocus =>
  value === 'clean' || value === 'perfect' || value === 'over' || value === 'exo' || value === 'mixed'

const isAcquisitionMode = (value: unknown): value is AcquisitionMode =>
  value === 'crafted' || value === 'bought' || value === 'mixed'

const isTargetMode = (value: unknown): value is TargetMode =>
  value === 'clean' || value === 'perfect' || value === 'over' || value === 'exo'

const isOutcomeMode = (value: unknown): value is OutcomeMode =>
  value === 'in_progress' || value === 'listed' || value === 'sold' || value === 'kept' || value === 'brisaged' || value === 'failed'

const isAttemptTag = (value: unknown): value is AttemptTag =>
  value === 'setup' || value === 'upgrade' || value === 'stabilized' || value === 'exo_hit' || value === 'brick' || value === 'stop'

const isTargetPriority = (value: unknown): value is TargetPriority =>
  value === 'ignore' || value === 'low' || value === 'normal' || value === 'high' || value === 'critical'

const onDocMousedown = (event: MouseEvent) => {
  const target = event.target as Node
  if (searchAreaEl.value && !searchAreaEl.value.contains(target)) {
    results.value = []
  }
}

watch(draftRecipeSignature, async () => {
  if (!draftItems.value.length) {
    draftResourceChecklist.value = []
    recipeChecklistState.value = { hasFetched: false, isLoading: false, error: '' }
    return
  }

  if (!recipeChecklistState.value.hasFetched || recipeChecklistState.value.isLoading) return
  await fetchRecipeChecklist()
})

watch([selectedServer, selectedCharacter], loadData)

onMounted(() => {
  initContext()
  initStore()
  readEffectCache()
  loadData()
  document.addEventListener('mousedown', onDocMousedown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocMousedown)
})
</script>
