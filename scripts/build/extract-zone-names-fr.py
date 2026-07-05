#!/usr/bin/env python3
"""
Extracts the real French location names from the French HeartGold cartridge
(ROM/Pokemon - Version Or HeartGold (France).nds) and maps them onto our
MAP_* zone names, so the map UI can show "Bourg Geon" instead of a mangled
"NEW BARK" derived from the English constant name.

How the game itself resolves an area name (see pret/pokeheartgold's
src/field/draw_map_name.c): each map has a `.mapsec` (MAPSEC_* constant,
constants/map_sections.h) which is just a row index into message bank 279
(NARC_msg_msg_0279_bin) — one localized string per MAPSEC_*. Both the mapsec
assignment (map_headers.h) and the bank's row order are identical across
language versions; only the string content differs. So: decode row N from
the French ROM's own message bank 279, and look up N from each map's mapsec.

Requires the pret/pokeheartgold disassembly checkout (for map_headers.h and
constants/map_sections.h) and a built tools/msgenc (see its Makefile).

Output: scripts/sources/zone-names-fr.json  { "MAP_NEW_BARK": "Bourg Geon", ... }
"""

import json
import re
import subprocess
from pathlib import Path

import ndspy.narc
import ndspy.rom

PRET = Path.home() / "pokeheartgold"
ROM_PATH = Path("ROM/Pokemon - Version Or HeartGold (France).nds")
MSGENC = PRET / "tools/msgenc/msgenc"
CHARMAP = PRET / "charmap.txt"
OUT_PATH = Path("scripts/sources/zone-names-fr.json")
AREA_NAME_BANK_INDEX = 279  # NARC_msg_msg_0279_bin, see draw_map_name.c

# ── 1. MAPSEC_* → row index ───────────────────────────────────────────────────

mapsec_src = (PRET / "include/constants/map_sections.h").read_text()
mapsec_to_index = {
    m.group(1): int(m.group(2))
    for m in re.finditer(r"#define\s+(MAPSEC_\w+)\s+(\d+)", mapsec_src)
}
print(f"Loaded {len(mapsec_to_index)} MAPSEC_* constants")

# ── 2. MAP_* → MAPSEC_* (reusing the same per-map block parsing as
#    extract-zone-data.py, just pulling out .mapsec instead) ─────────────────

headers_src = (PRET / "src/data/map_headers.h").read_text()
map_to_mapsec: dict[str, str] = {}
for m in re.finditer(r"\[(MAP_\w+)\]\s*=\s*\{(.*?)\n\s*\},", headers_src, re.DOTALL):
    name, body = m.group(1), m.group(2)
    ms = re.search(r"\.mapsec\s*=\s*(MAPSEC_\w+),", body)
    if ms:
        map_to_mapsec[name] = ms.group(1)
print(f"Loaded mapsec assignment for {len(map_to_mapsec)} maps")

# ── 3. Decode message bank 279 from the French ROM ───────────────────────────

rom = ndspy.rom.NintendoDSRom.fromFile(str(ROM_PATH))
msg_narc = ndspy.narc.NARC(rom.getFileByName("a/0/2/7"))  # files/msgdata/msg.narc
raw_bank = msg_narc.files[AREA_NAME_BANK_INDEX]

tmp_dir = Path("/tmp/zone-names-fr")
tmp_dir.mkdir(parents=True, exist_ok=True)
raw_path = tmp_dir / f"msg_{AREA_NAME_BANK_INDEX:04d}.bin"
gmm_path = tmp_dir / f"msg_{AREA_NAME_BANK_INDEX:04d}.gmm"
raw_path.write_bytes(raw_bank)

subprocess.run(
    [str(MSGENC), "-d", "-c", str(CHARMAP), str(raw_path), str(gmm_path)],
    check=True,
)

# Without --gmm, msgenc dumps one decoded string per line, in row order.
lines = gmm_path.read_text(encoding="utf-8").splitlines()
index_to_name: dict[int, str] = {i: line for i, line in enumerate(lines)}
print(f"Decoded {len(index_to_name)} area names from the French ROM")

# ── 4. Assemble MAP_* → French name ──────────────────────────────────────────

zone_data = json.loads(Path("scripts/sources/zone-data.json").read_text())
result = {}
missing = []
for zone in zone_data["zones"]:
    name = zone["name"]
    mapsec = map_to_mapsec.get(name)
    idx = mapsec_to_index.get(mapsec) if mapsec else None
    fr_name = index_to_name.get(idx) if idx is not None else None
    if fr_name:
        result[name] = fr_name
    else:
        missing.append(name)

OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
OUT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
print(f"Written {len(result)} French zone names to {OUT_PATH}")
if missing:
    print(f"{len(missing)} zones with no resolvable French name (e.g. MAPSEC_NONE): {missing[:20]}")
