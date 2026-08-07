#!/usr/bin/env python3
"""Passe TOUTES les cartes au nettoyage des personnages incrustés.

POURQUOI (2026-08-07)
---------------------
`scrub_baked_sprites.py` traite une zone. Le faire à la main zone par zone, c'est
exactement le travail qu'on ne veut plus faire : 377 zones ont une capture, et
chacune peut contenir des personnages peints dans ses pixels.

Ce script les enchaîne toutes. Il dédoublonne par FICHIER (une même capture sert
souvent plusieurs zones — l'intérieur de Centre Pokémon est le même dans chaque
ville) et rend un rapport trié par erreur de corrélation, pour qu'un doute se
regarde en une ligne au lieu de se chercher.

Il est idempotent : chaque zone repart de son original
(`scripts/sources/maps-baked/`), donc on peut le relancer autant qu'on veut, y
compris après avoir changé le seuil.

    python3 scripts/build/scrub-all-maps.py --dry-run     # relevé complet
    python3 scripts/build/scrub-all-maps.py               # effacement
    python3 scripts/build/scrub-all-maps.py --zone MAP_ROUTE_30 --zone MAP_VIOLET

Après un effacement, relancer `python3 scripts/build/build-zone-registry.py`
(le script réaccorde les clés de recalage, le registre, lui, doit être régénéré).
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from find_baked_sprites import REGISTRY  # noqa: E402
from scrub_baked_sprites import scrub  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--threshold", type=float, default=30.0)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--zone", action="append", help="limiter à ces zones")
    a = ap.parse_args()

    zones = json.load(open(REGISTRY))["zones"]
    if a.zone:
        zones = [z for z in zones if z["name"] in set(a.zone)]

    # Une capture par fichier : la nettoyer une fois suffit pour toutes les zones
    # qui la partagent (et la nettoyer deux fois ne ferait que perdre du temps).
    par_fichier: dict[str, str] = {}
    for z in zones:
        if z["screenshot"] and z["screenshot"] not in par_fichier:
            par_fichier[z["screenshot"]] = z["name"]

    total, touchees, debut = 0, [], time.time()
    for i, (shot, zone_name) in enumerate(sorted(par_fichier.items()), 1):
        print(f"[{i}/{len(par_fichier)}] {zone_name}  ({Path(shot).name})", flush=True)
        try:
            n = scrub(zone_name, a.threshold, a.dry_run)
        except Exception as exc:  # une carte cassée ne doit pas arrêter la passe
            print(f"  ! échec : {exc}")
            continue
        if n:
            total += n
            touchees.append((zone_name, n))

    print(f"\n{total} silhouette(s) sur {len(touchees)} capture(s), "
          f"{len(par_fichier)} examinée(s), en {time.time() - debut:.0f}s")
    for zone_name, n in sorted(touchees, key=lambda t: -t[1]):
        print(f"  {n:>3}  {zone_name}")
    if a.dry_run:
        print("\nEssai à blanc — rien écrit.")
    else:
        print("\nRelancer : python3 scripts/build/build-zone-registry.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
