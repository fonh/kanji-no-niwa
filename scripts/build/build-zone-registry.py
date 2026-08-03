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

from __future__ import annotations

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

FLOOR_TOKENS = {"1f", "2f", "3f", "b1f", "b2f", "b3f", "b4f"}

def zone_name_to_keywords(name: str) -> list[str]:
    """MAP_NEW_BARK_ELMS_LAB → ['new', 'bark', 'elms', 'lab']"""
    parts = name.replace("MAP_", "").split("_")
    return [p.lower() for p in parts if p and p not in ("1F","2F","3F","B1F","B2F","B3F","B4F")]

def zone_floor_token(name: str) -> str | None:
    """MAP_NEW_BARK_ELMS_LAB_2F → '2f' ; None when the zone name carries no
    floor suffix. Kept separate from zone_name_to_keywords, which strips
    this token, so callers can still disambiguate same-building floors."""
    last = name.split("_")[-1]
    lowered = last.lower()
    return lowered if lowered in FLOOR_TOKENS else None

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
#
# Le même problème se pose ailleurs qu'en tête de nom : une guérite entre
# deux routes s'appelle "ROUTE_29_ROUTE_46_GATEHOUSE" — le nom entier d'une
# AUTRE zone bien réelle (MAP_ROUTE_46) est incrusté au milieu, pas en
# préfixe. Sans traitement, "route"+"46" comptent comme discriminants,
# suffisent à faire gagner la capture EXTÉRIEURE de la Route 46 (score non
# nul, garde anti-préfixe-seul contournée) alors que "gatehouse" — le seul
# mot qui décrit vraiment cette zone — ne matche aucune capture dédiée et
# que le repli générique (`find_generic_template`, "gatehouse" →
# "Gate inside HGSS.png") ne se déclenche jamais puisque `find_screenshot`
# a déjà renvoyé un résultat. Généralisation : repérer TOUTE sous-séquence
# contiguë de mots-clés (pas seulement en position 0) qui reconstitue
# exactement le nom complet d'une autre zone connue, et la traiter avec le
# même poids réduit que le préfixe — qu'elle soit au début, au milieu ou à
# la fin du nom.
all_keyword_tuples = {tuple(zone_name_to_keywords(z["name"])) for z in zones}

def discounted_keyword_indices(keywords: list[str]) -> set[int]:
    n = len(keywords)
    discounted: set[int] = set()
    for length in range(n - 1, 0, -1):  # exclut l'auto-match (length == n)
        for start in range(0, n - length + 1):
            if tuple(keywords[start:start + length]) in all_keyword_tuples:
                discounted.update(range(start, start + length))
    return discounted

