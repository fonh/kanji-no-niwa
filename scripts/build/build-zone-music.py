#!/usr/bin/env python3
"""Complète le registre audio des zones (content/map/zones.json).

POURQUOI (issue 13, « il n'y a plus de musique »)
-------------------------------------------------
Le registre audio ne couvrait que **20 zones** — les 4 extérieures du jalon 1 et
leurs intérieurs. Le reste du jeu était silencieux : sortir de la Route 30
coupait la musique, et rien ne le signalait. Ce n'était pas une régression mais
une couverture jamais étendue.

Tout le nécessaire était pourtant déjà là :

  * `content/zone-registry-names.json` — 83 zones, chacune avec le titre EN de sa
    piste (`music_track.en`) et son identifiant de séquence ROM ;
  * `public/audio/ost/` — la bande originale complète (97 pistes sur 2 disques),
    dont les noms de fichier reprennent exactement ces titres.

Ce script fait le rapprochement et écrit une entrée par zone ET par intérieur
(un intérieur sans piste propre prend celle de sa zone d'accès, règle déjà posée
dans le registre existant).

Les 20 entrées d'origine sont CONSERVÉES telles quelles : elles pointent des
fichiers déjà préparés (`/audio/bgm/*.mp3`), inutile de les remplacer par la
piste OST brute.

  python3 scripts/build/build-zone-music.py            # rapport
  python3 scripts/build/build-zone-music.py --write
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

NAMES = Path("content/zone-registry-names.json")
ZONES = Path("content/map/zones.json")
REGISTRY = Path("src/data/zone-registry.json")
OST_DIR = Path("public/audio/ost")


def normalize(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", s.lower())


def zone_slug(map_name: str) -> str:
    return map_name.replace("MAP_", "").lower().replace("_", "-")


def main() -> None:
    write = "--write" in sys.argv
    names = json.load(open(NAMES))["zones"]
    doc = json.load(open(ZONES))
    existing = {z["map_name"]: z for z in doc["zones"]}
    registry = json.load(open(REGISTRY))["zones"]

    ost = {}
    for path in sorted(OST_DIR.rglob("*.mp3")):
        # « 22 - Violet City.mp3 » → « violetcity »
        title = re.sub(r"^\d+\s*-\s*", "", path.stem)
        ost[normalize(title)] = "/" + str(path.relative_to("public"))

    by_slug = {n["zone_id"]: n for n in names}
    # Le slug d'une carte ne reprend pas toujours celui du contenu : la ROM dit
    # MAP_VIOLET là où le contenu dit « violet-city », MAP_NEW_BARK là où il dit
    # « new-bark-town ». On indexe donc chaque zone de contenu par son préfixe
    # de carte (suffixe -city/-town retiré), et on retient le PLUS LONG préfixe
    # qui colle — MAP_VIOLET_GYM appartient à violet-city, pas à violet.
    prefixes: dict[str, str] = {}
    for zid in by_slug:
        prefixes[zid] = zid
        for suffix in ("-city", "-town"):
            if zid.endswith(suffix):
                prefixes[zid[: -len(suffix)]] = zid
    ordered = sorted(prefixes, key=len, reverse=True)

    # Certains intérieurs ont leur piste PROPRE dans le jeu, iconique et
    # reconnaissable : hériter de la piste de la ville y serait un contresens
    # (on n'entend pas le thème de la ville dans un Centre Pokémon).
    INTERIOR_TRACKS = [
        ("_GYM", "Pokémon Gym"),
        ("_POKECENTER", "Pokémon Center"),
        ("_POKEMART", "Poké Mart"),
        ("_GAME_CORNER", "Game Corner"),
        ("_GLOBAL_TERMINAL", "Global Terminal"),
    ]

    added, unmatched = [], []
    for z in registry:
        map_name = z["name"]
        if map_name in existing or map_name == "MAP_EVERYWHERE":
            continue
        slug = zone_slug(map_name)
        key = next((p for p in ordered if slug == p or slug.startswith(p + "-")), None)
        owner = prefixes.get(key) if key else None
        if owner is None:
            unmatched.append(map_name)
            continue
        entry = by_slug[owner]
        title = entry["music_track"]["en"]
        for marker, own_track in INTERIOR_TRACKS:
            if marker in map_name and normalize(own_track) in ost:
                title = own_track
                break
        track = ost.get(normalize(title))
        if track is None:
            unmatched.append(f"{map_name} (piste « {entry['music_track']['en']} » introuvable)")
            continue
        added.append({
            "zone_id": owner if slug == owner else slug,
            "map_name": map_name,
            "name": entry["name"] if slug == owner else None,
            "region": "kanto" if "KANTO" in map_name else "johto",
            "music_ref": track,
            "is_interior": not z["is_outdoor"],
            "note": None if slug == owner
            else (
                f"Piste propre du lieu ({title})."
                if title != entry["music_track"]["en"]
                else "Intérieur sans piste propre : piste de la zone d'accès (règle du registre)."
            ),
        })

    print(f"{len(existing)} entrées existantes conservées")
    print(f"{len(added)} zones ajoutées")
    if unmatched:
        print(f"{len(unmatched)} sans piste :")
        for u in unmatched[:15]:
            print("   -", u)
        if len(unmatched) > 15:
            print(f"   … et {len(unmatched) - 15} autres")

    if write:
        doc["zones"] = doc["zones"] + added
        json.dump(doc, open(ZONES, "w"), ensure_ascii=False, indent=1)
        print(f"\n→ {ZONES} : {len(doc['zones'])} zones au total")
    else:
        print("\n(rapport seul — relancer avec --write)")


if __name__ == "__main__":
    main()
