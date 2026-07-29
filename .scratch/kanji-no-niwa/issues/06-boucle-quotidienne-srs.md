# 06 — Boucle quotidienne : appel du mentor + session SRS

Status: ready-for-agent
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
