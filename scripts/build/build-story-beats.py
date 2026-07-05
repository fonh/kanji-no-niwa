#!/usr/bin/env python3
"""
Structure les étapes de jeu par zone depuis content/guidebook-adapted.md
(document interne de l'équipe) vers content/map/story-beats.json :

  {
    "zones": {
      "<zone_id>": {
        "display_name": "...",
        "order": <index dans la progression Zone par Zone>,
        "beats": [{ "type": "rival|rocket|kimono|gym|threshold|event", "text": "..." }],
        "locks": ["..."]        <- accès conditionnels (CS-Kanji, badges)
      }
    }
  }

Usage aval : marqueurs de quête ◎ sur la carte, check-list de cohérence pour
l'écriture des dialogues. Ce fichier est une donnée d'ossature interne (français,
comme le doc source) — le texte joueur final sera authoré en japonais ; rien de
ce fichier ne doit être affiché tel quel dans le produit (PRD § Langue du Jeu).
"""

import json
import re
from pathlib import Path

SRC = Path("content/guidebook-adapted.md")
OUT = Path("content/map/story-beats.json")

text = SRC.read_text()

# Sections de zone : "### <slug> — <Nom affiché>" (le slug est un zone_id
# kebab-case ; les autres sous-titres "###" du doc ne matchent pas ce motif).
ZONE_HEADING = re.compile(r"^### ([a-z0-9][a-z0-9-]*) — (.+)$", re.MULTILINE)

headings = list(ZONE_HEADING.finditer(text))
print(f"{len(headings)} sections de zone trouvées")


def classify(line: str) -> str:
    l = line.lower()
    if "silver" in l or "rival" in l:
        return "rival"
    if "rocket" in l:
        return "rocket"
    if "kimono" in l:
        return "kimono"
    if "gym" in l or "badge" in l or "印" in line or "arène" in l or "師範" in line:
        return "gym"
    if "seuil" in l or "rank" in l:
        return "threshold"
    return "event"


zones = {}
for i, m in enumerate(headings):
    zone_id, display = m.group(1), m.group(2).strip()
    end = headings[i + 1].start() if i + 1 < len(headings) else len(text)
    body = text[m.end() : end]

    beats = []
    locks = []
    for raw in body.splitlines():
        line = raw.strip().lstrip("-").strip()
        if not line:
            continue
        if line.startswith("📍"):
            t = line.removeprefix("📍").strip()
            beats.append({"type": classify(t), "text": t})
        elif line.startswith("🔒"):
            locks.append(line.removeprefix("🔒").strip())

    zones[zone_id] = {
        "display_name": display,
        "order": i,
        "beats": beats,
        "locks": locks,
    }

n_beats = sum(len(z["beats"]) for z in zones.values())
n_locks = sum(len(z["locks"]) for z in zones.values())
OUT.parent.mkdir(parents=True, exist_ok=True)
json.dump({"zones": zones}, open(OUT, "w"), ensure_ascii=False, indent=2)
print(f"{len(zones)} zones, {n_beats} beats, {n_locks} verrous → {OUT}")
