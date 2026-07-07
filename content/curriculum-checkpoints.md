# Calibration Langue par Zone — 漢字の庭

Référence de travail pour écrire tout contenu en japonais dans le jeu :
dialogues scriptés (content/dialogues/), PNJ ambiant (content/map/npcs_*.json),
inscriptions, panneaux, quiz de lecture, et grammar_note des leçons.

**Méthode de cette mise à jour (2026-06-30, complétée 2026-07-01) :** suite au dépouillement approfondi du
guidebook Prima 2010 (voir `content/guidebook-adapted.md`, désormais enrichi en six passes : OCR
archive.org Johto, texte natif du PDF Johto, recherche web pour Mont Gris/Red, ajout de l'arc Kanto,
rosters de dresseurs Kanto, puis lecture directe du guide Kanto local pour Mont Gris/Red — voir la note
de méthode de ce fichier pour le détail), ce document a été enrichi de plusieurs façons :
1. **Ancrage PNJ nommés** — chaque zone dispose maintenant d'une liste de personnages réels du jeu
   d'origine (cf. nouvelle section "PNJ sourcés par zone") à utiliser comme porte-voix plutôt que des
   PNJ génériques anonymes, pour donner une cohérence de monde au japonais calibré.
2. **Correction de la Règle de Silver** — la table des 6 apparitions de Silver en bas de ce document
   utilisait des lieux différents de la table officielle du PRD (`PRD.md`, § "Silver — 6 Rencontres").
   Elle a été recalculée à partir des lieux confirmés par le guidebook et alignée sur la table du PRD.
   **✅ Résolu (2026-07-01)** — les tags "Silver apparition #N" de `content/guidebook-adapted.md` ont été
   renumérotés pour suivre ce même schéma ; l'incohérence résiduelle précédemment signalée ici n'existe
   plus. Un septième point de contact (Mont Lune, côté Kanto) a par ailleurs été identifié comme le lien
   manquant vers la Tag Battle de l'Antre du Dragon déjà documentée côté Johto — voir
   `content/guidebook-adapted.md` § Kanto pour le détail ; il reste hors des "6 Rencontres" officielles.
