import { NextRequest, NextResponse } from 'next/server'
import { getZoneByName } from '@/lib/zones'
import { getNpcsForZone } from '@/lib/npcs'
import { getTrainersForZone } from '@/lib/trainers'

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')
  if (!name) {
    return NextResponse.json({ error: 'missing name' }, { status: 400 })
  }

  const zone = getZoneByName(name)
  if (!zone) {
    return NextResponse.json({ error: 'zone not found' }, { status: 404 })
  }

  return NextResponse.json({
    zone,
    npcs: getNpcsForZone(zone),
    trainers: getTrainersForZone(zone),
  })
}
