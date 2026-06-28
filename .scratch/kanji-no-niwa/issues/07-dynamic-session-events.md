Status: ready-for-agent

# 07 — Dynamic session events

## Parent

`.scratch/kanji-no-niwa/PRD.md`

## What to build

Add the layer of moment-to-moment delight that makes the review session feel alive: audio (battle music, victory jingle, escape sound), and three in-session surprise mechanics (Critical Hit, Combo counter, Shiny Encounter). Also adds the Kanji Escaped animation that replaces the plain "Again" transition.

## Before starting

Henri must download and place the following audio files before this slice starts:

**From archive.org** (search "Pokémon HeartGold SoulSilver OST"):
- Wild Pokémon Battle theme → `/public/music/wild-battle.mp3`
- Trainer Battle theme → `/public/music/trainer-battle.mp3`
- Elite Four Battle theme → `/public/music/elite-four-battle.mp3`
- Victory fanfare (short jingle) → `/public/sfx/victory.mp3`

**From The Sounds Resource** (NDS → Pokémon HeartGold/SoulSilver → Sound Effects):
- Poké Ball burst / capture attempt fail sound → `/public/sfx/escape.mp3` (used for Kanji Escaped on Again)
- A "critical hit" battle sound → `/public/sfx/critical-hit.mp3`

If exact tracks can't be found, Henri should use the closest match and note the substitution.

## What to build (continued)

**Audio system:**

A `useAudio` hook manages background music and sound effects. Music loops. SFX play once. Both are mutable independently (wired to settings in Slice 13).

Battle music selection by trainer rank:
- Ranks 1–10: wild battle theme
- Ranks 11–18: trainer battle theme
- Ranks 19–24: Elite Four battle theme

On Good or Easy rating: play `victory.mp3` (short jingle, ~2 seconds).
On Again rating: play `escape.mp3` then trigger the Kanji Escaped animation (see below).

**Kanji Escaped animation:**

When the user hits "Again", instead of simply cycling to the next card, the kanji character animates — it breaks out of a Poké Ball visual at the top of the screen, arcs upward, and disappears off the top edge (CSS keyframe animation, ~0.8 seconds). The escape sound plays simultaneously. After the animation completes, the next card slides in.

**Critical Hit:**

If the user taps "Reveal" within 3 seconds of a card appearing, a Critical Hit flash fires: a yellow frame pulse around the screen + the `critical-hit.mp3` sound. The card rating then proceeds normally. The 3-second window starts when the card is fully rendered.

**Combo counter:**

A running counter of consecutive non-Again answers (Hard, Good, or Easy counts). The counter appears on screen after 3 in a row and escalates in visual intensity:
- 3–4: small counter badge, no animation
- 5–9: bouncing badge with orange colour
- 10–14: glowing badge with red colour + shake on each new hit
- 15+: full-width banner pulse on each new hit

A single "Again" resets the counter to 0. The counter is session-local — it does not persist between sessions.

**Shiny Encounter:**

0.2% chance per card reviewed (roll on card reveal). At most one Shiny per session. If triggered:
- The card's background shimmers gold for the duration of the card.
- A distinct sparkle sound plays (use `victory.mp3` at a lower volume or source a separate sparkle SFX).
- If the user rates the card Hard, Good, or Easy (not Again): the kanji earns a permanent Shiny badge stored in `kanji_shinies` table `(user_id, kanji_id, earned_at)`. The badge is never revoked.
- On the Explorer grid, kanji with a Shiny badge display a small gold shimmer overlay on their tile.
- The Session summary shows any Shinies earned this session with a short fanfare line.

## Acceptance criteria

- [ ] `kanji_shinies` table: (user_id, kanji_id, earned_at). Composite unique constraint on (user_id, kanji_id).
- [ ] Background music plays on `/study` session start, looping. Track selected by current trainer rank per the audio map table.
- [ ] Victory jingle plays on Good or Easy rating.
- [ ] Kanji Escaped animation plays on Again rating (CSS keyframe, ~0.8s) with escape sound.
- [ ] Critical Hit flash fires when Reveal is tapped within 3 seconds of card render.
- [ ] Combo counter appears after 3 consecutive non-Again answers, with four escalating visual states (3–4, 5–9, 10–14, 15+).
- [ ] Combo resets to 0 on Again.
- [ ] Shiny roll fires at 0.2% per card reveal; at most 1 Shiny per session.
- [ ] Shiny triggers gold shimmer overlay on the card for its duration.
- [ ] Answering a Shiny card with Hard/Good/Easy writes a row to `kanji_shinies`.
- [ ] Explorer tile for a kanji with a Shiny badge shows a gold shimmer CSS overlay.
- [ ] Session summary lists Shiny badges earned this session (if any).
- [ ] Audio is mutable — both music and SFX volume respect a mute flag stored in `localStorage` (settings page in Slice 13 will expose this as a toggle; this slice just reads the flag).
- [ ] No audio plays during end-of-lesson quiz (Slice 4) — only during `/study` review sessions.
- [ ] All animations and audio play correctly on iOS Safari (PWA context).

## Blocked by

- Issue #01 (review session `/study` exists)
