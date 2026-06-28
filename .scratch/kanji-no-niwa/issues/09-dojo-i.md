Status: ready-for-agent

# 09 — 道場 I: Carnet de Combat + 門弟 + 試練 + mini-games

## Parent

`.scratch/kanji-no-niwa/PRD.md`

## What to build

The first half of the 道場 combat system: the Carnet de Combat page, the two guard battles (門弟) and the master's trial (試練) for each of the 8 師範 (Falkner through Clair), battle ranking (初伝/中伝/奥伝/皆伝), and the two mini-games (Reading Blitz, Word Forge) that gate specific 門弟 battles.

Also includes: 印 award ceremonies, 試練 24-hour cooldown, Carnet de Combat ETA estimates, and Fukuda's post-試練 messages.

Slice 10 builds on this to add Antichambre, Elite Four, Lance, and Red.

## Before starting

Henri must write and place the following content before this slice starts. The agent imports it to Supabase.

**Files Henri must create:**

1. `/content/battles/unlock-conditions.json` — JSON array defining every battle's unlock conditions using the schema from the PRD:
```json
[
  {
    "battle_id": "montei-falkner-1",
    "prereqs": [],
    "conditions": [{ "type": "studied", "value": 670 }, { "type": "streak", "value": 14 }]
  },
  ...
]
```
Include all 門弟 (×16) and 試練 (×8) battles using the multi-condition table from the PRD.

2. `/content/dialogues/shiren-dialogues.md` — for each of the 8 師範:
   - `trigger_type: shiren_intro`, `trigger_ref: shiren-[name]` — the 師範's pre-試練 speech (3–6 sentences, tone per the PRD table).
   - `trigger_type: inkan_ceremony`, `trigger_ref: shiren-[name]` — the 印 ceremony line (1–2 sentences, tone per the PRD table).
   - `trigger_type: shiren_cleared`, `trigger_ref: shiren-[name]` — Fukuda's post-試練 message (3–5 sentences, narrative arc per the PRD scene inventory).

Also, Henri must download and place **8 師範 sprites** from The Spriters Resource (NDS → HGSS → Gym Leader sprites):
`/public/sprites/leaders/falkner.png`, `bugsy.png`, `whitney.png`, `morty.png`, `chuck.png`, `jasmine.png`, `pryce.png`, `clair.png`

And the following audio:
- Gym Leader Battle theme → `/public/music/gym-leader-battle.mp3`
- Victory Road theme (for Antichambre, used in Slice 10) → `/public/music/victory-road.mp3`
- 印 ceremony fanfare → `/public/sfx/inkan-fanfare.mp3` (use the Gym Leader victory jingle from HGSS)

## What to build (continued)

**Schema additions:**

- `battle_unlock_conditions` table: (battle_id text PK, prereqs jsonb, conditions jsonb). Seeded from `unlock-conditions.json`.
- `battle_results` table: (id, user_id, battle_id, score float, accuracy float, time_seconds int, max_combo int, rank enum('初伝','中伝','奥伝','皆伝'), played_at). Index on (user_id, battle_id).
- `battle_rewards` table: (user_id, battle_id, reward_type text, unlocked_at). Tracks 皆伝 rewards unlocked.

**ProgressionEngine additions:**

- `getBattleUnlockStatus(battleId, conditions, userStats)` — evaluates each condition against current user stats. Returns `{ isUnlocked: bool, conditions: { type, required, current, met }[] }`.
- `getBattleRank(score, battleConfig)` — returns 初伝/中伝/奥伝/皆伝 or null (below 初伝 threshold). Scoring formula: `score = (accuracy²) × time_multiplier × combo_multiplier`. Thresholds per the PRD score table.
- `getDōjōKanji(dōjōTheme, studiedSet)` — returns intersection of themed kanji (per PRD theme table) and studied set, sorted by JLPT level, up to 20 results. If fewer than 10 themed kanji in studied set, supplements with semantically adjacent studied kanji to reach 10.
- `getEstimatedMasteryDays(studiedButUnmasteredCards, targetMasteryCount)` — projects days until `targetMasteryCount` cards reach FSRS stability ≥ 30 days. Pure function: takes card states, returns integer days.

Vitest tests added for all four new functions.

**`/battles` — Carnet de Combat:**

