#!/usr/bin/env python3
"""Rend une zone avec sa grille de collision superposée, telle qu'elle sera
réellement posée en jeu (mêmes scale_x/scale_y/origin_px/origin_py que
src/data/zone-registry.json).

C'est l'outil de contrôle visuel de l'alignement carte ↔ collision : rouge =
mur, bleu = eau, rien = praticable. Une zone correctement calée montre du
rouge exactement sur les arbres/bâtiments/falaises et rien sur les chemins,
l'herbe ou le sable. Le moindre décalage saute aux yeux.

  python3 scripts/validate/render-collision-overlay.py MAP_ROUTE_29
  python3 scripts/validate/render-collision-overlay.py MAP_ROUTE_29 --zoom 3
  python3 scripts/validate/render-collision-overlay.py --all --out /tmp/overlays
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw

REGISTRY = Path("src/data/zone-registry.json")
NPCS = Path("content/map/npcs.json")
ZONES = Path("content/map/zones.json")

FILL = {
    "#": (255, 0, 0, 95),    # mur
    "w": (0, 80, 255, 80),   # eau
    "W": (0, 0, 160, 110),   # tourbillon
    "F": (0, 200, 255, 110), # cascade
    "i": (255, 255, 255, 70),# glace
}


def curated_npcs_for(zone_name: str) -> list[dict]:
    """PNJ curatés (content/map/npcs.json) tombant dans cette zone. `map_zone`
    prime quand il est présent (un PNJ d'intérieur garde le zone_id de la ville
    à laquelle il appartient côté contenu) ; sinon on passe par zones.json."""
    if not NPCS.exists():
        return []
    npcs = json.load(open(NPCS))
    zone_ids = set()
    if ZONES.exists():
        for z in json.load(open(ZONES)).get("zones", []):
            if z.get("map_name") == zone_name:
                zone_ids.add(z.get("zone_id"))
    out = []
    for n in npcs:
        target = n.get("map_zone")
        if target is not None:
            if target != zone_name:
                continue
        elif n.get("zone_id") not in zone_ids:
            continue
        if n.get("tile_x") is None:
            continue
        out.append(n)
    return out


def render(zone: dict, out: Path, zoom: float) -> None:
    img_path = Path("public") / zone["screenshot"].lstrip("/")
    im = Image.open(img_path).convert("RGBA")
    W, H = im.size
    px, py = zone["scale_x"], zone["scale_y"]
    ox, oy = zone.get("origin_px", 0.0), zone.get("origin_py", 0.0)
    tw, th, terrain = zone["tile_width"], zone["tile_height"], zone["terrain"]

    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for tz in range(th):
        for tx in range(tw):
            fill = FILL.get(terrain[tz * tw + tx])
            if fill:
                x0, y0 = ox + tx * px, oy + tz * py
                d.rectangle([x0, y0, x0 + px - 1, y0 + py - 1], fill=fill)
    im = Image.alpha_composite(im, ov)

    d2 = ImageDraw.Draw(im)
    for tx in range(tw + 1):
        d2.line([(ox + tx * px, oy), (ox + tx * px, oy + th * py)], fill=(0, 0, 0, 45))
    for tz in range(th + 1):
        d2.line([(ox, oy + tz * py), (ox + tw * px, oy + tz * py)], fill=(0, 0, 0, 45))
    # Emprise de la grille : ce qui déborde est du décor hors carte (border
    # block), normal — ce qui manque à l'intérieur est un défaut de recalage.
    d2.rectangle([ox, oy, ox + tw * px, oy + th * py], outline=(255, 255, 0, 255), width=2)

    # PNJ et objets, aux coordonnées exactes où le moteur les pose : c'est
    # l'outil pour « ce PNJ est mal placé » (issue 13).
    for o in zone.get("objects", []):
        ox_t = o["x"] - zone["world_origin_x"]
        oz_t = o["z"] - zone["world_origin_y"]
        cx, cy = ox + (ox_t + 0.5) * px, oy + (oz_t + 0.5) * py
        d2.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], outline=(0, 200, 255, 255), width=2)
        d2.text((cx + 5, cy - 5), o["spriteId"].replace("SPRITE_", ""), fill=(0, 200, 255, 255))
    for n in curated_npcs_for(zone["name"]):
        cx, cy = ox + (n["tile_x"] + 0.5) * px, oy + (n["tile_y"] + 0.5) * py
        d2.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], outline=(255, 255, 0, 255), width=2)
        d2.text((cx + 6, cy + 3), n.get("name", n["npc_id"]), fill=(255, 255, 0, 255))

    if zoom != 1:
        im = im.resize((int(W * zoom), int(H * zoom)), Image.NEAREST)
    im.convert("RGB").save(out)
    print(f"{zone['name']:34s} → {out}  ({im.size[0]}x{im.size[1]})")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("zones", nargs="*")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--zoom", type=float, default=2.0)
    ap.add_argument("--out", default="/tmp")
    a = ap.parse_args()

    reg = {z["name"]: z for z in json.load(open(REGISTRY))["zones"]}
    names = list(reg) if a.all else a.zones
    if not names:
        ap.error("donner au moins un MAP_* ou --all")
    out_dir = Path(a.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    for name in names:
        z = reg.get(name)
        if z is None:
            print(f"{name}: zone inconnue")
        elif not z["screenshot"]:
            print(f"{name}: pas de screenshot (rendu CollisionCanvas en jeu)")
        else:
            render(z, out_dir / f"{name}.png", a.zoom)


if __name__ == "__main__":
    main()
