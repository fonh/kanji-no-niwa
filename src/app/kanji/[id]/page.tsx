import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import QueueButton from './QueueButton'
import { MASTERED_STABILITY_DAYS } from '@/lib/start-menu'
import kanjiContent from '@/data/kanji-content.json'

interface Props {
  params: Promise<{ id: string }>
}

export default async function KanjiCardPage({ params }: Props) {
  const { id } = await params
  const character = decodeURIComponent(id)
  const session = await auth()
  if (!session?.user) redirect('/')
  const userId = session.user.id

  // None of these four depend on each other's results — fetch concurrently.
  // Cartes lues sur le schéma étendu item_type/item_id/facet (issue 05) —
  // les colonnes legacy kanji_id/card_type ne sont plus lues (issue 09).
  const [[kanji], componentEdges, userCards, [profile]] = await Promise.all([
    sql`
      select id, character, meanings, on_readings, kun_readings, jlpt_level, grade, stroke_count
      from kanji where id = ${character}
    `,
    sql`
      select c.component_id, k.character, k.jlpt_level
      from kanji_components c
      join kanji k on k.id = c.component_id
      where c.parent_id = ${character}
    `,
    sql`select item_id, facet, fsrs_state from cards where user_id = ${userId} and item_type = 'kanji'`,
    sql`select queued_kanji from users where id = ${userId}`,
  ])

  const content = (kanjiContent as Record<string, { etymology: string; mnemonic: string }>)[character]

  if (!kanji) notFound()

  const studiedSet = new Set(userCards.map(c => c.item_id))
  const queuedKanji: string[] = profile?.queued_kanji ?? []

  // Statut du kanji — maîtrisé = stabilité FSRS ≥ 14 j sur les DEUX facettes
  // (PRD § Système SRS, seuil abaissé de 30 à 14 le 2026-07-07)
  const sensStability = userCards.find(c => c.item_id === character && c.facet === 'sens')?.fsrs_state?.stability ?? 0
  const lectureStability = userCards.find(c => c.item_id === character && c.facet === 'lecture')?.fsrs_state?.stability ?? 0
  const status: 'unseen' | 'studied' | 'mastered' =
    sensStability >= MASTERED_STABILITY_DAYS && lectureStability >= MASTERED_STABILITY_DAYS ? 'mastered'
    : studiedSet.has(character) ? 'studied'
    : 'unseen'

  // Which component prerequisites are missing?
  const components = componentEdges.map(e => ({
    id: e.component_id,
    character: e.character ?? e.component_id,
    studied: studiedSet.has(e.component_id),
  }))
  const missingPrereqs = components.filter(c => !c.studied).map(c => c.character)
  const isQueued = queuedKanji.includes(character)

  const STATUS_LABEL = { unseen: 'Unseen', studied: 'Studied', mastered: 'Mastered' }
  const STATUS_COLOR = { unseen: 'text-gray-400 bg-gray-800', studied: 'text-blue-300 bg-blue-900', mastered: 'text-amber-300 bg-amber-900' }

  return (
    <main className="min-h-screen bg-gray-900 text-white px-4 py-10 max-w-xl mx-auto">
      {/* Retour à la grille du Kanjidex (menu START, rouvert sur 図鑑) —
          chaîne B « fiche → grille → carte » (PRD § Navigation des surfaces) */}
      <Link href="/map?menu=zukan" className="text-gray-500 text-sm hover:text-gray-300 mb-6 inline-block">← 図鑑</Link>

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
          missingPrereqs={missingPrereqs}
          isQueued={isQueued}
        />
      )}
    </main>
  )
}
