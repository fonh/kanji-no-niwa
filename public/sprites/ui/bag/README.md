# ui/bag/ — Bag Menu Screen Chrome

**Source NARC:** `/a/1/6/2` (79 files)
**Extraction method:** NSCR tilemap rendered with NCGR[1] (512 tiles @4bpp) and NCLR[0]

## Description

Contains all screen layers for the Bag menu (bottom DS screen). The bag displays 6 item pockets selectable via tab icons. Each pocket has its own color scheme rendered as a separate NSCR screen; a single shared tile set provides the chrome elements (borders, button shapes, list rows).

File structure: NCLR[0,3,24,49-65] — multiple palette files (6 color theme variants + alternates); NCGR[1] = 512 primary tiles; NCGR[2,8,16,20,23] = secondary element tiles; NSCR[9-14,17-19,21,77,78] = screen layers.

## Files

| File | Screen idx | Content | Confidence |
|------|-----------|---------|-----------|
| `bag_pocket_items.png` | 9 | Main bag overview — orange bg, 3×2 circle pocket selector, 4-row item list, 3 pocket tab icons at bottom | HIGH — visually confirmed |
| `bag_list_orange.png` | 10 | Orange-tinted alternating item list rows with header bar | HIGH |
| `bag_list_grey.png` | 11 | Grey pocket overlay — left panel with grey squares, 4 move-button slots right | MEDIUM |
| `bag_party_status_a.png` | 12 | Pokémon party status — HP bars (grey gradient), "EXP" label, 4 move slots right | HIGH — "EXP" label visible |
| `bag_list_blue.png` | 13 | Cyan/teal alternating item list rows | HIGH |
| `bag_list_blue_b.png` | 14 | Cyan list variant (slightly different divider styling) | HIGH |
| `bag_pocket_medicine.png` | 17 | Medicine pocket — red/pink bg, medicine row icons, potion-bottle tab selected at bottom | HIGH — visually confirmed |
| `bag_pocket_pokeballs.png` | 18 | Poké Balls pocket screen layer | MEDIUM — position in sequence |
| `bag_pocket_tmhm.png` | 19 | TM/HM pocket screen layer | MEDIUM — position in sequence |
| `bag_party_status_b.png` | 77 | Pokémon status screen variant B (fewer tab icons) | HIGH |
| `bag_list_d.png` | 78 | Item list variant D | MEDIUM |
| `bag_combined_512x512.png` | 21 | Full 512×512 combined double-screen bag layout | HIGH |

## Notes

- Rendered with **palette variant 1** (NCLR[0]) = default window color theme (red/orange)
- NCLR[49-65] contain 6 additional color theme palettes (corresponding to HGSS window color setting options); re-render with those indices for alternate color schemes
- `bag_party_status_a/b` screens are from the **Bag's party-member selection overlay** (used when using an item on a Pokémon), not the main party screen
