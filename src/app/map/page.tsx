import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllZones, getZoneByName, getZoneNames } from '@/lib/zones'
import { getNpcsForZone } from '@/lib/npcs'
import MapClient, { type PlayerPos } from './MapClient'

const DEFAULT_ZONE = 'MAP_NEW_BARK'
const DEFAULT_POS: PlayerPos = { world_x: 695, world_z: 396 }

export default async function MapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: userRow } = await supabase
    .from('users')
    .select('map_zone, map_x, map_z')
    .eq('id', user.id)
    .single()

  const zoneName = userRow?.map_zone ?? DEFAULT_ZONE
  const zone = getZoneByName(zoneName) ?? getAllZones()[0]
  const initialPos: PlayerPos =
    userRow?.map_x != null && userRow?.map_z != null
      ? { world_x: userRow.map_x, world_z: userRow.map_z }
      : DEFAULT_POS

  return (
    <MapClient
      userId={user.id}
      zone={zone}
      npcs={getNpcsForZone(zone)}
      initialPos={initialPos}
      allZoneNames={getZoneNames()}
    />
  )
}
