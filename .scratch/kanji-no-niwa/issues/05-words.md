Status: ready-for-agent

# 05 — Words: vocabulary unlocks on mastery

## Parent

`.scratch/kanji-no-niwa/PRD.md`

## What to build

Import the full vocabulary dataset (JMdict → 7836 JLPT words, Tatoeba → example sentences), run an AI batch to generate compound stories for each word, and wire up the word unlock mechanic: when a kanji reaches mastery (both FSRS cards at stability ≥ 30 days), its words become available for SRS study.

This slice adds word cards to the review session and the `/word/[id]` detail page.

## Before starting

Henri must download these two free datasets:

1. **JMdict** — `JMdict_e.gz` from https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project (CC BY-SA 4.0). Contains all Japanese words with English definitions, readings, and part-of-speech.
2. **Tatoeba** — `jpn_sentences.tsv.bz2` and `links.csv.bz2` from https://tatoeba.org/en/downloads (CC BY 2.0). Only the Japanese sentence pairs are needed.

Place both in `/scripts/sources/` before running the imports.

Henri must also have the **Claude API key** set for the compound story batch.

## What to build (continued)

**Import scripts:**

- `/scripts/import-jmdict.ts` — parses JMdict, writes the 7836 JLPT-tagged words to `words` table (id, word text, kana_reading, part_of_speech, meanings jsonb, jlpt_level, kanji_ids jsonb — the kanji characters that appear in the word).
- `/scripts/import-tatoeba.ts` — parses Tatoeba, selects 3 example sentences per word (one casual, one concrete, one formal/figurative register), writes to `sentences` (id, word_id, japanese_text, english_translation, register enum).

**AI batch** `/scripts/batch-word-stories.ts`:

- For each of the 7836 words, generates a `compound_story`: 1–2 sentences explaining how the component kanji meanings combine to produce the word's meaning. Example: "火 fire + 山 mountain → the fire that erupts from a mountain: volcano." Tone: enthusiastic teacher.
- Writes to `words.compound_story`. Idempotent, logs to `scripts/sources/batch-word-stories-log.json`.

**Word unlock mechanic:**

`ProgressionEngine.getAvailableWords(masteredKanjiSet, allWords, wordsAlreadyInDeck)` — returns words eligible to enter the SRS queue. A word is eligible when all its component kanji are in `masteredKanjiSet` and it is not already in the deck. Sorted N5 → N4 → N3 → N2 → N1.

On each review session completion, `getAvailableWords` is called. Newly eligible words enter the SRS queue subject to two caps:
- Daily cap: 2× the user's daily kanji lesson limit (default 20 word cards/day).
- Global pending queue cap: if the pending word queue already holds ≥ 200 cards, no new words are admitted until it drops below 150.

**Word cards in `/study`:**

Word meaning cards prompt with the word in kanji form; reveal shows kana reading, meaning, compound story, and one example sentence. Word reading cards prompt with the word in kanji; reveal shows the kana reading with furigana breakdown, and one example sentence.

**`/word/[id]`:**

Shows word in kanji + kana, part of speech, English meaning, compound story, JLPT level, SRS status badge (Locked / In Progress / Mastered), which kanji must be mastered before it unlocks (if locked), and 3 example sentences (collapsible register labels). Each kanji in the word is a clickable link to `/kanji/[id]`.

**`/kanji/[id]` vocabulary section:**

Now populated with 6–8 common words containing this kanji. Each word shows reading, meaning, and SRS status badge. Clicking a word navigates to `/word/[id]`.

## Acceptance criteria

- [ ] `words` table: id, word text, kana_reading, part_of_speech, meanings jsonb, jlpt_level, kanji_ids jsonb, compound_story text.
- [ ] `sentences` table: id, word_id, japanese_text, english_translation, register.
- [ ] `import-jmdict.ts` upserts all 7836 JLPT words (idempotent).
- [ ] `import-tatoeba.ts` assigns ≤ 3 sentences per word, covering distinct registers where available.
- [ ] `batch-word-stories.ts` populates `compound_story` for all 7836 words (idempotent, resumable).
- [ ] `ProgressionEngine.getAvailableWords` implemented and exported.
- [ ] Vitest tests for `getAvailableWords`: all kanji mastered → word returned; one kanji unmastered → word excluded; N5 before N4; already in deck → excluded.
- [ ] Word unlock mechanic fires on session completion: newly mastered kanji trigger a `getAvailableWords` call; eligible words are queued subject to daily cap and global pending cap.
- [ ] Word cards appear in `/study` review session: meaning and reading card types, correct reveal content (compound story, example sentence).
- [ ] `/word/[id]` renders all required sections.
- [ ] `/kanji/[id]` vocabulary section now populated with real words and SRS status badges.
- [ ] Hitting "Again" on a card whose kanji was previously mastered recomputes mastery and removes that kanji from `masteredKanjiSet` immediately (mastery is live, not cached).

## Blocked by

- Issue #03 (kanji content live; mastery tracking established)
