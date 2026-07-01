export interface ZoneObject {
  id: string
  spriteId: string
  x: number
  z: number
  eventFlag: string
}

export interface ZoneWarp {
  x: number
  z: number
  header: string
  anchor: number
}

export interface Zone {
  name: string
  map_id: number
  screenshot: string
  screenshot_w: number
  screenshot_h: number
  tile_width: number
  tile_height: number
  scale_x: number
  scale_y: number
  world_origin_x: number
  world_origin_y: number
  objects: ZoneObject[]
  warps: ZoneWarp[]
  walkable: boolean[]
}

// Pure geometry helpers with no data dependency — safe to import from both
// server code and 'use client' components (unlike src/lib/zones.ts, which
// pulls in the multi-MB zone registry JSON at module scope).

export function isWalkable(zone: Zone, worldX: number, worldZ: number): boolean {
  const localX = worldX - zone.world_origin_x
  const localZ = worldZ - zone.world_origin_y
  if (localX < 0 || localX >= zone.tile_width || localZ < 0 || localZ >= zone.tile_height) {
    return false
  }
  const index = localZ * zone.tile_width + localX
  return zone.walkable[index] === true
}

export function zoneCenter(zone: Zone): { world_x: number; world_z: number } {
  return {
    world_x: zone.world_origin_x + Math.floor(zone.tile_width / 2),
    world_z: zone.world_origin_y + Math.floor(zone.tile_height / 2),
  }
}
