# 07 — Combat minimal (HP/vies + modes Sens, Lecture, Saisie, Composition, Grammaire-QCM)

Status: ready-for-agent
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
