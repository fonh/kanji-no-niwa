# ui/trainer_card/ — Trainer Card Screen

**Source NARC:** `/a/1/0/4` (9 files)
**Extraction method:** NSCR tilemaps rendered with NCGR[0] (1024 tiles @4bpp) and NCLR[1] / NCLR[8]

## Description

The Trainer Card displays player name, ID, playtime, money, badges, and Pokédex count on an animated card that tilts and flips. The card background is rendered in two halves (upper/lower 256×256 screens), assembled by the game engine. The visual design is a diagonal white card face with a faint Pokémon sun/star logo watermark, on a dark background.

File structure: NCGR[0] = 1024 main tiles; NCLR[1] and NCLR[8] = two palette banks (two sides of the card); RCSN[2,3,4] = three 256×256 NSCRs; NCGR[5] = 112 element tiles; RECN[6]/RNAN[7] = cell animation data.

## Files

| File | Screen idx | Palette | Content | Confidence |
|------|-----------|---------|---------|-----------|
| `card_face_upper.png` | 2 | NCLR[1] | Upper portion of card — diagonal split, dark bg top-left + white card face top-right, faint star logo | HIGH — distinctive diagonal card design confirmed |
| `card_face_lower.png` | 3 | NCLR[1] | Full card face — white panel with Pokémon HG sun/star watermark, grey shadow edge | HIGH |
| `card_back.png` | 4 | NCLR[1] | Card reverse — black bg with white horizontal stripe (card edge) | HIGH |
| `card_face_upper_alt.png` | 2 | NCLR[8] | Upper card face, alternate palette (second color bank) | MEDIUM |
| `card_face_lower_alt.png` | 3 | NCLR[8] | Full card face, alternate palette | MEDIUM |

## Notes

- The Trainer Card is displayed full-screen on the top DS screen, animated with a tilt that reveals badge slots, portrait area, and stats
- RECN[6]/RNAN[7] contain the card-flip animation data (not extractable as static images)
- Player portrait (OAM sprite) and badge icons are overlaid on this background at runtime — they are stored separately
- The sun logo is the **HeartGold version watermark** (bottom-right of the card face)
