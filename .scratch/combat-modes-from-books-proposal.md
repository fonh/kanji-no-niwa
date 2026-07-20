# Nouveaux modes de combat dérivés des livres — proposition (2026-07-17)

Créé à la demande de l'utilisateur (option « rouvrir le design combat » — voir Étape 4 / passe
contenu). But : dépouiller **tous les formats d'exercices** des livres et en dériver de **nouveaux
modes de question de combat**, au-delà des 9 actuels. Basé sur 4 relevés de formats (Shin Kanzen
Master N1 文法, N2 語彙, N1/N2 読解, Marugoto A2-2 りかい) — pages lues via `render-book-pages.py`.

**Statut : proposition à griller/valider. Ne modifie PAS encore le PRD.** Rouvrir un design gelé
(§ Système de Combat, findings 03-A3 / 07-A1) = décision utilisateur + grill, pas exécution.

## Les 9 modes actuels (rappel, PRD § Les 9 Modes de Question)
Sens · Lecture · Saisie · Composition (2 tuiles→composé) · Grammaire (trou) · Conjugaison ·
Traduction (phrase JP→sens EN) · Disposition (remettre 6-8 chunks en ordre) · Écoute.

→ Testent surtout l'**item isolé** (kanji/mot) + un peu la phrase. **Angles morts** révélés par les
livres : le mot **en contexte**, les **relations lexicales** (synonyme/antonyme/collocation), le
**bon emploi**, et toute la **compréhension écrite (読解)**.

## Invariant de compatibilité
- **Famille lexicale (M10–M16)** : pioche dans les **mots déjà étudiés** (`studiedSet`), QCM
  auto-corrigible → **additive, ne rouvre rien**. Même vivier, nouvelle forme de question.
- **Famille grammaire (M17–M18)** : pioche dans `grammar_encounters` (points rencontrés) → extension
  des modes Grammaire/Disposition existants.
- **Famille lecture (M19–M23)** : introduit un **support phrase/passage** non lié à un item unique →
  **c'est ce qui rouvre le design**, et c'est là que les textes des livres deviennent la source.

---

## Famille A — lexical en contexte (ADDITIVE, risque bas)

### M10 · 文脈規定 « Le mot juste » — mot en contexte
- Mécanique : phrase avec un trou, 4 **mots** en option, choisir celui qui convient au sens.
- Ex. : 恋人に振られた友人を（　）。 → なぐさめる / うらやむ / うやまう / あこがれる. Rép. なぐさめる.
- Source data : phrases (lesson_examples + Tatoeba) où on masque le mot cible ; distracteurs = autres
  mots étudiés de même classe (nom/verbe/adj). Auto-corrigible.
- Comble : Sens teste le sens *isolé* ; ici c'est l'usage *en situation*. Gros manque.

### M11 · 類義 « Synonyme » — sens le plus proche
- Mécanique : phrase avec un mot souligné, 4 options, choisir le plus proche en sens.
- Ex. : 大地震を契機として… → きっかけ / チャンス / 予定 / 中心. Rép. きっかけ.
- Source : batch défs japonaises (pipeline 8ter, déjà prévu) + relations JMdict `related`. Même
  filière que les défs du mode Sens-maîtrisé.

### M12 · 対義 « Le contraire » — antonyme
- Mécanique : mot → choisir l'opposé (QCM 4).
- Source : JMdict `antonym` + les symboles `A—B` du N2 語彙 (déjà taggés dans le manuel : 冷やす—温める).
- Note : peut fusionner avec M11 en un seul mode « Relations » (synonyme OU antonyme selon tirage).

### M13 · 用法 « Bon emploi » — quelle phrase emploie bien le mot
- Mécanique : un mot cible, 4 **phrases** complètes, une seule l'emploie correctement.
- Ex. cible 手間 → «手間を惜しんでいては…» ✓ vs 3 leurres.
- Auto-corrigible, mais **fabriquer 3 phrases-leurres plausibles = le vrai coût** (batch IA relu).
- Le plus « haut » du lot (JLPT lui donne plus de points). Candidat combats-examens 試練.

### M14 · 語形成 « Dérivation » — affixe correct
- Mécanique : base + choix d'affixe (的 / 化 / 性 / さ / préfixe 反・無・不…), choisir la bonne.
- Ex. : 反抗（ 的 / 性 / 化 ）な態度 → 的.
- Distinct de Composition (qui assemble 2 kanji en composé). Source : tagging d'affixes (dérivable).

### M15 · 連語 « Collocation » — le verbe/objet qui va ensemble
- Mécanique : nom + particule → choisir le verbe qui collocalise (QCM ou appariement 2 colonnes).
- Ex. : 恩を（ 返す ）; 不平を（ 言う ）; うわさを（ 広める ）.
- Source : corpus/JMdict + batch. Mécanique d'appariement = variété visuelle bienvenue.

