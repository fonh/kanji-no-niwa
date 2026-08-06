#!/usr/bin/env python3
"""Vérifie que les verrous de progression ne peuvent pas enfermer le joueur.

POURQUOI
--------
Un verrou dont la condition ne peut être remplie qu'APRÈS le franchissement
qu'il barre est un blocage définitif : le joueur ne peut ni passer, ni obtenir
la clé. C'est la même famille d'erreur qu'un patch de terrain qui mure un
passage (issue 13, un joueur s'est réellement retrouvé enfermé) — sauf qu'ici
elle se voit encore moins, parce que rien ne paraît cassé.

La règle vérifiée est simple et suffit : **la clé doit être du même côté que
la serrure**. Le contenu qui fait avancer la quête à l'étape attendue doit
vivre dans la zone de DÉPART du verrou (ou l'un de ses intérieurs), pas
derrière.

Vérifie aussi le mécanique de base : zones connues, poste du garde sur une
tuile praticable, sprite résoluble, réplique non vide.

  python3 scripts/validate/lint-roadblocks.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROADBLOCKS = Path("content/map/roadblocks.json")
REGISTRY = Path("src/data/zone-registry.json")
ZONES = Path("content/map/zones.json")
DIALOGUES = Path("content/dialogues")
LESSONS = Path("content/lessons")
SPRITE_LABELS = Path("src/data/overworld-sprite-labels.json")


def zone_ids_for_map(map_name: str, zones_doc: dict) -> set[str]:
    """zone_id de contenu couvrant cette MAP_* — la zone elle-même et tous ses
    intérieurs (le labo d'Elm appartient à new-bark-town côté contenu)."""
    own = {z["zone_id"] for z in zones_doc["zones"] if z.get("map_name") == map_name}
    slug = map_name.replace("MAP_", "").lower().replace("_", "-")
    own.add(slug)
    # Les intérieurs portent le zone_id de leur ville : on ajoute les zone_id
    # dont le map_name commence par celui du verrou.
    for z in zones_doc["zones"]:
        if str(z.get("map_name", "")).startswith(map_name):
            own.add(z["zone_id"])
    return own


def files_granting(quest_id: str, step: str) -> list[Path]:
    """Fichiers de contenu qui font avancer cette quête à cette étape."""
    out = []
    for path in list(DIALOGUES.rglob("*.json")) + list(LESSONS.glob("*.json")):
        text = path.read_text(encoding="utf-8")
        if quest_id not in text or step not in text:
            continue
        for m in re.finditer(r'\{[^{}]*"type"\s*:\s*"advance_quest"[^{}]*\}', text):
            blob = m.group(0)
            if quest_id in blob and f'"{step}"' in blob:
                out.append(path)
                break
    return out


def main() -> None:
    doc = json.load(open(ROADBLOCKS))
    registry = {z["name"]: z for z in json.load(open(REGISTRY))["zones"]}
    zones_doc = json.load(open(ZONES))
    sprites = {s["label"] for s in json.load(open(SPRITE_LABELS))}
    errors: list[str] = []

    for rb in doc["roadblocks"]:
        rid = rb["roadblock_id"]
        src, dst = rb["from_zone"], rb["to_zone"]

        for key, name in (("from_zone", src), ("to_zone", dst)):
            if name not in registry:
                errors.append(f"{rid}: {key} inconnue du registre ({name})")

        if src in registry:
            z = registry[src]
            tx, ty = rb["guard"]["post"]["tile_x"], rb["guard"]["post"]["tile_y"]
            if not (0 <= tx < z["tile_width"] and 0 <= ty < z["tile_height"]):
                errors.append(f"{rid}: poste du garde ({tx},{ty}) hors de {src}")
            elif z["terrain"][ty * z["tile_width"] + tx] == "#":
                errors.append(
                    f"{rid}: poste du garde ({tx},{ty}) dans un mur — il ne peut pas en sortir"
                )

        label = rb["guard"]["sprite_id"].replace("SPRITE_", "").lower()
        if label not in sprites:
            errors.append(f"{rid}: sprite du garde introuvable ({rb['guard']['sprite_id']})")

        if not rb.get("pages"):
            errors.append(f"{rid}: aucune réplique — un verrou muet n'explique rien au joueur")

        if not rb.get("unlock_conditions"):
            errors.append(f"{rid}: aucune condition — le verrou ne se lèverait jamais")

        # La clé doit être du même côté que la serrure.
        allowed = zone_ids_for_map(src, zones_doc)
        for cond in rb.get("unlock_conditions", []):
            if cond.get("type") != "quest_step":
                # Les autres types (item_owned, badge_earned…) ne se localisent
                # pas mécaniquement — à vérifier à la main, signalé comme tel.
                print(f"  [à vérifier à la main] {rid}: condition {cond.get('type')} non localisable")
                continue
            granters = files_granting(cond["quest_id"], cond["step"])
            if not granters:
                errors.append(
                    f"{rid}: rien dans le contenu ne fait avancer "
                    f"{cond['quest_id']} à l'étape « {cond['step']} » — verrou indéblocable"
                )
                continue
            reachable = [
                p for p in granters
                if any(f"/{zid}/" in str(p) or p.stem == zid for zid in allowed)
            ]
            if not reachable:
                errors.append(
                    f"{rid}: la clé est derrière la serrure — "
                    f"{cond['quest_id']}/{cond['step']} n'est donné que par "
                    f"{[str(p) for p in granters]}, hors de {src}"
                )

    print(f"{len(doc['roadblocks'])} verrou(s) vérifié(s)")
    if errors:
        print("\nBLOQUANT :")
        for e in errors:
            print("  -", e)
        sys.exit(1)
    print("Aucun verrou ne peut enfermer le joueur.")


if __name__ == "__main__":
    main()
