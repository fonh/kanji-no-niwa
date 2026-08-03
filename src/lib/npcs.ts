import type { Zone } from '@/lib/zone-geometry'
import { zoneSlugForMapName } from '@/lib/zone-slug'

interface RawNpc {
  npc_id: string
  zone_id: string
  name: string
  // Zone MAP_* explicite (issue 12) — pour les PNJ qui vivent DANS un
  // intérieur (Mom au 1F de la maison, Elm dans son labo…) : le slug de
  // contenu `zone_id` ne désigne que la zone extérieure de rattachement,
  // et l'heuristique zone-slug ne sert jamais les intérieurs. tile_x/tile_y
  // sont alors locaux à cette zone-là.
  map_zone?: string
  tile_x: number
  tile_y: number
  trigger_type: string
  dialogue_ref: string
  // Champs de cône de vision (Roadblock NPC, issue 10) — présents seulement
  // sur les PNJ à trigger_type sight_auto (ex. rocket_grunt_azalea).
  facing?: 'north' | 'south' | 'east' | 'west'
  sight_range?: number
  sight_auto_result?: string
  repeats?: boolean
  // Identifiant de sprite optionnel (issue 13) — absent pour l'immense
  // majorité des PNJ curatés (contenu séparé des objets de décor ROM, voir
  // src/lib/npc-sprites.ts), posé au cas par cas quand un vrai sprite
  // 4-directions vérifié existe (HNS_PEOPLE).
  sprite_id?: string
}

export interface ZoneNpc {
  npc_id: string
  zone_id: string
  name: string
  world_x: number
  world_z: number
  dialogue_ref: string
  /** talk (défaut) ou sight_auto — un sight_auto à résultat `block` déclenche
   * l'interception Roadblock (CONTEXT.md) dès l'entrée dans la ligne de vue. */
  trigger_type: string
  facing?: 'north' | 'south' | 'east' | 'west'
  sight_range?: number
  sight_auto_result?: string
  repeats?: boolean
  sprite_id?: string
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

  // Un PNJ à `map_zone` explicite n'est servi QUE dans cette zone (c'est ce
  // qui place Mom dans sa maison et Elm dans son labo — issue 12) ; les
  // autres suivent l'heuristique de slug (zone extérieure de rattachement).
  return rawNpcs
    .filter(n => (n.map_zone ? n.map_zone === zone.name : zoneId !== undefined && n.zone_id === zoneId))
    .map(n => ({
      npc_id: n.npc_id,
      zone_id: n.zone_id,
      name: n.name,
      world_x: zone.world_origin_x + n.tile_x,
      world_z: zone.world_origin_y + n.tile_y,
      dialogue_ref: n.dialogue_ref,
      trigger_type: n.trigger_type,
      facing: n.facing,
      sight_range: n.sight_range,
      sight_auto_result: n.sight_auto_result,
      repeats: n.repeats,
      sprite_id: n.sprite_id,
    }))
}
