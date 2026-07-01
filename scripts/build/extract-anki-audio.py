#!/usr/bin/env python3
"""
Extrait les fichiers audio d'un deck Anki .apkg (Ankidrone Essentials).

Supporte le format Anki 23+ où :
  - les fichiers media (0, 1, 2...) sont compressés en zstd
  - le fichier "media" est un protobuf zstd contenant les noms originaux dans l'ordre

Ce script :
  1. Extrait le .apkg
  2. Parse le fichier media pour retrouver les noms originaux (par ordre)
  3. Décompresse et copie les fichiers audio (.webm / .mp3 / .ogg) dans public/audio/words/
  4. Génère un index JSON pour lier mot JP → fichier audio

Usage :
  python3 scripts/extract-anki-audio.py scripts/sources/"Ankidrone Essentials V9.apkg"
"""

import zipfile
import json
import shutil
import sqlite3
import subprocess
import sys
import re
from pathlib import Path

if len(sys.argv) < 2:
    print("Usage: python3 scripts/extract-anki-audio.py <chemin_vers_deck.apkg>")
    sys.exit(1)

APKG_PATH = Path(sys.argv[1])
SCRATCH_DIR = Path("scripts/sources/_anki_extracted")
OUT_DIR = Path("public/audio/words")
INDEX_PATH = Path("scripts/sources/anki_audio_index.json")

AUDIO_EXTENSIONS = {".mp3", ".opus", ".ogg", ".m4a", ".wav", ".webm"}

print(f"Source : {APKG_PATH} ({APKG_PATH.stat().st_size / 1_000_000:.1f} MB)")

# ── 1. Extraire le ZIP ────────────────────────────────────────────────────────

if SCRATCH_DIR.exists():
    shutil.rmtree(SCRATCH_DIR)
