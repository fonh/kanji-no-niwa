#!/usr/bin/env python3
"""Simulation de la charge de révision FSRS sur toute la durée de Kanji no Niwa.

Vérifie le chiffre « ~300-380 révisions/jour en régime de croisière (≈1h/jour) »
annoncé dans PRD.md § Système SRS (« Rythme et charge assumés ») mais jamais calculé.

Modèle (sources réelles du repo) :
- Leçons : content/lessons/<zone>.json (36 zones écrites) puis
  content/lessons-proposal.json (12 zones restantes), dans l'ordre NARRATIVE_ORDER
  de scripts/validate/calc-cs-corpus.py + l'ordre du tableau de .scratch/etape4-progress.md.
  1 leçon/jour. Les 189 joyo absents des leçons (mt-silver-summit non budgété)
  sont ajoutés en leçons synthétiques de 6 à la fin pour atteindre les 2136 du PRD.
- Kanji : 2 cartes chacun, dues à partir du lendemain de la leçon (PRD § timing).
- Mots : scripts/sources/yomitan-jlpt (8113 mots JLPT). 6935 ne contiennent que
  des joyo -> débloqués quand TOUS leurs kanji sont étudiés, en file le lendemain.
  876 mots kana-only (aucune règle dans le PRD) -> injectés au goutte-à-goutte
  uniforme sur la période des leçons. 302 mots avec kanji hors joyo -> exclus.
  2 cartes par mot.
- FSRS-4.5, formules publiques, w[] par défaut, rétention désirée 0.9.
- Notes : 80% Good / 10% Again / 7% Hard / 3% Easy (variante pessimiste 70/20/7/3).
  Un Again compte 2 reviews le jour même (échec + étape de réapprentissage).

Scénarios : référence 7j/7 ; leçons 5j/7 ; pessimiste ; absence 7 j au jour 300
avec plafond de rattrapage 200 cartes/jour (PRD) ; balayage d'un plafond
d'introduction de mots/jour.
"""
import json
import glob
import math
import os
import random
import statistics
import sys
from collections import defaultdict

ROOT = "/Users/henrifontanille/Documents/pokedex_kanji"

# ---------------------------------------------------------------- FSRS-4.5 ---
W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031,
     1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755]
DECAY = -0.5
FACTOR = 19.0 / 81.0
RETENTION = 0.9

def retrievability(t, s):
    return (1.0 + FACTOR * t / s) ** DECAY

def next_interval(s):
    ivl = s / FACTOR * (RETENTION ** (1.0 / DECAY) - 1.0)
    return max(1, round(ivl))

def init_difficulty(g):
    return min(10.0, max(1.0, W[4] - (g - 3) * W[5]))

def next_difficulty(d, g):
    dn = d - W[6] * (g - 3)
    dn = W[7] * init_difficulty(3) + (1 - W[7]) * dn  # mean reversion
    return min(10.0, max(1.0, dn))

def stability_success(d, s, r, g):
    hard = W[15] if g == 2 else 1.0
    easy = W[16] if g == 4 else 1.0
    return s * (math.exp(W[8]) * (11 - d) * s ** (-W[9])
                * (math.exp(W[10] * (1 - r)) - 1) * hard * easy + 1)

def stability_forget(d, s, r):
    sf = (W[11] * d ** (-W[12]) * ((s + 1) ** W[13] - 1)
          * math.exp(W[14] * (1 - r)))
    return min(sf, s)

# ---------------------------------------------------------------- Données ----
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
    "route-8-kanto", "route-9-10-rocktunnel", "lavender-town",
    "kanto-power-plant", "cerulean-city", "route-24-25-kanto",
]
REMAINING = [
    "celadon-city", "route-16-17-18-cycling-road", "fuchsia-city",
    "route-14-15-kanto", "route-11-12-13-diglett", "pewter-city",
    "mont-lune-route-3-4", "route-2-foret-viridian", "viridian-city",
    "route-1-kanto", "pallet-town", "mt-silver-route-28",
]

