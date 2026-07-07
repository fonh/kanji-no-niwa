# Findings — Audit 05 : Textes progressifs et condition de lecture

Date : 2026-07-07. Phase 1 (lecture seule) terminée — ce rapport. Phases 2-3 : voir « Décisions
et corrections » en fin de document (rempli après grill).

Docs audités : `content/texts-progressifs.md`, `PRD.md` (§ Textes Progressifs L359-411, § CS-Kanji
L133-160/394-402, § Sac L69, table `texts` L821, pipeline L879-894, ligne 847),
`content/curriculum-checkpoints.md`, `content/japanese-books-mapping.md`,
`content/side-content-inventory.md`, `CONTEXT.md`, sources réelles de `scripts/sources/`.

## Note de contexte — le prompt de cet audit est en partie périmé

Le prompt (`prompt-05-textes.md`) cite la condition CS-Kanji « tous les textes des zones débloquées
sont lus » : c'est l'ancien modèle `all_texts_read` (audit 02), **remplacé le 2026-07-06** (repasse
progression) par le seuil `count(texts_read, N)`. Vérifié : aucun fossile d'`all_texts_read` ne
subsiste dans PRD/CONTEXT/texts-progressifs (seules des mentions historiques de retrait). Les
questions « découverts vs existants » et « dead-end PNJ conditionnel » du prompt sont largement
dissoutes par le seuil (un texte individuellement inatteignable ne bloque plus rien) — il reste la
calibration de N, voir 05-D2. De même, la question licence est **déjà tranchée** (2026-07-02, app
privée jamais publiée — `texts-progressifs.md` L10-13) : non-finding, pas rouvert.

## Comptes réels (sources présentes dans `scripts/sources/`)

| Source promise | Présence locale | Exploitable pour la table `texts` ? |
|---|---|---|
| NHK Web Easy (via nhkore) | `nhkore/core/` : **3 555 articles** scrapés (2020→2025-04) | **Non en l'état** : le YAML ne stocke que titre + URL + fréquences de mots — **aucun corps d'article**. URL 2020 testée : 301 → **404** (NHK dépublie les vieux articles). Voir 05-B1 |
| Watanoc | **Absent** (0 fichier) | Site vérifié **vivant** (recherche web 2026-07-07, dernière màj 2026-01) — mais aucun mécanisme d'obtention documenté. Voir 05-B2 |
| Matcha Easy Japanese | **Absent** | Idem 05-B2 |
| Tadoku graded readers | **Absents** en tant que tels | Les 4 recueils PDF de `japanse books/stories/` (≈30 histoires N5→N2, dont 2 vol. gradués Tadoku) en tiennent lieu partiellement — déjà cartographié par `japanese-books-mapping.md` (manquement 4) |
| Aozora Bunko | ✅ `aozorabunko-clean.jsonl.gz` : **16 951 œuvres** (texte complet) | Oui — mais réservé « cas spécial archaïque » (§ Sources) |
| Sources N1 (« éditoriaux réels, light novels, manga modernes ») | **Rien** | Aucune donnée, aucun mécanisme — déjà le manquement n°1 de `japanese-books-mapping.md` (≈60 % du budget kanji). Voir 05-B3 |

Textes promis : **~28-29 obligatoires** (écrits main — pas de dépendance source) + **~70-100
secondaires** sur ~72 zones. Vivier réellement exploitable aujourd'hui pour les secondaires :
~30 histoires (recueils) + 15 « textes tout trouvés » (`side-content-inventory.md` § A) + Aozora
(archaïque seulement). Le cœur N4-N2 « vivant » (Watanoc/NHK/Matcha) n'a **aucune donnée utilisable**.

---

## A — Contradictions

### 05-A1 (majeur) — « score ≥ 80 % » du texte Red vs régime universel retry-jusqu'à-correct
`texts-progressifs.md` L30-34 : « Tout texte, sans exception » se termine par un quiz
**retry-jusqu'à-correct** (on recommence la question jusqu'à la bonne réponse). Sous ce régime,
tout joueur finit mécaniquement à 100 % — un « score » final n'existe pas. Or :
- `PRD.md` L605 : « chapitre de manga lu avant le combat (**score ≥ 80 %** en compréhension requis
  pour débloquer le combat) » ;
- `texts-progressifs.md` L48 le répète (« score ≥ 80 % requis ») tout en comptant Red parmi les
  textes du régime unique.
Par ricochet : le champ `text_completions.score` (`PRD.md` L832) n'a **aucune définition** sous
retry-jusqu'à-correct (score à la 1ʳᵉ tentative ? nombre d'essais ? toujours 100 ?).

