#!/usr/bin/env python3
"""Solveur de progression — joue la partie entière comme une traversée de graphe.

Créé 2026-07-25 (plan de revue direction, point C1). Objectif : prouver, sans jouer,
que la progression écrite est traversable de Bourg Geon à la dernière zone écrite —
et lister tout ce qui ne l'est pas.

Modèle (fidèle au PRD § Implémentation et à ADR-0003) :
- Le joueur visite les zones dans NARRATIVE_ORDER (calc-cs-corpus.py). Après chaque
  nouvelle zone, TOUTES les zones déjà visitées sont re-traitées jusqu'à point fixe
  (le joueur peut revenir en arrière — c'est ce qui résout les quêtes cross-zone).
- Dans une zone : chaque entité (npc/trainer/obstacle) dont les `unlock_conditions`
  (gate de présence) sont satisfaites est interagie ; les dresseurs sont battus
  (npc_cleared) ; les `state_rules` sont évaluées de haut en bas et les Effects de
  l'état sélectionné sont appliqués ; les leçons de la zone se font dans l'ordre
  strict (quête implicite lessons-<zone>) ; tout texte débloqué est lu.
- Un fichier dresseur sans state_rules (combat simple, états pilotés moteur) applique
  les Effects de tous ses états au moment de la victoire.
- Les events/steps « moteur » du contrat (content/engine-contract.md § 1-3) sont émis
  quand leur condition d'émission est atteignable (zone visitée + préconditions).
- `time_window` est réputé satisfiable (les jours passent) ; `pokeathlon_score` aussi
  (mini-jeu rejouable) — chaque hypothèse est listée dans la sortie.
- La sémantique `quest_step` est monotone : « étape atteinte ou dépassée » (l'ordre
  des steps[] du fichier de quête fait foi), conforme à l'invariant de monotonie.

Sortie : liste des entités jamais présentes, obstacles jamais levés, quêtes jamais
finies, leçons jamais servies, textes jamais lus — chacun avec la condition qui
bloque. Code retour 1 si au moins un bloquant sur le chemin critique.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts/validate"))
from importlib.util import spec_from_file_location, module_from_spec

_spec = spec_from_file_location("calc_cs", ROOT / "scripts/validate/calc-cs-corpus.py")
_calc = module_from_spec(_spec)
_spec.loader.exec_module(_calc)
NARRATIVE_ORDER = _calc.NARRATIVE_ORDER


def load(p):
    return json.loads((ROOT / p).read_text())


# ---------------------------------------------------------------- état du joueur
class State:
    def __init__(self):
        self.items = {}            # item_id -> quantité
        self.quests = {}           # quest_id -> index max atteint dans steps[]
        self.badges = set()
        self.events = set()
        self.cleared = set()       # npc_id / trainer_id
        self.texts_read = set()
        self.kanji_count = 0
        self.visited = []
        self.lessons_done = {}     # zone -> nb de leçons complétées
        self.assumptions = set()

    def snapshot(self):
        return (
            tuple(sorted(self.items.items())), tuple(sorted(self.quests.items())),
            tuple(sorted(self.badges)), tuple(sorted(self.events)),
            tuple(sorted(self.cleared)), tuple(sorted(self.texts_read)),
            self.kanji_count, tuple(sorted(self.lessons_done.items())),
        )


QUEST_STEPS = {}   # quest_id -> [step_id...]
for qf in sorted((ROOT / "content/quests").glob("*.json")):
    q = json.loads(qf.read_text())
    QUEST_STEPS[q["quest_id"]] = [s["step_id"] for s in q["steps"]]


def step_index(quest_id, step_id):
    steps = QUEST_STEPS.get(quest_id, [])
    return steps.index(step_id) if step_id in steps else None


def eval_condition(c, st):
    t = c.get("type")
    if t == "item_owned":
        ok = st.items.get(c["item_id"], 0) > 0
    elif t == "quest_step":
        sid = c.get("step_id") or c.get("step")
        idx = step_index(c["quest_id"], sid)
        ok = idx is not None and st.quests.get(c["quest_id"], -1) >= idx
    elif t == "npc_cleared":
        ok = c["npc_id"] in st.cleared
    elif t == "event_cleared":
        ok = c["event_id"] in st.events
    elif t == "badge_earned":
        ok = c["badge_id"] in st.badges
    elif t == "time_window":
        st.assumptions.add("time_window satisfiable (les jours passent)")
        ok = True
    elif t == "count":
        m = c["metric"]
        if m == "texts_read":
            v = len(st.texts_read)
        elif m == "badges_earned":
            v = len(st.badges)
        elif m == "kanji_count":
            v = st.kanji_count
        elif m == "pokeathlon_score":
            st.assumptions.add("pokeathlon_score atteignable (mini-jeu rejouable)")
            v = c["threshold"]
        else:
            v = 0
        ok = v >= c["threshold"]
    else:
        ok = False
    return (not ok) if c.get("negate") else ok


def eval_conditions(conds, st):
    return all(eval_condition(c, st) for c in (conds or []))


def apply_effects(effects, st):
    for e in effects or []:
        t = e.get("type")
        if t == "grant_item":
            st.items[e["item_id"]] = max(st.items.get(e["item_id"], 0), 1) \
                if e.get("item_kind", "unique") == "unique" else st.items.get(e["item_id"], 0) + 1
        elif t == "remove_item":
            st.items[e["item_id"]] = max(0, st.items.get(e["item_id"], 0) - 1)
        elif t == "advance_quest":
            idx = step_index(e["quest_id"], e.get("step_id") or e.get("step"))
            if idx is not None:
                st.quests[e["quest_id"]] = max(st.quests.get(e["quest_id"], -1), idx)
        elif t == "grant_badge":
            st.badges.add(e["badge_id"])
        elif t == "unlock_text":
            _unlocked_texts.add(e["text_id"])


# ------------------------------------------------------------------ chargements
NPCS = load("content/map/npcs.json")
TRAINERS = load("content/map/trainers.json")
OBSTACLES = load("content/map/obstacles.json")
DIALOGUES = {}
for e in NPCS + TRAINERS:
    ref = e.get("dialogue_ref")
    if ref:
        p = ROOT / f"content/dialogues/{ref}.json"
        if p.exists():
            DIALOGUES[ref] = json.loads(p.read_text())

TEXTS = {}  # text_id -> zone_id
for tf in (ROOT / "content/texts").glob("*/*.json"):
    t = json.loads(tf.read_text()).get("text", {})
    TEXTS[t.get("text_id")] = t.get("zone_id")

LESSONS = {}  # zone -> [entrées triées]
for lf in (ROOT / "content/lessons").glob("*.json"):
    entries = [e for e in json.loads(lf.read_text()) if "kanji_ids" in e]
    LESSONS[lf.stem] = sorted(entries, key=lambda e: e["sequence_index"])

_unlocked_texts = set()

# Contrat moteur § 1-3 : (zone d'émission, précondition, action)
ENGINE_RULES = [
    ("route-24-25-kanto", None, lambda st: st.events.add("misty_met_viewpoint")),
    ("ice-path", None, lambda st: st.events.add("ice_path_puzzle_solved")),
    ("ice-path", None, lambda st: st.events.add("sayo_freed_ice_path")),
    ("ilex-forest", None, lambda st: st.events.add("birds_guided_ilex")),
    # § 2 — unlock_text moteur
    ("ilex-forest", None, lambda st: _unlocked_texts.add("forest_shrine_ilex")),
    ("new-bark-town", None, lambda st: _unlocked_texts.add("lyra_mail_new_bark")),
    ("route-29", None, lambda st: _unlocked_texts.add("johto_entrance_sign_route29")),
    ("slowpoke-well", None, lambda st: _unlocked_texts.add("son_in_law_letter_slowpoke_well")),
    ("sprout-tower", None, lambda st: _unlocked_texts.add("ancient_inscription_sprout_tower")),
    # § 3 — quest steps moteur
    ("route-39",
     lambda st: st.quests.get("moomoo_recovery", -1) >= step_index("moomoo_recovery", "sick_found"),
     lambda st: st.quests.__setitem__("moomoo_recovery",
                                      step_index("moomoo_recovery", "healed"))),
    ("goldenrod-city",
     lambda st: "pryce" in st.badges,
     lambda st: st.quests.__setitem__(
         "radio_tower_takeover",
         max(st.quests.get("radio_tower_takeover", -1),
             step_index("radio_tower_takeover", "tower_occupied")))),
]


def process_zone(zone, st):
    """Une passe sur une zone visitée. Retourne True si l'état a changé."""
    before = st.snapshot()
    # 1. règles moteur
    for z, pre, action in ENGINE_RULES:
        if z == zone and (pre is None or pre(st)):
            action(st)
    # 2. leçons, dans l'ordre strict
    if zone in LESSONS:
        done = st.lessons_done.get(zone, 0)
        for e in LESSONS[zone][done:]:
            if not eval_conditions(e.get("unlock_conditions"), st):
                break
            st.kanji_count += len(e["kanji_ids"])
            if e.get("npc_ref"):
                st.cleared.add(e["npc_ref"])
            done += 1
        st.lessons_done[zone] = done
    # 3. entités — présence figée à l'entrée de la passe, effets sur l'état vivant
    import copy
    entry_state = copy.deepcopy(st)
    for coll, idkey in ((NPCS, "npc_id"), (TRAINERS, "trainer_id")):
        for e in coll:
            if e["zone_id"] != zone:
                continue
            eid = e.get(idkey) or e.get("npc_id")
            if not (eval_conditions(e.get("unlock_conditions"), entry_state)
                    or eval_conditions(e.get("unlock_conditions"), st)):
                continue
            st.cleared.add(eid)
            ref = e.get("dialogue_ref")
            d = DIALOGUES.get(ref)
            if not d:
                continue
            rules = d.get("state_rules")
            states = d.get("dialogue_states", {})
            if rules:
                for r in rules:
                    if r.get("default") or eval_conditions(r.get("if") or r.get("conditions"), st):
                        sel = states.get(r["state"], {})
                        apply_effects(sel.get("effects"), st)
                        break
            else:  # dresseur combat simple : victoire, tous les états passent
                for s in states.values():
                    apply_effects(s.get("effects"), st)
    # 4. obstacles (levés si conditions remplies — informationnel)
    for o in OBSTACLES:
        if o["zone_id"] == zone and eval_conditions(o.get("unlock_conditions"), st):
            st.cleared.add(o["obstacle_id"])
    # 5. textes lisibles → lus
    for tid, tzone in TEXTS.items():
        if tid in _unlocked_texts and tzone in st.visited:
            st.texts_read.add(tid)
    return st.snapshot() != before


