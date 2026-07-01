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

**Aucun français nulle part dans le jeu** (2026-07-01) — ni dans l'interface, ni dans le contenu (dialogues, quiz, fiches 図鑑/Carte Mot, `grammar_note`). Seules deux langues sont affichées au joueur : le japonais (langue apprise) et l'anglais, retenu uniquement là où il a un rôle pédagogique précis (voir modèle ci-dessous). Le français reste la langue de travail de ce document et des échanges avec l'équipe — il ne doit simplement jamais fuiter dans le produit.

**Modèle à 3 mécanismes (2026-07-01) :**

- **A — Traduction est le seul mode à garder l'anglais en permanence.** Tous les autres modes de combat (Sens, Écriture, Disposition), les dialogues de leçon et NPC graduent vers 100% japonais et n'affichent plus jamais d'anglais une fois la graduation faite (voir C). Le mode Traduction (JP↔EN) reste anglais tout au long du jeu, y compris à N1 — c'est littéralement son objet pédagogique (tester le mapping de traduction), pas une glose de confort à retirer.
- **B — Sens mode gradué = synonymes/antonymes japonais déjà existants, pas une définition inventée.** Une fois un mot **maîtrisé** (stabilité FSRS ≥ 30 jours), ses options de quiz en mode Sens proviennent des relations `related`/`antonym` déjà présentes dans JMdict Extended (déjà en local, `scripts/sources/jmdictExtended-*.json`) — aucune génération IA de "définition japonaise" n'est nécessaire. Si JMdict n'a pas de relation renseignée pour une entrée donnée, elle reste en anglais plutôt que de forcer un contenu de qualité inégale — pas de couverture 100% exigée.
- **C — L'anglais est une étiquette à usage unique, pas un champ permanent.** Chaque kanji/mot affiche son mot-clé anglais **une seule fois**, au moment de sa leçon d'introduction — jamais restocké comme champ de quiz récurrent après coup. Conséquence : pas de "retrait mot par mot" à piloter dans le temps comme pour le furigana — l'anglais disparaît de lui-même dès la première exposition passée, remplacé par (B) en mode Sens et par un prompt directement japonais en Écriture/Disposition une fois le mot connu.
- **Fiches de référence (図鑑/Carte Mot) — registre séparé.** Écrans de consultation à la demande, pas du gameplay actif : ils gardent un petit champ anglais permanent (comme un dictionnaire), indépendamment de la graduation ci-dessus.

**Conséquence sur `grammar_note`** (voir `content/curriculum-checkpoints.md`) : le corpus Hanabira fournit déjà `short_explanation`/`long_explanation`/plusieurs `examples[]`/`grammar_audio` en anglais — réutilisés tels quels, sans traduction. Le champ `note_fr` est supprimé.

---

## Interface — Émulateur DS

L'app ressemble et se comporte comme un émulateur DS sur mobile :

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
| 1    | 図鑑    | Encyclopédie kanji                                      |
| 2    | Leçons  | Batch de leçons actif + historique                      |
| 3    | Sac     | Objets collectés (Apricorns, CS-Kanji, objets de quête) |
| 4    | Profil  | Badges, stats, achievements, textes lus                 |
| 5    | Options | Paramètres                                              |

### Pokégear (SELECT)

Quatre onglets, structure identique à HGSS :

| Onglet    | Contenu                                                 |
| --------- | ------------------------------------------------------- |
| Téléphone | Appeler Fukuda (lancer le SRS) + messages des dresseurs |
| Carte     | Carte Johto complète, vue globale                       |
| Radio     | Émissions d'Oak, radio d'ambiance                       |
| Textes    | Bibliothèque de trophées de lecture                     |

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
Bourg-en-Vol → Route 29 → Bourg-en-Côteau → Routes 30–31 → Cramola → Tour Grospignon → Route 32 → Ruines Arcaniques → Route 33 → Safrania → Puits Ramoloss → Forêt Secte → Route 34 → Dorado City → Routes 35–37 → Parc National → Ecorosa → Tour Embrasée → Routes 38–39 → Amaris City → Route 40 → Orsay City → Routes 41–42 → Mont Mortier → Acajou Ville → Lac Colère → Route 44 → Chemin Glacé → Saupoudreville → Antre du Dragon → Routes 45–27 → Route Victoire → Plateau Indigo → **Kanto (adopté 2026-07-01, voir § Kanto — 8 Gyms) : Vermeille City → Safranville → Azuria City → Céladia → Fuchsia City → Argenta City → Île Braise → Vertville** → Mont Gris

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

**CS-Kanji** — capacités de carte débloquées par la maîtrise :

| Kanji | Maîtrisé | Débloque                                                                   |
| ----- | -------- | -------------------------------------------------------------------------- |
| 飛    | maîtrisé | Voyage rapide — tap sur n'importe quelle ville visitée pour s'y téléporter |
| 水    | maîtrisé | Routes maritimes (Routes 40–41) et traversées de rivière                   |
| 力    | maîtrisé | Déplacer les rochers sur les routes de montagne                            |

---

## Dresseurs de Route — Rôles Fixes

Chaque dresseur sur chaque route a un rôle fixe sourcé du guidebook :

- **Dresseurs combat** : t'affrontent quand tu entres dans leur champ de vision (combat 3 vies)
- **Dresseurs leçon** : dialogue s'ouvre quand tu les approches, ils enseignent un concept de japonais

Les dresseurs qui donnent des objets ou des informations dans HGSS deviennent des dresseurs-leçon dans 漢字の庭. La distinction est définie à la création du contenu, pas choisie par le joueur.

**3ᵉ catégorie — PNJ ambiants recatégorisés en leçon (2026-07-01) :** au-delà des dresseurs-combat et des dresseurs-leçon "item/info-giver", le guidebook liste de nombreux PNJ qui ne battent pas et ne donnent rien (couleur locale — ex. les PNJ Wi-Fi/Union Room de Cramola). Ceux-ci peuvent être recatégorisés en dresseurs-leçon **au cas par cas** (sélectif, pas systématique) : le PNJ est réel (fidélité guidebook préservée), seule sa fonction en jeu est réattribuée. Réservé aux PNJ dont le rôle d'origine se prête naturellement à enseigner quelque chose ; les PNJ dont la fonction d'origine est une feature multijoueur hors-scope (échange, Union Room, personnalisation Wi-Fi) restent de la couleur pure, sans leçon forcée.

**Suppression du mécanisme kanji_pool-par-classe (2026-07-01) :** l'ancienne table "Types de dresseurs et thèmes kanji" (27 classes → thème kanji fixe par classe) est retirée — jugée inutile à l'usage. Chaque dresseur porte directement son propre `kanji_pool` (voir `map_trainers` plus bas), sans passer par une étiquette de classe. Les classes d'origine du jeu (Youngster, Lass, Pêcheur, etc.) restent documentées comme matériau de sourcing factuel dans `content/guidebook-adapted.md` — utile pour savoir qui existe dans le jeu d'origine et nommer les dresseurs (ex. "Gamin Ken"), mais ne pilotent plus rien mécaniquement.

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

