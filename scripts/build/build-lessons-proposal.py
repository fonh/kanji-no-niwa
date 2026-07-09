#!/usr/bin/env python3
"""
Étape 2 point 5 — propose l'assignation des PNJ-leçon (colonne « Type
assigné » de npc-inventory.md) : quel PNJ sourcé porte quel groupe de kanji
(et, optionnellement, quel point de grammaire), dans quel ordre.

Méthode (simplifiée sur demande explicite, 2026-07-09) :
- Groupement des kanji par ordre JLPT pur (l'ordre déjà fixé par
  `content/kanji-zone-assignment.json`, § point 1) — pas de regroupement
  par radical, pas de taille de leçon fixe (4-5/8-12 abandonné).
- Pool de PNJ-leçon = TOUT PNJ non-combat de la zone (pas seulement les
  PNJ « manifestement pédagogiques ») — la recatégorisation est délibérément
  large, sur confirmation explicite. Seuls les personnages récurrents à
  fonction narrative déjà fixée ailleurs restent exclus (STORY_DENYLIST).
- Nombre de leçons = kanji_count / TARGET_LESSON_SIZE (cible souple, pas
  une règle dure), plafonné au nombre de PNJ éligibles réellement
  disponibles dans la zone (s'il y en a moins, les leçons grossissent).
- Un point de grammaire au plus par leçon, pris dans l'ordre des
  grammar_ids déjà assignés à la zone (`grammar-zone-assignment.json`).

Sortie : content/lessons-proposal.json (proposition, pas encore appliquée à
npc-inventory.md) + rapport de relecture.
"""
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TARGET_LESSON_SIZE = 6  # cible souple, pas une règle dure

# Personnages récurrents dont la fonction narrative est déjà fixée ailleurs
# dans le projet (mentor, famille, quête-clé nommée) -- jamais recatégorisés
# en PNJ-leçon générique, même si leur ligne n'est pas taguée combat.
STORY_DENYLIST = {
    "mother", "mom", "prof. elm", "professeur elm", "pr. elm",
    "prof. oak", "pr. oak", "pr. chen/oak", "professeur oak", "professeur chen",
    "assistant du pr. elm", "ethan", "lyra", "lyra/ethan",
    "mr. pokémon", "kurt", "bill", "baoba", "buena",
    "day care man", "day care lady", "policeman keith",
    "kimono girl zuki", "kimono girl naoko", "kimono girl miki",
    "kimono girl kuni", "kimono girl sayo",
    "eusine", "looker", "blue", "red",
    "silver", "rival (silver)",
    # 8 Champions d'arène Johto + Kanto (nommés, rôle-boss fixé par le jeu ;
    # trouvé 2026-07-09 en auditant la liste des PNJ-leçon utilisés --
    # certaines de leurs lignes "combat" n'étaient même pas taguées, cf.
    # correctifs npc-inventory.md du même jour) + Elite 4/Champion + cameos
    # récurrents (Steven apparaît 4x, jamais un simple PNJ générique).
    "falkner", "bugsy", "whitney", "morty", "chuck", "jasmine", "pryce",
    "clair", "brock", "misty", "lt. surge", "erika", "janine", "sabrina",
    "blaine", "karen", "bruno", "koga", "lance",
    "steven", "maylene", "wake", "rival",
}

# Motifs de lignes qui ne sont pas de vrais PNJ nommés (prose descriptive
# glissée dans une cellule de tableau, ou décor/obstacle sans dimension
# pédagogique plausible) -- à exclure du pool.
NON_PNJ_PATTERNS = [
    r"^Aucun\b", r"^Séquence\b", r"^\d+ dresseurs?\b(?!.*\w{3,})",
    r"^Psychic Nathan \(bordure", r"^Approche\b",
    r"^Obstacle\b", r"^Panneau\b",
]

# Motifs de NOM signalant un pur bloqueur de passage (le trait définissant
# le PNJ est de bloquer, pas d'avoir un contenu propre) -- à exclure même
# si le rôle lui-même n'utilise pas le mot "Bloque".
NON_LESSON_NAME_PATTERNS = [
    r"[Bb]loquant\b",
]

# Motifs de RÔLE (pas de nom) qui excluent une ligne du pool leçon même si
# elle n'est pas taguée combat : ligne-résumé de récompense (pas une
# rencontre PNJ distincte) ou pur bloqueur de passage sans fonction
# d'enseignement plausible (2026-07-09, trouvé en relisant azalea-town).
NON_LESSON_ROLE_PATTERNS = [
    r"Récompense finale du Gym",
    r"^Bloque l'(entrée|accès|est|ouest|nord|sud)\b", r"^Bloquent? l'accès\b",
    r"^Bloque puis laisse passer\b", r"^Refuse l'entrée\b",
]


