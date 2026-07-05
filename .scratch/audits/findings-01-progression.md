# Findings — Audit 01 : Économie de progression

Date : 2026-07-05. **Statut : audit terminé** — Phase 1 (comptes), Phase 2 (grill, décisions ci-dessous),
Phase 3 (corrections appliquées aux 4 docs, marquées `(corrigé 2026-07-05, audit 01)`). Docs audités :
PRD, curriculum-checkpoints, guidebook-adapted, npc-inventory, sources `grammar_JLPT_N*.json` /
`yomitan-jlpt/` / `joyo-list.json`.

## Décisions du grill (2026-07-05) et corrections appliquées

1. **Recalibrage majeur (règle A-1 + A-2, schéma validé explicitement)** : l'apprentissage se fait « en
   grande majorité sur Johto et Kanto, le reste en bonus ». Ligue plate (Antichambre 800–870, 5 salles
   870–900, calibration de langue seulement) ; **Kanto porte 900→2136** (~56 kanji/zone, leçons
   « poussées » de 8-12 kanji) ; **Mont Gris = plateau bonus à 2136** (révision, leçons poussées, textes
   N1 durs) ; Grotte Azuria plateau postgame. Gates Kanto recalibrés : Surge 1050 · Sabrina 1200 ·
   Misty 1350 · Erika 1500 · Janine 1650 · Brock 1800 · Blaine 1950 (Seafoam) · Blue 2100 (revisite
   Vertville) ; 1950→2136 porté par les revisites post-Blaine. → Table de calibration réécrite (34
   lignes), budgets npc-inventory alignés, gates PRD, notes revisitées, résumé PRD.
2. **Gates de grammaire** : « complète » / « phase 1 » remplacés par des **comptes de points rencontrés**
   (`grammar_encounters`) : Falkner 15 N5, Whitney 12 N4, Morty 25 N4, Chuck 10 N3, Jasmine 25 N3,
   Pryce 8 N2, Clair Gym 15 N2, Clair 印 25 N2 — chiffres = proposition de calibration, à ajuster.
   « Corpus Hanabira N1 complet » (Mont Gris) supprimé (intenable : 245 points N1 pour ~180 slots).
3. **Kimono Girls** : les 5 rencontres individuelles = **scènes/leçons, pas des combats** ; seuls combats
   = gauntlet collectif (5 combats, 24→48). Gate Clair « 4/5 rencontrées », achievement et lettres
   Fukuda reformulés.
4. **« 6 kanji » de Silver / pools Kimono** : motif narratif d'écriture uniquement — jamais un pool de
   combat (les combats piochent `studiedSet`), max 2 de ces kanji affichés comme inconnus par page.
   Note ajoutée au PRD + règle 11 de guidebook-adapted.
5. **Légendaires** : 45/52/60 confirmé, « combat de 10 questions » supprimé du PRD.
6. **Chuck** : gate « QG Rocket commencé » (impossible géographiquement) → « quête du Phare d'Oliville
   commencée (Jasmine rencontrée au Phare) ».
7. **Rythme** : documenté tel quel dans le PRD § Système SRS — ~19 944 cartes, ~12-18 mois,
   ~40-55 nouvelles cartes/j, ~300-380 reviews/j (≈ 1h/j) en croisière, pas de plafond (conservé).
8. **Zéro PNJ-leçon inventé** : politique adoptée. Roster = personnages sourcés uniquement
   (recatégorisation dresseur/ambiant → leçon permise) ; zones sans personnage sourcé = pas de leçons,
   croissance absorbée par les zones voisines ; volume PRD recalculé ~300-370 leçons (était ~430-500).
9. **Corrections factuelles A/E** appliquées : Red 50→100 (curriculum + npc-inventory), achievement
   7 CS-Kanji (+砕), Fukuda 33→36 lettres, en-tête curriculum 57→72 zones, ordre § Carte de Johto
   resynchronisé (Parc National, route-41 fusionnée, Grotte Sombre/R26, renvoi zones Kanto), intro
   Règle de Silver alignée, double comptage quête Charcoal annoté, mt-silver-base 70–120 chars.

