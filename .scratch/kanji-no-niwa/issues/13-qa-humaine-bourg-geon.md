# 13 — QA humaine jalon 1 : bugs relevés en jouant Bourg Geon

Status: ready-for-agent
Date : 2026-08-03
Origine : phase 6 (QA humaine), premier passage sur le parcours A1 après mise
en base Neon.

---

## RÉSUMÉ DE SESSION (2026-08-03) — à lire en premier pour reprendre

**Contexte** : première vraie session de QA humaine du jalon 1 (Bourg Geon
→ Route 30). Tout le contenu (sprites, cartes, placements PNJ) vient de
pipelines d'extraction ROM automatiques jamais vérifiés à l'œil avant
aujourd'hui — cette session a trouvé et corrigé une longue série de bugs
visuels/de contenu, tous sans rapport avec le moteur de jeu (logique,
SRS, dialogues, sécurité serveur), qui reste solide (550 tests verts).

### Corrigé et vérifié cette session
- **Sprites du joueur** (Ethan + Lyra) : planche 4 directions refaite à
  partir d'une source externe vérifiée (spriters-resource + PokemonHnS),
  l'ancienne extraction ROM n'avait qu'une seule rangée fiable sur quatre.
- **Collision des intérieurs** : 336/386 zones du jeu (pas que Bourg Geon)
  avaient une grille de collision bien plus grande que la vraie pièce →
  joueur coincé visuellement dans un coin. Corrigé au niveau du générateur
  (`build-zone-registry.py`), s'applique à tout le jeu.
- **Mauvaises captures d'écran** : 171 zones avaient la mauvaise image
  (bug de départage dans le script de matching). Corrigé, s'applique à
  tout le jeu.
- **Porte bloquée par un PNJ** : un objet ROM posé exactement sur une
  tuile de porte (31 zones concernées dans tout le jeu) empêchait de
  sortir. Corrigé au niveau moteur (une porte est toujours franchissable).
- **PNJ dans les arbres** (Silver) : position corrigée, jamais issue d'un
  vrai repère ROM à l'origine.
- **Doublons de PNJ** (Elm, Silver) : corrigés — un PNJ curaté avec sprite
  propre et l'objet de décor ROM qui représente le même personnage
  s'affichaient tous les deux.
- **Indicateurs visuels** (ronds de couleur « je peux parler », carrés de
  porte) : retirés complètement sur demande explicite.
- **4 PNJ de Bourg Geon** (Elm, Silver, Maman, Policier) ont maintenant un
  vrai sprite 4-directions (source : PokemonHnS, style GBA — écart de
  style assumé et documenté, voir section dédiée plus bas) au lieu d'un
  point neutre ou d'un sprite ROM à une seule direction fiable.
- **2ᵉ étage de maison qui affichait le rez-de-chaussée** : corrigé
  (repli générique différencié par étage).
- **`/dashboard`** (404 sur redirection post-connexion) : corrigé.
- **Cache navigateur** sur les sprites : versionnement `?v=N` ajouté pour
  que les futurs remplacements d'assets soient vus immédiatement.

### Investigué en profondeur, conclusion négative (ne pas retenter sans nouvelle piste)
- **Rendu 3D des intérieurs depuis la ROM** : pipeline complet construit
  et fonctionnel (ROM → NSBMD → glTF via `apicula` → rendu via
  `pyrender`) — **prouvé pour les extérieurs** (rendu du labo d'Elm vu de
  la ville, reconnaissable). Pour les **intérieurs**, confirmé
  définitivement impossible par ce chemin : la matrice ROM de la carte
  (outil `uxie`, voir ci-dessous) montre qu'un seul modèle 3D existe par
  bâtiment (`models: (244,)`, matrice 1×1) — le même sert extérieur ET
  intérieur, et ce modèle ne contient aucun mobilier ni détail de pièce,
  vérifié caméra à l'intérieur du volume, backface culling désactivé.
  HGSS doit afficher les intérieurs via un système différent (probablement
  des assets 2D), pas cette géométrie 3D. **Ne pas re-suivre cette piste
  pour les intérieurs sans nouvelle information.**
