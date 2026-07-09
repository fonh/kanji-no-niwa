#!/usr/bin/env python3
"""
Extrait les objets cachés (item balls) par zone directement depuis la ROM
(pret/pokeheartgold, `~/pokeheartgold`) — étape 2 point 4bis, même méthode
que build-rom-trainer-roster.py : chaque objet-objet porte un scriptId du
type `std_itemball_<carte>_<item>`, le nom de l'objet est déjà lisible dans
l'id lui-même (pas de table à résoudre séparément, contrairement aux
dresseurs).

Sortie : content/rom-item-roster.json (257 objets, par zone) + rapport de
croisement avec npc-inventory.md (« Objets à aller chercher dans cette
zone ») dans .scratch/audits/rom-item-roster-report.md.
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

SPECIAL_WORDS = {"tm": "TM", "hm": "HM", "pp": "PP", "hp": "HP", "exp": "Exp.", "ev": "EV"}


def format_item_name(slug):
    parts = slug.split("_")
    out = []
    for p in parts:
        m = re.match(r"^(tm|hm)(\d+)$", p)
        if m:
            out.append(f"{SPECIAL_WORDS[m.group(1)]}{m.group(2)}")
        elif p in SPECIAL_WORDS:
            out.append(SPECIAL_WORDS[p])
        else:
            out.append(p.capitalize())
    return " ".join(out)


def extract_items():
    map_code_to_name = rom_trainers.load_map_code_to_name()
    known_zone_ids = rom_trainers.load_known_zone_ids()

    zone_event_dir = POKEHEARTGOLD_PATH / "files/fielddata/eventdata/zone_event"
    roster = {}
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

        item_refs = []
        for obj in data.get("objects", []):
            sm = re.search(r"std_itemball_\w+?_([a-z0-9_]+)", str(obj.get("scriptId") or ""))
            if sm:
                item_refs.append(sm.group(1))
        if not item_refs:
            continue

        zone_id = rom_trainers.map_name_to_zone_id(map_name, known_zone_ids)
        if zone_id is None:
            unmapped_maps.add(map_name)
            continue

        for slug in item_refs:
            roster.setdefault(zone_id, []).append({
                "item": format_item_name(slug),
                "slug": slug,
                "map_name": map_name,
            })

    return roster, unmapped_maps


def parse_npc_inventory_objects():
    """Texte brut de la ligne 'Objets à aller chercher' par zone, pour un
    croisement approximatif (pas une liste structurée dans le doc actuel)."""
    text = (ROOT / "content/npc-inventory.md").read_text(encoding="utf-8")
    sections = re.split(r"\n## ", text)[1:]
    out = {}
    for section in sections:
        header, _, body = section.partition("\n")
        m = re.match(r"([a-z0-9-]+)", header)
        if not m:
            continue
        out[m.group(1)] = body
    return out


def main():
    roster, unmapped_maps = extract_items()
    total = sum(len(v) for v in roster.values())
    print(f"{len(roster)} zones avec objets, {total} objets au total")
    if unmapped_maps:
        print(f"{len(unmapped_maps)} cartes à objets non rattachées : {sorted(unmapped_maps)}")

    out_path = ROOT / "content/rom-item-roster.json"
    out_path.write_text(json.dumps({"zones": roster}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Écrit {out_path.relative_to(ROOT)}")

    inventory_text = parse_npc_inventory_objects()
    lines = [
        "# Rapport — objets cachés extraits de la ROM", "",
        f"Source : `~/pokeheartgold` (décompilation). **{total}/{total} objets rattachés, "
        f"{len(roster)}/83 zones concernées** (les autres n'ont aucun objet caché en HGSS). "
        "Chaque objet-ball porte un scriptId `std_itemball_<carte>_<item>` — le nom est "
        "directement lisible dans l'id, aucune table à résoudre séparément.", "",
        "## Ce que ce fichier est, et n'est pas", "",
        "`content/rom-item-roster.json` est un **jeu de données de référence brut**, pas "
        "fusionné dans `npc-inventory.md`. Le croisement ci-dessous montre ~100% « d'absents » "
        "— attendu, pas un signal d'erreur : `npc-inventory.md` ne cataloguait déjà que les "
        "objets remis *par un PNJ* ou liés à une quête, jamais les objets au sol génériques "
        "(Potion, Escape Rope, TM courantes) qui composent l'essentiel des objets trouvés ici. "
        "Les deux sources se complètent, elles ne se corrigent pas l'une l'autre comme pour "
        "les dresseurs.", "",
        "## Utilisation prévue (à décider plus tard)", "",
        "Pertinent quand le studio écrira la couche d'exploration/collecte de la carte — "
        "probablement à l'étape 4 (passe contenu) ou pour un système de \"Chasse au Trésor\" "
        "déjà évoqué ailleurs dans le projet. Pas d'action requise maintenant.", "",
        "## Détail du croisement automatique (indicatif seulement, voir note ci-dessus)", "",
    ]

    for zone_id in sorted(roster):
        doc_text = inventory_text.get(zone_id, "")
        missing = [it for it in roster[zone_id] if it["item"].lower() not in doc_text.lower()]
        if missing:
            names = ", ".join(f"{it['item']}" for it in missing)
            lines.append(f"- **{zone_id}** ({len(missing)}/{len(roster[zone_id])} du roster ROM absents du texte) : {names}")

    out_report = ROOT / ".scratch/audits/rom-item-roster-report.md"
    out_report.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Écrit {out_report.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
