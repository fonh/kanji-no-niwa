# Kanji no Niwa — Game World

This game maps a kanji-learning curriculum onto Pokémon HeartGold/SoulSilver's world. The terms below disambiguate the map and dialogue layer, where most of the project's domain-specific vocabulary lives.

## Language

**Trainer** (Dresseur):
A map character whose primary interaction is a kanji battle. Auto-fires once via its Sight Cone on first encounter; afterward becomes Talk-only, with a separate post-battle Dialogue State.
_Avoid_: enemy, opponent NPC

**NPC** (PNJ):
A map character that can always be approached and Talked to. Includes ambient characters, lesson-givers, and Roadblock NPCs.
_Avoid_: character, generic NPC

**Talk**:
The default interaction available on every map character (Trainer or NPC): the player approaches, faces them, and presses the interact button. Distinct from a Sight Cone trigger, which fires automatically without player input.
_Avoid_: interact, A-press

**Sight Cone**:
The facing + range a Trainer or Roadblock NPC uses to detect the player before they're adjacent, firing its interaction automatically the moment the player enters it. Shared geometry between Trainers and Roadblock NPCs.
_Avoid_: vision, detection radius

**Roadblock NPC**:
An NPC whose Sight Cone triggers an interception instead of a battle: it walks toward the player, delivers a line, and pushes the player back one tile. Re-fires on every approach until its unblock condition clears — unlike a Trainer's one-time battle trigger.
_Avoid_: blocking NPC, guard

**Lesson NPC** (PNJ-leçon) *(added 2026-07-07, audit 06)*:
A map character (NPC or Trainer, `role: lesson`) whose interaction opens a lesson on the Book Screen. Its content (`kanji_ids[]` + optional `grammar_id`) is fixed at authoring time. Whether it opens the lesson or blocks is a **derived engine rule** — its lesson's `sequence_index` vs the `lessons-<zone_id>` quest progress — never carried by `unlock_conditions` (which keep their single meaning: presence). When blocking: Sight-Cone Lesson NPCs intercept and push back like a Roadblock NPC; Talk-only ones just deliver a blocked line, no push-back.
_Avoid_: lesson trainer vs lesson NPC as separate mechanics (one mechanic, two origins)

**Book Screen** (écran-livre) *(added 2026-07-07, audit 06)*:
The full-screen open-book view where a lesson plays: one kanji per double-page spread (left = identity: character, reading, English keyword, concept icon, audio; right = usage: 1-2 example sentences with audio), then paginated grammar pages, then the proportional mini-quiz (1 question per kanji + 1 if grammar). Fixed page content, page-turn transitions, never scrolls.
_Avoid_: lesson screen, book view, and never confuse with the Lesson Book (the menu)

**Lesson Book** (Carnet de leçons) *(added 2026-07-07, audit 06)*:
The START-menu screen (slot レッスン): the table of contents of the player's lesson history — chapters = visited zones with completion counters; per zone: completed lessons (tap to re-read on the Book Screen, read-only), the next lesson shown as who-and-where only, later ones masked as ???. Computed read-only by `getLessonBook` from existing state; no "encountered" tracking exists.
_Avoid_: batch (retired word), lesson queue, lesson menu

**Reading Journal** (どくしょノート) *(added 2026-07-07, audit 08)*:
The Bag screen listing every text whose zone is unlocked: read texts open for re-reading, unread ones appear greyed with a who-carries-it hint. Status colors — white = read (quiz passed, retry-until-correct), gold = one flawless quiz pass, earnable anytime by re-reading (quiz reshuffled). Same white/gold semantics as Kanjidex tiles.
_Avoid_: library, trophy shelf, and never confuse with the Lesson Book (the lesson menu)

**Dialogue State**:
The named variant of what an NPC or Trainer currently says, selected by the player's progress (e.g. `intro`, `post_battle`, `blocked`). A character's line is never fixed for the whole game — it changes as the story moves forward.
_Avoid_: dialogue line, script

