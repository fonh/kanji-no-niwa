# Spécification — 13 nouveaux modes de combat dérivés des livres

Créé 2026-07-17. **Proposition PRD-ready à relire, pas encore intégrée au PRD.** Fait suite au
dépouillement des formats d'exercices des livres (`.scratch/combat-modes-from-books-proposal.md`) et
à la décision utilisateur de rouvrir le design combat. Rédigé au format de la section PRD § Les 9
Modes de Question pour intégration directe après relecture.

Provenance des formats : Shin Kanzen Master N1 文法 / N2 語彙 / N1-N2 読解, Marugoto A2-2 りかい
(pages lues via `render-book-pages.py`). Les 9 modes actuels restent inchangés.

---

## 0. Ce que chaque famille rouvre (invariants gelés)

| Famille | Tire dans | Écrit SRS ? | Contenu par dresseur ? | Rouvre un design gelé ? |
|---|---|---|---|---|
| A — lexical (M10-M16) | `studiedSet` (mots) | non (lecture seule) | non (tirage joueur) | **Non** — additif |
| B — grammaire (M17-M18) | `grammar_encounters` | non | non | **Non** — extension |
| C — lecture (M19-M23) | `reading_snippets` (pool dédié) | non | non (pool partagé) | **Oui** — voir § 5 |

- **A & B** respectent 03-A3 (aucun couplage SRS ; l'état de maîtrise est lu en lecture seule pour la
  graduation, comme les 9 modes) et 07-A1 (aucun theming par PNJ ; on tire dans les items du joueur).
  Ce sont de **nouveaux rendus de question sur les viviers existants** — rien à rouvrir.
- **C** introduit un **pool de passages courts authored** surfacé en combat. C'est le seul vrai
  changement de design (voir § 5 pour la réconciliation proposée et la décision qui te revient).

Aucune incidence sur les longueurs de combat ni le nombre de vies (dérivé du nombre de questions).

---

## 1. Table des modes (extension de PRD § Les 9 Modes de Question)

### Famille A — lexical en contexte (tire dans les MOTS étudiés)

| Mode | Prompt | Réponse | Ce que ça teste |
|---|---|---|---|
| **文脈規定 « Le mot juste »** (M10) | Phrase avec un mot étudié masqué （　） | QCM 4 mots | Usage du mot en situation |
| **Relations « Synonyme / Contraire »** (M11+M12) | Un mot étudié (souligné dans un cadre court), consigne 類義 ou 対義 selon tirage | QCM 4 mots | Relations lexicales |
| **用法 « Bon emploi »** (M13) | Un mot cible affiché | QCM 4 **phrases**, une seule l'emploie bien | Nuance / collocation |
| **語形成 « Dérivation »** (M14) | Base + slot d'affixe (反抗＿ / ＿抗) | QCM 4 affixes (的/化/性/さ/反/無…) | Morphologie dérivée |
| **連語 « Collocation »** (M15) | Nom + particule (恩を＿) *ou* 2 colonnes à relier | QCM 4 verbes *ou* appariement | Collocations figées |
| **仲間はずれ « L'intrus »** (M16) | Phrase-cadre + 3 mots candidats | Désigner le mot qui **ne colle pas** | Collocation / sens fin |

### Famille B — grammaire étendue (tire dans `grammar_encounters`)

| Mode | Prompt | Réponse | Ce que ça teste |
|---|---|---|---|
| **文の組み立て ★ « Assemblage »** (M17) | Phrase à 4 emplacements（＿＿★＿）+ 4 fragments mélangés | 2 premiers tirages : QCM « quel fragment sur ★ » ; puis glisser l'ordre complet | Connexion grammaticale |
| **接続 « Le bon connecteur »** (M18) | Mini-passage (2-4 phrases) avec 1 trou de connecteur | QCM 4 connecteurs (それに対して/つまり/さらに/もしくは) | Logique inter-phrases |

### Famille C — lecture 読解 (tire dans `reading_snippets`, pool dédié)

