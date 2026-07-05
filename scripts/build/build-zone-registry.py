#!/usr/bin/env python3
"""
Construit src/data/zone-registry.json à partir de :
  - scripts/sources/zone-data.json  (zones, objets, warps, grille)
  - public/maps/*.png               (screenshots des zones)

Formules déduites du système de coordonnées HGSS :
  world_origin_x = grid_x × 32
  world_origin_y = grid_y × 32
  scale_x = screenshot_w / tile_width    (pixel screen / pixel monde)
  scale_y = screenshot_h / tile_height
"""

import json
import os
import re
from pathlib import Path

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("PIL absent — utilisation des dimensions tile_width/tile_height directement")

ZONE_DATA  = Path("scripts/sources/zone-data.json")
NAMES_FR   = Path("scripts/sources/zone-names-fr.json")
MAPS_DIR   = Path("public/maps")
OUT        = Path("src/data/zone-registry.json")

names_fr: dict = json.load(open(NAMES_FR)) if NAMES_FR.exists() else {}
if names_fr:
    print(f"{len(names_fr)} noms français chargés depuis {NAMES_FR}")

# ── Charger les données de zone ───────────────────────────────────────────────

data  = json.load(open(ZONE_DATA))
zones = data["zones"]
print(f"{len(zones)} zones dans zone-data.json")

# ── Indexer les screenshots disponibles ──────────────────────────────────────

map_files = list(MAPS_DIR.glob("*.png")) + list(MAPS_DIR.glob("*.jpg")) + list(MAPS_DIR.glob("*.webp"))
print(f"{len(map_files)} screenshots dans {MAPS_DIR}")

def normalize(s: str) -> str:
    """Normalise un nom pour la comparaison : minuscules, sans accents, sans ponctuation."""
    s = s.lower()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def zone_name_to_keywords(name: str) -> list[str]:
    """MAP_NEW_BARK_ELMS_LAB → ['new', 'bark', 'elms', 'lab']"""
    parts = name.replace("MAP_", "").split("_")
    return [p.lower() for p in parts if p and p not in ("1F","2F","3F","B1F","B2F","B3F","B4F")]

# Construire un index normalisé des fichiers
screenshot_index: list[tuple[str, Path]] = []
for f in map_files:
    screenshot_index.append((normalize(f.stem), f))

# Un intérieur ("NEW_BARK_ELMS_LAB_1F") partage un préfixe de mots-clés avec
# la zone extérieure qui le contient ("NEW_BARK") — ce préfixe matche tout
# aussi bien la capture de la ville que celle de l'intérieur, ce qui peut
# faire gagner la mauvaise capture à égalité de score. On repère ce préfixe
# quand il correspond exactement au nom (en mots-clés) d'une autre zone
# connue, et on lui donne un poids réduit face à la partie réellement
# distinctive du nom ("elms", "lab").
all_keyword_tuples = {tuple(zone_name_to_keywords(z["name"])) for z in zones}

def known_prefix_len(keywords: list[str]) -> int:
    for i in range(len(keywords) - 1, 0, -1):
        if tuple(keywords[:i]) in all_keyword_tuples:
            return i
    return 0

def score_against(keywords: list[str], zone_name: str, prefix_len: int):
    """prefix_len=0 means every keyword counts fully (no known parent zone
    to discount) — this also covers the no-op fallback pass."""
    best_path  = None
    best_score = 0
    for norm_stem, path in screenshot_index:
        stem_words = norm_stem.split()
        matched_count = 0
        matched_weight = 0.0
        matched_discriminating = 0
        for idx, kw in enumerate(keywords):
            if kw not in stem_words:
                continue
            matched_count += 1
            if idx < prefix_len:
                matched_weight += 0.3
            else:
                matched_weight += 1.0
                matched_discriminating += 1
        if matched_count == 0:
            continue
        # Une zone avec une partie distinctive doit matcher au moins ce
        # bout-là — sinon on ne fait que reconnaître le nom de la ville-mère,
        # ce qui pointerait vers la mauvaise capture (celle de la ville).
        if prefix_len < len(keywords) and matched_discriminating == 0:
            continue
        # Bonus de spécificité : préfère une capture qui correspond de près
        # dans les deux sens plutôt qu'un simple chevauchement partiel.
        score = matched_weight + matched_weight / len(stem_words)
        if "hgss" in norm_stem:
            score += 0.5
        if "kanto" in norm_stem and "kanto" not in zone_name.lower():
            score -= 1
        if score > best_score and matched_count >= len(keywords) * 0.5:
            best_score = score
            best_path  = path
    return best_path

# (keyword, generic capture filename) — order matters, first match wins.
GENERIC_TEMPLATES = [
    ("gatehouse", "Gate inside HGSS.png"),
    ("pokecenter", "Pokémon Center inside HGSS.png"),
    ("house", "Player House 1F HGSS.png"),
]

def find_generic_template(zone_name: str):
    lname = zone_name.lower()
    for keyword, filename in GENERIC_TEMPLATES:
        if keyword in lname.replace("_", ""):
            path = MAPS_DIR / filename
            if path.exists():
                return path
    return None

def find_screenshot(zone_name: str):
    keywords = zone_name_to_keywords(zone_name)
    if not keywords:
        return None
    prefix_len = known_prefix_len(keywords)
    return (
        score_against(keywords, zone_name, prefix_len)
        or score_against(keywords, zone_name, 0)
    )

def get_dimensions(path: Path, tile_w: int, tile_h: int) -> tuple[int, int]:
    if HAS_PIL and path and path.exists():
        img = Image.open(path)
        return img.size  # (width, height)
    return tile_w, tile_h

# ── Construire le registre ────────────────────────────────────────────────────

