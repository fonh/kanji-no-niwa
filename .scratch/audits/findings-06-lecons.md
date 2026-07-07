# Findings — Audit 06 : Leçons (écran-livre, batchs, ordre)

Date : 2026-07-07. **Statut : audit terminé** — Phase 1 (findings ci-dessous), Phase 2 (grill,
décisions ci-dessous), Phase 3 (corrections appliquées à PRD, curriculum-checkpoints,
npc-inventory, CONTEXT.md, ADR-0003 — marquées `(corrigé 2026-07-07, audit 06)`).

## Décisions du grill (2026-07-07) et corrections appliquées

1. **Menu Leçons (06-D1 + 06-A2) — « Carnet de leçons »** : le slot 2 du menu START devient la
   table des matières du livre — double page, chapitres = zones visitées avec compteur n/m à
   gauche, détail à droite (complétées relisibles / prochaine leçon = PNJ + lieu / suivantes
   masquées 「???」, idiome silhouette du Pokédex). Le mot « batch » (trois sens selon les docs)
   est purgé partout. `getLessonQueue` → **`getLessonBook(lessonsRegistry, questProgress,
   visitedZones, completedLessons)`** ; aucun état « leçon rencontrée » à tracer. Design issu
   d'une revue complète de l'architecture menu (voir « Décisions transverses menu » plus bas).
   → PRD § Menu START + § Leçons + ProgressionEngine.
2. **Double page (06-A1 + 06-D2) — 1 kanji = la double page entière** : gauche = identité
   (caractère, lecture colorée, mot-clé anglais du mécanisme C, illustration, audio) ; droite =
   usage (1-2 phrases d'exemple avec audio). « Portrait plein écran » (fossile d'avant paysage)
   corrigé ; « pas de scroll dans l'écran-livre » réconcilié avec § Kanjidex (leçon retirée de la
   liste scroll). → PRD § Leçons + § Kanjidex.
3. **Fossiles purgés (06-C2 + 06-D2)** : `lessons.content` et `lessons.lesson_type` supprimés
   (pages générées depuis `kanji_ids[]`/`grammar_id`, rien de rédigé par leçon) ;
   `Effect.unlock_lesson` retiré du PRD, de CONTEXT.md et de l'ADR-0003 (amendement).
4. **Ordre intra-zone (06-C4) — règle moteur dérivée** : comparaison `lessons.sequence_index` vs
   `npc_quest_progress` de `lessons-<zone_id>` ; `unlock_conditions` garde sa sémantique unique
   (présence). PNJ-leçon `talk` sans cône : ligne de blocage simple, **sans repoussée**.
   → PRD § Leçons + amendement ADR-0003.
5. **Banque de phrases de blocage (06-C1)** : fichier partagé
   `content/dialogues/shared/lesson-blocked.json`, ~5-8 formulations par palier JLPT (main,
   passe contenu) ; surcharge par PNJ possible via son propre état `blocked`. → PRD § Leçons.
6. **Phrases d'exemple (06-B1) — hybride humain>TTS** : d'abord une phrase Tango locale (audio
   humain) qui passe la calibration ; sinon batch IA (vérifié mécaniquement, relu) + VOICEVOX
   3-4 voix en rotation. Stockage `kanji.lesson_examples[]`, étape pipeline 7bis. → PRD § Leçons
   + schéma + pipeline.
7. **Illustrations (06-B2) — emoji + photos Anki** : mapping kanji→emoji automatique via
   annotations japonaises CLDR (Noto/OpenMoji), relu, **nullable** (`kanji.icon_ref`, étape
   7ter) ; améliorations Irasutoya au cas par cas. Les ~2 000 photos du deck Anki Core 2k/6k
   local illustrent les **Cartes Mot** (`words.photo_ref`, étape 8bis) — un style par registre
   d'écran. → PRD § Leçons + § Carte Mot + schéma + pipeline.
8. **Calibration leçon (06-D5)** : phrases d'exemple sur mesure — kanji du jour = connus,
   **zéro autre inconnu** (vérifiable mécaniquement) ; exemples Hanabira (corpus figé) — règle
   de **sélection** des variants les mieux couverts par le studiedSet théorique, inconnus
   résiduels tolérés (Y). → PRD + curriculum § Règles absolues + § Format grammar_note.
