---
status: accepted
---

# La mise en scène d'une zone tient en trois leviers, pilotés par les étapes de quête

Question de QA (issue 13) : *« si je dois parler à quelqu'un, récupérer un objet
— est-ce que la position d'un PNJ va changer ? ce qu'il a à me dire changera
aussi ? »* Dans le jeu d'origine, oui aux deux, en permanence. Ici, le texte
changeait déjà ; la position, non.

Le jeu d'origine pilote sa mise en scène par des **variables de scène** : un
entier par zone (`VAR_SCENE_NEW_BARK_TOWN_OW`, `VAR_SCENE_CHERRYGROVE_CITY_OW`…),
lu au chargement de la carte pour placer les figurants, écrit par les scripts —
souvent depuis une AUTRE carte (le script de la maison de Mr. Pokémon écrit la
scène de Ville Griotte : c'est ce qui arme l'embuscade de Silver au retour).

**Décision :** l'**étape de quête est la variable de scène**, et toute mise en
scène passe par exactement trois leviers, jamais un quatrième :

| levier | mécanisme | état |
|---|---|---|
| **présence** — le PNJ est là ou non | `unlock_conditions` (avec `negate` pour faire disparaître) | existait |
| **texte** — il ne dit pas la même chose | `state_rules` du fichier de dialogue | existait |
| **position** — il n'est plus au même endroit | `placements[]` gardés par conditions, le premier qui tient gagne | **ajouté** |

`mystery_egg_errand` passe par `sent_by_elm` → `egg_received` → `egg_delivered` :
trois valeurs ordonnées, exactement une variable de scène, déjà dans le
vocabulaire `Condition` d'ADR-0003. Rien de nouveau à inventer côté modèle.

L'invariant de monotonie du PRD tient pour les trois : une condition ne redevient
jamais fausse, donc un PNJ ne fait qu'**avancer** dans sa liste de placements.
Aucun état à réconcilier, aucun retour en arrière possible.

## Considered Options

- **Un entier « scène » par zone, comme la ROM** — rejeté : il faudrait le
  stocker, le maintenir en cohérence avec les quêtes qui décrivent déjà la même
  progression, et traduire chaque condition existante en valeur de scène. Deux
  sources de vérité pour un seul fait.
- **Dupliquer le PNJ sous un autre identifiant par étape** (un `elm_assistant_lab`
  et un `elm_assistant_mart`, chacun gardé par ses conditions) — c'était la
  seule option possible avant, et elle marche. Rejetée : elle éclate le
  dialogue, l'inventaire de PNJ et le journal de quêtes en autant d'entités que
  d'étapes, pour un personnage que le joueur voit comme un seul. Le coût monte
  linéairement avec la longueur du jeu.
- **Un système de scripts de scène** (déplacements animés, caméra, attente) —
  hors sujet ici : ce qu'il manquait, c'est *où se tient un PNJ selon
  l'histoire*, pas *comment il s'y rend*. Les rares marches visibles à l'écran
  (interception d'un verrou) sont déjà couvertes par le Roadblock.

## Consequences

- `content/opening-sequence.md` déroule l'ouverture étape par étape avec ses
  sources (décompilé + Bulbapedia + guidebook) : c'est le gabarit à remplir zone
  par zone pour le reste du jeu.
- Un PNJ qui « part » n'est plus supprimé, il change de placement. `negate` reste
  réservé aux figurants qui quittent vraiment le récit (Silver entre deux
  apparitions).
- Le placement actif décide de la ZONE où le PNJ est servi : un PNJ peut
  légitimement changer de carte. `getNpcsForZone` résout donc le placement avant
  de filtrer par zone, et les gardes d'écriture (`accessibleNpc`,
  `findAccessibleDialogueCarrier`) résolvent avec le même état — sinon un PNJ
  visible à l'écran serait refusé en interaction.
- Les appelants purs (audits de traversée, tests) résolvent sans état et
  obtiennent le poste par défaut, c'est-à-dire le jeu à son début — l'état où la
  carte doit être franchissable.
- `scripts/validate/lint-npc-placements.py` refuse un poste dans un mur, un
  poste sans voisin praticable (PNJ injoignable, alors qu'il porte peut-être la
  clé de la suite), une liste sans poste par défaut, et deux postes aux
  conditions identiques (le second serait mort).
