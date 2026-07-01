# ui/map/johto/ — Johto Region Map (Pokégear)

**Source NARC:** `/a/1/4/4` (70 files)
**Extraction method:** NSCR[11] (512×512) rendered with NCGR[10] (768 tiles @8bpp) and palette variants NCLR[14-19]

## Description

The full Johto region map as displayed in the Pokégear Map application (top DS screen). The map uses the HGSS stylized art style: pink/salmon land areas, blue water routes, grey mountains, and small building icons for towns. Available in 6 color theme variants corresponding to the **Pokégear wallpaper color** option in game settings.

All 6 themes use the same 768-tile NCGR at 8bpp; only the NCLR palette changes per theme, remapping the full 256-color palette. The map is 512×512 pixels, larger than a single DS screen — it scrolls based on player position in-game.

## Files

| File | Palette idx | Theme color | Content | Confidence |
|------|------------|------------|---------|-----------|
| `johto_map_theme01.png` | 14 | Theme 1 (default) | Johto map — pink terrain, blue routes, grey mountains, town icons | HIGH |
| `johto_map_theme02.png` | 15 | Theme 2 | Johto map color variant 2 | HIGH |
| `johto_map_theme03.png` | 16 | Theme 3 | Johto map color variant 3 | HIGH |
| `johto_map_theme04.png` | 17 | Theme 4 | Johto map color variant 4 | HIGH |
| `johto_map_theme05.png` | 18 | Theme 5 | Johto map color variant 5 | HIGH |
| `johto_map_theme06.png` | 19 | Theme 6 | Johto map color variant 6 | HIGH |
| `johto_map_pal0.png` | 0 | NARC default palette | Johto map with NARC-default palette (may differ from in-game display) | MEDIUM |

## Notes

- The 6 color themes are set by the player in the Pokégear settings (color option); the game engine swaps NCLR at runtime
- Map renders at 512×512 — in-game the visible window is 256×192 (one DS screen), scrolled based on player/cursor position
- Town location cursor, player position arrow, and route labels are OAM sprites overlaid at runtime (not included here)
- Kanto region map → see `../kanto/`
