#!/usr/bin/env python3
"""
Construit content/phone-registry.json — étape 2 point 4 de la roadmap
pré-code : "les donneurs de numéro de téléphone (registre fermé)".

Source : dépouillement Serebii "PokéGear Phonecalls"
(https://www.serebii.net/heartgoldsoulsilver/pokegearphone.shtml),
vérifié par un second fetch confirmant le total de lignes (~72-74) et la
dernière ligne (Reese) — 2026-07-09. C'est le registre fermé au sens du PRD
(`user_map_state.registered_trainers[]`) : liste finie héritée du jeu
d'origine, pas une liste à inventer.

category: "story" (mentor/famille/PNJ scénaristique), "gym_leader" (16
champions, roaming post-Hall of Fame), "generic" (dresseur de route "After
Defeating" — le vrai "registre fermé" au sens strict de la roadmap).

Croise chaque entrée avec content/npc-inventory.md (déjà sourcé du guidebook
Prima) pour rattacher le contact téléphonique au PNJ déjà recensé dans sa
zone — deux sources indépendantes du même jeu, un nom non retrouvé ou
retrouvé dans une zone différente est signalé plutôt que corrigé
silencieusement.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

ENTRIES = [
    # --- story / mentors (7) ---
    dict(name="Baoba", category="story", location="Route 39", condition="Story Progression", note="Calls whenever Safari Zone enhancements made"),
    dict(name="Bill", category="story", location="Goldenrod City (Bill's Sister)", condition=None, note="Check box space"),
    dict(name="Day Care Lady", category="story", location="Route 34 Day Care", condition=None, note="Check Pokémon level increases"),
    dict(name="Day Care Man", category="story", location="Route 34 Day Care", condition=None, note="Check Pokémon compatibility/Egg"),
    dict(name="Ethan", category="story", location="Route 34 Day Care", condition="If female protagonist", note="Pokémon gestures"),
    dict(name="Lyra", category="story", location="Route 34 Day Care", condition="If male protagonist", note="Pokémon gestures"),
    dict(name="Mom", category="story", location="New Bark Town (Your House)", condition=None, note="Check savings/item purchases"),
    dict(name="Prof. Elm", category="story", location="New Bark Town Laboratory", condition=None, note="Story progression"),
    dict(name="Prof. Oak", category="story", location="Route 30 (Mr. Pokémon's House)", condition=None, note="Check Pokédex/Story"),
    dict(name="Kurt", category="story", location="Azalea Town (Kurt's House)", condition=None, note="Check Poké Ball/Apricorn status"),
    dict(name="Buena", category="story", location="Goldenrod Radio Tower", condition="After 30 Password Points", note="Tips and hints"),

    # --- gym leaders / roaming champions (16) ---
    dict(name="Blaine", category="gym_leader", location="Cinnabar Island", condition="Tuesday 00:00-23:59", note="Tuesday Afternoon rematch"),
    dict(name="Blue", category="gym_leader", location="Pallet Town", condition="Any Day 15:00-16:00 after massage", note="Sunday Afternoon rematch"),
    dict(name="Brock", category="gym_leader", location="Diglett's Cave", condition="Any Day 12:00-15:00", note="Saturday Night rematch"),
    dict(name="Bugsy", category="gym_leader", location="Viridian Forest", condition="Thursday 00:00-23:59", note="Thursday Afternoon rematch"),
    dict(name="Chuck", category="gym_leader", location="Cianwood City", condition="Any Day 00:00-23:59", note="Wednesday Night rematch"),
    dict(name="Clair", category="gym_leader", location="Dragon's Den", condition="Any Day 06:00-10:00", note="Friday Night rematch"),
    dict(name="Erika", category="gym_leader", location="Celadon City", condition="Sat/Sun 15:00-17:00", note="Sunday Morning rematch"),
    dict(name="Falkner", category="gym_leader", location="Celadon Dept. Store 5F", condition="Monday 00:00-23:59", note="Saturday Morning rematch"),
    dict(name="Janine", category="gym_leader", location="Reception Gate", condition="Any Day 16:00-18:00", note="Monday Afternoon rematch"),
    dict(name="Jasmine", category="gym_leader", location="Olivine City Restaurant", condition="Any Day 13:00-14:00", note="Wednesday Afternoon rematch"),
    dict(name="Lt. Surge", category="gym_leader", location="Route 10", condition="Any Day 09:00-12:00 post-Zapdos", note="Friday Morning rematch"),
    dict(name="Misty", category="gym_leader", location="Route 25", condition="Any Day 16:00-18:00 post-Suicune", note="Wednesday Morning rematch"),
    dict(name="Morty", category="gym_leader", location="Bell Tower, Ecruteak", condition="Mon/Tue 00:00-23:59", note="Tuesday Night rematch"),
    dict(name="Pryce", category="gym_leader", location="Lake of Rage", condition="Any Day 06:00-10:00", note="Monday Morning rematch"),
    dict(name="Sabrina", category="gym_leader", location="Olivine Harbor", condition="Friday 00:00-23:59", note="Saturday Afternoon rematch"),
    dict(name="Whitney", category="gym_leader", location="Goldenrod Dept. Store 6F", condition="Any Day 12:00-16:00", note="Saturday Afternoon rematch"),

    # --- generic route trainers, "After Defeating" (47) — le vrai registre
    # fermé au sens strict de la roadmap.
    dict(name="Jose", category="generic", location="Route 27", condition="After Defeating", note="Saturday Night - Star Piece"),
    dict(name="Erin", category="generic", location="Route 46", condition="After Defeating", note="Saturday Night - Calcium"),
    dict(name="Alfred", category="generic", location="Shining Lighthouse", condition="After Defeating", note="Tuesday Afternoon - Calcium"),
    dict(name="Liz", category="generic", location="Route 32", condition="After Defeating", note="Thursday Afternoon - Gossip"),
    dict(name="Kay & Tia", category="generic", location="Route 15", condition="After Defeating", note="Saturday Night - Oval Stone"),
    dict(name="Rob", category="generic", location="Route 2", condition="After Defeating", note="Friday Morning - Berry"),
    dict(name="Josh", category="generic", location="Route 14", condition="After Defeating", note="Tuesday Night"),
    dict(name="Tim & Sue", category="generic", location="Route 13", condition="After Defeating", note="Friday Afternoon"),
    dict(name="Billy", category="generic", location="Route 15", condition="After Defeating", note="Friday Night - Gym Leader info"),
    dict(name="Hillary", category="generic", location="Route 15", condition="After Defeating", note="Thursday Night"),
    dict(name="Chad", category="generic", location="Route 38", condition="After Defeating", note="Friday Morning - Professor Oak trivia"),
    dict(name="Huey", category="generic", location="Shining Lighthouse", condition="After Defeating", note="Wednesday Night - Protein"),
    dict(name="Wade", category="generic", location="Route 31", condition="After Defeating", note="Tuesday Night - Berry"),
    dict(name="Joey", category="generic", location="Route 30", condition="After Defeating", note="Monday Afternoon - HP Up"),
    dict(name="Jack", category="generic", location="National Park", condition="After Defeating", note="Monday Morning - Battle Techniques"),
    dict(name="Gaven", category="generic", location="Route 26", condition="After Defeating", note="Thursday Morning"),
    dict(name="Ernest", category="generic", location="Route 17", condition="After Defeating", note="Sunday Afternoon"),
    dict(name="Ian", category="generic", location="Route 34", condition="After Defeating", note="Saturday Morning - Berry"),
    dict(name="Kenji", category="generic", location="Route 45", condition="After Defeating", note="Random - PP Up"),
    dict(name="Tanner", category="generic", location="Route 13", condition="After Defeating", note="Monday Night"),
    dict(name="Parry", category="generic", location="Route 45", condition="After Defeating", note="Friday Afternoon - Iron"),
    dict(name="Tiffany", category="generic", location="Route 43", condition="After Defeating", note="Tuesday Afternoon - Pokédoll"),
    dict(name="Anthony", category="generic", location="Route 33", condition="After Defeating", note="Friday Night"),
    dict(name="Walt", category="generic", location="Route 35", condition="After Defeating", note="Monday Afternoon"),
    dict(name="Aiden", category="generic", location="Route 17", condition="After Defeating", note="Monday Morning"),
    dict(name="Kyle", category="generic", location="Route 12", condition="After Defeating", note="Wednesday Afternoon"),
    dict(name="Reena", category="generic", location="Route 27", condition="After Defeating", note="Sunday Morning"),
    dict(name="Kenny", category="generic", location="Route 13", condition="After Defeating", note="Saturday Afternoon"),
    dict(name="Wilton", category="generic", location="Route 44", condition="After Defeating", note="Thursday Morning - Poké Balls"),
    dict(name="Jamie", category="generic", location="Route 26", condition="After Defeating", note="Friday Night"),
    dict(name="Torin", category="generic", location="Route 14", condition="After Defeating", note="Wednesday Night"),
    dict(name="Irwin", category="generic", location="Route 35", condition="After Defeating", note="Discussions"),
    dict(name="Kyler", category="generic", location="Route 12", condition="After Defeating", note="Thursday Afternoon"),
    dict(name="Brent", category="generic", location="Route 43", condition="After Defeating", note="Monday Morning - Bill trivia"),
    dict(name="Alan", category="generic", location="Route 36", condition="After Defeating", note="Wednesday - Fire Stone"),
    dict(name="Derek", category="generic", location="Route 39", condition="After Defeating", note="Nugget"),
    dict(name="Gina", category="generic", location="Route 34", condition="After Defeating", note="Sunday Afternoon - Leaf Stone"),
    dict(name="Doug", category="generic", location="Route 2", condition="After Defeating", note="Wednesday Morning - Berry"),
    dict(name="Tully", category="generic", location="Route 42", condition="After Defeating", note="Sunday Afternoon - Water Stone"),
    dict(name="Beverly", category="generic", location="National Park", condition="After Defeating", note="Nugget"),
    dict(name="Vance", category="generic", location="Route 44", condition="After Defeating", note="Wednesday Night - Carbos"),
    dict(name="Ralph", category="generic", location="Route 32", condition="After Defeating", note="Wednesday Morning"),
    dict(name="Krise", category="generic", location="National Park", condition="After Defeating", note="Sunday Morning"),
    dict(name="Todd", category="generic", location="Route 34", condition="After Defeating", note="Saturday Morning"),
    dict(name="Arnie", category="generic", location="Route 35", condition="After Defeating", note="Tuesday Morning"),
    dict(name="Dana", category="generic", location="Route 38", condition="After Defeating", note="Thursday Night - Thunderstone"),
    dict(name="Reese", category="generic", location="Route 17", condition="After Defeating", note="Tuesday Afternoon"),
]

LOCATION_TO_ZONE = {
    "Route 39": "route-39",
    "Goldenrod City (Bill's Sister)": "goldenrod-city",
    "Route 34 Day Care": "route-34",
    "New Bark Town (Your House)": "new-bark-town",
    "New Bark Town Laboratory": "new-bark-town",
    "Route 30 (Mr. Pokémon's House)": "route-30",
    "Route 30": "route-30",
    "Azalea Town (Kurt's House)": "azalea-town",
    "Goldenrod Radio Tower": "goldenrod-city",
    "Cinnabar Island": "cinnabar-island",
    "Pallet Town": "pallet-town",
    "Diglett's Cave": "route-11-12-13-diglett",
    "Viridian Forest": "route-2-foret-viridian",
    "Cianwood City": "cianwood-city",
    "Dragon's Den": "dragons-den",
    "Celadon City": "celadon-city",
    "Celadon Dept. Store 5F": "celadon-city",
    # Le "Pokémon League Reception Gate" (Route 27 -> Victory Road) partage
    # le thème musical "Route 26" avec les Routes 26-27 (pas celui de
    # Victory Road) d'après Bulbapedia -- rattaché à route-27, la dernière
    # zone de route avant indigo-plateau-antichambre (Victory Road).
    "Reception Gate": "route-27",
    "Olivine City Restaurant": "olivine-city",
    "Route 10": "route-9-10-rocktunnel",
    "Route 25": "route-24-25-kanto",
    "Bell Tower, Ecruteak": "ecruteak-city",
    "Lake of Rage": "lake-of-rage",
    "Olivine Harbor": "olivine-city",
    "Goldenrod Dept. Store 6F": "goldenrod-city",
    "Route 27": "route-27",
    "Route 46": "route-46",
    "Shining Lighthouse": "olivine-city",
    "Route 32": "route-32",
    "Route 15": "route-14-15-kanto",
    "Route 2": "route-2-foret-viridian",
    "Route 14": "route-14-15-kanto",
    "Route 13": "route-11-12-13-diglett",
    "Route 38": "route-38",
    "Route 31": "route-31",
    "National Park": "national-park",
    "Route 26": "route-26",
    "Route 17": "route-16-17-18-cycling-road",
    "Route 34": "route-34",
    "Route 45": "route-45",
    "Route 43": "route-43",
    "Route 33": "route-33",
    "Route 35": "route-35",
    "Route 12": "route-11-12-13-diglett",
    "Route 44": "route-44",
    "Route 36": "route-36",
    "Route 42": "route-42",
}

# Personnages de la catégorie "story" : le projet utilise un nom français
# ou bilingue dans npc-inventory.md (dépouillement guidebook), différent du
# nom anglais de Serebii -- aliasing explicite plutôt que du fuzzy matching.
NAME_ALIASES = {
    "Prof. Elm": "Professeur Elm",
    "Prof. Oak": "Pr. Chen/Oak",
}

# Gym leaders : jamais une ligne de PNJ à part entière dans npc-inventory.md
# -- seuls leurs 門弟 (gardiens) et la ligne de récompense les mentionnent en
# passant. Absence de match structurelle et attendue, pas un gap de contenu.
GYM_LEADERS = {
    "Blaine", "Blue", "Brock", "Bugsy", "Chuck", "Clair", "Erika", "Falkner",
    "Janine", "Jasmine", "Lt. Surge", "Misty", "Morty", "Pryce", "Sabrina", "Whitney",
}


def parse_npc_inventory():
    """{zone_id: [(pnj_name, role_origin), ...]} depuis npc-inventory.md."""
    text = (ROOT / "content" / "npc-inventory.md").read_text(encoding="utf-8")
    sections = re.split(r"\n## ", text)[1:]
    inventory = {}
    for section in sections:
        header, _, body = section.partition("\n")
        m = re.match(r"([a-z0-9-]+)", header)
        if not m:
            continue
        zone_id = m.group(1)
        rows = re.findall(r"^\|([^|]+)\|([^|]+)\|[^|]*\|[^|]*\|$", body, re.MULTILINE)
        entries = []
        for name, role in rows:
            name = name.strip()
            if not name or name.startswith("---") or "PNJ / rôle" in name:
                continue
            entries.append((name, role.strip()))
        if entries:
            inventory[zone_id] = entries
    return inventory


def find_match(name, zone_id, inventory):
    """Cherche `name` (ex. "Wade") comme sous-chaîne d'un nom de PNJ dans
    `zone_id`. Si absent de la zone attendue, cherche dans tout le
    registre (source Serebii et guidebook peuvent situer un dresseur sur
    des routes adjacentes différentes) et signale l'écart de zone."""
    name = NAME_ALIASES.get(name, name)
    zone_entries = inventory.get(zone_id, [])
    for pnj_name, role in zone_entries:
        if name.lower() in pnj_name.lower():
            return {"matched_name": pnj_name, "matched_zone": zone_id, "zone_mismatch": False}
    for other_zone, entries in inventory.items():
        if other_zone == zone_id:
            continue
        for pnj_name, role in entries:
            if name.lower() in pnj_name.lower():
                return {"matched_name": pnj_name, "matched_zone": other_zone, "zone_mismatch": True}
    return None


