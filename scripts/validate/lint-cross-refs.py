#!/usr/bin/env python3
"""
Étape 3 point 3 — vérificateur d'ids croisés.

Vérifie que :
- chaque `dialogue_ref` de content/map/npcs.json et content/map/trainers.json
  pointe vers un fichier qui existe réellement sous content/dialogues/ ;
- chaque `npc_ref`/`trainer_ref` de content/lessons/*.json correspond à un
  npc_id/trainer_id déclaré dans content/map/npcs.json ou trainers.json ;
- chaque `quest_id` référencé dans un `Effect.advance_quest`/`Condition.quest_step`
  d'un fichier de dialogue correspond à un fichier content/quests/<quest_id>.json
  existant, et chaque `step_id`/`step` qu'il cite est bien un step_id de ce fichier ;
- chaque `zone_id` utilisé existe dans content/kanji-zone-assignment.json ;
- (Étape 4 phase 0.6) chaque `item_id` d'un `item_owned`/`grant_item`/`remove_item`
  existe (rom-item-roster.json ∪ tout item_id accordé quelque part par un grant_item) ;
- (0.6) chaque `event_cleared` consommé figure dans content/engine-contract.md § 1 ;
- (0.6) chaque `quest_step` consommé est posé par un `advance_quest` quelque part, ou
  listé dans content/engine-contract.md § 3 (steps moteur-only) ;
- (0.6) aucun état `default: true` d'un state_rules[] ne porte d'Effect `remove_item`
  (anti-pattern du troc sans contrepartie, phase 0.2) ;
- (2026-08-06) un état `default: true` qui REMET un objet doit avoir un état d'après —
  sinon le personnage re-offre éternellement ce qu'il a déjà donné ;
- (0.6) `correct_index` des questions de texte : avertit (WARN, pas FAIL — le nettoyage
  est prévu phase 2.4) si un fichier a ≥2 questions et un unique correct_index partout.

Ne couvre pas encore : text_id/found_object_ref en tant que clé étrangère stricte
(content/texts/ trop jeune pour un registre stable côté found_object). À étendre au fil
de la passe contenu plutôt que d'anticiper des tables vides.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load_json(path):
    return json.loads(path.read_text())


def parse_contract_table_rows(section_marker):
    """Return, for each `| ... |` table row under a given '## N. Title' section of
    content/engine-contract.md, the list of `code span` tokens found in each of its first
    two cells (id columns) — later free-text columns are ignored, they may contain
    unrelated backtick-quoted file paths."""
    text = (ROOT / "content/engine-contract.md").read_text()
    m = re.search(rf"{re.escape(section_marker)}.*?(?=\n## |\Z)", text, re.S)
    if not m:
        return []
    rows = []
    for line in m.group(0).splitlines():
        if not line.startswith("|") or line.startswith("|---"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 2:
            continue
        tokens = re.findall(r"`([^`]+)`", cells[0]) + re.findall(r"`([^`]+)`", cells[1])
        if tokens:
            rows.append(tokens)
    return rows


def contract_event_ids():
    return {row[0] for row in parse_contract_table_rows("## 1.") if row}


def contract_shop_only_items():
    return {row[0] for row in parse_contract_table_rows("## 6.") if row}


def contract_engine_only_steps():
    """{(quest_id, step_id)} pairs from § 3 — first backtick token per row is the
    quest_id, the rest are its engine-only step_ids."""
    pairs = set()
    for row in parse_contract_table_rows("## 3."):
        if len(row) < 2:
            continue
        qid = row[0]
        for step in row[1:]:
            pairs.add((qid, step))
    return pairs


def collect_dialogue_effects_and_rules(obj, quest_refs):
    """Walk any content file collecting every (quest_id, step_id) pair referenced,
    whether as a Condition (quest_step) or an Effect (advance_quest)."""
    if isinstance(obj, dict):
        if obj.get("type") in ("advance_quest", "quest_step"):
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


def collect_quest_step_effects(obj, produced, consumed, path):
    """Separate the same walk into produced (advance_quest Effects) vs consumed
    (quest_step Conditions) (quest_id, step) pairs, each tagged with its source file."""
    if isinstance(obj, dict):
        if obj.get("type") == "advance_quest" and obj.get("quest_id") and obj.get("step_id"):
            produced.add((obj["quest_id"], obj["step_id"]))
        if obj.get("type") == "quest_step" and obj.get("quest_id") and obj.get("step"):
            consumed.add((obj["quest_id"], obj["step"], path))
        for v in obj.values():
            collect_quest_step_effects(v, produced, consumed, path)
    elif isinstance(obj, list):
        for v in obj:
            collect_quest_step_effects(v, produced, consumed, path)


def collect_item_refs(obj, granted, referenced, path):
    """granted: item_ids appearing in a grant_item Effect anywhere (defines the
    item's existence). referenced: (item_id, path) for every item_owned/grant_item/
    remove_item use, to check against the combined index afterwards."""
    if isinstance(obj, dict):
        t = obj.get("type")
        if t in ("item_owned", "grant_item", "remove_item") and obj.get("item_id"):
            referenced.append((obj["item_id"], t, path))
            if t == "grant_item":
                granted.add(obj["item_id"])
        for v in obj.values():
            collect_item_refs(v, granted, referenced, path)
    elif isinstance(obj, list):
        for v in obj:
            collect_item_refs(v, granted, referenced, path)


def collect_event_cleared_refs(obj, refs, path):
    if isinstance(obj, dict):
        if obj.get("type") == "event_cleared" and obj.get("event_id"):
            refs.append((obj["event_id"], path))
        for v in obj.values():
            collect_event_cleared_refs(v, refs, path)
    elif isinstance(obj, list):
        for v in obj:
            collect_event_cleared_refs(v, refs, path)


def check_default_state_no_remove_item(dialogue, path, errors, warnings):
    """Phase 0.2 anti-pattern: a `default: true` state_rules entry must never route to
    a Dialogue State whose effects include remove_item (a trade with no counter-state) —
    unless the file documents (`_lint_exceptions.default_remove_item`) why the item is
    guaranteed owned some other way (e.g. the NPC's own map-level unlock_conditions)."""
    rules = dialogue.get("state_rules")
    states = dialogue.get("dialogue_states")
    if not isinstance(rules, list) or not isinstance(states, dict):
        return
    exception = (dialogue.get("_lint_exceptions") or {}).get("default_remove_item")
    for rule in rules:
        if not rule.get("default"):
            continue
        state_name = rule.get("state")
        state = states.get(state_name, {})
        for eff in state.get("effects", []):
            if eff.get("type") == "remove_item":
                msg = (
                    f"{path}: l'état default '{state_name}' porte un Effect remove_item "
                    f"('{eff.get('item_id')}') — troc sans état d'attente (anti-pattern 0.2)"
                )
                if exception:
                    warnings.append(f"{msg} — exception documentée : {exception}")
                else:
                    errors.append(msg)


def check_gift_state_has_an_after(dialogue, path, errors):
    """Un état `default: true` qui REMET un objet doit avoir un état d'après.

    Ajouté 2026-08-06, sur un constat de jeu : « je récupère le Pokédex […] il
    se répète quand tu lui reparles ». `grant_item` est idempotent, donc rien
    n'est cassé — mais le personnage re-offre éternellement ce qu'il a déjà
    donné, et le joueur ne sait jamais si ça a marché. 13 dialogues étaient
    dans ce cas.

    La règle : si l'état par défaut porte un `grant_item`, une règle PLACÉE
    AU-DESSUS de lui doit se déclencher sur quelque chose que cet état rend
    vrai (l'objet possédé, l'étape de quête avancée, le badge obtenu) — sinon
    la sélection retombera toujours sur le même état.
    """
    rules = dialogue.get("state_rules")
    states = dialogue.get("dialogue_states")
    if not isinstance(rules, list) or not isinstance(states, dict):
        return
    default = next((r for r in rules if r.get("default")), None)
    if default is None:
        return
    effects = states.get(default.get("state"), {}).get("effects") or []
    gifts = [e["item_id"] for e in effects if e.get("type") == "grant_item"]
    if not gifts:
        return

    made_true = set()
    for eff in effects:
        kind = eff.get("type")
        if kind == "grant_item":
            made_true.add(("item_owned", eff["item_id"]))
        elif kind == "advance_quest":
            made_true.add(("quest_step", eff["quest_id"], eff["step_id"]))
        elif kind == "grant_badge":
            made_true.add(("badge_earned", eff["badge_id"]))

    for rule in rules:
        if rule.get("default"):
            break  # les règles APRÈS le défaut ne sont jamais atteintes
        for cond in rule.get("if") or []:
            if cond.get("negate"):
                continue
            kind = cond.get("type")
            key = None
            if kind == "item_owned":
                key = ("item_owned", cond.get("item_id"))
            elif kind == "quest_step":
                key = ("quest_step", cond.get("quest_id"), cond.get("step"))
            elif kind == "badge_earned":
                key = ("badge_earned", cond.get("badge_id"))
            if key in made_true:
                return

    errors.append(
        f"{path}: l'état default '{default.get('state')}' remet {gifts} mais aucune règle "
        f"au-dessus ne s'appuie sur ce qu'il rend vrai — le personnage re-offrira "
        f"éternellement le même objet"
    )


def check_text_correct_index_uniformity(text_obj, path, warnings):
    questions = (text_obj.get("text") or {}).get("questions")
    if not isinstance(questions, list) or len(questions) < 2:
        return
    indices = [q.get("correct_index") for q in questions if "correct_index" in q]
    if len(indices) == len(questions) and len(set(indices)) == 1:
        warnings.append(
            f"{path}: les {len(questions)} questions ont toutes correct_index={indices[0]} "
            f"— uniformité suspecte, prévu pour randomisation en phase 2.4"
        )


def main():
    errors = []
    warnings = []

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

    # Single walk over the whole content/ tree — feeds the quest-ref check (existing)
    # plus the phase 0.6 additions: item_ids, event_cleared, default-state remove_item,
    # correct_index uniformity, and produced-vs-consumed quest_step.
    quest_refs = {}
    produced_steps = set()
    consumed_steps = set()
    granted_items = set()
    item_refs = []
    event_refs = []

    all_content_files = sorted((ROOT / "content").rglob("*.json"))
    for cpath in all_content_files:
        rel = str(cpath.relative_to(ROOT))
        obj = load_json(cpath)
        collect_dialogue_effects_and_rules(obj, quest_refs)
        collect_quest_step_effects(obj, produced_steps, consumed_steps, rel)
        collect_item_refs(obj, granted_items, item_refs, rel)
        collect_event_cleared_refs(obj, event_refs, rel)
        if isinstance(obj, dict) and "state_rules" in obj and "dialogue_states" in obj:
            check_default_state_no_remove_item(obj, rel, errors, warnings)
            check_gift_state_has_an_after(obj, rel, errors)
        if isinstance(obj, dict) and isinstance(obj.get("text"), dict) and "questions" in obj["text"]:
            check_text_correct_index_uniformity(obj, rel, warnings)

    for qid, steps in quest_refs.items():
        if qid not in quests:
            errors.append(f"quest_id '{qid}' référencé dans du contenu mais content/quests/{qid}.json introuvable")
            continue
        for step in steps:
            if step not in quests[qid]:
                errors.append(f"quest '{qid}': step '{step}' référencé dans du contenu mais absent de ses steps[]")

    # 0.6 — quest_step consommé sans producteur (advance_quest) ni entrée au contrat moteur
    engine_only_steps = contract_engine_only_steps()
    for qid, step, path in sorted(consumed_steps):
        if (qid, step) in produced_steps or (qid, step) in engine_only_steps:
            continue
        errors.append(
            f"{path}: quest_step '{qid}:{step}' consommé mais jamais posé par un advance_quest "
            f"ni listé dans content/engine-contract.md § 3"
        )

    # 0.6 — item_ids : index ROM ∪ tout ce qui est accordé par un grant_item quelque part
    roster = load_json(ROOT / "content/rom-item-roster.json")
    rom_item_ids = {it["slug"] for zone_items in roster.get("zones", {}).values() for it in zone_items}
    known_items = rom_item_ids | granted_items | contract_shop_only_items()
    for item_id, kind, path in item_refs:
        if item_id not in known_items:
            errors.append(
                f"{path}: item_id '{item_id}' ({kind}) absent de rom-item-roster.json, jamais "
                f"accordé par un grant_item ailleurs dans content/, et absent de "
                f"content/engine-contract.md § 6 (items de boutique)"
            )

    # 0.6 — event_cleared : doit figurer dans content/engine-contract.md § 1
    contract_events = contract_event_ids()
    for event_id, path in event_refs:
        if event_id not in contract_events:
            errors.append(
                f"{path}: event_cleared '{event_id}' absent de content/engine-contract.md § 1"
            )

    for w in warnings:
        print(f"[WARN] {w}")

    if errors:
        for e in errors:
            print(f"[FAIL] {e}")
        print(f"\n{len(errors)} erreur(s).")
        return 1

    print(
        "Tous les ids croisés (dialogue_ref, npc_ref/trainer_ref, quest_id/step_id, zone_id, "
        f"item_id, event_cleared) sont cohérents — {len(warnings)} avertissement(s)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