def main():
    st = State()
    for zone in NARRATIVE_ORDER:
        st.visited.append(zone)
        while True:
            changed = False
            for z in st.visited:
                changed |= process_zone(z, st)
            if not changed:
                break

    # ------------------------------------------------------------- rapport
    problems = []
    for coll, idkey, label in ((NPCS, "npc_id", "PNJ"), (TRAINERS, "trainer_id", "dresseur")):
        for e in coll:
            eid = e.get(idkey) or e.get("npc_id")
            if e["zone_id"] not in st.visited:
                continue
            ever_present = eid in st.cleared
            if not ever_present:
                # un negate() peut rendre l'entité absente en fin de partie tout en
                # ayant été présente avant — le point fixe l'aurait alors clearée.
                problems.append((f"{label} jamais présent/interagi", eid,
                                 json.dumps(e.get("unlock_conditions"), ensure_ascii=False)))
    for o in OBSTACLES:
        if o["zone_id"] in st.visited and o["obstacle_id"] not in st.cleared:
            problems.append(("obstacle jamais levé", o["obstacle_id"],
                             json.dumps(o.get("unlock_conditions"), ensure_ascii=False)))
    for qid, steps in QUEST_STEPS.items():
        reached = st.quests.get(qid, -1)
        if reached < len(steps) - 1:
            problems.append(("quête inachevée", qid,
                             f"étape atteinte: {steps[reached] if reached >= 0 else '(aucune)'} "
                             f"/ finale: {steps[-1]}"))
    for zone, entries in LESSONS.items():
        done = st.lessons_done.get(zone, 0)
        if zone in st.visited and done < len(entries):
            blocked = entries[done]
            problems.append(("leçon jamais servie", f"{zone} #{blocked['sequence_index']}",
                             json.dumps(blocked.get("unlock_conditions"), ensure_ascii=False)))
    for tid, tzone in TEXTS.items():
        if tzone in st.visited and tid not in st.texts_read:
            problems.append(("texte jamais lisible", tid,
                             "aucun unlock_text atteint (donneur bloqué ou câblage manquant)"))

    print(f"Traversée : {len(st.visited)} zones — kanji étudiés {st.kanji_count}, "
          f"badges {len(st.badges)}, quêtes finies "
          f"{sum(1 for q, s in QUEST_STEPS.items() if st.quests.get(q, -1) >= len(s) - 1)}"
          f"/{len(QUEST_STEPS)}, textes lus {len(st.texts_read)}/{len(TEXTS)}, "
          f"entités clearées {len(st.cleared)}")
    for a in sorted(st.assumptions):
        print(f"  [hypothèse] {a}")
    if problems:
        print(f"\n{len(problems)} problème(s) de traversée :")
        for kind, what, detail in problems:
            print(f"  [{kind}] {what}\n      → {detail}")
        sys.exit(1)
    print("\nAucun bloquant : la progression écrite est traversable de bout en bout.")


if __name__ == "__main__":
    main()
