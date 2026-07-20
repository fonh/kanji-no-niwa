#!/usr/bin/env python3
"""
Étape 3 point 3 — linter de budget kanji.

Vérifie deux règles posées par CONTEXT.md § Kanji Budget et
content/texts-progressifs.md § Vetting, jusqu'ici appliquées à la main (et
ratées deux fois de suite en écrivant les gabarits de l'étape 3 point 1 —
voir content/gabarits/README.md § Vérification post-écriture) :

1. **Lectures inline présentes** (ADR-0002) : tout kanji du texte joueur
   porte une lecture entre parenthèses pleine chasse juste après, qu'il
   soit étudié ou non — 道場（どうじょう）, jamais juste 道場.
2. **Budget d'inconnus** (CONTEXT.md § Kanji Budget) :
   - **Dialogue** (PNJ/dresseur/appel) : au plus 2 kanji hors studiedSet
     sur tout le fichier (tous les dialogue_states/pages confondus). Le
     champ `name` est exempté du COMPTE (mais pas de la règle de lecture
     inline, cf. ADR-0002).
   - **Texte progressif** (`texts`) : proportionnel, ~2 inconnus / 100
     caractères, plafonné à 8-10 inconnus distincts par texte — le budget
     est calculé sur `jp_text` + les `questions[].prompt/options` combinés
     (les questions réutilisent le vocabulaire du passage, elles ne sont
     pas un budget à part, décision prise en écrivant text-example.json).
   - **Exemple de leçon** (`kanji.lesson_examples[]`) : règle stricte,
     zéro kanji autre que le kanji de l'entrée elle-même (§ Leçons du
     PRD : « zéro autre kanji inconnu » — pas de tolérance proportionnelle
     ici, contrairement aux textes).

studiedSet d'une zone = les kanji dont l'index dans `ordered_kanji` de
`content/kanji-zone-assignment.json` est < `cumulative_start` de la zone.
C'est le plancher garanti pour n'importe quel contenu placé n'importe où
dans la zone (un contenu en fin de zone peut en réalité s'appuyer sur des
kanji enseignés plus tôt dans la MÊME zone, donc ce linter peut lever des
faux positifs prudents sur du contenu délibérément placé en fin de zone —
préférable à des faux négatifs).

Usage :
    python3 scripts/validate/lint-kanji-budget.py               # scan par défaut
    python3 scripts/validate/lint-kanji-budget.py <fichier.json> [...]

Code de sortie 0 si tout passe, 1 sinon (utilisable en CI, § roadmap Étape 3
point 3).
"""
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

FURIGANA_RE = re.compile(r"（[^）]*）")
KANJI_RE = re.compile(r"[一-鿿]")
# a kanji run (one or more kanji, possibly with a trailing okurigana kana
# already excluded) immediately followed by a furigana annotation
KANJI_RUN_WITH_READING_RE = re.compile(r"[一-鿿]+（[^）]*）")
KANJI_RUN_RE = re.compile(r"[一-鿿]+")

DEFAULT_GLOBS = [
    "content/dialogues/npcs/**/*.json",
    "content/dialogues/trainers/**/*.json",
    "content/dialogues/calls/**/*.json",
    "content/gabarits/text-example.json",
    "content/gabarits/lesson-example.json",
    "content/texts/**/*.json",
    "content/lessons/**/*.json",
]


def load_zone_assignment():
    data = json.loads((ROOT / "content/kanji-zone-assignment.json").read_text())
    ordered = data["ordered_kanji"]
    zones = {z["zone_id"]: z for z in data["zones"]}
    return ordered, zones


def studied_set_for_zone(zone_id, ordered, zones):
    zone = zones.get(zone_id)
    if zone is None:
        return None
    return set(ordered[: zone["cumulative_start"]])


def strip_furigana(text):
    return FURIGANA_RE.sub("", text)


def kanji_chars(text):
    return set(KANJI_RE.findall(strip_furigana(text)))


def missing_inline_readings(text):
    """Kanji runs not immediately followed by a （...） reading."""
    missing = []
    pos = 0
    for m in KANJI_RUN_RE.finditer(text):
        run = m.group(0)
        end = m.end()
        if text[end : end + 1] != "（":
            missing.append(run)
    return missing