**Inline Reading** *(renamed from "Adaptive Furigana" 2026-07-06, audit 04 — the adaptive per-kanji display was abolished 2026-07-01; readings are now always hidden by default and toggled page-wide by the Y button)*:
A hand-authored reading written directly in the `jp` string, in full-width parentheses immediately after the kanji run it covers (`道場（どうじょう）`) — never computed at runtime from a dictionary. Format norm: ADR-0002.
_Avoid_: auto-furigana, computed furigana, adaptive furigana

**Kanji Budget**:
The calibration rule that a single dialogue — across all its Dialogue States and pages combined — may use at most 2 kanji the player hasn't studied yet, on top of kanji already known. Applies per dialogue, not per page or sentence *(confirmed as the authoritative unit 2026-07-06, audit 04, finding 04-A2)*. For Progressive Texts the budget is proportional instead: ~2 unknown kanji per 100 characters, capped at 8–10 distinct unknowns per text *(2026-07-07, audit 05, finding 05-D1 — same ~98% readability contract, adapted to length)*. Character names are exempt from the budget; their Inline Readings follow the same Y-button reveal as everything else.
_Avoid_: unknown kanji limit (per line)

**Condition** *(type list updated 2026-07-06 twice: audit 04 relic hunt, then progression re-pass — `all_texts_read` retired: "everything read" was ruled too demanding; CS-Kanji now gate on a monotone `count(texts_read, N)` threshold, so the model has no dynamic-perimeter condition left)*:
A single gating predicate against the player's current state (`count(metric, threshold)` — generalizes the old `kanji_count`, `item_owned`, `quest_step`, `npc_cleared`, `event_cleared`, `badge_earned`, `time_window`), each optionally inverted with the `negate` modifier. A `Condition[]` array is an AND of all its members. The one gating vocabulary used everywhere a door exists: NPC/Trainer unlock (gates *presence* on the map, not just dialogue content — an entity whose Conditions aren't met doesn't exist on the tile that day), Gym door, CS-Kanji zone lock, Quest Step, Dialogue State selection. The daily SRS gate is deliberately NOT a Condition (it would violate the monotonicity invariant — see PRD § Boucle Quotidienne).
_Avoid_: gate, requirement, unlock rule, kanji_count

**Effect** *(type list updated 2026-07-06, audit 04 relic hunt; `unlock_lesson` retired 2026-07-07, audit 06 — never defined or used anywhere: lesson content is fixed at authoring time, lesson order is driven by `quest_step`/`advance_quest` on `lessons-<zone_id>`)*:
A single one-shot change to the player's state, attached to a Dialogue State (`advance_quest`, `grant_item`, `remove_item`, `unlock_zone`, `unlock_text`). Fires when that Dialogue State is reached — never inferred or recomputed. All Effects are idempotent; `grant_item` idempotency is driven by `item_kind` (`unique` — inert if owned; `fungible` — increments a quantity).
_Avoid_: reward, side effect, trigger action

**State Rule**:
An ordered `Condition[] → Dialogue State` mapping on an NPC; the engine evaluates rules top to bottom and uses the first match (a final `default` rule always matches). This is how an NPC's active Dialogue State is chosen — never hardcoded per-NPC logic.
_Avoid_: state selector, dialogue logic

**Quest**:
A named, ordered sequence of Quest Steps that can span multiple NPCs and zones (e.g. the Ilex Forest escaped-companions errand touches an NPC in the forest and another back in Azalea Town). Lives in its own file, independent of any single NPC. A Quest never tracks its own progress by recomputing Conditions — progress is the `current_step` set by an `advance_quest` Effect.
_Avoid_: mission, errand (when referring to the modeled entity — fine as flavor text)

**Quest Step**:
One named stage of a Quest (e.g. `briefed`, `captured_1`, `complete`). Existence as a name is what other systems reference via `Condition { type: "quest_step" }` — a step has no inherent conditions of its own; whatever NPC's Effect sets `current_step` to it is what "completes" it.
_Avoid_: quest stage, milestone (milestone is reserved for Achievements)
