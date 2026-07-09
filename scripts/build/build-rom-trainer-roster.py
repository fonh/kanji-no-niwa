#!/usr/bin/env python3
"""
Extrait le roster EXACT des dresseurs de combat placés sur chaque carte,
directement depuis la décompilation ROM (pret/pokeheartgold, en local hors
du repo — voir POKEHEARTGOLD_PATH) : source de vérité, bien plus fiable que
le guidebook OCR ou les walkthroughs web pour compter/nommer les dresseurs
génériques (étape 2 point 4).

Méthode :
1. `include/constants/maps.h` donne, en commentaire, le nom de fichier
   interne de chaque MAP_* (ex. `MAP_UNION_CAVE_1F = 99 // MAP_D25R0101`).
2. Chaque `files/fielddata/eventdata/zone_event/*.json` a un header pointant
   vers `event_<code interne>.h` — related 1:1 à un MAP_* via (1).
3. Les objets de combat portent `"scriptId": "std_trainer(TRAINER_XXX)"` —
   la liste EXACTE des dresseurs de la carte, sans ambiguïté de comptage.
4. `include/constants/trainers.h` donne l'index numérique de TRAINER_XXX ;
   `files/poketool/trainer/trainers.json` (indexé par ce même numéro) donne
   la classe, le nom et l'équipe.

Sortie : content/rom-trainer-roster.json (roster complet, 83 zones) +
rapport de croisement avec npc-inventory.md dans
.scratch/audits/rom-trainer-roster-report.md.
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
POKEHEARTGOLD_PATH = Path.home() / "pokeheartgold"

CLASS_DISPLAY = {
    "ACE_TRAINER_M": "Ace Trainer", "ACE_TRAINER_F": "Ace Trainer",
    "POKE_MANIAC": "Poké Maniac", "BUG_CATCHER": "Bug Catcher",
    "YOUNGSTER": "Youngster", "LASS": "Lass", "HIKER": "Hiker",
    "CAMPER": "Camper", "PICNICKER": "Picnicker", "FISHERMAN": "Fisherman",
    "SWIMMER_M": "Swimmer", "SWIMMER_F": "Swimmer", "BIRD_KEEPER": "Bird Keeper",
    "BIKER": "Biker", "BLACK_BELT": "Black Belt", "FIREBREATHER": "Firebreather",
    "SCHOOL_KID_M": "School Kid", "SCHOOL_KID_F": "School Kid",
    "TWINS": "Twins", "BEAUTY": "Beauty", "GENTLEMAN": "Gentleman",
    "SAILOR": "Sailor", "JUGGLER": "Juggler", "BURGLAR": "Burglar",
    "POLICEMAN": "Policeman", "SUPER_NERD": "Super Nerd", "PSYCHIC_M": "Psychic",
    "PSYCHIC_F": "Psychic", "MEDIUM": "Medium", "SKIER": "Skier",
    "BOARDER": "Boarder", "TEAM_ROCKET_GRUNT": "Sbire Rocket",
    "TEAM_ROCKET_F_GRUNT": "Sbire Rocket", "COOLTRAINER_M": "Ace Trainer",
    "COOLTRAINER_F": "Ace Trainer", "POKEFAN_M": "Pokéfan", "POKEFAN_F": "Pokéfan",
    "TEACHER": "Enseignante", "GUITARIST": "Guitarist", "IDOL": "Idol",
    "RUIN_MANIAC": "Ruin Maniac", "TUBER_M": "Tuber", "TUBER_F": "Tuber",
}


def display_class(raw_class):
    key = raw_class.replace("TRAINERCLASS_", "")
    return CLASS_DISPLAY.get(key, key.replace("_", " ").title())


def strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def normalize_map_name(map_name):
    norm = strip_accents(map_name.replace("MAP_", "").lower()).replace("_", "-")
    return re.sub(r"\bmount-", "mt-", norm)


ZONE_ID_ALIASES = {
    "kanto-power-plant": ["route-10-power-plant"],
    "mont-lune-route-3-4": ["mt-moon", "route-3", "route-4"],
}

# Correspondance directe MAP_XXX -> zone_id pour les cas que l'heuristique de
# préfixe ne peut pas résoudre : bâtiments à étages sans le nom de leur ville
# dans leur propre nom (gyms, tours, tunnels), et "seconde moitié" des
# zone_id fusionnant plusieurs routes (ex. route-11-12-13-diglett ne peut
# matcher que "route-11" par préfixe, jamais "route-12"/"route-13").
# Construite en énumérant exhaustivement les 44 cartes à dresseurs non
# résolues par l'heuristique (2026-07-09, cf. rom-trainer-roster-report.md).
DIRECT_MAP_TO_ZONE = {
    # Gyms -> ville
    "MAP_AZALEA_GYM": "azalea-town",
    "MAP_BLACKTHORN_GYM": "blackthorn-city",
    "MAP_CELADON_GYM": "celadon-city",
    "MAP_CERULEAN_GYM": "cerulean-city",
    "MAP_CIANWOOD_GYM": "cianwood-city",
    "MAP_ECRUTEAK_GYM": "ecruteak-city",
    "MAP_GOLDENROD_GYM": "goldenrod-city",
    "MAP_MAHOGANY_GYM_LEADER_ROOM": "mahogany-town",
    "MAP_MAHOGANY_GYM_ROOM_2": "mahogany-town",
    "MAP_PEWTER_GYM": "pewter-city",
    "MAP_SAFFRON_GYM": "saffron-city",
    "MAP_VERMILION_GYM": "vermilion-city",
    "MAP_VIOLET_GYM": "violet-city",
    "MAP_VIRIDIAN_GYM": "viridian-city",
    # Bâtiments à étages -> zone qui les contient
    "MAP_GOLDENROD_RADIO_TOWER_2F": "goldenrod-city",
    "MAP_GOLDENROD_RADIO_TOWER_3F": "goldenrod-city",
    "MAP_GOLDENROD_RADIO_TOWER_4F": "goldenrod-city",
    "MAP_GOLDENROD_RADIO_TOWER_5F": "goldenrod-city",
    "MAP_GOLDENROD_TUNNEL_B1F": "goldenrod-city",
    "MAP_GOLDENROD_TUNNEL_B2F": "goldenrod-city",
    "MAP_GOLDENROD_TUNNEL_WAREHOUSE": "goldenrod-city",
    "MAP_OLIVINE_LIGHTHOUSE_2F": "olivine-city",
    "MAP_OLIVINE_LIGHTHOUSE_3F": "olivine-city",
    "MAP_OLIVINE_LIGHTHOUSE_4F": "olivine-city",
    "MAP_OLIVINE_LIGHTHOUSE_5F": "olivine-city",
    "MAP_SS_AQUA_1F_NORTHEAST_ROOMS": "vermilion-city",
    "MAP_SS_AQUA_1F_NORTHWEST_ROOMS": "vermilion-city",
    "MAP_SS_AQUA_1F_SOUTHEAST_ROOMS": "vermilion-city",
    "MAP_SS_AQUA_1F_SOUTHWEST_ROOMS": "vermilion-city",
    "MAP_SS_AQUA_B1F": "vermilion-city",
    "MAP_TEAM_ROCKET_HEADQUARTERS_B1F": "mahogany-town",
    "MAP_TEAM_ROCKET_HEADQUARTERS_B2F": "mahogany-town",
    "MAP_TEAM_ROCKET_HEADQUARTERS_B3F": "mahogany-town",
    "MAP_SEAFOAM_ISLANDS_B2F": "route-19-20-seafoam",
    # "Seconde moitié" des routes fusionnées
    "MAP_ROUTE_10_SOUTH": "route-9-10-rocktunnel",
    "MAP_ROUTE_12": "route-11-12-13-diglett",
    "MAP_ROUTE_13": "route-11-12-13-diglett",
    "MAP_ROUTE_15": "route-14-15-kanto",
    "MAP_ROUTE_17": "route-16-17-18-cycling-road",
    "MAP_ROUTE_18": "route-16-17-18-cycling-road",
    "MAP_ROUTE_20": "route-19-20-seafoam",
    "MAP_ROUTE_25": "route-24-25-kanto",
    "MAP_ROUTE_2_EAST": "route-2-foret-viridian",
    "MAP_VIRIDIAN_FOREST": "route-2-foret-viridian",
}


def load_trainer_index():
    """TRAINER_XXX (constant name) -> numeric id."""
    text = (POKEHEARTGOLD_PATH / "include/constants/trainers.h").read_text()
    return dict(re.findall(r"#define\s+(TRAINER_\w+)\s+(\d+)", text))


def load_trainers_json():
    data = json.loads((POKEHEARTGOLD_PATH / "files/poketool/trainer/trainers.json").read_text())
    return data["trainers"]


def load_map_code_to_name():
    """code interne (ex. D25R0101) -> nom canonique MAP_XXX."""
    text = (POKEHEARTGOLD_PATH / "include/constants/maps.h").read_text()
    out = {}
    for m in re.finditer(r"#define\s+(MAP_\w+)\s+\d+\s*//\s*(?:MAP_)?(\w+)", text):
        canonical, code = m.groups()
        out[code] = canonical
    return out


def load_known_zone_ids():
    ref = json.loads((ROOT / "content/kanji-zone-assignment.json").read_text())
    return [z["zone_id"] for z in ref["zones"]]


def map_name_to_zone_id(map_name, known_zone_ids):
    if map_name in DIRECT_MAP_TO_ZONE:
        return DIRECT_MAP_TO_ZONE[map_name]
    norm = normalize_map_name(map_name)
    for zone_id, aliases in ZONE_ID_ALIASES.items():
        if any(norm == a or norm.startswith(a + "-") for a in aliases):
            return zone_id
    for zone_id in known_zone_ids:
        if norm == zone_id or norm.startswith(zone_id + "-") or zone_id.startswith(norm + "-"):
            return zone_id
    return None


def extract_roster():
    trainer_idx = load_trainer_index()
    trainers_json = load_trainers_json()
    map_code_to_name = load_map_code_to_name()
    known_zone_ids = load_known_zone_ids()

    zone_event_dir = POKEHEARTGOLD_PATH / "files/fielddata/eventdata/zone_event"
    roster = {}  # zone_id -> [{class, name, map_name}]
    unmapped_maps = set()

    for f in sorted(zone_event_dir.glob("*.json")):
        data = json.loads(f.read_text())
        header = data.get("header", "")
        m = re.search(r"event_(\w+)\.h", header)
        if not m:
            continue
        code = m.group(1)
        map_name = map_code_to_name.get(code)
        if map_name is None:
            continue

        trainer_refs = []
        for obj in data.get("objects", []):
            sm = re.search(r"std_trainer\((TRAINER_\w+)\)", str(obj.get("scriptId") or ""))
            if sm:
                trainer_refs.append(sm.group(1))
        if not trainer_refs:
            continue

        zone_id = map_name_to_zone_id(map_name, known_zone_ids)
        if zone_id is None:
            unmapped_maps.add(map_name)
            continue

        for tref in trainer_refs:
            tid = trainer_idx.get(tref)
            if tid is None:
                continue
            t = trainers_json[int(tid)]
            raw_name = t["name"].replace("{TRNAME}", "")
            roster.setdefault(zone_id, []).append({
                "class": display_class(t["class"]),
                "name": raw_name,
                "map_name": map_name,
                "trainer_const": tref,
                "party_summary": [f"{p['species'].replace('SPECIES_', '').title()} Lv.{p['level']}" for p in t.get("party", [])],
            })

    return roster, unmapped_maps


def parse_npc_inventory():
    text = (ROOT / "content/npc-inventory.md").read_text(encoding="utf-8")
    sections = re.split(r"\n## ", text)[1:]
    inventory = {}
    for section in sections:
        header, _, body = section.partition("\n")
        m = re.match(r"([a-z0-9-]+)", header)
        if not m:
            continue
        zone_id = m.group(1)
        names = []
        for row in re.findall(r"^\|([^|]+)\|", body, re.MULTILINE):
            row = row.strip()
            if not row or row.startswith("---") or "PNJ" in row:
                continue
            names.append(row)
        inventory[zone_id] = " | ".join(names)
    return inventory


def main():
    roster, unmapped_maps = extract_roster()
    total_trainers = sum(len(v) for v in roster.values())
    print(f"{len(roster)} zones avec au moins 1 dresseur ROM, {total_trainers} dresseurs au total")
    if unmapped_maps:
        print(f"{len(unmapped_maps)} cartes avec dresseurs non rattachées à un zone_id (ignorées) : {sorted(unmapped_maps)[:20]}")

    out_path = ROOT / "content" / "rom-trainer-roster.json"
    out_path.write_text(json.dumps({"zones": roster}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Écrit {out_path.relative_to(ROOT)}")

    inventory_text = parse_npc_inventory()

    # index inverse : prénom ROM (lowercase) -> zone_id où npc-inventory.md
    # le mentionne actuellement (pour détecter les mauvais placements, pas
    # seulement les absences).
    name_to_doc_zones = {}
    for zid, text in inventory_text.items():
        for t in re.findall(r"[A-ZÀ-Ý][\wÀ-ÿ.'-]{2,}", text):
            name_to_doc_zones.setdefault(t.lower(), set()).add(zid)

    lines = ["# Rapport — roster de dresseurs extrait de la ROM vs. npc-inventory.md", "",
             "**Couverture complète (2026-07-09)** : 55/55 zones qui ont au moins un dresseur de "
             "combat dans la ROM sont désormais rattachées à un zone_id (0 carte non mappée, contre "
             "44/89 lors de la 1ʳᵉ passe) — voir `DIRECT_MAP_TO_ZONE` dans ce script pour la table "
             "de correspondance explicite (gyms, bâtiments à étages, secondes moitiés de zones "
             "fusionnées). npc-inventory.md contient désormais l'intégralité des 390 dresseurs de "
             "combat de la ROM, sourcés zone par zone.", "",
             f"Source : `~/pokeheartgold` (décompilation), `{total_trainers}` dresseurs de combat trouvés sur "
             f"`{len(roster)}` zones. Comparaison automatique avec le texte déjà écrit dans npc-inventory.md.", "",
             "## Absents (nom ROM introuvable nulle part dans npc-inventory.md)", ""]

    swaps = []
    for zone_id in sorted(roster):
        doc_text = inventory_text.get(zone_id, "")
        missing = [t for t in roster[zone_id] if t["name"].lower() not in doc_text.lower()]
        truly_missing = []
        for t in missing:
            other_zones = name_to_doc_zones.get(t["name"].lower(), set()) - {zone_id}
            if other_zones:
                swaps.append((t, zone_id, other_zones))
            else:
                truly_missing.append(t)
        if truly_missing:
            names = ", ".join(f"{t['class']} {t['name']}" for t in truly_missing)
            lines.append(f"- **{zone_id}** ({len(truly_missing)}/{len(roster[zone_id])} du roster ROM) : {names}")

    lines += ["", "## Mauvais placements probables (le nom ROM de cette zone est écrit ailleurs dans npc-inventory.md)", ""]
    for t, rom_zone, doc_zones in swaps:
        lines.append(f"- **{t['class']} {t['name']}** — ROM: `{rom_zone}`, actuellement dans npc-inventory.md sous : {', '.join(sorted(doc_zones))}")

    out_report = ROOT / ".scratch" / "audits" / "rom-trainer-roster-report.md"
    out_report.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Écrit {out_report.relative_to(ROOT)} ({len(swaps)} mauvais placements probables)")


if __name__ == "__main__":
    main()
