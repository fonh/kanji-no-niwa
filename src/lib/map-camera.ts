// Géométrie de la caméra et ordre de dessin des personnages (issue 13).
//
// Les deux règles vivent ici, hors du composant, parce qu'elles se vérifient à
// l'arithmétique alors que le bug, lui, ne se voit qu'à l'œil : le compagnon
// dessiné sur la tête du joueur, la bande noire au bord d'une route.

/** Plancher des z-index de personnages. */
export const DEPTH_Z_BASE = 10
/** Tout ce qui doit rester au-dessus des personnages (nom de zone, dialogue,
 * menus) vit au-dessus de ce plafond. La bande occupée par les personnages est
 * DEPTH_Z_BASE + 2 × rangée, et aucune carte du jeu ne fait 200 rangées. */
export const DEPTH_Z_CEILING = 500

/**
 * Le z-index d'un personnage, à partir de sa rangée dans le monde.
 *
 * Un sprite fait 32 px de haut pour une tuile de ~12 px à l'écran : deux
 * personnages sur des rangées voisines se chevauchent forcément. Avec des
 * z-index fixes, celui de derrière passait devant. Comme le vrai jeu, on tranche
 * par la rangée : le plus bas à l'écran est le plus proche, donc au-dessus.
 * Le pas de 2 laisse une place intercalaire au joueur, qui gagne ainsi les
 * égalités sur sa propre rangée.
 */
export function depthZ(worldZ: number, worldOriginY: number): number {
  return DEPTH_Z_BASE + (worldZ - worldOriginY) * 2
}

/** Cadrage de référence : on veut ce nombre de rangées sur la hauteur du cadre,
 * comme la DS. */
export const VISIBLE_TILES_Y = 12
/** Au-delà, les pixels d'une carte de route deviennent des pavés. */
export const MAX_ZOOM = 4

/**
 * Le grossissement à appliquer au décor.
 *
 * Cadrage normal : VISIBLE_TILES_Y rangées sur la hauteur, plafonné à MAX_ZOOM.
 * Mais un petit intérieur (la maison du Père Kéa) est plus petit que le cadre à
 * ce grossissement-là : il flottait au milieu d'un grand cadre noir. Le vrai jeu
 * ne montre jamais ça — une pièce occupe toujours l'écran entier. On grossit
 * donc au moins assez pour couvrir le cadre.
 */
export function mapZoom(
  viewW: number,
  viewH: number,
  mapW: number,
  mapH: number,
  scaleY: number
): number {
  const cadrage = Math.min(MAX_ZOOM, Math.max(1, viewH / (VISIBLE_TILES_Y * scaleY)))
  if (mapW <= 0 || mapH <= 0) return cadrage
  return Math.max(cadrage, viewW / mapW, viewH / mapH)
}

/**
 * Le décalage de la scène pour centrer la caméra sur le joueur, sans jamais
 * sortir du décor.
 *
 * Sans borne, marcher au bord d'une route faisait entrer une large bande NOIRE
 * dans le champ : la grille de collision déborde de la capture (ADR-0006 mesure
 * un pas de tuile qui ne recouvre pas exactement l'image), et au-delà il n'y a
 * rien à dessiner. HGSS ne montre jamais ça — sa caméra s'arrête au bord de la
 * carte et le personnage continue seul vers le bord de l'écran.
 *
 * Quand le décor est plus PETIT que le cadre (les petits intérieurs), il n'y a
 * pas de borne à respecter : on le centre.
 */
export function cameraOffset(
  avatar: number,
  stage: number,
  map: number
): number {
  const centred = stage / 2 - avatar
  const lo = stage - map
  if (lo > 0) return lo / 2
  return Math.min(0, Math.max(lo, centred))
}
