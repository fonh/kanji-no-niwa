#!/usr/bin/env python3
"""
Copy named trainer sprites from trainers/battle/ and trainers/overworld/
into public/sprites/characters/ with semantic filenames.

Battle sprites: already named by TRAINER_INDEX.md workflow (e.g. 066_falkner.png)
Overworld sprites: internal label → semantic name from sprite-manifest.json
"""
import json
import shutil
from pathlib import Path

BASE = Path(__file__).parent
BATTLE_DIR = BASE / "trainers/battle"
OW_DIR     = BASE / "trainers/overworld"
CHARS_DIR  = BASE / "characters"

CHARS_DIR.mkdir(exist_ok=True)

manifest = json.loads((BASE / "sprite-manifest.json").read_text())

# --- Overworld copies (from overworld_label_map) ---
label_map = manifest["overworld_label_map"]
ow_copied, ow_missing = [], []

for label, semantic_key in label_map.items():
    if label.startswith("_"):
        continue
    src = OW_DIR / f"{label}.png"
    if not src.exists():
        ow_missing.append(label)
        continue
    # semantic_key looks like "leaders/falkner_ow" — flatten to "leader_falkner_ow.png"
    parts = semantic_key.split("/")
    dest_name = f"{parts[0].rstrip('s')}_{parts[1]}.png"  # leaders → leader
    dest = CHARS_DIR / dest_name
    shutil.copy2(src, dest)
    ow_copied.append(f"  {src.name} → characters/{dest.name}")

# --- Battle copies for named characters ---
# We want to also put battle sprites in characters/ with descriptive names.
# Battle files already have names like 066_falkner.png, 119_silver.png etc.
battle_copied, battle_missing = [], []
named_battle = [
    ("protagonists", "ethan",    "battle_file"),
    ("protagonists", "lyra",     "battle_file"),
    ("johto_gym_leaders", "falkner",  "battle_file"),
    ("johto_gym_leaders", "bugsy",    "battle_file"),
    ("johto_gym_leaders", "whitney",  "battle_file"),
    ("johto_gym_leaders", "morty",    "battle_file"),
    ("johto_gym_leaders", "chuck",    "battle_file"),
    ("johto_gym_leaders", "jasmine",  "battle_file"),
    ("johto_gym_leaders", "pryce",    "battle_file"),
    ("johto_gym_leaders", "clair",    "battle_file"),
    ("kanto_gym_leaders", "brock",    "battle_file"),
    ("kanto_gym_leaders", "misty",    "battle_file"),
    ("kanto_gym_leaders", "lt_surge", "battle_file"),
    ("kanto_gym_leaders", "erika",    "battle_file"),
    ("kanto_gym_leaders", "janine",   "battle_file"),
    ("kanto_gym_leaders", "sabrina",  "battle_file"),
    ("kanto_gym_leaders", "blaine",   "battle_file"),
    ("kanto_gym_leaders", "blue",     "battle_file"),
    ("johto_elite_four",  "will",     "battle_file"),
    ("johto_elite_four",  "koga",     "battle_file"),
    ("johto_elite_four",  "bruno",    "battle_file"),
    ("johto_elite_four",  "karen",    "battle_file"),
    ("champion",          "lance",    "battle_file"),
    ("rivals",            "silver",   "battle_file"),
    ("special",           "red",      "battle_file"),
    ("special",           "giovanni", "battle_file"),
    ("rocket",            "archer",   "battle_file"),
    ("rocket",            "proton",   "battle_file"),
    ("rocket",            "petrel",   "battle_file"),
    ("rocket",            "ariana",   "battle_file"),
    ("rocket",            "grunt_m",  "battle_file"),
    ("rocket",            "grunt_f",  "battle_file"),
    ("kimono_girls",      None,       "battle_file"),
]

for category, char, field in named_battle:
    if char is None:
        # kimono girls: flat category
        entry = manifest["kimono_girls"]
        rel = entry.get(field)
    else:
        entry = manifest.get(category, {}).get(char)
        if not entry:
            continue
        rel = entry.get(field)
    if not rel:
        continue
    src = BASE / rel
    if not src.exists():
        battle_missing.append(rel)
        continue
    dest = CHARS_DIR / f"battle_{src.name}"
    shutil.copy2(src, dest)
    battle_copied.append(f"  {src.name} → characters/battle_{src.name}")

# --- Report ---
print(f"\n=== Overworld sprites copied ({len(ow_copied)}) ===")
print("\n".join(ow_copied))
if ow_missing:
    print(f"\n--- Missing overworld source files ({len(ow_missing)}) ---")
    print("  " + ", ".join(ow_missing))

print(f"\n=== Battle sprites copied ({len(battle_copied)}) ===")
print("\n".join(battle_copied))
if battle_missing:
    print(f"\n--- Missing battle source files ({len(battle_missing)}) ---")
    print("  " + "\n  ".join(battle_missing))

print(f"\nDone. characters/ now has {len(list(CHARS_DIR.glob('*.png')))} PNG files.")