- **Poké Balls** affichées en haut à droite = tes vies → `public/sprites/items/pokeballs/pokeball.png` (24×24, 4× = 96×96 disponible). Le nombre de vies scale avec la longueur du combat : `max(2, ceil(questions × 0.10))` — voir la table de longueurs ci-dessous pour la valeur par combat.
- Chaque mauvaise réponse brise une Poké Ball
- Toutes les vies brisées = défaite. Rejouer immédiatement, sans cooldown.
- Les bonnes réponses réduisent la barre de HP de l'adversaire (visuel uniquement)
- Répondre à toutes les questions en restant sous le nombre d'erreurs tolérées (voir formule ci-dessus) = victoire

### Les 8 Modes de Question

Mélangés aléatoirement à l'intérieur de chaque combat :

| Mode            | Prompt                             | Réponse                                   | Ce que ça teste               |
| --------------- | ---------------------------------- | ----------------------------------------- | ----------------------------- |
| **Sens**        | Kanji affiché en grand             | 4 options : anglais (mot non maîtrisé) ou synonymes/antonymes japonais JMdict (mot maîtrisé) | Reconnaissance de sens        |
| **Lecture**     | Kanji affiché en grand             | 4 lectures hiragana                       | Reconnaissance phonétique     |
| **Écriture**    | Signification en anglais (non maîtrisé) ou prompt japonais (maîtrisé) | Grille de tiles kana — compose la lecture | Production active             |
| **Composition** | 4 tiles kanji                      | Glisser-déposer pour former un mot valide | Formation de composés         |
| **Grammaire**   | Phrase avec un trou grammatical    | 4 formes grammaticales (corpus Hanabira)  | Grammaire en contexte         |
| **Conjugaison** | Verbe + contexte                   | 4 formes conjuguées                       | Production verbale            |
| **Traduction**  | Phrase japonaise (Tatoeba)         | 4 sens en anglais — toujours anglais, seul mode qui ne graduera jamais (voir § Langue du Jeu) | Compréhension de phrase       |
| **Disposition** | Sens en anglais (non maîtrisé) ou prompt japonais (maîtrisé) | 6–8 chunks japonais à remettre en ordre   | Production de phrase complète |

**Graduation Sens/Écriture/Disposition (voir § Langue du Jeu, mécanismes A/B/C) :** l'anglais n'apparaît qu'à la toute première exposition d'un mot (leçon d'introduction) ; une fois **maîtrisé** (stabilité FSRS ≥ 30 jours), ces trois modes ne réaffichent plus jamais l'anglais — Sens pioche ses options dans les relations `related`/`antonym` de JMdict (fallback anglais uniquement si l'entrée n'a aucune relation renseignée), Écriture/Disposition basculent sur un prompt directement japonais.

**Disposition** utilise des phrases Tatoeba pré-tokenisées avec kuromoji au build time. Les chunks sont stockés comme `chunks[]` en base. Le client mélange et valide par comparaison de séquence de `surface_form`. Aucune tokenisation à runtime.

**Pool de grammaire** (Grammaire + Conjugaison) : pioche uniquement dans les points de grammaire que le joueur a **déjà rencontrés** en dialogue NPC, leçon ou texte (tracké dans la table `grammar_encounters`) — **dès qu'un seul point a été rencontré, il est testable au combat suivant** (2026-07-01, révisé — voir `content/curriculum-checkpoints.md` § garde d'activation). Les 4 options de réponse sont des variantes incorrectes du point tiré lui-même — jamais d'autres points de grammaire —, donc aucun stock minimal n'est requis pour construire un QCM non trivial : `conjugation_distractors[]` (précalculé par script déterministe) pour Conjugaison, `distractors[]` du `grammar_note` (batch IA, relu une fois) pour Grammaire — voir § Pipeline de Données.

**Combo** : 3 bonnes réponses consécutives ou plus → compteur combo visible.

**Longueurs de combat — difficulté croissante avec l'avancement dans l'aventure (adopté 2026-07-01) :**

La longueur (nombre de questions) n'est plus une valeur fixe par catégorie de combat — elle croît avec la position de la rencontre dans l'arc narratif, pour créer une vraie courbe de difficulté qui culmine à l'approche de l'Elite Four/Lance/Red. Le nombre de vies (voir plus haut, `max(2, ceil(questions × 0.10))`) découle directement de cette longueur.

| Catégorie | 1ère occurrence | Progression | Dernière occurrence | Vies (1ère → dernière) |
|---|---|---|---|---|
| Dresseur de route | 5–8 (zones N5, early) | 10–15 (zones N4/N3, mid) | 20–25 (zones N2/N1, late) | 2 → 3 |
| 門弟 (garde de gym) | 10 (Falkner) | 13, 16, 18 | 20 (Clair) | 2 → 2 |
| 師範 (8 gyms) | Falkner : 24 | Bugsy 31, Whitney 38, Morty 45, Chuck 51, Jasmine 58, Pryce 65 | Clair : 72 | 3 → 8 |
| Silver (6 rencontres) | #1 Bourg-en-Côteau : 12 | #2 15, #3 18, #4 20, #5 22 | #6 Route Victoire : 24 | 2 → 3 |
| Exécutifs Rocket (3 événements) | Proton (Puits Ramoloss) : 24 | Ariana (Mahogany) : 36 | Gauntlet Tour Radio : 48 | 3 → 5 |
| Kimono Girls (5 rencontres) | Zuki : 24 | Naoko 30, Miki 36, Kuni 42 | Sayo : 48 (gauntlet collectif post-Master Ball = 48 chacune) | 3 → 5 |
| Légendaires (3 : Raikou/Entei/Suicune) | Raikou : 45 | Entei : 52 | Suicune : 60 | 5 → 6 |
| Elite Four (Will, Koga, Bruno, Karen) | — | — | 70 fixe (chacun) | 7 |
| Lance | — | — | 80 fixe | 8 |
| Red | — | — | 100 fixe | 10 |

Hiérarchie résultante : dresseurs/門弟/Silver/Rocket/Kimono (≤48) < Légendaires (≤60) < Elite Four (70) < Lance (80) < Red (100). Le dernier gym (Clair, 72) dépasse légèrement l'Elite Four (70) — accepté tel quel, la gym la plus dure de Johto n'a pas à être strictement plus courte que le premier membre du Conseil 4.

**Profils de poids par type de combat :**

| Mode            | Route (5–8 questions) | Boss (≥ 10 questions) |
| --------------- | --------------------- | --------------------- |
| Sens            | 28 %                  | 12 %                  |
| Lecture         | 22 %                  | 12 %                  |
| Écriture        | 18 %                  | 10 %                  |
| Composition     | 10 %                  | 5 %                   |
| Grammaire       | 7 %                   | 13 %                  |
| Conjugaison     | 7 %                   | 13 %                  |
| Traduction      | 3 %                   | 5 %                   |
| **Disposition** | **5 %**               | **30 %**              |

