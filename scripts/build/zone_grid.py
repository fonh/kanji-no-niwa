"""Géométrie de grille partagée entre les scripts de build de zones.

Extrait de build-zone-registry.py pour que fit-map-alignment.py travaille sur
EXACTEMENT la même grille (rognée) que celle écrite dans le registre — sinon
l'alignement serait calé sur une grille différente de celle utilisée en jeu.
"""

from __future__ import annotations


# Interior rooms are ROM-extracted onto a generic block grid (32×32 for most,
# 96-wide for a few) padded FAR beyond the actual walled room with walkable
# filler — nothing in the collision grid stops a player from wandering into
# the padding, but the screenshot is cropped tight to the real room. Trim
# tile_w/tile_h (and the terrain string) to the real bounding box — walls plus
# every object/warp/ledge actually placed in the room, so no legitimate
# content (e.g. a scripted NPC posed past the nearest wall for a cutscene)
# ends up outside the new bounds.
def interior_bounds(z: dict, tile_w: int, tile_h: int, is_outdoor: bool) -> tuple[int, int]:
    if is_outdoor:
        return tile_w, tile_h
    terrain = z.get("terrain", "")
    solid = [i for i, c in enumerate(terrain) if c != "."]
    if not solid:
        return tile_w, tile_h
    max_x = max(i % tile_w for i in solid)
    max_z = max(i // tile_w for i in solid)
    for o in z.get("objects", []):
        max_x = max(max_x, o.get("x", 0))
        max_z = max(max_z, o.get("z", 0))
    for w in z.get("warps", []):
        max_x = max(max_x, w.get("x", 0))
        max_z = max(max_z, w.get("z", 0))
    for lx, lz, _ldir in z.get("ledges", []):
        max_x = max(max_x, lx)
        max_z = max(max_z, lz)
    return min(max_x + 1, tile_w), min(max_z + 1, tile_h)


def trim_terrain(terrain: str, old_w: int, new_w: int, new_h: int) -> str:
    if not terrain:
        return terrain
    return "".join(terrain[z * old_w : z * old_w + new_w] for z in range(new_h))
