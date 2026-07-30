// Roadblock NPC (issue 10) — CONTEXT.md « Roadblock NPC » / PRD § 1113 :
// un PNJ dont le Sight Cone déclenche une INTERCEPTION au lieu d'un combat —
// il marche vers le joueur, livre sa ligne de blocage (boîte de dialogue
// standard), et le joueur est repoussé d'une case. Se reproduit à chaque
// approche tant que sa condition n'est pas levée (au jalon : tant que le PNJ
// est présent — la présence est déjà filtrée serveur par unlock_conditions).
//
// Géométrie pure, zéro I/O — la séquence animée (marche, dialogue, repoussée)
// vit dans MapClient ; la même mécanique servira les PNJ-leçon à cône en
// avance de séquence (CONTEXT.md « Lesson NPC ») quand le contenu en placera.

import { isInSightLine, type SightSource } from '@/lib/trainers'
import { DIRECTION_DELTA } from '@/lib/zone-geometry'

export interface RoadblockSource extends SightSource {
  trigger_type: string
  sight_auto_result?: string
}

/** Le premier PNJ bloqueur dont la ligne de vue contient le joueur, sinon
 * null. Même géométrie que les dresseurs (1 tuile de large, sight_range de
 * long, direction facing — isInSightLine). */
export function findInterceptingNpc<T extends RoadblockSource>(
  npcs: readonly T[],
  worldX: number,
  worldZ: number
): T | null {
  return (
    npcs.find(
      n =>
        n.trigger_type === 'sight_auto' &&
        n.sight_auto_result === 'block' &&
        isInSightLine(n, worldX, worldZ)
    ) ?? null
  )
}

/** Les tuiles que le PNJ traverse pour rejoindre le joueur : de sa position
 * (exclue) jusqu'à la case ADJACENTE au joueur (incluse), le long de son axe
 * de vue. Joueur déjà adjacent → []. */
export function interceptionApproach(
  npc: SightSource,
  playerX: number,
  playerZ: number
): { x: number; z: number }[] {
  const { dx, dz } = DIRECTION_DELTA[npc.facing]
  const steps = Math.abs(playerX - npc.world_x) + Math.abs(playerZ - npc.world_z) - 1
  const path: { x: number; z: number }[] = []
  for (let i = 1; i <= steps; i++) {
    path.push({ x: npc.world_x + dx * i, z: npc.world_z + dz * i })
  }
  return path
}

/** La case où le joueur est repoussé : une tuile plus loin dans la direction
 * de vue du PNJ (= le pas d'entrée dans le cône, annulé). L'appelant vérifie
 * la marchabilité (canTraverse) avant d'appliquer. */
export function pushBackTile(
  npc: Pick<SightSource, 'facing'>,
  playerX: number,
  playerZ: number
): { x: number; z: number } {
  const { dx, dz } = DIRECTION_DELTA[npc.facing]
  return { x: playerX + dx, z: playerZ + dz }
}
