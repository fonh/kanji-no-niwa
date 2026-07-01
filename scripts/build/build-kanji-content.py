#!/usr/bin/env python3
"""
Construit src/data/kanji-content.json (2136 entrées) en fusionnant :
  - scripts/sources/joyo-list.json      (JLPT, lectures, significations)
  - scripts/sources/kanjialive_data.json (exemples de mots, radical, tracés)
  - content/etymology/*.json             (étymologie, mnémotechnique)

Sortie : { "山": { jlpt, grade, meanings, on, kun, stroke, radical,
                   rad_meaning, examples, etymology, mnemonic }, ... }
"""

import json
import glob
from pathlib import Path

JOYO      = Path("scripts/sources/joyo-list.json")
ETYM      = Path("data/etymology")
ANKI_IDX  = Path("scripts/sources/anki_audio_index.json")
OUT       = Path("src/data/kanji-content.json")

# ── 1. Base joyo-list (2136 kanji) ────────────────────────────────────────────
joyo = {e["char"]: e for e in json.load(open(JOYO))}
print(f"joyo-list       : {len(joyo)} kanji")

# ── 2. Index audio Ankidrone (exemples de mots avec audio) ────────────────────
# card_audio = [{ word, reading, word_audio, sentence_audio, ... }]
word_examples: dict = {}  # kanji → liste de mots qui le contiennent
if ANKI_IDX.exists():
    anki = json.load(open(ANKI_IDX))
    for card in anki.get("card_audio", []):
        word = card.get("word", "")
        for ch in word:
            if ch in joyo:
                if ch not in word_examples:
                    word_examples[ch] = []
                if len(word_examples[ch]) < 3:
                    word_examples[ch].append({
                        "word":    word,
                        "reading": card.get("reading", ""),
                        "audio":   card.get("word_path", ""),
                    })
    print(f"anki audio      : exemples pour {len(word_examples)} kanji")
else:
    print("anki audio      : absent (optionnel)")

# ── 3. Étymologies (tous les batches, déduplication premier-gagne) ─────────────
etym: dict = {}
files = sorted(glob.glob(str(ETYM / "*.json")))
for f in files:
    for e in json.load(open(f)):
        k = e.get("kanji", "")
        if k and k not in etym:
            etym[k] = e
print(f"etymology       : {len(etym)} kanji uniques ({len(files)} fichiers)")

# ── 4. Fusionner ───────────────────────────────────────────────────────────────
result = {}
has_etym = 0
has_examples = 0

for char, j in joyo.items():
    e = etym.get(char, {})
    examples = word_examples.get(char, [])

    etymology = e.get("etymology", "")
    mnemonic  = e.get("mnemonic", "")

    if etymology:
        has_etym += 1
    if examples:
        has_examples += 1

    result[char] = {
        "jlpt":      j.get("jlpt", ""),
        "grade":     j.get("grade", 0),
        "meanings":  j.get("meanings", []),
        "on":        j.get("on", []),
        "kun":       j.get("kun", []),
        "examples":  examples,
        "etymology": etymology,
        "mnemonic":  mnemonic,
        "audio":     f"/audio/kanji/{char}.mp3",
    }

# ── 5. Écrire ──────────────────────────────────────────────────────────────────
OUT.parent.mkdir(parents=True, exist_ok=True)
json.dump(result, open(OUT, "w"), ensure_ascii=False, indent=2)

print()
print(f"Done → {OUT}")
print(f"  {len(result)} kanji")
print(f"  {has_etym} avec étymologie ({round(has_etym/len(result)*100)}%)")
print(f"  {len(result)-has_etym} sans étymologie")
print(f"  {has_examples} avec exemples de mots (audio Ankidrone)")
