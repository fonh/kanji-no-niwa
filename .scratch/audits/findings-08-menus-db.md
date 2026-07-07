# Findings — Audit 08 : Menus, Pokégear, Sac et modèle de données

Date : 2026-07-07. Docs audités : `.scratch/kanji-no-niwa/PRD.md` (§ Interface — Menu Principal/Pokégear, § Kanjidex, § Carte Mot, § Sac/Journal via § Textes Progressifs, § Profil/Streak/Achievements, § Monnaie ¥ & chambre, § Sensei Fukuda, § Implémentation — Schéma + Condition/Effect + ProgressionEngine + Pipeline + Audio), `content/guidebook-adapted.md` (§ Bâtiments récurrents, § Musique, § CS-Kanji, § Apricorns), `content/texts-progressifs.md` (§ Menu "tous les textes"). Migrations `supabase/migrations/001-006` non comparées — l'écart code/PRD n'est pas le sujet (consigne du prompt).

Classes : **A** contradiction · **B** promesse sans données · **C** promesse sans mécanisme · **D** ambiguïté · **E** obsolète.

---

## Matrice écran × données

Chaque donnée affichée promise par le PRD, croisée avec le modèle de données du PRD (table + champ). ✓ = couvert ; 🔴 = finding.

### START 1 — 図鑑 (Kanjidex, PRD:687-722)

| Donnée affichée | Source modèle | Statut |
|---|---|---|
| Grille 2136 tiles, états grisé/blanc/doré | `kanji` + `srs_cards` (existence carte / stabilité ≥14j) | ✓ dérivable |
| Filtres JLPT / statut | `kanji.jlpt_level` + `srs_cards` | ✓ |
| Fiche : caractère, sens, lectures, étymologie, mnémotechnique, JLPT | `kanji.character/meanings/readings/etymology/mnemonic/jlpt_level` | ✓ |
| Fiche : **grade scolaire** (PRD:716) | aucun champ | 🔴 08-B7 |
| Fiche : composants cliquables (PRD:719) | table `kanji_components` (pipeline étape 2) **absente du schéma** | 🔴 08-B5 |
| Fiche : 6–8 mots contenant le kanji, avec lecture/sens/statut (PRD:720) | lien mots↔kanji inexistant, règle de sélection absente ; `words` n'a pas de champ sens anglais | 🔴 08-B8, 08-B6 |
| Fiche : 3 exemples de phrases par mot (PRD:721) | lien mots↔phrases inexistant | 🔴 08-B8 |
| Fiche : stabilité FSRS sens + lecture (PRD:722) | `srs_cards.stability` (2 facets) | ✓ |
| Carnet des compteurs 助数詞 (PRD:703-711) | aucune table (entrées, déblocage 1ʳᵉ rencontre) ; emplacement d'écran assigné à cet audit | 🔴 08-B11, 08-D3 |

### START 2 — レッスン (Carnet de leçons, PRD:315)

| Donnée | Source | Statut |
|---|---|---|
| Zones visitées, compteurs 3/7, leçon suivante (qui/où), ??? masquées | `lessons` (`sequence_index`, `npc_ref`, `kanji_ids[]`), `npc_quest_progress`, `visited_zones[]`, `completed_lessons[]` — « zéro donnée nouvelle » vérifié champ par champ | ✓ (audit 06) |

### START 3 — Sac (PRD:69, texts-progressifs:437-453)

| Donnée | Source | Statut |
|---|---|---|
| Objets par catégorie (Apricorns / CS-Kanji / objets de quête / décorations…) | `items` n'a **pas de champ catégorie** ; `name` monolingue (les dresseurs sont déjà passés à `{jp, en}`, 04-A1) | 🔴 08-B16 |
| Apricorns ×7 couleurs, quantités | `items` fungible + `inventory[].quantity` | ✓ (audit 02) |
| Cycle Kurt 24h (fournée en cours, type de Boule, échéance) — « système Kurt complet » | `npc_quest_progress` (user, quest, current_step) **sans horodatage** ; « advance_quest une fois par fenêtre » (audit 02) suppose la même donnée manquante | 🔴 08-B15 |
| Arrosoir, carte EXPN, Bicyclette, Dowsing MCHN, clés de quête | `items` unique + `inventory[]` | ✓ |
| Monnaie ¥, jetons Game Corner | `items` fungible | ✓ (I-8/I-3) |
| Journal de lecture : liste par **titre** (masqué « ??? » si non lu) | `texts` n'a pas de champ titre | 🔴 08-B9 |
| Journal : indice PNJ/objet porteur, filtrage zones débloquées | `texts.zone_id/npc_ref/found_object_ref` + `unlocked_zones[]` | ✓ (audit 04/05) |
| Journal : statut blanc vs **doré** | « doré = quiz réussi avec récompense » — indécidable sous retry-jusqu'à-correct (tout texte fini a son quiz réussi) ; type de récompense par texte sans domicile | 🔴 08-D8 |