Boss = 門弟, 師範, Silver, Exécutifs Rocket, Kimono Girls, Légendaires, Elite Four, Lance, Red.

Modes indisponibles : si `encounteredGrammarCount == 0` (aucun point de grammaire encore rencontré), Grammaire et Conjugaison sont exclus ; si aucune phrase Disposition éligible (`kanji_ids ⊆ studiedSet` et `chunks` non vide), Disposition est exclue. Le poids des modes exclus est redistribué proportionnellement aux modes restants. La redistribution s'effectue à chaque tirage individuel (pas en début de combat).

---

## Leçons

Les leçons sont dispensées par des dresseurs-leçon (rôle fixe) et par des NPCs dans les villes et bâtiments. Les interactions NPC et quêtes secondaires du guidebook deviennent des moments de leçon.

**Exemples directs depuis le guidebook :**

| Événement guidebook                            | Leçon dans 漢字の庭                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| Pêcheur sur Route 32 donne la Vieille Canne    | Kanji de l'eau + vocabulaire de la pêche                              |
| Randonneur sur Route 42 donne CT Force         | 力/強/体 + forme potentielle                                          |
| Kimono Girl perdue dans Forêt Secte            | Grammaire directionnelle (〜ていく/〜てくる) en guise de remerciement |
| Kurt à Safrania fabrique tes Poké Balls        | Kanji de l'artisanat pendant qu'il travaille                          |
| Directeur de la Tour Radio après sa libération | Registre formel du japonais                                           |
| Inscription de l'Antre du Dragon               | Défi de traduction N2/N1                                              |

**Format de leçon** : déclenchée en abordant le PNJ sur la carte, puis bascule vers un **écran dédié plein écran** (voir UI/UX ci-dessous) — pas une boîte de dialogue inline. Texte en japonais calibré au tier de la zone. Segments pédagogiques tapables. Quiz court de 2–3 questions à la fin. La grammaire et la conjugaison ne rejoignent pas le SRS — elles sont apprises par les rencontres.

