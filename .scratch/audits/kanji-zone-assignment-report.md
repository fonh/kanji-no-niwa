# Rapport de relecture — assignation kanji -> zone

Généré par `scripts/build/build-kanji-zone-assignment.py`. Curseur final après la dernière zone de croissance : **1950/2136**.

## Points nécessitant une décision humaine

- union-cave: borne haute déclarée (175) < curseur courant (180) — zone hors-ordre, aucun kanji assigné, à vérifier manuellement.
- route-40: borne haute déclarée (485) < curseur courant (490) — zone hors-ordre, aucun kanji assigné, à vérifier manuellement.
- fenêtre partagée 870–900 entre indigo-plateau-will, indigo-plateau-koga, indigo-plateau-bruno, indigo-plateau-karen, indigo-plateau-lance : seule la première (indigo-plateau-will, 30 kanji) reçoit la croissance par construction, les autres reçoivent 0 — à confirmer (bloc réellement plat, comme la Ligue 870–900 déjà documentée « ne porte aucune leçon obligatoire » au PRD, ou répartition à revoir).

## Avertissements de construction du graphe de composants

Aucun.

## Fenêtre déclarée vs. assignation réelle

| Zone | Plateau | Fenêtre déclarée | Largeur déclarée | Kanji assignés | Écart |
|------|---------|-------------------|-------------------|-----------------|-------|
| new-bark-town |  | 0–30 | 30 | 30 | +0 |
| route-29 |  | 10–50 | 40 | 20 | -20 ⚠️ |
| cherrygrove-city |  | 30–60 | 30 | 10 | -20 ⚠️ |
| route-30 |  | 50–80 | 30 | 20 | -10 |
| route-31 |  | 70–100 | 30 | 20 | -10 |
| violet-city |  | 80–130 | 50 | 30 | -20 ⚠️ |
| sprout-tower |  | 90–140 | 50 | 10 | -40 ⚠️ |
| route-32 |  | 110–160 | 50 | 20 | -30 ⚠️ |
| ruins-of-alph |  | 120–180 | 60 | 20 | -40 ⚠️ |
| union-cave |  | 140–175 | 35 | 0 | -35 ⚠️ |
| route-33 |  | 160–195 | 35 | 15 | -20 ⚠️ |
| azalea-town |  | 160–210 | 50 | 15 | -35 ⚠️ |
| slowpoke-well |  | 170–220 | 50 | 10 | -40 ⚠️ |
| ilex-forest |  | 200–240 | 40 | 20 | -20 ⚠️ |
| route-34 |  | 220–255 | 35 | 15 | -20 ⚠️ |
| goldenrod-city |  | 240–290 | 50 | 35 | -15 |
| route-35 |  | 270–310 | 40 | 20 | -20 ⚠️ |
| national-park |  | 290–330 | 40 | 20 | -20 ⚠️ |
| route-36 |  | 310–355 | 45 | 25 | -20 ⚠️ |
| route-37 |  | 330–370 | 40 | 15 | -25 ⚠️ |
| ecruteak-city |  | 350–410 | 60 | 40 | -20 ⚠️ |
| burned-tower |  | 370–430 | 60 | 20 | -40 ⚠️ |
| route-38 |  | 400–445 | 45 | 15 | -30 ⚠️ |
| route-39 |  | 420–460 | 40 | 15 | -25 ⚠️ |
| olivine-city |  | 440–490 | 50 | 30 | -20 ⚠️ |
| route-40 |  | 460–485 | 25 | 0 | -25 ⚠️ |
| route-41 |  | 480–510 | 30 | 20 | -10 |
| whirl-islands | oui | 560–560 | 0 | 0 | +0 |
| cianwood-city |  | 480–520 | 40 | 10 | -30 ⚠️ |
| route-47-48-cliff-cave | oui | 480–520 | 40 | 0 | -40 |
| safari-zone | oui | 480–520 | 40 | 0 | -40 |
| route-42 |  | 500–535 | 35 | 15 | -20 ⚠️ |
| mt-mortar |  | 510–545 | 35 | 10 | -25 ⚠️ |
| mahogany-town |  | 530–560 | 30 | 15 | -15 |
| route-43 |  | 535–565 | 30 | 5 | -25 ⚠️ |
| lake-of-rage |  | 540–570 | 30 | 5 | -25 ⚠️ |
| route-44 |  | 555–590 | 35 | 20 | -15 |
| ice-path |  | 570–610 | 40 | 20 | -20 ⚠️ |
| blackthorn-city |  | 600–660 | 60 | 50 | -10 |
| dragons-den |  | 640–720 | 80 | 60 | -20 |
| route-45 |  | 680–740 | 60 | 20 | -40 ⚠️ |
| dark-cave |  | 700–760 | 60 | 20 | -40 ⚠️ |
| route-46 | oui | 700–760 | 60 | 0 | -60 |
| route-26 |  | 740–800 | 60 | 40 | -20 ⚠️ |
| route-27 |  | 760–830 | 70 | 30 | -40 ⚠️ |
| indigo-plateau-antichambre |  | 800–870 | 70 | 40 | -30 ⚠️ |
| indigo-plateau-will |  | 870–900 | 30 | 30 | +0 |
| indigo-plateau-koga |  | 870–900 | 30 | 0 | -30 ⚠️ |
| indigo-plateau-bruno |  | 870–900 | 30 | 0 | -30 ⚠️ |
| indigo-plateau-karen |  | 870–900 | 30 | 0 | -30 ⚠️ |
| indigo-plateau-lance |  | 870–900 | 30 | 0 | -30 ⚠️ |
| vermilion-city |  | 900–1050 | 150 | 150 | +0 |
| route-6-kanto |  | 1050–1060 | 10 | 10 | +0 |
| saffron-city |  | 1060–1200 | 140 | 140 | +0 |
| route-9-10-rocktunnel |  | 1200–1220 | 20 | 20 | +0 |
| lavender-town |  | 1220–1240 | 20 | 20 | +0 |
| route-8-kanto | oui | 1220–1220 | 0 | 0 | +0 |
| kanto-power-plant |  | 1235–1250 | 15 | 10 | -5 |
| cerulean-city |  | 1240–1350 | 110 | 100 | -10 |
| route-5-kanto | oui | 1350–1350 | 0 | 0 | +0 |
| route-24-25-kanto |  | 1350–1370 | 20 | 20 | +0 |
| route-7-kanto |  | 1370–1380 | 10 | 10 | +0 |
| celadon-city |  | 1380–1500 | 120 | 120 | +0 |
| route-16-17-18-cycling-road |  | 1500–1520 | 20 | 20 | +0 |
| fuchsia-city |  | 1520–1650 | 130 | 130 | +0 |
| route-14-15-kanto |  | 1650–1670 | 20 | 20 | +0 |
| route-11-12-13-diglett |  | 1670–1685 | 15 | 15 | +0 |
| pewter-city |  | 1685–1800 | 115 | 115 | +0 |
| mont-lune-route-3-4 |  | 1800–1820 | 20 | 20 | +0 |
| route-2-foret-viridian |  | 1820–1835 | 15 | 15 | +0 |
| viridian-city |  | 1835–1845 | 10 | 10 | +0 |
| route-22-kanto | oui | 1835–1835 | 0 | 0 | +0 |
| route-1-kanto |  | 1845–1855 | 10 | 10 | +0 |
| pallet-town |  | 1855–1870 | 15 | 15 | +0 |
| route-21-kanto |  | 1870–1885 | 15 | 15 | +0 |
| cinnabar-island |  | 1885–1920 | 35 | 35 | +0 |
| route-19-20-seafoam |  | 1920–1950 | 30 | 30 | +0 |
| cerulean-cave | oui | 2136–2136 | 0 | 0 | +0 |
| mt-silver-route-28 | oui | 2136–2136 | 0 | 0 | +0 |
| mt-silver-base | oui | 2136–2136 | 0 | 0 | +0 |
| mt-silver-lower | oui | 2136–2136 | 0 | 0 | +0 |
| mt-silver-upper | oui | 2136–2136 | 0 | 0 | +0 |
| mt-silver-summit | oui | 2136–2136 | 0 | 0 | +0 |
