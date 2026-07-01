#!/usr/bin/env python3
"""
Extracts interior zone data (dungeons, gyms, houses) from the pret/pokeheartgold
zone_event JSON files and appends them to scripts/sources/zone-data.json.

These zones don't appear in the EVERYWHERE tile matrix so extract-zone-data.py skips them.
This script handles them directly from their zone_event files.
"""

import json
from pathlib import Path

PRET = Path.home() / "pokeheartgold"
ZONE_EVENT_DIR = PRET / "files/fielddata/eventdata/zone_event"
ZONE_DATA_PATH = Path("scripts/sources/zone-data.json")
MAPS_H = PRET / "include/constants/maps.h"

# ── 1. Load existing zone-data.json ──────────────────────────────────────────

with open(ZONE_DATA_PATH) as f:
    zone_data = json.load(f)

existing_names = {z["name"] for z in zone_data["zones"]}

# ── 2. Build MAP_NAME → file number mapping from maps.h ──────────────────────

map_constants = {}
for line in MAPS_H.read_text().splitlines():
    if line.strip().startswith("#define MAP_"):
        parts = line.split()
        if len(parts) >= 3:
            name = parts[1]   # e.g. MAP_UNION_CAVE_1F
            try:
                num = int(parts[2])
                map_constants[name] = num
            except ValueError:
                pass

# ── 3. Interior zones to extract ─────────────────────────────────────────────
# Format: display_name → (MAP_CONSTANT, filename, category)

INTERIOR_ZONES = {
    # Phase 2 — Bugsy arc
    "MAP_UNION_CAVE_1F":          ("096_D25R0101.json", "dungeon"),
    "MAP_UNION_CAVE_B1F":         ("148_D25R0102.json", "dungeon"),
    "MAP_UNION_CAVE_B2F":         ("149_D25R0103.json", "dungeon"),
    "MAP_SLOWPOKE_WELL_ENTRANCE": ("111_D26R0101.json", "dungeon"),
    "MAP_SLOWPOKE_WELL_B1F":      ("170_D26R0102.json", "dungeon"),
    "MAP_SLOWPOKE_WELL_B2F":      ("174_D26R0103.json", "dungeon"),
    "MAP_AZALEA_GYM_ENTRANCE":    ("132_T23GYM0101.json", "gym"),
    "MAP_AZALEA_GYM":             ("173_T23GYM0102.json", "gym"),
    "MAP_AZALEA_KURT_HOUSE":      ("158_T23R0501.json", "house"),
    # Phase 7 — Pryce arc (maps.h numbers don't match file prefixes)
    "MAP_MAHOGANY_GYM":           ("136_T28GYM0101.json", "gym"),
    "MAP_MAHOGANY_GYM_ROOM_2":    ("353_T28GYM0102.json", "gym"),
    "MAP_MAHOGANY_GYM_ROOM_3":    ("354_T28GYM0103.json", "gym"),
    "MAP_ROCKET_HIDEOUT_B1F":     ("109_D23R0101.json", "dungeon"),
    "MAP_ROCKET_HIDEOUT_B2F":     ("179_D23R0102.json", "dungeon"),
    "MAP_ROCKET_HIDEOUT_B3F_1":   ("180_D23R0103.json", "dungeon"),
    "MAP_ROCKET_HIDEOUT_B3F_2":   ("181_D23R0104.json", "dungeon"),
    "MAP_ROCKET_HIDEOUT_B3F_3":   ("182_D23R0105.json", "dungeon"),
    "MAP_ROCKET_HIDEOUT_B4F":     ("183_D23R0106.json", "dungeon"),
    # Phase 8 — Clair arc
    "MAP_BLACKTHORN_GYM":         ("137_T30GYM0101.json", "gym"),
    "MAP_DRAGONS_DEN_B1F":        ("239_D44R0102.json", "dungeon"),
    "MAP_DRAGONS_DEN_ELDER":      ("259_D44R0103.json", "dungeon"),
    # Elite Four — Indigo Plateau
    "MAP_INDIGO_PLATEAU_WILL":    ("272_T10R0201.json", "gym"),
    "MAP_INDIGO_PLATEAU_KOGA":    ("273_T10R0301.json", "gym"),
    "MAP_INDIGO_PLATEAU_BRUNO":   ("274_T10R0401.json", "gym"),
    "MAP_INDIGO_PLATEAU_KAREN":   ("275_T10R0501.json", "gym"),
    "MAP_INDIGO_PLATEAU_LANCE":   ("276_T10R0601.json", "gym"),
}

