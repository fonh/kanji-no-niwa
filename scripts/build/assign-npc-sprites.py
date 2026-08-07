#!/usr/bin/env python3
"""Donne une apparence à TOUS les personnages curatés qui n'en ont pas.

POURQUOI (2026-08-07)
---------------------
Un PNJ sans `sprite_id` n'est dessiné nulle part : le rendu ne produit qu'un div
vide. Régler ça personnage par personnage, c'est le travail qu'on ne veut plus
refaire — et il recommencera à chaque zone ajoutée. Ce script le fait en une
passe, sur une cascade de règles, du plus sourcé au plus dégradé :

  1. **posé sur son objet ROM** → il en hérite déjà (moteur, `inheritedSpriteId`).
     On écrit quand même `sprite_id` : une source explicite vaut mieux qu'un filet.
  2. **un objet ROM de personne, à portée, que personne d'autre ne revendique**
     → on adopte son sprite ET on note `rom_object`. Le moteur retire alors cet
     objet du décor : le personnage curaté EST ce figurant, pas un second.
  3. **la classe est écrite dans son nom** (« Ace Trainer Emma », « Fisherman »,
     « Team Rocket Grunt ») → planche de cette classe, table ci-dessous.
  4. sinon → laissé en l'état, et listé. Un cas à trancher à la main est une
     information ; un sprite inventé au hasard n'en est pas une.

    python3 scripts/build/assign-npc-sprites.py            # rapport seul
    python3 scripts/build/assign-npc-sprites.py --apply    # écrit le contenu

Idempotent : un personnage qui a déjà un `sprite_id` n'est jamais retouché.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

NPCS = Path("content/map/npcs.json")
TRAINERS = Path("content/map/trainers.json")
ZONES = Path("content/map/zones.json")
REGISTRY = Path("src/data/zone-registry.json")
SHEETS = Path("public/sprites/overworld")

#: Rayon de recherche d'un objet ROM représentant le personnage, en cases.
#: Au-delà, ce n'est plus « le même personnage décalé », c'est quelqu'un d'autre.
PORTEE = 4

#: Ni des gens, ni adoptables : terrain, objets ramassables, Pokémon suiveurs.
PAS_DES_GENS = re.compile(
    r"^SPRITE_(TREE|BREAKROCK|ROCK|USOKKY|KABIGON|MONSTARBALL|BONGURI|SIGN|"
    r"FOLLOWER_MON|TSURE_POKE|VAR_\d+$)"
)

#: Classe écrite dans le nom → planche de `public/sprites/overworld/`.
#: L'ordre compte : la première clé trouvée dans le nom gagne, donc les
#: expressions les plus précises d'abord (« rocket executive » avant « rocket »).
#: Chaque correspondance est un choix d'HABILLAGE, pas une affirmation sur le jeu
#: d'origine : elle donne une silhouette juste (classe, âge, genre) à un
#: personnage que notre contenu a créé, là où la ROM n'en pose aucun.
PAR_CLASSE: list[tuple[str, str]] = [
    (r"rocket (executive|admin)", "rkanbum"),
    (r"(executive|admin) .*\bf\b|ariana|proton", "rkanbuw"),
    (r"rocket grunt.*\bf\b|grunt \(f\)|female grunt", "rocketw"),
    (r"rocket|grunt", "rocketm"),
    (r"kimono", "itako"),
    (r"sage|elder|monk", "bozu"),
    (r"nurse|healer", "pcwoman1"),
    (r"clerk|vendor|shopkeeper|salesman", "shopm1"),
    (r"scientist|researcher|aide|assistant", "assistantm"),
    (r"fisherman|fishing", "fishing"),
    (r"sailor|captain|seaman", "seaman"),
    (r"swimmer", "gsswimmerm"),
    (r"hiker", "mount"),
    (r"picnicker|lass|schoolgirl", "picnicgirl"),
    (r"camper|bug catcher|youngster|schoolboy", "campboy"),
    (r"poké ?maniac|maniac", "mania"),
    (r"ace trainer|cooltrainer", "sportsman"),
    (r"black belt|karate|fighter", "gsfighter"),
    (r"gentleman", "gsgentleman"),
    (r"pokéfan|lady|madam", "lady"),
    (r"medium|psychic|fortune", "itako"),
    (r"policeman|officer|guard", "policeman"),
    (r"gym leader|leader", "gsleader1"),
    (r"waiter", "waiter"),
    (r"waitress|maid", "maid"),
    (r"artist|painter", "artist"),
    (r"reporter|journalist", "reporter"),
    (r"photographer|cameraman", "cameraman"),
    (r"farmer", "farmer"),
    (r"worker|workman|engineer", "workman"),
    (r"doctor", "doctor"),
    (r"teacher|instructor", "instructor"),
    (r"grandfather|old man|elderly man", "gsoldman1"),
    (r"grandmother|old lady|old woman", "gsoldwoman1"),
    (r"\bboy\b|\bson\b|\bkid\b", "gsboy1"),
    (r"\bgirl\b|\bdaughter\b", "gsgirl2"),
    (r"\bwoman\b|\bwife\b|\bmother\b|\bmom\b|\bmrs\b", "gswoman1"),
    (r"\bman\b|\bfather\b|\bmr\b|\bguru\b|\bgent\b", "gsman1"),
    (r"apprentice|jumper|record.holder|athlete", "sportsman"),
    (r"couple|family|siblings|parents", "gsmiddleman1"),
    (r"attendant|receptionist|host", "gswoman3"),
    (r"warden|owner|president|director", "gsbigman"),
]

#: Dernier recours : une silhouette d'adulte générique. Invisible est toujours
#: pire qu'imprécis — un personnage qu'on ne voit pas est un bug, un personnage
#: dont l'habit est provisoire est une tâche.
DEFAUT = "SPRITE_GSMAN1"


#: Personnages nommés → leur planche, vérifiée dans le décompilé.
#: Les `gsleaderN` suivent l'ordre des badges : les objets de zone_event donnent
#: GSLEADER1 à l'arène d'Irisia (Albert), GSLEADER2 à Ébenelle (Hector),
#: GSLEADER3 à Doublonville (Blanche), …, GSLEADER8 à Ohrid (Sandra) — vérifié
#: zone par zone. Les autres planches portent le nom japonais du personnage
#: (wataru = Peter, minaki = Eusine), comme tout le reste du dump.
NOMMES: dict[str, str] = {
    "falkner": "gsleader1", "bugsy": "gsleader2", "whitney": "gsleader3",
    "morty": "gsleader4", "chuck": "gsleader5", "jasmine": "gsleader6",
    "pryce": "gsleader7", "clair": "gsleader8",
    "lance": "wataru", "eusine": "minaki", "steven": "daigo", "giovanni": "sakaki",
    "bill": "masaki", "kurt": "gantetsu", "oak": "ookido", "red": "red",
}

#: Planches qui désignent UN personnage précis (pas une classe) : quand une zone
#: n'en contient qu'un exemplaire et que personne ne le revendique, c'est lui,
#: quelle que soit la distance — Peter au Lac Colère, Sandra à l'Antre du Dragon.
PLANCHES_NOMMEES = {
    "wataru", "minaki", "nanami", "daigo", "sakaki", "red", "ookido", "masaki",
    "gantetsu", "kurumi", "chourou",
}

#: Mots qui ne DÉSIGNENT personne — un nom réduit à ceux-là n'est pas un nom
#: propre et ne doit pas servir de clé d'homonymie.
BANALS = {
    "the", "of", "in", "at", "on", "by", "man", "woman", "boy", "girl", "old",
    "young", "lady", "gent", "house", "gate", "shop", "mart", "center", "gym",
    "trainer", "grunt", "team", "rocket", "ace", "poke", "poké", "pokemon",
    "pokémon", "north", "south", "east", "west", "lone", "guard", "clerk",
}


def cle_de_nom(nom: str) -> str:
    """Le nom propre d'un personnage, s'il en a un. « Whitney » et « Gym Leader
    Whitney » donnent la même clé ; « The Old Man » n'en donne aucune."""
    mots = [m for m in re.findall(r"[A-Za-zÀ-ÿ']+", (nom or "").lower()) if m not in BANALS]
    return mots[0] if len(mots) == 1 else ""


