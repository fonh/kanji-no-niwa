---
status: accepted
---

# Le placement de la grille de collision sur la carte est une donnée mesurée, pas une formule

Le moteur affiche une zone comme une image plate (capture HGSS publiée) sur
laquelle on pose une grille de collision extraite de la ROM. Le lien entre les
deux — quel pixel de l'image correspond à quelle tuile — était calculé :

    scale_x = screenshot_w / tile_width
    scale_y = screenshot_h / tile_height

soit l'hypothèse « la capture couvre exactement la grille, sans marge, coin
haut-gauche sur la tuile (0,0) ». Les deux moitiés sont fausses :

- les cartes HGSS sont des rendus à **caméra oblique** : une tuile fait ~16 px
  de large mais ~12 px de haut (raccourci vertical ≈ 0.75). La hauteur de
  l'image ne dit donc rien du pas vertical ;
- les captures publiées sont **recadrées à la main**, avec une marge variable
  de décor hors carte (le « border block » que le jeu dessine autour de la
  zone). L'origine n'est pas (0,0), et la marge diffère d'une image à l'autre.

Mesuré sur Route 29 : pas réel (16.00, 12.06) px/tuile, origine (23, 80) — la
formule donnait (16.47, 17.44) et (0, 0), soit une dérive allant jusqu'à ~20
tuiles en bas de carte. Tout ce que la QA humaine a remonté pendant trois jours
(arbres qu'on traverse, murs invisibles en pleine herbe, passages « fermés »,
PNJ posés dans la canopée, joueur qui rebondit sans obstacle visible) est ce
seul décalage vu à des endroits différents.

**Décision :** l'alignement est une **donnée mesurée par image**, produite hors
build et commitée.

- `scripts/build/fit-map-alignment.py` recale chaque zone : il cherche
  (pitch_x, pitch_y, origin_x, origin_y) qui maximisent la séparabilité entre
  la couleur moyenne des tuiles murées et celle des tuiles praticables. La
  grille ROM sert d'étiquette — aucune heuristique de couleur codée en dur,
  donc rien à réajuster par palette ou par région.
- Sortie : `scripts/sources/map-alignment.json`. `build-zone-registry.py` ne
  fait plus que la lire et l'écrire dans le registre
  (`scale_x`/`scale_y` = pas d'une tuile, `origin_px`/`origin_py` = pixel de la
  tuile (0,0)).
- Côté client, `worldToPixel(zone, x, z)` (src/lib/zone-geometry.ts) est le
  seul chemin monde → écran.
- Le recalage **mesure** ; c'est `build-zone-registry.py` qui **décide** si la
  capture illustre vraiment la zone. Séparation voulue : la politique peut
  changer sans relancer les 20 minutes de calcul. Trois signaux :
  - le **score** de séparabilité (≥ 0.60 suffit seul) ;
  - le **pas trouvé** : la caméra HGSS est fixe (~16 × ~12 px/tuile). Un
    recalage qui retombe dessus a trouvé la vraie grille même si le score
    plafonne bas faute de contraste (Violet Gym : 0.47, sol et murs de teintes
    voisines) ; un recalage dégénéré s'effondre sur des valeurs sans rapport
    (6.76, 1.98, 3.68 px/tuile observés). Pas plausible → seuil abaissé à 0.35 ;
  - la **couverture** : la part de la grille qui tombe dans l'image. Sous 0.60,
    la capture ne montre qu'un coin de la zone et le joueur marche dans le noir.
  Zone rejetée = servie **sans screenshot**, donc rendue en `CollisionCanvas` —
  laid, mais fidèle à la collision par construction. Un joueur qui voit une
  grille comprend qu'il voit une grille ; un joueur qui voit une jolie carte
  fausse croit à un bug de jeu.
- Un piège de bouclage, corrigé : le recalage lisait la capture de chaque zone
  DANS le registre. Une capture rejetée disparaissant du registre, la zone
  n'était plus recalée du tout — donc plus jamais ré-évaluable. Le rejet
  devenait définitif par accident. `build-zone-registry.py` écrit désormais
  l'association zone → capture AVANT le filtre
  (`scripts/sources/zone-screenshots.json`), et c'est ce fichier que lit le
  recalage.

## Considered Options

- **Corriger la collision pour coller à l'image** — c'est ce qui avait été fait
  trois fois (`OUTDOOR_TERRAIN_PATCHES`, ~300 tuiles murées à la main sur
  Route 29, plus un objet déplacé). Rejeté et **reverté** : traitait l'image
  comme la vérité et la ROM comme le bug, alors que c'était l'inverse. Coût
  réel : un patch a enfermé un joueur dans une poche de 7 tuiles sans issue, ce
  qui a nécessité une garde de connectivité exhaustive
  (`verify_full_connectivity`) qui n'existait que pour rattraper des patches
  eux-mêmes injustifiés. Les deux sont supprimés.
- **Recaler à la main, zone par zone** — 406 zones avec capture ; intenable, et
  non vérifiable après coup.
- **Rendre les cartes depuis la ROM plutôt qu'utiliser des captures** — la voie
  propre à terme (plus de recalage du tout), mais l'issue 13 a déjà établi que
  le rendu 3D depuis la ROM ne marche que pour les extérieurs, et ce serait un
  chantier sans commune mesure avec le jalon en cours. Hors périmètre ici.
- **Un pas global (16, 12) sans origine par image** — le pas est bien quasi
  constant (c'est la caméra), mais la marge de recadrage, elle, varie d'une
  capture à l'autre : sans origine par image, la dérive persiste.

## Consequences

- `scripts/validate/render-collision-overlay.py` rend n'importe quelle zone avec
  sa grille superposée, aux valeurs exactes du registre : c'est le contrôle
  visuel de référence pour tout signalement « je traverse un arbre / je
  rebondis sur rien ». À regarder AVANT de toucher à la moindre donnée.
- Le terrain servi est de nouveau strictement celui de la ROM. Toute
  divergence entre l'image et la collision se corrige désormais du côté de
  l'alignement ou de l'image, **jamais** en murant des tuiles.
- Reste non traité, et assumé : le moteur n'a pas de calque de profondeur. Un
  arbre dont la canopée déborde sur la tuile au nord la couvre à l'écran, et le
  joueur qui s'y tient est dessiné par-dessus l'arbre au lieu d'être caché
  derrière. C'est maintenant un défaut cosmétique de quelques pixels, plus une
  cause de blocage.
- `fit-map-alignment.py` doit être relancé quand une capture est ajoutée ou
  remplacée (il met en cache par nom+taille de fichier), puis
  `build-zone-registry.py`. Le build liste les zones non recalées, et refuse
  d'utiliser un recalage dont la clé ne correspond plus à la capture servie.
- La liste `MISATTRIBUTED_SCREENSHOTS` (15 intérieurs du jalon 1 servis sans
  capture, écrite à la main) est supprimée : elle constatait le décalage sans
  le nommer. Une fois l'alignement mesuré, les 15 se recalent proprement et
  les maisons ont un décor. Le tri se fait par mesure, plus par liste.
- Reste ouvert : 31 zones dont la capture ne se cale sur rien parce que le
  script lui a attribué la MAUVAISE image (Cerulean → l'arène, Viridian → la
  forêt — les bonnes images sont pourtant dans le dépôt). L'attribution se fait
  encore par mots-clés dans le nom de fichier. La suite logique est de la faire
  trancher par la mesure : essayer les meilleurs candidats, garder celui qui se
  cale réellement.
