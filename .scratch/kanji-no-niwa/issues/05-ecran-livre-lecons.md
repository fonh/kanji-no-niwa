# 05 — Écran-livre des leçons + règle leçon-ou-blocage + création des cartes SRS

Status: ready-for-agent
Bloqué par: 02, 03
Bloque: 06, 09

## Contexte

PRD § Leçons, CONTEXT.md « Book Screen » / « Lesson NPC ». Le prototype
`src/app/lessons/[id]/` lit une table DB déconnectée du contenu réel — à remplacer par
un moteur branché sur `content/lessons/<zone>.json` + `src/data/kanji-content.json` +
`content/grammar/<zone>.json`. C'est le cœur jouable de la zone 1 : les 5 leçons d'Elm.

## Périmètre (vertical slice)

**Données** :
- Étendre `cards` (migration) : `item_type` (`kanji`|`word`, extensible), `item_id`,
  `facet` (`sens`|`lecture`) — en conservant les lignes existantes. (On garde les noms
  de tables `cards`/`reviews` ; le PRD les appelle `srs_cards`/`srs_reviews`, simple
  divergence de nommage à documenter.)
- `grammar_encounters` : `grammar_id`, `first_seen_at`, `times_drawn`, `last_drawn_at`.
- `completed_lessons[]` vit dans `user_map_state` (issue 02).

**Service** :
- Règle **leçon-ou-blocage** (dérivée, aucun champ nouveau — CONTEXT.md « Lesson NPC ») :
  comparer `lessons.sequence_index` à la progression de la quête implicite
  `lessons-<zone_id>` ; si la leçon en tête est verrouillée par ses propres
  `unlock_conditions` (cas d'Elm : leçons 3-5 gated sur `egg_delivered`), l'interaction
  **retombe sur le `dialogue_ref` ordinaire** du PNJ.
- Complétion → `Effect.advance_quest` sur `lessons-<zone_id>` + création de **2 cartes
  par kanji** (facettes sens/lecture), dues **à partir du lendemain matin** (jamais le
  jour même — PRD § Timing), FSRS init via `ts-fsrs`. C'est ce moment qui fait entrer le
  kanji dans `studiedSet`.
- Point de grammaire de la leçon → upsert `grammar_encounters` (first_seen).
- `getLessonBook` (lecture seule) — consommé par l'issue 09.

**UI (paysage, chrome livre)** :
- **Une double page par kanji** : gauche = caractère très grand, lecture, **mot-clé
  anglais** (`kanji.keyword` prioritaire sur `meanings[0]` — engine-contract § 7),
  `icon_ref` si présent, bouton audio ; droite = `lesson_examples[]` (1-2 phrases, audio).
- Page(s) grammaire ensuite (overlay `content/grammar/<zone>.json` sur
  `scripts/sources/grammar_JLPT_N*.json`), segments tapables (popup lecture/sens/audio).
- **Mini-quiz** : 1 question par kanji (Sens OU Lecture, tiré au sort) + 1 Grammaire si
  point présent ; distracteurs tirés globalement dans `kanji-content` ; **mélange des
  choix à l'affichage obligatoire** (ne jamais refléter `correct_index` —
  engine-contract § 8) ; mauvaise réponse → **on recommence la question**
  (retry-jusqu'à-correct, contrairement au combat). Pas de skip.
- Pas de sauvegarde/reprise : B = fermeture avec confirmation, reprise page 1.
- Relecture d'une leçon complétée = même écran sans quiz.

## Critères d'acceptation

- Les 5 leçons d'Elm se jouent dans l'ordre ; tenter la #3 avant `egg_delivered` retombe
  sur le dialogue ordinaire d'Elm ; après complétion de la #1, 12 cartes existent
  (6 kanji × 2 facettes), toutes dues demain.
- Tests : règle leçon-ou-blocage (unitaire, toutes les branches), création de cartes
  (idempotence si la leçon est rejouée), tirage du quiz, shuffle.

## Hors périmètre

Déblocage du vocabulaire par kanji étudié (`getAvailableWords` existe mais le flux
mots → cartes attend l'issue 06 ou une issue dédiée à l'échelle) ; audio manquant ne
bloque pas (icône désactivée).
