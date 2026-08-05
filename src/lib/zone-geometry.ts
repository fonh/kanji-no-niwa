export interface ZoneObject {
  id: string
  spriteId: string
  x: number
  z: number
  eventFlag: string
  facingDirection: number
  movement: number
  xRange: number
  yRange: number
}

export interface ZoneWarp {
  x: number
  z: number
  // MAP_* name — or the number 4095 (0xFFF) for the ROM's "dynamic warp"
  // slots (elevators, Safari Zone gate) whose destination is runtime state
  // we don't model; those are inert on the map.
  header: string | number
  anchor: number
}

/** Cardinal directions, matching the ROM's DIR_* codes (0=N,1=S,2=W,3=E)
 * used by the ledge data and trainer facing. */
export type Direction = 'north' | 'south' | 'west' | 'east'

export const DIRECTION_BY_CODE: Direction[] = ['north', 'south', 'west', 'east']

export const DIRECTION_DELTA: Record<Direction, { dx: number; dz: number }> = {
  north: { dx: 0, dz: -1 },
  south: { dx: 0, dz: 1 },
  west: { dx: -1, dz: 0 },
  east: { dx: 1, dz: 0 },
}

export interface Zone {
  name: string
  map_id: number
  screenshot: string
  screenshot_w: number
  screenshot_h: number
  tile_width: number
  tile_height: number
  // Placement de la grille de collision sur le screenshot, MESURÉ image par
  // image (scripts/build/fit-map-alignment.py), jamais déduit des dimensions :
  // scale_* = pas d'une tuile en pixels, origin_p* = pixel du coin haut-gauche
  // de la tuile (0,0). Les captures HGSS sont des rendus à caméra oblique
  // (~16 px de large pour ~12 px de haut par tuile) recadrés à la main avec
  // une marge variable de décor hors carte — d'où deux échelles distinctes ET
  // une origine non nulle. Toujours passer par `worldToPixel`.
  scale_x: number
  scale_y: number
  origin_px: number
  origin_py: number
  world_origin_x: number
  world_origin_y: number
  objects: ZoneObject[]
  warps: ZoneWarp[]
  // One char per tile, row-major: '#' solid, '.' floor, 'i' slippery ice,
  // 'w' surfable water, 'W' whirlpool, 'F' waterfall. Movement rules live in
  // canTraverse/terrainAt below.
  terrain: string
  // [localX, localZ, dirCode] — ledge tiles hopped over when moving in that
  // direction (landing one tile beyond); never stood on. See DIRECTION_BY_CODE.
  ledges: [number, number, number][]
  // Floors served when this zone is an elevator (its own warp says 4095):
  // spawn tile in each floor is that floor's warp back into the elevator.
  elevator_floors: { name: string; x: number; z: number }[]
  display_name: string | null
  is_outdoor: boolean
}

/** What the player can currently cross — grows over the adventure, one
 * flag per CS-Kanji exactly like the original HMs (水/渦/滝 respectively). */
export interface TraversalAbilities {
  surf: boolean // 水 — plain water
  whirlpool: boolean // 渦 — whirlpool tiles
  waterfall: boolean // 滝 — waterfall tiles
}

/** Bounding box shape shared with the lightweight zone list sent to the
 * client (see getZoneNames) — enough to test "is this world point inside
 * this zone" without needing the zone's full data (collision, objects...). */
export interface ZoneBounds {
  name: string
  is_outdoor: boolean
  world_origin_x: number
  world_origin_y: number
  tile_width: number
  tile_height: number
}

// Pure geometry helpers with no data dependency — safe to import from both
// server code and 'use client' components (unlike src/lib/zones.ts, which
// pulls in the multi-MB zone registry JSON at module scope).

/** Pixel du coin haut-gauche d'une tuile monde dans le screenshot de la zone.
 * Source unique du placement écran ↔ grille : tout ce qui se dessine sur la
 * carte (avatar, PNJ, suiveur, marqueurs) doit passer par ici, sinon les
 * calques divergent au premier changement d'alignement. */
export function worldToPixel(
  zone: Zone,
  worldX: number,
  worldZ: number
): { x: number; y: number } {
  return {
    x: zone.origin_px + (worldX - zone.world_origin_x) * zone.scale_x,
    y: zone.origin_py + (worldZ - zone.world_origin_y) * zone.scale_y,
  }
}

/** Terrain char at a world tile, or null when outside the zone. */
export function terrainAt(zone: Zone, worldX: number, worldZ: number): string | null {
  const localX = worldX - zone.world_origin_x
  const localZ = worldZ - zone.world_origin_y
  if (localX < 0 || localX >= zone.tile_width || localZ < 0 || localZ >= zone.tile_height) {
    return null
  }
  return zone.terrain[localZ * zone.tile_width + localX] ?? null
}

// Doors sit on tiles the collision grid marks solid (the warp check happens
// before the wall check in the real engine) — so known warp tiles are always
// steppable regardless of the grid.
function isWarpTile(zone: Zone, worldX: number, worldZ: number): boolean {
  return zone.warps.some(w => w.x === worldX && w.z === worldZ)
}

/** Traversable by any means the game ever allows (BFS audits, spawns). */
export function isWalkable(zone: Zone, worldX: number, worldZ: number): boolean {
  const t = terrainAt(zone, worldX, worldZ)
  if (t === null) return false
  if (t !== '#' && t !== 'F') return true
  return isWarpTile(zone, worldX, worldZ)
}

/** Traversable by the player *right now*, given their abilities:
 * floor and ice always; water with 水; whirlpools with 渦; waterfalls
 * with 滝 (each its own CS-Kanji, mirroring the original HM split). */
