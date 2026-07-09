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

**Note (2026-07-06, audit 04 ; budgets chiffrés 2026-07-07, synthèse ; sections sourcées 2026-07-09,
étape 2 point 3) — zones réintégrées** : la géographie HGSS complète est réintégrée (tranché au grill,
voir PRD § Géographie complète) : **Lavender Town** (station radio → carte EXPN), **Routes 5/8/22**,
**Union Cave**, **Routes 41/43/46**, **intérieur des Ruines d'Alph**, **Îles Tourbillon**, **Safari
Zone adaptée** (on y attrape des contenus de lecture — mangas, textes — au lieu de Pokémon). Seul le
Battle Frontier reste hors scope (+ la fonction de transfert du Pal Park, synthèse).
**Les budgets sont désormais chiffrés** — chaque zone a sa ligne dans la table de calibration
(`curriculum-checkpoints.md` § Redistribution : Union Cave 140–175, Route 41 480–510, Route 43 535–565,
Lavender 1220–1240 portent de la croissance ; Îles Tourbillon, Safari/47/48/Cliff Cave, Routes 46/5/8/22
sont des plateaux sans croissance requise). **Leurs sections d'inventaire PNJ sont désormais sourcées**
(voir leurs entrées ci-dessous, dans l'ordre réel de traversée — 83/83 zones couvertes).

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
| Professeur Elm | Fait choisir un starter parmi 3, envoie en mission chez Mr. Pokémon, panique lors du cambriolage | Everstone (après éclosion de l'œuf), **grand texte d'Elm** (après 8 badges — « Master Ball » corrigé 2026-07-07, passe de vérification : reliquat de R11) | leçon #1 — 漢字: 一・二・人・先・入・八 — 文法: A が いちばん～ (A ga ichiban～)<br>leçon #2 — 漢字: 円・十・口・四・土・大 — 文法: A。けれども、～B。(A. Keredomo,~ B.)<br>leçon #3 — 漢字: 女・子・小・山・川・手 — 文法: A。しかし、～B。 (A. Shikashi, ~B.)<br>leçon #4 — 漢字: 日・月・木・気・水・火 — 文法: A。じゃ、～B。(A. Ja, ~B.)<br>leçon #5 — 漢字: 生・目・立・耳・車・金 — 文法: A。それじゃ、～B。(A. Soreja,~B.) |
| Policier | Enquête sur le cambriolage du labo, interroge sur le garçon roux | — | |
| Rival (Silver) | Aperçu en train d'espionner le labo | — | |
| Assistant du Pr. Elm | Comptoir du Mart, garde l'œuf mystère jusqu'au 1er badge | — | |

**Note leçons (ajoutée 2026-07-07, passe de vérification audit 06 ; mentor mis à jour 2026-07-08, audit 10, tranché au grill — Fukuda supprimé ; recompté 2026-07-09, Étape 2 point 5 — proposition automatique fusionnée)** :
les leçons de cette zone sont portées par **le Pr. Elm, dans son labo** (bâtiment HGSS d'origine, aucune géographie inventée — voir PRD § bootstrap Elm), seul PNJ-leçon désigné de la zone (voir sa
ligne ci-dessus). Assignation mécanique : **5 leçons (30 kanji fondamentaux, ordre `getAvailableKanji`, groupes de 6)**, `lessons-new-bark-town` #1→#5. À la passe contenu, à répartir sur les
deux passages narratifs réels (Elm → course chez Mr. Pokémon → retour) : les 1-2 premières leçons avant le départ, le reste au retour — la coupure précise entre les 5 groupes mécaniques et les 2
visites narratives reste une décision d'écriture, pas figée ici. Seuil de 30 exigé à l'entrée de Ville Griotte. Route 29 n'a aucun PNJ-leçon : sa croissance 10→50 est portée par ces
mêmes leçons du labo d'Elm (allers-retours).

**Side quests dans cette zone** : 0 (zone d'onboarding pure, pas de quête distincte)
**Objets à aller chercher (remis par un PNJ, pas juste trouvés au sol) dans cette zone** : 2 (Pokégear via Mom, grand texte d'Elm via Elm — « Master Ball/objet narratif » corrigé 2026-07-07, passe de vérification)

---

## route-29 — Route 29

**Budget** : 10–50 kanji étudiés | N5 | 15–25 chars
**Grammaire nouvellement disponible à ce palier** : N5 (voir liste ci-dessus, palier inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Lyra/Ethan | Attend sur la route une fois l'œuf livré, apprend au joueur à attraper (tutoriel) | — | |
| Frère/sœur du jour Tuscany | PNJ calendaire, visible uniquement le mardi (et après le badge de Mauville) | TwistedSpoon | leçon #1 — 漢字: 雨・前・北・後・母 — 文法: Noun に～ (Noun ni～)<br>leçon #2 — 漢字: 毎・父・行・西・長 — 文法: Noun に 帰ります (Noun ni kaerimasu)<br>leçon #3 — 漢字: 食・高・魚・力・夕 — 文法: Noun に します (Noun ni shimasu)<br>leçon #4 — 漢字: 文・田・京・作・光 — 文法: Noun に なります (Noun ni narimasu) |

Aucun dresseur nommé confirmé sur cette route dans le texte d'origine (zone trop précoce, pas encore de Poké Balls). *(Note 2026-07-05, audit 01 : politique « zéro PNJ-leçon inventé » adoptée. **Soldé 2026-07-07, synthèse, au grill — fidélité stricte : les « 8-10 dresseurs » sont abandonnés, la Route 29 se traverse sans combat comme dans HGSS ; les 10 prototypes de `trainers.json` supprimés.)*

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (TwistedSpoon, Tuscany)

---

## cherrygrove-city — Ville Griotte

**Budget** : 30–60 kanji étudiés | N5 | 15–25 chars
**Grammaire nouvellement disponible à ce palier** : N5 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Guide Gent (vieux monsieur) | Accueille le joueur à l'entrée, fait visiter la ville | Running Shoes, Map Card | leçon #1 — 漢字: 冬・図・夏・夜・家 — 文法: Verb に 行きます (Verb ni ikimasu) |
| Rival (Silver) | Nargue le joueur puis déclenche le 1er combat de rival (Silver apparition #1) | — | combat |
| Vendeuse du Mart | Comptoir du fond | Air Mail, Heal Ball (vente) | leçon #2 — 漢字: 工・帰・広・心・方 — 文法: Verb ましょう (mashou) |
| Employé Centre Pokémon | Signature de carte dresseur au 2F | — | |

**Side quests dans cette zone** : 0 (accueil/tutoriel uniquement)
**Objets à aller chercher dans cette zone** : 2 (Running Shoes, Map Card — Guide Gent)

---

## route-30 — Route 30

**Budget** : 50–80 kanji étudiés | N5 | 15–28 chars
**Grammaire nouvellement disponible à ce palier** : N5 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Bug Catcher Don | Dresseur de route — corrigé 2026-07-09 (extraction ROM `~/pokeheartgold`, source de vérité) : Don appartient à Route 30, pas Route 31 (inversion trouvée dans le dépouillement d'origine) | — | combat |
| Youngster Joey | Dresseur de route (personnage culte de la franchise, easter-egg possible) | — | combat |
| Youngster Mikey | Dresseur de route — corrigé 2026-07-09 (extraction ROM), même inversion que Don | — | combat |
| Homme dans une maison (nord) | Donne l'Apricorn Box (objet-clé, débloque la cueillette d'Apricorns) | Apricorn Box | leçon #1 — 漢字: 止・池・牛・用・考 — 文法: ～あります (〜arimasu)<br>leçon #2 — 漢字: 肉・色・茶・通・遠 — 文法: ～いかがですか。 (〜ikaga desu ka.)<br>leçon #3 — 漢字: 門・顔・風・鳥・世 — 文法: いくつ～ (ikutsu~)<br>leçon #4 — 漢字: 代・区・寒・度・業 — 文法: いつか～ (itsuka～) |
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
| Bug Catcher Wade | Dresseur de route — corrigé 2026-07-09 (extraction ROM) : Wade appartient à Route 31, pas Route 30 (inversion trouvée dans le dépouillement d'origine, Don/Mikey déplacés vers route-30) | — | combat |
| Lyra/Ethan | Revue sur la route, donne le Vs. Recorder | Vs. Recorder | |
| Jeune homme près de l'Apricorn noir | Quête de livraison ("porte ce message à mon contact", compagnon-courrier Kenya) | TM44 Rest | leçon #1 — 漢字: 死・漢・発・送・進 — 文法: それから、～ (sorekara、～)<br>leçon #2 — 漢字: 低・別・建・私・王 — 文法: だいたい〜 (daitai〜)<br>leçon #3 — 漢字: 竹・糸・原・園・当 — 文法: たいてい～ (taitei～)<br>leçon #4 — 漢字: 形・戸・才・数・毛 — 文法: だから、～ (dakara、～) |

**Side quests dans cette zone** : 1 (livraison du message pour le jeune homme de l'Apricorn noir)
**Objets à aller chercher dans cette zone** : 2 (Vs. Recorder, TM44 Rest)

---

## violet-city — Mauville

**Budget** : 80–130 kanji étudiés | N5/N4 | 20–35 chars
**Grammaire nouvellement disponible à ce palier** : N5/N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Bird Keeper Rod, Bird Keeper Abe | Gardiens avant Falkner | — | combat |
| Homme à lunettes noires | Bloque l'entrée du Gym tant que Tour Grospignon n'est pas visitée | — | |
| Earl | Instituteur ambulant de "l'École Pokémon", trouvé errant entre le Gym et le Mart | — | leçon #1 — 漢字: 米・羽・角・谷・馬・麦 — 文法: どこへも Verb ないです (doko e mo + Verb + nai desu) |
| Garçon blond | Près du Centre Pokémon, échange des Éclats contre des lots de Baies | Baies | leçon #2 — 漢字: 他・倍・列・化・命・定 — 文法: どこへも Verb ません (doko e mo + Verb + masen) |
| Garçon à lunettes | PNJ d'échange de compagnon (maison près du Centre Pokémon) | — | leçon #3 — 漢字: 実・宿・役・投・決・流 — 文法: どこも Verb ないです (dokomo + Verb + naidesu) |
| Garçon près du Mart | Agité, rapporte avoir vu "un arbre qui bouge" (teaser Sudowoodo/Route 36) | — | leçon #4 — 漢字: 深・温・港・湖・湯・皮 — 文法: どこも Verb ません (dokomo + Verb + masen) |
| Teala | Sous-sol du Centre Pokémon, donne le Pal Pad après le 1er badge | Pal Pad | leçon #5 — 漢字: 皿・福・落・葉・身・追 — 文法: どちら～ (dochira～) |
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
| Sage Neal, Troy, Jin, Nico, Edmond, Chow | 6 Sages répartis sur les 3 étages | — | leçon #1 — 漢字: 遊・部・酒・陽・面 — 文法: A とか B とか |
| Ancien Li | Sommet (3F), bat le joueur, explique la technique | TM70 Flash | leçon #2 — 漢字: 争・伝・候・兆・利 — 文法: A は B ほど～ありません (A wa B hodo ～ arimasen) |
| Rival (Silver) | Présent au 3F, sermonné par l'Ancien Li sans écouter (scène, pas de combat) | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (TM70 Flash)

---

## route-32 — Route 32

**Budget** : 110–160 kanji étudiés *(était 110–170 — redistribution synthèse 2026-07-07, Union Cave insérée)* | N4 | 25–40 chars
**Grammaire nouvellement disponible à ce palier** : N4 — ～てもらえますか/てもらえませんか, ～ながら, ～ことにしている, ～ことになっている, ～ようになる/ようになった, ～ないほうがいい, ～んだけど, ～のに, ～ても/でも, ～から (Hanabira : Verb てもらえませんか, Verb ながら, ～ことにしている, ～ようになる, ～のに)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Youngster Albert, Picnicker Liz, Camper Roland, Youngster Gordon, Fisherman Henry/Justin/Ralph, Bird Keeper Peter | Dresseurs de route — 8 confirmés propres à Route 32 (extraction ROM 2026-07-09, résout l'ancien bloc combiné 32/33 : Hiker Anthony déplacé vers route-33) | — | combat |
| Frère/sœur du jour Frieda (vendredi) | PNJ calendaire, chemin étroit derrière le Centre Pokémon | Poison Barb | |
| Homme sur le chemin | Cadeau gratuit sans condition | Graine Miracle | leçon #1 — 漢字: 刷・副・印・参・器 — 文法: Noun に なる (Noun ni naru) |
| Jeune homme près du Centre Pokémon | PNJ comique, tente de vendre une "queue de Ramoloss" | — | leçon #2 — 漢字: 変・官・害・富・席 — 文法: のために (no tame ni) |
| Pêcheur (Centre Pokémon) | Donne la Vieille Canne | Vieille Canne (Old Rod) | leçon #3 — 漢字: 帯・底・康・愛・成 — 文法: Noun の 間に (〜no aida ni) |
| Homme au-delà d'un point 力 | Récompense une fois le CS débloqué | TM05 Roar | leçon #4 — 漢字: 散・欠・残・求・浅 — 文法: Noun ばかり (〜bakari) |
| Homme près du pêcheur | Demande si le joueur collectionne les Apricorns | 2 Lure Balls | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 5 (Poison Barb, Graine Miracle, Vieille Canne, TM05 Roar, Lure Balls)

---

## ruins-of-alph — Ruines Arcaniques

**Budget** : 120–180 kanji étudiés | N4 | 25–40 chars
**Grammaire nouvellement disponible à ce palier** : N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Jeune homme (salle souterraine) | Admiratif du 1er puzzle résolu, remet un journal qui s'auto-remplit | Rapport Unown | leçon #1 — 漢字: 満・無・然・熱・競 — 文法: Verb た ところ (Verb ta tokoro)<br>leçon #3 — 漢字: 達・選・陸・類・久 — 文法: Verb ために (tame ni) |
| Chercheurs (PNJ ambiants) | Centre de Recherche des Ruines, discutent des découvertes | — | leçon #2 — 漢字: 老・臣・良・芸・衣 — 文法: Verb たほうがいい (〜ta hou ga ii)<br>leçon #4 — 漢字: 仏・任・価・保・修 — 文法: Verb つもり (〜tsumori) |
| Psychic Nathan | Dresseur de combat, bordure Centre de Recherche/Union Cave | — | combat |

**Side quests dans cette zone** : 0 (puzzle environnemental, pas une quête PNJ à proprement parler)
**Objets à aller chercher dans cette zone** : 1 (Rapport Unown)

---

## union-cave — Union Cave

**Budget** : 140–175 kanji étudiés (chemin critique, entre Route 32 et Route 33) | N4 | 25–40 chars
**Grammaire nouvellement disponible à ce palier** : N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Hiker Daniel, Hiker Russell, Firebreather Bill, Firebreather Ray, Poké Maniac Larry (1F) | Dresseurs de combat — roster exact confirmé par extraction ROM (`~/pokeheartgold`, 2026-07-09) ; Bill/Ray ajoutés (absents de la 1ʳᵉ passe web) | — | combat |
| Hiker Phillip, Hiker Leonard, Poké Maniac Andrew, Poké Maniac Calvin (B1F) | Dresseurs de combat — idem | — | combat |
| Ace Trainer Nick, Ace Trainer Gwen, Ace Trainer Emma (B2F) | Dresseurs de combat — idem, 12 dresseurs au total sur les 3 étages (le « 7 » du guidebook Prima était une forte sous-estimation) | — | combat |

Psychic Nathan (bordure Centre de Recherche/Union Cave) est déjà recensé dans la section
ruins-of-alph — ne pas dupliquer ici (vérification croisée 2026-07-09 : doublon trouvé et
retiré, le PNJ n'a qu'une seule attribution de zone dans le guide).

Séquence du puzzle de la grotte confirmée en 4 temps (une entrée par point cardinal, chaque entrée
nécessitant un objet/CS-Kanji différent pour être atteinte dans l'ordre : aucun objet → Coupe →
Union Cave → Force) — verrou d'exploration, pas un PNJ.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## route-33 — Route 33

**Budget** : 160–195 kanji étudiés *(était 150–190 — redistribution synthèse 2026-07-07)* | N4 | 25–40 chars
**Grammaire nouvellement disponible à ce palier** : N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Hiker Anthony | Dresseur de route — résolu 2026-07-09 par extraction ROM (`~/pokeheartgold`) : le guidebook rattachait tout le bloc combiné « Routes 32/33 » à Route 32 sans distinguer, Anthony est le seul dresseur réellement placé sur la carte Route 33 | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## azalea-town — Ecorcia

**Budget** : 160–210 kanji étudiés | N4 | 28–45 chars
**Grammaire nouvellement disponible à ce palier** : N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Kurt | Artisan Apricorn → Boule : dépose des Apricorns, reçoit un objet en 24h | Boule (selon couleur d'Apricorn apportée) | |
| Bug Catcher Al, Josh, Benny ; Twins Amy & Mimi | Gardiens avant Bugsy — « May » corrigé en « Mimi » 2026-07-09 (extraction ROM, coquille probable) | — | combat |
| Rival (Silver) | Défi au portail ouest, vers Forêt Secte (Silver apparition #2) | — | |
| Charcoal Man | Ses Farfetch'd-analogues se sont enfuis en Forêt Secte ; remet le Charbon une fois résolu | Charbon | leçon #1 — 漢字: 備・制・厚・師・得・復 — 文法: Verb て くる (Verb te kuru)<br>leçon #3 — 漢字: 準・演・犯・示・税・能 — 文法: Verb て くれる (Verb-te kureru)<br>leçon #5 — 漢字: 限・険・雑・非・並・亡 — 文法: Verb てしまう (〜te shimau) |
| Sbire Rocket | Bloque l'entrée du Puits Ramoloss | — | |
| Vendeur du Mart | Comptoir du fond | Bloom Mail, Heal Ball, Net Ball (vente) | leçon #2 — 漢字: 快・接・殺・毒・比・減 — 文法: Verb てくれませんか (〜te kuremasen ka)<br>leçon #4 — 漢字: 複・象・述・逆・過・適 — 文法: Verb て + さしあげる (Verb TE sashiageru) |
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
| Sbires Rocket ×3 | Combats de couloir, répartis B1F/B2F — compte confirmé par extraction ROM (2026-07-09) : 2 Team Rocket Grunt + 1 Team Rocket F Grunt | — | combat |
| Executive Proton | Combat final ; confirme que la Team Rocket opère en sous-main pour Giovanni | — | combat |

**Side quests dans cette zone** : 0 (événement scripté bloquant l'accès au Gym Bugsy)
**Objets à aller chercher dans cette zone** : 0 (le courrier du gendre de Kurt, trouvé au fond du puits, est un texte de lecture, pas un objet remis par un PNJ)

---

## ilex-forest — Forêt Secte

**Budget** : 200–240 kanji étudiés | N4 | 30–45 chars
**Grammaire nouvellement disponible à ce palier** : N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Apprenti du Maître du Charbon | À l'entrée, enseigne la technique de capture des 2 fuyards | — | leçon #1 — 漢字: 冊・処・刻・劇・卵・宅 — 文法: Verb られる (〜rareru)<br>leçon #3 — 漢字: 探・操・敬・段・片・疑 — 文法: Verb ることができる (〜ru koto ga dekiru)<br>leçon #5 — 漢字: 難・革・了・偉・偶・刺 — 文法: Verb る ことになる (〜ru koto ni naru) |
| Kimono Girl Naoko | Plus au nord, perdue, demande le chemin de la sortie | — | |
| Jeune homme sur une corniche | Enseigne la technique "secouer les arbres" (Headbutt) | — | leçon #2 — 漢字: 宇・将・展・座・律・拝 — 文法: Verb る ことがある (〜ru koto ga aru)<br>leçon #4 — 漢字: 痛・蒸・蔵・補・退・降 — 文法: Verb ることにする (〜ru koto ni suru) |

**Side quests dans cette zone** : 1 (capturer les 2 fuyards pour le Maître du Charbon d'Ecorcia — *même quête que celle comptée à azalea-town : 1 seule quête au total, à ne pas compter deux fois pour le gate de Whitney ; précisé 2026-07-05, audit 01*)
**Objets à aller chercher dans cette zone** : 0

---

## route-34 — Route 34

**Budget** : 220–255 kanji étudiés | N4 | 30–45 chars
**Grammaire nouvellement disponible à ce palier** : N4 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Camper Todd, Gamin Ian, Picnicker Gina, Pokéfan Brandon, Gamin Samuel | Dresseurs de route | — | combat |
| Policeman Keith | Combat uniquement nocturne (20h–4h), à l'ouest de la pension | — | combat |
| Trio Ace Trainer Jenn/Irene/Kate | Combat groupé après une traversée d'eau | Power Herb | combat |
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
| Beauty Victoria, Samantha ; Lass Carrie, Cathy | Gardiennes avant Whitney | — | leçon #1 — 漢字: 匹・寝・巨・悩・払・挟 — 文法: そんなに～ (sonna ni〜) |
| Bill | Centre Pokémon (absent, parti à Rosalia) puis sa maison | Compagnon rare (Eevee-analogue) | |
| Mr. Game | Game Corner — mini-jeu de kanji contre jetons, tables Kanji Flip + kanji jumeaux (« feature hors-scope » corrigé 2026-07-07, passe de vérification — adapté R8/I-3) | Coin Case | leçon #2 — 漢字: 捕・捜・掃・換・殿・汚 — 文法: ～たらいい (〜tara ii) |
| Gérant du magasin de vélos | Prête une Bicyclette gratuitement, puis l'offre définitivement | Bicyclette | leçon #3 — 漢字: 沈・沸・浮・湾・湿・滴 — 文法: ～たら いかがですか (〜tara ikaga desu ka) |
| Fille évaluatrice d'affection | Maison au nord du Dept Store, évalue le lien avec le compagnon en tête | — | leçon #4 — 漢字: 濯・狭・甘・療・舞・舟 — 文法: ～たら どうですか (〜tara doudesuka) |
| Réceptionniste Tour Radio | Quiz de 5 questions | Radio Card | leçon #5 — 漢字: 荒・薄・迎・遅・違・隅 — 文法: ～たり～たり (〜tari 〜tari) |
| Buena | Studio radio (2F), mot de passe quotidien à deviner | Blue Card | |
| Name Rater | Maison nord de la ville, renomme les surnoms | — | leçon #6 — 漢字: 刀・弓・汽・羊・豆 — 文法: ～だろう (〜darou) |
| Fleuriste (Floria) | Donne le SquirtBottle une fois le badge de Gym vu | SquirtBottle (+ Pots à Baies plus tard, Route 36) | leçon #7 — 漢字: 径・徳・氏・滋・潟 — 文法: ～っていう (〜tte iu) |
| Jeune homme à la grille nord | Quête courrier (objet porté par un oiseau sauvage à capturer) | HP Up | leçon #8 — 漢字: 隊・鹿・士・属・幹 — 文法: ～で (〜de) |
| Black Belt (sous-sol Dept Store) | Bloque l'accès avec ses conteneurs | — | |
| Fille du 5F Dept Store (dimanche uniquement) | Affection élevée requise | TM27 Return | leçon #9 — 漢字: 弁・潔・酸・傷・厳 — 文法: ～でしょう (〜deshou) |
| Poké Maniac Donald/Issac, Super Nerd Eric/Teru | Dresseurs du Tunnel de Doublonville | — | combat |
| Burglar Orson, Duncan | Combats liés à l'arc Team Rocket (Tunnel) | — | combat |
| Sbire (déguisement) | Force le joueur à porter un déguisement Team Rocket | — | |
| "Directeur" = Exécutif Petrel déguisé (5F) | Boss d'étage, sa défaite donne la clé de sous-sol | Basement Key | |
| Vrai Directeur (otage, Tunnel B2F) | Délivré via la Basement Key | Carte-clé (Card Key) | |
| Rival (Silver) | Démasque le déguisement, combat (Silver apparition #5, en réalité Tunnel B2F, revisite tardive ~560+ kanji) | — | combat |
| Kimono Girl Kuni | Tunnel, après la Card Key (revisite tardive) | — | |
| Executive Proton (3F, re-apparition) | Combat, aux côtés de Petrel re-déguisé | — | combat |
| Executive Ariana, puis Executive Archer (sommet) | Combat final, révèle l'objectif : rappeler Giovanni | Plume Arc-en-ciel | combat |
| Team Rocket Grunt, Team Rocket F Grunt, Team Rocket Grunt, Team Rocket Grunt (Tour Radio 2F) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |
| Team Rocket Grunt, Team Rocket Grunt, Scientist Gs Garett, Team Rocket Grunt (Tour Radio 3F) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |
| Scientist Gs Trenton, Team Rocket Grunt (Tour Radio 4F) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |
| Team Rocket Grunt, Team Rocket Grunt, Team Rocket Grunt, Team Rocket F Grunt (Tunnel B2F) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |
| Team Rocket Grunt, Team Rocket Grunt, Team Rocket Grunt (Tunnel entrepôt) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |

**Side quests dans cette zone** : 3 (livraison courrier oiseau ; infiltration de la Radio Tower en plusieurs temps ; résolution Tunnel/Card Key)
**Objets à aller chercher dans cette zone** : 9 (Eevee-analogue, Coin Case, Bicyclette, Radio Card, Blue Card, SquirtBottle, HP Up, TM27 Return, Plume Arc-en-ciel — Carte-clé et Basement Key comptées comme objets de progression)

---

## route-35 — Route 35

**Budget** : 270–310 kanji étudiés | N4/N3 | 35–50 chars
**Grammaire nouvellement disponible à ce palier** : N4/N3 — ～おかげで（gratitude causale）, ～うちに（pendant que）, ～ことはない（pas besoin de）, ～らしい（ouï-dire）, ～せてください（demande de permission）

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Bug Catcher Arnie, Firebreather Walt, Juggler Irwin, Policeman Dirk (nuit), Picnicker Kim, Camper Ivan, Bird Keeper Bryan, Picnicker Brooke & Camper Elliot (paire) | Dresseurs de route — 9 confirmés propres à Route 35 par extraction ROM (2026-07-09), correspond exactement au « neuf dresseurs » du guide ; Krise/Beverly/Jack/William retirés, ils appartiennent en fait à national-park | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## national-park — Parc National

**Budget** : 290–330 kanji étudiés | N4/N3 | 35–50 chars
**Grammaire nouvellement disponible à ce palier** : N4/N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Magnus | Gérant du dôme Pokéathlon, fait visiter les lieux | — | leçon #1 — 漢字: 宣・寸・己・従・我・推 — 文法: A その上 B (A sono ue B)<br>leçon #5 — 漢字: 侵・俊・倫・倹・偏・傍 — 文法: ～かけ (〜kake) |
| Pokéfan Beverly, Lass Krise, Pokéfan William, School Kid Jack | Dresseurs de route — ajoutés 2026-07-09 (extraction ROM), déplacés depuis route-35 où ils étaient mal attribués | — | combat |
| Vieil homme retraité | Record de 998 sauts, défie le joueur de dépasser 1000 | — | leçon #2 — 漢字: 敵・沿・派・激・熟・穀 — 文法: ～うちに (〜uchi ni)<br>leçon #6 — 漢字: 傑・催・僕・僚・充 — 文法: ～かなあ (〜kanaa) |
| Vendeur du stand Aprijuice | Ouest du dôme | Apriblender | leçon #3 — 漢字: 郷・陛・丹・乏・乙・亀 — 文法: ～うとした (〜uto shita)<br>leçon #7 — 漢字: 免・冗・冠・准・凡 — 文法: ～ないで (〜naide) |
| Whitney (réapparition) | Accueil du Pokéathlon | Maillot porté en épreuve | |
| Enseignant (banc sud du parc) | PNJ-professeur, donne un objet de "priorité au tour" | Quick Claw | leçon #4 — 漢字: 享・仰・伐・佳・併・侯 — 文法: ～おかげで (〜okagede) |

**Side quests dans cette zone** : 1 (concours d'insectes mar/jeu/sam — prix Pierre Lune/Everstone/Baie Sitrus)
**Objets à aller chercher dans cette zone** : 3 (Apriblender, Maillot, Quick Claw)

---

## route-36 — Route 36

**Budget** : 310–355 kanji étudiés | N3 | 38–55 chars
**Grammaire nouvellement disponible à ce palier** : N3 — ～てほしいのですが, ～ことになっている（règle établie）, ～しかない, ～くらい～はない, ～ことはない, ～ないで, ～から～にかけて, ～そのために/～かけ (Hanabira : ～てほしいのですが, ～ことになっている, ～うちに, ～おかげで, ～しかない)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Jeune homme près d'un panneau (ouest) | Donne le CS Éclate-Roc (砕), débloqué dès le badge de Falkner *(corrigé 2026-07-06, audit 04, finding 04-A3 : « CS Marteau-Piqueur (力) » était un double contresens — 力 = Force, déjà remis par le Hiker de la Route 42, et « Marteau-Piqueur » n'est le nom d'aucun des 8 CS-Kanji (« 7 » corrigé 2026-07-07, synthèse — 登 réintégré depuis) ; voir PRD § CS-Kanji et guidebook-adapted L572/1177)* | CS Éclate-Roc (砕) | leçon #1 — 漢字: 凶・凹・刈・刑・剖 — 文法: すこしも〜ない (sukoshimo~nai)<br>leçon #3 — 漢字: 厄・又・呉・唐・奉 — 文法: ～せいで (〜sei de)<br>leçon #5 — 漢字: 尼・屯・巡・幻・幾 — 文法: ～そのために (〜sono tame ni) |
| Psychic Mark, School Kid Alan | Dresseurs (cluster frontière Violet City) | — | combat |
| Frère/sœur du jour Arthur (jeudi) | Nord des Ruines Arcaniques | Hard Stone | leçon #2 — 漢字: 剣・升・卑・即・卸 — 文法: ～ずに (〜zu ni)<br>leçon #4 — 漢字: 宴・寛・寡・寮・尚 — 文法: ～せてください (〜sete kudasai) |
| Obstacle Sudowoodo | Bloque la route vers Ecruteak, résolu via l'arrosoir de Floria (Doublonville) | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 2 (CS Éclate-Roc, Hard Stone)

---

## route-37 — Route 37

**Budget** : 330–370 kanji étudiés | N3 | 38–55 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Beauty Callie, Kassandra ; Twins Tori & Til | Dresseurs de route | — | combat |
| Psychic Greg | Dresseur, frontière Rosalia près des Apricorns | — | combat |
| Frère/sœur du jour Sunny (dimanche) | Nord de 3 arbres Apricorn | Magnet | leçon #1 — 漢字: 庶・庸・廷・弊・微 — 文法: ～たびに (〜tabi ni)<br>leçon #2 — 漢字: 徴・徹・怪・恒・恨 — 文法: ～だものだ (〜da mono da)<br>leçon #3 — 漢字: 悟・悦・惰・愉・慕 — 文法: ～ちゃった (〜chatta) |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (Magnet)

---

## ecruteak-city — Rosalia

**Budget** : 350–410 kanji étudiés | N3 | 40–60 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Medium Martha, Edith, Grace, Georgina | Gardiennes avant Morty | — | leçon #1 — 漢字: 慢・慶・憂・憤・懐・戒 — 文法: ～てくれと (〜te kureto)<br>leçon #7 — 漢字: 津・浦・浸・涯・添 — 文法: ～といいなあ (〜to ii naa) |
| Bill | Centre Pokémon, repart pour Doublonville | — | |
| Homme à l'énigme | Bonne réponse → détecteur d'objets ; la pièce contient un livre relatant la légende des 3 esprits | Dowsing MCHN | leçon #2 — 漢字: 把・抑・抗・抵・拐・振 — 文法: ～てごらん (〜te goran) |
| Sbire Rocket | Harcèle Kimono Girl Miki au Théâtre, combat de sauvetage | — | combat |
| Kimono Girl Miki | 3e Kimono Girl rencontrée (sauvée du Sbire) | — | |
| Gentleman (public du Théâtre) | Témoin du sauvetage | HM03 Surf | leçon #3 — 漢字: 挿・掛・掲・揚・援・揺 — 文法: ですから～ (desu kara) |
| Hommes du Poste-frontière | Racontent les légendes locales de Ho-Oh, bloquent l'accès à Tour Jo | — | leçon #4 — 漢字: 搭・携・搾・摂・摘・撤 — 文法: ～てはじめて (〜te hajimete) |
| Homme au nord du Gym | Signale que le gardien-phare d'Oliville est malade | — | leçon #5 — 漢字: 撲・擁・敢・敷・斗・斤 — 文法: ～てほしい (〜te hoshii) |
| Vendeur du Mart | Comptoir du fond | Air Mail, Heal Ball, Net Ball (vente) | leçon #6 — 漢字: 既・暦・殻・没・泰 — 文法: ～ても (〜temo) |
| Rival (Silver) | Devant Tour Jo (Silver apparition #3) | — | |
| Gauntlet des 5 Kimono Girls (post-remise du grand texte d'Elm — « post-Master Ball » adapté 2026-07-06, audit 04) | Combat récapitulatif au Théâtre, "test du lien avec ton équipe" | Clear Bell / Tidal Bell | combat |
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
| Firebreather Ned (1F), Richard (B1F) | Dresseurs de combat | — | combat |
| Rival (Silver) | Embuscade en haut de l'échelle vers B1F (Silver apparition #3, confirmé ici) | — | |

**Side quests dans cette zone** : 0 (événement narratif, quête Rocket optionnelle — Traque des Bêtes Sacrées)
**Objets à aller chercher dans cette zone** : 0

---

## route-38 — Route 38

**Budget** : 400–445 kanji étudiés | N3 | 40–60 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| School Kid Chad, Lass Dana, Beauty Valerie, Sailor Harry, Bird Keeper Toby | Dresseurs de route (répartition exacte Route 38 vs 39 incertaine dans l'OCR source) | — | combat |

Aucun PNJ-leçon nommé spécifique à cette route (dialogue ambiant N3 déjà prévu au PRD, pas de nom sourcé).

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## route-39 — Route 39

**Budget** : 420–460 kanji étudiés | N3 | 42–60 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Sailor Eugene, Pokéfan Derek, Pokéfan Ruth, Psychic Nelson | Dresseurs de route — « Norman » corrigé en « Nelson » 2026-07-09 (extraction ROM, coquille OCR probable) | — | combat |
| Fille (gauche du Miltank-analogue, ferme Moomoo) | Donne le Seal Case une fois le compagnon guéri | Seal Case | leçon #1 — 漢字: 渇・渋・渓・渦・溝・滅 — 文法: ～ないことはない (〜nai koto wa nai)<br>leçon #5 — 漢字: 癖・禍・秀・称・稚・稲 — 文法: ～なんか (〜nanka)<br>leçon #9 — 漢字: 薦・薫・藤・藩・藻 — 文法: ～にしても (〜ni shitemo) |
| Fille (droite, ferme Moomoo) | Donne 3 décorations gratuites | Fire Seal A, Party Seal B, Flora Seal C | leçon #2 — 漢字: 漆・漏・漠・漫・潤・濁 — 文法: ～ないと (〜nai to)<br>leçon #6 — 漢字: 穏・穫・竜・繭・缶 — 文法: ～において (〜ni oite) |
| Fermière (ferme Moomoo) | Donne TM83 Natural Gift | TM83 Natural Gift | leçon #3 — 漢字: 為・焦・爵・猛・猟・猶 — 文法: ～なぜなら (〜nazenara)<br>leçon #7 — 漢字: 罰・舗・芋・芝・茂 — 文法: ～にかわって (〜ni kawatte) |
| Fermier (ferme Moomoo) | Vend une spécialité locale une fois la quête résolue | — (vente) | leçon #4 — 漢字: 猿・獄・獲・玄・疫・癒 — 文法: ～など (〜nado)<br>leçon #8 — 漢字: 茎・菊・菌・華・葬 — 文法: ～にしては (〜ni shite wa) |
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
| Pêcheur (maison nord du Centre Pokémon) | Donne la Bonne Canne | Bonne Canne (Good Rod) | leçon #1 — 漢字: 虎・虐・虚・褐・覇・豪 — 文法: ～まで (〜made)<br>leçon #3 — 漢字: 遍・遣・遷・避・還・那 — 文法: まるで～よう (maru de ~ you)<br>leçon #5 — 漢字: 陥・陪・陰・陵・陶・隆 — 文法: ～みたいだ (〜mitai da) |
| Fille au Centre Pokémon | Demande l'avis du joueur puis défie en combat | — | combat |
| Fille (maison nord du Mart) | Donne 3 décorations aléatoires par jour | Décorations | leçon #2 — 漢字: 迅・逐・逓・逮・遂・遇 — 文法: ～まま (〜mama)<br>leçon #4 — 漢字: 邦・邸・酌・酔・酢・醸 — 文法: ～てみる (〜te miru) |
| Sailor Ernest, Terrell, Huey, Kent ; Gentleman Alfred, Preston ; Lass Connie ; Bird Keeper Denis, Theo | Roster complet du Phare (9 dresseurs, 1F au sommet) | — | combat |
| Jasmine | Veille le gardien malade au Phare ; demande la Potion Secrète d'Irisia ; combat de Gym après guérison | Mineral Badge + TM23 Iron Tail (vrai combat calibré ~600 kanji/N2, voir note zones revisitées) | combat |
| Baoba (appel téléphonique) | Prévient que la réserve d'Irisia est terminée, une fois la potion livrée | — | |
| Sailor Roberto (Phare 5F) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |

**Side quests dans cette zone** : 1 (mini-arc du Phare — Potion Secrète en 3 temps, résolue à Irisia)
**Objets à aller chercher dans cette zone** : 3 (Bonne Canne, décorations, badge/TM de Gym)

---

## route-40 — Route 40

**Budget** : 460–485 kanji étudiés *(était 460–505 — redistribution synthèse 2026-07-07, Route 41 défusionnée porte la suite)* | N3 | 42–65 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Swimmer Simon, Swimmer Elaine, Swimmer Randall, Swimmer Paula | Dresseurs maritimes — Randall/Paula ajoutés 2026-07-09 (extraction ROM), déplacés depuis route-41 où ils étaient mal attribués | — | combat |
| Frère/sœur du jour Monica (lundi, plage) | PNJ calendaire | Sharp Beak | |
| Homme (Maison du Photographe, nord d'Irisia) | Révèle que le photographe itinérant récurrent est de sa famille | — | |
| Homme (ouest du Centre Pokémon d'Irisia) | Raconte la légende des 4 îles créées par le gardien légendaire des tourbillons | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (Sharp Beak)

---

## route-41 — Route 41

**Budget** : 480–510 kanji étudiés (défusionnée de Route 40, 2026-07-06, audit 04) | N3 | 42–65 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Swimmer Denise, Kara, Ronald, Berke, Kaylee, Matthew, Charlie, George, Wendy, Susie (10 nageurs confirmés par extraction ROM 2026-07-09 ; Paula/Randall retirés, ils appartiennent à route-40) | Dresseurs maritimes | — | combat |

Les nageurs de Route 41 « ont des tas d'histoires à raconter » sur le gardien légendaire des Îles
Tourbillon — réservoir de lore orale, bon matériau de PNJ-conteurs en mer.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## whirl-islands — Îles Tourbillon

**Budget** : ~560 kanji étudiés (plateau, accès post-渦/Repaire de Mékanos — zéro croissance requise) | N2 | 45–70 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

Aucun PNJ nommé confirmé — donjon optionnel d'exploration pure, seul vrai terrain d'usage du
CS-Kanji 渦 (Tourbillon).

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## cianwood-city — Irisia

**Budget** : 480–520 kanji étudiés | N3 | 45–65 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Pharmacie | Remet la Potion Secrète au 1er passage (pour Jasmine) | Potion Secrète | leçon #1 — 漢字: 随・隔・隠・隣・隷・雄 — 文法: ～ようになった (〜you ni natta)<br>leçon #4 — 漢字: 剝・勾・匂・宛・巾・彙 — 文法: ～られた (〜rareta) |
| Jeune homme (sud du Gym) | Confie temporairement un compagnon (Shuckle-analogue) ; révèle le passage de Silver | Compagnon temporaire (Shuckle-analogue) | leçon #2 — 漢字: 雌・離・須・顕・飢・飾 — 文法: ～ように言う (〜you ni iu)<br>leçon #5 — 漢字: 慄・戚・拶・挨・挫・毀 — 文法: ～ている (〜te iru) |
| Eusine | Défie le joueur après l'apparition fugace d'un esprit-kanji légendaire | — | |
| Homme (Centre Pokémon) | Explique l'entraînement de Chuck sous une chute d'eau | — | leçon #3 — 漢字: 鬼・俺・傲・僅・冥・刹 — 文法: ～らしい (〜rashii) |
| Black Belt Nob, Yoshi, Lung, Lao | Gardiens avant Chuck | — | combat |
| Femme de Chuck | Remet une récompense, commente la défaite de son mari avec tendresse | HM Vol (Fly) | |

**Side quests dans cette zone** : 0 (le mini-arc Phare/Potion Secrète est comptabilisé côté olivine-city)
**Objets à aller chercher dans cette zone** : 2 (Potion Secrète, HM Vol)

---

## route-47-48-cliff-cave — Routes 47/48 / Cliff Cave

**Budget** : 480–520 kanji étudiés (plateau, zéro croissance requise) | N3 | 45–65 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Double Team Thom & Kae, Camper Grant, Young Couple Duff & Eda, Hiker Devin | Dresseurs — roster trouvé par extraction ROM (2026-07-09), corrige « aucun dresseur recensé sur ce tronçon » | — | combat |

Approche menant à la porte de la Safari Zone (voir section safari-zone pour le détail de la
mécanique adaptée).

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## safari-zone — Safari Zone

**Budget** : 480–520 kanji étudiés (plateau, zéro croissance requise) | N3 | 45–65 chars
**Grammaire nouvellement disponible à ce palier** : N3 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Le gardien de réserve (orig. Baoba) | Rencontré Route 39, rappelle par téléphone, revu à l'entrée de la Safari Zone (fil complet, Pokégear-Téléphone) | — | |

**Mécanique adaptée (design 2026-07-07, synthèse)** : au lieu de Pokémon, on y « attrape » des
contenus de lecture à collectionner (mangas, textes) — objets-lecture apparaissant chaque jour à
des emplacements semi-aléatoires, ~3 prises par visite quotidienne (économie de rareté du Safari
original transposée). Les prises rejoignent la collection du Sac (règle P-15 : jamais des lignes de
`texts`), doublons échangeables au Global Terminal.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## route-42 — Route 42

**Budget** : 500–535 kanji étudiés | N3/N2 | 45–65 chars
**Grammaire nouvellement disponible à ce palier** : N3/N2 — ～はずだ（devoir logiquement être le cas）, ～にすぎない（ce n'est que）, ～ものだ（nature des choses）, ～わけだ（c'est donc que）, ～にしたがって（à mesure que）

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Fisherman Tully, Hiker Benjamin, Poké Maniac Shane | Dresseurs de route | — | combat |
| Hiker anonyme | Sortant de Mont Mortier, bouscule le joueur et s'excuse | CS Force (力) | leçon #1 — 漢字: 氾・沃・淫・爪・牙 — 文法: A あるいは B (A aruiwa B)<br>leçon #2 — 漢字: 瓦・痕・痩・瘍・稽 — 文法: A。おまけに B。(~omake ni)<br>leçon #3 — 漢字: 羞・臼・葛・蓋・蔑 — 文法: A。さて B。(A. Sate B.) |
| Eusine | Réapparaît côté est (après Coupe), nouvel aperçu de l'esprit légendaire | — | |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (CS Force)

---

## mt-mortar — Mont Mortier

**Budget** : 510–545 kanji étudiés | N3/N2 | 45–68 chars
**Grammaire nouvellement disponible à ce palier** : N3/N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Super Nerd Hugh (2F), Markus (1F fond) ; Poké Maniac Harrison (1F fond) | Dresseurs internes — « Marcus » corrigé en « Markus » 2026-07-09 (extraction ROM, coquille OCR probable) | — | combat |
| Black Belt Kiyo ("Karate King") | Médite tout au fond (B1F, accessible via traversée d'eau) ; combat-épreuve, offre un compagnon en cas de victoire | Compagnon (récompense narrative) | combat |

**Side quests dans cette zone** : 1 — mini-donjon dōjō du Karate King Kiyo, réintégré v1 (2026-07-06, décision « aucune v2 » ; chiffré 2026-07-07, synthèse : intérieur, hérite de la fenêtre mt-mortar 510–545 ; voir `content/side-content-inventory.md` § E1)
**Objets à aller chercher dans cette zone** : 1 (compagnon offert par Kiyo)

---

## mahogany-town — Acajou Ville

**Budget** : 530–560 kanji étudiés | N3/N2 | 45–70 chars
**Grammaire nouvellement disponible à ce palier** : N3/N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Vendeur RageCandyBar | Bloque la route est, vend la spécialité locale ; laisse passer une fois la Team Rocket vaincue | — (vente) | leçon #1 — 漢字: 蔽・貌・遡・隙・韓 — 文法: A。そこで B。(~sokode) |
| Vendeur du magasin de souvenirs | "Type louche", détourne le regard du bruit suspect au sous-sol ; remplacé après la chute du QG | — (vente) | leçon #2 — 漢字: 頃・頰・顎・餅・鬱 — 文法: A。それがB。(~sorega) |
| Homme devant le Gym | Évoque "l'homme à la cape noire" (Lance) enquêtant sur le signal brouillé | — | leçon #3 — 漢字: 七・三・上・下・中 — 文法: A。それで B。 (~sore de) |
| PNJ à la grille de Route 43 | Mentionne que Mr. Pokémon cherche une Écaille Rouge | — | leçon #4 — 漢字: 九・五・休・六・出 — 文法: A。それでも B。(~sore demo) |
| Professeur Elm (appel) | Inquiet des émissions radio, juste après le 7e badge | — | |
| Skier Jill, Diana ; Boarder Deandre, Gerardo, Patton | Gardiens avant Pryce | — | combat |
| Scientist Gregg | Garde le PC qui coupe le système d'alarme du QG (B1F) | — | leçon #5 — 漢字: 千・右・名・天・学 — 文法: A。それなのに B。(~sorenanoni) |
| Scientist Ross, Mitch | Donnent les 2 mots de passe (B3F) | — | |
| Rival (Silver) | QG Rocket B2F, déjà vaincu par Lance (Silver apparition #4, cameo — pas un combat) | — | |
| Lance | Soigne l'équipe au B2F, affronte Ariana+Sbire en double avec le joueur (transmetteur) | Objet de traversée d'eau (Whirlpool-équivalent) | |
| Executive Petrel (déguisé en "Boss") | Salle du chef, retournement narratif | — | |
| Executive Ariana | Combat en double, aux côtés de Lance | — | combat |
| Skier/Boarder (Gym) | Récompense finale du Gym Pryce | Glacier Badge + TM07 Hail | |
| Team Rocket Grunt (QG Rocket B1F) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |
| Team Rocket Grunt, Team Rocket Grunt, Team Rocket Grunt (QG Rocket B2F) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |
| Team Rocket Grunt, Team Rocket F Grunt (QG Rocket B3F) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |

**Side quests dans cette zone** : 0 (arc principal scripté)
**Objets à aller chercher dans cette zone** : 2 (spécialité locale en vente, objet de traversée d'eau via Lance)

---

## route-43 — Route 43

**Budget** : 535–565 kanji étudiés | N3/N2 | 45–70 chars
**Grammaire nouvellement disponible à ce palier** : N3/N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| PNJ à la grille de Route 43 | Mentionne que Mr. Pokémon cherche une Écaille Rouge | — | leçon #1 — 漢字: 左・本・男・白・花 — 文法: A。ということは B。 (A. To iu koto wa B.) |
| Poste-frontière Team Rocket (milieu de route) | Rançonne le passage (1000 ¥) tant que le QG Rocket d'Acajou n'est pas tombé ; redevient un poste normal ensuite | TM36 Sludge Bomb (après la chute du QG) | |
| Poké Maniac Ron, Poké Maniac Beckett, Poké Maniac Brent | Dresseurs — « Ben » corrigé en « Beckett » 2026-07-09 (extraction ROM, coquille OCR probable) | — | combat |
| Picnicker Tiffany | Dresseuse | — | |
| Camper Spencer | Dresseur | — | combat |
| Fisherman Marvin | Dresseur | — | combat |

L'Apricorn Noir originellement rattaché à cette route a été réattribué au Lac Colère (voir section
Apricorns) — ne pas le dupliquer ici.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (TM36 Sludge Bomb)

---

## lake-of-rage — Lac Colère

**Budget** : 540–570 kanji étudiés | N3/N2 | 48–70 chars
**Grammaire nouvellement disponible à ce palier** : N3/N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Poste-frontière Team Rocket (Route 43) | Rançonne pour passer ; redevient normal après la chute du QG | TM36 Sludge Bomb (après) | leçon #1 — 漢字: 見・足・万・今・会 — 文法: A。もっとも B。(Motto mo ~) |
| Poké Maniac Ron/Ben/Brent, Picnicker Tiffany, Camper Spencer, Fisherman Marvin | Dresseurs (Route 43) | — | combat |
| Fishing Guru | Concours du plus gros poisson-compagnon | Ether (record battu) | |
| Frère/sœur du jour Wesley (mercredi, post-QG) | PNJ calendaire | Black Belt (objet à équiper) | |
| Fisherman Raymond, Andre ; Ace Trainer Alton, Lois | Dresseurs post-événement Gyarados / mercredis — « Aaron » corrigé en « Alton » 2026-07-09 (extraction ROM, coquille OCR probable) | — | combat |
| Lance | Se présente au bord du lac après le combat, recrute le joueur pour Acajou Ville | — | combat |

**Side quests dans cette zone** : 1 (concours du plus gros poisson-compagnon)
**Objets à aller chercher dans cette zone** : 3 (TM36 Sludge Bomb, Ether, Black Belt)

---

## route-44 — Route 44

**Budget** : 555–590 kanji étudiés | N2 | 50–72 chars
**Grammaire nouvellement disponible à ce palier** : N2 — ～ものの（bien que）, ～ことなく（sans jamais）, ～にもかかわらず（malgré）, ～をはじめ（en commençant par）, ～に過ぎない, ～をもとに（à partir de）, ～だけでなく（non seulement）, ～に従って（à mesure que） (Hanabira : ～ものの, ～にもかかわらず, ～をはじめ, ～ことなく, ～に従って)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Poké Maniac Zach, Bird Keeper Vance, Psychic Phil, Fisherman Edgar, Fisherman Wilton, Ace Trainer Cybil, Allen | Dresseurs de route | — | combat |

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
| Tuteur Ultime | Enseigne la "capacité ultime" à la forme finale du starter du joueur | — | leçon #1 — 漢字: 分・半・南・友・古・外 — 文法: Noun につき (〜ni tsuki)<br>leçon #8 — 漢字: 弱・強・思・明・春・曜 — 文法: Noun を めぐる Noun (Noun o meguru Noun)<br>leçon #15 — 漢字: 以・好・料・民・産・験 — 文法: ～うちに (〜uchi ni) |
| Grand-mère Wilma | Enseigne la capacité Dragon la plus puissante à un compagnon-Dragon lié au joueur | — | leçon #2 — 漢字: 多・少・新・書・来・東 — 文法: Noun にて (Noun nite)<br>leçon #9 — 漢字: 朝・楽・歌・海・秋・紙 — 文法: Noun を もとに (Noun o moto ni) |
| Maniaque des capacités | Contre une Écaille de Cœur, réapprend une capacité oubliée | — | leçon #3 — 漢字: 社・聞・言・間・電・安 — 文法: Noun の ことだから (Noun no koto dakara)<br>leçon #10 — 漢字: 自・走・近・頭・主・事 — 文法: Noun を もとにして (Noun wo moto ni shite) |
| Effaceur de capacités | Fait oublier n'importe quelle capacité, y compris permanentes | — | leçon #4 — 漢字: 飲・字・早・村・林・正 — 文法: Noun を はじめ (Noun wo hajime)<br>leçon #11 — 漢字: 仕・勉・去・品・問・急 — 文法: Verb ことなく (~kotonaku) |
| Fille de la maison nord | Donne un Ruban d'Effort si le compagnon en tête est assez endurci | Ruban d'Effort | leçon #5 — 漢字: 犬・赤・青・音・元・兄 — 文法: Noun を はじめとして (Noun wo hajime to shite)<br>leçon #12 — 漢字: 所・旅・族・有・服・洋 — 文法: Verb ないことには Verb ない (~nai koto ni wa ~ nai) |
| Garçon local | Explique que les Dompteurs de Dragons sont tous nés à Ebènelle | — | leçon #6 — 漢字: 台・合・同・回・地・場 — 文法: Noun を はじめとする Noun (Noun o hajime to suru Noun)<br>leçon #13 — 漢字: 物・県・着・終・者・転 — 文法: ～あげく (~ageku) |
| Frère/sœur du jour Santos (samedi) | PNJ calendaire | Soft Sand | leçon #7 — 漢字: 声・売・太・市・引・弟 — 文法: Noun を めぐって (Noun wo megutte)<br>leçon #14 — 漢字: 軽・銀・開・集・館・不 — 文法: ～あまり (〜amari) |
| Homme bloquant l'Antre du Dragon | Refuse l'entrée tant que le badge de Gym n'est pas en poche | — | |
| Ace Trainer Mike, Fran, Cody, Lola, Paulo | Gardiens avant Clair (5, le plus grand roster de gardiens du jeu) | — | combat |
| Clair | Bat le joueur au Gym mais refuse explicitement de remettre le badge, envoie à l'Antre du Dragon | 印 n°8 — via l'Antre, pas directement au Gym | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 2 (Ruban d'Effort, Soft Sand)

---

## dragons-den — Antre du Dragon

**Budget** : 640–720 kanji étudiés | N2/N1 | 55–90 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 — ～だけに（précisément parce que）, ～ものだ（littéraire）, ～にほかならない（n'est rien d'autre que）, ～わけにはいかない（ne peut pas se permettre de） — structures N1 réservées aux dialogues de boss à ce stade, pas aux PNJ ambiants

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Ace Trainer Kobe, Piper ; Twins Clea & Gil | Dresseurs (B1F, avant le sanctuaire) | — | combat |
| Le Maître (Ancien) | Quiz d'empathie en 5 questions, condition réelle du 印 n°8 ; révèle être le grand-père de Clair/Lance | Cadeau de "successeur" | leçon #1 — 漢字: 堂・洗・玉・石・貝・交 — 文法: ～たところ (〜ta tokoro)<br>leçon #3 — 漢字: 科・算・細・船・雪・雲 — 文法: ～だらけ (〜darake)<br>leçon #5 — 漢字: 反・取・受・号・向・君 — 文法: ～つつ (〜tsutsu)<br>leçon #7 — 漢字: 岸・島・州・幸・庫・庭 — 文法: ～っぱなし (〜ppanashi)<br>leçon #9 — 漢字: 期・根・様・橋・次・歯 — 文法: ～ていられない (〜te irarenai) |
| "Les autres vieillards du Sanctuaire" (non nommés) | PNJ ambiants, corroborent la lignée Clair/Lance/Maître | — | leçon #2 — 漢字: 公・内・寺・星・番・直 — 文法: ～たとたん (〜ta totan)<br>leçon #4 — 漢字: 鳴・両・予・全・具・勝 — 文法: ～っこない (〜kkonai)<br>leçon #6 — 漢字: 和・商・央・委・守・対 — 文法: ～つつある (〜tsutsu aru)<br>leçon #8 — 漢字: 式・悲・感・放・昔・曲 — 文法: ～っぽい (〜ppoi)<br>leçon #10 — 漢字: 氷・波・球・由・申・畑 — 文法: ～てかなわない (〜te kanawanai) |
| Clair | Fait irruption, surprise que le joueur ait réussi, remet le 印 final | 印 n°8 | |

**Side quests dans cette zone** : 1 (quiz du Maître — les 5 questions elles-mêmes ne sont pas transcrites par la source, à écrire entièrement par l'équipe)
**Objets à aller chercher dans cette zone** : 1 (cadeau de successeur / trophée de texte légendaire)

---

## route-45 — Route 45

**Budget** : 680–740 kanji étudiés | N2 | 50–75 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Black Belt Kenji, Hiker Timothy/Michael/Erik/Parry, Ace Trainer Ryan/Kelly | Dresseurs de route — 7 confirmés propres à Route 45 (extraction ROM 2026-07-09, résout le « 10 au total » : Bailey/Ted/Erin déplacés vers route-46, Erik reste bien ici) | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## dark-cave — Grotte Sombre

**Budget** : 700–760 kanji étudiés | N2 | 50–75 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Homme du fond (côté Ebènelle) | Accessible seulement après l'Antre du Dragon | BlackGlasses | leçon #1 — 漢字: 登・相・礼・祭・第・筆 — 文法: ～ないことはない (〜nai koto wa nai)<br>leçon #2 — 漢字: 緑・美・育・血・表・配 — 文法: ～ないこともない (〜nai koto mo nai)<br>leçon #3 — 漢字: 付・令・位・例・健・共 — 文法: ～ないではいられない (〜nai de wa irarenai)<br>leçon #4 — 漢字: 初・加・労・包・卒・協 — 文法: ～ながら (〜nagara)<br>leçon #5 — 漢字: 司・各・城・塩・夫・季 — 文法: ～にあたり (〜ni atari)<br>leçon #6 — 漢字: 差・必・折・改・昨 — 文法: ～において (〜ni oite)<br>leçon #7 — 漢字: 景・望・未・末・札 — 文法: ～にかかわらず (〜ni kakawarazu) |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (BlackGlasses)

---

## route-46 — Route 46

**Budget** : 700–760 kanji étudiés (plateau, zéro croissance requise) | N2 | 50–75 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Hiker Bailey, Camper Ted, Picnicker Erin | Dresseurs de route — corrigé 2026-07-09 (extraction ROM) : Erik (précédemment attribué ici) appartient en fait à Route 45 ; Bailey/Ted/Erin sont les 3 vrais dresseurs de Route 46, mal comptés dans le « 10 au total » de route-45 | — | combat |

Connecteur bloqué par un rebord à sens unique côté Route 29 (accès différé, voir section route-29).

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## route-26 — Route 26

**Budget** : 740–800 kanji étudiés | N2 | 52–78 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Ace Trainer Gaven, Jamie, Jake, Joyce ; Fisherman Scott ; Psychic Vernon | Dresseurs de route | — | combat |
| Maison des Frères/sœurs du jour | Carnet-index listant les 7 emplacements/jours (hub du fil PNJ récurrent) | — | leçon #1 — 漢字: 材・束・果・栄・械・極 — 文法: ～に基づいて (〜ni motozuite)<br>leçon #3 — 漢字: 管・節・約・要・軍・輪 — 文法: ～に応えて (〜ni kotaete)<br>leçon #5 — 漢字: 飛・香・件・余・像・再 — 文法: ～に決まっている (〜ni kimatte iru)<br>leçon #7 — 漢字: 圧・在・均・型・基 — 文法: ～に過ぎない (〜ni suginai) |
| Fille de la maison au nord | Soigne gratuitement l'équipe du joueur | — | leçon #2 — 漢字: 機・泣・浴・漁・焼・笑 — 文法: ～に対して (〜ni taishite)<br>leçon #4 — 漢字: 辺・連・録・関・順・願 — 文法: ～に応じて (〜ni oujite)<br>leçon #6 — 漢字: 勢・史・告・因・団 — 文法: ～に沿って (〜ni sotte) |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## route-27 — Route 27

**Budget** : 760–830 kanji étudiés | N2 | 52–78 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Ace Trainer Megan, Blake, Reena, Brian ; Bird Keeper Jose ; Psychic Eli | Dresseurs de route (Chutes de Tohjo) | — | combat |
| Homme à la Porte de Réception de la Ligue | Bloque l'est (Kanto) et l'ouest (Mont Gris) ; seul le nord (Route Victoire) est ouvert à ce stade | — | |
| Vieille dame (sortie est des Chutes de Tohjo) | Donne TM37 Sandstorm si affection élevée du compagnon en tête | TM37 Sandstorm | leçon #1 — 漢字: 境・夢・妻・婦・容・布 — 文法: ～はまだしも (〜wa mada shimo)<br>leçon #2 — 漢字: 常・張・志・応・性・支 — 文法: ～はもとより (〜wa moto yori)<br>leçon #3 — 漢字: 救・断・旧・易・暴・条 — 文法: ～は抜きにして (〜wa nuki ni shite)<br>leçon #4 — 漢字: 検・構・武・歴・永・液 — 文法: ～べきではない (〜beki dewa nai)<br>leçon #5 — 漢字: 燃・率・留・築・経・絶 — 文法: ～まい (〜mai) |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (TM37 Sandstorm)

---

## indigo-plateau-antichambre — Antichambre de la Ligue

**Budget** : 800–870 kanji étudiés | N2/N1 | 58–85 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (voir dragons-den ci-dessus)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Rival (Silver) | Dernier combat avant le Plateau (Silver apparition #6) ; a "vidé" la route de tout dresseur | — | combat |
| Vieil homme avec compagnon-télépathe (hall d'entrée) | PNJ ambiant, blague que son compagnon "ne pourra pas te ramener à la maison" | — | leçon #1 — 漢字: 綿・総・編・罪・職・航 — 文法: ～も～ば～も～ (〜mo〜ba〜mo〜)<br>leçon #2 — 漢字: 術・製・解・輸・迷・鉱 — 文法: ～も同然だ (〜mo douzen da)<br>leçon #3 — 漢字: 防・乳・優・券・割・勤 — 文法: ～やら～やら (〜yara〜yara)<br>leçon #4 — 漢字: 危・収・呼・善・困・域 — 文法: ～ようがない (〜you ga nai)<br>leçon #5 — 漢字: 存・専・尊・巻・干・幼 — 文法: ～よりほかない (〜yori hoka nai)<br>leçon #6 — 漢字: 忘・批・拡・晩・暖 — 文法: ～わけがない (〜wake ga nai)<br>leçon #7 — 漢字: 暮・机・枚・棒・権 — 文法: ～わけだ (〜wake da) |
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
| Will | Membre du Conseil 4, "Dresseur de type Psychique" — aucune personnalité officielle sourcée, liberté totale du studio | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## indigo-plateau-koga — Salle de Koga

**Budget** : 870–900 kanji étudiés | N2/N1 | 60–100 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Koga | Membre du Conseil 4, "Dresseur de type Poison" — aucune personnalité officielle sourcée | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## indigo-plateau-bruno — Salle de Bruno

**Budget** : 870–900 kanji étudiés | N2/N1 | 60–100 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Bruno | Membre du Conseil 4, "Dresseur de type Combat" — aucune personnalité officielle sourcée | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## indigo-plateau-karen — Salle de Karen

**Budget** : 870–900 kanji étudiés | N2/N1 | 65–110 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Karen | Membre du Conseil 4, "Dresseur de type Ténèbres" — aucune personnalité officielle sourcée | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## indigo-plateau-lance — Trône de Lance

**Budget** : 870–900 kanji étudiés | N2/N1 | 65–110 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Lance (Champion) | "Dresseur de type Dragon" — aucune personnalité officielle sourcée ; clôture le gauntlet Elite Four | Dragon Scroll (cérémonie) | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (Dragon Scroll)

---

## vermilion-city — Vermeille City

**Budget** : 900–1050 kanji étudiés | N2 | 65–110 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé — voir indigo-plateau-will pour la liste complète)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Grand-père paniqué (SS Aqua, arrivée) | Sa petite-fille a disparu du navire, retrouvée au sous-sol | Manteau de Métal | leçon #1 — 漢字: 欲・泉・灰・看・紅・純 — 文法: ～上は (～ue wa)<br>leçon #5 — 漢字: 双・叫・召・吹・咲・坊 — 文法: ～反面 (〜hanmen)<br>leçon #9 — 漢字: 昇・普・更・替・欧・歳 — 文法: ～末 (～sue)<br>leçon #13 — 漢字: 被・軟・辛・込・逃・鈍 — 文法: ～気味 (〜gimi)<br>leçon #17 — 漢字: 熊・牧・票・縄・芽・街 — 文法: A うと B うと (A uto B uto)<br>leçon #21 — 漢字: 仁・俳・后・奮・孝・宗 — 文法: A であれ B であれ (A deare B deare)<br>leçon #25 — 漢字: 絹・縦・縮・聖・腸・臨 — 文法: A にせよ B にせよ (A ni seyo B ni seyo)<br>leçon #29 — 漢字: 刃・励・劾・勧・匠・及 — 文法: Noun1 も Noun1 なら、Noun2 も Noun2 だ (A mo A nara, B mo B da) |
| Marin du mess | Cherche un collègue endormi dans une cabine (déclenche un combat) | — | combat |
| Capitaine | Héberge la petite-fille retrouvée, distribue des Plaques collectionnables | Plaques (selon jour de la semaine) | leçon #2 — 漢字: 翌・胃・背・胸・脳・腹 — 文法: ～以上 (〜ijou)<br>leçon #6 — 漢字: 塔・塗・壁・奥・姓・娘 — 文法: ～向け (〜muke)<br>leçon #10 — 漢字: 泥・涼・渡・煙・燥・珍 — 文法: ～次第 (〜shidai)<br>leçon #14 — 漢字: 鋭・雇・震・靴・里・丁 — 文法: ～限り (〜kagiri)<br>leçon #18 — 漢字: 鏡・養・句・墓・態・桜 — 文法: A かたわら B (A katawara B)<br>leçon #22 — 漢字: 密・射・就・尺・幕・憲 — 文法: A というか B というか (A to iu ka B to iu ka)<br>leçon #26 — 漢字: 至・裁・銭・丈・且・丘 — 文法: A につけ B につけ (A ni tsuke B ni tsuke)<br>leçon #30 — 漢字: 叔・吉・吐・呂・呈・哀 — 文法: Noun + あっての + Noun (A atte no B) |
| Président du Club des Fans | Récompense qui écoute son histoire jusqu'au bout | Super Bonbon | leçon #3 — 漢字: 臓・裏・針・閉・骨・与 — 文法: ～以来 (〜irai)<br>leçon #7 — 漢字: 婚・封・幅・床・彼・御 — 文法: ～恐れがある (〜osore ga aru)<br>leçon #11 — 漢字: 環・畜・畳・疲・祈・粒 — 文法: ～次第で (〜shidai de)<br>leçon #15 — 漢字: 帳・井・倉・功・博・唱 — 文法: ～際に (〜sai ni)<br>leçon #19 — 漢字: 災・益・眼・紀・素・統 — 文法: A かれ B かれ (A kare B kare)<br>leçon #23 — 漢字: 朗・染・模・樹・源・班 — 文法: A とも B とも (A tomo B tomo)<br>leçon #27 — 漢字: 亜・仙・企・侮・俗・俸 — 文法: A のやら B のやら (A no yara B no yara) |
| Homme du comptoir du Club des Fans | Détient l'objet perdu de Copycat, à livrer à Safranville | Poupée de Copycat | leçon #4 — 漢字: 互・介・依・傾・募・占 — 文法: ～切る (〜kiru)<br>leçon #8 — 漢字: 忙・恋・恐・恥・恵・戻 — 文法: ～折には (〜ori ni wa)<br>leçon #12 — 漢字: 肌・肩・肯・腕・般・袋 — 文法: ～次第です (〜shidai desu)<br>leçon #16 — 漢字: 奈・媛・挙・旗・梅・梨 — 文法: A うが B うが (A uga B uga)<br>leçon #20 — 漢字: 織・義・肥・脈・興・衛 — 文法: A だの B だの (A dano B dano)<br>leçon #24 — 漢字: 盛・穴・筋・策・糖・系 — 文法: A にしろ B にしろ (A nishiro B nishiro)<br>leçon #28 — 漢字: 偽・傘・兼・冒・凝・凸 — 文法: Noun1 が Noun1 なら、 Noun2 も Noun2 だ (A ga A nara, B mo B da) |
| Steven (1ère apparition, cameo) | Intercepte le joueur, intrigué par une espèce hors-région | — | |
| Eusine (cameo) | Aperçu sur la jetée en pleine chasse à Suicune | — | |
| Gentleman Gregory, Guitarist Vincent, Juggler Horton | Gardiens avant Lt. Surge (3 confirmés) | — | combat |
| Lt. Surge | 師範 Électrik, 9e badge | — | combat |
| Gentleman Edward, Burglar Corey (SS Aqua 1F SE) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |
| Hiker Noland, Ace Trainer Shaye, Ace Trainer Carol, Poké Maniac Morgan (SS Aqua 1F SO) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |
| Firebreather Lyle, Beauty Cassie, Guitarist Clyde, Bug Catcher Ken (SS Aqua 1F NE) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |
| Pokéfan Colin, Twins Meg & Peg, Super Nerd Shawn, Psychic Rodney, Pokefan Georgia, Pokéfan Jeremy (SS Aqua 1F NO) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |
| Picnicker Debra, Sailor Jeff, Juggler Fritz, Fisherman Jonah, Sailor Garrett, Black Belt Wai, Sailor Kenneth, School Kid Nate, School Kid Ricky, Enseignante Shirley (SS Aqua B1F) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |

**Side quests dans cette zone** : 1 (poupée de Copycat, résolue à Safranville)
**Objets à aller chercher dans cette zone** : 3 (Manteau de Métal, Super Bonbon, Plaques)

---

## route-6-kanto — Route 6 (Kanto)

**Budget** : 1050–1060 kanji étudiés | N2 | 65–110 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Twins Day & Dani, Picnicker Selina, Camper Virgil | Dresseurs confirmés (Route 5/Route 6/Passage Souterrain) — « Amy » corrigé en « Day » 2026-07-09 (extraction ROM, coquille OCR probable) | — | combat |
| Vieille dame (Route 5) | Pressent un danger | Talisman Anti-Combat | leçon #1 — 漢字: 唆・唇・唯・啓・喚 — 文法: Noun といい Noun といい (〜to ii〜to ii) |
| PNJ du Passage Souterrain | Échange une spécialité locale (RageCandyBar) contre une CT | CT | leçon #2 — 漢字: 喝・喪・嘆・嘱・噴 — 文法: Noun という Noun (~to iu~) |

🔒 Passage fermé tant que la Centrale Électrique n'est pas relancée.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 2 (Talisman Anti-Combat, CT)

---

## saffron-city — Safranville

**Budget** : 1060–1200 kanji étudiés | N2 | 65–110 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Mr. Psychic | Donne une CT gratuitement | CT | leçon #1 — 漢字: 嚇・囚・坑・垣・培・堅 — 文法: Noun というところだ (Noun to iu tokoro da)<br>leçon #7 — 漢字: 婿・嫁・嫡・嬢・孔・孤 — 文法: Noun + ともあろう + Noun (~tomoarou~)<br>leçon #13 — 漢字: 慨・懇・懲・懸・戯・房 — 文法: Noun なしには～ない (Noun nashi ni wa ~nai)<br>leçon #19 — 漢字: 朽・杉・析・枠・枢・某 — 文法: Noun にあっては (Noun ni atte ha) |
| Vigile du hall Silph Co. | Explique l'ascenseur en panne | Amélioration (objet-souvenir) | leçon #2 — 漢字: 堕・塀・塁・塊・塑・塚 — 文法: Noun + というもの (~ to iu mono)<br>leçon #8 — 漢字: 尉・尋・尾・尿・履・峠 — 文法: Noun ともなると (〜to mo naru to)<br>leçon #14 — 漢字: 扇・扉・披・拒・拠・拳 — 文法: Noun ならいざ知らず (~nara izashirazu)<br>leçon #20 — 漢字: 柳・核・栽・桃・桑・桟 — 文法: Noun にあるまじき Noun (Noun ni aru majiki Noun) |
| Copycat | Imite instantanément le joueur à la rencontre (flavor) | — | leçon #3 — 漢字: 塾・墜・墳・墾・壇・壊 — 文法: Noun といったところだ (Noun to itta tokoro da)<br>leçon #9 — 漢字: 峡・峰・崩・嵐・巧・帆 — 文法: Noun ともなれば (〜to mo nareba)<br>leçon #15 — 漢字: 拷・挑・掌・排・撃・擬 — 文法: Noun + ならでは (~nara de wa)<br>leçon #21 — 漢字: 棄・棋・棚・棺・椎 — 文法: Noun にして (Noun ni shite) |
| Fille de la gare de Safranville | Explique qu'un Pass Train Aimant est requis | — | leçon #4 — 漢字: 壌・壮・壱・契・奔・奨 — 文法: Noun といわず Noun といわず (A to iwazu B to iwazu)<br>leçon #10 — 漢字: 帝・帥・幣・幽・廃・弐 — 文法: Noun と相まって (~ to aimatte)<br>leçon #16 — 漢字: 攻・敏・斉・斥・施・旋 — 文法: Noun なり Noun なり (A nari B nari)<br>leçon #22 — 漢字: 楼・概・欄・欺・款 — 文法: Noun にして初めて (Noun nishite hajimete) |
| Karatéka du dojo | Absent — parti s'entraîner au Mont Mortier, Johto (callback direct) | — | leçon #5 — 漢字: 奪・奴・如・妃・妄・妊 — 文法: Noun + ときたら (〜tokitara)<br>leçon #11 — 漢字: 弔・弥・弦・弧・忌・悔 — 文法: Noun なくして～はない (Noun nakushite ~ wa nai)<br>leçon #17 — 漢字: 旦・旨・旬・旺・昆・是 — 文法: Noun なりとも (~nari tomo)<br>leçon #23 — 漢字: 歓・殴・汁・江・浄 — 文法: Noun にすら (〜ni sura) |
| Copycat (résolution) | Poupée rapportée depuis Vermeille → donne le Pass Train Aimant | Pass Train Aimant | leçon #6 — 漢字: 妥・妨・姫・威・娠・娯 — 文法: Noun とは比べものにならない (~to wa kurabemono ni naranai)<br>leçon #12 — 漢字: 悠・惑・惨・愚・慈・慌 — 文法: Noun なしでは～ない (Noun nashi de wa ~nai)<br>leçon #18 — 漢字: 晶・暁・暇・曹・朕・朴 — 文法: Noun に Noun を重ねて (A ni B wo kasanete)<br>leçon #24 — 漢字: 浪・滝・滞・炉・炊 — 文法: Noun にとどまらず～も (~ ni todomarazu ~ mo) |
| Steven (Silph Co., 1ère rencontre) | Répond à une question pour recevoir un compagnon-cadeau | Compagnon-cadeau | |
| Steven (Silph Co., revisite) | Propose un échange direct contre un compagnon différent | Compagnon (échange) | |
| Medium Darcy, Psychic Franklin, Jared, Medium Rebecca | Gardiens avant Sabrina (4 confirmés ; Gym en 9 chambres reliées par téléportation) | — | combat |
| Sabrina | 師範 Psy, 10e badge | — | combat |

**Side quests dans cette zone** : 1 (Pass Train Aimant via la quête Copycat/Vermeille)
**Objets à aller chercher dans cette zone** : 4 (CT, Amélioration, Pass Train Aimant, compagnon-cadeau)

---

## route-9-10-rocktunnel — Routes 9-10 / Rock Tunnel

**Budget** : 1200–1220 kanji étudiés | N2 | 65–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Camper Sid, Hiker Eoin, Picnicker Heidi/Edna, Camper Dean, Hiker Clarke (Route 9) | Dresseurs (6, confirmés par extraction ROM 2026-07-09 — « Hiker Sidney » était une coquille pour « Hiker Clarke ») | — | combat |
| 2 Randonneurs (Route 10, 2e nom incertain OCR) | Dresseurs | — | combat |
| Garçon (Centre Pokémon voisin) | Relaie le vol à la Centrale (indice pur) | — | leçon #1 — 漢字: 炎・烈・煩・爽・牲 — 文法: Noun に限る (~ni kagiru)<br>leçon #2 — 漢字: 狂・璃・瓶・甚・甲 — 文法: Noun ぬいた Noun (A nuita B)<br>leçon #3 — 漢字: 畝・痘・痢・監・盲 — 文法: Noun + ぬいて（~nuite)<br>leçon #4 — 漢字: 盾・眉・眺・睦・瞬 — 文法:  ～ぬく (~nuku) |

Aucun dresseur dans Rock Tunnel — donjon d'exploration pure plongé dans le noir (🔒 Flash), objets cachés dont 2 accessibles seulement après 力.
| Hiker Jim, Pokéfan Robert (Route 10 sud) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## lavender-town — Lavender Town

**Budget** : 1220–1240 kanji étudiés | N2 | 65–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Directeur de la station radio de Lavender Town | Remet la carte EXPN une fois la quête de la Centrale Électrique de Kanto résolue (finding 04-B1) | Carte EXPN | leçon #1 — 漢字: 瞭・祉・祥・稼・稿 — 文法: Noun のいかんでは (Noun no ikan de wa)<br>leçon #2 — 漢字: 端・範・篤・簿・籍 — 文法: Noun のいかんにかかわらず (Noun no ikan ni kakawarazu)<br>leçon #3 — 漢字: 粋・粛・粧・糾・紋 — 文法: Noun のいかんによっては (Noun no ikan ni yotte wa)<br>leçon #4 — 漢字: 紡・索・紫・累・紺 — 文法: Noun のいかんによらず (~ no ikan ni yorazu) |

**Side quests dans cette zone** : 1 (livrer la pièce mécanique volée à la Centrale avant de revenir ici)
**Objets à aller chercher dans cette zone** : 1 (carte EXPN)

---

## route-8-kanto — Route 8 (Kanto)

**Budget** : ~1220 kanji étudiés (plateau, optionnelle — Safranville↔Lavender, zéro croissance requise) | N2 | 65–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Biker Dwayne, Biker Harris, Biker Zeke | Dresseurs — roster complet trouvé par extraction ROM (2026-07-09), remplace le placeholder « fusionné avec route-7-kanto » (le guide d'origine ne distinguait pas Route 7 de Route 8) | — | combat |
| Super Nerd Sam, Super Nerd Tyrone | Dresseurs — idem | — | combat |
| Young Couple Moe & Lulu | Dresseurs — idem | — | combat |
| Gentleman Milton | Dresseur — idem | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## kanto-power-plant — Centrale Électrique

**Budget** : 1235–1250 kanji étudiés *(était 1220–1235 — redistribution synthèse 2026-07-07, Lavender insérée avant)* | N2 | 65–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Directeur | Furieux du vol d'une pièce mécanique, la récupère et donne une CT une fois rendue | CT | leçon #1 — 漢字: 継・維・網・緊・緩 — 文法: Noun のごとき Noun (A no gotoki B) |
| Vigile | Relaie un indice vers Azuria | — | leçon #2 — 漢字: 緯・縁・縛・縫・繊 — 文法: Noun のことだから (〜no koto dakara) |
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
| Sbire Rocket isolé | "Seul membre étranger de la Team Rocket", n'a jamais reçu le mémo de dissolution ; poursuivi puis affronté (combat), avoue avoir volé une pièce mécanique de la Centrale | — | combat |
| Gérant du magasin de vélos d'origine | Regrette la baisse de fréquentation, évoque "un garçon et son vélo" trois ans plus tôt (écho Red) | — | leçon #1 — 漢字: 繰・罷・耐・耗・聴・肖 — 文法: Noun の手前 (~no temae)<br>leçon #3 — 漢字: 芳・苗・虞・衡・衰・衷 — 文法: Noun の 至り (~no itari)<br>leçon #5 — 漢字: 載・輩・轄・辱・透・逸 — 文法: Noun はおろか～すら (Noun wa oroka ～sura)<br>leçon #7 — 漢字: 釣・鉛・銃・錠・錦・鍛 — 文法: Noun はおろか～も (Noun wa oroka ～ mo)<br>leçon #9 — 漢字: 隻・雅・雷・需・霊・項 — 文法: Noun + はどうであれ (~ wa dou de are)<br>leçon #11 — 漢字: 鮮・鯨・鶏・鶴・麗・岡 — 文法: Noun もさることながら Noun も (A mo saru koto nagara B mo)<br>leçon #13 — 漢字: 喩・堆・塞・塡・妖・崖 — 文法: Noun も相まって (~mo aimatte)<br>leçon #15 — 漢字: 曽・枕・柵・桁・汎・煎 — 文法: Noun をもって (~wo motte)<br>leçon #17 — 漢字: 罵・羨・肘・股・脇 — 文法: Noun をよそに (~wo yoso ni) |
| Garçon récurrent (nord de la ville) | Indique où trouver Misty, puis signale une anomalie à la rivière | — | leçon #2 — 漢字: 肪・脅・脱・膜・膨・艇 — 文法: Noun の極み (〜no kiwami)<br>leçon #4 — 漢字: 裂・裕・褒・襲・覆・豚 — 文法: Noun はいざ知らず (~ wa iza shirazu)<br>leçon #6 — 漢字: 遮・邪・郎・郭・醜・采 — 文法: Noun はおろか～まで (~wa oroka ~made)<br>leçon #8 — 漢字: 鎖・閑・閥・閲・闘・陣 — 文法: Noun はさておき (~ wa sateoki)<br>leçon #10 — 漢字: 餓・駆・騒・騰・驚・魂 — 文法: Noun まみれ (~mamire)<br>leçon #12 — 漢字: 栃・阜・乞・勃・哺・喉 — 文法: Noun も兼ねて (~mo kanete)<br>leçon #14 — 漢字: 弄・怨・拉・斑・斬・曖 — 文法: Noun を おいて他に Verb ない (〜wo oite hoka ni〜nai)<br>leçon #16 — 漢字: 畏・畿・箋・籠・綻 — 文法: Noun をものともせずに (Noun wo mono tomo sezu ni) |
| Misty | Trouvée hors du Gym (point de vue) ; le Gym ne se peuple de ses 5 dresseurs qu'après l'avoir rencontrée | — | combat |
| Swimmer Briana, Parker (+ 3 non confirmés dans l'OCR) | Gardiens avant Misty (5 au total annoncés) | — | combat |

⚠️ Ville confirmée pauvre en PNJ secondaires dans le texte source (vérifié en recoupant les pages OCR adjacentes).
| Swimmer Diana, Swimmer Joy, Sailor Eddie (Gym) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |

**Side quests dans cette zone** : 1 (récupérer la pièce mécanique volée, relance la Centrale Électrique)
**Objets à aller chercher dans cette zone** : 0 (la pièce est rendue à la Centrale, pas remise au joueur)

---

## route-5-kanto — Route 5 (Kanto)

**Budget** : ~1350 kanji étudiés (plateau, optionnelle — Safranville↔Azuria, zéro croissance requise) | N2 | 65–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

Aucun PNJ propre sourcé pour cette route — son contenu (vieille dame donnant un Talisman
Anti-Combat) est déjà recensé sous la section route-6-kanto (roster Route 5/6/Passage Souterrain
fusionné dans le guide d'origine) ; ne pas dupliquer ici.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## route-24-25-kanto — Routes 24-25 (Kanto)

**Budget** : 1350–1370 kanji étudiés | N2 | 65–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Sbire isolé (Route 24) | Combat scripté obligatoire (voleur de la pièce mécanique, dernier vestige de la Team Rocket "dissoute") | — | combat |
| 2 dresseurs supplémentaires (Route 24, zone d'attribution incertaine OCR) | Dresseurs | — | combat |
| Camper Lloyd, Fille Laura, Intello Pat, Écolier Joe, Fille Shannon, Ace Trainer Kevin (Route 25, gauntlet obligatoire de 6) + 1 dresseur non listé officiellement | Dresseurs | Pépite (Kevin) | combat |
| Grand-père de Bill (Chaumière au bord de mer) | Montrer un compagnon précis → objet évolutif au choix | Objet évolutif | |
| Misty (rendez-vous, bout de la route) | Scène climactique de poursuite de l'esprit légendaire, Eusine en commentateur | — | |

🔒 Coupe et Surf.
| School Kid Dudley, Lass Ellen (Route 25) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |

**Side quests dans cette zone** : 1 (montrer un compagnon précis au grand-père de Bill)
**Objets à aller chercher dans cette zone** : 2 (Pépite, objet évolutif)

---

## route-7-kanto — Route 7 (Kanto)

**Budget** : 1370–1380 kanji étudiés | N2 | 68–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

Aucun dresseur trouvé sur la carte Route 7 par extraction ROM (2026-07-09, `~/pokeheartgold`) —
route de transit pure. Young Couple Moe & Lulu et Super Nerd Sam, précédemment attribués ici,
appartiennent en fait à route-8-kanto (le guide d'origine fusionnait « Route 7/8 » sans
distinguer) ; déplacés là-bas, voir cette section pour le roster complet.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## celadon-city — Céladia

**Budget** : 1380–1500 kanji étudiés | N2 | 68–115 chars
**Grammaire nouvellement disponible à ce palier** : N2 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Wake (cameo, déguisé) | Champion d'arène visiteur d'une autre région | 3 masques-accessoires | |
| Homme du toit des Condominiums (visible 20h–4h uniquement) | PNJ à horaire fixe | Grigri Esprit | leçon #1 — 漢字: 脊・腎・膝・舷・芯・酎 — 文法: Noun を皮切りにして (Noun wo kawakiri ni shite)<br>leçon #7 — 漢字: 答・親・計・野・首・黒 — 文法: Noun + 前提で (Noun + zentei de)<br>leçon #13 — 漢字: 試・説・飯・貸・質・映 — 文法: Verb ずじまい (~zu jimai)<br>leçon #19 — 漢字: 神・秒・章・童・等・箱 — 文法: Verb そばから (〜soba kara)<br>leçon #25 — 漢字: 案・標・治・法・清・灯 — 文法: Verb つ Verb つ (Verb tsu Verb tsu) |
| Rival (bureaux GAME FREAK, cameo) | Taquine sur une récompense musicale une fois tous les badges réunis | — | |
| "Président" GAME FREAK (cameo) | Dialogue d'ambiance sur le développement du jeu | — | leçon #2 — 漢字: 釜・鍋・鍵・頓・餌・麺 — 文法: Noun を禁じ得ない (〜wo kinjienai)<br>leçon #8 — 漢字: 乗・住・写・味・員・始 — 文法: Verbる / Noun(である) + 限り(は) (kagiri (wa))<br>leçon #14 — 漢字: 草・虫・丸・岩・晴・点 — 文法: Verb ずとも (〜zu tomo)<br>leçon #20 — 漢字: 級・練・苦・談・負・路 — 文法: Verb たが最後 (〜ta ga saigo) |
| "Directeur son" GAME FREAK | Objet-clé changeant la musique d'ambiance, une fois tous les badges réunis | Objet-clé musique | leçon #3 — 漢字: 年・校・百・空・午・国 — 文法: Noun を経て (〜wo hete)<br>leçon #9 — 漢字: 屋・待・悪・意・持・暑 — 文法: Verb がてら (~ gatera)<br>leçon #15 — 漢字: 組・絵・線・記・黄・係 — 文法: Verb ずにはおかない (~zuni wa okanai)<br>leçon #21 — 漢字: 農・返・速・鼻・仲・信 — 文法: Verb たことにしてください (~ ta koto ni shite kudasai) |
| "Réalisateur" GAME FREAK | Quête en 2 étapes, récompense à chaque jalon de complétion | Récompenses par jalon | leçon #4 — 漢字: 店・時・語・読・買・駅 — 文法: Noun を踏まえて (〜wo fumaete)<br>leçon #10 — 漢字: 暗・注・界・真・研・究 — 文法: Verb こそすれ (~koso sure)<br>leçon #16 — 漢字: 助・坂・客・局・平・息 — 文法: Verb ずにはすまない (Verb zuni wa sumanai)<br>leçon #22 — 漢字: 児・兵・冷・努・勇・単 — 文法: Verb たら Verb たで (~ tara ~ tade) |
| Maylene (cameo) | Championne visiteuse, scène comique en restaurant | — | |
| Gentleman du comptoir d'échange | Se plaint de son manque de Jetons (flavor) | — | leçon #5 — 漢字: 森・町・体・切・妹・姉 — 文法: Noun を限りに (Noun wo kagiri ni)<br>leçon #11 — 漢字: 習・薬・起・運・都・重 — 文法: Verb させられる (~saserareru)<br>leçon #17 — 漢字: 想・打・拾・指・整・板 — 文法: Verb そうにない (Verb sou ni nai)<br>leçon #23 — 漢字: 周・固・失・孫・完・察 — 文法: Verb たら きりがない (Verb tara kiri ga nai) |
| Conseiller "Pouvoir Caché" | PNJ d'information gratuite près du Casino | — | leçon #6 — 漢字: 室・教・昼・歩・理・画 — 文法: Noun 並み (~nami)<br>leçon #12 — 漢字: 題・便・借・特・英・菜 — 文法: Verb ざるを得ない (~ zaru wo enai)<br>leçon #18 — 漢字: 柱・植・油・泳・消・炭 — 文法: Verb そうもない (〜sou mo nai)<br>leçon #24 — 漢字: 希・府・徒・念・敗・最 — 文法: Verb たら最後 (〜tara saigo) |
| Picnicker Tanya, Beauty Julia, Twins Jo & Zoe, Lass Michelle | Gardiens avant Erika (4 confirmés) | — | combat |
| Erika | 師範 Plante, 12e badge | — | combat |

**Side quests dans cette zone** : 1 (quête du Réalisateur GAME FREAK, 2 paliers)
**Objets à aller chercher dans cette zone** : 3 (masques, Grigri Esprit, objet-clé musique)

---

## route-16-17-18-cycling-road — Routes 16-18 / Cycling Road

**Budget** : 1500–1520 kanji étudiés | N2/N1 | 68–115 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| PNJ récurrent (Route 16) | Enseigne "un mot à la mode" par jour à qui revient le voir | — | leçon #1 — 漢字: 的・省・祝・結・給 — 文法: Verb ないものだろうか (Verb nai mono darou ka)<br>leçon #2 — 漢字: 続・置・群・覚・観 — 文法: Verb ないものでもない (Verb nai mono demo nai)<br>leçon #3 — 漢字: 訓・課・議・貨・量 — 文法: Verb の ない Noun (~ no nai ~)<br>leçon #4 — 漢字: 静・仮・似・刊・判 — 文法: Verb ば きりがない (〜ba kiri ga nai) |
| Biker Reese, Joel, Markey, Dale, Jacob, Aiden, Dan, Theron, Glenn, Teddy, Ernest (Route 17, 11 confirmés) | Dresseurs — roster exact confirmé par extraction ROM (2026-07-09) : Dale déplacé depuis Route 16 (aucun dresseur trouvé sur Route 16 dans la ROM) ; « 12 Motards » du guidebook corrigé à 11 | — | combat |
| Bird Keeper Bob, Bird Keeper Boris, Biker Charles (Route 18, 3 confirmés) | Dresseurs — roster exact confirmé par extraction ROM (2026-07-09), corrige fortement le « 9 dresseurs (7 Motards + 2 Bird Keeper) » du guidebook Prima (sous-comptage web déjà repéré confirmé faux dans l'autre sens) | — | combat |

🔒 Bicyclette obligatoire (16→17), Coupe pour l'ensemble de Route 18.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## fuchsia-city — Fuchsia City

**Budget** : 1520–1650 kanji étudiés | N2/N1 | 68–115 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Fille au nord du Centre Pokémon | Explique que la Zone Safari a déménagé au Johto (lore) | — | leçon #1 — 漢字: 則・効・可・喜・営・囲 — 文法: Verb やしない (~ yashinai)<br>leçon #5 — 漢字: 破・確・祖・禁・移・程 — 文法: Verb ようがない (〜you ga nai)<br>leçon #9 — 漢字: 銅・際・領・供・値・党 — 文法: Verb ようもない (~you mo nai)<br>leçon #13 — 漢字: 装・訪・詞・誌・誤・論 — 文法: Verbる こと なし に (Verb-ru koto nashi ni)<br>leçon #17 — 漢字: 抜・抱・押・曇・杯・枯 — 文法: Verbる ともなしに Verb (Verb-ru tomonashi ni Verb)<br>leçon #21 — 漢字: 腰・膚・菓・詰・販 — 文法: Verbる にも (Verb-ru ni mo) |
| Fille à l'est du Gym | Mentionne que le grand-père de Bill est parti lui rendre visite | — | leçon #2 — 漢字: 報・増・居・情・技・招 — 文法: Verb よう (~ you / ~ you ni)<br>leçon #6 — 漢字: 粉・精・耕・規・設・講 — 文法: Verb ようと Verbる まいと (Verb you to Verb ru mai to)<br>leçon #10 — 漢字: 否・吸・宙・宝・届・層 — 文法: Verbる がままに (〜ga mama ni)<br>leçon #14 — 漢字: 諸・警・賃・除・頂・預 — 文法: Verbる ことのないように (Verb-ru koto no nai you ni)<br>leçon #18 — 漢字: 汗・況・泊・涙・溶・爆 — 文法: Verbる なり (Verb-ru nari)<br>leçon #22 — 漢字: 賢・贈・超・越・踊 — 文法: Verbる にも Verb れない (Verb-ru ni mo Verb-re nai) |
| PNJ troc "Wadbutt" (nord) | Troc récurrent : un fragment contre une baie thématique | Baie (troc) | leçon #3 — 漢字: 授・採・政・故・枝・査 — 文法: Verb ようか Verbるまいか (Verb you ka Verb ru mai ka)<br>leçon #7 — 漢字: 識・豊・財・貧・責・貯 — 文法: Verb ようにも (〜you ni mo)<br>leçon #11 — 漢字: 庁・延・承・担・済・異 — 文法: Verbる が早いか (verb-ru ga hayai ka)<br>leçon #15 — 漢字: 乾・伸・伺・凍・到・含 — 文法: Verbる ときりがない (verb-ru to kiri ga nai)<br>leçon #19 — 漢字: 猫・皆・盗・眠・硬・突 — 文法: Verbる にとどまらず～も (Verb-ru ni todomarazu ~ mo) |
| Fils de Baoba | Gère le Pal Park (callback direct vers un PNJ Johto déjà documenté) | — | |
| Visiteur du Pal Park au chapeau | Donne un accessoire cosmétique sous condition externe | Accessoire cosmétique | leçon #4 — 漢字: 格・混・版・状・現・略 — 文法: Verb ようが Verb るまいが (Verb you ga Verb ru mai ga)<br>leçon #8 — 漢字: 費・貿・資・賛・賞・造 — 文法: Verb ようにも Verb れない (〜you ni mo 〜renai)<br>leçon #12 — 漢字: 砂・窓・簡・署・若・著 — 文法: Verbる くらいなら (〜ru kurai nara)<br>leçon #16 — 漢字: 喫・埋・帽・怒・怖・憎 — 文法: Verbる ともなく Verb (Verb-ru tomonaku Verb)<br>leçon #20 — 漢字: 符・筒・紹・絡・緒・脂 — 文法: Verbる にはあたらない (Verb-ru ni wa ataranai) |
| Picnicker Cindy, Camper Barry, Lass Alice, Linda | Gardiens avant Janine (4 confirmés) | — | combat |
| Janine | 師範 Poison, 13e badge (Gym-labyrinthe de murs transparents) | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 2 (baie via troc, accessoire cosmétique)

---

## route-14-15-kanto — Routes 14-15 (Kanto)

**Budget** : 1650–1670 kanji étudiés | N2/N1 | 68–120 chars
**Grammaire nouvellement disponible à ce palier** : N2/N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Twins Kay & Tia, Pokéfan Eleanor, Enseignante Colette/Hillary, 2 Écoliers dont Billy, Pokéfan Boone (Route 15) | Dresseurs — Billy ajouté par recoupement registre téléphonique (source Serebii, 2026-07-09), classe non confirmée par cette source, un des 2 Écoliers jusque-là non nommés | — | combat |
| Bird Keeper Josh/Roy, School Kid Torin/Connor/Travis, Pokéfan Trevor/Carter, Enseignante Clarice (Route 14) | Dresseurs — roster complet (8) confirmé par extraction ROM (2026-07-09), classe School Kid confirmée pour Torin (précédemment ajouté sans classe via le registre téléphonique) | — | combat |
| Fille dans les hautes herbes (Route 14, ouest) | Demande à voir un compagnon précis | Objet porté rare | leçon #1 — 漢字: 軒・較・途・郊・零 — 文法: Verbる 嫌いがある (～ru kirai ga aru)<br>leçon #2 — 漢字: 頼・駐・髪・齢・矢 — 文法: いつまで～のやら (itsumade ~ no yara)<br>leçon #3 — 漢字: 宮・昭・笛・詩・佐 — 文法: ～が Verb られる (〜ga Verb rareru)<br>leçon #4 — 漢字: 典・岐・巣・松・沖 — 文法: ～かと思いきや (〜ka to omoikiya) |

📍 Première apparition à pied de l'esprit légendaire (Suicune-analogue), Eusine en poursuite, oriente vers Route 25. 🔒 Coupe requis ; rebords à sens unique imposant un ordre de traversée.
| School Kid Kipp, School Kid Tommy, School Kid Johnny (Route 15) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (objet porté rare)

---

## route-11-12-13-diglett — Routes 11-13 / Grotte Diglett

**Budget** : 1670–1685 kanji étudiés | N1 | 68–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Psychic Fidel, Youngster Jason/Owen, Psychic Herman (Route 11) | Dresseurs | — | combat |
| Fisherman Kyle, Kyler (Route 12, marchent en silence pour ne pas effrayer les Pokémon) | Dresseurs — noms ajoutés par recoupement registre téléphonique (source Serebii, 2026-07-09), non nommés dans le guidebook original | — | combat |
| Camper Clark, Hiker Kenny, Picnicker Ginger, Pokéfan Alex, Camper Tanner, Tim & Sue (Route 13, 11 au total confirmés) | Dresseurs — Tim & Sue ajoutés par recoupement registre téléphonique (source Serebii, 2026-07-09), classe non confirmée par cette source, parmi les dresseurs jusque-là non nommés | — | combat |
| PNJ de couleur locale (Grotte Diglett) | Surpris par les créatures qui surgissent du sol | — | leçon #1 — 漢字: 賀・郡・序・往・提 — 文法: ～がゆえの Noun (〜ga yue no Noun) |
| Portier (Grotte Diglett) | Remet un objet de quête confié par le Pr. Chen/Oak | Objet de quête | leçon #2 — 漢字: 舎・証・謝・護・飼 — 文法: ～から Noun に 至る まで (〜kara 〜ni itaru made) |
| Maison voisine (Grotte Diglett) | — | Pépite | leçon #3 — 漢字: 俵・創・垂・奏・姿 — 文法: ～ごとく (〜gotoku) |

🔒 力 pour un accès complet à la Grotte Diglett.
| Fisherman Martin, Young Couple Vic & Tara, Fisherman Stephen, Fisherman Barney, Bird Keeper Gs Gail (Route 12) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |
| Pokéfan Joshua, Bird Keeper Gs Bret, Bird Keeper Gs Perry (Route 13) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 2 (objet de quête, Pépite)

---

## pewter-city — Argenta City

**Budget** : 1685–1800 kanji étudiés | N1 | 68–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Vieil homme sur la colline (près du Poké Mart) | Donne l'Aile Argent/Arc-en-ciel (callback direct vers le climax Tour Jo, Johto) | Aile Argent/Arc-en-ciel | leçon #1 — 漢字: 忠・恩・揮・潮・皇・盟 — 文法: ～こととて (〜koto tote)<br>leçon #3 — 漢字: 視・覧・討・訳・誠・貴 — 文法: ～だろうとなかろうと (〜darou to nakarou to)<br>leçon #5 — 漢字: 伯・伴・但・侍・促・倣 — 文法: ～つもりで (〜tsumori de)<br>leçon #7 — 漢字: 剛・剤・劣・勅・勘・卓 — 文法: ～とあって (〜to atte)<br>leçon #9 — 漢字: 唄・嗣・圏・堤・堪・妙 — 文法: ～といえども (〜to iedomo)<br>leçon #11 — 漢字: 宵・寂・寧・審・寿・尽 — 文法: ～といったらありゃしない (〜to ittara arya shinai)<br>leçon #13 — 漢字: 彩・影・征・徐・循・忍 — 文法: ～ときている (〜to kite iru)<br>leçon #15 — 漢字: 憾・扱・扶・抄・択・抹 — 文法: ～とされる (〜to sareru)<br>leçon #17 — 漢字: 措・描・搬・斎・斜 — 文法: ～とすると (〜to suru to)<br>leçon #19 — 漢字: 槽・殉・殖・汰・沙 — 文法: ～となったら (〜to nattara) |
| Comptoir du Musée des Sciences | Restaure un fossile-objet en compagnon | Compagnon (fossile) | leçon #2 — 漢字: 磁・秘・納・肺・舌・衆 — 文法: ～ずにすんだ (〜zuni sunda)<br>leçon #4 — 漢字: 鋼・閣・丙・亭・伎・伏 — 文法: ～つもりだ (〜tsumori da)<br>leçon #6 — 漢字: 僧・儀・儒・克・冶・削 — 文法: ～ではすまない (〜dewa sumanai)<br>leçon #8 — 漢字: 却・厘・叙・吏・吟・哲 — 文法: ～とあれば (〜to areba)<br>leçon #10 — 漢字: 姻・婆・媒・嫌・宜・宰 — 文法: ～といったらありはしない (〜to ittara ari wa shinai)<br>leçon #12 — 漢字: 屈・岬・岳・崇・廉・廊 — 文法: ～といったらない (〜to ittara nai)<br>leçon #14 — 漢字: 怠・恭・惜・愁・慮・慰 — 文法: ～ところを (〜tokoro wo)<br>leçon #16 — 漢字: 抽・拍・拓・拘・拙 — 文法: ～としたところで (〜to shita tokoro de)<br>leçon #18 — 漢字: 暫・朱・架・栓・棟 — 文法: ～とすれば (～to sureba)<br>leçon #20 — 漢字: 沢・沼・泌・泡・洞 — 文法: ～となると (〜to naru to) |
| Steven (cameo) | Champion visiteur, absorbé dans une expo minérale ; prérequis silencieux du fil Steven (résolu à Safranville) | — | |

Aucun dresseur devant le Gym — Brock est explicitement le seul 師範 Kanto sans garde ("on peut marcher droit jusqu'à lui").
| Camper Jerry, Hiker Edwin (Gym) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 2 (Aile légendaire, compagnon-fossile)

---

## mont-lune-route-3-4 — Mont Lune / Routes 3-4

**Budget** : 1800–1820 kanji étudiés | N1 | 68–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Petit comptoir marchand (Mont Lune) | Au milieu de la traversée | — (vente) | leçon #1 — 漢字: 洪・淑・淡・滑・漂 — 文法: ～と言わんばかりに (〜to iwan bakari ni)<br>leçon #2 — 漢字: 漸・潜・澄・濫・煮 — 文法: ～と言わんばかりの Noun (～to iwan bakari no Noun)<br>leçon #3 — 漢字: 犠・狩・献・獣・琴 — 文法: ～ながらに (～nagara ni)<br>leçon #4 — 漢字: 瑠・璽・畔・疎・症 — 文法: ～ながらの Noun (〜nagara no Noun) |
| Rival (Silver, embuscade Mont Lune — **vrai combat adopté 2026-07-07, synthèse** : 26 questions N1, quête `silver-kanto`, hors "6 Rencontres" ; déclenche la Tag Battle de l'Antre puis les revanches hebdo au Plateau Indigo — voir PRD § Silver — arc Kanto) | Motive la Tag Battle de l'Antre du Dragon déjà documentée côté Johto | — | |
| Youngster Warren, Jimmy ; Hiker Bruce ; Firebreather Burt (Route 3) | Dresseurs | — | combat |
| Youngster Regis, Double Team Zac & Jen, Firebreather Otis, Black Belt Manford/Ander, Hiker Dwight, Picnicker Hope/Sharon, Bird Keeper Hank (Route 4) | Dresseurs | — | combat |

Aucun dresseur nommé au Mont Lune (contrairement aux Routes 3/4 alentour) — lore autour de météorites à l'énergie étrange.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## route-2-foret-viridian — Route 2 / Forêt Viridian

**Budget** : 1820–1835 kanji étudiés | N1 | 70–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Bug Catcher Ed, Abner, Ellis, Dane, Stacey, Dion | 6 Insectophiles (thème de classe homogène) | — | leçon #1 — 漢字: 盆・盤・督・矛・砕 — 文法: ～なくはない (〜naku wa nai)<br>leçon #2 — 漢字: 砲・硝・硫・碁・碑 — 文法: ～なくもない (〜naku mo nai)<br>leçon #3 — 漢字: 礁・礎・租・穂・窒 — 文法: ～なら～なりに |
| Rob, Doug (Route 2, hors forêt) | Dresseurs — noms ajoutés par recoupement registre téléphonique (source Serebii, 2026-07-09), classe non confirmée par cette source, non nommés dans le guidebook original | — | combat |

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
| Trainer House | Un combat par jour (lieu, non personnifié dans le texte) | — | combat |
| Rumeur ambiante (Centre Pokémon) | Clients se demandant si le Gym d'Île Braise existe encore, pousse le joueur vers le sud | — | leçon #1 — 漢字: 窮・窯・粗・粘・紛 — 文法: ～には及ばない (〜ni wa oyobanai)<br>leçon #2 — 漢字: 紳・絞・綱・締・繁 — 文法: ～に堪えない (～ni taenai) |
| Ace Trainer Bonita, Salma, Arabella | Gardiens avant Blue (3 confirmés ; sol à tuiles-flèches) | — | combat |
| Blue | 師範 final Kanto, 16e badge ; Gym verrouillé jusqu'à la toute fin (1ère visite : Gym fermé — vrai combat calibré ~1920 kanji/N1, sur revisite après Île Braise) | 印/Badge (sur revisite) | combat |

⚠️ **Zone revisitée** (même schéma que Doublonville/Silver #5 et Oliville/Jasmine, voir `curriculum-checkpoints.md` § Note zones revisitées) : cette ligne couvre uniquement la 1ère visite (Gym fermé, le 師範 est absent). Le vrai combat contre Blue reste gaté à 1920 kanji (déjà fixé au PRD), sur la revisite après Île Braise.
| Double Team Elan & Ida (Gym) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## route-22-kanto — Route 22 (Kanto)

**Budget** : ~1835 kanji étudiés (plateau, optionnelle — ouest de Vertville, zéro croissance requise) | N1 | 70–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

Aucun PNJ nommé confirmé — corridor de transition vers le Mont Gris, décrit par le guide comme
« délibérément vide » (même source que mt-silver-route-28, voir cette section pour la seule
trouvaille du secteur : l'Idole retraitée).

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 0

---

## route-1-kanto — Route 1 (Kanto)

**Budget** : 1845–1855 kanji étudiés | N1 | 70–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| School Kid Sherman, Danny ; Ace Trainer French, Quinn | Dresseurs de route (4) | — | combat |
| Photographe itinérant | Jours différents côté Vertville vs côté Bourg-Origine | — | leçon #1 — 漢字: 繕・羅・翁・翻・肝 — 文法: ～に堪える (～ni taeru)<br>leçon #2 — 漢字: 肢・胆・胎・胞・胴 — 文法: ～に耐える (～ni taeru) |

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
| Photographe itinérant | Présent mercredi/jeudi/vendredi uniquement | — | leçon #1 — 漢字: 臭・致・舶・艦・荘 — 文法: ～に越したことはない (〜ni koshita koto wa nai)<br>leçon #2 — 漢字: 蓄・薪・藍・虜・裸 — 文法: ～に難くない (～ni katakunai)<br>leçon #3 — 漢字: 訂・託・訟・訴・診 — 文法: ～のは Noun ぐらいのものだ (〜no wa Noun gurai no mono da) |
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
| Fisherman Arnold, Murphy, Liam, Gideon ; Swimmer Nikki, Chelan, Kendra, Tyson, Esteban, Duane ; Bird Keeper Easton, Kinsley | Dresseurs — roster complet (12) trouvé par extraction ROM (2026-07-09), remplace le placeholder « 5 nommés » sans noms | — | combat |

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
| Scientist Linden, Daniel ; Super Nerd Merle, Waldo, Cary | Gardiens avant Blaine (~5-6 annoncés, Seafoam Islands) | — | combat |
| Blaine | 師範 Feu, 15e badge (Gym relocalisé aux Seafoam Islands suite à l'éruption) | — | combat |

⚠️ Île sinistrée par l'éruption volcanique un an avant l'arrivée du joueur (seul le Centre Pokémon a survécu) — contenu PNJ volontairement clairsemé, cohérent avec le ton "carrefour émotionnel" plutôt qu'un simple gym de plus.

**Side quests dans cette zone** : 0
**Objets à aller chercher dans cette zone** : 1 (Magmarizer)

---

## route-19-20-seafoam — Routes 19-20 / Seafoam Islands

**Budget** : 1920–1950 kanji étudiés | N1 | 70–120 chars
**Grammaire nouvellement disponible à ce palier** : N1 (inchangé)

| PNJ / rôle sourcé | Rôle d'origine (jeu Pokémon) | Objet/quête remis | Type assigné |
|---|---|---|---|
| Nageurs/Campeurs/Pique-niqueuses/Bird Keeper nommés (Route 20, 7-8) | Dresseurs — non confirmés par extraction ROM (2026-07-09) : la carte Route 20 n'a pas pu être rattachée automatiquement à cette zone (limite technique de l'extraction sur ce zone_id fusionné), compte du guidebook conservé tel quel | — | combat |
| Swimmer Jerome, Harold, Tucker, Debbie (Route 19) | Dresseurs — 4 confirmés par extraction ROM (2026-07-09) ; le guidebook en annonçait 7, seuls ces 4 ont pu être localisés avec certitude, écart non résolu | — | combat |
| Dresseurs postés (Seafoam B2F) | Servent de "freins" pour stopper la glissade sur sol de glace (puzzle environnemental-social) | — | |

🔒 Surf, 力, Rock Smash (sans équivalent ici) pour l'ensemble.
| Swimmer Frankie, Camper Pedro, Picnicker Adrian, Picnicker Cheyenne, Bird Keeper Gs Bert, Bird Keeper Gs Ernie, Swimmer Nicole, Swimmer Lori, Swimmer Elmo, Swimmer Luis, Swimmer Leona, Swimmer Mina (Route 20) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |
| Boarder Bryce, Boarder Shaun, Skier Cady (Seafoam Islands B2F) | Dresseurs — roster trouvé par extraction ROM (`~/pokeheartgold`, 2026-07-09), absent du dépouillement guidebook initial | — | combat |

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
| L'Idole retraitée | Trouvée via une coupe d'arbre depuis l'extérieur du Mont Gris ; demande le silence du joueur sur sa cachette | TM47 Acier Aile | leçon #1 — 漢字: 詐・詔・詠・該・詳・誇 — 文法: ～ば～ものを (～ba～mono o)<br>leçon #2 — 漢字: 誉・誓・誘・請・諭・諮 — 文法: ～びた (～bita)<br>leçon #3 — 漢字: 謀・謁・謄・謙・謡・謹 — 文法: ～びる (〜biru)<br>leçon #4 — 漢字: 譜・譲・貞・貢・貫・賄 — 文法: ～ぶった (～butta)<br>leçon #5 — 漢字: 賊・賓・賜・賠・賦・購 — 文法: ～ぶって (〜butte)<br>leçon #6 — 漢字: 赦・赴・趣・距・跡・跳 — 文法: ～ぶり (〜buri)<br>leçon #7 — 漢字: 践・踏・躍・軌・軸・輝 — 文法: ～ぶる (〜buru)<br>leçon #8 — 漢字: 迫・逝・遭・遵・酪・酬 — 文法: ～までだ (～made da)<br>leçon #9 — 漢字: 酵・酷・釈・鈴・鉢・銘 — 文法: ～もなんでもない (〜mo nandemonai)<br>leçon #10 — 漢字: 錬・錯・鎌・鑑・阻・附 — 文法: ～ものとして (～mono to shite)<br>leçon #11 — 漢字: 陳・雰・霜・響・頑 — 文法: ～んがために (〜n ga tame ni)<br>leçon #12 — 漢字: 頒・顧・飽・駄・駒 — 文法: ～んばかりに (〜n bakari ni)<br>leçon #13 — 漢字: 髄・魅・麻・鼓・茨 — 文法: ～差し支えない (〜sashitsukaenai)<br>leçon #14 — 漢字: 阪・串・丼・侶・凄 — 文法: ～折に (〜ori ni) |

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
