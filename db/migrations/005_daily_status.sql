-- Statut quotidien SRS (jalon 1, issue 06) — PRD § Schéma `daily_status`.
--
-- Une ligne par jour ✓ : écrite quand le statut du jour est atteint (file du
-- jour vidée, plafond de rattrapage 200 atteint, ou « aucune carte due » —
-- ce dernier chemin ne laisse AUCUNE ligne dans reviews, d'où cette table :
-- sans elle, streak / calendrier de présence / achievements étaient
-- incalculables pour ces jours, PRD audit 08 V-3).
--
-- `date` est le jour calendaire LOCAL du joueur (bascule à minuit heure
-- locale de l'appareil, offset client borné ±14 h côté serveur) ; la preuve
-- d'écriture `recorded_at` est horodatée SERVEUR (now() Postgres, jamais une
-- valeur client — PRD § Jour calendaire). Le statut du jour COURANT reste
-- calculé live par getDailySRSStatus ; cette table est l'historique + le
-- « ✓ acquis jusqu'à la bascule de jour suivante ».
--
-- Migration additive. Appliquer avec :
--   npm run db:migrate -- db/migrations/005_daily_status.sql

create table public.daily_status (
  user_id     text not null references public.users on delete cascade,
  date        date not null,
  -- Contrainte CHECK nommée, modifiable par ALTER (jamais un enum SQL fermé)
  path        text not null constraint daily_status_path_check
                check (path in ('session', 'no_cards_due')),
  recorded_at timestamptz not null default now(),
  primary key (user_id, date)
);
