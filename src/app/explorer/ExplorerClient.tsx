'use client'

import { useState } from 'react'
import Link from 'next/link'

type KanjiRow = { id: string; character: string; jlpt_level: string | null }
type Status = 'unseen' | 'studied' | 'mastered'

const JLPT_FILTERS = ['All', 'N5', 'N4', 'N3', 'N2', 'N1'] as const
type Filter = typeof JLPT_FILTERS[number]

const STATUS_STYLE: Record<Status, string> = {
  unseen:   'bg-gray-700 text-gray-300 hover:bg-gray-600',
  studied:  'bg-blue-900 text-blue-200 hover:bg-blue-800',
  mastered: 'bg-amber-800 text-amber-200 hover:bg-amber-700',
}

interface Props {
  allKanji: KanjiRow[]
  statusMap: Record<string, Status>
}

export default function ExplorerClient({ allKanji, statusMap }: Props) {
  const [filter, setFilter] = useState<Filter>('All')

  const visible = filter === 'All'
    ? allKanji
    : allKanji.filter(k => k.jlpt_level === filter)

  const counts = {
    unseen:   allKanji.filter(k => !statusMap[k.id]).length,
    studied:  allKanji.filter(k => statusMap[k.id] === 'studied').length,
    mastered: allKanji.filter(k => statusMap[k.id] === 'mastered').length,
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Explorer</h1>
          <div className="flex gap-4 text-xs text-gray-400">
            <span><span className="inline-block w-2 h-2 rounded-full bg-gray-600 mr-1" />{counts.unseen} unseen</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-1" />{counts.studied} studied</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-amber-600 mr-1" />{counts.mastered} mastered</span>
          </div>
        </div>

        {/* JLPT filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {JLPT_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === f
                  ? 'bg-amber-400 text-gray-900 font-semibold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-500 self-center">{visible.length} kanji</span>
        </div>

        {/* Grid — min 5 cols mobile, 10 cols desktop */}
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(2.5rem, 1fr))' }}>
          {visible.map(k => {
            const status: Status = statusMap[k.id] ?? 'unseen'
            return (
              <Link
                key={k.id}
                href={`/kanji/${encodeURIComponent(k.id)}`}
                className={`aspect-square flex items-center justify-center text-base rounded transition-colors ${STATUS_STYLE[status]}`}
                title={k.jlpt_level ?? ''}
              >
                {k.character}
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
