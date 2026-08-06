import { getQuestStepsIndex } from '@/lib/content'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getZoneByName } from '@/lib/zones'
import { getNpcsForZone } from '@/lib/npcs'
import { getTrainersForZone } from '@/lib/trainers'
import { getPlayerState } from '@/lib/player-state'
import { filterVisibleNpcs, filterVisibleTrainers } from '@/lib/map-visibility'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  }

  const name = request.nextUrl.searchParams.get('name')
  if (!name) {
    return NextResponse.json({ error: 'missing name' }, { status: 400 })
  }

  const zone = getZoneByName(name)
  if (!zone) {
    return NextResponse.json({ error: 'zone not found' }, { status: 404 })
  }

  // Une entité dont les unlock_conditions ne sont pas remplies n'existe pas
  // sur la carte — filtrée ici, côté serveur, jamais dans MapClient.
  const playerState = await getPlayerState(session.user.id)

  return NextResponse.json({
    zone,
    npcs: filterVisibleNpcs(
      getNpcsForZone(zone, { state: playerState, ctx: { questSteps: getQuestStepsIndex(), now: new Date() } }),
      playerState
    ),
    trainers: filterVisibleTrainers(getTrainersForZone(zone), playerState),
  })
}
