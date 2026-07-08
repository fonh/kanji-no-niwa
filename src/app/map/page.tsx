import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { getAllZones, getZoneByName, getZoneNames } from '@/lib/zones'
import { getNpcsForZone } from '@/lib/npcs'
import { getTrainersForZone } from '@/lib/trainers'
import { parseProgress } from '@/lib/obstacles'
import MapClient, { type PlayerPos } from './MapClient'

const DEFAULT_ZONE = 'MAP_NEW_BARK'
const DEFAULT_POS: PlayerPos = { world_x: 695, world_z: 396 }

export default async function MapPage() {
  const session = await auth()
  if (!session?.user) redirect('/')
  const userId = session.user.id

  const [userRow] = await sql`
    select map_zone, map_x, map_z, map_progress from users where id = ${userId}
  `

  const zoneName = userRow?.map_zone ?? DEFAULT_ZONE
  const zone = getZoneByName(zoneName) ?? getAllZones()[0]
  const initialPos: PlayerPos =
    userRow?.map_x != null && userRow?.map_z != null
      ? { world_x: userRow.map_x, world_z: userRow.map_z }
      : DEFAULT_POS

  return (
    <MapClient
      zone={zone}
      npcs={getNpcsForZone(zone)}
      trainers={getTrainersForZone(zone)}
      initialPos={initialPos}
      initialProgress={parseProgress(userRow?.map_progress)}
      allZoneNames={getZoneNames()}
    />
  )
}