Vérification post-correction : la table re-parsée couvre 0→2136 sans trou sur le chemin principal
(le segment 1950→2136 est porté par les revisites documentées, sans ligne de table propre — voulu).

**Addendum (décision utilisateur, 2026-07-05, après clôture de l'audit) — remapping grammaire Kanto :**
« tout-N1 dès la Ligue » identifié comme fossile d'avant l'adoption de Kanto (83 % de la grammaire dans
40 % du jeu ; joueur à 900 kanji censé lire du N1 qui en suppose ~2000). Nouveau mapping aligné sur les
équivalences officielles kanji↔niveau : Ligue N2/N1 (boss), Kanto 900–1500 N2, 1500–1670 N2/N1,
1670→2136 N1, Mont Gris N1 littéraire — Johto inchangé, l'axe kanji reste la colonne vertébrale.
Gates Kanto enrichis de comptes de points N2/N1 (Sabrina +10 N2 … Blue +30 N1, proposition).
Appliqué dans les 4 docs + jlpt-language-syllabus + japanese-books-mapping.

## Comptes vérifiés (exacts — aucune correction nécessaire)

| Claim des docs | Compte réel | Verdict |
|---|---|---|
| 2136 kanji Jōyō (PRD, partout) | `joyo-list.json` = 2136 | ✅ |
| 828 points Hanabira : N5×136, N4×124, N3×132, N2×191, N1×245 (curriculum L739) | exact | ✅ |
| 3 310 exemples Hanabira (PRD L773, curriculum) | 3 310 | ✅ |
| だけに absent du corpus Hanabira (curriculum L718-721) | confirmé absent | ✅ |
| 8 113 mots yomitan-jlpt, split 705/643/1695/1856/3214 (curriculum L136-144) | exact | ✅ |
| 72 zones = 49 Johto/Mont Gris + 22 Kanto + 1 postgame (PRD L839) | table = 71 chemin principal + cerulean-cave = 72 | ✅ |
| Somme des paliers → 2136 | les deltas de la table somment à 2136, **mais en sautant un trou de 80 kanji** (voir A-1) | ⚠️ |

---

## Findings

### A-1 (A+B, MAJEUR) — Trou de 80 kanji entre Kanto (1920) et Mont Gris (2000)

- Dernière zone Kanto : `route-19-20-seafoam` **1900–1920** (curriculum L116).
- Première zone Mont Gris : `mt-silver-route-28` **2000–2030** (curriculum L118).
- **Aucune zone du chemin principal ne couvre 1920–2000.** La seule zone qui touche cette plage,
  Grotte Azuria (2000–2136, L117), est "postgame optionnel" et commence de toute façon à 2000.
- Contradiction interne : la note L124 et le PRD (L858, guidebook L1232) affirment "le Kanto couvre
  1500–2000, Mont Gris compressé 2000–2136" — mais la table réelle arrête le Kanto à 1920 (gate Blue,
  PRD L527) et rien ne porte 1920→2000.

### A-2 (B+C, MAJEUR) — La Ligue : 700 kanji (800→1500) sans un seul PNJ-leçon

Le plus gros trou du compte. Deltas de la table de calibration :

| Zone | Palier | Kanji nouveaux nets | PNJ-leçon sourcés (npc-inventory) |
|---|---|---|---|
| indigo-plateau-antichambre | 800–900 | +100 | 2 PNJ ambiants + Silver (L707-716) |
| indigo-plateau-will | 900–1000 | +100 | Will seul (combat) — 0 leçon (L720-730) |
| indigo-plateau-koga | 1000–1100 | +100 | 0 leçon |
| indigo-plateau-bruno | 1100–1200 | +100 | 0 leçon |
| indigo-plateau-karen | 1200–1350 | +150 | 0 leçon |
| indigo-plateau-lance | 1350–1500 | +150 | 0 leçon |

