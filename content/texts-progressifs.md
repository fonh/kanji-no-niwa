# Textes Progressifs — 漢字の庭

Document interne — non visible par le joueur. Détaille le système résumé dans `PRD.md` § Textes
Progressifs : contenu, calibrage JLPT, densité/placement sur la carte, et modèle de récompense.

**Origine (2026-07-02)** — remplace la version précédente à deux régimes ("textes de quête" avec quiz
vs "textes Tadoku" en lecture libre avec verrou de temps). Décisions prises en session de grillage avec
l'équipe produit :

- L'app est un projet privé, jamais publié commercialement — **la licence des sources n'est plus un
  facteur bloquant** (Tadoku CC BY-NC-ND, NHK Web Easy sans licence de réutilisation confirmée peuvent
  être utilisés tels quels). Seule contrainte : si le projet devait un jour être rendu public, cette
  page serait à ré-auditer.
- **Pas de verrou de temps.** Ce qui force une vraie lecture, c'est le quiz de compréhension — pas une
  minuterie qui bride le rythme du joueur.
- **Un seul régime de lecture, deux tiers de texte.** Voir § Modèle ci-dessous.
- **Volume massif requis** — pas 8 textes sur tout le jeu, mais des dizaines, répartis sur (quasiment)
  toutes les zones. Les textes secondaires remplacent les side quests classiques du jeu.
- **Les CS-Kanji ne sont plus liés à la maîtrise FSRS (2026-07-02)** — remplacés par une condition de
  lecture, le donneur et le moment narratif restant sourcés du jeu d'origine. Voir § CS-Kanji.
  *(Révisé 2026-07-06, repasse progression : la « lecture complète » — tous les textes des zones
  débloquées — a été jugée trop exigeante au grill ; remplacée par un **seuil de textes lus** par CS,
  voir § CS-Kanji, Condition d'activation.)*

---

## Modèle — un seul régime, deux tiers

Tout texte, sans exception, se lit dans la même fenêtre de lecture dédiée plein écran (même famille que
l'écran-livre des leçons, voir `PRD.md` § Leçons — texture de fond variable selon le type de document,
voir § Style visuel ci-dessous) et se termine par un **quiz de compréhension obligatoire, retry-jusqu'à-
correct** (même mécanique que le mini-quiz de leçon — mauvaise réponse → on recommence la question, pas
de correction affichée puis passage forcé). Ce qui distingue les deux tiers, c'est uniquement **ce que
la réussite du quiz débloque** :

**Pendant le quiz, le texte reste consultable à tout moment** (bascule libre question ↔ texte, sans
pénalité, tous types de questions — ajouté 2026-07-07, audit 05, finding 05-C2 : comme au JLPT réel, la
compréhension écrite teste la lecture, pas la mémorisation ; retourner chercher une info dans le texte
est une compétence en soi, 情報検索). Chaque passage enregistre un **score en première tentative** — le
% de questions réussies du premier coup, définition du champ `text_completions.score` *(précisée
2026-07-07, audit 05, finding 05-A1 : sous retry-jusqu'à-correct, tout joueur finit à 100 % — seul le
score en première tentative a un sens)*. Ce score est purement statistique pour tous les textes du jeu
sauf un : le texte final de Red (voir § Textes obligatoires).

### Textes obligatoires (story-gating)

Réussir le quiz est une `Condition` requise pour l'`Effect.advance_quest` / `unlock_zone` / `badge_earned`
suivant — bloque la progression principale, exactement comme un combat de 師範 ou une porte curriculaire.
Réutilise le modèle `Condition`/`Effect` déjà établi (`PRD.md` § Implémentation) : `Condition.event_cleared`
sur l'identifiant du texte, testé par les `state_rules` du PNJ/porte suivant. Aucun nouveau système.

Placement : **un texte obligatoire par badge de gym** (16 : 8 Johto + 8 Kanto — le "1 texte lu" déjà
noté comme gate curriculaire de Falkner dans `PRD.md` § Système 道場 devient donc la règle générale, pas
une exception), plus les jalons narratifs majeurs qui n'ont pas de gym associé : les 3 lieux Team Rocket,
l'Antre du Dragon (le "quiz d'empathie du Maître, 5 questions" déjà prévu pour le 印 de Clair EST cette
mécanique — pas un système à part, juste son application au cas Clair), le texte final face à Red
(déjà spécifié : chapitre de manga + lettre du mentor — **score en première tentative ≥ 80 % requis
pour débloquer le combat** ; précisé 2026-07-07, audit 05, finding 05-A1 : le quiz reste
retry-jusqu'à-correct comme partout, mais tant que le score en première tentative est < 80 %, le
combat reste verrouillé — le joueur peut relire et repasser le quiz, questions remélangées),
**et les 8 textes de remise des CS-Kanji** (7 remis par PNJ + 滝 trouvé — voir § CS-Kanji ; comptés
ici depuis le 2026-07-06, repasse progression, finding P-2 : ils étaient définis comme « textes
obligatoires » sans figurer au total).
Total : **~28-29 textes obligatoires** sur tout le jeu *(« ~20-21 » corrigé 2026-07-06, P-2)*.

### Textes secondaires (side-quest)

Optionnels pour progresser — le joueur peut finir le jeu sans les avoir tous lus. Mais réussir leur quiz
est **requis pour recevoir la récompense** : pas de "passage forcé" ni de correction affichée, comme les
textes obligatoires.

