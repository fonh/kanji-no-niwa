# 12 — Interactions fidèles au jeu : suppression du tap, placements corrigés à la racine

Status: ready-for-human
Bloqué par: 10
Bloque: —

## Contexte

Demande utilisateur explicite : les interactions doivent être exactement comme
dans le jeu Pokémon — on interagit avec un dresseur/PNJ UNIQUEMENT en se
plaçant à côté et en appuyant sur A (Talk), ou en passant dans son cône de
vision (déclenchement auto). Le tap/clic sur les personnages, ajouté comme
contournement à l'issue 10 (« dresseurs tapables » — indispensable tant que
Silver #1 vivait sur une tuile injoignable), devait disparaître, et les
placements de contenu qui l'avaient motivé être corrigés à la racine.

## Racine commune (bug de fond, corrigée en code)

`content/map/npcs.json` ne connaissait que les slugs de zones EXTÉRIEURES et
l'heuristique `zone-slug` ne sert jamais les intérieurs → tout PNJ d'intérieur
(Mom, Elm, son assistant, le PC, l'employée du Centre) était aplati sur la
carte extérieure, posé sur/contre le bâtiment peint (tuiles solides ou
tuile-porte). C'était le « fond du problème à trancher » noté par l'issue 10.

Fix code : champ optionnel `map_zone` (MAP_* explicite) dans `npcs.json` —
`src/lib/npcs.ts` sert un PNJ à `map_zone` UNIQUEMENT dans cette zone-là
(tile_x/tile_y locaux à sa grille), les autres suivent l'heuristique de slug
comme avant. `MapNpcEntry` (content.ts) étendu. Aucun autre consommateur des
coordonnées (solveur, linters, visibilité : tous keyed sur zone_id/npc_id).

## Diagnostic par entité (racine réelle) et corrections

Grilles de collision réelles vérifiées (src/data/zone-registry.json). Les
`placements/*.json` sont volontairement INTACTS : ils documentent l'extraction
ROM (matched_object_id), pas la position jouable — chaque entrée corrigée de
npcs.json/trainers.json porte la justification dans `position_status`.

1. **silver_apparition1_cherrygrove** (trainers.json)
   - Avant : MAP_CHERRYGROVE (63,0), facing south, sight_range 4 — coin
     eau/solide ; toute la ligne de vue (63,1..4) est non-marchable :
     l'embuscade ne pouvait JAMAIS se déclencher.
   - Racine : la coordonnée ROM matchée (obj_T21_gsrivel) est la tuile de
     parcage d'un objet piloté par script en HGSS (caché, puis déplacé par la
     cinématique d'embuscade) — l'extraction statique ne peut pas rejouer le
     script.
   - Après : (60,13) facing south (corridor est de la ville, « retour du
     chemin vers Route 29 », npc-inventory.md § cherrygrove-city). Sa ligne
     de vue (60,14)-(60,17) + sa propre tuile (60,13, solide car occupée)
     barrent le goulot est : BFS prouvé, AUCUN chemin bord-Route-30 →
     bord-Route-29 n'esquive le cône. Ajout `unlock_conditions`
     (quest_step mystery_egg_errand ≥ egg_received) = l'équivalent exact du
     drapeau de script HGSS : absent à l'aller, embuscade au retour seulement.
     (Champ au-delà de position/facing, assumé : sans lui, le même goulot
     déclencherait l'embuscade à l'aller — infidèle ; le serveur filtre déjà
     la présence par unlock_conditions, zéro code.)
2. **silver_card_cherrygrove** (npcs.json)
   - Avant : (63,1), dans le solide/l'eau à côté de l'ancien Silver.
   - Après : (59,13), une tuile à l'ouest de la position d'embuscade (tombée
     là où Silver bouscule le joueur en repartant, HGSS), gated npc_cleared
     comme avant, ramassable par A.
3. **mom_new_bark**
   - Avant : MAP_NEW_BARK (23,12) = LA tuile-porte de la maison du joueur
     (warp) — elle bloquait l'entrée à pied et on respawnait sur elle.
   - Racine : PNJ d'intérieur (SPRITE_GSMAMA vit dans la maison en HGSS)
     aplati sur l'extérieur (racine commune).
   - Après : map_zone MAP_NEW_BARK_PLAYER_HOUSE_1F (6,6) facing east, à côté
     de la table du séjour, hors du chemin porte↔escalier, interagible par A.
4. **prof_elm_lab**
   - Avant : MAP_NEW_BARK (31,0) facing north — tuile solide sans voisin
     marchable (le toit du labo peint) ; la leçon se jouait au tap.
   - Racine : idem (obj_T20_doctor vit dans le labo).
   - Après : map_zone MAP_NEW_BARK_ELMS_LAB_1F (5,4) facing south — au fond
     du labo devant ses machines comme en HGSS, interagible par A depuis (5,5).
5. **elm_assistant_new_bark**
   - Avant : MAP_NEW_BARK (29,1), solide injoignable — l'audit G5 du
     2026-07-21 voulait déjà « dans le labo près d'Elm », impossible tant que
     les intérieurs ne servaient aucun PNJ.
   - Après : map_zone MAP_NEW_BARK_ELMS_LAB_1F (10,4) facing south (rangée
     nord côté étagères), interagible par A depuis (10,5).
6. **player_pc_new_bark**
   - Avant : MAP_NEW_BARK (12,8) — atteignable uniquement depuis la
     tuile-porte du labo, alors que sa propre note disait « 2F de la maison ».
   - Après : map_zone MAP_NEW_BARK_PLAYER_HOUSE_2F (9,5) — contre le mur nord
     de la chambre (coin bureau) ; le joueur se tient sur (9,6), face au nord,
     A ouvre la lecture (lyra_mail), comme dans le jeu.
7. **sign_johto_entrance_route29**
   - Avant : MAP_ROUTE_29 (2,2) — coin solide isolé, aucun voisin marchable.
   - Racine : coordonnée provisoire inventée (aucune donnée ROM), simplement
     fausse.
   - Après : (2,11) — contre la lisière, bord nord du chemin de l'entrée
     ouest ; le joueur se tient sur (2,12), face au nord, A lit le panneau.
8. **pokecenter_clerk_cherrygrove** (découvert par la nouvelle assertion
   exhaustive, même classe de bug — pas dans la liste de l'issue 10)
   - Avant : MAP_CHERRYGROVE (57,10) — poche de tuiles peintes du bâtiment,
     isolée de tout chemin marchable.
   - Après : map_zone MAP_CHERRYGROVE_POKECENTER_1F (15,5), derrière le
     comptoir nord-est, interagible par A depuis (15,6).

## MapClient — plus aucun tap sur le contenu de la carte

- Supprimés : `handleNpcClick`, `handleWarpClick`, le onClick des marqueurs
  dresseurs (le contournement de l'issue 10), les cursors/hover associés.
- Marqueurs PNJ, dresseurs et portes : `pointerEvents: 'none'` (comme les
  objets décoratifs et l'avatar, déjà inertes). Restent : (a) A face à une
  entité adjacente, (b) le cône de vision (`sight_auto`), (c) marcher sur une
  porte.
- Les contrôles d'UI restent tactiles, inchangés : D-pad, A/B, X/Y (dialogue),
  START/SELECT, sélecteur d'étage, tiroir dev, HUD.

## Tests

- `src/lib/a1-traversal.test.ts` — les épingles « placements défaillants »
  (assertions `false`) remplacées par le comportement correct :
  - CHAQUE PNJ/dresseur/objet extérieur du jalon interagible par A depuis une
    tuile adjacente atteinte à pied (exhaustif, plus une liste nominale) ;
  - les PNJ d'intérieur servis DANS leur pièce (jeu exact par pièce),
    jamais sur une tuile-porte, adjacents-atteignables depuis chaque porte,
    et plus JAMAIS servis dans la zone extérieure ;
  - aucune entité du jalon sur une tuile-warp (la classe de bug « Mom ») ;
  - **embuscade Silver #1** : position + ligne de vue marchables ; BFS en
    géométrie réelle : cône interdit → la sortie est de Ville Griotte est
    INATTEIGNABLE depuis le bord Route 30 (embuscade inévitable au retour),
    cône autorisé → traversée possible ; absent à l'aller
    (defaultPlayerState), présent à egg_received (filterVisibleTrainers),
    carte de dresseur adjacente révélée après victoire.
- `src/app/map/MapClient.test.tsx` (nouveau, jsdom) — fidélité des
  interactions au niveau composant : clic sur PNJ/dresseur/porte = AUCUN
  effet (mocks jamais appelés, `pointerEvents: none` assertés) ; le bouton A
  d'UI déclenche bien le Talk adjacent ; le D-pad tactile fait avancer d'une
  case.

## Vérification

`npm run check` entièrement vert : typecheck, eslint 0 erreur (4 warnings
no-img-element préexistants), 511 tests / 38 fichiers (501 avant : +5
composant, +5 traversée nette), lints contenu OK, solveur de progression
inchangé (60 zones, 16/16 quêtes, aucun bloquant — le unlock de Silver #1 est
résolu au point fixe après egg_received, comme en jeu).

## Restes / hors périmètre notés

- `shopkeeper_cherrygrove` (44,8) et `man_in_house_route30` (21,33) : posés
  DEHORS alors qu'ils appartiennent au Mart / à l'Apricorn House — mais
  atteignables et interagibles par A, donc non bloquants ; à re-loger via
  `map_zone` à une passe contenu (même mécanisme, désormais disponible).
- `guide_gent_cherrygrove` (35,0) : interagible, mais posté au corridor NORD
  (vers Route 30) alors qu'en HGSS il accueille à l'entrée est — placement
  discutable, non bloquant, non touché (leçon en tête de zone : le déplacer
  change l'endroit où la leçon #1 de la ville se joue).
- `content/map/placements/*.json` volontairement intacts (registre de
  l'extraction ROM) — la divergence assumée est documentée dans chaque
  `position_status`.
- QA téléphone : séquence d'embuscade à l'écran (！ + engagement), Mom/Elm
  rendus dans les intérieurs CollisionCanvas (screenshots réels = passe
  assets).
