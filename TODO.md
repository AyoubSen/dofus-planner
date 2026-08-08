# TODO

Product ship list. Current product direction: local-first guided kama-making app, not a generic Dofus database/toolbox.

## Product North Star

- Help a beginner make kamas with less confusion: safest next step, why it matters, and whether it worked.
- Primary loops: flip/resale items, craft/FM experiments, brisage sessions, archimonstre selling, market price tracking, and profit history.
- Keep data local-only with export/import. No cloud sync unless explicitly reconsidered later.
- Every main-nav feature must create a next action. Database-only pages are support/archive, not primary product.
- Use a dark compact power-user UI with Dofus gold/merchant-ledger flavor. Preserve the current v2 look while migrating so it can be restored if needed.

## Anti-Bloat Rules

1. No page belongs in main nav unless it helps decide, execute, or learn from a kama action.
2. Beginner summary first; advanced tables and raw data stay collapsed or secondary.
3. Every money calculation should explain why and warn when data is stale.
4. Profit is only real when sold/realized; paper value must be labeled as paper value.
5. Durable user data should go through the central local store, not scattered localStorage keys.
6. Item/monster/achievement database views should be drawers, helpers, or archive pages unless they directly support profit workflows.

## Target Main Navigation

- Home: guided next actions and blockers.
- Flip Items: resale/flipping beginner workflow.
- Craft/FM: session-based craft and maging experiments.
- Break Items: brisage workflow with paper vs realized profit.
- Sell Archis: archimonstre selling and capture inventory.
- Prices: market price book, freshness, manual inputs, import/export.
- History: realized sales, losses, capital locked, lessons learned.
- Settings: characters, servers, backup/import/export, preferences.

## Demoted / Archive Candidates

- Generic Items lookup: keep as support for Prices/Flip/Craft, not main nav.
- Generic Monsters lookup: keep as support for archimonstres, not main nav.
- Succes: rework later as Achievement Rewards sorted by kama reward; archive if reward data is not reliable.
- Familiers: keep experimental/later unless it becomes a clear profit workflow.
- Kamas page: replace with guided opportunities or retire behind Home.

## Current State

- Nuxt 4 app with V2 layout, local character context, backup controls, i18n, and pages for dashboard, kamas, archimonstres, monsters, items, resale, crafting, brisage, succes, and familiers.
- Core product value is already present: per-character tracking plus market/profit tools.
- Biggest ship risk is not missing features; it is discoverability, inconsistent polish, and unfinished page-level UX.
- Worktree currently contains active changes around familiers, kamas, HDV scanning, layout, i18n, and package files. Treat those as in-progress product work.

## Session Memory For Future Agents

