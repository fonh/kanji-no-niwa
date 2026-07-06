# Référentiel JLPT — tout ce qu'on doit savoir, niveau par niveau (N5 → N1)

Document interne (créé 2026-07-05, suite à l'audit 01) — la « vérité pédagogique » du projet : ce qu'un
apprenant doit **savoir faire** et **connaître** à chaque niveau JLPT. Complète `curriculum-checkpoints.md`
(qui dit *où* dans le jeu) et le corpus Hanabira (qui dit *avec quelles entrées de grammaire en base*).
Ce document dit ***quoi* couvrir et dans quel ordre**.

## ⚠️ Avertissement de méthode — il n'existe PAS de liste officielle

Fait établi et vérifié : depuis la réforme de 2010, le JLPT **ne publie plus aucune liste officielle**
de kanji, vocabulaire ou grammaire. L'ancien référentiel officiel (出題基準, publié 1994, révisé 2004)
a été volontairement abandonné — position officielle : « apprendre une langue pour communiquer, pas pour
mémoriser des listes ». Il reste néanmoins la dernière source *officielle* chiffrée, et ses ordres de
grandeur font toujours consensus. Ce document est donc une **synthèse triangulée** de :

1. **Descripteurs officiels JLPT** (« Summary of Linguistic Competence », jlpt.jp) — courts mais officiels.
2. **Ancien 出題基準 (1994/2004)** — kanji/vocab/heures par niveau (l'échelle 4級→1級 recouvre N5/N4→N1 ;
   N3 a été créé en 2010 pour combler le fossé 3級→2級).
3. **JF Can-do / CECR** (Japan Foundation) : liste d'auto-évaluation officielle (déjà transcrite dans
   `curriculum-checkpoints.md` § Référence externe), + les 381 Can-dos A1-A2 du « JF Can-do for Life in
   Japan » qui fondent les manuels officiels JF (Marugoto, Irodori).
4. **Consensus des éditeurs et listes de référence** : Genki I/II (≈ N5/N4), Minna no Nihongo, TRY!,
   Nihongo Sō-matome, Shin Kanzen Master, et les listes agrégées web (JLPT Sensei : 848 points au total).
5. **Corpus Hanabira local** (`scripts/sources/grammar_JLPT_N*.json`, 828 points) — comparé au consensus
   à la fin de chaque niveau.

