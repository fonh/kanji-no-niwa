Status: ready-for-agent

# 11 — Unlockable texts + Johto map

## Parent

`.scratch/kanji-no-niwa/PRD.md`

## What to build

Two content-browsing features that reward long-term mastery: the reading library (`/texts`) where authentic Japanese literature unlocks as kanji are mastered, and the Johto map (`/map`) that visualises the learner's journey as a geography rather than a counter.

## Before starting

Henri must source and place the following before this slice starts:

**Aozora Bunko texts:**
Download public-domain Japanese literature from https://www.aozora.gr.jp. Recommended starting set (adjust with agent at slice start):
- 吾輩は猫である — 夏目漱石 (N2-heavy, good first authentic text)
- 坊っちゃん — 夏目漱石
- 羅生門 — 芥川龍之介
- 竹取物語 (classical — very high kanji difficulty)
- 走れメロス — 太宰治

Download the UTF-8 plain text versions (.txt) and place in `/scripts/sources/aozora/`. The agent writes the import script.

**AI-generated texts (lower difficulty):**
No download needed — the agent generates 10–15 short AI texts (150–300 characters each) using only N5–N4 kanji, via a small Claude API batch. These will be available within the first 6–8 weeks of study.

**Johto map sprite:**
Source the HGSS Johto region map image from The Spriters Resource (NDS → HGSS → Maps/Overworld). Place as `/public/assets/johto-map.png`. The agent overlays SVG zones on top.

## What to build (continued)

**Schema additions:**

- `texts` table: (id, title, source enum('aozora','ai-generated'), body_japanese text, body_english text, jlpt_level, synopsis_en text, kanji_inventory jsonb — array of kanji chars found in the text, comprehension_questions jsonb).
- `text_reads` table: (id, user_id, text_id, mode enum('standard','sans-filet'), comprehension_score int, read_at).

**Import scripts:**

- `/scripts/import-aozora.ts` — parses each `.txt` file, extracts kanji inventory by tokenising the Japanese text, writes to `texts` with `source: 'aozora'`. Comprehension questions generated in the same Claude API batch (4-choice, one correct answer).
- The same script (or a second batch) generates 10–15 AI texts using only N5–N4 kanji and seeds them with `source: 'ai-generated'`.

**`ProgressionEngine.isTextUnlocked`** is already implemented (Slice 1). This slice wires it to live mastery data.

**`/texts` — reading library:**

Grid of text cards. Each card shows: title, source badge (Aozora / AI-generated), JLPT level indicator, one-sentence English synopsis, first line of Japanese text (blurred with a frosted-glass effect if locked), and a progress bar showing unlock percentage (mastered kanji in text ÷ total kanji in text × 100). Clicking an unlocked text opens `/texts/[id]`. Clicking a locked text shows the progress bar and the unlock threshold (80% for AI-generated, 95% for Aozora) as a tooltip.

**`/texts/[id]` — reading view:**

- Japanese text rendered with each kanji and word tappable.
- Tapping a kanji or word opens an inline popover: meaning, reading, SRS status. A "Voir la carte" button inside the popover navigates to the full `/kanji/[id]` or `/word/[id]`.
- Popover works for ALL kanji in the text, including unseen ones (shown as "not yet in your queue").
- Comprehension questions shown after the reader reaches the end of the text (4-choice, single answer).
- On question submit: post-reading word panel appears — all words in the text grouped by SRS status (Mastered / In Progress / Not yet studied / Not in JLPT set). Computed on the fly by matching tokenised text against the `words` table.
- Re-read count displayed in the header ("Read 3 times").
- Mode sans-filet toggle: hides the English translation for the entire reading session. Comprehension questions still count. Shows a separate accuracy score for the attempt.
- A row is written to `text_reads` on each completion.

**`/map` — Johto map:**

- Static HGSS Johto map sprite as the background image.
- SVG overlay layer with one clickable region per zone (49 zones). Zone regions drawn as approximate bounding polygons keyed to `johto_zone` identifiers.
- Zone colouring: grey = no lessons completed in this zone; coloured (zone-specific palette) = some lessons completed; gold = all lessons in this zone completed.
- Trainer avatar (current rank sprite) placed at the frontier zone — the zone with the highest `zone_order` where at least one lesson has been completed. Computed by `getFrontierZone`.
- Tapping a zone opens a side panel listing that zone's lessons with their completion status (Locked / Available / Completed).
- Link in navigation bar.

**`getFrontierZone`** is already in the ProgressionEngine spec (Slice 1). This slice adds tests if not already covered:
- No lessons completed → null.
- Lessons in zones 3, 7, 15 → returns zone 15 (highest zone_order).
- Multiple lessons in same zone → zone returned once.

**Session summary** now shows real text progress (replacing the placeholder from Slice 6): "竹取物語 → 74%" using live mastery data.

## Acceptance criteria

- [ ] `texts` and `text_reads` tables created with correct schema.
- [ ] Aozora import script parses `.txt` files, extracts kanji inventory, generates comprehension questions via Claude API.
- [ ] 10–15 AI-generated texts seeded (N5–N4 kanji only, 150–300 chars each, with comprehension questions).
- [ ] `isTextUnlocked` wired to live mastery data; unlock status computed correctly per text.
- [ ] `/texts` library renders all texts with correct unlock %, blurred preview for locked texts, source badge, JLPT level.
- [ ] `/texts/[id]` renders Japanese text with tappable kanji/word popovers (including unseen kanji).
- [ ] Inline popover: meaning, reading, SRS status, "Voir la carte" link.
- [ ] Comprehension questions appear after reaching end of text.
- [ ] Post-reading word panel shows all text words grouped by SRS status.
- [ ] Re-read count displayed and incremented on each `text_reads` write.
- [ ] Mode sans-filet toggle hides English translation for entire session; separate accuracy score displayed.
- [ ] `/map` renders HGSS Johto map sprite with SVG zone overlays.
- [ ] Zone colouring correct (grey/coloured/gold) based on lesson completion per zone.
- [ ] Trainer avatar placed at frontier zone (highest completed zone by zone_order).
- [ ] Zone tap opens side panel listing lessons with status.
- [ ] `getFrontierZone` Vitest tests pass (all cases from PRD).
- [ ] Session summary text progress now shows real data.
- [ ] Map and Texts links added to navigation.

## Blocked by

- Issue #04 (lessons and johto_zone data)
- Issue #05 (mastery tracking live for unlock percentage)
