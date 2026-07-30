# 11 — Revue automatisée du jalon 1 (tranche verticale)

Status: needs-triage
Date : 2026-07-30
Périmètre : branche `jalon-1-tranche-verticale`, 10 commits `3280f2e8..64d55e96`
(issues 01→10). Revue en contexte frais, code lu directement (pas les rapports).
Vérifié localement : `npm run typecheck` ✓, `npm run test` ✓ (37 fichiers,
501 tests), `npm run lint` ✓ (0 erreur, 4 warnings `no-img-element`),
`npm run validate:content` ✓ (8 linters + solveur de progression).

---

## CRITIQUE

### C1 — Les gates de progression ne sont PAS re-vérifiés à l'écriture : les server actions acceptent n'importe quel `dialogueRef`/`npcId`/`trainerId`

**Fichiers** : `src/app/map/actions.ts:109` (`reachDialogueState`),
`src/app/map/actions.ts:153` (`interactWithNpc` — `dialogueRef` fourni par le
client), `src/app/map/battle-actions.ts:99` (`engageTrainer`),
`src/app/map/battle-actions.ts:197` (`winBattle`), `src/app/map/actions.ts:65`
(`saveMapPosition` — x/z/zone arbitraires).

**Fait vérifié** : le filtrage de présence (`unlock_conditions`) n'existe qu'en
LECTURE (`src/lib/map-visibility.ts`, consommé par `/api/zone` et
`map/page.tsx`). Aucune server action d'écriture ne re-vérifie que l'entité est
présente, dans la zone courante du joueur, ni adjacente. `winBattle` marque
n'importe quel dresseur du registre battu et applique ses Effects post_battle
sans aucune preuve qu'un combat a eu lieu (le déroulé du combat est 100 %
client, par design — mais rien ne borne l'écriture).

**Scénario d'échec concret (vérifié contre le contenu réel)** :
`content/dialogues/npcs/route-30/mr_pokemon_route30.json` — son état `intro`
est la règle **default** et porte `grant_item` + `advance_quest`
(mystery_egg_errand). Un client qui appelle directement
`reachDialogueState('mr_pokemon_route30')` (ou
`interactWithNpc('x', 'mr_pokemon_route30')`) depuis Bourg Geon, jour 1, sans
leçon, sans gate SRS, reçoit l'œuf et avance la quête — tout le chemin critique
A1 est sautable. De même `winBattle('silver_apparition1_cherrygrove', …)` pose
`defeated_trainers` (dont dépendent des Conditions `npc_cleared` ailleurs), et
`saveMapPosition('MAP_ROUTE_30', x, z)` téléporte (le seul filet serveur est le
gate SRS de première visite extérieure — les Roadblocks, l'ordre des zones et
la géométrie sont client-only).

**Contraste** : `completeLesson` (re-validation `resolveLessonInteraction`,
`src/app/lesson/actions.ts:57-62`) et `completeText` (re-validation
`unlocked_texts`, `src/app/text/actions.ts:32-34`) font, eux, la re-vérification
— la norme existe dans le code, elle n'est juste pas appliquée aux dialogues,
combats et positions.

**Correction suggérée** : dans `interactWithNpc`/`engageTrainer`, retrouver
l'entité par `npc_id`/`trainer_id` (jamais accepter un `dialogueRef` brut du
client), vérifier `isUnlocked(entity.unlock_conditions, state, ctx)` ET
`entity.zone_id === state.current_zone` (± adjacence) avant d'appliquer le
moindre Effect ; dans `winBattle`, exiger au minimum les mêmes vérifications
qu'`engageTrainer` (au mieux : un jeton de combat serveur émis à l'engagement,
sans persister l'état du combat — un nonce en mémoire/signé suffit et respecte
« fermer l'app = fuite »).

---

## MAJEUR

### M1 — `completeOnboarding` écrase `user_map_state` avec l'état par défaut : perte des données backfillées par la migration 002 pour tout compte pré-issue-04

**Fichiers** : `src/app/onboarding/actions.ts:32-38` (`savePlayerState(userId,
{...defaultPlayerState(), …})`), `src/lib/onboarding.ts:41-43` (`isOnboarded`
exige nom ET avatar), `db/migrations/002_progression.sql` (backfill
visited_zones / cleared_events / inventaire CS).

