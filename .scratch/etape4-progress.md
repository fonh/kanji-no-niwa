# Suivi Étape 4 — Passe contenu industrielle (漢字の庭)

Fichier de trace créé 2026-07-17 à la demande de l'utilisateur (« un fichier pour garder
une trace à chaque étape »). Une ligne par zone de croissance. **Le comptage
(leçons/kanji/PNJ) est déjà figé** en amont — ce document ne le recalcule pas, il suit
l'avancement de la *rédaction* de chaque zone.

**Phase 2 (re-kanjification) : voir `.scratch/etape4-rekanjify-zone-plan.md`** pour
l'ordre de priorité réel par zone (studiedSet décroissant, mesuré avec
`lint-kanji-density.py`) et l'auto-évaluation programmeur/prof/game designer du
2026-07-24 — ce journal reste le compte-rendu chronologique, le plan de zone est la
référence pour « que faire ensuite ».

## Sources du comptage (ne pas recompter, lire)
- `content/kanji-zone-assignment.json` — 2136 kanji ordonnés, 83 zones
- `content/lessons-proposal.json` — 344 leçons / 48 zones / 1950 kanji, taille par leçon
- `content/npc-inventory.md` — PNJ par zone + colonne Type assigné (136 combat / 117 leçon / 88 ambiant)
- `content/side-content-inventory.md` — vivier des ~80-110 textes secondaires

## Décisions d'exécution (validées 2026-07-17, amendées 2026-07-21)
1. **Séquentiel, 1 session** — pas de multi-agents parallèles (fichiers partagés kanji-content.json / npc-inventory.md).
2. **Textes au fil de chaque zone** — chaque zone sourcée reçoit son texte dans son propre passage.
3. ~~Point de contrôle après chaque zone~~ — **levé 2026-07-21** (demande utilisateur « finis tout le contenu ») : passe continue, commit + push par lot de zones.
4. **Overlay grammaire au fil de chaque zone** (`content/grammar/<zone>.json`, spec `content/grammar-wiring-spec.md`, pilote New Bark validé) — même passage que les leçons de la zone.
5. **Pool `reading_snippets` (modes lecture M18-M23, adoptés 2026-07-21)** — passages adaptés des livres au fil des paliers, livrable de cette passe (voir roadmap Lot 0).

## Méthode par zone (cf. `content/content-writing-guide.md`)
1. Lire sources : npc-inventory → guidebook-adapted → placements → lessons-proposal → rom-trainer-roster → livres (calibrage)
2. Écrire dialogues PNJ (`content/dialogues/npcs/<zone>/`) + dresseurs (`.../trainers/<zone>/`)
3. `content/lessons/<zone>.json` (copie depuis lessons-proposal, jamais réordonner)
4. `lesson_examples[]` réels pour chaque kanji de la zone dans `src/data/kanji-content.json`
5. Texte(s) sourcé(s) si listé(s) dans side-content-inventory
6. Enregistrer dans `content/map/npcs.json` / `trainers.json` / `obstacles.json`
7. Auto-test : 4 linters `scripts/validate/` + vérifs manuelles (espèces Pokémon, présence lesson_examples, variété types de question)

## Avancement global
- Zones : **36 / 48** écrites
- Leçons : **238 / 344** écrites
- Kanji dotés d'exemples : **1350 / 1950**
- Overlays grammaire : **25 / 48**
- Textes : **17 écrits** (7 CS remis, reste 登 au Mont Gris)

### Journal
- **2026-07-24 — Phase 2, ruins-of-alph (3/3 fichiers) re-kanjifié.** Kanji
  ajoutés : 考/心. 1 fichier (young_man) reste à 0% densité, vérifié sans
  amélioration sûre possible. Audit `cumulative_start` : CLEAN. 7 linters
  verts. Reste dans le Tier 5 : route-32 (14), sprout-tower (3), violet-city
  (11), route-31 (3), route-30 (6), cherrygrove-city (5), route-29 (2),
  new-bark-town (6).
- **2026-07-24 — Phase 2, route-33 (1/1 fichier) re-kanjifié.** Kanji
  ajouté : 通. Audit `cumulative_start` : CLEAN. 7 linters verts, 0 WARN
  densité restant sur la zone. Reste dans le Tier 5 : ruins-of-alph (3),
  route-32 (14), sprout-tower (3), violet-city (11), route-31 (3),
  route-30 (6), cherrygrove-city (5), route-29 (2), new-bark-town (6).
- **2026-07-24 — Phase 2, union-cave (12/12 fichiers) re-kanjifié.** Kanji
  ajoutés : 通/長/火/山. Règle tout-ou-rien confirmée sur de nombreux
  candidats hors studiedSet (どうくつ/おく/れんしゅう/ほんき/いき/ほのお/
  くらい/かいそう/しま/つぎ/かつ/まもる/みごと/あつめ etc.). 5 fichiers
  restent à 0% densité, vérifiés sans amélioration sûre possible. Audit
  `cumulative_start` : CLEAN du premier coup. 7 linters verts (536 fichiers
  dialogue, 480 fichiers état, 36 fichiers leçons, mêmes 3 WARN attendus, 0
  FAIL). Reste dans le Tier 5 : route-33 (1), ruins-of-alph (3), route-32
  (14), sprout-tower (3), violet-city (11), route-31 (3), route-30 (6),
  cherrygrove-city (5), route-29 (2), new-bark-town (6).
- **2026-07-24 — Phase 2, azalea-town (10/10 fichiers) re-kanjifié.** Kanji
  ajoutés : 鳥/入り口/作/一日/先/通/人/実力/二人. Deux kanji « hors
  studiedSet » confirmés comme des exceptions documentées, pas des bugs :
  `charcoal_man_azalea.json` (切, le CS-kanji lui-même remis à cet instant
  précis de la scène) et `silver_apparition2_azalea.json` (強, kanji
  signature de Silver documenté dans le fichier — hors curriculum normal
  par design). Règle tout-ou-rien confirmée sur でし/もり/ほんとうに/きみ/
  かんしゃ etc. 3 fichiers restent à 0% densité, vérifiés sans amélioration
  sûre possible. Audit `cumulative_start` : CLEAN (hors les 2 exceptions
  documentées). 7 linters verts (536 fichiers dialogue, 480 fichiers état,
  36 fichiers leçons, mêmes 3 WARN attendus, 0 FAIL). Reste dans le Tier 5 :
  union-cave (12), route-33 (1), ruins-of-alph (3), route-32 (14),
  sprout-tower (3), violet-city (11), route-31 (3), route-30 (6),
  cherrygrove-city (5), route-29 (2), new-bark-town (6).
- **2026-07-24 — Phase 2, slowpoke-well (5/5 fichiers) re-kanjifié.** Kanji
  ajoutés : 先/通. Règle tout-ou-rien confirmée sur de nombreux candidats
  hors studiedSet à ce stade précoce (こし/めいれい/うごいて/しごとば/こども
  etc.). 3 fichiers restent à 0% densité, vérifiés sans amélioration sûre
  possible. Audit `cumulative_start` : CLEAN du premier coup. 7 linters
  verts (536 fichiers dialogue, 480 fichiers état, 36 fichiers leçons,
  mêmes 3 WARN attendus, 0 FAIL). Reste dans le Tier 5 : azalea-town (10),
  union-cave (12), route-33 (1), ruins-of-alph (3), route-32 (14),
  sprout-tower (3), violet-city (11), route-31 (3), route-30 (6),
  cherrygrove-city (5), route-29 (2), new-bark-town (6).
- **2026-07-24 — Phase 2, route-34 (10/10 fichiers) re-kanjifié.** Kanji
  ajoutés : 世話/湖/二人/前/夜/夜道/気/目. Règle tout-ou-rien confirmée sur
  de nombreux candidats hors studiedSet (たび/とちゅう/つかれた/たおした/
  つぎ/あいて/あね/ぶんまで/みごと/しぜん/じまん/みまわり/あるいて/たしかめ
  等). 3 fichiers (ace_trainer_irene/kate/pokefan_brandon) restent à 0%
  densité, vérifiés sans amélioration sûre possible. Audit
  `cumulative_start` : CLEAN du premier coup. 7 linters verts (536 fichiers
  dialogue, 480 fichiers état, 36 fichiers leçons, mêmes 3 WARN attendus, 0
  FAIL). Densité globale 129→124 fichiers sous le plancher. Reste dans le
  Tier 5 : slowpoke-well (5), azalea-town (10), union-cave (12), route-33
  (1), ruins-of-alph (3), route-32 (14), sprout-tower (3), violet-city
  (11), route-31 (3), route-30 (6), cherrygrove-city (5), route-29 (2),
  new-bark-town (6).
- **2026-07-24 — Phase 2, goldenrod-city session C (Gym/dresseurs divers,
  10/10 fichiers) re-kanjifié — ZONE ENTIÈREMENT CLOSE** (3 sous-sessions,
  50 fichiers au total). Kanji ajoutés : 気/前/通/進/実/道/毎日. Règle
  tout-ou-rien confirmée sur de nombreux candidats (ほんばん/うつくしく/
  おたから/しごと/ちかどう/けいさんずみ/だいじょうぶ/ほんとう etc.). Audit
  `cumulative_start` : CLEAN du premier coup. 7 linters verts (536 fichiers
  dialogue, 480 fichiers état, 36 fichiers leçons, mêmes 3 WARN attendus, 0
  FAIL). Densité globale 141→129 fichiers sous le plancher (sur les 3
  sessions de la zone combinées). **goldenrod-city (50 fichiers, le plus
  gros du corpus) est maintenant intégralement re-kanjifié**, traité en 3
  sessions par sous-lieu (PNJ de ville / Tour Radio-arc Rocket / Gym-
  dresseurs) sans jamais les mélanger, comme prévu par le plan. Reste dans
  le Tier 5 : route-34 (10), slowpoke-well (5), azalea-town (10),
  union-cave (12), route-33 (1), ruins-of-alph (3), route-32 (14),
  sprout-tower (3), violet-city (11), route-31 (3), route-30 (6),
  cherrygrove-city (5), route-29 (2), new-bark-town (6).
- **2026-07-24 — Phase 2, goldenrod-city session B (Tour Radio/arc Rocket,
  25/25 fichiers) re-kanjifié.** Vocabulaire de cet arc très N2 (でんぱ/
  そうび/そうこ/きょくちょう/へんそう/かいさん etc.) — quasiment tout hors
  studiedSet à ce point du curriculum (255 kanji), confirmé mot par mot.
  Seulement 4 conversions sûres trouvées sur 25 fichiers : 通（とお）さん/
  通（とお）しちまった (rt_grunt1_wh), 先（さき） (rt_grunt2_3f), ご用（よう）
  et 目（め） (petrel_5f), 力（ちから） (scientist_trenton). Règle
  tout-ou-rien confirmée sur de très nombreux candidats composés hors
  studiedSet. Audit `cumulative_start` : CLEAN du premier coup. 7 linters
  verts (536 fichiers dialogue, 480 fichiers état, 36 fichiers leçons,
  mêmes 3 WARN attendus, 0 FAIL). Reste goldenrod-city session C
  (Gym/dresseurs divers, 10 fichiers) pour clore la zone.
