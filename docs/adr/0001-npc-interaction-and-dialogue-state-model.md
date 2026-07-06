---
status: accepted
---

# NPC interaction and dialogue-state model

`content/dialogues/` and `content/map/` were empty, and the PRD's `map_npcs` table only had `min_kanji_studied` and `dialogue_ref` — no way to express how an NPC's interaction starts, or that the same NPC says different things at different points in the story.

**Decision:** every NPC is Talk-able by default (player approaches, faces them, presses interact). Some NPCs additionally carry a Sight Cone (same geometry as Trainers — `facing`/`sight_range`) that auto-fires the first time the player enters it, producing a `sight_auto_result`:
- `battle` — Trainers, Silver. Fires once (`repeats: false`); afterward the character is pure Talk with a different post-battle Dialogue State.
- `block` — Roadblock NPCs (e.g. the Rocket grunt guarding Slowpoke Well). Intercepts the player and pushes them back one tile. Re-fires every approach (`repeats: true`) until `blocks_until` clears.

Dialogue content is a `dialogue_states` map (e.g. `intro`, `post_battle`, `blocked`, `post_event`), not a flat line list — the engine picks the active state from `user_map_state`. Each state is paginated into short, hand-authored pages (no auto text-wrap). Position/behavior (`content/map/npcs.json`) is kept separate from dialogue text (`content/dialogues/npcs/<zone_id>/<npc_id>.json`), mirroring the Fukuda split (`content/dialogues/fukuda/` — planned in the PRD; the directory does not exist yet, "existing" was inaccurate — corrected 2026-07-06, audit 04, finding 04-E3).

**Why:** matches verified HGSS mechanics rather than an invented simplification. An initial draft modeled `talk` and `sight_auto` as mutually exclusive trigger *types*, and treated blocking as a third standalone type — both wrong, caught by the user's first-hand knowledge of the games and confirmed via web research (NPC Roadblock pattern, trainer post-battle dialogue lines) before finalizing.

## Considered Options

- `talk` and `sight_auto` as mutually exclusive trigger types — rejected, every character needs Talk as a fallback, including defeated Trainers (who get a different post-battle line, not silence).
- A standalone `blocking` trigger type, independent of the Sight Cone — rejected, Roadblock NPCs use the exact same cone-detection mechanic as Trainers, just with a different `sight_auto_result`; a separate type would have duplicated the geometry.
- Auto-computed text wrapping for dialogue pages instead of manually authored pages — rejected, furigana plus mixed kanji/kana text doesn't wrap predictably across device widths; pacing (where a page break falls) is also a deliberate authorial choice, same as in the original games.

## Consequences

- `.scratch/kanji-no-niwa/PRD.md`'s `map_npcs` table was extended with `trigger_type`, `facing`, `sight_range`, `sight_auto_result`, `repeats`, `blocks_until`, plus a paragraph explaining the model.
- `content/guidebook-adapted.md`'s new-bark-town section was corrected to match: it previously said "Maison du joueur supprimée" while still listing Mom as living in that house — Maison de Mom was re-added to the building list.
- First applied example: `mom_new_bark` (`content/map/npcs.json`, `content/dialogues/npcs/new-bark-town/mom_new_bark.json`) — `talk`-only, single `intro` state.

**Update (2026-07-01):** `blocks_until` (and `min_kanji_studied` from the original PRD table) was generalized into the `Condition`/`Effect` model — see [ADR-0003](./0003-condition-effect-quest-model.md). The trigger model in this ADR (Talk-by-default, Sight Cone, `battle`/`block` results) is unaffected.
