#!/usr/bin/env python3
"""Efface les personnages incrustés dans les captures de cartes.

POURQUOI (issue 13, « compte tous les npc en double »)
------------------------------------------------------
Les captures utilisées comme fond de carte ne sont pas des rendus de décor :
ce sont des captures de partie. Les PNJ y sont peints dans les pixels — et
pour certaines, l'avatar du joueur qui a pris la capture aussi, son Pokémon
suiveur avec. Le moteur dessine ensuite SES sprites par-dessus, aux positions
de la ROM : chaque personnage apparaît donc deux fois, à une tuile près.

Dans le labo d'Elm, ça donne trois doublons : le Pr. Elm, son assistant, et un
dresseur fantôme (+ son Chikorita) planté au milieu de la pièce qui double le
joueur.

CE QUE FAIT CE SCRIPT
---------------------
Pour chaque personnage incrusté : recopie un morceau de sol propre pris
AILLEURS DANS LA MÊME IMAGE, décalé d'un nombre ENTIER de tuiles pour que le
motif du carrelage retombe en phase. Pas de génération, pas d'interpolation —
juste des pixels de la même image, donc rien d'inventé.

L'original n'est jamais modifié : la sortie est un nouveau fichier
`<nom> (sans PNJ).png`, référencé par ZONE_SCREENSHOT_OVERRIDES dans
build-zone-registry.py. Relancer le script régénère la sortie à l'identique.

  python3 scripts/build/scrub-baked-npcs.py            # écrit les images
  python3 scripts/build/scrub-baked-npcs.py --preview  # marque les zones en rouge
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

MAPS = Path("public/maps")
REGISTRY = Path("src/data/zone-registry.json")

# ── Mode automatique (2026-08-06) ────────────────────────────────────────────
#
# La table JOBS ci-dessous demande des rectangles en PIXELS, mesurés à la main :
# tenable pour une pièce, pas pour les 462 zones. Or on sait déjà OÙ sont les
# personnages incrustés — ce sont les tuiles où la ROM pose ses objets, à la
# tuile près (c'est bien pour ça qu'ils font doublon). Il suffit donc de lister
# les TUILES, et de laisser le script :
#   - convertir tuile → rectangle pixel, avec le recalage mesuré du registre
#     (ADR-0006 : scale_x/scale_y/origin_px/origin_py, jamais une formule) ;
#   - choisir tout seul d'où recopier le sol propre : il essaie les décalages
#     d'un nombre ENTIER de tuiles autour, écarte ceux qui retomberaient sur un
#     autre personnage à effacer, et garde celui dont le POURTOUR ressemble le
#     plus à celui de la destination. C'est ce pourtour qui décide, parce que
#     c'est lui qu'on verra se raccorder — ou pas.
#
# ÉTAT AU 2026-08-06 : le REPÉRAGE marche (--preview encadre chaque personnage
# incrusté, la liste ci-dessous a été établie comme ça, planche-contact à
# l'appui). Le BOUCHAGE, lui, n'est pas au niveau : deux méthodes essayées —
# recopier le rectangle voisin décalé d'un nombre entier de tuiles, puis
# répéter la tuile de sol la plus uniforme du voisinage — et les deux abîment
# la carte plus qu'elles ne la réparent (un bloc d'arbres recopié sur le
# chemin, une bande de sable en travers de la route, des moitiés de
# personnages qui restent). Le mode automatique n'est donc PAS branché sur la
# sortie : `run_auto` ne produit une image qu'en --preview.
#
# Ce qui manquerait pour le faire proprement : détourer le sprite (on connaît
# son spriteId, donc sa planche dans public/sprites/overworld/) au lieu de
# deviner un rectangle, et reconstruire le sol tuile par tuile d'après la
# grille de collision plutôt qu'à la ressemblance de couleur. À reprendre à
# tête reposée — une carte abîmée se voit plus qu'un doublon.
#
# Ajouter une zone = ajouter une ligne de tuiles. Rien à mesurer.
AUTO_JOBS: dict[str, list[tuple[int, int]]] = {
    # Route 30 : la capture a été prise en cours de partie, avec les dresseurs
    # et les figurants du jeu d'origine en place. Sept personnages peints.
    "MAP_ROUTE_30": [(6, 10), (4, 18), (8, 37), (8, 38), (8, 39), (8, 41), (9, 44), (10, 47), (13, 78)],
    # Route 31 : le promeneur du bord de l'eau et l'homme de l'ouest.
    "MAP_ROUTE_31": [(52, 17), (28, 15)],
    # Tour Grospignon 1F : les deux sages et les deux visiteuses du rez.
    "MAP_SPROUT_TOWER_1F": [(17, 24), (15, 20), (11, 19), (11, 15)],
}

# Combien de tuiles autour de la destination on accepte d'aller chercher du sol.
AUTO_SEARCH_TILES = 6

# source_file -> (pas de tuile (px, py), [ (nom, dest_rect, source) ])
#
# dest_rect = (x0, y0, x1, y1) englobant le personnage ET son ombre.
# source, deux formes :
#   ("shift", dx_tuiles, dy_tuiles)  recopie le rectangle voisin décalé d'un
#       nombre entier de tuiles — conserve les détails du sol quand il y en a ;
#   ("tile", sx, sy)                 répète UNE tuile de sol propre prise en
#       (sx, sy) sur tout le rectangle — pour les endroits (allée centrale du
#       labo) où aucun voisin décalé n'est libre de mobilier.
# Le pas vient du recalage mesuré (scripts/sources/map-alignment.json).
JOBS: dict[str, tuple[tuple[float, float], list]] = {
    "Elms lab 1F HGSS.png": (
        (15.67, 12.06),
        [
            # Pr. Elm peint devant la poubelle verte : on ne touche qu'à partir
            # de y=59, la poubelle (y 43-58) est du décor, elle reste.
            ("elm", (84, 59, 106, 87), ("shift", -2, 0)),
            # Le dresseur fantôme + son Chikorita, au milieu de l'allée : entre
            # les vitrines et sous la rangée de machines, aucun rectangle voisin
            # n'est libre — on répète la tuile de sol la plus uniforme de
            # l'image (tuile 3,12, écart-type 4.9 : du carrelage et rien d'autre).
            ("ghost_trainer", (83, 95, 107, 139), ("tile", 38, 162)),
            ("assistant", (127, 147, 153, 179), ("tile", 38, 162)),
        ],
    ),
}


def load_registry() -> dict:
    zones = json.loads(REGISTRY.read_text())["zones"]
    return {z["name"]: z for z in zones}


def tile_rect(zone: dict, tx: int, ty: int) -> tuple[int, int, int, int]:
    """Rectangle pixel couvrant le personnage debout sur cette tuile.

    Un sprite overworld déborde vers le HAUT (la tuile, c'est ses pieds) et
    d'un cheveu sur les côtés. Marge volontairement large : un reste de
    chapeau oublié se voit plus qu'un carré de sol un peu grand."""
    sx, sy = zone["scale_x"], zone["scale_y"]
    px = zone["origin_px"] + tx * sx
    py = zone["origin_py"] + ty * sy
    return (
        int(round(px - 0.5 * sx)),
        int(round(py - 2.0 * sy)),
        int(round(px + 1.5 * sx)),
        int(round(py + 0.5 * sy)),
    )


def _edge_pixels(im: Image.Image, rect: tuple[int, int, int, int]) -> list:
    """Le pourtour d'un rectangle : la seule chose qui doit se raccorder."""
    x0, y0, x1, y1 = rect
    px = im.load()
    out = []
    for x in range(x0, x1):
        out.append(px[x, y0])
        out.append(px[x, y1 - 1])
    for y in range(y0, y1):
        out.append(px[x0, y])
        out.append(px[x1 - 1, y])
    return out


def _rects_overlap(a, b) -> bool:
    return not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1])


