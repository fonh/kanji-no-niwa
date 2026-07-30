-- Résultats de combat (jalon 1, issue 07).
--
-- Migration ADDITIVE : nouvelle table battle_results (PRD § Schéma) — une
-- ligne par VICTOIRE (la défaite ne persiste rien : aucun état de combat
-- n'est sauvegardé, le combat perdu est rejouable immédiatement).
-- `defeated_trainers[]` vit déjà dans user_map_state (migration 002).
--   - battle_id    : trainer_id du registre content/map/trainers.json ;
--   - lives_lost   : erreurs commises (N-1 max en victoire) ;
--   - modes_used[] : le mode de chaque question, dans l'ordre — nourrit le
--                    futur relevé de notes par section des jalons-examens ;
--   - accuracy     : bonnes réponses / questions (0..1) ;
--   - played_at    : horodaté SERVEUR (default now()), jamais par le client.
--
-- Appliquer avec : npm run db:migrate -- db/migrations/006_battle_results.sql

create table public.battle_results (
  id          bigint generated always as identity primary key,
  user_id     text not null references public.users on delete cascade,
  battle_id   text not null,
  lives_lost  integer not null,
  modes_used  text[] not null,
  accuracy    real not null,
  played_at   timestamptz not null default now()
);

create index battle_results_user_battle_idx
  on public.battle_results (user_id, battle_id);
