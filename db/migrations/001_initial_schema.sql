-- Schema for 漢字の庭 (Kanji no Niwa) — Neon (PostgreSQL)
-- Squashes former supabase/migrations/001-006 into one clean baseline
-- (2026-07-08, ADR-0005 — no production data existed yet, so a clean
-- baseline costs nothing and avoids dragging along Supabase-specific
-- artifacts: RLS policies, `references auth.users`).
--
-- Apply with: psql "$DATABASE_URL" -f db/migrations/001_initial_schema.sql

create extension if not exists pgcrypto; -- gen_random_uuid()

-- Content tables (populated by import scripts before any user data;
-- generated once by the pipeline, shared by all clients, never written
-- by the player)

create table public.kanji (
  id            text primary key,          -- kanji character itself, e.g. '一'
  character     text not null unique,
  meanings      jsonb not null default '[]',
  on_readings   text[] not null default '{}',
  kun_readings  text[] not null default '{}',
  jlpt_level    text,                       -- 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | null
  component_ids jsonb not null default '[]', -- array of kanji character IDs
  grade         integer,
  stroke_count  integer,
  unicode_hex   text,
  etymology     text,
  mnemonic      text
);

create table public.kanji_components (
  id           uuid primary key default gen_random_uuid(),
  parent_id    text not null references public.kanji(id) on delete cascade,
  component_id text not null references public.kanji(id) on delete cascade,
  source       text not null check (source in ('kanjivg', 'kradfile')),
  unique (parent_id, component_id, source)
);

create table public.dialogues (
  id            uuid primary key default gen_random_uuid(),
  trigger_type  text not null,
  trigger_ref   text not null,
  body_markdown text not null,
  unique (trigger_type, trigger_ref)
);

create table public.lessons (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  body_markdown  text not null,
  johto_zone     text not null,
  kanji_ids      jsonb not null default '[]', -- array of kanji character IDs
  quiz_questions jsonb not null default '[]'
);

-- Vocabulary entries from JMdict (compound words containing Jōyō kanji)
create table public.vocabulary (
  id         text primary key,            -- JMdict ent_seq as text
  word       text not null,               -- written form (kanji + kana)
  reading    text not null,               -- kana reading
  meanings   jsonb not null default '[]', -- array of English glosses
  kanji_ids  text[] not null default '{}', -- which Jōyō kanji appear in this word
  jlpt_level text                         -- 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | null
);

create index vocabulary_kanji_ids_idx on public.vocabulary using gin(kanji_ids);

-- Example sentences from Tatoeba (Japanese sentences with EN translation)
create table public.sentences (
  id          integer primary key,        -- Tatoeba sentence ID
  text        text not null,              -- Japanese sentence
  translation text,                       -- English or French translation
  kanji_ids   text[] not null default '{}', -- which Jōyō kanji appear in this sentence
  -- pre-tokenized chunks for the Disposition battle mode (kuromoji surface_form
  -- groups: noun+particle, verb+aux, etc.); empty array = sentence not suitable
  -- for Disposition (too simple or too complex)
  chunks      text[] not null default '{}'
);

create index sentences_kanji_ids_idx on public.sentences using gin(kanji_ids);
create index sentences_chunks_len_idx
  on public.sentences (array_length(chunks, 1))
  where array_length(chunks, 1) between 5 and 9;

-- User tables (populated at runtime, written by the player)
--
-- id is the stable Google account identifier (Auth.js `user.id`, JWT `sub`
-- claim) — no more foreign key into a Supabase-managed auth schema.
-- Row-level isolation is enforced in application code (every query filters
-- on the session-derived user id via a Server Action), not by the database —
-- see ADR-0005.

create type card_type as enum ('meaning', 'reading');

create table public.users (
  id           text primary key,
  trainer_name text,
  queued_kanji text[] not null default '{}',
  map_zone     text not null default 'MAP_NEW_BARK',
  map_x        integer not null default 695,
  map_z        integer not null default 396,
  map_progress jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create table public.cards (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null references public.users on delete cascade,
  kanji_id       text not null references public.kanji,
  card_type      card_type not null,
  fsrs_state     jsonb not null default '{}',
  next_review_at timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  unique (user_id, kanji_id, card_type)
);

create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null references public.users on delete cascade,
  card_id        uuid not null references public.cards on delete cascade,
  rating         int not null check (rating between 1 and 4),
  reviewed_at    timestamptz not null default now(),
  new_fsrs_state jsonb not null default '{}'
);

-- Seed data

insert into public.kanji (id, character, meanings, on_readings, kun_readings, jlpt_level, component_ids) values
  ('一', '一', '["one", "one radical (no.1)"]', '{いち,いつ}', '{ひと,ひと-つ}', 'N5', '[]');

insert into public.dialogues (trigger_type, trigger_ref, body_markdown) values
  ('onboarding', 'intro', 'Welcome. This is **一**. The beginning of everything. Study it well.');

insert into public.lessons (title, body_markdown, johto_zone, kanji_ids, quiz_questions) values
  (
    '一 — The First Step',
    E'# 一 — The First Step\n\nA single card is set on the table.\n\n> "This is 一," they say. "One stroke. One meaning. Everything begins here."\n\n一 (*ichi*) means **one**. It is the simplest kanji — a single horizontal stroke.\n\nOn-reading: **いち** (*ichi*) — as in 一月 (*ichigatsu*, January).\n\nKun-reading: **ひとつ** (*hitotsu*) — as in 一つの願い (one wish).',
    'new-bark-town',
    '["一"]',
    '[
      {"id": "q1", "kanji": "一", "type": "meaning", "prompt": "What does 一 mean?", "answer": "one"},
      {"id": "q2", "kanji": "一", "type": "reading", "prompt": "How do you read 一 (on-reading)?", "answer": "いち"}
    ]'
  );
