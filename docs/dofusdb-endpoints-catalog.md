# DofusDB Endpoint Catalog For This App

Last updated: 2026-02-24 (based on local smoke report `reports/dofusdb-smoke-full.json`)

## How to read this

- `What it does`: data meaning from endpoint naming and sampled payload keys.
- `How to use in app`: practical integration in your Nuxt app.
- `Feature ideas`: user-facing features unlocked.
- `Why it helps`: product value.

## Endpoint-by-endpoint plan

| Endpoint | What it does | How to use in app | Feature ideas | Why it helps |
|---|---|---|---|---|
| `/achievement-categories` | Achievement category tree and grouping data. | Load category filters and parent/child navigation. | Collapsible category sidebar, category chips. | Improves discovery and filtering speed. |
| `/achievement-objectives` | Objective steps linked to achievements. | Show objective breakdown in achievement detail cards. | Step tracker per achievement. | Makes progress tracking actionable. |
| `/achievement-rewards` | Reward formulas/items tied to achievements. | Compute expected XP/kamas/items in UI. | Reward preview panel, profitability sorter. | Users prioritize best rewards. |
| `/achievements` | Main achievement records and metadata. | Core data source for achievement pages. | Search, sort, bookmark, completion checklist. | Central progression feature. |
| `/almanax` | Almanax daily/seasonal entries (empty in current test). | Optional daily content if non-empty later. | Daily task widget. | Adds daily retention loop. |
| `/almanax-calendars` | Almanax schedule/calendar definitions. | Build Almanax calendar UI by date. | Calendar timeline and next-event preview. | Helps planning ahead. |
| `/alignment-ranks` | Alignment rank definitions and thresholds. | Display rank progression reference. | Rank ladder component. | Clarifies progression goals. |
| `/alignment-sides` | Alignment factions/sides metadata. | Filter or tag content by alignment side. | Side-specific filters and badges. | Cleaner context for faction content. |
| `/alliance-rights` | Alliance permission definitions. | Show rights glossary in guild/alliance tools. | Rights matrix viewer. | Better team management clarity. |
| `/alterations` | Alteration entities with effect references. | Resolve alteration details in build/combat tools. | Alteration browser. | Supports deeper theorycrafting. |
| `/areas` | Area metadata and links to subareas/world map. | Drive map browsing and zone filters. | Area explorer with linked subareas. | Better geographic navigation. |
| `/breeds` | Class/breed base definitions and stat curves. | Populate class metadata in calculators. | Class comparison page. | Improves build decisions. |
| `/challenges` | Challenge rules, criteria, incompatibilities. | Show challenge reference in combat pages. | Challenge helper and randomizer. | Assists optimization and planning. |
| `/characteristics` | Characteristic/stat definitions. | Normalize effect/characteristic labels in UI. | Stat glossary and icon mapping. | Consistent readable stat data. |
| `/collectables` | Collectable entities and rarity/type info. | Build collectibles index and progress tracking. | Collection completion tracker. | Increases long-term engagement. |
| `/companions` | Companion definitions with spells/stats. | Support companion info in team planners. | Companion build assistant. | Useful for party optimization. |
| `/criterion/[criteria]` | Parses/evaluates a criterion expression. | Validate criterion strings before applying filters. | Criterion debugger tool. | Reduces query/filter mistakes. |
| `/custom-mode-breed-spells` | Breed spell mappings for custom mode. | Use in custom-build spell selection UI. | Custom mode spell picker. | Enables advanced planner workflows. |
| `/documents` | In-game document/content metadata. | Optional lore/help content panel. | Document library viewer. | Adds context and completeness. |
| `/dungeons` | Dungeon metadata, maps, levels, entrances. | Build dungeon directory and details. | Dungeon route planner. | Strong utility for PvE prep. |
| `/effects` | Effect definitions used by items/spells. | Resolve effect IDs into human-readable text. | Effect inspector and tooltip engine. | Core for readable item/spell UI. |
| `/emoticons` | Emote definitions and animation metadata. | Cosmetic/emote catalog pages. | Emote collection browser. | Nice-to-have completion feature. |
| `/feature-descriptions` | Feature description tree/content blocks. | Render help/guide sections from data. | In-app help center. | Improves onboarding. |
| `/finish-moves` | Finisher definitions and metadata. | Show finisher options in cosmetic/combat tools. | Finisher catalog. | Adds depth to presentation tools. |
| `/guild-rights` | Guild permission definitions. | Guild tools reference panel. | Guild rights explainer. | Better collaboration management. |
| `/havenbag-furnitures` | Haven bag furniture config and properties. | Build haven bag planner with placement metadata. | Haven bag builder. | Niche but high-value for decorators. |
| `/havenbag-themes` | Haven bag theme definitions. | Theme selector and preview references. | Theme browser. | Improves personalization UX. |
| `/hints` | Map hints with coordinates/category. | Overlay hints on map UI. | Treasure/hint map assistant. | Great navigation aid. |
| `/img/maps/[scale]/[MapId].jpg` | Rendered map image by map ID and scale. | Map tiles/background images for map features. | Zoomable world map viewer. | Enables visual navigation. |
| `/info-messages` | System/info message templates. | Decode message IDs into readable text. | Message dictionary viewer. | Better debugging and clarity. |
| `/interactives` | Interactive world object definitions. | Show interactable references on map pages. | Interactive object index. | Helps route/resource planning. |
| `/item-sets` | Item set definitions and bonuses. | Set bonus display in item/build pages. | Set builder with active bonus preview. | Critical for gear optimization. |
| `/items` | Full item catalog with stats and metadata. | Main source for equipment search and crafting logic. | Item search, compare, tooltip, market tracker. | Core app value already proven. |
| `/item-super-types` | Broad item type groups. | High-level filter grouping. | Super-type tabs. | Faster catalog browsing. |
| `/item-types` | Detailed item type definitions. | Fine-grained filters and labels. | Type faceted search. | Better search relevance. |
| `/jobs` | Profession/job definitions. | Populate crafting/job pages. | Job progression guides. | Essential for crafting workflows. |
| `/legendary-power-categories` | Legendary power group definitions. | Organize legendary effect data in UI. | Legendary power library. | Supports endgame planning. |
| `/legendary-treasure-hunts` | Legendary treasure hunt definitions. | Hunt objective/reference pages. | Treasure hunt route helper. | Useful for event/hunt players. |
| `/living-object-skin-jnt-mood` | Living object skin/mood mapping data. | Cosmetic metadata resolution. | Living item style preview. | Cosmetic completeness. |
| `/map-positions` | Map coordinate and world placement data. | Core mapping layer for map-based features. | Coordinate search and jump-to-map. | Foundation for navigation tools. |
| `/map-references` | Reference links between map entities. | Cross-link map metadata and POIs. | Linked map context panel. | Improves map context accuracy. |
| `/modsters` | Modster data entities. | Optional special content list. | Modster encyclopedia. | Completeness for niche content. |
| `/monsters` | Monster catalog with stats/metadata links. | Bestiary and drop/combat reference features. | Monster search, hunt planner. | High-demand PvE data. |
| `/monster-races` | Monster race categories. | Filter monsters by race. | Race filters and counters. | Better hunting strategy UI. |
| `/monster-super-races` | Higher-level race grouping. | Top-level taxonomy in bestiary. | Super-race navigation tabs. | Cleaner exploration structure. |
| `/months` | Month labels/definitions. | Date localization helpers in schedules. | Calendar formatting support. | Better readable scheduling. |
| `/mount-behaviors` | Mount behavior definitions. | Explain mount traits in mount pages. | Mount behavior glossary. | Better pet/mount understanding. |
| `/mount-families` | Mount family grouping metadata. | Family filters in mount tools. | Family overview pages. | Simplifies mount browsing. |
| `/mounts` | Mount entities, effects, links. | Mount catalog and compare features. | Mount planner/collection tracker. | Useful for utility/cosmetic planning. |
| `/npc-messages` | NPC dialogue/message records. | Resolve NPC text in quest context views. | Dialogue explorer. | Better quest readability. |
| `/npcs` | NPC definitions and interaction metadata. | NPC directory linked to quests/maps. | NPC locator and profile pages. | Improves quest navigation. |
| `/ornaments` | Cosmetic ornament definitions. | Cosmetics profile and unlock references. | Ornament collection tracker. | Supports completion loops. |
| `/point-of-interest` | POI definitions and labels. | Render POIs on map and filters. | POI map legend and search. | Faster in-game routing decisions. |
| `/quest-categories` | Quest category grouping metadata. | Organize quest UI by category. | Category progress bars. | Better quest navigation. |
| `/quest-objective-types` | Objective type taxonomy. | Label objective rows consistently. | Objective-type filters. | Improves quest readability. |
| `/quest-objectives` | Quest objective entities with params/maps. | Show objective steps and map targets. | Step-by-step quest guide. | Directly helpful for completion. |
| `/quest-step-rewards` | Rewards attached to quest steps. | Show per-step benefit previews. | Reward-aware quest prioritization. | Lets users optimize time. |
| `/quest-steps` | Quest step definitions and links. | Build full quest timeline UI. | Expandable quest progression tree. | Clear progress structure. |
| `/quests` | Core quest records (levels, rules, category). | Main quest index and detail pages. | Quest planner and backlog manager. | Key progression pillar. |
| `/random-drop-groups` | Randomized drop group definitions. | Drop simulation or expectation displays. | Drop chance explorer. | Better farming decisions. |
| `/recipes` | Craft recipes: result, ingredients, job, skill. | Core crafting calculator source. | Recipe explorer and shopping list. | High practical user value. |
| `/server-seasons` | Server season schedule and metadata. | Display seasonal timeline and status. | Season tracker cards. | Keeps users up to date. |
| `/servers` | Server metadata (type/language/population links). | Server selectors and context settings. | Server-aware filters/profiles. | Personalizes user context. |
| `/server-game-types` | Server type and rule definitions. | Explain server tags/rules in UI. | Server comparison table. | Better server choice decisions. |
| `/skills` | Job skills and craft/gather relationships. | Link jobs to craftable/gatherable content. | Skill dependency graph. | Better profession planning. |
| `/smiley-packs` | Smiley pack definitions. | Cosmetic catalog pages. | Smiley collection viewer. | Adds completion content. |
| `/spells` | Base spell records. | Core spell reference for classes/monsters. | Spell browser and quick lookup. | Essential combat reference. |
| `/spell-levels` | Level-by-level spell stats and costs. | Detailed spell progression display. | Damage/range progression charts. | Enables theorycrafting. |
| `/spell-pairs` | Spell pair relationships. | Show related/paired spells in UI. | Pair-aware recommendation panel. | Better spell understanding. |
| `/spell-states` | Combat state definitions and flags. | Decode state effects in tooltips. | State interaction glossary. | Reduces combat confusion. |
| `/spell-types` | Spell type taxonomy. | Filter and categorize spells. | Type chips and filters. | Cleaner spell browsing. |
| `/spell-variants` | Variant groupings by class/breed. | Variant selection helpers in class pages. | Variant comparison UI. | Helps decision-making in builds. |
| `/subareas` | Subarea data, bounds, map links. | Subarea browse and local map filtering. | Subarea detail pages. | Better local navigation. |
| `/super-areas` | High-level area group definitions. | Top-level geography navigation. | Region explorer. | Clear map hierarchy. |
| `/titles` | Title definitions and categories. | Cosmetic/title collection features. | Title unlock tracker. | Supports completion motivation. |
| `/version` | Current data/API version string. | Show sync status and invalidate caches on change. | Data version badge + auto-refresh trigger. | Prevents stale data issues. |
| `/world-events` | World event definitions and scopes. | Event listing and map-linked event filtering. | Event planner dashboard. | Helps users act on live content. |
| `/world-event-rewards` | Reward bundles for world events. | Show event reward previews and priority. | Reward-driven event ranking. | Better time/reward optimization. |
| `/worlds` | World canvas geometry and scale bounds. | Base layer for world map rendering logic. | Multi-world map navigator. | Core map foundation. |

## Common query params to use on list endpoints

- `$limit`: page size (observed max effective value is `50`)
- `$skip`: offset pagination
- `$sort`: ascending (`field`) or descending (`-field`)
- Filter operators: `field[$in][]`, `field[$ne]`, `field[$gte]`, `field[$lte]`
- Text search: `slug.fr[$search]=...` (where supported)

## Notes from your smoke test

- Most endpoints are paginated list endpoints returning `{ total, limit, skip, data }`.
- `/version` returns a raw string, not a paginated object.
- `/almanax` returned an empty array in this run.
- Dynamic path endpoints require parameters:
  - `/criterion/[criteria]`
  - `/img/maps/[scale]/[MapId].jpg`
