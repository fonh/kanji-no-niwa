# Findings — Audit 03 : SRS/FSRS et boucle quotidienne

Date : 2026-07-06. **Statut : audit terminé** — Phase 1 (findings), Phase 2 (grill, décisions
ci-dessous), Phase 3 (corrections appliquées aux 3 docs, marquées `(corrigé 2026-07-06, audit 03)`).
Docs audités : PRD (`.scratch/kanji-no-niwa/PRD.md`), `content/curriculum-checkpoints.md`,
`content/guidebook-adapted.md`, rapports `findings-01-progression.md` et
`findings-02-condition-effect.md` (pour les décisions déjà actées).

## Décisions du grill (2026-07-06) et corrections appliquées

1. **Backlog (03-D1) — plafond de rattrapage** : en régime normal, session terminée = file du jour
   vide (inchangé) ; si la file dépasse 200 cartes (retour d'absence), le ✓ du jour s'obtient à
   200 cartes (~30-40 min), le reste s'étale — FSRS gère le retard carte par carte, pas de
   replanification. → PRD § Boucle Quotidienne + § Système SRS + `getDailySRSStatus`.
2. **Dresseurs « ! » (03-A3) — purgés, combat et SRS strictement indépendants** : un combat ne lit
   ni ne note jamais une carte FSRS. « ! carte due », « messages des dresseurs », « push
   notifications » supprimés partout (PRD § Pokégear ; guidebook règles 5 et 8). → 03-C1 réglé du
   même coup.
3. **Streak (03-D2) — assiduité de connexion** : +1 chaque jour où le statut atteint ✓ (session
   terminée OU rien à faire) ; app non lancée = cassé même sans carte due ; jour 1 (onboarding) = 1.
   → PRD § Streak réécrit.
4. **Nouvelles cartes (03-D3) — tout au lendemain matin, « étudié » = leçon complétée** : kanji et
   mots débloqués deviennent dus à partir du lendemain ; la file du jour n'enfle jamais après le ✓.
   `studiedSet`/gates/pools s'incrémentent à la complétion de leçon. → PRD § Système SRS.
5. **Graduation anglais (03-A2) — la maîtrise 30 j fait foi** : l'anglais est le support de quiz
   pendant l'acquisition, bascule à stabilité ≥ 30 j ; le mécanisme C réécrit (plus de « une seule
   fois / première exposition »). → PRD § Langue du Jeu + table des modes + graduation.
