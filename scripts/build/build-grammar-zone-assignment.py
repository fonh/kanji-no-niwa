#!/usr/bin/env python3
"""
Construit content/grammar-zone-assignment.json : l'assignation des 828 points
de grammaire Hanabira -> zone, seconde moitié de l'étape 2 point 1 de la
roadmap pré-code ("Idem grammaire : 828 points Hanabira -> paliers -> zones").

Méthode — miroir de build-kanji-zone-assignment.py, mais sur un axe dérivé :
1. Palier -> fenêtre de kanji cumulée : table déjà publiée et relue
   (content/curriculum-checkpoints.md § "Cartes mots par palier JLPT", colonne
   "Repère kanji cumulé" : N5 0-130, N4 130-290, N3 290-520, N2 520-900,
   N1 900-2136). Réutilisée telle quelle plutôt que re-dérivée, pour ne pas
   introduire une deuxième source de vérité sur les mêmes bornes.
2. Dans chaque palier, les points de grammaire gardent l'ordre du fichier
   source (scripts/sources/grammar_JLPT_N{1-5}.json — aucun autre signal
   d'ordre pédagogique disponible : s_tag est constant, non discriminant).
3. Partition proportionnelle (même esprit que l'Option A retenue pour le
   kanji) : à l'intérieur d'un palier, chaque zone de croissance reçoit une
   part des points de grammaire du palier proportionnelle à son recouvrement
   kanji avec la fenêtre du palier (gère nativement les zones à cheval sur
   deux paliers, ex. Niveau "N4/N3"). Chaînée pour ne jamais assigner deux
   fois le même point.

Prérequis : content/kanji-zone-assignment.json (généré par
build-kanji-zone-assignment.py) — fournit cumulative_start/end par zone.

Sortie : content/grammar-zone-assignment.json.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PALIER_ORDER = ['N5', 'N4', 'N3', 'N2', 'N1']

PALIER_ROW_RE = re.compile(r'^\|\s*(N[1-5])\s*\|.*\|\s*(\d[\d\s]*)–(\d[\d\s]*)\s*\(')


def load_grammar_points():
    points = {}
    for palier in PALIER_ORDER:
        with open(ROOT / 'scripts' / 'sources' / f'grammar_JLPT_{palier}.json', encoding='utf-8') as f:
            data = json.load(f)
        points[palier] = [
            {'id': f'{palier}-{i + 1:03d}', 'title': g['title']}
            for i, g in enumerate(data)
        ]
    return points


def parse_palier_kanji_ranges():
    """Table 'Cartes mots par palier JLPT' § colonne 'Repère kanji cumulé'."""
    path = ROOT / 'content' / 'curriculum-checkpoints.md'
    lines = path.read_text(encoding='utf-8').splitlines()
    ranges = {}
    in_table = False
    for line in lines:
        if line.startswith('| Palier JLPT |'):
            in_table = True
            continue
        if not in_table:
            continue
        if not line.startswith('|'):
            break
        if line.startswith('|---'):
            continue
        m = PALIER_ROW_RE.match(line)
        if not m:
            continue
        palier, low, high = m.groups()
        ranges[palier] = (int(low.replace(' ', '')), int(high.replace(' ', '')))
    missing = set(PALIER_ORDER) - set(ranges)
    if missing:
        raise ValueError(f'Paliers manquants dans la table "Repère kanji cumulé" : {missing}')
    return ranges


def load_kanji_zones():
    with open(ROOT / 'content' / 'kanji-zone-assignment.json', encoding='utf-8') as f:
        data = json.load(f)
    # Zones de croissance uniquement (plateau exclu — aucune part de grammaire,
    # même logique que "zéro croissance requise" côté kanji), ordre du fichier
    # = ordre du parcours (déjà celui de la table de calibration).
    return [z for z in data['zones'] if not z['is_plateau']]


def assign_palier(palier, points, kanji_range, zones):
    low, high = kanji_range
    width = high - low
    n_points = len(points)

    weighted = []
    for z in zones:
        overlap = min(z['cumulative_end'], high) - max(z['cumulative_start'], low)
        if overlap > 0:
            weighted.append((z['zone_id'], overlap))

    total_weight = sum(w for _, w in weighted)
    assignment = {}
    if total_weight == 0:
        return assignment, [f'{palier}: aucune zone de croissance ne recouvre la fenêtre {low}-{high}, {n_points} points non assignés']

    cursor_units = 0.0
    cursor_points = 0
    for zone_id, weight in weighted:
        cursor_units += weight
        target_points = round(cursor_units / total_weight * n_points)
        count = target_points - cursor_points
        assignment[zone_id] = [p['id'] for p in points[cursor_points:target_points]]
        cursor_points = target_points

    warnings = []
    if cursor_points != n_points:
        warnings.append(f'{palier}: {n_points - cursor_points} point(s) non assignés par arrondi (largeur couverte {total_weight}/{width})')
    elif total_weight != width:
        warnings.append(f'{palier}: recouvrement réel {total_weight}/{width} (écart dû aux zones sans croissance assignée côté kanji — voir kanji-zone-assignment-report.md)')

    return assignment, warnings


def main():
    grammar_points = load_grammar_points()
    total = sum(len(v) for v in grammar_points.values())
    print(f'{total} points de grammaire chargés ({", ".join(f"{p}:{len(grammar_points[p])}" for p in PALIER_ORDER)})')

    kanji_ranges = parse_palier_kanji_ranges()
    print(f'Fenêtres kanji par palier : {kanji_ranges}')

    zones = load_kanji_zones()
    print(f'{len(zones)} zones de croissance chargées depuis kanji-zone-assignment.json')

    per_zone = {z['zone_id']: [] for z in zones}
    all_warnings = []

    for palier in PALIER_ORDER:
        assignment, warnings = assign_palier(palier, grammar_points[palier], kanji_ranges[palier], zones)
        all_warnings += warnings
        for zone_id, ids in assignment.items():
            per_zone[zone_id] += ids

    out = {
        'zones': [{'zone_id': z['zone_id'], 'niveau': z['niveau'], 'grammar_ids': per_zone[z['zone_id']]} for z in zones],
        'grammar_points': {palier: grammar_points[palier] for palier in PALIER_ORDER},
        'total_points': total,
        'warnings': all_warnings,
    }
    out_path = ROOT / 'content' / 'grammar-zone-assignment.json'
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Écrit {out_path.relative_to(ROOT)}')

    if all_warnings:
        print(f'\n⚠️  {len(all_warnings)} avertissement(s) :')
        for w in all_warnings:
            print(f'  - {w}')


if __name__ == '__main__':
    main()
