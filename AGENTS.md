# Agent Notes

Project-specific rules for future coding sessions.

- Use `TODO.md` as the product handoff source of truth when chat history is compacted.
- Preserve the local-first kama-making cockpit direction: guided profit workflows over generic database pages.
- Build UI from `app/components/ui/*` (auto-imported as `Ui*`) — `UiCard`, `UiButton`, `UiSelect`, `UiField`, `UiInput`, `UiNumberInput`, `UiSegmented`, `UiTable`, `UiToolbar`, `UiStat`/`UiStatRow`, `UiMoney`, `UiBadge`, `UiModal`, `UiEmptyState`, `UiIcon`. Do not reinvent these per page.
- Dropdowns use `UiSelect`, never a raw `<select>`. Every either/or control is `UiSegmented`, so the same kind of decision looks the same everywhere. (The old `V2Select` / `V2DateInput` / `PriceSparkline` components were deleted once nothing referenced them.)
- Every kamas figure goes through `UiMoney`; it owns tabular numerals, grouping, and the signed +/− colouring.
- Colour comes from the semantic tokens in `app/assets/css/main.css` — never a raw hex. Accent = interactive, positive/negative = P/L only, everything else neutral.
- Size in `rem` / Tailwind scale, never `px`: `useFontScale()` rescales the root font size and a stray `px` silently opts that element out of the feature. (Hairline borders and outlines are the one exception.)
- Pages carry **no** `<style scoped>` block. If something needs styling that utilities can't express, it belongs in a `Ui*` component.
- Every user-visible string goes through `$t()`, added to **both** `i18n/locales/en.json` and `fr.json` in the same change. Key parity is expected to stay at 0 missing in both directions.
- Keep durable user workflow data in the unified `useAppDataStore()` schema so export/import works.
- Do not delete or demote existing pages without telling the user first. Archive/support routes like `/items` can remain available even when removed from main nav.
