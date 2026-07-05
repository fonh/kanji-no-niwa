# PRD — 漢字の庭 (Kanji no Niwa)

Status: ready-for-agent

---

## Problem Statement

Apprendre le japonais est l'un des défis linguistiques les plus exigeants pour un francophone. Les outils existants fragmentent la langue en silos séparés — une app pour les kanji, une autre pour la grammaire, une troisième pour le vocabulaire — sans monde cohérent à habiter et sans progression narrative. L'apprenant fixe un écran blanc et un chiffre qui bouge à peine.

L'objectif est d'apprendre le japonais dans son ensemble — kanji, grammaire, conjugaison, vocabulaire, lecture — en ayant l'impression d'être dans une aventure. La destination est claire : lire des textes japonais authentiques sans assistance. Le chemin doit ressembler à un jeu, pas à un programme scolaire.

---

## Solution

漢字の庭 (Kanji no Niwa) est une PWA d'apprentissage du japonais construite autour du monde de Pokémon HeartGold/SoulSilver. La carte de Johto est l'interface principale. Chaque route, chaque ville, chaque interaction NPC est sourcée directement depuis le guidebook Prima HGSS — positions des dresseurs, quêtes secondaires, NPCs — adaptée pour que chaque interaction dans le jeu enseigne le japonais.

L'arc d'apprentissage se superpose exactement au voyage de Johto :

- **Routes** = rencontres de kanji et vocabulaire, combats de dresseurs
- **Villes** = leçons de grammaire des NPCs et personnages locaux
- **Gyms** = jalons curriculaires — battre un maître d'arène signifie avoir atteint un nouveau niveau de japonais
- **Événements Team Rocket** = confrontations majeures exigeant une vraie compréhension écrite
- **Red au Mont Gris** = la preuve finale : lire un chapitre de manga et la lettre de Fukuda en japonais pur

Le SRS (répétition espacée) est le moteur mémoire qui tourne en dessous. Chaque matin, Fukuda appelle via le Pokégear. La session de révision quotidienne conditionne l'accès aux nouvelles zones.

---

## Langue du Jeu

**Aucun français nulle part dans le jeu** (2026-07-01) — ni dans l'interface, ni dans le contenu (dialogues, quiz, fiches Kanjidex/Carte Mot, `grammar_note`). Seules deux langues sont affichées au joueur : le japonais (langue apprise) et l'anglais, retenu uniquement là où il a un rôle pédagogique précis (voir modèle ci-dessous). Le français reste la langue de travail de ce document et des échanges avec l'équipe — il ne doit simplement jamais fuiter dans le produit.

**Modèle à 3 mécanismes (2026-07-01) :**

- **A — Traduction est le seul mode à garder l'anglais en permanence.** Tous les autres modes de combat (Sens, Écriture, Disposition), les dialogues de leçon et NPC graduent vers 100% japonais et n'affichent plus jamais d'anglais une fois la graduation faite (voir C). Le mode Traduction (JP↔EN) reste anglais tout au long du jeu, y compris à N1 — c'est littéralement son objet pédagogique (tester le mapping de traduction), pas une glose de confort à retirer.
- **B — Sens mode gradué = synonymes/antonymes japonais déjà existants, pas une définition inventée.** Une fois un mot **maîtrisé** (stabilité FSRS ≥ 30 jours), ses options de quiz en mode Sens proviennent des relations `related`/`antonym` déjà présentes dans JMdict Extended (déjà en local, `scripts/sources/jmdictExtended-*.json`) — aucune génération IA de "définition japonaise" n'est nécessaire. Si JMdict n'a pas de relation renseignée pour une entrée donnée, elle reste en anglais plutôt que de forcer un contenu de qualité inégale — pas de couverture 100% exigée.
- **C — L'anglais est une étiquette à usage unique, pas un champ permanent.** Chaque kanji/mot affiche son mot-clé anglais **une seule fois**, au moment de sa leçon d'introduction — jamais restocké comme champ de quiz récurrent après coup. Conséquence : pas de "retrait mot par mot" à piloter dans le temps comme pour le furigana — l'anglais disparaît de lui-même dès la première exposition passée, remplacé par (B) en mode Sens et par un prompt directement japonais en Écriture/Disposition une fois le mot connu.
- **Fiches de référence (Kanjidex/Carte Mot) — registre séparé.** Écrans de consultation à la demande, pas du gameplay actif : ils gardent un petit champ anglais permanent (comme un dictionnaire), indépendamment de la graduation ci-dessus.

**Conséquence sur `grammar_note`** (voir `content/curriculum-checkpoints.md`) : le corpus Hanabira fournit déjà `short_explanation`/`long_explanation`/plusieurs `examples[]`/`grammar_audio` en anglais — réutilisés tels quels, sans traduction. Le champ `note_fr` est supprimé.

---

## Interface — Émulateur DS

L'app ressemble et se comporte comme un émulateur DS sur mobile :

