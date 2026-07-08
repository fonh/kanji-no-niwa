import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import ExplorerClient from './ExplorerClient'

export default async function ExplorerPage() {
  const session = await auth()
  if (!session?.user) redirect('/')
  const userId = session.user.id

  const [allKanji, cards] = await Promise.all([
    // All kanji (character + jlpt only — we don't need everything for the grid)
    sql`select id, character, jlpt_level from kanji order by jlpt_level asc`,
    // User's card states to derive Unseen/Studied/Mastered per kanji
    sql`select kanji_id, card_type, fsrs_state from cards where user_id = ${userId}`,
  ])

  // Build status map: kanji_id → 'unseen' | 'studied' | 'mastered'
  // Mastered = both meaning and reading cards have stability >= 30
  const cardsByKanji = new Map<string, { meaning?: number; reading?: number }>()
  for (const card of cards) {
    if (!cardsByKanji.has(card.kanji_id)) cardsByKanji.set(card.kanji_id, {})
    const stability = (card.fsrs_state as { stability?: number })?.stability ?? 0
    const entry = cardsByKanji.get(card.kanji_id)!
    if (card.card_type === 'meaning') entry.meaning = stability
    else entry.reading = stability
  }

  const statusMap: Record<string, 'unseen' | 'studied' | 'mastered'> = {}
  for (const [id, entry] of cardsByKanji) {
    const mastered = (entry.meaning ?? 0) >= 30 && (entry.reading ?? 0) >= 30
    statusMap[id] = mastered ? 'mastered' : 'studied'
  }

  return (
    <ExplorerClient
      allKanji={allKanji as { id: string; character: string; jlpt_level: string | null }[]}
      statusMap={statusMap}
    />
  )
}
