# UI Screens Index

Complete map of all extracted HGSS UI assets. Covers `public/sprites/ui/`, `public/sprites/characters/`, `public/sprites/items/`, and `public/audio/`.

## Round 2 Extractions (this session)

| Folder | Files | Source NARC | Content | README |
|--------|-------|------------|---------|--------|
| [ui/battle/transition/](battle/transition/README.md) | 9 PNG | `/a/1/0/9` | Battle wipe transition tile layers (256×256) — 9 RCSN tilemaps | ✓ |
| [ui/battle/vs_screen/](battle/vs_screen/README.md) | 13 PNG | `/a/1/0/9` | VS intro screen panels — trainer portrait backgrounds, 256×256 + 256×512 | ✓ |
| [../characters/player_back/](../characters/player_back/README.md) | 2 PNG | `/a/0/0/6` | Ethan + Lyra back sprites (flat tile sheets, 64×800px each) | ✓ |
| [../items/pokeballs/](../items/pokeballs/README.md) | 4 PNG + 1 sheet | `/a/0/1/8` | Poké Ball, Great Ball, Ultra Ball, Master Ball icons (24×24 → 96×96 4×) | ✓ |
| [../../audio/](../../audio/README.md) | 1 SDAT | ROM file 479 | `gs_sound_data.sdat` (8.3MB) — all BGM + SFX. See README for Nitro Studio 2 export. | ✓ |

**Not extractable (2D pipeline):**
- S.S. Aqua (`/a/2/3/8`) + Magnet Train (`/a/2/3/3`) → 3D model format (BMD0/BCA0), not 2D tiles
- Police HGSS → intégrée dans l'ARM9 binary, aucun NFTR standalone dans le ROM

## Round 1 Extractions (previous session)

## Fully Documented (this session)

| Folder | Files | Source NARC | Content | README |
|--------|-------|------------|---------|--------|
| [bag/](bag/README.md) | 12 PNG | `/a/1/6/2` | Bag menu pocket screens — items, medicine, Poké Balls, TM/HM; party status overlay | ✓ |
| [trainer_card/](trainer_card/README.md) | 5 PNG | `/a/1/0/4` | Trainer Card background — diagonal white card face with HG logo watermark, 2 palettes | ✓ |
| [pokedex/screens/](pokedex/screens/README.md) | 3 PNG | `/a/1/1/0` | Pokédex list view (pink rows + type filter tabs), detail entry view, type color swatches | ✓ |
| [map/johto/](map/johto/README.md) | 7 PNG | `/a/1/4/4` | Johto region map (512×512) — 6 Pokégear color theme variants | ✓ |
| [map/kanto/](map/kanto/README.md) | 7 PNG | `/a/1/4/4` | Kanto region map (256×280) — 6 Pokégear color theme variants | ✓ |
| [badges/badge_case_screen/](badges/badge_case_screen/README.md) | 7 PNG | `/a/0/4/9` | Badge case screen — orange bg, "BADGES" header, badge portrait grid | ✓ |
| [badges/badge_icons/](badges/badge_icons/README.md) | 16 PNG | `/a/0/4/9` | 16 individual badge sprite tile sheets — Johto (Zephyr→Rising) + Kanto (Boulder→Earth) @8bpp | ✓ |
| [story_backgrounds/](story_backgrounds/README.md) | 76 PNG | `/a/1/5/0` | 76 full-color 256×192 CG story/event backgrounds — cave, forest, theater, water, ice, ruins | ✓ |
| [sky/](sky/README.md) | 8 PNG | `/a/1/9/2` | Time-of-day sky — dawn, day, dusk, night + 4 variants | ✓ |
| [emotions/](emotions/README.md) | 11 PNG + .bin | `/a/1/0/3` | Emotion bubble sprites (fuki_*) + animation control tables | ✓ |
| [badges/](badges/README.md) | 14 PNG + .bin | `/a/1/0/3` | Field effects, grass/water animations; NOT the badge icons (see badge_icons/) | ✓ |

