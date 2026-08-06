-- Complétions de textes progressifs (jalon 1, issue 08).
--
-- Migration ADDITIVE : nouvelle table text_completions (PRD § Schéma) — une
-- ligne par texte COMPLÉTÉ (quiz passé en retry-jusqu'à-correct). Le
-- déblocage, lui, vit déjà dans user_map_state.unlocked_texts[] (migration
-- 002 / Effect unlock_text).
--   - score        : % de questions réussies en PREMIÈRE tentative — figé à
--                    la première complétion, purement statistique (ne gate
--                    que le combat Red, PRD finding 05-A1) ;
--   - completed_at : première complétion, horodatée SERVEUR ;
--   - gold_at      : première passe de quiz SANS FAUTE (nullable) — statut
--                    doré du Journal de lecture, obtenable à tout moment en
--                    relisant (quiz remélangé), jamais écrasé une fois posé.
--
-- La métrique Condition.count(texts_read, N) des seuils CS-Kanji se dérive
-- de count(*) sur cette table (src/lib/player-state.ts).
--
-- Appliquer avec : npm run db:migrate -- db/migrations/007_text_completions.sql

create table public.text_completions (
  user_id      text not null references public.users on delete cascade,
  text_id      text not null,
  score        integer not null,
  completed_at timestamptz not null default now(),
  gold_at      timestamptz,
  primary key (user_id, text_id)
);
