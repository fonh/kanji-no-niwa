#!/usr/bin/env python3
"""Audits border crossings between adjacent outdoor zones in zone-data.json.

For every pair of outdoor zones whose cells share an edge on the EVERYWHERE
matrix, BFS through the union of both zones' walkable grids (in world tile
coordinates, masked to the matrix cells each zone actually owns) decides
whether the border can be crossed on foot. Pairs that cannot must have a
warp path instead (gatehouse interior, cave, forest...) — the game really
does block those borders and routes the player through a small interior map
whose entrance tiles (terrain types 0x62-0x65 / 0x6C-0x6F, one per facing
direction) trigger the doorless isConnection transition; those entrances are
ordinary entries in the zone_event warp tables, which extract-zone-data.py
already exports.

Expected state: 79 adjacent pairs, 55 crossable on foot, 24 via warps, and
every outdoor zone reachable from MAP_NEW_BARK.
"""
import json, struct, re, collections
from pathlib import Path
from collections import deque

PRET = Path.home() / "pokeheartgold"
ZONE_DATA = Path("scripts/sources/zone-data.json")

# ── EVERYWHERE matrix: which cells belong to which map header ────────────────
data = (PRET / "files/fielddata/mapmatrix/map_matrix/map_matrix_0000_EVERYWHERE.bin").read_bytes()
c = 0
mat_w = data[c]; c += 1
mat_h = data[c]; c += 1
c += 2  # has_headers, has_altitudes
c += 1 + data[c]  # name
n = mat_w * mat_h
headers = struct.unpack_from(f"<{n}H", data, c)

maps_h = (PRET / "include/constants/maps.h").read_text()
id2name = {int(m.group(2)): m.group(1) for m in re.finditer(r"#define\s+(MAP_\w+)\s+(\d+)", maps_h)}
cell_header = {(i % mat_w, i // mat_w): id2name.get(headers[i], "?") for i in range(n)}
cells_of = collections.defaultdict(set)
for cell, hd in cell_header.items():
    cells_of[hd].add(cell)

# ── zones ────────────────────────────────────────────────────────────────────
d = json.load(open(ZONE_DATA))
zones = {z["name"]: z for z in d["zones"]}
outdoor = {nm for nm, z in zones.items() if z.get("is_outdoor") and nm != "MAP_EVERYWHERE"}


def world_walkable(name: str) -> set:
    """Walkable tiles in world coordinates, restricted to owned cells."""
    z = zones[name]
    out = set()
    gx, gy, tw = z["grid_x"], z["grid_y"], z["tile_width"]
    for (ccol, crow) in cells_of[name]:
        for ty in range(32):
            base = ((crow - gy) * 32 + ty) * tw + (ccol - gx) * 32
            for tx in range(32):
                if z["walkable"][base + tx]:
                    out.add((ccol * 32 + tx, crow * 32 + ty))
    return out


pairs = set()
for nm in outdoor:
    for (cc, cr) in cells_of[nm]:
        for dc, dr in ((1, 0), (0, 1)):
            other = cell_header.get((cc + dc, cr + dr))
            if other in outdoor and other != nm:
                pairs.add(tuple(sorted((nm, other))))

wgrids = {nm: world_walkable(nm) for nm in outdoor}
foot_graph = collections.defaultdict(set)
for a, b in sorted(pairs):
    wa, wb = wgrids[a], wgrids[b]
    seen = set(wa)
    q = deque(wa)
    crossable = False
    while q and not crossable:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nk = (x + dx, y + dy)
            if nk in wb:
                crossable = True
                break
            if nk in wa and nk not in seen:
                seen.add(nk)
                q.append(nk)
    if crossable:
        foot_graph[a].add(b)
        foot_graph[b].add(a)

# ── warp graph on top, then reachability from New Bark ───────────────────────
graph = collections.defaultdict(set, {k: set(v) for k, v in foot_graph.items()})
warp_graph = collections.defaultdict(set)
for z in d["zones"]:
    for wp in z["warps"]:
        dest = wp.get("header")
        if dest in zones:
            for g in (graph, warp_graph):
                g[z["name"]].add(dest)
                g[dest].add(z["name"])

n_foot = sum(len(v) for v in foot_graph.values()) // 2
print(f"{len(pairs)} adjacent outdoor pairs: {n_foot} crossable on foot")


def warp_path(a, b, maxlen=4):
    q = deque([(a, [a])])
    seen = {a}
    while q:
        cur, path = q.popleft()
        if len(path) > maxlen:
            continue
        for nxt in warp_graph[cur]:
            if nxt == b:
                return path + [b]
            if nxt not in seen:
                seen.add(nxt)
                q.append((nxt, path + [nxt]))
    return None


bad = 0
for a, b in sorted(pairs):
    if b in foot_graph[a]:
        continue
    p = warp_path(a, b)
    if p:
        print(f"  via warps: {' -> '.join(p)}")
    else:
        bad += 1
        print(f"  UNRESOLVED: {a} <-> {b} — no foot crossing, no warp path")

seen = {"MAP_NEW_BARK"}
q = deque(seen)
while q:
    for nxt in graph[q.popleft()]:
        if nxt not in seen:
            seen.add(nxt)
            q.append(nxt)
print(f"Reachable from MAP_NEW_BARK: {len(seen & outdoor)}/{len(outdoor)} outdoor, {len(seen)}/{len(zones)} total")
if bad or (seen & outdoor) != outdoor:
    raise SystemExit("AUDIT FAILED")
print("Audit OK")
