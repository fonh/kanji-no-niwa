#!/usr/bin/env python3
"""
Étape 4, lot 1 — enregistre dans content/map/npcs.json et trainers.json les
PNJ/dresseurs de route-32, ruins-of-alph, union-cave, route-33, azalea-town,
slowpoke-well. Positions reprises de content/map/placements/<zone>.json —
quand plusieurs personnages partagent une seule position groupée dans la
donnée source (clusters ROM non individualisés), un petit offset artificiel
les distingue (position_status le signale).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NPCS_PATH = ROOT / "content/map/npcs.json"
TRAINERS_PATH = ROOT / "content/map/trainers.json"

GEN = "generated (pas de sprite ROM matché), position dans un cluster non individualisé — voir content/map/placements/"

NEW_NPCS = [
    {"npc_id": "path_man_route32", "zone_id": "route-32", "name": "Man on the Path", "tile_x": 29, "tile_y": 30, "facing": "south", "position_status": "generated, voir content/map/placements/route-32.json", "trigger_type": "talk", "role": "lesson", "dialogue_ref": "npcs/route-32/path_man_route32"},
    {"npc_id": "slowpoke_tail_man_route32", "zone_id": "route-32", "name": "Man Selling a Tail", "tile_x": 20, "tile_y": 51, "facing": "south", "position_status": "generated, voir content/map/placements/route-32.json", "trigger_type": "talk", "role": "lesson", "dialogue_ref": "npcs/route-32/slowpoke_tail_man_route32"},
    {"npc_id": "fisherman_route32", "zone_id": "route-32", "name": "Fisherman", "tile_x": 12, "tile_y": 71, "facing": "south", "position_status": "generated, voir content/map/placements/route-32.json", "trigger_type": "talk", "role": "lesson", "dialogue_ref": "npcs/route-32/fisherman_route32"},
    {"npc_id": "man_beyond_force_point_route32", "zone_id": "route-32", "name": "Man Beyond the Rock", "tile_x": 4, "tile_y": 90, "facing": "south", "position_status": "generated, voir content/map/placements/route-32.json", "trigger_type": "talk", "role": "lesson", "dialogue_ref": "npcs/route-32/man_beyond_force_point_route32"},
    {"npc_id": "frieda_route32", "zone_id": "route-32", "name": "Frieda", "tile_x": 17, "tile_y": 9, "facing": "south", "position_status": "generated, voir content/map/placements/route-32.json", "trigger_type": "talk", "unlock_conditions": [{"type": "time_window", "days_of_week": ["friday"]}], "dialogue_ref": "npcs/route-32/frieda_route32"},
    {"npc_id": "apricorn_man_route32", "zone_id": "route-32", "name": "Man by the Fisherman", "tile_x": 8, "tile_y": 107, "facing": "south", "position_status": "generated, voir content/map/placements/route-32.json", "trigger_type": "talk", "dialogue_ref": "npcs/route-32/apricorn_man_route32"},

    {"npc_id": "young_man_ruins_of_alph", "zone_id": "ruins-of-alph", "name": "Young Man in the Underground Room", "tile_x": 14, "tile_y": 5, "facing": "south", "position_status": "generated, voir content/map/placements/ruins-of-alph.json", "trigger_type": "talk", "role": "lesson", "dialogue_ref": "npcs/ruins-of-alph/young_man_ruins_of_alph"},
    {"npc_id": "researchers_ruins_of_alph", "zone_id": "ruins-of-alph", "name": "Researchers", "tile_x": 9, "tile_y": 13, "facing": "south", "position_status": "generated, voir content/map/placements/ruins-of-alph.json", "trigger_type": "talk", "role": "lesson", "dialogue_ref": "npcs/ruins-of-alph/researchers_ruins_of_alph"},

    {"npc_id": "kurt_azalea", "zone_id": "azalea-town", "name": "Kurt", "tile_x": 44, "tile_y": 0, "facing": "south", "position_status": "generated, voir content/map/placements/azalea-town.json", "trigger_type": "talk", "dialogue_ref": "npcs/azalea-town/kurt_azalea"},
    {"npc_id": "charcoal_man_azalea", "zone_id": "azalea-town", "name": "Charcoal Man", "tile_x": 26, "tile_y": 13, "facing": "south", "position_status": "generated, voir content/map/placements/azalea-town.json", "trigger_type": "talk", "role": "lesson", "dialogue_ref": "npcs/azalea-town/charcoal_man_azalea"},
    {"npc_id": "mart_vendor_azalea", "zone_id": "azalea-town", "name": "Mart Clerk", "tile_x": 12, "tile_y": 17, "facing": "south", "position_status": "generated, voir content/map/placements/azalea-town.json", "trigger_type": "talk", "role": "lesson", "dialogue_ref": "npcs/azalea-town/mart_vendor_azalea"},
    {"npc_id": "rocket_grunt_azalea", "zone_id": "azalea-town", "name": "Team Rocket Grunt", "tile_x": 21, "tile_y": 15, "facing": "south", "sight_range": 3, "position_status": "generated, voir content/map/placements/azalea-town.json", "trigger_type": "sight_auto", "sight_auto_result": "block", "repeats": True, "dialogue_ref": "npcs/azalea-town/rocket_grunt_azalea"},

    {"npc_id": "kurt_slowpoke_well", "zone_id": "slowpoke-well", "name": "Kurt", "tile_x": 0, "tile_y": 0, "facing": "south", "position_status": "generated, voir content/map/placements/slowpoke-well.json", "trigger_type": "talk", "dialogue_ref": "npcs/slowpoke-well/kurt_slowpoke_well"},
]

NEW_TRAINERS = [
    {"trainer_id": "youngster_albert_route32", "zone_id": "route-32", "name": "Youngster Albert", "tile_x": 14, "tile_y": 0, "battle_length": 6},
    {"trainer_id": "picnicker_liz_route32", "zone_id": "route-32", "name": "Picnicker Liz", "tile_x": 15, "tile_y": 1, "battle_length": 6},
    {"trainer_id": "fisherman_henry_route32", "zone_id": "route-32", "name": "Fisherman Henry", "tile_x": 16, "tile_y": 2, "battle_length": 6},
    {"trainer_id": "fisherman_justin_route32", "zone_id": "route-32", "name": "Fisherman Justin", "tile_x": 17, "tile_y": 3, "battle_length": 7},
    {"trainer_id": "fisherman_ralph_route32", "zone_id": "route-32", "name": "Fisherman Ralph", "tile_x": 18, "tile_y": 4, "battle_length": 7},
    {"trainer_id": "camper_roland_route32", "zone_id": "route-32", "name": "Camper Roland", "tile_x": 19, "tile_y": 5, "battle_length": 7},
    {"trainer_id": "youngster_gordon_route32", "zone_id": "route-32", "name": "Youngster Gordon", "tile_x": 20, "tile_y": 6, "battle_length": 7},
    {"trainer_id": "bird_keeper_peter_route32", "zone_id": "route-32", "name": "Bird Keeper Peter", "tile_x": 21, "tile_y": 7, "battle_length": 8},

    {"trainer_id": "psychic_nathan_ruins_of_alph", "zone_id": "ruins-of-alph", "name": "Psychic Nathan", "tile_x": 10, "tile_y": 21, "battle_length": 9},

    {"trainer_id": "hiker_daniel_union_cave", "zone_id": "union-cave", "name": "Hiker Daniel", "tile_x": 10, "tile_y": 0, "battle_length": 9},
    {"trainer_id": "hiker_russell_union_cave", "zone_id": "union-cave", "name": "Hiker Russell", "tile_x": 11, "tile_y": 1, "battle_length": 9},
    {"trainer_id": "firebreather_bill_union_cave", "zone_id": "union-cave", "name": "Firebreather Bill", "tile_x": 12, "tile_y": 2, "battle_length": 9},
    {"trainer_id": "firebreather_ray_union_cave", "zone_id": "union-cave", "name": "Firebreather Ray", "tile_x": 13, "tile_y": 3, "battle_length": 9},
    {"trainer_id": "poke_maniac_larry_union_cave", "zone_id": "union-cave", "name": "Poké Maniac Larry", "tile_x": 14, "tile_y": 4, "battle_length": 9},
    {"trainer_id": "hiker_phillip_union_cave", "zone_id": "union-cave", "name": "Hiker Phillip", "tile_x": 31, "tile_y": 10, "battle_length": 10},
    {"trainer_id": "hiker_leonard_union_cave", "zone_id": "union-cave", "name": "Hiker Leonard", "tile_x": 32, "tile_y": 11, "battle_length": 10},
    {"trainer_id": "poke_maniac_andrew_union_cave", "zone_id": "union-cave", "name": "Poké Maniac Andrew", "tile_x": 33, "tile_y": 12, "battle_length": 10},
    {"trainer_id": "poke_maniac_calvin_union_cave", "zone_id": "union-cave", "name": "Poké Maniac Calvin", "tile_x": 34, "tile_y": 13, "battle_length": 10},
    {"trainer_id": "ace_trainer_nick_union_cave", "zone_id": "union-cave", "name": "Ace Trainer Nick", "tile_x": 2, "tile_y": 18, "battle_length": 11},
    {"trainer_id": "ace_trainer_gwen_union_cave", "zone_id": "union-cave", "name": "Ace Trainer Gwen", "tile_x": 3, "tile_y": 19, "battle_length": 11},
    {"trainer_id": "ace_trainer_emma_union_cave", "zone_id": "union-cave", "name": "Ace Trainer Emma", "tile_x": 4, "tile_y": 20, "battle_length": 11},

    {"trainer_id": "hiker_anthony_route33", "zone_id": "route-33", "name": "Hiker Anthony", "tile_x": 23, "tile_y": 0, "battle_length": 11},

    {"trainer_id": "silver_apparition2_azalea", "zone_id": "azalea-town", "name": "Silver", "tile_x": 0, "tile_y": 0, "facing": "north", "battle_length": 15, "rom_matched": "obj_T23_gsrivel"},
    {"trainer_id": "bug_catcher_al_azalea", "zone_id": "azalea-town", "name": "Bug Catcher Al", "tile_x": 10, "tile_y": 10, "battle_length": 11},
    {"trainer_id": "bug_catcher_josh_azalea", "zone_id": "azalea-town", "name": "Bug Catcher Josh", "tile_x": 11, "tile_y": 11, "battle_length": 11},
    {"trainer_id": "bug_catcher_benny_azalea", "zone_id": "azalea-town", "name": "Bug Catcher Benny", "tile_x": 12, "tile_y": 12, "battle_length": 11},
    {"trainer_id": "twins_amy_mimi_azalea", "zone_id": "azalea-town", "name": "Twins Amy & Mimi", "tile_x": 13, "tile_y": 13, "battle_length": 11},
    {"trainer_id": "bugsy_azalea", "zone_id": "azalea-town", "name": "Bugsy", "tile_x": 26, "tile_y": 20, "talk": True, "battle_length": 31,
     "unlock_conditions": [
         {"type": "npc_cleared", "npc_id": "bug_catcher_al_azalea"},
         {"type": "npc_cleared", "npc_id": "bug_catcher_josh_azalea"},
         {"type": "npc_cleared", "npc_id": "bug_catcher_benny_azalea"},
         {"type": "npc_cleared", "npc_id": "twins_amy_mimi_azalea"},
     ]},

    {"trainer_id": "rocket_grunt1_slowpoke_well", "zone_id": "slowpoke-well", "name": "Team Rocket Grunt", "tile_x": 27, "tile_y": 3, "battle_length": 10},
    {"trainer_id": "rocket_grunt2_slowpoke_well", "zone_id": "slowpoke-well", "name": "Team Rocket Grunt", "tile_x": 28, "tile_y": 4, "battle_length": 10},
    {"trainer_id": "rocket_grunt_f_slowpoke_well", "zone_id": "slowpoke-well", "name": "Team Rocket Grunt (F)", "tile_x": 29, "tile_y": 5, "battle_length": 10},
    {"trainer_id": "executive_proton_slowpoke_well", "zone_id": "slowpoke-well", "name": "Executive Proton", "tile_x": 42, "tile_y": 11, "battle_length": 24, "rom_matched": "obj_D26R0102_rocketm"},
]


def make_npc_entry(spec):
    e = {
        "npc_id": spec["npc_id"],
        "zone_id": spec["zone_id"],
        "name": spec["name"],
        "tile_x": spec["tile_x"],
        "tile_y": spec["tile_y"],
        "facing": spec.get("facing", "south"),
        "position_status": spec["position_status"],
        "trigger_type": spec["trigger_type"],
    }
    if spec.get("kind"):
        e["kind"] = spec["kind"]
    if "sight_range" in spec:
        e["sight_range"] = spec["sight_range"]
    if "sight_auto_result" in spec:
        e["sight_auto_result"] = spec["sight_auto_result"]
    if "repeats" in spec:
        e["repeats"] = spec["repeats"]
    if spec.get("role"):
        e["role"] = spec["role"]
    if spec.get("unlock_conditions"):
        e["unlock_conditions"] = spec["unlock_conditions"]
    e["dialogue_ref"] = spec["dialogue_ref"]
    return e


def make_trainer_entry(spec):
    zone_folder = spec["zone_id"]
    ref = f"trainers/{zone_folder}/{spec['trainer_id']}"
    position_status = (
        f"ROM-matched, voir content/map/placements/{zone_folder}.json ({spec['rom_matched']})"
        if "rom_matched" in spec
        else f"{GEN}{zone_folder}.json — cluster non individualisé, position artificielle distincte"
    )
    e = {
        "trainer_id": spec["trainer_id"],
        "zone_id": spec["zone_id"],
        "name": spec["name"],
        "tile_x": spec["tile_x"],
        "tile_y": spec["tile_y"],
        "facing": spec.get("facing", "south"),
        "position_status": position_status,
    }
    if spec.get("talk"):
        e["trigger_type"] = "talk"
    else:
        e["sight_range"] = 4
        e["trigger_type"] = "sight_auto"
        e["sight_auto_result"] = "battle"
        e["repeats"] = False
    e["role"] = "battle"
    e["battle_length"] = spec["battle_length"]
    if spec.get("unlock_conditions"):
        e["unlock_conditions"] = spec["unlock_conditions"]
    e["dialogue_ref"] = ref
    return e


def main():
    npcs = json.loads(NPCS_PATH.read_text())
    trainers = json.loads(TRAINERS_PATH.read_text())

    existing_npc_ids = {e["npc_id"] for e in npcs}
    existing_trainer_ids = {e["trainer_id"] for e in trainers}

    added_npcs = 0
    for spec in NEW_NPCS:
        if spec["npc_id"] in existing_npc_ids:
            continue
        npcs.append(make_npc_entry(spec))
        added_npcs += 1

    added_trainers = 0
    for spec in NEW_TRAINERS:
        if spec["trainer_id"] in existing_trainer_ids:
            continue
        trainers.append(make_trainer_entry(spec))
        added_trainers += 1

    NPCS_PATH.write_text(json.dumps(npcs, ensure_ascii=False, indent=2) + "\n")
    TRAINERS_PATH.write_text(json.dumps(trainers, ensure_ascii=False, indent=2) + "\n")
    print(f"{added_npcs} npcs, {added_trainers} trainers ajoutés.")


if __name__ == "__main__":
    main()
