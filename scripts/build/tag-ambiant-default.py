#!/usr/bin/env python3
"""
Étape 2 point 5 : tag `ambiant` par défaut sur les lignes npc-inventory.md
encore vides une fois combat + leçon assignés (`texte` reste hors scope,
différé à la passe contenu -- décision utilisateur 2026-07-09).
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
path = ROOT / "content/npc-inventory.md"
text = path.read_text(encoding="utf-8")

row_re = re.compile(r"^\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)\|$")

out_lines = []
tagged = 0
for line in text.split("\n"):
    m = row_re.match(line)
    if not m:
        out_lines.append(line)
        continue
    name, role, gift, typ = m.groups()
    if role.strip() == "Rôle d'origine (jeu Pokémon)" or typ.strip() == "Type assigné":
        out_lines.append(line)
        continue
    if typ.strip():
        out_lines.append(line)
        continue
    out_lines.append(f"|{name}|{role}|{gift}| ambiant |")
    tagged += 1

path.write_text("\n".join(out_lines), encoding="utf-8")
print(f"{tagged} lignes taguées 'ambiant'")
