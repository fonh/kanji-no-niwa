# 10 — Traversée Bourg Geon → Route 30 : gates, bandeaux, intégration finale

Status: ready-for-agent
Bloqué par: 06, 07 (et transitivement toutes les autres)
Bloque: — (clôt le jalon 1)

## Contexte

L'issue d'intégration : le parcours A1 du plan de revue joué de bout en bout sur
téléphone en paysage. Le moteur de carte (`MapClient.tsx`) gère déjà déplacement,
collision, warps et transitions outdoor — il manque les règles de jeu au franchissement
et le polissage du parcours réel.

## Périmètre (vertical slice)

- **Bandeau d'entrée de zone** : nom japonais officiel (ワカバタウン…) depuis
  `content/zone-registry-names.json` `name.jp` à chaque entrée de zone (PRD § Noms de
  lieux) ; `visited_zones[]` mis à jour.
- **Gate SRS quotidien** (PRD § Boucle Quotidienne pt 5 — via `getDailySRSStatus`,
  **jamais une Condition**) : entrer dans une zone **extérieure jamais visitée** sans ✓
  → pas de franchissement, joueur repoussé d'une case, message 「…」 (formulation jp
  dans `ui-strings.json`). Étages/intérieurs jamais gatés. Retour en arrière jamais gaté.
- **Roadblock NPC** (CONTEXT.md) : mécanique d'interception générique — Sight Cone →
  le PNJ marche vers le joueur, livre sa ligne, repousse d'une case ; re-déclenche à
  chaque approche tant que la condition n'est pas levée. (Utilisée par les PNJ-leçon à
  cône en avance de séquence, et par les bloqueurs d'histoire des zones suivantes.)
- **Parcours réel vérifié et corrigé** : les 7 intérieurs de Bourg Geon (labo d'Elm 1F/2F,
  maisons) navigables — plusieurs réutilisent le screenshot extérieur, le repli
  `CollisionCanvas` doit rester jouable ; maison de Mr. Pokémon (Route 30) ; positions de
  spawn ; suivi du compagnon choisi (sprite follower derrière le joueur — si aucune
  planche exploitable dans le dump, marqueur simple assumé, noté pour la passe assets).
- **Contrôles overlay finalisés** : D-pad maintien = pas enchaînés cadence fixe, A/B
  toujours visibles, X/Y seulement en dialogue, START/SELECT discrets (PRD § Interface).
- Musique de zone si le mapping `music_rom_seq` → fichier OST est trivial, sinon différé
  (passe assets — ne pas bloquer le jalon là-dessus).

## Critères d'acceptation (= définition de fin du jalon 1)

Le parcours complet, sur mobile en paysage, sans toucher à la console :
1. Onboarding → chambre → Mom → labo → compagnon → leçons 1-2 → envoi chez Mr. Pokémon.
2. Route 29 (bandeau, panneau-texte) → Ville Griotte (Guide Gent…) → Route 30 →
   Mr. Pokémon (œuf) → retour → **Silver #1** → labo → leçons 3-5.
3. Lendemain : appel d'Elm → session SRS → ✓ ; sans ✓, l'entrée d'une zone extérieure
   nouvelle repousse d'une case.
4. `npm run check` vert ; le solveur de progression (`solve-progression.py`) reste vert.

## Hors périmètre

Tout au-delà de Route 30 (Route 31, Mauville, Falkner = jalon 2), voyage rapide,
Pokégear complet, obstacles CS.
