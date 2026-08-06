# 01 — Outillage : boucles de feedback pour l'implémentation AFK

Status: ready-for-human
Bloqué par: —
Bloque: rien formellement, mais à faire en premier (toutes les autres issues s'appuient dessus)

## Contexte

L'implémentation AFK (phase 5) exige des boucles de feedback automatiques : tests,
typecheck, lint. Aujourd'hui `package.json` n'a **ni `lint` ni `typecheck`**, vitest ne
couvre que `src/**/*.test.ts` (pas les `.tsx`), et les 9 linters de contenu de
`scripts/validate/` ne sont lancés qu'à la main.

## Périmètre

- `npm run typecheck` → `tsc --noEmit` (vert sur l'état actuel du repo, corriger si besoin).
- `npm run lint` → ESLint avec `eslint-config-next` (le code contient déjà des
  `eslint-disable` orphelins). Config minimale, pas de bikeshedding de règles.
- Vitest : inclure `src/**/*.test.tsx` (environnement jsdom pour ces fichiers via
  `environmentMatchGlobs` ou équivalent) ; `@vitejs/plugin-react` est déjà installé.
- `npm run validate:content` → enchaîne les linters Python de `scripts/validate/`
  (lint-kanji-budget, lint-cross-refs, lint-dialogue-states, lint-kanji-density,
  lint-lessons-kanji-coverage, lint-grammar-overlay, check-cs-kanji-deadlock,
  solve-progression). Échec = code de sortie non nul.
- `npm run check` → typecheck + lint + test + validate:content (la commande unique de la
  Ralph loop).

## Critères d'acceptation

- Les 5 commandes existent et sont vertes sur `main`.
- `progression-engine.test.ts` passe toujours.

## Hors périmètre

CI distante (GitHub Actions) — local d'abord, la CI viendra après le jalon 1.

## Comments

### 2026-07-29 — implémentation (agent)

Fait :

- `npm run typecheck` → `tsc --noEmit`. Vert d'emblée, aucune correction nécessaire.
- `npm run lint` → `eslint .` avec `eslint.config.mjs` (flat config, ESLint 9.39,
  `eslint-config-next@16.2.9` qui exporte nativement des flat configs :
  `core-web-vitals` + `typescript`). Vert : 0 erreur, 2 warnings `no-img-element`
  pré-existants dans MapClient.tsx (non bloquants).
- Vitest : `environmentMatchGlobs` n'existe plus en Vitest 4 → `test.projects` avec
  deux projets : `node` pour `src/**/*.test.ts`, `jsdom` (+ `@vitejs/plugin-react`)
  pour `src/**/*.test.tsx`. Vérifié avec un `.test.tsx` de fumée temporaire
  (rendu React dans jsdom, 2 fichiers/57 tests verts), supprimé ensuite.
- `npm run validate:content` → enchaîne les 8 scripts de `scripts/validate/` listés
  au périmètre (tous vérifiés individuellement : exit 0). `calc-cs-corpus.py` est un
  outil de calcul, pas un linter, donc non inclus.
- `npm run check` → typecheck + lint + test + validate:content. Vert de bout en bout.
- **Ajout au périmètre (orchestrateur)** : `npm run db:migrate -- <fichier.sql>` →
  `scripts/db/migrate.ts` (tsx + `--env-file=.env.local`). Utilise le `Client`
  WebSocket de `@neondatabase/serverless` (multi-statements en un seul `query()`,
  transaction implicite) plutôt que le driver HTTP de `scripts/lib/db.ts` (limité à
  un statement par requête). `DATABASE_URL` vide sur cette machine → testé : message
  clair + exit 1 (idem sans argument ou fichier illisible). **Non testé contre une
  vraie base** — à valider humainement à la première migration réelle (002+).

Sorties (résumé) :

- `npm run typecheck` : exit 0, aucune erreur.
- `npm run lint` : exit 0, 2 warnings (`<img>` dans MapClient.tsx).
- `npm test` : 1 fichier, 56 tests, tous verts (`progression-engine.test.ts` intact).
- `npm run validate:content` : 8/8 scripts exit 0 (102 fichiers sous plancher densité
  en WARN non bloquant, traversée complète prouvée par solve-progression).
- `npm run check` : exit 0.

Écarts / décisions :

- Exclusion lint ciblée : `react-hooks/refs` et `react-hooks/immutability` désactivées
  pour `src/app/map/MapClient.tsx` uniquement (14 erreurs des nouvelles règles
  « compiler » de react-hooks v7 livrées avec Next 16 ; le fichier lit des refs pendant
  le rendu de façon délibérée et commentée — le refondre est hors périmètre).
- Corrections minimales de 3 warnings `no-unused-vars` : import `dirname` et
  destructuration `modules` dans `scripts/import/prune-parasites.ts`, import de type
  `KanjiInfo` dans `src/lib/progression-engine.test.ts`.
- Dépendances dev ajoutées : `eslint`, `eslint-config-next@16.2.9`, `jsdom`.
