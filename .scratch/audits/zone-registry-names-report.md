# Rapport de relecture — registre des zones (noms VO + musique)

Généré à partir de deux passes de recherche Bulbapedia (Johto 1-45, Kanto/postgame 46-83).
83/83 zones résolues (nom japonais + anglais officiel, piste OST HGSS). Aucun champ manquant.
Source : `content/zone-registry-names.json`.

## Vérification croisée indépendante (2026-07-09)

Recroisement systématique des 83 entrées contre la page Bulbapedia « List of overworld music
themes » récupérée directement (pas via les agents), plus vérifications ciblées supplémentaires.
**2 erreurs confirmées et corrigées, 1 précision appliquée :**

- **mont-lune-route-3-4 — ERREUR corrigée** : la 1ʳᵉ passe avait pris « Mt. Moon » pour un titre
  de piste distinct. Double confirmation (table des thèmes + page Bulbapedia dédiée, citation
  explicite) qu'aucun thème « Mt. Moon » n'existe en HGSS — le thème Gen II d'origine (Rock
  Tunnel) a été remplacé par celui d'**Union Cave** (つながりのどうくつ). Corrigé.
- **ruins-of-alph — correction à confiance moyenne** : la table des thèmes distingue extérieur/
  chambres-puzzle (thème Union Cave) du sous-sol (thème « Ruins of Alph » propre) ; un
  walkthrough confirme que résoudre un puzzle fait tomber le joueur dans le sous-sol — les deux
  sont connectés dans une même traversée. Basculé sur **Union Cave** (majorité du contenu), noté
  réversible si le studio préfère calibrer sur le sous-sol.
- **whirl-islands — précision** : nom jp corrigé de うずまき島 (variante informelle) vers
  **うずまきれっとう** (forme officielle, « archipel »).
- **Élément nouveau sur le point ouvert Mont Gris** (voir plus bas) : les noms de cartes ROM
  bruts (`src/data/zone-registry.json`) montrent que **lower_mountainside, upper_mountainside
  ET summit portent tous le préfixe `MAP_MOUNT_SILVER_CAVE_*`** — contrairement à l'intuition
  qu'un sommet serait visuellement extérieur, la donnée ROM suggère que ces 3 subdivisions sont
  classées « cave » par le jeu lui-même. Seul `MAP_MOUNT_SILVER` (sans suffixe) est en dehors de
  ce groupe — probablement la route/l'approche (mt-silver-base ou mt-silver-route-28). Ceci ne
  tranche pas définitivement (le nommage interne ROM ne garantit pas le comportement musical
  réel) mais oriente fortement vers une hypothèse à tester avant de trancher à la passe assets.
- **Reste inchangé, confiance haute** : tous les autres regroupements de thème (Route 30↔31-33,
  Violet City↔Olivine City, Azalea Town↔Blackthorn City, Cherrygrove City↔Mahogany Town,
  Cerulean City↔Fuchsia City, Pewter City↔Viridian/Saffron/Power Plant, Ice Path↔Dark
  Cave↔Seafoam, Rock Tunnel↔Cerulean Cave↔Diglett's Cave, etc.) vérifiés mot pour mot contre la
  table Bulbapedia — 100% de correspondance, aucune autre erreur trouvée sur 83 entrées.

## Zones à arbitrage (19/83) — à confirmer, pas à corriger d'office

**Fusion (8 zones)** — le zone_id du projet regroupe plusieurs lieux réels ; le premier lieu
cité sert de représentant (nom + musique), les autres sont documentés dans `note` :
- route-47-48-cliff-cave, route-9-10-rocktunnel, route-24-25-kanto,
  route-16-17-18-cycling-road, route-14-15-kanto, route-11-12-13-diglett,
  mont-lune-route-3-4, route-2-foret-viridian, route-19-20-seafoam

**Éclatement (11 zones)** — un seul lieu réel découpé en plusieurs zones du projet ; même
nom/musique appliqué à toutes, avec le détail en `note` :
- indigo-plateau-antichambre (Victory Road — distinct des 5 salles suivantes)
- indigo-plateau-will/koga/bruno/karen/lance (5 salles → « The Pokémon League »)
- mt-silver-base/lower/upper/summit (4 subdivisions → « The Pokémon League » par défaut,
  **point ouvert** : Bulbapedia distingue Mont Gris extérieur (« The Pokémon League ») de
  l'intérieur/grotte (« Olivine Lighthouse »), mais ne dit pas laquelle des 4 subdivisions
  de ce projet est intérieure vs extérieure — nécessite soit une vérification manuelle du
  découpage réel des cartes Mont Gris, soit une décision arbitraire à date).

## Musique partagée entre zones (documentée, pas un arbitrage à proprement parler)

Comportement normal des OST Pokémon Gen II/HGSS — plusieurs villes/routes réutilisent le même
thème. Environ 25 zones dans ce cas (routes johto groupées par thème de zone-mère, villes
kanto secondaires groupées sur Pewter/Cerulean). Détail dans le champ `note` de chaque zone
concernée — rien à trancher, juste à savoir avant d'assigner les assets audio.

## Prochaine étape naturelle pour ces données

- Le mapping piste-titre → fichier audio réel (« passe assets », roadmap étape 5 point 6)
  n'est pas fait ici — hors périmètre de l'étape 2.
- Les arbitrages ci-dessus, une fois tranchés, doivent migrer dans
  `content/guidebook-adapted.md` § Musique (roadmap étape 5 point 6).
