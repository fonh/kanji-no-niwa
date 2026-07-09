# Rapport — musique exacte par zone, extraite de la ROM

Source : `src/data/map_headers.h` (`~/pokeheartgold`, décompilation) — `dayMusicId`/`nightMusicId`
par carte (identiques sur les 540 cartes, aucune variante nocturne à gérer). Remplace
l'inférence Bulbapedia de la 1ère passe (2026-07-09) par la donnée exacte.

`scripts/build/build-rom-music-mapping.py` → `content/zone-registry-names.json` : chaque zone
gagne `music_rom_seq` (constante SEQ_GS_XXX exacte) et `music_shared_with` (liste des autres
zone_id partageant réellement la même piste, `null` si thème propre).

## Couverture

**83/83 zones** (contre 74/83 à la 1ère tentative). Les 9 manquantes (indigo-plateau-*,
mt-silver-*) utilisent des noms de carte ROM sans rapport textuel avec leur zone_id
(`MAP_POKEMON_LEAGUE_WILL_ROOM`, `MAP_MOUNT_SILVER_CAVE_UPPER_MOUNTAINSIDE`...) — ajoutées à
`DIRECT_MAP_TO_ZONE` dans `build-rom-trainer-roster.py` (partagé avec l'extraction dresseurs).
Deux autres cartes significatives découvertes au passage et ajoutées : **Rock Tunnel**
(`MAP_ROCK_TUNNEL_1F/B1F`) et **Diglett's Cave** (`MAP_DIGLETT_CAVE`), absentes de l'extraction
dresseurs précédente aussi (0 dresseur trouvé dessus, cohérent avec le guidebook : « Rock Tunnel :
aucun dresseur — donjon d'exploration pure »).

## Corrections confirmées vs. la passe Bulbapedia (~40 zones)

La plupart des « thèmes partagés » identifiés par Bulbapedia se révèlent en réalité des variantes
numérotées propres à chaque zone (ex. Route 35/36/37 partagent bien un thème entre elles, mais
**pas** avec Route 34 comme annoncé — chacune a sa constante ROM distincte). Corrections notables :

- **Mont Gris** (point resté ouvert depuis la 1ère passe) : base/versants inférieurs/versants
  supérieurs partagent le thème « Olivine Lighthouse » (`SEQ_GS_TO_TOUDAI`, intérieur/grotte) ;
  **le sommet a sa propre piste unique, `SEQ_SILENCE_FIELD` (silence total)** — pas « The
  Pokémon League » comme mis par défaut faute de mieux à la 1ère passe. Cohérent avec le texte
  déjà écrit ailleurs dans le projet (« silence total confirmé » pour Red au sommet).
- **Victory Road** (`indigo-plateau-antichambre`) a bien sa propre piste (`SEQ_GS_D_CHAMPROAD`),
  distincte de « The Pokémon League » (`SEQ_GS_CHAMPROAD`) des 5 salles + Route 28.
- **Rock Tunnel** : découverte que route-9-10-rocktunnel, route-11-12-13-diglett et
  cerulean-cave partagent réellement ce thème (`SEQ_GS_D_IWAYAMA`) — confirme le regroupement
  Bulbapedia d'origine, avec les bonnes cartes ROM cette fois.
- **Fuchsia City, Olivine City, Saffron City, Viridian City, Mahogany Town, Blackthorn City** et
  une dizaine d'autres villes ont chacune leur propre piste distincte — le regroupement
  Bulbapedia (« Cerulean partage avec Fuchsia », etc.) ne se vérifie pas dans les données ROM
  exactes pour ces paires précises.
- **Route 40/41 partagent réellement le thème de la Safari Zone** (`SEQ_GS_R_6_34`), pas celui de
  « Route 34 » comme supposé — confirmé authentique (12 aires de la Safari Zone + ces 2 routes
  utilisent toutes cette même constante), pas une erreur d'extraction.

## Limite connue : les champs `note` ne sont pas rafraîchis

Ce script ne touche **que** `music_track`/`music_rom_seq`/`music_shared_with` — il ne réécrit pas
le champ `note` existant (qui mélange souvent raisonnement de nom/arbitrage et raisonnement de
musique). Plusieurs `note` datant de la passe Bulbapedia mentionnent donc encore l'ancien
regroupement (« musique partagée : thème X, source Bulbapedia ») qui ne correspond plus
exactement à `music_shared_with`. À nettoyer dans une petite passe dédiée si besoin — sans
urgence, `music_rom_seq`/`music_shared_with` font foi.
