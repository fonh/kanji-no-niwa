# Findings — Repasse progression + intégration side quests/mini-jeux

Date : 2026-07-06 (après la session 4 de l'audit 04, doctrine « tout utilisable »). **Statut :
Phase 1 terminée** — incohérences relevées (P-x), corrections sûres appliquées (reliquats de
décisions déjà actées, marquées `(corrigé 2026-07-06, repasse progression)`), **propositions
d'intégration (I-x) à griller avec Henri** avant application. Docs audités : PRD,
curriculum-checkpoints, texts-progressifs, side-content-inventory, guidebook-adapted,
findings-01 (pour non-régression).

## Vérifications OK (aucune correction)

- **Gates vs plages kanji, les 16 badges** : tous les gates tombent dans (ou en haut de) la plage
  de leur zone — Johto : Falkner 80 (violet 80–130), Bugsy 150 (~azalea 160), Whitney 250
  (goldenrod 240–290), Morty 370 (ecruteak 350–410), Chuck 500 (cianwood 480–520), Jasmine 600
  (revisite, documenté), Pryce 560 (mahogany 530–560), Clair 650/印 720 (blackthorn/antre) ;
  Kanto : Surge 1050 → Blue 2100, chacun en sommet de plage de sa ville. La Ligue plate (870–900)
  et le segment 1950→2136 par revisites ferment le compte — les décisions de l'audit 01 tiennent.
- **Anti-deadlock CS-Kanji** : l'invariant de placement (audit 02) et le menu « tous les textes »
  couvrent le risque connu. (Mais voir P-2 et P-15 : deux angles morts nouveaux.)
- **Boucle quotidienne vs contenu calendaire** : `time_window` + règle de fréquence (audit 02)
  portent bien C1–C15, Kurt 24h, Loterie, Buena 11h. Pas de conflit avec le gate SRS (zones
  extérieures uniquement).
- **Route Victoire** : pas un trou de table — `indigo-plateau-antichambre` *est* la Route
  Victoire dans ce projet (curriculum L578).

## Corrections appliquées (reliquats mécaniques de décisions déjà actées)

| # | Reliquat | Fix |
|---|----------|-----|
| P-3 | Achievement « CS-Kanji : les 7 » sans 登 (non-répercussion de R6, même jour) | « les 8 » + 登 (PRD § Achievements) |
| P-4 | « 5 Kimono Girls battues » dans les gates Mont Gris et Red (reliquat audit 01 : les rencontres sont des scènes) | « gauntlet Kimono vaincu (les 5 rencontrées) » ×2 ; redondance avec le gate Plateau Indigo notée, conservée pour lisibilité |
| P-5 | `texts-progressifs.md` : « Sur 57 zones » + § « Kanto reste compressé… réserve pour une extension future » — fossiles contredisant la géographie complète (04-B1) et « aucune v2 » | ~72 zones (recompte synthèse) ; § réécrit : les textes secondaires couvrent villes **et** routes/donjons Kanto |
| P-8 | Gate Whitney « 3 quêtes NPC = zéro marge, assumé » périmé | Offre avant Doublonville ≈ 5 candidates post-réintégrations (courrier R31, Earl, Charbon/Farfetch'd, Rapport Unown, Apricorn Box) ; gate inchangé à 3, note de marge |
| P-11 | PRD § Géographie complète : Routes 47/48 + Cliff Cave (accès Safari) absentes de l'énumération alors que la table du guidebook les réintègre | Ajoutées à la liste |
| — | `texts-progressifs.md` table CS 切 : « le joueur capture 2 Farfetch'd » | « guide » (puzzle spatial adapté, U8) |

## Incohérences à trancher (P-x)

### P-1 — Gate de Chuck : le Pokéathlon existe dans un doc sur trois

`guidebook-adapted.md` L542 (« Condition Chuck 試練 : `pokéathlon_score(⚙250)` ») et
`side-content-inventory.md` G3 affirment un gate Pokéathlon sur Chuck ; la table des gates du
PRD (§ Système 道場) ne le mentionne pas (10 points N3 + quête du Phare commencée). Le PRD §
Implémentation cite pourtant `pokeathlon_score` comme exemple de métrique `count` — le modèle
le connaît, le gate ne l'utilise pas. **Décision requise** : ajouter le gate au PRD (recommandé —
voir I-5 : c'est la seule intégration mécanique du hub mini-jeux à la progression, thématiquement
sourcée « épreuves athlétiques », atteignable en 1-2 sessions) ou purger les deux mentions.

### P-2 — Le compte « ~20-21 textes obligatoires » oublie les 8 textes CS-Kanji

§ CS-Kanji (PRD + texts-progressifs) : chaque CS est remis via un **texte obligatoire** (7 remis
par PNJ + 滝 trouvé). Or le § Modèle de texts-progressifs compte 16 badges + 3 Rocket + Antre +
Red ≈ 20-21, sans les 8 textes CS — et le **scope du tagging grammaire** (« seuls les ~20-21
obligatoires sont tagués ») les exclut donc aussi. Vrai total ≈ **28-29**. Décision : les inclure
au compte et au tagging (recommandé, coût quasi nul), ou requalifier les remises CS en catégorie
propre hors « obligatoires ».

### P-6 — Légendaires : conditions fossiles d'avant le remapping grammaire

Les conditions datent d'avant le remapping Kanto (2026-07-05) : **Entei « 10 points N1
rencontrés »** ne peut plus se produire avant ~1670+ kanji (le N1 ne commence qu'aux zones
Grotte Diglett/Argenta) — un « légendaire de Johto » réglé aux deux tiers du Kanto, probablement
non voulu (avant remapping, le N1 commençait à la Ligue). **Suicune « trophée Antre du Dragon »**
(~720, fin de Johto) court-circuite le fil Eusine (D1) dont la scène climactique sourcée est
Route 25 (Kanto, ~1350) — le plus long fil optionnel du jeu perd son payoff. Raikou (15 N2,
fin de Johto) est cohérent. → Proposition de recâblage : I-2.

### P-7 — Numérotation « Événement Rocket #1–#9 » toujours ouverte (depuis audit 01)

Le guidebook numérote ~9 événements Rocket (#2 Ruines, #4 Tour Embrasée, #8 Antre = optionnels) ;
le PRD ne définit que 3 lieux (`rocket_progress` 1–3). Proposition : les optionnels deviennent
des `Quest` ordinaires **sans numéro Rocket** (renommer « Événement Rocket #N » → « quête Rocket
optionnelle <lieu> » dans le guidebook) ; seuls les 3 lieux canoniques écrivent `rocket_progress`
et déclenchent les lettres de Fukuda. Aucun nouveau modèle.

### P-9 — « Hint token » : récompense fantôme

`curriculum-checkpoints.md` L269 (exemple PNJ Route 29) : « → Récompense : Hint token » — concept
défini nulle part. Proposition : remplacer par une récompense du catalogue des textes secondaires
(cosmétique/confort contextuel), ou le définir comme un usage gratuit du Dowsing MCHN (I-9).

### P-10 — Transition Johto→Kanto : aucun document ne dit comment on atteint Vermeille

L'ordre des zones saute « Plateau Indigo → Vermeille City » sans support. En HGSS c'est
précisément le **SS Aqua** (billet remis par Elm après la Ligue, traversée Oliville→Vermeille) —
et la traversée réelle vient d'être actée (session 4, U10). → I-1.

### P-12 — Spécialité Moomoo : « objet de soin, 500 chacun »

Objet de soin sans fonction (aucun PV hors combat) + prix dans une monnaie qui n'existe pas
encore. À absorber dans la décision monnaie (candidat #6 de la session 3) → I-8.

### P-13 — Trous de table de calibration attendus, à ne pas oublier à la synthèse

route-41 (défusionnée, sans ligne), Lavender, Routes 5/8/22/43/46/47/48, Union Cave, Ruines
intérieur, Îles Tourbillon, Safari, Cliff Cave, + tous les `zone_id` d'intérieurs (tours, QG,
Librairie, navire SS Aqua…). Le gate SRS ne s'applique pas aux intérieurs (03-D5) — seules les
zones extérieures réintégrées ont besoin d'une plage kanji propre.

### P-15 (MAJEUR, architectural) — `all_texts_read` vs contenus de lecture des mini-jeux

La condition CS-Kanji exige **tous** les textes des zones débloquées. Si les contenus de lecture
produits par les boucles adaptées — Safari (« attraper des contenus »), feuilleton de la pension,
prix du Game Corner/Loterie, concours du Parc — entrent dans la table `texts` avec un `zone_id`,
ils sont aspirés dans `all_texts_read` : chaque CS exigerait de vider la Safari (grind forcé), et
un contenu **renouvelable** rendrait la condition littéralement insatisfiable → jeu bloqué. C'est
le même deadlock que l'invariant de placement (audit 02) couvrait pour les obstacles, sous un
angle neuf. **Règle proposée** : les contenus de lecture issus des boucles répétables/mini-jeux ne
sont **pas** des lignes de `texts` — ils vivent dans une collection du Sac (type « collection de
lecture », comme les Boules de Kurt), hors `all_texts_read` et hors Journal de lecture gaté.
Alternative : champ `counts_for_all_texts: false` sur `texts`. À trancher avant tout design de
mini-jeu à la synthèse.

## Propositions d'intégration (I-x) — à griller

### I-1 — SS Aqua = transition canonique Johto→Kanto (résout P-10)

Comme en jeu : après la Ligue, **Elm remet le billet SS Aqua** (appel Pokégear sourcé), le joueur
embarque à Oliville → arrivée Vermeille. La quête de la petite-fille (B6) se joue à bord pendant
cette première traversée — une side quest placée sur le chemin critique sans être un gate.
Retours ultérieurs : SS Aqua régulier (jours de semaine, C9 Plaques du capitaine) + **Magnet
Train** débloqué par la quête Copycat (B1 : poupée → Pass) = le voyage rapide inter-régions est
la récompense d'une side quest, exactement comme en HGSS. 飛 (Vol) reste intra-région pour
préserver cette valeur (à confirmer).

### I-2 — Suicune × Eusine, et recâblage Entei (résout P-6)

Suicune suit le fil D1 sourcé : apparitions trackées (Irisia → Route 42 → cameos Kanto) et
**combat final Route 25 après la rencontre Misty**, comme en HGSS — condition = étapes de la
`Quest` Eusine + le compte grammaire « registre classique » existant. Entei recâblé sur du N2
tardif (ex. 25 points N2 — post-Ligue/début Kanto) pour rester « chassable » dans la fenêtre où
le joueur revient en Johto ; Raikou inchangé (15 N2, fin de Johto). L'escalade 45/52/60 questions
suit alors l'ordre réel de résolution (Raikou → Entei → Suicune).

### I-3 — Game Corner = « Kanji Flip » (adaptation de Voltorb Flip)

Le Game Corner HGSS européen **est** Voltorb Flip — le calque le plus fidèle possible. Grille
5×5 ; retourner une tuile demande lecture ou sens d'un kanji du `studiedSet` (pioche comme un
combat, zéro SRS) ; bonnes réponses → multiplicateur de jetons, tuile piégée → perte de la mise
du tableau ; indices de lignes/colonnes comme dans l'original (raisonnement + révision). Jetons
dans le Coin Case, prix : cosmétiques, décorations (→ I-8), gros paliers de collection. Jamais
d'achat de jetons (pédagogiquement gagnés). Aucun gate de progression ne dépend des jetons.

### I-4 — Loterie = « le kanji du jour »

Tirage quotidien d'un kanji Jōyō (Tour Radio 1F). Dans le `studiedSet` → prix ; **maîtrisé**
(stabilité ≥ 30j, le « doré » du Kanjidex) → gros prix ; inconnu → lot de consolation + lien vers
sa fiche Kanjidex (découverte). Lecture seule de l'état SRS (comme `studiedSet` en combat),
aucune écriture — l'invariant tient. Remplace « l'ID du compagnon » de l'original sans attendre
le concept compagnon.

### I-5 — Pokéathlon : mapping des 4 disciplines (et P-1)

Les noms existent déjà (guidebook) ; proposition de contenu : **Reading Blitz** = lecture rapide
chronométrée (mots du studiedSet, choisir la lecture) ; **Word Forge** = Composition en rafale
(tuiles kanji → mots valides) ; **Kanji Sprint** = Saisie chronométrée ; **Chasse au Trésor** =
mini-Disposition/repérage. Le chrono est l'identité des mini-jeux — la règle « aucun chrono »
(PRD) porte sur les **combats**, à préciser d'une ligne. `pokeathlon_score` = meilleur cumul.
Recommandation P-1 : **garder le gate Chuck 250** — unique pont mini-jeu→progression, sourcé
thématiquement, non punitif.

### I-6 — Concours du Parc (mar/jeu/sam) : la Safari en format compétition

Épreuve chronométrée (20 min dans l'original) : trouver des mots/kanji cachés dans les hautes
herbes du parc, score jugé contre des concurrents sourcés ; paliers de récompense (baies,
Apricorns, décoration rare au 1er prix). Réutilise le créneau C15 et le modèle de collecte
Safari — un seul design pour deux features.

### I-7 — Pension Route 34 : le feuilleton des grands-parents

Plutôt que d'attendre le concept compagnon : chaque jour de visite, les grands-parents de Lyra
racontent **l'épisode suivant d'une série graduée** (les serials Tadoku existent exactement pour
ça) — un feuilleton quotidien calé sur la cadence SRS, récompense de fin de série. Hors
`all_texts_read` (P-15). L'option « dépôt/maturation liée au compagnon » reste possible en plus,
à la synthèse.

### I-8 — Monnaie ¥ + la chambre du joueur comme vitrine (résout candidat #6 et P-12)

¥ gagnés aux victoires de dresseurs (fidèle HGSS), dépensés en **pur cosmétique/collection** :
Mart (décorations, objets de flaveur), spécialité Moomoo, RageCandyBar (rituel d'Acajou),
Salon/styliste du Tunnel (avatar), Herboriste. Et le mécanisme HGSS de **Mom qui épargne** (%
automatique, achète des décorations surprises) alimente **la chambre du joueur** — intérieur réel
depuis la session 4 — qui devient la vitrine des décorations/collections (résout aussi « à quoi
servent les décorations » de C12/Moomoo/Seal Case). Zéro impact SRS/combat ; jetons du Game
Corner restent une devise séparée, comme en jeu.

### I-9 — Dowsing MCHN = détecteur de textes non découverts

L'objet sourcé de Rosalia (homme à l'énigme, F4) devient un « chaud/froid » sur la carte pour les
`found_object_ref` non découverts de la zone courante. Synergie directe avec `all_texts_read` :
c'est l'outil de confort qui rend la condition CS juste sur le terrain (en plus du Journal).

### I-10 — Global Terminal = salle des collections + échange de doublons

Vue des collections (Boules, Plaques, décorations, prises Safari, scores) + **échange des
doublons** contre jetons/¥ — une fonction réelle sans nouveau système lourd, cohérente avec
« pas de trophée décoratif ».

### I-11 — Bicyclette = objet-clé de la Cycling Road

Prêtée par le gérant de Doublonville (sourcé, « bonne publicité »), `item_owned` gate de la
Cycling Road (fidèle : le garde refuse sans vélo) + vitesse ×2 sur la carte. Résout le candidat
#3 sans rien coupler.

### I-12 — La Radio comme tableau du jour

L'onglet Radio (émissions d'Oak, Buena 11h) **annonce le contenu calendaire du jour** : frère/sœur
du jour, concours mar/jeu/sam, photographe, mercredi sec du Lac Colère. Façon diégétique de
surfacer les `time_window` sans nouveau menu — la radio d'HGSS faisait exactement ça.

### I-13 — Blue Card : comptoir d'échange des points Buena (cosmétiques), comme en jeu.

### I-14 — Ne PAS généraliser les gates de side quests

Le système CS/`all_texts_read` force déjà la lecture de tout le contenu secondaire aux 8 remises
de CS — ajouter des comptes de quêtes aux gates de badges doublonnerait la pression. Garder les
gates ponctuels existants (Whitney 3 quêtes, Chuck Phare + Pokéathlon si P-1 adopté), rien de
plus.

## Renvois

- Synthèse (audit 09) : P-13 (plages des zones réintégrées + intérieurs), designs I-3→I-8 chiffrés,
  concept compagnon (R10), périmètre téléphone.
- Audit 05 (textes) : P-2 (compte obligatoires), P-15 (règle d'exclusion), densités Kanto révisées.
- Audit 08 (menus/DB) : collection de lecture du Sac (P-15), écran chambre/décorations (I-8),
  vue Global Terminal (I-10).
