-- Add pre-tokenized chunks for the Disposition battle mode.
-- chunks[] stores kuromoji surface_form groups (noun+particle, verb+aux, etc.)
-- Empty array = sentence not suitable for Disposition (too simple or too complex).
alter table public.sentences
  add column if not exists chunks text[] not null default '{}';

create index sentences_chunks_len_idx
  on public.sentences (array_length(chunks, 1))
  where array_length(chunks, 1) between 5 and 9;