9. **Mini-quiz (06-C5) — proportionnel** : 1 question par kanji (Sens OU Lecture, distracteurs =
   tirage global table `kanji`) + 1 Grammaire si point ; jamais Saisie/Disposition/Écoute.
   Remplace « 2-3 questions » fixe (testing effect : aucun item n'entre en SRS sans une
   récupération active). → PRD § Format de leçon + Mini-quiz.
10. **Confirmations (06-D3/06-D4/06-D6)** : « un contenu fixé » reformulé ; mot-clé anglais
    explicitement introduit page gauche ; bootstrap Fukuda = ~7 leçons (~30 kanji) au dōjō,
    sortie possible dès ~2-3 leçons, gate 30 à l'entrée de Ville Griotte. → PRD § Leçons.
11. **Corrections A/B sans grill** : `grammar` re-schématisée (short/long_explanation +
    example_variants[] — 06-A3, le format grammar_note de curriculum décrit cette table, pas un
    champ de `lessons`) ; volume « 300–370 » → **280–370** (06-A4, 2 occurrences) ; format
    d'assignation défini dans npc-inventory (06-C3).

## Passe de vérification post-implémentation (2026-07-07, même session)

Relecture intégrale des sections modifiées + balayage de tous les docs (PRD, curriculum,
npc-inventory, CONTEXT.md, ADR-0001/0002/0003, texts-progressifs, guidebook-adapted,
jlpt-language-syllabus). **11 reliquats corrigés (V-1→V-11)** :

