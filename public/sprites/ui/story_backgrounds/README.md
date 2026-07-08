# ui/story_backgrounds/ — Story & Cutscene Backgrounds

**Source NARC:** `/a/1/5/0` (228 files = 76 triplets)
**Extraction method:** Each triplet [NCLR, NCGR 768tiles@8bpp, NSCR 256×192] rendered as a complete 256×192 image

## Description

76 full-color CG background images (256×192 pixels each, 256 colors) used as backdrop art during story events, dialogue sequences, letters, and cutscenes. In-game, character sprites and text boxes are overlaid on top of these backgrounds.

These correspond to locations referenced in the PRD as used in: mentor letter events (Elm/Oak — see PRD § Mentors), Team Rocket hideout scenes, legendary Pokémon encounter areas, gym interiors, and story milestones.

**Format:** Raw 256×192 unique-tile images — each of the 768 tiles in the NCGR is unique (no tile reuse), making this essentially a direct 8bpp pixel image stored in DS tile format.

## Identified Scenes

| File range | Identified content |
|-----------|-------------------|
| `story_bg_000–009` | Dark stone cave tunnel (multiple animation frames / lighting variants of same scene — likely Dark Cave or Mt. Mortar entrance) |
| `story_bg_010` | Light stone corridor with carved-stone relief on left wall and bright exit glow — Ruins of Alph interior or Bell Tower |
| `story_bg_015` | Cave grotto with teal water pool, pink Pokémon silhouette, wooden ladder — Whirl Islands (Lugia encounter approach) |
| `story_bg_020` | Forest with dramatic circular glow in sky, shrine building below — Ilex Forest shrine or Sprout Tower exterior |
| `story_bg_030` | Japanese interior with sliding panel doors, twin bird-shadow motifs — Ecruteak Dance Theater or Tin Tower approach (Kimono Girls scene) |
| `story_bg_050` | Bright rocky cave interior with white creature visible — Whirl Islands inner chamber (Lugia/Ho-Oh?) |
| `story_bg_075` | Ice cave with crystalline/stalactite formations in purple-grey — Ice Path |

Remaining 69 scenes (not listed above) are unidentified — view the PNG files directly.

## All Files

`story_bg_000.png` through `story_bg_075.png` — 76 files total.

## Notes

- Scenes appear to follow story-event order (earlier story events = lower indices), but this has not been verified against the game script
- Some consecutive indices (e.g. 000-009) are animation frames of the same background (different lighting/camera angle), used for animated cutscene sequences
- Character dialogue boxes, Pokémon sprites, and NPC overworld sprites are all overlaid at runtime — they are not included in these backgrounds
