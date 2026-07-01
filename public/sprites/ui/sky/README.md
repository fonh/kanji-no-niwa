# ui/sky/ — Time-of-Day Sky Backgrounds

**Source NARC:** `/a/1/9/2` (57 files)
**Extraction method:** NSCR tilemaps rendered with NCGR[4] (primary tile set) and NCLR[5]

## Description

Sky background images used for the top DS screen during overworld gameplay, varying with the in-game time of day. The HGSS clock system cycles through dawn → day → dusk → night, with the sky background updating smoothly. Additional variant screens cover transitional states or alternate time windows.

## Files

| File | NSCR idx | Time of day | Content | Confidence |
|------|---------|------------|---------|-----------|
| `sky_dawn.png` | 6 | Dawn (~5–7 AM) | Pink/lavender sky, large rising sun partially behind horizon, cream clouds | HIGH |
| `sky_day.png` | 7 | Day (~7 AM–5 PM) | Blue sky, yellow-orange sun with diamond point rays, 2 white cumulus clouds | HIGH |
| `sky_dusk.png` | 8 | Dusk (~5–7 PM) | Orange-pink-purple gradient sky, large setting sun at horizon | HIGH |
| `sky_night.png` | 9 | Night (~7 PM–5 AM) | Blue-grey sky, crescent moon, scattered stars in yellow/white/pink | HIGH |
| `sky_variant_04.png` | 10 | Variant (cloudy?) | Sky variant 4 | LOW |
| `sky_variant_05.png` | 12 | Variant | Sky variant 5 | LOW |
| `sky_variant_06.png` | 16 | Variant | Sky variant 6 | LOW |
| `sky_variant_07.png` | 17 | Variant | Sky variant 7 | LOW |

## Notes

- Dawn, Day, Dusk, Night are the 4 primary confirmed cycles (visually verified)
- Additional NSCR indices [10, 12, 16-19] exist in the NARC — some may be weather variants (rain sky, snow sky) or indoor/cave blank screens
- NCGR[11,21,24,27] are additional tile sets; NCLR[13-15,20] are additional palette sets — may enable more accurate variants if cross-referenced
- Sky backgrounds are displayed on the **top** DS screen; the bottom screen shows the overworld map or menu
