-- Avatar du joueur (issue 04, séquence d'ouverture) — additive.
-- Ethan/Lyra sourcés HGSS (PRD § Séquence d'ouverture), choisi à
-- l'onboarding et persisté ici ; null = compte pas encore onboardé
-- (l'écran-titre renvoie alors vers /onboarding, voir
-- src/lib/onboarding.ts isOnboarded).
--
-- Apply with: npm run db:migrate -- db/migrations/003_avatar.sql

alter table public.users
  add column if not exists avatar text
  check (avatar in ('ethan', 'lyra'));
