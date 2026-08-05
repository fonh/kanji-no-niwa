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

import sys
from pathlib import Path

from PIL import Image, ImageDraw

MAPS = Path("public/maps")

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
    run("--preview" in sys.argv)
