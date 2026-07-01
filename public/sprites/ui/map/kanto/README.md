# ui/map/kanto/ — Kanto Region Map (Pokégear)

**Source NARC:** `/a/1/4/4` (70 files)
**Extraction method:** NSCR[13] (256×280) rendered with NCGR[12] (576 tiles @4bpp) and palette variants NCLR[20-25]

## Description

The full Kanto region map as displayed in the Pokégear Map application. Uses the same HGSS stylized art style as the Johto map. Rendered at 256×280 (slightly taller than one DS screen to allow minor vertical scrolling). Uses 4bpp tile encoding (vs. 8bpp for Johto), with palette bank selection per tile entry.

Available in 6 color theme variants matching the Pokégear wallpaper color setting.

## Files

| File | Palette idx | Theme | Content | Confidence |
|------|------------|-------|---------|-----------|
| `kanto_map_theme01.png` | 20 | Theme 1 (default) | Kanto map — city blocks in pink/red, routes, building icons | HIGH |
| `kanto_map_theme02.png` | 21 | Theme 2 | Kanto map color variant 2 | HIGH |
| `kanto_map_theme03.png` | 22 | Theme 3 | Kanto map color variant 3 | HIGH |
| `kanto_map_theme04.png` | 23 | Theme 4 | Kanto map color variant 4 | HIGH |
| `kanto_map_theme05.png` | 24 | Theme 5 | Kanto map color variant 5 | HIGH |
| `kanto_map_theme06.png` | 25 | Theme 6 | Kanto map color variant 6 | HIGH |
| `kanto_map_pal0.png` | 0 | NARC default | Kanto map with NARC-default palette | MEDIUM |

## Notes

- Kanto map is 256×280 — 8 rows taller than one DS screen (256×192); minor vertical scroll used in-game
- Uses 4bpp tiles (unlike Johto's 8bpp) — palette bank field in NSCR entries selects 16-color bank per tile
- Town location cursor and route labels are OAM sprites at runtime (not included)
- Johto region map → see `../johto/`
