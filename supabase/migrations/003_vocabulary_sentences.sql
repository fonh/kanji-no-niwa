-- Vocabulary entries from JMdict (compound words containing Jōyō kanji)
create table if not exists public.vocabulary (
  id          text primary key,           -- JMdict ent_seq as text
  word        text not null,              -- written form (kanji + kana)
  reading     text not null,              -- kana reading
  meanings    jsonb not null default '[]', -- array of English glosses
  kanji_ids   text[] not null default '{}', -- which Jōyō kanji appear in this word
  jlpt_level  text                        -- 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | null
);

alter table public.vocabulary enable row level security;
create policy "vocabulary is public" on public.vocabulary for select using (true);

create index vocabulary_kanji_ids_idx on public.vocabulary using gin(kanji_ids);

-- Example sentences from Tatoeba (Japanese sentences with EN translation)
create table if not exists public.sentences (
  id          integer primary key,        -- Tatoeba sentence ID
  text        text not null,              -- Japanese sentence
  translation text,                       -- English or French translation
  kanji_ids   text[] not null default '{}' -- which Jōyō kanji appear in this sentence
);

alter table public.sentences enable row level security;
create policy "sentences are public" on public.sentences for select using (true);

create index sentences_kanji_ids_idx on public.sentences using gin(kanji_ids);