- Le PRD est formel : "les nouveaux kanji n'entrent en jeu QUE par les leçons" (L303) et la règle de
  l'Antichambre est "pas de sortie sans défaite" (npc-inventory L711). Aucun mécanisme ne permet
  d'étudier 700 kanji entre deux salles de boss.
- Conséquence en aval : le joueur sort de Johto avec ~830-900 kanji ; le premier gate Kanto (Lt. Surge,
  **1500 kanji étudiés**, PRD L520) est inatteignable — Vermeille City elle-même (1500–1560) présuppose
  1500 à l'arrivée et ne peut pas les fournir.
- Contradiction avec la moyenne affichée : "≈ 30 kanji/zone en moyenne" (PRD L311). La distribution
  réelle : ~20/zone sur Johto (0→800, 39 zones), **~117/zone sur la Ligue (800→1500, 6 zones sans
  leçons)**, ~19/zone sur Kanto (1500→1920, 22 zones), ~36/zone sur Mont Gris (1920→2136, 6 zones
  quasi vides). La moyenne masque le mur.

### A-3 (A) — Gate de Chuck : "QG Rocket commencé" est impossible à ce stade

PRD L495 : Chuck (Irisia, 500 kanji) gate "N3 grammaire phase 1, **QG Rocket commencé**". Or le QG
Rocket est à Acajou Ville (530–560), **après** Irisia (480–520) dans l'ordre des zones (PRD L102,
curriculum L76-79) et dans le jeu d'origine (Chuck = 5ᵉ badge, QG Rocket = avant Pryce, 7ᵉ). Le gate
exige un événement d'une zone que le joueur n'a pas encore atteinte.

### A-4 (A/E) — Red : 100 questions (PRD) vs 50 questions (deux autres docs)

- PRD L240 et L541 : Red = **100 questions** (adopté 2026-07-01, courbe de difficulté).
- curriculum L515 : "pendant les **50 questions** du HP battle" ; npc-inventory L1289 : "Red | **50
  questions** (HP battle)". Résidus de l'ancienne valeur.

### A-5 (A) — Légendaires : "combat de 10 questions" vs 45/52/60

- PRD L477 (§ Légendaires — Boss de Grammaire) : "Chaque rencontre légendaire = combat de **10
  questions** tiré de son domaine grammatical."
- PRD L237 (table des longueurs, adoptée 2026-07-01) : Raikou **45**, Entei **52**, Suicune **60**.
  Deux valeurs incompatibles dans le même document.

### A-6 (E) — Achievement CS-Kanji : "les 6" alors qu'il y en a 7

PRD L691 : "CS-Kanji : les 6 obtenus (飛、水、力、切、滝、渦)" — il manque **砕** (Éclate-Roc, ajouté
2026-07-03, PRD L136) ; L140 dit bien "Les 7 CS-Kanji".

### A-7 (A mineur) — Fukuda : "33 lettres" vs 36 jalons listés

PRD L569 : "(33 lettres, épreuve finale…)". La liste L588-593 donne : 16 badges + 6 Silver + 3 Rocket
+ 5 Kimono + 3 légendaires + Antichambre + Lance + Red = **36**. (33 = le total sans les 3 derniers.)

### A-8 (E) — En-tête de curriculum-checkpoints : "57 zones" vs table de 72

curriculum L24 : "la table de calibration ci-dessous couvre désormais 57 zones (49 + 8 Kanto)" — non
mis à jour après l'ajout des 14 routes/donjons + Grotte Azuria (2026-07-02). La table en contient 72.

### A-9 (E/A) — Ordre des zones du PRD § La Carte de Johto désynchronisé

PRD L102 vs table de calibration (l'ordre de référence) :
1. PRD : "Routes 35–37 → **Parc National** → Rosalia" ; table : r35 → **national-park** → r36 → r37
   (le Parc est entre 35 et 36, comme dans le jeu réel).
2. PRD : "Route 40 → Irisia → **Routes 41–42**" ; la zone route-41 n'existe pas (fusionnée dans
   route-40, npc-inventory L469) et route-42 vient après Irisia dans la table — l'ordre PRD met 41-42
   après Irisia alors que R41 se traverse avant.