### 05-A2 (moyen) — deux définitions incompatibles du statut Blanc/Doré
`texts-progressifs.md` L63 : « Blanc = lu, Doré = quiz réussi » (logique Kanjidex). Mais le quiz
étant obligatoire et retry-jusqu'à-correct, **« lu » implique « quiz réussi »** — cette distinction
est vide. La sémantique réelle, posée ailleurs (`texts-progressifs.md` L61-64 même paragraphe,
`PRD.md` L384-385) : Doré = l'`Effect.unlock_text` a marqué le texte (récompense), Blanc = lu sans
statut doré (textes obligatoires, secondaires récompensés par `grant_item` seul). Les deux
formulations coexistent dans le même paragraphe. À reformuler ; pose aussi la question : un
secondaire à `grant_item` reste-t-il blanc à jamais (voulu ?).

### 05-A3 (moyen) — « textes officiels Pokémon » encore cités comme relais N1
`japanese-books-mapping.md` L75 (2026-07-05) : Kanto 1670+ → « relais textes par NHK, Matcha,
Aozora brut, **textes officiels Pokémon** ». Or le contenu Pokémon officiel a été **retiré des
sources N1** le 2026-07-02 (`texts-progressifs.md` L287-293, retrait réaffirmé `PRD.md` L407-408,
passe de vérification 2026-07-07). Fossile de rédaction postérieur au retrait.

## B — Promesses sans données

### 05-B1 (majeur) — NHK Web Easy : 3 555 entrées, zéro texte
Le pipeline (`PRD.md` L891, étape 11) promet « NHK Web Easy → table texts » et
`texts-progressifs.md` L282-283 en fait la source centrale N3/N2. Réalité de `scripts/sources/
nhkore/core/` : `nhk_news_web_easy.yml` (52 Mo) contient datetime/titre/URL/sha256 + listes de
fréquences de mots — **pas le corps des articles**. Re-scraper est compromis pour l'essentiel du
stock : NHK dépublie (URL de 2020 vérifiée : 301 puis 404 sur news.web.nhk) ; seuls les articles
récents restent en ligne. Options à trancher au grill : scrape récurrent des articles récents
(nhkore le fait) + curation au fil de l'eau, archive tierce (ex. nhkeasier.com), ou bascule du
créneau N3/N2 vers rédaction/adaptation maison vettée.

### 05-B2 (moyen) — Watanoc et Matcha : promis, absents, sans mécanisme d'obtention
Aucun fichier local, aucun scraper, aucune étape pipeline dédiée (l'étape 10-11 dit « → table
texts » sans dire comment). Watanoc vérifié vivant (2026-07-07) — la promesse d'existence tient,
l'obtention reste non spécifiée (scrape ? copie manuelle article par article lors de la passe de
contenu ?). Même statut pour Matcha. À spécifier ou à déclasser en « vivier optionnel de la passe
de contenu ».

