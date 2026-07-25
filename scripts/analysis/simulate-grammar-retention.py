#!/usr/bin/env python3
"""Simulation de la fréquence de re-rencontre des points de grammaire (hors SRS).

Teste le mécanisme de rétention du PRD (§ Système de Combat, « Révision de la
grammaire — jalons Boss + filet anti-oubli » + « Pool de grammaire ») par
simulation sur 12 mois :

  - un point devient testable dès sa rencontre (leçon/dialogue/texte obligatoire)
    → il entre dans le pool `grammar_encounters` de sa zone, au fil de la traversée ;
  - chaque combat tire ses questions selon les profils de poids Route/Boss
    (PRD § Profils de poids, table 2026-07-21) — modes qui piochent un point de
    grammaire : Grammaire 6/10, Conjugaison 6/10, M17 組み立て 3/4, M18 接続 0/2
    → 15 % des questions sur route, 26 % en boss (variante « cœur » 12/20 sans M17/M18) ;
  - boss : rotation « plus-anciens-d'abord » sur last_drawn_at ;
  - route : tirage pondéré, poids boosté si dernier tirage > 14 jours (jamais tiré
    → on prend first_seen comme référence). Facteur de boost non chiffré au PRD →
    hypothèse ×3, sensibilité testée (le boost redistribue à débit constant : il ne
    crée aucune question de plus).

Données réelles :
  - content/grammar-zone-assignment.json : points assignés par zone (vérité de design,
    693 points sur les 60 zones de NARRATIVE_ORDER ; les 25 fichiers
    content/grammar/<zone>.json écrits sont des sous-ensembles en cours de production
    → variante « corpus écrit » disponible via --written) ;
  - content/map/trainers.json : 307 combats, zone_id + battle_length ;
  - NARRATIVE_ORDER : copié de scripts/validate/calc-cs-corpus.py (ordre réel de visite).

Hypothèses de rythme (mission) :
  - traversée d'une zone : 1-4 jours, ~1 leçon/jour (compte content/lessons/<zone>.json,
    borné [1,4] ; zones sans fichier leçons : 2 jours, salles du Conseil 4 : 1 jour) ;
  - tous les combats de la zone pendant sa traversée (boss le dernier jour) ;
  - ensuite ~1 revanche téléphonique/jour (combat route ordinaire de 15 questions,
    dresseur non-boss déjà battu, tiré au hasard) — y compris après la fin du contenu.

Sorties : distribution des fréquences de re-tirage, intervalle médian et son
évolution, débit questions/pool par mois, courbe de « points perdus » (60 jours
sans re-vue), grille de sensibilité (revanches/jour × poids grammaire × plafond
de pool), comparaison avec une mise en SRS de la grammaire (refusée par le PRD).

Usage : python3 scripts/analysis/simulate-grammar-retention.py [--written] [--seeds N]
Aucun fichier du repo n'est modifié ; tout sort sur stdout.
"""
import argparse
import json
import random
import statistics
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SIM_DAYS = 365  # 12 mois

# Copié de scripts/validate/calc-cs-corpus.py (ordre réel de visite, guidebook L99).
NARRATIVE_ORDER = [
    "new-bark-town", "route-29", "cherrygrove-city", "route-30",
    "route-31", "violet-city", "sprout-tower", "route-36",
    "ruins-of-alph", "route-32", "union-cave", "route-33",
    "azalea-town", "slowpoke-well", "ilex-forest",
    "route-34", "goldenrod-city", "route-35", "national-park",
    "route-37", "ecruteak-city", "burned-tower",
    "route-38", "route-39", "olivine-city", "route-40", "route-41",
    "cianwood-city", "route-47-48-cliff-cave", "safari-zone", "whirl-islands",
    "route-42", "mt-mortar", "route-43", "lake-of-rage", "mahogany-town",
    "route-44", "ice-path", "blackthorn-city", "dragons-den",
    "dark-cave", "route-45", "route-46", "route-26", "route-27",
    "indigo-plateau-antichambre", "indigo-plateau-will", "indigo-plateau-koga",
    "indigo-plateau-bruno", "indigo-plateau-karen", "indigo-plateau-lance",
    "vermilion-city", "route-6-kanto", "saffron-city",
    "route-8-kanto", "route-9-10-rocktunnel", "lavender-town", "kanto-power-plant",
    "cerulean-city", "route-24-25-kanto",
]
END_OF_JOHTO_ZONE = "indigo-plateau-lance"  # dernier jalon Johto

