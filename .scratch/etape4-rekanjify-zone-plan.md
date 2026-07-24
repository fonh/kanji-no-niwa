# Plan de re-kanjification par zone — Étape 4 phase 2

Créé 2026-07-24 après auto-évaluation du travail de la session (programmeur + prof de
japonais + game designer). Complète `.scratch/etape4-progress.md` (qui garde le journal
chronologique) avec une vue priorisée de ce qui reste, pour qu'une session future n'ait
pas à refaire l'analyse depuis zéro.

## Auto-évaluation de la session (2026-07-23/24)

**Comme programmeur.** Points forts : chaque bug trouvé (le plafond de zones dans
`build-core-promotion.py`, l'écrasement accidentel de `kanji-core-promotion.json`,
l'automatisation de re-kanjification aux dialogues) a été détecté par une vérification
systématique après coup (linters, diff, relecture) plutôt que découvert plus tard par
quelqu'un d'autre — et corrigé avec un garde-fou pour empêcher la récidive, pas juste
rustiné. Point faible, le même sur les trois cas : le bug a été *construit* avant
d'être vérifié, jamais anticipé par une conception plus prudente en amont — notamment
`rekanjify-dialogues.py` : l'ambiguïté des homophones sans analyse morphologique était
prévisible avant d'écrire 200 lignes, pas seulement après le premier essai en
conditions réelles. Leçon : sur ce projet, prototyper sur 1 fichier avant de construire
le pipeline complet, systématiquement.

**Comme professeur de japonais.** Points forts : chaque kanji ajouté cette session est
vérifié individuellement contre le studiedSet réel (méthode du linter,
`ordered[:cumulative_start]`, jamais une approximation) et contre le sens réel en
contexte — plusieurs pièges homophoniques évités par la lecture attentive plutôt que
par un dictionnaire (者 vs 物 selon que « もの » réfère à une personne ou une chose ;
竜 pas 流 pour « dragon » ; 聖地 jamais réduit à un demi-mot par un lookup aveugle).
Point faible : la couverture reste très partielle (19/536 fichiers de dialogue,
12/18 textes) — mesuré maintenant avec `lint-kanji-density.py` : 390 fichiers sur 467
éligibles restent sous le plancher de 10 %. Une vraie évaluation de progression a
besoin de ce chiffre affiché régulièrement, pas seulement d'anecdotes zone par zone —
d'où ce document.

**Comme game designer.** Point fort : la priorité *narrative* a été respectée pour la
passe textes (dragons-den 660 kanji étudiés → ice-path 590 → ... en ordre décroissant,
conforme à la règle du guide). Point faible, trouvé en écrivant ce plan : la passe
**dialogues** n'a PAS suivi cet ordre — dragons-den (660) et ice-path (590) sont
justifiés, mais route-42 (520, position 29ᵉ sur 58 par richesse) et surtout
**ilex-forest (220, 46ᵉ sur 58)** ont été traités par commodité (petit nombre de
fichiers, 3 et 5) plutôt que par priorité réelle. Le travail fait sur ces deux zones
reste correct et n'a pas besoin d'être défait, mais casse la garantie « le studiedSet
le plus riche d'abord » que le reste de la passe doit respecter à partir de maintenant.
Le tableau ci-dessous corrige le tri.

## Méthode (rappel, ne change pas)

1. Aucune automatisation de l'écriture réelle des kanji — l'ambiguïté homophonique
   (どう/動, いく/幾, りゅう/流…) est indécidable par un lookup de dictionnaire seul ;
   confirmé en pratique (~40 % d'erreurs sur un essai réel, § journal 2026-07-24).
   `scripts/build/rekanjify-report.py` reste utilisable comme **aide à la découverte**
   (candidats à vérifier), jamais comme source de vérité.
2. studiedSet exact du linter : `ordered_kanji[:zone.cumulative_start]` — jamais
   l'ordre narratif (trop permissif, cf. le bug de la phase 1 sur `elm_great_text.json`).
3. Lecture inline immédiatement après le KANJI, avant les okurigana (学（まな）ぶ, pas
   学ぶ（まなぶ）) — vérifié par `lint-kanji-budget.py` sur chaque édition.
4. Après chaque zone : les 5 linters (`lint-kanji-budget.py`, `lint-cross-refs.py`,
   `check-cs-kanji-deadlock.py`, `calc-cs-corpus.py`, `lint-grammar-overlay.py`), puis
   commit + push (pattern déjà établi, un commit par zone ou petit groupe de zones).
5. Mesurer la densité réelle avec `scripts/validate/lint-kanji-density.py` après
   chaque lot de zones, pas seulement à la fin — le nombre de fichiers sous le
   plancher (390/467 au 2026-07-24) est LE indicateur de progression de cette passe.

## Tableau des zones — ordre de priorité réel (studiedSet décroissant)

`WARN` = nombre de fichiers de dialogue de cette zone actuellement sous le plancher de
densité (mesuré 2026-07-24, `lint-kanji-density.py`). `Fichiers` = total de fichiers
dialogue dans `content/dialogues/**/<zone>/`. Zones déjà traitées cette session : ✅.

### Tier 1 — studiedSet ≥ 830 (Kanto avancé + Ligue Johto)

Vocabulaire disponible : la quasi-totalité du N4 et une bonne part du N3 sont étudiés
à ce stade — ces zones ont le plus grand nombre de mots kanjifiables par phrase, donc
le meilleur retour sur investissement en densité. **Priorité absolue pour la suite.**

| Zone | studiedSet | Fichiers | WARN | Notes |
|---|---:|---:|---:|---|
| route-24-25-kanto | 1350 | 12 | 0 | ✅ fait 2026-07-24. Finale Suicune, fil Bill — déjà écrit avec soin (Lot 13), bon candidat pour une passe complète courte. |
| cerulean-city | 1250 | 10 | 1 | ✅ fait 2026-07-24. Azuria, 17 leçons N1 — vocabulaire de gym/combat (力/闘 déjà enseignés à ce point). 1 fichier (swimmer_diana) reste à 0% : aucun mot du fichier n'a tous ses kanji étudiés (真/勝/負/溺 hors studiedSet), aucune amélioration sûre possible. |
| route-8-kanto | 1240 | 7 | 0 | ✅ fait 2026-07-24. Fusionné avec route-9-10 dans le texte mais garde son propre dossier dialogues. |
| kanto-power-plant | 1240 | 3 | 0 | ✅ fait 2026-07-24. Vocabulaire technique (電気/機械/発電所 tous disponibles). |
| lavender-town | 1220 | 1 | 0 | ✅ fait 2026-07-24. |
| route-9-10-rocktunnel | 1200 | 9 | 0 | ✅ fait 2026-07-24. |
| saffron-city | 1060 | 11 | 0 | ✅ fait 2026-07-24. 24 leçons N1, Copycat/Sabrina — dialogues denses, bon volume de gain. |
| route-6-kanto | 1050 | 5 | 0 | ✅ fait 2026-07-24. |
| indigo-plateau-{koga,bruno,karen,lance,will} | 870-900 | 1 chacun | 0 | ✅ fait 2026-07-24. 四天王（してんのう）devient kanjifiable dès l'antichambre (四/天/王 tous studied) — cohérence appliquée sur les 3 occurrences body-text du titre. |
| vermilion-city | 900 | 38 | 36 | **Le plus gros fichier-count de tout le corpus après goldenrod-city.** SS Aqua (27 combats), Surge — prévoir une session dédiée, pas un lot avec d'autres zones. |
| indigo-plateau-antichambre | 830 | 3 | 0 | ✅ fait 2026-07-24 (avec le lot indigo-plateau ci-dessus). |

### Tier 2 — studiedSet 700-830 (fin de Johto)

| Zone | studiedSet | Fichiers | WARN |
|---|---:|---:|---:|
| route-27 | 800 | 8 | 8 |
| route-26 | 760 | 8 | 8 |
| route-46 | 760 | 3 | — |
| dark-cave | 740 | 1 | — |
| route-45 | 720 | 7 | — |
| dragons-den | 660 | 6 | 0 | ✅ fait 2026-07-24 |

### Tier 3 — studiedSet 500-660 (Ebènelle → Mékanos)

| Zone | studiedSet | Fichiers | WARN |
|---|---:|---:|---:|
| blackthorn-city | 610 | 14 | 13 |
| ice-path | 590 | 5 | 0 | ✅ fait 2026-07-24 |
| route-44 | 570 | 7 | — |
| lake-of-rage | 565 | 10 | 8 |
| route-43 | 560 | 7 | — |
| mahogany-town | 545 | 23 | 22 | Gros volume (arc QG Rocket) — prévoir 2 sessions. |
| mt-mortar | 535 | 4 | — |
| route-47-48-cliff-cave | 520 | 4 | — |
| safari-zone | 520 | 1 | — |
| **route-42** | 520 | 5 | 0 | ✅ fait 2026-07-24 (hors ordre, cf. auto-évaluation) |
| cianwood-city | 510 | 10 | 9 |
| whirl-islands | 510 | 0 | — | Aucun dialogue (zone à 0 PNJ, déjà notée close). |

### Tier 4 — studiedSet 250-500 (Oliville → Doublonville)

| Zone | studiedSet | Fichiers | WARN |
|---|---:|---:|---:|
| route-40 / route-41 | 490 | 7+10 | — |
| olivine-city | 460 | 19 | 18 |
| route-39 | 445 | 10 | 10 |
| route-38 | 430 | 5 | — |
| burned-tower | 410 | 7 | — |
| ecruteak-city | 370 | 23 | 11 |
| route-37 | 355 | 5 | — |
| route-36 | 330 | 4 | — |
| national-park | 310 | 9 | — |
| route-35 | 290 | 9 | 9 |

### Tier 5 — studiedSet < 290 (Bourg Geon → Doublonville 1ʳᵉ visite)

Gains attendus faibles par fichier (peu de mots kanjifiables-connus disponibles,
confirmé sur les zones early déjà vérifiées cette passe : route-36/sprout-tower/
route-29/new-bark-town textes — souvent 0 amélioration sûre possible). Traiter en
dernier, viser la couverture plutôt que la densité par fichier.

| Zone | studiedSet | Fichiers |
|---|---:|---:|
| goldenrod-city | 255 | 50 | **Le plus gros fichier-count du corpus entier.** studiedSet modeste (255) mais 42 fichiers sous le plancher — volume, pas densité individuelle. Découper en au moins 3 sessions par sous-lieu (magasin/Game Corner/Tour Radio déjà distincts narrativement). |
| route-34 | 240 | 10 |
| **ilex-forest** | 220 | 3 | ✅ fait 2026-07-24 (hors ordre, cf. auto-évaluation — gain réel mais aurait dû venir après le Tier 4) |
| slowpoke-well | 210 | 5 |
| azalea-town | 195 | 10 |
| union-cave | 180 | 12 |
| route-33 | 180 | 1 |
| ruins-of-alph | 160 | 3 |
| route-32 | 140 | 14 |
| sprout-tower | 130 | 3 |
| violet-city | 100 | 11 |
| route-31 | 80 | 3 |
| route-30 | 60 | 6 |
| cherrygrove-city | 50 | 5 |
| route-29 | 30 | 2 |
| new-bark-town | 0 | 6 | studiedSet nul en tout début de partie — vérifier au cas par cas mais gain quasi nul attendu (confirmé sur les textes déjà revus). |

## Ce que chaque tier apporte, par discipline

- **Programmeur** : les tiers 1-2 ont le meilleur ratio gain/effort (studiedSet riche
  → plus de candidats par phrase relue) — les traiter en premier maximise la densité
  mesurée par `lint-kanji-density.py` pour le moins de fichiers touchés. goldenrod-city
  et vermilion-city doivent chacun être leur propre session (50 et 38 fichiers) : ne
  jamais les mélanger dans un lot avec d'autres zones, le contexte de relecture (quels
  mots ont déjà été vus dans CE fichier) se perd sinon.
- **Professeur de japonais** : les tiers 1-2 sont aussi où le vocabulaire N3/N2 réel du
  jeu (試験, 質問, 相談, 準備…) devient disponible — kanjifier ici enseigne le
  vocabulaire le plus proche de ce qu'un joueur va réellement lire dans les textes
  progressifs avancés déjà écrits. Les tiers 4-5 n'ont souvent que des mots-outils
  (前/後/人/一) déjà enseignés dans les zones early elles-mêmes — utile pour la
  cohérence mais moins pour la densité globale.
- **Game designer** : goldenrod-city (boutiques, Game Corner, Tour Radio) et
  vermilion-city (SS Aqua, Surge) sont les deux hubs qu'un joueur relit le plus
  souvent (retours fréquents en cours de partie) — même à studiedSet modeste, les
  finir complètement a un impact perçu disproportionné par rapport à leur position
  dans le tri par richesse. Les traiter juste après le Tier 1-2, pas en tout dernier
  malgré leur studiedSet plus bas — exception assumée à l'ordre strict, à documenter
  si prise.
