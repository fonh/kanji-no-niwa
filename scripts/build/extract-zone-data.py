#!/usr/bin/env python3
"""
Builds a complete zone data file for the app by cross-referencing:
  1. MAP_* constants from pret/pokeheartgold/include/constants/maps.h
  2. Per-map matrix + events assignment from
     pret/pokeheartgold/src/data/map_headers.h (.matrixId / .eventsBank)
  3. The EVERYWHERE map matrix (fielddata/mapmatrix/map_matrix_0000_EVERYWHERE.bin)
     for outdoor zones sharing the world grid, OR each interior/dungeon's own
     private matrix (fielddata/mapmatrix/map_matrix_*.bin) for everything else
     → both give us: which NARC model indices make up the zone, and their
       position within it
  4. Map collision NARC (files/a/0/6/5)
     → gives us: 32x32 walkability grid per model
  5. Zone event JSONs (fielddata/eventdata/zone_event/*.json), resolved by the
     exact filename derived from .eventsBank rather than a name heuristic
     → gives us: NPC/trainer positions (tile coords) and warps

Only zones reachable from the outdoor world (the 76 zones placed directly on
the EVERYWHERE matrix) are extracted, following warps transitively — this
covers every building/cave/gym a player can actually walk into, without
pulling in unused/debug map ids that also exist in the ROM.

Output: scripts/sources/zone-data.json
  {
    "zones": [
      {
        "map_id": 33,
        "name": "MAP_ROUTE_29",
        "grid_x": 17,   <- position of leftmost tile (outdoor zones only)
        "grid_y": 9,
        "grid_w": 3,    <- how many 32-tile columns
        "grid_h": 1,    <- how many 32-tile rows
        "models": [1,2,3],
        "tile_width": 96,
        "tile_height": 32,
        "walkable": [...],  <- (grid_w*32) x (grid_h*32) booleans, row-major
        "objects": [...],   <- from zone_event, tile coords
        "warps": [...]
      },
      ...
    ]
  }
"""

import struct, json, re
from pathlib import Path
from collections import deque

PRET = Path.home() / "pokeheartgold"
OUT_PATH = Path("scripts/sources/zone-data.json")

MATRIX_DIR = PRET / "files/fielddata/mapmatrix/map_matrix"
EVENT_DIR = PRET / "files/fielddata/eventdata/zone_event"
EVERYWHERE_MATRIX_FILE = "map_matrix_0000_EVERYWHERE.bin"

# ── 1. Load MAP_* constants ──────────────────────────────────────────────────

maps_h = (PRET / "include/constants/maps.h").read_text()
map_id_to_name: dict[int, str] = {}
name_to_map_id: dict[str, int] = {}
for m in re.finditer(r"#define\s+(MAP_\w+)\s+(\d+)", maps_h):
    map_id_to_name[int(m.group(2))] = m.group(1)
    name_to_map_id[m.group(1)] = int(m.group(2))
print(f"Loaded {len(map_id_to_name)} MAP_* constants")

# ── 2. Parse map_headers.h for each map's matrix + events assignment ────────

headers_src = (PRET / "src/data/map_headers.h").read_text()
header_info: dict[str, tuple[str, str]] = {}  # name -> (matrix_filename, events_filename)
for m in re.finditer(r"\[(MAP_\w+)\]\s*=\s*\{(.*?)\n\s*\},", headers_src, re.DOTALL):
    name, body = m.group(1), m.group(2)
    mm = re.search(r"\.matrixId\s*=\s*(\S+?),", body)
    em = re.search(r"\.eventsBank\s*=\s*(\S+?),", body)
    if not mm or not em:
        continue

    matrix_file = mm.group(1).replace("NARC_map_matrix_", "", 1)
    if matrix_file.endswith("_bin"):
        matrix_file = matrix_file[:-4] + ".bin"

    events_file = em.group(1).replace("NARC_zone_event_", "", 1)
    if events_file.endswith("_bin"):
        events_file = events_file[:-4] + ".json"

    header_info[name] = (matrix_file, events_file)
print(f"Loaded matrix/events assignment for {len(header_info)} maps")

# ── 3. Parse the shared EVERYWHERE matrix ────────────────────────────────────