def load_lessons():
    """Retourne la liste ordonnée des leçons: [(zone_id, [kanji...]), ...]."""
    written = {os.path.basename(f)[:-5]
               for f in glob.glob(ROOT + "/content/lessons/*.json")}
    prop = json.load(open(ROOT + "/content/lessons-proposal.json"))
    prop_zones = defaultdict(list)
    for z in prop["zones"]:
        prop_zones[z["zone_id"]].append(z)
    lessons = []
    for zone in NARRATIVE_ORDER + REMAINING:
        if zone in written:
            zl = json.load(open(ROOT + f"/content/lessons/{zone}.json"))
        else:
            zl = prop_zones.get(zone, [])
        for l in sorted(zl, key=lambda x: x["sequence_index"]):
            lessons.append((zone, list(l["kanji_ids"])))
    # kanji joyo absents des leçons -> leçons synthétiques de 6 à la fin
    kza = json.load(open(ROOT + "/content/kanji-zone-assignment.json"))
    seen = set()
    for _, ks in lessons:
        seen.update(ks)
    missing = [k for k in kza["ordered_kanji"] if k not in seen]
    for i in range(0, len(missing), 6):
        lessons.append(("mt-silver-summit-synthetic", missing[i:i + 6]))
    return lessons

def load_words(kanji_set):
    """Retourne (mots_kanji: [(mot, frozenset kanji)], nb_kana_only)."""
    words_kanji, kana_only = [], 0
    for f in sorted(glob.glob(ROOT + "/scripts/sources/yomitan-jlpt/term_meta_bank_*.json")):
        for t in json.load(open(f)):
            w = t[0]
            ks = frozenset(c for c in w if c in kanji_set)
            non_joyo = any(0x4E00 <= ord(c) <= 0x9FFF and c not in kanji_set
                           for c in w)
            if non_joyo:
                continue  # jamais débloquable
            if ks:
                words_kanji.append((w, ks))
            else:
                kana_only += 1
    return words_kanji, kana_only

# ---------------------------------------------------------------- Simulation -
GOOD_DIST = [(1, 0.10), (2, 0.07), (3, 0.80), (4, 0.03)]
PESS_DIST = [(1, 0.20), (2, 0.07), (3, 0.70), (4, 0.03)]

def sample_grade(rng, dist):
    x = rng.random()
    acc = 0.0
    for g, p in dist:
        acc += p
        if x < acc:
            return g
    return 3

class Card:
    __slots__ = ("s", "d", "last", "due", "new")
    def __init__(self, due):
        self.s = None
        self.d = None
        self.last = None
        self.due = due
        self.new = True

