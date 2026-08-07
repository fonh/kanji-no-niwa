#!/usr/bin/env python3
"""Audit de bout en bout du parcours « début de partie → première arène ».

POURQUOI
--------
« Est-ce que le début du jeu est livrable ? » ne se répond pas à l'œil : la
réponse dépend de dizaines de fichiers qui doivent tous être là EN MÊME TEMPS —
une leçon dont un kanji n'a pas d'exemple, un PNJ dont le dialogue n'existe pas,
un dresseur sans réplique d'après-combat, un objet promis par un texte qui ne
l'accorde jamais. Chacun passe inaperçu isolément et casse la partie ensemble.

Ce script simule le parcours zone par zone et rend la liste EXACTE des trous.
Il ne corrige rien : c'est un état des lieux reproductible.

Ce qu'il ne fait PAS, et qu'aucun script ne fera : juger la qualité du japonais
(naturel, registre, cohérence de niveau) et la qualité de game design (rythme,
lisibilité des objectifs). Ces deux-là demandent une relecture humaine — le
script vérifie que la matière EXISTE et se tient, pas qu'elle est bonne.

  python3 scripts/validate/audit-first-gym-run.py
  python3 scripts/validate/audit-first-gym-run.py --verbose
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# Ordre du chemin critique, sourcé PRD § Ordre des zones et
# content/guidebook-adapted.md. Sprout Tower est sur le chemin : le gardien de
# l'arène de Violet en exige la visite.
CRITICAL_PATH = [
    ("new-bark-town", "MAP_NEW_BARK"),
    ("route-29", "MAP_ROUTE_29"),
    ("cherrygrove-city", "MAP_CHERRYGROVE"),
    ("route-30", "MAP_ROUTE_30"),
    ("route-31", "MAP_ROUTE_31"),
    ("violet-city", "MAP_VIOLET"),
    ("sprout-tower", "MAP_SPROUT_TOWER_1F"),
]

ROOT = Path(".")
KANJI = json.load(open("src/data/kanji-content.json"))
NPCS = json.load(open("content/map/npcs.json"))
TRAINERS = json.load(open("content/map/trainers.json"))
REGISTRY = {z["name"]: z for z in json.load(open("src/data/zone-registry.json"))["zones"]}
ITEM_LABELS = json.load(open("src/data/item-labels.json"))["items"]

# Le gabarit d'exemple généré automatiquement (voir son usage plus bas).
PLACEHOLDER_JP = re.compile(r"^これは.*です。$")
PLACEHOLDER_EN = re.compile(r"^This is .*\.$")

verbose = "--verbose" in sys.argv
problems: list[tuple[str, str]] = []  # (gravité, message)


def blocker(msg: str) -> None:
    problems.append(("BLOQUANT", msg))


def gap(msg: str) -> None:
    problems.append(("MANQUE", msg))


def note(msg: str) -> None:
    if verbose:
        print(f"    · {msg}")


def dialogue_path(ref: str) -> Path:
    return ROOT / "content/dialogues" / f"{ref}.json"


def audit_lessons(zone_id: str) -> tuple[int, set[str]]:
    """Leçons de la zone : chaque kanji enseigné doit être enseignable."""
    path = ROOT / f"content/lessons/{zone_id}.json"
    if not path.exists():
        return 0, set()
    lessons = json.load(open(path))
    audit_grammar(zone_id, lessons)
    taught: set[str] = set()
    for lesson in lessons:
        seq = lesson["sequence_index"]
        for kid in lesson["kanji_ids"]:
            taught.add(kid)
            entry = KANJI.get(kid)
            if entry is None:
                blocker(f"{zone_id} leçon #{seq} : le kanji {kid} n'existe pas dans kanji-content")
                continue
            examples = entry.get("lesson_examples") or []
            if not examples:
                blocker(f"{zone_id} leçon #{seq} : {kid} n'a aucune phrase d'exemple — leçon injouable")
                continue
            for ex in examples:
                ref = ex.get("audio_ref")
                if not ref:
                    gap(f"{zone_id} : {kid} — exemple sans audio")
                elif not (ROOT / "public" / ref.lstrip("/")).exists():
                    gap(f"{zone_id} : {kid} — audio manquant sur disque ({ref})")
                # Un exemple qui ne montre pas le kanji enseigné n'illustre
                # rien : la page droite du livre parle d'autre chose que la
                # page gauche.
                if kid not in ex.get("jp", ""):
                    blocker(
                        f"{zone_id} leçon #{seq} : l'exemple « {ex.get('jp','')} » "
                        f"n'utilise pas {kid}"
                    )
                # Gabarit automatique 「これは　X　です。」 → « This is <mot-clé>. »
                # (2026-08-07). Dès que X est un composé, la traduction est
                # FAUSSE — 牛肉 rendu « cow », 門限 « gate », 世論
                # « generation ». 1560 exemples du corpus suivent ce gabarit ;
                # sur le chemin critique il n'en reste aucun, et c'est cette
                # ligne qui le maintient.
                if PLACEHOLDER_JP.match(ex.get("jp", "")) and PLACEHOLDER_EN.match(
                    (ex.get("en") or "").strip()
                ):
                    gap(
                        f"{zone_id} : {kid} — exemple-gabarit « {ex.get('jp','')} / "
                        f"{ex.get('en','')} », traduction non vérifiée"
                    )
            if not entry.get("meanings"):
                blocker(f"{zone_id} : {kid} sans traduction")
            if not (entry.get("on") or entry.get("kun")):
                blocker(f"{zone_id} : {kid} sans lecture")
        npc_ref = lesson.get("npc_ref")
        if npc_ref:
            giver = next((n for n in NPCS if n["npc_id"] == npc_ref), None) or next(
                (t for t in TRAINERS if t.get("trainer_id") == npc_ref), None
            )
            if giver is None:
                blocker(f"{zone_id} leçon #{seq} : PNJ porteur inconnu ({npc_ref})")
            else:
                audit_giver_reachable(zone_id, seq, giver)
    return len(lessons), taught


# Le badge que ce parcours sert à décrocher : une leçon comptée « avant la
# première arène » ne peut pas dépendre de lui.
FIRST_GYM_BADGE = "falkner"


def audit_giver_reachable(zone_id: str, seq: int, giver: dict) -> None:
    """Une leçon d'avant la première arène doit être ATTEIGNABLE avant la
    première arène.

    Ajouté 2026-08-06 (carte de conception). L'audit comptait « 26 leçons,
    140 kanji avant Falkner » en additionnant les fichiers de leçons, sans
    jamais regarder si le personnage qui les porte existe à ce moment-là.
    Il ne l'était pas : les 4 leçons de la Route 29 étaient sur Tuscany, la
    sœur du MARDI, qui n'apparaît qu'APRÈS le badge de Falkner ; la leçon #5
    de Mauville était sur Teala, gatée sur ce même badge. 26 kanji du budget
    d'avant-arène n'étaient enseignables qu'après. Un compteur qui compte des
    leçons injouables est pire que pas de compteur.

    Deux formes de piège, les deux vérifiées ici :
      - présence gatée sur le badge que ce parcours sert justement à gagner ;
      - présence gatée sur un `time_window` (un jour de la semaine) : la leçon
        existe, mais rien ne garantit qu'un joueur la voie sur son chemin.
    """
    ident = giver.get("npc_id") or giver.get("trainer_id")
    if giver.get("role") != "lesson":
        blocker(
            f"{zone_id} leçon #{seq} : {ident} porte une leçon mais n'a pas "
            f"role: lesson — le moteur ne lui ouvrira jamais l'écran-livre"
        )
    for cond in giver.get("unlock_conditions") or []:
        if cond.get("type") == "badge_earned" and cond.get("badge_id") == FIRST_GYM_BADGE:
            blocker(
                f"{zone_id} leçon #{seq} : son porteur {ident} n'apparaît qu'avec le badge "
                f"de {FIRST_GYM_BADGE} — la leçon est comptée avant la première arène et "
                f"n'est atteignable qu'après"
            )
        if cond.get("type") == "time_window":
            blocker(
                f"{zone_id} leçon #{seq} : son porteur {ident} est calendaire "
                f"({cond.get('days_of_week') or cond}) — une leçon du chemin critique ne "
                f"peut pas dépendre du jour de la semaine"
            )


# Panneaux, PC et autres objets lisibles n'ont PAS de fichier de dialogue : le
# moteur leur applique directement un `unlock_text` et ouvre la fenêtre de
# lecture (src/lib/content.ts, ENGINE_UNLOCK_TEXTS). Les exiger comme des PNJ
# reviendrait à signaler un trou là où le contenu est complet.
ENGINE_TEXT_HOLDERS = set(
    re.findall(r"^\s*([a-z0-9_]+):\s*'", Path("src/lib/content.ts").read_text(), re.M)
)


def audit_npcs(zone_id: str) -> int:
    entries = [n for n in NPCS if n["zone_id"] == zone_id]
    for npc in entries:
        ref = npc.get("dialogue_ref")
        if not ref:
            nid = npc["npc_id"]
            if npc.get("kind") in ("sign", "object"):
                if nid in ENGINE_TEXT_HOLDERS:
                    note(f"{nid} : objet lisible, texte servi par le moteur")
                else:
                    blocker(
                        f"{zone_id} : {nid} est un {npc['kind']} sans texte associé — "
                        f"le joueur l'active et rien ne se passe"
                    )
            else:
                blocker(f"{zone_id} : {nid} n'a aucun dialogue_ref — muet")
            continue
        path = dialogue_path(ref)
        if not path.exists():
            blocker(f"{zone_id} : {npc['npc_id']} pointe un dialogue absent ({ref})")
            continue
        doc = json.load(open(path))
        states = doc.get("dialogue_states") or {}
        if not states:
            blocker(f"{zone_id} : {npc['npc_id']} a un dialogue sans aucun état")
        rules = doc.get("state_rules") or []
        if not any(r.get("default") for r in rules):
            blocker(
                f"{zone_id} : {npc['npc_id']} n'a pas de state_rule par défaut — "
                f"muet dès qu'aucune règle ne matche"
            )
        for r in rules:
            if r["state"] not in states:
                blocker(f"{zone_id} : {npc['npc_id']} — règle vers un état inexistant ({r['state']})")
        for name, st in states.items():
            if not st.get("pages"):
                blocker(f"{zone_id} : {npc['npc_id']} — état « {name} » sans page")
    return len(entries)


def audit_trainers(zone_id: str) -> int:
    entries = [t for t in TRAINERS if t["zone_id"] == zone_id]
    for t in entries:
        ref = t.get("dialogue_ref")
        path = dialogue_path(ref) if ref else None
        if path is None or not path.exists():
            blocker(f"{zone_id} : dresseur {t['trainer_id']} sans dialogue ({ref})")
            continue
        states = (json.load(open(path)).get("dialogue_states") or {}).keys()
        for needed in ("battle_intro", "post_battle"):
            if needed not in states:
                blocker(f"{zone_id} : dresseur {t['trainer_id']} sans état « {needed} »")
        if t.get("role") == "battle" and not t.get("sprite_id"):
            gap(f"{zone_id} : dresseur {t['trainer_id']} sans sprite — invisible sur la carte")
    return len(entries)


def audit_positions(zone_id: str, map_name: str) -> None:
    """Un PNJ ou dresseur doit être joignable : tuile praticable, et au moins
    une tuile praticable adjacente pour se placer face à lui."""
    zone = REGISTRY.get(map_name)
    if zone is None:
        blocker(f"{zone_id} : zone {map_name} absente du registre")
        return
    w, h, terrain = zone["tile_width"], zone["tile_height"], zone["terrain"]

    def walkable(x: int, y: int) -> bool:
        return 0 <= x < w and 0 <= y < h and terrain[y * w + x] != "#"

    for kind, entries in (("PNJ", NPCS), ("dresseur", TRAINERS)):
        for e in entries:
            if e["zone_id"] != zone_id:
                continue
            # Les entités d'intérieur (map_zone explicite) sont vérifiées avec
            # leur propre zone, pas celle-ci.
            if e.get("map_zone") and e["map_zone"] != map_name:
                continue
            if e.get("placements"):
                continue  # couvert par lint-npc-placements.py
            x, y = e.get("tile_x"), e.get("tile_y")
            if x is None or y is None:
                continue
            ident = e.get("npc_id") or e.get("trainer_id")
            neighbours = any(
                walkable(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            )
            # Un panneau EST un obstacle : il occupe une tuile solide et se lit
            # depuis la case d'à côté. Seul son accès compte.
            if e.get("kind") in ("sign", "object"):
                if not neighbours:
                    blocker(
                        f"{zone_id} : {e['kind']} {ident} en ({x},{y}) — aucune tuile "
                        f"praticable devant, illisible"
                    )
                continue
            if not walkable(x, y):
                blocker(f"{zone_id} : {kind} {ident} en ({x},{y}) — hors grille ou dans un mur")
            elif not neighbours:
                blocker(f"{zone_id} : {kind} {ident} en ({x},{y}) — injoignable, aucun voisin praticable")


def audit_grammar(zone_id: str, lessons: list) -> None:
    """Une leçon qui déclare un `grammar_id` doit avoir sa page de grammaire.

    Ajouté 2026-08-06, sur un constat de jeu : « les kanji sont appris mais je
    n'ai vu aucune leçon de japonais, style grammaire ». Et pour cause — 21 des
    26 leçons du chemin critique portaient un `grammar_id` sans aucun point
    dans `content/grammar/<zone>.json`. Le moteur ne casse pas pour autant : il
    sert la leçon SANS ses pages de grammaire et le mini-quiz perd sa question
    de grammaire, en silence. Un trou de contenu qui se présente comme un jeu
    qui marche est pire qu'une erreur.
    """
    path = ROOT / f"content/grammar/{zone_id}.json"
    available = set()
    if path.exists():
        available = {p["grammar_id"] for p in json.load(open(path)).get("points", [])}
    for lesson in lessons:
        gid = lesson.get("grammar_id")
        if gid and gid not in available:
            blocker(
                f"{zone_id} leçon #{lesson['sequence_index']} : point de grammaire {gid} "
                f"déclaré mais absent de content/grammar/{zone_id}.json — la leçon "
                f"n'enseignerait que des kanji, sans rien dire"
            )


def audit_items(zone_id: str) -> None:
    """Tout objet remis dans cette zone doit avoir un libellé japonais.

    Ajouté 2026-08-06. Le Sac affichait l'`item_id` brut faute de libellé —
    donc « tm70_flash », « vs_recorder », « pal_pad » en caractères latins,
    dans un jeu dont le PRD interdit le latin à l'écran (§ Langue du Jeu).
    74 des 87 objets accordés par du contenu étaient dans ce cas ; le repli
    est maintenant muet (「？？？」), et le chemin critique, lui, doit être
    complet — c'est le seul parcours qu'on prétend livrable.
    """
    for path in (ROOT / "content/dialogues").rglob("*.json"):
        if f"/{zone_id}/" not in str(path):
            continue
        doc = json.load(open(path))
        for state in (doc.get("dialogue_states") or {}).values():
            for effect in state.get("effects") or []:
                if effect.get("type") != "grant_item":
                    continue
                item_id = effect["item_id"]
                if item_id not in ITEM_LABELS:
                    blocker(
                        f"{zone_id} : {path.stem} remet « {item_id} », qui n'a aucun libellé "
                        f"japonais (src/data/item-labels.json) — le Sac l'afficherait 「？？？」"
                    )


def audit_zone_playable(map_name: str) -> None:
    zone = REGISTRY.get(map_name)
    if zone is None:
        return
    if not zone["screenshot"]:
        gap(f"{map_name} : servie sans décor (rendu grille de collision)")


def main() -> None:
    print("Audit du parcours « début de partie → première arène »\n")
    total_lessons = 0
    all_kanji: set[str] = set()

    for zone_id, map_name in CRITICAL_PATH:
        n_lessons, taught = audit_lessons(zone_id)
        n_npcs = audit_npcs(zone_id)
        n_trainers = audit_trainers(zone_id)
        audit_items(zone_id)
        audit_positions(zone_id, map_name)
        audit_zone_playable(map_name)
        total_lessons += n_lessons
        all_kanji |= taught
        print(
            f"  {zone_id:<18} {n_lessons} leçon(s) · {len(taught):>2} kanji · "
            f"{n_npcs} PNJ · {n_trainers} dresseur(s)"
        )

    print(f"\n  Total : {total_lessons} leçons, {len(all_kanji)} kanji distincts enseignés")

    # Les verrous rencontrés en chemin, dans l'ordre — lus, pas devinés : c'est
    # la seule liste qui dise ce qui peut arrêter un joueur avant l'arène.
    maps_on_path = {m for _, m in CRITICAL_PATH}
    roadblocks = json.load(open("content/map/roadblocks.json"))["roadblocks"]
    crossed = [rb for rb in roadblocks if rb["from_zone"] in maps_on_path]
    if crossed:
        print(f"\n  Verrous sur le chemin ({len(crossed)}) :")
        for rb in crossed:
            keys = ", ".join(
                c.get("step") or c.get("item_id") or c.get("badge_id") or c["type"]
                for c in rb["unlock_conditions"]
            )
            deleg = f" → délégué à {rb['npc_id']}" if rb.get("npc_id") else ""
            print(f"    {rb['from_zone']} ⇢ {rb['to_zone']} : clé = {keys}{deleg}")

    blockers = [m for lvl, m in problems if lvl == "BLOQUANT"]
    gaps = [m for lvl, m in problems if lvl == "MANQUE"]

    if blockers:
        print(f"\nBLOQUANT ({len(blockers)}) — le parcours ne se termine pas en l'état :")
        for m in blockers:
            print("  -", m)
    if gaps:
        print(f"\nMANQUES ({len(gaps)}) — jouable, mais dégradé :")
        for m in gaps[:40]:
            print("  -", m)
        if len(gaps) > 40:
            print(f"  … et {len(gaps) - 40} autres")

    print(
        "\nHors de portée d'un script, à faire relire par un humain :\n"
        "  - qualité du japonais (naturel, registre, cohérence de niveau) ;\n"
        "  - rythme et lisibilité des objectifs (game design)."
    )
    if blockers:
        sys.exit(1)
    print("\nAucun bloquant : le parcours est complet de bout en bout.")


if __name__ == "__main__":
    main()
