# Guide d'écriture de contenu — gabarit de méthode par zone

Document créé 2026-07-10, en généralisant la section « Méthode » qui était copiée-collée dans
chaque prompt de lot (`prompt-etape4-lot1-*.md`, `prompt-etape4-lot2-content.md`). **But :**
un futur prompt de lot n'a plus qu'à lister les zones et pointer ici, au lieu de redériver les
conventions à la dure. Complète, sans les dupliquer, les règles déjà fixées ailleurs
(`CONTEXT.md`, ADR, `PRD.md`) — en cas de divergence, ces documents-là font foi.

---

## 1. Sources à lire avant d'écrire quoi que ce soit, pour chaque zone

Dans cet ordre :

1. **`content/npc-inventory.md`** — cherche `## <zone_id> —` : liste des PNJ sourcés, rôle
   d'origine, colonne **Type assigné** (lesson #N / combat / ambiant) avec les kanji/grammar_id
   déjà décidés pour les leçons.
2. **`content/guidebook-adapted.md`** — section correspondante, pour la narration/les beats.
3. **`content/map/placements/<zone>.json`** — positions `tile_x`/`tile_y` sourcées ROM quand
   disponibles (`source: rom_matched`), sinon `generated` (position à inventer, le signaler dans
   `position_status`).
4. **`content/lessons-proposal.json`** — filtre par `zone_id` : donne le `kanji_ids`/`grammar_ids`
   exact déjà assigné à chaque leçon, à copier tel quel dans `content/lessons/<zone>.json`. Ne
   jamais réordonner ni recomposer le pool pour des raisons thématiques (audit « no kanji
   theming » — ordre pédagogique pur, jamais de curation symbolique).
5. **`content/rom-trainer-roster.json`** — filtre par `zone_id` : classe/nom exacts des dresseurs
   de combat, pour éviter d'inventer une classe.
6. **§ 3 ci-dessous (ressources livres)** — seulement pour calibrer registre/grammaire/situations,
   jamais comme source de PNJ ou de faits narratifs.

## 2. Fichiers à produire par zone

- `content/dialogues/npcs/<zone_id>/<npc_id>.json` (PNJ ambiants/leçon) et
  `content/dialogues/trainers/<zone_id>/<trainer_id>.json` (dresseurs de combat) — format
  `dialogue_states`/`state_rules`/`pages`, voir n'importe quel fichier déjà écrit comme modèle
  (ex. `content/dialogues/npcs/violet-city/earl_violet_city.json`).
- `content/lessons/<zone_id>.json` — tableau de `{zone_id, npc_ref, sequence_index, kanji_ids[],
  grammar_id}`, copié depuis `lessons-proposal.json`. **Pense à `src/data/kanji-content.json`** :
  chaque `kanji_ids[]` écrit doit avoir un `lesson_examples[]` réel (voir § 4) — c'est le trou
  trouvé le 2026-07-10 (115 kanji sur 6 zones enseignés sans exemple, aucun linter ne l'attrape).
- `content/texts/<zone_id>/<nom>.json` si `content/side-content-inventory.md` liste un texte
  « tout trouvé » sourcé pour cette zone.
- Enregistrement dans `content/map/npcs.json` / `content/map/trainers.json` (et
  `content/map/obstacles.json` si un obstacle CS-Kanji ou objet-clé existe pour la zone).

## 3. Ressources livres (`scripts/sources/japanse books/`) — comment et quand s'en servir

**Mise à jour 2026-07-10** : le « blocage OCR » documenté dans `japanese-books-mapping.md`
(17/18 PDF sont des scans sans texte extractible, aucun `tesseract` installé) ne s'applique qu'à
un *script* essayant d'extraire du texte machine. Il ne bloque pas la lecture directe par
l'agent qui écrit le contenu — voir `scripts/build/render-book-pages.py`.

**Procédure** :
1. Identifie le bon livre pour la zone via la table paliers de
   `content/japanese-books-mapping.md` § Mapping palier par palier (ex. Route 34 → Doublonville
   = Marugoto A2-2 かつどう+りかい).
2. `python3 scripts/build/render-book-pages.py "<chemin du pdf>" <page_début> <page_fin>`
   (max 20 pages/appel) → PNG dans `scratch/book-pages/<nom>/` (jamais commité, voir
   `.gitignore`).
3. Lis les PNG avec l'outil `Read`, directement — pas d'OCR intermédiaire, plus fiable sur les
   mises en page mixtes kanji/furigana/illustrations que tesseract ne l'aurait été.
4. Prends la *situation*, le *séquençage grammatical*, ou le *vocabulaire prioritaire* — jamais
   le texte verbatim (règle déjà posée, licences « usage privé jamais publié »). Adapte à la
   zone/au personnage en cours d'écriture.

**Ce que chaque famille sert à calibrer** (détail complet : `japanese-books-mapping.md` § Rôle de
chaque famille) :

| Besoin d'écriture | Livre à consulter |
|---|---|
| Situation de dialogue PNJ (acheter, demander un chemin…) | Marugoto かつどう du palier (table paliers) |
| Ordre d'introduction d'une structure grammaticale | Marugoto りかい du palier |
| Priorité de vocabulaire N5 | ごいちょう A1 |
| Candidat pour `content/texts/<zone>/` (tier secondaire) | Recueils d'histoires (YCRJ, Tuttle, JSS for Beginners) — vetting 12bis avant intégration |
| Mnémotechnique/étymologie d'un kanji | Heisig RTK 1 (jamais pour l'ordre des kanji) |

