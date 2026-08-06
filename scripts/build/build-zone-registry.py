#!/usr/bin/env python3
"""
Construit src/data/zone-registry.json à partir de :
  - scripts/sources/zone-data.json  (zones, objets, warps, grille)
  - public/maps/*.png               (screenshots des zones)

Formules déduites du système de coordonnées HGSS :
  world_origin_x = grid_x × 32
  world_origin_y = grid_y × 32

Le placement de la grille sur le screenshot (scale_x/scale_y = pas d'une tuile
en pixels, origin_px/origin_py = pixel de la tuile (0,0)) n'est PAS déduit des
dimensions de l'image : il est mesuré par scripts/build/fit-map-alignment.py
et lu depuis scripts/sources/map-alignment.json — voir la section « Recalage »
plus bas pour le pourquoi.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("PIL absent — utilisation des dimensions tile_width/tile_height directement")

sys.path.insert(0, str(Path(__file__).parent))
from zone_grid import interior_bounds, trim_terrain  # noqa: E402

ZONE_DATA  = Path("scripts/sources/zone-data.json")
NAMES_FR   = Path("scripts/sources/zone-names-fr.json")
MAPS_DIR   = Path("public/maps")
OUT        = Path("src/data/zone-registry.json")
# Capture ASSOCIÉE à chaque zone, avant le filtre qualité. Le recalage doit
# lire ce fichier, pas le registre : une capture écartée disparaît du registre,
# et si le recalage se basait dessus il oublierait la zone — plus personne ne
# pourrait alors la ré-évaluer. Boucle fermée, zone perdue pour de bon.
MATCHED    = Path("scripts/sources/zone-screenshots.json")

names_fr: dict = json.load(open(NAMES_FR)) if NAMES_FR.exists() else {}
if names_fr:
    print(f"{len(names_fr)} noms français chargés depuis {NAMES_FR}")

# ── Charger les données de zone ───────────────────────────────────────────────

data  = json.load(open(ZONE_DATA))
zones = data["zones"]
print(f"{len(zones)} zones dans zone-data.json")

# ── Associations explicites zone → capture (issue 13, § « intérieurs
# génériques ») ────────────────────────────────────────────────────────────
#
# 6 zones dont le nom ne contient aucun mot assez discriminant pour qu'un
# matching par mots-clés les distingue correctement (même limite que
# gatehouse/pokemart plus haut, traitée au cas par cas plutôt qu'en
# généralisant le scoring) : chacune pointe explicitement vers sa propre
# capture, comme un GENERIC_TEMPLATES mais à la granularité de la zone. Voir
# le commentaire détaillé près de `find_generic_template` pour la source de
# chaque image (une vraie capture pour Mr Pokémon, 5 compositions à partir
# d'assets HGSS réels déjà dans ce dépôt pour les autres).
#
# Cas à part : « (sans PNJ) » = capture retouchée par
# scripts/build/scrub-baked-npcs.py. Les captures de cartes sont des captures
# de PARTIE : les PNJ y sont peints dans les pixels, et pour le labo d'Elm
# l'avatar du joueur qui a pris la capture aussi, son Chikorita avec. Le moteur
# dessinant ensuite ses propres sprites par-dessus, chaque personnage
# apparaissait deux fois (issue 13, « compte tous les npc en double »).
ZONE_SCREENSHOT_OVERRIDES = {
    "MAP_NEW_BARK_ELMS_LAB_1F":          "Elms lab 1F HGSS (sans PNJ).png",
    "MAP_ROUTE_30_MR_POKEMON_HOUSE":     "Mr Pokemon House HGSS.png",
    "MAP_ROUTE_30_APRICORN_HOUSE":       "Apricorn Man House HGSS.png",
    "MAP_CHERRYGROVE_SOUTHWEST_HOUSE":   "Cherrygrove Southwest House HGSS.png",
    "MAP_CHERRYGROVE_GUIDE_GENT_HOUSE":  "Cherrygrove Guide Gent House HGSS.png",
    "MAP_CHERRYGROVE_SOUTHEAST_HOUSE":   "Cherrygrove Southeast House HGSS.png",
    "MAP_NEW_BARK_SOUTHWEST_HOUSE":      "New Bark Southwest House HGSS.png",
    # 2026-08-07 : l'École Pokémon d'Earl était servie SANS décor, donc en
    # grille de collision nue — sa capture existait dans public/maps/ mais son
    # nom ne contient pas « Violet », donc le matching par mots-clés ne pouvait
    # pas la trouver. Assignée à la main, comme les maisons ci-dessus.
    # Le poste-frontière Route 31 ↔ Mauville, lui, RESTE sans décor : la seule
    # capture de poste-frontière du dossier (« Gate inside HGSS.png ») ne se
    # cale pas sur sa grille (recalage dégénéré, pas vertical de 6,1 px/tuile
    # contre ~11 attendus — c'est une AUTRE porte). Servir une image qui ment
    # sur les murs est pire que la grille : ADR-0006, « un joueur qui voit une
    # grille comprend qu'il voit une grille ».
    "MAP_VIOLET_POKEMON_SCHOOL":         "Pokémon School interior HGSS.png",
}

# ── Indexer les screenshots disponibles ──────────────────────────────────────

map_files = list(MAPS_DIR.glob("*.png")) + list(MAPS_DIR.glob("*.jpg")) + list(MAPS_DIR.glob("*.webp"))
print(f"{len(map_files)} screenshots dans {MAPS_DIR}")

# Les captures ci-dessus ne doivent JAMAIS être trouvées par le matching par
# mots-clés (`find_screenshot`) pour une AUTRE zone que celle à laquelle
# elles sont explicitement assignées — sans cette exclusion, un nom de
# fichier contenant "House"/"New Bark"/etc. (inévitable, ce sont de vraies
# maisons) se fait repérer par le scoring générique et court-circuite le
# repli `find_generic_template` prévu pour toutes les AUTRES zones sans
# capture dédiée (constaté : "New Bark Southwest House HGSS.png" gagnait
# contre le repli Red House 2F pour MAP_NEW_BARK_PLAYER_HOUSE_2F/
# _RIVAL_HOUSE_2F, et contre Player House 1F pour MAP_NEW_BARK_RIVAL_HOUSE_1F
# et plusieurs maisons génériques d'autres villes — testé en régénérant
# et en diffant le registre zone par zone avant ce correctif).
_override_filenames = set(ZONE_SCREENSHOT_OVERRIDES.values())
map_files = [f for f in map_files if f.name not in _override_filenames]

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

# Issue 13 (QA humaine, passe « intérieurs génériques ») : détail des 6
# associations `ZONE_SCREENSHOT_OVERRIDES` définies plus haut (avant
# l'indexation des screenshots, pour pouvoir en exclure ces fichiers du
# matching générique — voir le commentaire à cet endroit). 6 zones
# retombaient toutes sur le même repli générique GENERIC_HOUSE_GROUND alors
# qu'elles devraient être visuellement distinctes — 2 lieux nommés et
# scénaristiquement notables (la maison de M. Pokémon, où l'Œuf Mystère est
# remis ; la maison de l'Homme aux Baies Cocor) et 4 maisons d'habitants
# quelconques (3 à Ville Griotte, 1 à Bourg Geon).
# - MAP_ROUTE_30_MR_POKEMON_HOUSE : vraie capture d'écran trouvée (voir
#   fichier) — pas une capture de la version finale mais d'une version
#   préversion (« prerelease ») de HGSS archivée par Bulbapedia (licence CC
#   BY-NC-SA 2.5 / fair use revendiqué, cohérent avec le seuil déjà accepté
#   ailleurs dans ce projet pour du contenu non commercial) ; texte de
#   dialogue rogné (recadrage à la pièce seule, la boîte de dialogue en bas
#   de l'image d'origine ne fait pas partie du décor).
# - Les 5 autres : aucune capture dédiée trouvée nulle part (recherché :
#   Bulbapedia, StrategyWiki, The Models Resource — qui n'a qu'un modèle 3D
#   d'extérieur sans aucun mobilier, même conclusion que l'investigation
#   « rendu 3D » déjà classée plus haut dans ce fichier) — composées à la
#   place à partir de vraies captures HGSS déjà présentes dans ce dépôt
#   (`public/maps/`) : une capture de « coquille » (murs/sol) différente
#   pour chacune, chacune enrichie d'un meuble découpé dans une AUTRE
#   capture puis recollé (fond quasi-noir de la vignette d'écran DS retiré
#   par seuillage avant collage), pour que chaque pièce ait un agencement de
#   mobilier propre et non un copier-coller 1-pour-1 d'une zone existante.
#   Voir l'entrée d'issue 13 correspondante pour le détail pièce par pièce.

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

# interior_bounds / trim_terrain vivent dans scripts/build/zone_grid.py :
# fit-map-alignment.py doit travailler sur EXACTEMENT la même grille rognée
# que celle écrite ici, sinon le recalage porterait sur une autre grille.

# ── Recalage grille de collision ↔ screenshot ────────────────────────────────
#
# Issue 13 (QA humaine, « les arbres et les obstacles sont mal gérés en
# général »). L'ancienne formule posait la grille sur l'image en supposant
# `scale = screenshot_px / nb_tuiles`, c'est-à-dire « la capture couvre
# exactement la grille, sans marge, coin haut-gauche sur la tuile (0,0) ».
# Les deux moitiés de l'hypothèse sont fausses :
#
#   * les cartes HGSS publiées sont des rendus à caméra oblique — une tuile
#     fait ~16 px de large mais ~12 px de haut (raccourci vertical ≈ 0.75) ;
#     la hauteur d'image ne donne donc AUCUNE information sur le pas vertical ;
#   * elles sont recadrées à la main, avec une marge variable de décor hors
#     carte (le « border block » que le jeu dessine autour de la zone).
#
# La grille était donc étirée pour remplir l'image et dérivait — jusqu'à ~20
# tuiles verticalement sur Route 29 (pas déduit 17.44 px/tuile au lieu de 12).
# Tous les symptômes remontés en QA sont ce seul décalage vu à des endroits
# différents : arbres qu'on traverse, murs invisibles en pleine herbe,
# passages « fermés », PNJ posés dans la canopée.
#
# Historique assumé : trois passes de correction précédentes ont muré à la
# main des centaines de tuiles de terrain (OUTDOOR_TERRAIN_PATCHES) et
# déplacé un objet (OUTDOOR_OBJECT_POSITION_PATCHES) pour faire coller la
# collision à ce que l'image *semblait* montrer — en traitant l'image comme
# la vérité et la ROM comme le bug. C'était l'inverse : la donnée ROM était
# juste depuis le début, seul son placement à l'écran était faux. Ces patches
# sont supprimés (l'un d'eux avait enfermé un joueur dans une poche de 7
# tuiles), avec eux la garde `verify_full_connectivity` qui n'existait que
# pour les rattraper. Le recalage vit maintenant dans
# scripts/build/fit-map-alignment.py → scripts/sources/map-alignment.json.

ALIGNMENT = Path("scripts/sources/map-alignment.json")
_align_file = json.load(open(ALIGNMENT)) if ALIGNMENT.exists() else {"zones": {}}
alignment: dict = _align_file.get("zones", {})
if alignment:
    print(f"{len(alignment)} zones recalées chargées depuis {ALIGNMENT}")
else:
    print(f"ATTENTION : {ALIGNMENT} absent — lancer scripts/build/fit-map-alignment.py")

def get_dimensions(path: Path, tile_w: int, tile_h: int) -> tuple[int, int]:
    if HAS_PIL and path and path.exists():
        img = Image.open(path)
        return img.size  # (width, height)
    return tile_w, tile_h

# ── Construire le registre ────────────────────────────────────────────────────

TILE_UNIT = 32  # 1 unité de grille = 32px en coordonnées monde
DEFAULT_SCALE = 12.0  # px/tile fallback for zones with no screenshot (~médiane observée)

# ── Verdict sur une capture ──────────────────────────────────────────────────
#
# fit-map-alignment.py MESURE (pas, origine, séparabilité) ; c'est ici qu'on
# décide si la capture illustre vraiment la zone. Politique modifiable sans
# relancer les 20 minutes de recalage.
#
# Deux signaux, parce qu'un seul ne suffit pas :
#
#  * le SCORE (séparabilité couleur mur/sol). Élevé = la grille tombe sur des
#    structures réelles. Mais il dépend du contraste de la zone : une arène au
#    sol et aux murs de teintes voisines plafonne bas même parfaitement calée
#    (Violet Gym : 0.47) ;
#  * le PAS trouvé. La caméra HGSS est fixe : ~16 px de large, ~12 de haut.
#    Un recalage qui retombe dessus a trouvé la vraie grille ; un recalage
#    dégénéré (image bien trop petite pour la zone) s'effondre sur des valeurs
#    sans rapport — 6.76, 1.98, 3.68 px/tuile observés. C'est ce second signal
#    qui rattrape les zones peu contrastées sans laisser passer les dégénérées.
TRUST_SCORE = 0.60          # suffit à lui seul, quel que soit le pas
TRUST_SCORE_WITH_PITCH = 0.35  # suffit si le pas est celui de la caméra
PLAUSIBLE_PITCH_X = (15.0, 16.8)
PLAUSIBLE_PITCH_Y = (11.2, 13.0)

# Part de la grille qui doit tomber DANS l'image. Une capture peut être un
# cadrage partiel de la zone (Sprout Tower, Bell Tower, Ilex Forest) — le
# joueur marche alors hors de l'image, dans le noir, sans que rien ne le
# signale. Couverture médiane observée : 0.97 ; à 0.60 on garde les cadrages
# un peu courts (mieux qu'une grille nue) et on écarte les captures qui ne
# montrent qu'un coin de la zone.
MIN_COVERAGE = 0.60

def alignment_trusted(fit: dict) -> bool:
    px, py = fit["pitch_x"], fit["pitch_y"]
    plausible = (
        PLAUSIBLE_PITCH_X[0] <= px <= PLAUSIBLE_PITCH_X[1]
        and PLAUSIBLE_PITCH_Y[0] <= py <= PLAUSIBLE_PITCH_Y[1]
    )
    return fit["score"] >= TRUST_SCORE or (plausible and fit["score"] >= TRUST_SCORE_WITH_PITCH)

def grid_coverage(fit: dict, scr_w: int, scr_h: int, tile_w: int, tile_h: int) -> float:
    """Fraction de l'emprise de la grille qui tombe dans l'image."""
    x0, y0 = fit["origin_x"], fit["origin_y"]
    x1 = x0 + fit["pitch_x"] * tile_w
    y1 = y0 + fit["pitch_y"] * tile_h
    area = (x1 - x0) * (y1 - y0)
    if area <= 0:
        return 0.0
    ox = max(0.0, min(x1, scr_w) - max(x0, 0.0))
    oy = max(0.0, min(y1, scr_h) - max(y0, 0.0))
    return (ox * oy) / area

registry_zones = []
matched_files: dict[str, str] = {}
matched   = 0
unmatched = 0
aligned: list[str]   = []   # recalage mesuré et crédible
untrusted: list[str] = []   # capture rejetée (ne montre pas cette grille)
unfitted: list[str]  = []   # pas encore passée au recalage
stale: list[str]     = []   # recalage périmé (la capture a changé depuis)

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

    # Coordonnées monde du coin supérieur gauche de la zone
    world_origin_x = grid_x * TILE_UNIT
    world_origin_y = grid_y * TILE_UNIT

    # Screenshot
    override_filename = ZONE_SCREENSHOT_OVERRIDES.get(name)
    screenshot_path = (MAPS_DIR / override_filename) if override_filename else None
    if screenshot_path and not screenshot_path.exists():
        screenshot_path = None
    if not screenshot_path:
        screenshot_path = find_screenshot(name, is_outdoor)
    if not screenshot_path:
        # No dedicated capture exists (small single-purpose rooms — random
        # NPC houses, gatehouses — were never individually screenshotted by
        # anyone). HGSS itself reuses one generic tileset for these, so a
        # representative capture of that same generic room is a genuinely
        # more accurate fallback than a blank box, not just a random guess.
        screenshot_path = find_generic_template(name)

    if screenshot_path:
        matched_files[name] = str(screenshot_path.relative_to(MAPS_DIR))
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

    # Placement de la grille sur l'image : `origin` = pixel du coin haut-gauche
    # de la tuile (0,0), `scale` = pas d'une tuile en pixels. Les deux viennent
    # du recalage mesuré (fit-map-alignment.py), jamais d'une déduction à
    # partir des dimensions de l'image.
    fit = alignment.get(name) if screenshot_url else None
    # Le recalage vaut pour UNE image précise : si la capture servie a changé
    # depuis (nouvelle attribution, retouche), l'entrée en cache ne la décrit
    # plus. On la jette plutôt que de poser une grille mesurée sur une autre
    # image — c'est exactement le genre de décalage silencieux qui a coûté
    # trois passes de fausses corrections (issue 13).
    if fit and screenshot_path is not None:
        expected = f"{screenshot_path.name}:{screenshot_path.stat().st_size}"
        if fit.get("key") != expected:
            fit = None
            stale.append(name)
    if not screenshot_url:
        scale_x = scale_y = DEFAULT_SCALE
        origin_px = origin_py = 0.0
    elif fit and alignment_trusted(fit) and grid_coverage(fit, scr_w, scr_h, tile_w, tile_h) >= MIN_COVERAGE:
        scale_x, scale_y = fit["pitch_x"], fit["pitch_y"]
        origin_px, origin_py = fit["origin_x"], fit["origin_y"]
        aligned.append(name)
    elif fit:
        # Soit le recalage n'a rien trouvé de crédible, soit la capture ne
        # couvre qu'une partie de la zone (voir MIN_COVERAGE) : cette capture ne montre
        # pas cette grille (attribuée à la mauvaise zone, template générique
        # réutilisé…). On N'INVENTE PAS un alignement — la zone est servie
        # sans screenshot pour que MapClient bascule sur son CollisionCanvas,
        # laid mais fidèle à la collision par construction. Un joueur qui voit
        # une grille comprend qu'il voit une grille ; un joueur qui voit une
        # jolie carte fausse croit à un bug de collision (tout l'historique
        # de l'issue 13).
        untrusted.append(name)
        screenshot_url = ""
        matched -= 1
        unmatched += 1
        scr_w, scr_h = round(tile_w * DEFAULT_SCALE), round(tile_h * DEFAULT_SCALE)
        scale_x = scale_y = DEFAULT_SCALE
        origin_px = origin_py = 0.0
    else:
        # Pas encore recalée (fit-map-alignment.py pas passé sur cette zone) :
        # on garde l'ancien comportement — carte affichée, alignement déduit
        # des dimensions, donc potentiellement faux. Compté et listé en fin de
        # build pour que ça ne passe pas inaperçu.
        unfitted.append(name)
        scale_x = scr_w / tile_w if tile_w > 0 else 1.0
        scale_y = scr_h / tile_h if tile_h > 0 else 1.0
        origin_px = origin_py = 0.0

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
        # Pas d'une tuile en pixels d'image (pitch), et pixel du coin
        # haut-gauche de la tuile (0,0) — mesurés, pas déduits des
        # dimensions de l'image (voir « Recalage » plus haut).
        "scale_x":        round(scale_x, 4),
        "scale_y":        round(scale_y, 4),
        "origin_px":      round(origin_px, 2),
        "origin_py":      round(origin_py, 2),
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
json.dump(dict(sorted(matched_files.items())), open(MATCHED, "w"), ensure_ascii=False, indent=1)

print()
print(f"Done → {OUT}")
print(f"  {len(registry_zones)} zones")
print(f"  {matched} avec screenshot, {unmatched} sans")
print(f"  {len(aligned)} recalées sur mesure, {len(unfitted)} non recalées, "
      f"{len(untrusted)} captures rejetées")
if unfitted:
    print(f"  ATTENTION — alignement encore déduit des dimensions (donc suspect) pour "
          f"{len(unfitted)} zones ; lancer scripts/build/fit-map-alignment.py")
    print("    " + ", ".join(sorted(unfitted)[:12]) + (" …" if len(unfitted) > 12 else ""))
if stale:
    print(f"  {len(stale)} zone(s) dont le recalage ne correspond plus à la capture servie "
          f"— relancer scripts/build/fit-map-alignment.py : "
          + ", ".join(sorted(stale)[:8]) + (" …" if len(stale) > 8 else ""))
if untrusted:
    print("  Captures rejetées (servies en CollisionCanvas) : "
          + ", ".join(sorted(untrusted)[:12]) + (" …" if len(untrusted) > 12 else ""))
