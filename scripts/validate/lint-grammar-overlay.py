#!/usr/bin/env python3
"""Linter de l'overlay grammaire (Point 4 — câblage).

Vérifie chaque content/grammar/<zone>.json contre le corpus source Hanabira
(scripts/sources/grammar_JLPT_N{1..5}.json). Contrôle le contrat de fusion :
  - grammar_id 'N{lvl}-{NNN}' résout vers le point source [NNN-1] et son titre concorde ;
  - jp (furigana retirée) == la phrase source ;
  - point_surface (défaut = point_answer) est présent dans jp ;
  - jp_cloze == jp avec point_surface remplacé par ＿＿ ;
  - 3 distractors distincts, aucun == point_answer ;
  - tout kanji affiché dans jp/jp_cloze porte une Inline Reading (heuristique ADR-0002).

Sortie : liste des échecs, code retour non nul si au moins un échec.
"""
import json, re, sys, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "scripts", "sources", "grammar_JLPT_{lvl}.json")

KANJI = re.compile(r"[一-龯]")
FURI = re.compile(r"（[^）]*）")


def strip_furi(s):
    return FURI.sub("", s)


def kanji_all_have_reading(s):
    """Chaque run de kanji doit être immédiatement suivi de （…）."""
    # retire les runs kanji suivis d'une parenthèse pleine-chasse, puis vérifie qu'il ne
    # reste aucun kanji « nu ».
    cleaned = re.sub(r"[一-龯々]+（[^）]*）", "", s)
    return not KANJI.search(cleaned)


def load_source(level):
    with open(SRC.format(lvl=level), encoding="utf-8") as f:
        return json.load(f)


def main():
    failures = []
    checked = 0
    src_cache = {}
    files = sorted(glob.glob(os.path.join(ROOT, "content", "grammar", "*.json")))
    for path in files:
        with open(path, encoding="utf-8") as f:
            ov = json.load(f)
        zone = ov.get("zone_id", os.path.basename(path))
        for p in ov.get("points", []):
            gid = p["grammar_id"]
            m = re.match(r"(N[1-5])-(\d+)", gid)
            if not m:
                failures.append(f"[{zone}] {gid}: id illisible")
                continue
            level, num = m.group(1), int(m.group(2))
            src = src_cache.setdefault(level, load_source(level))
            idx = p.get("source_index", num - 1)
            if idx != num - 1:
                failures.append(f"[{zone}] {gid}: source_index {idx} ≠ {num-1} (règle NNN-1)")
            if idx >= len(src):
                failures.append(f"[{zone}] {gid}: index {idx} hors corpus {level}")
                continue
            g = src[idx]
            if p.get("title") and p["title"] != g["title"]:
                failures.append(f"[{zone}] {gid}: titre '{p['title']}' ≠ source '{g['title']}'")
            for se in p.get("selected_examples", []):
                ei = se["source_example_index"]
                tag = f"[{zone}] {gid} ex{ei}"
                if ei >= len(g.get("examples", [])):
                    failures.append(f"{tag}: exemple hors source")
                    continue
                ex = g["examples"][ei]
                surface = se.get("point_surface", se["point_answer"])
                if strip_furi(se["jp"]) != ex["jp"]:
                    failures.append(f"{tag}: jp (sans furigana) ≠ phrase source")
                if surface not in se["jp"]:
                    failures.append(f"{tag}: point_surface '{surface}' absent de jp")
                elif se["jp"].replace(surface, "＿＿", 1) != se["jp_cloze"]:
                    failures.append(f"{tag}: jp_cloze ≠ jp avec point_surface effacé")
                d = se.get("distractors", [])
                if len(d) != 3 or len(set(d)) != 3 or se["point_answer"] in d:
                    failures.append(f"{tag}: distractors invalides (3 distincts, ≠ réponse)")
                for field in ("jp", "jp_cloze"):
                    if not kanji_all_have_reading(se[field]):
                        failures.append(f"{tag}: kanji sans Inline Reading dans {field} (ADR-0002)")
                checked += 1

    if failures:
        print("\n".join(failures))
        print(f"\n{len(files)} overlay(s), {checked} exemple(s) — {len(failures)} échec(s).")
        sys.exit(1)
    print(f"{len(files)} overlay(s) grammaire, {checked} exemple(s) vérifié(s) — cohérents.")


if __name__ == "__main__":
    main()
