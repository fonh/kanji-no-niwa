# sprites/items/pokeballs/ — Poké Ball Item Icons

**Source NARC:** `/a/0/1/8` (797 files)
**Extraction method:** Individual RGCN+RLCN pairs rendered as 24×24 icons @8bpp, scaled 4× to 96×96

## Description

Item icon sprites for Poké Ball variants, extracted from the item icon NARC. Each item in HGSS has a dedicated 24×24 pixel 8bpp icon used in the Bag, item lists, and UI overlays.

In the PRD, the standard Poké Ball icon is used for the **3-lives display** (3 Poké Balls in the top-right during combat). Master Ball, Great Ball, and Ultra Ball icons are included for completeness.

## NARC Structure

| File indices | Content |
|-------------|---------|
| [0] RNAN | Shared animation header |
| [1] RECN | Shared cell definition |
| [2+i×2] RGCN | Icon tile data for item i (0-indexed, item ID = i+1) |
| [3+i×2] RLCN | Palette for item i |

## Files

| File | Item ID | Item Name | Size | Confidence |
|------|--------|-----------|------|-----------|
| `master_ball.png` | 1 | Master Ball | 96×96 (4× scaled) | HIGH |
| `great_ball.png` | 3 | Great Ball | 96×96 (4× scaled) | HIGH |
| `ultra_ball.png` | 2 | Ultra Ball | 96×96 (4× scaled) | HIGH |
| `pokeball.png` | 4 | Poké Ball | 96×96 (4× scaled) | HIGH |
| `item_icons_sheet_60.png` | 1–60 | First 60 items | 240×144 (10×6 grid @24px) | HIGH |

## Notes

- Original icon size: 24×24 pixels — saved at 4× (96×96) for usability
- For the 3-lives display in combat, use `pokeball.png` (item ID 4)
- The full NARC contains icons for all ~650 items in HGSS — only Poké Ball variants extracted individually
- `item_icons_sheet_60.png` shows items 1–60 at native 24×24 resolution (first row = Poké Balls, TMs, Berries start around row 4)
