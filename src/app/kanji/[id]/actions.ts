'use server'

import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function toggleQueuedKanji(kanjiId: string, currentlyQueued: boolean) {
  const userId = await requireUserId()

  const [profile] = await sql`select queued_kanji from users where id = ${userId}`
  const current: string[] = profile?.queued_kanji ?? []
  const updated = currentlyQueued ? current.filter(k => k !== kanjiId) : [...current, kanjiId]

  await sql`update users set queued_kanji = ${updated} where id = ${userId}`
}
