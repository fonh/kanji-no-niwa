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
# MÉTHODE (arrêtée 2026-08-07, après deux essais ratés) : on remplace TUILE PAR
# TUILE, jamais le rectangle du personnage d'un bloc. Un personnage fait deux
# tuiles de haut et chevauche presque toujours deux terrains ; recopier deux
# tuiles depuis un seul endroit plaquait un bloc d'arbres en travers d'un
# chemin. Une tuile, elle, est d'un seul tenant : on lui cherche une jumelle
# dans le voisinage, choisie sur son POURTOUR — la partie qui devra se
# raccorder, et celle que le personnage ne recouvre presque pas.
#
# COMMENT ÉTABLIR LA LISTE D'UNE ZONE : `render-zone-preview.py <zone>` compose
# la capture et marque chaque endroit où le moteur dessinera quelqu'un — un
# personnage visible SANS marqueur est peint dans l'image. Pour relever sa
# tuile, superposer une grille (voir la recette du journal). NE PAS reprendre
# les coordonnées des objets ROM : beaucoup de ces figurants errent, la capture
# les a figés ailleurs.
AUTO_JOBS: dict[str, list[tuple[int, int]]] = {
    # Route 30 et Tour Grospignon : listes RETIRÉES le 2026-08-07. Elles
    # avaient été dérivées des coordonnées des objets ROM, et la vérification
    # visuelle du bouchage l'a prouvé faux — le patch tombait à côté (un tronçon
    # de rondin et un pan d'arbres recopiés sur le chemin) et laissait deux
    # personnages en place. Il faut les MESURER à la grille, comme la Route 31 :
    # `render-zone-preview.py MAP_ROUTE_30 --around <tuile>`, puis zoom avec
    # grille numérotée, et relever la tuile des PIEDS de chaque personnage.
    # Tant que ce n'est pas fait, ne rien boucher : une carte abîmée se voit
    # plus qu'un doublon.
    # Route 31 — tuiles MESURÉES sur la capture (grille numérotée, zoom ×8),
    # pas déduites des objets ROM : ces figurants-là ERRENT (movement 3/14/15),
    # et la capture les a figés là où ils se trouvaient ce jour-là, une à deux
    # tuiles à côté de leur position de spawn. La tuile relevée est celle des
    # PIEDS, pas du corps — un décalage d'une rangée laisse l'ombre en place.
    "MAP_ROUTE_31": [(15, 15), (28, 17), (28, 26)],
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
        int(round(px - 0.2 * sx)),
        int(round(py - 1.6 * sy)),
        int(round(px + 1.2 * sx)),
        int(round(py + 0.4 * sy)),
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


def _variance(im: Image.Image, rect) -> float:
    """Écart-type des luminances d'un rectangle — une tuile de sol nu est
    plate, une tuile qui porte un buisson ou un arbre ne l'est pas."""
    px = im.load()
    vals = [
        sum(px[x, y]) / 3
        for y in range(rect[1], rect[3])
        for x in range(rect[0], rect[2])
    ]
    if not vals:
        return 0.0
    mean = sum(vals) / len(vals)
    return (sum((v - mean) ** 2 for v in vals) / len(vals)) ** 0.5


def _rects_overlap(a, b) -> bool:
    return not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1])


def _ring(im: Image.Image, rect):
    """Le pourtour d'un rectangle — la seule partie qui doit se raccorder, et
    la seule que le personnage ne recouvre presque jamais."""
    x0, y0, x1, y1 = rect
    px = im.load()
    out = []
    for x in range(x0, x1):
        out.append(px[x, y0])
        out.append(px[x, y1 - 1])
    for y in range(y0 + 1, y1 - 1):
        out.append(px[x0, y])
        out.append(px[x1 - 1, y])
    return out


def _ring_distance(a, b) -> float:
    n = min(len(a), len(b))
    if n == 0:
        return 1e9
    return sum(
        abs(a[i][0] - b[i][0]) + abs(a[i][1] - b[i][1]) + abs(a[i][2] - b[i][2])
        for i in range(n)
    ) / n


def _variance(im: Image.Image, rect) -> float:
    """Écart-type des luminances d'un rectangle — une tuile de sol nu est
    plate, une tuile qui porte un buisson ou un arbre ne l'est pas."""
    px = im.load()
    vals = [
        sum(px[x, y]) / 3
        for y in range(rect[1], rect[3])
        for x in range(rect[0], rect[2])
    ]
    if not vals:
        return 0.0
    mean = sum(vals) / len(vals)
    return (sum((v - mean) ** 2 for v in vals) / len(vals)) ** 0.5


