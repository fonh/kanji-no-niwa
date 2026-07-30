import type { Zone } from '@/lib/zone-geometry'

interface RawTrainer {
  trainer_id: string
  zone_id: string
  name: string
  tile_x: number
  tile_y: number
  facing: 'north' | 'south' | 'east' | 'west'
  sight_range: number
  role: string
  trigger_type: string
  dialogue_ref: string
}

export interface ZoneTrainer {
  trainer_id: string
  zone_id: string
  name: string
  world_x: number
  world_z: number
  facing: 'north' | 'south' | 'east' | 'west'
  sight_range: number
  /** battle/lesson (registre map_trainers) — seul `battle` déclenche un combat. */
  role: string
  /** sight_auto = embuscade dans la ligne de vue ; talk = A seulement. */
  trigger_type: string
  dialogue_ref: string
  /** Posé côté serveur (defeated_trainers[]) — un dresseur battu ne
   * re-déclenche jamais automatiquement (issue 07). */
  defeated?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawTrainers = require('../../content/map/trainers.json') as RawTrainer[]

const knownZoneIds = Array.from(new Set(rawTrainers.map(t => t.zone_id)))

function normalizeMapName(mapName: string): string {
  return mapName.replace(/^MAP_/, '').toLowerCase().replace(/_/g, '-')
}

// Same heuristic as src/lib/npcs.ts — see that file for why prefix matching.
function zoneIdForMapName(mapName: string): string | undefined {
  const normalized = normalizeMapName(mapName)
  return knownZoneIds.find(zoneId => zoneId === normalized || zoneId.startsWith(`${normalized}-`))
}

export function getTrainersForZone(zone: Zone): ZoneTrainer[] {
  const zoneId = zoneIdForMapName(zone.name)
  if (!zoneId) return []

  return rawTrainers
    .filter(t => t.zone_id === zoneId)
    .map(t => ({
      trainer_id: t.trainer_id,
      zone_id: t.zone_id,
      name: t.name,
      world_x: zone.world_origin_x + t.tile_x,
      world_z: zone.world_origin_y + t.tile_y,
      facing: t.facing,
      sight_range: t.sight_range,
      role: t.role,
      trigger_type: t.trigger_type,
      dialogue_ref: t.dialogue_ref,
    }))
}

/** Minimal shape a sight check needs — shared between trainers (ambush) and
 * Roadblock NPCs (interception, issue 10) : CONTEXT.md « Sight Cone » is one
 * geometry for both. */
export interface SightSource {
  world_x: number
  world_z: number
  facing: 'north' | 'south' | 'east' | 'west'
  sight_range: number
}

/** Straight line-of-sight in front of the trainer, matching the classic
 * mainline-game mechanic (not a widening cone despite the name in ADR-0001)
 * — one tile wide, `sight_range` tiles long, in the direction `facing`. */
export function isInSightLine(trainer: SightSource, worldX: number, worldZ: number): boolean {
  const { world_x, world_z, facing, sight_range } = trainer
  switch (facing) {
    case 'south':
      return worldX === world_x && worldZ > world_z && worldZ <= world_z + sight_range
    case 'north':
      return worldX === world_x && worldZ < world_z && worldZ >= world_z - sight_range
    case 'east':
      return worldZ === world_z && worldX > world_x && worldX <= world_x + sight_range
    case 'west':
      return worldZ === world_z && worldX < world_x && worldX >= world_x - sight_range
  }
}
