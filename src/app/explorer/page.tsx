import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExplorerClient from './ExplorerClient'

export default async function ExplorerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // All kanji (character + jlpt only — we don't need everything for the grid)
  const { data: allKanji } = await supabase
    .from('kanji')
    .select('id, character, jlpt_level')
    .order('jlpt_level', { ascending: true })

  // User's card states to derive Unseen/Studied/Mastered per kanji
  const { data: cards } = await supabase
    .from('cards')
    .select('kanji_id, card_type, fsrs_state')
    .eq('user_id', user.id)

  // Build status map: kanji_id → 'unseen' | 'studied' | 'mastered'
  // Mastered = both meaning and reading cards have stability >= 30
  const cardsByKanji = new Map<string, { meaning?: number; reading?: number }>()
  for (const card of cards ?? []) {
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
      allKanji={allKanji ?? []}
      statusMap={statusMap}
    />
  )
}
