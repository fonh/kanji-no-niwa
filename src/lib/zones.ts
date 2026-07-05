import type { Zone, ZoneBounds } from '@/lib/zone-geometry'
import { beatCountForMapName } from '@/lib/story-beats'

export type { Zone, ZoneObject, ZoneWarp, ZoneBounds } from '@/lib/zone-geometry'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawRegistry = require('@/data/zone-registry.json') as { zones: Zone[] }

const zonesByName = new Map<string, Zone>(rawRegistry.zones.map(z => [z.name, z]))

export function getAllZones(): Zone[] {
  return rawRegistry.zones
}

export interface ZoneListEntry extends ZoneBounds {
  map_id: number
  display_name: string | null
  // Screenshot reference so adjacent outdoor zones can be drawn around the
  // current one (continuous world rendering) without fetching their full
  // data (collision grids are megabytes; these three fields are not).
  screenshot: string
  screenshot_w: number
  screenshot_h: number
  // Story beats anchored in this zone (content/map/story-beats.json) —
  // the map shows a count marker only, never the underlying text.
  beat_count: number
}

export function getZoneNames(): ZoneListEntry[] {
  return rawRegistry.zones.map(z => ({
    name: z.name,
    map_id: z.map_id,
    display_name: z.display_name,
    is_outdoor: z.is_outdoor,
    world_origin_x: z.world_origin_x,
    world_origin_y: z.world_origin_y,
    tile_width: z.tile_width,
    tile_height: z.tile_height,
    screenshot: z.screenshot,
    screenshot_w: z.screenshot_w,
    screenshot_h: z.screenshot_h,
    beat_count: beatCountForMapName(z.name),
  }))
}

export function getZoneByName(name: string): Zone | undefined {
  return zonesByName.get(name)
}
