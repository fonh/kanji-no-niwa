# 05 — Écran-livre des leçons + règle leçon-ou-blocage + création des cartes SRS

Status: ready-for-human
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

## Comments

**2026-07-29 (agent, implémentation)** — Fait, en TDD strict (chaque module :
tests écrits d'abord). 60 tests nouveaux, 273 au total, `npm run check` tout vert.

Livré :
- `db/migrations/004_srs_cards.sql` — additive : `cards` gagne `item_type`
  (`'kanji'|'word'` via contrainte CHECK **nommée**, modifiable par ALTER — pas
  d'enum SQL fermé, extensible pour le canal grammaire éventuel de l'issue
  hors-jalon 06), `item_id`, `facet` (`'sens'|'lecture'`), backfill des lignes
  existantes depuis `kanji_id`/`card_type` (meaning→sens, reading→lecture),
  nouvel unique `(user_id, item_type, item_id, facet)`. Les colonnes legacy
  restent en place (la page /study les lit encore) mais deviennent nullables
  (une carte `word` n'aura pas de `kanji_id`). + table `grammar_encounters`
  (`first_seen_at`, `times_drawn`, `last_drawn_at` — les deux derniers
  attendent la rotation de combat, issue 07). **Non appliquée** (DATABASE_URL
  vide ici) — `npm run db:migrate -- db/migrations/004_srs_cards.sql`.
- `src/lib/lessons.ts` — logique pure, zéro I/O. API (les issues 06/09
  construisent dessus) :
  - `lessonQuestId(zone)` = `lessons-<zone>`, `lessonStepId(seq)` =
    `lesson-<seq>`, `lessonId(zone, seq)` = `<zone>#<seq>` (l'entrée de
    `completed_lessons[]`) ;
  - `lessonQuestSteps(lessons)` / `withLessonQuestSteps(index, zone, lessons)` —
    la quête implicite n'a AUCUN fichier content/quests : ses steps sont dérivés
    du fichier de leçons et fusionnés dans le QuestStepsIndex à la demande ;
  - `nextLessonInZone(lessons, state)` — la tête de la queue, pilotée par
    `npc_quest_progress` (source de vérité de l'ordre) ;
  - `resolveLessonInteraction(npcRef, lessons, state, ctx) →
    {kind:'lesson',lesson} | {kind:'blocked'} | {kind:'fallback_dialogue'}` —
    LA règle leçon-ou-blocage : hors d'ordre → blocked (toujours, même si la
    tête d'un autre PNJ est verrouillée) ; tête du PNJ verrouillée par ses
    `unlock_conditions` → dialogue_ref ordinaire (coupure aller-retour d'Elm,
    vérifiée contre le fichier réel : #1-2 gated `sent_by_elm`, #3-5 gated
    `egg_delivered`) ; zone finie ou PNJ sans leçon → dialogue ordinaire
    (la relecture passe par le Carnet) ;
  - `isLessonCompleted`, `nextMorningDue(serverNow, tzOffsetMinutes)` (offset
    client borné ±14 h), `buildNewCards(kanjiIds, now, dueAt)` (2 cartes/kanji,
    `createEmptyCard` ts-fsrs) ;
  - `getLessonBook(zones, state, ctx)` (lecture seule, issue 09) — chapitres =
    zones passées par l'appelant DANS L'ORDRE (le mapping MAP_* ↔ slug de zone
    reste à l'appelant), lignes à 4 états : `completed` (kanji_ids +
    grammar_id visibles), `next` (npc_ref seul — jamais le contenu), `locked`
    (tête gated par unlock_conditions), `masked` (???).
- `src/lib/lesson-quiz.ts` — `buildLessonQuiz(lesson, content, grammarPoint,
  rng)` : 1 question/kanji (Sens OU Lecture au sort par kanji) + 1 Grammaire si
  point ; `primaryMeaning` (keyword ?? meanings[0], contrat § 7), 
  `primaryReading` (on[0] sinon kun nettoyée) ; distracteurs tirés globalement
  dans kanji-content (uniques, ≠ bonne réponse) ; choix stockés déjà mélangés
  (rng) ET re-mélangés à l'affichage par l'UI à chaque tentative (contrat § 8).
- `src/lib/lesson-book.ts` — `buildKanjiPages` / `buildGrammarPage` : le
  serveur assemble un objet sérialisable, le client ne lit jamais content/ ni
  kanji-content.json. icon_ref/audio nullables (icône désactivée, jamais un
  crash).
- `src/lib/content.ts` — loaders grammaire : `getGrammarForZone` /
  `getGrammarPoint` (overlay `content/grammar/<zone>.json`),
  `getGrammarSource(level)` / `getGrammarSourceEntry(point)` (base Hanabira
  `scripts/sources/grammar_JLPT_N*.json`, cache module séparé) ;
  `getLessonBlockedLines` (banque partagée `dialogues/shared/lesson-blocked.json`
  — fichier pas encore écrit → [], fallback ui-strings).
- `src/app/lesson/actions.ts` — server action `completeLesson(zone, seq,
  tzOffsetMinutes)` : re-validation serveur (seule LA leçon que la règle
  désigne se complète — l'URL/le client ne contournent jamais l'ordre), 12
  cartes en `on conflict (user_id, item_type, item_id, facet) do nothing`,
  `advance_quest` sur la quête implicite + `completed_lessons[]`
  (savePlayerState seulement si l'état a changé), upsert `grammar_encounters`.
  **Idempotente** : leçon déjà complétée → retour immédiat, zéro écriture
  (testé avec la couche DB mockée).
- **Book Screen** : route dédiée `/lesson/[zone]/[seq]`
  (`src/app/lesson/[zone]/[seq]/page.tsx` serveur +
  `src/app/lesson/BookScreen.tsx` client). Choix route-plutôt-qu'overlay :
  écran dédié plein écran du PRD, MapClient reste minimal (une redirection),
  et la reprise « page 1 » après interruption est gratuite (recharger la route
  repart du début, aucun curseur stocké). Chrome livre CSS original
  (`.book-chrome/.book-frame/.book-page/.book-spine/.book-accent` dans
  globals.css — parchemin + cadre bois, esprit Wagotabi sans le copier,
  fontes DS existantes) en attendant les assets dédiés. Une double page par
  kanji (gauche : caractère 8xl, on-yomi en vermillon distinct, kun avec
  okurigana entre 括弧, **keyword prioritaire**, icône emoji si présente,
  audio ♪ désactivé si absent ; droite : `lesson_examples[]` en `JpText`,
  lectures masquées, Y révèle) ; page grammaire (overlay + Hanabira EN,
  segments tapables → popup lecture aux couleurs du livre, dismiss en tapant
  ailleurs) ; mini-quiz habillage livre (mauvaise réponse → MÊME question,
  re-mélange des choix à chaque tentative, pas de skip) ; B = confirmation
  puis retour carte ; relecture d'une leçon complétée = même écran, quiz null.
- **Déclenchement** : `interactWithNpc(npcId, dialogueRef)` dans
  `src/app/map/actions.ts` — PNJ `role: lesson` (registre) → règle
  leçon-ou-blocage ; leçon → le client route vers `/lesson/<zone>/<seq>` ;
  blocked → ligne de blocage en boîte de dialogue standard ; sinon →
  `reachDialogueState` comme avant. MapClient : 3 retouches seulement (le
  branchement `startNpcInteraction` sur onA/click PNJ + useRouter) —
  dresseurs/obstacles inchangés.
- Prototype `src/app/lessons/[id]/` (table DB déconnectée) **supprimé**.
- `src/data/ui-strings.json` : +9 chaînes système (confirmation de fermeture,
  はい/いいえ, retry quiz, fin de leçon, retour carte, ligne de blocage…).

Critères d'acceptation, un par un :
1. Les 5 leçons d'Elm dans l'ordre — walkthrough complet dans
   `lessons.test.ts` sur le vrai fichier (première approche → dialogue ;
   sent_by_elm → #1 puis #2 ; #3 avant `egg_delivered` → **dialogue ordinaire
   d'Elm** ; egg_delivered → #3, #4, #5 ; zone finie → dialogue). ✓
2. Complétion #1 = 12 cartes (6 kanji × sens/lecture), toutes dues demain —
   `buildNewCards` sur le vrai fichier + test de `completeLesson` (DB mockée :
   12 inserts, `next_review_at` = minuit local suivant). ✓
3. Tests : règle (toutes les branches, dont hors-d'ordre-avec-tête-verrouillée),
   création de cartes (idempotence au rejeu + refus hors-tête), tirage du quiz
   (composition, Sens/Lecture au sort, distracteurs, grammaire), shuffle
   (stocké ET affiché) — 26 + 10 + 6 + 3 tests node, 10 tests .tsx jsdom,
   5 tests loaders. ✓

Écarts/décisions :
- **« Lendemain matin » = prochain minuit local du joueur** : le PRD ne fixe
  aucune heure « matin » et tranche (§ Jour calendaire) que le jour bascule à
  minuit local — une carte due au minuit local suivant est due « demain, jamais
  le jour même », et la session du matin la trouve due. Fuseau passé par le
  client (`Date.getTimezoneOffset()`, borné ±14 h serveur), écriture horodatée
  serveur.
- `content/dialogues/shared/lesson-blocked.json` n'existe pas encore (passe
  contenu) : le loader est prêt, fallback sur une ligne système ui-strings.
  Au jalon 1 la branche `blocked` est de toute façon inatteignable à
  new-bark-town (Elm porte les 5 leçons) ; aucun PNJ-leçon à cône de vision
  dans la zone 1 → la repoussée d'interception reste à brancher avec les
  mécaniques de cône (issues 07/10).
- Aucune leçon du corpus n'utilise `trainer_ref` (vérifié sur les 36 fichiers)
  → le déclenchement n'est branché que sur le flux PNJ.
- Bouton X (traduction EN des exemples de la page courante) ajouté au Book
  Screen en plus du Y requis — cohérent avec la boîte de dialogue, EN
  pédagogique uniquement.
- `getLessonBook` ne résout pas le mapping `visited_zones[]` (noms MAP_*) →
  slugs de zones de leçons : l'appelant (issue 09, Carnet) fournit les zones
  ordonnées — il n'existe pas de table de correspondance aujourd'hui
  (heuristique locale dans npcs.ts), à poser proprement à l'issue 09.
- Colonnes legacy `kanji_id`/`card_type` toujours remplies à l'insertion : la
  page /study continue de fonctionner telle quelle ; bascule sur
  `item_id`/`facet` à l'issue 06.
- Pas de vérification visuelle en navigateur (DATABASE_URL absent, connu
  depuis l'issue 02) — la QA humaine (phase 6) verra chrome livre, popups,
  audio (`/audio/kanji_examples/` n'existe pas encore sur disque : les boutons
  d'exemple jouent dans le vide en silence, par construction sans crash).
