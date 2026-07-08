'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from './actions'
import { fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs'

const RATING_LABELS: { label: string; rating: Rating; style: string }[] = [
  { label: 'Again', rating: Rating.Again, style: 'bg-red-600 hover:bg-red-500' },
  { label: 'Hard',  rating: Rating.Hard,  style: 'bg-orange-500 hover:bg-orange-400' },
  { label: 'Good',  rating: Rating.Good,  style: 'bg-green-600 hover:bg-green-500' },
  { label: 'Easy',  rating: Rating.Easy,  style: 'bg-blue-600 hover:bg-blue-500' },
]

interface KanjiData {
  character: string
  meanings: string[]
  on_readings: string[]
  kun_readings: string[]
  etymology?: string | null
  mnemonic?: string | null
}

interface DueCard {
  id: string
  kanji_id: string
  card_type: 'meaning' | 'reading'
  fsrs_state: Card
  kanji: KanjiData
}

interface Props {
  cards: DueCard[]
}

export default function StudyClient({ cards }: Props) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const f = fsrs(generatorParameters())

  const current = cards[index]

  const handleReveal = () => setRevealed(true)

  const handleRate = async (rating: Rating) => {
    if (!current) return
    const now = new Date()
    const item = f.next(current.fsrs_state, now, rating as Grade)
    const newCard = item.card

    await submitReview(current.id, newCard, newCard.due.toISOString(), rating)

    setReviewed(r => r + 1)
    setRevealed(false)
    setIndex(i => i + 1)
  }

  // Session complete
  if (index >= cards.length) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Session complete</h2>
          <p className="text-gray-400 mb-8">{reviewed} card{reviewed !== 1 ? 's' : ''} reviewed</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 rounded-full bg-amber-400 text-gray-900 font-semibold hover:bg-amber-300 transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </main>
    )
  }

  if (!cards.length) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
        <h2 className="text-xl font-bold mb-4">No cards due</h2>
        <button onClick={() => router.push('/dashboard')} className="text-amber-400 underline">Back to dashboard</button>
      </main>
    )
  }

  const prompt = current.card_type === 'meaning'
    ? `What does ${current.kanji.character} mean?`
    : `How do you read ${current.kanji.character}?`

  const answer = current.card_type === 'meaning'
    ? (current.kanji.meanings ?? []).join(', ')
    : (current.kanji.on_readings ?? []).join(', ') + (current.kanji.kun_readings?.length ? ' / ' + current.kanji.kun_readings.join(', ') : '')

  const progress = Math.round((index / cards.length) * 100)

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-gray-700">
        <div className="h-1 bg-amber-400 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 relative flex flex-col">
        {/* Upper right: kanji (opposing Pokémon position) */}
        <div className="flex justify-end pr-12 pt-12">
          <span className="text-9xl font-bold text-white drop-shadow-lg">{current.kanji.character}</span>
        </div>

        {/* Lower left: trainer silhouette */}
        <div className="flex justify-start pl-12 pb-4">
          <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-4xl opacity-60">?</div>
        </div>
      </div>

      {/* Dialogue box */}
      <div className="bg-gray-800 border-t-2 border-white p-4 pb-8">
        <p className="text-white text-base mb-4">{prompt}</p>
        {!revealed ? (
          <button
            onClick={handleReveal}
            className="w-full py-3 rounded-lg border border-white text-white hover:bg-gray-700 transition-colors"
          >
            Reveal answer
          </button>
        ) : (
          <>
            <p className="text-amber-400 font-bold text-lg mb-2">→ {answer}</p>
            {current.kanji.etymology && (
              <p className="text-gray-400 text-sm mb-1 italic">
                {current.kanji.etymology.split('.')[0].trim()}.
              </p>
            )}
            {current.kanji.mnemonic && (
              <p className="text-gray-300 text-sm mb-4">{current.kanji.mnemonic}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {RATING_LABELS.map(({ label, rating, style }) => (
                <button
                  key={label}
                  onClick={() => handleRate(rating)}
                  className={`py-3 rounded-lg text-white font-semibold transition-colors ${style}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
