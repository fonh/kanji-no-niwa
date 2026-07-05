# Audit 05 — Textes progressifs et condition de lecture

Tu es une session d'audit du projet 漢字の庭 (PWA d'apprentissage du japonais construite
sur le monde de Pokémon HeartGold/SoulSilver). Phase actuelle du projet : **corriger les
documents de référence avant d'écrire le contenu** — aucun code, aucun issue tracker.
Déroulé strict : Phase 1 audit (lecture seule) → Phase 2 grill → Phase 3 correction
immédiate des docs.

## Docs de référence

- `content/texts-progressifs.md` (le doc central de cet audit)
- PRD : `.scratch/kanji-no-niwa/PRD.md` — § Textes Progressifs, § CS-Kanji (condition
  de lecture), § Sac (Journal de lecture), table `texts` du modèle de données
- `content/curriculum-checkpoints.md` (niveaux par zone)
- Sources réellement présentes : `scripts/sources/` (aozorabunko-clean.jsonl.gz,
  jesc_filtered.json, tatoeba_jpn_eng.json, nhkore/, jmdictExtended, etc.)

## Périmètre

- **Inventaire promis vs sources réelles** : combien de textes le doc promet-il par
  zone/tier (obligatoire vs secondaire) ? Les sources citées (NHK Web Easy via nhkore,
  Watanoc, Matcha, Aozora, textes Pokémon officiels) sont-elles réellement dans
  `scripts/sources/` ? Pour celles absentes : le doc dit-il comment les obtenir, et
  leur licence/domaine public est-il traité quelque part ? (Watanoc/Matcha sont des
  sites sous droits — un doc de référence qui promet de copier leurs textes sans
  poser la question de la licence est un finding à part entière.)
- **Condition CS-Kanji** : « le texte du donneur n'a d'effet que si tous les textes
  des zones débloquées sont lus ». Définitions exactes : « zones débloquées » (lesquelles ?
  intérieurs inclus ?), « découverts » vs « existants » (le menu montre les textes des
  zones débloquées, lus ou non — mais la condition porte-t-elle sur les découverts ou
  sur tous ?), risque de dead-end (un texte porté par un PNJ conditionnel raterait la
  condition ?). Croise avec `findings-02-condition-effect.md` s'il existe.
- **Niveau linguistique** : la promesse « niveau du texte = palier de la zone » est-elle
  vérifiable (critère de niveau défini : kanji hors palier interdits ? tolérés avec
  furigana ?) ? Qui/quoi valide qu'un texte est bien N4 ?
- **Journal de lecture** (Sac) : cohérent entre PRD § Sac et texts-progressifs
  (relecture, pas trophées) ? Les champs de la table `texts` du PRD couvrent-ils tout
  (placement npc_ref/found_object_ref, tier, zone_id) ?

**Interfaces à couvrir aussi :** furigana/bouton Y sur les textes (format des lectures),
et ce que les textes promettent aux quêtes (`unlock_text`).

## Phase 1 — Audit (lecture seule)

Ne modifie AUCUN fichier. Compte réellement (scripts jetables scratchpad OK) ce que
contiennent les sources présentes. Classe : **A** contradiction, **B** promesse sans
données, **C** promesse sans mécanisme, **D** ambiguïté, **E** obsolète.
Rapport → `.scratch/audits/findings-05-textes.md` avec chemin:ligne et comptes.

## Phase 2 — Grill

Invoque `/grill` sur les D — notamment : définition exacte de la condition de lecture
(et ses dead-ends), sources sous droits (remplacer ? rédiger en interne ? négocier ?),
critère de niveau d'un texte.

## Phase 3 — Correction immédiate

- Corrige texts-progressifs.md et le PRD selon les décisions. Marque
  `(corrigé AAAA-MM-JJ, audit 05)`.
- N'écris AUCUN texte de contenu. Hors périmètre → « Reporté à la synthèse ».
- Résumé final : corrections, décisions, reportés.

## Règles transverses

1. Aucun français dans le produit ; 2. CS-Kanji jamais débloqués par le SRS (la
condition de lecture est une condition de LECTURE, pas de maîtrise — toute dérive vers
la maîtrise est un finding) ; 3. Pas de theming kanji par classe ; 4. Mécanismes A/B/C.
