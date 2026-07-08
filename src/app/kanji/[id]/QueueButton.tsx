'use client'

import { useState } from 'react'
import { toggleQueuedKanji } from './actions'

interface Props {
  kanjiId: string
  missingPrereqs: string[]
  isQueued: boolean
}

export default function QueueButton({ kanjiId, missingPrereqs, isQueued: initialQueued }: Props) {
  const [queued, setQueued] = useState(initialQueued)
  const [loading, setLoading] = useState(false)

  if (missingPrereqs.length > 0) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 text-sm">
        <p className="text-amber-400 font-semibold mb-2">Prerequisites missing</p>
        <p className="text-gray-400 mb-3">Study these components first:</p>
        <div className="flex gap-2 flex-wrap">
          {missingPrereqs.map(c => (
            <span key={c} className="text-2xl bg-gray-700 px-3 py-1 rounded-lg">{c}</span>
          ))}
        </div>
      </div>
    )
  }

  const handleToggle = async () => {
    setLoading(true)
    await toggleQueuedKanji(kanjiId, queued)
    setQueued(!queued)
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`w-full py-3 rounded-full font-semibold transition-colors disabled:opacity-40 ${
        queued
          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          : 'bg-amber-400 text-gray-900 hover:bg-amber-300'
      }`}
    >
      {loading ? '…' : queued ? 'Remove from queue' : 'Queue for lesson'}
    </button>
  )
}
