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
  lecture complète (tous les textes des zones débloquées lus), le donneur et le moment narratif restant
  sourcés du jeu d'origine. Voir § CS-Kanji.

---

## Modèle — un seul régime, deux tiers

Tout texte, sans exception, se lit dans la même fenêtre de lecture dédiée plein écran (même famille que
l'écran-livre des leçons, voir `PRD.md` § Leçons — texture de fond variable selon le type de document,
voir § Style visuel ci-dessous) et se termine par un **quiz de compréhension obligatoire, retry-jusqu'à-
correct** (même mécanique que le mini-quiz de leçon — mauvaise réponse → on recommence la question, pas
de correction affichée puis passage forcé). Ce qui distingue les deux tiers, c'est uniquement **ce que
la réussite du quiz débloque** :

### Textes obligatoires (story-gating)

Réussir le quiz est une `Condition` requise pour l'`Effect.advance_quest` / `unlock_zone` / `badge_earned`
suivant — bloque la progression principale, exactement comme un combat de 師範 ou une porte curriculaire.
Réutilise le modèle `Condition`/`Effect` déjà établi (`PRD.md` § Implémentation) : `Condition.event_cleared`
sur l'identifiant du texte, testé par les `state_rules` du PNJ/porte suivant. Aucun nouveau système.

Placement : **un texte obligatoire par badge de gym** (16 : 8 Johto + 8 Kanto — le "1 texte lu" déjà
noté comme gate curriculaire de Falkner dans `PRD.md` § Système 道場 devient donc la règle générale, pas
une exception), plus les jalons narratifs majeurs qui n'ont pas de gym associé : les 3 lieux Team Rocket,
l'Antre du Dragon (le "quiz d'empathie du Maître, 5 questions" déjà prévu pour le 印 de Clair EST cette
mécanique — pas un système à part, juste son application au cas Clair), et le texte final face à Red
(déjà spécifié : chapitre de manga + lettre de Fukuda, score ≥ 80% requis pour débloquer le combat).
Total : **~20-21 textes obligatoires** sur tout le jeu.

### Textes secondaires (side-quest)

Optionnels pour progresser — le joueur peut finir le jeu sans les avoir tous lus. Mais réussir leur quiz
est **requis pour recevoir la récompense** : pas de "passage forcé" ni de correction affichée, comme les
textes obligatoires.

**Deux `Effect` possibles (2026-07-02, réconcilié avec `PRD.md` § Implémentation)** — `unlock_text`
existe déjà dans l'énumération `Effect` : c'est lui qui marque le texte "doré" dans le Journal de lecture
(Sac → Textes, même logique de couleur que les tuiles du Kanjidex : Blanc = lu, Doré = quiz réussi).
`grant_item` reste utilisé quand la récompense est un objet concret. Les deux sont idempotents, aucun
nouveau type `Effect` nécessaire.

**⚠️ Le statut "doré" seul reste un trophée décoratif s'il n'a aucun effet en aval** — contradiction
avec le principe fondateur du système ("pas de trophée décoratif", 2026-07-01). Catalogue de vraies
récompenses (`grant_item` généralisé aux cosmétiques, pas seulement aux objets narratifs) :

| Tier de récompense | Exemples | Fréquence |
|---|---|---|
| **Cosmétique** (`grant_item`, type cosmétique) | Skins d'avatar, palette de l'écran-livre/lecture, teintes de dialogue box, variantes de sprite du buddy Pokémon, titre de profil affiché ("Lecteur assidu de Doublonville") | Le gros du volume — zéro risque d'équilibre, à distribuer généreusement sur les 70-100 textes |
| **Confort contextuel** (`grant_item` ou `Condition` locale) | Un point d'ancrage de voyage rapide propre à ce texte précis (pas un CS-Kanji générique), un indice caché (position d'un dresseur non repéré, astuce mnémotechnique bonus pour un kanji difficile de la zone) | Fréquent, mais toujours local à une zone, jamais un pouvoir global |
| **Lore/narratif** (`unlock_text` + `advance_quest` sur une quête d'arc) | Compléter tous les textes secondaires d'une zone/arc débloque une scène bonus, une lettre rare de Fukuda, un easter egg | Par zone ou arc entier, pas par texte individuel |

Le statut "doré" seul (sans récompense du tableau ci-dessus) reste réservé aux textes qui n'ont
narrativement aucun lien avec un objet/lieu/personnage assez fort pour justifier une des lignes
ci-dessus — un filet, pas le cas par défaut.

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

Sur ~72 zones (« 57 » corrigé 2026-07-06, repasse progression — chiffre d'avant les 14 routes/donjons
Kanto ; les réintégrations du 2026-07-06 et les intérieurs multi-étages feront encore croître ce compte,
recompte à la synthèse), ça donne un ordre de grandeur de **~70-100 textes secondaires** — cible
volontairement large ("plein de textes partout"), à affiner en écrivant zone par zone plutôt qu'à figer ici.

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
Rock Tunnel, Grotte Diglett, Seafoam… — densités de la table ci-dessus) ; recompte global à la synthèse.

