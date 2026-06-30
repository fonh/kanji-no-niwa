# PRD2 — 漢字の庭 (Kanji no Niwa)

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

## Interface — Émulateur DS

L'app ressemble et se comporte comme un émulateur DS sur mobile :

- **Carte plein écran** — pas de coque DS visible
- **Contrôles semi-transparents en overlay** :
  - Bas gauche : D-pad
  - Bas droite : boutons A / B
  - Centre bas : START (menu principal) + SELECT (Pokégear) — petits, discrets

L'esthétique DS vit dans les **menus, boîtes de dialogue, écrans de combat** — pas dans le boîtier physique. Police, bordures, sons, animations de transition : tout correspond à HGSS.

> **Assets extraits :** bordures dialogue → `public/sprites/ui/dialogue/`, transition combat → `public/sprites/ui/battle/transition/`, écran VS → `public/sprites/ui/battle/vs_screen/`. Police DS non extractable (intégrée ARM9 — utiliser une police pixel approchante, ex. `Pokémon Classic` ou `Press Start 2P`).

### Menu Principal (START)

Overlay identique au menu HGSS :

| Slot | Nom | Contenu |
|---|---|---|
| 1 | 図鑑 | Encyclopédie kanji |
| 2 | Leçons | Batch de leçons actif + historique |
| 3 | Sac | Objets collectés (Apricorns, CS-Kanji, objets de quête) |
| 4 | Profil | Badges, stats, achievements, textes lus |
| 5 | Options | Paramètres |

### Pokégear (SELECT)

Quatre onglets, structure identique à HGSS :

| Onglet | Contenu |
|---|---|
| Téléphone | Appeler Fukuda (lancer le SRS) + messages des dresseurs |
| Carte | Carte Johto complète, vue globale |
| Radio | Émissions d'Oak, radio d'ambiance |
| Textes | Bibliothèque de trophées de lecture |

---

## Boucle Quotidienne

1. **Premier lancement du jour** → Fukuda appelle via le Pokégear. Son sprite apparaît. "Tes révisions t'attendent." → tap pour lancer le SRS, ou refuser.
2. **Si refusé** → Fukuda laisse un message. Le joueur doit le rappeler (Pokégear → Téléphone → Fukuda) pour lancer le SRS. Aussi accessible directement depuis Pokégear → Téléphone.
3. **Session SRS** → file de cartes (kanji + vocabulaire, FSRS). Interface simple : carte affichée, bouton Révéler, 4 notes FSRS (Encore / Difficile / Bien / Facile).
4. **SRS terminé** → badge ✓ sur l'icône Pokégear. Fukuda envoie un court message. La carte est entièrement accessible.
5. **SRS non fait** → le joueur peut parcourir les zones déjà visitées, combattre des dresseurs, faire des leçons. Entrer dans une **nouvelle zone** (route ou ville non encore visitée) est bloqué : un message apparaît — *"Il faudrait réviser avant d'aller plus loin."*
6. **Aucune carte due** → l'appel de Fukuda est court : "Tout est en ordre." ✓ apparaît immédiatement.

---

## La Carte de Johto

La carte est sourcée directement depuis le guidebook Prima HGSS. Chaque route, bâtiment et NPC est fidèle au jeu original.

**Ordre des zones** suit la progression recommandée par HGSS :
Bourg-en-Vol → Route 29 → Bourg-en-Côteau → Routes 30–31 → Cramola → Tour Grospignon → Route 32 → Ruines Arcaniques → Route 33 → Safrania → Puits Ramoloss → Forêt Secte → Route 34 → Dorado City → Routes 35–37 → Parc National → Ecorosa → Tour Embrasée → Routes 38–39 → Amaris City → Route 40 → Orsay City → Routes 41–42 → Mont Mortier → Acajou Ville → Lac Colère → Route 44 → Chemin Glacé → Saupoudreville → Antre du Dragon → Routes 45–27 → Route Victoire → Plateau Indigo → Mont Gris

**Affichage de la carte :**
- Zones visitées : couleur pleine
- Zones non visitées : grisées (accessibles, vides)
- Portes de Gym : icône cadenas si conditions non remplies
- Marqueurs de quête : ◎ sur la cible active
- Sprites des dresseurs à positions fixes (guidebook). Non battu = debout, alerte. Battu = assis, passif.

**Mouvement de l'avatar :**
- D-pad : un tile par input
- Bouton A : interagir avec NPC, dresseur ou bâtiment adjacent
- Bouton B : fermer le dialogue
- Pas de tap-to-move. Pas de pathfinding.

**CS-Kanji** — capacités de carte débloquées par la maîtrise :

| Kanji | Maîtrisé | Débloque |
|---|---|---|
| 飛 | maîtrisé | Voyage rapide — tap sur n'importe quelle ville visitée pour s'y téléporter |
| 水 | maîtrisé | Routes maritimes (Routes 40–41) et traversées de rivière |
| 力 | maîtrisé | Déplacer les rochers sur les routes de montagne |

---

## Dresseurs de Route — Rôles Fixes

