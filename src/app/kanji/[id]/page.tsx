import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import QueueButton from './QueueButton'
import kanjiContent from '@/data/kanji-content.json'

interface Props {
  params: Promise<{ id: string }>
}

export default async function KanjiCardPage({ params }: Props) {
  const { id } = await params
  const character = decodeURIComponent(id)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: kanji } = await supabase
    .from('kanji')
    .select('id, character, meanings, on_readings, kun_readings, jlpt_level, grade, stroke_count')
    .eq('id', character)
    .single()

  const content = (kanjiContent as Record<string, { etymology: string; mnemonic: string }>)[character]

  if (!kanji) notFound()

  // Components of this kanji
  const { data: componentEdges } = await supabase
    .from('kanji_components')
    .select('component_id, kanji!kanji_components_component_id_fkey(id, character, jlpt_level)')
    .eq('parent_id', character)

  // User's studied set and queued kanji
  const { data: userCards } = await supabase
    .from('cards')
    .select('kanji_id, card_type, fsrs_state')
    .eq('user_id', user.id)

  const { data: profile } = await supabase
    .from('users')
    .select('queued_kanji')
    .eq('id', user.id)
    .single()

  const studiedSet = new Set((userCards ?? []).map(c => c.kanji_id))
  const queuedKanji: string[] = profile?.queued_kanji ?? []

  // Derive status of this kanji
  const meaningStability = (userCards ?? []).find(c => c.kanji_id === character && c.card_type === 'meaning')?.fsrs_state?.stability ?? 0
  const readingStability = (userCards ?? []).find(c => c.kanji_id === character && c.card_type === 'reading')?.fsrs_state?.stability ?? 0
  const status: 'unseen' | 'studied' | 'mastered' =
    meaningStability >= 30 && readingStability >= 30 ? 'mastered'
    : studiedSet.has(character) ? 'studied'
    : 'unseen'

  // Which component prerequisites are missing?
  const components = (componentEdges ?? []).map(e => ({
    id: e.component_id,
    character: (Array.isArray(e.kanji) ? e.kanji[0] : e.kanji)?.character ?? e.component_id,
    studied: studiedSet.has(e.component_id),
  }))
  const missingPrereqs = components.filter(c => !c.studied).map(c => c.character)
  const isQueued = queuedKanji.includes(character)

  const STATUS_LABEL = { unseen: 'Unseen', studied: 'Studied', mastered: 'Mastered' }
  const STATUS_COLOR = { unseen: 'text-gray-400 bg-gray-800', studied: 'text-blue-300 bg-blue-900', mastered: 'text-amber-300 bg-amber-900' }

  return (
    <main className="min-h-screen bg-gray-900 text-white px-4 py-10 max-w-xl mx-auto">
      {/* Back */}
      <Link href="/explorer" className="text-gray-500 text-sm hover:text-gray-300 mb-6 inline-block">← Explorer</Link>

      {/* Hero */}
      <div className="text-center mb-8">
        <div className="text-9xl font-bold mb-4" style={{ fontFamily: 'Noto Serif JP, serif' }}>{kanji.character}</div>
        <span className={`inline-block text-xs px-3 py-1 rounded-full font-semibold ${STATUS_COLOR[status]}`}>
          {STATUS_LABEL[status]}
        </span>
        {kanji.jlpt_level && (
          <span className="ml-2 text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-400">{kanji.jlpt_level}</span>
        )}
        {kanji.grade && (
          <span className="ml-2 text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-400">Grade {kanji.grade}</span>
        )}
      </div>

      {/* Meanings & readings */}
      <section className="bg-gray-800 rounded-2xl p-6 mb-4">
        <p className="text-lg font-semibold mb-1">{(kanji.meanings as string[]).join(', ')}</p>
        {(kanji.on_readings as string[]).length > 0 && (
          <p className="text-sm text-gray-400">On: <span className="text-white">{(kanji.on_readings as string[]).join('、')}</span></p>
        )}
        {(kanji.kun_readings as string[]).length > 0 && (
          <p className="text-sm text-gray-400">Kun: <span className="text-white">{(kanji.kun_readings as string[]).join('、')}</span></p>
        )}
        {kanji.stroke_count && (
          <p className="text-sm text-gray-500 mt-2">{kanji.stroke_count} strokes</p>
        )}
      </section>

      {/* Components */}
      {components.length > 0 && (
        <section className="bg-gray-800 rounded-2xl p-6 mb-4">
          <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-3">Components</h2>
          <div className="flex gap-3 flex-wrap">
            {components.map(c => (
              <Link
                key={c.id}
                href={`/kanji/${encodeURIComponent(c.id)}`}
                className={`flex flex-col items-center w-12 h-14 justify-center rounded-lg text-2xl transition-colors ${
                  c.studied ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                }`}
              >
                {c.character}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-gray-800 rounded-2xl p-6 mb-4">
        <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-2">Etymology</h2>
        <p className={content?.etymology ? 'text-gray-300' : 'text-gray-600 italic'}>{content?.etymology ?? '—'}</p>
      </section>
      <section className="bg-gray-800 rounded-2xl p-6 mb-4">
        <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-2">Mnemonic</h2>
        <p className={content?.mnemonic ? 'text-gray-300' : 'text-gray-600 italic'}>{content?.mnemonic ?? '—'}</p>
      </section>

      {/* Vocabulary (placeholder until Slice 5) */}
      <section className="bg-gray-800 rounded-2xl p-6 mb-6">
        <h2 className="text-xs text-gray-400 uppercase tracking-widest mb-2">Vocabulary</h2>
        <p className="text-gray-600 text-sm italic">Unlocked in a later slice.</p>
      </section>

      {/* Queue for lesson button */}
      {status === 'unseen' && (
        <QueueButton
          kanjiId={character}
          userId={user.id}
          missingPrereqs={missingPrereqs}
          isQueued={isQueued}
        />
      )}
    </main>
  )
}
