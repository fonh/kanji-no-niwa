import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { getAllZones, getZoneByName, getZoneNames } from '@/lib/zones'
import { getNpcsForZone } from '@/lib/npcs'
import { getTrainersForZone } from '@/lib/trainers'
import { parseProgress } from '@/lib/obstacles'
import { getPlayerState } from '@/lib/player-state'
import { filterVisibleNpcs, filterVisibleTrainers } from '@/lib/map-visibility'
import { avatarOverworldSprite, isAvatar, isOnboarded } from '@/lib/onboarding'
import MapClient, { type PlayerPos } from './MapClient'

export default async function MapPage() {
  const session = await auth()
  if (!session?.user) redirect('/')
  const userId = session.user.id

  // Position + progression : user_map_state via la couche PlayerState ;
  // le blob MapProgress legacy (tiroir dev, obstacles) reste sur users
  // jusqu'à l'issue 10.
  const [playerState, [userRow]] = await Promise.all([
    getPlayerState(userId),
    sql`select map_progress, trainer_name, avatar from users where id = ${userId}`,
  ])

  // Nouveau compte (ou compte d'avant l'issue 04, sans avatar) : la carte
  // n'existe pas encore pour lui — flux d'ouverture d'abord.
  if (!isOnboarded(userRow)) redirect('/onboarding')

  const zone = getZoneByName(playerState.current_zone) ?? getAllZones()[0]
  const initialPos: PlayerPos = { world_x: playerState.avatar_x, world_z: playerState.avatar_y }

  return (
    <MapClient
      zone={zone}
      npcs={filterVisibleNpcs(getNpcsForZone(zone), playerState)}
      trainers={filterVisibleTrainers(getTrainersForZone(zone), playerState)}
      initialPos={initialPos}
      initialProgress={parseProgress(userRow?.map_progress)}
      allZoneNames={getZoneNames()}
      playerSpriteUrl={isAvatar(userRow.avatar) ? avatarOverworldSprite(userRow.avatar) : undefined}
    />
  )
}
