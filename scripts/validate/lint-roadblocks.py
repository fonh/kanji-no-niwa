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
NPCS = Path("content/map/npcs.json")
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


def files_granting_item(item_id: str) -> list[Path]:
    """Fichiers de contenu qui remettent cet objet (`grant_item`).

    Ajouté 2026-08-06 (carte de conception) : un verrou peut légitimement se
    lever sur `item_owned` (le verrou de l'arène de Mauville se lève sur le
    TM70 que l'Ancien de la Tour Grospignon remet). Jusqu'ici ces conditions
    étaient imprimées « à vérifier à la main » — c'est-à-dire jamais vérifiées.
    """
    out = []
    for path in list(DIALOGUES.rglob("*.json")) + list(LESSONS.glob("*.json")):
        text = path.read_text(encoding="utf-8")
        if item_id not in text:
            continue
        for m in re.finditer(r'\{[^{}]*"type"\s*:\s*"grant_item"[^{}]*\}', text):
            if f'"{item_id}"' in m.group(0):
                out.append(path)
                break
    return out


def maps_reachable_without(start: str, barred: tuple[str, str], registry: dict) -> set[str]:
    """MAP_* atteignables depuis `start` par les warps, SANS emprunter le
    franchissement barré.

    Le graphe des warps ne relie que les intérieurs, les bâtiments et les
    passages (postes-frontière, escaliers de donjon) — jamais deux zones
    extérieures entre elles, qui se touchent par les bords de carte. C'est
    exactement la granularité voulue : « la clé est-elle dans la ville, ou
    dans l'un des bâtiments qu'on peut atteindre sans franchir le verrou ? »
    """
    seen = {start}
    queue = [start]
    while queue:
        cur = queue.pop()
        for warp in registry.get(cur, {}).get("warps", []):
            dest = warp.get("header")
            if dest is None or dest in seen:
                continue
            if (cur, dest) == barred:
                continue
            seen.add(dest)
            queue.append(dest)
    return seen


def map_of_content_file(path: Path, carriers: dict[str, str], zones_doc: dict) -> str | None:
    """MAP_* où ce fichier de contenu se joue.

    Priorité au personnage qui le porte (son `map_zone` explicite, sinon la
    MAP_* de son `zone_id`) — c'est la seule donnée fiable : le chemin du
    fichier ne dit que la ville de rattachement, pas l'étage.
    """
    ref = str(path.with_suffix("")).split("content/dialogues/", 1)[-1]
    return carriers.get(ref)


def main() -> None:
    doc = json.load(open(ROADBLOCKS))
    registry = {z["name"]: z for z in json.load(open(REGISTRY))["zones"]}
    zones_doc = json.load(open(ZONES))
    sprites = {s["label"] for s in json.load(open(SPRITE_LABELS))}
    errors: list[str] = []

    # dialogue_ref → MAP_* où son porteur se tient (poste par défaut).
    map_by_zone_id = {z["zone_id"]: z["map_name"] for z in zones_doc["zones"]}
    carriers: dict[str, str] = {}
    for entity in json.load(open(NPCS)) + json.load(open(Path("content/map/trainers.json"))):
        ref = entity.get("dialogue_ref")
        if not ref:
            continue
        placements = entity.get("placements") or []
        maps = {pl.get("map_zone") for pl in placements if pl.get("map_zone")}
        maps.add(entity.get("map_zone") or map_by_zone_id.get(entity["zone_id"]))
        for m in maps:
            if m:
                carriers.setdefault(ref, m)
                break

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

        # Un verrou qui délègue à un PNJ doit se lever dès la PREMIÈRE réplique
        # de ce PNJ. Sinon le joueur bute plusieurs fois contre la même sortie
        # sans comprendre pourquoi — et si la réplique qui lève le verrou n'est
        # atteignable que par un autre chemin, il ne passe jamais.
        npc_id = rb.get("npc_id")
        if npc_id:
            npc = next((n for n in json.load(open(NPCS)) if n["npc_id"] == npc_id), None)
            if npc is None:
                errors.append(f"{rid}: délègue à un PNJ inconnu ({npc_id})")
            elif not npc.get("dialogue_ref"):
                errors.append(f"{rid}: le PNJ {npc_id} n'a pas de dialogue à jouer")
            else:
                dlg = json.loads((DIALOGUES / f"{npc['dialogue_ref']}.json").read_text())
                default = next(
                    (r2["state"] for r2 in dlg.get("state_rules", []) if r2.get("default")), None
                )
                effects = json.dumps(
                    dlg.get("dialogue_states", {}).get(default, {}).get("effects", []),
                    ensure_ascii=False,
                )
                for cond in rb.get("unlock_conditions", []):
                    if cond.get("type") == "quest_step" and f'"{cond["step"]}"' not in effects:
                        errors.append(
                            f"{rid}: la première réplique de {npc_id} (état « {default} ») "
                            f"n'accorde pas {cond['step']} — le joueur devra buter plusieurs fois"
                        )

        # La clé doit être du même côté que la serrure.
        allowed = zone_ids_for_map(src, zones_doc)
        reachable_maps = maps_reachable_without(src, (src, dst), registry)
        for cond in rb.get("unlock_conditions", []):
            ctype = cond.get("type")
            if ctype == "quest_step":
                label = f"{cond['quest_id']}/{cond['step']}"
                granters = files_granting(cond["quest_id"], cond["step"])
            elif ctype == "item_owned":
                label = f"objet {cond['item_id']}"
                granters = files_granting_item(cond["item_id"])
            else:
                # badge_earned, count… : pas de lieu de remise à localiser.
                print(f"  [à vérifier à la main] {rid}: condition {ctype} non localisable")
                continue

            if not granters:
                errors.append(
                    f"{rid}: rien dans le contenu ne donne {label} — verrou indéblocable"
                )
                continue

            # Deux façons d'être « du bon côté », la première (le porteur et sa
            # MAP_*, traversée par le graphe des warps) étant la fiable ; la
            # seconde (le zone_id du chemin de fichier) reste le filet pour un
            # fichier qu'aucun personnage ne porte.
            reachable = [
                p for p in granters
                if map_of_content_file(p, carriers, zones_doc) in reachable_maps
                or any(f"/{zid}/" in str(p) or p.stem == zid for zid in allowed)
            ]
            if not reachable:
                errors.append(
                    f"{rid}: la clé est derrière la serrure — {label} n'est donné que par "
                    f"{[str(p) for p in granters]}, hors d'atteinte depuis {src} sans "
                    f"franchir le verrou"
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
