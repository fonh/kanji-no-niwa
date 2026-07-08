'use server'

import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function saveMapProgress(progress: unknown) {
  const userId = await requireUserId()
  await sql`update users set map_progress = ${JSON.stringify(progress)} where id = ${userId}`
}

export async function saveMapPosition(zoneName: string, x: number, z: number) {
  const userId = await requireUserId()
  await sql`update users set map_zone = ${zoneName}, map_x = ${x}, map_z = ${z} where id = ${userId}`
}