Règle de lecture : quand deux sources divergent sur le classement d'un point (fréquent entre N3 et N2),
c'est **le niveau du corpus Hanabira qui fait foi dans le jeu** (c'est lui qui est en base) ; ce document
sert alors de correctif éditorial (on sait qu'on enseigne ce point « un peu tôt » ou « un peu tard »).

---

## Vue d'ensemble

| Niveau | CECR | Kanji (≈) | Vocabulaire (≈) | Heures d'étude (non-sinophone) | Points de grammaire (consensus / Hanabira) | Manuels de référence | Zones du jeu |
|---|---|---|---|---|---|---|---|
| N5 | A1 | 100 | 800 | 250–400 h | ~84-100 / **136** | Genki I, Minna I, Irodori Starter | Bourg Geon → Ville Griotte (+ transition jusqu'à Mauville) |
| N4 | A2 | 300 | 1 500 | 500–750 h (cumul) | ~132 / **124** | Genki II, Minna II, Irodori Élém. | Route 31 → Doublonville |
| N3 | B1 | 650 | 3 700 | ~950-1 200 h (cumul, estimé — niveau créé en 2010, hors ancien référentiel) | ~182 / **132** | TRY! N3, Sō-matome N3, Irodori Pré-int. | Route 35 → Irisia |
| N2 | B2 | 1 000 | 6 000 | 1 400–2 000 h (cumul) | ~197 / **191** | TRY! N2, Shin Kanzen N2 | Route 42 → Routes 26-27 (intro), puis Kanto 900–1500 (Vermeille → Céladia) |
| N1 | C1 | 2 000 | 10 000 | 3 100–4 500 h (cumul) | ~253 / **245** | Shin Kanzen N1, Sō-matome N1 | Kanto tardif (1670+) → Mont Gris ; boss dès la Ligue |

Chiffres kanji/vocab/heures : ancien 出題基準 officiel (niveaux 4級/3級/2級/1級 ≈ N5/N4/N2/N1) ; N3
interpolé. Le jeu va au-delà du N1 sur les kanji : **2136 Jōyō complets** (le N1 réel en teste ~2000).

---

# N5 — Survivre en japonais (A1)

**Descripteur officiel** : « Comprendre un peu de japonais de base. Lire des expressions et phrases
typiques écrites en hiragana, katakana et kanji de base. Comprendre des conversations courtes et lentes
de la vie quotidienne et de la classe, en extraire l'information nécessaire. »

## Compétences fonctionnelles (can-do) — la liste exhaustive

Écriture et lecture :
- [ ] Lire et écrire **hiragana** (46 + voisées + combinées) et **katakana** intégralement
- [ ] Lire ~100 kanji de base (nombres, jours, directions, verbes/adjectifs fréquents)
- [ ] Lire un panneau, une enseigne, un menu simple, une étiquette de prix
- [ ] Écrire son nom, pays, adresse sur un formulaire

Se présenter et interagir :
- [ ] Se présenter (nom, nationalité, âge, profession, où on habite) et présenter quelqu'un
- [ ] Saluer selon le moment et prendre congé (おはよう/こんにちは/こんばんは/さようなら/おやすみ)
- [ ] Formules rituelles : はじめまして/よろしくお願いします/いただきます/ごちそうさま/ただいま/おかえり
- [ ] Remercier et s'excuser (ありがとう/すみません/ごめんなさい) et y répondre
- [ ] Poser les questions de base : 何/誰/どこ/いつ/どうして/どうやって/いくら/どんな

Nombres, temps, quantités :
- [ ] Compter jusqu'à 10 000 et + ; lire les prix en yens
- [ ] **Dire et demander l'heure** (〜時〜分、午前/午後、半) et la **date** (jours du mois — irréguliers
      ついたち〜とおか inclus —, jours de la semaine, mois, années)
- [ ] Utiliser les **compteurs de base** : つ、人（ひとり/ふたり）、歳、円、時、分、本、枚、冊、台、匹、回、階
- [ ] Situer dans le temps : 今日/明日/昨日/毎日/先週/来月/去年…、〜から〜まで、〜ごろ
- [ ] Exprimer la fréquence : いつも、よく、時々、あまり〜ない、全然〜ない、一日に三回

Vie quotidienne :
- [ ] Faire un **achat simple** : demander le prix, demander un objet (〜をください), payer
- [ ] **Commander** au restaurant/café ; demander l'addition
- [ ] **Demander où se trouve** quelque chose (〜はどこですか) et comprendre la réponse simple
      (ここ/そこ/あそこ、右/左/前/後ろ/上/下/中/隣/近く/間)
- [ ] Dire comment on se déplace (電車で行きます) et combien de temps ça prend (どのくらいかかりますか)
- [ ] Acheter un billet, comprendre les questions rituelles du guichet/konbini
- [ ] Parler de la météo simplement (暑い/寒い/雨/晴れ)
- [ ] Nommer sa **famille** — série humble (父/母/兄/姉/弟/妹) vs série de l'autre (お父さん/お母さん…)

Parler de soi et des autres :
- [ ] Décrire sa routine (se lever, manger, travailler, se coucher — avec heures)
- [ ] Raconter sa journée/son week-end **au passé**
- [ ] Décrire un lieu, une personne, un objet avec des adjectifs (grand/petit, nouveau/vieux, couleurs…)
- [ ] Exprimer goûts et dégoûts (〜が好き/嫌い/上手/下手)
- [ ] Exprimer un désir (〜たいです、〜がほしいです)
- [ ] Exprimer existence et possession (〜があります/います、持っています)
- [ ] Dire ce qu'on sait/peut faire simplement (〜ことができます、日本語が少しわかります)
- [ ] Comparer (AのほうがBより〜、〜がいちばん〜)
- [ ] Inviter, proposer, accepter, refuser poliment (〜ませんか、〜ましょう、ちょっと…)
- [ ] Demander la permission et l'accorder/refuser (〜てもいいですか、〜てはいけません)
- [ ] Demander à quelqu'un de faire / ne pas faire (〜てください、〜ないでください)
- [ ] Demander de répéter/parler lentement, dire qu'on n'a pas compris (もう一度、ゆっくり、わかりません)

## Morphologie et conjugaison à maîtriser

- Copule だ/です : affirmatif, négatif (じゃない/ではありません), passé (だった/でした), passé négatif
- **Verbes** : les 3 groupes (godan/ichidan/irréguliers する・来る) ; formes ます/ません/ました/ませんでした ;
  **forme て** (toutes les règles euphoniques) ; forme ない ; forme dictionnaire ; forme た
- **Adjectifs en い** : négatif (〜くない), passé (〜かった), adverbe (〜く), liaison (〜くて)
- **Adjectifs en な** : idem avec で/だった/じゃない, adverbe (〜に)
- 〜ている (action en cours ET état résultant : 住んでいます、結婚しています)
- Verbe + に行く/来る (but de déplacement)

## Particules (toutes obligatoires à ce niveau)

は・が・を・に (temps, destination, existence, but)・で (lieu d'action, moyen)・へ・と (et, avec)・
も・の (possession, nominalisation basique)・か (question, ou)・から/まで・ね/よ (finales)・
くらい/ぐらい・だけ

## Structures clés (consensus ~84-100 points ; liste des familles)

Existence あります/います ; désir 〜たい/ほしい ; invitation 〜ませんか/ましょう ; permission
〜てもいい ; interdiction 〜てはいけない ; requête 〜てください/ないでください ; capacité 〜ことができる ;
expérience simple 〜たことがある (fin N5/début N4 selon sources) ; séquence 〜てから、〜まえに、〜たあとで ;
raison から/ので (intro) ; comparaison より/のほうが/いちばん ; 〜すぎる ; 〜方 (かた) ; まだ/もう ;
〜でしょう/だろう (intro) ; 〜になる/くなる ; つもり (intro) ; どうして〜からです。

## Registre

ます/です systématique. Reconnaître (sans produire) les formes neutres entendues. Aucun keigo productif.

## Couverture Hanabira : 136 entrées N5 (vs ~84 chez JLPT Sensei)

Hanabira classe en N5 des points que d'autres mettent en N4 (généreux sur les bases) — tant mieux pour
le jeu : le pool N5 en base est riche. Pas d'écart bloquant connu à ce niveau.

---

# N4 — Fonctionner au quotidien (A2)

**Descripteur officiel** : « Comprendre le japonais de base. Lire des passages sur des sujets quotidiens
familiers écrits en vocabulaire et kanji de base. Suivre des conversations quotidiennes parlées lentement. »

## Compétences fonctionnelles (can-do)

- [ ] Raconter une **expérience** passée en détail (〜たことがあります + quand/où/comment)
- [ ] **Demander un service ou une faveur** poliment (〜てもらえませんか、〜ていただけませんか)
- [ ] Décrire les **échanges de faveurs** : あげる/くれる/もらう et 〜てあげる/〜てくれる/〜てもらう
      (choisir le bon verbe selon le point de vue — compétence charnière du japonais)
- [ ] Exprimer **intentions et projets** (〜つもりです、〜(よ)うと思っています、予定です)
- [ ] **Conseiller** et déconseiller (〜たほうがいい、〜ないほうがいい)
- [ ] Exprimer l'**obligation** et son absence (〜なければならない/なきゃ、〜なくてもいい)
- [ ] Exprimer la **probabilité** et l'incertitude (〜でしょう、〜かもしれません、〜と思います)
- [ ] Rapporter apparence et ouï-dire : 〜そうです (il semble / j'ai entendu dire — les DEUX usages),
      〜ようです/みたいです、〜らしいです (intro)
- [ ] Utiliser les **4 conditionnels** dans leurs emplois de base : 〜たら、〜と、〜ば、なら
- [ ] Exprimer le **but** (〜ために、〜ように) et l'usage (〜のに使います)
- [ ] Essayer, préparer, regretter/compléter : 〜てみる、〜ておく、〜てしまう
- [ ] La **forme potentielle** complète (食べられる、行ける…) pour parler de capacités
- [ ] Le **volitif** (行こう、しようと思う)
- [ ] Comprendre et produire le **passif** (迷惑の受身 inclus : 雨に降られた), le **causatif**
      (faire faire / laisser faire), reconnaître le **causatif-passif** (させられる)
- [ ] Donner un ordre doux (〜なさい) ; reconnaître l'impératif brut (行け/行くな)
- [ ] **Keigo — premier contact productif** : いらっしゃいます/おっしゃいます/召し上がります、伺います/参ります/
      いたします、お〜になる/お〜する ; comprendre les annonces de magasin/gare en keigo
- [ ] **Indiquer un chemin** et comprendre des directions (まっすぐ行って、二つ目の角を右に曲がって、〜を渡って)
- [ ] Expliquer un **problème de santé** chez le médecin (頭が痛いんです — 〜んです explicatif)
- [ ] Décrire des **changements** (〜くなる/になる、〜ようになる、〜ことになる/ことにする)
- [ ] Faire deux choses à la fois (〜ながら)
- [ ] **Citer et rapporter** (〜と言っていました、〜と聞きました、〜という + nom)
- [ ] S'excuser/remercier pour une action (〜てすみませんでした、〜てくれてありがとう)
- [ ] Écrire un **mail simple**, une carte postale ; lire une annonce, un mode d'emploi illustré
- [ ] Téléphoner simplement : se nommer, demander quelqu'un, dire qu'on sera en retard
- [ ] ~300 kanji, ~1 500 mots

## Morphologie nouvelle

Forme potentielle ; volitif ; passif ; causatif ; causatif-passif ; impératif ; forme ば ;
forme courte complète (base du style neutre et de toutes les subordonnées) ; nominalisation の/こと.

## Structures clés (consensus ~132 points ; familles)

〜たら/と/ば/なら ; 〜そう/よう/みたい/らしい ; あげる/くれる/もらう (×2 registres) ; 〜てみる/ておく/
てしまう ; 〜ながら ; 〜し (énumération de raisons) ; 〜のに (contraste) ; 〜ため(に) ; 〜ように/ようになる ;
〜ことになる/にする ; 〜はずです (intro) ; 〜かどうか ; question enchâssée (どこに行くか知りません) ;
〜やすい/にくい ; 〜すぎる ; お〜/ご〜 ; 〜ておく ; 〜たり〜たりする ; 〜ば〜ほど (souvent classé N3) ;
〜までに ; 〜あいだ(に).

## Couverture Hanabira : 124 entrées N4 (vs ~132) — cohérent, pas d'écart bloquant connu.

---

# N3 — Devenir autonome (B1) — le niveau charnière

**Descripteur officiel** : « Comprendre dans une certaine mesure le japonais des situations quotidiennes.
Lire des textes au contenu concret sur des sujets quotidiens ; saisir l'essentiel des titres de journaux ;
comprendre des textes un peu difficiles si des reformulations sont disponibles. Suivre une conversation
quotidienne à vitesse quasi naturelle. »

*(N3 n'existait pas avant 2010 — créé pour combler le fossé énorme entre l'ancien 3級 et le 2級. C'est
le niveau le moins bien standardisé : les listes divergent le plus ici.)*

## Compétences fonctionnelles (can-do)

- [ ] **Raconter** une histoire structurée : chronologie, connecteurs (それで、すると、ところが、そのうえ、
      つまり、要するに), arrière-plan vs premier plan
- [ ] Nuancer les **causes** : おかげで (gratitude), せいで (reproche), 〜ばかりに, 〜ことから, 〜によって
- [ ] Situer finement dans le temps : 〜うちに、〜間（に）、〜たびに、〜最中に、〜たとたん、
      le trio 〜ところだ (sur le point de / en train de / vient juste de)
- [ ] Exprimer restriction et exclusivité : 〜しかない、〜ばかり、〜だけでなく〜も、〜こそ
- [ ] La **famille わけ** (わけだ、わけがない、わけではない、わけにはいかない) et la famille はず
      (はずだ、はずがない)
- [ ] Demander avec beaucoup de précaution (〜てほしいんですが、〜ていただきたいんですが、〜させてください)
- [ ] **Keigo fonctionnel courant** : guichet, magasin, téléphone professionnel — produire sonkeigo et
      kenjōgo standards sans se tromper de direction
- [ ] Donner son **opinion et argumenter** : 〜と思う renforcé, 〜んじゃないか、〜べきだ、〜たらどうですか
- [ ] Tendances et états : 〜がち、〜気味、〜っぽい、〜ふりをする、〜まま
- [ ] Comprendre les **annonces** en gare/magasin/aéroport à vitesse réelle
- [ ] Lire : mails formels simples, articles de presse sur sujets familiers, règlements simples,
      notices — repérer l'information sans tout comprendre
- [ ] Écrire : mail semi-formel (demande, excuse, remerciement), petit récit, avis simple
- [ ] Suivre un film/anime de la vie quotidienne avec sous-titres japonais
- [ ] ~650 kanji, ~3 700 mots

## Structures clés (consensus ~182 points ; familles)

〜うちに/間に ; 〜たびに ; 〜ところ (×3) ; おかげで/せいで ; 〜わけ (×4) ; 〜はず (×2) ; 〜べき ;
〜らしい (plein usage) ; 〜っぽい/がち/気味 ; 〜みたいに/ように ; 〜ば〜ほど ; 〜ほど/くらい (degré) ;
〜に対して/について/によって/として (premières « particules composées ») ; 〜ため (cause ET but) ;
〜ことにしている/ことになっている ; 〜ようにする/ようになる ; 〜かわりに ; 〜ついでに ; 〜おきに/ごとに ;
〜きる/きれない ; 〜だす/かける/おわる (composés aspectuels) ; 〜させてもらう ; 命令形+と言われた.

## Couverture Hanabira : 132 entrées N3 (vs ~182 chez JLPT Sensei) ⚠️

C'est **le plus gros écart** : Hanabira est léger en N3 (une partie de ses points « N3 consensus » est
classée N2 chez lui, ou absente). Conséquence pour le jeu : les zones N3 (Rosalia → Irisia) ont un pool
de 132 points en base — suffisant pour les gates (10-25 points), mais l'équipe contenu doit vérifier
qu'un point « attendu N3 » existe bien en base avant de le promettre dans un dialogue (cf. précédent
だけに, absent du corpus, documenté dans `curriculum-checkpoints.md`).

---

# N2 — Le japonais de la société (B2)

**Descripteur officiel** : « Comprendre le japonais des situations quotidiennes et d'une variété de
contextes. Lire des articles et commentaires clairs, des critiques simples ; suivre conversations et
journaux télévisés à vitesse quasi naturelle, en saisir l'essentiel et les relations entre personnes. »

## Compétences fonctionnelles (can-do)

- [ ] **Débattre et nuancer** : concessions (〜ものの、〜にもかかわらず、〜といっても、〜とはいえ、〜くせに),
      hypothèses contrefactuelles, opinions tranchées vs prudentes
- [ ] Maîtriser le **japonais écrit formel** : 〜における、〜に関して/関する、〜をめぐって、〜に基づいて、
      〜に応じて、〜に伴って、〜をはじめ、〜を通じて
- [ ] Écrire un **mail professionnel** complet (objet, formules d'ouverture/clôture, keigo écrit),
      une lettre semi-officielle
- [ ] **Keigo solide en production** : soutenir un échange professionnel entier ; 二重敬語 à éviter ;
      bascules 丁寧語/尊敬語/謙譲語 correctes
- [ ] Jugements et impossibilités : 〜ざるを得ない、〜かねない/かねる、〜わけにはいかない、〜ようがない、
      〜ずにはいられない
- [ ] Tendances et évolutions : 〜つつある、〜一方だ、〜ばかりだ、〜に従って/につれて
- [ ] Degré et limites : 〜ほど〜はない、〜に限って/限らず、〜からこそ、〜さえ〜ば、〜どころか
- [ ] Lire : presse générale, éditoriaux accessibles, romans contemporains, documents administratifs
- [ ] Comprendre : JT, réunions de travail, exposés — à vitesse naturelle
- [ ] Faire un exposé préparé sur un sujet connu ; raconter avec registre adapté à l'auditoire
- [ ] ~1 000 kanji, ~6 000 mots

## Structures clés (consensus ~197 points ; familles)

Toutes les « particules composées » écrites (〜において、〜に際して、〜にあたって、〜に先立って…) ;
concessives (ものの、にもかかわらず、つつ(も)、ながらも) ; 〜ことなく/ことに/ことだから ; 〜ものだ
(nature des choses, nostalgie, exclamation) ; 〜にすぎない ; 〜にほかならない ; 〜に違いない ;
〜っこない ; 〜げ ; 〜がたい ; 〜切れない ; 〜抜く ; 〜得る/得ない ; 〜次第(で) ; 〜上(で/に) ;
〜反面/一方(で) ; 〜あまり ; 〜だけあって/だけに.

## Couverture Hanabira : 191 entrées N2 (vs ~197) — bonne. ⚠️ だけに manque toujours (voir
`curriculum-checkpoints.md` § Index Hanabira — interdiction de l'utiliser en mode Grammaire de combat).

---

# N1 — Le japonais sans filet (C1)

**Descripteur officiel** : « Comprendre le japonais dans des circonstances variées. Lire des écrits
logiquement complexes et abstraits (éditoriaux, critiques), des textes au contenu profond ; suivre
conversations, informations et conférences à vitesse naturelle, en saisir les détails, la structure
logique et les relations entre les personnes. »

## Compétences fonctionnelles (can-do)

- [ ] Comprendre **conférences, débats, actualité politique/économique** sans aide
- [ ] Lire **romans** (sentiments, intrigue, implicite), **éditoriaux**, essais, textes juridiques simples
- [ ] Manier le **style littéraire/archaïsant** : 〜べく/べからず、〜ゆえ(に)、〜んばかり、〜といえども、
      〜たりとも、〜なり、〜が早いか、〜や否や
- [ ] Registre **rituel et cérémoniel** (discours, remerciements officiels, condoléances)
- [ ] Nuances fines de blâme, d'éloge, d'ironie : 〜まじき、〜極まりない、〜に堪えない/堪える、
      〜を禁じ得ない、〜の至り/極み
- [ ] Exprimer l'inévitable et l'exceptionnel : 〜を余儀なくされる、〜ずにはおかない、〜までもない、
      〜に足る、〜にかたくない
- [ ] Écrire de façon **argumentée et structurée** (rapport, opinion motivée)
- [ ] Percevoir les **registres mélangés** (ironie par sur-politesse, brutalité par style neutre —
      exactement l'arc de Silver dans le jeu)
- [ ] ~2 000 kanji (le jeu pousse à 2 136 = Jōyō complet), ~10 000 mots

## Structures clés (consensus ~253 points ; familles)

Style écrit dur : 〜をもって、〜にあって、〜たる、〜なりに/なりの、〜ならでは、〜をおいて ;
doubles négations rhétoriques (〜ないものでもない、〜ないではすまない) ; concessives extrêmes
(〜であれ〜であれ、〜うが〜うが、〜(よ)うと(も)) ; 〜かたわら/かたがた/がてら ; 〜そばから ;
〜ともなると/ともなれば ; 〜はおろか ; 〜もさることながら ; 〜きらいがある ; 〜しまつだ ;
〜ずくめ ; 〜まみれ ; 〜っぱなし.

## Couverture Hanabira : 245 entrées N1 (vs ~253) — bonne.

---

## Ce que le JLPT ne teste PAS (et que le jeu doit couvrir quand même)

Le JLPT n'a **ni épreuve d'expression orale ni épreuve d'expression écrite**. Un référentiel « JLPT
seul » laisserait donc des trous. Les compétences suivantes viennent du CECR/JF Can-do et sont dans le
périmètre du jeu via les modes Écriture/Disposition/Grammaire-saisie (production active) :

- production de phrases complètes (mode Disposition = proxy d'expression)
- production des conjugaisons (générateur déterministe du pipeline, mode Conjugaison)
- saisie kana/IME (clavier romaji→kana, mode Saisie — « mode Écriture » renommé, audit 03 ; corrigé ici 2026-07-06, chasse aux reliques audit 04)
- lecture à voix basse / rythme de lecture (textes progressifs avec quiz)
- l'écriture manuscrite des kanji est **explicitement hors scope** (décision PRD : pas de tracé).

## Usage pour 漢字の庭

1. **Les can-dos ci-dessus = les thèmes des dialogues, leçons et textes de chaque palier.** Quand
   l'équipe contenu écrit une zone N5, elle pioche ses situations dans la liste N5 (dire l'heure à un
   PNJ, acheter au Mart, demander son chemin…) — c'est le chaînon qui manquait entre « quel point
   Hanabira » et « quelle scène écrire ». La règle « aucun lien thématique PNJ↔kanji » (PRD) reste
   intacte : les can-dos guident les *situations de dialogue*, pas l'attribution des kanji.
2. **Les gates de grammaire** (PRD, comptes de points par gym) doivent être remplis en **priorisant les
   familles listées ici** — un gate « 15 points N5 » couvert par 15 points anecdotiques serait conforme
   mécaniquement mais raterait l'esprit ; ce document dit lesquels sont structurants.
3. **Check de couverture avant écriture** : tout point promis dans un dialogue/une leçon doit exister
   dans Hanabira (le cas だけに a montré le risque). L'écart N3 (132 en base vs ~182 consensus) est le
   principal point de vigilance.
4. **Test de cohérence externe** : croiser avec la JF Can-do Self-Evaluation List déjà transcrite dans
   `curriculum-checkpoints.md` § Référence externe — un joueur au palier X du jeu doit être capable des
   items correspondants.

## Sources

- JLPT officiel — descripteurs de niveau : https://www.jlpt.jp/e/about/levelsummary.html ;
  composition des épreuves : https://www.jlpt.jp/e/guideline/testsections.html ;
  FAQ (« pas de listes officielles ») : https://www.jlpt.jp/e/faq/
- Ancien 出題基準 (1994/2004), chiffres kanji/vocab/heures et équivalences CECR :
  https://en.wikipedia.org/wiki/Japanese-Language_Proficiency_Test
- Listes de grammaire de référence (consensus éditorial) : https://jlptsensei.com/complete-jlpt-grammar-list/
  (N5 84 · N4 132 · N3 182 · N2 197 · N1 253 = 848) ; recoupé avec https://japanesetest4you.com/ et
  https://bunpro.jp/grammar_points
- Japan Foundation — JF Standard (guide utilisateur) : https://www.jfstandard.jpf.go.jp/pdf/web_whole_en.pdf ;
  Marugoto (can-dos par thème) : https://marugoto.jpf.go.jp/en/about/series/ ;
  Irodori — 381 JF Can-dos A1-A2, matériaux gratuits : https://www.irodori.jpf.go.jp/en/about.html
- Progression fonctionnelle N5/N4 : index grammaire Genki I & II par chapitre :
  https://wp.stolaf.edu/japanese/grammar-index/genki-i-ii-grammar-index/
- Corpus local : `scripts/sources/grammar_JLPT_N{1-5}.json` (828 points, comptés par script le 2026-07-05).
