#!/usr/bin/env python3
"""
extract_hgss_sprites.py
=======================
Extract all *non-Pokemon* sprites/graphics from a Pokemon HeartGold (or
SoulSilver) Nintendo DS ROM and organise them into a clean folder tree.

Decoders implemented (pure ndspy + Pillow):
  * NCLR (RLCN)  palettes
  * NCGR (RGCN)  4bpp / 8bpp tiled character data        -> linear render
  * NCER (RECN)  OAM cell banks                           -> proper sprites
  * NSCR (RCSN)  tilemaps / screen data                   -> background render
  * NSBTX/BTX0   3D textures (badges, overworld, effects) -> per-texture PNG
  * LZ10 / LZ11  transparent decompression of sub-files

Anything that cannot be recognised is written out verbatim as a ``.bin`` file
and logged.  The script never aborts on a single bad file: every unit of work
is wrapped in try/except and recorded in the run log.

Usage:  python3 extract_hgss_sprites.py [path/to/rom.nds]
"""

import os
import sys
import struct
import math
import datetime
import traceback

from PIL import Image, ImageDraw

import ndspy.rom
import ndspy.narc
import ndspy.lz10
import ndspy.graphics2D as g2
import ndspy.color as col
import ndspy.texture as tx

# ndspy's texture renderer lazily needs its colour LUTs primed.
col.prepareLUTs()

# --------------------------------------------------------------------------- #
#  Paths
# --------------------------------------------------------------------------- #
HOME = os.path.expanduser("~")
OUT = os.path.join(HOME, "Desktop", "sprites")

# The Desktop entry the user pointed at is a macOS .textClipping, not the ROM.
# Resolve the real .nds from a list of likely locations.
ROM_CANDIDATES = [
    sys.argv[1] if len(sys.argv) > 1 else None,
    os.path.join(OUT, "Pokemon - Version Or HeartGo"),
    os.path.join(HOME, "Downloads", "Pokemon - Version Or HeartGold (France).nds"),
]


def find_rom():
    for c in ROM_CANDIDATES:
        if c and os.path.isfile(c) and os.path.getsize(c) > 1_000_000:
            return c
    # last resort: scan Downloads/Desktop for any .nds
    for base in (os.path.join(HOME, "Downloads"), os.path.join(HOME, "Desktop")):
        if os.path.isdir(base):
            for fn in sorted(os.listdir(base)):
                if fn.lower().endswith(".nds"):
                    return os.path.join(base, fn)
    return None


# --------------------------------------------------------------------------- #
#  Run log
# --------------------------------------------------------------------------- #
class Log:
    def __init__(self):
        self.extracted = {}   # category -> count of png/files written
        self.failed = []      # (category, where, reason)
        self.bins = []        # (category, filename, reason)
        self.notes = {}       # category -> free text note

    def add(self, cat, n=1):
        self.extracted[cat] = self.extracted.get(cat, 0) + n

    def fail(self, cat, where, reason):
        self.failed.append((cat, where, str(reason)))

    def binned(self, cat, fn, reason):
        self.bins.append((cat, fn, str(reason)))


LOG = Log()


# --------------------------------------------------------------------------- #
#  Decompression
# --------------------------------------------------------------------------- #
def lz11_decompress(data):
    """Minimal LZ11 decompressor (ndspy only ships LZ10)."""
    if not data or data[0] != 0x11:
        return None
    length = data[1] | (data[2] << 8) | (data[3] << 16)
    src = 4
    out = bytearray()
    while len(out) < length:
        flags = data[src]; src += 1
        for bit in range(7, -1, -1):
            if len(out) >= length:
                break
            if not (flags >> bit) & 1:
                out.append(data[src]); src += 1
                continue
            b0 = data[src]; b1 = data[src + 1]; src += 2
            indicator = b0 >> 4
            if indicator == 0:
                count = (b0 << 4 | b1 >> 4) + 0x11
                disp = ((b1 & 0xF) << 8 | data[src]) + 1; src += 1
            elif indicator == 1:
                b2 = data[src]; b3 = data[src + 1]; src += 2
                count = ((b0 & 0xF) << 12 | b1 << 4 | b2 >> 4) + 0x111
                disp = ((b2 & 0xF) << 8 | b3) + 1
            else:
                count = indicator + 1
                disp = ((b0 & 0xF) << 8 | b1) + 1
            start = len(out) - disp
            for i in range(count):
                out.append(out[start + i])
    return bytes(out)


