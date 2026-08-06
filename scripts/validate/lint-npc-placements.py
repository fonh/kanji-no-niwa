#!/usr/bin/env python3
"""Vérifie les placements conditionnels des PNJ.

POURQUOI (issue 13, content/opening-sequence.md)
------------------------------------------------
Un PNJ peut désormais changer de poste au fil de l'histoire — c'est ce que fait
le jeu d'origine en permanence (l'assistant d'Elm tient le comptoir du Mart de
Ville Griotte entre la remise de l'œuf et sa livraison). Trois façons de se
tromper, toutes silencieuses en jeu :

  1. un poste dans un mur, ou hors de la grille → le PNJ n'est nulle part ;
  2. un poste sans aucune tuile praticable adjacente → il est là, mais
     personne ne peut lui parler, et il porte peut-être l'objet qui débloque
     la suite ;
  3. une liste qui ne se termine pas par un poste SANS condition → au début du
     jeu, aucune condition n'est remplie, donc le PNJ n'a pas de poste du tout.

Vérifie aussi que la zone de chaque poste existe, et que deux postes n'ont pas
exactement les mêmes conditions (le second serait mort).

  python3 scripts/validate/lint-npc-placements.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

NPCS = Path("content/map/npcs.json")
REGISTRY = Path("src/data/zone-registry.json")


def walkable(zone: dict, tx: int, ty: int) -> bool:
    if not (0 <= tx < zone["tile_width"] and 0 <= ty < zone["tile_height"]):
        return False
    return zone["terrain"][ty * zone["tile_width"] + tx] != "#"


def main() -> None:
    npcs = json.load(open(NPCS))
    registry = {z["name"]: z for z in json.load(open(REGISTRY))["zones"]}
    errors: list[str] = []
    checked = 0

    for npc in npcs:
        placements = npc.get("placements")
        if not placements:
            continue
        checked += 1
        nid = npc["npc_id"]

        if placements[-1].get("conditions"):
            errors.append(
                f"{nid}: le dernier placement a des conditions — au début du jeu, "
                f"aucune n'est remplie et le PNJ n'existe nulle part"
            )

        seen: list[str] = []
        for i, pl in enumerate(placements):
            key = json.dumps(pl.get("conditions", []), sort_keys=True, ensure_ascii=False)
            if key in seen:
                errors.append(
                    f"{nid}: placement #{i} a les mêmes conditions qu'un précédent — "
                    f"il ne sera jamais choisi (le premier gagne)"
                )
            seen.append(key)

            map_zone = pl.get("map_zone") or npc.get("map_zone")
            if map_zone is None:
                errors.append(f"{nid}: placement #{i} sans map_zone et le PNJ n'en a pas non plus")
                continue
            zone = registry.get(map_zone)
            if zone is None:
                errors.append(f"{nid}: placement #{i} vise une zone inconnue ({map_zone})")
                continue

            tx, ty = pl["tile_x"], pl["tile_y"]
            if not walkable(zone, tx, ty):
                errors.append(
                    f"{nid}: placement #{i} en ({tx},{ty}) de {map_zone} — hors grille ou dans un mur"
                )
                continue
            if not any(walkable(zone, tx + dx, ty + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                errors.append(
                    f"{nid}: placement #{i} en ({tx},{ty}) de {map_zone} — aucune tuile "
                    f"adjacente praticable, personne ne pourra lui parler"
                )

    print(f"{checked} PNJ à placements conditionnels vérifié(s)")
    if errors:
        print("\nBLOQUANT :")
        for e in errors:
            print("  -", e)
        sys.exit(1)
    print("Tous les placements sont atteignables.")


if __name__ == "__main__":
    main()