everywhere_data = (MATRIX_DIR / EVERYWHERE_MATRIX_FILE).read_bytes()
cursor = 0
ew_w = everywhere_data[cursor]; cursor += 1
ew_h = everywhere_data[cursor]; cursor += 1
ew_has_headers = everywhere_data[cursor]; cursor += 1
ew_has_altitudes = everywhere_data[cursor]; cursor += 1
ew_name_len = everywhere_data[cursor]; cursor += 1
cursor += ew_name_len
ew_count = ew_w * ew_h

ew_headers = struct.unpack_from(f"<{ew_count}H", everywhere_data, cursor); cursor += ew_count * 2
if ew_has_altitudes:
    cursor += ew_count
ew_models = struct.unpack_from(f"<{ew_count}H", everywhere_data, cursor)

print(f"EVERYWHERE matrix: {ew_w}x{ew_h} = {ew_count} cells")

# Build: map_id → list of (grid_col, grid_row, model_index)
map_id_to_cells: dict[int, list[tuple[int, int, int]]] = {}
for idx in range(ew_count):
    model = ew_models[idx]
    header = ew_headers[idx]
    if model == 0xFFFF:
        continue
    col = idx % ew_w
    row = idx // ew_w
    map_id_to_cells.setdefault(header, []).append((col, row, model))

# ── 4. Parse collision NARC ──────────────────────────────────────────────────

narc_path = PRET / "files/a/0/6/5"
narc = narc_path.read_bytes()

hdr_size = struct.unpack_from("<H", narc, 0x0C)[0]
btaf_off = hdr_size
btaf_size = struct.unpack_from("<I", narc, btaf_off + 4)[0]
file_count = struct.unpack_from("<I", narc, btaf_off + 8)[0]
fat = []
for i in range(file_count):
    off = btaf_off + 12 + i * 8
    s, e = struct.unpack_from("<II", narc, off)
    fat.append((s, e))
btnf_off = btaf_off + btaf_size
btnf_size = struct.unpack_from("<I", narc, btnf_off + 4)[0]
gmif_off = btnf_off + btnf_size
gmif_data = gmif_off + 8

print(f"Collision NARC: {file_count} model files")


# Ledge (hop-over) terrain types, keyed by the facing direction that clears
# them — pokeheartgold constants/global_fieldmap.h DIR_* order (N,S,W,E) and
# the jump table in asm/unk_0205CB48.s sub_0205DB68: walking DIR_NORTH hops
# a 0x3A tile, DIR_SOUTH a 0x3B, DIR_WEST a 0x39, DIR_EAST a 0x38. The ledge
# tile itself stays non-walkable; the player lands on the tile beyond it.
LEDGE_DIRS = {0x3A: 0, 0x3B: 1, 0x39: 2, 0x38: 3}

# Terrain classes the app needs to gate movement on. Sources (pokeheartgold):
#  - surfable water = behaviors whose bit0 is set in the _020FCA74 table of
#    src/metatile_behavior.c (0x10-0x15, 0x19, 0x2A, 0x50-0x53, 0x73, 0x78,
#    0x7C — includes waterfall/whirlpool, split out below);
#  - TILE_BEHAVIOR_WATERFALL = 19 (0x13), TILE_BEHAVIOR_WHIRLPOOL = 17 (0x11)
#    from include/constants/metatile_behavior.h;
#  - 0x20 = slippery ice: it appears exclusively in Ice Path, Seafoam
#    Islands and the Mahogany (ice) Gym floors. (0x08, an earlier guess, is
#    the generic cave/forest encounter floor — present in every cave.)
# One char per tile: '#' solid, '.' walkable on foot, 'i' ice (walk + slide),
# 'w' water (surf), 'W' whirlpool (surf), 'F' waterfall (surf; its blocked
# bit is set in the ROM because crossing it needs the HM check, not walking).
SURFABLE = {0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x19, 0x2A, 0x50, 0x51, 0x52, 0x53, 0x73, 0x78, 0x7C}


def terrain_char(byte0: int, blocked: bool) -> str:
    if byte0 == 0x13:
        return "F"
    if byte0 == 0x11:
        return "W"
    if blocked:
        return "#"
    if byte0 in SURFABLE:
        return "w"
    if byte0 == 0x20:
        return "i"
    return "."


