#!/usr/bin/env python3
"""
Construit content/kanji-zone-assignment.json : l'assignation kanji -> zone,
étape 2 point 1 de la roadmap pré-code (.scratch/audits/roadmap-pre-code.md).

Deux temps :
1. Ordre canonique des 2136 kanji — simulation itérative de la même logique
   que getAvailableKanji (src/lib/progression-engine.ts) : à chaque tour, les
   kanji dont tous les composants sont déjà "étudiés" deviennent disponibles,
   triés par palier JLPT puis grade Joyo. Le graphe de composants est
   reconstruit hors-ligne à partir des mêmes sources que les imports DB
   (scripts/import/import-kanjivg.ts, import-kradfile.ts) — kanjivg en source
   primaire, kradfile/kradfile2 en supplément — sans dépendance à Neon.
2. Découpe de cette liste ordonnée selon la table de calibration par zone
   (content/curriculum-checkpoints.md) : partition chaînée sur les bornes
   hautes des zones de croissance (Option A retenue en revue — voir la borne
   basse comme simple métadonnée). Les zones plateau/optionnelles (détectées
   au marqueur "plateau" dans la table) n'avancent jamais le curseur : leur
   pool est déjà couvert par les zones de croissance précédentes.

Sortie : content/kanji-zone-assignment.json + rapport de relecture humaine
dans .scratch/audits/kanji-zone-assignment-report.md (écarts fenêtre déclarée
vs. réellement assignée, avertissements de composants circulaires).
"""
import gzip
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / 'scripts' / 'sources'
KVG_ELEMENT = '{http://kanjivg.tagaini.net}element'

JLPT_ORDER = {'N5': 0, 'N4': 1, 'N3': 2, 'N2': 3, 'N1': 4}


def load_kanji_content():
    with open(ROOT / 'src' / 'data' / 'kanji-content.json', encoding='utf-8') as f:
        return json.load(f)


def parse_kanjivg(known):
    """Composants visuels — source primaire. Même logique que import-kanjivg.ts :
    enfants directs du premier <g> dont le kvg:element diffère du parent,
    filtrés aux kanji connus des deux côtés."""
    path = next(SOURCES.glob('kanjivg-*.xml.gz'))
    with gzip.open(path, 'rb') as f:
        root = ET.fromstring(f.read())
    graph = {}
    edge_set = set()
    for kanji_el in root.findall('kanji'):
        g = kanji_el.find('g')
        if g is None:
            continue
        parent_el = g.get(KVG_ELEMENT)
        if not parent_el or parent_el not in known:
            continue
        comps = set()
        for child in g.findall('g'):
            el = child.get(KVG_ELEMENT)
            if el and el != parent_el:
                comps.add(el)
        comps = {c for c in comps if c in known}
        if comps:
            graph.setdefault(parent_el, set()).update(comps)
            for c in comps:
                edge_set.add((parent_el, c))
    return graph, edge_set


def parse_kradfile(path):
    m = {}
    with open(path, encoding='latin1') as f:
        content = f.read()
    for line in content.split('\n'):
        line = line.strip()
        if not line or line.startswith('#') or ' : ' not in line:
            continue
        kanji, rest = line.split(' : ', 1)
        kanji = kanji.strip()
        comps = [c for c in rest.strip().split(' ') if c.strip()]
        if kanji and comps:
            m[kanji] = comps
    return m


def build_component_graph(known):
    graph, existing_edges = parse_kanjivg(known)

    # kradfile + kradfile2 : supplète les edges manquants, ne remplace jamais
    # kanjivg (même priorité que import-kradfile.ts).
    map1 = parse_kradfile(SOURCES / 'kradfile')
    map2 = parse_kradfile(SOURCES / 'kradfile2')
    for k, v in map2.items():
        map1.setdefault(k, v)

    for kanji, comps in map1.items():
        if kanji not in known:
            continue
        for c in comps:
            if c not in known or (kanji, c) in existing_edges:
                continue
            graph.setdefault(kanji, set()).add(c)

    return {k: sorted(v) for k, v in graph.items()}