def planche_existe(label: str) -> bool:
    return (SHEETS / f"{label}.png").exists()


def sprite_de_classe(nom: str) -> tuple[str, str] | None:
    bas = (nom or "").lower()
    for motif, label in PAR_CLASSE:
        if re.search(motif, bas):
            if not planche_existe(label):
                continue
            return f"SPRITE_{label.upper()}", motif
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--portee", type=int, default=PORTEE)
    a = ap.parse_args()

    zones_doc = json.load(open(ZONES))["zones"]
    carte_par_zone = {z["zone_id"]: z["map_name"] for z in zones_doc}
    registre = {z["name"]: z for z in json.load(open(REGISTRY))["zones"]}

    docs = {p: json.load(open(p)) for p in (NPCS, TRAINERS)}
    entites = [(p, e) for p, doc in docs.items() for e in doc]

    def maison(e: dict) -> str | None:
        return e.get("map_zone") or carte_par_zone.get(e["zone_id"])

    # Tuiles et objets déjà revendiqués : on ne donne pas deux fois le même
    # figurant à deux personnages.
    tuiles_prises: dict[str, set[tuple[int, int]]] = {}
    objets_pris: set[str] = set()
    for _, e in entites:
        m = maison(e)
        if m and e.get("tile_x") is not None:
            tuiles_prises.setdefault(m, set()).add((e["tile_x"], e["tile_y"]))
        if e.get("rom_object"):
            objets_pris.add(e["rom_object"])

    # Index des personnages nommés déjà habillés, pour la règle 3bis.
    deja_habille: dict[str, tuple[str, str]] = {}
    for _, e in entites:
        if e.get("sprite_id"):
            cle = cle_de_nom(e.get("name", ""))
            if cle:
                deja_habille.setdefault(cle, (e.get("npc_id") or e.get("trainer_id"), e["sprite_id"]))

    def retenir(e: dict) -> None:
        """Un personnage qu'on vient d'habiller devient à son tour une source
        pour ses homonymes — d'où l'ordre : les dresseurs d'arène, posés sur
        leur objet ROM, habillent les apparitions du même personnage ailleurs."""
        cle = cle_de_nom(e.get("name", ""))
        if cle:
            deja_habille.setdefault(cle, (e.get("npc_id") or e.get("trainer_id"), e["sprite_id"]))

    compte = {"hérite déjà": 0, "sur son objet": 0, "objet voisin": 0, "planche nommée": 0,
              "personnage connu": 0, "homonyme": 0, "classe": 0, "défaut": 0}
    restants: list[tuple[str, str, str]] = []
    sans_carte: list[str] = []

    # Les dresseurs d'abord : ils sont presque tous posés sur leur objet ROM,
    # donc sourcés — et ils servent ensuite de source à leurs homonymes.
    ordre = sorted(entites, key=lambda pe: 0 if pe[0] == TRAINERS else 1)
    for _, e in ordre:
        eid = e.get("npc_id") or e.get("trainer_id")
        if e.get("sprite_id") or e.get("kind") in ("sign", "object"):
            continue
        m = maison(e)
        zone = registre.get(m) if m else None
        if zone is None or e.get("tile_x") is None:
            sans_carte.append(eid)
            continue

        tx, ty = e["tile_x"], e["tile_y"]
        ox0, oy0 = zone["world_origin_x"], zone["world_origin_y"]

        # Déjà visible sans rien écrire : un objet ROM se tient sur SA tuile et
        # le moteur en hérite l'apparence. C'est le cas des créneaux SPRITE_VAR_n
        # (l'ami, le rival), qui ne se résolvent QUE depuis le drapeau de l'objet
        # — leur recopier un sprite_id le casserait.
        if any(o["x"] - ox0 == tx and o["z"] - oy0 == ty for o in zone["objects"]):
            compte["hérite déjà"] += 1
            continue
        candidats = []
        for o in zone["objects"]:
            if PAS_DES_GENS.match(o["spriteId"]) or o["id"] in objets_pris:
                continue
            ox, oy = o["x"] - ox0, o["z"] - oy0
            d = max(abs(ox - tx), abs(oy - ty))
            if d == 0 or (d <= a.portee and (ox, oy) not in tuiles_prises.get(m, set())):
                candidats.append((d, o))
        candidats.sort(key=lambda c: c[0])

        if candidats:
            d, o = candidats[0]
            e["sprite_id"] = o["spriteId"]
            if d > 0:
                e["rom_object"] = o["id"]
            objets_pris.add(o["id"])
            e["_note_sprite"] = (
                f"apparence 2026-08-07 (assign-npc-sprites.py) : reprise de l'objet ROM "
                f"{o['id']} ({o['spriteId']}), "
                + ("sur sa propre tuile." if d == 0 else
                   f"à {d} case(s) — le personnage le REPRÉSENTE (`rom_object`), "
                   "le décor ne le dessine donc plus une seconde fois.")
            )
            compte["sur son objet" if d == 0 else "objet voisin"] += 1
            retenir(e)
            continue

        # 2b. Une planche de personnage NOMMÉ, seule de son espèce dans la zone
        # et non revendiquée : c'est lui, quelle que soit la distance.
        uniques: dict[str, list[dict]] = {}
        for o in zone["objects"]:
            uniques.setdefault(o["spriteId"], []).append(o)
        for sid, objs in uniques.items():
            label = sid.replace("SPRITE_", "").lower()
            if label in PLANCHES_NOMMEES and len(objs) == 1 and objs[0]["id"] not in objets_pris:
                if cle_de_nom(e.get("name", "")):
                    e["sprite_id"] = sid
                    e["rom_object"] = objs[0]["id"]
                    objets_pris.add(objs[0]["id"])
                    e["_note_sprite"] = (
                        f"apparence 2026-08-07 (assign-npc-sprites.py) : {objs[0]['id']} "
                        f"({sid}) est le seul exemplaire de cette planche de personnage nommé "
                        "dans la zone, et personne d'autre ne le revendique."
                    )
                    compte["planche nommée"] += 1
                    retenir(e)
                    break
        if e.get("sprite_id"):
            continue

        # 3. Personnage connu, planche vérifiée dans le décompilé.
        connu = NOMMES.get(cle_de_nom(e.get("name", "")))
        if connu and planche_existe(connu):
            e["sprite_id"] = f"SPRITE_{connu.upper()}"
            e["_note_sprite"] = (
                f"apparence 2026-08-07 (assign-npc-sprites.py) : planche du personnage "
                f"« {e.get('name')} », relevée dans les zone_event du décompilé (table NOMMES)."
            )
            compte["personnage connu"] += 1
            retenir(e)
            continue

        # 3bis. Un personnage nommé qui existe DÉJÀ ailleurs dans notre contenu,
        # habillé là-bas : Whitney croisée au Parc Naturel est la Whitney de
        # l'arène. Source interne, mais source quand même — et elle se met à jour
        # toute seule quand l'autre entrée change.
        homonyme = deja_habille.get(cle_de_nom(e.get("name", "")))
        if homonyme:
            e["sprite_id"] = homonyme[1]
            e["_note_sprite"] = (
                f"apparence 2026-08-07 (assign-npc-sprites.py) : même personnage que "
                f"{homonyme[0]}, déjà habillé ailleurs dans le contenu."
            )
            compte["homonyme"] += 1
            continue

        par_nom = sprite_de_classe(e.get("name", ""))
        if par_nom:
            sprite, motif = par_nom
            e["sprite_id"] = sprite
            e["_note_sprite"] = (
                f"apparence 2026-08-07 (assign-npc-sprites.py) : aucun objet ROM libre à "
                f"{a.portee} cases ; silhouette déduite de sa classe, écrite dans son nom "
                f"« {e.get('name')} » (règle /{motif}/). Habillage, pas une source."
            )
            compte["classe"] += 1
            retenir(e)
            continue

        e["sprite_id"] = DEFAUT
        e["_note_sprite"] = (
            f"apparence 2026-08-07 (assign-npc-sprites.py) : PROVISOIRE. Aucun objet ROM "
            f"libre, aucune classe reconnue dans « {e.get('name')} » — silhouette d'adulte "
            "générique, à remplacer quand la zone passera à la passe PNJ."
        )
        compte["défaut"] += 1
        restants.append((eid, m, e.get("name", "")))

    total = sum(compte.values())
    for k, v in compte.items():
        print(f"{v:>4}  {k}")
    print(f"{total} personnage(s) habillé(s)")
    print(f"{len(sans_carte)} sans carte servie (zone de contenu non reliée à un MAP_*) — "
          "ils ne sont dessinés nulle part de toute façon")
    if restants:
        print(f"\n{len(restants)} habillé(s) PAR DÉFAUT, à revoir quand la zone passe :")
        for eid, m, nom in restants:
            print(f"  {eid:<38} {m or '—':<34} « {nom} »")

    if a.apply:
        for p, doc in docs.items():
            p.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n")
        print("\nÉcrit. Relancer : npm run check")
    else:
        print("\nRapport seul — relancer avec --apply pour écrire.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