Chaque dresseur sur chaque route a un rôle fixe sourcé du guidebook :
- **Dresseurs combat** : t'affrontent quand tu entres dans leur champ de vision (combat 3 vies)
- **Dresseurs leçon** : dialogue s'ouvre quand tu les approches, ils enseignent un concept de japonais

Les dresseurs qui donnent des objets ou des informations dans HGSS deviennent des dresseurs-leçon dans 漢字の庭. La distinction est définie à la création du contenu, pas choisie par le joueur.

**Types de dresseurs et thèmes kanji :**

| Type | Thème kanji |
|---|---|
| Gamin (Youngster) | Kanji quotidiens courants N5 |
| Attrapeur (Bug Catcher) | Nature, petites créatures |
| Fillette (Lass) | Vie quotidienne, personnes |
| Randonneur (Hiker) | Terre, terrain, force |
| Pêcheur (Fisherman) | Eau, saisons, nature |
| Marin (Sailor) | Voyage, direction, mer |
| Dresseur d'Oiseaux (Bird Keeper) | Ciel, vol, liberté |
| Cracheur de Feu (Firebreather) | Feu, énergie, danger |
| Jongleur (Juggler) | Art, technique, performance |
| Dresseur Ace (Ace Trainer) | Tier JLPT de la zone, N3+ |

**Classes additionnelles disponibles** : le dépouillement exhaustif du guidebook a révélé davantage de
classes de dresseurs dans le jeu d'origine que les 10 ci-dessus (Camper, Picnicker, Pokéfan, Beauty,
School Kid, Psychic, Black Belt, Sage, Medium, Skier/Boarder, Swimmer, Scientist, Poké Maniac, Super
Nerd, Gentleman, Twins). Non requises pour le scope v1, mais documentées avec thèmes kanji proposés
dans `content/guidebook-adapted.md` § "Classes de dresseurs additionnelles" si l'équipe contenu veut
enrichir la variété au-delà des 10 classes de base.

**Vision et rencontre :**
- Chaque dresseur a `facing` et `sight_range` (2–4 tiles) du guidebook
- Entrer dans le champ de vision → le dresseur se retourne → "!" → mouvement bloqué → combat ou leçon
- Après défaite/leçon : dresseur assis, ne se déclenche plus jamais automatiquement
- Toutes les positions dans `/content/map/trainers.json`, sourcées du guidebook Prima HGSS

---

## Système de Combat — 3 Vies

### Déclenchement

Intro identique à HGSS : transition diagonale, sprite du dresseur qui arrive par la gauche, jingle de combat, phrase d'accroche dans une boîte de dialogue. Puis première question.

> **Assets extraits :** layers transition → `public/sprites/ui/battle/transition/` (9 PNG), écran VS → `public/sprites/ui/battle/vs_screen/` (13 PNG), sprite dresseur → `public/sprites/trainers/battle/battle_NNN.png`, sprite dos joueur → `public/sprites/characters/player_back/`.

### Structure

- **3 Poké Balls** affichées en haut à droite = tes 3 vies → `public/sprites/items/pokeballs/pokeball.png` (24×24, 4× = 96×96 disponible)
- Chaque mauvaise réponse brise une Poké Ball
- 3 balls brisées = défaite. Rejouer immédiatement, sans cooldown.
- Les bonnes réponses réduisent la barre de HP de l'adversaire (visuel uniquement)
- Répondre à toutes les questions avec ≤ 2 erreurs = victoire

### Les 8 Modes de Question

Mélangés aléatoirement à l'intérieur de chaque combat :

| Mode | Prompt | Réponse | Ce que ça teste |
|---|---|---|---|
| **Sens** | Kanji affiché en grand | 4 significations en français | Reconnaissance de sens |
| **Lecture** | Kanji affiché en grand | 4 lectures hiragana | Reconnaissance phonétique |
| **Écriture** | Signification en français affichée | Grille de tiles kana — compose la lecture | Production active |
| **Composition** | 4 tiles kanji | Glisser-déposer pour former un mot valide | Formation de composés |
| **Grammaire** | Phrase avec un trou grammatical | 4 formes grammaticales (corpus Hanabira) | Grammaire en contexte |
| **Conjugaison** | Verbe + contexte | 4 formes conjuguées | Production verbale |
| **Traduction** | Phrase japonaise (Tatoeba) | 4 sens en français | Compréhension de phrase |
| **Disposition** | Sens en français affiché | 6–8 chunks japonais à remettre en ordre | Production de phrase complète |

**Disposition** utilise des phrases Tatoeba pré-tokenisées avec kuromoji au build time. Les chunks sont stockés comme `chunks[]` en base. Le client mélange et valide par comparaison de séquence de `surface_form`. Aucune tokenisation à runtime.

**Pool de grammaire** (Grammaire + Conjugaison) : pioche uniquement dans les points de grammaire que le joueur a **déjà rencontrés** en dialogue NPC, leçon ou texte (tracké dans la table `grammar_encounters`). Fallback au tier inférieur si moins de 5 points disponibles au tier cible.

**Critical Hit** : bonne réponse en moins de 3 secondes → flash "Critical Hit!", double dégâts sur la barre adversaire.