**UI/UX — écran dédié plein écran, inspiré de Wagotabi (2026-07-01, remplace la version précédente "aucun écran dédié") :** contrairement à ma proposition initiale, la leçon **n'est pas** une simple boîte de dialogue inline — elle ouvre un écran dédié, après une courte animation, avec une musique calme dédiée à la réflexion (nouvelle piste, distincte de la carte/du combat — voir § Audio). Référence directe : l'écran "dictionnaire" de **Wagotabi** (jeu d'apprentissage du japonais) — double page de livre ouvert, texture parchemin, cadre bois/laque foncé, kanji en grand avec furigana, petite illustration d'étymologie, son à l'écoute, exemples de phrases en dessous. On reprend ce langage visuel du **livre ancien** mais avec l'identité **chibi/pixel Pokémon** déjà établie pour les sprites/portraits — "entre Pokémon et Japon ancien" : le cadre est un livre, le contenu (portrait PNJ, police, icônes) reste dans l'esthétique DS déjà définie.
- **Page kanji** : un kanji par page (portrait plein écran) — caractère en très grand, lecture dans une couleur distincte du reste du texte (à la Wagotabi), petite illustration pictographique à côté du sens (pas juste du texte — même donnée que l'étymologie visuelle du 図鑑), icône audio à côté du caractère. Séparateur net, puis 1-2 exemples de phrase en dessous (chacun avec sa propre icône audio). **Pas d'ordre des traits ni d'animation de tracé** (explicitement écarté). Bouton "Suivant" en bas à droite (comme la flèche ▶ de Wagotabi) pour passer au kanji suivant du groupe — transition de page franche (pas de scroll continu, le livre tourne une page à la fois).
- **Page(s) grammaire/conjugaison** : même chrome livre, texte paginé (bouton "page suivante", même logique `dialogue_states`/`pages` que le reste du jeu), affichée après les pages kanji.
- **Segments tapables** : popup léger sur un mot/kanji dans le texte (lecture, sens, `grammar_audio` si dispo) — non bloquant, dismissable en tapant ailleurs.
- **Mini-quiz** : même composant "carte de question" (prompt + 4 boutons) que les modes de combat, mais réhabillé aux couleurs du livre (parchemin/bois) plutôt qu'au chrome de combat (pas de 3 Poké Balls, pas de barre HP, pas de jingle) — un seul composant UI, deux habillages.
- **Sortie** : courte animation de fermeture (le livre se referme) → retour à la carte, PNJ en pose assise/passive (déjà acté génériquement pour combat/leçon).
- **Nouvel asset requis** : chrome de livre (parchemin, cadre, bouton flèche, animation d'ouverture/fermeture) — pas de précédent HGSS à extraire, création originale nécessaire, dans l'esprit Wagotabi sans le copier (couleurs/typo alignées sur l'identité DS déjà établie plutôt que sur celles de Wagotabi).

**Structure interne d'une leçon (2026-07-01, révisé après recherche sur Duolingo/WaniKani/Bunpro) :** toujours dans cet ordre — **kanji/mots nouveaux d'abord, point de grammaire ou conjugaison ensuite (optionnel, pas systématique).** C'est le sens inverse de "un seul topic par leçon" évoqué plus tôt dans la discussion — retenu ici volontairement : c'est la densité de kanji/mots introduits en leçon qui permet d'atteindre les paliers de `curriculum-checkpoints.md` (voir bootstrap Fukuda ci-dessous), donc une leçon peut introduire **plusieurs** kanji/mots d'un coup, contrairement au point de grammaire qui reste toujours unique par leçon (cohérent avec le format `grammar_note` : un seul point Hanabira). Le quiz de fin (formalité) porte sur ce qui vient d'être enseigné dans cette leçon précise.

**Le quiz de fin de leçon est une formalité, pas une porte (2026-07-01)** : toujours réussi (pas de note de passage, pas de blocage de progression en cas d'échec) — son rôle est de forcer une relecture active avant que le contenu ne rejoigne le SRS, pas de vérifier la maîtrise. La vérification réelle de maîtrise reste le SRS (stabilité FSRS ≥ 30 jours). Un dresseur-leçon/NPC ne peut donc jamais bloquer un chemin par un échec de quiz, contrairement à un dresseur-combat.

**Un seul mécanisme d'entrée du vocabulaire en SRS (2026-07-01, tranché) :** les leçons injectent uniquement des **kanji** dans la file SRS (pour la session du lendemain matin) — jamais de mots directement. Les mots apparaissent dans les leçons comme exemples d'usage en contexte (renforcent le kanji du jour), mais leur entrée en SRS reste exclusivement le canal déjà décrit au § Système SRS ("Déblocage de vocabulaire" : kanji maîtrisé → mots JLPT éligibles rejoignent la file). Un seul chemin, pas de risque de double-injection/idempotence à gérer.

**Combien de kanji/mots par leçon — au fil de l'écriture, pas de nombre fixe (2026-07-01) :** l'équipe de contenu répartit le pool de kanji d'une zone (ex. 50 kanji, voir `content/curriculum-checkpoints.md`) entre ses PNJ-leçon disponibles (guidebook-sourcés + inventés en complément, voir bootstrap Fukuda ci-dessous) selon deux passes :
1. **Regroupement thématique en priorité** — un PNJ dont le rôle narratif évoque un thème naturel (ex. un PNJ qui explique comment dire l'heure) reçoit les kanji du pool de la zone qui collent à ce thème (fréquence, temps, heure) plutôt qu'un tirage arbitraire — le prétexte narratif et le contenu appris se renforcent mutuellement.
2. **Regroupement par affinité en filet de sécurité** — les kanji restants, sans thème de PNJ auquel s'accrocher, sont simplement groupés entre eux par affinité sémantique ou radical partagé, et attribués aux PNJ-leçon restants sans prétexte narratif fort.

Le nombre de kanji par leçon varie donc selon la taille naturelle de chaque groupe thématique/affinité — pas de quota fixe par leçon.

**Ordre de production du contenu (2026-07-01, précise la priorité entre les décisions ci-dessus) :** ce qui prime toujours, c'est le respect des paliers de kanji par zone dans l'ordre JLPT (`content/curriculum-checkpoints.md`) — le tri thématique n'est qu'un détail de placement, jamais une contrainte qui passerait avant. Séquence de travail pour l'équipe de contenu :
1. **Macro** — fixer le pool de kanji de chaque zone, dans l'ordre JLPT (déjà fait dans `curriculum-checkpoints.md`).
2. **Méso** — définir le roster de PNJ-leçon de la zone (guidebook-sourcés en priorité, inventés en complément) et leur sujet narratif respectif.
3. **Micro** — affecter, à l'intérieur du pool déjà fixé à l'étape 1, quels kanji précis vont à quel PNJ-leçon (thématique si un thème colle, affinité sinon — voir ci-dessus) ; même logique en cascade pour le point de grammaire/conjugaison de la leçon.
Le tri thématique ne redéfinit jamais quels kanji appartiennent à quelle zone — seulement leur répartition interne entre PNJ une fois la zone fixée.

**Origine des tout premiers kanji — bootstrap Fukuda (2026-07-01) :** les nouveaux kanji n'entrent en jeu QUE par les leçons (jamais par un dresseur-combat, qui ne teste que `studiedSet`). Or Route 29 — la toute première route — n'a aucun PNJ-leçon sourcé du guidebook (`guidebook-adapted.md` : "aucun dresseur nommé... le PRD peut librement inventer les 8–10 dresseurs SRS", tous combat). Pour que le joueur atteigne malgré tout les 30 kanji requis avant Cherrygrove (voir `content/curriculum-checkpoints.md`), l'onboarding chez Fukuda (Bourg-en-Vol, dōjō — déjà 100% inventé, hors guidebook) dispense directement une première séquence de leçons structurées portant les kanji fondamentaux (ordre `getAvailableKanji` : JLPT puis prérequis composants), avant même que le joueur ne quitte la ville.

**Assignation du contenu de leçon — fixée à l'écriture, jamais dynamique (2026-07-01, précise le modèle ci-dessus) :** un PNJ-leçon (qu'il soit nommé/sourcé du guidebook ou inventé pour la pacing) porte **un seul kanji/grammaire fixé au moment de l'écriture du contenu** — jamais choisi au runtime selon la progression du joueur qui l'aborde. Il n'y a pas de catégorie "leçon bespoke" vs "leçon générique" dans le moteur : un PNJ-leçon est un PNJ-leçon, point, exactement comme il n'y a plus de classe de dresseur pilotant un thème kanji (voir suppression du mécanisme kanji_pool-par-classe plus haut). C'est l'équipe de contenu qui dimensionne, zone par zone, combien de PNJ-leçon sont nécessaires (guidebook-sourcés en priorité, inventés en complément si la densité du guidebook est insuffisante) pour respecter en moyenne les paliers de `content/curriculum-checkpoints.md`. Un joueur qui dévie du chemin type (CS-Kanji, ordre différent) reçoit simplement un peu plus ou moins de révision selon son avance réelle — même tolérance que pour le pool de combat (fallback si <5 kanji disponibles). `getLessonQueue` (voir ProgressionEngine) n'assigne donc rien : c'est un helper d'affichage en lecture seule pour le menu START → Leçons ("prochaines leçons à faire").

---

## Système SRS

Algorithme FSRS (`ts-fsrs`). Deux types de cartes :

- **Cartes kanji** : 2 cartes par kanji (sens + lecture), indépendantes
- **Cartes vocabulaire** : 2 cartes par mot (sens + lecture), indépendantes

Session SRS : esthétique Centre Pokémon, musique calme. Carte affichée → Révéler → 4 notes (Encore/Difficile/Bien/Facile). Session terminée quand la file est vide.

**Maîtrise** : un kanji ou mot est "maîtrisé" quand ses deux cartes ont une stabilité FSRS ≥ 30 jours.

**Déblocage de vocabulaire** : quand un kanji atteint la maîtrise, les mots JLPT éligibles rejoignent la file SRS. Pas de plafond quotidien — le rythme d'introduction de nouveau kanji (en leçon) et de nouveau vocabulaire (à la maîtrise) suit librement la progression du joueur sur la carte. La seule contrainte quotidienne du jeu reste la session SRS (voir Boucle Quotidienne) : au moins une session par jour, peu importe sa taille.

**La grammaire n'est PAS dans le SRS.** Elle est apprise par les combats et les leçons, renforcée par les rencontres en contexte sur la carte.

---

## Textes Progressifs — Trophées de Lecture

Les textes de lecture sont déclenchés par des événements de la carte. Chaque texte est un trophée collectionnable, stocké dans Pokégear → Textes.

**Flux de lecture** : trouver le texte sur la carte (parchemin, lettre, panneau, inscription) → interface de lecture plein écran avec furigana adaptatif → questions de compréhension (3–5 QCM, pré-écrits) → trophée acquis → stocké dans la bibliothèque.

**Furigana adaptatif** : affiché sur tous les kanji pas encore dans la liste étudiée du joueur, calculé côté client.

**Progression des textes liée aux événements du jeu :**

| Événement               | Texte                                 | Longueur         | Niveau            |
| ----------------------- | ------------------------------------- | ---------------- | ----------------- |
| Route 29, premier NPC   | Note d'un voyageur                    | 30 caractères    | N5 hiragana       |
| Après Gym 1 (Falkner)   | Lettre de l'Ancien de Tour Grospignon | 80 caractères    | N5                |
| Puits Ramoloss (Rocket) | Mémo saisi sur un grunt               | 150 caractères   | N4                |
| Après Gym 3 (Whitney)   | Article du Dorado Daily               | 250 caractères   | N4                |
| Tour Embrasée           | Journal d'un dresseur                 | 400 caractères   | N3                |
| Tour Radio Rocket       | Transmission interceptée              | 500 caractères   | N3/N2             |
| Antre du Dragon         | Texte ancien                          | 800 caractères   | N2/N1             |
| Face à Red              | Chapitre de manga + lettre de Fukuda  | 2000+ caractères | N1, sans furigana |

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

| #   | Lieu                                      | Contexte guidebook                                                                                                                            | Ses 6 kanji            |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | Bourg-en-Côteau (retour du chemin)        | Premier combat — condescendant                                                                                                                | 怒、争、力、敵、速、逃 |
| 2   | Safrania, porte ouest (avant Forêt Secte) | Bloque le passage                                                                                                                             | 強、越、勝、誇、傲、鋼 |
| 3   | Tour Embrasée (haut de l'échelle)         | Embuscade                                                                                                                                     | 影、闇、忘、去、断、孤 |
| 4   | QG Rocket B2F (Acajou)                    | ⚠️ Pas un combat dans le jeu d'origine — Silver est déjà vaincu par Lance, simple cameo frustré ("pas assez d'affection pour ses compagnons") | 変、知、疑、惜、寂、遅 |
| 5   | Tunnel de Dorado B2F                      | Grille ton déguisement à la Tour Radio, puis combat réel au Tunnel pendant la chasse à la Carte-clé                                           | 悔、認、謝、恥、赦、和 |
| 6   | Route Victoire                            | Dernier combat avant la Ligue — le jeu vide volontairement la route de tout autre dresseur pour ce face-à-face                                | 静、空、終、別、礼、去 |

_(Sourcé et confirmé par `content/guidebook-adapted.md` — corrige le lieu #5, anciennement "Tour Radio B2F (Dorado)" : le combat réel a lieu au Tunnel de Dorado, la Tour Radio n'est que le lieu où le déguisement est démasqué. Niveau de langue calibré par apparition : voir `content/curriculum-checkpoints.md` § Règle de Silver — corrigée pour s'aligner sur cette table après une incohérence détectée entre les deux documents.)_

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

| #   | Nom       | Lieu                                                          | Moment guidebook (texte source)                                                                                              | Leçon de japonais                            |
| --- | --------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | **Zuki**  | Cramola (Violet City), devant le Mart                         | Apparaît juste après que le joueur récupère l'œuf mystère ; "semblait inquiète pour l'œuf"                                   | Introduction à la lecture N5                 |
| 2   | **Naoko** | Forêt Secte (Ilex Forest)                                     | Perdue, aucun sens de l'orientation — le compagnon du joueur lui montre la sortie                                            | Grammaire directionnelle (〜ていく/〜てくる) |
| 3   | **Miki**  | Ecorosa Dance Theater (Ecruteak)                              | Harcelée par un Sbire Rocket — le joueur la sauve en combat ; "impressionnée que tu aies battu la Team Rocket"               | N3 grammaire, registre formel                |
| 4   | **Kuni**  | Tunnel de Dorado (Goldenrod Tunnel), après la clé de sous-sol | "Te respecte d'avoir affronté la Team Rocket" ; laisse échapper une allusion à un esprit légendaire                          | Expressions de gratitude (感謝)              |
| 5   | **Sayo**  | Chemin Glacé (Ice Path), près de la sortie                    | Sandales coincées sur une plaque de glace — le joueur la pousse par derrière pour la libérer ; moment volontairement comique | Combat de compréhension N2                   |

**Événement collectif (post-Master Ball)** : les 5 Kimono Girls se réunissent à l'Ecorosa Dance Theater
pour un gauntlet — un combat chacune, un seul compagnon par combat, "test du lien avec ton équipe".
Victoire → Clear Bell/Tidal Bell, condition requise pour faire apparaître l'esprit légendaire au sommet
de Tour Jo (Bell Tower) — où les 5 girls exécutent une danse rituelle qui fait résonner la cloche et
attire l'esprit. Trophée de texte légendaire débloqué à cette occasion.

_(Note : la 4e rencontre dans l'ordre de la table récap du guidebook lui-même liste Kuni en position 4
malgré une rencontre chronologique réelle légèrement différente selon le chemin emprunté — la
numérotation #1–5 ci-dessus suit l'ordre canonique du guidebook, pas nécessairement l'ordre strict de
visite du joueur, qui peut varier selon le chemin Acajou/Amaris choisi en premier.)_

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

Chaque rencontre légendaire = combat de 10 questions tiré de son domaine grammatical. Victoire = trophée de grammaire rare dans la bibliothèque + lettre de Fukuda.

---

## Système 道場 — Gyms comme Jalons Curriculaires

Chaque gym = un jalon de langue japonaise. Y entrer nécessite de satisfaire les prérequis curriculaires. Battre le 師範 prouve que le joueur a atteint ce niveau.

**Structure** : 2 門弟 (gardes, 10 questions chacun) → combat du 師範 (20 questions).

**Seuils et gates curriculaires :**

| 師範    | Thème kanji       | Gate primaire     | Gate curriculaire                                                                                                                     |
| ------- | ----------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Falkner | 空 — ciel/vol     | 80 kanji étudiés  | N5 grammaire complète, 1 texte lu                                                                                                     |
| Bugsy   | 虫 — nature       | 150 kanji étudiés | Puits Ramoloss libéré                                                                                                                 |
| Whitney | 常 — quotidien    | 250 kanji étudiés | N4 grammaire phase 1, 3 quêtes NPC                                                                                                    |
| Morty   | 影 — ombre/esprit | 370 kanji étudiés | N4 grammaire complète, Tour Embrasée visitée                                                                                          |
| Chuck   | 力 — force        | 500 kanji étudiés | N3 grammaire phase 1, QG Rocket commencé                                                                                              |
| Jasmine | 鋼 — acier        | 600 kanji étudiés | N3 grammaire complète                                                                                                                 |
| Pryce   | 氷 — glace        | 750 kanji étudiés | QG Rocket libéré, N2 grammaire phase 1                                                                                                |
| Clair   | 竜 — dragon       | 900 kanji étudiés | N2 grammaire complète, 4/5 Kimono Girls battues. ⚠️ Gate d'**entrée à l'Antre du Dragon**, pas du 印 lui-même — voir note ci-dessous. |

### Kanto — 8 Gyms (adopté 2026-07-01)

Après Plateau Indigo (Elite Four + Lance), le joueur traverse Kanto : 8 gyms supplémentaires, prérequis pour affronter Red à Mont Gris (fidèle au jeu d'origine — les 16 badges sont nécessaires). Sourcé de `scripts/sources/guidebook/kanto-guide-fulltext.txt` (guide Prima Kanto, OCR archive.org — voir `content/guidebook-adapted.md` § Kanto pour la méthode et les réserves sur la qualité de cette source face au texte propre du Johto). Ordre confirmé à la fois par recherche web et par la numérotation interne du guide ("Gym Battle 9" à "16") :

| 師範 | Ville | Thème kanji | Gate primaire | Longueur combat |
|---|---|---|---|---|
| Lt. Surge | Vermeille City | 電 — électricité, énergie | 1500 kanji étudiés | 82 |
| Sabrina | Safranville | 心 — esprit, mental | 1560 kanji étudiés | 85 |
| Misty | Azuria City | 水 — eau | 1620 kanji étudiés | 87 |
| Erika | Céladia | 草 — plante, nature | 1680 kanji étudiés | 89 |
| Janine | Fuchsia City | 毒 — poison, prudence | 1740 kanji étudiés | 92 |
| Brock | Argenta City | 岩 — roche, pierre | 1800 kanji étudiés | 94 |
| Blaine | Île Braise | 火 — feu, volcan | 1860 kanji étudiés | 96 |
| Blue | Vertville | 頂 — sommet, rivalité (dernier gym, rival historique de Red) | 1920 kanji étudiés | 98 |

Vies tolérées : `max(2, ceil(questions × 0.10))` comme les autres gyms → 9 pour les 4 premiers, 10 pour les 4 derniers.

**Gate Mont Gris** : 16 badges (8 Johto + 8 Kanto) + Elite Four/Lance terminés + trophée Antre du Dragon + 5 Kimono Girls battues + 2136 kanji étudiés.

⚠️ **Limite de cette source** : contrairement au guide Johto (texte natif propre extrait du PDF), le PDF Kanto est un scan sans couche de texte — l'extraction vient d'un OCR archive.org (même méthode que la "passe 1" abandonnée pour Johto). Les noms de gyms/villes/ordre sont fiables (recoupés avec une recherche web indépendante). **Une passe 2 partielle (2026-07-01)** a confirmé des repères utiles par ville (équipes de 4 des 8 Gym Leaders, plusieurs callbacks Johto directs — Mont Mortier, Tunnel de Dorado, Tour Jo/Ho-Oh, Baoba/Pal Park — et un détail narratif fort sur Île Braise : le Gym de Blaine y a été détruit par une éruption volcanique et relocalisé aux Seafoam Islands, avec Blue rencontré sur place comme point de contrôle narratif avant le combat final à Vertville, structure similaire au fil Silver). Roster de dresseurs de route encore à faire — voir `content/guidebook-adapted.md` § Kanto pour le détail complet.

**📍 Clair/Antre du Dragon — exception adoptée au système 道場 (2026-07-01) :** seul gym où battre le 師範 ne donne **pas** directement le 印. Battre Clair ouvre seulement l'accès à l'Antre du Dragon ; le Maître y soumet le joueur à un quiz en 5 questions axé sur l'empathie ("si j'étais à la place de l'autre, que ressentirais-je ?") — ce quiz remplace/recalibre le "Quiz de traduction N1" déjà prévu en section Leçons, qui ne doit donc plus porter sur la seule traduction littérale. Réussite → Clair (surprise, "elle ne s'attendait même pas à ce que tu réussisses") remet le 印 n°8. Le combat de Gym reste une porte d'entrée, pas le juge final — un ressort dramatique délibérément différent des 7 autres gyms (traités uniformément).

**Gate Plateau Indigo** : 8 badges Johto + événement collectif Kimono Girls terminé.

**Elite Four → Lance → Kanto (8 gyms) → Red** : séquence de combats escaladants, chaque étape nécessitant la précédente. Red nécessite désormais : 16 badges (8 Johto + 8 Kanto, voir § Kanto ci-dessus) + Elite Four terminé + Lance terminé + trophée Antre du Dragon + 5 Kimono Girls battues + 2136 kanji étudiés.

**Combat Red** : 100 questions, sans chrono. Le chapitre de manga est lu **avant** le combat (score ≥ 80% en compréhension requis pour débloquer le combat lui-même).

**📍 Note sourcée (recherche web, Mont Gris n'étant pas couvert par le guidebook Johto local — voir
`content/guidebook-adapted.md` § mt-silver-summit) :** dans le jeu d'origine, Red engage directement
sans la moindre ligne de dialogue ; une tempête de neige/grêle se déclenche automatiquement au début du
combat (bon élément d'ambiance transposable en effet visuel/sonore continu pendant les 100 questions).
Après la défaite : _"Red marque une pause, silencieux et figé. Puis, en un clin d'œil, il disparaît."_
— aucune ligne de texte, juste un geste. Confirme et précise le traitement "Red nod uniquement" déjà
prévu : si un seul signe doit sortir de Red, ce devrait être un geste, jamais une phrase.

**Thèmes kanji par 師範 :**

| 師範    | Pool kanji                       |
| ------- | -------------------------------- |
| Falkner | 空、風、鳥、飛、雲 et apparentés |
| Bugsy   | 虫、小、走、細、草 et apparentés |
| Whitney | Kanji N5–N4 les plus fréquents   |
| Morty   | 夜、暗、霊、死、消 et apparentés |
| Chuck   | 力、体、強、戦、押 et apparentés |
| Jasmine | 金、鉄、石、固、重 et apparentés |
| Pryce   | 冷、水、冬、凍、白 et apparentés |
| Clair   | 竜、王、空、力、古 et apparentés |

**Thèmes kanji par 師範 — Kanto :**

| 師範 | Pool kanji |
|---|---|
| Lt. Surge | 電、力、光、速、機 et apparentés |
| Sabrina | 心、精、神、念、透 et apparentés |
| Misty | 水、海、波、深、潮 et apparentés |
| Erika | 草、花、香、緑、育 et apparentés |
| Janine | 毒、忍、影、静、隠 et apparentés |
| Brock | 岩、石、固、山、堅 et apparentés |
| Blaine | 火、炎、熱、島、爆 et apparentés |
| Blue | 頂、勝、宿、敵、誇 et apparentés |

---

## Sensei Fukuda

Fukuda n'est pas un enseignant. Il est le narrateur de ta progression et un philosophe de l'apprentissage des langues.

Il écrit **après les grands événements** :

- Chaque badge de gym gagné (16 lettres — 8 Johto + 8 Kanto)
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
- Partie du discours, sens en anglais
- Patron d'accent de hauteur (高低, ex. LH・HLL) si disponible
- Compound story — 1–2 phrases expliquant comment les kanji composants se combinent
- Chaque kanji du mot cliquable vers sa fiche 図鑑
- Niveau JLPT et statut SRS (en file, dû, maîtrisé, non débloqué)
- 3 exemples de phrases (registres variés : neutre, formel, familier)
- Kanji encore à maîtriser avant que ce mot rejoigne le SRS (si non encore débloqué)

---

## Obstacles-Puzzles

_À rédiger — contenu hand-written._

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
- Badges de Gym : chacun des 16 (8 Johto + 8 Kanto) + Plateau Indigo + Lance + Red
- Textes : 1er texte lu, 10 textes, tous les textes
- Silver : battu les 6 fois
- Team Rocket : les 3 lieux libérés
- Kimono Girls : les 5 battues
- Légendaires : les 3 vaincus
- Streak : 7, 30, 100, 365 jours
- CS-Kanji : les 3 maîtrisés (飛、水、力)
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
| `lessons`            | zone_id, content, lesson_type, trainer_ref ou npc_ref                                                                                                                                                                  |
| `texts`              | jp_text, en_text, questions[], level, source, event_ref, length_chars                                                                                                                                                  |
| `map_trainers`       | trainer_id, zone_id, tile_x, tile_y, facing, sight_range, role (battle/lesson), kanji_pool[], battle_length, name, dialogue_ref                                                                                        |
| `map_npcs`           | npc_id, zone_id, tile_x, tile_y, trigger_type (talk \| sight_auto), facing, sight_range (si sight_auto), sight_auto_result (battle \| block), repeats (bool), unlock_conditions (Condition[], optionnel), dialogue_ref |
| `quests`             | quest_id, name, zone_ids[], steps[] (step_id, label)                                                                                                                                                                   |
| `npc_quest_progress` | user_id, quest_id, current_step                                                                                                                                                                                        |
| `user_map_state`     | user_id, current_zone, avatar_x, avatar_y, unlocked_zones[], defeated_trainers[], completed_lessons[], completed_quests[], inventory[]                                                                                 |
| `srs_cards`          | user_id, card_type, due_date, stability, difficulty (champs FSRS)                                                                                                                                                      |
| `grammar_encounters` | user_id, grammar_id, first_seen_at                                                                                                                                                                                     |
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

**Modèle de condition/effet générique (ajouté 2026-07-01, étend le modèle ci-dessus — voir ADR-0003) :** un type `Condition` unique remplace les champs ad hoc (`min_kanji_studied`, `blocks_until`) partout où une porte d'accès existe (PNJ, Gym, zone CS-Kanji, étape de quête) : `kanji_count`, `item_owned`, `quest_step`, `npc_cleared`, `event_cleared`, `badge_earned`. Un tableau `Condition[]` = ET logique. Sur un `map_npcs`/`map_trainers`, `unlock_conditions` gate la **présence** de l'entité (visible et interactif), pas seulement son contenu — un PNJ dont les conditions ne sont pas remplies n'existe simplement pas sur la carte ce jour-là. Symétriquement, un type `Effect` (`advance_quest`, `grant_item`, `unlock_lesson`, `unlock_zone`) peut être attaché à un `dialogue_state` pour faire avancer le jeu quand ce texte est lu — la progression de quête est toujours **avancée explicitement par un Effect**, jamais recalculée depuis l'état du jeu. **Précisions (ajoutées 2026-07-01, en écrivant le premier vrai PNJ-quête) :** `Condition.quest_step` teste "l'étape courante est **à ce stade ou après**" (comparaison sur l'ordre des `steps[]` de la quête), pas une égalité stricte — un `state_rules` qui teste une étape antérieure reste donc vrai même une fois la quête plus avancée ; c'est voulu, ça évite d'avoir à lister une règle par étape franchie. Tous les `Effect` sont **idempotents** : `advance_quest` vers une étape déjà atteinte ou dépassée ne fait rien, `grant_item` d'un objet déjà possédé ne fait rien — reparler à un PNJ après la fin de sa quête ne peut pas déclencher deux fois la même récompense.

**Gros morceaux multi-PNJ (QG Rocket, Tour Radio, Tour Jo — ajouté 2026-07-01, voir ADR-0004) :** aucun modèle "événement" séparé n'est nécessaire. Ce sont des compositions ordinaires de `map_trainers`/`map_npcs`, enchaînées par une ou plusieurs `Quest`s pour le séquençage (Carte-clé, déguisement, mots de passe = `Condition.item_owned`/`quest_step` sur les `unlock_conditions` des PNJ suivants). Le contournement furtif d'une alarme se modélise par deux entrées de registre à la même tuile, avec des `unlock_conditions` complémentaires (présente si alarme active, absente sinon) — pas par un mécanisme dédié. Chaque bâtiment à étages (Tour Radio, QG Rocket, Tour Jo) obtient un `zone_id` par étage/salle, suivant le précédent déjà établi par `indigo-plateau-will`/`-koga`/`-bruno`/`-karen`/`-lance` (5 zone_id pour une seule salle de la Ligue) — le compte de "49 zones" grandira d'autant quand ces intérieurs seront tile-authored. Les ~17 jalons majeurs nommés (3 événements Rocket, 6 rencontres Silver, 5 Kimono Girls, 3 légendaires) gardent leurs tables dédiées (`rocket_progress`, `silver_progress`, `kimono_progress`, `legendary_progress`) plutôt que de passer par `npc_quest_progress` générique — liste assez petite et fixe pour ne pas justifier l'indirection, écrite directement par la logique de jeu quand le dernier PNJ/dresseur de l'arc est vaincu/résolu.

Le contenu pointé par `dialogue_ref` (`content/dialogues/npcs/<zone_id>/<npc_id>.json`) n'est donc pas une ligne unique mais une carte de **`dialogue_states`** keyés (ex. `intro`, `post_battle`, `blocked`, `post_event`, ou des noms d'étape de quête comme `briefed`/`waiting`), chacun paginé en courtes boîtes de texte (le joueur avance avec A, comme dans HGSS), et optionnellement porteur d'`Effect[]`. Le `dialogue_state` actif est choisi par une liste de **`state_rules`** ordonnées (`Condition[] → state`, premier match gagnant ; un `default` final), évaluées contre `user_map_state`/`npc_quest_progress`. `content/map/npcs.json` reste un registre léger (position + comportement de déclenchement + `dialogue_ref`) ; le texte japonais/anglais et les `state_rules` vivent séparément sous `content/dialogues/npcs/`. Une quête qui implique plusieurs PNJ/zones (ex. Forêt Secte) vit dans son propre fichier `content/quests/<quest_id>.json` (liste d'étapes ordonnées, surtout pour référence humaine et comme cible de `Condition.quest_step`) — chaque PNJ impliqué référence cette quête indépendamment dans ses propres `state_rules`/`effects`.

**Dresseurs et dialogue (ajouté 2026-07-01, comble un trou de la table `map_trainers`) :** un dresseur a lui aussi un `dialogue_ref`, même mécanisme `dialogue_states`/`pages`/`state_rules` que les PNJ, mais sous `content/dialogues/trainers/<zone_id>/<trainer_id>.json`. Deux états minimum : `battle_intro` (la phrase d'accroche affichée pendant la transition de combat, avant la première question) et `post_battle` (la ligne dite une fois vaincu, affichée si le joueur lui reparle ensuite — le dresseur ne redéclenche jamais le combat automatiquement après la première défaite, voir ADR-0001).

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
9. **Batch IA** — textes des premiers niveaux (Route 29 → Gym 3), calibrés par curriculum-checkpoints.md
10. **Tadoku graded readers** → table texts (niveaux bas)
11. **Aozora Bunko** → table texts (niveaux moyen-élevé, seuil 95% de maîtrise)
12. **NHK Web Easy** → table texts (japonais contemporain, N3–N4)
13. **Générateur de conjugaison (déterministe, script pipeline, pas d'IA)** — pour chaque verbe/adjectif conjugable de la table `words`, précalcule et stocke 3 formes conjuguées incorrectes (mauvaise terminaison godan/ichidan/irrégulier, forme て/ない/た erronée) → nouveau champ `conjugation_distractors[]`. Exécuté une fois en pipeline, jamais au runtime — même principe que kuromoji (étape 4) : tout est précalculé et stocké, le client ne fait que lire/piocher.
14. **Batch IA** — grammaire : pour chacun des 828 points Hanabira, génère 2–3 variantes incorrectes de l'exemple retenu (mauvaise particule, registre casual/formel inversé) → nouveau champ `distractors[]` sur l'entrée grammar_note (voir `content/curriculum-checkpoints.md` § Format grammar_note). Relu une fois par l'équipe de contenu, jamais régénéré au runtime.
15. **Contenu hand-written** : `/content/map/trainers.json` (depuis guidebook Prima), `/content/map/npcs.json`, `/content/dialogues/fukuda/`, `/content/curriculum-checkpoints.md`
16. **Manifest dresseurs** : `/content/map/trainers.json` — chaque entrée : `{ trainer_id, zone_id, tile_x, tile_y, facing, sight_range, role, kanji_pool[], battle_length, name }`

**Principe directeur (2026-07-01) :** aucune fonction ne génère de contenu japonais au runtime, qu'elle soit basée sur de l'IA ou sur une règle déterministe (conjugaison incluse). Tout le contenu linguistique est généré ou téléchargé **avant le lancement du jeu**, une fois, puis stocké (fichiers locaux embarqués ou base cloud Supabase — arbitrage de stockage à trancher plus tard). Le client/serveur ne fait au runtime que lire, sélectionner et mélanger des données déjà là (ex. `getDispositionChunks` mélange des `chunks[]` déjà tokenisés, il n'en génère aucun).

### Sources de Contenu

| Source                | Licence              | Usage                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guidebook Prima HGSS  | Référence uniquement | Positions dresseurs, rôles NPC, ordre des zones. Dépouillement exhaustif (rosters de dresseurs, inventaire PNJ complet par zone, bios officielles) dans `content/guidebook-adapted.md` ; Mont Gris/Red absent de ce guide (volume Johto uniquement) — complété par recherche web, voir le fichier pour les sources externes utilisées. |
| Kanjidic2             | CC BY-SA 3.0         | Données kanji                                                                                                                                                                                                                                                                                                                          |
| KanjiVG               | CC BY-SA 3.0         | Ordre des traits, composants                                                                                                                                                                                                                                                                                                           |
| JMdict Extended       | CC BY-SA 3.0         | Vocabulaire                                                                                                                                                                                                                                                                                                                            |
| Yomitan JLPT vocab    | CC BY-SA 4.0         | Niveaux JLPT des mots                                                                                                                                                                                                                                                                                                                  |
| Tatoeba               | CC BY 2.0 FR         | Paires de phrases (registre neutre)                                                                                                                                                                                                                                                                                                    |
| JESC                  | CC0                  | Paires de phrases (registre parlé)                                                                                                                                                                                                                                                                                                     |
| Hanabira.org          | CC                   | Corpus grammatical (828 points)                                                                                                                                                                                                                                                                                                        |
| Aozora Bunko          | Domaine public       | Textes littéraires                                                                                                                                                                                                                                                                                                                     |
| Tadoku graded readers | CC                   | Textes de lecture graduée                                                                                                                                                                                                                                                                                                              |
| NHK Web Easy          | Libre d'usage        | Textes de japonais contemporain                                                                                                                                                                                                                                                                                                        |
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
| Leçon (écran livre dédié, mini-quiz inclus) | Piste calme dédiée à la réflexion, distincte de la carte et du combat (nouvelle composition/sélection — pas de piste HGSS existante ne convient à ce contexte inédit) |
| Combat dresseur de route       | Thème Dresseur            |
| Combat 門弟                    | Thème Dresseur            |
| Combat 師範                    | Thème Chef d'Arène        |
| Cérémonie badge                | Fanfare victoire          |
| Combat Silver                  | Thème Rival               |
| Combat Rocket                  | Thème Rocket              |
| Combat Kimono Girl             | Ecorosa ambient (ralenti) |
| Combat légendaire de grammaire | Thème Pokémon Légendaire  |
| Combat Elite Four              | Thème Elite Four          |
| Combat Lance                   | Thème Lance/Red           |
| Combat Red                     | Silence                   |
| Lecture de textes              | Ecorosa ambient           |
| Achievement débloqué           | Fanfare courte            |

---

## Curriculum Checkpoints (résumé)

Détail complet dans `content/curriculum-checkpoints.md` (57 zones depuis l'ajout de Kanto — 49 Johto/Mont Gris + 8 villes Kanto —, table de calibration complète +
inventaire PNJ sourcé par zone). ⚠️ **Table resynchronisée (2026-06-30)** — plusieurs valeurs avaient
dérivé par rapport au fichier détaillé (kanji counts et niveaux grammaticaux légèrement différents).
Corrigée ci-dessous pour reprendre le début de la fourchette de chaque zone telle que définie dans
`content/curriculum-checkpoints.md`.

| Ville           | Kanji connus | Niveau grammaire | Structures clés                                  |
| --------------- | ------------ | ---------------- | ------------------------------------------------ |
| Bourg-en-Côteau | 30           | N5 intro         | は/が/を/に/で, ます/です                        |
| Cramola         | 80           | N5/N4            | て-form, たいです, に行きます                    |
| Safrania        | 160          | N4               | てもいいですか, 〜ために, 〜かもしれない         |
| Dorado City     | 240          | N4               | てもらえますか, 〜ながら, 〜ことにしている       |
| Ecorosa         | 350          | N3               | おかげで, 〜うちに, 〜らしい                     |
| Amaris City     | 440          | N3               | てほしいのですが, 〜ことになっている, 〜しかない |
| Acajou Ville    | 530          | N3/N2            | はずだ, 〜にすぎない, 〜ものだ intro             |
| Saupoudreville  | 600          | N2               | ものの, 〜にもかかわらず, 〜ことなく             |
| Plateau Indigo  | 800          | N2/N1            | N2 complet + introduction N1                     |
| Vermeille City (Kanto, Lt. Surge) | 1500 | N1 | Entrée dans l'arc Kanto — voir § Kanto |
| Vertville (Kanto, Blue, dernier gym) | 1920 | N1 | Dernier palier avant Mont Gris — 16e badge |
| Mont Gris / Red | 2136         | N1               | Corpus Hanabira N1 complet (arc Kanto compressé la fourchette de Mont Gris, voir curriculum-checkpoints.md) |
