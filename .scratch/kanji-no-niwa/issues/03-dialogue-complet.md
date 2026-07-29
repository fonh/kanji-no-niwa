# 03 — Boîte de dialogue complète (pagination, X/Y, kinds spéciaux)

Status: ready-for-human
Bloqué par: 02
Bloque: 05, 07, 08

## Contexte

`MapClient.tsx` a une boîte de dialogue rudimentaire. Le PRD (§ Mouvement de l'avatar,
§ Langue du Jeu) définit le contrat complet : A avance, B ferme, X toggle la traduction
anglaise de la page courante, Y toggle les lectures inline — et le moteur doit router les
entrées spéciales de `pages[]` (`engine-contract.md` § 8).

## Périmètre (vertical slice)

- **Rendu d'une page** : `jp` en `BIZ UDGothic` (charger les deux fontes Google —
  `DotGothic16` pour le chrome, `BIZ UDGothic` pour la lecture, PRD § Typographie),
  bordure de dialogue HGSS (`public/sprites/ui/dialogue/`).
- **Lectures inline** (ADR-0002, CONTEXT.md « Inline Reading ») : les lectures sont dans
  la chaîne `jp` en parenthèses pleine largeur `道場（どうじょう）`. Par défaut
  **masquées** ; Y les révèle pour la page courante (rendu ruby au-dessus du kanji,
  furigana ≥ 10px). Parser robuste + testé.
