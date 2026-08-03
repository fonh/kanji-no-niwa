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