**`kanji.lesson_examples[]` (§ 4) peut maintenant s'inspirer des livres aussi** — voir la
révision de règle ci-dessous, ça n'est plus le champ à part qu'il était.

## 4. `kanji.lesson_examples[]` — méthode (pour combler au fil de l'écriture, pas après coup)

Champ défini au PRD § Schéma Base de Données : `{jp, en, audio_ref, source}`.

**Règle révisée 2026-07-10** (l'ancienne « zéro autre kanji » est abandonnée — voir
`roadmap-pre-code.md` § Étape 4 pour le fil de la décision) : **aucune contrainte de kanji
inconnu**. Un kanji ne devient « étudié » (SRS, `studiedSet`, gates) que lorsque **sa propre**
leçon est complétée (`PRD.md` § Timing des nouvelles cartes) — son apparition dans l'exemple d'un
*autre* kanji est purement incidente, sans effet mécanique, exactement comme dans un dialogue.
Seule règle qui reste, universelle et sans exception : **lecture inline sur tout kanji affiché**
(ADR-0002) — vérifié par `lint-kanji-budget.py` sur l'intégralité de la phrase, pas seulement sur
le kanji de l'entrée.

Concrètement :

1. Écris une phrase naturelle pour le kanji cible — piochée dans le corpus Tatoeba déjà importé
   (`scripts/sources/tatoeba_jpn_eng.json`, filtrable par `kanji_set`), inspirée d'une page de
   livre lue via `render-book-pages.py` (§ 3), ou composée à la main. Plus besoin de filtrer sur
   un seul kanji : un mot composé réel (ex. 大工, 気候, 解剖) est préférable à une phrase-étiquette
   artificielle.
2. Ajoute la lecture inline sur **chaque** kanji de la phrase, pas seulement celui de l'entrée.
3. Nettoie le registre si la phrase vient de Tatoeba (le corpus brut contient de l'argot/du
   familier à éviter).
4. Écris un script `scripts/build/add-<zone>-lesson-examples.py` sur le modèle de
   `add-etape4-lot2prep-lesson-examples.py` (source de vérité unique : `src/data/kanji-content.json`).
5. **Fais-le zone par zone, pas en fin de lot** — c'est exactement l'étape qui a été oubliée sur
   6 zones lors du passage précédent, sans qu'aucun linter ne s'en aperçoive.

## 4bis. `kanji.keyword` — anglais éditorialisé affiché sur la double-page (Étape 4, 2026-07-23)