def order_kanji(kanji_content, graph):
    def sort_key(k):
        info = kanji_content[k]
        jlpt = JLPT_ORDER.get(info.get('jlpt'), 5)
        grade = info.get('grade')
        return (jlpt, grade if grade is not None else 99, k)

    remaining = set(kanji_content.keys())
    studied = set()
    ordered = []
    warnings = []

    while remaining:
        available = [k for k in remaining if all(c in studied for c in graph.get(k, []))]
        if not available:
            # Référence circulaire de composants (rare, mais kanjivg décompose
            # parfois des formes l'une en fonction de l'autre) — on force le
            # prochain kanji par ordre de tri pour ne pas bloquer, à relire.
            forced = sorted(remaining, key=sort_key)[0]
            missing = [c for c in graph.get(forced, []) if c not in studied]
            warnings.append(f'deadlock : {forced} forcé (composants non résolus : {missing})')
            available = [forced]
        available.sort(key=sort_key)
        for k in available:
            ordered.append(k)
            studied.add(k)
            remaining.discard(k)

    return ordered, warnings


ROW_RE = re.compile(r'^\|\s*([a-z0-9-]+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$')


def parse_calibration_table():
    path = ROOT / 'content' / 'curriculum-checkpoints.md'
    lines = path.read_text(encoding='utf-8').splitlines()
    rows = []
    in_table = False
    for line in lines:
        if line.startswith('| Zone | Display Name | Kanji'):
            in_table = True
            continue
        if not in_table:
            continue
        if not line.startswith('|'):
            break
        if line.startswith('|---') or line.startswith('|------'):
            continue
        m = ROW_RE.match(line)
        if not m:
            raise ValueError(f'Ligne de table de calibration non reconnue : {line!r}')
        zone_id, display_raw, window_raw, niveau, _phrase_len = m.groups()
        rows.append({'zone_id': zone_id, 'display_raw': display_raw, 'window_raw': window_raw, 'niveau': niveau})
    return rows


def clean_display(display_raw):
    return re.sub(r'\s*\*\(.*?\)\*', '', display_raw).strip()


def extract_window(window_raw):
    """(low, high) bornes cumulées déclarées, en ignorant les asides *(...)*."""
    prefix = re.split(r'\*?\(', window_raw, maxsplit=1)[0]
    nums = [int(n) for n in re.findall(r'\d+', prefix.replace(' ', ''))]
    if not nums:
        raise ValueError(f'Aucun nombre trouvé dans la fenêtre {window_raw!r}')
    if len(nums) == 1:
        return nums[0], nums[0]
    return nums[0], nums[-1]


def is_plateau(window_raw):
    if 'plateau' in window_raw.lower():
        return True
    # Convention de la table : une fenêtre à valeur unique (pas de "X–Y") est
    # toujours une référence de palier déjà atteint, jamais une vraie fenêtre
    # de croissance — cas non couvert par le marqueur textuel "plateau"
    # explicite (ex. mt-silver-summit : "2136" sans l'annotation).
    low, high = extract_window(window_raw)
    return low == high


def assign_zones(rows, ordered):
    cursor = 0
    results = []
    warnings = []

    for row in rows:
        low, high = extract_window(row['window_raw'])
        plateau = is_plateau(row['window_raw'])
        target = min(high, len(ordered))

        if plateau:
            new_kanji = []
            start, end = cursor, cursor
        elif target < cursor:
            warnings.append(
                f"{row['zone_id']}: borne haute déclarée ({target}) < curseur courant "
                f"({cursor}) — zone hors-ordre, aucun kanji assigné, à vérifier manuellement."
            )
            new_kanji = []
            start, end = cursor, cursor
        else:
            new_kanji = ordered[cursor:target]
            start, end = cursor, target
            cursor = end

        results.append({
            'zone_id': row['zone_id'],
            'display_name': clean_display(row['display_raw']),
            'niveau': row['niveau'],
            'is_plateau': plateau,
            'declared_window': [low, high],
            'cumulative_start': start,
            'cumulative_end': end,
            'kanji_count': len(new_kanji),
            'new_kanji': new_kanji,
        })

    return results, warnings, cursor


