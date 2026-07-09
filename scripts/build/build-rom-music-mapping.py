#!/usr/bin/env python3
"""
Corrige content/zone-registry-names.json (champ music_track) avec la donnée
EXACTE de la ROM, plutôt que l'inférence Bulbapedia de la 1ère passe.

Source : `src/data/map_headers.h` (`~/pokeheartgold`, décompilation) — chaque
MAP_XXX a un `dayMusicId`/`nightMusicId` (constante SEQ_GS_XXX) qui est
LA vérité terrain HGSS. Confirmé identique jour/nuit sur les 540 cartes
(pas de variante nocturne à gérer).

Méthode : regrouper les zone_id du projet par SEQ_ constant partagée (ça
remplace entièrement les regroupements de thème déduits du web), puis
étiqueter chaque groupe avec le nom déjà connu (jp/en) d'une zone du groupe
qui en avait un depuis la passe Bulbapedia (content/zone-registry-names.json)
— pas de재-traduction, juste un étiquetage cohérent à partir de ce qu'on a
déjà vérifié.

Réutilise DIRECT_MAP_TO_ZONE et la logique de correspondance zone_id de
build-rom-trainer-roster.py (import direct, une seule source de vérité pour
le mapping MAP_XXX -> zone_id).
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


def parse_map_headers():
    """MAP_XXX -> SEQ_GS_XXX (dayMusicId, identique à nightMusicId partout)."""
    text = (POKEHEARTGOLD_PATH / "src/data/map_headers.h").read_text()
    blocks = re.findall(r"\[(MAP_\w+)\] = \{(.*?)\n\s+\},", text, re.DOTALL)
    out = {}
    for name, body in blocks:
        m = re.search(r"\.dayMusicId = (\w+)", body)
        if m:
            out[name] = m.group(1)
    return out


def main():
    known_zone_ids = rom_trainers.load_known_zone_ids()
    map_to_music = parse_map_headers()

    zone_to_maps = {}
    for map_name, seq in map_to_music.items():
        zid = rom_trainers.map_name_to_zone_id(map_name, known_zone_ids)
        if zid is None:
            continue
        zone_to_maps.setdefault(zid, []).append((map_name, seq))

    # Certains zone_id fusionnent plusieurs cartes ROM qui n'ont pas toujours
    # exactement la même piste. Règles de départage, dans l'ordre :
    # 1. Écarter les thèmes universels (gym/Pokémon Center) s'il reste une
    #    alternative -- jamais l'identité propre d'une zone.
    # 2. Préférer la carte la plus "primaire" (nom normalisé le plus proche
    #    du zone_id lui-même, ex. MAP_VERMILION pour vermilion-city) à toute
    #    carte rattachée via DIRECT_MAP_TO_ZONE (bâtiment intérieur -- Gym,
    #    SS Aqua, Tour Radio... jamais l'identité de la ville qui les contient,
    #    même quand elles comptent plus de cartes qu'elle, ex. les 5 salles
    #    du SS Aqua ne doivent pas l'emporter sur Vermilion City elle-même).
    # 3. À égalité de spécificité, majorité (nombre de cartes contributrices).
    conflicts = []
    zone_seq = {}
    for zid, pairs in zone_to_maps.items():
        candidates = [(m, s) for m, s in pairs if s not in rom_trainers.GENERIC_MUSIC_SEQ]
        if not candidates:
            candidates = pairs

        def specificity(item):
            map_name, _ = item
            if map_name in rom_trainers.DIRECT_MAP_TO_ZONE:
                return (1, 0)
            return (0, len(rom_trainers.normalize_map_name(map_name)))

        best_score = min(specificity(c) for c in candidates)
        best = [c for c in candidates if specificity(c) == best_score]
        seq_counts = {}
        for _, s in best:
            seq_counts[s] = seq_counts.get(s, 0) + 1
        chosen = max(seq_counts.items(), key=lambda kv: kv[1])[0]

        if len({s for _, s in candidates}) > 1:
            conflicts.append((zid, pairs, chosen))
        zone_seq[zid] = chosen

    # Départages manuels : la règle générique (ville > bâtiment intérieur)
    # se trompe quand le "bâtiment" contributeur est en fait le vrai contenu
    # majoritaire d'un donjon multi-étages, ou quand une carte legacy/inutilisée
    # (jamais un vrai lieu visitable) pollue le choix automatique. Revu à la
    # main sur le détail complet de chaque conflit (2026-07-09).
    MANUAL_OVERRIDE = {
        # Victory Road (3 étages réels) doit l'emporter sur MAP_INDIGO_PLATEAU,
        # une entrée top-level legacy/non utilisée qui partage par coïncidence
        # le thème de la Ligue (CHAMPROAD) sans être un vrai lieu jouable.
        "indigo-plateau-antichambre": "SEQ_GS_D_CHAMPROAD",
        # Forêt Viridian est le vrai contenu narratif de cette zone (voir
        # guidebook-adapted.md), pas le fragment nu de Route 2 -- la règle de
        # spécificité générique favorise à tort la carte au nom le plus court.
        "route-2-foret-viridian": "SEQ_GS_D_TOKIWANOMORI3",
        # Confirmé par ailleurs (vérification croisée 2026-07-09, deux sources
        # web indépendantes) : Mont Lune réutilise le thème Union Cave en HGSS.
        "mont-lune-route-3-4": "SEQ_GS_D_CHIKATSUURO",
        # Rock Tunnel / Grotte Diglett sont le vrai contenu de ces deux zones
        # fusionnées (littéralement dans leur nom de zone_id), la règle
        # générique favorise à tort le fragment de route adjacent.
        "route-9-10-rocktunnel": "SEQ_GS_D_IWAYAMA",
        "route-11-12-13-diglett": "SEQ_GS_D_IWAYAMA",
    }
    for zid, seq in MANUAL_OVERRIDE.items():
        if zid in zone_seq:
            zone_seq[zid] = seq

    missing_zones = set(known_zone_ids) - set(zone_seq)

    registry_path = ROOT / "content/zone-registry-names.json"
    registry = json.loads(registry_path.read_text())
    zones_by_id = {z["zone_id"]: z for z in registry["zones"]}

    # Étiquettes connues avec certitude (vérifiées individuellement plus tôt
    # dans la session, ou déductibles sans ambiguïté du nom de constante
    # SEQ_ lui-même) -- prioritaires sur toute étiquette héritée, qui peut
    # provenir d'une zone du même groupe dont le label Bulbapedia d'origine
    # était lui-même approximatif (ex. route-9-10-rocktunnel étiqueté
    # "Route 3" avant qu'on sache que Rock Tunnel avait sa propre carte ROM).
    SEQ_LABEL_OVERRIDE = {
        "SEQ_GS_D_IWAYAMA": {"jp": "イワヤマトンネル", "en": "Rock Tunnel"},
        "SEQ_GS_R_6_34": {"jp": None, "en": "Safari Zone"},
        "SEQ_GS_D_CHAMPROAD": {"jp": None, "en": "Victory Road"},
    }

    # Étiquette par SEQ_ : construite à partir du champ `name` (fiable, jamais
    # modifié par ce script) plutôt que de l'ancien `music_track` (qui peut
    # porter un groupement Bulbapedia approximatif hérité d'une zone du même
    # groupe -- ex. fuchsia-city étiqueté "Cerulean City" alors que sa propre
    # carte ROM a une constante SEQ_ distincte). Le nom du zone_id au zone_id
    # le plus court dans le groupe (plus susceptible d'être le lieu nommé
    # d'origine plutôt qu'une route fusionnée) sert de représentant.
    seq_groups = {}
    for zid, seq in zone_seq.items():
        seq_groups.setdefault(seq, []).append(zid)

    seq_label = dict(SEQ_LABEL_OVERRIDE)
    for seq, zids in seq_groups.items():
        if seq in seq_label:
            continue
        # Majorité sur le champ `name` des zones du groupe : plusieurs zones
        # d'un même groupe légitime partagent déjà le même `name.en` (ex. les
        # 5 salles indigo-plateau-* ont chacune name.en="The Pokémon League"
        # dans le registre d'origine) -- bien plus fiable qu'un tie-break sur
        # la longueur du zone_id, qui peut élire une zone non représentative
        # d'une voix.
        name_counts = {}
        for zid in zids:
            name = zones_by_id.get(zid, {}).get("name")
            if name and name.get("en"):
                key = (name.get("jp"), name.get("en"))
                name_counts[key] = name_counts.get(key, 0) + 1
        if name_counts:
            best = max(name_counts.items(), key=lambda kv: kv[1])[0]
            seq_label[seq] = {"jp": best[0], "en": best[1]}

    changes = []
    for zid, seq in zone_seq.items():
        z = zones_by_id.get(zid)
        if not z:
            continue
        old = z.get("music_track", {})
        label = seq_label.get(seq)
        if label:
            new_track = dict(label)
        else:
            new_track = {"jp": None, "en": seq.replace("SEQ_GS_", "").replace("_", " ").title()}
        if old.get("en") != new_track.get("en"):
            changes.append((zid, old.get("en"), new_track.get("en"), seq))
        z["music_track"] = new_track
        z["music_rom_seq"] = seq  # traçabilité : constante SEQ_GS_XXX exacte de la ROM
        z["music_shared_with"] = sorted(z2 for z2 in seq_groups[seq] if z2 != zid) or None

    registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"{len(zone_seq)}/{len(known_zone_ids)} zones avec musique ROM confirmée")
    if missing_zones:
        print(f"Zones sans musique ROM trouvée ({len(missing_zones)}) : {sorted(missing_zones)}")
    if conflicts:
        print(f"\nConflits internes à un zone_id fusionné ({len(conflicts)}), après retrait des thèmes universels :")
        for zid, pairs, _chosen in conflicts:
            print(f"  {zid}: retenu={zone_seq[zid]}")
            for map_name, seq in pairs:
                print(f"      {map_name}: {seq}")

    print(f"\n{len(changes)} corrections vs. la passe Bulbapedia :")
    for zid, old, new, seq in changes:
        print(f"  {zid}: {old!r} -> {new!r} ({seq})")


if __name__ == "__main__":
    main()
