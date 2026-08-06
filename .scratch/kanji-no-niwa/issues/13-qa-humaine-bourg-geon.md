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

## 2026-08-03 — « セーブできませんでした » (écran de sauvegarde impossible) en
fin de leçon : `public.kanji` n'avait qu'1 ligne en base Neon — PAS un bug de
logique/ordre de leçon

**Signalement utilisateur** : bloqué à l'écran « セーブできませんでした »
(sauvegarde impossible) à la toute fin de la 1ʳᵉ leçon (Bourg Geon,
séquence 1, PNJ Elm, kanji 一二人先入八) — le bouton retenter ne fait rien,
la leçon est rejouable à l'infini sans jamais se compléter.

### Cause racine — pas une régression du moteur de leçon

La table `public.kanji` (contenu, censée porter les ~2136 kanji Jōyō —
`db/migrations/001_initial_schema.sql`) **n'avait qu'une seule ligne en
base Neon réelle : `一`**. `public.cards.kanji_id references public.kanji`
— donc `completeLesson()` (`src/app/lesson/actions.ts`) plante avec
`cards_kanji_id_fkey` (violation de clé étrangère) au premier kanji de la
boucle d'insertion des cartes SRS qui n'est PAS `一`, c'est-à-dire dans
quasiment toute vraie leçon (une leçon typique a 5-6 kanji). Le client
(`src/app/lesson/BookScreen.tsx`) attrape l'erreur générique et affiche
l'écran de sauvegarde impossible — d'où l'apparence d'un bug de logique
(ordre des leçons, session SRS, etc.) alors qu'il s'agit d'un trou de
seeding de base de données pur, en amont de tout code applicatif.

