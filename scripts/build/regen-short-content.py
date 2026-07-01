#!/usr/bin/env python3
"""
Régénère les entrées dont l'étymologie (<60 chars) ou le mnemonic (<30 chars) est trop court.
Met à jour les fichiers sources existants en place.
"""

import json, glob, subprocess, time
from pathlib import Path

ROOT = Path(__file__).parent.parent
SOURCES = ROOT / "scripts" / "sources"
OUTPUT = ROOT / "data" / "etymology"

PROMPT_TEMPLATE = """Pour chaque kanji de la liste suivante, génère un objet JSON avec ces champs :
- "kanji": le caractère
- "readings": {{"kun": "...", "on": "..."}} (lectures principales séparées par 、; on en katakana)
- "meaning": la signification principale en français
- "etymology": 2-4 phrases expliquant les origines pictographiques. Précis, pédagogique. Cite les composants par leur caractère. Minimum 80 caractères. En français.
- "mnemonic": 1-3 phrases style professeur enthousiaste — histoire vivante ancrant la forme visuelle au sens, avec au moins une lecture clé. Minimum 50 caractères. En français.
- "jlpt": le niveau JLPT

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après.

Kanji à traiter :
{kanji_list}"""


def call_claude(prompt, retries=3):
    import re
    for attempt in range(retries):
        try:
            result = subprocess.run(
                ["claude", "-p", prompt, "--model", "claude-haiku-4-5-20251001"],
                capture_output=True, text=True, timeout=300,
            )
            if result.returncode == 0 and result.stdout.strip():
                text = result.stdout.strip()
                if "```" in text:
                    text = re.sub(r"```(?:json)?", "", text).strip()
                try:
                    data = json.loads(text)
                    if isinstance(data, list):
                        return data
                except json.JSONDecodeError:
                    match = re.search(r"\[.*\]", text, re.DOTALL)
                    if match:
                        try:
                            return json.loads(match.group(0))
                        except: pass
            if attempt < retries - 1:
                time.sleep(5)
        except subprocess.TimeoutExpired:
            print(f"  Timeout {attempt+1}/3")
            if attempt < retries - 1:
                time.sleep(15)
    return []


def main():
    with open('/Users/henrifontanille/Desktop/pokedex_kanji/scripts/sources/joyo-list.json') as f:
        joyo = {k['char']: k for k in json.load(f)}

    # Load all entries
    all_entries = {}
    file_map = {}
    file_data = {}
    for f in sorted(glob.glob(str(OUTPUT / "*.json"))):
        fname = f.split('/')[-1]
        try:
            with open(f) as fp:
                data = json.load(fp)
            file_data[fname] = (f, data)
            for e in data:
                k = e['kanji']
                if k not in all_entries:
                    all_entries[k] = e
                    file_map[k] = fname
        except: pass

    # Find entries to fix
    to_fix = []
    for k, e in all_entries.items():
        if len(e.get('etymology','')) < 60 or len(e.get('mnemonic','')) < 30:
            to_fix.append(k)

    print(f"Entrées à régénérer: {len(to_fix)}")

    # Build batches of 20
    batches = [to_fix[i:i+20] for i in range(0, len(to_fix), 20)]

    updated = 0
    for i, batch in enumerate(batches):
        lines = []
        for k in batch:
            j = joyo.get(k, {})
            on = "、".join(j.get("on", []))
            kun = "、".join(j.get("kun", []))
            meanings = ", ".join(j.get("meanings", []))
            lines.append(f"- {k} | JLPT {j.get('jlpt','?')} | on: {on} | kun: {kun} | sens: {meanings}")

        print(f"\n[{i+1}/{len(batches)}] {''.join(batch)}")
        prompt = PROMPT_TEMPLATE.format(kanji_list="\n".join(lines))
        results = call_claude(prompt)

        if not results:
            print("  Echec — ignoré")
            continue

        # Update in-place in their source files
        result_map = {r['kanji']: r for r in results if 'kanji' in r}

        files_to_update = set(file_map[k] for k in batch if k in file_map)
        for fname in files_to_update:
            fpath, data = file_data[fname]
            changed = False
            for entry in data:
                k = entry['kanji']
                if k in result_map:
                    new = result_map[k]
                    if (len(new.get('etymology','')) >= 60 and
                        len(new.get('mnemonic','')) >= 30):
                        entry.update(new)
                        changed = True
                        updated += 1
                        print(f"  ✓ {k}")
            if changed:
                with open(fpath, 'w', encoding='utf-8') as fp:
                    json.dump(data, fp, ensure_ascii=False, indent=2)

    print(f"\nTerminé. {updated}/{len(to_fix)} entrées mises à jour.")


if __name__ == "__main__":
    main()