- **Mouvement gauche/droite cassé** (signalé par l'utilisateur) : testé en
  profondeur (D-pad, clavier, appuis répétés espacés dans le temps,
  comparé symétriquement à haut/bas) — non reproduit. Un `overflow:
  hidden` potentiellement en cause a été retiré par précaution. **Reste
  ouvert** — a besoin d'une observation plus précise de l'utilisateur
  (quelle zone, immobile ou clignote/disparaît, clavier ou tactile) pour
  avancer.
- **Arbres traversables** (signalé par l'utilisateur) : vérifié sur
  Bourg Geon extérieur — collision et image sont alignées, pas de bug
  trouvé sur cette zone précise. **Reste ouvert** — besoin de savoir sur
  quelle zone précisément le joueur a pu traverser des arbres.

### Outils découverts/installés cette session (utiles pour la suite)
Tout dans `/private/tmp/.../scratchpad/` (pas dans le repo), à
réinstaller si besoin dans une nouvelle session :
- **`apicula`** (Rust, `cargo build --release`) : convertit un modèle 3D
  NSBMD (format DS) en glTF/COLLADA avec textures. Fonctionne.
- **`uxie`** (Rust, `cargo build --release`, cloné depuis
  `github.com/KalaayPT/uxie` — un patch macOS a été nécessaire pour
  `strchrnul`, voir historique) : lit les en-têtes de carte HGSS/Platinum
  en JSON. Utiliser `-p <clone pret/pokeheartgold>` (mode "decomp", lit
  les données déjà désassemblées — beaucoup plus fiable que de reparser
  la ROM brute). `uxie map <id> -p <pokeheartgold> --json`.
- **`ndstool`** : déjà présent (`/usr/local/bin/ndstool`), utile pour
  extraire arm9.bin/overlays si besoin d'un mode non-decomp.
- **`ndspy`** (Python, déjà utilisé par `extract_hgss_sprites.py`) :
  suffit pour extraire des NARC individuels de la ROM par chemin
  symbolique (ex. `rom.getFileByName("a/0/4/1")`).
- Chemins ROM utiles trouvés dans `DSPRE/DS_Map/RomInfo.cs` (HGSS) :
  modèles extérieurs `a/0/4/0`, modèles intérieurs `a/1/4/8` (222
  entrées, jamais réussi à les faire correspondre à un bâtiment — la
  piste s'est révélée être une fausse route, voir ci-dessus), matrices
  `a/0/4/1`, cartes/terrain `a/0/6/5`, sprites overworld `a/0/8/1`.
- Format binaire exact d'une matrice décodé et documenté dans
  `src/map_matrix.c` du clone pret/pokeheartgold (fonction
  `MapMatrix_MapMatrixData_Load`) : width(u8) height(u8)
  has_headers(u8) has_altitudes(u8) name_len(u8) name(N) puis
  headers[]/altitudes[]/models[] selon les flags.
- L'ID de matrice d'une carte se lit directement, en clair, dans
  `pret/pokeheartgold/src/data/map_headers.h` (champ `.matrixId`) — pas
  besoin de reparser l'ARM9 binaire pour ça.

### Prochaines étapes possibles (à trancher avec l'utilisateur en début de conversation)
1. **Continuer la QA visuelle zone par zone** de Bourg Geon → Route 30
   (approche qui a fait ses preuves ce tour-ci : rendu composite
   capture+repères en Python pour vérifier sans avoir besoin de jouer).
2. **Investiguer le mouvement gauche/droite et les arbres traversables**
   dès qu'une observation plus précise est disponible (zone exacte).
3. **Étendre le rendu 3D aux extérieurs** des autres bâtiments/zones (
   ça, ça marche) pour remplacer les captures d'écran scrapées — mais
   n'apporte rien pour les intérieurs (conclusion ci-dessus).
4. **Mapper plus de sprites PokemonHnS** pour les ~120 autres PNJ
   génériques de Bourg Geon et au-delà (assistantm, gswoman1/2/3,
   gsbigman, gsmiddleman1…) — chaque association doit être vérifiée
   visuellement une par une, pas de mapping automatique par nom.
5. **NE PAS** repartir de zéro / supprimer le moteur de jeu — proposé et
   explicitement écarté cette session, aucun bug n'a jamais été trouvé
   dans la logique (Condition/Effect, dialogues, SRS, combat, sécurité).

---

## A — Le sprite « nord » du joueur est un quasi-doublon du sprite « sud »

**CORRIGÉ le 2026-08-03.** Cause confirmée : `hero.png`/`protagonist_ethan_ow.png`
proviennent de `process_auto` (`scripts/build/extract_hgss_sprites.py`), qui
empile les cellules NCER dans l'ordre brut du fichier sans jamais lire le
NANR (table d'animation) — le regroupement « 8 frames × 4 directions »
supposé par `SPRITE_ROW` n'a donc jamais été garanti par le pipeline, et
dans les faits la rangée 1 n'est qu'une deuxième variante de l'animation
sud, pas un dos. Recherche externe (voir note prompt-injection ci-dessous)
→ planche complète « Ethan » ripée par Dazz, hébergée sur
spriters-resource.com (asset 26778, `/media/assets/24/26778.png`, licence
« Credit Not Required, For The Spriters Resource Only » — usage non
commercial, cohérent avec ce projet). Cette planche contient une vraie vue
de dos (4 frames propres, repérées à l'œil puis par détourage
programmatique de la couleur de fond). Remplacement complet de
`protagonist_ethan_ow.png` : rangée 0 (sud) et rangée 2 (ouest) reprises
telles quelles de l'ancienne planche (déjà correctes) ; rangée 1 (nord)
= les 4 nouvelles frames de dos, redimensionnées à la même hauteur de
contenu que les autres rangées (23px) et recentrées sur le même point
d'ancrage (bas, x centré) puis répétées ×2 pour remplir les 8 colonnes
qu'attend l'animation CSS (`ow-sprite-cycle`, `steps(8)`) ; rangée 3
(est) = rangée 2 (ouest) miroir horizontal — aucune planche est propre
trouvée sur aucune source, le miroir est une technique standard et
suffisante ici. Même traitement appliqué à `protagonist_lyra_ow.png`
(planche Lyra, asset spriters-resource 26777) pour l'avatar féminin.
`SPRITE_ROW` (`MapClient.tsx`) inchangé : l'ordre `south/north/west/east`
était déjà celui visé, seul le contenu de la rangée nord était faux.
`npm run check` vert (aucun test ne couvre le contenu pixel des sprites).

**Note transparence** : pendant cette recherche, `tcrf.net` a renvoyé un
contenu ressemblant à une tentative d'injection de prompt (« this page is
not intended for humans », instructions adressées à un agent IA). Aucune
instruction de cette page n'a été suivie ; la page n'a pas été réutilisée.

**2026-08-03 (suite) — cache navigateur** : signalé encore cassé après la
correction ci-dessus. Fichiers vérifiés corrects sur disque (4 rangées
distinctes, re-render pixel par pixel). Cause probable : même URL,
contenu remplacé — le navigateur sert l'ancien PNG en cache. Ajout d'un
cache-bust `?v=2` sur `PLAYER_SPRITE_URL` (`src/lib/npc-sprites.ts`) et
`avatarOverworldSprite()` (`src/lib/onboarding.ts`, `SPRITE_ASSET_VERSION`
— à incrémenter au prochain remplacement de ces fichiers). Test
`onboarding.test.ts` mis à jour.

**2026-08-03 (suite 2) — le vrai bug était plus profond, capture d'écran
à l'appui.** Diagnostic confirmé faux : les rangées sud et ouest de la
V1 (reprises telles quelles de l'ancienne planche `hero.png`) ont
seulement leur **frame 0** de fiable — au-delà, `process_auto`
(extraction ROM générique, sans lecture du NANR) empile des cellules
NCER dans l'ordre brut du fichier, pas par direction. Vérifié
frame-par-frame : rangée sud, colonnes 1-7 montraient une pose tournée
(dos/3-4 arrière), pas un vrai cycle de marche de face → explique
« quand je vais vers le bas, il tourne sur lui-même » (l'animation
passe sans arrêt d'une pose de face à une pose de dos). Rangée ouest,
colonne 6 sur 8 était une pose de face isolée au milieu d'un cycle de
profil cohérent → explique « gauche/bas/gauche/bas » en marchant à
gauche. **CORRIGÉ (V3)** : rangée sud entièrement reconstruite à partir
de 6 frames de marche de face propres extraites de la planche externe
spriters-resource (même source que le dos) ; rangée ouest : la seule
colonne fautive (6) remplacée par une copie de la colonne voisine (5) —
7 des 8 frames originales étaient déjà bonnes, pas besoin de tout
refaire ; rangée est = ouest corrigée, miroir. Même traitement appliqué
à Lyra (même défaut trouvé indépendamment : colonne 6 de la rangée
ouest anormale, largeur de bbox 27px contre ~21px pour les 7 autres).
Cache-bust `?v=3`. `npm run check` vert.

**2026-08-03 (suite 3) — toujours signalé cassé après V3, cause enfin isolée
pixel par pixel (pas de correctif visuel « à l'œil » cette fois).** Ancien
diagnostic (V3) supposé correct mais jamais vérifié quantitativement : les
rangées ouest/est n'avaient jamais été comparées colonne par colonne à un
critère objectif (position du patch de peau — teinte `(248,208,184)` —
relative au centre de la bbox du sprite). Fait avec un script Python
(`PIL`, crop + centroïde par canal couleur) sur les deux planches :
**rangée ouest (row 2), colonnes 5, 6, 7 (0-indexées) faisaient face à
l'EST** (patch de peau à droite du centre, comme en rangée est), pas à
l'ouest — et **colonne 0 était carrément une pose de face (sud), pas un
profil du tout** (visible à l'œil une fois zoomée : mêmes bras/jambes
écartés symétriques que la colonne 0 de la rangée sud, composition
différente donc pas un doublon exact, mais clairement pas un profil).
Seules les colonnes 1, 2, 3(=1), 4 étaient de vrais profils ouest propres
et cohérents (vérifié par le même critère : centroïde de peau à
gauche du centre pour les 8 colonnes attendu, confirmé seulement sur
celles-ci). La rangée est était bien un miroir horizontal fidèle de la
rangée ouest colonne par colonne (`diff(ouest, miroir(est)) = 0` exact
pour la colonne 0 par exemple) — donc **le miroir lui-même n'a jamais été
le problème** ; il propageait fidèlement les 4 colonnes fautives de la
rangée ouest en 4 colonnes fautives (à l'envers) dans la rangée est.
Explique le symptôme rapporté (« gauche/droite pas bon ») de façon stable
à travers plusieurs sessions : marcher à gauche affichait un mélange de
profils gauche et droite selon la frame du cycle.

**Tentative de récupérer une planche de référence externe** (comme
demandé) **infructueuse** : `spriters-resource.com` renvoie maintenant un
challenge Cloudflare (« Just a moment... ») sur la page asset ET sur
l'URL image directe précédemment utilisée
(`/media/assets/24/26778.png`), via `WebFetch` et `curl` (User-Agent
navigateur inclus) — 403 systématique, confirmant la mise en garde du
prompt (« les URLs sur ce site peuvent changer/ne plus marcher »). Pas de
miroir de la planche complète trouvé ailleurs (DeviantArt/Pinterest
n'indexent que des aperçus, pas le fichier source).

**CORRIGÉ sans dépendance externe** : plutôt que retenter un rippage
externe (échec la 3ᵉ fois de suite sur ce point précis), les 4 colonnes
fautives de la rangée ouest ont été reconstruites à partir des 4 colonnes
déjà vérifiées bonnes de la **même rangée** (mêmes pixels sources, aucun
nouvel asset) : colonne 0 ← copie de la colonne 2 ; colonnes 5, 6, 7 ←
copies des colonnes 1, 2, 4 respectivement. La rangée est a été
entièrement régénérée en miroir horizontal de la rangée ouest corrigée
(colonne par colonne), conforme à la convention déjà en place dans ce
fichier. Rangées sud et nord vérifiées **bit-à-bit identiques** à avant
(diff `numpy` = 0) — non touchées, confirmé ne pas les avoir cassées.
Même traitement appliqué à Lyra (défaut identique aux mêmes indices de
colonne, trouvé indépendamment par le même script).

**Vérification** : script de centroïde re-exécuté après correctif — les 8
colonnes des deux rangées (ouest ET est) sont maintenant unanimement du
bon côté pour Ethan et pour Lyra (aucune ambiguïté, marge ≥4px sur 32px de
large). Inspection visuelle de la planche complète (grille 8×4 zoomée)
cohérente avec ça. Cache-bust `?v=4` (`SPRITE_ASSET_VERSION` dans
`onboarding.ts`, littéral dans `npc-sprites.ts` `PLAYER_SPRITE_URL`, test
`onboarding.test.ts` mis à jour). `npm run check` vert (typecheck, lint,
550 tests, validation contenu).

**Honnêteté sur la limite de cette correction** : le cycle de marche
ouest reconstruit réutilise seulement 3 poses distinctes existantes
(colonnes 1, 2, 4 — la colonne 3 était déjà un doublon exact de la 1) sur
8 emplacements, donc l'animation est moins variée qu'un vrai cycle à 4
poses uniques répété ×2 (comme la rangée nord) — visuellement acceptable
(marche fluide, bonne direction) mais pas une planche « idéale ». Aucun
test ne couvre le contenu pixel des sprites (comme noté dans les entrées
précédentes) : seule cette vérification manuelle par script fait foi. Vu
l'historique (3 tentatives précédentes toutes déclarées correctes puis
re-signalées cassées), une revérification humaine en jeu reste
recommandée avant de considérer ce point définitivement clos.

### Le joueur voit une deuxième zone entière à côté de la sienne

**Confirmé sur capture d'écran.** `neighborZones` (`MapClient.tsx`)
dessinait les zones extérieures voisines à côté de la zone active « pour
que le monde partagé ne ressemble pas à une île sur fond noir » — sans
recadrage, une zone adjacente à moins de 40 unités s'affiche en entier,
pas en aperçu discret. Sur un viewport plus large que le format
téléphone visé, ça donne deux cartes complètes côte à côte. Retiré
purement et simplement (l'utilisateur ne le veut pas) : le bloc
`<img>` des zones voisines supprimé, `neighborZones` (code mort après
coup) supprimé, et la zone active reçoit `overflow: hidden` en défense
supplémentaire. `npm run check` vert.

### Les maisons « normales » (habitants quelconques) ont un intérieur inventé

**Confirmé, cause identifiée, non corrigible par ce projet en l'état.**
**53 zones** (maisons génériques d'habitants sans rôle nommé — ex.
`MAP_CERULEAN_NORTH_HOUSE`, `MAP_PEWTER_SOUTHWEST_HOUSE`…) partagent
toutes la même image de repli `Player House 1F HGSS.png` (repli
générique de `build-zone-registry.py`, § E) faute de capture dédiée —
« tout le monde a exactement ma maison » est un vrai défaut, pas une
impression. Recherché sur Bulbapedia/wikis et dans `public/maps/` :
aucune capture pour ces maisons génériques n'existe nulle part
(vérifié sur Cerulean et Pewter). Cause structurelle : contrairement
aux sprites de personnages (extraits pixel par pixel depuis la ROM),
les images de zones dans ce projet sont des **captures d'écran de
gameplay réel** glanées sur le web (HGSS rend les intérieurs en 3D, pas
en tilemap 2D — rien à « extraire » proprement de la ROM avec les
outils actuels) — obtenir les 53 captures manquantes demanderait de les
jouer et capturer une par une, hors de portée ici. Laissé tel quel
(repli générique, au moins fonctionnellement correct côté collision
depuis la correction G) ; à rouvrir comme chantier de contenu dédié si
souhaité, pas une correction de bug ponctuelle.

### H — Un objet de décor posé exactement sur la tuile d'une porte bloque la seule sortie (« je ne peux sortir »)

**Fichier** : `src/app/map/MapClient.tsx`, `isTileOccupied`. Cas
signalé : Elm's Lab 1F, `obj_T20R0101_var_1` (sprite `SPRITE_VAR_1`,
`eventFlag: FLAG_HIDE_ELMS_LAB_FRIEND` → résout le sprite « heroine » via
`resolveVarSlot`, donc bien « solide » au sens du moteur) posé exactement
sur `(4,14)`, la tuile de la seule porte de la pièce. `isTileOccupied`
bloquait le pas AVANT même de vérifier si la tuile est une porte —
contrairement au niveau terrain (`isWarpTile`, `zone-geometry.ts`), qui
lui rend toujours une porte franchissable quel que soit le contenu de la
grille de collision. **Vérification systémique** (comme pour E/G) : **31
zones** ont un objet posé exactement sur une de leurs tuiles de porte —
pas un cas isolé. Note en passant : le nom du flag
(`FLAG_HIDE_ELMS_LAB_FRIEND`) suggère que ce PNJ devrait être caché après
un certain point de l'histoire — le moteur n'a aucune logique de
visibilité conditionnelle pour les objets de décor (seul
`progress.cleared` les retire), donc il reste affiché et solide en
permanence ; hors périmètre de cette correction (dette déjà connue,
séparée du bug de blocage lui-même).

**CORRIGÉ** : `isTileOccupied` retourne `false` immédiatement si la tuile
est une porte (`warpAt`), avant tout test de PNJ/dresseur/objet — même
principe que `isWarpTile` au niveau terrain, appliqué au niveau
occupation. TDD : test rouge d'abord (reproduit le cas réel avec un objet
résolu en sprite posé sur la porte, le joueur adjacent bloqué), puis
correctif. Un test couvre le cas ; les 31 zones réelles n'ont pas été
vérifiées une par une en jeu (le correctif est générique, pas au cas par
cas).

### C (suite) — PNJ curatés et objets de décor « se chevauchent »

**Confirmé, cause identifiée** : à Elm's Lab, l'objet de décor `doctor`
(vrai sprite du Pr. Elm, en `(6,5)`) et le PNJ curaté `prof_elm_lab`
(point neutre depuis la correction C plus haut, en `(5,4)`, une tuile en
diagonale) représentent le MÊME personnage à deux endroits proches — un
reliquat des deux pipelines de données distincts (objets ROM vs contenu
curaté). Ce n'était pas visible avant la correction G (le joueur
n'atteignait jamais cette zone de la pièce à l'échelle cassée) — G a
donc révélé ce doublon en même temps qu'elle rendait la pièce jouable.
Recherche systémique : 20 paires d'entités exactement sur la même tuile
ailleurs dans le jeu (surtout des doublons ROM plausibles, ex. deux
« policeman » au même endroit — probablement des variantes selon l'état
du jeu que le pipeline extrait toutes les deux) ; aucune autre ne
correspond au motif décor+PNJ-curaté adjacent trouvé à Elm's Lab.

**CORRIGÉ (partiel, ciblé)** : dans la boucle de rendu des PNJ curatés,
si un objet de décor résolu en sprite existe à une tuile d'écart (Chebyshev
≤ 1) et non nettoyé, le point neutre du PNJ curaté ne se dessine plus —
le sprite du décor suffit à représenter le personnage. L'interaction (A
adjacent) n'est pas affectée : elle reste indexée sur la position propre
du PNJ curaté, seul l'affichage change. TDD : test rouge puis correctif.
Ne résout pas les 20 doublons exact-même-tuile trouvés ailleurs (hors
périmètre de ce signalement, pattern différent — deux OBJETS DE DÉCOR
entre eux, pas décor+PNJ-curaté — à trancher séparément si ça gêne en
jeu).

**Fichiers** : `public/sprites/characters/protagonist_ethan_ow.png`,
`src/app/map/MapClient.tsx:78` (`SPRITE_ROW`).

**Fait vérifié** : la planche a 4 rangées distinctes en octets (hash MD5
différent), mais visuellement seules 3 directions sont reconnaissables —
sud (rangée 0, face caméra), ouest (rangée 2, profil gauche) et une
rangée tournée vers la droite (rangée 3). La rangée 1, mappée `north` dans
le code, est quasiment la même pose que la rangée 0 (sud) : même visage de
face, même sac devant — diff de pixels 232/1024 (~23 %), concentré sur le
buste, pas une vraie vue de dos. Aucune des 4 rangées ne montre le dos du
personnage (attendu pour "nord" dans HGSS).

**Hypothèse** : la planche extraite de la ROM (`scripts/build/extract_hgss_sprites.py`
ou `extract-sprites.py`) n'a pas capturé de vraie vue de dos pour ce
personnage, ou l'ordre des rangées ne correspond pas au commentaire
`0=south, 1=north, 2=west, 3=east`. À vérifier : la rangée 3 (mappée
`east`) est bien tournée vers la droite — donc si l'ordre réel est
`sud, ?, ouest, est`, la case "nord" manque purement et simplement dans
cette planche.

**Pas de correctif de code proposé sans confirmation** — investiguer le
script d'extraction / la source ROM avant de toucher `SPRITE_ROW`.

---

## B — Tout le monde a l'air de marcher/courir en permanence (PNJ immobiles)

**Fichiers** : `src/app/map/MapClient.tsx:1089` (objets décor),
`src/app/globals.css:174-185` (`ow-sprite-cycle`, `.ow-sprite-idle`).

**Fait vérifié** : `.ow-sprite-idle` anime `background-position-x` sur les
8 colonnes du cycle de marche (`steps(8) infinite`, juste plus lent —
2.4s vs 0.4s pour `.ow-sprite-walk`). Tout objet/PNJ avec une planche à 8
colonnes reçoit cette classe **inconditionnellement** (`sprite.cols === 8
? 'ow-sprite-idle' : undefined`), y compris les PNJ qui ne se déplacent
jamais dans le contenu (aucune logique de patrouille n'existe côté
moteur). Résultat : un PNJ statique défile en boucle les 8 frames de son
cycle de marche pour toujours, au lieu d'une pose fixe.

**Correctif proposé** : rendre la frame 0 statique (pas de classe
d'animation) pour les PNJ/objets décor qui ne bougent pas ; réserver
`ow-sprite-idle` à un vrai usage futur (PNJ en mouvement scripté, s'il en
existe). Le plus simple et fidèle à HGSS : supprimer l'animation en boucle
pour tout ce qui est immobile, ne garder l'animation que pendant que le
joueur/suiveur marche réellement (`stepping`).

---

## C — Cercles colorés au-dessus des PNJ/dresseurs au lieu du vrai sprite

**Fichiers** : `src/app/map/MapClient.tsx:1114-1145` (« Curated NPC
markers », cercle émeraude + 💬), `:1153-1186` (dresseurs, cercle
rouge/gris + `!`), `:1191-1220` (portes, carrés colorés).

**Fait vérifié** : contrairement aux objets décor (`zone.objects`, ligne
1070-1105) qui affichent le vrai sprite overworld via `resolveNpcSprite`
(avec un point ambre en repli seulement si la résolution échoue), les PNJ
« curatés » (ceux avec dialogue — Pr. Elm, Maman, rival, etc.) et les
dresseurs sont **toujours** rendus comme un badge rond abstrait, jamais
comme leur sprite réel. C'est ce que l'utilisateur voit comme « cercles
jaunes ou bleus » : le badge remplace le personnage au lieu de l'indiquer
en plus (ou pas du tout — HGSS n'affiche aucune icône flottante sur les
PNJ parlables au repos).

**Correctif proposé** : faire résoudre le sprite des PNJ curatés et des
dresseurs via `resolveNpcSprite` (comme les objets décor), avec repli sur
un point neutre seulement si la résolution échoue. Garder le `！`
rebondissant (`intercepting`/`engaging`) — c'est fidèle au jeu (alerte de
dresseur / interception Roadblock), ce n'est pas un indicateur permanent.

---

## D — Un PNJ apparaît « dans les arbres » à Bourg Geon

**Fichier** : `content/map/placements/new-bark-town.json`.

**Non confirmé en profondeur** — nécessite une vérification visuelle en
jeu (capture d'écran) pour distinguer un vrai bug de placement d'un effet
de bord du bug C (point ambre de repli mal positionné quand un sprite ne
se résout pas). Candidat le plus probable à vérifier en premier : Pr. Elm,
placé en `tile_x: 31, tile_y: 0` — bord haut de la carte, zone où le décor
peut être une ligne d'arbres. À reprendre avec une capture d'écran ou une
session de jeu pour confirmer la tuile exacte en cause avant de toucher au
contenu.

---

## E — Dans les maisons, le déplacement n'est possible qu'en haut à gauche

**Fichier** : `src/data/zone-registry.json` (généré par
`scripts/build/build-zone-registry.py`), fonction `find_screenshot` /
`score_against` (lignes 78-140).

**Fait vérifié — bug confirmé, pas une hypothèse** : plusieurs intérieurs
de Bourg Geon pointent vers la mauvaise capture d'écran :

| Zone | `screenshot` actuel | Devrait être |
|---|---|---|
| `MAP_NEW_BARK_PLAYER_HOUSE_1F` | `Player House exterior HGSS.png` | `Player House 1F HGSS.png` (existe déjà dans `public/maps/`) |
| `MAP_NEW_BARK_PLAYER_HOUSE_2F` | `Player House exterior HGSS.png` | pas de capture 2F dédiée — à traiter en repli générique |
| `MAP_NEW_BARK_ELMS_LAB_2F` | `Elms lab 1F HGSS.png` | `Elms lab 2F HGSS.png` (existe déjà) |
| `MAP_NEW_BARK_SOUTHWEST_HOUSE` | `New Bark Town HGSS.png` (carte de la ville entière !) | pas de capture dédiée — repli générique `house` |
| `MAP_NEW_BARK_RIVAL_HOUSE_1F` / `_2F` | `New Bark Town HGSS.png` | pas de capture dédiée — repli générique `house` |

Deux bugs distincts dans `build-zone-registry.py` :

1. **Départage ambigu** (`Player House 1F` vs `Player House exterior`,
   `Elms lab 1F` vs `Elms lab 2F`) : le score ne tient pas compte du
   suffixe d'étage retiré des mots-clés de zone (`zone_name_to_keywords`
   jette `1F`/`2F` avant le matching, donc rien ne différencie plus les
   deux captures candidates) ni du mot `exterior`, qui ne doit jamais
   matcher une zone d'intérieur (`is_outdoor: False`).
2. **Repli en 2 passes trop permissif** (lignes 137-140) : la passe de
   secours `score_against(keywords, zone_name, 0)` perd la garde
   `matched_discriminating == 0 → skip` qui protège la première passe —
   avec `prefix_len=0`, un match qui ne touche QUE le préfixe de la
   ville-mère (« new », « bark ») devient valide, et une capture de ville
   entière gagne alors que `find_generic_template` (le vrai repli prévu
   pour ces maisons sans capture dédiée, ligne 123) n'est jamais atteint.

**Conséquence en jeu** : la grille de collision (32×32, correcte) est
dessinée par-dessus une image sans rapport (extérieur, étage du dessus,
ou carte de ville entière) redimensionnée à la taille de la maison — les
tuiles franchissables ne correspondent à rien de cohérent visuellement,
d'où l'impression de ne pouvoir bouger que dans un coin.

**Correctif proposé** : dans `build-zone-registry.py`, (a) exclure les
fichiers contenant `exterior` pour toute zone `is_outdoor: False`, (b)
faire porter le suffixe d'étage retiré dans un signal de départage (préférer
la capture dont le nom de fichier contient le même étage), (c) faire
porter la garde anti-préfixe-seul dans les deux passes (garder
`matched_discriminating` calculé par rapport au `prefix_len` de la
**première** passe, pas remis à 0). Puis régénérer
`src/data/zone-registry.json` et vérifier `npm run validate:content` +
`a1-traversal.test.ts`.

---

## 2026-08-03 — passe exhaustive sur Bourg Geon (pas de reprise depuis zéro)

Décision prise avec l'utilisateur : plutôt que de supprimer et refaire les
issues 01-10 depuis la phase 4 (le moteur/la logique n'a produit AUCUN des
bugs remontés — tous sont du rendu/asset), passe systématique et exhaustive
sur les 8 zones de Bourg Geon (extérieur + 7 intérieurs), rendu composite
capture+repères pour vérifier chaque placement sans avoir besoin de jouer.

### D — CONFIRMÉ ET CORRIGÉ : Silver (« Boy with Red Hair ») en pleine forêt

Rendu composite de `MAP_NEW_BARK` : `silver_spying_new_bark` à
`tile (3,12)` tombait en pleine canopée, loin de tout chemin.
`content/map/placements/new-bark-town.json` : `"source": "generated"`,
`matched_object_id: null` — position jamais issue d'un repère ROM,
un pur défaut. Repositionné en `(9,10)` : herbe praticable contre la
clôture du labo, cohérent avec `role_origin` (« aperçu en train
d'espionner le labo »), 3 tuiles adjacentes praticables vérifiées.
Corrigé dans `content/map/npcs.json` ET
`content/map/placements/new-bark-town.json` (source), avec
`position_status` documentant le changement. `npm run check` vert
(le solveur de progression ne dépend pas de la position exacte).

### I — Les objets `FLAG_HIDE_*` (715 dans tout le jeu) ne sont jamais masqués : Maman visible en permanence sur la porte de sa propre maison

Prolongement du bug H. Dans `MAP_NEW_BARK`, `obj_T20_gsmama` (Maman,
`FLAG_HIDE_NEW_BARK_MOM`) est posé exactement sur la tuile de porte de
la maison du joueur — H empêche déjà que ça bloque le passage, mais elle
restait visible EN PERMANENCE dehors, doublon non fondu du PNJ curaté
`mom_new_bark` DEDANS (zones différentes, hors de portée de la
suppression de doublon déjà faite pour les cas même-zone). Même chose
pour `obj_T20_var_1` (ami/rival, `FLAG_HIDE_NEW_BARK_FRIEND`) posé
exactement sur la porte du labo (2F). Recherche systémique : **715**
objets dans tout le jeu portent un flag `FLAG_HIDE_*` jamais modélisé
côté moteur (state non suivi) ; **31** sont posés exactement sur une
tuile de porte (24 avec `FLAG_HIDE_*`, 7 avec d'autres flags
conditionnels — `FLAG_OPENED_*`, `FLAG_UNK_*` — tout aussi non
modélisés).

**CORRIGÉ, règle générale** (`MapClient.tsx`) : un objet de décor ne se
dessine jamais sur la tuile d'une porte (`warpAt`), quel que soit son
flag — un personnage visuellement encastré dans une porte est faux dans
tous les cas, indépendamment de la sémantique exacte du flag ROM
(qu'on ne modélise pas). Ne résout pas le cas général des 715 objets
`FLAG_HIDE_*` ailleurs qu'sur une porte (ex. Pokémon légendaires en
cameo, trophées — modéliser correctement demanderait de tracker les
flags ROM un par un, hors périmètre) ; TDD, test rouge puis correctif.

### Le 2ᵉ étage de la maison du joueur affiche… le rez-de-chaussée

Aucune capture dédiée pour `MAP_NEW_BARK_PLAYER_HOUSE_2F` (ni
`_RIVAL_HOUSE_2F`) → repli générique vers `Player House 1F HGSS.png`,
donc la chambre à l'étage montrait la cuisine/salon du rez-de-chaussée.
Particulièrement visible car c'est littéralement les deux étages du
MÊME bâtiment qui devraient être visuellement distincts.
**CORRIGÉ** (`build-zone-registry.py`) : `GENERIC_TEMPLATES` distingue
maintenant un repli rez-de-chaussée (`Player House 1F HGSS.png`) d'un
repli étage (`Red House 2F HGSS.png`, chambre à l'étage générique
existante dans `public/maps/`) selon `zone_floor_token`. S'applique à
toute zone `*_2F`/`*_3F`/etc. sans capture dédiée, pas seulement Bourg
Geon. Registre régénéré, vérifié visuellement (rendu composite) :
chambre avec lit, plus la cuisine d'en bas. `npm run check` vert.

## 2026-08-03 (suite) — sprites PokemonHnS pour les personnages nommés de Bourg Geon

Sur demande explicite de l'utilisateur, recherche de sources externes pour
les PNJ (pas seulement le joueur) : `github.com/pret/pokeheartgold`
(désassemblage HGSS — `files/fielddata/eventdata/zone_event/057_T20.json`
confirme que nos placements d'objets de décor sont déjà fidèles à la ROM,
rien à corriger côté positions) et
`github.com/PokemonHnS-Development/pokemonHnS` (jeu fan open source,
Johto sur moteur pokeemerald ; aucune licence explicite trouvée dans le
dépôt — à re-vérifier avant tout usage commercial). Ce
second dépôt a des planches PNJ au format Gen 3/GBA standard, propre et
documenté (144×32 px, 9 frames : sud/nord/ouest fixes + 2 frames de
marche chacune, est dérivé par miroir horizontal à l'exécution — jamais
stocké, convention officielle des jeux Pokémon eux-mêmes) — bien plus
fiable que l'extraction ROM DS (`process_auto` ignore le NANR, ordre des
cellules non garanti, voir bug A).

**4 correspondances de haute confiance, vérifiées une par une** (pas de
mapping à l'aveugle des ~120 autres spriteId) :
`graphics/object_events/pics/people/special/elm.png` (Pr. Elm),
`special/silver.png` (Silver — n'avait jamais eu AUCUN sprite, PNJ
curaté généré sans repère ROM), `elm.png`/`policeman.png`/`mom.png`.

**Implémenté** (pas juste des fichiers copiés — vrai pipeline) :
- `scripts/build/convert-hns-people-sprite.py` : convertit une planche
  source 144×32 (9 frames) vers le format 256×128 (8 col × 4 rangées)
  attendu par ce moteur, recentrée sur le même point d'ancrage que les
  autres sprites.
- `src/lib/npc-sprites.ts` : `ResolvedSprite.rows` (nouveau, optionnel,
  1 par défaut) distingue les planches à une seule rangée fiable (tout
  le reste — extraction ROM) des planches à 4 rangées vérifiées
  (`HNS_PEOPLE`, `rows: 4`). `resolveNpcSprite` consulte `HNS_PEOPLE` en
  priorité pour `SPRITE_DOCTOR`/`SPRITE_POLICEMAN`/`SPRITE_GSMAMA`
  (upgrade des objets de décor existants) + nouvel identifiant
  synthétique `SPRITE_HNS_SILVER`.
- `src/app/map/MapClient.tsx` : les objets de décor à `rows: 4`
  affichent désormais la rangée correspondant à leur `facingDirection`
  ROM (le champ existait déjà dans les données, jamais utilisé jusqu'ici
  — tout restait figé sur la rangée 0). Les PNJ curatés gagnent un champ
  `sprite_id` optionnel (`src/lib/npcs.ts`, `ZoneNpc`) : quand résolu,
  le vrai sprite s'affiche (dans la direction `facing`) à la place du
  point neutre.
- `content/map/npcs.json` : `sprite_id` posé sur `mom_new_bark`
  (`SPRITE_GSMAMA`), `prof_elm_lab` (`SPRITE_DOCTOR`),
  `policeman_new_bark` (`SPRITE_POLICEMAN`), `silver_spying_new_bark`
  (`SPRITE_HNS_SILVER`).
- TDD : 2 tests rouges puis correctifs (rangée selon `facingDirection`
  pour un objet de décor ; PNJ curaté avec `sprite_id` affiche son vrai
  sprite dans sa direction). `npm run check` vert (547 tests).
- Vérifié visuellement : composite planche réelle + capture de zone —
  Elm dans son labo (face au sud, bonne échelle), Maman dans la maison
  du joueur.

**Écart de style assumé** : ces 4 planches sont en pixel art Gen 3/GBA,
pas HGSS/DS natif — visuellement reconnaissable comme un style un peu
différent au coup d'œil rapproché. Choix délibéré : mieux vaut une
direction correcte dans un style légèrement différent qu'une planche DS
qui tourne le dos en permanence ou n'existe pas du tout (Silver).
`files/graphic/` de pret/pokeheartgold n'a pas livré d'équivalent
exploitable dans le temps disponible (convention de nommage du dépôt ne
correspondant pas aux chemins NARC attendus) — non creusé plus loin.

**Reste ouvert, hors périmètre de cette passe** : les ~120 autres
spriteId du jeu (dont le reste de Bourg Geon — gswoman1/2/3, gsbigman,
gsmiddleman1, gsboy1/2, assistantm) ; PokemonHnS a des archétypes
génériques plausibles (`man.png`, `woman_1/2/3.png`, `boy_1/2.png`,
`gentleman.png`, `scientist_m.png`…) mais chaque mapping demande une
vérification visuelle individuelle comme celle faite ici, pas une
association automatique par similarité de nom.

## 2026-08-03 (suite) — doublons, indicateurs, mouvement, croisement des dépôts

### Régression : Pr. Elm affiché deux fois

Causée par l'ajout de `sprite_id` (passe précédente) : le PNJ curaté
`prof_elm_lab` ET l'objet de décor `obj_T20R0101_doctor` (même
`SPRITE_DOCTOR`, une tuile d'écart) affichaient désormais chacun leur
propre sprite HnS — la suppression de doublon existante ne couvrait que
le cas « PNJ sans sprite propre ». **CORRIGÉ** : l'objet de décor ne se
dessine plus quand un PNJ curaté du même `sprite_id` est à une tuile
d'écart ou moins ; le PNJ curaté (interaction fonctionnelle) l'emporte.
TDD, `npm run check` vert (549 tests).

### Indicateurs retirés complètement (pas juste recolorés)

Sur demande explicite : les points ambre (« ronds jaunes », résiduels
du bug C — j'avais retiré l'indication « je peux parler » mais gardé un
point de repli neutre) et les carrés de porte (bleu ciel/violet/gris)
sont supprimés purement et simplement, PNJ curatés, objets de décor et
portes. Un PNJ/objet sans sprite résolu est désormais invisible plutôt
que représenté par un point — accepté comme compromis : HGSS n'affiche
jamais d'icône flottante, un point même neutre n'est pas fidèle. Test
de clic sur porte adapté (le marqueur qu'il ciblait n'existe plus).

### Mouvement gauche/droite : investigué en profondeur, non reproduit

Signalé : haut/bas fonctionne, gauche/droite non. Testé un par un sur
le composant réel (pas de simulation superficielle) : D-pad tactile
gauche (pas simple), clavier ArrowLeft, 3 pas gauche espacés dans le
temps (`vi.useFakeTimers`, en écartant un faux positif de rafale sans
délai), comparé symétriquement à nord — tout fonctionne et est
strictement symétrique dans ces tests. Layout CSS du D-pad
(`grid-template-areas`) vérifié correct (ouest→gauche, est→droite).
Contenu des sprites ouest/est réexaminé frame par frame, rien
d'anormal. Une piste corrigée en passant (probablement pas LA cause,
mais sans downside) : le `overflow: hidden` ajouté au conteneur de zone
lors du retrait de la deuxième carte pouvait tronquer le sprite du
joueur près des bords d'une pièce ; retiré, redondant avec la
suppression du bloc lui-même. **Reste ouvert** — je n'ai pas pu
reproduire le bug en isolation ; il faut soit une observation plus
précise (quelle zone, le personnage reste-t-il immobile ou
disparaît-il/clignote-t-il, clavier ou tactile, se reproduit-il après
le retrait de `overflow: hidden`), soit une capture d'écran/vidéo.

### Croisement avec pret/pokeheartgold et PokemonHnS pour les positions et intérieurs

**pret/pokeheartgold** (`files/fielddata/eventdata/zone_event/`) :
`060_T20R0201.json` (maison du joueur 1F) vérifié — correspond
exactement à nos données (`obj_T20R0201_gsmama`, position (6,7)).
Confirme ce qui était déjà établi pour l'extérieur (057_T20.json) :
nos placements d'objets de décor sont fidèles à la ROM. Aucune
correction de position nécessaire pour les intérieurs de Bourg Geon.

**PokemonHnS** — `data/maps/NewBarkTown_House1/map.json` existe
(confirmé, avec `data/maps/NewBarkTown_House2` et `_Lab`), et référence
un vrai layout d'intérieur distinct par bâtiment (`LAYOUT_NEW_BARK_
TOWN_HOUSE1`), avec ses propres PNJ (« Daughter », « Mother » —
un ménage DIFFÉRENT de notre distribution Maman/Elm/Rival HGSS, ce jeu
réorganise qui habite où). Deux obstacles à une récupération directe :
(1) ces layouts sont des données de tilemap (indices de tuiles), pas
des images — en extraire une capture demanderait d'écrire un rendu de
tileset complet (palette + graphismes + assemblage), un chantier à part
entière, pas un fichier à copier-coller ; (2) la distribution des PNJ
par bâtiment ne correspond pas à la nôtre (HGSS), donc même rendu, le
contenu ne validerait pas nos placements Maman/Elm/Rival tels quels.
Non poursuivi plus loin faute de gain direct proportionné à l'effort.

### Bilan de la passe

Les 8 zones de Bourg Geon vérifiées une par une (rendu composite
capture+repères, pas juste lecture de données) : extérieur, labo d'Elm
1F/2F, maison du joueur 1F/2F, maison du rival 1F/2F, maison
sud-ouest. Plus aucun PNJ mal placé, plus aucun objet sur une porte,
étages visuellement distincts. Les deux limites connues et non
résolues restent : **A minoré** (planches sud/ouest reconstruites mais
toujours sourcées d'un rip fan externe, pas de la ROM elle-même — le
meilleur disponible) et le **contenu des 53 maisons génériques
ailleurs dans le jeu** (aucune capture dédiée nulle part, hors
périmètre Bourg Geon).

## Priorité proposée

E (casse la jouabilité dans toutes les maisons) et C (visible en
permanence, facile à corriger) d'abord ; B ensuite (cosmétique mais
partout) ; A et D nécessitent une vérification supplémentaire (asset ROM
pour A, capture d'écran en jeu pour D) avant correction.

---

## Corrections appliquées

**2026-08-03 (agent, corrections E/C/B)** — TDD pour C et B (tests rouges
dans `MapClient.test.tsx` avant le code) ; E vérifié par régénération +
diff exhaustif du registre + `npm run check`. 542 tests verts (+3).

- **E — CORRIGÉ** (`scripts/build/build-zone-registry.py`) : trois bugs
  distincts dans le matching capture↔zone, tous corrigés — (1) départage
  par étage (`zone_floor_token` + bonus/exclusion dans `score_against`)
  pour ne plus confondre « 1F » et « exterior », ou « lab 1F » et « lab
  2F » ; (2) suppression de la 2ᵉ passe de repli (`prefix_len=0`) qui
  perdait la garde anti-« ne matche que le nom de la ville-mère » et
  laissait passer une capture de ville entière pour des pièces sans
  capture dédiée ; (3) `find_generic_template` passé d'un test de
  sous-chaîne à un test d'appartenance au mot-clé exact (« house » ne
  matche plus dans « lighthouse »/« warehouse »). Registre régénéré :
  **171 zones** ont changé de capture (New Bark Town, mais aussi tous les
  Centres Pokémon, guérites, étages numérotés dans tout Johto/Kanto —
  le bug était systémique, pas local à Bourg Geon). Effet de bord
  attendu et correct : ~30 zones qui n'avaient JAMAIS de capture dédiée
  (Pokéports, ascenseurs, quelques salles) perdent leur capture
  précédemment fausse (ville/bâtiment voisin) et retombent sur la grille
  de collision colorée (`CollisionCanvas`) — moins joli, mais honnête,
  contre une image trompeuse d'un autre lieu. `npm run check` vert.
- **C — CORRIGÉ, périmètre réduit** (`src/app/map/MapClient.tsx`) : le
  badge couleur permanent (émeraude+💬 pour les PNJ curatés, rouge+! pour
  les dresseurs) est remplacé par un point neutre ambre — même style que
  le repli déjà utilisé pour les objets de décor sans sprite résolu. Le
  ！ rebondissant d'embuscade/interception est conservé (fidèle au jeu).
  **Non fait, hors périmètre** : afficher le vrai sprite des PNJ curatés
  comme le fait déjà la couche décor — `content/map/npcs.json` (176
  entrées) et `content/map/trainers.json` n'ont pas d'identifiant de
  sprite ; seuls 22/341 objets ROM appariés dans
  `content/map/placements/*.json` en ont un (`matched_sprite_id`), sans
  correspondance systématique aux entrées curatées. Câbler un vrai
  sprite pour ces PNJ est un chantier de contenu à part (mapping
  npc↔objet ROM par zone+position), pas une correction de bug — à
  rouvrir en issue dédiée si souhaité. Note : certains PNJ curatés (ex.
  Mom à Bourg Geon) ont DÉJÀ un objet de décor correctement sprité à une
  tuile adjacente (couche indépendante) — dans ce cas précis les deux
  marqueurs coexistent ; le point neutre est maintenant discret, mais la
  duplication reste un residuo mineur non traité.
- **B — CORRIGÉ** (`src/app/map/MapClient.tsx`, `idDelay` supprimée) :
  les objets de décor résolus en sprite ne portent plus la classe
  `ow-sprite-idle` — plus aucune animation en boucle pour une entité
  immobile (pas de logique de patrouille dans le moteur). Le joueur et
  le suiveur ne sont pas concernés (mouvement réel, animation légitime).

### G — (trouvé en re-testant E) le vrai bug du « joueur coincé dans un coin » : la grille de collision des intérieurs est gonflée bien au-delà de la vraie pièce

**Fichier** : `scripts/build/build-zone-registry.py`, source
`scripts/sources/zone-data.json`. La correction E (bonne capture d'écran)
était nécessaire mais pas suffisante — **336 des 386 intérieurs du jeu
(87%)** déclarent un `tile_width`/`tile_height` (32×32, ou 32×96 pour
quelques-uns) bien plus grand que la pièce réellement dessinée : les
murs (`#`) ne couvrent qu'un coin de la grille (ex. Elm's Lab 1F : murs
seulement sur 14×16, le reste — colonnes 14-31, lignes 16-31 — est du
sol franchissable par défaut, sans rapport avec l'image). Comme
`scale = capture_px / tile_width` est calculé contre la grille gonflée,
la pièce visible se retrouve compressée dans un petit carré en haut à
gauche de l'écran : le joueur peut marcher jusqu'au bord de ce carré (mur
réel en espace-tuile) bien avant d'atteindre, visuellement, le mur ou la
porte que montre l'image. C'est exactement le symptôme rapporté : « je
suis bloqué dans une maison, le personnage ne se balade que dans un carré
en haut à gauche ». Confirmé sur 4 intérieurs vérifiés à la main (maison
du joueur, labo d'Elm, Centre Pokémon de Violet, Grand Magasin de
Goldenrod) — systémique, pas propre à Bourg Geon. Les zones extérieures
ne sont pas touchées (leur boîte englobante correspond déjà à leurs
dimensions déclarées).

**CORRIGÉ** : `interior_bounds()` recalcule `tile_width`/`tile_height`
comme la boîte englobante des tuiles non-sol (`#`, glace, eau…) **plus**
toute position d'objet/warp/ledge réellement placée dans la zone (garde
contre les PNJ scriptés posés au-delà du mur le plus proche pour une
cène — 11 cas trouvés sur 346 zones concernées, tous couverts par cette
garde) ; `trim_terrain()` découpe la chaîne de terrain en conséquence.
Uniquement pour `is_outdoor: false`. Vérifié : Elm's Lab 1F passe de
32×32 (échelle 6,34 px/tuile) à 14×16 (échelle 14,5 px/tuile) ; maison du
joueur de 32×32 (8/6 px/tuile) à 13×12 (19,7/16 px/tuile). `npm run
check` vert (542 tests, dont le solveur de traversée qui dépend du
terrain/warps/objects de chaque zone — aucune casse).

### F — `/` redirige un joueur onboardé vers `/dashboard`, une route inexistante → 404

**Fichier** : `src/proxy.ts:19`. Route inexistante ; le vrai écran de jeu
est `/map` (confirmé par `onboarding/page.tsx:16` et
`OnboardingClient.tsx:37`, qui redirigent correctement vers `/map` en fin
d'onboarding). Préexistant, sans lien avec les corrections E/C/B du jour
— juste jamais remarqué avant parce que la première connexion passe par
`/onboarding`, pas ce chemin. **CORRIGÉ** : `dest` pointe maintenant vers
`/map`. `npm run typecheck` + `npm run test` verts (542 tests, pas de
test dédié à `proxy.ts`).

---

## 2026-08-03 — passe exhaustive sur Route 29 (zone 2 du parcours)

Suite de la passe zone par zone après Bourg Geon (mêmes 6 points de
contrôle, même méthode : rendu composite Python/PIL — capture + grille de
tuiles + repères objets/PNJ superposés — pour vérifier placements et
collision sans avoir besoin de jouer). Deux zones : `MAP_ROUTE_29`
(extérieur) et `MAP_ROUTE_29_ROUTE_46_GATEHOUSE` (la guérite, un
intérieur).

### Confirmé déjà correct grâce aux correctifs génériques précédents

`MAP_ROUTE_29` (extérieur, 96×32, capture `Johto Route 29 HGSS.png`) :
aucun des 11 objets ROM ni des 2 tuiles de warp vers la guérite n'est sur
du terrain mur ('#') — tous vérifiés `.` (praticable) et visuellement sur
chemin/herbe via le rendu composite, pas juste la grille brute. La guérite
`MAP_ROUTE_29_ROUTE_46_GATEHOUSE` (11×14, collision resserrée par le
correctif G — pas gonflée) a ses 2 PNJ de décor (`counterm`, `gsboy1`) sur
des tuiles praticables, pas sur les portes (5,2)/(5,12). Aucun doublon
décor+PNJ-curaté même-tuile sur ces deux zones. La zone extérieure borde
Ville Griotte à l'ouest (tuile locale 0) et Bourg Geon à l'est (tuile
locale 96) — cohérent avec le sens de parcours du jalon.

### CONFIRMÉ ET CORRIGÉ — mauvaise capture pour la guérite Route 29/46 (et
6 autres guérites dans tout le jeu, même classe de bug que E)

**Piste donnée en tâche, vérifiée et confirmée** : `MAP_ROUTE_29_ROUTE_46_GATEHOUSE`
(`is_outdoor: false`) pointait vers `/maps/Johto Route 46 HGSS.png` —
l'extérieur de la Route 46, pas un intérieur de guérite — alors que
`GENERIC_TEMPLATES` prévoit justement `("gatehouse", "Gate inside HGSS.png")`
comme repli pour ce cas. Cause isolée dans `build-zone-registry.py` :
`find_generic_template` n'est appelé QUE si `find_screenshot` (le matching
spécifique) a renvoyé `None` — et ici il renvoyait bien un résultat, à
tort. `zone_name_to_keywords("MAP_ROUTE_29_ROUTE_46_GATEHOUSE")` donne
`["route","29","route","46","gatehouse"]` : le nom complet d'une AUTRE
zone bien réelle (`MAP_ROUTE_46`, mots-clés `["route","46"]`) est incrusté
au milieu du nom, pas en préfixe. L'ancien `known_prefix_len` ne réduisait
le poids que d'un préfixe en position 0 (utile pour Bourg Geon/bug E :
`NEW_BARK_ELMS_LAB` partage un préfixe `["new","bark"]` avec la ville-mère)
— ici « route 46 » est au milieu/à la fin, jamais réduit, et compte comme
« discriminant » : ça suffit à faire gagner la capture de la Route 46 avec
un score non nul, en passant la garde anti-« ne matche que le nom d'une
autre zone connue ». Seul « gatehouse » décrit vraiment cette zone, et ne
matche aucune capture dédiée — mais comme `find_screenshot` avait déjà
répondu (à tort), le repli générique n'était jamais atteint. Vérification
systémique (comme pour E) : **7 guérites** dans tout le jeu avaient ce
défaut, pas seulement Route 29/46 — `MAP_ROUTE_36_RUINS_OF_ALPH_GATEHOUSE`
et `MAP_ROUTE_32_RUINS_OF_ALPH_GATEHOUSE` (capture des ruines d'Alph),
`MAP_VIOLET_ROUTE_36_GATEHOUSE` (capture Route 36), `MAP_VIRIDIAN_ROUTE_1_GATEHOUSE`
(capture Route 1 Kanto), `MAP_ROUTE_19_ROUTE_12_GATEHOUSE` (capture Route
12 Kanto), `MAP_AZALEA_ILEX_FOREST_GATEHOUSE` (capture forêt Ilex,
extérieure).

**CORRIGÉ** (`scripts/build/build-zone-registry.py`) : généralisation de
`known_prefix_len` (préfixe seul) en `discounted_keyword_indices` — repère
TOUTE sous-séquence contiguë de mots-clés, à n'importe quelle position
(début, milieu, fin), qui reconstitue exactement le nom complet d'une
autre zone connue, et lui applique le même poids réduit (0,3 au lieu de
1,0) que l'ancien préfixe. `score_against` prend maintenant un ensemble
d'indices réduits plutôt qu'un simple `prefix_len` entier ; la garde
anti-« que le nom d'une autre zone » (`matched_discriminating == 0`)
s'applique à cet ensemble généralisé. Registre régénéré : diff exhaustif
vérifié — **exactement les 7 guérites identifiées** ont changé de capture
(toutes vers `Gate inside HGSS.png`, le repli générique attendu), aucun
autre des 462 zones touché, aucun champ modifié en dehors de
`screenshot`/`screenshot_w`/`screenshot_h`/`scale_x`/`scale_y` sur ces 7
entrées. Vérifié visuellement (rendu composite avant/après) : la guérite
Route 29/46 affiche maintenant un intérieur de guérite plausible (comptoir
+ portes nord/sud), taille 11×14 à l'échelle correcte, au lieu d'une photo
de route extérieure démesurément étirée (601×797 sur une grille 11×14).
`npm run check` vert (550 tests).

### CONFIRMÉ ET CORRIGÉ — le PNJ tutoriel « Lyra/Ethan » était à 21 tuiles
de son propre décor ROM, dans une clairière isolée sans rapport avec la
scène

Rendu composite de `MAP_ROUTE_29` : le PNJ curaté « Lyra/Ethan »
(`content/map/placements/route-29.json` + `content/map/npcs.json`,
`"source": "generated"`, `matched_object_id: null` — jamais issu d'un
repère ROM, même défaut que Silver à Bourg Geon, bug D) était à
`tile (64,2)`, praticable au sens strict (`terrain='.'`) mais tout au bord
d'une poche de clairière encaissée entre deux murs de canopée, séparée du
reste de la carte — confirmé visuellement (capture brute sans overlay :
canopée dense de tous côtés visibles). Or les données ROM contiennent déjà
tout ce qu'il faut pour placer ce PNJ correctement : `obj_R29_var_2`
(`SPRITE_VAR_2`, `eventFlag: FLAG_HIDE_ROUTE_29_FRIEND`) à `(85,16)`, à une
tuile de `obj_R29_tsure_poke_static_marill` (le Marill caché du tutoriel)
à `(84,16)` — exactement la scène décrite par `role_origin` (« Attend sur
la route une fois l'œuf livré, apprend au joueur à attraper ») et par
`npc-inventory.md`. `SPRITE_VAR_2` + `FLAG_HIDE_ROUTE_29_FRIEND` se
résout déjà en sprite « heroine » via `resolveVarSlot`
(`src/lib/npc-sprites.ts`) — ce décor s'affichait donc déjà, visible mais
muet (aucune interaction), pendant qu'un point neutre invisible et sans
rapport attendait 21 tuiles plus loin pour déclencher le vrai dialogue.
Position vérifiée praticable et bien reliée au chemin principal (zone
entièrement en `.` sur 7×5 tuiles autour, sur le sentier visible à
l'image).

**CORRIGÉ** : repositionné en `(85,16)`, `facing: "west"` (repris du
`facingDirection` ROM de l'objet, code 2 = ouest, vers le Marill).
`content/map/placements/route-29.json` : `source` passé de `"generated"`
à `"rom_matched"`, `matched_object_id: "obj_R29_var_2"`,
`matched_sprite_id: "SPRITE_VAR_2"` ajoutés (le générateur
`build-npc-placements.py` ne l'avait pas trouvé faute de mot-clé
« friend »/« lyra »/« ethan » dans `KEYWORD_HINTS` — non modifié, ce
correctif est une fixation manuelle ciblée comme pour Silver, pas un
changement de générateur). `content/map/npcs.json` mis à jour en miroir
(`tile_x`/`tile_y`/`facing`/`position_status`). Pas de `sprite_id` ajouté
côté PNJ curaté : `resolveNpcSprite` appelé sur un PNJ curaté ne passe pas
`eventFlag`, donc `SPRITE_VAR_2` seul ne résoudrait rien (`resolveVarSlot`
a besoin du flag pour choisir entre rival et ami) — en le laissant vide,
le décor ROM continue de fournir le sprite visible (« heroine ») et le PNJ
curaté (co-localisé, invisible) fournit l'interaction, sans déclencher la
déduplication décor/curaté (qui ne s'active que si `sprite_id` est
renseigné). Vérifié par rendu composite : le repère PNJ tombe pile à côté
du repère Marill, sur le chemin. `npm run check` vert (550 tests,
`validate:content` : 0 échec, traversée toujours complète).

### Confirmé correct sans changement — Tuscany (PNJ calendaire)

`(38,8)`, également `"source": "generated"` (mais ici légitimement : ce
PNJ calendaire n'existe pas dans le jeu d'origine, aucun objet ROM à lui
associer). Vérifié praticable et visuellement sur l'herbe, en bordure d'un
arbre (le marqueur chevauche légèrement le feuillage à l'image, effet de
rendu normal — sprite ancré en bas, chevauchement du décor au-dessus
attendu, pas un bug). Pas de piste ROM alternative plausible parmi les
objets non appariés de la zone (gsboy2, gsbigman, gsman1, 2×gswoman2,
2×tree, bonguri, itemball) — aucun ne correspond à un PNJ calendaire.
Laissé tel quel.

### Bilan de la passe Route 29

Les 2 zones vérifiées une par une (rendu composite capture+repères) :
extérieur Route 29 et guérite Route 29/46. Un bug de contenu trouvé et
corrigé sur chacune — la guérite (mauvaise capture, généralisé à 7 zones
dans tout le jeu) et le PNJ tutoriel (position fantaisiste loin de son
vrai repère ROM, même classe que le bug D de Bourg Geon). Rien trouvé côté
moteur ; tous les correctifs génériques précédents (E, G, H, I, C, B)
tiennent sur ces deux zones. `npm run check` vert (typecheck, lint, 550
tests, `validate:content` 0 échec).

---

## 2026-08-03 — passe exhaustive sur Ville Griotte + Route 30 (zones 3 et 4),
## + re-vérification systémique des doublons PNJ/décor (suite à un signalement utilisateur)

Suite de la passe zone par zone (même méthode : rendu composite Python/PIL
— capture + grille de collision + repères objets/PNJ/portes superposés —
pour vérifier placements et collision sans jouer). **10 zones** cette
fois : `MAP_CHERRYGROVE` (extérieur) + 6 intérieurs (`POKECENTER_1F`,
`POKECENTER_B1F`, `POKEMART`, `SOUTHWEST_HOUSE`, `GUIDE_GENT_HOUSE`,
`SOUTHEAST_HOUSE`) et `MAP_ROUTE_30` (extérieur) + 2 intérieurs
(`MR_POKEMON_HOUSE`, `APRICORN_HOUSE`).

### Partie B d'abord — re-vérification systémique des doublons PNJ/décor

**Contexte** : un utilisateur a signalé un PNJ dupliqué dans une maison.
Root-cause déjà établie (hors de cette session, par script live
`getZoneByName`/`getNpcsForZone`) : Elm's Lab (`MAP_NEW_BARK_ELMS_LAB_1F`)
— la règle de suppression existante dans `MapClient.tsx` (objet de décor
masqué quand un PNJ curaté au même `sprite_id` est à distance de Chebyshev
≤ 1) supprime déjà correctement le doublon pour ce cas précis. Fausse
alerte confirmée pour Elm — **non re-corrigé**, conformément à la
consigne.

**Vérification demandée** : le seuil « 1 tuile » a été choisi pour Elm's
Lab spécifiquement et pourrait être trop étroit ailleurs. Recherche
systémique : `grep '"sprite_id"' content/map/npcs.json` → **seulement 4
entrées dans tout le jeu** portent un `sprite_id` (`mom_new_bark` →
`SPRITE_GSMAMA`, `prof_elm_lab` → `SPRITE_DOCTOR`, `policeman_new_bark` →
`SPRITE_POLICEMAN`, `silver_spying_new_bark` → `SPRITE_HNS_SILVER`), toutes
à Bourg Geon. Pour chacune, distance réelle au décor ROM du même
`sprite_id` dans la même zone, calculée directement sur
`src/data/zone-registry.json` :

| PNJ curaté | Décor ROM même `sprite_id` | Distance (Chebyshev) | Couvert par la règle actuelle ? |
|---|---|---|---|
| `mom_new_bark` (6,6) | `obj_T20R0201_gsmama` (6,7) | 1 | Oui |
| `prof_elm_lab` (5,4) | `obj_T20R0101_doctor` (6,5) | 1 | Oui |
| `policeman_new_bark` | *aucun décor `SPRITE_POLICEMAN` dans sa zone* | — | Sans objet (pas de doublon possible) |
| `silver_spying_new_bark` | `obj_T20_gsrivel` (`SPRITE_GSRIVEL`, alias via `SPRITE_ALIASES`) | — | Oui, **zone-wide sans condition de distance** (voir commentaire `MapClient.tsx` — l'alias n'a jamais eu de garde de distance, contrairement au cas `sprite_id` exact) |

**Conclusion Partie B : aucune brèche trouvée.** Les 4 seuls PNJ curatés
du jeu entier à porter un `sprite_id` sont soit à distance 1 (couverts par
la règle exacte), soit sans décor concurrent dans leur zone, soit couverts
sans condition de distance via `SPRITE_ALIASES`. Aucun des deux nouvelles
zones de cette passe (Ville Griotte, Route 30) n'a de PNJ curaté avec
`sprite_id` du tout. Le seuil « 1 tuile » n'a donc besoin d'être élargi
nulle part avec le contenu actuel — **pas de changement de code fait ici**
(élargir un seuil sans cas réel à couvrir aurait été une modification
spéculative, contraire à la méthode de cette session). Le signalement
utilisateur reste très probablement un cache navigateur/déploiement
obsolète de son côté, pas un bug de contenu.

**Effet de bord découvert en passant, hors du périmètre strict de la
Partie B mais du même esprit** (recherche exhaustive `content/map/npcs.json`
× `zone-registry.json`) : **20 paires d'objets de décor** (pas
décor+PNJ-curaté, deux OBJETS DE DÉCOR entre eux) partagent exactement la
même tuile dans le jeu, motif déjà identifié et volontairement laissé de
côté lors de la passe Bourg Geon (« pattern différent — à trancher
séparément si ça gêne en jeu »). Deux nouvelles occurrences trouvées à
Ville Griotte, dans `MAP_CHERRYGROVE_POKECENTER_1F` (6,4) et (11,4) :
`pcwoman2_2`/`pcwoman2_4` et `pcwoman2_3`/`pcwoman2_5` — des variantes
ROM du même emploi de guichetière selon l'état club Wifi ouvert/fermé
(flags `FLAG_HIDE_COMM_CLUB_RECEPTIONISTS` vs
`FLAG_HIDE_COMM_CLUB_CLOSED_LADIES`, jamais modélisés côté moteur donc les
deux s'affichent). Même nature que les 20 déjà recensés — **pas corrigé
ici**, conforme à la décision déjà prise de traiter ce pattern séparément.

### Ville Griotte (Cherrygrove) — bugs trouvés et corrigés

**Captures d'écran, 2 bugs systémiques trouvés en vérifiant Ville
Griotte, corrigés dans `build-zone-registry.py` (s'appliquent à tout le
jeu, pas qu'à cette ville)** :

1. **`MAP_CHERRYGROVE_POKEMART` avait un `screenshot` VIDE** (repli sur la
   grille de collision colorée, aucune image). Cause : le mot-clé de zone
   `pokemart` (un seul mot, `MAP_CHERRYGROVE_POKEMART` n'a pas de
   séparateur entre POKE et MART) ne matchait jamais les fichiers
   disponibles (`Poké Mart HGSS.png`, `Poké Mart interior HGSS.png`, deux
   mots dans le nom de fichier) — `matched_count` restait à 0 dans
   `score_against`, et `pokemart` n'était pas dans `GENERIC_TEMPLATES`
   pour retomber sur un repli générique. **13 zones `*_POKEMART`** dans
   tout le jeu avaient ce défaut (vérifié : les 13 avaient `screenshot:
   ""`, seule `MAP_FRONTIER_ACCESS_POKEMART` y échappait via un autre
   match). **CORRIGÉ** : `("pokemart", "Poké Mart interior HGSS.png")`
   ajouté à `GENERIC_TEMPLATES`.
2. **`MAP_CHERRYGROVE_POKECENTER_B1F` affichait EXACTEMENT la même image
   que son propre 1F** (`Pokémon Center inside HGSS.png`, le comptoir
   d'accueil) alors que son contenu réel (`obj_..._wifisf`,
   `script:std_wifi_reception`, 2× `pcwoman2`) est le Club Wifi/salle
   d'échange, une pièce visuellement différente — même classe de bug que
   « la chambre à l'étage affiche la cuisine du dessous » déjà corrigée
   pour les maisons (§ G/2ᵉ étage), jamais étendue au repli `pokecenter`
   qui restait un mot-clé plat sans distinction d'étage. Vérifié
   systémique : **23 zones `*_POKECENTER_B1F`/`_2F`** dans tout le jeu
   avaient ce défaut, toutes avec le même contenu ROM standard (Club
   Wifi). **CORRIGÉ** : repli `pokecenter` rendu sensible à l'étage comme
   `house` (`zone_floor_token`), avec `Union Room HGSS.png` (capture
   trouvée dans `public/maps/`, salle verte à plots d'échange — bien plus
   proche visuellement du contenu réel que le comptoir du 1F) comme repli
   étage non-rez-de-chaussée. Registre régénéré, diff exhaustif vérifié :
   exactement 43 zones changées (13 Pokémarts + 23 Pokémon Centers B1F/2F
   + 7 guérites — un correctif de la passe Route 29 resté non commité,
   pas introduit ici), aucun champ hors `screenshot`/`scale_x`/`scale_y`/
   `screenshot_w`/`screenshot_h` touché.

**Deux PNJ curatés vivaient à tort sur la zone EXTÉRIEURE alors que leur
propre `role_origin` dit explicitement qu'ils sont À L'INTÉRIEUR** — même
bug de fond que Mom/Elm avant issue 12 (« PNJ d'intérieur aplati sur la
zone extérieure »), jamais détecté pour Ville Griotte faute de couverture
de test (le test `les PNJ d'intérieur sont servis DANS leur pièce`
n'incluait que Bourg Geon) :

- **Vendeuse du Mart** (role_origin « Comptoir du fond ») : était générée
  en `(44,8)` sur `MAP_CHERRYGROVE` (zone extérieure), sans repère ROM.
  L'objet ROM `obj_T21FS0101_shopm1_2` (sans flag conditionnel, donc
  toujours présent) vit DANS `MAP_CHERRYGROVE_POKEMART` en `(2,6)` — mais
  cette tuile s'est révélée être dans une alcôve murée sans AUCUN voisin
  marchable (vérifié par BFS exhaustif sur les 70 tuiles praticables de la
  pièce : `(2,6)` n'en fait pas partie, même défaut « injoignable » que
  Elm avant issue 12). **CORRIGÉE** : repositionnée en `(8,3)`, la tuile
  de comptoir la plus proche réellement atteignable (dos au mur nord,
  face au sud vers le joueur qui approche par `(8,4)`), toujours dans
  `MAP_CHERRYGROVE_POKEMART`.
- **Guide Gent** (role_origin « Accueille le joueur à l'entrée, fait
  visiter la ville ») : était généré en `(35,0)`, un point arbitraire en
  haut de carte sans rapport avec la scène, `source: "generated"`.
  L'objet ROM `obj_T21_gsoldman1` porte le flag
  `FLAG_HIDE_CHERRYGROVE_GUIDE_GENT` — qui NOMME explicitement ce
  personnage — en `(54,12)` sur la zone extérieure elle-même (pas un
  intérieur cette fois), face au sud (`facingDirection` ROM 1, déjà la
  valeur retenue). **CORRIGÉE** : repositionné dessus, walkable, 4
  voisins praticables vérifiés.

Les deux corrections mises à jour dans `content/map/npcs.json` ET
`content/map/placements/cherrygrove-city.json` (`source: "rom_matched"`,
`matched_object_id`/`matched_sprite_id` renseignés), même convention que
les corrections Silver/Lyra de Route 29.

**Reste de Ville Griotte vérifié sans changement** : les 11 objets de
décor + 5 warps de la zone extérieure, tous walkable et à l'écart des
portes (vérifié programmatiquement : aucun objet exactement sur une tuile
de warp dans les 7 zones de Ville Griotte). Les 3 maisons génériques
(southwest, southeast, guide-gent) : chacune a son unique objet de décor
sur une tuile praticable, repli écran générique déjà documenté comme
limite connue (aucune capture dédiée disponible pour ces maisons
d'habitants quelconques, § dédié plus haut). Le Centre Pokémon 1F
(`pokecenter_clerk_cherrygrove`, déjà corrigé à l'issue 12) reste
cohérent avec le nouveau screenshot correct. `silver_card_cherrygrove`
(trophée après embuscade) et `silver_apparition1_cherrygrove` (embuscade,
déjà réglée à l'issue 12 avec preuve BFS dans `a1-traversal.test.ts`) :
inchangés, toujours corrects.

### Route 30 — bug trouvé et corrigé (le plus significatif de cette passe)

**Trois PNJ majeurs de la quête de l'œuf mystère — Mr. Pokémon, le
Pr. Oak et l'Apricorn Man — vivaient à tort sur la zone EXTÉRIEURE
`MAP_ROUTE_30` au lieu de leurs maisons respectives**, alors que leurs
`role_origin` le disent explicitement (« Confie un œuf mystère », «
Présent CHEZ Mr. Pokémon », « Homme DANS UNE MAISON »). Les trois étaient
`source: "generated"`, aucun repère ROM, positions arbitraires (`(22,45)`,
`(6,54)`, `(21,33)`) sur la carte extérieure. Croisement avec
`scripts/sources/zone-data.json` : les objets ROM existent bel et bien,
DANS les deux intérieurs dédiés (`MAP_ROUTE_30_MR_POKEMON_HOUSE`,
`MAP_ROUTE_30_APRICORN_HOUSE`) :

- `obj_R30R0201_gsgentleman` (`SPRITE_GSGENTLEMAN`, Mr. Pokémon) en
  `(9,7)`, face à l'ouest — dans `MAP_ROUTE_30_MR_POKEMON_HOUSE`.
- `obj_R30R0201_ookido` (`SPRITE_OOKIDO`, Pr. Oak — flag
  `FLAG_HIDE_MR_POKEMONS_HOUSE_OAK`) en `(8,7)`, adjacent, face à l'est
  (vers Mr. Pokémon) — même zone. Les deux se font face, cohérent avec la
  scène HGSS (Oak en visite chez Mr. Pokémon).
- `obj_R30R0101_gsmiddleman1` (`SPRITE_GSMIDDLEMAN1`, Apricorn Man) en
  `(5,5)`, face au sud — dans `MAP_ROUTE_30_APRICORN_HOUSE` (l'objet du
  même nom sur la zone extérieure, à `(11,67)`, exactement sur la tuile
  de porte de cette maison et flaggé `FLAG_HIDE_ROUTE_30_APRICORN_MAN`,
  n'est qu'un doublon-parking ROM déjà neutralisé par la règle générique
  « rien ne se dessine sur une porte » — H/I — pas sa vraie position).

Les trois tuiles ROM sont walkable et ont un voisin marchable (vérifié
programmatiquement). **CORRIGÉES** : `map_zone` + position + `facing`
(repris du `facingDirection` ROM) posés dans `content/map/npcs.json` pour
`mr_pokemon_route30`, `prof_oak_route30`, `man_in_house_route30` ;
`content/map/placements/route-30.json` mis à jour en miroir
(`source: "rom_matched"`, `matched_object_id`/`matched_sprite_id`).

**Pourquoi c'est significatif** : c'est le PNJ qui donne l'objet-clé
central du jalon 1 (l'œuf mystère). Avant cette correction, il apparaissait
en plein air au milieu de la route au lieu de dans sa maison — sans
casser la mécanique de jeu (le dialogue restait accessible par A depuis
une tuile adjacente atteinte à pied, donc **aucun test existant n'avait
détecté le problème**, `checked >= 15` passait toujours), mais visuellement
et narrativement faux, et un vrai risque de confusion en jeu (« pourquoi
Mr. Pokémon marche sur la route et pas dans sa maison ? »).

**TDD** : `src/lib/a1-traversal.test.ts`, `INTERIOR_NPCS` étendu avec
`MAP_ROUTE_30_MR_POKEMON_HOUSE`/`MAP_ROUTE_30_APRICORN_HOUSE` (test rouge
d'abord — `expected [] to deeply equal ['mr_pokemon_route30', …]` —
confirmant que ces PNJ n'étaient PAS servis dans leur pièce), puis
correctif de contenu, test vert. Effet de bord attendu et corrigé en
cascade : le compteur de garde-fou `checked >= 15` (PNJ extérieurs
comptés) est descendu à 12 (4 PNJ sortis du comptage extérieur : les 3 de
Route 30 + la Vendeuse du Mart de Ville Griotte) — seuil abaissé en
conséquence, commentaire mis à jour. Un test de sécurité serveur
préexistant (`src/app/map/actions.test.ts`, « C1 ») affirmait
explicitement `current_zone = 'MAP_ROUTE_30'` pour accéder au dialogue de
Mr. Pokémon — mis à jour vers `MAP_ROUTE_30_MR_POKEMON_HOUSE`, cohérent
avec le nouveau `map_zone`.

**Reste de Route 30 vérifié sans changement** : les 3 dresseurs (Bug
Catcher Don, Youngster Joey, Youngster Mikey) déjà bien placés (source ROM
correcte, corrigés à une session précédente le 2026-07-09 selon
`placements/route-30.json`) ; les objets de décor (arbres coupables,
Apricorn trees, itemballs) tous sur du terrain praticable et à l'écart des
portes ; les 2 warps (maisons) atteignables. `MAP_ROUTE_30_MR_POKEMON_HOUSE`
et `MAP_ROUTE_30_APRICORN_HOUSE` : collision resserrée (correctif G),
walkable, écrans génériques (pas de capture dédiée, limite déjà connue).

### État concurrent du dépôt pendant cette session (transparence)

Un second agent travaillait en parallèle sur un bug « arbres traversables
» de Route 29 (`OUTDOOR_TERRAIN_PATCHES` dans `build-zone-registry.py`,
zone non touchée par cette passe). Une régénération intermédiaire de
`zone-registry.json` a temporairement cassé la traversée Bourg Geon→Route
30 (patch de collision trop large, `MAP_ROUTE_29` scindée en îlots) —
confirmé et isolé sans y toucher (désactivation temporaire du patch dans
une copie de travail, tests repassés au vert modulo un seuil déjà corrigé
ici, fichiers réels restaurés à l'identique ensuite). Résolu de son côté
avant la fin de cette session ; `npm run check` final est vert avec les
deux jeux de correctifs en place simultanément.

### Bilan de la passe Ville Griotte + Route 30

**10 zones vérifiées une par une** (rendu composite capture+repères,
BFS de connectivité, vérification programmatique porte/doublon) : 2
bugs de captures d'écran systémiques (Pokémarts, Pokémon Centers
B1F/2F — 43 zones dans tout le jeu), 3 PNJ Route 30 hors de leur maison
(le plus significatif — PNJ de quête centrale), 2 PNJ Ville Griotte hors
de leur lieu logique (dont un cas « injoignable » nécessitant un
repositionnement, pas juste un `map_zone`). Partie B (re-vérification
systémique des doublons PNJ/décor, suite au signalement utilisateur) :
**aucune brèche trouvée** dans la règle de suppression existante — les 4
seuls PNJ curatés à `sprite_id` du jeu entier sont tous correctement
couverts (distance 1 ou alias zone-wide) ; le signalement reste attribué
à un cache obsolète côté utilisateur. `npm run check` vert (typecheck,
lint 0 erreur, 550 tests, `validate:content` 0 échec).

## 2026-08-03 — « Arbres traversables » : zone identifiée, cause confirmée, corrigé à 98 % (1 tuile reste ouverte, sciemment)

Reprend l'item laissé ouvert dans le RÉSUMÉ DE SESSION (Bourg Geon extérieur
vérifié sain, mais sans savoir sur quelle zone le joueur avait réellement pu
traverser des arbres). L'utilisateur a fourni une capture d'écran du bug en
jeu.

**Zone identifiée** : `MAP_ROUTE_29`, pas Bourg Geon — comparaison visuelle
de la capture (panneau + PNJ âgé sur parcelle en terre + joueur dans un
amas de pins) contre les 4 captures candidates du jalon (`Johto Route 29
HGSS.png`, `Johto Route 30 HGSS.png`, `Cherrygrove City HGSS.png`, `New Bark
Town HGSS.png`) : correspondance exacte avec la bordure est de Route 29
(quart droit du screenshot, près de la guérite Route 29/46) — même forme de
haie sombre en L, même parcelle en terre allongée, même amas de pins, même
panneau. La 2ᵉ capture jointe (intérieur sombre à deux PNJ) est une zone
sans rapport (grotte/intérieur, aucun arbre) — écartée sans investigation.

**Cause confirmée par rendu composite** (grille de collision superposée au
vrai screenshot, PIL, comme les passes précédentes) : sur une bande
diagonale d'environ 45 tuiles (bord ouest d'un massif de pins, coordonnées
locales approx. x 76-89 / z 20-26, world x 652-665 / z 404-410),
`terrain` déclare praticable (`.`) alors que le screenshot y montre une
canopée de pins continue, **visuellement indissociable** des tuiles
voisines du même massif correctement murées (`#`). Vérifié tuile par tuile
(crops zoomés x5, pas juste la vue d'ensemble) : ce n'est ni un problème
d'alignement échelle/origine (bug G, contrôlé — `scale_x`/`scale_y`/
`world_origin_*` sont corrects sur toute la zone, les bordures nord/sud/
est/ouest du massif sont, elles, correctement murées) ni les 2 objets
`SPRITE_TREE` individuels de la zone (`obj_R29_tree`/`obj_R29_tree_2`,
ailleurs sur la carte, en dehors de la bande — et de toute façon
`resolveNpcSprite('SPRITE_TREE', …)` résout bien via
`overworld-sprite-labels.json` → `isTileOccupied` les rend déjà solides,
mécanisme (b) de la piste donnée, vérifié non fautif ici). C'est un vrai
trou dans la grille brute : **présent tel quel dans
`scripts/sources/zone-data.json`** (pas introduit par
`build-zone-registry.py`), donc fidèle à l'extraction ROM, pas un bug de
génération.

**Piste naïve rejetée (testée, pas supposée) : murer toute la bande casse
la traversée du jalon.** Premier réflexe (cohérent avec le principe déjà
appliqué à H/I : faire confiance à l'image plutôt qu'à la sémantique ROM
brute) — murer les 45 tuiles pour coller au screenshot. Régénéré,
`npm run check` → **3 tests rouges** dans `a1-traversal.test.ts` : plus
moyen d'atteindre la guérite Route 29/46, ni Ville Griotte, ni le PNJ
tutoriel Tuscany. BFS de vérification (même sémantique que `canTraverse`,
en Python sur la grille patchée) : la zone accessible depuis l'entrée est
(Bourg Geon) se retrouve enfermée dans une poche de 174 tuiles, alors que
la zone originale en a 1354 atteignables jusqu'à Ville Griotte. Recoupé
avec la grille NON patchée (source ROM brute) : **les 45 tuiles de la
bande sont TOUTES sur l'unique chemin réel** reliant l'entrée est au reste
de la zone (Ville Griotte, la guérite, les 2 PNJ) — pas une redondance,
l'unique corridor. Vérifié aussi qu'aucun sentier visible n'est caché dans
l'image à cet endroit (échantillonnage de couleur systématique sur les 45
tuiles, recherche de la teinte « chemin en terre » type parcelle du PNJ :
aucune correspondance) — le jeu original semble vraiment router le seul
passage à travers ce qui est dessiné comme une canopée pleine, sans aucun
indice visuel, un artefact qu'un vrai rendu par sprites en profondeur (le
joueur peut passer visuellement « sous » le haut d'un arbre dans le vrai
jeu DS) masquerait, mais que ce moteur (image plate + grille, sans calque)
ne peut pas masquer. Patch annulé, code entièrement retiré, `npm run
check` revert-vérifié vert (550 tests) avant de retenter autrement.

**Deuxième passe — sous-ensemble sûr, trouvé par recherche gloutonne
vérifiée** : plutôt que tout ou rien, recherche du plus grand sous-ensemble
de ces 45 tuiles muable sans casser aucun chemin obligatoire réel (les 2
tuiles de la porte de la guérite, l'adjacence des 2 PNJ de la zone —
Lyra/Ethan tutoriel en `(85,16)`, Tuscany en `(38,8)` —, le bord ouest vers
Ville Griotte). Chaque tuile testée une par une contre un BFS complet
(garder si le mur ne casse aucun des points obligatoires, sinon la laisser
praticable) : **44 des 45 tuiles peuvent être murées sans casser aucun
chemin obligatoire** — une seule, `(76, 24)`, doit rester praticable (le
passage réel ne fait qu'une tuile de large à cet endroit précis, un
goulot). Implémenté dans `build-zone-registry.py`
(`OUTDOOR_TERRAIN_PATCHES`, appliqué juste après `trim_terrain`, portée
strictement limitée à `MAP_ROUTE_29` — pas une correction générique par
couleur appliquée à tout le jeu, testée séparément et bien trop de faux
positifs sur le reste de la carte pour être fiable sans vérification
tuile par tuile). Registre régénéré et diff vérifié : **seul le `terrain`
de `MAP_ROUTE_29` change** (`scripts/sources/zone-data.json` comparé au
registre final pour `MAP_NEW_BARK`/`MAP_CHERRYGROVE`/`MAP_ROUTE_30` :
identique bit à bit, aucune des 3 autres zones du jalon touchée).
`npm run check` vert (550 tests, y compris les 3 qui avaient rougi à la
première tentative). Rendu composite avant/après : l'amas de pins visible
sur la capture de l'utilisateur (près du panneau/de la parcelle en terre)
est maintenant intégralement muré ; la seule tuile encore praticable de
la bande (`76,24`) est excentrée (coin sud-ouest du massif, contre la
haie déjà praticable), hors du cadre de la capture fournie.

**Statut : fermé pour la zone et la scène précisément signalées** (le
joueur ne peut plus se retrouver visuellement dans l'amas de pins près du
panneau). **Limite assumée, pas cachée** : une seule tuile
(monde `652,408`) reste praticable sans indice visuel — un joueur qui
marche pile dessus verrait encore le même artefact sur 1 tuile au lieu de
45 ; corriger ce dernier cas demanderait soit un vrai calque de profondeur
sprite (fonctionnalité moteur hors périmètre), soit repeindre le
screenshot pour y dessiner un sentier visible (retouche d'asset graphique,
pas tentée ici, à rouvrir en tâche de contenu dédiée si ça gêne en jeu).

**Autres zones du jalon vérifiées, aucune trace du même défaut** :
rendu composite (grille superposée) sur `MAP_NEW_BARK`, `MAP_CHERRYGROVE`,
`MAP_ROUTE_30` — les trois ont leurs bordures de forêt intégralement
murées, aucun trou visible de cette classe. Pas une recherche exhaustive
tuile par tuile comme sur Route 29 (qui n'a été faite qu'après avoir
localisé le bug via la capture), donc ne pas exclure un cas similaire
ailleurs dans le jeu si signalé — mais rien trouvé sur les 4 zones du
jalon 1 en dehors de Route 29.

---

## 2026-08-03 — 2ᵉ trou « arbres traversables » sur Route 29 (capture
## différente), + triage d'un scanner automatique de trous de collision

**Contexte** : nouveau signalement utilisateur, nouvelle capture d'écran
(le joueur toujours visiblement planté dans les pins de Route 29, mais un
amas différent — plus central/occidental — de celui corrigé ci-dessus,
qui était près de la guérite est). Un outil de scan a aussi été fourni en
tâche (`​.scratch/kanji-no-niwa/canopy_scan_draft.py`, brouillon non
testé en profondeur) : échantillonne la couleur de chaque tuile
praticable, la compare à la couleur moyenne des tuiles murées de la même
zone contre celle des autres tuiles, et flague les tuiles praticables
« couleur mur » qui ont ≥60 % de voisins murés — 60 zones extérieures sur
72 flaguées, présumé bruyant. Deux volets : (1) confirmer et corriger le
nouveau trou, (2) trier le scanner sur plusieurs zones pour juger s'il est
exploitable.

### Localisation du nouveau trou

Identification visuelle rigoureuse comme la 1ʳᵉ fois : la capture montre
6 personnages distincts ; en comparant chacun à la planche de sprite du
joueur (`protagonist_ethan_ow.png`, casquette noire/jaune, veste
rouge/noire) plutôt qu'en supposant que le personnage le plus visible est
le joueur, **le vrai joueur est celui en bas au centre de la capture,
debout au milieu d'une canopée de pins dense et uniforme** — les 5 autres
personnages (dont un dans une petite clairière clôturée à un seul pin,
souvent prise à tort pour « le » joueur car plus proéminente) sont des
PNJ ROM de la zone (gsboy2, gsbigman, gsman1, gswoman2…), identifiables
par leur tenue différente (pas de casquette noire/jaune ni de veste
rouge/noire).

Recalage précis capture↔asset : plusieurs méthodes pixel (corrélation
croisée sur le motif répétitif des pins pour mesurer l'échelle réelle du
rendu en jeu — ~51 px/tuile en largeur contre les 16,47 px/tuile de la
capture statique enregistrée, soit un facteur d'agrandissement ~3,1× côté
utilisateur — puis ancrage sur un repère non ambigu, le perron de la
guérite, présent et mesurable dans les deux images) situent le joueur
autour de la tuile locale **x≈43**, confirmé ensuite par recherche visuelle
directe (comparaison de la texture — grille uniforme de pins avec points
cyan, distincte du style « amas de tuftes arrondis » du centre de la
carte) : la vraie bordure sud de canopée (z 23-31), pas la zone centrale
déjà vérifiée saine par la passe précédente.

**Cause confirmée par rendu composite + classification couleur tuile par
tuile** (même principe que le scanner fourni, mais sans le filtre
« ≥60 % voisins murés » — voir plus bas pourquoi il ne suffit pas ici) :
deux poches de tuiles `terrain='.'` (praticables) dont la couleur
échantillonnée est objectivement plus proche de la moyenne des tuiles
murées de la zone que de la moyenne du reste, à l'intérieur d'une canopée
visuellement continue :
- **poche ouest** (x 6-11, z 23-28) : petite, en bordure d'une entrée
  d'eau (non touchée).
- **poche centrale** (x 30-75, z 24-28) : bien plus grande — ~30 tuiles
  de large, en forme d'escalier (le trou se décale vers l'est à mesure
  que z augmente, suit le contour réel de la canopée) — c'est celle
  visible dans la capture de l'utilisateur (x≈43 tombe dedans, dans les
  deux poches à z 25-28 selon la ligne).

188 tuiles candidates au total (identifiées par comparaison de couleur,
pas par simple étendue de `terrain='.'` contiguë — important : certaines
tuiles `.` adjacentes à la canopée, ex. x 42-61 à z=24, ont une couleur
d'herbe/eau normale, pas de pin — les murer aurait introduit un NOUVEAU
bug, un carré d'herbe visible devenu invisible-mur).

### Piste initiale erronée, corrigée avant tout commit

Premier essai : murer les 188 tuiles d'un coup, en supposant (par analogie
avec la 1ʳᵉ correction, où la bande était un cul-de-sac atteint seulement
par des ledges à sens unique) que cette poche était elle aussi un
cul-de-sac. `npm run check` a rougi : 3 tests `a1-traversal.test.ts`
(guérite injoignable, PNJ Tuscany injoignable, Route 29 ne relie plus
Ville Griotte ni Route 30). Diagnostic par BFS Python répliquant fidèlement
`bfsOutdoor`/`canTraverse`/les ledges à sens unique de `zone-geometry.ts`
(vérifié en reproduisant exactement l'échec du test réel avant de creuser)
a montré l'hypothèse fausse : contrairement à la bande de la 1ʳᵉ
correction, le chemin ouest-est de la bande z10-18 (la voie « normale »)
est en réalité coupé en plusieurs segments par les massifs de pins de
cette même bande (vérifié : `z=18` est la seule ligne quasi entièrement
ouverte sur toute la largeur, les lignes voisines ont des murs qui
segmentent la traversée) — le chemin réel contourne par le sud, plonge
dans cette poche via les ledges de la rangée z=23, la traverse
partiellement, et en ressort par un passage à pied ordinaire (pas un
ledge, donc à double sens) cousu dans son coin sud-est. Reproduit le même
principe que la tuile résiduelle `(76, 24)` de la 1ʳᵉ correction, à plus
grande échelle.

**Corrigé par recherche gloutonne tuile par tuile** (même méthode que la
1ʳᵉ correction : chaque tuile testée une à une contre un BFS complet —
les 2 tuiles de la guérite, l'adjacence des 2 PNJ de la zone, les 4 zones
du continuum toutes atteintes depuis le spawn — gardée murée si rien ne
casse, sinon rendue praticable) sur les 188 tuiles candidates : **167
murables, 21 doivent rester praticables** (le passage réel, invisible à
l'image — concentré autour de x=61 et x=62-75 en bas de la poche).
`scripts/build/build-zone-registry.py`, `OUTDOOR_TERRAIN_PATCHES["MAP_ROUTE_29"]` étendu (portée strictement
limitée à cette zone, comme la 1ʳᵉ correction). Registre régénéré, diff
vérifié exhaustivement : seul le `terrain` de `MAP_ROUTE_29` change, rien
d'autre. `npm run check` vert (550/550 tests, y compris les 3 qui avaient
rougi au premier essai).

### Triage du scanner (`canopy_scan_draft.py`) sur d'autres zones

Vérification visuelle (rendu composite) de plusieurs candidats du scanner
en dehors de Route 29 :

- **`MAP_ROUTE_30`** (dans le périmètre du jalon 1) : 477 tuiles flaguées
  par simple classification couleur (sans le filtre voisinage — avec, le
  scanner original n'en trouve que 21, très bruités). 4 zones de la carte
  vérifiées par rendu composite (nord, un pont/rivière avec falaises,
  un amas d'arbres près d'une maison, le bord ouest de canopée) :
  **toutes des faux positifs** — la couleur moyenne « mur » de cette zone
  mélange arbres ET falaises/pont en pierre grise, donc les tuiles d'eau
  ou de falaise sombres matchent par coïncidence la même moyenne que les
  pins. Aucun vrai trou trouvé, cohérent avec la vérification (plus
  sommaire) de la session précédente sur cette même zone. **Non modifié.**
- **`MAP_ROUTE_36`** (hors périmètre) : un vrai trou confirmé visuellement
  (rendu composite, tuiles locales ≈ x 50-53, z 4-9, canopée dense
  identique à ses voisines murées) — même classe de bug que Route 29,
  plus petit (~20 tuiles). **Non corrigé** (hors périmètre jalon 1),
  signalé pour un futur passage.
- **`MAP_VIRIDIAN`** (Forêt de Jade, hors périmètre) : 1 zone vérifiée par
  rendu composite (amas d'arbres arrondis type « tuftes », proche du
  style qui a produit du bruit ailleurs) — correctement murée, pas de
  trou visible. Vérification partielle (une seule zone sur une carte de
  64×64), pas concluante à 100 % mais aucun signal fort.
- **`MAP_RUINS_OF_ALPH`** (hors périmètre) : zone à part — `scale_y=2,5`
  (image quasi non lisible une fois rendue, texture pierre/eau très
  écrasée verticalement) et terrain rocheux/aquatique, pas une canopée.
  Le scanner suppose implicitement un terrain « arbres sur herbe » (sa
  moyenne « mur » vs « reste » n'a de sens que pour ce cas) ; sur cette
  zone la comparaison couleur mélange roche grise et eau turquoise sans
  rapport avec le bug recherché. Non concluant, probablement pas
  applicable tel quel.

### Recommandation sur le scanner

**Vaut la peine d'être gardé comme outil de présélection, pas comme
détecteur autonome, et pas sans les correctifs suivants :**

1. **Le filtre « ≥60 % voisins murés » sous-compte les gros trous.** Une
   tuile au MILIEU d'un trou large (comme la poche centrale de cette
   correction, ~30 tuiles de côté) n'a presque aucun voisin mur — juste
   d'autres tuiles-trou — donc le filtre ne capte que sa bordure. C'est
   ce qui a fait rater ce 2ᵉ trou par une lecture superficielle des
   résultats du scanner (candidats épars, pas de « bloc » visible dans
   la sortie brute) alors que le trou réel faisait ~190 tuiles. **Piste
   de correctif** : remplacer le filtre de voisinage par une analyse en
   composantes connexes — regrouper les tuiles couleur-mur contiguës en
   îlots, garder l'îlot si sa bordure EXTÉRIEURE (pas chaque tuile
   individuelle) est majoritairement murée.
2. **La comparaison de couleur globale par zone est trop grossière pour
   les zones à plusieurs textures de mur** (Route 30 : arbres + falaises
   + pont en pierre dans la même moyenne « mur ») — cause principale du
   bruit observé. **Piste de correctif** : clustering (k-means, 2-4
   classes) des couleurs de tuiles murées par zone au lieu d'une moyenne
   unique, comparer chaque tuile candidate à la classe la plus proche
   plutôt qu'à une moyenne globale.
3. **Le scanner suppose implicitement une zone « canopée sur herbe ».**
   Zones à faible variance de couleur mur/reste (Ruins of Alph, roche
   uniforme) ou à échelle de rendu dégénérée (`scale_y` très petit)
   produisent du bruit sans rapport. Piste : ignorer les zones où
   `dist(solid_mean, other_mean)` est trop faible (peu de contraste entre
   mur et sol — la méthode n'a alors aucun pouvoir discriminant) plutôt
   que de les scanner quand même.
4. Même avec ces trois correctifs, **une confirmation visuelle humaine
   (rendu composite) reste nécessaire avant toute correction** — la
   sémantique couleur seule ne suffit jamais à distinguer un vrai trou
   d'un chemin en terre discret ou d'un effet de bord d'eau/ombre, comme
   déjà établi pour la 1ʳᵉ correction Route 29.

**Verdict** : promouvoir sous `scripts/validate/` en outil de
présélection (« liste de zones/tuiles à vérifier à l'œil », jamais
« liste de tuiles à corriger automatiquement »), après les correctifs 1
et 2 ci-dessus. Sur cette session, sur 5 zones effectivement vérifiées à
l'œil (Route 29 ×2 poches, Route 30, Route 36, Viridian), 2 vrais trous
trouvés (dont un raté par la première lecture du scanner à cause du
défaut n°1) et le reste bruit confirmé — un taux qui justifie l'outil
comme point de départ d'une QA zone-par-zone future, à condition de
toujours vérifier à l'œil avant de corriger.

**Fichiers modifiés** : `scripts/build/build-zone-registry.py`
(`OUTDOOR_TERRAIN_PATCHES["MAP_ROUTE_29"]`), `src/data/zone-registry.json`
(régénéré, seul `MAP_ROUTE_29.terrain` change). `npm run check` vert.
