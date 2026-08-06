#!/usr/bin/env python3
"""Canopy/collision-hole scanner v2 (issue 13, 3rd Route 29 report).

Two fixes over the v1 draft (.scratch/kanji-no-niwa/canopy_scan_draft.py):

1. Connected-component analysis instead of per-tile neighbour-counting.
   v1 flagged a walkable "wall-coloured" tile only if >=60% of its own
   8-neighbours were '#' — a tile in the MIDDLE of a large hole has almost
   no '#' neighbours (just more hole), so v1 structurally could not see
   large holes (confirmed: missed a ~190-tile hole on Route 29, only
   caught its edge). v2 clusters contiguous "wall-coloured" walkable
   tiles into regions first, then checks the wall fraction of the
   region's OUTER border (not each interior tile individually).

2. Per-zone k-means color clustering instead of one blanket wall-color
   mean. v1 averaged tree-green, cliff-gray and water-blue into a single
   "wall color" per zone, which both hid real holes (average doesn't
   match any real material) and produced false positives elsewhere
   (Route 30: cliff/bridge gray coincidentally close to the same
   blended average as pine green). v2 clusters '#'-tile colors into k
   groups per zone and compares each candidate tile to its NEAREST wall
   cluster, not a single mean.

A third guard (not in v1 at all): zones where wall-color and non-wall
mean colors aren't well separated (e.g. Ruins of Alph: uniform
rock/water, low contrast) are skipped outright rather than scanned with
a method that has no discriminative power there.

Usage:
    python3 canopy_scan_v2.py [--source raw|registry] [--zone MAP_X ...]

--source raw: reads terrain straight from scripts/sources/zone-data.json
(ignores OUTDOOR_TERRAIN_PATCHES) — used to sanity-check the scanner
against already-known, already-fixed Route 29 holes.
--source registry (default): reads the current, patched terrain from
src/data/zone-registry.json — used for real prospecting on other zones.

Output is always a "go look at this" candidate list, never an
auto-fix — every flagged region still needs a human visual check
(composite render) before any terrain is touched, same discipline as
the manual fixes that came before this tool (issue 13).

Validated 2026-08-05 (default params: --wall-dist 30 --border-frac 0.55
--min-size 4), see issue 13 for the full session:
  - Calibration (MAP_ROUTE_29, --source raw, ignoring the two already-fixed
    OUTDOOR_TERRAIN_PATCHES bands): 96% recall of the 211 already-known
    real-hole tiles (203-206/211 depending which of two equivalent
    connected-region groupings you count), captured by a small number of
    connected regions rather than hundreds of scattered candidate tiles.
  - Known-clean zones (MAP_NEW_BARK, MAP_CHERRYGROVE): 0 candidate regions
    (down from v1, which flagged hundreds of individual tiles on most
    outdoor zones regardless of whether they had real holes).
  - MAP_ROUTE_30 (a zone v1 was especially noisy on: 477 candidate tiles
    unfiltered / 21 with v1's neighbour filter, 0 of them real): v2 flags
    exactly 1 small connected region (7 tiles) — still a false positive
    (decorative flowers, not canopy) but a ~30-680x reduction in what a
    human has to look at.
  - Real, previously-unknown holes found and fixed this session by
    following up v2's candidates with a visual composite check: 2 on
    MAP_ROUTE_29 (55 + 41 tiles — see OUTDOOR_TERRAIN_PATCHES in
    build-zone-registry.py for the exact tiles and verification method).
  - Confirmed false positives this session (flagged by the scanner,
    visually rejected, NOT walled): decorative pond/lake tiles on
    MAP_ROUTE_29 (marked walkable '.', not the water terrain char, in the
    source data — legitimately walkable, just colored like water) and on
    MAP_ROUTE_30 (a flower patch). Water/decorative-ground colour is the
    main remaining false-positive source; the scanner has no water
    detector.

Verdict: NOT promoted to scripts/validate/ (this repo's convention there
is a deterministic pass/fail linter wired into `npm run validate:content`
— see the other scripts/validate/*.py files). This tool can't meet that
bar even at this precision: every flagged region still needs a human to
look at a composite render before any conclusion is drawn (water and
flower patches will always partially alias with tree/cliff colour on a
64-color-ish screenshot palette). It's a genuinely good PRESELECTION tool
now — worth running whenever a new "walked through trees" report comes
in, on the specific zone reported — kept here as a manual tool, not
wired into any automated check.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.cluster.vq import kmeans2

ROOT = Path("/Users/henrifontanille/Documents/pokedex_kanji")
REGISTRY = ROOT / "src/data/zone-registry.json"
RAW_SOURCE = ROOT / "scripts/sources/zone-data.json"


def dist(a, b) -> float:
    return math.sqrt(sum((a[i] - b[i]) ** 2 for i in range(3)))


def sample_tile_color(img: Image.Image, tx: int, tz: int, sx: float, sy: float, box_frac: float = 0.5):
    cx, cy = (tx + 0.5) * sx, (tz + 0.5) * sy
    bw, bh = max(1.0, sx * box_frac), max(1.0, sy * box_frac)
    x0, x1 = max(0, int(cx - bw / 2)), min(img.width, int(cx + bw / 2) + 1)
    y0, y1 = max(0, int(cy - bh / 2)), min(img.height, int(cy + bh / 2) + 1)
    if x1 <= x0 or y1 <= y0:
        return None
    region = img.crop((x0, y0, x1, y1))
    arr = np.asarray(region, dtype=float).reshape(-1, 3)
    if arr.size == 0:
        return None
    return tuple(arr.mean(axis=0))


def sample_zone_colors(zone: dict, terrain: str) -> dict[tuple[int, int], tuple[str, tuple]]:
    img = Image.open(ROOT / "public" / zone["screenshot"].lstrip("/")).convert("RGB")
    sx, sy = zone["scale_x"], zone["scale_y"]
    tw, th = zone["tile_width"], zone["tile_height"]
    out = {}
    for tz in range(th):
        for tx in range(tw):
            idx = tz * tw + tx
            if idx >= len(terrain):
                continue
            c = sample_tile_color(img, tx, tz, sx, sy)
            if c is None:
                continue
            out[(tx, tz)] = (terrain[idx], c)
    return out


def cluster_wall_colors(wall_colors: list[tuple], k: int = 3, seed: int = 0) -> list[tuple]:
    arr = np.array(wall_colors)
    if len(wall_colors) < k * 5:
        return [tuple(arr.mean(axis=0))]
    try:
        centroids, _labels = kmeans2(arr, k, seed=seed, minit="++")
    except Exception:
        return [tuple(arr.mean(axis=0))]
    return [tuple(c) for c in centroids]


def connected_components(tiles: set[tuple[int, int]]) -> list[set[tuple[int, int]]]:
    visited: set[tuple[int, int]] = set()
    comps = []
    for start in tiles:
        if start in visited:
            continue
        stack = [start]
        visited.add(start)
        comp = set()
        while stack:
            t = stack.pop()
            comp.add(t)
            tx, tz = t
            for dx, dz in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (tx + dx, tz + dz)
                if n in tiles and n not in visited:
                    visited.add(n)
                    stack.append(n)
        comps.append(comp)
    return comps


def scan_zone(
    zone: dict,
    terrain: str,
    wall_dist_threshold: float = 30.0,
    border_wall_frac: float = 0.55,
    min_component_size: int = 4,
    contrast_min: float = 25.0,
    k: int = 3,
) -> dict:
    if not zone.get("screenshot") or not terrain:
        return {"skipped": "no screenshot or terrain"}
    tw, th = zone["tile_width"], zone["tile_height"]
    if len(terrain) != tw * th:
        return {"skipped": "terrain length mismatch"}

    try:
        colors = sample_zone_colors(zone, terrain)
    except FileNotFoundError:
        return {"skipped": "screenshot file missing"}

    wall_colors = [c for (ch, c) in colors.values() if ch == "#"]
    other_colors = [c for (ch, c) in colors.values() if ch != "#"]
    if len(wall_colors) < 20 or len(other_colors) < 10:
        return {"skipped": "too few wall/other tiles"}

    wall_clusters = cluster_wall_colors(wall_colors, k=k)
    other_mean = tuple(np.mean(other_colors, axis=0))

    min_cluster_separation = min(dist(c, other_mean) for c in wall_clusters)
    if min_cluster_separation < contrast_min:
        return {"skipped": f"low contrast ({min_cluster_separation:.1f} < {contrast_min})"}

    suspicious: set[tuple[int, int]] = set()
    for (tx, tz), (ch, c) in colors.items():
        if ch != ".":
            continue
        d_wall = min(dist(c, wc) for wc in wall_clusters)
        d_other = dist(c, other_mean)
        if d_wall < d_other and d_wall < wall_dist_threshold:
            suspicious.add((tx, tz))

    def terrain_at(tx, tz):
        if not (0 <= tx < tw and 0 <= tz < th):
            return None
        return terrain[tz * tw + tx]

    flagged = []
    for comp in connected_components(suspicious):
        if len(comp) < min_component_size:
            continue
        border = set()
        for (tx, tz) in comp:
            for dx, dz in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (tx + dx, tz + dz)
                if n not in comp:
                    border.add(n)
        border_tiles = [terrain_at(*n) for n in border]
        border_tiles = [b for b in border_tiles if b is not None]
        if not border_tiles:
            continue
        wall_frac = sum(1 for b in border_tiles if b == "#") / len(border_tiles)
        if wall_frac >= border_wall_frac:
            flagged.append(
                {
                    "tiles": sorted(comp),
                    "size": len(comp),
                    "border_wall_frac": round(wall_frac, 2),
                }
            )

    flagged.sort(key=lambda f: -f["size"])
    return {
        "flagged": flagged,
        "wall_clusters": [tuple(round(v) for v in c) for c in wall_clusters],
        "other_mean": tuple(round(v) for v in other_mean),
        "n_suspicious": len(suspicious),
        "n_wall_tiles": len(wall_colors),
    }


def load_registry_zones() -> list[dict]:
    return json.load(open(REGISTRY))["zones"]


def load_raw_terrain(zone_name: str) -> str | None:
    zones = json.load(open(RAW_SOURCE))["zones"]
    for z in zones:
        if z["name"] == zone_name:
            return z.get("terrain", "")
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=["raw", "registry"], default="registry")
    ap.add_argument("--zone", action="append", default=None)
    ap.add_argument("--wall-dist", type=float, default=30.0)
    ap.add_argument("--border-frac", type=float, default=0.55)
    ap.add_argument("--min-size", type=int, default=4)
    args = ap.parse_args()

    registry_zones = load_registry_zones()
    by_name = {z["name"]: z for z in registry_zones}
    names = args.zone if args.zone else [z["name"] for z in registry_zones if z.get("is_outdoor")]

    total_scanned = 0
    total_flagged_zones = 0
    for name in names:
        zone = by_name.get(name)
        if not zone or not zone.get("is_outdoor"):
            continue
        if args.source == "raw":
            terrain = load_raw_terrain(name)
        else:
            terrain = zone.get("terrain")
        if terrain is None:
            continue
        total_scanned += 1
        result = scan_zone(
            zone,
            terrain,
            wall_dist_threshold=args.wall_dist,
            border_wall_frac=args.border_frac,
            min_component_size=args.min_size,
        )
        if result.get("skipped"):
            continue
        flagged = result["flagged"]
        if not flagged:
            continue
        total_flagged_zones += 1
        print(f"\n=== {name} ({zone['screenshot']}) ===")
        print(f"  wall_clusters={result['wall_clusters']} other_mean={result['other_mean']} n_suspicious={result['n_suspicious']}")
        for f in flagged:
            xs = [t[0] for t in f["tiles"]]
            zs = [t[1] for t in f["tiles"]]
            print(f"  REGION size={f['size']} border_wall_frac={f['border_wall_frac']} bbox=x[{min(xs)},{max(xs)}] z[{min(zs)},{max(zs)}]")
            if f["size"] <= 30:
                print(f"    tiles={f['tiles']}")

    print(f"\n{total_scanned} zones scanned, {total_flagged_zones} with flagged region(s)")


if __name__ == "__main__":
    main()
