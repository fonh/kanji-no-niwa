import type { Zone, ZoneBounds } from '@/lib/zone-geometry'
import { beatCountForMapName } from '@/lib/story-beats'
import { getZoneRegistryNames } from '@/lib/content'
import { zoneSlugForMapName, zoneSlugForMapNameOrParent } from '@/lib/zone-slug'

export type { Zone, ZoneObject, ZoneWarp, ZoneBounds } from '@/lib/zone-geometry'

// Chemin relatif (pas l'alias @/) : résolu par Next comme par vitest.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawRegistry = require('../data/zone-registry.json') as { zones: Zone[] }

// L'ancienne liste MISATTRIBUTED_SCREENSHOTS vivait ici : 15 intérieurs du
// jalon 1 servis sans capture, au motif que « l'art recyclé ment sur les murs,
// le joueur marcherait à travers des murs peints ». Le diagnostic était juste,
// la cause non : ces captures ne mentaient pas, c'est la grille de collision
// qui était mal POSÉE dessus (voir ADR-0006). Une fois l'alignement mesuré,
// les 15 se recalent toutes proprement (scores 0.82 à 1.64, contre 0.33 à 1.40
// avec l'ancienne formule) — et les maisons ont enfin un décor plutôt qu'une
// grille de collision nue.
//
// Le tri ne se fait plus par liste écrite à la main mais par mesure, dans
// build-zone-registry.py : une capture qui ne se cale sur aucune grille, ou
// qui ne couvre qu'un bout de la zone, sort du registre avec `screenshot: ''`
// et MapClient bascule alors sur son rendu CollisionCanvas.

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