**Combo** : 3 bonnes réponses consécutives ou plus → compteur combo visible.

**Longueurs de combat** : dresseurs de route 5–8 questions, 門弟 10, 師範 20, Silver/Exécutifs Rocket 15, Elite Four 30, Lance 35, Red 50.

**Profils de poids par type de combat :**

| Mode | Route (5–8 questions) | Boss (≥ 10 questions) |
|---|---|---|
| Sens | 28 % | 12 % |
| Lecture | 22 % | 12 % |
| Écriture | 18 % | 10 % |
| Composition | 10 % | 5 % |
| Grammaire | 7 % | 13 % |
| Conjugaison | 7 % | 13 % |
| Traduction | 3 % | 5 % |
| **Disposition** | **5 %** | **30 %** |

Boss = 門弟, 師範, Silver, Exécutifs Rocket, Kimono Girls, Légendaires, Elite Four, Lance, Red.

Modes indisponibles : si `encounteredGrammarCount < 5`, Grammaire et Conjugaison sont exclus ; si aucune phrase Disposition éligible (`kanji_ids ⊆ studiedSet` et `chunks` non vide), Disposition est exclue. Le poids des modes exclus est redistribué proportionnellement aux modes restants. La redistribution s'effectue à chaque tirage individuel (pas en début de combat).

---

## Leçons

Les leçons sont dispensées par des dresseurs-leçon (rôle fixe) et par des NPCs dans les villes et bâtiments. Les interactions NPC et quêtes secondaires du guidebook deviennent des moments de leçon.

**Exemples directs depuis le guidebook :**

| Événement guidebook | Leçon dans 漢字の庭 |
|---|---|
| Pêcheur sur Route 32 donne la Vieille Canne | Kanji de l'eau + vocabulaire de la pêche |
| Randonneur sur Route 42 donne CT Force | 力/強/体 + forme potentielle |
| Kimono Girl perdue dans Forêt Secte | Grammaire directionnelle (〜ていく/〜てくる) en guise de remerciement |
| Kurt à Safrania fabrique tes Poké Balls | Kanji de l'artisanat pendant qu'il travaille |
| Directeur de la Tour Radio après sa libération | Registre formel du japonais |
| Inscription de l'Antre du Dragon | Défi de traduction N2/N1 |

**Format de leçon** : sprite NPC + boîte de dialogue. Texte en japonais calibré au tier de la zone. Segments pédagogiques tapables. Quiz court de 2–3 questions à la fin. La grammaire et la conjugaison ne rejoignent pas le SRS — elles sont apprises par les rencontres.

**Nouveaux kanji et vocabulaire** appris dans les leçons rejoignent la file SRS pour la session du lendemain matin.

---

## Système SRS

Algorithme FSRS (`ts-fsrs`). Deux types de cartes :
- **Cartes kanji** : 2 cartes par kanji (sens + lecture), indépendantes
- **Cartes vocabulaire** : 2 cartes par mot (sens + lecture), indépendantes

Session SRS : esthétique Centre Pokémon, musique calme. Carte affichée → Révéler → 4 notes (Encore/Difficile/Bien/Facile). Session terminée quand la file est vide.

**Maîtrise** : un kanji ou mot est "maîtrisé" quand ses deux cartes ont une stabilité FSRS ≥ 30 jours.

**Déblocage de vocabulaire** : quand un kanji atteint la maîtrise, les mots JLPT éligibles rejoignent la file SRS. Plafond journalier = 2× la limite de leçons kanji du jour.

**La grammaire n'est PAS dans le SRS.** Elle est apprise par les combats et les leçons, renforcée par les rencontres en contexte sur la carte.

---

## Textes Progressifs — Trophées de Lecture

Les textes de lecture sont déclenchés par des événements de la carte. Chaque texte est un trophée collectionnable, stocké dans Pokégear → Textes.

**Flux de lecture** : trouver le texte sur la carte (parchemin, lettre, panneau, inscription) → interface de lecture plein écran avec furigana adaptatif → questions de compréhension (3–5 QCM, pré-écrits) → trophée acquis → stocké dans la bibliothèque.

**Furigana adaptatif** : affiché sur tous les kanji pas encore dans la liste étudiée du joueur, calculé côté client.

**Progression des textes liée aux événements du jeu :**

| Événement | Texte | Longueur | Niveau |
|---|---|---|---|
| Route 29, premier NPC | Note d'un voyageur | 30 caractères | N5 hiragana |
| Après Gym 1 (Falkner) | Lettre de l'Ancien de Tour Grospignon | 80 caractères | N5 |
| Puits Ramoloss (Rocket) | Mémo saisi sur un grunt | 150 caractères | N4 |
| Après Gym 3 (Whitney) | Article du Dorado Daily | 250 caractères | N4 |
| Tour Embrasée | Journal d'un dresseur | 400 caractères | N3 |
| Tour Radio Rocket | Transmission interceptée | 500 caractères | N3/N2 |
| Antre du Dragon | Texte ancien | 800 caractères | N2/N1 |
| Face à Red | Chapitre de manga + lettre de Fukuda | 2000+ caractères | N1, sans furigana |