SCRATCH_DIR.mkdir(parents=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

print(f"Extraction dans {SCRATCH_DIR}...")
with zipfile.ZipFile(APKG_PATH, "r") as z:
    z.extractall(SCRATCH_DIR)

numeric_files = sorted(
    [f for f in SCRATCH_DIR.iterdir() if f.name.isdigit()],
    key=lambda f: int(f.name)
)
print(f"  {len(numeric_files)} fichiers media extraits")

# ── 2. Parser le fichier media (protobuf zstd) ────────────────────────────────

media_file = SCRATCH_DIR / "media"
if not media_file.exists():
    print("ERREUR : fichier 'media' introuvable dans le .apkg")
    sys.exit(1)

raw = media_file.read_bytes()

# Anki 23+ : media est compressé en zstd ET encodé en protobuf
if raw[:4] == bytes([0x28, 0xB5, 0x2F, 0xFD]):
    raw = subprocess.run(["zstd", "-d", "--stdout", str(media_file)], capture_output=True).stdout

# Tenter JSON (format ancien)
media_map = None  # {index_numérique: nom_original}
try:
    data = json.loads(raw.decode("utf-8"))
    # Ancien format : {"0": "nom.mp3", "1": "autre.mp3", ...}
    media_map = {int(k): v for k, v in data.items()}
    print(f"  Format JSON : {len(media_map)} entrées")
except Exception:
    pass

if media_map is None:
    # Format protobuf : repeated message { string name=1; uint64 size=2; bytes sha1=3; }
    # Les entrées sont dans le même ordre que les fichiers numériques 0, 1, 2, ...
    def read_varint(data, pos):
        result, shift = 0, 0
        while True:
            b = data[pos]; pos += 1
            result |= (b & 0x7F) << shift
            if not (b & 0x80):
                break
            shift += 7
        return result, pos

    names_in_order = []
    pos = 0
    while pos < len(raw):
        tag = raw[pos]; pos += 1
        field, wire = tag >> 3, tag & 0x7
        if field == 1 and wire == 2:
            msg_len, pos = read_varint(raw, pos)
            end = pos + msg_len
            name = None
            while pos < end:
                inner_tag = raw[pos]; pos += 1
                inner_field, inner_wire = inner_tag >> 3, inner_tag & 0x7
                if inner_field == 1 and inner_wire == 2:
                    slen, pos = read_varint(raw, pos)
                    name = raw[pos:pos+slen].decode("utf-8", errors="replace")
                    pos += slen
                elif inner_wire == 0:
                    _, pos = read_varint(raw, pos)
                elif inner_wire == 2:
                    slen, pos = read_varint(raw, pos)
                    pos += slen
                else:
                    pos = end; break
            if name:
                names_in_order.append(name)
        else:
            break

    media_map = {i: name for i, name in enumerate(names_in_order)}
    print(f"  Format protobuf : {len(media_map)} entrées")

# ── 3. Décompresser et copier les fichiers audio ──────────────────────────────

ZSTD_MAGIC = bytes([0x28, 0xB5, 0x2F, 0xFD])

audio_entries = []
copied = 0
skipped = 0

for numeric_file in numeric_files:
    idx = int(numeric_file.name)
    original_name = media_map.get(idx)
    if not original_name:
        skipped += 1
        continue

    ext = Path(original_name).suffix.lower()
    if ext not in AUDIO_EXTENSIONS:
        skipped += 1
        continue

    # Décompresser si nécessaire
    content = numeric_file.read_bytes()
    if content[:4] == ZSTD_MAGIC:
        result = subprocess.run(["zstd", "-d", "--stdout", str(numeric_file)], capture_output=True)
        content = result.stdout

    dst = OUT_DIR / original_name
    dst.write_bytes(content)

    audio_entries.append({
        "file": original_name,
        "path": f"/audio/words/{original_name}",
        "ext": ext,
    })
    copied += 1

    if copied % 500 == 0:
        print(f"  {copied} fichiers audio copiés...")

print(f"\n{copied} fichiers audio → {OUT_DIR}")
print(f"{skipped} fichiers non-audio ignorés")

# ── 4. Lire les cartes pour associer mot JP → fichier audio ──────────────────

db_path = SCRATCH_DIR / "collection.anki21b"
decoded_db = SCRATCH_DIR / "collection_decoded.anki2"

if db_path.exists():
    result = subprocess.run(["zstd", "-d", str(db_path), "-o", str(decoded_db)], capture_output=True)
    if result.returncode == 0:
        db_path = decoded_db
    else:
        db_path = SCRATCH_DIR / "collection.anki2"
else:
    db_path = SCRATCH_DIR / "collection.anki2"

card_audio = []

if db_path and db_path.exists():
    print(f"\nLecture des cartes depuis {db_path.name}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT COUNT(*) FROM notes")
        total = cursor.fetchone()[0]
        print(f"  {total} notes trouvées")

        cursor.execute("SELECT id, flds FROM notes WHERE flds LIKE '%[sound:%'")
        rows = cursor.fetchall()
        print(f"  {len(rows)} notes avec audio")

        for note_id, flds in rows:
            fields = flds.split("\x1f")
            # Champ [4] = mot cible, [5] = mot+furigana, [3] = son phrase, [9] = son mot
            word = fields[4].strip() if len(fields) > 4 else ""
            word_with_reading = fields[5].strip() if len(fields) > 5 else ""
            sentence_audio = re.findall(r'\[sound:([^\]]+)\]', fields[3] if len(fields) > 3 else "")
            word_audio = re.findall(r'\[sound:([^\]]+)\]', fields[9] if len(fields) > 9 else "")

            if word and (sentence_audio or word_audio):
                # Extraire la lecture depuis le furigana : 身内[みうち] → みうち
                reading_match = re.search(r'\[([^\]]+)\]', word_with_reading)
                reading = reading_match.group(1) if reading_match else ""

                card_audio.append({
                    "word": re.sub(r'<[^>]+>', '', word),
                    "reading": reading,
                    "word_audio": word_audio[0] if word_audio else "",
                    "sentence_audio": sentence_audio[0] if sentence_audio else "",
                    "word_path": f"/audio/words/{word_audio[0]}" if word_audio else "",
                    "sentence_path": f"/audio/words/{sentence_audio[0]}" if sentence_audio else "",
                })
    except Exception as e:
        print(f"  Erreur: {e}")
    finally:
        conn.close()
else:
    print("Pas de base de données trouvée.")

# ── 5. Écrire l'index JSON ────────────────────────────────────────────────────

index = {
    "source": APKG_PATH.name,
    "total_audio_files": copied,
    "total_cards": len(card_audio),
    "audio_files": audio_entries,
    "card_audio": card_audio,
}

with open(INDEX_PATH, "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False, indent=2)

print(f"\nIndex écrit : {INDEX_PATH}")
print(f"  {copied} fichiers audio dans {OUT_DIR}/")
print(f"  {len(card_audio)} associations mot→audio")
print()
if card_audio:
    print("Exemples :")
    for entry in card_audio[:5]:
        print(f"  {entry['word']} [{entry['reading']}] → {entry['word_audio']}")

# Nettoyage
shutil.rmtree(SCRATCH_DIR)
print(f"\nDossier temporaire supprimé.")
print("Done.")
