# Findings — Audit 02 : Modèle Condition/Effect face à tous les cas narratifs

Date : 2026-07-06. **Audit complet — les 3 phases terminées** : Phase 1 (lecture seule) = ce rapport ;
Phase 2 (grill, 9 questions tranchées + 1 décision de scope majeure) et Phase 3 (corrections
appliquées dans PRD/ADR-0003/guidebook/texts-progressifs) = voir « Décisions et corrections » en fin
de rapport. Docs audités : PRD (§ Implémentation,
§ Modèle de condition/effet générique, § La Carte de Johto, § Silver/Kimono/Rocket/Légendaires, § Système
道場), ADR-0001 à 0004, `content/guidebook-adapted.md` (zone par zone + sections récap), `content/map/
story-beats.json`, `content/texts-progressifs.md`.

Convention : chaque cas narratif est formalisé en `Condition[]`/`Effect[]` avec les types **actuels**
(`kanji_count, item_owned, quest_step, npc_cleared, event_cleared, badge_earned` / `advance_quest,
grant_item, unlock_lesson, unlock_zone, unlock_text`). Quand la formalisation échoue, la case est un
**finding**, classé A (contradiction interne) / B (promesse sans données) / C (promesse sans mécanisme) /
D (ambiguïté à trancher) / E (trace obsolète).

---

## 1. Silver — 6 rencontres

| # | Lieu | Formalisation |
|---|---|---|
| 1 | Ville Griotte | `sight_auto_result: battle`, présence par défaut (tout début de jeu, pas de `unlock_conditions`). `post_battle` state. Effect : `advance_quest(silver_encounters, 1)`, écrit directement dans `silver_progress` (ADR-0004). |
| 2 | Ecorcia, porte ouest | `unlock_conditions: [event_cleared(slowpoke_well)]` sur l'entité Silver. `sight_auto_result: battle`. Effect : `advance_quest(silver_encounters, 2)`. |
| 3 | Tour Embrasée, haut de l'échelle | `unlock_conditions: [quest_step(silver_encounters, ≥2), kanji_count(≥550)]` (le seuil 550 vient de `story-beats.json` L224). `sight_auto_result: battle`. Effect idem. |
| 4 | QG Rocket B2F | `unlock_conditions: [event_cleared(ariana_defeated)]`. **Pas un `battle`** — `trigger_type: talk`, scène/cameo uniquement (déjà vaincu par Lance). Effect : `advance_quest(silver_encounters, 4)`. |
| 5 | Tunnel de Doublonville B2F | `unlock_conditions: [quest_step(goldenrod_radio_tower, "card_key_chase")]`. `sight_auto_result: battle`. Effect : `advance_quest(silver_encounters, 5)` + `grant_item(card_key)`. |
| 6 | Route Victoire | `unlock_conditions: [event_cleared(indigo_antichambre_cleared)]` ou équivalent zone. `sight_auto_result: battle`. Effect : `advance_quest(silver_encounters, 6)`. |

Les deux apparitions bonus post-Red (Route 28, Mont Gris) utilisent `kanji_count(≥2000)` — déjà couvert par
le type existant, aucun gap.

**Finding 02-A1 (A, mineur→moyen) — Achievement Silver contredit sa propre exception documentée.**
PRD L703 (§ Achievements) : *"Silver : battu les 6 fois"*. Mais PRD L408 et `guidebook-adapted.md` L801
disent explicitement que la rencontre #4 (QG Rocket) **n'est pas un combat** ("simple cameo frustré").
Un achievement libellé "battu" sur une rencontre qui n'implique aucune victoire est soit une formulation
imprécise (corrige en "rencontré les 6 fois"), soit un vrai trou de condition si l'achievement est
implémenté comme `Condition[]` de 6× `npc_cleared` au sens "combat gagné" — `npc_cleared(silver_4)` n'aura
jamais de sens "victoire" puisqu'il n'y a pas de combat. Il faut trancher : soit `silver_progress.outcome`
gagne une valeur `cameo` (distincte de `win`/`loss`) et l'achievement se lit "5 victoires + 1 scène", soit
l'achievement est reformulé "rencontré 6 fois" tout court. Aucune des deux n'est actée dans le PRD
actuel — **question D**.

---

## 2. Kimono Girls — 5 rencontres individuelles + gauntlet

