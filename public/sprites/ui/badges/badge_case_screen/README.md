# ui/badges/badge_case_screen/ — Badge Case Screen

**Source NARC:** `/a/0/4/9` (78 files)
**Extraction method:** NSCR tilemaps rendered with NCGR[43] (1024 tiles @4bpp) and NCLR[0]

## Description

Full rendered screen layer for the Trainer Card badge case overlay and related status screens. The main badge case screen (`badge_case.png`) shows the "BADGES" header on an orange background with a grid displaying earned gym badge portraits (or empty circles for unearned slots).

Additional screens from this NARC show related UI states (empty layouts, alternate configurations).

## Files

| File | Screen idx | Content | Confidence |
|------|-----------|---------|-----------|
| `badge_case.png` | 51 (256×192) | Badge case overview — orange bg, "BADGES" text top-left, 2-row badge grid with gym badge portraits/icons | HIGH — "BADGES" label confirmed visually |
| `badge_screen_47.png` | 47 (256×256) | Badge case overlay variant A | MEDIUM |
| `badge_screen_48.png` | 48 (256×256) | Badge case overlay variant B | MEDIUM |
| `badge_screen_49.png` | 49 (256×256) | Badge case overlay variant C | MEDIUM |
| `badge_screen_50.png` | 50 (256×256) | Badge case overlay variant D | MEDIUM |
| `badge_screen_54.png` | 54 (256×256) | Badge case overlay variant E | MEDIUM |
| `badge_screen_55.png` | 55 (256×256) | Badge case overlay variant F | MEDIUM |

## Notes

- `badge_case.png` is the bottom screen displayed when viewing badge summary from the Trainer Card
- The badge portrait icons visible in `badge_case.png` are built into the tilemap — individual badge sprites are stored separately in `../badge_icons/`
- NCLR[0-40] = 41 palette files (badge-specific palettes for the 16 badge sprites + UI palettes); NCLR[60] = additional UI palette
- NCGR[46] = 3072 tiles @4bpp (very large — likely contains all badge portrait tiles used in `badge_case.png`)
