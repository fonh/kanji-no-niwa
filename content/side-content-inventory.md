# Inventaire du contenu optionnel sourcé — 漢字の庭

Document interne — non visible par le joueur. Créé le 2026-07-06 (audit 02, phase 2, à la demande
de l'équipe produit) : recense **tout le contenu optionnel sourcé du guidebook** (hors gyms et
combats obligatoires du chemin critique), comme vivier pour le placement des ~70-100 textes
secondaires (`content/texts-progressifs.md` § Textes secondaires) et des PNJ-leçon.

**Source unique :** `content/guidebook-adapted.md` (réfs de ligne indiquées par item, état du
2026-07-06). Aucun PNJ inventé — tout ce qui suit est sourcé Prima 2010 (Johto passe 2 texte natif,
Kanto passes 5-7 OCR) ou Bulbapedia (passe 3, Mont Gris uniquement).

**Règles d'usage (déjà actées ailleurs, rappelées ici) :**

1. **Priorité d'attribution des PNJ** : leçons d'abord, PNJ-texte ensuite, objet trouvé par défaut
   dans les zones pauvres (`texts-progressifs.md` § Priorité d'attribution).
2. **Les textes secondaires remplacent les side quests classiques** — cette liste est donc leur
   matière première directe, pas un supplément.
3. **Invariant de placement anti-deadlock (audit 02, 2026-07-06)** : un texte doit être atteignable
   **sans aucun CS-Kanji** au moment où sa zone se débloque (exception : CS obtenu strictement
   avant le déblocage de la zone). Vérification automatisable contre `map_obstacles` à la production.
4. **Aucune v2** (décision 2026-07-06) : les contenus ex-« v2/post-v1 » listés en § E sont du
   scope v1 — leur réintégration chiffrée (impact progression) est instruite par l'audit 09.
5. Aucun français dans le produit ; anglais selon PRD § Langue du Jeu.

---

## A. Textes « tout trouvés » — le contenu textuel existe déjà dans la source

Prêts à écrire : la fiction fournit le document lui-même (lettre, livre, inscription, légende).
Candidats prioritaires pour `found_object_ref` ou remise par PNJ existant.

| # | Texte | Zone | Réf. | Détail source |
|---|---|---|---|---|
| A1 | Lettre du gendre de Kurt, portée par le Ramoloss du fond du puits (« tenez le fort ensemble ») | slowpoke-well | L428, L436 | Détail sentimental, texte de lecture courte explicitement noté « tout trouvé » |
| A2 | Livre de la légende des trois esprits et des deux tours | ecruteak-city | L617, L623 | Dans la maison de l'homme à l'énigme (Dowsing MCHN), à l'ouest du Centre Pokémon |
| A3 | Rapport Unown (journal de fouille qui s'auto-remplit) + 5 inscriptions | ruins-of-alph | L328, L336, L341, L344 | Remis après le 1er puzzle ; les 4 entrées d'origine sont séquencées en difficulté croissante (aucun objet → Coupe → … → Force) — calque direct pour étaler les 5 inscriptions |
| A4 | Carnet des Frères/sœurs du jour (maison-index des 7 emplacements/jours) | route-26 | L74, L414, L976, L982 | Objet de quête-index ; lie la mécanique calendaire § C |
| A5 | Inscription au fond de l'antre, 4 lignes à traduire (N1) | dragons-den | L924 | Déjà au PRD (NPC quest N1) ; reward lore + dialogue Fukuda |
| A6 | Inscription ancienne de la Tour Grospignon (N5/N4) | sprout-tower | L276, L240 | Cible de la fetch quest du Hiker de Mauville |
| A7 | Panneau « Vous entrez dans Johto » (N5, hiragana) | route-29 | L162 | Tutoriel de lecture environnementale ; le guide dit explicitement « lisez les panneaux » (L217) |
| A8 | Sanctuaire du gardien de la forêt (kami/esprits protecteurs) | ilex-forest | L453 | Découvert après l'arbre coupé ; cohérent avec l'esthétique « jardin » du titre |
| A9 | Légende de l'être arc-en-ciel **en 2 fragments** (conteur croisé Gym puis Tour Embrasée) | ecruteak-city | L618 | Modèle « légende livrée en plusieurs fragments à travers la zone » |
| A10 | Légende des 4 îles créées par le gardien des tourbillons | cianwood-city | L759 | Homme à l'ouest du Centre Pokémon |
| A11 | Histoires des nageurs sur le gardien légendaire (« des tas d'histoires ») | route-40 (ex-41) | L755 | Réservoir de lore orale — plusieurs PNJ-conteurs en mer |
| A12 | Lore des météorites à l'énergie étrange | mont-lune-route-3-4 | L1356 | Inscription/légende locale sans besoin de l'espèce d'origine |
| A13 | Radio cassée dans la grotte derrière les chutes | route-27 (Tohjo) | L986 | Mystère sans payoff mécanique dans la source — parfait texte d'ambiance |
| A14 | Mail d'un collègue chercheur sur le PC d'Oak | Bourg-Origine | L1282 | Lecture d'ambiance |
| A15 | Mail de Lyra/Ethan sur le PC du joueur (« tu as du courrier ») | new-bark-town | L124, L134 | Première lecture possible du jeu entier, ton motivant |

## B. Quêtes fetch / courrier — « trouvé ici, rendu là »

Structure déjà validée par ADR-0003 (pattern Forêt Secte) : `grant_item` → `item_owned` gate le
PNJ payoff → récompense. Chaque ligne est un squelette de quête complet.

| # | Quête | Zones reliées | Réf. | Mécanique source |
|---|---|---|---|---|
| B1 | Poupée de Copycat : trouvée au comptoir du Club des Fans, rendue à Copycat contre le Pass Train Aimant | Vermeille → Safranville | L1254, L1329, L1336 | Quête filée sur 2 villes ; le Pass ouvre le Magnet Train (callback Doublonville) |
| B2 | Pièce mécanique volée : Sbire isolé d'Azuria (combat scripté Route 24) → restitution → Centrale relancée → passage souterrain R5/R6 rouvert | Azuria → kanto-power-plant | L1258, L1301, L1355, L1364 | Le Sbire « n'a jamais reçu le mémo de dissolution » — écho comique du Grunt Solitaire |
| B3 | Potion Secrète pour le gardien malade du Phare (Jasmine absente du Gym, tous ses dresseurs au Phare) | Oliville ↔ Irisia | L707-713, L720-722, L749, L760 | Mini-arc en 3 temps avec 9 dresseurs nommés dans le Phare ; « Gym vide jusqu'à condition » |
| B4 | Écaille Rouge du Lac Colère → rapportée à Mr. Pokémon contre l'Exp. Share | lake-of-rage → route-30 | L222, L840, L842 | Callback longue distance vers un PNJ du tout début ; l'objet est garanti quelle que soit l'issue du combat |
| B5 | Courrier « Kenya » à livrer (compagnon-courrier confié) | route-31 | L216, L225 | Quête-courrier simple contre TM44 |
| B6 | Petite-fille disparue du SS Aqua : grand-père paniqué → cache-cache au sous-sol → Manteau de Métal | Quai SS Aqua (Vermeille) | L1334 | 3 PNJ (grand-père, marin endormi à réveiller = combat, capitaine) |
| B7 | Quête courrier de la grille nord (objet porté par un oiseau sauvage, HP Up au retour) | goldenrod-city | L525 | — |
| B8 | Fetch « pierre rouge au sommet » (Hiker N5/N4, déjà au PRD) | violet-city → sprout-tower | L240 | Payoff = lecture de l'inscription A6 |
| B9 | Parchemin caché dans la glace (quête express N2, thème « Mahogany ») | ice-path | L864 | Déjà au PRD |
| B10 | Ramener Earl l'instituteur errant à son école | violet-city | L250, L257 | « Il faut aller le chercher avant qu'il enseigne » — PNJ-leçon avec pré-quête |
| B11 | Apricorn Box (homme Route 30) puis cueillette des 7 couleurs sur 12+ zones | tout Johto | L213, L224, L1147-1163 | Alimente le système Kurt (§ G1) ; table couleur→objet→zones corrigée en fin de guidebook |
| B12 | Vieil homme de la Route 25 qui cherche son petit-fils | route-24-25-kanto | L1382 | Beat de quête de livraison, similaire aux quêtes courrier Johto |

## C. PNJ calendaires & visites répétées — v1 (décision 2026-07-06, audit 02)

Nécessitent le type `Condition.time_window(days_of_week?, hour_range?)` + la règle de fréquence
sur `advance_quest` (une avance par fenêtre de temps), adoptés en audit 02. Collent à la cadence
quotidienne SRS de l'app.

| # | Contenu | Zone(s) | Réf. | Rythme réel |
|---|---|---|---|---|
| C1 | **7 Frères/sœurs du jour** : Monica (R40, lun), Tuscany (R29, mar), Wesley (Lac Colère, mer), Arthur (R36, jeu), Frieda (R32, ven), Santos (Ebènelle, sam), Sunny (R37, dim) — objet à la 1ère rencontre, ruban-collection une fois les 7 vus | 7 zones + maison-index R26 | L74, L158, L166, L302, L311, L414, L590-591, L756, L850, L910 | 1 jour de semaine chacun ; Tuscany visible seulement après le badge de Mauville |
| C2 | **Photographe itinérant** (Cameron) — calendrier hebdo différent par zone, Johto **et** Kanto ; sa famille tient une maison à Irisia | ~10 zones Johto + Bourg-Origine, Vertville, Argenta, Céladia, Île Braise | L70, L758, L1279, L1289, L1296, L1313, L1344, L1399 | Hebdo, par zone (ex. Safranville : lun/mar/mer gare, ven/sam Silph) ; actif après le badge de Doublonville |
| C3 | Homme du toit des Condominiums — donne un Grigri Esprit | Céladia | L1262, L1305 | 20h–4h uniquement |
| C4 | **Daisy** (sœur de Blue) — toilettage quotidien ; au bout de **7 visites cumulées**, donne le contact de Blue pour un combat de revanche post-16-badges | Bourg-Origine | L1272, L1280 | 15h–16h, compteur multi-jours (règle de fréquence sur `advance_quest`) |
| C5 | **Ferme Moomoo** — nourrir le Miltank malade avec 7 baies sur plusieurs visites ; récompenses multiples (Seal Case, décorations, TM, spécialité en vente) | route-38/39 | L684, L689 | Multi-visites ; consomme les baies des Pots à Baies (§ E10) ; « une visite par jour » recommandé par le guide adapté |
| C6 | PNJ « un mot à la mode par jour » — **PNJ-leçon quotidien tout trouvé** | route-16-17-18 | L1360 | Quotidien, visites répétées — le gabarit le plus proche d'une leçon SRS quotidienne |
| C7 | Trainer House — un combat par jour | Vertville | L1287 | Quotidien |
| C8 | Buena — mot de passe radio quotidien à deviner, points cumulés (Blue Card) | goldenrod-city (Tour Radio 2F) | L522 | Quotidien ; lié à la Radio Card (quiz réceptionniste, § F) |
| C9 | Capitaine du SS Aqua — distribue des Plaques collectionnables certains jours | Quai SS Aqua | L1334 | Hebdo |
| C10 | Fille du 5F du grand magasin — TM27 si affection élevée | goldenrod-city | L527 | Dimanche uniquement |
| C11 | Dresseurs nocturnes : Policier Keith (R34), Policier Dirk (R35) | route-34, route-35 | L473, L479, L548, L556 | 20h–4h — dresseurs-leçon « nocturnes » potentiels |
| C12 | Fille aux 3 décorations gratuites par jour | olivine-city | L719 | Quotidien |
| C13 | Pluie permanente au Lac Colère sauf le mercredi (niveau d'eau baissé → nouveaux passages/dresseurs Aaron & Lois) | lake-of-rage | L843, L851 | Hebdo — variante météo/terrain calendaire |
| C14 | Personnel rotatif du Tunnel de Doublonville (Salon, Herboriste, Discount) | goldenrod-city | L517 | Hebdo ; faible valeur narrative, noté pour exhaustivité |
| C15 | Concours d'insectes du Parc National (mar/jeu/sam dans la source ; supprimé du scope — mécanique de capture) | national-park | L537, L541, L561 | Noté pour mémoire : créneau réutilisable si le Pokéathlon veut un événement calendaire |

## D. Fils narratifs multi-zones (PNJ récurrents)

Squelettes de quêtes filées : plusieurs rencontres, un payoff. Se modélisent en une `Quest` à
`steps[]` ordonnés dont les PNJ vivent dans des zones différentes (ADR-0003/0004).

| # | Fil | Étapes sourcées | Réf. |
|---|---|---|---|
| D1 | **Eusine, chasseur de légende** — le fil optionnel le plus long du jeu | Tour Embrasée (avec Morty) → Irisia (défi en combat après apparition de l'esprit) → Route 42 est (nouvel aperçu) → cameos Kanto : jetée de Vermeille, Route 14/15 (1ère apparition à pied), Route 25 (scène climactique de poursuite, Eusine commentateur) ; mystère jamais bouclé de « qui est son grand-père » | L71, L91, L662-663, L751, L786, L1338, L1359, L1364 |
| D2 | **Steven** (Champion visiteur) en 3 étapes | Vermeille (intercepte le joueur, déclenche une rencontre légendaire ailleurs) → Argenta (cameo silencieux à l'expo minérale, simple flag) → Safranville Silph Co. (question → compagnon-cadeau ; revisite → échange) | L1295, L1330-1331, L1337, L1367 |
| D3 | **Baoba** et son fils | Route 39 (1ère rencontre, échange de contact) → rappels téléphoniques → annonce de la réserve d'Irisia ; son **fils** gère le Pal Park de Fuchsia | L72, L685, L690, L722, L1319 |
| D4 | **Bill** et sa famille | Rosalia (Centre Pokémon, inventeur du PC) → Doublonville (cadeau Eevee-analogue ; petite sœur donne son numéro) → grand-père (Chaumière Route 25 : montrer un compagnon précis → objet évolutif au choix) ; indice à Fuchsia (« le grand-père de Bill est parti lui rendre visite ») | L73, L515, L616, L622, L1317, L1364 |
| D5 | **Trace de Silver à Irisia** — le jeune homme au Shuckle confié raconte le passage du « garçon roux qui a pris un objet précieux » | cianwood-city | L750, L761 |
| D6 | **Blue** en 2 temps | Île Braise (rencontre, « reviens avec plus de badges ») → Vertville (vrai combat de Gym) ; revisite tardive → Magmarizer | L1268, L1270, L1341-1342 |
| D7 | **Lignée Lance/Clair/Maître** révélée en 3 zones | Lac Colère (Lance recrute) → QG Rocket (double combat) → Antre du Dragon (révélation : le Maître est leur grand-père, Lance le frère aîné) | L76, L813, L816, L930 |
| D8 | **Mère de Red** — tient la maison en son absence, confirme qu'il voyage | Bourg-Origine | L1281 |
| D9 | Lore Red en creux : « c'est un garçon nommé Red qui a démantelé la Team Rocket il y a trois ans » (Ecorcia) ; « un garçon et son vélo » (magasin de vélos d'Azuria) | azalea-town, Azuria | L407, L1299 |
| D10 | **Callbacks inter-régions** (liens concrets Johto↔Kanto à exploiter) : gare Magnet Train Safranville↔Doublonville ; vélos « magasin d'origine » Azuria → succursale Doublonville ; masques de Wake (Céladia) utilisables au Dress-Up Shop du Tunnel de Doublonville ; karatéka du dojo de Safranville « parti s'entraîner au Mont Mortier » (le dojo devient hub de revanche des 師範 post-16 badges) ; RageCandyBar d'Acajou troquée contre une CT au Passage Souterrain | multi | L1256, L1262, L1299, L1304, L1328, L1353, L1401 |

## E. Mini-donjons & puzzles — ex-« v2 » réintégrés v1 (décision 2026-07-06)

Étiquettes « v2/post-v1 » supprimées (décision « aucune v2 »). La réintégration chiffrée
(impact sur les comptes de progression de l'audit 01 : zones, distribution kanji) est instruite
par l'audit 09 (synthèse). Le puzzle du Chemin Glacé (E4) était déjà obligatoire de fait.

| # | Contenu | Zone | Réf. | Détail source |
|---|---|---|---|---|
| E1 | **Karate King (Black Belt Kiyo)** — médite tout au fond, accessible seulement après une traversée d'eau ; combat sur `talk`, récompense « en reconnaissance de la victoire ». + 3 dresseurs internes (Super Nerd Hugh/Marcus, Poké Maniac Harrison) | mt-mortar (intérieur) | L781, L787 | Mini-donjon dōjō, cohérent avec l'identité Sensei/道場 du jeu |
| E2 | **Grotte Sombre** — zone à 2 entrées (Mauville / Ebènelle), long tunnel, gating à deux temps (1ère traversée facile, 2e exigeante) ; un homme tout au fond (accessible après l'Antre du Dragon) donne BlackGlasses | dark-cave | L218, L953, L958 | Modèle « retour avec nouvelles connaissances » |
| E3 | **Tour Jo — ascension en 8 temps** : gardien (badge) → Bellchime Trail → Sage 1F (Plume requise) → 1F-6F échelles + rampes à sens unique → 7F-9F téléporteurs → 10F → toit : danse rituelle des 5 Kimono Girls, résonance des cloches, apparition du légendaire ; rejouable si échec | ecruteak-city (Tour Jo) | L633-643 | Climax de l'arc Kimono ; remplace « bâtiment tappable, scène collective » |
| E4 | **Puzzle du Chemin Glacé** — 3 étages de glace coulissante, rochers à pousser dans des trous ; 滝 caché derrière une séquence de glissades coordonnées | ice-path | L871-873 | **Déjà porteur du CS-Kanji 滝** (`event_cleared(ice_path_puzzle_solved)`) — l'étiquette v2 était une trace obsolète (finding audit 02) |
| E5 | Les 4 entrées séquencées des **Ruines d'Alph** (NE→SE→NO→SO, exigence croissante) | ruins-of-alph | L344, L1421 | Calque pour étaler les 5 inscriptions en paliers |
| E6 | **Seafoam Islands** — puzzle B1F (blocs), sol de glace B2F où **les dresseurs postés servent de freins** pour stopper la glissade ; classes hivernales cohérentes avec le Gym relocalisé de Blaine | route-19-20-seafoam | L1361 | « Puzzle environnemental-social », réutilisable tel quel |
| E7 | **Rock Tunnel** — donjon d'exploration pure dans le noir, aucun dresseur, objets cachés (2 derrière 力) | route-9-10-rocktunnel | L1354 | Couloir sombre narratif (Flash sans équivalent CS) |
| E8 | **Grotte Azuria** — donjon solo optionnel post-16-badges, aucun dresseur, gardien à l'entrée jusqu'aux 8 badges Kanto | cerulean-cave | L1365 | Même statut que Grotte Sombre |
| E9 | **Puzzle des électroménagers** (Silph Co. sous-sol) — examiner micro-ondes/ventilateur/frigo/lave-linge/tondeuse change la forme d'un esprit-appareil | Safranville | L1325 | Mini-puzzle d'exploration sans combat ni PNJ parlant |
| E10 | **Pots à Baies** de Floria (remerciement post-Simularbre) — mini-feature de jardinage/soin | route-36 → usage route-38/39 | L584 | Nourrit la ferme Moomoo (C5) ; cohérente avec le thème « jardin » du titre |
| E11 | Grille Route 29 → Route 46 : « reviens plus tard » (rebord à sens unique — Route 46 réintégrée 2026-07-06, audit 04 : le tease devient un vrai accès différé) | route-29 | L159, L1420 | Non bloquant |
| E12 | Route 45 scindée en chemins est/ouest impossibles en une traversée → revisite via 飛 | route-45 | L952, L1192 | Illustration concrète de l'utilité de 飛 |

## F. PNJ-leçon potentiels & donneurs simples

PNJ sourcés à recatégoriser en 3ᵉ catégorie (PNJ-leçon) ou en porteurs de texte. Le contenu
pédagogique exact est fixé à l'écriture (jamais dynamique, PRD § Leçons).

| # | PNJ | Zone | Réf. | Angle naturel |
|---|---|---|---|---|
| F1 | Earl, instituteur de l'École Pokémon (à ramener, § B10) | violet-city | L250, L257 | PNJ-leçon littéral dans la source |
| F2 | Enseignant du banc sud du Parc National | national-park | L553, L560 | « Professeur qui enseigne une astuce plutôt qu'un objet » |
| F3 | Guide Gent — fait visiter la ville, Running Shoes + Map Card | cherrygrove-city | L186, L190 | Vocabulaire des lieux (建物、駅、店…) |
| F4 | Homme à l'énigme (bonne réponse → Dowsing MCHN) | ecruteak-city | L617, L623 | Question/réponse = format quiz naturel ; sa maison contient A2 |
| F5 | Mr. Psychic — CT gratuite | Safranville | L1323 | Donneur simple |
| F6 | Président du Club des Fans — récompense qui écoute son histoire **jusqu'au bout** | Vermeille | L1254, L1335 | Patience/politesse — l'écoute comme épreuve |
| F7 | **Maison du Tuteur/Effaceur** : 4 PNJ nommés dans la même pièce (Tuteur Ultime, Grand-mère Wilma, Maniaque des capacités, Effaceur) | blackthorn-city | L903-907 | 4 dresseurs-leçon spécialisés sous un même toit |
| F8 | Vieil homme retraité aux 998 sauts (défie d'atteindre 1000) | national-park | L557 | Hook Pokéathlon |
| F9 | Fille évaluatrice d'affection ; Name Rater | goldenrod-city | L519, L523 | Donneurs d'ambiance |
| F10 | Idole retraitée — cachée Route 28, TM47 **contre le silence du joueur** sur sa cachette | mt-silver-route-28 | L1078 | Rencontre-secret discrète, ton « retraite » |
| F11 | Fille dans les hautes herbes — objet rare contre un compagnon précis montré | route-14-15-kanto | L1359 | Quête de reconnaissance |
| F12 | Réceptionniste Tour Radio — quiz 5 questions → Radio Card | goldenrod-city | L520 | Quiz déjà dans la source ; prérequis de Buena (C8) et de la radio améliorée |
| F13 | Vieux fermier de la ferme Moomoo (dialogue humour N4, déjà au PRD) | route-39 | L679 | Absorbe C5 s'il devient quête |
| F14 | Vendeur de « queue de Ramoloss » à ¥1 000 000 (comique, le joueur décline) | route-32 | L313 | Flavor pur, leçon sur les grands nombres possible |
| F15 | Garçon « j'ai vu un arbre qui bouge » (teaser Simularbre posé à Mauville) | violet-city | L251, L262 | Teaser → blocage → résolution en 3 temps (L583) |
| F16 | Homme de la RageCandyBar — rituel « goûter la spécialité avant de passer » | mahogany-town | L808, L820 | Micro-interaction d'hospitalité |
| F17 | Donneurs simples de zone : Graine Miracle (R32 L305), Vieille Canne (R32 L314), Bonne Canne (Oliville L717), TM05 post-力 (R32 L315), 2 Lure Balls (R32 L316), Talisman Anti-Combat (R5 L1353), Pépite (Grotte Diglett L1357), vieille dame TM37 si affection (Tohjo L985), fille qui soigne gratuitement (R26 L977, L983), fille avis Poké Ball → combat (Oliville L718), garçon blond troc éclats→baies (Mauville L258), PNJ d'échange (Mauville L261, Ebènelle L911), fille ruban d'effort (Ebènelle L908) | diverses | — | Réservoir de micro-contenus |
| F18 | GAME FREAK (Céladia) : directeur son (objet-clé qui change la musique, post-badges), réalisateur (quête à 2 paliers), président + Maylene + Wake (cameos) | Céladia | L1304, L1306-1310 | Récompense musicale = cosmétique idéal (tier cosmétique des textes secondaires) |
| F19 | Vigile Silph Co. (objet-souvenir) ; fille de la gare (tease Pass) ; Copycat qui imite le joueur | Safranville | L1324, L1326-1327 | Ambiance + boucle B1 |
| F20 | Fuchsia : fille lore Safari déménagée, fille indice grand-père de Bill, visiteur au chapeau (accessoire cosmétique) | Fuchsia | L1316-1320 | Ambiance/cosmétique |
| F21 | Comptoir du Musée — restaure un fossile apporté (« PNJ artisan qui transforme un objet ») ; vieil homme de la colline (Aile légendaire post-Ligue, callback Tour Jo) | Argenta | L1266, L1293-1294 | Artisan = même gabarit que Kurt |
| F22 | Garçon d'Azuria — indique où trouver Misty, puis signale une anomalie à la rivière | Azuria | L1300 | PNJ-indice à 2 états |
| F23 | Grunt Solitaire — pas de combat, dialogue N2 : lui apprendre que la Team Rocket s'est dissoute | mt-silver-upper | L1055 | « L'obstacle le plus mélancolique du jeu » — déjà au PRD |
| F24 | Ancien Li (sommet Tour Grospignon) + 6 Sages nommés (Neal, Troy, Jin, Nico, Edmond, Chow) | sprout-tower | L281, L286-288 | Thème 修行 ; Silver en scène passive au 3F |
| F25 | Homme du Centre Pokémon d'Irisia — « Chuck s'entraîne sous une cascade » + remarque l'absence de l'homme à lunettes récurrent | cianwood-city | L762 | Méta-PNJ d'ambiance |
| F26 | Trio Ace « Kate et ses deux sœurs » — combat de groupe caché après traversée d'eau | route-34 | L473, L480 | Combat optionnel mis en scène |
| F27 | Gauntlet de la Route 25 : 6 dresseurs en ligne + un 7ᵉ non listé qui ambush « pour le plaisir » ; Misty en rendez-vous au bout | route-24-25-kanto | L1364 | Séquence optionnelle dense, préalable au retour de Misty au Gym |
| F28 | Femme de Chuck — remet 飛 et commente avec tendresse la défaite de son mari | cianwood-city | L752, L764 | Humanise un 師範 vaincu (remise déjà au PRD) |

## G. Systèmes répétables (objets fongibles — régime non idempotent, audit 02)

Ces mécaniques exigent le régime « fongible » de `grant_item` (l'idempotence stricte est réservée
aux objets narratifs uniques — finding 02-A2).

| # | Système | Zone | Réf. | Boucle |
|---|---|---|---|---|
| G1 | **Kurt** : dépôt d'Apricorns → une Boule par fournée, en 24h, un seul type par fournée, **indéfiniment** | azalea-town | L90, L375, L389-401, L1161 | Le cas canonique d'objet fongible ; mapping couleur→objet complet L392-400 |
| G2 | Arbres Apricorn — une couleur par arbre, repousse en 24h | 12+ zones | L1147-1163 | Alimente G1 |
| G3 | **Pokéathlon** — 4 disciplines + Prize Shop rotatif ; maillot de Whitney ; Apriblender (Aprijuice) | national-park | L540, L551, L558-559 | Hub mini-jeux déjà au PRD ; condition de Chuck (`pokéathlon_score ≥ 250`) L542 |
| G4 | Concours de pêche du Fishing Guru (record → Ether) | lake-of-rage | L849 | Accessible post-QG, à la nage |
| G5 | Trocs récurrents : fragments→baies (Fuchsia L1318), éclats→baies (Mauville L258), ouvrier de la Centrale (L1355), Passage Souterrain RageCandyBar→CT (L1353) | diverses | — | Micro-économies locales |
| G6 | Stand Loterie de la Tour Radio (tirage quotidien) — **réintégrée (2026-07-06, chasse aux reliques audit 04, remplace « supprimée du scope »)** ; mécanisme de tirage et récompense à designer à la synthèse (l'original tire sur l'ID du compagnon — concept à spécifier) | goldenrod-city | L521 | Boucle quotidienne |

---

## Récapitulatif

~75 contenus optionnels sourcés : 15 textes tout trouvés (A), 12 squelettes de quêtes fetch (B),
15 mécaniques calendaires/répétées (C), 10 fils multi-zones (D), 12 mini-donjons/puzzles (E),
28+ PNJ-leçon/donneurs (F), 6 systèmes répétables (G). La cible de ~70-100 textes secondaires
(`texts-progressifs.md`) est couverte par le seul contenu sourcé, sans inventer un seul PNJ.

**Prochaines étapes qui consomment ce document :**
- Passe de placement des textes secondaires (sélection + `npc_ref`/`found_object_ref` par zone),
  en respectant l'invariant anti-deadlock (§ règles d'usage, point 3).
- Audit 09 (synthèse) : chiffrage de la réintégration des ex-v2 (§ E) dans les comptes de
  progression de l'audit 01.
- Écriture des quêtes : chaque ligne de § B/D est un squelette `Quest` prêt à formaliser en
  `steps[]` (ADR-0003).
