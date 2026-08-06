# Carte de conception — de l'écran-titre à Falkner

Réécriture complète du 2026-08-06 (issue 13). Remplace la première ébauche
(« Séquence d'ouverture — mise en scène pas à pas »), qui donnait quatre étapes
et une intention. Ceci est la **carte de conception** du début de partie : chaque
beat, chaque gâchette, chaque tuile, chaque objet, chaque son, avec sa source.

Elle sert deux usages, et c'est volontaire :

1. **reprendre à froid** — l'état du monde est écrit en toutes lettres à la fin
   de chaque étape, donc on peut ouvrir le document à l'étape 9 sans avoir lu
   les huit précédentes ;
2. **servir de gabarit** — les ~76 zones restantes se remplissent avec la même
   grille. La méthode est en § 8, avec les pièges déjà payés.

**Périmètre :** les 7 zones du chemin critique, dans l'ordre de traversée —
`new-bark-town` → `route-29` → `cherrygrove-city` → `route-30` → `route-31` →
`violet-city` → `sprout-tower`, la Tour Grospignon conditionnant l'accès à
l'arène. 26 leçons, 140 kanji, 3 verrous, 11 dresseurs, 1 badge.

---

## 1. Conventions

**Légende d'état**, appliquée ligne par ligne :

| marque | sens |
|---|---|
| ✅ | en place dans le contenu, jouable aujourd'hui |
| 🔜 | décrit ici, pas encore posé en contenu ou en moteur |
| ➖ | hors périmètre : mécanique Pokémon sans équivalent ici (capture, échange, élevage, soin, PP) |

**Coordonnées.** Toutes les tuiles citées sont dans **notre** grille, pas celle
de la ROM. Le décompilé travaille en coordonnées monde ; la conversion est
`tile = monde − world_origin` (`src/data/zone-registry.json`) :

| zone | `world_origin` | taille grille |
|---|---|---|
| `MAP_NEW_BARK` | (672, 384) | 32 × 32 |
| `MAP_ROUTE_29` | (576, 384) | 96 × 32 |
| `MAP_CHERRYGROVE` | (512, 384) | 64 × 32 |
| `MAP_ROUTE_30` | (544, 288) | 32 × 96 |
| `MAP_ROUTE_31` | (512, 256) | 64 × 32 |
| `MAP_VIOLET` | (448, 224) | 64 × 64 |
| intérieurs (`MAP_*_1F`, `MAP_SPROUT_TOWER_*`, `MAP_VIOLET_GYM`…) | (0, 0) | propre à la pièce |

Les intérieurs ont leur propre grille : une tuile d'intérieur n'a de sens
qu'avec son `map_zone`. C'est la source du piège n°4 (§ 8).

**Orientation.** Le décompilé code la direction en entier, notre contenu en
mot : `0 = north, 1 = south, 2 = west, 3 = east`
(`scripts/build/build-npc-placements.py`).

---

## 2. Le modèle de mise en scène

Le jeu d'origine pilote sa mise en scène par des **variables de scène** — un
entier par zone (`VAR_SCENE_NEW_BARK_TOWN_OW`, `VAR_SCENE_CHERRYGROVE_CITY_OW`,
`VAR_SCENE_VIOLET_CITY_OW`…), lu au chargement de la carte pour placer les
figurants, écrit par les scripts, **souvent depuis une autre carte**. Ici,
l'équivalent est l'**étape de quête** (ADR-0007). Rien d'autre n'est nécessaire.

**Cinq leviers, et cinq seulement.** Trois portent sur un personnage, deux sur
le monde :

| levier | mécanisme | fichier |
|---|---|---|
| **présence** — il est là ou non | `unlock_conditions` (`negate: true` pour le faire partir) | `content/map/npcs.json`, `trainers.json` |
| **texte** — il ne dit pas la même chose | `state_rules` → `dialogue_states` | `content/dialogues/**` |
| **position** — il n'est plus au même endroit | `placements[]` gardés par conditions, du plus tardif au plus précoce, le premier qui tient gagne, le dernier sans condition | `content/map/npcs.json` |
| **verrou** — un franchissement est barré dans UN sens | `roadblocks.json` : décision serveur, le garde surgit, parle, repousse d'une case, repart | `content/map/roadblocks.json` |
| **leçon** — une leçon devient disponible | `sequence_index` de la zone + `unlock_conditions` de la leçon ; règle dérivée par le moteur, jamais portée par `unlock_conditions` du PNJ | `content/lessons/<zone>.json` |

**Deux règles de résolution qu'il faut avoir en tête pour lire ce document :**

- **L'histoire d'abord, toujours.** Quand un PNJ-leçon a une leçon à donner, le
  moteur sert **son dialogue** (états et Effects compris), puis ouvre
  l'écran-livre à la fermeture de la boîte (`src/app/map/actions.ts`,
  `interactWithNpc`). Un objet remis dans l'état narratif d'un PNJ-leçon arrive
  donc **au premier contact**, pas après ses leçons.
- **Une étape de quête est une variable de scène.** Toute mise en scène se
  déclenche sur une étape déjà écrite dans une quête. Si aucune étape ne
  correspond à un beat, c'est la quête qu'il faut compléter, pas le moteur.

**Ce qui n'est pas un levier** : le gate SRS quotidien. Il bloque l'entrée dans
une zone *jamais visitée* tant que la session du jour n'est pas faite, il est
évalué par `getDailySRSStatus` et **jamais** par une `Condition` (invariant de
monotonie, PRD § Boucle Quotidienne). Il peut donc interrompre le parcours
décrit ici à n'importe quelle frontière de zone extérieure, sans rien changer à
l'état du monde. Il n'est plus mentionné ensuite.

---

## 3. Vue d'ensemble

```
                 ┌── verrou 1 : Elm barre la sortie ouest ──┐
   ÉTAPE 0-2     │                                          │
   Bourg Geon ───┤ mystery_egg_errand: sent_by_elm ──────────┘
        │
        ▼  ÉTAPE 3-4
   Route 29 ────────────────────────────────────────────────┐
        │                                                    │
        ▼  ÉTAPE 5     ┌── verrou 2 : le guide barre le nord ┘
   Ville Griotte ──────┤ cherrygrove_welcome: map_given
        │
        ▼  ÉTAPE 6-7
   Route 30 ───► chez Mr. Pokémon : mystery_egg_errand: egg_received
        │                    │
        │                    └── arme l'embuscade de Silver à Griotte
        ▼  ÉTAPE 8
   Ville Griotte (retour) ───► combat Silver #1
        │
        ▼  ÉTAPE 9
   Bourg Geon (retour) ───► mystery_egg_errand: egg_delivered
        │                        └── ouvre les leçons Elm #3-#5, pose le policier,
        │                            fait apparaître Joey sur la Route 30
        ▼  ÉTAPE 10
   Route 30 ► Route 31
        │
        ▼  ÉTAPE 11    ┌── verrou 3 : le guide d'arène exige la tour ──┐
   Mauville ───────────┤                                              │
        │              │                                              │
        ▼  ÉTAPE 12    │                                              │
   Tour Grospignon 1F→2F→3F ──► TM70 (Ancien Li) ────────────────────┘
        │
        ▼  ÉTAPE 13
   Arène de Mauville ──► Rod, Abe, puis 試練・空の道 ──► ゼファーバッジ
        │
        ▼  ÉTAPE 14 (après-badge)
   Appel d'Elm ► l'assistant au Mart de Mauville ► Zuki ► Teala ► Tuscany
```

**Les trois verrous, et leur clé** (rappelés par `audit-first-gym-run.py`) :

| verrou | franchissement barré | clé | qui la donne, et où |
|---|---|---|---|
| `elm_west_exit_new_bark` | `MAP_NEW_BARK` ⇢ `MAP_ROUTE_29` | `mystery_egg_errand: sent_by_elm` | Pr. Elm, dans son labo (même carte) |
| `guide_gent_cherrygrove_tour` | `MAP_CHERRYGROVE` ⇢ `MAP_ROUTE_30` | `cherrygrove_welcome: map_given` | Guide Gent, délégué du verrou — **première réplique** |
| `gym_guide_violet_sprout_tower` | `MAP_VIOLET` ⇢ `MAP_VIOLET_GYM` | `item_owned(tm70_flash)` | Ancien Li, 3F de la Tour Grospignon (atteignable depuis Mauville sans franchir le verrou) |

**Répartition des 26 leçons** (140 kanji, budget fixé par
`curriculum-checkpoints.md`, non rediscuté ici) :

| zone | leçons | kanji | porteurs |
|---|---|---|---|
| new-bark-town | 5 | 30 | Pr. Elm (5) |
| route-29 | 4 | 20 | Burly Man (2), Man by the Grass (2) |
| cherrygrove-city | 2 | 10 | Guide Gent (1), Vendeur du Mart (1) |
| route-30 | 4 | 20 | Homme de la maison (4) |
| route-31 | 4 | 20 | Homme à l'Apricorn noir (4) |
| violet-city | 5 | 30 | Earl, Garçon blond, Garçon à lunettes, Garçon du Mart, Vendeur du Mart |
| sprout-tower | 2 | 10 | Sages de la tour (1), Ancien Li (1) |

---

## 4. Les étapes

### Étape 0 — Écran-titre → la chambre

*Étape de quête : aucune. Zone : `MAP_NEW_BARK_PLAYER_HOUSE_2F`.*

**Déclencheur** — lancement de l'application. Écran-titre à **chaque**
lancement, presse START systématique (PRD § Séquence d'ouverture) ✅ spécifié,
🔜 non implémenté.

| beat | détail | état |
|---|---|---|
| Choix d'avatar | garçon/fille (Ethan/Lyra), sprites déjà extraits | 🔜 |
| Saisie du nom | clavier romaji→kana, champ vide, aucun nom pré-rempli | 🔜 |
| Réveil dans la chambre | le joueur apparaît au 2F de sa maison | 🔜 point d'apparition non modélisé |
| **PC de la chambre** (9,5) | `kind: object`, aucun fichier de dialogue : le moteur applique lui-même `unlock_text(lyra_mail_new_bark)` et ouvre la fenêtre de lecture (`engine-contract.md` § 2) | ✅ |

**Dialogue** — aucun. **Sac** — vide. **Audio** — `new-bark-town.mp3` dès le
chargement de la pièce (règle « intérieur sans piste propre = piste de la zone
d'accès », `content/map/zones.json`) ; `SFX.stairs` en descendant au 1F.

> **État du monde — fin d'étape 0**
> · Inventaire : vide.
> · Quêtes : aucune.
> · Zones ouvertes : Bourg Geon et ses intérieurs. Route 29 **barrée** (verrou `elm_west_exit_new_bark`).
> · PNJ présents : Maman (maison 1F, 6,6), Pr. Elm (labo 1F, 4,5), son assistant (labo 1F, 9,12), Silver (extérieur, 10,7), PC (chambre 2F, 9,5). Lyra/Ethan **absente** de la carte extérieure (elle est chez elle, 2F).
> · Leçons disponibles : aucune.
> · Texte débloqué : `lyra_mail_new_bark` si le PC a été lu.

---

### Étape 1 — Maman, au rez-de-chaussée

*Étape de quête : aucune. Zone : `MAP_NEW_BARK_PLAYER_HOUSE_1F`.*

**Déclencheur** — parler à Maman en (6,6), face à l'est, depuis une tuile
adjacente. La tuile-porte de la maison est en (23,12) côté extérieur : Maman
n'est **pas** dessus (correction issue 12 — elle bloquait l'entrée).

**Qui parle, quoi** — `mom_new_bark`, état `intro`, N5 :

> おかえりなさい。／ エルムはかせが、あなたを　さがしていましたよ。／
> けんきゅうじょへ　いってください。

**Sac** ➖ Le guidebook attribue à Maman le déblocage du Sac et de la Carte
Dresseur ; ni l'un ni l'autre n'est un `item_id` chez nous (ce sont des écrans
de menu) — beat conservé en flaveur, aucun `Effect`. 🔜 Aucun prompt はい/いいえ ;
il n'en faut pas ici (réplique unique, sans choix).

