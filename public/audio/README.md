# audio/ — HGSS Game Audio

**Source:** ROM file `data/sound/gs_sound_data.sdat` (ROM file index 479, 8.3MB)
**Raw file:** `gs_sound_data.sdat` (saved here, ready to process)

## Description

The SDAT (Sound Data Archive) contains all in-game audio for Pokémon HeartGold — BGM sequences, sound effects, and Pokémon cries. It uses the standard NDS audio format: SSEQ (sequenced MIDI-like music), SBNK (instrument banks), SWAR (wave archives of PCM samples).

A second SDAT at `pbr/sound_data.sdat` (ROM file 507, 7.1MB) contains additional sound data (likely Pokéwalker-related).

## BGM Track Contexts (PRD mapping)

| Context | Track name (HGSS) |
|---------|-----------------|
| Carte — zones initiales | New Bark Town |
| Carte — zones intermédiaires | Route 29 |
| Carte — zones avancées | Route Victoire |
| Session SRS (Centre Pokémon) | Pokémon Center |
| Combat dresseur / 門弟 | VS Trainer |
| Combat 師範 | VS Gym Leader |
| Cérémonie badge | Fanfare victoire |
| Combat Silver | VS Rival |
| Combat Rocket | Team Rocket |
| Combat Kimono Girl | Ecruteak City (slowed) |
| Combat légendaire de grammaire | VS Legendary |
| Combat Elite Four | VS Elite Four |
| Combat Lance | VS Champion |
| Combat Red | (Silence) |
| Lecture de textes | Ecruteak City |
| Achievement débloqué | Jingle court |

## How to Export (OGG/WAV)

1. Download **Nitro Studio 2** (gota7): https://github.com/Gota7/NitroStudio2/releases
2. Open `gs_sound_data.sdat` in Nitro Studio 2
3. In the SSEQ list, locate tracks by name (New Bark Town, Route 29, VS Trainer, etc.)
4. Export individual tracks: right-click → Export as WAV (renders using internal soundfont)
5. Convert WAV → OGG for web use: `ffmpeg -i input.wav -c:a libvorbis -q:a 6 output.ogg`

Alternatively, use **VGMTrans** to batch export all tracks as MIDI + SF2.

## Folders

| Folder | Content |
|--------|---------|
| `bgm/` | Exported BGM tracks (OGG) — fill after export |
| `sfx/` | Exported SFX (OGG) — menu navigation, battle events, fanfares |

## Notes

- SDAT does NOT contain streamed audio (no `.strm`) — all music is sequenced (SSEQ), so it plays back with the NDS soundfont
- Pokémon cries are in the SWAR wave archives (WAVE_ARC_PVxxx.swar) — one file per Pokémon
- `bgm/` and `sfx/` are currently empty — populate after export with Nitro Studio 2
- The police HGSS (police DS pixel) is embedded in the ARM9 binary of the ROM, not in a standalone file — cannot be extracted with our pipeline
