# Findings — Audit 09 : Synthèse finale

Date : 2026-07-07. **Statut : audit terminé** — Phase 1 (croisement : solde des reportés,
contradictions de seconde vague, invariants), Phase 2 (grill : 11 décisions), Phase 3
(corrections appliquées, marquées `(2026-07-07, synthèse)`). **Verdict : PRD prêt pour
l'écriture du contenu — voir README.**

Entrées lues : les 10 rapports (`findings-01` → `findings-08`, + `findings-01b-progression-repasse`
et `findings-verif-globale-02`), les 6 docs de référence, CONTEXT.md, les 4 ADR,
`content/map/*.json`, `content/quests/*.json`.

---

## 1. Solde des reportés — SOLDÉS (traités par un audit ultérieur)

| Reporté par | Point | Soldé par |
|---|---|---|
| 01 | Numérotation « Événement Rocket #2/#4/#7/#9 » (~9 événements fantômes) | Repasse progression P-7 : « Événement Rocket 1/3–3/3 » + Quest ordinaires (`guidebook-adapted.md:299`) |
| 01 | Double comptage quête Charcoal Man (azalea + ilex) | Audit 04 (04-E2 : défusion Kurt/Maître du Charbon) + modèle Quest multi-zones (une quête, un fichier) |
| 01 | Charge SRS (D-1) → algorithme de file | Audit 03 + rythme assumé documenté (PRD:376 : ~300-380 rev/j, ~12-18 mois) |
| 01 | Leçons « poussées » 8-12 kanji : l'écran-livre absorbe-t-il ? | Audit 06 (décisions 2-3 : 1 kanji = double page, le batch est une séquence de doubles pages — aucune limite structurelle) |
| 02, 03 | Emplacement UI des conditions non remplies (« 512/550 ») | Audit 08 (08-D4 : au contact de l'obstacle + page d'agrégat des portes dans le Profil) |
| 03 | « Système de revanche » Cycling Road jamais défini | Audit 04 (téléphone HGSS rétabli : re-matchs = mécanique (3) du registre, PRD:79) — reste le *chiffrage* du périmètre, voir § 2 |
| 04 | 04-E5 : listes Condition/Effect de CONTEXT.md périmées | Repasse progression (CONTEXT.md:55-56 à jour : `count` généralisé, `time_window`, `negate`, `unlock_text`, `remove_item`, `all_texts_read` retiré) |
| 04 | Rôle du SS Aqua | I-1 adopté (transition canonique Johto→Kanto, quête B6 à bord) |
| 04 | Noms français des fichiers dialogue | Verif globale n°2, V-11 (12 fichiers migrés `{jp, en}`) |
| 05 | Cosmétiques : aucune table/menu ne les porte | Audit 08 (items.category `collectible`, chambre 08-D5, Blue Card/points 08-B13, Global Terminal I-10) |
| 07 | Fossile « Hors scope v1 : HM08 Escalade » (guidebook:1190) | Audit 08 (08-E1) |
| 07 | Mapping musique « Union Cave n'existe pas » | Audit 08 (08-E2) |
| verif-2 | Mont Lune non jouable (fossiles) | V-12 (zone `mont-lune-route-3-4` jouable, table de calibration OK) — reste la décision de scène, voir F-D § 2 |

## 2. Solde des reportés — ENCORE OUVERTS

### 2a. Décisions de design → grill (Phase 2)

1. **Dresseurs-combat inventés des routes précoces** (reporté par 01, confirmé par 03, 04, 06, 07-B2) :
   Route 29 « 8-10 dresseurs » (`npc-inventory.md:59`), slots R30/31 au-delà des sourcés, « 5-6 par
   route » R29/33 (guidebook:203 vs 2 nommés/route). La politique zéro-invention actée au grill 01
   porte sur les PNJ-leçon ; le sort des dresseurs-combat génériques n'a jamais été tranché.
2. **Arc Mont Gris / Silver** (07 flag + verif-2 F-D) : les 2 « apparitions Silver bonus » de Mont
   Gris (inventées, hors 6 Rencontres, kanji « à définir ») — adopter ou purger ; l'embuscade de
   Mont Lune — apparition jouable (combat ?) ou scène de continuité.
