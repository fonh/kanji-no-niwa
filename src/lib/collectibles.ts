// Les Poké Balls ramassables sur la carte (2026-08-06) — logique pure.
//
// POURQUOI
// --------
// Le jeu d'origine sème des Poké Balls sur les routes et dans les donjons :
// on marche dessus, on ramasse un objet, la ball disparaît. Ici il n'y a ni
// Potion ni Antidote à ramasser — mais il y a mieux à y mettre : les **textes
// secondaires** (`content/texts-progressifs.md`), qui « remplacent les side
// quests classiques du jeu » et dont la voie de rattachement prévue pour une
// route pauvre en PNJ est justement l'objet trouvé (`found_object_ref`).
//
// Une ball ramassée débloque donc un texte : il rejoint le どくしょノート du Sac,
// se lit tout de suite ou plus tard, et la ball disparaît de la carte pour de
// bon (même mécanique de `cleared` que les obstacles franchis).
//
// COMMENT EN AJOUTER
// ------------------
// Une ligne ici, un fichier dans `content/texts/<zone>/`. Rien d'autre :
//  - `rom-decor.ts` ne sert une ball que si elle est dans cette table (une ball
//    qui ne donnerait rien reste cachée — promettre un ramassage vide est pire
//    que ne rien montrer) ;
//  - `collectFoundText` (src/app/map/actions.ts) applique l'`unlock_text` côté
//    serveur après avoir vérifié que la ball est bien dans la zone du joueur ;
//  - le client ouvre la fenêtre de lecture et marque la ball ramassée.
//
// La clé est l'`id` de l'objet ROM (`obj_R30_monstarball`), stable : il vient du
// dump `zone_event` et ne bouge pas d'une extraction à l'autre.

/** id d'objet ROM (Poké Ball) → text_id débloqué en la ramassant. */
const BALL_TEXTS: Record<string, string> = {
  // Route 29 — le carnet du promeneur, à l'entrée est de la route.
  obj_R29_monstarball: 'walker_notebook_route29',
  // Route 30 — la liste de courses tombée, puis le mot de l'attrapeur.
  obj_R30_monstarball: 'shopping_note_route30',
  obj_R30_monstarball_2: 'bug_catcher_memo_route30',
  // Route 31 — le panneau arraché, et la lettre non postée près de la grotte.
  obj_R31_monstarball: 'fallen_signpost_route31',
  obj_R31_monstarball_2: 'unsent_letter_route31',
  // Mauville — le prospectus de l'École, et la page de carnet du toit.
  obj_T22_monstarball: 'school_leaflet_violet',
  obj_T22_monstarball_2: 'rooftop_page_violet',
  // Tour Grospignon — la règle des lieux, au pied de l'escalier du 1F.
  obj_D15R0101_monstarball: 'tower_rule_sprout_tower',
}

/** Le texte que cette Poké Ball contient, ou null si elle n'en porte pas. */
export function collectibleTextFor(objectId: string): string | null {
  return BALL_TEXTS[objectId] ?? null
}

export function hasCollectible(objectId: string): boolean {
  return objectId in BALL_TEXTS
}

/** Toutes les paires connues — pour les garde-fous (chaque texte annoncé ici
 * doit exister dans content/texts/, et réciproquement). */
export function allCollectibles(): { object_id: string; text_id: string }[] {
  return Object.entries(BALL_TEXTS).map(([object_id, text_id]) => ({ object_id, text_id }))
}