**Mouvements / apparitions** — aucun. **Musique** — `new-bark-town.mp3`.
**SFX** — `SFX.textAdvance` à chaque page ; `SFX.doorOpen` en sortant.

> **État du monde — fin d'étape 1** — identique à l'étape 0. Aucune quête n'a
> avancé : parler à Maman est un panneau indicateur, pas une étape.

---

### Étape 2 — Le labo : le compagnon, et la mission

*Étape de quête après : `mystery_egg_errand: sent_by_elm`.
Zone : `MAP_NEW_BARK_ELMS_LAB_1F` (porte extérieure en (12,9), abordée depuis (12,10)).*

**Déclencheur** — entrer dans le labo puis parler au Pr. Elm en (4,5), face au
sud. Position sourcée : le script de transition du labo place explicitement Elm
en `MovePersonFacing(4, 0, 5, DIR_SOUTH)` pour les scènes 0, 3 et 8 —
c'est-à-dire tout le début de partie (`scr_seq_0843_T20R0101.s`,
`scr_seq_T20R0101_010`).

**Qui parle, quoi** — trois personnages dans la pièce, trois rôles distincts :

| qui | tuile | état de dialogue | contenu | état |
|---|---|---|---|---|
| Assistant d'Elm | (9,12) ouest | `not_the_professor` | « え、ぼく？　はかせじゃ　ないよ。／ はかせは　おくに　いるよ。 » — reprise directe de `msg_0543_T20R0101_00018` | ✅ |
| Pr. Elm | (4,5) sud | `welcome` | explique ses recherches, fait choisir le compagnon, envoie chez Mr. Pokémon, demande qu'on l'appelle en chemin | ✅ |
| Policier | (3,6) est | — | **absent** (`unlock_conditions: egg_received`) | ✅ |

Le **choix du compagnon** est une entrée `pages[]` de type `companion_choice`
(options tirées de `content/companions.json`, `Effect.set_companion`). Seul
Pikachu est confirmé ; `tbd_2`/`tbd_3` restent indisponibles tant que le dump
des sprites *follower* HGSS n'est pas vérifié. ✅ modélisé, 🔜 deux slots vides.

**Où un prompt はい/いいえ serait souhaitable** — ici, et c'est le seul endroit
du chemin critique où il manque vraiment : le jeu d'origine demande
« Can we count on you? » avant d'engager le joueur
(`msg_0543_T20R0101_00004`). Un はい/いいえ purement rhétorique (いいえ → Elm
réinsiste, boucle) donnerait au départ le poids qu'il n'a pas aujourd'hui. 🔜

**Effets à la fermeture du dialogue** :

- `advance_quest(mystery_egg_errand, sent_by_elm)` ✅
- `set_companion(<choix>)` ✅

**Sac** ➖ Les 5 Potions que l'assistant remet dans HGSS n'ont pas d'objet ici :
il n'y a ni PV ni soin (les vies d'un examen se restaurent par section, jamais
par objet). Le beat est absorbé par sa réplique d'accueil.

**Ce qui change ailleurs, immédiatement :**

| levier | effet | source | état |
|---|---|---|---|
| verrou | `elm_west_exit_new_bark` **levé** | `scr_seq_0842_T20.s` : `VAR_SCENE_NEW_BARK_WEST_EXIT` | ✅ |
| présence | **Lyra/Ethan apparaît** en extérieur, (14,12) face à l'ouest | `scr_seq_T20_009` : `ClearFlag FLAG_HIDE_NEW_BARK_FRIEND` + `MovePersonFacing obj_T20_var_1, 686, 0, 396, DIR_WEST` quand `VAR_SCENE_NEW_BARK_TOWN_OW = 1` | ✅ |
| présence | Silver **reste** posté en (10,7), contre la clôture du labo | `FLAG_HIDE_NEW_BARK_RIVAL` n'est posé qu'à l'étape 7 | ✅ |
| texte | Maman passe à `give_pokegear` | `state_rules` sur `sent_by_elm` | ✅ |
| texte | Elm passe à `sent_off` (« はやく　いって　ください。 ») | — | ✅ |
| leçons | **leçons #1 et #2 de Bourg Geon débloquées** (`unlock_conditions: sent_by_elm`), portées par Elm | `content/lessons/new-bark-town.json` | ✅ |

C'est le **bootstrap Elm** du PRD : 2 leçons avant le départ, 3 au retour. Le
gate de leçon garantit que la toute première approche d'Elm sert `welcome` et
non l'écran-livre.

**Audio** — `new-bark-town.mp3` ; `SFX.textAdvance` ; 🔜 pas de jingle
« compagnon obtenu » (la ROM joue `SEQ_ME_POKEGET`) ; `SFX.itemGet` existe mais
n'est pas branché ici, aucun objet n'entrant dans le sac.

> **État du monde — fin d'étape 2**
> · Inventaire : vide. Compagnon choisi.
> · Quêtes : `mystery_egg_errand = sent_by_elm`.
> · Zones ouvertes : Bourg Geon **+ Route 29**. Sortie de Griotte vers Route 30 barrée (pas encore atteinte).
> · PNJ présents à Bourg Geon : Maman (maison 1F, état `give_pokegear`), Pr. Elm (labo, `sent_off`, 2 leçons en attente), son assistant (labo, `not_the_professor`), Lyra/Ethan (extérieur 14,12), Silver (extérieur 10,7), PC (chambre).
> · Leçons disponibles : new-bark-town #1 et #2 (12 kanji), chez Elm.
> · Dresseurs pouvant engager : aucun.

---

### Étape 3 — Sortir de Bourg Geon

*Étape de quête : `sent_by_elm`. Zone : `MAP_NEW_BARK`.*

**Déclencheur** — sortir du labo (`SFX.doorOpen`), traverser la ville vers
l'ouest.