def decompress(data):
    """Return decompressed bytes if the blob is LZ10/LZ11, else the input."""
    if not data:
        return data
    if data[0] == 0x10:
        try:
            d = ndspy.lz10.decompress(data)
            if d:
                return d
        except Exception:
            pass
    if data[0] == 0x11:
        try:
            d = lz11_decompress(data)
            if d:
                return d
        except Exception:
            pass
    return data


def magic(b):
    """Return the 4-char container magic only when it is clean printable text
    (RGCN, NARC, BTX0, ...); otherwise '' so it is treated as raw data."""
    if len(b) < 4:
        return ""
    tag = b[:4]
    if all(33 <= c < 127 and chr(c) not in "/\\" for c in tag):
        return tag.decode("ascii")
    return ""


def safe_tag(b):
    """A filesystem-safe short tag for an unrecognised blob's first bytes."""
    return b[:4].hex() if len(b) >= 4 else "raw"


# --------------------------------------------------------------------------- #
#  Container parsers
# --------------------------------------------------------------------------- #
def parse_nclr(data):
    """Return a flat list of ndspy ColorTuples (all palettes concatenated)."""
    i = data.find(b"TTLP")
    if i < 0:
        raise ValueError("no TTLP section")
    datasize = struct.unpack_from("<I", data, i + 0x10)[0]
    if datasize == 0 or i + 0x18 + datasize > len(data):
        datasize = len(data) - (i + 0x18)
    coldata = data[i + 0x18: i + 0x18 + datasize]
    return col.loadPalette(coldata)


def pad_palette(pal, n):
    """Ensure the palette has at least n colour entries (pad transparent)."""
    if pal is None:
        return pal
    if len(pal) >= n:
        return pal
    return list(pal) + [col.ColorTuple(0, 0, 0, 0)] * (n - len(pal))


def parse_ncgr(data):
    """Return (tiles, bpp, width_in_tiles_hint)."""
    i = data.find(b"RAHC")
    if i < 0:
        raise ValueError("no RAHC section")
    w = struct.unpack_from("<H", data, i + 8)[0]
    h = struct.unpack_from("<H", data, i + 10)[0]
    bpp = struct.unpack_from("<I", data, i + 12)[0]      # 3 = 4bpp, 4 = 8bpp
    datasize = struct.unpack_from("<I", data, i + 0x18)[0]
    chardata = data[i + 0x20: i + 0x20 + datasize]
    fmt = g2.ImageFormat.I4 if bpp == 3 else g2.ImageFormat.I8
    tiles = g2.loadImageTiles(chardata, fmt)
    return tiles, bpp, w


def squarish_width(n):
    """Pick a tiles-per-row that divides n and yields the squarest rectangle."""
    if n <= 0:
        return 1
    best, best_diff = 1, 1e9
    for w in range(1, n + 1):
        if n % w == 0:
            h = n // w
            diff = abs(w - h)
            if diff < best_diff:
                best, best_diff = w, diff
    return best


def render_ncgr_linear(tiles, pal, bpp, width_hint):
    n = len(tiles)
    if 0 < width_hint < 1024:
        wt = width_hint
    else:
        wt = squarish_width(n)
        wt = max(1, min(wt, 64))
    return g2.renderImageTilesAsImage(tiles, pal, 0, wt)


OAM_SIZES = {
    (0, 0): (8, 8), (0, 1): (16, 16), (0, 2): (32, 32), (0, 3): (64, 64),
    (1, 0): (16, 8), (1, 1): (32, 8), (1, 2): (32, 16), (1, 3): (64, 32),
    (2, 0): (8, 16), (2, 1): (8, 32), (2, 2): (16, 32), (2, 3): (32, 64),
}