## Extracted (previous sessions, no README yet)

| Folder | Files | Likely source | Content |
|--------|-------|--------------|---------|
| [battle/](battle/) | 29 PNG | `/a/0/1/4` | Battle UI chrome — move selection panel, HP bars, battle bag, type indicators (6 color variants) |
| [dialogue/](dialogue/) | 26 PNG | `/a/1/0/0` | Dialog box frames — textbox borders in 6 color themes (wireless UI, standard dialog, list items, battle dialog) |
| [pokedex/](pokedex/) | 77 PNG | (unknown) | Individual Pokédex element tiles/sprites (pokedex_NNN.png — not full screens) |
| [pokegear/](pokegear/) | 126 PNG | (unknown) | Pokégear app graphics — music note animations, balloon effects, pokegear_000/001 screens |
| [map/](map/) | 32 PNG | (unknown) | Individual map tile graphics (map_NNN.png — raw tiles, not rendered screens) |
| [menus/](menus/) | 15 PNG | (unknown) | Menu screen layers (menu_002-004, options_004-019) |
| [items/](items/) | 6 PNG | (unknown) | Item icon graphics |
| [title/](title/) | 9 PNG | (unknown) | Title screen elements |
| [types/](types/) | 494 PNG | (unknown) | Pokémon type label graphics (all types, multiple sizes/colors) |
| [weather/](weather/) | 40 .bin | (unknown) | Weather system binary tables (NOT sky images — raw weather control data) |

## Not Found / Not Extracted

| Screen | Status | Notes |
|--------|--------|-------|
| Save screen | **Not extracted** — no dedicated NARC found | The HGSS save dialog is a standard system dialog box overlaid on the overworld; it uses the dialog chrome from `dialogue/` rather than its own dedicated tilemap. Not a separate extractable asset. |
| Pokémon summary / party screen | Partially in `bag/` | Party status overlay screens (bag_party_status_a/b) are in `bag/` NARC; the full dedicated party/summary screen may be in a separate NARC not yet audited |
| Pokéathlon facility | Partially audited | `/a/1/5/4` — running track background confirmed but not extracted; out of scope for current pass |
| Battle intro screens (vs. cut-in) | **Extracted (partial)** | Static tilemap layers in `battle/transition/` and `battle/vs_screen/`. Animated NCER cells (trainer face animations) not rendered — require NCER assembler. |
| S.S. Aqua + Magnet Train backgrounds | **Not extractable** | `/a/2/3/8` + `/a/2/3/3` = 3D model format (BMD0/BCA0) — cannot render as 2D PNG with our pipeline |
| Police HGSS | **Not extractable** | Font embedded in ARM9 binary — no standalone NFTR file in ROM. Use `Pokémon Classic` or `Press Start 2P` as substitute. |

## NARC Quick Reference

| NARC path | Content |
|-----------|---------|
| `/a/0/1/4` | Battle UI chrome (move selection, HP chrome) |
| `/a/0/4/9` | Badge case screen + 16 badge sprites |
| `/a/1/0/0` | Dialog chrome (6 color themes) |
| `/a/1/0/3` | Emotion bubbles + field effects |
| `/a/1/0/4` | Trainer Card background |
| `/a/1/1/0` | Pokédex screen chrome |
| `/a/1/4/4` | Pokégear Town Map (Johto + Kanto, 6 themes) |
| `/a/1/5/0` | Story/cutscene CG backgrounds (76 scenes) |
| `/a/1/6/2` | Bag menu + party status overlay |
| `/a/1/9/2` | Time-of-day sky backgrounds |
| `/a/1/0/9` | Battle transition + VS screen (tilemaps + animated cells) |
| `/a/0/0/6` | Player + trainer back sprites (trbgra.narc) |
| `/a/0/1/8` | Item icons 24×24 @8bpp (item_icon.narc, 797 files) |
| ROM file 479 | `data/sound/gs_sound_data.sdat` — all game audio |
