#!/usr/bin/env python3
"""Étape 4 phase 2 — re-kanjification report (content-writing-guide.md § 3bis).

For each dialogue/text file, computes the zone's real studiedSet (NARRATIVE_ORDER,
not the blind cumulative_start trap already documented in calc-cs-corpus.py), scans
the kana prose for words that COULD be written in kanji because every kanji in their
dictionary spelling is already studied, and reports them. Uses a greedy longest-match
scan against a JMDict-derived reading->kanji-spelling lexicon (no tokenizer available
in this environment) — a heuristic, not a parser: it can over/under-match on genuine
ambiguity. This script REPORTS ONLY; the actual edit stays manual (natural phrasing,
correct inline reading placement per run — content-writing-guide.md § 3bis/§4).

Usage:
    python3 scripts/build/rekanjify-report.py <zone_id> [<zone_id> ...]
    python3 scripts/build/rekanjify-report.py --all
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

NARRATIVE_ORDER = [
    "new-bark-town", "route-29", "cherrygrove-city", "route-30",
    "route-31", "violet-city", "sprout-tower", "route-36",
    "ruins-of-alph", "route-32", "union-cave", "route-33",
    "azalea-town", "slowpoke-well", "ilex-forest",
    "route-34", "goldenrod-city", "route-35", "national-park",
    "route-37", "ecruteak-city", "burned-tower",
    "route-38", "route-39", "olivine-city", "route-40", "route-41",
    "cianwood-city", "route-47-48-cliff-cave", "safari-zone", "whirl-islands",
    "route-42", "mt-mortar", "route-43", "lake-of-rage", "mahogany-town",
    "route-44", "ice-path", "blackthorn-city", "dragons-den",
    "dark-cave", "route-45", "route-46", "route-26", "route-27",
    "indigo-plateau-antichambre", "indigo-plateau-will", "indigo-plateau-koga",
    "indigo-plateau-bruno", "indigo-plateau-karen", "indigo-plateau-lance",
    "vermilion-city", "route-6-kanto", "saffron-city",
    "route-8-kanto", "route-9-10-rocktunnel", "lavender-town", "kanto-power-plant",
    "cerulean-city", "route-24-25-kanto",
]

FURIGANA_RE = re.compile(r"（[^）]*）")
KANA_RE = re.compile(r"[぀-ゟ゠-ヿ]+")

# Common auxiliary/inflectional fragments that coincidentally collide with short
# JMDict entries (no tokenizer available in this environment — see module docstring).
# Excluding them cuts most of the noise from a naive substring scan; anything else is
# left for the human editor to judge, per this script's report-only contract.
STOPWORDS = {
    "この", "その", "あの", "どの", "ます", "ませ", "まし", "せる", "させる", "られ",
    "きた", "って", "ちゃ", "じゃ", "でも", "では", "には", "とは", "など", "ので",
    "から", "まで", "ほど", "だけ", "しか", "きり", "ばかり", "ぐらい", "くらい",
    "です", "でし", "だっ", "たり", "ずつ", "そう", "よう", "みたい",
}


def load_json(path, **kw):
    return json.loads(path.read_text(**kw))


def build_lexicon():
    """reading (hiragana) -> best kanji spelling, from JMDict. 'Best' = shortest common
    spelling with no rare-kanji tags, to avoid suggesting obscure orthography."""
    data = load_json(ROOT / "scripts/sources/jmdictExtended-2026-06-23.json", encoding="utf-8-sig")
    lex = {}
    for w in data["words"]:
        kanji_forms = [k["text"] for k in w.get("kanji", []) if k["text"]]
        if not kanji_forms:
            continue
        common_kanji = [k["text"] for k in w.get("kanji", []) if k.get("common")]
        chosen_kanji = common_kanji[0] if common_kanji else kanji_forms[0]
        for k in w.get("kana", []):
            reading = k["text"]
            # only hiragana readings (katakana readings are for loanwords, not relevant)
            if not reading or not all("぀" <= c <= "ゟ" for c in reading):
                continue
            if reading in lex:
                continue  # first (most common in file order) wins — good enough heuristic
            lex[reading] = chosen_kanji
    return lex


def studied_set(zone_id, za_order, za_zones_by_id, narrative_index):
    if zone_id not in narrative_index:
        return None
    idx = narrative_index[zone_id]
    studied = set()
    for zid in NARRATIVE_ORDER[: idx + 1]:
        z = za_zones_by_id.get(zid)
        if z:
            studied |= set(z["new_kanji"])
    return studied


def collect_jp_strings(obj, acc):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("jp", "jp_text") and isinstance(v, str):
                acc.append(v)
            else:
                collect_jp_strings(v, acc)
    elif isinstance(obj, list):
        for v in obj:
            collect_jp_strings(v, acc)


def kanjifiable_candidates(jp, lexicon, studied):
    """Greedy longest-match scan of the (furigana-stripped) plain-kana runs in jp
    against the lexicon, keeping only matches whose full kanji spelling is <= studied."""
    plain = FURIGANA_RE.sub("", jp)
    candidates = []
    for run in KANA_RE.finditer(plain):
        text = run.group(0)
        i = 0
        n = len(text)
        while i < n:
            matched = False
            for length in range(min(8, n - i), 1, -1):  # try longest substrings first
                sub = text[i : i + length]
                if sub in STOPWORDS:
                    continue
                kanji_form = lexicon.get(sub)
                if kanji_form and all(("一" <= c <= "鿿") is False or c in studied for c in kanji_form):
                    if any("一" <= c <= "鿿" for c in kanji_form):
                        candidates.append((sub, kanji_form))
                        i += length
                        matched = True
                        break
            if not matched:
                i += 1
    return candidates


def main():
    args = sys.argv[1:]
    za = load_json(ROOT / "content/kanji-zone-assignment.json")
    za_zones_by_id = {z["zone_id"]: z for z in za["zones"]}
    narrative_index = {z: i for i, z in enumerate(NARRATIVE_ORDER)}

    if args == ["--all"]:
        zones = NARRATIVE_ORDER
    elif args:
        zones = args
    else:
        print(__doc__)
        return 1

    print("Building JMDict lexicon...", file=sys.stderr)
    lexicon = build_lexicon()
    print(f"Lexicon: {len(lexicon)} readings", file=sys.stderr)

    for zone_id in zones:
        studied = studied_set(zone_id, za["ordered_kanji"], za_zones_by_id, narrative_index)
        if studied is None:
            print(f"\n=== {zone_id}: not in NARRATIVE_ORDER, skipped ===")
            continue
        files = list((ROOT / "content/dialogues").rglob(f"*/{zone_id}/*.json"))
        files += list((ROOT / "content/texts" / zone_id).glob("*.json")) if (ROOT / "content/texts" / zone_id).exists() else []
        total_candidates = 0
        total_words = 0
        report_lines = []
        for path in sorted(files):
            try:
                obj = load_json(path)
            except Exception:
                continue
            jps = []
            collect_jp_strings(obj, jps)
            for jp in jps:
                cands = kanjifiable_candidates(jp, lexicon, studied)
                total_words += len(KANA_RE.findall(FURIGANA_RE.sub("", jp)))
                if cands:
                    total_candidates += len(cands)
                    report_lines.append(f"  {path.relative_to(ROOT)}: {jp}")
                    for sub, kanji_form in cands:
                        report_lines.append(f"    {sub} -> {kanji_form}")
        print(f"\n=== {zone_id} (studiedSet size {len(studied)}, {len(files)} files) ===")
        print(f"  kanjifiable-known candidates found: {total_candidates}")
        for line in report_lines[:200]:
            print(line)


if __name__ == "__main__":
    sys.exit(main() or 0)