3. PRD : "Routes 45–27" — Grotte Sombre (dark-cave, 700–760) et Route 26 absentes de l'énumération.
4. Les **14 routes/donjons Kanto** (adoptés 2026-07-02) sont absents de l'ordre PRD, qui ne liste que
   les 8 villes.

### A-10 (E mineur) — Règle de Silver : ligne d'intro non alignée sur la table corrigée

curriculum L42-43 : "Ses 6 apparitions respectent les niveaux **N4, N3, N3, N2, N2, N1**" ; la table
corrigée L552-559 donne **N5/N4, N4/N3, N3/N2, N2, N2/N1, N1**. L'intro est un résumé obsolète.

### A-11 (E trivial) — Longueur de phrase mt-silver-base

curriculum L119 : 70–120 chars ; npc-inventory L1242 : 70–125 chars.

### B-1 (B, MAJEUR) — "Grammaire complète" par palier : le compte de leçons ne peut pas couvrir 828 points

- Promesses : Falkner = "**N5 grammaire complète**" (PRD L491), Morty = "N4 complète" (L494), Jasmine
  = "N3 complète" (L496), Clair 印 = "N2 complète" (L499), Mont Gris = "**Corpus Hanabira N1
  complet**" (PRD L858).
- Offre : une leçon porte **au plus un** point de grammaire, "optionnel, pas systématique" (PRD L287) ;
  volume total ~430-500 leçons (PRD L311). **Couverture maximale ≈ 500 points sur 828 (60%)**, même si
  chaque leçon en portait un.
- Cas concret : "N5 complète" avant Falkner = 136 points N5 rencontrés avant Mauville. Zones
  disponibles : new-bark → sprout-tower = 7 zones ≈ 40-49 leçons max → **~45 points couvrables sur
  136**, à moins que les rencontres via dialogues/textes (`grammar_encounters` couvre aussi les
  dialogues, PRD L213) ne portent le reste — mais rien ne planifie ni ne garantit cette couverture.
- Idem N1 : 245 points, zones N1 avec leçons ≈ 22 Kanto + 6 Mont Gris ≈ 28 zones × 6-7 ≈ ~180 slots.

### B-2 (B) — Zones où la majorité/totalité des PNJ-leçon serait à inventer

Le guidebook est censé être la source principale (PRD L299 : "guidebook-sourcés en priorité, inventés
en complément"). Zones où le rapport s'inverse (largeur de palier ÷ candidats leçon sourcés dans
npc-inventory, à ~4-5 kanji/leçon) :

| Zone | Kanji à enseigner | Candidats PNJ-leçon sourcés | Verdict |
|---|---|---|---|
| route-33 | 40 | **0** ("aucun PNJ nommé", L188) | 100% inventé |
| route-35 | 40 | 0 (dresseurs seulement, L307) | 100% inventé |
| route-38 | 45 | 0 (L416) | 100% inventé |
| route-44 | 35 | 0 (L581) | 100% inventé |
| route-45 | 60 | 0 (L649) | 100% inventé |
| ice-path | 40 | 1 (Sayo) | ~90% inventé |
| dark-cave | 60 | 1 | ~90% inventé |
| 5 salles Elite Four | 700 | 0 | voir A-2 |
| cerulean-city | 60 | ~4 ("ville confirmée pauvre en PNJ", L902) | majorité inventée |
| pewter-city | 60 | 3 (L1051-1057) | majorité inventée |
| cinnabar-island | 60 | ~3 ("volontairement clairsemé", L1188) | majorité inventée |
| mt-silver (5 zones) | 136 (+ le trou de 80) | ~2 (Idole R28, Grunt) | quasi 100% inventé |

Les villes Johto et la plupart des routes Johto/Kanto passent bien (ex. vermilion : 60 kanji / ~7
candidats ≈ inventer ~la moitié, dans la tolérance "inventés en complément").

