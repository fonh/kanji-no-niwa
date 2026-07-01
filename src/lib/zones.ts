import type { Zone } from '@/lib/zone-geometry'

export type { Zone, ZoneObject, ZoneWarp } from '@/lib/zone-geometry'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawRegistry = require('@/data/zone-registry.json') as { zones: Zone[] }

const zonesByName = new Map<string, Zone>(rawRegistry.zones.map(z => [z.name, z]))

export function getAllZones(): Zone[] {
  return rawRegistry.zones
}

export function getZoneNames(): { name: string; map_id: number }[] {
  return rawRegistry.zones.map(z => ({ name: z.name, map_id: z.map_id }))
}

export function getZoneByName(name: string): Zone | undefined {
  return zonesByName.get(name)
}
