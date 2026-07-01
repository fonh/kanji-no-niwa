-- Player position on the overworld map, so it survives a refresh instead of
-- always resetting to New Bark Town.
alter table public.users
  add column if not exists map_zone text not null default 'MAP_NEW_BARK',
  add column if not exists map_x    integer not null default 695,
  add column if not exists map_z    integer not null default 396;
