# Inventaire PNJ par zone — 漢字の庭

Document de travail pour l'équipe contenu : consolide, zone par zone, l'inventaire PNJ déjà sourcé
dans `content/guidebook-adapted.md` avec le budget kanji/grammaire de `content/curriculum-checkpoints.md`.
Sert à assigner ensuite le type de chaque PNJ (leçon / combat / texte / ambiant) en fonction de ce que
chaque zone peut mécaniquement supporter. La colonne "Type assigné" est volontairement vide — à remplir
par l'équipe contenu.

**Format de la colonne « Type assigné » (défini 2026-07-07, audit 06, finding 06-C3 — sans format
commun, chaque rédacteur inventerait le sien) :**

- PNJ non-leçon : un mot — `combat`, `texte`, `ambiant`.
- PNJ-leçon : `leçon #<n> — 漢字: <liste> — 文法: <titre Hanabira exact | —>` où `#<n>` est le
  `sequence_index` dans la quête `lessons-<zone_id>` (ordre intra-zone strict, PRD § Leçons),
  la liste de kanji devient `lessons.kanji_ids[]` (groupés par affinité entre eux, jamais par thème
  du PNJ), et le titre Hanabira (optionnel, un seul par leçon) devient `lessons.grammar_id`.
  Exemple : `leçon #3 — 漢字: 日・月・火・水 — 文法: Verb てください (〜te kudasai)`.
- L'assignation est fixée à l'écriture, jamais dynamique (PRD § Assignation) ; la somme des kanji
  assignés dans une zone doit couvrir la plage de son budget (table de calibration).

**Comment lire ce document** : chaque zone liste son budget (repris de curriculum-checkpoints.md), puis
tous les PNJ sourcés du jeu d'origine pour cette zone (repris de guidebook-adapted.md), avec leur rôle
d'origine, ce qu'ils remettent (objet/quête), et une colonne vide pour l'assignation future.

**Note (2026-07-02)** : le Kanto couvre désormais 22 zones à part entière (8 villes/gyms + 14
routes/donjons avec leur propre `zone_id` et budget kanji), au même titre que Johto — plus d'annexe
séparée pour les routes Kanto "pas encore officielles" : tout est absorbé dans le corps principal
ci-dessous, dans l'ordre réel de traversée du jeu.

**Note (2026-07-06, audit 04 ; budgets chiffrés 2026-07-07, synthèse) — zones réintégrées, sections à sourcer** : la géographie HGSS complète
est réintégrée (tranché au grill, voir PRD § Géographie complète) : **Lavender Town** (station radio →
carte EXPN), **Routes 5/8/22**, **Union Cave**, **Routes 41/43/46**, **intérieur des Ruines d'Alph**,
**Îles Tourbillon**, **Safari Zone adaptée** (on y attrape des contenus de lecture — mangas, textes —
au lieu de Pokémon). Seul le Battle Frontier reste hors scope (+ la fonction de transfert du Pal Park, synthèse).
**Les budgets sont désormais chiffrés** — chaque zone a sa ligne dans la table de calibration
(`curriculum-checkpoints.md` § Redistribution : Union Cave 140–175, Route 41 480–510, Route 43 535–565,
Lavender 1220–1240 portent de la croissance ; Îles Tourbillon, Safari/47/48/Cliff Cave, Routes 46/5/8/22
sont des plateaux sans croissance requise). Leurs **sections d'inventaire PNJ restent à sourcer du
guidebook à la passe contenu** (même méthode que le reste du document) — c'est le seul travail restant
sur ces zones.

**Note (2026-07-05, audit 01) — recalibrage majeur + zéro invention** : budgets Ligue/Kanto/Mont Gris
recalibrés (Ligue plate 870–900, Kanto porte 900→2136 en leçons poussées de 8-12 kanji, Mont Gris
plateau bonus à 2136 — voir `content/curriculum-checkpoints.md` § Recalibrage majeur). Politique
« zéro PNJ-leçon inventé » : la colonne « Type assigné » doit couvrir chaque budget uniquement avec
les personnages sourcés listés ici (recatégorisation dresseur/ambiant → leçon permise) ; si une zone
n'y suffit pas, sa croissance kanji est absorbée par les zones voisines. **Remapping grammaire Kanto
(décision 2026-07-05)** : Ligue = N2/N1, Kanto 900–1500 = N2, 1500–1670 = N2/N1, 1670+ = N1 — voir
`curriculum-checkpoints.md` § Remapping grammaire ; les étiquettes de niveau des zones concernées
ci-dessous ont été mises à jour en conséquence.

---

## new-bark-town — Bourg Geon

