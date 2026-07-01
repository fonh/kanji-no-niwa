#!/usr/bin/env python3
"""
Filters the JESC corpus (2.8M EN↔JP subtitle pairs) to produce a usable
"spoken register" sentence pool for Silver battles and Rocket Executive battles.

Source: scripts/sources/raw/raw
  Format: EN \t JP (tab-separated, no IDs)

Filter criteria (from PRD):
  - JP text >= 8 chars
  - JP text <= 50 chars (keep manageable)
  - >= 1 jōyō kanji present in JP text
  - No pure-ASCII JP fragments (must have actual Japanese characters)
  - EN text >= 5 chars, <= 120 chars

Output: scripts/sources/jesc_filtered.json
  Array of {jp, en, kanji_set, kanji_count}
  Sorted by kanji_count ascending.

Estimated output: 400,000–600,000 pairs.
"""

import json
import unicodedata
from pathlib import Path

SOURCES = Path("scripts/sources")
RAW_PATH = SOURCES / "raw" / "raw"
OUT_PATH = SOURCES / "jesc_filtered.json"

# Load jōyō kanji set
with open(SOURCES / "joyo-list.json") as f:
    joyo_chars = {entry["char"] for entry in json.load(f)}

print(f"Loaded {len(joyo_chars)} jōyō kanji")

def has_japanese(text: str) -> bool:
    for ch in text:
        cat = unicodedata.category(ch)
        name = unicodedata.name(ch, "")
        if "HIRAGANA" in name or "KATAKANA" in name or "CJK" in name:
            return True
    return False

print(f"Processing {RAW_PATH} ({RAW_PATH.stat().st_size / 1_000_000:.0f} MB)...")

pairs = []
skipped = 0
total = 0

with open(RAW_PATH, encoding="utf-8", errors="ignore") as f:
    for line in f:
        total += 1
        if total % 500_000 == 0:
            print(f"  {total:,} lines processed, {len(pairs):,} kept...")

        parts = line.rstrip("\n").split("\t")
        if len(parts) != 2:
            skipped += 1
            continue

        en_text, jp_text = parts[0].strip(), parts[1].strip()

        # Length filters
        if not (8 <= len(jp_text) <= 50):
            skipped += 1
            continue
        if not (5 <= len(en_text) <= 120):
            skipped += 1
            continue

        # Must have real Japanese characters
        if not has_japanese(jp_text):
            skipped += 1
            continue

        # Must have at least 1 jōyō kanji
        kanji_in_sentence = [c for c in jp_text if c in joyo_chars]
        if not kanji_in_sentence:
            skipped += 1
            continue

        kanji_set = list(dict.fromkeys(kanji_in_sentence))

        pairs.append({
            "jp": jp_text,
            "en": en_text,
            "kanji_set": kanji_set,
            "kanji_count": len(kanji_set),
        })

print(f"\nTotal lines: {total:,}")
print(f"Skipped: {skipped:,}")
print(f"Kept: {len(pairs):,} pairs")

# Sort by kanji_count
pairs.sort(key=lambda p: p["kanji_count"])

# Deduplicate on JP text (subtitle corpora have many repeats)
seen = set()
deduped = []
for p in pairs:
    if p["jp"] not in seen:
        seen.add(p["jp"])
        deduped.append(p)

print(f"After dedup: {len(deduped):,} pairs")

print(f"Writing {OUT_PATH}...")
with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(deduped, f, ensure_ascii=False, separators=(",", ":"))

size_mb = OUT_PATH.stat().st_size / 1_000_000
print(f"Done. {len(deduped):,} pairs → {OUT_PATH} ({size_mb:.1f} MB)")
print()
print("Sample pairs (spoken register):")
for p in deduped[:5]:
    print(f"  [{p['kanji_count']} kanji] {p['jp']} → {p['en']}")
