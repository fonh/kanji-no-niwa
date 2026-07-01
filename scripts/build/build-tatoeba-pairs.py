#!/usr/bin/env python3
"""
Builds a usable JP-EN sentence pair table from Tatoeba data.

Sources:
  - scripts/sources/jpn_sentences.tsv       (248,769 JP sentences: id \t lang \t text)
  - scripts/sources/eng_sentences.tsv       (2M EN sentences: id \t lang \t text)
  - scripts/sources/jpn-eng_links.tsv       (JP→EN links: jp_id \t en_id)

Output:
  - scripts/sources/tatoeba_jpn_eng.json    (array of {jp_id, jp, en, kanji_set})

The kanji_set field lists every jōyō kanji present in the JP sentence, enabling fast
filtering by kanji coverage (e.g. "find sentences where all kanji are in studied_set").

Run time: ~2–3 minutes on a modern Mac.
"""

import json
import re
import bz2
from pathlib import Path

SOURCES = Path("scripts/sources")
OUT_PATH = SOURCES / "tatoeba_jpn_eng.json"

# Jōyō kanji set (loaded from joyo-list.json)
with open(SOURCES / "joyo-list.json") as f:
    joyo_chars = {entry["char"] for entry in json.load(f)}

print(f"Loaded {len(joyo_chars)} jōyō kanji")

# ── 1. Load JP sentences ──────────────────────────────────────────────────────
print("Loading JP sentences...")
jp_sentences = {}
with open(SOURCES / "jpn_sentences.tsv", encoding="utf-8") as f:
    for line in f:
        parts = line.rstrip("\n").split("\t")
        if len(parts) >= 3:
            sid = int(parts[0])
            text = parts[2]
            jp_sentences[sid] = text

print(f"  {len(jp_sentences):,} JP sentences loaded")

# ── 2. Load EN sentences (stream — too large to keep all in RAM) ──────────────
print("Loading EN sentences...")
en_sentences = {}
with open(SOURCES / "eng_sentences.tsv", encoding="utf-8") as f:
    for line in f:
        parts = line.rstrip("\n").split("\t")
        if len(parts) >= 3:
            sid = int(parts[0])
            text = parts[2]
            en_sentences[sid] = text

print(f"  {len(en_sentences):,} EN sentences loaded")

# ── 3. Load JP-EN links ───────────────────────────────────────────────────────
print("Loading JP-EN links...")
pairs_raw = []
with open(SOURCES / "jpn-eng_links.tsv", encoding="utf-8") as f:
    for line in f:
        parts = line.rstrip("\n").split("\t")
        if len(parts) == 2:
            try:
                jp_id = int(parts[0])
                en_id = int(parts[1])
                pairs_raw.append((jp_id, en_id))
            except ValueError:
                pass

print(f"  {len(pairs_raw):,} JP-EN links loaded")

# ── 4. Join and filter ────────────────────────────────────────────────────────
print("Joining pairs...")

# Keep only one EN translation per JP sentence (the first link encountered)
seen_jp = set()
pairs = []

for jp_id, en_id in pairs_raw:
    if jp_id in seen_jp:
        continue
    jp_text = jp_sentences.get(jp_id)
    en_text = en_sentences.get(en_id)
    if not jp_text or not en_text:
        continue

    # Filter: JP text must be between 4 and 60 chars
    if not (4 <= len(jp_text) <= 60):
        continue

    # Compute kanji_set (jōyō kanji present in this sentence)
    kanji_in_sentence = [c for c in jp_text if c in joyo_chars]
    kanji_set = list(dict.fromkeys(kanji_in_sentence))  # deduplicated, order preserved

    seen_jp.add(jp_id)
    pairs.append({
        "jp_id": jp_id,
        "jp": jp_text,
        "en": en_text,
        "kanji_set": kanji_set,
        "kanji_count": len(kanji_set),
    })

print(f"  {len(pairs):,} valid pairs after filtering")

# Sort by kanji_count ascending (easier sentences first — useful for NPC dialogue selection)
pairs.sort(key=lambda p: p["kanji_count"])

# ── 5. Write output ───────────────────────────────────────────────────────────
print(f"Writing {OUT_PATH}...")
with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(pairs, f, ensure_ascii=False, separators=(",", ":"))

size_mb = OUT_PATH.stat().st_size / 1_000_000
print(f"Done. {len(pairs):,} pairs → {OUT_PATH} ({size_mb:.1f} MB)")
print()
print("Sample pairs:")
for p in pairs[:3]:
    print(f"  [{p['kanji_count']} kanji] {p['jp']} → {p['en']}")
print(f"  ...")
for p in pairs[-3:]:
    print(f"  [{p['kanji_count']} kanji] {p['jp']} → {p['en']}")
