#!/usr/bin/env python3
"""Recale la grille de collision ROM sur le screenshot de chaque zone.

POURQUOI (issue 13, « les arbres/obstacles sont mal gérés en général ») —
------------------------------------------------------------------------
build-zone-registry.py posait jusqu'ici la grille sur l'image avec

    scale_x = screenshot_w / tile_width
    scale_y = screenshot_h / tile_height

c'est-à-dire l'hypothèse « le screenshot couvre exactement la grille, sans
marge, coin haut-gauche sur la tuile (0,0) ». Les deux moitiés de l'hypothèse
sont fausses :

  * les captures de cartes HGSS sont des rendus 3D à caméra oblique — une
    tuile fait ~16 px de large mais seulement ~12 px de haut (raccourci
    vertical ≈ 0.75), donc le pas n'est PAS déductible de la hauteur d'image ;
  * elles sont recadrées à la main, avec une marge variable de décor hors
    carte (le « border block » que le jeu dessine autour de la zone).

Résultat : la grille était étirée pour remplir l'image, et dérivait — jusqu'à
~20 tuiles verticalement sur Route 29 (pas déduit 17.44 px/tuile au lieu de
12). Les arbres praticables, les murs invisibles et les passages « fermés »
signalés en QA sont tous ce même décalage vu à des endroits différents.

CE QUE FAIT CE SCRIPT
---------------------
Pour chaque zone, il cherche (pitch_x, pitch_y, origin_x, origin_y) qui
maximisent la séparabilité (Fisher) entre la couleur moyenne des tuiles
murées ('#') et celle des tuiles praticables. Bien calée, la grille sépare
nettement canopée/mur d'herbe/sable/sol ; mal calée, les deux populations se
mélangent. Aucune heuristique de couleur codée en dur : c'est la grille ROM
elle-même qui sert d'étiquette.

Le score sert AUSSI de garde qualité : un screenshot qui ne colle à aucun
alignement (capture attribuée à la mauvaise zone, template générique réutilisé)
sort avec un score bas et peut être écarté au profit du rendu CollisionCanvas,
fidèle par construction.

Sortie : scripts/sources/map-alignment.json (commité — le calcul est long,
build-zone-registry.py ne fait plus que le lire).

Usage:
  python3 scripts/build/fit-map-alignment.py                 # toutes les zones
  python3 scripts/build/fit-map-alignment.py MAP_ROUTE_29 …  # zones ciblées
  python3 scripts/build/fit-map-alignment.py --force         # ignore le cache
"""

from __future__ import annotations

import json
import os
import sys
import time
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from zone_grid import interior_bounds, trim_terrain  # noqa: E402

ZONE_DATA = Path("scripts/sources/zone-data.json")
REGISTRY = Path("src/data/zone-registry.json")
# Écrit par build-zone-registry.py : la capture associée à chaque zone AVANT le
# filtre qualité. Indispensable — se baser sur le registre ferait oublier toute
# zone dont la capture vient d'être écartée, donc rendrait le rejet définitif.
MATCHED = Path("scripts/sources/zone-screenshots.json")
OUT = Path("scripts/sources/map-alignment.json")

# Pas candidats, en px par tuile. La caméra HGSS est fixe : 16 px de large,
# 12 px de haut. Les captures publiées sont parfois très légèrement
# redimensionnées, d'où les voisins immédiats. `None` = le pas naïf de
# l'ancienne formule, gardé comme candidat pour les images (surtout des
# intérieurs) qui seraient effectivement recadrées pile sur la grille.
PITCH_X = [15.75, 16.0, 16.25, None]
PITCH_Y = [11.75, 12.0, 12.25, 12.5, None]

# Part de la grille qui doit tomber dans l'image pour qu'un recalage ait un
# sens. Même seuil que MIN_COVERAGE côté build : sous ça, la capture ne montre
# qu'un bout de la zone et sera de toute façon écartée. C'est aussi une garde
# de coût — une capture de 208×192 px pour une grille de 160×128 tuiles
# (≈2560×1536 px) faisait balayer des millions de décalages pour rien.
MIN_COVERAGE = 0.75

# Le verdict « cette capture montre-t-elle bien cette zone ? » est pris par
# build-zone-registry.py, pas ici : la politique peut ainsi changer sans
# relancer 20 minutes de calcul. Ce script ne produit que des mesures.