def main():
    inventory = parse_npc_inventory()
    print(f"{sum(len(v) for v in inventory.values())} PNJ chargés depuis npc-inventory.md")

    out_entries = []
    unmatched_generic = []
    unmatched_expected = []  # gym leaders + Day Care : absence structurelle, pas un gap
    zone_mismatches = []
    unmapped_locations = []

    for e in ENTRIES:
        is_daycare = "Day Care" in e["location"]
        zone_id = LOCATION_TO_ZONE.get(e["location"])
        if zone_id is None and not is_daycare:
            unmapped_locations.append(e)
        match = find_match(e["name"], zone_id, inventory) if zone_id else None
        if match is None:
            if e["name"] in GYM_LEADERS or is_daycare:
                unmatched_expected.append(e["name"])
            else:
                unmatched_generic.append(e["name"])
        elif match["zone_mismatch"]:
            zone_mismatches.append((e["name"], zone_id, match["matched_zone"]))

        out_entries.append({
            "name": e["name"],
            "category": e["category"],
            "zone_id": zone_id,
            "source_location": e["location"],
            "condition": e["condition"],
            "note": e["note"],
            "matched_npc_inventory": match["matched_name"] if match else None,
            "matched_zone": match["matched_zone"] if match else None,
            "in_scope": not is_daycare,
        })

    out = {
        "source": "https://www.serebii.net/heartgoldsoulsilver/pokegearphone.shtml",
        "total": len(out_entries),
        "entries": out_entries,
    }
    out_path = ROOT / "content" / "phone-registry.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Écrit {out_path.relative_to(ROOT)} ({len(out_entries)} contacts)")

    print(f"\nAbsence attendue, gym leaders/Day Care ({len(unmatched_expected)}): {unmatched_expected}")
    print(f"\n⚠️  Non retrouvés dans npc-inventory.md, vrais écarts ({len(unmatched_generic)}): {unmatched_generic}")
    print(f"\nÉcarts de zone ({len(zone_mismatches)}):")
    for name, expected, found in zone_mismatches:
        print(f"  {name}: attendu {expected}, trouvé dans {found}")
    if unmapped_locations:
        print(f"\nLieux non mappés à un zone_id ({len(unmapped_locations)}): {[e['location'] for e in unmapped_locations]}")


if __name__ == "__main__":
    main()
