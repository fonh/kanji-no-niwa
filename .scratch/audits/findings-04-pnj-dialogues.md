# Audit 04 — PNJ, dialogues et règles de langue — Findings

Session du 2026-07-06. Périmètre : format dialogue (`state_rules`/`dialogue_states`/pages),
furigana, inventaire PNJ vs beats du guidebook, taxonomie des interactions, PNJ récurrents
multi-zones, règles de langue des dialogues existants.

Docs lus : `.scratch/kanji-no-niwa/PRD.md` (§ Langue, § Mouvement, § Dresseurs de Route,
§ Fukuda, § Implémentation), ADR-0001/0002/0004, `CONTEXT.md`, `content/npc-inventory.md`
(intégral, 68 zones), `content/guidebook-adapted.md` (échantillonné + sections transverses),
`content/texts-progressifs.md`, `content/curriculum-checkpoints.md` (§ règles absolues),
les 12 dialogues existants (`content/dialogues/npcs/**`, `content/dialogues/trainers/route-29/*`),
`content/map/npcs.json`, `content/map/placements/cherrygrove-city.json`.

Classement : **A** contradiction interne · **B** promesse sans données · **C** promesse sans
mécanisme · **D** ambiguïté · **E** obsolète.

---

## A — Contradictions internes

### 04-A1 — Noms de dresseurs en français dans le contenu (règle transverse n°1 violée)

Les 10 fichiers `content/dialogues/trainers/route-29/*.json` portent des noms français dans
le champ `name` : « Gamin Ken », « Fillette Yuki », « Oiselier Sora/Aoi/Kai »… Le PRD
lui-même bénit cet usage : `PRD.md:173` cite « nommer les dresseurs (ex. "Gamin Ken") ».
Or `PRD.md:33` : **« Aucun français nulle part dans le jeu »** — et le nom du dresseur est
affiché au joueur (écran VS `PRD.md:190`, accroche de combat `PRD.md:188`, conventions HGSS).
Contradiction frontale. → **Grill** : langue de remplacement (japonais intégral ? classe
anglaise + prénom ?). Résolu au grill : **japonais intégral** (classe + prénom en katakana,
champ `name` biligue `{jp, en}`).

### 04-A2 — Règle des « 2 kanji inconnus max » : trois unités incompatibles

- `PRD.md:429` : « la règle des 2 kanji inconnus max **par page de dialogue** … sur une
  page donnée, au plus 2 de ces kanji peuvent apparaître comme inconnus » ;
- `CONTEXT.md:36` (Kanji Budget) : « across all its Dialogue States and pages **combined**…
  **Applies per dialogue, not per page or sentence** » ;
- `curriculum-checkpoints.md:31-33` : « un PNJ/panneau/inscription ne peut utiliser que… plus
  2 kanji inconnus maximum » — unité non dite (lecture naturelle : par PNJ, donc par dialogue).

Trois docs de référence, trois lectures. L'écart est majeur pour l'écriture du contenu
(2 par page × 5 pages = 10 inconnus par dialogue vs 2 au total). → **Grill**. Résolu :
**par dialogue** (toutes pages et états confondus), CONTEXT.md fait foi ; PRD:429 reformulé.

### 04-A3 — Route 36 : « CS Marteau-Piqueur (力) » — mauvais kanji, double attribution

`npc-inventory.md:349` et `guidebook-adapted.md:588` : « Jeune homme près d'un panneau
(ouest) | Donne le CS Marteau-Piqueur (**力**), débloqué dès le badge de Falkner ». Or :
- 力 = **Force**, remis par le Hiker de la Route 42 (`PRD.md:142`, `npc-inventory.md:516`
  « CS Force (力) » — donc 力 attribué deux fois) ;
- le PNJ de la Route 36 donne **砕 (Éclate-Roc / Rock Smash)** : `PRD.md:144`,
  `guidebook-adapted.md:572` et `:1177` (table CS) — trois sources concordantes ;
- « Marteau-Piqueur » n'est le nom d'aucun des 7 CS-Kanji (vocabulaire fantôme, aussi
  présent en flavor à `guidebook-adapted.md:258`).

Correction directe (le PRD fait foi) : les deux lignes passent à « CS Éclate-Roc (砕) ».

