#!/usr/bin/env python3
"""Étape 4 phase 2 — kanji density floor (content-writing-guide.md § 3bis).

For each dialogue/text, computes what fraction of its kanjifiable-and-known words
(per the same JMDict-derived heuristic as scripts/build/rekanjify-report.py) are
ACTUALLY written in kanji vs. left in kana, and reports files under the floor.

Status: WARN-only for now (not part of the mandatory "5 linters green" gate). The
corpus measured 0.17% density at the 2026-07-23 audit — turning this into a hard FAIL
today would red every file in the project at once, which defeats the point (this
linter exists to catch REGRESSION after the re-kanjification pass, not to be the pass
itself). Promote a zone to FAIL by adding its zone_id to STRICT_ZONES once its
re-kanjification pass is verified complete.

Usage: python3 scripts/validate/lint-kanji-density.py [--strict]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts/build"))

FLOOR = 0.10  # ~10% of kanjifiable-known words actually in kanji, per the guide

# Zones with a verified-complete re-kanjification pass — FAIL below FLOOR instead of WARN.
STRICT_ZONES = set()

FURIGANA_RE = re.compile(r"（[^）]*）")
KANA_RE = re.compile(r"[぀-ゟ゠-ヿ]+")


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


def main():
    strict_mode = "--strict" in sys.argv
    from importlib import import_module
    rekanjify = import_module("rekanjify-report".replace("-", "_")) if False else None
    # importlib can't import a hyphenated filename as a module name; load by path instead.
    import importlib.util
    spec = importlib.util.spec_from_file_location("rekanjify_report", ROOT / "scripts/build/rekanjify-report.py")
    rk = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rk)

    za = json.loads((ROOT / "content/kanji-zone-assignment.json").read_text())
    za_zones_by_id = {z["zone_id"]: z for z in za["zones"]}
    narrative_index = {z: i for i, z in enumerate(rk.NARRATIVE_ORDER)}

    print("Building JMDict lexicon...", file=sys.stderr)
    lexicon = rk.build_lexicon()

    findings = []
    below_floor = 0
    checked = 0
    for path in sorted((ROOT / "content/dialogues").rglob("*.json")) + sorted((ROOT / "content/texts").rglob("*.json")):
        obj = json.loads(path.read_text())
        zone_id = obj.get("zone_id") or (obj.get("text", obj)).get("zone_id")
        if not zone_id or zone_id not in narrative_index:
            continue
        studied = rk.studied_set(zone_id, None, za_zones_by_id, narrative_index)
        jps = []
        collect_jp_strings(obj, jps)
        if not jps:
            continue
        total_kanjifiable = 0
        actually_kanji = 0
        for jp in jps:
            plain = FURIGANA_RE.sub("", jp)
            for run in KANA_RE.finditer(plain):
                text = run.group(0)
                i = 0
                n = len(text)
                while i < n:
                    matched = False
                    for length in range(min(8, n - i), 1, -1):
                        sub = text[i : i + length]
                        if sub in rk.STOPWORDS:
                            continue
                        kanji_form = lexicon.get(sub)
                        if kanji_form and all(("一" <= c <= "鿿") is False or c in studied for c in kanji_form) and any(
                            "一" <= c <= "鿿" for c in kanji_form
                        ):
                            total_kanjifiable += 1
                            i += length
                            matched = True
                            break
                    if not matched:
                        i += 1
            # count words already written in kanji too, for the denominator
            for run in re.finditer(r"[一-鿿]+（[^）]*）", jp):
                total_kanjifiable += 1
                actually_kanji += 1
        if total_kanjifiable == 0:
            continue
        checked += 1
        density = actually_kanji / total_kanjifiable
        if density < FLOOR:
            below_floor += 1
            level = "FAIL" if (strict_mode and zone_id in STRICT_ZONES) else "WARN"
            findings.append(f"[{level}] {path.relative_to(ROOT)}: densité {density:.0%} "
                             f"({actually_kanji}/{total_kanjifiable} mots kanjifiables-connus écrits en kanji, "
                             f"plancher {FLOOR:.0%})")

    for f in findings:
        print(f)
    print(f"\n{checked} fichier(s) avec du texte kanjifiable-connu, {below_floor} sous le plancher {FLOOR:.0%}.")
    fails = [f for f in findings if f.startswith("[FAIL]")]
    if fails:
        print(f"{len(fails)} échec(s) (zones STRICT_ZONES).")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