def render_ncer(ncer, tiles, pal, bpp):
    """Compose every cell in an NCER bank into a list of RGBA PIL Images."""
    i = ncer.find(b"KBEC")
    if i < 0:
        raise ValueError("no KBEC section")
    nbanks = struct.unpack_from("<H", ncer, i + 8)[0]
    attr = struct.unpack_from("<H", ncer, i + 0x0A)[0]
    celldataoff = struct.unpack_from("<I", ncer, i + 0x0C)[0]
    mapflags = struct.unpack_from("<I", ncer, i + 0x10)[0]
    extended = (attr & 1) == 1
    cellhdr_sz = 16 if extended else 8
    base = i + 8 + celldataoff
    oamregion = base + nbanks * cellhdr_sz
    tilebytes = 32 if bpp == 3 else 64
    boundary = 32 << (mapflags & 3)          # tile-mapping granularity in bytes
    step = max(1, boundary // tilebytes)
    pal = pad_palette(pal, 256)              # OAMs may select any palette block

    # Pre-render every tile once at every palette index lazily via cache.
    tile_cache = {}

    def tile_img(t, palnum):
        key = (t, palnum)
        if key not in tile_cache:
            tile_cache[key] = g2.renderImageTilesAsImage([tiles[t]], pal, palnum, 1)
        return tile_cache[key]

    imgs = []
    hdrpos = base
    for _ in range(nbanks):
        noam = struct.unpack_from("<H", ncer, hdrpos)[0]
        oamoff = struct.unpack_from("<I", ncer, hdrpos + 4)[0]
        hdrpos += cellhdr_sz

        objs = []
        minx = miny = 1 << 30
        maxx = maxy = -(1 << 30)
        for o in range(noam):
            p = oamregion + oamoff + o * 6
            if p + 6 > len(ncer):
                break
            a0, a1, a2 = struct.unpack_from("<HHH", ncer, p)
            y = a0 & 0xFF
            if y >= 128:
                y -= 256
            shape = (a0 >> 14) & 3
            x = a1 & 0x1FF
            if x >= 256:
                x -= 512
            size = (a1 >> 14) & 3
            tileidx = a2 & 0x3FF
            palnum = (a2 >> 12) & 0xF
            w, h = OAM_SIZES.get((shape, size), (8, 8))
            objs.append((x, y, w, h, tileidx, palnum))
            minx, miny = min(minx, x), min(miny, y)
            maxx, maxy = max(maxx, x + w), max(maxy, y + h)

        if not objs:
            imgs.append(None)
            continue

        canvas = Image.new("RGBA", (maxx - minx, maxy - miny), (0, 0, 0, 0))
        # Draw OAMs back-to-front so earlier (higher priority) ones sit on top.
        for (x, y, w, h, tileidx, palnum) in reversed(objs):
            tw, th = w // 8, h // 8
            t = tileidx * step
            sub = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            for ty in range(th):
                for txi in range(tw):
                    if 0 <= t < len(tiles):
                        sub.paste(tile_img(t, palnum), (txi * 8, ty * 8))
                    t += 1
            canvas.alpha_composite(sub, (x - minx, y - miny))
        imgs.append(canvas)
    return imgs


def render_nscr(nscr, tiles, pal):
    """Render a tilemap (NSCR) background using its paired NCGR + NCLR."""
    i = nscr.find(b"NRCS")
    if i < 0:
        raise ValueError("no NRCS section")
    wpx = struct.unpack_from("<H", nscr, i + 8)[0]
    hpx = struct.unpack_from("<H", nscr, i + 10)[0]
    # NRCS layout: width(2) height(2) padding(4) dataSize(4) screendata...
    datasize = struct.unpack_from("<I", nscr, i + 16)[0]
    if datasize == 0 or i + 20 + datasize > len(nscr):
        datasize = (wpx // 8) * (hpx // 8) * 2
    screen = nscr[i + 20: i + 20 + datasize]
    tmtiles = g2.loadTilemapTiles(screen)
    wt = max(1, wpx // 8)
    # the tilemap may reference tile numbers beyond the paired NCGR; pad with
    # copies of tile 0 so an out-of-range index renders blank instead of crashing
    need = max((t.tileNum for t in tmtiles), default=0) + 1
    if tiles and len(tiles) < need:
        tiles = list(tiles) + [tiles[0]] * (need - len(tiles))
    # likewise the tilemap may select a palette block past the paired NCLR
    maxpal = max((t.paletteNum for t in tmtiles), default=0)
    pal = pad_palette(pal, (maxpal + 1) * 16)
    return g2.renderTilemapTilesAsImage(tmtiles, tiles, pal, wt)


def _render_btx_texture(tobj, pobj):
    if pobj is not None:
        packed = [c if isinstance(c, int) else col.pack(*c[:3])
                  for c in pobj.colors]
        # some textures index past a short palette -> pad so it can't overflow
        if len(packed) < 256:
            packed = packed + [0] * (256 - len(packed))
        return tx.renderTextureDataAsImage(
            tobj.data1, tobj.data2, tobj.format,
            tobj.width, tobj.height, packed, tobj.isColor0Transparent)
    return tobj.renderAsImage(None)


def _sanitize(name):
    return "".join(ch if ch.isalnum() or ch in "-_" else "_"
                   for ch in name).strip("_") or "tex"


def extract_btx0(data, cat, outdir, base, used_names):
    """Render every texture in an NSBTX/BTX0 model and combine them into a
    SINGLE spritesheet PNG (all frames/directions of one character/object),
    named after the model's internal texture label."""
    n = tx.NSBTX(data)
    pals = n.palettes

    def pal_for(tname):
        if not pals:
            return None
        stem = tname.split(".")[0]
        for pn, pp in pals:
            if pn.split(".")[0] == stem:
                return pp
        return pals[0][1]

    frames = []
    for ti, (tname, tobj) in enumerate(n.textures):
        try:
            frames.append(_render_btx_texture(tobj, pal_for(tname)))
        except Exception as e:
            LOG.fail(cat, f"{base} tex#{ti} '{tname}'", e)
    if not frames:
        return 0

    # name the sheet after the common texture prefix (strip ".<frame>" suffix)
    raw = n.textures[0][0].split(".")[0]
    name = _sanitize(raw)
    if name in used_names:                      # disambiguate collisions
        name = f"{name}_{base.split('_')[-1]}"
    used_names.add(name)

    if len(frames) == 1:
        frames[0].save(os.path.join(outdir, f"{name}.png"))
        return 1

    # grid layout: cells sized to the largest frame
    cols = min(len(frames), 8)
    rows = math.ceil(len(frames) / cols)
    cw = max(f.width for f in frames)
    ch = max(f.height for f in frames)
    sheet = Image.new("RGBA", (cols * cw, rows * ch), (0, 0, 0, 0))
    for k, f in enumerate(frames):
        x = (k % cols) * cw + (cw - f.width) // 2
        y = (k // cols) * ch + (ch - f.height) // 2
        sheet.alpha_composite(f, (x, y))
    sheet.save(os.path.join(outdir, f"{name}.png"))
    return 1


# --------------------------------------------------------------------------- #
#  Generic NARC processor
# --------------------------------------------------------------------------- #
def classify(files):
    """Return list of dicts describing each decompressed sub-file."""
    items = []
    for idx, raw in enumerate(files):
        d = decompress(raw)
        items.append({"idx": idx, "data": d, "magic": magic(d)})
    return items


def nearest(idx, candidates):
    """Index from `candidates` nearest to idx, ties favour the preceding one."""
    if not candidates:
        return None
    return min(candidates, key=lambda j: (abs(j - idx), j > idx))


def process_auto(path, narc, cat, outdir, prefix):
    """General association: NCER/NSCR pull the nearest NCGR + NCLR; leftover
    NCGRs render linearly; BTX0 -> textures; everything else -> .bin."""
    items = classify(narc.files)
    by = {}
    for it in items:
        by.setdefault(it["magic"], []).append(it["idx"])

    ncgr_idx = by.get("RGCN", [])
    nclr_idx = by.get("RLCN", [])
    consumed_ncgr = set()
    count = 0

    def get(idx):
        return items[idx]["data"]

    def palette_for(idx):
        j = nearest(idx, nclr_idx)
        return parse_nclr(get(j)) if j is not None else None

    # NCER cell banks -> proper sprites
    for it in items:
        if it["magic"] != "RECN":
            continue
        i = it["idx"]
        gj = nearest(i, ncgr_idx)
        if gj is None:
            LOG.fail(cat, f"{prefix} file#{i} NCER", "no NCGR to pair")
            continue
        try:
            tiles, bpp, _ = parse_ncgr(get(gj))
            pal = palette_for(gj) or palette_for(i)
            cells = render_ncer(it["data"], tiles, pal, bpp)
            cells = [c for c in cells if c is not None]
            if not cells:
                continue
            consumed_ncgr.add(gj)
            if len(cells) == 1:
                cells[0].save(os.path.join(outdir, f"{prefix}_{i:03d}.png"))
                count += 1
            else:
                # multiple cells -> stack into a horizontal sheet
                tot_w = sum(c.width for c in cells)
                max_h = max(c.height for c in cells)
                sheet = Image.new("RGBA", (tot_w, max_h), (0, 0, 0, 0))
                x = 0
                for c in cells:
                    sheet.paste(c, (x, 0)); x += c.width
                sheet.save(os.path.join(outdir, f"{prefix}_{i:03d}.png"))
                count += 1
        except Exception as e:
            LOG.fail(cat, f"{prefix} file#{i} NCER", e)

    # NSCR tilemaps -> backgrounds
    for it in items:
        if it["magic"] != "RCSN":
            continue
        i = it["idx"]
        gj = nearest(i, ncgr_idx)
        if gj is None:
            LOG.fail(cat, f"{prefix} file#{i} NSCR", "no NCGR to pair")
            continue
        try:
            tiles, bpp, _ = parse_ncgr(get(gj))
            pal = palette_for(gj) or palette_for(i)
            img = render_nscr(it["data"], tiles, pal)
            img.save(os.path.join(outdir, f"{prefix}_{i:03d}.png"))
            consumed_ncgr.add(gj)
            count += 1
        except Exception as e:
            LOG.fail(cat, f"{prefix} file#{i} NSCR", e)

    # Leftover standalone NCGRs -> linear render
    for gj in ncgr_idx:
        if gj in consumed_ncgr:
            continue
        try:
            tiles, bpp, wt = parse_ncgr(get(gj))
            pal = palette_for(gj)
            if pal is None:
                LOG.fail(cat, f"{prefix} file#{gj} NCGR", "no palette")
                continue
            img = render_ncgr_linear(tiles, pal, bpp, wt)
            img.save(os.path.join(outdir, f"{prefix}_{gj:03d}.png"))
            count += 1
        except Exception as e:
            LOG.fail(cat, f"{prefix} file#{gj} NCGR", e)

    # BTX0 textures, plus genuinely unknown blobs -> .bin
    BIN_CAP = 40            # avoid flooding folders from huge data-table NARCs
    bins_written = bins_skipped = 0
    used_names = set()
    for it in items:
        m = it["magic"]
        d = it["data"]
        try:
            if m == "BTX0":
                count += extract_btx0(d, cat, outdir,
                                      f"{prefix}_{it['idx']:03d}", used_names)
            elif m in ("RGCN", "RLCN", "RECN", "RCSN", "RNAN", "BMD0"):
                pass  # graphics handled above / RNAN, BMD0 = anim & 3D models
            else:
                # skip empty or all-zero padding blobs entirely
                if not d or len(d) < 8 or not any(d):
                    continue
                if bins_written >= BIN_CAP:
                    bins_skipped += 1
                    continue
                fn = os.path.join(
                    outdir, f"{prefix}_{it['idx']:03d}_{safe_tag(d)}.bin")
                with open(fn, "wb") as f:
                    f.write(d)
                bins_written += 1
                LOG.binned(cat, os.path.basename(fn), "unrecognised format")
        except Exception as e:
            LOG.fail(cat, f"{prefix} file#{it['idx']} ({m or 'raw'})", e)
    if bins_skipped:
        LOG.binned(cat, f"(+{bins_skipped} more)",
                   f"raw blobs beyond {BIN_CAP}-file cap, not written")
    return count


# --------------------------------------------------------------------------- #
#  Specialised: trainer battle sprites (/a/0/5/8, stride-5 groups)
# --------------------------------------------------------------------------- #
def process_trainers(narc, cat, outdir):
    """Each trainer = [NCGR_a, NCLR, NCER, NANR, NCGR_b].  Render the NCER with
    NCGR_a (primary) only.  The second NCGR uses a different encoding (flag10=0x0)
    and decodes to noise in every known tile mode, so it is intentionally skipped."""
    files = [decompress(f) for f in narc.files]
    n = len(files)
    primaries = []
    count = 0
    groups = n // 5
    for g in range(groups):
        a, p, c, _nanr, _ncgr_b = (files[g * 5 + k] for k in range(5))
        try:
            pal = parse_nclr(p)
            ncer = c
            tiles_a, bpp_a, _ = parse_ncgr(a)
            cells = [x for x in render_ncer(ncer, tiles_a, pal, bpp_a) if x]
            if cells:
                cells[0].save(os.path.join(outdir, f"trainer_{g:03d}.png"))
                primaries.append((g, cells[0]))
                count += 1
        except Exception as e:
            LOG.fail(cat, f"trainer group {g} (primary)", e)

    # contact sheet for manual identification
    if primaries:
        try:
            cols = 12
            cw, ch = 84, 96
            rows = math.ceil(len(primaries) / cols)
            sheet = Image.new("RGBA", (cols * cw, rows * ch), (40, 40, 40, 255))
            draw = ImageDraw.Draw(sheet)
            for k, (gi, img) in enumerate(primaries):
                cx, cy = (k % cols) * cw, (k // cols) * ch
                ox = cx + (cw - img.width) // 2
                oy = cy + (ch - 16 - img.height) // 2
                sheet.alpha_composite(img, (max(cx, ox), max(cy, oy)))
                draw.text((cx + 2, cy + ch - 14), f"{gi:03d}", fill=(255, 255, 0))
            sheet.convert("RGB").save(os.path.join(outdir, "_contact_sheet.png"))
            LOG.notes[cat] = (
                "Trainer order in NARC /a/0/5/8 does NOT match the requested "
                "name list (index 000 = male player, 001 = female player, ...). "
                "Files are numbered by NARC index; use _contact_sheet.png to "
                "assign the human names. The second NCGR per group (_b) encodes "
                "differently and is skipped — only the primary sprite is written.")
        except Exception as e:
            LOG.fail(cat, "contact sheet", e)
    return count


# --------------------------------------------------------------------------- #
#  Category table
# --------------------------------------------------------------------------- #
# (category key, NARC path, output subdir, file-prefix, mode)
CATEGORIES = [
    ("trainers_battle",  "a/0/5/8", "trainers/battle",    "trainer",   "trainer"),
    ("trainers_overworld", "a/0/8/1", "trainers/overworld", "ow",      "auto"),
    ("badges",           "a/1/0/3", "ui/badges",          "badge",     "auto"),
    ("items",            "a/1/6/8", "ui/items",           "item",      "auto"),
    ("battle_ui_hp",     "a/2/5/0", "ui/battle",          "hpbar",     "auto"),
    ("battle_ui_menu",   "a/0/7/1", "ui/battle",          "battlemenu","auto"),
    ("battle_ui_bag",    "a/0/7/7", "ui/battle",          "battlebag", "auto"),
    ("menus_bag",        "a/1/0/4", "ui/menus",           "menu",      "auto"),
    ("menus_options",    "a/0/7/2", "ui/menus",           "options",   "auto"),
    ("pokedex",          "a/0/6/8", "ui/pokedex",         "pokedex",   "auto"),
    ("dialogue",         "a/0/3/8", "ui/dialogue",        "textbox",   "auto"),
    ("types",            "a/0/6/9", "ui/types",           "type",      "auto"),
    ("map",              "a/1/4/6", "ui/map",             "map",       "auto"),
    ("pokegear_206",     "a/2/0/6", "ui/pokegear",        "pokegear",  "auto"),
    ("pokegear_207",     "a/2/0/7", "ui/pokegear",        "pokegear",  "auto"),
    ("pokegear_208",     "a/2/0/8", "ui/pokegear",        "pokegear",  "auto"),
    ("pokegear_209",     "a/2/0/9", "ui/pokegear",        "pokegear",  "auto"),
    ("mugshots",         "a/1/2/5", "trainers/mugshots",  "mugshot",   "auto"),
    ("title",            "a/0/4/6", "ui/title",           "title",     "auto"),
    ("characters",       "a/0/4/5", "characters",         "char",      "auto"),
    ("emotions",         "a/1/3/3", "ui/emotions",        "emotion",   "auto"),
    ("weather",          "a/0/3/3", "ui/weather",         "weather",   "auto"),
]


def main():
    rom_path = find_rom()
    if not rom_path:
        print("FATAL: could not locate a .nds ROM. Pass it as the first arg.")
        sys.exit(1)
    print(f"ROM: {rom_path}")
    rom = ndspy.rom.NintendoDSRom.fromFile(rom_path)
    print(f"Title: {rom.name.decode('ascii', 'replace').strip()}  "
          f"Code: {rom.idCode.decode('ascii', 'replace')}")
    print("-" * 64)

    for cat, narcpath, subdir, prefix, mode in CATEGORIES:
        outdir = os.path.join(OUT, subdir)
        os.makedirs(outdir, exist_ok=True)
        try:
            raw = rom.getFileByName(narcpath)
        except Exception as e:
            print(f"[{cat:18s}] NARC /{narcpath} MISSING ({e})")
            LOG.fail(cat, f"/{narcpath}", f"NARC not found: {e}")
            continue
        try:
            narc = ndspy.narc.NARC(raw)
        except Exception as e:
            print(f"[{cat:18s}] /{narcpath} not a NARC ({e})")
            LOG.fail(cat, f"/{narcpath}", f"not a NARC: {e}")
            continue

        try:
            if mode == "trainer":
                n = process_trainers(narc, cat, outdir)
            else:
                n = process_auto(narcpath, narc, cat, outdir, prefix)
            LOG.add(cat, n)
            print(f"[{cat:18s}] /{narcpath}  {len(narc.files):4d} files -> "
                  f"{n:4d} images")
        except Exception as e:
            print(f"[{cat:18s}] /{narcpath} ERROR: {e}")
            LOG.fail(cat, f"/{narcpath}", traceback.format_exc().splitlines()[-1])

    for cat, note in CATEGORY_NOTES.items():
        LOG.notes.setdefault(cat, note)

    write_readme(rom_path)
    print_summary()


# --------------------------------------------------------------------------- #
#  README + summary
# --------------------------------------------------------------------------- #
FOLDER_DOC = [
    ("trainers/battle", "Trainer/leader battle sprites, 80x80 (NARC /a/0/5/8)",
     "trainer_000.png, _contact_sheet.png"),
    ("trainers/overworld",
     "Overworld character sprites (NARC /a/0/8/1). 3D models; each model's "
     "frames are combined into ONE spritesheet named by the game's label.",
     "babyboy1.png, hero.png, heroine.png"),
    ("trainers/mugshots", "NARC /a/1/2/5 — single non-graphic blob in this ROM",
     "(none / *.bin)"),
    ("characters", "Player battle-back sprites (NARC /a/0/4/5)", "char_000.png"),
    ("ui/badges",
     "NOTE: NARC /a/1/0/3 is actually FIELD EFFECTS + EMOTION bubbles "
     "(grass rustle, hearts, !/?/music/sleep), not badges.",
     "fuki_heart.png, e_kusaeff2.png"),
    ("ui/items",
     "NOTE: NARC /a/1/6/8 holds bag/battle BACKGROUND art, not item icons.",
     "item_004.png"),
    ("ui/battle", "Battle UI: HP bars & in-battle menus "
     "(NARC /a/2/5/0, /a/0/7/1, /a/0/7/7)", "hpbar_*.png, battlemenu_*.png"),
    ("ui/menus", "Bag & options menu screens (NARC /a/1/0/4, /a/0/7/2)",
     "menu_*.png, options_*.png"),
    ("ui/dialogue", "Text-box / dialogue frame graphics (NARC /a/0/3/8)",
     "textbox_*.png"),
    ("ui/types",
     "NOTE: NARC /a/0/6/9 is the Pokemon FOOTPRINT set (~494 glyphs), "
     "not type icons.", "type_000.png"),
    ("ui/map", "Town-map / location splash screens (NARC /a/1/4/6)",
     "map_*.png"),
    ("ui/pokegear", "Pokegear graphics: radio/map/phone skins "
     "(NARC /a/2/0/6..9)", "pokegear_*.png"),
    ("ui/pokedex", "Pokedex UI screens (NARC /a/0/6/8)", "pokedex_*.png"),
    ("ui/title", "Title screen / intro graphics (NARC /a/0/4/6)", "title_*.png"),
    ("ui/emotions",
     "NOTE: NARC /a/1/3/3 is a data table, not graphics — the emotion "
     "bubbles actually live in ui/badges/ (see above). Empty here.", "(none)"),
    ("ui/weather",
     "NOTE: NARC /a/0/3/3 is a data table, not graphics. Empty here.",
     "(none)"),
]

# Honest findings where the brief's assumed NARC contents differ from reality.
CATEGORY_NOTES = {
    "badges": "NARC /a/1/0/3 contains field effects & emotion bubbles, not "
              "gym badges. Gym badges in HGSS are 3D models stored elsewhere.",
    "items": "NARC /a/1/6/8 contains background/scene art, not item icons.",
    "types": "NARC /a/0/6/9 contains ~494 Pokemon footprint glyphs, not the "
             "17 type icons.",
    "emotions": "NARC /a/1/3/3 is non-graphic data; emotion bubbles were found "
                "in /a/1/0/3 instead (see ui/badges/).",
    "weather": "NARC /a/0/3/3 is non-graphic data; no weather sprites here.",
    "pokegear_209": "NARC /a/2/0/9 is non-graphic data (4954 small records).",
    "mugshots": "NARC /a/1/2/5 holds a single non-graphic blob in this ROM.",
}


def write_readme(rom_path):
    p = os.path.join(OUT, "README.md")
    today = datetime.date.today().isoformat()
    total = sum(LOG.extracted.values())
    lines = []
    lines.append("# Pokemon HeartGold/SoulSilver — Non-Pokemon Sprite Extraction\n")
    lines.append(f"- **Extraction date:** {today}")
    lines.append(f"- **Source ROM:** `{os.path.basename(rom_path)}`")
    lines.append(f"- **Total images extracted:** {total}")
    lines.append(f"- **Tool:** `extract_hgss_sprites.py` (ndspy + Pillow)\n")

    lines.append("## Per-category counts\n")
    lines.append("| Category | Images |")
    lines.append("|----------|-------:|")
    for cat, _, _, _, _ in CATEGORIES:
        lines.append(f"| {cat} | {LOG.extracted.get(cat, 0)} |")
    lines.append("")

    lines.append("## Folder guide\n")
    lines.append("| Folder | Contents | Examples |")
    lines.append("|--------|----------|----------|")
    for folder, desc, ex in FOLDER_DOC:
        lines.append(f"| `{folder}/` | {desc} | {ex} |")
    lines.append("")

    if LOG.notes:
        lines.append("## Notes\n")
        for cat, note in LOG.notes.items():
            lines.append(f"- **{cat}:** {note}")
        lines.append("")

    lines.append("## Naming convention\n")
    lines.append(
        "- 2D sprites are named `<prefix>_<NARC-index>.png` (e.g. `trainer_004.png`). "
        "The NARC index keeps files stable and traceable back to the ROM.\n"
        "- `_b` suffix is **not emitted** for trainers: the second NCGR in each "
        "group uses an unrecognised tile encoding and renders to noise.\n"
        "- 3D model textures (BTX0) are named "
        "`<prefix>_<file>_<tex#>_<internal-texture-name>.png`, preserving the "
        "label the game uses internally.\n"
        "- Several categories the brief assumed were 2D sprites are actually 3D "
        "model data or non-graphic data tables in this ROM; where a verified "
        "human-name mapping was not possible, files are numbered rather than "
        "guessed at (wrong names are worse than honest numbers).\n")

    lines.append("## Unrecognised files (.bin)\n")
    if LOG.bins:
        lines.append("These sub-files were not a known graphic format and were "
                     "written out as raw bytes — they can be inspected manually "
                     "(e.g. with a tile viewer such as Tinke):\n")
        shown = LOG.bins[:60]
        for cat, fn, reason in shown:
            lines.append(f"- `{fn}` ({cat}) — {reason}")
        if len(LOG.bins) > len(shown):
            lines.append(f"- … and {len(LOG.bins) - len(shown)} more.")
    else:
        lines.append("None.")
    lines.append("")

    lines.append("## Failures\n")
    if LOG.failed:
        shown = LOG.failed[:60]
        for cat, where, reason in shown:
            lines.append(f"- **{cat}** — {where}: {reason}")
        if len(LOG.failed) > len(shown):
            lines.append(f"- … and {len(LOG.failed) - len(shown)} more.")
    else:
        lines.append("None.")
    lines.append("")

    lines.append("## Credit\n")
    lines.append("Sprites from **Pokemon HeartGold / SoulSilver** "
                 "© Nintendo / Game Freak / Creatures Inc. "
                 "Extracted for personal/educational use.")
    with open(p, "w") as f:
        f.write("\n".join(lines) + "\n")


def print_summary():
    print("-" * 64)
    print("SUMMARY  (extracted images vs. failures, per category)")
    print("-" * 64)
    cats = [c[0] for c in CATEGORIES]
    fail_by = {}
    for cat, _, _ in LOG.failed:
        fail_by[cat] = fail_by.get(cat, 0) + 1
    for cat in cats:
        print(f"  {cat:20s} extracted={LOG.extracted.get(cat,0):4d}   "
              f"failed={fail_by.get(cat,0):3d}")
    print("-" * 64)
    print(f"  TOTAL images   : {sum(LOG.extracted.values())}")
    print(f"  TOTAL failures : {len(LOG.failed)}")
    print(f"  TOTAL .bin     : {len(LOG.bins)}")
    print(f"  README         : {os.path.join(OUT, 'README.md')}")


if __name__ == "__main__":
    main()
