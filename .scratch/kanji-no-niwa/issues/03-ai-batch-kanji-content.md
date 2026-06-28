Status: ready-for-human

# 03 — AI batch: kanji content (etymology + mnemonic)

## Parent

`.scratch/kanji-no-niwa/PRD.md`

## What to build

A one-time offline batch script that calls the Claude API to generate etymology and mnemonic for all 2136 Jōyō kanji, then writes the results back to Supabase. After this slice, the kanji card (`/kanji/[id]`) and the review reveal screen (`/study`) display real, authored explanations instead of placeholder dashes.

This is a content production slice — no new UI routes, only two existing UI sections that switch from "—" to live text.

## Before starting

- The `kanji` table must be fully seeded (Issue #02 complete).
- Henri must have a **Claude API key** (Anthropic Console → API Keys). Set as `ANTHROPIC_API_KEY` in `.env.local`.
- The batch script can be run by Henri with `npx ts-node scripts/batch-kanji-content.ts`. It is safe to re-run (idempotent: skips kanji that already have content).
- Expected runtime: ~2–3 hours for all 2136 kanji at conservative rate limits. The script logs progress so Henri can monitor it.

## What to build (continued)

A single script `/scripts/batch-kanji-content.ts` that:

1. Reads all 2136 kanji from Supabase where `etymology IS NULL OR mnemonic IS NULL`.
2. For each kanji, sends a Claude API request with a structured prompt producing two fields:
   - **etymology**: 2–4 sentences explaining the kanji's pictographic origins and how its visual components combine to produce its meaning. Tone: knowledgeable, precise. Reference the components by their character (e.g. "The component 日 sun above 月 moon gives 明 bright.").
   - **mnemonic**: 1–3 sentences in the style of an enthusiastic teacher — a vivid, memorable story anchoring the kanji's appearance to its meaning. Must reference the visual shape and at least one key reading.
3. Writes results back to `kanji.etymology` and `kanji.mnemonic`.
4. Handles rate limits (exponential backoff), logs each kanji processed, and writes a `scripts/sources/batch-kanji-log.json` with success/failure per character so any failed rows can be retried.

Two existing UI sections are updated:

- **`/kanji/[id]` etymology section**: renders the `etymology` field as a paragraph. If null (pre-batch), shows "—".
- **`/kanji/[id]` mnemonic section**: renders the `mnemonic` field. If null, shows "—".
- **Review reveal screen** in `/study`: for a meaning or reading card, the reveal panel now shows a one-line etymology summary (first sentence of `etymology`) and the full `mnemonic` text below the correct answer.

## Acceptance criteria

- [ ] `kanji` table has `etymology text` and `mnemonic text` columns (migration added if not already present from Slice 2).
- [ ] `/scripts/batch-kanji-content.ts` exists and is runnable with `npx ts-node`.
- [ ] Script uses Claude API (claude-sonnet-4-6 or later) with a structured JSON output format for reliability.
- [ ] Script is idempotent: re-running skips kanji that already have both fields populated.
- [ ] Script writes `scripts/sources/batch-kanji-log.json` logging success/failure per character.
- [ ] On error for a single kanji, the script logs the failure and continues rather than crashing.
- [ ] Rate limiting: no more than 50 requests per minute (configurable constant at the top of the script).
- [ ] Sample quality check: a manual review of 10 randomly selected kanji (N5, N4, N3, N2, N1 spread) confirms the output is accurate and in the correct tone. Document these 10 examples in `scripts/sources/batch-kanji-sample.md`.
- [ ] `/kanji/[id]` etymology and mnemonic sections now render live text for all populated kanji.
- [ ] Review reveal screen (`/study`) shows etymology summary + mnemonic on the reveal panel for meaning and reading cards.
- [ ] No UI regressions on `/explorer`, `/kanji/[id]`, or `/study` compared to Slice 2.

## Blocked by

- Issue #02 (kanji table fully seeded)
