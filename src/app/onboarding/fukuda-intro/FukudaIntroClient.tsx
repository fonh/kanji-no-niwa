'use client'

import { useRouter } from 'next/navigation'

interface Props {
  dialogueText: string
  firstLessonId: string
}

export default function FukudaIntroClient({ dialogueText, firstLessonId }: Props) {
  const router = useRouter()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 border border-gray-700">
        <p className="text-xs text-amber-400 uppercase tracking-widest mb-4">Sensei Fukuda</p>
        {/* Dialogue box styled like a Pokémon game */}
        <div className="border-2 border-white rounded-lg p-6 mb-8 text-lg leading-relaxed">
          {dialogueText}
        </div>
        <button
          onClick={() => router.push(`/lessons/${firstLessonId}`)}
          className="w-full py-3 rounded-full bg-amber-400 text-gray-900 font-semibold hover:bg-amber-300 transition-colors"
        >
          Begin lesson →
        </button>
      </div>
    </main>
  )
}
