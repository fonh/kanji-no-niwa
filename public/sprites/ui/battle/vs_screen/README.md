# ui/battle/vs_screen/ — VS Battle Intro Screen Elements

**Source NARC:** `/a/1/0/9` (242 files)
**Extraction method:** RCSN tilemaps rendered with matching RGCN + RLCN (indices 162–221)

## Description

Graphic layers used for the VS battle intro screen — the "VS" logo display and trainer portrait panels that appear just before a trainer battle begins in HGSS. The intro sequence shows the player's sprite on the left and the opposing trainer on the right with a "VS" graphic between them.

These are the static tile backgrounds and overlay panels. The actual trainer sprites within the VS screen are animated via NCER cells (not rendered here).

## Files

| File | RCSN idx | Content | Confidence |
|------|---------|---------|-----------|
| `vs_00_rcsn162.png` | 162 (256×512) | VS screen panel A (tall) | MEDIUM |
| `vs_01_rcsn165.png` | 165 (256×512) | VS screen panel B (tall) | MEDIUM |
| `vs_02_rcsn168.png` | 168 (256×256) | VS screen overlay | MEDIUM |
| `vs_03_rcsn191.png` | 191 (256×256) | VS screen component | MEDIUM |
| `vs_04_rcsn194.png` | 194 (256×256) | VS screen component | MEDIUM |
| `vs_05_rcsn197.png` | 197 (256×256) | VS screen component | MEDIUM |
| `vs_06_rcsn200.png` | 200 (256×256) | VS screen component | MEDIUM |
| `vs_07_rcsn203.png` | 203 (256×256) | VS screen component | MEDIUM |
| `vs_08_rcsn217.png` | 217 (256×256) | VS screen variant | MEDIUM |
| `vs_09_rcsn218.png` | 218 (256×256) | VS screen variant | MEDIUM |
| `vs_10_rcsn219.png` | 219 (256×256) | VS screen variant | MEDIUM |
| `vs_11_rcsn220.png` | 220 (256×256) | VS screen variant | MEDIUM |
| `vs_12_rcsn221.png` | 221 (256×256) | VS screen variant | MEDIUM |

## Notes

- RCSN[162] and RCSN[165] are 256×512 (double height) — likely the full-height trainer portrait panels
- RCSN[217–221] all share RGCN[216] + RLCN[215] but have different tilemaps — likely color theme variants (one per window color setting)
- Trainer face animations (NCER/RNAN) exist in this NARC but are not rendered — require NCER assembler