# Boss = 門弟, 師範, Silver, Exécutifs Rocket, Kimono Girls, Légendaires,
# Elite Four, Lance, Red (PRD § Profils de poids). Leaders identifiés par id ;
# les 門弟 sont récupérés via les unlock_conditions des leaders.
GYM_LEADERS = {
    "falkner_violet_city", "bugsy_azalea", "whitney_goldenrod", "morty_ecruteak",
    "jasmine_gym_olivine", "chuck_cianwood", "pryce_mahogany", "clair_blackthorn",
    "lt_surge_vermilion", "sabrina_saffron", "misty_cerulean",
}
BOSS_PATTERNS = ("silver_apparition", "kimono_", "executive_", "ariana_",
                 "petrel_", "archer_", "suicune_", "_indigo")

# Profils de poids (PRD table 2026-07-21) — part des questions qui piochent un
# point de grammaire (Grammaire + Conjugaison + M17 + M18, tous sous la garde
# grammaire). M18 route = 0.
WEIGHT_PROFILES = {
    "base (G+C+M17/18 : 15/26)": (0.15, 0.26),
    "coeur (G+C seuls : 12/20)": (0.12, 0.20),
    "double (30/40)": (0.30, 0.40),
    "triple (45/52)": (0.45, 0.52),
}
BASE_PROFILE = "base (G+C+M17/18 : 15/26)"
BOOST_FACTOR = 3          # hypothèse (non chiffré au PRD), sensibilité testée
STALE_DAYS = 14           # PRD : boost si non revu depuis 14 jours
LOST_GAP = 60             # mission : 60+ jours sans re-vue = point perdu
REMATCH_LEN = 15          # PRD § Pokégear : revanche = combat ordinaire ~15q

# Intervalles type FSRS pour la comparaison SRS (rétention ~90 %, réponses "good")
SRS_INTERVALS = [1, 3, 7, 16, 35, 75, 160]


def load_json(p):
    return json.loads((ROOT / p).read_text())


def load_world(use_written):
    """Construit zones -> (points, jours, combats)."""
    assignment = {z["zone_id"]: z["grammar_ids"] for z in
                  load_json("content/grammar-zone-assignment.json")["zones"]}
    written_dir = ROOT / "content/grammar"
    lessons_dir = ROOT / "content/lessons"
    trainers = load_json("content/map/trainers.json")

    # 門弟 : dresseurs exigés par les unlock_conditions d'un leader
    montei = set()
    by_id = {t["trainer_id"]: t for t in trainers}
    for lid in GYM_LEADERS:
        for cond in by_id.get(lid, {}).get("unlock_conditions", []):
            if cond.get("type") == "npc_cleared" and cond.get("npc_id") in by_id:
                montei.add(cond["npc_id"])

    def is_boss(t):
        tid = t["trainer_id"]
        return (tid in GYM_LEADERS or tid in montei
                or any(p in tid for p in BOSS_PATTERNS))

    battles_by_zone = defaultdict(list)
    for t in trainers:
        battles_by_zone[t["zone_id"]].append(
            {"id": t["trainer_id"], "len": t["battle_length"], "boss": is_boss(t)})

    zones = []
    seen_ids = set()  # dédoublonnage : en mode --written, le mélange fichiers
    # écrits + assignation peut réintroduire un id déjà rencontré plus tôt
    for zid in NARRATIVE_ORDER:
        if use_written and (written_dir / f"{zid}.json").exists():
            pts = [p["grammar_id"] for p in
                   json.loads((written_dir / f"{zid}.json").read_text())["points"]]
        else:
            pts = list(assignment.get(zid, []))
        pts = [g for g in pts if g not in seen_ids]
        seen_ids.update(pts)
        lf = lessons_dir / f"{zid}.json"
        if lf.exists():
            n_lessons = len(json.loads(lf.read_text()))
            days = min(4, max(1, n_lessons))
        elif zid.startswith("indigo-plateau-") and zid != "indigo-plateau-antichambre":
            days = 1  # salle du Conseil 4 : un combat
        else:
            days = 2  # zone sans fichier leçons : défaut médian
        battles = sorted(battles_by_zone.get(zid, []),
                         key=lambda b: (b["boss"], b["len"]))  # boss en dernier
        zones.append({"zone_id": zid, "points": pts, "days": days, "battles": battles})
    return zones


