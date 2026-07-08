#!/usr/bin/env python3
"""
Bridges content/npc-inventory.md (narrative PNJ list, no coordinates) with
real ROM-extracted object positions (src/data/zone-registry.json), producing
one file per zone under content/map/placements/<zone_id>.json with an entry
per narrative PNJ:

  - If a raw ROM object in that zone's group (outdoor + its interiors share
    one npc-inventory zone_id) can be confidently matched by name/role
    keywords, its REAL extracted tile position + facing are used.
  - Otherwise the PNJ is marked "source": "generated" with a placeholder
    walkable tile position, picked to spread across the zone rather than
    stack on one spot — a starting point for manual placement, not a claim
    of ROM accuracy.

This does NOT touch content/map/npcs.json or content/map/trainers.json (the
curated, dialogue-linked files actually used by the map) — it's a staging
reference for the content team to draw from when assigning real placements.
"""

import json
import re
import unicodedata
from pathlib import Path

ZONE_REGISTRY = Path("src/data/zone-registry.json")
NPC_INVENTORY = Path("content/npc-inventory.md")
OUT_DIR = Path("content/map/placements")

registry = json.load(open(ZONE_REGISTRY))
zones = registry["zones"]
zones_by_name = {z["name"]: z for z in zones}


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def normalize_map_name(map_name: str) -> str:
    norm = strip_accents(map_name.replace("MAP_", "").lower()).replace("_", "-")
    return re.sub(r"\bmount-", "mt-", norm)


# zone_id whose name doesn't share a recognizable prefix with its ROM map
# name (translated names, renamed groupings) — matched by explicit ROM
# name-prefix instead of the automatic heuristic below.
ZONE_ID_ALIASES: dict[str, list[str]] = {
    "kanto-power-plant": ["route-10-power-plant"],
    "mont-lune-route-3-4": ["mt-moon", "route-3", "route-4"],
}


# Every zone_id that appears as a "## zone_id — Name" heading, matched
# against MAP_* names the same way src/lib/npcs.ts does at runtime.
def map_zones_for_inventory_id(zone_id: str) -> list[dict]:
    aliases = ZONE_ID_ALIASES.get(zone_id)
    matches = []
    for z in zones:
        norm = normalize_map_name(z["name"])
        if aliases is not None:
            if any(norm == a or norm.startswith(a + "-") for a in aliases):
                matches.append(z)
            continue
        if (
            norm == zone_id
            or zone_id.startswith(norm + "-")  # zone_id is a specific sub-area, e.g. "new-bark-town" ⊇ "new-bark"
            or norm.startswith(zone_id + "-")  # zone_id is a union of floors, e.g. "sprout-tower" ⊆ "sprout-tower-1f"
        ):
            matches.append(z)
    return matches


# ── 1. Parse npc-inventory.md into {zone_id: [(name, role, item), ...]} ─────

text = NPC_INVENTORY.read_text()
sections = re.split(r"\n## ", text)[1:]  # drop the doc header before the first ##

inventory: dict[str, list[tuple[str, str, str]]] = {}
for section in sections:
    header_line, _, body = section.partition("\n")
    m = re.match(r"([a-z0-9-]+)\s*—", header_line)
    if not m:
        continue
    zone_id = m.group(1)
    rows = re.findall(r"^\|([^|]+)\|([^|]+)\|([^|]+)\|[^|]*\|$", body, re.MULTILINE)
    entries = []
    for name, role, item in rows:
        name = name.strip()
        if not name or name.startswith("---") or "PNJ / rôle" in name:
            continue
        entries.append((name, role.strip(), item.strip()))
    # Zones vraiment vides (routes de transit pures, cf. "Aucun PNJ nommé
    # confirmé") gardent leur entrée à [] plutôt que d'être ignorées — un
    # placements/<zone_id>.json vide et explicite vaut mieux qu'un fichier
    # absent, ambigu entre "pas de PNJ" et "pas encore traité".
    inventory[zone_id] = entries

print(f"Parsed {sum(len(v) for v in inventory.values())} PNJ across {len(inventory)} zones from {NPC_INVENTORY}")

# ── 2. Keyword hints: narrative name/role → spriteId substring ──────────────
# Matched against the ROM label with SPRITE_/GS prefix and any trailing
# _<digits> instance-suffix stripped (see src/lib/npc-sprites.ts).

KEYWORD_HINTS = [
    ("mom", "gsmama"),
    ("professeur elm", "doctor"),
    ("pr. elm", "doctor"),
    ("assistant du pr. elm", "assistantm"),
    ("policier", "policeman"),
    ("professeur oak", "prof_oak"),
    ("pr. oak", "prof_oak"),
    ("professeur chen", "prof_oak"),
    ("kimono girl 1", "kimono_girl_1"),
    ("kimono girl 2", "kimono_girl_2"),
    ("kimono girl 3", "kimono_girl_3"),
    ("kimono girl 4", "kimono_girl_4"),
    ("kimono girl 5", "kimono_girl_5"),
    ("zuki", "kimono_girl_1"),
    ("naoko", "kimono_girl_2"),
    ("kuni", "kimono_girl_3"),
    ("miki", "kimono_girl_4"),
    ("sayo", "kimono_girl_5"),
    ("bill", "bill"),
    ("eusine", "eusine"),
    ("looker", "looker"),
    ("guide gent", "oldman"),
    ("infirmiere", "nurse"),
    ("infirmière", "nurse"),
    # Rival — same reused slot as "friend", see src/lib/npc-sprites.ts
    ("silver", "gsrivel"),
    ("rival", "gsrivel"),
    # Team Rocket — the raw overworld NARC only has generic grunt models
    # (no individual sprite per executive), so this is a rough gender-only
    # substitute, not a real identity match.
    ("ariana", "rocketw"),
    ("archer", "rocketm"),
    ("proton", "rocketm"),
    ("petrel", "rocketm"),
    ("giovanni", "sakaki"),
    ("sakaki", "sakaki"),
    # Johto gym leaders (badge order → gsleader1..8)
    ("falkner", "gsleader1"),
    ("bugsy", "gsleader2"),
    ("whitney", "gsleader3"),
    ("morty", "gsleader4"),
    ("chuck", "gsleader5"),
    ("jasmine", "gsleader6"),
    ("pryce", "gsleader7"),
    ("clair", "gsleader8"),
    # Kanto gym leaders (gsleader9..16)
    ("brock", "gsleader9"),
    ("misty", "gsleader10"),
    ("lt. surge", "gsleader11"),
    ("erika", "gsleader12"),
    ("janine", "gsleader13"),
    ("sabrina", "gsleader14"),
    ("blaine", "gsleader15"),
    ("blue", "gsleader16"),
    # Elite Four — only Lance (internal name "wataru") has a distinct
    # overworld model in the raw extraction; Will/Koga/Bruno/Karen don't.
    ("lance", "wataru"),
]


