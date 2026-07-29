# 02 — Moteur Condition/Effect + sélection d'état de dialogue (le cœur)

Status: ready-for-human
Bloqué par: —
Bloque: 03, 05, 08

## Contexte

480 fichiers de dialogue sous `content/dialogues/` portent des `state_rules[]`
(`Condition[] → Dialogue State`) et des `Effect[]` — mais **aucun code ne les évalue** :
`src/app/api/dialogue/route.ts` sert systématiquement l'état `default`, et les
`unlock_conditions` des PNJ/dresseurs ne gatent pas leur présence sur la carte. C'est le
morceau dont dépendent leçons, textes, quêtes et combat.

Sémantique de référence : `CONTEXT.md` (Condition, Effect, State Rule, Quest, Quest Step),
`docs/adr/0003-condition-effect-quest-model.md`, PRD § Implémentation (moteur), et
`content/engine-contract.md` § 1-3 (events moteur-only).

## Périmètre (vertical slice)

**Données** — migration `db/migrations/002_progression.sql` :
- `user_map_state` (PRD § Schéma) : `current_zone`, `avatar_x/y`, `unlocked_zones[]`,
  `visited_zones[]`, `defeated_trainers[]`, `completed_lessons[]`, `completed_quests[]`,
  `inventory` (jsonb `{item_id: qty}`), `badges[]`, `cleared_events[]`,
  `unlocked_texts[]`, `registered_trainers[]`, `companion_id`, `pokeathlon_score`.
  Migrer les données existantes de `users.map_zone/map_x/map_z/map_progress` (flags
  `MapProgress` de `src/lib/obstacles.ts`) vers cette table ; garder les colonnes
  `users.*` en place jusqu'à la bascule complète du code, puis les retirer dans une
  migration ultérieure.
- `npc_quest_progress` : `user_id`, `quest_id`, `current_step`, `step_entered_at`.

**Service** — lib pure `src/lib/condition-effect.ts`, sans I/O :
- Types `Condition`/`Effect` alignés sur l'ADR-0003 et les fichiers réels.
- `evalCondition(cond, playerState)` : les 7 types — `count(metric, threshold)`,
  `item_owned`, `quest_step` (**« à ce stade ou après »**, l'ordre venant de
  `content/quests/<id>.json` `steps[]`), `npc_cleared`, `event_cleared`, `badge_earned`,
  `time_window` (évalué client, jamais stocké) — chacun avec le modificateur `negate`.
- `evalConditions(Condition[])` = ET pur.
- `selectDialogueState(state_rules, playerState)` : premier match, `default` final.
- `applyEffect(effect, playerState)` : `advance_quest`, `grant_item` (idempotence pilotée
  par `item_kind` : `unique` inerte si possédé, `fungible` incrémente), `remove_item`,
  `grant_badge`, `unlock_text`, `unlock_zone`, `set_companion`. **Tous idempotents.**
- Loader contenu `src/lib/content.ts` : lecture serveur des JSON de `content/`
  (dialogues, quests, map/npcs+trainers+obstacles, lessons) avec cache module — le
  point d'entrée unique que les issues suivantes réutilisent.

**Intégration** (la partie visible de la slice) :
- L'API/action dialogue sélectionne l'état via `state_rules` avec le vrai état joueur et
  applique les `Effect[]` de l'état atteint (une server action `reachDialogueState`,
  horodatage serveur).
- `MapClient` ne rend un PNJ/dresseur que si ses `unlock_conditions` sont remplies
  (une entité non remplie **n'existe pas** sur la tuile — CONTEXT.md).

## Critères d'acceptation

- À Bourg Geon : Mom change d'état selon `mystery_egg_errand` ; `silver_spying_new_bark`
  n'apparaît que quand ses conditions sont vraies ; reparler à un PNJ ne rejoue pas ses
  Effects (idempotence).
- Tests unitaires exhaustifs sur la lib pure, y compris les séquences adverses du point
  C6 du plan de revue (re-talk, re-visite, ordre inattendu) et `negate`/`quest_step`
  at-or-after.
- Un test d'intégration charge de vrais fichiers de `content/dialogues/npcs/new-bark-town/`
  et déroule la quête `mystery_egg_errand` étape par étape.

## Hors périmètre

Les events moteur-only de `engine-contract.md` § 1 (zones lointaines) — seule
l'**API** `clearEvent(event_id)` doit exister. Le gate SRS quotidien (jamais une
Condition — PRD § Boucle Quotidienne) → issue 06/10.