- **2026-07-24 — Phase 2, Tier 5 lancé : goldenrod-city session A (PNJ de
  ville, 15/15 fichiers) re-kanjifié.** Découpage en 3 sous-sessions par
  sous-lieu comme prévu par le plan (50 fichiers au total, le plus gros
  fichier-count du corpus) : A) PNJ de ville — fait ici ; B) Tour Radio/arc
  Rocket (25 fichiers) ; C) Gym/dresseurs divers (10 fichiers) — restent à
  faire. Kanji ajoutés : 通/毎日/水/木/羽/時/鳥/後/大変/本当. **Erreur
  d'oubli attrapée par l'audit** : 当 jamais vérifié dans le batch (pas une
  mauvaise lecture cette fois, un oubli pur — comme l'erreur 今 de
  cianwood-city) — appliqué à tort dans north_gate_man et real_director
  (ほんとう→本当), repéré par l'audit `cumulative_start` juste après
  l'édition, reverti en kana avant tout commit. **Bonus opportuniste** :
  l'audit a aussi trouvé un usage pré-existant (hors session, confirmé via
  `git log -p`) de 会 hors studiedSet dans kimono_kuni_goldenrod
  (お会いする) → revert kana. Règle tout-ou-rien confirmée sur de nombreux
  candidats hors studiedSet (相棒/自転車/だいじ/にんぎょう/ぜんぶ/うんどう/
  ばんぐみ/こうかん/どうぐ/しあい/おいわい/きんちょう/べんきょう/てがみ/
  とりかえす等の避罠含む). 8 fichiers restent à 0% densité (studiedSet très
  modeste à ce point), vérifiés sans amélioration sûre possible. Audit
  `cumulative_start` re-vérifié CLEAN après le correctif. 7 linters verts
  (536 fichiers dialogue, 480 fichiers état, 36 fichiers leçons, mêmes 3
  WARN attendus, 0 FAIL). Densité globale 141→136 fichiers sous le
  plancher. Reste goldenrod-city sessions B et C, puis route-34 (10),
  slowpoke-well (5), azalea-town (10), union-cave (12), route-33 (1),
  ruins-of-alph (3), route-32 (14), sprout-tower (3), violet-city (11),
  route-31 (3), route-30 (6), cherrygrove-city (5), route-29 (2),
  new-bark-town (6).
- **2026-07-24 — Phase 2, route-35 (9/9 fichiers) re-kanjifié — TIER 4
  ENTIÈREMENT CLOS** (Oliville → Doublonville). Kanji ajoutés : 目/知/先/力/
  芸/火/決/前/温/夜/入り口/用心. Règle tout-ou-rien confirmée sur de
  nombreux candidats hors studiedSet (こうえん/れんしゅう/つよい/さくせん/
  あつい/かるく/じゅうぶん/もんだい etc.). 2 fichiers (camper_elliot/
  juggler_irwin) restent à 0% densité, vérifiés sans amélioration sûre
  possible. Audit `cumulative_start` : CLEAN du premier coup. 7 linters
  verts (536 fichiers dialogue, 480 fichiers état, 36 fichiers leçons,
  mêmes 3 WARN attendus, 0 FAIL). Densité globale 148→141 fichiers sous le
  plancher. **Le Tier 4 (studiedSet 250-500, 10 zones) est maintenant
  intégralement re-kanjifié**, comme les Tiers 1-3 avant lui. Reste le
  Tier 5 (Bourg Geon → Doublonville 1ʳᵉ visite, 16 zones, gains attendus
  plus faibles par fichier) pour clore toute la passe dialogues —
  goldenrod-city (50 fichiers, le plus gros du corpus) à découper en
  plusieurs sessions par sous-lieu.
- **2026-07-24 — Phase 2, national-park (9/9 fichiers) re-kanjifié.** Kanji
  ajoutés : 作/毎日/前/毎週/通/帰. **Erreur de transcription attrapée par
  l'audit** : 早 pris pour True lors de la compilation manuelle du batch de
  vérification (en réalité False) — appliqué à tort dans bench_teacher
  (早い　もの勝ち), repéré par l'audit `cumulative_start` juste après
  l'édition, reverti avant tout commit. **Bonus opportuniste** : l'audit a
  aussi trouvé 2 usages pré-existants (hors session) de kanji hors
  studiedSet — 勝（もの勝ち, bench_teacher）et 花（花だん, pokefan_beverly）—
  confirmés via `git log -p` (commits antérieurs à cette passe), corrigés en
  même temps (revert kana). Règle tout-ou-rien confirmée sur de nombreux
  candidats hors studiedSet (きろく/ちょうせん/わかい/からだ/きたえて/しあい/
  にあう/おもう/うけつけ/しゅうちゅう/うでずもう etc.) — aucune amélioration
  sûre au-delà des 6 kanji retenus. 4 fichiers (magnus/retired_jumper/
  whitney/pokefan_beverly) restent à 0% densité, vérifiés sans amélioration
  sûre possible. Audit `cumulative_start` re-vérifié CLEAN après les 3
  correctifs. 7 linters verts (536 fichiers dialogue, 480 fichiers état, 36
  fichiers leçons, mêmes 3 WARN attendus, 0 FAIL). Densité globale 151→148
  fichiers sous le plancher. Reste route-35 (9) pour clore le Tier 4, puis
  le Tier 5 (Bourg Geon → Doublonville 1ʳᵉ visite, 16 zones).
- **2026-07-24 — Phase 2, route-36 (4/4 fichiers) re-kanjifié.** Kanji
  ajoutés : 道/前/話（両occurrences, はな/はなし)/動. Règle tout-ou-rien
  confirmée sur もくようび (木True mais 曜False), べんきょう (勉/強 False),
  せいか (成True mais 果False) — tous vérifiés hors studiedSet, restent
  kana. 2 fichiers (arthur/school_kid_alan) restent à 0% densité, vérifiés
  sans amélioration sûre possible. Audit `cumulative_start` : CLEAN du
  premier coup. 7 linters verts (536 fichiers dialogue, 480 fichiers état,
  36 fichiers leçons, mêmes 3 WARN attendus, 0 FAIL). Densité globale
  153→151 fichiers sous le plancher. Reste dans le Tier 4 : national-park
  (9), route-35 (9) — dernières zones avant le Tier 5.
- **2026-07-24 — Phase 2, route-37 (5/5 fichiers) re-kanjifié.** Kanji ajoutés :
  前/残/道/雨/先/心/準備/底/二人. Règle tout-ou-rien confirmée sur にちようび
  (日True mais 曜False), きょう (今日, 今False), だいすき (好False), れきし
  (歴/史 False), あえた (会False) — tous vérifiés hors studiedSet, restent kana.
  1 fichier (sunny_route37) reste à 0% densité, vérifié sans amélioration
  sûre possible. Audit `cumulative_start` : CLEAN du premier coup. 7 linters
  verts (536 fichiers dialogue, 480 fichiers état, 36 fichiers leçons, mêmes
  3 WARN attendus, 0 FAIL). Densité globale 155→153 fichiers sous le
  plancher. Reste dans le Tier 4 : route-36 (4), national-park (9),
  route-35 (9).
- **2026-07-24 — Phase 2, burned-tower (7/7 fichiers) re-kanjifié.** Kanji
  ajoutés : 何/用/年/水/追/水色/前/落/鳥/私/修行/並/風/残/話/火/行/先/伝説/一人/お前.
  Règle tout-ou-rien confirmée sur せきぞう/かげ/とびだした/ゆか/あぶない/くずれる,
  tous vérifiés hors studiedSet, restent kana. **Bonus opportuniste** : en
  auditant la zone, `会` (hors studiedSet à ce point) trouvé dans 2 lignes
  NON touchées par cette session (`storyteller_burned_tower.json` : 会（あ）った,
  `eusine_burned_tower.json` : 会（あ）おう) — confirmé via `git log -p` que ces
  lignes datent d'un « Lot 3 » antérieur à la passe phase 2, pas une régression
  de cette session. Corrigées quand même (revert en kana「あった」「あおう」)
  puisque les fichiers étaient déjà ouverts. Audit `cumulative_start` : CLEAN
  après ce correctif. 7 linters verts (536 fichiers dialogue, 480 fichiers état,
  36 fichiers leçons, mêmes 3 WARN attendus, 0 FAIL). Densité globale 167→163
  fichiers sous le plancher. Reste dans le Tier 4 : ecruteak-city (23), route-37
  (5), route-36 (4), national-park (9), route-35 (9).
- **2026-07-24 — Traitement des issues 01 et 02 de
  `.scratch/verif-systemes-2026-07-24/issues/`, avant reprise de la phase 2**
  (demande explicite utilisateur, issue 01 touchant des fichiers de leçons
  susceptibles de recroiser le travail phase 2 en cours). **Issue 01** (swap
  doublons kanji, phase 1) : `blackthorn-city.json` (言→命 seq 3, 元→定 seq 5) et
  `national-park.json` (寸→園 seq 1) avaient un kanji enseigné deux fois à cause
  du mécanisme d'emprunt de pool inter-zones combiné au swap de promotion phase 1
  — corrigé dans `content/lessons/` et `content/lessons-proposal.json` (source
  probable du bug). Nouveau linter permanent `lint-lessons-kanji-coverage.py`
  (aucun kanji enseigné deux fois, aucun kanji emprunté qui appartient en fait à
  une zone qui a déjà ses propres leçons), vérifié contre l'ancien ET le nouveau
  contenu. **Issue 02** (état inexistant dans state_rules) : `default` pointait
  vers un état absent de `dialogue_states` dans 2 fichiers
  (`suicune_viewpoint_r2425.json` : welcome→scene, `lone_grunt_gym_cerulean.json` :
  welcome→caught) — corrigé. Nouveau linter permanent `lint-dialogue-states.py`
  (state_rules cohérent avec dialogue_states, un seul default en dernière
  position, aucun état mort), vérifié contre l'ancien ET le nouveau contenu.
  Les deux issues marquées résolues avec détails en commentaire. Issue 03 et
  `proposals-revue-structurelle-2026-07-24.md` explicitement laissés hors
  scope (différés, non-bloquants).
- **2026-07-24 — Phase 2, revue point de vue joueur (2ᵉ passe, demande
  utilisateur « you did a review step by step on a player point of view? »)** :
  reconnu que les « simulations » précédentes étaient surtout mécaniques
  (linters + audit + diff), une seule vraie relecture narrative séquentielle
  avait été faite jusque-là. Sur demande explicite (« yes do it properly »),
  relecture séquentielle réelle refaite, 2 erreurs trouvées et corrigées (cf.
  entrée détaillée plus bas : とりかえして/取り替えして et かねのおと/金).
- **2026-07-24 — Phase 2, route-38 (5/5 fichiers) re-kanjifié.** Kanji ajoutés :
  知/毎日/道/広/風/変/港/行/陸. Règle tout-ou-rien sur 海風（海False）, 風向き
  （向False）, きゅうけい/べんきょう/きけん — tous vérifiés hors studiedSet, stays
  kana. Audit `cumulative_start` relu caractère par caractère contre la sortie
  brute cette fois (leçon de route-39) : CLEAN du premier coup. 7 linters verts.
  Densité globale 172→167 fichiers sous le plancher.
- **2026-07-24 — Phase 2, route-39 (10/10 fichiers) re-kanjifié.** Kanji ajoutés :
  方/作/知/牛/病気/甘/食/元気/私/行/子/本当/前/毎週/通/心/陸. **3ᵉ erreur trouvée par
  auto-vérification** (pas par le joueur cette fois, par la routine d'audit
  post-édition elle-même) : 思 et 海 utilisés dans `sailor_eugene_route39.json`
  sur la foi d'une mauvaise lecture de ma propre sortie de vérification (les deux
  étaient en réalité `False` dans le batch check, mal recopiés en `True` dans le
  plan d'édition — erreur de transcription, pas de méthode). Repéré par l'audit
  `cumulative_start` de routine tout de suite après l'édition (avant tout commit),
  reverti en kana. Confirme la valeur de faire tourner l'audit sur CHAQUE zone,
  pas seulement en cas de doute. 7 linters verts (536 fichiers dialogue + 36
  fichiers leçons + 480 fichiers état, mêmes 3 WARN attendus, 0 FAIL). Densité
  globale 182→172 fichiers sous le plancher.