6. **Renommage « Écriture » → « Saisie »** (docs de travail uniquement) : le mode consiste à taper
   la lecture au clavier romaji→kana, jamais à tracer un kanji — le nom prêtait à confusion
   (relevé par l'utilisateur au grill). → 7 occurrences PRD.
7. **Centre Pokémon (03-E3) — 3ᵉ point d'entrée SRS** : même session/file/✓ que Fukuda/Pokégear ;
   vocabulaire « Mode Direct »/« /library » purgé. → PRD § Boucle Quotidienne point 2 + guidebook
   (3 emplacements).
8. **Boules de Kurt (03-C2) — collection pure** : aucun effet mécanique sur le SRS (intégrité
   FSRS) ; l'intérêt est le rituel 24 h + complétionnisme, texte de Kurt conservé. → guidebook
   azalea-town.
9. **Conventions (03-D4/D5/D6)** : jour = minuit local de l'appareil, statut réévalué au lancement
   et à l'entrée en nouvelle zone, ✓ acquis jusqu'à la bascule, lancements suivants silencieux ;
   blocage = pas annulé/repoussé d'une case + message, gate limité aux zones extérieures (étages/
   salles exemptés) ; file de session = **mélange intégral** reviews + nouvelles (choix utilisateur,
   contre la reco « reviews d'abord »). → PRD § Boucle Quotidienne + § Système SRS.
10. **Corrections A/B/E sans grill** : déblocage vocab « maîtrise » → « étudié » (03-A1,
    curriculum L153) ; `srs_cards` re-schématisée `item_type/item_id/facet` (03-B1) ; table
    `srs_reviews` ajoutée (03-B2) ; `visited_zones[]` ajouté à `user_map_state` (03-B3) ;
    `mastery_events` supprimée (03-C3) ; traces « rank 4/7 », « Silver lettre 2 », « dresseur
    spécial 1/5 », « trainers SRS » purgées du guidebook (03-E1/E2/E4).

## Ce qui est déjà solide (vérifié, aucune correction)

- **Boucle quotidienne** (PRD L86-95) : les 6 points couvrent l'appel, le refus + rappel via
  Pokégear, la session, le badge ✓, le gate « nouvelle zone », et le cas « aucune carte due ».
- **Gate SRS = mécanisme à part, jamais une `Condition`** — tranché par l'audit 02 (finding 02-D4),
  paragraphe dédié PRD L95. Rien à retoucher.
- **« Nouvelle zone » est défini** : « route ou ville non encore visitée » (PRD L92) — le gate ne
  s'applique jamais au retour en arrière ni à la présence d'un PNJ (L95).
- **Structure des cartes** : 2 cartes par kanji (sens + lecture) + 2 par mot, file unifiée
  (`card_type`), 4 notes FSRS (PRD L321-326 ; curriculum L141).
- **Charge assumée** : ~19 944 cartes, ~40-55 nouvelles/j, ~300-380 reviews/j ≈ 1h/j, pas de
  plafond quotidien — documenté et **explicitement conservé au grill de l'audit 01 (décision 7)**.
  Le « cap de nouvelles cartes/jour » est donc une décision déjà prise (pas de cap), non re-débattue
  ici ; seul le **backlog de reviews après absence** reste ouvert (voir 03-D1).
- **CS-Kanji jamais débloqués par la maîtrise** : vérifié partout (PRD L123-131, L372-377, L788 ;
  guidebook règle 3 ; curriculum L571). Aucune trace résiduelle de l'ancien modèle.
- **Grammaire hors SRS** : cohérent partout (PRD L217, L276, L334).

---

## Findings

### 03-A1 (A/E) — Déblocage de vocabulaire : curriculum-checkpoints exige encore la « maîtrise » des kanji

- PRD L330 (seuil assoupli 2026-07-01) : les mots rejoignent la file **dès qu'un kanji est étudié**
  (« simplement en file SRS — pas besoin d'attendre sa maîtrise »).
- `curriculum-checkpoints.md` L153 : « le déblocage réel dépend de la **maîtrise FSRS des kanji
  (30 jours de stabilité)** » — c'est l'ancienne règle, jamais mise à jour après l'assouplissement.
- Impact : la note L153 sous-estime massivement le rythme d'ouverture du pool de mots (c'est
  précisément la raison du changement du 2026-07-01).

### 03-A2 (A→D) — Quand Sens/Écriture/Disposition cessent-ils d'afficher l'anglais : première exposition ou maîtrise 30 j ?

Deux passages du PRD se contredisent :

- Mécanisme C (PRD L39) : l'anglais est « une étiquette à usage unique… **jamais restocké comme
  champ de quiz récurrent** après coup… disparaît de lui-même **dès la première exposition
  passée** ».
- Table des 9 modes (L199-206) + graduation (L211) : Sens affiche « anglais (mot **non maîtrisé**) »,
  Écriture/Disposition promptent en anglais tant que le mot n'est pas **maîtrisé (stabilité ≥ 30 j)**.
  Autrement dit l'anglais reste un champ de quiz récurrent pendant ~30 jours minimum par mot.

S'y ajoute une question de principe : la règle transverse de ces audits dit que la stabilité FSRS
n'a le droit d'exister comme condition **que** pour le mécanisme B (mode Sens gradué). Or L211
l'utilise aussi pour basculer les prompts d'**Écriture/Disposition**. Soit on assume que la
« graduation à la maîtrise » couvre les trois modes (et on réécrit le mécanisme C pour arrêter de
promettre « une seule fois »), soit C prime (bascule dès la première exposition) et L199-211 sont
à corriger. → question de grill.

### 03-A3 (A/C→D, MAJEUR) — Dresseurs « ! » = carte due : mécanisme référencé par guidebook-adapted, absent du PRD

- `guidebook-adapted.md` règle 8 (L34) : après sa première défaite, un dresseur ne se déclenche
  plus jamais automatiquement, mais « **s'il affiche un "!" (carte SRS due)**, le joueur l'engage
  volontairement ». Règle 5 (L31) : « Le Pokégear existe dans le jeu pour les **push
  notifications / rappels des dresseurs de route** ».
- PRD § Pokégear (L79) : onglet Téléphone = « Appeler Fukuda (lancer le SRS) + **messages des
  dresseurs** ».
- Or le PRD ne définit **nulle part** : ce qu'est un dresseur « ! » (dû quand ? quelles cartes ?),
  ce que contient un « message de dresseur », ni surtout **la relation entre un combat et les
  cartes FSRS**. Aucune phrase du PRD ne dit si une victoire/défaite en combat note une carte
  (Encore/Bien…) ou si combat et SRS sont deux circuits totalement indépendants.
- L'état visuel des dresseurs au PRD (L112 : debout/assis) ne mentionne aucun « ! » ; le seul « ! »
  du PRD est l'alerte de détection (L172).
- Le prompt d'audit exige que le PRD tranche noir sur blanc. → question de grill (double comptage
  avec la session du matin, notation FSRS par combat oui/non).