def collect_jp_strings(obj, acc, skip_keys=()):
    """Recursively collect every string found under a 'jp' key."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in skip_keys:
                continue
            if k == "jp" and isinstance(v, str):
                acc.append(v)
            else:
                collect_jp_strings(v, acc, skip_keys)
    elif isinstance(obj, list):
        for v in obj:
            collect_jp_strings(v, acc, skip_keys)


class Finding:
    def __init__(self, path, level, message):
        self.path = path
        self.level = level  # "FAIL" or "WARN"
        self.message = message

    def __str__(self):
        return f"[{self.level}] {self.path}: {self.message}"


def lint_dialogue_file(path, obj, ordered, zones, findings):
    zone_id = obj.get("zone_id")
    if not zone_id:
        findings.append(Finding(path, "WARN", "pas de zone_id — budget ignoré"))
        return
    studied = studied_set_for_zone(zone_id, ordered, zones)
    if studied is None:
        findings.append(Finding(path, "WARN", f"zone_id '{zone_id}' absent de kanji-zone-assignment.json"))
        return

    name_field = obj.get("name", {})
    name_jp = name_field.get("jp", "") if isinstance(name_field, dict) else ""

    # furigana check applies to everything, including the name field
    for jp in [name_jp, *_all_jp_strings(obj, skip_keys=())]:
        for run in missing_inline_readings(jp):
            findings.append(Finding(path, "FAIL", f"lecture inline manquante sur « {run} » dans « {jp} »"))

    # budget check excludes the name field, and exam_name (師範/Jalons-examens exam title —
    # a fixed proper-noun-like label, same exemption logic as character names, CONTEXT.md
    # § Kanji Budget; added 2026-07-10 when Falkner's exam_name tripped the budget)
    body_jp = _all_jp_strings(obj, skip_keys=("name", "exam_name"))
    unknown = set()
    for jp in body_jp:
        unknown |= kanji_chars(jp) - studied
    if len(unknown) > 2:
        findings.append(Finding(
            path, "FAIL",
            f"budget dialogue dépassé : {len(unknown)} kanji hors studiedSet de '{zone_id}' "
            f"(max 2) — {''.join(sorted(unknown))}",
        ))


def _all_jp_strings(obj, skip_keys):
    acc = []
    collect_jp_strings(obj, acc, skip_keys=skip_keys)
    return acc


def lint_text_object(path, text_obj, ordered, zones, findings):
    zone_id = text_obj.get("zone_id")
    jp_text = text_obj.get("jp_text", "")
    if not zone_id:
        findings.append(Finding(path, "WARN", "pas de zone_id — budget ignoré"))
        return
    studied = studied_set_for_zone(zone_id, ordered, zones)
    if studied is None:
        findings.append(Finding(path, "WARN", f"zone_id '{zone_id}' absent de kanji-zone-assignment.json"))
        return

    all_jp = [jp_text]
    for q in text_obj.get("questions", []):
        prompt = q.get("prompt", {})
        if isinstance(prompt, dict) and "jp" in prompt:
            all_jp.append(prompt["jp"])
        for opt in q.get("options", []):
            if isinstance(opt, dict) and "jp" in opt:
                all_jp.append(opt["jp"])

    for jp in all_jp:
        for run in missing_inline_readings(jp):
            findings.append(Finding(path, "FAIL", f"lecture inline manquante sur « {run} » dans « {jp} »"))

    plain_len = len(strip_furigana(jp_text))
    allowed = min(max(1, math.ceil(plain_len / 100 * 2)), 10)
    unknown = set()
    for jp in all_jp:
        unknown |= kanji_chars(jp) - studied
    if len(unknown) > allowed:
        findings.append(Finding(
            path, "FAIL",
            f"budget texte dépassé : {len(unknown)} kanji hors studiedSet de '{zone_id}' "
            f"(max {allowed} pour {plain_len} caractères) — {''.join(sorted(unknown))}",
        ))


def lint_lesson_examples(path, resolved_kanji, ordered, zones, findings):
    # Règle assouplie 2026-07-10 (décision utilisateur + PRD.md:411) : un kanji
    # entre dans le SRS/studiedSet uniquement quand SA PROPRE leçon est
    # complétée — son apparition incidente dans l'exemple d'un autre kanji ne
    # "l'enseigne" pas, exactement comme dans un dialogue. Donc plus de
    # contrainte "zéro autre kanji" ; seule la lecture inline reste obligatoire
    # sur tout kanji affiché (règle universelle ADR-0002, aucune exception).
    for entry in resolved_kanji:
        character = entry.get("character")
        if not character:
            continue
        for ex in entry.get("lesson_examples", []):
            jp = ex.get("jp", "")
            for run in missing_inline_readings(jp):
                findings.append(Finding(path, "FAIL", f"lecture inline manquante sur « {run} » dans « {jp} »"))


def lint_file(path, ordered, zones, findings):
    try:
        obj = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        findings.append(Finding(path, "FAIL", f"JSON invalide : {e}"))
        return

    if isinstance(obj, list) and obj and isinstance(obj[0], dict) and "kanji_ids" in obj[0]:
        # content/lessons/<zone_id>.json rows: no jp text of their own (kanji_ids/grammar_id
        # only) — the actual page content lives in kanji-content.json's lesson_examples[],
        # checked separately. Nothing to lint here.
        return
    if "dialogue_states" in obj:
        lint_dialogue_file(path, obj, ordered, zones, findings)
    elif "text" in obj and isinstance(obj["text"], dict) and "jp_text" in obj["text"]:
        lint_text_object(path, obj["text"], ordered, zones, findings)
    elif "jp_text" in obj:
        lint_text_object(path, obj, ordered, zones, findings)
    elif "resolved_kanji" in obj:
        lint_lesson_examples(path, obj["resolved_kanji"], ordered, zones, findings)
    else:
        findings.append(Finding(path, "WARN", "forme non reconnue (ni dialogue, ni texte, ni leçon) — ignoré"))


def resolve_paths(args):
    if args:
        return [Path(a) for a in args]
    paths = []
    seen = set()
    for pattern in DEFAULT_GLOBS:
        for p in ROOT.glob(pattern):
            if p not in seen:
                seen.add(p)
                paths.append(p)
    return paths


def main():
    ordered, zones = load_zone_assignment()
    paths = resolve_paths(sys.argv[1:])
    if not paths:
        print("Aucun fichier à vérifier (glob par défaut vide).")
        return 0

    findings = []
    for path in paths:
        lint_file(path, ordered, zones, findings)

    fails = [f for f in findings if f.level == "FAIL"]
    warns = [f for f in findings if f.level == "WARN"]

    for f in findings:
        print(f)

    print(f"\n{len(paths)} fichier(s) vérifié(s) — {len(fails)} échec(s), {len(warns)} avertissement(s).")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