- **V-1** — PRD § Leçons (« Un seul mécanisme d'entrée du vocabulaire ») disait encore « kanji
  **maîtrisé** → mots éligibles » : reliquat d'avant le seuil assoupli du 2026-07-01, échappé à
  l'audit 03 (qui avait corrigé § Système SRS et curriculum mais pas cette occurrence). → « étudié ».
- **V-2** — Carnet de leçons : le registre cité omettait `trainer_ref` (les dresseurs-leçon
  existent) → `npc_ref`/`trainer_ref`.
- **V-3** — Banque de blocage : précisé que les exemples français du doc sont la langue de
  travail — le fichier réel est en japonais calibré au palier (règle « aucun français »).
- **V-4** — Table Sources de Contenu : les 5 sources nouvelles de l'audit n'y figuraient pas →
  lignes ajoutées (Noto/OpenMoji + annotations CLDR, VOICEVOX, pack Ankidrone JLPT_Tango — déjà
  utilisé par le mode Écoute sans ligne —, deck Anki Core 2k/6k, いらすとや candidat).
- **V-5** — Pipeline étape 14 : « stocké sur l'entrée grammar_note » → rattaché explicitement à
  la **table `grammar`** (cohérent 06-A3).
- **V-6** — Ligne `lessons` du schéma : référence « finding 06-Q3 » inexistante → 06-D2.
- **V-7** — `grammar.title` précisé : le `hanabira_title` exact, copié verbatim (dérive de nom
  entre le schéma et le format).
- **V-8** — Pokégear → onglet Grammaire : « tirés du même `grammar_note` que les leçons »
  (impliquait un champ de `lessons`) → même entrée de la table `grammar`.
- **V-9** — CONTEXT.md : trois entrées de vocabulaire ajoutées — **Lesson NPC** (check d'ordre
  dérivé, jamais unlock_conditions ; block sans repoussée pour les talk), **Book Screen**
  (écran-livre) et **Lesson Book** (Carnet) — les deux « livres » étaient confusables et aucun
  terme leçon n'existait dans le vocabulaire partagé.
- **V-10** — curriculum § Format grammar_note : libellé « Format JSON **du champ** » corrigé
  (c'est une entrée de table) ; le critère de sélection des `example_variants` précisé comme
  s'appliquant **à l'étape 14 du pipeline** (choix des 2-3 entrées stockées parmi les ~4 du
  corpus), pas à l'affichage.
- **V-11** — npc-inventory § new-bark-town : l'assignation de la zone ne pouvait pas fermer —
  les ~7 leçons du bootstrap sont portées par **Fukuda au dōjō**, absent du tableau sourcé (seule
  exception actée à « zéro PNJ-leçon inventé ») → note d'exception ajoutée avec le détail
  `lessons-new-bark-town` #1→#7.

**Vérifié sans correction** : menu slot 2 et Carnet (cohérents entre § Menu, § Leçons, engine) ;
double page vs § Interface paysage ; mini-quiz proportionnel (3 occurrences alignées) ; mécanisme
d'ordre (PRD ↔ ADR-0003 amendé ↔ CONTEXT) ; purges sans reliquat hors notes de correction
(« batch » sens leçon, `getLessonQueue`, `unlock_lesson`, `content`/`lesson_type`, « 2-3
questions », « portrait », « 300–370 ») ; schéma (`kanji`/`words`/`grammar`/`lessons`) ↔ pipeline
(7bis/7ter/8bis) ↔ § Leçons ↔ § Carte Mot croisés ; § Kanjidex scroll ; bootstrap Fukuda ↔ budgets
curriculum (0–30/10–50/30–60) ; règles de calibration identiques PRD/curriculum ; format
d'assignation npc-inventory ↔ champs `lessons` ; texts-progressifs (référence au retry du
mini-quiz toujours exacte) ; ADR-0002 compatible (lesson-blocked.json suivra la norme {jp, en}) ;
chiffres revérifiés sur disque (Hanabira 828/3 310, audio grammaire 3 310/3 310, étymologie
2136/2136, audio kanji 2133/2136, Tango 14 763, deck Anki 5 999 notes/2 000 images).

## Décisions transverses menu (grill 06, à intégrer par l'audit 08 — notées ici, sections non corrigées)

Revue d'ensemble de l'architecture menu faite au grill (fidélité HGSS vérifiée : menu tactile
2 colonnes 4+3 + bouton Pokégear ; pattern « Fullscreen Landscape » des émulateurs réels =
notre modèle un-écran + overlays, validé par recherche web) :

- **Noms de slots UI en japonais** (règle « aucun français ») : 図鑑・レッスン・バッグ・
  トレーナーカード・せってい — seuls 図鑑 et レッスン sont normés à ce jour dans le PRD.
- **Affichage START** : panneau overlay latéral droit (colonne de 5 slots, chrome DS, carte
  assombrie derrière, fermeture B/X) ; écrans riches en vues plein écran ; jamais de ratio 4:3
  singé.
- **助数詞 (carnet des compteurs)** : onglet du Kanjidex (図鑑 à deux onglets : 漢字/助数詞) —
  tranche la question laissée ouverte par la revue pédagogique.
- **Tableau de bord de progression** : Pokégear → Carte = détail (tap sur ◎/cadenas → conditions
  manquantes structurées, « あと38字 ») ; Profil/Trainer Card = synthèse « prochaine étape ».
  Résout l'emplacement laissé ouvert par l'audit 02.
- **Lettres de Fukuda** : relecture dans le Sac, poche Courrier (comme le Mail HGSS) — comblera
  le trou « `read_at` existe, aucun écran de relecture ».
- **Pas de bouton SRS dans START** (confirmé) : le SRS reste diégétique — Fukuda, Pokégear →
  Téléphone, Centres Pokémon ; badge ✓ sur l'icône Pokégear.
Docs audités : PRD (`.scratch/kanji-no-niwa/PRD.md` § Leçons, § Menu START, § Interface,
§ Implémentation/`getLessonQueue`/schéma, § Kanjidex, § Sensei Fukuda),
`content/curriculum-checkpoints.md` (§ Format grammar_note, § Sources Hanabira, table de
calibration), `content/npc-inventory.md`, `CONTEXT.md`, `docs/adr/0003`, rapport
`findings-03-srs.md` (croisement leçons↔SRS). Sources vérifiées sur disque :
`scripts/sources/grammar_JLPT_N{1-5}.json`, `public/audio/japanese/grammar/`,
`public/audio/kanji/`, `data/etymology/`, `scripts/sources/kanjivg-20250816.xml.gz`,
`scripts/sources/anki_audio_index.json`, `scripts/build/generate-grammar-audio.py`,
`scripts/build/generate-etymology.py`, `scripts/build/build-kanji-content.py`.

## Ce qui est déjà solide (vérifié, aucune correction)

- **Corpus Hanabira complet et audio local à 100 %** : 828 points (N5×136, N4×124, N3×132,
  N2×191, N1×245) et 3 310 exemples, chacun avec `grammar_audio` — **les 3 310 fichiers mp3
  existent tous** sous `public/audio/japanese/grammar/` (vérifié fichier par fichier). Les
  chiffres du PRD (étape 6/14 du pipeline) et de curriculum-checkpoints § Sources Hanabira
  sont exacts.
- **Étymologie/mnémotechnique : 2136/2136 kanji couverts** dans `data/etymology/*.json`, en
  anglais (conforme « aucun français ») — la promesse de l'étape 7 du pipeline est déjà
  matérialisée. (Réserve sur le script générateur : voir 06-B3.)
- **KanjiVG couvre les 2136 Jōyō** (vérifié contre `joyo-list.json`) — et le PRD écarte
  explicitement tracé/ordre des traits (L296), cohérent avec la règle « pas de handwriting ».
- **Audio kanji : 2133/2136** en local (`public/audio/kanji/_index.json`) — quasi complet
  (3 manquants, voir 06-B3).
- **Leçons ↔ SRS cohérent avec l'audit 03** : injection kanji-only, cartes dues le lendemain
  matin, `studiedSet` incrémenté à la complétion (PRD L310, L347) — aucun conflit avec les
  décisions 03-D3 ; grammaire hors SRS partout.
- **Zéro theming PNJ↔contenu** : martelé de façon cohérente (L291, L295, L312, L319, L324) —
  règle transverse 3 respectée.
- **Ordre de production macro→méso→micro** (L316-320) : la séquence pour l'équipe contenu est
  claire et ne redéfinit jamais les pools de zone.
- **Quiz de fin = formalité, retry-jusqu'à-correct, pas de porte** (L300, L308) : cohérent
  avec le même patron que les quiz de textes (audit 05).
- **Relecture (historique)** : définie proprement (L303 — lecture seule, sans quiz).

---

## Findings

### 06-A1 (A, MAJEUR) — Page kanji « portrait plein écran » : fossile d'avant l'orientation paysage

- PRD L50 (§ Interface) : orientation **paysage**, « jamais portrait », « y compris
  l'écran-livre des leçons, dont la double page côte à côte … est donc affichable telle
  quelle, sans repli en page unique empilée ».
- PRD L296 (§ Leçons, Page kanji) : « un kanji par page **(portrait plein écran)** ».
- Les deux ne peuvent pas être vrais ensemble : un écran paysage affichant une double page
  côte à côte n'affiche pas une page kanji « portrait plein écran ». La mention date
  visiblement d'avant la décision paysage (2026-07-01, même jour — non resynchronisée).
- S'y ajoute un trou : **le PRD ne dit jamais ce que contiennent les deux pages de la double
  page** (kanji à gauche / exemples à droite ? un kanji par demi-page ?) — voir 06-D2.

### 06-A2 (A/C) — `getLessonQueue` : deux descriptions contradictoires, signature inapte, « rencontrée » non tracée

- PRD L324 (§ Assignation) : « helper d'affichage en lecture seule pour le menu START →
  Leçons (**"prochaines leçons à faire"**) ».
- PRD L879 (ProgressionEngine) : « liste les leçons **déjà rencontrées sur le chemin mais pas
  encore complétées, dans l'ordre où le joueur les a croisées** ».
- Ce n'est pas la même liste : une « prochaine leçon à faire » (le PNJ-leçon suivant de la
  quête `lessons-<zone_id>` d'une zone visitée) n'a pas forcément été « rencontrée » ; et
  avec l'ordre intra-zone strict + résolution `block`, une leçon « croisée mais pas
  complétée » est rare (pas de sauvegarde/reprise, L301 — on ne peut pas « commencer sans
  finir » au-delà de la session en cours).
- La signature `getLessonQueue(availableKanji, completedLessons)` ne peut calculer **aucune**
  des deux : ni paramètre portant le registre des leçons/`sequence_index`, ni état de quête,
  ni zones visitées. `availableKanji` est un fossile de l'époque où le helper assignait du
  contenu dynamiquement (assignation désormais fixée à l'écriture).
- Aucune donnée ne trace « rencontrée » : `user_map_state` (L830) n'a que
  `completed_lessons[]`.

### 06-A3 (A/B) — Grammaire de leçon : embarquée (`grammar_note`) ou référencée (`grammar_id`) ? Le schéma `grammar` ne peut pas stocker ce que le format exige

- `curriculum-checkpoints.md` L632 : « Chaque batch de leçon dans **la table `lessons`
  contient un champ `grammar_note`** » — un objet JSON complet (hanabira_title, formation,
  short/long_explanation, `example_variants[]` avec `distractors[]`, jlpt_level).
- PRD L822 : la table `lessons` n'a **pas** de champ `grammar_note` — elle a `grammar_id`
  (référence vers la table `grammar`).
- PRD L820 : la table `grammar` = « title, formation, examples, jlpt_level » — il manque
  `short_explanation`/`long_explanation` (promis par l'écran-livre et le Pokégear → onglet
  Grammaire) et `example_variants[]`/`distractors[]` promis par l'étape 14 du pipeline
  (L898 : « stocké dans un tableau `example_variants[]` sur l'entrée grammar_note »).
- Deux modèles coexistent (copie embarquée par leçon vs référence vers une table enrichie) ;
  le second est le seul cohérent avec le Pokégear → Grammaire (« tirés du même `grammar_note`
  que les leçons », L82) et `grammar_encounters.grammar_id` — mais alors le format de
  curriculum-checkpoints décrit **l'entrée de la table `grammar`**, pas un champ de `lessons`,
  et le schéma PRD de `grammar` doit porter les champs manquants.

### 06-A4 (A, mineur) — Volume : « Total ≈ 300–370 » ≠ la somme de ses deux termes

PRD L330 : Johto ≈ 175–215 leçons + Kanto ≈ 105–155 leçons = **280–370**, pas « ≈ 300–370 ».
L'erreur se propage à L561 (« 828 points pour ~300-370 leçons ») et masque ~20 leçons de marge
basse dans le calcul de couverture grammaire.

### 06-B1 (B) — « 1-2 exemples de phrase (chacun avec sa propre icône audio) » : aucune source, aucun champ audio, aucune étape pipeline

- PRD L296 : chaque page kanji affiche 1-2 exemples de phrase, chacun avec icône audio.
- Aucun doc ne dit d'où viennent ces phrases (table `sentences`/Tatoeba ? rédaction batch
  IA ?), et la table `sentences` (L821) **n'a aucun champ audio**. Aucune étape du pipeline
  (1-16) ne produit « exemples de phrase de page kanji + audio » (contraste : les textes ont
  reçu leur `audio_ref` nullable à l'audit 05, finding 05-C3).
- Matériau disponible non mobilisé : `anki_audio_index.json` (pack Tango, 14 763 fichiers)
  contient des paires mot+phrase avec `sentence_audio`, et `build-kanji-content.py` construit
  déjà des exemples de **mots** avec audio par kanji ; VOICEVOX est déjà acté en complément
  pour le mode Écoute (L226). Il manque la décision et l'étape pipeline.
- Corollaire de calibration : aucune règle ne borne les kanji inconnus **dans les phrases
  d'exemple d'une leçon** (la règle dialogues « 2 inconnus/dialogue » et la règle textes
  proportionnelle ne visent pas ce cas) — voir 06-D5.

### 06-B2 (B) — Illustrations de concept : packs « identifiés pour l'import », mais aucun mapping kanji→icône ni étape pipeline

- PRD L296-297 : chaque page kanji a une « petite illustration à côté du sens », packs
  CC0 identifiés (Kyrise, Nature Kit, CC0 Food…), symboles conventionnels pour l'abstrait.
- Rien en local (`scripts/sources/`, `public/sprites/`) ne contient ces packs ; aucune étape
  du pipeline (1-16) ne produit le **mapping kanji→icône** (2136 entrées à produire, plus
  l'import des assets) ; la couverture réelle des packs vs 2136 concepts n'a jamais été
  comptée. C'est le seul champ de la page kanji sans aucune donnée ni process.

### 06-B3 (B, mineur) — Audio kanji 2133/2136 ; script d'étymologie encore en français

- `public/audio/kanji/_index.json` : 2133 entrées pour 2136 Jōyō — 3 kanji sans audio à
  compléter (détail à la passe contenu, pas un problème de design).
- `scripts/build/generate-etymology.py` : le prompt du batch demande encore méaning/étymologie/
  mnémotechnique **« en français »** — contraire à « aucun français nulle part ». Les données
  réelles (`data/etymology/`, 2136/2136) sont en anglais : le script est un fossile qui
  régénérerait du français s'il était relancé. Correction = code, hors périmètre de cet
  audit → **reporté à la synthèse** (noté ici pour trace).

### 06-C1 (C) — Banque de phrases de blocage : aucun emplacement de stockage défini

PRD L328 : « pool de plusieurs formulations équivalentes… piochées au hasard à chaque
blocage… calibrées au niveau de langue de la zone ». Le modèle de contenu ne sait pas
stocker ça : les `dialogue_states` sont des états keyés à pages fixes (L857), pas des pools
aléatoires. Vit-elle dans le fichier dialogue de chaque PNJ-leçon (état `blocked` à N
variantes ?), dans un fichier partagé par zone, par palier JLPT ? Qui la produit (batch IA ?
main) ? Rien n'est écrit.

### 06-C2 (C/E) — `Effect.unlock_lesson` : jamais défini, jamais utilisé

Le type figure dans trois documents normatifs (PRD L849, `CONTEXT.md` L44, ADR-0003 L12)
mais **aucun doc ne dit ce qu'il débloque ni ne l'utilise** : l'assignation est fixée à
l'écriture (pas de leçon à « débloquer » dynamiquement), l'ordre intra-zone est piloté par
`quest_step`/`advance_quest` sur `lessons-<zone_id>` (L326, L332), la disponibilité du
PNJ-leçon par ses `unlock_conditions`. Fossile probable d'un design antérieur → grill
(purger, ou définir un usage réel).

### 06-C3 (C) — npc-inventory : pas de format pour recevoir l'assignation des leçons

`content/npc-inventory.md` s'annonce comme le document où « assigner ensuite le type de
chaque PNJ » (L5-6), mais sa seule colonne d'assignation est « Type assigné » (vide). Pour
un PNJ-leçon, l'assignation actée au PRD comporte **trois données** que le doc n'a nulle part
où recevoir : le groupe de kanji (`kanji_ids[]`), le point de grammaire optionnel
(entrée Hanabira), et la **position dans l'ordre intra-zone** (`sequence_index` de la quête
`lessons-<zone_id>`). Sans format défini, chaque rédacteur inventera le sien.

### 06-C4 (C) — Résolution block vs leçon : aucun champ ne porte le check, et les PNJ-leçon `talk` n'ont pas de déclencheur de blocage

- PRD L326-328 : le PNJ-leçon ouvre l'écran-livre si « étape précédente atteinte », sinon
  résolution `block`. Mais **quel champ porte ce check ?** `unlock_conditions` gate la
  **présence** de l'entité (L849 : « un PNJ dont les conditions ne sont pas remplies n'existe
  simplement pas sur la carte ») — inutilisable ici, le PNJ bloquant doit être présent et
  visible. Le `sight_auto_result: block` (L847) attend lui aussi des `unlock_conditions`
  (« tant que ses unlock_conditions ne sont pas remplies ») — la même donnée avec une
  sémantique différente. Rien ne dit que le moteur dérive le check de
  `lessons.sequence_index` + `npc_quest_progress`.
- Cas non couvert : un PNJ-leçon de 3ᵉ catégorie recatégorisé depuis un PNJ ambiant
  `trigger_type: talk` **sans cône de vision** — le comportement de blocage décrit (repère le
  joueur « ! », marche vers lui, le repousse d'une case) est un comportement de vision. Sur
  un `talk` pur, que se passe-t-il (ligne de blocage simple sans repoussée ?) — non écrit,
  alors que la contrainte d'ordre « s'applique aussi à la 3ᵉ catégorie » (L326).

### 06-C5 (C, mineur) — Mini-quiz : modes et distracteurs pour des kanji pas encore dans `studiedSet`

PRD L300 : « même composant "carte de question" que les modes de combat ». Mais les modes de
combat piochent `studiedSet`/`encounteredGrammarIds` — au moment du quiz, les kanji de la
leçon n'y sont pas encore (`studiedSet` s'incrémente à la complétion, L347). Quels modes le
quiz utilise-t-il (Sens/Lecture sur les kanji du jour + Grammaire sur le point du jour ?) et
d'où viennent les distracteurs kanji (autres kanji de la leçon ? tirage global ?) — jamais
écrit. Les distracteurs grammaire, eux, existent (`example_variants[].distractors`).

### 06-D1 (D, MAJEUR — grill) — « Batch » : trois sens, et le slot 2 du menu START jamais défini

Le mot « batch » désigne selon le doc :
1. PRD L68 (menu START slot 2) : « **Batch de leçons** actif + historique » — un groupe de
   *leçons* ;
2. PRD L822 : `kanji_ids[]` = « le **batch de kanji** de cette leçon » — le groupe de *kanji*
   d'une leçon ;
3. `curriculum-checkpoints.md` L632/684 : « chaque **batch de leçon** » = une *leçon* tout
   court.

Le sens 1 — le seul visible par le joueur — n'est défini **nulle part** : qu'est-ce qu'un
« batch de leçons actif » (les leçons restantes de la zone courante ? les prochaines N ? les
non-complétées croisées ?), quelle taille, qui le compose ? C'est aussi ce que
`getLessonQueue` est censé afficher (voir 06-A2) — les deux findings se tranchent ensemble.
→ grill.

### 06-D2 (D — grill) — Anatomie de la double page et champs `lessons.content`/`lesson_type` jamais définis

- La séquence de pages est actée (pages kanji → page(s) grammaire → mini-quiz) mais **pas la
  répartition sur la double page paysage** (voir 06-A1) : un kanji occupe-t-il la double page
  entière (caractère+illustration à gauche, exemples à droite) ou une demi-page ?
- `lessons.content` (L822) : jamais défini. Les pages kanji sont-elles **générées** depuis les
  tables `kanji`/`sentences` via `kanji_ids[]` (auquel cas `content` est renommable/supprimable)
  ou rédigées à la main par leçon ?
- `lesson_type` (L822) : valeurs jamais énumérées (kanji-seule vs kanji+grammaire ?
  bootstrap ?). Fossile possible.
- Mineur, même zone de texte : « Texte en japonais calibré au tier de la zone » (L293) alors
  que les explications de grammaire Hanabira affichées sont en anglais — préciser que la
  calibration vise le contenu japonais (exemples, phrases), pas les explications.
→ grill.

### 06-D3 (D — grill rapide) — « Un seul kanji/grammaire fixé au moment de l'écriture » : lisible comme « un seul kanji par leçon »

PRD L324 : « un PNJ-leçon … porte **un seul kanji/grammaire fixé** au moment de l'écriture ».
À la lettre, contredit L306/L312-314 (une leçon porte **plusieurs** kanji — 4-5 en Johto,
8-12 en Kanto — et 0-1 point de grammaire). L'intention est « un contenu fixé, jamais choisi
au runtime » — reformuler.

### 06-D4 (D — grill rapide) — Étiquette anglaise à la leçon : § Leçons ne le dit pas (règle transverse 4)

Le mécanisme C (§ Langue du Jeu, L39) dit « le mot-clé anglais est **introduit à la leçon** ».
La description de la page kanji (L296) parle d'« illustration à côté du **sens** » sans
préciser la langue de ce sens. La règle transverse de l'audit demande que le § Leçons le dise
explicitement — une phrase à ajouter (le sens affiché sur la page kanji = le mot-clé anglais
du mécanisme C, celui que les modes de quiz réutiliseront pendant l'acquisition).

### 06-D5 (D — grill) — Budget kanji des phrases d'exemple de leçon : aucune règle

La règle dialogues (2 inconnus max/dialogue entier) et la règle textes (proportionnelle)
ne couvrent pas les phrases d'exemple des pages kanji. Questions ouvertes : les kanji **de la
leçon en cours** comptent-ils comme connus (ils viennent d'être présentés) ? Combien d'autres
inconnus tolère-t-on (0 ?) ? Même question pour les exemples Hanabira de la page grammaire,
qui sont des phrases figées du corpus — impossible à réécrire sans casser l'audio : une règle
de **sélection** (choisir l'example_variant le plus couvert par `studiedSet` théorique du
palier) plutôt que d'édition ? → grill.

### 06-D6 (D — grill rapide ou synthèse) — Bootstrap Fukuda : volume de la séquence d'onboarding non chiffré

PRD L322 : l'onboarding au dōjō « dispense directement une première séquence de leçons
structurées » pour atteindre ~30 kanji avant Cherrygrove (`curriculum` : new-bark-town 0–30).
Jamais chiffré : combien de leçons (30 kanji à 4-5/leçon ≈ 6-8 leçons), toutes obligatoires
d'un coup au jour 1 avant de quitter la ville, ou étalées (Route 29 est à 10–50, on peut
sortir avant 30) ? Impacte la première session SRS (~60 cartes le jour 2 si 30 kanji le
jour 1). Peut se trancher au grill en une phrase, ou se chiffrer à la synthèse avec les
budgets.

---

## Croisement findings-03 (SRS) — RAS

Le flux « nouvelles cartes » des leçons est déjà aligné sur les décisions de l'audit 03
(03-D3 : cartes dues le lendemain, `studiedSet` à la complétion) ; aucun couplage
batch-de-leçons ↔ file SRS n'existe ni n'est requis (pas de plafond quotidien — décision
conservée audit 01/03). Rien à retoucher de ce côté.

## Reporté à la synthèse (hors périmètre)

- `scripts/build/generate-etymology.py` : prompt encore en français (06-B3) — correction de
  code, pas de doc.
- 3 kanji sans audio dans `public/audio/kanji/` (06-B3) — passe contenu/data.
- Effet des zones réintégrées (audit 04) sur le volume de PNJ-leçon — déjà noté au PRD L330,
  chiffrage à la synthèse (audit 09).
- Sort des « 8-10 dresseurs SRS » de Route 29 — déjà reporté par l'audit 01, rappelé ici car
  il conditionne le nombre de PNJ-leçon disponibles avant Cherrygrove (06-D6).

## Questions D pour le grill *(toutes tranchées le 2026-07-07 — voir « Décisions du grill » en tête ; conservées ci-dessous pour trace)*

1. **(06-D1 + 06-A2)** Que montre exactement le menu START → Leçons (« batch actif »), et que
   liste `getLessonQueue` ? Définir le mot « batch » une fois pour toutes (ou le supprimer).
   → Carnet de leçons, batch purgé, `getLessonBook` (décision 1).
2. **(06-D2 + 06-A1)** Double page paysage : un kanji = la double page (contenu réparti
   gauche/droite) ou une demi-page ? `lessons.content` et `lesson_type` : définir ou purger.
   → 1 kanji = double page ; champs purgés (décisions 2-3).
3. **(06-C2)** `Effect.unlock_lesson` : purger (fossile) ou définir un usage réel ? → purgé.
4. **(06-C4)** Check d'ordre intra-zone → dérivé sequence_index/npc_quest_progress ;
   PNJ `talk` : blocage sans repoussée (décision 4).
5. **(06-C1)** Banque de phrases de blocage → fichier partagé par palier (décision 5).
6. **(06-B1/06-B2)** Exemples + illustrations → hybride Tango>IA+VOICEVOX ; emoji CLDR +
   photos Anki Core 2k pour Carte Mot (décisions 6-7, recherches web + inspection du deck local
   à l'appui).
7. **(06-D5)** Calibration → 0 inconnu + sélection Hanabira (décision 8).
8. **(06-C5)** Mini-quiz → 1 question/item, Sens/Lecture + Grammaire (décision 9).
9. **(06-D3/06-D4/06-D6)** Confirmations → oui aux trois (décision 10).