def simulate(lessons, words_kanji, n_kana, *, horizon=550, seed=42,
             dist=GOOD_DIST, lesson_days="7/7", absence=None,
             backlog_cap=None, word_cap=None):
    """Retourne dict de séries journalières.

    lesson_days: "7/7" ou "5/7" (leçons lun-ven seulement, jour 0 = lundi).
    absence: (start, length) jours sans aucune session.
    backlog_cap: plafond de rattrapage PRD (200) — actif uniquement à partir du
      retour d'absence, et désactivé dès que la file repasse <= cap (one-shot).
      En jeu normal, « pas de plafond quotidien » (PRD).
    word_cap: si non None, max de mots introduits/jour (file FIFO).
    """
    rng = random.Random(seed)
    # jours de leçon
    lesson_schedule = {}  # day -> lesson index
    li, day = 0, 0
    while li < len(lessons):
        is_lesson_day = (lesson_days == "7/7") or (day % 7 < 5)
        if absence and absence[0] <= day < absence[0] + absence[1]:
            is_lesson_day = False
        if is_lesson_day:
            lesson_schedule[day] = li
            li += 1
        day += 1
    last_lesson_day = max(lesson_schedule) if lesson_schedule else 0

    # index mot -> dernier kanji requis
    kanji_lesson_idx = {}
    for i, (_, ks) in enumerate(lessons):
        for k in ks:
            kanji_lesson_idx.setdefault(k, i)
    word_unlock_lesson = []  # (lesson_idx qui débloque, mot)
    for w, ks in words_kanji:
        word_unlock_lesson.append(max(kanji_lesson_idx[k] for k in ks))
    words_by_lesson = defaultdict(int)
    for ul in word_unlock_lesson:
        words_by_lesson[ul] += 1
    # kana-only: goutte-à-goutte uniforme sur la période des leçons
    kana_per_day = n_kana / (last_lesson_day + 1)

    cards = []
    due_by_day = defaultdict(list)  # day -> [card indices] (première mise en file)
    kana_acc = 0.0
    word_queue_pending = 0  # mots débloqués en attente si word_cap

    reviews = [0] * (horizon + 1)
    news = [0] * (horizon + 1)
    backlog_series = [0] * (horizon + 1)
    words_intro = [0] * (horizon + 1)

    overdue = []  # cartes en retard (indices), FIFO par due
    cap_active = False
    cap_done = False  # le plafond ne sert qu'une fois (récupération post-absence)

    def add_cards(n, due_day):
        for _ in range(n):
            c = Card(due_day)
            cards.append(c)
            due_by_day[due_day].append(len(cards) - 1)

    pending_words = 0
    for today in range(horizon + 1):
        in_absence = absence and absence[0] <= today < absence[0] + absence[1]
        # 1. leçon du jour -> cartes kanji dues demain, mots débloqués dus demain
        if today in lesson_schedule:
            lidx = lesson_schedule[today]
            nk = len(lessons[lidx][1])
            add_cards(nk * 2, today + 1)
            news[today] += nk * 2
            pending_words += words_by_lesson.get(lidx, 0)
        # kana drip
        if today <= last_lesson_day and not in_absence:
            kana_acc += kana_per_day
            take = int(kana_acc)
            kana_acc -= take
            pending_words += take
        # introduction des mots (plafond éventuel)
        if not in_absence and pending_words > 0:
            take = pending_words if word_cap is None else min(pending_words, word_cap)
            add_cards(take * 2, today + 1)
            news[today] += take * 2
            words_intro[today] = take
            pending_words -= take

        # 2. file du jour = cartes dues aujourd'hui ou en retard
        queue = overdue + due_by_day.pop(today, [])
        backlog_series[today] = len(queue)
        if in_absence:
            overdue = queue
            continue
        # plafond de rattrapage (uniquement en récupération post-absence)
        if (absence and backlog_cap is not None and not cap_done
                and today >= absence[0] + absence[1]):
            cap_active = True
        if cap_active and len(queue) <= backlog_cap:
            cap_active = False
            cap_done = True
        todo = queue
        if cap_active and len(queue) > backlog_cap:
            todo, overdue = queue[:backlog_cap], queue[backlog_cap:]
        else:
            overdue = []
        # 3. reviews
        n_rev = 0
        for ci in todo:
            c = cards[ci]
            g = sample_grade(rng, dist)
            n_rev += 1
            if c.new:
                c.s = W[g - 1]
                c.d = init_difficulty(g)
                c.new = False
                if g == 1:
                    n_rev += 1  # étape de réapprentissage le jour même
            else:
                t = max(1, today - c.last)
                r = retrievability(t, c.s)
                c.d = next_difficulty(c.d, g)
                if g == 1:
                    c.s = stability_forget(c.d, c.s, r)
                    n_rev += 1
                else:
                    c.s = stability_success(c.d, c.s, r, g)
            c.last = today
            c.due = today + next_interval(c.s)
            due_by_day[c.due].append(ci)
        reviews[today] = n_rev

    return {"reviews": reviews, "news": news, "backlog": backlog_series,
            "words_intro": words_intro, "lesson_schedule": lesson_schedule,
            "last_lesson_day": last_lesson_day, "n_cards": len(cards)}

