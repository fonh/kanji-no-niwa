#!/usr/bin/env python3
"""Retrouve, dans une carte, les personnages déjà PEINTS dessus.

POURQUOI (2026-08-07)
---------------------
Les images de `public/maps/` sont des captures de partie : les PNJ que le jeu
d'origine posait là sont cuits dans les pixels. Le moteur redessine par-dessus
ses propres personnages → le joueur voit des sosies côte à côte.

Jusqu'ici on relevait ces silhouettes **à l'œil**, tuile par tuile, et on se
trompait (une figurine erre, la capture l'a figée ailleurs ; une fenêtre de
recherche trop étroite en oubliait une). Ce script fait le relevé à notre place :
les silhouettes cuites SONT les sprites de `public/sprites/overworld/`, au même
pixel près. On les cherche donc par corrélation, planche par planche, dans
l'espace-pixel de l'image (les cartes sont en résolution native, 16 px par tuile
de décor — la grille de collision, elle, a son propre pas : cf. ADR-0006).

    python3 scripts/build/find_baked_sprites.py MAP_ROUTE_31
    python3 scripts/build/find_baked_sprites.py MAP_ROUTE_30 --threshold 26

Sortie : une ligne par silhouette trouvée, avec sa boîte en pixels image et la
tuile de collision correspondante. `scrub_baked_sprites.py` la consomme.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

REGISTRY = Path("src/data/zone-registry.json")
SHEETS = Path("public/sprites/overworld")
NATIVE_TILE = 16  # les cartes sont en résolution native DS

# Le sprite d'un personnage tient dans le bas de sa case de 32×32 : on ne garde
# que cette fenêtre, sinon la corrélation se fait sur du vide transparent.
FRAME = 32
# Rayon de recherche autour du point d'apparition de l'objet, en cases.
WINDOW_TILES = 5


# Ces objets-là font partie du décor peint et DOIVENT y rester : un arbre, un
# rocher, une Poké Ball posée au sol sont dessinés par la carte elle-même.
# Les effacer ouvrirait des passages que le jeu ferme (cf. rom-decor.test.ts).
NOT_PEOPLE = {
    "SPRITE_TREE",
    "SPRITE_BREAKROCK",
    "SPRITE_ROCK",
    "SPRITE_USOKKY",
    "SPRITE_KABIGON",
    "SPRITE_MONSTARBALL",
    "SPRITE_BONGURI",
}


def sheet_for(sprite_id: str) -> str | None:
    """SPRITE_* → planche, par la règle de `resolveNpcSprite` (label minuscule)."""
    import re

    if sprite_id in NOT_PEOPLE:
        return None
    label = re.sub(r"^SPRITE_", "", sprite_id).lower()
    for cand in (label, re.sub(r"_\d+$", "", label)):
        if (SHEETS / f"{cand}.png").exists():
            return cand
    return None


def frames_of(sheet: Path) -> list[np.ndarray]:
    """Les vignettes d'une planche, recadrées sur leurs pixels opaques."""
    im = np.asarray(Image.open(sheet).convert("RGBA"), dtype=np.int16)
    h, w = im.shape[:2]
    out = []
    for row in range(h // FRAME):
        for col in range(w // FRAME):
            f = im[row * FRAME : (row + 1) * FRAME, col * FRAME : (col + 1) * FRAME]
            ys, xs = np.nonzero(f[:, :, 3] > 128)
            if len(ys) < 120:  # vignette vide ou quasi
                continue
            out.append(f[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1])
    return out


def best_matches(img: np.ndarray, tpl: np.ndarray, threshold: float) -> list[tuple[int, int, float]]:
    """Positions où `tpl` (RGBA) colle à `img` (RGB), erreur moyenne < seuil."""
    th, tw = tpl.shape[:2]
    ih, iw = img.shape[:2]
    if th > ih or tw > iw:
        return []
    mask = tpl[:, :, 3] > 128
    n = int(mask.sum())
    if n < 120:
        return []
    rgb = tpl[:, :, :3]

    # Somme des |différences| sur les seuls pixels opaques, pour toutes les
    # positions à la fois : on empile les décalages plutôt que de boucler.
    acc = np.zeros((ih - th + 1, iw - tw + 1), dtype=np.int32)
    ys, xs = np.nonzero(mask)
    # Échantillonner suffit pour trier, et divise le coût par 4.
    step = max(1, n // 90)
    for y, x in zip(ys[::step], xs[::step]):
        win = img[y : y + ih - th + 1, x : x + iw - tw + 1]
        acc += np.abs(win.astype(np.int32) - rgb[y, x].astype(np.int32)).sum(axis=2)
    acc = acc / (len(ys[::step]) * 3.0)

    out = []
    work = acc.copy()
    for _ in range(3):
        idx = int(np.argmin(work))
        y, x = divmod(idx, work.shape[1])
        if work[y, x] > threshold:
            break
        out.append((x, y, float(work[y, x])))
        y0, y1 = max(0, y - th // 2), min(work.shape[0], y + th // 2)
        x0, x1 = max(0, x - tw // 2), min(work.shape[1], x + tw // 2)
        work[y0:y1, x0:x1] = 1e9
    return out


def find(
    zone_name: str, threshold: float, sheets: list[str] | None = None, with_template: bool = False
) -> list[dict]:
    zone = next(z for z in json.load(open(REGISTRY))["zones"] if z["name"] == zone_name)
    if not zone["screenshot"]:
        raise SystemExit(f"{zone_name} n'a pas de capture")
    img = np.asarray(Image.open(Path("public") / zone["screenshot"].lstrip("/")).convert("RGB"))

    wanted = sheets or sorted(
        {s for o in zone["objects"] if (s := sheet_for(o["spriteId"])) is not None}
    )

    # On ne balaie pas toute la carte : une silhouette cuite est un objet ROM
    # figé par la capture, à quelques cases de son point d'apparition (les
    # figurants qui errent, `movement` 3/14/15, sont ceux qui bougent). Chercher
    # autour de chaque objet, avec SA planche, coûte mille fois moins cher — et
    # évite les faux positifs à l'autre bout de la carte.
    ox, oy = zone["world_origin_x"], zone["world_origin_y"]
    pad_x = int(WINDOW_TILES * zone["scale_x"])
    pad_y = int(WINDOW_TILES * zone["scale_y"])
    cache: dict[str, list[np.ndarray]] = {}

    found: list[dict] = []
    for o in zone["objects"]:
        name = sheet_for(o["spriteId"])
        if name is None or (sheets and name not in sheets):
            continue
        cx = zone["origin_px"] + (o["x"] - ox) * zone["scale_x"]
        cy = zone["origin_py"] + (o["z"] - oy) * zone["scale_y"]
        x0 = max(0, int(cx) - pad_x)
        y0 = max(0, int(cy) - pad_y - FRAME)
        x1 = min(img.shape[1], int(cx) + pad_x + FRAME)
        y1 = min(img.shape[0], int(cy) + pad_y + FRAME)
        if x1 - x0 < FRAME or y1 - y0 < FRAME:
            continue
        window = img[y0:y1, x0:x1]
        if name not in cache:
            cache[name] = frames_of(SHEETS / f"{name}.png")
        for tpl in cache[name]:
            for x, y, err in best_matches(window, tpl, threshold):
                th, tw = tpl.shape[:2]
                # La tuile d'un personnage est celle de ses pieds.
                fx = x0 + x + tw / 2
                fy = y0 + y + th - NATIVE_TILE / 2
                tx = (fx - zone["origin_px"]) / zone["scale_x"]
                ty = (fy - zone["origin_py"]) / zone["scale_y"]
                found.append(
                    {
                        "sheet": name,
                        "object": o["id"],
                        "px": [x0 + x, y0 + y, tw, th],
                        "tile": [round(tx), round(ty)],
                        "err": round(err, 1),
                        **({"tpl": tpl} if with_template else {}),
                    }
                )

    # Deux vignettes d'une même planche (ou deux planches qui partagent une
    # palette) tombent souvent sur la même silhouette : on garde la meilleure.
    found.sort(key=lambda f: f["err"])
    kept: list[dict] = []
    for f in found:
        x, y, w, h = f["px"]
        if any(abs(x - k["px"][0]) < 12 and abs(y - k["px"][1]) < 16 for k in kept):
            continue
        kept.append(f)
    return kept


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("zone")
    ap.add_argument("--threshold", type=float, default=30.0)
    ap.add_argument("--sheet", action="append")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    kept = find(a.zone, a.threshold, a.sheet)
    if a.json:
        print(json.dumps(kept, indent=2))
        return
    for f in kept:
        print(f"{f['sheet']:<16} px={tuple(f['px'])}  tuile={tuple(f['tile'])}  err={f['err']}")
    print(f"{len(kept)} silhouette(s) au seuil {a.threshold}")


if __name__ == "__main__":
    main()
