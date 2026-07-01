#!/usr/bin/env python3
"""
Extracts movement permission (walkability) data from the HGSS NARC at
pret/pokeheartgold/files/a/0/6/5

Map file format (per Project Pokemon documentation):
  Section 1 - Header (20 bytes):
    0x00  uint32  movement_permission_size  (always 0x800)
    0x04  uint32  object_3d_size
    0x08  uint32  nsbmd_size
    0x0C  uint32  bdhc_size
    0x10  uint32  unknown_size

  Section 2 - Unknown data (unknown_size bytes)
  Section 3 - Movement permissions (0x800 bytes = 32x32 tiles x 2 bytes)
    Each tile: [byte0: behavior, byte1: 0x0=walkable 0x4=ignore 0x8=blocked]
    Tile order: left-to-right, bottom-to-top

Output: scripts/sources/map-collision.json
  { "maps": [ { "index": 0, "width": 32, "height": 32, "walkable": [true, false, ...] }, ... ] }
"""

import struct
import json
import sys
import os

NARC_PATH = os.path.expanduser("~/pokeheartgold/files/a/0/6/5")
OUT_PATH = os.path.join(os.path.dirname(__file__), "sources", "map-collision.json")

def parse_narc(data: bytes):
    """Returns list of raw file bytes from a NARC archive."""
    assert data[:4] == b"NARC", "Not a NARC file"

    # NARC header: magic(4) + BOM(2) + version(2) + filesize(4) + chunkcount(2) + headersize(2)
    header_size = struct.unpack_from("<H", data, 0x0C)[0]

    # BTAF section starts right after header
    btaf_offset = header_size
    assert data[btaf_offset:btaf_offset+4] == b"BTAF", "Expected BTAF section"

    btaf_size = struct.unpack_from("<I", data, btaf_offset + 4)[0]
    file_count = struct.unpack_from("<I", data, btaf_offset + 8)[0]

    # File allocation table entries (8 bytes each: start, end)
    fat_entries = []
    for i in range(file_count):
        entry_offset = btaf_offset + 12 + i * 8
        start, end = struct.unpack_from("<II", data, entry_offset)
        fat_entries.append((start, end))

    # BTNF section (file name table) follows BTAF
    btnf_offset = btaf_offset + btaf_size
    assert data[btnf_offset:btnf_offset+4] == b"BTNF", "Expected BTNF section"
    btnf_size = struct.unpack_from("<I", data, btnf_offset + 4)[0]

    # GMIF section (actual data) follows BTNF
    gmif_offset = btnf_offset + btnf_size
    assert data[gmif_offset:gmif_offset+4] == b"GMIF", "Expected GMIF section"
    gmif_data_offset = gmif_offset + 8  # skip magic + size

    files = []
    for start, end in fat_entries:
        file_data = data[gmif_data_offset + start : gmif_data_offset + end]
        files.append(file_data)

    return files


def parse_map_permissions(map_data: bytes):
    """
    Extracts the 32x32 walkability grid from a map file.
    Returns list of 1024 bools (True=walkable), row-major left-to-right top-to-bottom,
    or None if the file is too small / malformed.
    """
    if len(map_data) < 20:
        return None

    perm_size = struct.unpack_from("<I", map_data, 0)[0]

    if perm_size != 0x800:
        return None  # unexpected format

    # Permissions start immediately after the 20-byte header (no unknown section)
    if 20 + 0x800 > len(map_data):
        return None

    perm_data = map_data[20 : 20 + 0x800]

    # 32x32 tiles, 2 bytes each, ordered left-to-right bottom-to-top
    # byte0: behavior (0x00 = walkable, non-zero = blocked/special)
    # Re-order to left-to-right top-to-bottom
    walkable = []
    for row in range(31, -1, -1):  # bottom-to-top → reverse to top-to-bottom
        for col in range(32):
            tile_index = row * 32 + col
            byte0 = perm_data[tile_index * 2]
            walkable.append(byte0 == 0x00)  # only 0x00 = walkable on foot

    return walkable


def main():
    print(f"Reading NARC from {NARC_PATH}...")
    with open(NARC_PATH, "rb") as f:
        data = f.read()

    print(f"Parsing NARC ({len(data):,} bytes)...")
    files = parse_narc(data)
    print(f"Found {len(files)} map files")

    maps = []
    skipped = 0
    for i, file_data in enumerate(files):
        walkable = parse_map_permissions(file_data)
        if walkable is None:
            skipped += 1
            continue
        maps.append({
            "index": i,
            "width": 32,
            "height": 32,
            "walkable": walkable,
        })

    print(f"Extracted {len(maps)} maps ({skipped} skipped / malformed)")

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump({"maps": maps}, f, separators=(",", ":"))

    size_kb = os.path.getsize(OUT_PATH) / 1024
    print(f"Written to {OUT_PATH} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
