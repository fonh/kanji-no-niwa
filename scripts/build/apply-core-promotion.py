#!/usr/bin/env python3
"""Étape 4 phase 1.4 — apply content/kanji-core-promotion.json.

Mutates:
- content/kanji-zone-assignment.json (ordered_kanji + each zone's new_kanji[] slice —
  cumulative_start/cumulative_end untouched, pool sizes stay fixed).
- content/lessons-proposal.json (kanji_ids[] of the exact lesson slot that changed).
- content/lessons/<zone>.json for already-written zones whose kanji_ids[] changed.

Does NOT touch src/data/kanji-content.json — writing lesson_examples[] for newly
promoted kanji is a content-authoring step, done by hand after this script's report.
Prints a report of every changed lesson slot (zone, npc, sequence_index, old→new kanji)
so that step can be scoped precisely. Idempotent: safe to re-run (no-ops on kanji
already in their target position).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load(path):
    return json.loads((ROOT / path).read_text())


def save(path, obj):
    (ROOT / path).write_text(json.dumps(obj, ensure_ascii=False, indent=1) + "\n")


def main():
    promo = load("content/kanji-core-promotion.json")
    za = load("content/kanji-zone-assignment.json")
    order = za["ordered_kanji"]

    assert len(order) == len(set(order)) == 2136, "ordered_kanji must be a 2136-kanji permutation before applying"

    new_order = order[:]
    for entry in promo["promotions"] + promo["demotions"]:
        new_order[entry["new_position"]] = entry["kanji"]

    assert len(new_order) == len(set(new_order)) == 2136, "swap produced a corrupt permutation"

    za["ordered_kanji"] = new_order
    changed_zones = {}  # zone_id -> [(index_in_zone, old_kanji, new_kanji)]
    for z in za["zones"]:
        start, end = z["cumulative_start"], z["cumulative_end"]
        old_slice = z["new_kanji"]
        new_slice = new_order[start:end]
        if old_slice != new_slice:
            diffs = [(i, old_slice[i], new_slice[i]) for i in range(len(old_slice)) if old_slice[i] != new_slice[i]]
            changed_zones[z["zone_id"]] = diffs
            z["new_kanji"] = new_slice

    save("content/kanji-zone-assignment.json", za)

    # lessons-proposal.json / content/lessons/<zone>.json: replace by VALUE, not by
    # position — a lesson's kanji_ids[] may already be a thematic regrouping of its
    # zone's pool rather than a straight positional slice, so index-matching against
    # kanji-zone-assignment.json's raw order is unsound (verified: it is, in practice).
    # Each kanji belongs to exactly one zone in the whole 2136-kanji partition, so a
    # value-based find/replace scoped to that zone's entries is unambiguous.
    lp = load("content/lessons-proposal.json")
    lessons_touched = []
    for zone_id, diffs in changed_zones.items():
        replace_map = {old: new for i, old, new in diffs}
        zone_lessons = [e for e in lp["zones"] if e["zone_id"] == zone_id]
        if not zone_lessons:
            continue  # zone has no lesson pool (one of the 35 combat/text/ambient-only zones) — nothing to update
        seen = set()
        for lesson in zone_lessons:
            k_ids = lesson["kanji_ids"]
            for j, k in enumerate(k_ids):
                if k in replace_map:
                    new = replace_map[k]
                    k_ids[j] = new
                    seen.add(k)
                    lessons_touched.append((zone_id, lesson.get("npc_name"), lesson["sequence_index"], k, new))
        missing = set(replace_map) - seen
        assert not missing, f"{zone_id}: kanji {missing} not found in any lessons-proposal.json entry for this zone"
    save("content/lessons-proposal.json", lp)

    # content/lessons/<zone>.json — same replacement, only for zones with a written file.
    written_lesson_files = []
    for zone_id in changed_zones:
        path = ROOT / f"content/lessons/{zone_id}.json"
        if not path.exists():
            continue
        rows = json.loads(path.read_text())
        replace_map = {old: new for i, old, new in changed_zones[zone_id]}
        seen = set()
        for row in rows:
            k_ids = row["kanji_ids"]
            for j, k in enumerate(k_ids):
                if k in replace_map:
                    k_ids[j] = replace_map[k]
                    seen.add(k)
        missing = set(replace_map) - seen
        assert not missing, f"content/lessons/{zone_id}.json: kanji {missing} not found in any lesson entry"
        path.write_text(json.dumps(rows, ensure_ascii=False, indent=1) + "\n")
        written_lesson_files.append(zone_id)

    print(f"Zones with a changed pool: {len(changed_zones)}")
    for zone_id, diffs in changed_zones.items():
        marker = " (content/lessons/*.json updated)" if zone_id in written_lesson_files else " (no lessons file yet)"
        print(f"  {zone_id}{marker}: {len(diffs)} kanji changed")
    print()
    print("lessons-proposal.json slots updated:")
    for zone_id, npc, seq, old, new in lessons_touched:
        print(f"  {zone_id} seq#{seq} ({npc}): {old} -> {new}")

    # kanji needing a NEW lesson_examples[] entry: promoted/demoted kanji whose new
    # position landed inside a zone that HAS a written content/lessons/<zone>.json.
    kc = load("src/data/kanji-content.json")
    needs_example = []
    for zone_id in written_lesson_files:
        for i, old, new in changed_zones[zone_id]:
            entry = kc.get(new, {})
            if not entry.get("lesson_examples"):
                needs_example.append((zone_id, new))
    print()
    print(f"Kanji newly taught in an already-written zone with NO lesson_examples[] yet: {len(needs_example)}")
    for zone_id, k in needs_example:
        print(f"  {zone_id}: {k}")


if __name__ == "__main__":
    main()