def score_against(keywords: list[str], zone_name: str, discounted: set[int], zone_floor: str | None, is_outdoor: bool):
    best_path  = None
    best_score = 0
    for norm_stem, path in screenshot_index:
        stem_words = norm_stem.split()
        stem_floors = FLOOR_TOKENS & set(stem_words)
        # A capture labelled for a different floor than this zone is never
        # the right one, even if every other word matches (e.g. "Elms lab
        # 1F" scoring against zone ..._ELMS_LAB_2F) — the floor suffix is
        # stripped from `keywords` above, so nothing else catches this.
        if zone_floor and stem_floors and zone_floor not in stem_floors:
            continue
        # An interior zone is never correctly shown through its building's
        # outside shot, unless "exterior" is itself part of the zone's own
        # name (e.g. MAP_..._LIGHTHOUSE_EXTERIOR, which is legitimately an
        # outside area modeled as its own zone).
        if not is_outdoor and "exterior" not in keywords and "exterior" in stem_words:
            continue
        matched_count = 0
        matched_weight = 0.0
        matched_discriminating = 0
        for idx, kw in enumerate(keywords):
            if kw not in stem_words:
                continue
            matched_count += 1
            if idx in discounted:
                matched_weight += 0.3
            else:
                matched_weight += 1.0
                matched_discriminating += 1
        if matched_count == 0:
            continue
        # Une zone avec une partie distinctive doit matcher au moins ce
        # bout-là — sinon on ne fait que reconnaître le nom d'une AUTRE zone
        # connue (ville-mère en préfixe, ou route/lieu voisin incrusté
        # ailleurs dans le nom, ex. une guérite "ROUTE_29_ROUTE_46_..."), ce
        # qui pointerait vers la mauvaise capture (celle de cette autre
        # zone). Ne s'applique que si le nom a au moins un mot NON réduit à
        # décharge — sinon (toute la zone n'est faite que de mots-clés
        # connus d'ailleurs) rien à comparer, on laisse la suite juger.
        if len(discounted) < len(keywords) and matched_discriminating == 0:
            continue
        # Bonus de spécificité : préfère une capture qui correspond de près
        # dans les deux sens plutôt qu'un simple chevauchement partiel.
        score = matched_weight + matched_weight / len(stem_words)
        if "hgss" in norm_stem:
            score += 0.5
        if "kanto" in norm_stem and "kanto" not in zone_name.lower():
            score -= 1
        # Décisif en cas d'égalité : entre deux captures du même bâtiment
        # ("... 1F" vs "... 2F"), celle qui porte le bon étage l'emporte.
        if zone_floor and zone_floor in stem_words:
            score += 2.0
        if score > best_score and matched_count >= len(keywords) * 0.5:
            best_score = score
            best_path  = path
    return best_path

# (keyword, generic capture filename) — order matters, first match wins.
# "house" and "pokecenter" have floor-aware handling below instead of a flat
# entry here : an upper/basement floor never looks like the ground floor
# (different furniture, no kitchen/entryway) — reusing the 1F capture for a
# zone's own 2F is the most visible case of this (issue 13 : the player's
# own bedroom rendered as their kitchen), so a non-ground floor prefers a
# distinct generic capture over the ground-floor one.
GENERIC_TEMPLATES = [
    ("gatehouse", "Gate inside HGSS.png"),
    # "Poké Mart" is two words in every source filename ("Poké Mart HGSS.png",
    # "Poké Mart interior HGSS.png") but one merged keyword here (no
    # underscore between POKE and MART in e.g. MAP_CHERRYGROVE_POKEMART) — it
    # never matches a stem word in score_against/find_screenshot at all
    # (matched_count stays 0), so every *_POKEMART zone (13 of them) fell
    # through with an empty screenshot. Interior shot, not the storefront.
    ("pokemart", "Poké Mart interior HGSS.png"),
]
GENERIC_HOUSE_GROUND = "Player House 1F HGSS.png"
GENERIC_HOUSE_UPPER  = "Red House 2F HGSS.png"
# Every *_POKECENTER_B1F/2F zone's objects are the same standard Wifi Club /
# Union Room content (std_wifi_reception + 2× std_wifi_pichu_check/
# std_teala_subsequent_talk pcwoman2, verified across 23+ zones) — a
# genuinely different room from the 1F lobby, not a variant of it. Before
# this, "pokecenter" was a flat GENERIC_TEMPLATES entry with no floor
# awareness, so every basement/upper Pokémon Center reused the exact same
# capture as its own 1F lobby (same bug class as the house 1F/2F mixup
# above, just never given the same floor-aware treatment).
GENERIC_POKECENTER_GROUND = "Pokémon Center inside HGSS.png"
GENERIC_POKECENTER_UPPER  = "Union Room HGSS.png"

def find_generic_template(zone_name: str):
    # Whole-keyword membership, not a raw substring check — "lighthouse" and
    # "warehouse" both contain the letters "house" but aren't one, and a
    # substring match wrongly template them as a generic player house.
    keywords = zone_name_to_keywords(zone_name)
    for keyword, filename in GENERIC_TEMPLATES:
        if keyword in keywords:
            path = MAPS_DIR / filename
            if path.exists():
                return path
    floor = zone_floor_token(zone_name)
    if "house" in keywords:
        filename = GENERIC_HOUSE_UPPER if floor and floor != "1f" else GENERIC_HOUSE_GROUND
        path = MAPS_DIR / filename
        if path.exists():
            return path
    if "pokecenter" in keywords:
        filename = GENERIC_POKECENTER_UPPER if floor and floor != "1f" else GENERIC_POKECENTER_GROUND
        path = MAPS_DIR / filename
        if path.exists():
            return path
    return None

