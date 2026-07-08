# Rapport de relecture — registre des zones (noms VO + musique)

Généré à partir de deux passes de recherche Bulbapedia (Johto 1-45, Kanto/postgame 46-83).
83/83 zones résolues (nom japonais + anglais officiel, piste OST HGSS). Aucun champ manquant.
Source : `content/zone-registry-names.json`.

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
