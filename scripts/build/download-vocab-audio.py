#!/usr/bin/env python3
"""
Copie l'audio de prononciation pour les mots manquants dans Ankidrone.
Source : local-audio-yomichan (github.com/yomidevs/local-audio-yomichan)

Structure attendue après extraction du torrent :
  scripts/sources/local-audio-yomichan/user_files/user_files/
    nhk16_files/       entries.json + audio/
    jpod_files/        index.json   + media/
    shinmeikai8_files/ index.json   + media/
    forvo_files/       {speaker}/{kana}.opus

Lancement :
  python3 scripts/build/download-vocab-audio.py

Output :
  public/audio/vocabulary/{mot}.opus
  scripts/sources/vocab_audio_index.json
"""

import json
import re
import shutil
from pathlib import Path

SOURCES   = Path("scripts/sources")
BASE      = SOURCES / "local-audio-yomichan" / "user_files" / "user_files"
OUT_DIR   = Path("public/audio/vocabulary")
INDEX_OUT = SOURCES / "vocab_audio_index.json"

OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Vérification ──────────────────────────────────────────────────────────────

if not BASE.exists():
    print(f"ERREUR : {BASE} introuvable.")
    print("Extrayez le torrent dans scripts/sources/local-audio-yomichan/")
    raise SystemExit(1)

print(f"Base audio : {BASE}")

# ── Construction des indexes en mémoire ──────────────────────────────────────

print("Chargement NHK16...")
nhk16_index: dict[str, Path] = {}
nhk16_entries_path = BASE / "nhk16_files" / "entries.json"
with open(nhk16_entries_path, encoding="utf-8") as f:
    nhk16_entries = json.load(f)
for entry in nhk16_entries:
    sound_file = entry.get("accents", [{}])[0].get("soundFile") if entry.get("accents") else None
    if not sound_file:
        continue
    audio_path = BASE / "nhk16_files" / "audio" / sound_file
    if not audio_path.exists():
        continue
    kana = entry.get("kana", "")
    for kanji in entry.get("kanji", []):
        if kanji not in nhk16_index:
            nhk16_index[kanji] = audio_path
    if kana and kana not in nhk16_index:
        nhk16_index[kana] = audio_path
print(f"  {len(nhk16_index)} entrées NHK16")

def load_headword_index(json_path: Path, media_subdir: str) -> dict[str, Path]:
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)
    headwords = data.get("headwords", {})
    result: dict[str, Path] = {}
    for word, files in headwords.items():
        if not files:
            continue
        candidate = json_path.parent / media_subdir / files[0]
        if candidate.exists():
            result[word] = candidate
    return result

print("Chargement Shinmeikai8...")
shinmeikai8_index = load_headword_index(BASE / "shinmeikai8_files" / "index.json", "media")
print(f"  {len(shinmeikai8_index)} entrées Shinmeikai8")

print("Chargement JPod...")
jpod_index = load_headword_index(BASE / "jpod_files" / "index.json", "media")
print(f"  {len(jpod_index)} entrées JPod")

print("Chargement Forvo...")
forvo_index: dict[str, Path] = {}
forvo_dir = BASE / "forvo_files"
for speaker_dir in sorted(forvo_dir.iterdir()):
    if not speaker_dir.is_dir():
        continue
    for opus_file in speaker_dir.glob("*.opus"):
        kana = opus_file.stem
        if kana not in forvo_index:
            forvo_index[kana] = opus_file
print(f"  {len(forvo_index)} entrées Forvo")

def find_audio(word: str, reading: str):
    for index in (nhk16_index, shinmeikai8_index, jpod_index):
        if word in index:
            return index[word]
        if reading and reading in index:
            return index[reading]
    if reading and reading in forvo_index:
        return forvo_index[reading]
    if word in forvo_index:
        return forvo_index[word]
    return None

# ── Chargement des mots manquants ────────────────────────────────────────────

print("\nChargement vocab_audio_missing.json...")
with open(SOURCES / "vocab_audio_missing.json", encoding="utf-8") as f:
    missing_list = json.load(f)
print(f"  {len(missing_list)} mots à traiter")

index: dict[str, str] = {}
if INDEX_OUT.exists():
    with open(INDEX_OUT, encoding="utf-8") as f:
        index = json.load(f)

already_done = set(index.keys())
to_process = [e for e in missing_list if e["word"] not in already_done]
print(f"  {len(already_done)} déjà traités, {len(to_process)} restants")

# ── Copie des fichiers audio ──────────────────────────────────────────────────

copied = 0
not_found: list[str] = []

for i, entry in enumerate(to_process, 1):
    word    = entry["word"]
    reading = entry.get("reading") or ""

    src_path = find_audio(word, reading)
    if src_path is None:
        not_found.append(word)
    else:
        ext  = src_path.suffix
        safe = re.sub(r'[/\\:*?"<>|\x00-\x1f]', "_", word)
        dst  = OUT_DIR / f"{safe}{ext}"
        shutil.copy2(src_path, dst)
        index[word] = f"/audio/vocabulary/{safe}{ext}"
        copied += 1

    if i % 500 == 0:
        pct = i / len(to_process) * 100
        print(f"  {i}/{len(to_process)} ({pct:.0f}%) — copiés: {copied}, introuvables: {len(not_found)}")
        with open(INDEX_OUT, "w", encoding="utf-8") as f:
            json.dump(index, f, ensure_ascii=False, indent=2)

with open(INDEX_OUT, "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False, indent=2)

print(f"\n{'─'*50}")
print(f"Terminé.")
print(f"  Copiés        : {copied}")
print(f"  Total index   : {len(index)}")
print(f"  Introuvables  : {len(not_found)}")
if not_found:
    print(f"  Exemples      : {not_found[:10]}")
print(f"\nIndex → {INDEX_OUT}")
print(f"Audio → {OUT_DIR}/")
