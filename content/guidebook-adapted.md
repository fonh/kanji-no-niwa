# Guide Johto Adapté — 漢字の庭

Référence de production pour les auteurs de contenu, le pipeline de données, et l'implémentation de la carte.

**Source originale :** Pokémon HeartGold & SoulSilver — Official Pokémon Johto Guide (Prima 2010).
**Statut de ce fichier :** adapté pour 漢字の庭. Ce n'est pas un guide joueur — c'est un document de travail interne.

**Conventions :**
- ✅ = présent dans le jeu tel quel
- 🔄 = adapté / renommé pour le jeu
- ❌ = supprimé / hors scope
- 🔒 = accessible uniquement avec un CS-Kanji
- 📍 = événement narratif ancré dans cette zone
- ⚠️ = divergence identifiée entre le PRD actuel et le guidebook source — à trancher par l'équipe, pas corrigée unilatéralement ici
- 🔍 = donnée sourcée du guidebook mais incertaine (OCR ambigu, attribution de route imprécise) — vérifier avant usage en production

**Méthode de cette mise à jour (2026-06-30, passe 1) :** le texte intégral du guidebook Prima 2010 (OCR archive.org, `scripts/sources/guidebook/guide book txt.rtfd/TXT.rtf`, ~222k lignes converties en texte) a été dépouillé zone par zone pour en extraire les rosters de dresseurs (nom + classe + ordre de rencontre), les PNJ nommés et leurs quêtes, les objets/Apricorns précisément localisés, et les beats narratifs directement réutilisables. Les zones de Pokémon (espèces, statistiques, mouvements) sont hors-périmètre et ignorées partout.

**Méthode de la passe 2 (2026-06-30, complémentaire) :** le PDF source (`scripts/sources/guidebook/(Prima 2010) - Pokemon HeartGold & SoulSilver - Johto.pdf`, 355 pages) contient en réalité une vraie couche de texte (extraite via PyMuPDF), bien plus propre que l'OCR archive.org utilisé en passe 1. **Cette extraction propre est sauvegardée dans le repo** sous `scripts/sources/guidebook/johto-guide-fulltext.txt` (texte intégral, un marqueur `===== PAGE N =====` par page) — à utiliser en priorité pour toute future recherche dans le guidebook plutôt que de regénérer l'extraction ou de repartir de l'ancien OCR. L'ancien dossier `guide book txt.rtfd/` (OCR archive.org, passe 1) et le `.gz` ABBYY ont été retirés du repo car entièrement supplantés par ce fichier. Cette passe 2 a servi à : (1) récupérer le texte perdu en passe 1 pour l'Antichambre/Elite Four (Koga/Bruno/Karen — confirmé : ce n'est pas une perte OCR, le guide ne donne simplement aucun texte de personnalité pour eux, juste des conseils de stratégie de combat) ; (2) confirmer l'absence totale de contenu Mont Gris/Red dans ce guide — c'est un guide **Johto uniquement** (355 pages), le contenu Kanto post-jeu (incl. Mont Gris) ferait partie d'un guide Prima séparé non présent dans nos fichiers ; (3) extraire la séquence complète de la Tour Jo (Bell Tower) ; (4) produire un inventaire **exhaustif** de PNJ par zone (pas seulement les PNJ "notables") — chaque zone ci-dessous a maintenant une sous-section **"Inventaire PNJ exhaustif"** listant tous les personnages rencontrés, y compris les PNJ d'ambiance sans quête, en vue de l'écriture future des dialogues de tous les PNJ du jeu adapté. Les bios officielles des personnages clés (Héros, Rival, Pr. Chen/Oak, Pr. Orme/Elm, Kurt, Eusine) ont aussi été récupérées — voir section "Personnages clés" ci-dessous.

