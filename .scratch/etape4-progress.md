# Suivi Étape 4 — Passe contenu industrielle (漢字の庭)

Fichier de trace créé 2026-07-17 à la demande de l'utilisateur (« un fichier pour garder
une trace à chaque étape »). Une ligne par zone de croissance. **Le comptage
(leçons/kanji/PNJ) est déjà figé** en amont — ce document ne le recalcule pas, il suit
l'avancement de la *rédaction* de chaque zone.

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
