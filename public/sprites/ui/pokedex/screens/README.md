# ui/pokedex/screens/ — Pokédex Menu Screen Chrome

**Source NARC:** `/a/1/1/0` (22 files)
**Extraction method:** NSCR tilemaps rendered with NCGR[1] (512 tiles @4bpp) and NCLR[0]

## Description

Full rendered screen layers for the Pokédex UI (bottom DS screen). The Pokédex has two main views: a list view (filtered species list) and a detail view (individual entry with sprite placeholder, type, size, and description tabs). A type-swatch helper screen provides the color palette for all Pokémon type labels.

File structure: NCLR[0] (224 colors), NCLR[5] (64 colors), NCGR[1] (512 tiles @4bpp) = main chrome; NCGR[6] (147 tiles), NCGR[11] (32 tiles), NCGR[14,17,19] = element tiles; RCSN[2] (256×256), RCSN[3] (128×128), RCSN[4] (256×256), RCSN[20] (512×256) = screen layers; RECN/RNAN = animation cells.

## Files

| File | Screen idx | Content | Confidence |
|------|-----------|---------|-----------|
| `dex_list_view.png` | 2 | Pokédex species list — white search bar top, pink/salmon list rows left (scroll list), 3 purple type-filter tab buttons right, cream detail rows right, blue confirm button bottom-right | HIGH — type-filter tabs distinctive |
| `dex_type_swatches.png` | 3 | 5-row color band swatch (128×128) — top to bottom: salmon/red, grey, yellow-gold, blue, cyan — these are the type-label background colors | HIGH |
| `dex_detail_view.png` | 4 | Pokémon entry detail — light blue bg, white rectangle (sprite display area) top-left, circular Pokéball navigation button below, dark blue panel right with 4 label+data rows (dotted rule) | HIGH — layout matches HGSS Pokédex entry screen |

## Notes

- `dex_list_view` is the bottom screen when browsing the Pokédex; species sprites and names are drawn on top at runtime
- `dex_detail_view` is the bottom screen when viewing an individual entry; the actual Pokémon sprite occupies the white rectangle via OAM overlay
- The 3 purple tabs in `dex_list_view` are the type filter selector (filter by type 1, type 2, or no filter)
- RCSN[20] (512×256) is a double-wide composite screen — not rendered here (requires multi-screen assembly)
- For the Pokédex species *sprite* thumbnails, see the parent `ui/pokedex/` folder (pokedex_NNN.png files extracted separately)
