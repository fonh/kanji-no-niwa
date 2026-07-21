# Feuille de route pré-code — 漢字の庭

Écrite le 2026-07-08, après la passe de vérification post-synthèse (findings-09 § 7).
Mise à jour le 2026-07-08 après l'audit 10 (charnières + grill) puis après le remplacement du
pivot stockage par Neon + Auth.js (même jour, hors périmètre des audits — voir
`docs/adr/0005-data-storage-neon-authjs.md`).

## Statut : Étape 1 et Étape 2 soldées 2026-07-09 (points 1-5 faits ; point 6 retiré, déplacé à l'Étape 4 — c'est du contenu, pas de la structure). **Étape 3 intégralement soldée 2026-07-10** : gabarits (1), tranche verticale Bourg Geon → Route 36 avec 1er badge + 1er CS-Kanji (2, étendue), 4 scripts de validation tous verts (3), 26 mockups d'écran (4). Prochaine étape → Étape 4 (passe contenu industrielle, 83 zones) — ou combler au choix les restes notés en cours de route (Carnet de leçons ne distingue pas verrouillé/disponible ; choix du compagnon UI non modélisé au-delà de `companion_id`/`set_companion`).

Toutes les décisions de design sont prises et écrites dans le PRD. Le stockage/auth est déjà
migré et commité (Neon, Auth.js — code en place, rien à refaire). **Ce qui suit est le chemin
entre « PRD prêt » et « on peut coder le jeu »**, ordonné — chaque étape rend la suivante moins
risquée. Pour reprendre dans un nouveau terminal : commencer par Étape 2, point 1
(l'assignation kanji → zone) — c'est la colonne vertébrale dont tout le reste de l'étape 2 et
toute l'étape 3 dépendent.

---

## Étape 1 — Les surfaces jamais auditées — ✅ SOLDÉE 2026-07-08

Détail complet des 10 décisions (séquence d'ouverture, défaite/interruption, typographie,
chaînes système, accessibilité, cérémonies, fin de partie, flag FV-1) dans
`findings-10-charnieres.md`. Deux décisions plus larges émergées au grill, déjà écrites dans le
PRD : **suppression de Fukuda** (rôle de mentor repris par Elm puis Pr. Chen/Oak) et
**compagnon rouvert** (choix parmi 3 au lieu d'un Pikachu imposé).

**Stockage — traité séparément de l'audit 10, soldé aussi :** l'audit 10 avait d'abord proposé
un pivot vers du stockage local (IndexedDB + filet Google Drive) pour éviter la pause Supabase
après 7 jours d'inactivité. Remplacé le même jour par une décision différente : **Neon
(Postgres) + Auth.js**, une base cloud qui n'a pas ce problème de pause, gardant contenu et
progression dans un seul domicile, sans renoncer à une base unique. Détail et raisonnement :
`docs/adr/0005-data-storage-neon-authjs.md`. **Code déjà migré, revu (8 angles + corrections)
et commité** : `db/migrations/001_initial_schema.sql`, `src/lib/auth.ts`, `src/lib/db.ts`,
Server Actions par route (`src/app/*/actions.ts`).

## Étape 2 — Compléter la couche de données (mécanique, aucun talent d'écriture requis)

Tout est spécifié ; il faut produire les données. Scriptable en grande partie, relecture
humaine. **Ordre conseillé** — le point 1 conditionne tout le reste :

1. **✅ FAIT 2026-07-09 — L'assignation kanji → zone, colonne vertébrale de tout le contenu** :
   `scripts/build/build-kanji-zone-assignment.py` produit `content/kanji-zone-assignment.json`
   (ordre canonique des 2136 kanji, 0 deadlock de composants, partition chaînée sur les bornes
   hautes des 83 zones — Option A : la borne basse des fenêtres qui se chevauchent devient
   informative, pas de découpe). Idem **grammaire** :
   `scripts/build/build-grammar-zone-assignment.py` → `content/grammar-zone-assignment.json`
   (828 points Hanabira, tous assignés, réutilise la table déjà publiée « Repère kanji
   cumulé »). Rapport de relecture : `.scratch/audits/kanji-zone-assignment-report.md`.
   **3 zones à 0 kanji trouvées et acceptées telles quelles pour l'instant** (revue
   2026-07-09) : union-cave et route-40 (fenêtres non-monotones dans la table — de vrais trous
   à corriger zone par zone à l'étape 2 point 5, pas maintenant) ; le bloc des 5 salles Elite
   Four (870–900 partagée, seule Will récupère les 30 kanji) — cohérent avec le PRD (« la
   Ligue plate … ne porte aucune leçon obligatoire »), pas une anomalie.
2. **✅ FAIT 2026-07-09 — Registre des zones** : `content/zone-registry-names.json`, 83/83
   zones résolues (dépouillement Bulbapedia via deux passes de recherche parallèles) — champ
   `name {jp, en}` officiel et **mapping musique identité** (piste OST HGSS par zone, avec
   `note` documentant les thèmes partagés entre zones — comportement normal des OST Gen
   II/HGSS). Rapport : `.scratch/audits/zone-registry-names-report.md`. **19 zones à
   arbitrage** (8 fusions de zone_id multi-lieux, 11 éclatements d'un lieu en plusieurs
   zone_id) documentées dans le champ `note` de chaque entrée, acceptées telles quelles.
   **✅ Point ouvert résolu 2026-07-09 — musique remplacée par la donnée exacte ROM** :
   `scripts/build/build-rom-music-mapping.py` lit `src/data/map_headers.h`
   (`~/pokeheartgold`) — chaque zone gagne `music_rom_seq` (constante SEQ_ exacte) et
   `music_shared_with` (zones partageant réellement la même piste). 83/83 zones couvertes.
   Mont Gris : base/versants = « Olivine Lighthouse » (confirmé), **sommet = thème unique
   « silence total », pas « The Pokémon League »**. ~40 corrections trouvées au passage (la
   plupart des « thèmes partagés » Bulbapedia se révèlent être des variantes propres à chaque
   zone ; Route 40/41 partagent authentiquement le thème de la Safari Zone). Rapport :
   `.scratch/audits/rom-music-mapping-report.md`. **Limite connue** : les champs `note`
   existants ne sont pas rafraîchis automatiquement (certains mentionnent encore l'ancien
   regroupement Bulbapedia) — `music_rom_seq`/`music_shared_with` font foi en cas de
   divergence, nettoyage des `note` en petite passe si besoin, sans urgence.
3. **✅ FAIT 2026-07-09 — `story-beats.json` (Kanto + 11 zones réintégrées, flag FV-2 soldé)
   et `placements/` (FV-3 soldé)** : 34 nouvelles sections `### zone_id` ajoutées à
   `guidebook-adapted.md` (23 Kanto + 11 réintégrées), insérées dans l'ordre réel de parcours
   — corrige au passage l'ordre `order` des zones Mont Gris, qui suivaient à tort directement
   le Plateau Indigo. `story-beats.json` : 83/83 zones, 140 beats, 24 verrous.
   `placements/` : 83/83 fichiers (était 67) — 2 bugs de correspondance ROM corrigés dans
   `build-npc-placements.py` (`kanto-power-plant`, `mont-lune-route-3-4` : noms fr/en sans
   préfixe commun avec la carte ROM, alias ajoutés + miroir dans `src/lib/story-beats.ts`) et
   les zones à 0 PNJ (route-33, cerulean-cave, mt-silver-lower) émettent désormais un fichier
   vide au lieu d'être ignorées silencieusement. Effet de bord utile : les **sections
   npc-inventory des 11 zones réintégrées** du point 4 ci-dessous sont aussi faites (mêmes
   sources), 83/83 zones dans `npc-inventory.md`.
4. **Dénombrements guidebook** (décisions prises, comptes à faire).
   ~~Sections npc-inventory des 11 zones réintégrées~~ — faites au point 3 ci-dessus.
   **✅ FAIT 2026-07-09 — les donneurs de numéro de téléphone (registre fermé)** :
   `scripts/build/build-phone-registry.py` → `content/phone-registry.json`, 74 contacts
   (dépouillement Serebii, vérifié par un second fetch indépendant), croisés avec
   `npc-inventory.md` — 59/74 retrouvés directement, 6 absences structurelles attendues (gym
   leaders jamais en ligne de PNJ propre ; Day Care coupé du projet), **8 vrais dresseurs
   génériques manquants trouvés et ajoutés à npc-inventory.md** (Route 2 : Rob/Doug ; Route 12 :
   Kyle/Kyler ; Route 13 : Tim & Sue ; Route 14 : Torin ; Route 15 : Billy ; Route 17 : Reese).
   *(rapport de cette passe Serebii supprimé 2026-07-09 — remplacé en place par la passe ROM
   ci-dessous, dont le registre corrige 3 placements erronés que ce rapport tenait pour acquis ;
   voir la note de suppression en bas de fichier)*.
   **✅ FAIT 2026-07-09 — dresseurs génériques par route (fidélité stricte)**, en deux passes :
   une passe web (partielle, limitée par des tableaux Bulbapedia/StrategyWiki tronqués au
   fetch — 1/9 zones résolue) puis une **extraction directe de la décompilation ROM**
   `pret/pokeheartgold` (dispo en local, `~/pokeheartgold` — bien plus fiable : chaque objet de
   combat porte `std_trainer(TRAINER_XXX)`, résolu via `trainers.json`, 738 dresseurs).
   `scripts/build/build-rom-trainer-roster.py` → `content/rom-trainer-roster.json`.
   **Couverture complétée à 100% sur demande explicite** (« je veux qu'on trouve un moyen
   d'avoir les données exactes ») : la 1ʳᵉ extraction ne rattachait que 39/83 zones (les gyms et
   bâtiments à étages sans le nom de leur ville dans leur propre nom, plus la « seconde moitié »
   des zone_id fusionnant deux routes non contiguës, ex. route-11-12-13-diglett ne matchait que
   Route 11 — échouaient sur l'heuristique de préfixe). Une table de correspondance explicite
   (`DIRECT_MAP_TO_ZONE`, 44 entrées) résout tous les cas restants → **55/55 zones à dresseurs
   rattachées, 390/390 dresseurs de combat de la ROM intégrés à npc-inventory.md, 0 écart
   restant** (hors 2 collisions de prénom entre personnes distinctes, documentées). Corrections
   au passage : dresseurs manquants ajoutés (union-cave 8→12, route-21-kanto 5→12 noms,
   route-18 9→3 — la passe web précédente s'était trompée dans l'autre sens ; + tout le
   contenu combat du SS Aqua, de la Tour Radio/Tunnel de Doublonville, du QG Rocket d'Acajou,
   du Phare d'Oliville et de 6 gyms, absent jusqu'ici), **9 inversions entre zones voisines**
   corrigées (Route 30↔31, 32→33, 40↔41, 45→46, 35→national-park, 7→8-kanto, 16→17), et
   **7 coquilles OCR** corrigées (Marcus→Markus, Norman→Nelson, Ben→Beckett, Amy→Day,
   Sidney→Clarke, Aaron→Alton, May→Mimi). Rapport complet :
   `.scratch/audits/rom-trainer-roster-report.md`. *(Rapport de la phase web précédente
   supprimé 2026-07-09 — il s'auto-décrivait « ⚠️ Dépassé », gardé pour l'historique de la
   démarche uniquement, avec des écarts non résolus que cette passe ROM a tous fermés ; voir la
   note de suppression en bas de fichier.)*
   **✅ FAIT 2026-07-09 — registre téléphonique remplacé par la donnée ROM exacte** (sur
   demande explicite) : `scripts/build/build-rom-phone-registry.py` lit
   `files/tel/pmtel_book.json` (table binaire du jeu, déjà décodée dans la décompilation) →
   `content/phone-registry.json`, **75/75 contacts, 0 non rattaché**. Confirme indépendamment
   les corrections de placement déjà faites sur le roster de dresseurs (Joey/route-30,
   Wade/route-31, Anthony/route-33...) et trouve 4 corrections propres au registre
   (Ethan/Lyra : Day Care → leur maison à Bourg Geon ; Baoba : Route 39 → Safari Zone ; Pr.
   Oak : Route 30 → son labo à Bourg-Origine). Remplace le fichier sourcé Serebii de la passe
   précédente. Rapport : `.scratch/audits/rom-phone-registry-report.md`.
   **✅ FAIT 2026-07-09 — objets cachés par zone (bonus, hors périmètre initial)** :
   `scripts/build/build-rom-item-roster.py` → `content/rom-item-roster.json`, 257/257 objets
   sur 56/83 zones (même méthode : `scriptId` `std_itemball_<carte>_<item>`). **Dataset de
   référence brut, pas fusionné dans npc-inventory.md** — les deux sources se complètent
   (npc-inventory ne catalogue que les objets remis par PNJ/quête, jamais les objets au sol
   génériques). Utilisation prévue à la passe contenu (étape 4) ou pour un futur système de
   collecte de carte — pas d'action requise maintenant. Rapport :
   `.scratch/audits/rom-item-roster-report.md`.
5. **La colonne « Type assigné » de npc-inventory** : distribuer leçon / texte / combat sur
   les PNJ sourcés, zone par zone — dépend du point 1 (l'assignation kanji doit exister pour
   savoir ce qu'un PNJ-leçon enseigne). C'est la dernière décision « lourde » (elle fixe qui
   enseigne quoi, où) mais elle se prend zone par zone, pas d'un bloc.
   **✅ FAIT 2026-07-09 pour combat + leçon, reste texte/ambiant** : `combat` tagué sur 130
   lignes (regex sur le texte de rôle, 2 passes + 6 corrections manuelles de 師範/Gym Leaders
   qui n'étaient pas taguées — Lt. Surge, Sabrina, Erika, Janine, Blaine, Clair). Simplifications
   actées par l'utilisateur : groupement kanji **par ordre JLPT pur** (pas par radicaux),
   **taille de leçon libre** (l'ancienne règle 4-5 Johto/8-12 Kanto est supprimée), recatégorisation
   large des PNJ ambiants inutilisés en PNJ-leçon autorisée. `scripts/build/build-lessons-proposal.py`
   génère la proposition (`content/lessons-proposal.json`) : denylist des personnages
   récurrents/boss (mentors, rival, 8 Champions d'arène + Elite 4, cameos Steven/Maylene/Wake),
   exclusion des groupes fonctionnels non-dialoguants (obstacles, panneaux, dresseurs postés en
   mécanique de puzzle), exception bootstrap Pr. Elm (seul PNJ-leçon de Bourg Geon, 5 leçons),
   report en cascade du pool kanji des zones sans PNJ éligible vers la zone suivante mieux
   fournie (12 cas), cyclage round-robin d'un même PNJ sur plusieurs leçons consécutives
   (jusqu'à 14×, ex. Mont Argenté qui absorbe 4 zones), 1 point de grammaire max par leçon.
   **344 leçons sur 48 zones (sur 64 zones de croissance), 1950/1950 kanji couverts** — cohérent
   avec l'estimation PRD indépendante (280-370). `scripts/build/apply-lessons-to-npc-inventory.py`
   a fusionné les 344 leçons dans 117 lignes du tableau (un PNJ multi-leçons garde une seule
   ligne sourcée, cellule concaténée en `<br>` plutôt que lignes dupliquées, pour ne pas gonfler
   le document ni contredire la politique zéro-PNJ-inventé). Cross-check fait contre
   `japanese-books-mapping.md` (paliers/manuels) : rien d'incohérent trouvé ; ce document a été
   corrigé au passage (6 livres présents mais non recensés — Marugoto Élémentaire 1, 4 volumes
   Shin Kanzen Master — trouvés, seul Shin Kanzen Master N2 文法 manque encore réellement ;
   17/18 PDF Marugoto/Kanzen Master sont des scans sans OCR, exploitation différée à la passe
   contenu Étape 3-4). **✅ Colonne « Type assigné » intégralement remplie 2026-07-09** : dernier
   passage sur les 94 lignes encore vides avant de les taguer `ambiant` par défaut — a débusqué
   7 combats manqués par les passes regex précédentes (signal dans le champ NOM plutôt que RÔLE,
   ou vocabulaire non testé : Petrel déguisé ×2, Lance en double combat, Silver ×2, Red). **136
   combat / 117 leçon / 88 ambiant sur 341 lignes PNJ.** `texte` reste hors scope, différé
   jusqu'à la rédaction du contenu (décision utilisateur). Rapport :
   `.scratch/audits/lessons-proposal-report.md`.
6. ~~Migration `{jp, en}` des quêtes existantes (FV-4) et micro-lignes du Journal de quêtes.~~
   **Retiré de l'Étape 2, 2026-07-09** : c'est écrire du japonais calibré par palier (donc du
   contenu), pas de la structure — FV-4 et le PRD (§ table `quests`) disent tous deux « à la
   passe contenu », et l'utilisateur a confirmé le report plutôt qu'une migration de schéma à
   vide. Déplacé à l'Étape 4 (passe contenu industrielle), avec le reste de l'écriture jp/en.

## Étape 3 — Gabarits + tranche verticale (le test qui évite d'industrialiser dans le vide)

1. **✅ FAIT 2026-07-09 — Un fichier-exemple complet par type de contenu** : leçon, texte avec
   quiz + `answer_span`, émission radio, appel 即時応答, session keigo — chacun validé contre le
   schéma du PRD, contenu réel là où une source existait (kanji/grammaire/dresseur/PNJ sourcés) :
   `content/gabarits/` (`lesson-example.json` — new-bark-town leçon #4 d'Elm, 日月木気水火/N5-004 ;
   `text-example.json` — texte obligatoire route-36, remise CS-Kanji 砕, 5 types de question + 2
   `answer_span` ; `radio-show-example.json` — 1er épisode bibliothèque d'Oak, N5, 358 caractères ;
   `keigo-session-example.json` — Salon du keigo Vermeille, intention complète ami/commerçant/
   supérieur, piège 二重敬語) et `content/dialogues/calls/joey_route30.json` (即時応答, Youngster
   Joey, chemin réel prescrit par le PRD). **5 décisions de forme comblées** (schéma prescrit en
   prose sans JSON exact) : champs bilingues `{jp, en}` généralisés à tout texte joueur ; le
   mini-quiz de leçon en mode Sens lit le mot-clé anglais, jamais `jp_definition` (réservé au mode
   Sens gradué post-maîtrise) ; 即時応答 = entrée spéciale `kind: "instant_response"` dans
   `pages[]`, pas une structure parallèle ; Salon du keigo confirmé **sans nouvelle table** (récompense
   = `items.category: collectible` + `grant_item` idempotent, existant) ; `vocabulaire en contexte`
   sans `answer_span` (scaffolding non prévu pour ce type). Détail : `content/gabarits/README.md`.
2. **✅ FAIT 2026-07-09 — Écrire LA tranche verticale : Bourg Geon → Ville Griotte** (zones 0-3 :
   new-bark-town, route-29, cherrygrove-city, route-30). **17 fichiers de contenu** (11 dialogues
   PNJ/dresseurs jp/en, 4 fichiers `lessons/<zone>.json`, 1 quête `mystery_egg_errand` en plus de
   `cherrygrove_welcome` réutilisée, 2 textes) + **50 kanji dotés de `lesson_examples[]` réels**
   dans `src/data/kanji-content.json` (30 bootstrap Elm + 20 Route 30) + registre
   `content/map/npcs.json`/`trainers.json` peuplé pour les 4 zones (positions ROM-matched
   quand disponibles, `content/map/placements/`). Silver apparition #1 (Ville Griotte, combat
   sight_auto) et le premier badge-free challenge de dresseurs de route (Don/Joey/Mikey,
   Route 30) écrits. **Auto-testé** : `scripts/validate/lint-kanji-budget.py` (0 échec/27
   fichiers) et `scripts/validate/lint-cross-refs.py` (0 écart, nouveau ce point — voir point 3).
   **Textes : 2, pas 2-4** — seuls 2 candidats sourcés existent réellement pour ces 4 zones
   (`content/side-content-inventory.md` A7 le panneau d'entrée, A15 le mail de Lyra/Ethan) ;
   pas de 3ᵉ inventé pour combler le chiffre.
   **Décision de schéma prise à l'écriture** : `lessons.unlock_conditions` (`Condition[]`,
   optionnel) ajouté au schéma — nécessaire dès qu'un PNJ-leçon unique livre ses leçons en
   plusieurs temps narratifs (Elm : 2 avant/3 après la course chez Mr. Pokémon, sinon rien
   n'empêche d'enchaîner les 5 slots à la même visite) ; PRD.md § Leçons « Coupure aller-retour —
   mécanisme » et § Schéma Base de Données, `lessons`.
   **Trouvaille réelle (pas un bug, une conséquence du système déjà accepté)** : le pool kanji
   de route-29 (30→50) n'est en pratique **pas** enseigné sur le chemin critique — sa seule
   PNJ-leçon (Tuscany) est calendaire (mardi + post-badge Mauville), donc absente tant que le
   joueur n'a pas déjà quitté la zone depuis longtemps. La croissance réelle du joueur passe par
   Ville Griotte (10 kanji, Guide Gent + Vendeuse, toujours disponibles) puis Route 30 (20 kanji) —
   couvert par la tolérance de chemin déjà actée au PRD (§ Leçons), documenté dans
   `content/npc-inventory.md` § route-29 pour que la passe de contenu suivante ne la redécouvre pas.
   **Simplifications assumées, non résolues ici** (hors scope de ce point, notées pour ne rien
   perdre) : le choix du compagnon parmi 3 (mécanique UI, pas de champ `Condition`/`Effect` connu
   pour l'exprimer) ; l'identité Lyra/Ethan miroir du genre du joueur (aucune donnée de
   sélection genre/nom modélisée) ; les appels-panique d'Elm pendant le cambriolage (canal
   `content/dialogues/mentors/elm/`, jamais scaffoldé — remplacé ici par la révélation en personne
   de Mom au retour, qui couvre le même beat narratif).
   **Coût mesuré** : ~2h de travail agent pour 4 zones (17 fichiers + 50 exemples de kanji +
   2 scripts de linter + 1 décision de schéma) — largement dominé par la recherche de source
   (placements, npc-inventory, guidebook) plutôt que par l'écriture elle-même une fois la source
   en main ; la règle des 2 inconnus/dialogue n'a jamais forcé de réécriture a posteriori (grâce au
   linter, pas à l'attention manuelle) ; les lectures inline s'écrivent vite une fois le réflexe pris.

   **Passe de revue joueur (2026-07-09, demandée par l'utilisateur — « analyse en tant que game
   designer, est-ce que tout marchera ? »)** : relecture beat par beat en croisant chaque ligne
   contre le PRD plutôt que contre ma propre mémoire. **1 vraie erreur chiffrée trouvée et
   corrigée** : `battle_length` de Silver #1 était 5 (invention sans vérification, au mauvais
   endroit — le fichier dialogue au lieu de `map_trainers`) au lieu de **12**, la valeur exacte de
   la table PRD § Système de Combat (courbe 12→15→18→cameo→22→24 sur ses 6 rencontres). **2 vrais
   trous comblés** : (1) `companion_id` était référencé comme « persisté » au § Compagnon depuis
   l'audit 10 sans exister dans aucune table — ajouté à `user_map_state` + nouvel `Effect.set_companion`
   + `content/companions.json` (Pikachu confirmé, 2 slots `tbd_2`/`tbd_3` intentionnellement non
   tranchés, réservés à l'Étape 5 point 5 — vérification du dump d'assets follower avant de choisir,
   pas d'invention à l'aveugle) + le choix est maintenant une vraie entrée `kind: "companion_choice"`
   dans `prof_elm_lab.json` ; (2) la révélation du nom « Silver » (source : guidebook, carte de
   dresseur tombée après le combat) n'existait dans aucun fichier — ajoutée en objet trouvé
   (`silver_card_cherrygrove`, gated sur la défaite de Silver), pas en PNJ inventé ni en `texts`
   (une révélation d'une phrase ne justifie pas un quiz de compréhension). **1 trou identifié, non
   corrigé — noté pour la suite** : `getLessonBook` (Carnet de leçons) n'a aucun moyen d'afficher
   qu'une leçon « en tête de file » est en fait verrouillée par `unlock_conditions` — un joueur qui
   checke son menu pendant la course chez Mr. Pokémon verrait « prochaine leçon : Elm » comme si
   retourner au labo la donnait tout de suite. Conséquence directe de l'extension de schéma de ce
   point — hors scope UI de la tranche verticale, à traiter à l'implémentation de l'écran.
   Auto-testé de nouveau après corrections : 0 échec sur 28 fichiers (linter budget) et sur les
   ids croisés.
3. **Outillage de validation** (du script, pas du code produit — `scripts/` en a déjà) :
   **✅ FAIT 2026-07-09 (partiel) — linter de budget kanji** :
   `scripts/validate/lint-kanji-budget.py`. Fait avant le point 2 (inversion volontaire de
   l'ordre de cette roadmap) — les deux erreurs trouvées à la main en écrivant les gabarits du
   point 1 (`content/gabarits/README.md` § Vérification post-écriture) auraient été attrapées
   instantanément par un linter plutôt qu'un audit manuel. Vérifie contre
   `content/kanji-zone-assignment.json` : (a) lecture inline présente sur chaque kanji
   (ADR-0002) ; (b) budget dialogue ≤ 2 kanji hors studiedSet/fichier (`name` exempté du
   compte, pas de la règle de lecture) ; (c) budget texte proportionnel ~2/100 caractères,
   plafonné à 10 (`jp_text` + `questions[]` combinés) ; (d) `kanji.lesson_examples[]` : zéro
   kanji hors le kanji de l'entrée. Scanne par défaut `content/dialogues/{npcs,trainers,calls}`
   et les gabarits ; testé contre une fixture cassée (6 échecs détectés, code de sortie 1) et
   contre les 5 fichiers réels existants (0 échec) — puis contre toute la tranche verticale du
   point 2 (27 fichiers, 0 échec).
   **✅ FAIT 2026-07-09 — vérificateur d'ids croisés (première version)** :
   `scripts/validate/lint-cross-refs.py`, écrit une fois la tranche verticale disponible pour lui
   donner de la matière réelle. Vérifie : `dialogue_ref` (npcs/trainers.json) → fichier existant ;
   `npc_ref`/`trainer_ref` (lessons/*.json) → id déclaré dans npcs/trainers.json ; `quest_id`/
   `step_id` référencés dans un dialogue → existent bien dans `content/quests/<quest_id>.json` ;
   `zone_id` → existe dans `kanji-zone-assignment.json`. 0 écart sur la tranche verticale.
   **Ne couvre pas encore** : `item_ids` (pas de table `items` peuplée à ce stade — tous les
   `grant_item` de ce point restent non vérifiés, ex. `pokegear`/`mystery_egg`/`pokedex`),
   `found_object_ref`/`text_id` (2 textes seulement, pas encore assez de volume pour un vrai
   registre) — à étendre au fil de la passe contenu plutôt que d'anticiper des tables vides.
   **✅ FAIT 2026-07-10 — tranche verticale étendue jusqu'au 1er CS-Kanji, puis les 2 derniers
   outils, avec de vraies données à vérifier** (« on étend la passe 3 ») : chemin critique
   prolongé Route 30 → **Route 31 → Mauville (Gym 1 Falkner complet : 2 門弟 + 師範 format
   examen 試練・空の道) → Tour Grospignon (6 sages + Ancien Li + cameo Silver) → Route 36**
   (remise du CS 砕, seuil N=6, le plus bas des 8) — **28 nouveaux fichiers** (dialogues,
   4 fichiers `lessons/<zone>.json`, 2 nouveaux textes, `map/obstacles.json` créé avec 2 entrées
   dont la 1ère roche fissurée 砕 du jeu). **2 nouveaux trous de schéma trouvés et comblés en
   écrivant Falkner** (même famille que `companion_id` du point 2) : `Effect.grant_badge`
   (`user_map_state.badges[]` était « écrit à la cérémonie du 印 » sans aucun `Effect` pour
   l'écrire) et l'exemption `exam_name` du budget kanji (試練・空の道 est un titre sourcé fixe,
   même statut que les noms de personnages). **Trouvaille de fond confirmée deux fois** : le
   pool kanji de Route 36 (cumulative_start=330, `order` story-beats.json=18) est calé sur sa
   visite *tardive* dans HGSS (résolution Simularbre), pas sur sa visite *précoce* réelle (juste
   après Falkner, remise du CS) — même zone_id, deux moments narratifs, un seul pool possible
   dans le modèle actuel ; `content/texts/route-36/cs_kudakeru.json` et
   `scripts/validate/calc-cs-corpus.py` documentent chacun la conséquence pratique.
   `scripts/validate/check-cs-kanji-deadlock.py` : vérifie qu'aucun donneur de CS n'est
   lui-même derrière un obstacle exigeant un CS (0 deadlock trouvé sur 砕 ; testé contre une
   fixture cassée injectée puis restaurée, détecté correctement). `scripts/validate/calc-cs-corpus.py` :
   calcule le corpus réel atteignable sans CS avant 砕 — **3 textes contre une cible de 10-12**
   pour que N=6 représente ~50-60% du corpus (règle de calibration) — écart honnête, attendu
   avant l'Étape 4, pas un bug de l'outil. Ordre narratif réel encodé à la main
   (`NARRATIVE_ORDER`) plutôt que lu depuis `story-beats.json` § order, justement à cause de la
   trouvaille Route 36 ci-dessus. **4 scripts de validation au total désormais dans
   `scripts/validate/`, tous verts sur 55 fichiers de contenu.**
4. **✅ FAIT 2026-07-09 — Mockups des écrans** (HTML/CSS interactif au lieu de papier/Excalidraw) :
   **26 écrans** (le compte réel derrière le « ~20 » de l'estimation — 9 modes de combat +
   6 slots START + 4 onglets Pokégear comptés séparément) : carte, dialogue, les 9 modes de
   combat, écran-livre, session SRS, les 6 menus START, les 4 onglets Pokégear, fenêtre de
   lecture, émission radio, Salon du keigo. Publié en Artifact, navigation par barre latérale,
   chaque écran annoté avec les décisions PRD qu'il matérialise. **Peuplé avec le vrai contenu
   déjà écrit** aux points 1-2 (kanji 日/火, N5-004, `mystery_egg_errand`, le panneau Route 29,
   l'émission d'Oak, le Salon du keigo) plutôt que du texte inventé. **2 limites assumées,
   documentées dans l'artifact lui-même** : (a) `DotGothic16`/`BIZ UDGothic` non chargeables
   dans un artifact auto-contenu (pas de CDN) — polices système en substitut, à corriger à
   l'implémentation ; (b) le trou du Carnet de leçons trouvé à la revue du point 2 (aucun moyen
   d'afficher qu'une leçon en tête de file est verrouillée par `unlock_conditions`) est rendu
   visible sur l'écran レッスン lui-même plutôt que caché.

## Étape 4 — Passe contenu industrielle

Zone par zone, dans l'ordre de la table de calibration (83 zones), avec l'outillage de
l'étape 3 en CI : dialogues, leçons (**344 assignées** — voir Étape 2 point 5 pour la
répartition zone par zone, `content/lessons-proposal.json` et `npc-inventory.md`), placement des
textes secondaires (**~85-115**, sélection des sources réelles + vetting 12bis), scripts radio,
36 lettres des mentors (Elm/Oak), Carnet des compteurs, **migration `{jp, en}` des quêtes (FV-4,
retirée de l'Étape 2)** : `content/quests/*.json` (`name`, `steps[].label`), un seul fichier
existant à ce jour (`cherrygrove_welcome.json`) mais le format se généralise à mesure que
d'autres quêtes sont écrites. Les seuils N des 8
CS-Kanji sont re-calculés au fil du placement réel (valeurs actuelles de calibration :
砕 6 · 切 12 · 水 20 · 飛 26 · 力 29 · 渦 32 · 滝 35 · 登 60). **C'est seulement à la fin
de l'étape 3 qu'on sait combien de temps celle-ci prendra** — c'est tout l'intérêt de la
tranche verticale.

### Lot 0 (2026-07-21) — solder l'ardoise pré-industrialisation

Demande utilisateur : « finir tout le contenu + tout ce qu'il faut régler avant de coder »,
en une passe continue sans point de contrôle par zone (le point 3 des décisions d'exécution
du 2026-07-17 est levé par cette demande). Trois décisions utilisateur prises via
questionnaire, puis appliquées :

1. **Les 13 modes de combat additionnels intégrés au PRD** — famille C (lecture M19-M23)
   **adoptée**, passages adaptés des livres (vetting 12bis, ≤200字 route / ≤300字 boss) ;
   M11/M12 fusionnés « Relations » ; M15 QCM + variante appariement ; M13/M14 différés 2ᵉ
   vague. PRD : nouvelle section § Les 13 modes additionnels, profils de poids remplacés
   (resomment à 100 sur 22 modes), sections d'examen étendues, gardes d'indisponibilité,
   table `reading_snippets`, champs `words`/`grammar`, étape 17 du pipeline,
   `selectQuestionMode` re-signé. `.scratch/combat-modes-spec-proposal.md` marqué intégré.
   **Conséquence contenu : le pool `reading_snippets` s'écrit pendant cette passe.**
2. **Audit New Bark soldé** (`.scratch/audits/new-bark-town-audit-2026-07-17.md`) — G2
   tranché « gater via unlock_conditions » : étape de quête `egg_delivered` ajoutée à
   `mystery_egg_errand` (avancée par `welcome_back` d'Elm, nouvel état terminal `egg_care`),
   leçons 3-5 d'Elm gated dessus ; G5 aide d'Elm repositionnée dans le labo (29,1) ;
   J2/J6 exemples 円/女 réécrits ; J3/J4 7 seconds `lesson_examples` on'yomi ajoutés
   (一・二・八・日・月・生・気). Linters verts (110 fichiers).
3. **Rythme de commit acté : un commit + push par lot de zones.**

### Lot 1 (2026-07-10) — Ruines Arcaniques → Route 32 → Union Cave → Route 33 → Écorcia
(Gym 2 Bugsy) → Puits Ramoloss (Exécutif Proton, Silver #2)

**6 zones, ~60 nouveaux fichiers** (dialogues, 3 `lessons/<zone>.json`, 2 textes, registre) +
**70 kanji dotés de vrais `lesson_examples[]`** (route-32 20 + ruins-of-alph 20 + azalea-town 30,
dont le pool cascadé de route-33). Continuité de l'ordre narratif réel commencé au point 2
(pas l'ordre abstrait de la table de calibration — `NARRATIVE_ORDER` de
`calc-cs-corpus.py` étendu en conséquence). Auto-testé en continu : 104 fichiers, 0 échec sur
les 4 outils.

**2 vraies erreurs trouvées et corrigées en écrivant ce lot** — même famille que les fautes du
point 2 (Pokémon n'apparaissent jamais comme compagnons de combat, règle #1 du guidebook) :
deux dresseurs (Youngster Gordon, Youngster Joey) avaient des lignes de dialogue nommant leur
Pokémon possédé (« mon Wooper », « mon Rattata ») — réécrites en flaveur générique. Trouvées en
relisant mon propre texte plutôt que par un outil (aucun linter ne les aurait attrapées) — un
angle mort réel de l'outillage actuel, noté pour un futur `lint-no-pokemon-species.py` si le
volume le justifie.

**1 fausse alerte comprise et corrigée** : une vérification manuelle a d'abord signalé
`azalea-town.json` comme couvrant 30 kanji au lieu des 15 de son propre pool — pas un bug, la
cascade documentée à l'Étape 2 point 5 (route-33 n'a aucun PNJ-leçon, son pool de 15 kanji +
grammaire est absorbé par les PNJ-leçon d'Écorcia). Confirmé en croisant contre
`content/lessons-proposal.json`, noté dans le fichier pour ne pas re-déclencher l'alarme.

**1 ajustement d'outillage** : `check-cs-kanji-deadlock.py` faisait échouer la build sur tout
obstacle gaté par un CS pas encore remis nulle part — normal la plupart du temps pendant
l'Étape 4 (la majorité des 8 CS n'ont pas encore leur zone écrite). Downgradé en `WARN`
(non-bloquant) ; un vrai deadlock reste détecté (donneur existant mais lui-même bloqué).

**Simplifications assumées** : Charcoal Man (Écorcia) reste dans son état d'attente — la
remise du Charbon dépend de Forêt Secte, hors périmètre de ce lot. Kurt (fabrication
Apricorn → Boule, cycle 24h) réduit à une ligne d'accueil, le mécanisme de fournée n'est pas
détaillé ici. Le 4ᵉ point d'entrée du puzzle d'Union Cave (« aucun objet → Coupe → Union Cave →
Force ») reste ambigu dans la source — seuls les 3 points clairs sont notés, le 4ᵉ à
clarifier plus tard. `content/map/obstacles.json` gagne `force_rock_route32` (CS 力, pas
encore remis).

### Lot 2 (2026-07-21) — Route 34 → Doublonville (Gym 3 Whitney) → Route 35 → Parc National

**4 zones, ~50 nouveaux fichiers** (dialogues, 2 `lessons/<zone>.json`, 2 overlays grammaire,
2 quêtes/scripts, registres) + **90 kanji dotés de `lesson_examples[]`** (goldenrod 50 +
national-park 40, scripts `add-goldenrod-` / `add-national-park-lesson-examples.py`) +
**16 leçons** (9 N4-086→094 + 7 N3-001→007) + **32 exemples d'overlay grammaire**. Détail
zone par zone : `.scratch/etape4-progress.md` § Journal. 5 linters verts (161 fichiers).

**Réconciliation documentée (gardiennes de Whitney)** : la ligne npc-inventory « leçon #1 »
couvre les 4 gardiennes mais le PRD § Gyms exige des 門弟 en combat — répartition :
Victoria + Samantha = 門弟 (13q), Carrie = npc_ref leçon #1, Cathy = ambiante. Larmes de
Whitney fidèles HGSS (badge remis en lui reparlant, état give_badge sur npc_cleared).

**Adaptations règle #1** : quête courrier de la grille nord (l'« oiseau à capturer » devient
une approche furtive, technique héritée de Forêt Secte) ; cadeau de Bill (l'Eevee-analogue
devient une poupée de collection — companion_id est unique et inchangeable, PRD § Compagnon).

**Différé au beat narratif Rocket (post-Mahogany)** : tout l'arc Tour Radio/Tunnel de
Doublonville (14 grunts ROM, Petrel ×2, Proton, Ariana, Archer, Silver #5, Burglars, vrai
Directeur, Kuni, sbire-déguisement) — même zone_id, moment narratif tardif, sera écrit à sa
place dans l'ordre de visite. **Différé à l'implémentation** : disciplines Pokéathlon (I-5),
Concours du Parc (I-6), quiz interactif de la réceptionniste radio, boucle Buena (I-13) —
designs adoptés, barèmes/mécaniques hors périmètre contenu.

**Correctif d'outillage** : `calc-cs-corpus.py` — donneur de cs_kiru (charcoal_man_azalea)
manquant depuis le lot Ilex, ajouté ; NARRATIVE_ORDER étendu (+4 zones).

### Audit qualité pré-Lot 2 (2026-07-10) — trou trouvé et comblé

Revue demandée par l'utilisateur avant de lancer le Lot 2 (« regarde si le contenu déjà
écrit correspond aux attentes du projet »). Sourcing/fidélité/règle #1 tous **PASS**
(cross-check complet contre `npc-inventory.md`, table Silver, format examen boss,
mécaniques compagnon, fidélité guidebook — rien à corriger). **1 vrai trou trouvé, hors
portée des 4 linters** : sur les 235 kanji réellement assignés à des leçons écrites
(`content/lessons/*.json`), **115 (6 zones : cherrygrove-city, route-29, route-31,
route-36, sprout-tower, violet-city) n'avaient aucun `lesson_examples[]`** dans
`src/data/kanji-content.json` — la page droite du Book Screen (« usage : 1-2 phrases »,
`CONTEXT.md` § Book Screen) était vide pour eux. `lint-kanji-budget.py` ne l'attrapait
pas : son check ne fait que boucler sur `lesson_examples` quand la liste existe déjà,
jamais vérifié sa présence. Comblé par
`scripts/build/add-etape4-lot2prep-lesson-examples.py` : phrases ancrées dans le corpus
Tatoeba déjà importé (`scripts/sources/tatoeba_jpn_eng.json`, filtré aux phrases
n'utilisant que le kanji cible) quand une correspondance courte existait (~71/115),
composées à la main dans le même registre que les 120 déjà écrites sinon (kanji rares
N2 sans usage isolé naturel — 剖/寡/屯/候 — phrase-étiquette minimale, seule option
honnête). Les PDF de `scripts/sources/japanse books/` restent bloqués par l'absence
d'OCR (`content/japanese-books-mapping.md`) et de toute façon mal adaptés à ce champ
précis (règle zéro-autre-kanji stricte, y compris kanji déjà étudiés — une phrase de
manuel authentique la respecte rarement). **235/235 kanji des leçons écrites ont
maintenant un exemple réel**, 4 linters toujours verts (104 fichiers).

**Suite 2026-07-10 — la règle « zéro autre kanji » de `lesson_examples[]` elle-même abandonnée.**
En discutant des options pour les ~5 kanji rares tombés en phrase-étiquette (工/候/寡/屯/剖,
sans usage isolé naturel — voir ci-dessus), l'utilisateur a posé la bonne question : un kanji qui
apparaît juste dans l'exemple d'un *autre* kanji a-t-il un effet mécanique ? Réponse trouvée dans
le PRD lui-même (`PRD.md` § Timing des nouvelles cartes, ligne ~411) : **« un kanji est "étudié"
dès que sa propre leçon est complétée »** — son apparition incidente ailleurs n'incrémente jamais
`studiedSet`, ne crée aucune carte SRS, ne débloque rien. Donc la contrainte « zéro autre kanji »
protégeait contre un risque qui n'existe pas mécaniquement ; seule la lecture inline (ADR-0002,
déjà universelle) importe. **Règle changée** : `lint_lesson_examples` (`lint-kanji-budget.py`) ne
vérifie plus que la lecture inline sur toute la phrase (plus le zéro-autre-kanji) ; `PRD.md`
ligne 354 mis à jour en conséquence ; les 5 phrases-étiquettes réécrites en usages réels
(工 → 大工「だいく」, 候 → 気候「きこう」, 寡 → 寡黙「かもく」, 屯 → 屯所「とんしょ」,
剖 → 解剖「かいぼう」). `content/content-writing-guide.md` § 4 mis à jour : les livres
(`render-book-pages.py`) redeviennent une source directe pour ce champ aussi, plus seulement pour
les situations/grammaire/textes. 4 linters toujours verts après le changement (104 fichiers).

**Second constat, non corrigé (dette notée)** : sur les 5 textes secondaires écrits,
4 réutilisent exactement les 3 mêmes types de question (`idee_generale`/
`detail_factuel`/`vocabulaire_contexte`) sans jamais `answer_span`/`inference`/
`resolution_reference` — la panoplie du gabarit `text-example.json` est sous-exploitée.
Pas bloquant à ce volume (5 textes), à surveiller quand le volume montera vers les
~85-115 prévus.

## Étape 5 — Petits restes techniques épars

Ne bloquent aucune étape ci-dessus ; à faire quand on y passe (souvent en même temps que
l'étape 2 ou 4, zone par zone), listés ici pour ne rien perdre :

1. **FV-5** (`findings-09-synthese.md` § 7) : fil Steven, étape 1 — « déclenche une
   rencontre légendaire ailleurs » est un fait source sans adaptation définie ; une
   simple ligne de dialogue suffit, à écrire à la passe contenu de la zone concernée.
2. **`scripts/build/generate-etymology.py`** : le prompt du batch IA étymologie/
   mnémotechnique est encore en français (finding 06-B3) — à traduire/adapter avant le
   prochain run de génération.
3. **3 kanji sans audio** (finding 06-B3) — identifier lesquels, combler via le même
   pipeline VOICEVOX que le reste.
4. **Tile-authoring** : les 16 intérieurs de gym + les zones réintégrées (Lavender,
   Union Cave, Route 43, Îles Tourbillon, Safari, Routes 46/5/8/22/47/48, Cliff Cave,
   Puits Ramoloss, intérieurs Tour Radio/QG Rocket/Tour Jo…) n'ont pas encore de tiles
   produites — inventaire de production, pas un chiffrage.
5. **Sprites follower des 3 compagnons** (Pikachu + 2 autres à déterminer — compagnon cosmétique,
   choix rouvert 2026-07-08, audit 10) — vérifier qu'une planche exploitable existe pour chacun
   dans le dump d'assets HGSS, sinon les produire ; trancher les 2 compagnons additionnels.
6. **Résolution du mapping musique « identité »** : chaque zone HGSS garde sa piste
   d'origine (règle posée à la synthèse) — reste à résoudre piste-par-fichier-asset à
   la passe assets ; seuls les arbitrages (zones sans équivalent direct) restent en
   table dans `content/guidebook-adapted.md` § Musique.
7. **Pool audio Disposition** : ~600 phrases (~120/palier), ~25-35 Mo opus — batch
   VOICEVOX à lancer, chargement par palier à implémenter côté build.

## Puis : le code

Avec tout ce qui précède, le développement démarre avec un PRD stable, des formats de données
éprouvés par du vrai contenu, des mockups, et une CI de contenu déjà en place. Premier
jalon de code naturel : le moteur de carte + dialogue sur la tranche verticale existante.

---

*Hors v1, définitivement, et rien d'autre : Battle Frontier, fonction de transfert du Pal
Park (décision F-A, synthèse — Pal Park reste un intérieur réel navigable, seule la
fonction de transfert est coupée).*

---

## Nettoyage de documents dépassés (2026-07-09)

Deux rapports supprimés — leurs données étaient factuellement remplacées par une passe
ultérieure, pas juste incomplètes, et risquaient d'induire en erreur un lecteur sans le contexte
du fil ci-dessus :

- **`.scratch/audits/generic-trainers-report.md`** — la phase de recherche web sur les dresseurs
  génériques, qui s'auto-décrivait déjà « ⚠️ Dépassé » et listait des écarts non résolus (Route
  18, Route 19/20…) ; tous fermés par la passe d'extraction ROM (`rom-trainer-roster-report.md`,
  toujours en place).
- **`.scratch/audits/phone-registry-report.md`** — le registre téléphonique sourcé Serebii (74
  contacts) ; remplacé par le registre exact extrait de la ROM (`rom-phone-registry-report.md`,
  75 contacts), qui corrige 3 placements que ce rapport tenait pour acquis (Ethan/Lyra, Baoba,
  Pr. Oak — détail au point 4 de l'Étape 2 ci-dessus).

Les fichiers `findings-0N-*.md`/`prompt-0N-*.md` de l'audit structuré (01-10) ne sont **pas**
concernés par ce nettoyage : ce sont les cibles citées par numéro dans `PRD.md`/`CONTEXT.md`/les
ADR (« corrigé 2026-07-06, audit 04, finding 04-A3 ») — les supprimer casserait cette
traçabilité, contrairement aux deux rapports ci-dessus qui n'étaient référencés que par cette
roadmap.
