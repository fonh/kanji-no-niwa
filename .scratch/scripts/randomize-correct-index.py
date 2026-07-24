#!/usr/bin/env python3
"""Étape 4 phase 2.4 — every text question currently has correct_index=0 (72/72 at
audit time). Shuffle each question's options[] (moving the correct one to a new,
deterministic-per-question index) so a player can't learn "always pick the first
answer". Deterministic (seeded by text_id+question index, not random.random()) so
this script is idempotent and reviewable in a diff — not a one-shot fuzz."""
import glob
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def deterministic_index(seed_str, n):
    h = hashlib.sha256(seed_str.encode()).hexdigest()
    return int(h, 16) % n


def main():
    changed_files = 0
    changed_questions = 0
    for path in sorted((ROOT / "content/texts").rglob("*.json")):
        obj = json.loads(path.read_text())
        text = obj.get("text", obj)
        questions = text.get("questions")
        if not isinstance(questions, list):
            continue
        text_id = text.get("text_id", str(path))
        file_changed = False
        for qi, q in enumerate(questions):
            options = q.get("options")
            correct_index = q.get("correct_index")
            if not isinstance(options, list) or correct_index is None:
                continue
            n = len(options)
            new_index = deterministic_index(f"{text_id}:{qi}", n)
            if new_index == correct_index:
                continue
            correct_option = options.pop(correct_index)
            options.insert(new_index, correct_option)
            q["correct_index"] = new_index
            file_changed = True
            changed_questions += 1
        if file_changed:
            path.write_text(json.dumps(obj, ensure_ascii=False, indent=1) + "\n")
            changed_files += 1
    print(f"Randomized correct_index in {changed_questions} questions across {changed_files} files.")


if __name__ == "__main__":
    main()