Chaque rencontre individuelle (scène/leçon, pas de combat sauf Miki où c'est le Sbire Rocket le combat
réel) : `trigger_type: talk` ou `sight_auto_result: battle` (Miki uniquement, contre le Sbire, pas contre
elle). Effect à la fin de la scène : écrit directement dans `kimono_progress` (ADR-0004), pas de
`Condition`/`Effect` supplémentaire nécessaire pour l'obtention elle-même.

**Gate de Clair : "4/5 rencontrées".** ⚠️ Ici la formalisation **échoue avec les types actuels**. Ce n'est
pas un AND de 4 `npc_cleared` fixes — l'ordre chronologique réel de rencontre des Kimono Girls varie selon
le chemin Acajou/Oliville emprunté en premier (PRD L469-472, note explicite), donc "4/5" est un **seuil de
comptage sur un ensemble non ordonné**, pas une conjonction de 4 identifiants précis. Aucun type `Condition`
actuel n'exprime "N éléments vrais parmi M, peu importe lesquels".

**Finding 02-C1 (C, MAJEUR) — Aucun type `Condition` ne compte un sous-ensemble de jalons.** Le même trou
réapparaît ailleurs (voir 02-C2 ci-dessous pour les gates de grammaire) — ce n'est pas un cas isolé de
Kimono Girls, c'est un pattern qui revient partout où un gate dit "N sur M" plutôt que "tout" ou "un
spécifique". Voir proposition de type au § Types proposés.

---

## 3. Team Rocket — 3 lieux

### Puits Ramoloss (Proton)
`unlock_conditions: []` (présent dès l'arrivée à Ecorcia). `sight_auto_result: battle` ou tappable
(bâtiment). Effect : `event_cleared(slowpoke_well)`, écrit dans `rocket_progress` (ADR-0004). Gate Bugsy :
`Condition.event_cleared(slowpoke_well)`. **Aucun gap.**

### QG Rocket (Acajou) + Lac Colère
Structure multi-étage déjà validée par ADR-0004 (un `zone_id` par étage, `Quest` unique séquençant B1F→
B3F→salle du chef→salle du transmetteur) :
- Alarme-statues (B1F) : deux entrées de registre à la même tuile — présente si alarme active, absente
  si le joueur a d'abord neutralisé le PC (Scientifique) — **voir Finding 02-D1 ci-dessous, ce cas
  nécessite en fait une négation, pas juste "deux conditions complémentaires" comme énoncé par l'ADR.**
- B3F : `unlock_conditions: [item_owned(password_1), item_owned(password_2)]` (mots de passe obtenus en
  battant des Sbires).
- Salle du chef (Petrel déguisé) → salle du transmetteur (Ariana + Lance vs joueur) : `quest_step`
  ordonnés sur `quest: mahogany_rocket_hq`.
- Effect final : `grant_item(渦)` (Lance, après double victoire) — condition additionnelle de lecture, voir
  § CS-Kanji.

**Aucun gap structurel** — bonne confirmation d'ADR-0004 pour la partie séquencement. Le point négation
(alarme active/coupée) est traité au Finding 02-D1.

### Tour Radio (Doublonville) — le cas le plus complexe du jeu
Séquence confirmée (PRD L439, guidebook L1119) : 1F Sbire (déguisement requis) → Silver grille le
déguisement en chemin (scène) → 3F verrouillé jusqu'à Card Key → **détour Tunnel de Doublonville** (Silver
apparition #5, combat réel, donne Card Key) → retour Tour Radio 3F : Proton → re-Petrel (déguisé, 3F,
2e combat) → plateforme : Ariana → Archer (final).

Formalisation : un seul `Quest` (`goldenrod_radio_tower`) avec des `steps[]` couvrant les deux `zone_id`
(Tour Radio + Tunnel de Doublonville) — exactement le pattern déjà validé pour Forêt Secte (ADR-0003).
- 1F Sbire : `unlock_conditions: [item_owned(rocket_disguise)]` gate le passage — pas un NPC à combattre,
  un check de présence sur la porte elle-même (ou un `map_npcs` `block` si déguisement absent).
- Petrel (5F, 1er combat, déguisé en Directeur) : `sight_auto_result: battle`, aucune condition
  supplémentaire (accessible dès le 1F passé).
