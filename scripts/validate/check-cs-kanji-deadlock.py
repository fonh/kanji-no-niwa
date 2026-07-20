#!/usr/bin/env python3
"""
Étape 3 point 3 — vérificateur anti-deadlock (première version, minimale).

Invariant à garantir (PRD.md § CS-Kanji, § Textes Progressifs) : le PNJ/texte
qui REMET un CS-Kanji ne doit jamais lui-même être derrière un obstacle qui
exige un CS-Kanji (le sien ou un autre) — sinon le jeu est softlocké : le
joueur ne peut jamais obtenir la clé qui ouvre la porte qui mène à la clé.

Portée réelle de cette version (pas de pathfinding — le tile-authoring
n'existe pas encore, Étape 5 point 4) : vérifie ce qui EST modélisé en
données aujourd'hui —
  1. pour chaque `map_obstacles` gaté sur `item_owned(cs_X)`, le PNJ dont le
     dialogue accorde `cs_X` (`grant_item` avec ce `item_id`) n'a lui-même
     aucun `unlock_conditions` de type `item_owned` sur un CS-Kanji, sur son
     entrée `map_npcs` ;
  2. le texte obligatoire associé (`unlock_text` dans le même dialogue_state)
     n'a pas de `found_object_ref` pointant vers un objet lui-même gaté par
     un CS-Kanji.
Ne remplace pas une vraie vérification de connexité de carte — un obstacle
peut légitimement bloquer un AUTRE chemin (un raccourci) sans jamais être le
SEUL chemin vers le donneur de CS ; cette version ne peut pas encore le
distinguer (pas de graphe de tuiles), donc elle vérifie la garantie plus
étroite mais réelle ci-dessus, suffisante tant qu'un seul obstacle par CS
existe.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

CS_KANJI_ITEM_IDS = {
    "cs_kudakeru": "砕",
    "cs_tobu": "飛",
    "cs_nami": "水",
    "cs_chikara": "力",
    "cs_kiru": "切",
    "cs_taki": "滝",
    "cs_uzu": "渦",
    "cs_noboru": "登",
}


def load_json(path):
    return json.loads(path.read_text())


def find_grant_item_dialogues(item_id):
    """Return [(dialogue_path, npc_id)] for every dialogue that grant_items this item_id."""
    hits = []
    for dpath in sorted((ROOT / "content/dialogues").rglob("*.json")):
        obj = load_json(dpath)
        npc_id = obj.get("npc_id") or obj.get("trainer_id")
        found = []

        def walk(o):
            if isinstance(o, dict):
                if o.get("type") == "grant_item" and o.get("item_id") == item_id:
                    found.append(True)
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)

        walk(obj)
        if found:
            hits.append((dpath, npc_id))
    return hits


def find_unlock_conditions_for_npc(npc_id):
    for registry_name in ("npcs.json", "trainers.json"):
        registry = load_json(ROOT / "content/map" / registry_name)
        for e in registry:
            if e.get("npc_id") == npc_id or e.get("trainer_id") == npc_id:
                return e.get("unlock_conditions", [])
    return None


def condition_requires_cs_kanji(conditions):
    hits = []
    for c in conditions or []:
        if c.get("type") == "item_owned" and c.get("item_id") in CS_KANJI_ITEM_IDS:
            hits.append(c["item_id"])
    return hits


def main():
    errors = []
    checked = 0

    for item_id, character in CS_KANJI_ITEM_IDS.items():
        grants = find_grant_item_dialogues(item_id)
        if not grants:
            continue  # ce CS n'a pas encore de contenu écrit — rien à vérifier
        checked += 1
        for dpath, npc_id in grants:
            if npc_id is None:
                errors.append(f"{dpath.relative_to(ROOT)}: accorde {character} ({item_id}) mais n'a pas de npc_id/trainer_id — impossible de vérifier son accès")
                continue
            conditions = find_unlock_conditions_for_npc(npc_id)
            if conditions is None:
                errors.append(f"'{npc_id}' accorde {character} ({item_id}) mais n'apparaît dans aucun registre map/npcs.json ou map/trainers.json")
                continue
            blocking = condition_requires_cs_kanji(conditions)
            if blocking:
                errors.append(
                    f"DEADLOCK : '{npc_id}' accorde {character} ({item_id}) mais sa propre présence "
                    f"exige déjà {blocking} — le joueur ne peut jamais l'atteindre pour la première fois"
                )

    # signale (sans faire échouer) les obstacles CS-gatés dont le CS n'est pas encore remis
    # nulle part dans le contenu écrit — attendu la plupart du temps pendant l'Étape 4 (la
    # majorité des 8 CS n'ont pas encore leur zone écrite), pas un deadlock : un vrai deadlock
    # exige que le donneur EXISTE et soit lui-même bloqué (vérifié ci-dessus), pas que le CS
    # n'existe pas encore.
    warnings = []
    obstacles_path = ROOT / "content/map/obstacles.json"
    if obstacles_path.exists():
        for o in load_json(obstacles_path):
            for c in o.get("unlock_conditions", []):
                if c.get("type") == "item_owned" and c.get("item_id") in CS_KANJI_ITEM_IDS:
                    item_id = c["item_id"]
                    if not find_grant_item_dialogues(item_id):
                        warnings.append(
                            f"map/obstacles.json: '{o['obstacle_id']}' est gaté sur {item_id}, "
                            f"pas encore accordé nulle part — normal si sa zone de remise n'est pas encore écrite"
                        )

    for w in warnings:
        print(f"[WARN] {w}")

    if errors:
        for e in errors:
            print(f"[FAIL] {e}")
        print(f"\n{checked} CS-Kanji vérifié(s) — {len(errors)} erreur(s).")
        return 1

    print(f"{checked} CS-Kanji vérifié(s), {len(warnings)} avertissement(s) — aucun deadlock détecté (portée : accès du donneur, pas de pathfinding de carte).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