### 05-B3 (rappel — déjà tracké ailleurs) — N1 : aucune donnée, aucun mécanisme
« Éditoriaux/articles d'opinion réels, extraits de light novels/manga modernes »
(`texts-progressifs.md` L284) : rien en local, pas de source nommée, pas de procédé d'obtention —
et c'est le segment le plus long du jeu (900→2136). Déjà documenté comme manquement n°1 de
`japanese-books-mapping.md` (liste d'acquisition Shin Kanzen Master en tête) — référencé ici pour
que la synthèse le voie depuis l'angle « textes », pas dupliqué.

## C — Promesses sans mécanisme

### 05-C1 (majeur) — furigana des textes : promis partout, stockés nulle part
Le flux de lecture promet « furigana masqués par défaut (bouton Y) » (`texts-progressifs.md`
L400-401) et `curriculum-checkpoints.md` L549 affirme « fournis systématiquement **en base** ».
Mais la table `texts` (`PRD.md` L821) n'a que `jp_text` — aucun champ lectures ; aucune étape du
pipeline ne génère les furigana des textes (kuromoji, étape 4, ne tourne que sur `sentences`).
Les dialogues utilisent une convention inline `漢字（かんじ）` (constatée dans
`content/dialogues/npcs/new-bark-town/mom_new_bark.json`) — rien ne dit si `jp_text` suit cette
convention, un format ruby, ou un champ séparé. Pour des articles réels de 300-1200 caractères,
la génération (kuromoji + relecture) doit être une étape pipeline explicite.

### 05-C2 (moyen) — scaffolding « surligner le passage-réponse » : ancrage inexistant
`texts-progressifs.md` L239-243 : après 2 échecs sur une question non factuelle, « le jeu surligne
automatiquement le passage du texte contenant la réponse ». (a) Aucun champ de `questions[]`
(`PRD.md` L821) ne relie une question à un intervalle du texte — l'ancrage doit être authoré
(étape 12ter) et stocké ; (b) pour une question **idée générale/résumé** — un des deux types
plancher, donc présent dans chaque quiz — il n'existe pas de « passage contenant la réponse » :
le scaffolding est indéfini précisément sur une partie des questions qu'il cible.

### 05-C3 (mineur) — audio : argument de sélection des sources, absent du produit
Les sources sont choisies notamment pour leur audio (« audio inclus », « audio natif + dictionnaire
pop-up », « audio + furigana » — `texts-progressifs.md` L278-285) mais ni la table `texts` ni la
fenêtre de lecture ne prévoient d'audio. Soit une promesse implicite à honorer (champ + player),
soit une mention à neutraliser pour ne pas laisser croire à une feature.

## D — Ambiguïtés

### 05-D1 (majeur) — règle des « 2 kanji inconnus max » : unité et tolérance indéfinies pour un texte
`texts-progressifs.md` L179-183 applique la règle « à tout le japonais écrit du jeu » y compris aux
articles réels, et le vetting 12bis retient les candidats « **proches** de la règle des 2 inconnus »
— sans borne chiffrée. Or l'unité n'a été tranchée que pour les **dialogues** (« par dialogue
entier », audit 04, finding 04-A2) ; `curriculum-checkpoints.md` L43 liste les surfaces couvertes
(PNJ, panneaux, inscriptions, boss, Pokégear) **sans les textes progressifs**. Pour un texte N1 de
800-1200 caractères, « 2 inconnus par texte entier » est probablement intenable (et « proche » peut
tout dire). À trancher : l'unité (par texte entier ?), et une tolérance explicite — fixe ou par
palier — qui définit ce que le script de vetting accepte/refuse. C'est LE critère « qui valide
qu'un texte est bien N4 » demandé par le prompt : le mécanisme existe (12bis + passe humaine),
son seuil n'est pas défini.

### 05-D2 (moyen) — seuil N des CS-Kanji : base de calcul du « corpus atteignable » à définir
`texts-progressifs.md` L335-338 : N calibré « à ~50-60 % du corpus atteignable sans CS au moment de
la remise » ; L349-355 : contrainte « N ≤ ~60 % ». Pour que la calibration (synthèse) et le script
de vérification soient écrivables, il faut définir la base : ensemble **théorique** des zones
débloquables au jalon narratif de la remise, sans aucun CS (chemin critique guidebook), intérieurs
compris ; sort des textes derrière `time_window`/étapes de quête (comptent-ils dans
l'« atteignable » ?). Et figer un chiffre unique (cible ~50-60 % vs borne ≤60 % — cohérent mais
deux formulations).

### 05-D3 (mineur) — plancher « 1 idée générale (tous paliers) » vs courbe N5/N4 « quasi exclusivement factuel »
`texts-progressifs.md` L215-216 (plancher universel : ≥1 idée générale + ≥1 vocabulaire) vs L226
(N5/N4 : « quasi exclusivement factuel + vocabulaire en contexte »). Sur un quiz N5 de 3 questions,
le plancher impose 2 questions non « factuel pur » — « quasi exclusivement » est intenable. Dire
lequel prime en N5/N4 (probable intention : plancher maintenu, « quasi exclusivement » à adoucir
en « le reste : factuel/vocabulaire, pas d'inférence ni de référence »).

### 05-D4 (mineur) — « textes non découverts » (Dowsing MCHN, I-9) : l'état « découvert » n'existe pas
`guidebook-adapted.md` L623 et `side-content-inventory.md` L146 : détecteur des « objets-textes non
découverts ». Le modèle des textes ne connaît que lu / non lu (`text_completions`) — un texte non
lu de zone débloquée est déjà listé (grisé) au Journal. Lire « non lus » (`found_object_ref` sans
ligne `text_completions`) ; aligner le vocabulaire pour éviter qu'un futur audit y voie un état à
implémenter.

## E — Obsolète

Rien à signaler au-delà de 05-A3 (qui est classé contradiction) : les fossiles `all_texts_read` et
« Kanto compressé » ont été nettoyés par la repasse du 2026-07-06 et la passe de vérification du
2026-07-07 — vérifié par grep sur PRD/CONTEXT/content.

## Reporté à la synthèse

- **Recompte zones × densités** : « ~70-100 secondaires » repose sur « ~72 zones » — la note L103-106
  de texts-progressifs renvoie déjà le recompte (intérieurs multi-étages, réintégrations) à la
  synthèse. Rien à corriger ici.
- **Cosmétiques** : le catalogue de récompenses (skins, palettes, titres — `texts-progressifs.md`
  L70-78) suppose un inventaire/équipement de cosmétiques qu'aucune table ni menu ne porte encore —
  périmètre de l'audit 08 (menus/DB), signalé ici pour croisement.
- **Calibration effective des seuils N** (les 8 valeurs) : explicitement prévue « à la synthèse »
  (`texts-progressifs.md` L337) — dépend du recompte de corpus ci-dessus. L'audit 05 ne fixe que la
  méthode (05-D2).

## Décisions et corrections (Phases 2-3, grill du 2026-07-07)

| Finding | Décision au grill | Corrigé dans |
|---|---|---|
| 05-A1 | `text_completions.score` = **% de questions réussies en première tentative** (défini pour tous les textes, régime retry-jusqu'à-correct conservé partout). Red : combat verrouillé tant que score-première-tentative < 80 %, relecture + quiz remélangé. | `texts-progressifs.md` § Modèle + § Textes obligatoires ; `PRD.md` L605 + table `text_completions` |
| 05-A2 | Sémantique Blanc/Doré reformulée : Blanc = lu (quiz réussi, sans récompense dorée — obligatoires et secondaires à `grant_item` seul, voulu), Doré = `unlock_text` déclenché. | `texts-progressifs.md` § Textes secondaires |
| 05-A3 | « Textes officiels Pokémon » retiré du relais N1 Kanto (fossile post-retrait du 2026-07-02). | `japanese-books-mapping.md` L75 |
| 05-B1/B2 | **Sélection manuelle assumée** : pas d'import automatisé — articles récents NHK (re-scrape nhkore au fil de l'eau, stock 2020-2025 déclassé en index de titres), copie manuelle Watanoc/Matcha, recueils PDF, Aozora local. Pipeline 10-11 = « sélection manuelle + vetting 12bis ». | `texts-progressifs.md` § Sources (nouveau § Obtention) ; `PRD.md` pipeline 10-11 |
| 05-C1 | Furigana : convention inline `漢字（かんじ）` des dialogues, un seul renderer ; production = pré-annotation kuromoji + relecture humaine à 12bis/ter (furigana natifs NHK comme référence). | `texts-progressifs.md` nouveau § Furigana ; `PRD.md` table `texts` + 12ter |
| 05-C2 | **Le texte reste consultable à tout moment pendant le quiz** (règle nouvelle, sortie du grill — comme au JLPT réel). Scaffolding = ciblage : `answer_span` authoré (obligatoire inférence/référence) → ouverture scrollée+surlignée après 2ᵉ échec ; idée générale → ouverture au début ; factuel → rien. | `texts-progressifs.md` § Modèle + § Retry ; `PRD.md` table `texts` (questions[].answer_span) + 12ter + § Textes Progressifs |
| 05-C3 | Audio **optionnel par texte** : `audio_ref` nullable, bouton lecture seulement si renseigné, zéro TTS, zéro obligation de couverture. | `texts-progressifs.md` § Sources ; `PRD.md` table `texts` |
| 05-D1 | Budget kanji des textes **proportionnel** : ~2 inconnus / 100 caractères, plafond 8–10 inconnus distincts par texte, tous paliers (~98 % de couverture, seuil lecture extensive). Règle des dialogues inchangée (2/dialogue entier). Le principe même de la règle a été challengé au grill (« pourquoi pas 0 ? ») et confirmé : c'est un plafond de lisibilité + pré-exposition en contexte, pas un quota. | `texts-progressifs.md` § Vetting ; `curriculum-checkpoints.md` § Les deux règles absolues |
| 05-D2 | **Corpus de référence** d'un CS = textes des zones du chemin critique guidebook jusqu'au jalon de remise, intérieurs compris, hors textes derrière obstacle CS / `time_window` / étape de quête non garantie. **N ≤ 60 %** (viser 50-60). Base conservatrice : aucun chemin ne peut famine. | `texts-progressifs.md` § Condition d'activation + § Placement anti-famine |
| 05-D3 | Plancher maintenu dès N5 (1 idée générale + 1 vocabulaire) ; courbe N5/N4 reformulée : le reste factuel uniquement, **inférence/référence interdites**. | `texts-progressifs.md` § Courbe par palier |
| 05-D4 | « Textes non découverts » (Dowsing) → « textes non lus » (`found_object_ref` sans ligne `text_completions`) — l'état « découvert » n'existe pas. | `guidebook-adapted.md` L623 ; `side-content-inventory.md` F4 |

Reportés à la synthèse : inchangés (recompte zones×densités, cosmétiques → audit 08, calibration
effective des 8 seuils N avec la méthode 05-D2).
