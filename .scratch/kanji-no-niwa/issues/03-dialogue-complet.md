# 03 — Boîte de dialogue complète (pagination, X/Y, kinds spéciaux)

Status: ready-for-agent
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
