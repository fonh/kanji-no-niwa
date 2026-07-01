# characters/player_back/ — Player Back Sprites (Battle)

**Source NARC:** `/a/0/0/6` (85 files = 17 trainers × 5 files each)
**Extraction method:** RGCN[base] rendered as flat tile sheet with RLCN[base+1] (cols=8)

## Description

Back sprites for the player characters (Ethan and Lyra) as seen during battle — the view from behind the player looking toward the opponent. In HGSS, the player's sprite animates at the start of battle when throwing a Poké Ball.

Each trainer occupies 5 consecutive files: [RGCN large, RLCN, RECN, RNAN, RGCN small]. The large RGCN contains all animation frames as a flat tile sequence; the small RGCN (6448b) is a secondary sprite element (likely the Poké Ball or arm extension during throw).

## Files

| File | NARC base idx | Character | Content | Confidence |
|------|--------------|-----------|---------|-----------|
| `ethan_back_sheet.png` | 0 | Ethan (male protagonist) | Full tile sheet 64×800px (100 tiles × 8 frames) | HIGH — index 0 = player 1 |
| `lyra_back_sheet.png` | 5 | Lyra (female protagonist) | Full tile sheet 64×800px | HIGH — index 1 = player 2 |
| `trainer_03_back_sheet.png` | 15 | Unknown trainer | Full tile sheet 64×800px | LOW |

## Notes

- Sheets are rendered flat (cols=8) — the in-game sprite assembly uses NCER cells to reconstruct the correct character shape and animation frames
- The sprite is ~80×80 pixels; to extract a single clean frame, crop the tile sheet at the correct cell boundaries (NCER cell data is in file[base+2])
- 17 trainers in the NARC total (indices 0–16); most are blank (empty tile data) or not the protagonist pair
- Format: @4bpp, 16-color palette per bank
