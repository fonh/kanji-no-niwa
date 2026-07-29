# 04 — Séquence d'ouverture (écran-titre, avatar, nom en kana)

Status: ready-for-human
Bloqué par: —
Bloque: 07 (le clavier romaji→kana est réutilisé par le mode Saisie)

## Contexte

PRD § Séquence d'ouverture. Un squelette existe (`src/app/onboarding/`,
`onboarding/mentor-intro/`) — à refondre. Décisions actées : écran-titre à chaque
lancement, avatar Ethan/Lyra, saisie du nom en kana via clavier romaji→kana (jamais de
latin affiché), champ vide par défaut.

## Périmètre (vertical slice)

- **Écran-titre** : logo + « presse START », à chaque lancement, même compte avancé.
- **Choix d'avatar** : garçon/fille (sprites `public/sprites/characters/`), persisté
  (champ `users.avatar` ou équivalent — nouveau, petite migration).
- **Saisie du nom** : composant **`KanaInput`** réutilisable (`src/lib/` ou
  `src/components/`) — le joueur tape en romaji, conversion kana en direct. Ajouter la
  dépendance `wanakana` (prévue par le PRD, absente de package.json). Ce composant est
  le même que celui du mode Saisie du combat (issue 07) — le concevoir comme tel
  (contrôlé, testable hors DOM pour la logique de conversion).