TILE_UNIT = 32  # 1 unité de grille = 32px en coordonnées monde
DEFAULT_SCALE = 12.0  # px/tile fallback for zones with no screenshot (~médiane observée)

registry_zones = []
matched   = 0
unmatched = 0

# Ascenseurs : les warps 4095 (0xFFF) sont "dynamiques" dans la ROM (la
# destination est l'étage d'où l'on vient, stocké en RAM). On reconstruit la
# liste des étages desservis = toutes les zones ayant un warp vers la zone
# ascenseur, avec la tuile de ce warp comme point d'arrivée.
elevator_names = {z["name"] for z in zones if any(w.get("header") == 4095 for w in z.get("warps", []))}
floors_by_elevator: dict[str, list[dict]] = {name: [] for name in elevator_names}
for z in zones:
    for w in z.get("warps", []):
        dest = w.get("header")
        if dest in elevator_names and z["name"] not in elevator_names:
            floors = floors_by_elevator[dest]
            if not any(f["name"] == z["name"] for f in floors):
                floors.append({"name": z["name"], "x": w.get("x", 0), "z": w.get("z", 0)})

for z in zones:
    name       = z["name"]
    map_id     = z.get("map_id", -1)
    grid_x     = z.get("grid_x", 0)
    grid_y     = z.get("grid_y", 0)
    tile_w     = z.get("tile_width", 32)
    tile_h     = z.get("tile_height", 32)
    objects    = z.get("objects", [])
    warps      = z.get("warps", [])

    # Coordonnées monde du coin supérieur gauche de la zone
    world_origin_x = grid_x * TILE_UNIT
    world_origin_y = grid_y * TILE_UNIT

    # Screenshot
    screenshot_path = find_screenshot(name)
    if not screenshot_path:
        # No dedicated capture exists (small single-purpose rooms — random
        # NPC houses, gatehouses — were never individually screenshotted by
        # anyone). HGSS itself reuses one generic tileset for these, so a
        # representative capture of that same generic room is a genuinely
        # more accurate fallback than a blank box, not just a random guess.
        screenshot_path = find_generic_template(name)

    if screenshot_path:
        matched += 1
        scr_w, scr_h = get_dimensions(screenshot_path, tile_w, tile_h)
        screenshot_url = "/" + str(screenshot_path.relative_to(Path("public")))
    else:
        unmatched += 1
        # No screenshot asset — fall back to the median on-screen scale of
        # zones that do have one (~12.5px/tile) instead of 1:1 tile_w/tile_h.
        # Without this, these zones render at their raw tile-grid size (as
        # small as 32x32 CSS px for a 1-room interior) — technically
        # correct but practically unclickable.
        scr_w, scr_h = round(tile_w * DEFAULT_SCALE), round(tile_h * DEFAULT_SCALE)
        screenshot_url = ""

    # Scale : pixels écran par unité monde
    scale_x = scr_w / tile_w if tile_w > 0 else 1.0
    scale_y = scr_h / tile_h if tile_h > 0 else 1.0

    # Formatter les objets (garder seulement les champs utiles pour la carte)
    clean_objects = [
        {
            "id":        obj.get("id", ""),
            "spriteId":  obj.get("spriteId", ""),
            "x":         obj.get("x", 0),
            "z":         obj.get("z", 0),
            "eventFlag": obj.get("eventFlag", "FLAG_NOTHING"),
            # Kept for future NPC behavior (patrol, sight cone) — currently
            # unused by the renderer, but cheap to carry since it's already
            # in the source data.
            "facingDirection": obj.get("facingDirection", 0),
            "movement":        obj.get("movement", 0),
            "xRange":          obj.get("xRange", 0),
            "yRange":          obj.get("yRange", 0),
        }
        for obj in objects
    ]

    # Formatter les warps
    clean_warps = [
        {
            "x":      w.get("x", 0),
            "z":      w.get("z", 0),
            "header": w.get("header", ""),
            "anchor": w.get("anchor", 0),
        }
        for w in warps
    ]

    registry_zones.append({
        "name":           name,
        "map_id":         map_id,
        "screenshot":     screenshot_url,
        "screenshot_w":   scr_w,
        "screenshot_h":   scr_h,
        "tile_width":     tile_w,
        "tile_height":    tile_h,
        "scale_x":        round(scale_x, 4),
        "scale_y":        round(scale_y, 4),
        "world_origin_x": world_origin_x,
        "world_origin_y": world_origin_y,
        "objects":        clean_objects,
        "warps":          clean_warps,
        # Un char par tuile ('#' mur, '.' sol, 'i' glace, 'w' eau, 'W'
        # tourbillon, 'F' cascade) — remplace l'ancien tableau walkable
        # (walkable dérivable : tout sauf '#' et 'F'), ~2× plus léger.
        "terrain":        z.get("terrain", ""),
        # [localX, localZ, dir] per ledge tile, DIR_* codes (0=N,1=S,2=W,3=E)
        # — hopped over when moving in that direction, never stood on.
        "ledges":         z.get("ledges", []),
        # Étages desservis quand la zone est un ascenseur (warp 4095) :
        # [{name, x, z}] — tuile d'arrivée = le warp de l'étage vers l'ascenseur.
        "elevator_floors": floors_by_elevator.get(name, []),
        "display_name":   names_fr.get(name),
        "is_outdoor":     z.get("is_outdoor", False),
    })

# ── Écrire ────────────────────────────────────────────────────────────────────

OUT.parent.mkdir(parents=True, exist_ok=True)
json.dump({"zones": registry_zones}, open(OUT, "w"), ensure_ascii=False, indent=2)

print()
print(f"Done → {OUT}")
print(f"  {len(registry_zones)} zones")
print(f"  {matched} avec screenshot, {unmatched} sans")
