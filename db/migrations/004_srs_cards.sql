-- SRS générique + rencontres de grammaire (jalon 1, issue 05).
--
-- Migration ADDITIVE : étend `cards` au modèle du PRD § Schéma (le PRD
-- nomme les tables srs_cards/srs_reviews — on GARDE les noms cards/reviews,
-- divergence de nommage documentée au board des issues) :
--   - item_type : 'kanji' | 'word' aujourd'hui, extensible (contrainte CHECK
--     nommée, modifiable par ALTER — jamais un enum SQL fermé ; l'issue
--     hors-jalon 06 de verif-systemes pourrait ajouter 'grammar') ;
--   - item_id  : le kanji lui-même, ou l'id du mot plus tard ;
--   - facet    : 'sens' | 'lecture' (remplace card_type meaning/reading).
-- Les lignes existantes sont backfillées depuis kanji_id/card_type ; les
-- colonnes legacy restent en place (la page /study les lit encore) mais
-- deviennent nullables — une future carte 'word' n'a pas de kanji_id.
--
-- Appliquer avec : npm run db:migrate -- db/migrations/004_srs_cards.sql

alter table public.cards add column item_type text not null default 'kanji';
alter table public.cards add column item_id   text;
alter table public.cards add column facet     text;

alter table public.cards add constraint cards_item_type_check
  check (item_type in ('kanji', 'word'));
alter table public.cards add constraint cards_facet_check
  check (facet in ('sens', 'lecture'));

-- Backfill des lignes existantes depuis leurs colonnes actuelles
update public.cards set
  item_id = kanji_id,
  facet   = case card_type when 'meaning' then 'sens' else 'lecture' end
where item_id is null;

alter table public.cards alter column item_id set not null;
alter table public.cards alter column facet   set not null;

-- Les colonnes legacy ne portent plus l'identité de la carte : une carte
-- 'word' n'aura ni kanji_id ni card_type. (Retrait complet dans une
-- migration ultérieure, après bascule de /study sur item_id/facet.)
alter table public.cards alter column kanji_id  drop not null;
alter table public.cards alter column card_type drop not null;

-- Nouvelle identité d'une carte : (user, type d'item, item, facette).
-- L'ancien unique (user_id, kanji_id, card_type) reste en place — les deux
-- coïncident pour les cartes kanji.
create unique index cards_user_item_facet_key
  on public.cards (user_id, item_type, item_id, facet);

-- Rencontres de grammaire (PRD § Leçons : la grammaire ne rejoint pas le
-- SRS — elle est apprise par les rencontres ; first_seen à la complétion de
-- la leçon, times_drawn/last_drawn_at alimentés par la rotation des combats,
-- issue 07+).
create table public.grammar_encounters (
  user_id       text not null references public.users on delete cascade,
  grammar_id    text not null,
  first_seen_at timestamptz not null default now(),
  times_drawn   integer not null default 0,
  last_drawn_at timestamptz,
  primary key (user_id, grammar_id)
);