def build_schedule(zones):
    """Étale rencontres de points et combats sur la ligne de temps."""
    day = 0
    encounters = []        # (jour, grammar_id)
    battles = []           # (jour, longueur, est_boss)
    zone_of_point = {}
    zone_first_day = {}
    for z in zones:
        d0, nd = day, z["days"]
        zone_first_day[z["zone_id"]] = d0
        for i, gid in enumerate(z["points"]):
            encounters.append((d0 + (i * nd) // max(1, len(z["points"])), gid))
            zone_of_point[gid] = z["zone_id"]
        nb = len(z["battles"])
        for i, b in enumerate(z["battles"]):
            bd = d0 + nd - 1 if b["boss"] else d0 + (i * nd) // max(1, nb)
            battles.append((bd, b["len"], b["boss"]))
        day += nd
    return encounters, battles, day, zone_of_point, zone_first_day


def weighted_sample_no_repl(rng, items, weights, k):
    chosen = []
    items = list(items)
    weights = list(weights)
    for _ in range(min(k, len(items))):
        tot = sum(weights)
        r = rng.random() * tot
        acc = 0.0
        for i, w in enumerate(weights):
            acc += w
            if r <= acc:
                chosen.append(items.pop(i))
                weights.pop(i)
                break
    return chosen


def simulate(zones, seed, p_route, p_boss, rematches_per_day=1,
             boost=BOOST_FACTOR, pool_cap_zones=None):
    """Une partie de 12 mois. Retourne l'historique de tirage par point."""
    rng = random.Random(seed)
    encounters, battles, content_days, zone_of_point, _ = build_schedule(zones)
    enc_by_day = defaultdict(list)
    for d, gid in encounters:
        enc_by_day[d].append(gid)
    battles_by_day = defaultdict(list)
    for d, ln, boss in battles:
        battles_by_day[d].append((ln, boss))

    zone_order = {z["zone_id"]: i for i, z in enumerate(zones)}
    first_seen = {}          # gid -> jour
    last_drawn = {}          # gid -> jour du dernier tirage (None si jamais)
    draws = defaultdict(list)  # gid -> [jours de tirage]
    grammar_q_by_day = defaultdict(int)
    beaten_route_trainers = 0
    zones_entered = 0

    def eligible_pool(day):
        pool = list(first_seen)
        if pool_cap_zones is not None:
            # plafond : seuls les points des N dernières zones entrées restent tirables
            cutoff = max(0, zones_entered - pool_cap_zones)
            pool = [g for g in pool if zone_order[zone_of_point[g]] >= cutoff]
        return pool

    def run_battle(day, length, is_boss):
        nonlocal beaten_route_trainers
        pool = eligible_pool(day)
        if not pool:
            return
        p = p_boss if is_boss else p_route
        n_gq = sum(1 for _ in range(length) if rng.random() < p)
        n_gq = min(n_gq, len(pool))  # sans remise dans le combat
        if n_gq == 0:
            return
        if is_boss:
            # rotation plus-anciens-d'abord sur last_drawn_at (jamais tiré = plus ancien)
            pool.sort(key=lambda g: (last_drawn.get(g) if last_drawn.get(g) is not None
                                     else first_seen[g] - 10000, rng.random()))
            picked = pool[:n_gq]
        else:
            ref = {g: (last_drawn[g] if last_drawn.get(g) is not None else first_seen[g])
                   for g in pool}
            w = [boost if day - ref[g] > STALE_DAYS else 1.0 for g in pool]
            picked = weighted_sample_no_repl(rng, pool, w, n_gq)
        for g in picked:
            draws[g].append(day)
            last_drawn[g] = day
        grammar_q_by_day[day] += len(picked)

    day_zone_boundary = set()
    d_acc = 0
    for z in zones:
        day_zone_boundary.add(d_acc)
        d_acc += z["days"]

    for day in range(SIM_DAYS):
        if day in day_zone_boundary and day < content_days:
            zones_entered += 1
        for gid in enc_by_day.get(day, []):
            first_seen[gid] = day
        for length, boss in battles_by_day.get(day, []):
            run_battle(day, length, boss)
            if not boss:
                beaten_route_trainers += 1
        # revanches téléphoniques (au plus 1 appel/jour au PRD ; scénarios >1 testés)
        if beaten_route_trainers > 0:
            for _ in range(rematches_per_day):
                run_battle(day, REMATCH_LEN, False)

    return {"first_seen": first_seen, "draws": dict(draws),
            "grammar_q_by_day": dict(grammar_q_by_day),
            "content_days": content_days, "zone_of_point": zone_of_point}


# ---------------------------------------------------------------- métriques

def classify(res, d0=0, d1=SIM_DAYS):
    """Catégories de fréquence sur la fenêtre [d0, d1) (par défaut : l'année)."""
    cats = {"never": 0, "lt_month": 0, "ge_month": 0, "ge_week": 0}
    for gid, fs in res["first_seen"].items():
        if fs >= d1:
            continue
        alive = max(1, d1 - max(fs, d0))
        n = sum(1 for d in res["draws"].get(gid, []) if d0 <= d < d1)
        if n == 0:
            cats["never"] += 1
        elif n / alive >= 1 / 7:
            cats["ge_week"] += 1
        elif n / alive >= 1 / 30:
            cats["ge_month"] += 1
        else:
            cats["lt_month"] += 1
    return cats


def intervals_of(res, gid):
    ds = res["draws"].get(gid, [])
    seq = [res["first_seen"][gid]] + ds
    return [b - a for a, b in zip(seq, seq[1:])]


def median_interval(res):
    means = []
    for gid in res["first_seen"]:
        iv = intervals_of(res, gid)
        if iv:
            means.append(sum(iv) / len(iv))
    return statistics.median(means) if means else None


def monthly_table(res):
    rows = []
    for m in range(12):
        d0, d1 = m * 30, min(SIM_DAYS, (m + 1) * 30)
        pool = sum(1 for fs in res["first_seen"].values() if fs < d1)
        gq = sum(v for d, v in res["grammar_q_by_day"].items() if d0 <= d < d1)
        # intervalles observés se terminant ce mois
        ivs = []
        for gid in res["first_seen"]:
            seq = [res["first_seen"][gid]] + res["draws"].get(gid, [])
            ivs += [b - a for a, b in zip(seq, seq[1:]) if d0 <= b < d1]
        med = statistics.median(ivs) if ivs else None
        exp_interval = (30 * pool / gq) if gq else None
        rows.append((m + 1, pool, gq, med, exp_interval))
    return rows


def lost_curve(res):
    """Premier jour où chaque point atteint 60 j sans re-vue ; cumul par mois."""
    lost_day = {}
    for gid, fs in res["first_seen"].items():
        seq = [fs] + res["draws"].get(gid, []) + [None]
        prev = fs
        for d in seq[1:]:
            end = d if d is not None else SIM_DAYS
            if end - prev >= LOST_GAP:
                lost_day[gid] = prev + LOST_GAP
                break
            prev = end if d is not None else prev
    cum = []
    for m in range(12):
        cum.append(sum(1 for d in lost_day.values() if d < (m + 1) * 30))
    stale_now = sum(1 for gid, fs in res["first_seen"].items()
                    if SIM_DAYS - max([fs] + res["draws"].get(gid, [])) >= LOST_GAP)
    return lost_day, cum, stale_now


def coverage_last_window(res, window=30):
    """Part des points tirés au moins une fois dans les `window` derniers jours."""
    pool = [g for g, fs in res["first_seen"].items() if fs < SIM_DAYS - window]
    if not pool:
        return None
    hit = sum(1 for g in pool
              if any(d >= SIM_DAYS - window for d in res["draws"].get(g, [])))
    return hit / len(pool)


def srs_comparison(res):
    """Si la grammaire était en SRS (type FSRS, réponses correctes)."""
    total_reviews = 0
    reviews_by_day = defaultdict(int)
    for gid, fs in res["first_seen"].items():
        d = fs
        for iv in SRS_INTERVALS:
            d += iv
            if d >= SIM_DAYS:
                break
            total_reviews += 1
            reviews_by_day[d] += 1
        else:
            while True:
                d += SRS_INTERVALS[-1]
                if d >= SIM_DAYS:
                    break
                total_reviews += 1
                reviews_by_day[d] += 1
    days_active = SIM_DAYS - min(res["first_seen"].values())
    peak = max(reviews_by_day.values()) if reviews_by_day else 0
    return total_reviews, total_reviews / days_active, peak


# ---------------------------------------------------------------- rapport

def avg(vals):
    vals = [v for v in vals if v is not None]
    return sum(vals) / len(vals) if vals else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--written", action="store_true",
                    help="corpus écrit (points[] des 25 zones écrites) au lieu de l'assignation complète")
    ap.add_argument("--seeds", type=int, default=5)
    args = ap.parse_args()

    zones = load_world(args.written)
    p_route, p_boss = WEIGHT_PROFILES[BASE_PROFILE]
    _, _, content_days, _, _ = build_schedule(zones)
    n_points_total = sum(len(z["points"]) for z in zones)
    johto_idx = NARRATIVE_ORDER.index(END_OF_JOHTO_ZONE)
    n_points_johto = sum(len(z["points"]) for z in zones[:johto_idx + 1])
    n_battles = sum(len(z["battles"]) for z in zones)
    n_boss = sum(1 for z in zones for b in z["battles"] if b["boss"])

    print("=" * 78)
    print("SIMULATION — re-rencontre des points de grammaire hors SRS (12 mois)")
    print("=" * 78)
    print(f"Corpus : {'écrit (25 zones)' if args.written else 'assignation complète'}"
          f" — {n_points_total} points sur {len(zones)} zones"
          f" (fin Johto : {n_points_johto} points)")
    print(f"Contenu : {n_battles} combats ({n_boss} boss), traversée totale "
          f"{content_days} jours, puis revanches seules jusqu'au jour {SIM_DAYS}")
    print(f"Poids grammaire : route {p_route:.0%}, boss {p_boss:.0%} "
          f"(G+C+M17/M18) ; boost x{BOOST_FACTOR} si >14 j ; revanche 15 q/jour")

    runs = [simulate(zones, s, p_route, p_boss) for s in range(args.seeds)]

    # ---- 2. distribution des fréquences
    print("\n--- (2) Distribution des fréquences de re-tirage "
          f"(moyenne sur {args.seeds} seeds)")
    for key, label in [("ge_week", ">= 1x/semaine"), ("ge_month", ">= 1x/mois (< 1x/sem)"),
                       ("lt_month", "< 1x/mois"), ("never", "jamais tiré en combat")]:
        vals = [classify(r)[key] for r in runs]
        m = avg(vals)
        print(f"  {label:<28} {m:6.1f} points ({m / n_points_total:6.1%})")
    ge1 = avg([sum(1 for g in r['first_seen'] if len(r['draws'].get(g, [])) <= 1)
               for r in runs])
    print(f"  (tirés 0 ou 1 fois en un an : {ge1:.0f} points, {ge1/n_points_total:.1%})")
    print("  Même classement, par phase :")
    for (a, b), lbl in [((0, content_days), f"phase contenu (j0-j{content_days})"),
                        ((content_days, SIM_DAYS),
                         f"phase revanches seules (j{content_days}-j{SIM_DAYS})")]:
        cats = {k: avg([classify(r, a, b)[k] for r in runs])
                for k in ("ge_week", "ge_month", "lt_month", "never")}
        tot = sum(cats.values())
        print(f"    {lbl:<40} >=1/sem {cats['ge_week']/tot:6.1%} | "
              f">=1/mois {cats['ge_month']/tot:6.1%} | "
              f"<1/mois {cats['lt_month']/tot:6.1%} | "
              f"jamais {cats['never']/tot:6.1%}")

    # ---- 3. intervalle médian + débit
    print(f"\n--- (3) Intervalle moyen entre deux tirages — médiane des points : "
          f"{avg([median_interval(r) for r in runs]):.0f} jours")
    print("  Mois | pool | q gram./mois | interv. médian observé | interv. théorique (pool/débit)")
    tables = [monthly_table(r) for r in runs]
    for m in range(12):
        pool = avg([t[m][1] for t in tables])
        gq = avg([t[m][2] for t in tables])
        med = avg([t[m][3] for t in tables])
        exp = avg([t[m][4] for t in tables])
        print(f"   M{m+1:<3}| {pool:5.0f}| {gq:9.0f}    | "
              f"{('%5.0f j' % med) if med else '    --'}              | "
              f"{('%6.0f j' % exp) if exp else '    --'}")
    for w, lbl in [(30, "mois"), (7, "semaine")]:
        c = avg([coverage_last_window(r, w) for r in runs])
        print(f"  Couverture réelle du pool sur le dernier {lbl} : {c:.1%}")

    # ---- 5a. points perdus (courbe d'oubli 60 j)
    print(f"\n--- (5) Points « perdus » (>= {LOST_GAP} j sans re-vue)")
    curves = [lost_curve(r) for r in runs]
    print("  Mois | perdus cumulés | % du pool final")
    for m in range(12):
        c = avg([cv[1][m] for cv in curves])
        print(f"   M{m+1:<3}| {c:8.0f}       | {c / n_points_total:6.1%}")
    stale = avg([cv[2] for cv in curves])
    print(f"  Points à >= 60 j sans re-vue AU jour 365 : {stale:.0f} "
          f"({stale / n_points_total:.1%})")

    # ---- 5b. comparaison SRS
    tot, per_day, peak = srs_comparison(runs[0])
    print(f"\n  Si la grammaire était en SRS (intervalles type FSRS "
          f"{SRS_INTERVALS}) :")
    print(f"    {tot} révisions sur l'année, ~{per_day:.1f}/jour en moyenne "
          f"(pic {peak}/jour) ; aucun point ne dépasse 60 j sans re-vue avant "
          f"stabilité 75 j → ~0 point perdu.")
    lost_end = avg([cv[1][11] for cv in curves])
    print(f"    Manque à gagner du refus SRS : {lost_end:.0f} points perdus "
          f"({lost_end / n_points_total:.1%}) contre ~0, pour un coût évité de "
          f"~{per_day:.1f} révisions/jour.")

    # ---- 4. sensibilité
    print("\n--- (4) Sensibilité — % du pool revu dans les 30 derniers jours "
          "(objectif 90 %)")
    print(f"  {'scénario':<58} {'couv. 30 j':>10} {'perdus fin':>11}")
    scenarios = []
    for prof, (pr, pb) in WEIGHT_PROFILES.items():
        scenarios.append((f"poids {prof}, 1 revanche/j", dict(p_route=pr, p_boss=pb)))
    for k in (2, 3, 5, 8):
        scenarios.append((f"poids base, {k} revanches/j",
                          dict(p_route=p_route, p_boss=p_boss, rematches_per_day=k)))
    for b in (1, 10):
        scenarios.append((f"poids base, boost x{b} (au lieu de x3)",
                          dict(p_route=p_route, p_boss=p_boss, boost=b)))
    for cap in (10, 5):
        scenarios.append((f"poids base, plafond pool = {cap} dernières zones",
                          dict(p_route=p_route, p_boss=p_boss, pool_cap_zones=cap)))
    scenarios.append(("poids double + 3 revanches/j",
                      dict(p_route=0.30, p_boss=0.40, rematches_per_day=3)))
    scenarios.append(("poids double + 5 revanches/j",
                      dict(p_route=0.30, p_boss=0.40, rematches_per_day=5)))
    scenarios.append(("poids triple + 5 revanches/j",
                      dict(p_route=0.45, p_boss=0.52, rematches_per_day=5)))
    scenarios.append(("poids triple + 8 revanches/j",
                      dict(p_route=0.45, p_boss=0.52, rematches_per_day=8)))
    n_sens_seeds = min(3, args.seeds)
    zone_index = {z["zone_id"]: i for i, z in enumerate(zones)}
    for label, kw in scenarios:
        rs = [simulate(zones, s, **{**dict(rematches_per_day=1, boost=BOOST_FACTOR,
                                           pool_cap_zones=None), **kw})
              for s in range(n_sens_seeds)]
        cov = avg([coverage_last_window(r, 30) for r in rs])
        lost = avg([lost_curve(r)[1][11] for r in rs])
        extra = ""
        cap = kw.get("pool_cap_zones")
        if cap:
            # couverture restreinte aux points encore dans la fenêtre plafonnée
            cvals = []
            for r in rs:
                inpool = [g for g in r["first_seen"]
                          if zone_index[r["zone_of_point"][g]] >= len(zones) - cap]
                hit = sum(1 for g in inpool
                          if any(d >= SIM_DAYS - 30 for d in r["draws"].get(g, [])))
                cvals.append(hit / len(inpool) if inpool else None)
            extra = f"  [dans la fenêtre plafonnée : {avg(cvals):.0%}]"
        print(f"  {label:<58} {cov:>9.1%} {lost:>7.0f} "
              f"({lost / n_points_total:.0%}){extra}")

    # borne analytique
    q_day_needed = n_points_total / 30
    print(f"\n  Borne analytique : couvrir {n_points_total} points 1x/mois exige "
          f">= {q_day_needed:.0f} questions grammaire/jour ;")
    q_day_actual = avg([sum(r['grammar_q_by_day'].values()) for r in runs]) / SIM_DAYS
    print(f"  débit réel moyen du design : {q_day_actual:.1f}/jour "
          f"(en régime revanches seules : {REMATCH_LEN * p_route:.1f}/jour).")

    # trajectoire d'un point médian, pour illustration (seed 0)
    r0 = runs[0]
    pts = sorted(r0["first_seen"], key=lambda g: len(r0["draws"].get(g, [])))
    gid = pts[len(pts) // 2]
    print(f"\n  Exemple — point médian {gid} (zone {r0['zone_of_point'][gid]}) : "
          f"rencontré j{r0['first_seen'][gid]}, tirages aux jours "
          f"{r0['draws'].get(gid, [])}")


if __name__ == "__main__":
    main()