**Sources** : Aozora Bunko (déjà dans le projet), Tadoku graded readers (CC license, tadoku.org), NHK Web Easy, textes générés par IA pour les premiers niveaux, chapitre de manga illustré original créé pour Red.

**Questions de compréhension** : 3–5 QCM par texte, pré-écrits à la création du contenu. Seuil de réussite : 60% pour le trophée, 80% pour le badge complet.

---

## Arc Narratif

### Curriculum-Checkpoints

Document interne `content/curriculum-checkpoints.md` — non visible par le joueur. Définit ce que le joueur **doit savoir** avant d'entrer dans chaque ville. Les routes et NPCs avant chaque ville sont designés pour couvrir exactement ces prérequis.

Exemple :
> **Avant Cramola (Violet City)** : 80 kanji N5/N4, formes ます/です, て-form, particules は/が/を/に/で/へ, lecture d'un dialogue simple.

Voir `content/curriculum-checkpoints.md` pour le détail complet de chaque ville, ainsi que pour la
table "PNJ sourcés par zone" qui associe à chaque zone des personnages réels du jeu d'origine (Kurt,
Bill, Jasmine, Magnus, les Kimono Girls, etc.) à utiliser comme porte-voix du japonais calibré plutôt
que des PNJ génériques.

### Silver — 6 Rencontres (Positions HGSS Fidèles)

