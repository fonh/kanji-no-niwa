# 06 — Boucle quotidienne : appel du mentor + session SRS

Status: ready-for-human
Bloqué par: 05
Bloque: 10

## Contexte

PRD § Boucle Quotidienne et § Système SRS. Le prototype `src/app/study/` fait déjà
carte → Révéler → 4 notes via `ts-fsrs` — à refondre sur le schéma étendu (issue 05) et
à habiller (esthétique Centre Pokémon, appel du mentor).

## Périmètre (vertical slice)

**Données** :
- `daily_status` : `user_id`, `date`, `path` (`session`|`no_cards_due`). **Horodatage
  serveur** (`now()` Postgres, jamais une valeur client) ; la bascule de jour est minuit
  heure locale de l'appareil (PRD § Jour calendaire).

**Service** :
- `getDailySRSStatus` (fonction pure, dans `progression-engine.ts`) : `sessionDone` =
  file vidée OU plafond de rattrapage **200 cartes** atteint ce jour ; `cardsPending`.
- File du jour : cartes dues + nouvelles cartes du jour, **mélangées en une seule file**
  (pas de bloc « reviews d'abord »).
- Chemin « aucune carte due » → ✓ immédiat, `path: no_cards_due`.

**UI** :
- **Appel du mentor au premier lancement du jour** : sprite d'Elm, « tes révisions
  t'attendent » → lancer ou refuser. Lancements suivants du même jour silencieux.
  Refus → relançable via Pokégear → でんわ → Elm (une entrée téléphone minimale suffit,
  le Pokégear complet attendra) .
- **Session** : esthétique Centre Pokémon, carte affichée → Révéler → 4 notes
  (Encore/Difficile/Bien/Facile), écriture `reviews` horodatée serveur.
- **✓ du jour** : badge sur l'icône Pokégear, acquis jusqu'à la bascule de jour suivante.
- **Préface Carte Mot** (engine-contract § 8) : première review d'un mot → sa Carte Mot
  d'abord, 1 tap, une fois — état dérivé (aucune review existante pour ce mot), aucune
  colonne nouvelle. (Ne concerne que les cartes `word` — inactif au jalon 1 si le flux
  mots n'est pas branché, mais le code le prévoit.)

## Critères d'acceptation

- Jour J : leçon complétée → 0 carte due aujourd'hui → ✓ immédiat. Jour J+1 (simulé en
  test par injection d'horloge, pas en changeant l'heure système) : les 12 cartes sont
  dues, la session les épuise, ✓ posé, `daily_status` écrit.
- Tests : `getDailySRSStatus` (file vide / plafond 200 / backlog), mélange de la file,
  idempotence du ✓, chemin no_cards_due.

## Hors périmètre

Le **gate d'entrée en nouvelle zone** (repoussé d'une case si SRS non fait) → issue 10.
Streak et stats → écran Profil, hors jalon. Le canal SRS grammaire éventuel (issue 06
de verif-systemes, ready-for-human) — ne pas l'implémenter, juste ne pas le rendre
impossible (types extensibles).

## Comments

**2026-07-30 (agent, implémentation)** — Fait, en TDD strict (chaque module :
tests écrits d'abord). 49 tests nouveaux, 322 au total, `npm run check` tout vert.

Livré :
- `db/migrations/005_daily_status.sql` — additive : table `daily_status`
  (`user_id`, `date` = jour calendaire LOCAL du joueur, `path`
  'session'|'no_cards_due' en CHECK nommée, `recorded_at` default now()
  Postgres — l'horodatage de la preuve reste serveur, la date reste le jour
  du joueur). PK (user_id, date) = une ligne par jour ✓. **Non appliquée**
  (DATABASE_URL vide ici) — `npm run db:migrate -- db/migrations/005_daily_status.sql`.
- `src/lib/progression-engine.ts` — logique pure, zéro I/O :
  - `getDailySRSStatus(srsReviews, dueCards, today, checkedToday?)` →
    `{sessionDone, cardsPending, reviewedToday}` : sessionDone = file vidée
    OU ≥ 200 notées ce jour local OU ✓ déjà posé (acquis jusqu'à la bascule,
    même si de nouvelles cartes deviennent éligibles — PRD pt 4). **L'issue
    10 construit son gate dessus** (pure) ou sur le wrapper DAL ci-dessous.
  - `localDayKey` / `localDayStart` — bascule à minuit local, offset client
    borné ±14 h (même approche que `nextMorningDue` de l'issue 05) ;
  - `buildDailyQueue(dueCards, reviewedToday, rng?)` — dues + nouvelles
    MÉLANGÉES en une seule file (Fisher-Yates, rng injectable ; testé : pas
    de bloc reviews-d'abord), tronquée au quota restant du plafond (200 −
    déjà notées) ;
  - `needsWordCardPreface(card, reviewedWordIds)` — préface Carte Mot
    dérivée de l'absence de review (contrat § 8) ;
  - `DAILY_CATCH_UP_CAP = 200`.
- `src/lib/daily-srs.ts` — DAL fin (seul module à parler à `daily_status`) :
  `getDailySRSStatusForUser(userId, tz, now?)` (lecture seule — **l'API pour
  le gate de l'issue 10**) et `ensureDailyStatus(...)` (statut + pose du ✓
  s'il vient d'être atteint : path session si ≥1 review du jour, sinon
  no_cards_due ; idempotent, `on conflict (user_id, date) do nothing`).
- `src/app/study/actions.ts` — refonte : l'ancien `submitReview` (état FSRS
  calculé CLIENT, cru sur parole) est remplacé par `rateCard(cardId, rating
  1..4, tz)` — re-calcul ts-fsrs entièrement serveur sur l'état stocké,
  écriture `reviews` avec `reviewed_at` default now() Postgres (jamais une
  valeur client), puis re-vérification du statut du jour (✓ posé dès file
  vidée/plafond). + `checkDailyStatus(tz)` (appel du mentor, chemin
  « aucune carte due » → ✓ immédiat).
- `src/app/study/page.tsx` — refonte : bascule sur `item_type`/`item_id`/
  `facet` (les colonnes legacy kanji_id/card_type ne sont plus lues), join
  kanji + vocabulary (cartes word prêtes), file mélangée/plafonnée construite
  serveur, fuseau en query `?tz=` (défaut 0 en accès direct).
- `src/app/study/StudyClient.tsx` — refonte : esthétique Centre Pokémon
  (habillage CSS simple `.center-chrome/.center-panel/.center-accent*`,
  crème + accents rouges, identité DS), carte → Révéler → 4 notes
  (もういちど/むずかしい/できた/かんたん), kanji en grand `.font-reading`,
  facettes distinguées (badge いみ vert / よみ vermillon, réponse sens =
  keyword prioritaire + meanings, lecture = on・kun). Préface Carte Mot :
  écran 1-tap avant la première review d'un mot, une seule fois (serveur :
  absence de review ; client : mots déjà notés dans la session) — inactif au
  jalon (aucune carte word), testé. File vide au chargement →
  checkDailyStatus (filet idempotent du ✓ no_cards_due).
