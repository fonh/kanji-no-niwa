#!/usr/bin/env python3
"""Linter de couverture kanji des leçons (Étape 4, ajouté après le bug de
régression du 2026-07-24, issue 01-swap-doublons-kanji.md).

Le swap de promotion du noyau (phase 1, commits 9d0a01ab + d687e176) a laissé
des occurrences périmées dans content/lessons/*.json : un hôte enseignant le
pool d'une zone empruntée gardait l'ancien kanji à une position réassignée par
le swap, alors que ce kanji est maintenant enseigné par sa nouvelle zone —
double emploi d'un côté, trou de l'autre. Aucun linter existant ne le
détectait (lint-kanji-budget.py vérifie le budget de studiedSet des dialogues,
pas la couverture des leçons elles-mêmes).

Deux contrôles :
  (a) Aucun kanji n'est enseigné deux fois à travers tout content/lessons/*.json
      — le signal direct du bug (1350 slots doivent donner 1350 kanji distincts).
  (b) Pour chaque fichier hôte, les kanji enseignés hors du pool propre de sa
      zone (new_kanji, content/kanji-zone-assignment.json) — donc empruntés à
      une zone sans leçon propre — ne doivent jamais appartenir à une zone qui A
      SA PROPRE leçon écrite : un tel cas signale exactement le pattern observé
      (元 emprunté par blackthorn-city alors que violet-city, sa vraie zone
      post-swap, a déjà son propre content/lessons/violet-city.json).

Usage :
    python3 scripts/validate/lint-lessons-kanji-coverage.py

Code de sortie 0 si tout passe, 1 sinon.
"""
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    za = load_json(ROOT / "content/kanji-zone-assignment.json")
    own_kanji = {z["zone_id"]: set(z["new_kanji"]) for z in za["zones"]}
    owner_of = {}
    for zone_id, kanji_set in own_kanji.items():
        for k in kanji_set:
            owner_of[k] = zone_id

    lesson_files = sorted((ROOT / "content/lessons").glob("*.json"))
    written_zones = {p.stem for p in lesson_files}

    taught_by_file = {}
    all_taught = []
    for path in lesson_files:
        zone_id = path.stem
        kanji_here = []
        for entry in load_json(path):
            kanji_here.extend(entry["kanji_ids"])
        taught_by_file[zone_id] = kanji_here
        all_taught.extend(kanji_here)

    findings = []

    # (a) no kanji taught twice anywhere
    counts = Counter(all_taught)
    dups = sorted(k for k, c in counts.items() if c > 1)
    for k in dups:
        locations = [zid for zid, ks in taught_by_file.items() if k in ks]
        findings.append(
            f"[FAIL] {k} enseigné {counts[k]} fois — dans : {', '.join(locations)}"
        )

    # (b) borrowed kanji must not belong to an already-written zone
    for zone_id, kanji_here in taught_by_file.items():
        own = own_kanji.get(zone_id, set())
        for k in kanji_here:
            if k in own:
                continue
            true_owner = owner_of.get(k)
            if true_owner is None:
                findings.append(
                    f"[FAIL] {zone_id}/lessons: {k} enseigné mais absent de "
                    f"kanji-zone-assignment.json (aucune zone ne le revendique)"
                )
            elif true_owner in written_zones and true_owner != zone_id:
                findings.append(
                    f"[FAIL] {zone_id}/lessons: {k} enseigné ici (emprunté) mais "
                    f"appartient à '{true_owner}', qui a déjà content/lessons/"
                    f"{true_owner}.json — probable régression de swap"
                )

    for f in findings:
        print(f)
    print(
        f"\n{len(lesson_files)} fichier(s) de leçons, {len(all_taught)} slots, "
        f"{len(set(all_taught))} kanji distincts enseignés."
    )
    if findings:
        print(f"{len(findings)} échec(s).")
        return 1
    print("0 échec.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
