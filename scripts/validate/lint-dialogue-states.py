#!/usr/bin/env python3
"""Linter de cohérence state_rules / dialogue_states (Étape 4, ajouté après le
bug du 2026-07-24, issue 02-state-rules-etat-inexistant.md).

Deux dialogues avaient une règle default pointant vers un état ('welcome') qui
n'existait pas dans dialogue_states — le seul état défini portait un autre nom
('scene', 'caught'). Au runtime, le moteur ne trouverait aucun état à
afficher : dialogue mort, invisible à tous les linters existants (aucun ne
vérifie la cohérence entre les deux structures).

Trois contrôles par fichier de dialogue (content/dialogues/npcs/**, trainers/**) :
  (a) chaque state_rules[].state existe comme clé dans dialogue_states ;
  (b) exactement une règle 'default': true, et elle est en dernière position
      (les state_rules sont évaluées dans l'ordre — un default plus tôt
      masquerait toutes les règles suivantes) ;
  (c) tout état de dialogue_states qui n'est jamais référencé par une règle
      state_rules (hors intro/battle_intro/post_battle, gérés par le moteur de
      combat sans passer par state_rules) est mort — jamais sélectionnable.

Usage :
    python3 scripts/validate/lint-dialogue-states.py

Code de sortie 0 si tout passe, 1 sinon.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE_STATES = {"battle_intro", "post_battle"}


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def check_file(path, findings):
    try:
        obj = load_json(path)
    except Exception as e:
        findings.append(f"[FAIL] {path.relative_to(ROOT)}: JSON illisible ({e})")
        return

    dialogue_states = obj.get("dialogue_states")
    if not isinstance(dialogue_states, dict) or not dialogue_states:
        return  # pas un dialogue à états (ex. gabarit), rien à vérifier

    state_rules = obj.get("state_rules")
    defined = set(dialogue_states.keys())

    if state_rules is None:
        # battle-only files (battle_intro/post_battle) n'ont pas de state_rules
        if defined - ENGINE_STATES:
            findings.append(
                f"[WARN] {path.relative_to(ROOT)}: dialogue_states sans state_rules "
                f"et sans clé engine reconnue ({sorted(defined - ENGINE_STATES)})"
            )
        return

    referenced = set()
    default_positions = []
    for i, rule in enumerate(state_rules):
        state = rule.get("state")
        if state is not None:
            referenced.add(state)
            if state not in defined:
                findings.append(
                    f"[FAIL] {path.relative_to(ROOT)}: state_rules[{i}] pointe vers "
                    f"'{state}', absent de dialogue_states (clés : {sorted(defined)})"
                )
        if rule.get("default"):
            default_positions.append(i)

    if len(default_positions) != 1:
        findings.append(
            f"[FAIL] {path.relative_to(ROOT)}: {len(default_positions)} règle(s) "
            f"'default': true (il en faut exactement une)"
        )
    elif default_positions[0] != len(state_rules) - 1:
        findings.append(
            f"[FAIL] {path.relative_to(ROOT)}: la règle default n'est pas en "
            f"dernière position (index {default_positions[0]} sur {len(state_rules)})"
        )

    dead = defined - referenced - ENGINE_STATES
    for state in sorted(dead):
        findings.append(
            f"[WARN] {path.relative_to(ROOT)}: dialogue_states['{state}'] défini "
            f"mais jamais sélectionné par state_rules — état mort"
        )


def main():
    findings = []
    paths = sorted((ROOT / "content/dialogues").rglob("*.json"))
    for path in paths:
        check_file(path, findings)

    for f in findings:
        print(f)
    fails = [f for f in findings if f.startswith("[FAIL]")]
    warns = [f for f in findings if f.startswith("[WARN]")]
    print(f"\n{len(paths)} fichier(s) de dialogue vérifié(s) — "
          f"{len(fails)} échec(s), {len(warns)} avertissement(s).")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
