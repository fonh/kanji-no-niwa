# 02 — Moteur Condition/Effect + sélection d'état de dialogue (le cœur)

Status: ready-for-agent
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