Vérifié directement en rejouant l'insertion réelle pour la leçon en
attente de l'utilisatrice bloquée : `insert or update on table "cards"
violates foreign key constraint "cards_kanji_id_fkey"` pour chacun des
6 kanji sauf `一`.

**Pourquoi ce trou était invisible en dev** : des scripts d'import
existent déjà et font exactement ce travail —
`scripts/import/import-kanjidic2.ts` (peuple `kanji` depuis
`kanjidic2.xml.gz`), `import-kanjivg.ts` et `import-kradfile.ts` (peuplent
`kanji_components`) — mais n'avaient jamais été exécutés contre la base
Neon réelle (seulement, vraisemblablement, contre une base locale/de test
à un moment donné, ou pas du tout — un seul kanji de smoke-test `一`,
avec des lectures on en hiragane minuscule non standard, trainait dans la
table réelle). `vocabulary`, `sentences`, `dialogues` et la table DB
`lessons` sont elles-mêmes mortes/jamais lues à l'exécution (tout le vrai
contenu vient de `content/*.json` / `src/data/kanji-content.json`
— seule `kanji` (+ `kanji_components`) est une vraie dépendance runtime,
via la FK `cards.kanji_id`).

### Correctif

Migration `db/migrations/008_seed_kanji.sql`, générée par un script
one-off (`scripts/build/_tmp_generate_kanji_seed.mjs`, non committé —
usage unique) à partir de :
- `src/data/kanji-content.json` (2136 entrées : id/meanings/on/kun/jlpt/
  grade/etymology/mnemonic — mappés vers les colonnes réelles, ex.
  `on`→`on_readings`, `jlpt`→`jlpt_level`) ;
- `scripts/sources/kanjidic2.xml.gz` (stroke_count, apparié par literal —
  **piège trouvé en générant** : kanjidic2 répète parfois `<stroke_count>`
  dans un même `<misc>` [ex. 緻 : 16 puis 15], et fast-xml-parser
  arrayifie silencieusement l'élément répété → `Number([...])` = `NaN`
  si on ne prend pas le premier. Corrigé dans le générateur ; **ce même
  piège existe tel quel dans `scripts/import/import-kanjidic2.ts`**, pas
  corrigé là — à surveiller si ce script est un jour rejoué) ;
- `unicode_hex` dérivé trivialement du codepoint du caractère ;
- `scripts/sources/kradfile` + `kradfile2` (décomposition en composants,
  restreinte aux deux côtés dans l'ensemble des 2136 kanji Jōyō) pour
  `kanji_components` (source `'kradfile'`) — **2ᵉ piège trouvé** :
  `scripts/import/import-kradfile.ts` lit ces fichiers avec
  `Buffer.toString('latin1')`, alors qu'ils sont encodés EUC-JP ; Node n'a
  pas de décodeur EUC-JP intégré sur `Buffer`, donc ce script de la
  pipeline lit en réalité du charabia et ne matche jamais aucun kanji
  connu (`known.has(kanji)` toujours faux) — **probablement un no-op
  silencieux depuis toujours, à corriger séparément si la pipeline est
  reprise**. Le générateur one-off contourne le problème avec le
  `TextDecoder('euc-jp')` global de Node (ICU complet, décode
  correctement — vérifié). `kanji.component_ids` (colonne jsonb sur
  `kanji` elle-même) reste à son défaut `'[]'` : aucun script de la
  pipeline existante ne la peuple non plus, seul `kanji_components` l'est.

Résultat en base (vérifié par requête directe) : **2136 lignes dans
`kanji`** (compte exact attendu, = nombre de clés de
`kanji-content.json`), **4828 arêtes dans `kanji_components`** (toutes
`source='kradfile'`). Migration idempotente (`on conflict ... do
nothing`) — safe à rejouer.

**Non touché, sciemment** : la ligne préexistante `一` (déjà en base
avant cette migration) garde ses valeurs `stroke_count`/`grade`/
`unicode_hex` à `null` et ses lectures on en hiragane minuscule
non standard (`いち`/`いつ` au lieu de `イチ`/`イツ`) — visiblement une
ligne de smoke-test insérée à la main tôt dans le projet.
`on conflict (id) do nothing` ne l'a pas mise à jour. Sans impact
fonctionnel (la FK est satisfaite, seul le contenu affiché pour ce
kanji spécifique est légèrement daté) — followup mineur possible :
un `update` ciblé sur cette seule ligne pour l'aligner sur le reste.

### Déblocage direct de l'utilisatrice réelle

Base Neon dev n'a qu'un seul vrai compte (`id` `111715249172582191124`,
nom dresseuse « りこ »). Après la migration, rejoué le corps exact de
`completeLesson('new-bark-town', 1, tzOffset)`
(`src/app/lesson/actions.ts`) via un script one-off qui importe les mêmes
modules que l'action réelle (`@/lib/content`, `@/lib/player-state`,
`@/lib/lessons`, `@/lib/condition-effect`, `@/lib/db`) avec l'id
utilisateur en dur — seul `requireUserId()` (session Auth.js, pas
appelable hors requête HTTP) est contourné, toute la logique métier
tourne inchangée. Résultat :
- `resolveLessonInteraction` confirme la leçon en tête, déverrouillée
  (re-validation serveur passe) ;
- 12 cartes SRS au total pour 一二人先入八 (2 facettes × 6 kanji) — 10
  nouvelles + les 2 déjà présentes (orphelines de la 1ʳᵉ tentative
  échouée avant le correctif, `一`/sens+lecture, laissées telles quelles,
  sans impact — l'insert est `on conflict do nothing`) ;
- `user_map_state.completed_lessons` contient désormais `new-bark-town#1`
  (format confirmé via `lessonId()` dans `src/lib/lessons.ts`) ;
- `npc_quest_progress` a une nouvelle ligne
  `lessons-new-bark-town` → `current_step: 'lesson-1'` (quête implicite
  d'ordre des leçons, avancée) ;
- `grammar_encounters` a une ligne `N5-001` (point de grammaire de la
  leçon, first-seen).

La leçon en attente de l'utilisatrice réelle est donc bel et bien
complétée de bout en bout, en base — au prochain login elle devrait
voir la leçon 2 disponible plutôt que de rester coincée sur la leçon 1.

### `npm run check`

Vert après la migration : typecheck OK, lint 0 erreur (3 warnings
préexistants sans rapport), **39 fichiers de tests / 550 tests passés**,
`validate:content` sans bloquant (warnings de densité kanji préexistants,
sans rapport avec ce correctif).

### Recommandation non traitée (followup, pas bloquant)

Rien dans ce dépôt ne vérifie qu'une base Neon fraîchement provisionnée a
bien tout son contenu de référence (`kanji` en particulier) avant mise en
service — c'est exactement ce qui a permis à ce trou de rester invisible
jusqu'à une vraie session de jeu. Une vérification serait utile (ex. un
script qui compare le compte de `kanji-content.json` à
`select count(*) from kanji`, et idéalement une assertion que
`cards.kanji_id` n'a aucune valeur orpheline potentielle) mais nécessite
une dépendance Postgres côté Python (aucune dans ce dépôt aujourd'hui —
la convention `scripts/validate/*.py` est jusqu'ici 100% fichiers
statiques, zéro accès DB) ou un script Node/TS séparé de la convention
`scripts/validate/`. Laissé en l'état, à trancher avec l'utilisateur.

**Fichiers modifiés** : `db/migrations/008_seed_kanji.sql` (nouveau —
2136 lignes `kanji`, 4828 lignes `kanji_components`), appliqué à la base
Neon réelle. `public.user_map_state`, `public.cards`,
`public.npc_quest_progress`, `public.grammar_encounters` du compte réel
`111715249172582191124` mis à jour via le rejeu légitime de
`completeLesson`. Aucun fichier de contenu/sprite touché. `npm run check`
vert (550 tests).

---

## Audio humain Tatoeba pour `lesson_examples` (2026-08-04)

Contexte : le premier passage de `lesson_examples[]` (audio `say` macOS,
qualité jugée insuffisante par l'utilisateur) est remplacé, là où
possible, par du vrai audio humain sous licence permissive tiré du corpus
Tatoeba, avec repli TTS pour le reste — cf. `scripts/sources/tatoeba_jpn_eng.json`
(231 674 phrases JP avec `kanji_set` précalculé) et l'export officiel
`sentences_with_audio.tar.bz2`.

### Couverture obtenue

- **404 / 2136 kanji** ont reçu 2 exemples Tatoeba (audio humain réel,
  remplacement intégral de `lesson_examples[]`).
- **1072 kanji** ont exactement 1 candidat Tatoeba qualifiant identifié
  mais **non utilisé** dans cette passe (règle : remplacement intégral ou
  report, jamais de mélange TTS+Tatoeba dans un même kanji — voir
  « Décisions » ci-dessous) — conservé en méta-donnée bonus dans le fichier
  de trous pour la passe de suivi.
- **654 kanji** n'ont aucun candidat Tatoeba qualifiant.
- Total : **1726 kanji** encore en attente d'un passage TTS cloud
  (`still_needed: 1` × 1072, `still_needed: 2` × 654), listés dans
  `.scratch/kanji-no-niwa/tatoeba-audio-gaps.json`.

Le filtre de licence est le facteur limitant principal : sur les
1 239 255 enregistrements audio Tatoeba (toutes langues), la licence
`CC BY-NC-ND 3.0` (« pas de dérivés », explicitement exclue par consigne)
représente à elle seule ~77 % du total ; une fois restreint à
CC0/CC-BY/CC-BY-NC **et** à la langue japonaise, il ne reste que **1292
phrases JP** avec audio licite (sur 231 674 phrases JP au total) — d'où
une couverture par kanji nécessairement modeste malgré une bonne
correspondance phrase→kanji.

### Méthodologie

1. **Index audio** : téléchargement de `sentences_with_audio.tar.bz2`
   (export officiel), filtrage aux licences CC0/CC-BY/CC-BY-NC (strict,
   `CC BY-NC-ND`/`CC BY-SA` explicitement exclues malgré leur volume).
   **Piège rencontré** : l'ordre des colonnes de ce CSV est
   `sentence_id, audio_id, username, license, url` — l'hypothèse initiale
   inversait les deux premières colonnes, ce qui produisait des
   correspondances kanji→phrase en apparence plausibles mais un `audio_id`
   bogué (`/audio/download/<id>` sur un id en réalité un `sentence_id` →
   404 dans ~90 % des cas). Détecté par vérification manuelle d'un
   échantillon téléchargé avant de lancer le gros du volume — cf. la
   description officielle du format sur `tatoeba.org/en/downloads`.
2. **Sélection par kanji** : parmi les phrases JP dont `kanji_set` contient
   le kanji ET qui ont un enregistrement licite, tri par (longueur,
   nombre de `、`, ponctuation « littéraire » `「」…` etc., nombre de
   kanji distincts) croissant — proxy simple pour « courte, une seule
   proposition, adaptée à un débutant ». Jusqu'à 2 retenues par kanji ;
   les 4 kanji restants du gabarit initial (0 ou 1 trouvé) ne sont pas
   forcés (aucune correspondance fabriquée).
3. **Lectures inline** : généré via `kuromoji` (déjà une dépendance du
   dépôt, cf. `scripts/import/import-tatoeba.ts`). **Écart assumé par
   rapport à la consigne initiale** : la tâche demandait de n'annoter que
   le kanji cible, mais l'inspection de `kanji-content.json` (636 exemples
   existants multi-kanji, ex. `あの　女（おんな）の　人（ひと）は
   げんきです。`) et ADR-0002 (« tout kanji du texte joueur porte une
   lecture… qu'il soit étudié ou non ») confirment la vraie convention du
   projet : **toute** lecture kanji de la phrase est annotée, groupée par
   run contigu (règle Étape 4 du 2026-07-23). L'annotateur a donc été
   écrit pour couvrir tous les kanji, pas seulement la cible — vérifié à
   l'échelle avec les fonctions réelles de `lint-kanji-budget.py`
   (`missing_inline_readings`, `ungrouped_furigana_runs`) et avec
   `parseInlineReadings` (`src/lib/inline-reading.ts`) : 0 échec sur les
   808 exemples retenus. Un espacement par « chunk » (particules/auxiliaires
   collés au mot précédent) a aussi été ajouté pour matcher la convention
   majoritaire déjà en place (1384/1407 anciens exemples espacés ainsi).
4. **Cas limites corrigés à la main** (échantillonnage manuel demandé par
   la consigne, plusieurs vagues) :
   - Fusion incorrecte de runs kanji adjacents à travers une frontière de
     mot réelle : `昭和生まれ` fusionnait à tort en
     `昭和生（しょうわう）まれ` au lieu de `昭和（しょうわ）　生（う）まれ` ;
     corrigé en n'autorisant la fusion qu'à l'intérieur d'un même « chunk ».
   - `何` (pos_detail `数`) se collait au nom qui précède
     (`お土産何（みやげなん）買ったの？` au lieu de `お　土産（みやげ）
     何（なん）買ったの？`) — `数` ne doit s'attacher en arrière qu'à un
     autre `数` (chiffres consécutifs `１８`), pas à un nom ordinaire.
   - `ください` (pos_detail `非自立`) se collait à tort à un compteur qui
     précède sans `て/で` (`1枚下さい` → `枚下（まいくだ）さい` au lieu de
     `1枚　下（くだ）さい。`) — restreint à n'attacher qu'après un
     `助詞,接続助詞` (`て`/`で`), le vrai contexte grammatical de
     `～てください`/`～でいる`.
   Ces trois bugs ont été trouvés par lecture manuelle d'échantillons
   aléatoires (pas par un test automatisé) — après correction, 1225/1226
   phrases candidates s'annotent sans erreur (le seul échec restant est
   un kanji hors dictionnaire kuromoji dans une phrase littéraire).
5. **Téléchargement audio** : `https://tatoeba.org/audio/download/<audio_id>`,
   converti en opus/webm mono 48kHz ~28kbps (`ffmpeg`) pour matcher le
   format existant (`ffprobe` vérifié contre `public/audio/words/*.webm`).
   **Rate limiting rencontré** : une première tentative à 12 requêtes
   concurrentes a déclenché un vrai `429 Too Many Requests` de
   `nginx` après ~100 requêtes — repli à 3 workers avec détection
   explicite du code HTTP et cooldown partagé entre threads sur 429.
   1013 fichiers distincts nécessaires (avec marge de repli — jusqu'à 6
   phrases candidates par kanji, pour absorber d'éventuels 404 ponctuels
   sur des enregistrements retirés depuis l'export) ; **1013/1013
   téléchargés avec succès, 0 échec** après le repli sur 3 workers
   (~931 nouveaux + 82 déjà en cache d'un essai précédent).
6. **Attribution** : chaque exemple `source: "tatoeba"` porte
   `tatoeba_sentence_id`, `tatoeba_audio_id`, `contributor`, `license`
   pour une future surface crédits. 4 contributeurs Tatoeba pour les 596
   fichiers audio distincts effectivement utilisés (808 slots, certains
   fichiers réutilisés tels quels sur 2 kanji d'une même phrase) :
   yomi (343 exemples), Mizu (223), huizi99 (222), fal (20). Licences :
   CC BY-NC 4.0 (788 exemples), CC BY 4.0 (20).

### Décision assumée : pas de mélange TTS+Tatoeba par kanji

La consigne contenait une tension entre « remplace intégralement les
kanji qui ont des correspondances Tatoeba » et « pour 0 ou 1
correspondance, garde les entrées TTS existantes telles quelles ». Choix
retenu : un kanji est **soit** intégralement Tatoeba (2/2), **soit**
intégralement laissé pour la passe TTS de suivi (0 ou 1 correspondance
trouvée, même si 1 était utilisable) — jamais un mélange 1 Tatoeba + 1
ancien `say`. Le candidat Tatoeba trouvé-mais-non-utilisé est conservé en
métadonnée bonus (`tatoeba_candidate_found_but_unused`) dans le fichier de
trous pour que la passe de suivi puisse l'adopter directement plutôt que
de re-dériver la recherche.

### Fichiers modifiés par cette passe

`src/data/kanji-content.json` (404 kanji réécrits intégralement),
`public/audio/kanji_examples/*.webm` (808 fichiers écrits, 1892 fichiers
au total dans le dossier — **note** : ce dossier n'est pas suivi par git
dans ce dépôt, `git status` le montre comme un seul répertoire non
tracké, préexistant à cette session). Tests mis à jour pour matcher le
nouveau contenu réel de `一` (`src/app/lesson/BookScreen.test.tsx`,
`src/lib/lesson-book.test.ts` — les deux assertions étaient couplées au
texte exact du premier exemple `generated` de `一`, remplacé par
`一緒（いっしょ）に　行（い）かない？`). Nouveau :
`.scratch/kanji-no-niwa/tatoeba-audio-gaps.json` (1726 entrées, pour la
passe TTS cloud de suivi). `npm run check` vert (typecheck, lint, 550
tests, tous les validateurs de contenu — `lint-kanji-budget.py` ne scanne
pas `kanji-content.json` par défaut, vérifié séparément avec ses
fonctions réelles comme décrit plus haut).

## Google Cloud TTS pour le reliquat + adoption des candidats Tatoeba en attente (2026-08-04)

Suite de la passe précédente : les 1726 kanji du fichier de trous
(`.scratch/kanji-no-niwa/tatoeba-audio-gaps.json`) sont traités, **plus 6
kanji absents de ce fichier** (八, 首, 矢, 医, 短, 舌) — trouvés en
recomptant moi-même plutôt qu'en faisant confiance au récapitulatif de la
passe précédente (consigne explicite) : ils avaient déjà 2 exemples
`generated` (donc jamais remontés comme « trou »), mais restaient malgré
tout de l'ancien audio `say` à remplacer. 1726 + 6 = 1732, cohérent avec
2136 − 404.

### Vérification des chiffres du fichier de trous

Le récapitulatif de la passe précédente affirmait une répartition propre
« 1072 kanji à 1 candidat trouvé / 654 sans candidat ». En recomptant :
sur les 1072 `still_needed:1`, seuls **162** portent en réalité un
`tatoeba_candidate_found_but_unused` (910 n'en ont aucun) ; sur les 654
`still_needed:2`, **93** en portent un (561 aucun). Total candidats
réels : 255 (162+93), pas 1072. `still_needed` compte les slots
manquants pour atteindre 2, pas la présence d'un candidat — les deux
informations sont indépendantes dans le fichier.

### Stratégie retenue (place chaque kanji à exactement 2 `lesson_examples`)

- **Candidat Tatoeba présent (255 kanji)** : adopté comme 1 slot (audio
  réel téléchargé), le slot restant généré en TTS.
- **`still_needed:1`, pas de candidat (910 kanji + resynthèse du cas
  particulier ci-dessous)** : la phrase JP existante (de l'ancienne passe
  `say`) est **conservée telle quelle** — ce n'était que la voix qui posait
  problème, pas le texte — mais son audio est **resynthétisé** en Google
  Cloud TTS (`source` passe de `generated` à `tts_google`) ; le 2ᵉ slot
  manquant reçoit une phrase neuve.
- **`still_needed:2`, pas de candidat (561 + 6 kanji hors fichier)** :
  2 phrases neuves écrites et synthétisées.

Décision : ne jamais jeter une phrase existante correcte juste pour
« homogénéiser » — seule la voix macOS `say` était le problème signalé
par l'utilisateur, donc conservation + resynthèse partout où c'était
possible (922 slots resynthétisés sur les 3209 slots non-Tatoeba, plus
de la moitié).

### Génération des 2287 phrases neuves

Pas de dictionnaire d'exemples tout fait pour ~2300 phrases N5→N1 sur des
kanji parfois très rares (謁, 妥, 朕…) — écrites par un petit moteur de
gabarits plutôt qu'une à une à la main, avec des garde-fous grammaticaux
vérifiés par échantillonnage puis par balayage exhaustif :

- **Source du vocabulaire** : priorité au vocabulaire JLPT déjà présent
  dans `examples[]` du kanji lui-même (mots déjà vus par l'apprenant sur
  la fiche du kanji — cohérence pédagogique), repli sur les lectures kun
  (notation kanjidic `stem.okurigana`), repli final sur un dictionnaire
  écrit à la main pour les **150 kanji sans kun ET sans vocabulaire**
  (謁見, 折衷, 硫黄, 抹茶, 括弧… — composés réels choisis un par un).
- **Classement grammatical automatique** à partir du suffixe okurigana
  (`.い` → adjectif en い, terminaison godan/ichidan → verbe, sinon nom/
  adjectif en な) pour choisir un gabarit de phrase qui reste correct
  dans tous les cas — ex. `これは　{mot}です。` fonctionne aussi bien pour
  un nom que pour un adjectif en い (高いです) ou en な (静かです, な
  supprimé avant です).
- **Bugs trouvés et corrigés** avant le lancement du batch (balayage
  exhaustif du plan, pas un échantillon) :
  - doublon な+です (「円滑なです」au lieu de「円滑です」) sur tout
    suffixe se terminant par な ;
  - gabarit「とても　Xです」invalide sur des noms composés non-graduables
    (「とても栓抜きです」) — retiré du pool « autre » ;
  - adverbes en に (ex. ついでに) cassaient pareil avec です — famille de
    gabarits dédiée sans です ;
  - lecture collée après tout le mot au lieu d'après la seule partie
    kanji sur une entrée du dictionnaire écrit à la main (栓抜き（せんぬき）
    au lieu de 栓抜（せんぬき）き) — répare en réutilisant le même
    découpeur kanji/kana que pour le vocabulaire JLPT ;
  - **2 lectures corrompues préexistantes** dans `examples[]` (hors
    scope de cette passe mais lues en essayant de les réutiliser) :
    `事業` → `"じぎょう<br>ことわざ"`, `頰` → `"ほお, ほほ"` — fragments
    HTML/lectures alternatives concaténés tels quels dans le JSON source
    (25 occurrences au total dans tout `kanji-content.json`, non
    corrigées puisque hors du champ `lesson_examples` de cette tâche) ;
    filtrées par une regex de lecture « kana pur uniquement » pour ne
    jamais les utiliser comme candidat de génération.
  - **2 coquilles préexistantes** dans le texte `lesson_examples` déjà
    présent (換, 撲) : parenthèse fermante demi-chasse `)` au lieu de
    pleine chasse `）`, invisible à l'œil mais cassant le parseur de
    lecture inline (`parseInlineReadings`) — corrigées à la main en les
    conservant (`resynth`).
  - **1 lecture groupée à tort caractère par caractère** déjà présente
    (悠 : `悠（ゆう）々（ゆう）` au lieu de `悠々（ゆうゆう）`, exactement
    l'anti-pattern documenté le 2026-08-04 précédent) — fusion
    automatique de tout run de blocs `kanji（lecture）` adjacents
    appliquée à toute phrase conservée par `resynth`.
  Vérifié après coup par balayage complet des 2136 kanji avec la même
  logique de parsing que `src/lib/inline-reading.ts` (regex Python
  reproduisant exactement la classe de caractères kanji incluant
  々〆〇ヵヶ, pas la classe plus étroite de `lint-kanji-budget.py`) :
  **0 run de kanji sans lecture, 0 lecture par caractère au lieu de
  groupée**, sur l'intégralité du fichier, pas seulement les entrées
  touchées par cette passe.

### Synthèse audio

- **Tatoeba (255 fichiers)** : `https://tatoeba.org/audio/download/<audio_id>`
  (redirection HTTP suivie), 3 workers, palier de recul partagé sur 429
  — même méthode que la passe précédente. **255/255 réussis, 0 échec.**
- **Google Cloud TTS (3209 fichiers)** : voix unique `ja-JP-Neural2-B`
  (choisie et gardée fixe pour toute la passe, comme demandé). Le texte
  envoyé à l'API n'est **pas** la phrase affichée telle quelle : les runs
  `kanji（lecture）` sont remplacés par la lecture seule et les espaces
  pleine chasse de mise en forme retirés avant synthèse (`これは　円滑
  （えんかつ）です。` → `これはえんかつです。`) — pour forcer la
  prononciation exacte annotée plutôt que de laisser le moteur TTS
  deviner une lecture parmi plusieurs possibles sur des kanji ambigus.
  6 workers, 429/503 gérés avec un palier de recul partagé. **3209/3209
  réussis, 0 échec.** Aucun mur de quota rencontré (~48 000 caractères
  JP au total, largement sous les paliers gratuits).
- Conversion identique aux passes précédentes : `ffmpeg` vers opus/webm
  mono 48 kHz ~28 kbps, mêmes chemins `public/audio/kanji_examples/
  <caractère>_1.webm` / `_2.webm` (écrasés).

### Chiffres finaux — les 2136 kanji

| source | slots | kanji entièrement sur cette source |
|---|---|---|
| `tatoeba` (audio humain réel) | 1063 | 404 (2/2) |
| `tts_google` (Google Cloud TTS, voix Neural2-B) | 3209 | 1477 (2/2) |
| mixte (1 Tatoeba adopté cette passe + 1 TTS) | — | 255 |

**1063/4272 slots = 24,9 % d'audio humain réel** ; le reste (3209 slots,
1477 kanji intégralement + le slot restant des 255 mixtes) en TTS Google
Neural2, qui remplace intégralement la voix macOS `say` d'origine —
**plus aucun `lesson_examples` du jeu ne pointe vers de l'audio `say`.**
Tous les kanji ont exactement 2 `lesson_examples` (vérifié : distribution
de longueur = {2: 2136}, aucun à 0/1/3+).

`public/audio/kanji_examples/` : 4272 fichiers, 36 Mo.

### `npm run check`

Vert : typecheck OK, lint 0 erreur (3 warnings préexistants sans
rapport, `<img>` non optimisé), **39 fichiers de tests / 550 tests
passés**, `validate:content` sans bloquant (mêmes avertissements
préexistants de densité kanji, sans rapport). `lint-kanji-budget.py` ne
scanne toujours pas `kanji-content.json` par défaut — revérifié
séparément avec ses fonctions réelles (cf. ci-dessus), 0 échec réel sur
l'intégralité du fichier.

### Limites connues, assumées

- Les ~2287 phrases neuves sont générées par gabarits, pas écrites une à
  une à la main comme les phrases Tatoeba ou une partie de l'ancienne
  passe `say` — moins variées stylistiquement (un nombre restreint de
  tournures répété sur 2136 kanji), mais grammaticalement vérifiées à
  l'échelle (voir bugs corrigés ci-dessus) et toujours ancrées sur du
  vrai vocabulaire JLPT du kanji quand disponible.
- Le champ `en` (traduction) est une approximation construite depuis
  `meanings[0]` du kanji, pas une vraie traduction de la phrase JP
  générée — champ non validé par les linters, risque purement cosmétique
  documenté ici plutôt que corrigé (hors budget de cette passe).
- Les 25 lectures corrompues préexistantes dans `examples[]` (hors
  `lesson_examples`, donc hors scope) restent en l'état — followup
  possible si quelqu'un rejoue l'import JLPT Tango d'origine.

**Fichiers modifiés** : `src/data/kanji-content.json` (1732 kanji
réécrits — les 404 kanji Tatoeba de la passe précédente n'étaient pas
encore commités et sont inclus tels quels dans le même diff en attente),
`public/audio/kanji_examples/*.webm` (3464 fichiers écrits/écrasés sur
cette passe, 4272 au total dans le dossier non suivi par git). `npm run
check` vert. Ceci clôt de bout en bout le signalement initial « l'audio
des phrases d'exemple ne fonctionne pas » et « la voix est mauvaise » —
tous les kanji ont un audio qui fonctionne, et plus aucun n'utilise la
voix macOS `say`.

---

## Musique et SFX — MVP jalon 1 (2026-08-04)

Signalement initial : « pas de musique, pas d'effet sonore, nulle part
dans l'app ». Confirmé comme fonctionnalité jamais construite (pas un
bug) — aucune référence bgm/sfx/musique dans `src/app`/`src/lib` avant
cette passe, `content/map/zones.json` référencé par 8 tables (PRD §
Implémentation, `zone_id`) mais jamais créé. Portée confirmée avant de
commencer, restreinte au **MVP jalon 1** (les 4 zones extérieures du
parcours A1 + intérieurs, contextes universels SRS/leçon/combat, mute
minimal) — pas les ~458 autres zones, pas les thèmes badge/rival/
rocket/chef d'arène/légendaire, pas un mixer.

### Registre `content/map/zones.json` (créé)

20 entrées : les 4 zones extérieures du jalon 1 (`MAP_NEW_BARK`,
`MAP_ROUTE_29`, `MAP_CHERRYGROVE`, `MAP_ROUTE_30`) + leurs 16 intérieurs
(labo d'Elm 1F/2F, maisons du joueur/rival, gatehouse Route 46, Centre
Pokémon/Mart/maisons de Ville Griotte, maisons de Route 30). Clé de
recherche runtime = `map_name` (le `zone.name` MAP_* que MapClient
traverse réellement, aligné sur `src/data/zone-registry.json`) ; `zone_id`
porte le slug de contenu déjà utilisé par les 8 autres tables
(`trainers.json`, `texts`, `lessons`...) quand il existe, sinon un slug
dérivé du nom MAP_* pour les intérieurs qui n'en ont pas. Mapping des
pistes = `content/guidebook-adapted.md` § Musique — Mapping Zone par Zone
(fait foi) : chaque zone extérieure reçoit sa propre piste OST HGSS ; un
intérieur sans piste dédiée retombe sur la piste de sa zone d'accès
(règle générale du guidebook), sauf le Centre Pokémon de Ville Griotte
qui garde sa propre piste (les Centres Pokémon ont toujours leur thème
dans HGSS, y compris hors session SRS). Scope volontairement restreint —
structuré pour qu'ajouter une zone plus tard soit juste une entrée de
plus (documenté en tête du fichier).

### Pistes OST utilisées (rippées depuis `public/audio/ost/`, ré-encodées 128 kbps mp3 → `public/audio/bgm/`)

| Fichier source (Disc 1) | Sert pour | Fichier servi |
|---|---|---|
| `04 - New Bark Town.mp3` | Carte, Bourg Geon | `bgm/new-bark-town.mp3` |
| `09 - Route 29.mp3` | Carte, Route 29 | `bgm/route-29.mp3` |
| `13 - Cherrygrove City.mp3` | Carte, Ville Griotte | `bgm/cherrygrove-city.mp3` |
| `20 - Route 30.mp3` | Carte, Route 30 | `bgm/route-30.mp3` |
| `15 - Pokémon Center.mp3` | Session SRS + intérieur Centre Pokémon | `bgm/pokemon-center.mp3` |
| `18 - Battle! (Trainer - Johto) .mp3` | Combat dresseur (couche 'battle', prioritaire sur la zone) | `bgm/battle-trainer.mp3` |

`19 - Victory! (Trainer).mp3` a aussi été ré-encodé, vers
`public/audio/bgm/victory-trainer.mp3`, mais **non branché** cette passe
— le point d'ancrage SFX victoire (voir plus bas) utilise le petit
jingle `.opus`, pas ce morceau de 41 s, pour rester dans le scope « SFX
court » demandé plutôt que dupliquer un second mécanisme de piste
longue. Fichier laissé en place, prêt pour une passe future qui
voudrait la vraie transition OST à la victoire.

Ré-encodage : sources ~190 kbps mp3 → 128 kbps mp3 (`ffmpeg -codec:a
libmp3lame -b:a 128k`), gain de taille ~35 % sans dégradation
perceptible pour de la BGM en boucle. mp3 choisi plutôt qu'opus pour la
BGM (a contrario du vocabulaire `.opus` lazy-loadé) : plus simple, et
les tailles restent raisonnables pour une PWA (1,2–3,8 Mo par piste).

### SFX (`public/audio/sfx/game/`, `.opus` — même échelle que l'audio vocabulaire)

- `menu-confirm.opus` (depuis `menu_get.wav`, 1,5 s) — confirmation
  menu/dialogue.
- `victory-jingle.opus` (depuis `fanfare.wav`, 4,2 s) — victoire de
  combat.

### Musique de l'écran-livre (leçons) — PAS l'OST, calme, libre de droits

**Pixabay inaccessible cette passe** : les 4 candidats nommés au PRD
(« Japanese Relaxing Koto », « Japan Koto Folk Background Music », « In
the place far away », « Japanese Shakuhachi Flute - Zen ») n'ont pas pu
être récupérés — `pixabay.com` bloque le scraping derrière un challenge
JS Cloudflare (`cf-mitigated: challenge`), qui a rejeté aussi bien
`WebFetch` (403) que `curl` avec un User-Agent de navigateur (403) ;
aucune clé API Pixabay disponible dans cet environnement pour la voie
officielle. Signalé honnêtement plutôt que forcé.

**Repli sur `free-stock-music.com`** (accessible via `curl` en fournissant
un en-tête `Referer` — la protection anti-hotlink de leurs mp3 exige un
Referer venant de leur propre domaine, sinon ils renvoient silencieusement
la page d'accueil au lieu du fichier, piège vérifié en inspectant le
`file` du téléchargement). Leur tag « japanese »/recherche « koto » est
dominé par de l'EDM/trap/J-pop électronique estampillé « Japanese » plutôt
que du koto/shakuhachi calme (vérifié un par un via les meta-descriptions
de chaque page piste avant de télécharger quoi que ce soit — ex.
`roa-music-sakura-breeze` = « bright and uplifting electronic pop »,
pas du tout calme malgré le nom). Recherche élargie (`ambient`,
`meditation`, `japanese garden`...) jusqu'à trouver 2 pistes réellement
calmes/instrumentales, aujourd'hui dans `public/audio/bgm/lesson/` :

| Piste | Source | Licence | Attribution requise |
|---|---|---|---|
| 日本庭園 (Japanese Garden) — ambient piano, 2:32 | Alex-Productions, via free-stock-music.com | CC BY 3.0 | `日本庭園 (Japanese Garden) by Alex-Productions \| https://onsound.eu/` + `Royalty Free Music by https://www.free-stock-music.com` + lien CC BY 3.0 |
| One With Everything — méditatif, influences indiennes/asiatiques, 5:12 | Shane Ivers, via free-stock-music.com | CC BY 4.0 | `One With Everything by Shane Ivers \| https://www.silvermansound.com` + `Royalty Free Music by https://www.free-stock-music.com` + lien CC BY 4.0 |

**Attribution non affichée dans l'app cette passe** (CC BY l'exige) —
seulement consignée ici ; à ajouter quelque part avant un vrai
lancement (écran crédits/mentions légales, pas encore construit). Rotation
2/6 assumée, pas forcée à 6 (consigne explicite de la tâche) —
`LESSON_TRACKS` dans `src/lib/audio-tracks.ts` est un simple tableau,
en ajouter suffit pour étoffer la rotation plus tard.

### Architecture

- `src/lib/audio-tracks.ts` — logique pure (lookup zone→piste depuis
  `zones.json`, constantes de contexte, rotation leçon déterministe par
  hash `zoneId#sequenceIndex`, lecture/écriture de la préférence muet)
  — testé isolément (`src/lib/audio-tracks.test.ts`, 12 tests). Fichier
  `.ts` distinct de `audio-manager.tsx` (deux fichiers `audio-manager.*`
  auraient créé une résolution de module ambiguë — piège identifié
  avant d'écrire le code, pas après).
- `src/lib/audio-manager.tsx` — Provider React (`AudioManagerProvider`,
  monté une seule fois à la racine `src/app/layout.tsx` pour que la BGM
  survive la navigation client entre routes), hook `useAudioManager()`
  (contexte avec valeur par défaut no-op — les tests de composants qui
  ne montent pas le Provider ne créent jamais de vrai `<audio>`),
  composant `MuteToggleButton`. Modèle à 2 couches BGM fixes : `'zone'`
  (carte/SRS/leçon, mutuellement exclusives par route) et `'battle'`
  (toujours prioritaire quand posée — BattleScreen est un overlay DANS
  l'arbre de MapClient, poser/retirer la couche à son montage/démontage
  restaure automatiquement la musique de zone sans que MapClient n'ait
  besoin de rien savoir du combat). Politique autoplay navigateur :
  tentative de lecture immédiate, promesse rejetée avalée, nouvelle
  tentative au premier `pointerdown`/`keydown` global (pattern standard,
  non testé unitairement — jsdom n'a pas de vrai lecteur audio, cf. tâche).
  Non testé directement (React + Audio réel, hors du testable
  raisonnablement) — seule la logique pure de `audio-tracks.ts` est
  couverte.

### Points de branchement

- `src/app/map/MapClient.tsx` — BGM de zone (`useEffect` sur
  `zone.name` → `musicRefForMapName` → couche `'zone'`) ; bouton muet
  ajouté au cluster bas-droite existant (au-dessus de B/A, même langage
  visuel — cercle bordé, comme X/Y de `DialogueBox`/`BookScreen`).
- `src/app/study/StudyClient.tsx` — thème Centre Pokémon posé au montage
  sur la couche `'zone'` (retiré au démontage) — route à part, jamais
  montée en même temps que MapClient, aucun conflit de couche.
- `src/app/lesson/BookScreen.tsx` — piste de la rotation leçon (choix
  déterministe par `zoneId`/`sequenceIndex`), même mécanisme de couche
  `'zone'`.
- `src/app/map/BattleScreen.tsx` — thème dresseur pour toute la durée du
  combat (couche `'battle'`, posée au montage/retirée au démontage) ;
  jingle de victoire (`playSfx`) déclenché une seule fois exactement au
  moment où `progress.outcome` bascule à `'victory'` (même garde
  anti-double-déclenchement que `winBattle`).
- `src/app/map/DialogueBox.tsx` — SFX confirmation menu sur `pressA`
  (avance de page ou complète la frappe en cours) et sur chaque choix
  sélectionné (`companion_choice`/`instant_response`/`conversation_turn`)
  — couvre tout le point d'entrée « A / sélection » utilisé par la carte
  ET par les intros/victoires de combat (qui réutilisent `DialogueBox`).

### Explicitement hors scope cette passe (assumé, pas oublié)

- `music_ref` des ~458 autres zones (Johto restant + tout Kanto) —
  `zones.json` est structuré pour recevoir ces entrées au fur et à
  mesure sans refonte.
- Fanfare cérémonie badge, thèmes Silver/Rocket/Chef d'Arène/Kimono
  Girl/légendaire/Elite Four/Champion — jalon 1 n'a que le combat
  dresseur générique.
- Catalogue SFX complet (pas de son de pas — HGSS n'en a pas non plus,
  volontairement pas inventé), pas de sons de menu carte/inventaire.
- Écran de réglages / mixer volume — un seul bouton muet binaire,
  persisté `localStorage` (`audio-muted`), pas de table `user_settings`
  (n'existe pas encore).
- Crédits/attribution CC BY affichés en jeu pour les pistes leçon —
  consignés ici seulement.

### `npm run check`

Vert : typecheck OK, lint 0 erreur (3 warnings préexistants sans
rapport, `<img>` non optimisé), **40 fichiers de tests / 562 tests
passés** (12 nouveaux dans `src/lib/audio-tracks.test.ts`),
`validate:content` sans bloquant (mêmes avertissements préexistants,
sans rapport avec cette passe).

**Fichiers créés** : `content/map/zones.json`, `src/lib/audio-tracks.ts`
(+ `.test.ts`), `src/lib/audio-manager.tsx`, `public/audio/bgm/*.mp3`
(6 pistes OST + 1 non branchée), `public/audio/bgm/lesson/*.mp3` (2
pistes CC BY), `public/audio/sfx/game/*.opus` (2 SFX). **Fichiers
modifiés** : `src/app/layout.tsx` (Provider), `src/app/map/MapClient.tsx`,
`src/app/map/BattleScreen.tsx`, `src/app/map/DialogueBox.tsx`,
`src/app/study/StudyClient.tsx`, `src/app/lesson/BookScreen.tsx`.

### 2026-08-04 — CORRIGÉ : « la musique ne se lance pas »

Signalé par l'utilisateur immédiatement après le déploiement de la passe
ci-dessus — testé en jeu, silence total. **Root cause** :
`AudioManagerProvider` créait son élément `<audio>` dans un `useEffect`
(effect passif). Dans React, à l'intérieur d'un même commit, **tous les
effects passifs de l'arbre entier s'exécutent enfant-avant-parent** — au
premier chargement de `/map` (SSR + hydratation, un seul commit), l'effect
de `MapClient` (`setBgmLayer('zone', …)`, lui aussi un `useEffect`) tournait
donc AVANT celui du Provider, trouvait `audioElRef.current === null`,
et `applyActiveLayer()` abandonnait silencieusement (`if (!el) return`) —
plus rien ne rappelait cette fonction ensuite tant que `zone.name` ne
changeait pas (l'utilisateur n'a pas changé de zone pendant son test, donc
jamais de second appel). **Corrigé** : création de l'élément déplacée dans
un `useLayoutEffect` — tous les layout effects de l'arbre s'exécutent
avant tous les effects passifs, quel que soit l'ordre parent/enfant, donc
l'élément existe garanti avant le premier `useEffect` de n'importe quel
enfant (MapClient, StudyClient, BookScreen, BattleScreen). TDD : test rouge
d'abord (`src/lib/audio-manager.test.tsx`, un enfant synthétique qui pose
une couche BGM dans son propre `useEffect` au tout premier rendu — échoue
contre l'ancien code, passe contre le correctif ; vérifié dans les deux
sens). `npm run check` vert (41 fichiers / 563 tests).

## Transitions de zone — fondu de warp façon HGSS (2026-08-05)

Signalé par l'utilisateur après test en jeu : les transitions entre zones
(entrer/sortir d'un bâtiment, franchir une route) « ne sont pas vraiment
bien faites » visuellement — demande explicite de vérifier le comportement
réel de HGSS avant d'implémenter, plutôt que de deviner.

### Recherche — ce que fait vraiment HGSS (et les jeux Pokémon 2D en général)

Le moteur Pokémon (Gen 1 à 5, DS compris) distingue nettement deux
mécanismes de changement de carte, avec un traitement visuel différent :

- **Warps** (portes, escaliers, entrées de grotte, ascenseurs) : une
  commande de script « warp » dédiée déclenche une **fadescreen** —
  fondu au noir (parfois au blanc selon la paire de types de cartes),
  la carte cible se charge et positionne le joueur PENDANT que l'écran
  est noir, puis fondu retour. C'est un mécanisme générique du moteur,
  pas un script par carte — confirmé par la doc technique de la
  décompilation communautaire de Pokémon Emerald (`pret/pokeemerald`,
  page wiki « Remove Warp Fadescreen », qui documente le flag
  `FLAG_REMOVE_WARP_FADE` utilisé par les hackers pour désactiver CE
  fondu automatique quand ils veulent le contrôler eux-mêmes dans un
  script). Le même family-wide design (warp = téléportation entre
  cartes non contiguës) s'applique à HGSS.
- **Connections** (route → route, route → ville contiguës) : les cartes
  extérieures voisines sont chargées ensemble et rendues comme un seul
  espace continu — franchir la limite ne fait QUE continuer le défilement
  de caméra, sans fondu ni coupure, parce qu'il n'y a pas de warp
  scripté à cette frontière. Confirmé par la documentation communautaire
  du moteur (Pokémon Essentials Docs Wiki, pages « Connecting maps » et
  « Map transfers » — même distinction warp/connection, héritée du même
  design que les jeux officiels).

Confirme la prior de départ : fondu bref sur les warps, aucun fondu sur
les franchissements route-à-route. Sources consultées via WebSearch/
WebFetch (pas de doc officielle Nintendo/Game Freak publique sur le
sujet — la doc technique communautaire des décompilations est la
source la plus fiable disponible).

### État avant correctif (lu dans `MapClient.tsx`)

`goToZone` (le swap de zone : fetch `/api/zone`, puis `setZone` +
`setNpcs` + `setTrainers` + `setPlayerPos` synchrones) était appelé
directement par les trois chemins de transition — `enterWarp` (portes),
la sélection d'étage de l'ascenseur, ET le franchissement de bord
outdoor→outdoor dans `attemptStep` — sans aucun habillage visuel : la
zone changeait d'un coup dès que le fetch répondait, pop instantané.
Rien de spécifique aux warps par rapport aux connections.

### Implémenté

- `WARP_FADE_MS = 150` (à côté de `STEP_MS`/`HOP_MS`) — bref, comme le
  jeu (pas de fondu cinématique).
- `goToZoneWithFade` (nouveau, enveloppe `goToZone`) : pose `warpFading`
  à `true` (l'overlay noir devient opaque via une transition CSS
  inline, même convention que le reste du fichier — `transition:
  opacity ${WARP_FADE_MS}ms ease`, à l'image de `transition: left/top
  ${STEP_MS/1000}s linear` déjà utilisé pour le joueur/le suivi), attend
  `WARP_FADE_MS` (le temps que l'écran soit bien noir), APPELLE
  `goToZone` seulement à ce moment (le swap de données a donc lieu
  entièrement derrière l'écran noir, aucun pop visible), puis repasse
  `warpFading` à `false` une fois le swap terminé (fondu retour).
  Un ref `warpFadeActiveRef` (même pattern que `isTransitioningRef`
  existant) empêche un second warp de partir en parallèle pendant la
  fenêtre du fondu — y compris pendant l'attente AVANT que `goToZone`
  lui-même ne pose son propre ref de garde.
- `enterWarp` (portes/escaliers) et la sélection d'étage de l'ascenseur
  appellent désormais `goToZoneWithFade` au lieu de `goToZone`.
- Un overlay plein écran (`position: fixed, inset: 0, z-[90]`, fond
  noir, `opacity` piloté par `warpFading`, `pointerEvents: 'none'`)
  ajouté en fin de rendu de `MapClient` — au-dessus de tout le chrome
  (D-pad/A-B compris), fidèle à une vraie coupure d'écran.
- Garde d'entrée ajoutée sur `attemptStep` et `onA`
  (`warpFadeActiveRef.current`) : mouvement et interactions gelés
  pendant tout le fondu, pas seulement pendant le fetch réseau lui-même
  (couvre aussi la fenêtre du délai de fondu-out, avant que `goToZone`
  ne démarre) — sinon un appui rapide pendant le noir pourrait lancer un
  second warp en parallèle.

### Explicitement NON changé (fidélité au jeu, pas un oubli)

- Le franchissement outdoor→outdoor dans `attemptStep`
  (`findOutdoorZoneAt` + `goToZone` direct) reste **sans aucun fondu** —
  conforme au comportement d'origine (connections, pas warps). Vérifié
  qu'il n'y avait pas d'autre défaut visuel à corriger à cette frontière
  (flash, saut de caméra, mauvaise position initiale) : le swap est
  déjà synchrone (`setPlayerPos`/`setZone` dans le même appel), et
  l'offset de caméra (`offsetX`/`offsetY`) se recalcule au rendu suivant
  à partir de la nouvelle zone — pas de pop de caméra observé ni de
  raison structurelle d'en avoir un.
- Le tiroir dev (téléport vers n'importe quelle zone, `handleZoneChange`)
  reste instantané, sans fondu — outil de développement, jamais en
  production (M4), aucune exigence de fidélité visuelle.
- Le refus de la porte de zone SRS (`checkZoneEntry` non autorisé,
  dialogue « repasse demain ») peut, en théorie, faire fondre au noir
  puis rouvrir immédiatement sur le dialogue de refus si le warp cible
  une zone extérieure jamais visitée — mécanique propre à ce jeu
  (gate SRS), sans équivalent HGSS à respecter ; cas limite accepté
  tel quel, non traité comme un bug.

### Tests (TDD, jsdom, `react-dom/client` + `act`, comme le reste du fichier)

3 tests ajoutés dans `src/app/map/MapClient.test.tsx` (nouveau describe
« fondu de warp ») :

- l'overlay existe et est invisible (`opacity: '0'`) au repos ;
- franchir une porte (`vi.useFakeTimers`, même pattern que le test
  D-pad ouest existant) fait apparaître l'overlay à `opacity: '1'`
  AVANT même que le fetch de la nouvelle zone ne parte, le tient noir
  pendant tout le fetch (zone inchangée observable pendant ce temps),
  puis referme le fondu une fois la nouvelle zone en place ;
  couvre l'état React/DOM déterministe, pas le timing d'animation CSS
  lui-même (non testable en jsdom, comme signalé dans la consigne).
- un franchissement route-à-route (zones outdoor contiguës, sans porte)
  ne fait apparaître AUCUN fondu — garde-fou explicite pour la fidélité
  « pas de fondu sur les connections », pour que ça ne régresse pas
  silencieusement plus tard.

### `npm run check`

Vert : typecheck OK, lint 0 erreur (3 warnings préexistants sans
rapport — `<img>` non optimisé dans `BattleScreen.tsx`/`MapClient.tsx`),
**41 fichiers de tests / 567 tests passés** (564 existants + 3 nouveaux),
`validate:content` sans bloquant (mêmes avertissements préexistants).

**Fichier modifié** : `src/app/map/MapClient.tsx` (localisé à la
logique de warp/transition — `enterWarp`, l'overlay de fondu, les
gardes d'entrée ; aucun changement à la collision, au rendu NPC, ni aux
placements). **Fichier de test modifié** : `src/app/map/MapClient.test.tsx`.

## 2026-08-05 — 6 intérieurs qui partageaient tous `Player House 1F` reçoivent enfin une image dédiée

Reprise du chantier laissé ouvert plus haut (§ « Les maisons "normales"...
ont un intérieur inventé ») mais **scopée à 6 zones précises et déjà en
jeu** (pas les 53 maisons génériques de tout le jeu, hors périmètre) :
`MAP_ROUTE_30_MR_POKEMON_HOUSE`, `MAP_ROUTE_30_APRICORN_HOUSE`,
`MAP_CHERRYGROVE_SOUTHWEST_HOUSE`, `MAP_CHERRYGROVE_GUIDE_GENT_HOUSE`,
`MAP_CHERRYGROVE_SOUTHEAST_HOUSE`, `MAP_NEW_BARK_SOUTHWEST_HOUSE` —
toutes affichaient l'image de la maison du joueur, y compris deux lieux
nommés et scénaristiquement notables (chez M. Pokémon, où l'Œuf Mystère
est remis ; chez l'Homme aux Baies Cocor). `MAP_NEW_BARK_PLAYER_HOUSE_1F`
(la vraie maison du joueur) n'a pas été touché.

### Phase 1 — recherche de vraies captures pour les 2 lieux nommés

**M. Pokémon : capture réelle trouvée.** La piste précédente
(spriters-resource.com) a été retentée en `curl` avec un User-Agent
navigateur (plutôt que `WebFetch`, qui se heurte au challenge Cloudflare
constaté la session précédente) : `models.spriters-resource.com` répond
en HTTP 200 et héberge bien une page dédiée « Mr. Pokémon's House » —
mais c'est un modèle 3D d'EXTÉRIEUR seul (vignette vérifiée : la maison
vue de dehors, aucun mobilier), confirmant à l'identique la conclusion
déjà actée sur le rendu 3D des intérieurs (un seul modèle par bâtiment,
partagé extérieur/intérieur, sans détail de pièce) — cette piste
n'apporte donc rien de plus ici, comme prévu.
Recherche élargie à Bulbapedia Archives (`archives.bulbagarden.net`,
accessible en `curl` direct, contrairement à `WebFetch` qui reçoit un 403
sur StrategyWiki) : la page de M. Pokémon référence
`HGSS_Prerelease_Mr_Pokemon_House.png` — une capture d'écran d'une
version préversion (« prerelease », 2009) de HGSS, catégorisée par les
éditeurs de Bulbapedia comme montrant explicitement « Ethan, Oak, and
Mr. Pokémon » dans cette maison. Vérifié comme fidèle : `zone-data.json`
contient bien un objet `obj_R30R0201_ookido` (`SPRITE_OOKIDO`,
`FLAG_HIDE_MR_POKEMONS_HOUSE_OAK`) dans cette zone dans la ROM FINALE —
la caméo du Pr. Chen (Oak) sur cette capture préversion n'est donc pas
un artefact de build abandonné, c'est bien la même scène que celle
présente dans le jeu final, juste avec un texte de dialogue différent
(la préversion parle de recevoir le Pokédex ; le jeu final donne l'Œuf
Mystère à cet endroit). Licence de la page fichier Bulbapedia Archives :
« fair use » revendiqué + CC BY-NC-SA 2.5 pour le contenu du wiki
lui-même — usage non commercial, cohérent avec le seuil déjà accepté
dans ce projet pour les sprites externes (session précédente,
spriters-resource « Credit Not Required »). Recadrage effectué avant
usage : la boîte de dialogue japonaise en bas de la capture d'origine
(254×190) a été rognée (image finale 193×130) — ce n'est pas du décor,
et sa présence aurait pollué le rendu composite capture+collision.

**Homme aux Baies Cocor : aucune capture dédiée trouvée**, malgré
recherche ciblée (Bulbapedia — page Route 30, catégorie « Early HeartGold
and SoulSilver images » listée intégralement, aucun fichier
« Apricorn »/« Route 30 house » —, StrategyWiki, The Models Resource :
pas de page dédiée pour ce bâtiment contrairement à M. Pokémon). Ce
personnage n'a même pas de page perso sur Bulbapedia (juste mentionné
dans la page Route 30) — moins documenté que M. Pokémon, cohérent avec
son statut de PNJ plus mineur. Passé en synthèse (phase 2).

### Phase 2 — synthèse des 5 autres par recomposition d'assets HGSS réels

Pas de génération IA (refusée explicitement dans la consigne, pour
rester cohérent avec le pixel art DS authentique du reste du jeu).
Méthode : pour chacune, une image « coquille » (murs + sol, une vraie
capture HGSS déjà dans `public/maps/`, différente pour chacune des 5 et
différente de `Player House 1F`) reçoit un meuble découpé dans une
AUTRE capture HGSS puis recollé dessus — le fond quasi-noir de la
vignette d'écran DS (présent sur tous les screenshots de ce projet,
visible aux 4 coins arrondis) est retiré par seuillage RGB avant collage
(sinon un rectangle noir opaque suivait le meuble découpé). Chaque pièce
a donc un agencement propre, pas un copier-coller 1-pour-1 d'une zone
existante — mais la coquille de base, elle, reste identique pixel pour
pixel à la capture dédiée d'une autre zone réelle du jeu (limite
assumée, voir plus bas) :

| Zone | Coquille (base) | Meuble ajouté (source) |
|---|---|---|
| `MAP_ROUTE_30_APRICORN_HOUSE` | `Mr Psychic House HGSS.png` | 2 pots de plante (`Player House 1F HGSS.png`, coins bas) |
| `MAP_CHERRYGROVE_SOUTHWEST_HOUSE` | `MooMoo Farm House HGSS.png` | lit bleu (`Elms lab 2F HGSS.png`, coin bas-gauche) |
| `MAP_CHERRYGROVE_GUIDE_GENT_HOUSE` | `Red House HGSS.png` | étagère/console (`Mr Psychic House HGSS.png`, coin bas-gauche) |
| `MAP_CHERRYGROVE_SOUTHEAST_HOUSE` | `Elms lab 2F HGSS.png` | fauteuil jaune (`Copycat House 2F HGSS.png`, coin bas-droit) |
| `MAP_NEW_BARK_SOUTHWEST_HOUSE` | `Copycat House 1F HGSS.png` | téléviseur (`MooMoo Farm House HGSS.png`, coin bas-droit) |

Script Python (PIL, `crop` + seuillage alpha + `paste` avec masque
alpha), pas conservé dans le dépôt (travail en scratchpad, comme le
reste des outils ponctuels de cette session). Chaque coquille choisie
n'est PAS l'une des images déjà utilisées comme repli générique
(`Player House 1F`, `Red House 2F`, `Poké Mart interior`, `Pokémon
Center inside`, `Union Room`, `Gate inside`) — donc ces 5 zones ne
ressemblent ni à la maison du joueur ni au repli générique déjà vu des
centaines de fois ailleurs dans le jeu.

**Limite assumée** : la coquille de base de chacune des 5 reste
identique à la capture dédiée d'une autre zone réelle (`Mr Psychic
House`, `MooMoo Farm House`, `Red House`, `Elms lab 2F`,
`Copycat House 1F`) hormis le meuble ajouté — donc quelqu'un qui a déjà
visité ces 5 lieux dans le jeu reconnaîtra la pièce à un meuble près.
Compromis jugé raisonnable dans le temps disponible : les 6 zones
cibles sont maintenant visuellement distinctes ENTRE ELLES et de
`Player House 1F`, ce qui était le défaut signalé — la ressemblance
résiduelle avec un lieu tiers, plus lointain dans le parcours, est un
défaut nettement moins visible.

### Câblage (`scripts/build/build-zone-registry.py`)

Nouveau dict `ZONE_SCREENSHOT_OVERRIDES` (zone → nom de fichier),
vérifié avant `find_screenshot`/`find_generic_template` dans la boucle
principale — même esprit que `GENERIC_TEMPLATES` mais à la granularité
d'une zone précise plutôt que d'un mot-clé partagé par plusieurs zones.

**Piège trouvé et corrigé avant de considérer ça fini** : la première
version ajoutait juste les 6 fichiers dans `public/maps/` sans les
exclure du matching par mots-clés générique — régénération diffée
zone-par-zone (registre avant/après, en dehors des 6 zones cibles) a
montré **8 zones tierces cassées par effet de bord** :
`MAP_NEW_BARK_PLAYER_HOUSE_2F`/`_RIVAL_HOUSE_2F` (repli `Red House 2F`
détourné vers `New Bark Southwest House HGSS.png`, un nom qui matche
« new »+« bark »+« house »), `MAP_NEW_BARK_RIVAL_HOUSE_1F` et 4 maisons
sud-ouest génériques d'autres villes (Pewter, Ecruteak, Lavender,
Fuchsia — leur repli `Player House 1F` détourné par un match sur
« house » avec l'une des 5 nouvelles images synthétisées), plus
`MAP_LAVENDER_VOLUNTEER_POKEMON_HOUSE` détournée vers l'image de M.
Pokémon. Cause : `find_screenshot` fait un matching par mots-clés sur
TOUS les fichiers de `public/maps/`, et ces noms de fichiers neufs
contiennent forcément des mots comme « house »/« new »/« bark » (ce sont
de vraies maisons) — un fichier normalement invisible au reste du
système gagnait quand même par accident sur des zones jamais visées.
**Corrigé** : les 6 noms de fichiers listés dans
`ZONE_SCREENSHOT_OVERRIDES` sont désormais retirés de `map_files` avant
la construction de `screenshot_index` (donc invisibles à
`find_screenshot`/`find_generic_template` pour toute zone autre que
celle qui les référence explicitement). Réappliqué : diff
avant/après-correctif du registre entier montre **0 changement
inattendu**, seules les 6 zones cibles diffèrent.

### Vérification collision (rendu composite capture+grille, même
méthode que le reste de cette session)

Script Python ponctuel (scratchpad) : superpose la grille de collision
(`terrain`, rouge translucide = mur, vert = sol), les warps (bleu) et
les objets (jaune) sur le screenshot, à l'échelle `scale_x`/`scale_y`
du registre. Les 6 zones rendues et inspectées à l'œil : bande de murs
en haut cohérente avec le haut de chaque image (mobilier contre le mur
du fond), porte/warp alignée sur un tapis ou une zone de sortie visible
dans l'image, sol praticable sur le reste de la pièce. Aucun ajustement
de `interior_bounds`/collision nécessaire : `tile_width`/`tile_height`
viennent de la grille ROM (`zone-data.json`), pas de l'image, et
`interior_bounds` (bug G, déjà en place) les recadre déjà à la vraie
pièce indépendamment de quelle capture est utilisée — remplacer l'image
ne change que le facteur d'étirement `scale_x`/`scale_y`, déjà
non-uniforme même pour l'assignation « correcte » préexistante
(`Player House 1F` sur `MAP_NEW_BARK_PLAYER_HOUSE_1F` : `scale_x=19.69`
contre `scale_y=16.0`) — donc rien de nouveau structurellement, même
tolérance déjà acceptée ailleurs dans ce pipeline.

**Fichiers ajoutés** : `public/maps/Mr Pokemon House HGSS.png`,
`public/maps/Apricorn Man House HGSS.png`,
`public/maps/Cherrygrove Southwest House HGSS.png`,
`public/maps/Cherrygrove Guide Gent House HGSS.png`,
`public/maps/Cherrygrove Southeast House HGSS.png`,
`public/maps/New Bark Southwest House HGSS.png`.
**Fichier modifié** : `scripts/build/build-zone-registry.py`
(`ZONE_SCREENSHOT_OVERRIDES` + exclusion de `map_files`).
**Régénéré** : `src/data/zone-registry.json` (seules les 6 zones cibles
changent, diff vérifié).

`npm run check` vert : 567/567 tests (inchangé — aucun test ne couvre
le choix de capture d'écran par zone, comme déjà noté pour E plus haut),
0 erreur de lint (3 warnings préexistants sans rapport, `<img>` non
optimisé)

---

## 2026-08-05 — 3ᵉ signalement Route 29 (2 captures), scanner v2 (composantes
## connexes + clustering couleur), 2 nouveaux trous, blob noir identifié,
## PNJ dans les arbres

**Contexte** : 2 nouvelles captures d'écran de l'utilisateur (joueur +
suiveur Pikachu bloqué à l'ouest d'un petit amas de pins, près de la
guérite Route 29/46 mais à un endroit différent des deux trous déjà
corrigés) + consigne explicite : ne pas se contenter de corriger ce point
précis, améliorer le scanner (`canopy_scan_draft.py`) pour que cette
classe de bug arrête d'avoir besoin de signalements utilisateur zone par
zone. Deux faiblesses connues du brouillon (voir entrée du 2026-08-03
ci-dessus) à corriger : (1) le filtre « ≥60% voisins murés » sous-compte
les gros trous (une tuile au milieu d'un trou large n'a presque aucun
voisin mur) ; (2) une seule moyenne couleur « mur » par zone mélange
arbres/falaise/eau et produit du bruit.

### Localisation précise du joueur — nouvelle méthode (recalage image)

Au lieu d'estimer la position à l'œil (méthode des sessions précédentes),
recalage automatique par points d'intérêt : ORB (OpenCV) sur la capture
utilisateur (rognée du letterboxing noir, canvas réel 2100×893 sur les
2124×932 du fichier) contre `Johto Route 29 HGSS.png`, appariement
`BFMatcher` + ratio de Lowe, transformation affine par `estimateAffinePartial2D`
(RANSAC) — **628 points d'intérêt appariés comme inliers** (bien plus fiable
qu'un recalage à 1-2 repères choisis à l'œil) : échelle 1.60×, rotation
~0°, translation (-429, +0.7). Vérifié cohérent sur 2 repères indépendants
(porte de la guérite, clairière au PNJ calendaire) avant d'en tirer une
position. Joueur → tuile locale **≈(66,24)**, dans la zone que
`OUTDOOR_TERRAIN_PATCHES["MAP_ROUTE_29"]` documentait déjà comme « 21
tuiles qui doivent rester praticables » de la correction précédente.
Technique à réutiliser pour de futurs signalements (bien plus rapide et
fiable que le recalage manuel des sessions précédentes) — nécessite
`opencv-python-headless` (`pip install`, pas dans les dépendances du
projet, à réinstaller si besoin dans une nouvelle session).

### Le « 3ᵉ trou » n'en est pas un nouveau — c'est la continuation du
### passage déjà documenté comme obligatoire

Recherche gloutonne (même méthode que les 2 corrections précédentes,
**testée dans les deux sens** — ordre croissant ET décroissant des 26
tuiles candidates de la poche x61-76/z23-28 — pour écarter un biais
d'ordre glouton, résultat strictement identique dans les deux cas, chaque
tuile revérifiée contre `a1-traversal.test.ts` réel, pas une resimulation) :
**seules 2 tuiles sur 26 sont murables** ((73,24) et (74,24)) — les 24
autres cassent la guérite ou le continuum Route 29 → Ville
Griotte/Route 30 quel que soit l'ordre testé. Ce n'est pas un nouveau
trou : c'est la continuation directe de la poche déjà identifiée comme
« 21 tuiles doivent rester praticables… concentré autour de x=61 et
x=62-75 en bas de la poche » à la correction du 2ᵉ trou (2026-08-03,
ci-dessus) — le joueur de ce 3ᵉ signalement a simplement marché sur cette
même poche visuellement fausse mais structurellement nécessaire, un peu
plus à l'ouest que le point déjà mesuré. **Limite assumée, pas cachée**
(même principe que la tuile résiduelle `(76,24)` de la 1ʳᵉ correction) :
sans calque de profondeur sprite (hors périmètre moteur) ou retouche
d'asset graphique (hors périmètre contenu), ~24 tuiles de cette poche
resteront visuellement de la canopée praticable. Seul gain réel : 2
tuiles de moins dans l'empreinte visible du défaut.

### Scanner v2 (`canopy_scan_v2.py`) — composantes connexes + k-means

Réécrit en profondeur (`.scratch/kanji-no-niwa/canopy_scan_v2.py`,
remplace le brouillon) :

1. **Composantes connexes** au lieu du comptage de voisins par tuile :
   les tuiles suspectes (couleur plus proche d'un cluster « mur » que du
   reste) sont d'abord regroupées en régions contiguës (4-connexité),
   puis c'est la **bordure extérieure de toute la région** (pas chaque
   tuile individuellement) qui est comparée au seuil de % de murs — fixe
   directement le défaut n°1 (un trou large n'a quasi aucun voisin mur en
   son centre, seulement sa bordure en a).
2. **Clustering k-means (k=3) par zone** des couleurs des tuiles murées,
   au lieu d'une moyenne unique : chaque tuile candidate est comparée à
   son cluster « mur » le plus proche, pas à une moyenne qui mélange
   plusieurs matériaux (arbre vert olive + arbre vert clair + falaise
   grise, par ex.).
3. **Garde de contraste** (nouveau, absent du brouillon) : zones où
   couleur-mur et couleur-reste ne sont pas assez séparées (ex. Ruines
   d'Alph, roche/eau uniforme) sont ignorées plutôt que scannées avec une
   méthode qui n'a aucun pouvoir discriminant là.

**Calibration** (avant de faire confiance à un nouveau candidat — même
principe que demandé) : scanné sur `MAP_ROUTE_29` avec `--source raw`
(lit `scripts/sources/zone-data.json` directement, ignore les patches
déjà appliqués) — doit retrouver les 2 trous déjà connus et corrigés.
**96% de rappel** (203-206 / 211 tuiles déjà connues comme réel trou,
regroupées en quelques régions connexes plutôt qu'éparpillées) — pas
100%, mais très largement suffisant pour repérer la bonne zone à l'œil.

**Bruit, avant/après** (paramètres retenus : `--wall-dist 30 --border-frac
0.55 --min-size 4`) :

| Zone | v1 (brouillon) | v2 (cette session) |
|---|---|---|
| Bourg Geon, Ville Griotte (zones saines connues) | non testé formellement | **0 région** flaguée sur les deux |
| Route 30 | 477 tuiles (sans filtre) / 21 tuiles (avec filtre « ≥60% voisins »), **0 réel trou parmi elles** | **1 région** (7 tuiles) — toujours un faux positif (fleurs décoratives), mais 30 à 680× moins de tuiles à vérifier à l'œil |
| Route 36 (hors périmètre, zone de validation bonus) | trou réel raté par une lecture superficielle (candidats épars) | retrouve correctement le trou déjà confirmé visuellement la session précédente |
| Route 29 (recherche du 3ᵉ trou) | — | 2 nouveaux trous réels trouvés (voir ci-dessous) + re-signale correctement la poche déjà connue comme praticable de force + 1 faux positif (étang décoratif) |

### 2 nouveaux trous trouvés et corrigés sur Route 29 (grâce au scanner v2)

Chacun vérifié par rendu composite (capture réelle + grille de collision
superposée, même discipline que les 3 corrections précédentes) **avant**
tout correctif, puis muré d'un coup et revérifié contre
`a1-traversal.test.ts` réel (pas une resimulation) :

1. **Bordure nord** (x64-81 environ, z2-6, **55 tuiles**) : pins vert
   clair, texture visuellement distincte du reste de la canopée de la
   zone (vert olive/brun) — c'est exactement ce 2ᵉ cluster de couleur que
   le scanner v1 (une seule moyenne « mur » par zone) ne pouvait pas
   voir. `a1-traversal.test.ts` reste vert en murant toute la région d'un
   coup : elle n'est sur aucun chemin obligatoire (contrairement à la
   poche centrale du 2ᵉ trou).
2. **Lisière ouest de la petite clairière boisée** (x14-26 environ,
   z6-11, **41 tuiles**) : bordure de canopée normale (brun/orange) juste
   au-dessus de la clairière au tronc unique où vit le PNJ calendaire
   Tuscany. Même vérification, également pas sur un chemin obligatoire.

**2 faux positifs du scanner confirmés et REJETÉS** (pas corrigés,
laissés praticables) : x9-11/z12-13 et x43-54/z20-24 sur Route 29, x11/
z28-34 sur Route 30 — tous les trois sont de l'eau décorative (un étang,
marqué `.` praticable et non `w` dans les données source — donc
légitimement praticable, juste coloré comme de l'eau) ou une bande de
fleurs, pas de la canopée. C'est la principale source de faux positifs
restante du scanner : ni l'eau décorative ni les parterres de fleurs
n'ont de détecteur dédié.

**Fichier modifié** : `scripts/build/build-zone-registry.py`
(`OUTDOOR_TERRAIN_PATCHES["MAP_ROUTE_29"]` étendu — 2 tuiles pour la
continuation du 3ᵉ signalement + 96 tuiles pour les 2 nouveaux trous).
Diff du registre vérifié exhaustivement : **seul `MAP_ROUTE_29.terrain`
change** (98 tuiles), rien d'autre.

**Verdict sur le scanner : gardé comme outil manuel
(`.scratch/kanji-no-niwa/canopy_scan_v2.py`), PAS promu dans
`scripts/validate/`.** Raison assumée : la convention de ce dossier
(vérifiée : `calc-cs-corpus.py`, `check-cs-kanji-deadlock.py`,
`lint-*.py`, `solve-progression.py`) est un linter déterministe câblé
dans `npm run validate:content` (0 échec ou ça casse `npm run check`).
Ce scanner ne peut structurellement pas atteindre cette barre, même à
cette précision : l'eau décorative et les parterres de fleurs aliaseront
toujours partiellement avec les couleurs arbre/falaise sur une palette
de capture d'écran compressée — chaque région flaguée a besoin d'un œil
humain sur un rendu composite avant toute conclusion, ce n'est pas un
problème de calibrage supplémentaire. C'est en revanche un **très bon
outil de présélection** maintenant (voir tableau ci-dessus) — à relancer
sur la zone précise à chaque futur signalement « je marche dans les
arbres », plutôt que de re-signaler tuile par tuile à l'œil depuis zéro.

### Blob noir identifié : `obj_R29_bonguri` (SPRITE_BONGURI), sprite
### source cassé — pas un bug de rendu MapClient

Localisé précisément par la même méthode de recalage image (628 points
ORB) : position écran → tuile locale **(20,8)**, qui correspond
EXACTEMENT à la position déjà connue de `obj_R29_bonguri`
(`SPRITE_BONGURI`, un objet de décor ROM — pas un PNJ curaté — près de la
petite clairière boisée où vit Tuscany).

**Cause investiguée avant toute conclusion** (comme demandé) : ce n'est
PAS un bug de `resolveNpcSprite` (`src/lib/npc-sprites.ts`) — la
résolution vers `/sprites/overworld/bonguri.png` était déjà correcte
avant ce correctif. Le fichier PNG source lui-même est cassé, vérifié
pixel par pixel (`PIL.Image.getcolors`) : `bonguri.png` (7 frames) ET
ses 7 variantes couleur inutilisées (`bonguri_b/bk/g/p/r/w/y`, aucune
référencée par aucun objet dans `zone-data.json`) sont **100% des pixels
non transparents en noir pur (0,0,0)**, sans AUCUNE variation de couleur
— y compris les variantes qui ne devraient PAS être noires (rouge, vert,
jaune, blanc…). Comparaison de contrôle : `bonmi_r`/`bonmi_y` (la même
baie, mais l'icône d'objet UNE FOIS RAMASSÉ) ont bien 7 couleurs
distinctes chacune, correctement rouge/orange vs jaune/or respectivement
— la palette a donc bien été perdue à l'extraction ROM, mais seulement
pour la famille « bonguri » (l'apparence de la baie encore sur l'arbre),
pas pour toutes les extractions de ce projet.

**Recherche systémique** : `SPRITE_BONGURI` est posé sur **31 objets dans
~24 zones extérieures** de tout le jeu (Bourg Geon exclu — toutes des
routes, dont Route 30 ×2 dans le jalon 1), pas seulement Route 29 — donc
un vrai bug systémique, pas un cas isolé.

**Aucun script d'extraction committé ne reproduit ce pipeline précis**
pour retenter une extraction propre dans le temps disponible
(`extract_hgss_sprites.py` couvre d'autres catégories NARC —
trainers/UI/badges/etc., pas les objets de décor overworld ;
`extract-sprites.py` découpe une planche de trainers déjà assemblée,
sans rapport ; aucun des deux ne produit `public/sprites/overworld/*` —
ce dossier vient d'un script ponctuel d'une session antérieure, jamais
committé, comme d'autres outils mentionnés dans le RÉSUMÉ DE SESSION).

**CORRIGÉ sans deviner de nouvelles couleurs** : `resolveNpcSprite`
redirige maintenant `SPRITE_BONGURI` vers `tree` — un autre sprite
végétal déjà vérifié correctement coloré (8 couleurs distinctes),
utilisé ailleurs sur cette même Route 29 pour `SPRITE_TREE` — plutôt que
d'inventer une recoloration ou de laisser un blob noir non identifiable.
Mécanisme : nouvelle table `BROKEN_SPRITE_FALLBACKS` dans
`npc-sprites.ts`, même style que `HNS_PEOPLE`, consultée avant la
résolution générique. Corrige les 31 occurrences du jeu entier en un
seul endroit (pas une correction Route 29 seule).

**TDD** : `src/lib/npc-sprites.test.ts` (nouveau fichier — ce module
n'avait JAMAIS eu de couverture directe, toujours mocké dans
`MapClient.test.tsx`) — test rouge d'abord (`resolveNpcSprite('SPRITE_BONGURI')`
résolvait vers `bonguri.png`), puis correctif. **Bug latent trouvé en
écrivant le test rouge** : le fichier importe `overworld-sprite-labels.json`
via `require('@/data/...')` (alias), qui échoue sous Vitest en
environnement `node` (`Cannot find module '@/data/...'`) — jamais détecté
avant car aucun test n'avait jamais réellement chargé ce module. Corrigé
en passant à un chemin relatif (`require('../data/...')`), même
convention déjà utilisée avec succès par `src/lib/zones.ts` pour son
propre JSON. `npm run check` vert (569 tests, +2).

### PNJ dans les arbres : `obj_R29_gsboy2` trouvé et corrigé, `obj_R29_monstarball` investigué et laissé tel quel

Cross-référencé les 11 objets de décor de Route 29 contre la grille de
collision corrigée (script Python, comme au § précédent) : 2 objets sur
une tuile `#` (mur) :

- **`obj_R29_gsboy2`** (`SPRITE_GSBOY2`, simple objet de décor ROM — pas
  de PNJ curaté associé dans `content/map/`, donc pas de `role_origin` à
  respecter contrairement à Silver) en `(50,26)`, confirmé par rendu
  composite **en pleine canopée du massif sud**, aucune tuile praticable
  avant `(50,24)` (2 tuiles plus au nord). Son `movement`/`yRange:1`
  (patrouille verticale d'une tuile) suggère un figurant d'arrière-plan
  du jeu original (cohérent avec un vrai calque de profondeur 3D, que ce
  moteur 2D à plat ne peut pas reproduire) — même classe de bug que
  Silver à Bourg Geon (issue 13, bug D). **CORRIGÉ** : repositionné en
  `(50,24)`, praticable, à la lisière de l'étang/clairière juste au nord
  de la canopée — cohérent visuellement (« personnage en bordure de
  forêt » plutôt qu'« encastré dans les arbres »). Pas d'entrée
  `content/map/` à éditer (objet de décor brut, pas un PNJ curaté) :
  nouveau mécanisme `OUTDOOR_OBJECT_POSITION_PATCHES` dans
  `build-zone-registry.py`, même principe de table scoped-et-documentée
  que `OUTDOOR_TERRAIN_PATCHES`.
- **`obj_R29_monstarball`** (`SPRITE_MONSTARBALL`, objet-ball caché,
  `FLAG_HIDE_ITEMBALL_R29_POTION`) en `(78,2)` : cette tuile est tombée
  DANS la région de 55 tuiles murée ci-dessus par cette même session (le
  ball était déjà sur une tuile praticable-mais-canopée avant ce
  correctif — donc déjà le même bug de fond, pas une régression
  introduite). Investigué avant d'y toucher : `grep` sur `src/` ne trouve
  **aucune logique de ramassage d'objet** nulle part dans le moteur
  (aucune référence à `MONSTARBALL`/`itemball` en dehors du rendu du
  sprite) — la balle est purement décorative dans ce projet, sa
  praticabilité n'a aucune conséquence fonctionnelle. La murer ne fait
  que rendre cohérents visuel et collision (même chose que les 2 trous
  ci-dessus) ; avant ce correctif, un joueur pouvait déjà « marcher à
  travers » la canopée pour l'atteindre — exactement le bug qu'on
  corrige. **Laissé tel quel** (mur), aucune tuile supplémentaire
  exemptée pour cet objet.

Reste de Route 29 vérifié sans changement : les 9 autres objets de décor
sont sur du terrain praticable hors mur (vérifié programmatiquement, pas
seulement à l'œil), y compris `obj_R29_var_2`/`obj_R29_tsure_poke_static_marill`
(le duo Lyra/Marill du tutoriel, déjà corrigés) et `obj_R29_bonguri`
(déjà praticable en `(20,8)`, seul son sprite était cassé, pas sa
position).

### `npm run check`

Vert : typecheck 0 erreur, lint 0 erreur (3 warnings préexistants sans
rapport, `<img>` non optimisé), **569 tests** (+2 vs la session
précédente : les 2 nouveaux tests `npc-sprites.test.ts`),
`validate:content` 0 échec, traversée toujours complète. Fichiers
modifiés par cette passe : `scripts/build/build-zone-registry.py`,
`src/data/zone-registry.json` (régénéré — seul `MAP_ROUTE_29` change,
diff vérifié exhaustivement, 98 tuiles de terrain + 1 objet
repositionné), `src/lib/npc-sprites.ts`, `src/lib/npc-sprites.test.ts`
(nouveau). Fichier ajouté : `.scratch/kanji-no-niwa/canopy_scan_v2.py`.

### Bilan de la passe

3ᵉ signalement utilisateur : **pas un nouveau trou** — la continuation
documentée d'un passage déjà connu comme obligatoire (2 tuiles fermées
en plus, sur les 26 candidates, limite assumée pour le reste). Scanner
reconstruit avec composantes connexes + clustering couleur : 96% de
rappel en calibration, 0 faux positif sur zones saines, bruit de Route 30
réduit d'un facteur 30-680×, retrouve correctement un trou déjà connu
hors périmètre (Route 36) — gardé comme outil de présélection manuel,
pas promu en linter automatique (raison assumée : nécessite toujours un
œil humain, ce n'est pas un défaut de calibrage). 2 nouveaux vrais trous
trouvés et corrigés sur Route 29 grâce au scanner (96 tuiles). Blob noir
identifié comme un défaut d'asset source (palette perdue à l'extraction,
pas un bug MapClient), corrigé pour les 31 occurrences du jeu entier en
un seul endroit, avec un bug de couverture de test latent trouvé et
corrigé au passage (import cassé sous Vitest, jamais détecté faute de
test direct sur ce module). 1 PNJ dans les arbres trouvé et corrigé
(même classe que Silver), 1 objet décoratif (item ball sans mécanique de
ramassage) laissé tel quel après investigation. `npm run check` vert
(569 tests).
optimisé), `validate:content` sans nouveau bloquant.

## 2026-08-05 — CORRECTIF D'URGENCE : joueur réellement enfermé par la passe précédente + hydratation cassée

Deux bugs signalés par l'utilisateur juste après le déploiement de la
passe ci-dessus.

**Joueur bloqué dans un rectangle invisible** — l'utilisateur avait
raison de soupçonner que la correction en cours l'avait piégé. Position
sauvegardée vérifiée en base (`user_map_state`, monde x=648 z=408 sur
`MAP_ROUTE_29` = tuile locale (72,24)) : flood-fill sur le terrain
généré révélait seulement **7 tuiles atteignables** (66-72,24), une
poche totalement isolée. Cause : le patch `(73, 74, 24)` de la passe
précédente (« 3ᵉ signalement ») murait DEUX tuiles contiguës qui étaient
le seul lien entre cette poche et le reste de la carte — la garde de
sécurité utilisée (`a1-traversal.test.ts`) ne teste que la joignabilité
de quelques points nommés (guérite, PNJ, continuum de zones), tous
restés atteignables par un tout autre chemin, donc invisible à cette
garde. **Ce n'est pas juste un bug de donnée, c'est une faille de
méthode** : une garde par points nommés ne prouve jamais l'absence de
poche isolée ailleurs sur la carte. Patch reverti (flood-fill vérifié :
1044 tuiles atteignables depuis la position du joueur après revert,
contre 7 avant). Le vrai correctif méthodologique (garde de
connectivité exhaustive avant tout futur patch de terrain) reste à
implémenter — noté comme suite immédiate, pas encore fait à l'heure de
cet écrit.

**Hydration mismatch (« la musique ne se lance pas » nouvelle forme)** —
`AudioManagerProvider.muted` utilisait un lazy `useState` qui lisait
`window.localStorage` dès le tout premier rendu CLIENT (l'hydratation
elle-même), pas seulement après : un joueur ayant déjà coupé le son lors
d'une session précédente obtenait `muted=true` au premier rendu client
contre `muted=false` côté serveur (jamais accès à localStorage) — React
détecte le mismatch et regénère tout l'arbre (perceptible comme un
flash/reset). Corrigé avec `useSyncExternalStore` (l'API React conçue
pour exactement ce cas : snapshot serveur explicite `false`, snapshot
client réel resynchronisé automatiquement après hydratation, sans le
`setState`-dans-un-effect que le lint `react-hooks/set-state-in-effect`
de ce projet interdit par ailleurs). `toggleMute` écrit dans
localStorage puis notifie un petit store d'abonnés maison (un seul
abonné en pratique, le Provider n'est monté qu'une fois). TDD : test
rouge d'abord (`audio-manager.test.tsx`).

`npm run check` vert (570 tests, +1). Fichiers touchés :
`scripts/build/build-zone-registry.py`, `src/data/zone-registry.json`
(Route 29 seulement), `src/lib/audio-manager.tsx`,
`src/lib/audio-manager.test.tsx`.

### 2026-08-05 (suite) — garde de connectivité exhaustive implémentée (`verify_full_connectivity`)

Suite immédiate promise ci-dessus. Ajoutée dans
`scripts/build/build-zone-registry.py` : `_flood_fill` (BFS 4-connexe) +
`verify_full_connectivity`, appelée automatiquement par
`apply_outdoor_terrain_patches` sur CHAQUE zone patchée — flood-fill
complet depuis un point de référence avant/après patch, lève une
exception (interrompt la génération) si une tuile auparavant atteignable
devient isolée. Bien plus fort que `a1-traversal.test.ts` (qui ne
prouve que la joignabilité d'une poignée de points nommés).

**A immédiatement porté ses fruits** : en la faisant tourner sur
l'ensemble des patches Route 29 déjà en place, elle a trouvé — avant
tout signalement utilisateur — **une 2ᵉ poche isolée non détectée**, 3
tuiles ((22,8), (15,10), (15,11)) coupées du reste de la carte par deux
patches de la passe scanner-v2 (`(21,23,9)` et `(16,16,11)`, north
border fix). Bissection automatisée (rejouer les patches un par un avec
flood-fill à chaque étape) pour identifier précisément les 2 coupables
parmi la quarantaine de patches Route 29. Les deux exclus (commentés,
pas supprimés silencieusement). Regénéré, `verify_full_connectivity` ne
lève plus rien sur aucune zone. `npm run check` vert (570 tests,
inchangé — ces 3 tuiles n'étaient testées par aucun point nommé).

Portée actuelle : appelée uniquement pour les zones ayant une entrée
`OUTDOOR_TERRAIN_PATCHES` (Route 29 pour l'instant). S'appliquera
automatiquement à toute future zone patchée par ce mécanisme — plus
besoin d'y repenser zone par zone.

## 2026-08-05 (suite 2) — boîte de dialogue et menu START restylés d'après une capture de référence HGSS réelle

Demande utilisateur : faire ressembler la boîte de dialogue et le menu
START à l'UI HGSS réelle (capture d'écran fournie : écran du haut =
overworld + boîte de dialogue fond blanc/bordure fine or, écran du bas
= menu START vert tactile, bandeau « ⊗ MENU », grille 2 colonnes
d'icônes rondes vert foncé). Consigne explicite : vérifier d'abord les
assets déjà extraits de la ROM (`public/sprites/ui/UI_SCREENS_INDEX.md`)
avant d'inventer quoi que ce soit.

### Boîte de dialogue — l'asset déjà câblé n'était pas le bon

`.dialogue-frame` (`globals.css`) utilisait déjà la technique
`border-image` sur `textbox_000.png` (dossier `ui/dialogue/`, NARC
`/a/1/0/0`, 26 PNG) — la bonne approche, mais le mauvais fichier
visuellement : vérification pixel par pixel (`PIL.getcolors`) des 26
PNG de ce dossier → **les 26 sont un seul et même thème bleu/turquoise**
(couleurs `(49,74,99)`/`(74,99,123)`/`(173,189,198)`, cadre de
communication sans fil façon Union Room), aucun thème or/tan malgré la
mention « 6 color themes » de l'index. Un poste de la référence
utilisateur a aussi été échantillonné pixel par pixel (`PIL.getpixel`
sur la capture) pour extraire les vraies couleurs du cadre or HGSS :
contour quasi-noir → bande or moyen → bande or clair (bevel) → blanc.

**Décision** : pas d'asset ROM gold disponible → recolorisation
dérivée, pas une invention à partir de rien. Script Python a mappé les
4 couleurs de `textbox_000.png` (D=contour, M=corps, L=bevel, W=fond)
vers une palette or basée sur l'échantillonnage ci-dessus, en
conservant à 100% la silhouette pixel-art réelle (mêmes coins
« encochés » arrondis, même structure 9-slice 24×24/8px). Résultat :
`public/sprites/ui/dialogue/textbox_overworld_gold.png` (nouveau
fichier, dérivé — pas une extraction ROM brute, documenté comme tel en
commentaire dans `globals.css`). `.dialogue-frame` pointe maintenant
dessus (`border-image ... 8 fill`, `border-image-repeat: stretch`
conservé — pas de risque de tuilage). Bordure réduite de 12px à 10px
(plus fine, plus fidèle à la capture).

Retouches `DialogueBox.tsx` (visuel seulement, contrat X/Y/A/B et
`DialogueBoxHandle` intacts, aucun test cassé) :
- Overlay `bg-black/20` → `bg-black/10` : le vrai jeu ne tamise pas
  l'overworld derrière la boîte, mais un fond totalement transparent
  laissait la carte transparaître dans les coins encochés (pixels
  alpha=0 du cadre) — compromis documenté en commentaire.
- Nom du PNJ : `text-amber-700` → `text-amber-800` (cohérence avec le
  nouveau cadre or).
- Compteur de page (`1/2`) et curseur `▼` : gardés tels quels dans le
  DOM (les tests asserent `toContain('1/2')` etc. — texte inchangé),
  juste restylés (`text-gray-400`/`text-[10px]` pour le compteur,
  discret ; curseur `▼` en `text-gray-600 text-sm`, plus proche du
  triangle sombre plein de la référence).

### Menu START — le dossier `menus/` extrait n'est PAS le menu START

Vérification asset par asset (pas supposition depuis les noms de
fichiers, comme demandé) : `menu_002.png`/`003`/`004` = fond diagonal
façon trainer card + sprite de dresseur de VS screen corrompu/mal
décodé (lignes en tirets = artefact de décodage) ; `menu_006.png` =
bandeau **« VICTOIRE DEFAITE EGALITE »** (français, écran de résultat
de combat) ; `options_004-019` = chrome de l'écran **Options**
(flèches de pagination grises, grilles à clé magenta) — pas des icônes
de menu. **Aucun des 15 PNG de `ui/menus/` n'est le panneau vert du
menu START** malgré ce que suggérait l'entrée d'index — confirmé en
affichant chaque fichier à l'échelle, pas en lisant les noms.

**Décision** : chrome du menu (bandeau, panneau, grille, tuiles)
reconstruit en CSS/Tailwind pur, pas d'asset — documenté en commentaire
dans `StartMenu.tsx`. Palette vert émeraude Tailwind (`emerald-600`
corps, `emerald-800` bandeau, `emerald-950` contours) choisie par
jugement visuel contre la capture de référence, pas mesurée
pixel-par-pixel (contrairement au cadre or, où l'échantillonnage était
direct et fiable).

**Icônes par tuile** — un seul vrai asset ROM exploitable trouvé après
recherche dans `pokedex/`, `bag/`, `items/`, `badges/` :
`pokedex/pokedex_030.png` (16×16, poké ball rouge/blanche propre,
pixel-art) → utilisé pour 図鑑 (Kanjidex), rendu à `image-rendering:
pixelated`. Les autres dossiers ne contiennent que des écrans complets
(fond de pochette du Sac, écran de la Pokédex, planches de badges) ou
des tuiles décoratives sans rapport (étoiles d'effet, icônes d'étage
numérotées) — rien de la taille/forme d'une icône de tuile de menu
pour バッグ/レッスン/プロフィール/ぼうけんノート/せってい. Pour ces 5
slots, repli assumé en pictogramme emoji (📖/🎒/👤/🧭/⚙️), cohérent
avec le précédent déjà posé pour `.book-chrome` (« pas de précédent
HGSS », assumé). `SlotIcon` (nouveau composant local) distingue les
deux cas (`{kind:'sprite', src}` vs `{kind:'emoji', glyph}`) ; les
tuiles désactivées (プロフィール/せってい) reçoivent `grayscale
opacity-40` sur l'icône, cohérent avec le style de tuile grisée déjà
en place.

Structure/attributs de test préservés à l'identique
(`data-testid="menu-root"`, `data-selected`, `aria-disabled`,
`buttonByText` — le jp reste dans le `textContent` du bouton) :
`StartMenu.test.tsx` passe sans modification.

### Vérification visuelle

Impossible de capturer l'app réelle en marche : `/map` et le menu
START exigent une session Google OAuth (`src/lib/auth.ts`, pas de
bypass dev) derrière `proxy.ts`, qui redirige aussi bien les pages que
les assets statiques (`/sprites/...`) tant que non connecté — et
forger une session aurait nécessité soit toucher la table `users`
(interdit pour cette tâche), soit lire dans Neon (évité par prudence).
Vérifié à la place par une page HTML statique isolée (Tailwind CDN +
les mêmes classes exactes + les mêmes fichiers PNG réels, servie en
`file://`, capturée avec Playwright/Chromium déjà en cache local) —
fidèle au rendu réel puisqu'elle utilise exactement les mêmes classes
utilitaires et les mêmes assets, juste hors du flux serveur/auth de
l'app. Résultat jugé visuellement proche de la référence (cadre or fin
sur fond blanc, panneau vert 2 colonnes avec bandeau « ⊗ MENU »).

**`npm run check` vert (570 tests, inchangé — restyle visuel pur,
aucun test de structure cassé).** Fichiers touchés :
`src/app/globals.css`, `src/app/map/DialogueBox.tsx`,
`src/app/menu/StartMenu.tsx`,
`public/sprites/ui/dialogue/textbox_overworld_gold.png` (nouveau,
dérivé de `textbox_000.png`).

## 2026-08-05 (suite 3) — 4ᵉ signalement « je ne peux pas aller à gauche » : ni un trou de données, ni le bug client jamais reproduit — un vrai mur, au bon endroit, dans la poche de canopée déjà documentée comme limite acceptée

**Contexte** : nouveau signalement, distinct des 3 précédents sur Route 29
(tous des trous de données confirmés puis corrigés) et distinct aussi du
très vieux point resté ouvert « Mouvement gauche/droite : investigué en
profondeur, non reproduit » (ci-dessus, 2026-08-03). Un premier relevé de
position (avant cette entrée) donnait monde (655,399) → tuile locale
(79,15), avec l'ouest praticable sur au moins 3 tuiles avant un vrai mur
— terrain propre à cet endroit précis, rien à corriger là. Question
initiale posée par l'utilisateur ensuite : « il rebondit contre quelque
chose en haut, à gauche, en bas » (nord/ouest/sud bloqués, seul l'est
ouvert) — un vrai rebond (`setBumpKey`), pas une absence totale de
réaction, donc pas un blocage d'input générique.

### Position revérifiée EN DIRECT (pas le relevé précédent, devenu obsolète)

Requête fraîche sur `user_map_state` (lecture seule) : le joueur avait
bougé depuis le premier relevé — position actuelle monde **(642,408)**
sur `MAP_ROUTE_29`, `updated_at` à la seconde près de cette
investigation. Avec `world_origin_x=576`, `world_origin_y=384`
(`src/data/zone-registry.json`, revérifié directement, pas supposé) :
tuile locale **(66,24)** — un tout autre endroit de la carte que le
premier relevé (79,15), à 14 tuiles à l'ouest et 9 au sud.

### Le terrain confirme EXACTEMENT le rebond signalé

Lu directement dans `zone-registry.json` (`terrain`, grille aplatie
96×32) : depuis (66,24) — **nord `#`, sud `#`, ouest `#`, est `.`** —
correspond au signalement mot pour mot (« en haut, à gauche, en bas »
bloqués ; seul un côté, l'est, ouvert — l'utilisateur n'a pas nommé
« est » explicitement mais par élimination c'est cohérent avec
« seulement en haut/gauche/bas » listés comme bloqués). Donc : à
l'instant précis où l'utilisateur a testé, le moteur a **correctement**
détecté un mur sur 3 des 4 directions et a fait rebondir le joueur —
comportement de collision qui fonctionne comme prévu, pas un bug
d'input.

### Ce n'est pas une poche isolée (flood-fill exhaustif, même méthode que `verify_full_connectivity`)

BFS 4-connexe (murs = `#`, reproduisant exactement `_flood_fill` de
`build-zone-registry.py`) depuis (66,24) : **1051 tuiles atteignables**,
strictement le même ensemble que depuis un point de référence connu-bon
près de la guérite Route 29/46 (tuile locale (50,5)) — même composante
connexe, donc **pas** un nouveau cas du bug d'urgence du 2026-08-05
(« joueur enfermé dans une poche de 7 tuiles ») déjà corrigé par revert.
Sortie confirmée : **est × 10 tuiles puis nord × 4 tuiles** (chemin le
plus court calculé par BFS, vérifié explicitement praticable case par
case) ramène à un endroit clairement dégagé au nord de la bande de
canopée — pas une impasse, juste un passage étroit qui oblige à
continuer vers l'est avant de pouvoir remonter.

### Rendu composite (capture réelle + grille de collision superposée) : la tuile du joueur EST dans la poche de canopée déjà actée comme limite connue

Superposition Python (même technique que tout le reste de cette session)
de `Johto Route 29 HGSS.png` et de la grille de collision, centrée sur
(66,24) : la tuile du joueur et ses voisines à l'est (le seul côté
ouvert) sont du **même pixel-art de pin dense** que les tuiles
immédiatement au nord, au sud et à l'ouest (marquées mur, correctement,
ce sont de vrais pins) — aucune différence visuelle entre une tuile
praticable et une tuile murée adjacente. Coordonnées de cette tuile
recoupées avec l'entrée du **3ᵉ signalement Route 29** plus haut dans ce
fichier (2026-08-05) : le recalage ORB de cette session-là avait déjà
localisé le joueur à « tuile locale ≈(66,24) », dans la zone que
`OUTDOOR_TERRAIN_PATCHES["MAP_ROUTE_29"]` documentait comme « 21 tuiles
qui doivent rester praticables » — **c'est la même poche**, retrouvée
indépendamment un jour plus tard par un joueur différent (l'utilisateur)
qui n'a pas pu deviner à l'œil quelle tuile de canopée identique aux
autres était praticable. Cette session-là avait déjà noté la limite en
toutes lettres : « sans calque de profondeur sprite (hors périmètre
moteur)… ~24 tuiles de cette poche resteront visuellement de la canopée
praticable » — le rebond sur 3 côtés est la manifestation concrète et
prévisible de cette limite déjà actée, pas une régression ni un nouveau
trou.

**Pourquoi ne pas corriger davantage le terrain ici** : la même
investigation avait déjà testé exhaustivement (recherche gloutonne dans
les deux sens) combien de tuiles de cette poche précise peuvent être
murées sans casser la connectivité — seulement **2 sur 26** candidates
testées, le reste (dont la position exacte du joueur ici) doit rester
praticable pour ne pas couper le seul chemin vers la guérite Route
29/46 et Ville Griotte/Route 30. Remurer davantage romprait
`verify_full_connectivity` (vérifié : muré (66,24) seul isole
immédiatement le reste de la poche à l'est, murer toute la bande casse
la continuité de la route). Un vrai correctif visuel demanderait soit un
calque de profondeur sprite (le joueur devant apparaître visuellement
« sous » la canopée sur ces tuiles précises — hors périmètre du moteur
2D à plat actuel), soit une retouche d'asset graphique distinguant la
canopée praticable de la canopée murée (hors périmètre contenu) — les
deux déjà écartés dans l'entrée du 3ᵉ signalement pour la même raison.

### Piste bug client : écartée par cette même preuve, pas juste par manque de reproduction

Un rebond visible (`setBumpKey` incrémenté, animation de bump déclenchée)
est incompatible avec les hypothèses de bug client envisagées au départ
de cette investigation (`warpFadeActiveRef`/`isTransitioningRef` coincés
à `true`, D-pad ouest qui ne reçoit pas les événements pointeur) : dans
ces cas-là, `attemptStep` retournerait tôt (`return` silencieux) sans
jamais atteindre le test de collision qui déclenche le bump — l'input
ouest/nord/sud n'aurait produit AUCUNE animation, pas un rebond. Lecture
de code de contrôle (pas seulement déduction) : `goToZone` (ligne 639)
enveloppe tout son corps dans `try/catch/finally`, `finally` remet
toujours `isTransitioningRef.current = false` ; `goToZoneWithFade`
(ligne 696) enchaîne sur `goToZone(...).finally(...)`, qui ne peut donc
jamais rester bloqué puisque la promesse interne ne rejette jamais.
Aucun scénario de ref coincée trouvé. Le D-pad (`z-[70]`, ligne 1382) et
l'overlay de fondu (`z-[90]`, `pointerEvents: 'none'`, ligne ~1508) ne se
chevauchent pas fonctionnellement (l'overlay ne bloque jamais les clics,
qu'il soit visible ou non) — de toute façon sans objet ici puisque le
bump prouve que le clic/la touche a bien été reçu(e) et traité(e). Le
très vieux point ouvert « mouvement gauche/droite non reproduit »
(2026-08-03) reste donc un mystère à part entière, non expliqué ni
résolu par cette investigation — mais ce 4ᵉ signalement-ci, lui, est
maintenant pleinement expliqué et n'a pas besoin d'un bug client pour
l'être.

### Conclusion — aucun correctif appliqué (aucun bug trouvé à corriger)

Pas un trou de données (terrain vérifié deux fois, cohérent avec le
rebond signalé, connectivité complète confirmée par flood-fill exhaustif)
et pas un bug client (le rebond lui-même exclut les pistes de ref
coincée/CSS envisagées). C'est un mur réel, à l'endroit exact rapporté,
qui fait partie d'une poche de canopée déjà identifiée et volontairement
laissée praticable-mais-visuellement-fausse à la session précédente,
faute de calque de profondeur ou de retouche d'asset (tous deux hors
périmètre). **Aucun fichier modifié**, `npm run check` non re-testé après
coup côté code (rien n'a changé) — dernier run de contrôle avant cette
entrée : **570/570 tests verts**, `validate:content` sans nouveau
bloquant.

**Pour l'utilisateur, immédiatement** : depuis cette position précise,
avancer vers l'**est** (une dizaine de tuiles) puis vers le **nord**
(quelques tuiles) fait sortir de la poche de canopée — le chemin le plus
court calculé confirme que ce n'est pas une impasse.

**Ce qui manque encore pour le point resté ouvert du 2026-08-03**
(mouvement gauche/droite jamais reproduit, cas général, hors Route 29) :
une observation précise sur une zone où le rebond ne correspond PAS à un
vrai mur des données (i.e. l'utilisateur voit de l'herbe/un chemin
dégagé au même endroit où le jeu refuse le pas) — ce signalement-ci,
lui, avait un vrai mur ; le prochain test de diagnostic utile serait de
comparer, au moment même du blocage, une capture d'écran ET la position
DB fraîche, pour établir si le rebond correspond à un mur réel (comme
ici) ou à un faux mur (ce qui pointerait enfin vers un vrai bug, de
données ou de code).

---

## 2026-08-05 (suite 4) — CAUSE RACINE de toute la série « arbres/obstacles » : la grille de collision n'était pas posée au bon endroit sur l'image

**Signalement** : « j'ai l'impression que les arbres sont mal gérés de manière
générale, pareil pour les obstacles » — trois captures : (1) impossible d'aller
à gauche, rebond sans obstacle visible ; (2) le joueur passe par-dessus les
arbres ; (3) un passage complètement fermé. Conclusion de l'utilisateur : « il
faut revoir comment les maps sont créées ». Elle était juste.

### Ce qui n'allait pas

`build-zone-registry.py` posait la grille ROM sur la capture avec

    scale_x = screenshot_w / tile_width
    scale_y = screenshot_h / tile_height

c'est-à-dire « la capture couvre exactement la grille, sans marge, tuile (0,0)
au coin haut-gauche ». Les deux moitiés de l'hypothèse sont fausses :

- les cartes HGSS publiées sont des rendus à **caméra oblique** — une tuile
  fait ~16 px de large pour ~12 px de haut. La hauteur de l'image ne porte
  aucune information sur le pas vertical ;
- elles sont **recadrées à la main**, avec une marge variable de décor hors
  carte (le border block dessiné autour de la zone).

Mesuré sur Route 29 : pas réel **(16.00, 12.06)** px/tuile, origine **(23, 80)**.
La formule donnait (16.47, 17.44) et (0, 0) → la grille était étirée pour
remplir l'image et dérivait jusqu'à **~20 tuiles** en bas de carte. C'est
l'explication unique et complète des trois captures, et de tous les
signalements précédents : arbres traversables, murs invisibles, passages
fermés, PNJ dans la canopée, « je rebondis ».

Méthode de diagnostic (reproductible) : superposer la grille brute à l'image et
chercher (pas, origine) maximisant la séparabilité couleur entre tuiles murées
et tuiles praticables. Le score double d'un coup (Route 29 : 0.83 → 1.91 ;
Route 30 : 0.71 → 1.71), et sur le rendu superposé chaque arbre, bâtiment et
falaise tombe exactement sous une tuile rouge, chaque chemin, herbe et bande de
sable reste libre.

### Ce qui a été fait

- **Nouveau** `scripts/build/fit-map-alignment.py` : recale chaque zone et écrit
  `scripts/sources/map-alignment.json` (mis en cache par nom+taille de fichier
  image ; à relancer quand une capture change).
- `build-zone-registry.py` lit ce fichier ; le registre porte désormais
  `origin_px`/`origin_py` en plus de `scale_x`/`scale_y`, qui deviennent un
  **pas de tuile mesuré**, plus un rapport de dimensions.
- **Garde qualité** : sous le seuil de recalage, la capture ne montre pas cette
  grille (mauvaise attribution, template générique) → zone servie sans
  screenshot, donc rendu `CollisionCanvas`, fidèle par construction.
- `src/lib/zone-geometry.ts` expose `worldToPixel(zone, x, z)`, seul chemin
  monde → écran ; `MapClient` l'utilise partout.
- **Nouveau** `scripts/validate/render-collision-overlay.py` : rend une zone avec
  sa grille superposée, aux valeurs exactes du registre. Contrôle visuel de
  référence pour tout futur signalement de ce type.
- **Reverté** : `OUTDOOR_TERRAIN_PATCHES` (~300 tuiles murées à la main sur
  Route 29 en trois passes) et `OUTDOOR_OBJECT_POSITION_PATCHES`. Avec eux,
  `verify_full_connectivity`, qui n'existait que pour rattraper ces patches.
  Le terrain servi est de nouveau **strictement celui de la ROM** — vérifié
  identique caractère par caractère.
- `src/lib/map-alignment.test.ts` : 9 tests verrouillant l'invariant (pas ≈
  16×12, origine non nulle prise en compte, terrain Route 29 non muré,
  grille contenue dans son image pour les 406 zones à capture).
- `docs/adr/0006-map-alignment-is-measured-data.md`.

### Leçon de méthode (la vraie sortie de cette passe)

Les trois passes précédentes ont muré des centaines de tuiles pour faire coller
la collision à ce que l'image *semblait* montrer — en traitant l'image comme la
vérité et la donnée ROM comme le bug. C'était l'inverse. Le coût de cette
inversion n'a pas été théorique : un de ces patches a réellement enfermé un
joueur dans une poche de 7 tuiles. Un scanner de plus en plus sophistiqué
(v1 puis v2, clustering couleur, composantes connexes) a été construit pour
trouver des « trous » qui n'existaient pas — il mesurait le décalage, pas un
défaut de donnée. **Quand une correction locale doit être refaite une 3ᵉ fois
au même endroit, le défaut n'est pas local.**

### Reste ouvert

- Le recalage complet des 406 zones à capture tourne (~2 h) ; les 4 zones du
  jalon 1 sont faites et vérifiées à l'œil. Les zones non encore recalées
  gardent l'ancien comportement (donc potentiellement faux) et sont listées à
  chaque build.
- Pas de calque de profondeur : un arbre dont la canopée déborde sur la tuile
  au nord la couvre à l'écran, et le joueur qui s'y tient est dessiné
  par-dessus. Défaut cosmétique de quelques pixels désormais, plus une cause de
  blocage — chantier séparé si ça gêne encore en jeu.

---

## 2026-08-05 (suite 5) — écran せってい, doublons de PNJ peints, bruitages extraits de la ROM, décor des intérieurs

Quatre signalements en une passe, plus la fin du recalage des 406 zones.

### « Compte tous les npc en double » (labo d'Elm) — 3

La capture `Elms lab 1F HGSS.png` n'est pas un rendu de décor : c'est une
**capture de partie**, personnages compris. Le moteur dessinant ensuite ses
propres sprites par-dessus, chacun apparaissait deux fois :

| doublon | peint dans l'image | sprite du moteur |
|---|---|---|
| Pr. Elm | tuile (6,4) | tuile (5,4) |
| Assistant | tuile (9,12) | même tuile |
| Dresseur + Chikorita | milieu de l'allée | — c'est le joueur qui a pris la capture |

Le troisième n'était pas un doublon de PNJ mais du **joueur**. Corrigé par
`scripts/build/scrub-baked-npcs.py` : chaque personnage est recouvert par du
sol pris ailleurs dans la même image, décalé d'un nombre entier de tuiles pour
que le carrelage retombe en phase (ou, quand aucun voisin n'est libre, par
répétition de la tuile de sol la plus uniforme de l'image — écart-type 4.9).
L'original n'est pas modifié : sortie dans un fichier `(sans PNJ)`. D'autres
captures ont le même défaut (Player House 1F en a aussi) : ajouter une entrée
suffit.

### « Le professeur ne dit que "..." »

Celui du bas à droite est l'**assistant**, et même pas le PNJ curaté : l'objet
de décor ROM, qui n'a pas de dialogue — d'où le « ... ». Le vrai Elm est en
(5,4) avec son dialogue complet. Il était juste indiscernable de son sosie
peint ; la retouche ci-dessus règle la confusion.

### « Le bruit de dialogue n'est toujours pas le bon »

La source était bonne, le rendu incomplet. `SEQ_SE_DP_SELECT` n'est pas une
note : la séquence en enchaîne **quatre** (94, puis 103 trois fois) avec des
changements de volume entre. `extract-hgss-sfx.py` ne lisait que la première.
Il joue maintenant la séquence entière (mini-séquenceur : notes, repos, tempo,
volume, pitch bend) → 131 ms, deux tons (1.9 kHz puis 3.2 kHz).

### « Mets des paramètres »

Le slot せってい était grisé. Écran réel, navigable au clavier (↑↓ choisir,
←→ changer) comme au clic : vitesse d'écriture (おそい/ふつう/はやい/すぐに),
son du texte, volume musique, volume bruitages, よみがな par défaut, えいご par
défaut. `src/lib/settings.ts` + `use-settings.ts`.

Deux points de robustesse, tous deux des rechutes évitées :
- `useSyncExternalStore` et pas `useState(() => readSettings(...))` — lire le
  stockage au premier rendu client rejouerait l'erreur d'hydratation déjà
  corrigée sur le bouton muet ;
- `localStorage` indisponible (navigation privée, iframe, jsdom sans origine)
  → repli mémoire au lieu d'une exception.

Les deux derniers réglages (よみがな/えいご) n'existent pas dans HGSS mais sont
les seuls qui changent la façon d'apprendre. Ils donnent l'état de départ ;
X et Y restent basculables ligne par ligne.

### « Le nom de zone comme dans le vrai jeu »

Cherché : Bulbapedia documente les « location preview » (cartes illustrées de
Saya Tsuruta) mais seulement pour certains lieux marquants — ni villes ni
routes — et ne décrit nulle part l'habillage à l'écran. Les assets d'interface
extraits de la ROM (`public/sprites/ui/menus/`) sont inexploitables, palettes
perdues. Reconstruit en CSS : plaque arrondie **en haut à gauche** (l'ancienne
était centrée), double liseré bleu nuit + filet blanc, fond dégradé clair, qui
glisse depuis le bord et repart du même côté.

### « L'intérieur des maisons n'a pas de décor »

C'était `MISATTRIBUTED_SCREENSHOTS` : 15 intérieurs du jalon 1 servis sans
capture, liste écrite à la main, au motif que « l'art recyclé ment sur les
murs ». Le symptôme était réel, la cause non — c'est la grille qui était mal
posée. Une fois l'alignement mesuré, les 15 se recalent proprement (0.82 à
1.64, contre 0.33 à 1.40 avant). Liste supprimée, le tri se fait par mesure.

### Recalage terminé — et deux défauts de conception trouvés en route

406 zones recalées. **375 servies avec leur décor, 31 rejetées.**
Les 27 zones des jalons 1 et 2 ont toutes leur décor.

- **Boucle fermée** : le recalage lisait la capture de chaque zone dans le
  registre. Une capture rejetée disparaissant du registre, la zone n'était plus
  recalée — donc plus jamais ré-évaluable. Rejet définitif par accident.
  L'association zone → capture est désormais écrite AVANT le filtre
  (`scripts/sources/zone-screenshots.json`) et c'est elle que lit le recalage.
- **Verdict déplacé** : le recalage MESURE, le build DÉCIDE. La politique
  change sans relancer 20 minutes de calcul. Trois signaux au lieu d'un seul
  seuil de score : score, pas trouvé (une arène peu contrastée plafonne à 0.47
  tout en étant parfaitement calée — mais son pas retombe sur celui de la
  caméra, contrairement à un recalage dégénéré), couverture.
- Garde de coût : une capture 208×192 px pour une grille de 160×128 tuiles
  faisait balayer des millions de décalages — plus d'une heure sur une seule
  zone. Un candidat de pas qui ne peut pas couvrir le minimum requis est
  écarté avant le balayage.

### Reste ouvert

Les 31 captures rejetées le sont pour la plupart parce que le script leur a
attribué la **mauvaise image** : `MAP_CERULEAN` pointe l'arène, `MAP_VIRIDIAN`
la forêt — alors que `Cerulean City HGSS.png` et `Viridian City HGSS.png` sont
dans le dépôt. L'attribution se fait encore par mots-clés dans le nom de
fichier (c'est déjà ce qui avait mal attribué 171 zones). La suite logique :
la faire trancher par la mesure — essayer les meilleurs candidats, garder
celui qui se cale réellement.

---

## 2026-08-05 (suite 6) — effacement de partie, dresseurs reposés sur la ROM, et le constat sur le gating

### « Un bouton reset qui supprime ma partie »

Écran せってい → `データを　けす`, avec confirmation obligatoire (le bouton
ouvre, c'est la confirmation qui efface). `src/app/menu/reset-actions.ts`.

Efface la PARTIE, pas le COMPTE : les 8 tables porteuses d'un `user_id`, plus
`trainer_name`/`avatar` remis à null pour que `isOnboarded()` renvoie faux et
que la page d'accueil renvoie sur /onboarding, comme un compte neuf. La ligne
`users` reste : la supprimer casserait la session en cours et le joueur serait
recréé au chargement suivant sans que rien de plus soit effacé.

`reset-actions.test.ts` lit les migrations et exige que toute table portant un
`user_id` soit dans la liste — un oubli le jour où on ajoute une table ferait
mentir une action qui promet d'effacer tout.

### « Les dresseurs sur la route ne font rien »

Deux causes, l'une invisible, l'autre littéralement.

**1. Ils n'étaient pas dessinés.** Le bloc de rendu des dresseurs produisait un
`<div>` vide de 18 px : aucun sprite, jamais. On ne pouvait ni les voir ni
deviner où passait leur ligne de vue.

**2. Ils n'étaient pas au bon endroit.** Leurs positions étaient
`source: "generated"` — inventées au dépouillement, jamais confrontées à la
ROM. Sur Route 30 : posés en (6,0), (19,13), (23,23), tous face au sud, alors
que le jeu les place en (6,10), (9,44), (8,37) et que deux regardent l'est et
l'ouest. Mal placé + mal orienté = une ligne de vue qui ne croise jamais le
chemin du joueur.

L'identité était pourtant déjà dans les données extraites : le `scriptId` des
objets vaut littéralement `std_trainer(TRAINER_BUG_CATCHER_DON)`. Personne ne
l'avait lu. `scripts/build/match-trainers-to-rom.py` apparie les noms de
contenu aux constantes ROM (sous-séquence de mots, parce que la ROM insère des
infixes : `TRAINER_BIRD_KEEPER_GS_ROD` pour « Bird Keeper Rod »), départage par
zone, et repose position + orientation + sprite.

**191 dresseurs sur 307 reposés — les 191 avaient tous une position fausse.**
23 ambigus (les sbires Rocket, tous homonymes) et 93 sans correspondance (chefs
d'arène et personnages scénarisés, qui n'utilisent pas `std_trainer`) sont
laissés tels quels : mieux vaut une position inventée qu'une position
confidente et fausse.

Effet de bord utile : les dresseurs d'arène étaient rangés sous le `zone_id` de
la ville alors qu'ils se tiennent dans `MAP_*_GYM`. `map_zone` prime désormais,
comme pour les PNJ.

### « On peut se déplacer partout sans que personne ne nous arrête »

Constat, et ce n'est pas un bug : **la couche de gating n'a jamais été écrite.**

- `gateBlocksEntry` (src/lib/zone-gate.ts) est le SEUL contrôle à l'entrée
  d'une zone extérieure, et sa question unique est « la session SRS du jour
  est-elle faite ? ». Une fois les révisions du jour terminées, tout Johto et
  tout Kanto sont ouverts.
- Un seul PNJ bloquant existe dans TOUT le contenu : `rocket_grunt_azalea`.
  176 PNJ, 1 barrage.
- `unlocked_zones` existe en base et n'est lu par aucun contrôle de
  déplacement.

Le jeu d'origine, lui, verrouille par variable de scène et déclencheur de
tuile : à Bourg Geon, `VAR_SCENE_NEW_BARK_WEST_EXIT` fait sortir Elm en courant
pour vous barrer la route tant qu'il ne vous a pas donné de starter (vérifié
dans le décompilé, `scr_seq_0842_T20.s`).

**Ce que ça implique pour le correctif.** Le mécanisme Roadblock de ce moteur
est un cône de vue : il barre UNE ligne. Or la sortie ouest de Bourg Geon fait
7 tuiles de haut — il faudrait 7 PNJ pour la fermer. Le bon niveau est donc un
**gate de zone piloté par la donnée** (une table MAP_* → conditions + message,
lue par `checkZoneEntry`), et non des PNJ bloquants. Le vocabulaire nécessaire
existe déjà (Condition/quest_step, ADR-0003) ; c'est la table et son contenu
qui manquent.

Même cause pour « les missions vont trop vite » : rien ne séquence les quêtes
sur la carte. Elles avancent dès qu'on croise le bon PNJ, et rien n'empêche de
croiser le PNJ de l'étape 5 avant celui de l'étape 1.

Périmètre à décider avant d'écrire : gating du seul jalon 1, ou de tout le
parcours ? Ça conditionne le volume de contenu (83 zones ont déjà un champ
`locks` dans story-beats.json, jamais exploité).

---

## 2026-08-05 (suite 7) — répliques d'ambiance pour les 2093 figurants, et pourquoi les dresseurs ne se battent pas

### « On n'avait pas déjà écrit tout ça ? » — si, mais pas pour eux

Deux populations très différentes peuplent la carte :

| population | nombre | dialogue |
|---|---|---|
| PNJ **curatés** (content/map/npcs.json) | 176 | 172 fichiers écrits à la main |
| Personnages de **décor** (objets de la ROM) | ~2093 | aucun |

Le contenu existe donc bel et bien — pour les 176. Les figurants, eux, viennent
des objets de carte : ni fiche, ni `dialogue_ref`, et le moteur leur servait un
`・・・・・・` muet, avec ce commentaire assumé : « no authored dialogue yet —
a wordless beat instead of dead air (no invented content) ».

Ce sont eux qu'on croise partout, d'où l'impression que personne n'a rien à dire.

### Ce qui a été ajouté

`content/dialogues/ambient/lines.json` — 50 répliques réparties en cinq
registres : point de japonais glissé dans une remarque (`tip`), formule du
quotidien dite dans sa vraie situation (`phrase`), tranche de vie japonaise
(`life`), だじゃれ (`joke`, le registre d'humour le plus courant au Japon), et
remarque de voyageur (`road`). Même style que les PNJ curatés : kana
majoritaire, espaces pleine largeur, lectures inline.

`src/lib/ambient-lines.ts` sert une réplique par figurant, **de façon
déterministe** (hash FNV-1a de l'identifiant d'objet) : le même villageois dit
toujours la même chose. C'est le point qui fait tenir l'illusion — un figurant
qui change de phrase à chaque interaction est plus faux que muet. Le battement
muet reste le repli si le pool est vide.

Piste laissée ouverte : une affinité sprite → registre (un pêcheur parlerait de
la mer). Le pool est aujourd'hui commun, ce qui est honnête mais uniforme.

### « Les dresseurs ne lancent toujours aucun combat »

Ce n'est pas la position (corrigée à la passe précédente) ni le rendu. C'est
`engageTrainer` :

```
const studiedItems = studiedKanjiInOrder(state.completed_lessons, ...)
if (studiedItems.length === 0) { /* pas de combat */ }
```

Un combat se joue sur les kanji étudiés. **La sauvegarde du joueur a
`completed_lessons` VIDE** (vérifié en base : 0 leçon finie, 0 carte SRS, 0
révision) — donc aucun combat n'est constructible, pour aucun dresseur.

Le code portait l'annotation « inatteignable sur le chemin critique (le premier
dresseur exige déjà des leçons) ». Elle est fausse depuis que le gating manque :
rien n'oblige à faire une leçon avant d'arriver sur Route 30. Le joueur croisait
donc des dresseurs qui lançaient leur accroche et… rien.

Correctif immédiat : la réponse dit maintenant pourquoi
(`ui-strings.battle_no_kanji`), au lieu de laisser croire à un bug. Le vrai
correctif est le gating — c'est le même trou que « personne ne m'arrête ».

**Reste à élucider** : pourquoi 0 leçon terminée alors qu'une leçon a été jouée
avec succès le 04/08 ? Soit la complétion n'a jamais été écrite, soit elle l'a
été puis perdue. À instrumenter au prochain passage sur une leçon.

---

## 2026-08-06 — verrous de progression, et l'affaire des « 0 leçon »

### Les 0 leçon terminée : fausse alerte

Ma lecture datait de 16:32 ; la leçon #1 a été terminée à 16:41. État réel :
`completed_lessons = ['new-bark-town#1']`, 12 cartes SRS (6 kanji × sens/lecture),
1 point de grammaire. Le pipeline de leçon fonctionne. Conséquence directe : les
combats de dresseurs sont désormais constructibles — c'était bien
`studiedItems.length === 0` qui les empêchait.

### Verrous de progression

**Sources.** `content/guidebook-adapted.md` est déjà une source curatée et
adaptée : les marqueurs 🔒 et les mentions « bloque » y recensent les verrous du
jeu d'origine zone par zone. Complété par le décompilé
(`scr_seq_0842_T20.s` : `VAR_SCENE_NEW_BARK_WEST_EXIT` fait sortir Elm en
courant tant qu'il n'a pas donné de starter) et StrategyWiki/Bulbapedia.

**Modèle.** `content/map/roadblocks.json` : un verrou barre un FRANCHISSEMENT
précis (zone de départ → zone d'arrivée) tant que ses `unlock_conditions` ne
sont pas remplies. Trois décisions qui comptent :

- **Un sens, pas une zone.** Le verrou ne s'applique qu'à l'aller. Le retour
  n'est jamais bloqué — sinon un joueur qui franchit la limite au moment où la
  condition tombe se retrouve enfermé du mauvais côté.
- **Décision serveur.** `checkZoneEntry` tranche et renvoie de quoi JOUER la
  scène ; le client n'évalue rien. Un verrou côté client se contourne.
- **Le garde est un acteur, pas un PNJ.** Il surgit de son poste pour barrer la
  route puis s'efface — comme Elm qui sort du labo. Aucun garde planté là en
  permanence : ça n'existe pas dans le jeu d'origine pour ces scènes.

**Scène animée** (demandée explicitement) : « ! » → temps d'arrêt → le garde
marche jusqu'au joueur → il parle → il regagne son poste. Le temps d'arrêt
(`BANG_MS`) manquait aussi à l'interception des PNJ bloqueurs existants : le
« ! » et le premier pas tombaient dans la même image, on ne voyait jamais
l'exclamation. `interceptionApproach` marche maintenant en L au lieu de suivre
le seul axe de vue — sans quoi le mécanisme restait inutilisable pour une
sortie de ville large de plusieurs tuiles.

**Garde-fou : `scripts/validate/lint-roadblocks.py`.** Un verrou dont la
condition n'est atteignable qu'APRÈS le franchissement qu'il barre est un
blocage définitif — même famille d'erreur que le patch de terrain qui avait
muré un joueur, en moins visible. La règle vérifiée : **la clé doit être du
même côté que la serrure**. Vérifié aussi : zones connues, poste du garde sur
une tuile praticable, sprite résoluble, réplique non vide. Le linter a été
testé contre ses deux cas d'échec (clé derrière la serrure, poste dans un mur)
avant d'être branché sur `npm run validate:content` — un validateur qui ne
tombe jamais ne vaut rien.

**Verrous écrits (2).** Sortie ouest de Bourg Geon (starter d'Elm) et Ville
Griotte → Route 30 (visite du guide). Ce sont les deux du parcours réellement
jouable ; le modèle est en place, les suivants sont une entrée de données.

### Reste à écrire (sourcés, pas encore posés)

- Gym de Violet fermé tant que la Tour Grospignon n'est pas visitée — demande
  une Condition `visited_zone` ou un `event_cleared` qui n'existe pas encore.
- Poste-frontière nord d'Ecruteak (badge), Puits Ramoloss (déjà un PNJ
  bloqueur), Simularbre Route 36 (arrosoir — relève de `obstacles.json`, pas
  des verrous).

---

## 2026-08-06 (suite) — mise en scène : le levier qui manquait

Question de QA : « si je dois parler à quelqu'un, récupérer un objet — est-ce
que la position d'un PNJ va changer ? ce qu'il a à me dire changera aussi ? »

Le texte changeait déjà (`state_rules`), la présence aussi
(`unlock_conditions` + `negate`). **La position, non** : un PNJ n'avait qu'un
`tile_x`/`tile_y`. Or le jeu d'origine déplace ses figurants en permanence —
l'assistant d'Elm remet des Potions à la sortie du labo, puis tient le comptoir
du Mart de Ville Griotte.

### Ce que fait le jeu d'origine

Il pilote sa mise en scène par des **variables de scène** : un entier par zone
(`VAR_SCENE_NEW_BARK_TOWN_OW`, `VAR_SCENE_CHERRYGROVE_CITY_OW`,
`VAR_SCENE_ROUTE_30_OW`), lu au chargement de la carte, écrit par les scripts —
souvent depuis une AUTRE carte : `scr_seq_0229_R30R0201.s` (maison de
Mr. Pokémon) écrit la scène de Ville Griotte ET celle de la Route 30, ce qui
arme l'embuscade de Silver au retour.

Ici l'équivalent existait déjà : **l'étape de quête EST la variable de scène**.
`mystery_egg_errand` = `sent_by_elm` → `egg_received` → `egg_delivered`, trois
valeurs ordonnées, déjà dans le vocabulaire `Condition` (ADR-0003).

### Ce qui a été ajouté

- **`placements[]`** : un PNJ déclare plusieurs postes, chacun gardé par des
  conditions, le premier qui tient gagne. Ordre du plus tardif au plus précoce
  (`quest_step` signifie « à ce stade OU APRÈS » : sans cet ordre, le poste
  précoce gagnerait toujours). Le dernier poste est sans condition — c'est le
  début de partie.
- Le placement actif décide de la ZONE : un PNJ change légitimement de carte.
  `getNpcsForZone` résout donc AVANT de filtrer par zone, et les gardes
  d'écriture résolvent avec le même état — sinon un PNJ visible à l'écran serait
  refusé en interaction.
- Appelants purs (audits de traversée) : résolution sans état → poste par
  défaut, c'est-à-dire le jeu à son début, l'état où la carte doit être
  franchissable.
- **`content/opening-sequence.md`** : l'ouverture déroulée étape par étape, avec
  sources (décompilé + Bulbapedia Part 1/2 + guidebook), et pour chaque étape
  qui apparaît, qui se déplace, quel texte change, et l'état (✅ en place / 🔜
  écrit pas posé / ➖ hors périmètre). C'est le gabarit à remplir zone par zone.
- **ADR-0007** : trois leviers de mise en scène, jamais un quatrième.
- **`scripts/validate/lint-npc-placements.py`** : refuse un poste dans un mur,
  un poste sans voisin praticable (PNJ injoignable alors qu'il porte peut-être
  la clé de la suite), une liste sans poste par défaut, deux postes aux
  conditions identiques. Testé contre ses cas d'échec avant branchement.

### Appliqué

L'assistant d'Elm : labo → comptoir du Mart de Griotte (entre `egg_received` et
`egg_delivered`, là où HGSS le poste pour relayer l'appel d'Elm) → labo. Avec
son second état de dialogue, qui manquait.

Le reste des déplacements de l'ouverture (Lyra/Ethan, le guide de Griotte, Elm
qui rattrape le joueur sur la Route 29, Silver à la fenêtre) est documenté et
prêt à poser : c'est de la donnée, plus du moteur.

---

## 2026-08-06 (suite 2) — audit « début de partie → première arène »

Question : le début du jeu est-il livrable ? Elle ne se répond pas à l'œil — la
réponse dépend de dizaines de fichiers qui doivent tous être là EN MÊME TEMPS.
D'où `scripts/validate/audit-first-gym-run.py`, qui parcourt le chemin critique
(Bourg Geon → Route 29 → Ville Griotte → Route 30 → Route 31 → Violet City →
Tour Grospignon) et vérifie, zone par zone : chaque kanji enseigné existe, a des
phrases d'exemple et leur audio ; chaque PNJ a un dialogue avec un état par
défaut et des pages non vides ; chaque dresseur a `battle_intro` et
`post_battle` ; chaque entité est joignable ; les panneaux ont bien leur texte.

### Ce qu'il a trouvé — 6 bloquants, tous réels ou révélateurs

| trouvé | verdict |
|---|---|
| **Falkner en (70,30) de violet-city** — hors grille | vrai bug : il n'était atteignable par personne. Reposé sur son objet ROM `obj_T22GYM0101_gsleader1`, DANS `MAP_VIOLET_GYM` (15,4) |
| **Silver de la Tour en (12,12) dans un mur** | la tuile était juste, c'est l'ÉTAGE qui manquait : l'objet ROM est au **3F**, sans `map_zone` il était servi au 1F |
| **Les 4 sages de la Tour absents du contenu** | vrai trou : la visite de la tour conditionne l'accès à l'arène. Reposés sur leurs objets ROM (`std_trainer(TRAINER_SAGE_*)`), 4 dialogues écrits |
| **2 dresseurs sans sprite** (Silver, Falkner) | invisibles à l'écran. Corrigé |
| 3 « PNJ muets » (PC, panneau, inscription) | faux positifs de mon audit : ce sont des `kind: sign/object`, le moteur leur sert un texte. L'audit apprend la règle — et vérifie désormais qu'un panneau a bien une tuile praticable **devant** lui, pas sous lui |

### Le parcours, prouvé

`src/lib/first-gym-run.test.ts` : BFS depuis la porte de la maison du joueur
jusqu'à Falkner. Il a fallu apprendre à la marche à **traverser les guérites** —
Route 31 et Violet City ne se touchent pas, elles sont reliées par
`MAP_ROUTE_31_VIOLET_GATEHOUSE`. Une marche qui ignore les portes conclut à tort
que la carte est coupée (c'est ce que mon premier jet a fait).

Vérifié : les 6 zones atteintes à pied, la porte de la tour et celle de l'arène
atteignables, les 4 sages joignables dans leur étage, Falkner et ses 2 gardes
joignables dans l'arène, Silver au 3F et pas au 1F, et un plancher de volume
pédagogique (≥ 20 leçons, ≥ 100 kanji) pour que l'arène n'arrive pas trop tôt.

### État

**26 leçons · 140 kanji · 280 phrases d'exemple avec audio · 159 pages de
dialogue japonais · 12 dresseurs · 31 PNJ.** Aucun bloquant.

### Ce qu'aucun script ne dira

La qualité du japonais (naturel, registre, cohérence de niveau) et le rythme de
game design. L'audit vérifie que la matière EXISTE et se tient, pas qu'elle est
bonne. 159 pages + 280 phrases d'exemple, c'est un volume de relecture humaine
réel, à faire avant de parler de livraison.
