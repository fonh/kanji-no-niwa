#!/usr/bin/env python3
"""Décode l'orientation des planches de sprites overworld extraites de la ROM
et l'écrit dans src/data/overworld-sprite-labels.json.

POURQUOI (issue 13, « tous les PNJ nous tournent le dos »)
----------------------------------------------------------
Le moteur affichait toujours la frame (0,0) de chaque planche, sur la foi d'un
commentaire qui la disait « face au sud (idle) ». Elle ne l'est pas : sur TOUTES
les planches ROM vérifiées, la frame 0 est le personnage **de dos**. D'où des
villages entiers de PNJ tournés vers le nord.

C'est aussi la prémisse qui avait justifié d'importer des sprites GBA
(PokemonHnS) pour les quelques personnages nommés : « les planches ROM n'ont
qu'une seule rangée fiable ». Faux — elles ont les 4 directions, à des index de
frame que personne n'avait décodés.

DISPOSITION DÉCODÉE (empirique, deux méthodes concordantes)
-----------------------------------------------------------
1. détection des paires miroir : deux frames dont l'une est l'image miroir de
   l'autre sont forcément ouest/est. Sur 61 planches 16 frames, les mêmes
   paires ressortent (1↔5, 2↔6, 3↔7, 4↔15) — donc ouest = {1,2,3,15},
   est = {4,5,6,7}, et les 8 frames restantes se répartissent en nord et sud ;
2. contrôle visuel sur un échantillon varié (humains, Pokémon suiveurs,
   PNJ spéciaux) : la frame « sud » montre bien le visage, la frame « nord »
   le dos, ouest/est les profils du bon côté.

  planche 256×64 (16 frames) : nord=0  ouest=1  est=5   sud=11
  planche 256×32 (8 frames)  : nord=0  sud=2    ouest=4 est=6

Les autres formats (512×64, 256×128, planches à 1-7 frames) ont une disposition
mixte non décodée : ils n'obtiennent pas de `dirs` et le moteur reste sur la
frame 0 pour eux, comportement historique.

Sortie : réécrit src/data/overworld-sprite-labels.json en ajoutant `rows` et,
quand la disposition est connue, `dirs: {south, north, west, east}`.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

LABELS = Path("src/data/overworld-sprite-labels.json")
SPRITE_DIR = Path("public/sprites/overworld")

# (largeur, hauteur) → index de frame par direction
KNOWN_LAYOUTS: dict[tuple[int, int], dict[str, int]] = {
    (256, 64): {"north": 0, "west": 1, "east": 5, "south": 11},
    (256, 32): {"north": 0, "south": 2, "west": 4, "east": 6},
}


def main() -> None:
    entries = json.load(open(LABELS))
    tagged = skipped = missing = 0
    for e in entries:
        path = SPRITE_DIR / f"{e['label']}.png"
        if not path.exists():
            missing += 1
            continue
        im = Image.open(path).convert("RGBA")
        w, h = im.size
        e["cols"] = w // 32
        e["rows"] = h // 32
        layout = KNOWN_LAYOUTS.get((w, h))
        e.pop("dirs", None)
        if layout is None:
            skipped += 1
            continue
        # Une planche peut avoir la bonne taille mais des frames vides (décor,
        # icônes) : sans les 4 frames réellement dessinées, on ne promet rien.
        alpha = np.asarray(im)[..., 3]
        cols = w // 32
        def filled(idx: int) -> bool:
            r, c = divmod(idx, cols)
            return bool(alpha[r * 32:(r + 1) * 32, c * 32:(c + 1) * 32].sum() > 0)
        if not all(filled(i) for i in layout.values()):
            skipped += 1
            continue
        e["dirs"] = layout
        tagged += 1

    json.dump(entries, open(LABELS, "w"), ensure_ascii=False, indent=1)
    print(f"{LABELS} : {tagged} planches orientables, {skipped} sans disposition connue, "
          f"{missing} fichiers absents")


if __name__ == "__main__":
    main()
