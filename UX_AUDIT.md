# UX Audit — Page-by-Page

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

> **Calm Ledger overhaul (branch `ui-overhaul-calm-ledger`).** All 12 pages were
> rebuilt on a shared token layer and `Ui*` component library; `legacy-v2.css`
> and every page's scoped CSS are gone. Items ticked below were closed by that
> work. Items still open are product/content changes the overhaul did not cover.
>
> Verified in a browser at the end of Phase 5: focus-visible ring, light theme,
> 125% font scale, keyboard tab order, storage meter.
>
> **Mobile breakpoints verified** in a later pass, at 390px (phone portrait, below
> `sm`) and 768px (tablet, `md`, below the `lg` sidebar breakpoint), across all 11
> routes plus a monster detail. `resize_window` still cannot shrink a maximised
> Chrome window — the workaround is a same-origin iframe sized to the target
> width, since media queries inside an iframe evaluate against its own box.
> No page scrolls horizontally at either width. Five layout breaks were found and
> fixed; see the Global section. Desktop (1280px) re-checked afterwards.

---

## Dashboard (`/`)

- [x] 4th stat card ("Overall Completion %") is redundant — replaced with Succes achievements count card.
- [x] Resale stat card shows zeroed-out metrics for users who haven't used resale yet — now shows empty state with "Start tracking →" link.
- [x] Activity feed empty state CTA always points to archimonstres — now shows 4 links (archimonstres, items, crafting, brisage).
- [x] "Current character" / "All accounts" / "No character selected" labels are hardcoded English — moved to i18n.
- [x] "All accounts" is confusing terminology — changed to "All characters" (allCharacters i18n key).
- [x] "Beta" badge removed entirely.
- [x] Resale and Items quick-nav cards share the same icon — created IconResale.vue (price tag icon), applied to resale quick-nav and activity feed.
- [ ] Familiers and Brisage are missing from the stat cards entirely (no visibility on dashboard for those features).

---

## Items Page (`/items`)

- [x] Filter bar (5 rows) takes up too much vertical space — added "Hide/Show filters" toggle, state persists in localStorage.
- [x] Element + Class filters icon-only blank on error — added reactive error tracking + short text fallback per chip.
- [x] Class icons similar at small sizes — short text fallback now shows on icon error; title tooltip was already present.
- [x] "Mode" filter shows raw uppercased strings — label renamed to "Build type", chips now use i18n keys.
- [x] "Budget" filter label is ambiguous — renamed to "Price range" (EN) / "Fourchette de prix" (FR).
- [x] No persistent hint below filters — added a dim hint line below the filter block.

---

## Crafting Page (`/crafting`)

- [x] No-context state offers no direct action — add a button that triggers the character picker.
- [ ] "Invested" / "Realized" labels in stats strip are unclear — rename to "Cost" / "Revenue" or add tooltips.
- [ ] "Expected" metric in session stats has no explanation — add tooltip.
- [x] "Create Session" panel is a lot of empty space for a single button — compact it.
- [ ] Delete button on sessions has no confirmation — add confirm step (or undo).
- [ ] No way to sort/filter sessions by P/L or margin (TODO: `Crafting Filter/Sort by Margin`).
- [ ] `Crafting Cost Field + Profit Margin Column` — "expected" is opaque without actual margin display.

---

## Brisage Page (`/brisage`)

- [x] No-context state offers no direct action — same fix as crafting.
- [x] "Focus Category" field label is jargon — added a hint line under the field.
- [x] Level Min / Level Max look like two unrelated fields — visually group them as a range (e.g. "Level range: [min] – [max]").
- [x] Rune names are free-text — same rune entered differently creates fragmented history. Now a single picker over the 105 canonical runes (`app/data/runes.json`), and each output stores the real `runeId`.
- [x] P/L colors use hardcoded hex values (`#34d399` / `#f87171`) — replace with theme tokens.
- [~] No explanation of what brisage is for new users — **won't do as written**: guide modals were deliberately removed app-wide. Addressed instead with clearer field labels and hints.

---

## Resale Page (`/resale`)

- [x] "No character selected" hardcoded English — move to i18n.
- [ ] "Transfer character data" panel is at the top of the page — this is a rare admin action, move it to the bottom or behind a settings section.
- [x] Stats strip labels ("Tracked", "Active", "Sold", "Realized P/L", "Avg hold", "Avg reprices") all hardcoded English — move to i18n.
- [ ] "Avg reprices" has no explanation — add tooltip: "How many times you updated the price before the item sold".

---

## Archimonstres Page (`/archimonstres`)

- [ ] Mode buttons ("Dofus Ocre" / "Sell Only" / "Route Planner") have no tooltip explaining what each mode does.
- [ ] Progress strip "× 1" / "× 2+" notation is unexplained — add a legend or tooltip (each archimonstre can be captured multiple times).
- [x] Type filter is a `<select>` while all other filters are pill/chip buttons — make it consistent.
- [x] Toolbar (filter pills + type select + search) is too crowded on medium screens — restructure layout.
- [ ] No "Missing Only" filter view sorted by Etape (TODO: `Archimonstres Missing-Only View Sorted by Etape`).

