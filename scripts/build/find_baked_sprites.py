#!/usr/bin/env python3
"""Retrouve, dans une carte, les personnages déjà PEINTS dessus.

POURQUOI (2026-08-07)
---------------------
Les images de `public/maps/` contiennent les PNJ que le jeu d'origine posait là.
Le moteur redessine par-dessus ses propres personnages → le joueur voit des
sosies côte à côte.

On les relevait **à l'œil**, tuile par tuile, et on se trompait : une figurine
erre, la capture l'a figée ailleurs ; une fenêtre de recherche trop étroite en
oublie une. Ce script fait le relevé à notre place : une silhouette cuite EST le
sprite de `public/sprites/overworld/`, au pixel près (les cartes sont en
résolution native, 16 px par tuile de décor — la grille de collision, elle, a son
propre pas : cf. ADR-0006). On la cherche donc par corrélation.

COMMENT ÇA TIENT EN QUELQUES SECONDES
-------------------------------------
Comparer 200 planches × une dizaine de vignettes à chaque position d'une carte,
ce serait des heures. Une idée le ramène à quelques secondes : **l'index des
couleurs rares**. Ces sprites sont dessinés à la palette, sans mélange — si une
vignette est là, ses pixels y sont à l'identique. On prend donc les quelques
pixels dont la couleur est la plus rare DANS LA CARTE, et on ne teste que les
positions où ces couleurs apparaissent. La plupart des planches n'ont alors
aucune position à tester du tout.

C'est ce qui permet de balayer TOUT le catalogue, et pas seulement les planches
des objets ROM de la zone — la première version ne cherchait qu'autour de ces
objets, et laissait donc en place tout personnage qu'aucun objet ne mentionne
(un `gsbabyboy1` dans un Poké Mart, par exemple).

    python3 scripts/build/find_baked_sprites.py MAP_ROUTE_31
    python3 scripts/build/find_baked_sprites.py MAP_ROUTE_30 --threshold 26

Sortie : une ligne par silhouette, avec sa boîte en pixels image et la tuile de
collision correspondante. `scrub_baked_sprites.py` la consomme.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image

REGISTRY = Path("src/data/zone-registry.json")
SHEETS = Path("public/sprites/overworld")
NATIVE_TILE = 16  # les cartes sont en résolution native DS
FRAME = 32

#: Pixels échantillonnés pour la mesure d'une position candidate.
FINE_SAMPLES = 90
#: Nombre de pixels « couleur rare » servant à proposer des positions.
RARE_PIXELS = 6
#: Au-delà, une couleur est trop banale pour proposer quoi que ce soit.
RARE_MAX = 4000
#: Rayon de la recherche par balayage autour d'un objet ROM, en cases.
WINDOW_TILES = 5
#: Pixels de la passe grossière du balayage (elle élimine, elle ne décide rien).
COARSE_SAMPLES = 12

#: Familles de planches qui ne sont pas des gens : terrain, objets ramassables,
#: Pokémon suiveurs, panneaux, trophées. Les effacer ouvrirait des passages que
#: le jeu ferme (cf. rom-decor.test.ts) ou retirerait du mobilier.
PAS_DES_GENS = re.compile(
    r"^(tree|rock|breakrock|usokky|kabigon|monstarball|bonguri|bonmi|sign|"
    r"tsure_poke|rotom|mono_pip|scroll|stop|pokewall|leag_door|hou_obj|lug_obj|"
    r"btorophy|gtorophy|storophy|medal|yadon|rapurasu|rgyaradosu|jupetta|"
    r"ice$|fire$|kurumi|aji_peru|ambrella|mystery)"
)


def sheets_catalogue() -> list[Path]:
    """Toutes les planches de personnages."""
    return [p for p in sorted(SHEETS.glob("*.png")) if not PAS_DES_GENS.match(p.stem)]


def frames_of(sheet: Path) -> list[np.ndarray]:
    """Les vignettes d'une planche, recadrées sur leurs pixels opaques, sans
    répétition (beaucoup de planches redessinent la même pose)."""
    im = np.asarray(Image.open(sheet).convert("RGBA"), dtype=np.int16)
    h, w = im.shape[:2]
    out: list[np.ndarray] = []
    vues: set[bytes] = set()
    for row in range(h // FRAME):
        for col in range(w // FRAME):
            f = im[row * FRAME : (row + 1) * FRAME, col * FRAME : (col + 1) * FRAME]
            ys, xs = np.nonzero(f[:, :, 3] > 128)
            if len(ys) < 120:  # vignette vide ou quasi
                continue
            rogne = f[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
            signature = rogne.tobytes()
            if signature in vues:
                continue
            vues.add(signature)
            out.append(rogne)
    return out


def _cle(rgb: np.ndarray) -> np.ndarray:
    a = rgb.astype(np.int32)
    return (a[..., 0] << 16) | (a[..., 1] << 8) | a[..., 2]


class IndexCouleurs:
    """Où chaque couleur RARE apparaît dans la carte."""

    def __init__(self, img: np.ndarray) -> None:
        self.img = img
        cles = _cle(img)
        valeurs, comptes = np.unique(cles, return_counts=True)
        self.frequence = dict(zip(valeurs.tolist(), comptes.tolist()))
        self.positions = {
            int(v): np.nonzero(cles == v)
            for v, c in zip(valeurs.tolist(), comptes.tolist())
            if c <= RARE_MAX
        }

    def candidats(self, tpl: np.ndarray) -> set[tuple[int, int]]:
        m = tpl[:, :, 3] > 128
        ys, xs = np.nonzero(m)
        cles = _cle(tpl[:, :, :3])
        rangs = sorted(
            range(len(ys)),
            key=lambda i: self.frequence.get(int(cles[ys[i], xs[i]]), 1 << 30),
        )[:RARE_PIXELS]
        ymax = self.img.shape[0] - tpl.shape[0]
        xmax = self.img.shape[1] - tpl.shape[1]
        out: set[tuple[int, int]] = set()
        for i in rangs:
            trouve = self.positions.get(int(cles[ys[i], xs[i]]))
            if trouve is None:
                continue
            py, px = trouve
            for yy, xx in zip((py - ys[i]).tolist(), (px - xs[i]).tolist()):
                if 0 <= yy <= ymax and 0 <= xx <= xmax:
                    out.add((yy, xx))
        return out


def best_matches(
    img: np.ndarray, tpl: np.ndarray, threshold: float, index: IndexCouleurs | None = None
) -> list[tuple[int, int, float]]:
    """Positions où `tpl` (RGBA) colle à `img` (RGB), erreur moyenne < seuil."""
    th, tw = tpl.shape[:2]
    if th > img.shape[0] or tw > img.shape[1]:
        return []
    m = tpl[:, :, 3] > 128
    n = int(m.sum())
    if n < 120:
        return []
    idx = index or IndexCouleurs(img)
    cands = idx.candidats(tpl)
    if not cands:
        return []
    ys, xs = np.nonzero(m)
    pas = max(1, n // FINE_SAMPLES)
    sy, sx = ys[::pas], xs[::pas]
    modele = tpl[:, :, :3].astype(np.int32)[sy, sx]

    trouves = []
    for yy, xx in cands:
        err = float(np.abs(img[yy + sy, xx + sx].astype(np.int32) - modele).mean())
        if err < threshold:
            trouves.append((xx, yy, err))
    trouves.sort(key=lambda t: t[2])

    # Une même silhouette ressort à quelques pixels près : ne garder que la
    # meilleure de chaque grappe.
    gardes: list[tuple[int, int, float]] = []
    for x, y, err in trouves:
        if any(abs(x - gx) < tw // 2 and abs(y - gy) < th // 2 for gx, gy, _ in gardes):
            continue
        gardes.append((x, y, err))
    return gardes


def sheet_for(sprite_id: str) -> str | None:
    """SPRITE_* → planche, par la règle de `resolveNpcSprite` (label minuscule)."""
    label = re.sub(r"^SPRITE_", "", sprite_id).lower()
    for cand in (label, re.sub(r"_\d+$", "", label)):
        if not PAS_DES_GENS.match(cand) and (SHEETS / f"{cand}.png").exists():
            return cand
    return None


def scan_matches(img: np.ndarray, tpl: np.ndarray, threshold: float) -> list[tuple[int, int, float]]:
    """Balayage complet d'une fenêtre, sans index — pour les cartes dont la
    palette a bougé (les relevés d'atlas, où seuls ~12 % des pixels d'une
    silhouette tombent juste : l'index des couleurs rares, lui, suppose des
    pixels identiques et ne propose alors aucune position)."""
    th, tw = tpl.shape[:2]
    ih, iw = img.shape[:2]
    if th > ih or tw > iw:
        return []
    m = tpl[:, :, 3] > 128
    n = int(m.sum())
    if n < 120:
        return []
    ys, xs = np.nonzero(m)
    rgb = tpl[:, :, :3].astype(np.int32)

    def erreur(indices) -> np.ndarray:
        acc = np.zeros((ih - th + 1, iw - tw + 1), dtype=np.int32)
        for y, x in zip(ys[indices], xs[indices]):
            fen = img[y : y + ih - th + 1, x : x + iw - tw + 1]
            acc += np.abs(fen.astype(np.int32) - rgb[y, x]).sum(axis=2)
        return acc / (len(indices) * 3.0)

    grossier = erreur(np.arange(0, n, max(1, n // COARSE_SAMPLES)))
    cands = np.argwhere(grossier <= threshold * 2.5)
    if len(cands) == 0:
        return []
    fin = erreur(np.arange(0, n, max(1, n // FINE_SAMPLES)))
    out = []
    for y, x in cands:
        e = float(fin[y, x])
        if e < threshold:
            out.append((int(x), int(y), e))
    out.sort(key=lambda t: t[2])
    gardes: list[tuple[int, int, float]] = []
    for x, y, e in out:
        if any(abs(x - gx) < tw // 2 and abs(y - gy) < th // 2 for gx, gy, _ in gardes):
            continue
        gardes.append((x, y, e))
    return gardes


def find(
    zone_name: str, threshold: float, sheets: list[str] | None = None, with_template: bool = False
) -> list[dict]:
    zone = next(z for z in json.load(open(REGISTRY))["zones"] if z["name"] == zone_name)
    if not zone["screenshot"]:
        raise SystemExit(f"{zone_name} n'a pas de capture")
    img = np.asarray(Image.open(Path("public") / zone["screenshot"].lstrip("/")).convert("RGB"))
    index = IndexCouleurs(img)

    catalogue = sheets_catalogue()
    if sheets:
        voulus = set(sheets)
        catalogue = [p for p in catalogue if p.stem in voulus]

    found: list[dict] = []

    def retenir(planche: str, tpl: np.ndarray, x: int, y: int, err: float) -> None:
        th, tw = tpl.shape[:2]
        # La tuile d'un personnage est celle de ses pieds.
        tx = (x + tw / 2 - zone["origin_px"]) / zone["scale_x"]
        ty = (y + th - NATIVE_TILE / 2 - zone["origin_py"]) / zone["scale_y"]
        found.append(
            {
                "sheet": planche,
                "px": [x, y, tw, th],
                "tile": [round(tx), round(ty)],
                "err": round(err, 1),
                **({"tpl": tpl} if with_template else {}),
            }
        )

    # 1. Tout le catalogue, par l'index des couleurs rares : quelques secondes,
    #    et ça trouve un personnage qu'aucun objet de la zone ne mentionne.
    for planche in catalogue:
        for tpl in frames_of(planche):
            for x, y, err in best_matches(img, tpl, threshold, index):
                retenir(planche.stem, tpl, x, y, err)

    # 2. Autour de chaque objet ROM, avec SA planche, par balayage : plus cher,
    #    mais insensible à un décalage de palette — c'est le cas des cartes
    #    relevées sur atlas plutôt que capturées en jeu.
    ox, oy = zone["world_origin_x"], zone["world_origin_y"]
    pad_x = int(WINDOW_TILES * zone["scale_x"])
    pad_y = int(WINDOW_TILES * zone["scale_y"])
    cache: dict[str, list[np.ndarray]] = {}
    for o in zone["objects"]:
        nom = sheet_for(o["spriteId"])
        if nom is None or (sheets and nom not in set(sheets)):
            continue
        cx = zone["origin_px"] + (o["x"] - ox) * zone["scale_x"]
        cy = zone["origin_py"] + (o["z"] - oy) * zone["scale_y"]
        x0 = max(0, int(cx) - pad_x)
        y0 = max(0, int(cy) - pad_y - FRAME)
        x1 = min(img.shape[1], int(cx) + pad_x + FRAME)
        y1 = min(img.shape[0], int(cy) + pad_y + FRAME)
        if x1 - x0 < FRAME or y1 - y0 < FRAME:
            continue
        fenetre = img[y0:y1, x0:x1]
        if nom not in cache:
            cache[nom] = frames_of(SHEETS / f"{nom}.png")
        for tpl in cache[nom]:
            for x, y, err in scan_matches(fenetre, tpl, threshold):
                retenir(nom, tpl, x0 + x, y0 + y, err)

    # Deux vignettes (ou deux planches qui partagent une palette) tombent souvent
    # sur la même silhouette : on garde la meilleure.
    found.sort(key=lambda f: f["err"])
    kept: list[dict] = []
    for f in found:
        x, y, _, _ = f["px"]
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