def get_walkable_grid(model_index: int) -> tuple[list[bool], list[int]]:
    """Returns (walkable, terrain_type) lists of 1024 entries each
    (32x32, top-to-bottom left-to-right)."""
    if model_index >= len(fat):
        return [True] * 1024, [0] * 1024
    s, e = fat[model_index]
    m = narc[gmif_data + s : gmif_data + e]
    if len(m) < 20 + 0x800:
        return [True] * 1024, [0] * 1024
    perm_size = struct.unpack_from("<I", m, 0)[0]
    if perm_size != 0x800:
        return [True] * 1024, [0] * 1024
    # HGSS land_data layout: 16 bytes of section sizes (perm, buildings,
    # model, BDHC), then magic 0x1234 + u16 length of a variable-size
    # extension block (soundplate rectangles), then the permission grid.
    # 230 of the 676 files have a non-zero extension; reading the grid at a
    # fixed offset 20 shifted those by ext_len/2 tiles (e.g. Route 31's east
    # chunk, ext=8, appeared shifted 4 tiles right, so its south exit no
    # longer faced Route 30's north exit).
    perm_start = 20
    if struct.unpack_from("<H", m, 16)[0] == 0x1234:
        perm_start += struct.unpack_from("<H", m, 18)[0]
    if len(m) < perm_start + 0x800:
        return [True] * 1024
    perm = m[perm_start : perm_start + 0x800]
    # Each tile is 2 bytes: byte0 is a terrain-type ID (0=normal, 2=grass,
    # 6=wall/building, 0x38=ledge, ...) — NOT a simple walkable flag, e.g.
    # grass (2) is walkable despite being non-zero. The actual "blocked"
    # signal is bit 0x80 of byte1 (confirmed against the collision merge
    # writeup for this exact Gen IV format: pokehacking.com/tutorials/
    # collisionmerge/ — the engine checks the MSB of the full 2-byte value
    # to decide hit/no-hit). Using byte0==0 as we originally did wrongly
    # marked walkable terrain (grass, etc.) as solid — confirmed on Route 29,
    # where it split the walkable area into two disconnected regions.
    #
    # Storage order: raw row 0 is the NORTH row, z grows southward. Ground
    # truth is the game's own tile-attribute getter (pokeheartgold,
    # asm/unk_02054648.s, sub_02054824): matrix cell = (z/32)*width + (x/32)
    # and attribute index = (z%32)*32 + (x%32), with matrix row 0 at the top
    # of the world map. An earlier version read rows bottom-to-top, which
    # mirrored every chunk vertically — east-west zone borders survived the
    # mirror (both sides flip identically) but every north-south border
    # compared the wrong rows, disconnecting pairs like Cherrygrove↔Route 30.
    walkable = []
    terrain = []
    for row in range(32):
        for col in range(32):
            byte0 = perm[(row * 32 + col) * 2]
            byte1 = perm[(row * 32 + col) * 2 + 1]
            walkable.append(byte1 & 0x80 == 0)
            terrain.append(byte0)
    return walkable, terrain


def parse_private_matrix(path: Path) -> tuple[int, int, list[int]]:
    """Parses a single-map matrix file → (mat_w, mat_h, models[]).

    Unlike EVERYWHERE, private matrices usually have has_headers=0 (every
    cell trivially belongs to the one map that owns the file), so the
    per-cell header table must only be read when present.
    """
    data = path.read_bytes()
    cursor = 0
    mat_w = data[cursor]; cursor += 1
    mat_h = data[cursor]; cursor += 1
    has_headers = data[cursor]; cursor += 1
    has_altitudes = data[cursor]; cursor += 1
    name_len = data[cursor]; cursor += 1
    cursor += name_len
    count = mat_w * mat_h
    if has_headers:
        cursor += count * 2
    if has_altitudes:
        cursor += count
    models = list(struct.unpack_from(f"<{count}H", data, cursor))
    return mat_w, mat_h, models


# ── 5. Per-map extraction ────────────────────────────────────────────────────

