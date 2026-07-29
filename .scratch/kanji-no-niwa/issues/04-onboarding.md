# 04 — Séquence d'ouverture (écran-titre, avatar, nom en kana)

Status: ready-for-agent
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
