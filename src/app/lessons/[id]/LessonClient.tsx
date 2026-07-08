'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertLessonCards } from './actions'
import { createEmptyCard, fsrs, generatorParameters, Rating, type Grade } from 'ts-fsrs'

// FSRS rating values: 1=Again, 2=Hard, 3=Good, 4=Easy
const RATING_LABELS: { label: string; rating: Rating; style: string }[] = [
  { label: 'Again', rating: Rating.Again, style: 'bg-red-600 hover:bg-red-500' },
  { label: 'Hard',  rating: Rating.Hard,  style: 'bg-orange-500 hover:bg-orange-400' },
  { label: 'Good',  rating: Rating.Good,  style: 'bg-green-600 hover:bg-green-500' },
  { label: 'Easy',  rating: Rating.Easy,  style: 'bg-blue-600 hover:bg-blue-500' },
]

interface QuizQuestion {
  id: string
  kanji: string
  type: 'meaning' | 'reading'
  prompt: string
  answer: string
}

export interface Lesson {
  id: string
  title: string
  body_markdown: string
  johto_zone: string
  kanji_ids: string[]
  quiz_questions: QuizQuestion[]
}

type Phase = 'reading' | 'quiz' | 'done'

interface Props {
  lesson: Lesson
}

export default function LessonClient({ lesson }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('reading')
  const [quizIndex, setQuizIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [ratings, setRatings] = useState<{ questionId: string; kanjiId: string; cardType: 'meaning' | 'reading'; rating: Rating }[]>([])
  const [saving, setSaving] = useState(false)

  const questions: QuizQuestion[] = lesson.quiz_questions ?? []
  const currentQ = questions[quizIndex]

  const handleReveal = () => setRevealed(true)

  const handleRate = (rating: Rating) => {
    if (!currentQ) return
    setRatings(prev => [...prev, {
      questionId: currentQ.id,
      kanjiId: currentQ.kanji,
      cardType: currentQ.type,
      rating,
    }])

    if (quizIndex + 1 < questions.length) {
      setQuizIndex(i => i + 1)
      setRevealed(false)
    } else {
      handleQuizComplete([...ratings, { questionId: currentQ.id, kanjiId: currentQ.kanji, cardType: currentQ.type, rating }])
    }
  }

  const handleQuizComplete = async (finalRatings: typeof ratings) => {
    setSaving(true)
    const f = fsrs(generatorParameters())
    const now = new Date()

    // Create FSRS cards for each unique kanji×cardType pair
    const cardsToSave = lesson.kanji_ids.flatMap(kanjiId =>
      (['meaning', 'reading'] as const).map(cardType => {
        const quizRating = finalRatings.find(r => r.kanjiId === kanjiId && r.cardType === cardType)
        const rating = quizRating?.rating ?? Rating.Good

        const emptyCard = createEmptyCard(now)
        const item = f.next(emptyCard, now, rating as Grade)
        const fsrsState = item.card

        return {
          kanjiId,
          cardType,
          fsrsState,
          nextReviewAt: fsrsState.due.toISOString(),
        }
      })
    )

    await upsertLessonCards(cardsToSave)

    setSaving(false)
    setPhase('done')
  }

  if (phase === 'reading') {
    return (
      <main className="min-h-screen bg-gray-900 text-white px-4 py-10 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-amber-400">{lesson.title}</h1>
        {/* Minimal markdown render: split on double newlines for paragraphs */}
        <div className="prose prose-invert max-w-none mb-12 space-y-4">
          {lesson.body_markdown.split('\n\n').map((block, i) => {
            if (block.startsWith('# ')) return <h2 key={i} className="text-xl font-bold">{block.slice(2)}</h2>
            if (block.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-amber-400 pl-4 text-gray-300 italic">{block.slice(2)}</blockquote>
            // Bold (**text**)
            const rendered = block.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
            return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />
          })}
        </div>
        <button
          onClick={() => setPhase('quiz')}
          className="w-full py-3 rounded-full bg-amber-400 text-gray-900 font-semibold hover:bg-amber-300 transition-colors"
        >
          Begin quiz →
        </button>
      </main>
    )
  }

  if (phase === 'quiz' && currentQ) {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex flex-col">
        {/* Battle-style layout */}
        <div className="flex-1 relative flex flex-col">
          {/* Progress */}
          <div className="px-4 pt-4 flex items-center gap-2 text-sm text-gray-400">
            <span>{quizIndex + 1} / {questions.length}</span>
            <div className="flex-1 h-1 bg-gray-700 rounded">
              <div className="h-1 bg-amber-400 rounded transition-all" style={{ width: `${((quizIndex + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          {/* Upper right: kanji (opposing Pokémon position) */}
          <div className="flex justify-end pr-12 pt-8">
            <span className="text-8xl font-bold text-white drop-shadow-lg">{currentQ.kanji}</span>
          </div>

          {/* Lower left: trainer placeholder */}
          <div className="flex justify-start pl-12 pb-4">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-4xl">?</div>
          </div>
        </div>

        {/* Dialogue box */}
        <div className="bg-gray-800 border-t-2 border-white p-4 pb-6">
          <p className="text-white text-base mb-4">{currentQ.prompt}</p>
          {!revealed ? (
            <button
              onClick={handleReveal}
              className="w-full py-3 rounded-lg border border-white text-white hover:bg-gray-700 transition-colors"
            >
              Reveal answer
            </button>
          ) : (
            <>
              <p className="text-amber-400 font-bold text-lg mb-4">→ {currentQ.answer}</p>
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

  // Done phase
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <div className="text-center">
        {saving ? (
          <p className="text-gray-400">Saving cards…</p>
        ) : (
          <>
            <p className="text-5xl mb-4">🎋</p>
            <h2 className="text-2xl font-bold mb-2">Lesson complete</h2>
            <p className="text-gray-400 mb-8">一 has entered your review queue.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 rounded-full bg-amber-400 text-gray-900 font-semibold hover:bg-amber-300 transition-colors"
            >
              Go to dashboard
            </button>
          </>
        )}
      </div>
    </main>
  )
}