export function canTraverse(
  zone: Zone,
  worldX: number,
  worldZ: number,
  abilities: TraversalAbilities
): boolean {
  const t = terrainAt(zone, worldX, worldZ)
  if (t === null) return false
  if (t === '.' || t === 'i') return true
  if (t === 'w') return abilities.surf
  if (t === 'W') return abilities.whirlpool
  if (t === 'F') return abilities.waterfall
  return isWarpTile(zone, worldX, worldZ)
}

export function zoneCenter(zone: Zone): { world_x: number; world_z: number } {
  return {
    world_x: zone.world_origin_x + Math.floor(zone.tile_width / 2),
    world_z: zone.world_origin_y + Math.floor(zone.tile_height / 2),
  }
}

/** Nearest walkable tile to a world point, searched in growing rings (97 of
 * the 462 zones have a non-walkable geometric center, so any "spawn at the
 * center" fallback needs this). Returns null only if nothing walkable exists
 * within maxRadius. */
export function findNearestWalkable(
  zone: Zone,
  worldX: number,
  worldZ: number,
  maxRadius = 24,
  accept: (wx: number, wz: number) => boolean = (wx, wz) => isWalkable(zone, wx, wz)
): { world_x: number; world_z: number } | null {
  for (let r = 0; r <= maxRadius; r++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        // ring only, not the full square again
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue
        const wx = worldX + dx
        const wz = worldZ + dz
        if (accept(wx, wz)) return { world_x: wx, world_z: wz }
      }
    }
  }
  return null
}

/** Spawn point for a zone entered without a specific destination tile: the
 * nearest dry floor tile to the center, falling back to anything walkable
 * (sea routes are mostly water — a fresh spawn shouldn't need 水 to move). */
export function zoneSpawn(zone: Zone): { world_x: number; world_z: number } | null {
  const center = zoneCenter(zone)
  return (
    findNearestWalkable(zone, center.world_x, center.world_z, 24, (wx, wz) => {
      const t = terrainAt(zone, wx, wz)
      return t === '.' || t === 'i'
    }) ?? findNearestWalkable(zone, center.world_x, center.world_z)
  )
}

/** Direction code (0=N,1=S,2=W,3=E) of the ledge at a world tile, or null. */
export function ledgeDirAt(zone: Zone, worldX: number, worldZ: number): number | null {
  const localX = worldX - zone.world_origin_x
  const localZ = worldZ - zone.world_origin_y
  const hit = zone.ledges?.find(([lx, lz]) => lx === localX && lz === localZ)
  return hit ? hit[2] : null
}

/** The warp entry sitting on a world tile, if any. */
export function warpAt(zone: Zone, worldX: number, worldZ: number): ZoneWarp | undefined {
  return zone.warps.find(w => w.x === worldX && w.z === worldZ)
}

// MAP_EVERYWHERE is a meta-zone whose bounding box spans the entire outdoor
// matrix (it's the shared grid itself, not a real place) — it would swallow
// every out-of-bounds lookup if not excluded.
const NOT_A_REAL_ZONE = 'MAP_EVERYWHERE'

/** Is a world point inside a zone's bounding box? */
export function isWithinZoneBounds(zone: ZoneBounds, worldX: number, worldZ: number): boolean {
  return (
    worldX >= zone.world_origin_x &&
    worldX < zone.world_origin_x + zone.tile_width &&
    worldZ >= zone.world_origin_y &&
    worldZ < zone.world_origin_y + zone.tile_height
  )
}

/** C1 (revue jalon 1) : une écriture de position n'accepte que les zones
 * atteignables en UN mouvement depuis la zone courante — la zone elle-même,
 * une destination de warp (portes) ou d'ascenseur de la zone courante, ou une
 * zone extérieure CONTIGUË (le continuum outdoor : marcher hors du bord,
 * boîtes englobantes à ±1 tuile — le saut de corniche reste borné à t1 hors
 * zone). La méta-zone MAP_EVERYWHERE n'est jamais une destination. */
export function canReachZone(current: Zone, target: Zone): boolean {
  if (current.name === target.name) return true
  if (target.name === NOT_A_REAL_ZONE) return false
  if (current.warps.some(w => w.header === target.name)) return true
  if (current.elevator_floors.some(f => f.name === target.name)) return true
  if (current.is_outdoor && target.is_outdoor && current.name !== NOT_A_REAL_ZONE) {
    return (
      current.world_origin_x < target.world_origin_x + target.tile_width + 1 &&
      current.world_origin_x + current.tile_width + 1 > target.world_origin_x &&
      current.world_origin_y < target.world_origin_y + target.tile_height + 1 &&
      current.world_origin_y + current.tile_height + 1 > target.world_origin_y
    )
  }
  return false
}

/** Finds which outdoor zone (if any) contains a world point outside the
 * current zone — used to detect "walked off this route's edge into the
 * next one", since outdoor zones share one continuous coordinate space.
 * Interior zones are never candidates: each starts its own private matrix
 * at (0,0), so their bounding boxes are meaningless in world space and
 * would collide with each other and with real outdoor coordinates. */
export function findOutdoorZoneAt(
  zones: ZoneBounds[],
  worldX: number,
  worldZ: number,
  excludeName: string
): ZoneBounds | undefined {
  return zones.find(
    z =>
      z.is_outdoor &&
      z.name !== excludeName &&
      z.name !== NOT_A_REAL_ZONE &&
      worldX >= z.world_origin_x &&
      worldX < z.world_origin_x + z.tile_width &&
      worldZ >= z.world_origin_y &&
      worldZ < z.world_origin_y + z.tile_height
  )
}
