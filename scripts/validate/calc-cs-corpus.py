#!/usr/bin/env python3
"""
Étape 3 point 3 — calculateur de corpus réel par CS-Kanji (première version).

Pour chaque CS-Kanji déjà remis quelque part dans le contenu écrit, calcule
le nombre de textes (tier obligatoire|secondaire) réellement atteignables
SANS aucun CS-Kanji au moment où ce CS est obtenu — et compare au seuil N
déjà calibré (content/curriculum-checkpoints.md § CS-Kanji, PRD.md § CS-Kanji
Obtention : « seuil N calibré à ~50-60% du corpus atteignable sans CS »).

Méthode réelle avec les données actuelles (pas de pathfinding de carte,
Étape 5 point 4 — approximation par ordre narratif de zone) :
  1. zone du donneur du CS → sa position dans NARRATIVE_ORDER ci-dessous ;
  2. tous les textes dont la zone est à cette position ou avant sont comptés
     comme « atteignables sans CS » — sauf le texte qui remet le CS lui-même
     (il délivre le CS, il ne fait pas partie du corpus qu'on lit AVANT de
     l'avoir) ;
  3. compare le compte au seuil N publié ; signale un corpus insuffisant
     plutôt que de fabriquer un seuil — ce script mesure, il ne calibre pas.

**Pourquoi pas `content/map/story-beats.json` § order** (trouvé en écrivant ce
script, 2026-07-10) : son `order` suit `kanji-zone-assignment.json` (l'ordre
JLPT abstrait), pas l'ordre réel de visite — confirmé concrètement ici :
route-36 a `order: 18` alors que le guidebook place sa visite juste après le
1er badge (Falkner), soit ~7ᵉ zone réelle. Cohérent avec la trouvaille déjà
documentée dans `content/texts/route-36/cs_kudakeru.json` (cumulative_start
route-36 = 330, très au-dessus du studiedSet réel ~140 à ce point) : Route 36
est visitée deux fois dans HGSS (tôt pour Éclate-Roc, plus tard pour le
Simularbre) et son pool kanji semble calé sur la visite tardive, pas la
précoce — un même zone_id ne peut porter qu'une seule position dans le
modèle actuel. NARRATIVE_ORDER ci-dessous encode donc l'ordre réel de visite
à la main, à partir de la séquence sourcée du guidebook
(`content/guidebook-adapted.md` L99), pour les seules zones déjà écrites.

Sortie volontairement honnête si le corpus écrit est encore petit (normal
avant l'Étape 4, la passe contenu industrielle) : ce n'est pas un échec du
script, c'est la mesure réelle de ce qui existe.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# PRD.md § CS-Kanji — table sourcée, seuils N calibrés à la synthèse
CS_THRESHOLDS = {
    "cs_kudakeru": {"character": "砕", "n": 6, "given_by_npc": "young_man_by_sign_route36"},
    "cs_kiru": {"character": "切", "n": 12, "given_by_npc": "charcoal_man_azalea"},
    "cs_nami": {"character": "水", "n": 20, "given_by_npc": "gentleman_theater_ecruteak"},
    "cs_tobu": {"character": "飛", "n": 26, "given_by_npc": "chuck_wife_cianwood"},
    "cs_chikara": {"character": "力", "n": 29, "given_by_npc": "hiker_cs_route42"},
    "cs_uzu": {"character": "渦", "n": 32, "given_by_npc": "lance_rocket_hq_mahogany"},
    "cs_taki": {"character": "滝", "n": 35, "given_by_npc": "cs_taki_pedestal_ice_path"},
    "cs_noboru": {"character": "登", "n": 60, "given_by_npc": None},
}


def load_json(path):
    return json.loads(path.read_text())


# Ordre réel de visite (pas story-beats.json § order — voir docstring), à la main
# depuis content/guidebook-adapted.md L99, limité aux zones déjà écrites.
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
]


def load_zone_orders():
    return {zid: i for i, zid in enumerate(NARRATIVE_ORDER)}


def load_npc_zone(npc_id):
    for registry_name in ("npcs.json", "trainers.json"):
        registry = load_json(ROOT / "content/map" / registry_name)
        for e in registry:
            if e.get("npc_id") == npc_id or e.get("trainer_id") == npc_id:
                return e.get("zone_id")
    return None


def load_all_texts():
    texts = []
    for tpath in sorted((ROOT / "content/texts").rglob("*.json")):
        obj = load_json(tpath)
        t = obj.get("text", obj)
        if "text_id" in t:
            texts.append((tpath, t))
    return texts


def main():
    zone_orders = load_zone_orders()
    all_texts = load_all_texts()

    print(f"{len(all_texts)} texte(s) trouvé(s) sous content/texts/ (hors gabarits).\n")

    any_computed = False
    warnings = []

    for item_id, info in CS_THRESHOLDS.items():
        npc_id = info["given_by_npc"]
        if npc_id is None:
            continue  # pas encore de contenu écrit pour ce CS
        any_computed = True
        character, n = info["character"], info["n"]

        giver_zone = load_npc_zone(npc_id)
        if giver_zone is None or giver_zone not in zone_orders:
            warnings.append(f"{character} ({item_id}) : donneur '{npc_id}' introuvable dans un registre avec zone_id ordonné — corpus non calculable")
            continue
        giver_order = zone_orders[giver_zone]

        reachable = []
        for tpath, t in all_texts:
            if t.get("npc_ref") == npc_id:
                continue  # le texte de remise du CS lui-même (même donneur), pas "avant" le CS
            tzone = t.get("zone_id")
            torder = zone_orders.get(tzone)
            if torder is not None and torder <= giver_order and t.get("tier") in ("obligatoire", "secondaire"):
                reachable.append((tpath, t))

        count = len(reachable)
        target_low, target_high = round(n / 0.6), round(n / 0.5)
        print(f"{character} ({item_id}) — seuil N={n}, donné en zone '{giver_zone}' (order {giver_order})")
        print(f"  corpus atteignable sans CS : {count} texte(s) — {[t.get('title', {}).get('jp', t.get('text_id')) for _, t in reachable]}")
        print(f"  pour que N={n} représente ~50-60% du corpus (règle de calibration), il faudrait ~{target_low}-{target_high} textes au total à ce point")
        if count < target_low:
            print(f"  ⚠ corpus actuel ({count}) très en-dessous de la cible — attendu avant l'Étape 4 (passe contenu industrielle), pas un bug")
        print()

    if not any_computed:
        print("Aucun CS-Kanji n'a encore de donneur identifié dans le contenu écrit — rien à calculer.")
        return 0

    for w in warnings:
        print(f"[WARN] {w}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
