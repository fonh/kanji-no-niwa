#!/usr/bin/env python3
"""Réaccorde les clés de recalage aux captures que NOUS avons retouchées.

POURQUOI (2026-08-07)
---------------------
ADR-0006 indexe chaque mesure d'alignement par `fichier:taille`, pour qu'une
carte remplacée ne garde pas le recalage de l'ancienne. Effacer une silhouette
change la taille du PNG sans déplacer un seul pixel de décor : la mesure reste
vraie, la clé ne colle plus, et la zone repart sans recalage — grille de
collision décalée sur toute la carte.

`scrub_baked_sprites.py` réaccorde ce qu'il touche, mais une passe complète
interrompue (fenêtre fermée, machine en veille) laisse des clés en l'air. Ce
script rattrape : il ne regarde QUE les captures qui ont une sauvegarde sous
`scripts/sources/maps-baked/` — c'est-à-dire celles que nous avons nettoyées, et
dont on sait donc que la géométrie n'a pas bougé. Une capture remplacée par une
autre image n'a pas de sauvegarde et n'est pas touchée : son recalage doit bien
être refait, pas revalidé.

    python3 scripts/build/resync-map-alignment.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ALIGNMENT = Path("scripts/sources/map-alignment.json")
MAPS = Path("public/maps")
BAKED = Path("scripts/sources/maps-baked")


def main() -> int:
    tailles = {
        f.name: (MAPS / f.name).stat().st_size
        for f in BAKED.glob("*.png")
        if (MAPS / f.name).exists()
    }
    doc = json.loads(ALIGNMENT.read_text())
    change = 0
    for zone in doc["zones"].values():
        cle = zone.get("key", "")
        if ":" not in cle:
            continue
        nom, _, taille = cle.rpartition(":")
        if nom in tailles and str(tailles[nom]) != taille:
            zone["key"] = f"{nom}:{tailles[nom]}"
            change += 1
    if change:
        # Même écriture que fit-map-alignment.py, pour ne pas remuer le fichier.
        json.dump({"zones": dict(sorted(doc["zones"].items()))}, open(ALIGNMENT, "w"), indent=1)
    print(f"{change} clé(s) de recalage réaccordée(s) sur {len(tailles)} capture(s) nettoyée(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
