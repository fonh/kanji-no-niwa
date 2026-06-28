Status: ready-for-agent

# 08 — Sensei Fukuda companion (/sensei + random encounters)

## Parent

`.scratch/kanji-no-niwa/PRD.md`

## What to build

Fukuda becomes a persistent presence throughout the app. Every major achievement triggers a message from him that accumulates in `/sensei` — his room. This slice also adds the three random encounter types (surprise quiz, Special Delivery, Welcome Back) and the deterministic narrative threshold events (Level 4 exercise, Level 7 and Level 23 Silver letters).

## Before starting

Henri must write the following hand-authored content before this slice starts. The agent will tell Henri exactly what to write using the structure below. Henri creates the files; the agent imports them to the `dialogues` table.

**Files Henri must create in `/content/dialogues/`:**

1. `fukuda-rank-transitions.md` — one Fukuda message per rank transition (ranks 2–25), ~2–5 sentences each. Tone arc: measured+instructional (ranks 2–13), warmer+vulnerable (ranks 14–18), quiet+retrospective (ranks 19–25). Each message is keyed by `trigger_type: rank_transition`, `trigger_ref: rank_N` (N = 2..25).

2. `fukuda-mastery-milestones.md` — messages for: 1, 10, 50, 100, 500, 1000, 2136 kanji mastered. `trigger_type: mastery_milestone`, `trigger_ref: mastered_N`.

3. `threshold-events.md` — three one-time story event scripts:
   - Level 4 exercise: Fukuda leaves a 3-question quiz on 3 random studied kanji, delivered as a modal overlay on the dashboard the first time the app opens after 150 kanji studied. `trigger_type: threshold_event`, `trigger_ref: rank_4_exercise`.
   - Level 7 Silver letter 1: Silver's first letter, dismissive of Fukuda. `trigger_type: threshold_event`, `trigger_ref: rank_7_silver`.
   - Level 23 Silver final appearance: Silver returns after Lance, admits he was wrong. `trigger_type: threshold_event`, `trigger_ref: rank_23_silver`.

4. `random-encounters.md` — pool content:
   - 20+ Fukuda surprise quiz intro lines (e.g. "I left you an exercise before I arrived.")
   - 10+ Special Delivery lesson titles and one-paragraph introductions (themed: weather kanji, food kanji, body kanji, colour kanji, nature kanji)
   - 10+ Welcome Back messages (e.g. "The garden grew a little wild without you. Let's tend it.")

The agent imports all content from `/content/dialogues/` to the `dialogues` Supabase table.

## What to build (continued)

**Schema:**

- `dialogues` table: (id, trigger_type text, trigger_ref text, body_markdown text, reward_only bool default false). Unique constraint on (trigger_type, trigger_ref).
- `fukuda_messages` table: (id, user_id, trigger_type, trigger_ref, message_text, created_at). Records every Fukuda message a user has received.
- `triggered_events` column on `users` (jsonb array of trigger_refs that have already fired) — prevents threshold events from re-firing.

**Server-side trigger writes:**

A server action `writeFukudaMessage(userId, triggerType, triggerRef)` looks up the dialogue by (trigger_type, trigger_ref), writes a row to `fukuda_messages`, and returns the message text. Called on:
- Rank transition (fires from the same logic as the rank-up animation in Slice 6)
- 試練 cleared (fires in Slice 9)
- Mastery milestones: 1, 10, 50, 100, 500, 1000, 2136 kanji mastered
- Mission submitted (fires in Slice 12)
- Daily challenge completed (fires in Slice 12)

**`/sensei` page:**

Fukuda's room. Displays all messages in `fukuda_messages` for the current user in chronological order (oldest first). Each message is rendered as a scroll entry with its date. A counter at the top shows "X messages collected." Persistent icon in the navigation bar (Fukuda's Sage sprite, small).

**Narrative threshold events (dashboard modals):**

On each dashboard load, after all cards are fetched, check if any threshold condition is newly met and the event has not yet fired (`triggered_events` does not contain the ref):
- `rank_4_exercise`: fires at `kanji_studied ≥ 150`. Shows a modal with Fukuda's exercise (3 questions on studied kanji, inline quiz). Answering all 3 correctly adds a special note to `/sensei`.
- `rank_7_silver`: fires at `kanji_studied ≥ 300`. Shows Silver's first letter as a full-screen modal overlay.
- `rank_23_silver`: fires at `trainer_rank = 23`. Shows Silver's final appearance.

Each event fires exactly once. On dismiss, the trigger_ref is added to `triggered_events`.

**Random encounters (dashboard, post-threshold):**

After threshold checks, random encounters roll only if the daily review queue is empty (session already completed today). Checked in order; at most one fires per dashboard load:

1. **Fukuda surprise quiz** — 10% chance. Picks 3 random kanji from the user's studied set, shows a modal with Fukuda's intro line and 3 inline meaning/reading questions. Answering all 3 correctly adds a note to `/sensei`.
2. **Special Delivery** — 5% chance, only if none in the past 14 days. A bonus themed reading lesson (one of the pool items from `random-encounters.md`) shown as a modal. Does not add FSRS cards. Does not count against daily lesson limit. Unseen kanji in the lesson appear greyed out with a link.
3. **Welcome Back** — fires deterministically if `last_reviewed_date < today - 1 day`. Fukuda says something from the welcome-back pool. Shows as a soft overlay that auto-dismisses after 4 seconds or on tap.

**Fukuda session tip:**

At the end of each review session summary, 30% of the time Fukuda's tip appears — a short, interesting fact about one of the kanji just reviewed. Content sourced from the `content` table (tip pool), populated in a small auxiliary batch: `/scripts/batch-content-pool.ts` generates 200+ session tips, 50+ notification messages, 10+ welcome-back messages using Claude API.

## Acceptance criteria

- [ ] `dialogues`, `fukuda_messages` tables created with correct schema.
- [ ] `triggered_events jsonb` column added to `users`.
- [ ] `/content/dialogues/` directory with all four files authored by Henri and imported to `dialogues` table.
- [ ] `writeFukudaMessage` server action implemented and called on all qualifying events (rank transition, mastery milestones).
- [ ] `/sensei` page renders all user messages chronologically with date labels and a message count.
- [ ] Fukuda icon in navigation bar (visible from every page), links to `/sensei`.
- [ ] Three threshold events fire at correct conditions, each exactly once, rendered as modal overlays.
- [ ] Level 4 exercise modal: 3 inline quiz questions, correct answers add a special note to `fukuda_messages`.
- [ ] Random encounter roll logic correct (10% quiz, 5% Special Delivery, Welcome Back deterministic).
- [ ] Special Delivery lesson does not create FSRS cards and does not count against daily lesson limit.
- [ ] Fukuda session tip appears at end of ~30% of sessions (sourced from `content` tip pool).
- [ ] `batch-content-pool.ts` generates and seeds the `content` table (200+ tips, 50+ notification messages, 10+ welcome-back messages).
- [ ] All Fukuda messages in `/sensei` use the authored text from Henri's dialogue files, not placeholder text.

## Blocked by

- Issue #06 (rank transitions live, dashboard exists)
- Henri must complete `/content/dialogues/` files before the agent starts this slice
