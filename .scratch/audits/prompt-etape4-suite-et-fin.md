# Étape 4, suite et fin — corrections structurelles + production de tout le contenu restant

Lis ce fichier en entier avant de commencer. Il est issu d'une double revue du 2026-07-23
(game designer + professeur de japonais) menée sur les 36 zones écrites (536 fichiers,
5 linters verts). Verdict : la colonne vertébrale (carte, quêtes, combats, leçons, examens)
est cohérente et bien calibrée, MAIS deux problèmes structurels invalident partiellement le
contrat pédagogique, et la périphérie systémique (textes, téléphone, radio, keigo, snippets)
est presque vide. **Chaque zone écrite sous les règles actuelles augmente le coût de la
correction** — d'où l'ordre impératif des phases ci-dessous : on corrige d'abord, on produit
ensuite.

## Le projet, en une phrase

漢字の庭 (Kanji no Niwa) : un jeu qui reprend la structure de Pokémon HeartGold/SoulSilver
mais remplace les Pokémon par des kanji — on combat en répondant à des questions de japonais,
on apprend 2 136 kanji au lieu d'attraper des créatures. **Règle #1 : aucun Pokémon
n'apparaît jamais comme compagnon de combat** (`content/guidebook-adapted.md`).

## Documents de référence (ne pas réinventer, pointer)

- `content/content-writing-guide.md` — LA méthode par zone (sources, fichiers à produire,
  budget kanji, lesson_examples, auto-test). Ce prompt ne la duplique pas : il liste les
  **deltas** (§ Règles nouvelles) et le **plan**.
- `CONTEXT.md`, `docs/adr/000{1,2,3}*.md`, `PRD.md` — modèle de données et invariants.
- `.scratch/etape4-progress.md` — tableau de suivi à tenir à jour zone par zone.
- `content/japanese-books-mapping.md` — quel livre pour quel palier
  (`scripts/build/render-book-pages.py` pour les lire).
- Revues sources de ce prompt : rapports du 2026-07-23 (résumés intégralement ici — les
  findings ci-dessous ont tous été vérifiés à la main sur les fichiers cités).

## Ordre impératif des phases

0. Corrections mécaniques + contrat contenu↔moteur + extension des linters
1. Décision curriculum : promotion du noyau N5/N4 dans l'ordre des kanji
2. Re-kanjification des dialogues/textes existants + linter de densité
3. Les 12 zones restantes (lots 14 → 18)
4. Passe textes secondaires + recalibrage et câblage des seuils CS-Kanji
5. Systèmes périphériques (appels, radio, keigo, reading_snippets, achievements, overlays early)
6. QA finale + notes de spec pour l'équipe code

Commit + push à la fin de chaque phase (et par lot en phase 3), message au format des lots
précédents. Après chaque phase : les 5 linters de `scripts/validate/` + mise à jour de
`.scratch/etape4-progress.md`.

---

## Phase 0 — corrections mécaniques (une journée, tout est localisé)

Chaque item a été vérifié en revue ; re-vérifie l'état actuel du fichier avant d'éditer.

**0.1 — Simularbre Route 36 inlevable (bloquant, chemin critique).**
`content/map/obstacles.json`, obstacle `sudowoodo_route36` : exige `item_owned:
sprinkler_floria`, item qui n'existe nulle part. Le donneur
`content/dialogues/npcs/goldenrod-city/floria_goldenrod.json` accorde `squirtbottle`.
→ Corriger l'obstacle en `squirtbottle`.

**0.2 — Deux trocs donnent la récompense sans contrepartie.**
Anti-pattern : l'état par défaut porte les Effects du troc.
- `content/dialogues/npcs/route-24-25-kanto/bill_grandpa_r2425.json` : le `default → welcome`
  porte `remove_item(hoenn_stone)` + `grant_item(evolution_stone)`. → Ajouter un état
  d'attente ; la règle du troc devient `item_owned(hoenn_stone) → welcome`, le default ne
  porte plus aucun Effect.
- `content/dialogues/npcs/route-6-kanto/underground_trader_r6.json` : même structure sur le
  troc RageCandyBar↔CT. → Même correction, gate `item_owned` sur l'id exact de la
  RageCandyBar (vérifier dans `content/rom-item-roster.json`).

