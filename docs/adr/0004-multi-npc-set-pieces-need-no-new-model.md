---
status: accepted
---

# Multi-NPC set-pieces (Rocket HQ, Radio Tower, Bell Tower) need no new "Event" model

After designing the Condition/Effect/Quest model (ADR-0003), the next open question was whether the game's large multi-NPC set-pieces — the Mahogany Team Rocket HQ (3 floors, alarm statues, a stealth-vs-frontal computer, two passwords), the Goldenrod Radio Tower (5 floors plus a detour to the Goldenrod Tunnel, a disguise requirement, a boss fought twice), and the Ecruteak Bell Tower ascent (gatekeepers, teleporter floors, a 5-Kimono-Girl ritual climax) — need a dedicated `map_events`/event-orchestration data model. Project memory referenced `map_events`/`rocket_event_progress` as planned tables, but a direct re-read of the current `.scratch/kanji-no-niwa/PRD.md` found no such tables — only `rocket_progress`, `silver_progress`, `kimono_progress`, `legendary_progress` (simple per-milestone `cleared_at` trackers). The memory reference was stale.

**Decision:** no new model. These set-pieces are ordinary compositions of `map_trainers`/`map_npcs`, sequenced by one or more `Quest`s:
- Item/password/disguise gates (Card Key, Rocket disguise, B3F passwords) are `Condition.item_owned` / `Condition.quest_step` on the next NPC's `unlock_conditions`.
- `unlock_conditions` gates **presence** on the map, not just dialogue content — an NPC or Trainer whose conditions aren't met simply doesn't exist on the tile that day. This is the one clarification this decision required (previously implicit). It's also what expresses "two different NPCs at the same tile depending on state" (the Mahogany souvenir-shop vendor replaced by an old lady after the Rocket HQ falls; Jasmine's Gym trainers absent until the Lighthouse quest resolves) — two registry entries with complementary conditions, not a special-case mechanism.
- A stealth bypass (disabling the alarm system to skip a Sbire-duo encounter) is just two registry entries at the same tile with complementary `unlock_conditions` — not a different trigger type.
- Multi-floor interiors get one `zone_id` per floor/room, following the precedent already set by the Elite Four's five separate rooms (`indigo-plateau-will`, `-koga`, `-bruno`, `-karen`, `-lance` — one building, five zone_ids). The "49 zones" count will grow once these interiors are tile-authored; that's expected, not a discrepancy to fix.
- The ~17 major named milestones (3 Rocket events, 6 Silver encounters, 5 Kimono Girls, 3 legendaries) keep their existing dedicated tables rather than routing through generic `npc_quest_progress` — the list is small and fixed, so the indirection isn't worth it. Game logic writes to these tables directly when the arc's final NPC/Trainer is resolved.

## Considered Options

- A dedicated `map_events` table with its own step/state model, parallel to Quest — rejected, would duplicate everything Quest already does (ordered steps, Condition-gated progression) for no added expressiveness; the only thing set-pieces have "more of" is NPC count and floor count, not a different kind of logic.
- Routing the major milestones (Rocket/Silver/Kimono/legendary) through generic `npc_quest_progress` instead of their own tables — rejected, ~17 fixed named entries don't need a generic indirection layer; the dedicated tables are also what achievements and gate-checks already query directly per the existing PRD.
- A "stealth mode" flag or branching-path primitive for bypassable encounters — rejected, two conditionally-present registry entries at the same tile already expresses this with the vocabulary that exists.

## Consequences

- `.scratch/kanji-no-niwa/PRD.md` gained a paragraph clarifying that `unlock_conditions` gates presence, and that multi-NPC set-pieces compose existing primitives rather than needing new ones.
- Confirms [ADR-0003](./0003-condition-effect-quest-model.md)'s model is sufficient as designed; no follow-up ADR needed for set-piece content until a real case proves otherwise.
- Floor-level teleporter/switch puzzles (Bell Tower 7F–9F, the Rocket HQ B2F switch puzzle) are explicitly out of scope here — those are spatial/tile puzzles, not NPC/dialogue mechanics, and belong with the Obstacles-Puzzles content already noted as hand-written in the PRD.

**Update (2026-07-06, audit 04):** the same composition principle settles recurring multi-*zone* characters (Eusine, Silver, Lance, Bill, the itinerant photographer): one registry entry and one `npc_id` per (character × zone), narrative thread carried by a shared `Quest` each appearance references — no global "character" entity (PRD § Implémentation, finding 04-D1). The registry also gained a `kind` field (`npc` | `object` | `sign`) so text-bearing signs and ground objects compose the existing trigger model instead of needing their own table (finding 04-C3).
