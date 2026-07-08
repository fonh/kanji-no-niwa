import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import StudyClient from './StudyClient'
import kanjiContent from '@/data/kanji-content.json'

export default async function StudyPage() {
  const session = await auth()
  if (!session?.user) redirect('/')
  const userId = session.user.id

  // Load cards due now, joined with kanji for display
  const rawCards = await sql`
    select
      c.id, c.kanji_id, c.card_type, c.fsrs_state,
      k.character, k.meanings, k.on_readings, k.kun_readings
    from cards c
    join kanji k on k.id = c.kanji_id
    where c.user_id = ${userId} and c.next_review_at <= now()
    order by c.next_review_at asc
  `

  const allContent = kanjiContent as Record<string, { etymology: string; mnemonic: string }>

  const dueCards = rawCards.map(c => ({
    id: c.id,
    kanji_id: c.kanji_id,
    card_type: c.card_type,
    fsrs_state: c.fsrs_state,
    kanji: {
      character: c.character,
      meanings: c.meanings,
      on_readings: c.on_readings,
      kun_readings: c.kun_readings,
      ...allContent[c.character ?? ''],
    },
  }))

  return <StudyClient cards={dueCards} />
}