### M16 · 仲間はずれ « L'intrus » — le mot qui ne colle pas
- Mécanique : une phrase, 3 mots proposés, entourer celui qui **ne va pas** (sens/collocation).
- Ex. : 母は（ やさしい / きびしい / うれしい ）人です → うれしい (n'est pas un trait durable).
- Auto-corrigible, court, ludique. Source : Marugoto りかい #5.

---

## Famille B — grammaire étendue (extension des modes existants)

### M17 · 文の組み立て ★ « Assemblage » — ordonner 4 fragments, désigner l'étoile
- Mécanique JLPT signature : phrase à 4 emplacements（＿ ＿ ★ ＿）, 4 fragments à ranger ; répondre
  **quel fragment tombe sur ★** (QCM 4), ou valider l'ordre complet.
- Ex. : 明日の｜線路の点検｜に伴う｜発車時刻の｜変更｜はございません → ★ = 発車時刻の.
- Variante plus fine que Disposition (teste la connexion grammaticale, pas juste l'ordre linéaire).
- Source : points de `grammar_encounters` + exemples Hanabira.

### M18 · 接続 « Le bon connecteur » — cloze de cohésion dans un mini-passage
- Mécanique : court passage (2-4 phrases) avec 1-2 trous de **connecteur** (それに対して / つまり /
  さらに / もしくは), QCM 4 selon la logique globale.
- Ex. : contexte de contraste → それに対して (vs それにもまして / それに反して / それ以上に).
- Comble : la logique inter-phrases (接続) n'est testée nulle part. Frontière avec la famille lecture.

---

## Famille C — lecture 読解 (ROUVRE LE DESIGN ; les textes des livres = la source directe)

Les micro-drills 読解 (1 texte ≤ 1 paragraphe, 1 question, QCM 4) sont **jouables en combat court**.
Les formats longs (中文 500字, 長文 1000字) sont réservés aux combats-examens/donjons ou à condenser.

### M19 · 指示語 « Le référent » — à quoi renvoie これ/それ
- Mécanique : mini-paragraphe (2-4 phrases), un これ/それ souligné, 4 cibles possibles.
- Le plus pur des formats lecture. Existe déjà comme *type de question de texte*
  (`resolution_reference`) — ici promu en micro-mode de combat.

### M20 · 下線部 « Le sens caché » — paraphraser une expression
- Mécanique : mini-paragraphe, une expression imagée soulignée, choisir sa reformulation.
- Ex. : 「ノル」とはどういうことか → 4 paraphrases.

### M21 · 情報検索 « Chasse à l'info » — mini-document réaliste + question situationnelle
- Mécanique : petite annonce / horaire / règlement (~1 encadré), question du type « on est le 5 juin,
  comment réserver la salle pour le 7/12 ? », QCM 4. Croiser dates/conditions.
- Très « vie réelle », excellent en saveur. Source : mini-docs adaptés (les livres en fournissent).

### M22 · 主張 « La thèse » — que veut vraiment dire l'auteur
- Mécanique : passage court + « l'idée principale de l'auteur ? », distracteurs = idées vraies mais
  secondaires. La *question* est courte, le *support* doit être raccourci (~200-300字) pour le combat.

### M23 · 対決 « Duel A / B » — deux avis, où s'accordent/diffèrent-ils
- Mécanique : 2 avis courts opposés sur un thème (encadrés A et B), question « sur quoi sont-ils
  d'accord / en désaccord ? », QCM 4.
- **Thématiquement parfait pour un combat de dresseur** (deux points de vue qui s'affrontent).
  Source : 統合理解 Shin Kanzen, condensé.

---

## Écartés (avec raison)
- **Meilleure réponse pragmatique** (Marugoto #20 / « quel conseil est adapté ») → **déjà couvert**
  par le 即時応答 des appels téléphoniques (PRD § Pokégear). Ne pas dupliquer en combat.
- **Auto-notation de confiance ★☆☆** (Marugoto #17) → conflit avec FSRS-auto + règle « jamais de
  moyenne de performance » (08-D7). Le juge reste le SRS.
- **Spot-the-difference / appariement personnage-dans-scène** (Marugoto #6/#9) → coût d'assets
  (illustrations de scènes) + production orale non auto-corrigible. Défer.
- **Dictée pure** (Marugoto #2) → proche de l'inverse d'Écoute ; « du kana à l'oreille = dictée »,
  déjà tranché contre (audit 07).

## Ranking recommandé
1. **Adopter la famille lexicale** M10 文脈規定, M11/M12 Relations (synonyme+antonyme fusionnés),
   M15 連語, M16 仲間はずれ — additifs, même vivier `studiedSet`, comblent le plus gros angle mort,
   risque quasi nul. **M13 用法** et **M14 語形成** en 2e vague (coût distracteurs).
2. **Étendre la grammaire** M17 ★ et M18 接続 — bon rapport valeur/coût, restent dans
   `grammar_encounters`.
3. **Piloter 1 mode lecture** (M19 指示語 ou M21 情報検索) comme le vrai « exercice de livre en
   combat » — c'est la brique qui rouvre le design, à traiter en grill dédié (support, longueur,
   tirage, d'où viennent les passages, impact sur les profils de poids).

## Décisions ouvertes (pour le grill)
- Combien de modes ajouter au total (les profils de poids Route/Boss doivent resommer à 100 %) ?
- Les modes lexicaux se branchent-ils sur le tirage `studiedSet` existant sans nouveau champ ? (oui a
  priori — même pool, nouveau `render`.)
- Famille lecture : les supports viennent-ils des livres adaptés (vetting 12bis) ou d'un pool dédié ?
  Longueur max jouable en combat (≤200字 ?). Réservés aux Boss/examens ou aussi route ?
- Distracteurs : quels modes exigent un batch IA relu (用法, 類義, 主張) vs auto-générables (文脈規定,
  仲間はずれ, 指示語) ?