- Do not rely only on chat history. This file is the project handoff source of truth when the conversation compacts.
- Recent direction correction: stop trying to turn the old `app/pages/items.vue` database/details page into the main Prices experience. Keep it as support/archive unless explicitly asked otherwise.
- The main `Prices` nav points to `app/pages/prices.vue`, a focused local market price tracker for manually logging HDV prices by item, lot size, date, and time slot.
- Durable market-watch data belongs in the unified `useAppDataStore()` schema under `data.market.trackedItems`; do not add new standalone localStorage keys for user workflow data unless there is a strong reason.
- Store schema was bumped to version 5 for market tracking. Export/import should include market-watch data through the central store.
- `app/pages/prices.vue` still has a one-time legacy migration from `dofus-market-watch-{serverId}-{characterId}` so entries created during the first Prices pass are not lost.
- Current `/prices` is intentionally compact: top bar with tracked/checked-today counts, add item, Prices export/import, per-item price entry, lot size selector (`x1`, `x10`, `x100`), date picker, time slot selector, metrics, uPlot sparkline via `app/components/PriceSparkline.vue`, recent history, copy-name, edit, two-click remove, and individual observation delete.
- `/prices` has page-level category filtering and chart period controls (`Day`, `Week`, `Month`). Each card can update its item category with `V2Select`; category data stays in `TrackedMarketItem.category`.
- A one-time local backfill marks existing Prices items as `Rune` using localStorage flag `dofus-prices-rune-backfill-v1`; it does not delete or recreate tracked items and should not overwrite future category edits after the flag is set.
- `/prices` removed the earlier signal-heavy bloat: no hero explainer, batch table, threshold tuning, buy/sell/wait cards, or Flip handoff on this page. Flip/resale belongs in `app/pages/resale.vue`.
- Existing and imported observations with missing lot size default to `x100`. Page-level import creates `before-prices-import` backup, merges by matching id/name, and dedupes observations by `createdAt|slot|lotSize|price`.
- Each tracked Prices item remembers its preferred lot size (`preferredLotSize`) in `useAppDataStore()`; changing the lot selector updates the item and saving a price keeps that lot selected instead of resetting to `x100`.
- Price cards sort by work needed: items not checked today first, then oldest checked/latest observation first. Saving a price sets `lastCheckedAt`, so the item should drop behind unchecked items immediately. The last changed card gets a short temporary visual highlight; no-op name edits should not trigger it.
- `/prices` has a Pressure tab for recipe-demand scouting. It reuses `/api/items/items` with the same Items query keys for element/mode/class/level/budget filters, resolves recipes through existing DofusDB proxies/cache, shows reason badges, supports `Track top` and checkbox-based `Track selected`, and has sort options for most used, highest pressure, unchecked first, rising, and dipping.
- Pressure UI settings are persisted per character/server in localStorage (`dofus-prices-pressure-settings-{serverId}-{characterId}`) because they are non-durable UI preferences, not workflow records. Durable tracked resources still become normal `data.market.trackedItems` entries.
- Last verification: `pnpm build` passed after the `/prices` Pressure filter/sort/selection work. Remaining warnings are the known Browserslist/Tesseract/Node deprecation warnings.
- Dropdowns/select controls should follow the existing project dropdown component/pattern, especially `app/components/V2Select.vue`, instead of raw `<select>` elements unless there is a concrete reason not to.
- The user dislikes generic item-detail clutter in Prices: recipe ID, profession, ingredient count, craft cost, priced ingredients, ingredient manager/list, margin calculator, and stat tuning do not belong in the focused Prices workflow.
- Craft/FM recipe and ingredient logic belongs in `Craft/FM`, not `Prices`.
- Flip/resale should teach a beginner the watch -> buy safely -> list/reprice -> learn loop, and should distinguish paper opportunity from realized profit.
- Brisage must be honest about paper value vs realized rune sales and stale/missing rune prices.
- Achievements should only be productized if they can be sorted by kama reward; otherwise keep them secondary/archive.
- Familiers are postponed unless they become clearly profitable and actionable.
- Current reliable verification command is `pnpm build`. Known warnings are Browserslist age, Tesseract top-level `this`, and Node package export deprecation.

## Shortest Path To Usable

1. [~] Make Home a guided next-action page, not a generic dashboard.
2. [ ] Rebuild Flip Items first as a beginner resale learning workflow.
3. [ ] Rebuild Break Items with honest paper vs realized brisage profit.
4. [ ] Rebuild Craft/FM as controlled sessions with break-even and stop-loss.
5. [ ] Centralize durable local data and export/import around the kama workflows.

## Priority Tasks

1. [~] Shell: rename main navigation around beginner workflows and demote database pages.
2. [~] Home: add guided next actions, blockers, and beginner workflow cards.
3. [ ] Flip Items: turn resale into guided watch/buy/list/sold flow with explanations.
4. [~] Prices: establish price freshness/source/confidence as the shared foundation.
5. [ ] History: separate realized profit from paper value and capital locked.
6. [ ] Break Items: make brisage estimates warn on stale/missing rune prices.
7. [ ] Craft/FM: add break-even sale price, FM budget, and stop-loss guidance.
8. [ ] Quality: add a reliable verification script (`lint` or `check`) and keep `build` under a practical local timeout.

## Review Queue

- [~] Dashboard
- [ ] Kamas
- [ ] Archimonstres
- [ ] Items
- [ ] Resale
- [ ] Crafting
- [ ] Brisage
- [ ] Familiers
- [ ] Succes
- [ ] Monsters