- **Orientation : paysage** (2026-07-01, tranché) — comme un véritable émulateur DS sur téléphone, jamais portrait. S'applique à tout l'app, y compris l'écran-livre des leçons (§ Leçons), dont la double page côte à côte (inspirée de Wagotabi) est donc affichable telle quelle, sans repli en page unique empilée.
- **Carte plein écran** — pas de coque DS visible
- **Contrôles semi-transparents en overlay** :
  - Bas gauche : D-pad
  - Bas droite : boutons A / B (toujours visibles). Boutons X / Y apparaissent en overlay uniquement pendant une boîte de dialogue (voir § Mouvement de l'avatar) — inutiles en dehors d'un dialogue, donc masqués sur la carte pour ne pas surcharger l'écran
  - Centre bas : START (menu principal) + SELECT (Pokégear) — petits, discrets

L'esthétique DS vit dans les **menus, boîtes de dialogue, écrans de combat** — pas dans le boîtier physique. Police, bordures, sons, animations de transition : tout correspond à HGSS.

> **Assets extraits :** bordures dialogue → `public/sprites/ui/dialogue/`, transition combat → `public/sprites/ui/battle/transition/`, écran VS → `public/sprites/ui/battle/vs_screen/`. Police DS non extractable (intégrée ARM9 — utiliser une police pixel approchante, ex. `Pokémon Classic` ou `Press Start 2P`).

### Menu Principal (START)

Overlay identique au menu HGSS :

| Slot | Nom     | Contenu                                                 |
| ---- | ------- | ------------------------------------------------------- |
| 1    | 図鑑    | Kanjidex (encyclopédie kanji)                           |
| 2    | Leçons  | Batch de leçons actif + historique                      |
| 3    | Sac     | Objets collectés (Apricorns, CS-Kanji, objets de quête) + **Journal de lecture** (textes déjà lus, consultables à nouveau — pas une collection de trophées, voir § Textes Progressifs ; déplacé depuis Pokégear, 2026-07-01 — un texte ramassé est un objet qu'on porte, pas un service de téléphone) |
| 4    | Profil  | Badges, stats, achievements — inclut désormais explicitement la progression Silver (6 rencontres), Team Rocket (3 lieux), Kimono Girls (5), Légendaires (3) (2026-07-01 — ces tables existaient déjà en base sans écran joueur dédié) |
| 5    | Options | Paramètres                                              |

### Pokégear (SELECT)

Quatre onglets, structure identique à HGSS :

| Onglet    | Contenu                                                 |
| --------- | ------------------------------------------------------- |
| Téléphone | Appeler Fukuda (lancer le SRS) + messages des dresseurs |
| Carte     | Carte Johto complète, vue globale                       |
| Radio     | Émissions d'Oak, radio d'ambiance                       |
| Grammaire *(remplace Textes, 2026-07-01)* | Glossaire des points de grammaire rencontrés (`grammar_encounters`) — formation, exemple, note, tirés du même `grammar_note` que les leçons. Comble un manque : cette donnée existait déjà en base sans aucune vue joueur. |

---

## Boucle Quotidienne

1. **Premier lancement du jour** → Fukuda appelle via le Pokégear. Son sprite apparaît. "Tes révisions t'attendent." → tap pour lancer le SRS, ou refuser.
2. **Si refusé** → Fukuda laisse un message. Le joueur doit le rappeler (Pokégear → Téléphone → Fukuda) pour lancer le SRS. Aussi accessible directement depuis Pokégear → Téléphone.
3. **Session SRS** → file de cartes (kanji + vocabulaire, FSRS). Interface simple : carte affichée, bouton Révéler, 4 notes FSRS (Encore / Difficile / Bien / Facile).
4. **SRS terminé** → badge ✓ sur l'icône Pokégear. Fukuda envoie un court message. La carte est entièrement accessible.
5. **SRS non fait** → le joueur peut parcourir les zones déjà visitées, combattre des dresseurs, faire des leçons. Entrer dans une **nouvelle zone** (route ou ville non encore visitée) est bloqué : un message apparaît — _"Il faudrait réviser avant d'aller plus loin."_
6. **Aucune carte due** → l'appel de Fukuda est court : "Tout est en ordre." ✓ apparaît immédiatement.

---

## La Carte de Johto

La carte est sourcée directement depuis le guidebook Prima HGSS. Chaque route, bâtiment et NPC est fidèle au jeu original.

**Ordre des zones** suit la progression recommandée par HGSS :
Bourg Geon → Route 29 → Ville Griotte → Routes 30–31 → Mauville → Tour Grospignon → Route 32 → Ruines Arcaniques → Route 33 → Ecorcia → Puits Ramoloss → Forêt Secte → Route 34 → Doublonville → Route 35 → Parc National → Routes 36–37 → Rosalia → Tour Embrasée → Routes 38–39 → Oliville → Route 40 (inclut Route 41) → Irisia → Route 42 → Mont Mortier → Acajou Ville → Lac Colère → Route 44 → Chemin Glacé → Ebènelle → Antre du Dragon → Route 45 → Grotte Sombre → Routes 26–27 → Route Victoire → Plateau Indigo → **Kanto (adopté 2026-07-01 ; 14 routes/donjons intercalés depuis le 2026-07-02 — ordre complet des 22 zones dans `content/curriculum-checkpoints.md`) : Vermeille City → Safranville → Azuria City → Céladia → Fuchsia City → Argenta City → Île Braise → Vertville** → Mont Gris *(ordre resynchronisé sur la table de calibration — Parc National replacé entre Routes 35 et 36, Route 41 fusionnée dans route-40, Grotte Sombre/Route 26 ajoutées : corrigé 2026-07-05, audit 01)*

**Affichage de la carte :**

- Zones visitées : couleur pleine
- Zones non visitées : grisées (accessibles, vides)
- Portes de Gym : icône cadenas si conditions non remplies
- Marqueurs de quête : ◎ sur la cible active
- Sprites des dresseurs à positions fixes (guidebook). Non battu = debout, alerte. Battu = assis, passif.

**Mouvement de l'avatar :**

- D-pad : un tile par input
- Bouton A : interagir avec NPC, dresseur ou bâtiment adjacent ; pendant un dialogue, avance à la page suivante
- Bouton B : ferme le dialogue (à tout moment)
- Bouton X *(pendant un dialogue uniquement, révisé 2026-07-01)* : affiche/masque la traduction anglaise de la page courante en superposition
- Bouton Y *(pendant un dialogue uniquement, révisé 2026-07-01)* : affiche/masque les furigana de la page courante. **Les furigana ne sont plus affichés automatiquement nulle part** (ni adaptatif par kanji non-étudié, ni par palier N4+) — ils sont toujours masqués par défaut et révélés à la demande via Y, y compris dans les textes de lecture (remplace le "furigana adaptatif" précédent). Le joueur doit tenter la lecture avant de révéler — cohérent avec le principe de rappel actif déjà appliqué ailleurs (cloze plutôt que QCM pour Grammaire/Conjugaison).
- Pas de tap-to-move. Pas de pathfinding.

**CS-Kanji** — capacités de carte débloquées par la lecture, pas par la maîtrise (2026-07-02, remplace
l'ancien modèle "débloqué par la maîtrise FSRS") : chaque CS-Kanji est remis par le **même PNJ et au même
moment narratif que le CS/HM équivalent dans le jeu d'origine** (sourcé `content/guidebook-adapted.md`),
mais sa remise passe par un **texte obligatoire** — et ce texte n'a d'effet (`Effect.grant_item` accordant
la capacité) que si **tous les textes, obligatoires et secondaires, découverts dans les zones déjà
débloquées (`unlocked_zones[]`) ont été lus** (`Condition` vérifiée contre `text_completions` — voir
`content/texts-progressifs.md` § CS-Kanji). Détail complet, table sourcée guidebook, et fiche de la
fonctionnalité "menu de tous les textes avec indices sur les non-découverts" : `content/texts-progressifs.md`.

| Kanji | Donné par (sourcé guidebook, même moment que le jeu d'origine) | Débloque |
| ----- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 飛 (Vol) | La femme de Chuck, à Irisia, après la victoire sur Chuck | Voyage rapide — tap sur n'importe quelle ville visitée pour s'y téléporter |
| 水 (Surf) | Le Gentleman du Théâtre, à Rosalia, après le sauvetage de Miki (Kimono Girl #3). ⚠️ Comme en jeu : utilisable seulement après le badge de Rosalia (Morty) — condition `badge_earned` en plus de la remise (corrigé 2026-07-03, guide p. ~126) | Routes maritimes (Routes 40–41) et traversées de rivière |
| 力 (Force) | Le Hiker qui sort du Mont Mortier et bouscule le joueur, Route 42 — il l'offre en s'excusant (guide p. 134) | Déplacer les gros rochers sur les routes de montagne |
| 切 (Coupe) *(nouveau 2026-07-02)* | Le **Maître du Charbon** (Charcoal Man), à Ecorcia, après la quête Farfetch'd de Forêt Secte. ⚠️ Corrigé 2026-07-03 : la version précédente écrivait "Kurt (Maître du Charbon)" — ce sont **deux PNJ distincts** d'Ecorcia (Kurt = artisan Poké Ball au village ; le Maître du Charbon = four à charbon, donne Coupe/HM01, guide p. ~76) | Couper les arbres bloquant certains passages (Forêt Secte, Route 36, Kanto) |
| 砕 (Éclate-Roc) *(nouveau 2026-07-03 — HM06 Rock Smash avait été oublié du modèle "6 CS")* | Un garçon sur la Route 36 (guide p. 80), avant même le Simularbre — comme en jeu | Briser les roches fissurées (103 sur la carte extraite : Mont Mortier, Routes de montagne, cavernes) |
| 滝 (Cascade) *(nouveau 2026-07-02)* | Pas de PNJ dans le jeu d'origine — trouvé au Chemin Glacé (guide p. 154) ; `event_cleared` sur le puzzle de glissades coordonnées (l'objet y est caché, pas remis) | Franchir les cascades (Chutes de Tohjo, Chemin Glacé, Antre du Dragon, Kanto) |
| 渦 (Tourbillon) *(nouveau 2026-07-02)* | Lance, au QG Rocket (Repaire de Mékanos, Acajou), après la double victoire Ariana+Lance | Traverser les tourbillons (Îles Tourbillon/Whirl Islands, passages d'eau agitée) |

Les 7 CS-Kanji couvrent les CS/HM de traversée du jeu d'origine (Cut, Fly, Surf, Strength, Whirlpool,
Rock Smash, Waterfall). **Reste hors scope v1 (décision 2026-07-03)** : HM08 Escalade/Rock Climb (donné
par le Prof Chen après les 16 badges, sert aux parois rocheuses de fin de jeu — les parois ne sont pas
encore exportées comme type de terrain distinct) ; à trancher quand l'arc Mont Gris sera implémenté.

**Obstacles à objet-clé (pas des CS-Kanji — corrigé 2026-07-03, sourcé guide) :** deux bloqueurs
d'histoire s'ouvrent avec un objet/événement, exactement comme en jeu, jamais par un kanji :
- **Simularbre (Route 36)** — arrosé avec l'**Arrosoir** (SquirtBottle) reçu à la Boutique de Fleurs de
  Doublonville (guide : itinéraire Doublonville, après le badge de Whitney)
- **Ronflex (devant la Grotte Taupiqueur, côté Kanto)** — réveillé par l'émission Flûte Poké de la radio
  améliorée (carte EXPN, après la quête de la Centrale Kanto)

---

## Dresseurs de Route — Rôles Fixes

Chaque dresseur sur chaque route a un rôle fixe sourcé du guidebook :

- **Dresseurs combat** : t'affrontent quand tu entres dans leur champ de vision (combat à barres de HP)
- **Dresseurs leçon** : dialogue s'ouvre quand tu les approches, ils enseignent un concept de japonais

Les dresseurs qui donnent des objets ou des informations dans HGSS deviennent des dresseurs-leçon dans 漢字の庭. La distinction est définie à la création du contenu, pas choisie par le joueur.

**3ᵉ catégorie — PNJ ambiants recatégorisés en leçon (2026-07-01) :** au-delà des dresseurs-combat et des dresseurs-leçon "item/info-giver", le guidebook liste de nombreux PNJ qui ne battent pas et ne donnent rien (couleur locale — ex. les PNJ Wi-Fi/Union Room de Mauville). Ceux-ci peuvent être recatégorisés en dresseurs-leçon **au cas par cas** (sélectif, pas systématique) : le PNJ est réel (fidélité guidebook préservée), seule sa fonction en jeu est réattribuée. Réservé aux PNJ dont le rôle d'origine se prête naturellement à enseigner quelque chose ; les PNJ dont la fonction d'origine est une feature multijoueur hors-scope (échange, Union Room, personnalisation Wi-Fi) restent de la couleur pure, sans leçon forcée.

**Suppression du mécanisme kanji_pool-par-classe (2026-07-01) :** l'ancienne table "Types de dresseurs et thèmes kanji" (27 classes → thème kanji fixe par classe) est retirée — jugée inutile à l'usage. Chaque dresseur porte directement son propre `kanji_pool` (voir `map_trainers` plus bas), sans passer par une étiquette de classe. Les classes d'origine du jeu (Youngster, Lass, Pêcheur, etc.) restent documentées comme matériau de sourcing factuel dans `content/guidebook-adapted.md` — utile pour savoir qui existe dans le jeu d'origine et nommer les dresseurs (ex. "Gamin Ken"), mais ne pilotent plus rien mécaniquement.

**Vision et rencontre :**

- Chaque dresseur a `facing` et `sight_range` (2–4 tiles) du guidebook
- Entrer dans le champ de vision → le dresseur se retourne → "!" → mouvement bloqué → combat ou leçon
- Après défaite/leçon : dresseur assis, ne se déclenche plus jamais automatiquement
- Toutes les positions dans `/content/map/trainers.json`, sourcées du guidebook Prima HGSS

---

## Système de Combat — Barres de HP

### Déclenchement

Intro identique à HGSS : transition diagonale, sprite du dresseur qui arrive par la gauche, jingle de combat, phrase d'accroche dans une boîte de dialogue. Puis première question.

> **Assets extraits :** layers transition → `public/sprites/ui/battle/transition/` (9 PNG), écran VS → `public/sprites/ui/battle/vs_screen/` (13 PNG), sprite dresseur → `public/sprites/trainers/battle/battle_NNN.png`, sprite dos joueur → `public/sprites/characters/player_back/`.

### Structure

- **Deux barres de HP, symétriques, comme dans les vrais jeux Pokémon** (révisé 2026-07-02, remplace les icônes Poké Ball) : barre adverse en haut, barre joueur en bas.
- Barre joueur : chaque mauvaise réponse retire `1/N` (N = erreurs tolérées pour ce combat, `max(2, ceil(questions × 0.10))` — voir table de longueurs ci-dessous). Barre à 0 = défaite. Rejouer immédiatement, sans cooldown.
- Barre adverse : chaque bonne réponse réduit la barre de `1/questions` (visuel uniquement, aucun effet mécanique).
- Répondre à toutes les questions en restant sous le nombre d'erreurs tolérées = victoire.

### Les 9 Modes de Question

Mélangés aléatoirement à l'intérieur de chaque combat :

| Mode            | Prompt                             | Réponse                                   | Ce que ça teste               |
| --------------- | ---------------------------------- | ----------------------------------------- | ----------------------------- |
| **Sens**        | Kanji affiché en grand             | 4 options : anglais (mot non maîtrisé) ou synonymes/antonymes japonais JMdict (mot maîtrisé) | Reconnaissance de sens        |
| **Lecture**     | Kanji affiché en grand             | 4 lectures hiragana                       | Reconnaissance phonétique     |
| **Écriture**    | Signification en anglais (non maîtrisé) ou prompt japonais (maîtrisé) | Clavier romaji→kana auto-converti (façon WaniKani, `wanakana`-like — remplace l'ancienne grille de tiles, 2026-07-02) — compose la lecture | Production active             |
| **Composition** | 4 tiles kanji                      | Glisser-déposer pour former un mot valide | Formation de composés         |
| **Grammaire**   | Phrase avec un trou grammatical    | QCM (2 premiers tirages du point) puis saisie tapée — clavier romaji→kana auto-converti (voir graduation par point, 2026-07-02) | Grammaire en contexte         |
| **Conjugaison** | Verbe + contexte                   | QCM (2 premiers tirages du point) puis saisie tapée — même clavier, même graduation | Production verbale            |
| **Traduction**  | Phrase japonaise (Tatoeba)         | 4 sens en anglais — toujours anglais, seul mode qui ne graduera jamais (voir § Langue du Jeu) | Compréhension de phrase       |
| **Disposition** | Sens en anglais (non maîtrisé) ou prompt japonais (maîtrisé) | 6–8 chunks japonais à remettre en ordre   | Production de phrase complète |
| **Écoute** *(ajouté 2026-07-01)* | Audio d'un mot ou d'une phrase (son uniquement — jamais de micro, jamais de reconnaissance vocale) | 4 sens ou 4 lectures selon le niveau | Compréhension auditive |

**Source audio Écoute** : `scripts/sources/local-audio-yomichan/` (collection JapanesePod101/Forvo/NHK16/Shinmeikai8, ~382 000 fichiers déjà téléchargés) + pack Ankidrone JLPT_Tango (14 763 fichiers) — couvre déjà la quasi-totalité des 7 836 mots JLPT au niveau mot. `vocab_audio_missing.json` (3 825 entrées) est probablement un artefact de matching partiel à corriger, pas un vrai manque de contenu. VOICEVOX (TTS japonais open source) en complément si des phrases d'exemple spécifiques manquent d'audio.

**Graduation Sens/Écriture/Disposition (voir § Langue du Jeu, mécanismes A/B/C) :** l'anglais n'apparaît qu'à la toute première exposition d'un mot (leçon d'introduction) ; une fois **maîtrisé** (stabilité FSRS ≥ 30 jours), ces trois modes ne réaffichent plus jamais l'anglais — Sens pioche ses options dans les relations `related`/`antonym` de JMdict (fallback anglais uniquement si l'entrée n'a aucune relation renseignée), Écriture/Disposition basculent sur un prompt directement japonais.

**Disposition** utilise des phrases Tatoeba pré-tokenisées avec kuromoji au build time. Les chunks sont stockés comme `chunks[]` en base. Le client mélange et valide par comparaison de séquence de `surface_form`. Aucune tokenisation à runtime.

**Pool de grammaire** (Grammaire + Conjugaison) : pioche uniquement dans les points de grammaire que le joueur a **déjà rencontrés** en dialogue NPC, leçon ou texte (tracké dans la table `grammar_encounters`) — **dès qu'un seul point a été rencontré, il est testable au combat suivant** (2026-07-01, révisé — voir `content/curriculum-checkpoints.md` § garde d'activation). Une fois le point tiré, le client pioche aléatoirement **un exemple parmi `example_variants[]`** (plusieurs exemples Hanabira par point, pas un seul — voir § Pipeline de Données point 14).

**Révision de la grammaire — jalons Boss + filet anti-oubli (2026-07-02) :** la grammaire reste hors du SRS quotidien, mais elle a besoin d'un vrai mécanisme de rappel — jusqu'ici, un point pouvait n'être retiré qu'une fois au hasard puis jamais revu. Deux ajouts, sans nouveau système ni nouvelle session à gérer :
- **Couverture garantie aux combats Boss** (門弟/師範, Silver, Rocket, Kimono Girls, Légendaires, Elite Four, Lance, Red — catégorie déjà définie ci-dessus) : au lieu d'un tirage pondéré qui peut ignorer des points, le pool Grammaire/Conjugaison d'un combat Boss garantit **une question sur chaque point de grammaire rencontré depuis le dernier jalon Boss** (zone entière pour un 師範, fenêtre plus courte pour les événements Rocket/Silver/Kimono/Légendaires plus rapprochés). La capacité de questions des Boss (20 à 100, voir tableau des longueurs ci-dessus) est largement suffisante pour couvrir les 5-7 points typiques d'une zone.
- **Boost si point non revu depuis 14 jours** : tout point de grammaire dont le dernier tirage (`grammar_encounters`) remonte à plus de 14 jours voit son poids augmenté dans le prochain combat route/Boss éligible — pas une nouvelle session, juste une priorité accrue dans le tirage pondéré déjà existant. Comble le trou entre deux jalons Boss sans ajouter de mécanique visible pour le joueur.

**Graduation QCM → saisie par point de grammaire, pas par catégorie de combat (adopté 2026-07-02) :** chaque point de grammaire a son propre compteur `times_drawn` sur `grammar_encounters` (nouveau champ), incrémenté à chaque fois qu'il est tiré en combat (Grammaire ou Conjugaison), indépendamment de la zone ou du type de combat. **Ses 2 premiers tirages sont en QCM** (4 options, dont les `distractors[]` de l'exemple pioché) — reconnaissance, exposition en douceur. **À partir du 3e tirage, il passe en saisie tapée** (clavier romaji→kana auto-converti, même composant que le mode Écriture) — production réelle, plus proche de ce que mesure vraiment la maîtrise d'un point. Un point rencontré tôt et souvent gradue vite ; un point rare reste plus longtemps en QCM — le rythme suit l'exposition réelle du joueur, pas un seuil de zone. Même logique que la graduation anglais→japonais déjà en place pour Sens/Écriture/Disposition (voir § Langue du Jeu), appliquée ici à la forme de la question plutôt qu'à la langue.

**Précision sur la saisie tapée en Grammaire/Conjugaison (2026-07-02) :** le joueur ne tape jamais la phrase entière — seul **le point de grammaire lui-même** (ex. juste "てもらえませんか") est à saisir dans le trou ; le reste de la phrase (kanji compris, ex. "この手紙を見___。") reste affiché fixe dans le prompt, non éditable. Les points Hanabira sont presque toujours des motifs en kana pur greffés sur un radical verbal, donc le clavier romaji→kana suffit dans l'immense majorité des cas. **Si un point exige exceptionnellement du kanji** (rare), le clavier se comporte comme un IME japonais standard : conversion kana → candidats kanji proposés automatiquement (pas de tracé, pas de saisie manuelle de kanji — juste une sélection de candidat, cohérent avec le refus du mode Skritter).

**Aucun chrono nulle part (précisé 2026-07-01)** : depuis la suppression du Critical Hit, plus aucun combat — route, boss, Red inclus — n'a de pression temporelle. Le joueur répond à son rythme ; la seule contrainte est le nombre d'erreurs tolérées (voir § Système de Combat — Barres de HP).

**Longueurs de combat — difficulté croissante avec l'avancement dans l'aventure (adopté 2026-07-01) :**

La longueur (nombre de questions) n'est plus une valeur fixe par catégorie de combat — elle croît avec la position de la rencontre dans l'arc narratif, pour créer une vraie courbe de difficulté qui culmine à l'approche de l'Elite Four/Lance/Red. Le nombre de vies (voir plus haut, `max(2, ceil(questions × 0.10))`) découle directement de cette longueur.

| Catégorie | 1ère occurrence | Progression | Dernière occurrence | Vies (1ère → dernière) |
|---|---|---|---|---|
| Dresseur de route | 5–8 (zones N5, early) | 10–15 (zones N4/N3, mid) | 20–25 (zones N2/N1, late) | 2 → 3 |
| 門弟 (garde de gym) | 10 (Falkner) | 13, 16, 18 | 20 (Clair) | 2 → 2 |
| 師範 (8 gyms) | Falkner : 24 | Bugsy 31, Whitney 38, Morty 45, Chuck 51, Jasmine 58, Pryce 65 | Clair : 72 | 3 → 8 |
| Silver (6 rencontres) | #1 Ville Griotte : 12 | #2 15, #3 18, #4 20, #5 22 | #6 Route Victoire : 24 | 2 → 3 |
| Exécutifs Rocket (3 événements) | Proton (Puits Ramoloss) : 24 | Ariana (Mahogany) : 36 | Gauntlet Tour Radio : 48 | 3 → 5 |
| Kimono Girls (gauntlet collectif post-Master Ball uniquement — les 5 rencontres individuelles sont des scènes/leçons, pas des combats, corrigé 2026-07-05, audit 01) | Zuki : 24 | Naoko 30, Miki 36, Kuni 42 | Sayo : 48 | 3 → 5 |
| Légendaires (3 : Raikou/Entei/Suicune) | Raikou : 45 | Entei : 52 | Suicune : 60 | 5 → 6 |
| Elite Four (Will, Koga, Bruno, Karen) | — | — | 70 fixe (chacun) | 7 |
| Lance | — | — | 80 fixe | 8 |
| Red | — | — | 100 fixe | 10 |

Hiérarchie résultante : dresseurs/門弟/Silver/Rocket/Kimono (≤48) < Légendaires (≤60) < Elite Four (70) < Lance (80) < Red (100). Le dernier gym (Clair, 72) dépasse légèrement l'Elite Four (70) — accepté tel quel, la gym la plus dure de Johto n'a pas à être strictement plus courte que le premier membre du Conseil 4.

**Profils de poids par type de combat :**

| Mode            | Route (5–8 questions) | Boss (≥ 10 questions) |
| --------------- | --------------------- | --------------------- |
| Sens            | 25 %                  | 11 %                  |
| Lecture         | 20 %                  | 11 %                  |
| Écriture        | 17 %                  | 9 %                   |
| Composition     | 10 %                  | 4 %                   |
| Grammaire       | 7 %                   | 13 %                  |
| Conjugaison     | 7 %                   | 13 %                  |
| Traduction      | 3 %                   | 4 %                   |
| **Disposition** | **5 %**               | **27 %**              |
| Écoute *(ajouté 2026-07-01)* | 6 %    | 8 %                    |

Boss = 門弟, 師範, Silver, Exécutifs Rocket, Kimono Girls, Légendaires, Elite Four, Lance, Red.

**Un seul profil par catégorie (Route/Boss), pas de table supplémentaire par phase de jeu (tranché 2026-07-01 après audit combat) :** on aurait pu construire une 3e dimension de poids qui évolue avec la progression (ex. plus de Sens/Lecture en début de partie, plus de Grammaire/Disposition en fin). Ce n'est pas nécessaire — le mécanisme d'exclusion/redistribution ci-dessous produit déjà cet effet **naturellement, sans table à maintenir en plus** : tôt dans le jeu, Grammaire/Conjugaison/Disposition/Écoute sont exclus faute de contenu disponible (peu de grammaire rencontrée, peu de kanji étudiés, peu d'audio couvrant des mots encore inconnus), donc le pool effectif de modes est plus restreint et progressivement redistribué vers Sens/Lecture/Écriture/Composition. Ce pool s'élargit tout seul à mesure que le joueur avance, jusqu'aux 9 modes en fin de partie. Le nombre de modes réellement actifs croît donc avec la progression sans mécanisme dédié.

Modes indisponibles : si `encounteredGrammarCount == 0` (aucun point de grammaire encore rencontré), Grammaire et Conjugaison sont exclus ; si aucune phrase Disposition éligible (`kanji_ids ⊆ studiedSet` et `chunks` non vide), Disposition est exclue ; si aucun mot/phrase Écoute éligible (audio disponible ET `kanji_ids ⊆ studiedSet`), Écoute est exclu — même garde que Disposition ; si aucun mot composé valide formable avec le `studiedSet` du combat, Composition est exclu — même garde (2026-07-02). Le poids des modes exclus est redistribué proportionnellement aux modes restants. La redistribution s'effectue à chaque tirage individuel (pas en début de combat).

**Pas de répétition de contenu au sein d'un même combat (adopté 2026-07-02) :** l'enchaînement des *modes* peut se répéter librement (2-3 fois le même mode d'affilée n'est pas un problème) — mais le **contenu précis** tiré (même point de grammaire, même phrase de traduction, même phrase Disposition, même mot/phrase Écoute, même kanji en Sens/Lecture, même paire de kanji en Composition) ne doit jamais ressortir deux fois dans le même combat. Chaque mode tire dans une pool locale au combat **sans remise** ; si la pool s'épuise avant la fin du combat (pool source trop petite, typique en tout début de partie), elle redevient disponible avec remise plutôt que d'exclure le mode. **Un combat perdu et rejoué immédiatement retire entièrement une nouvelle séquence** (nouveaux tirages de mode et de contenu, aucune réutilisation de la tentative précédente) — cohérent avec l'absence de cooldown déjà en place.

---

## Leçons

Les leçons sont dispensées par des dresseurs-leçon (rôle fixe) et par des NPCs dans les villes et bâtiments. Les interactions NPC et quêtes secondaires du guidebook deviennent des moments de leçon.

**Origine narrative des leçons (2026-07-01, remplace une table d'exemples précédente) :** les interactions et quêtes secondaires du guidebook (un PNJ qui donne un objet, une quête résolue, un personnage secouru, une inscription trouvée) fournissent des **déclencheurs** de leçon sur la carte — l'événement justifie qu'une leçon ait lieu à cet endroit. Le kanji/la grammaire enseignés à cet endroit n'ont en revanche **aucun rapport thématique** avec ce PNJ ou cet événement (voir § Combien de kanji/mots par leçon) — pas de lien du type "cet artisan enseigne le kanji de l'artisanat".

**Format de leçon** : déclenchée en abordant le PNJ sur la carte, puis bascule vers un **écran dédié plein écran** (voir UI/UX ci-dessous) — pas une boîte de dialogue inline. Texte en japonais calibré au tier de la zone. Segments pédagogiques tapables. Quiz court de 2–3 questions à la fin. La grammaire et la conjugaison ne rejoignent pas le SRS — elles sont apprises par les rencontres.

**UI/UX — écran dédié plein écran, inspiré de Wagotabi (2026-07-01, remplace la version précédente "aucun écran dédié") :** contrairement à ma proposition initiale, la leçon **n'est pas** une simple boîte de dialogue inline — elle ouvre un écran dédié, après une courte animation, avec une musique calme dédiée à la réflexion (nouvelle piste, distincte de la carte/du combat — voir § Audio). Référence directe : l'écran "dictionnaire" de **Wagotabi** (jeu d'apprentissage du japonais) — double page de livre ouvert, texture parchemin, cadre bois/laque foncé, kanji en grand avec furigana, petite illustration d'étymologie, son à l'écoute, exemples de phrases en dessous. On reprend ce langage visuel du **livre ancien** mais avec l'identité **chibi/pixel Pokémon** déjà établie pour la police/les icônes — "entre Pokémon et Japon ancien". **Aucun portrait du PNJ enseignant sur l'écran-livre (2026-07-01, tranché)** : le contenu de la leçon ne montre aucun lien visuel avec le PNJ qui l'a déclenchée — cohérent avec l'absence de lien thématique PNJ↔contenu (voir § Combien de kanji/mots par leçon).
- **Page kanji** : un kanji par page (portrait plein écran) — caractère en très grand, lecture dans une couleur distincte du reste du texte (à la Wagotabi), petite illustration à côté du sens (pas juste du texte), icône audio à côté du caractère. Séparateur net, puis 1-2 exemples de phrase en dessous (chacun avec sa propre icône audio). **Pas d'ordre des traits ni d'animation de tracé** (explicitement écarté). Bouton "Suivant" en bas à droite (comme la flèche ▶ de Wagotabi) pour passer au kanji suivant du groupe — transition de page franche (pas de scroll continu, le livre tourne une page à la fois).
- **Source des illustrations (2026-07-02, tranché)** : icône simple représentant le **concept du mot** (à la Wagotabi — ex. 犬 → chien mignon en pixel-art), pas une vraie étymologie pictographique historique (trop coûteuse à produire pour 2136 kanji, scans archéologiques bruts non réutilisables tels quels comme assets de jeu). **Kanji abstraits couverts par des symboles conventionnels** plutôt qu'exclus : 思う (penser) → cerveau, 感情 (émotion) → cœur, 経済 (économie) → pièce ¥ — même logique que les émojis/icônes UI universels, largement suffisant. Packs CC0/libres identifiés pour l'import : [Kyrise's Free 16x16 RPG Icon Pack](https://opengameart.org/content/kyrises-free-16x16-rpg-icon-pack) (objets/outils, le plus complet), [Nature Kit](https://opengameart.org/content/cc0-resources) + [Camping & Forest Icons](https://itch.io/game-assets/free/tag-cc0/tag-pixel-art) (nature/animaux), [CC0 Food Icons](https://opengameart.org/content/cc0-food-icons) (nourriture) — les packs RPG génériques couvrent déjà nativement les symboles abstraits courants (cœur, pièce, horloge, œil).
- **Page(s) grammaire/conjugaison** : même chrome livre, texte paginé (bouton "page suivante", même logique `dialogue_states`/`pages` que le reste du jeu), affichée après les pages kanji.
- **Segments tapables** : popup léger sur un mot/kanji dans le texte (lecture, sens, `grammar_audio` si dispo) — non bloquant, dismissable en tapant ailleurs. **Palette du popup = celle du livre** (fond parchemin clair, bordure bois/laque foncé, petite illustration si dispo), jamais un popup générique de l'app — même traitement que le popup de mot vu dans Wagotabi (fond crème, bordure rouge, icône + lecture + sens), simplement recoloré aux teintes du livre définies ci-dessus plutôt que copié tel quel.
- **Mini-quiz** : même composant "carte de question" (prompt + 4 boutons) que les modes de combat, mais réhabillé aux couleurs du livre (parchemin/bois) plutôt qu'au chrome de combat (pas de 3 Poké Balls, pas de barre HP, pas de jingle) — un seul composant UI, deux habillages. **Obligatoire, pas de bouton "passer"** (2026-07-01) — vu qu'il est déjà court (2-3 questions) et jamais pénalisant, un skip le viderait de son seul rôle (forcer une relecture active). **Mauvaise réponse → on recommence la question (2026-07-01)** : pas de correction affichée puis passage à la suite — le joueur retente la même question jusqu'à répondre juste avant d'avancer. Toujours pas un échec permanent (aucune limite de tentatives, aucune conséquence hors de cet écran) — voir précision dans "quiz de fin de leçon, formalité" plus bas.
- **Pas de sauvegarde/reprise en cas d'interruption (2026-07-01)** : si le joueur quitte l'app au milieu d'une leçon, rien n'est retenu — au prochain abord du PNJ, la leçon reprend depuis la première page. Aucun curseur de progression stocké.
- **Sortie** : courte animation de fermeture (le livre se referme) → retour à la carte, PNJ en pose assise/passive (déjà acté génériquement pour combat/leçon).
- **Relecture après complétion ("historique", menu START → Leçons) (2026-07-01)** : réouvre le même écran-livre, en lecture seule — pages kanji et grammaire identiques, mais **sans le mini-quiz** (déjà validé, plus de raison d'être).
- **Nouvel asset requis** : chrome de livre (parchemin, cadre, bouton flèche, animation d'ouverture/fermeture) — pas de précédent HGSS à extraire, création originale nécessaire, dans l'esprit Wagotabi sans le copier (couleurs/typo alignées sur l'identité DS déjà établie plutôt que sur celles de Wagotabi).

**Structure interne d'une leçon (2026-07-01, révisé après recherche sur Duolingo/WaniKani/Bunpro) :** toujours dans cet ordre — **kanji/mots nouveaux d'abord, point de grammaire ou conjugaison ensuite (optionnel, pas systématique).** C'est le sens inverse de "un seul topic par leçon" évoqué plus tôt dans la discussion — retenu ici volontairement : c'est la densité de kanji/mots introduits en leçon qui permet d'atteindre les paliers de `curriculum-checkpoints.md` (voir bootstrap Fukuda ci-dessous), donc une leçon peut introduire **plusieurs** kanji/mots d'un coup, contrairement au point de grammaire qui reste toujours unique par leçon (cohérent avec le format `grammar_note` : un seul point Hanabira). Le quiz de fin (formalité) porte sur ce qui vient d'être enseigné dans cette leçon précise.

**Le quiz de fin de leçon est une formalité, pas une porte (2026-07-01, précisé)** : "pas une porte" veut dire qu'il ne bloque jamais l'accès à une zone, ni n'a de conséquence en dehors de l'écran-livre lui-même (pas de vie perdue, pas de note enregistrée, pas de lock-out) — son rôle est de forcer une relecture active avant que le contenu ne rejoigne le SRS, pas de vérifier la maîtrise (qui reste le rôle du SRS, stabilité FSRS ≥ 30 jours). Ceci dit, **dans l'écran lui-même, une mauvaise réponse fait recommencer la question** (voir ci-dessus) — pas de passage forcé en avant sur une réponse fausse. Un dresseur-leçon/NPC ne peut donc jamais bloquer un **chemin** (zone/progression) par un échec de quiz, contrairement à un dresseur-combat, même si la question elle-même doit être réussie pour tourner la page.

**Un seul mécanisme d'entrée du vocabulaire en SRS (2026-07-01, tranché) :** les leçons injectent uniquement des **kanji** dans la file SRS (pour la session du lendemain matin) — jamais de mots directement. Les mots apparaissent dans les leçons comme exemples d'usage en contexte (renforcent le kanji du jour), mais leur entrée en SRS reste exclusivement le canal déjà décrit au § Système SRS ("Déblocage de vocabulaire" : kanji maîtrisé → mots JLPT éligibles rejoignent la file). Un seul chemin, pas de risque de double-injection/idempotence à gérer.

**Combien de kanji/mots par leçon — au fil de l'écriture, pas de nombre fixe (2026-07-01) :** l'équipe de contenu répartit le pool de kanji d'une zone (ex. 50 kanji, voir `content/curriculum-checkpoints.md`) entre ses PNJ-leçon disponibles (tous sourcés du guidebook — politique « zéro PNJ-leçon inventé », corrigé 2026-07-05, audit 01 ; voir Volume estimé ci-dessous et bootstrap Fukuda). **Aucun lien thématique PNJ↔contenu (2026-07-01, tranché — remplace la version précédente "regroupement thématique en priorité")** : quel PNJ délivre quel groupe de kanji n'a **aucun rapport** avec le rôle narratif de ce PNJ — pas de "le PNJ qui parle de l'heure reçoit les kanji de fréquence". Seul lien conservé : **les kanji entre eux** peuvent être groupés par affinité sémantique ou radical partagé pour former une leçon cohérente — un détail de curation de contenu, indépendant de qui l'enseigne. Les groupes ainsi formés sont attribués aux PNJ-leçon disponibles de la zone sans considération de leur identité narrative.

Le nombre de kanji par leçon varie donc selon la taille naturelle de chaque groupe d'affinité — pas de quota fixe par leçon.

**Ordre de production du contenu (2026-07-01, précise la priorité entre les décisions ci-dessus) :** ce qui prime toujours, c'est le respect des paliers de kanji par zone dans l'ordre JLPT (`content/curriculum-checkpoints.md`). Séquence de travail pour l'équipe de contenu :
1. **Macro** — fixer le pool de kanji de chaque zone, dans l'ordre JLPT (déjà fait dans `curriculum-checkpoints.md`).
2. **Méso** — définir le roster de PNJ-leçon de la zone (personnages sourcés uniquement : PNJ nommés + dresseurs/PNJ ambiants sourcés recatégorisés en leçon ; aucun PNJ inventé — corrigé 2026-07-05, audit 01) — sans leur assigner de sujet narratif particulier.
3. **Micro** — grouper les kanji du pool déjà fixé à l'étape 1 par affinité entre eux, puis attribuer ces groupes aux PNJ-leçon disponibles ; même logique pour le point de grammaire/conjugaison de la leçon (regroupé par affinité avec le groupe de kanji si possible, jamais avec le PNJ).
Cette répartition ne redéfinit jamais quels kanji appartiennent à quelle zone — seulement leur regroupement interne une fois la zone fixée.

**Origine des tout premiers kanji — bootstrap Fukuda (2026-07-01) :** les nouveaux kanji n'entrent en jeu QUE par les leçons (jamais par un dresseur-combat, qui ne teste que `studiedSet`). Or Route 29 — la toute première route — n'a aucun PNJ-leçon sourcé du guidebook, ni aucun dresseur dans le jeu d'origine (les « 8–10 dresseurs SRS » que `guidebook-adapted.md` proposait d'inventer seraient des dresseurs-combat ; hors politique zéro-invention des PNJ-leçon, leur sort exact est reporté à la synthèse des audits — note 2026-07-05, audit 01). Pour que le joueur atteigne malgré tout les 30 kanji requis avant Cherrygrove (voir `content/curriculum-checkpoints.md`), l'onboarding chez Fukuda (Bourg Geon, dōjō — déjà 100% inventé, hors guidebook) dispense directement une première séquence de leçons structurées portant les kanji fondamentaux (ordre `getAvailableKanji` : JLPT puis prérequis composants), avant même que le joueur ne quitte la ville.

**Assignation du contenu de leçon — fixée à l'écriture, jamais dynamique (2026-07-01, précise le modèle ci-dessus) :** un PNJ-leçon (toujours sourcé du guidebook — recatégorisé si besoin, jamais inventé ; corrigé 2026-07-05, audit 01) porte **un seul kanji/grammaire fixé au moment de l'écriture du contenu** — jamais choisi au runtime selon la progression du joueur qui l'aborde. Il n'y a pas de catégorie "leçon bespoke" vs "leçon générique" dans le moteur : un PNJ-leçon est un PNJ-leçon, point, exactement comme il n'y a plus de classe de dresseur pilotant un thème kanji (voir suppression du mécanisme kanji_pool-par-classe plus haut). C'est l'équipe de contenu qui dimensionne, zone par zone, combien de PNJ-leçon sont nécessaires (si la densité sourcée d'une zone est insuffisante, on grossit les leçons — jusqu'à 8-12 kanji au niveau N1 — ou la croissance kanji est portée par les zones voisines mieux fournies, jamais par un PNJ inventé ; corrigé 2026-07-05, audit 01) pour respecter en moyenne les paliers de `content/curriculum-checkpoints.md`. Un joueur qui dévie du chemin type **entre zones** (CS-Kanji, ordre de visite différent) reçoit simplement un peu plus ou moins de révision selon son avance réelle — même tolérance que pour le pool de combat (fallback si <5 kanji disponibles). **Cette tolérance ne s'applique qu'entre zones : à l'intérieur d'une même zone, l'ordre de passage des PNJ-leçon est strict** (voir "Ordre des leçons imposé" ci-dessous) — deux échelles différentes, pas une contradiction. `getLessonQueue` (voir ProgressionEngine) n'assigne donc rien : c'est un helper d'affichage en lecture seule pour le menu START → Leçons ("prochaines leçons à faire").

**Ordre des leçons imposé au sein d'une zone — bloqué si le joueur va trop vite (2026-07-01, étendu 2026-07-02) :** contrairement à la tolérance inter-zones ci-dessus, l'ordre de passage des PNJ-leçon **d'une même zone** est strict, pas juste indicatif — sauter le PNJ-leçon #10 pour aller directement au #11 ne doit pas être possible. **S'applique aussi à la 3ᵉ catégorie** (PNJ ambiants recatégorisés en leçon, voir § Dresseurs de Route) — un PNJ-leçon est un PNJ-leçon quelle que soit son origine, même contrainte d'ordre pour tous. Implémenté avec le modèle `Condition`/`Effect`/`quest_step` déjà établi (§ Implémentation), sans nouveau système : chaque zone reçoit une quête implicite `lessons-<zone_id>` dont les `steps[]` suivent l'ordre des PNJ-leçon de la zone (fixé à la production, voir "Ordre de production du contenu" ci-dessus). Le déclenchement du PNJ-leçon (vision/ambush, inchangé) reste identique ; seule sa résolution change :
- Étape précédente de la quête déjà atteinte → la leçon s'ouvre normalement (écran-livre).
- Sinon → **résolution `block`, dans la boîte de dialogue standard (pas l'écran-livre)** — reproduit le mécanisme d'origine des jeux Pokémon (confirmé, 2026-07-02) : le PNJ repère le joueur ("!"), marche jusqu'à lui, délivre une ligne de blocage, le joueur est repoussé d'une case, puis le PNJ retourne à sa position de départ. Se reproduit à chaque tentative tant que l'étape n'est pas atteinte. **Banque de phrases de blocage variées (2026-07-02)** : pas une ligne fixe unique — un pool de plusieurs formulations équivalentes ("Tu vas trop vite !", "Attends un peu, va d'abord voir les autres.", "Pas encore, il te manque quelque chose.", calibrées au niveau de langue de la zone), piochées au hasard à chaque blocage pour éviter la répétition mécanique.

**Volume estimé de PNJ-leçon (recalculé 2026-07-05, audit 01 — remplace l'estimation « ~430-500 à ~30 kanji/zone » du 2026-07-02, dont la moyenne masquait un mur de 700 kanji sans aucune leçon à la Ligue)** : la répartition réelle est en deux régimes. **Johto (0→870)** : leçons de 4–5 kanji ≈ **175–215 leçons** sur ~39 zones. **Kanto (900→2136, ~56 kanji/zone)** : leçons « poussées » de 8–12 kanji, adaptées à un joueur N1 ≈ **105–155 leçons** sur 22 zones. Total ≈ **300–370 PNJ-leçon, tous sourcés** (PNJ nommés du guidebook + dresseurs/PNJ ambiants sourcés recatégorisés — aucun PNJ inventé). La Ligue (plate, 870–900) et Mont Gris (plateau 2136) ne portent aucune leçon obligatoire — leurs plages sont de la calibration de langue ; les zones sans personnage sourcé utilisable (Routes 33/35/38/44/45, Chemin Glacé, Grotte Sombre…) ne portent pas de leçons non plus : leur croissance kanji est absorbée par les zones voisines mieux fournies (les plages se chevauchent déjà).

Compléter une leçon déclenche un `Effect.advance_quest` sur `lessons-<zone_id>`. Portée strictement aux PNJ-leçon — les dresseurs-combat ne sont pas concernés (aucun risque curriculaire, ils ne testent que du kanji déjà étudié quel que soit l'ordre dans lequel on les rencontre).

---

## Système SRS

Algorithme FSRS (`ts-fsrs`). Deux types de cartes :

- **Cartes kanji** : 2 cartes par kanji (sens + lecture), indépendantes
- **Cartes vocabulaire** : 2 cartes par mot (sens + lecture), indépendantes

Session SRS : esthétique Centre Pokémon, musique calme. Carte affichée → Révéler → 4 notes (Encore/Difficile/Bien/Facile). Session terminée quand la file est vide.

**Maîtrise** : un kanji ou mot est "maîtrisé" quand ses deux cartes ont une stabilité FSRS ≥ 30 jours.

**Déblocage de vocabulaire (seuil assoupli 2026-07-01)** : dès qu'un kanji est **étudié** (simplement en file SRS — pas besoin d'attendre sa maîtrise à ≥30 jours de stabilité), les mots JLPT éligibles utilisant ce kanji rejoignent la file SRS. **Raison du changement :** exiger la maîtrise complète de chaque kanji composant avant de débloquer un mot retardait excessivement l'acquisition de vocabulaire réel (un joueur pouvait connaître le sens isolé de dizaines de kanji sans jamais pratiquer un seul mot les combinant). Pas de plafond quotidien — le rythme d'introduction de nouveau kanji (en leçon) et de nouveau vocabulaire (dès kanji étudiés) suit librement la progression du joueur sur la carte. La seule contrainte quotidienne du jeu reste la session SRS (voir Boucle Quotidienne) : au moins une session par jour, peu importe sa taille.

**Rythme et charge assumés (documenté 2026-07-05, audit 01 — aucun chiffre cible n'existait) :** finir le jeu = 2136 kanji ×2 cartes + ~7 836 mots ×2 ≈ **19 944 cartes** à introduire. Au rythme de référence (~1 leçon/jour : 4-5 kanji en Johto, 8-12 en Kanto), le jeu se boucle en **~12-18 mois**, avec ~40-55 nouvelles cartes/jour et **~300-380 révisions FSRS/jour en régime de croisière (≈ 1h/jour)**. Assumé tel quel : la décision « pas de plafond quotidien » est conservée, et tout design SRS/leçons/textes doit être jugé contre ces chiffres — cohérent avec l'achievement streak 365 jours.

**La grammaire n'est PAS dans le SRS.** Elle est apprise par les combats et les leçons, renforcée par les rencontres en contexte sur la carte.

---

## Textes Progressifs

Document détaillé : `content/texts-progressifs.md` — non visible par le joueur. Définit le calibrage JLPT
réel des longueurs de passage, la taxonomie des questions de compréhension, la densité/placement des
textes zone par zone, et le choix des sources. Résumé ci-dessous.

**Un seul régime de lecture, deux tiers de texte (2026-07-02, remplace la version précédente à deux
régimes "quête avec quiz" vs "Tadoku en lecture libre avec verrou de temps")** — l'app étant un projet
privé jamais publié commercialement, la licence des sources n'est plus un facteur bloquant (voir
`content/texts-progressifs.md` pour le détail). Tout texte se lit dans la même **fenêtre de lecture
dédiée plein écran**, même famille que l'écran-livre des leçons mais avec une texture de fond variable
selon le type de document en fiction (lettre, parchemin, article, page de carnet — un seul chrome,
plusieurs habillages, même principe que le mini-quiz de leçon/combat). Tout texte se termine par un
**quiz de compréhension obligatoire, retry-jusqu'à-correct** (mauvaise réponse → on recommence la
question, pas de passage forcé ; scaffolding après un 2ᵉ échec sur les questions non factuelles — voir
document détaillé). **Pas de verrou de temps** : c'est le quiz qui force une vraie lecture, pas une
minuterie.

- **Textes obligatoires** (~20-21 sur tout le jeu — un par badge de gym, plus les 3 lieux Rocket, l'Antre
  du Dragon, et Red) : réussir le quiz est une `Condition` requise pour l'`Effect.advance_quest`/
  `unlock_zone`/`badge_earned` suivant — bloque la progression principale, modèle `Condition`/`Effect`
  déjà établi.
- **Textes secondaires** (~70-100, cible large répartie sur les 72 zones, 2026-07-02 — inchangée malgré l'ajout des routes/donjons Kanto : plusieurs des nouvelles zones sont de simples routes de transit, cf. densité "0-1" déjà prévue pour ce type de zone) : **remplacent les side quests
  classiques du jeu** — c'est leur rôle principal. Optionnels pour progresser, mais réussir leur quiz est
  requis pour recevoir la récompense : `Effect.grant_item` (objet thématique) ou statut **"doré"** dans le
  Journal de lecture (Sac → Textes — même logique de couleur que les tuiles du Kanjidex, Blanc/Doré).
  S'appuient sur l'inventaire de PNJ déjà documenté zone par zone (`content/curriculum-checkpoints.md` §
  PNJ sourcés par zone), même logique que la "3ᵉ catégorie" déjà actée pour les leçons.

**Sac → Textes** reste un simple journal de lecture (textes lus, consultables à nouveau, avec leur statut
lu/doré) — jamais une bibliothèque de trophées décoratifs. **Liste désormais tous les textes des zones
débloquées, pas seulement ceux déjà lus** (2026-07-02) : les non-lus apparaissent grisés, cliquables pour
un indice sur le PNJ/objet qui les porte — voir `content/texts-progressifs.md` § Menu "tous les textes".

**CS-Kanji : la lecture donne le pouvoir, plus la maîtrise (2026-07-02, étendu 2026-07-03)** — les
capacités de déplacement (飛・水・力・切・砕・滝・渦) ne sont **jamais** débloquées par la maîtrise FSRS ni
par l'apprentissage d'un kanji dans le SRS. Chaque CS-Kanji est remis par le même PNJ et au même moment
narratif que le CS/HM équivalent du jeu d'origine (ou trouvé au même endroit, pour 滝), mais son texte n'a
d'effet que si **tous les textes des zones déjà débloquées ont été lus** — voir § La Carte de Johto et
`content/texts-progressifs.md` § CS-Kanji pour le détail complet et la table sourcée guidebook.

**Sources** : plus vivantes que l'ancienne liste centrée sur Aozora Bunko (littérature Meiji/Taishō,
registre daté) — Watanoc et Matcha Easy Japanese ajoutés pour du contenu contemporain N4-N3, NHK Web Easy
conservé (actualité réelle), textes officiels japonais de Pokémon envisagés pour le N1 (thématiquement
cohérent avec le fan-projet). Aozora Bunko conservé uniquement pour les moments où l'archaïsme sert la
fiction (Ruines Arcaniques, Antre du Dragon), jamais comme repère de "japonais courant" de fin de jeu.
Détail complet et sélection précise des textes : `content/texts-progressifs.md`.

---

## Arc Narratif

### Curriculum-Checkpoints

Document interne `content/curriculum-checkpoints.md` — non visible par le joueur. Définit ce que le joueur **doit savoir** avant d'entrer dans chaque ville. Les routes et NPCs avant chaque ville sont designés pour couvrir exactement ces prérequis.

Exemple :

> **Avant Mauville (Violet City)** : 80 kanji N5/N4, formes ます/です, て-form, particules は/が/を/に/で/へ, lecture d'un dialogue simple.

Voir `content/curriculum-checkpoints.md` pour le détail complet de chaque ville, ainsi que pour la
table "PNJ sourcés par zone" qui associe à chaque zone des personnages réels du jeu d'origine (Kurt,
Bill, Jasmine, Magnus, les Kimono Girls, etc.) à utiliser comme porte-voix du japonais calibré plutôt
que des PNJ génériques.

### Silver — 6 Rencontres (Positions HGSS Fidèles)

| #   | Lieu                                      | Contexte guidebook                                                                                                                            | Ses 6 kanji            |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | Ville Griotte (retour du chemin)        | Premier combat — condescendant                                                                                                                | 怒、争、力、敵、速、逃 |
| 2   | Ecorcia, porte ouest (avant Forêt Secte) | Bloque le passage                                                                                                                             | 強、越、勝、誇、傲、鋼 |
| 3   | Tour Embrasée (haut de l'échelle)         | Embuscade                                                                                                                                     | 影、闇、忘、去、断、孤 |
| 4   | QG Rocket B2F (Acajou)                    | ⚠️ Pas un combat dans le jeu d'origine — Silver est déjà vaincu par Lance, simple cameo frustré ("pas assez d'affection pour ses compagnons") | 変、知、疑、惜、寂、遅 |
| 5   | Tunnel de Doublonville B2F                      | Grille ton déguisement à la Tour Radio, puis combat réel au Tunnel pendant la chasse à la Carte-clé                                           | 悔、認、謝、恥、赦、和 |
| 6   | Route Victoire                            | Dernier combat avant la Ligue — le jeu vide volontairement la route de tout autre dresseur pour ce face-à-face                                | 静、空、終、別、礼、去 |

_(Sourcé et confirmé par `content/guidebook-adapted.md` — corrige le lieu #5, anciennement "Tour Radio B2F (Doublonville)" : le combat réel a lieu au Tunnel de Doublonville, la Tour Radio n'est que le lieu où le déguisement est démasqué. Niveau de langue calibré par apparition : voir `content/curriculum-checkpoints.md` § Règle de Silver — corrigée pour s'aligner sur cette table après une incohérence détectée entre les deux documents.)_

**Statut mécanique des « 6 kanji » de Silver (précisé 2026-07-05, audit 01) :** motif narratif
d'écriture, rien de plus — ils colorent ses dialogues et les lettres de Fukuda associées, mais ne sont
**ni un pool de combat** (tout combat Silver pioche `studiedSet`, comme n'importe quel dresseur), **ni
une dérogation à la règle des 2 kanji inconnus max** par page de dialogue (`content/curriculum-checkpoints.md`
§ Les deux règles absolues) : sur une page donnée, au plus 2 de ces kanji peuvent apparaître comme
inconnus. Même statut pour les jeux de kanji « signature » des Kimono Girls listés dans
`content/guidebook-adapted.md`.

### Team Rocket — 3 Lieux (Fidèles au Jeu)

**1. Puits Ramoloss (Ecorcia)**

- Exécutif : Proton
- Kanji du combat : 捕、縛、操、支、制
- Gate : bloque l'accès au Gym de Bugsy jusqu'à résolution

**2. QG Rocket (Acajou) + Lac Colère**

- Exécutif : Ariana (double combat avec Lance)
- Silver rencontré sur B2F (battu par Lance, pas de combat avec le joueur)
- Kanji du combat : 欺、偽、惑、騙、詐
- Gate : bloque le Gym de Pryce jusqu'à résolution

**3. Tour Radio (Doublonville)**

- ⚠️ **Ordre corrigé (sourcé)** : le 1F est gardé par un Sbire (déguisement requis pour passer) ; Silver grille le déguisement en chemin vers le 2F (scène, pas de combat ici) ; 3F verrouillé jusqu'à la Carte-clé ; 5F = **Petrel déguisé en Directeur** (1er combat, sa défaite donne la clé du sous-sol) → détour Tunnel de Doublonville B2F (vrai Directeur captif, **combat réel contre Silver** — apparition #5, voir table ci-dessus, donne la Carte-clé) → retour Tour Radio 3F avec la Carte-clé : **Proton** → re-**Petrel** (déguisé, 2e combat) → plateforme d'observation : **Ariana** → **Archer** (final, révèle l'objectif = rappeler Giovanni). Soit dans l'ordre des combats : **Petrel → Proton → Petrel → Ariana → Archer**, et non "Proton → Ariana → Petrel → Archer" comme indiqué dans une version antérieure de ce PRD.
- Gauntlet 5 étages + détour Tunnel de Doublonville
- Kanji du combat : 権、力、命、令、報
- Gate : radio nationale bloquée jusqu'à résolution
- Détail complet et sourcé : `content/guidebook-adapted.md` § goldenrod-city.

### Kimono Girls — 5 Rencontres (Fidèles au Jeu)

⚠️ **Table corrigée (2026-06-30)** — la version précédente ne nommait aucune Kimono Girl et plaçait
la 4e à un mauvais endroit ("sortie du QG Rocket" n'existe pas dans le jeu d'origine — elle est
rencontrée à Doublonville, pas à Acajou). Noms et lieux ci-dessous confirmés par dépouillement complet
du guidebook (`content/guidebook-adapted.md` § "Kimono Girls — Noms et lieux sourcés"), recoupés deux
fois (OCR + texte natif du PDF) :

| #   | Nom       | Lieu                                                          | Moment guidebook (texte source)                                                                                              | Leçon de japonais                            |
| --- | --------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | **Zuki**  | Mauville (Violet City), devant le Mart                         | Apparaît juste après que le joueur récupère l'œuf mystère ; "semblait inquiète pour l'œuf"                                   | Introduction à la lecture N5                 |
| 2   | **Naoko** | Forêt Secte (Ilex Forest)                                     | Perdue, aucun sens de l'orientation — le compagnon du joueur lui montre la sortie                                            | Grammaire directionnelle (〜ていく/〜てくる) |
| 3   | **Miki**  | Rosalia Dance Theater (Ecruteak)                              | Harcelée par un Sbire Rocket — le joueur la sauve en combat ; "impressionnée que tu aies battu la Team Rocket"               | N3 grammaire, registre formel                |
| 4   | **Kuni**  | Tunnel de Doublonville (Goldenrod Tunnel), après la clé de sous-sol | "Te respecte d'avoir affronté la Team Rocket" ; laisse échapper une allusion à un esprit légendaire                          | Expressions de gratitude (感謝)              |
| 5   | **Sayo**  | Chemin Glacé (Ice Path), près de la sortie                    | Sandales coincées sur une plaque de glace — le joueur la pousse par derrière pour la libérer ; moment volontairement comique | Combat de compréhension N2                   |

**Statut des 5 rencontres individuelles — scènes/leçons, pas des combats (corrigé 2026-07-05, audit 01) :** fidèle au narratif ci-dessus et au jeu d'origine (aucun combat individuel contre une Kimono Girl ; seule la rencontre de Miki implique un combat — contre le Sbire Rocket, pas contre elle). Les seuls combats Kimono sont ceux du **gauntlet collectif** ci-dessous (5 combats, longueurs 24→48, voir table § Système de Combat). Conséquences mécaniques : gate de Clair = « 4/5 rencontrées », achievement = « les 5 rencontrées + gauntlet vaincu », `kimono_progress.cleared_at` = scène/leçon complétée, lettres de Fukuda déclenchées par les rencontres (nombre inchangé : 5).

**Événement collectif (post-Master Ball)** : les 5 Kimono Girls se réunissent à l'Rosalia Dance Theater
pour un gauntlet — un combat chacune, un seul compagnon par combat, "test du lien avec ton équipe".
Victoire → Clear Bell/Tidal Bell, condition requise pour faire apparaître l'esprit légendaire au sommet
de Tour Jo (Bell Tower) — où les 5 girls exécutent une danse rituelle qui fait résonner la cloche et
attire l'esprit. Trophée de texte légendaire débloqué à cette occasion.

_(Note : la 4e rencontre dans l'ordre de la table récap du guidebook lui-même liste Kuni en position 4
malgré une rencontre chronologique réelle légèrement différente selon le chemin emprunté — la
numérotation #1–5 ci-dessus suit l'ordre canonique du guidebook, pas nécessairement l'ordre strict de
visite du joueur, qui peut varier selon le chemin Acajou/Oliville choisi en premier.)_

### Légendaires — Boss de Grammaire

Raikou, Entei, Suicune s'échappent de la Tour Embrasée après la 3ème bataille avec Silver. Ils rodent dans Johto. Chacun représente un domaine grammatical avancé à "chasser" en maîtrisant suffisamment de grammaire dans ce domaine.

_(✅ Confirmé par le guidebook : à l'arrivée dans la tour, le joueur aperçoit les trois esprits par un
trou dans le sol ; Silver ambush au sommet de l'échelle menant au sous-sol (apparition #3 — voir table
Silver ci-dessus) ; en approchant ensuite au sous-sol, les trois prennent la fuite et deviennent des
présences mobiles trackées sur la carte — séquence et ordre des événements fidèles à l'original.)_

| Légendaire        | Domaine grammatical                                    | Condition d'apparition               |
| ----------------- | ------------------------------------------------------ | ------------------------------------ |
| Raikou (Tonnerre) | Conjonctions N2 (〜ものの、〜にもかかわらず)           | 15 points de grammaire N2 rencontrés |
| Entei (Feu)       | Expressions N1 (〜だけに、〜にほかならない)            | 10 points de grammaire N1 rencontrés |
| Suicune (Eau)     | Registre classique (〜ものだ littéraire, 〜うが〜うが) | Trophée Antre du Dragon complété     |

Chaque rencontre légendaire = combat tiré de son domaine grammatical, longueurs 45/52/60 (Raikou/Entei/Suicune — voir table des longueurs § Système de Combat) *(« combat de 10 questions » supprimé : obsolète depuis la courbe de difficulté du 2026-07-01 ; corrigé 2026-07-05, audit 01)*. Victoire = trophée de grammaire rare dans la bibliothèque + lettre de Fukuda.

---

## Système 道場 — Gyms comme Jalons Curriculaires

Chaque gym = un jalon de langue japonaise. Y entrer nécessite de satisfaire les prérequis curriculaires. Battre le 師範 prouve que le joueur a atteint ce niveau.

**Structure** : 2 門弟 (gardes, 10 questions chacun au premier gym, jusqu'à 18-20 en fin de progression) → combat du 師範 (24 à Falkner, jusqu'à 72 à Clair — voir "Longueurs de combat" § Système de Combat pour la table complète par gym). *(2026-07-02 : "20 questions" fixe retiré, obsolète depuis l'adoption de la courbe de difficulté croissante du 2026-07-01.)*

**Seuils et gates curriculaires :**

| 師範    | Gate primaire     | Gate curriculaire                                                                                                                     |
| ------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Falkner | 80 kanji étudiés  | 15 points de grammaire N5 rencontrés (`grammar_encounters`), 1 texte lu                                                                                                     |
| Bugsy   | 150 kanji étudiés | Puits Ramoloss libéré                                                                                                                 |
| Whitney | 250 kanji étudiés | 12 points N4 rencontrés, 3 quêtes NPC (= les 3 quêtes sourcées disponibles avant Doublonville — zéro marge, assumé)                                                                                                    |
| Morty   | 370 kanji étudiés | 25 points N4 rencontrés, Tour Embrasée visitée                                                                                          |
| Chuck   | 500 kanji étudiés | 10 points N3 rencontrés, quête du Phare d'Oliville commencée (Jasmine rencontrée au Phare) — remplace « QG Rocket commencé », impossible ici : le QG (Acajou) est une zone postérieure à Irisia (corrigé 2026-07-05, audit 01)                                                                                              |
| Jasmine | 600 kanji étudiés | 25 points N3 rencontrés. Combat sur **revisite tardive** d'Oliville (quête Amphy/Phare résolue au 1ᵉʳ passage, ~440-490 kanji ; combat réel calibré N2, ~600 kanji — même schéma que Doublonville/Silver #5, voir `curriculum-checkpoints.md` § "zones revisitées"). |
| Pryce   | 560 kanji étudiés *(corrigé 2026-07-02, était 750)* | QG Rocket libéré, 8 points N2 rencontrés. |
| Clair (Gym) | 650 kanji étudiés *(nouveau 2026-07-02)* | 15 points N2 rencontrés, 4/5 Kimono Girls rencontrées (scènes/leçons, plus des combats — corrigé 2026-07-05, audit 01). Ouvre l'accès à l'Antre du Dragon, ne donne pas le 印. |
| Clair (印, quiz Antre du Dragon) | 720 kanji étudiés *(corrigé 2026-07-02, était 900)* | 25 points N2 rencontrés. Quiz d'empathie du Maître (5 questions) — voir note "twist Clair" ci-dessous pour le détail. |

**Gates de grammaire redéfinis en comptes de points (corrigé 2026-07-05, audit 01) :** les anciens libellés « N5 grammaire complète » / « phase 1 » n'étaient ni définis nulle part, ni couvrables — le corpus Hanabira compte 828 points pour ~300-370 leçons à un point maximum chacune (optionnel), « complète » était donc mécaniquement impossible. Chaque gate est désormais un **compte de points du niveau rencontrés**, mesurable sur `grammar_encounters` (qui compte leçons, dialogues et textes). Les chiffres (15/12/25/10/25/8/15/25) sont une proposition de calibration dimensionnée sur l'offre réelle de leçons avant chaque gym — à ajuster par l'équipe contenu, pas un fait sourcé.

**Texte obligatoire par gym (2026-07-02, généralise le "1 texte lu" de Falkner)** : chaque 師範 (Johto et
Kanto) gate désormais sur **1 texte obligatoire lu et son quiz réussi**, pas seulement Falkner en
exception — voir `content/texts-progressifs.md` pour le modèle complet (~20-21 textes obligatoires sur
tout le jeu : un par badge, plus Rocket/Antre du Dragon/Red). Le quiz d'empathie de Clair sur l'Antre du
Dragon (ci-dessus) est un exemple de ce mécanisme, pas un système à part.

**⚠️ Correction de calibration (2026-07-02) :** un audit croisé gate-par-gate vs `content/curriculum-checkpoints.md` a trouvé que les 5 premiers badges (Falkner→Chuck) et les 8 gates Kanto tombent tous correctement dans la plage kanji de leur ville, mais que les 3 derniers gates Johto en étaient très éloignés :
- **Jasmine (600)** — écart justifié et laissé tel quel : c'est une revisite tardive, déjà confirmée par le guidebook (elle n'est pas à son gym au 1ᵉʳ passage). Seul manquait le repère de calibration explicite pour son vrai combat, ajouté ci-dessus.
- **Pryce (était 750, plage Acajou Ville 530–560)** — aucune revisite équivalente n'est confirmée par le guidebook pour ce gym (contrairement à Jasmine) ; le combat a bien lieu dans la foulée du QG Rocket, sans détour narratif. 750 semble donc avoir été une dérive de chiffrage plutôt qu'un choix voulu. Ramené à 560 (haut de la plage de la zone) pour que le combat tombe dans le contenu réellement calibré pour Acajou Ville, avant l'entrée dans Chemin Glacé (570+).
- **Clair (était 900, plage Antre du Dragon 640–720)** — le gate unique confondait deux choses : le combat de Gym lui-même (qui devrait tomber dans la plage de Saupoudreville/Ebènelle, 600–660) et le quiz de l'Antre du Dragon qui donne le vrai 印 (qui devrait tomber dans la plage de l'Antre du Dragon, 640–720). Scindé en deux lignes ci-dessus (650 et 720) plutôt que de garder un seul chiffre à 900, très en dehors des deux plages concernées.

Ces deux derniers changements sont une proposition de calibration, pas un fait sourcé du guidebook (contrairement à Jasmine) — à confirmer par l'équipe si une autre intention de pacing était voulue pour ces deux badges.

### Kanto — 8 Gyms (adopté 2026-07-01)

Après Plateau Indigo (Elite Four + Lance), le joueur traverse Kanto : 8 gyms supplémentaires, prérequis pour affronter Red à Mont Gris (fidèle au jeu d'origine — les 16 badges sont nécessaires). Sourcé de `scripts/sources/guidebook/kanto-guide-fulltext.txt` (guide Prima Kanto, OCR archive.org — voir `content/guidebook-adapted.md` § Kanto pour la méthode et les réserves sur la qualité de cette source face au texte propre du Johto). Ordre confirmé à la fois par recherche web et par la numérotation interne du guide ("Gym Battle 9" à "16") :

| 師範 | Ville | Gate primaire | Longueur combat |
|---|---|---|---|
| Lt. Surge | Vermeille City | 1050 kanji étudiés | 82 |
| Sabrina | Safranville | 1200 kanji étudiés + 10 points N2 rencontrés | 85 |
| Misty | Azuria City | 1350 kanji étudiés + 20 points N2 | 87 |
| Erika | Céladia | 1500 kanji étudiés + 30 points N2 | 89 |
| Janine | Fuchsia City | 1650 kanji étudiés + 5 points N1 rencontrés | 92 |
| Brock | Argenta City | 1800 kanji étudiés + 12 points N1 | 94 |
| Blaine | Île Braise | 1950 kanji étudiés + 20 points N1 | 96 |
| Blue | Vertville (dernier gym, rival historique de Red) | 2100 kanji étudiés + 30 points N1 | 98 |

*(Gates recalibrés 2026-07-05, audit 01 — anciens : 1500/1560/1620/1680/1740/1800/1860/1920. L'audit de progression a montré que la Ligue ne peut fournir aucun kanji (700 kanji « 800→1500 » sans un seul PNJ-leçon) et qu'un trou de 80 kanji séparait Kanto (1920) de Mont Gris (2000). Nouveau schéma : Ligue plate 870–900, **le Kanto porte 900→2136** (~56 kanji/zone, leçons poussées de 8-12 kanji), **Mont Gris = plateau bonus à 2136** (révision + textes N1 difficiles). Blaine se combat aux Seafoam Islands (plage 1920–1950) ; Blue sur revisite de Vertville à 2100 ; les 2136 sont atteints via les revisites post-Blaine (Vertville puis Bourg-Origine 2ᵉ visite), donc avant Mont Gris — le gate Red (2136) devient atteignable. Détail : `content/curriculum-checkpoints.md` § Recalibrage majeur. **Remapping grammaire (décision 2026-07-05)** : l'arc Kanto n'est plus tout-N1 — Vermeille→Céladia = N2 (900–1500), Cycling Road→Routes 14-15 = N2/N1 (1500–1670), au-delà = N1, aligné sur les équivalences officielles kanji↔niveau (N2≈1000, N1≈2000) ; d'où les comptes de points N2/N1 ajoutés aux gates ci-dessus — même proposition de calibration à ajuster que pour les gyms Johto.)*

Vies tolérées : `max(2, ceil(questions × 0.10))` comme les autres gyms → 9 pour les 4 premiers, 10 pour les 4 derniers.

**Gate Mont Gris** : 16 badges (8 Johto + 8 Kanto) + Elite Four/Lance terminés + trophée Antre du Dragon + 5 Kimono Girls battues + 2136 kanji étudiés.

⚠️ **Limite de cette source** : contrairement au guide Johto (texte natif propre extrait du PDF), le PDF Kanto est un scan sans couche de texte — l'extraction vient d'un OCR archive.org (même méthode que la "passe 1" abandonnée pour Johto). Les noms de gyms/villes/ordre sont fiables (recoupés avec une recherche web indépendante). **Une passe 2 partielle (2026-07-01)** a confirmé des repères utiles par ville (équipes de 4 des 8 Gym Leaders, plusieurs callbacks Johto directs — Mont Mortier, Tunnel de Doublonville, Tour Jo/Ho-Oh, Baoba/Pal Park — et un détail narratif fort sur Île Braise : le Gym de Blaine y a été détruit par une éruption volcanique et relocalisé aux Seafoam Islands, avec Blue rencontré sur place comme point de contrôle narratif avant le combat final à Vertville, structure similaire au fil Silver). **Passe 6 (2026-07-01)** a ajouté les rosters de dresseurs *gardant chaque Gym* (absents jusqu'ici — seule l'équipe du 師範 lui-même était notée), plus Bourg-Origine/Pallet Town (point d'arrivée et de retour après Red, absent des passes précédentes) et un fil reliant l'embuscade Kanto de Silver au Mont Lune à la Tag Battle déjà connue de l'Antre du Dragon. Roster de dresseurs de *route* (hors gyms) toujours partiel — voir `content/guidebook-adapted.md` § Kanto pour le détail complet et la liste des routes encore non couvertes.

**📍 Clair/Antre du Dragon — exception adoptée au système 道場 (2026-07-01) :** seul gym où battre le 師範 ne donne **pas** directement le 印. Battre Clair ouvre seulement l'accès à l'Antre du Dragon ; le Maître y soumet le joueur à un quiz en 5 questions axé sur l'empathie ("si j'étais à la place de l'autre, que ressentirais-je ?") — ce quiz remplace/recalibre le "Quiz de traduction N1" déjà prévu en section Leçons, qui ne doit donc plus porter sur la seule traduction littérale. Réussite → Clair (surprise, "elle ne s'attendait même pas à ce que tu réussisses") remet le 印 n°8. Le combat de Gym reste une porte d'entrée, pas le juge final — un ressort dramatique délibérément différent des 7 autres gyms (traités uniformément).

**Gate Plateau Indigo** : 8 badges Johto + événement collectif Kimono Girls terminé.

**Elite Four → Lance → Kanto (8 gyms) → Red** : séquence de combats escaladants, chaque étape nécessitant la précédente. Red nécessite désormais : 16 badges (8 Johto + 8 Kanto, voir § Kanto ci-dessus) + Elite Four terminé + Lance terminé + trophée Antre du Dragon + 5 Kimono Girls battues + 2136 kanji étudiés.

**Combat Red** : 100 questions. Le chapitre de manga est lu **avant** le combat (score ≥ 80% en compréhension requis pour débloquer le combat lui-même).

**📍 Note sourcée (web passe 3 + guidebook Kanto passe 6, voir `content/guidebook-adapted.md` §
mt-silver-summit pour le détail complet) :** dans le jeu d'origine, Red engage directement sans la
moindre ligne de dialogue ; une tempête de neige/grêle se déclenche automatiquement au début du combat —
confirmé indépendamment par le guide Kanto local comme la météo par défaut du sommet, pas un effet propre
au combat (bon élément d'ambiance transposable en effet visuel/sonore continu, y compris avant les 100
questions). Après la défaite : _"Red marque une pause, silencieux et figé. Puis, en un clin d'œil, il
disparaît."_ — aucune ligne de texte, juste un geste. Confirme et précise le traitement "Red nod
uniquement" déjà prévu : si un seul signe doit sortir de Red, ce devrait être un geste, jamais une
phrase. **Nouveau (passe 6) :** l'accès à Mont Gris est aussi gardé par un gate narratif — une figure
d'autorité (Pr. Chen/Oak dans l'original) doit explicitement "autoriser" l'ascension une fois les 16
badges réunis, et la même figure sert de point de retour après la victoire, où elle récompense le joueur
d'un choix symbolique faisant écho au tout premier choix de l'onboarding. Piste d'enrichissement
optionnelle pour la scène du Prof Elm à Gris Base déjà prévue ci-dessus (pas une divergence à corriger :
le trophée "Red perfect" déjà défini reste le contenu de base).

**Suppression des thèmes kanji par 師範 (2026-07-02) :** les deux tables "Thèmes kanji par 師範" (Johto et Kanto) sont retirées — jugées inutiles, même décision que la suppression du mécanisme kanji_pool-par-classe pour les dresseurs de route (2026-07-01, voir § Dresseurs de Route). Un combat de 師範 n'a pas de pool kanji hand-picked pour coller à un symbole (空/vol pour Falkner, 電/énergie pour Lt. Surge, etc.) : il pioche dans `studiedSet` au moment du combat, exactement comme `getTrainerBattlePool` pour un dresseur de route normal (voir § Implémentation). Seul l'ordre pédagogique (JLPT + prérequis composants) détermine quels kanji sont disponibles à quel gate — pas une curation narrative par boss. Les kanji « signature » cités ailleurs dans ce document pour des personnages précis (Silver à chaque apparition, Kimono Girls) restent inchangés : ce ne sont pas des thèmes de combat de Gym, mais des choix de dialogue narratif ponctuels, hors du système 道場.

---

## Sensei Fukuda

Fukuda n'est pas un enseignant. Il est le narrateur de ta progression et un philosophe de l'apprentissage des langues.

**Qui est Fukuda (2026-07-02, comble un manque de caractérisation identifié en audit game design) :**
au-delà de "narrateur philosophe", rien ne définissait jusqu'ici qui il est ni pourquoi il s'investit —
un trou risqué vu le poids qu'on lui fait porter (36 lettres — 16 badges + 6 Silver + 3 Rocket + 5 Kimono +
3 légendaires + Antichambre/Lance/Red ; « 33 » corrigé 2026-07-05, audit 01 —, épreuve finale =
aboutissement du combat contre Red). Fukuda est un ancien traducteur/enseignant de japonais, retiré à Bourg Geon depuis des
années, hanté par une question professionnelle jamais résolue : peut-on vraiment transmettre une langue,
ou seulement montrer le chemin et laisser l'autre le parcourir seul ? Il n'attend rien du joueur au
départ — l'onboarding le trouve presque agacé qu'on lui envoie "encore un enfant" — et c'est l'endurance
du joueur au fil des mois qui le convertit peu à peu ; cette bascule intérieure est ce qui motive
l'évolution de ton en 3 phases ci-dessous, plutôt qu'un simple habillage. Il ne raconte jamais son passé
frontalement : il affleure par touches dans les lettres de milieu et fin de partie. Ce léger arc
personnel — un homme qui redécouvre pourquoi il aimait enseigner, à travers l'obstination d'un joueur
qu'il n'a pas choisi — est ce qui rend sa lettre finale méritée plutôt que gratuite.

**Répartition avec le Pr. Elm (2026-07-02) :** les deux coexistent sans redondance de rôle. Elm reste la
figure du monde Pokémon (starter, intrigue Team Rocket/Silver, apparition post-Lance comme rappel de
cette intrigue) ; Fukuda est exclusivement la figure de l'apprentissage du japonais (dōjō, remise du
Pokégear, déclenchement du SRS, lettres de jalons). Un joueur qui ignorerait tout d'Elm perdrait de
l'intrigue Pokémon, pas de la mécanique de progression japonaise, et inversement — les deux fils
narratifs ne se marchent jamais dessus.

Il écrit **après les grands événements** :

- Chaque badge de gym gagné (16 lettres — 8 Johto + 8 Kanto)
- Chaque bataille avec Silver (6 lettres)
- Chaque lieu Rocket libéré (3 lettres)
- Chaque rencontre Kimono Girl (5 lettres — scènes/leçons, voir § Kimono Girls ; corrigé 2026-07-05, audit 01)
- Chaque légendaire de grammaire vaincu (3 lettres)
- Antichambre terminée, Lance battu, Red vaincu

**Évolution de son ton :**

- **Début de partie** : mesuré, observateur — remarque ta progression sans la commenter
- **Milieu de partie** : plus chaleureux, plus personnel — commence à parler de pourquoi le japonais compte au-delà de la technique
- **Fin de partie** : philosophique, silencieux — ses lettres parlent du lien entre la langue et l'identité

**La lettre finale de Fukuda** (après Red) : écrite entièrement en japonais, sans traduction. C'est l'épreuve réelle — la lettre EST l'aboutissement du combat contre Red.

Tous les messages de Fukuda stockés dans `/content/dialogues/fukuda/` en markdown, indexés par `trigger_type` et `trigger_ref`. Aucune génération à runtime.

---

## 図鑑 — Kanjidex

**Nom adopté (2026-07-01) :** "Kanjidex" — nom d'écran en anglais (langue de jeu, voir § Langue du Jeu), clin d'œil direct au Pokédex. Utilisé partout dans ce document et dans le jeu pour désigner l'encyclopédie kanji ; 図鑑 reste le nom du slot dans le Menu Principal (japonais, cohérent avec l'esthétique DS), les deux désignent le même écran.

Accessible depuis START → 図鑑 (Kanjidex), et en tapant n'importe quel kanji dans n'importe quel contexte **hors combat** — navigation directe vers la fiche complète (pas de tooltip intermédiaire). **Pendant un combat, aucun kanji/mot n'est tapable** (question de test, pas de consultation possible tant que la question est active) — le Kanjidex et la Carte Mot ne sont accessibles qu'en dehors des écrans de combat.

**Scroll vertical (2026-07-01, précision suite à Wagotabi) :** la fiche Kanjidex, l'écran de leçon (voir § Format de leçon UI/UX Wagotabi) et l'interface de lecture de texte défilent verticalement comme une page web classique dès que leur contenu dépasse la hauteur d'écran (étymologie + mnémotechnique + composants + 6–8 mots liés + exemples sur une fiche Kanjidex, par exemple) — pas de pagination forcée ni de contenu tronqué.

**Vue grille** : les 2136 kanji Jōyō affichés en grille. Chaque tile est codé visuellement :

- Grisé = pas encore de leçon (tapable, fiche accessible)
- Blanc = étudié (en SRS)
- Doré = maîtrisé (stabilité FSRS ≥ 30 jours)

Filtres : JLPT N5 / N4 / N3 / N2 / N1, statut (tous / étudiés / maîtrisés).

**Fiche individuelle** (tap sur un tile) :

- Caractère en grand, sens principal, toutes les lectures on/kun
- Niveau JLPT et grade scolaire
- Étymologie visuelle (origines pictographiques, sens des composants)
- Mnémotechnique narratif
- Composants visuels — chacun cliquable vers sa propre fiche
- 6–8 mots JLPT contenant ce kanji, avec lecture, sens, statut SRS — chaque mot cliquable vers sa Carte Mot
- 3 exemples de phrases par mot
- Stabilité FSRS pour la carte sens + la carte lecture

---

## Carte Mot

Accessible en tapant n'importe quel mot dans le Kanjidex, un texte ou une leçon — **jamais pendant un combat** (voir § Kanjidex).

Chaque fiche mot affiche :

- Mot en kanji + lecture kana
- Partie du discours, sens en anglais
- Patron d'accent de hauteur (高低, ex. LH・HLL) si disponible
- Compound story — 1–2 phrases expliquant comment les kanji composants se combinent
- Chaque kanji du mot cliquable vers sa fiche Kanjidex
- Niveau JLPT et statut SRS (en file, dû, maîtrisé, non débloqué)
- 3 exemples de phrases (registres variés : neutre, formel, familier)
- Kanji encore à maîtriser avant que ce mot rejoigne le SRS (si non encore débloqué)

---

## Obstacles-Puzzles

_À rédiger — contenu hand-written._

Trois obstacles sur la carte sourcés du guidebook (corrigé 2026-07-03 — les deux premiers s'ouvrent par
objet/événement comme en jeu, pas par CS-Kanji, voir § CS-Kanji "Obstacles à objet-clé") :

- **Simularbre/Sudowoodo (Route 36)** — arrosé avec l'Arrosoir (SquirtBottle) de la Boutique de Fleurs
  de Doublonville. *(L'ancienne version disait "déblocage par 水" — faux vs jeu d'origine.)*
- **Ronflex (devant la Grotte Taupiqueur, Kanto)** — réveillé par l'émission Flûte Poké de la radio
  améliorée (carte EXPN, quête de la Centrale). *(L'ancienne version le plaçait Route 27 "frontière
  fermée v1" — obsolète depuis l'adoption de Kanto le 2026-07-01 ; la ROM le place bien sur les cellules
  Routes 11/12, devant la Grotte Taupiqueur.)*
- **Porte du Plateau Indigo** — 閉 → 開 à l'obtention des 8 badges

---

## Streak

Incrémente d'1 chaque jour calendaire où la session SRS est terminée (via Pokégear ou accès direct). Les combats seuls ne comptent pas.

Pas de boucliers. Simple : rater un jour = streak réinitialisé. Affiché dans l'écran Profil.

---

## Achievements

Ensemble simplifié — seulement les jalons significatifs :

- Kanji étudiés : 10, 50, 100, 500, 1000, 2136
- Kanji maîtrisés : 1, 50, 100, 500, 2136
- Badges de Gym : chacun des 16 (8 Johto + 8 Kanto) + Plateau Indigo + Lance + Red
- Textes : 1er texte lu, 10 textes, 50 textes, tous les textes obligatoires, tous les textes (obligatoires + secondaires) — volume revu à la hausse, voir `content/texts-progressifs.md`
- Silver : battu les 6 fois
- Team Rocket : les 3 lieux libérés
- Kimono Girls : les 5 rencontrées + gauntlet vaincu (corrigé 2026-07-05, audit 01)
- Légendaires : les 3 vaincus
- Streak : 7, 30, 100, 365 jours
- CS-Kanji : les 7 obtenus (飛、水、力、切、砕、滝、渦) — condition de lecture, pas de maîtrise, voir § CS-Kanji (« les 6 » corrigé 2026-07-05, audit 01 — 砕 manquait depuis son ajout du 2026-07-03)
- Red perfect : 100% de précision sur les 100 questions

---

## Implémentation

### Stack

- **Frontend** : Next.js (App Router), Vercel
- **Backend/Base de données** : Supabase (PostgreSQL)
- **Auth** : Google OAuth via Supabase
- **SRS** : package npm `ts-fsrs`
- **Analyse morphologique** : `kuromoji` (build time uniquement, pas runtime)
- **PWA** : manifest + service worker pour installabilité iOS/Android

### Schéma Base de Données (tables clés)

| Table                | Contenu                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kanji`              | character, meanings, readings, etymology, mnemonic, jlpt_level                                                                                                                                                         |
| `words`              | word, reading, jlpt_level, compound_story, pitch_accent                                                                                                                                                                |
| `grammar`            | title, formation, examples, jlpt_level (source Hanabira)                                                                                                                                                               |
| `sentences`          | jp_text, en_text, chunks[], register, kanji_set[] (Tatoeba + JESC)                                                                                                                                                     |
| `lessons`            | zone_id, content, lesson_type, trainer_ref ou npc_ref, `kanji_ids[]` (2026-07-02, le batch de kanji de cette leçon — manquait au schéma), `grammar_id` (optionnel), `sequence_index` (2026-07-02, position dans la quête `lessons-<zone_id>`, pilote l'ordre imposé — voir § Leçons) |
| `texts`              | jp_text, en_text, questions[], level, source, event_ref, length_chars, `tier` (obligatoire \| secondaire), `zone_id`, `npc_ref` ou `found_object_ref` *(champs de placement ajoutés 2026-07-02 — nécessaires pour le menu "tous les textes" et le CS-Kanji, voir `content/texts-progressifs.md`)* |
| `map_trainers`       | trainer_id, zone_id, tile_x, tile_y, facing, sight_range, role (battle/lesson), kanji_pool[], battle_length, name, dialogue_ref                                                                                        |
| `map_npcs`           | npc_id, zone_id, tile_x, tile_y, trigger_type (talk \| sight_auto), facing, sight_range (si sight_auto), sight_auto_result (battle \| block), repeats (bool), unlock_conditions (Condition[], optionnel), dialogue_ref, `role` (2026-07-02, optionnel — `lesson` si ce PNJ ambiant est recatégorisé en 3ᵉ catégorie, voir § Dresseurs de Route ; absent = PNJ ambiant ordinaire. Comble un trou : rien ne distinguait un PNJ-leçon recatégorisé d'un PNJ `talk` classique) |
| `quests`             | quest_id, name, zone_ids[], steps[] (step_id, label)                                                                                                                                                                   |
| `npc_quest_progress` | user_id, quest_id, current_step                                                                                                                                                                                        |
| `user_map_state`     | user_id, current_zone, avatar_x, avatar_y, unlocked_zones[], defeated_trainers[], completed_lessons[], completed_quests[], inventory[]                                                                                 |
| `srs_cards`          | user_id, card_type, due_date, stability, difficulty (champs FSRS)                                                                                                                                                      |
| `grammar_encounters` | user_id, grammar_id, first_seen_at, `times_drawn` (2026-07-02, compte les tirages en combat — pilote la graduation QCM→saisie par point, voir § Système de Combat), `last_drawn_at` (2026-07-02, pilote le boost anti-oubli à 14 jours, voir § Système de Combat) |
| `text_completions`   | user_id, text_id, score, completed_at                                                                                                                                                                                  |
| `battle_results`     | user_id, battle_id, lives_lost, modes_used[], accuracy, played_at                                                                                                                                                      |
| `fukuda_messages`    | user_id, trigger_type, trigger_ref, sent_at, read_at                                                                                                                                                                   |
| `rocket_progress`    | user_id, event_id (1–3), cleared_at                                                                                                                                                                                    |
| `silver_progress`    | user_id, encounter_id (1–6), outcome, played_at                                                                                                                                                                        |
| `kimono_progress`    | user_id, girl_id (1–5), cleared_at                                                                                                                                                                                     |
| `legendary_progress` | user_id, legendary (raikou/entei/suicune), cleared_at                                                                                                                                                                  |
| `mastery_events`     | user_id, kanji_id, fired_at                                                                                                                                                                                            |

**Modèle de déclenchement PNJ (ajouté 2026-07-01) :** tout PNJ est `talk`-able par défaut (le joueur s'approche, appuie A). Un PNJ peut en plus avoir un cône de vision (`facing`/`sight_range`, même géométrie que `map_trainers`) qui déclenche automatiquement un `sight_auto_result` :

- `battle` — combat automatique au premier passage dans le champ de vision (dresseurs, Silver). Ne se reproduit jamais (`repeats: false`) ; après la défaite, le PNJ redevient `talk` pur avec une ligne post-combat différente.
- `block` — interception : le PNJ marche vers le joueur, délivre une ligne de blocage, le joueur est repoussé d'une case. Se reproduit à chaque tentative d'approche (`repeats: true`) tant que ses `unlock_conditions` ne sont pas remplies.

**Modèle de condition/effet générique (ajouté 2026-07-01, étend le modèle ci-dessus — voir ADR-0003) :** un type `Condition` unique remplace les champs ad hoc (`min_kanji_studied`, `blocks_until`) partout où une porte d'accès existe (PNJ, Gym, zone CS-Kanji, étape de quête) : `kanji_count`, `item_owned`, `quest_step`, `npc_cleared`, `event_cleared`, `badge_earned`. Un tableau `Condition[]` = ET logique. Sur un `map_npcs`/`map_trainers`, `unlock_conditions` gate la **présence** de l'entité (visible et interactif), pas seulement son contenu — un PNJ dont les conditions ne sont pas remplies n'existe simplement pas sur la carte ce jour-là. Symétriquement, un type `Effect` (`advance_quest`, `grant_item`, `unlock_lesson`, `unlock_zone`, `unlock_text` *(ajouté 2026-07-02 — voir § Textes Progressifs : sans ce type, une side quest n'avait mécaniquement aucun moyen de récompenser un texte, seuls `grant_item`/`advance_quest` existaient)*) peut être attaché à un `dialogue_state` pour faire avancer le jeu quand ce texte est lu — la progression de quête est toujours **avancée explicitement par un Effect**, jamais recalculée depuis l'état du jeu. **Précisions (ajoutées 2026-07-01, en écrivant le premier vrai PNJ-quête) :** `Condition.quest_step` teste "l'étape courante est **à ce stade ou après**" (comparaison sur l'ordre des `steps[]` de la quête), pas une égalité stricte — un `state_rules` qui teste une étape antérieure reste donc vrai même une fois la quête plus avancée ; c'est voulu, ça évite d'avoir à lister une règle par étape franchie. Tous les `Effect` sont **idempotents** : `advance_quest` vers une étape déjà atteinte ou dépassée ne fait rien, `grant_item` d'un objet déjà possédé ne fait rien — reparler à un PNJ après la fin de sa quête ne peut pas déclencher deux fois la même récompense.

**Gros morceaux multi-PNJ (QG Rocket, Tour Radio, Tour Jo — ajouté 2026-07-01, voir ADR-0004) :** aucun modèle "événement" séparé n'est nécessaire. Ce sont des compositions ordinaires de `map_trainers`/`map_npcs`, enchaînées par une ou plusieurs `Quest`s pour le séquençage (Carte-clé, déguisement, mots de passe = `Condition.item_owned`/`quest_step` sur les `unlock_conditions` des PNJ suivants). Le contournement furtif d'une alarme se modélise par deux entrées de registre à la même tuile, avec des `unlock_conditions` complémentaires (présente si alarme active, absente sinon) — pas par un mécanisme dédié. Chaque bâtiment à étages (Tour Radio, QG Rocket, Tour Jo) obtient un `zone_id` par étage/salle, suivant le précédent déjà établi par `indigo-plateau-will`/`-koga`/`-bruno`/`-karen`/`-lance` (5 zone_id pour une seule salle de la Ligue) — le compte de "49 zones" grandira d'autant quand ces intérieurs seront tile-authored. Les ~17 jalons majeurs nommés (3 événements Rocket, 6 rencontres Silver, 5 Kimono Girls, 3 légendaires) gardent leurs tables dédiées (`rocket_progress`, `silver_progress`, `kimono_progress`, `legendary_progress`) plutôt que de passer par `npc_quest_progress` générique — liste assez petite et fixe pour ne pas justifier l'indirection, écrite directement par la logique de jeu quand le dernier PNJ/dresseur de l'arc est vaincu/résolu.

Le contenu pointé par `dialogue_ref` (`content/dialogues/npcs/<zone_id>/<npc_id>.json`) n'est donc pas une ligne unique mais une carte de **`dialogue_states`** keyés (ex. `intro`, `post_battle`, `blocked`, `post_event`, ou des noms d'étape de quête comme `briefed`/`waiting`), chacun paginé en courtes boîtes de texte (le joueur avance avec A, comme dans HGSS), et optionnellement porteur d'`Effect[]`. Le `dialogue_state` actif est choisi par une liste de **`state_rules`** ordonnées (`Condition[] → state`, premier match gagnant ; un `default` final), évaluées contre `user_map_state`/`npc_quest_progress`. `content/map/npcs.json` reste un registre léger (position + comportement de déclenchement + `dialogue_ref`) ; le texte japonais/anglais et les `state_rules` vivent séparément sous `content/dialogues/npcs/`. Une quête qui implique plusieurs PNJ/zones (ex. Forêt Secte) vit dans son propre fichier `content/quests/<quest_id>.json` (liste d'étapes ordonnées, surtout pour référence humaine et comme cible de `Condition.quest_step`) — chaque PNJ impliqué référence cette quête indépendamment dans ses propres `state_rules`/`effects`.

**Dresseurs et dialogue (ajouté 2026-07-01, comble un trou de la table `map_trainers`) :** un dresseur a lui aussi un `dialogue_ref`, même mécanisme `dialogue_states`/`pages`/`state_rules` que les PNJ, mais sous `content/dialogues/trainers/<zone_id>/<trainer_id>.json`. Deux états minimum : `battle_intro` (la phrase d'accroche affichée pendant la transition de combat, avant la première question) et `post_battle` (la ligne dite une fois vaincu, affichée si le joueur lui reparle ensuite — le dresseur ne redéclenche jamais le combat automatiquement après la première défaite, voir ADR-0001).

### ProgressionEngine (`src/lib/progression-engine.ts`)

TypeScript pur, sans I/O :

- `getAvailableKanji(studiedSet, allKanji, componentGraph)` — ordre JLPT, prérequis composants
- `getAvailableWords(studiedKanjiSet, allWords, wordsInDeck)` — déblocage de vocabulaire dès kanji étudiés (2026-07-01, renommé — n'exige plus `masteredKanjiSet`)
- `getTrainerBattlePool(trainer, studiedSet)` — intersection kanji_pool ∩ studiedSet, min 5
- `getDōjōKanji(theme, studiedSet)` — pool de combat gym
- `getGrammarForBattle(zoneJlptTier, encountersSet)` — grammaire rencontrée uniquement, fallback
- `selectQuestionMode(battleType, encounteredGrammarCount, hasDispositionSentences, hasEcouteAudio)` — sélection pondérée parmi 9 modes, avec redistribution des modes indisponibles
- `drawBattleContent(mode, pool, usedInBattleSet)` — tirage sans remise dans la pool locale au combat pour le mode donné (grammaire, phrase, kanji, paire de kanji selon le mode) ; retombe en tirage avec remise si `usedInBattleSet` couvre déjà toute la `pool` (voir § Pas de répétition de contenu)
- `getDispositionChunks(chunks)` — retourne `chunks[]` mélangés (Fisher-Yates), pur
- `isInSight(trainerPos, facing, sightRange, avatarPos)` — géométrie pure
- `isTrainerDefeated(trainerId, defeatedSet)` — bool
- `isZoneClear(zoneId, trainers, defeatedSet)` — tous les dresseurs de la zone battus
- `checkCurriculumGate(cityId, playerStats)` — bool + conditions non remplies
- `getDailySRSStatus(srsHistory, today)` — { sessionDone, cardsPending }
- `getCSKanjiAbilities(unlockedZones, textCompletions, narrativeFlags)` *(signature changée 2026-07-02, remplace `masteredSet`)* — capacités de carte actives ; un CS-Kanji est actif si son PNJ-donneur a été atteint (`narrativeFlags`, ex. Chuck battu) ET si tous les textes des zones débloquées sont dans `textCompletions` — voir § CS-Kanji et `content/texts-progressifs.md`
- `getLessonQueue(availableKanji, completedLessons)` — helper d'affichage en lecture seule (menu START → Leçons) ; liste les leçons déjà rencontrées sur le chemin mais pas encore complétées, dans l'ordre où le joueur les a croisées. N'assigne aucun contenu — chaque PNJ-leçon porte son kanji/grammaire fixé à l'écriture (voir § Leçons)

### Pipeline de Données

1. Parser **Kanjidic2** → table kanji
2. Parser **KanjiVG** → table kanji_components
3. Parser **JMdict Extended** (217 625 entrées) → table words. Croiser avec Yomitan JLPT vocab (8 113 paires) pour peupler `jlpt_level`. Filtrer à 7 836 mots JLPT.
4. Parser **Tatoeba** (150–200k paires) → table sentences (register: neutral). Lancer **kuromoji** en batch → peupler `chunks[]` par phrase.
5. Parser **JESC** (2,8M paires) → table sentences (register: spoken) — combats Silver/Rocket
6. Parser **Hanabira JSON** → table grammar (828 points, 3 310 exemples)
7. **Batch IA** — kanji : étymologie + mnémotechnique pour les 2136 kanji
8. **Batch IA** — mots : compound story pour les 7 836 mots JLPT
9. **Batch IA** — textes des premiers niveaux, calibrés par `content/curriculum-checkpoints.md` et `content/texts-progressifs.md`
10. **Tadoku graded readers** (niveaux 0–2) et **Watanoc** (articles réels N5/N4 dédiés, audio + dictionnaire pop-up) → table texts (niveaux bas)
11. **NHK Web Easy** et **Matcha Easy Japanese** → table texts (japonais contemporain N3–N2, actualité/culture réelles)
12. **Aozora Bunko** → table texts, réservé aux textes où l'archaïsme sert la fiction (parchemins, inscriptions anciennes) — plus le seul repère "haut niveau", voir `content/texts-progressifs.md` § Sources
12bis. **Vetting `studiedSet`** (2026-07-02) — avant insertion, chaque texte candidat (étapes 9-12) est comparé au `studiedSet` théorique du palier visé (règle "2 kanji inconnus max", `content/curriculum-checkpoints.md`) ; accepté tel quel ou édité (mot rare remplacé par un synonyme déjà étudié), jamais un rejet silencieux — voir `content/texts-progressifs.md` § Vetting.
12ter. **Batch IA — génération de quiz** (2026-07-02, miroir de l'étape 14 grammaire) — pour chaque texte retenu, génère un premier jet des 3–5 questions de compréhension selon la taxonomie et la courbe par palier (`content/texts-progressifs.md` § Diversité des questions), relu une fois par l'équipe de contenu, jamais régénéré au runtime. Scope : les textes obligatoires sont en plus tagués avec leur(s) point(s) Hanabira à ce moment (`content/texts-progressifs.md` § Tagging grammaire) ; les textes secondaires ne le sont pas.
13. **Générateur de conjugaison (déterministe, script pipeline, pas d'IA)** — pour chaque verbe/adjectif conjugable de la table `words`, précalcule et stocke **la forme conjuguée correcte attendue** (`conjugated_form`, cible de correspondance exacte pour le clavier IME à partir du 3ᵉ tirage, voir § Système de Combat) ainsi que 3 formes conjuguées incorrectes (mauvaise terminaison godan/ichidan/irrégulier, forme て/ない/た erronée) → nouveau champ `conjugation_distractors[]` (utilisé pour les 2 premiers tirages QCM uniquement). Exécuté une fois en pipeline, jamais au runtime — même principe que kuromoji (étape 4) : tout est précalculé et stocké, le client ne fait que lire/piocher.
14. **Batch IA** — grammaire : le corpus Hanabira a 3 310 exemples pour 828 points (~4 en moyenne par point), pas un seul — pour **chaque exemple disponible** de chaque point (pas seulement `examples[0]`), génère 2–3 variantes incorrectes (mauvaise particule, registre casual/formel inversé) → nouveau champ `distractors[]` par exemple, stocké dans un tableau `example_variants[]` sur l'entrée grammar_note (voir `content/curriculum-checkpoints.md` § Format grammar_note). Objectif : éviter qu'un point de grammaire rencontré plusieurs fois en combat (voir § Pool de grammaire) ne ressorte toujours avec la même phrase/les mêmes distracteurs — risque de pattern-matching identifié en audit (2026-07-01, comparaison Wagotabi : "les joueurs finissent par mémoriser des patterns plutôt que le sens"). Relu une fois par l'équipe de contenu, jamais régénéré au runtime.
15. **Contenu hand-written** : `/content/map/trainers.json` (depuis guidebook Prima), `/content/map/npcs.json`, `/content/dialogues/fukuda/`, `/content/curriculum-checkpoints.md`
16. **Manifest dresseurs** : `/content/map/trainers.json` — chaque entrée : `{ trainer_id, zone_id, tile_x, tile_y, facing, sight_range, role, kanji_pool[], battle_length, name }`

**Principe directeur (2026-07-01) :** aucune fonction ne génère de contenu japonais au runtime, qu'elle soit basée sur de l'IA ou sur une règle déterministe (conjugaison incluse). Tout le contenu linguistique est généré ou téléchargé **avant le lancement du jeu**, une fois, puis stocké (fichiers locaux embarqués ou base cloud Supabase — arbitrage de stockage à trancher plus tard). Le client/serveur ne fait au runtime que lire, sélectionner et mélanger des données déjà là (ex. `getDispositionChunks` mélange des `chunks[]` déjà tokenisés, il n'en génère aucun).

### Sources de Contenu

| Source                | Licence              | Usage                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guidebook Prima HGSS (Johto + Kanto) | Référence uniquement | Positions dresseurs, rôles NPC, ordre des zones. Dépouillement exhaustif (rosters de dresseurs, inventaire PNJ complet par zone, bios officielles) dans `content/guidebook-adapted.md` ; le volume Johto local ne couvre pas Mont Gris/Red, mais le guide Kanto (`kanto-guide-fulltext.txt`, ajouté après la première rédaction de cette note) le couvre bien — complété en appoint par recherche web, voir le fichier pour le détail et les sources externes utilisées. |
| Kanjidic2             | CC BY-SA 3.0         | Données kanji                                                                                                                                                                                                                                                                                                                          |
| KanjiVG               | CC BY-SA 3.0         | Ordre des traits, composants                                                                                                                                                                                                                                                                                                           |
| JMdict Extended       | CC BY-SA 3.0         | Vocabulaire                                                                                                                                                                                                                                                                                                                            |
| Yomitan JLPT vocab    | CC BY-SA 4.0         | Niveaux JLPT des mots                                                                                                                                                                                                                                                                                                                  |
| Tatoeba               | CC BY 2.0 FR         | Paires de phrases (registre neutre)                                                                                                                                                                                                                                                                                                    |
| JESC                  | CC0                  | Paires de phrases (registre parlé)                                                                                                                                                                                                                                                                                                     |
| Hanabira.org          | CC                   | Corpus grammatical (828 points)                                                                                                                                                                                                                                                                                                        |
| Aozora Bunko          | Domaine public       | Textes littéraires — réservés aux moments narratifs archaïques (voir `content/texts-progressifs.md`) |
| Tadoku graded readers | CC BY-NC-ND 4.0 (usage app privée, non publiée — voir note) | Textes de lecture graduée, niveaux bas |
| Watanoc               | Usage app privée, non publiée | Articles réels N5/N4, audio + dictionnaire pop-up |
| NHK Web Easy          | Usage app privée, non publiée (licence de réutilisation non confirmée) | Textes de japonais contemporain N3-N2 |
| Matcha Easy Japanese  | Usage app privée, non publiée | Articles voyage/culture, furigana systématique, N3-N2 |
| OST HGSS              | Usage personnel      | Musique de fond                                                                                                                                                                                                                                                                                                                        |
| The Spriters Resource | Fan use              | Sprites                                                                                                                                                                                                                                                                                                                                |
| kuromoji              | Apache 2.0           | Analyse morphologique japonaise                                                                                                                                                                                                                                                                                                        |

### Audio

**Source audio :** `public/audio/gs_sound_data.sdat` (8.3MB, ROM file 479). Export OGG via Nitro Studio 2. Voir `public/audio/README.md`.

| Contexte                       | Piste                     |
| ------------------------------ | ------------------------- |
| Carte (zones initiales)        | New Bark Town             |
| Carte (zones intermédiaires)   | Route 29                  |
| Carte (zones avancées)         | Route Victoire            |
| Session SRS                    | Thème Centre Pokémon      |
| Leçon (écran livre dédié, mini-quiz inclus) | Rotation de 6 pistes calmes libres de droits (CC-BY/no-copyright, koto/shakuhachi — 2026-07-02, sourcées Pixabay + free-stock-music.com, pas de composition originale nécessaire), pour éviter la lassitude sur une piste unique répétée des dizaines d'heures. Candidats identifiés : "Japanese Relaxing Koto", "Japan Koto Folk Background Music", "In the place far away", "Japanese Shakuhachi Flute - Zen" (Pixabay) + 2 à sélectionner dans la collection Japanese de free-stock-music.com (CC-BY 3.0) |
| Combat dresseur de route       | Thème Dresseur            |
| Combat 門弟                    | Thème Dresseur            |
| Combat 師範                    | Thème Chef d'Arène        |
| Cérémonie badge                | Fanfare victoire          |
| Combat Silver                  | Thème Rival               |
| Combat Rocket                  | Thème Rocket              |
| Combat Kimono Girl             | Rosalia ambient (ralenti) |
| Combat légendaire de grammaire | Thème Pokémon Légendaire  |
| Combat Elite Four              | Thème Elite Four          |
| Combat Lance                   | Thème Lance/Red           |
| Combat Red                     | Silence                   |
| Lecture de textes              | Rosalia ambient           |
| Achievement débloqué           | Fanfare courte            |

---

## Curriculum Checkpoints (résumé)

Détail complet dans `content/curriculum-checkpoints.md` (72 zones depuis l'ajout de Kanto — 49 Johto/Mont Gris + 8 villes Kanto + 14 routes/donjons Kanto (2026-07-02, "vrai jeu, comme un émulateur") + 1 donjon postgame optionnel (Grotte Azuria) —, table de calibration complète +
inventaire PNJ sourcé par zone). ⚠️ **Table resynchronisée (2026-06-30)** — plusieurs valeurs avaient
dérivé par rapport au fichier détaillé (kanji counts et niveaux grammaticaux légèrement différents).
Corrigée ci-dessous pour reprendre le début de la fourchette de chaque zone telle que définie dans
`content/curriculum-checkpoints.md`.

| Ville           | Kanji connus | Niveau grammaire | Structures clés                                  |
| --------------- | ------------ | ---------------- | ------------------------------------------------ |
| Ville Griotte | 30           | N5 intro         | は/が/を/に/で, ます/です                        |
| Mauville         | 80           | N5/N4            | て-form, たいです, に行きます                    |
| Ecorcia        | 160          | N4               | てもいいですか, 〜ために, 〜かもしれない         |
| Doublonville     | 240          | N4               | てもらえますか, 〜ながら, 〜ことにしている       |
| Rosalia         | 350          | N3               | おかげで, 〜うちに, 〜らしい                     |
| Oliville     | 440          | N3               | てほしいのですが, 〜ことになっている, 〜しかない |
| Acajou Ville    | 530          | N3/N2            | はずだ, 〜にすぎない, 〜ものだ intro             |
| Ebènelle  | 600          | N2               | ものの, 〜にもかかわらず, 〜ことなく             |
| Plateau Indigo  | 800          | N2/N1            | N2 complet + introduction N1                     |
| Vermeille City (Kanto, Lt. Surge) | 900 | N2 | Entrée dans l'arc Kanto — porte 900→2136 ; grammaire N2 jusqu'à 1500, N2/N1 jusqu'à 1670, N1 ensuite (remappé 2026-07-05) — voir § Kanto |
| Vertville (Kanto, Blue, dernier gym) | 2100 | N1 | Dernier palier avant Mont Gris — 16e badge, sur revisite (corrigé 2026-07-05, audit 01) |
| Mont Gris / Red | 2136         | N1               | Plateau bonus : les 2136 kanji sont tous étudiés en fin d'arc Kanto ; Mont Gris = révision, leçons poussées, textes N1 difficiles (corrigé 2026-07-05, audit 01 — remplace « Corpus Hanabira N1 complet », promesse intenable : 245 points N1 pour ~180 slots de leçon) |
