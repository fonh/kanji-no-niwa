# Calibration Langue par Zone — 漢字の庭

Référence de travail pour écrire tout contenu en japonais dans le jeu :
dialogues scriptés (content/dialogues/), PNJ ambiant (content/map/npcs_*.json),
inscriptions, panneaux, quiz de lecture, et grammar_note des leçons.

**Méthode de cette mise à jour (2026-06-30) :** suite au dépouillement approfondi du guidebook Prima 2010
(voir `content/guidebook-adapted.md`, trois passes : OCR archive.org, texte natif du PDF, recherche web
pour Mont Gris/Red), ce document a été enrichi de deux façons :
1. **Ancrage PNJ nommés** — chaque zone dispose maintenant d'une liste de personnages réels du jeu
   d'origine (cf. nouvelle section "PNJ sourcés par zone") à utiliser comme porte-voix plutôt que des
   PNJ génériques anonymes, pour donner une cohérence de monde au japonais calibré.
2. **Correction de la Règle de Silver** — la table des 6 apparitions de Silver en bas de ce document
   utilisait des lieux différents de la table officielle du PRD (`PRD.md`, § "Silver — 6 Rencontres").
   Elle a été recalculée à partir des lieux confirmés par le guidebook et alignée sur la table du PRD.
   **⚠️ Une incohérence résiduelle subsiste dans `content/guidebook-adapted.md`** (les tags
   "Silver apparition #N" qui parsèment les sections de zone utilisent encore l'ancien schéma) — à
   corriger lors de la prochaine passe sur ce fichier ; voir le détail dans la section dédiée ci-dessous.

---

## Les deux règles absolues

**Règle kanji :** un PNJ/panneau/inscription ne peut utiliser que les kanji que le joueur a déjà étudiés,
plus **2 kanji inconnus maximum** (présentés en contexte lisible). Les kanji inconnus peuvent être
affichés avec furigana — ils deviennent un moment de découverte, pas un mur.

**Règle grammaire :** chaque zone appartient à un niveau JLPT. Les structures grammaticales utilisées
dans cette zone doivent venir du niveau indiqué (et des niveaux précédents). Les structures des niveaux
supérieurs sont interdites — elles rendraient le dialogue incompréhensible même si les kanji sont connus.

Ces deux règles s'appliquent à tout le japonais du jeu : PNJ, panneaux, inscriptions de grottes,
dialogues de boss, messages Pokégear.

**Exception :** Silver parle toujours légèrement au-dessus du niveau attendu — c'est voulu. Ses 6
apparitions respectent les niveaux N4, N3, N3, N2, N2, N1 indépendamment de la zone.

---

## Table de calibration par zone

| Zone | Display Name | Kanji étudiés | Niveau | Longueur phrase |
|------|-------------|--------------|--------|----------------|
| new-bark-town | Bourg-en-Vol | 0–30 | N5 pur | 10–20 chars |
| route-29 | Route 29 | 10–50 | N5 | 15–25 chars |
| cherrygrove-city | Bourg-en-Côteau | 30–60 | N5 | 15–25 chars |
| route-30 | Route 30 | 50–80 | N5 | 15–28 chars |
| route-31 | Route 31 | 70–100 | N5/N4 | 20–30 chars |
| violet-city | Cramola | 80–130 | N5/N4 | 20–35 chars |
| sprout-tower | Tour Grospignon | 90–140 | N5/N4 | 20–35 chars |
| route-32 | Route 32 | 110–170 | N4 | 25–40 chars |
| ruins-of-alph | Ruines Arcaniques | 120–180 | N4 | 25–40 chars |
| route-33 | Route 33 | 150–190 | N4 | 25–40 chars |
| azalea-town | Safrania | 160–210 | N4 | 28–45 chars |
| slowpoke-well | Puits Ramoloss | 170–220 | N4 | 28–45 chars |
| ilex-forest | Forêt Secte | 200–240 | N4 | 30–45 chars |
| route-34 | Route 34 | 220–255 | N4 | 30–45 chars |
| goldenrod-city | Dorado City | 240–290 | N4 | 30–50 chars |
| route-35 | Route 35 | 270–310 | N4/N3 | 35–50 chars |
| national-park | Parc National | 290–330 | N4/N3 | 35–50 chars |
| route-36 | Route 36 | 310–355 | N3 | 38–55 chars |
| route-37 | Route 37 | 330–370 | N3 | 38–55 chars |
| ecruteak-city | Ecorosa City | 350–410 | N3 | 40–60 chars |
| burned-tower | Tour Embrasée | 370–430 | N3 | 40–60 chars |
| route-38 | Route 38 | 400–445 | N3 | 40–60 chars |
| route-39 | Route 39 | 420–460 | N3 | 42–60 chars |
| olivine-city | Amaris City | 440–490 | N3 | 42–65 chars |
| route-40 | Route 40 | 460–505 | N3 | 42–65 chars |
| cianwood-city | Orsay City | 480–520 | N3 | 45–65 chars |
| route-42 | Route 42 | 500–535 | N3/N2 | 45–65 chars |
| mt-mortar | Mont Mortier | 510–545 | N3/N2 | 45–68 chars |
| mahogany-town | Acajou Ville | 530–560 | N3/N2 | 45–70 chars |
| lake-of-rage | Lac Colère | 540–570 | N3/N2 | 48–70 chars |
| route-44 | Route 44 | 555–590 | N2 | 50–72 chars |
| ice-path | Chemin Glacé | 570–610 | N2 | 50–75 chars |
| blackthorn-city | Saupoudreville | 600–660 | N2 | 52–80 chars |
| dragons-den | Antre du Dragon | 640–720 | N2/N1 | 55–90 chars |
| route-45 | Route 45 | 680–740 | N2 | 50–75 chars |
| dark-cave | Grotte Sombre | 700–760 | N2 | 50–75 chars |
| route-26 | Route 26 | 740–800 | N2 | 52–78 chars |
| route-27 | Route 27 | 760–830 | N2 | 52–78 chars |
| indigo-plateau-antichambre | Antichambre | 800–900 | N2/N1 | 58–85 chars |
| indigo-plateau-will | Salle de Will | 900–1000 | N1 | 60–100 chars |
| indigo-plateau-koga | Salle de Koga | 1000–1100 | N1 | 60–100 chars |
| indigo-plateau-bruno | Salle de Bruno | 1100–1200 | N1 | 60–100 chars |
| indigo-plateau-karen | Salle de Karen | 1200–1350 | N1 | 65–110 chars |
| indigo-plateau-lance | Trône de Lance | 1350–1500 | N1 | 65–110 chars |
| vermilion-city | Vermeille City | 1500–1560 | N1 | 65–110 chars |
| saffron-city | Safranville | 1560–1620 | N1 | 65–110 chars |
| cerulean-city | Azuria City | 1620–1680 | N1 | 65–115 chars |
| celadon-city | Céladia | 1680–1740 | N1 | 68–115 chars |
| fuchsia-city | Fuchsia City | 1740–1800 | N1 | 68–115 chars |
| pewter-city | Argenta City | 1800–1860 | N1 | 68–120 chars |
| cinnabar-island | Île Braise | 1860–1920 | N1 | 70–120 chars |
| viridian-city | Vertville | 1920–2000 | N1 | 70–120 chars |
| mt-silver-route-28 | Route 28 | 2000–2030 | N1 | 70–120 chars |
| mt-silver-base | Gris — Base | 2030–2060 | N1 | 70–120 chars |
| mt-silver-lower | Gris — Versants inférieurs | 2060–2090 | N1 | 70–125 chars |
| mt-silver-upper | Gris — Versants supérieurs | 2090–2120 | N1 | 70–130 chars |
| mt-silver-summit | Gris — Sommet | 2120–2136 | N1 | silence ou 1 ligne |

**Note (2026-07-01) — insertion de l'arc Kanto (8 gyms) :** Mont Gris couvrait auparavant 1500–2136 (5 zones, 636 kanji). L'ajout de Kanto entre Plateau Indigo et Mont Gris redistribue ce budget — Kanto couvre 1500–2000 (8 villes, 500 kanji), Mont Gris est compressé à 2000–2136 (136 kanji, ascension finale courte). Voir `PRD.md` § Kanto — 8 Gyms et `content/guidebook-adapted.md` § Kanto pour le sourcing (guide Prima Kanto, OCR — moins fiable que le texte natif du Johto, voir réserves méthodologiques).

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
| route-36 | N3 | Jeune homme du Marteau-Piqueur, Frère/sœur du jour Arthur (jeudi) |
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
| dark-cave | N2 | Homme du fond (BlackGlasses, côté Saupoudreville) |
| route-26 | N2 | Fille de la maison de soin, carnet des Frères/sœurs du jour |
| route-27 | N2 | Vieille dame des Chutes de Tohjo |
| indigo-plateau-antichambre | N2/N1 | Rival (Silver) — voir Règle de Silver corrigée plus bas |
| indigo-plateau-will | N1 | Will *(aucune personnalité officielle — liberté totale, voir note ci-dessous)* |
| indigo-plateau-koga | N1 | Koga *(idem)* |
| indigo-plateau-bruno | N1 | Bruno *(idem)* |
| indigo-plateau-karen | N1 | Karen *(idem)* |
| indigo-plateau-lance | N1 | Lance *(idem)* |
| vermilion-city | N1 | Lt. Surge *(bio officielle absente du guide Kanto à ce stade — passe 1 seulement, voir note Kanto)* |
| saffron-city | N1 | Sabrina *(idem)* |
| cerulean-city | N1 | Misty *(idem)* |
| celadon-city | N1 | Erika *(idem)* |
| fuchsia-city | N1 | Janine *(idem)* |
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

### N5 — Bourg-en-Vol → Bourg-en-Côteau (0–60 kanji étudiés)

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
→ Récompense : Hint token
```

**PNJ exemple (Cherrygrove) :**
```
「この町（まち）には ポケモンセンターが あります。疲（つか）れたら 入（はい）ってください。」
```

**Longueur max :** 2 phrases, ~25 caractères chacune. Pas de subordonnées.

---

### N5/N4 — Routes 30-31, Cramola, Tour Grospignon (60–140 kanji étudiés)

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

**PNJ exemple (Cramola) :**
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

### N4 — Route 32 → Dorado City (140–290 kanji étudiés)

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

**PNJ exemple (Safrania — quest Kurt) :**
```
「Kurtさんの家（いえ）に 行ったことがありますか？
 この手紙（てがみ）を 渡（わた）してもらえますか？」
```

**PNJ exemple (Dorado — Pokégear) :**
```
「毎日（まいにち）漢字（かんじ）を 練習（れんしゅう）することにしています。
 なかなか 覚（おぼ）えられないのに、やめられないですね。」
```

**Note :** à partir de N4, les furigana deviennent **sélectifs** — uniquement sur les kanji
non encore étudiés par le joueur (calculé dynamiquement côté client).

---

### N4/N3 — Routes 35-37, Parc National (290–370 kanji étudiés)

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

### N3 — Ecorosa → Orsay City (370–520 kanji étudiés)

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

**PNJ exemple (Ecorosa — Tour Jo) :**
```
「古（ふる）いお寺（てら）で、この漢字（かんじ）の意味（いみ）を
 調（しら）べてきてほしいのですが。時間（じかん）があるうちに どうぞ。」
```

**PNJ exemple (Amaris — Jasmine allusion) :**
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

### N2 — Chemin Glacé → Routes 26-27 (590–840 kanji étudiés)

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

**PNJ exemple (Saupoudreville) :**
```
「竜（りゅう）の巣穴（すあな）は、知識（ちしき）があるにもかかわらず
 謙虚（けんきょ）な者（もの）だけを 受（う）け入（い）れます。
 力（ちから）を 求（もと）めるだけの者（もの）は、戻（もど）ってくることなく 去（さ）ります。」
```

---

### N2/N1 — Antre du Dragon, Antichambre (640–900 kanji étudiés)

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

### N1 — Elite Four, Lance, Mt. Silver (900–2136 kanji étudiés)

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
  transposable en effet visuel/sonore continu pendant les 50 questions du HP battle).
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
5. **Les furigana sont-ils corrects ?** → Tous les kanji non étudiés + tous les kanji du palier précédent si c'est une zone de transition.

**Règle du PNJ secondaire :** les PNJ sans quête (type `trainer_fixed`) peuvent utiliser
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
Bourg-en-Côteau/Safrania/Tour Embrasée/QG Rocket/Tour Radio/Route Victoire). Le guidebook source confirme
que la table du PRD est la bonne — la table ci-dessous reprend ses 6 lieux et y ajoute le niveau de
langue calibré (absent du PRD, qui ne traite que la géographie) :

| # Silver | Lieu (PRD) | Zone (table de calibration) | Niveau de zone | Silver parle | Note sourcée |
|---|---|---|---|---|---|
| 1 | Bourg-en-Côteau (retour du chemin) | cherrygrove-city | N5 | N5/N4 | ✅ Confirmé : 1er combat de rival du jeu, juste après la visite à Mr. Pokémon. |
| 2 | Safrania, porte ouest | azalea-town | N4 | N4/N3 | ✅ Confirmé : ambuscade après l'événement Proton/Puits Ramoloss. |
| 3 | Tour Embrasée | burned-tower / ecruteak-city | N3 | N3/N2 | ✅ Confirmé : en haut de l'échelle menant au sous-sol. |
| 4 | QG Rocket B2F | mahogany-town | N3/N2 | N2 | ⚠️ Dans le jeu d'origine, **ce n'est pas un combat** — Silver est déjà vaincu par Lance, juste un cameo frustré ("pas assez d'affection pour ses compagnons"). À garder en tête si le PRD veut un vrai combat ici plutôt qu'une scène. |
| 5 | Tour Radio B2F (Dorado) | goldenrod-city *(revisite tardive)* | N2 *(pas le N4 de 1ère visite — voir note)* | N2/N1 | ⚠️ Précision de lieu : dans le jeu d'origine, c'est au **Tunnel de Dorado B2F** (pas la Tour Radio elle-même) que Silver démasque le déguisement et combat (Battle 4 sur 5). Niveau de langue calculé sur l'avancement réel du joueur à ce stade de l'histoire (post-Mahogany, ~560-600 kanji), pas sur le niveau N4 de la zone goldenrod-city en première visite — Dorado est une ville revisitée plusieurs fois à des stades narratifs différents, voir note "zones revisitées" ci-dessous. |
| 6 | Route Victoire | indigo-plateau-antichambre *(= Victory Road dans ce projet)* | N2/N1 | N1 | ✅ Confirmé : dernier combat avant le Plateau, le jeu vide volontairement la route de tout autre dresseur pour ce face-à-face. |

**Apparitions bonus post-Red (hors des "6 Rencontres" officielles du PRD)** : `guidebook-adapted.md`
documente deux apparitions Silver supplémentaires à Mont Gris (Route 28, avant Red ; Versants, après
Red) — ce sont des ajouts narratifs du studio sans équivalent dans le jeu d'origine (le jeu original n'a
que 5 vrais combats + 1 cameo, soit les 6 ci-dessus). Si le PRD les conserve, elles se situent en zone
`mt-silver-route-28` et `mt-silver-upper`, toutes deux N1 — Silver y parle au plus simple (N1 sobre,
phrases courtes) puisque l'arc dramatique veut qu'il s'ouvre/s'apaise, pas qu'il complexifie son discours.

**Note "zones revisitées" :** Dorado City (goldenrod-city) est traversée au moins deux fois dans le
scénario à des stades très différents (1ère visite ~250 kanji pour le badge de Whitney ; retour bien
plus tard, ~560+ kanji, pour l'arc Team Rocket/Tour Radio). La table de calibration principale n'a
qu'une seule ligne par zone (le niveau de la 1ère visite) — **pour tout PNJ ou dialogue lié à un retour
tardif dans une ville déjà visitée (Dorado pour l'arc Rocket, Mahogany pour Lance, etc.), calibrer sur
l'avancement réel du joueur à ce moment de l'histoire, pas sur la ligne de la table.** Cette nuance ne
concernait jusqu'ici que Dorado/Silver #5, mais elle s'applique en principe à toute zone-hub revisitée
(Azalea/Kurt, Route 30/Mr. Pokémon pour l'Exp. Share, etc.).

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
  "examples": [
    { "jp": "この手紙を見てもらえませんか。", "en": "Could you take a look at this letter for me?", "grammar_audio": "/audio/japanese/grammar/n4/....mp3" },
    { "jp": "...", "en": "...", "grammar_audio": "..." }
  ],
  "jlpt_level": "N4",
  "distractors": [
    "この手紙を見てくれませんか。",
    "この手紙を見てもらいませんか。",
    "この手紙を見でもらえませんか。"
  ]
}
```

- `hanabira_title` : titre exact de l'entrée dans `grammar_JLPT_N{X}.json`. Copié verbatim
  — jamais reformulé.
- `formation`, `short_explanation`, `long_explanation` : copiés verbatim depuis le JSON source.
- `examples` : 2–3 entrées du tableau `examples[]` source (pas seulement `examples[0]`),
  chacune avec son `grammar_audio` si présent en local (sinon champ omis, pas de fallback bruyant).
- `distractors` (2026-07-01, nouveau) : 2–3 variantes incorrectes de l'exemple retenu — mauvaise
  particule, verbe de base substitué, registre casual/formel inversé — générées **une seule fois
  par batch IA** au pipeline de contenu (jamais au runtime), relues une fois par l'équipe de contenu.
  Alimente directement les options du mode Grammaire en combat (voir `PRD.md` § garde d'activation).
- Aucun champ en français. Aucun champ rédigé from scratch par l'IA sans relecture humaine — sélection + copie pour les champs Hanabira, génération encadrée pour `distractors` uniquement.

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
