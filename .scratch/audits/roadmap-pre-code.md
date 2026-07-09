# Feuille de route pré-code — 漢字の庭

Écrite le 2026-07-08, après la passe de vérification post-synthèse (findings-09 § 7).
Mise à jour le 2026-07-08 après l'audit 10 (charnières + grill) puis après le remplacement du
pivot stockage par Neon + Auth.js (même jour, hors périmètre des audits — voir
`docs/adr/0005-data-storage-neon-authjs.md`).

## Statut : Étape 1 et Étape 2 soldées 2026-07-09 (points 1-5 faits ; point 6 retiré, déplacé à l'Étape 4 — c'est du contenu, pas de la structure). Prochaine étape → Étape 3 (gabarits + tranche verticale).

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
   Rapport : `.scratch/audits/phone-registry-report.md`.
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
   `.scratch/audits/rom-trainer-roster-report.md`. Historique de la phase web (dépassée) :
   `.scratch/audits/generic-trainers-report.md`.
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

1. **Un fichier-exemple complet par type de contenu** : une leçon (le format JSON n'existe
   pas encore en exemple), un texte avec quiz + `answer_span`, une émission radio, un appel
   即時応答, une session keigo — chacun validé contre le schéma du PRD.
2. **Écrire LA tranche verticale : Bourg Geon → Ville Griotte** (zones 0-3 + l'ouverture de
   l'étape 1) : tous les dialogues jp/en, les ~7 leçons du bootstrap Elm, les 2-4 premiers textes, la
   quête d'accueil, Silver #1. Objectif : vérifier **en vrai** que la règle des 2 inconnus
   par dialogue tient, que les lectures inline s'écrivent vite, et mesurer le coût réel
   d'écriture d'une zone → extrapoler le budget des 83.
3. **Outillage de validation** (du script, pas du code produit — `scripts/` en a déjà) :
   linter de budget kanji (2 inconnus/dialogue, lectures inline présentes), vérificateur
   anti-deadlock (déjà spécifié), vérificateur d'ids croisés (quest/npc/zone/text refs),
   calculateur des corpus réels par CS (re-calage des seuils N au placement).
4. **Mockups des ~20 écrans** (papier/Excalidraw suffit) : carte, dialogue, les 9 modes de
   combat, écran-livre, session SRS, les 6 menus START, les 4 onglets Pokégear, fenêtre de
   lecture, radio, keigo. Ça ne code rien mais ça débusque les décisions d'écran oubliées —
   et ça fixe la typographie de l'étape 1.3.

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