### B-3 (B mineur) — Gate Whitney "3 quêtes NPC" : exactement 3 quêtes existent

Avant Doublonville, les side quests sourcées sont : Route 31 (courrier, L103), Mauville (Earl, L126),
Ecorcia/Forêt Secte (Charcoal Man — **une seule quête comptée dans 2 zones**, L210 + L242). Le gate
exige donc 100% des quêtes disponibles, zéro marge — et le double comptage azalea/ilex peut faire
croire à 4.

### C-1 (C) — "Grammaire phase 1" jamais définie

Gates Whitney ("N4 grammaire phase 1", PRD L493), Chuck ("N3 phase 1", L495), Clair Gym ("N2 phase 1",
L498) : aucun document ne définit ce qu'est une "phase 1" (quels points ? combien ? mesuré comment
dans `grammar_encounters` ?). Même flou pour "complète" (voir B-1 : tout le niveau Hanabira ? la
shortlist d'~5-7 structures du § Référence grammaticale ?).

### C-2 (C/D) — Mécanisme des "6 kanji" de Silver (et pools Kimono) indéfini

PRD L401-408 : chaque apparition de Silver a "Ses 6 kanji" (ex. #1 à Ville Griotte : 怒、争、力、敵、
速、逃) ; guidebook idem pour les Kimono Girls (ex. Zuki à Mauville : 意味感知思解, L238). Or :
- si ce sont des kanji de **combat** → contredit "un combat ne teste que `studiedSet`" (PRD L558,
  L752) : 怒 (N3), 敵 (N2) ne sont pas dans les ~30-60 premiers kanji JLPT à Ville Griotte ;
- si ce sont des kanji de **dialogue** → 6 kanji inconnus violent la règle "2 kanji inconnus max"
  (curriculum L31-33).
Aucun des deux mécanismes n'est écrit. (Le PRD L558 les qualifie de "choix de dialogue narratif
ponctuels" — mais 6 > 2.)

### D-1 (D) — Rythme joueur : ~16 mois et ~300 reviews/jour, jamais explicités

Calcul (vérifié par script) : 2136 kanji ×2 cartes + 7 836 mots ×2 = **19 944 cartes** à introduire.

| Scénario | Durée | Nouvelles cartes/j | Reviews FSRS/j (régime ×7-9) |
|---|---|---|---|
| 1 leçon/j (~4,5 kanji) | ~475 j (**16 mois**) | 42 | ~300-380 (≈ 1h+/j) |
| 2 leçons/j | ~240 j (8 mois) | 84 | ~600-750 (intenable) |
| 1 leçon/j (6 kanji) | ~356 j (12 mois) | 56 | ~390-500 |

- Le PRD n'énonce nulle part de durée cible ni de charge quotidienne acceptable ("au fil des mois",
  L573 ; streak 365, L690 — seul indice implicite : ≥ 1 an).
- "Pas de plafond quotidien" sur le déblocage vocabulaire (PRD L328) : un seul kanji étudié peut
  déverser des dizaines de mots ×2 cartes d'un coup dans la file — aucun lissage défini.

### D-2 (D) — Kimono Girls individuelles : combats ou scènes ?

- La table des longueurs (PRD L236) fait des **5 rencontres individuelles des combats** (Zuki 24 …
  Sayo 48) ; le gate Clair exige "4/5 Kimono Girls **battues**" (L498) ; achievements "les 5 battues".
- Mais la table narrative (PRD L443-449) décrit des scènes sans combat : Zuki s'inquiète pour l'œuf,
  Naoko est perdue (on lui montre la sortie), Sayo est poussée sur la glace ; seule Miki implique un
  combat — contre le Sbire, pas contre elle. Le jeu d'origine n'a de combats Kimono qu'au gauntlet.
- Et Zuki = 24 questions à Mauville, soit la longueur du combat de Falkner (24) dans la même ville —
  une "rencontre" optionnelle aussi dure que le premier 師範.

