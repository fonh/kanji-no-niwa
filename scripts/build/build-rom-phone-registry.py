#!/usr/bin/env python3
"""
Remplace content/phone-registry.json (sourcé Serebii, vérifié à la main) par
la donnée EXACTE de la ROM (pret/pokeheartgold, `~/pokeheartgold`).

Source : `files/tel/pmtel_book.json` (déjà décodé en JSON dans le dépôt de
décompilation) — la table binaire `tel/pmtel_book.dat` du jeu, 75 entrées,
un par contact enregistrable au Pokégear. Chaque entrée donne : `mapId`
(carte exacte, résout les ~13 écarts de zone jamais tranchés dans la passe
Serebii), `trainerId` (résolu via trainers.json quand ce n'est pas un PNJ
scénaristique), `gift` (objet remis), `rematchWeekday`/`rematchTimeOfDay`
(condition exacte du rendez-vous).

Réutilise map_name_to_zone_id / DIRECT_MAP_TO_ZONE de
build-rom-trainer-roster.py -- une seule source de vérité pour le mapping
MAP_XXX -> zone_id.
"""
import importlib.util
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
POKEHEARTGOLD_PATH = Path.home() / "pokeheartgold"

spec = importlib.util.spec_from_file_location("rom_trainers", Path(__file__).parent / "build-rom-trainer-roster.py")
rom_trainers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rom_trainers)


CONTACT_NAME_OVERRIDE = {
    "PHONE_CONTACT_DAY_C_MAN": "Day Care Man",
    "PHONE_CONTACT_DAY_C_LADY": "Day Care Lady",
}


def format_contact_name(contact_id):
    """PHONE_CONTACT_PROF__ELM -> "Prof. Elm" ; PHONE_CONTACT_MOTHER -> "Mother"."""
    if contact_id in CONTACT_NAME_OVERRIDE:
        return CONTACT_NAME_OVERRIDE[contact_id]
    slug = contact_id.replace("PHONE_CONTACT_", "")
    slug = slug.replace("__", " ").replace("_AND_", " & ").replace("_", " ")
    words = []
    for w in slug.split(" "):
        if w == "PROF":
            words.append("Prof.")
        elif w == "LT":
            words.append("Lt.")
        elif w == "&":
            words.append("&")
        else:
            words.append(w.capitalize())
    return " ".join(words)


def format_item(item_const):
    if item_const == "ITEM_NONE":
        return None
    return item_const.replace("ITEM_", "").replace("_", " ").title()


def format_day(day_const):
    if day_const.endswith("_MAX"):
        return None
    return day_const.replace("RTC_WEEK_", "").capitalize()


TIME_LABELS = {"MORN": "Morning", "DAY": "Day", "NITE": "Night"}


def format_time(time_const):
    if time_const.endswith("_MAX"):
        return None
    key = time_const.replace("TIMEOFDAY_WILD_", "")
    return TIME_LABELS.get(key, key.capitalize())


def main():
    known_zone_ids = rom_trainers.load_known_zone_ids()
    trainer_idx = rom_trainers.load_trainer_index()
    trainers_json = rom_trainers.load_trainers_json()

    data = json.loads((POKEHEARTGOLD_PATH / "files/tel/pmtel_book.json").read_text())
    entries = data["pmtel_book"]
    print(f"{len(entries)} contacts dans pmtel_book.json")

    out_entries = []
    unmapped_maps = set()
    for e in entries:
        zone_id = rom_trainers.map_name_to_zone_id(e["mapId"], known_zone_ids)
        if zone_id is None:
            unmapped_maps.add(e["mapId"])

        if e["trainerId"] != "TRAINER_NONE":
            tid = trainer_idx.get(e["trainerId"])
            t = trainers_json[int(tid)] if tid is not None else None
            name = f"{rom_trainers.display_class(t['class'])} {t['name'].replace('{TRNAME}', '')}" if t else e["trainerId"]
            category = "gym_leader" if "LEADER" in e["trainerId"] else "generic"
        else:
            name = format_contact_name(e["id"])
            category = "story"

        out_entries.append({
            "name": name,
            "category": category,
            "zone_id": zone_id,
            "map_name": e["mapId"],
            "gift": format_item(e["gift"]),
            "rematch_day": format_day(e["rematchWeekday"]),
            "rematch_time": format_time(e["rematchTimeOfDay"]),
            "phone_contact_id": e["id"],
        })

    if unmapped_maps:
        print(f"Cartes non rattachées ({len(unmapped_maps)}) : {sorted(unmapped_maps)}")

    out = {
        "source": "~/pokeheartgold files/tel/pmtel_book.json (décompilation ROM, table exacte)",
        "total": len(out_entries),
        "entries": out_entries,
    }
    out_path = ROOT / "content/phone-registry.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Écrit {out_path.relative_to(ROOT)} ({len(out_entries)} contacts)")

    by_cat = {}
    for e in out_entries:
        by_cat.setdefault(e["category"], 0)
        by_cat[e["category"]] += 1
    print("Répartition :", by_cat)


if __name__ == "__main__":
    main()
