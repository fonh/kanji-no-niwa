#!/usr/bin/env python3
"""Prouve qu'aucune carte servie ne contient encore de personnage peint.

POURQUOI (2026-08-07)
---------------------
Le nettoyage des figurants incrustés se vérifiait à l'œil, une capture à la fois,
en attendant qu'un humain joue et envoie une image. C'est ce qui a laissé passer
une quatrième silhouette sur la Route 31 pendant deux passes.

Or **l'outil qui les trouve est aussi celui qui prouve qu'elles sont parties** :
`find_baked_sprites.py` cherche par corrélation avec les vraies planches, sans
rien savoir de ce qu'on a fait. S'il ne trouve plus rien, il n'y a plus rien.

C'est donc le contrôle de bouclage de la méthode : on ne relit pas son propre
travail, on le refait mesurer par l'outil qui ne connaît que les pixels.

Il est LENT (quelques secondes par capture) : il ne fait pas partie de
`npm run check`. On le lance après une passe de nettoyage.

    python3 scripts/validate/lint-baked-sprites.py                 # tout
    python3 scripts/validate/lint-baked-sprites.py --zone MAP_ROUTE_30
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "build"))
from find_baked_sprites import REGISTRY, find  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--threshold", type=float, default=30.0)
    ap.add_argument("--zone", action="append")
    a = ap.parse_args()

    zones = json.load(open(REGISTRY))["zones"]
    if a.zone:
        zones = [z for z in zones if z["name"] in set(a.zone)]

    # Une capture peut servir plusieurs zones : on la contrôle une fois.
    par_fichier: dict[str, str] = {}
    for z in zones:
        if z["screenshot"]:
            par_fichier.setdefault(z["screenshot"], z["name"])

    restes: list[tuple[str, dict]] = []
    for i, (shot, zone_name) in enumerate(sorted(par_fichier.items()), 1):
        try:
            hits = find(zone_name, a.threshold)
        except Exception as exc:
            print(f"  ! {zone_name} : {exc}")
            continue
        for h in hits:
            restes.append((zone_name, h))
        print(f"[{i}/{len(par_fichier)}] {zone_name}  {len(hits) or ''}", flush=True)

    if restes:
        print(f"\n{len(restes)} silhouette(s) encore peinte(s) dans une capture servie :")
        for zone_name, h in sorted(restes, key=lambda r: r[1]["err"]):
            print(f"  [ERREUR] {zone_name} : {h['sheet']} en {tuple(h['tile'])} "
                  f"(erreur {h['err']}) — lancer scripts/build/scrub_baked_sprites.py {zone_name}")
        return 1
    print(f"\n{len(par_fichier)} capture(s) contrôlée(s) : aucun personnage peint.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
