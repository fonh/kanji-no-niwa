Status: ready-for-agent

# 02 — Full kanji universe: Explorer + kanji card

## Parent

`.scratch/kanji-no-niwa/PRD.md`

## What to build

Expand the one-kanji seed from Slice 1 to all 2136 Jōyō kanji and their component graph. Add the `/explorer` grid so learners can see the full scope of what they're learning, and the `/kanji/[id]` detail page so each kanji is a navigable entry — not just a flashcard.

This slice also wires up `getAvailableKanji` with the full prerequisite logic, so the lesson queue from Slice 1 now respects the KanjiVG component graph.

## Before starting

Henri must download these three free source files before the agent starts:

1. **Kanjidic2** — `kanjidic2.xml.gz` from https://www.edrdg.org/kanjidic/kanjidic2.xml.gz (EDRDG, CC BY-SA 4.0)
2. **KanjiVG** — `kanjivg-20220427.xml.gz` from https://github.com/KanjiVG/kanjivg/releases (CC BY-SA 3.0)
3. **KRADFILE** — `kradfile.gz` and `kradfile2.gz` from https://www.edrdg.org/krad/kradinf.html (EDRDG, CC BY-SA 4.0)

Place all files in `/scripts/sources/` before running the import.

## What to build (continued)

Three import scripts under `/scripts/`:

- `import-kanjidic2.ts` — parses `kanjidic2.xml`, writes all 2136 Jōyō kanji to the `kanji` table (character, meanings, on/kun readings, JLPT level, school grade, stroke count, Unicode codepoint).
- `import-kanjivg.ts` — parses `kanjivg-*.xml`, writes component relationships to `kanji_components` (parent_kanji_id, component_kanji_id). Only stores relationships where both parent and component are in the `kanji` table.
- `import-kradfile.ts` — parses KRADFILE, supplements any missing component edges not covered by KanjiVG.

`ProgressionEngine.getAvailableKanji` is implemented and tested:
- Hard constraint: all KanjiVG/KRADFILE visual components must be in `studiedSet` first.
- Soft sort: N5 → N4 → N3 → N2 → N1 → unranked, by frequency within each tier.

The Explorer at `/explorer` shows all 2136 kanji in a grid. Each tile is colour-coded by three statuses: **Unseen** (no lesson completed, grey), **Studied** (in SRS but not mastered, blue), **Mastered** (both cards at FSRS stability ≥ 30 days, gold). Tiles are filterable by JLPT level (N5/N4/N3/N2/N1). Clicking a tile opens the kanji card.

The kanji card at `/kanji/[id]` shows: character (large), all meanings and readings, visual components (linked to their own cards), JLPT level and school grade, status badge (Unseen/Studied/Mastered), and a "Queue for lesson" button. If a component prerequisite is not yet studied, the button shows exactly which components are missing instead of refusing silently. Etymology and mnemonic fields are present in the schema but shown as placeholder "—" until Slice 3.

## Acceptance criteria

- [ ] `kanji_components` table added to schema: (parent_id references kanji.id, component_id references kanji.id, source enum('kanjivg','kradfile')).
- [ ] `import-kanjidic2.ts` upserts all 2136 Jōyō kanji (idempotent — safe to re-run).
- [ ] `import-kanjivg.ts` upserts component relationships from KanjiVG.
- [ ] `import-kradfile.ts` supplements missing edges from KRADFILE.
- [ ] `ProgressionEngine.getAvailableKanji(studiedSet, allKanji, componentGraph)` implemented and exported.
- [ ] Vitest tests for `getAvailableKanji`: unstudied component blocks parent; all components studied → parent returned; N5 before N4; unranked last; kanji with no components always available.
- [ ] `/explorer` renders all 2136 kanji tiles in a responsive grid (minimum 10 columns on desktop, 5 on mobile).
- [ ] Tiles are colour-coded Unseen/Studied/Mastered using live user card data.
- [ ] JLPT filter buttons (All / N5 / N4 / N3 / N2 / N1) filter the grid client-side without a network round-trip.
- [ ] Clicking any tile navigates to `/kanji/[id]`.
- [ ] `/kanji/[id]` shows: character (large, brush-weight font), all meanings and readings, JLPT level + school grade, current SRS status badge, component list (each component is a link to its own card; unstudied components are greyed out but still clickable).
- [ ] "Queue for lesson" button: if all prerequisites are met and kanji is Unseen, queues the kanji (adds to `queued_kanji` on the user row or equivalent). If prerequisites are missing, shows a list of the specific missing components.
- [ ] Etymology and mnemonic sections visible on `/kanji/[id]` but display "—" until populated in Slice 3.
- [ ] Vocabulary section visible on `/kanji/[id]` but empty until Slice 5.
- [ ] Dashboard "kanji available today" counter now reflects `getAvailableKanji` output.
- [ ] Explorer link added to navigation.

## Blocked by

- Issue #01 (tracer bullet — project scaffold + schema)
