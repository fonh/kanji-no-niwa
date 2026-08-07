#!/usr/bin/env python3
"""Rend ce que le joueur VOIT d'une zone, pour pouvoir le regarder sans lui.

POURQUOI (2026-08-07)
---------------------
Les bugs d'affichage de ce projet — personnages en double, figurants dans un
mur, décor manquant — se voient à l'œil et ne se voient QUE à l'œil : aucun
test ne les attrape, et jusqu'ici il fallait qu'un humain joue et envoie une
capture. Ce script ferme la boucle : il compose l'image telle qu'elle sera
affichée (la capture de carte, recalée par la mesure d'ADR-0006) et marque
dessus chaque endroit où le moteur DESSINERA quelqu'un.

Lire le résultat est immédiat :

  - un personnage visible dans les pixels AVEC un marqueur dessus → **doublon**
    (il est peint dans la capture ET dessiné par le moteur) ;
  - un personnage visible SANS marqueur → il est peint dans la capture seule
    (c'est une capture de partie) : lancer scrub_baked_sprites.py sur la zone ;
  - un marqueur sur du vide → le moteur dessine quelqu'un que la capture ne
    montre pas ; c'est le cas normal ;
  - un damier gris au lieu du décor → la zone est servie sans capture
    (rejetée au recalage, ADR-0006).

  python3 scripts/validate/render-zone-preview.py MAP_ROUTE_31
  python3 scripts/validate/render-zone-preview.py MAP_ROUTE_31 --around 23,16
  python3 scripts/validate/render-zone-preview.py MAP_ROUTE_30 --around 8,43 --radius 10
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

REGISTRY = Path("src/data/zone-registry.json")
NPCS = Path("content/map/npcs.json")
TRAINERS = Path("content/map/trainers.json")
ZONES = Path("content/map/zones.json")
OUT_DIR = Path(".scratch/previews")

# Mêmes règles que src/lib/rom-decor.ts — gardées volontairement courtes ici :
# ce script sert à REGARDER, la vérité reste le TypeScript (et ses tests).
OBSTACLE_SPRITES = {
    "SPRITE_TREE",
    "SPRITE_BREAKROCK",
    "SPRITE_ROCK",
    "SPRITE_USOKKY",
    "SPRITE_KABIGON",
}
BALL_SPRITE = "SPRITE_MONSTARBALL"


def load_collectibles() -> set[str]:
    """Les ids de Poké Ball qui portent un texte (src/lib/collectibles.ts)."""
    import re

    src = Path("src/lib/collectibles.ts").read_text()
    return set(re.findall(r"^\s*(obj_[A-Za-z0-9_]+):\s*'", src, re.M))


def served_objects(zone: dict, occupied: set[tuple[int, int]], collectibles: set[str]) -> list[dict]:
    out = []
    warps = {(w["x"], w["z"]) for w in zone["warps"]}
    w, h, terrain = zone["tile_width"], zone["tile_height"], zone["terrain"]
    ox, oy = zone["world_origin_x"], zone["world_origin_y"]
    for o in zone["objects"]:
        tx, ty = o["x"] - ox, o["z"] - oy
        if (o["x"], o["z"]) in warps:
            continue
        if not (0 <= tx < w and 0 <= ty < h) or terrain[ty * w + tx] == "#":
            continue
        if o["spriteId"] in OBSTACLE_SPRITES:
            out.append(o)
            continue
        if o["spriteId"] == BALL_SPRITE:
            if o["id"] in collectibles:
                out.append(o)
            continue
        if (o["x"], o["z"]) in occupied:
            continue
        flag = o.get("eventFlag") or ""
        if flag and flag != "FLAG_NOTHING":
            continue
        out.append(o)
    return out


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        raise SystemExit(__doc__)
    zone_name = args[0]
    around = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--around=")), None)
    if around is None and "--around" in sys.argv:
        around = sys.argv[sys.argv.index("--around") + 1]
    radius = 14
    if "--radius" in sys.argv:
        radius = int(sys.argv[sys.argv.index("--radius") + 1])

    zone = next(z for z in json.load(open(REGISTRY))["zones"] if z["name"] == zone_name)
    zones_doc = json.load(open(ZONES))["zones"]
    map_for_zone_id = {z["zone_id"]: z["map_name"] for z in zones_doc}

    entities = []
    for entry in json.load(open(NPCS)) + json.load(open(TRAINERS)):
        home = entry.get("map_zone") or map_for_zone_id.get(entry["zone_id"])
        posts = [(home, entry.get("tile_x"), entry.get("tile_y"), "")]
        for pl in entry.get("placements") or []:
            posts.append((pl.get("map_zone") or home, pl["tile_x"], pl["tile_y"], " (poste)"))
        for m, tx, ty, tag in posts:
            if m == zone_name and tx is not None:
                entities.append(
                    {
                        "id": (entry.get("npc_id") or entry.get("trainer_id")) + tag,
                        "tx": tx,
                        "ty": ty,
                        "gated": bool(entry.get("unlock_conditions")),
                    }
                )

    ox, oy = zone["world_origin_x"], zone["world_origin_y"]
    occupied = {(e["tx"] + ox, e["ty"] + oy) for e in entities}
    objects = served_objects(zone, occupied, load_collectibles())

    sx, sy = zone["scale_x"], zone["scale_y"]
    px0, py0 = zone["origin_px"], zone["origin_py"]

    if zone["screenshot"]:
        base = Image.open(Path("public") / zone["screenshot"].lstrip("/")).convert("RGB")
    else:
        # Pas de capture : on rend le damier de collision, comme le jeu.
        w, h, terrain = zone["tile_width"], zone["tile_height"], zone["terrain"]
        base = Image.new("RGB", (int(px0 + w * sx) + 4, int(py0 + h * sy) + 4), (18, 20, 26))
        d0 = ImageDraw.Draw(base)
        for ty in range(h):
            for tx in range(w):
                fill = (58, 66, 84) if terrain[ty * w + tx] != "#" else (26, 30, 40)
                d0.rectangle(
                    [px0 + tx * sx, py0 + ty * sy, px0 + (tx + 1) * sx, py0 + (ty + 1) * sy],
                    fill=fill,
                )

    img = base.copy()
    d = ImageDraw.Draw(img, "RGBA")

    def mark(tx, ty, colour, label):
        x = px0 + tx * sx + sx / 2
        y = py0 + ty * sy + sy / 2
        r = max(5.0, sx * 0.42)
        d.ellipse([x - r, y - r, x + r, y + r], outline=colour, width=2)
        d.line([x - r, y, x + r, y], fill=colour, width=1)
        d.line([x, y - r, x, y + r], fill=colour, width=1)
        d.text((x + r + 1, y - 5), label, fill=colour)

    for e in entities:
        mark(e["tx"], e["ty"], (255, 60, 60, 255) if not e["gated"] else (255, 170, 40, 255), e["id"])
    for o in objects:
        mark(o["x"] - ox, o["z"] - oy, (60, 200, 255, 255), o["id"].split("_", 1)[-1])

    if around:
        cx, cy = (int(v) for v in around.split(","))
        box = (
            max(0, int(px0 + (cx - radius) * sx)),
            max(0, int(py0 + (cy - radius) * sy)),
            min(img.width, int(px0 + (cx + radius + 1) * sx)),
            min(img.height, int(py0 + (cy + radius + 1) * sy)),
        )
        img = img.crop(box)

    scale = 3 if img.width < 500 else 2
    img = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{zone_name}.png"
    img.save(out)
    print(f"{out}  ({len(entities)} personnage(s) curaté(s), {len(objects)} objet(s) ROM servi(s))")
    print("  rouge/orange = PNJ ou dresseur curaté (orange = conditionnel)")
    print("  bleu         = objet ROM servi (décor, obstacle, Poké Ball)")
    print("  un personnage VISIBLE SANS marqueur est peint dans la capture → scrub_baked_sprites.py")


if __name__ == "__main__":
    main()
