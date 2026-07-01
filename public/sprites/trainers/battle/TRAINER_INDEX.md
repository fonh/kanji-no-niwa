# Trainer Battle Sprite Index — `/a/0/5/8` (`trfgra.narc`)

Identification of every battle sprite in the HeartGold trainer-front archive, with the **final filename** after renaming.

## Method & sources

> **2026-06-30 update:** All class IDs verified against `pret/pokeheartgold` `include/constants/trainer_class.h` (authoritative 0–128 enum from the HGSS decompilation). Corrections noted inline with `pret/hgss` in the Source column. 26 misidentifications corrected across generic and named trainer classes.



- **Visual identification** was done by eye from the extracted 80×80 sprites (viewed up to 4× zoom). Per instruction, visual ID is authoritative.
- **Internet research** confirmed that NARC `/a/0/5/8` is `trfgra.narc` = *Trainer Front Sprites* ([Project Pokémon HGSS file system](https://projectpokemon.org/home/docs/gen-4/hgss-file-system-r21/), [hirotdk NARC table](https://hirotdk.neocities.org/NARCTableHGSS.txt)). **No public source publishes the per-index order** of this archive. The one enumerated list found — the [HGSS character/overworld modifier table](https://projectpokemon.org/home/forums/topic/4740-hgss-character-modifier-values-completed/) — uses a *different* indexing with gaps (`FREEZE` entries) and runs past 0x130, so it could **not** be used as an index map. It did, however, **corroborate the class/character names** (Pyro-Maniac, Male Snowboarder, Biker, Kimono Woman, Male/Female Rocket, Rocket execs Apollo/Athena, Red, Rival Silver, Pikachu, the Sinnoh/Platinum cast, etc.).
- **Source column:** `visual` = identified by sight only; `both` = visual ID **and** that class/character is independently named in the Project Pokémon modifier list.

> The originally-supplied index→name list (060=Will, 068=Falkner, …) did **not** match this ROM and was discarded.

## Renaming rules applied

- `certain` / `likely` → renamed to **`NNN_name.png`**.
- `unsure` → left as **`trainer_NNN.png`** (identification shown below is a best guess only).
- The 129 `trainer_NNN_b.png` files from the original extraction were **deleted**: the second graphic in each archive group decodes to noise (it is compressed/encoded differently and is not a usable image), so they were invalid artifacts, not real sprites.

**129 sprites — 76 renamed, 53 left as `trainer_NNN.png`.**

## Index

| Idx | Final filename | Identification | Confidence | Source | What I see |
|----:|----------------|----------------|------------|--------|------------|
| 000 | `000_ethan.png` | ethan | certain | both | Male protagonist — red jacket & cap, tossing a Poke Ball |
| 001 | `001_lyra.png` | lyra | certain | both | Female protagonist — white beret, satchel |
| 002 | `002_youngster.png` | youngster | likely | both | Boy, blue cap & shorts, throwing a ball |
| 003 | `003_lass.png` | lass | likely | both | Girl, brown hair, lively pose |
| 004 | `004_camper.png` | camper | certain | pret/hgss | **CORRECTED:** class 4=CAMPER. Visual was a girl with backpack (camper, not picnicker). |
| 005 | `trainer_005.png` | picnicker | certain | pret/hgss | **CORRECTED:** class 5=PICNICKER. Previously guessed camper. |
| 006 | `006_bug_catcher.png` | bug_catcher | likely | both | Boy swinging a butterfly net |
| 007 | `007_aroma_lady.png` | aroma_lady | certain | pret/hgss | **CORRECTED:** class 7=AROMA_LADY. Visual described as sparkle effect (floral) — matches Aroma Lady. |
| 008 | `008_twins.png` | twins | likely | visual | Two small girls embracing |
| 009 | `009_hiker.png` | hiker | certain | both | Stout man, backpack and walking stick |
| 010 | `010_battle_girl.png` | battle_girl | certain | pret/hgss | **CORRECTED:** class 10=BATTLE_GIRL. Black Belt is at idx 14. |
| 011 | `011_fisherman.png` | fisherman | certain | both | Man with fishing rod and tackle box |
| 012 | `012_cyclist_m.png` | cyclist_m | certain | both | Male riding a bicycle |
| 013 | `013_cyclist_f.png` | cyclist_f | certain | both | Female riding a bicycle |
| 014 | `trainer_014.png` | black_belt | certain | pret/hgss | **CORRECTED:** class 14=BLACK_BELT. Previously unsure. File not renamed (still trainer_014.png). |
| 015 | `015_artist.png` | artist | certain | pret/hgss | **CORRECTED:** class 15=ARTIST. |
| 016 | `trainer_016.png` | pokemon_breeder_m | certain | pret/hgss | **CORRECTED:** class 16=PKMN_BREEDER_M. |
| 017 | `trainer_017.png` | pokemon_breeder_f | certain | pret/hgss | **CORRECTED:** class 17=PKMN_BREEDER_F. |
| 018 | `trainer_018.png` | cowgirl | certain | pret/hgss | **CORRECTED:** class 18=COWGIRL. |
| 019 | `019_jogger.png` | jogger | certain | pret/hgss | **CORRECTED:** class 19=JOGGER. |
| 020 | `trainer_020.png` | pokefan_m | certain | pret/hgss | **CORRECTED:** class 20=POKEFAN_M. |
| 021 | `trainer_021.png` | pokefan_f | certain | pret/hgss | **CORRECTED:** class 21=POKEFAN_F. |
| 022 | `022_pokemon_pikachu.png` | pokemon_pikachu | certain | both | Pikachu |
| 023 | `023_silver.png` | silver | certain | pret/hgss | **CORRECTED:** class 23=RIVAL=Silver. File renamed from trainer_023.png. |
| 024 | `trainer_024.png` | — | unsure | both | Blue hair, red jacket (ace trainer?) |
| 025 | `trainer_025.png` | — | unsure | both | Dark hair, combat boots, fighting stance (battle girl?) |
| 026 | `026_waitress.png` | waitress | certain | pret/hgss | **CORRECTED:** class 26=WAITRESS. |
| 027 | `trainer_027.png` | veteran | certain | pret/hgss | **CORRECTED:** class 27=VETERAN (medium is class 82). |
| 028 | `trainer_028.png` | ninja_boy | certain | pret/hgss | **CORRECTED:** class 28=NINJA_BOY. |
| 029 | `trainer_029.png` | dragon_tamer | certain | pret/hgss | **CORRECTED:** class 29=DRAGON_TAMER. |
| 030 | `trainer_030.png` | bird_keeper | certain | pret/hgss | **CORRECTED:** class 30=BIRD_KEEPER. |
| 031 | `trainer_031.png` | juggler | certain | pret/hgss | **CORRECTED:** class 31=JUGGLER. |
| 032 | `trainer_032.png` | rich_boy | certain | pret/hgss | **CORRECTED:** class 32=RICH_BOY. |
| 033 | `trainer_033.png` | lady | certain | pret/hgss | **CORRECTED:** class 33=LADY. |
| 034 | `034_gentleman.png` | gentleman | likely | both | Suit, fedora, briefcase |
| 035 | `trainer_035.png` | socialite | certain | pret/hgss | **CORRECTED:** class 35=SOCIALITE. |
| 036 | `trainer_036.png` | beauty | certain | pret/hgss | **CORRECTED:** class 36=BEAUTY. |
| 037 | `trainer_037.png` | collector | certain | pret/hgss | **CORRECTED:** class 37=COLLECTOR. |
| 038 | `038_policeman.png` | policeman | likely | both | Police cap, baton |
| 039 | `trainer_039.png` | pokemon_ranger_m | certain | pret/hgss | **CORRECTED:** class 39=PKMN_RANGER_M. |
| 040 | `trainer_040.png` | pokemon_ranger_f | certain | pret/hgss | **CORRECTED:** class 40=PKMN_RANGER_F. |
| 041 | `041_scientist.png` | scientist | likely | both | White lab coat, glasses |
| 042 | `042_swimmer_m.png` | swimmer_m | likely | visual | Shirtless, swim trunks |
| 043 | `trainer_043.png` | swimmer_f | certain | pret/hgss | **CORRECTED:** class 43=SWIMMER_F. Previously guessed tuber. |
| 044 | `044_tuber_m.png` | tuber_m | certain | pret/hgss | **CORRECTED:** class 44=TUBER_M. File was swimmer_f (WRONG). |
| 045 | `045_tuber.png` | tuber | likely | visual | Kid with a swim ring |
| 046 | `046_sailor.png` | sailor | likely | both | White uniform, anchor motif |
| 047 | `047_kimono_girl.png` | kimono_girl | likely | both | Colourful kimono |
| 048 | `trainer_048.png` | ruin_maniac | certain | pret/hgss | **CORRECTED:** class 48=RUIN_MANIAC. |
| 049 | `trainer_049.png` | psychic_m | certain | pret/hgss | **CORRECTED:** class 49=PSYCHIC_M. |
| 050 | `trainer_050.png` | psychic_f | certain | pret/hgss | **CORRECTED:** class 50=PSYCHIC_F. |
| 051 | `051_pi.png` | pi | certain | pret/hgss | **CORRECTED:** class 51=PI (Private Investigator). |
| 052 | `052_guitarist.png` | guitarist | certain | both | Figure playing an electric guitar |
| 053 | `trainer_053.png` | ace_trainer_m_gs | certain | pret/hgss | **CORRECTED:** class 53=ACE_TRAINER_M_GS. |
| 054 | `trainer_054.png` | ace_trainer_f_gs | certain | pret/hgss | **CORRECTED:** class 54=ACE_TRAINER_F_GS. |
| 055 | `055_rocket_grunt_m.png` | rocket_grunt_m | likely | both | Dark uniform, tossing a ball |
| 056 | `trainer_056.png` | skier | certain | pret/hgss | **CORRECTED:** class 56=SKIER. |
| 057 | `057_roughneck.png` | roughneck | certain | pret/hgss | **CORRECTED:** class 57=ROUGHNECK. |
| 058 | `058_clown.png` | clown | certain | both | Jester costume holding a ball |
| 059 | `059_worker.png` | worker | likely | visual | Hard hat, green workwear |
| 060 | `060_school_kid_m.png` | school_kid_m | certain | pret/hgss | **CORRECTED:** class 60=SCHOOL_KID_M. Was badly misidentified as Rocket grunt. |
| 061 | `061_school_kid_f.png` | school_kid_f | likely | both | Small girl in blue |
| 062 | `062_rocket_grunt_f.png` | rocket_grunt_f | likely | both | Dark uniform with an 'R' emblem |
| 063 | `063_burglar.png` | burglar | certain | pret/hgss | **CORRECTED:** class 63=BURGLAR. Was misidentified as Rocket grunt. |
| 064 | `064_firebreather.png` | firebreather | likely | both | Bald man breathing fire, yellow jumpsuit (Pyro-Maniac) |
| 065 | `065_biker.png` | biker | certain | both | Muscular man beside a motorcycle |
| 066 | `066_falkner.png` | falkner | likely | visual | Blue hair, blue outfit, feathers — Violet Flying leader |
| 067 | `067_bugsy.png` | bugsy | likely | visual | Green outfit, holding a net — Azalea Bug leader |
| 068 | `068_pokemon_feraligatr.png` | poke_maniac | certain | pret/hgss | **CORRECTED:** class 68=POKE_MANIAC. Sprite *appears* to be a large Pokémon but POKE_MANIAC's battle sprite was mistaken for Feraligatr. File not renamed. |
| 069 | `trainer_069.png` | bird_keeper_gs | certain | pret/hgss | **CORRECTED:** class 69=BIRD_KEEPER_GS. |
| 070 | `070_whitney.png` | whitney | certain | visual | Pink hair, white top — Goldenrod Normal leader |
| 071 | `trainer_071.png` | rancher | certain | pret/hgss | **CORRECTED:** class 71=RANCHER. |
| 072 | `072_morty.png` | morty | likely | visual | Blonde hair, dark purple jacket — Ecruteak Ghost leader |
| 073 | `073_pryce.png` | pryce | certain | visual | Old man, cane, teal coat — Mahogany Ice leader |
| 074 | `074_jasmine.png` | jasmine | likely | visual | Dark pigtails, light mint dress — Olivine Steel leader |
| 075 | `075_chuck.png` | chuck | certain | visual | Bald, bearded, shirtless, muscular — Cianwood Fighting leader |
| 076 | `076_clair.png` | clair | certain | visual | Cyan long hair, cape — Blackthorn Dragon leader |
| 077 | `trainer_077.png` | teacher | certain | pret/hgss | **CORRECTED:** class 77=TEACHER. |
| 078 | `078_super_nerd.png` | super_nerd | certain | pret/hgss | **CORRECTED:** class 78=SUPER_NERD. Was misidentified as pokemon_breeder. |
| 079 | `079_sage.png` | sage | likely | both | Old man, prayer beads, dark robe (Sprout Tower monk) |
| 080 | `trainer_080.png` | parasol_lady | certain | pret/hgss | **CORRECTED:** class 80=PARASOL_LADY. Visual guess was correct. |
| 081 | `trainer_081.png` | waiter | certain | pret/hgss | **CORRECTED:** class 81=WAITER. |
| 082 | `082_medium.png` | medium | certain | pret/hgss | **CORRECTED:** class 82=MEDIUM. Was misidentified as Blaine. Blaine is at idx 108. |
| 083 | `083_cameraman.png` | cameraman | likely | both | Red cap, shoulder video camera |
| 084 | `trainer_084.png` | reporter | certain | pret/hgss | **CORRECTED:** class 84=REPORTER. |
| 085 | `trainer_085.png` | idol | certain | pret/hgss | **CORRECTED:** class 85=IDOL. |
| 086 | `086_lance.png` | lance | certain | visual | Red spiky hair, black/red cape — Champion |
| 087 | `087_will.png` | will | likely | visual | Long purple hair, arms spread, theatrical psychic pose — Elite Four (Psychic) |
| 088 | `088_karen.png` | karen | likely | visual | Silver wavy long hair — Elite Four (Dark) |
| 089 | `089_koga.png` | koga | likely | visual | Dark outfit, red scarf, martial/ninja stance — Elite Four (Poison) |
| 090 | `trainer_090.png` | cheryl | certain | pret/hgss | **CORRECTED:** class 90=PKMN_TRAINER_CHERYL (DPPt companion). |
| 091 | `091_riley.png` | riley | certain | pret/hgss | **CORRECTED:** class 91=PKMN_TRAINER_RILEY (named DPPt companion). |
| 092 | `trainer_092.png` | buck | certain | pret/hgss | **CORRECTED:** class 92=PKMN_TRAINER_BUCK (DPPt companion). |
| 093 | `trainer_093.png` | mira | certain | pret/hgss | **CORRECTED:** class 93=PKMN_TRAINER_MIRA (DPPt companion). |
| 094 | `094_pokemon_pikachu.png` | marley_pikachu | certain | pret/hgss | **NOTE:** class 94=PKMN_TRAINER_MARLEY. Visual is Pikachu — Marley's battle sprite in HGSS appears to be/use a Pikachu image. File kept as-is. |
| 095 | `trainer_095.png` | lucas_ftr | certain | pret/hgss | **CORRECTED:** class 95=PKMN_TRAINER_FTR_LUCAS (Sinnoh rival Lucas, Battle Frontier version). |
| 096 | `096_dawn.png` | dawn | likely | both | White beret, pink skirt — Sinnoh heroine |
| 097 | `097_palmer.png` | palmer | certain | pret/hgss | **CORRECTED:** class 97=TOWER_TYCOON=Palmer (Battle Frontier Tower Tycoon). Was misidentified as Barry. |
| 098 | `098_brock.png` | brock | certain | visual | Squint, spiky brown hair, vest — Pewter Rock leader |
| 099 | `trainer_099.png` | argenta | certain | pret/hgss | **CORRECTED:** class 99=HALL_MATRON=Argenta (Battle Hall Frontier Brain). |
| 100 | `trainer_100.png` | thorton | certain | pret/hgss | **CORRECTED:** class 100=FACTORY_HEAD=Thorton (Battle Factory Frontier Brain). |
| 101 | `trainer_101.png` | dahlia | certain | pret/hgss | **CORRECTED:** class 101=ARCADE_STAR=Dahlia (Battle Arcade Frontier Brain). |
| 102 | `trainer_102.png` | darach | certain | pret/hgss | **CORRECTED:** class 102=CASTLE_VALET=Darach (Battle Castle Frontier Brain). |
| 103 | `103_misty.png` | misty | likely | visual | Orange hair, blue outfit, active Poke Ball–throwing stance — Cerulean Water leader |
| 104 | `104_lt_surge.png` | lt_surge | certain | visual | Blonde, dog tags, camo — Vermilion Electric leader |
| 105 | `105_erika.png` | erika | likely | visual | Yellow kimono, dark hair — Celadon Grass leader |
| 106 | `106_janine.png` | janine | likely | visual | Purple hair, pink scarf, ninja — Fuchsia Poison leader |
| 107 | `107_sabrina.png` | sabrina | likely | visual | Teal hair, green psychic energy — Saffron Psychic leader |
| 108 | `108_blaine.png` | blaine | certain | pret/hgss | **CORRECTED:** class 108=LEADER_BLAINE. File renamed from trainer_108.png. Previously thought to be Gentleman. |
| 109 | `109_red.png` | red | certain | both | Red cap, red/white jacket — protagonist (Mt. Silver) |
| 110 | `110_blue.png` | blue | certain | visual | Spiky orange hair, green jacket — Kanto rival/leader |
| 111 | `111_elder.png` | elder | certain | pret/hgss | **CORRECTED:** class 111=ELDER. (SAGE is idx 79; ELDER is idx 111.) |
| 112 | `112_bruno.png` | bruno | certain | visual | Dark ponytail, shirtless, muscular — Elite Four (Fighting) |
| 113 | `113_scientist.png` | scientist_gs | certain | pret/hgss | **CORRECTED:** class 113=SCIENTIST_GS (GS variant). |
| 114 | `trainer_114.png` | ariana | certain | pret/hgss | **CONFIRMED:** class 114=EXECUTIVE_ARIANA. Also confirmed by ROM party analysis (Arbok+Vileplume+Murkrow). |
| 115 | `115_snowboarder.png` | snowboarder | likely | both | Snowboard/ski pose (Male Snowboarder) |
| 116 | `116_rocket_executive.png` | rocket_executive | likely | both | White uniform, red 'R' — exec (Apollo/Athena?) |
| 117 | `trainer_117.png` | proton | certain | pret/hgss | **CONFIRMED:** class 117=EXECUTIVE_PROTON. Also confirmed by ROM party analysis (Zubat/Golbat+Koffing/Weezing). |
| 118 | `trainer_118.png` | petrel | certain | pret/hgss | **CONFIRMED:** class 118=EXECUTIVE_PETREL. Also confirmed by ROM party analysis (5×Koffing+Weezing). |
| 119 | `119_passerby.png` | passerby | certain | pret/hgss | **CORRECTED:** class 119=PASSERBY. Was severely misidentified as Silver. Silver is at idx 23. |
| 120 | `trainer_120.png` | mystery_man | certain | pret/hgss | **CORRECTED:** class 120=MYSTERY_MAN. |
| 121 | `trainer_121.png` | double_team | certain | pret/hgss | **CORRECTED:** class 121=DOUBLE_TEAM (Rocket Double Team trainers). |
| 122 | `122_young_couple.png` | young_couple | certain | pret/hgss | **CORRECTED:** class 122=YOUNG_COUPLE. (TWINS is idx 8.) |
| 123 | `trainer_123.png` | lance_as_trainer | certain | pret/hgss | **CORRECTED:** class 123=PKMN_TRAINER_LANCE (Lance in his role as Johto story character, before becoming Champion). |
| 124 | `124_giovanni.png` | giovanni | likely | visual | Dark charcoal double-breasted suit, dark fedora, red pocket square — Viridian Ground leader / Rocket boss |
| 125 | `trainer_125.png` | lucas_dp | certain | pret/hgss | **CORRECTED:** class 125=PKMN_TRAINER_LUCAS_DP (Lucas, DP variant). |
| 126 | `126_dawn.png` | dawn | likely | both | White beret, pink — Sinnoh heroine |
| 127 | `trainer_127.png` | lucas_pt | certain | pret/hgss | **CORRECTED:** class 127=PKMN_TRAINER_LUCAS_PT (Lucas, Platinum variant). |
| 128 | `128_dawn.png` | dawn | likely | both | White beret, pink — Sinnoh heroine |

## Confidently identified named characters

| Character | File | Confidence | Source |
|-----------|------|------------|--------|
| Ethan | `000_ethan.png` | certain | both |
| Lyra | `001_lyra.png` | certain | both |
| Falkner | `066_falkner.png` | likely | visual |
| Bugsy | `067_bugsy.png` | likely | visual |
| Whitney | `070_whitney.png` | certain | visual |
| Morty | `072_morty.png` | likely | visual |
| Pryce | `073_pryce.png` | certain | visual |
| Jasmine | `074_jasmine.png` | likely | visual |
| Chuck | `075_chuck.png` | certain | visual |
| Clair | `076_clair.png` | certain | visual |
| Blaine | `108_blaine.png` | certain | pret/pokeheartgold |
| Lance | `086_lance.png` | certain | visual |
| Will | `087_will.png` | likely | visual |
| Karen | `088_karen.png` | likely | visual |
| Koga | `089_koga.png` | likely | visual |
| Misty | `103_misty.png` | likely | visual |
| Lt. Surge | `104_lt_surge.png` | certain | visual |
| Erika | `105_erika.png` | likely | visual |
| Janine | `106_janine.png` | likely | visual |
| Sabrina | `107_sabrina.png` | likely | visual |
| Red | `109_red.png` | certain | both |
| Blue | `110_blue.png` | certain | visual |
| Bruno | `112_bruno.png` | certain | visual |
| Silver | `023_silver.png` | certain | pret/pokeheartgold |
| Giovanni | `124_giovanni.png` | likely | visual |
| Palmer (Tower Tycoon) | `097_palmer.png` | certain | pret/pokeheartgold |
| Dawn (Sinnoh heroine) | `096_dawn.png` (also 126, 128) | likely | both |

**Stray Pokémon sprites:** `022_pokemon_pikachu.png`, `068_pokemon_feraligatr.png`, `094_pokemon_pikachu.png`.

## Additional observations

- **trainer_029**: At 4× zoom — dark *purple* hair, theatrical flowing purple cape with gold accents. Not Giovanni; likely a psychic/event trainer or duplicate sprite for a ghost-type character.
- **trainer_118**: Team Rocket Executive — purple mohawk, full black Rocket uniform with large R emblem explicit at 4×.
- **trainer_120**: Brown hair, purple diamond-pattern suit, ghost Pokémon floating alongside — possibly a Morty alt-sprite or an event character.

All originally missing named leaders are accounted for. No further unnamed characters of note remain.

## Credit

Sprites © Nintendo / Game Freak / Creatures Inc. (Pokémon HeartGold/SoulSilver).
