import json, math, sys
from PIL import Image

ROOT = "/Users/henrifontanille/Documents/pokedex_kanji"
d = json.load(open(f"{ROOT}/src/data/zone-registry.json"))["zones"]
zones = [z for z in d if z.get("is_outdoor") and z.get("screenshot") and z.get("terrain")]

def sample(img, cx, cy, w, h, box_frac=0.5):
    bw, bh = max(1, w * box_frac), max(1, h * box_frac)
    x0 = max(0, int(cx - bw / 2)); x1 = min(img.width, int(cx + bw / 2) + 1)
    y0 = max(0, int(cy - bh / 2)); y1 = min(img.height, int(cy + bh / 2) + 1)
    if x1 <= x0 or y1 <= y0:
        return None
    region = img.crop((x0, y0, x1, y1))
    pixels = list(region.getdata())
    n = len(pixels)
    if n == 0:
        return None
    r = sum(p[0] for p in pixels) / n
    g = sum(p[1] for p in pixels) / n
    b = sum(p[2] for p in pixels) / n
    return (r, g, b)

def dist(a, b):
    return math.sqrt(sum((a[i] - b[i]) ** 2 for i in range(3)))

results = []
for z in zones:
    name = z["name"]
    shot = z["screenshot"]
    path = f"{ROOT}/public{shot}"
    try:
        img = Image.open(path).convert("RGB")
    except Exception as e:
        continue
    tw, th = z["tile_width"], z["tile_height"]
    terrain = z["terrain"]
    if len(terrain) != tw * th:
        continue
    sx, sy = z["scale_x"], z["scale_y"]
    grid = [terrain[i * tw:(i + 1) * tw] for i in range(th)]

    solid_colors = []
    other_colors = {}
    coords_color = {}
    for ty in range(th):
        for tx in range(tw):
            ch = grid[ty][tx]
            cx = (tx + 0.5) * sx
            cy = (ty + 0.5) * sy
            c = sample(img, cx, cy, sx, sy)
            if c is None:
                continue
            coords_color[(tx, ty)] = (ch, c)
            if ch == "#":
                solid_colors.append(c)
            else:
                other_colors.setdefault(ch, []).append(c)

    if len(solid_colors) < 20:
        continue
    n = len(solid_colors)
    solid_mean = tuple(sum(c[i] for c in solid_colors) / n for i in range(3))

    all_other = [c for lst in other_colors.values() for c in lst]
    if len(all_other) < 5:
        continue
    m = len(all_other)
    other_mean = tuple(sum(c[i] for c in all_other) / m for i in range(3))

    # only flag '.' (plain walkable) tiles - water/ice/grass have their own legit look
    candidates = []
    for (tx, ty), (ch, c) in coords_color.items():
        if ch != ".":
            continue
        d_solid = dist(c, solid_mean)
        d_other = dist(c, other_mean)
        if d_solid < d_other and d_solid < 40:
            # spatial check: count solid neighbors (8-neighborhood)
            solid_n = 0
            total_n = 0
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    nx, ny = tx + dx, ty + dy
                    if 0 <= nx < tw and 0 <= ny < th:
                        total_n += 1
                        if grid[ny][nx] == "#":
                            solid_n += 1
            if total_n > 0 and solid_n / total_n >= 0.6:
                candidates.append((tx, ty, round(d_solid, 1), round(d_other, 1), solid_n, total_n))

    if candidates:
        results.append((name, shot, len(candidates), candidates, solid_mean, other_mean))

results.sort(key=lambda r: -r[2])
print(f"{len(zones)} outdoor zones scanned, {len(results)} with candidate holes\n")
for name, shot, count, candidates, sm, om in results:
    print(f"{name}  ({shot})  {count} candidate tile(s)  solid_mean={tuple(round(x) for x in sm)} other_mean={tuple(round(x) for x in om)}")
    for tx, ty, ds, do, sn, tn in candidates[:15]:
        print(f"    tile local=({tx},{ty})  d_solid={ds} d_other={do} solid_neighbors={sn}/{tn}")
    if count > 15:
        print(f"    ... +{count-15} more")
