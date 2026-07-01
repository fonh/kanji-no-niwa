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
