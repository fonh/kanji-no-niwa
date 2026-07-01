# ui/badges/ — Field Effect & Animation Data

**Source NARC:** `/a/1/0/3`  
**Status:** Misclassified — this NARC is NOT the badge case sprites.

## Contents

This folder holds raw binary files from NARC `/a/1/0/3`. Despite the folder name, this NARC contains field-effect and emotion-animation data, not gym badge icons.

### Binary files (not renderable as 2D sprites)

| Magic bytes | Format | Count | Description |
|-------------|--------|-------|-------------|
| `BTP0` (`42545030`) | Palette animation | 6 | Frame-by-frame palette cycling (used for animated effects) |
| `BTA0` (`42544130`) | Texture animation | 1 | 3D texture animation |
| `BCA0` (`42434130`) | Bone-cell animation | 2 | 3D sprite animation |
| `BMA0` (`424d4130`) | Material animation | 2 | 3D material animation |
| `0x04`–`0x0D`… | Raw data structs | ~25 | Effect parameter tables (timing, offsets, counts) |

These are 3D animation formats used by the DS's NitroSystem engine. They cannot be decoded with the 2D NCGR/NCLR pipeline.

### PNG files (grass/water/battle effects)

The non-`fuki_*` PNGs extracted here are rendered field effects:

| File | Description |
|------|-------------|
| `e_kusaeff1/2/3.png` | Grass rustle effect frames |
| `kusaeff.png` | Grass effect composite |
| `lgrass_ani1.png` | Long grass animation |
| `ngrass_ani1.png` | Normal grass animation |
| `hero_kemu.png` | Player smoke/exhaust effect |
| `nin_kemu.png` | NPC smoke/exhaust effect |
| `monstarball.png` | Poké Ball throw/catch effect |
| `red_waku.png` | Red highlight frame |
| `saisen_ef.png` | Battle re-engagement effect |
| `seed_kira.png` | Seed/sparkle effect |
| `shibuki.png` | Splash/spray effect |
| `sisen_ef.png` | Line-of-sight effect |

Emotion bubble sprites (`fuki_*.png`) were moved to `ui/emotions/`.

## Actual gym badge sprites

The 16 gym badge icons (Zephyr, Hive, Plain, Fog, Storm, Mineral, Glacier, Rising + 8 Kanto) have **not yet been located** in this ROM. Likely candidates are UI NARCs not yet visually sampled. The HGSS badge case uses 3D badge models; the 2D icon versions (used in the badge summary screen) may be in a different archive.
