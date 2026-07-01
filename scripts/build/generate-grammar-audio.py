#!/usr/bin/env python3
"""
Génère les fichiers audio pour tous les exemples de grammaire JLPT N5→N1.

Source : scripts/sources/grammar_JLPT_N*.json (828 points, 3309 exemples)
Voix   : macOS TTS Kyoko (ja_JP) via `say`
Sortie : public/audio/japanese/grammar/{n1..n5}/{filename}.mp3

Structure de sortie :
  n5/
    s_A_が_いちばん～_...mp3   ← exemple de phrase
  n4/
  ...

Index généré : public/audio/japanese/grammar/index.json
  [{ level, grammar_title, formation, example_jp, example_en, file, path }, ...]
"""

import json
import os
import subprocess
import sys
from pathlib import Path

BASE_DIR = Path("public/audio/japanese/grammar")
SOURCES_DIR = Path("scripts/sources")
VOICE = "Kyoko"
RATE = 180  # mots par minute (défaut 180 — naturel)

def aiff_to_mp3(aiff_path: Path, mp3_path: Path):
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(aiff_path), "-codec:a", "libmp3lame",
         "-qscale:a", "4", str(mp3_path)],
        capture_output=True, check=True
    )

def generate(text: str, out_mp3: Path):
    if out_mp3.exists():
        return False  # déjà généré
    tmp = out_mp3.with_suffix(".aiff")
    subprocess.run(
        ["say", "-v", VOICE, "-r", str(RATE), "-o", str(tmp), text],
        check=True, capture_output=True
    )
    aiff_to_mp3(tmp, out_mp3)
    tmp.unlink(missing_ok=True)
    return True

def main():
    index = []
    total = 0
    generated = 0
    skipped = 0
    errors = 0

    for level in ["N5", "N4", "N3", "N2", "N1"]:
        src = SOURCES_DIR / f"grammar_JLPT_{level}.json"
        if not src.exists():
            print(f"MANQUANT: {src}")
            continue

        data = json.load(open(src, encoding="utf-8"))
        out_dir = BASE_DIR / level.lower()
        out_dir.mkdir(parents=True, exist_ok=True)

        level_count = 0
        for entry in data:
            title = entry.get("title", "")
            formation = entry.get("formation", "")
            for ex in entry.get("examples", []):
                total += 1
                jp_text = ex.get("jp", "").strip()
                en_text = ex.get("en", "").strip()
                audio_path = ex.get("grammar_audio", "")
                if not jp_text or not audio_path:
                    skipped += 1
                    continue

                # Nom de fichier = basename du chemin original
                fname = os.path.basename(audio_path)
                # Assainir le nom (éviter les problèmes shell)
                out_mp3 = out_dir / fname

                try:
                    was_generated = generate(jp_text, out_mp3)
                    if was_generated:
                        generated += 1
                    else:
                        skipped += 1
                    level_count += 1
                except subprocess.CalledProcessError as e:
                    errors += 1
                    print(f"  ERREUR: {fname[:60]} — {e}")
                    continue

                index.append({
                    "level": level,
                    "grammar_title": title,
                    "formation": formation,
                    "example_jp": jp_text,
                    "example_en": en_text,
                    "file": fname,
                    "path": f"/audio/japanese/grammar/{level.lower()}/{fname}",
                })

        print(f"{level}: {level_count} fichiers audio → {out_dir}")

    # Écrire l'index
    index_path = BASE_DIR / "index.json"
    json.dump(index, open(index_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    print()
    print(f"Done.")
    print(f"  {generated} générés, {skipped} ignorés (déjà existants ou vides), {errors} erreurs")
    print(f"  Index: {index_path} ({len(index)} entrées)")

if __name__ == "__main__":
    main()