### Notes hors findings

- Les deux retours arrière de la table (power-plant 1635 → cerulean 1620 ; route-21 1870 → cinnabar
  1860) correspondent à des allers-retours réels du jeu — chevauchements voulus, pas des erreurs.
- Jasmine 600 > Pryce 560 : non-monotone mais documenté et justifié (revisite tardive, PRD L508).
- PRD L858, cellule Mont Gris : phrase brouillée "(arc Kanto compressé la fourchette de Mont Gris…)" —
  à reformuler au passage de la correction A-1.

## Reporté à la synthèse (hors périmètre progression)

- **Numérotation "Événement Rocket #2/#4/#7/#9"** dans guidebook-adapted (L326, L651, L862, L1274) :
  implique un système de ~9 événements Rocket optionnels que ni le PRD (3 lieux, `rocket_progress`
  1–3) ni aucun autre doc ne définit → audit 04 (PNJ/dialogues) ou synthèse.
- Le double comptage de la quête Charcoal Man (azalea + ilex) touche aussi l'inventaire des textes
  secondaires "remplaçant les side quests" → audit 05 (textes).
- La charge SRS (D-1) a des implications sur l'algorithme de file → audit 03 (SRS).

## Reporté à la synthèse (ajouts post-grill)

- **Dresseurs-combat inventés (Route 29, Route 33…)** : la politique « zéro invention » actée au grill
  porte sur les PNJ-leçon ; le sort des dresseurs-combat qu'on prévoyait d'inventer (ex. « 8-10
  dresseurs SRS » Route 29, sans dresseur dans le jeu d'origine) reste à trancher — audit 04 ou synthèse.
- **Leçons « poussées » 8-12 kanji (Kanto)** : nouveau format issu du grill — l'audit 06 (leçons) doit
  vérifier que l'écran-livre et la structure de leçon absorbent des batchs de cette taille.

## Questions D à trancher au grill *(toutes tranchées le 2026-07-05 — voir « Décisions du grill » en tête ; conservées ci-dessous pour trace)*

1. **Trou 1920–2000 (A-1)** : étendre les dernières zones Kanto jusqu'à 2000 ? démarrer Mont Gris à
   1920 (Red à 2056 ? ou compresser 216 kanji sur les 6 zones Mont Gris) ? rendre Grotte Azuria
   semi-obligatoire porteuse de 1920–2000 ?
2. **Mur de la Ligue 800→1500 (A-2)** : recalibrer (Ligue plate ~800-900, le Kanto porte 900→1920 à
   ~46 kanji/zone) ? ou insérer un segment de contenu post-Lance/pré-Kanto ? ou autre ?
3. **"Grammaire complète / phase 1" (B-1, C-1)** : que signifie chaque gate, concrètement ? (tous les
   points Hanabira du niveau ? une shortlist fermée par palier ? un compte de points rencontrés ?)
4. **Kimono Girls individuelles (D-2)** : combats (et alors réécrire les scènes) ou scènes/leçons (et
   alors corriger la table des longueurs, le gate Clair "battues" et l'achievement) ?
5. **Silver "ses 6 kanji" / pools Kimono (C-2)** : quel statut mécanique ? (pur décor de dialogue
   limité à 2 inconnus visibles ? kanji offerts en leçon avant le combat ? pool de combat dérogatoire ?)
6. **Légendaires (A-5)** : 10 questions ou 45/52/60 ?
7. **Chuck (A-3)** : remplacer "QG Rocket commencé" par quoi ? (ex. "quête du Phare commencée /
   Potion Secrète en poche", cohérent avec la géographie)
8. **Rythme (D-1)** : y a-t-il une durée cible et une charge SRS quotidienne max assumées ? faut-il
   un plafond de nouvelles cartes/jour malgré la décision "pas de plafond" ?
9. **Zones 100% inventées (B-2)** : assumer l'invention massive sur ces routes (contraire à l'esprit
   "guidebook source principale") ou réduire leur budget kanji au profit des villes voisines ?
