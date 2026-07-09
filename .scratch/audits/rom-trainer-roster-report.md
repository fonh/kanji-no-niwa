# Rapport — dresseurs génériques par route, vérifiés depuis la ROM

**Percée méthodologique (2026-07-09)** : le dépôt de décompilation `pret/pokeheartgold` est
disponible en local (`~/pokeheartgold`, hors de ce repo) — bien plus fiable que le guidebook
OCR ou les walkthroughs web pour compter/nommer les dresseurs génériques. Contrairement au
registre `src/data/zone-registry.json` de ce projet (qui n'a que positions/sprites, sans lien
vers l'identité du dresseur), la décompilation donne le lien exact : chaque objet de combat porte
un `scriptId` du type `std_trainer(TRAINER_XXX)`, et `files/poketool/trainer/trainers.json`
(738 entrées, indexé par l'ID numérique de `include/constants/trainers.h`) donne la classe, le
nom et l'équipe Pokémon de chaque `TRAINER_XXX`.

Script : `scripts/build/build-rom-trainer-roster.py` → `content/rom-trainer-roster.json` (39
zones, 200 dresseurs de combat extraits) + comparaison automatique avec `npc-inventory.md`.

## Résultat

**Avant** : 9 zones flaggées par le scan textuel initial (marqueurs d'incomplétude), dont
une seule (union-cave) resolue par recherche web — et cette résolution web s'est révélée
**incomplète** une fois croisée avec la ROM (8 dresseurs trouvés au lieu des 12 réels).

**Après extraction ROM** : tous les écarts réels sont résolus. Détail des corrections :

### Dresseurs manquants ajoutés (comptes précédemment vagues ou sous-évalués)
- **union-cave** : 12 dresseurs réels (pas 8) — Firebreather Bill/Ray et Hiker Phillip/Leonard
  ajoutés, répartition précise par étage (1F/B1F/B2F).
- **route-21-kanto** : 12 dresseurs nommés (remplace le placeholder « 5 nommés » sans aucun nom).
- **route-47-48-cliff-cave** : 4 dresseurs (remplace « aucun dresseur recensé »).
- **route-14-15-kanto** : 4 dresseurs supplémentaires confirmés côté Route 14 (Trevor, Carter,
  Connor, Travis), classe School Kid confirmée pour Torin.
- **route-19-20-seafoam** : 4 nageurs confirmés (Route 19) sur les 7 annoncés par le guide —
  écart de comptage non résolu, documenté honnêtement plutôt que comblé par extrapolation.
- **route-9-10-rocktunnel**, **lake-of-rage**, **mt-mortar**, **route-39**, **route-43**,
  **route-6-kanto** : dresseurs individuels ajoutés/corrigés (voir mauvais placements et
  coquilles ci-dessous).

### Mauvais placements corrigés (inversions entre zones voisines)
Le dépouillement guidebook d'origine avait mal réparti plusieurs dresseurs entre zones limitrophes :
- **Route 30 ↔ Route 31** : Bug Catcher Don + Youngster Mikey appartiennent à Route 30 (pas 31) ;
  Bug Catcher Wade appartient à Route 31 (pas 30) — inversion totale, corrigée.
- **Route 32 → Route 33** : Hiker Anthony déplacé — l'ancien bloc « Routes 32/33 combinées »
  attribuait tout à Route 32 faute de savoir distinguer, Route 33 avait « aucun PNJ ».
- **Route 40 ↔ Route 41** : Swimmer Randall + Paula déplacés de 41 vers 40.
- **Route 45 → Route 46** : Hiker Bailey, Camper Ted, Picnicker Erin déplacés — l'ancien
  « 10 dresseurs au total » sur Route 45 mélangeait en fait 7 vrais Route 45 + 3 vrais Route 46 ;
  Hiker Erik reste bien sur Route 45 (confirmé, pas déplacé).
- **Route 35 → national-park** : Pokéfan Beverly, Lass Krise, School Kid Jack, Pokéfan William
  déplacés — le retrait ramène Route 35 à exactement les « neuf dresseurs » annoncés par le guide.
- **Route 7 → Route 8 (Kanto)** : Young Couple Moe & Lulu et Super Nerd Sam déplacés vers
  route-8-kanto, qui reçoit son roster complet (7 dresseurs) au lieu du placeholder « fusionné
  avec route-7 » ; route-7-kanto n'a en réalité aucun dresseur.

### Coquilles corrigées (nom proche mais faux, probable erreur OCR du guidebook Prima)
Marcus→Markus (mt-mortar), Norman→Nelson (route-39), Ben→Beckett (route-43),
Amy→Day (route-6-kanto), Sidney→Clarke (route-9-10-rocktunnel), Aaron→Alton (lake-of-rage).

## Limites de cette extraction

- **39/83 zones seulement** ont pu être rattachées automatiquement — les gyms (portés par un
  système de contenu séparé, hors périmètre de ce dénombrement) et quelques bâtiments à étages
  (Tour Radio, Tunnel de Doublonville, Phare d'Oliville) n'ont pas été rattachés à un zone_id
  par l'heuristique de correspondance de noms ; à reprendre si besoin.
- **Zones fusionnées à numérotation non contiguë** (ex. route-9-10-rocktunnel côté Route 10,
  route-14-15-kanto côté Route 15, route-19-20-seafoam côté Route 20/Seafoam proprement dit)
  n'ont pas toutes pu être extraites — seule la première moitié numérique du zone_id fusionné
  correspond au préfixe de nom détecté par l'heuristique. Les comptes du guidebook original sont
  conservés tels quels pour ces portions non couvertes.
- Cette extraction ne couvre que les **dresseurs de combat** (`std_trainer`) — pas les PNJ
  d'ambiance, panneaux ou objets, qui restent sourcés du guidebook comme avant.