### 04-A4 — `guidebook-adapted.md:1350` : liste CS auto-contradictoire et périmée

« les CS-Kanji restent **飛/水/力 uniquement**, pas d'équivalent pour Flash/Cut/**Strength**/
Rock Climb/**Surf** » — auto-contradictoire (力 *est* Strength, 水 *est* Surf, tous deux dans
sa propre liste) et contredit la règle globale du même fichier (`guidebook-adapted.md:29` :
7 CS-Kanji dont 切/砕/滝/渦, réécrit 2026-07-03). Trace du modèle « 3 CS » d'avant le
2026-07-02. Correction directe. (Classé aussi E.)

---

## B — Promesses sans données

### 04-B1 — La carte EXPN n'est remise par personne

Le réveil du Ronflex (bloqueur d'histoire devant la Grotte Taupiqueur) exige « l'émission
Flûte Poké de la **radio améliorée (carte EXPN**, après la quête de la Centrale Kanto) » —
`PRD.md:157-158`, `guidebook-adapted.md:969` et `:1186-1187`. Mais :
- dans le jeu d'origine, l'EXPN Card est remise par le directeur de la **station radio de
  Lavender Town** — zone absente des 68 zones de `npc-inventory.md` (liste complète vérifiée) ;
- le Directeur de la Centrale (`npc-inventory.md:888`) remet « une CT », pas la carte ;
- aucune autre occurrence d'un donneur d'EXPN dans tout le corpus (grep EXPN : 4 occurrences,
  toutes côté consommation).

Un objet indispensable à la progression Kanto n'a donc aucun point d'obtention. → **Grill**.
**Résolu (décision élargie au grill, 2026-07-06)** : le finding a révélé que Lavender n'était
ni dans les 68 zones ni dans la table des zones absentes (oubli non documenté de la passe
Kanto). Décision : **réintégration de toute la géographie traversable de HGSS** — Lavender
Town (sa station radio remet l'EXPN comme en jeu), Routes 5/8/22, Union Cave, Routes
41/43/46, intérieur des Ruines d'Alph, Îles Tourbillon (donjon optionnel, seul vrai terrain
du CS 渦), **Safari Zone adaptée** (on y attrape des contenus de lecture — mangas, textes —
au lieu de Pokémon). Seul le Battle Frontier reste hors scope. Chiffrage budgets/calibration
à la synthèse (audit 09), même modèle que Grotte Sombre/Mont Mortier.

---

## C — Promesses sans mécanisme

### 04-C1 — La convention furigana `漢字（かな）` n'est normée nulle part (prévu par le prompt)

Les 12 dialogues existants écrivent les lectures inline dans le champ `jp` :
`道場（どうじょう）` (`mom_new_bark.json:17`), `町（まち）`, `店（みせ）`
(`guide_gent_cherrygrove.json:14-15`). Le moteur doit **parser** cette convention pour que
le bouton Y (`PRD.md:126`) puisse masquer/révéler — mais aucun doc de référence ne la
spécifie : `PRD.md:126` ne définit que le comportement du bouton, `CONTEXT.md:31-33` parle
d'« already-authored inline reading » sans format, ADR-0001:21 mentionne les furigana
sans format non plus. Non normé : parenthèses pleine largeur vs ASCII, groupement (par mot
`道場（どうじょう）` vs par kanji), collision avec une parenthèse littérale, portée du
toggle Y. Correction : **norme écrite dans ADR-0002** (doc de référence du contenu dialogue),
conforme au format déjà appliqué par les exemples.

### 04-C2 — « Les dialogues graduent vers 100% japonais » : aucun mécanisme au niveau page

`PRD.md:37` (mécanisme A) promet que « les dialogues de leçon et NPC graduent vers 100%
japonais et n'affichent plus jamais d'anglais une fois la graduation faite (voir C) ». Mais
le mécanisme C (`PRD.md:39`, réécrit audit 03) est défini **par mot** (stabilité FSRS ≥ 30 j)
— inapplicable tel quel à une **page** de dialogue, qui est une phrase entière avec sa
traduction `en` révélée par le bouton X (`PRD.md:125`, inconditionnel). Rien ne dit quand —
ni si — la traduction X d'une page cesse d'être disponible. La question du prompt (« comment
marquer "première exposition faite" ? ») est elle-même périmée : l'audit 03 a remplacé
l'usage-unique par la graduation FSRS — il n'y a **rien à marquer** dans le format pour les
champs de quiz ; seul le cas « page de dialogue » restait sans règle. → **Grill**. Résolu :
**le bouton X n'est jamais retiré** (consultation à la demande, symétrique du bouton Y —
registre « fiches de référence » de `PRD.md:40`) ; la phrase du mécanisme A est reformulée
pour ne viser que les champs de quiz/leçon.

### 04-C3 — Panneaux et objets au sol : mécanique définie, registre absent

`texts-progressifs.md:126-132` applique aux textes trouvés « les deux mécanismes de
`map_npcs` » (`talk` par défaut, `sight_auto`/`block` pour verrouiller) et le schéma prévoit
`texts.npc_ref` **ou** `found_object_ref` (`PRD.md:745`). Mais aucun registre ne porte la
**position** d'un objet trouvé/panneau : le schéma (`PRD.md:736-758`) n'a que `map_npcs` et
`map_trainers` ; `found_object_ref` ne pointe vers rien de défini. La taxonomie complète des
interactions est sinon couverte : talk/sight_auto (`PRD.md:748`), leçon = `role` sur
dresseur/PNJ (`PRD.md:747-748`), panneau/objet = entité talk-able… sans table. → **Grill**.
Résolu : **entrées du même registre `map_npcs` avec champ `kind`** (`npc` | `object` | `sign`),
pas de table séparée.

---

## D — Ambiguïtés

### 04-D1 — PNJ récurrents multi-zones : « un PNJ = une zone » jamais énoncé

Eusine (Tour Embrasée, Irisia, Route 42, Oliville cameo, Routes 24-25 — `guidebook-adapted.md:71`,
`npc-inventory.md:408,498,517,813,930`), Silver (×6 officielles + 3 bonus), Lance (×4), Bill (×2),
photographe itinérant (×10, `guidebook-adapted.md:70`). Le layout
`content/dialogues/npcs/<zone_id>/<npc_id>.json` (`PRD.md:779`) et le registre par tuile
impliquent **une entrée et un npc_id par apparition** — mais ce n'est écrit nulle part, et le
lien narratif entre les apparitions (fil Eusine, carnet du photographe) n'a pas de support
nommé. → **Grill**. Résolu : **un npc_id par (personnage × zone)** (ex. `eusine_burned_tower`,
`eusine_cianwood`), fil narratif porté par une `Quest` partagée référencée dans les
`state_rules` de chaque apparition — exactement le modèle multi-PNJ d'ADR-0004, appliqué à
« multi-zones ».

### 04-D2 — `trigger_type` désigne deux choses sans rapport

`map_npcs.trigger_type` = mode de déclenchement (`talk` | `sight_auto`, `PRD.md:748`) ;
`fukuda_messages.trigger_type` = type d'événement déclencheur d'une lettre (badge, Silver…,
`PRD.md:632` et `:758`). Collision de nom entre deux vocabulaires. Correction directe :
le champ Fukuda est renommé `event_type` (aucune décision de design, pur renommage doc).

### 04-D3 — Baoba : « fil probablement à couper » + rappel téléphonique sans mécanisme

`guidebook-adapted.md:72` : « ce fil est probablement à couper ou à transformer en simple
PNJ ambiant » — indécision incompatible avec la décision « aucune v2 » (2026-07-06). De plus
son « rappelle plus tard par téléphone » n'avait aucun support : l'onglet Téléphone du
Pokégear ne contenait que Fukuda (`PRD.md:79`, resserré audit 03). → **Grill**.
**Résolu (double revirement au grill, 2026-07-06)** : (1) le **Pokégear-Téléphone redevient
fidèle à HGSS** — Fukuda (unique canal SRS) + appels scénarisés (Elm, Lyra, Mom, Baoba…) +
registre de dresseurs avec appels entrants et re-matchs ; contenu des appels dans un espace
dédié `content/dialogues/calls/<caller_id>.json`, même format que les dialogues PNJ.
Revirement partiel sur 03-C1, mais **l'invariant combat⊥SRS est intégralement préservé**
(un re-match pioche `studiedSet`, aucun appel ne mentionne jamais les cartes dues).
(2) La **Safari Zone est réintégrée** (voir 04-B1). Conséquence : **le fil Baoba est
conservé en entier** (Route 39 → rappel téléphonique → entrée de la Safari Zone).

### 04-D4 — Champs `jlpt_level` et `name` des JSON hors format documenté (mineur)

Les 12 fichiers dialogues portent `jlpt_level` et `name`, absents du format décrit à
`PRD.md:779` ; `name` est de plus dupliqué entre `content/map/npcs.json` et le fichier
dialogue (source de divergence). À fixer dans la norme ADR-0002 (04-C1) : le fichier
dialogue est la source de vérité du `name` affiché ; `jlpt_level` documenté comme champ
de calibration.

---

## E — Obsolète

### 04-E1 — `CONTEXT.md` : « Adaptive Furigana » définit un mécanisme aboli

`CONTEXT.md:31-33` : « per-kanji choice to show or hide… based on whether the player has
studied that kanji yet » — c'est exactement le « furigana adaptatif » supprimé par
`PRD.md:126` (révisé 2026-07-01 : plus aucun affichage automatique, Y à la demande).
`CONTEXT.md:36` (Kanji Budget) répète « names… **always shown** with Adaptive Furigana ».
Correction directe : l'entrée devient « Inline Reading » (lecture inline auteur, masquée par
défaut, révélée par Y — pointe la norme ADR-0002) ; Kanji Budget reformulé (les noms restent
exemptés du budget, leur lecture est révélable comme le reste).

### 04-E2 — `texts-progressifs.md` : table CS-Kanji à 6 entrées, fusion Kurt/Maître du Charbon

`texts-progressifs.md:309` : « 切 (Coupe) | **Kurt (Maître du Charbon)** » — fusion corrigée
au PRD le 2026-07-03 (`PRD.md:143` : deux PNJ distincts d'Ecorcia). `texts-progressifs.md:313` :
« Les **6** CS-Kanji couvrent désormais l'intégralité… » et la table (`:304-311`) n'a que
6 lignes — **砕 (Éclate-Roc) manque** (7 CS depuis le 2026-07-03). Correction directe.

### 04-E3 — ADR-0001 cite un répertoire inexistant

`docs/adr/0001-…md:13` : « mirroring the existing Fukuda split (`content/dialogues/fukuda/`) »
— le répertoire n'existe pas et n'a jamais existé (aucune trace git). Correction directe
(note d'exactitude, l'intention du split reste valable — `PRD.md:632` le promet toujours).

### 04-E4 — `curriculum-checkpoints.md:548` : type `trainer_fixed` fantôme

« les PNJ sans quête (type `trainer_fixed`) » — vocabulaire d'un modèle disparu, aucune
autre occurrence dans le corpus (le modèle actuel : `role` sur `map_trainers`/`map_npcs`).
Correction directe (reformulé sans le type).

### 04-E5 — `CONTEXT.md:40,44` : listes Condition/Effect périmées — **Reporté à la synthèse**

L'entrée Condition liste encore `kanji_count` et 6 types (manquent `count` généralisé,
`all_texts_read`, `time_window`, le modificateur `negate`) ; l'entrée Effect s'arrête à
4 types (manquent `unlock_text`, `remove_item`). Périmètre audit 02 — signalé, non corrigé ici.

---

## Règles de langue — échantillonnage des dialogues existants

- **jp** : niveau N5 respecté (phrases 5-12 caractères, grammaire ～ください/～ます/～ましょう),
  lectures inline présentes sur chaque kanji (`道場（どうじょう）`, `町（まち）`, `店（みせ）`),
  budget kanji tenu quelle que soit l'unité retenue (mom : 道+場 = 2 inconnus ; guide gent :
  町/店 = 2). ✅
- **en** : anglais conforme ADR-0002. ✅
- **Français** : aucun dans `jp`/`en` ; présent uniquement dans les champs `name` des
  dresseurs (04-A1) et dans `position_status` de `content/map/npcs.json` (note de travail
  interne, jamais affichée — toléré). ⚠️ via 04-A1.
- Guide Gent : l'état `farewell` rejoue « これを どうぞ。ちずです。 » à chaque visite alors
  que le `grant_item` est inerte après la première (idempotence) — il manquera un 3ᵉ état
  `done` à l'écriture du contenu. Non corrigé (aucun dialogue écrit pendant les audits),
  simple note pour l'équipe contenu.

## Inventaire → beats du guidebook — vérification de couverture

- Silver ×6 + 3 bonus ✅ (`npc-inventory.md:74,214,410,300,554,719` + `:1082,1242,1285`)
- Kimono ×5 + gauntlet ✅ (`:132,249,386,301,605` + `:392`)
- Donneurs CS-Kanji : 6/7 ✅, Route 36 mal étiqueté (04-A3) ; 滝 sans PNJ = voulu (puzzle)
- Arrosoir (Fleuriste Floria) ✅ `:291` ; radio EXPN ❌ (04-B1)
- 16 gym leaders + Elite 4 + Lance ✅ (zones dédiées `:712-799`, villes)
- PNJ récurrents transversaux ✅ tous placés zone par zone (04-D1 pour le modèle)
- Chaque PNJ de l'inventaire a zone (section) + rôle d'origine + objet/quête ✅ ;
  colonne « Type assigné » volontairement vide (post-audits, comme prévu)

## Interfaces signalées (non corrigées ici)

- **Audit 02 / synthèse** : 04-E5 (CONTEXT.md Condition/Effect périmés) ; le champ `kind`
  du registre (04-C3) touche le schéma DB → à répercuter audit 08.
- **Audit 06 (leçons)** : le blocage d'ordre des leçons est référencé comme « même mécanique
  `sight_auto`/`block` » (`texts-progressifs.md:129-130`) — vérifier que § Leçons du PRD le
  définit bien de son côté.
- **Audit 05 (textes)** : les règles de langue des panneaux existent
  (`curriculum-checkpoints.md:552+`), leur registre de placement dépend de 04-C3.
- **Synthèse** : sort des « 8-10 dresseurs SRS » de la Route 29 (`npc-inventory.md:59`,
  déjà reporté par l'audit 01).

## Reporté à la synthèse

- 04-E5 (ci-dessus).
- Les dresseurs Route 29 (hérité audit 01).
- Nommage japonais effectif des 10 dresseurs Route 29 existants : la **règle** est corrigée
  (04-A1), la **réécriture des champs `name`** des JSON est du contenu — hors « aucun
  dialogue écrit pendant les audits », à faire en passe contenu.
- **Chiffrage des zones réintégrées** (04-B1 élargi) : budgets kanji, insertion dans la table
  de calibration de `curriculum-checkpoints.md`, sections d'inventaire PNJ à sourcer pour
  Lavender/Routes 5-8-22-41-43-46/Union Cave/Ruines intérieur/Îles Tourbillon/Safari Zone.
- **Design de la Safari Zone adaptée** (collection de contenus de lecture — mangas, textes)
  et de l'adaptation des puzzles Unown (Ruines intérieur).
- **Périmètre du téléphone HGSS** (04-D3) : combien de dresseurs enregistrables, fréquence
  des appels entrants, schéma de données des appels — à croiser avec l'audit 08 (menus/DB).

## Passe de vérification post-corrections (2026-07-06, même session)

Grep systématique du corpus après application des corrections. Reliquats trouvés et corrigés :

- `curriculum-checkpoints.md` (table PNJ sourcés) : « Jeune homme du Marteau-Piqueur » → Éclate-Roc (砕) — dernière occurrence du vocabulaire fantôme de 04-A3.
- **Défusion Route 41 non répercutée** (implication de la réintégration) : `PRD.md` § Ordre des zones (« Route 40 (inclut Route 41) » + note audit 01), `guidebook-adapted.md` §
  cianwood (note « absorbée dans Route 40 », liste des Nageurs), `npc-inventory.md` § route-40
  (ligne Swimmers R41) — tous annotés ; les nageurs R41 retourneront à leur section quand elle
  sera sourcée.
- « Hors scope » périmés sur zones réintégrées : `guidebook-adapted.md` table des classes
  (Union Cave), itinéraire 79 étapes (Union Cave), § route-45 (Route 46),
  `side-content-inventory.md` E11 (Route 46).
- `guidebook-adapted.md` § oliville : « Kanto hors scope » (Quai SS Aqua) — trace d'avant
  l'adoption du Kanto (2026-07-01), purgée ; rôle du SS Aqua → synthèse.
- `guidebook-adapted.md` § ruins-of-alph : « Zone Safari supprimée » reformulé « Chasse aux
  Unown supprimée » (collision de nom avec la Safari Zone réintégrée).
- `PRD.md` § Volume PNJ-leçon : annotation « comptes de zones hors réintégrations, recalcul à
  la synthèse ».

Vérifié sans correction nécessaire : table CS de `texts-progressifs.md` (7 lignes, ordre OK),
échappement des pipes dans la ligne `map_npcs` du schéma PRD (table intacte), aucune occurrence
restante de « messages des dresseurs » / « Les 6 CS » / `trainer_fixed` / « Adaptive Furigana »
hors mentions correctives, boucle quotidienne PRD:89 compatible avec le téléphone rétabli.

**Résidus signalés (non corrigés — hors décision de cette session) :**
- **Tour Jo : « bâtiment tappable » (guidebook-adapted.md § ecruteak) vs l'ascension complète
  documentée (§ Tour Jo, passe 2) et le traitement set-piece d'ADR-0004 (Bell Tower, un
  `zone_id` par étage)** — trois lectures qui coexistent, et aucune section `bell-tower` dans
  `npc-inventory.md` alors que l'itinéraire exige « Tour Jo (Ho-Oh) ». Avec « aucune v2 » +
  la fidélité HGSS tranchée à cet audit, la réponse probable est l'ascension réelle — mais
  c'est une décision de design non grillée ici → **synthèse**.
- `guidebook-adapted.md` § new-bark (L129) : « le Pokégear sert aux push notifications » —
  formulation floue d'avant l'audit 03 ; redevient partiellement pertinente avec les appels
  entrants rétablis, à harmoniser à la synthèse avec le périmètre téléphone.
- `content/map/story-beats.json` et `placements/` couvrent 49 zones — les zones réintégrées
  n'y ont pas d'entrée (attendu : données produites après chiffrage à la synthèse).

## Chasse aux reliques (session 3, 2026-07-06) — 12 items grillés

Grep systématique du corpus (vocabulaire d'anciens designs, mécaniques Pokémon non adaptées
dans les couches adaptées, indécisions fossiles). Décisions :

| # | Relique | Décision | Appliqué |
|---|---------|----------|----------|
| R1 | `story-beats.json` : « rank 4 », « rank 7/Silver lettre 2 », « en v2 » (Karate King) — purges audit 03 non répercutées dans les données | Supprimer/aligner | ✅ |
| R2 | « mode Écriture » (`jlpt-language-syllabus.md:321`) | Renommé « Saisie » | ✅ |
| R3 | `/sensei` (`guidebook:113`) — chemin d'URL d'un ancien design web-app, route inexistante | Reformulé « écran de Fukuda » | ✅ |
| R4 | « push notifications » (`guidebook:129`, `:491` Buena) | Reformulés (appels entrants ; émission radio 11h00) | ✅ |
| R5 | `CONTEXT.md` Condition/Effect périmés (kanji_count, types manquants) | Alignés sur l'audit 02, sans attendre la synthèse | ✅ |
| R6 | Rock Climb « hors scope v1, à trancher plus tard » (`PRD:151-153`) | **Réintégré : 8ᵉ CS-Kanji 登 (Escalade)**, Prof Chen après 16 badges ; parois Mont Gris = terrain à exporter, chiffrage synthèse. Seul Flash reste sans équivalent | ✅ (PRD, guidebook ×3, texts-progressifs) |
| R7 | Day Care « supprimée » (`guidebook:476`) | **Réintégrée** : bâtiment Route 34 + couple (grands-parents de Lyra) en PNJ sourcés ; aucune mécanique d'élevage | ✅ |
| R8 | Game Corner « PNJ adaptable en autre chose » (`guidebook:516`) / « décor » (Céladia) | **Adaptés en mini-jeu de kanji contre jetons** (les deux) ; Coin Case fonctionnel ; design à la synthèse | ✅ |
| R9 | Loterie « supprimée du scope » + fausse cross-ref « déjà au PRD » (`guidebook:1273`) | **Réintégrée** (tirage quotidien, Tour Radio 1F) ; mécanisme/récompense à la synthèse ; cross-ref corrigée | ✅ |
| R10 | Concept « compagnon » jamais défini (~54 mentions : gauntlet Kimono, Naoko, starter, œuf mystère, Eevee de Bill, Shuckle, Daisy, Karate King, ID Loterie) | **À designer à la synthèse** — aucun contenu ne s'écrit sur ces beats avant ; note normative ajoutée au PRD § Kimono Girls | ✅ |
| R11 | Master Ball = objet de capture sans fonction, utilisé comme jalon (« post-Master Ball ») | **Adaptée : « grand texte d'Elm »** — texte de lecture majeur (manga/dictionnaire/magazine, support choisi à la passe contenu) ; jalon renommé partout (PRD ×2, guidebook, npc-inventory) | ✅ |
| R12 | Bâtiments « tappables/décoratifs » d'avant ADR-0004 : Tour Jo, Tour Embrasée, Sprout Tower, Phare | **Vrais intérieurs multi-étages** (un zone_id par étage) ; Tour Jo = ascension 1F→10F+toit (résout le résidu de la passe 2) ; tile-authoring/budgets à la synthèse | ✅ |

## Candidats d'adaptation relevés pendant la chasse (→ synthèse)

Autres éléments du monde Pokémon présents dans les couches adaptées, sans fonction définie —
même traitement que la Master Ball (adaptation pédagogique) à décider à la synthèse :

1. **Objets de combat/équipement** sans mécanique : Exp. Share, TwistedSpoon, Hard Stone,
   HP Up, Everstone, les CT/TM restantes (TM44 Rest, TM70 Flash de l'Ancien Li, CT de la
   Centrale) — candidats « objets de lecture/collection ».
2. **Cannes à pêche** (Old/Good/Super Rod) — pas de pêche ; « pêcher des textes » ?
3. **Bicyclette + Cycling Road** (routes 16-18 existent comme zone) — la descente à vélo est
   dans la géographie, l'objet Bicyclette n'a pas de mécanique.
4. **Dowsing MCHN** (Rosalia) — candidat fort : détecteur de textes/objets cachés (s'articule
   avec le menu « textes non découverts » de texts-progressifs).
5. **Blue Card / points Buena** — récompense d'écoute de l'émission de 11h (R4), cohérente
   boucle quotidienne ; à spécifier.
6. **Économie/monnaie** : tension non résolue — « Pokémart simplifié, pas de système d'achat »
   (guidebook cherrygrove) vs `monnaie` citée comme `fungible` (audit 02) vs jetons du
   Game Corner (R8) vs « Heal Ball (vente) » dans l'inventaire. Faut-il une monnaie ?
7. **Pokéathlon** (Parc National : Magnus, Apriblender, jersey) — `pokeathlon_score` cité en
   exemple de métrique `count` (audit 02) mais l'activité n'est définie nulle part.
8. **Pokédex remis par Oak** (Route 30) vs Kanjidex natif du menu START — que remet Oak dans
   le jeu adapté (le Kanjidex ? la Carte Mot ? un déblocage) ?
9. **SS Aqua** (traversée Oliville↔Vermeille) — déjà flaggé à la passe 2.

## Décisions du grill (récapitulatif, 2026-07-06)

1. **Bouton X jamais retiré** — les dialogues ne « graduent » pas ; le mécanisme A ne vise
   que les champs de quiz/leçon (04-C2).
2. **Budget kanji : 2 inconnus max par dialogue entier** — CONTEXT.md fait foi (04-A2).
3. **Noms affichés en japonais intégral**, champ `name` bilingue `{jp, en}` (04-A1).
4. **PNJ multi-zones : un `npc_id` par (personnage × zone) + `Quest` partagée** (04-D1).
5. **Panneaux/objets au sol : entrées `map_npcs` avec `kind` (npc | object | sign)** (04-C3).
6. **Réintégration de toute la géographie HGSS** + Safari Zone adaptée ; Battle Frontier
   seul hors scope ; EXPN remise par le directeur radio de Lavender (04-B1).
7. **Pokégear-Téléphone HGSS complet**, espace contenu `content/dialogues/calls/`,
   invariant combat⊥SRS préservé (04-D3 — revirement partiel sur 03-C1).
8. **Fil Baoba conservé en entier** (04-D3).

## Session 4 (2026-07-06) — doctrine « tout utilisable, comme dans le jeu »

Décision produit (verbatim : « je veux tout utilisable, comme dans le jeu ») qui clôt les deux
questions restées ouvertes après la session 3 : le sort des intérieurs « décoratifs/tappables »
et l'adaptation des mini-jeux. Norme ajoutée au PRD § La Carte de Johto :

1. **Aucun bâtiment décoratif, aucune interaction « tap façade → écran »** : tout bâtiment à
   porte de HGSS a un intérieur réel navigable (un `zone_id` par pièce/étage, généralisation
   d'ADR-0004), entrée en marchant (warp), fonctions portées par les PNJ intérieurs.
2. **Toute mécanique sans équivalent direct est adaptée en boucle pédagogique, jamais
   supprimée** — étend le précédent Safari/Game Corner à tout le monde du jeu. Hors scope
   résiduels : Battle Frontier (04-B1) et les mécaniques de capture telles quelles.

Application (grep systématique tappable/décoratif/supprimé) :

| # | Item | Décision |
|---|------|----------|
| U1 | Maison de Fukuda, maison de Kurt (dépôt Apricorns via Talk), Centres Pokémon (infirmière → session SRS), Gyms (porte réelle) | Intérieurs réels, fonctions sur les PNJ |
| U2 | Sprout Tower (section dédiée), Tour Embrasée (section dédiée), Tour Radio, Repaire Rocket d'Acajou (sous le magasin de souvenirs), Puits Ramoloss, Antre du Dragon | Reliquats « tappable » non répercutés des corrections session 3/ADR-0004 — alignés (intérieurs multi-étages réels) |
| U3 | Librairie de Doublonville (ex-Dept Store) | « Décoratif » → intérieur réel 6 niveaux + sous-sol, PNJ sourcés |
| U4 | Game Corner / Loterie / lignes « supprimé » de la section goldenrod | Reliquats non répercutés de R8/R9 — alignés |
| U5 | Global Terminal | Réintégré (bâtiment réel) ; fonction adaptée à designer à la synthèse |
| U6 | Pension Route 34 | Révision de R7 : mécanique adaptée (dépôt/maturation, liée au concept « compagnon » R10), design à la synthèse — plus « aucune mécanique » |
| U7 | Bug Catching Contest (Parc National) | Réintégré adapté : concours calendaire mar/jeu/sam de collecte/lecture, modèle Safari ; C15 aligné |
| U8 | Puzzle Farfetch'd (Forêt Secte) | Réintégré adapté (guidage spatial) ; articulation avec la remise du CS 切 à la synthèse |
| U9 | Pharmacie d'Irisia | Réintégrée — « supprimée » contredisait la quête B3 (Potion Secrète/Phare) déjà à l'inventaire |
| U10 | SS Aqua | « Décor/atmosphère » → traversée réelle Oliville↔Vermeille, navire navigable (quêtes B6/C9) ; jours/fréquence à la synthèse |
| U11 | Inscriptions Unown, panneau de départ Route 29 | Normalisés en entrées `kind: sign` (04-C3) ; « furigana sur kanji non étudiés » (relique du mécanisme adaptatif aboli) purgé au passage |
| U12 | Mont Mortier « reste décoratif en v1 », Forêt Secte « décor uniquement » | Étiquettes fossiles purgées (contredisaient des réintégrations déjà actées) |
| U13 | Pokémart « pas de système d'achat » (cherrygrove) | Bâtiment réel navigable, vendeur sourcé ; la fonction d'achat dépend de la décision monnaie (candidat #6, session 3) → synthèse |

**Renvois à la synthèse (audit 09) ouverts par cette session :** design des boucles adaptées
(Game Corner, Loterie, pension, concours du Parc, Safari, Global Terminal, puzzle Farfetch'd),
modalités SS Aqua, tile-authoring et budgets des intérieurs convertis (le compte de zones
`zone_id` va croître substantiellement — chaque maison/étage en ajoute).
