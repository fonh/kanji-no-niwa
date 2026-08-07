#!/usr/bin/env python3
"""Efface d'une carte les personnages qui y sont peints, et EUX SEULS.

POURQUOI (2026-08-07)
---------------------
Deux méthodes ont échoué avant celle-ci, et elles ont échoué de la même façon :
elles recopiaient un **rectangle** de décor par-dessus la silhouette. Un
rectangle ne connaît pas la forme d'un personnage — il emporte le sol autour de
lui, et on voyait le raccord (une bande de sable au milieu de l'herbe, un carré
plus clair sur la plage de la Route 31).

Ici on ne touche qu'aux pixels du sprite. `find_baked_sprites.py` retrouve la
silhouette par corrélation ET rend la vignette qui a servi : son canal alpha EST
le découpage exact du personnage. On remplace ces pixels-là par ceux d'un
décalage entier de tuiles, choisi pour coller au décor qui entoure la
silhouette. Le sol autour n'est jamais réécrit — donc aucun raccord possible.

    python3 scripts/build/scrub_baked_sprites.py MAP_ROUTE_30 --dry-run
    python3 scripts/build/scrub_baked_sprites.py MAP_ROUTE_30

La carte d'origine est sauvegardée sous scripts/sources/maps-baked/ la première
fois, pour qu'un second passage reparte toujours de l'original.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# Les chemins sont relatifs à la racine du dépôt (comme tous les scripts d'ici),
# mais l'import est voisin de fichier.
sys.path.insert(0, str(Path(__file__).parent))
from find_baked_sprites import NATIVE_TILE, REGISTRY, find  # noqa: E402

# Décalages candidats, en tuiles natives : assez loin pour sortir de la
# silhouette, assez près pour rester dans le même type de terrain.
OFFSETS = [
    (dx * NATIVE_TILE, dy * NATIVE_TILE)
    for dy in range(-3, 4)
    for dx in range(-3, 4)
    if (dx, dy) != (0, 0)
]
SHADOW_RX, SHADOW_RY = 9.0, 5.0  # demi-axes de l'ombre, en pixels
BAKED = Path("scripts/sources/maps-baked")  # les originaux, avant effacement
RING = 3  # épaisseur, en pixels, de la couronne de décor qui juge un décalage


def dilate(mask: np.ndarray, n: int = 1) -> np.ndarray:
    """Élargit le masque de n pixels — les bords antialiasés d'un sprite
    dépassent son alpha, et un liseré oublié se voit autant que le sprite."""
    out = mask.copy()
    for _ in range(n):
        d = out.copy()
        d[1:, :] |= out[:-1, :]
        d[:-1, :] |= out[1:, :]
        d[:, 1:] |= out[:, :-1]
        d[:, :-1] |= out[:, 1:]
        out = d
    return out


def shadow_of(cx: float, cy: float, h: int, w: int) -> np.ndarray:
    """L'ombre au pied du personnage. Le jeu la dessine SOUS le sprite, elle ne
    fait donc pas partie de son alpha — premier essai, on laissait derrière soi
    un petit arc sombre au sol, aussi visible qu'un demi-corps."""
    yy, xx = np.ogrid[:h, :w]
    return ((xx - cx) / SHADOW_RX) ** 2 + ((yy - (cy - 1)) / SHADOW_RY) ** 2 <= 1.0


