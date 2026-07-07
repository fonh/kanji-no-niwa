# Findings — Audit 07 : Modes de combat et dresseurs

Date : 2026-07-07. Docs audités : `.scratch/kanji-no-niwa/PRD.md` (§ Système de Combat, § Dresseurs de Route, § 道場, § Arc narratif, § Implémentation), `content/guidebook-adapted.md`, ADR-0001, `CONTEXT.md`. Comptes JMdict réels exécutés sur `scripts/sources/jmdictExtended-2026-06-23.json` (217 625 entrées).

Classes : **A** contradiction · **B** promesse sans données · **C** promesse sans mécanisme · **D** ambiguïté · **E** obsolète.

---

## Vérifié sain (pas de finding)

- **Règle premier passage ↔ « ! » ↔ sight-line** : ADR-0001, `guidebook-adapted.md:34` (règle 8) et PRD:186-191 racontent exactement la même chose (auto-battle une fois via cône de vision, puis `talk` pur avec `post_battle` ; le « ! » restant au PRD:189 est l'animation de surprise HGSS canonique, pas le « ! carte due » purgé par l'audit 03). Les purges 03-A3 sont complètes dans les trois docs.
- **Arithmétique des vies** : toutes les colonnes « Vies » de la table des longueurs (PRD:248-259) et la note Kanto (PRD:600) sont conformes à `max(2, ceil(questions × 0.10))` — recalculées une par une, zéro écart.
- **Assets combat** : `public/sprites/ui/battle/transition/` et `vs_screen/` existent bien (+ hpbar, battlemenu).
- **2 門弟 Johto sourcés** : Falkner a bien 2 gardiens nommés au guide (Abe, Rod — `guidebook-adapted.md:246`), la structure uniforme « 2 門弟 » est une simplification documentée et assumée (`:1097`).

---

## Findings

### 07-A1 — Le pool de combat d'un dresseur a trois définitions incompatibles ⚠️ majeur

- PRD:184 : « Chaque dresseur porte directement son propre `kanji_pool` » ; le champ `kanji_pool[]` existe dans `map_trainers` (PRD:831) et dans le manifest (PRD:909), et il est **réellement rempli à la main** dans `content/map/trainers.json` (10 dresseurs Route 29, pools thématisés par identité — ex. Fillette Yuki : 女・子・友・学).
- PRD:629 : un 師範 « pioche dans `studiedSet` au moment du combat, **exactement comme `getTrainerBattlePool` pour un dresseur de route normal** » ; PRD:452 : « tout combat Silver pioche `studiedSet`, **comme n'importe quel dresseur** ».
- PRD:873 : `getTrainerBattlePool(trainer, studiedSet)` — « intersection kanji_pool ∩ studiedSet, min 5 ».

