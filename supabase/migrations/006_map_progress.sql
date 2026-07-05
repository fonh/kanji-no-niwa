-- Adventure-state of the overworld map: CS-Kanji owned (力/水/飛), cleared
-- obstacles (cut trees, boulders, story blockers), visited zones. One JSONB
-- blob because the shape will evolve with the quest system; the map degrades
-- gracefully to defaults when a key is absent.
alter table public.users
  add column if not exists map_progress jsonb not null default '{}';
