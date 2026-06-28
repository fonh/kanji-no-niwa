Status: ready-for-agent

# 10 — 道場 II: Antichambre + Elite Four + Lance + Red + 皆伝 rewards

## Parent

`.scratch/kanji-no-niwa/PRD.md`

## What to build

The final arc of the combat system. Builds directly on Slice 9's battle infrastructure to add: the Antichambre de la Ligue (bridge challenge after all 8 印), the four Elite Four battles, Lance's Dragon Scroll challenge, and the Red final confrontation. Also adds 皆伝 reward unlocks for all battle types.

## Before starting

Henri must write the following content before this slice starts:

**Files Henri must create:**

1. `/content/dialogues/elite-arc-dialogues.md` — all narrative scenes for the final arc:

   *Antichambre:*
   - `trigger_type: antichambre_unlocked`, `trigger_ref: antichambre` — Fukuda message when 8 印 are earned: "Eight seals. The Elite Four do not teach. Go." (~3 sentences)
   - `trigger_type: antichambre_cleared`, `trigger_ref: antichambre` — Fukuda message on clear: "The gate is open." (minimal, 1–2 sentences)

   *Elite Four* (one Fukuda post-battle message per member, `trigger_type: elite_cleared`):
   - `trigger_ref: will` — Will mentions the silent trainer
   - `trigger_ref: koga` — Koga's line on forgetting
   - `trigger_ref: bruno` — effortlessness vs. preparation
   - `trigger_ref: karen` — Karen's letter; Fukuda's box of letters; Red left none

   *Lance:*
   - `trigger_type: champion_cleared`, `trigger_ref: lance` — Lance pre/post battle + Dragon Scroll ceremony (3–5 sentences per beat)
   - `trigger_type: champion_cleared`, `trigger_ref: lance_fukuda` — Fukuda message post-Lance: reveals the poem in the scroll; wonders what Red thought of it

   *Silver reconciliation (threshold event):*
   - `trigger_type: threshold_event`, `trigger_ref: silver_reconciliation` — Silver returns after Clair; asks about Red without knowing the player knows; leaves without saying goodbye (fires on first load after all 8 印 earned)

   *Professor Elm callback (threshold event):*
   - `trigger_type: threshold_event`, `trigger_ref: elm_callback` — Elm appears; reveals he recommended the player to Fukuda; full circle

   *Red:*
   - `trigger_type: red_battle`, `trigger_ref: red` — No dialogue. Snow. Silence. Red nods. (Scene description only — the UI renders this as minimal text + snow particle effect)

2. `/content/dialogues/kaiden-rewards.md` — 皆伝 reward content:
   - 8× `師範の伝言` texts: one per 師範, a deeper personal teaching revealed only at 皆伝. (~150–250 words each, `trigger_type: kaiden_reward`, `trigger_ref: kaiden-[name]`)
   - 4× Elite Four lore entries: extended history for Will, Koga, Bruno, Karen. (~200 words each, `trigger_type: kaiden_reward`, `trigger_ref: kaiden-elite-[name]`)
   - `trigger_type: kaiden_reward`, `trigger_ref: kaiden-lance-poem` — the hidden poem inside the Dragon Scroll (a verse Fukuda wrote as a young man)
   - `trigger_type: kaiden_reward`, `trigger_ref: kaiden-red-letter` — Fukuda's final letter (emotional culmination; written as if to a student who has surpassed the master). This is also saved as `/content/dialogues/fukuda_final_letter.md`, flagged `reward_only: true`.

3. `/content/dialogues/rival-encounter.md`:
   - `trigger_type: threshold_event`, `trigger_ref: rival_encounter` — Silver confrontation dialogue + context for the 20-card special session (Silver reveals why he left; does not know about Red)

Henri must also download and place **Elite Four + Lance + Red sprites** from The Spriters Resource:
`/public/sprites/leaders/will.png`, `koga.png`, `bruno.png`, `karen.png`, `lance.png`, `elm.png`, `red-battle.png`

And audio:
- Lance/Red battle theme → `/public/music/lance-red-battle.mp3`
- Silver (Rival) battle theme → `/public/music/rival-battle.mp3`
- Snow ambience (optional, for Red scene) → `/public/sfx/snow-ambience.mp3`

## What to build (continued)

**Rival Encounter (fires during level 10):**

When `kanji_studied ≥ 550` AND `kanji_mastered ≥ 40`, and the encounter has not yet fired: a full-screen narrative overlay with Silver's dialogue (from `dialogues`), then a special 20-card battle session drawn from N3 kanji the user has already studied. Silver battle music plays. Session uses the standard battle session UI. Results do not affect FSRS state.

