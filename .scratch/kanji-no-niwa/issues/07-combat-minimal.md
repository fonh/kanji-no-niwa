# 07 — Combat minimal (HP/vies + modes Sens, Lecture, Saisie, Composition, Grammaire-QCM)

Status: ready-for-human
Bloqué par: 03, 04
Bloque: 10

## Contexte

Aucun système de combat n'existe (`MapClient.tsx:298` : « spotted » ouvre juste le
dialogue). Le jalon 1 a besoin d'un seul combat obligatoire : **Silver #1 à Ville
Griotte** (12 questions, `sight_auto`, sur le retour de chez Mr. Pokémon) — plus les
3 dresseurs optionnels de Route 30 (Don/Joey/Mikey). PRD § Système de Combat ;
`src/lib/progression-engine.ts` a déjà `getBattlePool`, `isInSight`,
`selectQuestionMode` (à vérifier/compléter).

## Périmètre (vertical slice)

**Données** : `battle_results` (`battle_id`, `lives_lost`, `modes_used[]`, `accuracy`,
`played_at`) ; `defeated_trainers[]` dans `user_map_state` (issue 02) ;
`battle_length` lu depuis `content/map/trainers.json` (Silver #1 = **12**, valeur de la
table PRD — jamais depuis le fichier dialogue).

**Service** :
- Tirage : `getBattlePool(studiedItems)` — fenêtre 50 derniers items, 70/30 (PRD
  § Dresseurs) ; pas de répétition dans un combat (pool locale sans remise, remise si
  épuisée) ; `selectQuestionMode` avec **gardes d'exclusion + redistribution
  proportionnelle à chaque tirage** (PRD § 1.4) — les modes non implémentés ou sans
  données sont simplement exclus, invisibles pour le joueur.
- Vies : `N = max(2, ceil(questions × 0.10))` → Silver #1 = 2 vies, la N-ième erreur est
  fatale. Barre adverse : `1/questions` par bonne réponse (visuel pur).
