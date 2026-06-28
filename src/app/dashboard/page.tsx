import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTrainerRank, getAvailableKanji, type KanjiInfo } from '@/lib/progression-engine'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('trainer_name, queued_kanji')
    .eq('id', user.id)
    .single()

  if (!profile?.trainer_name) redirect('/onboarding')

  // Count unique kanji that have at least one card (= studied)
  const { data: cards } = await supabase
    .from('cards')
    .select('kanji_id')
    .eq('user_id', user.id)

  const studiedKanjiIds = [...new Set((cards ?? []).map(c => c.kanji_id))]
  const studiedCount = studiedKanjiIds.length

  // Count due cards
  const now = new Date().toISOString()
  const { count: dueCount } = await supabase
    .from('cards')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review_at', now)

  // Available kanji counter (uses ProgressionEngine)
  const { data: allKanjiRows } = await supabase
    .from('kanji')
    .select('id, jlpt_level')

  const { data: componentEdges } = await supabase
    .from('kanji_components')
    .select('parent_id, component_id')

  const allKanji: KanjiInfo[] = (allKanjiRows ?? []).map(k => ({
    id: k.id,
    jlptLevel: k.jlpt_level as KanjiInfo['jlptLevel'],
  }))

  const componentGraph: Record<string, string[]> = {}
  for (const edge of componentEdges ?? []) {
    if (!componentGraph[edge.parent_id]) componentGraph[edge.parent_id] = []
    componentGraph[edge.parent_id].push(edge.component_id)
  }

  const availableKanji = getAvailableKanji(studiedKanjiIds, allKanji, componentGraph)

  const rank = getTrainerRank(studiedCount)
  const expPercent = rank.level === 25
    ? 100
    : Math.round(((studiedCount - rank.minStudied) / (rank.maxStudied - rank.minStudied + 1)) * 100)

  return (
    <main className="min-h-screen bg-gray-900 text-white px-4 py-10 max-w-md mx-auto">
      {/* Nav */}
      <nav className="flex gap-4 justify-end mb-8 text-sm">
        <Link href="/explorer" className="text-gray-400 hover:text-white transition-colors">Explorer</Link>
      </nav>
      {/* Hero zone */}
      <section className="mb-8 text-center">
        <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
          🧑
        </div>
        <h2 className="text-xl font-bold">{profile.trainer_name}</h2>
        <p className="text-amber-400 text-sm">{rank.rank} — Level {rank.level}</p>
        <p className="text-gray-500 text-xs mt-1">{rank.character}</p>

        {/* EXP bar */}
        <div className="mt-3 h-2 bg-gray-700 rounded-full">
          <div
            className="h-2 bg-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${expPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {studiedCount} / {rank.maxStudied + 1} kanji to level {rank.level + 1}
        </p>
      </section>

      {/* Action zone */}
      <section className="mb-8">
        <Link
          href="/study"
          className="block w-full py-4 rounded-2xl bg-amber-400 text-gray-900 font-bold text-center text-lg hover:bg-amber-300 transition-colors"
        >
          Start Session
        </Link>
        <p className="text-center text-gray-400 text-sm mt-2">
          {dueCount ?? 0} card{dueCount !== 1 ? 's' : ''} due today
        </p>
        <p className="text-center text-gray-600 text-xs mt-1">
          {availableKanji.length} kanji available to study
        </p>
      </section>

      {/* Stats zone */}
      <section className="bg-gray-800 rounded-2xl p-6">
        <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-4">Stats</h3>
        <div className="flex justify-between">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{studiedCount}</p>
            <p className="text-xs text-gray-400 mt-1">kanji studied</p>
            <p className="text-xs text-gray-600">/ 2136</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-xs text-gray-400 mt-1">kanji mastered</p>
            <p className="text-xs text-gray-600">/ 2136</p>
          </div>
        </div>
      </section>
    </main>
  )
}
