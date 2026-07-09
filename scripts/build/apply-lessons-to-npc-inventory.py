#!/usr/bin/env python3
"""
Fusionne content/lessons-proposal.json dans la colonne « Type assigné » de
content/npc-inventory.md (Étape 2 point 5 de la roadmap), au format défini
dans l'en-tête de npc-inventory.md (audit 06, finding 06-C3) :

  leçon #<n> — 漢字: <liste> — 文法: <titre Hanabira exact | —>

Un PNJ qui porte plusieurs leçons (cyclage round-robin, cf. précédent
bootstrap Elm) reste une seule ligne du tableau -- ses leçons successives
sont concaténées dans la même cellule, séparées par <br> (pas de ligne
dupliquée : chaque PNJ ici est sourcé une fois dans guidebook-adapted.md,
dupliquer la ligne romprait ce lien).

Ne touche jamais une ligne déjà taguée (combat, ou toute valeur non vide).
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def format_lesson(lesson):
    kanji = "・".join(lesson["kanji_ids"])
    grammar = lesson["grammar_titles"][0] if lesson["grammar_titles"] else "—"
    return f"leçon #{lesson['sequence_index']} — 漢字: {kanji} — 文法: {grammar}"


def main():
    proposal = load_json("content/lessons-proposal.json")
    lessons_by_pair = {}
    for l in proposal["zones"]:
        key = (l["zone_id"], l["npc_name"])
        lessons_by_pair.setdefault(key, []).append(l)
    for v in lessons_by_pair.values():
        v.sort(key=lambda l: l["sequence_index"])

    path = ROOT / "content/npc-inventory.md"
    text = path.read_text(encoding="utf-8")
    lines = text.split("\n")

    zone_header_re = re.compile(r"^## ([a-z0-9-]+)")
    row_re = re.compile(r"^\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)\|$")

    current_zone = None
    consumed = set()
    filled_rows = 0
    filled_lessons = 0

    out_lines = []
    for line in lines:
        m = zone_header_re.match(line)
        if m:
            current_zone = m.group(1)
            out_lines.append(line)
            continue

        m = row_re.match(line)
        if not m or current_zone is None:
            out_lines.append(line)
            continue

        name, role, gift, typ = m.groups()
        if role.strip() == "Rôle d'origine (jeu Pokémon)" or typ.strip() == "Type assigné":
            out_lines.append(line)
            continue
        if typ.strip():  # déjà taguée (combat ou autre)
            out_lines.append(line)
            continue

        key = (current_zone, name.strip())
        if key not in lessons_by_pair or key in consumed:
            out_lines.append(line)
            continue

        consumed.add(key)
        cell = "<br>".join(format_lesson(l) for l in lessons_by_pair[key])
        filled_rows += 1
        filled_lessons += len(lessons_by_pair[key])
        out_lines.append(f"|{name}|{role}|{gift}| {cell} |")

    path.write_text("\n".join(out_lines), encoding="utf-8")

    missing = set(lessons_by_pair) - consumed
    print(f"{filled_rows} lignes remplies, {filled_lessons} leçons fusionnées "
          f"(sur {len(proposal['zones'])} proposées).")
    if missing:
        print(f"⚠️ {len(missing)} paires (zone, PNJ) non trouvées dans npc-inventory.md :")
        for k in sorted(missing):
            print("  ", k)


if __name__ == "__main__":
    main()
