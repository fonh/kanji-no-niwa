# Gabarits — Étape 3, point 1

Un fichier-exemple complet par type de contenu, chacun validé contre le schéma du PRD (`PRD.md` §
Leçons / § Textes Progressifs / § Pokégear / § Schéma Base de Données) et `content/texts-progressifs.md`.
Contenu réel là où une source existante le permettait (kanji, grammaire, dresseur, PNJ sourcé) ;
`audio_ref` et illustrations restent des chemins à produire au pipeline (Étape 4) — seule la forme
JSON est engagée ici, pas le contenu final.

| Fichier | Type | Zone/source réelle |
|---|---|---|
| `lesson-example.json` | Leçon (écran-livre) | new-bark-town, leçon #4 d'Elm (日月木気水火, N5-004) — `content/lessons-proposal.json` |
| `text-example.json` | Texte + quiz + `answer_span` | route-36, remise du CS-Kanji 砕 (texte obligatoire au seuil N le plus bas) |
| `radio-show-example.json` | Émission radio (bibliothèque d'Oak) | premier épisode N5 possible, post-Radio Card |
| `keigo-session-example.json` | Session Salon du keigo | Fan Club de Vermeille, intention "demande s'il a lu le document" |
| `../dialogues/calls/joey_route30.json` | Appel 即時応答 | Youngster Joey (route-30), dresseur enregistrable réel |
| `conversation-example.json` | 会話 à embranchements (PRD § 会話, 2026-07-24) | cherrygrove-city, can-do « demander son chemin » (Marugoto Starter A1), grand-mère d'ambiance |
| `mentor-letter-example.md` | Lettre du mentor + bloc `reply` (PRD § Mentors, 2026-07-24) | Elm, lettre post-badge Falkner — frontmatter reply : chunks + accepted_orders + reaction_ref |

## Décisions de schéma prises en écrivant ces gabarits (à confirmer)

Le PRD décrit ces mécaniques en prose mais ne fixait pas toujours la forme JSON exacte. En écrivant
les gabarits, les choix suivants ont été faits — cohérents avec les conventions déjà en place
ailleurs dans `content/` (dialogues, quêtes, items, tous en `{jp, en}`) :

1. **Champs bilingues `{jp, en}` partout où le joueur voit le texte** — `texts.title`,
   `radio_shows.title`, les `questions[]`/`options[]` des textes et de la radio, l'intention/contexte
   du Salon du keigo. Le PRD ne le précisait explicitement que pour `quests.name`/`items.name` ; ici
   généralisé par cohérence (« aucun français, anglais seulement à rôle pédagogique précis » — le
   japonais reste toujours la langue primaire, l'anglais est un bouton X à la demande, même registre
   que les dialogues).
2. **Le mini-quiz de leçon en mode Sens utilise le mot-clé anglais (mécanisme C), jamais
   `jp_definition`** — ce dernier ne sert qu'au mode Sens gradué *après* maîtrise FSRS (§ Système SRS,
   audit 07). Les deux champs coexistent sur le kanji mais ne sont jamais lus par le même écran au
   même moment.
3. **即時応答 s'insère comme une entrée spéciale de `pages[]`** (`kind: "instant_response"`) plutôt
   qu'une structure parallèle — cohérent avec « même format `dialogue_states`/`state_rules`/`pages`
   que les PNJ » (§ でんわ).
4. **Salon du keigo ne demande aucune nouvelle table** : vérifié contre le § Schéma Base de Données
   complet — la récompense de collection se modélise entièrement avec l'existant (`items.category:
   collectible`, `Effect.grant_item` idempotent sur un item `unique`) ; l'objet déjà possédé fait
   office de marqueur « session faite », pas besoin d'un `keigo_session_completions`.
5. **`vocabulaire en contexte` ne porte pas d'`answer_span`** — le mécanisme de scaffolding décrit dans
   `texts-progressifs.md` ne couvre explicitement que idée générale / inférence / résolution de
   référence ; traité comme le factuel (info explicite, pas de ciblage nécessaire).

Aucun de ces points ne change une décision déjà tranchée au grill — ce sont des trous de forme, pas
de fond, comblés pour que la tranche verticale (Étape 3, point 2) ait un format à suivre plutôt qu'à
inventer en écrivant.

## Vérification post-écriture contre les docs non consultés en écrivant (2026-07-09)

Après la première passe, relecture explicite contre les docs pas encore ouverts dans cette session
(`CONTEXT.md`, `docs/adr/0001-0004`, `docs/agents/domain.md`, `content/npc-inventory.md`,
`content/rom-trainer-roster.json`) — demandée par l'utilisateur avant d'aller plus loin dans la
roadmap. **2 vraies erreurs trouvées et corrigées**, pas de simples trous de forme :

1. **`text-example.json` violait le budget kanji** (`texts-progressifs.md` § Vetting, `CONTEXT.md` §
   Kanji Budget) : 12 kanji distincts hors studiedSet sur 66 caractères contre un budget proportionnel
   de ~2/100 caractères (plafond absolu 8-10). Réécrit avec seulement 2 kanji hors studiedSet (岩,
   砕 — vérifié par script contre `content/kanji-zone-assignment.json`), le reste en hiragana ou en
   kanji déjà étudiés — les questions reprennent le vocabulaire du passage plutôt que d'en introduire
   du nouveau, traitées avec la même prudence.
2. **`joey_route30.json` donnait la mauvaise classe de dresseur** : `name.jp` utilisait
   「むしとりしょうねん」 (Bug Catcher — en fait la classe de Don, un autre dresseur de la même
   route) au lieu de la vraie classe de Joey, Youngster, confirmée par
   `content/rom-trainer-roster.json` (`TRAINER_YOUNGSTER_JOEY`) — corrigé en 「たんパンこぞうの　
   ジョーイ」 selon la convention posée par l'ADR-0002. Ce fichier dépassait aussi de 1 le budget
   kanji (3 au lieu de 2 max par dialogue) — corrigé au passage.

**Confirmé sans changement nécessaire** : `docs/adr/0003` (Condition/Effect) ne contredit rien ici ;
`content/side-content-inventory.md` ne couvre que les textes secondaires (mon texte est obligatoire,
hors de son périmètre) ; aucune nouvelle table de schéma nécessaire (point 4 ci-dessus). **2 termes de
domaine ajoutés à `CONTEXT.md`** (Instant Response, Keigo Salon) — absents du glossaire alors que leur
forme venait d'être fixée ici, signalé comme un vrai trou par `docs/agents/domain.md` (« si le concept
n'est pas dans le glossaire, c'est un signal »).
