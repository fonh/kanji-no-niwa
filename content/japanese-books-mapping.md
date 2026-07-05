# Bibliothèque du projet ↔ progression du joueur

Document interne (créé 2026-07-05). Associe chaque ressource de `scripts/sources/japanses books/` aux
paliers de progression du jeu (table recalibrée de `curriculum-checkpoints.md`, audit 01). **Aucun
contenu créé ici** — c'est la carte de couverture : qui alimente quoi, où, et où sont les trous.

Licences : usage app privée jamais publiée — même statut que Tadoku/Watanoc/NHK dans `PRD.md`
§ Sources de Contenu. Tout texte adapté de ces livres passera par le vetting `studiedSet`
(pipeline 12bis) et la génération de quiz (12ter) — plus tard, pas maintenant.

---

## Inventaire identifié (vérifié en ouvrant chaque PDF)

| # | Fichier | Identité réelle | Niveau | Nature |
|---|---|---|---|---|
| 1 | `Marugoto…Starter A1 Coursebook…` | Marugoto Starter (A1) — coursebook | A1 | Manuel officiel JF (can-do) |
| 2 | `…MARUGOTO_A1_GOICHOU` | Marugoto ごいちょう A1 — lexique officiel ~1 000 mots par topic (700 かつどう/りかい + 300) | A1 | Vocabulaire thématique |
| 3 | `marugoto-elementary-2-a2-katsudo…` | Marugoto Élémentaire 2 (A2-2) かつどう | A2 | Manuel — activités/oral |
| 4 | `marugoto-a2-2-rikai…` | Marugoto Élémentaire 2 (A2-2) りかい | A2 | Manuel — grammaire/structures |
| 5 | `…MARUGOTO_A2B1` | Marugoto Pré-intermédiaire (A2/B1) | A2/B1 | Manuel (volume unique) |
| 6 | `…MARUGOTO_B1` | Marugoto Intermédiaire 1 (B1) 中級1 | B1 | Manuel (volume unique) |
| 7 | `marugoto-b1-2…` | Marugoto Intermédiaire 2 (B1) 中級2 — confirmé par la préface | B1 | Manuel — dernier volume de la série |
| 8 | `901725816-Short-Stories…Vol-1` | **You Can Read Japanese! Level 1 Vol. 1** (Yumi Nishino, 2023) — gradué selon les niveaux NPO Tadoku | Tadoku L1 ≈ N5 | Recueil ~10 histoires illustrées |
| 9 | `935733020-Short-Stories…` | **You Can Read Japanese! Level 1 Vol. 2** (2023) — inclut des classiques Aozora simplifiés (Niimi Nankichi, Ogawa Mimei) | Tadoku L1 ≈ N5/N4 | Recueil ~8 histoires |
| 10 | `japanese-short-stories-for-beginners…` | **Japanese Short Stories for Beginners** (The Language Academy / Hiromi Zeid, 2016) — 9 histoires + vocab | ≈ N5/N4 | Recueil (romaji présent — qualité à vérifier avant usage) |
| 11 | `Japanese Stories for Language Learners…` | **Japanese Stories for Language Learners** (Tuttle — McNulty/Sato) — Urashima Tarō, Yuki-onna, Le Fil de l'araignée (Akutagawa)… bilingue + audio, difficulté croissante | ≈ N4 → N2 | 5 contes bilingues longs, découpés en pistes |
| 12 | `James W. Heisig - Remembering the Kanji, Vol. 1` | **RTK 1** (éd. 2007-2008) — 2 200 kanji, décomposition en primitives + mnémotechniques | transversal | Méthode kanji (ordre NON-JLPT) |

Correspondance CECR↔JLPT (cf. `jlpt-language-syllabus.md`) : A1=N5 · A2=N4 · B1=N3 · B2=N2 · C1=N1.
**La série Marugoto s'arrête à B1** — c'est une limite de la collection, pas un oubli.

---

## Rôle de chaque famille dans les systèmes du jeu

- **Marugoto かつどう (A1, A2-2)** → *modèles de situations pour dialogues PNJ et déclencheurs de
  leçons*. C'est l'incarnation livre des can-dos du syllabus (`jlpt-language-syllabus.md`) : dire
  l'heure, acheter, demander un chemin… Quand l'équipe contenu écrira une zone, elle calque la
  *situation* (jamais le texte verbatim) sur l'unité Marugoto du même can-do.
- **Marugoto りかい (A2-2) + volumes A2/B1, B1, B1-2** → *étalon de séquençage grammatical* : dans quel
  ordre un manuel officiel JF introduit les structures — à recouper avec l'ordre d'apparition des
  `grammar_note` par zone. Sert aussi de banque de phrases-modèles pour calibrer la longueur/registre
  des dialogues de chaque palier (colonne « Longueur phrase » de la table de calibration).
