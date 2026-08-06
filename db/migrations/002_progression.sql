-- Progression joueur pour le moteur Condition/Effect (jalon 1, issue 02).
-- Migration additive : crée user_map_state + npc_quest_progress (noms du
-- PRD § Schéma) et rapatrie les données existantes de users.map_zone/map_x/
-- map_z/map_progress. Les colonnes users.* restent en place jusqu'à la
-- bascule complète du code (elles seront retirées dans une migration
-- ultérieure) — mais le code applicatif lit/écrit désormais ces tables-ci.
--
-- Appliquer avec : npm run db:migrate -- db/migrations/002_progression.sql

-- L'état de carte du joueur (PRD § Schéma, finalisé audits 03/08 + Étape 3).
-- inventory est un objet {item_id: quantité} (item unique → 1) ; badges est
-- une liste [{badge_id, earned_at}] (finding 08-B1).
create table public.user_map_state (
  user_id             text primary key references public.users on delete cascade,
  current_zone        text not null default 'MAP_NEW_BARK',
  avatar_x            integer not null default 695,
  avatar_y            integer not null default 396,
  unlocked_zones      text[] not null default '{}',
  visited_zones       text[] not null default '{}',
  defeated_trainers   text[] not null default '{}',
  completed_lessons   text[] not null default '{}',
  completed_quests    text[] not null default '{}',
  inventory           jsonb not null default '{}',
  badges              jsonb not null default '[]',
  cleared_events      text[] not null default '{}',
  unlocked_texts      text[] not null default '{}',
  registered_trainers text[] not null default '{}',
  companion_id        text,
  pokeathlon_score    integer not null default 0,
  updated_at          timestamptz not null default now()
);

-- Une ligne par (joueur × quête) — la source de vérité unique du « où en est
-- la quête » (ADR-0003 : jamais recalculé depuis les Conditions).
create table public.npc_quest_progress (
  user_id         text not null references public.users on delete cascade,
  quest_id        text not null,
  current_step    text not null,
  step_entered_at timestamptz not null default now(),
  primary key (user_id, quest_id)
);

-- Backfill depuis les colonnes legacy de users :
--  - position : map_zone/map_x/map_z → current_zone/avatar_x/avatar_y ;
--  - map_progress.visited (noms MAP_*) → visited_zones ;
--  - map_progress.cleared (clés d'obstacle "MAP_X#obj") → cleared_events,
--    préfixées "obstacle:" pour ne pas se confondre avec les event_id du
--    moteur (engine-contract.md § 1) ;
--  - les drapeaux CS/objets-clés du tiroir dev (src/lib/obstacles.ts
--    MapProgress) → items d'inventaire correspondants du contenu.
insert into public.user_map_state
  (user_id, current_zone, avatar_x, avatar_y, visited_zones, cleared_events, inventory)
select
  u.id,
  u.map_zone,
  u.map_x,
  u.map_z,
  coalesce(
    (select array_agg(v)
     from jsonb_array_elements_text(
       case when jsonb_typeof(u.map_progress->'visited') = 'array'
            then u.map_progress->'visited' else '[]'::jsonb end) as v),
    '{}'
  ),
  coalesce(
    (select array_agg('obstacle:' || c)
     from jsonb_array_elements_text(
       case when jsonb_typeof(u.map_progress->'cleared') = 'array'
            then u.map_progress->'cleared' else '[]'::jsonb end) as c),
    '{}'
  ),
  coalesce(
    (select jsonb_object_agg(m.item_id, 1)
     from (values
       ('cs_tobu',      'tobu'),
       ('cs_mizu',      'mizu'),
       ('cs_chikara',   'chikara'),
       ('cs_kiru',      'kiru'),
       ('cs_kudakeru',  'kudaku'),
       ('cs_taki',      'taki'),
       ('cs_uzu',       'uzu'),
       ('squirtbottle', 'arrosoir'),
       ('radio_card',   'radio')
     ) as m(item_id, flag)
     where (u.map_progress->>m.flag)::boolean is true),
    '{}'
  )
from public.users u
on conflict (user_id) do nothing;