3. **« Trophée Antre du Dragon »** (01b flag) : lu par 3 gates (Suicune, Mont Gris, Red) sans
   définition formelle — quiz du Maître (texte obligatoire) ou quête N1 de l'inscription du fond ?
4. **Concept « compagnon »** (R10, reporté par 04 et 07) : le gauntlet Kimono dit « un seul
   compagnon par combat », Daisy le « toilette », la chambre l'expose — mais rien ne définit s'il
   existe, d'où il vient, ce qu'il fait. Dernier concept flottant du corpus.
5. **Périmètre téléphone** (04-D3, confirmé 08) : combien de dresseurs enregistrables, fréquence
   des appels entrants, design du 即時応答 (10 s de pragmatique par appel).
6. **Contenus Radio** (08-D2) : nombre d'émissions d'Oak, formats de quiz (l'activation, les canaux
   et Buena sont déjà au PRD:81 — squelette complet).
7. **F-A** (verif-2) : 5 annotations Kanto pré-doctrine « tout utilisable » — réalisateur GAME
   FREAK, comptoir du Musée d'Argenta, évaluation Pokédex d'Oak, cameo Steven, Pal Park —
   adopter/adapter ou purger, cas par cas.
8. **F-B** (verif-2) : langue des noms de zones affichés au joueur (les docs utilisent les noms
   français HGSS comme noms de travail ; ADR-0002 = « no French anywhere in the product »).
9. **F-C** (verif-2) : les labels de Quest Steps sont-ils affichés (journal de quêtes) ou notes de
   travail ? Le PRD référence un marqueur ◎ et un « indice du Journal » (08-B14) — à trancher
   proprement.
10. **Stratégie de chiffrage des zones réintégrées** (P-13, reporté par 01b/02/04/05/06/07) :
    porteuses de croissance kanji (redistribution, gates inchangés) ou plateaux locaux (0 nouveau
    kanji requis, textes + leçons optionnelles) ? Conditionne toutes les lignes de table à écrire.
11. **Keigo** (revue pédagogique, validé sur le principe) : design maintenant (porteurs candidats :
    Président du Fan Club, réceptionnistes Silph Co.) ou passe contenu.

### 2b. Chiffrages — pas de décision utilisateur, à exécuter en Phase 3 (méthode connue)