def fit_zone(terrain: str, tile_w: int, tile_h: int, img_path: Path) -> dict | None:
    rgb = np.ascontiguousarray(Image.open(img_path).convert("RGB"), dtype=np.float64)
    if rgb.ndim != 3:
        return None
    H, W = rgb.shape[:2]

    grid = np.frombuffer(terrain.encode(), dtype=np.uint8).reshape(tile_h, tile_w)
    blocked = (grid == ord("#")).ravel()
    # Une grille quasi uniforme (tout mur ou tout sol) ne porte aucune
    # information : rien à recaler, on garde le comportement historique.
    if blocked.sum() < 20 or (~blocked).sum() < 20:
        return None

    # Image intégrale par canal : moyenne d'un rectangle en O(1), donc un
    # candidat d'alignement se score en une poignée d'opérations vectorielles.
    ii = np.zeros((H + 1, W + 1, 3))
    ii[1:, 1:] = rgb.cumsum(0).cumsum(1)
    xs = np.tile(np.arange(tile_w), (tile_h, 1)).astype(float)
    zs = np.tile(np.arange(tile_h)[:, None], (1, tile_w)).astype(float)

    def score(px, ox, py, oy, frac=0.45):
        # Échantillonne le cœur de chaque tuile (45 %) : les bords portent la
        # transition avec la tuile voisine et brouillent les deux populations.
        cx, cy = ox + (xs + 0.5) * px, oy + (zs + 0.5) * py
        hx, hy = px * frac / 2, py * frac / 2
        x0 = np.clip(np.round(cx - hx), 0, W).astype(int)
        x1 = np.clip(np.round(cx + hx), 0, W).astype(int)
        y0 = np.clip(np.round(cy - hy), 0, H).astype(int)
        y1 = np.clip(np.round(cy + hy), 0, H).astype(int)
        ok = ((x1 > x0) & (y1 > y0)).ravel()
        area = np.maximum((x1 - x0) * (y1 - y0), 1)[..., None]
        f = ((ii[y1, x1] - ii[y0, x1] - ii[y1, x0] + ii[y0, x0]) / area).reshape(-1, 3)
        wall, floor = blocked & ok, (~blocked) & ok
        if wall.sum() < 20 or floor.sum() < 20:
            return -1.0
        sep = np.linalg.norm(f[wall].mean(0) - f[floor].mean(0))
        spread = f[wall].std(0).mean() + f[floor].std(0).mean() + 1e-6
        # × la fraction de tuiles réellement dans l'image : sans ça, pousser
        # la grille hors cadre pour ne garder qu'une poignée de tuiles très
        # contrastées gagnerait toujours.
        return float(sep / spread) * (ok.sum() / ok.size)

    naive_x, naive_y = W / tile_w, H / tile_h
    best = None
    for py in PITCH_Y:
        py = naive_y if py is None else py
        for px in PITCH_X:
            px = naive_x if px is None else px
            # Un pas qui étale la grille bien au-delà de l'image ne peut de
            # toute façon pas en couvrir MIN_COVERAGE : aucun décalage n'y
            # changerait rien, et le balayage coûterait des millions
            # d'évaluations (une capture 208×192 pour une grille de 160×128
            # tuiles bloquait la passe pendant plus d'une heure).
            if (W * H) < MIN_COVERAGE * (px * tile_w) * (py * tile_h):
                continue
            # La marge de recadrage vit forcément entre « grille collée à
            # gauche » (0) et « collée à droite » (W - px·tile_w) ; ±8 px de
            # jeu autour pour les captures rognées un peu trop court.
            sx, sy = W - px * tile_w, H - py * tile_h
            for oy in np.arange(min(0, sy) - 8, max(0, sy) + 8.1, 2.0):
                for ox in np.arange(min(0, sx) - 8, max(0, sx) + 8.1, 2.0):
                    s = score(px, ox, py, oy)
                    if best is None or s > best[0]:
                        best = (s, px, ox, py, oy)

    s, px, ox, py, oy = best
    # Raffinage par descente de coordonnées, axe par axe. Le pas compte autant
    # que l'offset : sur une carte de 96 tuiles, 0.25 px/tuile d'erreur de pas
    # = 24 px de dérive au bout, soit une tuile et demie.
    for _ in range(3):
        for px2 in np.arange(px - 0.30, px + 0.301, 0.02):
            for ox2 in np.arange(ox - 3, ox + 3.01, 0.5):
                v = score(px2, ox2, py, oy)
                if v > s:
                    s, px, ox = v, px2, ox2
        for py2 in np.arange(py - 0.30, py + 0.301, 0.02):
            for oy2 in np.arange(oy - 3, oy + 3.01, 0.5):
                v = score(px, ox, py2, oy2)
                if v > s:
                    s, py, oy = v, py2, oy2
    return {
        "pitch_x": round(float(px), 4),
        "pitch_y": round(float(py), 4),
        "origin_x": round(float(ox), 2),
        "origin_y": round(float(oy), 2),
        "score": round(float(s), 4),
        "naive_score": round(float(score(naive_x, 0, naive_y, 0)), 4),
    }


