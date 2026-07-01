#!/usr/bin/env python3
"""
Downloads HGSS interior map screenshots from Bulbagarden Archives.
Saves to public/maps/ alongside the existing outdoor screenshots.
"""

import re, time, urllib.request, urllib.parse
from pathlib import Path

OUT_DIR = Path("public/maps")
OUT_DIR.mkdir(parents=True, exist_ok=True)

BASE = "https://archives.bulbagarden.net"

# Confirmed-existing files on Bulbagarden (tested 2026-06-29)
# Format: (bulbagarden_filename, local_filename)
INTERIORS = [
    # ── Johto Gyms ─────────────────────────────────────────────────────────────
    ("Violet_Gym_HGSS.png",             "Violet Gym HGSS.png"),
    ("Azalea_Gym_HGSS.png",             "Azalea Gym HGSS.png"),
    ("Goldenrod_Gym_HGSS.png",          "Goldenrod Gym HGSS.png"),
    ("Ecruteak_Gym_HGSS.png",           "Ecruteak Gym HGSS.png"),
    ("Olivine_Gym_HGSS.png",            "Olivine Gym HGSS.png"),
    ("Cianwood_Gym_HGSS.png",           "Cianwood Gym HGSS.png"),
    ("Mahogany_Gym_HGSS.png",           "Mahogany Gym HGSS.png"),
    ("Blackthorn_Gym_HGSS.png",         "Blackthorn Gym HGSS.png"),

    # ── Pokémon Center (generic — same interior for all cities) ────────────────
    ("Pokémon_Center_HGSS.png",         "Pokemon Center HGSS.png"),

    # ── Tour Grospignon / Sprout Tower ─────────────────────────────────────────
    ("Sprout_Tower_1F_HGSS.png",        "Sprout Tower 1F HGSS.png"),
    ("Sprout_Tower_2F_HGSS.png",        "Sprout Tower 2F HGSS.png"),
    ("Sprout_Tower_3F_HGSS.png",        "Sprout Tower 3F HGSS.png"),

    # ── Tour Embrasée / Burned Tower ───────────────────────────────────────────
    ("Burned_Tower_1F_HGSS.png",        "Burned Tower 1F HGSS.png"),
    ("Burned_Tower_B1F_HGSS.png",       "Burned Tower B1F HGSS.png"),

    # ── Puits Ramoloss / Slowpoke Well ─────────────────────────────────────────
    ("Slowpoke_Well_HGSS.png",          "Slowpoke Well Entrance HGSS.png"),
    ("Slowpoke_Well_B1F_HGSS.png",      "Slowpoke Well B1F HGSS.png"),
    ("Slowpoke_Well_B2F_HGSS.png",      "Slowpoke Well B2F HGSS.png"),

    # ── Tour Jo / Bell Tower ───────────────────────────────────────────────────
    ("Bell_Tower_1F_HGSS.png",          "Bell Tower 1F HGSS.png"),
    ("Bell_Tower_2F_HGSS.png",          "Bell Tower 2F HGSS.png"),
    ("Bell_Tower_3F_HGSS.png",          "Bell Tower 3F HGSS.png"),
    ("Bell_Tower_4F_HGSS.png",          "Bell Tower 4F HGSS.png"),
    ("Bell_Tower_5F_HGSS.png",          "Bell Tower 5F HGSS.png"),
    ("Bell_Tower_6F_HGSS.png",          "Bell Tower 6F HGSS.png"),
    ("Bell_Tower_7F_HGSS.png",          "Bell Tower 7F HGSS.png"),
    ("Bell_Tower_8F_HGSS.png",          "Bell Tower 8F HGSS.png"),
    ("Bell_Tower_9F_HGSS.png",          "Bell Tower 9F HGSS.png"),
    ("Bell_Tower_10F_HGSS.png",         "Bell Tower 10F HGSS.png"),

    # ── Tour Radio / Radio Tower ────────────────────────────────────────────────
    ("Goldenrod_Radio_Tower_1F_HGSS.png", "Goldenrod Radio Tower 1F HGSS.png"),
    ("Goldenrod_Radio_Tower_2F_HGSS.png", "Goldenrod Radio Tower 2F HGSS.png"),
    ("Goldenrod_Radio_Tower_3F_HGSS.png", "Goldenrod Radio Tower 3F HGSS.png"),
    ("Goldenrod_Radio_Tower_4F_HGSS.png", "Goldenrod Radio Tower 4F HGSS.png"),
    ("Goldenrod_Radio_Tower_5F_HGSS.png", "Goldenrod Radio Tower 5F HGSS.png"),

    # ── Chemin Glacé / Ice Path ────────────────────────────────────────────────
    ("Ice_Path_1F_HGSS.png",            "Ice Path 1F HGSS.png"),
    ("Ice_Path_B1F_HGSS.png",           "Ice Path B1F HGSS.png"),
    ("Ice_Path_B2F_HGSS.png",           "Ice Path B2F HGSS.png"),
    ("Ice_Path_B3F_HGSS.png",           "Ice Path B3F HGSS.png"),

    # ── Antre du Dragon / Dragon's Den ─────────────────────────────────────────
    ("Dragons_Den_HGSS.png",            "Dragons Den HGSS.png"),

    # ── Grotte Union / Union Cave ──────────────────────────────────────────────
    ("Union_Cave_1F_HGSS.png",          "Union Cave 1F HGSS.png"),
    ("Union_Cave_B1F_HGSS.png",         "Union Cave B1F HGSS.png"),
    ("Union_Cave_B2F_HGSS.png",         "Union Cave B2F HGSS.png"),

    # ── Forêt Secte / Ilex Forest ─────────────────────────────────────────────
    ("Ilex_Forest_HGSS.png",            "Ilex Forest HGSS.png"),

    # ── Parc National ─────────────────────────────────────────────────────────
    ("National_Park_HGSS.png",          "National Park HGSS.png"),

    # ── Grands Magasins Dorado ─────────────────────────────────────────────────
    ("Goldenrod_Department_Store_1F_HGSS.png", "Goldenrod Department Store 1F HGSS.png"),

    # ── SS Aqua ───────────────────────────────────────────────────────────────
    ("SS_Aqua_HGSS.png",                "SS Aqua HGSS.png"),
]