---

## Succes Page (`/succes`)

- [ ] "Completion" label and "All achievements" button are hardcoded English — move to i18n.
- [x] Category names only rendered in French (`cat.name?.fr`) — use locale-aware key or fallback chain.
- [ ] No per-category progress (X/Y completed) shown when selecting a category — sidebar is navigational only (TODO: `Succes Category Progress Bars`).
- [x] Mobile layout likely stacks awkwardly — checked. The category rail stacks above the list and is capped at `26rem`, so it costs about one screen, not a dead scroll. It did hide a worse bug: the rail was a flex column, so its ~50 rows shrank to 12px each to fit the cap instead of scrolling, squashing every label into its own border. This was broken on desktop too, not just mobile. Fixed by dropping `flex` from the container.

---

## Familiers Page (`/familiers`)

- [x] Stats strip shows game constants (not user data) in the same style as dynamic stats — visually separate constants from live metrics.
- [ ] Budget input step is 100,000 — far too coarse, change to a smaller step or remove step attribute.
- [ ] Reference mode formula hint is verbose inline math — simplify to plain language.
- [ ] No explanation of the page purpose for new users — add a brief subtitle or guide button (there is a guide button, but it's small and below the stats strip).
- [ ] Per-item user price input missing (TODO: `Familiers User Price Input + Deal Color Coding`).

---

## Global / Layout Issues

- [x] Character picker in sidebar looks like a decorative avatar — it's the primary CTA for new users but doesn't read as clickable. Make it more obviously interactive.
- [x] Resale and Items share the same sidebar icon — differentiate them.
- [x] Storage indicator label "Storage" with no units until hover/click — show unit inline at all times.
- [x] i18n parity pass needed across archimonstres, crafting, brisage, succes, familiers (TODO: `V2 i18n Parity`).

### Mobile breakpoint pass — fixed

Four of the five were the same root cause: a `flex-1` column has a `0%` basis, so
in a `flex-wrap` row it never forces a wrap — it just shrinks until its text is
one character wide. Giving the column a real `basis-*` makes the row wrap instead.

- [x] `layouts/default.vue` — the desktop-only "collapse sidebar" button appeared inside the mobile drawer. `UiButton` hardcodes `inline-flex`, which outranks an unprefixed `hidden` from a caller; variant-prefixed classes (`lg:hidden`) do win, which is why the hamburger was correct. Fixed with `max-lg:hidden`.
- [x] `pages/index.vue` — the greeting truncated to "Welcome ba…" because the CTA stayed on its row.
- [x] `pages/resale.vue` — the beginner-flow explainer crushed against the step list's `min-w-60` and rendered one word per line.
- [x] `components/items/RecipeHeader.vue` — the opened item's name collapsed to "G…".
- [x] `components/ui/PageSection.vue` — section headings squeezed to "Most Used…" rather than dropping their actions to a second row. Shared by most pages.
- [x] `components/ui/Segmented.vue` — `block` mode ellipsised *every* option at once on a phone (all three Break Items tabs). Segments now refuse to shrink below their label and the row scrolls sideways instead; desktop equal-width division is unchanged.

Not fixed, cosmetic only: a few `truncate` labels still clip at 390px by design
(`TARGET PRICE PER KI…` on Familiers, a Buying-progress hint). These are single
labels inside otherwise correct layouts, not layout breaks.

---

## TODO Status Notes

### Already done (mark as complete in TODO.md)
- `Dashboard Replace Recent Sales With Cross-Feature Activity Feed` — already implemented via activityFeed
- `Items Resale Tracker Data Model` through `Items Resale Realized Profit` — Resale page already exists with all of this. Verify then close.

### Do first
1. `V2 i18n Parity` — blocking: lots of hardcoded strings everywhere
2. `Unify Feature Storage Into AppDataStore` + `Dashboard Init Unified AppDataStore` — fixes stale/empty stats
3. `Archimonstres Missing-Only View Sorted by Etape` — most natural user action, totally missing
4. `Familiers User Price Input + Deal Color Coding` — page is incomplete without it
5. `Succes Category Progress Bars` — sidebar is useless without per-category count

### Do next
- `Dashboard Succes Progress Card`
- `Crafting Cost Field + Profit Margin Column`
- `Dashboard Quick Nav: Add Familiers + Brisage` (brisage is there but Familiers is not)
- Brisage normalized rune catalog (prerequisite for all Brisage analytics TODOs)

### Deprioritize
- Entire **Valuation Hardening** section — long-tail correctness, park until core UX is solid
- `Brisage Planner Mode` / `Brisage Coefficient-Aware EV Model` — need rune catalog first
- `Snapshot Compare`, `Saved Filter Presets`, `Data Health Check` — no user demand driving these
- `Succes Notes / Timeline / Share` — marginal until category progress bars exist
