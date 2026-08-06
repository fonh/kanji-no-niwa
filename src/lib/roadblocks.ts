// Verrous de progression (issue 13) — logique pure, zéro I/O.
//
// Le moteur n'avait qu'UN seul contrôle à l'entrée d'une zone extérieure (« la
// session SRS du jour est-elle faite ? ») et un seul PNJ bloqueur dans tout le
// contenu. Résultat : révisions faites, tout Johto et tout Kanto ouverts, les
// quêtes avançant dans n'importe quel ordre.
//
// Un verrou barre un FRANCHISSEMENT précis (zone de départ → zone d'arrivée)
// tant que ses conditions ne sont pas remplies. Il est évalué CÔTÉ SERVEUR
// (checkZoneEntry) : un verrou décidé par le client se contourne.
//
// Le garde est un acteur d'interception, pas un PNJ permanent — il n'apparaît
// que pour barrer la route, comme le Pr. Elm qui sort en courant du labo dans
// le jeu d'origine.

import {
  evalConditions,
  type Condition,
  type EvalContext,
  type PlayerState,
} from '@/lib/condition-effect'
import type { Direction } from '@/lib/zone-geometry'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const raw = require('../../content/map/roadblocks.json') as { roadblocks: Roadblock[] }

export interface RoadblockGuard {
  sprite_id: string
  name: { jp: string; en?: string }
  /** Tuile LOCALE d'où le garde surgit, dans `from_zone`. */
  post: { tile_x: number; tile_y: number }
  facing: Direction
}

/** L'index signature aligne le type sur `DialoguePageEntry` (src/lib/content.ts)
 * pour que ces pages passent telles quelles dans la boîte de dialogue. */
export interface RoadblockPage {
  jp: string
  en?: string
  [key: string]: unknown
}

export interface Roadblock {
  roadblock_id: string
  source: string
  from_zone: string
  to_zone: string
  guard: RoadblockGuard
  unlock_conditions: Condition[]
  pages: RoadblockPage[]
}

export function getRoadblocks(): Roadblock[] {
  return raw.roadblocks
}

/** Le verrou qui barre ce franchissement pour ce joueur, ou null.
 *
 * `from_zone` compte : un verrou barre une DIRECTION, pas une zone. Revenir
 * sur ses pas n'est jamais bloqué — c'est ce qui empêche un verrou d'enfermer
 * le joueur du mauvais côté. */
export function blockingRoadblock(
  fromZone: string,
  toZone: string,
  state: PlayerState,
  ctx: EvalContext
): Roadblock | null {
  return (
    getRoadblocks().find(
      r =>
        r.from_zone === fromZone &&
        r.to_zone === toZone &&
        !evalConditions(r.unlock_conditions, state, ctx)
    ) ?? null
  )
}
