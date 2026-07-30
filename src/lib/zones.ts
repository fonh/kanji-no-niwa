import type { Zone, ZoneBounds } from '@/lib/zone-geometry'
import { beatCountForMapName } from '@/lib/story-beats'
import { getZoneRegistryNames } from '@/lib/content'
import { zoneSlugForMapName, zoneSlugForMapNameOrParent } from '@/lib/zone-slug'

export type { Zone, ZoneObject, ZoneWarp, ZoneBounds } from '@/lib/zone-geometry'

// Chemin relatif (pas l'alias @/) : résolu par Next comme par vitest.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawRegistry = require('../data/zone-registry.json') as { zones: Zone[] }

// Screenshots mal attribués (issue 10, zones du jalon 1) : le pipeline
// d'extraction a recyclé l'art d'une AUTRE zone (extérieur de la ville,
// autre pièce) pour ces intérieurs — la grille de collision ne correspond
// pas à l'image (vérifié : Mr. Pokémon house ≠ Player House 1F), le joueur
// marcherait à travers des murs peints. Servis sans screenshot → le repli
// CollisionCanvas de MapClient (jouable, fidèle à la collision) prend le
// relais. Liste à résorber à la passe assets (capturer les vrais intérieurs).
const MISATTRIBUTED_SCREENSHOTS = new Set([
  'MAP_NEW_BARK_PLAYER_HOUSE_1F',
  'MAP_NEW_BARK_PLAYER_HOUSE_2F',
  'MAP_NEW_BARK_RIVAL_HOUSE_1F',
  'MAP_NEW_BARK_RIVAL_HOUSE_2F',
  'MAP_NEW_BARK_SOUTHWEST_HOUSE',
  'MAP_NEW_BARK_ELMS_LAB_2F',
  'MAP_CHERRYGROVE_POKECENTER_1F',
  'MAP_CHERRYGROVE_POKECENTER_B1F',
  'MAP_CHERRYGROVE_POKEMART',
  'MAP_CHERRYGROVE_GUIDE_GENT_HOUSE',
  'MAP_CHERRYGROVE_SOUTHWEST_HOUSE',
  'MAP_CHERRYGROVE_SOUTHEAST_HOUSE',
  'MAP_ROUTE_29_ROUTE_46_GATEHOUSE',
  'MAP_ROUTE_30_APRICORN_HOUSE',
  'MAP_ROUTE_30_MR_POKEMON_HOUSE',
])

// Patch appliqué une fois au chargement du module (le registre est immuable
// pendant la vie du process, comme le cache de src/lib/content.ts).
for (const zone of rawRegistry.zones) {
  if (MISATTRIBUTED_SCREENSHOTS.has(zone.name)) zone.screenshot = ''
}

const zonesByName = new Map<string, Zone>(rawRegistry.zones.map(z => [z.name, z]))

export function getAllZones(): Zone[] {
  return rawRegistry.zones
}

export interface ZoneListEntry extends ZoneBounds {
  map_id: number
  display_name: string | null
  // Nom VO jp de la zone elle-même (content/zone-registry-names.json) — le
  // bandeau d'entrée de zone (issue 10). null pour les intérieurs : ils
  // n'ont pas de nom propre dans le contenu, et le PRD interdit d'afficher
  // les display_name français du registre ROM.
  jp_name: string | null
  // Libellé toujours affichable : nom propre jp → nom jp de la zone
  // extérieure de rattachement (le labo « appartient » à ワカバタウン) →
  // repli latin prettifié (dev, zones hors contenu).
  jp_label: string
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

function latinFallback(mapName: string): string {
  return mapName.replace(/^MAP_/, '').replace(/_/g, ' ')
}

// Mémoïsé : 462 zones × heuristique de slug — calculé une fois, le registre
// et les noms de contenu sont immuables pendant la vie du process.
let zoneNamesCache: ZoneListEntry[] | null = null

export function getZoneNames(): ZoneListEntry[] {
  if (zoneNamesCache) return zoneNamesCache
  const names = getZoneRegistryNames()
  const slugs = Object.keys(names)
  zoneNamesCache = rawRegistry.zones.map(z => {
    const ownSlug = zoneSlugForMapName(z.name, slugs)
    const parentSlug = ownSlug ?? zoneSlugForMapNameOrParent(z.name, slugs)
    return {
      name: z.name,
      map_id: z.map_id,
      display_name: z.display_name,
      jp_name: ownSlug ? names[ownSlug].jp : null,
      jp_label: parentSlug ? names[parentSlug].jp : latinFallback(z.name),
      is_outdoor: z.is_outdoor,
      world_origin_x: z.world_origin_x,
      world_origin_y: z.world_origin_y,
      tile_width: z.tile_width,
      tile_height: z.tile_height,
      screenshot: z.screenshot,
      screenshot_w: z.screenshot_w,
      screenshot_h: z.screenshot_h,
      beat_count: beatCountForMapName(z.name),
    }
  })
  return zoneNamesCache
}

export function getZoneByName(name: string): Zone | undefined {
  return zonesByName.get(name)
}
