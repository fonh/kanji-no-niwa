# Journal d'implémentation — quoi, où, et ce qui nous a déjà mordus

Créé 2026-08-06. **À lire avant de toucher au jeu**, quelle que soit la tâche.

Ce document n'est ni une spec ni un tutoriel : c'est la mémoire de travail entre
conversations. Le PRD dit ce que le jeu doit être, les ADR disent pourquoi les
décisions sont ce qu'elles sont, `content/opening-sequence.md` sert de gabarit
de zone. Ici on répond à trois questions, et à trois seulement :

1. **où** vit chaque chose (pour ne pas la réécrire ailleurs) ;
2. **comment** on ajoute du contenu du même genre (pour que ça monte à
   l'échelle) ;
3. **ce qui nous a déjà mordus** (pour ne pas repayer).

> **Règle de tenue du journal** : à la fin d'une session, on n'ajoute ici que ce
> qui SERVIRA à quelqu'un d'autre. Une correction ponctuelle va dans le message
> de commit ; un piège qui se reproduira, une recette qui se réutilise, une
> frontière de responsabilité — ça vient ici.

---

## 1. La carte du territoire

Avant d'écrire une ligne, savoir dans quelle boîte on est.

| Ce que tu veux changer | Ça vit ici | Ça ne vit PAS là |
|---|---|---|
| Qui est sur la carte, où, sous quelles conditions | `content/map/npcs.json`, `trainers.json` | jamais en dur dans un composant |
| Ce qu'un personnage dit, et quand | `content/dialogues/**` (`state_rules` → `dialogue_states`) | pas de texte dans le code |
| Ce qui barre un passage | `content/map/roadblocks.json` (décision **serveur**) | pas côté client : un verrou client se contourne |
| Un obstacle de terrain (arbre, rocher, Simularbre) | `content/map/obstacles.json` | pas un roadblock |
| Ce qu'une leçon enseigne | `content/lessons/<zone>.json` + `content/grammar/<zone>.json` | pas de kanji écrit dans le moteur |
| Un texte lisible | `content/texts/<zone>/*.json`, débloqué par un `Effect.unlock_text` | — |
| Les libellés/descriptions d'objets | `src/data/item-labels.json` | pas dans un dialogue |
| Les chaînes système (menus, gate SRS) | `src/data/ui-strings.json` — **japonais seul** | pas de latin à l'écran |
| La géométrie d'une zone (grille, warps, alignement) | `src/data/zone-registry.json` (généré) | ne jamais éditer à la main |
| Les règles pures (conditions, leçons, combats, sac) | `src/lib/*.ts` — zéro I/O, testées seules | pas dans un composant React |
| L'assemblage I/O (état joueur, SQL, contenu) | `src/app/**/actions.ts` | — |
| L'affichage | `src/app/**/​*.tsx` | aucune règle de jeu |

**Le test qui tranche** : si la réponse à « et si on en veut cinquante ? » est
« on recopie », c'est au mauvais endroit.

---

## 2. Les cinq leviers, et rien d'autre

Toute mise en scène passe par ces cinq-là (ADR-0007 + le verrou et la leçon) :

| levier | mécanisme |
|---|---|
| **présence** | `unlock_conditions` sur l'entrée carte (`negate: true` pour faire partir) |
| **texte** | `state_rules` du fichier de dialogue |
| **position** | `placements[]` gardés par conditions, du plus tardif au plus précoce, le dernier sans condition |
| **verrou** | `roadblocks.json`, un franchissement dans UN sens, tranché serveur |
| **leçon** | `sequence_index` de la zone ; règle dérivée par le moteur, jamais portée par `unlock_conditions` |

**Une étape de quête EST la variable de scène du jeu d'origine.** Si un beat
n'a pas d'étape à laquelle s'accrocher, c'est la quête qu'il faut compléter,
pas le moteur qu'il faut étendre. Aucun mécanisme nouveau n'a été nécessaire
pour reproduire toute l'ouverture de HGSS.

---

## 3. Recettes — comment ajouter, à l'échelle

### 3.1 Une zone entière

La méthode complète est dans `content/opening-sequence.md` § 8, avec les
pièges. En bref : lire le guidebook curaté → ouvrir le `zone_event` de la ROM
(`~/pokeheartgold/files/fielddata/eventdata/zone_event/`) → convertir
`tile = monde − world_origin` → suivre chaque `eventFlag` au `grep` dans les
scripts pour connaître sa fenêtre de présence → lire les textes d'origine dans
`files/msgdata/msg/*.gmm` (XML en clair) pour le RÔLE, jamais pour la lettre →
traduire en leviers → `npm run check`.

### 3.2 Un objet remis par quelqu'un

Écrire **deux choses**, et c'est tout :

1. un `Effect.grant_item` dans l'état de dialogue concerné ;
2. une entrée dans `src/data/item-labels.json` : `jp`, `category`,
   `jp_description`.

Le reste est automatique (`src/lib/item-get.ts`, appelé côté serveur dans
`applyDialogueState`) : annonce 「◯◯を　てにいれた！」, fanfare du jeu d'origine
(objet-clé ou ordinaire selon la poche), rangement 「…に　いれた。」, puis la
description. Sur **tous** les chemins d'interaction, y compris un verrou qui
délègue à un PNJ.

**Et il faut un état d'après-remise** : une règle `item_owned` placée **juste
au-dessus du défaut** (voir § 4.4). `lint-cross-refs.py` refuse l'oubli.

### 3.3 Une leçon

Le pool de kanji d'une zone est déjà fixé (`curriculum-checkpoints.md`) et ne
se rediscute pas. Ce qui se décide, c'est **qui** le porte :

- un personnage **sourcé** (nommé du guidebook, ou ambiant du décompilé) —
  jamais inventé ;
- **présent sur le chemin critique** : pas de porteur gaté par un badge que la
  leçon sert justement à préparer, pas de porteur calendaire ;
- `role: "lesson"` sur l'entrée carte, `npc_ref` dans le fichier de leçons ;
- aucun lien thématique entre le PNJ et le contenu enseigné (PRD § Leçons).

Une leçon qui déclare un `grammar_id` doit avoir son point dans
`content/grammar/<zone>.json` — sinon l'écran-livre sert des pages kanji et
rien de grammatical, en silence. Contrat de fusion :
`content/grammar-wiring-spec.md` ; `grammar_id` → source Hanabira par la règle
`N{niveau}-{NNN}` → `grammar_JLPT_N{niveau}.json[NNN-1]` (vérifié sur les 194
points existants, zéro exception).

### 3.4 Un texte lisible

Densité cible par type de zone : `content/texts-progressifs.md` § Densité.
Deux façons de le rattacher :

- **porté par un personnage** → `npc_ref`, et l'`Effect.unlock_text` vit dans
  l'état de dialogue qui le remet ;
- **trouvé sur la carte** (panneau, inscription, objet au sol) →
  `found_object_ref`, et c'est le **moteur** qui émet l'`unlock_text` —
  table `ENGINE_UNLOCK_TEXTS` de `src/lib/content.ts`, documentée dans
  `content/engine-contract.md` § 2.

### 3.5 Une Poké Ball ramassable (un texte trouvé)

Une ligne dans `src/lib/collectibles.ts` (`id d'objet ROM → text_id`), un
fichier dans `content/texts/<zone>/`, et une entrée dans
`ENGINE_UNLOCK_TEXTS` + `engine-contract.md` § 2. Le reste suit : la ball
n'est servie que si elle porte un texte, le ramassage applique l'`unlock_text`
côté serveur, le texte rejoint le どくしょノート, la ball disparaît pour de bon.
Densités cibles par type de zone : `content/texts-progressifs.md` § Densité.
`lint-cross-refs.py` vérifie que la table, le registre de zones et
`content/texts/` disent la même chose.

### 3.6 Regarder ce que le joueur voit, sans attendre une capture

    python3 scripts/validate/render-zone-preview.py MAP_ROUTE_31 --around 23,16

compose la capture de la zone (recalée par la mesure d'ADR-0006) et marque
chaque endroit où le moteur DESSINERA quelqu'un — rouge/orange pour un PNJ ou
dresseur curaté, bleu pour un objet ROM servi. La lecture est immédiate :

- personnage visible **avec** un marqueur dessus → doublon ;
- personnage visible **sans** marqueur → il est peint dans la capture ;
- marqueur dans un mur, deux marqueurs sur la même case → bug de position ;
- damier gris → la zone est servie sans capture (rejetée au recalage).

Pour relever une tuile au pixel près, superposer une grille : recadrer l'image
sur la fenêtre voulue, tracer une ligne tous les `scale_x`/`scale_y` pixels
depuis `origin_px`/`origin_py`, numéroter, regarder. C'est comme ça qu'on a
mesuré les figurants incrustés de la Route 31.

**Aucun test n'attrape un bug d'affichage.** Cet outil est le seul moyen de les
voir sans jouer — s'en servir avant de dire qu'une zone est finie.

### 3.7 Un son du jeu d'origine

`python3 scripts/build/extract-hgss-sfx.py --list <motif>` pour chercher, puis
`extract-hgss-sfx.py SEQ_XXX -o out.wav`, puis `ffmpeg -c:a libopus`. Les
séquences multi-pistes marchent (les fanfares font 97 à 201 notes). Déclarer le
chemin dans `SFX` (`src/lib/audio-tracks.ts`) avec le nom de la séquence ROM en
commentaire — c'est la seule trace de provenance.

---

## 4. Ce qui nous a déjà mordus

Chaque entrée a coûté une session. Les garde-fous cités les attrapent
désormais ; ne pas les désactiver « juste pour voir ».

### 4.1 Positions

- **Une position inventée** met le personnage dans un mur, dans la canopée ou
  hors grille. Toujours partir de l'objet ROM. → `lint-npc-placements.py`,
  `audit-first-gym-run.py`.
- **Deux personnages sur la même tuile** : un seul apparaît, l'autre est
  injoignable — et c'est souvent lui qui porte la clé de la suite.
  → `lint-npc-placements.py` (ajouté après l'Ancien de la Tour posé sur le sage
  Chow).
- **Un intérieur servi au mauvais étage** : sans `map_zone`, une tuile
  d'intérieur est servie sur la zone extérieure — le PNJ finit dans un mur ou
  planté dans un champ. Toujours renseigner `map_zone` pour un intérieur.
- **Une tuile de garage** : la ROM range hors carte (coin haut-droit,
  coordonnées négatives) les objets qu'un script fera apparaître ailleurs. 93
  dans tout le jeu. Ce n'est pas une position, c'est un entrepôt.
- **Un cône de vision aveugle** : un dresseur `sight_auto` dont la ligne de vue
  ne couvre aucune tuile praticable ne déclenche jamais son combat. Il en reste
  7 hors chemin critique (Liz/Route 32, Brandon et Kate/Route 34,
  Beverly/Parc National, Ron/Route 43, Alton/Lac Colère).

### 4.2 Verrous

- **La clé derrière la serrure** : une condition qu'on ne peut remplir qu'après
  le franchissement qu'elle garde = blocage définitif, silencieux.
  → `lint-roadblocks.py`, qui parcourt le graphe des warps.
- **Un verrou qui se lève à la deuxième réplique** : le joueur bute plusieurs
  fois sans comprendre. Le verrou délégué à un PNJ doit se lever dès sa
  PREMIÈRE réplique.
- **Un « verrou » qui n'en est pas un** : une réplique de PNJ qui dit « tu ne
  peux pas passer » ne barre rien du tout. Un vrai verrou vit dans
  `roadblocks.json` et se décide côté serveur.

### 4.3 Contenu invisible depuis le moteur

- **Une leçon portée par quelqu'un qui n'existe pas encore** : 26 kanji du
  budget d'avant-arène étaient sur Tuscany (mardi + badge) et Teala (badge). Le
  compteur affichait 140, le joueur en voyait 114.
  → `audit-first-gym-run.py`.
- **Un `grammar_id` sans overlay** : la leçon se joue quand même, sans une
  ligne de grammaire, et le quiz perd sa question. 21 des 26 leçons du chemin
  critique étaient dans ce cas. → `audit-first-gym-run.py`.
- **Un objet sans libellé** : le Sac affichait l'`item_id` brut, donc du latin
  à l'écran (74 des 87 objets accordés). Repli 「？？？」 + refus sur le chemin
  critique.

### 4.4 Dialogues

- **L'état par défaut qui remet un objet, sans état d'après** : le personnage
  re-offre éternellement ce qu'il a déjà donné. → `lint-cross-refs.py`.
- **La règle d'après-remise placée en tête** : elle masque les états plus
  tardifs du même personnage. Le directeur de la Tour Radio ne remettait plus
  jamais l'Aile Arc-en-ciel, et le Clocher Carillon devenait injoignable.
  **Toujours juste au-dessus du défaut.** → `solve-progression.py`.
- **Un cadeau rejoué avant chaque leçon** : le moteur sert le dialogue AVANT
  d'ouvrir l'écran-livre (« l'histoire d'abord »), donc un PNJ-leçon à quatre
  leçons rejoue sa réplique de remise quatre fois. Même remède : un état
  d'après sur `item_owned`.

### 4.5 Affichage

- **Le décor ROM et le contenu curaté décrivent les mêmes personnages.**
  `zone.objects` est un dump brut : servi en entier, il double chaque
  personnage curaté et, pire, **occupe des tuiles** — trois figurants d'une
  scène scriptée ont muré l'unique passage de la Route 30. Le tri est dans
  `src/lib/rom-decor.ts` et doit servir aux **trois** usages (rendu, occupation
  de tuile, bouton A) : c'est leur divergence qui laissait un figurant invisible
  continuer à bloquer.
- **Les captures de carte contiennent des personnages peints dans les pixels**
  (ce sont des captures de partie). Repérage :
  `render-zone-preview.py`, puis `scrub-baked-npcs.py --preview`. Le bouchage
  automatique n'est **pas** au niveau — deux méthodes essayées, les deux
  abîment la carte. Ne pas le rebrancher sans une vraie approche (détourage du
  sprite depuis sa planche, reconstruction du sol d'après la grille de
  collision).
- **Un figurant incrusté n'est PAS sur la tuile de son objet ROM.** Beaucoup
  errent (`movement` 3/5/14/15) : la capture les a figés là où ils se
  trouvaient ce jour-là, une à deux tuiles à côté de leur position de spawn.
  Dériver la liste des tuiles à boucher depuis le décompilé donne donc de
  fausses coordonnées — c'était le cas de la première liste de la Route 31.
  **Mesurer sur l'image**, jamais déduire.
- **Une capture qui ne se cale pas est rejetée exprès.** Le poste-frontière
  Route 31 ↔ Mauville est servi en grille de collision parce que la seule
  capture de poste-frontière du dossier appartient à une AUTRE porte (recalage
  dégénéré : 6,1 px/tuile en vertical contre ~11 attendus). Servir une image
  qui ment sur les murs est pire que la grille (ADR-0006). Avant de conclure
  « décor manquant = bug », regarder si la capture existe et si elle se cale.
- **Une durée CSS et un minuteur JS qui divergent** : l'élément est retiré du
  DOM en plein écran. La plaque de nom de lieu disparaissait d'un coup au lieu
  de remonter.
- **`fixed` ≠ l'écran de jeu.** Le monde est cadré dans une boîte 4:3 centrée
  (`useDsScreenSize`, `src/lib/ds-screen.ts`). Tout ce qui se pose en
  `fixed inset-0` s'affiche sur la fenêtre du navigateur, à côté du jeu — la
  plaque de nom de lieu tombait dans la bordure noire, le menu s'étirait en
  panneau vide. **Ce qui appartient à l'écran doit vivre dans la boîte.**
- **Un même geste, un même bouton, au même endroit.** Le menu avait ses
  propres A/B d'un autre diamètre et X/Y en pastilles d'en-tête. Un seul
  composant : `src/components/DsFacePad.tsx`.
- **Le combat aussi vit dans l'écran de la console.** En `fixed inset-0`, sur
  un moniteur large, les deux barres de vie se retrouvaient collées aux coins
  opposés à deux mille pixels l'une de l'autre. Même remède que le menu et la
  plaque : `useDsScreenSize`.

### 4.6 Sources

- **Une source inventée coûte plus cher qu'une source absente** : elle empêche
  de reposer la question. « L'assistant d'Elm tient le comptoir du Mart de
  Ville Griotte, c'est là que HGSS le poste » était faux, et l'a été pendant
  des semaines parce que ça avait l'air sourcé. Citer le fichier et la ligne,
  toujours ; « je n'ai pas vérifié » est une réponse acceptable.
- **Le décompilé tranche, le web non.** Pour la plaque de nom de lieu,
  Bulbapedia ne donnait rien ; `src/field/draw_map_name.c` donnait la position,
  la taille, le sens du glissement et la durée exacte (60 images de palier).
  Réflexe : chercher d'abord dans `~/pokeheartgold`.

---

## 5. Les garde-fous, et ce qu'ils attrapent

`npm run check` = typecheck + lint + tests + `validate:content`. Ne jamais
commiter rouge ; ne jamais désactiver un contrôle pour faire passer une passe.

| script | ce qu'il refuse |
|---|---|
| `lint-npc-placements.py` | poste dans un mur, poste injoignable, liste sans poste par défaut, **deux personnages sur une tuile** |
| `lint-roadblocks.py` | verrou muet, garde dans un mur, **clé hors d'atteinte sans franchir le verrou** (graphe des warps, `item_owned` compris) |
| `lint-cross-refs.py` | ids croisés, `remove_item` sur un état par défaut, **remise d'objet sans état d'après** |
| `lint-grammar-overlay.py` | résolution id→source, furigana sur tout kanji, cloze cohérent, distracteurs valides |
| `lint-kanji-budget.py`, `lint-kanji-density.py` | budget de kanji inconnus par dialogue, densité plancher |
| `solve-progression.py` | la progression écrite est-elle traversable de bout en bout |
| `audit-first-gym-run.py` | le parcours début → première arène : leçons **atteignables**, grammaire présente, objets nommés, positions joignables, verrous listés |
| `a1-traversal.test.ts` | la carte reste franchissable ; PNJ d'intérieur servis dans leur pièce |

---

## 6. Décisions déjà prises — ne pas rouvrir sans raison neuve

- **L'histoire d'abord, toujours.** Un personnage dit sa réplique avant toute
  leçon ; l'écran-livre s'ouvre à la fermeture de la boîte.
- **Aucun latin à l'écran.** Ni nom de zone français, ni `item_id`, ni titre de
  menu. Les explications de grammaire Hanabira sont la seule exception assumée
  (PRD § Langue du Jeu).
- **Lecture inline sur tout kanji affiché**, hand-écrite, jamais calculée
  (ADR-0002). Y révèle, X traduit — et les deux sont masqués par défaut.
- **Le gate SRS n'est jamais une `Condition`** : toutes les Conditions sont
  monotones, « révisé aujourd'hui » ne l'est pas.
- **Fidélité au jeu d'origine par défaut**, écart assumé et écrit quand on
  s'en éloigne (la visite de Ville Griotte en un temps, le verrou dur de
  l'arène de Mauville).