- `src/app/map/DailyLoop.tsx` — composant dédié monté par la page carte
  (**MapClient : 0 modification** ; map/page.tsx : +2 lignes) : appel du
  mentor au premier lancement du jour (sprite overworld d'Elm, invite →
  はじめる/あとで ; « tout est en ordre » + ✓ si rien n'est dû), lancements
  suivants silencieux (localStorage par jour local — état d'affichage
  appareil ; le ✓, lui, vit serveur), icône ポケギア avec badge (✓ du jour
  acquis / ！ rappel), entrée téléphone minimale ポケギア → でんわ →
  ウツギはかせ pour relancer après refus. Les touches ne traversent pas
  l'overlay (écouteur capture) — le D-pad clavier de MapClient est avalé.
- `src/data/ui-strings.json` : +23 chaînes système (appel, Pokégear, session,
  notes, préface). Aucun français visible joueur.

Critères d'acceptation, un par un (src/app/study/actions.test.ts, DB en
mémoire, horloge injectée via vi.setSystemTime — jamais l'heure système) :
1. Jour J : leçon complétée (buildNewCards sur les vrais kanji_ids de la
   leçon #1 d'Elm, dues au minuit local suivant) → 0 due aujourd'hui →
   ✓ immédiat, `daily_status` = (2026-07-30, no_cards_due) ; re-lancement
   même jour : rien de réécrit. ✓
2. Jour J+1 (horloge avancée) : 12 cartes dues, la session les épuise via
   rateCard (FSRS replanifie chaque carte dans le futur, 12 reviews
   horodatées serveur), ✓ posé, `daily_status` += (2026-07-31, session),
   idempotent au re-check. ✓
3. Tests : getDailySRSStatus (file vide / plafond 200 / 199 / backlog /
   bucket au minuit LOCAL / ✓ acquis) 8, localDay* 4, mélange+plafond de la
   file 4, préface 3 (purs) ; DAL 8 (dont idempotence) ; actions 4 ;
   StudyClient 11 (.tsx) ; DailyLoop 7 (.tsx). ✓

Écarts/décisions :
- **Pas de dialogue d'appel matinal d'Elm dans content/** (`dialogues/calls/`
  n'a que joey_route30, pas de `mentors/`) : l'UI de l'appel utilise des
  chaînes ui-strings comme demandé — **contenu manquant** à produire à la
  passe contenu (`content/dialogues/calls/prof_elm.json`, format
  dialogue_states/pages) puis à brancher sur DialogueBox.
- « SELECT → でんわ » : aucun bouton SELECT n'existe dans l'UI (D-pad + A/B,
  X/Y en dialogue) — l'entrée téléphone vit sur l'icône ポケギア en haut à
  droite de la carte (celle qui porte le badge ✓/rappel). À réviser quand le
  Pokégear complet (issue hors jalon) posera sa vraie navigation.
- Le « premier lancement du jour » (affichage de l'appel) est un état local
  à l'appareil (localStorage par jour local) : sur un nouvel appareil,
  l'appel se rejoue — sans effet de triche possible, le ✓ et toutes les
  écritures restent serveur. Aucune colonne nouvelle.
- Plafond appliqué DEUX fois : la file servie est tronquée au quota restant
  (page serveur) ET getDailySRSStatus recompte les reviews du jour — une
  session interrompue/reprise ne dépasse jamais 200.
- ts-fsrs par défaut garde ses learning steps courts (Bien sur une carte
  neuve → re-due ~10 min plus tard) : la file « se vide » au sens
  `next_review_at <= now()`, le ✓ posé reste acquis (idempotent) même si une
  carte en apprentissage redevient due dans la même journée.
- `?tz=` en query sur /study (défaut 0 en accès direct) : les points d'entrée
  réels (appel du mentor, téléphone) passent toujours le fuseau du client ;
  le troisième point d'entrée du PRD (Centre Pokémon, « Commencer la
  session ») attendra un intérieur de Centre praticable.
- Le canal SRS grammaire éventuel reste possible : rien ici ne re-contraint
  `item_type` (CHECK de la migration 004, modifiable par ALTER) — les types
  de session acceptent kanji|word et dégradent proprement (préface word
  seulement).
- Pas de vérification visuelle en navigateur (DATABASE_URL absent, connu
  depuis l'issue 02) — la QA humaine (phase 6) verra l'habillage Centre
  Pokémon, l'appel du mentor et les badges.