**Priorité d'attribution des PNJ (2026-07-02)** — trois usages revendiquent maintenant le même vivier de
PNJ sourcés guidebook par zone (dresseur-combat, PNJ-leçon, PNJ-texte) alors que plusieurs zones sont déjà
documentées comme pauvres en PNJ nommés (`curriculum-checkpoints.md` § PNJ sourcés par zone : route-33
"aucun", route-38/44/45 "pas de nom sourcé", Route 29 "aucun dresseur nommé" — bootstrap Fukuda déjà
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

**Étape de production ajoutée** : avant qu'un article candidat entre dans la table `texts`, un script
compare son vocabulaire kanji au `studiedSet` théorique du palier visé (repère : bornes de
`content/curriculum-checkpoints.md`) et ne retient que les candidats proches de la règle des 2 inconnus.
Deux issues possibles :
- **Accepté tel quel** si l'écart est déjà dans la marge.
- **Édité avant insertion** si l'article est pédagogiquement bon mais dépasse l'écart (remplacer un mot
  rare par un synonyme déjà étudié, ou l'accepter comme un des "2 inconnus" si le mot est central au
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
| N5 / N4 | Quasi exclusivement factuel + vocabulaire en contexte. Inférence/référence rares voire absentes — trop tôt pour ce niveau de charge cognitive en L2. |
| N3 | Plancher standard (1 idée générale + 1 vocabulaire), 1 inférence simple introduite. |
| N2 / N1 | Inférence et résolution de référence dominantes (au moins 2 des 3-5 questions) — ce sont les compétences réellement testées aux paliers hauts du JLPT réel. Le factuel devient optionnel, pas garanti. |

---

## Retry-jusqu'à-correct — scaffolding anti-devinette

Risque identifié : sur une question d'idée générale/inférence/référence, un joueur qui échoue peut
simplement cliquer les options restantes une par une jusqu'à tomber juste, sans jamais avoir vraiment
compris le texte — contrairement à une question factuelle simple, où retenter la même question a un
vrai effet pédagogique (relire pour retrouver l'info).

**Recommandation adoptée** : après un **2ᵉ échec** sur une question qui n'est pas de type "détail
factuel", le jeu surligne automatiquement le passage du texte contenant la réponse (scroll + highlight,
même texte, même fenêtre de lecture) avant d'autoriser une 3ᵉ tentative. Force une relecture ciblée
plutôt qu'une élimination d'options à l'aveugle. Les questions factuelles n'ont pas ce scaffolding — un
2ᵉ échec y reste un simple retry sans aide, l'info étant déjà explicite dans le texte.

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
taguer automatiquement ~70-100 articles externes (NHK/Watanoc/Matcha) contre les 828 points Hanabira
serait fragile et coûteux pour un gain marginal. **Scope réduit** : seuls les **~20-21 textes
obligatoires** (écrits/sélectionnés à la main, faible volume) sont tagués avec leur(s) point(s) Hanabira
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
kanji ("maîtriser le kanji te donne un pouvoir"). Ce principe est abandonné — remplacé par un principe
différent mais tout aussi fort thématiquement : **avoir tout lu jusqu'ici te donne un pouvoir**. Chaque
CS-Kanji est désormais remis par le **même PNJ, au même moment narratif que le CS/HM équivalent dans le
jeu d'origine** (sourcé `content/guidebook-adapted.md`) — mais la remise passe par un texte obligatoire,
et ce texte n'a d'effet que si le joueur a lu tous les textes (obligatoires + secondaires) des zones déjà
débloquées.

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
2. **Tous les textes (`tier` obligatoire et secondaire) dont `zone_id ∈ unlocked_zones[]` sont présents
   dans `text_completions`** — réutilise l'état déjà tracké (`user_map_state.unlocked_zones[]`,
   `text_completions`), aucune nouvelle table nécessaire. *(Corrigé 2026-07-06, audit 02, finding
   02-C2 : cette condition est désormais un vrai type du modèle — `Condition.all_texts_read`, sans
   paramètre, recalculé à chaque évaluation, jamais stocké. Aucun des 6 types d'origine ne savait
   exprimer une comparaison ensembliste à périmètre dynamique.)*

Si la condition 1 est vraie mais pas la 2, le PNJ délivre une ligne de blocage (même mécanique
`sight_auto`/`block` que le blocage d'ordre des leçons) plutôt que le texte — voir § Déclenchement
ci-dessus. Le joueur sait exactement quoi lire pour débloquer la suite grâce au menu ci-dessous, jamais
une frustration "je ne sais pas ce qu'il me manque".

**Invariant de placement anti-deadlock (ajouté 2026-07-06, audit 02) :** un texte doit être
atteignable **sans aucun CS-Kanji** au moment où sa zone se débloque — exception tolérée uniquement
si le CS requis pour l'atteindre est obtenu strictement avant le déblocage de cette zone. Sans cette
règle, un texte placé derrière un obstacle CS (plan d'eau, arbre à couper, rocher) dans une zone
débloquée tôt rendrait `all_texts_read` insatisfiable : impossible de lire le texte sans le CS,
impossible d'obtenir le CS sans avoir tout lu — jeu bloqué définitivement. La règle s'impose à la
passe de placement des textes (les emplacements précis ne sont pas encore choisis, voir § Sources) et
se vérifie mécaniquement à la production : croiser chaque `npc_ref`/`found_object_ref` avec les
`map_obstacles` de sa zone (table ajoutée au schéma par l'audit 02, voir `PRD.md` § Implémentation)
et l'ordre d'obtention des CS-Kanji. Vivier de placement : `content/side-content-inventory.md`.

**Pourquoi ce modèle plutôt que l'ancien** : la maîtrise FSRS d'un seul kanji est un événement ponctuel et
individuel (peut arriver n'importe quand, sans lien avec ce que le joueur a réellement parcouru) ; "avoir
tout lu jusqu'ici" est un vrai jalon de parcours, cohérent avec le rôle que les textes secondaires
doivent jouer ("remplacent les side quests classiques du jeu", § Modèle) — et ça résout directement le
problème initial ("comment influencer le joueur à lire les side-quests ?") : les CS-Kanji sont des
capacités de traversée réellement nécessaires pour avancer sur la carte, pas un bonus cosmétique qu'on
peut ignorer.

---

## Menu "tous les textes" — découverte et indices (2026-07-02)

Nécessaire pour que la condition CS-Kanji ci-dessus soit **juste** (le joueur doit toujours savoir ce
qu'il lui manque, jamais deviner) : le Journal de lecture (Sac → Textes) liste **tous les textes dont la
zone est déjà débloquée** (`zone_id ∈ unlocked_zones[]`), pas seulement ceux déjà lus.

- **Texte déjà lu** : affichage normal, statut lu (blanc) ou doré (quiz réussi avec récompense) — inchangé.
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

## Flux de lecture (inchangé dans sa forme, mis à jour dans le contenu)

Trouver le texte sur la carte (PNJ qui le remet, ou objet trouvé : parchemin, lettre, panneau,
inscription) → fenêtre de lecture dédiée, furigana masqués par défaut (bouton Y pour révéler) → quiz de
compréhension (3–5 questions, taxonomie ci-dessus, retry avec scaffolding après 2 échecs sur les
questions non factuelles) → `Effect` déclenché (progression réelle si obligatoire, objet ou statut
"doré" si secondaire) → texte archivé dans le Journal de lecture (Sac → Textes), avec son statut
(lu / doré).