**Méthode de la passe 3 (2026-06-30, recherche web) :** pour combler le seul vrai trou laissé par les passes 1-2 (Mont Gris/Red, absent du guidebook Johto local), une recherche web ciblée (Bulbapedia) a permis de documenter Route 28, la structure du Mont Gris et la rencontre avec Red — voir la sous-section dédiée dans `mt-silver-summit` ci-dessous, clairement marquée comme source externe (fiabilité différente d'un guidebook officiel scanné).

---

## Règles d'adaptation globales

1. **Les Pokémon n'apparaissent pas** dans 漢字の庭 — les "créatures" remplacées par des kanji personnifiés ou des dresseurs. Exceptions (corrigé 2026-07-03) : le Simularbre (Route 36) et le Ronflex (devant la Grotte Taupiqueur, Kanto — la ROM le place sur les cellules Routes 11/12, pas Route 27) restent comme obstacles bloquants ouverts par objet-clé, comme en jeu.
2. **Les objets HGSS** deviennent des récompenses de quêtes NPC ou des prix Pokéathlon — ils ne se ramassent pas par walk-over.
3. **Les CS (HMs)** sont remplacés par les 7 CS-Kanji : 飛 (vol), 水 (surf), 力 (force), 切 (coupe), 砕 (éclate-roc), 滝 (cascade), 渦 (tourbillon) — chacun **remis par le même PNJ / trouvé au même endroit que le HM d'origine** (voir § CS-Kanji — Obtention, réécrit 2026-07-03 ; jamais débloqué via le SRS). Le Simularbre et le Ronflex s'ouvrent par objet-clé (Arrosoir, radio), pas par CS.
4. **Les Gyms** fonctionnent comme dans le PRD (2 門弟 + 師範), pas comme dans HGSS (trainers de salle + leader).
5. **Le Pokégear** existe dans le jeu pour les push notifications / rappels des dresseurs de route. La radio existe via Radio Tower.
6. **Aucune mécanique de jeu HGSS non listée dans le PRD** n'est à implémenter.
7. **Déplacement à la DS** — l'avatar se déplace au D-pad (↑↓←→, une case par input). Sur mobile : D-pad virtuel à l'écran. Sur desktop : touches directionnelles ou WASD. Pas de tap-to-destination, pas de pathfinding. Bouton A = interagir avec un NPC/bâtiment adjacent.
8. **Rencontre premier passage** — quand l'avatar entre dans le champ de vision d'un dresseur **pour la première fois**, le dresseur déclenche automatiquement le combat (même règle que dans la DS). Après ce premier combat, le dresseur ne déclenche plus jamais automatiquement. S'il affiche un "!" (carte SRS due), le joueur l'engage volontairement (marcher sur lui ou appuyer A).
9. **Classes de dresseurs additionnelles** — ✅ adopté (2026-07-01) : les 16 classes ci-dessous ont rejoint les 10 du PRD (§ Dresseurs de Route), qui en liste maintenant 27 au total.
10. **PNJ récurrents transversaux** — plusieurs PNJ du guidebook réapparaissent dans de nombreuses zones selon un calendrier ou une intrigue filée (voir section dédiée). Ils sont de bons candidats pour des dresseurs/PNJ récurrents dans 漢字の庭, mais leur adaptation est optionnelle (non spécifiée par le PRD v1).
11. **Kanji « signature » (Silver, Kimono Girls)** — les jeux de 6 kanji cités par apparition sont un motif narratif d'écriture uniquement *(précisé 2026-07-05, audit 01)* : jamais un pool de combat (les combats piochent `studiedSet`), et jamais plus de 2 de ces kanji affichés comme inconnus sur une même page de dialogue (règle des 2 inconnus max de `curriculum-checkpoints.md`).

---

## Classes de dresseurs additionnelles (fusionnées au tableau PRD le 2026-07-01)

Le PRD ne couvrait à l'origine que 10 classes. Le guidebook en révèle 16 de plus, désormais intégrées (27 classes au total dans `.scratch/kanji-no-niwa/PRD.md` § Dresseurs de Route) :

| Classe (VO) | Traduction proposée | Zones où elle apparaît | Thème kanji proposé |
|---|---|---|---|
| Camper / Picnicker | Campeur / Pique-niqueuse | Route 30, 35, National Park, Route 38/45 | Nature, plein air, repas |
| Pokéfan | Passionné | Route 34, 35 | Passion, collection, admiration |
| Beauty | Coquette | Goldenrod, Lighthouse, Route 37 | Apparence, élégance, mode |
| School Kid | Écolier | Route 38/39 | Étude, école, savoir |
| Psychic | Voyant | National Park, Route 26/39 | Esprit, intuition, mystère |
| Black Belt | Karatéka | Cianwood Gym, Mt. Mortar, Route 45 | Force, discipline, arts martiaux |
| Sage | Sage | Sprout Tower | Sagesse, méditation, ancien |
| Medium | Médium | Ecruteak Gym | Esprits, au-delà, divination |
| Skier / Boarder | Skieur / Surfeur des neiges | Mahogany Gym | Glace, vitesse, montagne |
| Swimmer | Nageur/Nageuse | Route 40/41 | Mer, endurance, traversée |
| Scientist | Scientifique | Team Rocket HQ (Mahogany) | Recherche, machine, secret |
| Poké Maniac | Collectionneur | Union Cave (hors scope), Route 42/43, Mt. Mortar | Collection, curiosité |
| Super Nerd | Intello | Goldenrod, Mt. Mortar | Connaissance, logique |
| Gentleman | Gentleman | Lighthouse, Goldenrod | Politesse, fortune, élégance |
| Twins | Jumeaux/Jumelles | Route 37, Dragon's Den | Duo, miroir, symétrie |
| Ace Trainer (déjà au PRD) | Dresseur Ace | Toutes zones avancées | Tier JLPT de la zone, N3+ |

---

## PNJ récurrents transversaux (sourcés du guidebook)

Ces personnages traversent plusieurs zones dans le jeu original. Adaptation optionnelle (non requise par le PRD v1) mais documentée ici car réutilisable pour des quêtes filées multi-zones.

- **"Photographe itinérant"** (orig. Photographer Cameron) — apparaît dans une dizaine de zones différentes selon un calendrier hebdomadaire fixe (ex. mardi/jeudi/samedi sur telle route, lundi/mercredi ailleurs), seulement après le badge de Doublonville/Goldenrod. Bon candidat pour un PNJ "carnet de voyage" qui débloque des fragments de lore/texte au fil des jours.
- **"Le chasseur de légende"** (orig. Eusine) — rencontré à Tour Embrasée (Ecruteak/Burned Tower), Irisia (Cianwood) et Route 42. Obsédé par la poursuite d'un kanji-esprit légendaire (orig. Suicune) ; tient le mystère non résolu de "qui est son grand-père" — un fil narratif multi-zones jamais bouclé dans le jeu original, réutilisable comme quête de lore ouverte.
- **"Le gardien de réserve"** (orig. Baoba) — rencontré Route 39, rappelle plus tard par téléphone, puis revu à l'entrée de la Safari Zone (zone hors-scope dans 漢字の庭, donc ce fil est probablement à couper ou à transformer en simple PNJ ambiant).
- **Bill** (déjà cité dans le PRD comme inventeur du PC) — rencontré au Centre Pokémon d'Ecruteak puis revu à Goldenrod ; structure "rencontré ici, payoff ailleurs" réutilisable pour un PNJ de leçon différée.
- **Frères/sœurs du jour** (orig. Day-of-the-Week Siblings) — 7 PNJ dispersés à travers Johto (Route 32 ×2, Route 29, Route 36, Route 40, Lac Colère, Ebènelle), chacun visible un seul jour de la semaine, donnant un objet à la première rencontre. Une maison sur Route 26 contient un carnet qui les liste tous. **Mécanique optionnelle v2** : pourrait devenir un système de "leçon hebdomadaire" calé sur le jour réel (cohérent avec la boucle quotidienne SRS du PRD), mais n'est pas dans le scope v1.
- **Kurt** — voir azalea-town ci-dessous pour le système Apricorn → Boule complet (sourcé et corrigé).
- **Lance** — fil narratif majeur : rencontré au Lac Colère (après l'événement Gyarados rouge) → accompagne le joueur au QG Rocket de Mahogany Town → réapparaît à l'Antre du Dragon où l'on apprend qu'il est le petit-fils du Maître du Dragon et le frère aîné de Clair. Cette parenté Lance/Clair/Maître est un fil filé sur 3 zones, à préserver si possible dans l'adaptation (déjà esquissé par le PRD via le double combat Lance+joueur vs Ariana).

---

## Personnages clés — Bios officielles (sourcées, passe 2)

Le guide consacre une double-page "Heroes and Allies" à de courts portraits-personnalité. Seuls 6 personnages ont une vraie phrase de caractérisation ; tous les autres (8 Champions d'arène, Conseil 4, Lance, 4 Exécutifs Rocket) n'ont qu'une carte nom+titre, sans texte de personnalité — leur caractérisation vient uniquement des beats narratifs au fil des zones (déjà documentés zone par zone ci-dessous).

| Personnage (VO) | Bio officielle (texte source, traduit) |
|---|---|
| **Héros** (garçon/fille) | "Un garçon ou une fille qui aime les Pokémon. Devenu l'assistant du Pr Elm, tu pars à l'aventure pour affronter la Ligue Pokémon et compléter le Pokédex." |
| **Rival** | "Ce gamin au sang chaud considère les Pokémon comme de simples outils. Il croise sans cesse ton chemin et te défie en combat." |
| **Professeur Oak** | "Un chercheur en Pokémon de grande renommée. Ayant vu ton talent, il te demande de l'aider à réaliser son rêve de longue date : compléter le Pokédex." |
| **Professeur Elm** | "Un chercheur en Pokémon de Johto. Il est connu dans le monde entier comme une autorité sur l'évolution des Pokémon." |
| **Kurt** | "Un artisan de Poké Balls qui vit à Azalea Town. Apporte-lui des Apricorns, et chaque jour il te fabriquera une Poké Ball de haute qualité." |
| **Eusine** | "Un dresseur qui parcourt la région de Johto à la recherche du Pokémon Légendaire Suicune." |

**Note pour l'équipe contenu :** ces 6 bios sont le matériau le plus direct pour calibrer le **ton** des personnages équivalents dans 漢字の庭 (Fukuda ↔ aucun équivalent direct, mais le ton "mesuré, observateur" du PRD est cohérent avec l'absence de blurb pour les figures d'autorité gardées en retrait ; Silver ↔ Rival ; Kurt reste Kurt ; Eusine ↔ "le chasseur de légende"). Les Champions d'arène/Conseil 4/Exécutifs Rocket n'ayant aucune bio officielle, leur personnalité dans 漢字の庭 est entièrement à la discrétion de l'équipe — rien à "trahir" en restant libre sur ce point.

### Itinéraire de référence (Recommended Route, 79 étapes — condensé)

Le guide présente l'intégralité du jeu comme un itinéraire numéroté de 79 étapes, chaque étape listant les beats clés (objets, PNJ, combats de rival, badges). C'est l'ossature narrative complète du jeu original — utile comme **check-list de cohérence** pour s'assurer qu'aucun beat majeur n'est oublié dans l'adaptation. Résumé (étapes regroupées par zone, détail complet dans les sections zone par zone ci-dessous) :

Bourg Geon (starter, Pokégear) → Route 29 → Ville Griotte (Running Shoes/Map Card) → Route 30 (Apricorn Box, Mystery Egg, Pokédex) → Ville Griotte (rival #1) → Bourg Geon (mom, vol révélé) → Route 29 (Poké Balls) → Route 31 (Vs. Recorder) → Mauville (Sprout Tower) → Tour Grospignon (Elder, TM70 Flash) → Grotte Sombre → Mauville (Egg, Kimono Girl #1 Zuki, **Gym 1 Falkner**) → Route 36 (Rock Smash) → Ruines Arcaniques (puzzle 1) → Route 32 (Old Rod) → Union Cave (hors scope) → Route 33 → Ecorcia (Team Rocket, Kurt) → Puits Ramoloss (Proton) → Ecorcia (Apricorn Ball, rival #2, **Gym 2 Bugsy**) → Forêt Secte (Farfetch'd, Cut, Kimono Girl #2 Naoko) → Route 34 (Day Care) → Doublonville (Fashion Case, Coin Case, Bicycle, Radio Card, Blue Card, SquirtBottle, **Gym 3 Whitney**) → Route 35/Parc National/Pokéathlon (Magnus, Apriblender, jersey) → Route 36 (Sudowoodo, Berry Pots) → Rosalia (Bill, Dowsing MCHN, Kimono Girl #3 Miki, Surf) → Tour Embrasée (rival #3, Raikou/Entei/Suicune libérés) → Rosalia (**Gym 4 Morty**) → *carrefour Acajou/Oliville* → Route 38/39 (Baoba, Moomoo Farm) → Oliville (Good Rod) → Phare (quête Jasmine/Amphy) → Route 40 → Irisia (Secret Potion, Suicune/Eusine, HM Fly, **Gym 5 Chuck**) → Doublonville (Eevee de Bill) → Phare (potion livrée) → Oliville (**Gym 6 Jasmine**) → Route 42 (HM Strength, Eusine) → Mont Mortier → Acajou Ville (RageCandyBar) → Lac Colère (Gyarados rouge, Lance) → Route 30 (Exp. Share) → Acajou Ville (escalier caché) → Repaire de Mékanos (Petrel, Ariana+Lance, Whirlpool) → Ebènelle (**Gym 7 Pryce, Gym 8 Clair**) → Doublonville (déguisement Rocket) → Tour Radio (rival, Petrel, Basement Key) → Tunnel de Doublonville (Kimono Girl #4 Kuni, rival, Card Key) → Tour Radio (Proton, Ariana, Archer, Rainbow Wing) → Acajou Ville → Route 44/Chemin Glacé (HM Waterfall, Kimono Girl #5 Sayo) → Antre du Dragon (quiz du Maître, Rising Badge, Dratini) → Bourg Geon (Master Ball) → Mont Mortier (Karate King) → Rosalia (gauntlet des 5 Kimono Girls, Clear Bell) → Tour Jo (Ho-Oh) → Route 27/Chutes de Tohjo/Route 26 → Route de la Victoire (rival #5) → Plateau Indigo (Conseil 4 + Lance, Hall of Fame).

**Lecture utile pour le contenu :** la structure narrative originale a exactement **5 combats de rival** (Ville Griotte, Ecorcia, Tour Embrasée, Tunnel de Doublonville, Route de la Victoire) — le PRD en prévoit 6 ("Silver — 6 Rencontres"). Ce n'est pas une erreur à corriger : le PRD ajoute déjà une rencontre supplémentaire (#6, post-Red, optionnelle) qui n'a pas d'équivalent dans le jeu d'origine — cohérent avec l'intention narrative de prolonger l'arc Silver au-delà du jeu de base.

---

## Zone par Zone

### new-bark-town — Bourg Geon

**HGSS original :** ville de départ. Maison du joueur, labo du Professeur Elm, maison de Lyra/Ethan.

**Dans 漢字の庭 :**
- ✅ **Dōjō de Fukuda** (remplace le labo Elm) — point de départ, écran d'onboarding, retour entre les leçons
- ✅ **Maison de Fukuda** — tappable pour accéder à `/sensei`. Post-game : fenêtre allumée en permanence.
- ✅ **Maison de Mom** — réintroduite (2026-07-01). ⚠️ **Corrige une incohérence** : la version précédente de cette section supprimait la maison du joueur ("la ville entière est le home narratif") tout en gardant Mom dans l'inventaire PNJ ci-dessous — elle n'avait alors plus aucun lieu où apparaître sur la carte. Mom y est un PNJ ambiant (`trigger_type: talk`, un seul état `intro` pour l'instant), première ligne de dialogue du jeu entier — voir `content/dialogues/npcs/new-bark-town/mom_new_bark.json`.
- 🔄 **Panneau de départ** (Route 29 est) — tapable, montre la première leçon complétée. Apparaît uniquement post-Red.
- 📍 Onboarding (Fukuda + leçon 一), événement seuil rank 4 (note de Fukuda sur la carte), Prof Elm apparition post-Lance
- 🔒 Route 27 (est) → Plateau Indigo : accessible via 水 CS-Kanji (Surf sur la rivière)

**Bâtiments sur la carte :** Dōjō Fukuda, Maison Fukuda, Maison de Mom, Panneau Route 29 (ouest), Accès Route 27 (est, 🔒水)

**Sourcé du guidebook — PNJ clés (rôle d'origine → matériau réutilisable) :**
- **Mom** — premier PNJ parlé ; signale que "Elm a demandé après toi" → bon modèle pour la toute première ligne de dialogue de Fukuda.
- **Professeur Elm** — fait choisir un starter parmi 3 Poké Balls (n'a pas d'équivalent direct ici, mais le moment "choix initial" est un bon modèle pour l'onboarding) ; envoie en mission vers "Mr. Pokémon" (= analogue possible de Fukuda recevant un mystérieux paquet) ; appelle paniqué quand son labo est cambriolé par un garçon roux (= graine du fil Silver).
- **Lyra/Ethan** (rival/mentor) — voisin·e, laisse un mail dans le PC pour motiver l'aventure ; revu Route 29 puis Route 31.
- **Policier** — enquête sur le cambriolage, demande au joueur de décrire le garçon roux (Silver).
- Tagline d'origine : *"The Town Where the Winds of a New Beginning Blow"* — bon residu pour la tagline française de Bourg Geon.

**Items HGSS conservés comme référence narrative :**
- Pokégear → donné par Fukuda au début (onboarding), sert aux push notifications
- Master Ball → remplacée par un item narratif (diplôme/sceau) donné par Elm après les 8 印

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Mom** — rdc de la maison. Annonce qu'Elm demande après le joueur ; débloque sauvegarde/Sac/Carte Dresseur. Donne le Pokégear après la 1ère course. Plus tard propose de gérer une épargne sur les gains de combat.
- **Lyra/Ethan** — 2F de sa maison, avec Marill. Déjà dresseur·euse, joue les mentors. Laisse un mail sur le PC du joueur ("tu as du courrier", motivant, tampon Marill). Revue Route 29 (apprend à attraper), Route 31 (donne le Vs. Recorder).
- **Professeur Elm** — explique l'intérêt de laisser un compagnon hors de sa Ball ; fait choisir parmi 3 Poké Balls ; envoie en mission chez Mr. Pokémon. Sort paniqué du labo pour vérifier son numéro dans le Pokégear avant Route 29. Reçoit l'œuf mystère, conseille de défier les Gyms. Donne l'Everstone après éclosion de Togepi, la Master Ball après les 8 badges. Mentionne plus tard les Kimono Girls à Rosalia.
- **Policier** — présent au labo après le vol ; demande le nom du garçon roux une fois le joueur revenu de son premier affrontement avec lui.
- **Rival (Silver)** — aperçu en train d'espionner le labo (vol) ; confronté plus tard sur Route 29/Ville Griotte.
- **Assistant du Pr. Elm** — comptoir du Mart, garde l'œuf mystère en sécurité jusqu'au 1er badge.
- Aucun dresseur de combat en ville (zone de départ).

---

### route-29 — Route 29

**HGSS original :** première route, va de New Bark Town à Cherrygrove City.

**Dans 漢字の庭 :**
- ✅ Route principale avec 8–10 positions de dresseurs (trainers SRS)
- 📍 Tutoriel de marche avec Fukuda (premiers 3 mouvements de l'avatar)
- 📍 Événement seuil rank 7 : Silver lettre 2 apparaît au Pokémon Center de la zone suivante
- Classe de dresseurs : Gamin, Fillette, Oiselier (classes les plus simples)
- Dresseur spécial (1 sur 5) : actif dès la première session

**Accès :** libre depuis New Bark Town (ouest). Pas de CS requis.

**Sourcé du guidebook :**
- Pas de dresseur nommé sur cette route dans le texte d'origine (trop tôt — pas encore de Poké Balls) ; le PRD peut donc librement inventer les 8–10 dresseurs SRS.
- **Frère/sœur du jour Tuscany** (mardi) — PNJ spécial, pas un dresseur de classe standard. Bon candidat pour un dresseur-leçon "calendaire" optionnel (voir section PNJ récurrents).
- 🔍 Une grille au milieu de la route mène vers "Route 46" (zone hors-scope, voir Zones absentes), bloquée par un rebord infranchissable — beat "reviens plus tard" réutilisable comme tease visuel non bloquant.
- Tagline tutoriel d'origine : "élève tes kanji pour qu'ils soient forts", "ramasse les objets en chemin" — déjà couvert par le tutoriel de marche du PRD.

**Objets HGSS à garder en lore :** le panneau d'entrée de Johto ("Vous entrez dans Johto") → texte de panneau lisible par le joueur (N5, hiragana, tutoriel lecture).

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Lyra/Ethan** — attend sur la route une fois l'œuf mystère livré ; apprend au joueur à attraper (premier tutoriel de capture).
- **Frère/sœur du jour Tuscany** — visible uniquement le mardi, et seulement après le badge de Mauville ; donne TwistedSpoon (objet à équiper).
- Aucun dresseur nommé sur cette route dans le texte source (zone trop précoce — pas encore de Poké Balls). Le PRD peut inventer librement les 8–10 dresseurs SRS.

---

### cherrygrove-city — Ville Griotte

**HGSS original :** première ville avec Pokémon Center, Mart, accès mer.

**Dans 漢字の庭 :**
- ✅ **Pokémon Center** — Mode Direct (Start Session), soin narratif, accès `/library`
- ❌ Pokémart simplifié — pas de système d'achat dans le jeu
- 🔒 Accès mer (Route 40 direction) → nécessite 水 CS-Kanji, débloqué bien plus tard
- Trainers de route : Route 29 continue, classes Gamin/Fillette

**Bâtiments sur la carte :** Pokémon Center, Accès Route 30 (nord)

**Sourcé du guidebook :**
- ✅ **Premier combat de rival** a lieu ici dans le jeu original (le garçon roux, révélé comme "Silver" après avoir fait tomber sa carte de dresseur), juste après la visite chez Mr. Pokémon — c'est exactement le lieu de la ligne 1 de la table PRD "Silver — 6 Rencontres" ("Ville Griotte, retour du chemin").
- 📍 **Silver apparition #1** (Ville Griotte, retour du chemin vers Route 29) : kanji 怒、争、力、敵、速、逃. ⚠️ **Correction** : l'ancienne version de ce document plaçait l'apparition #1 à Azalea Town avec ce même jeu de kanji — c'est désormais corrigé (voir `curriculum-checkpoints.md` § Règle de Silver pour le détail complet de la renumérotation des 6 apparitions).
- **Vieux monsieur-guide** — fait visiter la ville (Centre Pokémon, Mart) ; bon modèle pour un PNJ "guide touristique" qui enseigne le vocabulaire des lieux (建物, 駅, 店…).
- Tagline d'origine : *"The City of Fragrant Flowers"*.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Guide Gent** (vieux monsieur) — accueille le joueur à l'entrée de la ville ; fait visiter Centre Pokémon/Mart/attractions. Donne les Running Shoes ("encore toutes chaudes, je viens de les enlever", blague) pour avoir tenu compagnie. Donne la Map Card juste avant que le joueur ne quitte la ville vers Route 30.
- **Rival (Silver)** — nargue le joueur puis déclenche le premier combat, après la visite chez Mr. Pokémon.
- Mart (comptoir du fond) : Air Mail, Heal Ball — stock élargi après livraison de l'œuf mystère (Poké Balls, Premier Ball offerte dès 10 achetées).
- Centre Pokémon : signature de carte dresseur au 2F ; Wi-Fi Club au sous-sol fermé jusqu'à Mauville.

---

### route-30 — Route 30
### route-31 — Route 31

**HGSS original :** routes verticales menant à Violet City. Route 31 a Dark Cave (grotte).

**Dans 漢字の庭 :**
- ✅ Positions dresseurs sur les deux routes (5–6 par route)
- 🔄 Dark Cave (entrée sur Route 31) → **Grotte Sombre** sur la carte, décor uniquement en v1, intérieur non jouable
- 📍 Route 31 : Lyra/Ethan (NPC fixe) donne un item d'accueil une seule fois
- Classe dresseurs : Gamin, Campeur, Fillette, puis dès R31 : Sage (NPC ambiant)

**Sourcé du guidebook — dresseurs (ordre d'apparition) :**
- Route 30 : 🔍 **Insectophile Wade**, **Insectophile Don** (Attrapeur) — attribution nom/classe incertaine dans l'OCR mais classe confirmée.
- Route 31 : **Gamin Mikey**, **Gamin Joey** — "Gamin Joey" est un personnage culte de la communauté Pokémon (apparitions répétées dans toute la franchise) ; clin d'œil possible si le projet veut un easter-egg.

**Sourcé du guidebook — PNJ clés :**
- **Homme dans une maison** (nord de Route 30) — donne l'**Apricorn Box** (objet-clé qui débloque la cueillette d'Apricorns aux arbres).
- **Mr. Pokémon** — vit en bout de Route 30/31, confie un "œuf mystère" au joueur ("je le garde pour un ami à Ecruteak") — bon modèle pour le déclencheur de quête initiale.
- **Professeur Oak** — présent chez Mr. Pokémon, anime ensuite une émission radio de conseils ; figure de mentor à distance.
- Route 31 : **un jeune homme près d'un Apricorn noir** confie une quête de livraison ("porte ce message à mon contact") contre récompense — modèle de quête-courrier simple.
- "Lisez les panneaux" est un conseil explicite du guide — bon hook pour des leçons de lecture environnementale.
- Grotte Sombre (Dark Cave) : entrée confirmée précisément sur Route 31 ; zone à deux entrées (Violet City / Ebènelle) traversée par un long tunnel — gating à deux temps (1ère traversée demande peu, 2e traversée demande plus) → bon modèle pour un "retour avec nouvelles connaissances" si jamais réactivé en v2.

**Inventaire PNJ exhaustif (passe 2, source PDF — corrige et précise la passe 1) :**
- **Dresseurs confirmés** : Route 30 = **Bug Catcher Wade**, **Youngster Joey** ; Route 31 = **Bug Catcher Don**, **Youngster Mikey** (la passe 1 avait l'attribution inversée et incertaine — corrigé ici par lecture directe du texte propre).
- **Mr. Pokémon** — maison en bout de Route 30, confie le Mystery Egg ("je le garde pour un ami à Rosalia") ; redonne l'Exp. Share bien plus tard contre l'écaille du Lac Colère.
- **Professeur Oak** — chez Mr. Pokémon, donne le Pokédex, enregistre son numéro au Pokégear ; anime ensuite une émission radio "Pokémon Talk".
- **Homme dans une maison** (Route 30) — donne l'Apricorn Box (objet-clé, obtenu même sans lui parler directement).
- **Jeune homme près de l'Apricorn noir** (Route 31) — quête courrier : apporter un compagnon-courrier nommé "Kenya" en échange de TM44 Rest.
- **Dresseurs génériques** alignés côté ouest de Route 30, certains proposent un échange de contact après combat (objets en rappel).
- Arbres Apricorn confirmés : Vert (près de la maison de l'homme), Rose (devant chez Mr. Pokémon), Noir (Route 31, près du jeune homme).

---

### violet-city — Mauville

**HGSS original :** première ville avec Gym (Falkner, vol). Sprout Tower au nord. Dark Cave au nord-est.

**Dans 漢字の庭 :**
- ✅ **Gym Falkner** — Arène physique, 2 門弟 + 試練 空の道, 印 n°1
- ✅ **Pokémon Center** — Mode Direct
- ✅ **Sprout Tower** — bâtiment tappable (accès narratif, pas de second dungeon)
- 📍 Kimono Girl #1 (Zuki) dans la ville — 意味の道, kanji 意味感知思解
- 📍 NPC Hiker N5/N4 : "山の上に赤い石があります。とってきてください！" → fetch quest vers Sprout Tower
- Accès nord : Route 36 (débloquée après 試練 Falkner)
- Accès est : Route 31

**Bâtiments sur la carte :** Gym Falkner, Pokémon Center, Sprout Tower, Entrée Route 31 (est), Entrée Route 36 (nord)

**Sourcé du guidebook — dresseurs (Gym Falkner) :** **Dresseur d'Oiseaux Abe**, **Dresseur d'Oiseaux Rod** gardent l'accès à Falkner — confirme la structure "門弟 avant le 師範" du PRD.

**Sourcé du guidebook — PNJ clés & confirmation Kimono Girl #1 :**
- ✅ **Zuki** est bien la première Kimono Girl rencontrée dans le jeu original, vue juste devant le Poké Mart de Violet City — le PRD/doc actuel est correct sur ce point.
- **L'École Pokémon d'Earl** — un instituteur ambulant, trouvé errant entre le Gym et le Mart plutôt qu'à son école — bon modèle pour un PNJ-leçon qu'il faut "aller chercher" avant qu'il enseigne.
- **Garçon près du Mart, agité** — rapporte avoir vu "un arbre qui bouge" : c'est le teaser du Sudowoodo de Route 36 (= l'Obstacle 1 du PRD, 木). Confirme que le teaser doit être posé ici, à Mauville, avant la résolution sur Route 36.
- **Assistant du Professeur Elm** (dans le Mart) — rend l'œuf mystère au joueur après le 1er badge.
- ⚠️ Tagline d'origine : *"The City of Nostalgic Scents"* / "ville qui chérit son passé" — toits traditionnels rouge/violet. Bonne assise pour un thème "Japon ancien / temple" sur Mauville, cohérent avec Tour Grospignon juste au nord.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Homme à lunettes noires** — bloque l'entrée du Gym tant que Tour Grospignon n'est pas visitée.
- **Earl** — instituteur de "l'École Pokémon", trouvé errant entre le Gym et le Mart plutôt qu'à son école ; le joueur doit le ramener pour "commencer les cours".
- **Garçon blond** — près du Centre Pokémon, échange des Éclats (obtenus au Marteau-Piqueur sur des rochers) contre des lots de 3 Baies.
- **Garçon côté est de l'École** — invite à former un "groupe" (fonctionnalité Union Room).
- **Jeune homme en haut de l'escalator ouest** (Centre Pokémon) — personnalisation de l'avatar Wi-Fi.
- **Garçon à lunettes** — maison près du Centre Pokémon, PNJ d'échange (Bellsprout-analogue contre Onix-analogue) — un des 4 échanges de Johto.
- **Garçon près du Mart** — agité, "j'ai vu un arbre qui bouge" → teaser direct du Sudowoodo de Route 36.
- **Teala** — sous-sol du Centre Pokémon, donne le Pal Pad (Wi-Fi Club) une fois le 1er badge en poche.
- **Kimono Girl (Zuki)** — juste devant le Mart, juste après que le joueur récupère l'œuf ; lui demande d'en prendre soin, laisse entendre qu'elle sait déjà ce qu'il contient.
- Mart (comptoir du fond) : Heal Ball, Net Ball, Tunnel Mail.
- **Gym Falkner — dresseurs** : Bird Keeper Rod, Bird Keeper Abe avant Falkner. Récompense : Zephyr Badge (Rock Smash en exploration, dresseurs échangés jusqu'au niv. 20 obéissent) + TM51 Roost.

---

### sprout-tower — Tour Grospignon

**HGSS original :** tour à 3 étages avec Sages. Bellsprout géant au centre.

**Dans 漢字の庭 :**
- 🔄 Bâtiment tappable depuis la carte de Mauville
- ✅ **Inscription ancienne** lisible en japonais (niveau N5/N4) — quête NPC Violet City "aller lire l'inscription"
- 📍 Lore : les Sages de la tour gardent les premiers kanji cursifs de Johto
- Pas de trainers internes en v1 (l'intérieur est une scène narrative statique)

**Sourcé du guidebook :**
- Dresseurs internes (3 étages) : **Sage Troy**, **Sage Jin**, **Sage Nico**, puis au sommet **Ancien Li** qui bat le joueur et révèle que Silver est présent au même étage, en train de se faire sermonner sans écouter — bon modèle pour une rencontre Silver "passive" (il est là pour la même raison que le joueur, mais ne l'affronte pas).
- Tagline d'origine : *"Eliminate doubt through training"* — correspond très bien au thème 修行 (entraînement/ascèse) déjà esquissé par le PRD pour cette tour.
- Un pilier central traverse les 3 étages et "résonne d'un son grave" — détail d'ambiance réutilisable pour le sound design.

**Inventaire PNJ exhaustif (passe 2, source PDF — précise les noms) :**
- 6 Sages confirmés répartis sur les 3 étages : **Sage Neal, Sage Troy, Sage Jin, Sage Nico, Sage Edmond, Sage Chow** (la passe 1 n'en avait listé que 3 ; liste complète ici).
- **Ancien Li** — sommet (3F), bat le joueur, donne TM70 Flash et explique la technique.
- **Rival (Silver)** — présent au 3F, sermonné par l'Ancien Li sans l'écouter ; scène, pas de combat.
- Items : Escape Rope, ParlyzHeal, Potion, TM70 Flash, X Accuracy.

---

### route-32 — Route 32

**HGSS original :** longue route vers Azalea. Ruins of Alph à l'est.

**Dans 漢字の庭 :**
- ✅ Positions dresseurs (6–8 slots)
- 📍 **Événement Rocket #1 — Éclaireurs** : bloque la descente vers les Ruines d'Alph jusqu'à être battu. Kanji N5 basics (日、本、人、字、語). Gate : bloque l'accès aux Ruines Arcaniques.
- Classe dresseurs : Gamin, Campeur, Marin (à partir d'ici)

**Sourcé du guidebook — dresseurs :** **Pêcheur Henry**, **Pêcheur Justin**, **Pêcheur Ralph**, **Dresseur d'Oiseaux Peter** ; 🔍 **Frère/sœur du jour Frieda** (vendredi). Le guide dit "plus de dix dresseurs sur les Routes 32 et 33 combinées" — cohérent avec les "6-8 slots" déjà prévus au PRD pour cette seule route.

**Sourcé du guidebook — PNJ clés / objets :**
- Un homme offre une **Graine Miracle** (objet à équiper) en chemin — petit beat de "cadeau gratuit, sans condition".
- Un pêcheur dans le Centre Pokémon donne la **Vieille Canne** — confirme l'entrée du PRD ("Pêcheur sur Route 32 donne la Vieille Canne → Kanji de l'eau + vocabulaire de la pêche").
- 🍎 **Apricorn Noir et Apricorn Rose** confirmés sur Route 32 (première visite).

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Dresseurs confirmés** : Youngster Albert, Picnicker Liz, Camper Roland, Youngster Gordon, Fisherman Henry, Fisherman Justin, Fisherman Ralph, Bird Keeper Peter, Hiker Anthony.
- **Frère/sœur du jour Frieda** (vendredi) — chemin étroit au sud, derrière le Centre Pokémon ; donne Poison Barb.
- **Homme sur le chemin** — donne une Graine Miracle (objet à équiper).
- **Jeune homme près du Centre Pokémon (Route 33 côté)** — tente de vendre une "queue de Ramoloss savoureuse" pour ¥1 000 000 — PNJ comique, le joueur décline.
- **Pêcheur dans le Centre Pokémon** — donne la Vieille Canne.
- **Homme au-delà d'un point coupable** — donne TM05 Roar une fois 力 débloqué.
- **Homme près du pêcheur** — demande si le joueur collectionne les Apricorns ; répond oui → 2 Lure Balls.
- Le guide précise "plus de dix dresseurs sur les Routes 32 et 33" au total.

---

### ruins-of-alph — Ruines Arcaniques

**HGSS original :** ruines avec puzzles Unown. Zone à énigmes linguistiques.

**Dans 漢字の庭 :**
- 🔄 Zone accessible après avoir battu l'événement Rocket Éclaireurs sur Route 32
- 📍 **Événement Rocket #2 — Pillage des Inscriptions** (optionnel) : kanji 文、字、古、記、史
- ✅ **Inscriptions Unown** : 5 panneaux lisibles en japonais (N4, furigana sur kanji non étudiés). Tapper → lore entry sur l'écriture ancienne.
- ❌ Zone Safari supprimée — les Ruines sont une zone narrative, pas de mécanique de capture
- **Reward Rocket #2 :** lore entry "L'écriture avant les kanji"

**Bâtiments sur la carte :** Entrée Ruines (depuis Route 32), 5 inscriptions Unown tappables

**Sourcé du guidebook — confirmation forte du concept :**
- Le mécanisme d'origine est **exactement** un puzzle de glyphes : 4 entrées, chacune avec un panneau-énigme décrivant un être par ses traits ("des yeux dans le dos", "volait dans les cieux anciens sans rien craindre", "ailes arc-en-ciel", "dix bras, se nourrissait de plancton"), puis un second panneau inscrit en **lettres Unown** (un alphabet-image de 26 lettres + ! et ?) qui indique l'objet/la capacité nécessaire pour avancer. C'est un calque presque parfait du concept "inscription ancienne en script de kanji" déjà esquissé au PRD — à utiliser comme référence directe pour écrire les 5 inscriptions.
- Un PNJ dans la salle souterraine remet un **"Rapport Unown"** après le 1er puzzle résolu — équivalent possible d'un "journal de fouille" qui se remplit au fil des inscriptions lues.
- Le Pokégear capte une interférence radio étrange à proximité des Unown — détail d'ambiance réutilisable.
- Sortie est → Route 32 (déjà cohérent avec le PRD).

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Jeune homme dans la salle souterraine** — admiratif d'avoir résolu le 1er puzzle, remet le "Rapport Unown" (journal qui s'auto-remplit).
- **Chercheurs** (PNJ ambiants, pluriel) — au Centre de Recherche des Ruines, discutent des découvertes au fil des puzzles résolus.
- **Psychic Nathan** — dresseur de combat, zone du Centre de Recherche/bordure Union Cave.
- Séquence complète du puzzle confirmée en 4 temps (un par entrée : NE, SE, NO, SO), chaque entrée nécessitant un objet/CS différent pour être atteinte dans l'ordre (aucun objet → Coupe → Union Cave → Force) — bon calque pour séquencer les 5 inscriptions du PRD en paliers de difficulté croissante plutôt que toutes accessibles d'un coup.

---

### route-33 — Route 33

**HGSS original :** courte route entre Ruins of Alph et Azalea.

**Dans 漢字の庭 :**
- ✅ 4–5 positions dresseurs
- Classe : Marin, Campeur
- 🍎 Apricorn **Noir** ×1 (tile au sud vers Azalea) — donne à Kurt → Boule de Rappel
- ❌ Union Cave (HGSS) — cette grotte relie Azalea à Goldenrod dans HGSS mais **n'est pas dans les 49 zones**. La traversée Azalea→Ilex Forest→Route 34 remplace ce segment. Voir section "Zones absentes (v1)".

**OST :** Disc 1 / 33 — Azalea Town (continuation)

**Sourcé du guidebook :**
- ⚠️ Aucun dresseur nommé spécifiquement à Route 33 dans le texte source — les noms (Henry/Justin/Ralph/Peter/Frieda) sont rattachés au bloc combiné "Routes 32/33" sans split net. Le PRD peut conserver ses 4–5 slots inventés.
- ⚠️ **Aucun Apricorn Noir n'est confirmé spécifiquement sur Route 33** dans le guidebook (le Noir trouvé est sur Route 32 et au Lac Colère/Route 43, voir section Apricorns ci-dessous) — la mention actuelle "Apricorn Noir Route 33" semble être une approximation du doc précédent ; à vérifier avant intégration en `apricorns.json`.
- Détail d'ambiance confirmé : il pleut en permanence sur Route 33 ("toujours sous la pluie") — bonne texture pour un reskin "route grise et mouillée".

**Inventaire PNJ exhaustif (passe 2, source PDF) :** confirmé — aucun PNJ ou dresseur nommé spécifiquement attribuable à Route 33 dans le texte propre ; tous les noms du bloc "Routes 32/33" se rattachent en fait à Route 32 (voir ci-dessus). Route 33 reste donc une route de transit pure (pluie, dresseurs génériques à inventer).

---

### azalea-town — Ecorcia

**HGSS original :** Bugsy Gym (insectes), Kurt (Pokéballs), Slowpoke Well au sud.

**Dans 漢字の庭 :**
- ✅ **Gym Bugsy** — Arène physique, 2 門弟 + 試練 虫の道, 印 n°2
- ✅ **Maison de Kurt** — Artisan Poké Ball. Bâtiment tappable : dépose des Apricorns → reçoit une item d'effet SRS après 24h (Kurt "fabrique" l'item)
- ✅ **Pokémon Center**
- 📍 **Silver apparition #2** (Ecorcia, porte ouest, après Proton/Puits Ramoloss) : kanji 強、越、勝、誇、傲、鋼. ⚠️ Renuméroté/recorrigé (voir note dans cherrygrove-city et `curriculum-checkpoints.md`).
- 📍 Événement Rocket #3 (Slowpoke Well) débloque le Gym Bugsy

**Apricorns disponibles près de la ville (map tiles) — ⚠️ voir correction complète en fin de fichier (section Apricorns) :**
- 赤 (rouge) : Route 33 N, Route 37
- 黄 (jaune) : Route 42
- 黒 (noir) : Route 32 S
- 白 (blanc) : Route 38
- bleu : Route 36

**Bâtiments sur la carte :** Gym Bugsy, Maison Kurt, Pokémon Center, Entrée Puits Ramoloss (sud)

**Sourcé du guidebook — Kurt & le système Apricorn → Boule (confirmé et corrigé) :**
Kurt est bien le forgeron d'Apricorns ; il fabrique un objet par lot (un seul type d'Apricorn par fournée, en 24h, comme prévu au PRD). Le mapping **réel et confirmé** couleur → objet, avec sa logique d'origine (utile pour écrire le texte de Kurt) :

| Couleur | Objet d'origine | Logique (texte de Kurt) |
|---|---|---|
| Blanc | Boule Rapide | "Bonne pour capturer ce qui est rapide." |
| Rose | Boule Affection | "Bonne pour ce qui est du même genre mais du sexe opposé à ton kanji-compagnon." |
| Bleu | Boule Leurre | "Bonne pour ce que tu as hameçonné à la canne à pêche." |
| Noir | Boule Lourde | "Plus efficace sur ce qui est lourd." |
| Vert | Boule Amitié | "Rend ce qui est capturé très attaché à toi." |
| Jaune | Boule Lune | "Bonne pour ce qui évolue à la pierre Lune." |
| Rouge | Boule Niveau | "Bonne pour ce qui est moins gradé que la moitié du niveau de ton kanji-compagnon." |

⚠️ Ce tableau remplace celui, incohérent en interne, de l'ancienne section "Apricorns — Distribution sur la Carte" (les couples couleur→objet n'y correspondaient pas d'une zone à l'autre). Voir la section Apricorns en fin de document pour la version corrigée complète avec localisation par zone.

**Sourcé du guidebook — autres PNJ :**
- **Le Maître du Charbon** (orig. Charcoal Man) — ses Farfetch'd-analogues se sont enfuis en Forêt Secte ; son apprenti part les chercher. Une fois la quête résolue en forêt, retour ici pour recevoir le **Charbon**. Confirme le lien Azalea ↔ Ilex Forest déjà esquissé.
- Un Sbire Rocket bloque l'entrée du Puits Ramoloss dès l'arrivée du joueur en ville — bon déclencheur visuel pour l'icône "porte verrouillée" du PRD.
- ⚠️ Lore d'origine : "C'est un garçon nommé Red qui a démantelé la Team Rocket il y a trois ans" — élément qui pourrait enrichir la confrontation finale avec Red au Mont Gris (Red aurait, dans le canon d'origine, déjà vaincu une organisation criminelle) ; à intégrer ou non selon la direction narrative voulue pour Fukuda/Red.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Gym Bugsy — dresseurs** : Bug Catcher Al, Bug Catcher Josh, Bug Catcher Benny, Twins Amy & May, avant Bugsy (Kakuna/Metapod/Scyther). Récompense : Hive Badge (Cut en exploration, échangés jusqu'au niv. 30 obéissent) + TM89 U-turn.
- **Rival (Silver)** — défi au portail ouest de la ville, vers Forêt Secte (Battle 2).
- **Charcoal Man** — sa maison : ses Farfetch'd-analogues se sont enfuis en forêt ; son apprenti part les chercher.
- **Mart** (comptoir du fond) : Bloom Mail, Heal Ball, Net Ball.
- **Table complète des Frères/sœurs du jour** (confirmée par recoupement multi-zones, utile pour une éventuelle mécanique calendaire v2) : Monica (Route 40, lundi), Wesley (Lac Colère, mercredi), Frieda (Route 32, vendredi), Sunny (Route 37, dimanche), Tuscany (Route 29, mardi), Arthur (Route 36, jeudi), Santos (Ebènelle, samedi). Tous donnent un objet à la 1ère rencontre, puis un ruban-collection une fois les 7 rencontrés. Leur maison-index commune est sur Route 26.

---

### slowpoke-well — Puits Ramoloss

**HGSS original :** Slowpoke Well — Rocket HQ locale avec Proton.

**Dans 漢字の庭 :**
- 📍 **Événement Rocket #3 — Proton — Opération Ramoloss** : kanji 捕、縛、操、支、制. Bloque l'accès au Gym Bugsy. HP battle avec Executive Proton.
- Bâtiment tappable depuis la carte de Ecorcia → ouvre l'écran de combat Rocket

**Sourcé du guidebook — structure complète de l'événement :**
- **Kurt accompagne le joueur** mais se blesse au dos en chemin et ne peut continuer — le joueur prend sa place pour la suite. Bon modèle pour transformer le combat en "le joueur agit à la place d'un mentor blessé/empêché".
- Un Ramoloss-analogue, retrouvé au fond du puits, porte un courrier : une lettre du gendre de Kurt, demandant à Kurt et au Ramoloss de "tenir le fort ensemble" — détail sentimental réutilisable comme texte de lecture courte (trophée).
- Après la défaite de Proton, ses sbires confirment que la Team Rocket, censée dissoute depuis trois ans, opère en sous-main pour le compte de son ancien chef **Giovanni** — confirme/élargit le fil "Team Rocket" déjà esquissé par le PRD (cf. Mahogany Town ci-dessous, où ce fil se referme).
- Structure à plusieurs niveaux (B1F1, B1F2, B2F) — bonne base pour un combat Rocket en plusieurs "salles" si le projet veut segmenter l'HP battle.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Kurt** — mène le joueur, se blesse au dos au pied de l'échelle, demande de continuer sans lui.
- **Sbires Rocket** ×3 — répartis B1F/B2F, combats de couloir avant le boss.
- **Executive Proton** — combat final (Zubat/Koffing) ; dialogue confirme la Team Rocket dissoute "en façade" mais agissant pour Giovanni.
- Détail confirmé : un Ramoloss-analogue au fond du puits porte un courrier — lettre du gendre de Kurt demandant à Kurt et au Ramoloss de "tenir le fort ensemble" (texte de lecture courte tout trouvé).

---

### ilex-forest — Forêt Secte

**HGSS original :** forêt avec puzzle "attraper le Farfetch'd". CS Coupe nécessaire pour le raccourci.

**Dans 漢字の庭 :**
- ✅ Décor uniquement — zone atmosphérique entre Azalea et Goldenrod
- ❌ Puzzle Farfetch'd supprimé
- ✅ Dresseurs de route (4–5 slots), classes Fillette, Insectologue
- 🔒 Raccourci nord (vers Route 34 directe) → 切 CS-Kanji requis (arbre à couper — corrigé 2026-07-03, c'était "力" du temps du modèle à 3 CS)
- 📍 **Kimono Girl #2 (Naoko)** dans la zone — 方向の道, kanji 方、向、道、来、帰、行 (thème invité pour combler le fait que sa leçon PRD est purement grammaticale — "Grammaire directionnelle 〜ていく/〜てくる" — sans pool kanji propre)

**Sourcé du guidebook — confirmation Kimono Girl & sanctuaire :**
- ✅ **Résolu (2026-07-01)** — la Kimono Girl perdue en forêt s'appelle **Naoko** dans le texte source ; PRD mis à jour pour suivre fidèlement le guidebook (voir section "Kimono Girls" en fin de document).
- 📍 **Sanctuaire de la forêt** : après avoir coupé l'arbre bloquant, le joueur découvre "un sanctuaire bâti en l'honneur du gardien de la forêt" — fort en thème pour une inscription/leçon sur le vocabulaire des kami/esprits protecteurs, cohérent avec l'esthétique "Kanji no Niwa" (jardin).
- Un jeune homme sur une corniche enseigne une technique pour "secouer les arbres" (orig. Headbutt) — détail mineur, probablement sans équivalent utile ici.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Apprenti du Maître du Charbon** — à l'entrée, enseigne la technique de capture des deux fuyards (s'approcher par derrière en les faisant se retourner).
- **Kimono Girl Naoko** — plus au nord, perdue, demande le chemin de la sortie ; le compagnon du joueur la raccompagne.
- **Jeune homme sur une corniche** (nord-est de l'arbre coupé) — enseigne Headbutt.
- Séquence complète confirmée : apprenti enseigne la technique → capturer fuyard #1 (est) → capturer fuyard #2 (plus à l'est) → retour à Ecorcia chez le Maître du Charbon → reçoit l'objet de coupe → revenir couper l'arbre → rencontrer l'homme de Headbutt → rencontrer Naoko plus au nord → sortie vers Route 34.

---

### route-34 — Route 34

**HGSS original :** route entre Ilex Forest et Goldenrod. Day Care au milieu.

**Dans 漢字の庭 :**
- ✅ 5–6 positions dresseurs
- 📍 NPC quest N4 niveau : livraison de lettre à la poste de Goldenrod
- ❌ Day Care supprimé (pas de mécanique d'élevage)

**Sourcé du guidebook — dresseurs :** **Campeur Todd**, **Policier Keith** (combat uniquement la nuit, 20h–4h — bon modèle pour un dresseur-leçon "nocturne"), **Gamin Ian**, **Pique-niqueuse Gina**, **Pokéfan Brandon**, **Gamin Samuel**, et un trio **Dresseur Ace Jenn/Irene/Kate** ("Kate et ses deux sœurs") qui attaque ensemble après une traversée d'eau — bon modèle pour un combat de groupe optionnel/caché.

**Sourcé du guidebook — PNJ clés :**
- Le couple de la pension (Day Care, supprimée dans 漢字の庭) est en réalité les **grands-parents de Lyra/Ethan** — détail de lore sans usage direct ici puisque la pension est coupée, mais pourrait inspirer un PNJ-grand-parent ambiant si le projet veut humaniser la route.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Policeman Keith** — confirmé combat uniquement nocturne (20h–4h), à l'ouest de la pension.
- **Trio Ace Trainer Jenn/Irene/Kate** ("Kate et ses deux sœurs") — combat groupé après traversée d'eau, récompense Power Herb.
- Le couple de la pension confirmé appelé "Grand-mère"/"Grand-père" par Lyra/Ethan ; lui rapporte le niveau des compagnons, elle rapporte la découverte d'œufs.

---

### goldenrod-city — Doublonville

**HGSS original :** grande ville. Whitney Gym (Normal), Radio Tower, Dept Store, Game Corner, Lottery, Bike Shop, Tunnel, Global Terminal.

**Dans 漢字の庭 :**
- ✅ **Gym Whitney** — Arène physique, 2 門弟 + 試練 常の道, 印 n°3
- ✅ **Radio Tower** — Bâtiment tappable. Buena's Password (push notification 11h00). Événement Rocket #6 (prise de contrôle par Petrel + Archer). Post-Rocket : diffuse le Prof Oak Kanji Swarm.
- ✅ **Pokémon Center**
- 🔄 **Department Store** → **Librairie de Doublonville** — bâtiment décoratif, NPC ambiant (vendeuse parle en N4)
- ❌ Game Corner supprimé
- ❌ Lottery supprimée (feature non spécifiée, supprimée du scope v1)
- ❌ Global Terminal supprimé
- 📍 Kimono Girl #4 (Kuni) — Tunnel de Doublonville, après la Card Key. Rencontre tardive (revisite de la ville pendant l'arc Tour Radio, ~560+ kanji — voir `curriculum-checkpoints.md` § "zones revisitées"), pas lors de la première visite pour le badge de Whitney. 読みの道, kanji 音訓読声言語

**Bâtiments sur la carte :** Gym Whitney, Radio Tower, Pokémon Center, Librairie (NPC déco), Entrées routes 35 (nord) et 34 (sud)

**Sourcé du guidebook — dresseurs Gym Whitney :** **Coquette Victoria**, **Fillette Carrie**, **Coquette Samantha** (🔍 possible doublon OCR Victoria/Samantha) gardent l'accès à Whitney.

**✅ Résolu (2026-07-01)** — la Kimono Girl rencontrée à Goldenrod City (dans le tunnel, après obtention de la Card Key) s'appelle **Kuni**, pas "Naomi" ; corrigé ci-dessus. PRD suit fidèlement le guidebook (voir section "Kimono Girls" en fin de document).

**Sourcé du guidebook — événement Team Rocket / Radio Tower (structure complète, plus riche que l'entrée actuelle du PRD) :**
1. La tour est entièrement occupée — un Sbire bloque l'accès, seuls les membres de la Team Rocket passent.
2. Un Sbire dans le Tunnel de Doublonville force le joueur à enfiler un **déguisement Team Rocket** (au lieu d'un vol pur et simple) — bon levier pour une mécanique "infiltration" plutôt qu'un simple combat de couloir.
3. Au 5e étage, le "Directeur" se révèle être **l'Exécutif Petrel déguisé** — sa défaite donne une **clé de sous-sol**.
4. Cette clé permet de délivrer le **vrai Directeur**, retenu en otage dans le sous-sol du Tunnel ; il remet une **Carte-clé**.
5. Au sommet de la tour (plateforme d'observation), affrontement final contre **l'Exécutif Ariana** puis **l'Exécutif Archer**, qui révèle que toute l'opération visait à diffuser un appel à leur ancien chef disparu (**Giovanni**) pour qu'il revienne.
6. ✅ **Séquence confirmée (passe 2)** : Proton **apparaît bien en combat à la Tour Radio**, mais sur le 3F (après obtention de la Card Key), aux côtés de la 2e apparition de Petrel (déguisé, tout-Poison). La passe 1 n'avait pas retrouvé cette scène (perdue dans l'OCR). Séquence Tour Radio complète et confirmée : 1F (Sbire bloque, déguisement nécessaire) → rival démasque le déguisement en chemin vers 2F (il cherche en fait Lance, pas la Team Rocket) → 3F porte verrouillée (Card Key requise, obtenue via Tunnel de Doublonville) → 5F "Directeur" = **Petrel déguisé** (Zubat/Koffing/Raticate), sa défaite donne la Basement Key → Tunnel de Doublonville B2F : vrai Directeur captif, énigme d'interrupteurs (rouge/bleu/vert, indice "vert en dernier"), **rival (📍 Silver apparition #5 — PRD : "Tour Radio B2F", lieu réel : Tunnel de Doublonville B2F)** → retour Tour Radio 3F avec la Card Key : **Proton** (Golbat/Weezing) puis re-**Petrel** (5x Koffing + Weezing, tout Lévitation) → plateforme d'observation : **Ariana** (Arbok/Murkrow/Vileplume) puis **Archer** (Houndour/Houndoom/Koffing, révèle l'objectif = rappeler Giovanni) → le vrai Directeur arrive, donne la Plume Arc-en-ciel/Argentée.
- Récompense finale : une **Plume Arc-en-ciel** ("liée à un kanji légendaire") — bon point d'ancrage pour le trophée de fin d'arc Team Rocket.

**Inventaire PNJ exhaustif (passe 2, source PDF) — ville très dense, ~30 PNJ/rôles :**
- **Bill** — Centre Pokémon (absent, parti à Rosalia) puis sa maison (donne un compagnon rare, Eevee-analogue, après l'avoir rencontré à Rosalia) ; sa petite sœur donne son numéro.
- **Mr. Game** — Game Corner, donne le Coin Case (feature de jeu d'argent hors-scope, PNJ adaptable en autre chose).
- **Personnel du Tunnel** (rotatif par jour) — Salon Pokémon (styliste sénior/junior), Herboriste, Boutique Discount — mécanique de rotation hebdomadaire, faible valeur narrative.
- **Gérant du magasin de vélos** — prête une Bicyclette gratuitement ("bonne publicité"), mentionne que la chaîne est née à Cerulean City (Kanto) ; rappelle plus tard pour offrir le vélo définitivement.
- **Fille évaluatrice d'affection** — maison au nord du Dept Store, évalue le lien avec le compagnon en tête d'équipe.
- **Réceptionniste Tour Radio** — quiz de 5 questions, réussite → Radio Card.
- **Stand Loterie** (Tour Radio 1F) — tirage quotidien contre le numéro ID du compagnon.
- **Buena** — studio radio (Tour Radio 2F), donne la Blue Card, mot de passe quotidien à deviner pour gagner des points.
- **Name Rater** — maison nord de la ville, renomme les surnoms (sauf échangés).
- **Fleuriste** (Floria) — donne le SquirtBottle une fois le badge de Gym vu.
- **Jeune homme à la grille nord** — quête courrier (objet porté par un oiseau-analogue sauvage à capturer), récompense HP Up au retour.
- **Black Belt** (Dept Store sous-sol) — bloque l'accès avec ses conteneurs, à débloquer en lui parlant.
- **Fille du 5F Dept Store** — uniquement le dimanche, donne TM27 Return si affection élevée.
- **Dresseurs Tunnel** : Poké Maniac Donald, Super Nerd Eric, Super Nerd Teru, Poké Maniac Issac.
- **Burglar Orson**, **Burglar Duncan** — Tunnel de Doublonville (combats liés à l'arc Rocket).
- **Gym Whitney — dresseurs** : Beauty Victoria, Beauty Samantha, Lass Carrie, Lass Cathy, avant Whitney (Clefairy/Miltank). Récompense : Plain Badge (Strength en exploration) + TM45 Attract.

---

### route-35 — Route 35
### national-park — Parc National

**HGSS original :** Route 35 → National Park avec Bug Catching Contest (Mar/Jeu/Sam). Pokéathlon Dome adjacent.

**Dans 漢字の庭 :**
- ✅ **Pokéathlon Dome** — Hub mini-jeux, accessible après Whitney. 4 disciplines : Reading Blitz, Word Forge, Kanji Sprint, Chasse au Trésor. Prize Shop rotatif.
- ❌ Bug Catching Contest supprimé (aucune mécanique Pokémon dans le jeu)
- 📍 Condition Chuck 試練 : `pokéathlon_score(⚙250)` — thématiquement lié aux épreuves athlétiques
- ✅ Positions dresseurs sur Route 35 (5–6 slots)
- Classe dresseurs R35 : Campeur, Marin, Jongleur

**Bâtiments sur la carte :** Pokéathlon Dome (Parc National), Entrées Route 35 (nord-est) et Route 36 (ouest)

**Sourcé du guidebook — dresseurs :** **Campeur Ivan**, **Dresseur d'Oiseaux Bryan**, **Pique-niqueuse Kim**, **Policier Dirk** (nuit uniquement), **Attrapeur Arnie**, **Cracheur de Feu Walt**, **Jongleur Irwin**, **Pique-niqueuse Brooke**, **Campeur Elliot**, **Pokéfan William**, **Pokéfan Beverly**. Le guide précise "neuf dresseurs sur Route 35" — cohérent avec les "5–6 slots" du PRD, qui peut donc en ajouter quelques-uns.

**Sourcé du guidebook — PNJ clés / ambiance :**
- **Magnus**, gérant du dôme Pokéathlon — fait visiter les lieux, anecdote comique (bras de fer gagné contre un colosse).
- Le Parc National est décrit comme une fontaine centrale entourée de parterres en forme de Poké Ball — motif visuel fort, qui pourrait devenir un véritable "jardin" littéral cohérent avec l'identité 漢字の庭.
- Un enseignant assis sur un banc, côté sud du parc, donne un objet de "priorité au tour" — pourrait inspirer un PNJ-professeur qui enseigne une astuce de jeu plutôt qu'un objet.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Dresseurs confirmés (Route 35)** : Bug Catcher Arnie, Firebreather Walt, Juggler Irwin, Policeman Dirk (nuit), Picnicker Kim, Camper Ivan, Bird Keeper Bryan, Picnicker Brooke & Camper Elliot (paire), Lass Krise, Pokéfan Beverly, School Kid Jack, Pokéfan William.
- **Vieil homme retraité** — est du dôme, record de 998 sauts consécutifs, défie le joueur de dépasser 1000.
- **Vendeur du stand Aprijuice** — ouest du dôme, donne l'Apriblender (ajouté à l'Apricorn Box).
- **Whitney** (réapparition) — accueil du Pokéathlon, donne un maillot porté automatiquement en épreuve.
- **Enseignant** — banc sud du Parc National, donne la Quick Claw.
- Concours d'insectes (mar/jeu/sam) : prix Pierre Lune (1er), Everstone (2e), Baie Sitrus (3e), lot de consolation.

---

### route-36 — Route 36
### route-37 — Route 37

**HGSS original :** Routes vers Ecruteak. Route 36 a Sudowoodo (bloque vers Ecruteak).

**Dans 漢字の庭 :**
- 📍 **Obstacle 1 — Simularbre/Sudowoodo (Route 36)** : kanji-monstre 木. Délogé en l'**arrosant avec l'Arrosoir** (SquirtBottle) reçu à la Boutique de Fleurs de Doublonville — comme en jeu (corrigé 2026-07-03 ; l'ancienne version "CS-Kanji 水 mastérisé" mélangeait deux mécanismes faux : ce n'est ni Surf, ni de la maîtrise SRS). Fukuda: "Ce qui ressemble à une force peut être une illusion. L'eau le sait."
- 📍 **CS-Kanji 砕 (Éclate-Roc)** donné par un garçon sur la Route 36 (guide p. 80) — première capacité d'obstacle du jeu, avant même le Simularbre
- ✅ Positions dresseurs R36 (4–5), R37 (4–5)
- Classe dresseurs : Marin, Jongleur
- 🍎 Apricorn **Rouge** ×1 R37 (tile est, vers Ecruteak) — donne à Kurt → Boule de Rappel
- 🍎 Apricorn **Bleu** ×1 R36 (tile nord du National Park) — donne à Kurt → Boule de Gel

**Note :** le Simularbre est sur Route 36 entre National Park et Ecruteak. C'est le premier obstacle-puzzle bloquant du chemin critique : l'Arrosoir (Doublonville, post-badge Whitney) doit donc être en poche avant d'atteindre Ecruteak City — même séquencement que le jeu d'origine (corrigé 2026-07-03, plus aucune condition de maîtrise).

**Sourcé du guidebook — dresseurs (Route 37) :** **Coquette Kassandra**, **Jumeaux Tori & Tia**, **Coquette Callie** ; 🔍 **Voyant Mark**, **Écolier Alan** côté Route 36 (frontière OCR avec Route 35 incertaine).

**Sourcé du guidebook — confirmation du puzzle Sudowoodo :**
- Le teaser ("un arbre qui bouge") est posé par un PNJ à Violet City (voir section violet-city), payé ici par un arbre immobile bloquant la route ; la résolution passe par un objet-arrosoir obtenu à Doublonville/Goldenrod, donné par la fleuriste après le badge de Gym. Séquence à 3 temps (teaser → blocage → résolution avec objet d'une autre ville) directement réutilisable pour l'Obstacle 1 du PRD.
- **Floria**, la fleuriste, remet des **Pots à Baies** en remerciement une fois l'obstacle résolu — anecdote, probablement sans usage direct (le jeu n'a pas de mécanique de jardinage), mais cohérente avec le thème "jardin" du titre si le projet veut une mini-feature de "soin" en v2.
- 🔍 Couleurs d'Apricorns confirmées "sur les Routes 36/37" dans le texte source mais sans détail de couleur précis dans cette zone OCR — les couleurs Rouge (R37) / Bleu (R36) actuelles du doc restent une approximation à vérifier (voir section Apricorns finale).

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Jeune homme près d'un panneau** (Route 36, ouest) — donne le CS Marteau-Piqueur (力, débloqué dès le badge de Falkner).
- **Dresseurs confirmés** : Beauty Callie, Beauty Kassandra, Twins Tori & Til, Psychic Mark, School Kid Alan (cluster Route 36/37 frontière Violet City) ; Psychic Greg (frontière Rosalia, près des Apricorns).
- **Frère/sœur du jour Sunny** (dimanche, Route 37, nord de 3 arbres Apricorn) — donne Magnet.
- **Frère/sœur du jour Arthur** (jeudi, Route 36, nord des Ruines Arcaniques) — donne Hard Stone.

---

### ecruteak-city — Rosalia

**HGSS original :** Morty Gym (Ghost), Burned Tower (ouest), Bell Tower (nord), Kimono Girls Écruteak Dance Theater.

**Dans 漢字の庭 :**
- ✅ **Gym Morty** — Arène physique, 2 門弟 + 試練 影の道, 印 n°4
- ✅ **Tour Jo** (Bell Tower) — bâtiment tappable, scène collective Kimono Girls (after all 5 beaten)
- ✅ **Tour Embrasée** (Burned Tower) — bâtiment tappable → Événement Rocket #4
- ✅ **Pokémon Center**
- 📍 **Silver apparition #3** (devant Tour Jo, studied ≥ 550) : kanji 影、闇、忘、去、断、孤. ⚠️ Renuméroté de #2 à #3 (kanji inchangé, déjà correct) — voir `curriculum-checkpoints.md` § Règle de Silver.
- 📍 **Kimono Girl #3 (Miki)** dans la ville — 語源の道, kanji 古、源、形、象、原、文
- 📍 Événement collectif Kimono Girls (après toutes les 5 battues) — scène à Tour Jo
- 📍 NPC quest N3 : aller à Tour Jo lire inscription → reward lettre Fukuda

**Bâtiments sur la carte :** Gym Morty, Tour Jo (nord), Tour Embrasée (ouest), Pokémon Center

**Sourcé du guidebook — dresseurs Gym Morty :** quatre **Médiums** (Martha, Edith, Grace, Georgina) gardent Morty — classe parfaitement alignée avec le thème 影/esprit déjà choisi par le PRD pour ce gym ; bon réservoir de noms si le contenu veut des dresseurs-leçon nommés plutôt que génériques.

**✅ Résolu (2026-07-01)** — la Kimono Girl rencontrée au Théâtre de Danse d'Ecruteak (sauvée d'un Sbire Rocket) s'appelle **Miki** dans le texte source, pas "Kuni" — **Kuni** est en réalité rencontrée à Goldenrod City (voir plus haut) ; corrigé ci-dessus.

**Sourcé du guidebook — autres PNJ clés :**
- **Bill** rencontré ici au Centre Pokémon (avant de repartir pour Doublonville/Goldenrod, où il offrira plus tard un cadeau) — confirme le fil PNJ récurrent.
- Un homme à l'ouest du Centre Pokémon récompense une bonne réponse à une question par un détecteur d'objets cachés ; la même pièce contient un livre relatant la légende des trois esprits-kanji et des deux tours de la ville — bonne source de "texte de lore" pour la bibliothèque.
- Un vieil homme, croisé à l'entrée du Gym puis à la sortie de la Tour Embrasée, raconte en deux temps la légende d'un être arc-en-ciel ayant ranimé trois créatures mortes dans un incendie — modèle direct pour un PNJ-conteur qui livre une légende en plusieurs fragments à travers la zone (cohérent avec le rôle de "lettres de Fukuda" du PRD).
- Tagline d'origine : *"A Historical City"* — "le meilleur du passé est encore préservé".

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Bill** — Centre Pokémon, explique être l'inventeur du système de stockage (avec Lanette, une chercheuse d'une autre région) ; repart à Doublonville pour raisons familiales.
- **Homme à l'énigme** — maison à l'ouest du Centre Pokémon, donne le Dowsing MCHN si bonne réponse ; la pièce contient aussi un livre relatant la légende des trois esprits et des deux tours (texte de lore tout trouvé).
- **Sbire Rocket** — Théâtre de Danse, harcèle Miki ; combat de sauvetage.
- **Kimono Girl Miki** (3e rencontrée) — remerciement énigmatique "quelqu'un avait raison à ton sujet" après le sauvetage.
- **Gentleman** (public du Théâtre) — témoin du sauvetage, donne HM03 Surf.
- **Hommes du Poste-frontière** (entrée nord, vers Tour Jo) — racontent les légendes locales de Ho-Oh ; bloquent l'accès tant que le badge n'est pas en poche (et même avec le badge, la tour reste fermée jusqu'à plus tard).
- **Homme au nord du Gym** — signale que le gardien-phare d'Oliville est malade (amorce la quête du Phare).
- Mart (comptoir du fond) : Air Mail, Heal Ball, Net Ball.
- **Gym Morty — dresseurs** : Medium Martha, Medium Edith, Medium Grace, Medium Georgina avant Morty (Gastly/Haunter×2/Gengar). Récompense : Fog Badge (Surf en exploration, échangés jusqu'au niv. 50 obéissent) + TM30 Shadow Ball.
- **Gauntlet des 5 Kimono Girls** (post-Master Ball, toutes réunies au Théâtre) — un combat chacune, un seul compagnon chacune, "test du lien avec ton équipe". Récompense : Clear Bell/Tidal Bell.

**Sourcé du guidebook — Tour Jo (Bell Tower), séquence complète retrouvée (passe 2) :**
📍 Le guide confirme une vraie ascension de tour (et non un simple bâtiment tappable) : 1F→10F + Toit, avec une mécanique différente par paliers. Séquence intégrale, directement réutilisable si le projet veut enrichir Tour Jo au-delà d'un "tappable" :
1. Poste-frontière nord d'Rosalia : un Sage bloque le passage, le badge de Gym suffit à le faire céder.
2. Suivre le sentier ("Bellchime Trail") jusqu'à la tour ; un second Sage au 1F demande à voir l'objet-clé (Plume Arc-en-ciel) avant de laisser passer.
3. 1F→6F : ascension par échelles, avec des rampes à sens unique (réfléchir avant de sauter).
4. 7F→9F : panneaux téléporteurs à utiliser tous pour récupérer les objets de la tour.
5. 10F : échelle vers le toit.
6. **Toit** : les 5 Kimono Girls accomplissent une danse rituelle traditionnelle ; la cloche/objet du joueur entre en résonance avec la cloche de la tour. Scène décrite comme "un moment de merveille et de beauté" — bonne base pour la "scène collective Kimono Girls" déjà prévue par le PRD.
7. L'être légendaire (Ho-Oh) descend, attiré par la danse et le son de cloche ; combat au sommet.
8. Possibilité de rejouer la rencontre après la fin du jeu si échouée la première fois.
- **Recommandation forte pour le PRD** : cette séquence en 8 temps (gardien → sentier → ascension à étages avec mini-puzzles → toit → danse rituelle → apparition) est un matériau bien plus riche que "bâtiment tappable, scène collective" — candidat naturel pour devenir un vrai mini-donjon de fin d'arc Kimono Girls en v2, avec la danse comme climax visuel.

---

### burned-tower — Tour Embrasée

**HGSS original :** Tour Embrasée — Entei, Raikou, Suicune se dispersent ici.

**Dans 漢字の庭 :**
- 📍 **Événement Rocket #4 — Traque des Bêtes Sacrées** (optionnel) : kanji 炎、雷、洪、猛、霊
- Reward : lettre Fukuda sur les kanji sacrés
- Bâtiment tappable → scène de combat Rocket + lore entry

**Sourcé du guidebook — confirmation du beat Silver & des trois esprits :**
- À l'arrivée, le joueur aperçoit par un trou dans le sol trois créatures légendaires — confirmé comme leur lieu d'origine ; quand le joueur s'approche, les trois prennent la fuite et deviennent ensuite des "présences mobiles" trackées sur la carte du Pokégear — mécanique directement transposable pour les trois Légendaires-grammaire du PRD (Raikou/Entei/Suicune → conjonctions/expressions/registre classique).
- ✅ **Confrontation Silver ici** confirmée dans le texte source : Silver attend en haut de l'échelle menant au sous-sol, son équipe a grandi depuis Azalea — correspond exactement à "Silver apparition #3 — Tour Embrasée (haut de l'échelle) — Embuscade" du PRD (§ Silver — 6 Rencontres) et à l'apparition #3 corrigée dans la section ecruteak-city ci-dessus. Bonne confirmation de fidélité.
- L'incendie d'origine de la tour aurait été causé par la foudre — lien thématique possible avec le kanji 雷 déjà choisi pour cet événement.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Morty** — déjà présent à l'arrivée du joueur, avec Eusine ; ont fouillé la tour ensemble, partagent leurs découvertes sur les trois esprits légendaires.
- **Eusine** — y cherche spécifiquement le 3e esprit-kanji légendaire ; personnage récurrent (revu à Irisia et Route 42).
- **Dresseurs confirmés** : Firebreather Ned (1F), Firebreather Richard (B1F).
- **Rival (Silver)** — embuscade en haut de l'échelle vers B1F ; équipe étoffée à 4, "il jure devenir le meilleur dresseur du monde, donc l'esprit légendaire doit lui être destiné".

---

### route-38 — Route 38
### route-39 — Route 39

**HGSS original :** routes vers Olivine. Route 39 : Miltank (Whitney) farm.

**Dans 漢字の庭 :**
- ✅ Positions dresseurs (4–5 par route)
- Classe dresseurs : Jongleur, Sage, Marin
- 📍 NPC ambiant N3 sur R38 : simple dialogue atmosphérique (pas de quête)
- 🍎 Apricorn **Blanc** ×1 R38 (tile près de la côte) — donne à Kurt → Boule d'Ami
- 📍 NPC optional R39 : vieux fermier, parle de Miltank en japonais (N4, dialogue humour). Aucune quête liée.

**Sourcé du guidebook — dresseurs :** 🔍 **Écolier Chad**, **Coquette Valerie**, **Fillette Dana**, **Marin Harry** (répartition exacte Route 38 vs 39 incertaine dans l'OCR) ; côté Route 39 spécifiquement : **Marin Eugene**, **Pokéfan Derek**, **Pokéfan Ruth**, **Dresseur d'Oiseaux Toby**, **Voyant Norman**.

**Sourcé du guidebook — la "ferme Moomoo" devient une vraie quête, pas juste un dialogue :**
⚠️ Le texte source décrit une véritable petite quête à la **ferme Moomoo** (nord de Route 39) : un Miltank malade que le joueur doit nourrir avec **7 baies** cultivées via les Pots à Baies obtenus sur Route 36, sur plusieurs visites — récompense : un objet de soin + le fermier se met à vendre une spécialité locale. C'est un meilleur matériau que le simple "dialogue humour sans quête" actuellement écrit dans le PRD pour cette route : une mécanique de "revenir nourrir/soigner sur plusieurs jours" colle bien à la cadence quotidienne SRS du jeu (le NPC pourrait demander une visite par jour, façon mini-quête répétée). Recommandation : envisager de transformer ce NPC en quête courte à 2-3 visites plutôt qu'un simple flavor-text, si l'équipe contenu veut l'enrichir.
- **Baoba**, gardien itinérant, est rencontré ici pour la première fois (rappelle plus tard par téléphone) — voir section PNJ récurrents.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Dresseurs confirmés** : Route 38 = School Kid Chad, Lass Dana, Beauty Valerie, Sailor Harry, Bird Keeper Toby ; Route 39 = Sailor Eugene, Pokéfan Derek, Pokéfan Ruth, Psychic Norman.
- **Ferme Moomoo, détail complet** : fille à gauche du Miltank-analogue donne le Seal Case une fois guéri ; fille à droite donne 3 décorations gratuites (Fire Seal A, Party Seal B, Flora Seal C) ; fermière donne TM83 Natural Gift ; fermier se met à vendre une spécialité locale (objet de soin, 500 chacun).
- **Baoba** — Route 39, annonce l'ouverture d'une nouvelle réserve à Irisia (Cianwood) ; échange de contact pour rappel ultérieur.

---

### olivine-city — Oliville

**HGSS original :** Jasmine Gym (Steel), Phare, SS Aqua docks.

**Dans 漢字の庭 :**
- ✅ **Gym Jasmine** — Arène physique, 2 門弟 + 試練 鋼の道, 印 n°6
- ✅ **Phare d'Oliville** — bâtiment décoratif, NPC ambiant en haut (N3)
- ✅ **Quai SS Aqua** — visible sur la carte. Bâtiment tappable → décor/atmosphère uniquement en v1. Kanto hors scope.
- ✅ **Pokémon Center**
- 🔒 Route 40 (mer) → nécessite 水 CS-Kanji

**Bâtiments sur la carte :** Gym Jasmine, Phare, Quai SS Aqua (déco), Pokémon Center, Accès Route 40 (🔒水)

**Sourcé du guidebook — le Phare est un mini-arc à part entière, pas un simple décor :**
⚠️ Dans le texte source, **Jasmine n'est pas au Gym** à l'arrivée du joueur — elle est au Phare, en train de veiller un être-gardien malade (orig. Ampharos "Amphy") qui alimente la lumière du phare. Le Gym est fermé tant que la quête n'est pas résolue. Structure complète :
1. Le joueur grimpe le Phare (escalier uniquement, 8-9 dresseurs nommés en chemin : **Marin Ernest**, **Marin Terrell**, **Gentleman Alfred**, **Gentleman Preston**, **Coquette Connie**, **Marin Huey**, **Dresseur d'Oiseaux Denis**, **Dresseur d'Oiseaux Theo**).
2. Jasmine demande d'aller chercher une **Potion Secrète** à Irisia (Cianwood).
3. Retour avec la potion → le gardien est guéri → Jasmine repart au Gym pour le vrai combat.
- C'est un matériau bien plus riche que la simple ligne actuelle ("bâtiment décoratif, NPC ambiant en haut") : le Phare pourrait devenir une **mini-quête en 3 temps avec sa propre série de dresseurs-leçon**, cohérente avec le "système 道場" du PRD (un gym dont l'accès est gardé par une quête plutôt qu'un simple seuil de kanji). Recommandation à arbitrer avec l'équipe contenu.
- Détail réutilisable : tant que la quête n'est pas résolue, **tous les dresseurs du Gym sont absents** — ils sont au Phare, inquiets pour leur cheffe. Beau modèle pour expliquer pourquoi un Gym est "vide" en attendant une condition.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Rival (Silver)** — sort du Gym juste avant le joueur, indique que la cheffe est au Phare, suggère d'aller "s'entraîner" là-bas aussi.
- **Pêcheur** — maison au nord du Centre Pokémon, donne la Bonne Canne.
- **Fille au Centre Pokémon** — demande l'avis du joueur sur sa décoration de Poké Ball puis défie en combat (PNJ de flaveur).
- **Fille de la maison au nord du Mart** — donne 3 décorations aléatoires par jour (collection).
- **Phare — roster complet confirmé** (9 dresseurs au total entre 1F et le sommet) : Sailor Ernest, Sailor Terrell, Gentleman Alfred, Gentleman Preston, Lass Connie, Sailor Huey, Bird Keeper Denis, Bird Keeper Theo, plus Sailor Kent (texte source légèrement incohérent sur le nombre exact à 8 vs 9 noms — probablement un doublon Huey/Kent à vérifier). Un "Gentleman fortuné" donne une grosse récompense en cas de victoire.
- **Jasmine** — salle de la lumière, tout en haut ; veille le gardien malade, porte fermée tant qu'elle n'a pas ouvert ; demande la Potion Secrète d'Irisia ; une fois soignée, retourne au Gym, ascenseur débloqué pour la sortie rapide.
- **Baoba** (appel téléphonique) — prévient que la réserve d'Irisia est terminée, une fois la potion livrée.
- **Gym Jasmine — dresseurs** : Lass Connie, Gentleman Alfred (les mêmes que la garde du Phare, "relocalisés" pendant la quête) avant Jasmine. Récompense : Mineral Badge + TM23 Iron Tail.

---

### route-40 — Route 40
### cianwood-city — Irisia

**HGSS original :** Route 40 = mer. Route 41 = mer (suite). Cianwood = Chuck Gym (Fighting), Pharmacy, Safari Zone Gate.

**Note :** Route 41 n'est pas dans les 49 zones — elle est absorbée dans Route 40 (zone maritime unique Olivine→Cianwood).

**Dans 漢字の庭 :**
- 🔒 Toute la zone Route 40 (mer complète jusqu'à Cianwood) → accessible via 水 CS-Kanji
- ✅ **Gym Chuck** — Arène physique, 2 門弟 + 試練 力の道, 印 n°5
- ✅ **Pokémon Center**
- ❌ Safari Zone Gate supprimée (Safari Zone hors scope)
- ❌ Pharmacie supprimée
- ❌ Pas de Kimono Girl à Irisia (résolu 2026-07-01 — voir note ci-dessous)

**Note :** Chuck est 印 n°5 dans l'ordre narratif (après Jasmine n°6 dans l'ordre géographique). Le PRD conserve l'ordre original HGSS pour les Gyms (Falkner→Bugsy→Whitney→Morty→Chuck→Jasmine→Pryce→Clair).

**Bâtiments sur la carte :** Gym Chuck, Pokémon Center

**✅ Résolu (2026-07-01)** — le texte source ne contient **aucune Kimono Girl à Cianwood City**. Les 5 Kimono Girls confirmées par le guidebook sont, dans l'ordre de rencontre habituel : Zuki (Violet City), Naoko (Ilex Forest), Kuni (Goldenrod Tunnel), Miki (Ecruteak Dance Theater), Sayo (Ice Path, juste avant Ebènelle/Blackthorn). Il n'y a pas de 6e Kimono Girl, et l'invention "Meri" est supprimée — le PRD suit fidèlement ces 5 lieux (villes et routes/donjons mélangés), voir la table en fin de document.

**Sourcé du guidebook — la ville est en réalité un carrefour de plusieurs fils narratifs, pas seulement un Gym :**
- **Pharmacie** (avant suppression dans le jeu) : remet la **Potion Secrète** pour Jasmine — confirme le lien Oliville ↔ Irisia déjà esquissé par le PRD pour le Phare.
- **Un jeune homme**, dans une maison au sud du Gym, confie temporairement un compagnon (orig. Shuckle) au joueur, et révèle au passage qu'un "garçon aux cheveux roux" (Silver) est déjà passé et a pris un objet précieux — bon fil narratif pour une "trace de Silver" sans confrontation directe.
- **"Le chasseur de légende"** (Eusine) défie le joueur ici après l'apparition fugace d'un esprit-kanji légendaire au nord de la ville — cohérent avec le fil "PNJ récurrent" documenté plus haut.
- **La femme de Chuck**, après le combat, remet une récompense et commente avec tendresse la défaite de son mari ("c'est une bonne leçon pour lui") — joli contrepoint de caractérisation, réutilisable pour humaniser un 師範 vaincu.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Nageurs/Nageuses** (Route 40) — 4 dresseurs dont Swimmer Simon, Swimmer Elaine ; (Route 41, fusionnée) — ~10 dont Swimmer Denise, Kara, Ronald, Berke, Kaylee, Paula, Matthew, Randall, Charlie, George, Wendy, Susie. Les nageurs de Route 41 "ont des tas d'histoires à raconter" sur le gardien légendaire des Îles Tourbillon — bon réservoir de lore orale pour des PNJ-conteurs en mer.
- **Frère/sœur du jour Monica** (lundi, plage Route 40) — donne Sharp Beak.
- **Homme bloquant l'accès au Battle Frontier** (Route 40 ouest) — hors scope (post-Ligue), juste flavor.
- **Homme de la Maison du Photographe** (nord d'Irisia) — révèle que le "photographe itinérant" récurrent (Cameron) est de sa famille.
- **Homme à l'ouest du Centre Pokémon** — raconte la légende des 4 îles créées par le gardien légendaire des tourbillons.
- **Pharmacie** — remet la Potion Secrète au 1er passage ; vend des soins ensuite.
- **Jeune homme au sud du Gym** — confie temporairement un compagnon (Shuckle-analogue) ; révèle qu'"un garçon roux à l'air mauvais" (Silver) est déjà passé et a pris un objet précieux — trace de Silver sans confrontation.
- **Homme du Centre Pokémon** — explique que Chuck s'entraîne sous une chute d'eau, concentration totale, "il faut le battre pour rompre sa concentration" ; remarque l'absence du PNJ récurrent "homme à lunettes de soleil" (habituellement présent à chaque Gym), qui évite "les voyous" du Gym de Cianwood et conseille plutôt au Centre Pokémon.
- **Gym Chuck — dresseurs** : Black Belt Nob, Black Belt Yoshi, Black Belt Lung, Black Belt Lao avant Chuck (Primeape/Poliwrath). Récompense : Storm Badge + TM01 Focus Punch.
- **Femme de Chuck** — sortie du Gym, donne HM Vol après la défaite de Chuck.

---

### route-42 — Route 42
### mt-mortar — Mont Mortier

**HGSS original :** Route 42 entre Ecruteak et Mahogany. Mt. Mortar = cave complex.

**Dans 漢字の庭 :**
- ✅ Positions dresseurs R42 (5–6 slots)
- 🔄 Mont Mortier → bâtiment/entrée de cave décoratif, pas de dungeon intérieur en v1
- 🔒 Chemin montagneux court-circuité → 力 CS-Kanji pour passer les boulders

**Sourcé du guidebook — dresseurs :** **Pêcheur Tully**, **Randonneur Benjamin**, **Collectionneur Shane** (Route 42) ; à Mont Mortier : **Intello Hugh**, **Intello Marcus**, **Collectionneur Harrison**, **Karatéka Kiyo**.

**Sourcé du guidebook — Mont Mortier a un beat de "dojo caché" fort, même s'il reste décoratif en v1 :**
📍 Un **maître méditant** (orig. "Karate King") se trouve tout au fond de la grotte, accessible seulement après une traversée d'eau. Il engage le combat si on lui parle ; en cas de victoire, il offre un compagnon "en reconnaissance de la victoire". C'est le matériau idéal si le projet veut, en v2, transformer "l'entrée de cave décorative" en un vrai mini-donjon dōjō avec un combat-épreuve final et une récompense narrative — cohérent avec l'identité Sensei/Dōjō du jeu. Recommandation : noter comme candidat fort pour une extension post-v1.
- 🍎 Apricorns confirmés sur Route 42 : **Vert, Rose et Jaune** (trois couleurs sur la même route) — voir section Apricorns finale pour la version consolidée.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Hiker (anonyme)** — sortant de Mont Mortier sur Route 42, bouscule le joueur et s'excuse en donnant le CS Force (力).
- **Eusine** — réapparaît côté est de Route 42 (après Coupe), nouvel aperçu de l'esprit légendaire qui s'enfuit aussitôt.
- **Mont Mortier confirmé** : Super Nerd Hugh (2F), Super Nerd Marcus (1F fond), Poké Maniac Harrison (1F fond), Black Belt Kiyo = **le "Karate King"** lui-même (B1F, médite tout au fond, accessible uniquement via traversée d'eau) — confirme que le Karate King n'est pas un PNJ à part mais bien Kiyo en personne.

---

### mahogany-town — Acajou Ville

**HGSS original :** Pryce Gym (Ice), Team Rocket HQ (caché sous le magasin de souvenirs). Route 43 relie Mahogany au Lac Colère au nord.

**Note :** Route 43 n'est pas dans les 49 zones du jeu. Le Lac Colère est accessible directement depuis Mahogany Town comme zone adjacente (pas de route intermédiaire séparée). Voir section "Zones absentes (v1)".

**Dans 漢字の庭 :**
- ✅ **Gym Pryce** — Arène physique, 2 門弟 + 試練 氷の道, 印 n°7
- ✅ **Repaire de Mékanos** (Rocket HQ) — tappable depuis la carte → Événement Rocket #5
- ✅ **Pokémon Center**
- 📍 **Silver apparition #4** (QG Rocket B2F, après Ariana) : kanji 変、知、疑、惜、寂、遅. ⚠️ Renuméroté et kanji corrigé (l'ancien jeu de kanji 強越勝誇傲鋼 appartient en réalité à l'apparition #2/Ecorcia, voir `curriculum-checkpoints.md`). Pour mémoire, dans le jeu d'origine ce n'est **pas un combat** : Silver est déjà vaincu par Lance, simple cameo frustré.

**Bâtiments sur la carte :** Gym Pryce, Repaire Rocket (tappable), Pokémon Center

**Sourcé du guidebook — la ville entière est construite comme un mystère, bon matériau pour l'ambiance :**
- Tagline/ambiance d'origine : "Acajou Ville est une retraite ninja… il n'y a qu'une seule boutique en ville, et celui qui la tient est le plus louche de tous." Le vendeur du magasin de souvenirs détourne le regard quand un bruit suspect provient du sous-sol (= le QG Rocket, juste en dessous).
- Allumer la radio du Pokégear en ville ne capte qu'un **signal brouillé** au lieu des stations habituelles, sur toute la zone Acajou–Lac Colère — bon indice diégétique pour signaler "quelque chose cloche ici" avant même de découvrir le QG.
- Un homme bloque la route est et vend une spécialité locale qu'il faut goûter avant de passer — petit rituel d'hospitalité/passage, réutilisable comme micro-interaction.
- Un homme devant le Gym évoque "un homme à la cape noire" (Lance) enquêtant sur le signal brouillé — bonne préfiguration de l'arrivée de Lance.

**Sourcé du guidebook — structure interne du Repaire de Mékanos (QG Rocket), plus détaillée que l'entrée actuelle du PRD :**
- **B1F** : alarmes déguisées en statues, déclenchent des duos de Sbires si on passe devant ; un ordinateur gardé par un Scientifique permet de couper tout le système d'alarme (mécanique "infiltration furtive ou frontale", au choix du joueur).
- **B2F** : Lance attend au pied des escaliers et soigne l'équipe du joueur ; le rival y est croisé, déjà vaincu par Lance, qui lui reproche de "ne pas avoir assez d'affection pour ses compagnons" — beau levier thématique pour une réplique de Fukuda sur le lien avec l'apprentissage.
- **B3F** : il faut deux mots de passe (obtenus en battant des Sbires) pour atteindre la salle du chef.
- **Salle du chef** : le joueur s'attend à affronter le grand chef (Giovanni) mais découvre **l'Exécutif Petrel déguisé** — retournement direct, cohérent avec le PRD qui prévoit déjà Petrel comme un personnage "déguisé" à la Tour Radio ; ici, c'est sa première apparition costumée.
- Après sa fuite, un indice sonore mène à la salle du transmetteur où **l'Exécutif Ariana** affronte le joueur **en double, aux côtés de Lance** (combat 2v2 Lance+joueur vs Ariana+Sbire) — confirme exactement le PRD ("Exécutif : Ariana (double combat avec Lance)").
- Récompense finale : le CS-Kanji 渦 (orig. HM Whirlpool) donné par Lance — voir § CS-Kanji — Obtention (mis à jour 2026-07-03, c'était encore un "futur CS-Kanji" indéterminé).

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Vendeur RageCandyBar** — bloque la route est, vend la spécialité locale ("connue jusqu'au Kanto"), laisse passer une fois la Team Rocket vaincue (déclenché par l'arc Tour Radio, pas seulement le QG local).
- **Vendeur du magasin de souvenirs** — "un type louche en lunettes de soleil" ; 1er stock : Poké Ball/Potion/TinyMushroom ; fait mine de ne pas entendre le bruit suspect du sous-sol ; remplacé par une vieille dame sympathique une fois la Team Rocket vaincue (stock élargi : Air Mail, Antidote, Great Ball, Hyper Potion, Parlyz Heal, Revive, Super Potion, Super Repel).
- **Homme devant le Gym** — évoque "l'homme à la cape noire" enquêtant sur le signal brouillé.
- **PNJ à la grille de Route 43** — mentionne que quelqu'un (Mr. Pokémon) cherche une "Écaille Rouge".
- **Professeur Elm** (appel) — inquiet des émissions radio, juste après le 7e badge.
- **Gym Pryce — dresseurs** : Skier Jill, Skier Diana, Boarder Deandre, Boarder Gerardo, Boarder Patton avant Pryce (Seel/Piloswine/Dewgong, puzzle de blocs de glace). Récompense : Glacier Badge (Whirlpool en exploration) + TM07 Hail.
- **QG Rocket — détail complet confirmé** : B1F statues-alarmes Persian (déclenchent des duos de Sbires), Scientist Gregg garde le PC qui coupe le système ; case-piège au sol contournable par l'est ; B2F Lance soigne et révèle l'emplacement verrouillé du transmetteur, rival croisé (déjà battu par Lance) ; B3F Scientist Ross, Scientist Mitch + 2 Sbires donnant les 2 mots de passe ; salle du chef = Petrel déguisé en "Boss" (Zubat/Koffing/Raticate), un Murkrow imite sa voix pour donner le mot de passe suivant ("Suis ce Murkrow !") ; salle du transmetteur = Ariana + Sbire en double face à Lance+joueur (Arbok/Drowzee/Murkrow/Gloom/Grimer) ; après sa défaite, 3 Electrode à neutraliser ; sortie par dalle de téléportation près de l'escalier B1F.

---

### lake-of-rage — Lac Colère

**HGSS original :** Lake of Rage — Red Gyarados, Lance aide le joueur contre Rocket.

**Dans 漢字の庭 :**
- 📍 **Événement Rocket #5 — Ariana — Repaire de Mékanos** : lié au Lac Colère. Kanji 欺、偽、惑、騙、詐. Bloque l'accès à Pryce's Gym.
- 📍 **Rencontre Shiny garantie** : un kanji avec shimmer rouge (怒) attend au centre du lac. HP battle kanji 怒、激、憤、烈、猛、狂. Reward : badge Shiny rouge sur 怒 + message Fukuda.
- ✅ Zone accessible après Mahogany Town

**Sourcé du guidebook — confirmation forte + extension :**
- ✅ L'événement "créature rouge légendaire au centre du lac" est confirmé tel quel dans le texte source (orig. Red Gyarados) — bonne fidélité du PRD sur ce point. Qu'on la batte, la capture ou la laisse fuir, le joueur obtient toujours un objet-clé (orig. Écaille Rouge) — donc le combat ne peut pas être "raté" en v1, juste gagné de façons différentes ; bon principe à transposer pour l'HP battle 怒 (toujours une récompense, peu importe l'issue précise au-delà de victoire/défaite).
- **Lance apparaît ici**, pas à Mahogany Town : juste après le combat, près d'un panneau au bord du lac, il se présente et recrute le joueur pour enquêter à Acajou Ville — c'est le vrai point de départ du fil Lance, à corriger si le doc/PRD le placent ailleurs.
- L'écaille/objet obtenu se ramène ensuite à **Mr. Pokémon (Route 30)** contre une récompense (Exp. Share) — boucle complète avec un PNJ déjà rencontré au tout début du jeu, bon modèle de "callback" à longue distance.
- Ambiance : pluie permanente sur le lac sauf un jour de la semaine (orig. mercredi), qui fait aussi baisser le niveau de l'eau et révèle de nouveaux passages/dresseurs — mécanique optionnelle "jour spécial" cohérente avec le fil PNJ récurrent documenté plus haut, mais non requise pour v1.
- 🍎 Un **Apricorn Noir**, accessible uniquement à la nage au milieu du lac (caché, invisible depuis la rive) — bon candidat pour la localisation réelle de l'Apricorn Noir actuellement mal placé à Route 33 (voir section Apricorns finale).

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Poste-frontière Team Rocket** (milieu de Route 43, zone "absente" mais menant au lac) — rançonne 1000 pour passer ; redevient un poste normal après la chute du QG, donne alors TM36 Sludge Bomb.
- **Dresseurs confirmés (Route 43)** : Poké Maniac Ron/Ben/Brent, Picnicker Tiffany, Camper Spencer, Fisherman Marvin.
- **Fishing Guru** — maison à l'ouest du lac (accessible après le QG, via un dédale de cimes d'arbres à la nage) ; concours du plus gros poisson-compagnon, récompense Ether en cas de record battu.
- **Frère/sœur du jour Wesley** (mercredi, post-QG) — donne Black Belt (objet à équiper).
- **Dresseurs confirmés (lac)** : Fisherman Raymond*, Fisherman Andre* (*apparaissent après l'événement Gyarados), Ace Trainer Aaron, Ace Trainer Lois (mercredis, post-QG).

---

### route-44 — Route 44
### ice-path — Chemin Glacé

**HGSS original :** Route 44 puis Ice Path (puzzle ice). Lien vers Blackthorn City.

**Dans 漢字の庭 :**
- ✅ Positions dresseurs R44 (5–6 slots)
- 🔄 Chemin Glacé → zone traversable, pas de puzzle de glace en v1 (traversée linéaire)
- 📍 **Événement Rocket #7 — Retardataires** (optionnel) : kanji 孤、寒、凍、迷、忘. Reward : lore entry.
- 📍 NPC quest N2 : "Mahogany" thème — quête express avec scroll caché dans la glace
- 📍 **Kimono Girl #5 (Sayo)** dans la zone — 構成の道, kanji 組、合、成、部、品、構 (déplacé depuis Ebènelle le 2026-07-01, thème/kanji conservés tels quels)

**Sourcé du guidebook — dresseurs Route 44 :** **Pêcheur Wilton**, **Collectionneur Zach**, **Dresseur d'Oiseaux Vance**, **Voyant Phil**, **Pêcheur Edgar**, **Dresseur Ace Cybil**, **Dresseur Ace Allen**.

**✅ Résolu (2026-07-01)** — dans le texte source, la 5e et dernière Kimono Girl (**Sayo**) est rencontrée précisément dans le **Chemin Glacé**, coincée près de la sortie ("ses sandales collées à la glace") — le joueur la libère d'une glissade. Moment volontairement comique ("la Kimono Girl qui fait rire d'elle-même"). Déplacée ici depuis Ebènelle et depuis l'invention "Meri" à Irisia — voir la table complète en fin de document.

**Sourcé du guidebook — structure du Chemin Glacé (si réactivé comme mini-puzzle en v2) :**
- Trois étages de glace coulissante ; un puzzle "pousser des rochers dans des trous" relie les étages.
- Un objet permettant de traverser l'eau profonde (orig. HM Waterfall) est caché derrière une séquence de glissades coordonnées — bon modèle de "petit puzzle de logique" si le Chemin Glacé doit un jour devenir davantage qu'une simple traversée linéaire.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Dresseurs confirmés (Route 44)** : Poké Maniac Zach, Bird Keeper Vance, Psychic Phil, Fisherman Edgar, Fisherman Wilton, Ace Trainer Cybil, Ace Trainer Allen.
- **Kimono Girl Sayo, scène complète confirmée** : coincée sur une plaque de glace près de la sortie (1F/zone B1F2), "fait un jeu de mots et rit toute seule en restant coincée" (sidebar du guide la surnomme "la Kimono Girl étonnamment drôle") ; le joueur glisse jusqu'à elle et la pousse par derrière pour la libérer ; elle remercie et repart en glissant.

---

### blackthorn-city — Ebènelle

**HGSS original :** Clair Gym (Dragon). Dragon's Den au sud.

**Dans 漢字の庭 :**
- ✅ **Gym Clair** — Arène physique, 2 門弟 + 試練 竜の道. ⚠️ Ne donne **pas** directement le 印 n°8 (résolu 2026-07-01, voir twist ci-dessous) — ouvre seulement l'accès à l'Antre du Dragon, qui est la vraie condition.
- ✅ **Pokémon Center**
- ✅ **Antre du Dragon** (tappable)
- ❌ Pas de Kimono Girl à Ebènelle (résolu 2026-07-01 — Sayo déplacée vers route-44/ice-path)

**Bâtiments sur la carte :** Gym Clair, Pokémon Center, Entrée Antre du Dragon (sud)

**✅ Résolu (2026-07-01)** — le guidebook ne mentionne aucune Kimono Girl à Ebènelle proprement dit ; "Sayo" a été déplacée vers le Chemin Glacé (route-44/ice-path), son vrai lieu de rencontre. La ville n'est, dans le texte source, qu'un point de passage Gym + Antre du Dragon.

**Sourcé du guidebook — dresseurs Gym Clair :** cinq **Dresseur Ace** (Mike, Fran, Cody, Lola, Paulo) gardent Clair — le plus grand roster de gardiens de tout le jeu, cohérent avec le statut de "dernier badge" de Clair dans le PRD.

**✅ Adopté (2026-07-01) — twist narratif intégré au PRD :**
📍 **Même après avoir battu Clair, elle refuse de remettre le badge** et envoie le joueur à l'Antre du Dragon "faire ses preuves" auprès du Maître/Ancien — l'entrée de l'Antre reste d'ailleurs fermée tant que le combat de Gym n'est pas gagné. Le combat de Clair n'octroie donc pas directement le 印 n°8 : c'est l'épreuve de l'Antre du Dragon qui le fait, recalibrée sur l'empathie/le respect (voir dragons-den ci-dessous) plutôt que la seule traduction littérale. Voir `.scratch/kanji-no-niwa/PRD.md` § "Système 道場" pour la note correspondante.
- Une maison au nord de la ville récompense un compagnon "endurci au combat" d'un ruban — flavor, sans usage direct ici.
- Un PNJ local explique que les "Dompteurs de Dragons" sont tous originaires de Ebènelle — bonne justification diégétique pour la classe **Dresseur Ace** dominante ici, et pour pourquoi Clair (et Lance) en sont issus.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Maison du Tuteur/Effaceur de capacités** (à côté du Mart) — 4 PNJ nommés dans la même pièce, excellent matériau pour 4 dresseurs-leçon spécialisés dans un même bâtiment :
  - **Tuteur Ultime** — enseigne la "capacité ultime" à la forme finale du starter du joueur.
  - **Grand-mère Wilma** (nommée) — enseigne la capacité Dragon la plus puissante à un compagnon-Dragon ayant un lien fort avec le joueur.
  - **Maniaque des capacités** — contre une Écaille de Cœur, réapprend une capacité oubliée.
  - **Effaceur de capacités** — fait oublier n'importe quelle capacité, y compris celles normalement permanentes.
- **Fille de la maison nord** — donne un Ruban d'Effort si le compagnon en tête est suffisamment endurci ("comment devenir assez fort pour ce ruban ? En enchaînant les combats !").
- **Garçon local** — explique que les Dompteurs de Dragons sont tous nés à Ebènelle.
- **Frère/sœur du jour Santos** (samedi) — donne Soft Sand.
- **PNJ d'échange** — contre un compagnon-Dragon femelle, donne un compagnon-oiseau tridactyle (échange in-jeu, faible valeur pour l'adaptation).
- **Homme bloquant l'Antre du Dragon** — refuse l'entrée tant que le badge de Gym n'est pas en poche.
- **Gym Clair — dresseurs** : Ace Trainer Mike, Fran, Cody, Lola, Paulo avant Clair (Gyarados/Kingdra/Dragonair×2, plateformes rotatives/coulissantes). **Clair refuse explicitement de remettre le badge après la victoire** — "elle ne reconnaît pas ton mérite, elle ne te donnera pas de badge tant que tu n'auras pas fait tes preuves à l'Antre du Dragon" (texte quasi-verbatim, confirme la recommandation déjà notée plus bas).

---

### dragons-den — Antre du Dragon

**HGSS original :** Dragon's Den — quiz du Dragon Maître pour valider si Clair te donnait le badge.

**Dans 漢字の庭 :**
- ✅ **Quiz du Maître — condition réelle du 印 n°8** (adopté 2026-07-01) : 5 questions axées sur l'empathie/le respect ("si j'étais à la place de l'autre, que ressentirais-je ?"), pas la seule traduction littérale. Réussite → Clair (surprise) remet le 印 n°8. Recalibre le "Quiz de traduction N1" déjà prévu au PRD plutôt que de l'ajouter en plus.
- 📍 **Événement Rocket #8 — L'Émissaire** (optionnel) : pas de combat. Quiz de traduction d'une lettre en japonais. Reward : lore entry Dragon's Den + beat narratif.
- 📍 NPC quest N1 : inscription au fond de l'antre, 4 lignes à traduire. Reward : lore entry + dialogue Fukuda.
- ✅ Zone tappable depuis la carte de Ebènelle

**Sourcé du guidebook — détail exact du quiz du Maître (adopté ci-dessus) :**
- 📍 À l'intérieur du sanctuaire, le **Maître** (Ancien) "jauge" le joueur avec **cinq questions**, posées via un système tactile. L'indice du guide d'origine est limpide et directement transposable au PRD : *"si tu donnes les mauvaises réponses... la récompense finale sera incomplète. Pour choisir tes réponses, demande-toi : si j'étais à la place de [l'autre], que ressentirais-je ?"* — c'est-à-dire que les bonnes réponses sont celles qui témoignent d'empathie, pas de force ou de domination. **C'est le meilleur matériau source pour le "Quiz de traduction N1" déjà prévu au PRD** : il devrait porter sur des valeurs (empathie, respect, lien) plutôt que sur la seule traduction littérale.
- Une fois le quiz réussi, **Clair fait irruption**, surprise que le joueur ait réussi ("elle ne s'attendait même pas à ce que tu réussisses le test !") — le Maître la corrige, et c'est seulement alors qu'elle remet le 印 final. Confirme la recommandation ci-dessus (blackthorn-city) : Clair n'est pas la juge, le Maître l'est.
- 📍 **Révélation de lignée** : le Maître/Ancien de l'Antre est le grand-père de Clair, et **Lance est son frère aîné**. Ce lien Lance↔Clair↔Maître ferme élégamment la boucle ouverte au Lac Colère/Mahogany Town (où Lance accompagne le joueur) — fil à préserver si possible, par exemple via une ligne de dialogue du Maître ou de Fukuda qui le révèle.
- Après l'épreuve réussie, le Maître propose un cadeau de "successeur" — bon modèle pour le "trophée de texte légendaire" déjà prévu par le PRD à ce stade.

**Inventaire PNJ exhaustif (passe 2, source PDF) — confirme et précise le quiz du Maître :**
- **Dresseurs confirmés** : Ace Trainer Kobe, Ace Trainer Piper, Twins Clea & Gil (B1F, combats avant d'atteindre le sanctuaire).
- **"Les autres vieillards du Sanctuaire"** (pluriel, non nommés) — présents aux côtés du Maître, corroborent la lignée Clair/Lance/Maître ; pas de dialogue individuel donné.
- ⚠️ **Confirmé (et non un artefact OCR) : le texte du guide ne transcrit jamais les 5 questions ni les choix de réponse du quiz du Maître** — seul le cadrage méta est donné, cité plus haut ("demande-toi : si j'étais à la place de [l'autre], que ressentirais-je ?"). C'est une vraie lacune de la source, à combler entièrement par l'équipe d'écriture (cohérent avec la recommandation déjà faite : un quiz sur l'empathie/le respect plutôt que la traduction littérale).

---

### route-45 — Route 45
### dark-cave — Grotte Sombre

**HGSS original :** Route 45 vers le sud (Johto "back entrance"). Dark Cave au nord de Route 31.

**Dans 漢字の庭 :**
- ✅ Positions dresseurs R45 (4 slots)
- 🔄 Grotte Sombre → décor uniquement, entrée visible sur la carte, pas de dungeon

**Sourcé du guidebook — dresseurs Route 45 :** **Karatéka Kenji**, **Randonneur Timothy**, **Randonneur Michael**, **Campeur Ted**, **Pique-niqueuse Erin**, **Randonneur Bailey**, **Dresseur Ace Ryan**, **Dresseur Ace Kelly**, **Randonneur Parry** — un roster dense (9 dresseurs), cohérent avec une route tardive de fin de parcours.

**Sourcé du guidebook — Route 45 se scinde réellement en deux chemins :**
La route se divise explicitement en un chemin est et un chemin ouest, impossible à parcourir en une seule traversée — obligeant à repasser plus tard (via voyage rapide dans le jeu d'origine) pour couvrir l'autre moitié des dresseurs. Cohérent avec l'usage du CS-Kanji 飛 (voyage rapide) du PRD : Route 45 est un bon candidat pour illustrer concrètement l'utilité de 飛 une fois obtenu (revenir couvrir les dresseurs manqués d'un premier passage).
- ⚠️ La **Grotte Sombre n'a, dans le texte source consulté pour cette zone, aucun contenu propre au-delà d'une mention de passage** ("Dark Cave (p. ??)") — cohérent avec le traitement "décor uniquement" déjà choisi par le doc actuel. Pas de contradiction à signaler ici.

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Dresseurs confirmés (Route 45)** : Black Belt Kenji, Hiker Timothy, Hiker Michael, Camper Ted, Picnicker Erin, Hiker Bailey, Ace Trainer Ryan, Ace Trainer Kelly, Hiker Parry, Hiker Erik (10 au total, certains côté est, certains côté ouest selon le fork de route).
- **Route 46** : Hiker Erik également listé ici (PNJ partagé entre les deux pages de la route) — Route 46 reste hors-scope (voir Zones absentes) mais confirme qu'un seul dresseur y existait dans l'original.
- **Grotte Sombre, côté Route 45** — un homme tout au fond (accessible seulement après l'Antre du Dragon) donne BlackGlasses ; confirmé sans autre PNJ.

---

### route-26 — Route 26
### route-27 — Route 27

**HGSS original :** Routes après Indigo Plateau (direction Kanto). Route 27 traverse la frontière.

**Dans 漢字の庭 :**
- ✅ Positions dresseurs R26 (4 slots), R27 (4 slots)
- 📍 **Obstacle 2 — Ronflex** : kanji 眠. ⚠️ Corrigé 2026-07-03 : il n'est **pas** sur Route 27 — la ROM et le guide le placent **devant la Grotte Taupiqueur** (cellules Routes 11/12, côté Kanto, désormais au scope depuis le 2026-07-01). Bloquant, réveillé par l'émission Flûte Poké de la radio améliorée (carte EXPN, quête de la Centrale Kanto) — comme en jeu. Tapper avant → il dort profondément (animation courte + message Fukuda).
- 🔒 Route 27 depuis New Bark Town est : nécessite 水 CS-Kanji

**Sourcé du guidebook — dresseurs :** Route 26 : **Dresseur Ace Jamie**, **Dresseur Ace Jake**, **Dresseur Ace Joyce**, **Voyant Vernon**, **Pêcheur Scott**. Route 27 (côté est / Chutes de Tohjo) : **Dresseur Ace Megan**, **Dresseur Ace Blake**, **Dresseur Ace Brian**, **Voyant Eli**, **Dresseur Ace Reena**.

**Sourcé du guidebook — beats d'ambiance réutilisables :**
- Route 27 est explicitement présentée dans le texte source comme **déjà géographiquement le Kanto**, pas juste sa porte d'entrée ("ce n'est même pas une route de Johto") — renforce le choix du PRD de la traiter comme une simple frontière décorative côté Johto.
- La maison des "Frères/sœurs du jour" se trouve sur Route 26, avec un carnet listant leurs sept emplacements — déjà documenté dans la section PNJ récurrents plus haut.
- Une jeune fille soigne gratuitement dans une maison au nord de Route 26 — détail mineur, sans usage direct (le jeu n'a pas de mécanique de soin de Pokémon).

**Inventaire PNJ exhaustif (passe 2, source PDF) :**
- **Dresseurs confirmés (Route 26)** : Ace Trainer Gaven, Ace Trainer Jamie, Fisherman Scott, Ace Trainer Jake, Ace Trainer Joyce, Psychic Vernon.
- **Dresseurs confirmés (Route 27 / Chutes de Tohjo)** : Ace Trainer Megan, Ace Trainer Blake, Bird Keeper Jose, Ace Trainer Reena, Ace Trainer Brian, Psychic Eli.
- **Maison des Frères/sœurs du jour** — carnet listant les 7 emplacements et jours (objet de quête-index, voir section PNJ récurrents).
- **Fille de la maison au nord** — soigne gratuitement l'équipe du joueur ("ton équipe a bien mérité une pause après tout ce chemin").
- **Homme à la Porte de Réception de la Ligue** — bloque l'est (Kanto, nécessite Pokédex national) et l'ouest (Mont Gris, nécessite tous les badges Kanto) ; seul le nord (Route de la Victoire) est ouvert à ce stade — confirme la géographie du carrefour déjà citée plus bas (section mt-silver).
- **Vieille dame** (maison à la sortie est des Chutes de Tohjo) — donne TM37 Sandstorm si le compagnon en tête a un lien d'affection élevé.
- Détail d'ambiance : une petite grotte cachée derrière les chutes contient "une radio cassée" — pur élément de décor/mystère, sans payoff mécanique dans le texte source.

---

### indigo-plateau-antichambre — Antichambre de la Ligue

**HGSS original :** Victory Road + Indigo Plateau entrée.

**Dans 漢字の庭 :**
- 📍 **Obstacle 3 — Porte fermée (閉→開)** : s'ouvre uniquement avec les 8 印. Animation 閉 → 開 au pinceau.
- 📍 **Silver apparition #6** (Route Victoire / Antichambre cleared, dernier combat avant la Ligue) : kanji 静、空、終、別、礼、去. Premier crack dans sa certitude. ⚠️ Renuméroté et kanji corrigé (l'ancien jeu de kanji 変知疑惜寂遅 appartient en réalité à l'apparition #4/QG Rocket, voir `curriculum-checkpoints.md`).
- ✅ **Antichambre HP battle** (30 questions, tous les 8 pools thématiques combinés, 12 min timer, 72% pour 初伝)

**Sourcé du guidebook — confirmation forte :**
- ✅ Le texte source confirme explicitement : **"pas un seul dresseur sur la Route de la Victoire"** — le rival explique l'avoir "vidée" avant l'arrivée du joueur. Excellent appui pour le choix du PRD de n'y placer aucun dresseur de route, seulement l'obstacle + Silver.
- Trois étages de navigation (rebords/fosses) menant à un combat de rival final au sommet (équipe complète, son plus haut niveau du jeu) juste avant la sortie vers le Plateau — cohérent avec "Silver apparition #6" (PRD : "Route Victoire") à ce stade.

**Inventaire PNJ exhaustif (passe 2, source PDF) :** confirmé exhaustivement — **aucun PNJ ni dresseur** sur l'ensemble de la Route de la Victoire en dehors du Rival final ("il reconnaît ton mérite d'être arrivé jusque-là, mais jure de t'écraser" avant le combat). Pas d'autre contenu à extraire pour cette zone.

---

### indigo-plateau-will — Salle de Will
### indigo-plateau-koga — Salle de Koga
### indigo-plateau-bruno — Salle de Bruno
### indigo-plateau-karen — Salle de Karen
### indigo-plateau-lance — Trône de Lance

**HGSS original :** Elite Four rooms + Champion Lance.

**Dans 漢字の庭 :**
- ✅ HP battles séquentiels (30 questions chacun, thèmes respectifs)
- 📍 Will : mentionne "le dresseur silencieux" (Red reference)
- 📍 Koga : line sur l'oubli délibéré (Silver reference)
- 📍 Bruno : effortlessness vs. preparation (Red reference)
- 📍 Karen : lettre → Red n'en a pas laissé
- 📍 Lance : Dragon Scroll ceremony → le rouleau contient le poème caché de Fukuda
- ✅ Dernier Pokémon Center avant Mont Gris (dans Salle de Lance ou juste avant)

**Sourcé du guidebook (passe 1) :**
- Structure confirmée : une fois entré dans le gauntlet Elite Four, impossible de sortir sans être vaincu (auquel cas on recommence au premier membre) — cohérent avec un format "HP battle enchaînées sans pause" déjà esquissé par le PRD.
- Après la victoire sur Lance, le texte de clôture du guide est un épilogue explicite annonçant une suite : *"...et à la fin de ton voyage, tu pourrais bien te retrouver face à un Dresseur de légende..."* — c'est la seule allusion à Red dans cette partie du livre ; tout le contenu détaillé sur le Mont Gris/Red se trouve ailleurs dans l'ouvrage. Bonne confirmation que "Red" est traité par le jeu d'origine lui-même comme une légende en filigrane plutôt qu'un personnage détaillé — cohérent avec le traitement silencieux que le PRD lui réserve déjà.

**✅ Mise à jour passe 2 — confirmation définitive (texte propre, plus de lacune) :**
Le texte source intégral de Koga/Bruno/Karen a été retrouvé via le PDF (qui contient une vraie couche de texte, contrairement à l'OCR utilisé en passe 1). **Résultat confirmé : ce n'est pas une perte de données — le guide ne donne tout simplement AUCUN texte de personnalité pour aucun des 5 membres (Will, Koga, Bruno, Karen, Lance).** Chacun n'a droit qu'à : une étiquette type-spécialiste ("● Dresseur de Pokémon de type [X]") et un paragraphe de conseils de combat pur (types efficaces, capacités dangereuses à surveiller). Aucune ligne de dialogue, aucune réplique en personnage, nulle part. Détail confirmé pour mémoire/calibrage de ton :
- **Will** — "Dresseur de Pokémon de type Psychique."
- **Koga** — "Dresseur de Pokémon de type Poison."
- **Bruno** — "Dresseur de Pokémon de type Combat."
- **Karen** — "Dresseur de Pokémon de type Ténèbres."
- **Lance** (Champion) — "Dresseur de Pokémon de type Dragon."

**Conséquence pour le contenu :** toute personnalité prêtée à ces 5 figures dans 漢字の庭 (les répliques déjà esquissées par le PRD : "le dresseur silencieux", "l'oubli délibéré", "effortlessness vs. preparation", "Red n'a pas laissé de lettre", le rouleau-poème de Fukuda) est **entièrement une invention du studio** — ce qui est très bien, puisqu'il n'y a rien à "trahir" dans la source ; aucune caractérisation officielle n'existe à contredire.

**Sourcé du guidebook — PNJ exhaustif de l'Antichambre/HQ de la Ligue (passe 2) :**
- **Vieil homme avec son compagnon-télépathe** (hall d'entrée) — blague que son compagnon "ne pourra pas te ramener à la maison si tu te décourages à la Ligue".
- **Homme bloquant l'entrée de la Ligue** — laisse passer une fois interpellé ; rappelle la règle "pas de sortie sans défaite, sinon retour au 1er membre".

---

### mt-silver-route-28 — Route 28
### mt-silver-base — Gris — Base
### mt-silver-lower — Gris — Versants inférieurs
### mt-silver-upper — Gris — Versants supérieurs
### mt-silver-summit — Gris — Sommet

**HGSS original :** Mt. Silver — Red au sommet (le seul NPC sans dialogue).

**Dans 漢字の庭 :**
- 📍 **Silver apparition bonus A** (Route 28, studied ≥ 2000) : Il admet sans mots qu'il avait tort. ⚠️ Ne fait pas partie des "6 Rencontres" officielles du PRD (qui se terminent à Route Victoire, apparition #6) — c'est un ajout narratif du studio sans équivalent dans le jeu d'origine. Kanji à définir par l'équipe contenu (ne pas réutiliser 悔認謝恥赦和, désormais assigné à l'apparition #5/Tunnel de Doublonville — voir `curriculum-checkpoints.md` § Règle de Silver).
- 📍 Note du Prof Elm (Gris Base) — full circle
- 📍 **Événement Rocket #9 — Le Grunt Solitaire** (Versants supérieurs) : pas de combat. Dialogue N2 : lui dire que Team Rocket s'est dissous. L'obstacle le plus mélancolique du jeu.
- 📍 **Red** (Sommet) : 50 questions, silence, neige, aucun dialogue. Red nod uniquement. Confirmé par recherche web (passe 3) : tempête de grêle au combat, silence total, disparition immédiate après défaite — voir `curriculum-checkpoints.md` pour le détail complet.
- 📍 **Silver apparition bonus B** (Versants, optionnel post-Red) : Il est monté voir par lui-même. Rien n'est dit. ⚠️ Idem ci-dessus — bonus hors PRD, kanji à définir (ne pas réutiliser 静空終別礼去, désormais assigné à l'apparition #6/Route Victoire).

**Post-game (Sommet) :** neige permanente, Red sprite figé, terrain modifié visuellement.

**Sourcé du guidebook Johto (passe 1) — toujours vrai, ce guide reste muet sur Mont Gris :**
- Le guide Johto local ne couvre pas Mont Gris/Red : la zone est verrouillée derrière une progression post-Kanto (badges du Kanto + Pokédex national) et n'apparaît donc pas dans ce volume. Le carrefour menant à la Route de la Victoire (Route 26) confirme la géographie : *"intersection de trois chemins : Kanto à l'est, Mont Gris à l'ouest, Route de la Victoire au nord"* — seul le nord est ouvert à ce stade de l'aventure, ce qui valide le choix du PRD de présenter Mont Gris comme un horizon lointain, pas une zone immédiatement accessible.
- Red est confirmé ailleurs dans la base culturelle de la franchise comme **le seul PNJ du jeu sans la moindre ligne de dialogue** (un simple geste de tête) — déjà bien capté par le PRD ("Red nod uniquement").

**✅ Confirmation passe 2 (Johto) :** le PDF Johto (355 pages) est un volume **Johto uniquement** — aucune section Mont Gris/Red, juste la mention de "Mt. Silver" comme direction à la Porte de Réception et l'épilogue générique annonçant le Kanto.

**✅ Passe 6 (2026-07-01) — correction d'une note obsolète :** la remarque ci-dessus ("contenu Kanto/Mont Gris/Red non présent dans nos fichiers locaux", écrite le 2026-06-30) n'est plus exacte depuis l'ajout au repo de `scripts/sources/guidebook/kanto-guide-fulltext.txt` (le même OCR déjà utilisé § Kanto ci-dessous). Ce fichier contient bien une section Route 22/28/Mont Gris/Red complète. Elle recoupe et enrichit les faits déjà trouvés par la passe 3 (web, Bulbapedia) plutôt que de les contredire :

- **Accès** : la montagne y est présentée comme si dangereuse que l'entrée n'est autorisée qu'avec la permission du Pr. Chen/Oak — un gate *narratif*, en plus du gate mécanique des 16 badges déjà au PRD. Bon ressort pour la scène du Prof Elm à Gris Base (déjà prévue ci-dessus, "full circle") : une figure d'autorité pourrait explicitement "autoriser" l'ascension une fois les 16 印/badges réunis, plutôt qu'un simple palier de kanji silencieux.
- **Un Centre Pokémon se trouve exactement à la jonction Route 28 / entrée du Mont Gris** — présenté comme la dernière occasion de se préparer avant l'ascension, confirmant (cette fois par la source primaire, pas seulement le web) le "Dernier Pokémon Center" déjà esquissé par le PRD.
- **Structure interne confirmée** : grotte (chambre centrale → chambre ouest) → versant extérieur → intérieur enneigé (1) → intérieur enneigé (2) → sommet — un jalonnement en 5 temps cohérent avec les 4 zones déjà découpées par le PRD (Route 28 / Base / Versants inférieurs / Versants supérieurs) + le Sommet.
- **Tempête de grêle au sommet — désormais confirmée par deux sources indépendantes** (web passe 3 + guidebook Kanto passe 6) : le combat contre Red s'ouvre avec un climat de grêle permanent. Détail supplémentaire de la source primaire : c'est présenté comme la météo par défaut du sommet, pas un effet spécial propre au combat — un vrai trait du lieu, pas seulement de l'affrontement. Renforce l'idée d'un effet visuel/sonore de blizzard **continu dès l'arrivée au sommet**, pas seulement pendant les 50 questions du combat.
- **Après la défaite de Red — nouveau beat, absent de la version précédente de cette section :** le jeu d'origine ne s'arrête pas au générique de victoire. Le joueur est ramené à sa chambre de départ, puis invité à recontacter la figure qui avait donné la permission d'accès (Pr. Chen/Oak) pour lui annoncer la victoire — qui **récompense l'exploit en laissant le joueur choisir un cadeau** (dans l'original : un starter Kanto). Ce choix fait écho au tout premier choix de starter du jeu — bon matériau pour une boucle narrative de fin de partie (ex. Fukuda ou le Pr. Elm proposant un choix symbolique qui fait écho à la toute première scène d'onboarding), mais c'est un enrichissement optionnel à trancher par l'équipe narrative, pas une correction du PRD actuel (qui s'arrête déjà, à raison, au trophée "Red perfect").
- Détail mineur de navigation (non narratif) : Route 28 ne se traverse pas d'un bout à l'autre au premier passage — il faut entrer dans Mont Gris puis en ressortir pour atteindre sa moitié nord, où se trouve la maison de l'Idole/TM Acier Aile déjà documentée passe 3 (cohérent avec "accessible uniquement via une coupe d'arbre depuis l'extérieur du Mont Gris" — confirme un aller-retour, pas un raccourci manqué par la passe 3).

**Sourcé du web — passe 3 (2026-06-30, Bulbapedia, hors guidebook Prima local) — toujours valide, recoupé et complété ci-dessus par la source primaire :**

- **route-28** : "une route de montagne cachée à l'ouest du Kanto", relie la Porte de Réception de la Ligue à l'entrée du Mont Gris. **Aucun dresseur de combat** sur cette route — un seul PNJ nommé : **l'Idole retraitée** (Idol), trouvée dans une maison accessible uniquement via une coupe d'arbre depuis l'extérieur du Mont Gris ; "elle mène désormais une vie tranquille pour protéger sa vie privée" ; donne TM47 Acier Aile en échange du silence du joueur sur sa cachette — bon PNJ-secret pour une rencontre optionnelle discrète, cohérent avec le ton "retraite" déjà présent à Acajou Ville.
- **mt-silver-lower / mt-silver-upper** : la montagne alterne grotte (1F, navigation à la nage) et versants extérieurs enneigés (traversée par escalade de rochers) — structure en paliers cohérente avec les 2 zones "Versants inférieurs/supérieurs" déjà découpées par le PRD, et avec le jalonnement en 5 temps confirmé passe 6 ci-dessus. Aucun dresseur nommé trouvé dans ces zones au-delà de rencontres sauvages — confirme que le PRD peut traiter ces zones sans roster de dresseurs spécifique (uniquement l'obstacle/quest narratifs déjà prévus : Silver apparition bonus B, Grunt Solitaire).
- **mt-silver-summit — rencontre Red** : crête étroite et enneigée tout en haut. **Après la victoire : "Red marque une pause, silencieux et figé. Puis, en un clin d'œil, il disparaît."** — confirme et précise exactement le traitement "silencieux" déjà choisi par le PRD ; la disparition immédiate (plutôt qu'un dialogue de défaite) est un détail fort à reproduire. Récompense : un Ruban de Légende (Legend Ribbon) — bon modèle pour le trophée/achievement "Red perfect" déjà prévu au PRD. Red redevient affrontable après chaque run ultérieur du Conseil 4 — cohérent avec un éventuel rematch post-game.
- Objets confirmés sur la montagne (essentiellement hors-sujet pour l'adaptation, mais utile pour la densité de "trésors cachés" si la zone devient explorable) : Expert Belt, 2x Ultra Ball, Hyper Potion, Dire Hit, Full Restore, Revive, Escape Rope, TM76 Tomber, Max Elixir, Max Revive, Max Potion, Calcium, Iron, Protein, Max Ether, Pure Incense, Rare Candy, Dawn Stone.

Sources : [Bulbapedia — Walkthrough Part 28](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_HeartGold_and_SoulSilver/Part_28), [Bulbapedia — Walkthrough Part 29](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_HeartGold_and_SoulSilver/Part_29) ; `scripts/sources/guidebook/kanto-guide-fulltext.txt` (passe 6, Route 22/28/Mont Gris/Red).

---

## Bâtiments récurrents (toutes zones)

### Pokémon Center (dans chaque ville)
- **Fonction dans le jeu :** Mode Direct (Start Session) — lance toutes les reviews en queue linéaire
- **Tapper :** ouvre le menu "Commencer une session" ou "Voir la file"
- **NPC intérieur (optionnel) :** une infirmière NPC avec dialogue ambiant simple

### Gyms (villes avec 師範)
- **Façade :** tappable depuis la carte de la ville
- **Intérieur :** 2 门弟 (NPC dresseurs gardiens) → porte de la 師範 (locked until conditions met) → 試練 screen → 印 ceremony
- **Condition visuelle :** porte du Gym barrée si conditions non remplies, ouverte sinon
- **Sourcé du guidebook :** le nombre réel de gardiens varie selon le Gym dans le jeu d'origine (2 à 5 selon la ville — Falkner et Bugsy en ont 2, Whitney et Morty en ont jusqu'à 4, Clair en a 5). Le PRD fixe une structure uniforme à 2 門弟 pour tous les gyms — choix de simplification cohérent, à garder tel quel ; le détail ci-dessus est juste documenté pour mémoire si jamais le studio veut varier la difficulté d'un gym à l'autre.

---

## Événements Rocket — Récapitulatif Carte

| # | Zone | Bloquant ? | Trigger visible sur carte |
|---|------|-----------|--------------------------|
| 1 | route-32 | ✅ Ruines Arcaniques | Grunt avec point d'exclamation rouge sur la route |
| 2 | ruins-of-alph | ❌ Optionnel | Grunt dans la zone des inscriptions |
| 3 | slowpoke-well | ✅ Gym Bugsy | Executive Proton visible devant l'entrée du Puits |
| 4 | burned-tower | ❌ Optionnel | Grunts visibles dans la Tour Embrasée |
| 5 | lake-of-rage | ✅ Gym Pryce | Executive Ariana visible au Lac Colère |
| 6 | goldenrod-city (radio-tower) | ✅ Radio Tower | Radio Tower avec drapeau Rocket visible |
| 7 | ice-path | ❌ Optionnel | Grunts visibles dans le Chemin Glacé |
| 8 | dragons-den | ❌ Optionnel | Émissaire dans l'Antre |
| 9 | mt-silver-upper | ❌ Cosmétique | Grunt Solitaire assis sur les versants |

**⚠️ Note sourcée :** dans le texte d'origine, la structure réelle est légèrement différente de ce tableau simplifié :
- L'épisode "Puits Ramoloss" (lieu 3 du tableau ci-dessus) est bien un combat contre **Proton**, confirmé.
- L'épisode "Lac Colère" (lieu 5) est en réalité géographiquement le **Repaire de Mékanos sous Acajou Ville**, le Lac Colère n'étant que le déclencheur de l'arrivée de Lance — déjà cohérent avec le PRD qui rattache cet événement à "Repaire de Mékanos" dans sa propre description (§ Team Rocket, lieu 2), seul ce tableau récapitulatif simplifie en l'attribuant au lac.
- ✅ **Correction passe 2** : l'épisode "Radio Tower" (lieu 6) suit en réalité la séquence **Petrel (déguisé en Directeur, 5F) → [détour Tunnel de Doublonville : rival, vrai Directeur, Card Key] → Proton (3F) → re-Petrel déguisé (3F, tout-Poison) → Ariana → Archer**. Proton **apparaît bel et bien** en combat à la Tour Radio — la passe 1 ne l'avait pas retrouvé (perte OCR). Voir la séquence complète dans la section goldenrod-city ci-dessus.

---

## Kimono Girls — Noms et lieux sourcés (correction complète)

Le guidebook ne liste que **5 Kimono Girls**, toujours dans le même ordre de rencontre.

**✅ Décision adoptée (2026-07-01) :** Option 1 — fidèle au guidebook. Naoko déplacée en Forêt Secte, Kuni↔Doublonville, Miki↔Rosalia, Sayo↔Chemin Glacé, et Irisia n'a pas de Kimono Girl (le guidebook n'en prévoit pas là — "Meri" était une invention sans source, supprimée). Toutes les sections de zone ci-dessus ont été corrigées en conséquence.

| # | Nom | Lieu de rencontre | Statut |
|---|---|---|---|
| 1 | **Zuki** | Violet City (Mauville), devant le Mart | ✅ Déjà correct au PRD |
| 2 | **Naoko** | Ilex Forest (Forêt Secte), perdue dans la forêt | ✅ Ajoutée (était absente) |
| 3 | **Miki** | Ecruteak Dance Theater (Rosalia), sauvée d'un Sbire Rocket | ✅ Nom corrigé (était "Kuni" à cet endroit) |
| 4 | **Kuni** | Goldenrod Tunnel (Doublonville), après la Card Key — revisite tardive | ✅ Nom corrigé (était "Naomi") |
| 5 | **Sayo** | Ice Path (Chemin Glacé), sandales coincées dans la glace | ✅ Lieu corrigé (était Ebènelle) ; Irisia ("Meri") supprimée |

**✅ Confirmation indépendante (passe 2) :** le guide contient une page récapitulative dédiée ("Kimono Girl Memories") qui reconfirme mot pour mot les 5 noms et lieux ci-dessus, avec une ligne de caractérisation pour chacune — matériau directement exploitable pour écrire leurs dialogues :
- **Zuki** (1ère) — Mauville, devant le Mart. "Elle semblait inquiète pour l'œuf... une fois que tu l'as eu, elle est venue te parler."
- **Naoko** (2e) — Forêt Secte. "Cette Kimono Girl n'avait aucun sens de l'orientation et t'a demandé le chemin de la sortie."
- **Kuni** (3e dans l'ordre de rencontre réel, nommée "4e" dans la liste guidebook) — Tunnel de Doublonville. "Elle t'a respecté d'avoir affronté la Team Rocket." Laisse échapper une allusion à un esprit légendaire.
- **Miki** (Rosalia) — Théâtre de Danse. "Cette fille a été impressionnée que tu battes la Team Rocket."
- **Sayo** (Chemin Glacé) — "Tu l'as poussée par derrière, et elle s'est éloignée en glissant sur la glace."
- Prémisse d'origine de tout le fil Kimono Girls, confirmée par le texte : elles ont confié l'œuf mystère à Mr. Pokémon, espérant trouver un·e dresseur·euse "au cœur pur" capable de créer un lien avec l'esprit légendaire — c'est *pour ça* qu'elles apparaissent au fil du parcours du joueur. Bon ancrage thématique si le PRD veut motiver leur apparition récurrente autrement que par coïncidence.

---

## Apricorns — Distribution sur la Carte (corrigée et sourcée)

⚠️ **L'ancienne version de cette section contenait des correspondances couleur→objet incohérentes d'une ligne à l'autre** (ex. Apricorn Noir → "Boule de Rappel" dans une ligne, Apricorn Rouge → "Boule de Rappel" dans une autre). Le mapping ci-dessous est la correspondance réelle du jeu d'origine, confirmée par le guidebook (voir aussi le tableau détaillé dans la section azalea-town ci-dessus) :

| Couleur | Objet (Kurt) | Localisations confirmées par le guidebook |
|---|---|---|
| Blanc | Boule Rapide | Azalea Town (Ecorcia, ville), Route 38 |
| Rose | Boule Affection | Route 31, Route 32, Route 42, Route 30 (devant la maison de Mr. Pokémon) |
| Bleu | Boule Leurre | Route 31 (zone Apricorn Box), Route 36 (non confirmé en détail — 🔍) |
| Noir | Boule Lourde | Route 32, Route 31, **Lac Colère** (caché, accessible seulement à la nage au centre du lac) — 🔍 et non "Route 33" comme l'indiquait l'ancienne version |
| Vert | Boule Amitié | Route 29 (arbre visible mais non cueillable avant l'Apricorn Box), Route 30, Route 35 (via traversée du lac), Route 42, Route 45 (×2) |
| Jaune | Boule Lune | Route 42, Route 45/46 |
| Rouge | Boule Niveau | **Chemin Glacé** (Ice Path), première visite — confirmé par la liste d'objets de la zone. L'ancien doc le plaçait par erreur Route 33/37/42 ; corrigé ici. |

**Principe confirmé du jeu d'origine, à conserver :** chaque arbre ne donne qu'**une seule couleur**, repousse après un certain délai (24h dans le jeu d'origine — cohérent avec le cycle "Kurt fabrique en 24h" déjà au PRD), et Kurt ne fabrique qu'**un seul type d'objet par fournée**, quelle que soit la quantité d'Apricorns de cette couleur apportée.

**Fichier définitif :** `content/map/apricorns.json` (à créer lors de la phase de tile authoring) — utiliser le tableau ci-dessus comme point de départ, en complétant les cases 🔍 par une relecture ciblée du guidebook si une précision parfaite est nécessaire.

---

## CS-Kanji — Obtention et zones débloquées (réécrit 2026-07-03)

**⚠️ L'ancien modèle "Mastery requis : stability ≥ 30j" est supprimé.** Les CS-Kanji ne s'obtiennent
**jamais** par le SRS ni par la maîtrise d'un kanji : ils sont **remis par un PNJ ou trouvés, exactement
au même moment narratif que le CS/HM du jeu d'origine** (vérifié dans le texte intégral du guide,
`johto-guide-fulltext.txt`, 2026-07-03). La condition additionnelle côté 漢字の庭 est une condition de
**lecture** (tous les textes des zones débloquées lus — voir PRD § CS-Kanji), pas de maîtrise.

| CS-Kanji | Obtenu (comme en jeu, sourcé guide) | Zones/passages débloqués |
|----------|-------------------------------------|--------------------------|
| 砕 (éclate-roc) | Un garçon, Route 36 (p. 80) | Roches fissurées (Mont Mortier, cavernes, raccourcis) |
| 切 (coupe) | Le Maître du Charbon, Ecorcia, après la quête Farfetch'd (p. ~76) | Arbres à couper (Forêt Secte, raccourci Ilex→R34, Kanto) |
| 水 (surf) | Le Gentleman du Théâtre de Danse, Rosalia, après le sauvetage de la Kimono Girl — utilisable après le badge de Morty (p. ~126) | Route 40/41 (mer), Route 27 depuis Bourg Geon, rivières |
| 力 (force) | Le Hiker sortant du Mont Mortier, Route 42, en excuse après avoir bousculé le joueur (p. 134) | Gros rochers (R42, Route 45, passages montagne) |
| 飛 (vol) | La femme de Chuck, Irisia, après la victoire sur Chuck | Voyage rapide vers toute ville visitée |
| 渦 (tourbillon) | Lance, QG Rocket d'Acajou, après le double combat Ariana | Tourbillons (Îles Tourbillon, eaux agitées) |
| 滝 (cascade) | Trouvé au Chemin Glacé (p. 154) — adapté en récompense du puzzle de glissades | Cascades (Chutes de Tohjo, Antre du Dragon, Kanto) |

**Objets-clés distincts des CS-Kanji (comme en jeu) :** l'**Arrosoir** (Boutique de Fleurs, Doublonville,
après le badge de Whitney) déloge le Simularbre de la Route 36 ; la **radio améliorée** (carte EXPN,
Kanto, après la quête de la Centrale) réveille le Ronflex devant la Grotte Taupiqueur.

**Hors scope v1 :** HM08 Escalade (Prof Chen, post-16-badges) — parois d'escalade non exportées en type
de terrain ; à trancher avec l'arc Mont Gris.

Note Route 45 : des rebords à sens unique empêchent de revenir en arrière sans raccourci — bon argument
pour que 力 (ou 飛) serve aussi à "rattraper" les dresseurs manqués d'un premier passage (voir route-45).

---

## Musique — Mapping Zone par Zone

| Zone | Piste OST (Disc/Track) |
|------|----------------------|
| new-bark-town | Disc 1 / 04 — New Bark Town |
| route-29 | Disc 1 / 09 — Route 29 |
| cherrygrove-city | Disc 1 / 13 — Cherrygrove City |
| route-30, route-31 | Disc 1 / 20 — Route 30 |
| violet-city | Disc 1 / 22 — Violet City |
| sprout-tower | Disc 1 / 23 — Sprout Tower |
| ruins-of-alph | Disc 1 / 30 — Ruins of Alph |
| azalea-town | Disc 1 / 33 — Azalea Town |
| ilex-forest | Disc 1 / 28 — Union Cave *(faute de mieux — Union Cave n'existe pas dans le jeu, mais sa piste de grotte correspond à l'atmosphère boisée/sombre d'Ilex)* |
| route-34 | Disc 1 / 36 — Route 34 |
| goldenrod-city | Disc 1 / 41 — Goldenrod City |
| national-park | Disc 1 / 60 — National Park |
| ecruteak-city | Disc 1 / 62 — Ecruteak City |
| burned-tower | Disc 1 / 64 — Burned Tower |
| route-38, route-39 | Disc 1 / 68 — Route 38 |
| olivine-city | Disc 1 / 71 — Olivine Lighthouse *(faute de mieux)* |
| cianwood-city | Disc 1 / 73 — Cianwood City |
| route-42, mt-mortar | Disc 1 / 75 — Route 42 |
| mahogany-town | *(manquant dans les disques fournis)* — **faute de mieux :** Disc 1 / 33 — Azalea Town (ambiance village calme montagneux) |
| lake-of-rage | *(manquant dans les disques fournis)* — **faute de mieux :** Disc 1 / 64 — Burned Tower (ambiance dramatique, lac menaçant) |
| ice-path | Disc 1 / 81 — Dark Cave *(faute de mieux)* |
| blackthorn-city, dragons-den | Disc 1 / 83 — Dragon's Den |
| route-26, route-27 | Disc 2 / 01 — Route 26 |
| indigo-plateau-* | Disc 2 / 77 — Pokémon League |
| mt-silver-* | Disc 2 / 76 — Victory Road |

**Nuit :** pour toutes les zones, ajouter un filtre audio (réduction de volume + légère distorsion grave) sur la piste de jour pour simuler la variante nocturne en v1 (pas de pistes séparées nuit requises).

---

## Kanto — 8 Gyms (ajouté 2026-07-01)

**Décision adoptée :** après Plateau Indigo (Elite Four + Lance), le joueur traverse Kanto avant Mont Gris — 8 gyms supplémentaires, fidèles à la structure post-Hall of Fame du jeu d'origine (les 16 badges, Johto + Kanto, sont un prérequis pour affronter Red). Voir `PRD.md` § Kanto — 8 Gyms et `content/curriculum-checkpoints.md` pour la calibration kanji/grammaire *(recalibré 2026-07-05, audit 01 : le Kanto porte désormais 900→2136 — Ligue plate, Mont Gris plateau bonus ; l'ancien schéma « 1500→2000 + Mont Gris compressé 2000→2136 » laissait un trou de 80 kanji et un mur de 700 kanji à la Ligue, voir `content/curriculum-checkpoints.md` § Recalibrage majeur)*.

**⚠️ Méthode et limite de cette source (à la différence du Johto) :** le PDF `scripts/sources/guidebook/(Prima 2010) - Pokemon HeartGold & SoulSilver - Kanto` est un **scan sans couche de texte** (contrairement au PDF Johto, qui avait un vrai texte natif extractible via PyMuPDF — confirmé : 0 caractère extrait par page contre >2500 pour la page équivalente du Johto). L'extraction utilisée (`scripts/sources/guidebook/kanto-guide-fulltext.txt`, 1,36M caractères) vient d'un **OCR archive.org** — même source/méthode que la "passe 1" abandonnée pour Johto avant que le texte natif ne soit trouvé, avec les mêmes artefacts (confusions de caractères, mise en page de flowchart lue en désordre). L'ordre des gyms, les noms de villes et les repères ci-dessous sont fiables (recoupés avec une recherche web Bulbapedia indépendante — la numérotation interne du guide "Gym Battle 9" à "16" correspond exactement à l'ordre trouvé en ligne). **Une passe 2 partielle a été faite (2026-07-01)** — lecture directe des sections descriptives de chaque ville (plus fiables que la section flowchart "Recommended Route" du début du guide) — mais reste moins profonde que le Johto passe 2/3 (pas de roster de dresseurs de route exhaustif, pas de calendrier PNJ complet).

**✅ Passe 6 (2026-07-01) — ordre de badges confirmé par le texte descriptif lui-même, pas seulement la numérotation de flowchart :** plusieurs villes annoncent explicitement leur rang ("ton Nᵉ badge Kanto") dans leur propre section descriptive, ce qui confirme indépendamment la numérotation "Gym Battle 9–16" déjà citée : Vermeille (1ᵉʳ), Safranville (2ᵉ), Céladia (4ᵉ), Argenta (6ᵉ), Île Braise (7ᵉ), Vertville (8ᵉ/dernier). ⚠️ **Point d'attention pour l'équipe contenu :** cet ordre place Argenta/Pewter (Brock) en 6ᵉ position, pas en 1ère comme dans les jeux Kanto "de base" (Rouge/Bleu/Jaune) — c'est le jeu d'origine HGSS qui change cet ordre pour son post-game, le guidebook et le PRD s'accordent bien là-dessus, ce n'est pas une divergence à corriger.

**Ordre confirmé (recherche web + numérotation "Gym Battle 9–16" du guide) :**

| # | Gym Leader | Ville (nom adapté) | Type / thème | Équipe du Gym Leader (source) |
|---|---|---|---|---|
| 9 | Lt. Surge | Vermeille City (Vermilion) | Électrik | Raichu, Electrode, Electrode, Magneton, Electabuzz |
| 10 | Sabrina | Safranville (Saffron) | Psy | Espeon, Mr. Mime, Alakazam (Lv.55) + autres Psychic |
| 11 | Misty | Azuria City (Cerulean) | Eau | *(non capturé dans cette passe — à compléter)* |
| 12 | Erika | Céladia (Celadon) | Plante | *(non capturé dans cette passe — à compléter)* |
| 13 | Janine | Fuchsia City | Poison | Crobat, Weezing, Ariados, Ariados, Venomoth |
| 14 | Brock | Argenta City (Pewter) | Roche | *(non capturé dans cette passe — Rock-type confirmé)* |
| 15 | Blaine | Île Braise (Cinnabar → gym relocalisé Seafoam Islands) | Feu | *(non capturé dans cette passe — Fire-type confirmé)* |
| 16 | Blue | Vertville (Viridian) | Mixte (rival historique de Red) | Exeggutor (Lv.55), Rhydon (Lv.58), Machamp (Lv.56), Gyarados (Lv.52), Arcanine (Lv.58), Pidgeot (Lv.60) |

### Repères confirmés par ville (passe 2 partielle)

**Vermeille City (Lt. Surge)** — Pokémon Fan Club à l'ouest ; le président du club récompense qui écoute son histoire (bon modèle de PNJ-leçon "patience/politesse"). Gym au sud du Fan Club, un arbre à couper (力/Coupe) ouvre l'accès à la clôture. Intérieur du Gym : grille de poubelles cachant deux interrupteurs à trouver avant d'atteindre Lt. Surge (bon gabarit de mini-puzzle pour notre Gym). Quête transversale : Copycat (habite Safranville) a perdu sa poupée ici — le joueur la récupère et doit la rapporter à Safranville (quête filée sur 2 villes). Suicune/Eusine peut apparaître ici (cohérent avec le fil Eusine déjà établi côté Johto).

**Safranville (Sabrina)** — Gare du Magnet Train (nécessite un pass non obtenu à ce stade — bon tease non-bloquant). Dojo d'arts martiaux juste à côté du Gym, mais le Karatéka résident est "parti s'entraîner au Mont Mortier, dans la région de Johto" — **callback direct vers une zone déjà existante côté Johto** (mt-mortar/Mont Mortier), à réutiliser tel quel pour donner de la cohérence au monde. Le Gym de Sabrina est un labyrinthe de 9 chambres reliées par téléportation — bon gabarit pour un Gym plus complexe que la moyenne, cohérent avec son thème 心/精神 (dédale mental).

**Azuria City / Cerulean (Misty)** — **✅ Passe 6, séquence complète confirmée** (précédemment juste "un voleur est pourchassé") : le Gym normalement animé est trouvé vide à l'arrivée — un Sbire Rocket isolé y est surpris, décrit dans le texte comme "le seul membre étranger de la Team Rocket", qui "n'a jamais reçu le mémo disant que la Team Rocket avait été dissoute au Johto" — **bon écho direct au thème "dissolution de la Team Rocket" déjà central au Grunt Solitaire de Mont Gris** (mt-silver-upper ci-dessus), decliné ici en variante "comique/tragique" plus légère. Il s'enfuit vers un pont de route, y est rattrapé et affronté, et avoue avoir volé une pièce mécanique de la Centrale Électrique de Kanto, cachée dans le Gym vide ; la récupérer et la restituer relance la centrale (débloque un passage souterrain vers Vermeille City). Misty elle-même n'est pas au Gym à l'arrivée — trouvée à l'extérieur de la ville, sur un point de vue — le Gym ne se peuple de ses 5 dresseurs qu'après l'avoir rencontrée là-bas (**structure "Gym fermé jusqu'à trouver le leader ailleurs" déjà utilisée pour Jasmine au Phare côté Johto** — bon parallèle à assumer plutôt qu'à éviter). Route 9/10 mènent au Rock Tunnel (traversée sombre, HM Flash nécessaire — pas d'équivalent HM dans notre jeu, à traiter comme un couloir sombre narratif si repris).

**📍 Nouveau fil narratif confirmé passe 6 — le pont manquant entre Johto et Kanto pour l'arc du Rival :** en sortant de Route 3 (juste après Argenta/Pewter) vers la grotte du Mont Lune (Mt. Moon, hors scope en tant que donjon jouable), le Rival (Silver) tend une embuscade au joueur — sa première réapparition depuis le Hall of Fame. Le texte source le décrit reconnaissant enfin la valeur du joueur tout en voulant encore se battre. C'est ce combat qui, dans le jeu d'origine, précède et motive directement le combat en duo (joueur + Lance contre le Rival) déjà documenté côté Johto à l'Antre du Dragon/Blackthorn ("Tag Battle") — jusqu'ici cette section ne savait pas *pourquoi* le Rival se retrouvait mêlé à cette scène côté Johto ; cette embuscade Kanto en est l'origine chronologique. Si le studio garde une septième apparition de Silver hors PRD (au-delà des 6 officielles), ce Mont Lune est le lieu le plus fidèle à proposer — sinon, ce fil peut simplement enrichir en creux la caractérisation de l'Antre du Dragon déjà écrite (Silver y arrive après avoir déjà, hors-écran, cherché le combat une fois de plus).

**Céladia / Celadon (Erika)** — Grand magasin (Celadon Department Store), Game Corner (casino — mécanique hors scope, à traiter comme décor), immeubles "Celadon Condominiums". Quête confirmée : un homme au sommet des Condominiums donne un objet uniquement de nuit (20h-4h) — bon modèle de PNJ à horaire fixe. **Callback confirmé vers Johto** : les masques (Turtwig/Chimchar/Piplup) obtenus ici sont utilisables au "Dress-Up Shop" du Tunnel de Doublonville (Goldenrod Tunnel) déjà présent dans notre jeu — lien concret entre Kanto et Johto à exploiter narrativement.

**Fuchsia City (Janine)** — Gym = labyrinthe de murs transparents (bon gabarit de Gym-puzzle, thème 毒/prudence — on ne voit pas le piège avant d'y être). Pal Park au nord (mécanique de transfert hors scope, mais le gardien est confirmé comme "le fils de Baoba" — **callback direct vers un PNJ Johto déjà documenté** dans "PNJ récurrents transversaux", bon fil filé à réutiliser). Volcan ayant coupé la route sud vers Île Braise (détour narratif tout trouvé).

**Argenta City / Pewter (Brock)** — Musée des Sciences (restauration de fossiles) ; ville "calme, entourée de forêts et de montagnes". Un vieil homme sur la colline près du Poké Mart donne l'Aile Argent/Arc-en-ciel (objet légendaire Ho-Oh/Lugia — **callback direct** vers le climax Tour Jo déjà établi côté Johto, à réutiliser ou clin d'œil).

**Île Braise / Cinnabar (Blaine)** — ⚠️ **Détail important trouvé en passe 2** : dans le jeu d'origine, Cinnabar Island a été dévastée par une éruption volcanique un an avant l'arrivée du joueur (seul le Centre Pokémon a survécu, population évacuée) — le vrai Gym de Blaine a été **relocalisé aux Seafoam Islands** (accessible depuis Cinnabar via Route 20/21, 12 dresseurs sur le trajet). Bon matériau dramatique : une île-décor avec un carrefour émotionnel plutôt qu'un simple gym de plus. Blue est rencontré ici (pas en combat) comme point de contrôle narratif — "il acceptera de se battre une fois que tu auras plus de badges Kanto" — **structure identique au fil Silver côté Johto** (rencontres répétées avant la confrontation finale). Après 7 badges Kanto, Blue repart vers Vertville où le vrai combat de Gym a lieu.

**Vertville / Viridian (Blue)** — Dernier Gym, verrouillé jusqu'à la fin (le vieil homme devant la porte laisse passer seulement après Blaine + Blue rencontré à Île Braise). Sol du Gym = tuiles-flèches qui déplacent le joueur dans une direction fixe (autre gabarit de Gym-puzzle, cohérent avec 頂/rivalité — un terrain qu'on ne contrôle pas totalement). Après victoire : le Pr. Chen/Oak appelle immédiatement à la sortie du Gym.

**Bourg-Origine / Pallet Town (Pr. Chen/Oak) — ✅ nouvelle entrée, passe 6 :** absente des passes précédentes alors qu'elle encadre tout l'arc Kanto. C'est le point d'arrivée réel (après Vertville/Blue) et le point de retour après Red — voir la note "après la défaite de Red" ajoutée § mt-silver-summit ci-dessus. Plus petite ville du jeu (pas de Centre Pokémon ni de Poké Mart) : seulement le labo du Pr. Chen/Oak, et les maisons du héros et de son/sa rival(e) historique (Blue). Trois visites distinctes confirmées par le texte : (1) première visite, juste après Vertville — Oak n'a encore rien à donner, "reviens une fois tous les badges Kanto en poche" (bon écho pour un Fukuda qui renverrait le joueur au terrain plutôt que de le récompenser prématurément) ; (2) après avoir vaincu Blue à Vertville — Oak donne la permission d'accès à Mont Gris (voir passe 6 § mt-silver-summit) ; (3) après Red — choix de récompense symbolique. Détail de caractérisation trouvé dans la maison du rival : sa mère/sœur (Daisy dans l'original) toilette le compagnon du joueur quotidiennement sur un créneau fixe (bon gabarit de PNJ à horaire fixe, dans la veine de la Loterie/Boutique Bonheur déjà au PRD) et finit par transmettre un contact pour un combat de revanche post-16-badges.

### Inventaire PNJ exhaustif complémentaire par ville (passe 7, 2026-07-02)

Les repères ci-dessus (passe 2) s'arrêtaient au contenu directement lié au Gym. Cette passe complète chaque ville avec les PNJ d'ambiance, quêtes annexes et objets remis par un PNJ (pas ramassés au sol) — même niveau d'exhaustivité que le Johto. Convention identique : ✅/🔄/❌/🔒/📍/⚠️/🔍.

**Bourg-Origine / Pallet Town :**
- **Photographe itinérant** — présent mer/jeu/ven uniquement (fil transrégional déjà documenté).
- **Daisy** (sœur de Blue) — toilette le compagnon du joueur tous les jours 15h-16h ; au bout de 7 visites cumulées, donne le contact de Blue pour un combat de revanche post-16-badges (déjà noté ci-dessus, précision d'horaire ajoutée ici).
- **Mère de Red** — confirme que Red voyage, maison tenue en son absence.
- **Pr. Chen/Oak — PC** — permet de lire un mail d'ambiance d'un collègue chercheur.
- **Pr. Chen/Oak — évaluation du Pokédex** — en personne ou par téléphone (mécanique de complétion hors scope, mais bon modèle de "bilan périodique" par une figure d'autorité).

**Vertville / Viridian :**
- **Vieil homme devant le Gym** — bloque puis laisse passer une fois la condition remplie (déjà noté ci-dessus).
- **Trainer House** — un combat par jour, structure "défi quotidien" (non personnifié dans le texte, juste un lieu).
- **Rumeur ambiante au Centre Pokémon** — des clients se demandent si le Gym d'Île Braise existe encore, pousse le joueur vers le sud (PNJ générique, pas nommé).
- **Photographe itinérant** — mer/ven.
- ⚠️ Ville notablement pauvre en PNJ secondaires dans le texte source (pas d'école, pas de vendeur nommé) — cohérent avec son rôle de "porte d'entrée/sortie", pas de contenu manquant à chercher plus loin.

**Argenta City / Pewter :**
- **Vieil homme sur la colline** — donne un objet légendaire (Aile) après l'Elite Four (déjà noté).
- **Comptoir du Musée** — restaure un fossile-objet en compagnon sur place (mécanique de collection hors scope, mais bon modèle de "PNJ artisan qui transforme un objet apporté").
- **Steven (cameo)** — Champion visiteur absorbé dans une expo minérale ; ne donne rien ici mais est un prérequis silencieux pour son fil narratif qui se conclut à Safranville (voir plus bas).
- **Photographe itinérant** — dehors mar/sam, dans le Musée lun/dim.

**Azuria City / Cerulean :** ⚠️ ville confirmée comme réellement pauvre en PNJ secondaires dans le texte source (juste deux silhouettes non nommées) — vérifié en recoupant les pages OCR adjacentes, pas une lacune de recherche.
- **Gérant du magasin de vélos d'origine** — regrette la baisse de fréquentation depuis l'ouverture d'une succursale ailleurs ; évoque en passant "un garçon et son vélo" trois ans plus tôt (résonance avec le lore Red déjà noté § new-bark-town).
- **Garçon récurrent au nord de la ville** — indique où trouver Misty (cap au nord) ; plus tard signale une anomalie détectée à la rivière (déclenche une recherche à la nage). Aucun objet remis.
- Séquence complète du Sbire/pièce volée déjà documentée plus haut dans cette section (Team Rocket).

**Céladia / Celadon :**
- **Wake (cameo, déguisé)** — Champion d'arène visiteur d'une autre région, donne 3 masques-accessoires.
- **Homme du toit des Condominiums** — uniquement visible 20h-4h, donne un Grigri Esprit.
- **Rival (bureaux GAME FREAK)** — taquine le joueur sur une récompense musicale une fois tous les badges réunis.
- **"Président" GAME FREAK (cameo)** — dialogue d'ambiance sur le développement du jeu, aucune récompense.
- **"Directeur son" GAME FREAK** — donne un objet-clé qui change la musique d'ambiance, une fois tous les badges réunis.
- **"Réalisateur" GAME FREAK** — quête en 2 étapes, récompense à chaque jalon de complétion du Pokédex (mécanique de collection hors scope, mais structure de quête à 2 paliers réutilisable).
- **Maylene (cameo)** — Championne visiteuse, scène comique dans un restaurant, pur flavor.
- **Gentleman du comptoir d'échange** — se plaint de son manque de Jetons ; pur flavor.
- **Conseiller "Pouvoir Caché"** — PNJ d'information gratuite près du Casino.
- **Photographe itinérant** — Grand magasin 2F le vendredi, Route 18 mar-sam.

**Fuchsia City :**
- **Fille au nord du Centre Pokémon** — explique que la Zone Safari a déménagé au Johto (Pal Park occupe maintenant l'ancien site) — lore uniquement.
- **Fille à l'est du Gym** — mentionne que le grand-père de Bill est parti lui rendre visite — pur indice, pas d'objet.
- **PNJ troc de fragments/baies** ("Wadbutt", nord) — troc récurrent : un fragment contre une baie thématique.
- **Fils de Baoba** (gérant du Pal Park, nord) — tient l'installation de capture relocalisée ; figure d'ambiance, pas de remise directe.
- **Visiteur du Pal Park au chapeau** — donne un accessoire cosmétique sous condition externe.

**Safranville / Saffron :**
- **Mr. Psychic** — donne une CT gratuitement.
- **Vigile du hall Silph Co.** — explique l'ascenseur en panne, donne un objet-souvenir (Amélioration).
- **Puzzle d'appareils électroménagers (Silph Co., sous-sol)** — pas de PNJ parlant, mais un petit gimmick environnemental (examiner micro-ondes/ventilateur/frigo/lave-linge/tondeuse change la forme d'un esprit-appareil porté) — bon gabarit de mini-puzzle d'exploration sans combat.
- **Copycat** — maison rose, imite instantanément le joueur à la rencontre (trait de personnalité, pas une quête en soi).
- **Fille de la gare de Safranville** — explique qu'un Pass Train Aimant est requis, que le joueur n'a pas encore.
- **Karatéka du dojo** — absent (parti s'entraîner au Johto, déjà noté) ; le dojo devient un hub de revanche de 師範 une fois les 16 badges réunis.
- **Copycat (résolution de quête)** — sa poupée perdue est à Vermeille ; une fois rapportée, donne le Pass Train Aimant (boucle la quête notée plus haut).
- **Steven (Silph Co., 1ère rencontre)** — répond à une question pour recevoir un compagnon-cadeau d'une autre région.
- **Steven (Silph Co., revisite)** — propose un échange direct contre un compagnon différent (conclut le fil Steven amorcé à Vermeille/Argenta).

**Vermeille City / Vermilion :**
- **Grand-père paniqué (SS Aqua, arrivée)** — sa petite-fille a disparu du navire ; le joueur la retrouve (cachée au sous-sol, jeu de cache-cache) et reçoit un Manteau de Métal en remerciement — mini-quête complète en 3 PNJ (grand-père, marin du mess, capitaine) déjà esquissée mais désormais détaillée : un marin cherche un collègue endormi dans une cabine (le réveiller déclenche un combat), le Capitaine héberge la petite-fille et distribue aussi des Plaques collectionnables à qui revient certains jours de la semaine.
- **Président du Club des Fans** — récompense d'un Super Bonbon qui écoute son histoire jusqu'au bout (déjà noté).
- **Homme du comptoir du Club des Fans** — détient l'objet perdu de Copycat, à livrer à Safranville (amorce de la quête notée plus haut).
- **Steven (1ère apparition)** — intercepte le joueur devant le Club, intrigué par une espèce hors-région ; déclenche une rencontre légendaire en vadrouille ailleurs dans la région (fil Steven, voir Argenta/Safranville).
- **Eusine (cameo)** — aperçu sur la jetée en pleine chasse à Suicune ; pur flavor, cohérent avec le fil Eusine déjà établi côté Johto.

**Île Braise / Cinnabar :** ville sinistrée par l'éruption, contenu PNJ volontairement clairsemé (cohérent avec le ton "carrefour émotionnel" déjà noté) :
- **Blue (1ère rencontre)** — au nord du Centre Pokémon, renvoie à plus tard.
- **Blue (revisite tardive, post-Rock Climb)** — donne un objet porté (Magmarizer).
- **Panneau de relocalisation du Gym** — objet de décor, pas un PNJ, pointe vers Seafoam.
- **Photographe itinérant** — présence probable dans le secteur (Route 21/Seafoam), position exacte sur l'île elle-même incertaine dans l'OCR — 🔍 à vérifier avant usage.

---

### Kanto — Routes et donjons (passe 7, 2026-07-02 — ✅ formalisées en zones le 2026-07-02)

Complète les rosters de dresseurs de route déjà partiels (Routes 2/3/4/7-8/11/12/13/20-21) avec toutes les zones de transit et donjons non encore couverts. Comme pour les villes, cette passe ne change aucune décision d'adaptation (les CS-Kanji restent 飛/水/力 uniquement, pas d'équivalent pour Flash/Cut/Strength/Rock Climb/Surf listés ci-dessous — cités seulement comme repère "pourquoi cette zone est verrouillée dans le jeu d'origine"). **Chaque entrée a désormais un `zone_id` et une ligne dans `content/curriculum-checkpoints.md`** (voir la table de calibration pour le budget kanji exact de chacune).

- **`route-1-kanto`** — Route 1 (Vertville ↔ Bourg-Origine) : 4 dresseurs (Écolier Sherman, Écolier Danny, Dresseur Ace French, Dresseur Ace Quinn). Photographe itinérant en jours différents côté Vertville vs côté Bourg-Origine. Aucun obstacle.
- **`route-6-kanto`** — Route 5 / Route 6 / Passage Souterrain (Azuria–Safranville–Vermeille) : dresseurs confirmés (Jumeaux Amy & Dani, Pique-niqueuse Selina, Campeur Virgil). Vieille dame Route 5 donne un Talisman Anti-Combat pressentant un danger. PNJ du Passage Souterrain échange une spécialité locale (RageCandyBar) contre une CT. 🔒 Passage fermé tant que la Centrale Électrique n'est pas relancée.
- **`route-9-10-rocktunnel`** — Route 9 / Route 10 / Rock Tunnel : 6 dresseurs Route 9 (Campeur Sid, Randonneur Eoin, Pique-niqueuses Heidi/Edna, Campeur Dean, Randonneur Sidney) ; Route 10 au moins 2 Randonneurs (2ᵉ nom 🔍 incertain OCR). Rock Tunnel : **aucun dresseur** — donjon d'exploration pure, plongé dans le noir (🔒 Flash), objets cachés (dont 2 accessibles seulement après 力/Force). Garçon au Centre Pokémon voisin relaie le vol à la Centrale (PNJ-indice pur).
- **`kanto-power-plant`** — Kanto Power Plant : aucun dresseur. Le directeur furieux du vol d'une pièce mécanique la récupère et donne une CT une fois la pièce rendue (boucle avec Azuria/Route 24 ci-dessous). Vigile relaie un indice vers Azuria. Un ouvrier propose un troc simple. Ce lieu est le vrai hub de la quête "pièce volée" qui déverrouille aussi le Passage Souterrain.
- **`mont-lune-route-3-4`** — Mont Lune (Mt. Moon) : **aucun dresseur nommé** (contrairement aux Routes 3/4 alentour). Un petit comptoir marchand au milieu de la traversée. Lore autour de météorites à l'énergie étrange — bon matériau d'inscription/légende locale sans avoir besoin de l'espèce concernée. 📍 Embuscade Silver (voir fil Antre du Dragon plus haut).
- **`route-11-12-13-diglett`** — Routes 11-13 / Grotte Diglett : aucun dresseur en Grotte Diglett. PNJ de couleur locale surpris par les créatures qui surgissent du sol. Portier remet un objet de quête confié par le Pr. Chen/Oak ; une maison voisine donne une Pépite. 🔒 Passages nécessitant 力/Force pour un accès complet (donjon "à revisiter").
- **`route-2-foret-viridian`** — Forêt Viridian (complète la Route 2 déjà partielle) : 5 Insectophiles supplémentaires à l'intérieur de la forêt (en plus de celui déjà noté côté Route 2) — thème de classe homogène (100% Insectophiles), bon argument pour une identité de zone forte. 🔒 飛/Coupe pour l'arbre côté Argenta. Détail réutilisable : le texte source encourage explicitement la fouille systématique de la zone ("objets perdus dans la pénombre") — bon gabarit de mini scavenger-hunt de zone.
- **`route-14-15-kanto`** — Route 14 / Route 15 : 18 dresseurs au total confirmés par le texte (liste quasi complète : Jumeaux Kay & Tia, Passionnée Eleanor, Enseignante Colette, 2 Écoliers, Enseignante Hillary, Passionné Boone côté R15 ; Dresseur d'Oiseaux Josh, 5 Écoliers, 2 Passionnés, Enseignante Clarice, Dresseur d'Oiseaux Roy côté R14). 📍 Fille dans les hautes herbes (R14 ouest) demande à voir un compagnon précis contre un objet porté rare. 📍 Première apparition à pied du kanji-esprit légendaire (Suicune-analogue), Eusine en poursuite, oriente le joueur vers Route 25 — bon point de jonction avec le fil Eusine déjà tissé côté Johto. 🔒 Coupe requis ; rebords à sens unique imposant un ordre de traversée précis.
- **`route-16-17-18-cycling-road`** — Route 16 / Route 17 (Cycling Road) / Route 18 : Route 16, 1 dresseur (Motard Dale) + PNJ récurrent qui enseigne "un mot à la mode" par jour à qui revient le voir (bon gabarit de PNJ-leçon à visites répétées, cohérent avec la cadence SRS quotidienne). 🔒 Bicyclette obligatoire pour passer la porte suivante. Route 17 : descente à vélo dédiée, **12 Motards** au fil du parcours (3 nommés : Joel, Jacob, Aiden) — première occasion "d'échanger les numéros" pour un système de revanche. Route 18 : 9 dresseurs (7 Motards nommés + 2 Dresseurs d'Oiseaux). 🔒 Coupe pour l'ensemble du secteur.
- **`route-19-20-seafoam`** — Route 19 / Route 20 / Seafoam Islands : Route 20 (Île Braise ↔ Seafoam), 7-8 dresseurs (Nageurs/Campeurs/Pique-niqueuses/Dresseurs d'Oiseaux nommés). Route 19 (Seafoam ↔ Fuchsia), 7 Nageurs nommés ; 🔒 fermée narrativement tant que Seafoam n'est pas résolu ("travaux"). Seafoam Islands : classes de dresseurs à thème hivernal (Surfeur des neiges/Skieuse), cohérent avec le thème glace du Gym relocalisé. Puzzle B1F (blocs à pousser) et **sol de glace glissant B2F où les dresseurs postés servent de "freins"** pour stopper la glissade — excellent gabarit de puzzle environnemental-social, réutilisable tel quel pour un obstacle Chemin Glacé/Ebènelle bis. 🔒 Surf, 力/Force, et un CS supplémentaire (Rock Smash, sans équivalent ici) pour l'ensemble.
- **`route-21-kanto`** — Route 21 (Bourg-Origine ↔ Île Braise) : eau ouverte semée de bancs de sable ; l'éruption volcanique y est également mentionnée. 5 dresseurs nommés (Nageurs/Pêcheurs/Dresseur d'Oiseaux). 🔒 Surf ; objet bonus accessible seulement après 力/Force.
- **`mt-silver-route-28`** *(zone déjà existante, inchangée)* — Route 22 / Route 28 (Vertville → Mont Gris) : **confirmé explicitement sans le moindre dresseur ni objet** — corridor de transition délibérément vide avant la Porte de Réception/Mont Gris. Bon exemple rare de route "silencieuse" à assumer plutôt qu'à enrichir artificiellement.
- **`route-24-25-kanto`** — Route 24 / Route 25 (Azuria → Cap d'Azuria) : Route 24, combat scripté obligatoire contre le voleur de la pièce mécanique (Sbire isolé, dernier vestige de la Team Rocket "dissoute" — bon écho au thème du Grunt Solitaire de Mont Gris déjà établi), 2 dresseurs supplémentaires (🔍 attribution de zone incertaine). Route 25 : **gauntlet obligatoire de 6 dresseurs en ligne** (Campeur Lloyd, Fille Laura, Intello Pat, Écolier Joe, Fille Shannon, Dresseur Ace Kevin — ce dernier remet une Pépite), plus un 7ᵉ dresseur non listé officiellement qui ambush le joueur juste pour le plaisir du combat. 📍 Grand-père de Bill (Chaumière au bord de mer) — montrer un compagnon précis donne un objet évolutif au choix (quête de reconnaissance, callback Bill déjà noté). 📍 Misty trouvée en rendez-vous au bout de la route ; scène climactique de poursuite du kanji-esprit légendaire avec Eusine en commentateur. 🔒 Coupe et Surf.
- **`cerulean-cave`** — Grotte Azuria : donjon solo post-16-badges optionnel (hors séquence principale, même statut que Grotte Sombre/Ruines d'Alph intérieur côté Johto), **aucun dresseur**. 🔒 gardien à l'entrée jusqu'aux 8 badges Kanto complets (s'efface définitivement une fois rencontré) ; Flash obligatoire (grotte totalement plongée dans le noir), Surf + 力/Force pour la traversée complète.

**Repère transversal confirmé (passe 7) :** Steven (Champion visiteur d'une autre région) forme un fil en 3 étapes traversant 3 villes — 1ère rencontre à Vermeille (déclenche une rencontre légendaire ailleurs), 2ᵉ rencontre silencieuse à Argenta (simple flag), résolution à Safranville (don ou échange). Bon gabarit de "PNJ visiteur récurrent" si le studio veut un fil similaire côté kanji (ex. un chercheur itinérant qui pose une question différente à chaque rencontre).

**Dresseurs de Gym (avant le 師範) — ✅ nouveau, passe 6, lecture directe des sections de gym :** absent des passes précédentes, qui n'avaient que l'équipe du 師範 lui-même. Nombre et rareté des dresseurs "gardiens" avant le combat de Gym varient beaucoup d'une ville à l'autre — utile pour calibrer combien de dresseurs SRS placer par Gym Kanto dans le pipeline de contenu :

| Ville | Dresseurs avant le 師範 (nombre, noms si confirmés) |
|---|---|
| Vermeille (Surge) | 3 confirmés : Gentleman Gregory, Guitarist Vincent, Juggler Horton |
| Safranville (Sabrina) | 4 confirmés (ordre 🔍 incertain, mise en page OCR en désordre) : Medium Darcy, Psychic Franklin, Psychic Jared, Medium Rebecca — Gym en 9 chambres reliées par téléportation |
| Azuria (Misty) | 5 au total annoncés par le texte ; seuls 2 noms résistent à l'OCR 🔍 : Swimmer Briana, Swimmer Parker |
| Céladia (Erika) | 4 confirmés : Picnicker Tanya, Beauty Julia, Twins Jo & Zoe *(duo)*, Lass Michelle |
| Fuchsia (Janine) | 4 confirmés : Picnicker Cindy, Camper Barry, Lass Alice, Lass Linda |
| Argenta (Brock) | **Aucun** — le texte dit explicitement qu'on peut marcher droit jusqu'à Brock, seul Gym Kanto sans garde. Bon contrepoint de rythme si le studio veut varier la densité de dresseurs d'un Gym à l'autre. |
| Île Braise (Blaine, Seafoam) | ~5-6 annoncés, 🔍 ordre/décompte incertain (OCR) : Scientist Linden, Scientist Daniel, Super Nerd Merle, Super Nerd Waldo, Super Nerd Cary |
| Vertville (Blue) | 3 confirmés : Ace Trainer Bonita, Ace Trainer Salma, Ace Trainer Arabella — sol à tuiles-flèches (voir ci-dessus) |

**Repères transversaux confirmés (non attribués à une ville précise) :** Kanto Power Plant (pièce mécanique volée, quête de livraison — voir séquence complète Azuria/Cerulean ci-dessus), Rock Tunnel, Route 25 (un vieil homme cherche son petit-fils — beat similaire aux quêtes de livraison déjà documentées côté Johto), Steven (Champion de Hoenn, cameo à Vermeille City sur le fil Latias/Latios — probablement à couper, hors scope narratif).

### Rosters de dresseurs de route (passe 3, 2026-07-01)

Noms et classes confirmés par lecture directe des sections de route du guide. Les classes suivent le même principe que côté Johto (thème kanji libre par classe, non contraint mécaniquement — voir note PRD "Suppression du mécanisme kanji_pool-par-classe"). ⚠️ Couverture partielle — plusieurs routes (5, 6, 9, 10, 14 à 21, 22 à 25) n'ont pas encore de roster confirmé dans cette passe.

| Route | Dresseurs confirmés |
|---|---|
| Route 2 / Forêt Viridian | Bug Catcher Ed, Bug Catcher Abner, Bug Catcher Ellis, Bug Catcher Dane, Bug Catcher Stacey, Bug Catcher Dion |
| Route 3 | Youngster Warren, Youngster Jimmy, Hiker Bruce, Firebreather Burt |
| Route 4 | Youngster Regis, Double Team Zac & Jen *(duo)*, Firebreather Otis, Black Belt Manford, Black Belt Ander, Hiker Dwight, Picnicker Hope, Bird Keeper Hank, Picnicker Sharon |
| Route 7 / 8 | Young Couple Moe & Lulu *(duo)*, Super Nerd Sam ; Route 8 réputée pour ses Bikers "turbulents" (non nommés) |
| Route 11 | Psychic Fidel, Youngster Jason, Youngster Owen, Psychic Herman |
| Route 12 *("Silence Bridge")* | Fishermen (génériques — le pont doit son nom au fait qu'ils marchent en silence pour ne pas effrayer les Pokémon ; bonne texture d'ambiance à reprendre telle quelle) |
| Route 13 | Camper Clark, Hiker Kenny, Picnicker Ginger, Pokéfan Alex, Camper Tanner — 11 dresseurs au total confirmés par le texte (liste partielle) |
| Route 20/21 (Cinnabar ↔ Fuchsia) | Swimmer Luis, Camper Pedro (partiel — 12 dresseurs confirmés au total sur ce trajet) |

**Repère transversal confirmé :** le "Photographe itinérant" (Photographer Cameron) déjà documenté côté Johto dans "PNJ récurrents transversaux" réapparaît identique côté Kanto, avec un calendrier hebdomadaire par ville (ex. Safranville : lundi/mardi/mercredi près de la gare, vendredi/samedi près de Silph Co.) — confirme que c'est bien un personnage transrégional dans le jeu d'origine, bon fil à filer sur les deux régions dans 漢字の庭 si le studio adopte cette mécanique optionnelle.

**Autre callback Johto confirmé :** Safranville a sa propre gare de Magnet Train reliant directement à Doublonville (Goldenrod) — la boutique de vélos de Azuria City (Cerulean) est explicitement "le magasin d'origine" dont la succursale de Doublonville s'est développée. Deux liens concrets supplémentaires entre les deux régions à exploiter narrativement.

**✅ Ordre de zone confirmé, passe 6 :** en plus de l'ordre des 8 badges (déjà confirmé ci-dessus), le texte descriptif donne l'enchaînement effectif des villes/routes, utile pour l'ordre d'apparition sur la carte : Vermeille (arrivée par bateau) → Safranville (première visite, Gym ouvert d'emblée) → boucle Rock Tunnel/Centrale Électrique → Azuria → retour Safranville → Céladia → Fuchsia → Argenta (via Route 3/Mont Lune, voir embuscade Silver ci-dessus) → Vertville (Gym fermé au 1ᵉʳ passage, "le leader est absent") → Bourg-Origine (1ère visite, rien à faire) → Île Braise (Gym relocalisé Seafoam) → retour Vertville (Gym enfin ouvert) → retour Bourg-Origine (permission Mont Gris). Confirme et affine l'ordre déjà déduit par la passe 2/web ; aucune contradiction avec le tableau de badges ci-dessus, juste plus de détail sur les allers-retours.

**À faire avant l'écriture de contenu Kanto détaillé :** les rosters de dresseurs *avant chaque 師範* sont désormais couverts (voir tableau ci-dessus) ; restent à compléter : les équipes Pokémon de Misty/Erika/Brock/Blaine (hors-sujet pour l'adaptation — kanji/PNJ uniquement, cf. règles d'adaptation globales — donc faible priorité), les rosters des routes encore non couvertes (5, 6, 9, 10, 14 à 21, 22 à 25), et un calendrier PNJ complet équivalent à l'inventaire exhaustif du Johto. Priorité plus basse que le reste du jeu vu que Kanto est une extension de fin de partie (N1, ~1500-2000 kanji déjà maîtrisés par le joueur à ce stade).

---

## Zones absentes du jeu (v1)

Ces zones existent dans HGSS mais ne font pas partie des 49 zones de 漢字の庭. Leur absence est intentionnelle — le jeu simplifie la géographie pour réduire le scope de production.

**✅ Décision tranchée (2026-07-02) — option (b) adoptée :** "je veux que ce soit le vrai jeu, comme un émulateur" — les routes/donjons Kanto sourcés § "Kanto — Routes et donjons" ci-dessus ont reçu de vrais `zone_id` et une ligne dans `content/curriculum-checkpoints.md` (14 nouvelles zones, insérées dans l'ordre réel du jeu entre les 8 gates de badge déjà fixés). Le Kanto porte désormais 900→2136 kanji *(recalibré 2026-07-05, audit 01 — Ligue plate, Mont Gris plateau bonus, voir `content/curriculum-checkpoints.md` § Recalibrage majeur)* — voir la table complète et la note associée dans `curriculum-checkpoints.md`. Seule **Grotte Azuria (Cerulean Cave)** reste un donjon post-16-badges optionnel, hors séquence principale, même statut que Grotte Sombre/Ruines d'Alph intérieur côté Johto.

| Zone HGSS | Statut dans 漢字の庭 | Traitement |
|-----------|-------------------|------------|
| **Union Cave** | ❌ Hors scope | Relie Azalea Town à Goldenrod via Ilex Forest dans HGSS. Dans le jeu, la traversée passe directement par Ilex Forest → Route 34 sans grotte. Aucun décor Union Cave sur la carte. Le guidebook y recense 7 dresseurs nommés (Randonneurs, Maniaques, Dresseurs Ace) — non repris, hors scope confirmé. |
| **Route 41** | ❌ Fusionnée dans Route 40 | Route maritime entre Route 40 et Cianwood. Dans le jeu, Route 40 couvre l'ensemble de la traversée en mer vers Irisia. Le guidebook y recense ~10 Nageurs supplémentaires, fusionnés conceptuellement dans le pool Route 40. |
| **Route 43** | ❌ Absente | Relie Mahogany Town au Lac Colère dans HGSS. Dans le jeu, Lac Colère est une zone directement adjacente à Acajou Ville (accès direct, pas de route séparée). Le guidebook y recense un poste de péage Team Rocket et un Apricorn Noir caché — voir section Apricorns (le Noir a été réattribué au Lac Colère). |
| **Route 46** | ❌ Absente | Petit connecteur au nord de Route 29, bloqué par un rebord à sens unique dans HGSS ; un seul dresseur (Randonneur) y est recensé. Non repris — Route 29 garde son tease visuel de grille fermée sans zone jouable derrière. |
| **Ruins of Alph (intérieur)** | ⚠️ Partiel | Les 4 salles intérieures avec puzzles Unown sont hors scope. Seule la zone extérieure est jouable (inscriptions + Rocket event). |
| **Dark Cave (intérieur)** | ❌ Décor seulement | Entrée visible sur la carte, mais l'intérieur n'est pas jouable en v1. |
| **Mt. Mortar (intérieur)** | ❌ Décor seulement (mais voir note v2) | Entrée visible sur la carte depuis Route 42, aucun dungeon intérieur en v1. Le guidebook y documente un beat de "dojo caché" fort (voir section mt-mortar) — bon candidat de contenu pour une extension post-v1. |
| **Routes 47/48, Cliff Cave, Safari Zone Gate** | ❌ Hors scope | Zone Safari Zone de Cianwood (HGSS), entièrement liée à une mécanique de capture absente du jeu. Aucun équivalent prévu. |
| **Whirl Islands** | ❌ Hors scope (variante SoulSilver) | Chemin alternatif vers Lugia, exclusif à SoulSilver ; 漢字の庭 suit le chemin Bell Tower/Ho-Oh (déjà choisi via "Tour Jo" à Rosalia), rendant les Whirl Islands sans objet. |
| **Battle Frontier** | ❌ Hors scope | Contenu post-Hall of Fame sur Route 40 ; reste hors scope même après l'ajout des 8 gyms Kanto (2026-07-01, voir § Kanto ci-dessus) — le Battle Frontier est un système de combat annexe distinct des gyms, pas repris. |

---

*Dernière mise à jour : 2026-07-01 — enrichi en six passes : passe 1 (OCR archive.org du guidebook Prima 2010 Johto), passe 2 (texte natif du PDF local Johto, plus fiable, avec inventaire PNJ exhaustif par zone et bios officielles), passe 3 (recherche web Bulbapedia pour Mont Gris/Red, absent du guidebook Johto à l'époque), passe 4 (ajout de l'arc Kanto — 8 gyms — structure et ordre sourcés par OCR archive.org du guide Prima Kanto, le PDF local étant un scan sans texte natif), passe 5 (lecture directe des sections descriptives par ville du guide Kanto — équipes de 4 des 8 Gym Leaders, callbacks Johto confirmés (Mont Mortier, Tunnel de Doublonville, Tour Jo, Baoba), détail Cinnabar/Seafoam Islands et fil Blue ; dépouillement dresseurs de route encore à faire, voir § Kanto), passe 6 (recherche ciblée dans `kanto-guide-fulltext.txt` : la note de la passe 3 disant "aucun guide Kanto local" était devenue fausse — ce fichier existe désormais dans le repo — d'où une réécriture § mt-silver-summit avec la source primaire ; ajout de Bourg-Origine/Pallet Town, des rosters de dresseurs avant chaque 師範, du fil Mont Lune/Silver reliant Kanto à la Tag Battle de l'Antre du Dragon, et de la séquence complète Azuria/Cerulean ; dresseurs de route et équipes Pokémon des 4 derniers Gym Leaders toujours à compléter).*
