#!/usr/bin/env python3
"""Étape 4 phase 1 — build the core N5/N4 promotion list.
Produces content/kanji-core-promotion.json. Read-only on kanji-zone-assignment.json
(the actual swap is applied by a separate script, apply-core-promotion.py).

**DO NOT re-run this after apply-core-promotion.py has already applied its output.**
It reads content/kanji-zone-assignment.json fresh every time — if that file already
reflects an applied swap, this script computes candidates against the ALREADY-SWAPPED
positions instead of the original ones, silently producing a different, wrong result
that no longer matches what's actually in the game data (this happened once, 2026-07-24
— see content/kanji-core-promotion.json's _note and .scratch/scripts/
reconcile-core-promotion-json.py, the repair script). If you need to change the
promotion logic after a swap is already applied, revert the structural files to their
pre-swap state first (git checkout <pre-phase-1 commit> -- content/kanji-zone-assignment.json
content/lessons-proposal.json content/lessons/*.json content/npc-inventory.md), THEN
edit and re-run this script, THEN re-run apply-core-promotion.py."""
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
    all_n5n4_late = [k for k in order if jlpt_map.get(k) in ("N5", "N4") and pos[k] >= 300]
    promo_candidates = [k for k in order if jlpt_map.get(k) in ("N5", "N4")
                         and (pos[k] >= CATASTROPHIC_THRESHOLD or k in FORCE_FIRST)]
    promo_candidates.sort(key=lambda k: (k not in FORCE_FIRST, -pos[k]))

    # BUG FOUND ON REVIEW (2026-07-24, Japanese-teacher pass): an earlier version of
    # this script capped demotions using a hand-typed WRITTEN_ZONES list meant to mean
    # "already-written zones with real lesson content to protect" — but it wrongly
    # included several zones (route-33, route-34, route-35, slowpoke-well) that have
    # NO lessons-proposal.json entry at all (one of the "35 zones sans leçon"). Their
    # positions fall inside the same <300 window as real lesson zones, so 45 of 69
    # promoted kanji — including 学/本/年/校/何/時, 4 of the audit's 6 headline
    # examples — landed on a position with no PNJ lesson to actually teach them: the
    # fix looked applied (kanji-zone-assignment.json reordered) but was inert for the
    # player (no lesson_examples, no lesson entry anywhere). Root cause: eligibility
    # must be grounded in the real lessons-proposal.json zone set, not a hand-typed
    # list — a promoted kanji's target position is only useful if a lesson actually
    # lives there.
    lessons_proposal = json.loads((ROOT / "content/lessons-proposal.json").read_text())
    LESSON_ZONES = {e["zone_id"] for e in lessons_proposal["zones"]}
    zone_ranges = json.loads((ROOT / "content/kanji-zone-assignment.json").read_text())["zones"]

    def zone_for_position(p):
        for z in zone_ranges:
            if z["cumulative_start"] <= p < z["cumulative_end"]:
                return z["zone_id"]
        return None

    # Cap how many kanji can be demoted out of any single lesson-bearing zone — an
    # earlier unbounded run gutted route-32 (19 of its 20 kanji swapped out, i.e. its
    # entire already-written lesson content). Positions <300 are almost entirely inside
    # already-written zones (there's no way around that — that's where the fix has to
    # land), so the only lever is bounding how much any one zone gets rewritten. A
    # demotion target that ISN'T in a lesson zone is excluded outright (see bug note
    # above) rather than merely uncapped.
    # Raised 3->5 after the LESSON_ZONES fix: restricting the pool to real lesson zones
    # already shrank the safe-slot budget to 124 across just 8 zones (goldenrod-city 25,
    # violet-city 20, route-32 19, ilex-forest 18, ruins-of-alph 15, azalea-town 12,
    # sprout-tower 9, route-31 6) — a flat cap of 3 left only 22 total slots and dropped
    # 時 (one of the audit's 6 headline kanji) for lack of room. 5/<zone size> stays well
    # under the disproportionate-rewrite threshold that motivated capping in the first
    # place (route-32 5/20=25%, goldenrod-city 5/50=10%) except sprout-tower (5/10=50%,
    # a small zone; accepted since its pool is only 9-10 kanji either way).
    PER_ZONE_CAP = 5
    zone_demote_count = {}
    demote_pool_all = [k for k in order[:300] if jlpt_map.get(k) in ("N1", "N2", "N3")
                        and len(dependents.get(k, set())) == 0]
    demote_pool = []
    for k in demote_pool_all:
        z = zone_for_position(pos[k])
        if z not in LESSON_ZONES:
            continue
        if zone_demote_count.get(z, 0) >= PER_ZONE_CAP:
            continue
        zone_demote_count[z] = zone_demote_count.get(z, 0) + 1
        demote_pool.append(k)
    BUDGET = len(demote_pool)
    demote_set_available = set(demote_pool)
    # The real ceiling a promoted kanji can land under is the HIGHEST available target
    # slot (bounded by whichever lesson zone reaches furthest — e.g. goldenrod-city ends
    # at 289), not a flat 300. A component sitting between that ceiling and 300 (e.g. 寸
    # at 291, needed by 時) would otherwise be silently treated as "already early enough"
    # while still being unreachable as a lower bound, deferring 時 for no visible reason.
    MAX_TARGET_POS = max((pos[k] for k in demote_pool), default=-1)

    # Greedily build the promoted set (worst offenders first), cascading in any
    # component that sits beyond the reachable ceiling (needs promoting too to keep
    # the "component before compound" invariant satisfiable within the lesson-zone pool).
    promoted_set = set()
    promoted_order_pref = []  # discovery order, just for candidate selection

    def try_add(k, trail):
        if k in promoted_set:
            return True
        if len(promoted_set) >= BUDGET:
            return False
        trail = trail | {k}
        needed = [c for c in components.get(k, [])
                  if c in pos and pos[c] > MAX_TARGET_POS and c not in promoted_set and c not in trail]
        for c in needed:
            if not try_add(c, trail):
                return False
        if len(promoted_set) >= BUDGET:
            return False
        promoted_set.add(k)
        promoted_order_pref.append(k)
        return True

    promo_candidates_set = set(promo_candidates)

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
            "composant encore à une position ≥300 (ex. 話/説/試 → 言 ; 道/週/運 → 込 ; "
            "質/員/買/頭 → 貝) voit ce composant promu EN CASCADE avant lui, dans le "
            "même budget (marqué `cascaded_component: true` ci-dessous — un composant "
            "déjà <300 comme 化, requis par 働/使, n'a pas besoin d'être cascadé, "
            "juste respecté comme borne basse dans le tri topologique). Pool de "
            "démotion restreint aux kanji N1/N2/N3 < position 300 qui "
            "n'apparaissent comme composant kradfile d'AUCUN autre kanji du corpus entier "
            "(2136) — aucun risque de casser une chaîne de prérequis en les repoussant "
            "plus tard. Composant '乞' traité comme bruit de kradfile (associé à 8+ kanji "
            "sans rapport plausible — 知/医/年/族/短/午/教/答 — vraisemblablement un "
            "artefact de forme de trait partagée, pas une vraie décomposition ; ignoré "
            "dans le graphe de dépendances). Script : .scratch/scripts/"
            "build-core-promotion.py (lecture seule) — l'application réelle du swap est "
            "faite par scripts/build/apply-core-promotion.py (0.6/1.4). **Corrigé "
            "2026-07-24 (revue Japanese-teacher + game-designer sur le 1er jet)** : "
            "le pool de démotion est maintenant restreint aux positions situées dans "
            "une zone qui a réellement un pool de leçons (content/lessons-proposal.json) "
            "— le 1er jet utilisait une liste WRITTEN_ZONES tapée à la main qui incluait "
            "par erreur des zones sans aucune leçon (route-33/34/35, slowpoke-well), "
            "faisant atterrir 45 des 69 kanji promus — dont 4 des 6 exemples-phares "
            "本/学/年/校/何/時 — sur une position sans PNJ pour les enseigner : le swap "
            "avait l'air appliqué (kanji-zone-assignment.json réordonné) mais était "
            "inerte côté joueur (aucune leçon, aucun lesson_examples). Toutes les "
            "mutations du 1er jet (kanji-zone-assignment.json, lessons-proposal.json, "
            "content/lessons/*.json, npc-inventory.md, les 12 lesson_examples ajoutés) "
            "ont été restaurées à leur état d'avant phase 1 avant ce second passage."
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
                "cascaded_component": k not in promo_candidates_set,
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
        "not_considered_this_pass": [
            {
                "kanji": k,
                "jlpt": jlpt_map.get(k),
                "meaning": "/".join(meanings_map.get(k, [])[:2]),
                "old_position": pos[k],
                "note": "N5/N4 en position ≥300 mais < CATASTROPHIC_THRESHOLD (1000) — "
                        "jamais candidat dans cette passe (scope volontairement réduit "
                        "au palier catastrophique + exemples de l'audit). Trouvé en revue "
                        "(game designer, 2026-07-24) : la 1ère version de ce fichier ne "
                        "listait ces kanji nulle part, ni promus ni différés — un futur "
                        "script devrait les reprendre en premier (ils sont moins mal "
                        "positionnés que le palier catastrophique, mais toujours "
                        "hors-N5/N4-attendu à leur position).",
            }
            for k in all_n5n4_late if k not in promo_candidates_set
        ],
    }
    (ROOT / "content/kanji-core-promotion.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=1) + "\n"
    )
    print("Written content/kanji-core-promotion.json")


if __name__ == "__main__":
    main()
