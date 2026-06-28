-- Schema for 漢字の庭 (Kanji no Niwa)
-- Run via: supabase db push

-- Content tables (populated by import scripts before any user data)

create table public.kanji (
  id          text primary key,          -- kanji character itself, e.g. '一'
  character   text not null unique,
  meanings    jsonb not null default '[]',
  on_readings text[] not null default '{}',
  kun_readings text[] not null default '{}',
  jlpt_level  text,                       -- 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | null
  component_ids jsonb not null default '[]'  -- array of kanji character IDs
);

create table public.dialogues (
  id           uuid primary key default gen_random_uuid(),
  trigger_type text not null,
  trigger_ref  text not null,
  body_markdown text not null,
  unique (trigger_type, trigger_ref)
);

create table public.lessons (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  body_markdown  text not null,
  johto_zone     text not null,
  kanji_ids      jsonb not null default '[]',  -- array of kanji character IDs
  quiz_questions jsonb not null default '[]'
);

-- User tables (populated at runtime)

create table public.users (
  id            uuid primary key references auth.users on delete cascade,
  trainer_name  text,
  created_at    timestamptz not null default now()
);

create type card_type as enum ('meaning', 'reading');

create table public.cards (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users on delete cascade,
  kanji_id       text not null references public.kanji,
  card_type      card_type not null,
  fsrs_state     jsonb not null default '{}',
  next_review_at timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  unique (user_id, kanji_id, card_type)
);

create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users on delete cascade,
  card_id       uuid not null references public.cards on delete cascade,
  rating        int not null check (rating between 1 and 4),
  reviewed_at   timestamptz not null default now(),
  new_fsrs_state jsonb not null default '{}'
);

-- Row-level security

alter table public.users enable row level security;
alter table public.cards enable row level security;
alter table public.reviews enable row level security;

create policy "users can read own row" on public.users
  for select using (auth.uid() = id);

create policy "users can update own row" on public.users
  for update using (auth.uid() = id);

create policy "users can insert own row" on public.users
  for insert with check (auth.uid() = id);

create policy "users can read own cards" on public.cards
  for all using (auth.uid() = user_id);

create policy "users can read own reviews" on public.reviews
  for all using (auth.uid() = user_id);

-- Content tables are public read-only
alter table public.kanji enable row level security;
alter table public.lessons enable row level security;
alter table public.dialogues enable row level security;

create policy "kanji is public" on public.kanji for select using (true);
create policy "lessons are public" on public.lessons for select using (true);
create policy "dialogues are public" on public.dialogues for select using (true);

-- Seed data

insert into public.kanji (id, character, meanings, on_readings, kun_readings, jlpt_level, component_ids) values
  ('一', '一', '["one", "one radical (no.1)"]', '{いち,いつ}', '{ひと,ひと-つ}', 'N5', '[]');

insert into public.dialogues (trigger_type, trigger_ref, body_markdown) values
  ('onboarding', 'intro', 'Welcome. This is **一**. The beginning of everything. Study it well.');

insert into public.lessons (title, body_markdown, johto_zone, kanji_ids, quiz_questions) values
  (
    '一 — The First Step',
    E'# 一 — The First Step\n\nSensei Fukuda sets a single card on the table.\n\n> "This is 一," he says. "One stroke. One meaning. Everything begins here."\n\n一 (*ichi*) means **one**. It is the simplest kanji — a single horizontal stroke — and the first kanji ever written by a student in this 道場.\n\nOn-reading: **いち** (*ichi*) — as in 一月 (*ichigatsu*, January).\n\nKun-reading: **ひとつ** (*hitotsu*) — as in 一つの願い (one wish).\n\nFukuda nods. "Now you know it. Let us see if you have learned it."',
    'new-bark-town',
    '["一"]',
    '[
      {"id": "q1", "kanji": "一", "type": "meaning", "prompt": "What does 一 mean?", "answer": "one"},
      {"id": "q2", "kanji": "一", "type": "reading", "prompt": "How do you read 一 (on-reading)?", "answer": "いち"}
    ]'
  );