**Deux `Effect` possibles (2026-07-02, réconcilié avec `PRD.md` § Implémentation)** — `grant_item`
quand la récompense est un objet (cosmétique ou narratif, voir catalogue ci-dessous), `unlock_text`
quand la récompense est un autre contenu de lecture (scène bonus, lettre rare — tier Lore). Les deux
sont idempotents, aucun nouveau type `Effect` nécessaire. **Le doré n'est plus une récompense
(redéfini 2026-07-07, audit 08, finding 08-D8 — remplace la sémantique 05-A2 « Doré = marqué par
`unlock_text` ») : c'est une couche de qualité transverse à tous les textes** — doré = une passe de
quiz sans faute, obtenable à tout moment en relisant (quiz remélangé), stockée dans
`text_completions.gold_at`. Voir § Menu "tous les textes" ci-dessous et PRD § Textes Progressifs.

**Catalogue de vraies récompenses** (`grant_item` généralisé aux cosmétiques, pas seulement aux objets
narratifs — le principe « pas de trophée décoratif » est servi par ce catalogue, plus par le doré,
qui est désormais une couche de qualité comme les tuiles dorées du Kanjidex, finding 08-D8) :

| Tier de récompense | Exemples | Fréquence |
|---|---|---|
| **Cosmétique** (`grant_item`, type cosmétique) | Skins d'avatar, palette de l'écran-livre/lecture, teintes de dialogue box, variantes de palette du compagnon (Pikachu — synthèse), titre de profil affiché ("Lecteur assidu de Doublonville") | Le gros du volume — zéro risque d'équilibre, à distribuer généreusement sur les ~85-115 textes |
| **Confort contextuel** (`grant_item` ou `Condition` locale) | Un point d'ancrage de voyage rapide propre à ce texte précis (pas un CS-Kanji générique), un indice caché (position d'un dresseur non repéré, astuce mnémotechnique bonus pour un kanji difficile de la zone) | Fréquent, mais toujours local à une zone, jamais un pouvoir global |
| **Lore/narratif** (`unlock_text` + `advance_quest` sur une quête d'arc) | Compléter tous les textes secondaires d'une zone/arc débloque une scène bonus, une lettre rare du mentor, un easter egg | Par zone ou arc entier, pas par texte individuel |

*(L'ancien filet « statut doré seul comme récompense » disparaît avec la redéfinition 08-D8 : un texte
secondaire sans ligne du tableau ci-dessus n'a simplement pas de récompense matérielle — la chasse au
doré, transverse à tous les textes, reste son incitation légère.)*

**Les CS-Kanji ne sont plus une récompense de texte individuel — voir § CS-Kanji ci-dessous.** Décision
2026-07-02 : la lecture n'accorde plus les capacités de déplacement au cas par cas (ce qui aurait
dupliqué le territoire des CS-Kanji texte par texte) — à la place, le système de lecture devient
lui-même **la condition d'obtention de chaque CS-Kanji**, sur tout le jeu.

Placement : les textes secondaires **remplacent** les side quests classiques du jeu — c'est leur rôle
principal, pas un supplément. Ils s'appuient sur l'inventaire de PNJ déjà documenté zone par zone
(`content/curriculum-checkpoints.md` § PNJ sourcés par zone) : un PNJ déjà listé (pas forcément
dresseur-combat ni dresseur-leçon) peut tenir un texte plutôt qu'une leçon ou un combat — même logique
que la "3ᵉ catégorie" déjà actée pour les leçons (PNJ ambiants recatégorisés). Pour les routes sans PNJ
nommé (ex. route-33), le texte est un objet trouvé sur la carte (panneau, inscription, parchemin tombé)
plutôt que remis par un personnage.

