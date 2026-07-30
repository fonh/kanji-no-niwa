# 08 — Textes progressifs : fenêtre de lecture + quiz + déblocages moteur

Status: ready-for-human
Bloqué par: 02, 03
Bloque: 09 (le Journal de lecture liste les complétions)

## Contexte

PRD § Textes Progressifs, `content/texts-progressifs.md`. La zone 1 a 2 textes écrits :
`lyra_mail` (débloqué par l'**ouverture du PC du joueur** — un `unlock_text` que le
moteur doit émettre lui-même, `content/engine-contract.md` § 2) et `elm_great_text`.
Route 29 ajoute le panneau d'entrée (`johto_entrance_sign_route29`, même mécanisme).

## Périmètre (vertical slice)

**Données** : `text_completions` (`text_id`, `score`, `completed_at`, `gold_at`) ;
`unlocked_texts[]` dans `user_map_state` (issue 02). Contenu lu depuis
`content/texts/<zone>/<text_id>.json`.

**Service** :
- `unlock_text` émis par le moteur pour les textes sans donneur dialogue : interaction
  avec l'objet `player_pc_new_bark` (`kind: "object"` dans `content/map/npcs.json`) →
  débloque et ouvre `lyra_mail` ; interaction avec la tuile-panneau de Route 29 →
  `johto_entrance_sign_route29`. Table de correspondance objet/tuile → text_id dans le
  loader contenu, sourcée de engine-contract § 2.
- Complétion du quiz = quiz passé en retry-jusqu'à-correct → `completed_at` ; **passe
  sans faute** (première ou relecture, quiz remélangé) → `gold_at`.

