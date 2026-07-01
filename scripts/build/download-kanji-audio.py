#!/usr/bin/env python3
"""
Construit public/audio/kanji/<kanji>.mp3 pour les 2136 kanji joyo.

Stratégie par priorité :
  1. NHK 2016 (enregistrements humains professionnels) — 1377 kanji
  2. TTS Kyoko macOS (synthèse) — 759 kanji restants

Sortie :
  public/audio/kanji/山.mp3    ← prononciation du kanji seul
  public/audio/kanji/_index.json  ← { kanji: { source, kana, file } }
"""

import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

OUT_DIR   = Path("public/audio/kanji")
INDEX_PATH = OUT_DIR / "_index.json"
NHK_RAW   = "https://raw.githubusercontent.com/Ajatt-Tools/nhk_2016_pronunciations_index_mp3/main/media"
VOICE     = "Kyoko"

OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Sources ───────────────────────────────────────────────────────────────────

joyo = {e["char"]: e for e in json.load(open("scripts/sources/joyo-list.json"))}
nhk_index = json.load(open("/tmp/nhk_index.json"))
nhk_hw    = nhk_index["headwords"]   # { mot: [fichier.mp3, ...] }
nhk_files = nhk_index["files"]       # { fichier.mp3: { kana_reading, pitch_pattern } }

# ── Helpers ───────────────────────────────────────────────────────────────────

def download_nhk(mp3_name: str, dest: Path) -> bool:
    url = f"{NHK_RAW}/{mp3_name}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r, open(dest, "wb") as f:
            f.write(r.read())
        return True
    except Exception as e:
        print(f"  NHK download failed ({mp3_name}): {e}")
        return False

def tts_kyoko(text: str, dest: Path) -> bool:
    tmp = dest.with_suffix(".aiff")
    try:
        subprocess.run(["say", "-v", VOICE, "-r", "150", "-o", str(tmp), text],
                       check=True, capture_output=True)
        subprocess.run(["ffmpeg", "-y", "-i", str(tmp), "-codec:a", "libmp3lame",
                        "-qscale:a", "3", str(dest)],
                       check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"  TTS failed for '{text}': {e}")
        return False
    finally:
        tmp.unlink(missing_ok=True)

# ── Charger l'index existant ──────────────────────────────────────────────────

if INDEX_PATH.exists():
    result_index = json.load(open(INDEX_PATH))
else:
    result_index = {}

# ── Traitement ────────────────────────────────────────────────────────────────

nhk_count  = 0
tts_count  = 0
skip_count = 0
errors     = 0

total = len(joyo)
for i, (char, entry) in enumerate(joyo.items(), 1):
    dest = OUT_DIR / f"{char}.mp3"

    if dest.exists():
        skip_count += 1
        continue

    if i % 100 == 0 or i == 1:
        print(f"[{i}/{total}] NHK:{nhk_count} TTS:{tts_count} skip:{skip_count} err:{errors}")

    # ── Priorité 1 : NHK (kanji seul) ────────────────────────────────────────
    if char in nhk_hw:
        mp3_candidates = nhk_hw[char]
        # Prendre le premier fichier dont la lecture kana == kun-yomi ou on-yomi du kanji
        # En pratique : prendre le premier disponible
        chosen = mp3_candidates[0]
        file_info = nhk_files.get(chosen, {})

        if download_nhk(chosen, dest):
            result_index[char] = {
                "source": "nhk2016",
                "kana":   file_info.get("kana_reading", ""),
                "pitch":  file_info.get("pitch_pattern", ""),
                "file":   f"/audio/kanji/{char}.mp3",
            }
            nhk_count += 1
            time.sleep(0.05)  # rate limiting léger
            continue
        # Fallback TTS si download échoue

    # ── Priorité 2 : TTS Kyoko ───────────────────────────────────────────────
    on  = entry["on"][0]  if entry.get("on")  else ""
    kun = entry["kun"][0].replace("-", "").replace(".", "") if entry.get("kun") else ""
    # Lire : kanji + sa lecture principale
    text = f"{char}。"
    if on:  text += f"{on}。"
    if kun: text += f"{kun}。"

    if tts_kyoko(text, dest):
        result_index[char] = {
            "source": "tts_kyoko",
            "kana":   kun or on,
            "on":     on,
            "kun":    kun,
            "file":   f"/audio/kanji/{char}.mp3",
        }
        tts_count += 1
    else:
        errors += 1

    # Sauvegarder l'index toutes les 50 entrées
    if (nhk_count + tts_count) % 50 == 0:
        json.dump(result_index, open(INDEX_PATH, "w"), ensure_ascii=False, indent=2)

# ── Index final ───────────────────────────────────────────────────────────────

json.dump(result_index, open(INDEX_PATH, "w"), ensure_ascii=False, indent=2)

print()
print("=" * 50)
print(f"Done — {len(list(OUT_DIR.glob('*.mp3')))} fichiers dans {OUT_DIR}")
print(f"  NHK 2016 (humain) : {nhk_count}")
print(f"  TTS Kyoko         : {tts_count}")
print(f"  Déjà existants    : {skip_count}")
print(f"  Erreurs           : {errors}")
print(f"  Index             : {INDEX_PATH}")
