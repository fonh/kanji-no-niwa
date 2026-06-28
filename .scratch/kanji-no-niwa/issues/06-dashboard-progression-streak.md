Status: ready-for-agent

# 06 — Full dashboard + trainer progression + streak

## Parent

`.scratch/kanji-no-niwa/PRD.md`

## What to build

Replace the minimal dashboard from Slice 1 with the full three-zone layout, wire up the complete 25-level trainer rank system with rank-up animations, and implement the streak mechanic with Streak Shields. The session summary also gets its full enrichment (EXP bar, upcoming word unlock, text progress indicator).

## Before starting

Henri must download and place the following sprites before this slice starts:

**Trainer sprites** (25 rank sprites + Fukuda):
- Source: The Spriters Resource → NDS → Pokémon HeartGold/SoulSilver → Characters
- Download overworld/trainer sprites for: Gamin (Young Boy), Fillette (Young Girl), Attrapeur (Bug Catcher), Randonneur (Hiker), Pêcheur (Fisherman), Campeur (Camper), Marin (Sailor), Jongleur (Juggler), Sage (×2 — used for both Sage rank and Fukuda), Silver (Rival), Falkner, Bugsy, Whitney, Morty, Chuck, Jasmine, Pryce, Clair, Will, Koga, Bruno, Karen, Lance, Professor Elm, Red.
- Place in `/public/sprites/trainers/` using the slugs from the PRD rank table (e.g. `gamin.png`, `silver.png`, `falkner.png`, `red.png`, `fukuda.png`).

## What to build (continued)

**Dashboard layout — three zones:**

*Hero zone* (top): trainer sprite (current rank), rank name, EXP bar showing progress toward next rank (kanji studied vs. next threshold), next rank name and kanji target.

*Action zone* (middle): "Start Session" button with today's due card count beneath it. Daily Challenge card (placeholder "Coming in Slice 12" until that slice ships). Below both: new kanji available today count.

*Stats zone* (bottom, collapsible on mobile): kanji studied counter (X / 2136), kanji mastered counter (X / 2136), words mastered counter (X / 7836), current streak in days, shield count, longest-ever streak, annual activity heatmap (GitHub-style contribution graph, one square per day for the past 365 days, coloured by review count).

**Trainer progression:**

`getTrainerRank` is already implemented. This slice wires it to a live rank-up detection: after each session, if the studied count crosses a rank threshold, a full-screen rank-up animation fires — the new trainer sprite slides in, rank name appears, a brief fanfare (placeholder sound for now; real audio in Slice 7). Rank change is stored on the user row.

**Streak mechanic:**

`ProgressionEngine.getStreakState(reviewHistory, today, shields)` — pure function, returns `{ currentStreak, longestStreak, shieldCount, streakPreservedToday }`.

Rules:
- Streak increments by 1 for each calendar day with ≥ 1 completed review.
- Streak Shield gift: user starts with 1 shield (set during onboarding in Slice 1 — add a migration if not already present).
- Shield earned for every 10 consecutive study days, capped at 2 total.
- If a day is missed and a shield is available: shield consumed silently, streak preserved. User sees the count drop by 1 when they next open the app; no notification is sent.
- If a day is missed with 0 shields: streak resets to 0.

Streak state is stored in `users` as: `current_streak int`, `longest_streak int`, `shield_count int`, `last_reviewed_date date`.

**Session summary enrichment:**

After each review session the summary screen now shows:
- Accuracy % and cards reviewed (already in Slice 1).
- EXP bar: visual progress bar showing movement toward next trainer rank based on today's studied delta.
- Upcoming word unlock: "火山 unlocks in 2 days" — the closest word whose blocking kanji has the nearest FSRS next_review_at date projecting to mastery.
- Text unlock progress: "竹取物語 → 74%" — the closest locked text by unlock percentage (placeholder data until Slice 11).

## Acceptance criteria

- [ ] `users` table has: `current_streak int`, `longest_streak int`, `shield_count int default 1`, `last_reviewed_date date`, `trainer_rank int default 1`.
- [ ] Dashboard renders all three zones with live data.
- [ ] Hero zone: correct trainer sprite for current rank, accurate EXP bar toward next threshold.
- [ ] Stats zone: all counters accurate (studied, mastered, words mastered). Heatmap renders 365 days of review activity.
- [ ] `ProgressionEngine.getStreakState` implemented and exported.
- [ ] Vitest tests for `getStreakState`: no reviews → 0/0; 10 consecutive → streak 10, 1 shield earned; miss day with 1 shield → streak preserved, 0 shields; miss with 0 shields → reset to 0; 20 consecutive → capped at 2 shields.
- [ ] Streak is updated on each session completion. Shield is consumed silently on first dashboard load after a missed day.
- [ ] Full-screen rank-up animation fires when studied count crosses a rank threshold. Shows new trainer sprite + rank name. Does not fire again for the same rank on subsequent loads.
- [ ] Session summary shows: accuracy, cards reviewed, EXP bar progress, upcoming word unlock message (or "—" if no words close to unlock), text progress placeholder.
- [ ] All 25 trainer sprites are served from `/public/sprites/trainers/` with no broken image references.

## Blocked by

- Issue #01 (auth, dashboard scaffold)
- Issue #02 (full kanji count for studied/mastered stats)