### 03-B1 (B) — `srs_cards` : schéma incapable de représenter les cartes décrites

PRD L743 : `srs_cards` = `user_id, card_type, due_date, stability, difficulty`. Il manque :

- **la référence au contenu** (`kanji_id` / `word_id`) — une carte ne pointe vers rien ;
- **le sous-type sens/lecture** : « 2 cartes par kanji (sens + lecture), indépendantes » (L323)
  exige de distinguer 4 variantes (kanji-sens, kanji-lecture, mot-sens, mot-lecture) ; un seul
  champ `card_type` kanji/mot ne suffit que s'il encode les 4 valeurs — à expliciter.

### 03-B2 (B) — Aucune persistance de l'historique SRS : `getDailySRSStatus`, le streak et Fukuda n'ont rien à lire

- `getDailySRSStatus(srsHistory, today)` (PRD L787) prend un `srsHistory` qu'**aucune table ne
  stocke** : le schéma (L726-752) n'a ni table de reviews (équivalent du review log FSRS), ni
  table de sessions (date, terminée ou non), ni champ streak.
- Consommateurs orphelins : le badge ✓ quotidien, le gate nouvelle zone, le streak (« chaque jour
  calendaire où la session est terminée », L691) et ses achievements 7/30/100/365, le message
  court de Fukuda post-session. `battle_results` existe pour les combats ; rien d'équivalent pour
  le SRS.

### 03-B3 (B) — `visited_zones` absent de `user_map_state`

Le gate SRS repose sur « zone **jamais visitée** » (PRD L92) et la carte affiche visitée/non
visitée (L108-109), mais `user_map_state` (L742) ne stocke que `unlocked_zones[]` — or débloquée ≠
visitée (un `Effect.unlock_zone` précède la première entrée ; les zones non visitées sont
« grisées (accessibles) »). Aucun champ ne trace la première entrée effective. Même donnée requise
par la règle CS-Kanji uniquement pour `unlocked_zones[]`, qui elle existe — le trou ne concerne que
« visitée ».

### 03-C1 (C) — « Messages des dresseurs » et « push notifications » : promesse sans mécanisme

Voir 03-A3 pour les citations. Aucun doc ne définit le contenu d'un message de dresseur, son
déclencheur, ni si « push notification » désigne de vraies notifications PWA (permission, service
worker) ou un simple badge in-app. À trancher avec 03-A3 (si le mécanisme « ! » disparaît, ces
messages n'ont plus d'objet ; s'il reste, il faut le spécifier).

### 03-C2 (C→D) — Kurt fabrique « une item d'effet SRS » : les effets d'objet sur le SRS n'existent pas

`guidebook-adapted.md` L375 : « dépose des Apricorns → reçoit une **item d'effet SRS** après 24h ».
L'audit 02 a créé la table `items` et réglé la fongibilité des Boules de Kurt, mais **aucun doc ne
définit ce qu'une Boule fait** — et le PRD ne prévoit aucun mécanisme d'objet modifiant le SRS
(ce qui toucherait à l'intégrité FSRS : boost de stabilité ? seconde chance sur un Encore ? purement
cosmétique ?). → question de grill (au minimum : cosmétique/collection vs effet mécanique, le
détail exact pouvant relever de l'audit 08).

### 03-C3 (C/E) — `mastery_events` : table sans consommateur depuis le changement CS-Kanji

PRD L752 : `mastery_events (user_id, kanji_id, fired_at)`. Son consommateur historique était le
déblocage des CS-Kanji par maîtrise, supprimé le 2026-07-02. Aujourd'hui : la graduation du mode
Sens (mécanisme B) se calcule directement sur la stabilité des cartes, le tile doré du Kanjidex
aussi, les achievements « kanji maîtrisés » sont des comptes. En plus la table est kanji-only alors
que la maîtrise des **mots** est celle qui pilote le mode Sens (L38). Supprimer, ou documenter un
usage réel (ex. déclencheur d'achievement).

### 03-D1 (D, MAJEUR) — « Session terminée », backlog après absence : la définition actuelle rend le retour brutal

- Définition actuelle : « Session terminée quand la file est vide » (PRD L326) ; streak = « jour
  calendaire où la session SRS est **terminée** » (L691) ; gate = « SRS non fait » (L92).
- Après 10 jours d'absence à régime de croisière, la file contient ~3 000+ reviews en retard.
  À la lettre : impossible d'entrer en nouvelle zone (et de marquer le jour ✓) sans vider
  l'intégralité du backlog le jour même — potentiellement 8-10 h de reviews.
- Rien n'est spécifié : ni plafond de session de rattrapage, ni étalement du backlog (FSRS gère
  nativement le retard carte par carte, mais pas la taille de la file du jour), ni définition
  alternative de « fait » pour le gate (ex. N cartes faites).
- À trancher : « terminée » = file du jour vide (toutes les dues) partout, ou un seuil de
  rattrapage distinct pour le gate/le streak en cas de backlog.

### 03-D2 (D) — Streak un jour sans carte due, et jour 1

- « Aucune carte due » → ✓ immédiat (PRD L93). Le streak s'incrémente-t-il ce jour-là ? (L691 dit
  « session terminée » — une session de zéro carte est-elle « terminée » ?)
- Si le joueur **ne lance pas l'app** un jour où rien n'était dû : streak cassé (L693 « rater un
  jour = réinitialisé ») alors qu'aucun travail n'était exigé — voulu (streak = assiduité de
  connexion) ou non (streak = dette de révision honorée) ?
- Jour 1 (onboarding) : aucune carte n'existe avant la première leçon chez Fukuda, et les cartes
  sont « pour la session du lendemain matin » (L293) — le jour 1 compte-t-il dans le streak ?
  L'appel de Fukuda a-t-il même lieu (l'onboarding le remplace-t-il) ?