- **Lignes manquantes de la table de calibration** (P-13) : route-41, Lavender, Routes 5/8/22/43/46,
  Routes 47/48 + Cliff Cave, Union Cave, Ruines intérieur, Îles Tourbillon, Safari Zone (+ rappel :
  les intérieurs n'ont pas besoin de plage propre — gate SRS zones extérieures uniquement, 03-D5).
  Dépend de la décision 10 ci-dessus.
- **Recompte zones × densités** (05) : « ~72 zones » → compte réel, borne « ~70-100 textes
  secondaires » re-vérifiée (`texts-progressifs.md:103-106`).
- **Calibration des 8 seuils N des CS-Kanji** (01b, 05-D2) : corpus de référence par CS = textes du
  chemin critique jusqu'au jalon, N ≤ 60 %. Dépend des deux points précédents.
- **Montants ¥** des récompenses de combat (07 ; PRD § Monnaie).
- **Taille de la pool Disposition-audio** + paramètres du tirage pondéré récent (fenêtre ~50,
  ratio) (07).
- **Score Pokéathlon cumul vs meilleur** (08-B4) : *en réalité déjà tranché* — guidebook:540 (I-5)
  dit « meilleur cumul des 4 » ; il ne reste qu'à aligner la note du PRD (`user_map_state`). → § 3.
- **Mapping musique** : lignes manquantes (zones réintégrées + intérieurs) (08-E2).
- **Tile-authoring** : 16 intérieurs de gym + zones réintégrées — inventaire de production, pas un
  chiffrage de calibration ; à lister comme reste connu.

### 2c. Passe contenu — rien à décider, déjà normé

- Renommage jp des 10 dresseurs Route 29 (`trainers.json`) — règle 04-A1 posée.
- Scripts des émissions d'Oak, contenu du Carnet des compteurs (`counters`), 36 lettres de Fukuda,
  détail des 5 questions du quiz du Maître (02 — lacune de contenu sourcé).
- Sélection des 3 phrases d'exemple par mot et des « 6-8 mots » par kanji (08).
- Barèmes Pokéathlon, niveaux Kanji Flip (I-3/I-5 : designs adoptés, « détails chiffrés » = réglage
  de production).
- `scripts/build/generate-etymology.py` : prompt en français (06-B3) ; 3 kanji sans audio (06-B3).
- Stocks sourcés des Marts → catalogue cosmétique (note déjà au PRD § Monnaie).
- Horaires précis SS Aqua / Magnet Train (I-1, « à la passe contenu »).

## 3. Contradictions de seconde vague

1. **Silver #4 : cameo (audit 02) vs longueur de combat 20 (audit 07)** — `PRD.md:266`, la ligne
   « Silver (6 rencontres) » de la table des longueurs donne « #4 20 » alors que la rencontre #4
   (QG Rocket) est un cameo acté sans combat (`silver_progress.outcome = cameo`, guidebook sourcé,
   V-14 audit 07 a purgé l'hésitation côté curriculum mais la table PRD n'a pas suivi). → Phase 3.
2. **Score Pokéathlon : « tranché à la synthèse » (audit 08) vs déjà défini (I-5)** —
   `guidebook-adapted.md:540` : « `pokéathlon_score` = meilleur cumul des 4 » ; la note de
   `user_map_state` (PRD, 08-B4) le présente comme ouvert. Pas une vraie contradiction, une
   réconciliation à écrire. → Phase 3.
3. Points chauds vérifiés **sans contradiction** : condition de lecture des CS-Kanji
   (`count(texts_read, N)` uniforme PRD/CONTEXT/texts-progressifs/guidebook, aucun `all_texts_read`
   vivant) ; flux nouvelles cartes (06 aligné sur 03-D3, pas de plafond — cohérent 01/03) ; lien
   dresseurs↔SRS (zéro couplage, re-matchs = pool commun, invariant « aucun appel ne parle de
   cartes dues » préservé) ; tables du modèle de données (les 29 lignes du schéma PRD croisées avec
   02/03/05/08 : cohérentes, `daily_status` couvre le trou V-3) ; PNJ multi-zones (un `npc_id` par
   personnage×zone + Quest partagée, PRD:912 = ADR-0004, aucun doc divergent).

## 4. Balayage des invariants

- **Maîtrise/stabilité/FSRS comme déblocage hors mécanisme B** : ✅ propre, à un résidu de prose
  près — `PRD.md:562` « à "chasser" en maîtrisant suffisamment de grammaire » (les conditions de la
  table en dessous sont bien des `count(grammar_encounters)` ; « maîtrisant » est un mot de trop).
  → Phase 3.
- **« 3 CS-Kanji » / donneur erroné** : ✅ aucune occurrence vivante. ⚠️ Le nombre canonique du
  prompt (« 7 CS-Kanji ») est périmé : **8** depuis la réintégration de 登 (2026-07-06, R6) —
  vérifié uniforme (PRD:847 « les 8 », table guidebook:29/1183, texts-progressifs 8 lignes), sauf
  **un** résidu : `npc-inventory.md:377` « aucun des 7 CS-Kanji ». → Phase 3.
- **`kanji_pool` / theming par PNJ** : ✅ purgé des docs (07-A1) ; **résidu de données** :
  `content/map/trainers.json` porte encore `kanji_pool[]` sur les 10 entrées Route 29 (la purge
  était actée « passe contenu » — mécanique, autant la faire maintenant). → Phase 3.
- **Nombres canoniques** : 2136 ✅ (13 occurrences PRD, 0 divergente), 8 CS-Kanji ✅ (1 résidu
  ci-dessus), 6 Silver ✅ (+ bonus explicitement « hors 6 Rencontres » partout — leur sort = grill),
  5 Kimono ✅, 3 Rocket (`rocket_progress` 1–3) ✅, 16 badges ✅ (12 occurrences), 27 classes ✅
  (table retirée, mentions historiques seulement).
- **Résidu isolé** : `content/map/story-beats.json:538` « Red : 50 questions » — la correction
  50→100 (audit 01, A-4) avait oublié ce fichier (signalé par l'audit 02). → Phase 3.
- **Renvois inter-docs** : extraction mécanique des « § X » (61 candidats), vérification manuelle —
  tous pointent vers des sections existantes (la plupart sont des ancres en gras, pas des titres
  markdown ; aucun renvoi mort trouvé).

## 5. Phase 2 — Grill (décisions du 2026-07-07)

| # | Point | Décision |
|---|---|---|
| 1 | Dresseurs inventés routes précoces | **Fidélité stricte** : Route 29 sans dresseur (comme HGSS), purge des 10 prototypes de `trainers.json` ; génériques gardés uniquement là où le guidebook les mentionne, dénombrés à la passe contenu |
| 2 | Chiffrage zones réintégrées | **Redistribution complète** : les zones réintégrées du chemin critique portent de la croissance kanji, fenêtres recalculées entre les gates verrouillés ; contrainte anti-famine — les zones optionnelles (Îles Tourbillon, Safari, Ruines intérieur, Route 46…) restent des plateaux |
| 3 | Arc Silver post-Johto | **Tout l'inventé purgé** : les 2 apparitions Mont Gris disparaissent ; le sourcé adopté en entier — combat Mont Lune (vérifié canonique HGSS par recherche web), Tag Battle de l'Antre, revanches hebdo au Plateau Indigo (lun/mer, `time_window`) |
| 4 | Trophée Antre du Dragon | **Quête N1 de l'inscription du fond** : quiz de lecture N1 (registre classique) → item `unique` `trophee-antre` ; les 3 gates (Suicune, Mont Gris, Red) le lisent en `item_owned` |
| 5 | Compagnon | **Cosmétique : un Pikachu, le même tout le jeu**, remis par Elm (scène des 3 Balls adaptée), marche derrière le joueur (signature HGSS), joue les scènes sourcées (Naoko, Daisy, pension) — zéro mécanique |
| 6 | Périmètre téléphone | Registre = **donneurs de numéro HGSS uniquement** (dénombrement passe contenu) ; **1-3 appels entrants/jour** (Fukuda systématique + ≤1 dresseur + scénarisés aux beats) ; 即時応答 = 3 réponses, zéro pénalité, zéro SRS, aucune stat affichée |
| 7 | Radio — émission d'Oak | **Quiz (3 QCM optionnels) + bibliothèque d'émissions sur le modèle exact des textes** : espace dédié dans l'onglet ラジオ, découvertes visibles, dorées = quiz intégralement réussi, réécoutables/retentables ; volume alimenté à la passe contenu ; tables `radio_shows`/`radio_show_completions` |
| 8 | F-A (5 éléments Kanto) | **Adopter 4** : Oak évalue le Kanjidex ; réalisateur GAME FREAK = diplôme des 2136 ; Musée d'Argenta = 3-4 textes N1 ; Steven = scène post-Red + objet de collection ; **Pal Park = intérieur réel sans fonction** (classé avec le Battle Frontier) |
| 9 | F-B (noms de lieux) | **Japonais officiels** (ワカバタウン…) au bandeau/carte/dialogues, X = anglais officiel ; le français reste nom de travail interne des docs |
| 10 | F-C (quêtes) | **Journal de quêtes en écran séparé** — entrée menu START ぼうけんノート : quêtes en cours, nom + étape actuelle (jp, X = en) ; `quests.name`/`steps[].label` deviennent `{jp, en}` |
| 11 | Keigo | **Mini-jeu dédié** : « Salon du keigo » au Fan Club de Vermeille (même intention, trois interlocuteurs, QCM), variante professionnelle aux réceptionnistes Silph Co. ; zéro SRS, récompense collection |

## 6. Phase 3 — Corrections finales (appliquées le 2026-07-07)

### Corrections mécaniques (invariants, § 3-4)
- `story-beats.json` : « Red : 50 questions » → 100 ; Silver #3 « devant Tour Jo » → Tour Embrasée
  (résidu V-15 trouvé en passant) ; don du Karate King adapté (objet de collection).
- `npc-inventory.md:377` : « 7 CS-Kanji » → 8.
- `PRD.md` : légendaires « en maîtrisant » → « en rencontrant » (:562) ; table des longueurs — Silver
  #4 = cameo sans combat + ligne « arc Kanto » ajoutée ; note `pokeathlon_score` réconciliée avec I-5
  (meilleur cumul des 4) ; Bicyclette = cadence de pas ×2, toujours un tile par pas.
- `trainers.json` : **vidé** (les 10 prototypes Route 29 supprimés — décision 1) ; toutes les mentions
  des « 8-10 dresseurs » purgées (PRD, guidebook ×3, npc-inventory).
- `guidebook-adapted.md:1266` : « 力/Coupe » → 切 (même coquille que V-13) ; sens de la Tag Battle
  corrigé (joueur + Rival **contre** Lance + Clair — l'ancien texte inversait les camps, vérifié web).

### Application des 11 décisions du grill (§ 5)
Chaque décision est écrite dans les docs : PRD (§ Langue du Jeu — noms de lieux jp ; § Menu Principal —
ぼうけんノート en slot 5 ; § Pokégear — périmètre téléphone + 即時応答 + bibliothèque Radio ;
§ Silver — arc Kanto ; § Compagnon — Pikachu cosmétique ; § Monnaie — barème ¥ ; Trophée Antre défini
sous le gate Mont Gris ; schéma : `radio_shows`/`radio_show_completions` ajoutées, `quests.name`/`label`
bilingues), guidebook (Salon du keigo § Vermeille, 5 éléments F-A adoptés/classés, Silver bonus purgés,
Mont Lune combat, dictée/Unown/Safari/Farfetch'd designs réglés), curriculum (arc Kanto Silver, bonus
purgés), npc-inventory (lignes Silver bonus supprimées, Mont Lune = combat), side-content (Steven D2),
CONTEXT.md (entrées Adventure Journal + Radio Library).

### Chiffrages (§ 2b, tous soldés)
- **Table de calibration : 72 → 83 zones** — 11 lignes ajoutées ; croissance redistribuée sur le chemin
  critique (Union Cave 140–175, Route 41 480–510, Route 43 535–565, Lavender 1220–1240 ; voisines
  resserrées : route-32/33/40, power-plant, cerulean), plateaux pour l'optionnel (Îles Tourbillon,
  Safari + 47/48/Cliff Cave, Routes 46/5/8/22), intérieurs sans ligne (héritent de la zone d'accès).
  Note § Redistribution ajoutée ; aucun gate déplacé ; densité Kanto ~56 → ~50 kanji/zone.
- **Recompte textes** : ~85-115 secondaires sur 83 zones (texts-progressifs, PRD alignés).
- **Seuils N des 8 CS-Kanji** (méthode 05-D2) : 砕 6 · 切 12 · 水 20 · 飛 26 · 力 29 · 渦 32 · 滝 35 ·
  登 60 — N ≈ 50-55 % du corpus estimé, contrainte dure ≤ 60 %, re-vérifié au placement réel.
- **¥** : récompense = `battle_length × ¥40` (échelle auto-alignée sur la table des longueurs) ;
  prix de référence ¥300-5000, ratio ~3-5 victoires par achat moyen.
- **Pool Disposition-audio** : ~600 phrases (~120/palier), ~25-35 Mo opus, chargement par palier.
- **Tirage pondéré récent** : fenêtre 50 items, 70 % fenêtre / 30 % historique.
- **Musique** : règle du mapping identité posée (chaque zone HGSS garde sa piste d'origine — résolution
  mécanique à la passe assets ; la table ne garde que les arbitrages).
- **Volume PNJ-leçon** : ≈ 290-385 (réintégrations : +8-10 leçons Johto, +2-3 Kanto).

### Restes connus (hors périmètre docs — passe contenu / passe assets)
1. **Passe contenu** : scripts des émissions d'Oak + quiz ; contenu du Carnet des compteurs ; 36 lettres
   de Fukuda ; 5 questions du quiz du Maître (lacune de source) ; micro-lignes `{jp, en}` des quêtes
   (~150-200) ; noms jp officiels des zones (`name {jp, en}` du registre) ; dénombrement des donneurs
   de numéro téléphone et des dresseurs génériques par route (dépouillement guidebook) ; sections
   npc-inventory des 11 zones réintégrées ; sélection des 3 phrases/mot et 6-8 mots/kanji ; réglages
   Kanji Flip/Pokéathlon/concours ; stocks-catalogues des Marts ; horaires SS Aqua/Magnet Train ;
   re-calcul des seuils N au placement réel des textes.
2. **Passe assets** : tile-authoring (16 intérieurs de gym, zones réintégrées, parois 登, Tour Jo,
   Phare) ; sprite follower du Pikachu (planche à vérifier dans le dump) ; résolution du mapping
   musique identité ; audio pool Disposition (batch VOICEVOX).
3. **Code/data** : prompt français de `generate-etymology.py` (06-B3) ; 3 kanji sans audio.

---

## 7. Passe de vérification post-synthèse (2026-07-08)

Relecture systématique de tout ce que la synthèse a écrit, croisée avec l'ensemble du corpus
(docs + JSON de données). **10 reliquats corrigés (SV-1→SV-10), 5 flags consignés.**

| # | Reliquat | Correction |
|---|---|---|
| SV-1 | **5 budgets `npc-inventory` sur les anciennes fenêtres** (route-32 110–170, route-33 150–190, route-40 460–505, cerulean 1220–1350, power-plant 1220–1235) — la redistribution avait mis à jour la table de calibration mais pas les sections d'inventaire qui la dupliquent | Alignés sur les nouvelles fenêtres, annotés |
| SV-2 | « 22 zones Kanto » ×2 (PRD § Ordre des zones, guidebook § musique) | → 26 |
| SV-3 | « ~70-100 textes » ×5 survivants (texts-progressifs pipeline, side-content ×2, japanese-books-mapping ×2) | → ~85-115 |
| SV-4 | PRD:537 (gauntlet Kimono) disait encore « un seul compagnon par combat » — corrigé côté guidebook mais pas côté PRD | → flaveur de dialogue, renvoi § Compagnon |
| SV-5 | Scènes d'Elm « fait choisir parmi 3 Poké Balls » ×2 (guidebook) — non alignées sur la décision Pikachu | → remise du Pikachu, compagnon unique |
| SV-6 | « variantes de sprite du buddy Pokémon » (texts-progressifs, catalogue cosmétique) | → variantes de palette du compagnon (Pikachu) |
| SV-7 | **`placements/mt-silver-route-28.json` et `mt-silver-upper.json` portaient encore les 2 apparitions Silver bonus purgées** | Entrées supprimées (2→1 npc chacun) |
| SV-8 | **10 fichiers de dialogue orphelins** `content/dialogues/trainers/route-29/*.json` (les dresseurs supprimés par la décision 1) | Supprimés, dossier retiré |
| SV-9 | ADR-0003 décrivait les Quest Steps comme « for human reference » — périmé depuis le Journal de quêtes | Amendement ajouté (name/label affichés, {jp, en}) |
| SV-10 | side-content A5 (inscription de l'Antre) ne mentionnait pas sa nouvelle récompense | → Trophée Antre du Dragon |

**Vérifié sain** : tous les JSON valides ; 0 table markdown malformée (vérif. mécanique des comptes
de cellules sur les 6 gros fichiers) ; nombres canoniques uniformes ; « Silver ×9 » reste juste
(6 Rencontres + Mont Lune + Antre + Plateau = 9 zones) ; aucun « à la synthèse » non soldé ;
route-29 : placements et npcs.json ne contenaient que du sourcé (rien d'autre à purger).

**Flags consignés (pas des erreurs — à traiter aux passes suivantes, repris dans la roadmap)** :
- ~~**FV-1**~~ **Soldé 2026-07-08, audit 10, point 10, tranché au grill** : le pic de difficulté
  (trophée Suicune, lecture N1 en registre classique, ~1350 kanji, avant le palier N1 normal
  ~1670) est **assumé tel quel**, sans changement à l'ordre Raikou→Entei→Suicune (I-2) — cohérent
  avec l'Antre du Dragon déjà pensé comme un lieu à part (combat de Clair déjà une exception),
  amorti par les filets existants (furigana Y, retry illimité). Détail : `PRD.md` § Légendaires
  — Boss de Grammaire.
- **FV-2** : `story-beats.json` ne couvre que Johto + Mont Gris (48 zones) — aucun beat pour les
  26 zones Kanto ni les 11 réintégrées (dépouillement guidebook à la passe contenu).
- **FV-3** : `placements/` manque ~14 zones (dont route-33 et mont-lune-route-3-4, pourtant
  anciennes) — génération à la passe contenu.
- **FV-4** : `quests/*.json` : `name`/`labels` encore monolingues anglais — migration `{jp, en}`
  actée, à faire à la passe contenu.
- **FV-5** : fil Steven, étape 1 : « déclenche une rencontre légendaire ailleurs » est un fait
  source sans adaptation définie — à trancher à l'écriture de la scène (simple ligne de dialogue
  suffit).