def extract_zone(name: str) -> dict | None:
    info = header_info.get(name)
    if not info:
        return None
    matrix_file, events_file = info
    map_id = name_to_map_id.get(name, -1)

    if matrix_file == EVERYWHERE_MATRIX_FILE:
        cells = map_id_to_cells.get(map_id, [])
        if not cells:
            return None
        cols = [c[0] for c in cells]
        rows = [c[1] for c in cells]
        grid_x, grid_y = min(cols), min(rows)
        grid_w = max(cols) - grid_x + 1
        grid_h = max(rows) - grid_y + 1
        model_grid = {(row - grid_y, col - grid_x): model for (col, row, model) in cells}
    else:
        matrix_path = MATRIX_DIR / matrix_file
        if not matrix_path.exists():
            return None
        mat_w, mat_h, models = parse_private_matrix(matrix_path)
        grid_x, grid_y, grid_w, grid_h = 0, 0, mat_w, mat_h
        model_grid = {}
        for idx, model in enumerate(models):
            if model == 0xFFFF:
                continue
            model_grid[(idx // mat_w, idx % mat_w)] = model

    total_cols, total_rows = grid_w * 32, grid_h * 32
    walkable = [True] * (total_rows * total_cols)
    terrain = ["."] * (total_rows * total_cols)
    ledges: list[list[int]] = []  # [localX, localZ, dir] with DIR_* codes
    models_used: set[int] = set()
    for gr in range(grid_h):
        for gc in range(grid_w):
            model_idx = model_grid.get((gr, gc))
            if model_idx is None:
                continue
            models_used.add(model_idx)
            tile_grid, terrain_grid = get_walkable_grid(model_idx)
            for tr in range(32):
                row_offset = (gr * 32 + tr) * total_cols + gc * 32
                walkable[row_offset : row_offset + 32] = tile_grid[tr * 32 : tr * 32 + 32]
                for tc in range(32):
                    idx = tr * 32 + tc
                    terrain[row_offset + tc] = terrain_char(terrain_grid[idx], not tile_grid[idx])
                    dir_code = LEDGE_DIRS.get(terrain_grid[idx])
                    if dir_code is not None:
                        ledges.append([gc * 32 + tc, gr * 32 + tr, dir_code])

    event_path = EVENT_DIR / events_file
    objects, warps = [], []
    if event_path.exists():
        event = json.loads(event_path.read_text())
        objects = event.get("objects", [])
        warps = event.get("warps", [])

    return {
        "map_id": map_id,
        "name": name,
        "grid_x": grid_x,
        "grid_y": grid_y,
        "grid_w": grid_w,
        "grid_h": grid_h,
        "models": sorted(models_used),
        "tile_width": total_cols,
        "tile_height": total_rows,
        "walkable": walkable,
        "terrain": "".join(terrain),
        "ledges": ledges,
        "objects": objects,
        "warps": warps,
        # Outdoor zones share one continuous coordinate space (the
        # EVERYWHERE matrix) — world_origin_x/y are directly comparable
        # across them, so the map can detect "walked off this zone's edge
        # into the next one". Interior zones each start their own private
        # matrix at (0,0), so their world_origin is not comparable to
        # anything else and must never be used for that lookup.
        "is_outdoor": matrix_file == EVERYWHERE_MATRIX_FILE,
    }


# ── 6. BFS from the outdoor world through every warp ─────────────────────────

root_names = [
    map_id_to_name[mid]
    for mid, cells in map_id_to_cells.items()
    if cells and mid in map_id_to_name
]
print(f"{len(root_names)} outdoor zones on the EVERYWHERE matrix")

visited: dict[str, dict] = {}
seen = set(root_names)
queue = deque(root_names)
skipped: list[str] = []

while queue:
    name = queue.popleft()
    if name in visited:
        continue
    zone = extract_zone(name)
    if zone is None:
        skipped.append(name)
        continue
    visited[name] = zone
    for w in zone["warps"]:
        dest = w.get("header")
        if dest and dest not in seen:
            seen.add(dest)
            queue.append(dest)

zones = list(visited.values())
print(f"Extracted {len(zones)} zones reachable from the outdoor world")
if skipped:
    print(f"Skipped {len(skipped)} referenced maps with no resolvable matrix/events: {skipped}")

OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
with open(OUT_PATH, "w") as f:
    json.dump({"zones": zones}, f, separators=(",", ":"))

size_mb = OUT_PATH.stat().st_size / (1024 * 1024)
print(f"Written to {OUT_PATH} ({size_mb:.1f} MB)")

# Preview Route 29
r29 = next((z for z in zones if z["name"] == "MAP_ROUTE_29"), None)
if r29:
    print(f"\nRoute 29: {r29['tile_width']}x{r29['tile_height']} tiles, {len(r29['objects'])} objects, {len(r29['warps'])} warps")
    blocked = sum(1 for w in r29["walkable"] if not w)
    print(f"Walkable: {sum(r29['walkable'])}, Blocked: {blocked}")
