# 10 — Traversée Bourg Geon → Route 30 : gates, bandeaux, intégration finale

Status: ready-for-human
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

## Comments

**2026-07-30 (agent, implémentation)** — Fait, en TDD strict (gate et machine
d'interception : tests rouges d'abord). 38 tests nouveaux (5 gate pur + 8
roadblock + 3 zone-slug + 2 loader + 5 zones + 9 actions + 6 traversée A1),
501 au total, `npm run check` tout vert (typecheck, lint 0 erreur, lints
contenu, solveur de progression inchangé).

Livré :
- **Gate SRS quotidien** — `src/lib/zone-gate.ts` (pur, JAMAIS une Condition,
  finding 02-D4) : `gateBlocksEntry(target, visitedZones, srsSessionDone)` —
  extérieur seulement, jamais une zone visitée, jamais un intérieur (03-D5).
  Branchement : server action `checkZoneEntry(zoneName, tz)` (map/actions.ts,
  consomme `getDailySRSStatusForUser` de l'issue 06) appelée par MapClient
  au moment PRÉCIS du franchissement d'une zone extérieure jamais visitée —
  les DEUX chemins passent par `goToZone` (continuité outdoor→outdoor
  d'attemptStep ET warps), donc un seul point d'interception, zéro
  aller-retour par pas. **Choix documenté** : pas de statut pré-chargé côté
  client (il périmerait à minuit) — vérification serveur au franchissement
  (événement rare qui fetch déjà la zone) + filet à l'écriture :
  `saveMapPosition` refuse une PREMIÈRE visite extérieure sans ✓ (le client
  passe maintenant son tz). Refus → pas annulé (bump), ligne jp
  `srs_gate_blocked` en boîte de dialogue (ui-strings).
- **Roadblock NPC** — `src/lib/roadblock.ts` (pur) : `findInterceptingNpc`
  (même géométrie de ligne de vue que les dresseurs — `SightSource` extrait
  de trainers.ts), `interceptionApproach` (tuiles jusqu'à l'adjacence, le
  long de l'axe de vue), `pushBackTile`. Séquence dans MapClient : ！ +
  mouvement gelé → le PNJ MARCHE vers le joueur (une tuile par STEP_MS,
  transition CSS sur le marqueur — pas de pathfinding, il suit son axe de
  vue, documenté) → `interactWithNpc` livre sa ligne en DialogueBox → à la
  fermeture, repoussée d'une case (marchabilité vérifiée) + le PNJ REGAGNE
  sa position d'origine (téléport assumé, documenté) → re-déclenche à chaque
  nouvelle entrée dans le cône. Un PNJ-leçon à cône passerait par le même
  chemin (la règle serveur renvoie sa ligne de blocage ; leçon disponible →
  Book Screen sans repoussée). `npcs.ts` transporte désormais
  facing/sight_range/sight_auto_result/repeats. **Aucun PNJ à
  `sight_auto_result: block` dans les 4 zones du jalon** — testé sur
  données synthétiques ET sur le vrai `rocket_grunt_azalea` (azalea-town,
  hors jalon) via getNpcsForZone (roadblock.test.ts).
- **Bandeau + noms de zones jp** — source UNIFIÉE :
  `content/zone-registry-names.json` (le registre `name {jp,en}` voulu par le
  PRD § Noms de lieux), servi par `getZoneRegistryNames()` (content.ts).
  `src/data/zone-labels.json` (issue 09) SUPPRIMÉ — il dupliquait un
  sous-ensemble du registre (2 divergences résolues au profit du contenu :
  ウバメの森, ３６ばんどうろ) ; menu/actions.ts bascule sur le loader.
  `ZoneListEntry` gagne `jp_name` (nom PROPRE — pilote le bandeau) et
  `jp_label` (nom propre → nom hérité de la ville de rattachement via
  `zoneSlugForMapNameOrParent`, nouveau dans zone-slug.ts → repli latin
  prettifié dev). MapClient : bandeau jp à chaque entrée de zone extérieure ;
  les intérieurs n'ont PAS de nom propre dans le contenu → pas de bandeau
  (comme HGSS), leur libellé hérité s'affiche au HUD. Le display_name
  FRANÇAIS du registre ROM n'est plus jamais affiché (HUD, sélecteur d'étage,
  tiroir dev, tooltips compris). `visited_zones[]` : vérifié, saveMapPosition
  (issue 02) fait bien l'append à la première entrée.
- **Parcours réel vérifié** — `src/lib/a1-traversal.test.ts` (géométrie +
  contenu + moteur réels, en mémoire) :
  1. BFS multi-zones sur le continuum extérieur (règles de MapClient : pas
     cardinal, franchissement de bord findOutdoorZoneAt, corniches à sens
     unique, warps = sorties pas des couloirs) : Bourg Geon → Route 29 →
     Ville Griotte → Route 30 continûment marchable, CHAQUE porte des 4
     zones atteignable à pied.
  2. Crawl du graphe de warps : les 16 intérieurs du jalon (7 Bourg Geon,
     gatehouse Route 29, 6 Ville Griotte, 2 Route 30 dont Mr. Pokémon)
     navigables — tuile d'arrivée marchable, TOUTES les sorties atteignables.
  3. Spawn onboarding (chambre 2F, 6,6) → escalier → 1F → porte → dehors.
  4. Gate sur jours simulés : jour 1 sans carte = monde ouvert ; leçons 1-2
     (24 cartes dues DEMAIN, jamais le jour même) ; course de l'œuf jouée
     sur les vrais dialogues (welcome→sent_by_elm, la #3 verrouillée avant
     egg_delivered, Mr. Pokémon→egg_received, retour→egg_delivered, leçons
     3-5, 60 cartes) ; jour 2 : 60 dues → Route 31 (extérieure, jamais
     visitée) BLOQUÉE, Route 29 (retour) et maison de Mr. Pokémon
     (intérieur) LIBRES ; session notée → gate ouvert.
- **Screenshots mal attribués → CollisionCanvas** : 15 intérieurs du jalon
  recyclaient l'art d'une AUTRE zone (extérieur de la ville, autre pièce —
  grille de collision différente, vérifié : le joueur marchait à travers des
  murs peints). `zones.ts` les sert désormais sans screenshot → le repli
  CollisionCanvas (fidèle à la collision) rend, liste dans
  MISATTRIBUTED_SCREENSHOTS + zones.test.ts. Elm's lab 1F garde son vrai art.
- **Suivi du compagnon** : planche `public/sprites/overworld/pikachu.png`
  trouvée (8×2 frames de 32 px — `public/sprites/followers/` visé par
  companions.json n'existe pas). Follower rendu sur la tuile que le joueur
  vient de quitter (transition au même STEP_MS), rangée 0 idle-animée — la
  SEULE rangée fiable des planches ROM (npc-sprites.ts) : pas de rangées
  directionnelles, assumé et noté pour la passe assets.
  `followerSpriteForCompanion` (npc-sprites.ts), branché par map/page.tsx
  sur `playerState.companion_id`. Compagnon sans planche → rien (null-safe).
- **Dresseurs tapables** : les marqueurs dresseurs (pointerEvents none)
  deviennent cliquables = Talk (même geste que les PNJ) — indispensable :
  Silver #1 est posé sur une tuile injoignable (voir plus bas).
- **Contrôles overlay — vérifiés conformes, 0 changement** : D-pad maintien
  = pas enchaînés cadence fixe (interval 55 ms borné par stepBusyUntil =
  STEP_MS) ; A/B toujours visibles (MapClient) ; X/Y rendus PAR DialogueBox
  donc seulement en dialogue ; START+SELECT centre bas discrets (StartMenu).
- **Écart z-order de l'issue 07 soldé** : les overlays DailyLoop (appel du
  mentor z-90, Pokégear z-85, badge z-80) passaient AU-DESSUS du combat
  (z-80) → abaissés à 76/78/79 : l'appel du mentor ne recouvre plus jamais
  un combat engagé.
- ui-strings : +1 chaîne (`srs_gate_blocked`). Aucun français visible joueur.

**Musique : différée (passe assets), comme prévu par l'issue.** Le mapping
n'est pas trivial-mécanique : `music_rom_seq` (SEQ_GS_T_WAKABA…) n'apparaît
nulle part dans `public/audio/ost/` — les fichiers sont des rips de disque
(« Disc 1/04 - New Bark Town.mp3 », noms EN avec numéros, espaces
incohérents). Piste posée pour la passe assets : matcher
`zone-registry-names.json † music_track.en` ↔ titres de fichiers (les 4 du
jalon existent : 04 New Bark Town, 09 Route 29, 13 Cherrygrove City, 20
Route 30) + composant de lecture (autoplay mobile = geste requis, boucle,
priorité combat, volumes de l'écran Settings encore grisé).

**Statut du parcours A1, étape par étape** (DB absente sur cette machine —
`DATABASE_URL` vide, connu depuis l'issue 02 : le parcours complet en
NAVIGATEUR n'est PAS exécutable ici, les migrations 002→007 ne sont pas
appliquées ; ce qui suit distingue prouvé-par-test vs QA téléphone) :
1. Onboarding → chambre : prouvé (issue 04 + spawn/escalier/sortie dans
   a1-traversal). QA : visuel.
2. Mom → labo → compagnon → leçons 1-2 : logique prouvée (walkthrough 02,
   DialogueBox 03, lessons 05, a1-traversal) ; MAIS voir « placements »
   ci-dessous — Elm se joue au tap, pas à l'approche.
3. Envoi chez Mr. Pokémon, Route 29 → Ville Griotte → Route 30 : géométrie
   prouvée (continuum + portes), bandeaux jp servis (zones.test) ; panneau
   Route 29 au tap. QA : bandeau/HUD à l'écran.
4. Mr. Pokémon (œuf) → retour → leçons 3-5 : prouvé (a1-traversal sur les
   vrais dialogues + règle leçon-ou-blocage).
5. Silver #1 : moteur prouvé (issue 07) ; **son embuscade est
   géométriquement IMPOSSIBLE** (voir placements) — jouable au tap sur son
   marqueur (fix de cette issue). QA : combat à l'écran.
6. Lendemain : appel d'Elm → session SRS → ✓ : logique prouvée (issue 06 +
   simulation 2 jours d'a1-traversal). QA : sur téléphone, avec DB.
7. Gate sans ✓ : prouvé (pur + action serveur + filet écriture) ; la
   repoussée à l'écran (bump + message) attend la QA.
8. `npm run check` vert, solveur vert : fait.

**Restes pour la QA / passes suivantes** :
- QA téléphone (paysage) : bandeau jp, CollisionCanvas des 15 intérieurs,
  follower Pikachu, séquence Roadblock (aucun cas réel avant azalea-town —
  tester au tiroir dev), gate (avancer l'horloge d'un jour), D-pad tactile.
- **Placements contenu défaillants** (listés, PAS corrigés — content/ gelé
  pour cette issue ; le test a1-traversal les épingle et FLANCHERA quand la
  passe contenu les corrigera) : `prof_elm_lab` (31,0) et
  `elm_assistant_new_bark` (29,1) sur tuiles solides injoignables — devraient
  vivre DANS le labo (les intérieurs ne servent aucun PNJ aujourd'hui :
  zone-slug rattache tout à la zone extérieure) ; `player_pc_new_bark`
  atteignable seulement depuis la tuile-porte du labo (devrait être dans la
  chambre) ; `sign_johto_entrance_route29` (2,2) injoignable ;
  `silver_apparition1_cherrygrove` (63,0) + `silver_card_cherrygrove` (63,1)
  dans l'eau/le solide — sa LIGNE DE VUE (sud, portée 4) est entièrement
  non-marchable, l'embuscade ne peut jamais se déclencher ; `mom_new_bark`
  (23,12) est posée SUR la tuile-porte de la maison du joueur (elle bloque
  l'entrée à pied — warp au tap seulement, et on respawn sur elle en
  sortant). Fond du problème à trancher à l'échelle : servir les PNJ dans
  les zones INTÉRIEURES (npcs.json ne connaît que les slugs extérieurs).
- **Assets manquants** : vrais screenshots des 15 intérieurs
  (MISATTRIBUTED_SCREENSHOTS, zones.ts) ; planches follower dédiées
  (rangées directionnelles) ; sprite de combat Silver (issue 07) ; OST
  (mapping + lecteur, ci-dessus) ; `content/dialogues/calls/prof_elm.json`
  (issue 06) ; `content/dialogues/shared/lesson-blocked.json` (issue 05).
- **Hors périmètre resté ouvert** : bascule des obstacles (blob MapProgress
  legacy users.map_progress + tiroir dev CS-Kanji) sur le modèle
  Condition/Effect — mentionnée par l'issue 02 comme cible possible de la
  10, mais hors du périmètre écrit de cette issue ; les obstacles réels
  (Sudowoodo…) sont tous hors jalon. À planifier au jalon 2.
- Séquence d'interception non couverte en .tsx (timers/animation MapClient) :
  la géométrie/l'ordre des étapes sont testés en pur, le rendu attend la QA
  (aucun Roadblock atteignable avant azalea-town de toute façon).
