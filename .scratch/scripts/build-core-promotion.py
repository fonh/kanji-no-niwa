#!/usr/bin/env python3
"""Étape 4 phase 1 — build the core N5/N4 promotion list.
Produces content/kanji-core-promotion.json. Read-only on kanji-zone-assignment.json
(the actual swap is applied by a separate script, apply-core-promotion.py)."""
import json
import heapq
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NOISE_COMPONENTS = {"乞"}  # spurious in this kradfile parse (appears in 8+ unrelated kanji)


def load_components():
    data = (ROOT / "scripts/sources/kradfile").read_bytes().decode("euc-jp")
    lines = [l for l in data.splitlines() if l and not l.startswith("#")]
    comps = {}
    for l in lines:
        parts = l.split(":")
        if len(parts) != 2:
            continue
        k = parts[0].strip()
        comps[k] = [c for c in parts[1].split() if c not in NOISE_COMPONENTS and c != k]
    return comps


def main():
    d = json.loads((ROOT / "content/kanji-zone-assignment.json").read_text())
    order = d["ordered_kanji"]
    pos = {k: i for i, k in enumerate(order)}

    components = load_components()
    dependents = {}
    for x, comps in components.items():
        for c in comps:
            dependents.setdefault(c, set()).add(x)

    joyo = json.loads((ROOT / "scripts/sources/joyo-list.json").read_text())
    jlpt_map = {k["char"]: k["jlpt"] for k in joyo}
    meanings_map = {k["char"]: k["meanings"] for k in joyo}

    # Scoped to the CATASTROPHIC tier only (position >= 1000 — the two clusters the
    # review actually complained about, 1362-1427 and 1990-2123) plus the review's own
    # headline examples (本/学, which sit slightly earlier at 559/561). Deliberately NOT
    # promoting the "merely late" 545-661 tier (117 more N5/N4 kanji) in this pass: a
    # first full-budget run (169 promotions) would have rewritten up to 50 kanji inside
    # a single already-shipped zone (blackthorn-city) — disproportionate to "correction
    # ciblée, pas une refonte totale". This scoped pass still fixes every kanji the
    # audit named, at a fraction of the already-written-content rework.
    FORCE_FIRST = ["本", "学", "時", "年", "校", "何"]
    CATASTROPHIC_THRESHOLD = 1000
    promo_candidates = [k for k in order if jlpt_map.get(k) in ("N5", "N4")
                         and (pos[k] >= CATASTROPHIC_THRESHOLD or k in FORCE_FIRST)]
    promo_candidates.sort(key=lambda k: (k not in FORCE_FIRST, -pos[k]))

    WRITTEN_ZONES = set("""new-bark-town route-29 cherrygrove-city route-30 route-31 violet-city
        sprout-tower route-32 ruins-of-alph azalea-town ilex-forest goldenrod-city national-park
        route-36 route-37 ecruteak-city route-39 olivine-city cianwood-city route-42 mahogany-town
        route-43 lake-of-rage blackthorn-city dragons-den dark-cave route-26 route-27
        indigo-plateau-antichambre vermilion-city route-6-kanto saffron-city route-9-10-rocktunnel
        lavender-town kanto-power-plant cerulean-city route-24-25-kanto""".split())
    zone_ranges = json.loads((ROOT / "content/kanji-zone-assignment.json").read_text())["zones"]

    def zone_for_position(p):
        for z in zone_ranges:
            if z["cumulative_start"] <= p < z["cumulative_end"]:
                return z["zone_id"]
        return None

    # Cap how many kanji can be demoted out of any single ALREADY-WRITTEN zone — an
    # earlier unbounded run gutted route-32 (19 of its 20 kanji swapped out, i.e. its
    # entire already-written lesson content). Positions <300 are almost entirely inside
    # already-written zones (there's no way around that — that's where the fix has to
    # land), so the only lever is bounding how much any one zone gets rewritten.
    PER_ZONE_CAP = 3
    zone_demote_count = {}
    demote_pool_all = [k for k in order[:300] if jlpt_map.get(k) in ("N1", "N2", "N3")
                        and len(dependents.get(k, set())) == 0]
    demote_pool = []
    for k in demote_pool_all:
        z = zone_for_position(pos[k])
        if z in WRITTEN_ZONES:
            if zone_demote_count.get(z, 0) >= PER_ZONE_CAP:
                continue
            zone_demote_count[z] = zone_demote_count.get(z, 0) + 1
        demote_pool.append(k)
    BUDGET = len(demote_pool)
    demote_set_available = set(demote_pool)

    # Greedily build the promoted set (worst offenders first), cascading in any
    # component that is currently at position >= 300 (needs promoting too to keep
    # the "component before compound" invariant satisfiable within <300).
    promoted_set = set()
    promoted_order_pref = []  # discovery order, just for candidate selection

    def try_add(k, trail):
        if k in promoted_set:
            return True
        if len(promoted_set) >= BUDGET:
            return False
        trail = trail | {k}
        needed = [c for c in components.get(k, [])
                  if c in pos and pos[c] >= 300 and c not in promoted_set and c not in trail]
        for c in needed:
            if not try_add(c, trail):
                return False
        if len(promoted_set) >= BUDGET:
            return False
        promoted_set.add(k)
        promoted_order_pref.append(k)
        return True

    deferred = []
    for k in promo_candidates:
        if k in promoted_set:
            continue
        if not try_add(k, set()):
            deferred.append(k)

    n = len(promoted_set)
    demoted = demote_pool[:n]
    target_slots = sorted(pos[d] for d in demoted)

    # Fixed lower bound for each promoted kanji: max position among its components
    # that are NOT part of the promoted set (i.e. stay exactly where they are).
    fixed_lower_bound = {}
    for k in promoted_set:
        lb = -1
        for c in components.get(k, []):
            if c in promoted_set:
                continue  # handled by topological edge below
            if c in pos:
                lb = max(lb, pos[c])
        fixed_lower_bound[k] = lb

    # Topological (Kahn's) assignment: process kanji whose in-set dependencies are
    # already assigned, in order of increasing fixed lower bound, handing out the
    # smallest remaining target slot that is strictly greater than the lower bound.
    in_edges = {k: set() for k in promoted_set}  # k depends on these (must come after)
    out_edges = {k: set() for k in promoted_set}
    for k in promoted_set:
        for c in components.get(k, []):
            if c in promoted_set:
                in_edges[k].add(c)
                out_edges[c].add(k)

    indegree = {k: len(in_edges[k]) for k in promoted_set}
    ready = [(fixed_lower_bound[k], k) for k in promoted_set if indegree[k] == 0]
    heapq.heapify(ready)

    remaining_slots = list(target_slots)
    new_pos = {}
    unassigned = []

    while ready:
        lb, k = heapq.heappop(ready)
        # effective lower bound also considers assigned in-set dependencies
        eff_lb = max([lb] + [new_pos[c] for c in in_edges[k] if c in new_pos] or [lb])
        # find smallest remaining slot > eff_lb
        chosen = None
        for i, s in enumerate(remaining_slots):
            if s > eff_lb:
                chosen = i
                break
        if chosen is None:
            unassigned.append(k)
        else:
            new_pos[k] = remaining_slots.pop(chosen)
        for nxt in out_edges[k]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                heapq.heappush(ready, (fixed_lower_bound[nxt], nxt))

    # Anything left over (cycle or no free slot) drops to deferred.
    for k in unassigned:
        promoted_set.discard(k)
        deferred.append(k)

    promoted = [k for k in promoted_order_pref if k in new_pos]
    n = len(promoted)
    demoted = demoted[:n] if len(demoted) > n else demoted
    # Recompute demoted list to exactly match consumed target slots + remaining leftovers.
    used_targets = set(new_pos.values())
    demoted = [k for k in demote_pool if pos[k] in used_targets]
    # demoted kanji take over the vacated (old) positions of the kanji actually promoted
    vacated = sorted(pos[p] for p in promoted)
    dem_new_pos = {}
    for dem_k, target in zip(sorted(demoted, key=lambda k: pos[k]), vacated):
        dem_new_pos[dem_k] = target
    new_pos.update(dem_new_pos)

    def effective_pos(k):
        return new_pos.get(k, pos.get(k))

    violations = []
    for k in promoted:
        for c in components.get(k, []):
            cp = effective_pos(c)
            if cp is None:
                continue
            if cp >= new_pos[k]:
                violations.append((k, new_pos[k], c, cp))

    print(f"Promotion candidates found: {len(promo_candidates)}")
    print(f"Demotion budget (zero-dependent slots <300): {BUDGET}")
    print(f"Promoted (incl. cascaded components): {n}")
    print(f"Deferred: {len(deferred)}")
    print(f"Remaining component-order violations: {len(violations)}")
    for v in violations[:30]:
        print("  VIOLATION", v)

    out = {
        "_note": (
            "Étape 4 phase 1 — décision de design du 2026-07-23/24 (double revue "
            "prof+game designer). Corrige le défaut mesuré : l'ordre 'par composants' de "
            "kanji-zone-assignment.json place des kanji rares (ex. 彙/513, 鬱/544, 朕/1166) "
            "avant des mots basiques constamment utilisés en dialogue (本/561, 学/559, "
            "時/1369, 年/1362, 校/1363, 何/1990). Echange par PAIRES A TAILLE CONSTANTE : "
            "chaque kanji promu prend la position d'un kanji démis, ordre topologique "
            "(Kahn) respectant les composants — un promu qui a lui-même besoin d'un "
            "composant tardif (ex. 話/説/試 → 言 ; 道/週/運 → 込 ; 質/員/買/頭 → 貝 ; "
            "働/使 → 化) voit ce composant promu EN CASCADE avant lui, dans le même "
            "budget. Pool de démotion restreint aux kanji N1/N2/N3 < position 300 qui "
            "n'apparaissent comme composant kradfile d'AUCUN autre kanji du corpus entier "
            "(2136) — aucun risque de casser une chaîne de prérequis en les repoussant "
            "plus tard. Composant '乞' traité comme bruit de kradfile (associé à 8+ kanji "
            "sans rapport plausible — 知/医/年/族/短/午/教/答 — vraisemblablement un "
            "artefact de forme de trait partagée, pas une vraie décomposition ; ignoré "
            "dans le graphe de dépendances). Script : .scratch/scripts/"
            "build-core-promotion.py (lecture seule) — l'application réelle du swap est "
            "faite par scripts/build/apply-core-promotion.py (0.6/1.4)."
        ),
        "promotion_count": n,
        "deferred_count": len(deferred),
        "promotions": sorted([
            {
                "kanji": k,
                "jlpt": jlpt_map.get(k),
                "meaning": "/".join(meanings_map.get(k, [])[:2]),
                "old_position": pos[k],
                "new_position": new_pos[k],
                "cascaded_component": pos[k] < 300,
            }
            for k in promoted
        ], key=lambda r: r["new_position"]),
        "demotions": sorted([
            {
                "kanji": k,
                "jlpt": jlpt_map.get(k),
                "meaning": "/".join(meanings_map.get(k, [])[:2]),
                "old_position": pos[k],
                "new_position": new_pos[k],
            }
            for k in demoted
        ], key=lambda r: r["new_position"]),
        "deferred": [
            {
                "kanji": k,
                "jlpt": jlpt_map.get(k),
                "meaning": "/".join(meanings_map.get(k, [])[:2]),
                "old_position": pos[k],
                "note": "budget de démotion sûre épuisé, ou composant tardif non résolu "
                        "dans le budget — reporté à une passe future.",
            }
            for k in deferred
        ],
    }
    (ROOT / "content/kanji-core-promotion.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=1) + "\n"
    )
    print("Written content/kanji-core-promotion.json")


if __name__ == "__main__":
    main()