- 3F verrouillé : `unlock_conditions: [item_owned(card_key)]`.
- Deux entrées de registre pour Petrel (5F puis 3F) — même NPC narratif, deux entités `map_trainers`
  distinctes avec `quest_step` complémentaires (pattern déjà validé ADR-0004, comme pour le vendeur du
  magasin de souvenirs d'Acajou remplacé après la chute du QG).

**Finding 02-D2 (D, mineur) — Le déguisement (`item_owned(rocket_disguise)`) reste-t-il en inventaire
après avoir été "grillé" par Silver ?** Le jeu d'origine ne retire pas l'objet ; la porte 1F n'a plus besoin
d'être re-vérifiée une fois la `quest_step` passée. Sans conséquence mécanique si le gate ne teste plus
`item_owned` après ce point (il teste `quest_step` à la place) — mais à trancher explicitement pour éviter
une incohérence d'inventaire visible dans le Sac du joueur (un objet "déguisement" qui traîne indéfiniment
sans usage). Recommandation : le consommer via un `Effect` dédié au moment où Silver le grille, ou
documenter qu'il reste comme trophée de Sac sans usage ultérieur.

---

## 4. CS-Kanji — 7 obtentions + condition de lecture globale

Chacun des 7 suit le même squelette : `Condition[narrative] = [npc_cleared(X) ou event_cleared(X)]` (le
moment narratif, inchangé vs jeu d'origine) **ET** `Condition[lecture] = [texte lu et quiz réussi]` — c'est
cette 2e condition qui pose problème.

### 水 (Surf) — le cas à deux conditions distinctes du prompt
1. Remise : `npc_cleared(gentleman_theatre)` (après sauvetage de Miki) + condition de lecture (voir
   ci-dessous) → `Effect.grant_item(水)`.
2. **Utilisabilité** (distincte de la possession) : `badge_earned(morty)` — le CS-Kanji est en Sac mais
   inutilisable sur la carte tant que Morty n'est pas battu. Ceci est un `Condition[]` **sur l'obstacle
   lui-même** (la tuile "route maritime"), pas sur le NPC qui le remet : `unlock_conditions:
   [item_owned(水), badge_earned(morty)]`.

**Finding 02-B1 (B, MAJEUR) — Aucune table `map_obstacles`/`obstacles` n'existe dans le schéma.** Le
§ Implémentation du PRD (L724-748) liste toutes les tables clés (`map_trainers`, `map_npcs`, `quests`...)
mais aucune ne porte les `unlock_conditions` d'un obstacle de terrain (Simularbre, Ronflex, porte du
Plateau Indigo, tuiles "route maritime" activées par 水, rochers 力, arbres 切, cascades 滝, tourbillons 渦).
Le § "Obstacles-Puzzles" du PRD (L670) est explicitement noté "à rédiger" et ne définit aucun schéma. Sans
cette table, le cas 水 ci-dessus (deux conditions distinctes : remise vs usage) n'a nulle part où vivre.
**C'est le seul vrai trou de schéma structurel trouvé dans cet audit** — tous les autres cas (NPC, dresseur,
zone, quête) ont déjà leur table ; les obstacles de terrain n'en ont aucune.

### Condition de lecture globale ("tous les textes des zones débloquées lus")
Déjà repérée comme absente par le prompt lui-même, et confirmée : `content/texts-progressifs.md` (L320)
propose `getCSKanjiAbilities` comme vérifiant "tous les textes... présents dans `text_completions`" — mais
ceci **n'est pas exprimable par un des 6 types `Condition` actuels**. `event_cleared` teste un flag booléen
nommé, pas une comparaison ensembliste dynamique (`texts.filter(zone_id ∈ unlocked_zones) ⊆
text_completions`) dont le périmètre change à chaque zone débloquée.

**Finding 02-C2 (C, MAJEUR) — Confirme le trou signalé par le prompt : aucun type n'exprime "tout lu
jusqu'ici".** Un nouveau type est nécessaire, voir § Types proposés (`all_texts_read`, sans paramètre —
calculé dynamiquement contre `unlocked_zones[]` et `text_completions` au moment de l'évaluation, jamais
stocké).

### 力 (Force) — Route 42, `npc_cleared(hiker_route_42)`. 切 (Coupe) — Ecorcia, `event_cleared(farfetchd_quest)`
(quête multi-étapes : instructions apprenti → 2 captures hors-carte → retour Maître du Charbon — modélisé
comme `Quest` avec 4 `steps[]`, déjà couvert par ADR-0003, aucun gap). 砕 (Éclate-Roc) : `npc_cleared
(boy_route_36)`. 渦 (Tourbillon) : `event_cleared(rocket_hq_cleared)`. 滝 (Cascade) : **pas de PNJ** —
`event_cleared(ice_path_puzzle_solved)`, trouvé (`found_object_ref`) plutôt que remis — déjà prévu par le
modèle `talk`/`sight_auto`+`block` (ADR-0001), aucun gap.