- **X** : superpose la traduction `en` de la page courante. Jamais affichée d'office.
- **Boutons overlay X/Y** visibles uniquement pendant un dialogue (PRD § Interface).
- **Kinds spéciaux** de `pages[]` : `companion_choice` (3 choix depuis
  `content/companions.json`, écrit via `Effect.set_companion` — requis dès le labo
  d'Elm) ; `instant_response` et `conversation_turn` : routage défini mais UI minimale
  acceptable (pas requis au jalon 1) — un kind inconnu ne doit jamais crasher, il
  loggue et saute la page.
- **Effects** : appliqués à l'atteinte de l'état via la server action de l'issue 02.
- Vitesse de texte : effet machine à écrire simple (le réglage おそい/ふつう/はやい
  attendra l'écran Settings).

## Critères d'acceptation

- La séquence complète du labo d'Elm est jouable : dialogue paginé → choix du compagnon
  persisté → Effects de quête déclenchés.
- X et Y togglent sur chaque page de `prof_elm_lab.json` ; les lectures inline ne
  fuient jamais dans le rendu par défaut.
- Tests : parser des lectures inline (cas imbriqués, noms de personnages), routage des
  kinds, composant de page (test .tsx).

## Comments

**2026-07-29 (agent, implémentation)** — Fait, en TDD strict (parser et routage : tests
écrits avant chaque module ; composant : 21 tests .tsx jsdom).

Livré :
- `src/lib/inline-reading.ts` — parseur pur des lectures inline (ADR-0002).
  API : `parseInlineReadings(jp) → ReadingSegment[]` (`{base, reading?}`),
  `stripReadings(jp)`, et pour la machine à écrire `totalBaseLength(segments)` /
  `sliceSegments(segments, count)` (un run à lecture coupé en cours de frappe perd son
  ruby jusqu'à complétion). Robuste : parenthèses pleine largeur sans run de kanji
  devant = vraies parenthèses conservées ; contenu non-kana = pas une lecture ; runs
  multiples ; 々/〆/〇/ヵ/ヶ dans le run ; ー/・ dans la lecture. 24 tests.
- `src/lib/dialogue-pages.ts` — routage pur des kinds de `pages[]` (contrat § 8).
  API : `routeDialoguePages(entries, warn?) → RoutedPage[]` (union discriminée `text` |
  `companion_choice` | `instant_response` | `conversation_turn`) — kind inconnu ou
  entrée invalide : loggué + sauté, jamais de crash ; `attachCompanionOptions(pages,
  roster)` (enrichissement serveur, ne mute jamais le cache module du loader) ;
  navigation 会話 `findConversationTurn` / `resolveConversationNext` (`next` = turn_id
  ou `end`, turn_id inconnu → sortie de bloc) ; `shuffledIndices(n, rng?)` — mélange
  obligatoire des choix affichés (contrat § 8 : le contenu liste la réponse naturelle
  en premier, l'ordre stocké ne doit jamais transparaître). 18 tests, sur les vrais
  fichiers (prof_elm_lab, joey_route30, gabarit conversation-example).
- `src/components/JpText.tsx` — rendu jp partagé (les issues 05/07/08 le réutilisent) :
  `<JpText jp showReadings visibleChars? className?>` — `<ruby>` toujours dans le DOM
  (hauteur stable), `<rt>` vidé tant que Y n'est pas actif (aucune fuite dans
  textContent), furigana ≥ 10px (`.jp-inline rt` dans globals.css).
- `src/app/map/DialogueBox.tsx` — la boîte extraite de MapClient. API :
  `<DialogueBox ref name pages onClose onChooseCompanion? typewriterMsPerChar?>` avec
  handle impératif `{pressA, pressX, pressY}` (B = `onClose`, géré par l'appelant) ;
  `pages` = les `DialoguePageEntry[]` brutes de `reachDialogueState`. A complète la
  frappe puis avance ; pages à choix inertes sur A (on choisit) ; X/Y repartent masqués
  À CHAQUE ligne (rappel actif — l'état par ligne vit dans un sous-composant remonté
  par `key`, ce qui satisfait aussi les nouvelles règles react-hooks sans setState
  d'effet). companion_choice : 3 options, tbd_2/tbd_3 affichés `？？？` et désactivés ;
  instant_response / conversation_turn : UI minimale complète (choix mélangés,
  réactions paginées, `next`). Boutons overlay X/Y rendus PAR la boîte (donc
  n'existent que pendant un dialogue), au-dessus du bloc A/B. Cadre HGSS :
  `.dialogue-frame` = border-image 9-slice de `public/sprites/ui/dialogue/textbox_000.png`.
- Fontes (`src/app/layout.tsx` + globals.css) : `DotGothic16` → `.font-chrome`
  (HUD/overworld, appliqué à la racine de MapClient), `BIZ UDGothic` → `.font-reading`
  (texte jp de la boîte, choix), via next/font/google (`preload: false`, slices
  japonaises servies par unicode-range).
- Serveur (`src/app/map/actions.ts`) : `reachDialogueState` enrichit désormais les
  entrées companion_choice avec le roster (`getCompanions()` ajouté à
  `src/lib/content.ts`) ; nouvelle action `chooseCompanion(companionId)` — re-valide
  côté serveur (slot inexistant ou non `confirmed` refusé), applique
  `Effect.set_companion` via la lib 02 (écrit une fois, idempotent), persiste
  seulement si l'état a changé.
- MapClient : le filtre provisoire des pages à `kind` est REMPLACÉ par le passage des
  pages brutes à DialogueBox ; A/X/Y relayés par ref impérative, B ferme ;
  −70 lignes nettes.
- `vitest.config.ts` : alias `@/` → `src/` ajouté aux deux projets (aligné
  tsconfig.json ; nécessaire au premier test .tsx du repo).

Critères d'acceptation, un par un :
1. Séquence du labo d'Elm jouable — test « welcome se joue de bout en bout » dans
   `DialogueBox.test.tsx` sur le vrai `prof_elm_lab.json` + vrai `companions.json`
   (3 pages → choix persisté via callback → 3 pages → fermeture) ; les Effects de
   quête restent déclenchés par `reachDialogueState` (walkthrough issue 02 toujours
   vert). ✓
2. X/Y togglent sur chaque page de chaque state de `prof_elm_lab.json` ; zéro fuite de
   lecture dans le rendu par défaut — test dédié qui parcourt les 6 states. ✓
3. Tests parser (24), routage (18), composant (21 .tsx jsdom). ✓

Preuves : `npm run check` tout vert — 171 tests (108 avant l'issue), typecheck OK,
lint 0 erreur (2 warnings `<img>` préexistants), lints contenu inchangés.

Écarts/décisions :
- **X/Y remis à zéro à chaque page** (l'ancienne boîte gardait les toggles pour tout le
  dialogue). Lecture stricte du PRD (« de la page courante » + rappel actif) ; trivial
  à assouplir si la QA humaine préfère la persistance par dialogue.
- **Mélange des choix affichés étendu à instant_response/conversation_turn** : le
  contrat § 8 le formule pour les QCM à `correct_index`, mais sans mélange la réponse
  `natural` serait toujours affichée première (elle l'est dans tous les fichiers). Le
  companion_choice n'est PAS mélangé (roster fixe, pas un quiz).
- **Aucune chaîne système nécessaire** → `src/data/ui-strings.json` non créé (les slots
  indisponibles affichent le `？？？` du roster ; compteur de pages numérique ; ▼).
  Le `content/ui-strings.json` du PRD reste à créer quand un vrai besoin apparaîtra.
- Machine à écrire : 28 ms/caractère par défaut, prop `typewriterMsPerChar` (0 =
  instantané, utilisé par les tests) — branchement direct pour le futur réglage
  おそい/ふつう/はやい de l'écran Settings.
- `instant_response`/`conversation_turn` : au-delà du « routage défini » requis, l'UI
  minimale est fonctionnelle (testée) — mais aucun consommateur en jeu avant les
  écrans Pokégear/appels ; le champ `audio_ref` des prompts est ignoré pour l'instant.
- Pas de vérification visuelle en navigateur sur cette machine (DATABASE_URL absent,
  connu depuis l'issue 02) — la QA humaine (phase 6) verra fontes/cadre/typewriter.
