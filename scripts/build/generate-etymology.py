#!/usr/bin/env python3
"""
Génère les etymologies et mnemoniques manquants pour les kanji JLPT.
Utilise le CLI claude (déjà authentifié) en mode non-interactif.
Usage: python3 scripts/generate-etymology.py [--level N1|N2|N3|all]
"""

import json
import glob
import os
import sys
import time
import subprocess
import argparse
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
SOURCES = ROOT / "scripts" / "sources"
OUTPUT = ROOT / "data" / "etymology"
LOG_FILE = SOURCES / "batch-etymology-log.json"

BATCH_SIZE = 25

PROMPT_TEMPLATE = """Pour chaque kanji de la liste suivante, génère un objet JSON avec ces champs :
- "kanji": le caractère
- "readings": {{"kun": "...", "on": "..."}} (les lectures principales séparées par 、)
- "meaning": la signification principale en français
- "etymology": 2-4 phrases expliquant les origines pictographiques. Précis, pédagogique. Cite les composants par leur caractère. En français.
- "mnemonic": 1-3 phrases style professeur enthousiaste — histoire vivante ancrant la forme visuelle au sens, avec au moins une lecture clé. En français.
- "jlpt": le niveau JLPT

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après.

Kanji à traiter :
{kanji_list}"""


def load_generated() -> set:
    generated = set()
    for f in glob.glob(str(OUTPUT / "*.json")):
        try:
            with open(f) as fp:
                data = json.load(fp)
            for entry in data:
                generated.add(entry["kanji"])
        except Exception:
            pass
    return generated


def load_joyo() -> list:
    with open(SOURCES / "joyo-list.json") as f:
        return json.load(f)


def load_log() -> dict:
    if LOG_FILE.exists():
        with open(LOG_FILE) as f:
            return json.load(f)
    return {}


def save_log(log: dict):
    with open(LOG_FILE, "w") as f:
        json.dump(log, f, ensure_ascii=False, indent=2)


def next_batch_filename(level: str) -> Path:
    existing = list(OUTPUT.glob(f"{level.lower()}_batch*.json"))
    nums = []
    for f in existing:
        stem = f.stem
        try:
            nums.append(int(stem.split("_batch")[1]))
        except (IndexError, ValueError):
            pass
    next_num = max(nums, default=0) + 1
    return OUTPUT / f"{level.lower()}_batch{next_num}.json"


def build_kanji_list(batch: list) -> str:
    lines = []
    for k in batch:
        on = "、".join(k.get("on", []))
        kun = "、".join(k.get("kun", []))
        meanings = ", ".join(k.get("meanings", []))
        lines.append(
            f'- {k["char"]} | JLPT {k["jlpt"]} | on: {on} | kun: {kun} | sens: {meanings}'
        )
    return "\n".join(lines)


def parse_response(text: str) -> list:
    text = text.strip()
    # Strip markdown fences
    if "```" in text:
        text = re.sub(r"```(?:json)?", "", text).strip()
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass
    # Try to extract JSON array
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return []


def call_claude(prompt: str, retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            result = subprocess.run(
                ["claude", "-p", prompt, "--model", "claude-haiku-4-5-20251001"],
                capture_output=True,
                text=True,
                timeout=300,
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip()
            if attempt < retries - 1:
                print(f"  Retry {attempt+1} (returncode={result.returncode})")
                time.sleep(5)
        except subprocess.TimeoutExpired:
            print(f"  Timeout {attempt+1}/3")
            if attempt < retries - 1:
                time.sleep(15)
    return ""


def generate_batch(batch: list, log: dict) -> list:
    kanji_list = build_kanji_list(batch)
    prompt = PROMPT_TEMPLATE.format(kanji_list=kanji_list)
    raw = call_claude(prompt)

    if not raw:
        for k in batch:
            log[k["char"]] = "error: no response"
        return []

    results = parse_response(raw)

    generated_chars = {r["kanji"] for r in results if "kanji" in r}
    valid = []
    for r in results:
        if "kanji" in r and "etymology" in r and "mnemonic" in r:
            valid.append(r)
            log[r["kanji"]] = "ok"

    for k in batch:
        if k["char"] not in generated_chars:
            log[k["char"]] = "missing_from_response"

    return valid


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--level", default="all", choices=["N1", "N2", "N3", "N4", "N5", "all"])
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    args = parser.parse_args()

    levels = ["N1", "N2", "N3", "N4", "N5"] if args.level == "all" else [args.level]
    batch_size = args.batch_size

    generated = load_generated()
    joyo = load_joyo()
    log = load_log()

    missing = [
        k for k in joyo
        if k["char"] not in generated
        and k.get("jlpt") in levels
    ]

    print(f"Kanji manquants ({'/'.join(levels)}): {len(missing)}")
    if not missing:
        print("Rien à générer.")
        return

    batches = [missing[i:i+batch_size] for i in range(0, len(missing), batch_size)]
    print(f"Lots de {batch_size}: {len(batches)} requêtes")

    total_ok = 0
    for i, batch in enumerate(batches):
        level_tag = batch[0]["jlpt"]
        chars = "".join(k["char"] for k in batch)
        print(f"\n[{i+1}/{len(batches)}] {level_tag} — {chars}")

        results = generate_batch(batch, log)
        print(f"  → {len(results)}/{len(batch)} générés")

        if results:
            out_file = next_batch_filename(level_tag)
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            print(f"  → {out_file.name}")
            total_ok += len(results)

            # Update generated set
            for r in results:
                generated.add(r["kanji"])

        save_log(log)

    print(f"\nTerminé. {total_ok}/{len(missing)} kanji générés.")
    errors = {k: v for k, v in log.items() if v != "ok"}
    if errors:
        print(f"{len(errors)} échecs/manquants — voir {LOG_FILE.name}")


if __name__ == "__main__":
    main()