def load_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def parse_npc_inventory():
    text = (ROOT / "content/npc-inventory.md").read_text(encoding="utf-8")
    sections = re.split(r"\n## ", text)[1:]
    zones = {}
    for section in sections:
        header, _, body = section.partition("\n")
        m = re.match(r"([a-z0-9-]+)", header)
        if not m:
            continue
        zone_id = m.group(1)
        rows = re.findall(r"^\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)\|$", body, re.MULTILINE)
        entries = []
        for name, role, obj, typ in rows:
            name, role, obj, typ = name.strip(), role.strip(), obj.strip(), typ.strip()
            if not name or name.startswith("---") or "PNJ /" in name:
                continue
            entries.append({"name": name, "role": role, "gift": obj, "type_assigned": typ})
        zones[zone_id] = entries
    return zones


# Bootstrap Elm (PRD § Origine des tout premiers kanji) : seule exception au
# denylist, seule zone où Pr. Elm est explicitement le PNJ-leçon désigné
# (~7 leçons, ~30 kanji sur les deux passages au labo).
DENYLIST_EXCEPTIONS = {
    "new-bark-town": {"professeur elm"},
}


def is_eligible(entry, zone_id):
    if entry["type_assigned"]:  # déjà taguée (combat, ou une future passe)
        return False
    name_lower = entry["name"].lower()
    exceptions = DENYLIST_EXCEPTIONS.get(zone_id, set())
    if any(exc in name_lower for exc in exceptions):
        return True
    for denied in STORY_DENYLIST:
        if denied in name_lower:
            return False
    for pat in NON_PNJ_PATTERNS:
        if re.search(pat, entry["name"]):
            return False
    for pat in NON_LESSON_NAME_PATTERNS:
        if re.search(pat, entry["name"]):
            return False
    for pat in NON_LESSON_ROLE_PATTERNS:
        if re.search(pat, entry["role"]):
            return False
    return True


def chunk_evenly(items, n_chunks):
    """Découpe `items` (ordre préservé) en `n_chunks` groupes aussi égaux
    que possible, jamais un groupe vide tant qu'il reste des items."""
    n_chunks = max(1, min(n_chunks, len(items)))
    base, extra = divmod(len(items), n_chunks)
    chunks = []
    i = 0
    for c in range(n_chunks):
        size = base + (1 if c < extra else 0)
        chunks.append(items[i:i + size])
        i += size
    return chunks


