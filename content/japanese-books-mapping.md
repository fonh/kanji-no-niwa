# Bibliothèque du projet ↔ progression du joueur

Document interne (créé 2026-07-05). Associe chaque ressource de `scripts/sources/japanses books/` aux
paliers de progression du jeu (table recalibrée de `curriculum-checkpoints.md`, audit 01). **Aucun
contenu créé ici** — c'est la carte de couverture : qui alimente quoi, où, et où sont les trous.

Licences : usage app privée jamais publiée — même statut que Tadoku/Watanoc/NHK dans `PRD.md`
§ Sources de Contenu. Tout texte adapté de ces livres passera par le vetting `studiedSet`
(pipeline 12bis) et la génération de quiz (12ter) — plus tard, pas maintenant.

---

## Inventaire identifié (vérifié en ouvrant chaque PDF)

**⚠️ Mise à jour 2026-07-09** : cet inventaire datait du 5 juillet et ratait 6 fichiers déjà
présents dans le dossier au moment de sa rédaction (probablement ajoutés le même jour, jamais
recensés). Trouvés en auditant `content/lessons-proposal.json` contre cette carte — voir
« Manquements » ci-dessous, largement recalculé suite à cette découverte.

| # | Fichier | Identité réelle | Niveau | Nature |
|---|---|---|---|---|
| 1 | `Marugoto…Starter A1 Coursebook…` | Marugoto Starter (A1) — coursebook | A1 | Manuel officiel JF (can-do) |
| 2 | `…MARUGOTO_A1_GOICHOU` | Marugoto ごいちょう A1 — lexique officiel ~1 000 mots par topic (700 かつどう/りかい + 300) | A1 | Vocabulaire thématique |
| 3 | `marugoto-a1_compress` | Marugoto Starter (A1) — second volume (かつどう ou りかい, pairing du #1 ; 149p vs 99p pour le #1, donc bien un fichier distinct) — identité かつどう/りかい exacte non confirmée (scan sans texte) | A1 | Manuel officiel JF |
| 4 | `marugoto-elementary-1-a2-katsudou…` | **Marugoto Élémentaire 1 (A2-1) かつどう** — comble le trou précédemment signalé | A2 | Manuel — activités/oral |
| 5 | `marugoto-elementary-1-a2-rikai…` | **Marugoto Élémentaire 1 (A2-1) りかい** — comble le trou précédemment signalé | A2 | Manuel — grammaire/structures |
| 6 | `marugoto-elementary-2-a2-katsudo…` | Marugoto Élémentaire 2 (A2-2) かつどう | A2 | Manuel — activités/oral |
| 7 | `marugoto-a2-2-rikai…` | Marugoto Élémentaire 2 (A2-2) りかい | A2 | Manuel — grammaire/structures |
| 8 | `…MARUGOTO_A2B1` | Marugoto Pré-intermédiaire (A2/B1) | A2/B1 | Manuel (volume unique) |
| 9 | `…MARUGOTO_B1` | Marugoto Intermédiaire 1 (B1) 中級1 | B1 | Manuel (volume unique) |
| 10 | `marugoto-b1-2…` | Marugoto Intermédiaire 2 (B1) 中級2 — confirmé par la préface | B1 | Manuel — dernier volume de la série |
| 11 | `marugoto-b1-vocabulary_compress` | Marugoto B1 — lexique thématique. **Seul fichier du dossier avec texte extractible** (118k caractères, testé pymupdf) — les 17 autres PDF sont des scans image purs, 0 caractère extractible | B1 | Vocabulaire thématique |
| 12 | `901725816-Short-Stories…Vol-1` | **You Can Read Japanese! Level 1 Vol. 1** (Yumi Nishino, 2023) — gradué selon les niveaux NPO Tadoku | Tadoku L1 ≈ N5 | Recueil ~10 histoires illustrées |
| 13 | `935733020-Short-Stories…` | **You Can Read Japanese! Level 1 Vol. 2** (2023) — inclut des classiques Aozora simplifiés (Niimi Nankichi, Ogawa Mimei) | Tadoku L1 ≈ N5/N4 | Recueil ~8 histoires |
| 14 | `japanese-short-stories-for-beginners…` | **Japanese Short Stories for Beginners** (The Language Academy / Hiromi Zeid, 2016) — 9 histoires + vocab | ≈ N5/N4 | Recueil (romaji présent — qualité à vérifier avant usage) |
| 15 | `Japanese Stories for Language Learners…` | **Japanese Stories for Language Learners** (Tuttle — McNulty/Sato) — Urashima Tarō, Yuki-onna, Le Fil de l'araignée (Akutagawa)… bilingue + audio, difficulté croissante | ≈ N4 → N2 | 5 contes bilingues longs, découpés en pistes |
| 16 | `James W. Heisig - Remembering the Kanji, Vol. 1` | **RTK 1** (éd. 2007-2008) — 2 200 kanji, décomposition en primitives + mnémotechniques | transversal | Méthode kanji (ordre NON-JLPT) |
| 17 | `[studyjapanese.net]_Shin_Kanzen_Masuta_N2-Dokkai` | **Shin Kanzen Master N2 読解** (lecture) | N2 | Manuel JLPT — lecture |
| 18 | `shin-kanzen-master-n1-bunpou_compress` | **Shin Kanzen Master N1 文法** (grammaire) | N1 | Manuel JLPT — grammaire |
| 19 | `shin-kanzen-master-n1-dokkai_compress` | **Shin Kanzen Master N1 読解** (lecture) | N1 | Manuel JLPT — lecture |
| 20 | `shin-kanzen-master-n2-goipdf_compress` | **Shin Kanzen Master N2 語彙** (vocabulaire) — bonus, pas demandé mais utile | N2 | Manuel JLPT — vocabulaire |

Correspondance CECR↔JLPT (cf. `jlpt-language-syllabus.md`) : A1=N5 · A2=N4 · B1=N3 · B2=N2 · C1=N1.
**La série Marugoto s'arrête à B1** — c'est une limite de la collection, pas un oubli.

**Blocage pratique découvert 2026-07-09** : 17 des 18 PDF Marugoto/Shin Kanzen Master sont des
scans image sans aucune couche de texte (0 caractère extractible, testé page par page avec
pymupdf sur les 6 nouveaux fichiers + spot-check des anciens). Aucun OCR n'est installé sur cette
machine (`tesseract` absent). Donc même les livres « présents » ne sont pas exploitables par un
script tant qu'ils n'ont pas été OCRisés (ou lus visuellement page à page) — c'est un blocage
d'outillage, pas seulement un manquement d'inventaire. Décision 2026-07-09 : **différé à la passe
contenu dédiée** (Étape 3-4), pas avant — l'assignation grammaire↔zone reste sur Hanabira
(`grammar-zone-assignment.json`, déjà en place) pour la structuration des leçons (Point 5).

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
  secondaire surtout) : candidats à adapter (vetting 12bis) pour les ~85-115 textes secondaires des
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
| Bourg Geon → Ville Griotte (bootstrap Elm, premières routes) | 0–60 | N5 pur | Marugoto Starter A1 + ごいちょう ; YCRJ L1 Vol. 1 (premiers textes) | ✅ solide |
| Routes 30-31 → Mauville, Tour Grospignon | 50–140 | N5/N4 | Marugoto Starter A1 (fin) ; YCRJ Vol. 1-2 ; JSS for Beginners (à vetter) | ✅ solide |
| Route 32 → Forêt Secte | 110–240 | N4 | Marugoto Élémentaire 1 (A2-1) かつどう+りかい — **trouvé présent 2026-07-09** (l'inventaire précédent le disait absent) ; YCRJ Vol. 2, JSS for Beginners en textes | 🟡 présent mais non-OCR, voir Manquements |
| Route 34 → Doublonville | 220–290 | N4 | Marugoto A2-2 かつどう+りかい | ✅ solide |
| Route 35 → Parc National | 270–330 | N4/N3 | Marugoto A2-2 (fin) + A2/B1 (début) ; Tuttle (1ers contes : Urashima Tarō) | ✅ |
| Routes 36-37 → Rosalia → Irisia | 310–520 | N3 | Marugoto A2/B1 puis B1 (中級1) ; Tuttle (milieu) | ✅ |
| Route 42 → Lac Colère | 500–570 | N3/N2 | Marugoto B1 → B1-2 (中級2) ; Tuttle (Yuki-onna…) | ✅ |
| Route 44 → Routes 26-27 | 555–830 | N2 | Marugoto B1-2 (dernier volume — s'épuise ici) ; Tuttle (fin : Le Fil de l'araignée, vrai Akutagawa simplifié) | 🟡 fin de collection |
| Antre du Dragon, Antichambre | 640–870 | N2/N1 | Tuttle (registre littéraire, dernier usage) ; rien d'autre | 🟡 |
| Ligue (plate) | 870–900 | N2/N1 *(remappé 2026-07-05)* | — (calibration de langue seulement, pas de leçons — voulu, audit 01) | ✅ par design |
| Kanto — Vermeille → Céladia | 900–1500 | N2 *(remappé 2026-07-05)* | Shin Kanzen Master N2 読解 + 語彙 **trouvés présents 2026-07-09** ; N2 文法 (l'étalon de séquençage grammatical) toujours absent | 🟡 partiel, voir Manquements |
| Kanto — Cycling Road → Routes 14-15 | 1500–1670 | N2/N1 | idem (transition) | 🟡 |
| Kanto — Grotte Diglett → Seafoam + revisites | 1670–2136 | N1 | Shin Kanzen Master N1 文法 + 読解 **trouvés présents 2026-07-09** ; relais textes par NHK, Matcha, Aozora brut *(« textes officiels Pokémon » retiré 2026-07-07, audit 05, finding 05-A3 : source écartée du N1 le 2026-07-02, `texts-progressifs.md` § Sources — fossile de rédaction)* | 🟡 présent mais non-OCR, voir Manquements |
| Mont Gris (plateau 2136) | 2136 | N1 | idem — textes N1 durs prévus par `texts-progressifs.md` (Aozora brut, chapitre de manga pour Red, lettre finale du mentor) | 🟡 |
| Transversal (tout le jeu) | 0–2136 | — | Heisig RTK 1 (mnémotechniques, pipeline 7) ; syllabus JLPT comme référentiel | ✅ |

---

## Manquements identifiés (l'essentiel du document)

**🔄 Recalculé 2026-07-09** — 6 fichiers déjà présents sur disque n'avaient pas été recensés en
juillet (Shin Kanzen Master ×4, Marugoto Élémentaire 1 ×2, + un 2e volume Starter A1 non identifié).
Ça ferme la plupart des trous d'*inventaire* ci-dessous, mais **révèle un trou d'*outillage*** : 17
des 18 PDF Marugoto/Shin Kanzen Master sont des scans sans texte extractible, et il n'y a pas d'OCR
installé sur la machine — donc « présent sur disque » ≠ « exploitable par un script ou une relecture
rapide » tant que ce blocage n'est pas levé.

1. **🟡 N1-N2 / arc Kanto (900→2136) — 3 des 4 volumes Shin Kanzen Master demandés sont présents**
   (N2 読解, N1 文法, N1 読解, + N2 語彙 en bonus non demandé) mais aucun n'a de texte extractible.
   **Il manque toujours Shin Kanzen Master N2 文法** (l'étalon de séquençage grammatical pour
   Vermeille → Céladia, 900–1500) — c'est la seule vraie case vide restante de la liste
   d'acquisition d'origine. Pour les 3 volumes présents : utilisables seulement après OCR ou
   lecture visuelle page à page (aucun des deux fait à ce stade — **décision 2026-07-09 : différé
   à la passe contenu**, cf. `roadmap-pre-code.md` Étape 2 point 5).
2. **✅ Marugoto Élémentaire 1 (A2-1) trouvé présent** (かつどう et りかい) — referme le trou
   Route 32 → Forêt Secte signalé en juillet. Même blocage OCR que le reste.
3. **🟡 Starter A1 : second volume probable trouvé** (`marugoto-a1_compress.pdf`, 149p, distinct du
   fichier `#1` par le nombre de pages) mais identité かつどう/りかい non confirmée (scan sans texte,
   pas de préface lisible sans OCR/lecture visuelle).
4. **🟡 Textes secondaires : ~30 histoires candidates pour ~85-115 slots.** Les 4 recueils fournissent
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
(situations authentiques, séquençage éprouvé, textes prêts à adapter) — ses trous restants (N2 文法,
blocage OCR) sont des trous de *confort d'écriture*, pas des trous de *progression*. L'assignation
grammaire↔zone du Point 5 (`grammar-zone-assignment.json`) reste sur Hanabira, indépendamment de
l'avancement de cette bibliothèque.

## Liste d'acquisition / OCR (recalculée 2026-07-09 — ce qui manque vraiment, par priorité)

**Reste à acquérir :**
1. Shin Kanzen Master N2 文法 — seul volume demandé encore absent (Kanto 900–1500, Vermeille → Céladia)

**Présents mais bloqués par l'absence d'OCR (différé à la passe contenu, pas maintenant) :**
- Shin Kanzen Master N2 読解, N1 文法, N1 読解, N2 語彙
- Marugoto Élémentaire 1 (A2-1) かつどう + りかい
- Tous les autres PDF Marugoto sauf `marugoto-b1-vocabulary_compress.pdf` (seul à avoir du texte
  extractible nativement)

**Confort (pas bloquant) :**
2. Tobira ou TRY! N2 — pont N3→N2, fin de Johto (Route 44 → Routes 26-27)
3. Read Real Japanese (Fiction/Essays) ou Breaking into Japanese Literature — textes authentiques N2/N1
   avec traduction en regard, entre le Tuttle (trop facile en fin de jeu) et l'Aozora brut

**À ne PAS ajouter (redondant)** : recueils débutants supplémentaires (4 déjà là), manuels N5/N4
(Genki/Minna — Marugoto + syllabus suffisent), Heisig RTK 2/3 (vol. 1 suffit ; lectures déjà dans
Kanjidic2), manuels de vocabulaire (8 113 mots yomitan + audio local déjà en place).

Cross-refs : `curriculum-checkpoints.md` (paliers), `jlpt-language-syllabus.md` (can-dos par niveau),
`content/texts-progressifs.md` (tiers de textes, vetting), `PRD.md` § Pipeline de Données (étapes 7,
10-12ter) et § Sources de Contenu (licences).