- **2026-07-24 — Phase 2, revue point de vue joueur, 2 vraies erreurs trouvées et
  corrigées.** Demande explicite de l'utilisateur : les vérifications précédentes
  (linters + audit `cumulative_start` + `git diff` jp-only) sont mécaniques et ne
  lisent pas le sens ; une relecture séquentielle, comme un joueur, était encore
  due. Relecture faite sur les chaînes de quête à risque (power_plant_restoration,
  copycat_doll, ss_aqua_granddaughter, l'arc QG Rocket de mahogany-town, la scène
  Conseil 4/Champion) + recherche systématique (`grep`) des kanji homophones à
  risque déjà documentés comme piège méthodologique du projet. **2 erreurs
  réelles trouvées, toutes deux invisibles aux linters (kanji bien dans le
  studiedSet, lecture bien groupée — juste le mauvais mot)** :
  1. `kanto-power-plant/plant_director_kpp.json` — 「とりかえして」 (取り返す,
     « récupérer ») écrit à tort 取（と）り替（か）えして (取り替える, « échanger »)
     ; en plus d'être le mauvais mot, la conjugaison ne correspond même pas
     (取り替える → とりかえて, pas とりかえして — la présence du し confirmait déjà
     取り返す). 返 hors studiedSet de toute façon → reverti en kana intégral.
  2. `mahogany-town/scientist_mitch_mahogany.json` — mot de passe
     「かねのおと」(« Bell Chime », un carillon) écrit à tort 金（かね）のおと
     (« le son de l'argent ») au lieu de 鐘（かね）のおと (« le son d'une cloche »)
     — piège par homophone かね classique (金 vs 鐘), le studiedSet confirme 鐘 non
     étudié de toute façon → reverti en kana intégral.
  **Contrôles complémentaires sans erreur trouvée** : toutes les distinctions
  者/物 (personne/chose) sur 11 occurrences vérifiées correctes ; disambiguïsation
  systématique 開く/付ける/着る/早い-速い/北-来た sur 10 occurrences, toutes correctes.
  La séquence climactique Conseil4/Champion (silver_apparition6, will/koga/bruno/
  karen/lance) relue intégralement, cohérente de bout en bout, les reverts de
  l'audit précédent (けんしん/むかえうつ en kana) s'intègrent naturellement à la
  prose. 5 linters verts après les 2 correctifs. **Portée de cette relecture** :
  couvre les chaînes de quête à fort enjeu narratif + une recherche ciblée des
  pièges homophoniques connus — n'est PAS une relecture exhaustive ligne par
  ligne des ~320 fichiers de la session ; une lecture plus large reste possible
  si utile plus tard.
- **2026-07-24 — Phase 2, olivine-city (19/19 fichiers) re-kanjifié.** Kanji
  ajoutés : 私/毎日/病気/寝/鳥/行/顔/本気/前/先/本当/心/人/長/方/一流. 6 fichiers
  restent à 0% densité, vérifiés sans amélioration sûre. Audit `cumulative_start` :
  CLEAN. 5 linters verts (536 fichiers, mêmes 3 WARN attendus, 0 FAIL). Densité
  globale 194→182 fichiers sous le plancher. Reste dans le Tier 4 : route-39 (10),
  route-38 (5), burned-tower (7), ecruteak-city (23), route-37 (5), route-36 (4),
  national-park (9), route-35 (9).
- **2026-07-24 — Phase 2, route-40 + route-41 (17/17 fichiers) re-kanjifié —
  1ʳᵉ zone du Tier 4.** Kanji ajoutés : 私（わたし/私たち, cohérent sur les 10
  fichiers nageurs de route-41 qui partagent le même battle_intro）/知/作/言/考/
  広/大変/代/止/気/水/光/時/羽/落. 2 fichiers restent à 0% (monica/swimmer_randall),
  vérifiés sans amélioration sûre. **Détail d'outillage** : patch batch par script
  Python (`json.dump`) sur les 10 fichiers route-41 pour la ligne de battle_intro
  partagée — a fait sauter le retour à la ligne final (`\ No newline at end of
  file` au diff), repéré et corrigé avant commit (tous les fichiers du corpus se
  terminent par un retour à la ligne). Audit `cumulative_start` : CLEAN. 5 linters
  verts (536 fichiers, mêmes 3 WARN attendus, 0 FAIL). Densité globale 208→194
  fichiers sous le plancher. Reste dans le Tier 4 : olivine-city (19), route-39
  (10), route-38 (5), burned-tower (7), ecruteak-city (23), route-37 (5),
  route-36 (4), national-park (9), route-35 (9).
- **2026-07-24 — Phase 2, cianwood-city (10/10 fichiers) re-kanjifié — TIER 3
  ENTIÈREMENT CLOS** (whirl-islands déjà clos, 0 dialogue). Kanji ajoutés : 修行/
  行/病気/病人/後/元気/毎日/心/流（シジマ流）/伝/一/俺/元/力/年/言/目/知/選/先. **Bug
  attrapé par l'audit avant commit** : 今（いま）utilisé dans eusine_cianwood.json
  sans vérification (今 hors studiedSet réel de cette zone) — reverti. Confirmé
  distinct du seul kanji hors studiedSet restant, 飛 dans chuck_wife_cianwood.json :
  celui-là est PRÉ-EXISTANT (le CS-kanji lui-même, remis par grant_item juste à
  cet endroit — exception documentée du mécanisme CS, pas une erreur), vérifié via
  `git diff` que cette ligne n'a pas été touchée. 2 fichiers (black_belt_lung/
  yoshi) restent à 0% densité, vocabulaire vérifié sans amélioration sûre. 5
  linters verts (536 fichiers, mêmes 2 WARN attendus, 0 FAIL). Densité globale
  215→208 fichiers sous le plancher. **Le Tier 3 (studiedSet 500-660, 10 zones)
  est maintenant intégralement re-kanjifié**, comme les Tiers 1 et 2 avant lui.
  Reste le Tier 4 (Oliville→Doublonville) puis le Tier 5 (Bourg Geon→
  Doublonville 1ʳᵉ visite) pour clore toute la passe dialogues.
- **2026-07-24 — Phase 2, mahogany-town (23/23 fichiers) re-kanjifié en une
  passe** — le plan prévoyait 2 sessions vu le volume (arc QG Rocket complet :
  Lance/Ariana/Petrel-faux-Sakaki/Silver cameo/3 scientifiques/6 sbires/Pryce/
  vendeurs/skieurs), fait en une seule grâce à la méthode `cumulative_start`
  déjà rodée. Kanji ajoutés : 私/二人/行/止/力/先/道/食/通/知/湖/何/金/一/二/口/俺/言/
  先代/手先/目/時/年/生/冬/長/後/気/前. Notable : めいじん（名人）, kanjifié à
  lake-of-rage, reste hors studiedSet ici (名 non étudié à ce point précis du
  curriculum) — confirmation supplémentaire que l'ordre `cumulative_start` ne
  suit pas l'ordre narratif. **8 fichiers restent à 0% densité** (でんぱ/そうしんき/
  研究員/地下/頭/戦う/命 etc., chaque mot candidat a un kanji hors studiedSet),
  vérifiés un par un, aucune amélioration sûre. Audit systématique
  (`cumulative_start`) : CLEAN du premier coup, 0 correctif nécessaire. 5
  linters verts (536 fichiers, mêmes 3 WARN attendus, 0 FAIL). Densité globale
  228→215 fichiers sous le plancher. Reste cianwood-city (10 fichiers) pour
  clore le Tier 3 (whirl-islands déjà clos, 0 dialogue).
- **2026-07-24 — Phase 2, route-43 + mt-mortar + route-47-48-cliff-cave +
  safari-zone (16/16 fichiers) re-kanjifié**, méthode `cumulative_start` toujours
  correcte. Kanji ajoutés : 湖/行/知/人/底/道/円/払/話/気/通/何/山/心/修行/前/俺/広/先/
  二人/愛/毎日/目/日. 1 fichier (super_nerd_hugh_mt_mortar) reste à 0% : ses 4 mots
  (鉱石/研究/戻る/しらべて) ont un kanji hors studiedSet chacun, vérifié sans
  amélioration sûre possible. Audit `cumulative_start` + 5 linters : tout vert
  (536 fichiers, mêmes 2-3 WARN attendus, 0 FAIL). Densité globale 243→228
  fichiers sous le plancher. **Reste dans le Tier 3** : mahogany-town (23
  fichiers, gros volume prévu), cianwood-city (10 fichiers) ; whirl-islands
  déjà clos (0 dialogue).
- **2026-07-24 — Phase 2, route-44 + lake-of-rage (17/17 fichiers) re-kanjifié**,
  méthode `cumulative_start` correcte utilisée dès le départ (script corrigé).
  Kanji ajoutés : 道/険/行/山/風/池/魚/水/前/俺/倍/心/手前/名人/私/湖/力/貸/光/流/先/円/払/
  水/低/隠/道/日. Notable : 来/強/全/教/礼/団/曜/以/見/団 restent hors studiedSet à ces
  deux zones malgré des zones narrativement proches (ice-path, blackthorn) où
  certains de ces mêmes kanji étaient déjà disponibles — confirme que l'ordre du
  curriculum (`cumulative_start`) ne suit pas l'ordre de visite, exactement la
  raison pour laquelle la règle #2 interdit le calcul à la main. Petite erreur de
  lecture rattrapée par l'audit de contrôle : 以 pris pour True par erreur de
  lecture du batch de vérification (fisherman_andre_lake_of_rage.json, 以上→revert).
  Audit systématique (kanji réellement utilisé vs `cumulative_start`) refait après
  coup sur les deux zones : 0 divergence après le correctif. Sûreté structurelle
  (git diff jp-only) confirmée. 5 linters verts (536 fichiers, mêmes 3 WARN
  attendus, 0 FAIL). Densité globale 258→243 fichiers sous le plancher.