**Budget** : 0–30 kanji étudiés | N5 pur | 10–20 chars
**Grammaire nouvellement disponible à ce palier** : N5 — ～があります/います, ～をください/～てください, ～に行きます/来ます, ～たいです, ～てから、～, ～ですか？/～ません, ～はどこですか, Noun+から+Noun+まで (Hanabira : Verb に行きます, ～あります, Verb ています, Verb たいです, Verb てください)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Mom | PNJ ambiant, rdc de la maison ; annonce qu'Elm demande le joueur, débloque sauvegarde/Sac/Carte | Pokégear (après la 1ère course) | |
| Lyra/Ethan (rival/mentor) | Voisin·e déjà dresseur·euse, laisse un mail motivant sur le PC du joueur | — | |
| Professeur Elm | Fait choisir un starter parmi 3, envoie en mission chez Mr. Pokémon, panique lors du cambriolage | Everstone (après éclosion de l'œuf), **grand texte d'Elm** (après 8 badges — « Master Ball » corrigé 2026-07-07, passe de vérification : reliquat de R11) | |
| Policier | Enquête sur le cambriolage du labo, interroge sur le garçon roux | — | |
| Rival (Silver) | Aperçu en train d'espionner le labo | — | |
| Assistant du Pr. Elm | Comptoir du Mart, garde l'œuf mystère jusqu'au 1er badge | — | |

**Note leçons (ajoutée 2026-07-07, passe de vérification audit 06)** : les leçons de cette zone ne
sont **pas** portées par les PNJ du tableau ci-dessus mais par **Sensei Fukuda au dōjō** — seule
exception actée à la politique « zéro PNJ-leçon inventé » (le dōjō est 100% hors guidebook, PRD
§ Leçons, bootstrap). Assignation : **~7 leçons (~30 kanji fondamentaux, ordre `getAvailableKanji`)**,
`lessons-new-bark-town` #1→#7 ; sortie de la ville possible dès ~2-3 leçons, seuil de 30 exigé à
l'entrée de Ville Griotte. Route 29 n'a aucun PNJ-leçon : sa croissance 10→50 est portée par ces
mêmes leçons du dōjō (allers-retours).

**Side quests dans cette zone** : 0 (zone d'onboarding pure, pas de quête distincte)
**Objets à aller chercher (remis par un PNJ, pas juste trouvés au sol) dans cette zone** : 2 (Pokégear via Mom, grand texte d'Elm via Elm — « Master Ball/objet narratif » corrigé 2026-07-07, passe de vérification)

---

## route-29 — Route 29

**Budget** : 10–50 kanji étudiés | N5 | 15–25 chars
**Grammaire nouvellement disponible à ce palier** : N5 (voir liste ci-dessus, palier inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Lyra/Ethan | Attend sur la route une fois l'œuf livré, apprend au joueur à attraper (tutoriel) | — | |
| Frère/sœur du jour Tuscany | PNJ calendaire, visible uniquement le mardi (et après le badge de Mauville) | TwistedSpoon | |

Aucun dresseur nommé confirmé sur cette route dans le texte d'origine (zone trop précoce, pas encore de Poké Balls). *(Note 2026-07-05, audit 01 : politique « zéro PNJ-leçon inventé » adoptée. **Soldé 2026-07-07, synthèse, au grill — fidélité stricte : les « 8-10 dresseurs » sont abandonnés, la Route 29 se traverse sans combat comme dans HGSS ; les 10 prototypes de `trainers.json` supprimés.)*

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (TwistedSpoon, Tuscany)

---

## cherrygrove-city — Ville Griotte

**Budget** : 30–60 kanji étudiés | N5 | 15–25 chars
**Grammaire nouvellement disponible à ce palier** : N5 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Guide Gent (vieux monsieur) | Accueille le joueur à l'entrée, fait visiter la ville | Running Shoes, Map Card | |
| Rival (Silver) | Nargue le joueur puis déclenche le 1er combat de rival (Silver apparition #1) | — | |
| Vendeuse du Mart | Comptoir du fond | Air Mail, Heal Ball (vente) | |
| Employé Centre Pokémon | Signature de carte dresseur au 2F | — | |

**Side quests dans cette zone** : 0 (accueil/tutoriel uniquement)
**Objets à aller chercher dans cette zone** : 2 (Running Shoes, Map Card — Guide Gent)

---

## route-30 — Route 30

**Budget** : 50–80 kanji étudiés | N5 | 15–28 chars
**Grammaire nouvellement disponible à ce palier** : N5 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Bug Catcher Wade | Dresseur de route | — | |
| Youngster Joey | Dresseur de route (personnage culte de la franchise, easter-egg possible) | — | |
| Homme dans une maison (nord) | Donne l'Apricorn Box (objet-clé, débloque la cueillette d'Apricorns) | Apricorn Box | |
| Mr. Pokémon | Confie un "œuf mystère" au joueur | Mystery Egg (+ Exp. Share bien plus tard, contre l'Écaille du Lac Colère) | |
| Professeur Oak | Présent chez Mr. Pokémon, donne le Pokédex, anime ensuite une émission radio | Pokédex | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 3 (Apricorn Box, Mystery Egg, Pokédex)

---

## route-31 — Route 31

**Budget** : 70–100 kanji étudiés | N5/N4 | 20–30 chars
**Grammaire nouvellement disponible à ce palier** : N5/N4 — ～てもいいですか, ～ために/のために, ～かもしれない, ～なければならない/ないといけない, ～みたいだ/ようだ, ～ておく, ～ている（état résultant）, ～てしまった (Hanabira : Verb ために, ～かもしれない, Verb てもいいですか, Verb てしまう, ～ようだ)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Bug Catcher Don | Dresseur de route | — | |
| Youngster Mikey | Dresseur de route | — | |
| Lyra/Ethan | Revue sur la route, donne le Vs. Recorder | Vs. Recorder | |
| Jeune homme près de l'Apricorn noir | Quête de livraison ("porte ce message à mon contact", compagnon-courrier Kenya) | TM44 Rest | |

**Side quests dans cette zone** : 1 (livraison du message pour le jeune homme de l'Apricorn noir)
**Objets à aller chercher dans cette zone** : 2 (Vs. Recorder, TM44 Rest)

---

## violet-city — Mauville

**Budget** : 80–130 kanji étudiés | N5/N4 | 20–35 chars
**Grammaire nouvellement disponible à ce palier** : N5/N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Bird Keeper Rod, Bird Keeper Abe | Gardiens avant Falkner | — | |
| Homme à lunettes noires | Bloque l'entrée du Gym tant que Tour Grospignon n'est pas visitée | — | |
| Earl | Instituteur ambulant de "l'École Pokémon", trouvé errant entre le Gym et le Mart | — | |
| Garçon blond | Près du Centre Pokémon, échange des Éclats contre des lots de Baies | Baies | |
| Garçon à lunettes | PNJ d'échange de compagnon (maison près du Centre Pokémon) | — | |
| Garçon près du Mart | Agité, rapporte avoir vu "un arbre qui bouge" (teaser Sudowoodo/Route 36) | — | |
| Teala | Sous-sol du Centre Pokémon, donne le Pal Pad après le 1er badge | Pal Pad | |
| Kimono Girl Zuki | Devant le Mart, demande au joueur de prendre soin de l'œuf mystère | — | |
| Vendeur du Mart | Comptoir du fond | Heal Ball, Net Ball, Tunnel Mail (vente) | |
| Bird Keeper Rod/Abe (Gym) | Récompense finale du Gym Falkner | Zephyr Badge + TM51 Roost | |

**Side quests dans cette zone** : 1 (ramener Earl pour "commencer les cours")
**Objets à aller chercher dans cette zone** : 2 (Pal Pad, Baies)

---

## sprout-tower — Tour Grospignon

**Budget** : 90–140 kanji étudiés | N5/N4 | 20–35 chars
**Grammaire nouvellement disponible à ce palier** : N5/N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Sage Neal, Troy, Jin, Nico, Edmond, Chow | 6 Sages répartis sur les 3 étages | — | |
| Ancien Li | Sommet (3F), bat le joueur, explique la technique | TM70 Flash | |
| Rival (Silver) | Présent au 3F, sermonné par l'Ancien Li sans écouter (scène, pas de combat) | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (TM70 Flash)

---

## route-32 — Route 32

**Budget** : 110–160 kanji étudiés *(était 110–170 — redistribution synthèse 2026-07-07, Union Cave insérée)* | N4 | 25–40 chars
**Grammaire nouvellement disponible à ce palier** : N4 — ～てもらえますか/てもらえませんか, ～ながら, ～ことにしている, ～ことになっている, ～ようになる/ようになった, ～ないほうがいい, ～んだけど, ～のに, ～ても/でも, ～から (Hanabira : Verb てもらえませんか, Verb ながら, ～ことにしている, ～ようになる, ～のに)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Youngster Albert, Picnicker Liz, Camper Roland, Youngster Gordon, Fisherman Henry/Justin/Ralph, Bird Keeper Peter, Hiker Anthony | Dresseurs de route (plus de dix sur Routes 32/33 combinées) | — | |
| Frère/sœur du jour Frieda (vendredi) | PNJ calendaire, chemin étroit derrière le Centre Pokémon | Poison Barb | |
| Homme sur le chemin | Cadeau gratuit sans condition | Graine Miracle | |
| Jeune homme près du Centre Pokémon | PNJ comique, tente de vendre une "queue de Ramoloss" | — | |
| Pêcheur (Centre Pokémon) | Donne la Vieille Canne | Vieille Canne (Old Rod) | |
| Homme au-delà d'un point 力 | Récompense une fois le CS débloqué | TM05 Roar | |
| Homme près du pêcheur | Demande si le joueur collectionne les Apricorns | 2 Lure Balls | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 5 (Poison Barb, Graine Miracle, Vieille Canne, TM05 Roar, Lure Balls)

---

## ruins-of-alph — Ruines Arcaniques

**Budget** : 120–180 kanji étudiés | N4 | 25–40 chars
**Grammaire nouvellement disponible à ce palier** : N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Jeune homme (salle souterraine) | Admiratif du 1er puzzle résolu, remet un journal qui s'auto-remplit | Rapport Unown | |
| Chercheurs (PNJ ambiants) | Centre de Recherche des Ruines, discutent des découvertes | — | |
| Psychic Nathan | Dresseur de combat, bordure Centre de Recherche/Union Cave | — | |

**Side quests dans cette zone** : 0 (puzzle environnemental, pas une quête PNJ à proprement parler)
**Objets à aller chercher dans cette zone** : 1 (Rapport Unown)

---

## route-33 — Route 33

**Budget** : 160–195 kanji étudiés *(était 150–190 — redistribution synthèse 2026-07-07)* | N4 | 25–40 chars
**Grammaire nouvellement disponible à ce palier** : N4 (inchangé)

Aucun PNJ nommé confirmé — route de transit pure (pluie permanente sur toute la route). Le guidebook rattache tous les noms du bloc combiné "Routes 32/33" à Route 32 uniquement (confirmé passe 2) ; Route 33 n'a aucun PNJ ou dresseur attribuable spécifiquement.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## azalea-town — Ecorcia

**Budget** : 160–210 kanji étudiés | N4 | 28–45 chars
**Grammaire nouvellement disponible à ce palier** : N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Kurt | Artisan Apricorn → Boule : dépose des Apricorns, reçoit un objet en 24h | Boule (selon couleur d'Apricorn apportée) | |
| Bug Catcher Al, Josh, Benny ; Twins Amy & May | Gardiens avant Bugsy | — | |
| Rival (Silver) | Défi au portail ouest, vers Forêt Secte (Silver apparition #2) | — | |
| Charcoal Man | Ses Farfetch'd-analogues se sont enfuis en Forêt Secte ; remet le Charbon une fois résolu | Charbon | |
| Sbire Rocket | Bloque l'entrée du Puits Ramoloss | — | |
| Vendeur du Mart | Comptoir du fond | Bloom Mail, Heal Ball, Net Ball (vente) | |
| Bug Catcher Al/Josh/Benny, Twins (Gym) | Récompense finale du Gym Bugsy | Hive Badge + TM89 U-turn | |

**Side quests dans cette zone** : 1 (Charcoal Man — retrouver les 2 fuyards, résolue en Forêt Secte)
**Objets à aller chercher dans cette zone** : 2 (Boules de Kurt, Charbon)

---

## slowpoke-well — Puits Ramoloss

**Budget** : 170–220 kanji étudiés | N4 | 28–45 chars
**Grammaire nouvellement disponible à ce palier** : N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Kurt | Mène le joueur, se blesse au dos au pied de l'échelle, demande de continuer sans lui | — | |
| Sbires Rocket ×3 | Combats de couloir, répartis B1F/B2F | — | |
| Executive Proton | Combat final ; confirme que la Team Rocket opère en sous-main pour Giovanni | — | |

**Side quests dans cette zone** : 0 (événement scripté bloquant l'accès au Gym Bugsy)
**Objets à aller chercher dans cette zone** : 0 (le courrier du gendre de Kurt, trouvé au fond du puits, est un texte de lecture, pas un objet remis par un PNJ)

---

## ilex-forest — Forêt Secte

**Budget** : 200–240 kanji étudiés | N4 | 30–45 chars
**Grammaire nouvellement disponible à ce palier** : N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Apprenti du Maître du Charbon | À l'entrée, enseigne la technique de capture des 2 fuyards | — | |
| Kimono Girl Naoko | Plus au nord, perdue, demande le chemin de la sortie | — | |
| Jeune homme sur une corniche | Enseigne la technique "secouer les arbres" (Headbutt) | — | |

**Side quests dans cette zone** : 1 (capturer les 2 fuyards pour le Maître du Charbon d'Ecorcia — *même quête que celle comptée à azalea-town : 1 seule quête au total, à ne pas compter deux fois pour le gate de Whitney ; précisé 2026-07-05, audit 01*)
**Objets à aller chercher dans cette zone** : 0

---

## route-34 — Route 34

**Budget** : 220–255 kanji étudiés | N4 | 30–45 chars
**Grammaire nouvellement disponible à ce palier** : N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Camper Todd, Gamin Ian, Picnicker Gina, Pokéfan Brandon, Gamin Samuel | Dresseurs de route | — | |
| Policeman Keith | Combat uniquement nocturne (20h–4h), à l'ouest de la pension | — | |
| Trio Ace Trainer Jenn/Irene/Kate | Combat groupé après une traversée d'eau | Power Herb | |
| Couple de la pension (grands-parents de Lyra/Ethan) | PNJ ambiant (Day Care supprimée dans 漢字の庭) | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (Power Herb)

---

## goldenrod-city — Doublonville

**Budget** : 240–290 kanji étudiés | N4 | 30–50 chars
**Grammaire nouvellement disponible à ce palier** : N4 (inchangé — note : les furigana ne sont plus affichés automatiquement à partir de ce palier, révélés à la demande via le bouton Y)

Ville très dense (~30 PNJ/rôles sourcés) — liste condensée aux PNJ avec un rôle ou une remise identifiable :

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Beauty Victoria, Samantha ; Lass Carrie, Cathy | Gardiennes avant Whitney | — | |
| Bill | Centre Pokémon (absent, parti à Rosalia) puis sa maison | Compagnon rare (Eevee-analogue) | |
| Mr. Game | Game Corner — mini-jeu de kanji contre jetons, tables Kanji Flip + kanji jumeaux (« feature hors-scope » corrigé 2026-07-07, passe de vérification — adapté R8/I-3) | Coin Case | |
| Gérant du magasin de vélos | Prête une Bicyclette gratuitement, puis l'offre définitivement | Bicyclette | |
| Fille évaluatrice d'affection | Maison au nord du Dept Store, évalue le lien avec le compagnon en tête | — | |
| Réceptionniste Tour Radio | Quiz de 5 questions | Radio Card | |
| Buena | Studio radio (2F), mot de passe quotidien à deviner | Blue Card | |
| Name Rater | Maison nord de la ville, renomme les surnoms | — | |
| Fleuriste (Floria) | Donne le SquirtBottle une fois le badge de Gym vu | SquirtBottle (+ Pots à Baies plus tard, Route 36) | |
| Jeune homme à la grille nord | Quête courrier (objet porté par un oiseau sauvage à capturer) | HP Up | |
| Black Belt (sous-sol Dept Store) | Bloque l'accès avec ses conteneurs | — | |
| Fille du 5F Dept Store (dimanche uniquement) | Affection élevée requise | TM27 Return | |
| Poké Maniac Donald/Issac, Super Nerd Eric/Teru | Dresseurs du Tunnel de Doublonville | — | |
| Burglar Orson, Duncan | Combats liés à l'arc Team Rocket (Tunnel) | — | |
| Sbire (déguisement) | Force le joueur à porter un déguisement Team Rocket | — | |
| "Directeur" = Exécutif Petrel déguisé (5F) | Boss d'étage, sa défaite donne la clé de sous-sol | Basement Key | |
| Vrai Directeur (otage, Tunnel B2F) | Délivré via la Basement Key | Carte-clé (Card Key) | |
| Rival (Silver) | Démasque le déguisement, combat (Silver apparition #5, en réalité Tunnel B2F, revisite tardive ~560+ kanji) | — | |
| Kimono Girl Kuni | Tunnel, après la Card Key (revisite tardive) | — | |
| Executive Proton (3F, re-apparition) | Combat, aux côtés de Petrel re-déguisé | — | |
| Executive Ariana, puis Executive Archer (sommet) | Combat final, révèle l'objectif : rappeler Giovanni | Plume Arc-en-ciel | |

**Side quests dans cette zone** : 3 (livraison courrier oiseau ; infiltration de la Radio Tower en plusieurs temps ; résolution Tunnel/Card Key)
**Objets à aller chercher dans cette zone** : 9 (Eevee-analogue, Coin Case, Bicyclette, Radio Card, Blue Card, SquirtBottle, HP Up, TM27 Return, Plume Arc-en-ciel — Carte-clé et Basement Key comptées comme objets de progression)

---

## route-35 — Route 35

**Budget** : 270–310 kanji étudiés | N4/N3 | 35–50 chars
**Grammaire nouvellement disponible à ce palier** : N4/N3 — ～おかげで（gratitude causale）, ～うちに（pendant que）, ～ことはない（pas besoin de）, ～らしい（ouï-dire）, ～せてください（demande de permission）

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Bug Catcher Arnie, Firebreather Walt, Juggler Irwin, Policeman Dirk (nuit), Picnicker Kim, Camper Ivan, Bird Keeper Bryan, Picnicker Brooke & Camper Elliot (paire), Lass Krise, Pokéfan Beverly, School Kid Jack, Pokéfan William | Dresseurs de route (le guide précise "neuf dresseurs sur Route 35") | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## national-park — Parc National

**Budget** : 290–330 kanji étudiés | N4/N3 | 35–50 chars
**Grammaire nouvellement disponible à ce palier** : N4/N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Magnus | Gérant du dôme Pokéathlon, fait visiter les lieux | — | |
| Vieil homme retraité | Record de 998 sauts, défie le joueur de dépasser 1000 | — | |
| Vendeur du stand Aprijuice | Ouest du dôme | Apriblender | |
| Whitney (réapparition) | Accueil du Pokéathlon | Maillot porté en épreuve | |
| Enseignant (banc sud du parc) | PNJ-professeur, donne un objet de "priorité au tour" | Quick Claw | |

**Side quests dans cette zone** : 1 (concours d'insectes mar/jeu/sam — prix Pierre Lune/Everstone/Baie Sitrus)
**Objets à aller chercher dans cette zone** : 3 (Apriblender, Maillot, Quick Claw)

---

## route-36 — Route 36

**Budget** : 310–355 kanji étudiés | N3 | 38–55 chars
**Grammaire nouvellement disponible à ce palier** : N3 — ～てほしいのですが, ～ことになっている（règle établie）, ～しかない, ～くらい～はない, ～ことはない, ～ないで, ～から～にかけて, ～そのために/～かけ (Hanabira : ～てほしいのですが, ～ことになっている, ～うちに, ～おかげで, ～しかない)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Jeune homme près d'un panneau (ouest) | Donne le CS Éclate-Roc (砕), débloqué dès le badge de Falkner *(corrigé 2026-07-06, audit 04, finding 04-A3 : « CS Marteau-Piqueur (力) » était un double contresens — 力 = Force, déjà remis par le Hiker de la Route 42, et « Marteau-Piqueur » n'est le nom d'aucun des 8 CS-Kanji (« 7 » corrigé 2026-07-07, synthèse — 登 réintégré depuis) ; voir PRD § CS-Kanji et guidebook-adapted L572/1177)* | CS Éclate-Roc (砕) | |
| Psychic Mark, School Kid Alan | Dresseurs (cluster frontière Violet City) | — | |
| Frère/sœur du jour Arthur (jeudi) | Nord des Ruines Arcaniques | Hard Stone | |
| Obstacle Sudowoodo | Bloque la route vers Ecruteak, résolu via l'arrosoir de Floria (Doublonville) | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 2 (CS Éclate-Roc, Hard Stone)

---

## route-37 — Route 37

**Budget** : 330–370 kanji étudiés | N3 | 38–55 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Beauty Callie, Kassandra ; Twins Tori & Til | Dresseurs de route | — | |
| Psychic Greg | Dresseur, frontière Rosalia près des Apricorns | — | |
| Frère/sœur du jour Sunny (dimanche) | Nord de 3 arbres Apricorn | Magnet | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (Magnet)

---

## ecruteak-city — Rosalia

**Budget** : 350–410 kanji étudiés | N3 | 40–60 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Medium Martha, Edith, Grace, Georgina | Gardiennes avant Morty | — | |
| Bill | Centre Pokémon, repart pour Doublonville | — | |
| Homme à l'énigme | Bonne réponse → détecteur d'objets ; la pièce contient un livre relatant la légende des 3 esprits | Dowsing MCHN | |
| Sbire Rocket | Harcèle Kimono Girl Miki au Théâtre, combat de sauvetage | — | |
| Kimono Girl Miki | 3e Kimono Girl rencontrée (sauvée du Sbire) | — | |
| Gentleman (public du Théâtre) | Témoin du sauvetage | HM03 Surf | |
| Hommes du Poste-frontière | Racontent les légendes locales de Ho-Oh, bloquent l'accès à Tour Jo | — | |
| Homme au nord du Gym | Signale que le gardien-phare d'Oliville est malade | — | |
| Vendeur du Mart | Comptoir du fond | Air Mail, Heal Ball, Net Ball (vente) | |
| Rival (Silver) | Devant Tour Jo (Silver apparition #3) | — | |
| Gauntlet des 5 Kimono Girls (post-remise du grand texte d'Elm — « post-Master Ball » adapté 2026-07-06, audit 04) | Combat récapitulatif au Théâtre, "test du lien avec ton équipe" | Clear Bell / Tidal Bell | |
| Medium Martha/Edith/Grace/Georgina (Gym) | Récompense finale du Gym Morty | Fog Badge + TM30 Shadow Ball | |

**Side quests dans cette zone** : 1 (résoudre l'énigme de l'homme à l'ouest du Centre Pokémon)
**Objets à aller chercher dans cette zone** : 3 (Dowsing MCHN, HM03 Surf, Clear Bell/Tidal Bell)

---

## burned-tower — Tour Embrasée

**Budget** : 370–430 kanji étudiés | N3 | 40–60 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Morty | Présent à l'arrivée avec Eusine, partage les découvertes sur les 3 esprits légendaires | — | |
| Eusine | Cherche spécifiquement le 3e esprit-kanji légendaire | — | |
| Firebreather Ned (1F), Richard (B1F) | Dresseurs de combat | — | |
| Rival (Silver) | Embuscade en haut de l'échelle vers B1F (Silver apparition #3, confirmé ici) | — | |

**Side quests dans cette zone** : 0 (événement narratif, quête Rocket optionnelle — Traque des Bêtes Sacrées)
**Objets à aller chercher dans cette zone** : 0

---

## route-38 — Route 38

**Budget** : 400–445 kanji étudiés | N3 | 40–60 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| School Kid Chad, Lass Dana, Beauty Valerie, Sailor Harry, Bird Keeper Toby | Dresseurs de route (répartition exacte Route 38 vs 39 incertaine dans l'OCR source) | — | |

Aucun PNJ-leçon nommé spécifique à cette route (dialogue ambiant N3 déjà prévu au PRD, pas de nom sourcé).

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## route-39 — Route 39

**Budget** : 420–460 kanji étudiés | N3 | 42–60 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Sailor Eugene, Pokéfan Derek, Pokéfan Ruth, Psychic Norman | Dresseurs de route | — | |
| Fille (gauche du Miltank-analogue, ferme Moomoo) | Donne le Seal Case une fois le compagnon guéri | Seal Case | |
| Fille (droite, ferme Moomoo) | Donne 3 décorations gratuites | Fire Seal A, Party Seal B, Flora Seal C | |
| Fermière (ferme Moomoo) | Donne TM83 Natural Gift | TM83 Natural Gift | |
| Fermier (ferme Moomoo) | Vend une spécialité locale une fois la quête résolue | — (vente) | |
| Baoba | Gardien itinérant, 1ère rencontre ; annonce l'ouverture d'une réserve à Irisia | — | |

**Side quests dans cette zone** : 1 (nourrir/soigner le Miltank-analogue avec 7 baies, sur plusieurs visites)
**Objets à aller chercher dans cette zone** : 3 (Seal Case, décorations, TM83 Natural Gift)

---

## olivine-city — Oliville

**Budget** : 440–490 kanji étudiés | N3 | 42–65 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Rival (Silver) | Sort du Gym juste avant le joueur, indique que Jasmine est au Phare | — | |
| Pêcheur (maison nord du Centre Pokémon) | Donne la Bonne Canne | Bonne Canne (Good Rod) | |
| Fille au Centre Pokémon | Demande l'avis du joueur puis défie en combat | — | |
| Fille (maison nord du Mart) | Donne 3 décorations aléatoires par jour | Décorations | |
| Sailor Ernest, Terrell, Huey, Kent ; Gentleman Alfred, Preston ; Lass Connie ; Bird Keeper Denis, Theo | Roster complet du Phare (9 dresseurs, 1F au sommet) | — | |
| Jasmine | Veille le gardien malade au Phare ; demande la Potion Secrète d'Irisia ; combat de Gym après guérison | Mineral Badge + TM23 Iron Tail (vrai combat calibré ~600 kanji/N2, voir note zones revisitées) | |
| Baoba (appel téléphonique) | Prévient que la réserve d'Irisia est terminée, une fois la potion livrée | — | |

**Side quests dans cette zone** : 1 (mini-arc du Phare — Potion Secrète en 3 temps, résolue à Irisia)
**Objets à aller chercher dans cette zone** : 3 (Bonne Canne, décorations, badge/TM de Gym)

---

## route-40 — Route 40

**Budget** : 460–485 kanji étudiés *(était 460–505 — redistribution synthèse 2026-07-07, Route 41 défusionnée porte la suite)* | N3 | 42–65 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Swimmer Simon, Elaine (R40) + Denise, Kara, Ronald, Berke, Kaylee, Paula, Matthew, Randall, Charlie, George, Wendy, Susie (R41 — défusionnée 2026-07-06, audit 04 : les nageurs R41 retourneront à leur section route-41 quand elle sera sourcée, voir note de tête) | Dresseurs maritimes | — | |
| Frère/sœur du jour Monica (lundi, plage) | PNJ calendaire | Sharp Beak | |
| Homme (Maison du Photographe, nord d'Irisia) | Révèle que le photographe itinérant récurrent est de sa famille | — | |
| Homme (ouest du Centre Pokémon d'Irisia) | Raconte la légende des 4 îles créées par le gardien légendaire des tourbillons | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (Sharp Beak)

---

## cianwood-city — Irisia

**Budget** : 480–520 kanji étudiés | N3 | 45–65 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Pharmacie | Remet la Potion Secrète au 1er passage (pour Jasmine) | Potion Secrète | |
| Jeune homme (sud du Gym) | Confie temporairement un compagnon (Shuckle-analogue) ; révèle le passage de Silver | Compagnon temporaire (Shuckle-analogue) | |
| Eusine | Défie le joueur après l'apparition fugace d'un esprit-kanji légendaire | — | |
| Homme (Centre Pokémon) | Explique l'entraînement de Chuck sous une chute d'eau | — | |
| Black Belt Nob, Yoshi, Lung, Lao | Gardiens avant Chuck | — | |
| Femme de Chuck | Remet une récompense, commente la défaite de son mari avec tendresse | HM Vol (Fly) | |

**Side quests dans cette zone** : 0 (le mini-arc Phare/Potion Secrète est comptabilisé côté olivine-city)
**Objets à aller chercher dans cette zone** : 2 (Potion Secrète, HM Vol)

---

## route-42 — Route 42

**Budget** : 500–535 kanji étudiés | N3/N2 | 45–65 chars
**Grammaire nouvellement disponible à ce palier** : N3/N2 — ～はずだ（devoir logiquement être le cas）, ～にすぎない（ce n'est que）, ～ものだ（nature des choses）, ～わけだ（c'est donc que）, ～にしたがって（à mesure que）

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Fisherman Tully, Hiker Benjamin, Poké Maniac Shane | Dresseurs de route | — | |
| Hiker anonyme | Sortant de Mont Mortier, bouscule le joueur et s'excuse | CS Force (力) | |
| Eusine | Réapparaît côté est (après Coupe), nouvel aperçu de l'esprit légendaire | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (CS Force)

---

## mt-mortar — Mont Mortier

**Budget** : 510–545 kanji étudiés | N3/N2 | 45–68 chars
**Grammaire nouvellement disponible à ce palier** : N3/N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Super Nerd Hugh (2F), Marcus (1F fond) ; Poké Maniac Harrison (1F fond) | Dresseurs internes | — | |
| Black Belt Kiyo ("Karate King") | Médite tout au fond (B1F, accessible via traversée d'eau) ; combat-épreuve, offre un compagnon en cas de victoire | Compagnon (récompense narrative) | |

**Side quests dans cette zone** : 1 — mini-donjon dōjō du Karate King Kiyo, réintégré v1 (2026-07-06, décision « aucune v2 » ; chiffré 2026-07-07, synthèse : intérieur, hérite de la fenêtre mt-mortar 510–545 ; voir `content/side-content-inventory.md` § E1)
**Objets à aller chercher dans cette zone** : 1 (compagnon offert par Kiyo)

---

## mahogany-town — Acajou Ville

**Budget** : 530–560 kanji étudiés | N3/N2 | 45–70 chars
**Grammaire nouvellement disponible à ce palier** : N3/N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Vendeur RageCandyBar | Bloque la route est, vend la spécialité locale ; laisse passer une fois la Team Rocket vaincue | — (vente) | |
| Vendeur du magasin de souvenirs | "Type louche", détourne le regard du bruit suspect au sous-sol ; remplacé après la chute du QG | — (vente) | |
| Homme devant le Gym | Évoque "l'homme à la cape noire" (Lance) enquêtant sur le signal brouillé | — | |
| PNJ à la grille de Route 43 | Mentionne que Mr. Pokémon cherche une Écaille Rouge | — | |
| Professeur Elm (appel) | Inquiet des émissions radio, juste après le 7e badge | — | |
| Skier Jill, Diana ; Boarder Deandre, Gerardo, Patton | Gardiens avant Pryce | — | |
| Scientist Gregg | Garde le PC qui coupe le système d'alarme du QG (B1F) | — | |
| Scientist Ross, Mitch | Donnent les 2 mots de passe (B3F) | — | |
| Rival (Silver) | QG Rocket B2F, déjà vaincu par Lance (Silver apparition #4, cameo — pas un combat) | — | |
| Lance | Soigne l'équipe au B2F, affronte Ariana+Sbire en double avec le joueur (transmetteur) | Objet de traversée d'eau (Whirlpool-équivalent) | |
| Executive Petrel (déguisé en "Boss") | Salle du chef, retournement narratif | — | |
| Executive Ariana | Combat en double, aux côtés de Lance | — | |
| Skier/Boarder (Gym) | Récompense finale du Gym Pryce | Glacier Badge + TM07 Hail | |

**Side quests dans cette zone** : 0 (arc principal scripté)
**Objets à aller chercher dans cette zone** : 2 (spécialité locale en vente, objet de traversée d'eau via Lance)

---

## lake-of-rage — Lac Colère

**Budget** : 540–570 kanji étudiés | N3/N2 | 48–70 chars
**Grammaire nouvellement disponible à ce palier** : N3/N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Poste-frontière Team Rocket (Route 43) | Rançonne pour passer ; redevient normal après la chute du QG | TM36 Sludge Bomb (après) | |
| Poké Maniac Ron/Ben/Brent, Picnicker Tiffany, Camper Spencer, Fisherman Marvin | Dresseurs (Route 43) | — | |
| Fishing Guru | Concours du plus gros poisson-compagnon | Ether (record battu) | |
| Frère/sœur du jour Wesley (mercredi, post-QG) | PNJ calendaire | Black Belt (objet à équiper) | |
| Fisherman Raymond, Andre ; Ace Trainer Aaron, Lois | Dresseurs post-événement Gyarados / mercredis | — | |
| Lance | Se présente au bord du lac après le combat, recrute le joueur pour Acajou Ville | — | |

**Side quests dans cette zone** : 1 (concours du plus gros poisson-compagnon)
**Objets à aller chercher dans cette zone** : 3 (TM36 Sludge Bomb, Ether, Black Belt)

---

## route-44 — Route 44

**Budget** : 555–590 kanji étudiés | N2 | 50–72 chars
**Grammaire nouvellement disponible à ce palier** : N2 — ～ものの（bien que）, ～ことなく（sans jamais）, ～にもかかわらず（malgré）, ～をはじめ（en commençant par）, ～に過ぎない, ～をもとに（à partir de）, ～だけでなく（non seulement）, ～に従って（à mesure que） (Hanabira : ～ものの, ～にもかかわらず, ～をはじめ, ～ことなく, ～に従って)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Poké Maniac Zach, Bird Keeper Vance, Psychic Phil, Fisherman Edgar, Fisherman Wilton, Ace Trainer Cybil, Allen | Dresseurs de route | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## ice-path — Chemin Glacé

**Budget** : 570–610 kanji étudiés | N2 | 50–75 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Kimono Girl Sayo | Coincée sur une plaque de glace près de la sortie, libérée en la poussant par derrière | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0 (Apricorn Rouge trouvé au sol, pas remis par un PNJ)

---

## blackthorn-city — Ebènelle

**Budget** : 600–660 kanji étudiés | N2 | 52–80 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Tuteur Ultime | Enseigne la "capacité ultime" à la forme finale du starter du joueur | — | |
| Grand-mère Wilma | Enseigne la capacité Dragon la plus puissante à un compagnon-Dragon lié au joueur | — | |
| Maniaque des capacités | Contre une Écaille de Cœur, réapprend une capacité oubliée | — | |
| Effaceur de capacités | Fait oublier n'importe quelle capacité, y compris permanentes | — | |
| Fille de la maison nord | Donne un Ruban d'Effort si le compagnon en tête est assez endurci | Ruban d'Effort | |
| Garçon local | Explique que les Dompteurs de Dragons sont tous nés à Ebènelle | — | |
| Frère/sœur du jour Santos (samedi) | PNJ calendaire | Soft Sand | |
| Homme bloquant l'Antre du Dragon | Refuse l'entrée tant que le badge de Gym n'est pas en poche | — | |
| Ace Trainer Mike, Fran, Cody, Lola, Paulo | Gardiens avant Clair (5, le plus grand roster de gardiens du jeu) | — | |
| Clair | Bat le joueur au Gym mais refuse explicitement de remettre le badge, envoie à l'Antre du Dragon | 印 n°8 — via l'Antre, pas directement au Gym | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 2 (Ruban d'Effort, Soft Sand)

---

## dragons-den — Antre du Dragon

**Budget** : 640–720 kanji étudiés | N2/N1 | 55–90 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 — ～だけに（précisément parce que）, ～ものだ（littéraire）, ～にほかならない（n'est rien d'autre que）, ～わけにはいかない（ne peut pas se permettre de） — structures N1 réservées aux dialogues de boss à ce stade, pas aux PNJ ambiants

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Ace Trainer Kobe, Piper ; Twins Clea & Gil | Dresseurs (B1F, avant le sanctuaire) | — | |
| Le Maître (Ancien) | Quiz d'empathie en 5 questions, condition réelle du 印 n°8 ; révèle être le grand-père de Clair/Lance | Cadeau de "successeur" | |
| "Les autres vieillards du Sanctuaire" (non nommés) | PNJ ambiants, corroborent la lignée Clair/Lance/Maître | — | |
| Clair | Fait irruption, surprise que le joueur ait réussi, remet le 印 final | 印 n°8 | |

**Side quests dans cette zone** : 1 (quiz du Maître — les 5 questions elles-mêmes ne sont pas transcrites par la source, à écrire entièrement par l'équipe)
**Objets à aller chercher dans cette zone** : 1 (cadeau de successeur / trophée de texte légendaire)

---

## route-45 — Route 45

**Budget** : 680–740 kanji étudiés | N2 | 50–75 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Black Belt Kenji, Hiker Timothy/Michael/Bailey/Parry/Erik, Camper Ted, Picnicker Erin, Ace Trainer Ryan/Kelly | Dresseurs de route (10 au total, répartis sur les chemins est/ouest) | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## dark-cave — Grotte Sombre

**Budget** : 700–760 kanji étudiés | N2 | 50–75 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Homme du fond (côté Ebènelle) | Accessible seulement après l'Antre du Dragon | BlackGlasses | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (BlackGlasses)

---

## route-26 — Route 26

**Budget** : 740–800 kanji étudiés | N2 | 52–78 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Ace Trainer Gaven, Jamie, Jake, Joyce ; Fisherman Scott ; Psychic Vernon | Dresseurs de route | — | |
| Maison des Frères/sœurs du jour | Carnet-index listant les 7 emplacements/jours (hub du fil PNJ récurrent) | — | |
| Fille de la maison au nord | Soigne gratuitement l'équipe du joueur | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## route-27 — Route 27

**Budget** : 760–830 kanji étudiés | N2 | 52–78 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Ace Trainer Megan, Blake, Reena, Brian ; Bird Keeper Jose ; Psychic Eli | Dresseurs de route (Chutes de Tohjo) | — | |
| Homme à la Porte de Réception de la Ligue | Bloque l'est (Kanto) et l'ouest (Mont Gris) ; seul le nord (Route Victoire) est ouvert à ce stade | — | |
| Vieille dame (sortie est des Chutes de Tohjo) | Donne TM37 Sandstorm si affection élevée du compagnon en tête | TM37 Sandstorm | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (TM37 Sandstorm)

---

## indigo-plateau-antichambre — Antichambre de la Ligue

**Budget** : 800–870 kanji étudiés | N2/N1 | 58–85 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (voir dragons-den ci-dessus)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Rival (Silver) | Dernier combat avant le Plateau (Silver apparition #6) ; a "vidé" la route de tout dresseur | — | |
| Vieil homme avec compagnon-télépathe (hall d'entrée) | PNJ ambiant, blague que son compagnon "ne pourra pas te ramener à la maison" | — | |
| Homme bloquant l'entrée de la Ligue | Laisse passer une fois interpellé, rappelle la règle "pas de sortie sans défaite" | — | |

Confirmé exhaustivement par le guidebook : aucun dresseur de route sur l'ensemble de la Route de la Victoire, en dehors du Rival final.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## indigo-plateau-will — Salle de Will

**Budget** : 870–900 kanji étudiés | N2/N1 | 60–100 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 — ～だけに（d'autant plus que）, ～うが～うが（que ce soit A ou B）, ～かたわら（en parallèle）, ～にほかならない, ～をよぎなくされる（être contraint de）, ～であれ～であれ, ～というか～というか, ～ものだ（littéraire, maxime）, ～わけだ (Hanabira : ～だけに, ～にほかならない, ～ものだ (literary), ～わけだ, ～うが～うが)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Will | Membre du Conseil 4, "Dresseur de type Psychique" — aucune personnalité officielle sourcée, liberté totale du studio | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## indigo-plateau-koga — Salle de Koga

**Budget** : 870–900 kanji étudiés | N2/N1 | 60–100 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Koga | Membre du Conseil 4, "Dresseur de type Poison" — aucune personnalité officielle sourcée | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## indigo-plateau-bruno — Salle de Bruno

**Budget** : 870–900 kanji étudiés | N2/N1 | 60–100 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Bruno | Membre du Conseil 4, "Dresseur de type Combat" — aucune personnalité officielle sourcée | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## indigo-plateau-karen — Salle de Karen

**Budget** : 870–900 kanji étudiés | N2/N1 | 65–110 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Karen | Membre du Conseil 4, "Dresseur de type Ténèbres" — aucune personnalité officielle sourcée | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## indigo-plateau-lance — Trône de Lance

**Budget** : 870–900 kanji étudiés | N2/N1 | 65–110 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Lance (Champion) | "Dresseur de type Dragon" — aucune personnalité officielle sourcée ; clôture le gauntlet Elite Four | Dragon Scroll (cérémonie) | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (Dragon Scroll)

---

## vermilion-city — Vermeille City

**Budget** : 900–1050 kanji étudiés | N2 | 65–110 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé — voir indigo-plateau-will pour la liste complète)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Grand-père paniqué (SS Aqua, arrivée) | Sa petite-fille a disparu du navire, retrouvée au sous-sol | Manteau de Métal | |
| Marin du mess | Cherche un collègue endormi dans une cabine (déclenche un combat) | — | |
| Capitaine | Héberge la petite-fille retrouvée, distribue des Plaques collectionnables | Plaques (selon jour de la semaine) | |
| Président du Club des Fans | Récompense qui écoute son histoire jusqu'au bout | Super Bonbon | |
| Homme du comptoir du Club des Fans | Détient l'objet perdu de Copycat, à livrer à Safranville | Poupée de Copycat | |
| Steven (1ère apparition, cameo) | Intercepte le joueur, intrigué par une espèce hors-région | — | |
| Eusine (cameo) | Aperçu sur la jetée en pleine chasse à Suicune | — | |
| Gentleman Gregory, Guitarist Vincent, Juggler Horton | Gardiens avant Lt. Surge (3 confirmés) | — | |
| Lt. Surge | 師範 Électrik, 9e badge | — | |

**Side quests dans cette zone** : 1 (poupée de Copycat, résolue à Safranville)
**Objets à aller chercher dans cette zone** : 3 (Manteau de Métal, Super Bonbon, Plaques)

---

## route-6-kanto — Route 6 (Kanto)

**Budget** : 1050–1060 kanji étudiés | N2 | 65–110 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Twins Amy & Dani, Picnicker Selina, Camper Virgil | Dresseurs confirmés (Route 5/Route 6/Passage Souterrain) | — | |
| Vieille dame (Route 5) | Pressent un danger | Talisman Anti-Combat | |
| PNJ du Passage Souterrain | Échange une spécialité locale (RageCandyBar) contre une CT | CT | |

🔒 Passage fermé tant que la Centrale Électrique n'est pas relancée.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 2 (Talisman Anti-Combat, CT)

---

## saffron-city — Safranville

**Budget** : 1060–1200 kanji étudiés | N2 | 65–110 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Mr. Psychic | Donne une CT gratuitement | CT | |
| Vigile du hall Silph Co. | Explique l'ascenseur en panne | Amélioration (objet-souvenir) | |
| Copycat | Imite instantanément le joueur à la rencontre (flavor) | — | |
| Fille de la gare de Safranville | Explique qu'un Pass Train Aimant est requis | — | |
| Karatéka du dojo | Absent — parti s'entraîner au Mont Mortier, Johto (callback direct) | — | |
| Copycat (résolution) | Poupée rapportée depuis Vermeille → donne le Pass Train Aimant | Pass Train Aimant | |
| Steven (Silph Co., 1ère rencontre) | Répond à une question pour recevoir un compagnon-cadeau | Compagnon-cadeau | |
| Steven (Silph Co., revisite) | Propose un échange direct contre un compagnon différent | Compagnon (échange) | |
| Medium Darcy, Psychic Franklin, Jared, Medium Rebecca | Gardiens avant Sabrina (4 confirmés ; Gym en 9 chambres reliées par téléportation) | — | |
| Sabrina | 師範 Psy, 10e badge | — | |

**Side quests dans cette zone** : 1 (Pass Train Aimant via la quête Copycat/Vermeille)
**Objets à aller chercher dans cette zone** : 4 (CT, Amélioration, Pass Train Aimant, compagnon-cadeau)

---

## route-9-10-rocktunnel — Routes 9-10 / Rock Tunnel

**Budget** : 1200–1220 kanji étudiés | N2 | 65–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Camper Sid, Hiker Eoin, Picnicker Heidi/Edna, Camper Dean, Hiker Sidney (Route 9) | Dresseurs (6) | — | |
| 2 Randonneurs (Route 10, 2e nom incertain OCR) | Dresseurs | — | |
| Garçon (Centre Pokémon voisin) | Relaie le vol à la Centrale (indice pur) | — | |

Aucun dresseur dans Rock Tunnel — donjon d'exploration pure plongé dans le noir (🔒 Flash), objets cachés dont 2 accessibles seulement après 力.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## kanto-power-plant — Centrale Électrique

**Budget** : 1235–1250 kanji étudiés *(était 1220–1235 — redistribution synthèse 2026-07-07, Lavender insérée avant)* | N2 | 65–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Directeur | Furieux du vol d'une pièce mécanique, la récupère et donne une CT une fois rendue | CT | |
| Vigile | Relaie un indice vers Azuria | — | |
| Ouvrier | Propose un troc simple | Objet (troc) | |

Vrai hub de la quête "pièce volée" qui déverrouille aussi le Passage Souterrain.

**Side quests dans cette zone** : 1 (rendre la pièce mécanique volée)
**Objets à aller chercher dans cette zone** : 2 (CT, objet de troc)

---

## cerulean-city — Azuria City

**Budget** : 1240–1350 kanji étudiés *(était 1220–1350 — redistribution synthèse 2026-07-07, Lavender insérée avant)* | N2 | 65–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Sbire Rocket isolé | "Seul membre étranger de la Team Rocket", n'a jamais reçu le mémo de dissolution ; vole une pièce mécanique de la Centrale | — | |
| Gérant du magasin de vélos d'origine | Regrette la baisse de fréquentation, évoque "un garçon et son vélo" trois ans plus tôt (écho Red) | — | |
| Garçon récurrent (nord de la ville) | Indique où trouver Misty, puis signale une anomalie à la rivière | — | |
| Misty | Trouvée hors du Gym (point de vue) ; le Gym ne se peuple de ses 5 dresseurs qu'après l'avoir rencontrée | — | |
| Swimmer Briana, Parker (+ 3 non confirmés dans l'OCR) | Gardiens avant Misty (5 au total annoncés) | — | |

⚠️ Ville confirmée pauvre en PNJ secondaires dans le texte source (vérifié en recoupant les pages OCR adjacentes).

**Side quests dans cette zone** : 1 (récupérer la pièce mécanique volée, relance la Centrale Électrique)
**Objets à aller chercher dans cette zone** : 0 (la pièce est rendue à la Centrale, pas remise au joueur)

---

## route-24-25-kanto — Routes 24-25 (Kanto)

**Budget** : 1350–1370 kanji étudiés | N2 | 65–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Sbire isolé (Route 24) | Combat scripté obligatoire (voleur de la pièce mécanique, dernier vestige de la Team Rocket "dissoute") | — | |
| 2 dresseurs supplémentaires (Route 24, zone d'attribution incertaine OCR) | Dresseurs | — | |
| Camper Lloyd, Fille Laura, Intello Pat, Écolier Joe, Fille Shannon, Ace Trainer Kevin (Route 25, gauntlet obligatoire de 6) + 1 dresseur non listé officiellement | Dresseurs | Pépite (Kevin) | |
| Grand-père de Bill (Chaumière au bord de mer) | Montrer un compagnon précis → objet évolutif au choix | Objet évolutif | |
| Misty (rendez-vous, bout de la route) | Scène climactique de poursuite de l'esprit légendaire, Eusine en commentateur | — | |

🔒 Coupe et Surf.

**Side quests dans cette zone** : 1 (montrer un compagnon précis au grand-père de Bill)
**Objets à aller chercher dans cette zone** : 2 (Pépite, objet évolutif)

---

## route-7-kanto — Route 7 (Kanto)

**Budget** : 1370–1380 kanji étudiés | N2 | 68–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Young Couple Moe & Lulu, Super Nerd Sam (Route 7) | Dresseurs | — | |
| Bikers "turbulents" non nommés (Route 8) | Dresseurs | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## celadon-city — Céladia

**Budget** : 1380–1500 kanji étudiés | N2 | 68–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Wake (cameo, déguisé) | Champion d'arène visiteur d'une autre région | 3 masques-accessoires | |
| Homme du toit des Condominiums (visible 20h–4h uniquement) | PNJ à horaire fixe | Grigri Esprit | |
| Rival (bureaux GAME FREAK, cameo) | Taquine sur une récompense musicale une fois tous les badges réunis | — | |
| "Président" GAME FREAK (cameo) | Dialogue d'ambiance sur le développement du jeu | — | |
| "Directeur son" GAME FREAK | Objet-clé changeant la musique d'ambiance, une fois tous les badges réunis | Objet-clé musique | |
| "Réalisateur" GAME FREAK | Quête en 2 étapes, récompense à chaque jalon de complétion | Récompenses par jalon | |
| Maylene (cameo) | Championne visiteuse, scène comique en restaurant | — | |
| Gentleman du comptoir d'échange | Se plaint de son manque de Jetons (flavor) | — | |
| Conseiller "Pouvoir Caché" | PNJ d'information gratuite près du Casino | — | |
| Picnicker Tanya, Beauty Julia, Twins Jo & Zoe, Lass Michelle | Gardiens avant Erika (4 confirmés) | — | |
| Erika | 師範 Plante, 12e badge | — | |

**Side quests dans cette zone** : 1 (quête du Réalisateur GAME FREAK, 2 paliers)
**Objets à aller chercher dans cette zone** : 3 (masques, Grigri Esprit, objet-clé musique)

---

## route-16-17-18-cycling-road — Routes 16-18 / Cycling Road

**Budget** : 1500–1520 kanji étudiés | N2/N1 | 68–115 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Biker Dale (Route 16) | Dresseur | — | |
| PNJ récurrent (Route 16) | Enseigne "un mot à la mode" par jour à qui revient le voir | — | |
| 12 Motards dont Joel, Jacob, Aiden (Route 17) | Dresseurs | — | |
| 7 Motards nommés + 2 Bird Keeper (Route 18, 9 dresseurs) | Dresseurs | — | |

🔒 Bicyclette obligatoire (16→17), Coupe pour l'ensemble de Route 18.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## fuchsia-city — Fuchsia City

**Budget** : 1520–1650 kanji étudiés | N2/N1 | 68–115 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Fille au nord du Centre Pokémon | Explique que la Zone Safari a déménagé au Johto (lore) | — | |
| Fille à l'est du Gym | Mentionne que le grand-père de Bill est parti lui rendre visite | — | |
| PNJ troc "Wadbutt" (nord) | Troc récurrent : un fragment contre une baie thématique | Baie (troc) | |
| Fils de Baoba | Gère le Pal Park (callback direct vers un PNJ Johto déjà documenté) | — | |
| Visiteur du Pal Park au chapeau | Donne un accessoire cosmétique sous condition externe | Accessoire cosmétique | |
| Picnicker Cindy, Camper Barry, Lass Alice, Linda | Gardiens avant Janine (4 confirmés) | — | |
| Janine | 師範 Poison, 13e badge (Gym-labyrinthe de murs transparents) | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 2 (baie via troc, accessoire cosmétique)

---

## route-14-15-kanto — Routes 14-15 (Kanto)

**Budget** : 1650–1670 kanji étudiés | N2/N1 | 68–120 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Twins Kay & Tia, Pokéfan Eleanor, Enseignante Colette/Hillary, 2 Écoliers, Pokéfan Boone (Route 15) | Dresseurs | — | |
| Bird Keeper Josh/Roy, 5 Écoliers, 2 Pokéfans, Enseignante Clarice (Route 14) | Dresseurs | — | |
| Fille dans les hautes herbes (Route 14, ouest) | Demande à voir un compagnon précis | Objet porté rare | |

📍 Première apparition à pied de l'esprit légendaire (Suicune-analogue), Eusine en poursuite, oriente vers Route 25. 🔒 Coupe requis ; rebords à sens unique imposant un ordre de traversée.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (objet porté rare)

---

## route-11-12-13-diglett — Routes 11-13 / Grotte Diglett

**Budget** : 1670–1685 kanji étudiés | N1 | 68–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Psychic Fidel, Youngster Jason/Owen, Psychic Herman (Route 11) | Dresseurs | — | |
| Pêcheurs génériques (Route 12, marchent en silence pour ne pas effrayer les Pokémon) | Dresseurs (ambiance) | — | |
| Camper Clark, Hiker Kenny, Picnicker Ginger, Pokéfan Alex, Camper Tanner (Route 13, 11 au total confirmés) | Dresseurs | — | |
| PNJ de couleur locale (Grotte Diglett) | Surpris par les créatures qui surgissent du sol | — | |
| Portier (Grotte Diglett) | Remet un objet de quête confié par le Pr. Chen/Oak | Objet de quête | |
| Maison voisine (Grotte Diglett) | — | Pépite | |

🔒 力 pour un accès complet à la Grotte Diglett.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 2 (objet de quête, Pépite)

---

## pewter-city — Argenta City

**Budget** : 1685–1800 kanji étudiés | N1 | 68–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Vieil homme sur la colline (près du Poké Mart) | Donne l'Aile Argent/Arc-en-ciel (callback direct vers le climax Tour Jo, Johto) | Aile Argent/Arc-en-ciel | |
| Comptoir du Musée des Sciences | Restaure un fossile-objet en compagnon | Compagnon (fossile) | |
| Steven (cameo) | Champion visiteur, absorbé dans une expo minérale ; prérequis silencieux du fil Steven (résolu à Safranville) | — | |

Aucun dresseur devant le Gym — Brock est explicitement le seul 師範 Kanto sans garde ("on peut marcher droit jusqu'à lui").

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 2 (Aile légendaire, compagnon-fossile)

---

## mont-lune-route-3-4 — Mont Lune / Routes 3-4

**Budget** : 1800–1820 kanji étudiés | N1 | 68–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Petit comptoir marchand (Mont Lune) | Au milieu de la traversée | — (vente) | |
| Rival (Silver, embuscade Mont Lune — **vrai combat adopté 2026-07-07, synthèse** : 26 questions N1, quête `silver-kanto`, hors "6 Rencontres" ; déclenche la Tag Battle de l'Antre puis les revanches hebdo au Plateau Indigo — voir PRD § Silver — arc Kanto) | Motive la Tag Battle de l'Antre du Dragon déjà documentée côté Johto | — | |
| Youngster Warren, Jimmy ; Hiker Bruce ; Firebreather Burt (Route 3) | Dresseurs | — | |
| Youngster Regis, Double Team Zac & Jen, Firebreather Otis, Black Belt Manford/Ander, Hiker Dwight, Picnicker Hope/Sharon, Bird Keeper Hank (Route 4) | Dresseurs | — | |

Aucun dresseur nommé au Mont Lune (contrairement aux Routes 3/4 alentour) — lore autour de météorites à l'énergie étrange.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## route-2-foret-viridian — Route 2 / Forêt Viridian

**Budget** : 1820–1835 kanji étudiés | N1 | 70–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Bug Catcher Ed, Abner, Ellis, Dane, Stacey, Dion | 6 Insectophiles (thème de classe homogène) | — | |

🔒 切/Coupe pour l'arbre côté Argenta *(« 飛 » corrigé 2026-07-07, passe de vérification globale V-13 — coquille : l'arbre se coupe, 切, il ne se survole pas)* ; scavenger-hunt de zone encouragé par le texte source.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## viridian-city — Vertville

**Budget** : 1835–1845 kanji étudiés | N1 | 70–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Vieil homme devant le Gym | Bloque puis laisse passer une fois la condition remplie (Gym fermé au 1er passage) | — | |
| Trainer House | Un combat par jour (lieu, non personnifié dans le texte) | — | |
| Rumeur ambiante (Centre Pokémon) | Clients se demandant si le Gym d'Île Braise existe encore, pousse le joueur vers le sud | — | |
| Ace Trainer Bonita, Salma, Arabella | Gardiens avant Blue (3 confirmés ; sol à tuiles-flèches) | — | |
| Blue | 師範 final Kanto, 16e badge ; Gym verrouillé jusqu'à la toute fin (1ère visite : Gym fermé — vrai combat calibré ~1920 kanji/N1, sur revisite après Île Braise) | 印/Badge (sur revisite) | |

⚠️ **Zone revisitée** (même schéma que Doublonville/Silver #5 et Oliville/Jasmine, voir `curriculum-checkpoints.md` § Note zones revisitées) : cette ligne couvre uniquement la 1ère visite (Gym fermé, le 師範 est absent). Le vrai combat contre Blue reste gaté à 1920 kanji (déjà fixé au PRD), sur la revisite après Île Braise.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## route-1-kanto — Route 1 (Kanto)

**Budget** : 1845–1855 kanji étudiés | N1 | 70–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| School Kid Sherman, Danny ; Ace Trainer French, Quinn | Dresseurs de route (4) | — | |
| Photographe itinérant | Jours différents côté Vertville vs côté Bourg-Origine | — | |

Aucun obstacle confirmé.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## pallet-town — Bourg-Origine

**Budget** : 1855–1870 kanji étudiés | N1 | 70–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

⚠️ **Zone multi-visite** (même schéma que Doublonville/Silver #5, Oliville/Jasmine, et Vertville ci-dessus) : cette ligne calibre uniquement la 1ère visite (juste après Vertville, rien à faire encore). Bourg-Origine est revisitée deux fois de plus dans le scénario — après avoir battu Blue (~1920 kanji, permission Mont Gris) et après Red (post-Mont Gris, récompense finale) — les PNJ/dialogues liés à ces deux jalons doivent être calibrés sur l'avancement réel du joueur à ce moment-là, pas sur cette ligne. Voir `curriculum-checkpoints.md` § Note zones revisitées.

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Photographe itinérant | Présent mercredi/jeudi/vendredi uniquement | — | |
| Daisy (sœur de Blue) | Toilette le compagnon du joueur tous les jours 15h–16h ; après 7 visites cumulées, donne le contact de Blue | Contact de Blue (combat de revanche post-16-badges) | |
| Mère de Red | Confirme que Red voyage, maison tenue en son absence | — | |
| Pr. Chen/Oak (PC) | Permet de lire un mail d'ambiance d'un collègue chercheur | — | |
| Pr. Chen/Oak (évaluation Pokédex) | Bilan périodique, en personne ou par téléphone | — | |
| Pr. Chen/Oak (1ère visite, juste après Vertville) | "Reviens une fois tous les badges Kanto en poche" — rien à donner encore | — | |
| Pr. Chen/Oak (2e visite, après Blue à Vertville) | Donne la permission d'accès au Mont Gris | Permission Mont Gris | |
| Pr. Chen/Oak (3e visite, après Red) | Choix de récompense symbolique, écho au tout premier choix de starter | Cadeau au choix | |

**Side quests dans cette zone** : 0 (jalons narratifs de progression, pas de quêtes séparées)
**Objets à aller chercher dans cette zone** : 2 (permission Mont Gris, cadeau final au choix)

---

## route-21-kanto — Route 21 (Kanto)

**Budget** : 1870–1885 kanji étudiés | N1 | 70–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Nageurs/Pêcheurs/Bird Keeper (5 nommés) | Dresseurs | — | |

Éruption volcanique mentionnée en ambiance. 🔒 Surf ; objet bonus accessible après 力, pas remis par un PNJ.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## cinnabar-island — Île Braise

**Budget** : 1885–1920 kanji étudiés | N1 | 70–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Blue (1ère rencontre) | Renvoie le joueur à plus tard ("plus de badges Kanto") | — | |
| Blue (revisite tardive, post-Rock Climb) | Donne un objet porté | Magmarizer | |
| Panneau de relocalisation du Gym | Objet de décor, pointe vers Seafoam Islands | — | |
| Scientist Linden, Daniel ; Super Nerd Merle, Waldo, Cary | Gardiens avant Blaine (~5-6 annoncés, Seafoam Islands) | — | |
| Blaine | 師範 Feu, 15e badge (Gym relocalisé aux Seafoam Islands suite à l'éruption) | — | |

⚠️ Île sinistrée par l'éruption volcanique un an avant l'arrivée du joueur (seul le Centre Pokémon a survécu) — contenu PNJ volontairement clairsemé, cohérent avec le ton "carrefour émotionnel" plutôt qu'un simple gym de plus.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (Magmarizer)

---

## route-19-20-seafoam — Routes 19-20 / Seafoam Islands

**Budget** : 1920–1950 kanji étudiés | N1 | 70–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Nageurs/Campeurs/Pique-niqueuses/Bird Keeper nommés (Route 20, 7-8) | Dresseurs | — | |
| 7 Nageurs nommés (Route 19) | Dresseurs | — | |
| Dresseurs postés (Seafoam B2F) | Servent de "freins" pour stopper la glissade sur sol de glace (puzzle environnemental-social) | — | |

🔒 Surf, 力, Rock Smash (sans équivalent ici) pour l'ensemble.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## cerulean-cave — Grotte Azuria (postgame optionnel)

**Budget** : 2136 kanji étudiés (plateau bonus — plus de nouveau kanji requis, corrigé 2026-07-05, audit 01) | N1 | 70–130 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

Donjon solo post-16-badges, aucun dresseur. Gardien à l'entrée jusqu'aux 8 badges Kanto complets (s'efface définitivement une fois rencontré). 🔒 Flash (grotte plongée dans le noir), Surf + 力 pour la traversée complète.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## mt-silver-route-28 — Route 28

**Budget** : 2136 kanji étudiés (plateau bonus — plus de nouveau kanji requis, corrigé 2026-07-05, audit 01) | N1 | 70–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| L'Idole retraitée | Trouvée via une coupe d'arbre depuis l'extérieur du Mont Gris ; demande le silence du joueur sur sa cachette | TM47 Acier Aile | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (TM47 Acier Aile)

---

## mt-silver-base — Gris — Base

**Budget** : 2136 kanji étudiés (plateau bonus — plus de nouveau kanji requis, corrigé 2026-07-05, audit 01) | N1 | 70–120 chars (« 125 » aligné sur curriculum-checkpoints, corrigé 2026-07-05, audit 01)
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Note du Prof Elm | Message laissé, pas un PNJ en personne à ce stade ("full circle") | — | |
| Centre Pokémon (jonction Route 28 / entrée Mont Gris) | Dernière occasion de se préparer avant l'ascension | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## mt-silver-lower — Gris — Versants inférieurs

**Budget** : 2136 kanji étudiés (plateau bonus — plus de nouveau kanji requis, corrigé 2026-07-05, audit 01) | N1 | 70–125 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

Aucun PNJ nommé confirmé — traversée d'exploration pure (grotte à la nage, versants extérieurs enneigés), uniquement des rencontres sauvages selon la source web (passe 3).

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## mt-silver-upper — Gris — Versants supérieurs

**Budget** : 2136 kanji étudiés (plateau bonus — plus de nouveau kanji requis, corrigé 2026-07-05, audit 01) | N1 | 70–130 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Le Grunt Solitaire (quête Rocket optionnelle) | Attend Giovanni, pas de combat — dialogue mélancolique ("Team Rocket s'est dissous") | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## mt-silver-summit — Gris — Sommet

**Budget** : 2136 kanji étudiés (plateau bonus — plus de nouveau kanji requis, corrigé 2026-07-05, audit 01) | N1 | silence ou 1 ligne
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé — Red ne parle pas, aucune structure grammaticale à illustrer ici)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Red | 100 questions (HP battle — « 50 » corrigé 2026-07-05, audit 01, aligné PRD), silence total, tempête de grêle permanente ; disparaît immédiatement après défaite | Ruban de Légende | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (Ruban de Légende)