### START 4 — Profil (PRD:70)

| Donnée | Source | Statut |
|---|---|---|
| Progression Silver 6 / Rocket 3 / Kimono 5 / Légendaires 3 | `silver_progress`, `rocket_progress`, `kimono_progress`, `legendary_progress` | ✓ |
| **Badges** (16 + jalons) | **aucun stockage** — ni table, ni champ `user_map_state` ; la `Condition.badge_earned` (PRD:863) n'a rien à lire | 🔴 08-B1 |
| **Achievements** (PRD:799-813) | **aucune table** ; la fanfare « débloqué » (PRD:973) exige de savoir que c'est la première fois | 🔴 08-B3 |
| Gauntlet Kimono vaincu (achievement PRD:809, gates :610/:618) | `kimono_progress.cleared_at` = les 5 **scènes** (audit 01) ; la victoire du gauntlet n'a aucun support | 🔴 08-B12 |
| **« stats »** | jamais énuméré | 🔴 08-D7 |
| Streak | calculé depuis `srs_reviews` | ✓ (audit 03) |

### START 5 — Options (PRD:71)

| Donnée | Source | Statut |
|---|---|---|
| « Paramètres » | aucun contenu défini, nulle part | 🔴 08-D1 |

### Pokégear 1 — Téléphone (PRD:79)