### 03-D3 (D) — Timing d'entrée des nouvelles cartes et définition exacte d'« étudié »

- Kanji : les leçons injectent « pour la **session du lendemain matin** » (PRD L293).
- Mots : « dès qu'un kanji est **étudié** (simplement en file SRS), les mots éligibles
  **rejoignent la file** » (L330) — immédiatement (dus aujourd'hui) ou eux aussi au lendemain ?
  À la lettre, un mot peut devenir dû avant la première review du kanji qui l'a débloqué.
- « Étudié » (pilier de `studiedSet`, des gates « N kanji étudiés », des pools de combat) =
  à la complétion de la leçon, ou à la première review ? Le PRD ne le dit jamais explicitement.
- Si des cartes s'ajoutent en cours de journée **après** la session (✓ posé) : `cardsPending`
  redevient > 0 — le ✓ et le gate restent-ils acquis jusqu'au lendemain ? (implicite, à écrire.)

### 03-D4 (D) — « Jour calendaire » : fuseau, minuit, deuxième lancement

- Fuseau : heure locale de l'appareil (voyages/DST = jours doublés ou sautés) ? Jamais précisé.
- Bascule à minuit en pleine session de jeu : le ✓ tombe, le gate se referme — au prochain
  changement de zone ? À chiffrer simplement (ex. réévalué à chaque lancement + à chaque tentative
  d'entrée en nouvelle zone).
- Lancements suivants du même jour : « premier lancement du jour → Fukuda appelle » (L88) — les
  lancements suivants sont implicitement silencieux (rappel via Pokégear si non fait) ; une ligne
  explicite suffirait.

### 03-D5 (D) — Frontières de zone et zone_id d'étage

- Comment le blocage « nouvelle zone » se matérialise sur la carte continue : repoussé d'une case
  avec message (comme la résolution `block` des PNJ, L311) ? Mur invisible ? Non spécifié.
- Les bâtiments à étages ont **un zone_id par étage** (PRD L765 : Tour Radio, QG Rocket, Tour Jo).
  À la lettre, un joueur SRS-non-fait engagé dans le gauntlet de la Tour Radio serait bloqué entre
  le 2F et le 3F par le gate quotidien. Voulu (le gate parle de « route ou ville ») ? Probablement
  pas — à préciser (ex. le gate ne s'applique qu'aux zones *extérieures* / d'entrée, pas aux
  sous-zones d'un même bâtiment).

### 03-D6 (D, mineur) — Ordre de la file d'une session

Reviews en retard, reviews du jour, nouvelles cartes kanji, nouvelles cartes mots : ordre de
présentation non spécifié (mélange ? reviews d'abord ? nouvelles à la fin ?). Sans enjeu
pédagogique tranché ici, mais l'implémentation devra choisir — une phrase au PRD suffit.

### 03-E1 (E) — « Événement seuil rank 4 / rank 7 », « Silver lettre 2 » : système de « rank » fantôme

`guidebook-adapted.md` L116 (« événement seuil **rank 4** (note de Fukuda sur la carte) ») et L150
(« Événement seuil **rank 7** : **Silver lettre 2** apparaît au Pokémon Center ») : aucun système de
« rank » n'existe dans aucun doc (la progression se mesure en kanji étudiés/badges/quêtes), et les
« lettres de Silver » n'existent pas (les lettres sont de Fukuda ; Silver = 6 rencontres physiques).
Traces d'un design antérieur au modèle actuel.

### 03-E2 (E) — « Dresseur spécial (1 sur 5) : actif dès la première session »

`guidebook-adapted.md` L152 (route-29). Ni « dresseur spécial », ni le ratio « 1 sur 5 », ni
« actif dès la première session » ne correspondent à quoi que ce soit dans le PRD actuel. Trace du
même ancien design SRS-centré que 03-E1/03-E4.

### 03-E3 (E→D) — Centre Pokémon « Mode Direct (Start Session) », « Voir la file », `/library`

`guidebook-adapted.md` L176 + L237 + L1090-1091 : les Centres Pokémon « lancent toutes les reviews
en queue linéaire » (« Commencer une session » / « Voir la file »), avec « accès `/library` » et
« soin narratif ». Le PRD ne connaît que deux entrées SRS : l'appel de Fukuda et Pokégear →
Téléphone (L88-89) ; la route `/library` n'existe pas ; l'esthétique Centre Pokémon de la session
(L326, table Audio) est le vestige assumé de cet ancien modèle. → petite question de grill : le
Centre Pokémon doit-il rester un point d'entrée alternatif de la session (thématiquement cohérent),
ou est-ce purement une trace à nettoyer ?

### 03-E4 (E, déjà reporté) — « Trainers SRS » Route 29

`guidebook-adapted.md` L148/L157/L167 : « 8-10 positions de dresseurs (**trainers SRS**) ». Le sort
de ces dresseurs inventés est **déjà reporté à la synthèse par l'audit 01** ; s'y ajoute ici le
qualificatif « SRS », qui rattache ces dresseurs à l'ancien modèle dresseur↔review (03-A3/03-E2).
La décision de grill sur 03-A3 déterminera aussi le vocabulaire à purger ici. Idem pour le
« système de revanche » évoqué en passant sur la Cycling Road (L1360) — jamais défini, à purger ou
spécifier en synthèse.

---

## Reporté à la synthèse (hors périmètre SRS)

- Sort des dresseurs-combat inventés Route 29/33… (déjà acté audit 01) — seule la composante
  « SRS » est traitée ici (03-A3/03-E4).
- ~~Effet précis des Boules de Kurt si « effet mécanique » est retenu (03-C2)~~ — sans objet :
  collection pure tranchée au grill (décision 8).
- « Système de revanche » Cycling Road (03-E4) → audit 04/07.
- Emplacement UI de l'affichage de progression vers les gates (déjà noté par l'audit 02 → audit 08).

## Questions D pour le grill *(toutes tranchées le 2026-07-06 — voir « Décisions du grill » en tête ; conservées ci-dessous pour trace)*

1. **(03-D1)** Backlog après absence : « session terminée » = toute la file, même à 3 000 cartes ?
   Ou un mécanisme de rattrapage (plafond/étalement) pour le gate et le streak ?
2. **(03-A3)** Dresseurs « ! » re-testant des cartes dues : le mécanisme existe-t-il en v1 ?
   Si oui : un combat note-t-il les cartes FSRS (double comptage avec la session du matin) ?
   Si non : purger guidebook règles 5/8 et « messages des dresseurs » du Pokégear ?
3. **(03-D2)** Streak : s'incrémente-t-il un jour sans carte due (✓ automatique) ? Se casse-t-il si
   l'app n'est pas lancée un jour sans dues ? Jour 1 ?
4. **(03-D3)** Les mots débloqués entrent-ils en file immédiatement ou le lendemain matin, comme
   les kanji ? « Étudié » = leçon complétée ou première review ?
5. **(03-A2)** Graduation anglais→japonais de Sens/Écriture/Disposition : à la maîtrise (30 j,
   version table des modes) ou dès la première exposition (version mécanisme C) ?
6. **(03-E3)** Le Centre Pokémon reste-t-il un point d'entrée alternatif de la session SRS ?
7. **(03-C2)** Les Boules de Kurt : effet mécanique sur le SRS ou objet de collection ?
8. **(03-D4/D5)** Confirmations rapides : jour = calendrier local de l'appareil ; ✓ acquis jusqu'au
   lendemain même si des cartes s'ajoutent ; gate évalué à la tentative d'entrée ; gate limité aux
   zones extérieures (pas les étages) ; blocage = repoussé d'une case + message.