def _rects_overlap(a, b) -> bool:
    return not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1])


def patch_tile(im: Image.Image, zone: dict, cell, forbidden) -> bool:
    """Remplace UNE tuile par la tuile voisine qui lui ressemble le plus.

    Tuile par tuile, et pas rectangle entier : un personnage fait deux tuiles
    de haut et chevauche presque toujours deux terrains (le chemin et l'herbe,
    l'herbe et la lisière). Recopier un rectangle de deux tuiles depuis un seul
    endroit plaquait donc un bloc d'arbres en travers d'un chemin — c'est ce
    qui a raté deux fois. Une tuile, elle, est d'un seul tenant : on lui trouve
    une jumelle.

    Le critère est le POURTOUR : c'est ce qui se raccordera visiblement, et
    c'est la partie que le personnage ne recouvre presque pas (il tient dans le
    centre de sa tuile). Une tuile candidate dont le pourtour colle a le même
    sol.
    """
    sx, sy = zone["scale_x"], zone["scale_y"]
    target = _ring(im, cell)
    w, h = cell[2] - cell[0], cell[3] - cell[1]
    best, best_score = None, None
    for dy in range(-AUTO_SEARCH_TILES, AUTO_SEARCH_TILES + 1):
        for dx in range(-AUTO_SEARCH_TILES, AUTO_SEARCH_TILES + 1):
            if dx == 0 and dy == 0:
                continue
            ox, oy = int(round(dx * sx)), int(round(dy * sy))
            cand = (cell[0] + ox, cell[1] + oy, cell[0] + ox + w, cell[1] + oy + h)
            if cand[0] < 0 or cand[1] < 0 or cand[2] > im.width or cand[3] > im.height:
                continue
            if any(_rects_overlap(cand, f) for f in forbidden):
                continue
            # Le pourtour dit « même sol » ; la variance interne dit « rien
            # dessus ». Sans le second terme, un buisson voisin gagne dès que
            # son pourtour est de l'herbe — et on remplace un personnage par un
            # buisson.
            score = (
                _ring_distance(target, _ring(im, cand))
                + _variance(im, cand) * 1.5
                + (abs(dx) + abs(dy)) * 0.4
            )
            if best_score is None or score < best_score:
                best, best_score = cand, score
    if best is None:
        return False
    im.paste(im.crop(best), (cell[0], cell[1]))
    return True


def character_cells(zone: dict, tx: int, ty: int):
    """Les tuiles ENTIÈRES que couvre un personnage dont les PIEDS sont en
    (tx, ty).

    Mesuré au zoom sur les captures : le sprite déborde d'un bon tiers de tuile
    à gauche et monte de presque deux tuiles — il occupe donc DEUX colonnes
    (tx-1, tx) et TROIS rangées (ty-2 … ty), ombre comprise. Une boîte plus
    petite laissait un moignon de corps et l'ombre, ce qui se voit autant que
    le personnage entier."""
    sx, sy = zone["scale_x"], zone["scale_y"]
    px0, py0 = zone["origin_px"], zone["origin_py"]

    def cell(cx, cy):
        return (
            int(round(px0 + cx * sx)),
            int(round(py0 + cy * sy)),
            int(round(px0 + (cx + 1) * sx)),
            int(round(py0 + (cy + 1) * sy)),
        )

    return [cell(cx, cy) for cx in (tx - 1, tx) for cy in (ty - 2, ty - 1, ty)]


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
        im = Image.open(src).convert("RGB")
        rects = [tile_rect(zone, tx, ty) for tx, ty in tiles]
        if preview:
            d = ImageDraw.Draw(im)
            for (tx, ty), r in zip(tiles, rects):
                d.rectangle(r, outline=(255, 0, 0))
                d.text((r[0], r[1] - 9), f"{tx},{ty}", fill=(255, 0, 0))
        else:
            cells = [c for (tx, ty) in tiles for c in character_cells(zone, tx, ty)]
            for cell in cells:
                if not patch_tile(im, zone, cell, cells):
                    print(f"  {zone_name} {cell}: aucune tuile jumelle trouvée, laissée telle quelle")
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
