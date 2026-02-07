# What is this?

I made this cause of 2 reasons:

- Track Archimonsters I'm getting, and which ones I'm actually saving up for the Ocre quest, and which ones I can or want to sell.
- I also wanted to know which items to craft and focus on, but as someone who doesn't nolife the game, I don't really know the meta, so I've made something that would help me know which items are used the most, both in PVM and PVP.

# What's next?

- Whatever the fuck I want ?

---

On a serious note, I'll be mostly focusing on polishing the app for now, Plan goes as follows:

- [ ] Better Icons
- [x] Clearer Images for Classes
- [x] Better design for some areas (TBD)
- [x] Better filters flow/design
- [ ] More filters (TBD)
- [ ] different themes for the app (tried it, but the the whole layout of the app has to change)
- [ ] French language support

## Archimonstres:

- [ ] Import / Export data

#### Ocre Mode:

- [ ] Completion %
- [x] Show monsters left in total
- [ ] Show how many and what monsters are left in each step

#### Sell Mode:

- [x] Track the ones captured to have an idea about which ones i tend to capture more of per X time
- [x] Visualize price trends for each monster over time
- [x] Highlight monsters that haven’t sold for a long time
- [ ] ~~Top Zones for Profit~~
- [x] Show a list of monsters that are the "same" but have different price
- [x] Add a search for the prices, cause im done with CTRL + F which doesnt even fucking work (did this in the min max way for more control)
- [x] Fix dropdown when looking for an archi
- [x] ability to copy price of X item in clipboard
- [x] make the price filter the default

## Items

-[x] Fix Classes icons

## Crafting

- [x] Show sold equipments with their exact stats
- [x] Search for equipments
- [x] Fetch effects and link the effectId to its name
- [x] Be able to change the stats so i can match them to what i have in game.

## Succes

- [x] well I already added everything before typing it so, idk man.

---

## Roadmap TODO (Agreed)

### V1 - Foundation

- [ ] Unified data store (single canonical local schema + shared access layer)
- [x] Migration layer (versioned migrations from legacy keys)
- [x] Global backup / restore (single JSON for the full app state)
- [x] Standardize API access through server routes (no direct third-party client fetch)
- [ ] Data health checks (consistency validation + repair report)

### V2 - Product

- [ ] Command dashboard (single actionable overview page)
- [ ] Next best actions (as a dedicated section of the dashboard)
- [ ] Saved views and filter presets
- [ ] Snapshot and period compare (weekly/monthly comparisons)

### V3 - Performance / Infra

- [ ] IndexedDB migration for heavier datasets
- [ ] List virtualization for large tables/lists
- [ ] Background caching strategy (TTL, stale-while-revalidate, manual refresh)

### V4 - Quality

- [ ] Shared domain utilities (remove duplicated feature logic)
- [ ] Type hardening (strict models + runtime validation)
- [ ] Test coverage (unit + integration + quick local workflow)
- [ ] Local observability panel (debug/status dashboard, with access/security review)
- [ ] UX consistency pass

### Postponed / Rejected

- [ ] (Potential later) Cross-character insights, keep as optional future item.
- [x] Session mode (rejected for now)
- [x] Advanced anomaly detection beyond current analytics (rejected for now)
