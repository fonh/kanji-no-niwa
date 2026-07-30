import type { Zone } from '@/lib/zone-geometry'
import { zoneSlugForMapName } from '@/lib/zone-slug'

interface RawNpc {
  npc_id: string
  zone_id: string
  name: string
  tile_x: number
  tile_y: number
  trigger_type: string
  dialogue_ref: string
}

export interface ZoneNpc {
  npc_id: string
  zone_id: string
  name: string
  world_x: number
  world_z: number
  dialogue_ref: string
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawNpcs = require('../../content/map/npcs.json') as RawNpc[]

const knownZoneIds = Array.from(new Set(rawNpcs.map(n => n.zone_id)))

// content/map/npcs.json uses human zone_id slugs ("new-bark-town") while the
// zone registry uses ROM map names ("MAP_NEW_BARK") — the shared mapping
// heuristic lives in zone-slug.ts (issue 09), applied here to the slugs the
// NPC registry actually uses.
function zoneIdForMapName(mapName: string): string | undefined {
  return zoneSlugForMapName(mapName, knownZoneIds)
}

export function getNpcsForZone(zone: Zone): ZoneNpc[] {
  const zoneId = zoneIdForMapName(zone.name)
  if (!zoneId) return []

  return rawNpcs
    .filter(n => n.zone_id === zoneId)
    .map(n => ({
      npc_id: n.npc_id,
      zone_id: n.zone_id,
      name: n.name,
      world_x: zone.world_origin_x + n.tile_x,
      world_z: zone.world_origin_y + n.tile_y,
      dialogue_ref: n.dialogue_ref,
    }))
}