**0.3 — Quêtes : ids et clôtures.**
- `content/quests/suicune_hunt.json` : `zone_ids` contient `route-25-kanto` (id inexistant —
  le bon est `route-24-25-kanto`, déjà utilisé par le step final) → corriger. Il contient
  aussi `route-14-15-kanto` pour une « 1ère apparition à pied » annoncée en `_note` mais
  absente de `steps[]`, alors que la quête est close. → **Décision actée : retirer
  route-14-15-kanto des `zone_ids` et de la note** ; l'apparition deviendra une scène
  d'ambiance (PNJ/event sans step) quand la zone sera écrite en phase 3 — on n'insère pas de
  step au milieu d'une quête terminée.
- `content/quests/bill_family_thread.json` : la quête s'arrête à `doll_received`
  (Doublonville) alors que le payoff est le grand-père de la Route 25 (déjà écrit,
  standalone). → Ajouter un step final `grandpa_met` + `advance_quest` dans le dialogue du
  grand-père, pour que l'Adventure Journal ne montre pas le fil clos avant son payoff.
- `content/quests/lighthouse_amphy.json` : step `potion_obtained` défini mais jamais posé ni
  lu (vestige) → le supprimer.

**0.4 — Sémantique `unlock_text` : un seul mécanisme (décision actée).**
Deux mécanismes concurrents lient un texte à son déclencheur : l'Effect `unlock_text`
(4 usages) et les champs `npc_ref`/`found_object_ref`/`event_ref` côté fichier texte.
→ **Règle unique désormais : `unlock_text` est LE gate ; `npc_ref`/`found_object_ref`
restent des métadonnées de présentation** (le « qui le porte » grisé du Reading Journal).
Ajouter l'Effect `unlock_text` manquant chez les donneurs des 5 textes CS qui n'en ont pas
(cs_tobu, cs_mizu, cs_taki, cs_uzu, cs_chikara) et chez tout autre texte déclenché
uniquement par ref (dont `content/texts/ilex-forest/forest_shrine.json`, aujourd'hui gaté
par `event_ref` seul → son unlock_text est émis par l'event du moteur, à consigner en 0.5).

**0.5 — Contrat contenu↔moteur (nouveau document, bloquant pour l'équipe code).**
Créer `content/engine-contract.md` listant exhaustivement :
- les `event_cleared` consommés par le contenu mais émis par le moteur, avec leur condition
  d'émission : `misty_met_viewpoint` (7 consommateurs dans `content/map/`),
  `ice_path_puzzle_solved`, `sayo_freed_ice_path`, `birds_guided_ilex` — grep tout
  `event_cleared` pour clore la liste ;
- les quest steps à producteur moteur : `content/quests/moomoo_recovery.json` steps
  `fed_1…fed_6`/`healed` (avancés par la mécanique multi-jours, pas par un Effect) — grep
  tout `quest_step` consommé vs `advance_quest` posés pour trouver les autres ;
- les mécaniques différées à l'implémentation (liste consolidée en fin de ce prompt).

**0.6 — Étendre les linters (les trous ci-dessus étaient invisibles).**
Dans `scripts/validate/lint-cross-refs.py` (ou un nouveau linter) :
- tout `item_owned`/`grant_item`/`remove_item` référence un item_id existant
  (`rom-item-roster.json` + items créés par le contenu — construire l'index) ;
- tout `event_cleared` consommé figure dans `content/engine-contract.md` ;
- tout `quest_step` consommé est soit posé par un `advance_quest`, soit listé au contrat ;
- aucun état default ne porte de `remove_item` (le pattern 0.2) ;
- `correct_index` : détecter l'uniformité (voir 2.4).

**0.7 — Toilettage doc.** `CONTEXT.md` § Effect : ajouter `grant_badge` (11 usages, au PRD
depuis le 2026-07-10) ; marquer `unlock_zone` comme inutilisé (0 usage — le retirer du
modèle si l'équipe code confirme). Ajouter au tableau de suivi les 8 zones à placements sans
dialogues (cerulean-cave, cinnabar-island, route-19-20-seafoam, routes 21/22/5/7,
whirl-islands) comme sous-parties de leur lot pour qu'elles ne tombent pas entre deux lots.
Expliciter le cas des Chutes de Tohjo (route-27) : aucun obstacle enregistré alors que HGSS
exige 水+滝 — ajouter l'obstacle dans `content/map/obstacles.json` (gates `cs_mizu` +
`cs_taki`), c'est le chemin critique Johto→Kanto.

---

## Phase 1 — curriculum : promouvoir le noyau N5/N4 (décision de design, à faire AVANT toute nouvelle zone)

**Le problème (mesuré) :** dans `content/kanji-zone-assignment.json`, l'ordre « par
composants » place 本 en position 561, 学 559, 時 1369, 年 1362, 校 1363, 何 1990 — pendant
que 彙 (513), 鬱 (544) et 朕 (1166) passent avant. Un joueur qui a bouclé Johto ne sait
toujours pas lire 日本語, 学校, 時間 ni 何. C'est la cause racine du tout-kana (phase 2) :
les rédacteurs ne PEUVENT pas écrire 時 ou 年 sans crever le budget, dans un jeu qui parle
constamment d'heures et de jours (time_window, frères/sœurs du jour…). Les étiquettes JLPT
des zones sont fictives côté kanji.

**La correction (promotion ciblée, pas de refonte totale) :**
1. Construire la liste des **~150 kanji « noyau »** : intersection (N5 ∪ N4 fréquents) ×
   (utiles aux dialogues du jeu : temps, école, lecture, achat, direction, nombres,
   famille…). Sources : `content/jlpt-language-syllabus.md`, listes JLPT de
   `data/`/`scripts/sources/`. Proposer la liste dans un fichier
   `content/kanji-core-promotion.json` avec, pour chaque promu, sa position actuelle et sa
   position cible (< 300).
2. **Échanger par paires à taille constante** : chaque promu prend la place d'un kanji rare
   de même position (彙, 鬱, 朕, et autres hors-N2/N1-utile des 300 premières positions),
   qui recule à la position libérée. Les pools de zone gardent leur taille — le comptage
   figé (`lessons-proposal.json`) reste valide en volume.
3. Répercuter : `kanji-zone-assignment.json` (ordre), `lessons-proposal.json` +
   `content/lessons/<zone>.json` des zones écrites concernées (les `kanji_ids[]` échangés),
   `src/data/kanji-content.json` (écrire les `lesson_examples[]` des promus dans leurs
   nouvelles zones ; les exemples des rétrogradés suivent leur kanji). L'ordre par
   composants reste le squelette : si un promu a un composant enseigné après sa position
   cible, soit promouvoir aussi le composant, soit accepter l'exception et l'enseigner avec
   deux exemples de plus (décomposition montrée dans la leçon) — documenter chaque exception
   dans `kanji-core-promotion.json`.
4. Écrire un script `scripts/build/apply-core-promotion.py` qui applique l'échange et un
   rapport de contrôle (aucun kanji perdu/dupliqué, tailles de pools inchangées).
5. Mettre à jour les leçons déjà écrites des zones touchées (le texte de la double-page :
   identité + exemples du nouveau kanji). C'est le gros du coût — le limiter en choisissant
   les rétrogradés parmi les kanji dont la leçon est la plus courte.

Toute la suite (phases 2-5) s'écrit avec l'ordre corrigé.

---

## Phase 2 — re-kanjification : le jeu doit faire LIRE les kanji qu'il enseigne

**Le problème (mesuré) :** 0,17 % de kanji dans les dialogues (50 occurrences, 33 kanji
distincts sur 2 136 enseignés, sur ~30 000 caractères) ; 0 % à Blackthorn, Safran, Azuria.
Misty (11ᵉ examen, ~1 350 kanji étudiés) dit 「まけたわ。でも　いい　しょうぶだった！」
alors que 負/勝/勝負 sont étudiés depuis longtemps. Le parchemin « archaïsant N2 »
`content/texts/dragons-den/successor_scroll.json` n'a aucun kanji (けいしょうしゃ est PLUS
dur à parser que 継承者（けいしょうしゃ）). Le Kanji Budget plafonne les inconnus mais rien
n'impose un plancher de connus — l'écriture a convergé vers le zéro kanji, et le tout-kana
crée même des ambiguïtés réelles (`real_director_goldenrod.json` : 「とうに　いる」 se lit
« depuis longtemps » au lieu de 塔に « dans la tour »).

**La règle nouvelle (à écrire noir sur blanc dans `content/content-writing-guide.md`) :**
> Tout mot dont TOUS les kanji sont dans le studiedSet du point de progression s'écrit en
> kanji, avec sa lecture inline (le bouton Y couvre la révélation). Cible : ≥ 15-20 % des
> mots kanjifiables-connus effectivement écrits en kanji par dialogue — en pratique,
> kanjifier partout où c'est naturel, le budget d'inconnus (2/dialogue) reste inchangé.

**La passe :**
1. Script `scripts/build/rekanjify-report.py` : pour chaque dialogue/texte, calcule le
   studiedSet réel de sa zone (ordre corrigé de la phase 1, depuis les zones réellement
   antérieures dans `NARRATIVE_ORDER` de `calc-cs-corpus.py` — PAS `cumulative_start`
   aveugle, piège documenté), liste les mots kana qui pourraient être kanjifiés (croiser
   avec le lexique yomitan importé). Le script RAPPORTE, l'édition reste manuelle (choisir
   la forme naturelle, poser la lecture inline par run ADR-0002).
2. Traiter les 36 zones dans l'ordre narratif. Priorité : textes (`content/texts/`) et
   dialogues des zones N3+ (là où le studiedSet est riche), puis remonter vers le début.
3. Nouveau linter `scripts/validate/lint-kanji-density.py` : plancher de densité par
   fichier (seuil paramétré, échoue sous ~10 % des mots kanjifiables-connus), pour que la
   dérive ne revienne jamais.

**2.4 — Corrections linguistiques ponctuelles relevées en revue** (toutes dans
`src/data/kanji-content.json` sauf mention) :
- **466 `lesson_examples` découpent la lecture par caractère** (学（がっ）校（こう）) au lieu
  du run ADR-0002 (学校（がっこう）) — les fichiers `content/` sont conformes, seul
  kanji-content.json dévie. → Script de fusion des runs contigus + règle dans
  `lint-kanji-budget.py`.
- **Champ `examples[]` (dataset brut, distinct de `lesson_examples`)** : 181 lectures
  tronquées ou vides (調子に乗る → "", 段ボール → だんぼ, 怒り → いか), doublons, idiomes
  N1 sur des fiches N5 (猫に小判 sur 小). → **Décision actée : ne pas afficher `examples[]`
  en leçon** (les `lesson_examples` rédigés suffisent) ; le nettoyer plus tard hors chemin
  critique.
- **Keywords bruités** : 校 a `meanings[0] = "exam"`, 拉 « Latin »… → Ajouter un champ
  `keyword` éditorialisé (l'anglais affiché sur la double-page), au fil des zones pour les
  kanji restants, en batch pour les fiches déjà en jeu.
- Entrée 拉 : remplacer la phrase agrammaticale par 「拉麺（ラーメン）を　たべに　いきませんか。」 ;
  entrée 弔 : 「弔問（ちょうもん）に　いく。」.
- `content/gabarits/keigo-session-example.json` : lectures inline manquantes (読 nu) —
  corriger le gabarit avant de produire les sessions (phase 5).
- `content/grammar/saffron-city.json` N1-038 : distracteur ということだ défendable dans le
  trou → remplacer (ex. というまでだ) ; exemple Hanabira N1-042 ときたら sémantiquement
  incohérent → l'écarter avec note, comme le précédent N3-006 documenté.
- **`correct_index: 0` sur 72/72 questions de textes** : randomiser les index existants
  (script) + linter d'uniformité (0.6) + noter dans `content/engine-contract.md` que
  l'affichage DOIT mélanger les choix.

---

## Phase 3 — les 12 zones restantes (lots 14 → 18)

Méthode inchangée : `content/content-writing-guide.md` intégralement (sources → dialogues →
lessons → lesson_examples → textes → carte → linters), PLUS les règles nouvelles (densité
kanji, keyword éditorialisé, overlay grammaire ordonné — voir § Règles nouvelles). Comptages
par zone : tableau de `.scratch/etape4-progress.md` (figés, ne pas recomposer). Étendre
`NARRATIVE_ORDER` de `calc-cs-corpus.py` à chaque zone.

**Calibrage livres (Kanto N2→N1)** : Shin Kanzen Master N2 読解+語彙 pour Céladon→Parmanie ;
N1 文法+読解 à partir de la Grotte Diglett ; Mont Gris = N1 dur (`texts-progressifs.md` :
Aozora brut, chapitre manga pour Red, lettre finale du mentor). **SKM N2 文法 manque à la
bibliothèque** (seul trou d'acquisition, `japanese-books-mapping.md`) — à défaut, séquencer
la grammaire N2 sur le syllabus + Hanabira, comme fait jusqu'ici.

**Anti-mur de leçons (règle nouvelle, issue des deux revues)** : Carmin 30 leçons/180 kanji
au même endroit est déjà un pic assumé ; Céladon 25, Parmanie 22, Argenta 20 suivent le même
pattern. Sans toucher aux pools (figés) : répartir les leçons de chaque grande ville sur des
**sous-lieux narratifs distincts** (Céladon : étages du grand magasin, restaurant, Game
Corner, appartement du toit… — tous sourcés guidebook), entrelacer quêtes/textes/combats
entre les blocs de leçons, et jamais plus de ~8 leçons portées par le même PNJ sans beat
narratif intercalé. Signaler dans le suivi tout endroit où c'est impossible.

- **Lot 14 — celadon-city (25 leçons/150 kanji/6 PNJ, Erika 83q 試練) +
  route-16-17-18-cycling-road (4/20/1)** : PNJ « mot à la mode par jour » de la piste
  cyclable (side-content C6 — le gabarit le plus proche d'une leçon quotidienne),
  photographe Cameron (C2). Textes de zone au fil (phase 4 anticipée).
- **Lot 15 — fuchsia-city (22/130/4, Janine 86q) + route-14-15-kanto (4/20/1) +
  route-11-12-13-diglett (3/15/3)** : fille des hautes herbes (F11), scène d'ambiance
  Suicune à pied (ex-step retiré en 0.3 — ambiance seulement), Safari déjà amorcé (Baoba).
- **Lot 16 — pewter-city (20/115/2, Brock 89q) + mont-lune-route-3-4 (4/20/1, lore
  météorites A12) + route-2-foret-viridian (3/15/1)**.
- **Lot 17 — viridian-city (2/10/1, **Blue 98q** — borne haute sourcée PRD) + route-1-kanto
  (2/10/1) + pallet-town (3/15/1 : Daisy C4 toilettage 7 visites → contact Blue
  post-16-badges, mère de Red D8, mail du PC d'Oak A14) + routes 21/22 (sous-parties)**.
- **Lot 18 — mt-silver-route-28 (14/80/1) + sous-parties** : **CS 登** (dernier CS, seuil
  N=60 — voir phase 4), idole retraitée F10 (TM47 contre silence), **Grunt Solitaire F23**
  (dialogue N2 sans combat, « l'obstacle le plus mélancolique du jeu »), **Red** (longueur
  d'examen : vérifier la table PRD § Gyms ; si absente, interpoler au-delà de Blue — ex.
  100q — et documenter). Blaine 93q : gym relocalisé (E6, classes de Seafoam) — vérifier
  l'emplacement exact dans `guidebook-adapted.md` et le rattacher au lot cohérent
  (cinnabar/seafoam en sous-partie du lot 15 ou 18 selon l'ordre de visite du guide).

---

## Phase 4 — textes secondaires + CS-Kanji (les deux vont ensemble)

**Le problème (bloquant si codé tel quel)** : le PRD gate chaque CS-Kanji sur
`count(texts_read, N)` (砕6 · 切12 · 水20 · 飛26 · 力29 · 渦32 · 滝35 · 登60, table dans
`scripts/validate/calc-cs-corpus.py`) mais (a) AUCUN des 7 donneurs écrits ne porte cette
condition (vérifié un par un : ils gatent badge/quest_step/item/rien), et (b) avec 17-18
textes écrits sur ~85-115, les seuils sont insatisfiables (砕 exige 6 quand 4 existent à ce
stade ; appliqué tel quel, blocage à la Route 36, 7ᵉ zone).

1. **Écrire les textes restants** (~68-97). Vivier : `content/side-content-inventory.md`
   (§ A « tout trouvés » en priorité, puis PNJ-texte), sources par palier :
   `content/texts-progressifs.md` § Sources + recueils de la bibliothèque (You Can Read
   Japanese!, Tuttle, JSS — vetting 12bis, jamais verbatim). Respecter le budget
   proportionnel (~2 inconnus/100 caractères, plafond 10), la densité de kanji connus
   (phase 2), la variété des 6 types de question, et des `correct_index` variés. Répartir
   sur toutes les zones (la colonne T du tableau de suivi est presque vide côté Kanto).
2. **Recalibrer les seuils** : une fois le corpus final posé, recalculer N par CS =
   ~50-60 % du corpus atteignable au point du donneur (règle actée,
   `side-content-inventory.md` § Règles 3), via `calc-cs-corpus.py`. Mettre à jour la table
   du PRD et du linter.
3. **Câbler le gate (décision actée)** : la condition `count(texts_read, N)` vit dans les
   `state_rules` du donneur (le modèle Condition la supporte déjà) — état « pas encore
   prêt » par défaut, état de remise gaté par le seuil (+ conditions narratives existantes
   conservées). Faire les 7 donneurs écrits + le donneur de 登 (lot 18). Le moteur n'a
   ainsi rien à deviner.

---

## Phase 5 — systèmes périphériques (specs validées, données vides)

Chacun a un gabarit validé dans `content/gabarits/` — corriger d'abord le gabarit keigo
(2.4). Tout contenu suit budget kanji + lectures inline + densité.

1. **Appels téléphoniques (Instant Response)** : `content/phone-registry.json` annonce
   **75 correspondants, 1 seul écrit** (`content/dialogues/calls/joey_route30.json`, qui
   sert de gabarit). Priorité aux **12 appels `story`** — dont l'appel quotidien du mentor
   Elm, pilier de la boucle quotidienne du PRD — puis les correspondants par zone au fil
   des paliers. Format : `pages[]` avec entrées `kind: "instant_response"` (CONTEXT.md).
2. **Émissions radio d'Oak (Radio Library)** : 0 épisode (les fichiers « radio » existants
   sont l'arc Tour Radio, pas des émissions). Définir la grille depuis le PRD § Radio (une
   émission par palier de progression, mêmes sémantiques que les textes : ???/rejouable/or),
   produire sur `content/gabarits/radio-show-example.json`.
3. **Keigo Salon** : 2 jeux de sessions — Fan Club de Carmin (~5 situations N4→N3) et Silph
   Safran (avancé, piège 二重敬語). Le président du Fan Club est écrit en PNJ-leçon
   classique (`fanclub_president_vermilion.json`) : lui ajouter l'entrée vers la session
   (item collectible en `grant_item` idempotent = marqueur « session faite », CONTEXT.md).
4. **Pool `reading_snippets` (modes M18-M23)** : 0 entrée — livrable déjà promis de cette
   passe (`.scratch/etape4-progress.md` décision 5, spec
   `.scratch/combat-modes-spec-proposal.md` : ≤200-300字, gradés JLPT, sous-types
   connecteur/duel A-B…). Adapter des livres du palier (vetting 12bis). Cibler d'abord les
   besoins des Boss/examens listés dans la spec (tableau des fréquences par mode).
5. **Achievements / milestones** : spec PRD détaillée (streak 365, Ruban de Légende…), 0
   fichier de données → créer `content/achievements.json` conforme à la spec.
6. **Overlays grammaire des 11 zones early** (l'arc tutoriel entier : route-29, route-30,
   route-31, cherrygrove, violet-city, sprout-tower, route-32, ruins-of-alph, azalea,
   ilex-forest, route-36) : écrits aux Lots 1-2 avant l'adoption du système, alors que
   `grammar-zone-assignment.json` leur assigne des points. Produire
   `content/grammar/<zone>.json` (spec `content/grammar-wiring-spec.md`). **Règle
   nouvelle** : à l'intérieur de l'assignation d'une zone, ordonner les points selon la
   progression pédagogique du syllabus (`jlpt-language-syllabus.md`) et non l'index brut du
   fichier Hanabira — la revue a montré que new-bark enchaîne 6 quasi-synonymes de
   « mais/alors » avant です/は/が. L'assignation par zone est figée, l'ORDRE intra-zone est
   libre ; corpus Hanabira figé : phrases exactes, jamais réécrites (leçon du Lot 11).

---

## Phase 6 — QA finale + notes de spec pour l'équipe code

1. Les 5 linters + les nouveaux (densité, item_id/event_id, correct_index, groupement) sur
   tout le corpus. Vérifications manuelles du guide § 6 (noms d'espèces, lesson_examples
   complets, variété des questions).
2. Ajouter à `content/engine-contract.md` les décisions de spec issues des revues, pour que
   l'équipe code les voie :
   - **Examens ≥ 70 questions : reprise par section en cas d'échec** (jamais « tout
     refaire » — Blue 98q ≈ 45-60 min ; le format mini-JLPT à sections existe déjà, la
     politique d'échec doit le suivre) ;
   - mélange obligatoire des choix de QCM à l'affichage ;
   - liste des différés à l'implémentation : déclenchement Raikou (45q)/Entei (52q),
     barèmes Pokéathlon (gate réel de Chuck `pokeathlon_score ≥ 250`), Concours du Parc
     (mar/jeu/sam), Safari adapté, Kanji Flip/Game Corner, horaires Magnet Train/SS Aqua,
     mécanique CS 登 au Mont Argenté, modes M13/M14 (2ᵉ vague), sprites des 2 compagnons
     TBD (`content/companions.json` `tbd_2`/`tbd_3`, dump HGSS à vérifier — roadmap 5.5) ;
   - recommandation de playtest : rythme du mur de leçons Kanto (Carmin 30) sur la
     verticale, AVANT d'ajuster quoi que ce soit aux pools.
3. Mettre à jour `.scratch/etape4-progress.md` (tableau complet, section par lot) et
   `.scratch/audits/roadmap-pre-code.md` § Étape 4.

---

## Règles nouvelles — récapitulatif (deltas vs content-writing-guide.md, à y reporter en phase 0)

1. **Plancher de kanji connus** : tout mot entièrement couvert par le studiedSet s'écrit en
   kanji + lecture inline ; cible ≥ 15-20 % des mots kanjifiables (linter
   `lint-kanji-density.py`). Le budget d'INCONNUS reste : 2/dialogue, ~2/100 car. plafond
   10 pour les textes.
2. **Groupement des lectures par run de kanji** (学校（がっこう）), jamais par caractère —
   partout, y compris `lesson_examples`.
3. **`keyword` éditorialisé** sur chaque fiche kanji affichée (jamais `meanings[0]` brut) ;
   `examples[]` du dataset non affiché en leçon.
4. **`correct_index` varié** à l'écriture ; le mélange à l'affichage est en plus.
5. **Ordre intra-zone des overlays grammaire** : pédagogique (syllabus), pas l'index
   Hanabira ; phrases du corpus figées.
6. **Sous-lieux narratifs** dans les villes ≥ 15 leçons ; ≤ 8 leçons par PNJ sans beat
   intercalé.
7. **Aucun état default ne porte les Effects d'un troc** ; tout troc a un état d'attente
   gaté `item_owned`.
8. **`unlock_text` est le seul gate des textes** ; `npc_ref`/`found_object_ref` =
   présentation.
9. **CS-Kanji** : la condition `count(texts_read, N)` vit chez le donneur ; N recalibré sur
   le corpus final (~50-60 % de l'atteignable).
10. Toujours en vigueur : règle #1 (zéro Pokémon compagnon), zéro PNJ inventé, lectures
    inline ADR-0002, comptages figés, registres différenciés (c'est un point fort relevé —
    Silver おれ/おまえ, capitaine わし/じゃ, Misty わ/わね : maintenir ce niveau, y compris
    les idiolectes canon comme la syntaxe inversée d'Earl, perdue dans la version actuelle
    de `earl_violet_city.json` — à restaurer au passage de la phase 2).

## En terminant chaque session de travail

Commit + push par lot/phase, tableau de suivi à jour, et une section de journal au format
des lots précédents dans `.scratch/etape4-progress.md` (zones couvertes, fichiers, kanji
dotés d'exemples, vraies erreurs trouvées, simplifications assumées). Ne touche à rien hors
du périmètre décrit ici.