3. **Insertion de l'arc Kanto (8 villes/gyms)** — la table de calibration ci-dessous couvre désormais
   72 zones (49 Johto/Mont Gris + 22 Kanto + Grotte Azuria postgame) *(chiffre corrigé 2026-07-05,
   audit 01 — l'ancien « 57 » datait d'avant l'ajout des 14 routes/donjons Kanto du 2026-07-02)*.
   Voir la note « Recalibrage majeur » sous la table (Ligue plate, Kanto 900→2136, Mont Gris plateau).

---

## Les deux règles absolues

**Règle kanji :** un PNJ/panneau/inscription ne peut utiliser que les kanji que le joueur a déjà étudiés,
plus **2 kanji inconnus maximum par dialogue entier** — tous états (`dialogue_states`) et pages confondus,
pas par page ni par phrase *(unité précisée 2026-07-06, audit 04, finding 04-A2 : trois docs portaient
trois lectures différentes ; tranché au grill — la définition du Kanji Budget de `CONTEXT.md` fait foi,
`PRD.md` § Silver reformulé en conséquence)*. Les kanji inconnus sont présentés en contexte lisible,
lecture inline révélable (bouton Y) — ils deviennent un moment de découverte, pas un mur.

**Règle grammaire :** chaque zone appartient à un niveau JLPT. Les structures grammaticales utilisées
dans cette zone doivent venir du niveau indiqué (et des niveaux précédents). Les structures des niveaux
supérieurs sont interdites — elles rendraient le dialogue incompréhensible même si les kanji sont connus.

Ces deux règles s'appliquent à tout le japonais du jeu : PNJ, panneaux, inscriptions de grottes,
dialogues de boss, messages Pokégear, **et Textes Progressifs** *(ajouté 2026-07-07, audit 05,
finding 05-D1 — la liste omettait les textes alors que `texts-progressifs.md` s'en réclamait)*.
**Pour les Textes Progressifs uniquement, le budget kanji est proportionnel** : ~2 kanji inconnus par
tranche de 100 caractères, plafonnés à 8–10 inconnus distincts par texte entier — « 2 par dialogue
entier » est intenable sur un texte de 300–1200 caractères ; même contrat de lisibilité (~98 % de
couverture), adapté à la longueur. Détail : `content/texts-progressifs.md` § Vetting. La règle des
dialogues, elle, ne change pas.

**Exception :** Silver parle toujours légèrement au-dessus du niveau attendu — c'est voulu. Ses 6
apparitions parlent aux niveaux N5/N4, N4/N3, N3/N2, N2, N2/N1, N1 (résumé de la table « Règle de
Silver » en bas de document ; l'ancien résumé « N4, N3, N3, N2, N2, N1 » ne correspondait plus à la
table corrigée — aligné 2026-07-05, audit 01).

---

## Table de calibration par zone

| Zone | Display Name | Kanji étudiés | Niveau | Longueur phrase |
|------|-------------|--------------|--------|----------------|
| new-bark-town | Bourg Geon | 0–30 | N5 pur | 10–20 chars |
| route-29 | Route 29 | 10–50 | N5 | 15–25 chars |
| cherrygrove-city | Ville Griotte | 30–60 | N5 | 15–25 chars |
| route-30 | Route 30 | 50–80 | N5 | 15–28 chars |
| route-31 | Route 31 | 70–100 | N5/N4 | 20–30 chars |
| violet-city | Mauville | 80–130 | N5/N4 | 20–35 chars |
| sprout-tower | Tour Grospignon | 90–140 | N5/N4 | 20–35 chars |
| route-32 | Route 32 | 110–170 | N4 | 25–40 chars |
| ruins-of-alph | Ruines Arcaniques | 120–180 | N4 | 25–40 chars |
| route-33 | Route 33 | 150–190 | N4 | 25–40 chars |
| azalea-town | Ecorcia | 160–210 | N4 | 28–45 chars |
| slowpoke-well | Puits Ramoloss | 170–220 | N4 | 28–45 chars |
| ilex-forest | Forêt Secte | 200–240 | N4 | 30–45 chars |
| route-34 | Route 34 | 220–255 | N4 | 30–45 chars |
| goldenrod-city | Doublonville | 240–290 | N4 | 30–50 chars |
| route-35 | Route 35 | 270–310 | N4/N3 | 35–50 chars |
| national-park | Parc National | 290–330 | N4/N3 | 35–50 chars |
| route-36 | Route 36 | 310–355 | N3 | 38–55 chars |
| route-37 | Route 37 | 330–370 | N3 | 38–55 chars |
| ecruteak-city | Rosalia | 350–410 | N3 | 40–60 chars |
| burned-tower | Tour Embrasée | 370–430 | N3 | 40–60 chars |
| route-38 | Route 38 | 400–445 | N3 | 40–60 chars |
| route-39 | Route 39 | 420–460 | N3 | 42–60 chars |
| olivine-city | Oliville | 440–490 | N3 | 42–65 chars |
| route-40 | Route 40 | 460–505 | N3 | 42–65 chars |
| cianwood-city | Irisia | 480–520 | N3 | 45–65 chars |
| route-42 | Route 42 | 500–535 | N3/N2 | 45–65 chars |
| mt-mortar | Mont Mortier | 510–545 | N3/N2 | 45–68 chars |
| mahogany-town | Acajou Ville | 530–560 | N3/N2 | 45–70 chars |
| lake-of-rage | Lac Colère | 540–570 | N3/N2 | 48–70 chars |
| route-44 | Route 44 | 555–590 | N2 | 50–72 chars |
| ice-path | Chemin Glacé | 570–610 | N2 | 50–75 chars |
| blackthorn-city | Ebènelle | 600–660 | N2 | 52–80 chars |
| dragons-den | Antre du Dragon | 640–720 | N2/N1 | 55–90 chars |
| route-45 | Route 45 | 680–740 | N2 | 50–75 chars |
| dark-cave | Grotte Sombre | 700–760 | N2 | 50–75 chars |
| route-26 | Route 26 | 740–800 | N2 | 52–78 chars |
| route-27 | Route 27 | 760–830 | N2 | 52–78 chars |
| indigo-plateau-antichambre | Antichambre | 800–870 | N2/N1 | 58–85 chars |
| indigo-plateau-will | Salle de Will | 870–900 | N2/N1 | 60–100 chars |
| indigo-plateau-koga | Salle de Koga | 870–900 | N2/N1 | 60–100 chars |
| indigo-plateau-bruno | Salle de Bruno | 870–900 | N2/N1 | 60–100 chars |
| indigo-plateau-karen | Salle de Karen | 870–900 | N2/N1 | 65–110 chars |
| indigo-plateau-lance | Trône de Lance | 870–900 | N2/N1 | 65–110 chars |
| vermilion-city | Vermeille City | 900–1050 | N2 | 65–110 chars |
| route-6-kanto | Route 6 (Kanto) | 1050–1060 | N2 | 65–110 chars |
| saffron-city | Safranville | 1060–1200 | N2 | 65–110 chars |
| route-9-10-rocktunnel | Routes 9-10 / Rock Tunnel | 1200–1220 | N2 | 65–115 chars |
| kanto-power-plant | Centrale Électrique | 1220–1235 | N2 | 65–115 chars |
| cerulean-city | Azuria City | 1220–1350 | N2 | 65–115 chars |
| route-24-25-kanto | Routes 24-25 (Kanto) | 1350–1370 | N2 | 65–115 chars |
| route-7-kanto | Route 7 (Kanto) | 1370–1380 | N2 | 68–115 chars |
| celadon-city | Céladia | 1380–1500 | N2 | 68–115 chars |
| route-16-17-18-cycling-road | Routes 16-18 / Cycling Road | 1500–1520 | N2/N1 | 68–115 chars |
| fuchsia-city | Fuchsia City | 1520–1650 | N2/N1 | 68–115 chars |
| route-14-15-kanto | Routes 14-15 (Kanto) | 1650–1670 | N2/N1 | 68–120 chars |
| route-11-12-13-diglett | Routes 11-13 / Grotte Diglett | 1670–1685 | N1 | 68–120 chars |
| pewter-city | Argenta City | 1685–1800 | N1 | 68–120 chars |
| mont-lune-route-3-4 | Mont Lune / Routes 3-4 | 1800–1820 | N1 | 68–120 chars |
| route-2-foret-viridian | Route 2 / Forêt Viridian | 1820–1835 | N1 | 70–120 chars |
| viridian-city | Vertville (1ʳᵉ visite, Gym fermé) | 1835–1845 | N1 | 70–120 chars |
| route-1-kanto | Route 1 (Kanto) | 1845–1855 | N1 | 70–120 chars |
| pallet-town | Bourg-Origine | 1855–1870 | N1 | 70–120 chars |
| route-21-kanto | Route 21 (Kanto) | 1870–1885 | N1 | 70–120 chars |
| cinnabar-island | Île Braise | 1885–1920 | N1 | 70–120 chars |
| route-19-20-seafoam | Routes 19-20 / Seafoam Islands | 1920–1950 | N1 | 70–120 chars |
| cerulean-cave | Grotte Azuria (postgame optionnel) | 2136 (plateau postgame) | N1 | 70–130 chars |
| mt-silver-route-28 | Route 28 | 2136 (plateau) | N1 | 70–120 chars |
| mt-silver-base | Gris — Base | 2136 (plateau) | N1 | 70–120 chars |
| mt-silver-lower | Gris — Versants inférieurs | 2136 (plateau) | N1 | 70–125 chars |
| mt-silver-upper | Gris — Versants supérieurs | 2136 (plateau) | N1 | 70–130 chars |
| mt-silver-summit | Gris — Sommet | 2136 | N1 | silence ou 1 ligne |

**Note (2026-07-02, remplace la version "8 villes" du 2026-07-01) — Kanto avec routes/donjons complet :** sur demande explicite ("je veux que ce soit le vrai jeu, comme un émulateur"), le Kanto n'est plus 8 villes bout à bout — 14 routes/donjons sourcés dans `content/guidebook-adapted.md` § Kanto — Routes et donjons rejoignent la table, insérés dans l'ordre réel du jeu entre les 8 gates de badge. Chevauchements volontaires entre route et ville d'arrivée (ex. kanto-power-plant 1220–1235 chevauche cerulean-city 1220–1350, aller-retour réel du jeu) — même logique de plage souple que partout ailleurs dans cette table.

**⚠️ Recalibrage majeur (corrigé 2026-07-05, audit 01) :** l'audit de progression a montré que l'ancienne répartition ne fermait pas le compte : (a) 700 kanji (800→1500) étaient portés par les 5 salles de la Ligue — qui n'ont aucun PNJ-leçon et d'où l'on ne sort pas (« pas de sortie sans défaite ») ; (b) un trou de 80 kanji restait entre la fin du Kanto (1920) et Mont Gris (2000). Décisions (grill 2026-07-05) : **la Ligue devient plate** (Antichambre 800–870, les 5 salles 870–900 — calibration de langue N1 uniquement, aucune croissance kanji dedans) ; **le Kanto porte 900→2136** (~56 kanji/zone : leçons « poussées » de 8-12 kanji au niveau N1, personnages sourcés recatégorisés en dresseurs-leçon — aucun PNJ inventé) ; **Mont Gris devient un plateau bonus à 2136** (révision, leçons poussées, textes N1 difficiles — plus aucun nouveau kanji requis). Gates Kanto recalibrés dans `PRD.md` : Surge 1050 · Sabrina 1200 · Misty 1350 · Erika 1500 · Janine 1650 · Brock 1800 · Blaine 1950 (Seafoam) · Blue 2100 (revisite Vertville). La traversée retour post-Blaine (revisites Vertville puis Bourg-Origine 2ᵉ visite, calibrées sur l'avancement réel) porte 1950→2100→2136 : les 2136 kanji sont tous étudiés **avant** l'entrée à Mont Gris, ce qui rend atteignable le gate Red (2136) déjà fixé au PRD.

**Remapping grammaire de l'arc Kanto (décision 2026-07-05, suite audit 01) :** l'ancien étiquetage « tout-N1 dès la Ligue » était un fossile d'avant l'adoption de Kanto (2026-07-01) — 83 % de la grammaire tassée dans Johto, et un joueur à 900 kanji censé lire du N1 (qui suppose ~2000 kanji selon les équivalences officielles N5≈100/N4≈300/N3≈650/N2≈1000/N1≈2000). Nouveau mapping, aligné sur ces équivalences : **Ligue = N2/N1** (registre de boss) ; **Kanto 900–1500 = N2** (approfondissement — Johto n'introduit qu'une partie des 191 points N2) ; **1500–1670 = N2/N1** (transition, Janine) ; **1670→2136 = N1** (Brock, Blaine, Blue) ; Mont Gris = N1 littéraire. Johto inchangé. L'axe kanji reste la colonne vertébrale de la progression — seul l'étiquetage grammatical des zones change.

**⚠️ Vertville/viridian-city — zone revisitée (2026-07-02, même schéma que Doublonville/Silver #5 et Oliville/Jasmine) :** le Gym n'est pas ouvert au premier passage (le guide confirme : "le 師範 est absent, reviens après Île Braise"). La ligne ci-dessus (1835–1845) calibre uniquement l'ambiance du premier passage (vieil homme qui bloque la porte, Trainer House, rumeur au Centre Pokémon) — le combat de Gym contre Blue est gaté à 2100 kanji *(recalibré 2026-07-05, audit 01 — était 1920)*, sur la revisite après Île Braise. Voir "Note zones revisitées" plus bas pour le principe général.

**Bourg-Origine/pallet-town — également multi-visite :** trois passages confirmés (juste après Vertville, sans rien à faire ; après avoir battu Blue à 1920, pour la permission Mont Gris ; après Red, pour la récompense finale). La ligne ci-dessus (1855–1870) calibre seulement la 1ère visite — les deux revisites suivantes se calibrent sur l'avancement réel du joueur à ce moment (~2136 pour la permission Mont Gris — tout le Jōyō étudié — et post-Mont Gris respectivement ; recalibré 2026-07-05, audit 01), même principe que Doublonville/Oliville/Vertville ci-dessus.

---

## Cartes mots par palier JLPT (ajouté 2026-07-01)

Le SRS est unifié (une seule file, `card_type` distingue kanji/mot — voir `PRD.md` § Système SRS), donc pas de règle de couverture séparée à écrire pour le contenu. Ceci dit, il est utile d'avoir un repère du **volume total de cartes mots qui devient disponible à chaque palier**, pour calibrer les fiches Carte Mot, les exemples de phrases, et les questions Sens/Traduction en combat.

Chiffres réels tirés de `scripts/sources/yomitan-jlpt/` (8 113 mots JLPT au total, cf. `PRD.md` § Pipeline de Données — filtré à 7 836 après recoupement JMdict, écart de 277 mots sans correspondance) :

| Palier JLPT | Mots de ce palier | Mots cumulés (pool total) | Cartes mots cumulées (×2 : sens + lecture) | Repère kanji cumulé |
|---|---|---|---|---|
| N5 | 705 | 705 | 1 410 | 0–130 (Bourg Geon → Mauville) |
| N4 | 643 | 1 348 | 2 696 | 130–290 (Route 32 → Doublonville) |
| N3 | 1 695 | 3 043 | 6 086 | 290–520 (Route 35 → Rosalia/Irisia) |
| N2 | 1 856 | 4 899 | 9 798 | 520–900 (Mont Mortier → Clair) |
| N1 | 3 214 | 8 113 (~7 836 filtré) | ~15 672 | 900–2136 (arc Kanto — Ligue plate, Mont Gris plateau ; corrigé 2026-07-05, audit 01) |

**Important :** ce tableau donne un **plafond de pool disponible par palier**, pas un nombre de mots que le joueur "doit" avoir atteint à une zone précise — le déblocage réel dépend du rythme d'**étude** des kanji : un mot rejoint la file dès que ses kanji sont étudiés (leçon complétée, cartes en file), qui varie selon le rythme du joueur, pas selon la zone *(corrigé 2026-07-06, audit 03, finding 03-A1 — l'ancienne formulation « maîtrise FSRS (30 jours de stabilité) » datait d'avant le seuil assoupli du 2026-07-01, voir `PRD.md` § Système SRS)*. Le palier N1 couvre une plage kanji très large (900–2136, plus de la moitié du budget total) car c'est le plus gros pool JLPT (3 214 mots) et la plus longue portion du jeu (Elite Four, Kanto, Mont Gris) — pas de sous-répartition plus fine proposée ici, la précision n'apporterait rien d'actionnable vu la variabilité individuelle de maîtrise.

---

## PNJ sourcés par zone — ancrage pour l'écriture

Le dépouillement complet du guidebook (`content/guidebook-adapted.md`, section "Inventaire PNJ
exhaustif" de chaque zone) donne des noms réels du jeu d'origine pour quasiment toutes les zones.
**Utiliser ces noms comme porte-voix de préférence à un PNJ générique anonyme** : le niveau de langue
reste toujours celui de la zone (table ci-dessus), pas celui du personnage dans le jeu d'origine — un
PNJ nommé parle au niveau calibré de SA zone, point.

| Zone | Niveau | PNJ nommés disponibles (source guidebook) |
|---|---|---|
| new-bark-town | N5 pur | Mom, Pr. Elm, Lyra/Ethan, Policier |
| route-29 | N5 | Frère/sœur du jour Tuscany (mardi) |
| cherrygrove-city | N5 | Guide Gent (vieux monsieur) |
| route-30 | N5 | Homme de l'Apricorn Box, Mr. Pokémon, Pr. Oak |
| route-31 | N5/N4 | Lyra/Ethan, jeune homme de l'Apricorn noir |
| violet-city | N5/N4 | Earl (École Pokémon), garçon des Éclats, Teala, Kimono Girl Zuki |
| sprout-tower | N5/N4 | Sage Neal/Troy/Jin/Nico/Edmond/Chow, Ancien Li |
| route-32 | N4 | Pêcheur Henry/Justin/Ralph, Frère/sœur du jour Frieda (vendredi) |
| ruins-of-alph | N4 | Jeune homme du Rapport Unown, Chercheurs du Centre de Recherche |
| route-33 | N4 | *(aucun PNJ nommé confirmé — route de transit pure)* |
| azalea-town | N4 | Kurt, Maître du Charbon, Sbire Rocket |
| slowpoke-well | N4 | Kurt, Executive Proton |
| ilex-forest | N4 | Apprenti du Maître du Charbon, Kimono Girl Naoko |
| route-34 | N4 | Policier Keith (nocturne), couple de la pension (grands-parents) |
| goldenrod-city | N4 | Bill, Buena, Name Rater, Mr. Game, Whitney, fleuriste |
| route-35 | N4/N3 | Magnus (Pokéathlon), vieil homme du dôme |
| national-park | N4/N3 | Enseignant du banc sud |
| route-36 | N3 | Jeune homme de l'Éclate-Roc (砕 — « Marteau-Piqueur » corrigé 2026-07-06, audit 04, finding 04-A3), Frère/sœur du jour Arthur (jeudi) |
| route-37 | N3 | Frère/sœur du jour Sunny (dimanche) |
| ecruteak-city | N3 | Bill, Kimono Girl Miki, vieil homme conteur (légende Ho-Oh), Sages du Poste-frontière |
| burned-tower | N3 | Morty, Eusine |
| route-38 | N3 | *(PNJ ambiant déjà prévu au PRD, pas de nom sourcé)* |
| route-39 | N3 | Baoba, fermiers de la ferme Moomoo |
| olivine-city | N3 | Jasmine (au Phare), pêcheur du Good Rod |
| route-40 | N3 | Frère/sœur du jour Monica (lundi) |
| cianwood-city | N3 | Eusine, jeune homme au compagnon confié (Shuckle), femme de Chuck |
| route-42 | N3/N2 | Hiker anonyme (CS Force), Eusine |
| mt-mortar | N3/N2 | Black Belt Kiyo ("Karate King") |
| mahogany-town | N3/N2 | Vendeur RageCandyBar, vendeur du magasin de souvenirs |
| lake-of-rage | N3/N2 | Lance, Fishing Guru, Frère/sœur du jour Wesley (mercredi) |
| route-44 | N2 | *(dresseurs nommés uniquement, pas de PNJ-leçon)* |
| ice-path | N2 | Kimono Girl Sayo |
| blackthorn-city | N2 | Grand-mère Wilma, Maniaque des capacités, Effaceur de capacités, Tuteur Ultime |
| dragons-den | N2/N1 | Le Maître (Ancien), Clair |
| route-45 | N2 | *(dresseurs nommés uniquement)* |
| dark-cave | N2 | Homme du fond (BlackGlasses, côté Ebènelle) |
| route-26 | N2 | Fille de la maison de soin, carnet des Frères/sœurs du jour |
| route-27 | N2 | Vieille dame des Chutes de Tohjo |
| indigo-plateau-antichambre | N2/N1 | Rival (Silver) — voir Règle de Silver corrigée plus bas |
| indigo-plateau-will | N2/N1 | Will *(aucune personnalité officielle — liberté totale, voir note ci-dessous)* |
| indigo-plateau-koga | N2/N1 | Koga *(idem)* |
| indigo-plateau-bruno | N2/N1 | Bruno *(idem)* |
| indigo-plateau-karen | N2/N1 | Karen *(idem)* |
| indigo-plateau-lance | N2/N1 | Lance *(idem)* |
| vermilion-city | N2 | Lt. Surge *(bio officielle absente du guide Kanto à ce stade — passe 1 seulement, voir note Kanto)* |
| saffron-city | N2 | Sabrina *(idem)* |
| cerulean-city | N2 | Misty *(idem)* |
| celadon-city | N2 | Erika *(idem)* |
| fuchsia-city | N2/N1 | Janine *(idem)* |
| pewter-city | N1 | Brock *(idem)* |
| cinnabar-island | N1 | Blaine *(idem)* |
| viridian-city | N1 | Blue *(rival historique de Red — dernier gym avant Mont Gris, idem sur l'absence de bio officielle à ce stade)* |
| mt-silver-route-28 | N1 | L'Idole retraitée *(source web, passe 3)* |
| mt-silver-base | N1 | *(Centre Pokémon, pas de PNJ-leçon)* |
| mt-silver-lower | N1 | — |
| mt-silver-upper | N1 | — |
| mt-silver-summit | N1 | Red *(silence total confirmé — voir note plus bas)* |

**Personnages sans personnalité officielle — liberté totale confirmée :** le dépouillement du guidebook
(passe 2) a confirmé que les 8 Champions d'arène, les 4 membres du Conseil 4, Lance, et les 4 Exécutifs
Rocket **n'ont aucune ligne de dialogue officielle** dans le guide — seulement une étiquette
type-spécialiste et des conseils de combat. Conséquence directe pour l'écriture : leur voix en japonais
dans 漢字の庭 (y compris le niveau de langue choisi pour Will/Koga/Bruno/Karen/Lance au tableau N1
ci-dessous) est **entièrement une création du studio**, sans aucune source à respecter ou à contredire.
C'est une liberté, pas une lacune.

---

## Référence grammaticale par niveau

> **Référentiel amont (ajouté 2026-07-05)** : `content/jlpt-language-syllabus.md` — ce que l'apprenant
> doit savoir faire à chaque niveau JLPT (can-dos fonctionnels : dire l'heure, indiquer un chemin,
> keigo…, conjugaison, particules, familles de structures, comptes kanji/vocab), synthèse triangulée
> des sources officielles et du consensus éditorial, croisée avec le corpus Hanabira. Les sections
> ci-dessous restent le calibrage *par zone* ; le syllabus dit *quoi couvrir* à chaque niveau.

### N5 — Bourg Geon → Ville Griotte (0–60 kanji étudiés)

**Principe :** phrases courtes, politesse standard en ます/です. Une idée par phrase.
Furigana systématique sur tous les kanji.

**Structures autorisées :**
```
～があります / います
～をください / ～てください
～に行きます / 来ます
～たいです
～てから、～
～ですか？ / ～ません
～はどこですか
Noun + から + Noun + まで
```

**Structures Hanabira à citer dans grammar_note :**
`Verb に 行きます`, `～あります`, `Verb て います`, `Verb たいです`, `Verb て ください`

**PNJ exemple (Route 29) :**
```
「あの木（き）に ひらがなが 書（か）いてあります。読（よ）んでください。」
→ Récompense : décoration (cosmétique, catalogue des textes secondaires) *(« Hint token » purgé 2026-07-06, repasse progression P-9 — concept jamais défini nulle part)*
```

**PNJ exemple (Cherrygrove) :**
```
「この町（まち）には ポケモンセンターが あります。疲（つか）れたら 入（はい）ってください。」
```

**Longueur max :** 2 phrases, ~25 caractères chacune. Pas de subordonnées.

---

### N5/N4 — Routes 30-31, Mauville, Tour Grospignon (60–140 kanji étudiés)

**Principe :** début des demandes plus complexes. Première apparition de ～のに, ～ために,
～てもいいですか. Les PNJ commencent à avoir une opinion, pas seulement une information.

**Structures autorisées (N5 + ajouts N4 progressifs) :**
```
～てもいいですか
～ために / のために
～かもしれない
～なければならない / ないといけない
～みたいだ / ようだ
～ておく
～ている（état résultant）
～てしまった
```

**Structures Hanabira à citer dans grammar_note :**
`Verb ために`, `～かもしれない`, `Verb てもいいですか`, `Verb てしまう`, `～ようだ`

**PNJ exemple (Mauville) :**
```
「山（やま）の上（うえ）に 赤（あか）い石（いし）があります。
 とってきてもいいですか？ お礼（れい）をします。」
```

**PNJ exemple (Tour Grospignon) :**
```
「この塔（とう）には 古（ふる）い 教（おし）えが あります。
 漢字（かんじ）を 勉強（べんきょう）するために、来（き）たのですか？」
```

---

### N4 — Route 32 → Doublonville (140–290 kanji étudiés)

**Principe :** les PNJ parlent de leurs habitudes, font des demandes indirectes, expriment
des regrets. Apparition de ～てもらえますか (demande polie), ～ながら (simultanéité),
～ことにしている (habitude délibérée).

**Structures autorisées (N5+N4 complet) :**
```
～てもらえますか / てもらえませんか
～ながら
～ことにしている
～ことになっている
～ようになる / ようになった
～ないほうがいい
～んだけど（oral informel, PNJ jeunes）
～のに（contraste, frustration）
～ても / でも
～から（cause, plus libre qu'en N5）
```

**Structures Hanabira à citer dans grammar_note :**
`Verb てもらえませんか`, `Verb ながら`, `～ことにしている`, `～ようになる`, `～のに`

**PNJ exemple (Ecorcia — quest Kurt) :**
```
「Kurtさんの家（いえ）に 行ったことがありますか？
 この手紙（てがみ）を 渡（わた）してもらえますか？」
```

**PNJ exemple (Doublonville — Pokégear) :**
```
「毎日（まいにち）漢字（かんじ）を 練習（れんしゅう）することにしています。
 なかなか 覚（おぼ）えられないのに、やめられないですね。」
```

**Note (révisée 2026-07-01) :** les furigana ne sont plus jamais affichés automatiquement, à aucun palier — ils sont masqués par défaut partout dans le jeu et révélés à la demande via le bouton Y (voir `PRD.md` § Mouvement de l'avatar). Le texte ci-dessous doit donc être écrit pour rester lisible sans aide : les kanji encore inconnus du joueur (au-delà des 2 max autorisés par la Règle kanji) doivent être évités, pas simplement "couverts" par du furigana automatique.

---

### N4/N3 — Route 35, Parc National (290–330 kanji étudiés) *(titre corrigé 2026-07-02 : Routes 36/37 sont taguées N3 pur dans la table de calibration, pas N4/N3 — elles relèvent de la section "N3" suivante, pas de celle-ci)*

**Principe :** transition. Les structures N3 les plus simples apparaissent en fin de zone :
～おかげで, ～うちに. Les PNJ commencent à raconter des histoires courtes, pas seulement
donner des informations.

**Structures N3 progressivement introduites :**
```
～おかげで（gratitude causale）
～うちに（pendant que / avant que）
～ことはない（pas besoin de）
～らしい（ouï-dire）
～せてください（demande permission de faire soi-même）
```

**PNJ exemple (Parc National) :**
```
「若（わか）いうちに、たくさん 歩（ある）いておくといいですよ。
 体（からだ）が 丈夫（じょうぶ）なおかげで、遠（とお）くまで 行（い）けます。」
```

---

### N3 — Rosalia → Irisia (370–520 kanji étudiés)

**Principe :** les PNJ ont une vie intérieure. Ils expriment des attentes, des regrets,
des habitudes établies. Les inscriptions de bâtiments utilisent du japonais formel court.
Apparition des constructions conditionnelles complexes.

**Structures autorisées (N5+N4+N3 complet) :**
```
～てほしいのですが（demande avec nuance）
～ことになっている（règle établie）
～しかない（une seule option）
～くらい～はない（comparatif superlatif）
～ことはない（inutile de）
～ないで（sans faire）
～から～にかけて（étendue temporelle/spatiale）
～そのために / ～かけ（en train de, action interrompue）
```

**Structures Hanabira à citer dans grammar_note :**
`～てほしいのですが`, `～ことになっている`, `～うちに`, `～おかげで`, `～しかない`

**PNJ exemple (Rosalia — Tour Jo) :**
```
「古（ふる）いお寺（てら）で、この漢字（かんじ）の意味（いみ）を
 調（しら）べてきてほしいのですが。時間（じかん）があるうちに どうぞ。」
```

**PNJ exemple (Oliville — Jasmine allusion) :**
```
「鉄（てつ）のように 固（かた）い意志（いし）がなければ、頂上（ちょうじょう）には
 たどり着（つ）けないことになっています。あの方（かた）はそれを 知（し）っています。」
```

---

### N3/N2 — Mont Mortier, Acajou, Lac Colère (520–590 kanji étudiés)

**Principe :** les PNJ deviennent plus abstraits. Ils parlent de temps, de résignation,
de nécessité inévitable. Première apparition de ～はずだ, ～にすぎない, ～もの.

**Structures N2 progressivement introduites :**
```
～はずだ（devoir logiquement être le cas）
～にすぎない（ce n'est que）
～ものだ（c'est ainsi, nature des choses）
～わけだ（c'est donc que）
～にしたがって（à mesure que）
```

**PNJ exemple (Lac Colère) :**
```
「氷（こおり）の道（みち）を 越（こ）えた先（さき）に、
 昔（むかし）の文書（もんじょ）が 隠（かく）されているはずです。
 ここは 静（しず）かなだけで、危険（きけん）なところにすぎません。」
```

---

### N2 — Chemin Glacé → Routes 26-27 (Johto, intro), puis Vermeille → Céladia (Kanto 900–1500, approfondissement) *(étendu 2026-07-05, remapping Kanto)*

**Principe :** phrases longues, nuancées. Les PNJ utilisent des constructions qui expriment
la concession, la progression, la restriction. L'Antre du Dragon marque la frontière N2/N1.

**Structures autorisées (N5+N4+N3+N2 complet) :**
```
～ものの（bien que）
～ことなく（sans jamais）
～にもかかわらず（malgré）
～をはじめ（entre autres, en commençant par）
～に過ぎない（ce n'est que）
～をもとに（à partir de）
～だけでなく（non seulement）
～に従って（à mesure que, conformément à）
```

**Structures Hanabira à citer dans grammar_note :**
`～ものの`, `～にもかかわらず`, `～をはじめ`, `～ことなく`, `～に従って`

**PNJ exemple (Ebènelle) :**
```
「竜（りゅう）の巣穴（すあな）は、知識（ちしき）があるにもかかわらず
 謙虚（けんきょ）な者（もの）だけを 受（う）け入（い）れます。
 力（ちから）を 求（もと）めるだけの者（もの）は、戻（もど）ってくることなく 去（さ）ります。」
```

---

### N2/N1 — Antre du Dragon, Antichambre (640–870), Ligue (870–900), et transition Kanto 1500–1670 *(étendu 2026-07-05, remapping Kanto)*

**Principe :** zone de transition. Les inscriptions du Dragon's Den sont en japonais formel
littéraire. L'Antichambre parle de l'attente et de la clôture. Premières structures N1
dans les dialogues de boss (pas les PNJ ambiants).

**Structures N1 progressivement introduites (boss uniquement à ce stade) :**
```
～だけに（précisément parce que）
～ものだ（littéraire — c'est ainsi que les choses sont）
～にほかならない（n'est rien d'autre que）
～わけにはいかない（ne peut pas se permettre de）
```

**Inscription exemple (Dragon's Den — quest N1) :**
```
「竜（りゅう）の巣穴（すあな）の 奥（おく）に 碑文（ひぶん）がある。
 その一節（いっせつ）を 正確（せいかく）に 翻訳（ほんやく）できる者（もの）だけに、
 秘密（ひみつ）を 教（おし）えよう。」
```

---

### N1 — Kanto tardif (≈1670+) et Mont Gris ; à la Ligue et en 1500–1670, structures N1 réservées aux boss *(recalé 2026-07-05, remapping Kanto)*

**Principe :** les rares PNJ présents parlent comme des textes classiques. Phrases longues,
structure SOV stricte, constructions littéraires. Fukuda à ce niveau parle de manière plus
personnelle et vulnérable — pas plus complexe grammaticalement, mais plus dense émotionnellement.
Red ne parle pas.

**Structures autorisées (tout le corpus Hanabira) :**
```
～だけに（d'autant plus que）
～うが～うが（que ce soit A ou B）
～かたわら（en parallèle）
～にほかならない（n'est rien d'autre que）
～をよぎなくされる（être contraint de）
～であれ～であれ（que ce soit... ou...）
～というか～というか（pour ainsi dire）
～ものだ（littéraire, maxime）
～わけだ（logique inévitable）
```

**Structures Hanabira à citer dans grammar_note (Elite Four) :**
`～だけに`, `～にほかならない`, `～ものだ (literary)`, `～わけだ`, `～うが～うが`

**Will (Salle de Will) :**
```
「精神（せいしん）というものは、鍛（きた）えることによってのみ
 真（しん）の力（ちから）を 発揮（はっき）するにほかならない。
 漢字（かんじ）を 学（まな）ぶことも、それだけに 同（おな）じことだ。」
```

**Mt. Silver — Le Grunt Solitaire :**
```
「まだ ジョウトが 制圧（せいあつ）されていないだけに、
 ジョバンニさまを 待（ま）ち続（つづ）けるわけにはいかない…
 もう 戻（もど）れないとわかっていながら。」
```

*(Il attend Giovanni. Tu dois lui dire :「チームロケットは解散しました」.)*

**Mt. Silver — Sommet, confirmation source (passe 3, recherche web) :**
Le combat contre Red dans le jeu d'origine confirme exactement le traitement "silence ou 1 ligne" déjà
calibré pour `mt-silver-summit` ci-dessus :
- Aucune ligne de dialogue avant le combat — Red engage directement.
- Une tempête de neige/grêle se déclenche automatiquement au début du combat (élément d'ambiance,
  transposable en effet visuel/sonore continu pendant les 100 questions du HP battle — « 50 » corrigé
  2026-07-05, audit 01, aligné sur la valeur PRD adoptée le 2026-07-01).
- Après la défaite : *"Red marque une pause, silencieux et figé. Puis, en un clin d'œil, il disparaît."*
  — pas de ligne de texte, juste une didascalie. **Si un seul "mot" doit sortir de Red dans 漢字の庭,
  ce devrait être un geste (鞠躬／頷き), jamais une phrase complète** — cohérent avec "Red nod uniquement"
  déjà au PRD.
- Récompense : un ruban de légende — bon modèle pour l'achievement "Red perfect" déjà prévu au PRD.

---

## Règles d'écriture PNJ — Résumé opérationnel

Avant d'écrire une ligne de japonais pour un PNJ, vérifier :

1. **Quel niveau est cette zone ?** → Voir table ci-dessus.
2. **Quels kanji sont disponibles ?** → Kanji étudiés à ce stade + max 2 inconnus.
3. **La structure grammaticale est-elle dans le bon niveau ?** → Vérifier la liste ci-dessus. Si le doute subsiste, descendre d'un niveau.
4. **La phrase est-elle dans la longueur cible ?** → Voir colonne "Longueur phrase".
5. **Les furigana sont-ils fournis pour tous les kanji du texte ?** → Oui, systématiquement en base (le joueur les révèle ou non via le bouton Y — voir note révisée sur le furigana à la demande). Ce qui compte pour l'écriture reste la règle 2 : ne pas dépasser 2 kanji inconnus, furigana ou pas.

**Règle du PNJ secondaire :** les PNJ sans quête — PNJ ambiants et dresseurs de route sans rôle
narratif *(« type `trainer_fixed` » purgé 2026-07-06, audit 04, finding 04-E4 : vocabulaire d'un
modèle disparu, aucune autre occurrence dans le corpus)* — peuvent utiliser
un niveau inférieur à la zone — ils sont là pour l'ambiance, pas pour la difficulté.
Un Pêcheur sur la Route 32 peut parler N5 même si la zone est N4.

**Règle du panneau/inscription :** les textes non-dialogués (panneaux, inscriptions de
grottes, plaques) utilisent toujours le niveau de la zone ou le niveau inférieur.
Ils ne dépassent jamais. Les inscriptions des Ruines Arcaniques font exception : elles
sont écrites en japonais archaïque délibérément opaque, avec traduction partielle
donnée par Fukuda.

**Règle de Silver (corrigée, 2026-06-30) :** Silver parle **un niveau au-dessus de la zone** à chaque
apparition. ⚠️ **Cette table remplace une version antérieure incohérente** : l'ancienne table plaçait les
6 apparitions à Azalea/Ecruteak/Mahogany/Antichambre/Route 28/Mt. Silver, ce qui ne correspondait ni aux
lieux confirmés par le guidebook, ni à la table officielle du PRD (`PRD.md`, § "Silver — 6 Rencontres" :
Ville Griotte/Ecorcia/Tour Embrasée/QG Rocket/Tour Radio/Route Victoire). Le guidebook source confirme
que la table du PRD est la bonne — la table ci-dessous reprend ses 6 lieux et y ajoute le niveau de
langue calibré (absent du PRD, qui ne traite que la géographie) :

| # Silver | Lieu (PRD) | Zone (table de calibration) | Niveau de zone | Silver parle | Note sourcée |
|---|---|---|---|---|---|
| 1 | Ville Griotte (retour du chemin) | cherrygrove-city | N5 | N5/N4 | ✅ Confirmé : 1er combat de rival du jeu, juste après la visite à Mr. Pokémon. |
| 2 | Ecorcia, porte ouest | azalea-town | N4 | N4/N3 | ✅ Confirmé : ambuscade après l'événement Proton/Puits Ramoloss. |
| 3 | Tour Embrasée | burned-tower / ecruteak-city | N3 | N3/N2 | ✅ Confirmé : en haut de l'échelle menant au sous-sol. |
| 4 | QG Rocket B2F | mahogany-town | N3/N2 | N2 | ⚠️ Dans le jeu d'origine, **ce n'est pas un combat** — Silver est déjà vaincu par Lance, juste un cameo frustré ("pas assez d'affection pour ses compagnons"). À garder en tête si le PRD veut un vrai combat ici plutôt qu'une scène. |
| 5 | Tour Radio B2F (Doublonville) | goldenrod-city *(revisite tardive)* | N2 *(pas le N4 de 1ère visite — voir note)* | N2/N1 | ⚠️ Précision de lieu : dans le jeu d'origine, c'est au **Tunnel de Doublonville B2F** (pas la Tour Radio elle-même) que Silver démasque le déguisement et combat (Battle 4 sur 5). Niveau de langue calculé sur l'avancement réel du joueur à ce stade de l'histoire (post-Mahogany, ~560-600 kanji), pas sur le niveau N4 de la zone goldenrod-city en première visite — Doublonville est une ville revisitée plusieurs fois à des stades narratifs différents, voir note "zones revisitées" ci-dessous. |
| 6 | Route Victoire | indigo-plateau-antichambre *(= Victory Road dans ce projet)* | N2/N1 | N1 | ✅ Confirmé : dernier combat avant le Plateau, le jeu vide volontairement la route de tout autre dresseur pour ce face-à-face. |

**Apparitions bonus post-Red (hors des "6 Rencontres" officielles du PRD)** : `guidebook-adapted.md`
documente deux apparitions Silver supplémentaires à Mont Gris (Route 28, avant Red ; Versants, après
Red) — ce sont des ajouts narratifs du studio sans équivalent dans le jeu d'origine (le jeu original n'a
que 5 vrais combats + 1 cameo, soit les 6 ci-dessus). Si le PRD les conserve, elles se situent en zone
`mt-silver-route-28` et `mt-silver-upper`, toutes deux N1 — Silver y parle au plus simple (N1 sobre,
phrases courtes) puisque l'arc dramatique veut qu'il s'ouvre/s'apaise, pas qu'il complexifie son discours.

**Point de contact supplémentaire trouvé côté Kanto (2026-07-01)** : le guide Kanto documente une
embuscade de Silver près du Mont Lune (zone `pewter-city`, entre Argenta et le Mont Lune, non jouable en
tant que donjon), qui motive dans le jeu d'origine la Tag Battle déjà présente à l'Antre du Dragon
(`dragons-den`). Ce n'est **pas** une 7ᵉ "Rencontre" officielle — plutôt le chaînon manquant qui explique
pourquoi Silver se retrouve mêlé à l'Antre du Dragon. Si le studio l'adopte comme scène jouable, elle se
calibrerait au niveau `pewter-city` (N1) déjà utilisé pour tout le reste du contenu Kanto ; sinon elle
peut rester un simple fait de continuité qui enrichit l'écriture de la scène Antre du Dragon déjà prévue,
sans zone dédiée. Voir `content/guidebook-adapted.md` § Kanto pour le détail complet.

**✅ Deuxième cas confirmé (2026-07-02) — Oliville/Jasmine :** même schéma que Doublonville/Silver #5.
`guidebook-adapted.md` confirme que Jasmine n'est pas à son gym au 1ᵉʳ passage (elle veille un
compagnon malade au Phare) ; le vrai combat de Gym a lieu sur une revisite tardive, après le détour par
Irisia/Chuck (retour avec la Potion Secrète). La table de calibration principale (440–490, N3) ne
couvre que le 1ᵉʳ passage (quête du Phare, pas de combat) — **le vrai combat de Jasmine se calibre à
~600 kanji, niveau N2** (cf. gate PRD, § Dresseurs de Route), pas au N3 de la ligne olivine-city.
**Pryce et Clair, en revanche, ne sont pas des cas de revisite** : leurs gates ont été recalibrés
directement dans `PRD.md` (2026-07-02) pour tomber dans la plage de leur zone plutôt que d'inventer une
justification narrative absente du guidebook.

**Note "zones revisitées" :** Doublonville (goldenrod-city) est traversée au moins deux fois dans le
scénario à des stades très différents (1ère visite ~250 kanji pour le badge de Whitney ; retour bien
plus tard, ~560+ kanji, pour l'arc Team Rocket/Tour Radio). La table de calibration principale n'a
qu'une seule ligne par zone (le niveau de la 1ère visite) — **pour tout PNJ ou dialogue lié à un retour
tardif dans une ville déjà visitée (Doublonville pour l'arc Rocket, Mahogany pour Lance, etc.), calibrer sur
l'avancement réel du joueur à ce moment de l'histoire, pas sur la ligne de la table.** Cette nuance ne
concernait jusqu'ici que Doublonville/Silver #5, mais elle s'applique en principe à toute zone-hub revisitée
(Azalea/Kurt, Route 30/Mr. Pokémon pour l'Exp. Share, etc.). **Deux cas Kanto confirmés (2026-07-02, chiffres recalibrés 2026-07-05, audit 01)** :
Vertville/viridian-city (1ère visite ~1835-1845, Gym fermé ; combat Blue calibré N1 ~2100 sur revisite après
Île Braise) et Bourg-Origine/pallet-town (1ère visite ~1855-1870 ; 2e visite calibrée ~2136 pour la scène de
permission Mont Gris ; 3e visite calibrée post-Mont Gris pour la récompense finale) — voir le détail dans la
table de calibration ci-dessus.

---

## Format grammar_note de leçon

Chaque batch de leçon dans la table `lessons` contient un champ `grammar_note` : un seul
point de grammaire correspondant au niveau JLPT de la zone du batch, pointé vers une
entrée précise du corpus Hanabira.

**Aucun français (2026-07-01)** : le corpus Hanabira source (`grammar_JLPT_N{1-5}.json`)
contient déjà, en anglais, `short_explanation`, `long_explanation`, plusieurs `examples[]`
(chacun avec `grammar_audio`) — bien plus riche que ce que l'ancien format `grammar_note`
en tirait (un seul exemple, un champ `note_fr` inventé). Le nouveau format réutilise ces
champs directement (copie, pas traduction) ; `note_fr` est supprimé, aucun champ n'est
rédigé from scratch par l'IA — le seul travail du batch est de sélectionner l'entrée
Hanabira adaptée au niveau/zone et de copier ses champs verbatim.

**Format JSON du champ grammar_note :**
```json
{
  "hanabira_title": "Verb てもらえませんか (～te moraemasen ka)",
  "formation": "Verb-て form + もらえませんか",
  "short_explanation": "A polite way to ask someone to do something for you.",
  "long_explanation": "Verb てもらえませんか is used to make a polite, indirect request...",
  "example_variants": [
    {
      "jp": "この手紙を見てもらえませんか。",
      "en": "Could you take a look at this letter for me?",
      "grammar_audio": "/audio/japanese/grammar/n4/....mp3",
      "distractors": ["この手紙を見てくれませんか。", "この手紙を見てもらいませんか。", "この手紙を見でもらえませんか。"]
    },
    {
      "jp": "...",
      "en": "...",
      "grammar_audio": "...",
      "distractors": ["...", "...", "..."]
    }
  ],
  "jlpt_level": "N4"
}
```

- `hanabira_title` : titre exact de l'entrée dans `grammar_JLPT_N{X}.json`. Copié verbatim
  — jamais reformulé.
- `formation`, `short_explanation`, `long_explanation` : copiés verbatim depuis le JSON source.
- `example_variants` (2026-07-01, renommé depuis `examples`/`distractors` séparés) : 2–3 entrées
  du tableau `examples[]` source (pas seulement `examples[0]`), chacune avec son `grammar_audio`
  si présent en local, et **ses propres `distractors[]`** (2–3 variantes incorrectes de CET exemple
  — mauvaise particule, verbe de base substitué, registre casual/formel inversé). Générés **une
  seule fois par batch IA** au pipeline de contenu (jamais au runtime), relus une fois par l'équipe
  de contenu. En combat, le mode Grammaire pioche un `example_variant` au hasard parmi ceux
  disponibles pour le point tiré, puis ses distracteurs — objectif : éviter qu'un point de grammaire
  rencontré plusieurs fois en combat ne ressorte toujours avec la même phrase (risque de
  pattern-matching identifié en audit combat, voir `PRD.md` § Pool de grammaire).
- Aucun champ en français. Aucun champ rédigé from scratch par l'IA sans relecture humaine — sélection + copie pour les champs Hanabira, génération encadrée pour les `distractors` de chaque variante uniquement.

**Règle d'attribution :** une leçon dans la zone X reçoit un `grammar_note` tiré du
niveau de la zone X. Les batches de transition (N4/N3) alternent entre les deux niveaux
pour ne pas introduire tous les N3 d'un coup.

---

## Index Hanabira par niveau — titres exacts

Liste des entrées Hanabira à utiliser en priorité pour les `grammar_note` et les
questions de mode Grammaire/Conjugaison en combat. Titres vérifiés contre les fichiers sources.

### N5 (new-bark-town → cherrygrove-city)
| Titre Hanabira | Formation abrégée |
|---|---|
| `～あります (〜arimasu)` | Object が あります |
| `Noun に 行きます (Noun ni ikimasu)` | Noun に 行きます |
| `Verb たいです (taidesu)` | Verb-stem + たいです |
| `Verb てから～ (〜te kara)` | Verb-て + から |
| `Verb てください (〜te kudasai)` | Verb-て + ください |
| `Verb ています (〜te imasu)` | Verb-て + います |

### N4 (route-32 → goldenrod-city)
| Titre Hanabira | Formation abrégée |
|---|---|
| `Verb てもらえませんか (～te moraemasen ka)` | Verb-て + もらえませんか |
| `Verb ながら (〜nagara)` | Verb-masu stem + ながら |
| `Verb ようになる (〜you ni naru)` | Verb-dict/potential + ようになる |
| `Verb てしまう (〜te shimau)` | Verb-て + しまう |
| `～かもしれない (〜kamoshirenai)` | Verb-casual + かもしれない |
| `のために (no tame ni)` | Noun + のために |
| `～ことにしている (〜koto ni shite iru)` | Verb-casual + ことにしている |

### N3 (ecruteak-city → cianwood-city)
| Titre Hanabira | Formation abrégée |
|---|---|
| `～てほしい (〜te hoshii)` | Verb-て + ほしい |
| `～うちに (〜uchi ni)` | Verb-て + いる + うちに |
| `～おかげで (〜okagede)` | Verb-casual + おかげで |
| `～はずだ (〜hazu da)` | Verb-casual + はずだ |
| `～わけだ (〜wake da)` | Verb-casual + わけだ |
| `～らしい (〜rashii)` | Verb-casual + らしい |
| `～ことにしている (〜koto ni shite iru)` | Verb-casual + ことにしている |

### N2 (route-44 → route-27)
| Titre Hanabira | Formation abrégée |
|---|---|
| `～ものの、～ (〜mono no、～)` | Verb-casual + ものの |
| `～にもかかわらず (〜ni mo kakawarazu)` | Verb + にもかかわらず |
| `Verb ことなく (~kotonaku)` | Verb-stem + ことなく |
| `～にほかならない (〜ni hoka naranai)` | Noun/Verb + にほかならない |
| `～ものだ (〜mono da)` | Verb-dict + ものだ |
| `Noun をはじめ (Noun wo hajime)` | Noun + をはじめ |
| `～にしたがって (〜ni shitagatte)` | Noun + にしたがって |

### N1 (indigo-plateau → mt-silver)
| Titre Hanabira | Formation abrégée |
|---|---|
| `A うが B うが (A uga B uga)` | Verb-volitional + が + Verb-volitional + が |
| `A かたわら B (A katawara B)` | Verb-dict + かたわら |
| `A であれ B であれ (A deare B deare)` | Noun + であれ + Noun + であれ |
| `A というか B というか (A to iu ka B to iu ka)` | A + というか + B + というか |
| `～ながらも (〜nagara mo)` | Verb-masu stem + ながらも |

**⚠ だけに — absent du corpus Hanabira :**
La structure `～だけに` (N1/N2 — "d'autant plus que / précisément parce que") est
mentionnée dans le PRD pour les dialogues de Silver, Dragon's Den, et l'Antichambre,
mais n'existe pas comme entrée dans les 5 fichiers JSON Hanabira (828 points vérifiés).

Conséquence :
- **Dialogues scriptés** : `だけに` peut être écrit à la main dans les fichiers de
  `content/dialogues/` — pas besoin de référence Hanabira pour les textes main-written.
- **NPC dialogue** : permis pour les PNJ N2/N1 à condition d'être écrit manuellement.
- **Mode Grammaire en combat** : `だけに` **ne peut pas** être une question de ce mode —
  il n'y a pas d'entrée Hanabira à utiliser comme base. Utiliser `～にほかならない` ou
  `～ものの` à la place pour les battles N1.
- **grammar_note de leçon** : utiliser une alternative Hanabira (`～にしたがって`,
  `Verb ことなく`) pour les zones N1/N2.

---

## Sources Hanabira utilisées

Tous les `grammar_note` de leçons et les questions de mode Grammaire/Conjugaison en
combat sont tirés directement des fichiers `scripts/sources/grammar_JLPT_N{1-5}.json`
(828 points au total : N5×136, N4×124, N3×132, N2×191, N1×245 — Hanabira.org, CC license).

**Grammaire/Conjugaison — garde d'activation (révisée 2026-07-01) :** testable dès le
tout premier combat suivant la leçon, pas après un stock de points. `selectQuestionMode`
active ces deux modes dès que le point a été rencontré au moins une fois
(`encounteredGrammarCount ≥ 1` pour ce point précis) — un point vu en leçon doit pouvoir
être vérifié tout de suite en combat, pas des zones plus tard. **Ce qui change par
rapport à l'ancien seuil (≥ 10) :** les 4 options de réponse ne sont plus tirées d'un pool
de points de grammaire *différents* (qui exigeait un stock pour éviter un QCM trivial à
3 options) mais générées comme variantes **incorrectes du même point** — mauvaise
terminaison de conjugaison, particule erronée, registre casual/formel inversé, etc. Un
seul point rencontré suffit donc à construire un QCM non trivial, sans dépendre de la
diversité du pool. `getGrammarForBattle(battleJlptTier, grammarPool, encounteredGrammarIds)`
garde son fallback au tier inférieur (calibrage de niveau uniquement, plus lié à la
diversité de distracteurs).

**Double usage de la même source :**
`grammar_note` des leçons → exposition en jeu → `encounteredGrammarIds` alimenté →
mode Grammaire/Conjugaison activable au combat suivant. Même fichier JSON, même entrée :
cohérence garantie entre ce que le joueur vient d'apprendre et ce qu'on lui demande de
retrouver en combat, sans délai.

---

## Référence externe — JLPT Can-do Self-Evaluation List (Japan Foundation, 2026-07-02)

Liste officielle ("ce que les candidats reçus à chaque niveau pensent savoir faire en
japonais"), source `jlpt.jp` — PDF officiel `cdslist_e_all.pdf`, 2012, Japan Foundation
& Japan Educational Exchanges and Services. **Ce n'est pas un syllabus JLPT** (le document
le précise explicitement) — un repère de calibration complémentaire à `curriculum-checkpoints.md`,
pas une liste de contenu à couvrir mécaniquement.

**Méthode de lecture** : chaque compétence (Écoute/Parole/Lecture/Écriture) a 20 énoncés,
ordonnés du **plus difficile (proche N1) au plus facile (proche N5)** selon un gradient de
pourcentage de réussite déclaré par les candidats — pas un découpage strict "4 énoncés par
niveau", mais l'ordre 1→20 correspond globalement à difficile→facile. Les items 1–5 environ
donnent une bonne intuition du plafond N1, les items 16–20 du plancher N5.

### Écoute (Listening)

1. Comprendre les points principaux des JT sur la politique/l'économie.
2. Comprendre le contenu général de conversations sur des sujets d'actualité médiatique.
3. Comprendre le contenu général de discours en situation formelle (réception, etc.).
4. Comprendre globalement des annonces sur des événements imprévus (accidents, etc.).
5. Comprendre le contenu de demandes de renseignement sur son travail/domaine.
9. Comprendre le contenu général d'émissions TV sur des sujets quotidiens familiers (cuisine, voyage).
12. Obtenir une information nécessaire (caractéristiques d'un produit) dans une explication en magasin.
15. Comprendre des indications simples de marche à pied et de transport en commun.
16. Comprendre globalement des conversations sur des sujets quotidiens familiers (loisirs, repas, week-end).
19. Comprendre des phrases courantes utilisées en magasin, à la poste, à la gare ("Puis-je vous aider ?", "Ça fait ○○ yens.").
20. Comprendre de simples auto-présentations de professeurs/amis en classe.

### Parole (Speaking)

1. Exprimer son opinion de façon logique dans un débat sur un sujet qui nous concerne.
4. Utiliser un registre poli ou familier selon la situation et l'interlocuteur.
7. Faire un exposé sur un sujet qu'on connaît bien, si préparé à l'avance.
8. Parler avec des amis/collègues de projets de voyage ou de préparatifs de fête.
13. Prévenir par téléphone qu'on sera en retard ou absent.
16. Exprimer des sentiments (surprise, joie) et leurs raisons.
17. Décrire sa chambre.
18. Parler de ses loisirs et centres d'intérêt.
19. Communiquer simplement avec des phrases courantes de magasin/poste/gare ("Combien ça coûte ?", "Je peux avoir ○○ ?").
20. Se présenter et répondre à des questions simples sur soi.

### Lecture (Reading)

1. Comprendre les points principaux d'articles de politique/économie dans la presse.
3. Lire des romans en comprenant les sentiments des personnages et l'intrigue.
6. Comprendre le contenu de lettres/e-mails officiels en japonais poli.
8. Comprendre des articles de presse sur des sujets quotidiens familiers.
13. Comprendre des cartes postales et e-mails de connaissances/amis.
16. Lire les horaires de train et panneaux de gare pour savoir quel train prendre.
18. Comprendre des mémos simples.
19. Comprendre des instructions simples illustrées (sortir les poubelles, préparer un repas).
20. Comprendre le jour/l'heure d'un rendez-vous sur un planning de réservation.

### Écriture (Writing)

1. Exprimer ses opinions de façon logique à l'écrit.
4. Écrire un rapport sur un domaine qui nous concerne.
9. Exprimer ses opinions à l'écrit, en donnant des raisons.
12. Décrire sa vie quotidienne à l'écrit.
14. Écrire de courtes entrées de journal intime.
15. Écrire de simples mémos à des amis/collègues.
17. Écrire son planning en quelques mots sur un calendrier.
18. Écrire de courtes phrases pour une carte d'anniversaire/de remerciement.
19. Écrire une présentation de soi simple.
20. Écrire son nom, son pays, etc. sur un formulaire.

**Usage suggéré pour 漢字の庭** : recouper ces énoncés avec les paliers de zone déjà
définis (§ Table de calibration) pour vérifier qu'un joueur au niveau attendu à telle zone
serait réellement capable, dans la vraie vie, des items correspondants — un test de
cohérence externe, pas une nouvelle contrainte de contenu à cocher.
