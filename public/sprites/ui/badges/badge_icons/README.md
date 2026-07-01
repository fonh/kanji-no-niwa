# ui/badges/badge_icons/ — Individual Gym Badge Sprites

**Source NARC:** `/a/0/4/9` files 62–77 (16 RGCN tile sets)
**Extraction method:** Each NCGR rendered as a flat tile sheet (11 tiles wide × 10 rows) using matching NCLR[0–15]

## Description

16 individual gym badge sprite tile sheets — one per badge, covering all 8 Johto badges and all 8 Kanto badges in badge-acquisition order. Each tile sheet is 88×80 pixels (11×10 tiles @8bpp) and contains multiple animation frames of the badge rotating, as displayed in the Trainer Card badge case.

**Format:** @8bpp (256 colors per badge, full NCLR palette), rendered flat without NSCR tilemap — the raw tile sequence is the animation frame strip.

## Files

| File | NCGR idx | Badge | Gym Leader | City | Confidence |
|------|---------|-------|-----------|------|-----------|
| `zephyr_badge.png` | 62 | Zephyr Badge | Falkner | Violet City | MEDIUM — order assumed Johto acquisition sequence |
| `hive_badge.png` | 63 | Hive Badge | Bugsy | Azalea Town | MEDIUM |
| `plain_badge.png` | 64 | Plain Badge | Whitney | Goldenrod City | MEDIUM |
| `fog_badge.png` | 65 | Fog Badge | Morty | Ecruteak City | MEDIUM |
| `storm_badge.png` | 66 | Storm Badge | Chuck | Cianwood City | MEDIUM |
| `mineral_badge.png` | 67 | Mineral Badge | Jasmine | Olivine City | MEDIUM |
| `glacier_badge.png` | 68 | Glacier Badge | Pryce | Mahogany Town | MEDIUM |
| `rising_badge.png` | 69 | Rising Badge | Clair | Blackthorn City | MEDIUM |
| `boulder_badge.png` | 70 | Boulder Badge | Brock | Pewter City | MEDIUM |
| `cascade_badge.png` | 71 | Cascade Badge | Misty | Cerulean City | MEDIUM |
| `thunder_badge.png` | 72 | Thunder Badge | Lt. Surge | Vermilion City | MEDIUM |
| `rainbow_badge.png` | 73 | Rainbow Badge | Erika | Celadon City | MEDIUM |
| `soul_badge.png` | 74 | Soul Badge | Janine | Fuchsia City | MEDIUM |
| `marsh_badge.png` | 75 | Marsh Badge | Sabrina | Saffron City | MEDIUM |
| `volcano_badge.png` | 76 | Volcano Badge | Blaine | Cinnabar/Sea Foam | MEDIUM |
| `earth_badge.png` | 77 | Earth Badge | Blue | Viridian City | MEDIUM |

## Notes

- **Ordering confidence is MEDIUM**: The file→badge name mapping assumes NCGR files 62-77 follow badge acquisition order (Johto badges 1-8 then Kanto badges 1-8). Visually, file 62 shows a golden winged shape consistent with the Zephyr Badge. The other 15 have not been individually verified against in-game appearance.
- Each tile sheet represents one badge's full **rotation animation** (multiple frames), not a single static icon
- To extract a single clean badge frame, crop the first 32×32 or 40×40 pixel region of each tile sheet (top-left frame is typically the front-facing pose)
- Rendered with `palette[i]` matching `badge_ncgr[62+i]` — each badge has its own dedicated palette in the NARC