def find_shared_window_groups(results):
    """Repère les blocs de zones de croissance consécutives qui déclarent
    exactement la même fenêtre (ex. les 5 salles de l'Elite Four, toutes
    870-900) : seule la première du bloc absorbe la croissance, les
    suivantes reçoivent 0 par construction — signalé pour confirmation
    humaine plutôt que corrigé silencieusement (peut vouloir dire "bloc
    plat, aucune n'a de croissance dédiée", voir PRD § Ordre de production)."""
    groups = []
    current = []
    for r in results:
        if r['is_plateau']:
            if len(current) > 1:
                groups.append(current)
            current = []
            continue
        window = tuple(r['declared_window'])
        if current and tuple(current[-1]['declared_window']) == window:
            current.append(r)
        else:
            if len(current) > 1:
                groups.append(current)
            current = [r]
    if len(current) > 1:
        groups.append(current)
    return groups


def write_report(results, order_warnings, partition_warnings, final_cursor, total_kanji):
    shared_groups = find_shared_window_groups(results)

    lines = [
        '# Rapport de relecture — assignation kanji -> zone',
        '',
        f'Généré par `scripts/build/build-kanji-zone-assignment.py`. '
        f'Curseur final après la dernière zone de croissance : **{final_cursor}/{total_kanji}**.',
        '',
        '## Points nécessitant une décision humaine',
        '',
    ]
    findings = list(partition_warnings)
    for group in shared_groups:
        zones = ', '.join(g['zone_id'] for g in group)
        window = group[0]['declared_window']
        findings.append(
            f"fenêtre partagée {window[0]}–{window[1]} entre {zones} : seule la première "
            f"({group[0]['zone_id']}, {group[0]['kanji_count']} kanji) reçoit la croissance par "
            f"construction, les autres reçoivent 0 — à confirmer (bloc réellement plat, comme "
            f"la Ligue 870–900 déjà documentée « ne porte aucune leçon obligatoire » au PRD, "
            f"ou répartition à revoir)."
        )
    lines += [f'- {w}' for w in findings] if findings else ['Aucun — la partition automatique couvre les 83 zones sans ambiguïté.']

    lines += ['', '## Avertissements de construction du graphe de composants', '']
    lines += [f'- {w}' for w in order_warnings] if order_warnings else ['Aucun.']
    lines += [
        '',
        '## Fenêtre déclarée vs. assignation réelle',
        '',
        '| Zone | Plateau | Fenêtre déclarée | Largeur déclarée | Kanji assignés | Écart |',
        '|------|---------|-------------------|-------------------|-----------------|-------|',
    ]
    for r in results:
        low, high = r['declared_window']
        declared_width = high - low
        actual = r['kanji_count']
        deviation = actual - declared_width
        flag = ' ⚠️' if not r['is_plateau'] and abs(deviation) > max(15, declared_width * 0.3) else ''
        lines.append(
            f"| {r['zone_id']} | {'oui' if r['is_plateau'] else ''} | {low}–{high} | "
            f"{declared_width} | {actual} | {deviation:+d}{flag} |"
        )
    (ROOT / '.scratch' / 'audits' / 'kanji-zone-assignment-report.md').write_text(
        '\n'.join(lines) + '\n', encoding='utf-8'
    )


def main():
    kanji_content = load_kanji_content()
    known = set(kanji_content.keys())
    print(f'{len(known)} kanji chargés depuis kanji-content.json')

    graph = build_component_graph(known)
    print(f'Graphe de composants : {len(graph)} kanji avec au moins un prérequis')

    ordered, order_warnings = order_kanji(kanji_content, graph)
    assert len(ordered) == len(known), f'{len(ordered)} ordonnés != {len(known)} connus'
    print(f'Ordre canonique produit : {len(ordered)} kanji ({len(order_warnings)} avertissement(s) de deadlock)')

    rows = parse_calibration_table()
    print(f'Table de calibration : {len(rows)} zones parsées')

    results, partition_warnings, final_cursor = assign_zones(rows, ordered)

    out = {
        'ordered_kanji': ordered,
        'zones': results,
        'total_kanji': len(ordered),
        'final_cursor': final_cursor,
        'construction_warnings': order_warnings,
        'partition_warnings': partition_warnings,
    }
    out_path = ROOT / 'content' / 'kanji-zone-assignment.json'
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Écrit {out_path.relative_to(ROOT)}')

    write_report(results, order_warnings, partition_warnings, final_cursor, len(ordered))
    print(f'Écrit .scratch/audits/kanji-zone-assignment-report.md')

    if partition_warnings:
        print(f'\n⚠️  {len(partition_warnings)} avertissement(s) de partition — voir le rapport.')


if __name__ == '__main__':
    main()