- **ごいちょう A1** → *priorisation du vocabulaire N5* : ses ~1 000 mots par topic disent lesquels des
  705 mots N5 (yomitan) mettre en avant dans les premières Cartes Mots et exemples de leçons.
- **Recueils d'histoires (8-11)** → *vivier de la table `texts`* (Textes Progressifs, tiers
  secondaire surtout) : candidats à adapter (vetting 12bis) pour les ~70-100 textes secondaires des
  zones N5→N2. Le vol. 2 de You Can Read Japanese! est un précédent direct de notre méthode : il fait
  exactement ce que prévoit le pipeline (simplifier de l'Aozora au niveau du lecteur).
- **Heisig RTK 1** → *pipeline étape 7 uniquement* (batch IA étymologie + mnémotechnique des 2 136
  kanji) : référence de qualité pour la décomposition en composants (croisée avec KanjiVG/kradfile déjà
  importés) et pour le style des mnémotechniques. **Jamais pour l'ordre** : l'ordre RTK (par primitives)
  est incompatible avec l'ordre du jeu (JLPT + prérequis composants, `getAvailableKanji`) — décision à
  ne pas rediscuter, les deux ordres ne peuvent pas coexister.

---

## Mapping palier par palier (table recalibrée 2026-07-05)

| Segment du jeu | Kanji | Niveau | Ressources du dossier | Couverture |
|---|---|---|---|---|
| Bourg Geon → Ville Griotte (bootstrap Fukuda, premières routes) | 0–60 | N5 pur | Marugoto Starter A1 + ごいちょう ; YCRJ L1 Vol. 1 (premiers textes) | ✅ solide |
| Routes 30-31 → Mauville, Tour Grospignon | 50–140 | N5/N4 | Marugoto Starter A1 (fin) ; YCRJ Vol. 1-2 ; JSS for Beginners (à vetter) | ✅ solide |
| Route 32 → Forêt Secte | 110–240 | N4 | ⚠️ **Marugoto Élémentaire 1 (A2-1) ABSENT** — début N4 sans manuel ; YCRJ Vol. 2, JSS for Beginners en textes | 🟡 trou manuel |
| Route 34 → Doublonville | 220–290 | N4 | Marugoto A2-2 かつどう+りかい | ✅ solide |
| Route 35 → Parc National | 270–330 | N4/N3 | Marugoto A2-2 (fin) + A2/B1 (début) ; Tuttle (1ers contes : Urashima Tarō) | ✅ |
| Routes 36-37 → Rosalia → Irisia | 310–520 | N3 | Marugoto A2/B1 puis B1 (中級1) ; Tuttle (milieu) | ✅ |
| Route 42 → Lac Colère | 500–570 | N3/N2 | Marugoto B1 → B1-2 (中級2) ; Tuttle (Yuki-onna…) | ✅ |
| Route 44 → Routes 26-27 | 555–830 | N2 | Marugoto B1-2 (dernier volume — s'épuise ici) ; Tuttle (fin : Le Fil de l'araignée, vrai Akutagawa simplifié) | 🟡 fin de collection |
| Antre du Dragon, Antichambre | 640–870 | N2/N1 | Tuttle (registre littéraire, dernier usage) ; rien d'autre | 🟡 |
| Ligue (plate) | 870–900 | N2/N1 *(remappé 2026-07-05)* | — (calibration de langue seulement, pas de leçons — voulu, audit 01) | ✅ par design |
| Kanto — Vermeille → Céladia | 900–1500 | N2 *(remappé 2026-07-05)* | ❌ aucun livre — c'est exactement le créneau de Shin Kanzen Master N2 (manquement n°1) | 🔴 voir Manquements |
| Kanto — Cycling Road → Routes 14-15 | 1500–1670 | N2/N1 | ❌ idem (transition) | 🔴 |
| Kanto — Grotte Diglett → Seafoam + revisites | 1670–2136 | N1 | ❌ aucun livre — créneau Shin Kanzen Master N1 ; relais textes par NHK, Matcha, Aozora brut, textes officiels Pokémon | 🔴 voir Manquements |
| Mont Gris (plateau 2136) | 2136 | N1 | ❌ idem — textes N1 durs prévus par `texts-progressifs.md` (Aozora brut, chapitre de manga pour Red, lettre finale de Fukuda) | 🔴 voir Manquements |
| Transversal (tout le jeu) | 0–2136 | — | Heisig RTK 1 (mnémotechniques, pipeline 7) ; syllabus JLPT comme référentiel | ✅ |

---

## Manquements identifiés (l'essentiel du document)

1. **🔴 N1 / arc Kanto (900→2136) — aucun livre.** C'est le plus gros segment du jeu depuis le
   recalibrage (~60 % du budget kanji) et la bibliothèque s'arrête à B1/N2. Structurel (Marugoto
   n'existe pas au-delà de B1), et partiellement couvert par les sources web du PRD — mais il n'y a
   aucun étalon « manuel » pour séquencer la grammaire N2→N1 des zones Kanto, ni de vivier de textes
   longs N1. **Candidats si tu veux compléter la bibliothèque** (décision à toi, rien n'est requis) :
   Shin Kanzen Master N2/N1 (grammaire + lecture — l'étalon de séquençage qui manque), Tobira (pont
   N3→N2), et pour les textes : romans graded readers niveaux 4-5, Aozora déjà en local
   (`aozorabunko-clean.jsonl.gz`).
2. **🟡 Marugoto Élémentaire 1 (A2-1) absent** (かつどう et りかい) — la collection saute de Starter A1
   à Élémentaire 2. Trou de manuel sur Route 32 → Forêt Secte (110–240 kanji, début N4) : le séquençage
   grammatical de ce segment devra s'appuyer sur le syllabus + Hanabira seuls, ou tu ajoutes les 2 PDF
   A2-1 pour fermer la série.
3. **🟡 Starter A1 : un seul coursebook présent** — Marugoto existe toujours en paire かつどう (activités)
   + りかい (grammaire). Le PDF présent est un seul des deux (non identifiable à coup sûr, scan sans
   texte). Si c'est le かつどう, il manque le りかい A1 (séquençage grammatical N5) et inversement.
4. **🟡 Textes secondaires : ~30 histoires candidates pour ~70-100 slots.** Les 4 recueils fournissent
   environ 30 textes N5→N2 — un excellent démarrage, pas une couverture complète. Le complément vient
   des sources déjà actées (Tadoku libre, Watanoc, NHK Easy, Matcha) — cohérent avec
   `texts-progressifs.md`, rien à changer.
5. **⚪ JSS for Beginners (Language Academy)** : présence de romaji et qualité éditoriale inégale
   (2016, auto-édité) — à traiter comme réserve d'idées d'intrigues plutôt que comme source à adapter
   telle quelle. À trancher au moment du vetting, pas avant.
6. **⚪ Rappel de périmètre** : le dossier vit dans `scripts/sources/` mais n'est branché sur aucune
   étape du pipeline (aucun script ne le lit). C'est normal à ce stade — ce document est le seul lien,
   volontairement (« on créera le contenu plus tard »).

## Ce que ça change à la vision de progression : rien ne manque *mécaniquement*

La progression du joueur (audit 01) est fermée sans ces livres : kanji 0→2136, gates, grammaire
comptée sur Hanabira, textes sourcés web. Cette bibliothèque est une **couche de qualité éditoriale**
(situations authentiques, séquençage éprouvé, textes prêts à adapter) — ses trous (N1, A2-1) sont des
trous de *confort d'écriture*, pas des trous de *progression*. Le seul segment où l'absence de support
livre coïncide avec une zone déjà tendue est le Kanto N1 (leçons poussées de 8-12 kanji à écrire sans
étalon) — d'où la recommandation Kanzen Master en manquement n°1.

## Liste d'acquisition (demandée 2026-07-05 — ce qui manque, par priorité)

**Prioritaire (trous rouges — arc Kanto) :**
1. Shin Kanzen Master N2 文法 — étalon de séquençage grammatical pour Kanto 900–1500 (Vermeille → Céladia)
2. Shin Kanzen Master N2 読解 — vivier de textes N2 pour les mêmes zones
3. Shin Kanzen Master N1 文法 — Kanto 1670+ (Brock/Blaine/Blue) et Mont Gris
4. Shin Kanzen Master N1 読解 — textes N1 durs du plateau Mont Gris

**Compléter Marugoto (trous jaunes) :**
5. Marugoto Élémentaire 1 (A2-1) りかい + かつどう — ferme le trou Route 32 → Forêt Secte
6. Le second volume du Starter A1 (かつどう ou りかい selon celui déjà présent — à identifier sur la couverture)

**Confort (pas bloquant) :**
7. Tobira ou TRY! N2 — pont N3→N2, fin de Johto (Route 44 → Routes 26-27)
8. Read Real Japanese (Fiction/Essays) ou Breaking into Japanese Literature — textes authentiques N2/N1
   avec traduction en regard, entre le Tuttle (trop facile en fin de jeu) et l'Aozora brut

**À ne PAS ajouter (redondant)** : recueils débutants supplémentaires (4 déjà là), manuels N5/N4
(Genki/Minna — Marugoto + syllabus suffisent), Heisig RTK 2/3 (vol. 1 suffit ; lectures déjà dans
Kanjidic2), manuels de vocabulaire (8 113 mots yomitan + audio local déjà en place).

Cross-refs : `curriculum-checkpoints.md` (paliers), `jlpt-language-syllabus.md` (can-dos par niveau),
`content/texts-progressifs.md` (tiers de textes, vetting), `PRD.md` § Pipeline de Données (étapes 7,
10-12ter) et § Sources de Contenu (licences).