- **Modes implémentés au jalon 1** : Sens (4 sens EN — la graduation vers les
  définitions JP attendra, aucun item ne sera maîtrisé si tôt), Lecture (4 lectures
  hiragana, distracteurs anti-ambiguïté), Saisie (composant `KanaInput` de l'issue 04),
  Composition (4 tiles dont exactement 2 forment un mot valide — vérifier contre le
  lexique au tirage), Grammaire en QCM (`times_drawn` < 3 ; incrémente
  `times_drawn`/`last_drawn_at`). Traduction/Conjugaison/Disposition/Écoute : exclus par
  les gardes (pas de données branchées) — prévus à l'échelle.
- **Mélange des choix à l'affichage obligatoire** (engine-contract § 8).

**UI** :
- Déclenchement : Sight Cone (`isInSight`) → « ! » → mouvement bloqué → transition
  diagonale (`public/sprites/ui/battle/transition/`), écran VS, accroche
  (`battle_intro`), puis questions.
- Mauvaise réponse : **correction affichée 1-2 s** (surlignage vert / lecture attendue),
  puis question suivante, vie perdue quand même. Jamais de retry en combat.
- Défaite : écran bref (sprite + message), retour carte, **rejouable immédiatement**.
  Victoire : `post_battle`, Effects, dresseur assis/passif, `defeated_trainers` mis à
  jour, `battle_results` écrit.
- **Aucun état de combat persisté** : fermer l'app = fuite, retour carte. En combat,
  START/SELECT inertes, B n'abandonne pas.

## Critères d'acceptation

- Silver #1 jouable de bout en bout : embuscade auto, 12 questions, 2 vies, défaite →
  rejouable, victoire → quête avance et Silver disparaît/change d'état conformément au
  contenu. Don/Joey/Mikey (Route 30) jouables en Talk/Sight selon leur registre.
- Tests : calcul des vies (bornes), tirage sans remise, gardes d'exclusion +
  redistribution, shuffle, séquence victoire/défaite (idempotence des Effects si
  re-combat).

## Hors périmètre

Les 4 modes fondateurs restants, la graduation anglais→japonais (stabilité ≥ 14 j), les
13 modes additionnels, le format examen 試練 à sections (premier besoin : Falkner,
zone 5) — chacun deviendra une issue à l'échelle.

## Comments

**2026-07-30 (agent, implémentation)** — Fait, en TDD strict (moteur pur puis
actions serveur puis composant : tests rouges d'abord à chaque couche).
56 tests nouveaux (39 moteur node + 8 actions DB-mockée + 9 .tsx jsdom),
364 au total, `npm run check` tout vert.

Livré :
- `db/migrations/006_battle_results.sql` — additive : table `battle_results`
  (`user_id`, `battle_id`, `lives_lost`, `modes_used[]` = le mode de chaque
  question dans l'ordre — nourrira le relevé de notes des examens —,
  `accuracy`, `played_at` DEFAULT now() serveur). Une ligne par VICTOIRE
  seulement : la défaite ne persiste rien (aucun état de combat sauvegardé,
  rejouable immédiatement). **Non appliquée** (DATABASE_URL vide ici) —
  `npm run db:migrate -- db/migrations/006_battle_results.sql`.
- `src/lib/battle.ts` — moteur pur, zéro I/O, rng injecté. **Choix module
  dédié plutôt qu'extension de progression-engine** : le bloc « battle mode
  selection » qui y vivait était un prototype d'avant le PRD courant (poids
  obsolètes, garde grammaire < 5 au lieu de == 0, Math.random en dur), sans
  consommateur — supprimé avec ses tests, remplacé par ce module. API :
  `livesFor` (max(2, ceil(q×0.10)), bornes testées 5→2, 20→2, 21→3, 100→10),
  `studiedKanjiInOrder` (**items étudiés = kanji des leçons complétées**,
  dérivés de `completed_lessons[]` × `content/lessons/<zone>.json` — même
  source que l'ordre pédagogique, zéro lecture SRS), `getBattlePool` (fenêtre
  des 50 derniers / historique, ratio annulé si < 50) + `drawBattleContent`
  (70/30, sans remise, remise interne si épuisé), `selectBattleMode` (poids
  PRD 2026-07-21 des 9 fondateurs, gardes d'exclusion + redistribution
  proportionnelle À CHAQUE tirage — les 13 additionnels non encodés : la
  renormalisation rend leurs poids sans effet sur les ratios des modes
  restants), générateurs par mode (Sens keyword-prioritaire ; Lecture
  hiragana avec garde anti-ambiguïté — jamais un distracteur qui est aussi
  une lecture valide de l'item ; Saisie via `finalizeKana`/`isKanaText`,
  accepte on OU kun, okurigana avec et sans ; Composition ; Grammaire cloze
  QCM depuis l'overlay), `buildBattleScript` (assemblage complet, pas de
  répétition de contenu : `used` partagé Sens/Lecture/Saisie, paires et
  points à part), réducteur `startProgress`/`applyAnswer` (la N-ième erreur
  est fatale, y compris sur la dernière question), fractions de barres HP.
- **Composition : implémentée, pas exclue.** Source fichier trouvée :
  `scripts/sources/yomitan-jlpt/` (~8 100 mots JLPT avec lecture, CC BY-SA ;
  loader `getCompositionLexiconWords()` dans content.ts, même précédent que
  la base Hanabira). Cibles = mots de 2 kanji dont les deux ∈ studiedSet
  (一人・二人・大人・入口… dès les leçons 1-2, vérifié par test sur le vrai
  lexique) ; garde d'unicité « aucune autre paire ni ordre ne forme un mot »
  vérifiée au tirage contre lexique JLPT + mots d'exemples de kanji-content.
  **Limite documentée** : l'unicité est prouvée contre le lexique fichier,
  pas contre JMdict entier (159 Mo, pas raisonnable au runtime) — une paire
  de distracteurs pourrait théoriquement former un mot hors-JLPT obscur ; la
  table `words` complète prendra le relais à l'ingestion en base.
- `src/app/map/battle-actions.ts` — `engageTrainer(trainerId)` : LE point
  d'entrée serveur (embuscade ET Talk) — non battu → script complet assemblé
  serveur (battle_length du REGISTRE — Silver #1 = 12 vérifié, les 307
  entrées l'ont ; grammaire = `grammar_encounters` → overlay via nouvel index
  `getGrammarPointById`) + incrément `times_drawn`/`last_drawn_at` par point
  TIRÉ (horodaté serveur) ; battu → pages post_battle, plus jamais de
  re-combat auto. `winBattle` : defeated_trainers[] + battle_results,
  **idempotente** (re-victoire = zéro écriture, testé) ; Effects éventuels du
  post_battle appliqués via la lib 02 (aucun dans le contenu du jalon) ;
  stats client bornées serveur. Aucune écriture SRS nulle part.
- `src/app/map/BattleScreen.tsx` — **overlay plein écran plutôt que route**
  (documenté : l'état du combat vit client et n'est jamais persisté — un
  overlay le garantit par construction, aucune URL rejouable, fermer l'app =
  fuite ; et il réutilise DialogueBox/rafraîchissement de zone de MapClient).
  Transition diagonale (les 9 PNG en séquence), écran VS (dos joueur selon
  l'avatar + sprite dresseur + nom jp), accroche battle_intro en DialogueBox
  (X/Y compris), barres HP symétriques (adverse −1/questions par bonne
  réponse, joueur −1/N par erreur), question → réponse → **mauvaise réponse :
  bonne option surlignée vert 1,5 s (lecture attendue en Saisie, mot+lecture
  en Composition), vie perdue, question suivante — jamais de retry (testé :
  re-clic pendant la correction inerte)**. Victoire → winBattle → post_battle
  → retour carte ; défaite → écran bref (sprite + めのまえが　まっくらに…) →
  retour carte, rejouable. B/Escape inertes (testé) ; START/SELECT n'existent
  pas encore dans l'app (issue 09) — rien à rendre inerte. Choix re-mélangés
  À L'AFFICHAGE (`shuffledIndices`, rng injectable, testé : l'ordre stocké ne
  transparaît pas).
- Déclenchement — MapClient minimal (stub sight remplacé) : état
  `battle`/`engagingTrainer` + gardes (mouvement, A/B, clavier),
  `checkSightLine` réel (rôle battle + non battu + `trigger_type sight_auto`
  + `isInSightLine` → « ! » 700 ms → combat), Talk sur dresseur non battu →
  combat aussi, battu → post_battle ; victoire → re-fetch /api/zone (marqueur
  gris + carte de dresseur de Silver gated `npc_cleared` révélée sans
  rechargement). `ZoneTrainer` gagne `role`/`trigger_type`/`defeated` (posé
  par `filterVisibleTrainers`, qui a déjà l'état).
- `src/data/ui-strings.json` : +6 chaînes système (prompts par mode, こたえ,
  écran de défaite). Aucun français/latin visible joueur (l'anglais des
  prompts Sens/Saisie est le support d'acquisition du PRD).

Critères d'acceptation, un par un :
1. Silver #1 de bout en bout : embuscade auto (sight_auto, cherrygrove-city
   (63,0), portée 4 — registre vérifié), 12 questions (registre, jamais le
   fichier dialogue — testé), 2 vies, défaite → rien d'écrit, rejouable
   immédiatement, nouveau tirage complet à chaque engagement (le script est
   re-assemblé par engageTrainer) ; victoire → defeated_trainers +
   battle_results + post_battle (ふん。/またな。), Silver **reste** sur la
   carte en post_battle et la carte de dresseur apparaît — conforme au
   contenu réel : son entrée registre n'a pas d'unlock_conditions et seul
   `silver_card_cherrygrove` est gated `npc_cleared`. **Aucun advance_quest
   n'est branché sur cette victoire dans le contenu** (la quête œuf avance
   chez Elm/Mr. Pokémon) — « la quête avance » de l'issue se lit « l'état
   avance conformément au contenu », ce qui est le cas. ✓
2. Don/Joey/Mikey (route-30, sight_auto, 5 questions → 2 vies) jouables en
   Sight ET en Talk — mêmes chemins de code, testés via engageTrainer. ✓
3. Tests : vies (bornes), tirage sans remise + remise à l'épuisement, gardes
   d'exclusion + redistribution (grammaire == 0 rencontres, composition sans
   lexique, redistribution 18/33 déterministe), shuffle stocké (rng) ET
   affiché (jsdom), séquence victoire/défaite avec idempotence des écritures
   au re-combat. ✓

