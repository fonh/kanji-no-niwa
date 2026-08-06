#!/usr/bin/env python3
"""Vérifie les placements des PNJ et des dresseurs : postes atteignables, et
jamais deux personnages sur la même tuile.

POURQUOI (issue 13, content/opening-sequence.md)
------------------------------------------------
Un PNJ peut changer de poste au fil de l'histoire — c'est ce que fait le jeu
d'origine en permanence (l'assistant d'Elm quitte le labo pour le Mart de
Mauville quand Elm rappelle le joueur après le premier badge). Trois façons de
se tromper, toutes silencieuses en jeu :

  1. un poste dans un mur, ou hors de la grille → le PNJ n'est nulle part ;
  2. un poste sans aucune tuile praticable adjacente → il est là, mais
     personne ne peut lui parler, et il porte peut-être l'objet qui débloque
     la suite ;
  3. une liste qui ne se termine pas par un poste SANS condition → au début du
     jeu, aucune condition n'est remplie, donc le PNJ n'a pas de poste du tout.

Vérifie aussi que la zone de chaque poste existe, et que deux postes n'ont pas
exactement les mêmes conditions (le second serait mort).

**Collision de tuile (ajouté 2026-08-06, carte de conception)** — quatrième
façon de se tromper, elle aussi déjà payée : en posant les sages de la Tour
Grospignon sur leurs objets ROM, l'Ancien Li s'est retrouvé sur la tuile exacte
du sage Chow. Deux personnages sur une case, un seul visible, l'autre
inatteignable — et c'est l'Ancien qui remet le TM70 qui ouvre l'arène. La règle
vérifiée ici : dans une même zone, une tuile porte au plus un personnage
POUVANT y être en même temps qu'un autre. « En même temps » se lit sans état :
deux postes sont considérés simultanés dès que leurs conditions ne se
contredisent pas trivialement (même quête, étapes différentes → jamais
simultanés ; `negate` d'une condition de l'autre → jamais simultanés).
Panneaux et objets (`kind`) sont exclus : ils occupent une tuile solide, jamais
partagée avec un marcheur de toute façon.

  python3 scripts/validate/lint-npc-placements.py
"""

from __future__ import annotations

import json
import sys
from itertools import combinations
from pathlib import Path

NPCS = Path("content/map/npcs.json")
TRAINERS = Path("content/map/trainers.json")
ZONES = Path("content/map/zones.json")
REGISTRY = Path("src/data/zone-registry.json")


def walkable(zone: dict, tx: int, ty: int) -> bool:
    if not (0 <= tx < zone["tile_width"] and 0 <= ty < zone["tile_height"]):
        return False
    return zone["terrain"][ty * zone["tile_width"] + tx] != "#"


def default_map_for_zone_id(zone_id: str, zones_doc: dict) -> str | None:
    """MAP_* de la zone extérieure d'un zone_id de contenu (les entités sans
    `map_zone` explicite y sont servies)."""
    for z in zones_doc["zones"]:
        if z["zone_id"] == zone_id:
            return z["map_name"]
    return None


def cond_key(c: dict) -> tuple:
    """Identité d'une condition, `negate` mis à part."""
    return tuple(sorted((k, str(v)) for k, v in c.items() if k != "negate"))


def mutually_exclusive(a: list[dict], b: list[dict]) -> bool:
    """Deux jeux de conditions qui ne peuvent pas être vrais en même temps.

    Volontairement conservateur : on ne conclut « jamais ensemble » que sur
    deux motifs certains, sinon on laisse passer la collision au rapport.
      - `negate` opposés sur la même condition (X vs NOT X) ;
      - deux étapes DIFFÉRENTES de la même quête (une quête a un seul
        `current_step`... mais `quest_step` se lit « à ce stade OU APRÈS », donc
        deux étapes d'une même quête PEUVENT être vraies ensemble : ce motif
        n'est PAS exclusif et n'est pas retenu ici).
    """
    for ca in a:
        for cb in b:
            if cond_key(ca) == cond_key(cb) and bool(ca.get("negate")) != bool(cb.get("negate")):
                return True
    return False


def posts(entity: dict, zones_doc: dict) -> list[tuple[str | None, int, int, list[dict]]]:
    """Tous les postes possibles d'une entité : (map_zone, x, y, conditions)."""
    base_map = entity.get("map_zone") or default_map_for_zone_id(entity["zone_id"], zones_doc)
    presence = entity.get("unlock_conditions") or []
    placements = entity.get("placements")
    if not placements:
        return [(base_map, entity["tile_x"], entity["tile_y"], presence)]
    out = []
    for pl in placements:
        out.append(
            (
                pl.get("map_zone") or base_map,
                pl["tile_x"],
                pl["tile_y"],
                presence + (pl.get("conditions") or []),
            )
        )
    return out


def main() -> None:
    npcs = json.load(open(NPCS))
    trainers = json.load(open(TRAINERS))
    zones_doc = json.load(open(ZONES))
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

    # ── Collisions de tuile ───────────────────────────────────────────────────
    occupancy: dict[tuple[str, int, int], list[tuple[str, list[dict]]]] = {}
    walkers = 0
    for entity in npcs + trainers:
        if entity.get("kind") in ("sign", "object"):
            continue
        if entity.get("tile_x") is None or entity.get("tile_y") is None:
            continue
        walkers += 1
        ident = entity.get("npc_id") or entity.get("trainer_id")
        for map_zone, tx, ty, conds in posts(entity, zones_doc):
            if map_zone is None:
                continue
            occupancy.setdefault((map_zone, tx, ty), []).append((ident, conds))

    for (map_zone, tx, ty), holders in sorted(occupancy.items()):
        for (ida, ca), (idb, cb) in combinations(holders, 2):
            if ida == idb:  # deux postes du MÊME personnage : jamais un conflit
                continue
            if mutually_exclusive(ca, cb):
                continue
            errors.append(
                f"tuile occupée deux fois : {ida} et {idb} sont tous deux en "
                f"({tx},{ty}) de {map_zone} — un seul sera visible, l'autre "
                f"injoignable"
            )

    print(f"{checked} PNJ à placements conditionnels vérifié(s)")
    print(f"{walkers} personnage(s) vérifié(s) contre les collisions de tuile")
    if errors:
        print("\nBLOQUANT :")
        for e in errors:
            print("  -", e)
        sys.exit(1)
    print("Tous les placements sont atteignables, aucune tuile partagée.")


if __name__ == "__main__":
    main()
