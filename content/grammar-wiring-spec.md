# Câblage grammaire — spec de la passe contenu (Point 4)

Créé 2026-07-17. Résout le constat d'audit « le syllabus grammaire est juste mais pas
encore *enseigné* » : les leçons portent un `grammar_id`, mais le contenu jouable du point
(explication, exemples câblés, distracteurs QCM) n'était pas relié.

**Fait fondateur** : le contenu pédagogique existe **déjà** dans le corpus source Hanabira
(`scripts/sources/grammar_JLPT_{N5..N1}.json`). Chaque point y a `title`,
`short_explanation`, `long_explanation`, `formation`, `examples[]` (jp/romaji/en +
`grammar_audio` **pré-enregistré**). Câbler ≠ rédiger : c'est **importer + générer les
distracteurs + sélectionner les exemples**. Gabarit de référence :
`content/gabarits/grammar-point-example.json`.

## 1. Résolution grammar_id → point source (vérifiée)

`N{niveau}-{NNN}` → `grammar_JLPT_N{niveau}.json[NNN-1]`.
L'ordre du corpus = l'ordre d'assignation des ids (vérifié sur N5-001..005 = index 0..4,
« A が いちばん～ … A。それじゃ、～B。 »). Déterministe, aucun mapping manuel à tenir.
Total câblable = 828 points (N5 136 / N4 124 / N3 132 / N2 191 / N1 245).

## 2. Champs importés tels quels (aucune réécriture)

`title`, `short_explanation`, `long_explanation`, `formation`, et par exemple
`jp_plain` (= `examples[].jp`), `en`, `romaji`, `grammar_audio`.
Les explications restent **en anglais** (PRD.md L44 / § Langue du Jeu — `note_fr` supprimée).

## 3. Champs ajoutés au câblage (à produire)

| Champ | Comment | Source |
|---|---|---|
| `jp` | `jp_plain` + **Inline Reading ADR-0002** (furigana pleine-chasse sur chaque kanji affiché) | humain / relu |
| `jp_cloze` | `jp` avec **`point_surface`** remplacé par `＿＿` (le trou du mode Saisie / QCM) | humain |
| `point_answer` | le motif à taper / l'option QCM correcte (ex. `いちばん`) — presque toujours kana pur (PRD L284) | humain |
| `point_surface` | la sous-chaîne exacte de `jp` effacée pour le cloze. **Défaut = `point_answer`** ; ne diffère que si le point s'écrit en kanji dans la phrase mais se tape en kana (ex. surface `一番（いちばん）` vs réponse `いちばん`) | humain |
| `distractors[]` | **3** options fausses-mais-plausibles pour le QCM (2 premiers tirages) | **batch IA relu, pipeline étapes 13-14** |
| `conjugation_distractors` | idem si le point a un slot conjugué ; `null` sinon | pipeline 14 |

## 4. Sélection des exemples (PRD L354)

Retenir **2-3 `example_variants`** les mieux couverts par le `studiedSet` *théorique* du
palier. Kanji résiduels **tolérés** (furigana via Y) — le corpus Hanabira est figé, jamais
réécrit. ⚠️ **Zones précoces** (New Bark : studiedSet ≈ vide) : tous les kanji des exemples
sont « inconnus » → pages grammaire fortement furiganées, en contraste avec les dialogues
100 % kana de la zone. C'est voulu et documenté, mais à garder en tête pour le ton du palier
N5 pur.

## 5. Checklist QC (par point câblé)

- [ ] `grammar_id` résout vers le bon point source (§1).
- [ ] Inline Reading sur **tout** kanji affiché dans `jp`/`jp_cloze` (ADR-0002, sans exception).
- [ ] `point_answer` = exactement le motif testé ; `jp_cloze` = `jp` avec ce motif blanci.
- [ ] 3 `distractors` **faux mais crédibles** : privilégier le *presque-juste* (ex. superlatif
      いちばん → distracteur もっと = comparatif) ; éviter un distracteur aussi correct que la
      réponse.
- [ ] **Exercer la lecture que le JLPT teste** — garde héritée de l'audit zone 1
      (一→ひとつ mais jamais いち) : si le point ou son exemple contient un item à lecture
      multiple, vérifier que la lecture affichée est bien celle du niveau.
- [ ] `grammar_audio` pointe vers un fichier existant (`public/audio/japanese/grammar/...`).
- [ ] Le point est **rencontré** au moins une fois dans la zone (leçon, dialogue PNJ, ou texte
      obligatoire) — sinon il n'entre jamais dans `grammar_encounters` et reste intestable
      (PRD § Pool de grammaire).

## 6. Stockage & validation

**Stockage** : overlay **par zone**, `content/grammar/<zone>.json`, calqué sur
`content/lessons/<zone>.json` — ne contient QUE la couche ajoutée (§3), jamais le contenu
Hanabira (fusionné au build via `source_index` / `source_example_index`).

**Linter** : `scripts/validate/lint-grammar-overlay.py` vérifie tout le contrat de fusion
(résolution id→source, `jp` sans furigana == source, `point_surface` ⊂ `jp`, `jp_cloze`
cohérent, distracteurs valides, Inline Reading sur tout kanji). À ajouter à la suite des 4
linters existants.

## 7. Ordre d'exécution

Zone par zone, **en parallèle de la passe contenu existante** (même découpage que
`.scratch/etape4-progress.md`). **Pilote validé et livré : New Bark (5 points N5-001..005,
10 exemples, linter vert)** — `content/grammar/new-bark-town.json`. Les distracteurs sont le
seul livrable non trivial → lot batch IA à lancer, la forme étant désormais figée sur le pilote.
