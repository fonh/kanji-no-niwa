# ui/emotions/ — Emotion Bubble Sprites & Data

**Source NARCs:** `/a/1/0/3` (PNG sprites) · `/a/1/3/3` (data tables)

## Emotion bubble sprites (fuki_*)

The `fuki_*.png` files are the actual in-game emotion bubbles displayed above overworld characters. Extracted from NARC `/a/1/0/3` and moved here from `ui/badges/` (where they were initially misfiled).

| File | Emotion |
|------|---------|
| `fuki_heart.png` | Love / heart |
| `fuki_heart_028.png` | Heart variant |
| `fuki_onpu.png` | Music note |
| `fuki_bikkuri.png` | Surprise (!) |
| `fuki_hatena.png` | Question (?) |
| `fuki_doku.png` | Poison / anger |
| `fuki_pikon.png` | Excited / idea |
| `fuki_chinmoku.png` | Silence / ellipsis |
| `fuki_komari.png` | Troubled / sweat |
| `fuki_ase.png` | Sweat drop |
| `fuki_kao1.png`–`fuki_kao5.png` | Face expression variants |

## Data tables (emotion_*.bin)

The `emotion_*.bin` files are from NARC `/a/1/3/3`. They are **not image data** — they contain small binary structs (8–2520 bytes) with no recognizable graphics magic (`RGCN`, `RLCN`, `RECN`, etc.).

These are animation/effect control tables: likely timing parameters, sequence indices, or spawn offsets used by the DS emotion system to trigger and position the `fuki_*` bubble sprites at runtime. They are not renderable as images.

### Format observations

| Magic pattern | Sizes seen | Likely content |
|---------------|-----------|----------------|
| `00000000` | 8–104 bytes | Index/offset table or empty entry |
| `00000101` | 2520 bytes | Largest file; possibly the main emotion sequence table |
| `05000000`, `06000000` | 8–16 bytes | Small parameter structs |
| `18000000`, `19000000` | 8 bytes | Tiny type/flag records |

To interpret these correctly, cross-reference with Project Pokémon's HGSS script documentation for the `EMOTION`/`FEELING` command opcodes.