- **2026-07-24 — Phase 2, blackthorn-city (14/14 fichiers) re-kanjifié — BUG DE
  MÉTHODE ATTRAPÉ ET CORRIGÉ SUR TOUTE LA SESSION** : en commençant blackthorn-city
  (1ʳᵉ zone du Tier 3), `lint-kanji-budget.py` a fait échouer 6 fichiers (budget
  dépassé, lecture ungrouped sur 竜使い). Cause racine : le script d'aide ad hoc de
  cette session (studied.py, scratchpad) calculait le studiedSet en additionnant
  `new_kanji` sur NARRATIVE_ORDER — exactement la méthode que
  `rekanjify-report.py` documente comme « aide à la découverte, jamais source de
  vérité » (règle #1 du plan de zone) — au lieu de la vraie règle du linter
  (`ordered_kanji[:zone.cumulative_start]`, règle #2). **Corrigé immédiatement** :
  script réécrit pour utiliser `cumulative_start`. **Audit rétroactif des 21 zones
  déjà committées cette session** (comparaison de chaque kanji corps-de-texte
  utilisé contre le vrai studiedSet) : 14 fichiers de plus avec exactement 1 kanji
  non étudié chacun (母国/一瞬/怒/相棒/懸/娘/迎え撃つ/珍しい/電撃/戻る/床/一筋/逃げ場/
  基づいて/挑む/始めましょ/付けな selon fichier) — sous le seuil de 2/fichier donc
  invisibles au linter (budget respecté), mais contraires à la règle de fond.
  Tous repassés en kana, ré-audit complet confirmé **0 kanji hors studiedSet sur
  les 21 zones**. blackthorn-city lui-même re-kanjifié correctement ensuite : 竜使い
  （りゅうつかい）en run groupé (pas 竜（りゅう）使（つか）い — piège ADR-0002 déjà
  documenté mais reproduit une 2ᵉ fois), 安心/仕事 puis reverti (仕/事 finalement hors
  studiedSet réel), 兄さん/残る/学問(reverti, 問 hors studiedSet)/竜/私/並ぶ/言われる/
  厳しい/十分/学問/後 etc. **Sûreté structurelle** (git diff jp-only) reconfirmée sur
  tout le lot corrigé. 5 linters verts (536 fichiers, mêmes 3 WARN attendus, 0 FAIL).
  Densité globale 271→258 fichiers sous le plancher (1 fichier, effort_girl, reste
  à 0% : 鍛/似 hors studiedSet, aucune amélioration sûre). **Leçon retenue, ajoutée
  au plan de zone** : ne jamais recalculer le studiedSet à la main par accumulation
  narrative — toujours `cumulative_start`, ou lancer le linter et corriger ses FAIL.
- **2026-07-24 — Phase 2, Tier 2 entier (route-27/route-26/route-46/dark-cave/
  route-45, 27/27 fichiers) re-kanjifié à la main — TIER 2 ENTIÈREMENT CLOS**
  (dragons-den déjà fait plus tôt dans la session). Kanji notables : 受付/地方/西/北/
  開/直/水辺/手伝/力/本物/風/広/強/兄弟/実家/毎週/基/具合/元気/対/旅人/心/十分/勝/安定感/
  違/明/庭/一方通行/転/落/以上. Fil いばしょ/相棒/しんらい/ほうび : règle tout-ou-rien
  confirmée encore (棒/信頼/褒 hors studiedSet), sauf「しんらいし合える」où 合 seul était
  studied — repéré et corrigé après un 1er passage incomplet (lint-kanji-density avait
  laissé tohjo_old_lady_route27.json à 8%, sous le plancher de 2 points ; un 2ᵉ regard
  a trouvé 合える manqué). Un vrai 兄弟（きょうだい）remplace le faux ami 強大 du rapport
  heuristique. **Sûreté structurelle** : `git diff` confirme que seul le champ `jp`
  a changé sur les 27 fichiers. 5 linters verts (536 fichiers, mêmes 3 WARN attendus,
  0 FAIL). Densité globale 297→271 fichiers sous le plancher. **Le Tier 2 (studiedSet
  700-830, 6 zones) est maintenant intégralement re-kanjifié**, comme le Tier 1 avant
  lui. Reste le Tier 3 (blackthorn-city/ice-path déjà fait/route-44/lake-of-rage/
  route-43/mahogany-town/mt-mortar/route-47-48-cliff-cave/safari-zone/route-42 déjà
  fait/cianwood-city/whirl-islands vide) puis les tiers 4-5.
- **2026-07-24 — Phase 2, vermilion-city (38/38 fichiers) re-kanjifié à la main — TIER 1
  ENTIÈREMENT CLOS** : plus gros fichier-count après goldenrod-city, traité en session
  dédiée comme prévu par le plan. Kanji ajoutés notables : 船（ふね, omniprésent — bateau/
  traversée）/船旅（ふなたび）/海（うみ）/波（なみ）/電気/電球/電撃/危険/芸術/修行場/自慢/
  常連/一番/大物/景色/夢中/以上/救/命/以来/一筋（tirade de Surge）/修学旅行/引率/集中力/
  忘れ物/人形/娘（cohérence avec le fil copycat_doll déjà vu à Safran）. Fil de quête
  ss_aqua_granddaughter (grand-père→petite-fille cachée→retrouvailles→Manteau de Métal)
  et copycat_doll (comptoir du fanclub→Copycat à Safran→Pass Train Aimant) simulés
  narrativement de bout en bout, cohérents (gating par quest_step/item_owned inchangé).
  **1 fichier (sailor_garrett_ss_vermilion) reste à 0%** : ses 2 seuls mots (乗組員/
  縄張り) ont chacun un kanji hors studiedSet (乗/縄), vérifié sans amélioration sûre
  possible — pas un oubli. **Sûreté structurelle re-vérifiée** (`git diff` jp-only) sur
  les 38 fichiers. 5 linters verts (536 fichiers, mêmes 3 WARN attendus, 0 FAIL).
  Densité globale 332→297 fichiers sous le plancher. **Le Tier 1 (studiedSet ≥ 830,
  15 zones) est maintenant intégralement re-kanjifié.** Reste le Tier 2 (route-26/27/
  46/dark-cave/route-45, dragons-den déjà fait) puis les tiers 3-5, cf. plan de zone.
- **2026-07-24 — Phase 2, reste du Tier 1 (route-8-kanto/kanto-power-plant/
  lavender-town/route-9-10-rocktunnel/saffron-city/route-6-kanto/6 fichiers
  indigo-plateau, 44/44 fichiers) re-kanjifié à la main** : passe continue sur tout le
  Tier 1 restant avant vermilion-city (session dédiée à part, 38 fichiers). Kanji
  ajoutés notables : 電気/機械/発電所/部品/犯人/解散 (fil du vol à la Centrale, cohérent
  sur les 3 zones où il se répercute) ; 道場（どうじょう）— l'exemple canonique de
  CONTEXT.md — sur le dojo de Safran ; 四天王（してんのう）désormais kanjifiable dès
  l'antichambre (四/天/王 tous studied à ce point) et appliqué avec cohérence sur les 3
  occurrences body-text du titre (portier, Kyo, jamais dans les champs name/exam_name
  qui restent exemptés) ; 行方（ゆくえ, l'issue d'un combat）et 迎え撃つ（むかえうつ）sur
  les répliques de Sabrina/Lance sans casser le ton archaïsant-léger de la Ligue. Faux
  amis écartés : 位次/編者/以下/万 etc. (bruit de `rekanjify-report.py`, jamais suivi
  aveuglément). Règle tout-ou-rien confirmée sur : 人抜き/段位/団員 (連絡/真ん中/勝負 déjà
  vus), et cette fois 世界中 (界 hors studiedSet), 挑戦者 (戦 hors studiedSet partout),
  完璧/継承者/誕生 (Lance). **Bug linter attrapé une 2ᵉ fois** : `物々交換（ぶつぶつこうかん）`
  rejeté par `lint-kanji-budget.py` — le caractère de répétition 々 casse la regex de
  détection de run contigu (`KANJI_RUN_RE` ne le reconnaît pas comme kanji), donc 物
  se retrouve traité comme un run isolé sans lecture immédiate ; pas de règle de
  contournement documentée, phrase laissée entièrement en kana (`plant_worker_kpp.json`).
  **Vérification de sûreté structurelle** : `git diff` sur tout le lot confirme que
  chaque ligne modifiée ne touche que le champ `jp` — aucun `item_id`/`quest_id`/
  `effects`/`state_rules` altéré, donc la logique de quête (power_plant_restoration,
  copycat_doll, bill_family_thread, suicune_hunt) reste par construction identique à
  avant la passe. **Simulation narrative (joueur)** faite sur la chaîne
  power_plant_restoration (vol à la Centrale → indice Route 9-10/Safran → récupération
  à Azuria → restauration → radio de Lavande → carte EXPN) : cohérente de bout en bout,
  aucune rupture de gating. 5 linters verts (536 fichiers, mêmes 3 WARN attendus, 0
  FAIL). Densité globale 370→332 fichiers sous le plancher. Reste vermilion-city (38
  fichiers, session dédiée) pour clore le Tier 1, puis le Tier 2.
- **2026-07-24 — Phase 2, cerulean-city (10/10 fichiers) re-kanjifié à la main** : 2ᵉ
  zone du Tier 1 (studiedSet 1350). Kanji ajoutés (gérant du vélo, sbire isolé du gym,
  pièce cachée, garçon récurrent, Azuria/Misty, 5 nageurs) : 今/方/年前/赤/少年/自転車/
  旅立/何/お前/解散/団/聞/見/北/逃/行/浮/輪/陰/光/発電所/部品/川/水/急/北風/走/私/人魚/
  呼/全/懸/挑/受/取/守/上/番人/俺/戻/再開/強/試合/前/準備/十分/温/本気/波/飲. Faux amis
  écartés : かけて→懸けて (pas 賭けて, hors studiedSet de toute façon) pour le sens
  « miser/risquer » ; お前（まえ）aligné sur le seul précédent du corpus
  (`rocket_straggler1_ice_path.json`). Règle tout-ou-rien encore utile : れんらく
  (連絡, 絡 hors studiedSet), まんなか (真ん中, 真 hors studiedSet) et しょうぶ/まけかた
  (勝負/負け方, 負 hors studiedSet partout) laissés en kana. **1 fichier
  (`swimmer_diana_cerulean.json`) reste à 0% de densité** : aucun des deux mots du
  fichier n'a tous ses kanji étudiés — vérifié, aucune amélioration sûre possible (pas
  un oubli). **Bug linter attrapé en cours de route** : première tentative
  « 年（ねん）前（まえ）» rejetée par `lint-kanji-budget.py` (lecture par caractère sur
  un run contigu de kanji, ADR-0002) — corrigée en run groupé 年前（ねんまえ）. 5 linters
  verts (536 fichiers, mêmes 3 WARN attendus, 0 FAIL). Densité globale 378→370 fichiers
  sous le plancher.
- **2026-07-24 — Phase 2, route-24-25-kanto (12/12 fichiers) re-kanjifié à la main** :
  1ʳᵉ zone traitée selon l'ordre de priorité réel du nouveau plan
  (`.scratch/etape4-rekanjify-zone-plan.md`, Tier 1, studiedSet 1370 — le plus riche du
  corpus). Kanji ajoutés (dialogues Bill grand-père, scène/combat Suicune, 6 dresseurs du
  Pont Pépite, sbire isolé) : 友達/手紙/聞/珍/物/見/石/立派/交換/行/先/北風/水/波/上/立/
  来/瞬間/選/氷/目/試/頭/下/風/共/君/出/全力/金塊/達成/褒美/橋/一人/家/優/五人目/後/少/
  二人目/私/三/四/五/道/通/何/気/四人目/前/三人目/頃/覆/俺/留学生/母国/団/本当/終/部品/
  隠. Plusieurs faux amis homophoniques du rapport heuristique (`rekanjify-report.py`,
  aide à la découverte seulement) écartés par la lecture en contexte : こうかん→交換 (pas
  交感), やさしい→優しい « kind » (pas 易しい « easy », le rapport confond les deux),
  さき→先 « bout/pointe » (pas 幸), もの→物 (chose, pas 者 — pas une personne ici), わし
  laissé en kana (pronom, pas 和紙), せいせい laissé en kana (清々 réel mais 清 hors
  studiedSet). Règle du tout-ou-rien appliquée strictement sur les composés : にんぬき
  (人抜き) reste entièrement en kana dans les 2 fichiers qui l'utilisent car 抜 est hors
  studiedSet, même si 人 seul est connu — pas de kanjification partielle d'un même mot.
  0 kanji hors studiedSet ajouté. 5 linters verts (536 fichiers, mêmes 3 WARN attendus,
  0 FAIL) ; `lint-kanji-density.py` : les 12 fichiers de la zone passent au-dessus du
  plancher 10 %, total de fichiers sous le plancher 390→378. Plan de zone mis à jour
  (`route-24-25-kanto` marquée ✅, WARN 12→0). Reste tout le Tier 1 (cerulean-city,
  route-8-kanto, kanto-power-plant, lavender-town, route-9-10-rocktunnel, saffron-city,
  route-6-kanto, les 5 mini-zones indigo-plateau, vermilion-city,
  indigo-plateau-antichambre) puis les tiers 2-5.
- **2026-07-24 — Phase 2, ilex-forest (3/3 fichiers) re-kanjifié à la main** : 木/鳥/
  前/行/後/羽/知 ajoutés. naoko_ilex.json laissé tel quel (道/着物/枝/友達 hors
  studiedSet, aucune amélioration sûre à ce point très précoce — 220 kanji étudiés).
  5 linters verts.
- **2026-07-24 — Phase 2, route-42 (5/5 fichiers) re-kanjifié à la main** : 前/動/湖/
  方/風/山/一/魚/大 ajoutés. hiker_benjamin_route42.json laissé tel quel (石/岩/硬い
  hors studiedSet, aucune amélioration sûre). 5 linters verts.
- **2026-07-24 — Phase 2, ice-path (5/5 fichiers) re-kanjifié à la main** : 上/落/動/
  後/舞/人/先/光/立/俺/寒/前/分/本/当 ajoutés sur les 5 dialogues (farewell_note,
  kimono_sayo, cs_taki_pedestal, 2 rocket_straggler). 5 linters verts.
- **2026-07-24 — Phase 2, passe dialogues : méthode tranchée (automatisation
  rejetée), dragons-den (6/6 fichiers) re-kanjifié à la main** : tentative
  d'automatisation à l'échelle (`scripts/build/rekanjify-dialogues.py`, matching par
  limite de mot réelle — le corpus écrit　avec　des　espaces　pleine-chasse entre mots,
  donc pas besoin de deviner les limites comme pour le scan libre des textes) testée
  en dry-run puis en réel sur dragons-den : **~40% des substitutions étaient de faux
  amis homophoniques** (どう→動 au lieu de l'adverbe「comment」, いく→幾 au lieu de
  行く「aller」, りゅう→流 au lieu de 竜「dragon」— dans une zone qui s'appelle Antre
  du Dragon —, せいち→制ち au lieu de 聖地「terre sacrée」, たてる→建てる au lieu de
  立てる「poser (une question)」, して→仕手 au lieu de する+forme en te). Un lookup de
  dictionnaire ne peut pas désambiguïser les homophones sans compréhension du
  contexte — **rejeté, script supprimé**, corrections annulées (`git checkout`) avant
  tout commit. Un professeur de japonais ne validerait jamais du contenu enseignant
  du mauvais kanji dans un jeu dont c'est justement la mission. **Méthode retenue** :
  même rigueur manuelle que la passe textes, fichier par fichier, jugement humain
  (LLM) sur chaque mot — mais les fichiers de dialogue sont bien plus courts (2-6
  lignes typiques contre ~150-300 caractères + 5 questions pour un texte), donc plus
  rapides à traiter malgré leur nombre. **Erreur trouvée et corrigée en cours de
  route** : le placement de la lecture inline doit suivre immédiatement le KANJI, pas
  le mot entier avec ses okurigana (学ぶ（まなぶ）est FAUX, 学（まな）ぶ est correct) —
  attrapé par le linter sur le 1er fichier (`elder_master_dragons_den.json`, 15 FAIL),
  corrigé, les 12 autres kanjifications de la passe textes vérifiées rétroactivement
  indemnes (aucune n'avait cette erreur). dragons-den (studiedSet exact du linter —
  `ordered[:cumulative_start]`, pas l'approximation par ordre narratif utilisée pour
  les textes) : 6 fichiers, ~20 mots kanjifiés (人/言葉/問/立/一/学/何/二/強/物/三/時/
  四/者/思/五/使/目/本/当/子/頃/手/前/力/試/帰/竜/小), plusieurs pièges homophoniques
  évités par la lecture attentive (者 vs 物 selon que « もの » réfère à une personne
  ou une chose ; 番人 jamais utilisé — 番 non étudié, resté en kana plutôt que
  「万人」faux-ami que l'automatisation avait choisi). 5 linters verts. Reste 35 zones
  à leçon + les zones sans pool (combat/texte/ambiant) — chantier à l'échelle des
  lots déjà écrits.
- **2026-07-24 — Phase 2, les 18 textes passés en revue (12 re-kanjifiés, 6 déjà
  optimaux)** : `son_in_law_letter.json` (元気/毎日/お母さん/二人/家 ajoutés).
  `cs_kudakeru.json`, `ancient_inscription.json`, `johto_entrance_sign.json`,
  `lyra_mail.json` : studiedSet trop pauvre à leur position narrative (7/6/1/0) pour
  toute amélioration sûre — vérifiés, corrects tels quels. **`elm_great_text.json` :
  tentative de re-kanjification ANNULÉE** — ce texte a `zone_id: new-bark-town` mais
  se lit narrativement après 8 badges (gate `count(badges_earned, 8)`) ; kanjifier
  contre le studiedSet réel de ce point (dragons-den, 720 kanji) casse le linter, qui
  vérifie le budget contre le `zone_id` déclaré, pas le point de lecture réel — c'est
  déjà le correctif documenté du Lot 8 (« pages d'Elm kana-isées, le titre garde ses
  kanji »). Pas un bug à corriger dans cette passe ; noté pour l'équipe si le modèle
  de données gagne un jour un `reading_point_zone_id` distinct de `zone_id`. **Passe
  textes complète** (18/18 revus) — reste la passe dialogues (~500 fichiers, 36
  zones), le plus gros morceau de la phase 2. 5 linters verts.
- **2026-07-24 — Phase 2, suite (azalea-town/cs_kiru + ilex-forest/forest_shrine
  re-kanjifiés)** : `cs_kiru.json` (鳥/力/入/心/込 ajoutés). `forest_shrine.json`
  (déjà 森/人/神/木/手/風 dans le texte d'origine — 心/残 ajoutés, le reste du
  studiedSet ilex-forest à ce point est trop pauvre pour plus). `answer_span`/
  `length_chars` recalculés. 5 linters verts. Reste 6 textes (slowpoke-well,
  route-36, sprout-tower, route-29, new-bark-town ×2) avant la passe dialogues.
- **2026-07-24 — Phase 2, suite (burned-tower + les 3 textes d'ecruteak-city
  re-kanjifiés)** : `rainbow_legend_2.json` (鳥/作/掛/帰/言/伝/舞子 ajoutés),
  `cs_mizu.json` (形/川/心/進 ajoutés), `rainbow_legend_1.json` (年/羽/大/鳥/毎日/止/夜
  ajoutés), `three_spirits_legend.json` (二/夜/落/西/火/鳥/降 ajoutés — いのちを落とし
  et 落ちて réutilisent le même 落 pour cohérence). `answer_span`/`length_chars`
  recalculés programmatiquement pour les 4. 5 linters verts. Reste 7 textes
  (azalea-town, ilex-forest, slowpoke-well, route-36, sprout-tower, route-29,
  new-bark-town ×2) avant la passe dialogues.
- **2026-07-24 — Phase 2, suite (mahogany-town/cs_uzu, route-42/cs_chikara,
  cianwood-city/cs_tobu re-kanjifiés)** : `cs_uzu.json` (二/流/利用/上/進/沈 ajoutés,
  海/怒/始/事/分/怖/読/船/乗 restent kana), `cs_chikara.json` (動/入/言/心/一/業 ajoutés,
  腕/足/置/腰/息/合/体/全/部/押/技 restent kana), `cs_tobu.json` (鳥/道/一度/通 ajoutés —
  一（いち）ど du texte original converti en run groupé 一度（いちど）au passage ; つばさ/
  空/覚/忘/迷/戻/同/歩/町 restent kana). `answer_span`/`length_chars` recalculés
  programmatiquement pour les 3. 5 linters verts. Reste 11 textes (ecruteak-city ×3,
  burned-tower, azalea-town, ilex-forest, slowpoke-well, route-36, sprout-tower,
  route-29, new-bark-town ×2) avant la passe dialogues (~500 fichiers, 36 zones).
- **2026-07-24 — Phase 2, suite (2 textes ice-path re-kanjifiés)** :
  `content/texts/ice-path/cs_taki.json` (滝を上る話 — 上/下/落/魚/違/流/逆/中/道/見
  ajoutés avec lecture inline, ex. 登/思/静/付 restent kana car hors studiedSet) et
  `content/texts/ice-path/rocket_farewell_note.json` (lettre d'adieu d'Archer —
  長/間/帰/生/方 ajoutés ; めいれい/さいご/かえせ/あやまれる restent kana, leurs kanji
  — 令/最/返/謝 — hors studiedSet). `answer_span` et `length_chars` recalculés
  programmatiquement pour les deux. 5 linters verts.
- **2026-07-24 — Phase 2, lancement (re-kanjification : règle + outillage +
  1er texte)** : ajouté à `content-writing-guide.md` § 3bis la règle du plancher de
  kanji connus (≥15-20% des mots kanjifiables-connus effectivement en kanji). Outils
  construits : `scripts/build/rekanjify-report.py` (studiedSet réel par
  NARRATIVE_ORDER — pas cumulative_start aveugle —, scan heuristique par
  correspondance de plus longue chaîne contre un lexique dérivé de JMDict, aucun
  tokenizer disponible dans cet environnement donc RAPPORT SEULEMENT, édition
  manuelle obligatoire) et `scripts/validate/lint-kanji-density.py` (même mesure,
  WARN uniquement pour l'instant — 0,17% de densité mesurée à l'audit, un FAIL
  immédiat rougirait tout le corpus d'un coup ; passer une zone en FAIL via
  `STRICT_ZONES` une fois sa passe de re-kanjification vérifiée complète). **Bug
  trouvé en testant l'outillage** : `collect_jp_strings` ne captait que la clé `jp`,
  jamais `jp_text` (le champ réel du corps des textes progressifs) — corrigé dans les
  deux scripts avant tout comptage de référence, sinon toute mesure de densité sur
  `content/texts/` aurait été silencieusement fausse. **1 texte re-kanjifié
  intégralement et vérifié** : `content/texts/dragons-den/successor_scroll.json`
  (l'exemple nommé par l'audit — « archaïsant N2 sans un seul kanji ») : 竜/私/残/一/
  言葉/力/振/守/学/終/思/時/死/強/者/三/真 ajoutés avec lecture inline, `answer_span`
  des 3 questions concernées recalculés programmatiquement (positions caractère
  décalées par l'ajout des lectures), `length_chars` remis à jour. **Portée réaliste
  restante** : 17 autres textes + ~500 fichiers de dialogue sur 36 zones sont encore
  sous le plancher (411/466 fichiers avec du texte kanjifiable-connu, mesuré après le
  fix du bug) — une passe complète est un chantier à l'échelle des 13 lots déjà
  écrits, pas une session. 5 linters verts (0 FAIL, 2 WARN attendus/documentés).
- **2026-07-24 — Phase 2.4 (corrections linguistiques ponctuelles)** : lot de
  corrections mécaniques indépendantes de la passe de re-kanjification elle-même.
  **466 lesson_examples** de `kanji-content.json` avaient un groupement de lecture par
  caractère (学（がっ）校（こう）) au lieu d'un run ADR-0002 (学校（がっこう）) — fusionnés
  par script (`.scratch/scripts/fix-lesson-example-furigana-grouping.py`) ; règle ajoutée
  à `lint-kanji-budget.py` (nouveau check `ungrouped_furigana_runs`, FAIL) pour empêcher
  la régression, sur dialogues/textes/lesson_examples. Entrées 拉/弔 : phrases
  agrammaticales remplacées par les phrases sourcées dans le prompt (拉麺を食べに
  いきませんか / 弔問に行く). Champ `keyword` éditorialisé ajouté (校→« school », 拉→
  « drag/pull » — meanings[0] brut était trompeur) ; **batch complet différé**
  (« au fil des zones » par design, pas un big-bang). `content/gabarits/
  keigo-session-example.json` : 11 occurrences de 読 sans lecture inline corrigées
  (gabarit maintenant conforme avant utilisation en phase 5). `content/grammar/
  saffron-city.json` : N1-038 distracteur ということだ (défendable dans le trou)
  remplacé par というまでだ ; N1-042 exemple Hanabira ex0 (寿司ときたら…) sémantiquement
  incohérent → basculé sur ex2 du corpus (ハンバーガー, usage admiration), même méthode
  que N3-006. **correct_index randomisé** sur tout `content/texts/` (72→24 questions à
  0 avant, hash déterministe par text_id+index — `.scratch/scripts/
  randomize-correct-index.py`, idempotent/reproductible, pas de `random.random()`) ;
  le linter d'uniformité (0.6) ne relève plus que 2 cas bénins (le gabarit
  text-example.json, illustratif, et une coïncidence à 3 questions sur
  slowpoke-well/son_in_law_letter.json — plus le pattern « toujours index 0 » que la
  règle visait à éliminer). 5 linters verts (0 FAIL, 3 WARN attendus/documentés).
- **2026-07-24 — Phase 1 (curriculum : promotion du noyau N5/N4), corrigée après double
  revue prof+game designer sur le 1er jet** : décision de design actée (§ Phase 1 du
  prompt). Mesuré : 195 kanji N5/N4 assignés à une position ≥300 dans l'ordre par
  composants, dont les 6 exemples nommés par l'audit (本/561, 学/559, 時/1369, 年/1362,
  校/1363, 何/1990). Un premier essai plein budget (169 promotions) aurait réécrit
  jusqu'à 50 kanji dans une seule zone déjà écrite (blackthorn-city) — rescopé aux ~80
  kanji du palier catastrophique (position ≥1000) + les 6 exemples de l'audit.
  **Bug trouvé et corrigé après un 1er jet à 69 promotions** (revue Japanese-teacher +
  game-designer demandée par l'utilisateur sur le travail déjà committé) : le plafond
  par zone utilisait une liste `WRITTEN_ZONES` tapée à la main qui incluait par erreur
  des zones **sans aucune leçon** (route-33/34/35, slowpoke-well — une des « 35 zones
  sans leçon propre »). Conséquence réelle : 45 des 69 kanji promus — dont **4 des 6
  exemples-phares (年/校/何/時)** — atterrissaient sur une position sans PNJ pour les
  enseigner. Le swap avait l'air appliqué (kanji-zone-assignment.json réordonné,
  linters verts) mais était inerte côté joueur : aucune leçon, aucun `lesson_examples`
  pour la majorité des kanji « promus ». **Corrigé** : le pool de démotion est
  maintenant restreint aux positions situées dans une zone qui a réellement une entrée
  `content/lessons-proposal.json` (`LESSON_ZONES`, calculé depuis les données, jamais
  tapé à la main) ; plafond par zone relevé de 3 à 5 (le pool sûr s'est réduit à 124
  positions sur seulement 8 zones une fois filtré aux vraies zones à leçon) ; un edge
  case supplémentaire corrigé en cours de route (時 restait différé car son composant
  寸 sied à la position 291, juste sous 300 mais au-dessus du plafond réel atteignable
  par le pool restreint — le seuil de cascade de composant est maintenant calculé
  dynamiquement contre la position max réellement disponible, pas une constante 300).
  Résultat final, vérifié 0 promotion hors zone à leçon : **40 kanji promus** (dont 15
  composants radicaux cascadés — 又/寸/斤/爪/言/里/元/込/干/尚/舌/豆/矢/自/貝, vérifiés un
  par un contre kradfile par la revue : décomposition réelle, pas du bruit) échangés
  contre 40 kanji N1/N2/N3 sans aucun dépendant dans les 2136 kanji. Les 6 kanji
  nommés par l'audit atterrissent tous en position <300 (年=131, 学=163, 時=167,
  本=196, 校=222, 何=256). Impact sur les zones à leçon touchées : 14-50% de leur pool
  (8 zones : route-31, violet-city, sprout-tower, route-32, ruins-of-alph, azalea-town,
  ilex-forest, goldenrod-city — 5-6 kanji chacune). **25 lesson_examples** écrits pour
  les kanji nouvellement enseignés sans exemple préexistant (les autres avaient déjà
  des exemples d'un enseignement antérieur, réutilisés tels quels). `npc-inventory.md`
  resynchronisé (62 substitutions). **Accident opérationnel corrigé au passage** :
  `build-core-promotion.py` a été relancé par erreur après l'application du swap,
  recalculant contre l'état déjà muté et écrasant `kanji-core-promotion.json` avec une
  analyse fausse (35 promotions au lieu de 40, ne correspondant plus aux fichiers réels)
  — repéré immédiatement (vérification systématique après chaque script), réparé par
  `.scratch/scripts/reconcile-core-promotion-json.py` qui reconstruit le fichier de
  décision depuis le diff réel de `kanji-zone-assignment.json` plutôt que de
  recalculer ; un garde-fou (commentaire + procédure) a été ajouté en tête de
  `build-core-promotion.py` pour empêcher la récidive. **Transparence ajoutée** (finding
  game-designer : ~93 kanji du problème mesuré n'apparaissaient nulle part, ni promus
  ni différés) : `kanji-core-promotion.json` a maintenant une section
  `not_considered_this_pass` listant les 112 kanji N5/N4 mal positionnés mais jamais
  candidats dans cette passe (position ≥300 mais <1000, hors du scope catastrophique),
  pour qu'une future passe les reprenne sans repartir de zéro ; `deferred` (55 kanji)
  reste la liste des candidats catastrophiques qui n'ont pas trouvé de budget. Le champ
  `cascaded_component` (bugué, toujours `false` dans le 1er jet) reflète maintenant
  la réalité. Documenté dans `content/engine-contract.md` § 4bis : le motif « zone
  sans leçon empruntant son pool à une zone voisine » (azalea-town enseigne aussi le
  pool de route-33) n'est pas un bug — `LESSON_ZONES` l'exclut correctement par
  construction du calcul de démotion. 5 linters verts (536 fichiers, mêmes 3 WARN
  attendus qu'en phase 2.4, 0 FAIL).
- **2026-07-23 — Phase 0 (corrections mécaniques, revue prof+game designer)** : suite au
  prompt `.scratch/audits/prompt-etape4-suite-et-fin.md` (double revue du 2026-07-23),
  corrections structurelles avant toute nouvelle production, ordre du prompt respecté.
  **0.1** Simularbre Route 36 : `sprinkler_floria` (item inexistant) → `squirtbottle`
  (celui réellement accordé par Floria). **0.2** 2 trocs corrigés (grand-père de Bill
  R24/25, marchand du Passage Souterrain R6) : état `default` ne porte plus les Effects
  du troc, ajout d'un état d'attente gaté `item_owned`. **Trouvaille en plus** : un 3ᵉ
  cas structurellement similaire (`silver_unmask_goldenrod.json`, remove_item en état
  default) vérifié PAS bugué (l'entité n'existe sur la carte qu'une fois l'objet garanti
  possédé, via ses propres `unlock_conditions`) — documenté comme exception au fichier
  (`_lint_exceptions`) plutôt que silencieusement laissé de côté. **0.3** quêtes :
  `suicune_hunt` zone_ids corrigé (id inexistant `route-25-kanto` → `route-24-25-kanto`,
  `route-14-15-kanto` retiré — deviendra scène d'ambiance au Lot 15) ;
  `bill_family_thread` clos avec un step final `grandpa_met` (payoff réel, Route 24/25) ;
  `lighthouse_amphy` : step vestige `potion_obtained` supprimé. **0.4** `unlock_text`
  posé comme unique gate des textes (règle actée) : 5 CS (mizu/taki/tobu/uzu/chikara)
  + 4 textes secondaires à dialogue porteur (storyteller×2, lore_book, farewell_note)
  corrigés ; 5 textes sans aucun dialogue porteur (forest_shrine_ilex + 4 autres trouvés
  en vérifiant tout le corpus, pas seulement la liste du prompt) documentés comme
  émission moteur dans le nouveau `content/engine-contract.md` § 2. **0.5** création de
  `content/engine-contract.md` (event_cleared moteur-only : misty_met_viewpoint/
  ice_path_puzzle_solved/sayo_freed_ice_path/birds_guided_ilex ; quest_step moteur-only :
  moomoo_recovery fed_1-6/healed, radio_tower_takeover tower_occupied ; items de boutique ;
  mécaniques différées à l'implémentation ; décisions de spec pour l'équipe code).
  **0.6** `lint-cross-refs.py` étendu (item_id croisés, event_cleared vs contrat,
  quest_step consommé vs produit/contrat, anti-pattern troc en default, WARN
  d'uniformité correct_index) — a immédiatement attrapé le 3ᵉ cas de troc et confirmé
  les 72/72 correct_index=0 (20 WARN, phase 2.4 les corrigera). **0.7** `CONTEXT.md` §
  Effect : `grant_badge` ajouté (11 usages non documentés), `unlock_zone` flagué inutilisé
  (0 usage) ; obstacle Chutes de Tohjo (route-27) ajouté (`cs_mizu`+`cs_taki`, chemin
  critique Johto→Kanto, absent jusqu'ici) ; 8 zones à placements sans dialogues
  rattachées explicitement à leur futur lot (tableau dédié ci-dessous) pour qu'aucune ne
  tombe entre deux lots. 5 linters verts (536 fichiers, 20 WARN attendus/documentés,
  0 FAIL).
- **2026-07-21 — cerulean-city + routes 24/25 (Lot 13)** : Azuria — 17 leçons N1-083→099
  (gérant du magasin de vélos d'origine avec écho Red, garçon récurrent), **sbire isolé
  au gym** (l'exemple canonique du negate du PRD, câblé tel quel : présent tant que
  negate(misty_met_viewpoint)) → fuite → **combat au pont** → aveu → pièce mécanique
  récupérée (clôt le milieu de power_plant_restoration), gym de Misty peuplé post-event
  (5 gardiens 23q), **Misty 80q 試練・水の道**. Routes 24/25 — gauntlet des 6 du Pont
  Pépite, **grand-père de Bill** (fil D4 clos : troc pierre de Hoenn ↔ objet évolutif,
  cohérence collectibles), **FINALE SUICUNE** : scène du point de vue (Eusine
  commentateur, Misty au rendez-vous — sourcé), **combat 60q**, suicune_hunt close (le
  mystère du grand-père d'Eusine reste ouvert, fidèle). Raikou 45q/Entei 52q = errants,
  design de déclenchement à l'implémentation (noté). Overlay 17 points, 100
  lesson_examples. 5 linters verts (536 fichiers).
- **2026-07-21 — routes 8/9-10 + Lavanville + Centrale (Lot 12)** : l'arc du courant de
  Kanto (04-B1) posé en quête **power_plant_restoration** (pièce volée → indice « R » vers
  le gym d'Azuria → CT au retour → radio de Kanto rétablie → **carte EXPN** chez le
  directeur de Lavanville, prépare le réveil du Ronflex). 10 leçons N1-071→074/076→081
  (famille いかん complète chez le directeur radio), 15 combats ROM (routes 8/9/10),
  overlays 10 points, 50 lesson_examples. 5 linters verts.
- **2026-07-21 — route-6-kanto + saffron-city (Lot 11)** : route-6 (avec Route 5/Passage
  Souterrain fusionnés) — 3 combats ROM, 2 leçons N1-036/037 (vieille dame/Talisman,
  troc RageCandyBar↔CT = callback D10). Safran — **24 leçons N1-038→061** sur 6 refs
  (Mr. Psychic, vigile Silph, **Copycat ×8** — résolution de copycat_doll → **Pass Train
  Aimant**, gare fonctionnelle ; **dojo vide → leçons par parchemins** (karatéka parti au
  Mont Mortier = Kiyo du Lot 5, adaptation zéro-PNJ-inventé documentée), Steven Silph
  (pierre de Hoenn, adaptation compagnon-unique ×2)), Sabrina 77q 試練・念の道 (4 gardiens
  22q, 9 chambres téléportées). Overlays : leçon apprise du linter — le corpus Hanabira
  est FIGÉ, phrases exactes réannotées (1ʳᵉ tentative en phrases réécrites rejetée par
  lint-grammar-overlay, correcte au 2ᵉ passage). 150 lesson_examples N1. 5 linters verts.
- **2026-07-21 — SS Aqua + vermilion-city (Lot 10, entrée en Kanto)** : traversée
  fonctionnelle (I-1) — **27 combats du navire** (roster ROM complet 1F/B1F, 21q),
  quête B6 (petite-fille au B1F, Manteau de Métal), Capitaine distributeur de Plaques
  (C9), quête fetch de la poupée de Copycat (résolue à Safran). Carmin — **30 leçons**
  N2-177→191 + N1-001→015 sur 4 PNJ-leçon (grand-père/capitaine ×8, président/comptoir
  ×7), overlay 30 points (**dérogation documentée : 1 exemple câblé/point** au lieu de
  2-3, volume oblige — les variants Hanabira restent au build), 180 lesson_examples.
  **Lt. Surge 74q 試練・雷の道** — courbe Kanto posée : Surge 74 → Sabrina 77 → Misty 80
  → Erika 83 → Janine 86 → Brock 89 → Blaine 93 → **Blue 98** (borne « jusqu'à 98 »
  sourcée PRD § Gyms). Cameos : **Steven (FV-5 soldé** — la « rencontre légendaire
  ailleurs » devient sa ligne sur les mojis hors-région, roadmap Étape 5.1), Eusine jetée
  (suicune_hunt +1). 5 linters verts.
- **2026-07-21 — routes 26/27 + Route Victoire + Ligue (Lot 9) — JOHTO CLOS** : routes
  26/27 — 12 combats ROM, 12 leçons N2-122→128/142→146 (hub des frères/sœurs du jour
  sourcé = carnet-index du fil calendaire ; vieille dame de Tohjo TM37 ; Porte de
  Réception est/ouest fermés). Route Victoire — **Silver #6 (24q)**, aboutissement de la
  rédemption, « a vidé la route » sourcé = zéro autre combat. Antichambre — 7 leçons
  N2-157→163 (vieil homme au télépathe), règle « pas de sortie sans défaite ».
  **Conseil 4 en examens 70q** (Will/Koga/Bruno/Karen — « aucune personnalité sourcée,
  liberté studio » : caractérisations dérivées du canon, noms d'épreuve créés, maxime de
  Karen adaptée aux mots) enchaînés par npc_cleared, **Lance Champion 80q**
  (試練・頂の道, Hall of Fame + amorce Kanto). 110 lesson_examples, 19 points d'overlay.
  5 linters verts (433 fichiers).
- **2026-07-21 — arc final Kimono + dark-cave + routes 45/46 (Lot 8)** : **grand texte
  d'Elm écrit** (ex-Master Ball R11 — support choisi : le vieux livre 「漢字の庭」,
  texte-titre du jeu, métaphore fondatrice du projet ; gate count(badges_earned, 8),
  nouveaux états d'Elm — bug d'ordre des state_rules attrapé et corrigé), quête
  **kimono_finale** (gauntlet des 5 au Théâtre 24→48q avec continuité narrative des 5
  rencontres, Clear Bell, danse rituelle au sommet de Tour Jo, **combat de l'être
  arc-en-ciel 65q** — interpolé entre les 3 esprits (≤60) et l'E4 (70), rejouable si
  échec, sourcé E3). dark-cave — 7 leçons N2-102→108 (l'homme du fond, 30 ans dans le
  noir, BlackGlasses ; unlock badge Clair). routes 45/46 — 10 combats ROM. 40
  lesson_examples, 7 points d'overlay. Correctif budget : pages d'Elm kana-isées
  (印/漢/庭/本 hors studiedSet de new-bark — le titre garde ses kanji dans le TEXTE,
  qui a un budget proportionnel). 5 linters verts (406 fichiers).
- **2026-07-21 — route-44 + ice-path + blackthorn + dragons-den (Lot 7)** : route-44 — 7
  combats ROM. ice-path — **Sayo, 5ᵉ Kimono** (scène comique sourcée, 5/5 rencontrées),
  **CS 滝 au piédestal du puzzle de glissades** (+ texte obligatoire ; event
  ice_path_puzzle_solved, audit 02), quête optionnelle « Retardataires » (2 sbires
  post-dissolution + note d'adieu d'Archer en texte de lore). blackthorn — 15 leçons
  N2-026→040 sur 7 PNJ sourcés (adaptations : tuteurs de capacités → enseignants de
  lectures ; Santos du samedi), 5 gardiens 20q, **Clair 72q 試練・竜の道 qui REFUSE le
  badge** (fidèle) → quête dragons_den_trial. dragons-den — 10 leçons N2-071→080 (Maître
  ×5, vieillards ×5), 3 combats, **quiz d'empathie du Maître écrit** (5 questions absentes
  de la source, rédigées : apprendre/protéger/perdre/compagnons/servir), lignée
  Clair/Lance/Maître sourcée, **parchemin du successeur** (unlock_text, registre
  archaïsant conforme texts-progressifs), Clair remet le 印 n°8 au sanctuaire. 150
  lesson_examples, 25 points d'overlay (50 exemples). 5 linters verts (386 fichiers).
- **2026-07-21 — arc Tour Radio, Doublonville revisite (Lot 6)** : l'événement Rocket 3/3
  différé du Lot 2, complet — quête **radio_tower_takeover** en 7 étapes (occupation →
  déguisement forcé au Tunnel → Silver démasque (scène ; il cherche Lance) → Petrel-faux-
  Directeur 5F 40q → Basement Key → vrai Directeur au Tunnel B2F (Card Key) → **Silver #5
  combat 22q** (début de rédemption) + Kuni (4ᵉ Kimono, scène) + Burglars Orson/Duncan →
  3F Proton 42q + re-Petrel 44q → plateforme : Ariana 46q puis **Archer 48q** (valeur
  gauntlet de la table PRD atteinte sur le boss final, exécutifs interpolés 40-46,
  documenté) → dissolution des Rocket (sourcé) → **Plume Arc-en-ciel** (ouvre Tour Jo)).
  15 grunts/scientists ROM (18-19q), 3 obstacles (entrée-déguisement, porte 3F/Card Key,
  sous-sol/Basement Key), gating global badge_earned(pryce) + étapes. Aucune leçon (déjà
  toutes écrites au Lot 2). 5 linters verts (349 fichiers).
- **2026-07-21 — route-42/mt-mortar + mahogany + route-43 + lake-of-rage (Lot 5)** :
  route-42 — 3 combats, **Hiker de Mont Mortier = PNJ-leçon N2-001→003 + remise CS 力**
  (+ texte obligatoire — résout le WARN force_rock_route32 ouvert depuis le Lot 1), Eusine
  est (suicune_hunt +1 étape). mt-mortar — 3 combats + **Kiyo le Karate King** (22q, dōjō
  E1 réintégré ; récompense adaptée en ceinture noire collectible, règle compagnon-unique).
  lake-of-rage — **rencontre Shiny garantie du kanji 怒** (combat 20q, écaille rouge
  garantie — sourcé « ne peut pas être raté »), **Lance recrute au bord du lac** (vrai
  point de départ du fil, sourcé), Fishing Guru, Wesley du mercredi, dresseurs du mercredi
  (time_window + post-QG), quête **red_scale_errand** (callback Mr. Pokémon → Exp. Share,
  états ajoutés à son fichier Lot 1). mahogany — 5 leçons N2-009→013 (dont 3 de kanji N5
  cascadés du pool route-29, conformes au comptage figé), **arc QG Rocket complet en Quest
  5 étapes** (Gregg le savant gaffeur coupe l'alarme par dialogue — typé leçon, pas combat ;
  Ross/Mitch mots de passe ; Silver #4 cameo sans combat ; Petrel-faux-Sakaki 30q
  interpolé ; **double avec Lance contre Ariana 36q** ; **CS 渦 remis par Lance** + texte),
  Pryce examen 試練・氷の道 65q gated chute du QG + 5 gardiens. 50 lesson_examples,
  4 overlays (20 exemples), 2 textes CS. 5 linters verts (320 fichiers), 0 WARN deadlock.
- **2026-07-21 — routes 38-41 + olivine + cianwood + 47-48 + safari (Lot 4)** : route-38 —
  5 combats ROM. route-39 — 9 leçons N3-070→078 sur les 4 PNJ de la ferme Moomoo, **quête
  moomoo_recovery** (7 baies multi-jours, modèle time_window du PRD ; l'animal est うし,
  règle #1), récompenses Seal Case/3 Seals/TM83 gated guérison, Baoba #1. olivine-city —
  **arc du Phare complet** (quête lighthouse_amphy en 3 temps, gardien humain — adaptation
  règle #1 de l'Ampharos ; 11 dresseurs du Phare dont Connie/Alfred « relocalisés » au gym
  post-quête via negate, fidèle au détail sourcé), 5 leçons N3-099→103, Jasmine examen
  試練・鋼の道 58q gated quête + 門弟, Bonne Canne, Silver ambiant. routes 40/41 — 14
  nageurs (lore oral des Îles Tourbillon en post-combat), Monica du lundi, 2 ambiants,
  obstacles mer (水+Morty). cianwood-city — 5 leçons N3-116→120, Chuck examen 試練・力の道
  51q (gate pokeathlon_score 250 + 4 karatékas), **remise CS 飛 par la femme de Chuck**
  (+ texte obligatoire cs_tobu), Potion Secrète (pharmacien), pot confié (adaptation
  Shuckle règle #1 + compagnon unique), **combat Eusine 20q** (8ᵉ combat manqué par le
  typage — npc-inventory corrigé, quête suicune_hunt avancée). route-47-48 — 5 combats ROM.
  safari-zone — Baoba à l'entrée (mécanique I-adaptée à l'implémentation). whirl-islands —
  obstacle 渦 posé (zone à 0 PNJ, close). 116 lesson_examples (`add-lot4-lesson-examples.py`),
  3 overlays (38 exemples). 5 linters verts (265 fichiers).
- **2026-07-21 — route-37 + ecruteak-city + burned-tower (Lot 3)** : route-37 — 4 combats ROM
  (paire Twins Tori & Til), Sunny « frère/sœur du dimanche » (time_window, 3 leçons
  N3-038→040, Magnet). ecruteak-city — 7 leçons N3-047→053 (réconciliation Mediums comme
  Whitney : Grace/Georgina 門弟 14q, Martha npc_ref #1/#7, Edith ambiante), Morty examen
  試練・影の道 45q (badge + TM30), sauvetage de Miki (Sbire 13q → npc_cleared bascule Miki
  « saved » et le Gentleman « give_surf »), **remise CS 水** (+ texte obligatoire cs_mizu),
  Dowsing MCHN (I-9) + livre A2 des 3 esprits (objet), conteur A9 fragment 1, Bill
  (nouvelle quête transversale bill_family_thread — corrige le gating par event du Lot 2,
  qu'aucun Effect ne sait écrire), obstacle bell_tower_gate (badge + Plume). burned-tower —
  Morty/Eusine ambiants, **quête suicune_hunt créée** (I-2, étapes 1-2 câblées : rencontre
  Eusine + fuite des 3 esprits via sanctuaire-objet, règle #1 respectée), Ned/Richard,
  **Silver #3 (18q)**. 55 lesson_examples (`add-lot3-lesson-examples.py`), 2 overlays
  (24 exemples), 4 textes. Corrections linter : kanji hors studiedSet kana-isés (l'ordre
  canonique par composants place 見/本/学/曜 plus tard que l'intuition JLPT — à garder en
  tête pour les prochains dialogues). 5 linters verts (195 fichiers).
- **2026-07-21 — route-35 + national-park (Lot 2, suite)** : route-35 — 9 dresseurs ROM
  (dont Dirk nocturne, paire Brooke & Elliot en rivalité), 0 leçon. national-park —
  7 leçons N3-001→007 sur 4 PNJ-leçon sourcés (Magnus ×2, vieux sauteur ×2, vendeur
  Aprijuice ×2, enseignant du banc), Whitney réapparition (maillot), 4 dresseurs ROM 10q,
  Apriblender/Quick Claw/maillot câblés, overlay grammaire 7 points (14 exemples — ex2/ex3
  de N3-006 écartés car agrammaticaux dans le corpus Hanabira, documenté), 40
  lesson_examples (`add-national-park-lesson-examples.py`). Concours du Parc (mar/jeu/sam)
  et disciplines Pokéathlon = mécaniques I-5/I-6 adoptées, barèmes à l'implémentation —
  aucun fichier contenu à écrire ici. Correctif au passage : `calc-cs-corpus.py` gagne le
  donneur de cs_kiru (charcoal_man_azalea) manquant depuis le lot Ilex → corpus 切 mesuré
  (4 textes vs cible 20-24, déficit attendu, comblé à la passe textes).
- **2026-07-21 — route-34 + goldenrod-city (1ʳᵉ visite, Lot 2)** : route-34 — 9 dresseurs ROM
  (dont Keith nocturne time_window 20h-4h et trio Ace Jenn/Irene/Kate derrière l'eau,
  obstacle `water_tiles_route34` CS 水 + badge Morty, Power Herb par Kate), couple de la
  pension ambiant, 0 leçon (zone hors table). goldenrod-city — 9 leçons N4-086→094
  (réconciliation gardiennes documentée : Victoria/Samantha = 門弟 13q, Carrie = npc_ref
  leçon #1, Cathy ambiante), Whitney examen 試練・常の道 38q avec larmes fidèles HGSS
  (badge à la re-parole), 4 dresseurs Tunnel 12q, quête `goldenrod_mail_errand` (adaptation
  règle #1 : approche furtive, pas de capture), Coin Case/Bicyclette/Radio Card/Blue
  Card/SquirtBottle/TM27/TM45/HP Up câblés, Bill = poupée collectible (companion_id
  inchangeable, adaptation documentée), overlay grammaire 9 points (18 exemples, linter
  vert), 50 lesson_examples (`scripts/build/add-goldenrod-lesson-examples.py`).
  **Différé au beat narratif Rocket (post-Mahogany)** : Tour Radio 2F-5F (14 grunts +
  Petrel ×2 + Proton + Ariana + Archer), Tunnel B2F (Silver #5, Burglars, vrai Directeur,
  Kuni), sbire déguisement. 5 linters verts (142 fichiers).
- **2026-07-17 — ilex-forest (Forêt Secte)** : 3 dialogues (apprenti charbonnier PNJ-leçon #1/#3/#5 + quête, homme de la corniche PNJ-leçon #2/#4, Naoko ambiant), `lessons/ilex-forest.json` (5 leçons N4-063→067), 30 lesson_examples, texte secondaire A8 (sanctuaire `forest_shrine_ilex`), quête cross-zone `escaped_companions_errand` (Écorcia↔Forêt), remise CS 切 (`cs_kiru` + texte obligatoire `cs_kiru_azalea`, arc du Maître du Charbon d'Écorcia complété — différé du Lot 1), obstacle `cut_tree_ilex_shortcut`, 3 entrées carte. 4 linters verts (110 fichiers). Aucun dresseur nommé sourcé pour cette zone (roster ROM vide) → 0 combat inventé.

## Tableau de suivi (ordre narratif réel)

Colonnes statut détaillé à cocher au fil : D=dialogues, L=lessons/*.json, E=lesson_examples, T=texte(s), C=carte/registre.

| # | Zone | Région | Leçons | Kanji | PNJ | Statut | D | L | E | T | C |
|---|---|---|---:|---:|---:|---|:-:|:-:|:-:|:-:|:-:|
| 1 | new-bark-town | Johto | 5 | 30 | 1 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | route-29 | Johto | 4 | 20 | 1 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | cherrygrove-city | Johto | 2 | 10 | 2 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | route-30 | Johto | 4 | 20 | 1 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 | route-31 | Johto | 4 | 20 | 1 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 | violet-city | Johto | 5 | 30 | 5 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7 | sprout-tower | Johto | 2 | 10 | 2 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 | route-32 | Johto | 4 | 20 | 4 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | ruins-of-alph | Johto | 4 | 20 | 2 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | azalea-town | Johto | 5 | 30 | 2 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11 | ilex-forest | Johto | 5 | 30 | 2 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 12 | goldenrod-city | Johto | 9 | 50 | 9 | ✅ COMPLET (1ʳᵉ visite Lot 2 + arc Tour Radio Lot 6) | ✅ | ✅ | ✅ | — | ✅ |
| 13 | national-park | Johto | 7 | 40 | 4 | ✅ fait (concours mar/jeu/sam = mécanique I-6, différée à l'implémentation) | ✅ | ✅ | ✅ | — | ✅ |
| 14 | route-36 | Johto | 5 | 25 | 2 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 15 | route-37 | Johto | 3 | 15 | 1 | ✅ fait | ✅ | ✅ | ✅ | — | ✅ |
| 16 | ecruteak-city | Johto | 7 | 40 | 6 | ✅ fait (+ burned-tower, Silver #3 ; gauntlet Kimono différé au beat post-grand-texte) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 17 | route-39 | Johto | 9 | 50 | 4 | ✅ fait (+ route-38 ; quête uси 7 baies) | ✅ | ✅ | ✅ | — | ✅ |
| 18 | olivine-city | Johto | 5 | 30 | 2 | ✅ fait (Phare complet, Jasmine gym gated quête) | ✅ | ✅ | ✅ | — | ✅ |
| 19 | cianwood-city | Johto | 5 | 30 | 3 | ✅ fait (+ routes 40/41, 47/48, safari, whirl obstacle ; CS 飛) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 20 | route-42 | Johto | 3 | 15 | 1 | ✅ fait (+ mt-mortar/Kiyo ; CS 力) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 21 | mahogany-town | Johto | 5 | 25 | 5 | ✅ fait (arc QG Rocket complet, Pryce, CS 渦) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 22 | route-43 | Johto | 1 | 5 | 1 | ✅ fait | ✅ | ✅ | ✅ | — | ✅ |
| 23 | lake-of-rage | Johto | 1 | 5 | 1 | ✅ fait (kanji 怒 shiny, Lance, écaille rouge) | ✅ | ✅ | ✅ | — | ✅ |
| 24 | blackthorn-city | Johto | 15 | 90 | 7 | ✅ fait (+ route-44, ice-path/Sayo/CS 滝 ; Clair refuse le badge) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 25 | dragons-den | Johto | 10 | 60 | 2 | ✅ fait (quiz du Maître écrit, parchemin du successeur, 印 n°8) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 26 | dark-cave | Johto | 7 | 40 | 1 | ✅ fait (+ routes 45/46 ; homme du fond, BlackGlasses) | ✅ | ✅ | ✅ | — | ✅ |
| 27 | route-26 | Johto | 7 | 40 | 2 | ✅ fait (hub des frères/sœurs du jour) | ✅ | ✅ | ✅ | — | ✅ |
| 28 | route-27 | Johto | 5 | 30 | 1 | ✅ fait (Chutes de Tohjo, Porte de Réception) | ✅ | ✅ | ✅ | — | ✅ |
| 29 | indigo-plateau-antichambre | Johto | 7 | 40 | 1 | ✅ fait (Silver #6, Conseil 4, Lance — JOHTO CLOS) | ✅ | ✅ | ✅ | — | ✅ |
| 30 | vermilion-city | Kanto | 30 | 180 | 4 | ✅ fait (SS Aqua 27 combats, quêtes B6 + poupée, Surge 74q, Steven FV-5 soldé) | ✅ | ✅ | ✅ | — | ✅ |
| 31 | route-6-kanto | Kanto | 2 | 10 | 2 | ✅ fait (callback RageCandyBar D10) | ✅ | ✅ | ✅ | — | ✅ |
| 32 | saffron-city | Kanto | 24 | 140 | 6 | ✅ fait (Copycat/Magnet Pass, dojo vide→parchemins, Sabrina 77q) | ✅ | ✅ | ✅ | — | ✅ |
| 33 | route-9-10-rocktunnel | Kanto | 4 | 20 | 1 | ✅ fait (+ route-8) | ✅ | ✅ | ✅ | — | ✅ |
| 34 | lavender-town | Kanto | 4 | 20 | 1 | ✅ fait (EXPN gated centrale) | ✅ | ✅ | ✅ | — | ✅ |
| 35 | kanto-power-plant | Kanto | 2 | 10 | 2 | ✅ fait (quête pièce volée → Azuria) | ✅ | ✅ | ✅ | — | ✅ |
| 36 | cerulean-city | Kanto | 17 | 100 | 2 | ✅ fait (+ routes 24/25 — FINALE SUICUNE, Misty 80q, fil Bill clos) | ✅ | ✅ | ✅ | — | ✅ |
| 37 | celadon-city | Kanto | 25 | 150 | 6 | ⬜ à faire | · | · | · | · | · |
| 38 | route-16-17-18-cycling-road | Kanto | 4 | 20 | 1 | ⬜ à faire | · | · | · | · | · |
| 39 | fuchsia-city | Kanto | 22 | 130 | 4 | ⬜ à faire | · | · | · | · | · |
| 40 | route-14-15-kanto | Kanto | 4 | 20 | 1 | ⬜ à faire | · | · | · | · | · |
| 41 | route-11-12-13-diglett | Kanto | 3 | 15 | 3 | ⬜ à faire | · | · | · | · | · |
| 42 | pewter-city | Kanto | 20 | 115 | 2 | ⬜ à faire | · | · | · | · | · |
| 43 | mont-lune-route-3-4 | Kanto | 4 | 20 | 1 | ⬜ à faire | · | · | · | · | · |
| 44 | route-2-foret-viridian | Kanto | 3 | 15 | 1 | ⬜ à faire | · | · | · | · | · |
| 45 | viridian-city | Kanto | 2 | 10 | 1 | ⬜ à faire | · | · | · | · | · |
| 46 | route-1-kanto | Kanto | 2 | 10 | 1 | ⬜ à faire | · | · | · | · | · |
| 47 | pallet-town | Kanto | 3 | 15 | 1 | ⬜ à faire | · | · | · | · | · |
| 48 | mt-silver-route-28 | Mont Argenté | 14 | 80 | 1 | ⬜ à faire | · | · | · | · | · |

_Les 35 zones sans leçon (combat/texte/ambiant seuls) parmi les 83 ne figurent pas ici :
elles n'ont pas de pool kanji propre et seront traitées comme sous-partie du lot de leur
région (dialogues de dresseurs/ambiants légers) — voir npc-inventory.md._

### Zones à placements sans dialogues — rattachement explicite (phase 0.7)

8 zones ont des `content/map/placements/<zone>.json` et/ou un roster ROM mais zéro
dialogue écrit ; sans rattachement explicite elles risquaient de tomber entre deux lots.
Décidé à la revue du 2026-07-23 :

| Zone | Dresseurs ROM | Rattachement | Note |
|---|---:|---|---|
| route-5-kanto | 0 | ✅ clos (fusionné route-6-kanto, Lot 11) | Contenu (vieille dame/Talisman) déjà écrit sous le zone_id route-6-kanto (guidebook-adapted.md L1214 : « roster fusionné dans le guide »). Le zone_id route-5-kanto lui-même n'aura jamais de fichier propre. |
| route-7-kanto | 0 | Lot 14 (celadon-city) | Ambiant seul (Young Couple Moe & Lulu, Super Nerd Sam, guidebook L1234) — route de transit Céladia↔Safran. |
| route-19-20-seafoam | 19 | Lot 15 (fuchsia-city) | Vrai roster de combat (19 dresseurs) — géographie du guide (Fuchsia → Route 19/20 → Cinnabar). |
| cinnabar-island | 0 | Lot 15 (fuchsia-city), sous-partie avec seafoam | Blaine (93q) relocalisé ici ou en Lot 18 selon confirmation de l'emplacement exact (voir Lot 18 dans ce prompt) — la zone elle-même n'a pas de roster propre. |
| route-21-kanto | 12 | Lot 17 (viridian-city/pallet-town) | Vrai roster de combat (12 dresseurs), déjà noté sous-partie du Lot 17 dans le plan de phase 3. |
| route-22-kanto | 0 | Lot 17 (viridian-city/pallet-town) | 0 dresseur ROM — obstacle/placement seul, déjà noté sous-partie du Lot 17. |
| cerulean-cave | 0 | Lot 18 (queue, post-Mont Argenté) | 0 dresseur ROM, aire post-game canon (16 badges + Pokédex national) — cohérent avec la fin de la passe plutôt qu'avec Azuria (Lot 13, déjà clos). |
| whirl-islands | 0 | ✅ clos (Lot 4) | Obstacle 渦 déjà posé, 0 PNJ sourcé — rien à écrire. |
