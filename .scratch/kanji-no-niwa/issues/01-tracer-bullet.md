Status: ready-for-agent

# 01 — Tracer bullet: sign in and study your first kanji

## Parent

`.scratch/kanji-no-niwa/PRD.md`

## What to build

The thinnest possible path through the entire stack — from zero to a working first session. A new user signs in with Google, chooses a trainer name, is greeted by Sensei Fukuda (placeholder text), does a one-lesson introduction to the kanji 一, answers a two-question end-of-lesson quiz, and lands on a dashboard showing rank 1 and "1 kanji studied."

This slice establishes the complete architecture that all subsequent slices build on: Next.js App Router project, Supabase project and schema, Google OAuth, PWA manifest, FSRS card creation, and the review session battle UI. Content is minimal — one seeded kanji, one seeded lesson, one seeded dialogue line — because richness comes in later slices. The goal is a skeleton that works end-to-end.

The `ProgressionEngine` module is introduced here with its first two functions (`getTrainerRank`, `getLessonQueue`), fully tested with Vitest. The test suite is the quality gate for all future ProgressionEngine work.

## Before starting

Nothing to download. All content is placeholder text seeded directly by the import script.

## Acceptance criteria

- [ ] Next.js 14+ App Router project initialised with TypeScript, Tailwind CSS, and a Vercel-deployable config.
- [ ] Supabase project created. Schema includes: `users` (id, trainer_name, created_at), `kanji` (id, character, meanings jsonb, on_readings text[], kun_readings text[], jlpt_level, component_ids jsonb), `lessons` (id, title, body_markdown, johto_zone, kanji_ids jsonb, quiz_questions jsonb), `cards` (id, user_id, kanji_id, card_type enum('meaning','reading'), fsrs_state jsonb, next_review_at, created_at), `reviews` (id, user_id, card_id, rating int, reviewed_at, new_fsrs_state jsonb).
- [ ] One kanji seeded: 一 (character, meaning "one", on-reading いち, kun-reading ひと, jlpt N5, no component prerequisites).
- [ ] One lesson seeded: a short placeholder narrative about 一 with two quiz questions (one meaning, one reading).
- [ ] One dialogue seeded in `dialogues` (id, trigger_type, trigger_ref, body_markdown): Fukuda's onboarding intro (trigger_type: `onboarding`, trigger_ref: `intro`) — placeholder text: "Welcome. This is 一. The beginning of everything. Study it well."
- [ ] PWA manifest and service worker registered so the app is installable on iOS/Android.
- [ ] Google OAuth configured via Supabase Auth. Sign-in page at `/` (unauthenticated) with a single "Sign in with Google" button.
- [ ] Post-auth onboarding: if `users.trainer_name` is null, show a trainer name input screen. On submit, save to `users` and proceed.
- [ ] Onboarding shows Fukuda's intro dialogue (from `dialogues` table), then immediately starts the seeded lesson.
- [ ] Lesson reading UI at `/lessons/[id]`: displays `body_markdown` rendered as HTML. Minimal styling (readable, mobile-friendly). No washi texture yet — that comes in Slice 4.
- [ ] End-of-lesson quiz: each question shows the kanji, prompts for meaning or reading, reveals the correct answer, then shows a 4-button rating (Again / Hard / Good / Easy) styled identically to the review screen. Any score passes — the rating only affects when the first SRS review fires (Good/Easy → several hours, Again → 30 minutes).
- [ ] On quiz completion, two FSRS cards (meaning + reading) are created in `cards` for 一 with `next_review_at` set by `ts-fsrs` based on the quiz ratings.
- [ ] `/study` route: loads cards due for the current user. Shows each card in a Pokémon battle layout — kanji in the upper-right "opposing Pokémon" position, a "?" trainer silhouette in lower-left, a dialogue-box question prompt, a single "Reveal" button, then 4 FSRS rating buttons. After rating, updates `cards.fsrs_state` and `cards.next_review_at` via `ts-fsrs`. Session ends when queue is empty.
- [ ] Session summary screen: shows cards reviewed count and a "Back to dashboard" button.
- [ ] Dashboard at `/` (authenticated): shows trainer name, rank name "NPC" (level 1), and "1 kanji studied / 2136". Start Session button showing today's due card count.
- [ ] `ProgressionEngine` module at `src/lib/progression-engine.ts` (pure TypeScript, no I/O):
  - `getTrainerRank(studiedCount: number): TrainerRank` — returns the correct rank object for all 25 levels per the PRD rank table.
  - `getLessonQueue(availableKanji: string[], completedLessons: string[], allLessons: Lesson[], queuedKanji: string[]): Lesson[]` — returns lessons whose entire kanji set falls within `availableKanji`, with queued-kanji lessons first.
- [ ] Vitest test suite at `src/lib/progression-engine.test.ts` covering: `getTrainerRank` at all 25 boundary values (0, 50, 100, ..., 2136), and `getLessonQueue` with: all kanji available, some prerequisites missing, queued kanji sorted first.
- [ ] App is deployable to Vercel with environment variables documented in `.env.example`.

## Blocked by

None — can start immediately.