# ---------------------------------------------------------------- Rapports ---
def rolling(xs, w=7):
    out = []
    for i in range(len(xs)):
        lo = max(0, i - w + 1)
        out.append(sum(xs[lo:i + 1]) / (i - lo + 1))
    return out

def monthly_table(res, horizon=550):
    rows = []
    rv = res["reviews"]
    nw = res["news"]
    for m in range(0, horizon // 30 + (1 if horizon % 30 else 0)):
        lo, hi = m * 30 + 1, min((m + 1) * 30, horizon)
        if lo > horizon:
            break
        seg = rv[lo:hi + 1]
        rows.append((m + 1, lo, hi, statistics.mean(seg), max(seg),
                     statistics.mean(nw[lo:hi + 1])))
    return rows

def first_crossing(series, threshold, w=7):
    roll = rolling(series, w)
    for i, v in enumerate(roll):
        if v >= threshold:
            return i
    return None

def fmt_table(rows):
    print(f"{'Mois':>4} {'Jours':>9} {'Rev/j moy':>10} {'Pic':>6} {'Nouv/j':>7}")
    for m, lo, hi, mean, peak, newm in rows:
        print(f"{m:>4} {lo:>4}-{hi:<4} {mean:>10.0f} {peak:>6.0f} {newm:>7.1f}")

def main():
    horizon = 550
    lessons = load_lessons()
    kanji_set = set()
    for _, ks in lessons:
        kanji_set.update(ks)
    words_kanji, n_kana = load_words(kanji_set)
    total_words = len(words_kanji) + n_kana
    print(f"Leçons: {len(lessons)} (dont {sum(1 for z,_ in lessons if z=='mt-silver-summit-synthetic')} synthétiques fin de jeu)")
    print(f"Kanji: {len(kanji_set)} -> {len(kanji_set)*2} cartes")
    print(f"Mots: {len(words_kanji)} à kanji + {n_kana} kana-only = {total_words} -> {total_words*2} cartes")
    print(f"Total cartes: {len(kanji_set)*2 + total_words*2}")

    scenarios = {}
    # moyenne sur 3 graines pour la robustesse
    def run_avg(name, **kw):
        runs = [simulate(lessons, words_kanji, n_kana, horizon=horizon,
                         seed=s, **kw) for s in (42, 7, 2026)]
        base = runs[0]
        avg = dict(base)
        avg["reviews"] = [statistics.mean(r["reviews"][i] for r in runs)
                          for i in range(horizon + 1)]
        avg["news"] = base["news"]
        avg["backlog"] = [statistics.mean(r["backlog"][i] for r in runs)
                          for i in range(horizon + 1)]
        scenarios[name] = avg
        return avg

    ref = run_avg("reference (7j/7, 80/10/7/3)")
    run_avg("lecons 5j/7", lesson_days="5/7")
    run_avg("pessimiste (70/20/7/3)", dist=PESS_DIST)
    run_avg("absence 7j au jour 300", absence=(300, 7), backlog_cap=200)

    for name, res in scenarios.items():
        print("\n" + "=" * 72)
        print(f"SCENARIO : {name}")
        print("=" * 72)
        fmt_table(monthly_table(res, horizon))
        rv = res["reviews"]
        roll = rolling(rv)
        for th in (300, 400, 500):
            d = first_crossing(rv, th)
            print(f"  moyenne 7j >= {th}: " + (f"jour {d}" if d else "jamais"))
        # régime de croisière = derniers 120 jours de leçons
        lld = res["last_lesson_day"]
        cruise = rv[max(1, lld - 120):min(lld, horizon) + 1]
        print(f"  dernier jour de leçon: {lld}")
        print(f"  croisière (120 derniers jours de leçons): moy {statistics.mean(cruise):.0f}, "
              f"p90 {sorted(cruise)[int(len(cruise)*0.9)]:.0f}, max {max(cruise):.0f}")
        peak_day = max(range(1, horizon + 1), key=lambda i: roll[i])
        print(f"  pic de moyenne 7j: {roll[peak_day]:.0f} au jour {peak_day}")
        tot = sum(rv[1:horizon + 1])
        print(f"  total reviews sur {horizon} j: {tot:.0f}")
        m = statistics.mean(rv[150:min(horizon, lld) + 1])
        print(f"  temps/jour en croisière à 6-8 s/carte: "
              f"{statistics.mean(cruise)*6/60:.0f}-{statistics.mean(cruise)*8/60:.0f} min")

    # ---- effet du mur Kanto (vermilion-city, 30 leçons de 6) ----
    print("\n" + "=" * 72)
    print("MUR KANTO (Carmin / vermilion-city)")
    print("=" * 72)
    ref_sched = ref["lesson_schedule"]
    verm_days = [d for d, li in ref_sched.items() if lessons[li][0] == "vermilion-city"]
    v0, v1 = min(verm_days), max(verm_days)
    print(f"Leçons Carmin: jours {v0}-{v1} ({len(verm_days)} leçons)")
    rv = ref["reviews"]
    before = statistics.mean(rv[v0 - 30:v0])
    during = statistics.mean(rv[v0:v1 + 1])
    after = statistics.mean(rv[v1 + 1:v1 + 31])
    after60 = statistics.mean(rv[v1 + 31:v1 + 61])
    print(f"Rev/j: 30j avant {before:.0f} | pendant {during:.0f} | "
          f"30j après {after:.0f} | j+31..60 {after60:.0f}")
    wi = simulate(lessons, words_kanji, n_kana, horizon=horizon, seed=42)["words_intro"]
    print(f"Mots débloqués/j: 30j avant {statistics.mean(wi[v0-30:v0]):.1f} | "
          f"pendant {statistics.mean(wi[v0:v1+1]):.1f} | 30j après {statistics.mean(wi[v1+1:v1+31]):.1f}")

    # ---- absence: backlog ----
    print("\n" + "=" * 72)
    print("ABSENCE 7 JOURS AU JOUR 300 (plafond rattrapage 200)")
    print("=" * 72)
    ab = scenarios["absence 7j au jour 300"]
    bk = ab["backlog"]
    print(f"File au retour (jour 307): {bk[307]:.0f} cartes")
    over_days = [d for d in range(307, horizon) if bk[d] > 200]
    print(f"Jours avec file > 200 après retour: {len(over_days)} "
          f"(retour à la normale au jour {max(over_days)+1 if over_days else 307})")
    print(f"Rev/j jours 307-320: {[round(ab['reviews'][d]) for d in range(307, 321)]}")

    # ---- plafond d'introduction de mots ----
    print("\n" + "=" * 72)
    print("PLAFOND D'INTRODUCTION DE MOTS (référence, moyenne 7j max)")
    print("=" * 72)
    for cap in (None, 25, 20, 15, 12, 10):
        res = simulate(lessons, words_kanji, n_kana, horizon=horizon,
                       seed=42, word_cap=cap)
        roll = rolling(res["reviews"])
        pk = max(roll[1:])
        lld = res["last_lesson_day"]
        cruise = statistics.mean(res["reviews"][max(1, lld-120):lld+1])
        # mots restants en file à la fin
        intro_tot = sum(res["words_intro"])
        label = "aucun" if cap is None else f"{cap:>5}"
        print(f"cap {label} mots/j: pic moy7j {pk:>4.0f} | croisière {cruise:>4.0f} | "
              f"mots introduits/{total_words} au jour {horizon}: {intro_tot}")

if __name__ == "__main__":
    main()