| qui | tuile | ce qu'il dit / fait | état |
|---|---|---|---|
| Lyra/Ethan | (14,12) | `intro` : « もう　パソコンを　みた？　メールを　おいて　おいたよ。 » — renvoie au PC de la chambre | ✅ |
| Silver | (10,7) | `intro` : « …… ／ ……なんでもない。 » L'alcôve (9-10, 7) est **la fenêtre du labo** : c'est le rôle sourcé (« aperçu en train d'espionner le labo »). 🔜 le repoussement scripté de HGSS (`scr_seq_T20_000`, `ApplyMovement obj_player`) n'est pas modélisé — chez nous il se contente de parler | ✅ / 🔜 |
| Maman | maison 1F (6,6) | `give_pokegear` → **Pokégear** au sac | ✅ |

**Objet remis** — `pokegear`, par Maman, état `give_pokegear`, `SFX.itemGet` ✅
(🔜 aucune animation « objet obtenu » ; seul le son existe). Ce timing — le
Pokégear **avant** le départ, pas au retour — est une correction déjà actée
(audit 2026-07-17) : sans lui, l'ordre d'Elm « appelle-moi en chemin » et les
appels de la Route 30 sont injouables au premier passage.

**Le verrou, s'il n'a pas été levé** — `elm_west_exit_new_bark` : le Pr. Elm
sort du labo en courant, se poste en (6,14) face à l'ouest, dit trois pages
(« まって、まって！ / ひとりで　いくのは　あぶないよ。 / ラボに　きて。 »), le
joueur est repoussé d'une case, Elm repart. Le déclencheur d'origine est la
colonne x = 4, lignes 12→18 (`COORD` de `057_T20.json`, `w=1 h=7`) ; notre
poste de garde en (6,14) couvre le même goulot. ✅

**Audio** — `new-bark-town.mp3` ; `SFX.bump` sur le repoussement du verrou ✅ ;
🔜 la ROM joue un stinger dédié quand Elm surgit, on n'en a pas.

> **État du monde — fin d'étape 3**
> · Inventaire : **Pokégear**.
> · Quêtes : `mystery_egg_errand = sent_by_elm`.
> · Zones ouvertes : Bourg Geon, Route 29.
> · PNJ : inchangés depuis l'étape 2 ; Maman reste sur `give_pokegear` (Effect idempotent, la relire ne redonne rien).
> · Leçons : new-bark-town #1, #2 chez Elm.

---

### Étape 4 — Route 29, d'est en ouest

*Étape de quête : `sent_by_elm`. Zone : `MAP_ROUTE_29` (96 × 32, on la traverse d'est en ouest).*

**Déclencheur** — franchir la bordure ouest de Bourg Geon.

| qui / quoi | tuile | rôle | état |
|---|---|---|---|
| **Panneau d'entrée de Johto** | (2,11), lu depuis (2,12) | `kind: sign`, aucun dialogue : le moteur applique `unlock_text(johto_entrance_sign_route29)` (`engine-contract.md` § 2) | ✅ |
| **Burly Man** | (46,8) sud | PNJ-leçon — **leçons route-29 #1 et #2**. Réplique narrative sur les rebords à sens unique, puis écran-livre | ✅ |
| **Man by the Grass** | (24,11) sud | PNJ-leçon — **leçons route-29 #3 et #4** | ✅ |
| Lyra/Ethan | (85,16) ouest | **absente** (`unlock_conditions: egg_received`) — elle n'attend ici qu'au retour | ✅ |
| Tuscany | (53,21) sud | **absente** — mardi **et** badge de Falkner requis, fidèle au décompilé (`scr_seq_0225_R29.s` : `CheckBadge BADGE_ZEPHYR` puis `GetWeekday == 2`) | ✅ |
| Grille vers Route 46 | warp (50,5) | 🔒 rebord à sens unique, « reviens plus tard » | ➖ hors périmètre |

> **Correction apportée par cette passe.** Les 4 leçons de la Route 29 étaient
> portées par **Tuscany**. Or Tuscany n'existe que le mardi *et* seulement après
> le badge de Falkner : 20 des 140 kanji « d'avant la première arène » étaient
> hors d'atteinte avant la première arène, et la route se traversait sans une
> seule leçon à l'aller. Le curriculum n'a pas bougé (mêmes groupes, mêmes
> index) — seuls les porteurs changent, pour deux PNJ ambiants **sourcés du
> décompilé** (`obj_R29_gsbigman`, `obj_R29_gsman1`, sans drapeau conditionnel),
> rencontrés dans l'ordre en marchant d'est en ouest. Tuscany garde son rôle
> d'origine et son TwistedSpoon. `audit-first-gym-run.py` refuse désormais ce
> motif.

**Dresseurs** — aucun, et c'est délibéré : la Route 29 se traverse sans combat
dans le jeu d'origine, décision de fidélité stricte déjà tranchée
(`guidebook-adapted.md` § route-29).

**Audio** — `route-29.mp3` ; écran-livre : `LESSON_TRACKS`, piste choisie
déterministiquement par `lessonTrackForLesson(zoneId, sequenceIndex)`.

> **État du monde — fin d'étape 4**
> · Inventaire : Pokégear.
> · Quêtes : `mystery_egg_errand = sent_by_elm`.
> · Zones ouvertes : Bourg Geon, Route 29, **Ville Griotte** (aucun verrou à cette frontière).
> · Leçons faites possibles : new-bark #1-2 (12 kanji) + route-29 #1-4 (20 kanji) = **32 kanji** atteignables à ce stade.
> · Textes : `johto_entrance_sign_route29` si le panneau a été lu.

---

### Étape 5 — Ville Griotte : la visite guidée

*Étape de quête après : `cherrygrove_welcome: map_given`. Zone : `MAP_CHERRYGROVE`.*

**Déclencheur** — entrer dans la ville par l'est. Dans la ROM, un `COORD` en
(54, 13→16) — juste au sud du guide, posté en (54,12) — déclenche
`scr_seq_T21_001` tant que `VAR_SCENE_CHERRYGROVE_CITY_OW = 0`.

**Ce que fait la ROM, et ce que nous faisons.** Le jeu d'origine coupe la scène
en **deux** : la visite guidée d'abord (le guide marche, s'arrête au Centre, au
Mart, montre la route du nord, la mer — `SEQ_SE_GS_N_UMIBE` en fond — puis remet
les **Running Shoes** devant sa maison et disparaît, `VAR = 1`), puis, quand le
joueur veut partir vers le nord (`COORD` en (35→38, 1)), le guide **revient en
courant** pour la **Map Card** (`RegisterPokegearCard 1`,
`PlayFanfare SEQ_ME_KEYITEM`) et repart (`VAR = 2`). Deux allers, deux objets.

Chez nous, **la visite remet les deux en une seule fois**, et c'est un écart
assumé (décidé le 2026-08-06) : couper en deux obligeait à revenir réclamer un
objet dont on a besoin tout de suite, et faisait livrer la réplique d'adieu du
guide comme un blocage. Le verrou se lève donc **dès sa première réplique**.

| qui | tuile | état | contenu | état |
|---|---|---|---|---|
| **Guide Gent** | (54,12) sud | `intro` | accueil, Centre, Mart, route du nord, mer, chaussures, Map Card, au revoir — 8 pages | ✅ |
| Guide Gent | — | `farewell` | après `map_given` : « また　あったね。／ きたの　みちは　まだ　さきが　ながいよ。 » | ✅ |
| Employée du Centre | `MAP_CHERRYGROVE_POKECENTER_1F` (15,5) | `intro` | « きょうの　セッションは　もう　しましたか？ » — troisième point d'entrée de la session SRS | ✅ |
| Vendeur du Mart | `MAP_CHERRYGROVE_POKEMART` (8,3) sud | `greeting` | PNJ-leçon — **leçon cherrygrove #2** | ✅ |
| Silver | (60,13) | **absent** (`unlock_conditions: egg_received`) | l'embuscade est armée depuis la maison de Mr. Pokémon, étape 7 | ✅ |
| Carte de dresseur | (59,13) | **absente** (`npc_cleared(silver_apparition1_cherrygrove)`) | — | ✅ |

**Objets remis** — `running_shoes` et `map_card`, par le Guide Gent, état
`intro`, `SFX.itemGet` ✅ (🔜 la ROM distingue `SEQ_ME_ITEM` et `SEQ_ME_KEYITEM` ;
nous n'avons qu'un son). ➖ Les Running Shoes n'ont aucun effet mécanique ici
(pas de course modélisée) : objet narratif.

**Quête** — `advance_quest(cherrygrove_welcome, map_given)`, l'unique étape de
cette quête. ✅

**Verrou** — `guide_gent_cherrygrove_tour` barre `MAP_CHERRYGROVE ⇢ MAP_ROUTE_30`.
Garde posté en (36,5) face au nord, sprite `SPRITE_GSOLDMAN1`, trois pages
(« おっと、そんなに　いそがないで。 / この　まちを　あんないさせて　おくれよ。 /
そのあとで　マップカードを　あげるからね。 »). Le verrou **délègue** au PNJ
curaté `guide_gent_cherrygrove` : le joueur est arrêté **une fois**, entend la
visite, passe. `lint-roadblocks.py` refuse toute autre disposition. ✅

**Leçons** — cherrygrove #1 est portée par le Guide Gent avec
`unlock_conditions: map_given` : elle ne s'ouvre donc **qu'après** la visite,
jamais à sa place. cherrygrove #2 est chez le vendeur du Mart. ✅

🔜 **Non modélisé** : la marche du guide le long de la visite (il reste sur sa
tuile pendant que le texte défile), et le fait qu'il **disparaisse** ensuite
(`FLAG_HIDE_CHERRYGROVE_GUIDE_GENT`). Chez nous il reste, en état `farewell` —
c'est volontaire : il porte une leçon et doit rester joignable.

**Audio** — `cherrygrove-city.mp3` en ville ; `pokemon-center.mp3` au Centre
(règle « piste propre du bâtiment ») ; `cherrygrove-city.mp3` au Mart ;
🔜 aucune piste de « suite » pendant la visite (la ROM joue
`std_play_follow_music`), aucune ambiance de mer.

> **État du monde — fin d'étape 5**
> · Inventaire : Pokégear, Running Shoes, Map Card.
> · Quêtes : `mystery_egg_errand = sent_by_elm` ; `cherrygrove_welcome = map_given` (terminée).
> · Zones ouvertes : Bourg Geon, Route 29, Ville Griotte, **Route 30**.
> · PNJ à Griotte : Guide Gent (54,12 — `farewell`, leçon #1 disponible), Employée du Centre, Vendeur du Mart (leçon #2). Silver absent, carte de dresseur absente.
> · Leçons atteignables cumulées : 12 + 20 + 10 = **42 kanji**.

---

### Étape 6 — Route 30, du sud au nord

*Étape de quête : `sent_by_elm`. Zone : `MAP_ROUTE_30` (32 × 96, on la remonte du sud vers le nord).*

**Déclencheur** — franchir la sortie nord de Ville Griotte.

| qui | tuile | rôle | état |
|---|---|---|---|
| **Bug Catcher Don** | (6,10) est, portée 4 | dresseur, 5 questions, cône de vision → combat automatique au premier passage | ✅ |
| **Youngster Mikey** | (8,37) sud, portée 4 | dresseur, 5 questions | ✅ |
| **Youngster Joey** | (9,44) ouest, portée 4 | **absent** à l'aller (`unlock_conditions: egg_delivered`) | ✅ |
| **Homme de la maison** | `MAP_ROUTE_30_APRICORN_HOUSE` (5,5) sud, porte en (11,67) | PNJ-leçon — **4 leçons** ; sa réplique narrative remet l'**Apricorn Box** au premier contact, puis état `after_gift` | ✅ |
| Maison de Mr. Pokémon | porte en (24,6) | étape 7 | ✅ |

> **Correction apportée par cette passe.** Joey était présent dès le premier
> passage. Le décompilé dit l'inverse : `FLAG_HIDE_ROUTE_30_YOUNGSTER_JOEY` est
> posé au démarrage de partie (`scr_seq_0149.s:129`) et n'est levé qu'à la
> **remise de l'œuf à Elm** (`scr_seq_0843_T20R0101.s:759`). À l'aller, sa tuile
> est occupée par une scène de deux dresseurs en plein combat
> (`FLAG_HIDE_ROUTE_30_BATTLERS`) — mise en scène ➖ hors périmètre chez nous,
> mais le gate de présence, lui, est en place.

> **Correction apportée par cette passe (2).** Les PNJ-leçon à plusieurs leçons
> rejouaient leur réplique de remise de cadeau — Effect compris — **avant chaque
> leçon**, puisque le moteur sert le dialogue avant d'ouvrir l'écran-livre.
> L'Effect est idempotent, rien n'était cassé, mais le joueur s'entendait offrir
> quatre fois la même Apricorn Box. Un état `after_gift`, sélectionné sur
> `item_owned`, règle le cas ici et sur cinq autres PNJ (Route 31, Tuscany,
> Ancien Li, Teala, Lyra Route 31).

**Objet remis** — `apricorn_box`, `SFX.itemGet` ✅. ➖ La cueillette d'Apricorns
elle-même n'existe pas.

**Dresseurs — comment ils s'engagent.** `trigger_type: sight_auto`,
`sight_auto_result: battle`, `repeats: false` : le combat part **seul** dès que
le joueur entre dans le cône (facing + portée 4), une seule fois. Ensuite le
dresseur devient Talk-only et sert son état `post_battle`. Musique de combat :
`CONTEXT_TRACKS.battleTrainer` ; `SFX.victoryJingle` à la victoire ✅.

**Appel téléphonique** — la ROM déclenche ici un appel d'Elm
(`VAR_SCENE_ROUTE_30_PHONE_CALL`, `COORD` en haut de la route). 🔜 chez nous le
téléphone du Pokégear n'est pas encore dans le menu.

**Audio** — `route-30.mp3` ; intérieurs : même piste.

> **État du monde — fin d'étape 6**
> · Inventaire : Pokégear, Running Shoes, Map Card, **Apricorn Box**.
> · Quêtes : `mystery_egg_errand = sent_by_elm`.
> · Zones ouvertes : + Route 30.
> · Dresseurs battus : Don, Mikey (si croisés — leurs cônes barrent le chemin, ils le sont).
> · Leçons atteignables cumulées : 42 + 20 = **62 kanji**.

---

### Étape 7 — Chez Mr. Pokémon : l'œuf, et le Pokédex

*Étape de quête après : `mystery_egg_errand: egg_received`.
Zone : `MAP_ROUTE_30_MR_POKEMON_HOUSE` (porte extérieure en (24,6)).*

**Déclencheur** — entrer dans la maison et parler à Mr. Pokémon, en (9,7) face
à l'ouest ; le Pr. Oak est à côté, en (8,7) face à l'est, tourné vers lui.
Positions ROM (`obj_R30R0201_gsgentleman`, `obj_R30R0201_ookido`).

**C'est le pivot de tout le début de jeu.** Une seule pièce, deux répliques, et
**trois autres cartes** changent d'état.

| qui | état | contenu | Effects | état |
|---|---|---|---|---|
| Mr. Pokémon | `intro` | « よく　きたね。／ これを　あげよう。／ ふしぎな　たまごだよ。／ だいじに　そだててね。 » | `grant_item(mystery_egg)`, `advance_quest(egg_received)` | ✅ |
| Pr. Oak | `intro` | « おお、きみが　うわさの　こか。／ これを　どうぞ。／ ポケモンずかんだ。 » | `grant_item(pokedex)` | ✅ |
| Mr. Pokémon | `after` | « たまご、げんきかな？ » | — | ✅ |

**Objets** — `mystery_egg` (Mr. Pokémon), `pokedex` (Pr. Oak). `SFX.itemGet` ✅.
🔜 le Pr. Oak enregistre son numéro au Pokégear dans la ROM
(`RegisterGearNumber PHONE_CONTACT_PROF__OAK`) — pas de registre téléphonique
chez nous. ➖ le soin d'équipe (`HealParty`) et le `SetSpawn SPAWN_CHERRYGROVE`
n'ont pas d'équivalent.

**Ce que cette pièce arme ailleurs** — `scr_seq_0229_R30R0201.s`, lignes 263-273 :

| carte | changement | mécanisme chez nous | état |
|---|---|---|---|
| Ville Griotte | **Silver apparaît** en (60,13), cône sud portée 4 → embuscade | `unlock_conditions: egg_received` sur `silver_apparition1_cherrygrove` | ✅ |
| Ville Griotte | `VAR_SCENE_CHERRYGROVE_CITY_OW = 3` | l'étape de quête EST la variable | ✅ |
| Bourg Geon | **Silver disparaît** de la clôture du labo (`SetFlag FLAG_HIDE_NEW_BARK_RIVAL`) | `negate` sur `egg_received` | ✅ |
| Bourg Geon | **le policier apparaît** dans le labo (`ClearFlag FLAG_HIDE_ELMS_LAB_OFFICER`) | `unlock_conditions: egg_received` | ✅ |
| Route 30 | `VAR_SCENE_ROUTE_30_OW = 2` (l'homme aux Apricorns rentre chez lui) | ➖ | ➖ |
| Chez Mr. Pokémon | le Pr. Oak part (`FLAG_HIDE_MR_POKEMONS_HOUSE_OAK`) | 🔜 pas de `negate` sur lui | 🔜 |

C'est **la règle générale n°2** : une scène peut être armée depuis une autre
zone. La condition est globale, la mise en scène est locale ; aucun mécanisme
de « déclencheur à distance » n'est nécessaire.

**Audio** — `route-30.mp3` ; 🔜 la ROM coupe la musique, joue `SEQ_ME_ASA` puis
le thème d'Oak (`SEQ_GS_OHKIDO`) — nous n'avons ni l'un ni l'autre.

> **État du monde — fin d'étape 7**
> · Inventaire : Pokégear, Running Shoes, Map Card, Apricorn Box, **Œuf mystère**, **Pokédex**.
> · Quêtes : `mystery_egg_errand = egg_received`.
> · Zones ouvertes : inchangées.
> · PNJ apparus : Silver à Griotte (dresseur, embuscade), policier au labo d'Elm, Lyra/Ethan sur la Route 29 (85,16).
> · PNJ disparus : Silver à Bourg Geon.
> · Textes de dialogue changés : Maman → `welcome_back`, Pr. Elm → `welcome_back`, Mr. Pokémon → `after`.

---

### Étape 8 — Retour : l'embuscade de Ville Griotte

*Étape de quête : `egg_received`. Zone : `MAP_CHERRYGROVE`.*

**Déclencheur** — redescendre la Route 30 et rentrer dans Ville Griotte. Silver
est posté en (60,13), face au sud, portée 4 : sa ligne de vue couvre
(60,14)→(60,17), c'est-à-dire **toute** la traversée est-ouest du goulot —
prouvé par BFS dans `src/lib/a1-traversal.test.ts`. On ne peut pas le contourner.

*(La colonne d'embuscade du jeu d'origine est x = 63-64 ; la nôtre est décalée
de trois tuiles vers l'ouest pour tomber sur le vrai goulot de notre grille, la
tuile ROM d'origine étant une tuile de parcage d'objet piloté par script.)*

**Combat** — `silver_apparition1_cherrygrove`, `battle_length: 12`, 2 vies
(Silver apparition #1 de la table PRD § Silver — 6 Rencontres).

| état | contenu |
|---|---|
| `battle_intro` | « おまえが　あたらしい　こぞうか。／ エルムの　ところの。／ おれの　力（ちから）を　みせてやる。 » |
| `post_battle` | « ふん。／ まあ　いいさ。／ またな。 » |

**Après le combat** — l'objet `silver_card_cherrygrove` apparaît en (59,13),
`unlock_conditions: npc_cleared(silver_apparition1_cherrygrove)` : « とれーなーカードが
おちている。／ 「シルバー」と　かいてある。 » ✅

*Écart documenté :* dans la ROM, Silver bouscule le joueur
(`SEQ_SE_DP_WALL_HIT2`), **laisse tomber** sa carte, la reprend et découvre
qu'on a lu son nom (`msg_0550_T21_00015`). Chez nous c'est un objet trouvé —
adaptation assumée : une révélation d'une phrase n'a pas la valeur pédagogique
d'une lecture, et forcer un quiz dessus aurait été absurde.

**Audio** — `battle-trainer.mp3` pendant le combat, `SFX.victoryJingle` à la
victoire, retour à `cherrygrove-city.mp3` ✅. 🔜 la ROM a un thème de rival
dédié (`std_play_rival_intro_music` / `outro`).

> **État du monde — fin d'étape 8**
> · Inventaire : inchangé.
> · Quêtes : `mystery_egg_errand = egg_received`.
> · Dresseurs battus : Don, Mikey, **Silver #1**.
> · PNJ : la carte de dresseur est lisible en (59,13). Silver reste sur la carte en tant que dresseur battu (Talk-only, `post_battle`).

---

### Étape 9 — Retour au labo : l'œuf remis

*Étape de quête après : `mystery_egg_errand: egg_delivered`.
Zone : `MAP_NEW_BARK_ELMS_LAB_1F`.*

**Déclencheur** — rentrer à Bourg Geon. Deux répliques changent avant même
d'entrer dans le labo :

| qui | où | état | contenu |
|---|---|---|---|
| Maman | maison 1F (6,6) | `welcome_back` | annonce le cambriolage : « けんきゅうじょに　どろぼうが　はいったの。／ あかいかみの　おとこのこだったって。 » (filet de sécurité `grant_item(pokegear)`, inerte) |
| Policier | labo (3,6) | `intro` | « あかいかみの　おとこのこを　みなかった？ » |

> **Correction apportée par cette passe.** Le policier était servi en (19,6) de
> la zone **extérieure**, position générée. Son objet ROM existe pourtant —
> `obj_T20R0101_policeman`, `058_T20R0101.json` — et vit **dans le labo**, en
> (3,6). Même bug de fond que Maman et Elm avant l'issue 12 (PNJ d'intérieur
> aplati sur la zone extérieure), jamais corrigé pour lui. C'est aussi ce que
> dit la scène : il enquête sur le vol dans le labo cambriolé.

> **Correction apportée par cette passe (2).** Silver disparaissait de Bourg
> Geon dès `sent_by_elm`. `FLAG_HIDE_NEW_BARK_RIVAL` n'est en fait posé qu'ici
> (`scr_seq_0229_R30R0201.s:266`) : il reste devant le labo pendant **toute** la
> course, et n'a disparu qu'au retour, au moment exact où Maman annonce le vol.
> La scène tient debout ; l'ancienne version faisait s'évaporer le suspect avant
> le crime.

**Le beat central** — parler au Pr. Elm, état `welcome_back` :

> おお、かえってきたね！／ たまごを　もらったんだね。／ だいじに　あずかりますよ。／
> ときどき　わるい　ひとが　います。／ きを　つけてね。

`Effect: advance_quest(mystery_egg_errand, egg_delivered)` → la quête est
**terminée** (`completed_quests`). ✅

🔜 **Où un prompt はい/いいえ serait souhaitable (2)** : « Confies-tu l'œuf au
professeur ? ». Le geste est irréversible du point de vue du joueur et c'est le
seul moment du parcours où l'on se sépare d'un objet.

➖ L'œuf reste dans le sac (`remove_item` non posé) : il n'y a pas d'éclosion,
et le rendre nécessaire à l'étape 14 (l'assistant vous le « rend ») demanderait
un aller-retour d'objet sans contrepartie mécanique.

**Ce que la livraison change :**

| levier | effet | source | état |
|---|---|---|---|
| leçons | **leçons Bourg Geon #3, #4, #5 débloquées** chez Elm (18 kanji) | `unlock_conditions: egg_delivered` | ✅ |
| présence | **Youngster Joey apparaît** sur la Route 30 (9,44) | `ClearFlag FLAG_HIDE_ROUTE_30_YOUNGSTER_JOEY` | ✅ |
| présence | Lyra/Ethan attend sur la Route 29 (85,16) — apparue dès `egg_received` | `ClearFlag FLAG_HIDE_ROUTE_29_FRIEND` | ✅ |
| texte | Elm → `egg_care` ; son assistant → `egg_kept` | `state_rules` | ✅ |
| texte | Maman propose de gérer l'épargne | — | 🔜 |
| — | Lyra/Ethan fait une démonstration de **capture** sur la Route 29 | ➖ pas de capture ; le beat est réattribué à un tutoriel du Kanjidex, déjà écrit dans son dialogue | ➖ |

**Audio** — `new-bark-town.mp3` ; `SFX.itemGet` ✅ (🔜 la ROM joue
`SEQ_ME_ITEM` sur la remise, nous n'avons qu'un son générique).

> **État du monde — fin d'étape 9**
> · Inventaire : Pokégear, Running Shoes, Map Card, Apricorn Box, Œuf mystère, Pokédex.
> · Quêtes : `mystery_egg_errand` **terminée** ; `cherrygrove_welcome` terminée.
> · Zones ouvertes : Bourg Geon, Route 29, Ville Griotte, Route 30.
> · PNJ à Bourg Geon : Maman (`welcome_back`), Elm (`egg_care`, 3 leçons en attente), assistant (`egg_kept`), policier (labo), Lyra (14,12), PC. Silver **parti**.
> · Leçons atteignables cumulées : 62 + 18 = **80 kanji**.
> · Dresseurs pouvant engager : Joey (Route 30, 9,44).

---

### Étape 10 — Route 30 rejouée, puis Route 31

*Étape de quête : quête terminée — la progression passe désormais par les leçons et les badges.
Zones : `MAP_ROUTE_30` puis `MAP_ROUTE_31`.*

**Déclencheur** — remonter vers le nord. La Route 30 débouche sur la Route 31,
qui mène à l'ouest vers Mauville.

| qui | zone / tuile | rôle | état |
|---|---|---|---|
| Youngster Joey | Route 30 (9,44) ouest, portée 4 | dresseur, 5 questions — **nouveau** depuis l'étape 9 | ✅ |
| **Bug Catcher Wade** | Route 31 (28,23) nord, portée 4 | dresseur, 7 questions | ✅ |
| **Homme à l'Apricorn noir** | Route 31 (32,15) sud | PNJ-leçon — **4 leçons route-31** ; sa réplique narrative confie un message pour « Kenya » et remet **TM44 Rest** au premier contact, puis `after_gift` | ✅ |
| **Lyra/Ethan** | Route 31 (26,13) sud | remet le **Vs. Recorder**, puis `after_gift` | ✅ |
| Grotte Sombre | warp (53,13) | 🔒 nécessite le CS 光 — teasée par le décor | ➖ hors périmètre |
| Poste-frontière de Mauville | warp (6,13) | passage vers `MAP_VIOLET` | ✅ |

*Écart mineur relevé, non corrigé :* l'objet ROM de l'homme à l'Apricorn noir
(`obj_R31_gsbigman`) est en (28,15), quatre tuiles à l'ouest de notre (32,15).
Les deux tuiles sont praticables et voisines de l'arbre à Apricorn noir ; la
nôtre est une position générée, laissée telle quelle faute de gain — 🔜 à
recaler à la prochaine passe de positions.

**Objets** — `tm44_rest`, `vs_recorder`. `SFX.itemGet` ✅. ➖ La quête-courrier
« porte ce message à Kenya » est modélisée en un seul échange : le destinataire
est hors des zones écrites.

**Audio** — Route 31 partage la piste de la Route 30
(`/audio/ost/Disc 1/20 - Route 30.mp3`) — c'est le cas dans HGSS aussi.

> **État du monde — fin d'étape 10**
> · Inventaire : + **TM44 Rest**, **Vs. Recorder**.
> · Zones ouvertes : + Route 31, + **Mauville**.
> · Dresseurs battus : Don, Mikey, Silver #1, Joey, Wade.
> · Leçons atteignables cumulées : 80 + 20 = **100 kanji**.

---

### Étape 11 — Mauville : la ville, et le mur devant l'arène

*Étape de quête : —. Zone : `MAP_VIOLET` (64 × 64).*

**Déclencheur** — sortir du poste-frontière, à l'est de la ville (63,45).

**Les portes de la ville** (tuile de porte, abordée depuis la tuile du sud) :

| bâtiment | tuile-porte | zone |
|---|---|---|
| Arène | (31,33) | `MAP_VIOLET_GYM` — **barrée** |
| Tour Grospignon | (39,4) | `MAP_SPROUT_TOWER_1F` |
| Poké Mart | (21,33) | `MAP_VIOLET_POKEMART` |
| Centre Pokémon | (49,47) | `MAP_VIOLET_POKECENTER_1F` |
| École Pokémon | (47,33) | `MAP_VIOLET_POKEMON_SCHOOL` |

**Les PNJ :**

| qui | tuile | rôle | état |
|---|---|---|---|
| **Earl** | (26,28) sud | PNJ-leçon — **leçon violet #1**. Instituteur errant, sourcé « trouvé entre le Gym et le Mart » | ✅ |
| **Garçon blond** | (13,31) sud | PNJ-leçon — leçon #2 ; annonce l'échange Éclats↔Baies (CS 砕, plus tard) | ✅ |
| **Garçon à lunettes** | (16,35) sud | PNJ-leçon — leçon #3 | ✅ |
| **Garçon du Mart** | (46,37) sud | PNJ-leçon — leçon #4 ; teaser du Simularbre de la Route 36 | ✅ |
| **Vendeur du Mart** | `MAP_VIOLET_POKEMART` (8,3) sud | PNJ-leçon — **leçon #5** | ✅ |
| **Homme à lunettes noires** | (32,34) ouest | **délégué du verrou de l'arène** ; `blocking` → `cleared` sur `item_owned(tm70_flash)` | ✅ |
| Teala | (41,40) sud | **absente** (`badge_earned(falkner)`) — Pal Pad après le badge | ✅ |
| Kimono Girl Zuki | (26,37) ouest | **absente** (`badge_earned(falkner)`) | ✅ |

> **Corrections apportées par cette passe.**
> · **Earl** était en (40,23), sur le pont nord. Son objet ROM (`obj_T22_gsbigman`,
>   monde (474,252)) le pose en (26,28), entre l'arène et le Mart : c'est lui qui
>   porte le script `T22_001`, celui qui demande « tu as battu le champion ? »
>   puis emmène le joueur à l'École.
> · **Le vendeur du Mart** était en (48,50), planté dans un champ de la zone
>   extérieure. Il est maintenant dans le Mart. La tuile de son objet ROM (2,6)
>   est dans l'alcôve murée du comptoir, sans voisin praticable — même défaut
>   déjà rencontré à Ville Griotte, même résolution : (8,3).
> · **Zuki** était présente dès l'arrivée, à dire « oh, tu portes un œuf » à
>   quelqu'un qui ne l'a pas encore récupéré. `FLAG_HIDE_VIOLET_KIMONO_GIRL`
>   n'est levé qu'après le badge (`scr_seq_0858_T22FS0101.s:77`) : sa scène
>   appartient à l'étape 14.
> · **La leçon #5** était portée par Teala, gatée sur le badge de Falkner — 6
>   kanji du budget d'avant-arène atteignables seulement après. Reportée sur le
>   vendeur du Mart (même précédent qu'à Ville Griotte). Teala garde son Pal Pad.
> · **L'homme à lunettes noires** était en (42,16), à vingt tuiles de la porte
>   qu'il est censé barrer. Il est désormais contre elle, en (32,34).

**Le verrou de l'arène — `gym_guide_violet_sprout_tower`** : barre
`MAP_VIOLET ⇢ MAP_VIOLET_GYM`. Garde posté en (31,35) face au nord, sprite
`SPRITE_SUNGLASSES`, trois pages :

> まって。　ハヤトに　かちに　きたんだね。 / でも　まだ　はやいよ。 /
> きたの　とうで　しゅぎょうしてから　おいで。

Clé : `item_owned(tm70_flash)`, remis par l'Ancien Li au 3F de la Tour
Grospignon — atteignable depuis Mauville **sans franchir le verrou**, ce que
`lint-roadblocks.py` vérifie maintenant par parcours du graphe des warps.

> **Écart assumé, à ne pas relire comme de la fidélité.** Dans HGSS ce guide ne
> barre **rien** : le couloir de l'arène fait quinze tuiles de large à sa
> hauteur, on le contourne, et son avertissement (« You are quite welcome.
> ...Almost! », `msg_0558_T22GYM0101_00006`) est purement consultatif. Ici la
> visite de la tour est une **vraie** condition d'accès, parce que la tour porte
> 2 des 26 leçons d'avant-arène et le TM70 : la sauter, c'est arriver chez
> Falkner avec 10 kanji de moins que ce que le combat suppose. Jusqu'à cette
> passe, ce verrou n'existait que comme réplique de PNJ — un personnage bavard
> qui ne barrait aucun franchissement. Il est maintenant un vrai verrou.

**Audio** — `/audio/ost/Disc 1/22 - Violet City.mp3` ; Mart :
`25 - Poké Mart` ; Centre : `15 - Pokémon Center`.

> **État du monde — fin d'étape 11**
> · Inventaire : inchangé.
> · Zones ouvertes : + Mauville et ses intérieurs, + **Tour Grospignon**. Arène **barrée**.
> · Leçons atteignables cumulées : 100 + 30 = **130 kanji**.
> · Dresseurs pouvant engager : aucun en ville (les deux dresseurs de l'arène sont derrière le verrou).

---

### Étape 12 — La Tour Grospignon, 1F → 2F → 3F

*Étape de quête : —. Zones : `MAP_SPROUT_TOWER_1F`, `_2F`, `_3F` (32 × 32 chacune).*

**Déclencheur** — entrer par la porte (39,4) de Mauville ; on arrive en (15,28)
du 1F. `SFX.doorOpen`, puis `SFX.stairs` à chaque étage.

**1F**

| qui | tuile | rôle | état |
|---|---|---|---|
| **Sage Chow** | (5,10) est, portée 4 | dresseur, 6 questions | ✅ |
| **Sages de la tour** | (11,15) sud | PNJ-leçon — **leçon sprout #1**. Une seule entrée pour les six sages ambiants, posée sur l'objet ROM `obj_D15R0101_bozu_2` | ✅ |
| Inscription ancienne | (8,9) | `kind: sign` — le moteur applique `unlock_text(ancient_inscription_sprout_tower)` | ✅ |
| Escaliers | (10,15) / (24,9) / (6,16) | → 2F | ✅ |

**2F**

| qui | tuile | rôle | état |
|---|---|---|---|
| **Sage Nico** | (20,13) sud, portée 4 | dresseur, 6 questions | ✅ **ajouté par cette passe** |
| **Sage Edmond** | (13,27) ouest, portée 4 | dresseur, 6 questions | ✅ **ajouté par cette passe** |
| Escalier | (15,27) | → 3F | ✅ |

> **Correction apportée par cette passe.** La tour compte **six** sages nommés
> (`guidebook-adapted.md` § sprout-tower : Neal, Troy, Jin, Nico, Edmond, Chow)
> et le contenu n'en avait que quatre — le 2F était entièrement vide, alors
> qu'il faut le traverser pour monter. Nico et Edmond sont reposés sur leurs
> objets ROM (`150_D15R0102.json`, `std_trainer(TRAINER_SAGE_NICO/EDMOND)`).

**3F**

| qui | tuile | rôle | état |
|---|---|---|---|
| **Sage Troy** | (17,19) sud, portée 4 | dresseur, 6 questions | ✅ |
| **Sage Neal** | (13,22) est, portée 4 | dresseur, 6 questions | ✅ |
| **Sage Jin** | (18,25) ouest, portée 4 | dresseur, 6 questions | ✅ |
| **Silver** | (12,12) nord | scène passive, non nommé : « ……べつに。／ つよく　なれれば、それで　いい。 » | ✅ |
| **Ancien Li** | (12,9) sud | PNJ-leçon — **leçon sprout #2** ; sa réplique remet le **TM70 Flash** au premier contact, puis `after_gift` | ✅ |

**La scène du sommet.** Dans la ROM, un `COORD` du 3F déclenche une cinématique :
« ! » au-dessus du joueur, il monte cinq cases, l'Ancien sermonne Silver
(« Pokémon are not tools of war... »), Silver rétorque, puis disparaît en
tournoyant (`scr_seq_0018_D15R0103.s`). 🔜 la mise en scène n'est pas modélisée ;
les deux répliques existent, servies en Talk. Silver **ne disparaît pas** après
(pas de `negate` posé) — 🔜.

> **Piège déjà payé, à ne pas rejouer.** L'Ancien Li a été posé un temps en
> (5,10) du **1F** — la tuile exacte du Sage Chow, deux personnages sur une
> case. Et le Silver de la tour a été servi au 1F, dans un mur, alors que son
> objet ROM est au 3F. Les deux erreurs viennent de la même cause : une tuile
> d'intérieur sans son `map_zone`. `lint-npc-placements.py` refuse désormais
> les deux (§ 9).

**Combat** — six sages, `sight_auto` portée 4, 6 questions chacun. Musique :
`battle-trainer.mp3`, retour à `/audio/ost/Disc 1/23 - Sprout Tower.mp3`.

**Objet** — `tm70_flash`, par l'Ancien Li. `SFX.itemGet` ✅. C'est **la clé du
verrou de l'arène**.

> **État du monde — fin d'étape 12**
> · Inventaire : + **TM70 Flash**.
> · Zones ouvertes : + les trois étages de la tour, + **Arène de Mauville** (verrou levé).
> · Dresseurs battus : + Chow, Nico, Edmond, Troy, Neal, Jin.
> · Leçons atteignables cumulées : 130 + 10 = **140 kanji** — le budget complet d'avant-arène.
> · Textes : + `ancient_inscription_sprout_tower`.
> · L'homme à lunettes noires passe à `cleared` : « ジムは　あっちだよ。 »

---

### Étape 13 — L'arène : Rod, Abe, Falkner

*Étape de quête : —. Zone : `MAP_VIOLET_GYM` (24 × 30, entrée en (15,28)).*

**Déclencheur** — franchir la porte (31,33) de Mauville, désormais libre.

| qui | tuile | rôle | état |
|---|---|---|---|
| **Bird Keeper Rod** | (18,11) ouest, portée 4 | 門弟, 10 questions | ✅ |
| **Bird Keeper Abe** | (12,15) est, portée 4 | 門弟, 10 questions | ✅ |
| **Falkner** | (15,4) sud | 師範, Talk — **absent** tant que Rod et Abe ne sont pas battus (`npc_cleared` sur les deux) | ✅ |

**Le combat de Falkner** — `battle_length: 24`, format examen 試練, 3 vies,
tout-ou-rien (les 16 師範 ne reprennent pas par section — PRD § Système de
Combat). Nom d'épreuve : 試練（しれん）・空（そら）の道（みち）.

| état | contenu |
|---|---|
| `battle_intro` | « ようこそ、わたしの　ジムへ。／ わたしは　とりつかいの　ハヤト。／ きみの　力（ちから）を　みせて　もらおう。 » |
| `post_battle` | « みごとだ。／ この　バッジを　うけとって　ください。／ ゼファーバッジだ。 » |

**Effets** — `grant_badge(falkner)` + `grant_item(tm51_roost)` ✅.

**Audio** — `/audio/ost/Disc 1/42 - Pokémon Gym.mp3` en fond,
`battle-trainer.mp3` pendant chaque combat. 🔜 la ROM joue une fanfare de badge
dédiée (`SEQ_ME_BADGE`) ; nous n'avons que `SFX.victoryJingle`. La **cérémonie
de badge** du PRD (§ Cérémonies) reste 🔜.

> **État du monde — fin d'étape 13**
> · Inventaire : + **TM51 Roost**.
> · Badges : **ゼファーバッジ** (falkner).
> · Dresseurs battus : + Rod, Abe, Falkner.
> · Zones ouvertes : inchangées ; la Route 36 s'ouvre au nord de Mauville — hors périmètre.

---

### Étape 14 — Après le badge : ce que le monde fait tout seul

*Étape de quête : —. Déclenchée par `badge_earned(falkner)`.*

C'est la dernière étape du périmètre, et la plus instructive pour le gabarit :
**quatre personnages bougent sans que le joueur ne fasse rien**, sur trois
cartes différentes.

| qui | avant | après | mécanisme | état |
|---|---|---|---|---|
| **Assistant d'Elm** | labo de Bourg Geon (9,12) | **Mart de Mauville** (6,8), état `violet_mart` — il rend l'œuf | `placements[]` gardé par `badge_earned(falkner)` | ✅ |
| **Kimono Girl Zuki** | absente | Mauville (26,37) — « あら、たまごを　もってるのね。／ だいじに　してあげてね。 » | `unlock_conditions: badge_earned(falkner)` | ✅ |
| **Teala** | absente | sous-sol du Centre (41,40) — remet le **Pal Pad**, puis `after_gift` | `unlock_conditions` | ✅ |
| **Tuscany** | absente | Route 29 (53,21) — remet le **TwistedSpoon**, le mardi seulement | `unlock_conditions` : `time_window(tuesday)` **et** `badge_earned(falkner)` | ✅ |
| Appel d'Elm annonçant l'assistant | — | — | 🔜 le téléphone n'existe pas dans le menu | 🔜 |

> **Correction apportée par cette passe — la plus importante du document.**
> L'assistant d'Elm était placé au **comptoir du Mart de Ville Griotte**, entre
> la remise de l'œuf et sa livraison, avec pour justification écrite « c'est là
> que HGSS le poste ». C'est faux, deux fois :
> · le clerc que HGSS fait apparaître au Mart de **Griotte** est un **second
>   vendeur** (`FLAG_HIDE_CHERRYGROVE_MART_SPECIAL_CLERK` → `std_special_mart`,
>   `scr_seq_0851_T21FS0101.s`), sans rapport avec l'assistant ;
> · l'assistant, lui, quitte le labo pour le Mart de **Mauville** au moment de
>   l'appel d'Elm qui suit le **premier badge** (`scr_seq_0857_T22.s:28-30` :
>   `ClearFlag FLAG_HIDE_VIOLET_SHOP_LAB_AIDE` + `SetFlag FLAG_HIDE_ELMS_LAB_AIDE`).
>   Elm le dit mot pour mot : « He should have met you with the Egg at Violet
>   City's Poké Mart » (`msg_0543_T20R0101_00042`). Le guidebook curaté le disait
>   déjà (§ violet-city : « Assistant du Professeur Elm (dans le Mart) — rend
>   l'œuf mystère au joueur après le 1er badge »).
>
> Une source inventée est plus coûteuse qu'une source absente : elle empêche de
> reposer la question. Le placement, la fenêtre de présence et les trois états
> de dialogue de l'assistant ont été refaits (`not_the_professor` au labo avant
> la course, `egg_kept` pendant qu'il garde l'œuf, `violet_mart` après le badge).

**Ordre exact dans la ROM**, pour mémoire : battre Falkner pose
`VAR_SCENE_VIOLET_CITY_OW = 1` → au rechargement de la ville, Elm appelle et
l'assistant apparaît au Mart (`VAR = 2`) → lui parler pose `VAR = 3` → au
rechargement suivant, la scène de Zuki se joue (`VAR = 4`). Chez nous, les trois
apparitions sont **simultanées** sur `badge_earned(falkner)` : nous n'avons pas
de rechargement de carte scénarisé, et le chaînage n'apporterait rien qu'une
condition de plus. 🔜 à raffiner si le téléphone arrive.

> **État du monde — fin d'étape 14 (fin du périmètre)**
> · Inventaire : Pokégear, Running Shoes, Map Card, Apricorn Box, Œuf mystère, Pokédex, TM44 Rest, Vs. Recorder, TM70 Flash, TM51 Roost, Pal Pad, (TwistedSpoon si mardi).
> · Badges : falkner.
> · Quêtes : `mystery_egg_errand` terminée, `cherrygrove_welcome` terminée.
> · Zones ouvertes : Bourg Geon, Route 29, Ville Griotte, Route 30, Route 31, Mauville, Tour Grospignon (3 étages), Arène — et tous les intérieurs. Route 36 au nord : hors périmètre.
> · Leçons : 26 faites possibles, **140 kanji**.
> · Dresseurs battus : Don, Mikey, Joey, Wade, Silver #1, Chow, Nico, Edmond, Troy, Neal, Jin, Rod, Abe, Falkner.
> · Textes : `lyra_mail_new_bark`, `johto_entrance_sign_route29`, `ancient_inscription_sprout_tower`.

---

## 5. Fiches de zone

Résumé opérationnel, une entrée par zone. `map_zone` en gras = intérieur avec
sa propre grille.

### `new-bark-town` — ワカバタウン · `MAP_NEW_BARK` 32×32 · `new-bark-town.mp3`

| entité | zone | tuile | face | gate |
|---|---|---|---|---|
| Maman | **PLAYER_HOUSE_1F** | 6,6 | est | — |
| PC du joueur | **PLAYER_HOUSE_2F** | 9,5 | — | — |
| Pr. Elm (leçon ×5) | **ELMS_LAB_1F** | 4,5 | sud | — |
| Assistant d'Elm | **ELMS_LAB_1F** → **VIOLET_POKEMART** | 9,12 → 6,8 | ouest → sud | placement sur badge |
| Policier | **ELMS_LAB_1F** | 3,6 | est | `egg_received` |
| Silver | extérieur | 10,7 | sud | `egg_received` (negate) |
| Lyra/Ethan | extérieur | 14,12 | ouest | `sent_by_elm` |
| Verrou ouest | extérieur | poste 6,14 | ouest | `sent_by_elm` |

Portes : labo (12,9) · maison du joueur (23,12) · maison de Lyra (18,23) ·
maison sud-ouest (7,21) · escalier labo 2F (16,8).

### `route-29` — 29ばんどうろ · `MAP_ROUTE_29` 96×32 · `route-29.mp3`

| entité | tuile | face | gate |
|---|---|---|---|
| Panneau de Johto | 2,11 | — | — |
| Burly Man (leçon #1-2) | 46,8 | sud | — |
| Man by the Grass (leçon #3-4) | 24,11 | sud | — |
| Lyra/Ethan | 85,16 | ouest | `egg_received` |
| Tuscany | 53,21 | sud | mardi + badge |

Traversée est → ouest. Warp vers le poste-frontière de la Route 46 : (50,5).
Aucun dresseur, par fidélité.

### `cherrygrove-city` — ヨシノシティ · `MAP_CHERRYGROVE` 64×32 · `cherrygrove-city.mp3`

| entité | zone | tuile | face | gate |
|---|---|---|---|---|
| Guide Gent (leçon #1) | extérieur | 54,12 | sud | — |
| Silver #1 (dresseur, 12 q.) | extérieur | 60,13 | sud, portée 4 | `egg_received` |
| Carte de dresseur | extérieur | 59,13 | — | `npc_cleared(silver #1)` |
| Employée du Centre | **POKECENTER_1F** | 15,5 | sud | — |
| Vendeur du Mart (leçon #2) | **POKEMART** | 8,3 | sud | — |
| Verrou nord | extérieur | poste 36,5 | nord | `map_given` |

Portes : Centre (52,7) · Mart (43,7) · maison du guide (46,17) · maison
sud-ouest (35,15) · maison sud-est (55,21).

### `route-30` — 30ばんどうろ · `MAP_ROUTE_30` 32×96 · `route-30.mp3`

| entité | zone | tuile | face | gate |
|---|---|---|---|---|
| Bug Catcher Don (5 q.) | extérieur | 6,10 | est, portée 4 | — |
| Youngster Mikey (5 q.) | extérieur | 8,37 | sud, portée 4 | — |
| Youngster Joey (5 q.) | extérieur | 9,44 | ouest, portée 4 | `egg_delivered` |
| Homme de la maison (leçon ×4) | **APRICORN_HOUSE** | 5,5 | sud | — |
| Mr. Pokémon | **MR_POKEMON_HOUSE** | 9,7 | ouest | — |
| Pr. Oak | **MR_POKEMON_HOUSE** | 8,7 | est | — |

Traversée sud → nord. Portes : maison aux Apricorns (11,67) · maison de
Mr. Pokémon (24,6).

### `route-31` — ３１ばんどうろ · `MAP_ROUTE_31` 64×32 · piste de la Route 30

| entité | tuile | face | gate |
|---|---|---|---|
| Bug Catcher Wade (7 q.) | 28,23 | nord, portée 4 | — |
| Homme à l'Apricorn noir (leçon ×4) | 32,15 | sud | — |
| Lyra/Ethan | 26,13 | sud | — |

Warps : poste-frontière de Mauville (6,13) · Grotte Sombre (53,13, 🔒 CS 光).

### `violet-city` — キキョウシティ · `MAP_VIOLET` 64×64 · `22 - Violet City.mp3`

| entité | zone | tuile | face | gate |
|---|---|---|---|---|
| Earl (leçon #1) | extérieur | 26,28 | sud | — |
| Garçon blond (leçon #2) | extérieur | 13,31 | sud | — |
| Garçon à lunettes (leçon #3) | extérieur | 16,35 | sud | — |
| Garçon du Mart (leçon #4) | extérieur | 46,37 | sud | — |
| Vendeur du Mart (leçon #5) | **POKEMART** | 8,3 | sud | — |
| Homme à lunettes noires | extérieur | 32,34 | ouest | — |
| Kimono Girl Zuki | extérieur | 26,37 | ouest | badge |
| Teala | extérieur | 41,40 | sud | badge |
| Bird Keeper Rod (10 q.) | **GYM** | 18,11 | ouest, portée 4 | — |
| Bird Keeper Abe (10 q.) | **GYM** | 12,15 | est, portée 4 | — |
| Falkner (24 q., 3 vies) | **GYM** | 15,4 | sud | Rod ∧ Abe battus |
| Verrou de l'arène | extérieur | poste 31,35 | nord | `item_owned(tm70_flash)` |

Portes : arène (31,33) · tour (39,4) · Mart (21,33) · Centre (49,47) · École
(47,33) · poste-frontière R31 (63,45).

### `sprout-tower` — Tour Grospignon · 3 étages 32×32 · `23 - Sprout Tower.mp3`

| entité | zone | tuile | face | gate |
|---|---|---|---|---|
| Sage Chow (6 q.) | **1F** | 5,10 | est, portée 4 | — |
| Sages de la tour (leçon #1) | **1F** | 11,15 | sud | — |
| Inscription ancienne | **1F** | 8,9 | — | — |
| Sage Nico (6 q.) | **2F** | 20,13 | sud, portée 4 | — |
| Sage Edmond (6 q.) | **2F** | 13,27 | ouest, portée 4 | — |
| Sage Troy (6 q.) | **3F** | 17,19 | sud, portée 4 | — |
| Sage Neal (6 q.) | **3F** | 13,22 | est, portée 4 | — |
| Sage Jin (6 q.) | **3F** | 18,25 | ouest, portée 4 | — |
| Silver (scène) | **3F** | 12,12 | nord | — |
| Ancien Li (leçon #2, TM70) | **3F** | 12,9 | sud | — |

Entrée 1F en (15,28) ; 1F↔2F : (10,15), (24,9), (6,16) ; 2F↔3F : (15,27).

---

## 6. Écarts relevés

Tout ce que la rédaction a trouvé entre le jeu d'origine et notre contenu. Les
lignes **corrigées** l'ont été dans cette passe ; les autres sont laissées, avec
leur raison.

### Corrigé

| # | écart | source qui tranche |
|---|---|---|
| 1 | L'assistant d'Elm était au Mart de **Griotte** entre `egg_received` et `egg_delivered`, sur une source inventée. Il va au Mart de **Mauville**, après le **badge**. | `scr_seq_0857_T22.s:28-30`, `msg_0543_T20R0101_00042`, guidebook § violet-city |
| 2 | 4 leçons de la Route 29 portées par **Tuscany** (mardi + badge) : 20 kanji du budget d'avant-arène hors d'atteinte. | `scr_seq_0225_R29.s` |
| 3 | Leçon violet #5 portée par **Teala** (badge) : 6 kanji de plus hors d'atteinte. | `content/map/npcs.json` |
| 4 | Le **policier** servi sur la zone extérieure alors que son objet ROM vit dans le labo. | `058_T20R0101.json` |
| 5 | **Silver et Lyra confondus** à Bourg Geon : `obj_T20_gsrivel` (sprite du rival) était attribué à Lyra. Les deux occupaient (10,7). | `057_T20.json`, `scr_seq_T20_009` |
| 6 | Silver disparaissait de Bourg Geon à `sent_by_elm` ; le drapeau n'est posé qu'à `egg_received`. | `scr_seq_0229_R30R0201.s:266` |
| 7 | **Youngster Joey** présent dès l'aller sur la Route 30. | `scr_seq_0149.s:129`, `scr_seq_0843_T20R0101.s:759` |
| 8 | **Sages Nico et Edmond** absents : le 2F de la tour était vide, alors qu'on le traverse. | `150_D15R0102.json`, guidebook § sprout-tower |
| 9 | Le verrou de l'arène n'existait **que** comme réplique de PNJ ; aucun franchissement barré. | `131_T22GYM0101.json`, `scr_seq_0018_D15R0103.s:126-127` |
| 10 | L'homme à lunettes noires à 20 tuiles de la porte de l'arène. | position générée |
| 11 | Le **vendeur du Mart de Mauville** planté dans un champ de la zone extérieure. | `152_T22FS0101.json` |
| 12 | **Earl** sur le pont nord au lieu d'entre l'arène et le Mart. | `obj_T22_gsbigman`, `070_T22.json` |
| 13 | **Zuki** présente dès l'arrivée, à commenter un œuf que le joueur n'a pas. | `scr_seq_0858_T22FS0101.s:77` |
| 14 | **Tuscany** sur une position générée. | `obj_R29_gswoman2_2`, `030_R29.json` |
| 15 | Six PNJ-leçon rejouaient leur réplique de remise de cadeau avant chaque leçon. | comportement moteur, `src/app/map/actions.ts` |
| 16 | **Hors périmètre, trouvé par le nouveau linter** : le Proton du Puits Ramoloss et l'Ariana du QG d'Acajou avaient été reposés sur les objets ROM de la **Tour Radio**, à cheval sur leurs homologues de Doublonville. | `170_D26R0102.json`, `234_D35R0103.json` |

### Écarts assumés, non corrigés

| écart | raison |
|---|---|
| La visite de Ville Griotte remet chaussures **et** carte en une fois ; la ROM les sépare en deux allers. | Le second aller obligeait à revenir réclamer un objet dont on a besoin tout de suite. Décidé le 2026-08-06. |
| Le verrou de l'arène est un **vrai** blocage ; dans HGSS le guide se contourne. | La tour porte 2 leçons et le TM70 ; la sauter fausse le combat de Falkner. |
| La carte de dresseur de Silver est un **objet trouvé** ; dans la ROM il la reprend pendant la bousculade. | Une révélation d'une phrase n'a pas la valeur d'une lecture ; pas de quiz dessus. |
| L'embuscade de Silver est en x=60, la ROM en x=63-64. | La tuile ROM est une tuile de parcage d'objet scripté ; x=60 est le vrai goulot de **notre** grille, prouvé par BFS. |
| Le Guide Gent ne disparaît pas après la visite. | Il porte la leçon cherrygrove #1 et doit rester joignable. |
| Les quatre changements d'après-badge sont simultanés ; la ROM les chaîne en quatre valeurs de scène. | Pas de rechargement de carte scénarisé ; le chaînage n'ajouterait qu'une condition. |
| L'œuf n'est jamais retiré du sac. | Pas d'éclosion ; un aller-retour d'objet sans contrepartie. |
| L'homme à l'Apricorn noir en (32,15) au lieu de (28,15) ROM. | Les deux tuiles sont bonnes ; à recaler à la prochaine passe de positions. 🔜 |

### ➖ Hors périmètre (mécanique Pokémon sans équivalent)

Capture (le tutoriel de Lyra est réattribué au Kanjidex) · échange · élevage ·
éclosion de l'œuf · soin d'équipe et Potions · PP · Poké Balls et Apricorns ·
`HealParty` / `SetSpawn` · rebords et herbes hautes comme mécanique de rencontre.

---

## 7. Travaux ouverts

À mentionner, pas à traiter ici :

- **Captures d'intérieur.** Les décors d'intérieur sont des captures de
  **partie** : des PNJ et l'avatar du joueur sont peints dans les pixels, d'où
  des doublons visibles à l'écran (un « Elm » dessiné à côté du vrai). Outil de
  retouche : `scripts/build/scrub-baked-npcs.py`.
- **Pas d'animation « objet obtenu ».** Le son existe (`SFX.itemGet`), la
  fenêtre et l'animation non. La ROM distingue en plus `SEQ_ME_ITEM`,
  `SEQ_ME_KEYITEM` et `SEQ_ME_BADGE` ; nous avons un seul son.
- **La carte du monde et le téléphone n'existent pas dans le menu.** Le Pokégear
  entre au sac à l'étape 3 et n'ouvre rien. Toute la ligne d'appels d'Elm
  (Route 30, après-badge) attend ce chantier.
- **Le menu START ne ressemble pas encore à celui de HGSS.**
- **Registre des zones incomplet.** `content/map/zones.json` déclare
  `zone_id: "violet"` pour `MAP_VIOLET` alors que tout le contenu utilise
  `violet-city` ; la Tour Grospignon y est éclatée en `sprout-tower-1f/2f/3f`
  alors que le contenu dit `sprout-tower`. L'audio passe par `map_name` et n'en
  souffre pas, mais tout futur lookup par `zone_id` s'y cassera.
- **Mises en scène animées non modélisées** : la marche du Guide Gent le long de
  sa visite, le repoussement de Silver à Bourg Geon, la cinématique du sommet de
  la tour, la sortie en courant du Pr. Elm hors du labo. Le Roadblock couvre le
  seul cas où une marche est réellement visible.

---

## 8. Le gabarit : remplir une zone

La méthode, dans l'ordre. Chaque étape a produit au moins une correction dans ce
document — l'ordre n'est pas décoratif.

**1. Lire les sources avant d'écrire une ligne.** Dans cet ordre de priorité :
`content/guidebook-adapted.md` § de la zone (curaté, fait foi sur les rôles),
`content/npc-inventory.md`, puis le décompilé. Le guidebook donne l'intention,
le décompilé donne les faits.

**2. Ouvrir le `zone_event` de la zone.**
`~/pokeheartgold/files/fielddata/eventdata/zone_event/NNN_<CODE>.json`. Il
contient tout ce dont on a besoin :
- `objects[]` — un par personnage. `spriteId` dit **qui** (`SPRITE_GSRIVEL` =
  Silver, `SPRITE_VAR_1` = l'ami·e, `SPRITE_BOZU` = un sage…), `eventFlag` dit
  **quand** il est là, `scriptId` dit **ce qu'il fait** (`std_trainer(TRAINER_*)`
  = un dresseur, sinon un renvoi de script), `facingDirection` dit où il regarde,
  `(x, z)` sa tuile monde ;
- `warps[]` — les portes, avec leur destination ;
- `coords[]` — les déclencheurs de scène, avec leur variable et sa valeur ;
- `bgs[]` — les panneaux et objets cachés.

**3. Convertir les coordonnées.** `tile = monde − world_origin` (§ 1). Pour un
intérieur, `world_origin` est (0,0) et la tuile est déjà bonne — mais elle
n'existe que **dans cette pièce** : le champ `map_zone` est obligatoire.

**4. Suivre les drapeaux à la trace.** Pour chaque `eventFlag` d'un objet :
`grep -rn "<FLAG>" ~/pokeheartgold/files/fielddata/script/scr_seq/*.s`. On
obtient les deux ou trois lignes qui le posent et le lèvent — donc la fenêtre de
présence exacte, et **depuis quelle carte** elle est armée. C'est ce grep, et
lui seul, qui a corrigé les écarts 1, 6, 7 et 13 de la § 6.

**5. Lire les textes.** Les `.gmm` de `~/pokeheartgold/files/msgdata/msg/` sont
du XML en clair (version US). `msg_<NNNN>_<CODE>.gmm` correspond au `#include`
en tête du script. On n'y prend jamais la lettre — on écrit notre japonais — mais
on y prend le **rôle** : qui dit quoi, à qui, dans quel ordre.

**6. Traduire en leviers.** Un objet ROM devient une entrée de `npcs.json` ou de
`trainers.json` ; un `eventFlag` devient des `unlock_conditions` ; un
`MovePersonFacing` depuis un autre script devient un `placements[]` ; un
`COORD` qui barre une sortie devient un `roadblocks.json`. **Aucun mécanisme
nouveau n'est jamais nécessaire.** Si un beat n'a pas de levier, c'est qu'il
manque une étape de quête — écrire l'étape, pas le mécanisme.

**7. Attribuer les leçons.** Le pool de kanji de la zone est déjà fixé
(`curriculum-checkpoints.md`) et ne se rediscute pas. Ce qui se décide ici, c'est
**qui** les porte : uniquement des personnages sourcés (nommés du guidebook, ou
ambiants du décompilé), **toujours présents sur le chemin critique**, dans
l'ordre où le joueur les croise. Aucun lien thématique entre le PNJ et le contenu
de sa leçon (PRD § Leçons).

**8. Écrire les dialogues.** Un état par moment de l'histoire, jamais un état
fourre-tout. Style : `content/content-writing-guide.md`. Budget kanji : au plus
2 inconnus par **dialogue** (tous états confondus), lecture inline sur tout
kanji affiché (ADR-0002).

**9. Faire tourner les garde-fous.** `npm run check`. Puis relire soi-même le
parcours dans l'ordre, à froid, en se demandant à chaque étape « qu'est-ce que
le joueur a dans son sac, et qu'est-ce qu'il sait ? ».

### Les pièges, et comment chacun se voit

| piège | symptôme | ce qui l'attrape |
|---|---|---|
| **Position inventée** — le PNJ tombe dans un mur, dans la canopée, hors grille | invisible, ou visible et injoignable | `lint-npc-placements.py`, `audit-first-gym-run.py` (`audit_positions`) |
| **Deux personnages sur une tuile** — arrivé entre l'Ancien de la Tour et le sage Chow | un seul apparaît ; l'autre porte peut-être la clé | `lint-npc-placements.py` (ajouté par cette passe) |
| **Intérieur servi au mauvais étage** — le Silver de la tour au 1F, dans un mur | le PNJ existe mais n'est nulle part | toujours renseigner `map_zone` ; `a1-traversal.test.ts` |
| **Intérieur aplati sur l'extérieur** — Maman sur la tuile-porte, le vendeur dans un champ | un vendeur debout dans l'herbe, une porte bloquée | `a1-traversal.test.ts` (`INTERIOR_NPCS`) |
| **Clé derrière la serrure** — la condition ne peut être remplie qu'après le franchissement | blocage définitif, silencieux | `lint-roadblocks.py`, désormais par parcours du graphe des warps |
| **Verrou qui se lève à la deuxième réplique** — le joueur bute trois fois | frustration sans explication | `lint-roadblocks.py` (le `default` du PNJ délégué doit accorder la clé) |
| **Leçon portée par un personnage qui n'existe pas encore** — Tuscany, Teala | le compteur dit 140 kanji, le joueur en voit 114 | `audit-first-gym-run.py` (ajouté par cette passe) |
| **Source inventée** — « c'est là que HGSS le poste » | l'erreur devient inattaquable | citer le fichier et la ligne, toujours |
| **Cadeau rejoué à chaque leçon** — le dialogue passe avant l'écran-livre | le PNJ offre quatre fois le même objet | un état d'après-cadeau sur `item_owned` |
| **Tuile de parcage prise pour une position** — l'objet ROM d'un personnage scripté est garé hors carte | ligne de vue dans le vide, embuscade qui ne part jamais | lire le script, pas seulement l'objet |

---

## 9. Garde-fous

| script | ce qu'il refuse |
|---|---|
| `scripts/validate/lint-npc-placements.py` | un poste dans un mur ou hors grille ; un poste sans voisin praticable ; une liste de placements sans poste par défaut ; deux postes aux conditions identiques ; **deux personnages sur la même tuile d'une même zone, dans des fenêtres de présence compatibles** (ajouté) |
| `scripts/validate/lint-roadblocks.py` | une zone inconnue ; un poste de garde dans un mur ; un sprite introuvable ; un verrou muet ou sans condition ; un verrou délégué dont la première réplique n'accorde pas la clé ; **une clé située hors d'atteinte depuis la zone de départ sans franchir le verrou, `item_owned` compris** (ajouté : parcours du graphe des warps) |
| `scripts/validate/audit-first-gym-run.py` | un kanji sans exemple, sans lecture, sans traduction ; un PNJ muet ; un dresseur sans `battle_intro`/`post_battle` ; une position injoignable ; **une leçon du chemin critique dont le porteur n'a pas `role: lesson`, ou n'apparaît qu'avec le badge de Falkner, ou dépend du jour de la semaine** (ajouté). Liste aussi les verrous du chemin et leur clé. |
| `src/lib/a1-traversal.test.ts` | un parcours non franchissable ; un PNJ d'intérieur servi dehors ; un PNJ sur une tuile-porte |
| `src/lib/mystery-egg-walkthrough.test.ts` | la quête d'ouverture jouée de bout en bout sur les vrais fichiers : présences, états, idempotence |
| `src/lib/npc-placements.test.ts` | le déplacement réel de l'assistant d'Elm, sur le contenu réel |

Ce que **aucun** script ne fera, et qui reste à relire par un humain : la qualité
du japonais (naturel, registre, cohérence de niveau) et la qualité de game design
(rythme, lisibilité des objectifs).

---

## 10. Sources

**Locales, curatées, font foi sur l'intention**
`.scratch/kanji-no-niwa/PRD.md` (§ Séquence d'ouverture, § Boucle Quotidienne,
§ La Carte de Johto, § Leçons, § Silver — 6 Rencontres, § Système de Combat) ·
`content/guidebook-adapted.md` (§ new-bark-town, route-29, cherrygrove-city,
route-30, route-31, violet-city, sprout-tower) · `content/npc-inventory.md` ·
`content/side-content-inventory.md` · `content/curriculum-checkpoints.md` ·
`content/content-writing-guide.md` · `content/engine-contract.md` ·
ADR-0002, 0003, 0004, 0006, 0007 · `CONTEXT.md`.

**Décompilé `~/pokeheartgold`, fait foi sur les faits**

| fichier | ce qu'il donne |
|---|---|
| `files/fielddata/eventdata/zone_event/057_T20.json` | objets, warps et déclencheurs de Bourg Geon |
| `.../058_T20R0101.json` | labo d'Elm : Elm, l'assistant, le policier, Lyra |
| `.../030_R29.json`, `.../064_T21.json`, `.../031_R30.json`, `.../032_R31.json`, `.../070_T22.json` | Routes 29/30/31, Ville Griotte, Mauville |
| `.../139_R30R0201.json` | maison de Mr. Pokémon |
| `.../107_D15R0101.json`, `.../150_D15R0102.json`, `.../151_D15R0103.json` | Tour Grospignon 1F, 2F, 3F |
| `.../131_T22GYM0101.json`, `.../152_T22FS0101.json` | arène et Mart de Mauville |
| `files/fielddata/script/scr_seq/scr_seq_0842_T20.s` | scènes de Bourg Geon, `VAR_SCENE_NEW_BARK_*` |
| `.../scr_seq_0843_T20R0101.s` | labo : starter, remise de l'œuf, ce que la livraison arme ailleurs |
| `.../scr_seq_0850_T21.s` | visite guidée, Map Card, embuscade de Silver |
| `.../scr_seq_0851_T21FS0101.s` | Mart de Griotte : le second vendeur, pas l'assistant |
| `.../scr_seq_0225_R29.s` | Tuscany : badge **et** mardi |
| `.../scr_seq_0227_R30.s`, `.../scr_seq_0229_R30R0201.s` | Route 30, maison de Mr. Pokémon (le pivot) |
| `.../scr_seq_0857_T22.s`, `.../scr_seq_0858_T22FS0101.s` | après-badge : appel d'Elm, assistant au Mart, Zuki |
| `.../scr_seq_0859_T22GYM0101.s` | Falkner, badge, les deux guides d'arène |
| `.../scr_seq_0018_D15R0103.s` | sommet de la tour : Ancien Li, TM70, bascule des guides d'arène |
| `.../scr_seq_0149.s` | drapeaux posés au démarrage de partie |
| `files/msgdata/msg/msg_0542_T20.gmm`, `0543_T20R0101`, `0550_T21`, `0551_T21FS0101`, `0373_R29`, `0375_R30`, `0377_R30R0201`, `0378_R31`, `0556_T22`, `0558_T22GYM0101`, `0054_D15R0101`, `0056_D15R0103` | les textes d'origine (version US) |
| `include/constants/vars.h`, `include/constants/flags.h` | table des variables de scène et des drapeaux |

**En ligne, pour l'ordre des scènes uniquement — jamais pour les positions**
[Bulbapedia, Walkthrough HGSS parties 1 à 3](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_HeartGold_and_SoulSilver/Part_1) ·
StrategyWiki.
