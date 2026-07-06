---
status: accepted
---

# Hand-written dialogue content language: English

Project memory held a "Content language: English" decision, but it was originally set for content sourced from English-only data (JMdict, Hanabira examples). All the design docs themselves (PRD, curriculum-checkpoints, guidebook-adapted) are written in French, and the project owner is a French native speaker — so it was genuinely ambiguous whether hand-written narrative dialogue, which isn't sourced from any English dataset, should default to French instead.

**Decision:** hand-written dialogue translations (the `en` field on each Dialogue State page) are English — same as JMdict/Hanabira-sourced content, confirmed explicitly by the project owner.

**Why:** a single content language avoids two different translation conventions living side by side in the same `lessons`/`texts`/dialogue data, even though the design docs that describe the system stay in French.

## Update (2026-07-06, audit 04) — inline reading norm and displayed-name norm

The twelve existing dialogue files already wrote readings inline (`道場（どうじょう）`) and the PRD already specified the Y button's behavior, but no reference doc defined the format itself (finding 04-C1). This ADR is that norm:

**Inline readings (`jp` fields of dialogue pages, and any player-visible Japanese):**
- A reading is hand-authored by the content writer directly in the `jp` string, in **full-width parentheses `（…）` immediately after the kanji run it covers**: `道場（どうじょう）`, `町（まち）`. Never computed from a dictionary at runtime (see `CONTEXT.md`, Inline Reading).
- Grouping is **per word / per contiguous kanji run**, not per character: `道場（どうじょう）`, not `道（どう）場（じょう）`.
- Full-width parentheses immediately following a kanji are **reserved for readings**. A literal parenthetical in dialogue text must use half-width ASCII `(...)` or be rephrased — this is what makes the format parseable.
- The renderer strips readings by default; **the Y button toggles all readings of the current page at once** (PRD § Mouvement de l'avatar). No per-kanji adaptive display — that mechanism was abolished 2026-07-01.
- Every kanji in player-visible text carries a reading in the data, mastered or not (`content/curriculum-checkpoints.md`, writing checklist item 5); what is *shown* is solely the player's Y-button choice.

**Displayed names (finding 04-A1):** the `name` field of dialogue files becomes bilingual — `"name": { "jp": "たんパンこぞうの ケン", "en": "Youngster Ken" }`. The `jp` form is what the game displays (VS screen, dialogue box); the `en` form feeds the X-button translation and work documents. French trainer-class names ("Gamin", "Fillette", "Oiselier") are content bugs — no French anywhere in the product. Character names are exempt from the 2-unknown-kanji budget (`CONTEXT.md`, Kanji Budget) and their readings follow the same Y-button rule as everything else.

**File format addenda (finding 04-D4):** `jlpt_level` on a dialogue file is a calibration field for the content team (target zone level), not read by the engine. The dialogue file is the source of truth for the displayed `name`; the `content/map/npcs.json` registry keeps at most a work-note label. Phone-call content (PRD § Pokégear, revised 2026-07-06) lives in `content/dialogues/calls/<caller_id>.json` and follows this same page/state format and language rules.
