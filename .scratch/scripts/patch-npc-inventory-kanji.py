#!/usr/bin/env python3
"""Étape 4 phase 1 — sync content/npc-inventory.md's embedded 'leçon #N — 漢字: ...'
lists with the swap applied by scripts/build/apply-core-promotion.py. npc-inventory.md
is documentation (not read by the engine) but content-writing-guide.md § 1 tells every
future zone pass to read it as the source of truth for kanji_ids per leçon, so it must
stay in sync or it becomes actively misleading."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PATH = ROOT / "content/npc-inventory.md"

# Re-derive the exact (zone_id, npc_name, seq, old, new) tuples by replaying the same
# logic apply-core-promotion.py used, so this script can run standalone / be re-run.
za = json.loads((ROOT / "content/kanji-zone-assignment.json").read_text())
promo = json.loads((ROOT / "content/kanji-core-promotion.json").read_text())
lp = json.loads((ROOT / "content/lessons-proposal.json").read_text())

# lessons-proposal.json already reflects the NEW kanji (apply-core-promotion.py ran
# already) — so we can't re-derive old->new from it directly. Instead replay from the
# promotion/demotion records themselves (they carry old_position/new_position, and
# lessons-proposal.json's CURRENT kanji_ids already show the "new" side).
replacements = [(p["kanji"], p["old_position"]) for p in promo["promotions"] + promo["demotions"]]
# We just need old_kanji (the character that used to sit at new_position, before the
# swap) -> new_kanji (the one now there). Reconstruct via kanji-zone-assignment.json's
# CURRENT ordered_kanji (post-swap) vs recomputing what used to be at each position is
# circular; simplest robust source: content/kanji-core-promotion.json already stores,
# for each promotion entry, old_position (where it used to be) and for each demotion
# entry, old_position too — and new_position is shared between exactly one promotion
# and one demotion. So: at position X, new occupant = whichever entry (promo or demo)
# has new_position == X; old occupant = whichever entry has old_position == X.
by_new_pos = {}
by_old_pos = {}
for e in promo["promotions"] + promo["demotions"]:
    by_new_pos[e["new_position"]] = e["kanji"]
    by_old_pos[e["old_position"]] = e["kanji"]

zone_by_id = {z["zone_id"]: z for z in za["zones"]}

text = PATH.read_text()
sections = re.split(r"(?=^## )", text, flags=re.M)
out_sections = []
total_subs = 0
for sec in sections:
    m = re.match(r"^## ([a-z0-9\-]+) ", sec)
    if not m:
        out_sections.append(sec)
        continue
    zone_id = m.group(1)
    z = zone_by_id.get(zone_id)
    if not z:
        out_sections.append(sec)
        continue
    start, end = z["cumulative_start"], z["cumulative_end"]
    # positions in this zone whose occupant changed
    changed_positions = [p for p in range(start, end) if p in by_new_pos and by_new_pos[p] != by_old_pos.get(p)]
    if not changed_positions:
        out_sections.append(sec)
        continue
    local_map = {by_old_pos[p]: by_new_pos[p] for p in changed_positions if p in by_old_pos}

    def repl(m2):
        global total_subs
        kanji_list = m2.group(1)
        chars = kanji_list.split("・")
        new_chars = []
        for c in chars:
            if c in local_map:
                new_chars.append(local_map[c])
                total_subs += 1
            else:
                new_chars.append(c)
        return "漢字: " + "・".join(new_chars)

    sec = re.sub(r"漢字:\s*([^\|—<]+?)(?=\s*—\s*文法|<br>|\s*\|)", repl, sec)
    out_sections.append(sec)

PATH.write_text("".join(out_sections))
print(f"Substitutions applied: {total_subs}")
