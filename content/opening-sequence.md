# Séquence d'ouverture — mise en scène pas à pas

Créé 2026-08-06 (issue 13). Répond à une question de QA : *« si je dois parler à
quelqu'un, récupérer un objet — est-ce que la position d'un PNJ va changer ? ce
qu'il a à me dire changera aussi ? »*

Oui aux deux, dans le jeu d'origine. Ce document dit **quand**, avec ses sources,
et sert de **gabarit pour le reste du jeu** : la même grille (étape → gâchette →
qui bouge → qui change de texte) se remplit zone par zone.

## 1. Le vocabulaire

Le jeu d'origine pilote sa mise en scène par des **variables de scène** : un
entier par zone (`VAR_SCENE_NEW_BARK_TOWN_OW`, `VAR_SCENE_CHERRYGROVE_CITY_OW`,
`VAR_SCENE_ROUTE_30_OW`…), lu au chargement de la carte pour placer les
figurants, et écrit par les scripts — souvent **depuis une autre carte** (le
script de la maison de Mr. Pokémon écrit la scène de Ville Griotte : c'est ce
qui prépare l'embuscade de Silver au retour).

Ici, l'équivalent est l'**étape de quête**. `mystery_egg_errand` passe par
`sent_by_elm` → `egg_received` → `egg_delivered` : trois valeurs ordonnées,
exactement comme une variable de scène, mais nommées et déjà dans le modèle
`Condition` (ADR-0003). Aucune nouvelle notion à inventer.

**Trois leviers, et trois seulement**, pour mettre en scène :

| levier | mécanisme | déjà là ? |
|---|---|---|
| **présence** — le PNJ est là ou non | `unlock_conditions` sur l'entrée PNJ (`negate: true` pour faire disparaître) | oui |
| **texte** — il ne dit pas la même chose | `state_rules` du fichier de dialogue | oui |
| **position** — il n'est plus au même endroit | `placements[]` gardés par conditions | **ajouté 2026-08-06** |

L'invariant de monotonie du PRD tient pour les trois : une condition ne redevient
jamais fausse, donc chaque PNJ ne fait qu'**avancer** dans sa liste de
placements. Pas d'aller-retour, pas d'état à réconcilier.

## 2. La séquence

Sources : décompilé `pokeheartgold` (`scr_seq_0842_T20.s`, `scr_seq_0843_T20R0101.s`,
`scr_seq_0850_T21.s`, `scr_seq_0227_R30.s`, `scr_seq_0229_R30R0201.s`),
[Bulbapedia Walkthrough Part 1](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_HeartGold_and_SoulSilver/Part_1)
et [Part 2](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_HeartGold_and_SoulSilver/Part_2),
`content/guidebook-adapted.md`.

Légende de l'état : ✅ en place · 🔜 écrit ici, pas encore posé en contenu ·
➖ hors périmètre de ce jeu (mécanique Pokémon sans équivalent).

### Étape 0 — avant tout

*Étape de quête : aucune.*

| qui | mise en scène | état |
|---|---|---|
| Maman (maison 1F) | dit qu'Elm demande le joueur ; remet Sac et Carte Dresseur | ✅ présence + texte |
| Lyra/Ethan | sort du labo chercher son Marill, puis **rentre chez elle** | 🔜 déplacement |
| Silver | **à la fenêtre du labo** ; l'approcher fait qu'il vous repousse | 🔜 il est aujourd'hui posté contre la clôture, sans repoussée |
| Pr. Elm (labo) | explique ses recherches, fait choisir le compagnon | ✅ |
| **Sortie ouest** | **Elm barre la route** tant que le compagnon n'est pas choisi | ✅ verrou `elm_west_exit_new_bark` |

### Étape 1 — `mystery_egg_errand: sent_by_elm`

*Gâchette : avoir choisi son compagnon chez Elm.*
*Décompilé : `T20R0101` écrit `VAR_SCENE_NEW_BARK_TOWN_OW = 1` en sortant du labo.*

| qui | mise en scène | état |
|---|---|---|
| Assistant d'Elm | remet 5 Potions **à la sortie du labo** puis **file tenir le comptoir du Mart de Griotte** | 🔜 déplacement (c'est le cas d'école de `placements[]`) |
| Silver | **disparaît** de Bourg Geon | ✅ `negate` sur `sent_by_elm` |
| Lyra/Ethan | **attend dehors**, commente le compagnon choisi | 🔜 déplacement + texte |
| Maman | remet le **Pokégear** au retour à la maison | ✅ texte (l'objet transite par un `Effect`) |
| Pr. Elm | **rattrape le joueur sur la Route 29** pour donner son numéro | 🔜 présence conditionnelle **dans une autre zone** |
| Sortie ouest | verrou levé | ✅ |
| **Sortie de Griotte vers Route 30** | **le guide barre la route** tant que la visite n'est pas faite | ✅ verrou `guide_gent_cherrygrove_tour` |

### Étape 2 — `cherrygrove_welcome: shoes_given` puis `map_given`

*Gâchette : la visite guidée de Ville Griotte, en deux temps.*
*Décompilé : `T21` écrit `VAR_SCENE_CHERRYGROVE_CITY_OW` 1 puis 2.*

| qui | mise en scène | état |
|---|---|---|
| Guide de Griotte | `intro` → `farewell` : deux textes, deux étapes de quête | ✅ texte |
| Guide de Griotte | **se déplace le long de la visite** (Centre, Mart, mer) | 🔜 déplacement |
| Verrou Route 30 | levé après `map_given` | ✅ |

### Étape 3 — `mystery_egg_errand: egg_received`

*Gâchette : recevoir l'Œuf Mystère chez Mr. Pokémon (Route 30).*
*Décompilé : `R30R0201` écrit `VAR_SCENE_CHERRYGROVE_CITY_OW = 3` **et**
`VAR_SCENE_ROUTE_30_OW = 2` — la maison arme la scène de DEUX autres zones.*

| qui | mise en scène | état |
|---|---|---|
| Mr. Pokémon | remet l'Œuf | ✅ |
| Pr. Chen (Oak) | remet le Pokédex après avoir vu le compagnon | ✅ |
| **Silver** | **apparaît à Ville Griotte** et intercepte au retour → **combat** | ✅ présence conditionnelle + embuscade |
| Assistant d'Elm | apparaît au Mart de Griotte (appel de détresse) | 🔜 déplacement |

### Étape 4 — `mystery_egg_errand: egg_delivered`

*Gâchette : rapporter l'Œuf à Elm.*

| qui | mise en scène | état |
|---|---|---|
| Pr. Elm | prend l'Œuf, ouvre les leçons #3 et #4 | ✅ `unlock_conditions` de leçon |
| Maman | propose de gérer l'épargne | 🔜 texte |
| Lyra/Ethan | **démonstration de capture sur la Route 29** | ➖ pas de capture dans ce jeu ; le beat est réattribué à une leçon |
| Silver | disparaît de Griotte | ✅ |

## 3. Ce qui se généralise

Trois règles tirées de la séquence, valables pour les 83 zones :

1. **Une étape de quête est une variable de scène.** Toute mise en scène se
   déclenche sur une étape déjà écrite dans une quête — jamais sur un état
   inventé pour l'occasion. Si aucune étape ne correspond, c'est la quête qu'il
   faut compléter, pas le moteur.
2. **Une scène peut être armée depuis une autre zone.** La maison de Mr. Pokémon
   arme Ville Griotte. C'est normal et voulu : la condition est globale, la mise
   en scène est locale. Aucun mécanisme de « déclencheur à distance » n'est
   nécessaire.
3. **Un PNJ qui « part » n'est pas supprimé, il change de placement.**
   L'assistant d'Elm ne disparaît pas : il tient le comptoir du Mart. Le
   supprimer perdrait son dialogue et son rôle. `placements[]` d'abord,
   `negate` seulement pour les figurants qui quittent vraiment le récit
   (Silver entre deux apparitions).

## 4. Garde-fous

- `scripts/validate/lint-npc-placements.py` — chaque placement doit tomber sur
  une tuile praticable de la zone visée, avec au moins une tuile adjacente
  praticable (sinon le PNJ est injoignable), et la liste doit se terminer par un
  placement **sans condition** (sinon le PNJ n'existe nulle part au départ).
- `scripts/validate/lint-roadblocks.py` — la clé d'un verrou doit être du même
  côté que la serrure.
- `src/lib/a1-traversal.test.ts` — le parcours reste franchissable de bout en
  bout, quelles que soient les positions.