---

## 5. Objets-clés : Arrosoir, radio/carte EXPN

- **Arrosoir → Simularbre** : `Effect.grant_item(arrosoir)` sur la fleuriste de Doublonville, `Condition:
  [badge_earned(whitney)]`. Obstacle Simularbre : `unlock_conditions: [item_owned(arrosoir)]`. Même trou
  de table que 02-B1 (l'obstacle Simularbre n'a nulle part où stocker cette condition).
- **Radio améliorée (carte EXPN) → Ronflex** : `Effect.grant_item(carte_expn)` à l'issue de la quête de la
  Centrale Électrique de Kanto (voir § 7). Obstacle Ronflex : même trou 02-B1.

Aucun nouveau gap au-delà de 02-B1 (déjà couvert).

---

## 6. PNJ calendaires — le cas temps réel

Quatre cas distincts, tous nécessitant une notion de **temps réel** qu'aucun type `Condition` actuel ne
couvre (`kanji_count, item_owned, quest_step, npc_cleared, event_cleared, badge_earned` sont tous des
états de progression du joueur, jamais l'heure/le jour du monde réel) :

| Cas | Source | Granularité temps réel |
|---|---|---|
| Frères/sœurs du jour (7 PNJ) | `guidebook-adapted.md` L74, L414 (table complète) | Jour de semaine fixe (ex. Tuscany = mardi) |
| Photographe itinérant | L70, L1279, L1289, L1296, L1313, L1344 | Calendrier hebdo différent par zone (ex. "mar/jeu/sam") |
| Homme des Condominiums (Céladia) | L1262, L1305 | Créneau horaire fixe (20h-4h) |
| Daisy (Bourg-Origine, sœur de Blue) | L1272, L1280 | Créneau horaire quotidien (15h-16h) **+ compteur de 7 visites cumulées** |

**Finding 02-C3 (C, MAJEUR — le 2e trou structurel du modèle) — Aucun type `Condition` n'exprime une
fenêtre de temps réel (jour de semaine et/ou heure).** Contrairement à 02-C1/C2 (comptage), ceci est un
axe complètement absent du vocabulaire actuel : tous les `Condition` actuels sont dérivés de l'état de
progression stocké côté serveur/client, jamais de l'horloge du monde réel. Voir proposition
`time_window` au § Types proposés — **et voir Phase 2 (grill) : le guidebook lui-même classe déjà le cas
des frères/sœurs du jour comme "mécanique optionnelle v2... pas dans le scope v1"** (L74) — mais Daisy et
l'homme des Condominiums (ajoutés en passe 7, Kanto) n'ont **jamais reçu cette même étiquette v2/coupé** ;
rien dans le PRD ne les scope explicitement. Incohérence de traitement entre deux PNJ calendaires
structurellement identiques (l'un noté "v2 optionnel", l'autre silencieux) — à trancher en Phase 2.

**Finding 02-D3 (D, lié à C3) — Le compteur "7 visites cumulées" de Daisy est un autre problème que le
temps réel : c'est un comptage d'interactions distinctes dans le temps, qui ne peut pas utiliser la
sémantique d'idempotence actuelle des `Effect`.** Voir Finding 02-A2 ci-dessous (Idempotence) — même
mécanique que la ferme Moomoo (§ route-38/39, "nourrir avec 7 baies... sur plusieurs visites",
`guidebook-adapted.md` L684).

---

## 7. Gyms verrouillés, portes, quêtes filées à deux villes

- **Icône cadenas sur un Gym** : reflet visuel de `unlock_conditions` non remplies (`kanji_count` +
  gate de grammaire, voir 02-C1 pour le trou sur ce dernier). Aucun mécanisme propre, juste de l'UI.
- **Porte du Plateau Indigo (8 badges)** : `Condition[] = [badge_earned(falkner), badge_earned(bugsy), ...
  ×8]` (AND de 8 conditions). Exprimable avec le type actuel tel quel — aucun gap, juste verbeux (question
  mineure D : `badge_earned` devrait-il accepter un tableau `badge_ids[]` plutôt que d'être répété 8 fois
  dans le AND ? Cosmétique, sans impact fonctionnel — noté mais pas bloquant).
- **Gym de Vertville (Blaine battu + Blue rencontré)** : `Condition[] = [npc_cleared(blaine),
  event_cleared(blue_met_cinnabar)]`. **Aucun gap** — bon cas de confirmation.
- **Misty absente du gym jusqu'à l'événement du cap** : deux entrées de registre à la même tuile (Gym
  d'Azuria) — sbire Rocket isolé présent par défaut, 5 dresseurs de Misty présents seulement après
  `event_cleared(misty_met_viewpoint)`. **Ceci est exactement le même problème de négation que le QG
  Rocket B1F (02-D1)** : le sbire doit être présent **tant que** l'événement n'est pas résolu, ce qui
  suppose soit une condition par défaut (présence sans `unlock_conditions`, retirée par un mécanisme non
  encore défini), soit une négation explicite (`NOT event_cleared(...)`). Voir Finding 02-D1.
- **Quête Copycat (poupée trouvée à Vermeille, rendue à Safranville)** : `Effect.grant_item(copycat_doll)`
  au comptoir du Club des Fans (Vermeille) → `Condition: [item_owned(copycat_doll)]` gate le dialogue de
  Copycat (Safranville) → `Effect.grant_item(pass_train_aimant)`. **Aucun gap** — bon cas de confirmation,
  identique au pattern Forêt Secte/Ilex (ADR-0003).
- **Centrale Kanto (pièce volée → restituée → passage débloqué)** : `Effect.grant_item(piece_mecanique)`
  sur la défaite du Sbire isolé (Azuria) → `Condition: [item_owned(piece_mecanique)]` gate le mécanicien de
  la Centrale → `Effect.unlock_zone(route-6-kanto)` (passage souterrain). **Aucun gap**, même pattern.

**Finding 02-D1 (D, MAJEUR — regroupe QG Rocket B1F et Misty/Azuria) — Le modèle Condition n'a pas de
négation explicite, alors qu'ADR-0004 en a implicitement besoin.** ADR-0004 dit : *"deux entrées de
registre à la même tuile, avec des `unlock_conditions` complémentaires (présente si alarme active, absente
sinon)"* — mais "absente sinon" suppose de pouvoir écrire la condition inverse d'un flag (`NOT
event_cleared(alarm_disabled)`), ce qu'aucun type actuel ne permet directement. Sans négation, la seule
façon d'exprimer "présent par défaut, disparaît quand X" est de laisser l'entrée par défaut à
`unlock_conditions: []` (toujours présente) et de n'avoir **aucun mécanisme pour la faire disparaître** —
ce qui ne marche pas pour Misty/Azuria ni pour le sbire du QG Rocket. Ce trou n'avait pas été détecté par
ADR-0004 lui-même (qui suppose la négation résolue sans la nommer). Voir proposition de modificateur
`negate` au § Types proposés.

---

## 8. Gating quotidien SRS — Condition ou mécanisme à part ?

Le PRD (§ Boucle Quotidienne) bloque l'entrée en **nouvelle zone** si la session SRS du jour n'est pas
faite. Le § Implémentation liste `getDailySRSStatus(srsHistory, today)` comme un helper **séparé** de
`ProgressionEngine`, jamais raccroché au vocabulaire `Condition`/`Effect` (pas de `unlock_conditions` sur
les zones qui référencerait un flag SRS).

**Finding 02-D4 (D, exactement la question posée par le prompt) — Le PRD ne tranche jamais explicitement
si le gate SRS quotidien est un `Condition` ou un mécanisme à part.** Les deux lectures sont défendables :
- **Le modéliser comme `Condition`** (ex. nouveau type `srs_done_today`) unifierait le vocabulaire — mais
  ce gate a une propriété qu'aucun `Condition` actuel n'a : il **se réinitialise chaque jour calendaire**
  après avoir été satisfait, alors que tout le modèle actuel est construit sur des `Effect` **idempotents et
  permanents** (ADR-0003 : "avancer une étape déjà atteinte ne fait rien" — jamais "redevenir fausse le
  lendemain"). Un `Condition.srs_done_today` casserait cette invariant silencieusement pour un seul type
  parmi sept.
- **Le garder hors du modèle** (mécanisme dédié, `getDailySRSStatus` comme aujourd'hui) préserve
  l'invariant "tout Condition/Effect est monotone", au prix de deux systèmes de gate différents dans le
  jeu (un pour les zones/PNJ, un pour le SRS).

Recommandation portée en Phase 2 : **garder le mécanisme séparé**, et l'expliciter dans le PRD avec la
raison ci-dessus (actuellement juste implicite via l'existence d'un helper séparé, jamais justifié par
écrit) — c'est ce que demande le prompt ("le PRD doit être net").

---

## 9. Idempotence des Effects face aux quêtes à répétition

ADR-0003 : *"Tous les `Effect` sont idempotents : `advance_quest` vers une étape déjà atteinte ou dépassée
ne fait rien, `grant_item` d'un objet déjà possédé ne fait rien."*

**Finding 02-A2 (A, MAJEUR) — Cette règle contredit directement un mécanisme confirmé et central du
guidebook : Kurt (Apricorn → Boule).** `guidebook-adapted.md` L389-402 confirme que Kurt fabrique **une
Poké Ball par fournée, indéfiniment**, à chaque dépôt d'Apricorns — ce n'est pas un objet unique remis une
fois, c'est un objet cumulable (fongible) régénéré à volonté tout au long du jeu. Si `grant_item` est
strictement idempotent ("d'un objet déjà possédé ne fait rien"), **Kurt cesse de fonctionner après la
toute première Boule fabriquée** — contradiction directe entre la règle générale et le cas concret le
plus documenté du jeu. Le même problème touche la ferme Moomoo (nourrir 7 baies sur plusieurs visites,
L684) et, dans une moindre mesure, le compteur de visites de Daisy (02-D3).

Ce n'est pas un simple oubli de formulation — la règle telle qu'écrite est **universelle** ("tous les
`Effect`"), alors que le jeu a manifestement besoin des deux régimes : idempotence stricte pour les objets
narratifs uniques (CS-Kanji, clés de quête, badges) et **ré-déclenchement répété** pour les objets fongibles
(Poké Balls, baies, monnaie). Le PRD ne fait actuellement aucune distinction entre les deux catégories
d'objets — c'est la vraie cause du problème, pas juste une exception à documenter pour Kurt seul.

---

## Récapitulatif des findings

| ID | Type | Sévérité | Résumé |
|---|---|---|---|
| 02-A1 | A | mineur | Achievement "Silver battu 6 fois" contredit l'apparition #4 (non-combat) |
| 02-A2 | A | **majeur** | Règle d'idempotence universelle des `Effect` contredit Kurt (objets fongibles) |
| 02-B1 | B | **majeur** | Aucune table `map_obstacles` — les CS-Kanji/objets-clés n'ont nulle part où gater un obstacle |
| 02-C1 | C | majeur | Aucun type ne compte "N sur M" jalons non ordonnés (Kimono 4/5) |
| 02-C2 | C | **majeur** | Confirme le trou signalé par le prompt : aucun type "tous les textes lus" (CS-Kanji) |
| 02-C3 | C | **majeur** | Aucun type `Condition` n'exprime le temps réel (jour/heure) — 4 PNJ calendaires |
| 02-D1 | D | majeur | Pas de négation dans `Condition` — nécessaire pour QG Rocket B1F et Misty/Azuria |
| 02-D2 | D | mineur | Le déguisement Rocket reste-t-il en inventaire après usage ? |
| 02-D3 | D | lié à C3 | Compteur "7 visites" (Daisy, Moomoo) — sémantique de comptage temporel absente |
| 02-D4 | D | — | Gate SRS quotidien : `Condition` ou mécanisme à part ? (le PRD doit trancher, question posée par le prompt) |

**Note C1/C2/C3 : trois formes différentes du même problème plus large.** Le modèle actuel n'a qu'un seul
axe de comptage (`kanji_count`), et tout ce qui n'est pas "kanji étudiés" ou "un flag booléen nommé" est
actuellement inexprimable — que ce soit un comptage générique (grammaire, jalons), une complétion
dynamique (lecture), ou une fenêtre temporelle (calendrier). Voir proposition ci-dessous : peu de nouveaux
types, mais une vraie généralisation de `kanji_count`.

---

## Types `Condition`/`Effect` proposés (motivés, minimum viable)

1. **Généraliser `kanji_count` en `count(metric, threshold)`** — `metric` ∈ `{kanji_studied,
   grammar_encounters, kimono_met, legendary_defeated, ...}`. Remplace `kanji_count` (cas particulier
   `metric: kanji_studied`) et résout **d'un coup** : tous les gates de grammaire actuellement
   informels (Falkner "15 points N5 rencontrés", Raikou "15 points N2", etc. — déjà écrits dans le PRD
   comme des comptes mais jamais reliés au vocabulaire `Condition`), et le seuil Kimono "4/5" (02-C1).
   **Un seul type généralisé plutôt que 3-4 types spécifiques** — conforme à la consigne "le moins de
   types possible".
2. **Nouveau type `all_texts_read`** (sans paramètre, calculé dynamiquement contre `unlocked_zones[]` ∩
   `texts` vs `text_completions` au moment de l'évaluation) — seul moyen de couvrir 02-C2, confirmé
   nécessaire par le prompt lui-même.
3. **Nouveau type `time_window(days_of_week?, hour_range?)`** — seul moyen de couvrir 02-C3. Évalué côté
   client contre l'horloge réelle, jamais stocké. **Proposition de scope réduit en Phase 2** : n'introduire
   ce type que si l'équipe décide de garder au moins un des 4 cas calendaires pour v1 — sinon, le type
   n'est pas nécessaire du tout et tous les PNJ calendaires passent en "coupé/v2", cohérent avec le
   traitement déjà donné aux frères/sœurs du jour.
4. **Modificateur `negate: true`** sur n'importe quel `Condition` (pas un nouveau type, juste un booléen
   optionnel sur la forme existante) — résout 02-D1 avec l'ajout le plus minimal possible.
5. **Nouvelle table `map_obstacles`** (`obstacle_id, zone_id, tile_x, tile_y, unlock_conditions:
   Condition[]`) — résout 02-B1. Pas un nouveau type `Condition`/`Effect`, juste l'entité manquante pour
   les accrocher.
6. **Clarification (pas un nouveau type) : l'idempotence de `grant_item` est scopée par catégorie
   d'objet.** Objets narratifs uniques (CS-Kanji, clés de quête, badges) restent strictement idempotents.
   Objets fongibles/cumulables (Poké Balls, baies, monnaie) sont explicitement exclus de la règle
   d'idempotence — `grant_item` les incrémente à chaque déclenchement valide. Résout 02-A2 par une
   précision de règle, pas par un mécanisme nouveau.
7. **Compteurs de visites bornés dans le temps (Daisy, Moomoo)** — si le type 3 (`time_window`) est
   adopté en Phase 2, ces cas se modélisent comme une `Quest` ordinaire à N `steps[]`, où chaque
   `advance_quest` n'est autorisé qu'une fois par fenêtre de temps (`time_window` day-boundary) — pas un
   nouveau type `Effect`, juste une contrainte de fréquence sur `advance_quest` couplée au type 3.

---

## Décisions de la Phase 2 (grill du 2026-07-06) et corrections appliquées (Phase 3)

Toutes les corrections sont marquées `(corrigé/ajouté/tranché 2026-07-06, audit 02)` dans les docs.
L'ADR-0003 porte une section « Amendment (2026-07-06, audit 02) » consolidant tout le modèle.

1. **`count(metric, threshold)` adopté** (généralise `kanji_count` ; résout 02-C1 et les gates de
   grammaire). → PRD § condition/effet (énumération réécrite). Bénéfice acté au passage : les
   conditions non remplies sont des données affichables (« 512/550 »), paragraphe dédié au PRD ;
   l'emplacement UI exact est délégué à l'audit 08.
2. **`all_texts_read` adopté** (résout 02-C2). → PRD + `texts-progressifs.md` § CS-Kanji (le type est
   nommé sur la condition 2). **Nouveau finding levé en grill par l'utilisateur — 02-B2 (B, MAJEUR) :
   risque de deadlock texte↔CS** (un texte derrière un obstacle CS dans une zone débloquée rend
   `all_texts_read` insatisfiable). Correction : **invariant de placement anti-deadlock** gravé dans
   `texts-progressifs.md` (atteignable sans CS au déblocage de la zone) + script de vérification à la
   production contre `map_obstacles`. Vérification zone par zone impossible aujourd'hui (placements
   volontairement non choisis) — c'est précisément pourquoi la règle devait être écrite avant la passe
   de placement.
3. **Cas temps réel : tous v1** — décision de scope majeure de l'utilisateur : **« aucune v2 », partout**.
   → `time_window(days_of_week?, hour_range?)` adopté + règle de fréquence sur `advance_quest` (Daisy ×7,
   Moomoo). Toutes les étiquettes v2/post-v1 purgées de `guidebook-adapted.md` (8 mentions) et
   `npc-inventory.md` (1 mention). Trace obsolète corrigée (E) : le puzzle du Chemin Glacé était marqué
   « si réactivé en v2 » alors que 滝 en dépend déjà — désormais v1 explicite, incohérence
   « traversée linéaire » de la section route-44 corrigée aussi. Les gros contenus ex-v2 (Grotte Sombre,
   intérieur du Mont Mortier/Kiyo, Tour Jo en mini-donjon 8 temps, Pots à Baies) : réintégration v1
   **actée**, périmètre chiffré à l'audit 09 (reporté à la synthèse, voir ci-dessous). Mémoire projet
   mise à jour (`project_no_v2_scope.md`).
4. **`negate: true` adopté** (résout 02-D1). → PRD (paragraphe dédié + correction de la phrase ADR-0004
   citée qui supposait la négation sans la nommer) + ADR-0003. `Condition[]` reste un ET pur, pas de
   OU ni de groupes.
5. **Table `map_obstacles` adoptée** (résout 02-B1). → ligne ajoutée au schéma du PRD, avec l'exemple 水
   (remise vs utilisabilité) ; sert aussi de base au script anti-deadlock du point 2.
6. **`item_kind: unique | fungible` adopté** — champ explicite plutôt que règle en prose (résout 02-A2/
   Kurt). → règle d'idempotence scopée dans le PRD + **nouvelle table `items`** au schéma (trou annexe
   découvert : rien ne définissait les objets, `inventory[]` référençait des identifiants sans table
   maîtresse) + ADR-0003.
7. **Achievement Silver : les deux corrections** (résout 02-A1, validé « si ça suit le book » — confirmé
   guidebook L801/L813) : libellé reformulé « rencontré les 6 fois » + valeur `cameo` ajoutée à
   `silver_progress.outcome`. → PRD § Achievements + schéma.
8. **`Effect.remove_item` adopté** (résout 02-D2 en le généralisant) : le déguisement est retiré à la
   scène Silver comme dans le jeu d'origine, et le même type couvre toutes les livraisons de quêtes
   fetch (poupée Copycat, pièce mécanique, Potion Secrète, Écaille Rouge, courrier) et la consommation
   des fongibles (Apricorns chez Kurt). → PRD (énumération des `Effect`) + ADR-0003.
9. **Gate SRS quotidien : mécanisme séparé, jamais une `Condition`** (résout 02-D4). → paragraphe
   dédié au PRD § Boucle Quotidienne avec la raison écrite (invariant de monotonie : toutes les
   `Condition` sont monotones, `srs_done_today` redeviendrait faux chaque matin) + ADR-0003.

**Livrable annexe de la Phase 2 :** `content/side-content-inventory.md` — inventaire exhaustif des
~75 contenus optionnels sourcés (hors gyms/combats obligatoires), en 7 catégories (textes tout
trouvés, quêtes fetch, calendaires, fils multi-zones, mini-donjons ex-v2, PNJ-leçon potentiels,
systèmes répétables), avec réfs de ligne guidebook — vivier direct pour la passe de placement des
~70-100 textes secondaires.

**Vérification d'asset faite en passant (demande utilisateur) :** les sprites du déguisement Rocket
existent dans le dump HGSS (`public/sprites/overworld/rhero.png`/`rheroine.png` — héros/héroïne en
uniforme Rocket, planche de marche complète — + `rbanzaihero.png`, `saverhero/saverheroine.png`).
Rien à produire.

## Reporté à la synthèse (audit 09)

- `content/map/story-beats.json` L542 dit encore "Red : 50 questions" — résidu de la même correction
  50→100 déjà appliquée ailleurs par l'audit 01 (`findings-01-progression.md`, finding A-4) mais oublié
  dans ce fichier précis. Hors périmètre de cet audit (longueur de combat, pas Condition/Effect) — à
  corriger en synthèse.
- Le detail exact des 5 questions du quiz du Maître (Antre du Dragon) n'est jamais transcrit par le
  guidebook source (`guidebook-adapted.md` L936) — lacune de contenu à écrire, pas un problème de modèle.
- **Chiffrage de la réintégration des ex-v2 (décision « aucune v2 », 2026-07-06)** : Grotte Sombre,
  intérieur du Mont Mortier (Kiyo + 3 dresseurs), Tour Jo en mini-donjon 8 temps, Pots à Baies.
  La réintégration est actée dans les docs ; l'audit 09 doit rouvrir les comptes de l'audit 01
  (nombre de zones, distribution kanji, budget leçons/textes par zone — voir
  `content/side-content-inventory.md` § E pour le périmètre exact).
- **Emplacement UI de l'affichage des conditions non remplies** (« 512/550 kanji ») — mécanisme acté
  (audit 02, décision 1), écran précis (menu START / Pokégear / dashboard) à trancher par l'audit 08.
