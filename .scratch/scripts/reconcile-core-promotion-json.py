#!/usr/bin/env python3
"""One-off repair (2026-07-24): build-core-promotion.py was accidentally re-run AFTER
apply-core-promotion.py had already mutated content/kanji-zone-assignment.json,
recomputing against the already-swapped state and overwriting kanji-core-promotion.json
with an incorrect, different analysis. The ACTUAL applied swap in the game data
(kanji-zone-assignment.json, lessons-proposal.json, content/lessons/*.json,
npc-inventory.md, kanji-content.json lesson_examples) is correct and untouched by that
mistake. This script reconstructs kanji-core-promotion.json to accurately DESCRIBE what
was actually applied, by diffing current state against the pre-phase-1 commit — it does
not re-derive or re-apply anything."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRE_PHASE1_COMMIT = "1691a4cb"

old = json.loads(subprocess.check_output(["git", "show", f"{PRE_PHASE1_COMMIT}:content/kanji-zone-assignment.json"], cwd=ROOT))
new = json.loads((ROOT / "content/kanji-zone-assignment.json").read_text())
old_order = old["ordered_kanji"]
new_order = new["ordered_kanji"]
assert set(old_order) == set(new_order) and len(old_order) == 2136
old_pos = {k: i for i, k in enumerate(old_order)}
new_pos = {k: i for i, k in enumerate(new_order)}

joyo = json.loads((ROOT / "scripts/sources/joyo-list.json").read_text())
jlpt_map = {k["char"]: k["jlpt"] for k in joyo}
meanings_map = {k["char"]: k["meanings"] for k in joyo}

changed = [k for k in old_order if old_pos[k] != new_pos[k]]
promotions = sorted([k for k in changed if new_pos[k] < old_pos[k]], key=lambda k: new_pos[k])
demotions = sorted([k for k in changed if new_pos[k] > old_pos[k]], key=lambda k: new_pos[k])

# A promoted kanji is a "genuine" audit-scope candidate (not cascaded) iff it is N5/N4
# and sat at old_pos >= 1000, OR is one of the 6 headline examples explicitly forced.
FORCE_FIRST = {"本", "学", "時", "年", "校", "何"}
CATASTROPHIC_THRESHOLD = 1000

def is_genuine_candidate(k):
    return jlpt_map.get(k) in ("N5", "N4") and (old_pos[k] >= CATASTROPHIC_THRESHOLD or k in FORCE_FIRST)

all_n5n4_late = [k for k in old_order if jlpt_map.get(k) in ("N5", "N4") and old_pos[k] >= 300]
promoted_set = set(promotions)
not_considered = [k for k in all_n5n4_late if k not in promoted_set and not is_genuine_candidate(k)]
# genuine candidates that did NOT make it into this pass (budget/zone constraints)
deferred = [k for k in all_n5n4_late if k not in promoted_set and is_genuine_candidate(k)]

out = {
    "_note": (
        "Étape 4 phase 1 — décision de design du 2026-07-23/24 (double revue "
        "prof+game designer), reconstruit le 2026-07-24 après un accident d'exécution "
        "(build-core-promotion.py relancé par erreur après application du swap, "
        "recalculant contre l'état déjà muté et écrasant ce fichier avec une analyse "
        "fausse — corrigé en reconstruisant depuis le diff réel entre l'état "
        f"pré-phase-1 (commit {PRE_PHASE1_COMMIT}) et l'état appliqué, sans rien "
        "réappliquer). Contenu identique en substance à la version validée par la "
        "double revue : corrige l'ordre 'par composants' de kanji-zone-assignment.json "
        "qui plaçait des kanji rares avant des mots basiques constamment utilisés en "
        "dialogue (本/561→196, 学/559→163, 時/1369→167, 年/1362→131, 校/1363→222, "
        "何/1990→256 — les 6 exemples nommés par l'audit). Échange par paires à taille "
        "constante, ordre topologique (Kahn sur kradfile) respectant les composants — "
        "0 violation. **Bug corrigé en cours de route** (revue Japanese-teacher) : la "
        "1ère version utilisait une liste WRITTEN_ZONES tapée à la main qui incluait "
        "par erreur des zones sans aucune leçon (route-33/34/35, slowpoke-well) — "
        "45 des 69 promotions du 1er jet atterrissaient sur une position sans PNJ pour "
        "les enseigner, dont 4 des 6 exemples-phares. Corrigé : le pool de démotion est "
        "maintenant restreint aux positions dans une zone qui a réellement une entrée "
        "content/lessons-proposal.json (LESSON_ZONES, calculé depuis les données, pas "
        "tapé à la main) — vérifié : 0/40 promotions atterrissent hors d'une zone à "
        "leçon. Plafond de démotion par zone relevé de 3 à 5 après cette restriction "
        "(le pool sûr s'est réduit à 124 positions sur seulement 8 zones une fois filtré "
        "aux vraies zones à leçon)."
    ),
    "promotion_count": len(promotions),
    "deferred_count": len(deferred),
    "promotions": sorted([
        {
            "kanji": k,
            "jlpt": jlpt_map.get(k),
            "meaning": "/".join(meanings_map.get(k, [])[:2]),
            "old_position": old_pos[k],
            "new_position": new_pos[k],
            "cascaded_component": not is_genuine_candidate(k),
        }
        for k in promotions
    ], key=lambda r: r["new_position"]),
    "demotions": sorted([
        {
            "kanji": k,
            "jlpt": jlpt_map.get(k),
            "meaning": "/".join(meanings_map.get(k, [])[:2]),
            "old_position": old_pos[k],
            "new_position": new_pos[k],
        }
        for k in demotions
    ], key=lambda r: r["new_position"]),
    "deferred": [
        {
            "kanji": k,
            "jlpt": jlpt_map.get(k),
            "meaning": "/".join(meanings_map.get(k, [])[:2]),
            "old_position": old_pos[k],
            "note": "budget de démotion sûre épuisé (restreint aux zones à leçon), ou "
                    "composant tardif non résolu dans le budget — reporté à une passe future.",
        }
        for k in deferred
    ],
    "not_considered_this_pass": [
        {
            "kanji": k,
            "jlpt": jlpt_map.get(k),
            "meaning": "/".join(meanings_map.get(k, [])[:2]),
            "old_position": old_pos[k],
            "note": "N5/N4 en position ≥300 mais < CATASTROPHIC_THRESHOLD (1000) — "
                    "jamais candidat dans cette passe (scope volontairement réduit au "
                    "palier catastrophique + exemples de l'audit). Trouvé en revue "
                    "(game designer, 2026-07-24) : la 1ère version de ce fichier ne "
                    "listait ces kanji nulle part, ni promus ni différés — un futur "
                    "script devrait les reprendre en premier (ils sont moins mal "
                    "positionnés que le palier catastrophique, mais toujours "
                    "hors-N5/N4-attendu à leur position).",
        }
        for k in not_considered
    ],
}

assert len(promotions) == 40 and len(demotions) == 40, f"expected 40/40, got {len(promotions)}/{len(demotions)}"
for k in FORCE_FIRST:
    assert k in promoted_set, f"{k} missing from reconstructed promotions!"

(ROOT / "content/kanji-core-promotion.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
print(f"Reconstructed: {len(promotions)} promotions, {len(demotions)} demotions, "
      f"{len(deferred)} deferred, {len(not_considered)} not_considered_this_pass.")
