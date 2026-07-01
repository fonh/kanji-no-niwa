# ui/battle/transition/ — Battle Transition Layer Graphics

**Source NARC:** `/a/1/0/9` (242 files)
**Extraction method:** RCSN tilemaps rendered with matching RGCN + RLCN (indices 19–46)

## Description

Static tile layers used during the HGSS battle transition effect. In-game, the diagonal wipe from overworld to battle is produced by combining these 256×256 tile layers with hardware color-math effects and DMA scrolling. These renders show the individual graphic layers — the diagonal pattern tiles, color fills, and overlay masks.

The transition NARC contains 23 renderable RCSN tilemaps total. Files [18–46] cover the wipe layers (saved here). Files [162–221] cover VS screen elements (saved in `../vs_screen/`).

## Files

| File | RCSN idx | Content | Confidence |
|------|---------|---------|-----------|
| `transition_00_rcsn22.png` | 22 (256×256) | Transition wipe layer | MEDIUM |
| `transition_01_rcsn25.png` | 25 (256×256) | Transition wipe layer | MEDIUM |
| `transition_02_rcsn28.png` | 28 (256×256) | Transition wipe layer | MEDIUM |
| `transition_03_rcsn31.png` | 31 (256×256) | Transition wipe layer | MEDIUM |
| `transition_04_rcsn34.png` | 34 (256×256) | Transition wipe layer | MEDIUM |
| `transition_05_rcsn37.png` | 37 (256×256) | Transition wipe layer | MEDIUM |
| `transition_06_rcsn40.png` | 40 (256×256) | Transition wipe layer | MEDIUM |
| `transition_07_rcsn43.png` | 43 (256×256) | Transition wipe layer | MEDIUM |
| `transition_08_rcsn46.png` | 46 (256×256) | Transition wipe layer | MEDIUM |

## Notes

- The actual diagonal wipe visual effect is produced at runtime by the DS GPU compositing these layers with color-math and HDMA (horizontal DMA scrolling)
- 62 RGCN files + 65 RLCN files + RECN/RNAN animation cells also exist in this NARC — those control the VS trainer sprite animations (not rendered, require NCER assembler)
- RCSN[19] (palette RLCN[17] → 256-color palette with complex bit layout) failed to render — likely requires alternate palette decoding
