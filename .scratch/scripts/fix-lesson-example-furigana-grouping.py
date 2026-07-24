#!/usr/bin/env python3
"""Étape 4 phase 2.4 — merge per-character furigana runs into single ADR-0002 runs
in src/data/kanji-content.json lesson_examples[] (学（がっ）校（こう） -> 学校（がっこう）).
content/ dialogue files are already conformant per the audit; only kanji-content.json
deviates. Also adds the same rule to lint-kanji-budget.py (caller's job, not this script)."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PATH = ROOT / "src/data/kanji-content.json"

RUN = re.compile(r"(?:[一-鿿]（[^）]+）){2,}")
PAIR = re.compile(r"([一-鿿])（([^）]+)）")


def merge_run(m):
    pairs = PAIR.findall(m.group(0))
    kanji = "".join(k for k, _ in pairs)
    reading = "".join(r for _, r in pairs)
    return f"{kanji}（{reading}）"


def main():
    kc = json.loads(PATH.read_text())
    changed = 0
    for k, entry in kc.items():
        for ex in entry.get("lesson_examples", []):
            new_jp = RUN.sub(merge_run, ex["jp"])
            if new_jp != ex["jp"]:
                ex["jp"] = new_jp
                changed += 1
    PATH.write_text(json.dumps(kc, ensure_ascii=False, indent=1) + "\n")
    print(f"Merged furigana runs in {changed} lesson_examples entries.")


if __name__ == "__main__":
    main()