def scrub(zone_name: str, threshold: float, dry_run: bool) -> int:
    zone = next(z for z in json.load(open(REGISTRY))["zones"] if z["name"] == zone_name)
    shot = Path("public") / zone["screenshot"].lstrip("/")
    # L'original vit HORS de public/maps/ : le registre y cherche ses captures
    # par mot-clé, et une sauvegarde posée à côté se faisait servir à des zones
    # qui partagent le nom (les quatre « Southwest House » ont pris le .baked).
    backup = BAKED / shot.name
    if backup.exists():
        Image.open(backup).convert("RGB").save(shot)

    hits = find(zone_name, threshold, with_template=True)
    if not hits:
        print(f"{zone_name} : aucune silhouette au seuil {threshold}")
        return 0

    img = np.asarray(Image.open(shot).convert("RGB")).astype(np.int32).copy()
    h, w = img.shape[:2]

    # Toutes les silhouettes d'abord : un décalage ne doit jamais aller puiser
    # dans une AUTRE silhouette (sinon on efface un sosie en en recopiant un).
    taken = np.zeros((h, w), dtype=bool)
    masks = []
    for hit in hits:
        x, y, tw, th = hit["px"]
        m = dilate(np.asarray(hit["tpl"])[:, :, 3] > 128)
        mh, mw = m.shape
        full = np.zeros((h, w), dtype=bool)
        full[y : y + mh, x : x + mw] = m[: h - y, : w - x]
        full |= shadow_of(x + tw / 2, y + th, h, w)
        masks.append(full)
        taken |= dilate(full, 2)

    done = 0
    for hit, mask in zip(hits, masks):
        ring = dilate(mask, RING) & ~dilate(mask, 1)
        ry, rx = np.nonzero(ring)
        my, mx = np.nonzero(mask)
        best, best_err = None, None
        for dx, dy in OFFSETS:
            if (
                (ry + dy < 0).any()
                or (ry + dy >= h).any()
                or (rx + dx < 0).any()
                or (rx + dx >= w).any()
                or (my + dy < 0).any()
                or (my + dy >= h).any()
                or (mx + dx < 0).any()
                or (mx + dx >= w).any()
            ):
                continue
            if taken[my + dy, mx + dx].any() or taken[ry + dy, rx + dx].any():
                continue
            err = float(np.abs(img[ry + dy, rx + dx] - img[ry, rx]).mean())
            if best_err is None or err < best_err:
                best, best_err = (dx, dy), err
        if best is None:
            print(f"  ! {hit['sheet']} en {tuple(hit['tile'])} : aucun décor à recopier")
            continue
        dx, dy = best
        if not dry_run:
            img[my, mx] = img[my + dy, mx + dx]
        print(
            f"  {hit['sheet']:<14} tuile={tuple(hit['tile'])} px={tuple(hit['px'][:2])}"
            f"  décalage=({dx // NATIVE_TILE:+d},{dy // NATIVE_TILE:+d}) tuiles"
            f"  raccord={best_err:.1f}"
        )
        done += 1

    if dry_run:
        print(f"{zone_name} : {done} silhouette(s) — essai à blanc, rien écrit")
        return done
    if not backup.exists():
        backup.parent.mkdir(parents=True, exist_ok=True)
        Image.open(shot).convert("RGB").save(backup)
    Image.fromarray(img.astype(np.uint8)).save(shot)
    revalidate_alignment(zone_name, shot)
    print(f"{zone_name} : {done} silhouette(s) effacée(s) → {shot}")
    return done


def revalidate_alignment(zone_name: str, shot: Path) -> None:
    """Réaccorde le recalage mesuré à la nouvelle image.

    ADR-0006 indexe chaque mesure par `fichier:taille` pour qu'une carte
    remplacée ne garde pas le recalage de l'ancienne. Effacer une silhouette
    change la taille du PNG sans déplacer un seul pixel de décor : la mesure
    reste vraie, mais la clé, elle, ne colle plus — et la zone repartait sans
    recalage (grille de collision décalée sur toute la carte). On recolle donc
    la clé, et rien d'autre.
    """
    path = Path("scripts/sources/map-alignment.json")
    doc = json.loads(path.read_text())
    fit = doc["zones"].get(zone_name)
    if not fit or ":" not in fit.get("key", ""):
        return
    # Une même capture sert souvent plusieurs zones (un intérieur de Centre Pokémon
    # est le même dans toutes les villes) : elles ont chacune leur clé, et les
    # oublier casserait le recalage de toutes les autres.
    name = fit["key"].rsplit(":", 1)[0]
    size = shot.stat().st_size
    for other in doc["zones"].values():
        if other.get("key", "").rsplit(":", 1)[0] == name:
            other["key"] = f"{name}:{size}"
    # Même écriture que fit-map-alignment.py, pour ne pas remuer le fichier.
    json.dump({"zones": dict(sorted(doc["zones"].items()))}, open(path, "w"), indent=1)
    print(f"  recalage ADR-0006 réaccordé : {fit['key']}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("zone")
    ap.add_argument("--threshold", type=float, default=30.0)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    scrub(a.zone, a.threshold, a.dry_run)


if __name__ == "__main__":
    main()