Écarts/décisions :
- **Grammaire : QCM pour tous les tirages au jalon** (pas seulement
  times_drawn < 3) — la saisie de grammaire arrive avec la graduation ;
  times_drawn est déjà compté à chaque tirage pour qu'elle démarre juste.
- **Boss vs route** : le registre n'a pas de champ catégorie —
  `battleTypeForTrainer` = heuristique `silver_*` → boss, documentée dans le
  code, à remplacer par un champ de registre à l'échelle.
- **Composition à la sélection tactile ordonnée (2 taps numérotés ①②)**
  plutôt qu'un vrai glisser-déposer — même mécanique testée (l'ordre
  compte), le drag n'apporte rien sur mobile paysage ; à revoir si la QA
  humaine préfère.
- Saisie accepte la kun avec ET sans okurigana (ひと et ひとつ) — généreux,
  trivial à resserrer.
- DailyLoop (issue 06) rend ses overlays en z-85/90, au-dessus du combat
  (z-80) : l'invite du mentor du premier lancement du jour pourrait
  recouvrir un combat déjà engagé — en pratique elle se joue à l'arrivée sur
  la carte, avant tout combat ; noté pour l'issue 10/QA.
- Sprite de combat : mapping par classe (youngster/lass/camper/bug_catcher
  extraits) ; **Silver n'a pas de sprite de combat extrait** → silhouette ？
  (VS, arène, défaite), jamais un crash — asset à extraire à la passe assets.
- Pas de vérification visuelle en navigateur (DATABASE_URL absent, connu
  depuis l'issue 02) — la QA humaine (phase 6) verra transition/VS/arène.
