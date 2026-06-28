-- Extend kanji table with fields populated by import scripts
alter table public.kanji
  add column if not exists grade        integer,
  add column if not exists stroke_count integer,
  add column if not exists unicode_hex  text,
  add column if not exists etymology    text,
  add column if not exists mnemonic     text;

-- Component relationship table
create table if not exists public.kanji_components (
  id           uuid primary key default gen_random_uuid(),
  parent_id    text not null references public.kanji(id) on delete cascade,
  component_id text not null references public.kanji(id) on delete cascade,
  source       text not null check (source in ('kanjivg', 'kradfile')),
  unique (parent_id, component_id, source)
);

alter table public.kanji_components enable row level security;
create policy "kanji_components are public" on public.kanji_components for select using (true);

-- queued_kanji on users: array of kanji character IDs queued for next lesson
alter table public.users
  add column if not exists queued_kanji text[] not null default '{}';
