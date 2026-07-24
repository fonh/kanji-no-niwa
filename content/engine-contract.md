# Contrat contenu↔moteur

Document créé 2026-07-23 (Étape 4, phase 0.5), à la demande de la double revue
game designer + professeur de japonais du même jour. **But** : lister exhaustivement ce que
le contenu (`content/`) suppose que le moteur produit ou applique sans qu'aucun fichier de
contenu ne l'écrive explicitement — sinon l'équipe code doit deviner. Complète, sans les
dupliquer, les décisions déjà actées dans `CONTEXT.md`/ADR/`PRD.md`.

Étendu à chaque lot si une nouvelle mécanique moteur-only apparaît ; `lint-cross-refs.py`
vérifie mécaniquement les deux premières sections (0.6).

## 1. `event_cleared` consommés par le contenu, émis par le moteur

Le contenu lit ces `event_id` via `Condition { type: "event_cleared" }` mais aucun fichier de
contenu ne les émet (ce ne sont pas des `advance_quest`/Quest Step) : c'est une mécanique de
jeu (scène scriptée, puzzle, dialogue spécial) qui doit poser l'event quand sa condition
narrative est remplie.

| `event_id` | Condition d'émission | Consommateurs |
|---|---|---|
| `misty_met_viewpoint` | Le joueur a vu la scène du point de vue de la finale Suicune (Route 24/25, `content/dialogues/npcs/route-24-25-kanto/`) | `content/map/npcs.json` (1, sbire isolé du gym d'Azuria — `negate`), `content/map/trainers.json` (6, gym peuplé de Misty) — 7 au total |
| `ice_path_puzzle_solved` | Le puzzle de glissades du Chemin Glacé est résolu (menant au piédestal du CS 滝) | `content/map/npcs.json` (1, entrée du piédestal `cs_taki_pedestal_ice_path`) |
| `sayo_freed_ice_path` | Sayo (5ᵉ Kimono Girl) est libérée dans la scène comique du Chemin Glacé | `content/dialogues/npcs/ice-path/kimono_sayo_ice_path.json` |
| `birds_guided_ilex` | Le puzzle de guidage des 2 oiseaux (navigation D-pad pure, Forêt Secte) est complété | `content/dialogues/npcs/ilex-forest/charcoal_apprentice_ilex.json` |

## 2. `unlock_text` émis directement par un event moteur (sans donneur dialogue)

Règle générale (phase 0.4) : `unlock_text` est LE gate d'un texte ; `npc_ref`/
`found_object_ref` restent des métadonnées de présentation. Les 6 textes CS-Kanji écrits à ce
jour (切/砕/水/飛/力/渦) portent tous leur `unlock_text` dans l'`Effect[]` du dialogue qui
remet le CS correspondant — voir la table des donneurs dans `content/side-content-inventory.md`
et les fichiers `content/dialogues/npcs/*/cs_*` / `*_cs_*`. Le CS 滝 (`cs_taki`) aussi : son
« donneur » est un objet trouvé avec son propre fichier dialogue
(`content/dialogues/npcs/ice-path/cs_taki_pedestal_ice_path.json`), qui porte l'`unlock_text`
au même titre qu'un NPC. Seul le CS 登 (Mont Argenté, non écrit — Lot 18) reste à câbler de la
même façon le moment venu.

Cinq textes n'ont **aucun** dialogue porteur — leur `found_object_ref`/`event_ref` ne
correspond à aucun fichier `content/dialogues/`, donc aucun `Effect` ne peut les émettre depuis
le contenu. **Le moteur doit émettre l'Effect `unlock_text` lui-même**, au moment indiqué :

| `text_id` | `found_object_ref`/`event_ref` | Déclencheur (aucun PNJ/objet-dialogue à cet endroit) |
|---|---|---|
| `forest_shrine_ilex` | `forest_shrine_ilex` (event_ref) | Franchissement de l'obstacle `cut_tree_ilex_shortcut` (Forêt Secte, arbre coupé) |
| `lyra_mail_new_bark` | `player_pc_new_bark` | Ouverture du PC du joueur à Bourg Geon (mail de Lyra) |
| `johto_entrance_sign_route29` | `sign_johto_entrance_route29` | Interaction avec le panneau d'entrée de Route 29 (tuile de carte, pas un NPC) |
| `son_in_law_letter_object_slowpoke_well` | `son_in_law_letter_object_slowpoke_well` | Objet trouvé au Puits Ramoloss (pas de fichier dialogue dédié) |
| `inscription_sprout_tower` | `inscription_sprout_tower` | Inscription murale de la Tour Grospignon (tuile de carte) |

Les 4 autres textes non-CS trouvés avec un `found_object_ref`/`npc_ref` correspondant à un
vrai fichier dialogue (`storyteller_burned_tower`, `storyteller_ecruteak`,
`lore_book_ecruteak`, `farewell_note_ice_path`) portent désormais leur `unlock_text` dans ce
fichier, au même titre que les CS — corrigé phase 0.4.

## 3. `quest_step` produits par une mécanique moteur (pas par un `advance_quest` de dialogue)

| Quest | Steps engine-only | Mécanique |
|---|---|---|
| `moomoo_recovery` | `fed_1` … `fed_6`, `healed` | Nourrissage de la vache malade (Route 39) : interaction Sac → baie → `remove_item` + `advance_quest`, limitée à 1×/jour calendaire (modèle PRD § time_window). `sick_found` reste posé par un dialogue (`farm_girl_left_route39.json`) ; seule la boucle de nourrissage elle-même est moteur. Voir la note dans `content/dialogues/npcs/route-39/sick_cow_route39.json`. |
| `radio_tower_takeover` | `tower_occupied` (1ᵉʳ step) | La quête démarre automatiquement à `badge_earned(pryce)` (appel téléphonique d'Elm, cf. `content/quests/radio_tower_takeover.json` `_note`) — aucun PNJ ne « donne » cette quête, le moteur doit poser `tower_occupied` dès que la condition de badge est remplie. |

## 4. Politique de linter — vérifié mécaniquement (phase 0.6)

`scripts/validate/lint-cross-refs.py` vérifie désormais aussi :
- tout `item_owned`/`grant_item`/`remove_item` référence un `item_id` connu (index construit à
  l'exécution : `rom-item-roster.json` slugs ∪ tout `item_id` apparaissant dans un
  `grant_item` quelque part dans `content/`) ;
- tout `event_cleared` consommé par un `Condition` figure dans la table § 1 ci-dessus ;
- tout `quest_step` consommé par un `Condition` est soit posé par un `advance_quest` quelque
  part dans `content/`, soit listé § 3 ci-dessus ;
- aucun état `default: true` d'un `state_rules[]` ne porte d'Effect `remove_item` (anti-pattern
  du troc sans contrepartie, phase 0.2) ;
- `correct_index` sur les questions de texte : détecte l'uniformité suspecte (ex. 0 partout).

## 5. Mécaniques différées à l'implémentation (aucun fichier de contenu à produire)

Liste consolidée — chacune a une spec suffisante dans le PRD/guidebook mais aucune donnée de
contenu ne peut la porter (mécanique pure ou nécessite du tuning en jeu réel) :
- Déclenchement des rencontres errantes Raikou (45q) et Entei (52q) — design de spawn/tuning,
  pas de fichier `content/`.
- Barèmes du Pokéathlon (gate réel de Chuck : `pokeathlon_score ≥ 250`) — mécanique de
  mini-jeux, scores/seuils à calibrer en jeu.
- Concours du Parc National (mar/jeu/sam) — mécanique calendaire, adoptée comme design I-6,
  aucun fichier contenu (voir journal Lot 2).
- Réserve Naturelle (Safari) adaptée — mécanique de capture-sans-Pokémon (I-adaptée), amorcée
  au Lot 4 (Baoba à l'entrée), reste à implémenter.
- Kanji Flip / Game Corner — mini-jeu, aucune donnée de contenu.
- Horaires du Magnet Train et du SS Aqua — mécanique de calendrier/trajet.
- Mécanique de remise du CS 登 au Mont Argenté (Lot 18, dernier CS, seuil N=60) — au-delà du
  texte/dialogue de remise (à écrire en Lot 18), le mécanisme d'ascension lui-même est
  d'implémentation.
- Modes de lecture M13/M14 (2ᵉ vague de modes combat/lecture) — non spécifiés à ce stade.
- Sprites des 2 compagnons TBD (`content/companions.json` `tbd_2`/`tbd_3`) — dump HGSS à
  vérifier, roadmap 5.5.

## 6. Items achetables en boutique — jamais accordés par un `grant_item`

Trouvé en écrivant le linter de la § 4 (phase 0.6) : un `item_id` peut être légitimement
référencé par `item_owned`/`remove_item` sans jamais apparaître dans un `grant_item`, quand
l'objet s'achète (argent en jeu, mécanique de boutique — hors modèle Effect/Condition, pas de
fichier de contenu concerné).

| `item_id` | Où l'acheter | Consommateur |
|---|---|---|
| `ragecandybar` | Boutique d'Acajou (manju locale), mécanique d'implémentation — pas de PNJ-boutique écrit à ce jour | `content/dialogues/npcs/route-6-kanto/underground_trader_r6.json` (troc contre une CT) |

## 7. `kanji.keyword` — priorité d'affichage (phase 2.4)

Quand un kanji porte un champ `keyword` (`src/data/kanji-content.json`), l'UI de la
double-page doit l'afficher à la place de `meanings[0]` — `meanings[0]` est un artefact
du dataset brut, pas éditorialisé, parfois trompeur (ex. 校 = "exam" avant "school").
`keyword` n'est renseigné que sur une partie des 2136 kanji à ce jour (au fil des zones,
§ content-writing-guide.md § 4bis) ; fallback sur `meanings[0]` tant qu'absent.

## 8. Décisions de spec issues des revues (pour l'équipe code)

- **Examens ≥ 70 questions : reprise par section en cas d'échec**, jamais « tout refaire »
  (Blue 98q ≈ 45-60 min de jeu ; le format mini-JLPT à sections existe déjà côté contenu — la
  politique d'échec doit le suivre).
- **Mélange obligatoire des choix de QCM à l'affichage**, indépendamment de l'ordre de
  `choices[]`/`correct_index` dans le fichier de contenu (le contenu varie déjà `correct_index`
  à l'écriture depuis la phase 2.4, mais l'affichage doit re-mélanger dans tous les cas — ne
  jamais supposer que la position stockée reflète la position affichée).

## 9. Historique

- **2026-07-23** — création (Étape 4 phase 0.5), tables § 1 et § 3 construites par grep exhaustif
  du corpus écrit à ce jour (36 zones, 536 fichiers). À réexécuter/étendre si un nouveau
  `event_cleared`/`quest_step` moteur-only apparaît dans les lots suivants.
