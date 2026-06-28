import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudyClient from './StudyClient'
import kanjiContent from '@/data/kanji-content.json'

export default async function StudyPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Load cards due now, joined with kanji for display
  const now = new Date().toISOString()
  const { data: rawCards } = await supabase
    .from('cards')
    .select('id, kanji_id, card_type, fsrs_state, kanji(character, meanings, on_readings, kun_readings)')
    .eq('user_id', user.id)
    .lte('next_review_at', now)
    .order('next_review_at', { ascending: true })

  const allContent = kanjiContent as Record<string, { etymology: string; mnemonic: string }>

  // Supabase returns joined rows as arrays; normalise to a single object and merge content
  const dueCards = (rawCards ?? []).map(c => {
    const kanji = Array.isArray(c.kanji) ? c.kanji[0] : c.kanji
    return {
      ...c,
      kanji: { ...kanji, ...allContent[kanji?.character ?? ''] },
    }
  })

  return <StudyClient cards={dueCards} userId={user.id} />
}