## Comments

**2026-07-29 (agent, implémentation)** — Fait, en TDD strict (tests écrits avant chaque module).

Livré :
- `db/migrations/002_progression.sql` — `user_map_state` + `npc_quest_progress` (noms PRD),
  backfill SQL depuis `users.map_zone/map_x/map_z/map_progress` (visited → `visited_zones`,
  cleared → `cleared_events` préfixés `obstacle:`, drapeaux CS/objets-clés → items d'inventaire
  `cs_*`/`squirtbottle`/`radio_card`). Additive ; colonnes `users.*` conservées. **Non appliquée**
  (DATABASE_URL vide ici) — à passer via `npm run db:migrate -- db/migrations/002_progression.sql`.
- `src/lib/condition-effect.ts` — lib pure zéro I/O. Types `Condition` (7 + `negate`), `Effect` (7),
  `StateRule`, `PlayerState` (miroir snake_case de `user_map_state` + `quest_progress` indexé par
  quest_id + `metrics` hydratés pour `count`). `evalCondition`/`evalConditions` (ET pur),
  `selectDialogueState` (premier match, `default`), `isUnlocked`, `applyEffect`/`applyEffects`.
  Idempotence par identité : un Effect no-op retourne le **même objet** (`===`) → la couche
  serveur sait qu'il n'y a rien à persister. Contexts injectés : `questSteps` (ordre des steps),
  `now` (horloge, jamais implicite), `itemKinds` (défaut `unique`).
- `src/lib/content.ts` — loader serveur unique de `content/` (dialogues par `dialogue_ref`,
  quêtes + `getQuestStepsIndex()`, npcs/trainers/obstacles, leçons par zone), cache module,
  refs validées (pas de traversée `..`).
- `src/lib/player-state.ts` — DAL fin : `getPlayerState` (user_map_state + npc_quest_progress +
  `kanji_studied` dérivé de `cards`), `savePlayerState` (upserts). Ligne absente → état par défaut.
- Intégration : server action `reachDialogueState(dialogue_ref)` (sélection d'état contre le vrai
  état joueur + application des Effect[] horodatés serveur) **remplace** `GET /api/dialogue`
  (supprimé — il servait toujours `default`) ; `clearEvent(event_id)` (moteur-only § 1, sans
  consommateur) ; `saveMapPosition` écrit `user_map_state` (+ `visited_zones` première entrée) ;
  `/api/zone` et `map/page.tsx` filtrent PNJ/dresseurs via `unlock_conditions` côté serveur
  (`src/lib/map-visibility.ts`) — MapClient ne reçoit jamais les entités masquées (2 changements
  minimaux seulement dans MapClient : `fetchDialogue` → action, filtrage des pages à `kind`).

Preuves de test : `npm run check` tout vert — 108 tests (39 sur la lib pure : 7 types × negate,
at-or-after, séquences adverses C6 re-talk/re-visite/ordre inattendu ; 11 loader ; walkthrough
d'intégration `src/lib/mystery-egg-walkthrough.test.ts` qui charge les vrais fichiers de
new-bark-town + `mystery_egg_errand.json` + `mr_pokemon_route30.json` et vérifie les 3 critères
d'acceptation : Mom change d'état, Silver apparaît/disparaît, aucun Effect rejoué).

Écarts/décisions :
- `npc_cleared` lit `defeated_trainers[]` (l'unique magasin de « cleared » ; tous les usages réels
  du contenu gatent sur des dresseurs).
- `advance_quest` vers la dernière étape ajoute la quête à `completed_quests[]` (dérivation
  documentée, idempotente).
- `time_window` est évaluée avec l'horloge du serveur dans le filtrage de présence (l'écart de
  fuseau client/serveur est accepté pour le jalon ; « évalué client » restera vrai pour l'UI).
- `item_kind` : aucun registre d'items n'existe dans `content/` — `ApplyContext.itemKinds` en
  attend un (défaut `unique`, correct pour tout le jalon 1) ; à brancher quand la table `items`
  ou son fichier de contenu existera.
- Blob `MapProgress` legacy (tiroir dev, obstacles client) : reste sur `users.map_progress`
  jusqu'à l'issue 10 (bascule des obstacles sur le modèle Condition/Effect).
- `npm run build` échoue AVANT comme APRÈS ces changements sur cette machine (DATABASE_URL vide :
  `neon()` jette au chargement du module pendant la collecte de pages) — hors périmètre.