`meanings[0]` du dataset brut est parfois trompeur en tête de liste (ex. 校 = "exam"
avant "school", 拉 = "Latin" avant "drag/pull") — jamais l'afficher tel quel comme mot-clé
de la fiche. Si `keyword` est absent, on le complète au fil de l'écriture de la zone
(un mot anglais simple, cohérent avec l'usage réellement enseigné) ; le batch des kanji
déjà en jeu sans `keyword` se fait au fil des zones, pas en une passe unique.

## 5. Règles de contenu à ne jamais oublier

- **Règle #1** (`guidebook-adapted.md`) : aucun Pokémon n'apparaît jamais comme compagnon de
  combat d'un personnage. Zéro exception, déjà violée deux fois par erreur (lot 1) et corrigée.
- **Zéro PNJ inventé** : tout personnage sourcé dans `npc-inventory.md` ou `guidebook-adapted.md`.
  Zone sans PNJ-leçon éligible → cascade vers une zone voisine mieux fournie, jamais d'invention.
- **Budget kanji dialogue** : max 2 kanji hors studiedSet par dialogue entier (`name`/`exam_name`
  exemptés du compte, jamais de la règle de lecture inline) ; textes = proportionnel ~2/100
  caractères, plafond 10.
- **Lecture inline obligatoire** : `道場（どうじょう）`, jamais de kanji sans sa lecture entre
  parenthèses pleine chasse juste après (ADR-0002).
- **`lessons.unlock_conditions`** (optionnel) : seulement si un PNJ-leçon porte aussi de la
  narration devant passer avant ses leçons (Elm, Guide Gent) — sinon laisser vide.
- **Boss de gym — format examen** : `exam_name` bilingue, exempté du budget kanji comme les noms
  de personnage ; `unlock_conditions` gaté sur `npc_cleared` de chaque 門弟, voir
  `falkner_violet_city.json`/`bugsy_azalea.json` comme modèles.
- **Silver — 6 rencontres** (`PRD.md` § Silver) : vérifier la table avant d'écrire une nouvelle
  apparition, ne jamais dupliquer un numéro déjà utilisé.

## 6. Auto-test — après chaque zone, pas seulement à la fin

```
python3 scripts/validate/lint-kanji-budget.py
python3 scripts/validate/lint-cross-refs.py
python3 scripts/validate/check-cs-kanji-deadlock.py
python3 scripts/validate/calc-cs-corpus.py
```

Le 4ᵉ script a une liste `NARRATIVE_ORDER` en dur en tête de fichier — l'étendre avec les
nouvelles zones dans leur vrai ordre de visite (pas `story-beats.json § order`, qui suit l'ordre
kanji abstrait). Si un outil échoue : corrige le contenu, ne baisse jamais le seuil pour faire
passer un vrai problème ; si c'est un faux positif légitime, documente-le dans le fichier
concerné.

**Vérification manuelle complémentaire** (les linters ne couvrent pas tout — trouvailles
2026-07-10) :
- Grep les noms d'espèces Pokémon dans les dialogues écrits (aucun linter ne l'attrape, règle #1
  a déjà été violée deux fois silencieusement).
- Compare chaque `kanji_ids[]` écrit contre `kanji-content.json` : tout kanji sans
  `lesson_examples[]` est un trou (§ 4).
- Variété des types de question sur les textes secondaires (`idee_generale`/`detail_factuel`/
  `vocabulaire_contexte`/`inference`/`resolution_reference`/`answer_span`) — ne pas recycler les
  3 mêmes sur tous les textes, le gabarit `text-example.json` montre la panoplie complète.

## 7. En terminant un lot

Mets à jour `.scratch/audits/roadmap-pre-code.md` § Étape 4 avec une section « Lot N » au même
format que « Lot 1 »/« Lot 2 » (zones couvertes, nombre de fichiers, kanji dotés d'exemples,
vraies erreurs trouvées, simplifications assumées). Ne touche à aucun fichier hors de ce qui est
décrit dans le prompt du lot — plusieurs sessions travaillent parfois en parallèle sur des zones
différentes.