**UI** :
- **Fenêtre de lecture** plein écran, même famille visuelle que l'écran-livre, texture
  selon le type de document (lettre pour lyra_mail). Texte `jp` avec lectures inline
  masquées, Y les révèle, X = traduction (même composant de rendu que l'issue 03).
- **Quiz obligatoire** : QCM, retry-jusqu'à-correct, **le texte reste consultable
  pendant le quiz** ; après un 2ᵉ échec sur une question portant `answer_span`,
  surligner le passage (scaffolding). Mélange des choix à l'affichage.
- B en cours de texte : fermeture avec confirmation ; à la réouverture le quiz reprend à
  la question courante (pas de curseur plus fin — PRD § Navigation).

## Critères d'acceptation

- Ouvrir le PC dans la chambre → lyra_mail se lit et se complète ; `texts_read`
  s'incrémente (métrique consommée par les seuils CS-Kanji plus tard) ; une relecture
  sans faute pose `gold_at`.
- Tests : émission moteur des unlock_text (idempotence), retry/scaffolding, logique
  blanc/doré.

## Hors périmètre

Les seuils CS-Kanji (`count(texts_read, N)`) — la métrique doit juste compter juste dès
maintenant. L'audio des textes, le mode doré du Kanjidex.

## Comments

**2026-07-30 (agent, implémentation)** — Fait, en TDD strict (chaque couche :
tests rouges d'abord — lib pure, loaders, actions DB-mockée, composant jsdom).
49 tests nouveaux (21 quiz pur + 8 loaders + 5 actions carte + 4 complétion +
2 métriques + 12 .tsx jsdom, moins 3 recomptés), 413 au total, `npm run check`
tout vert (lints contenu + solveur de traversée inchangés).

Livré :
- `db/migrations/007_text_completions.sql` — additive : `text_completions`
  (`user_id`, `text_id`, `score` entier 0..100 = première tentative, figé à la
  première complétion, `completed_at` DEFAULT now() serveur, `gold_at`
  nullable, PK (user_id, text_id)). **Non appliquée** (DATABASE_URL vide ici)
  — `npm run db:migrate -- db/migrations/007_text_completions.sql`.
- `src/lib/text-quiz.ts` — logique pure, zéro I/O : réducteur
  `startTextQuiz`/`answerTextQuestion` (retry-jusqu'à-correct : mauvaise
  réponse = MÊME question ; inerte une fois done), `quizScore` (% première
  tentative, 100 sur quiz vide — jamais NaN), `isFlawless` (doré = zéro
  erreur sur la passe entière), `shouldScaffold` (2ᵉ échec + answer_span),
  `splitForHighlight` (découpe du jp_text BRUT sur les bornes du span —
  vérifié sur cs_taki.json : les spans du contenu sont indexés sur le brut et
  tombent sur des frontières de segments), `restoreTextQuiz` (validation du
  blob de reprise), `documentKindForText` (letter/sign/scroll).
- `src/lib/content.ts` — `getTextById` (index text_id → texte, toutes zones ;
  le nom de fichier n'est PAS le text_id : lyra_mail.json porte
  `lyra_mail_new_bark`) ; `getEngineUnlockTextId` — la table COMPLÈTE du
  contrat § 2 (5 entrées, avec les text_id corrigés du 2026-07-25) ; test
  dédié : chaque text_id de la table correspond à un vrai fichier.
- **Émission moteur** : `interactWithNpc` (map/actions.ts) consulte la table
  AVANT tout dialogue — PC du joueur (`player_pc_new_bark`, kind object) →
  applique `Effect.unlock_text` via la lib 02 (idempotent : no-op → même
  objet → zéro écriture, testé) et retourne `{kind:'text', text_id}` ; pareil
  pour le panneau Route 29. `dialogueRef` devenu optionnel (ces entrées du
  registre n'en ont pas). Les textes portés par un dialogue marchent déjà via
  la lib 02 — vérifié par test sur le vrai `prof_elm_lab.json` : 8 badges →
  état `great_text` → `elm_great_text_new_bark` débloqué + `kimono_finale`
  avancée, re-visite → `after_great_text`, zéro écriture.
- `src/app/text/actions.ts` — `completeText(textId, score, flawless)` :
  re-validation serveur (texte réel + réellement débloqué, score borné 0..100
  — le client n'est jamais cru), INSERT ... ON CONFLICT idempotent, horodaté
  serveur (now() SQL) : `score`/`completed_at` figés à la première
  complétion, `gold_at = coalesce(existant, excluded)` — posé une seule fois,
  première lecture OU relecture.
- `src/lib/player-state.ts` — métrique `texts_read` hydratée depuis
  `count(text_completions)` (textes COMPLÉTÉS, jamais les simples
  déblocages) ; `evalCondition.count` la lit via `state.metrics` (chemin
  par défaut, aucun changement lib 02). Testé DB-mockée
  (`player-state.test.ts`, nouveau).
- `src/lib/text-completions.ts` — DAL lecture pour l'issue 09 :
  `getTextCompletions(userId)` (liste blanc/doré du Journal) et
  `getTextCompletion(userId, textId)`.
- **Fenêtre de lecture** : route dédiée `/text/[textId]`
  (`src/app/text/[textId]/page.tsx` serveur + `TextReader.tsx` client) —
  même choix route-plutôt-qu'overlay que le Book Screen ; l'URL ne contourne
  jamais le gate (texte non débloqué → redirect /map). Même famille visuelle
  que le livre (`book-chrome`/`book-frame`), texture de page par type de
  document : `.text-doc-letter` (papier ligné — lyra_mail), `.text-doc-sign`
  (bois — panneau/inscription), `.text-doc-scroll` (parchemin, défaut) ;
  aucun champ de type dans les fichiers texte (format vérifié) → type DÉDUIT
  du text_id/found_object_ref (`documentKindForText`, documenté + testé).
  Texte jp en `JpText` (lectures masquées, Y révèle, X = traduction en_text).
- **Quiz obligatoire** : QCM retry-jusqu'à-correct, **vue partagée** (choix
  split documenté : le panneau texte reste affiché et scrollable AU-DESSUS du
  quiz — « consultable à tout moment » sans toggle) ; choix re-mélangés à
  l'affichage à chaque question ET chaque tentative (`shuffledIndices`) ;
  2ᵉ échec sur une question à answer_span → passage surligné dans le panneau
  (`<mark>` + hint système) — aucun texte du jalon n'a de span : mécanique
  testée sur données synthétiques (12 tests jsdom). Passe finie →
  `completeText` ; écran doré si passe sans faute, blanc sinon.
- **B / reprise** : fermeture avec confirmation ; la progression du quiz est
  rangée dans **sessionStorage** (clé `text-quiz:<text_id>`, blob validé par
  `restoreTextQuiz`, purgé à la complétion) — la réouverture DANS la même
  session (même onglet, y compris après navigation ou reload) reprend en
  phase quiz à la question courante ; rien n'est persisté serveur (décision
  jalon actée dans l'issue : « re-dérivée client »). Testé unmount/remount.
- MapClient : **1 seul changement** (branche `result.kind === 'text'` →
  `router.push('/text/…')`) — le PC et le panneau sont déjà servis par le
  registre npcs.json via /api/zone (aucune condition d'unlock → visibles).
- `src/data/ui-strings.json` : +6 chaînes système (クイズを　はじめる,
  どっかいクイズ, confirmation, blanc/doré, hint scaffolding). Aucun
  français visible joueur.

Critères d'acceptation, un par un :
1. Ouvrir le PC de la chambre → lyra_mail se lit et se complète : testé de
   bout en bout par couches (interactWithNpc débloque + retourne le texte ;
   la route sert le vrai fichier — loader testé sur lyra_mail ; le quiz se
   joue et `completeText` écrit). ✓
2. `texts_read` s'incrémente : compte les COMPLÉTIONS (`text_completions`),
   testé DB-mockée ; consommé tel quel par `Condition.count`. ✓
3. Relecture sans faute → `gold_at` : re-interaction avec le PC rouvre le
   texte (idempotent), quiz remélangé à chaque affichage, `isFlawless` sur la
   passe, SQL coalesce ne le pose qu'une fois — testés (lib + action + UI). ✓
4. Tests : émission moteur (idempotence), retry/scaffolding, blanc/doré. ✓

Écarts/décisions :
- **Vue partagée plutôt que toggle** pendant le quiz (documenté ci-dessus).
- **Reprise via sessionStorage** : couvre aussi le reload de l'onglet, pas
  seulement la navigation SPA — strictement plus que « même session » requis.
- **Type de document déduit** (aucun champ de contenu) — à remplacer par un
  vrai champ si la passe contenu en ajoute un.
- `score` stocké en INTEGER (pourcentage arrondi), pas REAL — cohérent avec
  « % de questions » du PRD, trivial à élargir.
- Un texte à 0 question (aucun au jalon) se complète directement, jamais un
  crash (testé côté lib, branche UI couverte).
- L'écran doré s'affiche si LA passe est sans faute ; un texte déjà doré
  relu avec des fautes reste doré en base mais montre l'écran blanc (le
  statut affiché appartient au Journal, issue 09).
- Pas de vérification visuelle en navigateur (DATABASE_URL absent, connu
  depuis l'issue 02) — la QA humaine (phase 6) verra textures/split/marque.

API pour l'issue 09 (Journal de lecture) :
- `getTextCompletions(userId)` (`src/lib/text-completions.ts`) → lignes
  `{text_id, score, completed_at, gold_at}` (blanc = ligne présente, doré =
  gold_at non nul) ;
- `getTextById(textId)` / index des textes (`src/lib/content.ts`) pour
  titres/placement (`npc_ref`/`found_object_ref` = l'indice « qui le
  porte ») ; `unlocked_texts[]` du PlayerState pour le grisé/cliquable ;
- la relecture depuis le Journal = `router.push('/text/<text_id>')` (la
  route re-vérifie le déblocage serveur).