def _stats(im: Image.Image, rect):
    """Moyenne et écart-type d'un rectangle, par canal confondu."""
    px = im.load()
    n = 0
    total = 0
    sq = 0
    for y in range(rect[1], rect[3]):
        for x in range(rect[0], rect[2]):
            v = sum(px[x, y]) / 3
            total += v
            sq += v * v
            n += 1
    mean = total / n
    return mean, max(0.0, sq / n - mean * mean) ** 0.5


def pick_source_tile(im: Image.Image, zone: dict, rect, forbidden):
    """LA tuile de sol propre à répéter sur le rectangle.

    Une tuile répétée, pas un rectangle voisin recopié : c'est la seule façon
    sûre. Un rectangle voisin fait la taille d'un personnage (1×2 tuiles) et
    tombe presque toujours à cheval sur deux terrains — l'essai précédent a
    recopié un bloc d'arbres sur un chemin. Une TUILE, elle, est par
    construction d'un seul tenant.

    Choix : parmi les tuiles voisines, la plus UNIFORME (écart-type faible =
    du sol et rien d'autre) dont la teinte moyenne est la plus proche de celle
    du pourtour de la destination. On préfère la plus proche à qualité égale.
    """
    sx, sy = zone["scale_x"], zone["scale_y"]
    edge = _edge_pixels(im, rect)
    target_mean = sum(sum(c) / 3 for c in edge) / len(edge)
    tw, th = int(round(sx)), int(round(sy))
    tx0 = (rect[0] + rect[2]) // 2
    ty0 = (rect[1] + rect[3]) // 2
    best, best_score = None, None
    for dy in range(-AUTO_SEARCH_TILES, AUTO_SEARCH_TILES + 1):
        for dx in range(-AUTO_SEARCH_TILES, AUTO_SEARCH_TILES + 1):
            x = int(round(tx0 + dx * sx)) - tw // 2
            y = int(round(ty0 + dy * sy)) - th // 2
            cand = (x, y, x + tw, y + th)
            if cand[0] < 0 or cand[1] < 0 or cand[2] > im.width or cand[3] > im.height:
                continue
            if any(_rects_overlap(cand, f) for f in forbidden):
                continue
            mean, std = _stats(im, cand)
            score = std * 3 + abs(mean - target_mean) * 2 + (abs(dx) + abs(dy))
            if best_score is None or score < best_score:
                best, best_score = cand, score
    return best


