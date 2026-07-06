---
status: accepted
---

# Condition/Effect model, and quests as standalone multi-NPC files

A full read of `content/guidebook-adapted.md` (1228 lines, all 49 zones) surfaced that ADR-0001's NPC model doesn't scale to most of the content ahead: gates were hardcoded as `min_kanji_studied`/`blocks_until`, but real gates are everywhere and varied (an item like the Card Key, a quest step, a badge, an event resolved in a different zone — e.g. Jasmine's Gym sits empty until the Lighthouse quest resolves). Worse, several quests span multiple NPCs and zones (Ilex Forest: an apprentice gives instructions → two off-map captures → return to the Charcoal Man in Azalea Town for the reward) — nothing one NPC's `dialogue_ref` could express alone.

**Decision:**

- A single `Condition` type replaces every ad hoc gate field (`kanji_count`, `item_owned`, `quest_step`, `npc_cleared`, `event_cleared`, `badge_earned`). `Condition[]` is an AND. Used uniformly for: NPC unlock (`map_npcs.unlock_conditions`), Roadblock NPC unblocking, Gym doors, CS-Kanji zone locks, Quest Step completion gates, and Dialogue State selection.
- A symmetric `Effect` type (`advance_quest`, `grant_item`, `unlock_lesson`, `unlock_zone`) attaches to a Dialogue State and fires once when that state is reached. Quest progress is always advanced **explicitly** by an `advance_quest` Effect — never recomputed by re-checking Conditions. This keeps "what state is the quest in" a single source of truth (`npc_quest_progress.current_step`) instead of a derived value that could disagree with itself across NPCs.
- Which Dialogue State an NPC shows is chosen by an ordered list of **State Rules** (`Condition[] → state`, first match wins, ending in a `default`) — generalizes the single-state shape from ADR-0001 (`mom_new_bark` only needed a `default` rule).
- A **Quest** is its own file (`content/quests/<quest_id>.json`: ordered Quest Steps, mostly for human reference and as the target of `Condition.quest_step`), independent of any one NPC. Every NPC involved in the quest references it independently through its own `state_rules`/`effects` — there is no central "quest engine" object that owns the NPCs.

## Considered Options

- Keep gates as separate per-purpose fields (`min_kanji_studied`, `blocks_until`, a hypothetical `min_badge`, etc.) — rejected, this was already starting to sprawl after one example NPC and would only get worse across ~49 zones' worth of gates.
- Infer quest progress by re-evaluating Conditions against game state each time (e.g. "if player owns both captured items, they must be on step `captured_2`") — rejected, fragile once two different paths could reach the same apparent state, and conflates "what's true about the player" with "what stage of an authored sequence they're in."
- Let a quest be owned by a single quest-giver NPC, with other involved NPCs treated as unrelated — rejected, doesn't represent real cases like Ilex Forest where the payoff NPC (Charcoal Man) is in a different zone entirely from the quest giver (the apprentice).

## Consequences

- `.scratch/kanji-no-niwa/PRD.md`: `map_npcs` table's `min_kanji_studied`/`blocks_until` replaced with `unlock_conditions` (`Condition[]`); new `quests` and `npc_quest_progress` tables added; `user_map_state` gained `inventory[]`.
- `content/map/npcs.json` / `content/dialogues/npcs/.../mom_new_bark.json` updated to match (dropped the now-redundant always-true `min_kanji_studied: 0`; added an explicit `state_rules: [{ default: true, state: "intro" }]`).
- Supersedes the ad hoc `min_kanji_studied`/`blocks_until` fields from [ADR-0001](./0001-npc-interaction-and-dialogue-state-model.md); the trigger model itself (talk-by-default, Sight Cone, `battle`/`block` results) is unchanged.

## Amendment (2026-07-06, audit 02)

Audit 02 walked every narrative case in `content/guidebook-adapted.md` through the model and found
five gaps. The fixes below keep the philosophy intact (conditions are monotone, effects fire
explicitly, `Condition[]` is a pure AND) while making previously inexpressible cases first-class:

`kanji_count` is generalized to `count(metric, threshold)` — same comparison logic, parameterized
counter (`kanji_studied`, `grammar_n5_encountered`, `kimono_met`, …). One type now covers the
grammar gates that existed only as PRD prose (Falkner "15 N5 points seen") and Clair's "4 of 5
Kimono Girls met" — a threshold over an unordered set, inexpressible as an AND of 4 fixed
`npc_cleared` since the meeting order varies by route. Existing `kanji_count(N)` data reads as
`count(kanji_studied, N)`. Because a `count` is structured data (metric, threshold, current value),
unmet conditions are UI-renderable as progress ("512/550") for free.

New `all_texts_read` (no parameters): true when every text whose `zone_id ∈ unlocked_zones[]` is in
`text_completions`. Recomputed at evaluation time, never stored — the only condition with a dynamic
scope (it grows as zones unlock). Carries CS-Kanji activation; comes with a content-placement
invariant (a text must be reachable without any CS-Kanji when its zone unlocks) to prevent
deadlocks, enforced by a production script against `map_obstacles` — see
`content/texts-progressifs.md`.

**Update (2026-07-06, progression re-pass, same day):** `all_texts_read` is **retired** — "everything
read" was ruled too demanding at the grill (a completionist requirement repeated 8 times). CS-Kanji
activation now uses an ordinary monotone `count(texts_read, N)` threshold (N per CS, calibrated at
synthesis to ~50-60% of the corpus reachable without any CS at that point). Side benefit: the model's
one dynamic-scope exception disappears, and the placement invariant softens into a calibration
constraint (N must fit under the CS-free reachable corpus with ~40% margin). Repeatable-loop reading
content (Safari catches, day-care serial, mini-game prizes) never enters the `texts` table, so it can
never inflate or grind these counters — see `content/texts-progressifs.md` § CS-Kanji.

New `time_window(days_of_week?, hour_range?)`: evaluated client-side against the real clock, never
stored. Carries the calendar NPCs (day-of-week siblings, roving photographer, Condominiums man,
Daisy) — kept in v1 per the 2026-07-06 "no v2" decision. Multi-day visit counters (Daisy ×7, Moomoo
farm) are ordinary Quests whose `advance_quest` is allowed once per time window — a frequency
constraint, not a new Effect.

New `map_obstacles` table (`obstacle_id, zone_id, tile_x, tile_y, unlock_conditions: Condition[]`):
terrain obstacles (Sudowoodo, Snorlax, Indigo door, CS-Kanji tiles) had no table to carry their
conditions — the only structural schema hole found. This is where 水's grant-vs-usability split
lives (sea tile: `[item_owned(水), badge_earned(morty)]`).

The daily SRS gate stays **outside** the model (a deliberate non-extension): every Condition is
monotone — once true, forever true — and the engine relies on it. A `srs_done_today` condition
would reset each morning, silently breaking the invariant for one type out of seven. It remains the
dedicated `getDailySRSStatus` helper, gating only entry into a *new* zone.

Any `Condition` accepts an optional `negate: true` modifier that inverts its evaluation — not a new
type, a boolean on the existing shape. Audit 02 (finding 02-D1) found that "present **until** X is
resolved" (Rocket HQ B1F alarm grunt, the lone grunt in Misty's empty gym) was inexpressible:
[ADR-0004](./0004-multi-npc-set-pieces-need-no-new-model.md) said "two registry entries with
complementary `unlock_conditions` (present if the alarm is active, absent otherwise)" but no type
could write the "present if NOT cleared" half. `Condition[]` stays a pure AND; `negate` applies per
condition — no OR, no grouping.

`grant_item` idempotency is scoped by the item's `item_kind` (`unique` | `fungible`, defined in the
new `items` table): `unique` keeps the strict rule ("already owned → no-op"); `fungible` increments
a quantity on every valid trigger. Audit 02 (finding 02-A2): the universal rule as originally
written broke Kurt's Apricorn→Ball loop (one ball per batch, indefinitely) and the Moomoo farm's
berry feeding.

New `Effect.remove_item`, symmetric to `grant_item` (audit 02, finding 02-D2): removes a `unique`
item or decrements a `fungible` quantity. Needed everywhere the player hands an item over — the
Rocket disguise (taken off when Silver blows the cover, as in the source game), every fetch-quest
delivery (Copycat's doll, the machine part, the Secret Potion, the Red Scale, the mail), and
Apricorns consumed by Kurt's batches. Without it no Effect could take an item back, and the Bag
would accumulate already-delivered quest items forever.