A single page listing every battle in the game in order. Each entry shows:
- Battle name and opponent sprite.
- Status: Locked / Available / In Progress (cooldown) / Cleared (best rank badge).
- Per-condition progress bars (one bar per condition with current/required values).
- For cleared battles: best rank badge (初伝/中伝/奥伝/皆伝) and a "Rejouer" button.
- For battles where primary condition is met but secondary is not: an ETA estimate ("Estimé dans ~12 jours au rythme actuel") computed by `getEstimatedMasteryDays`.
- For 試練 in cooldown: a countdown timer showing hours remaining.

**Battle session:**

Built on the existing `/study` infrastructure with three differences:
1. Queue is fixed (not FSRS-scheduled) — drawn by `getDōjōKanji` or a fixed pool depending on battle type.
2. A visible HP bar for the opposing "kanji trainer" depletes with each correct answer.
3. A countdown timer displayed in the upper corner.

Results do not affect FSRS card state.

On session end: score computed, `getBattleRank` called, result written to `battle_results`. If 初伝 threshold not met: failure state written (triggers 24h cooldown for 試練 only).

**門弟 battles:** 10 kanji from `getDōjōKanji` for the 師範's theme. 5-minute timer. 60% accuracy required for 初伝.

**試練 battles:** 20 kanji from `getDōjōKanji`. 10-minute timer. 70% accuracy for 初伝. On first clear: 印 ceremony fires (師範 sprite appears, delivers ceremony line from `dialogues`, fanfare plays, 印 badge awarded). On fail (below 初伝): 24h cooldown written to `battle_results`.

**印 ceremony:** Full-screen overlay. 師範 sprite slides in, delivers their `inkan_ceremony` dialogue line. Fanfare plays. A styled 印 seal animates onto the screen. After dismiss, Fukuda's post-試練 message (`shiren_cleared`) is written to `fukuda_messages` and becomes available in `/sensei`.

**Mini-games (accessible from Carnet de Combat only, for applicable battles):**

*Reading Blitz:* 60-second timer. Kanji flash one at a time. Tap correct meaning from 4 options. +10 points per correct, 0 for wrong. Gate threshold: 300 points. High score persisted in `battle_results` under `battle_id: reading-blitz`. Shows "Best: X" on the Carnet entry.

*Word Forge:* 3-minute timer. Given 6 kanji from the user's studied set. Drag and combine to form valid JLPT words. +50 per valid 2-kanji compound, +80 per valid 3-kanji compound. Only words whose component kanji are all in the studied set count. Validation server-side via `getWordForgeScore(combinations, studiedSet, jmdictWords)`. Gate threshold: 200 points.

## Acceptance criteria

- [ ] `battle_unlock_conditions`, `battle_results`, `battle_rewards` tables created.
- [ ] `unlock-conditions.json` authored by Henri and seeded to `battle_unlock_conditions`.
- [ ] `shiren-dialogues.md` authored by Henri and imported to `dialogues` table (all 8 师範 × 3 dialogue types).
- [ ] `getBattleUnlockStatus`, `getBattleRank`, `getDōjōKanji`, `getEstimatedMasteryDays` implemented, exported, and tested.
- [ ] `/battles` Carnet de Combat renders all 門弟 + 試練 battles with correct status, progress bars, and ETA estimates.
- [ ] Battle session UI: fixed queue, HP bar, countdown timer. Results do not touch FSRS card state.
- [ ] 門弟 battles: 10 kanji, 5-minute timer, 60% accuracy for 初伝.
- [ ] 試練 battles: 20 kanji, 10-minute timer, 70% accuracy for 初伝.
- [ ] 試練 fail: 24h cooldown written, countdown timer visible in Carnet.
- [ ] 試練 first clear: 印 ceremony fires (sprite, dialogue, fanfare). Fukuda message written to `fukuda_messages`.
- [ ] Battle ranking badge (初伝/中伝/奥伝/皆伝) displayed on cleared Carnet entries.
- [ ] "Rejouer" replays cleared battles with a fresh random selection from the same themed pool. First-clear 印 is never at risk on replay.
- [ ] Reading Blitz mini-game playable from Carnet; score persisted; gate threshold enforced.
- [ ] Word Forge mini-game playable from Carnet; combinations validated server-side; gate threshold enforced.
- [ ] Gym Leader Battle music plays during 試練 sessions.
- [ ] All 8 師範 sprites render correctly in the 印 ceremony and Carnet entries.

## Blocked by

- Issue #06 (rank + progression live)
- Issue #07 (battle session audio and animations)
- Issue #08 (Fukuda message writes live)
- Henri must complete `/content/battles/unlock-conditions.json` and `/content/dialogues/shiren-dialogues.md` before the agent starts
