'use server'

import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function submitReview(cardId: string, fsrsState: unknown, nextReviewAt: string, rating: number) {
  const userId = await requireUserId()

  const updated = await sql`
    update cards set fsrs_state = ${JSON.stringify(fsrsState)}, next_review_at = ${nextReviewAt}
    where id = ${cardId} and user_id = ${userId}
    returning id
  `
  // No row matched = cardId doesn't belong to this user (or doesn't exist) —
  // refuse to record a review against it instead of silently no-oping the
  // update and still inserting the review row.
  if (updated.length === 0) throw new Error('Card not found')

  await sql`
    insert into reviews (user_id, card_id, rating, new_fsrs_state)
    values (${userId}, ${cardId}, ${rating}, ${JSON.stringify(fsrsState)})
  `
}