- **Enchaînement** : titre → (si nouveau compte) avatar → nom → spawn dans la chambre du
  joueur (`MAP_NEW_BARK_PLAYER_HOUSE_2F`) → descente → Mom → sortie vers le labo.
  (Les dialogues de Mom/Elm sont du ressort des issues 02/03 — ici on ne fait que
  brancher le flux d'entrée.) Si compte existant : titre → carte à la position sauvée.
- **Aucun français ni latin affiché** (§ Langue du Jeu) ; libellés système en japonais
  (`content/ui-strings.json` — créer le fichier s'il n'existe pas, PRD § Chaînes système).

## Critères d'acceptation

- Premier lancement : parcours titre → avatar → nom → chambre, nom kana persisté.
- Relancement : titre → START → carte, sans re-onboarding.
- Tests : conversion romaji→kana du composant (unitaires), flux nouveau/existant.

## Comments

**2026-07-29 (agent, implémentation)** — Fait, en TDD strict (chaque module : test
rouge d'abord, puis vert).

Livré :
- `src/lib/kana-input.ts` — conversion romaji→kana pure, hors DOM (dépendance
  `wanakana@5.3.1` ajoutée). API : `toKanaLive` (IME-like : minuscules→hiragana,
  MAJUSCULES→katakana, `n` et consonnes doublées en suspens — かn, かtt),
  `finalizeKana` (résout le n final : かn→かん), `isKanaText` (kana-only strict,
  aucun résidu latin ne passe), `kanaLength` (borne de champ sans couper une
  syllabe). 18 tests.
- `src/components/KanaInput.tsx` — champ contrôlé réutilisable (l'issue 07 s'en
  ressert pour le mode Saisie). Props : `{value, onChange, onSubmit?, maxKana?,
  autoFocus?, className?, ariaLabel?}` — `value` porte la chaîne convertie,
  finalisation/validation à la charge du parent au submit ; champ vide par
  défaut, IME système et suggestions désactivés. 7 tests jsdom.
- `src/lib/onboarding.ts` — flux pur : `AVATARS` (`ethan`/`lyra`, sourcés HGSS),
  `isAvatar`, `avatarPortrait` (battle_000/001, écran de choix),
  `avatarOverworldSprite` (planches protagonist_*_ow 8×4×32px), `isOnboarded`
  (nom ET avatar posés), `startDestination`, `parseOnboarding` (revalidation
  serveur : avatar connu + nom finalisé kana-only ≤ `MAX_NAME_KANA` = 8),
  `ONBOARDING_SPAWN` (MAP_NEW_BARK_PLAYER_HOUSE_2F, tile 6,6 — zone présente
  dans le registre, marchabilité vérifiée par test contre le vrai
  zone-registry.json). 8 tests.
- Écran-titre : `src/app/page.tsx` refondu — logo texte 漢字の庭 stylisé +
  `src/app/StartPrompt.tsx` (「スタートを　おしてね」 clignotant, tap plein
  écran ou Enter), à chaque lancement ; connecté → destination serveur
  (`startDestination`), non connecté → bouton 「Googleで　ログイン」 à la place
  de l'invite. 3 tests jsdom.
- Onboarding refondu : `src/app/onboarding/OnboardingClient.tsx` (avatar
  garçon/fille avec portraits HGSS → nom via KanaInput en `.font-reading`,
  chrome en `.font-chrome`, けってい/もどる, erreur en japonais) ;
  `actions.ts` : `completeOnboarding(avatar, name)` — revalidation
  `parseOnboarding`, garde d'idempotence (compte onboardé jamais réécrit),
  écrit `users.trainer_name`/`users.avatar` puis spawn chambre via
  `savePlayerState` (chambre = première entrée de `visited_zones`, même
  sémantique que saveMapPosition). L'ancien squelette `mentor-intro/` (table
  `dialogues` legacy) supprimé. 6 tests jsdom (dont « aucun latin affiché »
  vérifié par assertion sur textContent).
- `db/migrations/003_avatar.sql` — additive : `users.avatar text check in
  ('ethan','lyra')`. **Non appliquée** (DATABASE_URL vide ici) — à passer via
  `npm run db:migrate -- db/migrations/003_avatar.sql` AVANT de déployer (les
  pages titre/carte/onboarding lisent la colonne).
- Branchement carte : `map/page.tsx` redirige vers `/onboarding` si compte non
  onboardé et passe la planche de l'avatar choisi ; `MapClient` : prop
  optionnelle `playerSpriteUrl` (défaut planche Ethan) — 3 lignes, rien
  d'autre touché.
- `src/data/ui-strings.json` créé — `{clé: {jp}}` (invite START, choix
  avatar, nom, けってい, もどる, erreur de sauvegarde, login). À migrer tel
  quel vers le `content/ui-strings.json` du PRD quand le pipeline contenu
  l'ingérera.

Critères d'acceptation, un par un :
1. Premier lancement : titre → START → `/onboarding` (avatar → nom) →
   `completeOnboarding` persiste nom kana + avatar + spawn
   MAP_NEW_BARK_PLAYER_HOUSE_2F → carte dans la chambre. Testé : parcours
   complet OnboardingClient (action appelée avec le nom finalisé けn→けん,
   navigation /map), spawn marchable contre le vrai registre. ✓
2. Relancement : titre → START → carte à la position sauvée
   (`startDestination(true)` = `/map`, la page carte lit `user_map_state`
   comme avant) ; `/onboarding` redirige vers `/map` si onboardé, et l'action
   est idempotente (jamais de réécriture d'une sauvegarde). ✓
3. Tests : 42 nouveaux (18 conversion pure + 7 composant KanaInput + 8 flux
   pur + 6 flux client + 3 titre) — 213 au total, `npm run check` tout vert. ✓

Écarts/décisions :
- **Nom borné à 8 kana** (les jeux DS japonais en autorisent 5) — généreux
  pour les noms en digraphes, à resserrer si la QA préfère l'authenticité.
- **« Aucun latin »** : une exception assumée, le bouton de connexion
  「Googleで　ログイン」 (nom de marque, écran pré-jeu, hors session de jeu).
  Les libellés A/B/START des overlays DS relèvent du chrome console existant
  (hors périmètre).
- **Comptes d'avant cette issue** (nom saisi par l'ancien écran, pas
  d'avatar) : `isOnboarded` les renvoie à l'onboarding complet — le nom se
  ressaisit en kana (l'ancien pouvait être latin), rien n'est perdu d'autre.
- **`users.avatar` en colonne texte contrainte** plutôt qu'enum : additive et
  triviale à étendre si d'autres avatars arrivaient (il n'y en aura pas au
  jalon 1).
- Spawn (6,6) au centre de la chambre : le « descente → Mom → sortie labo »
  est du contenu/moteur déjà en place (issues 02/03), rien à brancher de plus.
- Pas de vérification visuelle en navigateur (DATABASE_URL absent, connu
  depuis l'issue 02) — la QA humaine (phase 6) verra titre/portraits/saisie.