Densité cible (à ajuster par l'équipe de contenu, pas un quota strict) :

| Type de zone | Textes secondaires |
|---|---|
| Route de transit, peu/pas de PNJ nommé | 0–1 (objet trouvé) |
| Route avec PNJ nommés | 1–2 |
| Ville/hub (Mauville, Doublonville, Rosalia, etc.) | 3–5 |
| Donjon majeur (Tour Grospignon, Forêt Secte, Tour Embrasée, Mont Mortier, Chemin Glacé, Antre du Dragon, Tour Radio, QG Rocket) | 2–3 |
| Ville Kanto (8 villes) | 2–4 |

Sur **83 zones** *(recompté 2026-07-07, synthèse : 11 zones réintégrées ajoutées à la table de
calibration — voir `curriculum-checkpoints.md` § Redistribution ; les intérieurs héritent de leur zone
d'accès, pas de ligne propre)*, ça donne un ordre de grandeur de **~85-115 textes secondaires**
*(« ~70-100 » recompté en proportion — les 11 nouvelles zones sont surtout des routes/donjons à densité
0-2)* — cible volontairement large ("plein de textes partout"), à affiner en écrivant zone par zone
plutôt qu'à figer ici.

**Vérification de faisabilité (2026-07-02, lecture complète de `guidebook-adapted.md`)** — cette densité
est en fait **conservative** : Doublonville seule a "~30 PNJ/rôles" documentés, les 8 villes Kanto sont
tout aussi denses. Une partie des textes secondaires n'a même pas besoin d'être inventée — le guidebook
identifie déjà des "textes tout trouvés" réutilisables tels quels (lettre du gendre de Kurt au Puits
Ramoloss, livre de légende des 3 esprits à Rosalia, Rapport Unown + 5 inscriptions aux Ruines Arcaniques,
carnet des Frères/sœurs du jour Route 26, inscription à traduire dans l'Antre du Dragon). Zones confirmées
pauvres en PNJ (`found_object_ref` par défaut, cohérent avec § Priorité d'attribution) : Route 33, Route
de la Victoire/Antichambre, Vertville, Azuria/Cerulean, Route 22/28 (Kanto).

**Kanto complet (corrigé 2026-07-06, repasse progression — remplace « Kanto reste compressé » du
2026-07-02)** : les 14 routes/donjons Kanto sont dans la table de calibration depuis le 2026-07-02
même, et la géographie HGSS est intégralement réintégrée (04-B1, « aucune v2 ») — l'ancien paragraphe
(« réserve pour une extension future ») était un fossile d'une décision annulée le jour où elle a été
écrite. Les textes secondaires Kanto se répartissent donc villes **et** routes/donjons (Route 14/15,
Rock Tunnel, Grotte Diglett, Seafoam… — densités de la table ci-dessus) ; recompte fait 2026-07-07, synthèse : 83 zones, ~85-115 secondaires.

**Priorité d'attribution des PNJ (2026-07-02)** — trois usages revendiquent maintenant le même vivier de
PNJ sourcés guidebook par zone (dresseur-combat, PNJ-leçon, PNJ-texte) alors que plusieurs zones sont déjà
documentées comme pauvres en PNJ nommés (`curriculum-checkpoints.md` § PNJ sourcés par zone : route-33
"aucun", route-38/44/45 "pas de nom sourcé", Route 29 "aucun dresseur nommé" — bootstrap Elm déjà
nécessaire rien que pour les leçons). Ordre de priorité explicite pour éviter les conflits d'attribution à
l'écriture : **leçons d'abord** sur le vivier guidebook (déjà la règle en place), **PNJ-texte ensuite**
sur ce qui reste, **objet trouvé par défaut** (pas en exception) dans les zones déjà identifiées comme
pauvres en PNJ nommés — pas la peine d'inventer un PNJ supplémentaire juste pour porter un texte quand la
carte propose déjà une carte trouvée/un panneau.

**Déclenchement — `talk` par défaut, `sight_auto`/`block` pour les moments mis en scène (2026-07-02)** :
les deux mécanismes de `map_npcs` (déjà définis, `PRD.md` § Implémentation) s'appliquent aux textes.
`talk` par défaut (le joueur choisit d'aborder le PNJ ou l'objet trouvé) — couvre la quasi-totalité des
textes secondaires. `sight_auto` + `sight_auto_result: block` réservé aux textes obligatoires qui doivent
verrouiller un passage avant lecture (même mécanique que le blocage d'ordre des leçons, § Leçons du PRD)
— utile pour un texte qui bloque un couloir, pas pour une side-quest optionnelle qui n'a aucune raison
d'ambusher le joueur.

**Mapping texture visuelle ↔ type de source (2026-07-02, guideline non stricte)** — un décalage
occasionnel n'est pas une erreur grave, mais sert de repère par défaut pour ne pas avoir à trancher texte
par texte :

| Texture (fond de la fenêtre de lecture) | Source naturelle |
|---|---|
| Article (colonnes, bandeau titre) | NHK Web Easy, Watanoc, Matcha Easy Japanese — ce sont déjà des articles |
| Carnet / page de journal | Tadoku graded readers, contenu maison (Batch IA) — récits personnels |
| Lettre | Contenu écrit/généré maison — doit référencer un PNJ/événement du jeu, rarement une source externe telle quelle |
| Parchemin / inscription | Aozora Bunko, ou IA en style archaïque — réservé aux moments narratifs anciens |

---

## Calibrage JLPT — longueurs de passage réelles

Le calibrage précédent (30 à 2000+ caractères sur 8 points) était arbitraire. Voici les longueurs de
passage réellement utilisées par le JLPT officiel (source : format d'examen JLPT, sections 内容理解
courte/moyenne/longue), qui servent de plafond réaliste par palier — **utilisées comme repère, pas comme
règle stricte** : nos textes de début de palier peuvent être plus courts (le joueur découvre juste le
niveau), nos textes de fin de palier peuvent s'approcher du plafond JLPT réel.

| Palier | Longueur JLPT réelle (repère) | Longueur cible dans le jeu (début → fin de palier) |
|---|---|---|
| N5 | ~100–200 caractères | 30–150 |
| N4 | ~150–300 caractères | 100–300 |
| N3 | ~350–600 caractères (courte à moyenne) | 250–550 |
| N2 | ~600–900 caractères | 500–850 |
| N1 | ~900–1200+ caractères (longue, textes académiques/abstraits) | 800–1200 (2000+ uniquement pour le texte final Red, délibérément hors-norme comme épreuve de fin de jeu) |

Ce tableau remplace la colonne "Longueur" de l'ancienne table du PRD — les longueurs y restent des
repères pour les textes obligatoires déjà nommés (Route 29, Falkner, Puits Ramoloss, Whitney, Tour
Embrasée, Tour Radio, Antre du Dragon, Red), désormais alignées sur des bornes JLPT réelles plutôt
qu'inventées.

---

## Vetting des textes réels contre le `studiedSet` (2026-07-02)

Risque identifié : la règle "2 kanji inconnus max" (`curriculum-checkpoints.md` § Les deux règles
absolues) s'applique à tout le japonais écrit du jeu, mais un article NHK Web Easy/Watanoc/Matcha réel est
écrit pour un public N3 (ou autre) générique — pas pour le `studiedSet` exact d'un joueur à un point
précis du jeu. Sans vérification, un article "réel et vivant" peut contenir 10-15 kanji inconnus au lieu
de 2, recassant le principe i+1 que le reste du jeu respecte scrupuleusement — pire que l'ancien problème
Aozora (trop littéraire, mais au moins choisi passage par passage).

**Budget kanji des textes (tranché 2026-07-07, audit 05, finding 05-D1)** — la règle des dialogues
(« 2 inconnus max par dialogue entier », audit 04) reste inchangée pour les dialogues, mais ne
s'applique pas telle quelle à un texte de 300–1200 caractères (intenable : chaque article réel serait
à réécrire). Pour les Textes Progressifs, elle devient **proportionnelle : ~2 kanji inconnus par
tranche de 100 caractères, plafonnés à 8–10 kanji inconnus *distincts* par texte entier, tous paliers**.
Même contrat de lisibilité (~98 % de couverture — le seuil de confort documenté par la recherche en
lecture extensive, philosophie Tadoku), adapté à la longueur. Les inconnus gardent furigana révélable
(bouton Y) et popup de mot — des moments de découverte, pas des murs.

**Étape de production ajoutée** : avant qu'un article candidat entre dans la table `texts`, un script
compare son vocabulaire kanji au `studiedSet` théorique du palier visé (repère : bornes de
`content/curriculum-checkpoints.md`) et ne retient que les candidats dans le budget ci-dessus.
Deux issues possibles :
- **Accepté tel quel** si l'écart est déjà dans la marge.
- **Édité avant insertion** si l'article est pédagogiquement bon mais dépasse l'écart (remplacer un mot
  rare par un synonyme déjà étudié, ou l'accepter dans le budget d'inconnus si le mot est central au
  sens). Toujours une passe humaine, jamais un filtre qui rejette silencieusement du bon contenu.

Cette étape s'ajoute à la sélection déjà prévue (`content/texts-progressifs.md` § Sources) — elle ne la
remplace pas.

---

## Diversité des questions de compréhension

Chaque quiz (3–5 questions, obligatoire ou secondaire) doit couvrir plus que du rappel factuel. Cinq
types, calqués sur les catégories réelles du JLPT (内容理解, 情報検索) plutôt qu'inventés :

| Type | Ce que ça teste | Exemple de prompt |
|---|---|---|
| **Idée générale / résumé** | Compréhension globale, pas juste un détail | "De quoi parle ce texte ?" |
| **Détail factuel** | Rappel d'une information explicite | "Où le personnage a-t-il trouvé l'objet ?" |
| **Vocabulaire en contexte** | Sens d'un mot polysémique *dans ce passage précis* | Mot souligné dans le texte → son sens ici |
| **Inférence** | Sentiment, motivation, ce qui va probablement se passer | "Pourquoi le personnage est-il inquiet ?" |
| **Résolution de référence** | À quoi renvoie un pronom/une ellipse (これ/それ/sujet omis) | "À qui/quoi correspond 「それ」 dans cette phrase ?" — compétence spécifique au japonais (ellipse du sujet), jamais testée par les 9 modes de combat |

**Règle de composition minimale (plancher, tous paliers)** : sur 3–5 questions, au moins **1 idée
générale + 1 vocabulaire en contexte** ; le reste réparti entre factuel/inférence/référence. Évite le
biais par défaut vers le pur rappel factuel, qui teste la mémoire plutôt que la compréhension.

**Courbe par palier JLPT (2026-07-02)** — le plancher ci-dessus est universel, mais un vrai prof
attendrait l'inverse du JLPT réel si on ne fait que ce plancher partout : un texte N5 ne devrait pas
demander une inférence de sentiment (charge cognitive trop lourde pour un vrai débutant, même en langue
simple), alors qu'un texte N1 sous-exploite le joueur avec seulement le plancher minimal. Composition
cible par palier, en plus du plancher :

| Palier | Composition cible |
|---|---|
| N5 / N4 | Plancher (1 idée générale + 1 vocabulaire en contexte), le reste **factuel uniquement — inférence et résolution de référence interdites**, trop tôt pour ce niveau de charge cognitive en L2. *(Reformulé 2026-07-07, audit 05, finding 05-D3 : « quasi exclusivement factuel » contredisait arithmétiquement le plancher universel sur un quiz de 3 questions — une question « de quoi parle ce texte ? » sur un billet de 80 caractères n'est pas une charge lourde, c'est l'inférence que la courbe voulait exclure.)* |
| N3 | Plancher standard (1 idée générale + 1 vocabulaire), 1 inférence simple introduite. |
| N2 / N1 | Inférence et résolution de référence dominantes (au moins 2 des 3-5 questions) — ce sont les compétences réellement testées aux paliers hauts du JLPT réel. Le factuel devient optionnel, pas garanti. |

---

## Retry-jusqu'à-correct — scaffolding anti-devinette

Risque identifié : sur une question d'idée générale/inférence/référence, un joueur qui échoue peut
simplement cliquer les options restantes une par une jusqu'à tomber juste, sans jamais avoir vraiment
compris le texte — contrairement à une question factuelle simple, où retenter la même question a un
vrai effet pédagogique (relire pour retrouver l'info).

**Mécanique adoptée (révisée 2026-07-07, audit 05, finding 05-C2 — le texte étant désormais
consultable à tout moment pendant le quiz, § Modèle, le scaffolding devient un *ciblage*, pas un
accès)** : après un **2ᵉ échec**,
- **question inférence ou résolution de référence** : le jeu ouvre le texte **déjà scrollé et
  surligné** sur le passage-réponse avant d'autoriser une 3ᵉ tentative. L'ancrage est porté par un
  champ **`answer_span`** (intervalle de caractères dans `jp_text`) sur chaque question de
  `questions[]` — obligatoire pour ces deux types, généré avec le quiz à l'étape 12ter et relu à la
  passe humaine ;
- **question idée générale/résumé** : pas de passage unique à surligner (la réponse, c'est tout le
  texte) — le jeu ouvre simplement le texte au début, relecture libre, avant la 3ᵉ tentative ;
  `answer_span` absent ;
- **question factuelle** : aucun scaffolding automatique — la consultation libre suffit, l'info est
  explicite dans le texte ; `answer_span` absent.
Force une relecture ciblée plutôt qu'une élimination d'options à l'aveugle.

**Pas de réduction du nombre d'options après un échec (tranché 2026-07-02)** : une option envisagée
était de retirer l'option choisie à tort de la liste après chaque échec (4→3→2), pour empêcher un joueur
déterminé de passer un texte obligatoire par pure élimination sans avoir compris. **Écartée** — la
longueur croît avec le niveau (3 questions en N5, jusqu'à 5 en N1) et les questions elles-mêmes se
diversifient avec la courbe ci-dessus : plus un texte est long/avancé, plus il faut enchaîner de bonnes
réponses sur des types de questions variés (idée générale, inférence, référence), ce qui rend l'évitement
par pure élimination de moins en moins praticable naturellement, sans mécanique supplémentaire à
maintenir.

---

## Tagging grammaire — scope limité aux textes obligatoires (2026-07-02)

`grammar_encounters` (`PRD.md` § Système de Combat) se nourrit de "dialogue NPC, leçon ou texte" — mais
taguer automatiquement ~85-115 articles externes (NHK/Watanoc/Matcha) contre les 828 points Hanabira
serait fragile et coûteux pour un gain marginal. **Scope réduit** : seuls les **~28-29 textes
obligatoires** *(« ~20-21 » corrigé 2026-07-06, repasse progression P-2 — textes de remise CS-Kanji
inclus)* (écrits/sélectionnés à la main, faible volume) sont tagués avec leur(s) point(s) Hanabira
au moment de l'écriture — même geste que le `grammar_note` d'une leçon, coût quasi nul. Les textes
secondaires sourcés en externe **n'alimentent pas** `grammar_encounters` : ils comptent pour la lecture et
le vocabulaire, pas pour le pool Grammaire/Conjugaison en combat, qui reste déjà alimenté par NPC/leçon/
textes obligatoires.

---

## Sources — vivantes, pas figées dans le passé

L'ancienne liste de sources (Aozora Bunko en particulier, utilisé comme unique repère "haut niveau")
sur-représentait la littérature Meiji/Taishō — domaine public au Japon signifie presque toujours
"antérieur à 1955" (règle des 70 ans post-mortem), donc un registre syntaxique et lexical assez éloigné
du japonais contemporain que le reste du jeu enseigne (Tatoeba/JESC modernes, grammaire Hanabira
actuelle). Objectif de cette refonte : du contenu **vivant**, pas seulement "libre de droits".

| Palier | Sources recommandées (réelles, vérifiées en recherche 2026-07-02) | Registre |
|---|---|---|
| N5 | Tadoku niveau 0–1 (contes illustrés, hiragana-only, audio inclus) | Vivant, illustré |
| N4 | **Watanoc** (magazine web gratuit, ~200 articles calibrés N5/N4 dédiés, audio natif + dictionnaire pop-up), Tadoku niveau 1–2 | Vivant, vie quotidienne/actualité simple |
| N3 | **NHK Web Easy** (actualité réelle, renouvelée en continu, audio + furigana), Watanoc (articles N3), **Matcha Easy Japanese** (magazine voyage/culture, furigana systématique) | Vivant, contemporain |
| N2 | NHK Web Easy (registre le plus dense du site), Matcha (version standard non simplifiée), articles d'actualité réels sélectionnés à la main | Contemporain, plus dense |
| N1 | Éditoriaux/articles d'opinion réels, extraits de light novels/manga modernes | Authentique, dense, actuel |
| Cas spécial narratif | **Aozora Bunko** — conservé, mais réservé aux moments où l'archaïsme *sert la fiction* (parchemins des Ruines Arcaniques, inscriptions de l'Antre du Dragon) — jamais présenté comme repère du "japonais courant" de fin de jeu | Volontairement daté, assumé comme tel |

**Obtention — sélection manuelle assumée (tranché 2026-07-07, audit 05, findings 05-B1/05-B2)** —
l'audit a constaté que le cœur N4-N2 « vivant » promis n'avait **aucune donnée exploitable en local** :
le stock nhkore (`scripts/sources/nhkore/core/`, 3 555 articles 2020→2025) ne contient **que titres,
URL et fréquences de mots — aucun corps d'article**, et NHK dépublie les anciens articles (URL 2020
testée : 404) ; Watanoc et Matcha n'ont ni fichier local ni mécanisme d'obtention (Watanoc vérifié
vivant en ligne, 2026-07-07). Décision : **pas d'import automatisé** — les ~100-130 textes du jeu
seront choisis **un par un à la passe de contenu** : articles *récents* de NHK Web Easy (re-scrape
nhkore au fil de l'eau — le stock existant est déclassé en simple index de titres/vocabulaire), copie
manuelle article par article depuis Watanoc/Matcha, recueils PDF déjà cartographiés
(`content/japanese-books-mapping.md`, ~30 histoires), Aozora local (16 951 œuvres, cas archaïque).
Les étapes 10-11 du pipeline (`PRD.md`) se lisent désormais « sélection manuelle + vetting 12bis »,
pas « parseur ». Cohérent avec la volumétrie (une centaine de slots sur tout le jeu) et avec la
décision déjà actée de choisir les textes à la fin, texte par texte.

**Audio — optionnel par texte (tranché 2026-07-07, audit 05, finding 05-C3)** : l'audio des sources
(NHK, Watanoc, Tadoku) n'est plus une promesse implicite — champ **`audio_ref` nullable** sur la table
`texts`, bouton lecture dans la fenêtre de lecture **uniquement si renseigné**. En sélection manuelle,
récupérer le fichier audio avec l'article ne coûte presque rien ; les textes maison/PDF restent sans
audio, sans bouton. Aucune obligation de couverture, pas de TTS.

**Retrait du contenu Pokémon officiel comme source N1 (2026-07-02)** : envisagé un temps (thématiquement
séduisant), écarté sur deux points — pédagogiquement, les entrées Pokédex/dialogues de jeu font 1-3
phrases très formatées, largement insuffisant pour atteindre 900-1200 caractères de prose N1 sans coudre/
inventer, ce qui dilue l'authenticité recherchée ; légalement, le texte localisé officiel de Nintendo/
Game Freak est une cible d'application des droits nettement plus active que des sources comme NHK, même
sous l'angle "app privée" déjà tranché pour le reste des sources — mieux vaut rester prudent
spécifiquement ici plutôt que de rouvrir ce risque.

**Sélection des textes précis** : reportée à une passe de contenu dédiée, une fois ce squelette (nombre,
placement, calibrage) validé — cohérent avec la remarque "il faut sûrement les choisir à la fin une fois
qu'on aura déterminé combien ils sont et quand ils sont dans l'aventure".

---

## CS-Kanji — la lecture donne le pouvoir, pas la maîtrise (2026-07-02)

**Changement de principe** : l'ancien modèle liait chaque CS-Kanji (飛/水/力) à la maîtrise FSRS d'un
kanji ("maîtriser le kanji te donne un pouvoir"). Ce principe est abandonné — remplacé par : **avoir
beaucoup lu te donne un pouvoir**. Chaque CS-Kanji est remis par le **même PNJ, au même moment narratif
que le CS/HM équivalent dans le jeu d'origine** (sourcé `content/guidebook-adapted.md`) — mais la remise
passe par un texte obligatoire, et ce texte n'a d'effet que si le joueur a atteint le **seuil de textes
lus** de ce CS. *(Révisé 2026-07-06, repasse progression — l'intermédiaire « avoir TOUT lu » (condition
`all_texts_read`, audit 02) a été jugé trop exigeant au grill : une exigence complétionniste répétée 8
fois, qui transformait chaque texte secondaire en obligation. Voir Condition d'activation ci-dessous.)*

**Table sourcée guidebook** (voir `PRD.md` § La Carte de Johto pour la table CS-Kanji résumée) :

| CS-Kanji | Donneur original (guidebook) | Moment narratif |
|---|---|---|
| 飛 (Vol) | La femme de Chuck | Après la victoire sur Chuck (Irisia) |
| 水 (Surf) | Le Gentleman du Théâtre | Après le sauvetage de Miki, Kimono Girl #3 (Rosalia) |
| 力 (Force) | Le Hiker anonyme | Route 42, après Mont Mortier |
| 切 (Coupe) | Le Maître du Charbon (Charcoal Man) *(corrigé 2026-07-06, audit 04, finding 04-E2 : « Kurt (Maître du Charbon) » fusionnait deux PNJ distincts d'Ecorcia — correction déjà actée au PRD le 2026-07-03)* | Après la quête Farfetch'd de Forêt Secte (Ecorcia) — séquence déjà documentée : un apprenti enseigne la technique, le joueur **guide** les 2 Farfetch'd fuyards à travers la forêt (puzzle spatial adapté, aucune capture — « capture » corrigé 2026-07-06, repasse progression, aligné sur la réintégration U8 de la session 4), retourne voir le Maître du Charbon, reçoit l'objet de coupe |
| 砕 (Éclate-Roc) *(ligne ajoutée 2026-07-06, audit 04, finding 04-E2 — manquait depuis l'ajout du 7ᵉ CS le 2026-07-03)* | Un garçon, Route 36 (guide p. 80) | Avant même le Simularbre, dès le badge de Falkner — comme en jeu |
| 滝 (Cascade) | Aucun PNJ dans le jeu d'origine | `event_cleared` sur le puzzle de glissades coordonnées du Chemin Glacé — l'objet y est caché, pas remis en main propre. Le "texte obligatoire" est donc trouvé (objet, `found_object_ref`), pas reçu d'un PNJ — le modèle tolère les deux, § Déclenchement le prévoit déjà (talk pour un PNJ, sight_auto/block pour un passage verrouillé par un puzzle/objet) |
| 渦 (Tourbillon) | Lance | Au QG Rocket (Repaire de Mékanos, Acajou), juste après la double victoire Ariana+Lance |
| 登 (Escalade) *(réintégré 2026-07-06, chasse aux reliques audit 04 — HM08 Rock Climb, ex-« hors scope v1 »)* | Le Prof Chen/Oak | Bourg-Origine, après les 16 badges — dernier CS du jeu, ouvre les parois du Mont Gris |

Les **8** CS-Kanji couvrent l'intégralité des CS/HM de traversée du jeu d'origine (Cut, Fly, Surf,
Strength, Rock Smash, Waterfall, Whirlpool, Rock Climb) *(compte corrigé 2026-07-06, audit 04 : « 6 »
et la table sans 砕 dataient d'avant l'ajout de Rock Smash le 2026-07-03 — finding 04-E2 ; puis 登/Rock
Climb réintégré à la chasse aux reliques, même jour)*.

**Condition d'activation** : `Condition` composite —
1. Le joueur a atteint le moment narratif (`npc_cleared`/`event_cleared`, ex. `chuck_defeated` ou
   `ice_path_puzzle_solved` pour 滝) — inchangé par rapport au jeu d'origine, c'est ce qui justifie que ce
   PNJ/événement précis soit celui qui remet ou révèle le texte.
2. **`count(texts_read, N)` — N textes lus au total** (obligatoires et secondaires confondus, quiz
   réussi = ligne dans `text_completions`), **seuil N propre à chaque CS-Kanji**, croissant avec l'ordre
   d'obtention, calibré à **~50-60 % du corpus de référence** de ce CS — valeurs initiales posées au bloc « Seuils N » ci-dessous (2026-07-07, synthèse ; base définie
   au § Placement anti-famine ci-dessous — précisée 2026-07-07, audit 05, finding 05-D2). *(Révisé 2026-07-06, repasse progression — remplace `Condition.all_texts_read` (audit 02,
   02-C2), jugé trop exigeant au grill. Bénéfice de modèle en prime : `count` sur `texts_read` est
   **monotone** (un texte lu le reste, le compte ne descend jamais) — la seule condition à périmètre
   dynamique du modèle disparaît, l'invariant de monotonie redevient sans exception. Le type
   `all_texts_read` est retiré du modèle ; `PRD.md` § Implémentation et `CONTEXT.md` mis à jour.)*

**Seuils N — calibration initiale (2026-07-07, synthèse — solde le « calibré à la synthèse » ci-dessus ;
proposition à re-vérifier quand les textes seront réellement placés, méthode 05-D2 inchangée)** : dans
l'ordre d'obtention — **砕 6 · 切 12 · 水 20 · 飛 26 · 力 29 · 渦 32 · 滝 35 · 登 60**. Base de calcul :
corpus de référence estimé à chaque jalon depuis les 83 zones de la table de calibration (densités du
§ ci-dessus : ~2 textes/zone critique en moyenne, obligatoires compris), N ≈ 50-55 % du corpus estimé,
monotone croissant. Exemple : à la remise de 水 (Rosalia, post-Morty), ~23 zones critiques traversées
→ corpus ≈ 38 → N = 20. La passe contenu re-calcule chaque N avec les comptes réels au moment du
placement — la contrainte dure reste **N ≤ 60 % du corpus de référence**.

Si la condition 1 est vraie mais pas la 2, le PNJ délivre une ligne de blocage (même mécanique
`sight_auto`/`block` que le blocage d'ordre des leçons) plutôt que le texte — avec **le compte
manquant affiché** (« il te reste 4 textes à lire ») ; le menu ci-dessous dit où chercher, jamais
une frustration "je ne sais pas ce qu'il me manque".

**Placement anti-famine (révisé 2026-07-06, repasse progression — remplace l'« invariant
anti-deadlock » de l'audit 02) :** avec un seuil N < corpus total, un texte individuellement
inatteignable ne bloque plus le jeu — le deadlock strict disparaît. La règle devient une **contrainte
de calibration**, avec une base de calcul définie (**corpus de référence** d'un CS, tranché
2026-07-07, audit 05, finding 05-D2) : **tous les textes — obligatoires et secondaires — des zones
traversées par le chemin critique guidebook jusqu'au jalon narratif de la remise, intérieurs compris,
en excluant** (a) les textes derrière un obstacle CS (`map_obstacles`), (b) les textes derrière un
`time_window` ou une étape de quête non garantie à ce stade du chemin critique. Base délibérément
conservatrice : tout joueur arrivé au jalon a *au moins* ce corpus à disposition — aucun chemin ne
peut famine. Contrainte : pour chaque CS, **N ≤ 60 % de son corpus de référence** (viser 50-60, jamais
dépasser 60 — l'ancienne coexistence « cible ~50-60 % » / « borne ~60 % » est unifiée ainsi). La
vérification à la production reste la même (croiser `npc_ref`/`found_object_ref` avec `map_obstacles`
et l'ordre des CS) — elle alimente le calcul du corpus de référence plutôt qu'une interdiction de
placement par texte. Vivier : `content/side-content-inventory.md`.

**Pourquoi ce modèle plutôt que les anciens** : la maîtrise FSRS d'un seul kanji est un événement
ponctuel et individuel (peut arriver n'importe quand, sans lien avec ce que le joueur a réellement
parcouru) ; « avoir beaucoup lu » est un vrai jalon de parcours, cohérent avec le rôle des textes
secondaires ("remplacent les side quests classiques", § Modèle) — les CS-Kanji restent des capacités
de traversée réellement nécessaires, donc la lecture reste réellement motivée ; mais le joueur
**choisit lesquels** de ses textes lire (~la moitié), au lieu d'une collecte complétionniste imposée
8 fois. Les textes délaissés restent visibles (menu ci-dessous) et récompensés (récompenses du
catalogue ; doré chasseable en plus, finding 08-D8) — optionnels au vrai sens du mot.

**Contenus de lecture des boucles répétables — hors `texts` (ajouté 2026-07-06, repasse progression,
finding P-15) :** les lectures produites par les boucles adaptées et mini-jeux — prises de la Safari
Zone, feuilleton de la pension, prix du Game Corner/de la Loterie, concours du Parc — ne sont **jamais
des lignes de la table `texts`** : elles vivent dans une **collection du Sac** (même famille que les
Boules de Kurt — `grant_item` de collection), n'incrémentent pas `texts_read`, n'apparaissent pas dans
le Journal de lecture gaté. Sans cette règle, un contenu renouvelable entrerait dans le compte des
seuils CS (grind optimal) et, du temps d'`all_texts_read`, aurait rendu la condition insatisfiable.
Les seuils N ne comptent que le corpus éditorial fixe placé zone par zone.

---

## Menu "tous les textes" — découverte et indices (2026-07-02)

Nécessaire pour que la condition CS-Kanji ci-dessus soit **juste** (le joueur doit toujours savoir ce
qu'il lui manque, jamais deviner) : le Journal de lecture (Sac → Textes) liste **tous les textes dont la
zone est déjà débloquée** (`zone_id ∈ unlocked_zones[]`), pas seulement ceux déjà lus.

- **Texte déjà lu** : affichage normal, statut lu (blanc) ou doré — **doré = une passe de quiz sans
  faute, obtenable à tout moment en relisant (quiz remélangé)** *(redéfini 2026-07-07, audit 08, finding
  08-D8, tranché au grill — l'ancien « quiz réussi avec récompense » était indécidable sous
  retry-jusqu'à-correct : tout texte fini a son quiz réussi. Même sémantique que les tuiles du Kanjidex
  (blanc = fait, doré = maîtrisé), généralise le mécanisme relecture + quiz remélangé déjà acté pour le
  texte de Red ; stocké dans `text_completions.gold_at`, le `score` première-tentative de 05-A1 reste
  purement statistique)*.
- **Texte pas encore lu, zone débloquée** : entrée **grisée** dans la liste (titre masqué ou "???"). Tap
  dessus → fenêtre d'indice légère (même famille visuelle que le popup de mot des leçons/textes, § UI/UX
  du PRD) révélant **qui/quoi porte ce texte** (`npc_ref` ou `found_object_ref`, nouveau champ sur la
  table `texts` — voir `PRD.md` § Implémentation) : nom du PNJ et zone, ou description de l'objet trouvé
  et zone. Pas de position exacte sur la tuile (garde un peu de recherche), juste de quoi savoir où
  chercher.
- **Texte dont la zone n'est pas encore débloquée** : absent de la liste — pas de spoil de contenu à venir.

Aucune nouvelle table : ce menu est une lecture combinée de `texts` (filtré par `zone_id ∈
unlocked_zones[]`) et `text_completions` (pour distinguer lu/pas lu), déjà toutes deux prévues au schéma.

---

## Furigana — format et production (précisé 2026-07-07, audit 05, finding 05-C1)

Le bouton Y (révéler les lectures) était promis sans qu'aucun champ ni étape ne produise les
furigana des textes. Décisions :
- **Format** : la même convention inline que les dialogues — `漢字（かんじ）` dans `jp_text`
  (constatée dans `content/dialogues/`, ex. `mom_new_bark.json`) — un seul format de lectures dans
  tout le jeu, un seul renderer (masqué par défaut, révélé par Y).
- **Production** : étape pipeline explicite — pré-annotation **kuromoji** (déjà utilisé pour
  `sentences`, étape 4) sur chaque texte retenu, puis **relecture humaine** des lectures (kuromoji se
  trompe sur les noms propres et lectures contextuelles) au moment de la passe 12bis/12ter. Pour les
  articles NHK Web Easy sélectionnés, les furigana natifs de la source servent de référence de
  relecture.

---

## Flux de lecture (inchangé dans sa forme, mis à jour dans le contenu)

Trouver le texte sur la carte (PNJ qui le remet, ou objet trouvé : parchemin, lettre, panneau,
inscription) → fenêtre de lecture dédiée, furigana masqués par défaut (bouton Y pour révéler) → quiz de
compréhension (3–5 questions, taxonomie ci-dessus, retry avec scaffolding après 2 échecs sur les
questions non factuelles) → `Effect` déclenché (progression réelle si obligatoire, récompense du
catalogue si secondaire) → texte archivé dans le Journal de lecture (バッグ → どくしょノート), avec son
statut (lu / doré — doré = passe sans faute, rejouable en relecture, finding 08-D8).