def run_auto(preview: bool) -> None:
    registry = load_registry()
    for zone_name, tiles in AUTO_JOBS.items():
        zone = registry.get(zone_name)
        if zone is None or not zone.get("screenshot"):
            print(f"{zone_name}: pas de capture au registre, ignoré")
            continue
        src = Path("public") / zone["screenshot"].lstrip("/")
        if not src.exists():
            print(f"{zone_name}: {src} absent, ignoré")
            continue
        if not preview:
            print(f"{zone_name}: {len(tiles)} personnage(s) repéré(s) — bouchage non branché "
                  f"(voir la note en tête de fichier), relancer avec --preview pour les voir")
            continue
        im = Image.open(src).convert("RGB")
        rects = [tile_rect(zone, tx, ty) for tx, ty in tiles]
        if preview:
            d = ImageDraw.Draw(im)
            for (tx, ty), r in zip(tiles, rects):
                d.rectangle(r, outline=(255, 0, 0))
                d.text((r[0], r[1] - 9), f"{tx},{ty}", fill=(255, 0, 0))
        else:
            for rect in rects:
                source = pick_source_tile(im, zone, rect, rects)
                if source is None:
                    print(f"  {zone_name} {rect}: aucune tuile propre trouvée, laissé tel quel")
                    continue
                tile = im.crop(source)
                tw, th = tile.size
                w, h = rect[2] - rect[0], rect[3] - rect[1]
                # Phase : on répète la tuile en gardant l'alignement sur la
                # grille de la source, pour que le motif du sol retombe juste.
                patch = Image.new("RGB", (w + tw, h + th))
                for py_ in range(0, h + th, th):
                    for px_ in range(0, w + tw, tw):
                        patch.paste(tile, (px_, py_))
                phase_x = (rect[0] - source[0]) % tw
                phase_y = (rect[1] - source[1]) % th
                im.paste(patch.crop((phase_x, phase_y, phase_x + w, phase_y + h)), (rect[0], rect[1]))
        out = src.with_name(src.stem + (" (apercu)" if preview else " (sans PNJ)") + ".png")
        im.save(out)
        print(f"{zone_name} → {out.name} ({len(tiles)} personnages)")


def run(preview: bool) -> None:
    for filename, ((px, py), patches) in JOBS.items():
        src = MAPS / filename
        if not src.exists():
            print(f"{filename}: absent, ignoré")
            continue
        im = Image.open(src).convert("RGB")
        if preview:
            d = ImageDraw.Draw(im)
            for name, rect, _ in patches:
                d.rectangle(rect, outline=(255, 0, 0))
                d.text((rect[0], rect[1] - 9), name, fill=(255, 0, 0))
        else:
            for name, (x0, y0, x1, y1), source in patches:
                w, h = x1 - x0, y1 - y0
                if source[0] == "shift":
                    _, dx, dy = source
                    sx0, sy0 = x0 + round(dx * px), y0 + round(dy * py)
                    patch = im.crop((sx0, sy0, sx0 + w, sy0 + h))
                    if patch.size != (w, h):
                        raise SystemExit(
                            f"{filename}/{name}: source ({sx0},{sy0}) hors de l'image "
                            f"{im.size} — revoir le décalage."
                        )
                else:
                    _, sx, sy = source
                    tw, th = round(px), round(py)
                    tile = im.crop((sx, sy, sx + tw, sy + th))
                    # Phase : la tuile source est calée sur la grille, la
                    # destination aussi — un simple modulo garde les joints du
                    # carrelage alignés.
                    patch = Image.new("RGB", (w, h))
                    for oy in range(0, h + th, th):
                        for ox in range(0, w + tw, tw):
                            patch.paste(tile, (ox, oy))
                    patch = patch.crop((0, 0, w, h))
                im.paste(patch, (x0, y0))
        out = MAPS / (src.stem + (" (apercu)" if preview else " (sans PNJ)") + ".png")
        im.save(out)
        print(f"{filename} → {out.name} ({len(patches)} personnages)")


if __name__ == "__main__":
    preview = "--preview" in sys.argv
    run(preview)
    run_auto(preview)
