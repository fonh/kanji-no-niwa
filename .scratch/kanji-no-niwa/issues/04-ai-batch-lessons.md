Status: ready-for-agent

# 04 — AI batch: lesson curriculum (~450 chapters + /library)

## Parent

`.scratch/kanji-no-niwa/PRD.md`

## What to build

A one-time offline batch script that generates the full lesson curriculum: ~450 lesson chapters, each narrated by Sensei Fukuda, covering 5–10 kanji in the voice of a teacher walking through a zone of Johto. Each lesson is assigned a `johto_zone` field used by `/map` (Slice 11). The batch also generates end-of-lesson quiz questions (1–2 per kanji covered).

After this slice, the placeholder lesson from Slice 1 is replaced by the real curriculum. The `/library` page displays the full shelf of scrolls.

## Before starting

- Issue #02 must be complete (all 2136 kanji seeded, component graph in place).
- `getLessonQueue` from Slice 1 is already wired — it will automatically use the new lessons once they're in the database.
- Henri must have a **Claude API key** set as `ANTHROPIC_API_KEY` in `.env.local`.
- Can be run in parallel with Issue #03 (they write to different tables).
- Expected runtime: ~6–10 hours for ~450 lessons. Script logs progress and is safe to re-run.

## What to build (continued)

Script `/scripts/batch-lessons.ts`:

1. Uses `getLessonQueue` to determine the curriculum ordering (prerequisite graph + JLPT priority) and groups kanji into batches of 5–10.
2. For each lesson batch, sends a Claude API request producing:
   - **title**: a short evocative lesson title (e.g. "The Light in the Sky — 日・月・明")
   - **body_markdown**: a 600–1000 word narrative chapter in Fukuda's voice. Fukuda is in a specific Johto zone; he references the landscape, addresses the reader as his student, explains each kanji through etymology and context, and may reference related kanji not yet in the student's queue. Markdown with `## Section` headings and `> quote` blocks for kanji displays.
   - **johto_zone**: one of the 49 zone IDs from the PRD zone map table (e.g. `new-bark-town`, `violet-city`). Assigned based on lesson sequence — early lessons are in New Bark Town and Route 29; later lessons progress through Johto to Mt. Silver summit.
   - **quiz_questions**: JSON array of 1–2 objects per kanji, each with `{ kanji_id, question_type: "meaning"|"reading", prompt, correct_answer, distractors: string[3] }`.
3. Writes results to `lessons` table: (id, title, body_markdown, johto_zone, kanji_ids jsonb, quiz_questions jsonb, lesson_order int).
4. Logs progress to `scripts/sources/batch-lessons-log.json`.

The placeholder lesson from Slice 1 is removed or overwritten by the real lesson covering 一.

**`/library`** — the Bibliothèque du Dojo:

- Route: `/library`
- Layout: a shelf of scrolls. Completed lessons (user has finished the end-of-lesson quiz) show as open scrolls with the lesson title visible. Upcoming lessons show as sealed scrolls with a ribbon. Locked lessons (prerequisites not met) show as dark, sealed scrolls.
- Clicking an open scroll navigates to `/lessons/[id]` in read-only mode (no quiz replay).
- Link in navigation bar.

**Lesson reading UI** (upgrades to Slice 1's minimal version):

- Washi paper texture background (`/public/assets/washi-bg.webp` — Henri places this file).
- Fukuda's sprite (`/public/sprites/trainers/sage.png` — same Sage sprite used as Fukuda throughout) displayed on the right side of the lesson reading area.
- Brush-stroke typography for kanji headings (Zen Old Mincho or Noto Serif JP via Google Fonts).
- Ink-line section dividers between lesson sections.
- Hanko stamp animation on lesson completion: a red circular seal presses down with an ink sound effect (`/public/sfx/hanko.mp3` — Henri places this file).

## Before starting (assets Henri must place)

Before starting this issue, Henri needs to place two files:
- `/public/assets/washi-bg.webp` — a free washi paper texture (search "washi texture free webp"; any CC0 or free-for-personal-use source works)
- `/public/sfx/hanko.mp3` — a rubber stamp / ink press sound (The Sounds Resource or freesound.org)

These are not downloaded by the script; Henri places them manually.

## Acceptance criteria

- [ ] `lessons` table has columns: id, title, body_markdown, johto_zone, kanji_ids jsonb, quiz_questions jsonb, lesson_order int.
- [ ] `/scripts/batch-lessons.ts` is runnable and idempotent.
- [ ] All ~450 lessons generated, each covering 5–10 kanji, with `johto_zone` populated from the 49-zone table in the PRD.
- [ ] Each lesson has 1–2 quiz questions per kanji covered (meaning or reading).
- [ ] Placeholder lesson from Slice 1 replaced or superseded.
- [ ] Sample quality check: 5 lessons reviewed manually (early, mid, late curriculum) for Fukuda tone and accuracy. Documented in `scripts/sources/batch-lessons-sample.md`.
- [ ] `/library` route renders completed lessons as open scrolls, upcoming as sealed, locked as dark.
- [ ] Clicking an open scroll opens the lesson in read-only mode.
- [ ] Lesson reading UI (`/lessons/[id]`) now shows washi texture, Fukuda sprite, Zen Old Mincho font for kanji headings, ink-line dividers.
- [ ] Hanko stamp animation fires on lesson completion (red seal, ink sound).
- [ ] Library link added to navigation.
- [ ] `getLessonQueue` returns correct ordering for all 2136 kanji using the full lesson table.

## Blocked by

- Issue #02 (kanji table and component graph fully seeded)

*Can run in parallel with Issue #03.*
