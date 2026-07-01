# Pokemon HeartGold/SoulSilver — Non-Pokemon Sprite Extraction

- **Extraction date:** 2026-06-30
- **Source ROM:** `Pokemon - Version Or HeartGold (France).nds`
- **Total images extracted:** 1945
- **Tool:** `extract_hgss_sprites.py` (ndspy + Pillow)

## Per-category counts

| Category | Images |
|----------|-------:|
| trainers_battle | 258 |
| trainers_overworld | 832 |
| badges | 29 |
| items | 6 |
| battle_ui_hp | 4 |
| battle_ui_menu | 23 |
| battle_ui_bag | 2 |
| menus_bag | 4 |
| menus_options | 11 |
| pokedex | 77 |
| dialogue | 26 |
| types | 494 |
| map | 32 |
| pokegear_206 | 0 |
| pokegear_207 | 126 |
| pokegear_208 | 9 |
| pokegear_209 | 0 |
| mugshots | 0 |
| title | 9 |
| characters | 3 |
| emotions | 0 |
| weather | 0 |

## Folder guide

| Folder | Contents | Examples |
|--------|----------|----------|
| `trainers/battle/` | Trainer/leader battle sprites, 80x80 (NARC /a/0/5/8) | trainer_000.png, trainer_000_b.png, _contact_sheet.png |
| `trainers/overworld/` | Overworld character sprites (NARC /a/0/8/1). 3D models; each model's frames are combined into ONE spritesheet named by the game's label. | babyboy1.png, hero.png, heroine.png |
| `trainers/mugshots/` | NARC /a/1/2/5 — single non-graphic blob in this ROM | (none / *.bin) |
| `characters/` | Player battle-back sprites (NARC /a/0/4/5) | char_000.png |
| `ui/badges/` | Field effect & animation data (NARC /a/1/0/3, BTP0/BCA0 formats) + rendered field effect PNGs (grass, smoke, splash). Emotion bubble sprites moved to `ui/emotions/`. Actual gym badge icons not yet located. | e_kusaeff2.png, monstarball.png |
| `ui/items/` | NOTE: NARC /a/1/6/8 holds bag/battle BACKGROUND art, not item icons. | item_004.png |
| `ui/battle/` | Battle UI: HP bars & in-battle menus (NARC /a/2/5/0, /a/0/7/1, /a/0/7/7) | hpbar_*.png, battlemenu_*.png |
| `ui/menus/` | Bag & options menu screens (NARC /a/1/0/4, /a/0/7/2) | menu_*.png, options_*.png |
| `ui/dialogue/` | Text-box / dialogue frame graphics (NARC /a/0/3/8) | textbox_*.png |
| `ui/types/` | NOTE: NARC /a/0/6/9 is the Pokemon FOOTPRINT set (~494 glyphs), not type icons. | type_000.png |
| `ui/map/` | Town-map / location splash screens (NARC /a/1/4/6) | map_*.png |
| `ui/pokegear/` | Pokegear graphics: radio/map/phone skins (NARC /a/2/0/6..9) | pokegear_*.png |
| `ui/pokedex/` | Pokedex UI screens (NARC /a/0/6/8) | pokedex_*.png |
| `ui/title/` | Title screen / intro graphics (NARC /a/0/4/6) | title_*.png |
| `ui/emotions/` | Emotion bubble sprites (fuki_*.png, 15 files) from NARC /a/1/0/3. Also holds animation control tables (emotion_*.bin) from NARC /a/1/3/3 — not renderable, these are parameter structs. | fuki_heart.png, fuki_bikkuri.png |
| `ui/weather/` | NOTE: NARC /a/0/3/3 is a data table, not graphics. Empty here. | (none) |

## Notes

- **trainers_battle:** Trainer order in NARC /a/0/5/8 does NOT match the requested name list (index 000 = male player, 001 = female player, ...). Files are numbered by NARC index; use _contact_sheet.png to assign the human names. '_b' = secondary pose/palette.
- **badges:** NARC /a/1/0/3 contains field effects & emotion bubbles, not gym badges. Gym badges in HGSS are 3D models stored elsewhere.
- **items:** NARC /a/1/6/8 contains background/scene art, not item icons.
- **types:** NARC /a/0/6/9 contains ~494 Pokemon footprint glyphs, not the 17 type icons.
- **emotions:** NARC /a/1/3/3 is non-graphic data (animation control tables). The actual emotion bubble sprites (fuki_*.png, from /a/1/0/3) are in `ui/emotions/`.
- **weather:** NARC /a/0/3/3 is non-graphic data; no weather sprites here.
- **pokegear_209:** NARC /a/2/0/9 is non-graphic data (4954 small records).
- **mugshots:** NARC /a/1/2/5 holds a single non-graphic blob in this ROM.

## Naming convention