def find_screenshot(zone_name: str, is_outdoor: bool):
    keywords = zone_name_to_keywords(zone_name)
    if not keywords:
        return None
    discounted = discounted_keyword_indices(keywords)
    zone_floor = zone_floor_token(zone_name)
    # A single pass: discounted is already empty for zones with no keyword
    # sequence matching another known zone (the discount is a no-op then),
    # so a second empty-discount attempt would only ever matter for zones
    # that DO embed another zone's name — and there, it would re-run the
    # match without the "must match something distinctive" guard, letting
    # that other zone's own screenshot (e.g. the whole town, or a
    # neighbouring route for a gatehouse) win for rooms that have no
    # dedicated capture at all. That's exactly wrong: those rooms should
    # fall through to find_generic_template instead.
    return score_against(keywords, zone_name, discounted, zone_floor, is_outdoor)

# Interior rooms are ROM-extracted onto a generic block grid (32×32 for
# most, 96-wide for a few) padded FAR beyond the actual walled room with
# walkable filler — nothing in the collision grid stops a player from
# wandering into the padding, but the screenshot is cropped tight to the
# real room, so scale (screenshot_px / tile_w) computed against the padded
# width squeezes the whole visible room into a small corner: a player
# walking toward what the picture shows as the far wall is still deep in
# "padding space" well before hitting anything solid, and the far wall /
# exit door end up unreachable. Trim tile_w/tile_h (and the terrain string)
# to the real bounding box — walls plus every object/warp/ledge actually
# placed in the room, so no legitimate content (e.g. a scripted NPC posed
# past the nearest wall for a cutscene) ends up outside the new bounds.
def interior_bounds(z: dict, tile_w: int, tile_h: int, is_outdoor: bool) -> tuple[int, int]:
    if is_outdoor:
        return tile_w, tile_h
    terrain = z.get("terrain", "")
    solid = [i for i, c in enumerate(terrain) if c != "."]
    if not solid:
        return tile_w, tile_h
    max_x = max(i % tile_w for i in solid)
    max_z = max(i // tile_w for i in solid)
    for o in z.get("objects", []):
        max_x = max(max_x, o.get("x", 0))
        max_z = max(max_z, o.get("z", 0))
    for w in z.get("warps", []):
        max_x = max(max_x, w.get("x", 0))
        max_z = max(max_z, w.get("z", 0))
    for lx, lz, _ldir in z.get("ledges", []):
        max_x = max(max_x, lx)
        max_z = max(max_z, lz)
    return min(max_x + 1, tile_w), min(max_z + 1, tile_h)

def trim_terrain(terrain: str, old_w: int, new_w: int, new_h: int) -> str:
    if not terrain:
        return terrain
    return "".join(terrain[z * old_w : z * old_w + new_w] for z in range(new_h))

# Issue 13 (« arbres traversables », capture d'écran jointe — Route 29, lisière
# est du massif de pins au sud du panneau/de la clairière du PNJ tutoriel).
# `terrain` vient de zone-data.json (extraction ROM, pas de bug de génération
# ici — vérifié : identique dans la source) et déclare praticable une bande
# diagonale (bord ouest du massif) que le screenshot dessine en canopée dense,
# visuellement indissociable des tuiles voisines correctement murées ('#') du
# même massif — aucune trace de sentier (testé par échantillonnage de couleur :
# aucun pixel de la teinte "chemin" dans toute la bande). Le moteur n'ayant
# aucun calque de profondeur (contrairement au vrai jeu DS, qui peut faire
# passer le joueur "derrière" le haut d'un arbre), cette tuile praticable
# rendue en canopée pleine reproduit exactement le bug rapporté.
#
# Piste naïve (murer toute la bande pour coller à l'image) rejetée : vérifiée
# **cassante** — BFS + `a1-traversal.test.ts` confirment que cette bande est
# l'unique corridor reliant l'entrée est de la zone (depuis Bourg Geon) au
# reste de Route 29 (Ville Griotte, Route 30, PNJ, la guérite) ; la murer en
# entier isole toute la suite du parcours. Recherche du sous-ensemble maximal
# sûr (glouton, chaque tuile testée une à une contre BFS + les points
# obligatoires réels — les 2 tuiles de la guérite, l'adjacence des 2 PNJ de la
# zone, le bord ouest vers Ville Griotte) : sur les 45 tuiles suspectes,
# 44 peuvent être murées sans casser aucun chemin obligatoire — seule (76,24)
# doit rester praticable (le passage réel, invisible à l'image, ne fait qu'une
# tuile de large à cet endroit). Résultat déterministe (chaque tuile
# gardée/murée revérifiée contre les mêmes points obligatoires après coup,
# pas juste au moment du glouton) ; `npm run check` (a1-traversal.test.ts)
# reste vert avec ce sous-ensemble. Portée strictement limitée à cette bande
# précisément vérifiée à l'œil et au graphe — pas une correction générique
# (testée par couleur sur tout le jeu, bien trop de faux positifs, voir
# issue 13) ; si un autre zone a le même défaut, à traiter au cas par cas.
OUTDOOR_TERRAIN_PATCHES: dict[str, list[tuple[int, int, int]]] = {
    # (x_start, x_end_inclusive, z) — une entrée par ligne de la bande ;
    # (76, 24) volontairement absente (seule case du massif qui doit rester
    # praticable, voir commentaire ci-dessus).
    #
    # 2026-08-03 (suite) — 2ᵉ signalement utilisateur (capture d'écran), joueur
    # visiblement « dans les arbres » plus à l'ouest/au centre de la même
    # Route 29, cette fois dans la bordure sud de canopée (z 23-28), pas la
    # lisière est du massif corrigée ci-dessus (z 20-26, x 76-89). Deux poches
    # distinctes trouvées et confirmées par rendu composite (capture réelle +
    # grille de collision superposée) puis par classification couleur tuile
    # par tuile (même méthode que le scanner `canopy_scan_draft.py`, mais
    # sans le filtre « ≥60% voisins murés » qui sous-compte les gros trous :
    # une tuile au MILIEU d'un trou n'a quasi aucun voisin mur, seulement des
    # voisins eux-mêmes trous — le filtre ne capte que la bordure d'un trou
    # large, voir issue 13) :
    #   - poche ouest (x 6-11, z 23-28) : petite poche isolée dans la canopée,
    #     juste au sud d'une entrée d'eau (non touchée, hors périmètre).
    #   - poche centrale (x 30-75, z 24-28) : bien plus grande, ~30 tuiles de
    #     large, forme en escalier (le trou se décale vers l'est à mesure que
    #     z augmente, suit le contour de la canopée) — c'est celle visible
    #     dans la 2ᵉ capture d'écran de l'utilisateur.
    # Hypothèse initiale erronée, corrigée avant commit : cette poche a
    # d'abord semblé être un cul-de-sac isolé (atteint uniquement via les
    # ledges à sens unique de la rangée z=23, mur ouest x0-5 déjà présent) —
    # un premier essai a muré la totalité des 188 tuiles couleur-canopée d'un
    # coup. `npm run check` a rougi (3 tests `a1-traversal.test.ts` : guérite,
    # PNJ, continuum Route 29 → Ville Griotte/Route 30 tous cassés). BFS
    # Python de diagnostic (même sémantique que `bfsOutdoor` : ledges à sens
    # unique, franchissement de bord via `findOutdoorZoneAt`, warps = sorties)
    # a montré que le chemin ouest-est de la bande z10-18 (la voie « normale »)
    # est en réalité coupé en plusieurs segments par les massifs de pins de
    # cette même bande — le vrai chemin contourne PAR le sud, plonge dans
    # cette poche via les ledges, la traverse partiellement, et en ressort
    # par un passage à pied (pas un ledge, donc à double sens) cousu dans le
    # coin sud-est de la poche. Reproduit le même principe que (76, 24) pour
    # la bande corrigée plus haut, à plus grande échelle. Recherche gloutonne
    # tuile par tuile (même méthode que la 1ʳᵉ correction, chaque tuile testée
    # contre un BFS complet — guérite, adjacence des 2 PNJ, les 4 zones du
    # continuum toutes atteintes — gardée si aucun de ces points ne casse,
    # sinon laissée praticable) sur les 188 tuiles candidates : 167 murables,
    # 21 doivent rester praticables (le passage réel, invisible à l'image).
    # `npm run check` vert avec ce sous-ensemble.
    "MAP_ROUTE_29": [
        (84, 89, 20),
        (80, 89, 21),
        (79, 89, 22),
        (78, 81, 23),
        (77, 81, 24),
        (76, 79, 25),
        (76, 79, 26),
        (6, 7, 23),
        (6, 7, 24),
        (30, 41, 24),
        (6, 11, 25),
        (30, 60, 25),
        (66, 74, 25),
        (6, 11, 26),
        (30, 60, 26),
        (66, 72, 26),
        (6, 11, 27),
        (42, 60, 27),
        (62, 72, 27),
        (6, 11, 28),
        (42, 60, 28),
    ],
}

def apply_outdoor_terrain_patches(name: str, terrain: str, tile_w: int) -> str:
    patches = OUTDOOR_TERRAIN_PATCHES.get(name)
    if not patches or not terrain:
        return terrain
    chars = list(terrain)
    for x_start, x_end, tz in patches:
        for tx in range(x_start, x_end + 1):
            idx = tz * tile_w + tx
            if 0 <= idx < len(chars):
                chars[idx] = "#"
    return "".join(chars)

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
    tile_w_raw = z.get("tile_width", 32)
    tile_h_raw = z.get("tile_height", 32)
    objects    = z.get("objects", [])
    warps      = z.get("warps", [])
    is_outdoor = z.get("is_outdoor", False)

    tile_w, tile_h = interior_bounds(z, tile_w_raw, tile_h_raw, is_outdoor)
    terrain_raw = trim_terrain(z.get("terrain", ""), tile_w_raw, tile_w, tile_h)
    terrain_raw = apply_outdoor_terrain_patches(name, terrain_raw, tile_w)

    # Coordonnées monde du coin supérieur gauche de la zone
    world_origin_x = grid_x * TILE_UNIT
    world_origin_y = grid_y * TILE_UNIT

    # Screenshot
    screenshot_path = find_screenshot(name, is_outdoor)
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
        "terrain":        terrain_raw,
        # [localX, localZ, dir] per ledge tile, DIR_* codes (0=N,1=S,2=W,3=E)
        # — hopped over when moving in that direction, never stood on.
        "ledges":         z.get("ledges", []),
        # Étages desservis quand la zone est un ascenseur (warp 4095) :
        # [{name, x, z}] — tuile d'arrivée = le warp de l'étage vers l'ascenseur.
        "elevator_floors": floors_by_elevator.get(name, []),
        "display_name":   names_fr.get(name),
        "is_outdoor":     is_outdoor,
    })

# ── Écrire ────────────────────────────────────────────────────────────────────

OUT.parent.mkdir(parents=True, exist_ok=True)
json.dump({"zones": registry_zones}, open(OUT, "w"), ensure_ascii=False, indent=2)

print()
print(f"Done → {OUT}")
print(f"  {len(registry_zones)} zones")
print(f"  {matched} avec screenshot, {unmatched} sans")