| # | Lieu | Contexte guidebook | Ses 6 kanji |
|---|---|---|---|
| 1 | Bourg-en-Côteau (retour du chemin) | Premier combat — condescendant | 怒、争、力、敵、速、逃 |
| 2 | Safrania, porte ouest (avant Forêt Secte) | Bloque le passage | 強、越、勝、誇、傲、鋼 |
| 3 | Tour Embrasée (haut de l'échelle) | Embuscade | 影、闇、忘、去、断、孤 |
| 4 | QG Rocket B2F (Acajou) | ⚠️ Pas un combat dans le jeu d'origine — Silver est déjà vaincu par Lance, simple cameo frustré ("pas assez d'affection pour ses compagnons") | 変、知、疑、惜、寂、遅 |
| 5 | Tunnel de Dorado B2F | Grille ton déguisement à la Tour Radio, puis combat réel au Tunnel pendant la chasse à la Carte-clé | 悔、認、謝、恥、赦、和 |
| 6 | Route Victoire | Dernier combat avant la Ligue — le jeu vide volontairement la route de tout autre dresseur pour ce face-à-face | 静、空、終、別、礼、去 |

*(Sourcé et confirmé par `content/guidebook-adapted.md` — corrige le lieu #5, anciennement "Tour Radio B2F (Dorado)" : le combat réel a lieu au Tunnel de Dorado, la Tour Radio n'est que le lieu où le déguisement est démasqué. Niveau de langue calibré par apparition : voir `content/curriculum-checkpoints.md` § Règle de Silver — corrigée pour s'aligner sur cette table après une incohérence détectée entre les deux documents.)*

### Team Rocket — 3 Lieux (Fidèles au Jeu)

**1. Puits Ramoloss (Safrania)**
- Exécutif : Proton
- Kanji du combat : 捕、縛、操、支、制
- Gate : bloque l'accès au Gym de Bugsy jusqu'à résolution

**2. QG Rocket (Acajou) + Lac Colère**
- Exécutif : Ariana (double combat avec Lance)
- Silver rencontré sur B2F (battu par Lance, pas de combat avec le joueur)
- Kanji du combat : 欺、偽、惑、騙、詐
- Gate : bloque le Gym de Pryce jusqu'à résolution

**3. Tour Radio (Dorado City)**
- ⚠️ **Ordre corrigé (sourcé)** : le 1F est gardé par un Sbire (déguisement requis pour passer) ; Silver grille le déguisement en chemin vers le 2F (scène, pas de combat ici) ; 3F verrouillé jusqu'à la Carte-clé ; 5F = **Petrel déguisé en Directeur** (1er combat, sa défaite donne la clé du sous-sol) → détour Tunnel de Dorado B2F (vrai Directeur captif, **combat réel contre Silver** — apparition #5, voir table ci-dessus, donne la Carte-clé) → retour Tour Radio 3F avec la Carte-clé : **Proton** → re-**Petrel** (déguisé, 2e combat) → plateforme d'observation : **Ariana** → **Archer** (final, révèle l'objectif = rappeler Giovanni). Soit dans l'ordre des combats : **Petrel → Proton → Petrel → Ariana → Archer**, et non "Proton → Ariana → Petrel → Archer" comme indiqué dans une version antérieure de ce PRD.
- Gauntlet 5 étages + détour Tunnel de Dorado
- Kanji du combat : 権、力、命、令、報
- Gate : radio nationale bloquée jusqu'à résolution
- Détail complet et sourcé : `content/guidebook-adapted.md` § goldenrod-city.

### Kimono Girls — 5 Rencontres (Fidèles au Jeu)

⚠️ **Table corrigée (2026-06-30)** — la version précédente ne nommait aucune Kimono Girl et plaçait
la 4e à un mauvais endroit ("sortie du QG Rocket" n'existe pas dans le jeu d'origine — elle est
rencontrée à Dorado City, pas à Acajou). Noms et lieux ci-dessous confirmés par dépouillement complet
du guidebook (`content/guidebook-adapted.md` § "Kimono Girls — Noms et lieux sourcés"), recoupés deux
fois (OCR + texte natif du PDF) :

| # | Nom | Lieu | Moment guidebook (texte source) | Leçon de japonais |
|---|---|---|---|---|
| 1 | **Zuki** | Cramola (Violet City), devant le Mart | Apparaît juste après que le joueur récupère l'œuf mystère ; "semblait inquiète pour l'œuf" | Introduction à la lecture N5 |
| 2 | **Naoko** | Forêt Secte (Ilex Forest) | Perdue, aucun sens de l'orientation — le compagnon du joueur lui montre la sortie | Grammaire directionnelle (〜ていく/〜てくる) |
| 3 | **Miki** | Ecorosa Dance Theater (Ecruteak) | Harcelée par un Sbire Rocket — le joueur la sauve en combat ; "impressionnée que tu aies battu la Team Rocket" | N3 grammaire, registre formel |
| 4 | **Kuni** | Tunnel de Dorado (Goldenrod Tunnel), après la clé de sous-sol | "Te respecte d'avoir affronté la Team Rocket" ; laisse échapper une allusion à un esprit légendaire | Expressions de gratitude (感謝) |
| 5 | **Sayo** | Chemin Glacé (Ice Path), près de la sortie | Sandales coincées sur une plaque de glace — le joueur la pousse par derrière pour la libérer ; moment volontairement comique | Combat de compréhension N2 |

**Événement collectif (post-Master Ball)** : les 5 Kimono Girls se réunissent à l'Ecorosa Dance Theater
pour un gauntlet — un combat chacune, un seul compagnon par combat, "test du lien avec ton équipe".
Victoire → Clear Bell/Tidal Bell, condition requise pour faire apparaître l'esprit légendaire au sommet
de Tour Jo (Bell Tower) — où les 5 girls exécutent une danse rituelle qui fait résonner la cloche et
attire l'esprit. Trophée de texte légendaire débloqué à cette occasion.

*(Note : la 4e rencontre dans l'ordre de la table récap du guidebook lui-même liste Kuni en position 4
malgré une rencontre chronologique réelle légèrement différente selon le chemin emprunté — la
numérotation #1–5 ci-dessus suit l'ordre canonique du guidebook, pas nécessairement l'ordre strict de
visite du joueur, qui peut varier selon le chemin Acajou/Amaris choisi en premier.)*

### Légendaires — Boss de Grammaire

Raikou, Entei, Suicune s'échappent de la Tour Embrasée après la 3ème bataille avec Silver. Ils rodent dans Johto. Chacun représente un domaine grammatical avancé à "chasser" en maîtrisant suffisamment de grammaire dans ce domaine.

*(✅ Confirmé par le guidebook : à l'arrivée dans la tour, le joueur aperçoit les trois esprits par un
trou dans le sol ; Silver ambush au sommet de l'échelle menant au sous-sol (apparition #3 — voir table
Silver ci-dessus) ; en approchant ensuite au sous-sol, les trois prennent la fuite et deviennent des
présences mobiles trackées sur la carte — séquence et ordre des événements fidèles à l'original.)*

| Légendaire | Domaine grammatical | Condition d'apparition |
|---|---|---|
| Raikou (Tonnerre) | Conjonctions N2 (〜ものの、〜にもかかわらず) | 15 points de grammaire N2 rencontrés |
| Entei (Feu) | Expressions N1 (〜だけに、〜にほかならない) | 10 points de grammaire N1 rencontrés |
| Suicune (Eau) | Registre classique (〜ものだ littéraire, 〜うが〜うが) | Trophée Antre du Dragon complété |

Chaque rencontre légendaire = combat de 10 questions tiré de son domaine grammatical. Victoire = trophée de grammaire rare dans la bibliothèque + lettre de Fukuda.

---

## Système 道場 — Gyms comme Jalons Curriculaires

Chaque gym = un jalon de langue japonaise. Y entrer nécessite de satisfaire les prérequis curriculaires. Battre le 師範 prouve que le joueur a atteint ce niveau.

**Structure** : 2 門弟 (gardes, 10 questions chacun) → combat du 師範 (20 questions).

**Seuils et gates curriculaires :**

| 師範 | Thème kanji | Gate primaire | Gate curriculaire |
|---|---|---|---|
| Falkner | 空 — ciel/vol | 80 kanji étudiés | N5 grammaire complète, 1 texte lu |
| Bugsy | 虫 — nature | 150 kanji étudiés | Puits Ramoloss libéré |
| Whitney | 常 — quotidien | 250 kanji étudiés | N4 grammaire phase 1, 3 quêtes NPC |
| Morty | 影 — ombre/esprit | 370 kanji étudiés | N4 grammaire complète, Tour Embrasée visitée |
| Chuck | 力 — force | 500 kanji étudiés | N3 grammaire phase 1, QG Rocket commencé |
| Jasmine | 鋼 — acier | 600 kanji étudiés | N3 grammaire complète |
| Pryce | 氷 — glace | 750 kanji étudiés | QG Rocket libéré, N2 grammaire phase 1 |
| Clair | 竜 — dragon | 900 kanji étudiés | N2 grammaire complète, 4/5 Kimono Girls battues |

**📍 Note sourcée — Clair/Antre du Dragon (à arbitrer) :** dans le jeu d'origine, **battre Clair ne donne
pas directement le badge** : elle envoie le joueur à l'Antre du Dragon "faire ses preuves" auprès du
Maître, qui le soumet à un quiz en 5 questions axé sur l'empathie ("si j'étais à la place de l'autre,
que ressentirais-je ?") avant que Clair (surprise, "elle ne s'attendait même pas à ce que tu réussisses")
ne remette le 印 final. Le combat de Gym n'est qu'une porte d'entrée, pas le juge. C'est un ressort
dramatique fort, absent du système 道場 actuel (qui traite tous les gyms de façon uniforme) —
recommandation de `content/guidebook-adapted.md` § dragons-den : envisager de faire de l'épreuve de
l'Antre du Dragon (déjà prévue comme "Quiz de traduction N1" dans la section Leçons ci-dessus) la
condition réelle d'obtention du 印 n°8, Clair n'étant que la gardienne de l'entrée. Décision de design
à trancher par l'équipe — non appliquée automatiquement ici.

**Gate Plateau Indigo** : 8 badges + événement collectif Kimono Girls terminé.

**Elite Four → Lance → Red** : séquence de combats escaladants, chaque étape nécessitant la précédente. Red nécessite : 8 badges + Elite Four terminé + Lance terminé + trophée Antre du Dragon + 5 Kimono Girls battues + 2136 kanji étudiés.

**Combat Red** : 50 questions, sans chrono. Le chapitre de manga est lu **avant** le combat (score ≥ 80% en compréhension requis pour débloquer le combat lui-même).

**📍 Note sourcée (recherche web, Mont Gris n'étant pas couvert par le guidebook Johto local — voir
`content/guidebook-adapted.md` § mt-silver-summit) :** dans le jeu d'origine, Red engage directement
sans la moindre ligne de dialogue ; une tempête de neige/grêle se déclenche automatiquement au début du
combat (bon élément d'ambiance transposable en effet visuel/sonore continu pendant les 50 questions).
Après la défaite : *"Red marque une pause, silencieux et figé. Puis, en un clin d'œil, il disparaît."*
— aucune ligne de texte, juste un geste. Confirme et précise le traitement "Red nod uniquement" déjà
prévu : si un seul signe doit sortir de Red, ce devrait être un geste, jamais une phrase.

**Thèmes kanji par 師範 :**

| 師範 | Pool kanji |
|---|---|
| Falkner | 空、風、鳥、飛、雲 et apparentés |
| Bugsy | 虫、小、走、細、草 et apparentés |
| Whitney | Kanji N5–N4 les plus fréquents |
| Morty | 夜、暗、霊、死、消 et apparentés |
| Chuck | 力、体、強、戦、押 et apparentés |
| Jasmine | 金、鉄、石、固、重 et apparentés |
| Pryce | 冷、水、冬、凍、白 et apparentés |
| Clair | 竜、王、空、力、古 et apparentés |

---

## Sensei Fukuda

Fukuda n'est pas un enseignant. Il est le narrateur de ta progression et un philosophe de l'apprentissage des langues.

Il écrit **après les grands événements** :
- Chaque badge de gym gagné (8 lettres)
- Chaque bataille avec Silver (6 lettres)
- Chaque lieu Rocket libéré (3 lettres)
- Chaque Kimono Girl battue (5 lettres)
- Chaque légendaire de grammaire vaincu (3 lettres)
- Antichambre terminée, Lance battu, Red vaincu

**Évolution de son ton :**
- **Début de partie** : mesuré, observateur — remarque ta progression sans la commenter
- **Milieu de partie** : plus chaleureux, plus personnel — commence à parler de pourquoi le japonais compte au-delà de la technique
- **Fin de partie** : philosophique, silencieux — ses lettres parlent du lien entre la langue et l'identité

**La lettre finale de Fukuda** (après Red) : écrite entièrement en japonais, sans traduction. C'est l'épreuve réelle — la lettre EST l'aboutissement du combat contre Red.

Tous les messages de Fukuda stockés dans `/content/dialogues/fukuda/` en markdown, indexés par `trigger_type` et `trigger_ref`. Aucune génération à runtime.

---

## 図鑑 — Encyclopédie Kanji

Accessible depuis START → 図鑑, et en tapant n'importe quel kanji dans n'importe quel contexte.

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

Accessible en tapant n'importe quel mot dans la 図鑑, un texte, une leçon ou un combat.

Chaque fiche mot affiche :
- Mot en kanji + lecture kana
- Partie du discours, sens en français
- Patron d'accent de hauteur (高低, ex. LH・HLL) si disponible
- Compound story — 1–2 phrases expliquant comment les kanji composants se combinent
- Chaque kanji du mot cliquable vers sa fiche 図鑑
- Niveau JLPT et statut SRS (en file, dû, maîtrisé, non débloqué)
- 3 exemples de phrases (registres variés : neutre, formel, familier)
- Kanji encore à maîtriser avant que ce mot rejoigne le SRS (si non encore débloqué)

---

## Obstacles-Puzzles

*À rédiger — contenu hand-written.*

Trois obstacles sur la carte sourcés du guidebook, débloqués par les CS-Kanji :
- **Sudowoodo (Route 36)** — déblocage par 水
- **Ronflex (Route 27, frontière Johto/Kanto)** — frontière fermée v1, interaction narrative
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
- Badges de Gym : chacun des 8 + Plateau Indigo + Lance + Red
- Textes : 1er texte lu, 10 textes, tous les textes
- Silver : battu les 6 fois
- Team Rocket : les 3 lieux libérés
- Kimono Girls : les 5 battues
- Légendaires : les 3 vaincus
- Streak : 7, 30, 100, 365 jours
- CS-Kanji : les 3 maîtrisés (飛、水、力)
- Red perfect : 100% de précision sur 50 questions

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

| Table | Contenu |
|---|---|
| `kanji` | character, meanings, readings, etymology, mnemonic, jlpt_level |
| `words` | word, reading, jlpt_level, compound_story, pitch_accent |
| `grammar` | title, formation, examples, jlpt_level (source Hanabira) |
| `sentences` | jp_text, en_text, chunks[], register, kanji_set[] (Tatoeba + JESC) |
| `lessons` | zone_id, content, lesson_type, trainer_ref ou npc_ref |
| `texts` | jp_text, en_text, questions[], level, source, event_ref, length_chars |
| `map_trainers` | trainer_id, zone_id, tile_x, tile_y, facing, sight_range, role (battle/lesson), trainer_type, kanji_pool[], battle_length, name |
| `map_npcs` | npc_id, zone_id, tile_x, tile_y, min_kanji_studied, dialogue_ref, lesson_ref, quest_ref |
| `user_map_state` | user_id, current_zone, avatar_x, avatar_y, unlocked_zones[], defeated_trainers[], completed_lessons[], completed_quests[] |
| `srs_cards` | user_id, card_type, due_date, stability, difficulty (champs FSRS) |
| `grammar_encounters` | user_id, grammar_id, first_seen_at |
| `text_completions` | user_id, text_id, score, completed_at |
| `battle_results` | user_id, battle_id, lives_lost, modes_used[], accuracy, played_at |
| `fukuda_messages` | user_id, trigger_type, trigger_ref, sent_at, read_at |
| `rocket_progress` | user_id, event_id (1–3), cleared_at |
| `silver_progress` | user_id, encounter_id (1–6), outcome, played_at |
| `kimono_progress` | user_id, girl_id (1–5), cleared_at |
| `legendary_progress` | user_id, legendary (raikou/entei/suicune), cleared_at |
| `mastery_events` | user_id, kanji_id, fired_at |

### ProgressionEngine (`src/lib/progression-engine.ts`)

TypeScript pur, sans I/O :

- `getAvailableKanji(studiedSet, allKanji, componentGraph)` — ordre JLPT, prérequis composants
- `getAvailableWords(masteredKanjiSet, allWords, wordsInDeck)` — déblocage de vocabulaire
- `getTrainerBattlePool(trainer, studiedSet)` — intersection kanji_pool ∩ studiedSet, min 5
- `getDōjōKanji(theme, studiedSet)` — pool de combat gym
- `getGrammarForBattle(zoneJlptTier, encountersSet)` — grammaire rencontrée uniquement, fallback
- `selectQuestionMode(battleType, encounteredGrammarCount, hasDispositionSentences)` — sélection pondérée parmi 8 modes, avec redistribution des modes indisponibles
- `getDispositionChunks(chunks)` — retourne `chunks[]` mélangés (Fisher-Yates), pur
- `isInSight(trainerPos, facing, sightRange, avatarPos)` — géométrie pure
- `isTrainerDefeated(trainerId, defeatedSet)` — bool
- `isZoneClear(zoneId, trainers, defeatedSet)` — tous les dresseurs de la zone battus
- `checkCurriculumGate(cityId, playerStats)` — bool + conditions non remplies
- `getDailySRSStatus(srsHistory, today)` — { sessionDone, cardsPending }
- `getCSKanjiAbilities(masteredSet)` — capacités de carte actives
- `getLessonQueue(availableKanji, completedLessons)` — file ordonnée de leçons à venir

### Pipeline de Données

1. Parser **Kanjidic2** → table kanji
2. Parser **KanjiVG** → table kanji_components
3. Parser **JMdict Extended** (217 625 entrées) → table words. Croiser avec Yomitan JLPT vocab (8 113 paires) pour peupler `jlpt_level`. Filtrer à 7 836 mots JLPT.
4. Parser **Tatoeba** (150–200k paires) → table sentences (register: neutral). Lancer **kuromoji** en batch → peupler `chunks[]` par phrase.
5. Parser **JESC** (2,8M paires) → table sentences (register: spoken) — combats Silver/Rocket
6. Parser **Hanabira JSON** → table grammar (828 points, 3 310 exemples)
7. **Batch IA** — kanji : étymologie + mnémotechnique pour les 2136 kanji
8. **Batch IA** — mots : compound story pour les 7 836 mots JLPT
9. **Batch IA** — textes des premiers niveaux (Route 29 → Gym 3), calibrés par curriculum-checkpoints.md
10. **Tadoku graded readers** → table texts (niveaux bas)
11. **Aozora Bunko** → table texts (niveaux moyen-élevé, seuil 95% de maîtrise)
12. **NHK Web Easy** → table texts (japonais contemporain, N3–N4)
13. **Contenu hand-written** : `/content/map/trainers.json` (depuis guidebook Prima), `/content/map/npcs.json`, `/content/dialogues/fukuda/`, `/content/curriculum-checkpoints.md`
14. **Manifest dresseurs** : `/content/map/trainers.json` — chaque entrée : `{ trainer_id, zone_id, tile_x, tile_y, facing, sight_range, role, trainer_type, kanji_pool[], battle_length, name }`

### Sources de Contenu

| Source | Licence | Usage |
|---|---|---|
| Guidebook Prima HGSS | Référence uniquement | Positions dresseurs, rôles NPC, ordre des zones. Dépouillement exhaustif (rosters de dresseurs, inventaire PNJ complet par zone, bios officielles) dans `content/guidebook-adapted.md` ; Mont Gris/Red absent de ce guide (volume Johto uniquement) — complété par recherche web, voir le fichier pour les sources externes utilisées. |
| Kanjidic2 | CC BY-SA 3.0 | Données kanji |
| KanjiVG | CC BY-SA 3.0 | Ordre des traits, composants |
| JMdict Extended | CC BY-SA 3.0 | Vocabulaire |
| Yomitan JLPT vocab | CC BY-SA 4.0 | Niveaux JLPT des mots |
| Tatoeba | CC BY 2.0 FR | Paires de phrases (registre neutre) |
| JESC | CC0 | Paires de phrases (registre parlé) |
| Hanabira.org | CC | Corpus grammatical (828 points) |
| Aozora Bunko | Domaine public | Textes littéraires |
| Tadoku graded readers | CC | Textes de lecture graduée |
| NHK Web Easy | Libre d'usage | Textes de japonais contemporain |
| OST HGSS | Usage personnel | Musique de fond |
| The Spriters Resource | Fan use | Sprites |
| kuromoji | Apache 2.0 | Analyse morphologique japonaise |

### Audio

**Source audio :** `public/audio/gs_sound_data.sdat` (8.3MB, ROM file 479). Export OGG via Nitro Studio 2. Voir `public/audio/README.md`.

| Contexte | Piste |
|---|---|
| Carte (zones initiales) | New Bark Town |
| Carte (zones intermédiaires) | Route 29 |
| Carte (zones avancées) | Route Victoire |
| Session SRS | Thème Centre Pokémon |
| Combat dresseur de route | Thème Dresseur |
| Combat 門弟 | Thème Dresseur |
| Combat 師範 | Thème Chef d'Arène |
| Cérémonie badge | Fanfare victoire |
| Combat Silver | Thème Rival |
| Combat Rocket | Thème Rocket |
| Combat Kimono Girl | Ecorosa ambient (ralenti) |
| Combat légendaire de grammaire | Thème Pokémon Légendaire |
| Combat Elite Four | Thème Elite Four |
| Combat Lance | Thème Lance/Red |
| Combat Red | Silence |
| Lecture de textes | Ecorosa ambient |
| Achievement débloqué | Fanfare courte |

---

## Curriculum Checkpoints (résumé)

Détail complet dans `content/curriculum-checkpoints.md` (49 zones, table de calibration complète +
inventaire PNJ sourcé par zone). ⚠️ **Table resynchronisée (2026-06-30)** — plusieurs valeurs avaient
dérivé par rapport au fichier détaillé (kanji counts et niveaux grammaticaux légèrement différents).
Corrigée ci-dessous pour reprendre le début de la fourchette de chaque zone telle que définie dans
`content/curriculum-checkpoints.md`.

| Ville | Kanji connus | Niveau grammaire | Structures clés |
|---|---|---|---|
| Bourg-en-Côteau | 30 | N5 intro | は/が/を/に/で, ます/です |
| Cramola | 80 | N5/N4 | て-form, たいです, に行きます |
| Safrania | 160 | N4 | てもいいですか, 〜ために, 〜かもしれない |
| Dorado City | 240 | N4 | てもらえますか, 〜ながら, 〜ことにしている |
| Ecorosa | 350 | N3 | おかげで, 〜うちに, 〜らしい |
| Amaris City | 440 | N3 | てほしいのですが, 〜ことになっている, 〜しかない |
| Acajou Ville | 530 | N3/N2 | はずだ, 〜にすぎない, 〜ものだ intro |
| Saupoudreville | 600 | N2 | ものの, 〜にもかかわらず, 〜ことなく |
| Plateau Indigo | 800 | N2/N1 | N2 complet + introduction N1 |
| Mont Gris / Red | 2136 | N1 | Corpus Hanabira N1 complet |