- 2D sprites are named `<prefix>_<NARC-index>.png` (e.g. `trainer_004.png`). The NARC index keeps files stable and traceable back to the ROM.
- `_b` suffix marks a secondary graphic in the same group (e.g. a trainer's second pose/palette).
- 3D model textures (BTX0) are named `<prefix>_<file>_<tex#>_<internal-texture-name>.png`, preserving the label the game uses internally.
- Several categories the brief assumed were 2D sprites are actually 3D model data or non-graphic data tables in this ROM; where a verified human-name mapping was not possible, files are numbered rather than guessed at (wrong names are worse than honest numbers).

## Unrecognised files (.bin)

These sub-files were not a known graphic format and were written out as raw bytes — they can be inspected manually (e.g. with a tile viewer such as Tinke):

- `ow_280_10000000.bin` (trainers_overworld) — unrecognised format
- `ow_281_20000000.bin` (trainers_overworld) — unrecognised format
- `ow_282_18000000.bin` (trainers_overworld) — unrecognised format
- `ow_283_04000000.bin` (trainers_overworld) — unrecognised format
- `ow_284_07000000.bin` (trainers_overworld) — unrecognised format
- `ow_285_04000000.bin` (trainers_overworld) — unrecognised format
- `ow_286_10000000.bin` (trainers_overworld) — unrecognised format
- `ow_287_08000000.bin` (trainers_overworld) — unrecognised format
- `ow_288_11000000.bin` (trainers_overworld) — unrecognised format
- `ow_289_0c000000.bin` (trainers_overworld) — unrecognised format
- `ow_290_02000000.bin` (trainers_overworld) — unrecognised format
- `ow_291_0c000000.bin` (trainers_overworld) — unrecognised format
- `ow_292_09000000.bin` (trainers_overworld) — unrecognised format
- `ow_293_08000000.bin` (trainers_overworld) — unrecognised format
- `ow_294_10000000.bin` (trainers_overworld) — unrecognised format
- `ow_295_0d000000.bin` (trainers_overworld) — unrecognised format
- `ow_296_0d000000.bin` (trainers_overworld) — unrecognised format
- `badge_134_42545030.bin` (badges) — unrecognised format
- `badge_135_42545030.bin` (badges) — unrecognised format
- `badge_136_42545030.bin` (badges) — unrecognised format
- `badge_137_42545030.bin` (badges) — unrecognised format
- `badge_138_42545030.bin` (badges) — unrecognised format
- `badge_139_42545030.bin` (badges) — unrecognised format
- `badge_140_04000000.bin` (badges) — unrecognised format
- `badge_141_0b000000.bin` (badges) — unrecognised format
- `badge_142_09000000.bin` (badges) — unrecognised format
- `badge_143_0d000000.bin` (badges) — unrecognised format
- `badge_144_03000000.bin` (badges) — unrecognised format
- `badge_145_04000000.bin` (badges) — unrecognised format
- `badge_146_07000000.bin` (badges) — unrecognised format
- `badge_147_02000000.bin` (badges) — unrecognised format
- `badge_148_04000000.bin` (badges) — unrecognised format
- `badge_149_02000000.bin` (badges) — unrecognised format
- `badge_150_04000000.bin` (badges) — unrecognised format
- `badge_151_04000000.bin` (badges) — unrecognised format
- `badge_152_04000000.bin` (badges) — unrecognised format
- `badge_153_04000000.bin` (badges) — unrecognised format
- `badge_154_04000000.bin` (badges) — unrecognised format
- `badge_155_04000000.bin` (badges) — unrecognised format
- `badge_156_04000000.bin` (badges) — unrecognised format
- `badge_157_04000000.bin` (badges) — unrecognised format
- `badge_158_04000000.bin` (badges) — unrecognised format
- `badge_159_04000000.bin` (badges) — unrecognised format
- `badge_160_04000000.bin` (badges) — unrecognised format
- `badge_161_04000000.bin` (badges) — unrecognised format
- `badge_162_04000000.bin` (badges) — unrecognised format
- `badge_163_04000000.bin` (badges) — unrecognised format
- `badge_164_42544130.bin` (badges) — unrecognised format
- `badge_165_42434130.bin` (badges) — unrecognised format
- `badge_166_42434130.bin` (badges) — unrecognised format
- `badge_167_424d4130.bin` (badges) — unrecognised format
- `badge_168_424d4130.bin` (badges) — unrecognised format
- `pokegear_000_20415053.bin` (pokegear_206) — unrecognised format
- `pokegear_001_20415053.bin` (pokegear_206) — unrecognised format
- `pokegear_183_42434130.bin` (pokegear_207) — unrecognised format
- `pokegear_184_42434130.bin` (pokegear_207) — unrecognised format
- `pokegear_185_424d4130.bin` (pokegear_207) — unrecognised format
- `pokegear_186_42434130.bin` (pokegear_207) — unrecognised format
- `pokegear_187_42545030.bin` (pokegear_207) — unrecognised format
- `pokegear_188_42545030.bin` (pokegear_207) — unrecognised format
- … and 148 more.

## Failures

- **title** — title file#33 NSCR: list index out of range

## Credit

Sprites from **Pokemon HeartGold / SoulSilver** © Nintendo / Game Freak / Creatures Inc. Extracted for personal/educational use.