def strip_sprite_label(sprite_id: str) -> str:
    label = sprite_id.replace("SPRITE_", "").lower()
    return re.sub(r"_\d+$", "", label)


def find_rom_match(name: str, role: str, pool: list[tuple[dict, dict]]):
    """pool: list of (zone_dict, object_dict). Returns the first object whose
    stripped sprite label matches a keyword hint triggered by name/role."""
    haystack = strip_accents(f"{name} {role}".lower())
    for keyword, sprite_hint in KEYWORD_HINTS:
        if keyword not in haystack:
            continue
        for zone, obj in pool:
            if strip_sprite_label(obj["spriteId"]) == sprite_hint:
                return zone, obj
    return None


# ── 3. Placeholder generator: spread walkable tiles across a zone ───────────

def walkable_positions(zone: dict, limit: int) -> list[tuple[int, int]]:
    # Le registre encode le terrain en 1 char/tuile ('.'=sol, '#'=mur, 'w'=eau…)
    # — un PNJ placeholder ne doit se poser que sur du sol sec.
    if "terrain" in zone and "walkable" not in zone:
        tw = zone["tile_width"]
        positions = [(i % tw, i // tw) for i, t in enumerate(zone["terrain"]) if t == "."]
        if not positions:
            return []
        step = max(1, len(positions) // max(limit, 1))
        return positions[::step][:limit]
    tw, th = zone["tile_width"], zone["tile_height"]
    walkable = zone["walkable"]
    positions = [(i % tw, i // tw) for i, w in enumerate(walkable) if w]
    if not positions:
        return []
    if len(positions) <= limit:
        return positions
    step = max(1, len(positions) // limit)
    return positions[::step][:limit]


# ── 4. Build placements per npc-inventory zone_id ────────────────────────────

OUT_DIR.mkdir(parents=True, exist_ok=True)
total_matched = 0
total_generated = 0
zones_with_no_map = []

for zone_id, entries in inventory.items():
    map_zones = map_zones_for_inventory_id(zone_id)
    if not map_zones:
        zones_with_no_map.append(zone_id)
        continue

    pool = [(z, obj) for z in map_zones for obj in z["objects"]]
    used_object_ids: set[str] = set()

    placeholder_cursor: dict[str, int] = {}
    placeholder_cache: dict[str, list[tuple[int, int]]] = {}

    out_entries = []
    for name, role, item in entries:
        match = find_rom_match(name, role, [(z, o) for z, o in pool if o["id"] not in used_object_ids])
        if match:
            zone, obj = match
            used_object_ids.add(obj["id"])
            out_entries.append({
                "name": name,
                "role_origin": role,
                "item": item or None,
                "map_zone": zone["name"],
                "tile_x": obj["x"] - zone["world_origin_x"],
                "tile_y": obj["z"] - zone["world_origin_y"],
                "facing": ["north", "south", "west", "east"][obj.get("facingDirection", 0) % 4],
                "source": "rom_matched",
                "matched_object_id": obj["id"],
                "matched_sprite_id": obj["spriteId"],
            })
            total_matched += 1
        else:
            # Spread generated placeholders across the *first* (usually
            # outdoor) zone in the group — good enough as a starting point;
            # the content team reassigns the real sub-zone during design.
            target = map_zones[0]
            key = target["name"]
            if key not in placeholder_cache:
                placeholder_cache[key] = walkable_positions(target, limit=max(len(entries), 8))
                placeholder_cursor[key] = 0
            positions = placeholder_cache[key]
            idx = placeholder_cursor[key] % max(len(positions), 1)
            placeholder_cursor[key] += 1
            tx, tz = positions[idx] if positions else (0, 0)
            out_entries.append({
                "name": name,
                "role_origin": role,
                "item": item or None,
                "map_zone": target["name"],
                "tile_x": tx,
                "tile_y": tz,
                "facing": "south",
                "source": "generated",
                "matched_object_id": None,
                "matched_sprite_id": None,
            })
            total_generated += 1

    out_path = OUT_DIR / f"{zone_id}.json"
    out_path.write_text(json.dumps({"zone_id": zone_id, "npcs": out_entries}, indent=2, ensure_ascii=False))

print(f"Matched to real ROM objects: {total_matched}")
print(f"Generated placeholder positions: {total_generated}")
if zones_with_no_map:
    print(f"npc-inventory zone_ids with no matching MAP_* zone: {zones_with_no_map}")
print(f"Written {len(inventory) - len(zones_with_no_map)} files to {OUT_DIR}")
