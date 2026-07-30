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
import { followerSpriteForCompanion } from '@/lib/npc-sprites'
import MapClient, { type PlayerPos } from './MapClient'
import DailyLoop from './DailyLoop'
import StartMenu, { type StartMenuScreen } from '@/app/menu/StartMenu'

const START_MENU_SCREENS: StartMenuScreen[] = ['zukan', 'lessons', 'bag', 'journal']

interface Props {
  searchParams: Promise<{ menu?: string }>
}

export default async function MapPage({ searchParams }: Props) {
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

  // Retour d'une fiche Kanjidex (/map?menu=zukan) : le menu START se rouvre
  // directement sur l'écran demandé (issue 09).
  const { menu } = await searchParams
  const initialMenuScreen = START_MENU_SCREENS.find(s => s === menu) ?? null

  return (
    <>
      <MapClient
        zone={zone}
        npcs={filterVisibleNpcs(getNpcsForZone(zone), playerState)}
        trainers={filterVisibleTrainers(getTrainersForZone(zone), playerState)}
        initialPos={initialPos}
        initialProgress={parseProgress(userRow?.map_progress)}
        allZoneNames={getZoneNames()}
        playerSpriteUrl={isAvatar(userRow.avatar) ? avatarOverworldSprite(userRow.avatar) : undefined}
        followerSpriteUrl={followerSpriteForCompanion(playerState.companion_id)}
      />
      {/* Boucle quotidienne (issue 06) : appel du mentor au premier lancement
          du jour + badge Pokégear — overlay dédié, MapClient inchangé */}
      <DailyLoop />
      {/* Menu START (issue 09) : bouton START/SELECT centre bas + overlay —
          même patron, MapClient inchangé */}
      <StartMenu initialScreen={initialMenuScreen} />
    </>
  )
}