**Antichambre de la Ligue:**

Unlock condition: all 8 印 earned (all 試練 cleared at any rank). 30-kanji pool: union of all 8 師範 themed sets intersected with the user's studied set. 12-minute timer, 72% accuracy for 初伝. Has its own 初伝/中伝/奥伝/皆伝 ranking and is replayable. No 皆伝 narrative reward. Victory Road theme plays.

**Elite Four battles:**

Four sequential battles unlocked after Antichambre cleared (each also has secondary conditions per the PRD table). 30 kanji per battle from themed pools. Accuracy thresholds: Will + Koga → 75% for 初伝, Bruno + Karen → 80% for 初伝. 12-minute timer. Elite Four Battle music (already available from Slice 7). On first clear of each: Fukuda message written. On 皆伝: lore entry unlocked from `battle_rewards`.

**Lance battle:**

35 kanji. 15-minute timer. 85% accuracy for 初伝. Lance/Red theme plays. On first clear: Dragon Scroll ceremony (Lance sprite + pre/post dialogue from `dialogues`). Fukuda's post-Lance message written. On 皆伝: hidden poem unlocked.

**Red battle:**

Unlock condition: all Elite Four cleared + Lance cleared + `kanji_mastered ≥ 1000` + `texts_read ≥ 10`. 50 kanji drawn from the rarest kanji the user has studied (lowest JLPT tier first). No time limit. 90% accuracy for 初伝 (pass threshold). Silence — no music. Snow particle CSS animation on the battle screen background. Red nods (minimal text, no dialogue). On 皆伝 (100% accuracy): Fukuda's final letter unlocked from `battle_rewards` and immediately shown as a full-screen modal. Achievement `"無言の証明"` awarded.

**皆伝 reward system:**

`getBattleRank` returning 皆伝 for the first time on a given battle triggers `unlockKaidenReward(userId, battleId)` server action, which:
1. Writes a row to `battle_rewards`.
2. Fetches the reward content from `dialogues` by (`trigger_type: kaiden_reward`, `trigger_ref: kaiden-[battle-id]`).
3. Shows the reward as a full-screen modal immediately after the battle score screen.

Aggregate 皆伝 achievements (evaluated after each battle):
- All 8 試練 at 皆伝 → title `"八印の主"` written to `users.title`.
- All 4 Elite Four at 皆伝 → text `"古の記録"` unlocked in `battle_rewards`.
- Red at 皆伝 → achievement badge `"無言の証明"` written, Fukuda's final letter shown.

## Acceptance criteria

- [ ] All content files authored by Henri and imported to `dialogues` table (all trigger_type/trigger_ref combinations above).
- [ ] Elite Four + Lance + Red sprites placed in `/public/sprites/leaders/`.
- [ ] Rival Encounter fires correctly (conditions met, fires once, 20-card session, Silver dialogue).
- [ ] Antichambre: correct unlock condition (all 8 印), 30-kanji pool, 12-min timer, 72% 初伝, replayable.
- [ ] Four Elite Four battles: sequential unlock, correct themes and accuracy thresholds (Will/Koga 75%, Bruno/Karen 80%), Fukuda message on first clear.
- [ ] Lance: 35 kanji, 15-min timer, 85% 初伝, Dragon Scroll ceremony on first clear, Fukuda message.
- [ ] Red: 50 kanji (rarest studied), no timer, 90% 初伝, snow particles, silence, Red nods.
- [ ] Red 皆伝 (100% accuracy): Fukuda's final letter shown as full-screen modal, `"無言の証明"` achievement awarded.
- [ ] 皆伝 rewards unlock correctly for all battle types (試練 × 8, Elite Four × 4, Lance, Red).
- [ ] Reward content displays as full-screen modal immediately after battle score screen.
- [ ] Aggregate achievements evaluated correctly (八印の主, 古の記録, 無言の証明).
- [ ] Carnet de Combat (`/battles`) now shows all battles including Antichambre, Elite Four, Lance, and Red with correct unlock conditions, progress bars, and status.
- [ ] Silver Reconciliation and Elm Callback threshold events fire at correct conditions.
- [ ] `/sensei` accumulates all Elite Four and Lance Fukuda messages as they are earned.

## Blocked by

- Issue #09 (道場 I — battle infrastructure, Carnet, 門弟/試練)
- Henri must complete all `/content/dialogues/` files listed above before the agent starts