def _work(job: tuple) -> tuple:
    """Un job = une zone. Isolé au niveau module pour être picklable."""
    name, terrain, tw, th, img, key = job
    try:
        res = fit_zone(terrain, tw, th, Path(img))
    except Exception as exc:  # une image illisible ne doit pas tuer la passe
        return name, None, f"{type(exc).__name__}: {exc}"
    if res is not None:
        res["key"] = key
    return name, res, None


def _flush(cache: dict) -> None:
    """Écrit le cache après chaque lot : la passe complète dure ~20 min et se
    fait interrompre (fermeture de session, Ctrl-C) — sans ça, tout est perdu
    et il faut tout recalculer."""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUT.with_suffix(".json.tmp")
    json.dump({"zones": dict(sorted(cache.items()))}, open(tmp, "w"), indent=1)
    tmp.replace(OUT)


def main() -> None:
    argv = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv

    raw = {z["name"]: z for z in json.load(open(ZONE_DATA))["zones"]}
    reg = {z["name"]: z for z in json.load(open(REGISTRY))["zones"]}
    matched = json.load(open(MATCHED)) if MATCHED.exists() else {}
    cache = json.load(open(OUT))["zones"] if OUT.exists() and not force else {}

    jobs: list[tuple] = []
    for name in (argv or list(raw)):
        z = raw.get(name)
        if z is None:
            continue
        if name in matched:
            img = Path("public/maps") / matched[name]
        else:
            shot = reg.get(name, {}).get("screenshot", "")
            img = Path("public") / shot.lstrip("/") if shot else None
        if not img or not img.exists():
            cache.pop(name, None)
            continue
        key = f"{img.name}:{img.stat().st_size}"
        if not force and cache.get(name, {}).get("key") == key:
            continue
        tw, th = interior_bounds(z, z.get("tile_width", 32), z.get("tile_height", 32),
                                 z.get("is_outdoor", False))
        terrain = trim_terrain(z.get("terrain", ""), z.get("tile_width", 32), tw, th)
        if len(terrain) != tw * th:
            continue
        jobs.append((name, terrain, tw, th, str(img), key))

    print(f"{len(jobs)} zones à recaler ({len(cache)} déjà en cache)", flush=True)
    if not jobs:
        _flush(cache)
        return

    t0 = time.time()
    workers = max(1, min(len(jobs), (os.cpu_count() or 2) - 1))
    done = 0
    with Pool(workers) as pool:
        for name, res, err in pool.imap_unordered(_work, jobs):
            done += 1
            if err:
                print(f"[{done}/{len(jobs)}] {name:38s} ÉCHEC — {err}", flush=True)
                continue
            if res is None:
                cache.pop(name, None)
                continue
            cache[name] = res
            print(f"[{done}/{len(jobs)}] {name:38s} pitch=({res['pitch_x']:.2f},{res['pitch_y']:.2f}) "
                  f"origin=({res['origin_x']:+.1f},{res['origin_y']:+.1f}) "
                  f"score={res['score']:.3f} (naïf {res['naive_score']:.3f})", flush=True)
            if done % 10 == 0:
                _flush(cache)

    _flush(cache)
    print(f"\n→ {OUT} : {len(cache)} zones calées "
          f"({time.time() - t0:.0f}s, {workers} processus)")


if __name__ == "__main__":
    main()
