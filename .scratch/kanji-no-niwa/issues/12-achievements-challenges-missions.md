Status: ready-for-agent

# 12 — Achievements + daily challenges + missions

## Parent

`.scratch/kanji-no-niwa/PRD.md`

## What to build

Three interconnected features that give learners goals beyond the daily review queue: a permanent achievement system with full-screen badge animations, a daily challenge generated each midnight calibrated to the learner's deck, and a missions page where production tasks (writing, translating, photographing) earn Fukuda's acknowledgement.

## Before starting

Henri must write the following content before this slice starts:

**`/content/missions/missions.md`** — definitions for the first set of missions, one per unlock milestone:

For each mission, write:
- `id`: a slug (e.g. `composition-01`)
- `title`: short name (e.g. "Ta journée en kanji")
- `description`: the task instruction in full (e.g. "Décris ta journée en utilisant au moins 5 kanji N5 appris cette semaine.")
- `format`: one of `composition`, `haiku`, `oral_reading`, `translation`, `urban_exploration`
- `unlock_condition`: e.g. `{ "type": "studied", "value": 50 }`
- `fukuda_reaction`: a 1–3 sentence Fukuda comment specific to this mission type (e.g. for composition: "You chose your words carefully. That is the first discipline.")

Minimum: 8 missions across all 5 formats, spanning unlock conditions from 50 → 500 kanji studied. More missions can be added later without a code change.

The agent imports these to the `missions` table.

No additional downloads required for this slice.

## What to build (continued)

**Schema additions:**

- `achievements` table: (id text PK slug, title_en, title_jp, description, icon_url, category).
- `user_achievements` table: (user_id, achievement_id, earned_at). Composite unique.
- `missions` table: (id text PK, title, description, format, unlock_condition jsonb, fukuda_reaction text).
- `user_missions` table: (id, user_id, mission_id, completed_at, notes text). Notes stores what the user submitted (their self-grade attestation).
- `daily_challenges` table: (id, user_id, date, template text, target_value int, completed bool, completed_at).

**Achievement system:**

`detectAchievements(userId, sessionResult, userStats)` — pure function, checks all ~40 achievement conditions after each session. Returns list of newly earned achievements. Called server-side after session save; writes to `user_achievements`.

Achievement categories and conditions (all from US 72 in the PRD):
- Kanji studied: 10, 50, 100, 500, 1000, 2136
- Kanji mastered: 1, 10, 50, 100, 500, 1000, 2136
- Words mastered: 10, 100, 500, 1000, 7836
- Streak: 3, 7, 30, 100, 150, 200, 250, 300, 365 days
- Reading: 1st text unlocked, 10 texts read, 50 texts read
- Session precision: 100% accuracy
- Speed: session completed in under 10 minutes
- JLPT tier: all N5 mastered, all N4, N3, N2, N1
- Combat: first 印, all 8 印, Antichambre cleared, Red defeated, Red at 皆伝
- Shiny: first Shiny, 10 Shinies, 50 Shinies

Full-screen achievement animation: when a new achievement is detected at session end, a badge slides in with a fanfare sound (Victory Road fanfare — already in `/public/sfx/`). Multiple achievements queue and play sequentially.

**`/profile` page:**

Trainer name, current rank sprite, total study time (computed from `reviews` table), key stats summary (studied, mastered, words mastered, streak). All earned badges displayed as a collection grid. Badges not yet earned shown as locked silhouettes.

**Daily challenge system:**

A Supabase Edge Function runs each midnight (cron trigger). For each user, it:
1. Reads today's due card count, recent accuracy (7-day rolling average), and average seconds/card.
2. Selects a template at random from the pool and parameterises it:
   - Accuracy: target = 7-day rolling average + 2% (capped at 90%)
   - Quantity: 80% of cards due today
   - Time: avg seconds/card × 1.5 × card count
   - Explorer bonus (if < 10 cards due): "Visit 5 kanji cards you've never opened"
3. Writes one row to `daily_challenges` for today.

The challenge appears in the Action zone of the dashboard (replacing the placeholder from Slice 6). On completion, a Fukuda message is written via `writeFukudaMessage`. The user's lifetime `daily_challenges_completed` counter (stored on the `users` row) increments — this feeds 道場 unlock conditions.

**`/missions` page:**

Lists all unlocked missions. Each card shows: title, format badge, description, and a "Je l'ai fait" (self-grade) button that triggers a completion flow:
1. A confirmation modal: "Mark this mission complete? Fukuda will react."
2. On confirm: row written to `user_missions`. Fukuda's reaction is written to `fukuda_messages`. Mission card shows "Complété ✓" with the completion date.

Completed missions accumulate in a Carnet de Missions section on `/profile` (a chronological journal list below the badge grid).

## Acceptance criteria

- [ ] `achievements`, `user_achievements`, `missions`, `user_missions`, `daily_challenges` tables created.
- [ ] `missions.md` authored by Henri and imported to `missions` table (≥ 8 missions across all 5 formats).
- [ ] `detectAchievements` implemented for all ~40 conditions; called server-side after each session.
- [ ] Full-screen achievement animation fires for newly earned badges; multiple achievements queue sequentially.
- [ ] Achievements are permanent: earning then losing mastery does not revoke a badge.
- [ ] `/profile` renders trainer info, key stats, earned badge grid, locked silhouettes for unearned.
- [ ] Supabase Edge Function generates one daily challenge per user each midnight (cron-triggered).
- [ ] Daily challenge displays in Action zone of dashboard.
- [ ] Challenge completion: Fukuda message written, `daily_challenges_completed` counter incremented.
- [ ] `/missions` lists all unlocked missions with correct unlock conditions respected.
- [ ] "Je l'ai fait" flow writes `user_missions` row and Fukuda reaction to `fukuda_messages`.
- [ ] Carnet de Missions on `/profile` shows completed missions chronologically.
- [ ] Profile link added to navigation.

## Blocked by

- Issue #08 (Fukuda message writes live — `writeFukudaMessage` available)
- Issue #10 (combat achievements require battle data)
- Henri must complete `/content/missions/missions.md` before the agent starts