| Mode | Prompt | Réponse | Ce que ça teste |
|---|---|---|---|
| **指示語 « Le référent »** (M19) | Mini-paragraphe (≤200字), これ/それ souligné | QCM 4 référents | Résolution d'anaphore |
| **下線部 « Le sens caché »** (M20) | Mini-paragraphe, expression soulignée | QCM 4 paraphrases | Sens contextuel/figuré |
| **情報検索 « Chasse à l'info »** (M21) | Mini-document réaliste (horaire/annonce/règlement) + question situationnelle | QCM 4 | Lecture fonctionnelle |
| **主張 « La thèse »** (M22) | Passage court (~200-300字) | QCM 4 (« l'idée principale de l'auteur »), distracteurs = idées vraies mais secondaires | Idée directrice |
| **対決 « Duel A / B »** (M23) | 2 avis courts opposés (cadres A et B) | QCM 4 (« sur quoi s'accordent/diffèrent-ils ») | Lecture intégrée |

---

## 2. Source du tirage & des distracteurs (extension de PRD § Sources des distracteurs)

| Mode | Support / item tiré | Distracteurs |
|---|---|---|
| M10 文脈規定 | phrase du **pool exemples** (lesson_examples cités livre + Tatoeba) contenant un mot étudié, masqué | 3 mots étudiés de même classe (nom/verbe/adj) du pool de combat, filtrés sémantiquement faux |
| M11/12 Relations | mot étudié **ayant** un synonyme/antonyme curé | synonyme/antonyme réel = bonne rép. ; 3 mots étudiés non reliés |
| M13 用法 | mot étudié | 3 phrases de mésusage **générées batch IA + relues** (même régime que défs/mnémo) |
| M14 語形成 | mot dérivé étudié (反抗的…), affixe masqué | 3 autres affixes plausibles |
| M15 連語 | nom/verbe étudié + sa collocation curée | 3 verbes/noms étudiés non-collocables |
| M16 仲間はずれ | phrase-cadre du pool exemples | 2 mots plausibles + 1 mot étudié d'un champ sémantique éloigné (auto-généré) |
| M17 ★ | exemple Hanabira du point rencontré, segmenté en 4 fragments (★ = fragment cible) | les fragments eux-mêmes ; ordre canonique unique vérifié au build |
| M18 接続 | passage à trou-connecteur du pool `reading_snippets` (sous-type connecteur) | connecteurs de relation logique opposée/erronée |
| M19 指示語 | snippet avec référent taggé | 3 syntagmes du passage qui ne sont pas le référent |
| M20 下線部 | snippet + expression taggée | paraphrases proches mais fausses (batch IA relu) |
| M21 情報検索 | mini-doc du pool | 3 réponses contredites par une donnée du doc (date/prix/condition) |
| M22 主張 | passage court | idées vraies mais secondaires (batch IA relu) |
| M23 対決 | paire d'avis A/B | affirmations partiellement vraies / attribuées au mauvais avis |

**Garde anti-ambiguïté** (comme le mode Lecture actuel) : pour M10/M16, exclure tout distracteur qui
serait aussi valide dans la phrase-cadre (vérifié à la construction du tirage).

---

## 3. Graduation anglais→japonais (extension de PRD § Langue du Jeu, mécanismes A/B/C)

Règle générale : l'anglais n'apparaît que comme **support d'acquisition d'un item non maîtrisé**, et
disparaît à la maîtrise (stabilité FSRS ≥ 14 j), comme Sens/Saisie/Disposition/Écoute.

| Mode | Support anglais (item non maîtrisé) | À la maîtrise / par défaut |
|---|---|---|
| M10 文脈規定 | glose EN du mot cible consultable (bouton X) | 100 % JP |
| M11/12 Relations | glose EN du mot souligné | 100 % JP |
| M13 用法 | glose EN du mot cible | 100 % JP |
| M14 語形成 | glose EN du mot dérivé | 100 % JP |
| M15 連語 | glose EN du nom/verbe | 100 % JP |
| M16 仲間はずれ | — (déjà en contexte JP) | 100 % JP d'emblée |
| M17 ★ | glose EN de la phrase (support, comme Grammaire) | JP quand le point est ancien |
| M18 接続 | traduction EN du passage (bouton X, comme dialogues) | consultable à la demande tout du long |
| M19-M23 (lecture) | traduction EN du passage consultable via bouton X (**jamais d'office**, même régime que dialogues/textes) ; QCM toujours en JP | idem — le passage ne « gradue » pas, comme les pages de dialogue (finding 04-C2) |

Cohérence : les passages (M18-M23) suivent le régime **dialogue/texte** (traduction à la demande via
X, jamais affichée d'office), pas le régime **item** (graduation par maîtrise) — car un passage
n'est pas un item SRS. Seuls les modes portant sur un **mot étudié** (M10-M15) graduent par maîtrise.

---

## 4. Données & pipeline à produire (extension de PRD § Pipeline de Données)

| Besoin | Pour | Nature | Coût |
|---|---|---|---|
| Tag du token masquable sur le pool exemples (kuromoji, build) | M10, M16 | dérivé auto (comme les `chunks[]` de Disposition) | faible |
| 1 synonyme + 1 antonyme curés par mot JLPT | M11/12 | **extension du batch 8ter** (défs JP) + JMdict `related`/`antonym` en appoint | moyen |
| Phrases de mésusage (3 par mot testé) | M13 | batch IA relu | **élevé** (réserver 2ᵉ vague/examens) |
| Segmentation d'affixes du lexique (的/化/性/さ/反/無/不/非…) | M14 | dérivé du lexique 7 836 mots | moyen |
| Liste de collocations par nom/verbe | M15 | mining corpus (Tatoeba co-occurrence) ou batch curé | moyen |
| Segmentation 4-fragments + tag ★ des exemples grammaire | M17 | build sur `example_variants[]` Hanabira | moyen |
| **Table `reading_snippets`** (≤200-300字, gradés JLPT, questions[]) | M18-M23 | **contenu authored / adapté des livres (vetting 12bis)** | **élevé** — la vraie brique nouvelle |
| Pool de mini-docs réalistes (horaire/annonce/règlement) | M21 | authored (gabarits fournis par les livres) | moyen-élevé |

**Schéma `reading_snippets`** (lecture seule en combat, aucun suivi de complétion — un combat n'écrit
jamais rien) :
```
reading_snippets(
  id, jlpt_level, subtype,            -- subtype ∈ {referent, paraphrase, info, thesis, duel, connector}
  body_jp, body_en,                   -- passage + traduction (bouton X), kanji budget = règle studiedSet + lecture inline
  doc_layout,                         -- pour info: {plain|notice|schedule|two_column_AB}
  questions[] { prompt_jp, options_jp[4], answer_index, source }
)
```
Pas de table de complétion (contraste avec `radio_shows`/`texts` qui ont une bibliothèque) : en
combat, un snippet est une question jetable, tirée au niveau ≤ palier courant du joueur.

---

## 5. Réconciliation de la famille C avec le design gelé (LA décision à trancher)

Tension : PRD § Système de Combat pose que « tout combat pioche dans les items étudiés » et qu'il n'y
a **aucun contenu authored par dresseur** (07-A1). Les snippets sont du contenu authored surfacé en
combat. Réconciliation proposée, qui préserve les trois invariants :

1. **Pool partagé, gaté par niveau, jamais par dresseur** → préserve 07-A1 (zéro theming) : les
   snippets sont tirés d'un pool commun filtré sur `jlpt_level ≤ palier`, exactement comme les
   phrases Tatoeba de Disposition/Traduction — pas attachés à un PNJ.
2. **Lecture seule, zéro écriture SRS** → préserve 03-A3 : un snippet ne crée ni ne note aucune carte.
3. **Budget kanji = règle studiedSet + lecture inline (ADR-0002)** → un snippet n'affiche pas de kanji
   non étudié sans sa lecture ; même contrainte que dialogues/textes.

**Ce qui reste réellement nouveau et à valider par toi** : le combat peut désormais présenter un
**passage authored** (pas seulement des items dérivés du `studiedSet`). C'est un élargissement
assumé du périmètre du combat. Si tu le refuses, la famille C tombe et on garde A+B (déjà l'essentiel
du gain, sans rien rouvrir).

---

## 6. Profils de poids rééquilibrés (extension de PRD § Profils de poids)

Chaque colonne resomme à 100 %. **Proposition de calibration, à ajuster** (comme la table actuelle).
Les modes coûteux en contenu (M13 用法, M18-M23 lecture) sont surtout en Boss/examens ; la Route
reste dominée par la fluence item-niveau.

| Mode | Route | Boss |
|---|---:|---:|
| Sens | 18 | 8 |
| Lecture | 15 | 8 |
| Saisie | 13 | 7 |
| Composition | 8 | 3 |
| Écoute | 6 | 6 |
| Traduction | 3 | 4 |
| Disposition | 4 | 18 |
| Grammaire | 6 | 10 |
| Conjugaison | 6 | 10 |
| **M10 文脈規定** | 5 | 4 |
| **M11/12 Relations** | 4 | 3 |
| **M13 用法** | 0 | 2 |
| **M14 語形成** | 0 | 2 |
| **M15 連語** | 3 | 2 |
| **M16 仲間はずれ** | 3 | 0 |
| **M17 ★ 組み立て** | 3 | 4 |
| **M18 接続** | 0 | 2 |
| **M19 指示語** | 2 | 2 |
| **M20 下線部** | 0 | 1 |
| **M21 情報検索** | 1 | 2 |
| **M22 主張** | 0 | 1 |
| **M23 対決** | 0 | 1 |
| **Total** | **100** | **100** |

Les modes lecture (C) apparaissent surtout dans les **combats-examens 試練** (師範/Conseil4/Lance/Red),
en sections ordonnées, où leur longueur est absorbée. Sur route, ils restent rares (poids faibles) ou
absents (M20/M22/M23 = 0 route) pour ne pas casser le rythme.

---

## 7. Points ouverts pour ta relecture
1. **Famille C oui/non** (§ 5) — l'élargissement « passage authored en combat » est le seul vrai
   engagement. A+B seuls = gain majeur sans réouverture.
2. **Fusion M11/M12** en un mode « Relations » (synonyme+antonyme selon tirage) ou deux modes séparés ?
3. **M15 連語** en QCM, en appariement 2 colonnes, ou les deux selon le contexte ?
4. **Couverture M11/12** : gater le mode aux mots ayant une relation curée (le batch 8ter doit
   produire syn+ant pour 100 % des mots, sinon le mode est clairsemé — cf. 07-B1, JMdict seul = 20 %).
5. **Longueur max d'un snippet jouable en combat** (proposé ≤200字 route, ≤300字 Boss) — à confirmer.
6. **Où sont produits les snippets** : adaptés des livres (vetting 12bis, tes recueils + Shin Kanzen
   読解) ou pool authored dédié ? (proposé : adaptés des livres — c'est l'objet initial de ta demande.)
