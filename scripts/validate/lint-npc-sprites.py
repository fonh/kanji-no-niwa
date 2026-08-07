#!/usr/bin/env python3
"""Vérifie qu'un personnage curaté est DESSINÉ quelque part.

POURQUOI (issue 13, QA humaine du 2026-08-07)
---------------------------------------------
Un PNJ sans `sprite_id` n'était rendu que comme un div vide de 18 px : rien à
l'écran. Le joueur croisait des tuiles vides qui répondent au bouton A. Vu dans
la maison de M. Pokémon — le personnage qui remet l'Œuf, et le Prof. Chen,
invisibles tous les deux, pendant que la capture montrait leurs sosies peints.

Deux façons d'être visible :

  1. `sprite_id` déclaré, et résoluble en une planche de public/sprites/overworld ;
  2. à défaut, un objet ROM sur la MÊME tuile : le moteur en hérite l'apparence
     (`inheritedSpriteId`, src/lib/rom-decor.ts). C'est le cas des personnages
     reposés sur leur objet ROM, la bonne pratique de la passe PNJ.

Panneaux et objets (`kind`) sont hors sujet : ils sont déjà peints sur la carte.

BLOQUANT sur le chemin critique (début de partie → première arène) : c'est là
que le joueur est, et un donneur d'objet invisible bloque la progression.
Ailleurs, un simple relevé — c'est le travail de la passe PNJ
(.scratch/prompts/passe-pnj-ambiants.md), zone par zone.

  python3 scripts/validate/lint-npc-sprites.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

NPCS = Path("content/map/npcs.json")
TRAINERS = Path("content/map/trainers.json")
ZONES = Path("content/map/zones.json")
REGISTRY = Path("src/data/zone-registry.json")
SHEETS = Path("public/sprites/overworld")

SPRITES_TS = Path("src/lib/npc-sprites.ts")


def _table(name: str) -> dict[str, str]:
    """Une des tables de correspondance de npc-sprites.ts, lue à la source pour
    ne pas la recopier ici (elle changerait sans qu'on le sache)."""
    src = SPRITES_TS.read_text()
    bloc = re.search(rf"const {name}: Record<string, string> = {{(.*?)}}", src, re.S)
    return dict(re.findall(r"(SPRITE_[A-Z0-9_]+):\s*'([a-z0-9_]+)'", bloc.group(1) if bloc else ""))


HNS_PEOPLE = _table("HNS_PEOPLE")
BROKEN_FALLBACKS = _table("BROKEN_SPRITE_FALLBACKS")


def resolvable(sprite_id: str) -> bool:
    """Même cascade que resolveNpcSprite. `SPRITE_VAR_n` est délibérément
    absent : ce créneau ne se résout QUE depuis le drapeau d'un objet ROM, donc
    jamais depuis un `sprite_id` écrit à la main."""
    if sprite_id in HNS_PEOPLE:
        return (Path("public/sprites/hns/people") / f"{HNS_PEOPLE[sprite_id]}.png").exists()
    label = BROKEN_FALLBACKS.get(sprite_id) or re.sub(r"^SPRITE_", "", sprite_id).lower()
    return any((SHEETS / f"{c}.png").exists() for c in (label, re.sub(r"_\d+$", "", label)))


def rom_resolvable(obj: dict) -> bool:
    """Un objet ROM se résout comme un `sprite_id`, PLUS le créneau
    `SPRITE_VAR_n` : celui-là se lit sur le drapeau de l'objet (l'ami, le rival),
    ce qu'un sprite_id écrit à la main n'a pas."""
    sid = obj["spriteId"]
    if re.fullmatch(r"SPRITE_VAR_\d+", sid):
        flag = obj.get("eventFlag") or ""
        if re.search(r"RIVAL|SILVER", flag):
            return (SHEETS / "gsrivel.png").exists()
        if "FRIEND" in flag:
            return (SHEETS / "heroine.png").exists()
        return False
    return resolvable(sid)


def main() -> int:
    zones_doc = json.load(open(ZONES))["zones"]
    default_map = {z["zone_id"]: z["map_name"] for z in zones_doc}
    registry = {z["name"]: z for z in json.load(open(REGISTRY))["zones"]}

    errors: list[str] = []
    muets: dict[str, list[str]] = {}

    for entry in json.load(open(NPCS)) + json.load(open(TRAINERS)):
        eid = entry.get("npc_id") or entry.get("trainer_id")
        if entry.get("kind") in ("sign", "object"):
            continue
        sprite = entry.get("sprite_id")
        if sprite:
            if not resolvable(sprite):
                errors.append(f"{eid}: sprite déclaré introuvable ({sprite})")
            continue

        # Pas de sprite déclaré : reste l'héritage de l'objet ROM sous ses pieds.
        home = entry.get("map_zone") or default_map.get(entry["zone_id"])
        zone = registry.get(home) if home else None
        herite = None
        if zone and entry.get("tile_x") is not None:
            wx = entry["tile_x"] + zone["world_origin_x"]
            wz = entry["tile_y"] + zone["world_origin_y"]
            for o in zone["objects"]:
                if o["x"] == wx and o["z"] == wz and rom_resolvable(o):
                    herite = o["spriteId"]
                    break
        if herite:
            continue

        # Un personnage POSÉ sur une carte servie et sans apparence est un bug :
        # le joueur voit une tuile vide qui répond au bouton A. Un personnage
        # dont la zone de contenu n'est reliée à AUCUN MAP_* est un manque d'une
        # autre nature (la zone n'est pas encore jouable) : il n'est dessiné
        # nulle part de toute façon, on le relève sans bloquer.
        if zone is None or entry.get("tile_x") is None:
            muets.setdefault(entry["zone_id"], []).append(eid)
        else:
            errors.append(
                f"{eid} ({entry['zone_id']}, {home}): invisible — ni sprite_id, "
                f"ni objet ROM sous ses pieds. "
                f"Lancer scripts/build/assign-npc-sprites.py"
            )

    total_muets = sum(len(v) for v in muets.values())
    print(f"{total_muets} personnage(s) dans une zone de contenu sans carte "
          f"({len(muets)} zone(s)) — non dessinés faute de MAP_*, pas faute de sprite")

    if errors:
        print(f"\n{len(errors)} personnage(s) POSÉS sur une carte et invisibles :")
        for e in errors:
            print(f"  [ERREUR] {e}")
        return 1
    print(f"Tous les personnages posés sur une carte sont dessinés.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