def main():
    kanji_data = load_json("content/kanji-zone-assignment.json")
    grammar_data = load_json("content/grammar-zone-assignment.json")
    inventory = parse_npc_inventory()

    grammar_by_zone = {z["zone_id"]: z["grammar_ids"] for z in grammar_data["zones"]}
    grammar_titles = {}
    for palier, points in grammar_data["grammar_points"].items():
        for p in points:
            grammar_titles[p["id"]] = p["title"]

    proposal = {"zones": []}
    capacity_warnings = []
    spillover_notes = []
    unused_grammar_total = 0

    # Report (PRD § Volume estimé) : les zones sans PNJ non-combat exploitable
    # ne portent pas de leçon -- leur pool de kanji est absorbé par la
    # PROCHAINE zone du parcours qui a une capacité PNJ réelle, plutôt que
    # laissé sans porteur. Ordre = celui de kanji-zone-assignment.json,
    # déjà l'ordre réel du parcours (étape 2 point 1).
    carry_kanji = []
    carry_grammar = []
    carry_from = []

    for z in kanji_data["zones"]:
        zone_id = z["zone_id"]
        kanji_pool = carry_kanji + z["new_kanji"]
        grammar_pool = carry_grammar + grammar_by_zone.get(zone_id, [])
        if not kanji_pool:
            continue  # zone plateau, aucune leçon requise, rien à reporter

        entries = inventory.get(zone_id, [])
        if zone_id in DENYLIST_EXCEPTIONS:
            # Bootstrap Elm : exclusivement le PNJ listé en exception, pas le
            # reste du pool normal (PRD : « c'est le Pr. Elm ... qui dispense
            # les premières leçons » -- attribution unique, pas partagée).
            wanted = DENYLIST_EXCEPTIONS[zone_id]
            eligible = [e for e in entries if any(w in e["name"].lower() for w in wanted)]
        else:
            eligible = [e for e in entries if is_eligible(e, zone_id)]

        n_lessons = max(1, math.ceil(len(kanji_pool) / TARGET_LESSON_SIZE))

        if not eligible:
            capacity_warnings.append(f"{zone_id}: 0 PNJ éligible pour {len(kanji_pool)} kanji — reporté sur la zone suivante")
            carry_kanji = kanji_pool
            carry_grammar = grammar_pool
            carry_from.append(zone_id)
            continue
        if carry_from:
            spillover_notes.append(f"{zone_id}: absorbe le pool de {', '.join(carry_from)} ({len(carry_kanji)} kanji reportés)")
            carry_from = []
        carry_kanji, carry_grammar = [], []

        if len(eligible) < n_lessons:
            capacity_warnings.append(
                f"{zone_id}: {len(eligible)} PNJ éligibles pour {n_lessons} leçons — certains PNJ donnent "
                f"plusieurs leçons successives (comme le bootstrap Elm, PRD)"
            )

        kanji_chunks = chunk_evenly(kanji_pool, n_lessons)
        # Un PNJ peut porter plusieurs leçons d'affilée si la zone en a moins
        # que de leçons visées (cycle plutôt que de plafonner le nombre de
        # leçons au nombre de PNJ -- le bootstrap Elm en est l'exemple posé
        # par le PRD : un seul PNJ, ~7 leçons).
        lesson_pnjs = [eligible[i % len(eligible)] for i in range(n_lessons)]
        # Un point de grammaire AU PLUS par leçon (jamais plusieurs) --
        # l'excédent du pool de grammaire de la zone reste non assigné à une
        # leçon ; il devra être porté par le contenu combat/contexte plus
        # tard (PRD § Système SRS : « la grammaire n'est PAS dans le SRS »).
        grammar_chunks = [[g] if i < len(grammar_pool) else [] for i, g in enumerate(grammar_pool[:n_lessons])]
        while len(grammar_chunks) < n_lessons:
            grammar_chunks.append([])
        if len(grammar_pool) > n_lessons:
            capacity_warnings.append(
                f"{zone_id}: {len(grammar_pool)} points de grammaire pour {n_lessons} leçons — "
                f"{len(grammar_pool) - n_lessons} restent sans leçon porteuse (à couvrir par le contenu combat/contexte)"
            )

        for i, (pnj, kanjis, grams) in enumerate(zip(lesson_pnjs, kanji_chunks, grammar_chunks), start=1):
            proposal["zones"].append({
                "zone_id": zone_id,
                "sequence_index": i,
                "npc_name": pnj["name"],
                "npc_role_origin": pnj["role"],
                "kanji_ids": kanjis,
                "grammar_ids": grams,
                "grammar_titles": [grammar_titles.get(g, g) for g in grams],
            })

    if carry_from:
        capacity_warnings.append(
            f"FIN DE PARCOURS : {len(carry_kanji)} kanji de {', '.join(carry_from)} restent sans porteur "
            "(aucune zone suivante avec PNJ éligible) — à traiter à la main."
        )

    out_path = ROOT / "content/lessons-proposal.json"
    out_path.write_text(json.dumps(proposal, ensure_ascii=False, indent=2), encoding="utf-8")

    total_lessons = len(proposal["zones"])
    total_kanji_assigned = sum(len(l["kanji_ids"]) for l in proposal["zones"])
    print(f"{total_lessons} leçons proposées sur {len(set(l['zone_id'] for l in proposal['zones']))} zones")
    print(f"{total_kanji_assigned} kanji couverts")
    print(f"Écrit {out_path.relative_to(ROOT)}")

    report = [
        "# Rapport — proposition de leçons (étape 2 point 5)", "",
        f"`{total_lessons}` leçons proposées, `{total_kanji_assigned}` kanji couverts, méthode : "
        f"ordre JLPT pur (pas de radical), taille cible souple ({TARGET_LESSON_SIZE} kanji, pas une règle "
        "dure), pool de PNJ-leçon = tout PNJ non-combat hors personnages récurrents à rôle fixé "
        "(STORY_DENYLIST), report du pool des zones à 0 PNJ éligible sur la zone suivante mieux pourvue "
        "(PRD § Volume estimé : « croissance kanji absorbée par les zones voisines mieux fournies »). "
        "Voir `content/lessons-proposal.json`.", "",
        "## Reports appliqués (zone à 0 PNJ éligible → absorbée par la suivante)", "",
    ]
    report += [f"- {w}" for w in spillover_notes] if spillover_notes else ["Aucun."]
    report += ["", "## Écarts de capacité restants (zone pauvre en PNJ éligibles vs. pool de kanji, après report)", ""]
    report += [f"- {w}" for w in capacity_warnings] if capacity_warnings else ["Aucun."]
    (ROOT / ".scratch/audits/lessons-proposal-report.md").write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"Écrit .scratch/audits/lessons-proposal-report.md ({len(capacity_warnings)} écarts, {len(spillover_notes)} reports)")


if __name__ == "__main__":
    main()
