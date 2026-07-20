#!/usr/bin/env python3
"""
Étape 3 point 3 — vérificateur d'ids croisés (première version, minimale).

Vérifie que :
- chaque `dialogue_ref` de content/map/npcs.json et content/map/trainers.json
  pointe vers un fichier qui existe réellement sous content/dialogues/ ;
- chaque `npc_ref`/`trainer_ref` de content/lessons/*.json correspond à un
  npc_id/trainer_id déclaré dans content/map/npcs.json ou trainers.json ;
- chaque `quest_id` référencé dans un `Effect.advance_quest`/`Condition.quest_step`
  d'un fichier de dialogue correspond à un fichier content/quests/<quest_id>.json
  existant, et chaque `step_id`/`step` qu'il cite est bien un step_id de ce fichier ;
- chaque `zone_id` utilisé existe dans content/kanji-zone-assignment.json.

Ne couvre pas encore : item_ids (pas de table `items` officielle à ce stade),
text_id/found_object_ref (content/texts/ trop jeune pour un registre stable).
À étendre au fil de la passe contenu plutôt que d'anticiper des tables vides.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load_json(path):
    return json.loads(path.read_text())


def collect_dialogue_effects_and_rules(obj, quest_refs):
    """Walk a dialogue file collecting every (quest_id, step_id) pair referenced."""
    if isinstance(obj, dict):
        if obj.get("type") == "advance_quest" or obj.get("type") == "quest_step":
            qid = obj.get("quest_id")
            step = obj.get("step_id") or obj.get("step")
            if qid:
                quest_refs.setdefault(qid, set())
                if step:
                    quest_refs[qid].add(step)
        for v in obj.values():
            collect_dialogue_effects_and_rules(v, quest_refs)
    elif isinstance(obj, list):
        for v in obj:
            collect_dialogue_effects_and_rules(v, quest_refs)


def main():
    errors = []

    zones = {z["zone_id"] for z in load_json(ROOT / "content/kanji-zone-assignment.json")["zones"]}

    npc_ids = set()
    trainer_ids = set()
    dialogue_refs = []

    npcs = load_json(ROOT / "content/map/npcs.json")
    for e in npcs:
        npc_ids.add(e["npc_id"])
        if e.get("zone_id") not in zones:
            errors.append(f"map/npcs.json: {e['npc_id']} a un zone_id inconnu '{e.get('zone_id')}'")
        if "dialogue_ref" in e:
            dialogue_refs.append((f"map/npcs.json:{e['npc_id']}", e["dialogue_ref"]))

    trainers = load_json(ROOT / "content/map/trainers.json")
    for e in trainers:
        trainer_ids.add(e["trainer_id"])
        if e.get("zone_id") not in zones:
            errors.append(f"map/trainers.json: {e['trainer_id']} a un zone_id inconnu '{e.get('zone_id')}'")
        if "dialogue_ref" in e:
            dialogue_refs.append((f"map/trainers.json:{e['trainer_id']}", e["dialogue_ref"]))

    for origin, ref in dialogue_refs:
        p = ROOT / "content/dialogues" / f"{ref}.json"
        if not p.exists():
            errors.append(f"{origin}: dialogue_ref '{ref}' → fichier introuvable ({p.relative_to(ROOT)})")

    all_npc_and_trainer_ids = npc_ids | trainer_ids
    for lessons_path in sorted((ROOT / "content/lessons").glob("*.json")):
        rows = load_json(lessons_path)
        for row in rows:
            ref = row.get("npc_ref") or row.get("trainer_ref")
            if ref not in all_npc_and_trainer_ids:
                errors.append(
                    f"{lessons_path.relative_to(ROOT)}: npc_ref/trainer_ref '{ref}' "
                    f"absent de map/npcs.json et map/trainers.json"
                )
            if row.get("zone_id") not in zones:
                errors.append(f"{lessons_path.relative_to(ROOT)}: zone_id inconnu '{row.get('zone_id')}'")

    quests = {}
    for qp in sorted((ROOT / "content/quests").glob("*.json")):
        q = load_json(qp)
        quests[q["quest_id"]] = {s["step_id"] for s in q.get("steps", [])}

    quest_refs = {}
    for dpath in sorted((ROOT / "content/dialogues").rglob("*.json")):
        obj = load_json(dpath)
        collect_dialogue_effects_and_rules(obj, quest_refs)

    for qid, steps in quest_refs.items():
        if qid not in quests:
            errors.append(f"quest_id '{qid}' référencé dans des dialogues mais content/quests/{qid}.json introuvable")
            continue
        for step in steps:
            if step not in quests[qid]:
                errors.append(f"quest '{qid}': step '{step}' référencé dans un dialogue mais absent de ses steps[]")

    if errors:
        for e in errors:
            print(f"[FAIL] {e}")
        print(f"\n{len(errors)} erreur(s).")
        return 1

    print("Tous les ids croisés (dialogue_ref, npc_ref/trainer_ref, quest_id/step_id, zone_id) sont cohérents.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