def get_media_url(bulba_filename: str):
    wiki_url = f"{BASE}/wiki/File:{bulba_filename}"
    try:
        req = urllib.request.Request(wiki_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="replace")
        matches = re.findall(
            r'https://archives\.bulbagarden\.net/media/upload/[a-z0-9/]+/' + re.escape(bulba_filename),
            html
        )
        return matches[0] if matches else None
    except Exception as e:
        print(f"    Error fetching wiki page: {e}")
        return None


def download(url: str, dest: Path) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
        dest.write_bytes(data)
        return True
    except Exception as e:
        print(f"    Download error: {e}")
        return False


ok, skipped, failed = [], [], []

for bulba_name, local_name in INTERIORS:
    dest = OUT_DIR / local_name
    if dest.exists():
        print(f"  ↷  {local_name} (already exists)")
        skipped.append(local_name)
        continue

    print(f"  ↓  {local_name} ...", end=" ", flush=True)
    media_url = get_media_url(bulba_name)
    if not media_url:
        print("URL not found")
        failed.append(local_name)
        continue

    success = download(media_url, dest)
    if success:
        size_kb = dest.stat().st_size // 1024
        print(f"✓ ({size_kb} KB)")
        ok.append(local_name)
    else:
        failed.append(local_name)

    time.sleep(0.3)  # be polite

print(f"\nDone: {len(ok)} downloaded, {len(skipped)} skipped, {len(failed)} failed")
if failed:
    print("Failed:")
    for f in failed:
        print(f"  ✗ {f}")
