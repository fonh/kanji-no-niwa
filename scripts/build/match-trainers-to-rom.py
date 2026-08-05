#!/usr/bin/env python3
"""Repose les dresseurs de content/map/trainers.json sur leur objet ROM.

POURQUOI (issue 13, « les dresseurs sur la route ne font rien »)
----------------------------------------------------------------
Les positions des dresseurs étaient `source: "generated"` : inventées lors du
dépouillement, jamais confrontées à la ROM. Sur Route 30, les trois dresseurs
étaient posés en (6,0), (19,13), (23,23) alors que le jeu les place en (6,10),
(9,44), (8,37) — et tous tournés vers le sud alors que deux regardent l'est et
l'ouest. Un dresseur mal placé et mal orienté, c'est une ligne de vue qui ne
croise jamais le chemin du joueur : aucune embuscade, jamais.

L'identité est pourtant DÉJÀ dans les données extraites. Le champ `scriptId`
des objets vaut littéralement `std_trainer(TRAINER_BUG_CATCHER_DON)` — le jeu
attache le combat à l'objet par ce script standard. Il suffisait de le lire.

APPARIEMENT
-----------
Les constantes ROM portent des infixes que les noms de contenu n'ont pas
(`TRAINER_BIRD_KEEPER_GS_ROD` pour « Bird Keeper Rod », `TRAINER_PSYCHIC_M_MARK`
pour « Psychic Mark »). On exige donc que les mots du nom de contenu forment une
SOUS-SÉQUENCE des mots de la constante, dans l'ordre, et on départage par zone.
Un dresseur qui reste ambigu ou sans correspondance n'est pas touché : mieux
vaut une position inventée qu'une position confidente et fausse.

  python3 scripts/build/match-trainers-to-rom.py            # rapport seul
  python3 scripts/build/match-trainers-to-rom.py --write    # écrit trainers.json
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ZONE_DATA = Path("scripts/sources/zone-data.json")
REGISTRY = Path("src/data/zone-registry.json")
TRAINERS = Path("content/map/trainers.json")

FACING = {0: "north", 1: "south", 2: "west", 3: "east"}


def tokens(s: str) -> list[str]:
    return [t for t in re.split(r"[^a-z0-9]+", s.lower()) if t]


def is_subsequence(needle: list[str], haystack: list[str]) -> bool:
    it = iter(haystack)
    return all(any(n == h for h in it) for n in needle)


def zone_id_of(map_name: str) -> str:
    return map_name.replace("MAP_", "").lower().replace("_", "-")


def main() -> None:
    write = "--write" in sys.argv
    zones = json.load(open(ZONE_DATA))["zones"]
    registry = {z["name"]: z for z in json.load(open(REGISTRY))["zones"]}

    rom: list[dict] = []
    for z in zones:
        reg = registry.get(z["name"])
        if reg is None:
            continue
        for o in z.get("objects", []):
            m = re.match(r"std_trainer\((TRAINER_[A-Z0-9_]+)\)", str(o.get("scriptId", "")))
            if not m:
                continue
            rom.append({
                "constant": m.group(1),
                "words": tokens(m.group(1).replace("TRAINER_", "")),
                "map": z["name"],
                "zone_id": zone_id_of(z["name"]),
                "object_id": o["id"],
                "sprite_id": o["spriteId"],
                "tile_x": o["x"] - reg["world_origin_x"],
                "tile_y": o["z"] - reg["world_origin_y"],
                "facing": FACING.get(o.get("facingDirection", 1), "south"),
            })
    print(f"{len(rom)} objets `std_trainer(...)` dans les données ROM")

    trainers = json.load(open(TRAINERS))
    matched = ambiguous = unmatched = moved = 0
    report_unmatched: list[str] = []
    report_ambiguous: list[str] = []

    for t in trainers:
        want = tokens(t["name"])
        cands = [r for r in rom if is_subsequence(want, r["words"])]
        # Départage par zone : deux dresseurs peuvent partager un prénom d'un
        # bout à l'autre du jeu ; celui de la bonne zone gagne.
        same_zone = [
            r for r in cands
            if r["zone_id"] == t["zone_id"] or r["zone_id"].startswith(t["zone_id"] + "-")
        ]
        pick = same_zone or cands
        if len(pick) != 1:
            if pick:
                ambiguous += 1
                report_ambiguous.append(f"{t['trainer_id']} → {[r['constant'] for r in pick]}")
            else:
                unmatched += 1
                report_unmatched.append(f"{t['trainer_id']} ({t['name']}, {t['zone_id']})")
            continue

        r = pick[0]
        matched += 1
        changed = (t.get("tile_x"), t.get("tile_y"), t.get("facing")) != (
            r["tile_x"], r["tile_y"], r["facing"]
        )
        if changed:
            moved += 1
        if write:
            t["tile_x"] = r["tile_x"]
            t["tile_y"] = r["tile_y"]
            t["facing"] = r["facing"]
            t["sprite_id"] = r["sprite_id"]
            t["map_zone"] = r["map"]
            t["matched_object_id"] = r["object_id"]
            t["rom_trainer"] = r["constant"]
            t["position_status"] = (
                f"reposé sur l'objet ROM {r['object_id']} ({r['constant']}) — "
                f"scripts/build/match-trainers-to-rom.py, issue 13"
            )

    print(f"  appariés   {matched:4d}  (dont {moved} déplacés)")
    print(f"  ambigus    {ambiguous:4d}  (laissés tels quels)")
    print(f"  sans match {unmatched:4d}  (laissés tels quels)")
    if report_ambiguous:
        print("\nAmbigus :")
        for line in report_ambiguous[:15]:
            print("   ", line)
    if report_unmatched:
        print("\nSans correspondance (chef d'arène, personnage scénarisé, ou zone "
              "découpée autrement dans la ROM) :")
        for line in report_unmatched[:20]:
            print("   ", line)
        if len(report_unmatched) > 20:
            print(f"    … et {len(report_unmatched) - 20} autres")

    if write:
        json.dump(trainers, open(TRAINERS, "w"), ensure_ascii=False, indent=1)
        print(f"\n→ {TRAINERS} réécrit")
    else:
        print("\n(rapport seul — relancer avec --write pour appliquer)")


if __name__ == "__main__":
    main()