Trois lectures : pool hand-picked par dresseur / studiedSet pur / intersection des deux. La règle transverse actée (pas de theming, ordre pédagogique + studiedSet seul) condamne la première ; les pools de `trainers.json` sont précisément du theming par identité de PNJ. **À trancher au grill** : soit `kanji_pool[]` disparaît du schéma (studiedSet pur), soit il devient un artefact généré (fenêtre de l'ordre pédagogique), mais pas un champ éditorial.

### 07-C1 — « Fallback si <5 kanji disponibles » : référencé deux fois, défini nulle part

PRD:327 (« même tolérance que pour le pool de combat (fallback si <5 kanji disponibles) ») et PRD:873 (« min 5 ») invoquent un fallback dont le comportement n'est écrit nulle part (compléter avec quoi ? refuser le combat ? réduire les modes ?). Nb : si 07-A1 se résout en « studiedSet pur », le cas <5 devient quasi inatteignable (la sortie du dōjō exige déjà ~10 kanji) et le fallback peut disparaître avec le champ.

### 07-A2 — « Kanji du combat » des 3 événements Rocket : pools de combat thématiques interdits

PRD:465 (捕、縛、操、支、制), PRD:472 (欺、偽、惑、騙、詐), PRD:479 (権、力、命、令、報). L'audit 01 a requalifié les 6 kanji de Silver et les kanji signature des Kimono en « motif narratif, jamais un pool de combat » (PRD:450-458, guidebook règle 11) — les Rocket n'ont jamais reçu la même requalification. En l'état, le libellé « Kanji du combat » est littéralement un pool de combat hand-picked, contraire à la règle transverse 3.

### 07-B1 — Mécanisme B (Sens gradué) : le fallback anglais est le cas majoritaire — le mécanisme est statistiquement creux ⚠️ majeur, chiffré

Comptes réels sur `jmdictExtended-2026-06-23.json`, mots porteurs d'un `jlptLevel` (8 264 mots) :

| Niveau | mots | avec ≥1 relation `related`/`antonym` | couverture |
|---|---|---|---|
| N5 | 651 | 204 | **31,3 %** |
| N4 | 648 | 171 | 26,4 % |
| N3 | 1 711 | 399 | 23,3 % |
| N2 | 1 708 | 321 | 18,8 % |
| N1 | 3 546 | 607 | **17,1 %** |
| **Total** | **8 264** | **1 702** | **20,6 %** |

Aggravants :
- **77 % des mots couverts n'ont qu'UNE seule relation** (1 308/1 702 ; 2 relations : 253 ; ≥3 : 141). Un QCM à 4 options a besoin d'une bonne réponse **et** de 3 distracteurs — une relation unique ne fournit que la bonne réponse, la source des distracteurs japonais n'est de toute façon spécifiée nulle part.
- **64 % des cibles de relation ne sont pas des mots JLPT** (1 499/2 343 refs) — la « bonne réponse » serait souvent un mot que le joueur n'a aucune chance de connaître.

La promesse PRD:38 (« Si JMdict n'a pas de relation… elle reste en anglais plutôt que de forcer — pas de couverture 100% exigée ») laissait entendre un fallback d'appoint ; à ~80 % de fallback, c'est le mécanisme qui est l'exception. Et la promesse A (« Sens gradue vers 100% japonais ») devient fausse pour 4 mots maîtrisés sur 5. **À trancher au grill.**

### 07-A3 — Mode Sens : teste-t-il des kanji ou des mots ?

La table des modes (PRD:216) : prompt « **Kanji** affiché en grand », graduation « anglais (**mot** non maîtrisé) ou synonymes/antonymes JMdict (**mot** maîtrisé) ». Le mécanisme B (PRD:38) est défini sur les **mots**, la note de suppression de `mastery_events` (PRD:848) dit explicitement « c'est la maîtrise des **mots** qui pilote le mode Sens » — mais les relations JMdict n'existent pas pour un kanji isolé (JMdict est un dictionnaire de mots), et le prompt affiché est un kanji. Les deux lectures coexistent dans la même ligne de table. Lié à 07-B1 — à trancher ensemble.

### 07-D1 — Prompts « japonais (maîtrisé) » de Saisie et Disposition : jamais définis

- **Saisie** (PRD:218) : non maîtrisé = « signification en anglais » → taper la lecture. Maîtrisé = « prompt japonais » — lequel ? (le mot affiché en kanji → taper sa lecture est la lecture plausible, mais rien ne l'écrit ; et dans ce cas Saisie graduée ≡ mode Lecture en production — recouvrement à assumer ou non).
- **Disposition** (PRD:223) : non maîtrisé = « sens en anglais » (de la phrase) → remettre 6-8 chunks en ordre. Maîtrisé = « prompt japonais » — la phrase elle-même est la réponse, l'afficher donnerait la solution ; aucune paraphrase japonaise n'existe en base ni au pipeline. **Et « maîtrisé » n'est pas défini pour une phrase entière** — la graduation est par mot (stabilité FSRS), une phrase Tatoeba contient plusieurs mots ; c'est exactement l'inapplicabilité que l'audit 04 (04-C2) a corrigée pour les dialogues, restée telle quelle pour Disposition. **À trancher au grill.**

### 07-A4 — Garantie de couverture grammaire aux Boss : arithmétiquement infaisable telle qu'écrite

PRD:235 : « le pool Grammaire/Conjugaison d'un combat Boss garantit une question sur chaque point rencontré depuis le dernier jalon Boss », Boss = 門弟/師範/Silver/Rocket/Kimono/Légendaires/E4/Lance/Red (PRD:277), « capacité 20 à 100 … largement suffisante pour les 5-7 points typiques d'une zone ». Trois incohérences chiffrées :
1. Les 門弟 sont des Boss mais font **10-20 questions** — la « capacité 20 à 100 » citée exclut ses propres premiers membres.
2. Au premier jalon (門弟 #1 de Falkner, 10 questions), la fenêtre « depuis le dernier jalon » = tout le début de jeu, et le gate de Falkner exige **15 points N5 rencontrés** (PRD:556) : 15 garanties > 10 questions. Infaisable.
3. « 5-7 points typiques d'une zone » contredit les gates eux-mêmes (15 N5 avant Falkner, 12 N4 avant Whitney, 25 N4 avant Morty…).

À trancher : garantie restreinte aux 師範+ (pas les 門弟) avec plafond, ou remplacée par la priorité pondérée déjà existante (boost 14 jours).

### 07-C2 — Distracteurs des modes QCM : source spécifiée nulle part (Sens, Lecture, Traduction, Écoute)

Grammaire/Conjugaison ont leurs `distractors[]`/`conjugation_distractors[]` produits au pipeline (étapes 13-14), le mini-quiz de leçon a sa règle (« tirage global dans la table kanji », PRD:300). Les 4 modes QCM de combat n'ont **rien** : d'où viennent les 3 mauvaises options de Sens (anglais et japonais), les 3 lectures hiragana de Lecture (avec le piège des lectures alternatives valides — こう/ぎょう pour 行 : rien n'interdit qu'un distracteur tiré soit une lecture correcte), les 3 sens de Traduction, les options d'Écoute ? Aucune étape pipeline, aucune règle runtime. L'écran de ces modes n'est pas maquettable sans cette règle.

### 07-D2 — Écoute : « 4 sens ou 4 lectures selon le niveau » — quel niveau, quelle règle ?

PRD:224. « Le niveau » n'est rattaché à rien (niveau du mot ? de la zone ? maîtrise FSRS ?) et le seuil de bascule sens↔lectures n'existe pas. Même écran non maquettable.

### 07-D3 — Composition : critère de réussite sous-spécifié

PRD:219 : « 4 tiles kanji → glisser-déposer pour former un mot valide ». Combien de tiles à utiliser (2 sur 4 ? toutes ?), « valide » = présent dans la table `words` ? plusieurs mots valides possibles avec les mêmes tiles (réussite si n'importe lequel ?) — rien n'est écrit. Par ailleurs la garde d'exclusion du mode (PRD:281) exige « aucun mot composé valide formable avec le studiedSet du combat », mais la signature `selectQuestionMode(battleType, encounteredGrammarCount, hasDispositionSentences, hasEcouteAudio)` (PRD:876) **n'a pas de paramètre pour cette garde** (ajoutée 2026-07-02 après l'écriture de la signature).

### 07-E1 — `getDōjōKanji(theme, studiedSet)` : fossile du theming par 師範

PRD:874. Les thèmes par 師範 sont supprimés depuis le 2026-07-02 (PRD:629, « il pioche dans studiedSet exactement comme getTrainerBattlePool ») — le paramètre `theme` n'a plus de source possible, et la fonction entière est redondante avec `getTrainerBattlePool`. À supprimer ou fusionner (selon la résolution de 07-A1).

### 07-E2 — En-têtes de la table des profils de poids : longueurs d'un ancien design

PRD:265 : « Route (5–8 questions) | Boss (≥ 10 questions) ». Depuis la courbe de difficulté (2026-07-01), un dresseur de route va jusqu'à 20-25 questions et des Boss (門弟) commencent à 10 — les parenthèses ne correspondent plus à rien et laissent croire que le profil dépend du nombre de questions plutôt que de la catégorie.

### 07-D4 — « Erreurs tolérées » vs barre à 0 : sémantique off-by-one

PRD:206-208 : N = « erreurs tolérées », chaque erreur retire 1/N, barre à 0 = défaite → la N-ième erreur est fatale, donc seules N-1 erreurs sont « tolérées ». « Répondre … en restant **sous** le nombre d'erreurs tolérées = victoire » (PRD:208) confirme l'ambiguïté au lieu de la lever. Une ligne suffit (N = nombre de vies ; la N-ième erreur = défaite).

### 07-D5 — Échec d'une question en combat : feedback jamais spécifié

Perdre 1/N de barre est défini ; ce que voit le joueur ne l'est pas — la bonne réponse est-elle montrée (risque : l'app est un outil d'apprentissage, ne pas corriger est pédagogiquement notable), passe-t-on directement à la question suivante ? Le mini-quiz de leçon a sa règle (retry jusqu'à correct), le combat n'en a aucune.

### 07-D6 — Légendaires : « combat tiré de son domaine grammatical » vs profil Boss à 9 modes

PRD:542 : chaque rencontre légendaire = « combat tiré de son domaine grammatical » (45/52/60 questions). PRD:277 : les Légendaires sont des Boss ordinaires au profil 9 modes (27 % Disposition, 11 % Sens…). Un combat 100 % grammaire d'un domaine précis et un combat Boss standard sont deux objets différents — lequel est-ce ? Et si c'est un mix, quelle proportion vient du domaine ?

### 07-D7 — 門弟 : progression Johto ambiguë, Kanto totalement absente

- PRD:251 : « 10 (Falkner) | 13, 16, 18 | 20 (Clair) » — 5 valeurs pour 8 gyms Johto : lesquels ont 13, 16, 18 ?
- Les gyms **Kanto** n'ont aucune longueur 門弟 (la table PRD:587-596 ne donne que le 師範), alors que la structure « 2 門弟 + 師範 » s'applique partout (guidebook règle 4).
- Sourcing Kanto : les gardiens par gym vont de **0 (Brock, explicitement aucun — guidebook:1379) à ~5-6** ; avec 2 門弟 uniformes, Brock exige d'inventer 2 dresseurs (politique d'invention à clarifier pour les dresseurs-combat) et guidebook:1370 (« utile pour calibrer **combien** de dresseurs-combat placer par Gym Kanto ») contredit la structure fixe « à garder telle quelle » de guidebook:1097.

### 07-C3 — L'écran « 試練 » des gyms n'est défini nulle part

Toutes les fiches gym du guidebook (`:236, :374, :490, :600, :699, :736, :798, :886` + modèle `:1095` « 2 門弟 → porte → **試練 screen** → 印 ceremony ») nomment un écran 試練 avec un intitulé thématique (空の道, 虫の道…). Le PRD § 道場 ne contient ni le mot ni le concept — si 試練 = simplement le combat du 師範, une ligne d'équivalence suffit ; sinon c'est un écran entier non spécifié. Les gabarits de puzzle notés côté Kanto (interrupteurs de Surge, téléporteurs de Sabrina, murs invisibles de Janine, tuiles-flèches de Blue, glace+dresseurs-freins de Seafoam) sont des **propositions jamais adoptées ni rejetées** — le PRD ne dit pas si un gym contient un puzzle spatial ou n'est qu'une salle avec 3 combats.

### 07-B2 — « 5–6 dresseurs par route » (R30/R31) : chiffre non sourcé

`guidebook-adapted.md:203` promet « Positions dresseurs sur les deux routes (5–6 par route) » ; le roster sourcé du même fichier confirme **2 dresseurs nommés par route** (Joey/Wade, Mikey/Don) + des « dresseurs génériques » non dénombrés. Le 5-6 vient d'un ancien texte, pas du dépouillement. Même problème de fond que les « 8-10 dresseurs inventés » de Route 29 (déjà reporté à la synthèse par l'audit 01) — le sort des slots non sourcés des routes précoces doit être tranché au même endroit.

### 07-E3 — Guidebook : « 27 classes au total dans le PRD » + colonne « Thème kanji proposé » — références mortes

`guidebook-adapted.md:35` et `:43` renvoient à une table de 27 classes « dans PRD § Dresseurs de Route » qui n'existe plus (retirée 2026-07-01, PRD:184) ; la table locale `:45-62` garde une colonne « **Thème kanji proposé** » (16 lignes de theming par classe), trace directe du mécanisme supprimé — règle transverse 3. La colonne « Zones où elle apparaît » (sourcing factuel) est la seule à conserver.

### 07-A5 — Guidebook : la rencontre Silver « supplémentaire » mal identifiée

`guidebook-adapted.md:101` : « le PRD ajoute déjà une rencontre supplémentaire (**#6, post-Red, optionnelle**) ». Faux — la table PRD (PRD:440-446) : #6 = Route Victoire (dernier combat avant la Ligue, = le 5ᵉ combat du jeu d'origine) ; la rencontre ajoutée par le PRD est la **#4 (QG Rocket, cameo sans combat)**. Aucune rencontre post-Red n'existe dans aucun doc.

### 07-E4 — Table « Zones absentes » : colonnes Traitement jamais mises à jour après la réintégration (rosters)

La réintégration générale (2026-07-06, audit 04) a changé les statuts mais pas les textes :
- **Union Cave** (`:1418`) : « Réintégrée » / « Aucun décor Union Cave sur la carte … 7 dresseurs nommés — **non repris, hors scope confirmé** ».
- **Route 41** (`:1419`) : « Réintégrée — **défusionnée** de Route 40 » / « ~10 Nageurs **fusionnés conceptuellement dans le pool Route 40** ».
- **Route 46** (`:1421`) : « Réintégrée » / « **Non repris** — Route 29 garde son tease visuel … sans zone jouable derrière ».
Trois auto-contradictions statut/traitement, qui portent précisément des rosters de dresseurs (7 + ~10 + 1).

### 07-E5 — Rosters Kanto : notes « à compléter » périmées par la passe 7

`guidebook-adapted.md:1387` (« ⚠️ routes 5, 6, 9, 10, 14 à 21, 22 à 25 sans roster ») et `:1406` (« restent à compléter : … ») datent des passes 3/6 ; la passe 7 (`:1349-1366`, 2026-07-02) fournit les rosters de toutes ces routes (R5/6, R9/10, R14/15 : 18 dresseurs, R16/17/18 : 22, R19/20 : 14-15, R21 : 5, R24/25 : 9-10). Seules les équipes Pokémon de 4 師範 (hors périmètre) manquent réellement.

---

## Décisions du grill (Phase 2, 2026-07-07) — toutes appliquées en Phase 3

1. **Mécanisme B réécrit (07-B1)** : batch IA de **définitions japonaises courtes + 3 distracteurs** pour les 2 136 kanji et 7 836 mots JLPT, relu une fois (pipeline 8ter, champs `jp_definition`/`jp_definition_distractors[]`) ; relations JMdict = matériau d'appoint. Couverture 100 %, la promesse « graduation vers 100 % japonais » tient.
2. **Sens/Lecture/Saisie testent kanji ET mots (07-A3)** — les deux types d'items étudiés, graduation par item tiré.
3. **Pool de combat unique (07-A1/07-C1)** : tous les items étudiés, **tirage pondéré récent** (majorité sur les ~50 derniers — « c'est bien qu'on mette l'accent sur ce qu'on vient de voir », le SRS garde la rétention longue). `kanji_pool[]` supprimé (schéma, manifest, trainers.json en passe contenu) ; `getTrainerBattlePool`/`getDōjōKanji` remplacés par `getBattlePool(studiedItems)` ; fallback « <5 » supprimé.
4. **Saisie maîtrisé (07-D1)** : l'item affiché en kanji → taper sa lecture (lecture-production ; recouvrement assumé avec Lecture : QCM = reconnaître, Saisie = produire).
5. **Disposition maîtrisée (07-D1)** : phrase maîtrisée = **tous ses mots maîtrisés** ; consigne = **audio de la phrase** (rejouable), pré-généré VOICEVOX sur une pool présélectionnée (pipeline 4bis, `sentences.audio_ref`, taille à la synthèse). **Aucun bouton d'aide** — rien ne se consulte en combat.
6. **Seuil de maîtrise abaissé : stabilité FSRS ≥ 14 jours** (était 30 — « trop gros », tranché sur les données Anki réelles d'Henri : 1 156/1 635 cartes ≥ 14 j). S'applique partout (graduation, tuiles dorées, achievements, Loterie).
7. **Échec en combat (07-D5)** : correction brève affichée (1-2 s), la vie est perdue quand même ; jamais de retry en combat. Sémantique des vies levée (07-D4 : la N-ième erreur est fatale).
8. **Jalons-examens (07-A4/07-C3, idée Henri « les boss comme de réels examens »)** : 師範 (16), Elite Four, Lance, Red = **examens à sections mini-JLPT** — écran 試練 = page de garde (le concept du guidebook enfin défini), sections 文字・語彙 → 文法 → 読解 → 聴解 (quotas = poids Boss existants), relevé de notes, cérémonie du 印. Silver/Rocket/Kimono/Légendaires = combats narratifs mélangés ; les 門弟 aussi.
9. **Grammaire des Boss (07-A4)** : garantie infaisable remplacée par la **rotation plus-anciens-d'abord** (`last_drawn_at`), dans le quota de section (examens) ou le tirage pondéré (narratifs).
10. **Gyms (07-C3/07-D7)** : **puzzles spatiaux HGSS conservés** (pure navigation, jamais un gate de langue) ; 門弟 chiffrés par gym — Johto 10/11/13/14/16/17/18/20, Kanto 21→28 (+1 par badge) ; **Brock : 0 門弟** (exception sourcée, zéro invention).
11. **Écoute (07-D2)** : mot non maîtrisé = audio → 4 sens anglais ; mot maîtrisé = audio → **4 écritures kanji quasi-homophones** (けいざい → 経済／携帯／掲載／健在 — « du kana à l'oreille, c'est de la dictée ; il faut du kanji », tranché par Henri ; précalcul déterministe 13bis, `words.near_homophones[]`) ; phrases : anglais avant maîtrise, puis relayées par Disposition-audio.
12. **Légendaires (07-D6)** : combat narratif standard à 9 modes ; seuls les tirages Grammaire/Conjugaison sont restreints au domaine du légendaire.
13. **Distracteurs (07-C2)** et **Composition (07-D3)** : règles par défaut documentées au PRD (proposition de calibration) — voir § Système de Combat, « Sources des distracteurs » et la ligne Composition de la table des modes ; `selectQuestionMode` gagne `hasComposablePairs`, `getExamSections` ajouté.

## Corrections appliquées (Phase 3, 2026-07-07)

Toutes marquées `(corrigé/tranché 2026-07-07, audit 07)` :
- **PRD** : mécanismes B/C réécrits ; table des 9 modes (Sens/Lecture/Saisie/Composition/Disposition/Écoute) ; paragraphe graduation + nouveau § Sources des distracteurs ; § Structure (vies, feedback d'échec) ; rotation grammaire Boss ; nouveau § Jalons-examens vs combats narratifs ; en-têtes de la table de poids (07-E2) ; ligne 門弟 de la table des longueurs + note Kanto ; § Dresseurs de Route (kanji_pool supprimé, pool pondéré récent) ; 3× « Kanji du combat » Rocket → « Kanji signature » (07-A2) ; Légendaires ; § 道場 (puzzles, 門弟 sourcés, Brock, examen 試練) ; seuil 14 j (5 occurrences) ; schéma (`map_trainers`, `kanji`, `words`, `sentences`) ; ProgressionEngine (getBattlePool, getGrammarForBattle re-signé, selectQuestionMode, getExamSections) ; pipeline (4bis, 8ter, 13bis) ; manifest dresseurs.
- **Guidebook** : règle 4 (structure gym) ; règle 9 + table des classes (colonne « Thème kanji proposé » supprimée, 07-E3) ; note Silver #6 (07-A5) ; route-30/31 « 5-6 par route » (07-B2) ; Loterie 14 j ; § Gyms récurrents (試練 défini, puzzles, Brock) ; intro table gardiens Kanto ; notes rosters périmées (07-E5, 2×) ; Union Cave / Route 41 / Route 46 (07-E4).

## Passe de vérification post-implémentation (2026-07-07) — V-1 → V-17

Relecture intégrale des sections modifiées + grep transverse (PRD, guidebook, curriculum-checkpoints, texts-progressifs, CONTEXT, ADRs). Vérifié sain : plus aucune occurrence de `kanji_pool`/`getTrainerBattlePool`/`getDōjōKanji`/« 30 jours » hors notes historiques ; tables markdown intactes ; numérotation pipeline (4bis/8ter/13bis) cohérente ; § 道場 ↔ § Jalons-examens ↔ table des longueurs alignés (24 Falkner → 98 Blue). Reliquats corrigés :

- **V-1** (PRD § Langue du Jeu, mécanisme A) : la liste des modes qui graduent n'incluait pas Écoute.
- **V-2** (PRD, graduation QCM→saisie grammaire) : même liste, même ajout.
- **V-3** (PRD, « Aucun chrono ») : « nombre d'erreurs tolérées » → « nombre de vies » (aligné 07-D4).
- **V-4** (PRD, modes indisponibles) : la garde Disposition ne mentionnait pas l'appartenance à la pool présélectionnée.
- **V-5** (PRD, pas de répétition) : « même kanji en Sens/Lecture » omettait Saisie et les mots.
- **V-6** (PRD, sources des distracteurs) : le cas Écoute non-maîtrisé n'était pas couvert (= règle de Sens non-maîtrisé).
- **V-7** (PRD, modes indisponibles) : l'audio des phrases Écoute n'avait pas de source (Tatoeba n'a pas d'audio natif) — il provient de la même pool Disposition-audio (étape 4bis).
- **V-8** (PRD § Boucle Quotidienne, 03-A3) : « un combat ne lit ni ne note jamais une carte FSRS » contredisait la graduation qui lit la maîtrise — précisé : n'écrit jamais, lit en lecture seule (comme la Loterie) ; « pioche studiedSet » précisé en « items étudiés, pondéré récent ». Idem pour le re-match téléphonique (§ Pokégear).
- **V-9** (guidebook, règle 11) : disait encore « 2 inconnus max par **page** de dialogue » — contredisait la correction « par dialogue entier » de l'audit 04 (04-A2) ; Rocket ajouté à la liste des kanji signature.
- **V-10** (PRD § Carte Mot) : « kanji encore à **maîtriser** avant que ce mot rejoigne le SRS » — fossile d'avant le seuil assoupli du 2026-07-01 (déblocage = kanji **étudiés**).
- **V-11** (PRD, table des sources) : la ligne VOICEVOX ne mentionnait pas la pool Disposition (4bis).
- **V-12** (curriculum-checkpoints § Cartes mots) : « `card_type` distingue kanji/mot » — schéma d'avant l'audit 03 (`item_type` + `facet`).
- **V-13** (curriculum-checkpoints § Règle de Silver) : le lieu #5 disait encore « Tour Radio B2F » (en-tête + table) — la table PRD dit Tunnel de Doublonville B2F depuis sa correction sourcée.
- **V-14** (curriculum-checkpoints, Silver #4) : « à garder en tête si le PRD veut un vrai combat ici » — hésitation périmée, le cameo est acté (`outcome = cameo`, audit 02).
- **V-15** (guidebook § ecruteak-city) : « Silver apparition #3 (devant Tour Jo, studied ≥ 550) » contredisait la section burned-tower du même fichier, la table PRD (#3 = Tour Embrasée, haut de l'échelle) et la calibration N3 de la zone.
- **V-16** (guidebook § ecruteak-city) : « Événement collectif Kimono Girls (après toutes les 5 **battues**) » — reliquat d'avant l'audit 01 (scènes/leçons) ; déclencheur aligné sur « post-remise du grand texte d'Elm ».
- **V-17** (guidebook § goldenrod-city, séquence Tour Radio) : la parenthèse citait encore « PRD : "Tour Radio B2F" » comme si le PRD n'était pas corrigé.

**Flag → synthèse (non corrigé, décision de scope)** : les deux « apparitions Silver bonus » de Mont Gris (Route 28 avant Red ; Versants après Red — `guidebook-adapted.md` § mt-silver, reprises par `curriculum-checkpoints.md` § Règle de Silver) sont des **ajouts narratifs inventés par le studio**, explicitement hors des 6 Rencontres, avec des kanji signature « à définir ». Elles datent d'avant la politique zéro-invention (audit 01) et restent au conditionnel (« si le PRD les conserve ») dans les deux fichiers. Adopter (2 scènes muettes, pas des combats) ou purger — à trancher à la synthèse avec l'arc Mont Gris.

## Reporté à la synthèse (hors périmètre audit 07)

1. **`guidebook-adapted.md:1190-1191`** : paragraphe « Hors scope v1 : HM08 Escalade… à trancher avec l'arc Mont Gris » — fossile contredisant la table 8 lignes plus haut (`:1183`, 登 réintégré) et la décision « aucune v2 ». Périmètre CS-Kanji/géographie (audits 04/05), pas combat — mais à purger.
2. **`guidebook-adapted.md:1210`** : mapping musique « Union Cave n'existe pas dans le jeu » — périmé depuis la réintégration.
3. Sort définitif des **dresseurs inventés des routes précoces** (Route 29 : 8-10 ; R30/31 : slots au-delà des sourcés — cf. 07-B2) : déjà pointé par l'audit 01, confirmé ici, à chiffrer à la synthèse avec les budgets des zones réintégrées.
4. **Récompenses de combat en ¥** : montants explicitement à la synthèse (PRD § Monnaie) — rien à auditer de plus ici.
5. Concept **« compagnon »** (gauntlet Kimono « un seul compagnon par combat ») : déjà réservé à la synthèse par l'audit 04, inchangé.
6. **Taille de la pool Disposition-audio** (combien de phrases pré-générées VOICEVOX, poids de stockage) et **paramètres du tirage pondéré récent** (taille de fenêtre ~50, ratio récent/historique) : à chiffrer à la synthèse.
7. **Tile-authoring des 16 intérieurs de gym avec puzzle spatial** : chiffré à la synthèse avec le reste de la géographie.