# Auto-discover: scan all zone_event files and match by MAP constant number
# Build reverse map: number → MAP name
num_to_mapname = {v: k for k, v in map_constants.items()}

# Scan zone_event dir for all files and build number → filename map
file_map = {}
for f in sorted(ZONE_EVENT_DIR.glob("*.json")):
    try:
        num = int(f.stem.split("_")[0])
        file_map[num] = f
    except ValueError:
        pass

# ── 4. Additional interior zones to auto-include (Phase 1-8) ─────────────────

EXTRA_MAP_NAMES = [
    # Phase 1 — maps.h numbers match file prefixes for these
    "MAP_VIOLET_GYM",
    "MAP_SPROUT_TOWER_1F",
    "MAP_SPROUT_TOWER_2F",
    "MAP_SPROUT_TOWER_3F",
    # Phase 3
    "MAP_GOLDENROD_GYM",
    "MAP_ILEX_FOREST",
    # Phase 4
    "MAP_ECRUTEAK_GYM",
    "MAP_BURNED_TOWER_1F",
    "MAP_BURNED_TOWER_B1F",
    # Phase 5
    "MAP_CIANWOOD_GYM",
    # Phase 6
    "MAP_OLIVINE_GYM",
    "MAP_OLIVINE_LIGHTHOUSE_1F",
    # Phase 7
    "MAP_ICE_PATH_1F",
    "MAP_ICE_PATH_B1F",
]

# ── 5. Extract each interior zone ────────────────────────────────────────────

def parse_zone_event(filepath, map_name):
    with open(filepath) as f:
        raw = json.load(f)

    objects = []
    for obj in raw.get("objects", []):
        objects.append({
            "id": obj.get("id"),
            "spriteId": obj.get("spriteId"),
            "movement": obj.get("movement"),
            "type": obj.get("type"),
            "eventFlag": obj.get("eventFlag"),
            "scriptId": obj.get("scriptId"),
            "x": obj.get("x"),
            "z": obj.get("z"),
        })

    warps = []
    for w in raw.get("warps", []):
        warps.append({
            "x": w.get("x"),
            "z": w.get("z"),
            "header": w.get("header"),
            "anchor": w.get("anchor"),
        })

    return {
        "name": map_name,
        "interior": True,
        "objects": objects,
        "warps": warps,
    }


added = []
skipped = []

# Process explicit Phase 2 zones first
for map_name, (fname, category) in INTERIOR_ZONES.items():
    if map_name in existing_names:
        skipped.append(f"{map_name} (already exists)")
        continue
    if fname is None:
        skipped.append(f"{map_name} (no file)")
        continue
    fpath = ZONE_EVENT_DIR / fname
    if not fpath.exists():
        skipped.append(f"{map_name} (file not found: {fname})")
        continue
    zone = parse_zone_event(fpath, map_name)
    zone["category"] = category
    zone_data["zones"].append(zone)
    added.append(map_name)
    existing_names.add(map_name)

# Process extra zones by MAP constant lookup
for map_name in EXTRA_MAP_NAMES:
    if map_name in existing_names:
        skipped.append(f"{map_name} (already exists)")
        continue
    num = map_constants.get(map_name)
    if num is None:
        skipped.append(f"{map_name} (not in maps.h)")
        continue
    fpath = file_map.get(num)
    if fpath is None:
        skipped.append(f"{map_name} (no zone_event file for #{num})")
        continue
    zone = parse_zone_event(fpath, map_name)
    zone["category"] = "interior"
    zone_data["zones"].append(zone)
    added.append(map_name)
    existing_names.add(map_name)

# ── 6. Save ───────────────────────────────────────────────────────────────────

with open(ZONE_DATA_PATH, "w") as f:
    json.dump(zone_data, f, ensure_ascii=False, indent=None, separators=(",", ":"))

size_mb = ZONE_DATA_PATH.stat().st_size / 1_000_000
print(f"zone-data.json updated ({size_mb:.1f} MB)")
print(f"Added {len(added)} interior zones:")
for name in added:
    print(f"  + {name}")
if skipped:
    print(f"Skipped {len(skipped)}:")
    for s in skipped[:10]:
        print(f"  - {s}")