| Donnée | Source | Statut |
|---|---|---|
| Fukuda — lancer le SRS, ✓ du jour | `getDailySRSStatus` / `srs_reviews` | ✓ |
| Appels scénarisés, contenu | `content/dialogues/calls/<caller_id>.json` | ✓ |
| **Registre de dresseurs enregistrables** | aucun champ (le périmètre est chiffré à la synthèse, mais la donnée n'a pas de domicile) | 🔴 08-B10 |
| **Lettres de Fukuda** (36, `fukuda_messages.read_at`) | aucune surface de lecture définie — quel écran les affiche ? | 🔴 08-B17 |
| 即時応答 | design à la synthèse (acté) | ✓ reporté |

### Pokégear 2 — Carte (PRD:80)

| Donnée | Source | Statut |
|---|---|---|
| « Carte **Johto** complète » | fossile d'avant l'adoption de Kanto (2026-07-01) | 🔴 08-A3 |
| Voyage rapide 飛 « tap sur une ville visitée » (PRD:146) | même écran que l'onglet Carte ? jamais dit | 🔴 08-D6 |
| Zones visitées/grisées, ◎ quête | `visited_zones[]` ✓ ; **◎** : `quests.steps[]` = (step_id, label) sans cible zone/position | 🔴 08-B14 |
| Noms de zones affichés (japonais) | aucun registre de zones nulle part (cf. 08-C1) | 🔴 08-C1 |

### Pokégear 3 — Radio (PRD:81)

| Donnée | Source | Statut |
|---|---|---|
| Émission d'Oak hebdo, Buena 11h, Tableau du jour | « Designs à la synthèse » écrit deux fois — reporté, à confirmer au grill | 🔴 08-D2 |
| Rôle **gameplay** : émission Flûte Poké / carte EXPN (réveil Ronflex, PRD:166-169/:753-756) | absent de l'onglet ; moment d'activation de l'onglet (Radio Card, Tour Radio) jamais dit | 🔴 08-C2 |
| Points Blue Card de Buena (I-13, guidebook:522) | aucun domicile de données | 🔴 08-B13 |
| Tableau du jour | dérivable des `time_window` des registres | ✓ dérivable |

### Pokégear 4 — Grammaire (PRD:82)

| Donnée | Source | Statut |
|---|---|---|
| Glossaire des points rencontrés : formation, exemple, note | `grammar_encounters` + `grammar` (formation, `example_variants[]`, `short/long_explanation`) | ✓ (06-A3) |

### Carte Mot (PRD:726-740)

| Donnée | Source | Statut |
|---|---|---|
| Mot, lecture, photo, pitch accent, compound story, JLPT, statut SRS | `words.*` + `srs_cards` | ✓ |
| **Partie du discours, sens en anglais** (PRD:734) | `words` n'a ni `part_of_speech` ni `meanings` — le sens anglais est aussi le support des modes Sens/Saisie/Écoute non maîtrisés (PRD:217-225) | 🔴 08-B6 |
| Kanji du mot cliquables ; « kanji encore à étudier avant déblocage » | décomposition mot→kanji non précalculée (dérivable, mais contraire au principe « tout précalculé ») | 🔴 08-B8 |
| 3 exemples de phrases « registres variés : neutre, formel, familier » (PRD:739) | lien mots↔phrases inexistant ; `sentences.register` ne connaît que neutral (Tatoeba) et spoken (JESC) — « formel » n'a aucune source | 🔴 08-B8 |

### Transverses

| Sujet | Statut |
|---|---|
| Navigation : entrée/sortie de chaque surface (B ferme ? START/SELECT toggle ? SELECT avant remise du Pokégear ? quitter leçon/texte en cours ?) | 🔴 08-C3 |
| Labels affichés des écrans : « Sac », « Profil », « Options », « Téléphone », « Carte », « Radio », « Grammaire », « Journal de lecture » — français | 🔴 08-A1 |
| Musique : mécanisme zone→piste côté PRD | 🔴 08-A2, 08-C1 |
| Affichage des conditions non remplies (« 512/550 ») — emplacement assigné à cet audit (PRD:867) | 🔴 08-D4 |
| Écran de la chambre du joueur — assigné à cet audit (PRD:792) | 🔴 08-D5 |
| `event_cleared` / `pokeathlon_score` (Condition, PRD:863/:568) | 🔴 08-B2, 08-B4 |

---

## Vérifié sain (pas de finding)

- **Profil ↔ 4 tables de progression dédiées** : `silver_progress`/`rocket_progress`/`kimono_progress`/`legendary_progress` existent et portent exactement ce que l'écran promet (la raison d'être du slot, PRD:70) — c'était le point central du prompt, il tient.
- **Onglet Grammaire ↔ `grammar`/`grammar_encounters`** : rattachement complet depuis 06-A3, champ par champ.
- **Carnet de leçons** : « zéro donnée nouvelle » (PRD:315) vérifié — les 4 sources citées suffisent bien aux 3 états de ligne.
- **Kanjidex/Carte Mot = registre séparé** : anglais permanent assumé (§ Langue du Jeu, mécanisme dédié), distinction gameplay nette (inaccessibles en combat, PRD:691/728, cohérent avec « aucun bouton d'aide » de Disposition).
- **試練** : défini depuis 07-C3 (page de garde d'examen), guidebook:1095 aligné.
- **Apricorns** : mapping couleur→Boule corrigé et sourcé (guidebook:1146-1162), objets `fungible` (02-A2) — cohérent, hors le trou d'horodatage 08-B15.
- **Journal de lecture** : placement/indices entièrement couverts (`texts.zone_id/npc_ref/found_object_ref`, audits 04/05), « aucune nouvelle table » (texts-progressifs:452) tient — hors titre (08-B9) et blanc/doré (08-D8).
- **Streak, badge ✓ Pokégear** : calculables depuis `srs_reviews` (03-B2).

---

## Findings

### A — Contradictions

#### 08-A1 — Labels d'écran en français : « Sac », « Profil », « Options », « Téléphone », « Carte », « Radio », « Grammaire » ⚠️

PRD:65-71 donne les noms japonais des slots 1-2 (図鑑, レッスン) mais laisse les slots 3-5 et les 4 onglets Pokégear (PRD:77-82) sous leur nom de travail français, ainsi que « Journal de lecture » (PRD:69). Or ces noms **sont affichés au joueur** (slots du menu START, onglets) — même violation que « Gamin Ken » (04-A1, § Langue du Jeu : « aucun français nulle part »). La règle transverse 1 du prompt demandait explicitement cette vérification. Aucune version affichée n'est définie nulle part. → Grill : trancher les noms maintenant (proposition : バッグ・プロフィール・せってい / でんわ・マップ・ラジオ・ぶんぽう, conventions HGSS VO) ou renvoyer à la passe contenu.

#### 08-A2 — PRD § Audio : « Carte » en 3 tranches contredit le mapping zone-par-zone du guidebook

PRD:956-958 : « Carte (zones initiales) → New Bark Town ; (intermédiaires) → Route 29 ; (avancées) → Route Victoire ». `guidebook-adapted.md:1198-1228` définit depuis un mapping **par zone** (Disc/Track par zone, avec « faute de mieux » documentés et variante nuit). Les 3 tranches sont un fossile d'avant ce mapping — les deux ne peuvent pas être vrais en même temps. → Correction : le PRD § Audio pointe le mapping du guidebook comme source de vérité, les 3 lignes « Carte » sautent.

#### 08-A3 — Pokégear Carte : « Carte Johto complète » — fossile d'avant Kanto

PRD:80. Kanto est adopté depuis le 2026-07-01 (PRD:114, 22 zones) et 飛 est explicitement « intra-région uniquement » (PRD:146) — ce qui suppose deux régions sur la carte. Comme en HGSS (la Town Map affiche les deux régions). → Correction : « Carte Johto + Kanto, bascule entre régions ».

### B — Promesses sans données

#### 08-B1 — Les badges n'ont aucun stockage ⚠️ majeur

Tout le jeu repose dessus : `Condition.badge_earned` (PRD:863, ex. tuile mer Route 40 `badge_earned(morty)` PRD:841), écran Profil « Badges » (PRD:70), achievements « chacun des 16 » (PRD:805), gates Mont Gris/Red « 16 badges » (PRD:610/618), cérémonie du 印. Ni table dédiée, ni champ dans `user_map_state` (PRD:844 : la liste ne contient pas `badges[]`). → Correction : `badges[]` sur `user_map_state` (badge_id + earned_at), écrit par la logique de jeu à la cérémonie du 印 — même famille que `defeated_trainers[]`.

#### 08-B2 — `Condition.event_cleared` n'a rien à lire

Type utilisé partout (滝 : `event_cleared` sur le puzzle de glissades PRD:151 ; sbire B1F `negate: event_cleared(alarm_disabled)` PRD:865 ; `misty_met_viewpoint` PRD:865), mais aucun stockage des événements résolus — `user_map_state` (PRD:844) n'a pas de `cleared_events[]`, et rien d'autre ne les porte. → Correction : `cleared_events[]` sur `user_map_state`.

#### 08-B3 — Achievements : aucune table, et la fanfare exige la persistance

PRD:799-813 liste ~40 achievements, l'écran Profil les affiche, PRD:973 promet une fanfare « Achievement débloqué ». Presque tous sont **calculables** (srs_cards, text_completions, tables de progression…) mais « débloqué » (événement ponctuel : fanfare, première fois) exige de savoir ce qui a déjà été célébré. → Correction : table `achievements` (user_id, achievement_id, unlocked_at), écrite par la logique de jeu au moment du calcul — même modèle que les tables de progression (ADR-0004 : « liste assez petite et fixe »).

#### 08-B4 — `pokeathlon_score` sans domicile

Gate de Chuck `pokéathlon_score ≥ 250` (PRD:568) et metric `count` (PRD:863). Le design du Pokéathlon est à la synthèse (I-5), mais la donnée n'a aucun domicile. → Correction : champ `pokeathlon_score` sur `user_map_state` (le détail — cumul ? meilleur score ? — se règle avec le design I-5 à la synthèse, noté tel quel).

#### 08-B5 — `kanji_components` absente du schéma

Le pipeline la produit (étape 2, PRD:898 « Parser KanjiVG → table kanji_components »), la fiche Kanjidex l'affiche (« Composants visuels — chacun cliquable », PRD:719), `getAvailableKanji` consomme le `componentGraph` (PRD:879) — mais la table des « tables clés » (PRD:830-854) ne la liste pas. → Correction : ligne ajoutée.

#### 08-B6 — `words` sans `meanings` ni `part_of_speech` ⚠️

PRD:833. La Carte Mot promet « Partie du discours, sens en anglais » (PRD:734) ; le **sens anglais des mots est aussi le support de quiz** de Sens/Saisie/Écoute pendant toute la phase d'acquisition (PRD:217-225, mécanisme C) — sans champ `meanings`, la moitié des modes de combat n'a littéralement rien à afficher. JMdict fournit les deux. → Correction : `meanings`, `part_of_speech` ajoutés à `words`.

#### 08-B7 — `kanji` sans grade scolaire

Fiche Kanjidex : « Niveau JLPT et grade scolaire » (PRD:716) ; `kanji` (PRD:832) n'a que `jlpt_level`. Kanjidic2 (étape 1) fournit le grade. → Correction : champ `grade` ajouté.

#### 08-B8 — Liens mots↔kanji et mots↔phrases : inexistants ; « registre formel » sans source

Trois affichages sans données :
- « 6–8 mots JLPT contenant ce kanji » (PRD:720) — aucun lien kanji→mots, aucune règle de sélection des 6-8 (日 apparaît dans des centaines de mots) ;
- « Chaque kanji du mot cliquable » + « kanji encore à étudier avant déblocage » (PRD:737/740) et le déblocage de vocabulaire lui-même (PRD:364) — la décomposition mot→kanji n'est stockée nulle part (dérivable par scan de chaîne au runtime, contraire au principe « tout précalculé, le client ne fait que lire » PRD:922) ;
- « 3 exemples de phrases (registres variés : neutre, formel, familier) » (PRD:739, repris PRD:721) — aucun lien mot→phrases, et `sentences.register` (PRD:835) ne connaît que `neutral` (Tatoeba) et `spoken` (JESC) : le registre « formel » n'a **aucune source**.

→ Correction : `words.kanji_ids[]` (décomposition, précalculée étape 3 — sert au tri des « 6-8 mots » : mots JLPT du kanji triés par niveau puis fréquence) et `words.example_sentence_ids[]` (3 phrases sélectionnées au pipeline, nouvelle sous-étape) ; la promesse de registre reformulée sur ce que les sources fournissent (« registres variés quand disponibles — neutre/parlé »).

#### 08-B9 — `texts` sans titre

Le Journal de lecture liste les textes par titre, masqué « ??? » si non lu (texts-progressifs:444) ; `texts` (PRD:837) n'a pas de champ titre. → Correction : `title` ajouté (japonais — le Journal est un écran de jeu).

#### 08-B10 — Registre de dresseurs enregistrables : aucun champ

PRD:79 promet « registre de dresseurs enregistrables, appels entrants et re-matchs » ; rien ne stocke qui est enregistré. Le périmètre (lesquels, fréquence) est chiffré à la synthèse — mais la donnée doit avoir un domicile dès maintenant. → Correction : `registered_trainers[]` sur `user_map_state`.

#### 08-B11 — Carnet des compteurs : aucune table

PRD:703-711 : « une entrée par compteur…, débloquée à la première rencontre en contexte ». Ni table de contenu, ni tracking utilisateur. → Correction : table `counters` (counter_id, character, usage, exceptions de lecture, exemples — rédigée à la passe contenu) + `counter_encounters` (user_id, counter_id, first_seen_at — même modèle que `grammar_encounters`). Emplacement d'écran : 08-D3 (grill).

#### 08-B12 — « Gauntlet Kimono vaincu » : aucun support

Gates Mont Gris (PRD:610) et Red (PRD:618), achievement (PRD:809). `kimono_progress.cleared_at` trace les 5 **scènes/leçons** (audit 01, PRD:507) — pas les 5 combats du gauntlet. → Correction : le gauntlet est une `Quest` ordinaire (`kimono-gauntlet`, 5 étapes = 5 combats) → `completed_quests[]` ; la Condition des gates se lit `quest_step(kimono-gauntlet, terminé)`. Zéro nouvelle table, précisé au PRD § Kimono Girls.

#### 08-B13 — Points Blue Card sans domicile

I-13 (guidebook:522) : mot de passe de Buena → points → cosmétiques. → Correction : Blue Card = item `unique`, points = item `fungible` (`buena_points`) dans `inventory[]` — même famille que jetons/monnaie (garde-fous I-8), débit par `remove_item` à l'échange.

#### 08-B14 — Marqueur ◎ : `quests.steps[]` n'a pas de cible

« ◎ sur la cible active » (PRD:121) ; `quests` = steps (step_id, label) (PRD:842). Aucune zone/position cible par étape. → Correction : `target_zone_id` optionnel par step (zone suffit pour une carte-monde ; pas de position tuile — cohérent avec l'indice du Journal « pas de position exacte »).

#### 08-B15 — `npc_quest_progress` sans horodatage : Kurt 24h et « une fois par fenêtre » inexprimables

Le cycle Kurt (« fabrique en 24h », guidebook:1160) et la règle générale de l'audit 02 (« advance_quest autorisé une fois par fenêtre de temps », PRD:863) supposent de savoir **quand** l'étape courante a été atteinte ; `npc_quest_progress` (PRD:843) ne porte que (user_id, quest_id, current_step). Le type de Boule de la fournée en cours n'a pas non plus de domicile. → Correction : `step_entered_at` ajouté (la contrainte de fréquence se lit « pas deux advance_quest dans la même fenêtre » contre ce timestamp ; « prêt le lendemain » = jour calendaire suivant, même règle que le SRS) ; la fournée de Kurt = item `unique` transitoire (`fournee_<couleur>`, posé par grant_item au dépôt, retiré par remove_item à la remise de la Boule) — mécanisme existant, zéro nouveau type.

#### 08-B16 — `items` sans catégorie de Sac ni nom bilingue

Le Sac affiche des catégories (PRD:69) ; `items` (PRD:838) = item_id, name, item_kind. `name` est monolingue alors que le nom d'un objet est affiché au joueur (même cas que 04-A1 pour les dresseurs → `{jp, en}`). → Correction : `category` (apricorn | cs_kanji | quest | collectible | currency) et `name {jp, en}`.

#### 08-B17 — Les 36 lettres de Fukuda n'ont aucune surface de lecture

`fukuda_messages` a `read_at` (PRD:850), Fukuda « écrit après les grands événements » (PRD:666-673), la lettre finale « EST l'aboutissement » (PRD:681) — mais aucun écran ne les affiche : ni slot START, ni onglet Pokégear, ni Sac. → Correction : consultables depuis Pokégear → Téléphone → fiche Fukuda (historique des lettres, `read_at` posé à l'ouverture) — Fukuda est déjà le canal téléphone, aucun écran nouveau.

### C — Promesses sans mécanisme

#### 08-C1 — Aucun registre de zones : la musique est orpheline, les noms de zone aussi ⚠️

`zone_id` est référencé par 8 tables et tous les mécanismes (gate SRS, carte, quêtes…), le mapping musique du guidebook (:1198-1228) donne une piste **par zone**, la carte et le Journal affichent des **noms de zone** (en japonais, règle de langue) — mais aucun registre de zones n'existe : ni table au schéma, ni fichier (`content/map/` : npcs, trainers, placements, story-beats — pas de zones.json), ni ligne pipeline. → Correction : registre `content/map/zones.json` (zone_id, name {jp, en}, region, music_ref, is_interior — `is_interior` sert déjà au gate SRS « jamais les étages » 03-D5), ajouté à l'étape 15 du pipeline ; déclencheur : la piste `music_ref` se (re)lance à l'entrée de zone, variante nuit par filtre (guidebook:1228).

#### 08-C2 — Onglet Radio : son rôle gameplay n'y figure pas

PRD:81 liste Oak/Buena/Tableau du jour, mais : (1) l'émission **Flûte Poké** de la radio améliorée — seul moyen de réveiller le Ronflex (PRD:166-169/:753-756) — n'apparaît pas dans l'onglet qui la diffuse ; (2) la **carte EXPN** (extension Kanto de la radio) n'est pas mentionnée ; (3) le **moment d'activation** de l'onglet n'est jamais dit (en HGSS : Radio Card au quiz de la réceptionniste de la Tour Radio — sourcé side-content § F) ; (4) « radio d'ambiance » vs OST par zone (§ Audio) : rapport indéfini. → Correction (squelette de l'onglet) + grill 08-D2 pour le niveau de spec des émissions.

#### 08-C3 — Navigation : aucune règle d'entrée/sortie des surfaces

Le PRD définit A/B/X/Y **pendant un dialogue** (PRD:127-130) et l'ouverture (START/SELECT, PRD:55), mais : comment se ferme un menu (B ? re-appui ?), comment on remonte d'une fiche Kanjidex vers la grille, ce que fait SELECT avant la remise du Pokégear, ce que fait B au milieu d'une leçon/d'un texte (l'abandon de leçon est prévu — « rien n'est retenu », PRD:309 — mais aucun bouton ne le déclenche). → Correction : convention globale unique — B = retour/fermeture d'un niveau dans toute surface hors combat (HGSS), re-appui START/SELECT = fermeture, SELECT inerte avant la remise du Pokégear, B en leçon/texte = fermeture avec confirmation (leçon : reprise à zéro, acté ; texte : le quiz en cours reprend à la question courante à la réouverture — même absence de curseur).

### D — Ambiguïtés (→ grill)

#### 08-D1 — Options : « Paramètres », rien d'autre

PRD:71. Aucun paramètre défini nulle part. Presque tout est déjà tranché ailleurs (furigana = bouton Y jamais automatique, pas de chrono, orientation paysage imposée…) — que reste-t-il ? Proposition minimale : volumes (musique/SFX/voix), vitesse de texte (conv. HGSS), compte (Google, déconnexion). → Grill : spécifier cette liste minimale maintenant, ou reporter à la synthèse.

#### 08-D2 — Radio : spécifier les émissions maintenant ou confirmer le report à la synthèse

PRD:81 écrit deux fois « designs à la synthèse » (émission d'Oak, Tableau du jour). Le prompt de cet audit demande de trancher le sort des surfaces sous-spécifiées. → Grill : confirmer le report (l'onglet reçoit son squelette via 08-C2, les contenus d'émission à la synthèse) ou spécifier ici la liste fermée des émissions.

#### 08-D3 — Carnet des compteurs : onglet du Kanjidex ou entrée du Sac ?

Assigné à cet audit (PRD:710-711). → Grill.

#### 08-D4 — Affichage des conditions non remplies : où ?

Assigné à cet audit (PRD:867 : « menu START, Pokégear, dashboard ? »). → Grill : sur l'obstacle lui-même (porte/PNJ affiche « 512/550 » au moment du blocage), écran dédié, ou les deux.

#### 08-D5 — Écran de la chambre du joueur : quelle forme ?

Assigné à cet audit (PRD:792). La chambre est déjà un intérieur réel navigable (session 4). → Grill : décorations posées automatiquement à des emplacements fixes dans la pièce (zéro écran nouveau) vs écran-vitrine dédié.

#### 08-D6 — Pokégear Carte ↔ voyage rapide 飛 : même écran ?

PRD:80 (vue globale) et PRD:146 (« tap sur n'importe quelle ville visitée ») ne se répondent pas. → Grill : l'onglet Carte **est** l'interface de vol quand 飛 est actif (comme HGSS — reco) vs écran séparé.

#### 08-D7 — Profil « stats » : jamais énuméré

PRD:70. → Grill : liste minimale (kanji étudiés/maîtrisés, mots, textes lus, streak, dresseurs battus, précision moyenne ?) ou renvoi.

#### 08-D8 — Journal : blanc vs doré indécidable sous retry-jusqu'à-correct

texts-progressifs:443 : « lu (blanc) ou doré (quiz réussi avec récompense) » — or **tout** texte complété a son quiz réussi (retry-jusqu'à-correct) ; et « grant_item OU statut doré » (PRD:399) fait du type de récompense une donnée par texte qui n'existe nulle part. → Grill : doré = tout texte **secondaire** complété (l'objet éventuel s'ajoute — reco, zéro donnée nouvelle) vs doré = seulement les textes dont la récompense est le statut (exige un champ `reward_kind` sur `texts`).

### E — Obsolète

#### 08-E1 — guidebook « Hors scope v1 : HM08 Escalade » contredit la ligne 登 du même tableau

`guidebook-adapted.md:1190-1191` — trois lignes au-dessus (:1183), 登 est « réintégré 2026-07-06 » dans le tableau. Reliquat de la chasse aux reliques de l'audit 04 (le PRD a été corrigé, pas cette note). → Suppression.

#### 08-E2 — Mapping musique : note Union Cave fausse, zones réintégrées et Kanto absents

`guidebook-adapted.md:1210` : « Union Cave n'existe pas dans le jeu » — faux depuis la réintégration (2026-07-06, audit 04). Le mapping s'arrête à la géographie d'avant réintégration : rien pour Union Cave, Lavender, Routes 5/8/22/41/43/46, Îles Tourbillon, Safari, Routes 47/48, ni pour les 22 zones Kanto, le SS Aqua et les intérieurs récurrents (Centre Pokémon, Gym, Game Corner…). → Correction : note Union Cave réécrite (sa vraie piste existe) ; lignes manquantes marquées « à compléter à la synthèse avec les budgets des zones réintégrées » (même régime que le reste des réintégrations).

---

## Décisions du grill (Phase 2, 2026-07-07)

| Finding | Décision |
|---|---|
| 08-A1 | **Labels japonais HGSS VO** : 図鑑・レッスン・バッグ・プロフィール・せってい / でんわ・マップ・ラジオ・ぶんぽう / どくしょノート ; `{jp, en}` norme ADR-0002 |
| 08-D6 | **Écran unique** : l'onglet マップ est l'interface de vol quand 飛 est actif (Town Map HGSS) |
| 08-D2 | **Squelette + report** : activation (Radio Card), canaux et déclencheurs au PRD ; contenus d'émission à la synthèse |
| 08-D1 | **Liste enrichie HGSS+mobile** (après recherche web Bulbapedia/Wagotabi) : volumes ×3, vitesse de texte, cadre de fenêtre (Frame), contrôles tactiles (gaucher + opacité), compte — table `user_settings` ; exclusions documentées (furigana=Y…) |
| 08-D3 | **Onglet du Kanjidex** (漢字／じょすうし), visible après la remise narrative du carnet (École de Mauville) |
| 08-D4 | **Les deux surfaces** : conditions affichées au contact de l'obstacle (boîte de dialogue) + page d'agrégat des portes dans le Profil |
| 08-D5 | **Placement automatique** : chaque décoration a un emplacement fixe prédéfini dans la chambre, A → description japonaise (HGSS réel) |
| 08-D7 | **Collection + 3 visuels de croissance** : compteurs (jamais de performance) + courbe du voyage (`srs_cards.created_at`), barres JLPT, calendrier de présence |
| 08-D8 | **Doré = passe de quiz sans faute, rejouable en relecture** (quiz remélangé, généralise le mécanisme du texte de Red) — `text_completions.gold_at` ; remplace la sémantique 05-A2 (« doré = unlock_text »), réconciliée dans texts-progressifs.md |

Corrections appliquées le 2026-07-07 : PRD (Menu Principal, Pokégear, Navigation des surfaces, CS-Kanji 飛, Kanjidex/Carnet, Carte Mot, Textes/Journal, Chambre, Kimono gauntlet, Fukuda lettres, conditions affichables, § Audio, schéma — 9 lignes éditées + 5 tables ajoutées (`kanji_components`, `counters`, `counter_encounters`, `achievements`, `user_settings`), pipeline 3/4ter/15), guidebook-adapted (E1, E2, ligne union-cave musique), texts-progressifs (doré ×5 occurrences réconciliées).

---

## Reporté à la synthèse

- Contenus des émissions Radio (liste, scripts, quiz d'Oak) et périmètre téléphone (dresseurs enregistrables, fréquence d'appels, 即時応答) — déjà actés « à la synthèse », confirmés ici.
- Lignes manquantes du mapping musique (zones réintégrées + Kanto + intérieurs) — avec les budgets de zones (08-E2).
- Détail du score Pokéathlon (cumul vs meilleur) — avec le design I-5 (08-B4).
- Sélection effective des 3 phrases d'exemple par mot et des « 6-8 mots » par kanji (règle posée ici, exécution = pipeline/passe contenu).