**Scénario d'échec concret** : un compte d'avant l'issue 04 (trainer_name posé,
`avatar` null — la colonne n'existe que depuis 003) est volontairement renvoyé
à l'onboarding (« un compte d'avant cette issue repasse par l'onboarding »,
commentaire de `isOnboarded`). Mais `completeOnboarding` upsert alors
`user_map_state` entier avec `defaultPlayerState()` : `visited_zones`,
`cleared_events` (préfixés `obstacle:`), `inventory` (cs_*, squirtbottle,
radio_card) — tout ce que 002 a soigneusement backfillé est écrasé. Et comme
`quest_progress` par défaut est vide, la boucle d'upsert de `savePlayerState`
ne touche pas `npc_quest_progress` → état final **incohérent** (quêtes
conservées, carte remise à zéro). Le compte de dev subira ça au premier
lancement de la QA.

**Correction suggérée** : dans `completeOnboarding`, ne poser l'état par défaut
que si `user_map_state` n'a pas de ligne pour ce user (ou merger : ne toucher
que `current_zone`/`avatar_x`/`avatar_y`/`visited_zones` append).

### M2 — `rateCard` : `rating` jamais validé au runtime, carte pas vérifiée « due »

**Fichier** : `src/app/study/actions.ts:31-59`.

**Faits vérifiés** : (a) `rating` est typé `SrsRating` mais casté
(`rating as Grade`) sans garde — un client peut envoyer 0/9/NaN ; l'`update
cards` (l.48-51) s'exécute AVANT l'`insert reviews` (l.53-56) dont le CHECK
`rating between 1 and 4` rejettera la valeur → selon le comportement de
ts-fsrs sur un grade hors domaine, `fsrs_state` peut être écrit puis la review
perdue (état incohérent — PLAUSIBLE sur ce détail, certain sur l'absence de
validation). (b) Aucune vérification que `next_review_at <= now()` : on peut
noter une carte non due, y compris la même carte 200 fois → `reviewedToday ≥
200` → ✓ du jour (plafond) sans avoir traité la file. L'invariant « le serveur
ne croit jamais le client » est tenu pour l'état FSRS mais pas pour ses entrées.

**Correction suggérée** : `if (![1,2,3,4].includes(rating)) throw` ; ajouter
`and next_review_at <= now()` au select de la carte ; idéalement, envelopper
update+insert dans une transaction.

### M3 — Session SRS : les cartes « Encore » re-deviennent dues dans la minute mais ne sont jamais re-présentées ; l'écran « session finie » s'affiche même quand le ✓ serveur n'est pas posé

**Fichiers** : `src/app/study/StudyClient.tsx:91-130` (`handleRate` ignore le
`DailyStatusResult` retourné par `rateCard` ; l'écran de fin `if (!current)`
s'affiche dès que la file LOCALE est épuisée), `src/app/study/page.tsx:37-47`
(la file est figée au chargement), `src/app/study/actions.ts:45-46`
(`fsrs(generatorParameters())` — planificateur court-terme ts-fsrs par défaut :
« Again » → due dans les minutes).

**Scénario d'échec concret** : jour 2, 10 cartes dues, le joueur note la
première « もういちど » (due ≈ +1-10 min), met 5 minutes à finir les 9 autres.
Au dernier `rateCard`, `ensureDailyStatus` voit `cardsPending ≥ 1` → PAS de ✓.
Le client affiche pourtant 「きょうの ふくしゅう おわり！」. Retour carte :
badge Pokégear 「！」, gate SRS toujours fermé, le mentor re-invite — il faut
rouvrir /study (dont la file ne contiendra que la carte ratée) autant de fois
que nécessaire. Incohérence UX systématique dès la première erreur, et le
contrat pédagogique FSRS (re-voir la carte ratée dans la session) n'est pas
tenu.

**Correction suggérée** : soit re-empiler côté client une carte notée 1 en fin
de file (et n'afficher « fini » que quand `result.sessionDone` est vrai — le
statut est déjà retourné par `rateCard` et jeté), soit désactiver le
court-terme (`enable_short_term: false`) et documenter ; dans tous les cas,
faire dépendre l'écran final de `sessionDone` serveur, pas de la file locale.

### M4 — Le tiroir dev (téléport toutes zones + octroi des CS-Kanji) est accessible à tout joueur en production, et les capacités de traversée sont client-autoritaires

**Fichiers** : `src/app/map/MapClient.tsx:1400-1447` (drawer ouvert par un tap
sur le nom de zone du HUD : chips 砕/切/水/力/飛/渦/滝/🚿/📻 qui
grant/revoke, liste des 60 zones cliquables), `src/app/map/actions.ts:27-30`
(`saveMapProgress(progress: unknown)` écrit le blob tel quel dans
`users.map_progress` — aucune validation), `MapClient.tsx:506-510, 694-699,
732-736` (surf/whirlpool/waterfall lus depuis ce blob client).

**Scénario d'échec concret** : n'importe quel joueur tape le nom de zone en bas
de l'écran, s'octroie 水/力/飛, se téléporte à Blackthorn. Aucun garde-fou
build (pas de `NODE_ENV`), et le serveur accepte le blob (`saveMapProgress`)
et la position (cf. C1). Les obstacles CS — un système de progression du PRD —
sont entièrement contournables depuis l'UI livrée.

**Correction suggérée** : conditionner le drawer et les chips à un flag dev
(`process.env.NODE_ENV !== 'production'` ou un flag utilisateur), et à terme
migrer les CS sur le modèle Condition/Effect serveur (déjà noté au commentaire
de `saveMapProgress` comme dette de l'issue 10 — mais le drawer, lui, n'est pas
noté).

### M5 — `Condition.time_window` est évaluée à l'horloge ET au fuseau du SERVEUR

**Fichiers** : `src/lib/condition-effect.ts:198-203` (`ctx.now.getDay()` /
`getHours()`), tous les appelants construisent `{ now: new Date() }` sans
offset client (`map/actions.ts:115,169,179`, `map-visibility.ts:13`,
`battle-actions.ts:212`, `menu/actions.ts:114`).

**Scénario d'échec concret** : déployé sur Vercel (UTC), une fenêtre
`hour_range: [20, 4]` (soirée) ou `days_of_week` sera vraie aux heures UTC,
pas aux heures du joueur (JST : décalage de 9 h — le « samedi » du contenu
tombe vendredi soir pour le joueur). Aucun contenu du jalon 1 n'utilise
`time_window` (usages réels : Goldenrod, Olivine, Blackthorn, route-37,
moomoo_recovery — vérifiés par grep), donc invisible à la QA du jalon, mais le
moteur est livré faux et l'infra `tzOffsetMinutes` existe déjà partout
ailleurs (leçons, SRS).

**Correction suggérée** : ajouter `tzOffsetMinutes` à `EvalContext` et évaluer
`time_window` sur l'axe local (mêmes helpers que `localDayKey`) ; à défaut,
lever un lint contenu « time_window hors périmètre engine » pour ne pas
l'oublier.

---

## MINEUR

### m1 — Latin visible joueur hors exceptions autorisées

- `src/app/map/BattleScreen.tsx:195` : « VS » en dur sur l'écran d'engagement
  (fidèle HGSS, mais hors liste des exceptions du PRD — à trancher).
- `src/app/map/MapClient.tsx:80-82, 234-237` : `zoneLabel` retombe sur le nom
  latin prettifié (`formatZoneName`) pour toute zone sans slug contenu — ces
  libellés sont visibles au HUD et dans le drawer (lié à M4) ; badge « dev »
  (l.1431).
- `src/app/menu/actions.ts:95-100` : `npcJpName` retombe sur `npc.name` latin
  du registre si le fichier dialogue manque (Carnet de leçons).
- `title=` de survol avec noms latins (`MapClient.tsx:1097,1141,1187`) —
  invisible au tactile, visible au desktop.
Les labels de chrome console (A/B/X/Y/START/SELECT) sont assumés comme
matériel DS ; les prompts EN (keyword, saisie, traductions X) sont dans
l'exception pédagogique. Tout le reste vérifié japonais (`ui-strings.json`
intégralement jp sauf « Googleで ログイン », autorisé).

### m2 — Kanjidex : les kanji sans niveau JLPT s'affichent EN PREMIER

**Fichier** : `src/app/menu/actions.ts:161` — `order by jlpt_level desc, id` :
en Postgres, `DESC` met les NULL d'abord (NULLS FIRST par défaut). Les kanji
non classés précèdent N5. Correction : `order by jlpt_level desc nulls last`.

### m3 — MapClient : fenêtres de course sur les clics de marqueurs pendant les séquences

**Fichier** : `src/app/map/MapClient.tsx:974-980` (`handleNpcClick` : aucune
garde), `:982-988` (`handleWarpClick` : aucune garde), `:1171-1175` (clic
dresseur : gardé battle/engaging/intercepting mais pas dialogue — sans
conséquence car l'overlay DialogueBox z-60 couvre l'écran et avale les taps).
Scénarios réels : pendant la pause « ! » d'engagement (700 ms, overlay pas
encore monté), un tap sur un PNJ ouvre un dialogue qui reste coincé SOUS
l'overlay de combat (z-60 < z-80) ; un tap sur un warp change de zone pendant
l'engagement ; pendant la marche d'interception Roadblock, un tap sur un autre
PNJ ouvre un dialogue concurrent (le `afterDialogueCloseRef` de la repoussée
peut alors se déclencher à la fermeture du mauvais dialogue). Cosmétique, pas
de corruption d'état serveur. Correction : appliquer les mêmes gardes que
`attemptStep` aux trois handlers de clic. Cas voisin : pendant la pause
d'engagement, le bouton START (z-75) reste cliquable → menu (z-85/96)
AU-DESSUS du combat (z-80) ; récupérable en refermant le menu.

### m4 — `MENTOR_CALL_SEEN_KEY` est par appareil, pas par utilisateur

**Fichier** : `src/app/map/DailyLoop.tsx:28,56-57`. Deux comptes sur le même
navigateur : le second n'aura jamais l'appel du mentor le jour où le premier
l'a vu. Correction : suffixer la clé par l'user id (ou un hash).

### m5 — `winBattle` concurrent : doublons possibles

**Fichier** : `src/app/map/battle-actions.ts:206-226`. Le test
`alreadyDefeated` puis write n'est pas atomique et `battle_results` n'a pas
d'unique `(user_id, battle_id)` (migration 006 — assumé « une ligne par
victoire » mais rien ne l'impose) ; deux appels concurrents (double-tap,
double onglet) peuvent insérer deux lignes et dupliquer `trainerId` dans
`defeated_trainers[]` (les `includes()` en aval restent corrects). Le garde
client `winCalledRef` (BattleScreen.tsx:94) couvre le cas nominal.

### m6 — `completeText` : `score` et `flawless` sont déclarés par le client

**Fichier** : `src/app/text/actions.ts:24-46`. Borné (0-100) et le texte doit
être réellement débloqué (bien), mais le doré et le score sont sur parole —
purement cosmétiques au jalon (le score gate le combat Red plus tard, PRD
05-A1 : à re-vérifier à ce moment-là).

### m7 — Migrations 002→007 jamais appliquées à une base réelle, et `migrate.ts` sans registre de migrations

**Fichiers** : `scripts/db/migrate.ts`, commentaires des issues 02/05/06
(« Non appliquée, DATABASE_URL vide ici »). Lecture verticale faite : les 6
migrations sont additives (aucun DROP ; les `drop not null` de 004 sont
non-destructifs) et rejouables **dans l'ordre, une fois** sur le schéma 001
(002 lit `users.map_*` de 001 ✓, 004 backfille `kanji_id/card_type` ✓, l'index
unique de 004 est bien celui du `on conflict` de `lesson/actions.ts:74` ✓).
Mais elles ne sont PAS idempotentes (004/005/006/007 : `add column`/`create
table` sans `if not exists`) et `migrate.ts` ne trace pas ce qui est appliqué —
un rejeu manuel accidentel échouera à mi-fichier (transaction implicite : ok,
tout ou rien, mais l'humain doit tenir le compte). À valider en vrai avant la
QA (premier point du plan QA).

### m8 — PLAUSIBLE : fiche kanji complète accessible pour un kanji jamais étudié

**Fichiers** : `src/app/menu/StartMenu.tsx:121-144` (tuiles « unseen »
cliquables), `src/app/kanji/[id]/page.tsx` (fiche complète : sens, lectures,
composants, sans gate d'étude). Si le principe « pas de pré-teaching » du
Carnet (contenu masqué avant la leçon) s'applique au Kanjidex, c'est une
fuite ; si le dex est volontairement encyclopédique, non. À trancher (PRD
§ Kanjidex).

---

## Revue des tests (demandée en priorité)

Globalement **solides et honnêtes** : les libs pures sont testées sur les cas
adverses réels (offset tz ±14 h borné avec valeur adverse, bascule de minuit
local, 199 vs 200 au plafond, N-ième erreur fatale sur la dernière question,
remise de pool, garde anti-ambiguïté des lectures), et surtout
`src/lib/a1-traversal.test.ts` est un vrai test d'intégration : BFS sur la
géométrie RÉELLE + contenu RÉEL + moteur réel, jours simulés, cartes dues au
lendemain — il prouve le parcours A1 en mémoire, pas un mock.

Limites factuelles :
- Les tests des server actions (`battle-actions.test.ts`,
  `lesson/actions.test.ts`, etc.) mockent `sql` par capture de texte : ils
  vérifient le contrat applicatif contre le vrai contenu (bien) mais ne
  prouvent RIEN du SQL réel (`on conflict` sur index vs contrainte, CHECKs,
  types array/jsonb) — combiné à m7 (base jamais migrée), la couche SQL est la
  zone la moins éprouvée du jalon.
- Aucun test ne couvre M3 (fin de session client vs ✓ serveur) ni C1 (les
  tests d'actions appellent toujours les actions avec des états légitimes —
  aucun test adversarial « appel direct hors zone/hors ordre »).
- Pas de test du chemin d'échec `winBattle` concurrent (m5).

## Cohérence inter-issues (vérifiée)

- Le shuffle et les distracteurs ne sont PAS dupliqués : `shuffledIndices`
  (dialogue-pages) est LE mélange d'affichage partagé (BattleScreen, BookScreen,
  TextReader, DialogueBox) ; battle.ts et lesson-quiz.ts ont chacun leur
  `drawDistractors`/`shuffleChoices` de CONSTRUCTION (sémantiques différentes :
  pool-de-combat vs global — duplication minime, ~15 lignes, acceptable).
- `primaryMeaning`/`primaryReading` (lesson-quiz) réutilisés par battle.ts ✓ ;
  `KanaInput`/`finalizeKana` partagés onboarding/Saisie ✓ ; `JpText` partagé
  partout ✓ ; `getDailySRSStatus` unique, consommé par daily-srs → zone-gate ✓.
- Z-order global cohérent : carte contrôles 70 < START fermé 75 < badge
  Pokégear 76 < Pokégear 78 < appel mentor 79 < combat 80 (le combat couvre
  bien l'appel du mentor, écart de l'issue 07 réellement soldé) ; DialogueBox
  60 vit sous tout ça mais DANS le stacking context du combat quand
  BattleScreen la monte. Seule anomalie : menu ouvert 85/96 > combat 80 (voir
  m3, atteignable uniquement par la fenêtre d'engagement).
- Sécurité de base : TOUTES les server actions commencent par
  `requireUserId()` (auth.ts, id = `profile.sub` session, jamais client) et
  `/api/zone` vérifie la session — vérifié une par une (map/actions,
  battle-actions, lesson, text, study, menu, onboarding). ✓

## Invariants produit — vérification explicite

| # | Invariant | Verdict | Preuve |
|---|---|---|---|
| 1 | Aucun FR/latin visible joueur | **✗ (fuites mineures)** | `ui-strings.json` 100 % jp (sauf Google, autorisé) ; MAIS « VS » `BattleScreen.tsx:195`, replis latins HUD/Carnet (`MapClient.tsx:234-237`, `menu/actions.ts:99`) — voir m1. Aucun français trouvé (grep + lecture des écrans). |
| 2 | Combat ne lit/écrit jamais le SRS | **✓** | `battle.ts`/`BattleScreen.tsx` : zéro accès (grep cards/reviews/fsrs vide) ; `battle-actions.ts` ne touche que `grammar_encounters` (hors SRS, PRD) et `battle_results`. Nuance documentée : `getPlayerState` (hydratation générique) fait un `count(distinct kanji_id) from cards` pour la métrique Condition — agrégat jamais utilisé par la logique de combat (pool = `completed_lessons`). |
| 3 | Gate SRS jamais une `Condition` | **✓** | `src/lib/zone-gate.ts` : helper dédié hors vocabulaire Condition ; le type `Condition` (condition-effect.ts:28-35) n'a aucune variante SRS ; consommé par `checkZoneEntry`/`saveMapPosition`. |
| 4 | Effects idempotents, re-talk ne rejoue rien | **✓** | `applyEffect` (condition-effect.ts:242-304) : chaque branche retourne le MÊME objet en no-op ; `reachDialogueState` ne persiste que si `next !== state` (actions.ts:124) ; `set_companion` write-once ; `grant_item` piloté par item_kind. Testé (condition-effect.test.ts). |
| 5 | Aucun état de combat persisté | **✓** | État entièrement dans `BattleScreen` (useState) ; overlay, pas de route ; aucune écriture storage ; défaite → rien d'écrit (`finishBattle`, `winBattle` seulement sur victoire) ; migration 006 : « une ligne par VICTOIRE ». |
| 6 | QCM re-mélangés à l'affichage partout | **✓** | BattleScreen:419,535 ; BookScreen:78-82 (re-tiré par tentative) ; TextReader:109-113 (idem) ; DialogueBox:226-230 (instant_response/conversation_turn). `companion_choice` non mélangé : roster fixe, pas un quiz (documenté dialogue-pages.ts:186). |
| 7 | Serveur ne croit jamais le client | **✗ (partiel)** | ✓ : user_id session partout (auth.ts:requireUserId), FSRS recalculé serveur (study/actions.ts:45-46), scores bornés (battle-actions.ts:219-221, text/actions.ts:36), ordre des leçons re-validé (lesson/actions.ts:57-62), unlock texte re-validé, gate SRS re-vérifié à l'écriture (actions.ts:75-81). ✗ : gates de présence/zone non re-vérifiés sur dialogues/combats/position (**C1**), rating non borné (**M2**), CS-abilities client (**M4**), gold/score texte déclaratifs (m6). |
| 8 | Cartes dues le LENDEMAIN ; retry leçon/texte, jamais combat | **✓** | `nextMorningDue` (lessons.ts:126-137) = prochain minuit LOCAL, `buildNewCards` due à cette date, testé + a1-traversal (« dues DEMAIN ») ; BookScreen:119-124 retry même question ; text-quiz.ts:50-64 retry ; BattleScreen : correction 1,5 s puis suivante, jamais de retry (answer→advance). Réserve : voir M3 (re-due intra-jour côté FSRS). |
| 9 | Migrations additives, cohérentes 002→007 | **✓** | Lues intégralement : aucun DROP, aucun ALTER destructif (004 : `drop not null` = élargissement) ; rejouables dans l'ordre sur 001 (dépendances vérifiées colonne par colonne). Réserve opérationnelle m7 : jamais appliquées en vrai, non idempotentes, pas de registre. |
| 10 | `content/` intact | **✓** | `git diff main...HEAD --stat -- content/` → vide (0 fichier). `zone-registry-names.json` prédate la branche (commit 97d293c8). |

---

## Verdict

**1 CRITIQUE, 5 MAJEUR, 8 MINEUR.** Le socle est réellement bon : moteur pur
bien découpé et bien testé (501 tests verts, dont un vrai test de traversée sur
données réelles), invariants 2-6, 8-10 tenus et prouvables, server actions
toutes authentifiées, toutes les boucles de feedback vertes. La QA humaine
peut DÉMARRER sur le chemin nominal, mais le jalon ne doit pas être considéré
clos avant : **M1** (le compte existant du testeur sera partiellement effacé au
premier lancement — à corriger AVANT la QA), **M3** (la QA le heurtera dès la
première erreur de révision au jour 2), et **C1** (contournement complet de la
progression par appel direct des actions — acceptable de le différer seulement
si l'on assume explicitement un modèle de menace « client de confiance » pour
un jeu solo, auquel cas l'assumer par écrit dans un ADR).

---

## Corrections appliquées

**2026-07-31 (agent, corrections)** — TDD (test adversarial rouge d'abord pour
chaque contournement), `npm run check` tout vert (539 tests).

- **C1 — CORRIGÉ** (`5a88e3d8`) : les écritures re-vérifient la présence.
  `reachDialogueState`/`interactWithNpc`/`engageTrainer`/`winBattle` exigent
  que l'entité soit servie dans la **zone courante** du joueur
  (`user_map_state.current_zone`, même règle de rattachement que la lecture)
  ET visible (`unlock_conditions`) — helpers `accessibleNpc`/
  `accessibleTrainer`/`findAccessibleDialogueCarrier` dans
  `src/lib/map-visibility.ts` ; le `dialogueRef` client n'est plus jamais
  accepté (registre seul). `saveMapPosition` refuse une zone non atteignable
  en un mouvement (`canReachZone`, `src/lib/zone-geometry.ts` : zone
  courante, contiguïté outdoor ±1 tuile, warps/ascenseurs de la zone
  courante) et une position hors des bornes de la cible. **Niveau de garantie
  documenté** : zone + visibilité, jamais l'adjacence de tuile (position
  client non fiable à ce grain) ; pas de jeton de combat serveur (l'état du
  combat reste 100 % client, « fermer l'app = fuite »). Tests :
  `reachDialogueState('npcs/route-30/mr_pokemon_route30')` depuis Bourg Geon
  → null sans effet (`actions.test.ts`), `winBattle(Silver)` hors zone/hors
  quête → null sans écriture (`battle-actions.test.ts`), téléport
  `saveMapPosition` refusé (`actions.test.ts`).
- **M1 — CORRIGÉ** (`0bbbe8de`) : `completeOnboarding` ne pose le spawn
  chambre que si `user_map_state` n'a PAS de ligne — un compte legacy garde
  intégralement son état backfillé (seuls `trainer_name`/`avatar` s'écrivent).
  Test : `src/app/onboarding/actions.test.ts`.
- **M2 — CORRIGÉ** (`0bbbe8de`) : `rateCard` valide le rating (entier 1..4)
  AVANT toute écriture et refuse une carte non due (`next_review_at > now`)
  — le plafond 200 n'est plus gonflable en re-notant la même carte. Tests :
  `src/app/study/actions.test.ts`.
- **M3 — CORRIGÉ** (`5a88e3d8`) : `StudyClient` garde le `DailyStatusResult`
  retourné par chaque `rateCard` ; file locale épuisée + statut « pas fini »
  (carte もういちど redevenue due) → écran « continuer » qui recharge la file
  serveur (`continueSession`, assemblage partagé `src/app/study/session.ts`)
  ; le ✓/「おわり」 ne s'affiche que si le serveur dit `sessionDone`. Fidèle
  au PRD : la session est finie quand la file du JOUR est vide. Tests jsdom
  du flux Encore → continuer (`StudyClient.test.tsx`).
- **M4 — CORRIGÉ** (`5a88e3d8`) : tiroir dev gaté
  `process.env.NODE_ENV !== 'production'` au rendu ET au toggle du HUD ;
  filet serveur symétrique : en production `saveMapProgress` ne prend jamais
  les drapeaux de capacités (CS-Kanji/objets-clés) du client — valeur
  stockée conservée, seuls `visited`/`cleared` restent déclarés client
  (dette obstacles de l'issue 10, inchangée) ; le téléport du tiroir est de
  toute façon refusé par C1. Tests : `MapClient.test.tsx` (rendu prod),
  `actions.test.ts` (blob sanitized).
- **m1 — partiellement corrigé** (`5a88e3d8`) : le « VS » en dur de l'écran
  d'engagement remplacé par 「たい」 (kana — pas le kanji 対, jamais
  pré-enseigné). Les autres replis latins (HUD/Carnet/title) restent ouverts.

**Reste ouvert** : M5 (`time_window` au fuseau serveur), m1 (replis latins
hors « VS »), m2-m8, et la recommandation d'ADR sur le modèle de menace
(caduque pour l'essentiel : C1 corrigé, le serveur re-vérifie désormais).
