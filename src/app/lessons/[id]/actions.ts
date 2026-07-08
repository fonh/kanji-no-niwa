'use server'

import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'

interface CardUpsert {
  kanjiId: string
  cardType: 'meaning' | 'reading'
  fsrsState: unknown
  nextReviewAt: string
}

export async function upsertLessonCards(cards: CardUpsert[]) {
  const userId = await requireUserId()

  for (const c of cards) {
    await sql`
      insert into cards (user_id, kanji_id, card_type, fsrs_state, next_review_at)
      values (${userId}, ${c.kanjiId}, ${c.cardType}, ${JSON.stringify(c.fsrsState)}, ${c.nextReviewAt})
      on conflict (user_id, kanji_id, card_type)
      do update set fsrs_state = excluded.fsrs_state, next_review_at = excluded.next_review_at
    `
  }
}
