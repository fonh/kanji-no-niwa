// Défaites et retour au Centre Pokémon (2026-08-06) — logique pure.
//
// POURQUOI
// --------
// Perdre un combat n'avait aucune conséquence : on rejouait le même dresseur
// à la suite, autant de fois qu'on voulait. Le jeu d'origine, lui, renvoie au
// dernier Centre Pokémon visité — c'est ce qui donne son poids à un combat.
//
// Ici la sanction est plus douce, et c'est voulu : les combats sont des
// QUIZ, et perdre parce qu'on ne connaît pas encore un kanji ne doit pas coûter
// une traversée de route à chaque fois. On laisse donc DEUX échecs, et c'est le
// TROISIÈME depuis le dernier passage au Centre qui renvoie — assez pour
// apprendre de ses erreurs, assez rare pour ne pas punir l'apprentissage.
//
// « Aller au Centre » = y entrer. Le compteur repart de zéro à l'entrée, et
// c'est ce Centre-là qui devient le point de retour. L'infirmière, elle, dit ce
// qui vient de se passer (le soin est narratif : il n'y a pas de PV ici).

/** Nombre de défaites toléré avant le retour forcé. La troisième renvoie. */
export const DEFEAT_LIMIT = 3

/** Le point de retour : la zone d'un Centre Pokémon et la tuile d'arrivée. */
export interface CenterAnchor {
  zone: string
  world_x: number
  world_z: number
}

/** Le Centre de départ, tant que le joueur n'en a visité aucun.
 *
 * Ville Griotte : c'est le premier Centre du jeu, et le premier du chemin
 * critique — un joueur qui perdrait trois combats avant d'y être passé (les
 * dresseurs de la Route 30 sont après) y sera renvoyé sans que ce soit absurde
 * narrativement. */
export const DEFAULT_CENTER: CenterAnchor = {
  zone: 'MAP_CHERRYGROVE_POKECENTER_1F',
  world_x: 15,
  world_z: 6,
}

/** Cette zone est-elle l'accueil d'un Centre Pokémon ?
 *
 * Reconnu sur le nom de zone du registre ROM plutôt que sur une liste écrite à
 * la main : tous les Centres suivent `MAP_<ville>_POKECENTER_1F`, et une liste
 * manuelle oublierait les villes ajoutées plus tard. Le sous-sol (B1F, Wi-Fi)
 * n'en est pas un — on n'y soigne pas. */
export function isPokemonCenter(zoneName: string): boolean {
  return /_POKECENTER_1F$/.test(zoneName)
}

export interface DefeatOutcome {
  /** Compteur à écrire. */
  defeats: number
  /** Non nul : le joueur est renvoyé là, et le compteur est reparti de zéro. */
  sendTo: CenterAnchor | null
}

/** Ce qu'une défaite de plus produit. */
export function recordDefeat(defeats: number, anchor: CenterAnchor | null): DefeatOutcome {
  const next = defeats + 1
  if (next < DEFEAT_LIMIT) return { defeats: next, sendTo: null }
  return { defeats: 0, sendTo: anchor ?? DEFAULT_CENTER }
}

/** Combien de défaites il reste avant le retour — pour la ligne que
 * l'infirmière et l'écran de défaite peuvent afficher. */
export function defeatsLeft(defeats: number): number {
  return Math.max(0, DEFEAT_LIMIT - defeats)
}
